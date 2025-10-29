"""
政策元数据提取Hook

从查询中提取政策文档的元数据信息（政策编号、发布日期、发文机关等）
支持正则匹配、NLP提取和LLM提取的混合策略
"""

import re
import logging
from typing import Optional, Dict, List, Any
from datetime import datetime
from ..base import PreHook, RunInput, AgentSession
from ..registry import register_pre_hook

logger = logging.getLogger(__name__)


@register_pre_hook(
    hook_id='policy_metadata_extractor',
    metadata={
        'name': '政策元数据提取',
        'description': '从查询中提取政策文档元数据（编号、日期、机关等）',
        'category': 'enhancement',
        'scene': 'policy_qa'
    }
)
class PolicyMetadataExtractorHook(PreHook):
    """政策元数据提取Hook

    提取政策相关的结构化信息：
    - 政策编号（如：国发〔2024〕15号）
    - 发布日期
    - 发文机关（国务院、各部委等）
    - 政策级别（国家/省/市/县）
    - 生效日期
    """

    # 政策编号正则模式
    POLICY_NUMBER_PATTERNS = [
        # 国发格式: 国发〔2024〕15号
        r'国发〔(\d{4})〕(\d+)号',
        # 国办发格式: 国办发〔2024〕15号
        r'国办发〔(\d{4})〕(\d+)号',
        # 部委文件: XX部发〔2024〕15号
        r'([^〔]+)〔(\d{4})〕(\d+)号',
        # 简写格式: 国发15号
        r'国发(\d+)号',
        # 法律法规: XX法〔2024〕15号
        r'([^〔]+)法〔(\d{4})〕(\d+)号',
    ]

    # 发文机关模式
    ISSUING_AGENCY_PATTERNS = {
        '国务院': ['国务院', '国发'],
        '国务院办公厅': ['国办发', '国务院办公厅'],
        '发改委': ['发改委', '国家发展改革委'],
        '财政部': ['财政部'],
        '教育部': ['教育部'],
        '工信部': ['工信部', '工业和信息化部'],
        '人社部': ['人社部', '人力资源社会保障部'],
    }

    # 政策级别关键词
    POLICY_LEVEL_KEYWORDS = {
        'national': ['国务院', '全国', '国发', '国办发', '中央'],
        'provincial': ['省', '省政府', '省办'],
        'municipal': ['市', '市政府', '市办'],
        'county': ['县', '区', '县政府']
    }

    def __init__(self, config: Dict):
        super().__init__(config)

        # 提取配置
        hook_config = config.get('config', {})
        self.required = hook_config.get('required', False)  # 是否强制要求提取到元数据
        self.metadata_fields = hook_config.get('metadata_fields', [
            'policy_number',
            'issue_date',
            'issuing_agency',
            'policy_level',
            'effective_date'
        ])
        self.extraction_method = hook_config.get('extraction_method', 'hybrid')  # regex/nlp/llm/hybrid
        self.use_external_tool = hook_config.get('use_external_tool', False)
        self.external_tool_name = hook_config.get('external_tool_name', 'policy_metadata_extraction_api')
        self.min_confidence = hook_config.get('min_confidence', 0.7)  # 最小置信度阈值

        logger.info(
            f"PolicyMetadataExtractorHook 初始化完成: "
            f"提取方法={self.extraction_method}, "
            f"强制要求={self.required}, "
            f"字段={self.metadata_fields}"
        )

    async def execute(
        self,
        run_input: RunInput,
        session: AgentSession,
        user_id: Optional[str] = None,
        debug_mode: Optional[bool] = None,
        **kwargs
    ) -> None:
        """执行元数据提取

        Args:
            run_input: 运行输入
            session: 会话信息
            user_id: 用户ID
            debug_mode: 调试模式
        """
        content = run_input.input_content

        logger.debug(f"开始政策元数据提取: query={content[:50]}...")

        # 执行元数据提取
        metadata_result = await self._extract_metadata(content)

        # 检查是否满足强制要求
        if self.required and not metadata_result['extracted']:
            logger.warning(f"未提取到政策元数据，但配置为非强制，继续执行")

        # 记录到context
        run_input.context['policy_metadata'] = metadata_result

        if metadata_result['extracted']:
            logger.info(
                f"政策元数据提取成功: "
                f"编号={metadata_result.get('data', {}).get('policy_number')}, "
                f"机关={metadata_result.get('data', {}).get('issuing_agency')}, "
                f"置信度={metadata_result.get('confidence', 0):.2f}"
            )
        else:
            logger.debug(f"未提取到政策元数据: {metadata_result.get('reason')}")

    async def _extract_metadata(self, query: str) -> Dict[str, Any]:
        """提取元数据（混合策略）

        Args:
            query: 查询文本

        Returns:
            提取结果字典
        """
        if self.extraction_method == 'regex':
            return self._regex_extract(query)
        elif self.extraction_method == 'nlp':
            return await self._nlp_extract(query)
        elif self.extraction_method == 'llm':
            return await self._llm_extract(query)
        elif self.extraction_method == 'hybrid':
            return await self._hybrid_extract(query)
        else:
            logger.warning(f"未知的提取方法: {self.extraction_method}，使用regex")
            return self._regex_extract(query)

    def _regex_extract(self, query: str) -> Dict[str, Any]:
        """使用正则表达式提取元数据

        Args:
            query: 查询文本

        Returns:
            提取结果
        """
        extracted_data = {}
        confidence_scores = []

        # 1. 提取政策编号
        policy_number, number_confidence = self._extract_policy_number(query)
        if policy_number:
            extracted_data['policy_number'] = policy_number
            confidence_scores.append(number_confidence)

        # 2. 提取发文机关
        issuing_agency, agency_confidence = self._extract_issuing_agency(query)
        if issuing_agency:
            extracted_data['issuing_agency'] = issuing_agency
            confidence_scores.append(agency_confidence)

        # 3. 提取政策级别
        policy_level, level_confidence = self._extract_policy_level(query)
        if policy_level:
            extracted_data['policy_level'] = policy_level
            confidence_scores.append(level_confidence)

        # 4. 提取日期信息
        dates = self._extract_dates(query)
        if dates:
            extracted_data.update(dates)
            confidence_scores.append(0.8)  # 日期提取置信度固定为0.8

        # 计算总体置信度
        overall_confidence = sum(confidence_scores) / len(confidence_scores) if confidence_scores else 0

        if extracted_data:
            return {
                'extracted': True,
                'method': 'regex',
                'data': extracted_data,
                'confidence': overall_confidence,
                'field_count': len(extracted_data)
            }
        else:
            return {
                'extracted': False,
                'method': 'regex',
                'reason': 'no_metadata_pattern_found'
            }

    def _extract_policy_number(self, text: str) -> tuple:
        """提取政策编号

        Args:
            text: 文本

        Returns:
            (编号, 置信度)
        """
        for pattern in self.POLICY_NUMBER_PATTERNS:
            match = re.search(pattern, text)
            if match:
                # 根据匹配组构建完整编号
                full_number = match.group(0)
                logger.debug(f"提取到政策编号: {full_number}")
                return full_number, 0.95  # 正则匹配的置信度较高

        return None, 0

    def _extract_issuing_agency(self, text: str) -> tuple:
        """提取发文机关

        Args:
            text: 文本

        Returns:
            (机关名称, 置信度)
        """
        for agency, keywords in self.ISSUING_AGENCY_PATTERNS.items():
            for keyword in keywords:
                if keyword in text:
                    logger.debug(f"提取到发文机关: {agency}")
                    return agency, 0.9
        return None, 0

    def _extract_policy_level(self, text: str) -> tuple:
        """提取政策级别

        Args:
            text: 文本

        Returns:
            (级别, 置信度)
        """
        for level, keywords in self.POLICY_LEVEL_KEYWORDS.items():
            for keyword in keywords:
                if keyword in text:
                    logger.debug(f"提取到政策级别: {level}")
                    return level, 0.85
        return None, 0

    def _extract_dates(self, text: str) -> Optional[Dict]:
        """提取日期信息

        Args:
            text: 文本

        Returns:
            日期字典或None
        """
        dates = {}

        # 日期格式: 2024年3月15日, 2024-03-15, 2024.03.15
        date_patterns = [
            (r'(\d{4})年(\d{1,2})月(\d{1,2})日', lambda m: f"{m.group(1)}-{m.group(2).zfill(2)}-{m.group(3).zfill(2)}"),
            (r'(\d{4})-(\d{2})-(\d{2})', lambda m: m.group(0)),
            (r'(\d{4})\.(\d{2})\.(\d{2})', lambda m: f"{m.group(1)}-{m.group(2)}-{m.group(3)}")
        ]

        # 发布日期关键词
        issue_keywords = ['发布', '印发', '颁布', '公布']
        # 生效日期关键词
        effective_keywords = ['生效', '施行', '执行']

        for pattern, formatter in date_patterns:
            matches = list(re.finditer(pattern, text))
            for match in matches:
                date_str = formatter(match)

                # 判断日期类型（基于上下文关键词）
                context = text[max(0, match.start() - 10):min(len(text), match.end() + 10)]

                if any(kw in context for kw in issue_keywords):
                    dates['issue_date'] = date_str
                    logger.debug(f"提取到发布日期: {date_str}")
                elif any(kw in context for kw in effective_keywords):
                    dates['effective_date'] = date_str
                    logger.debug(f"提取到生效日期: {date_str}")
                else:
                    # 默认作为发布日期
                    if 'issue_date' not in dates:
                        dates['issue_date'] = date_str

        return dates if dates else None

    async def _nlp_extract(self, query: str) -> Dict[str, Any]:
        """使用NLP工具提取元数据

        Args:
            query: 查询文本

        Returns:
            提取结果
        """
        # TODO: 集成NLP工具进行命名实体识别和信息提取
        # 目前先回退到正则提取
        logger.debug("NLP提取暂未实现，回退到正则提取")
        return self._regex_extract(query)

    async def _llm_extract(self, query: str) -> Dict[str, Any]:
        """使用LLM提取元数据

        Args:
            query: 查询文本

        Returns:
            提取结果
        """
        if not self.use_external_tool:
            logger.debug("未配置外部工具，回退到正则提取")
            return self._regex_extract(query)

        try:
            # 调用外部元数据提取API/工具
            tool_result = await self.call_api_tool(
                self.external_tool_name,
                query=query,
                fields=self.metadata_fields
            )

            if tool_result.get('success'):
                data = tool_result.get('data', {})
                logger.info(f"LLM元数据提取成功: fields={len(data.get('metadata', {}))}")

                return {
                    'extracted': data.get('extracted', False),
                    'method': 'llm',
                    'data': data.get('metadata', {}),
                    'confidence': data.get('confidence', 0),
                    'field_count': len(data.get('metadata', {}))
                }
            else:
                logger.warning(f"LLM提取失败: {tool_result.get('error')}, 回退到正则提取")
                return self._regex_extract(query)

        except Exception as e:
            logger.error(f"LLM提取异常: {e}, 回退到正则提取")
            return self._regex_extract(query)

    async def _hybrid_extract(self, query: str) -> Dict[str, Any]:
        """混合提取策略

        优先级: 正则 -> NLP -> LLM

        Args:
            query: 查询文本

        Returns:
            提取结果
        """
        # 1. 先尝试正则提取
        regex_result = self._regex_extract(query)

        # 如果正则提取置信度足够高，直接返回
        if regex_result.get('extracted') and regex_result.get('confidence', 0) >= self.min_confidence:
            logger.debug(f"正则提取成功，置信度={regex_result['confidence']:.2f}")
            return regex_result

        # 2. 尝试NLP提取（如果配置）
        # TODO: 实现NLP提取

        # 3. 尝试LLM提取（如果配置）
        if self.use_external_tool:
            llm_result = await self._llm_extract(query)
            if llm_result.get('extracted') and llm_result.get('confidence', 0) >= self.min_confidence:
                logger.debug(f"LLM提取成功，置信度={llm_result['confidence']:.2f}")
                return llm_result

        # 4. 如果所有方法都失败，返回最佳结果（正则结果）
        return regex_result if regex_result.get('extracted') else {
            'extracted': False,
            'method': 'hybrid',
            'reason': 'all_extraction_methods_failed'
        }
