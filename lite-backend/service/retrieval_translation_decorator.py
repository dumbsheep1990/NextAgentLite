"""
检索翻译装饰器 - 专门为文档检索优化的翻译功能
在不影响现有功能的前提下，为检索服务添加中英文翻译支持
"""
import asyncio
import time
from typing import Dict, List, Optional, Any, Callable
from dataclasses import dataclass
import functools

from core.logger import logger
from service.translation_service import translation_service, TranslationDirection

# 导入翻译上下文
try:
    from service.translation_context import TranslationContext
    _has_translation_context = True
except ImportError:
    _has_translation_context = False
    class TranslationContext:
        @staticmethod
        def is_enabled():
            return False


@dataclass
class RetrievalTranslationConfig:
    """检索翻译配置"""
    enabled: bool = True
    translate_query: bool = True
    translate_results: bool = False
    cache_translations: bool = True
    min_query_length: int = 2
    max_query_length: int = 1000
    translation_timeout: float = 10.0
    fallback_on_error: bool = True
    smart_data_source_routing: bool = True  # 智能数据源路由


class RetrievalTranslationDecorator:
    """检索翻译装饰器类"""
    
    def __init__(self, config: RetrievalTranslationConfig = None):
        self.config = config or RetrievalTranslationConfig()
        self._performance_metrics = {
            'total_queries': 0,
            'translated_queries': 0,
            'translation_errors': 0,
            'avg_translation_time': 0.0
        }
    
    def __call__(self, func: Callable) -> Callable:
        """装饰器调用"""
        @functools.wraps(func)
        async def wrapper(*args, **kwargs):
            # 检查动态翻译参数（从kwargs中移除，避免传递给原函数）
            enable_translation = kwargs.pop('enable_translation', None)
            
            # 检查是否为测试模式，测试模式下强制禁用翻译
            if _has_translation_context and TranslationContext.is_test_mode():
                logger.debug("测试模式下禁用翻译装饰器")
                return await func(*args, **kwargs)
            
            # 检查翻译是否应该启用（优先级：kwargs参数 > 上下文 > 静态配置）
            should_translate = False
            if enable_translation is not None:
                # 显式指定的参数优先级最高
                should_translate = enable_translation
            elif _has_translation_context and TranslationContext.is_enabled():
                # 上下文中的翻译状态其次
                should_translate = True
            elif self.config.enabled:
                # 静态配置最后
                should_translate = True
            
            if not should_translate:
                # 翻译被禁用，直接调用原函数
                return await func(*args, **kwargs)
            
            return await self._execute_with_translation(func, *args, **kwargs)
        return wrapper
    
    async def _execute_with_translation(self, func: Callable, *args, **kwargs) -> Any:
        """执行带翻译的检索"""
        start_time = time.time()
        self._performance_metrics['total_queries'] += 1
        
        try:
            # 提取查询参数
            original_query = self._extract_query_from_kwargs(kwargs)
            if not original_query:
                logger.debug("未找到查询参数，跳过翻译")
                return await func(*args, **kwargs)
            
            # 验证查询长度
            if not self._validate_query_length(original_query):
                logger.debug(f"查询长度不符合要求，跳过翻译: {len(original_query)} 字符")
                return await func(*args, **kwargs)
            
            # 检测查询语言并决定是否翻译
            should_translate, detected_lang = self._should_translate_query(original_query)
            
            if should_translate and self.config.translate_query and self.config.smart_data_source_routing:
                # 智能数据源路由模式：为不同数据源准备不同查询
                translated_query = await self._translate_query(original_query, detected_lang)
                if translated_query and translated_query != original_query:
                    # 准备双语查询参数
                    kwargs['original_query'] = original_query  # QA数据用中文原始查询
                    kwargs['translated_query'] = translated_query  # 文档数据用英文翻译查询
                    kwargs['query'] = translated_query  # 默认使用翻译后的查询
                    self._performance_metrics['translated_queries'] += 1
                    
                    logger.info(f"智能路由: 原始查询={original_query[:30]}..., 翻译查询={translated_query[:30]}...")
                else:
                    # 翻译失败，使用原始查询
                    kwargs['original_query'] = original_query
                    kwargs['translated_query'] = original_query
                    kwargs['query'] = original_query
            elif should_translate and self.config.translate_query:
                # 传统翻译模式：统一使用翻译后的查询
                translated_query = await self._translate_query(original_query, detected_lang)
                if translated_query and translated_query != original_query:
                    kwargs['query'] = translated_query
                    self._performance_metrics['translated_queries'] += 1
                    
                    logger.info(f"查询已翻译: {original_query[:50]}... -> {translated_query[:50]}...")
            
            # 执行原始检索函数
            result = await func(*args, **kwargs)
            
            # 记录性能指标
            processing_time = time.time() - start_time
            self._update_performance_metrics(processing_time)
            
            return result
            
        except Exception as e:
            logger.error(f"检索翻译装饰器执行失败: {e}")
            self._performance_metrics['translation_errors'] += 1
            
            if self.config.fallback_on_error:
                # 回退到原始函数
                logger.info("翻译失败，回退到原始查询")
                return await func(*args, **kwargs)
            else:
                raise
    
    def _extract_query_from_kwargs(self, kwargs: Dict[str, Any]) -> Optional[str]:
        """从参数中提取查询字符串"""
        # 常见的查询参数名
        query_params = ['query', 'question', 'text', 'search_query', 'user_query']
        
        for param in query_params:
            if param in kwargs and isinstance(kwargs[param], str):
                return kwargs[param]
        
        return None
    
    def _validate_query_length(self, query: str) -> bool:
        """验证查询长度"""
        query_length = len(query.strip())
        return self.config.min_query_length <= query_length <= self.config.max_query_length
    
    def _should_translate_query(self, query: str) -> tuple[bool, str]:
        """判断是否应该翻译查询"""
        detected_lang = translation_service.detect_language(query)
        
        # 如果是中文查询，需要翻译为英文以匹配英文文档
        should_translate = detected_lang == 'zh'
        
        return should_translate, detected_lang
    
    async def _translate_query(self, query: str, detected_lang: str) -> Optional[str]:
        """翻译查询"""
        try:
            # 设置翻译方向
            if detected_lang == 'zh':
                direction = TranslationDirection.ZH_TO_EN
            else:
                direction = TranslationDirection.EN_TO_ZH
            
            # 从上下文获取首选模型
            preferred_model = None
            if _has_translation_context:
                preferred_model = TranslationContext.get_model()
                if preferred_model:
                    logger.info(f"翻译装饰器使用上下文模型: {preferred_model}")
            
            # 执行翻译（带超时）
            translation_result = await asyncio.wait_for(
                translation_service.translate(
                    query, 
                    direction=direction,
                    use_cache=self.config.cache_translations,
                    preferred_model=preferred_model
                ),
                timeout=self.config.translation_timeout
            )
            
            return translation_result.translated_text
            
        except asyncio.TimeoutError:
            logger.warning(f"查询翻译超时: {query[:50]}...")
            return None
        except Exception as e:
            logger.error(f"查询翻译失败: {query[:50]}... 错误: {e}")
            return None
    
    def _update_performance_metrics(self, processing_time: float):
        """更新性能指标"""
        # 更新平均翻译时间
        current_avg = self._performance_metrics['avg_translation_time']
        total_queries = self._performance_metrics['total_queries']
        
        if total_queries > 0:
            self._performance_metrics['avg_translation_time'] = (
                (current_avg * (total_queries - 1) + processing_time) / total_queries
            )
    
    def get_performance_metrics(self) -> Dict[str, Any]:
        """获取性能指标"""
        return self._performance_metrics.copy()
    
    def reset_performance_metrics(self):
        """重置性能指标"""
        self._performance_metrics = {
            'total_queries': 0,
            'translated_queries': 0,
            'translation_errors': 0,
            'avg_translation_time': 0.0
        }


