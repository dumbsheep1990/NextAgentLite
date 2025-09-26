"""
工作流模板（DAG）管理API：CRUD + 校验
"""
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from service.team_execution_template_service import get_team_template_service


router = APIRouter(prefix="/workflows/templates", tags=["工作流模板"])


class TemplateBody(BaseModel):
    template_name: str
    description: Optional[str] = None
    team_config: Dict[str, Any] = Field(default_factory=dict)
    execution_flow: Dict[str, Any] = Field(default_factory=dict)
    is_default: bool = False


@router.get("/")
async def list_templates():
    svc = await get_team_template_service()
    rows = await svc.list()
    return rows


@router.get("/{name}")
async def get_template(name: str):
    svc = await get_team_template_service()
    tpl = await svc.get_by_name(name)
    if not tpl:
        raise HTTPException(status_code=404, detail="not found")
    return tpl


@router.post("/")
async def create_template(body: TemplateBody):
    svc = await get_team_template_service()
    val = svc.validate(body.team_config, body.execution_flow)
    if not val.get("ok"):
        raise HTTPException(status_code=400, detail={"message": "invalid DAG", "issues": val.get("issues")})
    data = await svc.upsert(body.template_name, body.model_dump())
    # 可选设默认
    if body.is_default:
        await svc.set_default(body.template_name)
        data["is_default"] = True
    return data


@router.put("/{name}")
async def update_template(name: str, body: TemplateBody):
    if name != body.template_name:
        raise HTTPException(status_code=400, detail="name mismatch")
    svc = await get_team_template_service()
    val = svc.validate(body.team_config, body.execution_flow)
    if not val.get("ok"):
        raise HTTPException(status_code=400, detail={"message": "invalid DAG", "issues": val.get("issues")})
    data = await svc.upsert(name, body.model_dump())
    # 设默认
    if body.is_default:
        await svc.set_default(name)
        data["is_default"] = True
    return data


@router.delete("/{name}")
async def delete_template(name: str):
    svc = await get_team_template_service()
    ok = await svc.delete(name)
    if not ok:
        raise HTTPException(status_code=404, detail="not found")
    return {"ok": True}


class ValidateBody(BaseModel):
    team_config: Dict[str, Any] = Field(default_factory=dict)
    execution_flow: Dict[str, Any] = Field(default_factory=dict)


@router.post("/validate")
async def validate_template(body: ValidateBody):
    svc = await get_team_template_service()
    return svc.validate(body.team_config, body.execution_flow)

