"""
知识图谱数据仓库 - 基于ArangoDB图数据库的实现
"""
from typing import List, Optional, Dict, Any, Tuple
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, delete, func, and_, or_, text
from sqlalchemy.orm import selectinload
import uuid
from datetime import datetime

from models.graph import (
    GraphNode, 
    GraphEdge, 
    GraphLayout, 
    GraphFilter, 
    GraphStats,
    GraphSnapshot
)
from db.repositories.arangodb_graph_repository import get_arango_graph_repository


class GraphNodeRepository:
    """图谱节点仓库 - 基于ArangoDB"""
    
    def __init__(self, session: AsyncSession):
        self.session = session
        self.arango_repo = get_arango_graph_repository()
        if self.arango_repo is None:
            from core.logger import logger
            logger.warning("ArangoDB仓库未就绪，图节点仓库将跳过ArangoDB相关操作")
    
    async def create(self, node_data: Dict[str, Any]) -> GraphNode:
        """创建新节点"""
        # 使用数据中的id，如果没有则生成新的
        node_id = node_data.get('id', str(uuid.uuid4()))
        
        # 确定集合名称
        collection_name = self._get_collection_name(node_data.get('type', 'entities'))
        
        # 在ArangoDB中创建节点
        arango_node = await self.arango_repo.create_node(
            collection_name=collection_name,
            properties=node_data,
            node_id=node_id
        )
        
        # 在PostgreSQL中保存元数据（用于兼容）
        # 创建node_data的副本，确保id字段正确
        postgres_data = node_data.copy()
        postgres_data['id'] = node_id
        node = GraphNode(**postgres_data)
        self.session.add(node)
        await self.session.commit()
        await self.session.refresh(node)
        return node
    
    def _get_collection_name(self, node_type: str) -> str:
        """根据节点类型确定ArangoDB集合名称"""
        type_mapping = {
            'material': 'materials',
            'concept': 'concepts', 
            'entity': 'entities',
            'paper': 'papers'
        }
        return type_mapping.get(node_type, 'entities')
    
    async def create_batch(self, nodes_data: List[Dict[str, Any]]) -> List[GraphNode]:
        """批量创建节点"""
        nodes = []
        for node_data in nodes_data:
            # 使用数据中的id，如果没有则生成新的
            node_id = node_data.get('id', str(uuid.uuid4()))
            
            # 创建node_data的副本，确保id字段正确
            postgres_data = node_data.copy()
            postgres_data['id'] = node_id
            node = GraphNode(**postgres_data)
            nodes.append(node)
        
        self.session.add_all(nodes)
        await self.session.commit()
        return nodes
    
    async def get_by_id(self, node_id: str) -> Optional[GraphNode]:
        """根据ID获取节点"""
        stmt = select(GraphNode).where(GraphNode.id == node_id)
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()
    
    async def get_all(
        self, 
        skip: int = 0, 
        limit: int = 1000,
        node_types: Optional[List[str]] = None
    ) -> List[GraphNode]:
        """获取所有节点（支持分页和类型过滤）"""
        stmt = select(GraphNode)
        
        if node_types:
            stmt = stmt.where(GraphNode.type.in_(node_types))
        
        stmt = stmt.offset(skip).limit(limit).order_by(GraphNode.created_at.desc())
        result = await self.session.execute(stmt)
        return result.scalars().all()
    
    async def search_by_label(self, query: str, limit: int = 50) -> List[GraphNode]:
        """根据标签搜索节点"""
        stmt = (
            select(GraphNode)
            .where(GraphNode.label.ilike(f"%{query}%"))
            .limit(limit)
            .order_by(GraphNode.connections.desc())
        )
        result = await self.session.execute(stmt)
        return result.scalars().all()
    
    async def get_by_type(self, node_type: str) -> List[GraphNode]:
        """根据类型获取节点"""
        stmt = select(GraphNode).where(GraphNode.type == node_type)
        result = await self.session.execute(stmt)
        return result.scalars().all()
    
    async def get_connected_nodes(self, node_id: str, depth: int = 1) -> List[GraphNode]:
        """获取与指定节点连接的节点"""
        # 获取直接连接的节点
        stmt = text("""
            WITH RECURSIVE connected_nodes AS (
                -- 基础情况：指定节点
                SELECT id, label, type, properties, connections, level, 0 as depth
                FROM graph_nodes 
                WHERE id = :node_id
                
                UNION ALL
                
                -- 递归情况：连接的节点
                SELECT DISTINCT n.id, n.label, n.type, n.properties, n.connections, n.level, cn.depth + 1
                FROM graph_nodes n
                JOIN graph_edges e ON (e.from_node_id = n.id OR e.to_node_id = n.id)
                JOIN connected_nodes cn ON (
                    (e.from_node_id = cn.id OR e.to_node_id = cn.id) 
                    AND e.from_node_id != e.to_node_id
                    AND cn.depth < :depth
                )
                WHERE n.id != cn.id
            )
            SELECT DISTINCT id, label, type, properties, connections, level
            FROM connected_nodes
            WHERE depth > 0
        """)
        
        result = await self.session.execute(stmt, {"node_id": node_id, "depth": depth})
        # 将结果转换为GraphNode对象
        nodes = []
        for row in result:
            node = GraphNode(
                id=row.id,
                label=row.label,
                type=row.type,
                properties=row.properties,
                connections=row.connections,
                level=row.level
            )
            nodes.append(node)
        return nodes
    
    async def get_high_connectivity_nodes(self, min_connections: int = 5, limit: int = 50) -> List[GraphNode]:
        """获取高连接度的节点"""
        stmt = (
            select(GraphNode)
            .where(GraphNode.connections >= min_connections)
            .order_by(GraphNode.connections.desc())
            .limit(limit)
        )
        result = await self.session.execute(stmt)
        return result.scalars().all()
    
    async def update(self, node_id: str, update_data: Dict[str, Any]) -> Optional[GraphNode]:
        """更新节点"""
        stmt = (
            update(GraphNode)
            .where(GraphNode.id == node_id)
            .values(**update_data)
            .returning(GraphNode)
        )
        result = await self.session.execute(stmt)
        await self.session.commit()
        return result.scalar_one_or_none()
    
    async def delete(self, node_id: str) -> bool:
        """删除节点（同时删除相关的边）"""
        # 先删除相关的边
        await self.session.execute(
            delete(GraphEdge).where(
                or_(GraphEdge.from_node_id == node_id, GraphEdge.to_node_id == node_id)
            )
        )
        
        # 删除节点
        stmt = delete(GraphNode).where(GraphNode.id == node_id)
        result = await self.session.execute(stmt)
        await self.session.commit()
        return result.rowcount > 0
    
    async def update_connections_count(self, node_id: str) -> bool:
        """更新节点的连接数"""
        # 统计节点的连接数
        count_stmt = (
            select(func.count())
            .select_from(GraphEdge)
            .where(or_(GraphEdge.from_node_id == node_id, GraphEdge.to_node_id == node_id))
        )
        connections_count = await self.session.scalar(count_stmt)
        
        # 更新节点
        stmt = (
            update(GraphNode)
            .where(GraphNode.id == node_id)
            .values(connections=connections_count)
        )
        result = await self.session.execute(stmt)
        await self.session.commit()
        return result.rowcount > 0
    
    async def batch_update_connections_count(self, node_ids: List[str]) -> int:
        """批量更新节点的连接数"""
        updated_count = 0
        try:
            for node_id in node_ids:
                # 统计节点的连接数
                count_stmt = (
                    select(func.count())
                    .select_from(GraphEdge)
                    .where(or_(GraphEdge.from_node_id == node_id, GraphEdge.to_node_id == node_id))
                )
                connections_count = await self.session.scalar(count_stmt)
                
                # 更新节点
                stmt = (
                    update(GraphNode)
                    .where(GraphNode.id == node_id)
                    .values(connections=connections_count)
                )
                result = await self.session.execute(stmt)
                if result.rowcount > 0:
                    updated_count += 1
            
            # 单次提交所有更新
            await self.session.commit()
            return updated_count
        except Exception as e:
            await self.session.rollback()
            from core.logger import logger
            logger.error(f"批量更新节点连接数失败: {e}")
            raise


