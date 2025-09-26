"""
用户智能体管理API - 独立的智能体创建和管理接口
不影响现有系统功能，专门用于新的智能体导航流程
"""
from fastapi import APIRouter, HTTPException, Depends, Response
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
import asyncio
from datetime import datetime

from core.logger import logger
from core.auth import get_current_user_id
from service.agent_template_service import agent_template_service
# 直接使用数据库查询，避免服务依赖问题
import os
import json as _json
import httpx
import asyncpg
from fastapi.responses import StreamingResponse
from datetime import datetime
import random
import string


router = APIRouter(tags=["用户智能体管理"])


# 内部工具：确保发布相关表存在（幂等）
async def _ensure_publish_tables(conn: "asyncpg.Connection") -> None:
    try:
        # user_agent_releases（若不存在则创建）
        await conn.execute(
            """
            CREATE TABLE IF NOT EXISTS user_agent_releases (
                id SERIAL PRIMARY KEY,
                agent_id VARCHAR(100) NOT NULL,
                user_id INTEGER,
                version INTEGER NOT NULL,
                snapshot JSONB,
                notes TEXT,
                published_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
            CREATE INDEX IF NOT EXISTS idx_uar_agent ON user_agent_releases(agent_id);
            CREATE INDEX IF NOT EXISTS idx_uar_user ON user_agent_releases(user_id);
            CREATE INDEX IF NOT EXISTS idx_uar_published_at ON user_agent_releases(published_at DESC);
            """
        )
        # user_agent_publish_status（若不存在则创建）
        await conn.execute(
            """
            CREATE TABLE IF NOT EXISTS user_agent_publish_status (
                agent_id VARCHAR(100) PRIMARY KEY,
                enabled BOOLEAN NOT NULL DEFAULT TRUE,
                deleted BOOLEAN NOT NULL DEFAULT FALSE,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
            """
        )
    except Exception as _e:
        # 不抛出，交由上层查询失败再报错；但记录日志便于排查
        try:
            logger.warning(f"发布表检查/创建失败: {_e}")
        except Exception:
            pass


# 请求/响应模型
class AgentTemplateResponse(BaseModel):
    id: str
    template_code: str
    template_name: str
    template_type: str
    category: Optional[str]
    description: Optional[str]
    icon: str
    color: str
    base_config: Dict[str, Any]
    agent_model_config: Optional[Dict[str, Any]] = Field(alias="model_config")
    tools_config: Optional[Dict[str, Any]]
    team_members: Optional[List[Any]]  # 改为Any类型以支持对象数组
    team_mode: Optional[str]
    is_system: bool


class AgentToolResponse(BaseModel):
    id: str
    tool_code: str
    tool_name: str
    tool_type: str
    description: Optional[str] = None
    config_schema: Optional[Dict[str, Any]] = None


class KnowledgeCollectionResponse(BaseModel):
    id: str
    name: str
    description: Optional[str]
    document_count: int
    status: str


class CreateUserAgentRequest(BaseModel):
    template_id: str
    agent_name: str
    description: Optional[str] = None
    collection_id: Optional[str] = None
    enable_knowledge_search: bool = True
    enable_graph_search: bool = False
    retrieval_mode: str = Field(default="all", pattern="^(all|qa_only|papers_only)$")
    selected_tools: List[str] = []
    tool_configs: Dict[str, Any] = {}
    agent_model_config: Optional[Dict[str, Any]] = Field(default=None, alias="model_config")
    custom_config: Optional[Dict[str, Any]] = None
    icon: Optional[str] = None
    color: Optional[str] = None


class UserAgentResponse(BaseModel):
    id: str
    agent_code: str
    agent_name: str
    agent_type: str
    description: Optional[str]
    template_name: Optional[str]
    collection_name: Optional[str]
    icon: Optional[str]
    color: Optional[str]
    status: str
    usage_count: int
    last_used_at: Optional[datetime]
    created_at: datetime

class PublishedAgentResponse(BaseModel):
    agent_id: str
    agent_name: str
    version: int
    published_at: datetime
    description: Optional[str] = None
    icon: Optional[str] = None
    color: Optional[str] = None
    service_name: Optional[str] = None
    publish_mode: Optional[str] = None
    enabled: Optional[bool] = True
    deleted: Optional[bool] = False


class AgentBasicResponse(BaseModel):
    agent_id: str
    agent_name: str
    description: Optional[str] = None
    icon: Optional[str] = None
    color: Optional[str] = None
    service_name: Optional[str] = None
    publish_mode: Optional[str] = None  # 'api' | 'embed'


class RuntimeSettingsResponse(BaseModel):
    default_model: Optional[str] = None
    chat: Optional[Dict[str, Any]] = None  # { multi_turn: bool, max_rounds: int, context_window: int }

class UpdateRuntimeSettingsRequest(BaseModel):
    default_model: Optional[str] = None
    chat: Optional[Dict[str, Any]] = None


@router.get("/templates", response_model=List[AgentTemplateResponse])
async def get_agent_templates():
    """获取所有可用的智能体模板"""
    try:
        templates = await agent_template_service.get_all_templates(is_active=True)
        # 兼容历史数据：tools_config 可能为数组，响应模型要求为字典
        fixed = []
        for t in templates:
            tc = t.get('tools_config')
            if isinstance(tc, list):
                t['tools_config'] = { 'selected': tc }
            elif tc is None:
                t['tools_config'] = {}
            fixed.append(AgentTemplateResponse(**t))
        return fixed
    except Exception as e:
        logger.error(f"获取智能体模板失败: {e}")
        raise HTTPException(status_code=500, detail=f"获取智能体模板失败: {str(e)}")


@router.get("/templates/{template_id}", response_model=AgentTemplateResponse)
async def get_agent_template_detail(template_id: str):
    """获取特定智能体模板详情"""
    try:
        template = await agent_template_service.get_template_by_id(template_id)
        if not template:
            raise HTTPException(status_code=404, detail="模板不存在")
        tc = template.get('tools_config')
        if isinstance(tc, list):
            template['tools_config'] = { 'selected': tc }
        elif tc is None:
            template['tools_config'] = {}
        return AgentTemplateResponse(**template)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"获取智能体模板详情失败: {e}")
        raise HTTPException(status_code=500, detail=f"获取智能体模板详情失败: {str(e)}")


