"""
存储服务API接口
提供文件上传、下载、删除等功能
"""
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query
from fastapi.responses import StreamingResponse
from typing import Optional, List
from pathlib import Path
import mimetypes
import io

try:
    from sqlalchemy.ext.asyncio import AsyncSession
except ImportError:
    AsyncSession = None

try:
    from db.database import get_db
except ImportError:
    def get_db():
        return None

from core.logger import logger

try:
    from service.storage_service import get_storage_service
    # 使用延迟初始化，避免启动时的日志噪音
    def get_storage():
        try:
            return get_storage_service()
        except Exception as e:
            logger.warning(f"存储服务获取失败: {str(e)[:50]}...")
            return None
except ImportError as e:
    logger.warning(f"存储服务导入失败: {e}")
    def get_storage():
        return None
from pydantic import BaseModel


router = APIRouter()


def get_storage_service_or_error():
    """获取存储服务或抛出HTTP异常"""
    storage_service = get_storage()
    if not storage_service:
        raise HTTPException(status_code=500, detail="存储服务不可用")
    return storage_service


class UploadResponse(BaseModel):
    """文件上传响应"""
    success: bool
    message: str
    object_name: str
    file_url: str
    file_size: int


class FileInfo(BaseModel):
    """文件信息"""
    object_name: str
    file_size: int
    content_type: str
    last_modified: Optional[str] = None
    file_url: str


@router.post("/upload/document", response_model=UploadResponse)
async def upload_document_file(
    file: UploadFile = File(...),
    description: Optional[str] = None
):
    """上传文档文件"""
    try:
        # 验证文件类型
        allowed_types = ['.pdf', '.doc', '.docx', '.txt', '.md', '.html']
        file_ext = Path(file.filename).suffix.lower()
        
        if file_ext not in allowed_types:
            raise HTTPException(
                status_code=400,
                detail=f"不支持的文件类型。支持的类型: {', '.join(allowed_types)}"
            )
        
        # 读取文件内容
        file_content = await file.read()
        if len(file_content) > 50 * 1024 * 1024:  # 50MB限制
            raise HTTPException(status_code=400, detail="文件大小超过限制(50MB)")
        
        # 上传到存储服务
        storage_service = get_storage_service_or_error()
        object_name, file_url, file_size = await storage_service.upload_document(
            file_data=file_content,
            filename=file.filename,
            content_type=file.content_type or "application/octet-stream",
            metadata={
                "description": description or "",
                "upload_source": "api"
            }
        )
        
        logger.info(f"文档上传成功: {file.filename} -> {object_name}")
        
        return UploadResponse(
            success=True,
            message="文件上传成功",
            object_name=object_name,
            file_url=file_url,
            file_size=file_size
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"文档上传失败: {e}")
        raise HTTPException(status_code=500, detail=f"文件上传失败: {str(e)}")


@router.post("/upload/media", response_model=UploadResponse)
async def upload_media_file(
    file: UploadFile = File(...),
    description: Optional[str] = None
):
    """上传媒体文件"""
    try:
        # 验证文件类型
        allowed_types = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.mp4', '.avi', '.mov', '.mp3', '.wav']
        file_ext = Path(file.filename).suffix.lower()
        
        if file_ext not in allowed_types:
            raise HTTPException(
                status_code=400,
                detail=f"不支持的文件类型。支持的类型: {', '.join(allowed_types)}"
            )
        
        # 读取文件内容
        file_content = await file.read()
        if len(file_content) > 100 * 1024 * 1024:  # 100MB限制
            raise HTTPException(status_code=400, detail="文件大小超过限制(100MB)")
        
        # 上传到存储服务
        storage_service = get_storage_service_or_error()
        object_name, file_url, file_size = await storage_service.upload_media(
            file_data=file_content,
            filename=file.filename,
            content_type=file.content_type or "application/octet-stream",
            metadata={
                "description": description or "",
                "upload_source": "api"
            }
        )
        
        logger.info(f"媒体文件上传成功: {file.filename} -> {object_name}")
        
        return UploadResponse(
            success=True,
            message="媒体文件上传成功",
            object_name=object_name,
            file_url=file_url,
            file_size=file_size
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"媒体文件上传失败: {e}")
        raise HTTPException(status_code=500, detail=f"媒体文件上传失败: {str(e)}")


@router.get("/files/{file_path:path}")
async def download_file(file_path: str):
    """下载文件（适用于本地存储）"""
    try:
        # 仅在本地存储模式下使用
        storage_service = get_storage_service_or_error()
        if storage_service.config.enabled:
            raise HTTPException(status_code=404, detail="此接口仅适用于本地存储模式")
        
        # 获取文件内容
        file_content = await storage_service.get_file("", file_path)
        if not file_content:
            raise HTTPException(status_code=404, detail="文件不存在")
        
        # 获取MIME类型
        content_type, _ = mimetypes.guess_type(file_path)
        if not content_type:
            content_type = "application/octet-stream"
        
        # 获取文件名
        filename = Path(file_path).name
        
        # 返回文件流
        return StreamingResponse(
            io.BytesIO(file_content),
            media_type=content_type,
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"文件下载失败 {file_path}: {e}")
        raise HTTPException(status_code=500, detail=f"文件下载失败: {str(e)}")


