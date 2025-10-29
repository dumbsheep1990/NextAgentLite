"""
敏感信息脱敏Post-hook

对输出中的个人敏感信息（PII）进行脱敏处理
支持调用外部脱敏API或MCP工具
"""

import logging
import re
from typing import Any, Dict, Optional

from service.hooks.base import PostHook, RunOutput, OutputCheckError
from service.hooks.registry import hook_registry

logger = logging.getLogger(__name__)


class DesensitizationPostHook(PostHook):
    """敏感信息脱敏Hook

    功能:
    - 检测和脱敏常见PII信息（邮箱、电话、身份证等）
    - 调用外部脱敏工具进行专业处理
    - 记录脱敏操作用于审计
    """

    DEFAULT_CONFIG = {
        'enabled': True,
        'tools': {
            # 可以配置使用的脱敏工具
            'desensitization_tool': 'pii_masking_api',
            'mask_email': True,
            'mask_phone': True,
            'mask_id': True,
            'mask_bank_card': True,
            'mask_ip': True
        }
    }

    def __init__(self, config: Dict[str, Any]):
        """初始化敏感信息脱敏Hook

        Args:
            config: 配置字典
        """
        # 合并默认配置
        merged_config = {**self.DEFAULT_CONFIG, **config}
        super().__init__(merged_config)

        # 提取工具配置
        tools_config = self.config.get('config', {})
        self.desensitization_tool = tools_config.get('desensitization_tool', 'pii_masking_api')
        self.mask_email = tools_config.get('mask_email', True)
        self.mask_phone = tools_config.get('mask_phone', True)
        self.mask_id = tools_config.get('mask_id', True)
        self.mask_bank_card = tools_config.get('mask_bank_card', True)
        self.mask_ip = tools_config.get('mask_ip', True)

    async def execute(self, run_output: RunOutput, **kwargs) -> None:
        """执行敏感信息脱敏

        Args:
            run_output: 运行输出
            **kwargs: 其他参数
        """
        original_content = run_output.content
        logger.info(f"开始敏感信息脱敏: {self.hook_id}")

        try:
            # 1. 本地基础脱敏（快速检测）
            desensitized_content = self._local_desensitization(original_content)
            detected_pii = self._detect_pii(original_content)

            # 2. 调用外部脱敏工具（如果配置）
            if self.desensitization_tool and detected_pii:
                tool_result = await self.call_api_tool(
                    self.desensitization_tool,
                    content=desensitized_content,
                    mask_types={
                        'email': self.mask_email,
                        'phone': self.mask_phone,
                        'id': self.mask_id,
                        'bank_card': self.mask_bank_card,
                        'ip': self.mask_ip
                    }
                )

                if tool_result.get('success'):
                    desensitized_content = tool_result.get('data', {}).get('result', desensitized_content)
                    logger.info(f"外部工具脱敏成功: {self.desensitization_tool}")
                else:
                    logger.warning(
                        f"外部工具脱敏失败: {self.desensitization_tool}, "
                        f"错误: {tool_result.get('error', '未知错误')}, "
                        f"继续使用本地脱敏结果"
                    )
            elif detected_pii:
                logger.info(f"检测到PII信息，已进行本地脱敏")

            # 3. 更新输出内容
            run_output.content = desensitized_content

            # 4. 记录脱敏结果到元数据
            run_output.metadata['desensitization'] = {
                'original_length': len(original_content),
                'desensitized_length': len(desensitized_content),
                'desensitized': len(detected_pii) > 0,
                'pii_types': list(detected_pii.keys()),
                'tool': self.desensitization_tool if detected_pii else 'none'
            }

            logger.info(
                f"敏感信息脱敏完成: 检测到PII类型 {list(detected_pii.keys())}, "
                f"字符变化: {len(original_content)} → {len(desensitized_content)}"
            )

        except Exception as e:
            logger.error(f"敏感信息脱敏失败: {e}")
            # 记录错误但不抛出异常，确保输出可用
            run_output.metadata['desensitization'] = {
                'error': str(e),
                'desensitized': False
            }

    def _local_desensitization(self, content: str) -> str:
        """本地基础脱敏

        使用正则表达式检测和脱敏常见PII模式

        Args:
            content: 原始内容

        Returns:
            脱敏后的内容
        """
        desensitized = content

        # 脱敏邮箱
        if self.mask_email:
            desensitized = re.sub(
                r'[\w\.-]+@[\w\.-]+\.\w+',
                '[EMAIL_MASKED]',
                desensitized
            )

        # 脱敏手机号
        if self.mask_phone:
            # 中国手机号
            desensitized = re.sub(
                r'1[3-9]\d{9}',
                '[PHONE_MASKED]',
                desensitized
            )

        # 脱敏身份证号
        if self.mask_id:
            # 18位身份证
            desensitized = re.sub(
                r'\d{6}(18|19|20)\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])\d{3}[\dX]',
                '[ID_MASKED]',
                desensitized
            )

        # 脱敏银行卡号
        if self.mask_bank_card:
            # 通用银行卡号格式
            desensitized = re.sub(
                r'\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}',
                '[BANK_CARD_MASKED]',
                desensitized
            )

        # 脱敏IP地址
        if self.mask_ip:
            desensitized = re.sub(
                r'\b(?:\d{1,3}\.){3}\d{1,3}\b',
                '[IP_MASKED]',
                desensitized
            )

        return desensitized

    def _detect_pii(self, content: str) -> Dict[str, int]:
        """检测PII信息

        Args:
            content: 内容

        Returns:
            检测到的PII类型及数量
        """
        detected = {}

        # 检测邮箱
        if self.mask_email:
            email_matches = re.findall(r'[\w\.-]+@[\w\.-]+\.\w+', content)
            if email_matches:
                detected['email'] = len(email_matches)

        # 检测手机号
        if self.mask_phone:
            phone_matches = re.findall(r'1[3-9]\d{9}', content)
            if phone_matches:
                detected['phone'] = len(phone_matches)

        # 检测身份证号
        if self.mask_id:
            id_matches = re.findall(
                r'\d{6}(18|19|20)\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])\d{3}[\dX]',
                content
            )
            if id_matches:
                detected['id'] = len(id_matches)

        # 检测银行卡号
        if self.mask_bank_card:
            card_matches = re.findall(
                r'\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}',
                content
            )
            if card_matches:
                detected['bank_card'] = len(card_matches)

        # 检测IP地址
        if self.mask_ip:
            ip_matches = re.findall(r'\b(?:\d{1,3}\.){3}\d{1,3}\b', content)
            if ip_matches:
                detected['ip'] = len(ip_matches)

        return detected


# 注册Hook到registry
hook_registry.register_post_hook(
    hook_id='desensitization',
    hook_class=DesensitizationPostHook,
    metadata={
        'name': '敏感信息脱敏',
        'description': '对输出内容中的个人敏感信息（PII）进行脱敏处理',
        'category': 'security'
    }
)
