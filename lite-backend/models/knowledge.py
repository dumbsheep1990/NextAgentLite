"""
知识库模型 - 用于存储文档、向量配置和模型配置
"""
from sqlalchemy import Column, Integer, String, Text, DateTime, JSON, Float, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from db.database import Base


class KnowledgeDocument(Base):
    """知识库文档数据模型"""
    
    __tablename__ = "knowledge_documents"
    
    id = Column(String(50), primary_key=True, index=True)  # UUID
    title = Column(String(500), nullable=False, index=True)
    filename = Column(String(500), nullable=False)
    file_type = Column(String(50), nullable=False)  # 支持'url'类型
    file_size = Column(Integer, nullable=False)
    
    # URL文档特有字段
    source_url = Column(String(2000), nullable=True, index=True)  # 原始URL
    scrape_method = Column(String(50), nullable=True)  # crawl4ai, deepscrape
    scrape_metadata = Column(JSON, nullable=True)  # 抓取元数据（响应时间、状态码等）
    content_hash = Column(String(64), nullable=True, index=True)  # 内容哈希，用于检测更新
    
    # 文档状态
    status = Column(String(20), nullable=False, default="pending")  # pending, processing, vectorized, failed, graph_extracted
    
    # 标签
    tags = Column(JSON, nullable=True)  # 存储为JSON数组
    
    # Collection关联（新增字段）
    collection_id = Column(String(50), ForeignKey("knowledge_collections.id"), nullable=True, index=True)
    
    # 文件夹关联（新增字段）
    folder_id = Column(String(50), ForeignKey("knowledge_folders.id"), nullable=True, index=True)
    folder_path = Column(Text, nullable=True)  # 完整文件夹路径，用于快速查询和显示
    
    # 元数据模版相关字段（新增）
    metadata_template_id = Column(String(50), ForeignKey("metadata_templates.id"), nullable=True, index=True)
    structured_metadata = Column(JSON, nullable=True)  # 结构化元数据，按模版格式存储
    metadata_extraction_status = Column(String(20), default="pending")  # pending|processing|completed|failed
    metadata_extraction_log = Column(JSON, nullable=True)  # 提取过程日志
    
    # 模版特定字段（为常用查询优化）
    document_category = Column(String(100), nullable=True, index=True)  # 文档分类
    domain_type = Column(String(50), nullable=True, index=True)  # 领域类型
    effective_date = Column(DateTime(timezone=True), nullable=True, index=True)  # 生效日期（政策文档）
    expiry_date = Column(DateTime(timezone=True), nullable=True, index=True)    # 失效日期（政策文档）
    
    # QA提取相关字段（新增）
    auto_qa_extraction_enabled = Column(Boolean, default=False)  # 是否启用自动QA提取
    qa_extraction_status = Column(String(50), default="not_started")  # QA提取状态
    qa_extraction_task_id = Column(Integer, nullable=True)  # 关联的QA提取任务ID
    qa_dataset_id = Column(String(50), nullable=True)  # 自动生成的QA数据集ID
    qa_extraction_config = Column(JSON, nullable=True)  # QA提取配置参数
    qa_extraction_started_at = Column(DateTime(timezone=True), nullable=True)  # QA提取开始时间
    qa_extraction_completed_at = Column(DateTime(timezone=True), nullable=True)  # QA提取完成时间
    qa_extraction_error_message = Column(Text, nullable=True)  # QA提取错误信息
    
    # 原有字段
    # 元数据
    document_metadata = Column("document_metadata", JSON, nullable=True)  # 包含author, keywords, description, language等
    
    # 向量化状态
    vector_status = Column(JSON, nullable=True)  # 包含progress, model, chunks等信息
    
    # 文件路径
    file_path = Column(String(1000), nullable=True)
    
    # 时间戳
    upload_time = Column(DateTime(timezone=True), nullable=False)
    created_at = Column(DateTime(timezone=True), nullable=False)
    updated_at = Column(DateTime(timezone=True), nullable=False)
    
    # 关系映射
    chunks = relationship("DocumentChunk", back_populates="document", cascade="all, delete-orphan")
    
    # 新增关系映射
    collection = relationship("KnowledgeCollection", back_populates="documents")
    metadata_template = relationship("MetadataTemplate")
    
    def __repr__(self):
        return f"<KnowledgeDocument(id='{self.id}', title='{self.title[:50]}...')>"


