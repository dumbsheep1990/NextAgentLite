"""
知识库文档管理端点 - 从knowledge.py安全拆分出来的文档CRUD功能
包含文档上传、删除、更新、批量操作等核心文档管理功能
"""
from typing import Dict, Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, File, UploadFile, Form, BackgroundTasks, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, text, and_, or_, desc
from datetime import datetime
import uuid
import os
import json
from pathlib import Path

from db.database import get_db, get_async_session
from models.knowledge import KnowledgeDocument as KnowledgeDocumentModel
from core.logger import logger
from pydantic import BaseModel

# 本地定义响应模型（避免循环导入）
class UploadResponse(BaseModel):
    success: bool
    message: str
    document_id: Optional[str] = None
    filename: Optional[str] = None
    
class KnowledgeDocument(BaseModel):
    id: str
    title: str
    filename: str
    fileType: str
    fileSize: int
    uploadTime: str
    status: str
    tags: List[str]
    metadata: Dict[str, Any]
    vectorStatus: Optional[Dict[str, Any]] = None  # 修复: 应该是Dict类型而不是str
    vectorized: bool
    dualVectorized: bool
    vectorConfig: Optional[Dict[str, Any]] = None
    collectionId: Optional[str] = None
    collectionName: Optional[str] = None
    metadataTemplateId: Optional[str] = None
    structuredMetadata: Optional[Dict[str, Any]] = None

class DocumentChunksResponse(BaseModel):
    document_id: str
    total_chunks: int
    chunks: List[Dict[str, Any]]

class PaginatedDocumentResponse(BaseModel):
    documents: List[KnowledgeDocument]
    total: int
    page: int
    size: int
    totalPages: int
    vectorConfig: Optional[Dict[str, Any]] = None

# 创建独立的路由器
documents_router = APIRouter()

