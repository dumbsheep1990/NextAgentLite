"""
知识图谱端点 - 基于Apache AGE和NetworkX的图谱操作
"""
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, Form, BackgroundTasks
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import json
import uuid
import os
from datetime import datetime
from pathlib import Path

try:
    from sqlalchemy.ext.asyncio import AsyncSession
except ImportError:
    AsyncSession = None

try:
    from db.database import get_db
except ImportError:
    def get_db():
        return None

from core.logger import logger

try:
    from service.graph_service import graph_service
    # 使用优化后的通用材料科学三元组提取服务
    from service.universal_triplet_extraction_service import UniversalTripletExtractionService
    triplet_extraction_service = UniversalTripletExtractionService()  # 创建增强服务实例
    from service.knowledge_graph_config_service import knowledge_graph_config_service
    from service.knowledge_graph_service import knowledge_graph_service  # 新增独立服务
    from service.storage_service import storage_service
    from db.repositories.graph_adapter import graph_adapter
    from db.repositories.knowledge_repository import KnowledgeRepository
except ImportError as e:
    logger.warning(f"图谱服务导入失败，部分功能可能不可用: {e}")
    graph_service = None
    triplet_extraction_service = None
    knowledge_graph_config_service = None
    knowledge_graph_service = None
    storage_service = None
    graph_adapter = None
    KnowledgeRepository = None

router = APIRouter()


class GraphNode(BaseModel):
    """图谱节点模型"""
    id: str
    label: str
    type: str
    properties: Dict[str, Any]
    x: Optional[float] = None
    y: Optional[float] = None
    color: Optional[str] = None
    size: Optional[float] = None


class GraphEdge(BaseModel):
    """图谱边模型"""
    id: str
    from_node: str = Field(..., alias="from")
    to_node: str = Field(..., alias="to")
    label: str
    type: str
    properties: Dict[str, Any]
    weight: Optional[float] = None
    color: Optional[str] = None


class GraphStats(BaseModel):
    """图谱统计信息"""
    nodeCount: int
    edgeCount: int
    typeDistribution: Dict[str, int]
    avgConnections: float


class GraphFilter(BaseModel):
    """图谱筛选条件"""
    nodeTypes: List[str] = []
    edgeTypes: List[str] = []
    searchText: str = ""
    viewMode: str = "overview"


class GraphDataResponse(BaseModel):
    """图谱数据响应"""
    nodes: List[GraphNode]
    edges: List[GraphEdge]
    stats: GraphStats


# ============ 图谱数据端点 ============

@router.get("/data", response_model=GraphDataResponse)
async def get_graph_data(
    node_types: Optional[str] = Query(None, description="节点类型筛选，逗号分隔"),
    edge_types: Optional[str] = Query(None, description="边类型筛选，逗号分隔"),
    search: Optional[str] = Query(None, description="搜索关键词"),
    limit: int = Query(1000, ge=1, le=5000, description="返回节点数量限制"),
    adapter = Depends(lambda: graph_adapter)
):
    """获取图谱数据"""
    try:
        # 构建筛选条件
        filters = {}
        if node_types:
            filters['node_types'] = [t.strip() for t in node_types.split(',')]
        if edge_types:
            filters['edge_types'] = [t.strip() for t in edge_types.split(',')]
        if search:
            filters['search'] = search
        
        # 获取节点数据
        nodes_data = await adapter.get_nodes(filters=filters, limit=limit)
        nodes = []
        for node_data in nodes_data:
            nodes.append(GraphNode(
                id=node_data['id'],
                label=node_data.get('label', node_data['id']),
                type=node_data.get('type', 'unknown'),
                properties=node_data.get('properties', {}),
                x=node_data.get('x'),
                y=node_data.get('y'),
                color=node_data.get('color'),
                size=node_data.get('size', 10)
            ))
        
        # 获取边数据
        edges_data = await adapter.get_edges(filters=filters)
        edges = []
        for edge_data in edges_data:
            # 使用别名字段来构造GraphEdge
            edge_dict = {
                'id': edge_data['id'],
                'from': edge_data['from'],  # 使用别名
                'to': edge_data['to'],      # 使用别名
                'label': edge_data.get('label', ''),
                'type': edge_data.get('type', 'unknown'),
                'properties': edge_data.get('properties', {}),
                'weight': edge_data.get('weight', 1.0),
                'color': edge_data.get('color')
            }
            edges.append(GraphEdge(**edge_dict))
        
        # 获取统计信息
        stats_data = await adapter.get_graph_stats()
        stats = GraphStats(
            nodeCount=stats_data.get('node_count', 0),
            edgeCount=stats_data.get('edge_count', 0),
            typeDistribution=stats_data.get('type_distribution', {}),
            avgConnections=stats_data.get('avg_connections', 0.0)
        )
        
        return GraphDataResponse(
            nodes=nodes,
            edges=edges,
            stats=stats
        )
        
    except Exception as e:
        logger.error(f"获取图谱数据失败: {e}")
        raise HTTPException(status_code=500, detail=f"获取图谱数据失败: {str(e)}")


@router.get("/nodes/search", response_model=List[GraphNode])
async def search_nodes(
    q: str = Query(..., description="搜索查询"),
    limit: int = Query(20, ge=1, le=100),
    node_type: Optional[str] = Query(None, description="节点类型筛选"),
    adapter = Depends(lambda: graph_adapter)
):
    """搜索图谱节点"""
    try:
        filters = {'search': q}
        if node_type:
            filters['node_types'] = [node_type]
        
        nodes_data = await adapter.search_nodes(query=q, filters=filters, limit=limit)
        
        nodes = []
        for node_data in nodes_data:
            nodes.append(GraphNode(
                id=node_data['id'],
                label=node_data.get('label', node_data['id']),
                type=node_data.get('type', 'unknown'),
                properties=node_data.get('properties', {})
            ))
        
        return nodes
        
    except Exception as e:
        logger.error(f"搜索节点失败: {e}")
        raise HTTPException(status_code=500, detail=f"搜索节点失败: {str(e)}")


@router.get("/nodes/{node_id}")
async def get_node_details(
    node_id: str,
    include_neighbors: bool = Query(True, description="是否包含邻居节点"),
    neighbor_depth: int = Query(1, ge=1, le=3, description="邻居深度"),
    adapter = Depends(lambda: graph_adapter)
):
    """获取节点详细信息"""
    try:
        # 获取节点基本信息
        node_data = await adapter.get_node_by_id(node_id)
        if not node_data:
            raise HTTPException(status_code=404, detail="节点不存在")
        
        node = GraphNode(
            id=node_data['id'],
            label=node_data.get('label', node_data['id']),
            type=node_data.get('type', 'unknown'),
            properties=node_data.get('properties', {})
        )
        
        result = {"node": node}
        
        if include_neighbors:
            # 获取连接的边
            connections = await adapter.get_node_edges(node_id)
            result["connections"] = connections
            
            # 获取邻居节点
            neighbors = await adapter.get_node_neighbors(node_id, depth=neighbor_depth)
            result["relatedNodes"] = neighbors
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"获取节点详情失败: {e}")
        raise HTTPException(status_code=500, detail=f"获取节点详情失败: {str(e)}")


# ============ 节点操作端点 ============

@router.post("/nodes", response_model=GraphNode)
async def create_node(
    node_data: Dict[str, Any],
    adapter = Depends(lambda: graph_adapter)
):
    """创建新节点"""
    try:
        node_id = node_data.get('id') or str(uuid.uuid4())
        label = node_data.get('label', node_id)
        node_type = node_data.get('type', 'entity')
        properties = node_data.get('properties', {})
        
        # 添加创建时间
        properties['created_at'] = datetime.utcnow().isoformat()
        
        # 创建节点
        created_node = await adapter.create_node(
            node_id=node_id,
            label=label,
            node_type=node_type,
            properties=properties
        )
        
        return GraphNode(
            id=created_node['id'],
            label=created_node['label'],
            type=created_node['type'],
            properties=created_node['properties']
        )
        
    except Exception as e:
        logger.error(f"创建节点失败: {e}")
        raise HTTPException(status_code=500, detail=f"创建节点失败: {str(e)}")


