"""
对话模型 - 用于存储聊天历史和问答数据
"""
from sqlalchemy import Column, Integer, String, Text, DateTime, JSON, Float, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from db.database import Base


class Conversation(Base):
    """对话会话数据模型"""
    
    __tablename__ = "conversations"
    
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String(100), nullable=False, unique=True, index=True)
    title = Column(String(200), nullable=True)
    user_id = Column(Integer, nullable=True, index=True)  # 用户ID，关联到用户表
    
    # Team模式相关字段
    conversation_type = Column(String(20), nullable=True, default='single')  # 'single', 'team'
    team_name = Column(String(100), nullable=True)
    team_mode = Column(String(50), nullable=True)
    
    # 时间戳
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # 关系映射
    messages = relationship("ConversationMessage", back_populates="conversation", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Conversation(id={self.id}, session_id='{self.session_id}')>"


class ConversationMessage(Base):
    """对话中的单条消息数据模型"""
    
    __tablename__ = "conversation_messages"
    
    id = Column(Integer, primary_key=True, index=True)
    conversation_id = Column(Integer, ForeignKey("conversations.id"), nullable=False)
    message_type = Column(String(10), nullable=False)  # 'user' or 'ai'
    content = Column(Text, nullable=False)
    
    # AI回复元数据
    confidence = Column(Float, nullable=True)
    sources = Column(JSON, nullable=True)  # 引用的论文(现在也包含知识库检索来源)
    knowledge_sources = Column(JSON, nullable=True)  # 知识库检索来源
    graph_sources = Column(JSON, nullable=True)  # 知识图谱检索结果
    images = Column(JSON, nullable=True)  # 生成的图表/图片
    tables = Column(JSON, nullable=True)  # 数据表格
    highlights = Column(JSON, nullable=True)  # 来源高亮
    thinking = Column(JSON, nullable=True)  # AI思考过程数据
    
    # 处理信息
    processing_time = Column(Float, nullable=True)  # 响应时间（秒）
    model_used = Column(String(100), nullable=True)
    tokens_used = Column(Integer, nullable=True)
    
    # 智能体信息
    agent_id = Column(String(100), nullable=True)  # 智能体ID
    agent_name = Column(String(200), nullable=True)  # 智能体名称
    
    # Team消息相关字段
    is_team_message = Column(Boolean, nullable=True, default=False)  # 是否为Team消息
    team_info = Column(JSON, nullable=True)  # Team执行信息
    thinking_process = Column(JSON, nullable=True)  # 思考过程数据
    
    # 时间戳
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # 关系映射
    conversation = relationship("Conversation", back_populates="messages")
    
    def __repr__(self):
        return f"<ConversationMessage(id={self.id}, type='{self.message_type}')>" 