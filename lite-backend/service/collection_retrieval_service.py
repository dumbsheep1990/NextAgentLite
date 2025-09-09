"""
Collection检索服务 - 支持知识库绑定的检索功能

扩展现有检索服务以支持：
1. 按Collection ID过滤文档
2. 按元数据模版类型过滤
3. Filter-then-Rerank检索架构
4. Collection级别的检索策略优化
"""

import time
from typing import List, Dict, Any, Optional, Union
from dataclasses import dataclass
from datetime import datetime

from core.logger import logger
from service.intelligent_retrieval_service import IntelligentRetrievalService, IntelligentSearchResult
from service.hybrid_search_service import hybrid_search_service, SearchResult
from service.weighted_retrieval_service import weighted_retrieval_service
from service.knowledge_collection.collection_service import KnowledgeCollectionService
from service.metadata_extraction.extraction_service import MetadataExtractionService


@dataclass
class CollectionSearchResult(IntelligentSearchResult):
    """Collection检索结果 - 扩展智能检索结果"""
    collection_info: Dict[str, Any]
    temporal_filters_applied: Dict[str, Any]
    metadata_distribution: Dict[str, Any]
    filter_performance: Dict[str, float]


class CollectionRetrievalService(IntelligentRetrievalService):
    """Collection检索服务 - 扩展智能检索服务"""
    
    def __init__(self, db_session=None):
        super().__init__()
        self.db_session = db_session
        self.collection_service = None
        self.extraction_service = None
        
        # Filter-then-Rerank架构配置
        self.filter_config = {
            "temporal_enabled": True,
            "collection_isolation": True,  # Collection间隔离
            "metadata_filtering": True,
            "policy_time_filter": True,    # 政策文档时效性过滤
            "academic_relevance_boost": True  # 学术文档相关性提升
        }
    
    async def _initialize_services(self):
        """初始化依赖服务"""
        if self.db_session and not self.collection_service:
            self.collection_service = KnowledgeCollectionService(self.db_session)
            self.extraction_service = MetadataExtractionService(self.db_session)
    
    async def collection_search(
        self,
        query: str,
        collection_ids: Optional[List[str]] = None,
        metadata_template: Optional[str] = None,
        top_k: int = 20,
        time_filters: Optional[Dict[str, Any]] = None,
        user_mode: Optional[str] = None,
        include_highlights: bool = True,
        enable_reranking: bool = True,
        use_filter_then_rerank: bool = True
    ) -> CollectionSearchResult:
        """
        Collection级别的智能检索
        
        Args:
            query: 查询文本
            collection_ids: 目标知识库ID列表
            metadata_template: 元数据模版类型过滤
            top_k: 返回结果数量
            time_filters: 时间过滤器 (用于政策文档)
            user_mode: 用户指定检索模式
            include_highlights: 是否包含高亮
            enable_reranking: 是否启用重排序
            use_filter_then_rerank: 是否使用Filter-then-Rerank架构
        
        Returns:
            CollectionSearchResult: Collection检索结果
        """
        start_time = time.time()
        
        try:
            await self._initialize_services()
            
            # 1. Collection信息获取和验证
            collection_info = await self._get_collection_info(collection_ids)
            
            # 2. 构建Collection级别的过滤器
            collection_filters = await self._build_collection_filters(
                collection_ids=collection_ids,
                metadata_template=metadata_template,
                time_filters=time_filters,
                collection_info=collection_info
            )
            
            # 3. Filter-then-Rerank检索执行
            if use_filter_then_rerank:
                search_results = await self._execute_filter_then_rerank(
                    query=query,
                    filters=collection_filters,
                    user_mode=user_mode,
                    top_k=top_k,
                    include_highlights=include_highlights
                )
            else:
                # 回退到标准智能检索
                base_result = await self.intelligent_search(
                    query=query,
                    filters=collection_filters,
                    user_mode=user_mode,
                    top_k=top_k,
                    include_highlights=include_highlights,
                    enable_reranking=enable_reranking
                )
                search_results = base_result.results
            
            # 4. Collection特化的后处理
            processed_results = await self._post_process_collection_results(
                results=search_results,
                collection_info=collection_info,
                metadata_template=metadata_template,
                query=query
            )
            
            # 5. 性能指标统计
            filter_performance = {
                "total_time": time.time() - start_time,
                "filter_time": 0.0,  # 在具体实现中计算
                "rerank_time": 0.0,
                "post_process_time": 0.0
            }
            
            # 6. 构造Collection检索结果
            return CollectionSearchResult(
                results=processed_results,
                strategy_used=f"collection_filter_rerank" if use_filter_then_rerank else "collection_standard",
                total_matches=len(processed_results),
                query_analysis=await self._analyze_query(query),
                document_distribution=self._analyze_result_distribution(processed_results),
                performance_metrics=filter_performance,
                collection_info=collection_info,
                temporal_filters_applied=time_filters or {},
                metadata_distribution=self._analyze_metadata_distribution(processed_results),
                filter_performance=filter_performance
            )
            
        except Exception as e:
            logger.error(f"Collection检索失败: {e}")
            # 返回空结果而不是抛出异常
            return CollectionSearchResult(
                results=[],
                strategy_used="error_fallback",
                total_matches=0,
                query_analysis={"error": str(e)},
                document_distribution={},
                performance_metrics={"error_time": time.time() - start_time},
                collection_info={},
                temporal_filters_applied={},
                metadata_distribution={},
                filter_performance={"error": True}
            )
    
    async def _get_collection_info(self, collection_ids: Optional[List[str]]) -> Dict[str, Any]:
        """获取Collection信息"""
        if not collection_ids or not self.collection_service:
            return {"collections": [], "total_count": 0, "metadata_templates": []}
        
        collections = []
        metadata_templates = set()
        
        for collection_id in collection_ids:
            try:
                collection = await self.collection_service.get_collection(collection_id)
                if collection:
                    collections.append({
                        "id": collection.id,
                        "name": collection.name,
                        "metadata_template": collection.metadata_template,
                        "document_count": collection.document_count,
                        "status": collection.status
                    })
                    metadata_templates.add(collection.metadata_template)
            except Exception as e:
                logger.warning(f"获取Collection {collection_id} 信息失败: {e}")
        
        return {
            "collections": collections,
            "total_count": len(collections),
            "metadata_templates": list(metadata_templates),
            "mixed_templates": len(metadata_templates) > 1
        }
    
    async def _build_collection_filters(
        self,
        collection_ids: Optional[List[str]] = None,
        metadata_template: Optional[str] = None,
        time_filters: Optional[Dict[str, Any]] = None,
        collection_info: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """构建Collection级别的过滤条件"""
        filters = {}
        
        # Collection ID过滤
        if collection_ids:
            filters["collection_ids"] = collection_ids
        
        # 元数据模版过滤
        if metadata_template:
            filters["metadata_template"] = metadata_template
        
        # 时间过滤 - 专门针对政策文档
        if time_filters and self.filter_config["temporal_enabled"]:
            filters["temporal"] = self._build_temporal_filters(time_filters, metadata_template)
        
        # Collection特化过滤
        if collection_info and collection_info.get("metadata_templates"):
            filters["template_specific"] = self._build_template_specific_filters(
                collection_info["metadata_templates"]
            )
        
        return filters
    
    def _build_temporal_filters(
        self, 
        time_filters: Dict[str, Any], 
        metadata_template: Optional[str] = None
    ) -> Dict[str, Any]:
        """构建时间轴过滤器"""
        temporal_config = {}
        
        if metadata_template == "policy":
            # 政策文档特化时间过滤
            temporal_config.update({
                "policy_effective_date": time_filters.get("effective_date"),
                "policy_expiry_date": time_filters.get("expiry_date"),
                "publication_date_range": time_filters.get("publication_range"),
                "time_status": time_filters.get("time_status", "current")  # current, historical, future
            })
        
        elif metadata_template == "academic":
            # 学术文档时间相关性
            temporal_config.update({
                "publication_year_range": time_filters.get("year_range"),
                "conference_date": time_filters.get("conference_date"),
                "citation_recency_boost": True
            })
        
        elif metadata_template == "enterprise":
            # 企业文档版本控制
            temporal_config.update({
                "document_version": time_filters.get("version"),
                "last_modified_range": time_filters.get("modified_range"),
                "approval_date": time_filters.get("approval_date")
            })
        
        return temporal_config
    
    def _build_template_specific_filters(self, template_types: List[str]) -> Dict[str, Any]:
        """构建模版特化过滤器"""
        template_filters = {}
        
        for template_type in template_types:
            if template_type == "policy":
                template_filters["policy"] = {
                    "boost_authority_documents": True,
                    "prioritize_current_policies": True,
                    "filter_superseded": True
                }
            elif template_type == "academic":
                template_filters["academic"] = {
                    "boost_high_impact_papers": True,
                    "prioritize_recent_research": True,
                    "include_citation_context": True
                }
            elif template_type == "enterprise":
                template_filters["enterprise"] = {
                    "prioritize_approved_docs": True,
                    "boost_internal_standards": True,
                    "filter_draft_versions": True
                }
        
        return template_filters
    
    async def _execute_filter_then_rerank(
        self,
        query: str,
        filters: Dict[str, Any],
        user_mode: Optional[str],
        top_k: int,
        include_highlights: bool
    ) -> List[Dict[str, Any]]:
        """执行Filter-then-Rerank检索架构"""
        
        # Step 1: Filter阶段 - 使用Elasticsearch进行高速过滤
        filter_start = time.time()
        filtered_candidates = await self._elasticsearch_filter_phase(
            query=query,
            filters=filters,
            candidate_size=top_k * 5  # 获取5倍候选结果用于Rerank
        )
        filter_time = time.time() - filter_start
        
        # Step 2: Rerank阶段 - 使用向量相似度进行精确重排序
        rerank_start = time.time()
        if filtered_candidates:
            reranked_results = await self._vector_rerank_phase(
                query=query,
                candidates=filtered_candidates,
                user_mode=user_mode,
                top_k=top_k,
                include_highlights=include_highlights
            )
        else:
            reranked_results = []
        
        rerank_time = time.time() - rerank_start
        
        logger.info(f"Filter-then-Rerank: Filter={filter_time:.3f}s, Rerank={rerank_time:.3f}s, Results={len(reranked_results)}")
        
        return reranked_results
    
    async def _elasticsearch_filter_phase(
        self,
        query: str,
        filters: Dict[str, Any],
        candidate_size: int = 100
    ) -> List[Dict[str, Any]]:
        """Elasticsearch过滤阶段 - 高速筛选候选文档"""
        try:
            # 构建ES查询
            es_query = {
                "query": {
                    "bool": {
                        "must": [
                            {
                                "multi_match": {
                                    "query": query,
                                    "fields": ["content^2", "title^3", "metadata.abstract^1.5"],
                                    "type": "best_fields"
                                }
                            }
                        ],
                        "filter": []
                    }
                },
                "size": candidate_size,
                "_source": {
                    "includes": [
                        "document_id", "content", "title", "metadata",
                        "collection_id", "metadata_template", "chunk_index"
                    ]
                }
            }
            
            # 添加Collection过滤
            if "collection_ids" in filters:
                es_query["query"]["bool"]["filter"].append({
                    "terms": {"collection_id": filters["collection_ids"]}
                })
            
            # 添加模版过滤
            if "metadata_template" in filters:
                es_query["query"]["bool"]["filter"].append({
                    "term": {"metadata_template": filters["metadata_template"]}
                })
            
            # 添加时间过滤（政策文档特化）
            if "temporal" in filters:
                temporal_filters = self._build_es_temporal_filters(filters["temporal"])
                if temporal_filters:
                    es_query["query"]["bool"]["filter"].extend(temporal_filters)
            
            # 执行ES查询
            response = await hybrid_search_service.es.search(
                index="mat_qa_chunks",
                body=es_query
            )
            
            # 转换ES结果为标准格式
            candidates = []
            for hit in response["hits"]["hits"]:
                candidates.append({
                    "id": hit["_id"],
                    "document_id": hit["_source"].get("document_id"),
                    "content": hit["_source"].get("content", ""),
                    "title": hit["_source"].get("title", ""),
                    "metadata": hit["_source"].get("metadata", {}),
                    "collection_id": hit["_source"].get("collection_id"),
                    "metadata_template": hit["_source"].get("metadata_template"),
                    "es_score": hit["_score"],
                    "source": hit["_source"]
                })
            
            logger.info(f"ES Filter阶段获取到 {len(candidates)} 个候选结果")
            return candidates
            
        except Exception as e:
            logger.error(f"Elasticsearch过滤阶段失败: {e}")
            return []
    
    def _build_es_temporal_filters(self, temporal_config: Dict[str, Any]) -> List[Dict[str, Any]]:
        """构建ES时间过滤器"""
        es_filters = []
        
        # 政策文档时效性过滤
        if temporal_config.get("time_status") == "current":
            es_filters.append({
                "range": {
                    "metadata.effective_date": {"lte": "now"}
                }
            })
            es_filters.append({
                "bool": {
                    "should": [
                        {"bool": {"must_not": {"exists": {"field": "metadata.expiry_date"}}}},
                        {"range": {"metadata.expiry_date": {"gte": "now"}}}
                    ]
                }
            })
        
        # 发布日期范围过滤
        if temporal_config.get("publication_date_range"):
            date_range = temporal_config["publication_date_range"]
            es_filters.append({
                "range": {
                    "metadata.publication_date": {
                        "gte": date_range.get("start"),
                        "lte": date_range.get("end")
                    }
                }
            })
        
        return es_filters
    
    async def _vector_rerank_phase(
        self,
        query: str,
        candidates: List[Dict[str, Any]],
        user_mode: Optional[str],
        top_k: int,
        include_highlights: bool
    ) -> List[Dict[str, Any]]:
        """向量重排序阶段 - 精确相似度计算"""
        try:
            if not candidates:
                return []
            
            # 使用权重检索服务进行向量重排序
            rerank_request = {
                "query": query,
                "top_k": top_k,
                "mode": user_mode or "dual",
                "include_highlights": include_highlights,
                "pre_filtered_candidates": candidates  # 传入预过滤的候选结果
            }
            
            # 执行权重检索重排序
            weighted_results = await weighted_retrieval_service.weighted_search(
                query=rerank_request["query"],
                top_k=rerank_request["top_k"],
                mode=rerank_request["mode"],
                include_highlights=rerank_request["include_highlights"],
                pre_filtered_candidates=candidates
            )
            
            # 转换权重检索结果为标准格式
            reranked_results = []
            for weighted_result in weighted_results:
                result_dict = {
                    "id": weighted_result.id,
                    "document_id": getattr(weighted_result, 'document_id', None),
                    "content": weighted_result.content,
                    "title": weighted_result.title,
                    "score": weighted_result.final_score,
                    "scores": {
                        "keyword": weighted_result.keyword_score,
                        "general_vector": weighted_result.general_vector_score,
                        "domain_vector": weighted_result.domain_vector_score,
                        "final": weighted_result.final_score
                    },
                    "highlights": weighted_result.highlights,
                    "metadata": weighted_result.source.get("metadata", {}),
                    "collection_id": weighted_result.source.get("collection_id"),
                    "metadata_template": weighted_result.source.get("metadata_template")
                }
                reranked_results.append(result_dict)
            
            return reranked_results
            
        except Exception as e:
            logger.error(f"向量重排序阶段失败: {e}")
            # 如果重排序失败，返回原候选结果的前top_k个
            return candidates[:top_k]
    
    async def _post_process_collection_results(
        self,
        results: List[Dict[str, Any]],
        collection_info: Dict[str, Any],
        metadata_template: Optional[str],
        query: str
    ) -> List[Dict[str, Any]]:
        """Collection特化的结果后处理"""
        if not results:
            return []
        
        # 1. 添加Collection上下文信息
        for result in results:
            collection_id = result.get("collection_id")
            if collection_id and collection_info.get("collections"):
                # 查找对应的Collection信息
                collection_data = next(
                    (c for c in collection_info["collections"] if c["id"] == collection_id),
                    None
                )
                if collection_data:
                    result["collection_context"] = {
                        "collection_name": collection_data["name"],
                        "collection_template": collection_data["metadata_template"]
                    }
        
        # 2. 元数据模版特化处理
        if metadata_template:
            results = await self._apply_template_specific_processing(
                results, metadata_template, query
            )
        
        # 3. 结果去重和合并（如果有重复分块）
        deduplicated_results = self._deduplicate_chunk_results(results)
        
        return deduplicated_results
    
    async def _apply_template_specific_processing(
        self,
        results: List[Dict[str, Any]],
        template_type: str,
        query: str
    ) -> List[Dict[str, Any]]:
        """应用模版特化的结果处理"""
        
        if template_type == "policy":
            return await self._process_policy_results(results, query)
        elif template_type == "academic":
            return await self._process_academic_results(results, query)
        elif template_type == "enterprise":
            return await self._process_enterprise_results(results, query)
        else:
            return results
    
    async def _process_policy_results(
        self,
        results: List[Dict[str, Any]],
        query: str
    ) -> List[Dict[str, Any]]:
        """政策文档结果特化处理"""
        for result in results:
            metadata = result.get("metadata", {})
            
            # 添加政策特化信息
            result["policy_context"] = {
                "doc_number": metadata.get("doc_number"),
                "issuing_authority": metadata.get("issuing_authority"),
                "policy_level": metadata.get("policy_level"),
                "effective_date": metadata.get("effective_date"),
                "time_status": self._determine_policy_time_status(metadata)
            }
            
            # 政策权威性评分
            if metadata.get("issuing_authority"):
                authority_boost = self._calculate_authority_boost(
                    metadata["issuing_authority"]
                )
                result["score"] = result.get("score", 0) * (1 + authority_boost)
        
        # 按权威性和时效性排序
        results.sort(key=lambda x: (
            x.get("policy_context", {}).get("policy_level", 999),
            -x.get("score", 0)
        ))
        
        return results
    
    async def _process_academic_results(
        self,
        results: List[Dict[str, Any]],
        query: str
    ) -> List[Dict[str, Any]]:
        """学术文档结果特化处理"""
        for result in results:
            metadata = result.get("metadata", {})
            
            # 添加学术特化信息
            result["academic_context"] = {
                "authors": metadata.get("authors"),
                "publication_venue": metadata.get("journal") or metadata.get("conference"),
                "citation_count": metadata.get("citation_count", 0),
                "impact_factor": metadata.get("impact_factor"),
                "research_area": metadata.get("research_area")
            }
            
            # 学术影响力评分提升
            citation_boost = min(0.5, metadata.get("citation_count", 0) / 100)
            result["score"] = result.get("score", 0) * (1 + citation_boost)
        
        return results
    
    async def _process_enterprise_results(
        self,
        results: List[Dict[str, Any]],
        query: str
    ) -> List[Dict[str, Any]]:
        """企业文档结果特化处理"""
        for result in results:
            metadata = result.get("metadata", {})
            
            # 添加企业特化信息
            result["enterprise_context"] = {
                "department": metadata.get("department"),
                "document_type": metadata.get("document_type"),
                "approval_status": metadata.get("approval_status"),
                "version": metadata.get("version"),
                "confidentiality_level": metadata.get("confidentiality_level")
            }
            
            # 审批状态权重调整
            if metadata.get("approval_status") == "approved":
                result["score"] = result.get("score", 0) * 1.2
        
        return results
    
    def _determine_policy_time_status(self, metadata: Dict[str, Any]) -> str:
        """判断政策文档时效状态"""
        now = datetime.now()
        
        effective_date = metadata.get("effective_date")
        expiry_date = metadata.get("expiry_date")
        
        if effective_date:
            try:
                effective_dt = datetime.fromisoformat(effective_date.replace("Z", "+00:00"))
                if effective_dt > now:
                    return "future"
            except:
                pass
        
        if expiry_date:
            try:
                expiry_dt = datetime.fromisoformat(expiry_date.replace("Z", "+00:00"))
                if expiry_dt < now:
                    return "expired"
            except:
                pass
        
        return "current"
    
    def _calculate_authority_boost(self, authority: str) -> float:
        """计算政策发文机构权威性加成"""
        authority_levels = {
            "国务院": 0.5,
            "全国人大": 0.5,
            "最高人民法院": 0.4,
            "最高人民检察院": 0.4,
            "各部委": 0.3,
            "地方政府": 0.2,
            "其他": 0.1
        }
        
        for key, boost in authority_levels.items():
            if key in authority:
                return boost
        
        return 0.1
    
    def _deduplicate_chunk_results(self, results: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """文档分块结果去重"""
        seen_documents = {}
        deduplicated = []
        
        for result in results:
            doc_id = result.get("document_id")
            if not doc_id:
                deduplicated.append(result)
                continue
            
            if doc_id not in seen_documents:
                seen_documents[doc_id] = result
                deduplicated.append(result)
            else:
                # 如果是同一文档的不同分块，选择评分更高的
                existing_score = seen_documents[doc_id].get("score", 0)
                current_score = result.get("score", 0)
                
                if current_score > existing_score:
                    # 替换为更高分的分块
                    deduplicated.remove(seen_documents[doc_id])
                    deduplicated.append(result)
                    seen_documents[doc_id] = result
        
        return deduplicated
    
    def _analyze_result_distribution(self, results: List[Dict[str, Any]]) -> Dict[str, Any]:
        """分析检索结果分布"""
        if not results:
            return {}
        
        # Collection分布
        collection_dist = {}
        template_dist = {}
        score_dist = {"high": 0, "medium": 0, "low": 0}
        
        for result in results:
            # Collection分布统计
            collection_id = result.get("collection_id")
            if collection_id:
                collection_dist[collection_id] = collection_dist.get(collection_id, 0) + 1
            
            # 模版分布统计
            template = result.get("metadata_template")
            if template:
                template_dist[template] = template_dist.get(template, 0) + 1
            
            # 评分分布统计
            score = result.get("score", 0)
            if score >= 0.8:
                score_dist["high"] += 1
            elif score >= 0.5:
                score_dist["medium"] += 1
            else:
                score_dist["low"] += 1
        
        return {
            "collection_distribution": collection_dist,
            "template_distribution": template_dist,
            "score_distribution": score_dist,
            "total_results": len(results)
        }
    
    def _analyze_metadata_distribution(self, results: List[Dict[str, Any]]) -> Dict[str, Any]:
        """分析元数据分布"""
        if not results:
            return {}
        
        metadata_stats = {}
        
        # 按模版类型分析元数据
        for result in results:
            template = result.get("metadata_template", "unknown")
            if template not in metadata_stats:
                metadata_stats[template] = {
                    "count": 0,
                    "avg_score": 0,
                    "specific_fields": {}
                }
            
            metadata_stats[template]["count"] += 1
            metadata_stats[template]["avg_score"] += result.get("score", 0)
            
            # 特定字段统计
            metadata = result.get("metadata", {})
            if template == "policy":
                auth = metadata.get("issuing_authority")
                if auth:
                    auth_stats = metadata_stats[template]["specific_fields"].get("authorities", {})
                    auth_stats[auth] = auth_stats.get(auth, 0) + 1
                    metadata_stats[template]["specific_fields"]["authorities"] = auth_stats
            
            elif template == "academic":
                venue = metadata.get("journal") or metadata.get("conference")
                if venue:
                    venue_stats = metadata_stats[template]["specific_fields"].get("venues", {})
                    venue_stats[venue] = venue_stats.get(venue, 0) + 1
                    metadata_stats[template]["specific_fields"]["venues"] = venue_stats
        
        # 计算平均分
        for template_stats in metadata_stats.values():
            if template_stats["count"] > 0:
                template_stats["avg_score"] /= template_stats["count"]
        
        return metadata_stats


# 创建全局实例
collection_retrieval_service = CollectionRetrievalService()

# 导出
__all__ = ['CollectionRetrievalService', 'CollectionSearchResult', 'collection_retrieval_service']