@documents_router.get("/documents", response_model=PaginatedDocumentResponse)
async def get_documents(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=50),
    search: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    tags: Optional[str] = Query(None),
    include_knowledge_graph: bool = Query(False, description="是否包含知识图谱文档"),
    collection_id: Optional[str] = Query(None, description="按知识库ID过滤"),
    metadata_template: Optional[str] = Query(None, description="按元数据模版类型过滤"),
    folder_id: Optional[str] = Query(None, description="按文件夹ID过滤"),
    db: AsyncSession = Depends(get_db)
):
    """获取知识文档列表（默认不包含知识图谱文档）"""
    try:
        logger.info(f"获取文档列表: page={page}, size={size}, collection_id={collection_id}")
        
        query = select(KnowledgeDocumentModel)
        
        # 默认过滤掉知识图谱文档
        if not include_knowledge_graph:
            query = query.where(
                ~KnowledgeDocumentModel.tags.op('@>')(text("'[\"knowledge_graph\"]'::jsonb"))
            )
        
        # 应用筛选条件
        if search:
            search_filter = (
                KnowledgeDocumentModel.title.ilike(f"%{search}%") |
                KnowledgeDocumentModel.filename.ilike(f"%{search}%")
            )
            query = query.where(search_filter)
        
        if status:
            query = query.where(KnowledgeDocumentModel.status == status)
        
        if tags and isinstance(tags, str):
            tag_list = [tag.strip() for tag in tags.split(',')]
            for tag in tag_list:
                query = query.where(KnowledgeDocumentModel.tags.contains([tag]))
        
        # Collection过滤条件
        if collection_id:
            query = query.where(KnowledgeDocumentModel.collection_id == collection_id)
        
        if metadata_template:
            query = query.where(KnowledgeDocumentModel.metadata_template == metadata_template)
        
        # 文件夹过滤条件
        if folder_id:
            query = query.where(KnowledgeDocumentModel.folder_id == folder_id)
        
        # 获取总数
        count_query = select(func.count()).select_from(query.alias())
        count_result = await db.execute(count_query)
        total = count_result.scalar()
        
        # 分页
        offset = (page - 1) * size
        query = query.offset(offset).limit(size).order_by(desc(KnowledgeDocumentModel.upload_time))
        
        result = await db.execute(query)
        documents = result.scalars().all()
        
        # 转换格式
        document_list = []
        for doc in documents:
            # 处理vector_status字段 (重要: 前端依赖这个字段显示状态)
            vector_status = None
            if doc.vector_status:
                vector_status = json.loads(doc.vector_status) if isinstance(doc.vector_status, str) else doc.vector_status
            
            # 确保metadata是字典类型
            metadata = doc.document_metadata
            if metadata is None:
                metadata = {}
            elif not isinstance(metadata, dict):
                logger.warning(f"document_metadata不是字典类型: {type(metadata)}, 转换为空字典")
                metadata = {}
            
            # 计算向量化状态 (修复: 应该是'vectorized'而不是'completed')
            vectorized = doc.status == 'vectorized'
            
            # 获取向量化配置信息
            vector_config = None
            try:
                # 基本配置
                vector_config = {
                    "chunkSize": 800,
                    "chunkOverlap": 100,
                    "chunkingStrategy": "semantic",
                    "useDefault": True,
                    "configId": "default",
                    "configName": "默认配置",
                    "isCustom": False
                }
            except Exception as e:
                logger.warning(f"获取文档 {doc.id} 的向量化配置失败: {e}")
                vector_config = {
                    "chunkSize": 800,
                    "chunkOverlap": 100,
                    "chunkingStrategy": "semantic",
                    "useDefault": True,
                    "configId": "default",
                    "configName": "默认配置",
                    "isCustom": False
                }
            
            document_list.append(KnowledgeDocument(
                id=doc.id,
                title=doc.title,
                filename=doc.filename,
                fileType=doc.file_type,
                fileSize=doc.file_size,
                uploadTime=doc.upload_time.isoformat() if doc.upload_time else datetime.utcnow().isoformat(),
                status=doc.status,
                tags=doc.tags or [],
                metadata=metadata,
                vectorStatus=vector_status,  # 修复: 使用处理过的vector_status而不是doc.status
                vectorized=vectorized,
                dualVectorized=vectorized,  # 保持兼容，但实际已不使用双向量
                vectorConfig=vector_config,
                collectionId=getattr(doc, 'collection_id', None),
                collectionName=getattr(doc, 'collection_name', None) if hasattr(doc, 'collection_name') else None,
                metadataTemplateId=getattr(doc, 'metadata_template_id', None),
                structuredMetadata=getattr(doc, 'structured_metadata', None)
            ))
        
        # 计算总页数
        total_pages = (total + size - 1) // size if total > 0 else 0
        
        logger.info(f"获取文档列表成功: {len(document_list)} 个文档, 总计 {total} 个")
        
        return PaginatedDocumentResponse(
            documents=document_list,
            total=total,
            page=page,
            size=size,
            totalPages=total_pages
        )
        
    except Exception as e:
        logger.error(f"获取文档列表失败: {e}")
        raise HTTPException(status_code=500, detail=f"获取文档列表失败: {str(e)}")

