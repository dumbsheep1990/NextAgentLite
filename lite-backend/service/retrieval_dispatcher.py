"""
检索策略分发器

根据Hook路由的策略，调用对应的检索服务
"""

import logging
from typing import Dict, List, Any, Optional
from dataclasses import dataclass

logger = logging.getLogger(__name__)


@dataclass
class RetrievalResult:
    """统一的检索结果格式"""
    id: str
    title: str
    content: str
    score: float
    combined_score: float
    keyword_score: float = 0.0
    general_score: float = 0.0
    domain_score: float = 0.0
    source: Dict[str, Any] = None
    metadata: Dict[str, Any] = None

    def __post_init__(self):
        if self.source is None:
            self.source = {}
        if self.metadata is None:
            self.metadata = {}


class RetrievalDispatcher:
    """检索策略分发器

    根据检索策略路由到不同的检索服务
    """

    def __init__(self):
        self._services_initialized = False
        self.hybrid_service = None
        self.qa_routing_service = None
        self.graph_service = None
        self.hirag_service = None

    def _initialize_services(self):
        """延迟初始化检索服务"""
        if self._services_initialized:
            return

        try:
            from service.hybrid_search_service import hybrid_search_service
            self.hybrid_service = hybrid_search_service
            logger.info("✓ 加载hybrid_search_service")
        except Exception as e:
            logger.warning(f"✗ 加载hybrid_search_service失败: {e}")

        try:
            from service.qa_routing_service import QARoutingService
            self.qa_routing_service = QARoutingService()
            logger.info("✓ 加载QARoutingService")
        except Exception as e:
            logger.warning(f"✗ 加载QARoutingService失败: {e}")

        try:
            from service.datagraph_agno_tools import DataGraphTools
            self.graph_service = DataGraphTools()
            logger.info("✓ 加载DataGraphTools")
        except Exception as e:
            logger.warning(f"✗ 加载DataGraphTools失败: {e}")

        try:
            from service.hirag_agno_integration import HiRAGTools
            self.hirag_service = HiRAGTools()
            logger.info("✓ 加载HiRAGTools")
        except Exception as e:
            logger.warning(f"✗ 加载HiRAGTools失败: {e}")

        self._services_initialized = True

    async def dispatch(
        self,
        strategy: str,
        query: str,
        config: Dict[str, Any],
        collection_ids: List[str] = None,
        filters: Dict[str, Any] = None,
        run_id: str = None
    ) -> List[RetrievalResult]:
        """分发检索请求

        Args:
            strategy: 检索策略名称
            query: 查询文本
            config: 检索配置（由Hook路由生成）
            collection_ids: 知识库ID列表
            filters: 过滤器
            run_id: 运行ID

        Returns:
            统一格式的检索结果列表
        """
        self._initialize_services()

        logger.info(f"[Dispatcher][{run_id}] 分发检索策略: {strategy}")

        # 根据策略调用不同的检索方法
        if strategy == 'qa_direct':
            return await self._qa_direct_search(query, config, filters, run_id)

        elif strategy == 'full_retrieval_with_rerank':
            return await self._full_retrieval_with_rerank(
                query, config, collection_ids, filters, run_id
            )

        elif strategy == 'graph_enhanced':
            return await self._graph_enhanced_search(
                query, config, collection_ids, filters, run_id
            )

        elif strategy == 'hierarchical_retrieval':
            return await self._hierarchical_retrieval(
                query, config, collection_ids, filters, run_id
            )

        elif strategy == 'policy_enhanced':
            return await self._policy_enhanced_search(
                query, config, collection_ids, filters, run_id
            )

        elif strategy == 'academic_enhanced':
            return await self._academic_enhanced_search(
                query, config, collection_ids, filters, run_id
            )

        else:
            # hybrid_default 或未知策略，回退到标准混合检索
            return await self._hybrid_default_search(
                query, config, collection_ids, filters, run_id
            )

    async def _qa_direct_search(
        self,
        query: str,
        config: Dict[str, Any],
        filters: Dict[str, Any],
        run_id: str
    ) -> List[RetrievalResult]:
        """QA直达检索：只检索QA数据集"""
        logger.info(f"[Dispatcher][{run_id}] QA直达检索")

        if not self.qa_routing_service:
            logger.warning(f"[Dispatcher][{run_id}] QA服务未初始化，回退到混合检索")
            return await self._hybrid_default_search(query, config, [], filters, run_id)

        try:
            results = await self.qa_routing_service.search_qa_routes(
                query,
                top_k=config.get('top_k', 3),
                filters=filters
            )
            return self._normalize_results(results, 'qa_direct')
        except Exception as e:
            logger.error(f"[Dispatcher][{run_id}] QA检索失败: {e}")
            return []

    async def _full_retrieval_with_rerank(
        self,
        query: str,
        config: Dict[str, Any],
        collection_ids: List[str],
        filters: Dict[str, Any],
        run_id: str
    ) -> List[RetrievalResult]:
        """全量检索+重排"""
        logger.info(f"[Dispatcher][{run_id}] 全量检索+重排: top_k={config.get('top_k', 50)}")

        if not self.hybrid_service:
            return []

        try:
            # 组装过滤器
            search_filters = dict(filters or {})
            if collection_ids:
                search_filters['collection_id'] = collection_ids

            # 大量召回
            results = await self.hybrid_service.hybrid_search(
                query=query,
                top_k=config.get('top_k', 50),
                filters=search_filters,
                run_id=run_id
            )

            # TODO: 添加重排逻辑
            # 目前先返回top配置的数量
            rerank_top_k = config.get('rerank_top_k', 10)
            results = results[:rerank_top_k] if results else []

            return self._normalize_results(results, 'full_rerank')
        except Exception as e:
            logger.error(f"[Dispatcher][{run_id}] 全量检索失败: {e}")
            return []

    async def _graph_enhanced_search(
        self,
        query: str,
        config: Dict[str, Any],
        collection_ids: List[str],
        filters: Dict[str, Any],
        run_id: str
    ) -> List[RetrievalResult]:
        """图谱增强检索：混合检索 + 图谱查询"""
        logger.info(f"[Dispatcher][{run_id}] 图谱增强检索")

        results = []

        # 1. 混合检索
        if self.hybrid_service:
            try:
                search_filters = dict(filters or {})
                if collection_ids:
                    search_filters['collection_id'] = collection_ids

                hybrid_results = await self.hybrid_service.hybrid_search(
                    query=query,
                    top_k=config.get('top_k', 10),
                    filters=search_filters,
                    run_id=run_id
                )
                results.extend(self._normalize_results(hybrid_results, 'hybrid'))
            except Exception as e:
                logger.error(f"[Dispatcher][{run_id}] 混合检索失败: {e}")

        # 2. 图谱查询
        if self.graph_service and config.get('enable_graph', True):
            try:
                graph_mode = config.get('graph_mode', 'mix')
                graph_results = await self.graph_service.query_graph(
                    query=query,
                    mode=graph_mode,
                    top_k=config.get('top_k', 10)
                )
                # 图谱结果追加到列表末尾
                results.extend(self._normalize_results(graph_results, 'graph'))
            except Exception as e:
                logger.error(f"[Dispatcher][{run_id}] 图谱查询失败: {e}")

        return results

    async def _hierarchical_retrieval(
        self,
        query: str,
        config: Dict[str, Any],
        collection_ids: List[str],
        filters: Dict[str, Any],
        run_id: str
    ) -> List[RetrievalResult]:
        """层次检索（HiRAG）"""
        logger.info(f"[Dispatcher][{run_id}] HiRAG层次检索")

        if not self.hirag_service:
            logger.warning(f"[Dispatcher][{run_id}] HiRAG服务未初始化，回退到混合检索")
            return await self._hybrid_default_search(query, config, collection_ids, filters, run_id)

        try:
            results = await self.hirag_service.hierarchical_search(
                query=query,
                collection_id=collection_ids[0] if collection_ids else None,
                mode=config.get('hirag_mode', 'hi'),
                top_k=config.get('top_k', 10),
                filters=filters
            )
            return self._normalize_results(results, 'hirag')
        except Exception as e:
            logger.error(f"[Dispatcher][{run_id}] HiRAG检索失败: {e}")
            # 回退到混合检索
            return await self._hybrid_default_search(query, config, collection_ids, filters, run_id)

    async def _policy_enhanced_search(
        self,
        query: str,
        config: Dict[str, Any],
        collection_ids: List[str],
        filters: Dict[str, Any],
        run_id: str
    ) -> List[RetrievalResult]:
        """政策专用检索：元数据过滤 + 图谱"""
        logger.info(f"[Dispatcher][{run_id}] 政策增强检索")

        # 类似graph_enhanced，但强化元数据过滤
        return await self._graph_enhanced_search(
            query, config, collection_ids, filters, run_id
        )

    async def _academic_enhanced_search(
        self,
        query: str,
        config: Dict[str, Any],
        collection_ids: List[str],
        filters: Dict[str, Any],
        run_id: str
    ) -> List[RetrievalResult]:
        """学术专用检索：引用分析 + 重排"""
        logger.info(f"[Dispatcher][{run_id}] 学术增强检索")

        # 类似full_retrieval_with_rerank
        return await self._full_retrieval_with_rerank(
            query, config, collection_ids, filters, run_id
        )

    async def _hybrid_default_search(
        self,
        query: str,
        config: Dict[str, Any],
        collection_ids: List[str],
        filters: Dict[str, Any],
        run_id: str
    ) -> List[RetrievalResult]:
        """标准混合检索（默认策略）"""
        logger.info(f"[Dispatcher][{run_id}] 标准混合检索")

        if not self.hybrid_service:
            return []

        try:
            search_filters = dict(filters or {})
            if collection_ids:
                search_filters['collection_id'] = collection_ids

            results = await self.hybrid_service.hybrid_search(
                query=query,
                top_k=config.get('top_k', 10),
                filters=search_filters,
                run_id=run_id
            )
            return self._normalize_results(results, 'hybrid')
        except Exception as e:
            logger.error(f"[Dispatcher][{run_id}] 混合检索失败: {e}")
            return []

    def _normalize_results(
        self,
        results: List[Any],
        source_type: str
    ) -> List[RetrievalResult]:
        """将不同服务的结果统一为标准格式

        Args:
            results: 原始检索结果
            source_type: 来源类型标记

        Returns:
            标准化的结果列表
        """
        normalized = []

        for r in (results or []):
            try:
                # 尝试从对象属性获取
                result = RetrievalResult(
                    id=getattr(r, 'id', '') or getattr(r, 'document_id', ''),
                    title=getattr(r, 'title', ''),
                    content=getattr(r, 'content', ''),
                    score=float(getattr(r, 'score', 0.0) or 0.0),
                    combined_score=float(getattr(r, 'combined_score', 0.0) or 0.0),
                    keyword_score=float(getattr(r, 'keyword_score', 0.0) or 0.0),
                    general_score=float(getattr(r, 'general_score', 0.0) or 0.0),
                    domain_score=float(getattr(r, 'domain_score', 0.0) or 0.0),
                    source=getattr(r, 'source', {}) or {},
                    metadata={'source_type': source_type}
                )
                normalized.append(result)
            except Exception as e:
                logger.debug(f"规范化结果失败: {e}")
                # 尝试字典方式
                if isinstance(r, dict):
                    try:
                        result = RetrievalResult(
                            id=r.get('id', '') or r.get('document_id', ''),
                            title=r.get('title', ''),
                            content=r.get('content', ''),
                            score=float(r.get('score', 0.0) or 0.0),
                            combined_score=float(r.get('combined_score', 0.0) or 0.0),
                            keyword_score=float(r.get('keyword_score', 0.0) or 0.0),
                            source=r.get('source', {}) or {},
                            metadata={'source_type': source_type}
                        )
                        normalized.append(result)
                    except Exception:
                        pass

        return normalized


# 全局单例
_retrieval_dispatcher: Optional[RetrievalDispatcher] = None


def get_retrieval_dispatcher() -> RetrievalDispatcher:
    """获取检索分发器单例"""
    global _retrieval_dispatcher
    if _retrieval_dispatcher is None:
        _retrieval_dispatcher = RetrievalDispatcher()
    return _retrieval_dispatcher