@router.get("/tools", response_model=List[AgentToolResponse])
async def get_available_tools():
    """获取所有可用的智能体工具"""
    try:
        # 直接查询数据库获取工具列表
        from core.config_optimized import optimized_config_manager
        import asyncpg
        
        db_config = optimized_config_manager.settings.database_postgresql
        conn = await asyncpg.connect(
            host=db_config.host,
            port=db_config.port,
            user=db_config.username,
            password=db_config.password,
            database=db_config.database
        )
        
        try:
            rows = await conn.fetch("""
                SELECT id, tool_code, tool_name, tool_type, description, config_schema
                FROM agent_tools 
                WHERE is_active = true
                ORDER BY tool_type, tool_name
            """)
            
            tools: List[AgentToolResponse] = []
            for row in rows:
                tool_data = dict(row)
                if tool_data.get('config_schema') and isinstance(tool_data['config_schema'], str):
                    import json
                    try:
                        tool_data['config_schema'] = json.loads(tool_data['config_schema'])
                    except:
                        tool_data['config_schema'] = {}
                tools.append(AgentToolResponse(**tool_data))

            # 合并 Agno 内置工具（本地 JSON 优先，失败则使用预置）
            # 去重策略：以 tool_code 为键，若已在 DB 列表中出现则跳过
            try:
                # 默认预置两类常用内置工具
                builtin_list: List[Dict[str, Any]] = [
                    {"tool_code": "builtin:reasoning", "tool_name": "推理(思考)", "tool_type": "builtin", "description": "显式思考与分解步骤"},
                    {"tool_code": "builtin:duckduckgo", "tool_name": "DuckDuckGo 搜索", "tool_type": "builtin", "description": "简单的网页搜索"},
                ]
                # 尝试读取本地 JSON（支持两种工作目录：仓库根/或 lite-backend）
                candidate_paths = [
                    os.path.join('docs', 'agno-tools', 'builtin-tools.json'),
                    os.path.join('..', 'docs', 'agno-tools', 'builtin-tools.json')
                ]
                for p in candidate_paths:
                    if os.path.exists(p):
                        with open(p, 'r', encoding='utf-8') as f:
                            data = _json.load(f) or []
                            if isinstance(data, list) and data:
                                builtin_list = data
                                break
                existing = {t.tool_code for t in tools if isinstance(t, AgentToolResponse)}
                for b in builtin_list:
                    code = b.get('tool_code') or ''
                    if not code or code in existing:
                        continue
                    try:
                        tools.append(AgentToolResponse(
                            id=code or b.get('id') or b.get('name') or 'builtin',
                            tool_code=code,
                            tool_name=b.get('tool_name') or b.get('name') or '内置工具',
                            tool_type=b.get('tool_type') or 'builtin',
                            description=b.get('description'),
                            config_schema=b.get('config_schema') or {}
                        ))
                    except Exception:
                        continue
            except Exception as e:
                logger.warning(f"加载内置工具失败: {e}")

            # 合并 MCP / API 工具组（来自 9050）
            gw_base = os.getenv('LLM_GATEWAY_URL', 'http://127.0.0.1:9050').rstrip('/')
            try:
                async with httpx.AsyncClient(timeout=10.0) as hc:
                    # MCP servers
                    try:
                        r = await hc.get(f"{gw_base}/mcp/registry")
                        if r.status_code == 200:
                            arr = r.json() or []
                            for it in arr:
                                name = (it.get('name') or '').strip()
                                if not name:
                                    continue
                                tools.append(AgentToolResponse(
                                    id=f"mcp:{name}",
                                    tool_code=f"mcp:{name}",
                                    tool_name=f"MCP:{name}",
                                    tool_type="mcp",
                                    description=(it.get('status') or 'MCP 服务器')
                                ))
                    except Exception as e:
                        logger.warning(f"获取 MCP 注册表失败: {e}")

                    # API tools configs（若为空，尝试触发一次同步再获取）
                    try:
                        async def fetch_api_configs():
                            r_ = await hc.get(f"{gw_base}/api-tools/configs")
                            if r_.status_code == 200:
                                return r_.json() or []
                            return []

                        arr2 = await fetch_api_configs()
                        if not arr2:
                            try:
                                prefix = os.getenv('UNLA_DB_TABLE_PREFIX', 'unla_')
                                _ = await hc.post(f"{gw_base}/admin/sync-api-from-unla-db", json={"prefix": prefix})
                                arr2 = await fetch_api_configs()
                            except Exception as e2:
                                logger.warning(f"触发 9050 API 同步失败: {e2}")
                        # 如果依然为空，直接从 Unla apiserver 读取 mcp 配置并投影为 API 组
                        if not arr2:
                            try:
                                unla_base = os.getenv('UNLA_APISERVER_BASE', 'http://127.0.0.1:5234').rstrip('/')
                                r3 = await hc.get(f"{unla_base}/api/mcp/configs", headers={"X-Internal-Request": "1"})
                                raw = r3.json() if r3.status_code == 200 else None
                                cfgs = []
                                if isinstance(raw, list):
                                    cfgs = raw
                                elif isinstance(raw, dict):
                                    if isinstance(raw.get('data'), list):
                                        cfgs = raw.get('data')
                                    elif isinstance(raw.get('configs'), list):
                                        cfgs = raw.get('configs')
                                # 将 name 作为 API 组，前提是存在 tools 列表
                                arr2 = []
                                for mm in (cfgs or []):
                                    name = str(mm.get('name') or '').strip()
                                    if not name:
                                        continue
                                    has_tools = False
                                    tv = mm.get('tools')
                                    if isinstance(tv, list) and len(tv) > 0:
                                        has_tools = True
                                    elif isinstance(tv, str) and tv.strip() != '':
                                        has_tools = True
                                    if has_tools:
                                        arr2.append({"name": name})
                            except Exception as e3:
                                logger.warning(f"从 Unla apiserver 读取 API 组失败: {e3}")
                        for it in arr2:
                            name = (it.get('name') or '').strip()
                            if not name:
                                continue
                            tools.append(AgentToolResponse(
                                id=f"api:{name}",
                                tool_code=f"api:{name}",
                                tool_name=f"API:{name}",
                                tool_type="api",
                                description=f"API 统一配置: {name}"
                            ))
                    except Exception as e:
                        logger.warning(f"获取 API 工具配置失败: {e}")
            except Exception as e:
                logger.warning(f"访问模型网关失败: {e}")
            # 业务过滤：禁用代码执行；web_search 由内置 duckduckgo 替代
            tools = [
                t for t in tools
                if (getattr(t, 'tool_code', '') not in ('code_interpreter', 'web_search'))
            ]

            # 最终去重与排序（按 tool_code 去重；分组顺序：builtin -> mcp -> api -> 其他）
            order = {"builtin": 0, "mcp": 1, "api": 2}
            by_code: Dict[str, AgentToolResponse] = {}
            for t in tools:
                code = getattr(t, 'tool_code', None) or ''
                if not code:
                    continue
                if code not in by_code:
                    by_code[code] = t
            deduped = list(by_code.values())
            deduped.sort(key=lambda x: (order.get(getattr(x, 'tool_type', ''), 3), getattr(x, 'tool_name', '')))
            return deduped
        finally:
            await conn.close()
            
    except Exception as e:
        logger.error(f"获取智能体工具失败: {e}")
        raise HTTPException(status_code=500, detail=f"获取智能体工具失败: {str(e)}")


