"""
Pre-hooks

在Agent处理输入之前执行的hooks
"""

from .input_validation import InputValidationHook
from .intent_analysis import IntentAnalysisHook
from .retrieval_strategy_router import RetrievalStrategyRouterHook

# 政策问答场景Hooks
from .policy_sensitive_word_check import PolicySensitiveWordCheckHook
from .policy_metadata_extractor import PolicyMetadataExtractorHook
from .policy_query_normalization import PolicyQueryNormalizationHook

__all__ = [
    'InputValidationHook',
    'IntentAnalysisHook',
    'RetrievalStrategyRouterHook',
    # 政策问答场景
    'PolicySensitiveWordCheckHook',
    'PolicyMetadataExtractorHook',
    'PolicyQueryNormalizationHook',
]
