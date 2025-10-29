"""
Hook Pipeline API端点

提供Hook Pipeline的管理、查询和日志接口
"""

import logging
from typing import List, Optional, Dict, Any
from uuid import UUID
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
import asyncpg

from core.database import get_db_pool
from service.hook_pipeline_service import (
    get_hook_pipeline_service,
    load_pipeline,
    load_default_pipeline
)
from service.hooks import hook_registry

logger = logging.getLogger(__name__)

router = APIRouter(tags=["hook-pipelines"])


# ==================== Pydantic Models ====================

class HookConfig(BaseModel):
    """Hook配置"""
    hook_id: str
    enabled: bool = True
    class_name: str
    config: Dict[str, Any] = {}


class RoutingRule(BaseModel):
    """路由规则"""
    name: str
    conditions: Dict[str, Any]
    strategy: str


class PipelineCreateRequest(BaseModel):
    """创建Pipeline请求"""
    pipeline_name: str = Field(..., min_length=3, max_length=100)
    description: Optional[str] = None
    scenario: Optional[str] = "general"
    pre_hooks: List[HookConfig] = []
    post_hooks: List[HookConfig] = []


class PipelineResponse(BaseModel):
    """Pipeline响应"""
    id: Optional[str] = None
    pipeline_name: str
    description: Optional[str] = None
    scenario: Optional[str] = None
    is_active: bool = True
    created_at: Optional[str] = None
    updated_at: Optional[str] = None


class ExecutionLogResponse(BaseModel):
    """执行日志响应"""
    id: str
    pipeline_id: Optional[str]
    agent_id: Optional[str]
    user_id: Optional[str]
    hook_id: str
    hook_type: str
    execution_order: int
    status: str
    error_message: Optional[str] = None
    execution_time_ms: int
    executed_at: str


class AvailableHookResponse(BaseModel):
    """可用Hook响应"""
    hook_id: str
    hook_type: str  # pre | post
    name: str
    description: Optional[str] = None
    category: Optional[str] = None
    # 增强的元数据字段
    features: Optional[List[str]] = None
    use_cases: Optional[List[str]] = None
    config_example: Optional[Dict[str, Any]] = None
    config_params: Optional[List[Dict[str, Any]]] = None  # 参数配置详情
    output_fields: Optional[List[str]] = None
    raises: Optional[List[str]] = None
    modifies_input: Optional[bool] = None
    priority: Optional[int] = None
    execution_time: Optional[str] = None
    tool_bindings: Optional[List[Dict[str, Any]]] = None  # 工具绑定信息


class AvailableToolResponse(BaseModel):
    """可用工具响应"""
    tool_id: str
    tool_type: str  # api | mcp
    tool_name: str
    server_or_config: Optional[str] = None
    description: Optional[str] = None
    input_schema: Optional[Dict[str, Any]] = None


# ==================== API Endpoints ====================

# IMPORTANT: 具体路径的路由必须放在路径参数路由之前！
# 否则 /{pipeline_id} 会拦截所有单级路径

@router.get("", response_model=List[PipelineResponse])
async def list_pipelines(
    scenario: Optional[str] = Query(None, description="场景过滤"),
    is_active: bool = Query(True, description="是否仅返回活动的Pipeline")
):
    """列出所有Hook Pipeline

    Args:
        scenario: 场景过滤（general/policy/academic/enterprise）
        is_active: 是否仅返回活动的Pipeline

    Returns:
        Pipeline列表
    """
    try:
        service = get_hook_pipeline_service()
        await service.initialize()

        pipelines = await service.list_pipelines(
            scenario=scenario,
            is_active=is_active
        )

        return [PipelineResponse(**p) for p in pipelines]

    except Exception as e:
        logger.error(f"列出Pipeline失败: {e}")
        raise HTTPException(status_code=500, detail="列出Pipeline失败")


