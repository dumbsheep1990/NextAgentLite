"""
增强的文档上传端点 - 支持自动QA提取
"""

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
import os
import uuid
import json
from pathlib import Path
from datetime import datetime

from db.database import get_db
from core.logger import logger
from service.unified_qa_extraction_service import unified_qa_extraction_service
from api.endpoints.knowledge import process_document_content  # 复用统一的处理/向量化流程

router = APIRouter()


class EnhancedUploadRequest(BaseModel):
    """增强的上传请求"""
    auto_qa_extraction: bool = Field(default=False, description="是否启用自动QA提取")
    qa_extraction_config: Optional[Dict[str, Any]] = Field(default=None, description="QA提取配置")
    qa_extraction_priority: int = Field(default=5, description="QA提取优先级(1-10)")
    auto_create_dataset: bool = Field(default=True, description="是否自动创建QA数据集")
    dataset_naming_pattern: Optional[str] = Field(default=None, description="数据集命名模式")


class EnhancedUploadResponse(BaseModel):
    """增强的上传响应"""
    success: bool
    message: str
    document_id: str
    filename: str
    qa_extraction_enabled: bool = False
    qa_extraction_task_id: Optional[str] = None
    estimated_qa_pairs: Optional[int] = None


@router.post("/documents/upload-with-qa", response_model=EnhancedUploadResponse)
async def upload_document_with_qa_extraction(
    file: UploadFile = File(...),
    metadata: Optional[str] = Form(None),
    tags: Optional[str] = Form(None),
    session_id: Optional[str] = Form(None),
    collection_id: Optional[str] = Form(None, description="知识库ID"),
    metadata_template_id: Optional[str] = Form(None, description="元数据模版ID"),
    folder_id: Optional[str] = Form(None, description="文件夹ID"),
    auto_qa_extraction: bool = Form(default=False, description="是否启用自动QA提取"),
    qa_extraction_priority: int = Form(default=5, description="QA提取优先级(1-10)"),
    auto_create_dataset: bool = Form(default=True, description="是否自动创建QA数据集"),
    qa_extraction_config: Optional[str] = Form(default=None, description="QA提取配置(JSON)"),
    dataset_naming_pattern: Optional[str] = Form(default=None, description="数据集命名模式"),
    background_tasks: BackgroundTasks = BackgroundTasks(),
    db: AsyncSession = Depends(get_db)
):
    """
    上传知识文档并支持自动QA提取
    
    支持的功能：
    1. 标准文档上传
    2. 可选的自动QA提取
    3. 自动创建QA数据集
    4. 优先级队列管理
    5. 自定义配置参数
    """
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
        
        logger.info(f"开始上传文档: {file.filename}, 大小: {file_size / 1024:.2f}KB, QA提取: {auto_qa_extraction}")
        
        # 检查文件名重复
        from db.repositories.knowledge_repository import KnowledgeDocumentRepository
        repo = KnowledgeDocumentRepository(db)
        
        existing_doc = await repo.find_by_filename(file.filename)
        if existing_doc:
            raise HTTPException(
                status_code=400,
                detail=f"文件名已存在: {file.filename}。请重命名后重新上传。"
            )
        
        # 生成文档ID和保存路径
        document_id = str(uuid.uuid4())
        timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
        safe_filename = f"{timestamp}_{file.filename}"
        
        # 解析标签
        tag_list = []
        if tags:
            try:
                tag_list = json.loads(tags) if isinstance(tags, str) else tags
            except:
                tag_list = [tag.strip() for tag in tags.split(',') if tag.strip()]
        
        # 解析元数据
        metadata_dict = {}
        if metadata:
            try:
                metadata_dict = json.loads(metadata) if isinstance(metadata, str) else metadata
            except Exception as e:
                logger.warning(f"元数据解析失败: {e}")
                metadata_dict = {}
        
        # 如果metadata中包含folderId，使用它覆盖参数中的folder_id
        if metadata_dict.get('folderId'):
            folder_id = metadata_dict.get('folderId')
            logger.info(f"从metadata中提取folder_id: {folder_id}")
        
        # 解析QA提取配置
        qa_config = {}
        if qa_extraction_config:
            try:
                qa_config = json.loads(qa_extraction_config) if isinstance(qa_extraction_config, str) else qa_extraction_config
            except Exception as e:
                logger.warning(f"QA提取配置解析失败: {e}")
                qa_config = {}
        
        # 默认QA提取配置
        if auto_qa_extraction and not qa_config:
            qa_config = {
                "chunk_size": 1200,
                "chunk_overlap": 100,
                "qa_count_per_chunk": 3,
                "language": "zh",
                "quality_threshold": 0.7,
                "include_summary": True
            }
        
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
                metadata={
                    "original_filename": file.filename,
                    "collection_id": collection_id,
                    "folder_id": folder_id
                }
            )
            
            storage_path = object_name  # 使用object_name作为storage_path
            logger.info(f"文档保存成功: {storage_path}, URL: {file_url}")
        except Exception as e:
            logger.error(f"保存文档到存储失败: {e}")
            raise HTTPException(status_code=500, detail=f"保存文档失败: {str(e)}")
        
        # 创建数据库记录 - 包含QA提取字段
        document_data = {
            "id": document_id,
            "title": metadata_dict.get("title", Path(file.filename).stem),
            "filename": file.filename,
            "file_type": file_extension,
            "file_size": file_size,
            "file_path": storage_path,
            # 与统一上传保持一致：入库状态为 pending，随后进入处理队列
            "status": "pending",
            "tags": tag_list,
            "metadata": metadata_dict,
            "collection_id": collection_id,
            "metadata_template_id": metadata_template_id,
            "folder_id": folder_id,
            "upload_time": datetime.utcnow(),
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
            # QA提取相关字段
            "auto_qa_extraction_enabled": auto_qa_extraction,
            "qa_extraction_status": "not_started" if not auto_qa_extraction else "pending",
            "qa_extraction_config": qa_config if auto_qa_extraction else None
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
        
        qa_extraction_task_id = None
        estimated_qa_pairs = None
        
        # 如果启用自动QA提取，提交到队列
        if auto_qa_extraction:
            try:
                # 生成数据集命名模式
                if not dataset_naming_pattern:
                    timestamp_str = datetime.now().strftime("%Y%m%d_%H%M%S")
                    dataset_naming_pattern = f"{Path(file.filename).stem}_{timestamp_str}_qa"
                
                # 提交QA提取任务
                qa_extraction_task_id = await unified_qa_extraction_service.submit_extraction_task(
                    document_id=document_id,
                    document_title=document.title,
                    collection_id=collection_id,
                    priority=qa_extraction_priority,
                    extraction_config=qa_config,
                    auto_create_dataset=auto_create_dataset,
                    dataset_naming_pattern=dataset_naming_pattern
                )
                
                # 更新文档的QA提取任务ID
                await _update_document_qa_task_id(document_id, qa_extraction_task_id, repo)
                
                # 估算QA对数量（基于文件大小）
                estimated_qa_pairs = _estimate_qa_pairs_count(file_size, qa_config)
                
                logger.info(f"✅ QA提取任务已提交: {qa_extraction_task_id}, 预估QA对: {estimated_qa_pairs}")
                
            except Exception as e:
                logger.error(f"❌ 提交QA提取任务失败: {e}")
                # QA提取失败不影响文档上传
                await _update_document_qa_status(document_id, "failed", str(e), repo)
        
        # 添加标准的文档处理任务（内容提取与向量化）
        try:
            from service.simple_queue_service import simple_queue, TaskType
            task_id = await simple_queue.add_task(
                task_type=TaskType.DOCUMENT_PROCESSING,
                file_name=document.filename,
                file_size=document.file_size,
                handler=process_document_content,
                handler_args=(document_id, storage_path, session_id)
            )
            logger.info(f"文档处理任务已添加到队列: {task_id}")
            # Redis: 会话映射与初始快照（可选）
            try:
                from service.redis_support import add_session_task, save_task_snapshot
                await add_session_task(session_id, task_id)
                await save_task_snapshot(
                    task_id,
                    status="pending",
                    progress=0,
                    stage="已入队",
                    detail="等待处理",
                    document_id=document_id,
                    collection_id=str(collection_id) if collection_id else None,
                )
            except Exception:
                pass
        except Exception as queue_error:
            # 如果队列失败，回退到后台任务
            logger.warning(f"队列添加失败，使用后台任务: {queue_error}")
            background_tasks.add_task(process_document_content, document_id, storage_path, session_id)
            logger.info(f"已添加文档处理后台任务: {document_id}")
        
        return EnhancedUploadResponse(
            success=True,
            message=f"文档上传成功: {file.filename}" + (f", QA提取任务已启动" if auto_qa_extraction else ""),
            document_id=document_id,
            filename=file.filename,
            qa_extraction_enabled=auto_qa_extraction,
            qa_extraction_task_id=qa_extraction_task_id,
            estimated_qa_pairs=estimated_qa_pairs
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"上传文档失败: {e}")
        raise HTTPException(status_code=500, detail=f"上传文档失败: {str(e)}")


async def _update_document_qa_task_id(document_id: str, task_id: str, repo):
    """更新文档的QA提取任务ID"""
    try:
        await repo.update_fields(document_id, {
            "qa_extraction_task_id": task_id,
            "qa_extraction_started_at": datetime.utcnow(),
            "qa_extraction_status": "pending"
        })
    except Exception as e:
        logger.error(f"更新文档QA任务ID失败: {e}")


async def _update_document_qa_status(document_id: str, status: str, error_message: str, repo):
    """更新文档的QA提取状态"""
    try:
        update_data = {
            "qa_extraction_status": status,
            "updated_at": datetime.utcnow()
        }
        if error_message:
            update_data["qa_extraction_error_message"] = error_message
            
        await repo.update_fields(document_id, update_data)
    except Exception as e:
        logger.error(f"更新文档QA状态失败: {e}")


def _estimate_qa_pairs_count(file_size: int, qa_config: Dict[str, Any]) -> int:
    """
    基于文件大小和配置估算QA对数量
    
    算法：
    1. 根据文件大小估算字符数
    2. 根据chunk_size计算chunk数量
    3. 乘以每个chunk的QA数量
    """
    try:
        # 估算每字节对应的字符数（中文约0.3，英文约1）
        chars_per_byte = 0.5  # 混合文档的平均值
        estimated_chars = file_size * chars_per_byte
        
        # 从配置获取参数
        chunk_size = qa_config.get("chunk_size", 1200)
        qa_count_per_chunk = qa_config.get("qa_count_per_chunk", 3)
        
        # 计算chunk数量
        chunk_count = max(1, int(estimated_chars / chunk_size))
        
        # 计算总QA对数量
        total_qa_pairs = chunk_count * qa_count_per_chunk
        
        # 加入一些随机性，实际数量可能有20%的波动
        return int(total_qa_pairs * 0.8)  # 保守估计
        
    except Exception as e:
        logger.warning(f"估算QA对数量失败: {e}")
        return 10  # 默认估算值


async def _process_document_background(document_id: str, storage_path: str, session_id: str):
    """后台文档处理任务（原有逻辑保持不变）"""
    try:
        # 这里保持原有的文档处理逻辑
        # 例如：向量化、文本提取、元数据抽取等
        logger.info(f"开始后台处理文档: {document_id}")
        
        # 原有的处理逻辑...
        
        logger.info(f"文档后台处理完成: {document_id}")
        
    except Exception as e:
        logger.error(f"文档后台处理失败: {document_id}, 错误: {e}")


@router.get("/documents/{document_id}/qa-status")
async def get_document_qa_status(
    document_id: str,
    db: AsyncSession = Depends(get_db)
):
    """获取文档的QA提取状态"""
    try:
        from db.repositories.knowledge_repository import KnowledgeDocumentRepository
        repo = KnowledgeDocumentRepository(db)
        
        document = await repo.get_by_id(document_id)
        if not document:
            raise HTTPException(status_code=404, detail="文档不存在")
        
        qa_task_status = None
        if document.qa_extraction_task_id:
            qa_task_status = await unified_qa_extraction_service.get_task_status(
                document.qa_extraction_task_id
            )
        
        return {
            "success": True,
            "data": {
                "document_id": document_id,
                "document_title": document.title,
                "auto_qa_extraction_enabled": document.auto_qa_extraction_enabled,
                "qa_extraction_status": document.qa_extraction_status,
                "qa_extraction_task_id": document.qa_extraction_task_id,
                "qa_dataset_id": document.qa_dataset_id,
                "qa_extraction_started_at": document.qa_extraction_started_at.isoformat() if document.qa_extraction_started_at else None,
                "qa_extraction_completed_at": document.qa_extraction_completed_at.isoformat() if document.qa_extraction_completed_at else None,
                "qa_extraction_error_message": document.qa_extraction_error_message,
                "task_details": qa_task_status.__dict__ if qa_task_status else None
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"获取文档QA状态失败: {e}")
        raise HTTPException(status_code=500, detail=f"获取QA状态失败: {str(e)}")


@router.post("/documents/{document_id}/trigger-qa-extraction")
async def trigger_qa_extraction(
    document_id: str,
    request: Optional[Dict[str, Any]] = None,
    db: AsyncSession = Depends(get_db)
):
    """手动触发文档的QA提取"""
    try:
        from db.repositories.knowledge_repository import KnowledgeDocumentRepository
        repo = KnowledgeDocumentRepository(db)
        
        document = await repo.get_by_id(document_id)
        if not document:
            raise HTTPException(status_code=404, detail="文档不存在")
        
        # 检查是否已经在处理中
        if document.qa_extraction_status in ['pending', 'processing']:
            raise HTTPException(status_code=400, detail="QA提取任务正在进行中")
        
        # 获取配置参数
        priority = request.get('priority', 5) if request else 5
        auto_create_dataset = request.get('auto_create_dataset', True) if request else True
        qa_config = request.get('qa_extraction_config', {}) if request else {}
        
        if not qa_config:
            qa_config = {
                "chunk_size": 1200,
                "chunk_overlap": 100,
                "qa_count_per_chunk": 3,
                "language": "zh",
                "quality_threshold": 0.7
            }
        
        # 提交QA提取任务
        timestamp_str = datetime.now().strftime("%Y%m%d_%H%M%S")
        dataset_naming_pattern = f"{document.title}_{timestamp_str}_qa_manual"
        
        qa_extraction_task_id = await unified_qa_extraction_service.submit_extraction_task(
            document_id=document_id,
            document_title=document.title,
            collection_id=document.collection_id,
            priority=priority,
            extraction_config=qa_config,
            auto_create_dataset=auto_create_dataset,
            dataset_naming_pattern=dataset_naming_pattern
        )
        
        # 更新文档状态
        await repo.update_fields(document_id, {
            "qa_extraction_task_id": qa_extraction_task_id,
            "qa_extraction_status": "pending",
            "qa_extraction_started_at": datetime.utcnow(),
            "qa_extraction_config": qa_config,
            "auto_qa_extraction_enabled": True
        })
        
        logger.info(f"✅ 手动触发QA提取: {document_id} -> {qa_extraction_task_id}")
        
        return {
            "success": True,
            "message": "QA提取任务已提交",
            "data": {
                "document_id": document_id,
                "qa_extraction_task_id": qa_extraction_task_id,
                "estimated_qa_pairs": _estimate_qa_pairs_count(document.file_size, qa_config)
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"触发QA提取失败: {e}")
        raise HTTPException(status_code=500, detail=f"触发QA提取失败: {str(e)}")


@router.get("/queue/status")
async def get_qa_queue_status():
    """获取QA提取队列状态"""
    try:
        # 统一服务暂时返回简单状态
        status = {
            "queue_status": "active",
            "message": "统一QA提取服务运行中",
            "version": "1.0"
        }
        return {
            "success": True,
            "data": status
        }
    except Exception as e:
        logger.error(f"获取队列状态失败: {e}")
        raise HTTPException(status_code=500, detail=f"获取队列状态失败: {str(e)}")
