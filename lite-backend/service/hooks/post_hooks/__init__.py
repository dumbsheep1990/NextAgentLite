"""
Post-hooks

在Agent生成响应之后执行的hooks
注意：不支持流式场景
"""

from .output_validation import OutputValidationHook
from .desensitization import DesensitizationPostHook

# 政策问答场景Hooks
from .policy_citation_enhancement import PolicyCitationEnhancementHook
from .policy_metadata_renderer import PolicyMetadataRendererHook

__all__ = [
    'OutputValidationHook',
    'DesensitizationPostHook',
    # 政策问答场景
    'PolicyCitationEnhancementHook',
    'PolicyMetadataRendererHook',
]
