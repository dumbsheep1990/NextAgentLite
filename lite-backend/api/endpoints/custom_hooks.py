"""
自定义Hooks管理API

提供Hook创建、编辑、删除和查询接口
"""

import json
import logging
from typing import List, Optional, Dict, Any
from uuid import UUID
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
import asyncpg

from core.database import get_db_pool

logger = logging.getLogger(__name__)

router = APIRouter(tags=["custom-hooks"])


# ==================== Pydantic Models ====================

class ToolBinding(BaseModel):
    """工具绑定配置"""
    step_id: str = Field(..., description="步骤ID")
    tool_id: str = Field(..., description="工具ID (如: api:service:tool)")
    tool_type: str = Field(..., description="工具类型 (api/mcp)")
    params: Dict[str, Any] = Field(default_factory=dict, description="工具参数")
    condition: Optional[Dict[str, Any]] = Field(None, description="执行条件")
    on_success: str = Field(default="continue", description="成功后动作")
    on_failure: str = Field(default="continue", description="失败后动作")


class CustomHookCreate(BaseModel):
    """创建自定义Hook请求"""
    hook_id: str = Field(..., min_length=3, max_length=100, description="Hook ID")
    hook_name: str = Field(..., min_length=1, max_length=200, description="Hook名称")
    hook_type: str = Field(..., description="Hook类型 (pre/post)")
    description: Optional[str] = None
    category: Optional[str] = None
    priority: int = Field(default=0, description="执行优先级")
    execution_mode: str = Field(default="sequential", description="执行模式")
    timeout_ms: int = Field(default=5000, description="超时时间(ms)")
    max_retries: int = Field(default=0, description="最大重试次数")
    tool_bindings: List[ToolBinding] = Field(default_factory=list, description="工具绑定")
    tags: List[str] = Field(default_factory=list, description="标签")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="元数据")


class CustomHookUpdate(BaseModel):
    """更新自定义Hook请求"""
    hook_name: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    priority: Optional[int] = None
    is_active: Optional[bool] = None
    execution_mode: Optional[str] = None
    timeout_ms: Optional[int] = None
    max_retries: Optional[int] = None
    tool_bindings: Optional[List[ToolBinding]] = None
    tags: Optional[List[str]] = None
    metadata: Optional[Dict[str, Any]] = None


class CustomHookResponse(BaseModel):
    """自定义Hook响应"""
    id: str
    hook_id: str
    hook_name: str
    hook_type: str
    description: Optional[str] = None
    category: Optional[str] = None
    is_system: bool
    is_active: bool
    priority: int
    execution_mode: str
    timeout_ms: int
    max_retries: int
    tool_bindings: List[Dict[str, Any]]
    tags: List[str]
    metadata: Dict[str, Any]
    created_at: str
    updated_at: str


class HookTemplateResponse(BaseModel):
    """Hook模板响应"""
    id: str
    template_id: str
    template_name: str
    description: Optional[str] = None
    template_type: Optional[str] = None
    hook_type: Optional[str] = None
    tool_bindings_template: List[Dict[str, Any]]
    tags: List[str]
    category: Optional[str] = None


# ==================== API Endpoints ====================

