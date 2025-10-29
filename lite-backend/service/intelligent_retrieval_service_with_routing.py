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

    def _resolve_tool_params(
        self,
        tool_params: Dict[str, Any],
        query: str,
        matched_question: str,
        qa_answer: str
    ) -> Dict[str, Any]:
        """
        解析工具参数模板变量

        支持的模板变量：
        - {query}: 用户的原始问题
        - {matched_question}: 匹配到的QA问题
        - {qa_answer}: QA配置的答案

        示例：
        tool_params = {
            "baidu_search": {
                "query": "{query}",
                "count": 5
            }
        }

        Returns:
            解析后的工具参数字典
        """
        if not tool_params:
            # 如果没有配置参数，使用默认策略：用户问题作为query参数
            logger.info("[QA_ROUTING] 未配置tool_params，使用默认策略（用户问题作为query）")
            return {"query": query}

        resolved = {}
        template_vars = {
            '{query}': query,
            '{matched_question}': matched_question,
            '{qa_answer}': qa_answer
        }

        for tool_name, params in tool_params.items():
            resolved[tool_name] = {}
            if isinstance(params, dict):
                for param_key, param_value in params.items():
                    # 如果参数值是字符串，尝试替换模板变量
                    if isinstance(param_value, str):
                        resolved_value = param_value
                        for template_var, actual_value in template_vars.items():
                            resolved_value = resolved_value.replace(template_var, actual_value)
                        resolved[tool_name][param_key] = resolved_value
                    else:
                        # 非字符串参数直接使用原值
                        resolved[tool_name][param_key] = param_value
            else:
                resolved[tool_name] = params

        logger.info(f"[QA_ROUTING] 参数模板解析: {tool_params} -> {resolved}")
        return resolved
    
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
        # 统一将 UUID 等类型转换为字符串，避免下游 SQL 绑定报类型错
        if knowledge_base_id is not None:
            try:
                knowledge_base_id = str(knowledge_base_id)
            except Exception:
                pass

        if self.qa_routing_enabled and knowledge_base_id:
            try:
                logger.info(f"[QA_ROUTING] 尝试QA路由检索: {query[:50]}...")
                
                # 查询QA路由
                # 将上游 filters 中的 metadata_filters 映射到 QARouteQuery.filters（List[{key,op,value}]）
                list_filters = None
                try:
                    if isinstance(filters, dict) and isinstance(filters.get('metadata_filters'), list):
                        list_filters = [
                            { 'key': f.get('key'), 'op': f.get('op', '='), 'value': f.get('value') }
                            for f in filters.get('metadata_filters') if isinstance(f, dict) and f.get('key')
                        ]
                except Exception:
                    list_filters = None

                qa_route_query = QARouteQuery(
                    knowledge_base_id=str(knowledge_base_id),
                    query=query,
                    use_semantic=True,  # 使用语义匹配
                    max_results=3,
                    filters=list_filters
                )
                
                qa_routing_response = await qa_routing_service.search_qa_routes(
                    qa_route_query
                )

                # 🔥 修复：检查retrieval_paths而不是matched_routes（QA_DATASETS的结果在retrieval_paths中）
                if qa_routing_response.retrieval_paths and qa_routing_response.retrieval_paths[0].results:
                    first_path = qa_routing_response.retrieval_paths[0]
                    first_result = first_path.results[0]

                    # 对于QA_DATASETS，使用confidence而不是match_score
                    score = first_result.get('confidence', 0) if isinstance(first_result, dict) else getattr(first_result, 'match_score', 0)

                    # 如果匹配分数足够高，处理QA路由结果
                    if score >= 0.6:  # 🔥 降低阈值从0.8到0.6，更容易命中
                        logger.info(f"[QA_ROUTING] ✅ 找到自定义QA匹配 (分数: {score:.2f})")

                        # 🔥 新增：检查qa_metadata中的增强配置
                        qa_metadata = first_result.get('metadata', {}) if isinstance(first_result, dict) else {}
                        enable_kb_routing = qa_metadata.get('enable_kb_routing', False)
                        route_to_kb_ids = qa_metadata.get('route_to_kb_ids', [])
                        enable_tool_call = qa_metadata.get('enable_tool_call', False)
                        tool_names = qa_metadata.get('tool_names', [])

                        logger.info(f"[QA_ROUTING] 增强配置: KB路由={enable_kb_routing}, 工具调用={enable_tool_call}")

                        # 构造基础返回结果：从QA pairs直接取数据
                        formatted_results = [{
                            'id': first_result.get('id'),
                            'content': first_result.get('content'),  # QA pairs的answer
                            'question': first_result.get('question'),
                            'score': score,
                            'source': 'qa_dataset',  # 标记为qa_dataset而不是qa_route
                            'metadata': {
                                **qa_metadata,
                                'from_qa_routing': True,  # 标记这是通过QA routing匹配的
                                # 🔥 新增：将增强配置传递到结果中
                                'enable_kb_routing': enable_kb_routing,
                                'route_to_kb_ids': route_to_kb_ids,
                                'enable_tool_call': enable_tool_call,
                                'tool_names': tool_names
                            }
                        }]

                        # 🔥 新增：如果启用了KB路由，继续检索指定的知识库
                        if enable_kb_routing and route_to_kb_ids:
                            logger.info(f"[QA_ROUTING] 🔗 执行KB路由检索: {len(route_to_kb_ids)} 个知识库")
                            try:
                                for kb_id in route_to_kb_ids:
                                    logger.info(f"[QA_ROUTING] 检索知识库: {kb_id}")
                                    # 调用父类的向量检索方法，检索指定知识库
                                    kb_results = await super().intelligent_search(
                                        query=query,
                                        top_k=5,
                                        filters={'collection_id': kb_id} if filters is None else {**filters, 'collection_id': kb_id},
                                        collection_id=kb_id,
                                        user_mode=user_mode,
                                        include_highlights=include_highlights,
                                        enable_reranking=enable_reranking,
                                        original_query=original_query,
                                        translated_query=translated_query
                                    )
                                    # 将KB检索结果添加到结果列表
                                    if kb_results and kb_results.results:
                                        for result in kb_results.results[:5]:  # 每个KB最多取5条
                                            result['source'] = f'kb_routing_{kb_id}'
                                            result['metadata']['routed_from_qa'] = first_result.get('id')
                                            formatted_results.append(result)
                                        logger.info(f"[QA_ROUTING] KB {kb_id} 检索到 {len(kb_results.results)} 条结果")
                            except Exception as e:
                                logger.error(f"[QA_ROUTING] KB路由检索失败: {e}")

                        # 🔥 新增：如果启用了工具调用，将工具信息附加到第一个结果中
                        if enable_tool_call and tool_names:
                            # 获取工具参数配置
                            tool_params = qa_metadata.get('tool_params', {})

                            # 解析参数模板变量
                            resolved_params = self._resolve_tool_params(
                                tool_params=tool_params,
                                query=query,
                                matched_question=first_result.get('question', ''),
                                qa_answer=first_result.get('content', '')
                            )

                            formatted_results[0]['requires_tool_calls'] = tool_names
                            formatted_results[0]['tool_params'] = resolved_params  # 🔥 新增：传递解析后的工具参数
                            formatted_results[0]['metadata']['requires_tool_calls'] = True
                            formatted_results[0]['metadata']['tool_params'] = resolved_params
                            logger.info(f"[QA_ROUTING] 🔧 需要调用工具: {tool_names}")
                            logger.info(f"[QA_ROUTING] 🔧 工具参数: {resolved_params}")

                        # 如果还有其他QA pairs匹配，也加入结果
                        for additional_result in first_path.results[1:3]:
                            if isinstance(additional_result, dict):
                                add_score = additional_result.get('confidence', 0)
                                if add_score >= 0.5:  # 略低的阈值
                                    formatted_results.append({
                                        'id': additional_result.get('id'),
                                        'content': additional_result.get('content'),
                                        'question': additional_result.get('question'),
                                        'score': add_score,
                                        'source': 'qa_dataset',
                                        'metadata': additional_result.get('metadata', {})
                                    })

                        return IntelligentSearchResult(
                            results=formatted_results,
                            strategy_used='qa_routing_enhanced' if (enable_kb_routing or enable_tool_call) else 'qa_routing',
                            total_matches=len(formatted_results),
                            query_analysis={
                                'qa_route_matched': True,
                                'kb_routing_enabled': enable_kb_routing,
                                'tool_call_enabled': enable_tool_call
                            },
                            document_distribution={
                                'qa_datasets': 1,
                                'kb_routed_docs': len(formatted_results) - 1 if enable_kb_routing else 0
                            },
                            performance_metrics={
                                'qa_route_score': score,
                                'total_time_ms': qa_routing_response.total_time_ms
                            }
                        )
                    else:
                        logger.info(f"[QA_ROUTING] 匹配分数较低 ({score:.2f})，继续向量检索")
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
