"""
文件夹管理服务
提供文件夹的创建、查询、移动、删除等功能
"""

import uuid
from typing import List, Optional, Dict, Any, Tuple
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.exc import IntegrityError
from sqlalchemy import and_, or_, desc, asc, func, text
from datetime import datetime

from models.folder import KnowledgeFolder
from models.knowledge import KnowledgeDocument
from models.knowledge_collection import KnowledgeCollection
from core.logger import logger


class FolderService:
    """文件夹管理服务"""
    
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
        """创建文件夹"""
        try:
            # 验证知识库存在
            collection = self.db.query(KnowledgeCollection).filter(
                KnowledgeCollection.id == collection_id
            ).first()
            if not collection:
                raise ValueError("指定的知识库不存在")
            
            # 验证父文件夹（如果指定）
            parent_folder = None
            if parent_folder_id:
                parent_folder = self.db.query(KnowledgeFolder).filter(
                    and_(
                        KnowledgeFolder.id == parent_folder_id,
                        KnowledgeFolder.collection_id == collection_id,
                        KnowledgeFolder.is_active == True
                    )
                ).first()
                
                if not parent_folder:
                    raise ValueError("指定的父文件夹不存在")
                
                if not parent_folder.can_add_subfolder():
                    raise ValueError("父文件夹已达到最大嵌套深度，无法创建子文件夹")
            
            # 检查同级文件夹名称唯一性
            existing_folder = self.db.query(KnowledgeFolder).filter(
                and_(
                    KnowledgeFolder.collection_id == collection_id,
                    KnowledgeFolder.parent_folder_id == parent_folder_id,
                    KnowledgeFolder.name == name.strip(),
                    KnowledgeFolder.is_active == True
                )
            ).first()
            
            if existing_folder:
                raise ValueError("同级目录下已存在相同名称的文件夹")
            
            # 创建新文件夹
            folder_id = str(uuid.uuid4())
            new_folder = KnowledgeFolder(
                id=folder_id,
                name=name.strip(),
                description=description,
                parent_folder_id=parent_folder_id,
                collection_id=collection_id,
                depth_level=1 if parent_folder_id else 0,
                folder_metadata=metadata or {},
                created_by=created_by
            )
            
            self.db.add(new_folder)
            self.db.commit()
            self.db.refresh(new_folder)
            
            logger.info(f"Created folder '{name}' in collection {collection_id}")
            
            return {
                'success': True,
                'folder': new_folder.to_dict(),
                'message': '文件夹创建成功'
            }
            
        except ValueError as e:
            self.db.rollback()
            logger.error(f"Folder creation validation error: {str(e)}")
            raise e
        except IntegrityError as e:
            self.db.rollback()
            logger.error(f"Folder creation integrity error: {str(e)}")
            raise ValueError("文件夹创建失败，可能存在数据冲突")
        except Exception as e:
            self.db.rollback()
            logger.error(f"Folder creation error: {str(e)}")
            raise Exception(f"文件夹创建失败: {str(e)}")
    
    async def get_folders_by_collection(
        self,
        collection_id: str,
        parent_folder_id: Optional[str] = None,
        include_documents: bool = False,
        recursive: bool = False
    ) -> List[Dict[str, Any]]:
        """获取知识库中的文件夹列表"""
        try:
            query = self.db.query(KnowledgeFolder).filter(
                and_(
                    KnowledgeFolder.collection_id == collection_id,
                    KnowledgeFolder.is_active == True
                )
            )
            
            if recursive:
                # 递归获取所有文件夹
                query = query.order_by(KnowledgeFolder.depth_level, KnowledgeFolder.sort_order, KnowledgeFolder.name)
            else:
                # 只获取指定层级的文件夹
                query = query.filter(KnowledgeFolder.parent_folder_id == parent_folder_id)
                query = query.order_by(KnowledgeFolder.sort_order, KnowledgeFolder.name)
            
            folders = query.all()
            
            result = []
            for folder in folders:
                folder_data = folder.to_dict()
                
                # 添加文档统计信息
                if include_documents:
                    document_count = self.db.query(func.count(KnowledgeDocument.id)).filter(
                        and_(
                            KnowledgeDocument.folder_id == folder.id,
                            KnowledgeDocument.status.in_(['vectorized', 'processing', 'pending'])
                        )
                    ).scalar()
                    
                    folder_data['document_count'] = document_count
                    
                    # 如果需要，也可以获取文件夹下的子文件夹数量
                    subfolder_count = self.db.query(func.count(KnowledgeFolder.id)).filter(
                        and_(
                            KnowledgeFolder.parent_folder_id == folder.id,
                            KnowledgeFolder.is_active == True
                        )
                    ).scalar()
                    
                    folder_data['subfolder_count'] = subfolder_count
                
                result.append(folder_data)
            
            return result
            
        except Exception as e:
            logger.error(f"Error getting folders for collection {collection_id}: {str(e)}")
            raise Exception(f"获取文件夹列表失败: {str(e)}")
    
    async def get_folder_hierarchy(self, collection_id: str) -> Dict[str, Any]:
        """获取文件夹层级结构"""
        try:
            # 使用递归查询获取完整的文件夹树
            hierarchy_query = text("""
                WITH RECURSIVE folder_tree AS (
                    -- 根文件夹
                    SELECT 
                        id, name, description, parent_folder_id, collection_id,
                        folder_path, depth_level, sort_order, folder_metadata,
                        created_at, updated_at,
                        ARRAY[id] as path_ids,
                        ARRAY[name] as path_names
                    FROM knowledge_folders
                    WHERE collection_id = :collection_id 
                        AND parent_folder_id IS NULL 
                        AND is_active = true
                    
                    UNION ALL
                    
                    -- 子文件夹
                    SELECT 
                        f.id, f.name, f.description, f.parent_folder_id, f.collection_id,
                        f.folder_path, f.depth_level, f.sort_order, f.folder_metadata,
                        f.created_at, f.updated_at,
                        ft.path_ids || f.id,
                        ft.path_names || f.name
                    FROM knowledge_folders f
                    INNER JOIN folder_tree ft ON f.parent_folder_id = ft.id
                    WHERE f.is_active = true
                )
                SELECT 
                    *,
                    (SELECT COUNT(*) FROM knowledge_documents kd 
                     WHERE kd.folder_id = folder_tree.id 
                        AND kd.status IN ('vectorized', 'processing', 'pending')) as document_count
                FROM folder_tree
                ORDER BY depth_level, sort_order, name
            """)
            
            result = self.db.execute(hierarchy_query, {'collection_id': collection_id})
            folders = result.fetchall()
            
            # 构建层级结构
            folder_dict = {}
            root_folders = []
            
            for folder in folders:
                folder_data = {
                    'id': folder.id,
                    'name': folder.name,
                    'description': folder.description,
                    'parent_folder_id': folder.parent_folder_id,
                    'folder_path': folder.folder_path,
                    'depth_level': folder.depth_level,
                    'sort_order': folder.sort_order,
                    'folder_metadata': folder.folder_metadata,
                    'document_count': folder.document_count,
                    'path_names': folder.path_names,
                    'children': []
                }
                
                folder_dict[folder.id] = folder_data
                
                if folder.parent_folder_id is None:
                    root_folders.append(folder_data)
                else:
                    parent = folder_dict.get(folder.parent_folder_id)
                    if parent:
                        parent['children'].append(folder_data)
            
            return {
                'success': True,
                'hierarchy': root_folders,
                'total_folders': len(folders)
            }
            
        except Exception as e:
            logger.error(f"Error getting folder hierarchy for collection {collection_id}: {str(e)}")
            raise Exception(f"获取文件夹层级结构失败: {str(e)}")
    
    async def move_folder(
        self,
        folder_id: str,
        new_parent_id: Optional[str],
        collection_id: str
    ) -> Dict[str, Any]:
        """移动文件夹到新的父文件夹"""
        try:
            # 获取要移动的文件夹
            folder = self.db.query(KnowledgeFolder).filter(
                and_(
                    KnowledgeFolder.id == folder_id,
                    KnowledgeFolder.collection_id == collection_id,
                    KnowledgeFolder.is_active == True
                )
            ).first()
            
            if not folder:
                raise ValueError("指定的文件夹不存在")
            
            # 验证新父文件夹
            if new_parent_id:
                new_parent = self.db.query(KnowledgeFolder).filter(
                    and_(
                        KnowledgeFolder.id == new_parent_id,
                        KnowledgeFolder.collection_id == collection_id,
                        KnowledgeFolder.is_active == True
                    )
                ).first()
                
                if not new_parent:
                    raise ValueError("指定的目标文件夹不存在")
                
                # 检查深度限制
                if folder.depth_level > 0:  # 子文件夹不能移动到其他文件夹下
                    raise ValueError("子文件夹不能移动到其他文件夹下")
                
                if not new_parent.can_add_subfolder():
                    raise ValueError("目标文件夹已达到最大嵌套深度")
                
                # 检查循环引用
                if new_parent_id == folder_id:
                    raise ValueError("不能将文件夹移动到自己下面")
            
            # 检查目标位置是否有同名文件夹
            existing_folder = self.db.query(KnowledgeFolder).filter(
                and_(
                    KnowledgeFolder.collection_id == collection_id,
                    KnowledgeFolder.parent_folder_id == new_parent_id,
                    KnowledgeFolder.name == folder.name,
                    KnowledgeFolder.id != folder_id,
                    KnowledgeFolder.is_active == True
                )
            ).first()
            
            if existing_folder:
                raise ValueError("目标位置已存在相同名称的文件夹")
            
            # 执行移动
            old_parent_id = folder.parent_folder_id
            folder.parent_folder_id = new_parent_id
            folder.updated_at = datetime.utcnow()
            
            self.db.commit()
            self.db.refresh(folder)
            
            logger.info(f"Moved folder {folder_id} from {old_parent_id} to {new_parent_id}")
            
            return {
                'success': True,
                'folder': folder.to_dict(),
                'message': '文件夹移动成功'
            }
            
        except ValueError as e:
            self.db.rollback()
            logger.error(f"Folder move validation error: {str(e)}")
            raise e
        except Exception as e:
            self.db.rollback()
            logger.error(f"Folder move error: {str(e)}")
            raise Exception(f"文件夹移动失败: {str(e)}")
    
    async def delete_folder(
        self,
        folder_id: str,
        collection_id: str,
        force: bool = False
    ) -> Dict[str, Any]:
        """删除文件夹"""
        try:
            folder = self.db.query(KnowledgeFolder).filter(
                and_(
                    KnowledgeFolder.id == folder_id,
                    KnowledgeFolder.collection_id == collection_id,
                    KnowledgeFolder.is_active == True
                )
            ).first()
            
            if not folder:
                raise ValueError("指定的文件夹不存在")
            
            # 检查是否为根文件夹
            if folder.depth_level == 0 and folder.folder_metadata and folder.folder_metadata.get('system_folder'):
                raise ValueError("不能删除系统根文件夹")
            
            # 检查文件夹是否为空
            if not force:
                # 检查是否有文档
                document_count = self.db.query(func.count(KnowledgeDocument.id)).filter(
                    KnowledgeDocument.folder_id == folder_id
                ).scalar()
                
                if document_count > 0:
                    raise ValueError(f"文件夹不为空，包含 {document_count} 个文档。请先移动或删除文档，或使用强制删除")
                
                # 检查是否有子文件夹
                subfolder_count = self.db.query(func.count(KnowledgeFolder.id)).filter(
                    and_(
                        KnowledgeFolder.parent_folder_id == folder_id,
                        KnowledgeFolder.is_active == True
                    )
                ).scalar()
                
                if subfolder_count > 0:
                    raise ValueError(f"文件夹不为空，包含 {subfolder_count} 个子文件夹。请先删除子文件夹，或使用强制删除")
            
            # 执行删除（软删除）
            folder.is_active = False
            folder.updated_at = datetime.utcnow()
            
            if force:
                # 强制删除：将文件夹下的文档移动到根文件夹
                root_folder = self.db.query(KnowledgeFolder).filter(
                    and_(
                        KnowledgeFolder.collection_id == collection_id,
                        KnowledgeFolder.depth_level == 0,
                        KnowledgeFolder.is_active == True
                    )
                ).first()
                
                if root_folder:
                    # 移动文档到根文件夹
                    self.db.query(KnowledgeDocument).filter(
                        KnowledgeDocument.folder_id == folder_id
                    ).update({
                        'folder_id': root_folder.id,
                        'folder_path': root_folder.folder_path
                    })
                    
                    # 递归删除子文件夹
                    subfolders = self.db.query(KnowledgeFolder).filter(
                        and_(
                            KnowledgeFolder.parent_folder_id == folder_id,
                            KnowledgeFolder.is_active == True
                        )
                    ).all()
                    
                    for subfolder in subfolders:
                        await self.delete_folder(subfolder.id, collection_id, force=True)
            
            self.db.commit()
            
            logger.info(f"Deleted folder {folder_id} (force={force})")
            
            return {
                'success': True,
                'message': '文件夹删除成功'
            }
            
        except ValueError as e:
            self.db.rollback()
            logger.error(f"Folder deletion validation error: {str(e)}")
            raise e
        except Exception as e:
            self.db.rollback()
            logger.error(f"Folder deletion error: {str(e)}")
            raise Exception(f"文件夹删除失败: {str(e)}")
    
    async def rename_folder(
        self,
        folder_id: str,
        new_name: str,
        collection_id: str
    ) -> Dict[str, Any]:
        """重命名文件夹"""
        try:
            folder = self.db.query(KnowledgeFolder).filter(
                and_(
                    KnowledgeFolder.id == folder_id,
                    KnowledgeFolder.collection_id == collection_id,
                    KnowledgeFolder.is_active == True
                )
            ).first()
            
            if not folder:
                raise ValueError("指定的文件夹不存在")
            
            # 验证新名称
            new_name = new_name.strip()
            if not new_name:
                raise ValueError("文件夹名称不能为空")
            
            # 检查同级是否有重名文件夹
            existing_folder = self.db.query(KnowledgeFolder).filter(
                and_(
                    KnowledgeFolder.collection_id == collection_id,
                    KnowledgeFolder.parent_folder_id == folder.parent_folder_id,
                    KnowledgeFolder.name == new_name,
                    KnowledgeFolder.id != folder_id,
                    KnowledgeFolder.is_active == True
                )
            ).first()
            
            if existing_folder:
                raise ValueError("同级目录下已存在相同名称的文件夹")
            
            # 执行重命名
            old_name = folder.name
            folder.name = new_name
            folder.updated_at = datetime.utcnow()
            
            self.db.commit()
            self.db.refresh(folder)
            
            logger.info(f"Renamed folder {folder_id} from '{old_name}' to '{new_name}'")
            
            return {
                'success': True,
                'folder': folder.to_dict(),
                'message': '文件夹重命名成功'
            }
            
        except ValueError as e:
            self.db.rollback()
            logger.error(f"Folder rename validation error: {str(e)}")
            raise e
        except Exception as e:
            self.db.rollback()
            logger.error(f"Folder rename error: {str(e)}")
            raise Exception(f"文件夹重命名失败: {str(e)}")
    
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
        """获取文件夹中的文档列表"""
        try:
            # 验证文件夹存在
            folder = self.db.query(KnowledgeFolder).filter(
                and_(
                    KnowledgeFolder.id == folder_id,
                    KnowledgeFolder.collection_id == collection_id,
                    KnowledgeFolder.is_active == True
                )
            ).first()
            
            if not folder:
                raise ValueError("指定的文件夹不存在")
            
            # 构建查询
            query = self.db.query(KnowledgeDocument).filter(
                KnowledgeDocument.folder_id == folder_id
            )
            
            # 应用过滤条件
            if search_query:
                query = query.filter(
                    or_(
                        KnowledgeDocument.title.ilike(f"%{search_query}%"),
                        KnowledgeDocument.filename.ilike(f"%{search_query}%")
                    )
                )
            
            if file_type:
                query = query.filter(KnowledgeDocument.file_type == file_type)
            
            if status_filter:
                query = query.filter(KnowledgeDocument.status == status_filter)
            
            # 总数统计
            total = query.count()
            
            # 分页查询
            offset = (page - 1) * size
            documents = query.order_by(desc(KnowledgeDocument.updated_at)).offset(offset).limit(size).all()
            
            # 转换为字典格式
            document_list = []
            for doc in documents:
                document_list.append({
                    'id': doc.id,
                    'title': doc.title,
                    'filename': doc.filename,
                    'file_type': doc.file_type,
                    'file_size': doc.file_size,
                    'status': doc.status,
                    'tags': doc.tags,
                    'folder_path': doc.folder_path,
                    'document_category': doc.document_category,
                    'domain_type': doc.domain_type,
                    'created_at': doc.created_at.isoformat() if doc.created_at else None,
                    'updated_at': doc.updated_at.isoformat() if doc.updated_at else None
                })
            
            return {
                'success': True,
                'documents': document_list,
                'total': total,
                'page': page,
                'size': size,
                'total_pages': (total + size - 1) // size,
                'folder': folder.to_dict()
            }
            
        except ValueError as e:
            logger.error(f"Get folder documents validation error: {str(e)}")
            raise e
        except Exception as e:
            logger.error(f"Get folder documents error: {str(e)}")
            raise Exception(f"获取文件夹文档失败: {str(e)}")


# 创建全局实例（依赖注入时使用）
def get_folder_service(db: AsyncSession) -> FolderService:
    """获取文件夹服务实例"""
    return FolderService(db)