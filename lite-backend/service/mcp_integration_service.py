"""
MCP Context Forge 集成服务
负责管理MCP服务器、工具和资源的集成
"""
import asyncio
import json
import uuid
from datetime import datetime
from typing import Dict, List, Optional, Any, Union
from pathlib import Path

import httpx
from sqlalchemy import select, update, delete
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel, Field

from core.logger import logger
from db.database import get_async_session
from models.mcp_models import (
    MCPServer, MCPTool, MCPResource, MCPPrompt, 
    MCPToolCall, MCPGatewayConfig
)

# MCP相关的数据模型
class MCPServerConfig(BaseModel):
    """MCP服务器配置"""
    name: str
    display_name: str
    description: Optional[str] = None
    server_type: str = "external"  # external, internal, virtual
    connection_config: Dict[str, Any]
    transport_type: str = "stdio"  # stdio, http, sse, websocket
    metadata: Optional[Dict[str, Any]] = None

class MCPToolSchema(BaseModel):
    """MCP工具Schema"""
    name: str
    description: str
    inputSchema: Dict[str, Any]
    outputSchema: Optional[Dict[str, Any]] = None

class MCPToolCallRequest(BaseModel):
    """MCP工具调用请求"""
    tool_name: str
    arguments: Dict[str, Any]
    session_id: Optional[str] = None
    user_id: Optional[int] = None

class MCPToolCallResponse(BaseModel):
    """MCP工具调用响应"""
    success: bool
    result: Optional[Any] = None
    error: Optional[str] = None
    duration_ms: Optional[int] = None