@router.get("/download/{bucket_type}/{object_name:path}")
async def download_file_by_bucket(
    bucket_type: str,
    object_name: str,
    inline: bool = Query(False, description="是否内联显示")
):
    """从指定存储桶下载文件"""
    try:
        storage_service = get_storage_service_or_error()
        # 验证存储桶类型
        bucket_mapping = {
            "documents": storage_service.config.documents_bucket,
            "media": storage_service.config.media_bucket,
            "thumbnails": storage_service.config.thumbnails_bucket
        }
        
        bucket_name = bucket_mapping.get(bucket_type)
        if not bucket_name:
            raise HTTPException(status_code=400, detail="无效的存储桶类型")
        
        # 获取文件内容
        file_content = await storage_service.get_file(bucket_name, object_name)
        if not file_content:
            raise HTTPException(status_code=404, detail="文件不存在")
        
        # 获取MIME类型
        content_type, _ = mimetypes.guess_type(object_name)
        if not content_type:
            content_type = "application/octet-stream"
        
        # 获取文件名
        filename = Path(object_name).name
        
        # 设置Content-Disposition
        disposition = "inline" if inline else "attachment"
        headers = {"Content-Disposition": f"{disposition}; filename={filename}"}
        
        # 返回文件流
        return StreamingResponse(
            io.BytesIO(file_content),
            media_type=content_type,
            headers=headers
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"文件下载失败 {bucket_type}/{object_name}: {e}")
        raise HTTPException(status_code=500, detail=f"文件下载失败: {str(e)}")


@router.get("/presigned-url/{bucket_type}/{object_name:path}")
async def get_presigned_url(
    bucket_type: str,
    object_name: str,
    expires_in: int = Query(3600, description="过期时间（秒）")
):
    """获取预签名URL（仅MinIO）"""
    try:
        storage_service = get_storage_service_or_error()
        if not storage_service.config.enabled:
            raise HTTPException(status_code=400, detail="预签名URL仅适用于MinIO存储")
        
        # 验证存储桶类型
        bucket_mapping = {
            "documents": storage_service.config.documents_bucket,
            "media": storage_service.config.media_bucket,
            "thumbnails": storage_service.config.thumbnails_bucket
        }
        
        bucket_name = bucket_mapping.get(bucket_type)
        if not bucket_name:
            raise HTTPException(status_code=400, detail="无效的存储桶类型")
        
        from datetime import timedelta
        expires = timedelta(seconds=expires_in)
        url = storage_service.get_presigned_url(bucket_name, object_name, expires)
        
        if not url:
            raise HTTPException(status_code=404, detail="无法生成预签名URL")
        
        return {"presigned_url": url, "expires_in": expires_in}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"生成预签名URL失败: {e}")
        raise HTTPException(status_code=500, detail=f"生成预签名URL失败: {str(e)}")


@router.get("/info/{bucket_type}/{object_name:path}", response_model=FileInfo)
async def get_file_info(bucket_type: str, object_name: str):
    """获取文件信息"""
    try:
        storage_service = get_storage_service_or_error()
        # 验证存储桶类型
        bucket_mapping = {
            "documents": storage_service.config.documents_bucket,
            "media": storage_service.config.media_bucket,
            "thumbnails": storage_service.config.thumbnails_bucket
        }
        
        bucket_name = bucket_mapping.get(bucket_type)
        if not bucket_name:
            raise HTTPException(status_code=400, detail="无效的存储桶类型")
        
        # 获取文件信息
        file_info = storage_service.get_file_info(bucket_name, object_name)
        if not file_info:
            raise HTTPException(status_code=404, detail="文件不存在")
        
        # 生成文件URL
        file_url = storage_service._generate_file_url(bucket_name, object_name)
        
        return FileInfo(
            object_name=object_name,
            file_size=file_info["size"],
            content_type=file_info["content_type"],
            last_modified=file_info["last_modified"].isoformat() if file_info.get("last_modified") else None,
            file_url=file_url
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"获取文件信息失败: {e}")
        raise HTTPException(status_code=500, detail=f"获取文件信息失败: {str(e)}")


@router.delete("/files/{bucket_type}/{object_name:path}")
async def delete_file(bucket_type: str, object_name: str):
    """删除文件"""
    try:
        storage_service = get_storage_service_or_error()
        # 验证存储桶类型
        bucket_mapping = {
            "documents": storage_service.config.documents_bucket,
            "media": storage_service.config.media_bucket,
            "thumbnails": storage_service.config.thumbnails_bucket
        }
        
        bucket_name = bucket_mapping.get(bucket_type)
        if not bucket_name:
            raise HTTPException(status_code=400, detail="无效的存储桶类型")
        
        # 删除文件
        success = await storage_service.delete_file(bucket_name, object_name)
        if not success:
            raise HTTPException(status_code=404, detail="文件不存在或删除失败")
        
        return {"success": True, "message": "文件删除成功"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"删除文件失败: {e}")
        raise HTTPException(status_code=500, detail=f"删除文件失败: {str(e)}")


@router.get("/health")
async def storage_health_check():
    """存储服务健康检查"""
    try:
        storage_service = get_storage()
        if not storage_service:
            return {
                "status": "error",
                "error": "存储服务不可用"
            }
        
        if storage_service.config.enabled:
            # MinIO健康检查
            return {
                "status": "healthy",
                "storage_type": "minio",
                "endpoint": storage_service.config.endpoint,
                "buckets": {
                    "documents": storage_service.config.documents_bucket,
                    "media": storage_service.config.media_bucket,
                    "thumbnails": storage_service.config.thumbnails_bucket
                }
            }
        else:
            # 本地存储健康检查
            from pathlib import Path
            upload_dir = Path("uploads")
            return {
                "status": "healthy",
                "storage_type": "local",
                "upload_directory": str(upload_dir),
                "directory_exists": upload_dir.exists()
            }
            
    except Exception as e:
        logger.error(f"存储服务健康检查失败: {e}")
        return {
            "status": "error",
            "error": str(e)
        } 