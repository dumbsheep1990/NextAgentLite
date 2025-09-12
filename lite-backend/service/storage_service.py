"""
对象存储服务 - 支持MinIO和本地文件系统
"""
import os
import uuid
import hashlib
from pathlib import Path
from typing import Optional, BinaryIO, Tuple, Dict, Any
from datetime import datetime, timedelta
from urllib.parse import urljoin
import aiofiles

try:
    from minio import Minio
    from minio.error import S3Error
    MINIO_AVAILABLE = True
except ImportError:
    Minio = None
    S3Error = Exception
    MINIO_AVAILABLE = False
from core.config_optimized import optimized_config_manager
from core.logger import logger


class StorageService:
    """统一存储服务接口"""
    
    def __init__(self):
        self.config = optimized_config_manager.settings.storage_minio
        self.minio_client = None
        
        try:
            if self.config.enabled and MINIO_AVAILABLE:
                self._init_minio_client()
                # 如果跳过存储桶验证，则不进行存储桶检查和创建
                if not self.config.skip_bucket_validation and self.config.auto_create_buckets:
                    self._ensure_buckets_exist()
                elif self.config.skip_bucket_validation:
                    logger.info("跳过MinIO存储桶验证，直接连接已存在的存储桶")
            elif self.config.enabled and not MINIO_AVAILABLE:
                logger.info("存储服务降级至本地模式（MinIO依赖缺失）")
                self.config.enabled = False  # 强制使用本地模式
                self._init_local_storage()
            else:
                # 使用本地存储时创建必要目录
                self._init_local_storage()
        except Exception as e:
            logger.warning(f"存储服务初始化失败，降级至本地模式: {e}")
            # 继续执行，但标记服务不可用
            self.minio_client = None
            self.config.enabled = False
            self._init_local_storage()
    
    def _init_minio_client(self):
        """初始化MinIO客户端"""
        if not MINIO_AVAILABLE:
            raise ImportError("MinIO库不可用")
            
        try:
            self.minio_client = Minio(
                endpoint=self.config.endpoint,
                access_key=self.config.access_key,
                secret_key=self.config.secret_key,
                secure=self.config.secure
                # 不设置region参数，避免签名问题
            )
            logger.info(f"MinIO客户端初始化成功: {self.config.endpoint}")
            
        except Exception as e:
            logger.error(f"MinIO客户端初始化失败: {e}")
            raise
    
    def _ensure_buckets_exist(self):
        """确保必要的存储桶存在"""
        buckets = [
            self.config.documents_bucket,
            self.config.media_bucket,
            self.config.thumbnails_bucket,
            getattr(self.config, 'knowledge_graph_bucket', 'mat-qa-knowledge-graph')
        ]
        
        for bucket_name in buckets:
            try:
                if not self.minio_client.bucket_exists(bucket_name):
                    self.minio_client.make_bucket(bucket_name)
                    logger.info(f"创建存储桶: {bucket_name}")
                else:
                    logger.debug(f"存储桶已存在: {bucket_name}")
            except S3Error as e:
                logger.error(f"创建存储桶失败 {bucket_name}: {e}")
    
    def _init_local_storage(self):
        """初始化本地存储目录"""
        base_dir = Path("uploads")
        directories = [
            base_dir / "documents",
            base_dir / "media", 
            base_dir / "thumbnails",
            base_dir / "knowledge_graph"
        ]
        
        for directory in directories:
            directory.mkdir(parents=True, exist_ok=True)
            logger.debug(f"创建本地存储目录: {directory}")
    
    def _generate_object_name(self, filename: str, prefix: str = "") -> str:
        """生成对象名称"""
        file_id = str(uuid.uuid4())
        timestamp = datetime.now().strftime("%Y%m%d")
        file_ext = Path(filename).suffix
        
        object_name = f"{prefix}/{timestamp}/{file_id}{file_ext}" if prefix else f"{timestamp}/{file_id}{file_ext}"
        return object_name
    
    def _calculate_file_hash(self, data: bytes) -> str:
        """计算文件哈希值"""
        return hashlib.sha256(data).hexdigest()
    
    async def upload_document(
        self,
        file_data: bytes,
        filename: str,
        content_type: str = "application/octet-stream",
        metadata: Optional[Dict[str, Any]] = None
    ) -> Tuple[str, str, int]:
        """
        上传文档文件
        
        Args:
            file_data: 文件数据
            filename: 原始文件名
            content_type: 文件MIME类型
            metadata: 附加元数据
            
        Returns:
            Tuple[object_name, file_url, file_size]
        """
        if self.config.enabled and self.minio_client:
            try:
                return await self._upload_to_minio(
                    file_data, filename, self.config.documents_bucket, 
                    content_type, metadata, "documents"
                )
            except Exception as e:
                logger.warning(f"MinIO上传失败，回退到本地存储: {e}")
                # 回退到本地存储
                return await self._upload_to_local(
                    file_data, filename, "documents", content_type, metadata
                )
        else:
            return await self._upload_to_local(
                file_data, filename, "documents", content_type, metadata
            )
    
    async def upload_media(
        self,
        file_data: bytes,
        filename: str,
        content_type: str = "application/octet-stream",
        metadata: Optional[Dict[str, Any]] = None
    ) -> Tuple[str, str, int]:
        """
        上传媒体文件
        
        Args:
            file_data: 文件数据
            filename: 原始文件名
            content_type: 文件MIME类型
            metadata: 附加元数据
            
        Returns:
            Tuple[object_name, file_url, file_size]
        """
        if self.config.enabled:
            return await self._upload_to_minio(
                file_data, filename, self.config.media_bucket,
                content_type, metadata, "media"
            )
        else:
            return await self._upload_to_local(
                file_data, filename, "media", content_type, metadata
            )
    
    async def upload_thumbnail(
        self,
        file_data: bytes,
        filename: str,
        content_type: str = "image/jpeg",
        metadata: Optional[Dict[str, Any]] = None
    ) -> Tuple[str, str, int]:
        """
        上传缩略图
        
        Args:
            file_data: 文件数据
            filename: 原始文件名
            content_type: 文件MIME类型
            metadata: 附加元数据
            
        Returns:
            Tuple[object_name, file_url, file_size]
        """
        if self.config.enabled:
            return await self._upload_to_minio(
                file_data, filename, self.config.thumbnails_bucket,
                content_type, metadata, "thumbnails"
            )
        else:
            return await self._upload_to_local(
                file_data, filename, "thumbnails", content_type, metadata
            )
    
    async def upload_knowledge_graph_document(
        self,
        file_data: bytes,
        filename: str,
        content_type: str = "application/octet-stream",
        metadata: Optional[Dict[str, Any]] = None
    ) -> Tuple[str, str, int]:
        """
        上传知识图谱文档文件
        
        Args:
            file_data: 文件数据
            filename: 原始文件名
            content_type: 文件MIME类型
            metadata: 附加元数据
            
        Returns:
            Tuple[object_name, file_url, file_size]
        """
        # 知识图谱存储桶名称
        kg_bucket = getattr(self.config, 'knowledge_graph_bucket', 'mat-qa-knowledge-graph')
        
        if self.config.enabled and self.minio_client:
            try:
                # 确保知识图谱存储桶存在
                self._ensure_bucket_exists(kg_bucket)
                return await self._upload_to_minio(
                    file_data, filename, kg_bucket, 
                    content_type, metadata, "documents"
                )
            except Exception as e:
                logger.warning(f"MinIO上传失败，回退到本地存储: {e}")
                # 回退到本地存储
                return await self._upload_to_local(
                    file_data, filename, "knowledge_graph", content_type, metadata
                )
        else:
            return await self._upload_to_local(
                file_data, filename, "knowledge_graph", content_type, metadata
            )
    
    async def _upload_to_minio(
        self,
        file_data: bytes,
        filename: str,
        bucket_name: str,
        content_type: str,
        metadata: Optional[Dict[str, Any]],
        prefix: str
    ) -> Tuple[str, str, int]:
        """上传文件到MinIO"""
        try:
            object_name = self._generate_object_name(filename, prefix)
            file_size = len(file_data)
            file_hash = self._calculate_file_hash(file_data)
            
            # 准备元数据 - 使用下划线而不是连字符避免签名问题
            # MinIO metadata只支持ASCII字符，需要对中文进行编码
            import urllib.parse
            
            file_metadata = {
                "original_filename": urllib.parse.quote(filename, safe=''),  # URL编码中文文件名
                "content_type": content_type,
                "file_hash": file_hash,
                "upload_time": datetime.utcnow().isoformat()
            }
            
            # 如果文件名包含非ASCII字符，额外存储一个hex编码版本用于恢复
            try:
                filename.encode('ascii')
            except UnicodeEncodeError:
                file_metadata["original_filename_hex"] = filename.encode('utf-8').hex()
            
            if metadata:
                # 对metadata中的非ASCII值进行编码
                for key, value in metadata.items():
                    if isinstance(value, str):
                        try:
                            value.encode('ascii')
                            file_metadata[key] = value  # ASCII安全，直接使用
                        except UnicodeEncodeError:
                            file_metadata[key] = urllib.parse.quote(value, safe='')  # 非ASCII，编码
                    else:
                        file_metadata[key] = str(value)
            
            # 上传文件
            from io import BytesIO
            file_stream = BytesIO(file_data)
            
            self.minio_client.put_object(
                bucket_name=bucket_name,
                object_name=object_name,
                data=file_stream,
                length=file_size,
                content_type=content_type,
                metadata=file_metadata
            )
            
            # 生成访问URL
            file_url = self._generate_file_url(bucket_name, object_name)
            
            logger.info(f"文件上传到MinIO成功: {object_name}")
            return object_name, file_url, file_size
            
        except S3Error as e:
            logger.error(f"MinIO上传失败: {e}")
            raise
        except Exception as e:
            logger.error(f"文件上传异常: {e}")
            raise
    
    async def _upload_to_local(
        self,
        file_data: bytes,
        filename: str,
        subdirectory: str,
        content_type: str,
        metadata: Optional[Dict[str, Any]]
    ) -> Tuple[str, str, int]:
        """上传文件到本地存储"""
        try:
            file_id = str(uuid.uuid4())
            timestamp = datetime.now().strftime("%Y%m%d")
            file_ext = Path(filename).suffix
            
            # 构建文件路径
            relative_path = f"{subdirectory}/{timestamp}/{file_id}{file_ext}"
            file_path = Path("uploads") / relative_path
            file_path.parent.mkdir(parents=True, exist_ok=True)
            
            # 保存文件
            async with aiofiles.open(file_path, 'wb') as f:
                await f.write(file_data)
            
            file_size = len(file_data)
            file_url = f"/api/v1/storage/files/{relative_path}"
            
            logger.info(f"文件保存到本地成功: {file_path}")
            return str(relative_path), file_url, file_size
            
        except Exception as e:
            logger.error(f"本地文件保存失败: {e}")
            raise
    
    def _generate_file_url(self, bucket_name: str, object_name: str) -> str:
        """生成文件访问URL"""
        if self.config.cdn_endpoint:
            # 使用CDN端点
            return urljoin(self.config.cdn_endpoint, f"/{bucket_name}/{object_name}")
        elif self.config.public_endpoint:
            # 使用公共端点
            return urljoin(self.config.public_endpoint, f"/{bucket_name}/{object_name}")
        else:
            # 使用MinIO默认端点
            protocol = "https" if self.config.secure else "http"
            return f"{protocol}://{self.config.endpoint}/{bucket_name}/{object_name}"
    
    async def get_file(self, bucket_name: str, object_name: str) -> Optional[bytes]:
        """获取文件内容"""
        if self.config.enabled and self.minio_client:
            try:
                return await self._get_file_from_minio(bucket_name, object_name)
            except Exception as e:
                logger.warning(f"从MinIO获取文件失败，回退到本地存储: {object_name}")
                # 回退到本地存储
                result = await self._get_file_from_local(object_name)
                if result:
                    logger.info(f"✅ 成功从本地存储获取文件: {object_name}, 大小: {len(result)} 字节")
                else:
                    logger.error(f"❌ 本地存储也无法获取文件: {object_name}")
                return result
        else:
            return await self._get_file_from_local(object_name)
    
    async def _get_file_from_minio(self, bucket_name: str, object_name: str) -> Optional[bytes]:
        """从MinIO获取文件"""
        try:
            response = self.minio_client.get_object(bucket_name, object_name)
            data = response.read()
            response.close()
            response.release_conn()
            return data
        except S3Error as e:
            logger.error(f"从MinIO获取文件失败 {bucket_name}/{object_name}: {e}")
            raise  # 重新抛出异常以触发回退逻辑
        except Exception as e:
            logger.error(f"获取文件异常: {e}")
            raise  # 重新抛出异常以触发回退逻辑
    
    async def _get_file_from_local(self, relative_path: str) -> Optional[bytes]:
        """从本地存储获取文件"""
        try:
            file_path = Path("uploads") / relative_path
            if file_path.exists():
                async with aiofiles.open(file_path, 'rb') as f:
                    return await f.read()
            else:
                logger.warning(f"本地文件不存在: {file_path}")
                return None
        except Exception as e:
            logger.error(f"读取本地文件失败: {e}")
            return None
    
    def get_presigned_url(
        self,
        bucket_name: str,
        object_name: str,
        expires: Optional[timedelta] = None
    ) -> Optional[str]:
        """获取预签名URL（仅MinIO）"""
        if not self.config.enabled:
            return None
        
        try:
            expires = expires or timedelta(seconds=self.config.presigned_url_expires)
            url = self.minio_client.presigned_get_object(
                bucket_name=bucket_name,
                object_name=object_name,
                expires=expires
            )
            return url
        except S3Error as e:
            logger.error(f"生成预签名URL失败: {e}")
            return None
    
    async def delete_file(self, bucket_name: str, object_name: str) -> bool:
        """删除文件"""
        if self.config.enabled:
            # 确保桶存在（如果配置允许自动创建且不跳过验证）
            if not self.config.skip_bucket_validation and self.config.auto_create_buckets:
                self._ensure_bucket_exists(bucket_name)
            return await self._delete_file_from_minio(bucket_name, object_name)
        else:
            return await self._delete_file_from_local(object_name)
    
    def _ensure_bucket_exists(self, bucket_name: str):
        """确保单个存储桶存在"""
        try:
            if not self.minio_client.bucket_exists(bucket_name):
                self.minio_client.make_bucket(bucket_name)
                logger.info(f"创建存储桶: {bucket_name}")
        except S3Error as e:
            logger.error(f"创建存储桶失败 {bucket_name}: {e}")
    
    async def _delete_file_from_minio(self, bucket_name: str, object_name: str) -> bool:
        """从MinIO删除文件"""
        try:
            # 检查桶是否存在，如果不存在则认为文件已被删除
            if not self.minio_client.bucket_exists(bucket_name):
                logger.warning(f"存储桶不存在: {bucket_name}，认为文件已被删除")
                return True
            
            self.minio_client.remove_object(bucket_name, object_name)
            logger.info(f"从MinIO删除文件成功: {bucket_name}/{object_name}")
            return True
        except S3Error as e:
            # 如果是文件不存在的错误，也认为删除成功
            if "NoSuchKey" in str(e) or "NoSuchBucket" in str(e):
                logger.warning(f"文件或桶不存在，认为删除成功: {bucket_name}/{object_name}")
                return True
            logger.error(f"从MinIO删除文件失败: {e}")
            return False
    
    async def _delete_file_from_local(self, relative_path: str) -> bool:
        """从本地存储删除文件"""
        try:
            file_path = Path("uploads") / relative_path
            if file_path.exists():
                file_path.unlink()
                logger.info(f"删除本地文件成功: {file_path}")
                return True
            else:
                logger.warning(f"本地文件不存在: {file_path}")
                return False
        except Exception as e:
            logger.error(f"删除本地文件失败: {e}")
            return False
    
    def get_file_info(self, bucket_name: str, object_name: str) -> Optional[Dict[str, Any]]:
        """获取文件信息（仅MinIO）"""
        if not self.config.enabled:
            return None
        
        try:
            stat = self.minio_client.stat_object(bucket_name, object_name)
            return {
                "size": stat.size,
                "last_modified": stat.last_modified,
                "etag": stat.etag,
                "content_type": stat.content_type,
                "metadata": stat.metadata
            }
        except S3Error as e:
            logger.error(f"获取文件信息失败: {e}")
            return None
    
    def list_buckets(self) -> Optional[list]:
        """列出所有存储桶"""
        if not self.config.enabled or not self.minio_client:
            # 本地模式返回模拟的桶列表
            return ["documents", "media", "thumbnails"]
        
        try:
            buckets = self.minio_client.list_buckets()
            return [bucket.name for bucket in buckets]
        except S3Error as e:
            logger.error(f"列出存储桶失败: {e}")
            return None
        except Exception as e:
            logger.error(f"获取存储桶列表异常: {e}")
            return None
    
    async def delete_knowledge_graph_document(self, object_name: str) -> bool:
        """删除知识图谱文档文件"""
        try:
            # 尝试从documents桶删除
            success = await self.delete_file("documents", object_name)
            if success:
                logger.info(f"成功删除知识图谱文档文件: {object_name}")
                return True
            
            # 如果documents桶删除失败，尝试其他可能的桶
            for bucket in ["knowledge-graphs", "uploads", "files"]:
                try:
                    success = await self.delete_file(bucket, object_name)
                    if success:
                        logger.info(f"从桶 {bucket} 成功删除文档文件: {object_name}")
                        return True
                except Exception as e:
                    logger.debug(f"从桶 {bucket} 删除文件失败: {e}")
                    continue
            
            logger.warning(f"未能从任何桶中删除文件: {object_name}")
            return False
            
        except Exception as e:
            logger.error(f"删除知识图谱文档文件失败: {e}")
            return False

    async def clear_bucket(self, bucket_name: str) -> int:
        """
        清空指定桶中的所有文件
        仅在开发环境中使用
        
        Args:
            bucket_name: 桶名称
            
        Returns:
            int: 删除的文件数量
        """
        try:
            deleted_count = 0
            
            if self.config.enabled and self.minio_client:
                # MinIO模式
                logger.info(f"🗑️ 开始清理MinIO桶: {bucket_name}")
                
                try:
                    # 检查桶是否存在
                    if not self.minio_client.bucket_exists(bucket_name):
                        logger.info(f"桶 {bucket_name} 不存在，跳过清理")
                        return 0
                    
                    # 获取桶中所有对象
                    objects = self.minio_client.list_objects(bucket_name, recursive=True)
                    
                    # 批量删除对象
                    object_names = []
                    for obj in objects:
                        object_names.append(obj.object_name)
                        if len(object_names) >= 100:  # 批量删除，每次最多100个
                            errors = self.minio_client.remove_objects(bucket_name, object_names)
                            # 检查删除错误
                            error_count = 0
                            for error in errors:
                                error_count += 1
                                logger.warning(f"删除对象失败: {error}")
                            
                            deleted_count += len(object_names) - error_count
                            object_names = []
                    
                    # 删除剩余对象
                    if object_names:
                        errors = self.minio_client.remove_objects(bucket_name, object_names)
                        error_count = 0
                        for error in errors:
                            error_count += 1
                            logger.warning(f"删除对象失败: {error}")
                        
                        deleted_count += len(object_names) - error_count
                    
                    logger.info(f"✅ MinIO桶 {bucket_name} 清理完成，删除了 {deleted_count} 个文件")
                    
                except S3Error as e:
                    logger.error(f"❌ MinIO桶清理失败: {e}")
                    raise
                    
            else:
                # 本地存储模式
                logger.info(f"🗑️ 开始清理本地存储目录: {bucket_name}")
                
                storage_base = Path(self.config.local_base_path or "storage")
                bucket_path = storage_base / bucket_name
                
                if bucket_path.exists() and bucket_path.is_dir():
                    # 递归删除目录中的所有文件
                    for file_path in bucket_path.rglob("*"):
                        if file_path.is_file():
                            try:
                                file_path.unlink()
                                deleted_count += 1
                            except Exception as e:
                                logger.warning(f"删除本地文件失败 {file_path}: {e}")
                    
                    logger.info(f"✅ 本地存储目录 {bucket_name} 清理完成，删除了 {deleted_count} 个文件")
                else:
                    logger.info(f"本地存储目录 {bucket_name} 不存在，跳过清理")
            
            return deleted_count
            
        except Exception as e:
            logger.error(f"❌ 清理桶 {bucket_name} 失败: {e}")
            raise


# 全局存储服务实例 - 直接初始化
try:
    storage_service = StorageService()
    logger.info("存储服务初始化成功")
except Exception as e:
    logger.error(f"存储服务初始化失败: {e}")
    storage_service = None

def get_storage_service():
    """获取存储服务实例"""
    global storage_service
    if storage_service is None:
        try:
            storage_service = StorageService()
            logger.info("存储服务延迟初始化成功")
        except Exception as e:
            logger.error(f"存储服务延迟初始化失败: {e}")
    return storage_service 