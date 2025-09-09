"""
翻译上下文管理 - 在运行时传递翻译开关状态
"""
import contextvars
from typing import Optional

# 创建上下文变量来传递翻译开关状态和模型信息
translation_enabled: contextvars.ContextVar[bool] = contextvars.ContextVar(
    'translation_enabled', 
    default=False
)

translation_model: contextvars.ContextVar[Optional[str]] = contextvars.ContextVar(
    'translation_model',
    default=None
)

# 测试模式上下文变量
translation_test_mode: contextvars.ContextVar[bool] = contextvars.ContextVar(
    'translation_test_mode',
    default=False
)


class TranslationContext:
    """翻译上下文管理器"""
    
    @staticmethod
    def set_enabled(enabled: bool, model: Optional[str] = None) -> None:
        """设置翻译是否启用和使用的模型"""
        translation_enabled.set(enabled)
        if model:
            translation_model.set(model)
    
    @staticmethod
    def is_enabled() -> bool:
        """获取翻译是否启用"""
        return translation_enabled.get(False)
    
    @staticmethod
    def get_model() -> Optional[str]:
        """获取当前上下文中的翻译模型"""
        return translation_model.get(None)
    
    @staticmethod
    def is_test_mode() -> bool:
        """获取是否为测试模式"""
        return translation_test_mode.get(False)
    
    @staticmethod
    def set_test_mode(enabled: bool) -> None:
        """设置测试模式"""
        translation_test_mode.set(enabled)
    
    @staticmethod
    def get_context_token(enabled: bool, model: Optional[str] = None):
        """获取上下文token，用于在异步任务中设置翻译状态"""
        token1 = translation_enabled.set(enabled)
        token2 = translation_model.set(model) if model else None
        return (token1, token2)
    
    @classmethod
    def enable(cls, model: Optional[str] = None):
        """上下文管理器：启用翻译"""
        return cls._context_manager(True, model)
    
    @classmethod
    def disable(cls):
        """上下文管理器：禁用翻译"""
        return cls._context_manager(False, None)
    
    @classmethod  
    def test_mode(cls):
        """上下文管理器：测试模式（强制禁用翻译）"""
        return cls._test_mode_manager()
    
    @staticmethod
    def _context_manager(enabled: bool, model: Optional[str] = None):
        """内部上下文管理器实现"""
        class _TranslationContextManager:
            def __init__(self, enabled: bool, model: Optional[str] = None):
                self.enabled = enabled
                self.model = model
                self.enabled_token = None
                self.model_token = None
            
            def __enter__(self):
                self.enabled_token = translation_enabled.set(self.enabled)
                if self.model:
                    self.model_token = translation_model.set(self.model)
                return self
            
            def __exit__(self, exc_type, exc_val, exc_tb):
                if self.enabled_token is not None:
                    translation_enabled.reset(self.enabled_token)
                if self.model_token is not None:
                    translation_model.reset(self.model_token)
        
        return _TranslationContextManager(enabled, model)
    
    @staticmethod
    def _test_mode_manager():
        """测试模式上下文管理器实现"""
        class _TestModeContextManager:
            def __init__(self):
                self.test_token = None
            
            def __enter__(self):
                self.test_token = translation_test_mode.set(True)
                return self
            
            def __exit__(self, exc_type, exc_val, exc_tb):
                if self.test_token is not None:
                    translation_test_mode.reset(self.test_token)
        
        return _TestModeContextManager()


# 便捷的全局函数
def with_translation_enabled(enabled: bool):
    """装饰器：在函数执行期间设置翻译状态"""
    def decorator(func):
        async def async_wrapper(*args, **kwargs):
            if enabled:
                with TranslationContext.enable():
                    return await func(*args, **kwargs)
            else:
                with TranslationContext.disable():
                    return await func(*args, **kwargs)
        
        def sync_wrapper(*args, **kwargs):
            if enabled:
                with TranslationContext.enable():
                    return func(*args, **kwargs)
            else:
                with TranslationContext.disable():
                    return func(*args, **kwargs)
        
        # 判断是否为异步函数
        import asyncio
        if asyncio.iscoroutinefunction(func):
            return async_wrapper
        else:
            return sync_wrapper
    
    return decorator