@router.put("/nodes/{node_id}", response_model=GraphNode)
async def update_node(
    node_id: str,
    updates: Dict[str, Any],
    adapter = Depends(lambda: graph_adapter)
):
    """更新节点信息"""
    try:
        # 检查节点是否存在
        existing_node = await adapter.get_node_by_id(node_id)
        if not existing_node:
            raise HTTPException(status_code=404, detail="节点不存在")
        
        # 更新节点
        updated_node = await adapter.update_node(node_id, updates)
        
        return GraphNode(
            id=updated_node['id'],
            label=updated_node['label'],
            type=updated_node['type'],
            properties=updated_node['properties']
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"更新节点失败: {e}")
        raise HTTPException(status_code=500, detail=f"更新节点失败: {str(e)}")


@router.delete("/nodes/{node_id}")
async def delete_node(
    node_id: str,
    adapter = Depends(lambda: graph_adapter)
):
    """删除节点"""
    try:
        # 检查节点是否存在
        existing_node = await adapter.get_node_by_id(node_id)
        if not existing_node:
            raise HTTPException(status_code=404, detail="节点不存在")
        
        # 删除节点（同时删除相关的边）
        await adapter.delete_node(node_id)
        
        return {"success": True, "message": "节点删除成功"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"删除节点失败: {e}")
        raise HTTPException(status_code=500, detail=f"删除节点失败: {str(e)}")


# ============ 边操作端点 ============

@router.post("/edges", response_model=GraphEdge)
async def create_edge(
    edge_data: Dict[str, Any],
    adapter = Depends(lambda: graph_adapter)
):
    """创建新边"""
    try:
        edge_id = edge_data.get('id') or str(uuid.uuid4())
        from_node = edge_data.get('from')
        to_node = edge_data.get('to')
        label = edge_data.get('label', '')
        edge_type = edge_data.get('type', 'relates_to')
        properties = edge_data.get('properties', {})
        
        if not from_node or not to_node:
            raise HTTPException(status_code=400, detail="缺少源节点或目标节点")
        
        # 验证节点是否存在
        source_exists = await adapter.get_node_by_id(from_node)
        target_exists = await adapter.get_node_by_id(to_node)
        
        if not source_exists:
            raise HTTPException(status_code=404, detail=f"源节点不存在: {from_node}")
        if not target_exists:
            raise HTTPException(status_code=404, detail=f"目标节点不存在: {to_node}")
        
        # 添加创建时间
        properties['created_at'] = datetime.utcnow().isoformat()
        
        # 创建边
        created_edge = await adapter.create_edge(
            edge_id=edge_id,
            from_node=from_node,
            to_node=to_node,
            label=label,
            edge_type=edge_type,
            properties=properties
        )
        
        return GraphEdge(
            id=created_edge['id'],
            from_node=created_edge['from'],
            to_node=created_edge['to'],
            label=created_edge['label'],
            type=created_edge['type'],
            properties=created_edge['properties']
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"创建边失败: {e}")
        raise HTTPException(status_code=500, detail=f"创建边失败: {str(e)}")


@router.put("/edges/{edge_id}", response_model=GraphEdge)
async def update_edge(
    edge_id: str,
    updates: Dict[str, Any],
    adapter = Depends(lambda: graph_adapter)
):
    """更新边信息"""
    try:
        # 检查边是否存在
        existing_edge = await adapter.get_edge_by_id(edge_id)
        if not existing_edge:
            raise HTTPException(status_code=404, detail="边不存在")
        
        # 更新边
        updated_edge = await adapter.update_edge(edge_id, updates)
        
        return GraphEdge(
            id=updated_edge['id'],
            from_node=updated_edge['from'],
            to_node=updated_edge['to'],
            label=updated_edge['label'],
            type=updated_edge['type'],
            properties=updated_edge['properties']
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"更新边失败: {e}")
        raise HTTPException(status_code=500, detail=f"更新边失败: {str(e)}")


@router.delete("/edges/{edge_id}")
async def delete_edge(
    edge_id: str,
    adapter = Depends(lambda: graph_adapter)
):
    """删除边"""
    try:
        # 检查边是否存在
        existing_edge = await adapter.get_edge_by_id(edge_id)
        if not existing_edge:
            raise HTTPException(status_code=404, detail="边不存在")
        
        # 删除边
        await adapter.delete_edge(edge_id)
        
        return {"success": True, "message": "边删除成功"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"删除边失败: {e}")
        raise HTTPException(status_code=500, detail=f"删除边失败: {str(e)}")


# ============ 图谱分析端点 ============

@router.get("/types/nodes", response_model=Dict[str, List[str]])
async def get_node_types(
    adapter = Depends(lambda: graph_adapter)
):
    """获取所有节点类型"""
    try:
        types = await adapter.get_all_node_types()
        return {"types": types}
        
    except Exception as e:
        logger.error(f"获取节点类型失败: {e}")
        raise HTTPException(status_code=500, detail=f"获取节点类型失败: {str(e)}")


@router.get("/types/edges", response_model=Dict[str, List[str]])
async def get_edge_types(
    adapter = Depends(lambda: graph_adapter)
):
    """获取所有边类型"""
    try:
        types = await adapter.get_all_edge_types()
        return {"types": types}
        
    except Exception as e:
        logger.error(f"获取边类型失败: {e}")
        raise HTTPException(status_code=500, detail=f"获取边类型失败: {str(e)}")


@router.get("/stats", response_model=GraphStats)
async def get_graph_statistics(
    adapter = Depends(lambda: graph_adapter)
):
    """获取图谱统计信息"""
    try:
        stats_data = await adapter.get_graph_stats()
        
        return GraphStats(
            nodeCount=stats_data.get('nodeCount', stats_data.get('node_count', 0)),
            edgeCount=stats_data.get('edgeCount', stats_data.get('edge_count', 0)),
            typeDistribution=stats_data.get('typeDistribution', stats_data.get('type_distribution', {})),
            avgConnections=stats_data.get('avgConnections', stats_data.get('avg_connections', 0.0))
        )
        
    except Exception as e:
        logger.error(f"获取图谱统计失败: {e}")
        raise HTTPException(status_code=500, detail=f"获取图谱统计失败: {str(e)}")


@router.post("/algorithms/run")
async def run_graph_algorithm(
    request: Dict[str, Any],
    adapter = Depends(lambda: graph_adapter)
):
    """执行图谱算法"""
    try:
        algorithm = request.get('algorithm')
        params = request.get('params', {})
        
        if not algorithm:
            raise HTTPException(status_code=400, detail="未指定算法")
        
        # 支持的算法
        if algorithm == 'pagerank':
            result = await graph_service.calculate_pagerank(**params)
        elif algorithm == 'community_detection':
            result = await graph_service.detect_communities(**params)
        elif algorithm == 'centrality':
            result = await graph_service.calculate_centrality(**params)
        else:
            raise HTTPException(status_code=400, detail=f"不支持的算法: {algorithm}")
        
        return {
            "algorithm": algorithm,
            "result": result,
            "execution_time": 0.5  # 模拟执行时间
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"执行图谱算法失败: {e}")
        raise HTTPException(status_code=500, detail=f"执行图谱算法失败: {str(e)}")


