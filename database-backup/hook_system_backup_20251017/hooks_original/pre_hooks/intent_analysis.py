"""
意图分析Hook

分析用户查询的意图，为检索策略路由提供决策依据
"""

import os
import json
import httpx
from typing import Optional, Dict, List
import logging
from ..base import PreHook, RunInput, AgentSession
from ..registry import register_pre_hook

logger = logging.getLogger(__name__)


@register_pre_hook(
    hook_id='intent_analysis',
    metadata={
        'name': '意图分析',
        'description': '分析用户查询意图，识别查询类型和特征',
        'category': 'analysis'
    }
)
class IntentAnalysisHook(PreHook):
    """意图分析Hook - 替代原有的step_intent"""

    def __init__(self, config):
        super().__init__(config)
        cfg = config.get('config', {})
        self.llm_gateway_url = cfg.get('llm_gateway_url', os.getenv('LLM_GATEWAY_URL', 'http://127.0.0.1:9050'))
        self.model_id = cfg.get('model_id', 'Qwen/Qwen2.5-7B-Instruct')
        self.enable_llm_fallback = cfg.get('enable_llm_fallback', True)
        self.timeout = cfg.get('timeout', 10)

    async def execute(
        self,
        run_input: RunInput,
        session: AgentSession,
        user_id: Optional[str] = None,
        debug_mode: Optional[bool] = None,
        **kwargs
    ) -> None:
        """分析查询意图

        Args:
            run_input: 运行输入
            session: 会话信息
            user_id: 用户ID
            debug_mode: 调试模式
        """
        query = run_input.input_content

        # 1. 快速启发式分析
        intent = self._heuristic_analysis(query)
        complexity = self._estimate_complexity(query)
        domain = self._detect_domain(query)

        # 2. LLM增强分析（如果启用且启发式不确定）
        keywords = []
        if intent == 'uncertain' and self.enable_llm_fallback:
            try:
                llm_result = await self._llm_analysis(query)
                intent = llm_result.get('intent', intent)
                keywords = llm_result.get('keywords', [])
            except Exception as e:
                logger.warning(f"LLM意图分析失败，使用启发式结果: {e}")
                intent = 'other'  # fallback

        # 3. 提取关键词（如果LLM未提供）
        if not keywords:
            keywords = self._extract_keywords_simple(query)

        # 4. 注入到上下文
        if not hasattr(run_input, 'context') or run_input.context is None:
            run_input.context = {}

        run_input.context['intent'] = intent
        run_input.context['keywords'] = keywords
        run_input.context['query_features'] = {
            'length': len(query),
            'complexity': complexity,
            'domain': domain,
            'word_count': len(query.split())
        }

        logger.info(f"意图分析完成: intent={intent}, complexity={complexity}, domain={domain}, keywords={keywords}")

    def _heuristic_analysis(self, query: str) -> str:
        """启发式意图分析

        Args:
            query: 查询文本

        Returns:
            意图类型
        """
        query_lower = query.lower()

        # 综述类
        if any(k in query_lower for k in ["综述", "总结", "概述", "overview", "summary", "汇总"]):
            return "summary"

        # 对比类
        if any(k in query_lower for k in ["对比", "比较", "区别", "差异", "differences", "compare", "versus", "vs"]):
            return "compare"

        # 事实类
        if len(query) <= 20 and any(k in query_lower for k in ["什么", "是谁", "定义", "是什么", "what is", "who is", "what are"]):
            return "fact"

        # 操作指南类
        if any(k in query_lower for k in ["如何", "怎么", "怎样", "步骤", "方法", "how to", "how do", "guide"]):
            return "howto"

        # 列表类
        if any(k in query_lower for k in ["有哪些", "列举", "清单", "list", "top", "哪几个"]):
            return "list"

        # 实体查询类
        if any(k in query_lower for k in ["谁", "哪里", "when", "where", "which"]):
            return "entity"

        # 不确定
        return "uncertain"

    def _estimate_complexity(self, query: str) -> str:
        """估算查询复杂度

        Args:
            query: 查询文本

        Returns:
            complexity: simple | medium | high
        """
        length = len(query)
        word_count = len(query.split())

        # 简单：短查询，单一问题
        if length < 20 and word_count < 10:
            return "simple"

        # 复杂：长查询，多个条件
        elif length > 100 or word_count > 30:
            return "high"

        # 中等
        else:
            return "medium"

    def _detect_domain(self, query: str) -> str:
        """检测查询领域

        Args:
            query: 查询文本

        Returns:
            domain: policy | academic | general | enterprise
        """
        query_lower = query.lower()

        # 政策领域
        policy_keywords = ["政策", "法规", "文件", "通知", "办法", "条例", "规定", "政府", "policy", "regulation"]
        if any(k in query_lower for k in policy_keywords):
            return "policy"

        # 学术领域
        academic_keywords = ["论文", "研究", "学术", "期刊", "article", "paper", "research", "study", "journal"]
        if any(k in query_lower for k in academic_keywords):
            return "academic"

        # 企业领域
        enterprise_keywords = ["企业", "公司", "业务", "管理", "流程", "company", "business", "enterprise"]
        if any(k in query_lower for k in enterprise_keywords):
            return "enterprise"

        # 通用
        return "general"

    def _extract_keywords_simple(self, query: str) -> List[str]:
        """简单关键词提取

        Args:
            query: 查询文本

        Returns:
            关键词列表
        """
        # 移除常见停用词
        stopwords = set(['的', '了', '在', '是', '我', '有', '和', '就', '不', '人', '都', '一', '一个', '上', '也', '很', '到', '说', '要', '去', '你', '会', '着', '没有', '看', '好', '自己', '这'])

        # 简单分词（以空格和标点分隔）
        import re
        words = re.findall(r'[\w]+', query)

        # 过滤停用词和短词
        keywords = [w for w in words if len(w) > 1 and w not in stopwords]

        # 返回前5个关键词
        return keywords[:5]

    async def _llm_analysis(self, query: str) -> Dict:
        """LLM意图分析

        Args:
            query: 查询文本

        Returns:
            分析结果字典
        """
        prompt = f"""分析以下查询的意图，返回JSON格式。

查询: {query}

返回字段说明：
- intent: 意图类型 (fact | summary | howto | compare | list | entity | other)
- keywords: 关键词列表（最多5个）
- confidence: 置信度 (0-1)

仅返回JSON，无需其他说明。"""

        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(
                    f"{self.llm_gateway_url.rstrip('/')}/v1/chat/completions",
                    json={
                        "model": self.model_id,
                        "messages": [
                            {"role": "system", "content": "你是查询意图分析助手，只返回JSON。"},
                            {"role": "user", "content": prompt}
                        ],
                        "temperature": 0.1,
                        "stream": False
                    }
                )

                if response.status_code == 200:
                    data = response.json()
                    content = data['choices'][0]['message']['content']

                    # 解析JSON
                    result = json.loads(content)
                    return {
                        'intent': result.get('intent', 'other'),
                        'keywords': result.get('keywords', []),
                        'confidence': result.get('confidence', 0.5)
                    }

        except Exception as e:
            logger.debug(f"LLM意图分析请求失败: {e}")

        return {'intent': 'other', 'keywords': [], 'confidence': 0.0}
