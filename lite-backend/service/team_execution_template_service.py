from typing import Optional, Dict, Any, List, Tuple
from uuid import UUID, uuid4
from sqlalchemy import text
from db.database import get_db_session


class TeamExecutionTemplateService:
    async def list(self) -> List[Dict[str, Any]]:
        async with get_db_session() as db:
            res = await db.execute(text("""
                SELECT id, template_name, description, team_config, execution_flow, is_default,
                       created_at, updated_at
                FROM team_execution_templates
                ORDER BY is_default DESC, template_name ASC
            """))
            return [dict(r) for r in res.mappings().all()]

    async def get_by_name(self, name: str) -> Optional[Dict[str, Any]]:
        async with get_db_session() as db:
            row = await db.execute(text("""
                SELECT id, template_name, description, team_config, execution_flow, is_default,
                       created_at, updated_at
                FROM team_execution_templates
                WHERE template_name = :name
            """), {"name": name})
            r = row.mappings().first()
            return dict(r) if r else None

    async def create(self, data: Dict[str, Any]) -> Dict[str, Any]:
        async with get_db_session() as db:
            row = await db.execute(text("""
                INSERT INTO team_execution_templates (id, template_name, description, team_config, execution_flow, is_default)
                VALUES (:id, :name, :desc, :team::jsonb, :flow::jsonb, :def)
                RETURNING id, template_name, description, team_config, execution_flow, is_default, created_at, updated_at
            """), {
                "id": data.get("id") or str(UUID(int=0)) if False else str(UUID(bytes=b'\x00'*16)),  # will be overridden by DB default next time
                "name": data["template_name"],
                "desc": data.get("description"),
                "team": data.get("team_config", {}),
                "flow": data.get("execution_flow", {}),
                "def": bool(data.get("is_default", False))
            })
            r = row.mappings().first()
            return dict(r)

    async def upsert(self, name: str, data: Dict[str, Any]) -> Dict[str, Any]:
        async for db in get_db_session():
            row = await db.execute(text("""
                INSERT INTO team_execution_templates (id, template_name, description, team_config, execution_flow, is_default)
                VALUES (:id, :name, :desc, :team::jsonb, :flow::jsonb, :def)
                ON CONFLICT (template_name) DO UPDATE SET
                  description=EXCLUDED.description,
                  team_config=EXCLUDED.team_config,
                  execution_flow=EXCLUDED.execution_flow,
                  is_default=EXCLUDED.is_default,
                  updated_at=now()
                RETURNING id, template_name, description, team_config, execution_flow, is_default, created_at, updated_at
            """), {
                "id": str(uuid4()) if not data.get("id") else str(data.get("id")),
                "name": name,
                "desc": data.get("description"),
                "team": data.get("team_config", {}),
                "flow": data.get("execution_flow", {}),
                "def": bool(data.get("is_default", False))
            })
            r = row.mappings().first()
            return dict(r)

    async def delete(self, name: str) -> bool:
        async with get_db_session() as db:
            res = await db.execute(text("""
            DELETE FROM team_execution_templates WHERE template_name = :name
        """), {"name": name})
            await db.commit()
            return res.rowcount > 0

    async def set_default(self, name: str) -> bool:
        async with get_db_session() as db:
            await db.execute(text("UPDATE team_execution_templates SET is_default=false WHERE is_default=true"))
            res = await db.execute(text("UPDATE team_execution_templates SET is_default=true WHERE template_name=:n"), {"n": name})
            await db.commit()
            return res.rowcount > 0

    def validate(self, team_config: Dict[str, Any], execution_flow: Dict[str, Any]) -> Dict[str, Any]:
        """基本校验：
        - steps 必须存在且 name 唯一
        - dependencies 引用的节点必须存在
        - 无环（Kahn）
        - 可选校验字段：retry、timeout_ms 为非负
        """
        issues: List[str] = []
        steps = execution_flow.get("steps") or []
        deps = execution_flow.get("dependencies") or {}
        if not isinstance(steps, list) or not steps:
            issues.append("steps 为空或不是数组")
            return {"ok": False, "issues": issues}
        names: List[str] = []
        for i, s in enumerate(steps):
            sid = s.get("name") or s.get("agent") or s.get("tool") or f"step_{i}"
            if sid in names:
                issues.append(f"重复的步骤名: {sid}")
            names.append(sid)
            if s.get("retry", 0) < 0:
                issues.append(f"{sid}.retry 不能为负数")
            if s.get("timeout_ms", 0) < 0:
                issues.append(f"{sid}.timeout_ms 不能为负数")
        name_set = set(names)
        # 依赖存在性
        for k, arr in (deps or {}).items():
            if k not in name_set:
                issues.append(f"依赖图中包含未知节点: {k}")
            for d in (arr or []):
                if d not in name_set:
                    issues.append(f"{k} 依赖未知节点: {d}")
        # 环检测（Kahn）
        indeg = {n: 0 for n in name_set}
        for k, arr in (deps or {}).items():
            for d in (arr or []):
                indeg[k] = indeg.get(k, 0) + 1
        queue = [n for n, v in indeg.items() if v == 0]
        visited = 0
        adj = {}
        for k, arr in (deps or {}).items():
            for d in arr or []:
                adj.setdefault(d, []).append(k)
        while queue:
            u = queue.pop(0)
            visited += 1
            for v in adj.get(u, []):
                indeg[v] -= 1
                if indeg[v] == 0:
                    queue.append(v)
        if visited != len(name_set):
            issues.append("DAG 存在环或未解析完的依赖")
        return {"ok": len(issues) == 0, "issues": issues}


_svc: Optional[TeamExecutionTemplateService] = None


async def get_team_template_service() -> TeamExecutionTemplateService:
    global _svc
    if _svc is None:
        _svc = TeamExecutionTemplateService()
    return _svc
