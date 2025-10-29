"""
MCP Context Forge 集成API端点
"""
from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
import uuid
from datetime import datetime

from core.logger import logger
from service.mcp_integration_service import (
    # 仅复用请求/响应模型，逻辑改为走 Unla
    MCPToolCallRequest,
    MCPToolCallResponse,
)
import os
from db.database import get_async_session
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from models.mcp_models import MCPServer, MCPTool, MCPResource, MCPToolCall, UnlaRouterMap
from service.unla_integration_service import unla_integration_service
from service.unla_client import unla_client
from fastapi import UploadFile, File, Form

router = APIRouter(prefix="/mcp", tags=["MCP Integration"])

# 数据模型
class ServerRegistrationRequest(BaseModel):
    """服务器注册请求"""
    name: str = Field(..., description="服务器名称")
    display_name: str = Field(..., description="显示名称")
    description: Optional[str] = Field(None, description="描述")
    server_type: str = Field("external", description="服务器类型")
    connection_config: Dict[str, Any] = Field(..., description="连接配置")
    transport_type: str = Field("stdio", description="传输类型")
    metadata: Optional[Dict[str, Any]] = Field(None, description="元数据")

class ServerResponse(BaseModel):
    """服务器响应"""
    id: str
    name: str
    display_name: str
    description: Optional[str]
    server_type: str
    transport_type: str
    is_enabled: bool
    health_status: str
    last_health_check: Optional[str]
    created_at: str

class ToolResponse(BaseModel):
    """工具响应"""
    id: str
    name: str
    display_name: str
    description: Optional[str]
    category: Optional[str]
    tags: List[str]
    schema: Dict[str, Any]
    usage_count: int
    last_used_at: Optional[str]
    is_enabled: bool

class ToolCallHistoryResponse(BaseModel):
    """工具调用历史响应"""
    id: str
    tool_name: str
    session_id: Optional[str]
    call_status: str
    duration_ms: Optional[int]
    error_message: Optional[str]
    created_at: str
    completed_at: Optional[str]

class SystemStatusResponse(BaseModel):
    """系统状态响应"""
    gateway_status: str
    total_servers: int
    active_servers: int
    total_tools: int
    active_tools: int
    recent_calls: int
    avg_response_time: float


# 额外的 Unla 集成端点
@router.post("/openapi/import")
async def import_openapi_to_unla(
    file: UploadFile = File(...),
    tenant: Optional[str] = Form(None),
    prefix: Optional[str] = Form(None),
):
    """导入 OpenAPI 规范至 Unla 并触发同步，然后刷新本地镜像。

    前端表单应包含文件（json/yaml）、tenant（可选，默认default）、prefix（可选）。
    """
    content = await file.read()
    try:
        await unla_integration_service.import_openapi(content, file.filename, tenant_name=tenant, prefix=prefix)
        await unla_integration_service.sync_gateway()
        stats = await unla_integration_service.sync_configs_to_db()
        return {"message": "OpenAPI导入成功", "sync": stats}
    except Exception as e:
        logger.error(f"OpenAPI 导入失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/unla/sync")
async def unla_sync_configs():
    """从 Unla 同步所有路由配置到本地数据库。"""
    try:
        await unla_integration_service.sync_gateway()
        stats = await unla_integration_service.sync_configs_to_db()
        return {"message": "同步完成", "sync": stats}
    except Exception as e:
        logger.error(f"Unla 同步失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/unla/routers")
