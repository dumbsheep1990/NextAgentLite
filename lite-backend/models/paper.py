"""
论文模型 - 用于存储研究论文信息
"""
from sqlalchemy import Column, Integer, String, Text, DateTime, JSON, Float
from sqlalchemy.sql import func
from db.database import Base


class Paper(Base):
    """研究论文数据模型"""
    
    __tablename__ = "papers"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(500), nullable=False, index=True)
    authors = Column(String(1000), nullable=False)
    journal = Column(String(200), nullable=True)
    year = Column(Integer, nullable=True)
    pages = Column(String(50), nullable=True)
    doi = Column(String(100), nullable=True, unique=True, index=True)
    url = Column(String(500), nullable=True)
    abstract = Column(Text, nullable=True)
    content = Column(Text, nullable=True)
    keywords = Column(JSON, nullable=True)  # 存储为JSON数组
    
    # 用于相似性搜索的向量嵌入
    title_embedding = Column(JSON, nullable=True)
    abstract_embedding = Column(JSON, nullable=True)
    content_embedding = Column(JSON, nullable=True)
    
    # 元数据
    file_path = Column(String(500), nullable=True)
    file_size = Column(Integer, nullable=True)
    processed = Column(String(20), default="pending")  # pending, processing, completed, failed
    confidence_score = Column(Float, default=0.0)
    
    # 时间戳
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    def __repr__(self):
        return f"<Paper(id={self.id}, title='{self.title[:50]}...')>" 