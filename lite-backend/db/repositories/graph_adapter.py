"""
图数据库适配器 - 统一新旧系统的API调用接口
解决arangodb_graph_repository与API层方法不匹配的问题
"""
from typing import List, Optional, Dict, Any
from db.repositories.arangodb_graph_repository import get_arango_graph_repository
from core.logger import logger


class GraphAdapter:
    """图数据库适配器 - 兼容现有API调用"""
    
    def __init__(self):
        self.arango_repo = get_arango_graph_repository()
        if self.arango_repo is None:
            logger.warning("ArangoDB仓库未就绪，图适配器将跳过相关操作")
    
    def _format_node_for_frontend(self, node_data: Dict[str, Any]) -> Dict[str, Any]:
        """将ArangoDB节点数据转换为前端期望的格式"""
        return {
            "id": node_data.get("_key") or node_data.get("id"),
            "label": node_data.get("label") or node_data.get("name") or node_data.get("title", ""),
            "type": node_data.get("type", "entity"),
            "properties": node_data.get("properties", {}),
            "x": node_data.get("x") or node_data.get("position", {}).get("x"),
            "y": node_data.get("y") or node_data.get("position", {}).get("y"),
            "color": node_data.get("color"),
            "size": node_data.get("size", 20),
            "connections": node_data.get("connections", 0),
            "level": node_data.get("level", 1),
            "position": {
                "x": node_data.get("x") or node_data.get("position", {}).get("x", 0),
                "y": node_data.get("y") or node_data.get("position", {}).get("y", 0)
            }
        }
    
    def _get_node_color_by_type(self, node_type: str) -> str:
        """根据节点类型返回颜色"""
        color_mapping = {
            'geopolymerproduct': '#1890ff',  # 蓝色 - 地聚物产品
            'precursor': '#52c41a',          # 绿色 - 前体材料
            'parameter': '#faad14',          # 橙色 - 参数
            'curingprocess': '#f5222d',      # 红色 - 固化工艺
            'processingequipment': '#722ed1', # 紫色 - 加工设备
            'researcher': '#13c2c2',         # 青色 - 研究人员
            'location': '#eb2f96',           # 粉色 - 位置
            'phenomenon': '#a0d911',         # 浅绿 - 现象
            'admixture': '#ffc53d',          # 黄色 - 外加剂
            'polymermatrix': '#40a9ff',      # 浅蓝 - 聚合物基体
            'inorganicfiber': '#b37feb',     # 浅紫 - 无机纤维
            # 通用类型
            'material': '#1890ff',
            'chemical_compound': '#52c41a',
            'property': '#faad14',
            'process': '#f5222d',
            'structure': '#722ed1',
            'test_method': '#13c2c2',
            'entity': '#8c8c8c',             # 灰色 - 通用实体
            'concept': '#595959',            # 深灰 - 概念
            'unknown': '#d9d9d9'             # 浅灰 - 未知类型
        }
        return color_mapping.get(node_type, '#8c8c8c')
    
    def _get_edge_color_by_type(self, edge_type: str) -> str:
        """根据边类型返回颜色"""
        color_mapping = {
            'IS_PRECURSOR_OF': '#52c41a',    # 绿色 - 前体关系
            'DIFFERENT_FROM': '#f5222d',     # 红色 - 差异关系
            'SIMILAR_TO': '#1890ff',         # 蓝色 - 相似关系
            'CONTAINS': '#faad14',           # 橙色 - 包含关系
            'RELATED_TO': '#722ed1',         # 紫色 - 相关关系
            'relationship': '#8c8c8c',       # 灰色 - 通用关系
            'citation': '#13c2c2',           # 青色 - 引用关系
            'contains': '#faad14',           # 橙色 - 包含关系
            'unknown': '#d9d9d9'             # 浅灰 - 未知类型
        }
        return color_mapping.get(edge_type, '#8c8c8c')
    
    def _format_edge_for_frontend(self, edge_data: Dict[str, Any]) -> Dict[str, Any]:
        """将ArangoDB边数据转换为前端期望的格式"""
        return {
            "id": edge_data.get("_key") or edge_data.get("id"),
            "from": edge_data.get("_from", "").split("/")[-1] if edge_data.get("_from") else edge_data.get("from_node_id") or edge_data.get("from"),
            "to": edge_data.get("_to", "").split("/")[-1] if edge_data.get("_to") else edge_data.get("to_node_id") or edge_data.get("to"),
            "label": edge_data.get("label", ""),
            "type": edge_data.get("type", "relationship"),
            "properties": edge_data.get("properties", {}),
            "weight": edge_data.get("weight", 1.0),
            "color": edge_data.get("color")
        }
    
    async def get_nodes(
        self,
        filters: Optional[Dict[str, Any]] = None,
        limit: int = 100
    ) -> List[Dict[str, Any]]:
        """获取节点 - 适配API调用，优先使用PostgreSQL数据"""
        all_nodes = []
        arango_nodes = []
        pg_nodes = []
        
        # 首先检查PostgreSQL中的数据
        try:
            logger.info("检查PostgreSQL节点数据...")
            from db.database import get_async_session
            from models.graph import GraphNode
            from sqlalchemy import select, func
            
            async with get_async_session() as session:
                # 获取PostgreSQL节点总数
                count_result = await session.execute(select(func.count(GraphNode.id)))
                pg_count = count_result.scalar() or 0
                logger.info(f"PostgreSQL中有 {pg_count} 个节点")
                
                if pg_count > 0:
                    # 构建查询
                    query = select(GraphNode)
                    
                    # 应用筛选条件
                    if filters and filters.get('node_types'):
                        query = query.where(GraphNode.type.in_(filters['node_types']))
                    
                    if filters and filters.get('search'):
                        search_text = f"%{filters['search']}%"
                        query = query.where(GraphNode.label.ilike(search_text))
                    
                    # 应用限制
                    query = query.limit(limit)
                    
                    # 执行查询
                    result = await session.execute(query)
                    pg_nodes_data = result.scalars().all()
                    
                    # 转换为前端格式
                    for node in pg_nodes_data:
                        pg_nodes.append({
                            'id': node.id,
                            'label': node.label,
                            'type': node.type,
                            'properties': node.properties or {},
                            'x': None,  # PostgreSQL中没有存储位置信息
                            'y': None,
                            'color': self._get_node_color_by_type(node.type),
                            'size': 20  # 默认大小
                        })
                    
                    logger.info(f"从PostgreSQL获取到 {len(pg_nodes)} 个节点")
                    
        except Exception as e:
            logger.warning(f"从PostgreSQL获取节点失败: {e}")
        
        # 如果PostgreSQL有数据，优先使用PostgreSQL数据
        if pg_nodes:
            logger.info(f"使用PostgreSQL数据 ({len(pg_nodes)} 个节点)")
            all_nodes = pg_nodes
        else:
            # 回退到ArangoDB
            try:
                logger.info("PostgreSQL无数据，回退到ArangoDB...")
                collections = ['entities', 'concepts', 'materials', 'papers']
                
                for collection in collections:
                    nodes = await self.arango_repo.get_nodes_by_collection(
                        collection_name=collection,
                        limit=limit,
                        offset=0
                    )
                    # 格式化每个节点
                    formatted_nodes = [self._format_node_for_frontend(node) for node in nodes]
                    arango_nodes.extend(formatted_nodes)
                
                logger.info(f"从ArangoDB获取到 {len(arango_nodes)} 个节点")
                all_nodes = arango_nodes
                
            except Exception as e:
                logger.warning(f"从ArangoDB获取节点失败: {e}")
        
        # 处理搜索过滤（如果还没有在数据库查询中应用）
        if filters and filters.get('search') and all_nodes:
            search_text = filters['search'].lower()
            all_nodes = [
                node for node in all_nodes
                if search_text in node.get('label', '').lower()
            ]
        
        # 处理节点类型过滤（如果还没有在数据库查询中应用）
        if filters and filters.get('node_types') and all_nodes:
            node_types = filters['node_types']
            all_nodes = [
                node for node in all_nodes
                if node.get('type') in node_types
            ]
        
        return all_nodes[:limit]
    
    async def get_edges(self, filters: Optional[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
        """获取边 - 适配API调用，支持PostgreSQL回退"""
        formatted_edges = []
        
        # 优先从ArangoDB获取数据
        try:
            aql = """
                FOR edge IN UNION_DISTINCT(
                    (FOR e IN relationships RETURN e),
                    (FOR e IN citations RETURN e),
                    (FOR e IN contains RETURN e)
                )
                LIMIT 1000
                RETURN edge
            """
            edges_data = await self.arango_repo.execute_aql(aql)
            
            # 格式化边数据
            formatted_edges = [self._format_edge_for_frontend(edge) for edge in edges_data]
            logger.info(f"从ArangoDB获取到 {len(formatted_edges)} 条边")
            
        except Exception as e:
            logger.warning(f"从ArangoDB获取边失败: {e}")
        
        # 如果ArangoDB没有数据或获取失败，回退到PostgreSQL
        if not formatted_edges:
            try:
                logger.info("ArangoDB无数据，回退到PostgreSQL获取边")
                from db.database import get_async_session
                from models.graph import GraphEdge
                from sqlalchemy import select
                
                async with get_async_session() as session:
                    # 构建查询
                    query = select(GraphEdge)
                    
                    # 应用筛选条件
                    if filters and filters.get('edge_types'):
                        query = query.where(GraphEdge.type.in_(filters['edge_types']))
                    
                    # 应用限制
                    query = query.limit(1000)
                    
                    # 执行查询
                    result = await session.execute(query)
                    pg_edges = result.scalars().all()
                    
                    # 转换为前端格式
                    for edge in pg_edges:
                        formatted_edges.append({
                            'id': edge.id,
                            'from': edge.from_node_id,
                            'to': edge.to_node_id,
                            'label': edge.label or '',
                            'type': edge.type,
                            'properties': edge.properties or {},
                            'weight': edge.weight or 1.0,
                            'color': self._get_edge_color_by_type(edge.type)
                        })
                    
                    logger.info(f"从PostgreSQL获取到 {len(formatted_edges)} 条边")
                    
            except Exception as e:
                logger.error(f"从PostgreSQL获取边失败: {e}")
        
        # 处理边类型过滤（如果还没有在数据库查询中应用）
        if filters and filters.get('edge_types') and formatted_edges:
            edge_types = filters['edge_types']
            formatted_edges = [
                edge for edge in formatted_edges
                if edge.get('type') in edge_types
            ]
        
        return formatted_edges
    
    async def get_graph_stats(self) -> Dict[str, Any]:
        """获取图统计信息"""
        try:
            # 首先尝试从ArangoDB获取统计
            arango_stats = None
            if self.arango_repo:
                try:
                    arango_stats = await self.arango_repo.get_graph_stats()
                except Exception as arango_error:
                    logger.warning(f"ArangoDB统计获取失败，使用PostgreSQL回退: {arango_error}")
            
            # 从PostgreSQL获取实际统计作为回退
            from db.database import get_async_session
            from sqlalchemy import func, select
            from models.graph import GraphNode, GraphEdge
            
            pg_node_count = 0
            pg_edge_count = 0
            
            try:
                async with get_async_session() as session:
                    # 获取节点数量
                    node_count_result = await session.execute(select(func.count(GraphNode.id)))
                    pg_node_count = node_count_result.scalar() or 0
                    
                    # 获取边数量
                    edge_count_result = await session.execute(select(func.count(GraphEdge.id)))
                    pg_edge_count = edge_count_result.scalar() or 0
            except Exception as pg_error:
                logger.error(f"PostgreSQL统计获取失败: {pg_error}")
            
            # 优先使用PostgreSQL的实际数据
            node_count = pg_node_count
            edge_count = pg_edge_count
            
            # 如果PostgreSQL没有数据且ArangoDB有数据，使用ArangoDB
            if arango_stats and pg_node_count == 0:
                node_count = arango_stats.get('nodes', {}).get('total', 0)
                edge_count = arango_stats.get('edges', {}).get('total', 0)
            
            logger.info(f"图谱统计: PostgreSQL节点={pg_node_count} 边={pg_edge_count}, ArangoDB统计={'有' if arango_stats else '无'}")
            
            # 返回前端期望的格式
            return {
                "nodeCount": node_count,
                "edgeCount": edge_count,
                "typeDistribution": arango_stats.get('nodes', {}) if arango_stats else {},
                "avgConnections": 0.0  # 可以根据实际数据计算
            }
            
        except Exception as e:
            logger.error(f"获取图统计失败: {e}")
            return {
                "nodeCount": 0,
                "edgeCount": 0,
                "typeDistribution": {},
                "avgConnections": 0.0
            }
    
    async def get_all_node_types(self) -> List[str]:
        """获取所有节点类型"""
        return ['entity', 'concept', 'material', 'paper']
    
    async def get_all_edge_types(self) -> List[str]:
        """获取所有边类型"""
        return ['relationship', 'citation', 'contains']
    
    async def get_node_by_id(self, node_id: str) -> Optional[Dict[str, Any]]:
        """根据ID获取节点"""
        collections = ['entities', 'concepts', 'materials', 'papers']
        
        for collection in collections:
            node = await self.arango_repo.get_node_by_id(collection, node_id)
            if node:
                return self._format_node_for_frontend(node)
        
        return None
    
    async def get_edge_by_id(self, edge_id: str) -> Optional[Dict[str, Any]]:
        """根据ID获取边"""
        edge_collections = ['relationships', 'citations', 'contains']
        
        for collection in edge_collections:
            edge = await self.arango_repo.get_edge_by_id(collection, edge_id)
            if edge:
                return self._format_edge_for_frontend(edge)
        
        return None
    
    async def create_node(
        self,
        node_id: str,
        label: str,
        node_type: str,
        properties: Dict[str, Any]
    ) -> Dict[str, Any]:
        """创建节点"""
        # 映射node_type到集合名称
        type_to_collection = {
            'entity': 'entities',
            'concept': 'concepts',
            'material': 'materials', 
            'paper': 'papers'
        }
        
        collection = type_to_collection.get(node_type, 'entities')
        
        node_data = {
            'label': label,
            'type': node_type,
            **properties
        }
        
        return await self.arango_repo.create_node(collection, node_data, node_id)
    
    async def create_edge(
        self,
        edge_id: str,
        from_node: str,
        to_node: str,
        label: str,
        edge_type: str,
        properties: Dict[str, Any]
    ) -> Dict[str, Any]:
        """创建边"""
        # 映射edge_type到集合名称
        type_to_collection = {
            'relationship': 'relationships',
            'citation': 'citations',
            'contains': 'contains'
        }
        
        edge_collection = type_to_collection.get(edge_type, 'relationships')
        
        # 推断源和目标集合（简化处理）
        from_collection = 'entities'  # 可以改进为动态检测
        to_collection = 'entities'
        
        edge_data = {
            'label': label,
            'type': edge_type,
            **properties
        }
        
        return await self.arango_repo.create_edge(
            edge_collection=edge_collection,
            from_node_id=from_node,
            to_node_id=to_node,
            from_collection=from_collection,
            to_collection=to_collection,
            properties=edge_data,
            edge_id=edge_id
        )
    
    async def update_node(self, node_id: str, updates: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """更新节点"""
        # 先找到节点所在的集合
        node = await self.get_node_by_id(node_id)
        if not node:
            return None
        
        # 从_id中推断集合名称
        collection_name = node.get('_id', '').split('/')[0]
        if not collection_name:
            collection_name = 'entities'
        
        return await self.arango_repo.update_node(collection_name, node_id, updates)
    
    async def update_edge(self, edge_id: str, updates: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """更新边"""
        # 先找到边所在的集合
        edge = await self.get_edge_by_id(edge_id)
        if not edge:
            return None
        
        # 从_id中推断集合名称
        collection_name = edge.get('_id', '').split('/')[0]
        if not collection_name:
            collection_name = 'relationships'
        
        return await self.arango_repo.update_edge(collection_name, edge_id, updates)
    
    async def delete_node(self, node_id: str) -> bool:
        """删除节点"""
        # 先找到节点所在的集合
        node = await self.get_node_by_id(node_id)
        if not node:
            return False
        
        collection_name = node.get('_id', '').split('/')[0]
        if not collection_name:
            collection_name = 'entities'
        
        return await self.arango_repo.delete_node(collection_name, node_id)
    
    async def delete_edge(self, edge_id: str) -> bool:
        """删除边"""
        # 先找到边所在的集合
        edge = await self.get_edge_by_id(edge_id)
        if not edge:
            return False
        
        collection_name = edge.get('_id', '').split('/')[0]
        if not collection_name:
            collection_name = 'relationships'
        
        return await self.arango_repo.delete_edge(collection_name, edge_id)
    
    async def search_nodes(
        self,
        query: str,
        filters: Optional[Dict[str, Any]] = None,
        limit: int = 50
    ) -> List[Dict[str, Any]]:
        """搜索节点"""
        try:
            collections = ['entities', 'concepts', 'materials', 'papers']
            
            if filters and filters.get('node_types'):
                type_to_collection = {
                    'entity': 'entities',
                    'concept': 'concepts',
                    'material': 'materials',
                    'paper': 'papers'
                }
                collections = [type_to_collection.get(nt, 'entities') for nt in filters['node_types']]
            
            search_results = await self.arango_repo.search_nodes_by_text(
                search_text=query,
                collections=collections,
                limit=limit
            )
            
            # 格式化搜索结果
            return [self._format_node_for_frontend(node) for node in search_results]
            
        except Exception as e:
            logger.error(f"搜索节点失败: {e}")
            return []
    
    async def get_node_neighbors(self, node_id: str, depth: int = 1) -> List[Dict[str, Any]]:
        """获取节点邻居"""
        try:
            # 需要先确定节点的集合
            node = await self.get_node_by_id(node_id)
            if not node:
                return []
            
            # 通过AQL查询获取邻居
            aql = """
                FOR vertex, edge, path IN 1..@depth ANY @node_ref 
                    relationships, citations, contains
                RETURN {
                    vertex: vertex,
                    edge: edge,
                    depth: LENGTH(path.vertices) - 1
                }
            """
            
            # 构造节点引用
            node_ref = f"entities/{node_id}"  # 简化处理，实际应该动态检测集合
            
            results = await self.arango_repo.execute_aql(aql, {
                'node_ref': node_ref, 
                'depth': depth
            })
            
            neighbors = []
            for result in results:
                if result.get('vertex'):
                    neighbors.append(self._format_node_for_frontend(result['vertex']))
            
            return neighbors
            
        except Exception as e:
            logger.error(f"获取节点邻居失败: {e}")
            return []
    
    async def get_node_edges(self, node_id: str) -> List[Dict[str, Any]]:
        """获取节点的边"""
        try:
            aql = """
                FOR edge IN UNION_DISTINCT(
                    (FOR e IN relationships 
                     FILTER CONTAINS(e._from, @node_id) OR CONTAINS(e._to, @node_id) 
                     RETURN e),
                    (FOR e IN citations 
                     FILTER CONTAINS(e._from, @node_id) OR CONTAINS(e._to, @node_id) 
                     RETURN e),
                    (FOR e IN contains 
                     FILTER CONTAINS(e._from, @node_id) OR CONTAINS(e._to, @node_id) 
                     RETURN e)
                )
                RETURN edge
            """
            
            edges_data = await self.arango_repo.execute_aql(aql, {'node_id': node_id})
            return [self._format_edge_for_frontend(edge) for edge in edges_data]
            
        except Exception as e:
            logger.error(f"获取节点边失败: {e}")
            return []
    
    async def find_shortest_path(self, source: str, target: str) -> Optional[Dict[str, Any]]:
        """查找最短路径"""
        try:
            # 简化实现：使用AQL查询最短路径
            aql = """
                FOR vertex, edge IN OUTBOUND SHORTEST_PATH 
                    @source TO @target relationships, citations, contains
                RETURN {
                    vertex: vertex,
                    edge: edge
                }
            """
            
            results = await self.arango_repo.execute_aql(aql, {
                'source': f"entities/{source}",
                'target': f"entities/{target}"
            })
            
            if not results:
                return None
            
            path_nodes = []
            path_edges = []
            
            for result in results:
                if result.get('vertex'):
                    path_nodes.append(self._format_node_for_frontend(result['vertex']))
                if result.get('edge'):
                    path_edges.append(self._format_edge_for_frontend(result['edge']))
            
            return {
                "path": path_nodes,
                "edges": path_edges,
                "length": len(path_nodes)
            }
            
        except Exception as e:
            logger.error(f"查找最短路径失败: {e}")
            return None
    
    async def find_similar_nodes(self, node_id: str, limit: int = 10) -> Dict[str, Any]:
        """查找相似节点"""
        try:
            # 简化实现：基于类型查找相似节点
            node = await self.get_node_by_id(node_id)
            if not node:
                return {'nodes': [], 'similarities': []}
            
            # 查找同类型的其他节点
            similar_filter = {'node_types': [node['type']]}
            similar_nodes = await self.get_nodes(filters=similar_filter, limit=limit + 1)
            
            # 移除自己
            similar_nodes = [n for n in similar_nodes if n['id'] != node_id][:limit]
            
            return {
                'nodes': similar_nodes,
                'similarities': [0.8] * len(similar_nodes)  # 模拟相似度
            }
            
        except Exception as e:
            logger.error(f"查找相似节点失败: {e}")
            return {'nodes': [], 'similarities': []}
    
    # 导入导出方法（简化实现）
    async def export_graph_json(self) -> Dict[str, Any]:
        """导出JSON格式"""
        nodes = await self.get_nodes(limit=10000)
        edges = await self.get_edges()
        
        return {
            'nodes': nodes,
            'edges': edges,
            'exported_at': str(__import__('datetime').datetime.utcnow())
        }
    
    async def export_graph_csv(self) -> str:
        """导出CSV格式"""
        # 简化实现
        return "id,label,type\n1,test,entity\n"
    
    async def export_graph_gml(self) -> str:
        """导出GML格式"""
        # 简化实现
        return "graph [\n  node [ id 1 label \"test\" ]\n]\n"
    
    async def import_graph_json(self, data: Dict[str, Any]) -> Dict[str, int]:
        """导入JSON格式"""
        # 简化实现
        return {'nodes': 0, 'edges': 0}
    
    async def import_graph_csv(self, csv_data: str) -> Dict[str, int]:
        """导入CSV格式"""
        # 简化实现
        return {'nodes': 0, 'edges': 0}
    
    async def import_graph_gml(self, gml_data: str) -> Dict[str, int]:
        """导入GML格式"""
        # 简化实现
        return {'nodes': 0, 'edges': 0}
    
    async def delete_nodes_by_filter(self, filter_data: Dict[str, Any]) -> bool:
        """根据过滤条件删除节点"""
        try:
            if not self.arango_repo:
                logger.warning("ArangoDB仓库未就绪，无法删除节点")
                return False
            
            # 从ArangoDB删除
            source_document_id = filter_data.get("source_document_id")
            if source_document_id:
                # 删除所有节点集合中与该文档相关的节点
                collections = ["entities", "concepts", "materials", "papers"]
                for collection in collections:
                    try:
                        aql = f"""
                            FOR doc IN {collection}
                            FILTER doc.source_document_id == @doc_id
                            REMOVE doc IN {collection}
                        """
                        await self.arango_repo.execute_aql(aql, {"doc_id": source_document_id})
                        logger.info(f"已删除集合 {collection} 中文档 {source_document_id} 的相关节点")
                    except Exception as e:
                        logger.warning(f"删除集合 {collection} 中的节点失败: {e}")
            
            # 同时从PostgreSQL删除（如果有的话）
            try:
                from db.database import get_async_session
                from models.graph import GraphNode
                from sqlalchemy import delete, and_
                
                async with get_async_session() as session:
                    if source_document_id:
                        stmt = delete(GraphNode).where(GraphNode.source_document_id == source_document_id)
                        result = await session.execute(stmt)
                        await session.commit()
                        logger.info(f"已从PostgreSQL删除 {result.rowcount} 个节点")
                    
            except Exception as e:
                logger.warning(f"从PostgreSQL删除节点失败: {e}")
            
            return True
            
        except Exception as e:
            logger.error(f"删除节点失败: {e}")
            return False
    
    async def delete_edges_by_filter(self, filter_data: Dict[str, Any]) -> bool:
        """根据过滤条件删除边"""
        try:
            if not self.arango_repo:
                logger.warning("ArangoDB仓库未就绪，无法删除边")
                return False
            
            # 从ArangoDB删除
            source_document_id = filter_data.get("source_document_id")
            if source_document_id:
                # 删除所有边集合中与该文档相关的边
                edge_collections = ["relationships", "citations", "contains"]
                for collection in edge_collections:
                    try:
                        aql = f"""
                            FOR edge IN {collection}
                            FILTER edge.source_document_id == @doc_id
                            REMOVE edge IN {collection}
                        """
                        await self.arango_repo.execute_aql(aql, {"doc_id": source_document_id})
                        logger.info(f"已删除集合 {collection} 中文档 {source_document_id} 的相关边")
                    except Exception as e:
                        logger.warning(f"删除集合 {collection} 中的边失败: {e}")
            
            # 同时从PostgreSQL删除（如果有的话）
            try:
                from db.database import get_async_session
                from models.graph import GraphEdge
                from sqlalchemy import delete
                
                async with get_async_session() as session:
                    if source_document_id:
                        stmt = delete(GraphEdge).where(GraphEdge.source_document_id == source_document_id)
                        result = await session.execute(stmt)
                        await session.commit()
                        logger.info(f"已从PostgreSQL删除 {result.rowcount} 条边")
                    
            except Exception as e:
                logger.warning(f"从PostgreSQL删除边失败: {e}")
            
            return True
            
        except Exception as e:
            logger.error(f"删除边失败: {e}")
            return False


# 全局适配器实例
graph_adapter = GraphAdapter() 