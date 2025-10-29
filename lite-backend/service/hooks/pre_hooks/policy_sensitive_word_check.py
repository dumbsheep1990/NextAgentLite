"""
政策敏感词检测Hook

专用于政策问答场景，检测输入查询中的敏感词汇
支持分级检测和多种处理策略
"""

import re
import logging
from typing import Optional, Dict, List, Set
from ..base import PreHook, RunInput, AgentSession, InputCheckError, CheckTrigger
from ..registry import register_pre_hook

logger = logging.getLogger(__name__)


@register_pre_hook(
    hook_id='policy_sensitive_word_check',
    metadata={
        'name': '政策敏感词检测',
        'description': '检测政策查询中的敏感词汇，支持分级检测和多种处理策略',
        'category': 'security',
        'scene': 'policy_qa'
    }
)
class PolicySensitiveWordCheckHook(PreHook):
    """政策敏感词检测Hook

    针对政策问答场景的敏感词检测，包括：
    - 政治敏感词
    - 法律敏感词
    - 民族宗教敏感词
    - 其他政策相关敏感内容
    """

    # 默认敏感词库（示例）
    DEFAULT_SENSITIVE_WORDS = {
        'political': [
            # 政治敏感示例（实际使用时应从配置或外部API加载）
            r'非法组织',
            r'政治敏感词示例',  # 实际使用时替换为真实敏感词
        ],
        'legal': [
            # 法律敏感示例
            r'违法活动',
            r'法律敏感词示例',
            r'暴力',  # 测试用
            r'色情',  # 测试用
        ],
        'ethnic': [
            # 民族宗教敏感示例
            r'民族分裂',
            r'宗教极端',
        ]
    }

    def __init__(self, config: Dict):
        super().__init__(config)

        # 提取配置
        hook_config = config.get('config', {})
        self.check_level = hook_config.get('check_level', 'moderate')  # strict/moderate/loose
        self.block_on_detection = hook_config.get('block_on_detection', True)
        self.log_violations = hook_config.get('log_violations', True)
        self.categories = hook_config.get('categories', ['political', 'legal', 'ethnic'])
        self.sensitive_word_source = hook_config.get('sensitive_word_source', 'local')
        self.use_external_api = hook_config.get('use_external_api', False)

        # 优先从tool_bindings提取API工具ID
        self.external_api_name = None
        tool_bindings = hook_config.get('tool_bindings', [])
        if tool_bindings and isinstance(tool_bindings, list):
            # 查找第一个API工具
            for binding in tool_bindings:
                tool_id = binding.get('tool_id', '')
                if tool_id.startswith('api:'):
                    # 提取完整的tool_id: api:config_name:tool_name
                    self.external_api_name = tool_id
                    self.use_external_api = True  # 有工具绑定就启用外部API
                    logger.info(f"从tool_bindings提取API工具: {tool_id}")
                    break

        # 如果没有从tool_bindings找到，使用配置的external_api_name
        if not self.external_api_name:
            self.external_api_name = hook_config.get('external_api_name', 'sensitive_word_detection_api')

        # 自定义敏感词（从配置加载）
        self.custom_sensitive_words = hook_config.get('custom_sensitive_words', {})

        # 合并敏感词库
        self.sensitive_words = self._build_sensitive_word_dict()

        logger.info(
            f"PolicySensitiveWordCheckHook 初始化完成: "
            f"检测级别={self.check_level}, "
            f"分类={self.categories}, "
            f"阻断模式={self.block_on_detection}, "
            f"使用外部API={self.use_external_api}, "
            f"API工具={self.external_api_name}"
        )

    def _build_sensitive_word_dict(self) -> Dict[str, Set[str]]:
        """构建敏感词词典"""
        word_dict = {}

        for category in self.categories:
            # 从默认词库加载
            default_words = self.DEFAULT_SENSITIVE_WORDS.get(category, [])

            # 从自定义配置加载
            custom_words = self.custom_sensitive_words.get(category, [])

            # 合并
            word_dict[category] = set(default_words + custom_words)

        return word_dict

    async def execute(
        self,
        run_input: RunInput,
        session: AgentSession,
        user_id: Optional[str] = None,
        debug_mode: Optional[bool] = None,
        **kwargs
    ) -> None:
        """执行敏感词检测

        Args:
            run_input: 运行输入
            session: 会话信息
            user_id: 用户ID
            debug_mode: 调试模式

        Raises:
            InputCheckError: 检测到敏感词且配置为阻断时抛出
        """
        content = run_input.input_content

        logger.info(f"开始政策敏感词检测: query='{content}', 长度={len(content)}")

        # 1. 本地敏感词检测
        local_result = self._local_sensitive_word_check(content)
        logger.info(f"本地检测结果: {local_result}")

        # 2. 外部API检测（如果配置了就始终调用）
        api_result = None
        if self.use_external_api:
            logger.info(f"调用外部API进行检测: {self.external_api_name}")
            try:
                api_result = await self._external_api_check(content)
                logger.info(f"外部API检测结果: {api_result}")
            except Exception as e:
                logger.error(f"外部敏感词API调用失败: {e}", exc_info=True)

        # 3. 合并检测结果
        final_result = self._merge_detection_results(local_result, api_result)
        logger.info(f"最终检测结果: {final_result}")

        # 4. 记录到context
        run_input.context['policy_sensitive_word_check'] = {
            'checked': True,
            'detected': final_result['detected'],
            'categories': final_result.get('categories', []),
            'check_level': self.check_level,
            'action': 'blocked' if final_result['detected'] and self.block_on_detection else 'passed'
        }

        # 5. 记录违规日志
        if final_result['detected'] and self.log_violations:
            self._log_violation(content, final_result, user_id, session)

        # 6. 根据配置决定是否阻断
        if final_result['detected'] and self.block_on_detection:
            error_message = self._build_error_message(final_result)
            logger.warning(
                f"检测到敏感词，阻断请求: "
                f"user_id={user_id}, session_id={session.id}, "
                f"categories={final_result.get('categories')}"
            )
            raise InputCheckError(
                error_message,
                check_trigger=CheckTrigger.SECURITY_VIOLATION
            )

        # 检测到但不阻断的情况
        if final_result['detected']:
            logger.warning(
                f"检测到敏感词但未阻断: "
                f"user_id={user_id}, categories={final_result.get('categories')}"
            )
        else:
            logger.debug("敏感词检测通过")

    def _local_sensitive_word_check(self, content: str) -> Dict:
        """本地敏感词检测

        Args:
            content: 待检测内容

        Returns:
            检测结果字典
        """
        detected_categories = []
        detected_words = []

        for category, word_patterns in self.sensitive_words.items():
            for pattern in word_patterns:
                try:
                    if re.search(pattern, content, re.IGNORECASE):
                        detected_categories.append(category)
                        detected_words.append(pattern)
                        logger.debug(f"本地检测到敏感词: category={category}, pattern={pattern}")
                except re.error as e:
                    logger.error(f"正则表达式错误: pattern={pattern}, error={e}")

        return {
            'detected': len(detected_categories) > 0,
            'method': 'local',
            'categories': list(set(detected_categories)),
            'word_count': len(detected_words),
            'words': detected_words if logger.isEnabledFor(logging.DEBUG) else []  # 仅调试模式记录
        }

    async def _external_api_check(self, content: str) -> Optional[Dict]:
        """调用外部API进行敏感词检测

        Args:
            content: 待检测内容

        Returns:
            API检测结果或None
        """
        try:
            # 调用API工具，注意参数名称要匹配API定义
            api_result = await self.call_api_tool(
                self.external_api_name,
                text=content,  # API期望的参数名是text，不是content
                categories=self.categories,
                return_details=True
            )

            logger.info(f"API工具调用原始结果: {api_result}")

            if api_result.get('success'):
                # API返回的数据结构: {success, is_valid, message, matched_count, matches, checked_at}
                is_valid = api_result.get('is_valid', True)
                matched_count = api_result.get('matched_count', 0)
                detected = not is_valid  # is_valid=True表示无敏感词，所以detected要取反

                logger.info(f"外部API检测完成: is_valid={is_valid}, detected={detected}, matched_count={matched_count}")

                # 从matches中提取检测到的类别
                detected_categories = []
                if api_result.get('matches'):
                    detected_categories = list(set(
                        match.get('category', '')
                        for match in api_result['matches']
                        if match.get('category')
                    ))

                return {
                    'detected': detected,
                    'method': 'api',
                    'categories': detected_categories,
                    'matched_count': matched_count,
                    'api_name': self.external_api_name
                }
            else:
                logger.warning(f"外部API检测失败: {api_result.get('error')}")
                return None
        except Exception as e:
            logger.error(f"调用外部API异常: {e}")
            return None

    def _merge_detection_results(
        self,
        local_result: Dict,
        api_result: Optional[Dict]
    ) -> Dict:
        """合并本地和API检测结果

        Args:
            local_result: 本地检测结果
            api_result: API检测结果

        Returns:
            合并后的检测结果
        """
        if not api_result:
            return local_result

        # 任一检测到敏感词即视为检测到
        detected = local_result['detected'] or api_result['detected']

        # 合并分类
        categories = list(set(
            local_result.get('categories', []) +
            api_result.get('categories', [])
        ))

        return {
            'detected': detected,
            'methods': ['local', 'api'],
            'categories': categories,
            'local_result': local_result,
            'api_result': api_result
        }

    def _build_error_message(self, result: Dict) -> str:
        """构建错误消息

        Args:
            result: 检测结果

        Returns:
            错误消息
        """
        categories = result.get('categories', [])

        # 根据检测级别和分类构建不同的错误消息
        if self.check_level == 'strict':
            return "输入包含不允许的敏感内容，请修改后重试"
        elif 'political' in categories:
            return "输入包含政治敏感内容，请修改后重试"
        elif 'legal' in categories:
            return "输入包含法律相关敏感内容，请谨慎表述"
        else:
            return "输入包含敏感内容，请修改后重试"

    def _log_violation(
        self,
        content: str,
        result: Dict,
        user_id: Optional[str],
        session: AgentSession
    ) -> None:
        """记录违规日志

        Args:
            content: 原始内容
            result: 检测结果
            user_id: 用户ID
            session: 会话信息
        """
        # 脱敏后的内容（只记录长度和前10个字符）
        safe_content = content[:10] + "..." if len(content) > 10 else content

        logger.warning(
            f"敏感词检测违规记录: "
            f"user_id={user_id}, "
            f"session_id={session.id}, "
            f"content_preview={safe_content}, "
            f"content_length={len(content)}, "
            f"categories={result.get('categories')}, "
            f"detection_method={result.get('method', 'unknown')}"
        )

        # 这里可以扩展为写入审计数据库或发送告警
        # TODO: 实现审计日志持久化
