"""
知识库业务服务 - 处理知识库相关的业务逻辑
"""
import os
import uuid
from typing import List, Optional, Dict, Any, BinaryIO
from datetime import datetime
import asyncio
import hashlib
from pathlib import Path
from utils.timezone_utils import get_china_now

from sqlalchemy.ext.asyncio import AsyncSession
from db.database import get_async_session
from core.logger import logger
from core.task_config import task_config
from db.repositories.knowledge_repository import (
    KnowledgeDocumentRepository,
    DocumentChunkRepository,
    VectorConfigRepository,
    ModelConfigRepository,
    RetrievalResultRepository,
    KnowledgeRepository
)
from models.knowledge import KnowledgeDocument, DocumentChunk
from service.embedding_service import EmbeddingService
from service.storage_service import storage_service
from service.embedding_service import embedding_service
from service.hybrid_search_service import hybrid_search_service
from core.config_optimized import optimized_config_manager
from rag.scenario.naive import advanced_chunk, chunk
import re
from rag.parsers.text_parser import TextParser
from rag.parsers.markdown_parser import MarkdownParser
from rag.parsers.pdf_parser import PDFParser
from rag.parsers.docx_parser import DocxParser
from rag.parsers.excel_parser import ExcelParser
from service.chunking_config_service import chunking_config_service
from service.unified_qa_extraction_service import UnifiedQAExtractionService
from sqlalchemy import select
from models.knowledge_collection import KnowledgeCollection

# 导入SSE服务
from api.websocket.document_status_sse import document_sse