@router.get("/available/hooks", response_model=List[AvailableHookResponse])
async def list_available_hooks(pool=Depends(get_db_pool)):
    """列出所有可用的Hooks（包含详细元数据）

    Returns:
        可用Hook列表（包含features、use_cases、config_example等详细信息）
    """
    try:
        # 导入详细元数据
        from service.hooks.pre_hooks_metadata import get_hook_metadata as get_detailed_metadata
        import json

        # 从custom_hooks表获取用户配置的tool_bindings
        async with pool.acquire() as conn:
            custom_configs = await conn.fetch("""
                SELECT hook_id, tool_bindings
                FROM custom_hooks
                WHERE tool_bindings IS NOT NULL
            """)

        # 构建hook_id到tool_bindings的映射
        custom_tool_bindings_map = {}
        for row in custom_configs:
            tool_bindings_data = row['tool_bindings']
            if isinstance(tool_bindings_data, str):
                tool_bindings_data = json.loads(tool_bindings_data) if tool_bindings_data else []
            custom_tool_bindings_map[row['hook_id']] = tool_bindings_data or []

        hooks = []

        # 收集Pre-hooks
        for hook_id in hook_registry.list_pre_hooks():
            metadata = hook_registry.get_hook_metadata(hook_id)
            detailed = get_detailed_metadata(hook_id)

            # 优先使用用户配置的tool_bindings，否则使用默认的
            tool_bindings = custom_tool_bindings_map.get(hook_id, detailed.get('tool_bindings', []))

            hooks.append(AvailableHookResponse(
                hook_id=hook_id,
                hook_type="pre",
                name=metadata.get('name', hook_id),
                description=metadata.get('description'),
                category=metadata.get('category'),
                # 详细元数据
                features=detailed.get('features'),
                use_cases=detailed.get('use_cases'),
                config_example=detailed.get('config_example'),
                config_params=detailed.get('config_params'),  # 添加参数配置
                output_fields=detailed.get('output_fields'),
                raises=detailed.get('raises'),
                modifies_input=detailed.get('modifies_input'),
                priority=detailed.get('priority'),
                execution_time=detailed.get('execution_time'),
                tool_bindings=tool_bindings  # 使用用户配置或默认配置
            ))

        # 收集Post-hooks
        for hook_id in hook_registry.list_post_hooks():
            metadata = hook_registry.get_hook_metadata(hook_id)
            tool_bindings = custom_tool_bindings_map.get(hook_id, [])

            hooks.append(AvailableHookResponse(
                hook_id=hook_id,
                hook_type="post",
                name=metadata.get('name', hook_id),
                description=metadata.get('description'),
                category=metadata.get('category'),
                tool_bindings=tool_bindings  # 添加用户配置的工具绑定
            ))

        return hooks

    except Exception as e:
        logger.error(f"列出可用Hooks失败: {e}")
        raise HTTPException(status_code=500, detail="列出可用Hooks失败")


