"""
检索策略路由Hook - 核心组件

根据查询特征动态选择最优检索策略
"""

import os
import logging
from typing import Dict, List, Any, Optional
from ..base import PreHook, RunInput, AgentSession
from ..registry import register_pre_hook

logger = logging.getLogger(__name__)


@register_pre_hook(
    hook_id='retrieval_strategy_router',
    metadata={
        'name': '检索策略路由',
        'description': '根据查询特征动态选择最优检索策略',
        'category': 'routing',
        'priority': 10  # 高优先级，在intent_analysis之后执行
    }
)
class RetrievalStrategyRouterHook(PreHook):
    """检索策略路由Hook - 核心组件"""

    def __init__(self, config):
        super().__init__(config)
        cfg = config.get('config', {})
        self.routing_rules = cfg.get('routing_rules', [])
        self.default_strategy = cfg.get('default_strategy', 'hybrid_default')
        self.pre_retrieve = cfg.get('pre_retrieve', False)
        self.retrieval_services = {}

        # 初始化检索服务（延迟加载）
        self._services_initialized = False

    def _initialize_services(self):
        """延迟初始化检索服务"""
        if self._services_initialized:
            return

        try:
            from service.hybrid_search_service import hybrid_search_service
            self.retrieval_services['hybrid'] = hybrid_search_service
            logger.info("已加载hybrid_search_service")
        except Exception as e:
            logger.warning(f"加载hybrid_search_service失败: {e}")

        try:
            from service.hirag_agno_integration import HiRAGTools
            self.retrieval_services['hirag'] = HiRAGTools()
            logger.info("已加载HiRAGTools")
        except Exception as e:
            logger.warning(f"加载HiRAGTools失败: {e}")

        try:
            from service.qa_routing_service import QARoutingService
            self.retrieval_services['qa_routing'] = QARoutingService()
            logger.info("已加载QARoutingService")
        except Exception as e:
            logger.warning(f"加载QARoutingService失败: {e}")

        try:
            from service.datagraph_agno_tools import DataGraphTools
            self.retrieval_services['graph'] = DataGraphTools()
            logger.info("已加载DataGraphTools")
        except Exception as e:
            logger.warning(f"加载DataGraphTools失败: {e}")

        self._services_initialized = True

    async def execute(
        self,
        run_input: RunInput,
        session: AgentSession,
        user_id: Optional[str] = None,
        debug_mode: Optional[bool] = None,
        **kwargs
    ) -> None:
        """路由检索策略

        Args:
            run_input: 运行输入
            session: 会话信息
            user_id: 用户ID
            debug_mode: 调试模式
        """
        # 获取上下文（由前置hooks注入）
        context = run_input.context if hasattr(run_input, 'context') else {}
        intent = context.get('intent', 'other')
        features = context.get('query_features', {})

        logger.info(f"检索路由: intent={intent}, features={features}")

        # 选择策略
        strategy = self._match_strategy(intent, features)

        # 构造检索配置
        retrieval_config = self._build_retrieval_config(strategy, intent, features)

        # 注入到上下文
        context['retrieval_strategy'] = strategy
        context['retrieval_config'] = retrieval_config

        logger.info(f"选择检索策略: {strategy}, config={retrieval_config}")

        # 可选：预执行检索
        if self.pre_retrieve:
            try:
                self._initialize_services()
                results = await self._execute_retrieval(
                    run_input.input_content,
                    strategy,
                    retrieval_config
                )
                context['retrieval_results'] = results
                logger.info(f"预检索完成: {len(results)} 条结果")
            except Exception as e:
                logger.error(f"预检索失败: {e}")
                # 不中断流程，仅记录错误

        run_input.context = context

    def _match_strategy(
        self,
        intent: str,
        features: Dict[str, Any]
    ) -> str:
        """匹配检索策略

        Args:
            intent: 查询意图
            features: 查询特征

        Returns:
            检索策略名称
        """
        complexity = features.get('complexity', 'medium')
        domain = features.get('domain', 'general')

        logger.debug(f"匹配策略: intent={intent}, complexity={complexity}, domain={domain}")

        # 遍历路由规则
        for rule in self.routing_rules:
            conditions = rule.get('conditions', {})
            matched = True

            # 检查意图匹配
            if 'intent' in conditions:
                rule_intent = conditions['intent']
                if isinstance(rule_intent, list):
                    if intent not in rule_intent:
                        matched = False
                elif rule_intent != intent:
                    matched = False

            # 检查复杂度匹配
            if matched and 'complexity' in conditions:
                rule_complexity = conditions['complexity']
                if isinstance(rule_complexity, list):
                    if complexity not in rule_complexity:
                        matched = False
                elif rule_complexity != complexity:
                    matched = False

            # 检查领域匹配
            if matched and 'domain' in conditions:
                rule_domain = conditions['domain']
                if isinstance(rule_domain, list):
                    if domain not in rule_domain:
                        matched = False
                elif rule_domain != domain:
                    matched = False

            # 匹配成功
            if matched:
                strategy = rule.get('strategy')
                logger.info(f"规则匹配成功: {rule.get('name', 'unnamed')} → {strategy}")
                return strategy

        # 默认策略
        logger.info(f"无规则匹配，使用默认策略: {self.default_strategy}")
        return self.default_strategy

    def _build_retrieval_config(
        self,
        strategy: str,
        intent: str,
        features: Dict[str, Any]
    ) -> Dict[str, Any]:
        """构造检索配置

        Args:
            strategy: 检索策略
            intent: 查询意图
            features: 查询特征

        Returns:
            检索配置字典
        """
        base_config = {
            'top_k': 10,
            'filters': {},
            'rerank': True,
            'strategy': strategy
        }

        # 根据策略调整配置
        if strategy == 'qa_direct':
            # QA直达：只检索QA数据集，返回少量结果
            base_config.update({
                'top_k': 3,
                'source': 'qa_only',
                'rerank': False
            })

        elif strategy == 'full_retrieval_with_rerank':
            # 全量检索+重排：召回更多，然后重排
            base_config.update({
                'top_k': 50,
                'rerank': True,
                'rerank_top_k': 10,
                'source': 'all'
            })

        elif strategy == 'graph_enhanced':
            # 图谱增强：混合检索 + 图谱查询
            base_config.update({
                'top_k': 10,
                'enable_graph': True,
                'graph_mode': 'mix',
                'source': 'all'
            })

        elif strategy == 'hierarchical_retrieval':
            # 层次检索(HiRAG)
            base_config.update({
                'mode': 'hirag',
                'hirag_mode': 'hi',  # high-level
                'top_k': 10
            })

        elif strategy == 'policy_enhanced':
            # 政策专用：元数据过滤 + 图谱
            base_config.update({
                'top_k': 10,
                'enable_graph': True,
                'enable_metadata_filter': True,
                'source': 'all'
            })

        elif strategy == 'academic_enhanced':
            # 学术专用：引用分析 + 重排
            base_config.update({
                'top_k': 20,
                'rerank': True,
                'rerank_top_k': 8,
                'enable_citation_analysis': True,
                'source': 'all'
            })

        else:
            # hybrid_default: 标准混合检索
            base_config.update({
                'top_k': 10,
                'rerank': True,
                'source': 'all'
            })

        # 根据意图微调
        if intent in ['summary', 'compare']:
            # 总结和对比需要更多上下文
            base_config['top_k'] = max(base_config.get('top_k', 10), 20)

        return base_config

    async def _execute_retrieval(
        self,
        query: str,
        strategy: str,
        config: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """执行检索

        Args:
            query: 查询文本
            strategy: 检索策略
            config: 检索配置

        Returns:
            检索结果列表
        """
        results = []

        try:
            if strategy == 'qa_direct':
                # QA直达
                service = self.retrieval_services.get('qa_routing')
                if service:
                    results = await service.search_qa_routes(query, **config)

            elif strategy.startswith('hierarchical'):
                # 层次检索
                service = self.retrieval_services.get('hirag')
                if service:
                    results = await service.hierarchical_search(query, **config)

            elif strategy == 'graph_enhanced':
                # 图谱增强：组合检索
                hybrid_service = self.retrieval_services.get('hybrid')
                graph_service = self.retrieval_services.get('graph')

                if hybrid_service:
                    hybrid_results = await hybrid_service.hybrid_search(query, **config)
                    results.extend(hybrid_results)

                if graph_service:
                    graph_results = await graph_service.query_graph(query, **config)
                    results.extend(graph_results)

            else:
                # 默认混合检索
                service = self.retrieval_services.get('hybrid')
                if service:
                    results = await service.hybrid_search(query, **config)

        except Exception as e:
            logger.error(f"执行检索失败 (strategy={strategy}): {e}")

        return results