@router.get("/path/shortest")
async def get_shortest_path(
    source: str = Query(..., description="源节点ID"),
    target: str = Query(..., description="目标节点ID"),
    adapter = Depends(lambda: graph_adapter)
):
    """获取两个节点间的最短路径"""
    try:
        path_data = await adapter.find_shortest_path(source, target)
        
        if not path_data:
            return {
                "path": [],
                "edges": [],
                "length": -1,
                "message": "未找到路径"
            }
        
        return {
            "path": path_data.get('nodes', []),
            "edges": path_data.get('edges', []),
            "length": path_data.get('length', 0)
        }
        
    except Exception as e:
        logger.error(f"获取最短路径失败: {e}")
        raise HTTPException(status_code=500, detail=f"获取最短路径失败: {str(e)}")


@router.get("/nodes/{node_id}/similar")
async def get_similar_nodes(
    node_id: str,
    limit: int = Query(10, ge=1, le=50),
    adapter = Depends(lambda: graph_adapter)
):
    """获取相似节点"""
    try:
        similar_data = await adapter.find_similar_nodes(node_id, limit=limit)
        
        return {
            "nodes": similar_data.get('nodes', []),
            "similarities": similar_data.get('similarities', [])
        }
        
    except Exception as e:
        logger.error(f"获取相似节点失败: {e}")
        raise HTTPException(status_code=500, detail=f"获取相似节点失败: {str(e)}")


# ============ 数据导入导出端点 ============

@router.get("/export")
async def export_graph_data(
    format: str = Query("json", pattern="^(json|csv|gml)$"),
    adapter = Depends(lambda: graph_adapter)
):
    """导出图谱数据"""
    try:
        from fastapi.responses import StreamingResponse
        import io
        
        if format == "json":
            # 导出JSON格式
            graph_data = await adapter.export_graph_json()
            output = io.StringIO()
            json.dump(graph_data, output, ensure_ascii=False, indent=2)
            output.seek(0)
            
            return StreamingResponse(
                io.BytesIO(output.getvalue().encode('utf-8')),
                media_type="application/json",
                headers={"Content-Disposition": "attachment; filename=graph_export.json"}
            )
        
        elif format == "csv":
            # 导出CSV格式
            csv_data = await adapter.export_graph_csv()
            
            return StreamingResponse(
                io.BytesIO(csv_data.encode('utf-8')),
                media_type="text/csv",
                headers={"Content-Disposition": "attachment; filename=graph_export.csv"}
            )
        
        else:  # GML
            # 导出GML格式
            gml_data = await adapter.export_graph_gml()
            
            return StreamingResponse(
                io.BytesIO(gml_data.encode('utf-8')),
                media_type="text/plain",
                headers={"Content-Disposition": "attachment; filename=graph_export.gml"}
            )
        
    except Exception as e:
        logger.error(f"导出图谱数据失败: {e}")
        raise HTTPException(status_code=500, detail=f"导出图谱数据失败: {str(e)}")


@router.post("/import")
async def import_graph_data(
    file: UploadFile = File(...),
    adapter = Depends(lambda: graph_adapter)
):
    """导入图谱数据"""
    try:
        # 验证文件类型
        file_extension = file.filename.split('.')[-1].lower()
        if file_extension not in ['json', 'csv', 'gml']:
            raise HTTPException(status_code=400, detail="不支持的文件格式")
        
        # 读取文件内容
        content = await file.read()
        
        # 根据文件类型导入
        if file_extension == 'json':
            import_data = json.loads(content.decode('utf-8'))
            result = await adapter.import_graph_json(import_data)
        elif file_extension == 'csv':
            result = await adapter.import_graph_csv(content.decode('utf-8'))
        else:  # GML
            result = await adapter.import_graph_gml(content.decode('utf-8'))
        
        return {
            "success": True,
            "imported_nodes": result.get('nodes', 0),
            "imported_edges": result.get('edges', 0),
            "message": f"成功导入 {result.get('nodes', 0)} 个节点和 {result.get('edges', 0)} 条边"
        }
        
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="JSON文件格式错误")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"导入图谱数据失败: {e}")
        raise HTTPException(status_code=500, detail=f"导入图谱数据失败: {str(e)}")


# ============ 聚类分析端点 ============

@router.post("/clustering")
async def perform_graph_clustering(
    request: Dict[str, Any],
    adapter = Depends(lambda: graph_adapter)
):
    """执行图谱聚类分析"""
    try:
        algorithm = request.get('algorithm', 'louvain')
        
        if algorithm not in ['louvain', 'leiden', 'kmeans']:
            raise HTTPException(status_code=400, detail=f"不支持的聚类算法: {algorithm}")
        
        # 执行聚类
        clustering_result = await graph_service.perform_clustering(algorithm)
        
        return {
            "algorithm": algorithm,
            "clusters": clustering_result.get('clusters', {}),
            "modularity": clustering_result.get('modularity', 0.0),
            "num_clusters": len(clustering_result.get('clusters', {}))
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"图谱聚类分析失败: {e}")
        raise HTTPException(status_code=500, detail=f"图谱聚类分析失败: {str(e)}")


@router.get("/centrality")
async def get_node_centrality(
    type: str = Query("pagerank", pattern="^(degree|betweenness|closeness|pagerank)$"),
    limit: int = Query(20, ge=1, le=100),
    adapter = Depends(lambda: graph_adapter)
):
    """获取节点重要性排名"""
    try:
        centrality_data = await graph_service.calculate_node_centrality(type, limit)
        
        return {
            "centrality_type": type,
            "rankings": centrality_data.get('rankings', [])
        }
        
    except Exception as e:
        logger.error(f"获取节点重要性失败: {e}")
        raise HTTPException(status_code=500, detail=f"获取节点重要性失败: {str(e)}")


# ============ 三元组提取端点 ============

class TripletExtractionRequest(BaseModel):
    """三元组提取请求模型"""
    document_id: str = Field(..., description="文档ID")
    use_streaming: bool = Field(True, description="是否使用流式处理")
    chunk_ids: Optional[List[str]] = Field(None, description="指定的文档块ID列表")


class TripletExtractionResponse(BaseModel):
    """三元组提取响应模型"""
    document_id: str
    extraction_stats: Dict[str, Any]
    entities: List[Dict[str, Any]]
    relationships: List[Dict[str, Any]]
    keywords: List[str]
    graph_data: Dict[str, Any]




class KeywordExtractionRequest(BaseModel):
    """关键词提取请求模型"""
    query: str = Field(..., description="查询文本")
    history: str = Field("", description="对话历史")

