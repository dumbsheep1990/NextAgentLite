"""
智能体模板API端点
提供智能体模板的查询、管理和配置接口
"""
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field

from service.agent_template_service import agent_template_service
from core.logger import logger
from db.database import get_db_session
from sqlalchemy import text
import httpx, asyncio, os


# Pydantic模型
class AgentTemplateBase(BaseModel):
    """智能体模板基础模型"""
    template_code: str = Field(..., description="模板代码，唯一标识")
    template_name: str = Field(..., description="模板名称")
    template_type: str = Field(..., description="模板类型: single/team")
    category: Optional[str] = Field(None, description="分类")
    description: Optional[str] = Field(None, description="描述")
    icon: str = Field(default="RobotOutlined", description="图标")
    color: str = Field(default="#1890ff", description="颜色")


class AgentTemplateCreate(AgentTemplateBase):
    """创建智能体模板模型"""
    base_config_data: Dict[str, Any] = Field(default_factory=dict, description="基础配置", alias="base_config")
    model_config_data: Dict[str, Any] = Field(default_factory=dict, description="模型配置", alias="model_config")
    tools_config: List[str] = Field(default_factory=list, description="工具配置")
    team_members: Optional[List[Dict[str, Any]]] = Field(None, description="团队成员配置")
    team_mode: Optional[str] = Field(None, description="团队模式")


class AgentTemplateUpdate(BaseModel):
    """更新智能体模板模型"""
    template_name: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    icon: Optional[str] = None
    color: Optional[str] = None
    base_config_data: Optional[Dict[str, Any]] = Field(None, alias="base_config")
    model_config_data: Optional[Dict[str, Any]] = Field(None, alias="model_config")
    tools_config: Optional[List[str]] = None
    team_members: Optional[List[Dict[str, Any]]] = None
    team_mode: Optional[str] = None
    is_active: Optional[bool] = None


class AgentTemplateResponse(BaseModel):
    """智能体模板响应模型"""
    id: str
    template_code: str
    template_name: str
    template_type: str
    category: Optional[str]
    description: Optional[str]
    icon: str
    color: str
    is_system: bool
    is_active: bool
    team_members: Optional[List[Dict[str, Any]]] = None
    team_mode: Optional[str] = None


# 创建路由
router = APIRouter(prefix="/agent-templates", tags=["智能体模板"])


@router.get("/list", response_model=List[AgentTemplateResponse])
async def list_agent_templates(
    template_type: Optional[str] = Query(None, description="模板类型: single/team"),
    category: Optional[str] = Query(None, description="分类"),
    is_active: bool = Query(True, description="是否只获取激活的模板")
):
    """
    获取智能体模板列表
    
    Args:
        template_type: 模板类型过滤
        category: 分类过滤
        is_active: 是否只获取激活的模板
    
    Returns:
        智能体模板列表
    """
    try:
        templates = await agent_template_service.get_all_templates(
            template_type=template_type,
            category=category,
            is_active=is_active
        )
        
        # 简化响应
        result = []
        for template in templates:
            result.append(AgentTemplateResponse(
                id=template['id'],
                template_code=template['template_code'],
                template_name=template['template_name'],
                template_type=template['template_type'],
                category=template.get('category'),
                description=template.get('description'),
                icon=template.get('icon', 'RobotOutlined'),
                color=template.get('color', '#1890ff'),
                is_system=template.get('is_system', False),
                is_active=template.get('is_active', True),
                team_members=template.get('team_members') if template['template_type'] == 'team' else None,
                team_mode=template.get('team_mode') if template['template_type'] == 'team' else None
            ))
        
        return result
        
    except Exception as e:
        logger.error(f"获取智能体模板列表失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/available")
async def get_available_agents():
    """
    获取可用的智能体列表（按类型分组）
    适用于前端选择器展示
    
    Returns:
        按类型分组的智能体列表
    """
    try:
        result = await agent_template_service.get_available_agents()
        return {
            "status": "success",
            "data": result
        }
    except Exception as e:
        logger.error(f"获取可用智能体失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/detail/{template_code}")