@router.post("/tools/import-builtin")
async def import_builtin_tools(payload: Optional[List[Dict[str, Any]]] = None):
    """从本地 JSON 或请求体导入内置工具到 agent_tools 表（幂等）。
    - 请求体省略时，读取 docs/agno-tools/builtin-tools.json（支持两种工作目录）。
    - 已存在同 id/tool_code 时更新名称/描述/schema，并置 is_active = true。
    """
    try:
        # 准备列表
        builtin_list: List[Dict[str, Any]] = []
        if isinstance(payload, list) and payload:
            builtin_list = payload
        else:
            # 读取本地文件
            candidate_paths = [
                os.path.join('docs', 'agno-tools', 'builtin-tools.json'),
                os.path.join('..', 'docs', 'agno-tools', 'builtin-tools.json')
            ]
            for p in candidate_paths:
                if os.path.exists(p):
                    with open(p, 'r', encoding='utf-8') as f:
                        data = _json.load(f) or []
                        if isinstance(data, list) and data:
                            builtin_list = data
                            break
            if not builtin_list:
                # 兜底两项
                builtin_list = [
                    {"tool_code": "builtin:reasoning", "tool_name": "推理(思考)", "tool_type": "builtin", "description": "显式思考与分解步骤"},
                    {"tool_code": "builtin:duckduckgo", "tool_name": "DuckDuckGo 搜索", "tool_type": "builtin", "description": "简单的网页搜索"},
                ]

        # 入库
        from core.config_optimized import optimized_config_manager
        db = optimized_config_manager.settings.database_postgresql
        conn = await asyncpg.connect(host=db.host, port=db.port, user=db.username, password=db.password, database=db.database)
        try:
            count = 0
            for b in builtin_list:
                code = (b.get('tool_code') or '').strip()
                name = (b.get('tool_name') or b.get('name') or '内置工具').strip()
                if not code:
                    continue
                ttype = (b.get('tool_type') or 'builtin').strip()
                desc = b.get('description') or ''
                schema = b.get('config_schema') or {}
                await conn.execute(
                    """
                    INSERT INTO agent_tools (id, tool_code, tool_name, tool_type, description, config_schema, is_active, created_at)
                    VALUES ($1,$1,$2,$3,$4,$5::jsonb,true,NOW())
                    ON CONFLICT (id) DO UPDATE SET
                      tool_name=EXCLUDED.tool_name,
                      tool_type=EXCLUDED.tool_type,
                      description=EXCLUDED.description,
                      config_schema=EXCLUDED.config_schema,
                      is_active=true
                    """,
                    code, name, ttype, desc, _json.dumps(schema)
                )
                count += 1
        finally:
            await conn.close()
        return {"ok": True, "imported": count}
    except Exception as e:
        logger.error(f"导入内置工具失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/collections", response_model=List[KnowledgeCollectionResponse])
async def get_knowledge_collections():
    """获取所有可用的知识库集合"""
    try:
        # 直接查询数据库获取知识库集合
        from core.config_optimized import optimized_config_manager
        import asyncpg
        
        db_config = optimized_config_manager.settings.database_postgresql
        conn = await asyncpg.connect(
            host=db_config.host,
            port=db_config.port,
            user=db_config.username,
            password=db_config.password,
            database=db_config.database
        )
        
        try:
            rows = await conn.fetch("""
                SELECT 
                    kc.id, 
                    kc.name, 
                    kc.description,
                    kc.is_active,
                    COUNT(kd.id) as document_count
                FROM knowledge_collections kc
                LEFT JOIN knowledge_documents kd ON kc.id = kd.collection_id AND kd.status != 'deleted'
                WHERE kc.is_active = true
                GROUP BY kc.id, kc.name, kc.description, kc.is_active
                ORDER BY kc.name
            """)
            
            collections = []
            for row in rows:
                collections.append(KnowledgeCollectionResponse(
                    id=row['id'],
                    name=row['name'],
                    description=row['description'],
                    document_count=row['document_count'] or 0,
                    status='active' if row['is_active'] else 'inactive'
                ))
            
            return collections
        finally:
            await conn.close()
            
    except Exception as e:
        logger.error(f"获取知识库集合失败: {e}")
        raise HTTPException(status_code=500, detail=f"获取知识库集合失败: {str(e)}")