class DocumentChunk(Base):
    """文档分块数据模型"""
    
    __tablename__ = "document_chunks"
    
    id = Column(String(50), primary_key=True, index=True)  # UUID
    document_id = Column(String(50), ForeignKey("knowledge_documents.id"), nullable=False)
    
    # 分块内容
    content = Column(Text, nullable=False)
    chunk_index = Column(Integer, nullable=False)
    
    # 向量嵌入 - 支持双向量化
    embedding = Column(JSON, nullable=True)  # 存储向量嵌入（向后兼容）
    embedding_model = Column(String(100), nullable=True)
    
    # 双向量化支持
    general_embedding = Column(JSON, nullable=True)  # 通用向量 (text-embedding-v4)
    domain_embedding = Column(JSON, nullable=True)   # 领域向量 (matbert-base-v1)
    general_model = Column(String(100), nullable=True)  # 通用模型名称
    domain_model = Column(String(100), nullable=True)   # 领域模型名称
    vectorization_strategy = Column(String(20), nullable=True)  # dual|general|domain
    
    # 分块元数据
    chunk_metadata = Column(JSON, nullable=True)  # 页码、位置等信息
    
    # 时间戳
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # 关系映射
    document = relationship("KnowledgeDocument", back_populates="chunks")
    
    def __repr__(self):
        return f"<DocumentChunk(id='{self.id}', document_id='{self.document_id}')>"


class VectorConfig(Base):
    """向量配置数据模型"""
    
    __tablename__ = "vector_configs"
    
    id = Column(String(50), primary_key=True, index=True)  # UUID
    name = Column(String(200), nullable=False, index=True)
    model = Column(String(200), nullable=False)
    dimension = Column(Integer, nullable=False)
    chunk_size = Column(Integer, nullable=False)
    chunk_overlap = Column(Integer, nullable=False)
    strategy = Column(String(50), nullable=False)  # sentence, paragraph, custom
    is_default = Column(Boolean, default=False)
    
    # 时间戳
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    def __repr__(self):
        return f"<VectorConfig(id='{self.id}', name='{self.name}')>"


class ModelConfig(Base):
    """模型配置数据模型"""
    
    __tablename__ = "model_configs"
    
    id = Column(String(50), primary_key=True, index=True)  # UUID
    name = Column(String(200), nullable=False, index=True)
    type = Column(String(50), nullable=False)  # embedding, chat, reasoning
    provider = Column(String(100), nullable=False)
    model = Column(String(200), nullable=False)
    
    # API配置
    api_key = Column(String(500), nullable=True)
    base_url = Column(String(500), nullable=True)
    
    # 模型参数
    parameters = Column(JSON, nullable=True)
    is_active = Column(Boolean, default=True)
    
    # 兼容属性
    max_tokens = Column(Integer, nullable=True)
    temperature = Column(Float, nullable=True)
    dimension = Column(Integer, nullable=True)
    
    # 时间戳
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    def __repr__(self):
        return f"<ModelConfig(id='{self.id}', name='{self.name}', type='{self.type}')>"


class RetrievalResult(Base):
    """检索结果缓存数据模型"""
    
    __tablename__ = "retrieval_results"
    
    id = Column(String(50), primary_key=True, index=True)  # UUID
    query = Column(Text, nullable=False, index=True)
    query_hash = Column(String(100), nullable=False, index=True)  # 查询的哈希值
    
    # 检索结果
    results = Column(JSON, nullable=False)  # 存储检索结果
    
    # 检索参数
    top_k = Column(Integer, nullable=False)
    threshold = Column(Float, nullable=True)
    rerank = Column(Boolean, default=False)
    model_used = Column(String(200), nullable=True)
    
    # 性能指标
    retrieval_time = Column(Float, nullable=True)  # 检索时间（秒）
    total_matches = Column(Integer, nullable=True)
    
    # 缓存控制
    expires_at = Column(DateTime(timezone=True), nullable=True)
    
    # 时间戳
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    def __repr__(self):
        return f"<RetrievalResult(id='{self.id}', query='{self.query[:50]}...')>"


# 为向后兼容，创建别名
Document = KnowledgeDocument