from datetime import datetime
from typing import Optional, Dict, Any
from uuid import uuid4

from sqlalchemy import Column, String, Text, DateTime, JSON
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.sql import func

from db.database import Base


class WorkflowSession(Base):
    """工作流会话持久化

    记录一次工作流运行的输入、上下文、输出与状态，便于恢复/取消/审计。
    """

    __tablename__ = "workflow_sessions"

    id = Column(PG_UUID(as_uuid=True), primary_key=True, default=uuid4)
    agent_name = Column(String(200), nullable=False, index=True)
    status = Column(String(32), nullable=False, default="running", index=True)  # running/completed/error/canceled

    # 快照（JSON）
    inputs = Column(JSON, nullable=False, default={})
    vars = Column(JSON, nullable=False, default={})
    outputs = Column(JSON, nullable=False, default={})
    step_index = Column(String(32), default="0")
    step_name = Column(String(200), default="")

    # 取消标记（轮询式取消）
    cancel_flag = Column(String(8), default="0")  # "1" 表示请求取消

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