@router.get("/custom-hooks", response_model=List[CustomHookResponse])
async def list_custom_hooks(
    hook_type: Optional[str] = Query(None, description="Hook类型过滤 (pre/post)"),
    category: Optional[str] = Query(None, description="分类过滤"),
    is_active: Optional[bool] = Query(None, description="是否仅返回活跃的"),
    include_system: bool = Query(True, description="是否包含系统Hook"),
    pool: asyncpg.Pool = Depends(get_db_pool)
):
    """列出所有自定义Hooks

    Args:
        hook_type: Hook类型过滤
        category: 分类过滤
        is_active: 是否仅返回活跃的
        include_system: 是否包含系统Hook

    Returns:
        自定义Hook列表
    """
    try:
        # 构建查询条件
        conditions = []
        params = []
        param_count = 1

        if hook_type:
            conditions.append(f"hook_type = ${param_count}")
            params.append(hook_type)
            param_count += 1

        if category:
            conditions.append(f"category = ${param_count}")
            params.append(category)
            param_count += 1

        if is_active is not None:
            conditions.append(f"is_active = ${param_count}")
            params.append(is_active)
            param_count += 1

        if not include_system:
            conditions.append("is_system = false")

        where_clause = " AND ".join(conditions) if conditions else "TRUE"

        query = f"""
            SELECT
                id, hook_id, hook_name, hook_type, description, category,
                is_system, is_active, priority, execution_mode, timeout_ms,
                max_retries, tool_bindings, tags, metadata,
                created_at, updated_at
            FROM custom_hooks
            WHERE {where_clause}
            ORDER BY priority DESC, created_at DESC
        """

        async with pool.acquire() as conn:
            rows = await conn.fetch(query, *params)

        result = []
        for row in rows:
            # 解析JSONB字段
            tool_bindings_data = row['tool_bindings']
            if isinstance(tool_bindings_data, str):
                tool_bindings_data = json.loads(tool_bindings_data) if tool_bindings_data else []

            metadata_data = row['metadata']
            if isinstance(metadata_data, str):
                metadata_data = json.loads(metadata_data) if metadata_data else {}

            result.append(CustomHookResponse(
                id=str(row['id']),
                hook_id=row['hook_id'],
                hook_name=row['hook_name'],
                hook_type=row['hook_type'],
                description=row['description'],
                category=row['category'],
                is_system=row['is_system'],
                is_active=row['is_active'],
                priority=row['priority'],
                execution_mode=row['execution_mode'],
                timeout_ms=row['timeout_ms'],
                max_retries=row['max_retries'],
                tool_bindings=tool_bindings_data or [],
                tags=row['tags'] or [],
                metadata=metadata_data or {},
                created_at=row['created_at'].isoformat(),
                updated_at=row['updated_at'].isoformat()
            ))

        return result

    except Exception as e:
        logger.error(f"列出自定义Hooks失败: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"列出自定义Hooks失败: {str(e)}")


@router.get("/custom-hooks/{hook_id}", response_model=CustomHookResponse)
async def get_custom_hook(
    hook_id: str,
    pool: asyncpg.Pool = Depends(get_db_pool)
):
    """获取单个自定义Hook详情

    Args:
        hook_id: Hook ID

    Returns:
        Hook详情
    """
    try:
        query = """
            SELECT
                id, hook_id, hook_name, hook_type, description, category,
                is_system, is_active, priority, execution_mode, timeout_ms,
                max_retries, tool_bindings, tags, metadata,
                created_at, updated_at
            FROM custom_hooks
            WHERE hook_id = $1
        """

        async with pool.acquire() as conn:
            row = await conn.fetchrow(query, hook_id)

        if not row:
            raise HTTPException(status_code=404, detail=f"Hook未找到: {hook_id}")

        # 解析JSONB字段
        tool_bindings_data = row['tool_bindings']
        if isinstance(tool_bindings_data, str):
            tool_bindings_data = json.loads(tool_bindings_data) if tool_bindings_data else []

        metadata_data = row['metadata']
        if isinstance(metadata_data, str):
            metadata_data = json.loads(metadata_data) if metadata_data else {}

        return CustomHookResponse(
            id=str(row['id']),
            hook_id=row['hook_id'],
            hook_name=row['hook_name'],
            hook_type=row['hook_type'],
            description=row['description'],
            category=row['category'],
            is_system=row['is_system'],
            is_active=row['is_active'],
            priority=row['priority'],
            execution_mode=row['execution_mode'],
            timeout_ms=row['timeout_ms'],
            max_retries=row['max_retries'],
            tool_bindings=tool_bindings_data or [],
            tags=row['tags'] or [],
            metadata=metadata_data or {},
            created_at=row['created_at'].isoformat(),
            updated_at=row['updated_at'].isoformat()
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"获取Hook详情失败: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"获取Hook详情失败: {str(e)}")


@router.post("/custom-hooks", response_model=CustomHookResponse)
async def create_custom_hook(
    hook: CustomHookCreate,
    user_id: Optional[str] = None,  # TODO: 从认证中获取
    pool: asyncpg.Pool = Depends(get_db_pool)
):
    """创建自定义Hook

    Args:
        hook: Hook创建请求
        user_id: 创建用户ID

    Returns:
        创建的Hook
    """
    try:
        # 验证hook_type
        if hook.hook_type not in ['pre', 'post']:
            raise HTTPException(status_code=400, detail="hook_type必须是'pre'或'post'")

        # 转换tool_bindings和metadata为JSONB字符串，tags保持为列表
        tool_bindings_json = json.dumps([tb.dict() for tb in hook.tool_bindings])
        metadata_json = json.dumps(hook.metadata)

        query = """
            INSERT INTO custom_hooks (
                hook_id, hook_name, hook_type, description, category,
                created_by, is_system, is_active, priority, execution_mode,
                timeout_ms, max_retries, tool_bindings, tags, metadata
            ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13::jsonb, $14, $15::jsonb
            )
            RETURNING
                id, hook_id, hook_name, hook_type, description, category,
                is_system, is_active, priority, execution_mode, timeout_ms,
                max_retries, tool_bindings, tags, metadata,
                created_at, updated_at
        """

        async with pool.acquire() as conn:
            row = await conn.fetchrow(
                query,
                hook.hook_id,
                hook.hook_name,
                hook.hook_type,
                hook.description,
                hook.category,
                user_id,  # created_by
                False,     # is_system
                True,      # is_active
                hook.priority,
                hook.execution_mode,
                hook.timeout_ms,
                hook.max_retries,
                tool_bindings_json,
                hook.tags,  # text[] 数组，不需要JSON转换
                metadata_json
            )

        logger.info(f"✅ 创建自定义Hook成功: {hook.hook_id}")

        # 解析JSONB字段（如果是字符串则解析，如果已经是对象则直接使用）
        tool_bindings_data = row['tool_bindings']
        if isinstance(tool_bindings_data, str):
            tool_bindings_data = json.loads(tool_bindings_data) if tool_bindings_data else []

        metadata_data = row['metadata']
        if isinstance(metadata_data, str):
            metadata_data = json.loads(metadata_data) if metadata_data else {}

        return CustomHookResponse(
            id=str(row['id']),
            hook_id=row['hook_id'],
            hook_name=row['hook_name'],
            hook_type=row['hook_type'],
            description=row['description'],
            category=row['category'],
            is_system=row['is_system'],
            is_active=row['is_active'],
            priority=row['priority'],
            execution_mode=row['execution_mode'],
            timeout_ms=row['timeout_ms'],
            max_retries=row['max_retries'],
            tool_bindings=tool_bindings_data or [],
            tags=row['tags'] or [],
            metadata=metadata_data or {},
            created_at=row['created_at'].isoformat(),
            updated_at=row['updated_at'].isoformat()
        )

    except asyncpg.UniqueViolationError:
        raise HTTPException(status_code=400, detail=f"Hook ID已存在: {hook.hook_id}")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"创建自定义Hook失败: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"创建自定义Hook失败: {str(e)}")


@router.put("/custom-hooks/{hook_id}", response_model=CustomHookResponse)
async def update_custom_hook(
    hook_id: str,
    hook_update: CustomHookUpdate,
    pool: asyncpg.Pool = Depends(get_db_pool)
):
    """更新自定义Hook

    Args:
        hook_id: Hook ID
        hook_update: 更新数据

    Returns:
        更新后的Hook
    """
    try:
        # 检查Hook是否存在
        check_query = "SELECT is_system FROM custom_hooks WHERE hook_id = $1"
        async with pool.acquire() as conn:
            row = await conn.fetchrow(check_query, hook_id)

        if not row:
            raise HTTPException(status_code=404, detail=f"Hook未找到: {hook_id}")

        if row['is_system']:
            raise HTTPException(status_code=403, detail="系统Hook不可修改")

        # 构建更新语句
        update_fields = []
        params = []
        param_count = 1

        update_data = hook_update.dict(exclude_unset=True)

        for field, value in update_data.items():
            # 处理JSONB字段，需要转换为JSON字符串；tags是text[]数组，保持列表
            if field == 'tool_bindings' and value is not None:
                value = json.dumps([tb.dict() if isinstance(tb, BaseModel) else tb for tb in value])
                update_fields.append(f"{field} = ${param_count}::jsonb")
            elif field == 'metadata' and value is not None:
                value = json.dumps(value)
                update_fields.append(f"{field} = ${param_count}::jsonb")
            else:
                # tags保持为列表，其他字段正常处理
                update_fields.append(f"{field} = ${param_count}")

            params.append(value)
            param_count += 1

        if not update_fields:
            raise HTTPException(status_code=400, detail="没有提供更新字段")

        params.append(hook_id)

        query = f"""
            UPDATE custom_hooks
            SET {', '.join(update_fields)}
            WHERE hook_id = ${param_count}
            RETURNING
                id, hook_id, hook_name, hook_type, description, category,
                is_system, is_active, priority, execution_mode, timeout_ms,
                max_retries, tool_bindings, tags, metadata,
                created_at, updated_at
        """

        async with pool.acquire() as conn:
            row = await conn.fetchrow(query, *params)

        logger.info(f"✅ 更新自定义Hook成功: {hook_id}")

        # 解析JSONB字段
        tool_bindings_data = row['tool_bindings']
        if isinstance(tool_bindings_data, str):
            tool_bindings_data = json.loads(tool_bindings_data) if tool_bindings_data else []

        metadata_data = row['metadata']
        if isinstance(metadata_data, str):
            metadata_data = json.loads(metadata_data) if metadata_data else {}

        return CustomHookResponse(
            id=str(row['id']),
            hook_id=row['hook_id'],
            hook_name=row['hook_name'],
            hook_type=row['hook_type'],
            description=row['description'],
            category=row['category'],
            is_system=row['is_system'],
            is_active=row['is_active'],
            priority=row['priority'],
            execution_mode=row['execution_mode'],
            timeout_ms=row['timeout_ms'],
            max_retries=row['max_retries'],
            tool_bindings=tool_bindings_data or [],
            tags=row['tags'] or [],
            metadata=metadata_data or {},
            created_at=row['created_at'].isoformat(),
            updated_at=row['updated_at'].isoformat()
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"更新自定义Hook失败: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"更新自定义Hook失败: {str(e)}")


@router.delete("/custom-hooks/{hook_id}")
async def delete_custom_hook(
    hook_id: str,
    pool: asyncpg.Pool = Depends(get_db_pool)
):
    """删除自定义Hook

    Args:
        hook_id: Hook ID

    Returns:
        删除结果
    """
    try:
        # 检查是否是系统Hook
        check_query = "SELECT is_system FROM custom_hooks WHERE hook_id = $1"
        async with pool.acquire() as conn:
            row = await conn.fetchrow(check_query, hook_id)

        if not row:
            raise HTTPException(status_code=404, detail=f"Hook未找到: {hook_id}")

        if row['is_system']:
            raise HTTPException(status_code=403, detail="系统Hook不可删除")

        # 删除Hook
        delete_query = "DELETE FROM custom_hooks WHERE hook_id = $1"
        async with pool.acquire() as conn:
            await conn.execute(delete_query, hook_id)

        logger.info(f"✅ 删除自定义Hook成功: {hook_id}")

        return {"success": True, "message": f"Hook已删除: {hook_id}"}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"删除自定义Hook失败: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"删除自定义Hook失败: {str(e)}")


@router.get("/hook-templates", response_model=List[HookTemplateResponse])
async def list_hook_templates(
    hook_type: Optional[str] = Query(None, description="Hook类型过滤"),
    template_type: Optional[str] = Query(None, description="模板类型过滤"),
    pool: asyncpg.Pool = Depends(get_db_pool)
):
    """列出Hook模板

    Args:
        hook_type: Hook类型过滤
        template_type: 模板类型过滤

    Returns:
        Hook模板列表
    """
    try:
        conditions = ["is_active = true"]
        params = []
        param_count = 1

        if hook_type:
            conditions.append(f"hook_type = ${param_count}")
            params.append(hook_type)
            param_count += 1

        if template_type:
            conditions.append(f"template_type = ${param_count}")
            params.append(template_type)
            param_count += 1

        where_clause = " AND ".join(conditions)

        query = f"""
            SELECT
                id, template_id, template_name, description,
                template_type, hook_type, tool_bindings_template,
                tags, category
            FROM hook_tool_templates
            WHERE {where_clause}
            ORDER BY template_name
        """

        async with pool.acquire() as conn:
            rows = await conn.fetch(query, *params)

        return [
            HookTemplateResponse(
                id=str(row['id']),
                template_id=row['template_id'],
                template_name=row['template_name'],
                description=row['description'],
                template_type=row['template_type'],
                hook_type=row['hook_type'],
                tool_bindings_template=row['tool_bindings_template'] or [],
                tags=row['tags'] or [],
                category=row['category']
            )
            for row in rows
        ]

    except Exception as e:
        logger.error(f"列出Hook模板失败: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"列出Hook模板失败: {str(e)}")


@router.post("/custom-hooks/from-template/{template_id}", response_model=CustomHookResponse)
async def create_hook_from_template(
    template_id: str,
    hook_id: str = Query(..., description="新Hook的ID"),
    hook_name: str = Query(..., description="新Hook的名称"),
    user_id: Optional[str] = None,
    pool: asyncpg.Pool = Depends(get_db_pool)
):
    """从模板创建Hook

    Args:
        template_id: 模板ID
        hook_id: 新Hook ID
        hook_name: 新Hook名称
        user_id: 创建用户ID

    Returns:
        创建的Hook
    """
    try:
        # 获取模板
        template_query = """
            SELECT
                template_name, description, template_type, hook_type,
                tool_bindings_template, category
            FROM hook_tool_templates
            WHERE template_id = $1 AND is_active = true
        """

        async with pool.acquire() as conn:
            template = await conn.fetchrow(template_query, template_id)

        if not template:
            raise HTTPException(status_code=404, detail=f"模板未找到: {template_id}")

        # 创建Hook
        create_hook = CustomHookCreate(
            hook_id=hook_id,
            hook_name=hook_name,
            hook_type=template['hook_type'],
            description=f"基于模板 '{template['template_name']}' 创建",
            category=template['category'],
            tool_bindings=[ToolBinding(**tb) for tb in template['tool_bindings_template']]
        )

        return await create_custom_hook(create_hook, user_id, pool)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"从模板创建Hook失败: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"从模板创建Hook失败: {str(e)}")


class HookConfigSaveRequest(BaseModel):
    """保存Hook配置请求"""
    hook_id: str = Field(..., description="Hook ID")
    config_params: Dict[str, Any] = Field(default_factory=dict, description="配置参数")
    tool_bindings: List[ToolBinding] = Field(default_factory=list, description="工具绑定")
    user_id: Optional[str] = Field(None, description="用户ID")
    agent_id: Optional[str] = Field(None, description="Agent ID")


@router.post("/custom-hooks/configure")
async def save_hook_configuration(
    config_request: HookConfigSaveRequest,
    pool: asyncpg.Pool = Depends(get_db_pool)
):
    """保存Hook配置

    对于系统内置的Hook，将配置保存到custom_hooks表中
    对于已存在的自定义Hook，更新其配置

    Args:
        config_request: Hook配置请求

    Returns:
        保存结果
    """
    try:
        hook_id = config_request.hook_id

        # 检查hook是否已存在于custom_hooks表中
        check_query = "SELECT id, is_system FROM custom_hooks WHERE hook_id = $1"
        async with pool.acquire() as conn:
            existing = await conn.fetchrow(check_query, hook_id)

        # 准备工具绑定数据
        tool_bindings_json = json.dumps([tb.dict() for tb in config_request.tool_bindings])

        # 准备metadata，将config_params保存到metadata中
        metadata = {
            "config_params": config_request.config_params,
            "user_id": config_request.user_id,
            "agent_id": config_request.agent_id,
            "configured_at": datetime.now().isoformat()
        }
        metadata_json = json.dumps(metadata)

        if existing:
            # Hook已存在，更新配置
            update_query = """
                UPDATE custom_hooks
                SET
                    tool_bindings = $1::jsonb,
                    metadata = $2::jsonb,
                    updated_at = NOW()
                WHERE hook_id = $3
                RETURNING id
            """

            async with pool.acquire() as conn:
                result = await conn.fetchrow(update_query, tool_bindings_json, metadata_json, hook_id)

            logger.info(f"✅ 更新Hook配置成功: {hook_id}")

            return {
                "success": True,
                "message": f"Hook配置已更新: {hook_id}",
                "hook_id": hook_id,
                "config_id": str(result['id'])
            }
        else:
            # Hook不存在于custom_hooks表，为系统Hook创建配置记录
            # 需要从pre_hooks_metadata中获取hook的基本信息
            from service.hooks.pre_hooks_metadata import PRE_HOOKS_METADATA

            hook_meta = PRE_HOOKS_METADATA.get(hook_id)
            if not hook_meta:
                raise HTTPException(status_code=404, detail=f"Hook未找到: {hook_id}")

            insert_query = """
                INSERT INTO custom_hooks (
                    hook_id, hook_name, hook_type, description, category,
                    is_system, is_active, priority,
                    tool_bindings, metadata,
                    created_by
                ) VALUES (
                    $1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb, $10::jsonb, $11
                )
                RETURNING id
            """

            async with pool.acquire() as conn:
                result = await conn.fetchrow(
                    insert_query,
                    hook_id,
                    hook_meta.get('name', hook_id),
                    'pre',  # 默认为pre，如果是post需要调整
                    hook_meta.get('description', ''),
                    hook_meta.get('category', 'custom'),
                    True,  # is_system = True 表示这是系统Hook的配置
                    True,  # is_active
                    hook_meta.get('priority', 50),
                    tool_bindings_json,
                    metadata_json,
                    config_request.user_id
                )

            logger.info(f"✅ 创建Hook配置成功: {hook_id}")

            return {
                "success": True,
                "message": f"Hook配置已创建: {hook_id}",
                "hook_id": hook_id,
                "config_id": str(result['id'])
            }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"保存Hook配置失败: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"保存Hook配置失败: {str(e)}")


@router.get("/custom-hooks/{hook_id}/configuration")
async def get_hook_configuration(
    hook_id: str,
    user_id: Optional[str] = Query(None, description="用户ID"),
    agent_id: Optional[str] = Query(None, description="Agent ID"),
    pool: asyncpg.Pool = Depends(get_db_pool)
):
    """获取Hook配置

    Args:
        hook_id: Hook ID
        user_id: 用户ID（可选，用于获取用户特定配置）
        agent_id: Agent ID（可选，用于获取Agent特定配置）

    Returns:
        Hook配置
    """
    try:
        query = """
            SELECT
                hook_id, tool_bindings, metadata
            FROM custom_hooks
            WHERE hook_id = $1
        """

        async with pool.acquire() as conn:
            row = await conn.fetchrow(query, hook_id)

        if not row:
            # 如果没有配置，返回空配置
            return {
                "hook_id": hook_id,
                "config_params": {},
                "tool_bindings": [],
                "configured": False
            }

        # 解析JSONB字段
        tool_bindings_data = row['tool_bindings']
        if isinstance(tool_bindings_data, str):
            tool_bindings_data = json.loads(tool_bindings_data) if tool_bindings_data else []

        metadata_data = row['metadata']
        if isinstance(metadata_data, str):
            metadata_data = json.loads(metadata_data) if metadata_data else {}

        return {
            "hook_id": hook_id,
            "config_params": metadata_data.get('config_params', {}),
            "tool_bindings": tool_bindings_data or [],
            "configured": True,
            "user_id": metadata_data.get('user_id'),
            "agent_id": metadata_data.get('agent_id'),
            "configured_at": metadata_data.get('configured_at')
        }

    except Exception as e:
        logger.error(f"获取Hook配置失败: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"获取Hook配置失败: {str(e)}")
