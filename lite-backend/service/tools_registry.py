"""
工具注册中心（Agno 2.0.2 适配）
- 从 9050 llm-config-gateway 发现并动态封装 MCP 工具与 API 工具
- 以 agno.tools.tool 装饰器生成可注入 Agent 的工具函数
- 统一命名：
  - MCP:  mcp:{server}:{tool}
  - API:  api:{config}:{tool}
"""
from __future__ import annotations

import os
import json
import asyncio
from typing import Dict, List, Callable, Any, Optional, Tuple

import httpx
from agno.tools import tool

from core.logger import logger


def _env(name: str, default: str = "") -> str:
    return os.getenv(name, default)


class GatewayClient:
    def __init__(self) -> None:
        self.base = _env("LLM_GATEWAY_URL", "http://127.0.0.1:9050").rstrip("/")
        self._client = httpx.AsyncClient(timeout=30.0)

    async def list_mcp_registry(self) -> List[Dict[str, Any]]:
        url = f"{self.base}/mcp/registry"
        r = await self._client.get(url)
        r.raise_for_status()
        data = r.json()
        return data if isinstance(data, list) else []

    async def list_mcp_tools(self, server: str) -> List[Dict[str, Any]]:
        url = f"{self.base}/mcp/servers/{server}/tools"
        r = await self._client.get(url)
        r.raise_for_status()
        data = r.json()
        return data if isinstance(data, list) else []

    async def call_mcp_tool(self, server: str, tool_name: str, arguments: Dict[str, Any]) -> Any:
        url = f"{self.base}/mcp/servers/{server}/tools/{tool_name}/call"
        r = await self._client.post(url, json=arguments or {})
        r.raise_for_status()
        # 返回 JSON 或文本
        try:
            return r.json()
        except Exception:
            return r.text

    async def list_api_configs(self) -> List[Dict[str, Any]]:
        url = f"{self.base}/api-tools/configs"
        r = await self._client.get(url)
        r.raise_for_status()
        data = r.json()
        return data if isinstance(data, list) else []

    async def list_api_tools(self, config: str) -> List[Dict[str, Any]]:
        url = f"{self.base}/api-tools/configs/{config}/tools"
        r = await self._client.get(url)
        r.raise_for_status()
        data = r.json()
        return data if isinstance(data, list) else []

    async def call_api_tool(self, config: str, tool_name: str, args: Dict[str, Any]) -> Any:
        url = f"{self.base}/api-tools/configs/{config}/tools/{tool_name}/call"
        r = await self._client.post(url, json=args or {})
        r.raise_for_status()
        try:
            return r.json()
        except Exception:
            return r.text

    async def call_unified_tool(self, tool: str, args: Dict[str, Any]) -> Any:
        url = f"{self.base}/tools/execute"
        payload = {"tool": tool, "args": args or {}}
        r = await self._client.post(url, json=payload)
        r.raise_for_status()
        try:
            return r.json()
        except Exception:
            return r.text


