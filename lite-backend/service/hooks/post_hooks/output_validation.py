"""
输出验证Hook

验证Agent输出的格式、长度和内容质量
"""

import re
from typing import Optional, List
import logging
from ..base import PostHook, RunOutput, OutputCheckError, CheckTrigger
from ..registry import register_post_hook

logger = logging.getLogger(__name__)


@register_post_hook(
    hook_id='output_validation',
    metadata={
        'name': '输出验证',
        'description': '验证输出的格式、长度和内容质量',
        'category': 'validation'
    }
)
class OutputValidationHook(PostHook):
    """输出验证Hook"""

    def __init__(self, config):
        super().__init__(config)
        cfg = config.get('config', {})
        self.min_length = cfg.get('min_length', 10)
        self.max_length = cfg.get('max_length', 5000)
        self.required_patterns = cfg.get('required_patterns', [])
        self.forbidden_patterns = cfg.get('forbidden_patterns', [])

    async def execute(
        self,
        run_output: RunOutput,
        **kwargs
    ) -> None:
        """验证输出

        Args:
            run_output: 运行输出

        Raises:
            OutputCheckError: 输出不符合要求时抛出
        """
        content = run_output.content

        # 空输出检查
        if not content or not content.strip():
            raise OutputCheckError(
                "输出内容为空",
                check_trigger=CheckTrigger.OUTPUT_NOT_ALLOWED
            )

        # 长度检查
        content_length = len(content)

        if content_length < self.min_length:
            raise OutputCheckError(
                f"输出内容过短（最少{self.min_length}字符）",
                check_trigger=CheckTrigger.OUTPUT_NOT_ALLOWED
            )

        if content_length > self.max_length:
            raise OutputCheckError(
                f"输出内容过长（最多{self.max_length}字符）",
                check_trigger=CheckTrigger.OUTPUT_NOT_ALLOWED
            )

        # 必需模式检查
        for pattern in self.required_patterns:
            if not re.search(pattern, content):
                logger.warning(f"输出缺少必需内容: {pattern}")
                raise OutputCheckError(
                    f"输出缺少必需内容",
                    check_trigger=CheckTrigger.VALIDATION_FAILED
                )

        # 禁止模式检查
        for pattern in self.forbidden_patterns:
            if re.search(pattern, content, re.IGNORECASE):
                logger.warning(f"输出包含禁止内容: {pattern}")
                raise OutputCheckError(
                    "输出包含不当内容",
                    check_trigger=CheckTrigger.SECURITY_VIOLATION
                )

        # 验证通过
        logger.debug(f"输出验证通过: {content_length}字符")
