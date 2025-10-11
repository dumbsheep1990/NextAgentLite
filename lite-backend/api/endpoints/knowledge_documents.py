"""
知识库文档管理端点 - 从knowledge.py安全拆分出来的文档CRUD功能
包含文档上传、删除、更新、批量操作等核心文档管理功能
"""
from typing import Dict, Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, File, UploadFile, Form, BackgroundTasks, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, text, and_, or_, desc
from sqlalchemy.exc import IntegrityError
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
    # 为前端兼容，增加documents列表（简化版）
    documents: Optional[List["KnowledgeDocument"]] = None
    # 自动QA提取任务反馈
    qa_task_submitted: Optional[bool] = None
    qa_task_id: Optional[str] = None
    
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
        
        # 规范化处理配置：将前端的切分配置参数映射到 document_metadata.processing_config
        processing_config = {}
        if isinstance(metadata_dict, dict):
            # 兼容前端camelCase命名
            if metadata_dict.get('chunkingConfigId'):
                processing_config['chunking_config_id'] = metadata_dict.get('chunkingConfigId')
            if metadata_dict.get('customChunkSize') is not None:
                processing_config['custom_chunk_size'] = metadata_dict.get('customChunkSize')
            if metadata_dict.get('customChunkOverlap') is not None:
                processing_config['custom_chunk_overlap'] = metadata_dict.get('customChunkOverlap')

        # 组装 document_metadata（保留原有字段并注入 processing_config）
        document_metadata = {}
        if isinstance(metadata_dict, dict):
            document_metadata.update(metadata_dict)
        if processing_config:
            base_pc = document_metadata.get('processing_config', {})
            if not isinstance(base_pc, dict):
                base_pc = {}
            base_pc.update(processing_config)
            document_metadata['processing_config'] = base_pc

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
            # 关键修复：使用模型字段 document_metadata，包含 processing_config
            "document_metadata": document_metadata,
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
                bucket = getattr(storage_service.config, 'documents_bucket', 'documents')
                await storage_service.delete_file(bucket_name=bucket, object_name=storage_path)
            except:
                pass
            raise HTTPException(status_code=500, detail=f"创建文档记录失败: {str(e)}")

        # 如果知识库开启了自动QA提取，则自动提交QA提取任务（与增强端点行为一致）
        qa_task_submitted = False
        qa_task_id: Optional[str] = None
        try:
            if collection_id:
                from models.knowledge_collection import KnowledgeCollection
                result = await db.execute(select(KnowledgeCollection).where(KnowledgeCollection.id == collection_id))
                coll = result.scalar_one_or_none()
                if not coll:
                    logger.info(f"未找到集合 {collection_id}，跳过自动QA提取")
                elif not getattr(coll, 'auto_qa_extraction_enabled', False):
                    logger.info(f"集合 {collection_id} 未启用自动QA提取(auto_qa_extraction_enabled=False)，跳过")
                else:
                    # 组装提取配置：优先使用集合配置，否则给默认值
                    qa_config = None
                    try:
                        if isinstance(coll.qa_extraction_config, dict):
                            qa_config = coll.qa_extraction_config
                    except Exception:
                        qa_config = None
                    if not qa_config:
                        qa_config = {
                            "chunk_size": 1200,
                            "chunk_overlap": 100,
                            "qa_count_per_chunk": 3,
                            "language": "zh",
                            "quality_threshold": 0.7,
                            "include_summary": True
                        }
                    logger.info(f"准备提交自动QA提取任务: collection_id={collection_id}, doc_id={document_id}, qa_cfg_keys={list(qa_config.keys())}")
                    # 提交QA提取任务
                    from service.unified_qa_extraction_service import unified_qa_extraction_service
                    task_id = await unified_qa_extraction_service.submit_extraction_task(
                        document_id=document_id,
                        document_title=document_data['title'],
                        collection_id=collection_id,
                        priority=5,
                        extraction_config=qa_config,
                        auto_create_dataset=True,
                        dataset_naming_pattern=f"{Path(file.filename).stem}_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}_qa"
                    )
                    qa_task_submitted = True
                    qa_task_id = str(task_id)
                    # 更新文档的QA提取字段
                    # 旧表结构的 qa_extraction_task_id 为整数，当前任务ID为UUID，避免类型不匹配，暂不写入该字段
                    await repo.update_fields(document_id, {
                        "auto_qa_extraction_enabled": True,
                        "qa_extraction_status": "pending",
                        "qa_extraction_started_at": datetime.utcnow(),
                        "qa_extraction_config": qa_config
                    })
                    logger.info(f"✅ 自动QA提取任务已提交: {task_id}（document_id={document_id}, collection_id={collection_id}）")
        except Exception as qa_err:
            # 自动触发失败不应阻断上传流程，仅记录日志
            logger.warning(f"自动QA提取触发失败(已忽略): {qa_err}")
        
        # 添加后台处理任务（自动向量化）
        background_tasks.add_task(
            _process_document_background,
            document_id,
            storage_path,
            session_id or "auto"  # 如果没有session_id，使用"auto"
        )
        logger.info(f"已添加文档处理后台任务: {document_id}")
        
        # 组装前端期望的documents数组（最小必要字段）
        try:
            created_doc = await repo.get_by_id(document_id)
            kd = KnowledgeDocument(
                id=created_doc.id,
                title=created_doc.title,
                filename=created_doc.filename,
                fileType=created_doc.file_type,
                fileSize=created_doc.file_size,
                uploadTime=created_doc.upload_time.isoformat() if created_doc.upload_time else datetime.utcnow().isoformat(),
                status=created_doc.status,
                tags=created_doc.tags or [],
                metadata=created_doc.document_metadata or {},
                vectorStatus=created_doc.vector_status or {},
                vectorized=(created_doc.status == 'vectorized'),
                dualVectorized=(created_doc.status == 'vectorized'),
                vectorConfig=None,
                collectionId=getattr(created_doc, 'collection_id', None),
                collectionName=None,
                metadataTemplateId=getattr(created_doc, 'metadata_template_id', None),
                structuredMetadata=getattr(created_doc, 'structured_metadata', None)
            )
            docs_resp = [kd]
        except Exception:
            docs_resp = None

        return UploadResponse(
            success=True,
            message=f"文档上传成功: {file.filename}" + ("，QA提取任务已启动" if qa_task_submitted else ""),
            document_id=document_id,
            filename=file.filename,
            documents=docs_resp,
            qa_task_submitted=qa_task_submitted,
            qa_task_id=qa_task_id
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"上传文档失败: {e}")
        raise HTTPException(status_code=500, detail=f"上传文档失败: {str(e)}")