class KnowledgeService:
    """知识库管理服务"""
    
    def __init__(self):
        self.embedding_service = EmbeddingService()
        self.storage_service = storage_service

    @staticmethod
    def _sanitize_markdown_content(md: str) -> str:
        """去除Markdown中的base64图片与超长base64块，避免进入向量化。

        规则：
        - 移除形如 ![...](data:image/...;base64,...) 的内联图片
        - 移除 <img src="data:image/...;base64,..."> 的HTML图片
        - 移除裸露的 data:image/...;base64,xxxxx 长文本
        - 粗粒度移除包含典型图片base64头（iVBORw0KGgo、/9j/、R0lGODlh）且长度过大的代码块/行
        """
        if not md:
            return md
        text = md
        # 移除Markdown内联base64图片
        text = re.sub(r"!\[[^\]]*\]\(data:image/[^;]+;base64,[^)]+\)", "", text, flags=re.IGNORECASE)
        # 移除HTML内联base64图片
        text = re.sub(r"<img[^>]+src=\s*\"data:image/[^\"]+\"[^>]*>", "", text, flags=re.IGNORECASE)
        text = re.sub(r"<img[^>]+src=\s*'data:image/[^']+'[^>]*>", "", text, flags=re.IGNORECASE)
        # 移除内联 data: 多媒体（image|video|audio|application 等）
        text = re.sub(r"data:(image|video|audio|application)/[^;]+;base64,[A-Za-z0-9+/=\s]+", "", text, flags=re.IGNORECASE)
        # 移除CSS中的 url(data:...)
        text = re.sub(r"url\(\s*data:[^)]+\)", "", text, flags=re.IGNORECASE)
        # 移除典型图片base64长串（PNG、JPG、GIF）
        patterns = [r"iVBORw0KGgo[A-Za-z0-9+/=]{200,}", r"/9j/[A-Za-z0-9+/=]{200,}", r"R0lGODlh[A-Za-z0-9+/=]{200,}"]
        for p in patterns:
            text = re.sub(p, "", text)
        # 移除包含 base64/data:image 的代码块（三引号/三波浪）
        text = re.sub(r"```[\s\S]*?(?:base64|data:image|iVBORw0KGgo|/9j/|R0lGODlh)[\s\S]*?```", "", text, flags=re.IGNORECASE)
        text = re.sub(r"~~~[\s\S]*?(?:base64|data:image|iVBORw0KGgo|/9j/|R0lGODlh)[\s\S]*?~~~", "", text, flags=re.IGNORECASE)
        # 移除 HTML 多媒体标签
        text = re.sub(r"<\s*(video|audio|source|iframe|embed|object)[^>]*>.*?<\s*/\s*\1\s*>", "", text, flags=re.IGNORECASE)
        text = re.sub(r"<\s*(video|audio|source|iframe|embed|object)[^>]*>", "", text, flags=re.IGNORECASE)
        # 规范化多余空白
        text = re.sub(r"\n{3,}", "\n\n", text)
        return text
    
    async def upload_documents(
        self, 
        files: List[tuple],  # (filename, file_content, content_type)
        metadata: Optional[Dict[str, Any]] = None,
        collection_id: Optional[str] = None
    ) -> List[KnowledgeDocument]:
        """上传文档到知识库"""
        async with get_async_session() as session:
            doc_repo = KnowledgeDocumentRepository(session)
            uploaded_docs = []
            
            for filename, file_content, content_type in files:
                try:
                    # 上传文件到存储服务
                    object_name, file_url, file_size = await storage_service.upload_document(
                        file_data=file_content,
                        filename=filename,
                        content_type=content_type or self._get_file_type(filename),
                        metadata={
                            'original_filename': filename,
                            'document_type': 'knowledge',
                            'uploader': 'system'
                        }
                    )
                    
                    # 创建文档记录
                    document_data = {
                        "title": self._extract_title_from_filename(filename),
                        "filename": filename,
                        "file_type": content_type or self._get_file_type(filename),
                        "file_size": file_size,
                        "status": "uploaded",
                        "collection_id": collection_id,  # 添加Collection上下文支持
                        "tags": metadata.get("tags", []) if metadata else [],
                        "document_metadata": {
                            **(metadata or {}),
                            "collection_info": {
                                "collection_id": collection_id
                            } if collection_id else {},
                            "storage_info": {
                                "object_name": object_name,
                                "file_url": file_url
                            }
                        },
                        "file_path": object_name  # 存储对象名称
                    }
                    
                    document = await doc_repo.create(document_data)
                    uploaded_docs.append(document)
                    
                    logger.info(f"文档上传成功: {filename} -> {document.id}")
                    
                    # 将文档处理任务添加到队列
                    try:
                        from service.simple_queue_service import simple_queue, TaskType
                        task_id = await simple_queue.add_task(
                            task_type=TaskType.DOCUMENT_PROCESSING,
                            file_name=filename,
                            file_size=len(file_content),
                            handler=self._process_document_async,
                            handler_args=(document.id,)
                            # 让队列根据文件大小自动分配优先级
                        )
                        logger.info(f"文档处理任务已添加到队列: {task_id}")
                    except Exception as queue_error:
                        # 如果队列失败，回退到直接处理
                        logger.warning(f"队列添加失败，直接处理: {queue_error}")
                        asyncio.create_task(self._process_document_async(document.id))
                    
                except Exception as e:
                    logger.error(f"上传文档失败 {filename}: {e}")
                    continue
            
            return uploaded_docs
    
    async def process_url_content(
        self,
        document_data: Dict[str, Any],
        collection_id: Optional[str] = None,
        tags: Optional[List[str]] = None,
        description: Optional[str] = None,
        chunking_config_id: Optional[str] = None,
        custom_chunk_size: Optional[int] = None,
        custom_chunk_overlap: Optional[int] = None
    ) -> List[DocumentChunk]:
        """处理URL爬取的内容为知识文档
        
        Args:
            document_data: URL爬取结果数据
                - filename: 文档名称
                - content: Markdown内容
                - source_url: 原始URL
                - original_title: 原始页面标题
                - crawl_metadata: 爬取元数据
                - file_size: 内容大小
                - content_type: 内容类型
            collection_id: 知识库集合ID
            tags: 标签列表
            description: 描述信息
            chunking_config_id: 切分配置ID
            custom_chunk_size: 自定义切分大小
            custom_chunk_overlap: 自定义重叠大小
            
        Returns:
            List[DocumentChunk]: 生成的文档块列表
        """
        async with get_async_session() as session:
            doc_repo = KnowledgeDocumentRepository(session)
            chunk_repo = DocumentChunkRepository(session)
            
            try:
                # 1. 将Markdown内容保存到存储服务
                content_bytes = document_data['content'].encode('utf-8')
                object_name, file_url, file_size = await storage_service.upload_document(
                    file_data=content_bytes,
                    filename=document_data['filename'],
                    content_type='text/markdown',
                    metadata={
                        'original_title': document_data.get('original_title', ''),
                        'source_url': document_data['source_url'],
                        'document_type': 'url_crawled',
                        'crawl_metadata': document_data.get('crawl_metadata', {})
                    }
                )
                
                # 2. 创建知识文档记录
                current_time = get_china_now()
                document_record_data = {
                    "title": document_data.get('original_title') or self._extract_title_from_filename(document_data['filename']),
                    "filename": document_data['filename'],
                    "file_type": document_data.get('content_type', 'text/markdown'),
                    "file_size": file_size,
                    "status": "processing",
                    "collection_id": collection_id,
                    "tags": tags or [],
                    "upload_time": current_time,
                    "created_at": current_time,
                    "updated_at": current_time,
                    "document_metadata": {
                        "source_url": document_data['source_url'],
                        "original_title": document_data.get('original_title', ''),
                        "crawl_metadata": document_data.get('crawl_metadata', {}),
                        "document_type": "url_crawled",
                        "description": description or f"来源URL: {document_data['source_url']}",
                        "collection_info": {
                            "collection_id": collection_id
                        } if collection_id else {},
                        "storage_info": {
                            "object_name": object_name,
                            "file_url": file_url
                        }
                    },
                    "file_path": object_name
                }
                
                document = await doc_repo.create(document_record_data)
                logger.info(f"URL文档记录创建成功: {document.id}")
                
                # 3. 发送SSE状态更新
                await document_sse.broadcast_document_status(
                    session_id="system",  # 系统级任务
                    document_id=document.id,
                    status_data={
                        "status": "processing",
                        "message": "开始处理URL内容",
                        "progress": 10
                    }
                )
                
                # 4. 执行文本分块处理
                chunks = await self._process_url_document_chunks(
                    document=document,
                    content=document_data['content'],
                    chunking_config_id=chunking_config_id,
                    custom_chunk_size=custom_chunk_size,
                    custom_chunk_overlap=custom_chunk_overlap
                )
                
                # 5. 向量化已在分块阶段完成（已写入embedding），将文档状态置为 vectorized，并写入vector_status
                await doc_repo.update(document.id, {
                    "status": "vectorized",
                    "vector_status": {
                        "progress": 100,
                        "chunks": len(chunks),
                        "mode": "url_ingest"
                    },
                    "updated_at": get_china_now()
                })
                
                # 6. 发送完成状态更新（vectorized）
                await document_sse.broadcast_document_status(
                    session_id="system",
                    document_id=document.id,
                    status_data={
                        "status": "vectorized",
                        "message": f"URL入库与向量化完成，生成 {len(chunks)} 个文档块",
                        "progress": 100
                    }
                )
                
                # 7. 若目标知识库开启了自动QA提取，则提交统一QA提取任务（与文件上传保持一致）
                try:
                    if collection_id:
                        # 读取集合配置
                        coll_res = await session.execute(
                            select(KnowledgeCollection).where(KnowledgeCollection.id == collection_id)
                        )
                        coll = coll_res.scalar_one_or_none()
                        if coll and getattr(coll, 'auto_qa_extraction_enabled', False):
                            qa_cfg = None
                            try:
                                if isinstance(coll.qa_extraction_config, dict):
                                    qa_cfg = coll.qa_extraction_config
                            except Exception:
                                qa_cfg = None
                            svc = UnifiedQAExtractionService()
                            task_id = await svc.submit_extraction_task(
                                document_id=document.id,
                                document_title=document.title or document.filename,
                                collection_id=collection_id,
                                priority=5,
                                extraction_config=qa_cfg,
                                auto_create_dataset=True,
                                dataset_naming_pattern=f"{(document.title or 'url_doc')}_qa"
                            )
                            # 回写文档的QA提取字段
                            # 某些环境中 qa_extraction_task_id 为 INTEGER，避免类型不匹配
                            update_payload = {
                                "qa_extraction_status": "pending",
                                "qa_extraction_started_at": get_china_now()
                            }
                            if isinstance(task_id, int):
                                update_payload["qa_extraction_task_id"] = task_id
                            else:
                                # 将字符串任务ID写入 document_metadata 作为兼容字段
                                meta = document.document_metadata or {}
                                meta.setdefault("qa_extraction", {})
                                meta["qa_extraction"]["task_uid"] = str(task_id)
                                update_payload["document_metadata"] = meta
                            await doc_repo.update(document.id, update_payload)
                            logger.info(f"✅ 已提交URL文档的自动QA提取任务: {task_id} (doc={document.id})")
                except Exception as qa_err:
                    logger.warning(f"提交URL文档自动QA任务失败: {qa_err}")

                logger.info(f"URL文档处理完成: {document.id}, 生成 {len(chunks)} 个块")
                return chunks
                
            except Exception as e:
                logger.error(f"URL内容处理失败: {e}")
                # 更新文档状态为失败
                try:
                    await doc_repo.update(document.id, {
                        "status": "failed",
                        "updated_at": get_china_now()
                    })
                    await document_sse.broadcast_document_status(
                        session_id="system",
                        document_id=document.id,
                        status_data={
                            "status": "failed",
                            "message": f"URL内容处理失败: {str(e)}",
                            "progress": 0
                        }
                    )
                except Exception as update_error:
                    logger.error(f"更新失败状态时出错: {update_error}")
                raise
    
    async def get_documents(
        self, 
        skip: int = 0, 
        limit: int = 100,
        status_filter: Optional[str] = None,
        tag_filter: Optional[List[str]] = None,
        collection_id: Optional[str] = None
    ) -> List[KnowledgeDocument]:
        """获取文档列表"""
        async with get_async_session() as session:
            doc_repo = KnowledgeDocumentRepository(session)
            return await doc_repo.get_all(skip, limit, status_filter, tag_filter, collection_id)
    
    async def get_document_by_id(self, document_id: str) -> Optional[KnowledgeDocument]:
        """根据ID获取文档"""
        async with get_async_session() as session:
            doc_repo = KnowledgeDocumentRepository(session)
            return await doc_repo.get_by_id(document_id)
    
    async def update_document(
        self, 
        document_id: str, 
        update_data: Dict[str, Any]
    ) -> Optional[KnowledgeDocument]:
        """更新文档信息"""
        async with get_async_session() as session:
            doc_repo = KnowledgeDocumentRepository(session)
            return await doc_repo.update(document_id, update_data)
    
    async def delete_document(self, document_id: str) -> bool:
        """删除文档"""
        async with get_async_session() as session:
            repo = KnowledgeRepository(session)
            
            # 获取文档信息
            document = await repo.get_document_by_id(document_id)
            if not document:
                return False
            
            # 1. 首先删除文档相关的chunks（解决外键约束问题）
            try:
                await repo.delete_document_chunks(document_id)
                logger.info(f"已删除文档 {document_id} 的所有chunks")
            except Exception as e:
                logger.error(f"删除文档chunks失败 {document_id}: {e}")
                return False
            
            # 2. 删除存储中的文件
            if document.file_path:
                try:
                    # 从元数据中获取桶信息，或使用默认文档桶
                    bucket_name = storage_service.config.documents_bucket
                    await storage_service.delete_file(bucket_name, document.file_path)
                except Exception as e:
                    logger.warning(f"删除存储文件失败 {document.file_path}: {e}")
            
            # 3. 删除ArangoDB中相关的图谱数据
            try:
                await self._cleanup_arangodb_document_data(document_id)
                logger.info(f"已清理文档 {document_id} 在ArangoDB中的图谱数据")
            except Exception as e:
                logger.warning(f"清理文档 {document_id} 的ArangoDB数据失败: {e}")
            
            # 4. 删除PostgreSQL中相关的图谱数据
            try:
                await self._cleanup_postgresql_document_data(document_id)
                logger.info(f"已清理文档 {document_id} 在PostgreSQL中的图谱数据")
            except Exception as e:
                logger.warning(f"清理文档 {document_id} 的PostgreSQL图谱数据失败: {e}")
            
            # 5. 最后删除文档记录
            return await repo.delete(document_id)
    
    async def _process_url_document_chunks(
        self,
        document: KnowledgeDocument,
        content: str,
        chunking_config_id: Optional[str] = None,
        custom_chunk_size: Optional[int] = None,
        custom_chunk_overlap: Optional[int] = None
    ) -> List[DocumentChunk]:
        """处理URL文档的分块
        
        Args:
            document: 文档记录
            content: Markdown内容
            chunking_config_id: 切分配置ID
            custom_chunk_size: 自定义切分大小
            custom_chunk_overlap: 自定义重叠大小
            
        Returns:
            List[DocumentChunk]: 生成的文档块列表
        """
        async with get_async_session() as session:
            chunk_repo = DocumentChunkRepository(session)
            
            try:
                logger.info(f"开始处理URL文档分块: {document.id}")
                
                # 1. 获取或使用切分配置
                if chunking_config_id:
                    chunking_config = await chunking_config_service.get_config_by_id(chunking_config_id)
                    if not chunking_config:
                        logger.warning(f"未找到切分配置 {chunking_config_id}，使用默认配置")
                        chunking_config = await chunking_config_service.get_default_config()
                else:
                    chunking_config = await chunking_config_service.get_default_config()

                # 使用自定义参数覆盖配置（提供兜底默认值，避免None导致异常）
                default_chunk_size = 150
                default_chunk_overlap = 20
                chunk_size = custom_chunk_size or (getattr(chunking_config, 'chunk_token_num', None) or default_chunk_size)
                chunk_overlap = custom_chunk_overlap or (getattr(chunking_config, 'chunk_overlap', None) or default_chunk_overlap)
                
                logger.info(f"使用切分配置: size={chunk_size}, overlap={chunk_overlap}")
                
                # 2. 处理内容：此处已有Markdown正文，直接使用原文进行分块，避免解析器按文件路径处理
                parsed_content = content or ''
                # 过滤图片base64等噪声，减少无效向量化
                parsed_content = self._sanitize_markdown_content(parsed_content)
                if not str(parsed_content).strip():
                    raise ValueError('URL内容为空，无法分块')
                
                # 3. 执行分块（将正文写入临时文件，复用 advanced_chunk(filepath, ...) 流程）
                import tempfile
                tmp_path = None
                try:
                    # 优先用 .md 以获得更好的解析效果
                    with tempfile.NamedTemporaryFile(mode='w', suffix='.md', delete=False, encoding='utf-8') as tmp:
                        tmp.write(parsed_content)
                        tmp_path = tmp.name

                    # 组装解析配置，尽量贴合 chunking_config 的结构
                    parser_config = {
                        "chunk_token_num": int(chunk_size) if chunk_size else 150,
                        "max_token_num": max(int(chunk_size * 1.2), int(chunk_size) + 1) if chunk_size else 256,
                        "delimiter": "!?。！？",
                        "chunk_overlap": int(chunk_overlap) if chunk_overlap else 0,
                    }

                    # 使用 chunk() 封装（其内部对 MarkdownParser 具兼容的回退实现）
                    chunks_blocks = chunk(
                        tmp_path,
                        parser_config=parser_config,
                    )

                    # 将 DocumentBlock 列表转为纯文本列表
                    chunks = [getattr(b, 'content', '') for b in chunks_blocks if getattr(b, 'content', '')]
                finally:
                    # 清理临时文件
                    if tmp_path:
                        try:
                            import os as _os
                            _os.unlink(tmp_path)
                        except Exception:
                            pass
                
                logger.info(f"文本分块完成，生成 {len(chunks)} 个块")
                
                # 4. 为每个块生成向量嵌入（通过统一Embedding模型网关）
                chunk_records = []
                chunk_data_list = []
                # 先解析集合默认Embedding模型（若无则用网关默认）
                try:
                    coll_id = getattr(document, 'collection_id', None)
                except Exception:
                    coll_id = None
                from service.embedding_model_manager import get_model_for_collection
                model_cfg = await get_model_for_collection(coll_id)
                if not model_cfg:
                    raise ValueError("未配置可用的Embedding模型（请在网关启用或在集合中设置）")
                model_id, provider = model_cfg
                
                for i, chunk_text in enumerate(chunks):
                    try:
                        # 生成嵌入向量（单条调用）
                        emb_resp = await embedding_service.create_embeddings(
                            model_path=f"{provider}/{model_id}",
                            texts=[chunk_text]
                        )
                        embedding = emb_resp.embeddings[0] if emb_resp and emb_resp.embeddings else None
                        if embedding is None:
                            raise RuntimeError("未获得有效向量")
                        
                        # 创建文档块记录
                        chunk_data = {
                            "document_id": document.id,
                            "chunk_index": i,
                            "content": chunk_text,
                            "embedding": embedding,
                            "chunk_metadata": {
                                "source_url": document.document_metadata.get("source_url"),
                                "chunk_size": len(chunk_text),
                                "token_count": len(chunk_text.split()),
                                "chunk_type": "url_content",
                                "processing_config": {
                                    "chunking_config_id": chunking_config_id,
                                    "chunk_size": chunk_size,
                                    "chunk_overlap": chunk_overlap
                                }
                            }
                        }
                        
                        # 累积，统一批量写入
                        chunk_data_list.append(chunk_data)
                        
                        # 发送进度更新
                        progress = 20 + (i / len(chunks)) * 70  # 20-90%的进度
                        await document_sse.broadcast_document_status(
                            session_id="system",
                            document_id=document.id,
                            status_data={
                                "status": "processing",
                                "message": f"处理文档块 {i+1}/{len(chunks)}",
                                "progress": int(progress)
                            }
                        )
                        
                    except Exception as chunk_error:
                        logger.error(f"处理文档块 {i} 失败: {chunk_error}")
                        continue
                # 批量入库
                if chunk_data_list:
                    chunk_records = await chunk_repo.create_chunks(chunk_data_list)
                logger.info(f"URL文档分块处理完成: {document.id}, 成功生成 {len(chunk_records)} 个块")
                return chunk_records
                
            except Exception as e:
                logger.error(f"URL文档分块处理异常: {e}")
                raise
    
    async def batch_delete_documents(self, document_ids: List[str]) -> Dict[str, Any]:
        """
        批量删除文档
        
        Args:
            document_ids: 文档ID列表
            
        Returns:
            Dict[str, Any]: 删除结果统计
        """
        if not document_ids:
            return {"success": [], "failed": [], "stats": {"arangodb_cleanup": {}, "postgresql_cleanup": {}}}
        
        success = []
        failed = []
        total_arangodb_stats = {"nodes_deleted": 0, "edges_deleted": 0}
        total_postgresql_stats = {"nodes_deleted": 0, "edges_deleted": 0}
        
        async with get_async_session() as session:
            repo = KnowledgeRepository(session)
            
            for document_id in document_ids:
                try:
                    # 获取文档信息
                    document = await repo.get_document_by_id(document_id)
                    if not document:
                        failed.append({"id": document_id, "error": "文档不存在"})
                        continue
                    
                    # 1. 首先删除文档相关的chunks（解决外键约束问题）
                    try:
                        await repo.delete_document_chunks(document_id)
                        logger.info(f"已删除文档 {document_id} 的所有chunks")
                    except Exception as e:
                        failed.append({"id": document_id, "error": f"删除文档chunks失败: {str(e)}"})
                        logger.error(f"删除文档chunks失败 {document_id}: {e}")
                        continue
                    
                    # 2. 删除存储中的文件
                    if document.file_path:
                        try:
                            bucket_name = storage_service.config.documents_bucket
                            await storage_service.delete_file(bucket_name, document.file_path)
                        except Exception as e:
                            logger.warning(f"删除存储文件失败 {document.file_path}: {e}")
                    
                    # 3. 删除ArangoDB中相关的图谱数据
                    try:
                        arangodb_stats = await self._cleanup_arangodb_document_data(document_id)
                        total_arangodb_stats["nodes_deleted"] += arangodb_stats["nodes_deleted"]
                        total_arangodb_stats["edges_deleted"] += arangodb_stats["edges_deleted"]
                    except Exception as e:
                        logger.warning(f"清理文档 {document_id} 的ArangoDB数据失败: {e}")
                    
                    # 4. 删除PostgreSQL中相关的图谱数据
                    try:
                        postgresql_stats = await self._cleanup_postgresql_document_data(document_id)
                        total_postgresql_stats["nodes_deleted"] += postgresql_stats["nodes_deleted"]
                        total_postgresql_stats["edges_deleted"] += postgresql_stats["edges_deleted"]
                    except Exception as e:
                        logger.warning(f"清理文档 {document_id} 的PostgreSQL图谱数据失败: {e}")
                    
                    # 5. 最后删除文档记录
                    if await repo.delete(document_id):
                        success.append(document_id)
                        logger.info(f"成功删除文档: {document_id}")
                    else:
                        failed.append({"id": document_id, "error": "删除数据库记录失败"})
                        
                except Exception as e:
                    failed.append({"id": document_id, "error": str(e)})
                    logger.error(f"删除文档失败 {document_id}: {e}")
        
        result = {
            "success": success,
            "failed": failed,
            "stats": {
                "total_processed": len(document_ids),
                "success_count": len(success),
                "failed_count": len(failed),
                "arangodb_cleanup": total_arangodb_stats,
                "postgresql_cleanup": total_postgresql_stats
            }
        }
        
        logger.info(f"批量删除完成: 成功={len(success)}, 失败={len(failed)}, ArangoDB清理={total_arangodb_stats}, PostgreSQL清理={total_postgresql_stats}")
        return result
    
    async def vectorize_documents(
        self, 
        document_ids: List[str], 
        config_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """向量化文档"""
        async with get_async_session() as session:
            doc_repo = KnowledgeDocumentRepository(session)
            chunk_repo = DocumentChunkRepository(session)
            config_repo = VectorConfigRepository(session)
            
            # 获取向量配置
            if config_id:
                config = await config_repo.get_by_id(config_id)
            else:
                config = await config_repo.get_default()
            
            if not config:
                raise ValueError("未找到向量配置")
            
            results = {"success": [], "failed": []}
            
            for doc_id in document_ids:
                try:
                    # 更新文档状态
                    await doc_repo.update(doc_id, {"status": "processing"})
                    
                    # 处理文档分块
                    chunks = await self._chunk_document(doc_id, config)
                    if chunks:
                        await chunk_repo.create_chunks(chunks)
                    
                    # 生成向量嵌入
                    await self._generate_embeddings(doc_id, config)
                    
                    # 更新文档状态
                    vector_status = {
                        "progress": 100,
                        "model": config.model,
                        "chunks": len(chunks)
                    }
                    await doc_repo.update(doc_id, {
                        "status": "vectorized",
                        "vector_status": vector_status
                    })
                    
                    results["success"].append(doc_id)
                    logger.info(f"文档向量化成功: {doc_id}")
                    
                except Exception as e:
                    await doc_repo.update(doc_id, {"status": "failed"})
                    results["failed"].append({"document_id": doc_id, "error": str(e)})
                    logger.error(f"文档向量化失败 {doc_id}: {e}")
            
            return results
    
    async def search_documents(self, query: str, limit: int = 50) -> List[KnowledgeDocument]:
        """搜索文档"""
        async with get_async_session() as session:
            doc_repo = KnowledgeDocumentRepository(session)
            return await doc_repo.search_by_title(query, limit)
    
    async def test_retrieval(
        self, 
        query: str, 
        top_k: int = 10,
        threshold: Optional[float] = None,
        use_rerank: bool = False,
        data_source: str = 'all',
        enable_translation: bool = True
    ) -> List[Dict[str, Any]]:
        """测试检索功能 - 支持数据源切换和翻译检索"""
        # 导入翻译上下文
        try:
            from service.translation_context import TranslationContext
            # 根据enable_translation参数决定是否使用翻译
            if enable_translation:
                return await self._execute_test_retrieval(query, top_k, threshold, use_rerank, data_source, enable_translation)
            else:
                # 禁用翻译模式
                with TranslationContext.test_mode():
                    return await self._execute_test_retrieval(query, top_k, threshold, use_rerank, data_source, enable_translation)
        except ImportError:
            # 如果没有翻译上下文，直接执行
            return await self._execute_test_retrieval(query, top_k, threshold, use_rerank, data_source, enable_translation)
    
    async def _execute_test_retrieval(
        self, 
        query: str, 
        top_k: int = 10,
        threshold: Optional[float] = None,
        use_rerank: bool = False,
        data_source: str = 'all',
        enable_translation: bool = True
    ) -> List[Dict[str, Any]]:
        """执行测试检索的具体逻辑"""
        try:
            logger.info(f"开始检索测试: query='{query}', top_k={top_k}, threshold={threshold}, "
                       f"use_rerank={use_rerank}, data_source='{data_source}', enable_translation={enable_translation}")
            
            formatted_doc_results = []
            qa_results = []
            
            # 1. 根据data_source参数决定检索范围
            if data_source in ['all', 'documents']:
                # 文档知识库检索
                doc_top_k = top_k if data_source == 'documents' else top_k // 2
                doc_results = await self.hybrid_search(
                    query=query,
                    top_k=doc_top_k,
                    filters=None,
                    boost_domain=True,  # 启用领域增强
                    use_rerank=use_rerank
                )
                
                # 转换文档结果格式，添加source_type标记
                for result in doc_results:
                    formatted_result = {
                        "id": result.get("id", ""),
                        "title": result.get("title", ""),
                        "content": result.get("content", ""),
                        "score": result.get("score", 0.0),
                        "source_type": "document",
                        "metadata": result.get("metadata", {}),
                        "highlights": result.get("highlights", [])
                    }
                    # 保留原有的scores信息
                    if "scores" in result:
                        formatted_result["scores"] = result["scores"]
                    formatted_doc_results.append(formatted_result)
                
                logger.info(f"文档检索完成，返回 {len(formatted_doc_results)} 个结果")
            
            if data_source in ['all', 'qa']:
                # QA数据集检索
                qa_top_k = top_k if data_source == 'qa' else top_k // 2
                qa_results = await self._search_qa_dataset(
                    query=query,
                    top_k=qa_top_k,
                    threshold=0.2  # QA检索使用较低阈值
                )
                
                logger.info(f"QA数据集检索完成，返回 {len(qa_results)} 个结果")
            
            # 2. 合并结果
            combined_results = formatted_doc_results + qa_results
            
            # 3. 应用阈值过滤（如果指定）
            if threshold is not None:
                filtered_results = []
                for result in combined_results:
                    score = result.get('score', 0.0)
                    if score >= threshold:
                        filtered_results.append(result)
                combined_results = filtered_results
                logger.info(f"应用阈值 {threshold} 后，保留 {len(combined_results)} 个结果")
            
            # 4. 按分数排序并限制结果数量
            combined_results.sort(key=lambda x: x.get("score", 0), reverse=True)
            final_results = combined_results[:top_k]
            
            logger.info(f"检索测试完成，数据源: {data_source}, 翻译: {enable_translation}, "
                       f"返回 {len(final_results)} 个结果（文档: {len(formatted_doc_results)}, QA: {len(qa_results)}）")
            return final_results
            
        except Exception as e:
            logger.error(f"检索测试失败: {e}")
            # 如果检索失败，返回空结果而不是抛出异常
            return []
    
    async def get_statistics(self) -> Dict[str, Any]:
        """获取知识库统计信息"""
        async with get_async_session() as session:
            doc_repo = KnowledgeDocumentRepository(session)
            return await doc_repo.get_statistics()
    
    async def export_documents(
        self, 
        format_type: str = "json",
        filters: Optional[Dict[str, Any]] = None
    ) -> bytes:
        """导出文档数据"""
        documents = await self.get_documents()
        
        if format_type == "json":
            import json
            data = [
                {
                    "id": doc.id,
                    "title": doc.title,
                    "filename": doc.filename,
                    "file_type": doc.file_type,
                    "status": doc.status,
                    "tags": doc.tags,
                    "metadata": doc.document_metadata,
                    "upload_time": doc.upload_time.isoformat() if doc.upload_time else None
                }
                for doc in documents
            ]
            return json.dumps(data, ensure_ascii=False, indent=2).encode("utf-8")
        
        elif format_type == "csv":
            import csv
            import io
            output = io.StringIO()
            writer = csv.writer(output)
            
            # 写入表头
            writer.writerow(["ID", "Title", "Filename", "Type", "Status", "Upload Time"])
            
            # 写入数据
            for doc in documents:
                writer.writerow([
                    doc.id,
                    doc.title,
                    doc.filename,
                    doc.file_type,
                    doc.status,
                    doc.upload_time.isoformat() if doc.upload_time else ""
                ])
            
            return output.getvalue().encode("utf-8")
        
        else:
            raise ValueError(f"不支持的导出格式: {format_type}")
    
    # 私有方法
    
    async def get_document_content(self, document_id: str) -> Optional[bytes]:
        """获取文档内容"""
        async with get_async_session() as session:
            doc_repo = KnowledgeDocumentRepository(session)
            document = await doc_repo.get_by_id(document_id)
            
            if not document or not document.file_path:
                return None
            
            # 从存储服务下载文件内容
            bucket_name = storage_service.config.documents_bucket
            return await storage_service.get_file(bucket_name, document.file_path)
    
    def _extract_title_from_filename(self, filename: str) -> str:
        """从文件名提取标题"""
        return Path(filename).stem
    
    def _get_file_type(self, filename: str) -> str:
        """根据文件扩展名判断文件类型"""
        ext = Path(filename).suffix.lower()
        type_mapping = {
            ".pdf": "application/pdf",
            ".doc": "application/msword",
            ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            ".txt": "text/plain",
            ".md": "text/markdown",
            ".json": "application/json"
        }
        return type_mapping.get(ext, "application/octet-stream")
    
    async def _process_document_async(self, document_id: str):
        """异步处理文档（提取文本等）"""
        try:
            logger.info(f"开始处理文档: {document_id}")
            
            async with get_async_session() as session:
                doc_repo = KnowledgeDocumentRepository(session)
                await doc_repo.update(document_id, {"status": "processing"})
            
            # 调用内容提取和向量化
            await self.extract_and_vectorize_document(document_id)
            
            logger.info(f"文档处理完成: {document_id}")
            
        except Exception as e:
            logger.error(f"文档处理失败 {document_id}: {e}")
            async with get_async_session() as session:
                doc_repo = KnowledgeDocumentRepository(session)
                await doc_repo.update(document_id, {"status": "failed"})
    
    async def extract_and_vectorize_document(self, document_id: str, file_path: str = None, chunking_config_id: Optional[str] = None, config: Optional[Dict[str, Any]] = None, task_id: Optional[str] = None, session_id: Optional[str] = None, collection_id: Optional[str] = None):
        """提取文档内容并进行向量化"""
        # 导入增强任务管理器 - 用于SSE推送
        enhanced_task_manager = None
        if session_id:
            try:
                from service.enhanced_task_manager import enhanced_task_manager as etm
                enhanced_task_manager = etm
                logger.info(f"📡 成功导入增强任务管理器，会话ID: {session_id}")
            except ImportError as e:
                logger.warning(f"无法导入增强任务管理器，将跳过SSE推送: {e}")
        
        # 导入任务管理器
        task_manager = None
        if task_id:
            from service.task_manager import vectorization_task_manager
            task_manager = vectorization_task_manager
        
        async def check_cancellation():
            """检查任务是否被取消（本地TaskManager + Redis标记）"""
            if task_manager and task_id and task_manager.is_cancelled(task_id):
                raise asyncio.CancelledError("向量化任务被取消")
            # Redis 取消标记（非侵入，失败忽略）
            if task_id:
                try:
                    from service.redis_support import is_task_cancelled as _redis_task_cancelled
                    if await _redis_task_cancelled(task_id):
                        raise asyncio.CancelledError("向量化任务被取消(来自Redis)")
                except Exception:
                    pass
        
        def update_progress(progress: int, message: str):
            """更新任务进度"""
            # 原有task_manager进度更新
            if task_manager and task_id:
                task_manager.update_progress(task_id, progress, message)
            
            # 通过增强任务管理器推送SSE消息
            if enhanced_task_manager and session_id:
                try:
                    logger.info(f"准备推送SSE进度: session_id={session_id}, document_id={document_id}, progress={progress}%, stage={message}")
                    # 异步推送SSE进度更新
                    asyncio.create_task(enhanced_task_manager._push_sse_progress(
                        session_id=session_id,
                        document_id=document_id,
                        progress=progress,
                        stage=message,
                        detail=f"文档处理进度: {progress}%",
                        collection_id=collection_id
                    ))
                    logger.info(f"SSE进度推送任务已创建")
                except Exception as e:
                    logger.error(f"推送SSE进度更新失败: {e}")
            else:
                logger.warning(f"无法推送SSE: enhanced_task_manager={enhanced_task_manager is not None}, session_id={session_id}")
        
        try:
            async with get_async_session() as session:
                doc_repo = KnowledgeDocumentRepository(session)
                
                # 检查取消状态
                await check_cancellation()
                
                # 获取文档信息
                document = await doc_repo.get_by_id(document_id)
                if not document:
                    raise ValueError(f"文档不存在: {document_id}")
                
                # 提取切分参数 - 优先从config参数，然后从文档元数据
                custom_chunk_params = None
                used_config_id = chunking_config_id
                
                # 1. 首先检查传入的config参数
                if config:
                    logger.info(f"从config参数提取配置: {config}")
                    
                    # 检查是否有自定义参数 - 同时支持chunkSize和chunk_size
                    chunk_size = config.get('chunkSize') or config.get('chunk_size')
                    chunk_overlap = config.get('chunkOverlap') or config.get('chunk_overlap')
                    
                    if config.get('isCustom') or (chunk_size and chunk_overlap):
                        custom_chunk_params = {
                            "chunk_size": chunk_size,
                            "overlap": chunk_overlap
                        }
                        logger.info(f"文档 {document_id} 使用传入的自定义切分参数: {custom_chunk_params}")
                    elif config.get('configId'):
                        used_config_id = config.get('configId')
                        logger.info(f"文档 {document_id} 使用传入的配置ID: {used_config_id}")
                
                # 2. 如果没有从config获取到，则从文档元数据中提取
                if custom_chunk_params is None and document.document_metadata:
                    processing_config = document.document_metadata.get("processing_config", {})
                    custom_chunk_size = processing_config.get("custom_chunk_size")
                    custom_chunk_overlap = processing_config.get("custom_chunk_overlap")
                    
                    if custom_chunk_size is not None and custom_chunk_overlap is not None:
                        custom_chunk_params = {
                            "chunk_size": custom_chunk_size,
                            "overlap": custom_chunk_overlap
                        }
                        logger.info(f"文档 {document_id} 使用元数据中的自定义切分参数: {custom_chunk_params}")
                    
                    # 也检查元数据中的配置ID
                    if used_config_id is None:
                        used_config_id = processing_config.get("chunking_config_id")
                        if used_config_id:
                            logger.info(f"文档 {document_id} 使用元数据中的配置ID: {used_config_id}")
                # 3. 如果仍未确定配置ID，且文档或参数中有集合ID，则使用集合的默认切分配置
                if used_config_id is None:
                    coll_id = collection_id or getattr(document, 'collection_id', None)
                    if coll_id:
                        try:
                            from models.knowledge_collection import KnowledgeCollection
                            from sqlalchemy import select
                            result = await session.execute(
                                select(KnowledgeCollection).where(KnowledgeCollection.id == coll_id)
                            )
                            coll = result.scalar_one_or_none()
                            if coll and getattr(coll, 'default_chunking_config_id', None):
                                used_config_id = coll.default_chunking_config_id
                                logger.info(f"文档 {document_id} 使用集合默认切分配置ID: {used_config_id}")
                            else:
                                logger.info(f"集合 {coll_id} 无默认切分配置，使用全局默认")
                        except Exception as e:
                            logger.warning(f"读取集合默认切分配置失败: {e}")

                # 更新状态为处理中，并初始化进度
                await self._update_document_progress(doc_repo, document_id, "processing", 10, "开始处理文档")
                update_progress(10, "开始处理文档")
                
                # 检查取消状态
                await check_cancellation()
                
                # 1. 提取文档内容（使用高级解析器）
                content = await self._extract_document_content_with_parser(file_path or document.file_path)
                if not content:
                    raise ValueError("无法提取文档内容")
                
                await self._update_document_progress(doc_repo, document_id, "processing", 30, "文档内容提取完成")
                update_progress(30, "文档内容提取完成")
                logger.info(f"文档内容提取成功: {document_id}, 内容长度: {len(content)}")
                
                # 检查取消状态
                await check_cancellation()
                
                # 2. 进行文档分块，传递自定义参数
                chunks = await self._chunk_document_content(document_id, content, config_id=used_config_id, custom_params=custom_chunk_params)
                chunks_info = {
                    "total_chunks": len(chunks),
                    "chunks_completed": 0,
                    "current_phase": "chunking"
                }
                await self._update_document_progress(doc_repo, document_id, "processing", 50, f"文档分块完成，共{len(chunks)}个分块", chunks_info)
                update_progress(50, f"文档分块完成，共{len(chunks)}个分块")
                logger.info(f"文档分块完成: {document_id}, 分块数量: {len(chunks)}")
                
                # 3. 保存分块数据到PostgreSQL数据库
                chunk_repo = DocumentChunkRepository(session)
                
                # 为每个分块生成UUID并准备数据
                chunk_records = []
                for i, chunk in enumerate(chunks):
                    chunk_record = {
                        "id": str(uuid.uuid4()),
                        "document_id": chunk.get('document_id', document_id),
                        "content": chunk['content'],
                        "chunk_index": chunk.get('chunk_index', i),
                        "chunk_metadata": chunk.get('metadata', {})
                    }
                    chunk_records.append(chunk_record)
                    
                # 批量保存分块到数据库
                await chunk_repo.create_chunks(chunk_records)
                logger.info(f"分块数据保存到数据库: {document_id}, 共{len(chunk_records)}个分块")
                
                # 更新进度
                await self._update_document_progress(doc_repo, document_id, "processing", 60, "分块数据保存完成")
                update_progress(60, "分块数据保存完成")
                
                # 检查取消状态
                check_cancellation()
                
                # 4. 使用通用向量服务进行向量化
                vector_results = []
                if embedding_service:
                    # 提取分块文本
                    chunk_texts = [chunk['content'] for chunk in chunks]
                    await self._update_document_progress(doc_repo, document_id, "processing", 70, "开始向量化处理")
                    update_progress(70, "开始向量化处理")
                    
                    # 分批处理向量化，实时更新进度
                    vector_results = await self._vectorize_chunks_with_progress(
                        doc_repo, document_id, chunk_texts
                    )
                    logger.info(f"通用向量化完成: {document_id}, 生成向量: {len(vector_results)} 个")
                    
                    # 检查取消状态
                    await check_cancellation()
                    
                # 5. 将向量保存到Elasticsearch（仅当已生成向量时）
                if vector_results:
                    await self._update_document_progress(doc_repo, document_id, "processing", 85, "保存向量到Elasticsearch")
                    update_progress(85, "保存向量到Elasticsearch")

                    # 获取已保存的分块记录
                    saved_chunks = await chunk_repo.get_chunks_by_document(document_id)

                    # 保存通用向量到Elasticsearch
                    for chunk_record, vector_result in zip(saved_chunks, vector_results):
                        try:
                            await self._save_vectors_to_es(
                                chunk=chunk_record,
                                vector_result=vector_result,
                                document_id=document_id
                            )
                        except Exception as e:
                            logger.error(f"保存向量到ES失败 {chunk_record.id}: {e}")
                            continue

                    # 更新分块的向量状态
                    for chunk_record, vector_result in zip(saved_chunks, vector_results):
                        try:
                            await chunk_repo.update_chunk_embeddings(
                                chunk_record.id,
                                vector_result['general_vector'],
                                vector_result['general_model'],
                                "general"
                            )
                        except Exception as e:
                            logger.error(f"更新分块向量状态失败 {chunk_record.id}: {e}")
                            continue

                    logger.info(f"向量数据保存完成: {document_id}")
                    # 保存完成后再次检查是否已被取消（避免完成后继续后续步骤）
                    await check_cancellation()

                # 5.5 基于场景的元数据提取（不影响主流程，失败时仅记录日志）
                try:
                    # 确定模板类型：优先使用文档所属Collection的metadata_template
                    template_type = 'general'
                    if getattr(document, 'collection_id', None):
                        from models.knowledge_collection import KnowledgeCollection
                        from sqlalchemy import select
                        result = await session.execute(
                            select(KnowledgeCollection).where(KnowledgeCollection.id == document.collection_id)
                        )
                        collection_row = result.scalar_one_or_none()
                        if collection_row and getattr(collection_row, 'metadata_template', None):
                            template_type = collection_row.metadata_template or 'general'

                    # 获取系统默认模板
                    from service.knowledge_collection.template_service import MetadataTemplateService
                    template_service = MetadataTemplateService(session)
                    template = await template_service.get_template_by_type(template_type)

                    if template:
                        from service.metadata_extraction.extraction_service import MetadataExtractionService
                        extraction_service = MetadataExtractionService()
                        extraction_result = await extraction_service.extract_metadata(
                            document_id=document_id,
                            content=content,
                            filename=document.filename or document.title,
                            template=template,
                            config={}
                        )

                        # 组装提取日志
                        extraction_log = {
                            'template_type': template_type,
                            'template_id': template.id,
                            'success': extraction_result.success,
                            'confidence_score': getattr(extraction_result, 'confidence_score', None),
                            'warnings': getattr(extraction_result, 'warnings', []) or [],
                            'errors': getattr(extraction_result, 'errors', []) or []
                        }

                        await doc_repo.update(document_id, {
                            'metadata_template_id': template.id,
                            'structured_metadata': extraction_result.extracted_metadata or {},
                            'metadata_extraction_status': 'completed' if extraction_result.success else 'failed',
                            'metadata_extraction_log': extraction_log
                        })
                        logger.info(f"场景化元数据提取完成: {document_id}, 模板={template_type}, 成功={extraction_result.success}")
                    else:
                        logger.warning(f"未找到系统默认模板: {template_type}，跳过元数据提取")
                except Exception as meta_err:
                    logger.warning(f"元数据提取流程异常（已忽略）：{meta_err}")

                # 最后检查取消状态
                await check_cancellation()
                
                # 6. 更新文档状态为已向量化
                await self._update_document_progress(doc_repo, document_id, "vectorized", 100, "文档处理完成")
                update_progress(100, "文档处理完成")
                
                # 构建向量化配置信息
                vector_config_info = None
                try:
                    from service.chunking_config_service import chunking_config_service
                    config = None
                    
                    if chunking_config_id:
                        # 使用指定的配置
                        config = await chunking_config_service.get_config_by_id(chunking_config_id)
                    else:
                        # 使用默认配置
                        config = await chunking_config_service.get_default_config()
                    
                    if config:
                        vector_config_info = {
                            "chunkSize": config.chunk_token_num,
                            "chunkOverlap": config.chunk_overlap,
                            "chunkingStrategy": config.strategy,
                            "useDefault": config.is_default,
                            "configId": config.id,
                            "configName": config.name,
                            "isCustom": not config.is_default
                        }
                except Exception as e:
                    logger.warning(f"获取切分配置信息失败: {e}")
                    # 如果无法获取配置，使用硬编码的默认值
                    vector_config_info = {
                        "chunkSize": 800,
                        "chunkOverlap": 100,
                        "chunkingStrategy": "semantic",
                        "useDefault": True,
                        "configId": "default",
                        "configName": "默认配置",
                        "isCustom": False
                    }
                
                # 更新文档元数据
                updated_metadata = {
                    **(document.document_metadata or {}),
                    "processing_info": {
                        "content_length": len(content),
                        "chunks_count": len(chunks),
                        "vectorized_at": get_china_now().isoformat()
                    }
                }
                
                # 如果有向量化配置信息，保存到metadata中
                if vector_config_info:
                    updated_metadata["vector_config"] = vector_config_info
                
                await doc_repo.update(document_id, {
                    "status": "vectorized",
                    "document_metadata": updated_metadata
                })
                
                # 发送最终完成通知
                try:
                    if enhanced_task_manager:
                        await enhanced_task_manager.send_sse_update(
                            session_id=session_id,
                            status="completed",
                            progress=100,
                            message="文档处理完成",
                            document_id=document_id,
                            document_status="vectorized",
                            collection_id=collection_id  # 添加collection_id
                        )
                except Exception as sse_error:
                    logger.warning(f"📡 发送完成通知失败: {sse_error}")
                
                logger.info(f"文档处理完成: {document_id}")

                # 7.（可选）HiRAG 增量更新：当集合启用HiRAG且已构建时，插入当前文档内容以更新社区与图谱（异步，不阻塞）
                try:
                    if getattr(document, 'collection_id', None) and content:
                        from sqlalchemy import text
                        cfg_res = await session.execute(
                            text("SELECT config FROM knowledge_collections WHERE id=:cid LIMIT 1"),
                            {"cid": document.collection_id},
                        )
                        row = cfg_res.first()
                        cfg = row[0] if row else {}
                        mode = (((cfg or {}).get('retrieval') or {}).get('mode') or 'hybrid').lower() if isinstance(cfg, dict) else 'hybrid'
                        hirag_status = ((cfg or {}).get('hirag') or {}).get('status') if isinstance(cfg, dict) else None
                        if mode == 'hirag' and (hirag_status in ('ready', None)):
                            try:
                                from service.hirag_agno_integration import HiRAGTools
                                tools = HiRAGTools()
                                asyncio.create_task(tools.update_with_texts(str(document.collection_id), [content]))
                            except Exception as ee:
                                logger.warning(f"HiRAG 增量更新未触发（工具不可用）: {ee}")
                except Exception as e:
                    logger.warning(f"HiRAG 增量更新跳过：{e}")
                
        except asyncio.CancelledError:
            logger.info(f"文档向量化被取消: {document_id}")
            async with get_async_session() as session:
                doc_repo = KnowledgeDocumentRepository(session)
                await doc_repo.update(document_id, {
                    "status": "cancelled",
                    "vector_status": {"error": "任务被取消"}
                })
            raise

    async def extract_metadata_for_document(self, document_id: str) -> Dict[str, Any]:
        """对单个文档执行场景化元数据提取（不重新切分/向量化）。"""
        try:
            async with get_async_session() as session:
                doc_repo = KnowledgeDocumentRepository(session)
                document = await doc_repo.get_by_id(document_id)
                if not document:
                    raise ValueError(f"文档不存在: {document_id}")

                # 提取文档内容
                if not document.file_path:
                    raise ValueError("文档缺少文件路径")
                content = await self._extract_document_content_with_parser(document.file_path)
                if not content:
                    raise ValueError("无法提取文档内容")

                # 确定模板类型
                template_type = 'general'
                if getattr(document, 'collection_id', None):
                    from models.knowledge_collection import KnowledgeCollection
                    from sqlalchemy import select
                    result = await session.execute(
                        select(KnowledgeCollection).where(KnowledgeCollection.id == document.collection_id)
                    )
                    collection_row = result.scalar_one_or_none()
                    if collection_row and getattr(collection_row, 'metadata_template', None):
                        template_type = collection_row.metadata_template or 'general'

                # 获取系统默认模板
                from service.knowledge_collection.template_service import MetadataTemplateService
                template_service = MetadataTemplateService(session)
                template = await template_service.get_template_by_type(template_type)
                if not template:
                    return {
                        'document_id': document_id,
                        'success': False,
                        'error': f'未找到系统默认模板: {template_type}'
                    }

                # 执行提取
                from service.metadata_extraction.extraction_service import MetadataExtractionService
                extraction_service = MetadataExtractionService()
                extraction_result = await extraction_service.extract_metadata(
                    document_id=document_id,
                    content=content,
                    filename=document.filename or document.title,
                    template=template,
                    config={}
                )

                extraction_log = {
                    'template_type': template_type,
                    'template_id': template.id,
                    'success': extraction_result.success,
                    'confidence_score': getattr(extraction_result, 'confidence_score', None),
                    'warnings': getattr(extraction_result, 'warnings', []) or [],
                    'errors': getattr(extraction_result, 'errors', []) or []
                }

                await doc_repo.update(document_id, {
                    'metadata_template_id': template.id,
                    'structured_metadata': extraction_result.extracted_metadata or {},
                    'metadata_extraction_status': 'completed' if extraction_result.success else 'failed',
                    'metadata_extraction_log': extraction_log
                })

                return {
                    'document_id': document_id,
                    'success': extraction_result.success,
                    'metadata_template_id': template.id,
                    'structured': bool(extraction_result.extracted_metadata),
                    'log': extraction_log
                }
        except Exception as e:
            return {
                'document_id': document_id,
                'success': False,
                'error': str(e)
            }

    async def bulk_extract_metadata_for_collection(
        self,
        collection_id: str,
        only_pending: bool = True,
        limit: Optional[int] = None
    ) -> Dict[str, Any]:
        """对集合内文档批量执行元数据提取。
        Args:
            collection_id: 知识库ID
            only_pending: 仅处理未完成/待处理（pending/failed）的文档
            limit: 最大处理数量
        Returns: 统计结果与每条明细
        """
        from sqlalchemy import select
        from models.knowledge import KnowledgeDocument as KD
        try:
            async with get_async_session() as session:
                query = select(KD).where(KD.collection_id == collection_id)
                if only_pending:
                    query = query.where(KD.metadata_extraction_status.in_(['pending', 'failed', None]))
                if limit and isinstance(limit, int) and limit > 0:
                    query = query.limit(limit)
                result = await session.execute(query)
                docs = result.scalars().all()

            total = len(docs)
            success = 0
            failed = 0
            details = []
            for doc in docs:
                r = await self.extract_metadata_for_document(doc.id)
                if r.get('success'):
                    success += 1
                else:
                    failed += 1
                details.append(r)

            return {
                'collection_id': collection_id,
                'total': total,
                'success': success,
                'failed': failed,
                'processed': success + failed,
                'details': details
            }
        except Exception as e:
            return {
                'collection_id': collection_id,
                'total': 0,
                'success': 0,
                'failed': 0,
                'processed': 0,
                'error': str(e),
                'details': []
            }

    async def reindex_collection_chunks_es(
        self,
        collection_id: str,
        recreate_index: bool = False,
        dims: int = 1024,
        limit: Optional[int] = None
    ) -> Dict[str, Any]:
        """将指定知识库的所有分块向量重新写入到 ES（mat_qa_chunks）。
        - 若 recreate_index=True，将强制重建索引并应用映射
        - 从PostgreSQL读取 chunks 的 general_embedding，如无则回退 embedding
        """
        from sqlalchemy import select, join
        from models.knowledge import KnowledgeDocument as KD, DocumentChunk as DC
        try:
            # 可选：重建索引
            from service.hybrid_search_service import hybrid_search_service
            if recreate_index:
                await hybrid_search_service.ensure_index(force=True, dims=dims)

            indexed = 0
            skipped = 0
            errors: list = []

            async with get_async_session() as session:
                # 连接查询：获取指定collection的chunks
                j = join(DC, KD, DC.document_id == KD.id)
                stmt = select(DC, KD.id.label('doc_id')) 
                stmt = stmt.select_from(j).where(KD.collection_id == collection_id)
                if limit and isinstance(limit, int) and limit > 0:
                    stmt = stmt.limit(limit)
                result = await session.execute(stmt)
                rows = result.fetchall()

            for row in rows:
                chunk: Any = row[0]
                doc_id: str = row[1]
                try:
                    # 取出向量（general_embedding优先，否则embedding）
                    vec = getattr(chunk, 'general_embedding', None) or getattr(chunk, 'embedding', None) or []
                    if vec and isinstance(vec, (list, tuple)):
                        vec = [float(x) for x in vec]
                    else:
                        skipped += 1
                        continue

                    doc_body = {
                        "id": chunk.id,
                        "document_id": doc_id,
                        "chunk_index": chunk.chunk_index,
                        "content": chunk.content,
                        "title": getattr(chunk, 'title', '') or '',
                        "general_embedding": vec,
                        "general_model": getattr(chunk, 'general_model', None) or '',
                        "vectorization_strategy": getattr(chunk, 'vectorization_strategy', 'general'),
                        "metadata": getattr(chunk, 'chunk_metadata', {}) or {},
                        "created_at": get_china_now().isoformat(),
                        "updated_at": get_china_now().isoformat()
                    }
                    await hybrid_search_service.es.index(index="mat_qa_chunks", id=chunk.id, body=doc_body)
                    indexed += 1
                except Exception as e:
                    errors.append({"chunk_id": chunk.id, "error": str(e)})

            return {
                "collection_id": collection_id,
                "indexed": indexed,
                "skipped": skipped,
                "total": len(rows),
                "errors": errors
            }
        except Exception as e:
            return {
                "collection_id": collection_id,
                "indexed": 0,
                "skipped": 0,
                "total": 0,
                "error": str(e),
                "errors": []
            }
    
    async def _chunk_document(self, document_id: str, config) -> List[Dict[str, Any]]:
        """文档分块"""
        async with get_async_session() as session:
            doc_repo = KnowledgeDocumentRepository(session)
            document = await doc_repo.get_by_id(document_id)
            
            if not document or not document.file_path:
                return []
            
            # 读取文档内容
            content = await self._extract_document_content(document.file_path)
            if not content:
                return []
            
            # 使用高级分块策略
            try:
                # 先尝试使用高级分块
                chunk_data = await self._chunk_document_content(document_id, content)
                return chunk_data
            except Exception as e:
                logger.warning(f"高级分块失败，使用传统方法: {e}")
                
                # 回退到传统分块策略
                chunks = []
                if config.strategy == "sentence":
                    chunks = self._chunk_by_sentence(content, config.chunk_size, config.chunk_overlap)
                elif config.strategy == "paragraph":
                    chunks = self._chunk_by_paragraph(content, config.chunk_size, config.chunk_overlap)
                else:
                    chunks = self._chunk_by_fixed_size(content, config.chunk_size, config.chunk_overlap)
            
            # 转换为数据库格式
            chunk_data = []
            for i, chunk_content in enumerate(chunks):
                chunk_data.append({
                    "document_id": document_id,
                    "content": chunk_content,
                    "chunk_index": i,
                    "metadata": {"strategy": config.strategy}
                })
            
            return chunk_data
    
    async def _chunk_document_content(self, document_id: str, content: str, config_id: Optional[str] = None, custom_params: Optional[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
        """
        使用高级切分算法对文档内容进行切分
        
        Args:
            document_id: 文档ID
            content: 文档内容
            config_id: 切分配置ID（可选，不提供则使用默认配置）
            custom_params: 自定义切分参数（可选，会覆盖配置中的参数）
        
        Returns:
            分块数据列表
        """
        try:
            # 获取切分配置
            if config_id:
                config = await chunking_config_service.get_config_by_id(config_id)
            else:
                config = await chunking_config_service.get_default_config()
            
            if not config:
                # 如果没有配置，使用默认值
                chunk_strategy = "semantic"
                parser_config = {
                    "chunk_token_num": 400,
                    "max_token_num": 512,
                    "delimiter": "!?。！？",
                    "chunk_overlap": 0
                }
                tokenizer_type = "simple"
            else:
                chunk_strategy = config.strategy
                parser_config = config.to_parser_config()
                tokenizer_type = config.tokenizer_type
            
            # 应用自定义参数（如果提供）
            if custom_params:
                logger.info(f"应用自定义切分参数: {custom_params}")
                if "chunk_size" in custom_params:
                    parser_config["chunk_token_num"] = custom_params["chunk_size"]
                    # 如果没有设置max_token_num，设置为chunk_size的1.2倍
                    if "max_token_num" not in parser_config:
                        parser_config["max_token_num"] = int(custom_params["chunk_size"] * 1.2)
                if "overlap" in custom_params:
                    # 这里需要根据overlap参数调整chunk_overlap或相关设置
                    # 由于parser_config可能没有直接的overlap参数，我们可能需要调整chunk_token_num
                    overlap = custom_params["overlap"]
                    # 如果需要重叠，可以调整相关参数
                    parser_config["chunk_overlap"] = overlap
                logger.info(f"最终使用的解析配置: {parser_config}")
            
            # 创建临时文件进行处理
            import tempfile
            with tempfile.NamedTemporaryFile(mode='w', suffix='.txt', delete=False, encoding='utf-8') as tmp_file:
                tmp_file.write(content)
                tmp_file_path = tmp_file.name
            
            try:
                logger.info(f"开始切分文档 {document_id}:")
                logger.info(f"  - 策略: {chunk_strategy}")
                logger.info(f"  - 配置: {parser_config}")
                logger.info(f"  - 内容长度: {len(content)} 字符")
                
                chunks = advanced_chunk(
                    tmp_file_path,
                    chunk_strategy=chunk_strategy,
                    parser_config=parser_config,
                    tokenizer=tokenizer_type
                )
                
                logger.info(f"切分完成，策略 '{chunk_strategy}' 生成了 {len(chunks)} 个分块")
                
                # 转换为数据库格式
                chunk_data = []
                for i, chunk in enumerate(chunks):
                    chunk_data.append({
                        "document_id": document_id,
                        "content": chunk.content,
                        "chunk_index": i,
                        "metadata": {
                            "strategy": chunk_strategy,
                            "type": str(chunk.type),
                            "headings": chunk.headings if hasattr(chunk, 'headings') else [],
                            "page_number": list(chunk.page_number) if hasattr(chunk, 'page_number') and chunk.page_number else [],
                            "extra": chunk.extra if hasattr(chunk, 'extra') else {}
                        }
                    })
                
                logger.info(f"高级切分完成: {document_id}, 生成 {len(chunk_data)} 个分块")
                return chunk_data
                
            finally:
                # 清理临时文件
                os.unlink(tmp_file_path)
                
        except Exception as e:
            logger.error(f"高级切分失败 {document_id}: {e}")
            # 回退到简单切分
            return self._simple_chunk_content(document_id, content)
    
    def _simple_chunk_content(self, document_id: str, content: str, chunk_size: int = 512) -> List[Dict[str, Any]]:
        """
        简单的内容切分方法（作为回退方案）
        
        Args:
            document_id: 文档ID
            content: 文档内容
            chunk_size: 分块大小
        
        Returns:
            分块数据列表
        """
        chunks = []
        words = content.split()
        
        current_chunk = []
        current_size = 0
        
        for word in words:
            if current_size + len(word) > chunk_size and current_chunk:
                chunk_text = ' '.join(current_chunk)
                chunks.append({
                    "document_id": document_id,
                    "content": chunk_text,
                    "chunk_index": len(chunks),
                    "metadata": {"strategy": "simple", "size": len(chunk_text)}
                })
                current_chunk = [word]
                current_size = len(word)
            else:
                current_chunk.append(word)
                current_size += len(word) + 1  # +1 for space
        
        # 添加最后一个分块
        if current_chunk:
            chunk_text = ' '.join(current_chunk)
            chunks.append({
                "document_id": document_id,
                "content": chunk_text,
                "chunk_index": len(chunks),
                "metadata": {"strategy": "simple", "size": len(chunk_text)}
            })
        
        return chunks
    
    async def _extract_document_content_with_parser(self, file_path: str) -> Optional[str]:
        """
        使用高级解析器提取文档内容
        
        Args:
            file_path: 文件路径
        
        Returns:
            提取的文档内容
        """
        try:
            file_ext = Path(file_path).suffix.lower()
            
            # 选择合适的解析器
            parser = None
            if file_ext in ['.txt', '.text', '.log']:
                parser = TextParser()
            elif file_ext in ['.md', '.markdown']:
                parser = MarkdownParser()
            elif file_ext == '.pdf':
                parser = PDFParser()
            elif file_ext in ['.doc', '.docx']:
                parser = DocxParser()
            elif file_ext in ['.xlsx', '.xls', '.csv']:
                parser = ExcelParser()
            
            if parser and parser.is_supported(file_path):
                # 使用解析器提取内容
                blocks = parser.parse(file_path)
                
                # 合并所有文本内容
                content_parts = []
                for block in blocks:
                    if hasattr(block, 'content') and block.content:
                        # 添加标题信息
                        if hasattr(block, 'headings') and block.headings:
                            content_parts.append('\n'.join(block.headings))
                        content_parts.append(block.content)
                
                return '\n\n'.join(content_parts)
            else:
                # 回退到简单方法
                return await self._extract_document_content(file_path)
                
        except Exception as e:
            logger.error(f"高级解析失败 {file_path}: {e}，回退到简单方法")
            return await self._extract_document_content(file_path)
    
    async def _extract_document_content(self, file_path: str) -> Optional[str]:
        """提取文档内容"""
        try:
            # 如果是文件路径（可能是MinIO对象名），先下载文件
            if file_path and not os.path.exists(file_path):
                # 从存储服务下载文件内容
                bucket_name = storage_service.config.documents_bucket
                file_content = await storage_service.get_file(bucket_name, file_path)
                if not file_content:
                    logger.error(f"无法从存储服务获取文件内容: {file_path}")
                    return None
                
                # 根据文件扩展名处理内容
                file_ext = Path(file_path).suffix.lower()
                if file_ext in [".txt", ".md"]:
                    return file_content.decode('utf-8')
                else:
                    # 对于其他文件类型，暂时返回一个占位符
                    logger.warning(f"暂不支持的文件类型: {file_ext}")
                    return f"文件内容提取 - {file_path} ({file_ext})"
            
            # 如果是本地文件路径
            file_ext = Path(file_path).suffix.lower()
            
            if file_ext == ".txt":
                with open(file_path, "r", encoding="utf-8") as f:
                    return f.read()
            elif file_ext == ".md":
                with open(file_path, "r", encoding="utf-8") as f:
                    return f.read()
            elif file_ext == ".pdf":
                # TODO: 集成PDF解析库 (PyPDF2, pdfplumber 等)
                logger.warning("PDF内容提取需要集成相应的库")
                return f"PDF文档 - {Path(file_path).name}"
            elif file_ext in [".doc", ".docx"]:
                # TODO: 集成DOC解析库 (python-docx 等)
                logger.warning("DOC/DOCX内容提取需要集成相应的库")
                return f"DOC文档 - {Path(file_path).name}"
            else:
                logger.warning(f"不支持的文件类型: {file_ext}")
                return None
        
        except Exception as e:
            logger.error(f"提取文档内容失败 {file_path}: {e}")
            return None
    
    def _chunk_by_sentence(self, content: str, chunk_size: int, overlap: int) -> List[str]:
        """按句子分块"""
        sentences = content.split("。")
        chunks = []
        current_chunk = ""
        
        for sentence in sentences:
            if len(current_chunk + sentence) <= chunk_size:
                current_chunk += sentence + "。"
            else:
                if current_chunk:
                    chunks.append(current_chunk.strip())
                current_chunk = sentence + "。"
        
        if current_chunk:
            chunks.append(current_chunk.strip())
        
        return chunks
    
    def _chunk_by_paragraph(self, content: str, chunk_size: int, overlap: int) -> List[str]:
        """按段落分块"""
        paragraphs = content.split("\n\n")
        chunks = []
        current_chunk = ""
        
        for paragraph in paragraphs:
            if len(current_chunk + paragraph) <= chunk_size:
                current_chunk += paragraph + "\n\n"
            else:
                if current_chunk:
                    chunks.append(current_chunk.strip())
                current_chunk = paragraph + "\n\n"
        
        if current_chunk:
            chunks.append(current_chunk.strip())
        
        return chunks
    
    def _chunk_by_fixed_size(self, content: str, chunk_size: int, overlap: int) -> List[str]:
        """按固定大小分块"""
        chunks = []
        start = 0
        
        while start < len(content):
            end = start + chunk_size
            chunk = content[start:end]
            chunks.append(chunk)
            start = end - overlap
        
        return chunks
    
    
    async def _update_document_progress(self, doc_repo, document_id: str, status: str, progress: int, message: str, chunks_info: Dict[str, Any] = None):
        """更新文档处理进度"""
        try:
            # 获取当前文档的元数据，保持已有信息
            current_doc = await doc_repo.get_by_id(document_id)
            current_metadata = current_doc.document_metadata or {} if current_doc else {}
            
            vector_status = {
                "progress": progress,
                "status": status,
                "message": message,
                "updated_at": get_china_now().isoformat()
            }
            
            # 如果有分块信息，添加到vector_status中
            if chunks_info:
                vector_status.update(chunks_info)
            
            # 更新文档元数据，保持现有结构
            updated_metadata = {
                **current_metadata,  # 保持现有元数据
                "vector_status": vector_status,
                "processing_progress": progress  # 直接在顶层添加processing_progress字段
            }
            
            await doc_repo.update(document_id, {
                "status": status,
                "document_metadata": updated_metadata,
                "vector_status": vector_status  # 同时更新数据库中的vector_status字段
            })
            
            logger.info(f"文档 {document_id} 进度更新: {progress}% - {message}")
            
            # 推送SSE消息（暂时注释掉，因为没有正确的session_id）
            # 前端会通过轮询或其他方式获取状态更新
            logger.debug(f"📡 文档状态更新: {document_id} -> {status} ({progress}%)")
            
        except Exception as e:
            logger.error(f"更新文档进度失败 {document_id}: {e}")

    async def _vectorize_chunks_with_progress(self, doc_repo, document_id: str, chunk_texts: List[str]):
        """批量向量化分块并更新进度"""
        try:
            total_chunks = len(chunk_texts)
            batch_size = task_config.vectorization_batch_size  # 每批处理的分块数量
            vector_results = []
            
            for i in range(0, total_chunks, batch_size):
                batch_texts = chunk_texts[i:i + batch_size]
                
                # 计算当前进度 (60% 到 95%)
                progress = 60 + int((i / total_chunks) * 35)
                completed_chunks = min(i + len(batch_texts), total_chunks)
                chunks_info = {
                    "total_chunks": total_chunks,
                    "chunks_completed": completed_chunks,
                    "current_phase": "vectorizing",
                    "vectorization_progress": f"{completed_chunks}/{total_chunks}"
                }
                await self._update_document_progress(
                    doc_repo, document_id, "processing", progress, 
                    f"向量化进度: {completed_chunks}/{total_chunks}",
                    chunks_info
                )
                
                # 获取集合级Embedding模型（如未设置则取网关默认）
                try:
                    doc = await doc_repo.get_by_id(document_id)
                    collection_id = getattr(doc, 'collection_id', None) if doc else None
                except Exception:
                    collection_id = None
                from service.embedding_model_manager import get_model_for_collection
                model_cfg = await get_model_for_collection(collection_id)
                if not model_cfg:
                    raise ValueError("未配置可用的Embedding模型（请在网关启用或在集合中设置）")
                model_id, provider = model_cfg
                logger.info(f"[EMB] vectorizing doc={document_id} provider={provider} model={model_id} batch={len(batch_texts)}")
                # 批量生成通用向量（通过 9050 网关），增加重试与状态提示
                max_retries = 3
                last_err: Optional[Exception] = None
                batch_embeddings = None
                for attempt in range(1, max_retries + 1):
                    try:
                        batch_embeddings = await embedding_service.create_embeddings(
                            model_path=f"{provider}/{model_id}",
                            texts=batch_texts
                        )
                        break
                    except Exception as emb_err:
                        last_err = emb_err
                        logger.error(f"[EMB] batch failed attempt={attempt}/{max_retries} provider={provider} model={model_id} err={emb_err}")
                        # 更新进度提示重试（不改变主状态）
                        try:
                            await self._update_document_progress(
                                doc_repo, document_id, "processing", progress,
                                f"向量化重试({attempt}/{max_retries})：{str(emb_err)[:80]}",
                                chunks_info
                            )
                        except Exception:
                            pass
                        # 递增退避
                        await asyncio.sleep(1.5 * attempt)
                if batch_embeddings is None:
                    raise RuntimeError(str(last_err) if last_err else "向量化失败")
                if batch_embeddings and batch_embeddings.embeddings:
                    # 转换为兼容格式
                    for i, embedding in enumerate(batch_embeddings.embeddings):
                        vector_results.append({
                            'text': batch_texts[i],
                            'general_vector': embedding,
                            'general_model': batch_embeddings.model
                        })
                
                # 短暂延迟，避免API限制
                await asyncio.sleep(task_config.vectorization_delay)
            
            return vector_results
            
        except Exception as e:
            logger.error(f"批量向量化失败 {document_id}: {e}")
            raise

    async def _generate_embeddings(self, document_id: str, config):
        """生成向量嵌入"""
        async with get_async_session() as session:
            chunk_repo = DocumentChunkRepository(session)
            chunks = await chunk_repo.get_chunks_by_document(document_id)
            
            for chunk in chunks:
                try:
                    embedding = await self.embedding_service.embed_text(chunk.content)
                    await chunk_repo.update_chunk_embedding(chunk.id, embedding, config.model)
                except Exception as e:
                    logger.error(f"生成嵌入失败 {chunk.id}: {e}")
    
    async def _vector_search(
        self, 
        query_embedding: List[float], 
        top_k: int, 
        threshold: Optional[float]
    ) -> List[Dict[str, Any]]:
        """向量搜索"""
        # 这里需要集成向量数据库（如 Faiss, Pinecone, Weaviate 等）
        # 暂时返回模拟数据
        return [
            {
                "id": str(uuid.uuid4()),
                "title": f"搜索结果 {i+1}",
                "content": f"匹配的内容片段 {i+1}",
                "score": 0.9 - i * 0.1,
                "source": f"文档_{i+1}",
                "metadata": {"page": i+1}
            }
            for i in range(min(top_k, 5))
        ]
    
    async def vectorize_documents_general(
        self, 
        document_ids: List[str], 
        config_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        使用通用向量对文档进行向量化
        """
        async with get_async_session() as session:
            doc_repo = KnowledgeDocumentRepository(session)
            chunk_repo = DocumentChunkRepository(session)
            
            results = {"success": [], "failed": []}
            
            for doc_id in document_ids:
                try:
                    # 更新文档状态
                    await doc_repo.update(doc_id, {"status": "processing"})
                    
                    # 获取文档分块
                    chunks = await chunk_repo.get_chunks_by_document(doc_id)
                    if not chunks:
                        # 如果没有分块，先进行分块
                        chunks_data = await self._chunk_document(doc_id, None)  # 使用默认配置
                        if chunks_data:
                            await chunk_repo.create_chunks(chunks_data)
                            chunks = await chunk_repo.get_chunks_by_document(doc_id)
                    
                    # 提取分块文本
                    chunk_texts = [chunk.content for chunk in chunks]
                    
                    # 生成通用向量
                    # 从配置获取embedding模型
                    embedding_config = optimized_config_manager.get_embedding_models_config()
                    default_model = embedding_config.get('default_model')
                    if not default_model:
                        raise ValueError("未配置embedding模型")
                        
                    from service.llm_config_gateway_client import get_llm_config_gateway_client
                    client = await get_llm_config_gateway_client()
                    cfg = await client.get_default_embedding_model()
                    model_id = cfg[0] if cfg else None
                    emb_list = []
                    if model_id:
                        for t in chunk_texts:
                            resp = await client.create_embeddings(model_id, t)
                            data = (resp.get('data') or [{}])[0]
                            emb = data.get('embedding') or []
                            emb_list.append(emb)
                    class _Resp:
                        embeddings = emb_list
                        model = model_id or ''
                    batch_embeddings = _Resp()
                    
                    # 转换为兼容格式
                    vector_results = []
                    if batch_embeddings and batch_embeddings.embeddings:
                        for i, embedding in enumerate(batch_embeddings.embeddings):
                            vector_results.append({
                                'text': chunk_texts[i],
                                'general_vector': embedding,
                                'general_model': batch_embeddings.model
                            })
                        
                        # 保存向量到ElasticSearch
                        for i, (chunk, vector_result) in enumerate(zip(chunks, vector_results)):
                            await self._save_vectors_to_es(
                                chunk=chunk,
                                vector_result=vector_result,
                                document_id=doc_id
                            )
                    
                    else:
                        # 使用单一向量（向后兼容）
                        await self._generate_embeddings(doc_id, None)
                    
                    # 更新文档状态
                    vector_status = {
                        "progress": 100,
                        "general_vectors": True,
                        "chunks": len(chunks),
                        "models": {
                            "general": (model_id or '')
                        }
                    }
                    
                    await doc_repo.update(doc_id, {
                        "status": "vectorized",
                        "vector_status": vector_status
                    })
                    
                    results["success"].append(doc_id)
                    logger.info(f"文档向量化成功: {doc_id}")
                    
                except Exception as e:
                    await doc_repo.update(doc_id, {"status": "failed"})
                    results["failed"].append({"document_id": doc_id, "error": str(e)})
                    logger.error(f"文档向量化失败 {doc_id}: {e}")
            
            return results

    async def _save_vectors_to_es(
        self,
        chunk: Any,
        vector_result,
        document_id: str
    ):
        """将通用向量保存到ElasticSearch"""
        
        # 确保为浮点向量，避免ES将其推断为long
        try:
            vector_values = vector_result['general_vector']
            if isinstance(vector_values, (list, tuple)):
                vector_values = [float(x) for x in vector_values]
        except Exception:
            vector_values = vector_result.get('general_vector', [])

        # 解析 collection_id（用于跨知识库检索过滤）与文档结构化元数据（场景过滤）
        collection_id_val = None
        doc_structured = {}
        doc_metadata_template_id = None
        try:
            async with get_async_session() as session:
                try:
                    from db.repositories.knowledge_repository import KnowledgeRepository  # 正确的包路径
                except Exception:
                    # 兼容旧路径，避免运行期异常
                    from repositories.knowledge_repository import KnowledgeRepository  # type: ignore
                repo = KnowledgeRepository(session)
                doc = await repo.get_document_by_id(document_id)
                collection_id_val = getattr(doc, 'collection_id', None)
                doc_structured = getattr(doc, 'structured_metadata', {}) or {}
                doc_metadata_template_id = getattr(doc, 'metadata_template_id', None)
        except Exception:
            collection_id_val = None
            doc_structured = {}
            doc_metadata_template_id = None

        # 计算场景（education/academic/policy/general），优先使用结构化元数据中的 scenario；否则依据所属集合的 metadata_template 推断
        scenario_val = None
        try:
            if isinstance(doc_structured, dict) and doc_structured.get('scenario'):
                scenario_val = str(doc_structured.get('scenario')).lower()
            elif collection_id_val:
                # 映射 collection.metadata_template -> 场景
                scenemap = {
                    'education': 'education', 'academic': 'academic', 'policy': 'policy', 'general': 'general',
                    '教育': 'education', '学术': 'academic', '政策': 'policy', '通用': 'general'
                }
                try:
                    from db.repositories.knowledge_repository import KnowledgeRepository
                except Exception:
                    from repositories.knowledge_repository import KnowledgeRepository  # type: ignore
                async with get_async_session() as _sess2:
                    _repo2 = KnowledgeRepository(_sess2)
                    col = await _repo2.get_collection_by_id(collection_id_val)
                    mt = getattr(col, 'metadata_template', None) if col else None
                    if mt and str(mt) in scenemap:
                        scenario_val = scenemap[str(mt)]
        except Exception:
            scenario_val = None

        doc_body = {
            "id": chunk.id,
            "document_id": document_id,
            **({"collection_id": collection_id_val} if collection_id_val else {}),
            "chunk_index": chunk.chunk_index,
            "content": chunk.content,
            "title": getattr(chunk, 'title', '') or '',
            
            # 通用向量
            "general_embedding": vector_values,
            
            # 模型信息
            "general_model": vector_result['general_model'],
            "vectorization_strategy": "general",
            
            # 元数据
            "metadata": {
                **(getattr(chunk, 'chunk_metadata', {}) or {}),
                "vector_metadata": str(vector_result.get('metadata', {})),
                **({"collection_id": collection_id_val} if collection_id_val else {}),
                **({"metadata_template_id": doc_metadata_template_id} if doc_metadata_template_id else {}),
                **({"structured": doc_structured} if isinstance(doc_structured, dict) else {}),
                **({"scenario": scenario_val} if scenario_val else {})
            },
            "created_at": get_china_now().isoformat(),
            "updated_at": get_china_now().isoformat()
        }
        
        await hybrid_search_service.es.index(
            index="mat_qa_chunks",
            id=chunk.id,
            body=doc_body
        )

    async def hybrid_search(
        self,
        query: str,
        top_k: int = 20,
        filters: Optional[Dict[str, Any]] = None,
        boost_domain: bool = True,
        use_rerank: bool = False
    ) -> List[Dict[str, Any]]:
        """执行混合检索"""
        
        # 执行混合检索
        results = await hybrid_search_service.hybrid_search(
            query=query,
            top_k=top_k,
            filters=filters,
            boost_domain=boost_domain
        )
        
        # 重排序（如果启用）
        if use_rerank:
            results = await hybrid_search_service.rerank_results(query, results)
        
        # 转换为字典格式
        return [
            {
                "id": result.id,
                "content": result.content,
                "title": result.title,
                "score": result.score,
                "scores": {
                    "general": result.general_score,
                    "domain": result.domain_score,
                    "keyword": result.keyword_score,
                    "combined": result.combined_score
                },
                "highlights": result.highlights,
                "metadata": result.source.get("metadata", {})
            }
            for result in results
        ]
    
    async def _rerank_results(
        self, 
        query: str, 
        results: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """重排序结果"""
        # 这里可以集成重排序模型
        # 暂时按分数排序
        return sorted(results, key=lambda x: x.get("score", 0), reverse=True)

    async def _search_qa_dataset(
        self,
        query: str,
        top_k: int = 5,
        threshold: float = 0.3
    ) -> List[Dict[str, Any]]:
        """
        检索QA数据集
        
        Args:
            query: 查询文本
            top_k: 返回结果数量
            threshold: 相似度阈值
            
        Returns:
            List[Dict]: QA检索结果列表
        """
        try:
            from db.database import get_elasticsearch_client
            from service.llm_config_gateway_client import get_llm_config_gateway_client
            client = await get_llm_config_gateway_client()
            cfg = await client.get_default_embedding_model()
            model_id = cfg[0] if cfg else None
            query_vector = []
            if model_id:
                resp = await client.create_embeddings(model_id, query)
                data = (resp.get('data') or [{}])[0]
                query_vector = data.get('embedding') or []
            if not query_vector:
                logger.warning("QA检索: 查询向量生成失败（空向量）")
                return []
            
            es_client = get_elasticsearch_client()
            
            # ES查询
            search_body = {
                "size": top_k,
                "query": {
                    "script_score": {
                        "query": {"match_all": {}},
                        "script": {
                            "source": "cosineSimilarity(params.query_vector, 'question_vector_general') + 1.0",
                            "params": {"query_vector": query_vector}
                        }
                    }
                },
                "_source": ["question", "answer", "category", "dataset_id", "qa_pair_id"]
            }
            
            response = await es_client.search(
                index="mat_qa_pairs_vectors",
                body=search_body
            )
            
            results = []
            for hit in response["hits"]["hits"]:
                raw_score = hit["_score"]
                # 🔥 修复：添加分数归一化处理，确保分数在0-1范围内
                score = max(0.0, min(1.0, raw_score - 1.0))  # 转换回cosine similarity并归一化
                if score >= threshold:
                    source = hit["_source"]
                    results.append({
                        "id": source.get("qa_pair_id", ""),
                        "title": f"QA: {source.get('question', '')[:50]}...",
                        "content": f"问题: {source.get('question', '')}\n答案: {source.get('answer', '')}",
                        "score": score,
                        "source_type": "qa_dataset",
                        "metadata": {
                            "dataset_id": source.get("dataset_id", ""),
                            "category": source.get("category", ""),
                            "question": source.get("question", ""),
                            "answer": source.get("answer", "")
                        },
                        "question": source.get("question", ""),
                        "answer": source.get("answer", "")
                    })
            
            logger.info(f"QA数据集检索完成，返回 {len(results)} 个结果（阈值: {threshold}）")
            return results
            
        except Exception as e:
            logger.error(f"QA数据集检索失败: {e}")
            return []
    
    async def _cleanup_arangodb_document_data(self, document_id: str) -> Dict[str, int]:
        """
        清理ArangoDB中与指定文档相关的图谱数据
        
        Args:
            document_id: 文档ID
            
        Returns:
            Dict[str, int]: 清理统计信息 {"nodes_deleted": x, "edges_deleted": y}
        """
        from db.repositories.arangodb_graph_repository import get_arango_graph_repository
        
        arango_repo = get_arango_graph_repository()
        if not arango_repo or not arango_repo.database:
            logger.warning("ArangoDB未连接，跳过图谱数据清理")
            return {"nodes_deleted": 0, "edges_deleted": 0}
        
        stats = {"nodes_deleted": 0, "edges_deleted": 0}
        
        try:
            # 删除与文档相关的边
            edge_collections = ['relationships', 'citations', 'contains']
            for edge_collection in edge_collections:
                try:
                    if arango_repo.database.has_collection(edge_collection):
                        # 查找并删除与该文档相关的边
                        aql = f"""
                            FOR edge IN {edge_collection}
                            FILTER edge.source_document_id == @document_id
                            REMOVE edge IN {edge_collection}
                            RETURN OLD
                        """
                        
                        bind_vars = {"document_id": document_id}
                        cursor = arango_repo.database.aql.execute(aql, bind_vars=bind_vars)
                        deleted_edges = list(cursor)
                        stats["edges_deleted"] += len(deleted_edges)
                        
                        if deleted_edges:
                            logger.info(f"删除了 {len(deleted_edges)} 个 {edge_collection} 边（文档 {document_id}）")
                            
                except Exception as e:
                    logger.warning(f"删除边集合 {edge_collection} 中的文档数据失败: {e}")
            
            # 删除与文档相关的节点
            node_collections = ['entities', 'concepts', 'materials', 'papers']
            for node_collection in node_collections:
                try:
                    if arango_repo.database.has_collection(node_collection):
                        # 查找并删除与该文档相关的节点
                        aql = f"""
                            FOR node IN {node_collection}
                            FILTER node.source_document_id == @document_id
                            REMOVE node IN {node_collection}
                            RETURN OLD
                        """
                        
                        bind_vars = {"document_id": document_id}
                        cursor = arango_repo.database.aql.execute(aql, bind_vars=bind_vars)
                        deleted_nodes = list(cursor)
                        stats["nodes_deleted"] += len(deleted_nodes)
                        
                        if deleted_nodes:
                            logger.info(f"删除了 {len(deleted_nodes)} 个 {node_collection} 节点（文档 {document_id}）")
                            
                except Exception as e:
                    logger.warning(f"删除节点集合 {node_collection} 中的文档数据失败: {e}")
            
            logger.info(f"ArangoDB清理完成 - 文档 {document_id}: 节点={stats['nodes_deleted']}, 边={stats['edges_deleted']}")
            return stats
            
        except Exception as e:
            logger.error(f"清理ArangoDB文档数据失败 {document_id}: {e}")
            return {"nodes_deleted": 0, "edges_deleted": 0}
    
    async def _cleanup_postgresql_document_data(self, document_id: str) -> Dict[str, int]:
        """
        清理PostgreSQL中与指定文档相关的图谱数据
        
        Args:
            document_id: 文档ID
            
        Returns:
            Dict[str, int]: 清理统计信息 {"nodes_deleted": x, "edges_deleted": y}
        """
        from db.repositories.graph_repository import GraphNodeRepository, GraphEdgeRepository
        from sqlalchemy import text
        
        stats = {"nodes_deleted": 0, "edges_deleted": 0}
        
        try:
            async with get_async_session() as session:
                # 删除与文档相关的边
                try:
                    # 使用原生SQL删除操作，因为可能涉及大量数据
                    edge_delete_query = text("""
                        DELETE FROM graph_edges 
                        WHERE source_document_id = :document_id
                    """)
                    
                    edge_result = await session.execute(edge_delete_query, {"document_id": document_id})
                    stats["edges_deleted"] = edge_result.rowcount
                    
                    logger.info(f"删除了 {stats['edges_deleted']} 个PostgreSQL图边（文档 {document_id}）")
                    
                except Exception as e:
                    logger.warning(f"删除PostgreSQL图边失败: {e}")
                
                # 删除与文档相关的节点
                try:
                    node_delete_query = text("""
                        DELETE FROM graph_nodes 
                        WHERE source_document_id = :document_id
                    """)
                    
                    node_result = await session.execute(node_delete_query, {"document_id": document_id})
                    stats["nodes_deleted"] = node_result.rowcount
                    
                    logger.info(f"删除了 {stats['nodes_deleted']} 个PostgreSQL图节点（文档 {document_id}）")
                    
                except Exception as e:
                    logger.warning(f"删除PostgreSQL图节点失败: {e}")
                
                # 提交事务
                await session.commit()
            
            logger.info(f"PostgreSQL清理完成 - 文档 {document_id}: 节点={stats['nodes_deleted']}, 边={stats['edges_deleted']}")
            return stats
            
        except Exception as e:
            logger.error(f"清理PostgreSQL文档数据失败 {document_id}: {e}")
            return {"nodes_deleted": 0, "edges_deleted": 0}


# 配置管理服务

class VectorConfigService:
    """向量配置服务"""
    
    async def create_config(self, config_data: Dict[str, Any]) -> Dict[str, Any]:
        """创建向量配置"""
        async with get_async_session() as session:
            config_repo = VectorConfigRepository(session)
            config = await config_repo.create(config_data)
            return {
                "id": config.id,
                "name": config.name,
                "model": config.model,
                "dimension": config.dimension,
                "chunk_size": config.chunk_size,
                "chunk_overlap": config.chunk_overlap,
                "strategy": config.strategy,
                "is_default": config.is_default
            }
    
    async def get_configs(self) -> List[Dict[str, Any]]:
        """获取所有配置"""
        async with get_async_session() as session:
            config_repo = VectorConfigRepository(session)
            configs = await config_repo.get_all()
            return [
                {
                    "id": config.id,
                    "name": config.name,
                    "model": config.model,
                    "dimension": config.dimension,
                    "chunk_size": config.chunk_size,
                    "chunk_overlap": config.chunk_overlap,
                    "strategy": config.strategy,
                    "is_default": config.is_default
                }
                for config in configs
            ]
    
    async def get_default_config(self) -> Optional[Dict[str, Any]]:
        """获取默认配置"""
        async with get_async_session() as session:
            config_repo = VectorConfigRepository(session)
            config = await config_repo.get_default()
            if config:
                return {
                    "id": config.id,
                    "name": config.name,
                    "model": config.model,
                    "dimension": config.dimension,
                    "chunk_size": config.chunk_size,
                    "chunk_overlap": config.chunk_overlap,
                    "strategy": config.strategy,
                    "is_default": config.is_default
                }
            return None
    
    async def update_config(self, config_id: str, update_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """更新配置"""
        async with get_async_session() as session:
            config_repo = VectorConfigRepository(session)
            config = await config_repo.update(config_id, update_data)
            if config:
                return {
                    "id": config.id,
                    "name": config.name,
                    "model": config.model,
                    "dimension": config.dimension,
                    "chunk_size": config.chunk_size,
                    "chunk_overlap": config.chunk_overlap,
                    "strategy": config.strategy,
                    "is_default": config.is_default
                }
            return None
    
    async def delete_config(self, config_id: str) -> bool:
        """删除配置"""
        async with get_async_session() as session:
            config_repo = VectorConfigRepository(session)
            return await config_repo.delete(config_id)


class ModelConfigService:
    """模型配置服务"""
    
    async def create_config(self, config_data: Dict[str, Any]) -> Dict[str, Any]:
        """创建模型配置"""
        async with get_async_session() as session:
            config_repo = ModelConfigRepository(session)
            config = await config_repo.create(config_data)
            return self._format_config(config)
    
    async def get_configs(self, active_only: bool = True) -> List[Dict[str, Any]]:
        """获取所有配置"""
        async with get_async_session() as session:
            config_repo = ModelConfigRepository(session)
            configs = await config_repo.get_all(active_only)
            return [self._format_config(config) for config in configs]
    
    async def get_configs_by_type(self, model_type: str) -> List[Dict[str, Any]]:
        """根据类型获取配置"""
        async with get_async_session() as session:
            config_repo = ModelConfigRepository(session)
            configs = await config_repo.get_by_type(model_type)
            return [self._format_config(config) for config in configs]
    
    async def update_config(self, config_id: str, update_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """更新配置"""
        async with get_async_session() as session:
            config_repo = ModelConfigRepository(session)
            config = await config_repo.update(config_id, update_data)
            return self._format_config(config) if config else None
    
    async def delete_config(self, config_id: str) -> bool:
        """删除配置"""
        async with get_async_session() as session:
            config_repo = ModelConfigRepository(session)
            return await config_repo.delete(config_id)
    
    def _format_config(self, config) -> Dict[str, Any]:
        """格式化配置数据"""
        return {
            "id": config.id,
            "name": config.name,
            "type": config.type,
            "provider": config.provider,
            "model": config.model,
            "parameters": config.parameters,
            "is_active": config.is_active,
            "max_tokens": config.max_tokens,
            "temperature": config.temperature,
            "dimension": config.dimension
        }
    
    async def _update_document_progress(
        self, 
        doc_repo, 
        document_id: str, 
        status: str, 
        progress: int, 
        message: str
    ):
        """更新文档处理进度"""
        try:
            # 构建vector_status对象包含进度信息
            vector_status = {
                "progress": progress,
                "status": status,
                "message": message,
                "updated_at": get_china_now().isoformat()
            }
            
            await doc_repo.update(document_id, {
                "status": status,
                "vector_status": vector_status
            })
            
            logger.info(f"文档 {document_id} 进度更新: {progress}% - {message}")
            
        except Exception as e:
            logger.error(f"更新文档进度失败 {document_id}: {e}")
    
    async def _vectorize_chunks_with_progress(
        self, 
        doc_repo, 
        document_id: str, 
        chunk_texts: List[str]
    ):
        """分批处理向量化并更新进度"""
        try:
            total_chunks = len(chunk_texts)
            batch_size = task_config.vectorization_batch_size  # 每批处理的分块数量
            vector_results = []
            
            for i in range(0, total_chunks, batch_size):
                batch_texts = chunk_texts[i:i + batch_size]
                
                # 计算当前进度 (60% -> 95%)
                progress = 60 + int((i / total_chunks) * 35)
                await self._update_document_progress(
                    doc_repo, document_id, "processing", 
                    progress, f"向量化进度: {i + len(batch_texts)}/{total_chunks}"
                )
                
                # 处理当前批次
                # 从配置获取embedding模型
                embedding_config = optimized_config_manager.get_embedding_models_config()
                default_model = embedding_config.get('default_model')
                if not default_model:
                    raise ValueError("未配置embedding模型")
                
                batch_embeddings = await embedding_service.create_embeddings(
                    model_path=f"alibaba/{default_model}",
                    texts=batch_texts
                )
                
                # 转换为兼容格式
                if batch_embeddings and batch_embeddings.embeddings:
                    for j, embedding in enumerate(batch_embeddings.embeddings):
                        vector_results.append({
                            'text': batch_texts[j],
                            'general_vector': embedding,
                            'general_model': batch_embeddings.model
                        })
                
                # 添加小延迟避免API过载
                if i + batch_size < total_chunks:
                    await asyncio.sleep(task_config.vectorization_delay)
            
            return vector_results
            
        except Exception as e:
            logger.error(f"分批向量化失败 {document_id}: {e}")
            raise


# 全局知识服务实例
def get_knowledge_service():
    """获取知识服务实例（延迟初始化）"""
    global knowledge_service
    if knowledge_service is None:
        try:
            knowledge_service = KnowledgeService()
        except Exception as e:
            logger.warning(f"知识服务初始化失败: {e}")
            return None
    return knowledge_service

try:
    knowledge_service = KnowledgeService()
except Exception as e:
    logger.warning(f"知识服务初始化失败，将在首次使用时重试: {e}")
    knowledge_service = None
