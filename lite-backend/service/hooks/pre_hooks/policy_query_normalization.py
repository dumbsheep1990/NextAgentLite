"""
政策查询标准化Hook

对政策问答查询进行标准化处理：
- 去除冗余词汇
- 展开缩写和简称
- 标准化术语
- 提取关键词和实体
"""

import re
import logging
from typing import Optional, Dict, List, Set
from ..base import PreHook, RunInput, AgentSession
from ..registry import register_pre_hook

logger = logging.getLogger(__name__)


@register_pre_hook(
    hook_id='policy_query_normalization',
    metadata={
        'name': '政策查询标准化',
        'description': '标准化政策查询文本，展开缩写，提取关键词',
        'category': 'enhancement',
        'scene': 'policy_qa'
    }
)
class PolicyQueryNormalizationHook(PreHook):
    """政策查询标准化Hook

    功能:
    - 去除冗余词汇（啊、呢、吧等语气词）
    - 展开政策领域常见缩写
    - 标准化政策术语
    - 提取关键词和实体
    """

    # 冗余词列表（语气词、口语化表达等）
    REDUNDANT_WORDS = [
        r'\s+吗\s*$',  # 句末的"吗"
        r'\s+呢\s*$',  # 句末的"呢"
        r'\s+吧\s*$',  # 句末的"吧"
        r'\s+啊\s*$',  # 句末的"啊"
        r'请问',        # "请问"
        r'你好',        # "你好"
        r'谢谢',        # "谢谢"
    ]

    # 政策领域缩写映射
    ABBREVIATION_MAPPINGS = {
        # 政府机构缩写
        '国发': '国务院发布的',
        '国办发': '国务院办公厅发布的',
        '发改委': '国家发展和改革委员会',
        '工信部': '工业和信息化部',
        '人社部': '人力资源和社会保障部',
        '财政部': '财政部',
        '教育部': '教育部',
        '住建部': '住房和城乡建设部',
        '农业部': '农业农村部',

        # 政策术语缩写
        '环评': '环境影响评价',
        '安评': '安全评价',
        '可研': '可行性研究',
        '建设用地': '建设用地审批',
        '土地证': '土地使用权证',
        '规划证': '建设工程规划许可证',
    }

    # 政策术语标准化（同义词映射）
    TERM_STANDARDIZATION = {
        # 政策文件相关
        '文件': '政策文件',
        '规定': '政策规定',
        '办法': '管理办法',
        '通知': '通知',

        # 审批相关
        '批复': '批准答复',
        '核准': '核准审批',
        '备案': '备案登记',

        # 时间相关
        '新政': '新政策',
        '旧政': '原政策',
    }

    # 关键词提取的停用词
    STOP_WORDS = {
        '的', '了', '在', '是', '我', '你', '他', '她', '它',
        '这', '那', '这个', '那个', '什么', '怎么', '如何',
        '可以', '能够', '应该', '需要', '关于', '有关', '相关'
    }

    def __init__(self, config: Dict):
        super().__init__(config)

        # 提取配置
        hook_config = config.get('config', {})
        self.operations = hook_config.get('operations', [
            'remove_redundant_words',
            'expand_abbreviations',
            'standardize_terms',
            'extract_keywords'
        ])
        self.term_dictionary = hook_config.get('term_dictionary', 'policy_terms')
        self.use_nlp = hook_config.get('use_nlp', False)
        self.nlp_tool = hook_config.get('nlp_tool', 'policy_nlp_api')
        self.preserve_original = hook_config.get('preserve_original', True)  # 是否保留原始query

        # 自定义缩写和术语（从配置加载）
        custom_abbr = hook_config.get('custom_abbreviations', {})
        custom_terms = hook_config.get('custom_terms', {})

        # 合并自定义配置
        self.abbreviations = {**self.ABBREVIATION_MAPPINGS, **custom_abbr}
        self.term_mappings = {**self.TERM_STANDARDIZATION, **custom_terms}

        logger.info(
            f"PolicyQueryNormalizationHook 初始化完成: "
            f"操作={self.operations}, "
            f"缩写数={len(self.abbreviations)}, "
            f"术语数={len(self.term_mappings)}"
        )

    async def execute(
        self,
        run_input: RunInput,
        session: AgentSession,
        user_id: Optional[str] = None,
        debug_mode: Optional[bool] = None,
        **kwargs
    ) -> None:
        """执行查询标准化

        Args:
            run_input: 运行输入（会修改input_content）
            session: 会话信息
            user_id: 用户ID
            debug_mode: 调试模式
        """
        original_query = run_input.input_content
        normalized_query = original_query

        logger.debug(f"开始政策查询标准化: query={original_query[:50]}...")

        # 执行标准化操作
        normalization_steps = []

        for operation in self.operations:
            if operation == 'remove_redundant_words':
                normalized_query, step_info = self._remove_redundant_words(normalized_query)
                normalization_steps.append(step_info)

            elif operation == 'expand_abbreviations':
                normalized_query, step_info = self._expand_abbreviations(normalized_query)
                normalization_steps.append(step_info)

            elif operation == 'standardize_terms':
                normalized_query, step_info = self._standardize_terms(normalized_query)
                normalization_steps.append(step_info)

            elif operation == 'extract_keywords':
                keywords, step_info = await self._extract_keywords(normalized_query)
                step_info['keywords'] = keywords
                normalization_steps.append(step_info)

        # 提取实体信息
        entities = await self._extract_entities(normalized_query)

        # 更新run_input
        if normalized_query != original_query:
            run_input.input_content = normalized_query
            logger.info(
                f"查询已标准化: "
                f"原始={original_query[:30]}..., "
                f"标准化={normalized_query[:30]}..."
            )

        # 记录到context
        run_input.context['query_normalization'] = {
            'normalized': normalized_query != original_query,
            'original_query': original_query if self.preserve_original else None,
            'normalized_query': normalized_query,
            'normalization_steps': normalization_steps,
            'keywords': keywords if 'extract_keywords' in self.operations else [],
            'entities': entities
        }

        logger.debug(
            f"查询标准化完成: "
            f"执行步骤={len(normalization_steps)}, "
            f"关键词数={len(keywords) if 'extract_keywords' in self.operations else 0}, "
            f"实体数={len(entities)}"
        )

    def _remove_redundant_words(self, query: str) -> tuple:
        """去除冗余词汇

        Args:
            query: 查询文本

        Returns:
            (处理后的文本, 步骤信息)
        """
        cleaned_query = query
        removed_words = []

        for pattern in self.REDUNDANT_WORDS:
            match = re.search(pattern, cleaned_query)
            if match:
                removed_words.append(match.group(0).strip())
                cleaned_query = re.sub(pattern, '', cleaned_query)

        # 清理多余空格
        cleaned_query = re.sub(r'\s+', ' ', cleaned_query).strip()

        return cleaned_query, {
            'operation': 'remove_redundant_words',
            'changed': len(removed_words) > 0,
            'removed_count': len(removed_words),
            'removed_words': removed_words
        }

    def _expand_abbreviations(self, query: str) -> tuple:
        """展开缩写

        Args:
            query: 查询文本

        Returns:
            (处理后的文本, 步骤信息)
        """
        expanded_query = query
        expansions = []

        # 按长度从长到短排序，避免短缩写误替换
        sorted_abbr = sorted(
            self.abbreviations.items(),
            key=lambda x: len(x[0]),
            reverse=True
        )

        for abbr, full_form in sorted_abbr:
            # 使用词边界匹配，避免误替换
            pattern = r'\b' + re.escape(abbr) + r'\b'
            if re.search(pattern, expanded_query):
                expanded_query = re.sub(pattern, full_form, expanded_query)
                expansions.append({
                    'abbreviation': abbr,
                    'full_form': full_form
                })

        return expanded_query, {
            'operation': 'expand_abbreviations',
            'changed': len(expansions) > 0,
            'expansion_count': len(expansions),
            'expansions': expansions
        }

    def _standardize_terms(self, query: str) -> tuple:
        """标准化术语

        Args:
            query: 查询文本

        Returns:
            (处理后的文本, 步骤信息)
        """
        standardized_query = query
        standardizations = []

        for term, standard_term in self.term_mappings.items():
            # 词边界匹配
            pattern = r'\b' + re.escape(term) + r'\b'
            if re.search(pattern, standardized_query):
                standardized_query = re.sub(pattern, standard_term, standardized_query)
                standardizations.append({
                    'original_term': term,
                    'standard_term': standard_term
                })

        return standardized_query, {
            'operation': 'standardize_terms',
            'changed': len(standardizations) > 0,
            'standardization_count': len(standardizations),
            'standardizations': standardizations
        }

    async def _extract_keywords(self, query: str) -> tuple:
        """提取关键词

        Args:
            query: 查询文本

        Returns:
            (关键词列表, 步骤信息)
        """
        if self.use_nlp:
            # 使用NLP工具提取关键词
            keywords = await self._nlp_extract_keywords(query)
        else:
            # 使用简单的分词和停用词过滤
            keywords = self._simple_extract_keywords(query)

        return keywords, {
            'operation': 'extract_keywords',
            'method': 'nlp' if self.use_nlp else 'simple',
            'keyword_count': len(keywords)
        }

    def _simple_extract_keywords(self, query: str) -> List[str]:
        """简单的关键词提取

        Args:
            query: 查询文本

        Returns:
            关键词列表
        """
        # 简单分词（按空格和标点分割）
        words = re.findall(r'[\u4e00-\u9fa5a-zA-Z0-9]+', query)

        # 过滤停用词和短词
        keywords = [
            word for word in words
            if word not in self.STOP_WORDS and len(word) >= 2
        ]

        # 去重并保持顺序
        seen = set()
        unique_keywords = []
        for kw in keywords:
            if kw not in seen:
                seen.add(kw)
                unique_keywords.append(kw)

        return unique_keywords

    async def _nlp_extract_keywords(self, query: str) -> List[str]:
        """使用NLP工具提取关键词

        Args:
            query: 查询文本

        Returns:
            关键词列表
        """
        try:
            tool_result = await self.call_api_tool(
                self.nlp_tool,
                operation='extract_keywords',
                text=query
            )

            if tool_result.get('success'):
                keywords = tool_result.get('data', {}).get('keywords', [])
                logger.debug(f"NLP关键词提取成功: {len(keywords)}个关键词")
                return keywords
            else:
                logger.warning(f"NLP关键词提取失败，回退到简单提取")
                return self._simple_extract_keywords(query)

        except Exception as e:
            logger.error(f"NLP关键词提取异常: {e}, 回退到简单提取")
            return self._simple_extract_keywords(query)

    async def _extract_entities(self, query: str) -> List[Dict]:
        """提取命名实体

        Args:
            query: 查询文本

        Returns:
            实体列表
        """
        entities = []

        # 1. 提取政策编号实体
        policy_numbers = self._extract_policy_number_entities(query)
        entities.extend(policy_numbers)

        # 2. 提取机构实体
        agency_entities = self._extract_agency_entities(query)
        entities.extend(agency_entities)

        # 3. 提取日期实体
        date_entities = self._extract_date_entities(query)
        entities.extend(date_entities)

        # 4. 如果使用NLP工具，调用NER
        if self.use_nlp:
            nlp_entities = await self._nlp_extract_entities(query)
            entities.extend(nlp_entities)

        return entities

    def _extract_policy_number_entities(self, text: str) -> List[Dict]:
        """提取政策编号实体"""
        entities = []
        patterns = [
            r'国发〔(\d{4})〕(\d+)号',
            r'国办发〔(\d{4})〕(\d+)号',
            r'([^〔]+)〔(\d{4})〕(\d+)号'
        ]

        for pattern in patterns:
            for match in re.finditer(pattern, text):
                entities.append({
                    'type': 'policy_number',
                    'value': match.group(0),
                    'start': match.start(),
                    'end': match.end()
                })

        return entities

    def _extract_agency_entities(self, text: str) -> List[Dict]:
        """提取机构实体"""
        entities = []

        for agency, keywords in PolicyQueryNormalizationHook.ABBREVIATION_MAPPINGS.items():
            if isinstance(keywords, str):
                keywords = [keywords]
            for keyword in keywords:
                for match in re.finditer(re.escape(keyword), text):
                    entities.append({
                        'type': 'agency',
                        'value': keyword,
                        'standard_name': agency,
                        'start': match.start(),
                        'end': match.end()
                    })

        return entities

    def _extract_date_entities(self, text: str) -> List[Dict]:
        """提取日期实体"""
        entities = []
        date_patterns = [
            r'\d{4}年\d{1,2}月\d{1,2}日',
            r'\d{4}-\d{2}-\d{2}',
            r'\d{4}\.\d{2}\.\d{2}'
        ]

        for pattern in date_patterns:
            for match in re.finditer(pattern, text):
                entities.append({
                    'type': 'date',
                    'value': match.group(0),
                    'start': match.start(),
                    'end': match.end()
                })

        return entities

    async def _nlp_extract_entities(self, query: str) -> List[Dict]:
        """使用NLP工具提取实体"""
        try:
            tool_result = await self.call_api_tool(
                self.nlp_tool,
                operation='extract_entities',
                text=query
            )

            if tool_result.get('success'):
                entities = tool_result.get('data', {}).get('entities', [])
                logger.debug(f"NLP实体提取成功: {len(entities)}个实体")
                return entities
            else:
                return []

        except Exception as e:
            logger.error(f"NLP实体提取异常: {e}")
            return []