class ToolRegistry:
    def __init__(self) -> None:
        self._gc = GatewayClient()
        self._mcp_cache: Dict[str, List[Dict[str, Any]]] = {}
        self._api_cache: Dict[str, List[Dict[str, Any]]] = {}
        self._last_loaded = 0.0
        self._ttl = 60.0

    async def refresh(self, force: bool = False) -> None:
        import time
        now = time.time()
        if not force and (now - self._last_loaded) < self._ttl:
            return

        # MCP
        try:
            reg = await self._gc.list_mcp_registry()
            mcp_servers = [r.get("name") for r in reg if r.get("name")]
            for s in mcp_servers:
                try:
                    self._mcp_cache[s] = await self._gc.list_mcp_tools(s)
                except Exception as e:
                    logger.warning(f"列举 MCP 工具失败: {s}: {e}")
        except Exception as e:
            logger.warning(f"刷新 MCP 注册表失败: {e}")

        # API
        try:
            cfgs = await self._gc.list_api_configs()
            for c in cfgs:
                name = c.get("name")
                if not name:
                    continue
                try:
                    self._api_cache[name] = await self._gc.list_api_tools(name)
                except Exception as e:
                    logger.warning(f"列举 API 工具失败: {name}: {e}")
        except Exception as e:
            logger.warning(f"刷新 API 工具失败: {e}")

        self._last_loaded = now

    async def list_all_tools(self) -> List[str]:
        await self.refresh()
        names: List[str] = []
        for s, tools in self._mcp_cache.items():
            for t in tools:
                tname = t.get("name") or t.get("id") or ""
                if tname:
                    names.append(f"mcp:{s}:{tname}")
        for c, tools in self._api_cache.items():
            for t in tools:
                tname = t.get("name") or t.get("id") or ""
                if tname:
                    names.append(f"api:{c}:{tname}")
        return names

    async def build_tool_objects(self, selected: Optional[List[str]] = None) -> List[Any]:
        """根据选择构建 Agno 工具函数对象列表。
        - selected: 前缀化名称，如 mcp:playwright:click, api:apitest:api-test
        未提供则默认全部。
        """
        await self.refresh()
        selected_set = set(selected or [])
        # 允许选择到“组”：mcp:{server} 或 api:{config}
        selected_mcp_servers = set()
        selected_api_configs = set()
        selected_full = set()
        if selected:
            for s in selected:
                parts = s.split(":")
                if len(parts) == 2 and parts[0] == "mcp":
                    selected_mcp_servers.add(parts[1])
                elif len(parts) == 2 and parts[0] == "api":
                    selected_api_configs.add(parts[1])
                else:
                    selected_full.add(s)
        out: List[Any] = []
        added_names: set[str] = set()

        # MCP 工具
        for server, tools in self._mcp_cache.items():
            for t in tools:
                tname = t.get("name") or t.get("id") or ""
                if not tname:
                    continue
                full = f"mcp:{server}:{tname}"
                if selected:
                    if full not in selected_full and server not in selected_mcp_servers:
                        continue
                desc = t.get("description") or f"MCP 工具 {tname} (服务器 {server})"

                @tool(name=full, description=desc)
                async def _mcp_tool_proxy(args: Optional[Dict[str, Any]] = None, __server=server, __tool=tname, **kwargs):  # type: ignore
                    """统一代理到 9050 /tools/execute。支持两种调用方式：
                    1) _mcp_tool_proxy({"url": "..."})
                    2) _mcp_tool_proxy(url="...")
                    """
                    if args is None or not isinstance(args, dict):
                        args = {}
                    if kwargs:
                        try:
                            args.update(kwargs)
                        except Exception:
                            pass
                    # 直连 MCP 路由，绕过 unified 校验层，提升兼容性
                    result = await self._gc.call_mcp_tool(__server, __tool, args or {})
                    try:
                        return json.dumps(result, ensure_ascii=False)
                    except Exception:
                        return str(result)

                out.append(_mcp_tool_proxy)  # function 本身即为工具对象
                added_names.add(full)

                # 为便于模型按“Action: browser_navigate”格式调用，
                # 在仅选择了单个 MCP 服务器时，注册一个“简名”别名（避免与其他服务器冲突）。
                single_server_selected = (len(selected_mcp_servers) == 1 and server in selected_mcp_servers) if selected else False
                if single_server_selected and tname not in added_names:
                    @tool(name=tname, description=desc + f"（别名，绑定 {server}）")
                    async def _mcp_tool_alias(args: Optional[Dict[str, Any]] = None, __server_alias=server, __tool_alias=tname, **kwargs):  # type: ignore
                        if args is None or not isinstance(args, dict):
                            args = {}
                        if kwargs:
                            try:
                                args.update(kwargs)
                            except Exception:
                                pass
                        result = await self._gc.call_mcp_tool(__server_alias, __tool_alias, args or {})
                        try:
                            return json.dumps(result, ensure_ascii=False)
                        except Exception:
                            return str(result)

                    out.append(_mcp_tool_alias)
                    added_names.add(tname)

        # API 工具
        for cfg, tools in self._api_cache.items():
            for t in tools:
                tname = t.get("name") or t.get("id") or ""
                if not tname:
                    continue
                full = f"api:{cfg}:{tname}"
                if selected:
                    if full not in selected_full and cfg not in selected_api_configs:
                        continue
                desc = t.get("description") or f"API 工具 {tname} (配置 {cfg})"

                @tool(name=full, description=desc)
                async def _api_tool_proxy(args: Optional[Dict[str, Any]] = None, __cfg=cfg, __tool=tname, **kwargs):  # type: ignore
                    if args is None or not isinstance(args, dict):
                        args = {}
                    if kwargs:
                        try:
                            args.update(kwargs)
                        except Exception:
                            pass
                    result = await self._gc.call_api_tool(__cfg, __tool, args or {})
                    try:
                        return json.dumps(result, ensure_ascii=False)
                    except Exception:
                        return str(result)

                out.append(_api_tool_proxy)

        logger.info(f"构建工具对象完成: {len(out)}")
        return out


_registry: Optional[ToolRegistry] = None


async def get_tool_registry() -> ToolRegistry:
    global _registry
    if _registry is None:
        _registry = ToolRegistry()
    return _registry
