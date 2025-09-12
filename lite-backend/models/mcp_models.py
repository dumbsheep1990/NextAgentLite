"""
MCP集成相关的数据模型
"""
from datetime import datetime
from typing import Optional, List, Dict, Any
from uuid import UUID, uuid4

from sqlalchemy import Column, String, Text, Boolean, Integer, DateTime, ForeignKey, JSON
from sqlalchemy.dialects.postgresql import UUID as PG_UUID, ARRAY
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from db.database import Base

class MCPServer(Base):
    """MCP服务器表"""
    __tablename__ = "mcp_servers"
    
    id = Column(PG_UUID(as_uuid=True), primary_key=True, default=uuid4)
    name = Column(String(100), unique=True, nullable=False, index=True)
    display_name = Column(String(200), nullable=False)
    description = Column(Text)
    server_type = Column(String(50), nullable=False, default="external", index=True)
    connection_config = Column(JSON, nullable=False)
    transport_type = Column(String(20), nullable=False, default="stdio")
    is_enabled = Column(Boolean, default=True, index=True)
    health_status = Column(String(20), default="unknown", index=True)
    last_health_check = Column(DateTime(timezone=True))
    server_metadata = Column(JSON, default={})
    created_at = Column(DateTime(timezone=True), default=func.now())
    updated_at = Column(DateTime(timezone=True), default=func.now(), onupdate=func.now())
    
    # 关系
    tools = relationship("MCPTool", back_populates="server", cascade="all, delete-orphan")
    resources = relationship("MCPResource", back_populates="server", cascade="all, delete-orphan")
    prompts = relationship("MCPPrompt", back_populates="server", cascade="all, delete-orphan")

class MCPTool(Base):
    """MCP工具表"""
    __tablename__ = "mcp_tools"
    
    id = Column(PG_UUID(as_uuid=True), primary_key=True, default=uuid4)
    server_id = Column(PG_UUID(as_uuid=True), ForeignKey("mcp_servers.id", ondelete="CASCADE"), nullable=False, index=True)
    tool_name = Column(String(100), nullable=False, index=True)
    display_name = Column(String(200), nullable=False)
    description = Column(Text)
    tool_schema = Column(JSON, nullable=False)
    category = Column(String(50), index=True)
    tags = Column(ARRAY(String), default=[])
    is_enabled = Column(Boolean, default=True, index=True)
    usage_count = Column(Integer, default=0)
    last_used_at = Column(DateTime(timezone=True))
    performance_metrics = Column(JSON, default={})
    created_at = Column(DateTime(timezone=True), default=func.now())
    updated_at = Column(DateTime(timezone=True), default=func.now(), onupdate=func.now())
    
    # 关系
    server = relationship("MCPServer", back_populates="tools")
    tool_calls = relationship("MCPToolCall", back_populates="tool", cascade="all, delete-orphan")
    
    # 唯一约束
    __table_args__ = (
        {"schema": None},  # 确保在默认schema中
    )

class MCPResource(Base):
    """MCP资源表"""
    __tablename__ = "mcp_resources"
    
    id = Column(PG_UUID(as_uuid=True), primary_key=True, default=uuid4)
    server_id = Column(PG_UUID(as_uuid=True), ForeignKey("mcp_servers.id", ondelete="CASCADE"), nullable=False, index=True)
    resource_uri = Column(String(500), nullable=False, index=True)
    resource_name = Column(String(200), nullable=False)
    resource_type = Column(String(50), index=True)
    description = Column(Text)
    mime_type = Column(String(100))
    resource_schema = Column(JSON)
    is_enabled = Column(Boolean, default=True, index=True)
    access_count = Column(Integer, default=0)
    last_accessed_at = Column(DateTime(timezone=True))
    resource_metadata = Column(JSON, default={})
    created_at = Column(DateTime(timezone=True), default=func.now())
    updated_at = Column(DateTime(timezone=True), default=func.now(), onupdate=func.now())
    
    # 关系
    server = relationship("MCPServer", back_populates="resources")

class MCPPrompt(Base):
    """MCP提示模板表"""
    __tablename__ = "mcp_prompts"
    
    id = Column(PG_UUID(as_uuid=True), primary_key=True, default=uuid4)
    server_id = Column(PG_UUID(as_uuid=True), ForeignKey("mcp_servers.id", ondelete="CASCADE"), nullable=False, index=True)
    prompt_name = Column(String(100), nullable=False, index=True)
    display_name = Column(String(200), nullable=False)
    description = Column(Text)
    prompt_template = Column(Text, nullable=False)
    prompt_schema = Column(JSON)
    category = Column(String(50), index=True)
    tags = Column(ARRAY(String), default=[])
    is_enabled = Column(Boolean, default=True, index=True)
    usage_count = Column(Integer, default=0)
    last_used_at = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), default=func.now())
    updated_at = Column(DateTime(timezone=True), default=func.now(), onupdate=func.now())
    
    # 关系
    server = relationship("MCPServer", back_populates="prompts")

class MCPToolCall(Base):
    """MCP工具调用日志表"""
    __tablename__ = "mcp_tool_calls"
    
    id = Column(PG_UUID(as_uuid=True), primary_key=True, default=uuid4)
    tool_id = Column(PG_UUID(as_uuid=True), ForeignKey("mcp_tools.id", ondelete="CASCADE"), nullable=False, index=True)
    session_id = Column(String(100), index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), index=True)
    call_request = Column(JSON, nullable=False)
    call_response = Column(JSON)
    call_status = Column(String(20), nullable=False, default="pending", index=True)
    error_message = Column(Text)
    duration_ms = Column(Integer)
    created_at = Column(DateTime(timezone=True), default=func.now(), index=True)
    completed_at = Column(DateTime(timezone=True))
    
    # 关系
    tool = relationship("MCPTool", back_populates="tool_calls")

class MCPGatewayConfig(Base):
    """MCP网关配置表"""
    __tablename__ = "mcp_gateway_config"
    
    id = Column(PG_UUID(as_uuid=True), primary_key=True, default=uuid4)
    config_name = Column(String(100), unique=True, nullable=False, index=True)
    config_type = Column(String(50), nullable=False, index=True)
    config_value = Column(JSON, nullable=False)
    is_active = Column(Boolean, default=True, index=True)
    description = Column(Text)
    created_at = Column(DateTime(timezone=True), default=func.now())
    updated_at = Column(DateTime(timezone=True), default=func.now(), onupdate=func.now())