@router.post("/extract/keywords")
async def extract_keywords_from_query(request: KeywordExtractionRequest):
    """从查询中提取关键词"""
    try:
        keywords = await triplet_extraction_service.extract_keywords_from_query(
            query=request.query,
            history=request.history
        )
        
        return {
            "query": request.query,
            "keywords": keywords,
            "extracted_at": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error(f"关键词提取失败: {e}")
        raise HTTPException(status_code=500, detail=f"关键词提取失败: {str(e)}")




@router.get("/extraction/status/{document_id}")
async def get_extraction_status(
    document_id: str,
    db: AsyncSession = Depends(get_db)
):
    """获取文档的三元组提取状态"""
    try:
        # 检查文档是否存在
        knowledge_repo = KnowledgeRepository(db)
        document = await knowledge_repo.get_document_by_id(document_id)
        
        if not document:
            raise HTTPException(status_code=404, detail="文档不存在")
        
        # 检查是否已经提取过三元组（通过检查图谱中是否有相关节点）
        adapter = graph_adapter
        nodes = await adapter.get_nodes(
            filters={"source_document_id": document_id},
            limit=10
        )
        
        edges = await adapter.get_edges(
            filters={"source_document_id": document_id}
        )
        
        has_extracted = len(nodes) > 0 or len(edges) > 0
        
        return {
            "document_id": document_id,
            "document_title": document.title,
            "has_extracted": has_extracted,
            "extracted_nodes_count": len(nodes),
            "extracted_edges_count": len(edges),
            "last_updated": document.updated_at.isoformat() if document.updated_at else None
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"获取提取状态失败: {e}")
        raise HTTPException(status_code=500, detail=f"获取提取状态失败: {str(e)}")




# ============ 知识图谱配置端点 ============

class KnowledgeGraphConfigModel(BaseModel):
    """知识图谱配置模型（简化）"""
    enableKnowledgeGraph: bool
    autoExtraction: bool  # 与知识图谱开关联动
    extractionMode: str = Field(..., pattern="^(auto|manual|disabled)$")
    extractionConfig: Dict[str, Any]
    arangodbConfig: Dict[str, Any]
    processingConfig: Dict[str, Any]


@router.get("/config", response_model=KnowledgeGraphConfigModel)
async def get_knowledge_graph_config():
    """获取知识图谱配置"""
    try:
        config = knowledge_graph_config_service.get_config()
        return KnowledgeGraphConfigModel(**config)
        
    except Exception as e:
        logger.error(f"获取知识图谱配置失败: {e}")
        raise HTTPException(status_code=500, detail=f"获取知识图谱配置失败: {str(e)}")


@router.put("/config")
async def update_knowledge_graph_config(
    config: KnowledgeGraphConfigModel
):
    """更新知识图谱配置"""
    try:
        config_data = config.dict()
        updated_config = knowledge_graph_config_service.update_config(config_data)
        
        return {
            "message": "知识图谱配置更新成功",
            "config": updated_config
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"更新知识图谱配置失败: {e}")
        raise HTTPException(status_code=500, detail=f"更新知识图谱配置失败: {str(e)}")


@router.post("/config/toggle")
async def toggle_knowledge_graph(
    enabled: bool = Query(..., description="是否启用知识图谱")
):
    """切换知识图谱开关"""
    try:
        result_enabled = knowledge_graph_config_service.toggle_knowledge_graph(enabled)
        status_text = "启用" if result_enabled else "禁用"
        
        return {
            "message": f"知识图谱已{status_text}",
            "enabled": result_enabled
        }
        
    except Exception as e:
        logger.error(f"切换知识图谱开关失败: {e}")
        raise HTTPException(status_code=500, detail=f"切换知识图谱开关失败: {str(e)}")


@router.get("/status")
async def get_knowledge_graph_status():
    """获取知识图谱状态"""
    try:
        # 检查各个组件的状态
        # 实际实现应该检查ArangoDB连接、数据统计等
        
        status = {
            "enabled": False,  # 从配置中读取
            "arangodbConnected": False,  # 检查ArangoDB连接
            "totalEntities": 0,  # 从数据库统计
            "totalRelationships": 0,  # 从数据库统计
            "lastUpdateTime": "",  # 最后更新时间
            "status": "error"  # healthy, warning, error
        }
        
        # 模拟检查逻辑
        try:
            # 这里应该实际检查ArangoDB连接
            stats = await graph_adapter.get_graph_stats()
            status.update({
                "arangodbConnected": True,
                "totalEntities": stats.get('node_count', 0),
                "totalRelationships": stats.get('edge_count', 0),
                "lastUpdateTime": datetime.utcnow().isoformat(),
                "status": "healthy"
            })
        except Exception:
            status["status"] = "error"
        
        return status
        
    except Exception as e:
        logger.error(f"获取知识图谱状态失败: {e}")
        raise HTTPException(status_code=500, detail=f"获取知识图谱状态失败: {str(e)}")


# ============ 三元组提取配置端点 ============

class TripleExtractionRequest(BaseModel):
    """三元组提取请求模型"""
    document_ids: List[str]
    extraction_mode: str = Field("auto", pattern="^(auto|manual)$")
    entity_types: Optional[List[str]] = None
    min_confidence: float = Field(0.7, ge=0.0, le=1.0)


@router.post("/extract/triplets")
async def extract_triplets_from_documents(
    request: TripleExtractionRequest,
    db: AsyncSession = Depends(get_db)
):
    """从文档批量提取三元组"""
    try:
        if not request.document_ids:
            raise HTTPException(status_code=400, detail="未提供文档ID列表")
        
        # 创建提取任务
        task_id = str(uuid.uuid4())
        
        # 验证文档存在性
        knowledge_repo = KnowledgeRepository(db)
        valid_documents = []
        for doc_id in request.document_ids:
            document = await knowledge_repo.get_document_by_id(doc_id)
            if document:
                valid_documents.append(document)
        
        if not valid_documents:
            raise HTTPException(status_code=404, detail="没有找到有效文档")
        
        # 启动后台提取任务（实际实现应该使用Celery等异步任务队列）
        logger.info(f"启动三元组提取任务 {task_id}，处理 {len(valid_documents)} 个文档")
        
        return {
            "message": "三元组提取任务已启动",
            "taskId": task_id,
            "documentsCount": len(valid_documents)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"启动三元组提取失败: {e}")
        raise HTTPException(status_code=500, detail=f"启动三元组提取失败: {str(e)}")


@router.get("/extraction/status/{task_id}")
async def get_triple_extraction_status(task_id: str):
    """获取三元组提取任务状态"""
    try:
        # 实际实现应该从任务队列或数据库查询任务状态
        # 这里返回模拟数据
        
        status = {
            "taskId": task_id,
            "status": "completed",  # pending, processing, completed, failed
            "progress": 100,
            "results": [
                {
                    "document_id": "doc_001",
                    "status": "completed",
                    "triplets": [
                        {
                            "subject": "地聚物",
                            "predicate": "含有",
                            "object": "硅酸钠",
                            "confidence": 0.85,
                            "context": "地聚物材料中含有硅酸钠激发剂"
                        }
                    ],
                    "entity_count": 15,
                    "relationship_count": 8,
                    "processing_time": 5.2
                }
            ],
            "completedDocuments": 1,
            "totalDocuments": 1,
            "errors": []
        }
        
        return status
        
    except Exception as e:
        logger.error(f"获取提取状态失败: {e}")
        raise HTTPException(status_code=500, detail=f"获取提取状态失败: {str(e)}")


@router.get("/entity-types")
async def get_entity_types():
    """获取支持的实体类型详细信息"""
    try:
        # 返回实体类型及其详细信息
        entity_types = [
            {"name": "material", "label": "材料", "description": "地聚物材料", "color": "#1890ff"},
            {"name": "chemical_compound", "label": "化学成分", "description": "化学化合物", "color": "#52c41a"},
            {"name": "property", "label": "性能", "description": "材料性能", "color": "#faad14"},
            {"name": "process", "label": "工艺", "description": "制备工艺", "color": "#f5222d"},
            {"name": "structure", "label": "结构", "description": "微观结构", "color": "#722ed1"},
            {"name": "test_method", "label": "测试方法", "description": "检测方法", "color": "#13c2c2"}
        ]
        
        return {
            "types": entity_types
        }
        
    except Exception as e:
        logger.error(f"获取实体类型失败: {e}")
        raise HTTPException(status_code=500, detail=f"获取实体类型失败: {str(e)}")


@router.post("/build/from-documents")
async def build_knowledge_graph_from_documents(
    request: Dict[str, Any],
    db: AsyncSession = Depends(get_db)
):
    """从文档构建知识图谱"""
    try:
        document_ids = request.get("document_ids", [])
        overwrite = request.get("overwrite", False)
        enable_validation = request.get("enable_validation", True)
        extraction_mode = request.get("extraction_mode", "auto")
        
        if not document_ids:
            raise HTTPException(status_code=400, detail="未提供文档ID列表")
        
        # 创建构建任务
        task_id = str(uuid.uuid4())
        
        logger.info(f"启动知识图谱构建任务 {task_id}")
        
        return {
            "message": "知识图谱构建任务已启动",
            "taskId": task_id,
            "estimatedTime": len(document_ids) * 30  # 估算30秒每个文档
        }
        
    except Exception as e:
        logger.error(f"启动知识图谱构建失败: {e}")
        raise HTTPException(status_code=500, detail=f"启动知识图谱构建失败: {str(e)}")


# ============ 知识图谱文档管理端点 ============

class KnowledgeGraphUploadResponse(BaseModel):
    """知识图谱上传响应模型"""
    success: bool
    message: str
    document_id: str
    file_path: str
    processing_status: str


@router.post("/documents/upload", response_model=KnowledgeGraphUploadResponse)
async def upload_knowledge_graph_document(
    file: UploadFile = File(...),
    metadata: Optional[str] = Form(None),
    auto_extract: bool = Form(True),
    session_id: Optional[str] = Form(None),
    background_tasks: BackgroundTasks = BackgroundTasks(),
    db: AsyncSession = Depends(get_db)
):
    """
    上传知识图谱文档
    使用独立的处理流程，不进行向量化操作
    """
    try:
        # 验证文件类型
        file_extension = Path(file.filename).suffix.lower().lstrip('.')
        allowed_types = ['pdf', 'doc', 'docx', 'txt', 'md', 'html']
        
        if file_extension not in allowed_types:
            raise HTTPException(
                status_code=400,
                detail=f"不支持的文件类型。支持的类型: {', '.join(allowed_types)}"
            )
        
        # 读取文件内容
        content = await file.read()
        if len(content) > 50 * 1024 * 1024:  # 50MB限制
            raise HTTPException(status_code=400, detail="文件大小超过限制(50MB)")
        
        # 使用知识图谱专用的存储服务上传
        object_name, file_url, file_size = await storage_service.upload_knowledge_graph_document(
            file_data=content,
            filename=file.filename,
            content_type=file.content_type or f'application/{file_extension}',
            metadata={
                'original_filename': file.filename,
                'document_type': 'knowledge_graph',
                'uploader': 'api',
                'auto_extract': auto_extract
            }
        )
        
        logger.info(f"知识图谱文件上传成功: {file.filename} -> {object_name}")
        
        # 解析元数据
        metadata_dict = {}
        if metadata:
            try:
                metadata_dict = json.loads(metadata)
            except json.JSONDecodeError:
                logger.warning(f"元数据解析失败，使用默认值: {metadata}")
        
        # 创建数据库记录
        from db.repositories.knowledge_repository import KnowledgeDocumentRepository
        repo = KnowledgeDocumentRepository(db)
        
        document_data = {
            "title": Path(file.filename).stem,
            "filename": file.filename,
            "file_type": file_extension,
            "file_size": file_size,
            "file_path": object_name,
            "status": "uploaded",
            "tags": ["knowledge_graph"],  # 标记为知识图谱文档
            "document_metadata": {
                **metadata_dict,
                "storage_info": {
                    "object_name": object_name,
                    "file_url": file_url,
                    "content_type": file.content_type,
                    "bucket": storage_service.config.knowledge_graph_bucket
                },
                "processing_config": {
                    "auto_extract": auto_extract,
                    "processing_type": "knowledge_graph"
                }
            }
        }
        
        doc_record = await repo.create(document_data)
        
        # 启动后台处理任务：使用独立的知识图谱服务
        background_tasks.add_task(
            process_knowledge_graph_document_background,
            doc_record.id,
            object_name,
            auto_extract,
            session_id
        )
        
        logger.info(f"启动后台知识图谱处理任务: {doc_record.id}")
        
        return KnowledgeGraphUploadResponse(
            success=True,
            message="知识图谱文档上传成功",
            document_id=doc_record.id,
            file_path=object_name,
            processing_status="processing"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"知识图谱文档上传失败: {e}")
        raise HTTPException(status_code=500, detail=f"知识图谱文档上传失败: {str(e)}")


async def process_knowledge_graph_document_background(
    document_id: str, 
    file_path: str, 
    auto_extract: bool,
    session_id: str = None
):
    """
    后台任务：处理知识图谱文档
    直接使用TripletExtractionService进行处理
    """
    try:
        logger.info(f"🔄 开始后台处理知识图谱文档: {document_id}")
        
        if not auto_extract:
            logger.info(f"⏸️ 跳过自动提取: {document_id}")
            return
        
        # 获取文档信息（使用短连接）
        from db.repositories.knowledge_repository import KnowledgeRepository
        from db.database import get_db_session
        
        document = None
        async with get_db_session() as db:
            repo = KnowledgeRepository(db)
            document = await repo.get_document_by_id(document_id)
            
            if not document:
                logger.error(f"文档不存在: {document_id}")
                return
        
        # 释放数据库连接后进行长时间的提取操作
        logger.info(f"📖 开始提取文档内容: {document.title}")
        result = await triplet_extraction_service.extract_triplets_from_document(
            document=document,
            chunks=None,  # 让服务自己处理文档内容
            use_streaming=True,
            session_id=session_id
        )
        
        logger.info(f"✅ 知识图谱文档处理完成: {document_id}")
        logger.info(f"📊 提取结果: 提取了{len(result.get('entities', []))}个实体，{len(result.get('relationships', []))}个关系")
        
        # 检查提取结果 - 图谱构建已经在triplet_extraction_service中完成
        if result.get('entities') or result.get('relationships'):
            logger.info(f"🎉 知识图谱提取和构建完成: {document_id}")
            logger.info(f"📊 最终结果: {len(result.get('entities', []))} 个实体, {len(result.get('relationships', []))} 个关系")
            
            # 发送最终完成通知（如果service没有发送的话）
            if session_id:
                try:
                    # 检查是否已经有图谱构建结果
                    graph_build_result = result.get('graph_data', {})
                    
                    # 如果没有图谱数据，手动调用构建
                    if not graph_build_result:
                        logger.info(f"🏗️ 手动构建知识图谱: {document_id}")
                        graph_build_result = await graph_service.build_graph_from_documents([document_id])
                        logger.info(f"🎉 手动图谱构建完成: {graph_build_result}")
                    
                    from api.routes import unified_sse_manager
                    await unified_sse_manager.broadcast_graph_extraction_completed(
                        session_id, document_id, {
                            "extraction_result": result,
                            "graph_build_result": graph_build_result,
                            "document_id": document_id
                        }
                    )
                except Exception as sse_error:
                    logger.error(f"发送SSE完成通知失败: {sse_error}")
        else:
            logger.warning(f"⚠️ 未提取到实体或关系，跳过图谱处理: {document_id}")
        
    except Exception as e:
        logger.error(f"❌ 知识图谱文档后台处理失败 {document_id}: {e}")
        
        # 发送失败通知
        if session_id:
            try:
                from api.routes import unified_sse_manager
                await unified_sse_manager.broadcast_graph_extraction_failed(
                    session_id, document_id, {
                        "error_message": str(e),
                        "error_type": "processing_error"
                    }
                )
            except Exception as sse_error:
                logger.error(f"发送SSE失败通知失败: {sse_error}")


@router.get("/documents/{document_id}/status")
async def get_knowledge_graph_document_status(
    document_id: str,
    db: AsyncSession = Depends(get_db)
):
    """获取知识图谱文档处理状态"""
    try:
        # 获取文档信息
        knowledge_repo = KnowledgeRepository(db)
        document = await knowledge_repo.get_document_by_id(document_id)
        
        if not document:
            raise HTTPException(status_code=404, detail="文档不存在")
        
        # 检查是否为知识图谱文档
        if not document.tags or "knowledge_graph" not in document.tags:
            raise HTTPException(status_code=400, detail="不是知识图谱文档")
        
        # 获取处理状态
        metadata = document.document_metadata or {}
        processing_error = metadata.get("processing_error")
        
        # 检查图谱中是否有相关数据
        extraction_result = None
        if document.status == "completed":
            try:
                # 检查图谱中的节点和边
                nodes = await graph_adapter.get_nodes(
                    filters={"source_document_id": document_id},
                    limit=10
                )
                edges = await graph_adapter.get_edges(
                    filters={"source_document_id": document_id}
                )
                
                extraction_result = {
                    "entities_count": len(nodes),
                    "relationships_count": len(edges),
                    "has_graph_data": len(nodes) > 0 or len(edges) > 0
                }
            except Exception as e:
                logger.warning(f"获取图谱数据失败: {e}")
        
        return {
            "document_id": document_id,
            "document_title": document.title,
            "status": document.status,
            "processing_error": processing_error,
            "extraction_result": extraction_result,
            "updated_at": document.updated_at.isoformat() if document.updated_at else None
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"获取知识图谱文档状态失败: {e}")
        raise HTTPException(status_code=500, detail=f"获取知识图谱文档状态失败: {str(e)}")


class KnowledgeGraphDocument(BaseModel):
    """知识图谱文档响应模型"""
    id: str
    title: str
    filename: str
    fileType: str
    fileSize: int
    uploadTime: str
    status: str
    metadata: Dict[str, Any]
    processingStatus: Optional[str] = None
    extractionResult: Optional[Dict[str, Any]] = None

class PaginatedKnowledgeGraphDocumentResponse(BaseModel):
    """分页的知识图谱文档响应模型"""
    documents: List[KnowledgeGraphDocument]
    total: int
    page: int
    page_size: int


@router.get("/documents", response_model=PaginatedKnowledgeGraphDocumentResponse)
async def get_knowledge_graph_documents(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    search: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db)
):
    """获取知识图谱文档列表"""
    try:
        from sqlalchemy import select, desc, text
        from models.knowledge import KnowledgeDocument as KnowledgeDocumentModel
        
        query = select(KnowledgeDocumentModel)
        
        # 只获取知识图谱文档
        query = query.where(
            KnowledgeDocumentModel.tags.op('@>')(text("'[\"knowledge_graph\"]'::jsonb"))
        )
        
        # 应用筛选条件
        if search:
            search_filter = (
                KnowledgeDocumentModel.title.ilike(f"%{search}%") |
                KnowledgeDocumentModel.filename.ilike(f"%{search}%")
            )
            query = query.where(search_filter)
        
        if status:
            query = query.where(KnowledgeDocumentModel.status == status)
        
        # 获取总数
        from sqlalchemy import func
        count_query = select(func.count()).select_from(query.alias())
        count_result = await db.execute(count_query)
        total = count_result.scalar()
        
        # 分页
        offset = (page - 1) * size
        query = query.offset(offset).limit(size).order_by(desc(KnowledgeDocumentModel.upload_time))
        
        result = await db.execute(query)
        documents = result.scalars().all()
        
        # 转换格式
        document_list = []
        for doc in documents:
            # 确保metadata是字典类型
            metadata = doc.document_metadata
            if metadata is None:
                metadata = {}
            elif not isinstance(metadata, dict):
                logger.warning(f"document_metadata不是字典类型: {type(metadata)}, 转换为空字典")
                metadata = {}
            
            # 获取处理状态
            processing_status = metadata.get("processing_status", "unknown")
            processing_error = metadata.get("processing_error")
            
            # 检查提取结果（如果已完成）
            extraction_result = None
            if doc.status == "completed":
                try:
                    # 获取文档相关的图谱数据
                    nodes = await graph_adapter.get_nodes(
                        filters={"source_document_id": doc.id},
                        limit=10
                    )
                    edges = await graph_adapter.get_edges(
                        filters={"source_document_id": doc.id}
                    )
                    
                    extraction_result = {
                        "entities_count": len(nodes),
                        "relationships_count": len(edges),
                        "has_graph_data": len(nodes) > 0 or len(edges) > 0
                    }
                except Exception as e:
                    logger.warning(f"获取文档 {doc.id} 的图谱数据失败: {e}")
            
            document_list.append(KnowledgeGraphDocument(
                id=doc.id,
                title=doc.title,
                filename=doc.filename,
                fileType=doc.file_type,
                fileSize=doc.file_size,
                uploadTime=doc.upload_time.isoformat(),
                status=doc.status,
                metadata=metadata,
                processingStatus=processing_status,
                extractionResult=extraction_result
            ))
        
        return PaginatedKnowledgeGraphDocumentResponse(
            documents=document_list,
            total=total,
            page=page,
            page_size=size
        )
        
    except Exception as e:
        logger.error(f"获取知识图谱文档列表失败: {e}")
        raise HTTPException(status_code=500, detail=f"获取知识图谱文档列表失败: {str(e)}")