@documents_router.post("/documents/upload", response_model=UploadResponse)
async def upload_document(
    file: UploadFile = File(...),
    metadata: Optional[str] = Form(None),
    tags: Optional[str] = Form(None),
    session_id: Optional[str] = Form(None),
    collection_id: Optional[str] = Form(None, description="知识库ID"),
    metadata_template_id: Optional[str] = Form(None, description="元数据模版ID"),
    folder_id: Optional[str] = Form(None, description="文件夹ID"),
    background_tasks: BackgroundTasks = BackgroundTasks(),
    db: AsyncSession = Depends(get_db)
):
    """上传知识文档"""
    try:
        # 验证文件类型
        allowed_extensions = {'.pdf', '.txt', '.md', '.docx', '.doc'}
        file_extension = Path(file.filename).suffix.lower()
        
        if file_extension not in allowed_extensions:
            raise HTTPException(
                status_code=400, 
                detail=f"不支持的文件类型: {file_extension}。支持的类型: {', '.join(allowed_extensions)}"
            )
        
        # 检查文件大小 (50MB限制)
        MAX_FILE_SIZE = 50 * 1024 * 1024  # 50MB
        file_content = await file.read()
        file_size = len(file_content)
        
        if file_size > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=400,
                detail=f"文件大小超出限制。最大支持50MB，当前文件: {file_size / 1024 / 1024:.2f}MB"
            )
        
        # 重置文件指针
        await file.seek(0)
        
        logger.info(f"开始上传文档: {file.filename}, 大小: {file_size / 1024:.2f}KB")
        
        # 检查文件名重复（允许覆盖失败的文档）
        from db.repositories.knowledge_repository import KnowledgeDocumentRepository
        repo = KnowledgeDocumentRepository(db)
        
        existing_doc = await repo.find_by_filename(file.filename)
        if existing_doc:
            # 如果现有文档状态不是失败状态，则不允许重复上传
            if existing_doc.status not in ['failed', 'error']:
                raise HTTPException(
                    status_code=400,
                    detail=f"文件名已存在: {file.filename}。现有文档状态: {existing_doc.status}。请重命名后重新上传。"
                )
            else:
                # 如果现有文档是失败状态，先删除它
                logger.info(f"发现失败文档，将删除并重新上传: {existing_doc.id}")
                await repo.delete(existing_doc.id)
        
        # 生成文档ID和保存路径
        document_id = str(uuid.uuid4())
        timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
        safe_filename = f"{timestamp}_{file.filename}"
        
        # 解析标签
        tag_list = []
        if tags:
            import json
            try:
                tag_list = json.loads(tags) if isinstance(tags, str) else tags
            except:
                tag_list = [tag.strip() for tag in tags.split(',') if tag.strip()]
        
        # 解析元数据
        metadata_dict = {}
        if metadata:
            import json
            try:
                metadata_dict = json.loads(metadata) if isinstance(metadata, str) else metadata
            except Exception as e:
                logger.warning(f"元数据解析失败: {e}")
                metadata_dict = {}
        
        # 如果metadata中包含folderId，使用它覆盖参数中的folder_id
        if metadata_dict.get('folderId'):
            folder_id = metadata_dict.get('folderId')
            logger.info(f"从metadata中提取folder_id: {folder_id}")
        
        # 保存到存储服务
        try:
            from service.storage_service import storage_service
            
            # 读取文件数据
            file_data = await file.read()
            
            # 使用正确的upload_document方法
            object_name, file_url, file_size_verified = await storage_service.upload_document(
                file_data=file_data,
                filename=safe_filename,
                content_type=file.content_type or "application/octet-stream",
                metadata=metadata_dict
            )
            
            storage_path = object_name  # 使用object_name作为storage_path
            logger.info(f"文档保存成功: {storage_path}, URL: {file_url}")
        except Exception as e:
            logger.error(f"保存文档到存储失败: {e}")
            raise HTTPException(status_code=500, detail=f"保存文档失败: {str(e)}")
        
        # 创建数据库记录
        document_data = {
            "id": document_id,
            "title": metadata_dict.get("title", Path(file.filename).stem),
            "filename": file.filename,
            "file_type": file_extension,
            "file_size": file_size,
            "file_path": storage_path,
            "status": "uploaded",
            "tags": tag_list,
            "metadata": metadata_dict,
            "collection_id": collection_id,
            "metadata_template_id": metadata_template_id,
            "folder_id": folder_id,
            "upload_time": datetime.utcnow(),
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        
        try:
            document = await repo.create(document_data)
            logger.info(f"文档记录创建成功: {document_id}")
        except Exception as e:
            logger.error(f"创建文档记录失败: {e}")
            # 清理已上传的文件
            try:
                await storage_service.delete_file(storage_path)
            except:
                pass
            raise HTTPException(status_code=500, detail=f"创建文档记录失败: {str(e)}")
        
        # 添加后台处理任务（自动向量化）
        background_tasks.add_task(
            _process_document_background,
            document_id,
            storage_path,
            session_id or "auto"  # 如果没有session_id，使用"auto"
        )
        logger.info(f"已添加文档处理后台任务: {document_id}")
        
        return UploadResponse(
            success=True,
            message=f"文档上传成功: {file.filename}",
            document_id=document_id,
            filename=file.filename
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"上传文档失败: {e}")
        raise HTTPException(status_code=500, detail=f"上传文档失败: {str(e)}")


@documents_router.delete("/documents/{document_id}")
async def delete_document(
    document_id: str,
    db: AsyncSession = Depends(get_db)
):
    """删除单个文档"""
    try:
        from db.repositories.knowledge_repository import KnowledgeDocumentRepository
        repo = KnowledgeDocumentRepository(db)
        
        # 检查文档是否存在
        document = await repo.get_by_id(document_id)
        if not document:
            raise HTTPException(status_code=404, detail="文档不存在")
        
        # 删除存储中的文件
        try:
            from service.storage_service import storage_service
            if document.file_path:
                await storage_service.delete_file(document.file_path)
                logger.info(f"删除文档文件成功: {document.file_path}")
        except Exception as e:
            logger.warning(f"删除文档文件失败: {e}")
        
        # 删除数据库记录
        await repo.delete(document_id)
        logger.info(f"文档删除成功: {document_id}")
        
        return {
            "success": True,
            "message": f"文档删除成功: {document.filename}",
            "document_id": document_id
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"删除文档失败: {e}")
        raise HTTPException(status_code=500, detail=f"删除文档失败: {str(e)}")


@documents_router.post("/documents/batch-delete")
async def batch_delete_documents(
    request: Dict[str, Any],
    db: AsyncSession = Depends(get_db)
):
    """批量删除文档"""
    try:
        document_ids = request.get('document_ids', [])
        if not document_ids:
            raise HTTPException(status_code=400, detail="请提供要删除的文档ID列表")
        
        from db.repositories.knowledge_repository import KnowledgeDocumentRepository
        repo = KnowledgeDocumentRepository(db)
        
        deleted_count = 0
        failed_deletes = []
        
        for document_id in document_ids:
            try:
                # 检查文档是否存在
                document = await repo.get_by_id(document_id)
                if not document:
                    failed_deletes.append({"id": document_id, "reason": "文档不存在"})
                    continue
                
                # 删除存储中的文件
                try:
                    from service.storage_service import storage_service
                    if document.file_path:
                        await storage_service.delete_file(document.file_path)
                except Exception as e:
                    logger.warning(f"删除文档文件失败 {document_id}: {e}")
                
                # 删除数据库记录
                await repo.delete(document_id)
                deleted_count += 1
                logger.info(f"批量删除文档成功: {document_id}")
                
            except Exception as e:
                logger.error(f"批量删除文档失败 {document_id}: {e}")
                failed_deletes.append({"id": document_id, "reason": str(e)})
        
        return {
            "success": True,
            "message": f"批量删除完成: 成功 {deleted_count} 个，失败 {len(failed_deletes)} 个",
            "deleted_count": deleted_count,
            "failed_count": len(failed_deletes),
            "failed_deletes": failed_deletes
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"批量删除文档失败: {e}")
        raise HTTPException(status_code=500, detail=f"批量删除文档失败: {str(e)}")


@documents_router.put("/documents/{document_id}", response_model=KnowledgeDocument)
async def update_document(
    document_id: str,
    request: Dict[str, Any],
    db: AsyncSession = Depends(get_db)
):
    """更新文档信息"""
    try:
        from db.repositories.knowledge_repository import KnowledgeDocumentRepository
        repo = KnowledgeDocumentRepository(db)
        
        # 检查文档是否存在
        document = await repo.get_by_id(document_id)
        if not document:
            raise HTTPException(status_code=404, detail="文档不存在")
        
        # 准备更新数据
        update_data = {}
        
        if "title" in request:
            update_data["title"] = request["title"]
        if "tags" in request:
            update_data["tags"] = request["tags"]
        if "metadata" in request:
            update_data["metadata"] = request["metadata"]
        if "collection_id" in request:
            update_data["collection_id"] = request["collection_id"]
        if "metadata_template_id" in request:
            update_data["metadata_template_id"] = request["metadata_template_id"]
        
        update_data["updated_at"] = datetime.utcnow()
        
        # 更新文档
        updated_document = await repo.update(document_id, update_data)
        logger.info(f"文档更新成功: {document_id}")
        
        # 转换为响应模型
        return KnowledgeDocument(
            id=updated_document.id,
            title=updated_document.title,
            filename=updated_document.filename,
            fileType=updated_document.file_type,
            fileSize=updated_document.file_size,
            uploadTime=updated_document.upload_time.isoformat(),
            status=updated_document.status,
            tags=updated_document.tags or [],
            metadata=updated_document.metadata or {},
            vectorStatus=updated_document.status,
            vectorized=(updated_document.status == "vectorized"),
            dualVectorized=(updated_document.status == "vectorized"),
            vectorConfig=None,
            collectionId=getattr(updated_document, 'collection_id', None),
            collectionName=None,
            metadataTemplateId=getattr(updated_document, 'metadata_template_id', None),
            structuredMetadata=getattr(updated_document, 'structured_metadata', None)
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"更新文档失败: {e}")
        raise HTTPException(status_code=500, detail=f"更新文档失败: {str(e)}")


@documents_router.get("/documents/{document_id}/status")
async def get_document_status(
    document_id: str,
    db: AsyncSession = Depends(get_db)
):
    """获取文档状态"""
    try:
        from db.repositories.knowledge_repository import KnowledgeDocumentRepository
        repo = KnowledgeDocumentRepository(db)
        
        document = await repo.get_by_id(document_id)
        if not document:
            raise HTTPException(status_code=404, detail="文档不存在")
        
        status_info = {
            "document_id": document_id,
            "status": document.status,
            "vectorized": (document.status == "vectorized"),
            "upload_time": document.upload_time.isoformat() if document.upload_time else None,
            "updated_time": document.updated_at.isoformat() if document.updated_at else None,
            "file_size": document.file_size,
            "processing_metadata": document.metadata or {}
        }
        
        logger.info(f"获取文档状态: {document_id} -> {document.status}")
        return status_info
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"获取文档状态失败: {e}")
        raise HTTPException(status_code=500, detail=f"获取文档状态失败: {str(e)}")