class GraphEdgeRepository:
    """图谱边仓库 - 基于ArangoDB"""
    
    def __init__(self, session: AsyncSession):
        self.session = session
        self.arango_repo = get_arango_graph_repository()
        if self.arango_repo is None:
            from core.logger import logger
            logger.warning("ArangoDB仓库未就绪，图边仓库将跳过ArangoDB相关操作")
    
    async def create(self, edge_data: Dict[str, Any]) -> GraphEdge:
        """创建新边"""
        # 使用数据中的id，如果没有则生成新的
        edge_id = edge_data.get('id', str(uuid.uuid4()))
        
        # 确定边集合名称
        edge_collection = self._get_edge_collection_name(edge_data.get('type', 'relationships'))
        
        # 在ArangoDB中创建边
        arango_edge = await self.arango_repo.create_edge(
            edge_collection=edge_collection,
            from_node_id=edge_data['from_node_id'],
            to_node_id=edge_data['to_node_id'],
            from_collection=self._infer_collection_from_node(edge_data['from_node_id']),
            to_collection=self._infer_collection_from_node(edge_data['to_node_id']),
            properties=edge_data,
            edge_id=edge_id
        )
        
        # 在PostgreSQL中保存元数据（用于兼容）
        # 创建edge_data的副本，确保id字段正确
        postgres_data = edge_data.copy()
        postgres_data['id'] = edge_id
        edge = GraphEdge(**postgres_data)
        self.session.add(edge)
        await self.session.commit()
        await self.session.refresh(edge)
        return edge
    
    def _get_edge_collection_name(self, edge_type: str) -> str:
        """根据边类型确定ArangoDB集合名称"""
        type_mapping = {
            'citation': 'citations',
            'contains': 'contains',
            'relationship': 'relationships'
        }
        return type_mapping.get(edge_type, 'relationships')
    
    def _infer_collection_from_node(self, node_id: str) -> str:
        """从节点ID推断集合名称（这里简化处理，实际可能需要查询）"""
        # 这里可以根据实际需求实现更复杂的逻辑
        return 'entities'
    
    async def create_batch(self, edges_data: List[Dict[str, Any]]) -> List[GraphEdge]:
        """批量创建边"""
        edges = []
        affected_nodes = set()
        
        for edge_data in edges_data:
            # 使用数据中的id，如果没有则生成新的
            edge_id = edge_data.get('id', str(uuid.uuid4()))
            
            # 创建edge_data的副本，确保id字段正确
            postgres_data = edge_data.copy()
            postgres_data['id'] = edge_id
            edge = GraphEdge(**postgres_data)
            edges.append(edge)
            affected_nodes.add(edge.from_node_id)
            affected_nodes.add(edge.to_node_id)
        
        try:
            self.session.add_all(edges)
            await self.session.commit()
            
            # 批量更新相关节点的连接数（异步批处理）
            if affected_nodes:
                node_repo = GraphNodeRepository(self.session)
                await node_repo.batch_update_connections_count(list(affected_nodes))
            
            return edges
        except Exception as e:
            await self.session.rollback()
            from core.logger import logger
            logger.error(f"批量创建边失败: {e}")
            raise
    
    async def get_by_id(self, edge_id: str) -> Optional[GraphEdge]:
        """根据ID获取边"""
        stmt = select(GraphEdge).where(GraphEdge.id == edge_id)
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()
    
    async def get_all(
        self, 
        skip: int = 0, 
        limit: int = 1000,
        edge_types: Optional[List[str]] = None
    ) -> List[GraphEdge]:
        """获取所有边（支持分页和类型过滤）"""
        stmt = select(GraphEdge)
        
        if edge_types:
            stmt = stmt.where(GraphEdge.type.in_(edge_types))
        
        stmt = stmt.offset(skip).limit(limit).order_by(GraphEdge.created_at.desc())
        result = await self.session.execute(stmt)
        return result.scalars().all()
    
    async def get_node_edges(self, node_id: str) -> List[GraphEdge]:
        """获取节点的所有边"""
        stmt = (
            select(GraphEdge)
            .where(or_(GraphEdge.from_node_id == node_id, GraphEdge.to_node_id == node_id))
            .options(selectinload(GraphEdge.from_node), selectinload(GraphEdge.to_node))
        )
        result = await self.session.execute(stmt)
        return result.scalars().all()
    
    async def get_edge_between_nodes(self, from_node_id: str, to_node_id: str) -> List[GraphEdge]:
        """获取两个节点之间的边"""
        stmt = select(GraphEdge).where(
            and_(GraphEdge.from_node_id == from_node_id, GraphEdge.to_node_id == to_node_id)
        )
        result = await self.session.execute(stmt)
        return result.scalars().all()
    
    async def get_by_type(self, edge_type: str) -> List[GraphEdge]:
        """根据类型获取边"""
        stmt = select(GraphEdge).where(GraphEdge.type == edge_type)
        result = await self.session.execute(stmt)
        return result.scalars().all()
    
    async def update(self, edge_id: str, update_data: Dict[str, Any]) -> Optional[GraphEdge]:
        """更新边"""
        stmt = (
            update(GraphEdge)
            .where(GraphEdge.id == edge_id)
            .values(**update_data)
            .returning(GraphEdge)
        )
        result = await self.session.execute(stmt)
        await self.session.commit()
        return result.scalar_one_or_none()
    
    async def delete(self, edge_id: str) -> bool:
        """删除边"""
        # 先获取边信息以便更新相关节点的连接数
        edge = await self.get_by_id(edge_id)
        if not edge:
            return False
        
        stmt = delete(GraphEdge).where(GraphEdge.id == edge_id)
        result = await self.session.execute(stmt)
        await self.session.commit()
        
        if result.rowcount > 0:
            # 更新相关节点的连接数
            node_repo = GraphNodeRepository(self.session)
            await node_repo.update_connections_count(edge.from_node_id)
            await node_repo.update_connections_count(edge.to_node_id)
            return True
        
        return False


