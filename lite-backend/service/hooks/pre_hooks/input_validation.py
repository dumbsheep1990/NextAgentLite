"""
输入验证Hook

验证用户输入的格式、长度、内容等
"""

import re
from typing import Optional, List
import logging
from ..base import PreHook, RunInput, AgentSession, InputCheckError, CheckTrigger
from ..registry import register_pre_hook

logger = logging.getLogger(__name__)


@register_pre_hook(
    hook_id='input_validation',
    metadata={
        'name': '输入验证',
        'description': '验证输入的格式、长度和内容合规性',
        'category': 'validation'
    }
)
class InputValidationHook(PreHook):
    """输入验证Hook"""

    def __init__(self, config):
        super().__init__(config)
        self.max_length = config.get('config', {}).get('max_length', 4000)
        self.min_length = config.get('config', {}).get('min_length', 1)
        self.forbidden_patterns = config.get('config', {}).get('forbidden_patterns', [])
        self.allow_empty = config.get('config', {}).get('allow_empty', False)

    async def execute(
        self,
        run_input: RunInput,
        session: AgentSession,
        user_id: Optional[str] = None,
        debug_mode: Optional[bool] = None,
        **kwargs
    ) -> None:
        """验证输入

        Args:
            run_input: 运行输入
            session: 会话信息
            user_id: 用户ID
            debug_mode: 调试模式

        Raises:
            InputCheckError: 输入不符合要求时抛出
        """
        content = run_input.input_content

        # 空输入检查
        if not content or not content.strip():
            if not self.allow_empty:
                raise InputCheckError(
                    "输入不能为空",
                    check_trigger=CheckTrigger.INPUT_NOT_ALLOWED
                )
            return

        # 长度检查
        content_length = len(content)

        if content_length < self.min_length:
            raise InputCheckError(
                f"输入过短，最少需要{self.min_length}个字符",
                check_trigger=CheckTrigger.INPUT_NOT_ALLOWED
            )

        if content_length > self.max_length:
            raise InputCheckError(
                f"输入过长，最多{self.max_length}个字符",
                check_trigger=CheckTrigger.INPUT_NOT_ALLOWED
            )

        # 禁止内容检查
        for pattern in self.forbidden_patterns:
            if re.search(pattern, content, re.IGNORECASE):
                logger.warning(f"输入包含禁止内容: {pattern}")
                raise InputCheckError(
                    "输入包含禁止内容，请修改后重试",
                    check_trigger=CheckTrigger.SECURITY_VIOLATION
                )

        # 验证通过，记录日志
        logger.debug(f"输入验证通过: {content_length}字符")