@documents_router.delete("/documents/clear-pending")
async def clear_pending_documents(db: AsyncSession = Depends(get_db)):
    """清理待处理文档"""
    try:
        from db.repositories.knowledge_repository import KnowledgeDocumentRepository
        repo = KnowledgeDocumentRepository(db)
        
        # 查询待处理文档
        result = await db.execute(
            select(KnowledgeDocumentModel).where(
                KnowledgeDocumentModel.status == 'pending'
            )
        )
        pending_docs = result.scalars().all()
        
        deleted_count = 0
        for doc in pending_docs:
            try:
                # 删除存储文件
                try:
                    from service.storage_service import storage_service
                    if doc.file_path:
                        await storage_service.delete_file(doc.file_path)
                except Exception as e:
                    logger.warning(f"删除待处理文档文件失败 {doc.id}: {e}")
                
                # 删除数据库记录
                await repo.delete(doc.id)
                deleted_count += 1
                
            except Exception as e:
                logger.error(f"删除待处理文档失败 {doc.id}: {e}")
        
        logger.info(f"清理待处理文档完成: {deleted_count} 个")
        return {
            "success": True,
            "message": f"清理完成，删除 {deleted_count} 个待处理文档",
            "deleted_count": deleted_count
        }
        
    except Exception as e:
        logger.error(f"清理待处理文档失败: {e}")
        raise HTTPException(status_code=500, detail=f"清理待处理文档失败: {str(e)}")


