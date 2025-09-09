"""
权重检索服务 - 实现文档要求的层次化权重检索逻辑
支持中英文翻译的文档检索
"""
from typing import List, Dict, Any, Optional, Tuple
from elasticsearch import AsyncElasticsearch
from dataclasses import dataclass
import numpy as np
import asyncio

from core.config_optimized import optimized_config_manager
from core.logger import logger
from service.embedding_service import embedding_service
from service.vectorization_config_service import vectorization_config_service

# 导入翻译装饰器
try:
    from service.retrieval_translation_decorator import standard_translation
    _has_translation = True
except ImportError:
    _has_translation = False
    # 创建一个空装饰器作为回退
    def standard_translation(func):
        return func


@dataclass
class WeightedSearchResult:
    """权重检索结果"""
    id: str
    content: str
    title: str
    document_id: str
    # 原始得分
    keyword_score: float
    general_vector_score: float
    domain_vector_score: float
    # 权重计算得分
    weighted_keyword_score: float
    weighted_general_score: float
    weighted_domain_score: float
    # 最终得分
    final_score: float
    source: Dict[str, Any]
    highlights: Optional[Dict[str, List[str]]] = None


class WeightedRetrievalService:
    """权重检索服务 - 实现层次化权重分配逻辑"""
    
    def __init__(self):
        # 初始化ES客户端
        try:
            import os
            es_config = optimized_config_manager.settings.database_elasticsearch
            
            # 处理hosts配置中的环境变量
            hosts = getattr(es_config, 'hosts', ['http://localhost:9200'])
            processed_hosts = []
            for host in hosts:
                if isinstance(host, str) and host.startswith('${') and host.endswith('}'):
                    env_var_expr = host[2:-1]
                    if ':-' in env_var_expr:
                        env_var, default_val = env_var_expr.split(':-', 1)
                        processed_host = os.getenv(env_var, default_val)
                    else:
                        processed_host = os.getenv(env_var_expr, host)
                    processed_hosts.append(processed_host)
                else:
                    processed_hosts.append(host)
            
            # 准备ES连接配置
            es_kwargs = {
                "hosts": processed_hosts,
                "verify_certs": False,
                "ssl_show_warn": False,
                "ssl_context": None
            }
            
            # 添加认证信息
            if hasattr(es_config, 'api_key') and es_config.api_key:
                es_kwargs["api_key"] = es_config.api_key
            elif hasattr(es_config, 'username') and es_config.username and hasattr(es_config, 'password') and es_config.password:
                es_kwargs["basic_auth"] = (es_config.username, es_config.password)
            
            self.es = AsyncElasticsearch(**es_kwargs)
            self.timeout = getattr(es_config, 'timeout', 30)
            self.max_retries = getattr(es_config, 'max_retries', 3)
        except Exception as e:
            logger.error(f"ElasticSearch客户端初始化失败: {e}")
            raise
        
        # 权重配置 - 按照文档要求
        self.base_weights = {
            "keyword": 0.3,      # 关键词检索：30%
            "vector": 0.7        # 向量检索：70%
        }
        
        # 双向量内部权重配置
        self.vector_internal_weights = {
            "general": 0.4,      # 通用向量在向量检索中的权重：40%
            "domain": 0.6        # 领域向量在向量检索中的权重：60%
        }
    
    @standard_translation
    async def weighted_search(
        self,
        query: str,
        top_k: int = 20,
        mode: str = "dual",
        filters: Optional[Dict[str, Any]] = None,
        include_highlights: bool = True,
        custom_weights: Optional[Dict[str, float]] = None,
        original_query: Optional[str] = None,  # 用于QA数据检索的中文原始查询
        translated_query: Optional[str] = None  # 用于文档数据检索的英文翻译查询
    ) -> List[WeightedSearchResult]:
        """
        执行权重检索
        
        Args:
            query: 查询文本
            top_k: 返回结果数量
            mode: 检索模式 (dual|general|domain)
            filters: 过滤条件
            include_highlights: 是否包含高亮
            custom_weights: 自定义权重配置
            original_query: 用于QA数据检索的中文原始查询
            translated_query: 用于文档数据检索的英文翻译查询
        """
        try:
            # 1. 根据模式调整权重
            adjusted_weights = self._adjust_weights_by_mode(mode, custom_weights)
            
            # 2. 并行执行三路检索 - 支持智能数据源路由
            search_tasks = await self._execute_parallel_search(
                query, top_k, mode, filters, include_highlights, original_query, translated_query
            )
            
            # 3. 合并和权重计算
            results = await self._merge_and_weight_results(
                search_tasks, adjusted_weights, top_k
            )
            
            # 🔥 添加结果类型统计调试信息
            doc_count = len([r for r in results if 'qa_dataset' not in r.source.get('metadata', {}).get('type', '')])
            qa_count = len([r for r in results if 'qa_dataset' in r.source.get('metadata', {}).get('type', '')])
            logger.info(f"权重检索完成，模式: {mode}，返回 {len(results)} 个结果 (文档: {doc_count}, QA: {qa_count})")
            
            # 显示前3个结果的详情
            for i, result in enumerate(results[:3]):
                source_type = 'QA' if 'qa_dataset' in result.source.get('metadata', {}).get('type', '') else '文档'
                logger.info(f"[WEIGHTED_SEARCH] 结果{i+1}: {source_type}, 分数: {result.final_score:.3f}, 标题: {result.title[:50]}")
            
            # 🔥 优化：明确权重检索服务只处理文档数据
            if qa_count > 0:
                logger.warning(f"[WEIGHTED_SEARCH] 警告：权重检索服务发现 {qa_count} 个QA数据，这不应该发生")
            
            return results
            
        except Exception as e:
            logger.error(f"权重检索失败: {e}")
            raise
    
    def _adjust_weights_by_mode(
        self, 
        mode: str, 
        custom_weights: Optional[Dict[str, float]] = None
    ) -> Dict[str, float]:
        """
        根据检索模式调整权重分配
        
        按照文档要求：
        - dual模式: 关键词30% + 通用向量28% + 领域向量42%
        - general模式: 关键词30% + 通用向量70%
        - domain模式: 关键词30% + 领域向量70%
        """
        if custom_weights:
            return custom_weights
        
        base_keyword_weight = self.base_weights["keyword"]
        base_vector_weight = self.base_weights["vector"]
        
        if mode == "dual":
            # 双向量模式：按照文档要求的权重分配
            return {
                "keyword": base_keyword_weight,  # 30%
                "general_vector": base_vector_weight * self.vector_internal_weights["general"],  # 70% × 40% = 28%
                "domain_vector": base_vector_weight * self.vector_internal_weights["domain"]     # 70% × 60% = 42%
            }
        elif mode == "general":
            # 仅通用向量模式：向量检索的70%全部分配给通用向量
            return {
                "keyword": base_keyword_weight,  # 30%
                "general_vector": base_vector_weight,  # 70%
                "domain_vector": 0.0             # 0%
            }
        elif mode == "domain":
            # 仅领域向量模式：向量检索的70%全部分配给领域向量
            return {
                "keyword": base_keyword_weight,  # 30%
                "general_vector": 0.0,           # 0%
                "domain_vector": base_vector_weight   # 70%
            }
        else:
            # 默认使用双向量模式
            return self._adjust_weights_by_mode("dual", custom_weights)
    
    async def _execute_parallel_search(
        self,
        query: str,
        top_k: int,
        mode: str,
        filters: Optional[Dict[str, Any]],
        include_highlights: bool,
        original_query: Optional[str] = None,
        translated_query: Optional[str] = None
    ) -> Dict[str, List[Dict[str, Any]]]:
        """
        并行执行三路检索 - 支持智能数据源路由
        """
        search_tasks = {}
        
        # 智能查询路由：决定使用哪个查询
        qa_query = original_query or query  # QA数据使用中文原始查询
        doc_query = translated_query or query  # 文档数据使用英文翻译查询
        
        logger.info(f"智能路由查询分配:")
        logger.info(f"  - QA数据查询: {qa_query[:30]}...")
        logger.info(f"  - 文档数据查询: {doc_query[:30]}...")
        
        # 1. 关键词检索（使用原始查询，主要用于QA数据）
        search_tasks["keyword"] = self._keyword_search(
            qa_query, top_k * 2, filters, include_highlights
        )
        
        # 2. 向量检索（使用翻译查询，主要用于文档数据）
        if mode in ["dual", "general"]:
            search_tasks["general_vector"] = self._general_vector_search(
                doc_query, top_k * 2, filters, include_highlights
            )
        
        if mode in ["dual", "domain"]:
            search_tasks["domain_vector"] = self._domain_vector_search(
                doc_query, top_k * 2, filters, include_highlights
            )
        
        # 并行执行所有检索任务
        results = {}
        for search_type, task in search_tasks.items():
            try:
                results[search_type] = await task
                logger.info(f"[WEIGHTED_SEARCH] {search_type} 检索完成: {len(results[search_type])} 个结果")
            except Exception as e:
                logger.error(f"{search_type} 检索失败: {e}")
                results[search_type] = []
        
        # 🔥 添加详细调试信息
        total_results = sum(len(r) for r in results.values())
        logger.info(f"[WEIGHTED_SEARCH] 所有检索任务完成: 总计 {total_results} 个结果")
        for search_type, result_list in results.items():
            logger.info(f"[WEIGHTED_SEARCH] - {search_type}: {len(result_list)} 个结果")
            if result_list:
                first_result = result_list[0]
                logger.info(f"[WEIGHTED_SEARCH] - {search_type} 首个结果分数: {first_result.get('_score', 0):.3f}")
        
        return results
    
    async def _keyword_search(
        self,
        query: str,
        size: int,
        filters: Optional[Dict[str, Any]],
        include_highlights: bool
    ) -> List[Dict[str, Any]]:
        """关键词检索"""
        search_body = {
            "size": size,
            "query": {
                "bool": {
                    "should": [
                        {
                            "multi_match": {
                                "query": query,
                                "fields": [
                                    "content^2",
                                    "title^3",
                                    "content.keyword^1.5",
                                    "title.keyword^2"
                                ],
                                "type": "best_fields",
                                "fuzziness": "AUTO"
                            }
                        },
                        {
                            "match_phrase": {
                                "content": {
                                    "query": query,
                                    "boost": 1.5
                                }
                            }
                        }
                    ],
                    "minimum_should_match": 1
                }
            },
            "_source": {
                "excludes": ["general_embedding", "domain_embedding"]
            }
        }
        
        # 添加过滤条件
        if filters:
            search_body["query"]["bool"]["filter"] = self._build_filters(filters)
        
        # 添加高亮
        if include_highlights:
            search_body["highlight"] = self._build_highlight_config()
        
        response = await self.es.search(
            index="mat_qa_chunks",
            body=search_body,
            timeout=f"{self.timeout}s"
        )
        
        return response["hits"]["hits"]
    
    async def _general_vector_search(
        self,
        query: str,
        size: int,
        filters: Optional[Dict[str, Any]],
        include_highlights: bool
    ) -> List[Dict[str, Any]]:
        """通用向量检索"""
        # 生成查询向量
        embedding_response = await embedding_service.create_embeddings(
            model_path="alibaba/Qwen/Qwen3-Embedding-4B",
            texts=[query]
        )
        general_vector = embedding_response.embeddings[0] if embedding_response and embedding_response.embeddings else []
        
        search_body = {
            "size": size,
            "query": {
                "script_score": {
                    "query": {"match_all": {}},
                    "script": {
                        "source": "cosineSimilarity(params.query_vector, 'general_embedding') + 1.0",
                        "params": {"query_vector": general_vector}
                    }
                }
            },
            "_source": {
                "excludes": ["general_embedding", "domain_embedding"]
            }
        }
        
        # 添加过滤条件
        if filters:
            search_body["query"]["script_score"]["query"] = {
                "bool": {
                    "must": [{"match_all": {}}],
                    "filter": self._build_filters(filters)
                }
            }
        
        response = await self.es.search(
            index="mat_qa_general_vectors",
            body=search_body,
            timeout=f"{self.timeout}s"
        )
        
        return response["hits"]["hits"]
    
    async def _domain_vector_search(
        self,
        query: str,
        size: int,
        filters: Optional[Dict[str, Any]],
        include_highlights: bool
    ) -> List[Dict[str, Any]]:
        """领域向量检索 (现在使用通用向量)"""
        # 生成查询向量
        embedding_response = await embedding_service.create_embeddings(
            model_path="alibaba/Qwen/Qwen3-Embedding-4B",
            texts=[query]
        )
        domain_vector = embedding_response.embeddings[0] if embedding_response and embedding_response.embeddings else []
        
        search_body = {
            "size": size,
            "query": {
                "script_score": {
                    "query": {"match_all": {}},
                    "script": {
                        "source": "cosineSimilarity(params.query_vector, 'domain_embedding') + 1.0",
                        "params": {"query_vector": domain_vector}
                    }
                }
            },
            "_source": {
                "excludes": ["general_embedding", "domain_embedding"]
            }
        }
        
        # 添加过滤条件
        if filters:
            search_body["query"]["script_score"]["query"] = {
                "bool": {
                    "must": [{"match_all": {}}],
                    "filter": self._build_filters(filters)
                }
            }
        
        response = await self.es.search(
            index="mat_qa_domain_vectors",
            body=search_body,
            timeout=f"{self.timeout}s"
        )
        
        return response["hits"]["hits"]
    
    async def _merge_and_weight_results(
        self,
        search_results: Dict[str, List[Dict[str, Any]]],
        weights: Dict[str, float],
        top_k: int
    ) -> List[WeightedSearchResult]:
        """
        合并检索结果并应用权重计算 - 添加分数归一化和领域过滤
        """
        # 1. 收集所有文档ID和对应的得分
        document_scores = {}
        document_details = {}
        
        # 收集所有原始分数用于归一化
        all_scores = {"keyword": [], "general_vector": [], "domain_vector": []}
        
        # 地聚物领域关键词
        domain_keywords = [
            "地聚物", "聚合物", "材料", "混凝土", "强度", "耐久性",
            "胶凝材料", "粉煤灰", "矿渣", "硅酸盐", "铝酸盐", "水泥",
            "碱激发", "养护", "抗压", "抗折", "微观结构", "孔隙",
            "工作性", "流动性", "凝结时间", "膨胀", "收缩"
        ]
        
        # 非相关关键词（用于过滤）
        irrelevant_keywords = [
            "人工智能", "机器学习", "深度学习", "神经网络", "算法",
            "软件", "编程", "代码", "计算机", "数据库", "网络",
            "互联网", "手机", "电子", "金融", "股票", "投资"
        ]
        
        # 收集分数统计
        for search_type, results in search_results.items():
            for hit in results:
                if search_type in all_scores:
                    all_scores[search_type].append(hit["_score"])
        
        # 计算归一化参数
        norm_params = {}
        for search_type, scores in all_scores.items():
            if scores:
                max_score = max(scores)
                min_score = min(scores)
                score_range = max_score - min_score if max_score > min_score else 1.0
                norm_params[search_type] = {"max": max_score, "min": min_score, "range": score_range}
            else:
                norm_params[search_type] = {"max": 1.0, "min": 0.0, "range": 1.0}
        
        # 处理关键词检索结果
        for hit in search_results.get("keyword", []):
            doc_id = hit["_id"]
            source = hit["_source"]
            
            # 领域相关性检查
            content = source.get("content", "")
            title = source.get("title", "")
            combined_text = (title + " " + content).lower()
            
            domain_score = sum(1 for keyword in domain_keywords if keyword in combined_text)
            irrelevant_score = sum(1 for keyword in irrelevant_keywords if keyword in combined_text)
            
            # 过滤明显不相关的内容
            if irrelevant_score > 0 and domain_score == 0:
                logger.info(f"过滤不相关内容: {title[:50]}... (包含非相关关键词)")
                continue
            
            if doc_id not in document_scores:
                document_scores[doc_id] = {
                    "keyword": 0.0,
                    "general_vector": 0.0,
                    "domain_vector": 0.0,
                    "domain_relevance": domain_score,
                    "irrelevant_score": irrelevant_score
                }
                document_details[doc_id] = {
                    "source": source,
                    "highlights": hit.get("highlight")
                }
            
            # 归一化关键词分数 - 混合检索不应该出现满分
            raw_score = hit["_score"]
            norm_param = norm_params["keyword"]
            normalized_score = (raw_score - norm_param["min"]) / norm_param["range"] if norm_param["range"] > 0 else 0.5
            # 设置关键词检索的合理上限 (0.80)
            document_scores[doc_id]["keyword"] = min(max(normalized_score * 0.80, 0.05), 0.80)
        
        # 处理通用向量检索结果
        for hit in search_results.get("general_vector", []):
            doc_id = hit["_id"]
            source = hit["_source"]
            
            if doc_id not in document_scores:
                content = source.get("content", "")
                title = source.get("title", "")
                combined_text = (title + " " + content).lower()
                
                domain_score = sum(1 for keyword in domain_keywords if keyword in combined_text)
                irrelevant_score = sum(1 for keyword in irrelevant_keywords if keyword in combined_text)
                
                # 过滤明显不相关的内容
                if irrelevant_score > 0 and domain_score == 0:
                    continue
                
                document_scores[doc_id] = {
                    "keyword": 0.0,
                    "general_vector": 0.0,
                    "domain_vector": 0.0,
                    "domain_relevance": domain_score,
                    "irrelevant_score": irrelevant_score
                }
                document_details[doc_id] = {
                    "source": source,
                    "highlights": hit.get("highlight")
                }
            
            # 归一化通用向量分数 - 向量检索设置保守上限
            raw_score = hit["_score"]
            norm_param = norm_params["general_vector"]
            normalized_score = (raw_score - norm_param["min"]) / norm_param["range"] if norm_param["range"] > 0 else 0.5
            # 设置通用向量检索的合理上限 (0.75)
            document_scores[doc_id]["general_vector"] = min(max(normalized_score * 0.75, 0.05), 0.75)
        
        # 处理领域向量检索结果
        for hit in search_results.get("domain_vector", []):
            doc_id = hit["_id"]
            source = hit["_source"]
            
            if doc_id not in document_scores:
                content = source.get("content", "")
                title = source.get("title", "")
                combined_text = (title + " " + content).lower()
                
                domain_score = sum(1 for keyword in domain_keywords if keyword in combined_text)
                irrelevant_score = sum(1 for keyword in irrelevant_keywords if keyword in combined_text)
                
                # 过滤明显不相关的内容
                if irrelevant_score > 0 and domain_score == 0:
                    continue
                
                document_scores[doc_id] = {
                    "keyword": 0.0,
                    "general_vector": 0.0,
                    "domain_vector": 0.0,
                    "domain_relevance": domain_score,
                    "irrelevant_score": irrelevant_score
                }
                document_details[doc_id] = {
                    "source": source,
                    "highlights": hit.get("highlight")
                }
            
            # 归一化领域向量分数 - 向量检索设置保守上限
            raw_score = hit["_score"]
            norm_param = norm_params["domain_vector"]
            normalized_score = (raw_score - norm_param["min"]) / norm_param["range"] if norm_param["range"] > 0 else 0.5
            # 设置领域向量检索的合理上限 (0.80)，领域向量可稍高于通用向量
            document_scores[doc_id]["domain_vector"] = min(max(normalized_score * 0.80, 0.05), 0.80)
        
        # 2. 计算最终权重得分
        final_results = []
        for doc_id, scores in document_scores.items():
            details = document_details[doc_id]
            source = details["source"]
            
            # 计算各项权重得分
            weighted_keyword = scores["keyword"] * weights.get("keyword", 0.0)
            weighted_general = scores["general_vector"] * weights.get("general_vector", 0.0)
            weighted_domain = scores["domain_vector"] * weights.get("domain_vector", 0.0)
            
            # 计算最终得分
            final_score = weighted_keyword + weighted_general + weighted_domain
            
            # 应用保守的领域相关性加权 - 避免混合检索出现满分
            domain_relevance = scores.get("domain_relevance", 0)
            irrelevant_score = scores.get("irrelevant_score", 0)
            
            if domain_relevance > 0:
                # 领域相关内容：最多10%加权，保持保守
                domain_boost = min(1.0 + domain_relevance * 0.03, 1.10)
                final_score = min(final_score * domain_boost, 0.80)  # 权重检索硬性上限0.80
            elif irrelevant_score > 0:
                final_score = max(final_score * 0.5, 0.0)  # 降权50%
            
            # 确保最终分数在合理范围内 (0.05-0.80)
            final_score = max(min(final_score, 0.80), 0.05)
            
            # 只保留有得分的文档
            if final_score > 0:
                result = WeightedSearchResult(
                    id=doc_id,
                    content=source.get("content", ""),
                    title=source.get("title", ""),
                    document_id=source.get("document_id", ""),
                    keyword_score=scores["keyword"],
                    general_vector_score=scores["general_vector"],
                    domain_vector_score=scores["domain_vector"],
                    weighted_keyword_score=weighted_keyword,
                    weighted_general_score=weighted_general,
                    weighted_domain_score=weighted_domain,
                    final_score=final_score,
                    source=source,
                    highlights=details["highlights"]
                )
                final_results.append(result)
        
        # 3. 按最终得分排序并返回TopK
        final_results.sort(key=lambda x: x.final_score, reverse=True)
        
        logger.info(f"权重检索完成: 合并后{len(final_results)}个结果，返回前{min(len(final_results), top_k)}个，分数范围: 0.05-0.80")
        return final_results[:top_k]
    
    def _build_filters(self, filters: Dict[str, Any]) -> List[Dict[str, Any]]:
        """构建ES过滤条件"""
        filter_clauses = []
        
        for field, value in filters.items():
            # 处理特殊的数据源过滤条件
            if field == "exclude_qa_dataset" and value:
                # 排除QA数据集：metadata.type字段不包含qa_dataset
                filter_clauses.append({
                    "bool": {
                        "must_not": [
                            {"wildcard": {"metadata.type": "*qa_dataset*"}}
                        ]
                    }
                })
                logger.info(f"[WEIGHTED_SEARCH] 🎯 添加过滤条件：排除QA数据集")
            elif field == "only_qa_dataset" and value:
                # 只要QA数据集：metadata.type字段包含qa_dataset
                filter_clauses.append({
                    "wildcard": {"metadata.type": "*qa_dataset*"}
                })
                logger.info(f"[WEIGHTED_SEARCH] 🎯 添加过滤条件：只包含QA数据集")
            elif isinstance(value, list):
                filter_clauses.append({
                    "terms": {field: value}
                })
            else:
                filter_clauses.append({
                    "term": {field: value}
                })
        
        return filter_clauses
    
    def _build_highlight_config(self) -> Dict[str, Any]:
        """构建高亮配置"""
        return {
            "fields": {
                "content": {
                    "fragment_size": 150,
                    "number_of_fragments": 3
                },
                "title": {
                    "fragment_size": 100,
                    "number_of_fragments": 1
                }
            },
            "pre_tags": ["<mark>"],
            "post_tags": ["</mark>"]
        }
    
    async def get_retrieval_explanation(
        self,
        query: str,
        mode: str = "dual",
        custom_weights: Optional[Dict[str, float]] = None
    ) -> Dict[str, Any]:
        """
        获取检索策略解释
        """
        weights = self._adjust_weights_by_mode(mode, custom_weights)
        
        explanation = {
            "mode": mode,
            "weights": weights,
            "strategy": {
                "keyword_retrieval": {
                    "weight": weights.get("keyword", 0.0),
                    "percentage": f"{weights.get('keyword', 0.0) * 100:.1f}%"
                },
                "general_vector_retrieval": {
                    "weight": weights.get("general_vector", 0.0),
                    "percentage": f"{weights.get('general_vector', 0.0) * 100:.1f}%"
                },
                "domain_vector_retrieval": {
                    "weight": weights.get("domain_vector", 0.0),
                    "percentage": f"{weights.get('domain_vector', 0.0) * 100:.1f}%"
                }
            },
            "execution_order": [
                "1. 并行检索阶段 - 同时执行关键词、通用向量、领域向量检索",
                "2. 结果合并阶段 - 收集所有检索结果",
                "3. 权重计算阶段 - 应用配置的权重计算最终得分",
                "4. 排序阶段 - 按最终得分降序排列并取TopK"
            ],
            "weight_calculation": {
                "formula": "final_score = keyword_score × {} + general_vector_score × {} + domain_vector_score × {}".format(
                    weights.get("keyword", 0.0),
                    weights.get("general_vector", 0.0),
                    weights.get("domain_vector", 0.0)
                )
            }
        }
        
        return explanation


# 全局权重检索服务实例
weighted_retrieval_service = WeightedRetrievalService()