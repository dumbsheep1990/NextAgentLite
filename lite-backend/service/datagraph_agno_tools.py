"""
DataGraphTools: 基于 Agno 的知识图谱检索工具集

封装对 DataGraph 服务（默认 http://localhost:9622）的调用，提供：
- search_knowledge_graph：自动检索模式，从上层传入 query 调用 /query
- fixed_knowledge_graph_search：固定检索模式，使用预设的 fixed_query 调用 /query

两者均返回 DataGraph 的响应结果，便于在工作流或独立工具中复用。
"""
from __future__ import annotations

import os
from typing import Any, Dict, Optional

import httpx
from agno.tools.toolkit import Toolkit
from agno.tools import tool

from core.logger import logger


def _dg_base_url() -> str:
    return os.getenv("DATAGRAPH_BASE_URL", "http://localhost:9622").rstrip("/")


class DataGraphTools(Toolkit):
    """Agno 工具集：知识图谱检索"""

    def __init__(self) -> None:
        super().__init__(name="datagraph_tools")
        self.base_url = _dg_base_url()

    async def _post_query(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        url = f"{self.base_url}/query"
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                resp = await client.post(url, json=payload)
                if resp.status_code >= 400:
                    return {
                        "ok": False,
                        "status": resp.status_code,
                        "error": resp.text,
                    }
                data = resp.json()
                # 规范化返回
                return {
                    "ok": True,
                    "status": resp.status_code,
                    "response": data.get("response", data),
                }
        except Exception as e:
            logger.error(f"[DataGraphTools] 调用失败: {e}")
            return {"ok": False, "error": str(e)}

    @tool
    async def search_knowledge_graph(
        self,
        query: str,
        mode: str = "mix",
        top_k: Optional[int] = None,
        chunk_top_k: Optional[int] = None,
        only_need_context: Optional[bool] = None,
        enable_rerank: Optional[bool] = None,
    ) -> Dict[str, Any]:
        """
        自动检索模式：使用输入的 query 调用 DataGraph 检索。

        Args:
            query: 查询文本
            mode: 检索模式 local|global|hybrid|naive|mix|bypass（默认 mix）
            top_k: 结果数量（DataGraph 含义见 openapi，默认使用服务端配置）
            chunk_top_k: chunk 级初检与重排保留数量
            only_need_context: 仅返回上下文不生成回答
            enable_rerank: 是否进行 rerank
        """
        payload: Dict[str, Any] = {"query": query, "mode": mode}
        if top_k is not None:
            payload["top_k"] = int(top_k)
        if chunk_top_k is not None:
            payload["chunk_top_k"] = int(chunk_top_k)
        if only_need_context is not None:
            payload["only_need_context"] = bool(only_need_context)
        if enable_rerank is not None:
            payload["enable_rerank"] = bool(enable_rerank)
        return await self._post_query(payload)

    @tool
    async def fixed_knowledge_graph_search(
        self,
        fixed_query: str,
        mode: str = "mix",
        top_k: Optional[int] = None,
        chunk_top_k: Optional[int] = None,
        enable_rerank: Optional[bool] = None,
    ) -> Dict[str, Any]:
        """
        固定检索模式：忽略上层输入，使用预设 fixed_query 进行检索。

        Args:
            fixed_query: 预设固定查询文本
            mode/top_k/chunk_top_k/enable_rerank: 与自动模式一致
        """
        payload: Dict[str, Any] = {"query": fixed_query, "mode": mode}
        if top_k is not None:
            payload["top_k"] = int(top_k)
        if chunk_top_k is not None:
            payload["chunk_top_k"] = int(chunk_top_k)
        if enable_rerank is not None:
            payload["enable_rerank"] = bool(enable_rerank)
        return await self._post_query(payload)


# 单例（可被注入）
datagraph_tools = DataGraphTools()