class GraphLayoutRepository:
    """图谱布局仓库"""
    
    def __init__(self, session: AsyncSession):
        self.session = session
    
    async def create(self, layout_data: Dict[str, Any]) -> GraphLayout:
        """创建布局配置"""
        layout_id = str(uuid.uuid4())
        layout = GraphLayout(id=layout_id, **layout_data)
        
        # 如果设置为默认布局，先取消其他默认布局
        if layout_data.get("is_default"):
            await self._unset_other_defaults()
        
        self.session.add(layout)
        await self.session.commit()
        await self.session.refresh(layout)
        return layout
    
    async def get_by_id(self, layout_id: str) -> Optional[GraphLayout]:
        """根据ID获取布局"""
        stmt = select(GraphLayout).where(GraphLayout.id == layout_id)
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()
    
    async def get_default(self) -> Optional[GraphLayout]:
        """获取默认布局"""
        stmt = select(GraphLayout).where(GraphLayout.is_default == True)
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()
    
    async def get_all(self) -> List[GraphLayout]:
        """获取所有布局"""
        stmt = select(GraphLayout).order_by(GraphLayout.created_at.desc())
        result = await self.session.execute(stmt)
        return result.scalars().all()
    
    async def update(self, layout_id: str, update_data: Dict[str, Any]) -> Optional[GraphLayout]:
        """更新布局"""
        # 如果要设置为默认布局，先取消其他默认布局
        if update_data.get("is_default"):
            await self._unset_other_defaults()
        
        stmt = (
            update(GraphLayout)
            .where(GraphLayout.id == layout_id)
            .values(**update_data)
            .returning(GraphLayout)
        )
        result = await self.session.execute(stmt)
        await self.session.commit()
        return result.scalar_one_or_none()
    
    async def delete(self, layout_id: str) -> bool:
        """删除布局"""
        stmt = delete(GraphLayout).where(GraphLayout.id == layout_id)
        result = await self.session.execute(stmt)
        await self.session.commit()
        return result.rowcount > 0
    
    async def _unset_other_defaults(self):
        """取消其他默认布局"""
        stmt = update(GraphLayout).where(GraphLayout.is_default == True).values(is_default=False)
        await self.session.execute(stmt)


