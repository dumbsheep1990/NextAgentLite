"""
ArangoDB 图数据库仓库 - 支持原生AQL查询和图算法
"""
import uuid
import json
from typing import List, Optional, Dict, Any, Tuple
from datetime import datetime

from arango import ArangoClient
from arango.database import StandardDatabase
from arango.graph import Graph
from arango.collection import StandardCollection

from core.logger import logger
from core.config_optimized import optimized_config_manager


class ArangoGraphRepository:
    """ArangoDB图数据库操作仓库"""
    
    def __init__(self):
        """初始化ArangoDB连接"""
        self.config = optimized_config_manager.settings.database_arangodb
        # 创建客户端时配置超时参数
        self.client = ArangoClient(
            hosts=self.config.url,
            request_timeout=120  # 设置请求超时为2分钟，适合远程连接
        )
        self.database = None
        self.graph = None
        self._initialize_connection()
    
    def _initialize_connection(self):
        """初始化数据库连接"""
        try:
            # 首先尝试连接到系统数据库检查目标数据库是否存在
            sys_db = self.client.db(
                name='_system',
                username=self.config.username,
                password=self.config.password,
                verify=self.config.verify
            )
            
            # 检查目标数据库是否存在，不存在则创建
            if not sys_db.has_database(self.config.database):
                logger.info(f"数据库 {self.config.database} 不存在，正在创建...")
                sys_db.create_database(self.config.database)
                logger.info(f"数据库 {self.config.database} 创建成功")
            
            # 连接到目标数据库
            self.database = self.client.db(
                name=self.config.database,
                username=self.config.username,
                password=self.config.password,
                verify=self.config.verify
            )
            
            # 获取或创建图
            if self.database.has_graph(self.config.graph_name):
                self.graph = self.database.graph(self.config.graph_name)
                logger.info(f"图 {self.config.graph_name} 已存在")
            else:
                logger.info(f"图 {self.config.graph_name} 不存在，正在创建...")
                self._create_graph()
            
            logger.info(f"ArangoDB连接成功: {self.config.url}/{self.config.database}")
            
        except Exception as e:
            logger.error(f"ArangoDB连接失败: {e}")
            # 不抛出异常，允许应用继续运行
            self.database = None
            self.graph = None
    
    def _check_connection(self) -> bool:
        """检查数据库连接是否正常"""
        try:
            if not self.database:
                return False
            # 执行简单的查询来检查连接
            self.database.properties()
            return True
        except Exception as e:
            logger.warning(f"ArangoDB连接检查失败: {e}")
            return False
    
    def _ensure_connection(self):
        """确保数据库连接正常，如果连接断开则尝试重连"""
        if not self._check_connection():
            logger.info("检测到ArangoDB连接断开，尝试重新连接...")
            self._initialize_connection()
    
    def _create_graph(self):
        """创建图和集合"""
        try:
            # 先创建顶点集合
            vertex_collections = ['entities', 'concepts', 'materials', 'papers']
            for collection_name in vertex_collections:
                if not self.database.has_collection(collection_name):
                    self.database.create_collection(collection_name)
                    logger.info(f"创建顶点集合: {collection_name}")
            
            # 先创建边集合
            edge_collections = ['relationships', 'citations', 'contains']
            for collection_name in edge_collections:
                if not self.database.has_collection(collection_name):
                    self.database.create_collection(collection_name, edge=True)
                    logger.info(f"创建边集合: {collection_name}")
            
            # 定义边定义
            edge_definitions = [
                {
                    'edge_collection': 'relationships',
                    'from_vertex_collections': vertex_collections,
                    'to_vertex_collections': vertex_collections
                },
                {
                    'edge_collection': 'citations',
                    'from_vertex_collections': ['papers'],
                    'to_vertex_collections': ['papers']
                },
                {
                    'edge_collection': 'contains',
                    'from_vertex_collections': ['papers'],
                    'to_vertex_collections': ['entities', 'concepts', 'materials']
                }
            ]
            
            # 创建图（使用边定义）
            self.graph = self.database.create_graph(self.config.graph_name, edge_definitions)
            logger.info(f"图 '{self.config.graph_name}' 创建成功")
            
        except Exception as e:
            logger.error(f"创建图失败: {e}")
            raise
    
    # ============ 节点操作 ============
    
    async def create_node(
        self, 
        collection_name: str,
        properties: Dict[str, Any],
        node_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """创建节点"""
        try:
            if not node_id:
                node_id = str(uuid.uuid4())
            
            properties['_key'] = node_id
            properties['id'] = node_id
            properties['created_at'] = datetime.utcnow().isoformat()
            properties['updated_at'] = datetime.utcnow().isoformat()
            
            collection = self.database.collection(collection_name)
            result = collection.insert(properties)
            
            # 返回完整的节点信息
            return collection.get(result['_key'])
            
        except Exception as e:
            logger.error(f"创建节点失败: {e}")
            raise
    
    async def get_node_by_id(self, collection_name: str, node_id: str) -> Optional[Dict[str, Any]]:
        """根据ID获取节点"""
        try:
            collection = self.database.collection(collection_name)
            return collection.get(node_id)
        except Exception as e:
            logger.error(f"获取节点失败: {e}")
            return None
    
    async def update_node(
        self, 
        collection_name: str,
        node_id: str, 
        properties: Dict[str, Any]
    ) -> Optional[Dict[str, Any]]:
        """更新节点"""
        try:
            properties['updated_at'] = datetime.utcnow().isoformat()
            
            collection = self.database.collection(collection_name)
            collection.update({'_key': node_id}, properties)
            
            return collection.get(node_id)
            
        except Exception as e:
            logger.error(f"更新节点失败: {e}")
            return None
    
    async def delete_node(self, collection_name: str, node_id: str) -> bool:
        """删除节点"""
        try:
            collection = self.database.collection(collection_name)
            collection.delete(node_id)
            return True
        except Exception as e:
            logger.error(f"删除节点失败: {e}")
            return False
    
    async def get_nodes_by_collection(
        self, 
        collection_name: str, 
        limit: int = 100,
        offset: int = 0
    ) -> List[Dict[str, Any]]:
        """根据集合获取节点"""
        if not self.database:
            return []
            
        try:
            # 检查集合是否存在
            if not self.database.has_collection(collection_name):
                return []
            
            # 构建AQL查询
            aql = f"""
                FOR node IN {collection_name}
                LIMIT {offset}, {limit}
                RETURN node
            """
            
            # 执行查询
            cursor = self.database.aql.execute(aql)
            
            # 直接转换为列表
            return list(cursor)
            
        except Exception as e:
            logger.error(f"获取节点列表失败: {e}")
            return []
    
    # ============ 边操作 ============
    
    async def create_edge(
        self, 
        edge_collection: str,
        from_node_id: str, 
        to_node_id: str, 
        from_collection: str,
        to_collection: str,
        properties: Dict[str, Any],
        edge_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """创建边"""
        try:
            if not edge_id:
                edge_id = str(uuid.uuid4())
            
            properties['_key'] = edge_id
            properties['id'] = edge_id
            properties['_from'] = f"{from_collection}/{from_node_id}"
            properties['_to'] = f"{to_collection}/{to_node_id}"
            properties['created_at'] = datetime.utcnow().isoformat()
            properties['updated_at'] = datetime.utcnow().isoformat()
            
            collection = self.database.collection(edge_collection)
            result = collection.insert(properties)
            
            return collection.get(result['_key'])
            
        except Exception as e:
            logger.error(f"创建边失败: {e}")
            raise
    
    async def get_edge_by_id(self, edge_collection: str, edge_id: str) -> Optional[Dict[str, Any]]:
        """根据ID获取边"""
        try:
            collection = self.database.collection(edge_collection)
            return collection.get(edge_id)
        except Exception as e:
            logger.error(f"获取边失败: {e}")
            return None
    
    async def update_edge(
        self, 
        edge_collection: str,
        edge_id: str, 
        properties: Dict[str, Any]
    ) -> Optional[Dict[str, Any]]:
        """更新边"""
        try:
            properties['updated_at'] = datetime.utcnow().isoformat()
            
            collection = self.database.collection(edge_collection)
            collection.update({'_key': edge_id}, properties)
            
            return collection.get(edge_id)
            
        except Exception as e:
            logger.error(f"更新边失败: {e}")
            return None
    
    async def delete_edge(self, edge_collection: str, edge_id: str) -> bool:
        """删除边"""
        try:
            collection = self.database.collection(edge_collection)
            collection.delete(edge_id)
            return True
        except Exception as e:
            logger.error(f"删除边失败: {e}")
            return False
    
    # ============ 图查询 ============
    
    async def execute_aql(self, aql_query: str, bind_vars: Optional[Dict] = None) -> List[Dict[str, Any]]:
        """执行AQL查询"""
        if not self.database:
            return []
            
        try:
            cursor = self.database.aql.execute(
                aql_query, 
                bind_vars=bind_vars or {}
            )
            return list(cursor)
            
        except Exception as e:
            logger.error(f"AQL查询执行失败: {e}")
            return []
    
    async def get_node_neighbors(
        self, 
        collection_name: str,
        node_id: str, 
        direction: str = "ANY",  # INBOUND, OUTBOUND, ANY
        depth: int = 1,
        edge_collections: Optional[List[str]] = None
    ) -> List[Dict[str, Any]]:
        """获取节点的邻居"""
        try:
            edge_filter = ""
            if edge_collections:
                edge_collections_str = ", ".join(edge_collections)
                edge_filter = f", {edge_collections_str}"
            
            aql = f"""
                FOR vertex, edge, path IN 1..@depth {direction} @start_vertex {edge_filter}
                RETURN {{
                    vertex: vertex,
                    edge: edge,
                    path: path
                }}
            """
            
            bind_vars = {
                'start_vertex': f"{collection_name}/{node_id}",
                'depth': depth
            }
            
            return await self.execute_aql(aql, bind_vars)
            
        except Exception as e:
            logger.error(f"获取邻居节点失败: {e}")
            return []
    
    async def find_shortest_path(
        self, 
        from_collection: str,
        from_node_id: str, 
        to_collection: str,
        to_node_id: str,
        max_depth: int = 5
    ) -> Optional[Dict[str, Any]]:
        """查找最短路径"""
        try:
            aql = f"""
                FOR vertex, edge IN OUTBOUND SHORTEST_PATH 
                @start_vertex TO @target_vertex
                OPTIONS {{weightAttribute: 'weight', defaultWeight: 1}}
                RETURN {{
                    vertex: vertex,
                    edge: edge
                }}
            """
            
            bind_vars = {
                'start_vertex': f"{from_collection}/{from_node_id}",
                'target_vertex': f"{to_collection}/{to_node_id}"
            }
            
            results = await self.execute_aql(aql, bind_vars)
            return results[0] if results else None
            
        except Exception as e:
            logger.error(f"查找最短路径失败: {e}")
            return None
    
    async def find_all_paths(
        self, 
        from_collection: str,
        from_node_id: str, 
        to_collection: str,
        to_node_id: str,
        max_depth: int = 3,
        limit: int = 10
    ) -> List[Dict[str, Any]]:
        """查找所有路径"""
        try:
            aql = f"""
                FOR vertex, edge, path IN 1..@max_depth ANY @start_vertex TO @target_vertex
                LIMIT @limit
                RETURN {{
                    vertices: path.vertices,
                    edges: path.edges
                }}
            """
            
            bind_vars = {
                'start_vertex': f"{from_collection}/{from_node_id}",
                'target_vertex': f"{to_collection}/{to_node_id}",
                'max_depth': max_depth,
                'limit': limit
            }
            
            return await self.execute_aql(aql, bind_vars)
            
        except Exception as e:
            logger.error(f"查找所有路径失败: {e}")
            return []
    
    # ============ 搜索查询 ============
    
    async def search_nodes_by_text(
        self, 
        search_text: str,
        collections: Optional[List[str]] = None,
        search_properties: List[str] = ["label", "name", "title"],
        limit: int = 50
    ) -> List[Dict[str, Any]]:
        """根据文本搜索节点"""
        try:
            collections = collections or ['entities', 'concepts', 'materials', 'papers']
            
            collection_queries = []
            for collection in collections:
                property_filters = []
                for prop in search_properties:
                    property_filters.append(f"CONTAINS(LOWER(node.{prop}), LOWER(@search_text))")
                
                property_filter = " OR ".join(property_filters)
                collection_queries.append(f"""
                    (FOR node IN {collection}
                     FILTER {property_filter}
                     RETURN MERGE(node, {{collection: '{collection}'}})
                    )
                """)
            
            aql = f"""
                FOR node IN UNION({', '.join(collection_queries)})
                LIMIT @limit
                RETURN node
            """
            
            bind_vars = {
                'search_text': search_text,
                'limit': limit
            }
            
            return await self.execute_aql(aql, bind_vars)
            
        except Exception as e:
            logger.error(f"文本搜索失败: {e}")
            return []
    
    async def get_nodes_by_property(
        self, 
        collection_name: str,
        property_name: str, 
        property_value: Any,
        limit: int = 100
    ) -> List[Dict[str, Any]]:
        """根据属性值查找节点"""
        try:
            aql = f"""
                FOR node IN {collection_name}
                FILTER node.@property_name == @property_value
                LIMIT @limit
                RETURN node
            """
            
            bind_vars = {
                'property_name': property_name,
                'property_value': property_value,
                'limit': limit
            }
            
            return await self.execute_aql(aql, bind_vars)
            
        except Exception as e:
            logger.error(f"根据属性查找节点失败: {e}")
            return []
    
    # ============ 图算法 ============
    
    async def calculate_page_rank(
        self, 
        collections: Optional[List[str]] = None,
        edge_collections: Optional[List[str]] = None,
        limit: int = 20
    ) -> List[Dict[str, Any]]:
        """计算PageRank中心性"""
        try:
            collections = collections or ['entities', 'concepts', 'materials', 'papers']
            edge_collections = edge_collections or ['relationships', 'citations', 'contains']
            
            # 使用ArangoDB的PREGEL算法计算PageRank
            aql = f"""
                FOR doc IN @@collections
                RETURN {{
                    node: doc,
                    pagerank: doc._pagerank || 0
                }}
                SORT pagerank DESC
                LIMIT @limit
            """
            
            # 注意：实际应用中需要先运行PREGEL算法
            # 这里提供基础结构，实际使用时需要配置PREGEL
            
            bind_vars = {
                '@collections': collections,
                'limit': limit
            }
            
            return await self.execute_aql(aql, bind_vars)
            
        except Exception as e:
            logger.error(f"计算PageRank失败: {e}")
            return []
    
    async def detect_communities(
        self, 
        algorithm: str = "label_propagation",
        min_community_size: int = 3
    ) -> List[Dict[str, Any]]:
        """社区检测"""
        try:
            # 使用标签传播算法进行社区检测
            aql = """
                FOR node IN UNION_DISTINCT(
                    (FOR n IN entities RETURN n),
                    (FOR n IN concepts RETURN n),
                    (FOR n IN materials RETURN n),
                    (FOR n IN papers RETURN n)
                )
                COLLECT community = node._community || 0 INTO group
                FILTER LENGTH(group) >= @min_size
                RETURN {
                    community_id: community,
                    size: LENGTH(group),
                    nodes: group[*].node
                }
                SORT size DESC
            """
            
            bind_vars = {
                'min_size': min_community_size
            }
            
            return await self.execute_aql(aql, bind_vars)
            
        except Exception as e:
            logger.error(f"社区检测失败: {e}")
            return []
    
    async def calculate_centrality(
        self, 
        centrality_type: str = "degree",
        collections: Optional[List[str]] = None,
        limit: int = 20
    ) -> List[Dict[str, Any]]:
        """计算中心性指标"""
        try:
            collections = collections or ['entities', 'concepts', 'materials', 'papers']
            
            if centrality_type == "degree":
                # 度中心性计算
                collection_queries = []
                for collection in collections:
                    collection_queries.append(f"""
                        (FOR node IN {collection}
                         LET inbound_count = LENGTH(
                             FOR v, e IN 1..1 INBOUND node._id relationships, citations, contains
                             RETURN 1
                         )
                         LET outbound_count = LENGTH(
                             FOR v, e IN 1..1 OUTBOUND node._id relationships, citations, contains
                             RETURN 1
                         )
                         RETURN {{
                             node: node,
                             collection: '{collection}',
                             degree: inbound_count + outbound_count,
                             in_degree: inbound_count,
                             out_degree: outbound_count
                         }})
                    """)
                
                aql = f"""
                    FOR result IN UNION({', '.join(collection_queries)})
                    SORT result.degree DESC
                    LIMIT @limit
                    RETURN result
                """
            else:
                # 其他中心性算法可以在这里扩展
                return []
            
            bind_vars = {
                'limit': limit
            }
            
            return await self.execute_aql(aql, bind_vars)
            
        except Exception as e:
            logger.error(f"计算中心性失败: {e}")
            return []
    
    # ============ 统计信息 ============
    
    async def get_graph_stats(self) -> Dict[str, Any]:
        """获取图统计信息"""
        try:
            aql = """
                LET entities_count = LENGTH(entities)
                LET concepts_count = LENGTH(concepts)
                LET materials_count = LENGTH(materials)
                LET papers_count = LENGTH(papers)
                LET relationships_count = LENGTH(relationships)
                LET citations_count = LENGTH(citations)
                LET contains_count = LENGTH(contains)
                
                RETURN {
                    nodes: {
                        total: entities_count + concepts_count + materials_count + papers_count,
                        entities: entities_count,
                        concepts: concepts_count,
                        materials: materials_count,
                        papers: papers_count
                    },
                    edges: {
                        total: relationships_count + citations_count + contains_count,
                        relationships: relationships_count,
                        citations: citations_count,
                        contains: contains_count
                    }
                }
            """
            
            cursor = self.database.aql.execute(aql)
            results = list(cursor)
            return results[0] if results else {}
            
        except Exception as e:
            logger.error(f"获取图统计信息失败: {e}")
            return {}
    
    async def get_subgraph(
        self, 
        center_collection: str,
        center_node_id: str, 
        radius: int = 2,
        node_collections: Optional[List[str]] = None,
        edge_collections: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """获取子图"""
        try:
            edge_collections = edge_collections or ['relationships', 'citations', 'contains']
            edge_filter = ", ".join(edge_collections)
            
            aql = f"""
                FOR vertex, edge, path IN 0..@radius ANY @center_vertex {edge_filter}
                RETURN {{
                    vertex: vertex,
                    edge: edge,
                    depth: LENGTH(path.vertices) - 1
                }}
            """
            
            bind_vars = {
                'center_vertex': f"{center_collection}/{center_node_id}",
                'radius': radius
            }
            
            results = await self.execute_aql(aql, bind_vars)
            
            # 分离节点和边
            nodes = []
            edges = []
            
            for result in results:
                if result['vertex']:
                    nodes.append(result['vertex'])
                if result['edge']:
                    edges.append(result['edge'])
            
            return {
                'nodes': nodes,
                'edges': edges,
                'center': f"{center_collection}/{center_node_id}",
                'radius': radius
            }
            
        except Exception as e:
            logger.error(f"获取子图失败: {e}")
            return {'nodes': [], 'edges': []}
    
    # ============ 数据同步 ============
    
    async def sync_from_relational_data(self, relational_data: Dict[str, List[Dict]]) -> Dict[str, Any]:
        """从关系数据同步到图数据库"""
        try:
            sync_stats = {
                'nodes_created': 0,
                'edges_created': 0,
                'errors': []
            }
            
            # 同步节点
            for collection_name, nodes in relational_data.get('nodes', {}).items():
                for node_data in nodes:
                    try:
                        await self.create_node(collection_name, node_data)
                        sync_stats['nodes_created'] += 1
                    except Exception as e:
                        sync_stats['errors'].append(f"创建节点失败: {str(e)}")
            
            # 同步边
            for edge_collection, edges in relational_data.get('edges', {}).items():
                for edge_data in edges:
                    try:
                        await self.create_edge(
                            edge_collection,
                            edge_data['from_node_id'],
                            edge_data['to_node_id'],
                            edge_data['from_collection'],
                            edge_data['to_collection'],
                            edge_data.get('properties', {})
                        )
                        sync_stats['edges_created'] += 1
                    except Exception as e:
                        sync_stats['errors'].append(f"创建边失败: {str(e)}")
            
            return sync_stats
            
        except Exception as e:
            logger.error(f"数据同步失败: {e}")
            return {'nodes_created': 0, 'edges_created': 0, 'errors': [str(e)]}


# 全局ArangoDB仓库实例 - 延迟初始化
arango_graph_repository = None

def get_arango_graph_repository():
    """获取ArangoDB图仓库实例（延迟初始化）"""
    global arango_graph_repository
    if arango_graph_repository is None:
        try:
            arango_graph_repository = ArangoGraphRepository()
        except Exception as e:
            logger.warning(f"ArangoDB仓库初始化失败，将在数据库就绪后重试: {e}")
            return None
    return arango_graph_repository


def reset_arango_graph_repository():
    """重置ArangoDB仓库实例（用于数据库初始化后重新连接）"""
    global arango_graph_repository
    arango_graph_repository = None 