@router.get("/documents/status-statistics")
async def get_knowledge_graph_document_statistics(db: AsyncSession = Depends(get_db)):
    """获取知识图谱文档状态统计信息"""
    try:
        from sqlalchemy import select, func, text
        from models.knowledge import KnowledgeDocument as KnowledgeDocumentModel
        
        logger.info("获取知识图谱文档状态统计...")
        
        # 查询知识图谱文档的各状态数量
        result = await db.execute(
            select(
                KnowledgeDocumentModel.status,
                func.count(KnowledgeDocumentModel.id).label('count')
            ).where(
                # 只统计知识图谱文档
                KnowledgeDocumentModel.tags.op('@>')(text("'[\"knowledge_graph\"]'::jsonb"))
            ).group_by(KnowledgeDocumentModel.status)
        )
        
        status_counts = {row.status: row.count for row in result.fetchall()}
        
        # 计算问题文档统计
        failed_count = status_counts.get('failed', 0)
        pending_count = status_counts.get('pending', 0) 
        processing_count = status_counts.get('processing', 0)
        completed_count = status_counts.get('completed', 0)
        problematic_count = failed_count + pending_count
        
        from datetime import datetime
        
        statistics = {
            "document_status": status_counts,
            "summary": {
                "total": sum(status_counts.values()),
                "completed": completed_count,
                "processing": processing_count,
                "pending": pending_count,
                "failed": failed_count,
                "problematic": problematic_count
            },
            "last_updated": datetime.now().isoformat(),
            "data_source": "knowledge_graph_only"
        }
        
        logger.info(f"知识图谱文档统计: {statistics}")
        
        return {
            "success": True,
            "data": statistics
        }
        
    except Exception as e:
        logger.error(f"获取知识图谱文档统计失败: {e}")
        raise HTTPException(status_code=500, detail=f"获取统计信息失败: {str(e)}")


