"""
URL文档处理服务
将DeepScrape抓取的内容转换为知识库文档并进行向量化处理
"""
import hashlib
import uuid
from datetime import datetime
from typing import Dict, Any, List, Optional
from urllib.parse import urlparse

from loguru import logger
from sqlalchemy.orm import Session

from models.knowledge import KnowledgeDocument, DocumentChunk
from service.dual_chunking_service import DualChunkingService
from service.embedding_service import embedding_service
from service.deepscrape_service import deepscrape_service
from db.database import get_db
from db.repositories.knowledge_repository import KnowledgeRepository
from core.config_optimized import optimized_config_manager


class URLDocumentProcessor:
    """URL文档处理器，负责将URL抓取内容转换为知识库文档"""
    
    def __init__(self):
        self.chunk_service = DualChunkingService()
        # 使用默认的分块配置
        self.chunk_size = 1000
        self.chunk_overlap = 100
        
    def _generate_content_hash(self, content: str) -> str:
        """生成内容哈希值，用于检测URL内容更新"""
        return hashlib.sha256(content.encode('utf-8')).hexdigest()
    
    def _extract_domain_from_url(self, url: str) -> str:
        """从URL提取域名"""
        try:
            parsed = urlparse(url)
            return parsed.netloc
        except Exception:
            return "unknown"
    
    def _clean_and_validate_content(self, content: str) -> str:
        """清理和验证内容"""
        if not content or not content.strip():
            raise ValueError("抓取内容为空")
            
        # 基本内容清理
        content = content.strip()
        
        # 检查内容长度
        if len(content) < 50:
            raise ValueError("抓取内容过短，可能抓取失败")
            
        return content
    
    async def process_url_to_document(
        self, 
        url: str, 
        collection_id: Optional[str] = None,
        folder_id: Optional[str] = None,
        options: Optional[Dict[str, Any]] = None
    ) -> KnowledgeDocument:
        """
        处理URL到知识库文档的完整流程
        1. 使用DeepScrape抓取内容
        2. 创建知识库文档记录
        3. 进行内容分块
        4. 向量化处理
        """
        try:
            logger.info(f"开始处理URL: {url}")
            
            # 1. 使用DeepScrape抓取内容
            async with deepscrape_service as service:
                scrape_result = await service.scrape_single_url(url, options)
            
            if not scrape_result.get('success'):
                raise Exception(f"URL抓取失败: {scrape_result.get('error', '未知错误')}")
            
            # 2. 提取和验证内容
            content = self._clean_and_validate_content(scrape_result.get('content', ''))
            title = scrape_result.get('title', self._extract_domain_from_url(url))
            metadata = scrape_result.get('metadata', {})
            
            # 3. 创建知识库文档记录
            document_id = str(uuid.uuid4())
            content_hash = self._generate_content_hash(content)
            
            # 构建文档元数据
            document_metadata = {
                "source": "url_crawl",
                "original_url": url,
                "domain": self._extract_domain_from_url(url),
                "crawl_time": datetime.utcnow().isoformat(),
                "content_length": len(content),
                **metadata
            }
            
            # 构建抓取元数据
            scrape_metadata = {
                "engine": "deepscrape",
                "crawl_time": datetime.utcnow().isoformat(),
                "response_size": len(content),
                "status": "success",
                "options_used": options or {}
            }
            
            # 创建文档记录
            document = KnowledgeDocument(
                id=document_id,
                title=title,
                filename=f"{title[:100]}.html",  # 生成文件名
                file_type="url",
                file_size=len(content.encode('utf-8')),
                source_url=url,
                scrape_method="deepscrape",
                scrape_metadata=scrape_metadata,
                content_hash=content_hash,
                status="processing",
                collection_id=collection_id,
                folder_id=folder_id,
                document_metadata=document_metadata,
                upload_time=datetime.utcnow(),
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow()
            )
            
            # 4. 保存文档记录到数据库
            async for db in get_db():
                knowledge_repo = KnowledgeRepository(db)
                await knowledge_repo.create_document(document)
                break
            logger.info(f"文档记录已创建: {document_id}")
            
            # 5. 进行内容分块
            await self._process_document_chunks(document, content)
            
            # 6. 更新文档状态为已向量化
            document.status = "vectorized"
            document.updated_at = datetime.utcnow()
            async for db in get_db():
                knowledge_repo = KnowledgeRepository(db)
                await knowledge_repo.update_document(document.id, {
                    "status": "vectorized",
                    "updated_at": datetime.utcnow()
                })
                break
            
            logger.info(f"URL文档处理完成: {url} -> {document_id}")
            return document
            
        except Exception as e:
            logger.error(f"URL文档处理失败: {url}, 错误: {str(e)}")
            
            # 如果文档已创建，更新状态为失败
            if 'document' in locals():
                try:
                    document.status = "failed"
                    document.updated_at = datetime.utcnow()
                    async for db in get_db():
                        knowledge_repo = KnowledgeRepository(db)
                        await knowledge_repo.update_document(document.id, {
                            "status": "failed",
                            "updated_at": datetime.utcnow()
                        })
                        break
                except Exception:
                    pass
            
            raise Exception(f"URL文档处理失败: {str(e)}")
    
    async def _process_document_chunks(self, document: KnowledgeDocument, content: str):
        """处理文档分块和向量化"""
        try:
            logger.info(f"开始处理文档分块: {document.id}")
            
            # 使用DualChunkingService进行双向量分块
            general_chunks, matbert_chunks = await self.chunk_service.create_dual_chunks(
                document_id=document.id,
                content=content,
                config_id=None  # 使用默认配置
            )
            
            logger.info(f"双向量分块完成，通用分块: {len(general_chunks)}, MatBERT分块: {len(matbert_chunks)}")
            
            # 批量向量化处理（使用通用分块）
            await self._vectorize_chunks(document.id, general_chunks)
            
        except Exception as e:
            logger.error(f"文档分块处理失败: {document.id}, 错误: {str(e)}")
            raise
    
    async def _vectorize_chunks(self, document_id: str, chunks_data: List[Dict[str, Any]]):
        """批量向量化分块"""
        try:
            logger.info(f"开始向量化处理: {document_id}, 分块数量: {len(chunks_data)}")
            
            # 准备文本数据
            texts = [chunk['content'] for chunk in chunks_data]
            
            # 获取嵌入模型配置
            general_model = "alibaba/Qwen/Qwen3-Embedding-4B"  # 使用默认通用模型
            domain_model = "alibaba/Qwen/Qwen3-Embedding-4B"   # 暂时使用相同模型
            
            # 生成通用向量
            general_response = await embedding_service.create_embeddings(
                model_path=general_model,
                texts=texts
            )
            
            # 生成领域向量（如果配置了领域模型）
            domain_response = None
            if domain_model and domain_model != general_model:
                try:
                    domain_response = await embedding_service.create_embeddings(
                        model_path=domain_model,
                        texts=texts
                    )
                except Exception as e:
                    logger.warning(f"领域向量生成失败，仅使用通用向量: {str(e)}")
            
            # 创建分块记录
            chunks_to_create = []
            for i, chunk_data in enumerate(chunks_data):
                chunk_id = str(uuid.uuid4())
                
                chunk = DocumentChunk(
                    id=chunk_id,
                    document_id=document_id,
                    content=chunk_data['content'],
                    chunk_index=i,
                    
                    # 向量嵌入
                    general_embedding=general_response.embeddings[i],
                    general_model=general_model,
                    
                    # 领域向量（如果有）
                    domain_embedding=domain_response.embeddings[i] if domain_response else None,
                    domain_model=domain_model if domain_response else None,
                    
                    # 向量化策略
                    vectorization_strategy="dual" if domain_response else "general",
                    
                    # 分块元数据
                    chunk_metadata={
                        "source": "url_crawl",
                        "chunk_method": "intelligent",
                        "original_length": len(chunk_data['content'])
                    },
                    
                    created_at=datetime.utcnow(),
                    updated_at=datetime.utcnow()
                )
                
                chunks_to_create.append(chunk)
            
            # 批量保存分块
            async for db in get_db():
                knowledge_repo = KnowledgeRepository(db)
                await knowledge_repo.create_chunks_batch(chunks_to_create)
                break
            
            logger.info(f"向量化处理完成: {document_id}, 共处理 {len(chunks_to_create)} 个分块")
            
        except Exception as e:
            logger.error(f"向量化处理失败: {document_id}, 错误: {str(e)}")
            raise
    
    async def update_url_document(self, document_id: str) -> bool:
        """更新URL文档内容（检测内容变化）"""
        try:
            # 获取文档记录
            async for db in get_db():
                knowledge_repo = KnowledgeRepository(db)
                document = await knowledge_repo.get_document(document_id)
                break
            if not document or document.file_type != "url":
                return False
            
            # 重新抓取内容
            async with deepscrape_service as service:
                scrape_result = await service.scrape_single_url(
                    document.source_url, 
                    document.scrape_metadata.get('options_used', {})
                )
            
            if not scrape_result.get('success'):
                logger.warning(f"URL内容更新失败: {document.source_url}")
                return False
            
            # 检查内容是否变化
            new_content = scrape_result.get('content', '')
            new_hash = self._generate_content_hash(new_content)
            
            if new_hash == document.content_hash:
                logger.info(f"URL内容无变化: {document.source_url}")
                return True
            
            # 内容有变化，重新处理
            logger.info(f"检测到URL内容变化，重新处理: {document.source_url}")
            
            # 删除旧的分块
            async for db in get_db():
                knowledge_repo = KnowledgeRepository(db)
                await knowledge_repo.delete_document_chunks(document_id)
                break
            
            # 重新处理分块和向量化
            await self._process_document_chunks(document, new_content)
            
            # 更新文档记录
            async for db in get_db():
                knowledge_repo = KnowledgeRepository(db)
                await knowledge_repo.update_document(document_id, {
                    "content_hash": new_hash,
                    "updated_at": datetime.utcnow(),
                    "scrape_metadata": {
                        **document.scrape_metadata,
                        "last_update": datetime.utcnow().isoformat(),
                        "content_changed": True
                    }
                })
                break
            
            return True
            
        except Exception as e:
            logger.error(f"URL文档更新失败: {document_id}, 错误: {str(e)}")
            return False


# 全局实例
url_document_processor = URLDocumentProcessor()