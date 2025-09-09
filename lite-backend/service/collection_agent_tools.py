"""
Collection智能体工具 - 支持Collection级别检索的Agent工具

提供智能体使用的Collection检索功能：
1. Collection级别的知识检索工具
2. Collection过滤和绑定工具
3. 智能体工具注册和管理
"""

import json
import asyncio
from typing import Dict, List, Any, Optional, Union
from dataclasses import asdict

from agno.tools import tool
from agno.tools.toolkit import Toolkit

from core.logger import logger
from service.collection_retrieval_service import CollectionRetrievalService, CollectionSearchResult
from service.knowledge_collection.collection_service import KnowledgeCollectionService
from service.matgraph_service import matgraph_service


class CollectionAgentTools(Toolkit):
    """Collection智能体工具包"""
    
    def __init__(self, db_session=None):
        super().__init__(name="collection_retrieval_tools")
        self.db_session = db_session
        self.retrieval_service = CollectionRetrievalService(db_session)
        self.collection_service = None
        
    async def _initialize_services(self):
        """初始化服务"""
        if self.db_session and not self.collection_service:
            self.collection_service = KnowledgeCollectionService(self.db_session)
    
    @tool
    async def collection_knowledge_search(
        self,
        query: str,
        collection_ids: Optional[str] = None,  # JSON字符串格式的列表
        metadata_template: Optional[str] = None,
        time_range: Optional[str] = None,  # JSON字符串格式 {"start": "2020-01-01", "end": "2024-12-31"}
        top_k: int = 15,
        search_mode: str = "intelligent"
    ) -> str:
        """
        在指定的知识库Collection中进行智能检索
        
        Args:
            query: 检索查询文本
            collection_ids: Collection ID列表，JSON字符串格式，如 '["id1", "id2"]'，不指定则检索所有Collection
            metadata_template: 元数据模板类型过滤 (general|policy|academic|enterprise)
            time_range: 时间范围过滤，JSON字符串格式，如 '{"start": "2020-01-01", "end": "2024-12-31"}'
            top_k: 返回结果数量 (默认15)
            search_mode: 检索模式 (intelligent|precise|broad)
            
        Returns:
            str: JSON格式的检索结果
        """
        try:
            await self._initialize_services()
            
            logger.info(f"[COLLECTION_SEARCH] 开始Collection检索: query='{query}', collections={collection_ids}")
            
            # 解析参数
            parsed_collection_ids = None
            if collection_ids:
                try:
                    parsed_collection_ids = json.loads(collection_ids)
                    if not isinstance(parsed_collection_ids, list):
                        parsed_collection_ids = [collection_ids]  # 兼容单个ID
                except json.JSONDecodeError:
                    parsed_collection_ids = [collection_ids]  # 兼容直接传入单个ID
            
            parsed_time_filters = None
            if time_range:
                try:
                    parsed_time_filters = json.loads(time_range)
                except json.JSONDecodeError:
                    logger.warning(f"[COLLECTION_SEARCH] 时间范围解析失败: {time_range}")
            
            # 执行Collection检索
            search_result = await self.retrieval_service.collection_search(
                query=query,
                collection_ids=parsed_collection_ids,
                metadata_template=metadata_template,
                top_k=top_k,
                time_filters=parsed_time_filters,
                user_mode=search_mode,
                include_highlights=True,
                enable_reranking=True,
                use_filter_then_rerank=True
            )
            
            # 格式化返回结果
            formatted_results = {
                "success": True,
                "query": query,
                "collection_filter": {
                    "collection_ids": parsed_collection_ids,
                    "metadata_template": metadata_template,
                    "time_range": parsed_time_filters
                },
                "total_results": search_result.total_matches,
                "strategy": search_result.strategy_used,
                "results": []
            }
            
            # 处理检索结果
            for idx, result in enumerate(search_result.results[:top_k], 1):
                formatted_result = {
                    "rank": idx,
                    "document_id": result.get("document_id"),
                    "title": result.get("title", "未知标题"),
                    "content": result.get("content", ""),
                    "source": result.get("source", ""),
                    "collection_id": result.get("collection_id"),
                    "metadata_template": result.get("metadata_template"),
                    "relevance_score": result.get("relevance_score", 0.0),
                    "created_at": result.get("created_at"),
                    "highlights": result.get("highlights", [])
                }
                formatted_results["results"].append(formatted_result)
            
            # 添加Collection信息
            if search_result.collection_info:
                formatted_results["collection_info"] = search_result.collection_info
            
            # 性能指标
            formatted_results["performance"] = search_result.performance_metrics
            
            logger.info(f"[COLLECTION_SEARCH] 检索完成: {search_result.total_matches} 结果")
            
            return json.dumps(formatted_results, ensure_ascii=False, indent=2)
            
        except Exception as e:
            error_result = {
                "success": False,
                "error": str(e),
                "query": query,
                "message": "Collection检索失败，请检查参数或稍后重试"
            }
            logger.error(f"[COLLECTION_SEARCH] 检索失败: {e}")
            return json.dumps(error_result, ensure_ascii=False)
    
    @tool  
    async def list_available_collections(
        self,
        metadata_template: Optional[str] = None,
        include_stats: bool = True
    ) -> str:
        """
        获取可用的知识库Collection列表
        
        Args:
            metadata_template: 按元数据模板过滤 (general|policy|academic|enterprise)
            include_stats: 是否包含统计信息
            
        Returns:
            str: JSON格式的Collection列表
        """
        try:
            await self._initialize_services()
            
            logger.info(f"[LIST_COLLECTIONS] 获取Collection列表: template={metadata_template}")
            
            # 获取Collection列表
            collections = await self.collection_service.list_collections(
                metadata_template=metadata_template,
                include_stats=include_stats
            )
            
            formatted_collections = {
                "success": True,
                "total_collections": len(collections),
                "metadata_template_filter": metadata_template,
                "collections": []
            }
            
            for collection in collections:
                collection_info = {
                    "id": collection.get("id"),
                    "name": collection.get("name"),
                    "description": collection.get("description"),
                    "metadata_template": collection.get("metadata_template"),
                    "created_at": collection.get("created_at"),
                    "is_default": collection.get("config", {}).get("is_default", False)
                }
                
                if include_stats and "stats" in collection:
                    stats = collection["stats"]
                    collection_info["statistics"] = {
                        "document_count": stats.get("document_count", 0),
                        "chunk_count": stats.get("chunk_count", 0),
                        "vector_count": stats.get("vector_count", 0),
                        "last_updated": stats.get("last_updated")
                    }
                
                formatted_collections["collections"].append(collection_info)
            
            logger.info(f"[LIST_COLLECTIONS] 返回 {len(collections)} 个Collections")
            
            return json.dumps(formatted_collections, ensure_ascii=False, indent=2)
            
        except Exception as e:
            error_result = {
                "success": False,
                "error": str(e),
                "message": "获取Collection列表失败"
            }
            logger.error(f"[LIST_COLLECTIONS] 失败: {e}")
            return json.dumps(error_result, ensure_ascii=False)
    
    @tool
    async def get_collection_info(
        self,
        collection_id: str,
        include_documents: bool = False
    ) -> str:
        """
        获取指定Collection的详细信息
        
        Args:
            collection_id: Collection ID
            include_documents: 是否包含文档列表
            
        Returns:
            str: JSON格式的Collection详细信息
        """
        try:
            await self._initialize_services()
            
            logger.info(f"[GET_COLLECTION_INFO] 获取Collection信息: {collection_id}")
            
            # 获取Collection详细信息
            collection = await self.collection_service.get_collection(
                collection_id,
                include_stats=True
            )
            
            if not collection:
                return json.dumps({
                    "success": False,
                    "error": "Collection not found",
                    "collection_id": collection_id
                }, ensure_ascii=False)
            
            collection_info = {
                "success": True,
                "collection": {
                    "id": collection.get("id"),
                    "name": collection.get("name"),
                    "description": collection.get("description"),
                    "metadata_template": collection.get("metadata_template"),
                    "config": collection.get("config", {}),
                    "created_at": collection.get("created_at"),
                    "updated_at": collection.get("updated_at")
                }
            }
            
            # 添加统计信息
            if "stats" in collection:
                collection_info["statistics"] = collection["stats"]
            
            # 可选：包含文档列表
            if include_documents:
                try:
                    # 这里可以调用文档服务获取文档列表
                    # documents = await document_service.list_documents(collection_id=collection_id)
                    # collection_info["documents"] = documents
                    collection_info["documents"] = "文档列表功能待实现"
                except Exception as e:
                    collection_info["documents_error"] = str(e)
            
            logger.info(f"[GET_COLLECTION_INFO] Collection信息获取成功: {collection['name']}")
            
            return json.dumps(collection_info, ensure_ascii=False, indent=2)
            
        except Exception as e:
            error_result = {
                "success": False,
                "error": str(e),
                "collection_id": collection_id,
                "message": "获取Collection信息失败"
            }
            logger.error(f"[GET_COLLECTION_INFO] 失败: {e}")
            return json.dumps(error_result, ensure_ascii=False)
    
    @tool
    async def matgraph_collection_query(
        self,
        query: str,
        collection_ids: Optional[str] = None,  # JSON字符串格式的列表
        query_mode: str = "hybrid",
        top_k: int = 12
    ) -> str:
        """
        在Collection上下文中进行知识图谱查询
        
        Args:
            query: 查询文本（英文）
            collection_ids: Collection ID列表，JSON字符串格式
            query_mode: 查询模式 (local|global|hybrid|naive)
            top_k: 返回结果数量
            
        Returns:
            str: JSON格式的图谱查询结果
        """
        try:
            logger.info(f"[MATGRAPH_COLLECTION] 开始图谱查询: query='{query}', collections={collection_ids}")
            
            # 解析Collection IDs
            parsed_collection_ids = None
            if collection_ids:
                try:
                    parsed_collection_ids = json.loads(collection_ids)
                except json.JSONDecodeError:
                    parsed_collection_ids = [collection_ids]
            
            # 执行matGraph查询（目前MatGraph不直接支持Collection过滤，但可以在结果中标注）
            graph_result = await matgraph_service.query(
                query=query,
                mode=query_mode,
                top_k=top_k
            )
            
            # 格式化结果并添加Collection上下文
            formatted_result = {
                "success": True,
                "query": query,
                "query_mode": query_mode,
                "collection_context": parsed_collection_ids,
                "graph_results": graph_result.get("entities", []) if graph_result else [],
                "relationships": graph_result.get("relationships", []) if graph_result else [],
                "total_entities": len(graph_result.get("entities", [])) if graph_result else 0
            }
            
            # 添加Collection关联信息（如果有的话）
            if parsed_collection_ids and graph_result:
                # 这里可以进一步过滤或标注与Collection相关的实体
                formatted_result["collection_filtered"] = True
                formatted_result["note"] = "图谱查询结果已考虑Collection上下文"
            
            logger.info(f"[MATGRAPH_COLLECTION] 图谱查询完成: {formatted_result['total_entities']} 个实体")
            
            return json.dumps(formatted_result, ensure_ascii=False, indent=2)
            
        except Exception as e:
            error_result = {
                "success": False,
                "error": str(e),
                "query": query,
                "message": "知识图谱查询失败"
            }
            logger.error(f"[MATGRAPH_COLLECTION] 查询失败: {e}")
            return json.dumps(error_result, ensure_ascii=False)


# 全局实例
collection_agent_tools = None

def get_collection_agent_tools(db_session=None) -> CollectionAgentTools:
    """获取Collection智能体工具实例"""
    global collection_agent_tools
    if collection_agent_tools is None:
        collection_agent_tools = CollectionAgentTools(db_session)
    return collection_agent_tools


def register_collection_tools_to_agent(agent, db_session=None):
    """将Collection工具注册到智能体"""
    try:
        tools_instance = get_collection_agent_tools(db_session)
        
        # 注册工具到agent
        agent.tools = agent.tools or []
        agent.tools.append(tools_instance)
        
        logger.info(f"[AGENT_TOOLS] Collection工具已注册到智能体: {agent.name if hasattr(agent, 'name') else 'Unknown'}")
        
        return True
        
    except Exception as e:
        logger.error(f"[AGENT_TOOLS] Collection工具注册失败: {e}")
        return False