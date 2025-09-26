"""
工作流执行历史 API（team_executions / team_execution_steps）
"""
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, HTTPException, Query
from sqlalchemy import text
from db.database import get_db_session


router = APIRouter(prefix="/workflows/executions", tags=["工作流执行历史"])


@router.get("")
async def list_executions(
    team_name: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=200),
):
    """列出执行历史（按模板名=team_name 和状态筛选）"""
    sql = """
        SELECT execution_id, session_id, team_name, query, status, start_time, end_time, duration_ms
        FROM team_executions
        WHERE 1=1
    """
    params: Dict[str, Any] = {}
    if team_name:
        sql += " AND team_name = :team"
        params["team"] = team_name
    if status:
        sql += " AND status = :st"
        params["st"] = status
    sql += " ORDER BY start_time DESC LIMIT :lim"
    params["lim"] = limit

    async with get_db_session() as db:
        rows = await db.execute(text(sql), params)
        return [dict(r) for r in rows.mappings().all()]


@router.get("/{execution_id}")
async def get_execution(execution_id: str):
    async with get_db_session() as db:
        row = await db.execute(text("""
            SELECT execution_id, session_id, team_name, query, status, start_time, end_time, duration_ms, result_content, error_message, metadata
            FROM team_executions
            WHERE execution_id = :eid
        """), {"eid": execution_id})
        r = row.mappings().first()
        if not r:
            raise HTTPException(status_code=404, detail="not found")
        return dict(r)


@router.get("/{execution_id}/steps")
async def get_execution_steps(execution_id: str):
    async with get_db_session() as db:
        rows = await db.execute(text("""
            SELECT id, execution_id, step_id, member_id, member_name, action, status,
                   start_time, end_time, duration_ms, input_data, output_data, error_message
            FROM team_execution_steps
            WHERE execution_id = :eid
            ORDER BY start_time ASC, id ASC
        """), {"eid": execution_id})
        return [dict(r) for r in rows.mappings().all()]