class GraphFilterRepository:
    """图谱过滤器仓库"""
    
    def __init__(self, session: AsyncSession):
        self.session = session
    
    async def create(self, filter_data: Dict[str, Any]) -> GraphFilter:
        """创建过滤器"""
        filter_id = str(uuid.uuid4())
        graph_filter = GraphFilter(id=filter_id, **filter_data)
        
        # 如果设置为默认过滤器，先取消其他默认过滤器
        if filter_data.get("is_default"):
            await self._unset_other_defaults(filter_data.get("user_id"))
        
        self.session.add(graph_filter)
        await self.session.commit()
        await self.session.refresh(graph_filter)
        return graph_filter
    
    async def get_by_id(self, filter_id: str) -> Optional[GraphFilter]:
        """根据ID获取过滤器"""
        stmt = select(GraphFilter).where(GraphFilter.id == filter_id)
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()
    
    async def get_user_filters(self, user_id: str) -> List[GraphFilter]:
        """获取用户的过滤器"""
        stmt = (
            select(GraphFilter)
            .where(GraphFilter.user_id == user_id)
            .order_by(GraphFilter.created_at.desc())
        )
        result = await self.session.execute(stmt)
        return result.scalars().all()
    
    async def get_public_filters(self) -> List[GraphFilter]:
        """获取公共过滤器"""
        stmt = (
            select(GraphFilter)
            .where(GraphFilter.user_id.is_(None))
            .order_by(GraphFilter.created_at.desc())
        )
        result = await self.session.execute(stmt)
        return result.scalars().all()
    
    async def get_default_filter(self, user_id: Optional[str] = None) -> Optional[GraphFilter]:
        """获取默认过滤器"""
        stmt = select(GraphFilter).where(GraphFilter.is_default == True)
        
        if user_id:
            stmt = stmt.where(
                or_(GraphFilter.user_id == user_id, GraphFilter.user_id.is_(None))
            )
        else:
            stmt = stmt.where(GraphFilter.user_id.is_(None))
        
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()
    
    async def update(self, filter_id: str, update_data: Dict[str, Any]) -> Optional[GraphFilter]:
        """更新过滤器"""
        # 如果要设置为默认过滤器，先取消其他默认过滤器
        if update_data.get("is_default"):
            current_filter = await self.get_by_id(filter_id)
            if current_filter:
                await self._unset_other_defaults(current_filter.user_id)
        
        stmt = (
            update(GraphFilter)
            .where(GraphFilter.id == filter_id)
            .values(**update_data)
            .returning(GraphFilter)
        )
        result = await self.session.execute(stmt)
        await self.session.commit()
        return result.scalar_one_or_none()
    
    async def delete(self, filter_id: str) -> bool:
        """删除过滤器"""
        stmt = delete(GraphFilter).where(GraphFilter.id == filter_id)
        result = await self.session.execute(stmt)
        await self.session.commit()
        return result.rowcount > 0
    
    async def _unset_other_defaults(self, user_id: Optional[str]):
        """取消其他默认过滤器"""
        stmt = update(GraphFilter).where(GraphFilter.is_default == True)
        
        if user_id:
            stmt = stmt.where(GraphFilter.user_id == user_id)
        else:
            stmt = stmt.where(GraphFilter.user_id.is_(None))
        
        stmt = stmt.values(is_default=False)
        await self.session.execute(stmt)


