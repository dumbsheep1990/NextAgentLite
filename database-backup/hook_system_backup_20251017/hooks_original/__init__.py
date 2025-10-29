"""
Hooks框架

基于Agno Hooks机制的灵活检索路由和处理系统
"""

from .base import (
    BaseHook,
    PreHook,
    PostHook,
    RunInput,
    RunOutput,
    AgentSession,
    HookType,
    HookStatus,
    HookCheckError,
    InputCheckError,
    OutputCheckError,
    CheckTrigger,
    HookExecutionResult
)

from .registry import (
    HookRegistry,
    hook_registry,
    register_pre_hook,
    register_post_hook
)

from .pipeline import HookPipeline

# Auto-import hooks to trigger decorator registration
try:
    from .pre_hooks.input_validation import InputValidationHook
except ImportError as e:
    print(f"Warning: InputValidationHook导入失败: {e}")

try:
    from .pre_hooks.intent_analysis import IntentAnalysisHook
except ImportError as e:
    print(f"Warning: IntentAnalysisHook导入失败: {e}")

try:
    from .pre_hooks.retrieval_strategy_router import RetrievalStrategyRouterHook
except ImportError as e:
    print(f"Warning: RetrievalStrategyRouterHook导入失败: {e}")

try:
    from .post_hooks.output_validation import OutputValidationHook
except ImportError as e:
    print(f"Warning: OutputValidationHook导入失败: {e}")

__all__ = [
    # Base classes
    'BaseHook',
    'PreHook',
    'PostHook',

    # Data classes
    'RunInput',
    'RunOutput',
    'AgentSession',
    'HookExecutionResult',

    # Enums
    'HookType',
    'HookStatus',

    # Exceptions
    'HookCheckError',
    'InputCheckError',
    'OutputCheckError',
    'CheckTrigger',

    # Registry
    'HookRegistry',
    'hook_registry',
    'register_pre_hook',
    'register_post_hook',

    # Pipeline
    'HookPipeline',
]
