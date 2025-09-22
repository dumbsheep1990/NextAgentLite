"""
Unla MCP 工具包 - 供Agno Agent调用

提供通用的 mcp 工具调用能力：
- mcp_list_tools(router_prefix?)：查看某个前缀下的可用工具
- mcp_call(tool_name, arguments_json, router_prefix?)：调用具体工具

说明：
- 该工具包基于 Unla 统一网关（/gateway/{prefix}/mcp）实现，依赖后端已挂载的反向代理。
- 当未提供 router_prefix 时，若系统仅同步了唯一前缀，则自动选用该前缀；否则报错，请显式传入。
"""
from __future__ import annotations

import json
from typing import Optional

from agno.tools import tool
from agno.tools.toolkit import Toolkit

from core.logger import logger
from db.database import get_async_session
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from models.mcp_models import UnlaRouterMap
from service.unla_client import unla_client


class UnlaMCPToolkit(Toolkit):
    def __init__(self, default_router_prefix: Optional[str] = None):
        super().__init__(name="unla_mcp_tools")
        self.default_router_prefix = default_router_prefix

    async def _resolve_prefix(self, session: AsyncSession, router_prefix: Optional[str]) -> str:
        if router_prefix:
            return router_prefix
        if self.default_router_prefix:
            return self.default_router_prefix
        # 尝试读取唯一前缀
        result = await session.execute(select(UnlaRouterMap))
        rows = result.scalars().all()
        prefixes = sorted({r.router_prefix for r in rows})
        if len(prefixes) == 1:
            return prefixes[0]
        raise ValueError("未指定 router_prefix 且系统存在多个路由前缀，请显式传入 router_prefix")

    @tool
    async def mcp_list_tools(self, router_prefix: Optional[str] = None) -> str:
        """
        列出指定路由前缀下的可用MCP工具。
        参数:
            router_prefix: Unla 路由前缀，如 "/gateway/abcd1234"（可省略，若系统仅存在唯一前缀）。
        返回:
            JSON字符串：{"tools":[{"name":"...","description":"..."}, ...]}
        """
        try:
            async with get_async_session() as session:
                pfx = await self._resolve_prefix(session, router_prefix)
                sid = await unla_client.initialize(pfx)
                try:
                    data = await unla_client.list_tools(pfx, sid)
                finally:
                    try:
                        await unla_client.close(pfx, sid)
                    except Exception:
                        pass
            return json.dumps(data, ensure_ascii=False)
        except Exception as e:
            logger.error(f"[UNLA_MCP] 列表工具失败: {e}")
            return json.dumps({"error": str(e)}, ensure_ascii=False)

    @tool
    async def mcp_call(self, tool_name: str, arguments_json: str = "{}", router_prefix: Optional[str] = None) -> str:
        """
        调用指定的MCP工具。
        参数:
            tool_name: 工具名称（如 openapi 提供的 operationId 或工具名）
            arguments_json: JSON字符串形式的参数，如 '{"sql": "CREATE TABLE ..."}'
            router_prefix: Unla 路由前缀，如 "/gateway/abcd1234"（可省略，若系统仅存在唯一前缀）。
        返回:
            JSON字符串：Unla Gateway 原始响应
        """
        try:
            args = json.loads(arguments_json) if arguments_json else {}
        except Exception:
            return json.dumps({"error": "arguments_json 不是合法JSON"}, ensure_ascii=False)

        try:
            async with get_async_session() as session:
                pfx = await self._resolve_prefix(session, router_prefix)
                sid = await unla_client.initialize(pfx)
                try:
                    data = await unla_client.call_tool(pfx, sid, tool_name, args)
                finally:
                    try:
                        await unla_client.close(pfx, sid)
                    except Exception:
                        pass
            return json.dumps(data, ensure_ascii=False)
        except Exception as e:
            logger.error(f"[UNLA_MCP] 工具调用失败: {e}")
            return json.dumps({"error": str(e)}, ensure_ascii=False)


# 简易工厂方法（供外部按需创建）
def get_unla_mcp_toolkit(default_router_prefix: Optional[str] = None) -> UnlaMCPToolkit:
    return UnlaMCPToolkit(default_router_prefix=default_router_prefix)

