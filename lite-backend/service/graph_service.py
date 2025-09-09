"""
知识图谱业务服务 - 处理图谱相关的业务逻辑
"""
import uuid
from typing import List, Optional, Dict, Any, Tuple
from datetime import datetime
import asyncio
import networkx as nx
import json

from sqlalchemy.ext.asyncio import AsyncSession
from db.database import get_async_session
from core.logger import logger
from db.repositories.graph_repository import (
    GraphNodeRepository,
    GraphEdgeRepository,
    GraphLayoutRepository,
    GraphFilterRepository,
    GraphStatsRepository,
    GraphSnapshotRepository
)
from db.repositories.arangodb_graph_repository import get_arango_graph_repository
from models.graph import GraphNode, GraphEdge


class GraphService:
    """知识图谱管理服务"""
    
    def __init__(self):
        self.default_layout_config = {
            "algorithm": "spring",
            "physics": {
                "enabled": True,
                "stabilization": {"iterations": 100},
                "barnesHut": {
                    "gravitationalConstant": -2000,
                    "centralGravity": 0.3,
                    "springLength": 95,
                    "springConstant": 0.04,
                    "damping": 0.09
                }
            },
            "nodes": {
                "shape": "dot",
                "size": 16,
                "font": {"size": 12},
                "borderWidth": 2
            },
            "edges": {
                "width": 1,
                "smooth": {"type": "continuous", "enabled": True},
                "arrows": {"to": {"enabled": True}}
            }
        }
    
    # 节点管理
    
    async def create_node(self, node_data: Dict[str, Any]) -> Dict[str, Any]:
        """创建图谱节点"""
        async with get_async_session() as session:
            node_repo = GraphNodeRepository(session)
            node = await node_repo.create(node_data)
            return self._format_node(node)
    
    async def create_nodes_batch(self, nodes_data: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """批量创建节点"""
        async with get_async_session() as session:
            node_repo = GraphNodeRepository(session)
            nodes = await node_repo.create_batch(nodes_data)
            return [self._format_node(node) for node in nodes]
    
    async def get_node(self, node_id: str) -> Optional[Dict[str, Any]]:
        """获取单个节点"""
        async with get_async_session() as session:
            node_repo = GraphNodeRepository(session)
            node = await node_repo.get_by_id(node_id)
            return self._format_node(node) if node else None
    
    async def get_nodes(
        self, 
        skip: int = 0, 
        limit: int = 1000,
        node_types: Optional[List[str]] = None
    ) -> List[Dict[str, Any]]:
        """获取节点列表"""
        async with get_async_session() as session:
            node_repo = GraphNodeRepository(session)
            nodes = await node_repo.get_all(skip, limit, node_types)
            return [self._format_node(node) for node in nodes]
    
    async def search_nodes(self, query: str, limit: int = 50) -> List[Dict[str, Any]]:
        """搜索节点"""
        async with get_async_session() as session:
            node_repo = GraphNodeRepository(session)
            nodes = await node_repo.search_by_label(query, limit)
            return [self._format_node(node) for node in nodes]
    
    async def get_connected_nodes(self, node_id: str, depth: int = 1) -> List[Dict[str, Any]]:
        """获取连接的节点"""
        async with get_async_session() as session:
            node_repo = GraphNodeRepository(session)
            nodes = await node_repo.get_connected_nodes(node_id, depth)
            return [self._format_node(node) for node in nodes]
    
    async def update_node(self, node_id: str, update_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """更新节点"""
        async with get_async_session() as session:
            node_repo = GraphNodeRepository(session)
            node = await node_repo.update(node_id, update_data)
            return self._format_node(node) if node else None
    
    async def delete_node(self, node_id: str) -> bool:
        """删除节点"""
        async with get_async_session() as session:
            node_repo = GraphNodeRepository(session)
            return await node_repo.delete(node_id)
    
    # 边管理
    
    async def create_edge(self, edge_data: Dict[str, Any]) -> Dict[str, Any]:
        """创建图谱边"""
        async with get_async_session() as session:
            edge_repo = GraphEdgeRepository(session)
            edge = await edge_repo.create(edge_data)
            return self._format_edge(edge)
    
    async def create_edges_batch(self, edges_data: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """批量创建边"""
        async with get_async_session() as session:
            edge_repo = GraphEdgeRepository(session)
            edges = await edge_repo.create_batch(edges_data)
            return [self._format_edge(edge) for edge in edges]
    
    async def get_edge(self, edge_id: str) -> Optional[Dict[str, Any]]:
        """获取单个边"""
        async with get_async_session() as session:
            edge_repo = GraphEdgeRepository(session)
            edge = await edge_repo.get_by_id(edge_id)
            return self._format_edge(edge) if edge else None
    
    async def get_edges(
        self, 
        skip: int = 0, 
        limit: int = 1000,
        edge_types: Optional[List[str]] = None
    ) -> List[Dict[str, Any]]:
        """获取边列表"""
        async with get_async_session() as session:
            edge_repo = GraphEdgeRepository(session)
            edges = await edge_repo.get_all(skip, limit, edge_types)
            return [self._format_edge(edge) for edge in edges]
    
    async def get_node_edges(self, node_id: str) -> List[Dict[str, Any]]:
        """获取节点的所有边"""
        async with get_async_session() as session:
            edge_repo = GraphEdgeRepository(session)
            edges = await edge_repo.get_node_edges(node_id)
            return [self._format_edge(edge) for edge in edges]
    
    async def update_edge(self, edge_id: str, update_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """更新边"""
        async with get_async_session() as session:
            edge_repo = GraphEdgeRepository(session)
            edge = await edge_repo.update(edge_id, update_data)
            return self._format_edge(edge) if edge else None
    
    async def delete_edge(self, edge_id: str) -> bool:
        """删除边"""
        async with get_async_session() as session:
            edge_repo = GraphEdgeRepository(session)
            return await edge_repo.delete(edge_id)
    
    # 图谱分析
    
    async def get_graph_data(
        self, 
        node_filter: Optional[Dict[str, Any]] = None,
        edge_filter: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """获取完整图谱数据"""
        nodes = await self.get_nodes(
            node_types=node_filter.get("node_types") if node_filter else None
        )
        edges = await self.get_edges(
            edge_types=edge_filter.get("edge_types") if edge_filter else None
        )
        
        return {
            "nodes": nodes,
            "edges": edges,
            "stats": await self.get_graph_stats()
        }
    
    async def get_subgraph(
        self, 
        center_node_id: str, 
        radius: int = 2,
        max_nodes: int = 100
    ) -> Dict[str, Any]:
        """获取以指定节点为中心的子图"""
        async with get_async_session() as session:
            node_repo = GraphNodeRepository(session)
            edge_repo = GraphEdgeRepository(session)
            
            # 获取中心节点
            center_node = await node_repo.get_by_id(center_node_id)
            if not center_node:
                return {"nodes": [], "edges": []}
            
            # 获取连接的节点
            connected_nodes = await node_repo.get_connected_nodes(center_node_id, radius)
            
            # 限制节点数量
            if len(connected_nodes) > max_nodes:
                # 按连接数排序，取前max_nodes个
                connected_nodes = sorted(
                    connected_nodes, 
                    key=lambda x: x.connections, 
                    reverse=True
                )[:max_nodes]
            
            # 添加中心节点
            all_nodes = [center_node] + connected_nodes
            node_ids = {node.id for node in all_nodes}
            
            # 获取这些节点之间的边
            all_edges = []
            for node in all_nodes:
                node_edges = await edge_repo.get_node_edges(node.id)
                for edge in node_edges:
                    # 只包含两端都在节点集合中的边
                    if edge.from_node_id in node_ids and edge.to_node_id in node_ids:
                        all_edges.append(edge)
            
            # 去重
            unique_edges = {edge.id: edge for edge in all_edges}.values()
            
            return {
                "nodes": [self._format_node(node) for node in all_nodes],
                "edges": [self._format_edge(edge) for edge in unique_edges],
                "center_node_id": center_node_id,
                "radius": radius
            }
    
    async def analyze_graph_structure(self) -> Dict[str, Any]:
        """分析图谱结构"""
        nodes = await self.get_nodes()
        edges = await self.get_edges()
        
        # 创建NetworkX图
        G = nx.Graph()
        
        # 添加节点
        for node in nodes:
            G.add_node(node["id"], **node)
        
        # 添加边
        for edge in edges:
            G.add_edge(edge["from"], edge["to"], **edge)
        
        # 计算图谱指标
        analysis = {
            "basic_stats": {
                "node_count": G.number_of_nodes(),
                "edge_count": G.number_of_edges(),
                "density": nx.density(G),
                "is_connected": nx.is_connected(G)
            },
            "connectivity": {
                "average_clustering": nx.average_clustering(G),
                "transitivity": nx.transitivity(G)
            }
        }
        
        # 中心性分析
        if G.number_of_nodes() > 0:
            betweenness = nx.betweenness_centrality(G)
            closeness = nx.closeness_centrality(G)
            degree = nx.degree_centrality(G)
            
            analysis["centrality"] = {
                "top_betweenness": sorted(
                    betweenness.items(), 
                    key=lambda x: x[1], 
                    reverse=True
                )[:10],
                "top_closeness": sorted(
                    closeness.items(), 
                    key=lambda x: x[1], 
                    reverse=True
                )[:10],
                "top_degree": sorted(
                    degree.items(), 
                    key=lambda x: x[1], 
                    reverse=True
                )[:10]
            }
        
        # 社区检测
        if G.number_of_nodes() > 1:
            try:
                communities = nx.community.greedy_modularity_communities(G)
                analysis["communities"] = {
                    "count": len(communities),
                    "sizes": [len(community) for community in communities],
                    "modularity": nx.community.modularity(G, communities)
                }
            except Exception as e:
                logger.warning(f"社区检测失败: {e}")
                analysis["communities"] = {"count": 0, "sizes": [], "modularity": 0}
        
        return analysis
    
    async def get_graph_stats(self) -> Dict[str, Any]:
        """获取图谱统计信息"""
        try:
            # 从ArangoDB获取实时统计
            arango_repo = get_arango_graph_repository()
            arango_stats = None
            if arango_repo is not None:
                arango_stats = await arango_repo.get_graph_stats()
            else:
                logger.warning("ArangoDB仓库未就绪，跳过实时统计获取")
            
            # 同时保持PostgreSQL的统计信息用于历史记录
            async with get_async_session() as session:
                stats_repo = GraphStatsRepository(session)
                cached_stats = await stats_repo.get_latest_stats()
                
                # 如果没有缓存或缓存过期，重新计算
                if not cached_stats or self._stats_expired(cached_stats):
                    cached_stats = await stats_repo.calculate_and_save_stats()
            
            # 合并ArangoDB和PostgreSQL的统计信息，优先使用PostgreSQL作为主要数据源
            pg_node_count = 0
            pg_edge_count = 0
            
            # 获取PostgreSQL的实时统计
            async with get_async_session() as session:
                from sqlalchemy import func, select
                from models.graph import GraphNode, GraphEdge
                
                # 获取节点数量
                node_count_result = await session.execute(select(func.count(GraphNode.id)))
                pg_node_count = node_count_result.scalar() or 0
                
                # 获取边数量
                edge_count_result = await session.execute(select(func.count(GraphEdge.id)))
                pg_edge_count = edge_count_result.scalar() or 0
            
            # 优先使用PostgreSQL的数据，ArangoDB作为补充
            node_count = pg_node_count
            edge_count = pg_edge_count
            
            # 如果ArangoDB有数据且PostgreSQL没有数据，使用ArangoDB的数据
            if arango_stats and pg_node_count == 0:
                node_count = arango_stats.get('nodes', {}).get('total', 0)
                edge_count = arango_stats.get('edges', {}).get('total', 0)
            
            return {
                "node_count": node_count,
                "edge_count": edge_count,
                "nodeCount": node_count,  # 兼容前端字段
                "edgeCount": edge_count,   # 兼容前端字段
                "node_types": arango_stats.get('nodes', {}) if arango_stats else {},
                "edge_types": arango_stats.get('edges', {}) if arango_stats else {},
                "avg_connections": cached_stats.avg_connections if cached_stats else 0,
                "avgConnections": cached_stats.avg_connections if cached_stats else 0,  # 兼容前端字段
                "type_distribution": cached_stats.type_distribution if cached_stats else {},
                "typeDistribution": cached_stats.type_distribution if cached_stats else {},  # 兼容前端字段
                "last_updated": cached_stats.last_updated.isoformat() if cached_stats else datetime.utcnow().isoformat(),
                "arango_stats": arango_stats,
                "postgresql_stats": {
                    "node_count": pg_node_count,
                    "edge_count": pg_edge_count
                }
            }
        except Exception as e:
            logger.error(f"获取图谱统计信息失败: {e}")
            # 回退到PostgreSQL统计
            async with get_async_session() as session:
                stats_repo = GraphStatsRepository(session)
                cached_stats = await stats_repo.get_latest_stats()
                
                if cached_stats:
                    return {
                        "node_count": cached_stats.node_count,
                        "edge_count": cached_stats.edge_count,
                        "avg_connections": cached_stats.avg_connections,
                        "type_distribution": cached_stats.type_distribution,
                        "last_updated": cached_stats.last_updated.isoformat(),
                        "error": str(e)
                    }
                else:
                    return {
                        "node_count": 0,
                        "edge_count": 0,
                        "avg_connections": 0,
                        "type_distribution": {},
                        "last_updated": datetime.utcnow().isoformat(),
                        "error": str(e)
                    }
    
    # 布局管理
    
    async def get_layouts(self) -> List[Dict[str, Any]]:
        """获取所有布局配置"""
        async with get_async_session() as session:
            layout_repo = GraphLayoutRepository(session)
            layouts = await layout_repo.get_all()
            return [self._format_layout(layout) for layout in layouts]
    
    async def get_default_layout(self) -> Dict[str, Any]:
        """获取默认布局配置"""
        async with get_async_session() as session:
            layout_repo = GraphLayoutRepository(session)
            layout = await layout_repo.get_default()
            
            if layout:
                return self._format_layout(layout)
            else:
                # 创建默认布局
                default_layout = await layout_repo.create({
                    "name": "默认布局",
                    "algorithm": "spring",
                    "physics_config": self.default_layout_config["physics"],
                    "node_config": self.default_layout_config["nodes"],
                    "edge_config": self.default_layout_config["edges"],
                    "is_default": True
                })
                return self._format_layout(default_layout)
    
    async def create_layout(self, layout_data: Dict[str, Any]) -> Dict[str, Any]:
        """创建布局配置"""
        async with get_async_session() as session:
            layout_repo = GraphLayoutRepository(session)
            layout = await layout_repo.create(layout_data)
            return self._format_layout(layout)
    
    async def update_layout(self, layout_id: str, update_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """更新布局配置"""
        async with get_async_session() as session:
            layout_repo = GraphLayoutRepository(session)
            layout = await layout_repo.update(layout_id, update_data)
            return self._format_layout(layout) if layout else None
    
    # 过滤器管理
    
    async def create_filter(self, filter_data: Dict[str, Any]) -> Dict[str, Any]:
        """创建过滤器"""
        async with get_async_session() as session:
            filter_repo = GraphFilterRepository(session)
            graph_filter = await filter_repo.create(filter_data)
            return self._format_filter(graph_filter)
    
    async def get_filters(self, user_id: Optional[str] = None) -> List[Dict[str, Any]]:
        """获取过滤器列表"""
        async with get_async_session() as session:
            filter_repo = GraphFilterRepository(session)
            
            filters = []
            if user_id:
                user_filters = await filter_repo.get_user_filters(user_id)
                filters.extend(user_filters)
            
            public_filters = await filter_repo.get_public_filters()
            filters.extend(public_filters)
            
            return [self._format_filter(f) for f in filters]
    
    async def apply_filter(
        self, 
        filter_data: Dict[str, Any],
        nodes: Optional[List[Dict[str, Any]]] = None,
        edges: Optional[List[Dict[str, Any]]] = None
    ) -> Dict[str, Any]:
        """应用过滤器"""
        if not nodes:
            nodes = await self.get_nodes()
        if not edges:
            edges = await self.get_edges()
        
        # 过滤节点
        filtered_nodes = nodes
        if filter_data.get("node_types"):
            filtered_nodes = [
                node for node in filtered_nodes 
                if node["type"] in filter_data["node_types"]
            ]
        
        if filter_data.get("search_text"):
            search_text = filter_data["search_text"].lower()
            filtered_nodes = [
                node for node in filtered_nodes
                if search_text in node["label"].lower()
            ]
        
        if filter_data.get("min_connections"):
            filtered_nodes = [
                node for node in filtered_nodes
                if node.get("connections", 0) >= filter_data["min_connections"]
            ]
        
        # 获取过滤后节点的ID集合
        node_ids = {node["id"] for node in filtered_nodes}
        
        # 过滤边
        filtered_edges = edges
        if filter_data.get("edge_types"):
            filtered_edges = [
                edge for edge in filtered_edges
                if edge["type"] in filter_data["edge_types"]
            ]
        
        # 只保留两端都在过滤后节点集合中的边
        filtered_edges = [
            edge for edge in filtered_edges
            if edge["from"] in node_ids and edge["to"] in node_ids
        ]
        
        return {
            "nodes": filtered_nodes,
            "edges": filtered_edges,
            "filter": filter_data
        }
    
    # 快照管理
    
    async def create_snapshot(
        self, 
        name: str, 
        description: Optional[str] = None,
        created_by: Optional[str] = None
    ) -> Dict[str, Any]:
        """创建图谱快照"""
        async with get_async_session() as session:
            snapshot_repo = GraphSnapshotRepository(session)
            snapshot = await snapshot_repo.create_snapshot(name, description, created_by)
            return self._format_snapshot(snapshot)
    
    async def get_snapshots(self, skip: int = 0, limit: int = 100) -> List[Dict[str, Any]]:
        """获取快照列表"""
        async with get_async_session() as session:
            snapshot_repo = GraphSnapshotRepository(session)
            snapshots = await snapshot_repo.get_all(skip, limit)
            return [self._format_snapshot(snapshot) for snapshot in snapshots]
    
    async def restore_snapshot(self, snapshot_id: str) -> bool:
        """恢复快照"""
        async with get_async_session() as session:
            snapshot_repo = GraphSnapshotRepository(session)
            node_repo = GraphNodeRepository(session)
            edge_repo = GraphEdgeRepository(session)
            
            snapshot = await snapshot_repo.get_by_id(snapshot_id)
            if not snapshot:
                return False
            
            try:
                # 清空当前图谱数据
                # 注意：这是危险操作，实际应用中可能需要更谨慎的处理
                
                # 恢复节点
                for node_data in snapshot.nodes_data:
                    await node_repo.create(node_data)
                
                # 恢复边
                for edge_data in snapshot.edges_data:
                    await edge_repo.create(edge_data)
                
                logger.info(f"成功恢复快照: {snapshot_id}")
                return True
                
            except Exception as e:
                logger.error(f"恢复快照失败 {snapshot_id}: {e}")
                return False
    
    # 图谱构建
    
    async def build_graph_from_documents(
        self, 
        document_ids: List[str],
        extraction_config: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """从文档构建图谱"""
        # 使用优化后的通用材料科学三元组提取服务
        from service.universal_triplet_extraction_service import UniversalTripletExtractionService as TripletExtractionService
        from db.repositories.knowledge_repository import KnowledgeRepository
        from db.database import get_async_session
        
        logger.info(f"开始从 {len(document_ids)} 个文档构建图谱")
        
        triplet_service = TripletExtractionService()
        total_entities = []
        total_relationships = []
        
        async with get_async_session() as session:
            knowledge_repo = KnowledgeRepository(session)
            
            for doc_id in document_ids:
                try:
                    # 获取文档对象
                    document = await knowledge_repo.get_document_by_id(doc_id)
                    if not document:
                        logger.warning(f"文档 {doc_id} 不存在，跳过")
                        continue
                    
                    # 进行三元组提取
                    extraction_result = await triplet_service.extract_triplets_from_document(
                        document=document,
                        use_streaming=False
                    )
                    
                    # 合并提取结果
                    entities = extraction_result.get('entities', [])
                    relationships = extraction_result.get('relationships', [])
                    
                    total_entities.extend(entities)
                    total_relationships.extend(relationships)
                    
                    logger.info(f"文档 {doc_id} 提取完成: {len(entities)} 个实体, {len(relationships)} 个关系")
                    
                except Exception as e:
                    logger.error(f"文档 {doc_id} 提取失败: {e}")
                    continue
        
        # 将提取的实体转换为图谱节点格式
        node_entities = []
        for entity in total_entities:
            node_entities.append({
                "id": entity.get('id', str(uuid.uuid4())),
                "label": entity.get('name', ''),
                "type": entity.get('type', 'entity').lower(),
                "properties": {
                    "description": entity.get('description', ''),
                    "confidence": entity.get('confidence', 0.0),
                    "source_documents": entity.get('source_documents', [])
                }
            })
        
        # 将提取的关系转换为图谱边格式
        edge_relations = []
        for relation in total_relationships:
            edge_relations.append({
                "from_node_id": relation.get('source_entity_id'),
                "to_node_id": relation.get('target_entity_id'),
                "label": relation.get('type', ''),
                "type": relation.get('type', 'relationship'),
                "properties": {
                    "evidence": relation.get('evidence', ''),
                    "confidence": relation.get('confidence', 0.0),
                    "source_documents": relation.get('source_documents', [])
                },
                "weight": relation.get('confidence', 1.0)
            })
        
        # 批量创建节点和边（PostgreSQL）
        created_nodes = await self.create_nodes_batch(node_entities) if node_entities else []
        created_edges = await self.create_edges_batch(edge_relations) if edge_relations else []
        
        # 同步数据到ArangoDB
        arango_nodes_created = 0
        arango_edges_created = 0
        
        try:
            from db.repositories.arangodb_graph_repository import get_arango_graph_repository
            arango_repo = get_arango_graph_repository()
            
            if arango_repo is not None:
                logger.info("开始同步数据到ArangoDB...")
                
                # 同步节点到ArangoDB
                if node_entities:
                    for node_data in node_entities:
                        try:
                            # 根据节点类型确定集合名称
                            collection_name = self._get_arango_collection_name(node_data.get('type', 'entity'))
                            await arango_repo.create_node(
                                collection_name=collection_name,
                                properties={
                                    'label': node_data.get('label', ''),
                                    'type': node_data.get('type', ''),
                                    'description': node_data.get('properties', {}).get('description', ''),
                                    'confidence': node_data.get('properties', {}).get('confidence', 0.0),
                                    'source_documents': node_data.get('properties', {}).get('source_documents', [])
                                },
                                node_id=node_data.get('id')
                            )
                            arango_nodes_created += 1
                        except Exception as node_error:
                            logger.warning(f"ArangoDB节点创建失败 {node_data.get('id')}: {node_error}")
                
                # 同步边到ArangoDB
                if edge_relations:
                    for edge_data in edge_relations:
                        try:
                            # 确定from和to节点的集合名称
                            from_node_id = edge_data.get('from_node_id')
                            to_node_id = edge_data.get('to_node_id')
                            
                            # 从PostgreSQL节点数据中找到对应的节点类型
                            from_collection = 'entities'  # 默认值
                            to_collection = 'entities'    # 默认值
                            
                            for node in node_entities:
                                if node.get('id') == from_node_id:
                                    from_collection = self._get_arango_collection_name(node.get('type', 'entity'))
                                if node.get('id') == to_node_id:
                                    to_collection = self._get_arango_collection_name(node.get('type', 'entity'))
                            
                            await arango_repo.create_edge(
                                edge_collection='relationships',
                                from_node_id=from_node_id,
                                to_node_id=to_node_id,
                                from_collection=from_collection,
                                to_collection=to_collection,
                                properties={
                                    'label': edge_data.get('label', ''),
                                    'type': edge_data.get('type', ''),
                                    'evidence': edge_data.get('properties', {}).get('evidence', ''),
                                    'confidence': edge_data.get('properties', {}).get('confidence', 0.0),
                                    'source_documents': edge_data.get('properties', {}).get('source_documents', []),
                                    'weight': edge_data.get('weight', 1.0)
                                }
                            )
                            arango_edges_created += 1
                        except Exception as edge_error:
                            logger.warning(f"ArangoDB边创建失败 {edge_data.get('from_node_id')}->{edge_data.get('to_node_id')}: {edge_error}")
                
                logger.info(f"ArangoDB数据同步完成: {arango_nodes_created} 个节点, {arango_edges_created} 个边")
            else:
                logger.warning("ArangoDB仓库未就绪，跳过图数据同步")
                
        except Exception as arango_error:
            logger.error(f"ArangoDB数据同步失败: {arango_error}")
        
        result = {
            "nodes_created": len(created_nodes),
            "edges_created": len(created_edges),
            "arango_nodes_created": arango_nodes_created,
            "arango_edges_created": arango_edges_created,
            "documents_processed": len(document_ids),
            "total_entities_extracted": len(total_entities),
            "total_relationships_extracted": len(total_relationships)
        }
        
        logger.info(f"图谱构建完成: {result}")
        return result
    
    # 私有方法
    
    def _format_node(self, node: GraphNode) -> Dict[str, Any]:
        """格式化节点数据"""
        return {
            "id": node.id,
            "label": node.label,
            "type": node.type,
            "properties": node.properties,
            "x": node.x,
            "y": node.y,
            "color": node.color,
            "size": node.size,
            "connections": node.connections,
            "level": node.level
        }
    
    def _format_edge(self, edge: GraphEdge) -> Dict[str, Any]:
        """格式化边数据"""
        return {
            "id": edge.id,
            "from": edge.from_node_id,
            "to": edge.to_node_id,
            "label": edge.label,
            "type": edge.type,
            "properties": edge.properties,
            "weight": edge.weight,
            "color": edge.color
        }
    
    def _format_layout(self, layout) -> Dict[str, Any]:
        """格式化布局数据"""
        return {
            "id": layout.id,
            "name": layout.name,
            "algorithm": layout.algorithm,
            "physics": layout.physics_config,
            "nodes": layout.node_config,
            "edges": layout.edge_config,
            "is_default": layout.is_default
        }
    
    def _format_filter(self, graph_filter) -> Dict[str, Any]:
        """格式化过滤器数据"""
        return {
            "id": graph_filter.id,
            "name": graph_filter.name,
            "node_types": graph_filter.node_types,
            "edge_types": graph_filter.edge_types,
            "search_text": graph_filter.search_text,
            "view_mode": graph_filter.view_mode,
            "is_default": graph_filter.is_default
        }
    
    def _format_snapshot(self, snapshot) -> Dict[str, Any]:
        """格式化快照数据"""
        return {
            "id": snapshot.id,
            "name": snapshot.name,
            "description": snapshot.description,
            "node_count": snapshot.node_count,
            "edge_count": snapshot.edge_count,
            "created_by": snapshot.created_by,
            "created_at": snapshot.created_at.isoformat()
        }
    
    def _stats_expired(self, stats, hours: int = 1) -> bool:
        """检查统计是否过期"""
        from datetime import timedelta, timezone
        now = datetime.now(timezone.utc)
        # 确保 stats.last_updated 有时区信息
        last_updated = stats.last_updated
        if last_updated.tzinfo is None:
            last_updated = last_updated.replace(tzinfo=timezone.utc)
        return now - last_updated > timedelta(hours=hours)
    
    def _get_arango_collection_name(self, entity_type: str) -> str:
        """根据实体类型映射到ArangoDB集合名称"""
        type_mapping = {
            'material': 'materials',
            'materials': 'materials',
            'concept': 'concepts', 
            'concepts': 'concepts',
            'paper': 'papers',
            'papers': 'papers',
            'document': 'papers',
            'entity': 'entities',
            'entities': 'entities'
        }
        return type_mapping.get(entity_type.lower(), 'entities')
    
    async def _extract_entities(self, document_ids: List[str]) -> List[Dict[str, Any]]:
        """从文档中抽取实体（模拟）"""
        entities = []
        
        for i, doc_id in enumerate(document_ids):
            # 模拟实体抽取结果
            for j in range(3):  # 每个文档抽取3个实体
                entity_id = str(uuid.uuid4())
                entities.append({
                    "id": entity_id,
                    "label": f"实体_{i}_{j}",
                    "type": ["人物", "机构", "概念"][j],
                    "properties": {
                        "confidence": 0.8 + j * 0.1,
                        "source_document": doc_id
                    },
                    "source_document_id": doc_id
                })
        
        return entities
    
    async def _extract_relations(self, document_ids: List[str]) -> List[Dict[str, Any]]:
        """从文档中抽取关系（模拟）"""
        # 这里需要和实体抽取配合，实际应用中会更复杂
        relations = []
        
        # 模拟关系抽取结果
        for i in range(len(document_ids) * 2):
            relation_id = str(uuid.uuid4())
            from_id = str(uuid.uuid4())  # 实际应该对应实体ID
            to_id = str(uuid.uuid4())    # 实际应该对应实体ID
            
            relations.append({
                "from_node_id": from_id,
                "to_node_id": to_id,
                "label": f"关系_{i}",
                "type": ["相关", "包含", "引用"][i % 3],
                "properties": {
                    "confidence": 0.7 + (i % 3) * 0.1
                },
                "weight": 1.0
            })
        
        return relations


# 创建全局图谱服务实例
graph_service = GraphService()