@router.post("/create", response_model=UserAgentResponse)
async def create_user_agent(
    request: CreateUserAgentRequest, 
    current_user_id: int = Depends(get_current_user_id)
):
    """创建用户自定义智能体"""
    try:
        # 验证模板存在
        template = await agent_template_service.get_template_by_id(request.template_id)
        if not template:
            raise HTTPException(status_code=404, detail="智能体模板不存在")
        
        # 生成智能体代码
        agent_code = f"user_{current_user_id}_{request.agent_name.lower().replace(' ', '_')}"
        
        # 直接操作数据库创建用户智能体
        from core.config_optimized import optimized_config_manager
        import asyncpg
        import json
        
        db_config = optimized_config_manager.settings.database_postgresql
        conn = await asyncpg.connect(
            host=db_config.host,
            port=db_config.port,
            user=db_config.username,
            password=db_config.password,
            database=db_config.database
        )
        
        try:
            # 检查智能体代码是否已存在
            existing = await conn.fetchval("""
                SELECT id FROM user_agents 
                WHERE user_id = $1 AND agent_code = $2
            """, current_user_id, agent_code)
            
            if existing:
                raise HTTPException(status_code=400, detail="智能体名称已存在，请使用其他名称")
            
            # 创建用户智能体
            agent_id = await conn.fetchval("""
                INSERT INTO user_agents (
                    user_id, template_id, agent_code, agent_name, agent_type,
                    description, collection_id, enable_knowledge_search,
                    enable_graph_search, retrieval_mode, custom_config,
                    model_config, tools_config, icon, color
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
                RETURNING id
            """, 
                current_user_id,
                request.template_id,
                agent_code,
                request.agent_name,
                template['template_type'],
                request.description,
                request.collection_id,
                request.enable_knowledge_search,
                request.enable_graph_search,
                request.retrieval_mode,
                json.dumps(request.custom_config or {}),
                json.dumps(request.agent_model_config or {}),
                json.dumps({
                    "selected": request.selected_tools or [],
                    "configs": request.tool_configs or {}
                }),
                request.icon or template.get('icon'),
                request.color or template.get('color')
            )
            
            # 配置智能体工具
            if request.selected_tools:
                for tool_code in request.selected_tools:
                    # 获取工具ID
                    tool_id = await conn.fetchval("""
                        SELECT id FROM agent_tools WHERE tool_code = $1
                    """, tool_code)
                    
                    if tool_id:
                        await conn.execute("""
                            INSERT INTO user_agent_tools (agent_id, tool_id, enabled, custom_config)
                            VALUES ($1, $2, $3, $4)
                        """, agent_id, tool_id, True, json.dumps(request.tool_configs.get(tool_code, {})))
            
            # 创建专属运行模板（基于资源生成工作流）
            try:
                # 解析资源绑定
                import json as _json
                custom_cfg = request.custom_config or {}
                resources = (custom_cfg.get('resources') or {}) if isinstance(custom_cfg, dict) else {}
                from service.workflows.workflow_builder import build_workflow_for_agent
                exec_flow, team_cfg = build_workflow_for_agent(template, resources)
                tpl_name = f"agent_{agent_id}_v1"
                await conn.execute("""
                    INSERT INTO team_execution_templates (id, template_name, description, team_config, execution_flow, is_default)
                    VALUES (gen_random_uuid(), $1, $2, $3::jsonb, $4::jsonb, true)
                    ON CONFLICT (template_name) DO NOTHING
                """, tpl_name, f"Auto workflow for agent {request.agent_name}", _json.dumps(team_cfg, ensure_ascii=False), _json.dumps(exec_flow, ensure_ascii=False))
                # 记录模板名到 user_agents.custom_config.resources.template_name
                merged_cfg = custom_cfg if isinstance(custom_cfg, dict) else {}
                merged_resources = merged_cfg.get('resources') or {}
                merged_resources['template_name'] = tpl_name
                merged_cfg['resources'] = merged_resources
                await conn.execute("""
                    UPDATE user_agents SET custom_config = $1 WHERE id = $2
                """, _json.dumps(merged_cfg, ensure_ascii=False), agent_id)
            except Exception as build_err:
                # 不中断创建，仅记录
                import logging as _logging
                _logging.getLogger(__name__).warning(f"生成运行模板失败: {build_err}")

            # 获取创建的智能体详情
            agent_row = await conn.fetchrow("""
                SELECT 
                    ua.id, ua.agent_code, ua.agent_name, ua.agent_type,
                    ua.description, ua.icon, ua.color, ua.status,
                    ua.usage_count, ua.last_used_at, ua.created_at,
                    at.template_name,
                    kc.name as collection_name
                FROM user_agents ua
                LEFT JOIN agent_templates at ON ua.template_id = at.id
                LEFT JOIN knowledge_collections kc ON ua.collection_id = kc.id
                WHERE ua.id = $1
            """, agent_id)
            
            if not agent_row:
                raise HTTPException(status_code=500, detail="创建智能体后无法获取详情")
            
            return UserAgentResponse(**dict(agent_row))
            
        finally:
            await conn.close()
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"创建用户智能体失败: {e}")
        raise HTTPException(status_code=500, detail=f"创建用户智能体失败: {str(e)}")


@router.get("/my-agents", response_model=List[UserAgentResponse])
async def get_my_agents(current_user_id: int = Depends(get_current_user_id)):
    """获取当前用户的所有智能体"""
    try:
        from core.config_optimized import optimized_config_manager
        import asyncpg
        
        db_config = optimized_config_manager.settings.database_postgresql
        conn = await asyncpg.connect(
            host=db_config.host,
            port=db_config.port,
            user=db_config.username,
            password=db_config.password,
            database=db_config.database
        )
        
        try:
            rows = await conn.fetch("""
                SELECT 
                    ua.id, ua.agent_code, ua.agent_name, ua.agent_type,
                    ua.description, ua.icon, ua.color, ua.status,
                    ua.usage_count, ua.last_used_at, ua.created_at,
                    at.template_name,
                    kc.name as collection_name
                FROM user_agents ua
                LEFT JOIN agent_templates at ON ua.template_id = at.id
                LEFT JOIN knowledge_collections kc ON ua.collection_id = kc.id
                WHERE ua.user_id = $1 AND ua.status = 'active'
                ORDER BY ua.created_at DESC
            """, current_user_id)
            
            return [UserAgentResponse(**dict(row)) for row in rows]
            
        finally:
            await conn.close()
            
    except Exception as e:
        logger.error(f"获取用户智能体列表失败: {e}")
        raise HTTPException(status_code=500, detail=f"获取用户智能体列表失败: {str(e)}")


@router.delete("/{agent_id}")
async def delete_user_agent(
    agent_id: str, 
    current_user_id: int = Depends(get_current_user_id)
):
    """删除用户智能体"""
    try:
        from core.config_optimized import optimized_config_manager
        import asyncpg
        
        db_config = optimized_config_manager.settings.database_postgresql
        conn = await asyncpg.connect(
            host=db_config.host,
            port=db_config.port,
            user=db_config.username,
            password=db_config.password,
            database=db_config.database
        )
        
        try:
            # 验证智能体所有权
            owner_id = await conn.fetchval("""
                SELECT user_id FROM user_agents WHERE id = $1
            """, agent_id)
            
            if not owner_id:
                raise HTTPException(status_code=404, detail="智能体不存在")
            
            if owner_id != current_user_id:
                raise HTTPException(status_code=403, detail="无权限删除该智能体")
            
            # 删除智能体工具配置
            await conn.execute("""
                DELETE FROM user_agent_tools WHERE agent_id = $1
            """, agent_id)
            
            # 删除智能体
            await conn.execute("""
                DELETE FROM user_agents WHERE id = $1
            """, agent_id)
            
            return {"message": "智能体删除成功"}
            
        finally:
            await conn.close()
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"删除用户智能体失败: {e}")
        raise HTTPException(status_code=500, detail=f"删除用户智能体失败: {str(e)}")


class PublishOptions(BaseModel):
    service_name: Optional[str] = None
    mode: Optional[str] = Field(default=None, pattern="^(api|embed)$")


@router.post("/{agent_id}/publish")
async def publish_user_agent(agent_id: str, opts: Optional[PublishOptions] = None, current_user_id: int = Depends(get_current_user_id)):
    """发布用户智能体：生成版本记录和发布时间，保存配置快照。"""
    try:
        from core.config_optimized import optimized_config_manager
        import asyncpg, json as _json
        from service.workflows.tool_orchestration import build_tool_workflow
        from service.workflows.workflow_engine import WorkflowContext
        db = optimized_config_manager.settings.database_postgresql
        conn = await asyncpg.connect(host=db.host, port=db.port, user=db.username, password=db.password, database=db.database)
        try:
            # 校验所有权
            row = await conn.fetchrow("""
                SELECT id, user_id, agent_name, description, icon, color, custom_config
                FROM user_agents WHERE id = $1
            """, agent_id)
            if not row:
                raise HTTPException(status_code=404, detail="智能体不存在")
            if int(row['user_id'] or 0) != int(current_user_id or 0):
                raise HTTPException(status_code=403, detail="无权发布该智能体")

            # 确保发布相关表存在
            await _ensure_publish_tables(conn)
            # 计算新版本号
            max_ver = await conn.fetchval("SELECT COALESCE(MAX(version),0) FROM user_agent_releases WHERE agent_id = $1", agent_id)
            version = int(max_ver or 0) + 1
            snapshot = {
                "agent_id": agent_id,
                "agent_name": row['agent_name'],
                "description": row['description'],
                "icon": row['icon'],
                "color": row['color'],
                "custom_config": row['custom_config'],
                "publish": {
                    "service_name": (opts.service_name if opts else None) or row['agent_name'],
                    "mode": (opts.mode if opts else None) or "api"
                }
            }
            await conn.execute("""
                INSERT INTO user_agent_releases (agent_id, user_id, version, snapshot)
                VALUES ($1, $2, $3, $4::jsonb)
            """, agent_id, current_user_id, version, _json.dumps(snapshot, ensure_ascii=False))

            rel = await conn.fetchrow("""
                SELECT agent_id, version, published_at FROM user_agent_releases
                WHERE agent_id = $1 AND version = $2
            """, agent_id, version)

            return {
                "agent_id": agent_id,
                "version": rel['version'],
                "published_at": rel['published_at']
            }
        finally:
            await conn.close()
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"发布智能体失败: {e}")
        raise HTTPException(status_code=500, detail="发布智能体失败")