@router.get("/statistics", response_model=Dict[str, Any])
async def get_statistics():
    """获取Hook系统统计信息

    Returns:
        统计信息
    """
    try:
        # 统计可用Hooks数量
        pre_hooks_count = len(hook_registry.list_pre_hooks())
        post_hooks_count = len(hook_registry.list_post_hooks())

        # 统计Pipeline数量（从service获取）
        service = get_hook_pipeline_service()
        await service.initialize()

        pipelines = await service.list_pipelines(is_active=True)
        active_pipelines_count = len(pipelines)

        # 统计Hook分类
        categories = {}
        for hook_id in hook_registry.list_pre_hooks():
            metadata = hook_registry.get_hook_metadata(hook_id)
            category = metadata.get('category', 'uncategorized')
            categories[category] = categories.get(category, 0) + 1

        for hook_id in hook_registry.list_post_hooks():
            metadata = hook_registry.get_hook_metadata(hook_id)
            category = metadata.get('category', 'uncategorized')
            categories[category] = categories.get(category, 0) + 1

        # 统计场景
        scenes = {}
        for hook_id in hook_registry.list_pre_hooks():
            metadata = hook_registry.get_hook_metadata(hook_id)
            scene = metadata.get('scene', 'general')
            scenes[scene] = scenes.get(scene, 0) + 1

        for hook_id in hook_registry.list_post_hooks():
            metadata = hook_registry.get_hook_metadata(hook_id)
            scene = metadata.get('scene', 'general')
            scenes[scene] = scenes.get(scene, 0) + 1

        return {
            "total_hooks": pre_hooks_count + post_hooks_count,
            "pre_hooks_count": pre_hooks_count,
            "post_hooks_count": post_hooks_count,
            "active_pipelines_count": active_pipelines_count,
            "categories": categories,
            "scenes": scenes,
            "timestamp": datetime.now().isoformat()
        }

    except Exception as e:
        logger.error(f"获取统计信息失败: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"获取统计信息失败: {str(e)}")


@router.get("/retrieval-strategies", response_model=List[Dict[str, Any]])
async def list_retrieval_strategies():
    """列出所有可用的检索策略

    Returns:
        检索策略列表
    """
    try:
        service = get_hook_pipeline_service()
        await service.initialize()

        query = """
            SELECT id, strategy_name, description, strategy_type,
                   applicable_intents, applicable_domains,
                   config, is_active
            FROM retrieval_strategies
            WHERE is_active = true
            ORDER BY strategy_type, strategy_name
        """

        async with service.pool.acquire() as conn:
            rows = await conn.fetch(query)
            return [dict(row) for row in rows]

    except Exception as e:
        logger.error(f"列出检索策略失败: {e}")
        raise HTTPException(status_code=500, detail="列出检索策略失败")


@router.get("/tools/api", response_model=List[AvailableToolResponse])
async def list_api_tools():
    """列出所有可用的API工具

    Returns:
        API工具列表
    """
    try:
        from service.hooks.tool_executor import get_hook_tool_executor

        executor = get_hook_tool_executor()
        await executor.initialize()

        tool_ids = await executor.list_api_tools()
        tools = []

        for tool_id in tool_ids:
            # 解析tool_id格式: api:config_name:tool_name
            parts = tool_id.split(':')
            if len(parts) == 3:
                config_name = parts[1]
                tool_name = parts[2]

                # 尝试获取工具Schema
                schema = await executor.get_tool_schema(tool_id)

                tools.append(AvailableToolResponse(
                    tool_id=tool_id,
                    tool_type='api',
                    tool_name=tool_name,
                    server_or_config=config_name,
                    description=schema.get('description') if schema else None,
                    input_schema=schema.get('inputSchema') if schema else None
                ))

        return tools

    except Exception as e:
        logger.error(f"列出API工具失败: {e}")
        raise HTTPException(status_code=500, detail=f"列出API工具失败: {str(e)}")


@router.get("/tools/mcp", response_model=List[AvailableToolResponse])
async def list_mcp_tools():
    """列出所有可用的MCP工具

    Returns:
        MCP工具列表
    """
    try:
        from service.hooks.tool_executor import get_hook_tool_executor

        executor = get_hook_tool_executor()
        await executor.initialize()

        tool_ids = await executor.list_mcp_tools()
        tools = []

        for tool_id in tool_ids:
            # 解析tool_id格式: mcp:server_name:tool_name
            parts = tool_id.split(':')
            if len(parts) == 3:
                server_name = parts[1]
                tool_name = parts[2]

                # 尝试获取工具Schema
                schema = await executor.get_tool_schema(tool_id)

                tools.append(AvailableToolResponse(
                    tool_id=tool_id,
                    tool_type='mcp',
                    tool_name=tool_name,
                    server_or_config=server_name,
                    description=schema.get('description') if schema else None,
                    input_schema=schema.get('inputSchema') if schema else None
                ))

        return tools

    except Exception as e:
        logger.error(f"列出MCP工具失败: {e}")
        raise HTTPException(status_code=500, detail=f"列出MCP工具失败: {str(e)}")


@router.get("/tools/all", response_model=Dict[str, Any])
async def list_all_tools():
    """列出所有可用的工具（API和MCP）

    Returns:
        包含API和MCP工具的字典
    """
    try:
        from service.hooks.tool_executor import get_hook_tool_executor

        executor = get_hook_tool_executor()
        await executor.initialize()

        # 获取API工具
        api_tool_ids = await executor.list_api_tools()
        api_tools = []
        for tool_id in api_tool_ids:
            parts = tool_id.split(':')
            if len(parts) == 3:
                config_name = parts[1]
                tool_name = parts[2]
                schema = await executor.get_tool_schema(tool_id)
                api_tools.append({
                    'tool_id': tool_id,
                    'tool_type': 'api',
                    'tool_name': tool_name,
                    'server_or_config': config_name,
                    'description': schema.get('description') if schema else None,
                    'input_schema': schema.get('inputSchema') if schema else None
                })

        # 获取MCP工具
        mcp_tool_ids = await executor.list_mcp_tools()
        mcp_tools = []
        for tool_id in mcp_tool_ids:
            parts = tool_id.split(':')
            if len(parts) == 3:
                server_name = parts[1]
                tool_name = parts[2]
                schema = await executor.get_tool_schema(tool_id)
                mcp_tools.append({
                    'tool_id': tool_id,
                    'tool_type': 'mcp',
                    'tool_name': tool_name,
                    'server_or_config': server_name,
                    'description': schema.get('description') if schema else None,
                    'input_schema': schema.get('inputSchema') if schema else None
                })

        return {
            'api_tools': api_tools,
            'mcp_tools': mcp_tools,
            'total_count': len(api_tools) + len(mcp_tools),
            'api_count': len(api_tools),
            'mcp_count': len(mcp_tools)
        }

    except Exception as e:
        logger.error(f"列出所有工具失败: {e}")
        raise HTTPException(status_code=500, detail=f"列出所有工具失败: {str(e)}")


@router.get("/status/health", response_model=Dict[str, Any])
async def health_check():
    """健康检查

    Returns:
        健康状态
    """
    try:
        service = get_hook_pipeline_service()
        await service.initialize()

        cache_info = service.get_cache_info()

        return {
            "status": "healthy",
            "service": "hook_pipeline_service",
            "cache": cache_info
        }

    except Exception as e:
        logger.error(f"健康检查失败: {e}")
        return {
            "status": "unhealthy",
            "error": str(e)
        }


@router.post("/test", response_model=Dict[str, Any])
async def test_pipeline(
    pipeline_id: str,
    query: str,
    session_id: Optional[str] = None,
    user_id: Optional[str] = None
):
    """测试Pipeline

    Args:
        pipeline_id: Pipeline ID
        query: 查询文本
        session_id: 会话ID
        user_id: 用户ID

    Returns:
        Pipeline执行结果
    """
    try:
        from service.hooks import RunInput, AgentSession

        # 加载Pipeline
        pipeline = await load_pipeline(pipeline_id)
        if not pipeline:
            raise HTTPException(status_code=404, detail=f"Pipeline未找到: {pipeline_id}")

        # 准备输入
        run_input = RunInput(
            input_content=query,
            session_id=session_id,
            user_id=user_id,
            context={}
        )
        session = AgentSession(
            id=session_id or "test-session",
            user_id=user_id,
            agent_id="test-agent"
        )

        # 执行Pre-hooks
        try:
            await pipeline.execute_pre_hooks(run_input, session, user_id=user_id)
        except Exception as e:
            return {
                "status": "failed",
                "error": str(e),
                "pipeline_id": pipeline_id
            }

        # 返回执行结果
        summary = pipeline.get_execution_summary()

        return {
            "status": "success",
            "pipeline_id": pipeline_id,
            "input": query,
            "context": run_input.context,
            "execution_summary": summary
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Pipeline测试失败: {e}")
        raise HTTPException(status_code=500, detail=f"Pipeline测试失败: {str(e)}")


# 路径参数路由必须放在最后！
@router.get("/{pipeline_id}", response_model=PipelineResponse)
async def get_pipeline(pipeline_id: str):
    """获取Pipeline详情

    Args:
        pipeline_id: Pipeline ID或名称

    Returns:
        Pipeline详情
    """
    try:
        service = get_hook_pipeline_service()

        pipeline = await service.load_pipeline_from_db(pipeline_id, use_cache=True)

        if not pipeline:
            raise HTTPException(status_code=404, detail=f"Pipeline未找到: {pipeline_id}")

        return PipelineResponse(
            pipeline_name=pipeline.pipeline_name,
            description=pipeline.pipeline_name
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"获取Pipeline失败: {e}")
        raise HTTPException(status_code=500, detail="获取Pipeline失败")


@router.get("/{pipeline_id}/logs", response_model=List[ExecutionLogResponse])
async def get_pipeline_logs(
    pipeline_id: str,
    agent_id: Optional[str] = Query(None),
    user_id: Optional[str] = Query(None),
    limit: int = Query(100, ge=1, le=1000),
    offset: int = Query(0, ge=0)
):
    """获取Pipeline执行日志

    Args:
        pipeline_id: Pipeline ID
        agent_id: Agent ID过滤
        user_id: 用户ID过滤
        limit: 限制数量
        offset: 偏移量

    Returns:
        执行日志列表
    """
    try:
        service = get_hook_pipeline_service()
        await service.initialize()

        logs = await service.get_execution_logs(
            pipeline_id=pipeline_id,
            agent_id=agent_id,
            user_id=user_id,
            limit=limit,
            offset=offset
        )

        return [ExecutionLogResponse(**log) for log in logs]

    except Exception as e:
        logger.error(f"获取执行日志失败: {e}")
        raise HTTPException(status_code=500, detail="获取执行日志失败")


class HookTestRequest(BaseModel):
    """Hook测试请求"""
    hook_id: str = Field(..., description="Hook ID")
    query: str = Field(..., description="测试查询")
    context: Dict[str, Any] = Field(default_factory=dict, description="上下文数据")


@router.post("/test-hook", response_model=Dict[str, Any])
async def test_hook(request: HookTestRequest, pool: asyncpg.Pool = Depends(get_db_pool)):
    """测试单个Hook

    Args:
        request: Hook测试请求
        pool: 数据库连接池

    Returns:
        Hook执行结果
    """
    try:
        from service.hooks import RunInput, AgentSession
        from service.hooks.registry import hook_registry
        import json

        hook_id = request.hook_id

        # 检查Hook是否存在并获取Hook类
        hook_class = None
        is_pre_hook = hook_id in hook_registry.list_pre_hooks()
        is_post_hook = hook_id in hook_registry.list_post_hooks()

        if is_pre_hook:
            hook_class = hook_registry.get_pre_hook(hook_id)
        elif is_post_hook:
            hook_class = hook_registry.get_post_hook(hook_id)
        else:
            raise HTTPException(status_code=404, detail=f"Hook未找到: {hook_id}")

        if not hook_class:
            raise HTTPException(status_code=404, detail=f"无法获取Hook类: {hook_id}")

        # 从数据库加载Hook配置
        async with pool.acquire() as conn:
            row = await conn.fetchrow("""
                SELECT metadata, tool_bindings
                FROM custom_hooks
                WHERE hook_id = $1
            """, hook_id)

        # 构建config字典
        hook_config = {}
        if row and row['metadata']:
            metadata = row['metadata']
            if isinstance(metadata, str):
                metadata = json.loads(metadata)

            # 提取config_params
            config_params = metadata.get('config_params', [])

            # 将config_params列表转换为dict
            if isinstance(config_params, list):
                for param in config_params:
                    param_name = param.get('name')
                    default_value = param.get('default')
                    if param_name:
                        hook_config[param_name] = default_value
            elif isinstance(config_params, dict):
                hook_config = config_params

            # 如果有tool_bindings，也加入配置
            if row.get('tool_bindings'):
                tool_bindings_data = row['tool_bindings']
                if isinstance(tool_bindings_data, str):
                    tool_bindings_data = json.loads(tool_bindings_data)
                hook_config['tool_bindings'] = tool_bindings_data

        # 如果数据库没有配置，使用Hook的元数据提供默认配置
        if not hook_config:
            metadata = hook_registry.get_hook_metadata(hook_id)
            if metadata:
                # 尝试从详细元数据获取默认配置
                from service.hooks.pre_hooks_metadata import get_hook_metadata as get_detailed_metadata
                detailed = get_detailed_metadata(hook_id)

                if detailed and 'config_example' in detailed:
                    hook_config = detailed['config_example']
                elif detailed and 'config_params' in detailed:
                    # 从config_params提取默认值
                    config_params = detailed['config_params']
                    if isinstance(config_params, list):
                        for param in config_params:
                            param_name = param.get('name')
                            default_value = param.get('default')
                            if param_name:
                                hook_config[param_name] = default_value

        # 按Hook要求的格式构建config
        config = {'config': hook_config}

        logger.info(f"Hook配置加载完成: hook_id={hook_id}, config={config}")

        # 实例化Hook
        hook_instance = hook_class(config)

        # 准备输入
        run_input = RunInput(
            input_content=request.query,
            session_id="test-session",
            user_id="test-user",
            context=request.context
        )

        session = AgentSession(
            id="test-session",
            user_id="test-user",
            agent_id="test-agent"
        )

        # 执行Hook
        import time
        start_time = time.time()

        try:
            result = await hook_instance.execute(run_input, session, user_id="test-user")
            execution_time = (time.time() - start_time) * 1000  # 转为毫秒

            return {
                "success": True,
                "hook_id": hook_id,
                "input": request.query,
                "context_before": request.context,
                "context_after": run_input.context,
                "result": result if result else "Hook执行成功，无返回值",
                "execution_time_ms": round(execution_time, 2),
                "message": "Hook测试执行成功"
            }

        except Exception as e:
            execution_time = (time.time() - start_time) * 1000
            logger.error(f"Hook执行失败: {e}", exc_info=True)

            return {
                "success": False,
                "hook_id": hook_id,
                "input": request.query,
                "context": request.context,
                "error": str(e),
                "execution_time_ms": round(execution_time, 2),
                "message": f"Hook测试执行失败: {str(e)}"
            }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"测试Hook失败: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"测试Hook失败: {str(e)}")