class GraphStatsRepository:
    """图谱统计仓库"""
    
    def __init__(self, session: AsyncSession):
        self.session = session
    
    async def calculate_and_save_stats(self, graph_version: Optional[str] = None) -> GraphStats:
        """计算并保存图谱统计信息"""
        # 计算节点数
        node_count = await self.session.scalar(select(func.count(GraphNode.id)))
        
        # 计算边数
        edge_count = await self.session.scalar(select(func.count(GraphEdge.id)))
        
        # 计算平均连接数
        avg_connections = await self.session.scalar(select(func.avg(GraphNode.connections))) or 0.0
        
        # 计算类型分布
        node_type_dist = await self.session.execute(
            select(GraphNode.type, func.count(GraphNode.id))
            .group_by(GraphNode.type)
        )
        
        edge_type_dist = await self.session.execute(
            select(GraphEdge.type, func.count(GraphEdge.id))
            .group_by(GraphEdge.type)
        )
        
        type_distribution = {
            "nodes": dict(node_type_dist.all()),
            "edges": dict(edge_type_dist.all())
        }
        
        # 创建统计记录
        stats_id = str(uuid.uuid4())
        stats = GraphStats(
            id=stats_id,
            node_count=node_count or 0,
            edge_count=edge_count or 0,
            avg_connections=avg_connections,
            type_distribution=type_distribution,
            graph_version=graph_version
        )
        
        self.session.add(stats)
        await self.session.commit()
        await self.session.refresh(stats)
        return stats
    
    async def get_latest_stats(self) -> Optional[GraphStats]:
        """获取最新的统计信息"""
        stmt = select(GraphStats).order_by(GraphStats.last_updated.desc()).limit(1)
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()
    
    async def get_stats_by_version(self, graph_version: str) -> Optional[GraphStats]:
        """根据版本获取统计信息"""
        stmt = select(GraphStats).where(GraphStats.graph_version == graph_version)
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()