class InvokeRequest(BaseModel):
    prompt: str
    # 可选覆盖（不要求调用方提供，默认使用已保存配置）
    selected_tools: Optional[list[str]] = None
    model: Optional[str] = None
    resources: Optional[Dict[str, Any]] = None
    top_n: Optional[int] = None
    sim_threshold: Optional[float] = None
    sim_weight: Optional[float] = None
    custom_prompt: Optional[str] = None
    messages: Optional[list] = None  # 可选历史消息：[ {role, content}, ... ]


@router.post("/{agent_id}/invoke")
async def invoke_user_agent(agent_id: str, req: InvokeRequest, current_user_id: int = Depends(get_current_user_id)):
    """直调用户智能体：一次性执行，返回最终答案（非流式）。
    - 使用工作流 tool_orchestration，按用户保存/发布时的配置运行。
    - 调用方可提供覆盖项；未提供时使用 DB 中已保存的配置。
    """
    try:
        from core.config_optimized import optimized_config_manager
        import asyncpg, json as _json

        db = optimized_config_manager.settings.database_postgresql
        conn = await asyncpg.connect(host=db.host, port=db.port, user=db.username, password=db.password, database=db.database)
        try:
            # 路由状态检查
            await _ensure_publish_tables(conn)
            st = await conn.fetchrow("SELECT enabled, deleted FROM user_agent_publish_status WHERE agent_id=$1", agent_id)
            if st and (st['deleted'] is True or st['enabled'] is False):
                raise HTTPException(status_code=404, detail="agent unpublished or disabled")
            row = await conn.fetchrow("""
                SELECT ua.agent_name, ua.description, ua.icon, ua.color,
                       ua.custom_config, ua.model_config, ua.selected_tools, ua.collection_id
                FROM user_agents ua
                WHERE ua.id = $1
            """, agent_id)
            if not row:
                raise HTTPException(status_code=404, detail="智能体不存在")

            # 解析保存的配置
            custom_cfg = row['custom_config'] if isinstance(row['custom_config'], dict) else None
            model_cfg = row['model_config'] if isinstance(row['model_config'], dict) else None
            saved_tools = row['selected_tools'] if isinstance(row['selected_tools'], list) else []

            # 资源（知识库/向量模型等）
            resources = (req.resources or {})
            if not resources:
                res = (custom_cfg or {}).get('resources') or {}
                if row['collection_id']:
                    res.setdefault('knowledge_collection', { 'collection_id': str(row['collection_id']) })
                resources = res

            # 构建上下文
            ctx = WorkflowContext()
            ctx.inputs.update({
                'agent_name': row['agent_name'] or 'user_agent',
                'selected_tools': req.selected_tools if req.selected_tools is not None else saved_tools,
                'model_id': req.model or (model_cfg or {}).get('default_model'),
                'prompt': req.prompt,
                'custom_prompt': req.custom_prompt or (custom_cfg or {}).get('custom_prompt') or '',
            })
            # 传入历史消息与聊天配置
            if isinstance(req.messages, list):
                ctx.inputs['chat_messages'] = req.messages
            chat_cfg_saved = ((custom_cfg or {}).get('chat_config') or {}) if isinstance((custom_cfg or {}).get('chat_config'), dict) else {}
            ctx.inputs['chat_config'] = chat_cfg_saved
            if resources:
                ctx.inputs['resources'] = resources
            if req.top_n is not None:
                ctx.inputs['top_n'] = req.top_n
            if req.sim_threshold is not None:
                ctx.inputs['sim_threshold'] = float(req.sim_threshold)
            if req.sim_weight is not None:
                ctx.inputs['sim_weight'] = float(req.sim_weight)

            wf = build_tool_workflow()
            # 运行到完成（收集最后结果）
            last_result = None
            async for ev in wf.run(ctx):
                if ev.get('stage') == 'execute' and 'result' in ev:
                    last_result = ev['result']
            result_text = ctx.outputs.get('result') or last_result or ''
            return { 'result': result_text, 'agent_id': agent_id }
        finally:
            await conn.close()
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"invoke 执行失败: {e}")
        raise HTTPException(status_code=500, detail="invoke 执行失败")


def _sse_event(data: dict) -> bytes:
    import json
    return f"data: {json.dumps(data, ensure_ascii=False)}\n\n".encode("utf-8")


