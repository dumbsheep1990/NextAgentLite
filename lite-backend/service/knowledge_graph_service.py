"""
知识图谱独立服务
专门处理知识图谱文档的上传、内容提取和三元组提取
与普通知识库服务完全隔离，避免不必要的向量化操作
"""
import asyncio
import uuid
import os
from typing import Optional, Dict, Any, List
from datetime import datetime
from pathlib import Path

from core.logger import logger
from service.storage_service import storage_service
# 使用优化后的通用材料科学三元组提取服务
from service.universal_triplet_extraction_service import UniversalTripletExtractionService as TripletExtractionService
from models.knowledge import KnowledgeDocument


class KnowledgeGraphService:
    """知识图谱独立服务"""
    
    def __init__(self):
        self.triplet_service = TripletExtractionService()
    
    async def process_knowledge_graph_document(
        self, 
        document_id: str, 
        file_path: str,
        auto_extract: bool = True
    ) -> Dict[str, Any]:
        """
        处理知识图谱文档
        只做：文本提取 → 三元组提取 → 图谱构建
        不进行向量化操作
        """
        try:
            logger.info(f"🔄 开始处理知识图谱文档: {document_id}")
            
            # 1. 获取文档对象
            document = await self._get_document_by_id(document_id)
            if not document:
                raise ValueError(f"文档不存在: {document_id}")
            
            # 2. 提取文档内容（仅文本提取，不向量化）
            content = await self._extract_document_content(file_path)
            if not content:
                raise ValueError(f"无法提取文档内容: {file_path}")
            
            logger.info(f"📄 文档内容提取完成: {len(content)} 字符")
            
            # 3. 更新文档状态为处理中
            await self._update_document_status(document_id, "processing")
            
            # 4. 三元组提取（如果启用自动提取）
            extraction_result = None
            if auto_extract:
                logger.info(f"🔍 开始三元组提取...")
                
                # 创建用于三元组提取的文档对象
                document_for_extraction = self._create_document_object(document, content)
                
                # 调用三元组提取服务（注意参数）
                extraction_result = await self.triplet_service.extract_triplets_from_document(
                    document=document_for_extraction,  # 传递文档对象，不是document_id
                    use_streaming=False  # 后台处理不需要流式
                )
                
                logger.info(f"✅ 三元组提取完成: "
                          f"实体 {len(extraction_result.get('entities', []))} 个, "
                          f"关系 {len(extraction_result.get('relationships', []))} 个")
            
            # 5. 更新文档状态为完成
            await self._update_document_status(document_id, "completed")
            
            result = {
                "document_id": document_id,
                "content_length": len(content),
                "extraction_enabled": auto_extract,
                "extraction_result": extraction_result,
                "processed_at": datetime.utcnow().isoformat(),
                "status": "completed"
            }
            
            logger.info(f"🎉 知识图谱文档处理完成: {document_id}")
            return result
            
        except Exception as e:
            logger.error(f"❌ 知识图谱文档处理失败 {document_id}: {e}")
            # 更新文档状态为失败
            try:
                await self._update_document_status(document_id, "failed", error_message=str(e))
            except Exception as update_error:
                logger.error(f"更新失败状态时出错: {update_error}")
            raise
    
    async def _extract_document_content(self, file_path: str) -> Optional[str]:
        """
        提取文档内容（仅文本提取，不向量化）
        使用知识图谱专用bucket
        """
        try:
            # 使用知识图谱专用bucket
            kg_bucket = storage_service.config.knowledge_graph_bucket
            
            # 从MinIO获取文件内容
            file_content = await storage_service.get_file(kg_bucket, file_path)
            if not file_content:
                raise ValueError(f"无法从存储获取文件: {file_path}")
            
            # 根据文件类型进行文本提取
            file_extension = Path(file_path).suffix.lower()
            
            if file_extension in ['.txt', '.md']:
                # 文本文件直接解码
                content = file_content.decode('utf-8', errors='ignore')
            elif file_extension in ['.pdf']:
                # PDF文件需要特殊处理
                content = await self._extract_pdf_content(file_content)
            elif file_extension in ['.docx', '.doc']:
                # Word文档需要特殊处理
                content = await self._extract_word_content(file_content)
            else:
                # 其他文件类型尝试文本解码
                content = file_content.decode('utf-8', errors='ignore')
            
            return content.strip() if content else None
            
        except Exception as e:
            logger.error(f"提取文档内容失败 {file_path}: {e}")
            return None
    
    async def _extract_pdf_content(self, file_content: bytes) -> str:
        """提取PDF内容"""
        try:
            import io
            from PyPDF2 import PdfReader
            
            pdf_file = io.BytesIO(file_content)
            reader = PdfReader(pdf_file)
            
            text = ""
            for page in reader.pages:
                text += page.extract_text() + "\n"
            
            return text
        except Exception as e:
            logger.warning(f"PDF内容提取失败: {e}")
            return ""
    
    async def _extract_word_content(self, file_content: bytes) -> str:
        """提取Word文档内容"""
        try:
            import io
            from docx import Document
            
            doc_file = io.BytesIO(file_content)
            document = Document(doc_file)
            
            text = ""
            for paragraph in document.paragraphs:
                text += paragraph.text + "\n"
            
            return text
        except Exception as e:
            logger.warning(f"Word文档内容提取失败: {e}")
            return ""
    
    def _create_document_object(self, document: KnowledgeDocument, content: str):
        """创建用于三元组提取的文档对象"""
        class DocumentForExtraction:
            def __init__(self, id: str, title: str, content: str):
                self.id = id
                self.title = title
                self.content = content
                self.filename = document.filename if hasattr(document, 'filename') else ""
                self.file_type = document.file_type if hasattr(document, 'file_type') else ""
        
        return DocumentForExtraction(document.id, document.title, content)
    
    async def _get_document_by_id(self, document_id: str) -> Optional[KnowledgeDocument]:
        """获取文档信息"""
        try:
            from db.database import get_async_session
            from db.repositories.knowledge_repository import KnowledgeDocumentRepository
            
            async with get_async_session() as session:
                repo = KnowledgeDocumentRepository(session)
                document = await repo.get_by_id(document_id)
                return document
                
        except Exception as e:
            logger.error(f"获取文档失败 {document_id}: {e}")
            return None
    
    async def _update_document_status(
        self, 
        document_id: str, 
        status: str, 
        error_message: Optional[str] = None
    ):
        """更新文档状态"""
        try:
            from db.database import get_async_session
            from db.repositories.knowledge_repository import KnowledgeDocumentRepository
            
            async with get_async_session() as session:
                repo = KnowledgeDocumentRepository(session)
                
                update_data = {
                    "status": status,
                    "updated_at": datetime.utcnow()
                }
                
                if error_message:
                    # 将错误信息保存到metadata中
                    document = await repo.get_by_id(document_id)
                    if document:
                        metadata = document.document_metadata or {}
                        metadata["processing_error"] = error_message
                        metadata["error_time"] = datetime.utcnow().isoformat()
                        update_data["document_metadata"] = metadata
                
                await repo.update(document_id, update_data)
                logger.info(f"文档状态更新成功: {document_id} -> {status}")
                
        except Exception as e:
            logger.error(f"更新文档状态失败 {document_id}: {e}")


# 创建全局实例
knowledge_graph_service = KnowledgeGraphService() 