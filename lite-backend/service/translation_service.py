"""
翻译服务 - 基于现有LLM模型的翻译功能
支持中英文双向翻译，专门优化文档检索场景
"""
import asyncio
import time
import os
from typing import Dict, List, Optional, Any, Tuple
from dataclasses import dataclass
from enum import Enum
import functools
import re
import httpx
import json

from core.logger import logger
from service.llm_service import llm_service
from core.config_optimized import optimized_config_manager


class TranslationDirection(Enum):
    """翻译方向枚举"""
    ZH_TO_EN = "zh_to_en"  # 中文到英文
    EN_TO_ZH = "en_to_zh"  # 英文到中文
    AUTO = "auto"          # 自动检测


@dataclass
class TranslationResult:
    """翻译结果"""
    original_text: str
    translated_text: str
    source_language: str
    target_language: str
    confidence: float
    processing_time: float
    model_used: str


class TranslationService:
    """翻译服务"""
    
    def __init__(self):
        # 获取配置 - 使用dynaconf直接访问
        self.config = optimized_config_manager.dynaconf if hasattr(optimized_config_manager, 'dynaconf') else {}
        self._translation_cache = {}  # 翻译缓存
        self._cache_max_size = 1000
        
    def _get_translation_model(self, preferred_model: Optional[str] = None) -> str:
        """获取翻译使用的模型"""
        # 优先使用传入的首选模型（来自用户对话配置）
        if preferred_model:
            logger.info(f"翻译使用用户选择的模型: {preferred_model}")
            return preferred_model
        
        # 从环境变量读取翻译模型配置
        env_translation_model = os.getenv('TRANSLATION_MODEL')
        if env_translation_model:
            logger.info(f"翻译使用环境变量配置的模型: {env_translation_model}")
            return env_translation_model
        
        # 如果环境变量未配置，使用默认模型
        default_model = "Qwen/Qwen3-30B-A3B-Thinking-2507"
        logger.info(f"翻译使用默认模型: {default_model}")
        return default_model
    
    def detect_language(self, text: str) -> str:
        """检测文本语言"""
        # 简单的语言检测逻辑
        chinese_chars = re.findall(r'[\u4e00-\u9fff]', text)
        english_chars = re.findall(r'[a-zA-Z]', text)
        
        chinese_ratio = len(chinese_chars) / len(text) if text else 0
        english_ratio = len(english_chars) / len(text) if text else 0
        
        if chinese_ratio > 0.3:
            return 'zh'
        elif english_ratio > 0.3:
            return 'en'
        else:
            return 'auto'
    
    def _build_translation_prompt(self, text: str, direction: TranslationDirection) -> str:
        """构建翻译提示词"""
        if direction == TranslationDirection.ZH_TO_EN:
            prompt = f"""You are a professional English translator specializing in materials science and construction engineering. Your task is to translate Chinese text to English.

IMPORTANT TERMINOLOGY:
- 地聚物 = geopolymer
- 强度 = strength
- 力学性能 = mechanical properties
- 材料 = material
- 混凝土 = concrete

IMPORTANT: You must ONLY respond with the English translation. Do not include any explanations, notes, or Chinese text in your response.

Chinese text to translate: {text}

Provide only the English translation:"""
        
        elif direction == TranslationDirection.EN_TO_ZH:
            prompt = f"""You are a professional translator. Translate the following English text to Chinese. Only return the Chinese translation, nothing else.

English text: {text}

Chinese translation:"""
        
        else:
            # 自动检测语言并翻译
            detected_lang = self.detect_language(text)
            if detected_lang == 'zh':
                return self._build_translation_prompt(text, TranslationDirection.ZH_TO_EN)
            else:
                return self._build_translation_prompt(text, TranslationDirection.EN_TO_ZH)
        
        return prompt
    
    def _get_cache_key(self, text: str, direction: TranslationDirection) -> str:
        """获取缓存键"""
        import hashlib
        content = f"{text}:{direction.value}"
        return hashlib.md5(content.encode()).hexdigest()
    
    async def translate(
        self, 
        text: str, 
        direction: TranslationDirection = TranslationDirection.AUTO,
        use_cache: bool = True,
        preferred_model: Optional[str] = None
    ) -> TranslationResult:
        """
        翻译文本
        
        Args:
            text: 待翻译文本
            direction: 翻译方向
            use_cache: 是否使用缓存
        """
        start_time = time.time()
        
        # 检查缓存
        cache_key = self._get_cache_key(text, direction)
        if use_cache and cache_key in self._translation_cache:
            cached_result = self._translation_cache[cache_key]
            logger.info(f"翻译缓存命中: {text[:50]}...")
            return cached_result
        
        try:
            # 检测原始语言
            source_lang = self.detect_language(text)
            
            # 确定翻译方向
            if direction == TranslationDirection.AUTO:
                if source_lang == 'zh':
                    direction = TranslationDirection.ZH_TO_EN
                    target_lang = 'en'
                else:
                    direction = TranslationDirection.EN_TO_ZH
                    target_lang = 'zh'
            else:
                target_lang = 'en' if direction == TranslationDirection.ZH_TO_EN else 'zh'
            
            # 构建翻译提示
            prompt = self._build_translation_prompt(text, direction)
            
            # 调用LLM进行翻译
            model_name = self._get_translation_model(preferred_model)
            
            logger.info(f"开始翻译: {text[:50]}... 使用模型: {model_name}")
            logger.info(f"翻译提示词: {prompt}")
            
            # 直接调用统一网关进行翻译
            raw_translated_text = await self._call_gateway_for_translation(prompt, model_name)
            logger.info(f"原始翻译结果: {raw_translated_text}")
            
            # 后处理翻译结果
            translated_text = self._post_process_translation(raw_translated_text)
            logger.info(f"处理后翻译结果: {translated_text}")
            
            processing_time = time.time() - start_time
            
            # 创建结果对象
            result = TranslationResult(
                original_text=text,
                translated_text=translated_text,
                source_language=source_lang,
                target_language=target_lang,
                confidence=0.9,  # 基于LLM的翻译置信度
                processing_time=processing_time,
                model_used=model_name
            )
            
            # 缓存结果
            if use_cache:
                self._update_cache(cache_key, result)
            
            logger.info(f"翻译完成: {text[:30]}... -> {translated_text[:30]}... 耗时: {processing_time:.2f}s")
            
            return result
            
        except Exception as e:
            logger.error(f"翻译失败: {text[:50]}... 错误: {e}")
            # 返回原文本作为回退
            return TranslationResult(
                original_text=text,
                translated_text=text,
                source_language=source_lang,
                target_language=source_lang,
                confidence=0.0,
                processing_time=time.time() - start_time,
                model_used="fallback"
            )
    
    def _post_process_translation(self, text: str) -> str:
        """后处理翻译结果"""
        # 移除可能的解释性文本
        text = re.sub(r'^(翻译结果：|Translation:|结果：|Result:|English translation:|Chinese translation:)', '', text).strip()
        
        # 移除引号
        text = re.sub(r'^["""\'''](.*)["""\''']$', r'\1', text).strip()
        
        # 移除换行符和多余空格
        text = re.sub(r'\n+', ' ', text).strip()
        
        return text
    
    async def _call_gateway_for_translation(self, prompt: str, model_name: str) -> str:
        """直接调用统一网关进行翻译"""
        try:
            # 获取网关配置
            gateway_config = optimized_config_manager.get_unified_gateway_config()
            base_url = gateway_config['base_url']
            api_key = gateway_config['api_key']
            
            # 构建请求
            url = f"{base_url}/chat/completions"
            headers = {
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json"
            }
            
            payload = {
                "model": model_name,
                "messages": [
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                "temperature": 0.1,
                "max_tokens": 1000,
                "stream": False
            }
            
            logger.info(f"调用网关: {url}")
            logger.info(f"使用模型: {model_name}")
            
            # 发送请求
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(url, headers=headers, json=payload)
                response.raise_for_status()
                
                result = response.json()
                
                # 提取回复内容
                if 'choices' in result and len(result['choices']) > 0:
                    content = result['choices'][0]['message']['content']
                    return content.strip()
                else:
                    raise ValueError(f"网关响应格式异常: {result}")
                    
        except httpx.HTTPStatusError as e:
            logger.error(f"网关HTTP错误: {e.response.status_code} - {e.response.text}")
            raise ValueError(f"翻译请求失败: HTTP {e.response.status_code}")
        except Exception as e:
            logger.error(f"调用网关翻译失败: {e}")
            raise ValueError(f"翻译服务异常: {str(e)}")
    
    def _update_cache(self, key: str, result: TranslationResult):
        """更新缓存"""
        if len(self._translation_cache) >= self._cache_max_size:
            # 移除最旧的条目
            oldest_key = next(iter(self._translation_cache))
            del self._translation_cache[oldest_key]
        
        self._translation_cache[key] = result
    
    async def translate_batch(
        self, 
        texts: List[str], 
        direction: TranslationDirection = TranslationDirection.AUTO
    ) -> List[TranslationResult]:
        """批量翻译"""
        tasks = [self.translate(text, direction) for text in texts]
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        # 处理异常
        processed_results = []
        for i, result in enumerate(results):
            if isinstance(result, Exception):
                logger.error(f"批量翻译失败 #{i}: {result}")
                # 创建失败的结果对象
                processed_results.append(TranslationResult(
                    original_text=texts[i],
                    translated_text=texts[i],
                    source_language="unknown",
                    target_language="unknown",
                    confidence=0.0,
                    processing_time=0.0,
                    model_used="error"
                ))
            else:
                processed_results.append(result)
        
        return processed_results
    
    def clear_cache(self):
        """清空翻译缓存"""
        self._translation_cache.clear()
        logger.info("翻译缓存已清空")


# 装饰器：为检索函数添加翻译功能
def enable_translation_for_retrieval(
    translate_query: bool = True,
    translate_results: bool = False,
    cache_translations: bool = True
):
    """
    检索翻译装饰器
    
    Args:
        translate_query: 是否翻译查询
        translate_results: 是否翻译结果
        cache_translations: 是否缓存翻译
    """
    def decorator(func):
        @functools.wraps(func)
        async def wrapper(*args, **kwargs):
            # 获取翻译服务实例
            translation_service = TranslationService()
            
            # 翻译查询（如果启用）
            if translate_query and 'query' in kwargs:
                original_query = kwargs['query']
                
                # 检测查询语言
                detected_lang = translation_service.detect_language(original_query)
                
                if detected_lang == 'zh':
                    # 中文查询，翻译为英文进行检索
                    translation_result = await translation_service.translate(
                        original_query, 
                        TranslationDirection.ZH_TO_EN,
                        use_cache=cache_translations
                    )
                    kwargs['query'] = translation_result.translated_text
                    
                    logger.info(f"查询翻译: {original_query[:50]}... -> {translation_result.translated_text[:50]}...")
            
            # 执行原始函数
            result = await func(*args, **kwargs)
            
            # 翻译结果（如果启用且需要）
            if translate_results and hasattr(result, 'results'):
                # 这里可以添加结果翻译逻辑
                pass
            
            return result
        return wrapper
    return decorator


# 全局翻译服务实例
translation_service = TranslationService()