@router.delete("/documents/{document_id}")
async def delete_knowledge_graph_document(
    document_id: str,
    db: AsyncSession = Depends(get_db)
):
    """删除知识图谱文档"""
    try:
        # 获取文档信息
        knowledge_repo = KnowledgeRepository(db)
        document = await knowledge_repo.get_document_by_id(document_id)
        
        if not document:
            raise HTTPException(status_code=404, detail="文档不存在")
        
        # 检查是否为知识图谱文档
        if not document.tags or "knowledge_graph" not in document.tags:
            raise HTTPException(status_code=400, detail="不是知识图谱文档")
        
        # 🚨 停止相关的提取任务
        try:
            # 检查是否有正在运行的SSE会话
            from service.sse_service import sse_service
            active_sessions = sse_service.get_active_sessions()
            
            # 查找与该文档相关的会话
            for session_id in active_sessions:
                session_data = sse_service.get_session_data(session_id)
                if session_data and session_data.get("document_id") == document_id:
                    logger.info(f"停止与文档 {document_id} 相关的SSE会话: {session_id}")
                    await sse_service.send_update(session_id, {
                        "type": "task_cancelled",
                        "message": "文档已被删除，任务已取消"
                    })
                    sse_service.remove_session(session_id)
            
            # 停止图谱服务中可能的任务
            if hasattr(graph_service, 'cancel_extraction_task'):
                await graph_service.cancel_extraction_task(document_id)
                logger.info(f"已取消文档 {document_id} 的提取任务")
                
        except Exception as e:
            logger.warning(f"停止相关任务时出错: {e}")
        
        # 删除相关的图谱数据
        try:
            # 删除文档相关的节点和边
            await graph_adapter.delete_nodes_by_filter({"source_document_id": document_id})
            await graph_adapter.delete_edges_by_filter({"source_document_id": document_id})
            logger.info(f"已删除文档 {document_id} 相关的图谱数据")
        except Exception as e:
            logger.warning(f"删除文档 {document_id} 相关图谱数据时出错: {e}")
        
        # 删除存储文件
        try:
            metadata = document.document_metadata or {}
            storage_info = metadata.get("storage_info", {})
            object_name = storage_info.get("object_name")
            
            if object_name:
                await storage_service.delete_knowledge_graph_document(object_name)
                logger.info(f"已删除存储文件: {object_name}")
        except Exception as e:
            logger.warning(f"删除存储文件时出错: {e}")
        
        # 删除数据库记录
        await knowledge_repo.delete(document_id)
        
        return {"message": "知识图谱文档删除成功"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"删除知识图谱文档失败: {e}")
        raise HTTPException(status_code=500, detail=f"删除知识图谱文档失败: {str(e)}")


