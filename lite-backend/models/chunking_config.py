"""
文档切分配置模型
"""

from sqlalchemy import Column, String, Integer, Boolean, JSON, DateTime, Text
from sqlalchemy.sql import func
from db.database import Base


class ChunkingConfig(Base):
    """文档切分配置表"""
    
    __tablename__ = "chunking_configs"
    
    # 基本信息
    id = Column(String(36), primary_key=True)
    name = Column(String(100), nullable=False, comment="配置名称")
    description = Column(Text, nullable=True, comment="配置描述")
    
    # 切分策略
    strategy = Column(String(20), nullable=False, default="semantic", comment="切分策略: semantic, fixed, naive")
    
    # 基本参数
    chunk_token_num = Column(Integer, nullable=False, default=400, comment="最小token数")
    max_token_num = Column(Integer, nullable=False, default=512, comment="最大token数")
    chunk_overlap = Column(Integer, nullable=False, default=50, comment="重叠token数")
    
    # 分隔符设置
    delimiter = Column(String(50), nullable=False, default="!?。！？", comment="分隔符")
    
    # 高级设置
    tokenizer_type = Column(String(20), nullable=False, default="simple", comment="分词器类型: simple, advanced")
    preserve_structure = Column(Boolean, nullable=False, default=True, comment="是否保留文档结构")
    semantic_threshold = Column(Integer, nullable=False, default=30, comment="语义相关性阈值(百分比)")
    
    # 文件类型支持
    supported_formats = Column(JSON, nullable=True, comment="支持的文件格式")
    
    # 状态管理
    is_default = Column(Boolean, nullable=False, default=False, comment="是否为默认配置")
    is_active = Column(Boolean, nullable=False, default=True, comment="是否启用")
    
    # 作用域管理
    scope = Column(String(20), nullable=False, default='global', comment="配置作用域: global(全局), collection_specific(知识库专属)")
    collection_id = Column(String(50), nullable=True, comment="专属配置归属的知识库ID")
    
    # 时间戳
    created_at = Column(DateTime(timezone=True), server_default=func.now(), comment="创建时间")
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), comment="更新时间")
    
    def to_dict(self):
        """转换为字典格式"""
        # 确保 delimiter 不为空
        delimiter = self.delimiter if self.delimiter and self.delimiter.strip() else "!?。！？"
        
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "strategy": self.strategy,
            "chunk_token_num": self.chunk_token_num,
            "max_token_num": self.max_token_num,
            "chunk_overlap": self.chunk_overlap,
            "delimiter": delimiter,
            "tokenizer_type": self.tokenizer_type,
            "preserve_structure": self.preserve_structure,
            "semantic_threshold": self.semantic_threshold,
            "supported_formats": self.supported_formats,
            "is_default": self.is_default,
            "is_active": self.is_active,
            "scope": self.scope,
            "collection_id": self.collection_id,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None
        }
    
    def to_parser_config(self):
        """转换为解析器配置格式"""
        # 确保 delimiter 不为空
        delimiter = self.delimiter if self.delimiter and self.delimiter.strip() else "!?。！？"
        
        return {
            "chunk_token_num": self.chunk_token_num,
            "max_token_num": self.max_token_num,
            "delimiter": delimiter,
            "chunk_overlap": self.chunk_overlap,
            "preserve_structure": self.preserve_structure,
            "semantic_threshold": self.semantic_threshold
        }