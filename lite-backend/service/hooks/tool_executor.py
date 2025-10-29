"""
Hook工具执行引擎

提供Hook执行工具（API工具、MCP工具）的能力
与LLM Gateway (端口9050) 的工具系统集成

工具ID格式：
- MCP工具: mcp:{server}:{tool_name}
- API工具: api:{config}:{tool_name}
"""

import logging
import json
from typing import Any, Dict, Optional, List
from dataclasses import dataclass
import os

logger = logging.getLogger(__name__)


@dataclass
class ToolCallResult:
    """工具调用结果"""
    success: bool
    result: Any
    error: Optional[str] = None
    metadata: Dict[str, Any] = None

    def __post_init__(self):
        if self.metadata is None:
            self.metadata = {}


class HookToolExecutor:
    """Hook工具执行器

    与LLM Gateway的工具系统集成
    """

    def __init__(self):
        self.gateway_client = None
        self.gateway_url = os.getenv("LLM_GATEWAY_URL", "http://localhost:9050").rstrip("/")
        self._initialized = False

    async def initialize(self):
        """初始化网关客户端"""
        if self._initialized:
            return

        try:
            from service.tools_registry import GatewayClient
            self.gateway_client = GatewayClient()
            self._initialized = True
            logger.info(f"✅ HookToolExecutor初始化成功: gateway={self.gateway_url}")
        except Exception as e:
            logger.error(f"❌ HookToolExecutor初始化失败: {e}")
            raise

    async def call_tool(
        self,
        tool_id: str,
        tool_type: str = 'auto',
        **kwargs
    ) -> ToolCallResult:
        """调用工具

        Args:
            tool_id: 工具ID (格式: tool_name 或 mcp:server:tool 或 api:config:tool)
            tool_type: 工具类型 ('api', 'mcp', 'auto')
            **kwargs: 工具参数

        Returns:
            ToolCallResult: 工具调用结果
        """
        if not self._initialized:
            await self.initialize()

        try:
            # 验证tool_type参数
            if tool_type not in ['api', 'mcp', 'auto']:
                return ToolCallResult(
                    success=False,
                    result=None,
                    error=f"无效的工具类型 '{tool_type}': 应为 'api', 'mcp', 或 'auto'",
                    metadata={'tool_id': tool_id}
                )

            # 解析工具ID
            parts = tool_id.split(':')

            if len(parts) == 3 and parts[0] in ['mcp', 'api']:
                # 完整格式: mcp:server:tool 或 api:config:tool
                tool_type_from_id = parts[0]
                config_or_server = parts[1]
                tool_name = parts[2]
            elif len(parts) == 2 and parts[0] in ['mcp', 'api']:
                # 格式: mcp:tool 或 api:tool (尝试自动查找)
                tool_type_from_id = parts[0]
                config_or_server = None
                tool_name = parts[1]
            else:
                # 简单格式: tool_name (需要指定工具类型)
                tool_type_from_id = None
                config_or_server = None
                tool_name = tool_id

            # 确定最终的工具类型
            if tool_type != 'auto':
                final_tool_type = tool_type
            elif tool_type_from_id:
                final_tool_type = tool_type_from_id
            else:
                final_tool_type = 'api'  # 默认为API工具

            logger.debug(
                f"工具调用: tool_id={tool_id}, type={final_tool_type}, "
                f"server/config={config_or_server}, tool_name={tool_name}"
            )

            # 调用对应的工具
            if final_tool_type == 'mcp':
                return await self._call_mcp_tool(
                    tool_name, config_or_server, **kwargs
                )
            else:
                return await self._call_api_tool(
                    tool_name, config_or_server, **kwargs
                )

        except Exception as e:
            logger.error(f"❌ 工具调用失败: tool_id={tool_id}, 错误={e}")
            return ToolCallResult(
                success=False,
                result=None,
                error=str(e),
                metadata={'tool_id': tool_id}
            )

    async def _call_api_tool(
        self,
        tool_name: str,
        config_name: Optional[str] = None,
        **kwargs
    ) -> ToolCallResult:
        """调用API工具

        Args:
            tool_name: 工具名称
            config_name: 配置名称（可选，如果不指定则查找第一个可用配置）
            **kwargs: 工具参数

        Returns:
            ToolCallResult: 工具调用结果
        """
        if not self.gateway_client:
            return ToolCallResult(
                success=False,
                result=None,
                error="网关客户端未初始化"
            )

        try:
            # 如果没有指定配置，尝试找第一个有该工具的配置
            if not config_name:
                try:
                    configs = await self.gateway_client.list_api_configs()
                    for cfg in configs:
                        cfg_name = cfg.get("name")
                        if cfg_name:
                            tools = await self.gateway_client.list_api_tools(cfg_name)
                            for tool in tools:
                                if tool.get("name") == tool_name or tool.get("id") == tool_name:
                                    config_name = cfg_name
                                    break
                        if config_name:
                            break
                except Exception as e:
                    logger.warning(f"⚠️ 查找API工具配置失败: {e}")

            if not config_name:
                return ToolCallResult(
                    success=False,
                    result=None,
                    error=f"未找到API工具 {tool_name} 的配置"
                )

            # 调用工具
            logger.info(f"📞 调用API工具: config={config_name}, tool={tool_name}")
            result = await self.gateway_client.call_api_tool(
                config_name,
                tool_name,
                kwargs or {}
            )

            logger.info(f"✅ API工具调用成功: {tool_name}")
            return ToolCallResult(
                success=True,
                result=result,
                metadata={'tool_name': tool_name, 'config': config_name, 'type': 'api'}
            )

        except Exception as e:
            logger.error(f"❌ API工具调用失败: tool={tool_name}, config={config_name}, 错误={e}")
            return ToolCallResult(
                success=False,
                result=None,
                error=str(e),
                metadata={'tool_name': tool_name, 'config': config_name, 'type': 'api'}
            )

    async def _call_mcp_tool(
        self,
        tool_name: str,
        server_name: Optional[str] = None,
        **kwargs
    ) -> ToolCallResult:
        """调用MCP工具

        Args:
            tool_name: 工具名称
            server_name: 服务器名称（可选，如果不指定则查找第一个可用服务器）
            **kwargs: 工具参数

        Returns:
            ToolCallResult: 工具调用结果
        """
        if not self.gateway_client:
            return ToolCallResult(
                success=False,
                result=None,
                error="网关客户端未初始化"
            )

        try:
            # 如果没有指定服务器，尝试找第一个有该工具的服务器
            if not server_name:
                try:
                    registry = await self.gateway_client.list_mcp_registry()
                    for server in registry:
                        srv_name = server.get("name")
                        if srv_name:
                            tools = await self.gateway_client.list_mcp_tools(srv_name)
                            for tool in tools:
                                if tool.get("name") == tool_name or tool.get("id") == tool_name:
                                    server_name = srv_name
                                    break
                        if server_name:
                            break
                except Exception as e:
                    logger.warning(f"⚠️ 查找MCP工具服务器失败: {e}")

            if not server_name:
                return ToolCallResult(
                    success=False,
                    result=None,
                    error=f"未找到MCP工具 {tool_name} 的服务器"
                )

            # 调用工具
            logger.info(f"📞 调用MCP工具: server={server_name}, tool={tool_name}")
            result = await self.gateway_client.call_mcp_tool(
                server_name,
                tool_name,
                kwargs or {}
            )

            logger.info(f"✅ MCP工具调用成功: {tool_name}")
            return ToolCallResult(
                success=True,
                result=result,
                metadata={'tool_name': tool_name, 'server': server_name, 'type': 'mcp'}
            )

        except Exception as e:
            logger.error(f"❌ MCP工具调用失败: tool={tool_name}, server={server_name}, 错误={e}")
            return ToolCallResult(
                success=False,
                result=None,
                error=str(e),
                metadata={'tool_name': tool_name, 'server': server_name, 'type': 'mcp'}
            )

    async def list_api_tools(self) -> List[str]:
        """列出可用的API工具

        Returns:
            API工具列表 (格式: api:config:tool_name)
        """
        if not self._initialized:
            await self.initialize()

        try:
            tools = []
            configs = await self.gateway_client.list_api_configs()

            for cfg in configs:
                cfg_name = cfg.get("name")
                if not cfg_name:
                    continue

                try:
                    cfg_tools = await self.gateway_client.list_api_tools(cfg_name)
                    for tool in cfg_tools:
                        tool_name = tool.get("name") or tool.get("id")
                        if tool_name:
                            tools.append(f"api:{cfg_name}:{tool_name}")
                except Exception as e:
                    logger.warning(f"⚠️ 列出API工具失败 {cfg_name}: {e}")

            return tools
        except Exception as e:
            logger.error(f"❌ 列出API工具失败: {e}")
            return []

    async def list_mcp_tools(self) -> List[str]:
        """列出可用的MCP工具

        Returns:
            MCP工具列表 (格式: mcp:server:tool_name)
        """
        if not self._initialized:
            await self.initialize()

        try:
            tools = []
            registry = await self.gateway_client.list_mcp_registry()

            for server in registry:
                srv_name = server.get("name")
                if not srv_name:
                    continue

                try:
                    srv_tools = await self.gateway_client.list_mcp_tools(srv_name)
                    for tool in srv_tools:
                        tool_name = tool.get("name") or tool.get("id")
                        if tool_name:
                            tools.append(f"mcp:{srv_name}:{tool_name}")
                except Exception as e:
                    logger.warning(f"⚠️ 列出MCP工具失败 {srv_name}: {e}")

            return tools
        except Exception as e:
            logger.error(f"❌ 列出MCP工具失败: {e}")
            return []

    async def get_tool_schema(self, tool_id: str) -> Optional[Dict[str, Any]]:
        """获取工具模式（仅MCP和API支持）

        Args:
            tool_id: 工具ID

        Returns:
            工具模式或None
        """
        if not self._initialized:
            await self.initialize()

        try:
            # 解析工具ID
            parts = tool_id.split(':')
            if len(parts) < 2:
                return None

            if parts[0] == 'mcp' and len(parts) >= 3:
                server = parts[1]
                tool_name = parts[2]
                tools = await self.gateway_client.list_mcp_tools(server)
                for tool in tools:
                    if tool.get("name") == tool_name:
                        return tool
            elif parts[0] == 'api' and len(parts) >= 3:
                config = parts[1]
                tool_name = parts[2]
                tools = await self.gateway_client.list_api_tools(config)
                for tool in tools:
                    if tool.get("name") == tool_name:
                        return tool

            return None
        except Exception as e:
            logger.warning(f"⚠️ 获取工具模式失败 {tool_id}: {e}")
            return None


# 全局单例
_hook_tool_executor: Optional[HookToolExecutor] = None


def get_hook_tool_executor() -> HookToolExecutor:
    """获取Hook工具执行器单例

    Returns:
        HookToolExecutor实例
    """
    global _hook_tool_executor
    if _hook_tool_executor is None:
        _hook_tool_executor = HookToolExecutor()
    return _hook_tool_executor


async def initialize_hook_tool_executor():
    """初始化Hook工具执行器"""
    executor = get_hook_tool_executor()
    await executor.initialize()
