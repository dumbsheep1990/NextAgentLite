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
    mcp_integration_service, 
    MCPServerConfig, 
    MCPToolCallRequest,
    MCPToolCallResponse
)
from db.database import get_async_session
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from models.mcp_models import MCPServer, MCPTool, MCPResource, MCPToolCall

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

# 初始化端点
@router.post("/initialize")
async def initialize_mcp_service():
    """初始化MCP集成服务"""
    try:
        success = await mcp_integration_service.initialize()
        if success:
            return {"message": "MCP集成服务初始化成功", "status": "success"}
        else:
            raise HTTPException(status_code=500, detail="MCP集成服务初始化失败")
    except Exception as e:
        logger.error(f"初始化MCP服务失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# 服务器管理端点
@router.post("/servers/register", response_model=Dict[str, str])
async def register_server(request: ServerRegistrationRequest):
    """注册新的MCP服务器"""
    try:
        config = MCPServerConfig(
            name=request.name,
            display_name=request.display_name,
            description=request.description,
            server_type=request.server_type,
            connection_config=request.connection_config,
            transport_type=request.transport_type,
            metadata=request.metadata
        )
        
        success = await mcp_integration_service.register_server(config)
        if success:
            return {"message": f"服务器 {request.name} 注册成功", "status": "success"}
        else:
            raise HTTPException(status_code=400, detail="服务器注册失败")
            
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"注册服务器失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/servers", response_model=List[ServerResponse])
async def list_servers():
    """获取所有MCP服务器列表"""
    try:
        servers = await mcp_integration_service.get_server_status()
        return [
            ServerResponse(
                id=server["id"],
                name=server["name"],
                display_name=server["display_name"],
                description=server.get("description"),
                server_type=server["server_type"],
                transport_type=server["transport_type"],
                is_enabled=server["is_enabled"],
                health_status=server["health_status"],
                last_health_check=server["last_health_check"],
                created_at=server.get("created_at", "")
            )
            for server in servers
        ]
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
async def list_tools(category: Optional[str] = None):
    """获取可用工具列表"""
    try:
        tools = await mcp_integration_service.get_available_tools(category=category)
        return [
            ToolResponse(
                id=tool["id"],
                name=tool["name"],
                display_name=tool["display_name"],
                description=tool["description"],
                category=tool["category"],
                tags=tool["tags"] or [],
                schema=tool["schema"],
                usage_count=tool["usage_count"],
                last_used_at=tool["last_used_at"],
                is_enabled=True
            )
            for tool in tools
        ]
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
async def call_tool(request: MCPToolCallRequest):
    """调用MCP工具"""
    try:
        response = await mcp_integration_service.call_tool(request)
        return response
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
        # 统计服务器数量
        servers_result = await session.execute(select(MCPServer))
        servers = servers_result.scalars().all()
        total_servers = len(servers)
        active_servers = len([s for s in servers if s.is_enabled and s.health_status == "healthy"])
        
        # 统计工具数量
        tools_result = await session.execute(select(MCPTool))
        tools = tools_result.scalars().all()
        total_tools = len(tools)
        active_tools = len([t for t in tools if t.is_enabled])
        
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
        
        # 检查网关状态
        gateway_status = "healthy"
        try:
            await mcp_integration_service._check_gateway_health()
        except:
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
async def sync_tools_and_resources(background_tasks: BackgroundTasks):
    """同步所有工具和资源"""
    try:
        background_tasks.add_task(mcp_integration_service._sync_tools_and_resources)
        return {"message": "同步任务已启动", "status": "started"}
    except Exception as e:
        logger.error(f"启动同步任务失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/servers/{server_id}/sync")
async def sync_server_tools(server_id: str, background_tasks: BackgroundTasks, session: AsyncSession = Depends(get_async_session)):
    """同步特定服务器的工具和资源"""
    try:
        result = await session.execute(
            select(MCPServer).where(MCPServer.id == uuid.UUID(server_id))
        )
        server = result.scalar_one_or_none()
        
        if not server:
            raise HTTPException(status_code=404, detail="服务器不存在")
        
        background_tasks.add_task(
            mcp_integration_service._sync_server_tools_and_resources,
            server.name
        )
        
        return {"message": f"服务器 {server.name} 同步任务已启动", "status": "started"}
        
    except ValueError:
        raise HTTPException(status_code=400, detail="无效的服务器ID")
    except Exception as e:
        logger.error(f"启动服务器同步任务失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# 健康检查端点
@router.get("/health")
async def health_check():
    """MCP集成服务健康检查"""
    try:
        if not mcp_integration_service._initialized:
            return {"status": "not_initialized", "message": "服务未初始化"}
        
        # 检查Gateway连接
        await mcp_integration_service._check_gateway_health()
        
        return {
            "status": "healthy",
            "message": "MCP集成服务运行正常",
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        return {
            "status": "unhealthy",
            "message": f"服务异常: {str(e)}",
            "timestamp": datetime.now().isoformat()
        }
