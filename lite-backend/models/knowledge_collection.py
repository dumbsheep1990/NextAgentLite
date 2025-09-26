"""
知识库集合模型 - Collection管理和元数据模版系统
按照组件拆分原则，控制文件大小 < 1000行
"""
from sqlalchemy import Column, Integer, String, Text, DateTime, JSON, Boolean, BigInteger
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from db.database import Base


class KnowledgeCollection(Base):
    """知识库集合数据模型"""
    
    __tablename__ = "knowledge_collections"
    
    # 基础字段
    id = Column(String(50), primary_key=True, index=True)  # UUID
    name = Column(String(200), nullable=False, index=True)
    description = Column(Text, nullable=True)
    icon = Column(String(100), nullable=True)  # 图标名称或路径
    color = Column(String(20), nullable=True)  # 颜色代码，如 #FF6B6B
    
    # 状态标识
    is_default = Column(Boolean, default=False, index=True)
    is_public = Column(Boolean, default=True)
    is_active = Column(Boolean, default=True, index=True)
    
    # 元数据模版配置
    metadata_template = Column(String(50), nullable=False, default="general", index=True)
    # 支持类型: general|policy|academic|enterprise
    template_version = Column(String(20), default="1.0")
    
    # 统计信息（自动维护）
    document_count = Column(Integer, default=0, index=True)
    vectorized_count = Column(Integer, default=0, index=True)  # 已向量化文档数量
    total_size = Column(BigInteger, default=0)  # 字节数
    last_updated = Column(DateTime(timezone=True), nullable=True)
    
    # 配置信息
    config = Column(JSON, nullable=True)  # 检索配置、权限配置等
    extra_metadata = Column(JSON, nullable=True)  # 额外的元数据信息
    
    # 切分配置
    default_chunking_config_id = Column(String(50), nullable=True, index=True)
    chunking_config = Column(JSON, nullable=True)  # 自定义切分配置
    
    # 模版特定配置
    template_config = Column(JSON, nullable=True)  # 模版相关的配置参数
    extraction_rules = Column(JSON, nullable=True)  # 元数据提取规则
    
    # QA提取相关字段
    auto_qa_extraction_enabled = Column(Boolean, default=False, index=True)  # 是否启用自动QA提取
    qa_extraction_config = Column(JSON, nullable=True)  # QA提取配置参数
    qa_extraction_last_run = Column(DateTime(timezone=True), nullable=True)  # 最后执行QA提取的时间
    qa_extraction_total_pairs = Column(Integer, default=0)  # 该知识库总共提取的QA对数量
    
    # 时间戳
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # 关系映射
    documents = relationship("KnowledgeDocument", back_populates="collection")
    
    def __repr__(self):
        return f"<KnowledgeCollection(id='{self.id}', name='{self.name}')>"
    
    def to_dict(self):
        """转换为字典格式"""
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'icon': self.icon,
            'color': self.color,
            'is_default': self.is_default,
            'is_public': self.is_public,
            'is_active': self.is_active,
            # 前端期望的字段：将布尔 is_active 映射为状态字符串
            'status': 'active' if (self.is_active is True) else 'inactive',
            'metadata_template': self.metadata_template,
            'template_version': self.template_version,
            'document_count': self.document_count or 0,  # 确保不是 None
            'vectorized_count': self.vectorized_count or 0,  # 确保不是 None
            'total_size': self.total_size or 0,  # 确保不是 None
            'last_updated': self.last_updated.isoformat() if self.last_updated else None,
            'config': self.config,
            'extra_metadata': self.extra_metadata,
            'default_chunking_config_id': self.default_chunking_config_id,
            'chunking_config': self.chunking_config,
            'template_config': self.template_config,
            # QA提取相关字段
            'auto_qa_extraction_enabled': self.auto_qa_extraction_enabled or False,
            'qa_extraction_config': self.qa_extraction_config,
            'qa_extraction_last_run': self.qa_extraction_last_run.isoformat() if self.qa_extraction_last_run else None,
            'qa_extraction_total_pairs': self.qa_extraction_total_pairs or 0,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
    
    def update_stats(self, document_count_delta: int = 0, size_delta: int = 0):
        """更新统计信息"""
        self.document_count = max(0, self.document_count + document_count_delta)
        self.total_size = max(0, self.total_size + size_delta)
        self.last_updated = func.now()


class MetadataTemplate(Base):
    """元数据模版数据模型"""
    
    __tablename__ = "metadata_templates"
    
    # 基础字段
    id = Column(String(50), primary_key=True, index=True)  # UUID
    name = Column(String(200), nullable=False, index=True)
    template_type = Column(String(50), nullable=False, index=True)  # general|policy|academic|enterprise
    version = Column(String(20), default="1.0")
    description = Column(Text, nullable=True)
    
    # 模版结构定义
    schema_definition = Column(JSON, nullable=False)  # JSON Schema格式的元数据结构定义
    extraction_config = Column(JSON, nullable=True)  # 自动提取配置
    validation_rules = Column(JSON, nullable=True)  # 数据验证规则
    
    # 显示配置
    display_config = Column(JSON, nullable=True)  # 前端显示配置
    search_config = Column(JSON, nullable=True)   # 搜索相关配置
    
    # 状态
    is_active = Column(Boolean, default=True, index=True)
    is_system = Column(Boolean, default=False, index=True)  # 系统内置模版
    
    # 使用统计
    usage_count = Column(Integer, default=0)  # 使用次数
    
    # 时间戳
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    def __repr__(self):
        return f"<MetadataTemplate(id='{self.id}', name='{self.name}', type='{self.template_type}')>"
    
    def to_dict(self):
        """转换为字典格式"""
        return {
            'id': self.id,
            'name': self.name,
            'template_type': self.template_type,
            'version': self.version,
            'description': self.description,
            'schema_definition': self.schema_definition,
            'extraction_config': self.extraction_config,
            'validation_rules': self.validation_rules,
            'display_config': self.display_config,
            'search_config': self.search_config,
            'is_active': self.is_active,
            'is_system': self.is_system,
            'usage_count': self.usage_count,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
    
    def increment_usage(self):
        """增加使用次数"""
        self.usage_count += 1


# 元数据提取任务状态枚举
EXTRACTION_STATUS = {
    'PENDING': 'pending',
    'PROCESSING': 'processing', 
    'COMPLETED': 'completed',
    'FAILED': 'failed',
    'SKIPPED': 'skipped'
}

# 模版类型枚举
TEMPLATE_TYPES = {
    'GENERAL': 'general',
    'POLICY': 'policy',
    'ACADEMIC': 'academic',
    'ENTERPRISE': 'enterprise'
}

# Collection默认配置
DEFAULT_COLLECTION_CONFIG = {
    "search": {
        "default_top_k": 20,
        "rerank_enabled": True,
        "filter_strategy": "auto"
    },
    "extraction": {
        "auto_extract": True,
        "batch_size": 10,
        "retry_limit": 3
    },
    "permissions": {
        "public_read": True,
        "auto_approve": True
    }
}

# 模版默认配置
DEFAULT_TEMPLATE_CONFIG = {
    "extraction": {
        "llm_model": "qwen3-30b-a3b-instruct-2507",
        "confidence_threshold": 0.8,
        "max_retries": 2
    },
    "validation": {
        "required_fields": [],
        "strict_mode": False
    }
}