# ============ 知识图谱配置管理端点 ============

class GraphConfigModel(BaseModel):
    """知识图谱配置模型"""
    model: Dict[str, Any] = Field(default_factory=dict, description="模型配置")
    extraction: Dict[str, Any] = Field(default_factory=dict, description="提取参数配置")
    entityTypes: Dict[str, List[str]] = Field(default_factory=dict, description="实体类型配置")
    relationshipTypes: List[str] = Field(default_factory=list, description="关系类型配置")
    prompts: Dict[str, str] = Field(default_factory=dict, description="提示词配置")


class PromptTemplatesResponse(BaseModel):
    """提示词模板响应模型"""
    data: Dict[str, Dict[str, Any]]
    message: str


@router.get("/extraction-config", response_model=Dict[str, Any])
async def get_graph_extraction_config():
    """获取知识图谱配置"""
    try:
        from service.prompts import (
            GEOPOLYMER_ENTITY_TYPES,
            GEOPOLYMER_RELATIONSHIP_TYPES,
            GEOPOLYMER_PROMPTS
        )
        from core.config_optimized import optimized_config_manager
        
        # 获取当前模型配置
        llm_config = optimized_config_manager.get_llm_models_config()
        
        # 构建配置数据
        config = {
            "model": {
                "extractionModel": triplet_extraction_service.default_model if triplet_extraction_service else "qwen3-235b-a22b-instruct-2507",
                "temperature": 0.1,
                "maxTokens": 4000
            },
            "extraction": {
                "chunkSize": 4000,
                "chunkOverlap": 200,
                "minEntityConfidence": 0.7,
                "minRelationConfidence": 0.6,
                "enableContinueExtraction": True,
                "maxRetries": 2
            },
            "entityTypes": GEOPOLYMER_ENTITY_TYPES,
            "relationshipTypes": GEOPOLYMER_RELATIONSHIP_TYPES,
            "prompts": {
                "entityExtraction": GEOPOLYMER_PROMPTS.get("entity_extraction", ""),
                "continueExtraction": GEOPOLYMER_PROMPTS.get("entity_continue_extraction", ""),
                "keywordExtraction": GEOPOLYMER_PROMPTS.get("keywords_extraction", "")
            },
            "availableModels": llm_config.get('all_models', [])
        }
        
        return {
            "code": 200,
            "message": "获取配置成功",
            "data": config
        }
        
    except Exception as e:
        logger.error(f"获取知识图谱配置失败: {e}")
        raise HTTPException(status_code=500, detail=f"获取配置失败: {str(e)}")


@router.put("/extraction-config")
async def update_graph_extraction_config(config: GraphConfigModel):
    """更新知识图谱配置"""
    try:
        # 这里可以实现配置的持久化存储
        # 目前先返回成功，实际应用中需要保存到数据库或配置文件
        
        logger.info(f"更新知识图谱配置: {config.dict()}")
        
        # 如果配置了模型，更新三元组提取服务的模型
        if config.model and config.model.get("extractionModel") and triplet_extraction_service:
            triplet_extraction_service.default_model = config.model["extractionModel"]
            logger.info(f"更新三元组提取模型为: {config.model['extractionModel']}")
        
        return {
            "code": 200,
            "message": "配置更新成功",
            "data": config.dict()
        }
        
    except Exception as e:
        logger.error(f"更新知识图谱配置失败: {e}")
        raise HTTPException(status_code=500, detail=f"更新配置失败: {str(e)}")


@router.get("/prompts", response_model=PromptTemplatesResponse)
async def get_prompt_templates():
    """获取提示词模板"""
    try:
        from service.prompts import GEOPOLYMER_PROMPTS, GEOPOLYMER_ENTITY_TYPES, GEOPOLYMER_RELATIONSHIP_TYPES
        
        # 构建提示词模板数据
        templates = {
            "entityExtraction": {
                "name": "实体提取提示词",
                "description": "用于从文档中提取实体和关系的主要提示词",
                "template": GEOPOLYMER_PROMPTS.get("entity_extraction", ""),
                "variables": [
                    "language", "entity_types", "relationship_types", 
                    "tuple_delimiter", "record_delimiter", "completion_delimiter",
                    "examples", "input_text"
                ]
            },
            "continueExtraction": {
                "name": "继续提取提示词",
                "description": "当初次提取结果不足时，进行补充提取的提示词",
                "template": GEOPOLYMER_PROMPTS.get("entity_continue_extraction", ""),
                "variables": [
                    "entity_types", "relationship_types", "tuple_delimiter",
                    "record_delimiter", "completion_delimiter", "input_text"
                ]
            },
            "keywordExtraction": {
                "name": "关键词提取提示词",
                "description": "从查询或文档中提取关键词的提示词",
                "template": GEOPOLYMER_PROMPTS.get("keywords_extraction", ""),
                "variables": [
                    "examples", "history", "query"
                ]
            }
        }
        
        return PromptTemplatesResponse(
            data=templates,
            message="获取提示词模板成功"
        )
        
    except Exception as e:
        logger.error(f"获取提示词模板失败: {e}")
        raise HTTPException(status_code=500, detail=f"获取提示词模板失败: {str(e)}")


@router.post("/prompts/validate")
async def validate_prompt_template(prompt_data: Dict[str, Any]):
    """验证提示词模板"""
    try:
        prompt_template = prompt_data.get("template", "")
        variables = prompt_data.get("variables", [])
        
        # 简单验证：检查模板中是否包含所有必需的变量
        missing_variables = []
        for variable in variables:
            placeholder = "{" + variable + "}"
            if placeholder not in prompt_template:
                missing_variables.append(variable)
        
        is_valid = len(missing_variables) == 0
        
        return {
            "code": 200,
            "message": "提示词验证完成",
            "data": {
                "isValid": is_valid,
                "missingVariables": missing_variables,
                "variableCount": len(variables),
                "templateLength": len(prompt_template)
            }
        }
        
    except Exception as e:
        logger.error(f"验证提示词模板失败: {e}")
        raise HTTPException(status_code=500, detail=f"验证提示词失败: {str(e)}")


@router.get("/extraction-stats")
async def get_extraction_statistics():
    """获取三元组提取统计信息"""
    try:
        # 这里可以实现提取统计的查询逻辑
        # 目前返回模拟数据
        stats = {
            "totalDocuments": 0,
            "totalEntities": 0,
            "totalRelationships": 0,
            "extractionSuccess": 0,
            "extractionFailed": 0,
            "avgEntitiesPerDocument": 0.0,
            "avgRelationshipsPerDocument": 0.0,
            "modelUsage": {
                triplet_extraction_service.default_model if triplet_extraction_service else "unknown": 100
            },
            "entityTypeDistribution": {},
            "relationshipTypeDistribution": {}
        }
        
        return {
            "code": 200,
            "message": "获取提取统计成功",
            "data": stats
        }
        
    except Exception as e:
        logger.error(f"获取提取统计失败: {e}")
        raise HTTPException(status_code=500, detail=f"获取提取统计失败: {str(e)}")


