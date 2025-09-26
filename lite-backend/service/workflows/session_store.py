import asyncio
from typing import Any, Dict, List, Optional
from uuid import UUID, uuid4

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from db.database import get_db
from models.workflow import WorkflowSession


async def create_session(agent_name: str, inputs: Dict[str, Any]) -> UUID:
    async for db in get_db():
        sess = WorkflowSession(agent_name=agent_name, inputs=inputs or {}, status="running")
        db.add(sess)
        await db.commit()
        await db.refresh(sess)
        return sess.id  # type: ignore


async def get_session(sess_id: UUID) -> Optional[WorkflowSession]:
    async for db in get_db():
        res = await db.execute(select(WorkflowSession).where(WorkflowSession.id == sess_id))
        return res.scalar_one_or_none()


async def list_sessions(limit: int = 50) -> List[WorkflowSession]:
    async for db in get_db():
        res = await db.execute(
            select(WorkflowSession).order_by(WorkflowSession.created_at.desc()).limit(limit)
        )
        return list(res.scalars().all())


async def update_checkpoint(sess_id: UUID, *,
                            inputs: Optional[Dict[str, Any]] = None,
                            vars: Optional[Dict[str, Any]] = None,
                            outputs: Optional[Dict[str, Any]] = None,
                            step_index: Optional[int] = None,
                            step_name: Optional[str] = None,
                            status: Optional[str] = None) -> None:
    async for db in get_db():
        stmt = (
            update(WorkflowSession)
            .where(WorkflowSession.id == sess_id)
            .values({
                **({"inputs": inputs} if inputs is not None else {}),
                **({"vars": vars} if vars is not None else {}),
                **({"outputs": outputs} if outputs is not None else {}),
                **({"step_index": str(step_index)} if step_index is not None else {}),
                **({"step_name": step_name} if step_name is not None else {}),
                **({"status": status} if status is not None else {}),
            })
        )
        await db.execute(stmt)
        await db.commit()


async def request_cancel(sess_id: UUID) -> None:
    async for db in get_db():
        stmt = (
            update(WorkflowSession)
            .where(WorkflowSession.id == sess_id)
            .values({"cancel_flag": "1", "status": "canceled"})
        )
        await db.execute(stmt)
        await db.commit()


async def is_canceled(sess_id: UUID) -> bool:
    async for db in get_db():
        res = await db.execute(select(WorkflowSession.cancel_flag).where(WorkflowSession.id == sess_id))
        val = res.scalar_one_or_none()
        return (val == "1")

