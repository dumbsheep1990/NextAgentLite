"""
Agent配置数据模型 - 存储智能体的配置信息
"""
from sqlalchemy import Column, String, Float, Integer, DateTime, Text, Boolean
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime
import json

from db.database import Base


class AgentConfig(Base):
    """智能体配置表"""
    
    __tablename__ = "agent_configs"
    
    # 基本信息
    id = Column(String(36), primary_key=True, comment="配置ID")
    agent_name = Column(String(100), nullable=False, index=True, comment="智能体名称")
    team_name = Column(String(100), nullable=True, index=True, comment="所属团队名称")
    
    # 模型配置
    model_provider = Column(String(50), nullable=True, comment="模型提供商")
    model_id = Column(String(100), nullable=True, comment="模型ID")
    
    # 模型参数
    temperature = Column(Float, nullable=True, default=0.7, comment="温度参数")
    max_tokens = Column(Integer, nullable=True, default=4096, comment="最大Token数")
    top_p = Column(Float, nullable=True, default=0.8, comment="Top-P参数")
    frequency_penalty = Column(Float, nullable=True, default=0.0, comment="频率惩罚")
    presence_penalty = Column(Float, nullable=True, default=0.0, comment="存在惩罚")
    
    # 额外配置(JSON格式)
    extra_config = Column(Text, nullable=True, comment="额外配置JSON")
    
    # 状态信息
    is_active = Column(Boolean, nullable=False, default=True, comment="是否启用")
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow, comment="创建时间")
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow, comment="更新时间")
    
    def to_dict(self):
        """转换为字典"""
        return {
            'id': self.id,
            'agent_name': self.agent_name,
            'team_name': self.team_name,
            'model_provider': self.model_provider,
            'model_id': self.model_id,
            'temperature': self.temperature,
            'max_tokens': self.max_tokens,
            'top_p': self.top_p,
            'frequency_penalty': self.frequency_penalty,
            'presence_penalty': self.presence_penalty,
            'extra_config': json.loads(self.extra_config) if self.extra_config else {},
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
    
    def update_from_dict(self, config: dict):
        """从字典更新配置"""
        for key, value in config.items():
            if hasattr(self, key) and key not in ['id', 'created_at']:
                if key == 'extra_config' and isinstance(value, dict):
                    setattr(self, key, json.dumps(value))
                else:
                    setattr(self, key, value)
        
        self.updated_at = datetime.utcnow()