@router.post("/{agent_id}/invoke-stream", response_class=StreamingResponse)
async def invoke_user_agent_stream(agent_id: str, req: InvokeRequest, current_user_id: int = Depends(get_current_user_id)):
    """流式直调用户智能体（SSE）。
    返回 text/event-stream，事件 data 为 JSON：
    - {"type":"session_state", "state": ctx }
    - 阶段事件：{"stage":"prepare|plan|retrieve|execute", ...}
    - 结束事件：{"type":"workflow_end"}
    """
    try:
        from core.config_optimized import optimized_config_manager
        import asyncpg
        from service.workflows.tool_orchestration import build_tool_workflow
        from service.workflows.workflow_engine import WorkflowContext

        db = optimized_config_manager.settings.database_postgresql
        conn = await asyncpg.connect(host=db.host, port=db.port, user=db.username, password=db.password, database=db.database)

        async def event_stream():
            try:
                await _ensure_publish_tables(conn)
                st = await conn.fetchrow(
                    "SELECT enabled, deleted FROM user_agent_publish_status WHERE agent_id=$1",
                    agent_id,
                )
                if st and (st['deleted'] is True or st['enabled'] is False):
                    yield _sse_event({"type": "error", "detail": "agent unpublished or disabled"})
                    return
                row = await conn.fetchrow(
                    """
                    SELECT ua.agent_name, ua.description, ua.icon, ua.color,
                           ua.custom_config, ua.model_config, ua.selected_tools, ua.collection_id
                    FROM user_agents ua
                    WHERE ua.id = $1
                    """,
                    agent_id,
                )
                if not row:
                    yield _sse_event({"type": "error", "detail": "agent not found"})
                    return

                custom_cfg = row['custom_config'] if isinstance(row['custom_config'], dict) else None
                model_cfg = row['model_config'] if isinstance(row['model_config'], dict) else None
                saved_tools = row['selected_tools'] if isinstance(row['selected_tools'], list) else []

                resources = (req.resources or {})
                if not resources:
                    res = (custom_cfg or {}).get('resources') or {}
                    if row['collection_id']:
                        res.setdefault('knowledge_collection', {'collection_id': str(row['collection_id'])})
                    resources = res

                ctx = WorkflowContext()
                ctx.inputs.update(
                    {
                        'agent_name': row['agent_name'] or 'user_agent',
                        'selected_tools': req.selected_tools if req.selected_tools is not None else saved_tools,
                        'model_id': req.model or (model_cfg or {}).get('default_model'),
                        'prompt': req.prompt,
                        'custom_prompt': req.custom_prompt or (custom_cfg or {}).get('custom_prompt') or '',
                    }
                )
                if isinstance(req.messages, list):
                    ctx.inputs['chat_messages'] = req.messages
                chat_cfg_saved = (
                    ((custom_cfg or {}).get('chat_config') or {})
                    if isinstance((custom_cfg or {}).get('chat_config'), dict)
                    else {}
                )
                ctx.inputs['chat_config'] = chat_cfg_saved
                if resources:
                    ctx.inputs['resources'] = resources
                if req.top_n is not None:
                    ctx.inputs['top_n'] = req.top_n
                if req.sim_threshold is not None:
                    ctx.inputs['sim_threshold'] = float(req.sim_threshold)
                if req.sim_weight is not None:
                    ctx.inputs['sim_weight'] = float(req.sim_weight)

                # 首次状态
                yield _sse_event({"type": "session_state", "state": ctx.to_json()})

                wf = build_tool_workflow()
                async for ev in wf.run(ctx):
                    # 直接转发工作流事件
                    yield _sse_event(ev)
                # 结束
                yield _sse_event({"type": "workflow_end", "result": ctx.outputs.get('result')})
            except Exception as e:
                yield _sse_event({"type": "error", "detail": str(e)})
            finally:
                try:
                    await conn.close()
                except Exception:
                    pass

        return StreamingResponse(event_stream(), media_type="text/event-stream")
    except Exception as e:
        logger.error(f"invoke-stream 初始化失败: {e}")
        raise HTTPException(status_code=500, detail="invoke-stream 初始化失败")


@router.get("/published", response_model=List[PublishedAgentResponse])
async def list_published_agents(current_user_id: int = Depends(get_current_user_id)):
    """列出当前用户已发布的智能体版本（按发布时间倒序）。"""
    try:
        from core.config_optimized import optimized_config_manager
        import asyncpg
        db = optimized_config_manager.settings.database_postgresql
        conn = await asyncpg.connect(host=db.host, port=db.port, user=db.username, password=db.password, database=db.database)
        try:
            # 确保发布相关表存在
            await _ensure_publish_tables(conn)
            rows = await conn.fetch("""
                SELECT r.agent_id, ua.agent_name, ua.description, ua.icon, ua.color,
                       r.version, r.published_at, r.snapshot,
                       s.enabled, s.deleted
                FROM user_agent_releases r
                LEFT JOIN user_agents ua ON r.agent_id = ua.id
                LEFT JOIN user_agent_publish_status s ON s.agent_id = r.agent_id
                WHERE r.user_id = $1
                ORDER BY r.published_at DESC
            """, current_user_id)
            out = []
            for row in rows:
                service_name = None
                publish_mode = None
                snap = row['snapshot'] if isinstance(row['snapshot'], dict) else None
                if snap:
                    pub = (snap.get('publish') or {}) if isinstance(snap.get('publish'), dict) else {}
                    service_name = pub.get('service_name')
                    publish_mode = pub.get('mode')
                out.append(PublishedAgentResponse(
                    agent_id=str(row['agent_id']),
                    agent_name=row['agent_name'] or '',
                    description=row['description'],
                    icon=row['icon'], color=row['color'],
                    version=int(row['version']),
                    published_at=row['published_at'],
                    service_name=service_name,
                    publish_mode=publish_mode,
                    enabled=(row['enabled'] if row['enabled'] is not None else True),
                    deleted=(row['deleted'] if row['deleted'] is not None else False)
                ))
            return out
        finally:
            await conn.close()
    except Exception as e:
        logger.error(f"获取已发布智能体失败: {e}")
        raise HTTPException(status_code=500, detail="获取已发布智能体失败")


@router.get("/{agent_id}/basic", response_model=AgentBasicResponse)
async def get_agent_basic(agent_id: str, current_user_id: int = Depends(get_current_user_id)):
    """获取智能体基础信息 + 最近一次发布的服务名/模式（若存在）。"""
    try:
        from core.config_optimized import optimized_config_manager
        import asyncpg, json as _json
        db = optimized_config_manager.settings.database_postgresql
        conn = await asyncpg.connect(host=db.host, port=db.port, user=db.username, password=db.password, database=db.database)
        try:
            row = await conn.fetchrow(
                """
                SELECT id, user_id, agent_name, description, icon, color
                FROM user_agents WHERE id = $1
                """,
                agent_id,
            )
            if not row:
                raise HTTPException(status_code=404, detail="智能体不存在")
            # 权限：仅允许本用户访问自己的智能体（可按需放宽）
            if int(row['user_id'] or 0) != int(current_user_id or 0):
                raise HTTPException(status_code=403, detail="无权访问该智能体")

            # 确保发布相关表存在
            await _ensure_publish_tables(conn)
            rel = await conn.fetchrow(
                """
                SELECT r.snapshot, s.enabled, s.deleted
                FROM user_agent_releases r
                LEFT JOIN user_agent_publish_status s ON s.agent_id = r.agent_id
                WHERE r.agent_id = $1
                ORDER BY r.published_at DESC
                LIMIT 1
                """,
                agent_id,
            )
            service_name = None
            publish_mode = None
            # 路由状态控制：禁用或删除时直接 404
            if rel and (rel['deleted'] is True or rel['enabled'] is False):
                raise HTTPException(status_code=404, detail="agent unpublished or disabled")
            if rel and rel['snapshot']:
                snap = rel['snapshot'] if isinstance(rel['snapshot'], dict) else None
                if snap:
                    pub = snap.get('publish') or {}
                    service_name = pub.get('service_name')
                    publish_mode = pub.get('mode')

            return AgentBasicResponse(
                agent_id=str(row['id']),
                agent_name=row['agent_name'] or '',
                description=row['description'],
                icon=row['icon'],
                color=row['color'],
                service_name=service_name,
                publish_mode=publish_mode,
            )
        finally:
            await conn.close()
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"获取智能体基础信息失败: {e}")
        raise HTTPException(status_code=500, detail="获取智能体基础信息失败")