class GraphSnapshotRepository:
    """图谱快照仓库"""
    
    def __init__(self, session: AsyncSession):
        self.session = session
    
    async def create_snapshot(
        self, 
        name: str, 
        description: Optional[str] = None,
        created_by: Optional[str] = None
    ) -> GraphSnapshot:
        """创建图谱快照"""
        # 获取所有节点和边的数据
        nodes = await self.session.execute(select(GraphNode))
        edges = await self.session.execute(select(GraphEdge))
        
        nodes_data = [
            {
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
            for node in nodes.scalars().all()
        ]
        
        edges_data = [
            {
                "id": edge.id,
                "from_node_id": edge.from_node_id,
                "to_node_id": edge.to_node_id,
                "label": edge.label,
                "type": edge.type,
                "properties": edge.properties,
                "weight": edge.weight,
                "color": edge.color
            }
            for edge in edges.scalars().all()
        ]
        
        # 创建快照
        snapshot_id = str(uuid.uuid4())
        snapshot = GraphSnapshot(
            id=snapshot_id,
            name=name,
            description=description,
            nodes_data=nodes_data,
            edges_data=edges_data,
            node_count=len(nodes_data),
            edge_count=len(edges_data),
            created_by=created_by
        )
        
        self.session.add(snapshot)
        await self.session.commit()
        await self.session.refresh(snapshot)
        return snapshot
    
    async def get_by_id(self, snapshot_id: str) -> Optional[GraphSnapshot]:
        """根据ID获取快照"""
        stmt = select(GraphSnapshot).where(GraphSnapshot.id == snapshot_id)
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()
    
    async def get_all(self, skip: int = 0, limit: int = 100) -> List[GraphSnapshot]:
        """获取所有快照"""
        stmt = (
            select(GraphSnapshot)
            .offset(skip)
            .limit(limit)
            .order_by(GraphSnapshot.created_at.desc())
        )
        result = await self.session.execute(stmt)
        return result.scalars().all()
    
    async def delete(self, snapshot_id: str) -> bool:
        """删除快照"""
        stmt = delete(GraphSnapshot).where(GraphSnapshot.id == snapshot_id)
        result = await self.session.execute(stmt)
        await self.session.commit()
        return result.rowcount > 0