# 预配置的装饰器实例
class RetrievalTranslationDecorators:
    """预配置的检索翻译装饰器"""
    
    # 标准配置 - 默认启用查询翻译和智能路由
    @staticmethod
    def standard_translation(func: Callable) -> Callable:
        """标准翻译装饰器"""
        config = RetrievalTranslationConfig(
            enabled=True,
            translate_query=True,
            translate_results=False,
            cache_translations=True,
            fallback_on_error=True,
            smart_data_source_routing=True  # 启用智能数据源路由
        )
        decorator = RetrievalTranslationDecorator(config)
        return decorator(func)
    
    # 保守配置 - 只在确定需要时翻译
    @staticmethod
    def conservative_translation(func: Callable) -> Callable:
        """保守翻译装饰器"""
        config = RetrievalTranslationConfig(
            enabled=True,
            translate_query=True,
            translate_results=False,
            cache_translations=True,
            min_query_length=5,  # 更高的最小长度要求
            translation_timeout=5.0,  # 更短的超时时间
            fallback_on_error=True
        )
        decorator = RetrievalTranslationDecorator(config)
        return decorator(func)
    
    # 积极配置 - 启用所有翻译功能
    @staticmethod
    def aggressive_translation(func: Callable) -> Callable:
        """积极翻译装饰器"""
        config = RetrievalTranslationConfig(
            enabled=True,
            translate_query=True,
            translate_results=True,
            cache_translations=True,
            min_query_length=1,
            translation_timeout=15.0,
            fallback_on_error=True
        )
        decorator = RetrievalTranslationDecorator(config)
        return decorator(func)
    
    # 禁用翻译 - 用于测试对比
    @staticmethod
    def no_translation(func: Callable) -> Callable:
        """禁用翻译装饰器"""
        config = RetrievalTranslationConfig(enabled=False)
        decorator = RetrievalTranslationDecorator(config)
        return decorator(func)


# 便捷导出
standard_translation = RetrievalTranslationDecorators.standard_translation
conservative_translation = RetrievalTranslationDecorators.conservative_translation
aggressive_translation = RetrievalTranslationDecorators.aggressive_translation
no_translation = RetrievalTranslationDecorators.no_translation