@router.get("/{agent_id}/runtime-settings", response_model=RuntimeSettingsResponse)
async def get_runtime_settings(agent_id: str, current_user_id: int = Depends(get_current_user_id)):
    try:
        from core.config_optimized import optimized_config_manager
        import asyncpg
        db = optimized_config_manager.settings.database_postgresql
        conn = await asyncpg.connect(host=db.host, port=db.port, user=db.username, password=db.password, database=db.database)
        try:
            row = await conn.fetchrow("""
                SELECT user_id, model_config, custom_config
                FROM user_agents WHERE id=$1
            """, agent_id)
            if not row:
                raise HTTPException(status_code=404, detail="智能体不存在")
            if int(row['user_id'] or 0) != int(current_user_id or 0):
                raise HTTPException(status_code=403, detail="无权访问")
            model_cfg = row['model_config'] if isinstance(row['model_config'], dict) else {}
            custom_cfg = row['custom_config'] if isinstance(row['custom_config'], dict) else {}
            chat_cfg = custom_cfg.get('chat_config') if isinstance(custom_cfg.get('chat_config'), dict) else {}
            return RuntimeSettingsResponse(default_model=model_cfg.get('default_model'), chat=chat_cfg)
        finally:
            await conn.close()
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"获取运行设置失败: {e}")
        raise HTTPException(status_code=500, detail="获取运行设置失败")


@router.put("/{agent_id}/runtime-settings", response_model=RuntimeSettingsResponse)
async def update_runtime_settings(agent_id: str, body: UpdateRuntimeSettingsRequest, current_user_id: int = Depends(get_current_user_id)):
    try:
        from core.config_optimized import optimized_config_manager
        import asyncpg, json as _json
        db = optimized_config_manager.settings.database_postgresql
        conn = await asyncpg.connect(host=db.host, port=db.port, user=db.username, password=db.password, database=db.database)
        try:
            row = await conn.fetchrow("SELECT user_id, model_config, custom_config FROM user_agents WHERE id=$1", agent_id)
            if not row:
                raise HTTPException(status_code=404, detail="智能体不存在")
            if int(row['user_id'] or 0) != int(current_user_id or 0):
                raise HTTPException(status_code=403, detail="无权修改")

            model_cfg = row['model_config'] if isinstance(row['model_config'], dict) else {}
            custom_cfg = row['custom_config'] if isinstance(row['custom_config'], dict) else {}
            chat_cfg = custom_cfg.get('chat_config') if isinstance(custom_cfg.get('chat_config'), dict) else {}

            if body.default_model is not None:
                model_cfg['default_model'] = body.default_model
            if body.chat is not None:
                # 仅允许更新多轮、最大轮数与上下文窗口
                mt = body.chat.get('multi_turn')
                if mt is not None:
                    chat_cfg['multi_turn'] = bool(mt)
                if 'max_rounds' in body.chat:
                    try:
                        chat_cfg['max_rounds'] = int(body.chat.get('max_rounds') or 0)
                    except Exception:
                        pass
                if 'context_window' in body.chat:
                    try:
                        chat_cfg['context_window'] = int(body.chat.get('context_window') or 0)
                    except Exception:
                        pass
                custom_cfg['chat_config'] = chat_cfg

            await conn.execute(
                """
                UPDATE user_agents
                SET model_config = $2::jsonb,
                    custom_config = $3::jsonb
                WHERE id = $1
                """,
                agent_id, _json.dumps(model_cfg, ensure_ascii=False), _json.dumps(custom_cfg, ensure_ascii=False)
            )
            return RuntimeSettingsResponse(default_model=model_cfg.get('default_model'), chat=chat_cfg)
        finally:
            await conn.close()
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"更新运行设置失败: {e}")
        raise HTTPException(status_code=500, detail="更新运行设置失败")


class TogglePublishRequest(BaseModel):
    enabled: bool


@router.put("/{agent_id}/publish/enable")
async def toggle_publish(agent_id: str, body: TogglePublishRequest, current_user_id: int = Depends(get_current_user_id)):
    """启用/禁用已发布路由。禁用后嵌入页与直调接口将返回404。"""
    try:
        from core.config_optimized import optimized_config_manager
        import asyncpg
        db = optimized_config_manager.settings.database_postgresql
        conn = await asyncpg.connect(host=db.host, port=db.port, user=db.username, password=db.password, database=db.database)
        try:
            # 校验所有权
            owner = await conn.fetchval("SELECT user_id FROM user_agents WHERE id=$1", agent_id)
            if not owner:
                raise HTTPException(status_code=404, detail="智能体不存在")
            if int(owner or 0) != int(current_user_id or 0):
                raise HTTPException(status_code=403, detail="无权修改")
            await _ensure_publish_tables(conn)
            await conn.execute(
                """
                INSERT INTO user_agent_publish_status(agent_id, enabled, deleted, updated_at)
                VALUES ($1, $2, FALSE, now())
                ON CONFLICT (agent_id)
                DO UPDATE SET enabled = EXCLUDED.enabled, updated_at = now()
                """,
                agent_id, bool(body.enabled)
            )
            return {"agent_id": agent_id, "enabled": bool(body.enabled)}
        finally:
            await conn.close()
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"切换发布状态失败: {e}")
        raise HTTPException(status_code=500, detail="切换发布状态失败")


@router.delete("/{agent_id}/publish")
async def delete_publish(agent_id: str, current_user_id: int = Depends(get_current_user_id)):
    """删除发布（软删除）：标记 deleted=true, enabled=false。之后访问返回404。"""
    try:
        from core.config_optimized import optimized_config_manager
        import asyncpg
        db = optimized_config_manager.settings.database_postgresql
        conn = await asyncpg.connect(host=db.host, port=db.port, user=db.username, password=db.password, database=db.database)
        try:
            owner = await conn.fetchval("SELECT user_id FROM user_agents WHERE id=$1", agent_id)
            if not owner:
                raise HTTPException(status_code=404, detail="智能体不存在")
            if int(owner or 0) != int(current_user_id or 0):
                raise HTTPException(status_code=403, detail="无权删除")
            await _ensure_publish_tables(conn)
            await conn.execute(
                """
                INSERT INTO user_agent_publish_status(agent_id, enabled, deleted, updated_at)
                VALUES ($1, FALSE, TRUE, now())
                ON CONFLICT (agent_id)
                DO UPDATE SET enabled = FALSE, deleted = TRUE, updated_at = now()
                """,
                agent_id
            )
            return {"agent_id": agent_id, "deleted": True}
        finally:
            await conn.close()
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"删除发布失败: {e}")
        raise HTTPException(status_code=500, detail="删除发布失败")


