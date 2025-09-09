"""
文件夹管理数据模型
支持2层嵌套的文件夹结构
"""

from sqlalchemy import Column, String, Text, Integer, Boolean, DateTime, ForeignKey, CheckConstraint, UniqueConstraint, JSON
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship, validates
from sqlalchemy.sql import func
from typing import List, Optional, Dict, Any
from datetime import datetime
from db.database import Base


class KnowledgeFolder(Base):
    """知识库文件夹模型"""
    __tablename__ = 'knowledge_folders'
    
    # 基本字段
    id = Column(String(50), primary_key=True)
    name = Column(String(200), nullable=False, comment="文件夹名称")
    description = Column(Text, comment="文件夹描述")
    
    # 层级关系
    parent_folder_id = Column(String(50), ForeignKey('knowledge_folders.id', ondelete='CASCADE'), nullable=True, comment="父文件夹ID")
    collection_id = Column(String(50), ForeignKey('knowledge_collections.id', ondelete='CASCADE'), nullable=False, comment="所属知识库ID")
    folder_path = Column(Text, nullable=False, comment="完整文件夹路径")
    depth_level = Column(Integer, nullable=False, default=0, comment="文件夹深度层级")
    
    # 排序和状态
    sort_order = Column(Integer, default=0, comment="排序顺序")
    is_active = Column(Boolean, default=True, comment="是否启用")
    
    # 元数据
    folder_metadata = Column(JSONB, comment="文件夹元数据")
    
    # 时间戳
    created_at = Column(DateTime(timezone=True), server_default=func.now(), comment="创建时间")
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), comment="更新时间")
    created_by = Column(String(50), comment="创建者")
    
    # 关系
    parent_folder = relationship("KnowledgeFolder", remote_side=[id], backref="subfolders")
    collection = relationship("KnowledgeCollection", backref="folders")
    documents = relationship("KnowledgeDocument", backref="folder", cascade="all, delete-orphan")
    
    # 约束
    __table_args__ = (
        CheckConstraint('depth_level <= 1', name='check_folder_depth_max'),
        CheckConstraint('(depth_level = 0 AND parent_folder_id IS NULL) OR (depth_level = 1 AND parent_folder_id IS NOT NULL)', name='check_folder_depth_consistency'),
        UniqueConstraint('collection_id', 'parent_folder_id', 'name', name='unique_folder_name_in_parent'),
    )
    
    @validates('name')
    def validate_name(self, key, name):
        """验证文件夹名称"""
        if not name or len(name.strip()) == 0:
            raise ValueError("文件夹名称不能为空")
        if len(name) > 200:
            raise ValueError("文件夹名称不能超过200个字符")
        # 检查是否包含非法字符
        invalid_chars = ['/', '\\', ':', '*', '?', '"', '<', '>', '|']
        if any(char in name for char in invalid_chars):
            raise ValueError(f"文件夹名称不能包含以下字符: {', '.join(invalid_chars)}")
        return name.strip()
    
    @validates('depth_level')
    def validate_depth_level(self, key, depth_level):
        """验证文件夹深度"""
        if depth_level < 0 or depth_level > 1:
            raise ValueError("文件夹嵌套深度不能超过2层")
        return depth_level
    
    def to_dict(self) -> Dict[str, Any]:
        """转换为字典"""
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'parent_folder_id': self.parent_folder_id,
            'collection_id': self.collection_id,
            'folder_path': self.folder_path,
            'depth_level': self.depth_level,
            'sort_order': self.sort_order,
            'is_active': self.is_active,
            'folder_metadata': self.folder_metadata,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'created_by': self.created_by,
            'document_count': len(self.documents) if self.documents else 0
        }
    
    def get_full_path(self) -> str:
        """获取完整路径名称"""
        if self.parent_folder:
            return f"{self.parent_folder.get_full_path()}/{self.name}"
        return self.name
    
    def can_add_subfolder(self) -> bool:
        """检查是否可以添加子文件夹"""
        return self.depth_level < 1
    
    def get_ancestors(self) -> List['KnowledgeFolder']:
        """获取所有祖先文件夹"""
        ancestors = []
        current = self.parent_folder
        while current:
            ancestors.append(current)
            current = current.parent_folder
        return list(reversed(ancestors))  # 从根到直接父级的顺序
    
    def get_descendants(self) -> List['KnowledgeFolder']:
        """获取所有后代文件夹"""
        descendants = []
        for subfolder in self.subfolders:
            if subfolder.is_active:
                descendants.append(subfolder)
                descendants.extend(subfolder.get_descendants())
        return descendants
    
    def move_to_folder(self, new_parent_id: Optional[str] = None) -> bool:
        """移动文件夹到新的父文件夹"""
        if new_parent_id:
            # 检查目标深度是否合法
            if self.depth_level >= 1:
                raise ValueError("子文件夹不能再移动到其他文件夹下")
            # 检查是否形成循环引用
            if new_parent_id == self.id:
                raise ValueError("不能将文件夹移动到自己下面")
            # TODO: 实现更复杂的循环检测
        
        self.parent_folder_id = new_parent_id
        return True
    
    def update_metadata(self, metadata: Dict[str, Any]) -> None:
        """更新文件夹元数据"""
        if self.folder_metadata:
            self.folder_metadata.update(metadata)
        else:
            self.folder_metadata = metadata
        self.updated_at = datetime.utcnow()
    
    @classmethod
    def create_root_folder(cls, collection_id: str, created_by: str = 'system') -> 'KnowledgeFolder':
        """为知识库创建根文件夹"""
        return cls(
            id=f"folder_root_{collection_id}",
            name="根目录",
            description="知识库根目录",
            collection_id=collection_id,
            parent_folder_id=None,
            depth_level=0,
            folder_metadata={
                'type': 'root',
                'auto_created': True,
                'system_folder': True
            },
            created_by=created_by
        )