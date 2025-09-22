"""
Unla MCP 客户端（直接通过统一网关路径调用）
提供最小的 initialize / tools.list / tools.call / close 流程封装。
"""
from __future__ import annotations

import os
import json
from typing import Any, Dict, Optional

import httpx


def _env(name: str, default: str = "") -> str:
    return os.getenv(name, default)


class UnlaClient:
    def __init__(self) -> None:
        # 直接指向后端反向代理路径（本服务对外统一地址）
        self.gateway_prefix = _env("UNLA_GATEWAY_PREFIX", "/gateway")
        self._client = httpx.AsyncClient(timeout=60.0)

    async def initialize(self, router_prefix: str) -> str:
        url = f"{self.gateway_prefix}{router_prefix}/mcp"
        payload = {"jsonrpc": "2.0", "id": 1, "method": "initialize", "params": {}}
        r = await self._client.post(url, headers={"Accept": "application/json, text/event-stream", "Content-Type": "application/json"}, content=json.dumps(payload))
        r.raise_for_status()
        session_id = r.headers.get("Mcp-Session-Id") or r.headers.get("mcp-session-id")
        if not session_id:
            raise RuntimeError("Unla initialize missing Mcp-Session-Id header")
        return session_id

    async def list_tools(self, router_prefix: str, session_id: str) -> Dict[str, Any]:
        url = f"{self.gateway_prefix}{router_prefix}/mcp"
        payload = {"jsonrpc": "2.0", "id": 2, "method": "tools/list", "params": {}}
        r = await self._client.post(url, headers={"Accept": "application/json, text/event-stream", "Content-Type": "application/json", "Mcp-Session-Id": session_id}, content=json.dumps(payload))
        r.raise_for_status()
        return r.json()

    async def call_tool(self, router_prefix: str, session_id: str, tool_name: str, arguments: Dict[str, Any]) -> Dict[str, Any]:
        url = f"{self.gateway_prefix}{router_prefix}/mcp"
        payload = {"jsonrpc": "2.0", "id": 3, "method": "tools/call", "params": {"name": tool_name, "arguments": arguments}}
        r = await self._client.post(url, headers={"Accept": "application/json, text/event-stream", "Content-Type": "application/json", "Mcp-Session-Id": session_id}, content=json.dumps(payload))
        r.raise_for_status()
        return r.json()

    async def close(self, router_prefix: str, session_id: str) -> None:
        url = f"{self.gateway_prefix}{router_prefix}/mcp"
        r = await self._client.delete(url, headers={"Mcp-Session-Id": session_id})
        r.raise_for_status()


unla_client = UnlaClient()

