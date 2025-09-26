"""
Graph Retrieval Tool

封装知识图谱检索能力，提供统一的工具类接口，便于在智能体、API或任务中复用。
当前实现基于 db.repositories.graph_adapter（异步适配器），对外提供常用检索方法：
- 搜索实体（节点）
- 最短路径查询
- 子图检索（基于关键词与类型过滤）
"""
from typing import Any, Dict, List, Optional

from core.logger import logger

try:
    from db.repositories.graph_adapter import graph_adapter
except Exception as e:  # pragma: no cover - graceful fallback
    logger.warning(f"graph_adapter 导入失败: {e}")
    graph_adapter = None


class GraphRetrievalTool:
    """知识图谱检索工具类（异步）。"""

    def __init__(self, adapter=None) -> None:
        self.adapter = adapter or graph_adapter
        if self.adapter is None:
            logger.warning("GraphRetrievalTool 初始化时 adapter 为 None，功能将不可用")

    async def search_entities(
        self,
        query: str,
        limit: int = 20,
        node_type: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        """按关键词搜索节点。

        Returns: [{id, label, type, properties}]
        """
        if not self.adapter:
            return []
        filters: Dict[str, Any] = {"search": query}
        if node_type:
            filters["node_types"] = [node_type]
        nodes = await self.adapter.search_nodes(query=query, filters=filters, limit=limit)
        return nodes or []

    async def shortest_path(self, source_id: str, target_id: str) -> Dict[str, Any]:
        """查询两个节点之间的最短路径。

        Returns: {nodes: [nodeIds], edges: [edgeObjs], length: int}
        """
        if not self.adapter:
            return {"nodes": [], "edges": [], "length": -1}
        data = await self.adapter.find_shortest_path(source_id, target_id)
        if not data:
            return {"nodes": [], "edges": [], "length": -1}
        return {
            "nodes": data.get("nodes", []),
            "edges": data.get("edges", []),
            "length": data.get("length", 0),
        }

    async def subgraph(
        self,
        search: Optional[str] = None,
        node_types: Optional[List[str]] = None,
        edge_types: Optional[List[str]] = None,
        limit: int = 500,
    ) -> Dict[str, Any]:
        """按条件抓取子图（节点+边）。

        Returns: {nodes: [...], edges: [...], stats: {...}}
        """
        if not self.adapter:
            return {"nodes": [], "edges": [], "stats": {}}
        filters: Dict[str, Any] = {}
        if search:
            filters["search"] = search
        if node_types:
            filters["node_types"] = node_types
        if edge_types:
            filters["edge_types"] = edge_types

        nodes = await self.adapter.get_nodes(filters=filters, limit=limit)
        edges = await self.adapter.get_edges(filters=filters)
        stats = await self.adapter.get_graph_stats()
        return {"nodes": nodes or [], "edges": edges or [], "stats": stats or {}}


# 单例工具（可供依赖注入或直接导入使用）
graph_retrieval_tool = GraphRetrievalTool()

