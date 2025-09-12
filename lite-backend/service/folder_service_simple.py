"""
简化的文件夹管理服务 - 避免SQLAlchemy异步问题
"""

import uuid
from typing import Dict, Any, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from core.logger import logger


class SimpleFolderService:
    """简化的文件夹管理服务"""
    
    def __init__(self, db: AsyncSession):
        self.db = db
    
    async def create_folder(
        self,
        name: str,
        collection_id: str,
        parent_folder_id: Optional[str] = None,
        description: Optional[str] = None,
        created_by: str = 'system',
        metadata: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """创建文件夹 - 使用原生SQL避免SQLAlchemy对象问题"""
        try:
            # 使用原生SQL直接插入
            folder_id = str(uuid.uuid4())
            folder_path = f"/{name.strip()}"
            
            insert_sql = text("""
                INSERT INTO knowledge_folders 
                (id, name, description, parent_folder_id, collection_id, folder_path, 
                 depth_level, sort_order, is_active, folder_metadata, created_by)
                VALUES (:id, :name, :description, :parent_folder_id, :collection_id, 
                        :folder_path, :depth_level, :sort_order, :is_active, :folder_metadata, :created_by)
            """)
            
            await self.db.execute(insert_sql, {
                'id': folder_id,
                'name': name.strip(),
                'description': description,
                'parent_folder_id': parent_folder_id,
                'collection_id': collection_id,
                'folder_path': folder_path,
                'depth_level': 1 if parent_folder_id else 0,
                'sort_order': 0,
                'is_active': True,
                'folder_metadata': '{}',
                'created_by': created_by
            })
            
            await self.db.commit()
            
            logger.info(f"Created folder '{name}' in collection {collection_id}")
            
            return {
                'success': True,
                'folder': {
                    'id': folder_id,
                    'name': name.strip(),
                    'description': description,
                    'collection_id': collection_id,
                    'parent_folder_id': parent_folder_id,
                    'folder_path': folder_path,
                    'depth_level': 1 if parent_folder_id else 0,
                    'sort_order': 0,
                    'is_active': True,
                    'created_by': created_by,
                    'document_count': 0,
                    'subfolder_count': 0
                },
                'message': '文件夹创建成功'
            }
            
        except Exception as e:
            await self.db.rollback()
            logger.error(f"Simple folder creation error: {str(e)}")
            raise Exception(f"文件夹创建失败: {str(e)}")

    async def get_folders_by_collection(
        self,
        collection_id: str,
        parent_folder_id: Optional[str] = None,
        include_documents: bool = True,
        recursive: bool = False
    ) -> list:
        """获取知识库的文件夹列表"""
        try:
            # 构建查询条件
            where_conditions = ["collection_id = :collection_id", "is_active = true"]
            params = {"collection_id": collection_id}
            
            if parent_folder_id is not None:
                where_conditions.append("parent_folder_id = :parent_folder_id")
                params["parent_folder_id"] = parent_folder_id
            else:
                where_conditions.append("parent_folder_id IS NULL")
            
            where_clause = " AND ".join(where_conditions)
            
            query_sql = text(f"""
                SELECT id, name, description, parent_folder_id, collection_id, 
                       folder_path, depth_level, sort_order, is_active, 
                       folder_metadata, created_by, created_at, updated_at,
                       0 as document_count, 0 as subfolder_count
                FROM knowledge_folders 
                WHERE {where_clause}
                ORDER BY sort_order, name
            """)
            
            result = await self.db.execute(query_sql, params)
            rows = result.fetchall()
            
            folders = []
            for row in rows:
                folder_dict = {
                    'id': row[0],
                    'name': row[1],
                    'description': row[2],
                    'parent_folder_id': row[3],
                    'collection_id': row[4],
                    'folder_path': row[5],
                    'depth_level': row[6],
                    'sort_order': row[7],
                    'is_active': row[8],
                    'folder_metadata': row[9],
                    'created_by': row[10],
                    'created_at': row[11].isoformat() if row[11] else None,
                    'updated_at': row[12].isoformat() if row[12] else None,
                    'document_count': row[13],
                    'subfolder_count': row[14]
                }
                folders.append(folder_dict)
            
            logger.info(f"Retrieved {len(folders)} folders for collection {collection_id}")
            return folders
            
        except Exception as e:
            logger.error(f"Get folders by collection error: {str(e)}")
            raise Exception(f"获取文件夹列表失败: {str(e)}")

    async def get_folder_hierarchy(self, collection_id: str) -> Dict[str, Any]:
        """获取文件夹层级结构"""
        try:
            folders = await self.get_folders_by_collection(collection_id, recursive=True)
            
            # 简单返回扁平结构，前端处理层级关系
            return {
                'hierarchy': folders,
                'total_folders': len(folders)
            }
            
        except Exception as e:
            logger.error(f"Get folder hierarchy error: {str(e)}")
            raise Exception(f"获取文件夹层级结构失败: {str(e)}")

    async def delete_folder(
        self,
        folder_id: str,
        collection_id: str,
        force: bool = False
    ) -> Dict[str, Any]:
        """删除文件夹"""
        try:
            # 简单的删除逻辑：直接删除文件夹（文档会自动变为无文件夹状态）
            delete_sql = text("""
                DELETE FROM knowledge_folders 
                WHERE id = :folder_id AND collection_id = :collection_id
            """)
            
            result = await self.db.execute(delete_sql, {
                'folder_id': folder_id,
                'collection_id': collection_id
            })
            
            if result.rowcount == 0:
                raise Exception("文件夹不存在或无权删除")
            
            await self.db.commit()
            
            logger.info(f"Deleted folder {folder_id} from collection {collection_id}")
            
            return {
                'success': True,
                'message': '文件夹删除成功'
            }
            
        except Exception as e:
            await self.db.rollback()
            logger.error(f"Delete folder error: {str(e)}")
            raise Exception(f"删除文件夹失败: {str(e)}")

    async def get_folder_documents(
        self,
        folder_id: str,
        collection_id: str,
        page: int = 1,
        size: int = 20,
        search_query: Optional[str] = None,
        file_type: Optional[str] = None,
        status_filter: Optional[str] = None
    ) -> Dict[str, Any]:
        """获取文件夹中的文档"""
        try:
            # 首先获取文件夹信息
            folder_sql = text("""
                SELECT id, name, description, parent_folder_id, collection_id, 
                       folder_path, depth_level, sort_order, is_active, 
                       folder_metadata, created_by, created_at, updated_at
                FROM knowledge_folders 
                WHERE id = :folder_id AND collection_id = :collection_id
            """)
            
            folder_result = await self.db.execute(folder_sql, {
                'folder_id': folder_id,
                'collection_id': collection_id
            })
            folder_row = folder_result.fetchone()
            
            if not folder_row:
                raise Exception("文件夹不存在")
            
            # 构建文档查询条件
            where_conditions = ["collection_id = :collection_id", "folder_id = :folder_id"]
            params = {"collection_id": collection_id, "folder_id": folder_id}
            
            if search_query:
                where_conditions.append("(title ILIKE :search OR filename ILIKE :search)")
                params["search"] = f"%{search_query}%"
            
            if file_type:
                where_conditions.append("file_type = :file_type")
                params["file_type"] = file_type
            
            if status_filter:
                where_conditions.append("status = :status")
                params["status"] = status_filter
            
            where_clause = " AND ".join(where_conditions)
            
            # 获取文档总数
            count_sql = text(f"""
                SELECT COUNT(*) 
                FROM knowledge_documents 
                WHERE {where_clause}
            """)
            count_result = await self.db.execute(count_sql, params)
            total = count_result.scalar()
            
            # 获取分页文档
            offset = (page - 1) * size
            docs_sql = text(f"""
                SELECT id, title, filename, file_type, file_size, status, 
                       tags, folder_path, document_category, domain_type,
                       created_at, updated_at
                FROM knowledge_documents 
                WHERE {where_clause}
                ORDER BY created_at DESC
                LIMIT :limit OFFSET :offset
            """)
            
            params.update({"limit": size, "offset": offset})
            docs_result = await self.db.execute(docs_sql, params)
            doc_rows = docs_result.fetchall()
            
            documents = []
            for row in doc_rows:
                doc_dict = {
                    'id': row[0],
                    'title': row[1],
                    'filename': row[2],
                    'file_type': row[3],
                    'file_size': row[4],
                    'status': row[5],
                    'tags': row[6] if row[6] else [],
                    'folder_path': row[7],
                    'document_category': row[8],
                    'domain_type': row[9],
                    'created_at': row[10].isoformat() if row[10] else None,
                    'updated_at': row[11].isoformat() if row[11] else None
                }
                documents.append(doc_dict)
            
            # 构建文件夹信息
            folder_dict = {
                'id': folder_row[0],
                'name': folder_row[1],
                'description': folder_row[2],
                'parent_folder_id': folder_row[3],
                'collection_id': folder_row[4],
                'folder_path': folder_row[5],
                'depth_level': folder_row[6],
                'sort_order': folder_row[7],
                'is_active': folder_row[8],
                'folder_metadata': folder_row[9],
                'created_by': folder_row[10],
                'created_at': folder_row[11].isoformat() if folder_row[11] else None,
                'updated_at': folder_row[12].isoformat() if folder_row[12] else None
            }
            
            total_pages = (total + size - 1) // size
            
            return {
                'documents': documents,
                'folder': folder_dict,
                'page': page,
                'size': size,
                'total': total,
                'total_pages': total_pages
            }
            
        except Exception as e:
            logger.error(f"Get folder documents error: {str(e)}")
            raise Exception(f"获取文件夹文档失败: {str(e)}")