async def get_template_detail(template_code: str):
    """
    获取智能体模板详情
    
    Args:
        template_code: 模板代码
    
    Returns:
        模板详细信息
    """
    try:
        template = await agent_template_service.get_template_by_code(template_code)
        if not template:
            raise HTTPException(status_code=404, detail="模板不存在")
        
        return {
            "status": "success",
            "data": template
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"获取模板详情失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/config/{template_code}")
async def get_agent_config(template_code: str):
    """
    获取智能体配置（用于实例化）
    
    Args:
        template_code: 模板代码
    
    Returns:
        智能体完整配置
    """
    try:
        config = await agent_template_service.get_agent_config(template_code)
        if not config:
            raise HTTPException(status_code=404, detail="模板不存在")
        
        return {
            "status": "success",
            "data": config
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"获取智能体配置失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/create")
async def create_template(template_data: AgentTemplateCreate):
    """
    创建新的智能体模板
    
    Args:
        template_data: 模板数据
    
    Returns:
        创建的模板信息
    """
    try:
        # Convert model to dict with alias handling
        data = template_data.model_dump(by_alias=True)
        template = await agent_template_service.create_template(data)
        
        return {
            "status": "success",
            "message": "模板创建成功",
            "data": template
        }
    except Exception as e:
        logger.error(f"创建模板失败: {e}")
        if "duplicate key" in str(e):
            raise HTTPException(status_code=400, detail="模板代码已存在")
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/update/{template_id}")
async def update_template(template_id: str, update_data: AgentTemplateUpdate):
    """
    更新智能体模板
    
    Args:
        template_id: 模板ID
        update_data: 更新数据
    
    Returns:
        更新后的模板信息
    """
    try:
        # Convert model to dict with alias handling
        data = update_data.model_dump(exclude_unset=True, by_alias=True)
        template = await agent_template_service.update_template(
            template_id, 
            data
        )
        
        if not template:
            raise HTTPException(status_code=404, detail="模板不存在")
        
        return {
            "status": "success",
            "message": "模板更新成功",
            "data": template
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"更新模板失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/delete/{template_id}")
async def delete_template(template_id: str):
    """
    删除智能体模板（仅非系统模板）
    
    Args:
        template_id: 模板ID
    
    Returns:
        删除结果
    """
    try:
        success = await agent_template_service.delete_template(template_id)
        
        if not success:
            raise HTTPException(status_code=400, detail="无法删除系统模板或模板不存在")
        
        return {
            "status": "success",
            "message": "模板删除成功"
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"删除模板失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/categories")
async def get_categories():
    """
    获取所有分类
    
    Returns:
        分类列表
    """
    try:
        # 这里可以从数据库获取，目前返回预定义的分类
        categories = [
            {"code": "通用", "name": "通用", "icon": "🔧"},
            {"code": "分析", "name": "分析", "icon": "📊"},
            {"code": "检索", "name": "检索", "icon": "🔍"},
            {"code": "生成", "name": "生成", "icon": "✍️"},
            {"code": "工具", "name": "工具", "icon": "🛠️"},
            {"code": "专业", "name": "专业", "icon": "🎯"},
            {"code": "团队", "name": "团队", "icon": "👥"}
        ]
        
        return {
            "status": "success",
            "data": categories
        }
    except Exception as e:
        logger.error(f"获取分类失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============ 资源需求与校验 ============

async def _check_graph_service(host: str = "localhost", port: int = 9622, path: str = "/health") -> bool:
    url = f"http://{host}:{port}{path}"
    try:
        async with httpx.AsyncClient(timeout=1.0) as client:
            r = await client.get(url)
            return r.status_code < 500
    except Exception:
        # 尝试 TCP 探测
        try:
            reader, writer = await asyncio.wait_for(asyncio.open_connection(host, port), timeout=1.0)
            writer.close()
            try:
                await writer.wait_closed()
            except Exception:
                pass
            return True
        except Exception:
            return False


async def _check_mcp_server(server: str, base: str = None) -> Dict[str, any]:
    base = base or "http://localhost:9050"
    try:
        async with httpx.AsyncClient(timeout=2.0) as client:
            r = await client.get(f"{base.rstrip('/')}/mcp/registry")
            r.raise_for_status()
            reg = r.json() if isinstance(r.json(), list) else []
            for item in reg:
                if item.get("name") == server:
                    return {"present": True, "status": item.get("status")}
            return {"present": False}
    except Exception:
        return {"present": False}


def _derive_requirements_from_template(tpl: Dict[str, any]) -> list[dict]:
    reqs = []
    base_cfg = tpl.get('base_config') or {}
    if isinstance(base_cfg, dict) and isinstance(base_cfg.get('requirements'), list):
        # 模板中显式声明
        return base_cfg.get('requirements')
    # 启发式推断
    name = (tpl.get('template_name') or '').lower()
    tokens = [name]
    if tpl.get('team_members'):
        tokens += [str(m.get('member_id','')).lower() for m in (tpl.get('team_members') or [])]
    if any(('knowledge' in t or 'retrieval' in t) for t in tokens):
        reqs.append({"type": "knowledge_collection", "required": True})
    if any('graph' in t for t in tokens):
        reqs.append({"type": "graph_service", "required": True, "host": "localhost", "port": 9622})
    return reqs


@router.get("/{template_code}/requirements")
async def get_template_requirements(template_code: str):
    """分析模板所需资源，并附带可用性检测结果。"""
    try:
        tpl = await agent_template_service.get_template_by_code(template_code)
        if not tpl:
            raise HTTPException(status_code=404, detail="模板不存在")
        reqs = _derive_requirements_from_template(tpl)

        enriched = []
        # 预查询可用知识库数量
        collections_count = 0
        async with get_db_session() as db:
            row = await db.execute(text("SELECT COUNT(1) AS c FROM knowledge_collections WHERE is_active = true"))
            r = row.mappings().first()
            collections_count = int(r['c']) if r else 0

        # 检索 9050 基址
        gw_base = os.getenv('LLM_GATEWAY_URL', 'http://localhost:9050')

        for r in reqs:
            rr = dict(r)
            if r.get('type') == 'knowledge_collection':
                rr['available_collections'] = collections_count
            elif r.get('type') == 'graph_service':
                host = r.get('host') or 'localhost'
                port = int(r.get('port') or 9622)
                healthy = await _check_graph_service(host, port)
                rr['healthy'] = healthy
            elif r.get('type') == 'mcp_server' and r.get('name'):
                rr.update(await _check_mcp_server(r.get('name'), gw_base))
            elif r.get('type') == 'embedding_model':
                # 检查网关启用的嵌入模型是否存在所需provider/model
                try:
                    async with httpx.AsyncClient(timeout=3.0) as client:
                        res = await client.get(f"{gw_base.rstrip('/')}/v1/models/enabled")
                        models = res.json() if res.status_code < 500 else {}
                        rr['available'] = False
                        req_provider = (r.get('provider') or '').lower()
                        req_model = (r.get('model') or '').lower()
                        # 期望返回 { provider: [ {id,type}, ...] }
                        for prov, lst in (models or {}).items():
                            if req_provider and prov.lower() != req_provider:
                                continue
                            for m in lst or []:
                                mid = str(m.get('id') or m.get('model_id') or '').lower()
                                mtype = str(m.get('type') or '').lower()
                                if 'embed' in mtype or 'embedding' in mtype:
                                    if req_model:
                                        if req_model == mid:
                                            rr['available'] = True
                                            break
                                    else:
                                        rr['available'] = True
                            if rr['available']:
                                break
                except Exception:
                    rr['available'] = False
            elif r.get('type') == 'api_config' and r.get('name'):
                # 检查 9050 是否存在该 API 配置
                try:
                    async with httpx.AsyncClient(timeout=3.0) as client:
                        res = await client.get(f"{gw_base.rstrip('/')}/api-tools/configs")
                        cfgs = res.json() if res.status_code < 500 else []
                        present = False
                        for c in (cfgs or []):
                            if (c.get('name') or '').lower() == str(r.get('name')).lower():
                                present = True
                                break
                        rr['present'] = present
                except Exception:
                    rr['present'] = False
            enriched.append(rr)
        return {"requirements": enriched}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"获取模板资源需求失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))


class ValidateResourcesBody(BaseModel):
    template_code: str
    selections: Dict[str, Any] = Field(default_factory=dict)


@router.post("/validate-resources")
async def validate_template_resources(body: ValidateResourcesBody):
    """根据模板与用户选择的资源进行校验，返回缺失项。"""
    tpl = await agent_template_service.get_template_by_code(body.template_code)
    if not tpl:
        raise HTTPException(status_code=404, detail="模板不存在")
    reqs = _derive_requirements_from_template(tpl)
    missing: List[str] = []
    # 基础校验
    for r in reqs:
        if not r.get('required'):
            continue
        rtype = r.get('type')
        if rtype == 'knowledge_collection':
            if not body.selections.get('collection_id'):
                missing.append('knowledge_collection')
        elif rtype == 'graph_service':
            healthy = await _check_graph_service(r.get('host') or 'localhost', int(r.get('port') or 9622))
            if not healthy:
                missing.append('graph_service')
        elif rtype == 'mcp_server':
            name = r.get('name')
            gw_base = os.getenv('LLM_GATEWAY_URL', 'http://localhost:9050')
            info = await _check_mcp_server(name, gw_base)
            if not info.get('present'):
                missing.append(f"mcp_server:{name}")
        elif rtype == 'embedding_model':
            # 校验所选模型（若有）是否满足要求
            req_provider = (r.get('provider') or '').lower()
            req_model = (r.get('model') or '').lower()
            # 优先使用专用的 embedding_model_id，其次回退到 model_id
            sel_model = str(body.selections.get('embedding_model_id') or body.selections.get('model_id') or '').lower()
            # 若模板声明具体模型，则要求 sel_model 等于该模型；否则只要当前网关有任一 embedding 可用即可
            gw_base = os.getenv('LLM_GATEWAY_URL', 'http://localhost:9050')
            ok = False
            try:
                async with httpx.AsyncClient(timeout=3.0) as client:
                    res = await client.get(f"{gw_base.rstrip('/')}/v1/models/enabled")
                    models = res.json() if res.status_code < 500 else {}
                    # 若用户已选模型，则优先校验该模型是否为 embedding 且匹配provider/名称
                    if sel_model:
                        for prov, lst in (models or {}).items():
                            if req_provider and prov.lower() != req_provider:
                                continue
                            for m in lst or []:
                                mid = str(m.get('id') or m.get('model_id') or '').lower()
                                mtype = str(m.get('type') or '').lower()
                                if mid == sel_model and ('embed' in mtype or 'embedding' in mtype):
                                    ok = True
                                    break
                            if ok:
                                break
                    else:
                        # 未选择则检查网关中是否存在任意嵌入模型（或符合 provider 的嵌入模型）
                        for prov, lst in (models or {}).items():
                            if req_provider and prov.lower() != req_provider:
                                continue
                            for m in lst or []:
                                mtype = str(m.get('type') or '').lower()
                                if 'embed' in mtype or 'embedding' in mtype:
                                    ok = True
                                    break
                            if ok:
                                break
            except Exception:
                ok = False
            # 若模板声明具体模型，且用户选择模型与声明不一致，也视为不满足
            if req_model and sel_model and sel_model != req_model:
                ok = False
            if not ok:
                missing.append('embedding_model')
        elif rtype == 'api_config':
            # 校验 9050 是否存在该 API 配置
            gw_base = os.getenv('LLM_GATEWAY_URL', 'http://localhost:9050')
            name = (r.get('name') or '').lower()
            present = False
            try:
                async with httpx.AsyncClient(timeout=3.0) as client:
                    res = await client.get(f"{gw_base.rstrip('/')}/api-tools/configs")
                    cfgs = res.json() if res.status_code < 500 else []
                    for c in (cfgs or []):
                        if (c.get('name') or '').lower() == name:
                            present = True
                            break
            except Exception:
                present = False
            if not present:
                missing.append(f"api_config:{name}")

    return {"ok": len(missing) == 0, "missing": missing, "requirements": reqs}


# ============ 网关资源枚举（供前端自动补全） ============

@router.get("/external/api-configs")
async def list_gateway_api_configs():
    gw_base = os.getenv('LLM_GATEWAY_URL', 'http://localhost:9050')
    try:
        async with httpx.AsyncClient(timeout=3.0) as client:
            res = await client.get(f"{gw_base.rstrip('/')}/api-tools/configs")
            if res.status_code >= 500:
                return []
            return res.json()
    except Exception:
        return []


@router.get("/external/embedding-models")
async def list_gateway_embedding_models():
    gw_base = os.getenv('LLM_GATEWAY_URL', 'http://localhost:9050')
    try:
        async with httpx.AsyncClient(timeout=3.0) as client:
            res = await client.get(f"{gw_base.rstrip('/')}/v1/models/enabled")
            data = res.json() if res.status_code < 500 else {}
            # 只返回 embedding 类型，按 provider 分组
            out = {}
            for prov, lst in (data or {}).items():
                emb = []
                for m in lst or []:
                    mtype = str(m.get('type') or '').lower()
                    mid = m.get('id') or m.get('model_id')
                    if 'embed' in mtype or 'embedding' in mtype:
                        emb.append({ 'id': mid, 'type': mtype })
                if emb:
                    out[prov] = emb
            return out
    except Exception:
        return {}
