"""
智能检索服务 - 集成QA路由
在现有检索链路前增加QA路由层
"""
from typing import List, Dict, Any, Optional
from service.intelligent_retrieval_service import IntelligentRetrievalService, IntelligentSearchResult
from service.qa_routing_service import qa_routing_service
from models.qa_routing import QARouteQuery
from core.logger import logger
import os


class IntelligentRetrievalServiceWithRouting(IntelligentRetrievalService):
    """集成QA路由的智能检索服务"""
    
    def __init__(self):
        super().__init__()
        self.qa_routing_enabled = os.getenv('USE_QA_ROUTING', 'false').lower() == 'true'
        logger.info(f"QA路由功能状态: {'启用' if self.qa_routing_enabled else '禁用'}")
    
    async def intelligent_search(
        self,
        query: str,
        top_k: int = 20,
        filters: Optional[Dict[str, Any]] = None,
        collection_id: Optional[str] = None,
        user_mode: Optional[str] = None,
        include_highlights: bool = True,
        enable_reranking: bool = True,
        original_query: Optional[str] = None,
        translated_query: Optional[str] = None,
        knowledge_base_id: Optional[str] = None  # 新增参数
    ) -> IntelligentSearchResult:
        """
        执行智能检索 - 增加QA路由层
        
        优先级：
        1. QA路由（如果启用且有匹配）
        2. 向量检索（QA数据集 + 文档）
        3. 知识图谱（如果需要）
        """
        
        # 如果启用了QA路由且提供了知识库ID
        if self.qa_routing_enabled and knowledge_base_id:
            try:
                logger.info(f"[QA_ROUTING] 尝试QA路由检索: {query[:50]}...")
                
                # 查询QA路由
                qa_route_query = QARouteQuery(
                    knowledge_base_id=knowledge_base_id,
                    query=query,
                    use_semantic=True,  # 使用语义匹配
                    max_results=3
                )
                
                qa_routing_response = await qa_routing_service.search_qa_routes(
                    qa_route_query
                )
                
                # 如果找到高置信度的QA路由匹配
                if qa_routing_response.matched_routes:
                    best_match = qa_routing_response.matched_routes[0]
                    
                    # 如果匹配分数足够高，直接返回QA路由结果
                    if best_match.match_score >= 0.8:
                        logger.info(f"[QA_ROUTING] ✅ 找到高置信度匹配 (分数: {best_match.match_score:.2f})")
                        
                        # 构造返回结果
                        formatted_results = [{
                            'id': str(best_match.route.id),
                            'content': best_match.route.answer,
                            'question': best_match.route.question,
                            'score': best_match.match_score,
                            'source': 'qa_route',
                            'metadata': {
                                'category': best_match.route.category,
                                'keywords': best_match.route.keywords,
                                'match_method': best_match.match_method.value
                            }
                        }]
                        
                        # 如果还有其他匹配，也加入结果
                        for match in qa_routing_response.matched_routes[1:3]:
                            if match.match_score >= 0.6:
                                formatted_results.append({
                                    'id': str(match.route.id),
                                    'content': match.route.answer,
                                    'question': match.route.question,
                                    'score': match.match_score,
                                    'source': 'qa_route',
                                    'metadata': {
                                        'category': match.route.category,
                                        'keywords': match.route.keywords,
                                        'match_method': match.match_method.value
                                    }
                                })
                        
                        return IntelligentSearchResult(
                            results=formatted_results,
                            strategy_used='qa_routing',
                            total_matches=len(formatted_results),
                            query_analysis={'qa_route_matched': True},
                            document_distribution={'qa_routes': len(formatted_results)},
                            performance_metrics={
                                'qa_route_score': best_match.match_score,
                                'total_time_ms': qa_routing_response.total_time_ms
                            }
                        )
                    else:
                        logger.info(f"[QA_ROUTING] 匹配分数较低 ({best_match.match_score:.2f})，继续向量检索")
                else:
                    logger.info("[QA_ROUTING] 未找到匹配的QA路由，继续向量检索")
                    
            except Exception as e:
                logger.error(f"[QA_ROUTING] QA路由检索失败: {e}")
        
        # 如果QA路由未匹配或分数不够高，继续执行原有的向量检索
        return await super().intelligent_search(
            query=query,
            top_k=top_k,
            filters=filters,
            collection_id=collection_id,
            user_mode=user_mode,
            include_highlights=include_highlights,
            enable_reranking=enable_reranking,
            original_query=original_query,
            translated_query=translated_query
        )


# 创建服务实例
intelligent_retrieval_service_with_routing = IntelligentRetrievalServiceWithRouting()