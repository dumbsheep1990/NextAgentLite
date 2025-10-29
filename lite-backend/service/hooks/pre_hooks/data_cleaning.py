"""
数据清洗Pre-hook

对输入数据进行清洗、标准化处理
支持调用外部清洗API或MCP工具
"""

import logging
from typing import Any, Dict, Optional

from service.hooks.base import PreHook, RunInput, AgentSession, InputCheckError
from service.hooks.registry import hook_registry

logger = logging.getLogger(__name__)


class DataCleaningPreHook(PreHook):
    """数据清洗Hook

    功能:
    - 文本规范化（去重空格、统一编码等）
    - 调用外部清洗API进行深度清洗
    - 格式标准化
    """

    DEFAULT_CONFIG = {
        'enabled': True,
        'tools': {
            # 可以配置使用的清洗工具
            'cleaning_tool': 'text_cleaning_api',
            'normalize': True,
            'remove_special_chars': False,
            'lowercase': False
        }
    }

    def __init__(self, config: Dict[str, Any]):
        """初始化数据清洗Hook

        Args:
            config: 配置字典
        """
        # 合并默认配置
        merged_config = {**self.DEFAULT_CONFIG, **config}
        super().__init__(merged_config)

        # 提取工具配置
        tools_config = self.config.get('config', {})
        self.cleaning_tool = tools_config.get('cleaning_tool', 'text_cleaning_api')
        self.normalize = tools_config.get('normalize', True)
        self.remove_special_chars = tools_config.get('remove_special_chars', False)
        self.lowercase = tools_config.get('lowercase', False)

    async def execute(
        self,
        run_input: RunInput,
        session: AgentSession,
        user_id: Optional[str] = None,
        debug_mode: Optional[bool] = None,
        **kwargs
    ) -> None:
        """执行数据清洗

        Args:
            run_input: 运行输入
            session: 会话信息
            user_id: 用户ID
            debug_mode: 调试模式
            **kwargs: 其他参数
        """
        original_content = run_input.input_content
        logger.info(f"开始数据清洗: {self.hook_id}")

        try:
            # 1. 本地基础清洗
            cleaned_content = self._local_cleaning(original_content)

            # 2. 调用外部清洗工具（如果配置）
            if self.cleaning_tool:
                tool_result = await self.call_api_tool(
                    self.cleaning_tool,
                    text=cleaned_content,
                    options={
                        'normalize': self.normalize,
                        'remove_special_chars': self.remove_special_chars,
                        'lowercase': self.lowercase
                    }
                )

                if tool_result.get('success'):
                    cleaned_content = tool_result.get('data', {}).get('result', cleaned_content)
                    logger.info(f"外部工具清洗成功: {self.cleaning_tool}")
                else:
                    logger.warning(
                        f"外部工具清洗失败: {self.cleaning_tool}, "
                        f"错误: {tool_result.get('error', '未知错误')}, "
                        f"继续使用本地清洗结果"
                    )

            # 3. 更新输入内容
            run_input.input_content = cleaned_content

            # 4. 记录清洗结果到context
            run_input.context['data_cleaning'] = {
                'original_length': len(original_content),
                'cleaned_length': len(cleaned_content),
                'cleaned': True,
                'tool': self.cleaning_tool if tool_result.get('success') else 'local'
            }

            logger.info(
                f"数据清洗完成: {len(original_content)} → {len(cleaned_content)} 字符, "
                f"清洗工具: {self.cleaning_tool}"
            )

        except Exception as e:
            logger.error(f"数据清洗失败: {e}")
            # 不抛出异常，继续使用原始内容
            run_input.context['data_cleaning'] = {
                'error': str(e),
                'cleaned': False
            }

    def _local_cleaning(self, text: str) -> str:
        """本地基础清洗

        Args:
            text: 原始文本

        Returns:
            清洗后的文本
        """
        # 去除首尾空白
        text = text.strip()

        # 规范化空白符
        if self.normalize:
            # 将多个空白符替换为单个空格
            import re
            text = re.sub(r'\s+', ' ', text)

        # 去除特殊字符
        if self.remove_special_chars:
            import re
            # 仅保留中英文、数字和基础标点
            text = re.sub(r'[^\u4e00-\u9fa5a-zA-Z0-9\.\,\?\!\:\;\'\"\-\s]', '', text)

        # 转小写
        if self.lowercase:
            text = text.lower()

        return text


# 注册Hook到registry
hook_registry.register_pre_hook(
    hook_id='data_cleaning',
    hook_class=DataCleaningPreHook,
    metadata={
        'name': '数据清洗',
        'description': '对输入数据进行清洗、规范化和标准化处理',
        'category': 'preprocessing'
    }
)
