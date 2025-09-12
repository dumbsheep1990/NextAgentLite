"""
QA数据集模型 - 结构化问答数据管理
"""
from sqlalchemy import Column, String, Text, DateTime, Integer, JSON, Boolean, ForeignKey, Index
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

from db.database import Base


class QADataset(Base):
    """QA数据集表 - 管理Excel格式的问答数据集"""
    __tablename__ = "qa_datasets"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String(255), nullable=False, comment="数据集标题")
    description = Column(Text, comment="数据集描述")
    category = Column(String(100), comment="数据集类别")
    collection_id = Column(String(255), ForeignKey('knowledge_collections.id', ondelete='CASCADE'), comment="所属知识库ID")
    
    # 文件信息
    file_path = Column(String(500), nullable=False, comment="Excel文件存储路径")
    file_name = Column(String(255), nullable=False, comment="原始文件名")
    file_size = Column(Integer, comment="文件大小(字节)")
    file_hash = Column(String(64), comment="文件哈希值")
    
    # 处理状态
    status = Column(String(20), default="pending", comment="处理状态: pending/processing/completed/failed")
    
    # 统计信息
    total_qa_pairs = Column(Integer, default=0, comment="总问答对数量")
    processed_qa_pairs = Column(Integer, default=0, comment="已处理问答对数量")
    categories_count = Column(Integer, default=0, comment="包含的分类数量")
    
    # 向量化信息
    vectorization_status = Column(String(20), default="pending", comment="向量化状态")
    vector_model = Column(String(100), comment="使用的向量化模型")
    
    # 元数据
    dataset_metadata = Column(JSON, comment="数据集元数据")
    processing_logs = Column(JSON, comment="处理日志")
    
    # 时间戳
    created_at = Column(DateTime, default=datetime.utcnow, comment="创建时间")
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, comment="更新时间")
    processed_at = Column(DateTime, comment="处理完成时间")
    
    # 关联关系
    qa_pairs = relationship("QAPair", back_populates="dataset", cascade="all, delete-orphan")
    collection = relationship("KnowledgeCollection", foreign_keys=[collection_id])


class QAPair(Base):
    """QA问答对表 - 存储单个问答对"""
    __tablename__ = "qa_pairs"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    dataset_id = Column(UUID(as_uuid=True), ForeignKey("qa_datasets.id"), nullable=False, comment="所属数据集ID")
    
    # QA内容
    category = Column(String(100), comment="问题分类")
    question = Column(Text, nullable=False, comment="问题内容")
    answer = Column(Text, nullable=False, comment="答案内容")
    
    # 原始数据信息
    row_number = Column(Integer, comment="在Excel中的行号")
    source_sheet = Column(String(100), comment="来源工作表名称")
    
    # 向量化信息
    question_vector_id = Column(String(255), comment="问题向量在ES中的ID")
    vector_status = Column(String(20), default="pending", comment="向量化状态")
    
    # 质量评估
    quality_score = Column(Integer, comment="质量评分(1-5)")
    is_validated = Column(Boolean, default=False, comment="是否已验证")
    validation_notes = Column(Text, comment="验证备注")
    
    # 使用统计
    usage_count = Column(Integer, default=0, comment="被检索使用次数")
    last_used_at = Column(DateTime, comment="最后使用时间")
    
    # 元数据
    qa_metadata = Column(JSON, comment="问答对元数据")
    
    # 时间戳
    created_at = Column(DateTime, default=datetime.utcnow, comment="创建时间")
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, comment="更新时间")
    
    # 关联关系
    dataset = relationship("QADataset", back_populates="qa_pairs")
    
    # 索引优化
    __table_args__ = (
        Index('idx_qa_pairs_dataset_id', 'dataset_id'),
        Index('idx_qa_pairs_category', 'category'),
        Index('idx_qa_pairs_vector_status', 'vector_status'),
        Index('idx_qa_pairs_dataset_category', 'dataset_id', 'category'),
    )


class QACategory(Base):
    """QA分类表 - 管理问答分类"""
    __tablename__ = "qa_categories"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    dataset_id = Column(UUID(as_uuid=True), ForeignKey("qa_datasets.id"), nullable=False, comment="所属数据集ID")
    
    name = Column(String(100), nullable=False, comment="分类名称")
    description = Column(Text, comment="分类描述")
    
    # 统计信息
    qa_count = Column(Integer, default=0, comment="该分类下的问答对数量")
    
    # 元数据
    category_metadata = Column(JSON, comment="分类元数据")
    
    # 时间戳
    created_at = Column(DateTime, default=datetime.utcnow, comment="创建时间")
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, comment="更新时间")