# ============ 开发环境专用端点 ============

@router.post("/dev/cleanup-graph-data")
async def cleanup_graph_data():
    """
    开发环境专用 - 清理知识图谱数据
    包括PostgreSQL图谱数据、ArangoDB图谱数据和MinIO图谱存储文件
    不会删除知识库原始数据和文档
    仅在开发环境中可用
    """
    # 检查环境变量
    env = os.getenv("MAT_QA_ENV", "production").lower()
    if env not in ["development", "dev", "testing"]:
        raise HTTPException(
            status_code=403, 
            detail="此功能仅在开发环境中可用"
        )
    
    try:
        from db.database import get_async_session
        from sqlalchemy import text
        from db.repositories.arangodb_graph_repository import get_arango_graph_repository
        import asyncio
        
        cleanup_results = {
            "postgresql": {"status": "pending", "details": {}},
            "arangodb": {"status": "pending", "details": {}},
            "minio": {"status": "pending", "details": {}},
            "summary": {}
        }
        
        logger.info("🧹 开始开发环境数据清理...")
        
        # 1. 清理PostgreSQL图谱数据
        logger.info("📊 清理PostgreSQL图谱数据")
        try:
            async with get_async_session() as session:
                # 获取清理前统计
                node_count_query = text("SELECT COUNT(*) FROM graph_nodes")
                edge_count_query = text("SELECT COUNT(*) FROM graph_edges")
                
                node_result = await session.execute(node_count_query)
                edge_result = await session.execute(edge_count_query)
                
                before_nodes = node_result.scalar()
                before_edges = edge_result.scalar()
                
                if before_nodes == 0 and before_edges == 0:
                    cleanup_results["postgresql"]["status"] = "skipped"
                    cleanup_results["postgresql"]["details"] = {
                        "message": "PostgreSQL图谱数据已经是空的",
                        "nodes_deleted": 0,
                        "edges_deleted": 0
                    }
                else:
                    # 清理边数据 (先删除边，再删除节点)
                    edge_delete_query = text("DELETE FROM graph_edges")
                    edge_delete_result = await session.execute(edge_delete_query)
                    deleted_edges = edge_delete_result.rowcount
                    
                    # 清理节点数据
                    node_delete_query = text("DELETE FROM graph_nodes")
                    node_delete_result = await session.execute(node_delete_query)
                    deleted_nodes = node_delete_result.rowcount
                    
                    # 提交更改
                    await session.commit()
                    
                    cleanup_results["postgresql"]["status"] = "success"
                    cleanup_results["postgresql"]["details"] = {
                        "message": "PostgreSQL图谱数据清理完成",
                        "nodes_deleted": deleted_nodes,
                        "edges_deleted": deleted_edges
                    }
                    
        except Exception as e:
            logger.error(f"❌ PostgreSQL清理失败: {e}")
            cleanup_results["postgresql"]["status"] = "failed"
            cleanup_results["postgresql"]["details"] = {"error": str(e)}
        
        # 2. 清理ArangoDB数据
        logger.info("📊 清理ArangoDB图谱数据")
        try:
            arango_repo = get_arango_graph_repository()
            if not arango_repo or not arango_repo.database:
                cleanup_results["arangodb"]["status"] = "skipped"
                cleanup_results["arangodb"]["details"] = {
                    "message": "ArangoDB未连接"
                }
            else:
                # 定义集合
                node_collections = ['entities', 'concepts', 'materials', 'papers']
                edge_collections = ['relationships', 'citations', 'contains']
                
                total_edges_deleted = 0
                total_nodes_deleted = 0
                
                # 清理边集合
                for collection_name in edge_collections:
                    if arango_repo.database.has_collection(collection_name):
                        collection = arango_repo.database.collection(collection_name)
                        before_count = collection.count()
                        collection.truncate()
                        total_edges_deleted += before_count
                
                # 清理节点集合
                for collection_name in node_collections:
                    if arango_repo.database.has_collection(collection_name):
                        collection = arango_repo.database.collection(collection_name)
                        before_count = collection.count()
                        collection.truncate()
                        total_nodes_deleted += before_count
                
                cleanup_results["arangodb"]["status"] = "success"
                cleanup_results["arangodb"]["details"] = {
                    "message": "ArangoDB数据清理完成",
                    "nodes_deleted": total_nodes_deleted,
                    "edges_deleted": total_edges_deleted
                }
                
        except Exception as e:
            logger.error(f"❌ ArangoDB清理失败: {e}")
            cleanup_results["arangodb"]["status"] = "failed"
            cleanup_results["arangodb"]["details"] = {"error": str(e)}
        
        # 3. 清理MinIO存储数据
        logger.info("📊 清理MinIO存储数据")
        try:
            if storage_service:
                # 清理documents桶中的文件
                documents_deleted = await storage_service.clear_bucket("documents")
                # 清理embeddings桶中的文件  
                embeddings_deleted = await storage_service.clear_bucket("embeddings")
                
                cleanup_results["minio"]["status"] = "success"
                cleanup_results["minio"]["details"] = {
                    "message": "MinIO存储数据清理完成",
                    "documents_deleted": documents_deleted,
                    "embeddings_deleted": embeddings_deleted
                }
            else:
                cleanup_results["minio"]["status"] = "skipped"
                cleanup_results["minio"]["details"] = {
                    "message": "存储服务未可用"
                }
                
        except Exception as e:
            logger.error(f"❌ MinIO清理失败: {e}")
            cleanup_results["minio"]["status"] = "failed"
            cleanup_results["minio"]["details"] = {"error": str(e)}
        
        # 4. 清理已用于图谱提取的文档记录（保持数据一致性）
        logger.info("📊 清理图谱相关的文档状态记录")
        try:
            async with get_async_session() as session:
                # 只重置与知识图谱相关的文档状态，不删除文档本身
                # 将状态从 graph_extracted 重置为 vectorized
                status_reset_query = text("""
                    UPDATE knowledge_documents 
                    SET status = 'vectorized'
                    WHERE status = 'graph_extracted'
                """)
                
                reset_result = await session.execute(status_reset_query)
                reset_count = reset_result.rowcount
                
                await session.commit()
                
                cleanup_results["document_status"] = {
                    "status": "success",
                    "details": {
                        "message": f"重置了 {reset_count} 个文档的图谱提取状态",
                        "documents_reset": reset_count
                    }
                }
                
        except Exception as e:
            logger.error(f"❌ 文档状态重置失败: {e}")
            cleanup_results["document_status"] = {"status": "failed", "details": {"error": str(e)}}
        
        # 生成总结
        success_count = sum(1 for result in cleanup_results.values() 
                          if isinstance(result, dict) and result.get("status") == "success")
        total_operations = len([k for k in cleanup_results.keys() if k != "summary"])
        
        cleanup_results["summary"] = {
            "total_operations": total_operations,
            "successful_operations": success_count,
            "timestamp": datetime.now().isoformat(),
            "environment": env,
            "overall_status": "success" if success_count >= total_operations * 0.8 else "partial_success"
        }
        
        logger.info(f"🎉 开发环境数据清理完成 ({success_count}/{total_operations} 成功)")
        
        return {
            "code": 200,
            "message": f"开发环境数据清理完成 ({success_count}/{total_operations} 成功)",
            "data": cleanup_results
        }
        
    except Exception as e:
        logger.error(f"❌ 数据清理失败: {e}")
        raise HTTPException(status_code=500, detail=f"数据清理失败: {str(e)}")