@documents_router.delete("/documents/clear-problematic")
async def clear_problematic_documents(db: AsyncSession = Depends(get_db)):
    """清理问题文档（失败和待处理）"""
    try:
        from db.repositories.knowledge_repository import KnowledgeDocumentRepository
        repo = KnowledgeDocumentRepository(db)
        
        # 查询问题文档
        result = await db.execute(
            select(KnowledgeDocumentModel).where(
                or_(
                    KnowledgeDocumentModel.status == 'failed',
                    KnowledgeDocumentModel.status == 'pending'
                )
            )
        )
        problematic_docs = result.scalars().all()
        
        deleted_count = 0
        for doc in problematic_docs:
            try:
                # 删除存储文件
                try:
                    from service.storage_service import storage_service
                    if doc.file_path:
                        await storage_service.delete_file(doc.file_path)
                except Exception as e:
                    logger.warning(f"删除问题文档文件失败 {doc.id}: {e}")
                
                # 删除数据库记录
                await repo.delete(doc.id)
                deleted_count += 1
                
            except Exception as e:
                logger.error(f"删除问题文档失败 {doc.id}: {e}")
        
        logger.info(f"清理问题文档完成: {deleted_count} 个")
        return {
            "success": True,
            "message": f"清理完成，删除 {deleted_count} 个问题文档",
            "deleted_count": deleted_count
        }
        
    except Exception as e:
        logger.error(f"清理问题文档失败: {e}")
        raise HTTPException(status_code=500, detail=f"清理问题文档失败: {str(e)}")