@documents_router.delete("/documents/{document_id}")
async def delete_document(
    document_id: str,
    force: bool = Query(False, description="是否强制删除（跳过业务校验，级联清理所有引用）"),
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
        
        # 预先缓存需要返回的字段，避免删除后再访问触发IO
        _filename = document.filename

        # 如果开启强制删除，直接走强制解环与物理删除流程
        if force:
            try:
                stats = await _force_delete_document(db, document_id)
                return {
                    "success": True,
                    "message": f"强制删除成功: {_filename}",
                    "document_id": document_id,
                    "stats": stats
                }
            except Exception as e:
                logger.error(f"强制删除失败 {document_id}: {e}")
                raise HTTPException(status_code=500, detail=f"强制删除失败: {str(e)}")
        
        # 删除存储中的文件
        try:
            from service.storage_service import storage_service
            if document.file_path:
                # StorageService.delete_file 需要 bucket_name 和 object_name
                bucket = getattr(storage_service.config, 'documents_bucket', 'documents')
                await storage_service.delete_file(bucket_name=bucket, object_name=document.file_path)
                logger.info(f"删除文档文件成功: {document.file_path}")
        except Exception as e:
            logger.warning(f"删除文档文件失败: {e}")
        
        # 先清理与该文档相关的QA/任务等外键引用，避免FK约束失败
        try:
            # 1) 简化qa生成流水线遗留数据
            await db.execute(text("""
                DELETE FROM generated_qa_pairs
                WHERE task_id IN (
                  SELECT id FROM qa_generation_tasks WHERE document_id = :doc_id
                )
            """), {"doc_id": document_id})
            await db.execute(text("""
                DELETE FROM qa_generation_tasks WHERE document_id = :doc_id
            """), {"doc_id": document_id})

            # 2) 先删除引用提取队列的 qa_pairs（避免删除队列时被 fk_qa_pairs_extraction_task 拦截）
            await db.execute(text("""
                DELETE FROM qa_pairs 
                WHERE extraction_task_id IN (
                    SELECT id FROM qa_extraction_queue WHERE document_id = :doc_id
                )
                OR extraction_task_id IN (
                    SELECT id FROM qa_extraction_queue WHERE target_dataset_id IN (
                        SELECT id FROM qa_datasets WHERE source_document_id = :doc_id
                    )
                )
            """), {"doc_id": document_id})

            # 3) 解环：将 qa_datasets.extraction_task_id 置空，避免删除队列时被FK拦截
            await db.execute(text("""
                UPDATE qa_datasets SET extraction_task_id = NULL
                WHERE extraction_task_id IN (
                    SELECT id FROM qa_extraction_queue WHERE document_id = :doc_id
                )
            """), {"doc_id": document_id})

            # 4) 同步解环：将队列中指向该文档派生数据集的 target_dataset_id 置空
            await db.execute(text("""
                UPDATE qa_extraction_queue SET target_dataset_id = NULL
                WHERE target_dataset_id IN (
                    SELECT id FROM qa_datasets WHERE source_document_id = :doc_id
                )
            """), {"doc_id": document_id})

            # 5) 删除qa提取队列（按文档ID & 兜底按数据集）
            await db.execute(text("""
                DELETE FROM qa_extraction_queue WHERE document_id = :doc_id
            """), {"doc_id": document_id})
            # 再次兜底：删除仍残留的按数据集关联的队列项
            await db.execute(text("""
                DELETE FROM qa_extraction_queue WHERE target_dataset_id IN (
                    SELECT id FROM qa_datasets WHERE source_document_id = :doc_id
                )
            """), {"doc_id": document_id})

            # 6) 先删除 qa_pairs 中引用这些数据集的记录（如有该表）
            try:
                await db.execute(text("""
                    DELETE FROM qa_pairs WHERE dataset_id IN (
                        SELECT id FROM qa_datasets WHERE source_document_id = :doc_id
                    )
                """), {"doc_id": document_id})
            except Exception:
                # qa_pairs 表可能不存在，忽略
                pass

            # 7) 删除该文档派生的数据集
            await db.execute(text("""
                DELETE FROM qa_datasets WHERE source_document_id = :doc_id
            """), {"doc_id": document_id})

            await db.commit()
            logger.info(f"已清理文档 {document_id} 的QA/任务/数据集引用")
        except Exception as clean_err:
            try:
                await db.rollback()
            except Exception:
                pass
            logger.warning(f"清理文档关联数据失败（将继续尝试删除文档本体）: {clean_err}")

        # 为稳妥起见，确认清理后是否仍存在引用的数据集
        try:
            remain = await db.execute(text("SELECT COUNT(*) FROM qa_datasets WHERE source_document_id = :doc_id"), {"doc_id": document_id})
            cnt = int(remain.scalar() or 0)
            if cnt > 0:
                await db.execute(text("DELETE FROM qa_datasets WHERE source_document_id = :doc_id"), {"doc_id": document_id})
                await db.commit()
                logger.info(f"再次清理数据集引用: {document_id}, 删除 {cnt} 条")
        except Exception as _:
            pass

        # 附加清理：与爬虫结果的关联
        try:
            await db.execute(text("DELETE FROM crawl_results WHERE document_id = :doc_id"), {"doc_id": document_id})
            await db.commit()
        except Exception:
            try:
                await db.rollback()
            except Exception:
                pass

        # 删除数据库记录（包含分块）
        try:
            await repo.delete(document_id)
        except IntegrityError as ie:
            logger.warning(f"首次删除文档发生外键约束，尝试强制再次清理并重试: {ie}")
            try:
                try:
                    await db.rollback()
                except Exception:
                    pass
                # 解环并清理（重试路径）
                # 再次删除引用提取队列的 qa_pairs，避免队列删除受阻
                try:
                    await db.execute(text("""
                        DELETE FROM qa_pairs 
                        WHERE extraction_task_id IN (
                            SELECT id FROM qa_extraction_queue WHERE document_id = :doc_id
                        )
                        OR extraction_task_id IN (
                            SELECT id FROM qa_extraction_queue WHERE target_dataset_id IN (
                                SELECT id FROM qa_datasets WHERE source_document_id = :doc_id
                            )
                        )
                    """), {"doc_id": document_id})
                except Exception:
                    pass

                try:
                    await db.execute(text("UPDATE qa_datasets SET extraction_task_id = NULL WHERE extraction_task_id IN (SELECT id FROM qa_extraction_queue WHERE document_id = :doc_id)"), {"doc_id": document_id})
                except Exception:
                    pass
                try:
                    await db.execute(text("UPDATE qa_extraction_queue SET target_dataset_id = NULL WHERE target_dataset_id IN (SELECT id FROM qa_datasets WHERE source_document_id = :doc_id)"), {"doc_id": document_id})
                except Exception:
                    pass
                try:
                    await db.execute(text("DELETE FROM qa_extraction_queue WHERE document_id = :doc_id"), {"doc_id": document_id})
                    await db.execute(text("DELETE FROM qa_extraction_queue WHERE target_dataset_id IN (SELECT id FROM qa_datasets WHERE source_document_id = :doc_id)"), {"doc_id": document_id})
                except Exception:
                    pass
                try:
                    await db.execute(text("DELETE FROM qa_pairs WHERE dataset_id IN (SELECT id FROM qa_datasets WHERE source_document_id = :doc_id)"), {"doc_id": document_id})
                except Exception:
                    pass
                # 关键补强：无条件再次清扫仍引用该文档的数据集
                try:
                    # 先将仍然存在的 datasets 的 extraction_task_id 置空
                    await db.execute(text("UPDATE qa_datasets SET extraction_task_id = NULL WHERE source_document_id = :doc_id"), {"doc_id": document_id})
                except Exception:
                    pass
                try:
                    await db.execute(text("DELETE FROM qa_datasets WHERE source_document_id = :doc_id"), {"doc_id": document_id})
                except Exception as e_del_ds:
                    logger.warning(f"二次清理数据集失败（将继续重试删除文档）: {e_del_ds}")
                try:
                    await db.execute(text("DELETE FROM crawl_results WHERE document_id = :doc_id"), {"doc_id": document_id})
                except Exception:
                    pass
                await db.commit()
                # 最终重试删除文档
                await repo.delete(document_id)
            except Exception as re:
                logger.error(f"二次清理后删除仍失败: {re}")
                raise
        logger.info(f"文档删除成功: {document_id}")
        
        return {
            "success": True,
            "message": f"文档删除成功: {_filename}",
            "document_id": document_id
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"删除文档失败: {e}")
        raise HTTPException(status_code=500, detail=f"删除文档失败: {str(e)}")


async def _force_delete_document(db: AsyncSession, document_id: str) -> Dict[str, Any]:
    """直接使用SQL强制清理所有外键引用并删除文档（在一个事务中）。"""
    from sqlalchemy import text as _text
    stats = {
        "deleted_generated_qa_pairs": 0,
        "deleted_qa_generation_tasks": 0,
        "deleted_queue_pairs": 0,
        "updated_queue_targets": 0,
        "deleted_queues": 0,
        "deleted_dataset_pairs": 0,
        "deleted_datasets": 0,
        "deleted_chunks": 0,
        "deleted_crawl_results": 0,
        "deleted_doc_pairs": 0,
        "deleted_documents": 0,
    }
    try:
        # 1) QA生成流水
        r = await db.execute(_text("""
            WITH t AS (
              SELECT id FROM qa_generation_tasks WHERE document_id = :doc
            )
            DELETE FROM generated_qa_pairs WHERE task_id IN (SELECT id FROM t)
        """), {"doc": document_id})
        stats["deleted_generated_qa_pairs"] += r.rowcount or 0
        r = await db.execute(_text("DELETE FROM qa_generation_tasks WHERE document_id=:doc"), {"doc": document_id})
        stats["deleted_qa_generation_tasks"] += r.rowcount or 0

        # 2) 先删引用提取队列的 qa_pairs
        r = await db.execute(_text("""
            DELETE FROM qa_pairs WHERE extraction_task_id IN (
              SELECT id FROM qa_extraction_queue WHERE document_id = :doc
            )
        """), {"doc": document_id})
        stats["deleted_queue_pairs"] += r.rowcount or 0
        r = await db.execute(_text("""
            DELETE FROM qa_pairs WHERE extraction_task_id IN (
              SELECT id FROM qa_extraction_queue WHERE target_dataset_id IN (
                SELECT id FROM qa_datasets WHERE source_document_id = :doc
              )
            )
        """), {"doc": document_id})
        stats["deleted_queue_pairs"] += r.rowcount or 0

        # 3) 将队列表中指向该文档的数据集的target_dataset置空
        r = await db.execute(_text("""
            UPDATE qa_extraction_queue SET target_dataset_id = NULL
            WHERE target_dataset_id IN (
              SELECT id FROM qa_datasets WHERE source_document_id = :doc
            )
        """), {"doc": document_id})
        stats["updated_queue_targets"] += r.rowcount or 0

        # 4) 删除与文档相关的队列
        r = await db.execute(_text("DELETE FROM qa_extraction_queue WHERE document_id = :doc"), {"doc": document_id})
        stats["deleted_queues"] += r.rowcount or 0
        r = await db.execute(_text("""
            DELETE FROM qa_extraction_queue WHERE target_dataset_id IN (
              SELECT id FROM qa_datasets WHERE source_document_id = :doc
            )
        """), {"doc": document_id})
        stats["deleted_queues"] += r.rowcount or 0

        # 5) 删除指向数据集的 qa_pairs
        r = await db.execute(_text("""
            DELETE FROM qa_pairs WHERE dataset_id IN (
              SELECT id FROM qa_datasets WHERE source_document_id = :doc
            )
        """), {"doc": document_id})
        stats["deleted_dataset_pairs"] += r.rowcount or 0

        # 6) 删除数据集
        r = await db.execute(_text("DELETE FROM qa_datasets WHERE source_document_id = :doc"), {"doc": document_id})
        stats["deleted_datasets"] += r.rowcount or 0

        # 7) 文档分块、爬虫结果、直接指向文档的qa_pairs
        r = await db.execute(_text("DELETE FROM document_chunks WHERE document_id = :doc"), {"doc": document_id})
        stats["deleted_chunks"] += r.rowcount or 0
        r = await db.execute(_text("DELETE FROM crawl_results WHERE document_id = :doc"), {"doc": document_id})
        stats["deleted_crawl_results"] += r.rowcount or 0
        r = await db.execute(_text("DELETE FROM qa_pairs WHERE source_document_id = :doc"), {"doc": document_id})
        stats["deleted_doc_pairs"] += r.rowcount or 0

        # 8) 删除文档本体
        r = await db.execute(_text("DELETE FROM knowledge_documents WHERE id = :doc"), {"doc": document_id})
        stats["deleted_documents"] += r.rowcount or 0

        await db.commit()
        
        # 9) 清理 Elasticsearch 索引残留（不影响事务，尽力而为）
        try:
            from service.hybrid_search_service import hybrid_search_service
            # 删除分块向量
            try:
                dq = {"query": {"term": {"document_id": document_id}}}
                es_resp = await hybrid_search_service.es.delete_by_query(index="mat_qa_chunks", body=dq)
                stats["deleted_es_chunks"] = es_resp.get('deleted', 0)
            except Exception:
                stats["deleted_es_chunks"] = 0
            # 删除文档索引（如存在）
            try:
                await hybrid_search_service.es.delete(index="mat_qa_documents", id=document_id)
                stats["deleted_es_doc"] = 1
            except Exception:
                stats["deleted_es_doc"] = 0
        except Exception:
            # ES 客户端不可用时忽略
            pass
        
        return stats
    except Exception:
        try:
            await db.rollback()
        except Exception:
            pass
        raise


# 额外提供一个显式的强制删除端点，便于前端调用
@documents_router.delete("/documents/{document_id}/force")
async def force_delete_document(
    document_id: str,
    db: AsyncSession = Depends(get_db)
):
    try:
        stats = await _force_delete_document(db, document_id)
        return {"success": True, "message": "强制删除成功", "document_id": document_id, "stats": stats}
    except Exception as e:
        logger.error(f"强制删除失败 {document_id}: {e}")
        raise HTTPException(status_code=500, detail=f"强制删除失败: {str(e)}")


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
                        bucket = getattr(storage_service.config, 'documents_bucket', 'documents')
                        await storage_service.delete_file(bucket_name=bucket, object_name=document.file_path)
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
            metadata=updated_document.document_metadata or {},
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
            # 修复：使用 document_document_metadata，避免 SQLAlchemy MetaData 对象导致编码递归
            "processing_metadata": getattr(document, 'document_metadata', {}) or {}
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
                        bucket = getattr(storage_service.config, 'documents_bucket', 'documents')
                        await storage_service.delete_file(bucket_name=bucket, object_name=doc.file_path)
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
                        bucket = getattr(storage_service.config, 'documents_bucket', 'documents')
                        await storage_service.delete_file(bucket_name=bucket, object_name=doc.file_path)
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
    # 确保仓储类在任何异常情况下都可用（避免局部导入导致未绑定）
    from db.repositories.knowledge_repository import KnowledgeDocumentRepository
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
                    # 注意：字段应为 document_metadata，而非 metadata，避免与SQLAlchemy MetaData冲突
                    "document_metadata": {"error": str(e)}
                })
        except Exception as update_error:
            logger.error(f"更新失败状态时出错: {update_error}")
