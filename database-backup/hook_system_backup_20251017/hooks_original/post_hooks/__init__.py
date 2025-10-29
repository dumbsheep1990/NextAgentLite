"""
Post-hooks

在Agent生成响应之后执行的hooks
注意：不支持流式场景
"""

from .output_validation import OutputValidationHook

__all__ = [
    'OutputValidationHook',
]