@documents_router.post("/documents/check-duplicate")
async def check_duplicate_filename(
    request: Dict[str, Any],
    db: AsyncSession = Depends(get_db)
):
    """检查文件名是否重复（考虑文档状态）"""
    try:
        filenames = request.get('filenames', [])
        if not filenames:
            raise HTTPException(status_code=400, detail="文件名列表不能为空")
        
        from db.repositories.knowledge_repository import KnowledgeDocumentRepository
        repo = KnowledgeDocumentRepository(db)
        
        duplicate_files = []
        
        for filename in filenames:
            # 检查所有文件类型的重复
            existing_doc = await repo.find_by_filename(filename)
            if existing_doc:
                # 如果现有文档状态不是失败状态，才认为是真正的重复
                if existing_doc.status not in ['failed', 'error']:
                    duplicate_files.append({
                        'filename': filename,
                        'existingDocId': existing_doc.id,
                        'existingDocTitle': existing_doc.title,
                        'existingDocStatus': existing_doc.status
                    })
                else:
                    # 失败的文档可以被覆盖，记录但不阻止上传
                    logger.info(f"发现失败文档可被覆盖: {filename} (状态: {existing_doc.status})")
        
        return {
            'hasDuplicates': len(duplicate_files) > 0,
            'duplicateFiles': duplicate_files
        }
        
    except Exception as e:
        logger.error(f"检查文件名重复失败: {e}")
        raise HTTPException(status_code=500, detail=f"检查重复文件失败: {str(e)}")


# 后台处理函数
async def _process_document_background(document_id: str, file_path: str, session_id: str):
    """后台处理文档（向量化等）"""
    try:
        logger.info(f"开始后台处理文档: {document_id}")
        
        # 调用知识服务进行向量化处理
        from service.knowledge_service import knowledge_service
        await knowledge_service.extract_and_vectorize_document(
            document_id=document_id,
            file_path=file_path,
            session_id=session_id
        )
        
        logger.info(f"文档向量化处理完成: {document_id}")
        from db.repositories.knowledge_repository import KnowledgeDocumentRepository
        
        async with get_async_session() as session:
            repo = KnowledgeDocumentRepository(session)
            await repo.update(document_id, {
                "status": "vectorized",
                "updated_at": datetime.utcnow()
            })
        
        logger.info(f"文档后台处理完成: {document_id}")
        
    except Exception as e:
        logger.error(f"文档后台处理失败 {document_id}: {e}")
        
        # 更新状态为失败
        try:
            async with get_async_session() as session:
                repo = KnowledgeDocumentRepository(session)
                await repo.update(document_id, {
                    "status": "failed",
                    "updated_at": datetime.utcnow(),
                    "metadata": {"error": str(e)}
                })
        except Exception as update_error:
            logger.error(f"更新失败状态时出错: {update_error}")