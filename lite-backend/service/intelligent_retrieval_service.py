"""
智能检索服务 - 自动选择最优检索策略
"""
from typing import List, Dict, Any, Optional
from dataclasses import dataclass

from core.logger import logger
from service.hybrid_search_service import hybrid_search_service, SearchResult
from service.vectorization_config_service import vectorization_config_service
from service.embedding_service import embedding_service
from service.weighted_retrieval_service import weighted_retrieval_service, WeightedSearchResult



@dataclass
class IntelligentSearchResult:
    """智能检索结果"""
    results: List[Dict[str, Any]]
    strategy_used: str
    total_matches: int
    query_analysis: Dict[str, Any]
    document_distribution: Dict[str, Any]
    performance_metrics: Dict[str, Any]


class IntelligentRetrievalService:
    """智能检索服务"""
    
    def __init__(self):
        self.hybrid_service = hybrid_search_service
        self.config_service = vectorization_config_service
        self.embedding_service = embedding_service
    
    async def intelligent_search(
        self,
        query: str,
        top_k: int = 20,
        filters: Optional[Dict[str, Any]] = None,
        collection_id: Optional[str] = None,
        user_mode: Optional[str] = None,
        include_highlights: bool = True,
        enable_reranking: bool = True,
        original_query: Optional[str] = None,  # 用于QA数据检索的中文原始查询
        translated_query: Optional[str] = None  # 用于文档数据检索的英文翻译查询
    ) -> IntelligentSearchResult:
        """
        执行智能检索 - 简化后的逻辑
        
        Args:
            query: 查询文本
            top_k: 返回结果数量
            filters: 过滤条件
            collection_id: Collection ID过滤
            user_mode: 用户指定的检索模式 (dual|general|domain)
            include_highlights: 是否包含高亮
            enable_reranking: 是否启用重排序
        """
        
        try:
            # 1. 分析查询（简化）
            query_analysis = await self._analyze_query(query)
            
            # 2. 决定检索策略（简化后的逻辑）
            retrieval_mode = self._decide_simplified_retrieval_mode(user_mode)
            
            # 3. 获取检索参数
            params = self._get_simplified_retrieval_params(retrieval_mode, query)
            
            # 4. 执行检索 - 智能路由到不同数据源
            search_results = await self._execute_simplified_search(
                query=query,
                mode=retrieval_mode,
                params=params,
                top_k=top_k,
                filters=filters,
                collection_id=collection_id,
                include_highlights=include_highlights,
                original_query=original_query,  # 传递原始查询
                translated_query=translated_query  # 传递翻译查询
            )
            
            # 5. 后处理和重排序
            if enable_reranking and search_results:
                # 转换为兼容格式进行重排序
                compatible_results = self._convert_to_search_results(search_results)
                reranked_results = await self.hybrid_service.rerank_results(
                    query, compatible_results
                )
                # 转换回权重搜索结果格式
                search_results = self._convert_back_to_weighted_results(reranked_results, search_results)
            
            # 6. 转换为输出格式
            formatted_results = self._format_results(search_results)
            
            # 7. 收集性能指标
            performance_metrics = {
                "query_length": len(query),
                "results_count": len(formatted_results),
                "strategy_confidence": query_analysis.get("confidence", 0.0),
                "reranking_applied": enable_reranking,
                "dual_vector_enabled": self.config_service.is_dual_vector_enabled()
            }
            
            return IntelligentSearchResult(
                results=formatted_results,
                strategy_used=retrieval_mode,
                total_matches=len(formatted_results),
                query_analysis=query_analysis,
                document_distribution={},  # 简化后不再需要复杂的分布统计
                performance_metrics=performance_metrics
            )
            
        except Exception as e:
            logger.error(f"智能检索失败: {e}")
            raise
    
    def _decide_simplified_retrieval_mode(self, user_mode: Optional[str] = None) -> str:
        """
        简化的检索模式决策 - 基于系统配置
        """
        # 如果用户指定了模式，优先使用
        if user_mode and user_mode in ["dual", "general", "domain"]:
            return user_mode
        
        # 检查双向量化是否启用
        if not self.config_service.is_dual_vector_enabled():
            return "general"  # 如果双向量化关闭，只能使用通用模式
        
        # 使用系统配置的默认检索模式
        return self.config_service.get_retrieval_mode()
    
    def _get_simplified_retrieval_params(self, mode: str, query: str) -> Dict[str, Any]:
        """
        获取简化的检索参数
        """
        retrieval_config = self.config_service.retrieval_config
        
        # 默认权重配置
        default_weights = retrieval_config.get('weights', {
            'general': 0.4,
            'domain': 0.6
        })
        
        params = {
            "mode": mode,
            "weights": default_weights.copy(),
            "top_k": retrieval_config.get('top_k', 10),
            "similarity_threshold": retrieval_config.get('similarity_threshold', 0.7),
            "enable_reranking": retrieval_config.get('enable_reranking', True)
        }
        
        # 根据模式调整权重
        if mode == "general":
            params["weights"] = {"general": 1.0, "domain": 0.0}
        elif mode == "domain":
            params["weights"] = {"general": 0.0, "domain": 1.0}
        # dual模式保持配置的平衡权重
        
        return params
    
    async def _execute_simplified_search(
        self,
        query: str,
        mode: str,
        params: Dict[str, Any],
        top_k: int,
        filters: Optional[Dict[str, Any]] = None,
        collection_id: Optional[str] = None,
        include_highlights: bool = True,
        original_query: Optional[str] = None,
        translated_query: Optional[str] = None
    ) -> List[WeightedSearchResult]:
        """
        执行基于权重的搜索逻辑（按照文档要求）
        """
        try:
            # 🔥 优化：根据检索模式决定是否包含QA数据
            doc_top_k = top_k
            qa_top_k = top_k
            
            # 使用新的权重检索服务，支持智能路由查询
            results = await weighted_retrieval_service.weighted_search(
                query=query,
                top_k=doc_top_k,  # 文档检索使用完整top_k
                mode=mode,
                filters=filters,
                include_highlights=include_highlights,
                custom_weights=params.get("custom_weights"),
                original_query=original_query,  # 传递原始查询（用于QA数据）
                translated_query=translated_query  # 传递翻译查询（用于文档数据）
            )
            
            # 🔥 优化：添加QA数据检索，使用完整的top_k
            qa_results = await self._search_qa_data(query, qa_top_k)
            
            # 合并文档和QA结果
            all_results = results + qa_results
            
            # 🔥 新增：结果去重和优化
            unique_results = self._deduplicate_results(all_results)
            
            logger.info(f"权重检索完成，模式: {mode}，文档结果: {len(results)}, QA结果: {len(qa_results)}, 去重后: {len(unique_results)}")
            return unique_results
            
        except Exception as e:
            logger.error(f"权重检索失败，回退到混合检索: {e}")
            # 回退到原有的混合检索
            hybrid_results = await self.hybrid_service.hybrid_search(
                query=query,
                top_k=top_k,
                filters=filters,
                collection_id=collection_id,
                boost_domain=(mode in ["dual", "domain"]),
                include_highlights=include_highlights
            )
            
            # 转换格式以保持兼容性
            return self._convert_to_weighted_results(hybrid_results)
    
    def _deduplicate_results(self, results: List[WeightedSearchResult]) -> List[WeightedSearchResult]:
        """去重结果，基于内容相似度"""
        unique_results = []
        seen_content = set()
        
        for result in results:
            # 使用标题和内容的前100字符作为去重标识
            content_key = (result.title + result.content)[:100].strip()
            if content_key and content_key not in seen_content:
                seen_content.add(content_key)
                unique_results.append(result)
            else:
                logger.info(f"去重: 跳过重复内容 {result.title[:30]}...")
        
        # 按分数重新排序
        unique_results.sort(key=lambda x: x.final_score, reverse=True)
        return unique_results
    
    async def _search_qa_data(self, query: str, top_k: int) -> List[WeightedSearchResult]:
        """搜索QA数据 - 优化版本"""
        qa_results = []
        
        try:
            # 导入必要的模块
            from service.embedding_service import embedding_service
            from db.database import get_elasticsearch_client
            
            # 生成查询向量
            embedding_response = await embedding_service.create_embeddings(
                model_path="alibaba/text-embedding-v4", texts=[query]
            )
            
            if not embedding_response or not embedding_response.embeddings:
                logger.warning("QA数据检索: 向量生成失败")
                return qa_results
                
            query_vector = embedding_response.embeddings[0]
            es_client = get_elasticsearch_client()
            
            # 🔥 优化：构建更精确的QA检索查询
            search_body = {
                "size": top_k * 2,  # 获取更多候选结果用于筛选
                "query": {
                    "script_score": {
                        "query": {"match_all": {}},
                        "script": {
                            "source": "cosineSimilarity(params.query_vector, 'question_vector_general') + 1.0",
                            "params": {"query_vector": query_vector}
                        }
                    }
                },
                "_source": ["question", "answer", "category", "dataset_id", "qa_pair_id"],
                "sort": [
                    {"_score": {"order": "desc"}}
                ]
            }
            
            # 执行搜索
            response = await es_client.search(
                index="mat_qa_pairs_vectors",
                body=search_body
            )
            
            if response and 'hits' in response:
                hits = response['hits']['hits']
                logger.info(f"QA数据检索: 找到 {len(hits)} 个候选结果")
                
                # 🔥 优化：更严格的分数筛选和内容质量检查
                for hit in hits:
                    raw_score = hit["_score"]
                    score = max(0.0, min(1.0, raw_score - 1.0))  # 归一化分数
                    source = hit["_source"]
                    
                    # 提高质量阈值，确保QA数据相关性
                    if score >= 0.05:  # 提高阈值，确保高质量QA数据
                        question = source.get('question', '').strip()
                        answer = source.get('answer', '').strip()
                        
                        # 内容质量检查
                        if len(question) > 5 and len(answer) > 10:  # 确保问答内容有意义
                            qa_result = WeightedSearchResult(
                                id=source.get("qa_pair_id", ""),
                                content=f"问题: {question}\n答案: {answer}",
                                title=f"QA: {question[:50]}...",
                                document_id=source.get("dataset_id", ""),
                                keyword_score=0.0,
                                general_vector_score=score,
                                domain_vector_score=0.0,
                                weighted_keyword_score=0.0,
                                weighted_general_score=score * 0.7,  # 提高QA权重
                                weighted_domain_score=0.0,
                                final_score=score,
                                source={
                                    "type": "qa_dataset",
                                    "question": question,
                                    "answer": answer,
                                    "category": source.get("category", ""),
                                    "dataset_id": source.get("dataset_id", ""),
                                    "qa_pair_id": source.get("qa_pair_id", "")
                                }
                            )
                            qa_results.append(qa_result)
                
                # 🔥 优化：限制返回结果数量，确保质量
                qa_results.sort(key=lambda x: x.final_score, reverse=True)
                qa_results = qa_results[:top_k]
                
                logger.info(f"QA数据检索: 筛选后返回 {len(qa_results)} 个高质量结果")
                        
        except Exception as e:
            logger.error(f"QA数据检索失败: {e}")
            
        return qa_results
    
    def _convert_to_weighted_results(self, hybrid_results: List[SearchResult]) -> List[WeightedSearchResult]:
        """将混合检索结果转换为权重检索结果格式"""
        weighted_results = []
        
        for result in hybrid_results:
            weighted_result = WeightedSearchResult(
                id=result.id,
                content=result.content,
                title=result.title,
                document_id=result.source.get("document_id", ""),
                keyword_score=result.keyword_score,
                general_vector_score=result.general_score,
                domain_vector_score=result.domain_score,
                weighted_keyword_score=result.keyword_score * 0.3,
                weighted_general_score=result.general_score * 0.28,
                weighted_domain_score=result.domain_score * 0.42,
                final_score=result.combined_score,
                source=result.source,
                highlights=result.highlights
            )
            weighted_results.append(weighted_result)
        
        return weighted_results
    
    def _convert_to_search_results(self, weighted_results: List[WeightedSearchResult]) -> List[SearchResult]:
        """将权重搜索结果转换为兼容的搜索结果格式以进行重排序"""
        from service.hybrid_search_service import SearchResult
        
        compatible_results = []
        for result in weighted_results:
            search_result = SearchResult(
                id=result.id,
                content=result.content,
                title=result.title,
                score=result.final_score,  # 使用最终分数
                keyword_score=result.keyword_score,
                general_score=result.general_vector_score,
                domain_score=result.domain_vector_score,
                combined_score=result.final_score,  # 设置combined_score为final_score
                source=result.source,
                highlights=result.highlights
            )
            compatible_results.append(search_result)
        
        return compatible_results
    
    def _convert_back_to_weighted_results(self, reranked_results: List[SearchResult], original_weighted: List[WeightedSearchResult]) -> List[WeightedSearchResult]:
        """将重排序后的搜索结果转换回权重搜索结果格式"""
        # 创建ID到原始结果的映射
        original_map = {result.id: result for result in original_weighted}
        
        converted_results = []
        for reranked in reranked_results:
            if reranked.id in original_map:
                original = original_map[reranked.id]
                # 使用重排序后的分数更新原始结果
                original.final_score = reranked.combined_score
                converted_results.append(original)
        
        return converted_results
    
    async def _analyze_query(self, query: str) -> Dict[str, Any]:
        """分析查询内容"""
        
        # 获取领域关键词
        auto_config = self.config_service.auto_config
        domain_keywords = auto_config.get('content_detection', {}).get('domain_keywords', [])
        
        # 计算领域相关性
        domain_relevance = sum(1 for keyword in domain_keywords if keyword in query)
        total_keywords = len(domain_keywords)
        domain_score = domain_relevance / max(total_keywords, 1) if total_keywords > 0 else 0.0
        
        # 推荐检索模式
        if domain_score >= 0.3:
            suggested_mode = "hybrid"
            confidence = min(0.9, 0.6 + domain_score)
        elif domain_score >= 0.1:
            suggested_mode = "hybrid"
            confidence = 0.5 + domain_score
        else:
            suggested_mode = "general"
            confidence = 0.4
        
        # 匹配的关键词
        matched_keywords = [kw for kw in domain_keywords if kw in query]
        
        return {
            "domain_relevance": domain_score,
            "suggested_mode": suggested_mode,
            "confidence": confidence,
            "matched_keywords": matched_keywords,
            "query_length": len(query),
            "contains_technical_terms": domain_relevance > 0
        }
    
    async def _get_available_documents(self, filters: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """获取可用文档的向量化信息"""
        
        try:
            # 构建统计查询
            agg_query = {
                "size": 0,
                "aggs": {
                    "total_docs": {
                        "cardinality": {
                            "field": "document_id"
                        }
                    },
                    "strategy_distribution": {
                        "terms": {
                            "field": "vectorization_strategy",
                            "missing": "unknown"
                        }
                    },
                    "general_model_distribution": {
                        "terms": {
                            "field": "general_model",
                            "missing": "none"
                        }
                    },
                    "domain_model_distribution": {
                        "terms": {
                            "field": "domain_model", 
                            "missing": "none"
                        }
                    }
                }
            }
            
            # 添加过滤条件
            if filters:
                agg_query["query"] = {"bool": {"filter": []}}
                for field, value in filters.items():
                    if isinstance(value, list):
                        agg_query["query"]["bool"]["filter"].append({
                            "terms": {field: value}
                        })
                    else:
                        agg_query["query"]["bool"]["filter"].append({
                            "term": {field: value}
                        })
            
            # 执行聚合查询
            response = await self.hybrid_service.es.search(
                index="mat_qa_chunks",
                body=agg_query
            )
            
            aggs = response["aggregations"]
            total_docs = aggs["total_docs"]["value"]
            
            # 统计各策略的文档数量
            strategy_buckets = aggs["strategy_distribution"]["buckets"]
            strategy_counts = {bucket["key"]: bucket["doc_count"] for bucket in strategy_buckets}
            
            # 计算双向量比例
            dual_count = strategy_counts.get("dual", 0)
            dual_vector_ratio = dual_count / max(total_docs, 1)
            
            return {
                "total": total_docs,
                "by_strategy": strategy_counts,
                "dual_vector_ratio": dual_vector_ratio,
                "general_models": [b["key"] for b in aggs["general_model_distribution"]["buckets"]],
                "domain_models": [b["key"] for b in aggs["domain_model_distribution"]["buckets"]]
            }
            
        except Exception as e:
            logger.warning(f"获取文档统计信息失败: {e}")
            return {
                "total": 0,
                "by_strategy": {},
                "dual_vector_ratio": 0.0,
                "general_models": [],
                "domain_models": []
            }
    
    async def _execute_search(
        self,
        query: str,
        mode: str,
        params: Dict[str, Any],
        top_k: int,
        filters: Optional[Dict[str, Any]],
        collection_id: Optional[str],
        include_highlights: bool
    ) -> List[SearchResult]:
        """执行具体的检索操作"""
        
        if mode in ['hybrid', 'general', 'domain']:
            # 使用混合检索服务
            return await self.hybrid_service.hybrid_search(
                query=query,
                top_k=top_k,
                filters=filters,
                collection_id=collection_id,
                boost_domain=(mode in ['hybrid', 'domain']),
                include_highlights=include_highlights
            )
        else:
            logger.warning(f"不支持的检索模式: {mode}，使用默认混合检索")
            return await self.hybrid_service.hybrid_search(
                query=query,
                top_k=top_k,
                filters=filters,
                collection_id=collection_id,
                boost_domain=True,
                include_highlights=include_highlights
            )
    
    def _format_results(self, search_results: List[WeightedSearchResult]) -> List[Dict[str, Any]]:
        """格式化权重检索结果"""
        
        formatted = []
        for result in search_results:
            # 检查是否为QA数据
            is_qa_data = result.source.get("type") == "qa_dataset"
            
            formatted_result = {
                "id": result.id,
                "content": result.content,
                "title": result.title,
                "score": result.final_score,
                "source_type": "qa_dataset" if is_qa_data else "document",  # 🔥 添加source_type字段
                "scores": {
                    # 原始得分
                    "keyword": result.keyword_score,
                    "general": result.general_vector_score,
                    "domain": result.domain_vector_score,
                    # 权重得分
                    "weighted_keyword": result.weighted_keyword_score,
                    "weighted_general": result.weighted_general_score,
                    "weighted_domain": result.weighted_domain_score,
                    # 最终得分
                    "combined": result.final_score
                },
                "highlights": result.highlights,
                "metadata": {
                    "type": "qa_dataset" if is_qa_data else "document",
                    **(result.source.get("metadata", {}))
                }
            }
            
            # 🔥 对于QA数据，直接添加question和answer字段到顶层
            if is_qa_data:
                formatted_result["question"] = result.source.get("question", "")
                formatted_result["answer"] = result.source.get("answer", "")
            
            if is_qa_data:
                # QA数据的特殊处理
                formatted_result["source_info"] = {
                    "dataset_id": result.source.get("dataset_id"),
                    "qa_pair_id": result.source.get("qa_pair_id"),
                    "category": result.source.get("category"),
                    "question": result.source.get("question"),
                    "answer": result.source.get("answer"),
                    "type": "qa_dataset"
                }
            else:
                # 文档数据的处理
                formatted_result["source_info"] = {
                    "document_id": result.document_id or result.source.get("document_id"),
                    "chunk_index": result.source.get("chunk_index"),
                    "vectorization_strategy": result.source.get("vectorization_strategy"),
                    "general_model": result.source.get("general_model"),
                    "domain_model": result.source.get("domain_model"),
                    "type": "document"
                }
            
            formatted.append(formatted_result)
        
        return formatted
    
    async def get_search_suggestions(self, partial_query: str) -> List[str]:
        """获取搜索建议"""
        
        # 基于历史查询和常见模式生成建议
        suggestions = []
        
        domain_keywords = self.config_service.auto_config.get('content_detection', {}).get('domain_keywords', [])
        
        # 匹配相关的领域关键词
        matching_keywords = [kw for kw in domain_keywords if partial_query.lower() in kw.lower()]
        suggestions.extend(matching_keywords[:5])
        
        # 常见查询模式
        if "地聚物" in partial_query:
            suggestions.extend([
                "地聚物材料的力学性能",
                "地聚物混凝土的耐久性",
                "地聚物的制备工艺"
            ])
        elif "混凝土" in partial_query:
            suggestions.extend([
                "混凝土强度测试",
                "混凝土耐久性评估",
                "混凝土配比设计"
            ])
        
        return suggestions[:10]  # 最多返回10个建议
    
    async def explain_search_strategy(self, query: str, user_mode: Optional[str] = None) -> Dict[str, Any]:
        """解释检索策略选择"""
        
        query_analysis = await self._analyze_query(query)
        available_docs = await self._get_available_documents()
        
        retrieval_mode, params = self.config_service.get_retrieval_strategy(
            query=query,
            available_documents=available_docs,
            user_mode=user_mode
        )
        
        explanation = {
            "selected_strategy": retrieval_mode,
            "reason": self._generate_strategy_explanation(
                query_analysis, available_docs, retrieval_mode, user_mode
            ),
            "query_analysis": query_analysis,
            "document_context": available_docs,
            "parameters": params,
            "alternatives": self._suggest_alternative_strategies(query_analysis, available_docs)
        }
        
        return explanation
    
    def _generate_strategy_explanation(
        self,
        query_analysis: Dict[str, Any],
        available_docs: Dict[str, Any],
        selected_strategy: str,
        user_mode: Optional[str]
    ) -> str:
        """生成策略选择的解释"""
        
        reasons = []
        
        if user_mode:
            reasons.append(f"用户指定使用 {user_mode} 模式")
        
        domain_relevance = query_analysis.get("domain_relevance", 0.0)
        dual_ratio = available_docs.get("dual_vector_ratio", 0.0)
        matched_keywords = query_analysis.get("matched_keywords", [])
        
        if domain_relevance > 0.2:
            reasons.append(f"查询包含 {len(matched_keywords)} 个专业术语: {matched_keywords}")
        
        if dual_ratio > 0.3:
            reasons.append(f"文档库中 {dual_ratio:.1%} 的文档支持双向量检索")
        
        if selected_strategy == "hybrid":
            reasons.append("综合使用通用向量、领域向量和关键词检索以获得最佳效果")
        elif selected_strategy == "domain":
            reasons.append("查询专业性强，主要使用领域向量检索")
        else:
            reasons.append("使用通用向量检索处理一般性查询")
        
        return "; ".join(reasons)
    
    def _suggest_alternative_strategies(
        self,
        query_analysis: Dict[str, Any],
        available_docs: Dict[str, Any]
    ) -> List[Dict[str, str]]:
        """建议替代策略"""
        
        alternatives = []
        
        # 总是提供所有可用策略作为选择
        strategies = [
            ("general", "通用向量检索，适合一般性查询"),
            ("domain", "领域向量检索，专注材料工程领域"),
            ("hybrid", "混合检索，综合多种检索方式")
        ]
        
        for strategy, description in strategies:
            alternatives.append({
                "strategy": strategy,
                "description": description
            })
        
        return alternatives


# 全局智能检索服务实例  
intelligent_retrieval_service = IntelligentRetrievalService()