async def list_unla_routers(session: AsyncSession = Depends(get_async_session)):
    """列出已同步的 Unla 路由映射。"""
    try:
        from models.mcp_models import UnlaRouterMap
        result = await session.execute(select(UnlaRouterMap))
        rows = result.scalars().all()
        return [
            {
                "id": str(r.id),
                "tenant": r.tenant,
                "server_name": r.server_name,
                "router_prefix": r.router_prefix,
                "proto_type": r.proto_type,
                "mcp_endpoint": r.mcp_endpoint,
                "sse_endpoint": r.sse_endpoint,
                "is_active": r.is_active,
                "version": r.version,
                "last_synced_at": r.last_synced_at.isoformat() if r.last_synced_at else None,
                "created_at": r.created_at.isoformat() if r.created_at else None,
                "updated_at": r.updated_at.isoformat() if r.updated_at else None,
            }
            for r in rows
        ]
    except Exception as e:
        logger.error(f"获取 Unla 路由失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# 初始化端点
@router.post("/initialize")
async def initialize_mcp_service():
    """初始化（对 Unla 执行同步并刷新本地镜像）。"""
    try:
        await unla_integration_service.sync_gateway()
        stats = await unla_integration_service.sync_configs_to_db()
        return {"message": "Unla 同步完成", "status": "success", "sync": stats}
    except Exception as e:
        logger.error(f"初始化(同步)失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# 服务器管理端点
@router.post("/servers/register", response_model=Dict[str, str])
async def register_server(_request: ServerRegistrationRequest):
    """Unla 模式下不支持通过此端点注册，改用 OpenAPI 导入或直接编辑配置。
    """
    raise HTTPException(status_code=501, detail="Not supported in Unla mode. Use /api/v1/mcp/openapi/import")

@router.get("/servers", response_model=List[ServerResponse])
async def list_servers(session: AsyncSession = Depends(get_async_session)):
    """基于 Unla 路由映射返回服务器列表（按 server_name 聚合）。"""
    try:
        result = await session.execute(select(UnlaRouterMap))
        rows = result.scalars().all()
        # 聚合为服务器级别
        grouped = {}
        for r in rows:
            g = grouped.setdefault(r.server_name, {"routers": [], "proto": r.proto_type, "tenant": r.tenant})
            g["routers"].append(r.router_prefix)
        # 返回最小字段
        data: List[ServerResponse] = []
        for name, info in grouped.items():
            data.append(ServerResponse(
                id=name,  # 使用name作稳定ID（仅前端展示）
                name=name,
                display_name=name,
                description=None,
                server_type="unla",
                transport_type=info.get("proto", "http"),
                is_enabled=True,
                health_status="unknown",
                last_health_check=None,
                created_at=""
            ))
        return data
    except Exception as e:
        logger.error(f"获取服务器列表失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/servers/{server_id}")
async def get_server(server_id: str, session: AsyncSession = Depends(get_async_session)):
    """获取特定服务器详情"""
    try:
        result = await session.execute(
            select(MCPServer).where(MCPServer.id == uuid.UUID(server_id))
        )
        server = result.scalar_one_or_none()
        
        if not server:
            raise HTTPException(status_code=404, detail="服务器不存在")
        
        return {
            "id": str(server.id),
            "name": server.name,
            "display_name": server.display_name,
            "description": server.description,
            "server_type": server.server_type,
            "connection_config": server.connection_config,
            "transport_type": server.transport_type,
            "is_enabled": server.is_enabled,
            "health_status": server.health_status,
            "last_health_check": server.last_health_check.isoformat() if server.last_health_check else None,
            "metadata": server.server_metadata,
            "created_at": server.created_at.isoformat(),
            "updated_at": server.updated_at.isoformat()
        }
    except ValueError:
        raise HTTPException(status_code=400, detail="无效的服务器ID")
    except Exception as e:
        logger.error(f"获取服务器详情失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/servers/{server_id}")
async def delete_server(server_id: str, session: AsyncSession = Depends(get_async_session)):
    """删除MCP服务器"""
    try:
        result = await session.execute(
            select(MCPServer).where(MCPServer.id == uuid.UUID(server_id))
        )
        server = result.scalar_one_or_none()
        
        if not server:
            raise HTTPException(status_code=404, detail="服务器不存在")
        
        await session.delete(server)
        await session.commit()
        
        return {"message": f"服务器 {server.name} 删除成功"}
        
    except ValueError:
        raise HTTPException(status_code=400, detail="无效的服务器ID")
    except Exception as e:
        logger.error(f"删除服务器失败: {e}")
        await session.rollback()
        raise HTTPException(status_code=500, detail=str(e))

# 工具管理端点
@router.get("/tools", response_model=List[ToolResponse])
async def list_tools(router_prefix: Optional[str] = None, category: Optional[str] = None):
    """从 Unla 读取可用工具列表。

    - 指定 router_prefix 时：仅返回该前缀下的工具。
    - 未指定时：遍历已同步的若干路由，聚合工具（可能较慢）。
    """
    from service.unla_client import unla_client
    tools_acc: Dict[str, Dict[str, Any]] = {}

    async def fetch_for_prefix(prefix: str):
        sid = await unla_client.initialize(prefix)
        try:
            data = await unla_client.list_tools(prefix, sid)
        finally:
            try:
                await unla_client.close(prefix, sid)
            except Exception:
                pass
        # data: { result: { tools: [ {name, description, inputSchema...} ] } }
        result = (data or {}).get("result") or {}
        for t in result.get("tools", []) or []:
            name = t.get("name")
            if not name:
                continue
            key = f"{prefix}:{name}"
            tools_acc[key] = {
                "id": key,
                "name": name,
                "display_name": t.get("name"),
                "description": t.get("description"),
                "category": None,
                "tags": [],
                "schema": {"input": t.get("inputSchema"), "output": t.get("outputSchema")},
                "usage_count": 0,
                "last_used_at": None,
            }

    try:
        if router_prefix:
            await fetch_for_prefix(router_prefix)
        else:
            # 聚合全部路由（可按需限制）
            # 为避免性能问题，此处限制最多取 5 个路由
            prefixes: List[str] = []
            # 从路由映射读取
            # 无需会话，直接按少量取用
            async with get_async_session() as session:
                r = await session.execute(select(UnlaRouterMap))
                rows = r.scalars().all()
                for i, row in enumerate(rows):
                    if i >= 5:
                        break
                    prefixes.append(row.router_prefix)
            for p in prefixes:
                await fetch_for_prefix(p)

        resp: List[ToolResponse] = []
        for v in tools_acc.values():
            resp.append(ToolResponse(
                id=v["id"],
                name=v["name"],
                display_name=v["display_name"],
                description=v["description"],
                category=v["category"],
                tags=v["tags"],
                schema=v["schema"],
                usage_count=v["usage_count"],
                last_used_at=v["last_used_at"],
                is_enabled=True,
            ))
        return resp
    except Exception as e:
        logger.error(f"获取工具列表失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/tools/{tool_id}")
async def get_tool(tool_id: str, session: AsyncSession = Depends(get_async_session)):
    """获取特定工具详情"""
    try:
        result = await session.execute(
            select(MCPTool).where(MCPTool.id == uuid.UUID(tool_id))
        )
        tool = result.scalar_one_or_none()
        
        if not tool:
            raise HTTPException(status_code=404, detail="工具不存在")
        
        return {
            "id": str(tool.id),
            "server_id": str(tool.server_id),
            "tool_name": tool.tool_name,
            "display_name": tool.display_name,
            "description": tool.description,
            "tool_schema": tool.tool_schema,
            "category": tool.category,
            "tags": tool.tags,
            "is_enabled": tool.is_enabled,
            "usage_count": tool.usage_count,
            "last_used_at": tool.last_used_at.isoformat() if tool.last_used_at else None,
            "performance_metrics": tool.performance_metrics,
            "created_at": tool.created_at.isoformat(),
            "updated_at": tool.updated_at.isoformat()
        }
    except ValueError:
        raise HTTPException(status_code=400, detail="无效的工具ID")
    except Exception as e:
        logger.error(f"获取工具详情失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# 工具调用端点
@router.post("/tools/call", response_model=MCPToolCallResponse)
async def call_tool(request: MCPToolCallRequest, session: AsyncSession = Depends(get_async_session)):
    """调用MCP工具"""
    try:
        # 优先使用 Unla 统一网关（当提供 router_prefix 时）
        if request.router_prefix:
            # 1) 建立会话
            session_id = await unla_client.initialize(request.router_prefix)
            # 2) 调用工具
            result = await unla_client.call_tool(request.router_prefix, session_id, request.tool_name, request.arguments)
            # 3) 关闭会话
            try:
                await unla_client.close(request.router_prefix, session_id)
            except Exception:
                pass

            # 记录调用日志（尽力而为，工具/服务器可能尚未镜像在本地）
            try:
                from models.mcp_models import MCPTool, MCPServer, UnlaRouterMap
                # 根据前缀推断 server_name
                r = await session.execute(select(UnlaRouterMap).where(UnlaRouterMap.router_prefix == request.router_prefix))
                mapping = r.scalar_one_or_none()
                tool_obj = None
                if mapping:
                    srv_q = await session.execute(select(MCPServer).where(MCPServer.name == mapping.server_name))
                    srv = srv_q.scalar_one_or_none()
                    if srv:
                        t_q = await session.execute(select(MCPTool).where(MCPTool.server_id == srv.id, MCPTool.tool_name == request.tool_name))
                        tool_obj = t_q.scalar_one_or_none()
                if tool_obj:
                    from models.mcp_models import MCPToolCall
                    from datetime import datetime
                    call_log = MCPToolCall(
                        tool_id=tool_obj.id,
                        session_id=session_id,
                        user_id=request.user_id,
                        call_request={"tool": request.tool_name, "arguments": request.arguments},
                        call_response=result,
                        call_status="success",
                        duration_ms=None,
                        completed_at=datetime.now()
                    )
                    session.add(call_log)
                    await session.commit()
            except Exception as log_err:
                logger.warning(f"记录Unla工具调用日志失败: {log_err}")

            return MCPToolCallResponse(success=True, result=result)

        # 未指定路由前缀：尝试使用唯一路由；否则要求前端指定
        pfx: str = ""
        r = await session.execute(select(UnlaRouterMap))
        rows = r.scalars().all()
        unique_prefixes = sorted(set(row.router_prefix for row in rows))
        if len(unique_prefixes) == 1:
            pfx = unique_prefixes[0]
        else:
            raise HTTPException(status_code=400, detail="router_prefix 缺失且存在多个路由，请指定 router_prefix")

        session_id = await unla_client.initialize(pfx)
        try:
            result = await unla_client.call_tool(pfx, session_id, request.tool_name, request.arguments)
        finally:
            try:
                await unla_client.close(pfx, session_id)
            except Exception:
                pass
        return MCPToolCallResponse(success=True, result=result)
    except Exception as e:
        logger.error(f"调用工具失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/tools/{tool_id}/calls", response_model=List[ToolCallHistoryResponse])
async def get_tool_call_history(
    tool_id: str, 
    limit: int = 50,
    session: AsyncSession = Depends(get_async_session)
):
    """获取工具调用历史"""
    try:
        result = await session.execute(
            select(MCPToolCall)
            .where(MCPToolCall.tool_id == uuid.UUID(tool_id))
            .order_by(MCPToolCall.created_at.desc())
            .limit(limit)
        )
        calls = result.scalars().all()
        
        return [
            ToolCallHistoryResponse(
                id=str(call.id),
                tool_name=call.tool.tool_name if call.tool else "Unknown",
                session_id=call.session_id,
                call_status=call.call_status,
                duration_ms=call.duration_ms,
                error_message=call.error_message,
                created_at=call.created_at.isoformat(),
                completed_at=call.completed_at.isoformat() if call.completed_at else None
            )
            for call in calls
        ]
    except ValueError:
        raise HTTPException(status_code=400, detail="无效的工具ID")
    except Exception as e:
        logger.error(f"获取工具调用历史失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# 资源管理端点
@router.get("/resources")
async def list_resources(session: AsyncSession = Depends(get_async_session)):
    """获取可用资源列表"""
    try:
        result = await session.execute(
            select(MCPResource).where(MCPResource.is_enabled == True)
        )
        resources = result.scalars().all()
        
        return [
            {
                "id": str(resource.id),
                "server_id": str(resource.server_id),
                "resource_uri": resource.resource_uri,
                "resource_name": resource.resource_name,
                "resource_type": resource.resource_type,
                "description": resource.description,
                "mime_type": resource.mime_type,
                "access_count": resource.access_count,
                "last_accessed_at": resource.last_accessed_at.isoformat() if resource.last_accessed_at else None,
                "created_at": resource.created_at.isoformat()
            }
            for resource in resources
        ]
    except Exception as e:
        logger.error(f"获取资源列表失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# 系统状态端点
@router.get("/status", response_model=SystemStatusResponse)
async def get_system_status(session: AsyncSession = Depends(get_async_session)):
    """获取MCP系统状态"""
    try:
        # 统计服务器数量（来源于 UnlaRouterMap）
        routers_result = await session.execute(select(UnlaRouterMap))
        routers = routers_result.scalars().all()
        server_names = set(r.server_name for r in routers)
        total_servers = len(server_names)
        active_servers = total_servers  # 简化为活动

        # 工具数量：此处不做实时聚合，返回0，前端使用路由面板测试
        total_tools = 0
        active_tools = 0

        # 统计最近调用数量（最近24小时）
        from sqlalchemy import func
        from datetime import timedelta
        
        recent_calls_result = await session.execute(
            select(func.count(MCPToolCall.id))
            .where(MCPToolCall.created_at >= datetime.now() - timedelta(days=1))
        )
        recent_calls = recent_calls_result.scalar() or 0
        
        # 计算平均响应时间
        avg_time_result = await session.execute(
            select(func.avg(MCPToolCall.duration_ms))
            .where(MCPToolCall.call_status == "success")
            .where(MCPToolCall.duration_ms.isnot(None))
        )
        avg_response_time = float(avg_time_result.scalar() or 0)
        
        # 检查 Unla 网关状态
        gateway_status = "unhealthy"
        try:
            import httpx
            url = os.getenv("UNLA_GATEWAY_URL", "http://localhost:5235").rstrip("/") + "/health_check"
            async with httpx.AsyncClient(timeout=5.0) as client:
                resp = await client.get(url)
                if resp.status_code == 200:
                    gateway_status = "healthy"
        except Exception:
            gateway_status = "unhealthy"
        
        return SystemStatusResponse(
            gateway_status=gateway_status,
            total_servers=total_servers,
            active_servers=active_servers,
            total_tools=total_tools,
            active_tools=active_tools,
            recent_calls=recent_calls,
            avg_response_time=avg_response_time
        )
        
    except Exception as e:
        logger.error(f"获取系统状态失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# 同步端点
@router.post("/sync")
async def sync_tools_and_resources(_background_tasks: BackgroundTasks):
    """触发 Unla 同步，并刷新本地镜像。"""
    try:
        await unla_integration_service.sync_gateway()
        stats = await unla_integration_service.sync_configs_to_db()
        return {"message": "同步完成", "status": "done", "sync": stats}
    except Exception as e:
        logger.error(f"启动同步任务失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/servers/{server_id}/sync")
async def sync_server_tools(_server_id: str, _background_tasks: BackgroundTasks, _session: AsyncSession = Depends(get_async_session)):
    """同步特定服务器的工具和资源"""
    try:
        raise HTTPException(status_code=501, detail="Not supported in Unla mode")
        
    except ValueError:
        raise HTTPException(status_code=400, detail="无效的服务器ID")
    except Exception as e:
        logger.error(f"启动服务器同步任务失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# 健康检查端点
@router.get("/health")
async def health_check():
    """Unla 网关健康检查。"""
    try:
        import httpx
        url = os.getenv("UNLA_GATEWAY_URL", "http://localhost:5235").rstrip("/") + "/health_check"
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.get(url)
            if resp.status_code == 200:
                return {"status": "healthy", "message": "Unla gateway OK", "timestamp": datetime.now().isoformat()}
            return {"status": "unhealthy", "message": f"status {resp.status_code}", "timestamp": datetime.now().isoformat()}
    except Exception as e:
        return {"status": "unhealthy", "message": f"异常: {str(e)}", "timestamp": datetime.now().isoformat()}