class MCPIntegrationService:
    """MCP Context Forge 集成服务"""
    
    def __init__(self):
        self.gateway_url = "http://localhost:8000"  # MCP Gateway地址
        self.client = httpx.AsyncClient(timeout=30.0)
        self._initialized = False
    
    async def initialize(self) -> bool:
        """初始化MCP集成服务"""
        try:
            # 检查MCP Gateway是否运行
            await self._check_gateway_health()
            
            # 加载现有服务器配置
            await self._load_server_configs()
            
            # 同步工具和资源
            await self._sync_tools_and_resources()
            
            self._initialized = True
            logger.info("MCP集成服务初始化成功")
            return True
            
        except Exception as e:
            logger.error(f"MCP集成服务初始化失败: {e}")
            return False
    
    async def _check_gateway_health(self) -> bool:
        """检查MCP Gateway健康状态"""
        try:
            response = await self.client.get(f"{self.gateway_url}/health")
            if response.status_code == 200:
                logger.info("MCP Gateway运行正常")
                return True
            else:
                raise Exception(f"Gateway返回状态码: {response.status_code}")
        except Exception as e:
            logger.error(f"MCP Gateway健康检查失败: {e}")
            raise
    
    async def _load_server_configs(self):
        """加载数据库中的服务器配置"""
        async with get_async_session() as session:
            result = await session.execute(
                select(MCPServer).where(MCPServer.is_enabled == True)
            )
            servers = result.scalars().all()
            
            for server in servers:
                try:
                    await self._register_server_to_gateway(server)
                    logger.info(f"服务器 {server.name} 注册到Gateway成功")
                except Exception as e:
                    logger.error(f"服务器 {server.name} 注册失败: {e}")
    
    async def _register_server_to_gateway(self, server: MCPServer):
        """将服务器注册到MCP Gateway"""
        registration_data = {
            "name": server.name,
            "display_name": server.display_name,
            "description": server.description,
            "server_type": server.server_type,
            "connection_config": server.connection_config,
            "transport_type": server.transport_type,
            "metadata": server.server_metadata or {}
        }
        
        response = await self.client.post(
            f"{self.gateway_url}/api/v1/servers/register",
            json=registration_data
        )
        response.raise_for_status()
    
    async def _sync_tools_and_resources(self):
        """同步工具和资源"""
        try:
            # 从Gateway获取所有可用的工具和资源
            tools_response = await self.client.get(f"{self.gateway_url}/api/v1/tools")
            resources_response = await self.client.get(f"{self.gateway_url}/api/v1/resources")
            
            if tools_response.status_code == 200:
                tools_data = tools_response.json()
                await self._update_tools_in_db(tools_data)
            
            if resources_response.status_code == 200:
                resources_data = resources_response.json()
                await self._update_resources_in_db(resources_data)
                
        except Exception as e:
            logger.error(f"同步工具和资源失败: {e}")
    
    async def _update_tools_in_db(self, tools_data: List[Dict]):
        """更新数据库中的工具信息"""
        async with get_async_session() as session:
            for tool_info in tools_data:
                try:
                    # 查找对应的服务器
                    server_result = await session.execute(
                        select(MCPServer).where(MCPServer.name == tool_info.get("server_name"))
                    )
                    server = server_result.scalar_one_or_none()
                    
                    if not server:
                        continue
                    
                    # 更新或创建工具记录
                    tool_result = await session.execute(
                        select(MCPTool).where(
                            MCPTool.server_id == server.id,
                            MCPTool.tool_name == tool_info["name"]
                        )
                    )
                    tool = tool_result.scalar_one_or_none()
                    
                    if tool:
                        # 更新现有工具
                        tool.display_name = tool_info.get("display_name", tool_info["name"])
                        tool.description = tool_info.get("description")
                        tool.tool_schema = tool_info.get("schema", {})
                        tool.updated_at = datetime.now()
                    else:
                        # 创建新工具
                        tool = MCPTool(
                            server_id=server.id,
                            tool_name=tool_info["name"],
                            display_name=tool_info.get("display_name", tool_info["name"]),
                            description=tool_info.get("description"),
                            tool_schema=tool_info.get("schema", {}),
                            category=tool_info.get("category"),
                            tags=tool_info.get("tags", [])
                        )
                        session.add(tool)
                    
                    await session.commit()
                    
                except Exception as e:
                    logger.error(f"更新工具 {tool_info.get('name')} 失败: {e}")
                    await session.rollback()
    
    async def _update_resources_in_db(self, resources_data: List[Dict]):
        """更新数据库中的资源信息"""
        async with get_async_session() as session:
            for resource_info in resources_data:
                try:
                    # 查找对应的服务器
                    server_result = await session.execute(
                        select(MCPServer).where(MCPServer.name == resource_info.get("server_name"))
                    )
                    server = server_result.scalar_one_or_none()
                    
                    if not server:
                        continue
                    
                    # 更新或创建资源记录
                    resource_result = await session.execute(
                        select(MCPResource).where(
                            MCPResource.server_id == server.id,
                            MCPResource.resource_uri == resource_info["uri"]
                        )
                    )
                    resource = resource_result.scalar_one_or_none()
                    
                    if resource:
                        # 更新现有资源
                        resource.resource_name = resource_info.get("name", resource_info["uri"])
                        resource.description = resource_info.get("description")
                        resource.resource_type = resource_info.get("type")
                        resource.mime_type = resource_info.get("mime_type")
                        resource.updated_at = datetime.now()
                    else:
                        # 创建新资源
                        resource = MCPResource(
                            server_id=server.id,
                            resource_uri=resource_info["uri"],
                            resource_name=resource_info.get("name", resource_info["uri"]),
                            resource_type=resource_info.get("type"),
                            description=resource_info.get("description"),
                            mime_type=resource_info.get("mime_type"),
                            resource_metadata=resource_info.get("metadata", {})
                        )
                        session.add(resource)
                    
                    await session.commit()
                    
                except Exception as e:
                    logger.error(f"更新资源 {resource_info.get('uri')} 失败: {e}")
                    await session.rollback()
    
    async def register_server(self, config: MCPServerConfig) -> bool:
        """注册新的MCP服务器"""
        try:
            async with get_async_session() as session:
                # 检查服务器名称是否已存在
                existing = await session.execute(
                    select(MCPServer).where(MCPServer.name == config.name)
                )
                if existing.scalar_one_or_none():
                    raise ValueError(f"服务器名称 {config.name} 已存在")
                
                # 创建服务器记录
                server = MCPServer(
                    name=config.name,
                    display_name=config.display_name,
                    description=config.description,
                    server_type=config.server_type,
                    connection_config=config.connection_config,
                    transport_type=config.transport_type,
                    server_metadata=config.metadata or {}
                )
                
                session.add(server)
                await session.commit()
                
                # 注册到Gateway
                await self._register_server_to_gateway(server)
                
                # 同步该服务器的工具和资源
                await self._sync_server_tools_and_resources(server.name)
                
                logger.info(f"MCP服务器 {config.name} 注册成功")
                return True
                
        except Exception as e:
            logger.error(f"注册MCP服务器失败: {e}")
            return False
    
    async def _sync_server_tools_and_resources(self, server_name: str):
        """同步特定服务器的工具和资源"""
        try:
            # 从Gateway获取特定服务器的工具和资源
            tools_response = await self.client.get(
                f"{self.gateway_url}/api/v1/servers/{server_name}/tools"
            )
            resources_response = await self.client.get(
                f"{self.gateway_url}/api/v1/servers/{server_name}/resources"
            )
            
            if tools_response.status_code == 200:
                tools_data = tools_response.json()
                await self._update_tools_in_db(tools_data)
            
            if resources_response.status_code == 200:
                resources_data = resources_response.json()
                await self._update_resources_in_db(resources_data)
                
        except Exception as e:
            logger.error(f"同步服务器 {server_name} 的工具和资源失败: {e}")
    
    async def call_tool(self, request: MCPToolCallRequest) -> MCPToolCallResponse:
        """调用MCP工具"""
        start_time = datetime.now()
        
        try:
            # 查找工具信息
            async with get_async_session() as session:
                tool_result = await session.execute(
                    select(MCPTool).where(MCPTool.tool_name == request.tool_name)
                )
                tool = tool_result.scalar_one_or_none()
                
                if not tool:
                    return MCPToolCallResponse(
                        success=False,
                        error=f"工具 {request.tool_name} 不存在"
                    )
                
                # 通过Gateway调用工具
                call_data = {
                    "tool": request.tool_name,
                    "arguments": request.arguments
                }
                
                response = await self.client.post(
                    f"{self.gateway_url}/api/v1/tools/call",
                    json=call_data
                )
                
                end_time = datetime.now()
                duration_ms = int((end_time - start_time).total_seconds() * 1000)
                
                if response.status_code == 200:
                    result = response.json()
                    
                    # 记录调用日志
                    call_log = MCPToolCall(
                        tool_id=tool.id,
                        session_id=request.session_id,
                        user_id=request.user_id,
                        call_request=call_data,
                        call_response=result,
                        call_status="success",
                        duration_ms=duration_ms,
                        completed_at=end_time
                    )
                    session.add(call_log)
                    
                    # 更新工具使用统计
                    tool.usage_count += 1
                    tool.last_used_at = end_time
                    
                    await session.commit()
                    
                    return MCPToolCallResponse(
                        success=True,
                        result=result,
                        duration_ms=duration_ms
                    )
                else:
                    error_msg = f"工具调用失败: {response.status_code} - {response.text}"
                    
                    # 记录错误日志
                    call_log = MCPToolCall(
                        tool_id=tool.id,
                        session_id=request.session_id,
                        user_id=request.user_id,
                        call_request=call_data,
                        call_status="error",
                        error_message=error_msg,
                        duration_ms=duration_ms,
                        completed_at=end_time
                    )
                    session.add(call_log)
                    await session.commit()
                    
                    return MCPToolCallResponse(
                        success=False,
                        error=error_msg,
                        duration_ms=duration_ms
                    )
                    
        except Exception as e:
            logger.error(f"调用MCP工具失败: {e}")
            return MCPToolCallResponse(
                success=False,
                error=str(e)
            )
    
    async def get_available_tools(self, category: Optional[str] = None) -> List[Dict[str, Any]]:
        """获取可用的工具列表"""
        try:
            async with get_async_session() as session:
                query = select(MCPTool).where(MCPTool.is_enabled == True)
                
                if category:
                    query = query.where(MCPTool.category == category)
                
                result = await session.execute(query)
                tools = result.scalars().all()
                
                return [
                    {
                        "id": str(tool.id),
                        "name": tool.tool_name,
                        "display_name": tool.display_name,
                        "description": tool.description,
                        "category": tool.category,
                        "tags": tool.tags,
                        "schema": tool.tool_schema,
                        "usage_count": tool.usage_count,
                        "last_used_at": tool.last_used_at.isoformat() if tool.last_used_at else None
                    }
                    for tool in tools
                ]
                
        except Exception as e:
            logger.error(f"获取工具列表失败: {e}")
            return []
    
    async def get_server_status(self) -> List[Dict[str, Any]]:
        """获取所有服务器状态"""
        try:
            async with get_async_session() as session:
                result = await session.execute(select(MCPServer))
                servers = result.scalars().all()
                
                server_status = []
                for server in servers:
                    # 检查服务器健康状态
                    health_status = await self._check_server_health(server.name)
                    
                    # 更新数据库中的健康状态
                    server.health_status = health_status
                    server.last_health_check = datetime.now()
                    
                    server_status.append({
                        "id": str(server.id),
                        "name": server.name,
                        "display_name": server.display_name,
                        "server_type": server.server_type,
                        "transport_type": server.transport_type,
                        "is_enabled": server.is_enabled,
                        "health_status": health_status,
                        "last_health_check": server.last_health_check.isoformat()
                    })
                
                await session.commit()
                return server_status
                
        except Exception as e:
            logger.error(f"获取服务器状态失败: {e}")
            return []
    
    async def _check_server_health(self, server_name: str) -> str:
        """检查特定服务器的健康状态"""
        try:
            response = await self.client.get(
                f"{self.gateway_url}/api/v1/servers/{server_name}/health"
            )
            
            if response.status_code == 200:
                return "healthy"
            else:
                return "unhealthy"
                
        except Exception:
            return "unknown"
    
    async def close(self):
        """关闭服务"""
        if self.client:
            await self.client.aclose()
        logger.info("MCP集成服务已关闭")

# 全局实例
mcp_integration_service = MCPIntegrationService()