@router.options("/{agent_id}/publish")
async def options_publish(agent_id: str):
    """预检请求支持，避免前端跨域/代理预检DELETE报405。"""
    return Response(status_code=200, headers={
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
        "Access-Control-Allow-Headers": "*"
    })


@router.get("/models")
async def get_available_models():
    """获取可用的模型列表"""
    try:
        # 从配置中获取可用模型
        from core.config_optimized import optimized_config_manager
        
        # 这里返回常用的模型配置
        models = [
            {
                "id": "qwen3-30b-a3b-instruct-2507",
                "name": "Qwen3 30B A3B Instruct",
                "provider": "alibaba",
                "description": "阿里云通义千问大模型，适合中文对话"
            },
            {
                "id": "kimi-k2-siliconflow",
                "name": "Kimi K2 SiliconFlow",
                "provider": "moonshot",
                "description": "Moonshot Kimi大模型"
            },
            {
                "id": "qwen-plus-latest",
                "name": "Qwen Plus Latest",
                "provider": "alibaba",
                "description": "通义千问Plus版本"
            },
            {
                "id": "gpt-4o-mini",
                "name": "GPT-4o Mini",
                "provider": "openai",
                "description": "OpenAI GPT-4o Mini模型"
            },
            {
                "id": "gemini-2.5-flash-preview-thinking",
                "name": "Gemini 2.5 Flash Preview",
                "provider": "google",
                "description": "Google Gemini 2.5闪存预览版"
            }
        ]
        
        return models
        
    except Exception as e:
        logger.error(f"获取模型列表失败: {e}")
        raise HTTPException(status_code=500, detail=f"获取模型列表失败: {str(e)}")
class CreateDraftRequest(BaseModel):
    template_id: str
    agent_name: Optional[str] = None
    description: Optional[str] = None
    collection_id: Optional[str] = None
    enable_knowledge_search: bool = True
    enable_graph_search: bool = False
    retrieval_mode: str = Field(default="all", pattern="^(all|qa_only|papers_only)$")
    selected_tools: List[str] = []
    tool_configs: Dict[str, Any] = {}
    agent_model_config: Optional[Dict[str, Any]] = Field(default=None, alias="model_config")
    custom_config: Optional[Dict[str, Any]] = None


@router.post("/drafts")
async def create_draft_user_agent(req: CreateDraftRequest, current_user_id: int = Depends(get_current_user_id)):
    """创建临时（草稿）智能体：显式继承基础模板，仅用用户配置覆盖。status='draft'。"""
    try:
        from core.config_optimized import optimized_config_manager
        import asyncpg
        db = optimized_config_manager.settings.database_postgresql
        conn = await asyncpg.connect(host=db.host, port=db.port, user=db.username, password=db.password, database=db.database)
        try:
            tpl = await agent_template_service.get_template_by_id(req.template_id)
            if not tpl:
                raise HTTPException(status_code=404, detail="模板不存在")
            # 基于模板合并配置
            base_cfg = tpl.get('base_config') or {}
            tpl_model_cfg = tpl.get('model_config') or {}
            tpl_tools_cfg = tpl.get('tools_config') or {}
            final_model_cfg = { **(tpl_model_cfg or {}), **(req.agent_model_config or {}) }
            final_custom_cfg = { **(base_cfg or {}), **(req.custom_config or {}) }
            # 生成草稿标识
            ts = datetime.now().strftime('%y%m%d-%H%M%S')
            rand = ''.join(random.choices(string.ascii_lowercase + string.digits, k=4))
            marker = f"draft-{ts}-{rand}"
            base_name = (req.agent_name or tpl.get('template_name') or 'studio_agent').strip()
            display_name = f"{base_name} · {marker}"
            # 插入 user_agents（status='draft'）
            agent_id = await conn.fetchval(
                """
                INSERT INTO user_agents (
                    user_id, template_id, agent_code, agent_name, agent_type,
                    description, collection_id, icon, color, status,
                    selected_tools, tools_config, model_config, custom_config
                ) VALUES (
                    $1, $2, substr(md5(random()::text), 1, 12), $3, 'single',
                    $4, $5, COALESCE($6, ''), COALESCE($7, ''), 'draft',
                    $8::jsonb, $9::jsonb, $10::jsonb, $11::jsonb
                ) RETURNING id
                """,
                current_user_id,
                req.template_id,
                display_name,
                (req.description or tpl.get('description')),
                (req.collection_id),
                tpl.get('icon'),
                tpl.get('color'),
                _json.dumps(req.selected_tools or [] , ensure_ascii=False),
                _json.dumps(req.tool_configs or tpl_tools_cfg or {}, ensure_ascii=False),
                _json.dumps(final_model_cfg or {}, ensure_ascii=False),
                _json.dumps(final_custom_cfg or {}, ensure_ascii=False)
            )
            return { "id": agent_id, "status": "draft", "name": display_name, "marker": marker }
        finally:
            await conn.close()
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"创建草稿失败: {e}")
        raise HTTPException(status_code=500, detail="创建草稿失败")


class PromoteRequest(BaseModel):
    # 允许在发布时覆盖名称；如果不提供则自动去掉草稿标记
    agent_name: Optional[str] = None


@router.put("/{agent_id}/promote")
async def promote_user_agent(agent_id: str, body: Optional[PromoteRequest] = None, current_user_id: int = Depends(get_current_user_id)):
    """将草稿晋升为正式（status='active'）。"""
    try:
        from core.config_optimized import optimized_config_manager
        import asyncpg
        db = optimized_config_manager.settings.database_postgresql
        conn = await asyncpg.connect(host=db.host, port=db.port, user=db.username, password=db.password, database=db.database)
        try:
            row = await conn.fetchrow("SELECT user_id, status, agent_name FROM user_agents WHERE id=$1", agent_id)
            if not row:
                raise HTTPException(status_code=404, detail="智能体不存在")
            if int(row['user_id'] or 0) != int(current_user_id or 0):
                raise HTTPException(status_code=403, detail="无权操作该智能体")
            # 计算最终名称：优先使用传入的 agent_name；否则去掉草稿标识“ · draft-...”
            current_name = row['agent_name'] or ''
            provided = (body.agent_name if body else None)
            def _strip_marker(name: str) -> str:
                # 识别“ · draft-******”后缀
                import re
                return re.sub(r"\s*[·•]\s*draft-[0-9\-:a-zA-Z]+$", "", name).strip()
            final_name = (provided.strip() if isinstance(provided, str) and provided.strip() else _strip_marker(current_name)) or current_name
            await conn.execute("UPDATE user_agents SET status='active', agent_name=$2 WHERE id=$1", agent_id, final_name)
            return { "id": agent_id, "status": "active", "name": final_name }
        finally:
            await conn.close()
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"晋升草稿失败: {e}")
        raise HTTPException(status_code=500, detail="晋升草稿失败")
