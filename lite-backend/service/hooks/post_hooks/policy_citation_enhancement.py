"""
政策引用增强Post-hook

增强输出中政策引用的完整性和准确性：
- 自动补充政策编号完整信息
- 添加官方文档链接
- 验证引用的准确性
- 格式化引用显示
"""

import re
import logging
from typing import Optional, Dict, List, Any
from ..base import PostHook, RunOutput
from ..registry import hook_registry

logger = logging.getLogger(__name__)


class PolicyCitationEnhancementHook(PostHook):
    """政策引用增强Hook

    功能:
    - 检测输出中的政策引用
    - 补充完整的引用信息（编号、日期、机关等）
    - 添加官方链接
    - 验证引用的准确性
    - 统一引用格式
    """

    # 政策编号模式
    POLICY_NUMBER_PATTERNS = [
        r'国发〔(\d{4})〕(\d+)号',
        r'国办发〔(\d{4})〕(\d+)号',
        r'([^〔]+)〔(\d{4})〕(\d+)号',
    ]

    # 政策信息模拟数据库（实际应从数据库或API获取）
    # 这里仅作示例，实际使用时应替换为真实数据源
    POLICY_DATABASE = {
        '国发〔2024〕15号': {
            'full_name': '国务院关于加快发展新质生产力的指导意见',
            'issuing_agency': '国务院',
            'issue_date': '2024-03-15',
            'effective_date': '2024-04-01',
            'official_url': 'http://www.gov.cn/zhengce/2024-03/15/content_6940001.htm',
            'category': '经济政策'
        },
        # 添加更多政策...
    }

    def __init__(self, config: Dict[str, Any]):
        super().__init__(config)

        # 提取配置
        hook_config = config.get('config', {})
        self.auto_enhance = hook_config.get('auto_enhance', True)
        self.citation_format = hook_config.get('citation_format', 'standard')  # standard/detailed/minimal
        self.add_links = hook_config.get('add_links', True)
        self.link_source = hook_config.get('link_source', 'official_policy_database')
        self.validate_citations = hook_config.get('validate_citations', True)
        self.use_external_db = hook_config.get('use_external_db', False)
        self.external_db_tool = hook_config.get('external_db_tool', 'policy_database_api')

        logger.info(
            f"PolicyCitationEnhancementHook 初始化完成: "
            f"自动增强={self.auto_enhance}, "
            f"引用格式={self.citation_format}, "
            f"添加链接={self.add_links}"
        )

    async def execute(self, run_output: RunOutput, **kwargs) -> None:
        """执行引用增强

        Args:
            run_output: 运行输出（会修改content）
            **kwargs: 其他参数
        """
        original_content = run_output.content

        logger.debug(f"开始政策引用增强: content长度={len(original_content)}")

        if not self.auto_enhance:
            logger.debug("自动增强已禁用，跳过")
            return

        # 1. 检测输出中的政策引用
        citations_found = self._detect_citations(original_content)

        if not citations_found:
            logger.debug("未检测到政策引用")
            run_output.metadata['citation_enhancement'] = {
                'enhanced': False,
                'reason': 'no_citations_found'
            }
            return

        logger.info(f"检测到{len(citations_found)}个政策引用")

        # 2. 获取政策详细信息
        citation_details = await self._get_citation_details(citations_found)

        # 3. 增强输出内容
        enhanced_content = self._enhance_content(
            original_content,
            citations_found,
            citation_details
        )

        # 4. 验证引用（如果配置）
        validation_results = []
        if self.validate_citations:
            validation_results = self._validate_citations(citations_found, citation_details)

        # 5. 更新输出
        run_output.content = enhanced_content

        # 6. 记录元数据
        run_output.metadata['citation_enhancement'] = {
            'enhanced': True,
            'citations_found': len(citations_found),
            'citations_enhanced': len([c for c in citation_details.values() if c]),
            'links_added': sum(1 for c in citation_details.values() if c and c.get('official_url')),
            'validation_passed': all(v['valid'] for v in validation_results) if validation_results else None,
            'validation_results': validation_results if self.validate_citations else None
        }

        logger.info(
            f"政策引用增强完成: "
            f"发现={len(citations_found)}, "
            f"增强={len([c for c in citation_details.values() if c])}, "
            f"链接={sum(1 for c in citation_details.values() if c and c.get('official_url'))}"
        )

    def _detect_citations(self, content: str) -> List[Dict]:
        """检测政策引用

        Args:
            content: 输出内容

        Returns:
            检测到的引用列表
        """
        citations = []

        for pattern in self.POLICY_NUMBER_PATTERNS:
            for match in re.finditer(pattern, content):
                policy_number = match.group(0)
                citations.append({
                    'policy_number': policy_number,
                    'start': match.start(),
                    'end': match.end(),
                    'context': content[max(0, match.start() - 20):min(len(content), match.end() + 20)]
                })

        # 去重（同一政策编号可能出现多次）
        unique_citations = {}
        for citation in citations:
            number = citation['policy_number']
            if number not in unique_citations:
                unique_citations[number] = citation

        return list(unique_citations.values())

    async def _get_citation_details(self, citations: List[Dict]) -> Dict[str, Optional[Dict]]:
        """获取政策详细信息

        Args:
            citations: 检测到的引用列表

        Returns:
            政策编号 -> 详细信息的映射
        """
        details = {}

        for citation in citations:
            policy_number = citation['policy_number']

            # 首先从本地数据库查找
            policy_info = self.POLICY_DATABASE.get(policy_number)

            # 如果本地没有且配置了外部数据库，调用外部API
            if not policy_info and self.use_external_db:
                policy_info = await self._query_external_db(policy_number)

            details[policy_number] = policy_info

            if policy_info:
                logger.debug(f"获取到政策信息: {policy_number} - {policy_info.get('full_name', 'N/A')}")
            else:
                logger.warning(f"未找到政策信息: {policy_number}")

        return details

    async def _query_external_db(self, policy_number: str) -> Optional[Dict]:
        """查询外部政策数据库

        Args:
            policy_number: 政策编号

        Returns:
            政策详细信息或None
        """
        try:
            tool_result = await self.call_api_tool(
                self.external_db_tool,
                policy_number=policy_number
            )

            if tool_result.get('success'):
                policy_data = tool_result.get('data', {})
                logger.info(f"外部数据库查询成功: {policy_number}")
                return policy_data
            else:
                logger.warning(f"外部数据库查询失败: {policy_number}")
                return None

        except Exception as e:
            logger.error(f"外部数据库查询异常: {e}")
            return None

    def _enhance_content(
        self,
        content: str,
        citations: List[Dict],
        citation_details: Dict[str, Optional[Dict]]
    ) -> str:
        """增强内容中的引用

        Args:
            content: 原始内容
            citations: 检测到的引用
            citation_details: 引用详细信息

        Returns:
            增强后的内容
        """
        enhanced_content = content

        # 按位置倒序处理，避免位置偏移
        sorted_citations = sorted(citations, key=lambda x: x['start'], reverse=True)

        for citation in sorted_citations:
            policy_number = citation['policy_number']
            details = citation_details.get(policy_number)

            if not details:
                continue

            # 根据格式类型构建增强文本
            enhanced_text = self._build_enhanced_citation(policy_number, details)

            # 替换原始引用
            enhanced_content = (
                enhanced_content[:citation['start']] +
                enhanced_text +
                enhanced_content[citation['end']:]
            )

        return enhanced_content

    def _build_enhanced_citation(self, policy_number: str, details: Dict) -> str:
        """构建增强的引用文本

        Args:
            policy_number: 政策编号
            details: 政策详细信息

        Returns:
            增强的引用文本
        """
        if self.citation_format == 'minimal':
            # 最小格式：只有编号
            return policy_number

        elif self.citation_format == 'standard':
            # 标准格式：编号 + 名称
            full_name = details.get('full_name', '')
            citation_text = f"{policy_number}《{full_name}》" if full_name else policy_number

            # 添加链接（如果配置）
            if self.add_links and details.get('official_url'):
                citation_text = f"[{citation_text}]({details['official_url']})"

            return citation_text

        elif self.citation_format == 'detailed':
            # 详细格式：编号 + 名称 + 机关 + 日期
            full_name = details.get('full_name', '')
            agency = details.get('issuing_agency', '')
            issue_date = details.get('issue_date', '')

            parts = [policy_number]
            if full_name:
                parts.append(f"《{full_name}》")
            if agency:
                parts.append(f"（{agency}发布）")
            if issue_date:
                parts.append(f"（发布日期：{issue_date}）")

            citation_text = ''.join(parts)

            # 添加链接
            if self.add_links and details.get('official_url'):
                citation_text = f"[{citation_text}]({details['official_url']})"

            return citation_text

        else:
            # 默认使用标准格式
            return self._build_enhanced_citation(policy_number, details)

    def _validate_citations(
        self,
        citations: List[Dict],
        citation_details: Dict[str, Optional[Dict]]
    ) -> List[Dict]:
        """验证引用的准确性

        Args:
            citations: 检测到的引用
            citation_details: 引用详细信息

        Returns:
            验证结果列表
        """
        validation_results = []

        for citation in citations:
            policy_number = citation['policy_number']
            details = citation_details.get(policy_number)

            if not details:
                validation_results.append({
                    'policy_number': policy_number,
                    'valid': False,
                    'reason': 'policy_not_found_in_database'
                })
            else:
                # 简单验证：检查是否有基本信息
                has_basic_info = (
                    details.get('full_name') and
                    details.get('issuing_agency')
                )

                validation_results.append({
                    'policy_number': policy_number,
                    'valid': has_basic_info,
                    'reason': 'valid' if has_basic_info else 'incomplete_policy_info',
                    'details': {
                        'has_full_name': bool(details.get('full_name')),
                        'has_agency': bool(details.get('issuing_agency')),
                        'has_date': bool(details.get('issue_date')),
                        'has_url': bool(details.get('official_url'))
                    }
                })

        return validation_results


# 注册Hook
hook_registry.register_post_hook(
    hook_id='policy_citation_enhancement',
    hook_class=PolicyCitationEnhancementHook,
    metadata={
        'name': '政策引用增强',
        'description': '增强政策引用的完整性，补充政策详细信息和官方链接',
        'category': 'enhancement',
        'scene': 'policy_qa'
    }
)
