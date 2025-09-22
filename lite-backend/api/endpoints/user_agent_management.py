"""
用户智能体管理API - 独立的智能体创建和管理接口
不影响现有系统功能，专门用于新的智能体导航流程
"""
from fastapi import APIRouter, HTTPException, Depends
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


router = APIRouter(tags=["用户智能体管理"])


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
