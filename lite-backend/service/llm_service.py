"""
LLM服务抽象层 - 支持配置注入和多种模型提供商
"""
from abc import ABC, abstractmethod
from typing import Dict, List, Optional, Any, Type
from dataclasses import dataclass
from enum import Enum
import httpx

from core.config_optimized import optimized_config_manager
from core.logger import logger
from core.base_provider import BaseLLMProvider as BaseProvider, BaseProviderManager, APIResponse


class ModelProvider(Enum):
    """模型提供商枚举 - 按实际厂商分类"""
    ALIBABA = "alibaba"    # 阿里云通义系列
    GOOGLE = "google"      # Google Gemini系列  
    OPENAI = "openai"      # OpenAI GPT系列
    CUSTOM = "custom"      # 自定义模型
    
    # 向后兼容的别名 (逐步废弃)
    QWEN = "alibaba"       # @deprecated: 使用 ALIBABA
    GEMINI = "google"      # @deprecated: 使用 GOOGLE
    OPENAI_LIKE = "openai" # @deprecated: 使用 OPENAI


@dataclass
class LLMResponse:
    """LLM响应数据结构"""
    content: str
    model: str
    provider: str
    tokens_used: Optional[int] = None
    processing_time: Optional[float] = None
    metadata: Optional[Dict[str, Any]] = None


# 使用统一的BaseLLMProvider从core.base_provider
# 原有的BaseLLMProvider类已移至统一基类


class QwenProvider(BaseProvider):
    """通义千问提供商"""
    
    def create_model(self, model_id: str, **kwargs) -> "QwenChat":
        """创建Qwen模型实例"""
        model_info = self.get_model_info(model_id)
        if not model_info:
            raise ValueError(f"不支持的Qwen模型: {model_id}")
        
        return QwenChat(
            id=model_id,
            api_key=self.api_key,
            base_url=self.base_url,
            **kwargs
        )
    
    def get_supported_models(self) -> List[str]:
        """获取支持的Qwen模型"""
        return self.get_available_models()


class GeminiProvider(BaseProvider):
    """Google Gemini提供商"""
    
    def create_model(self, model_id: str, **kwargs) -> "GeminiChat":
        """创建Gemini模型实例"""
        model_info = self.get_model_info(model_id)
        if not model_info:
            raise ValueError(f"不支持的Gemini模型: {model_id}")
        
        return GeminiChat(
            id=model_id,
            api_key=self.api_key,
            base_url=self.base_url,
            **kwargs
        )
    
    def get_supported_models(self) -> List[str]:
        """获取支持的Gemini模型"""
        return self.get_available_models()


class OpenAILikeProvider(BaseProvider):
    """OpenAI兼容服务提供商"""
    
    def create_model(self, model_id: str, **kwargs) -> "OpenAILikeChat":
        """创建OpenAI兼容模型实例"""
        model_info = self.get_model_info(model_id)
        if not model_info:
            raise ValueError(f"不支持的OpenAI兼容模型: {model_id}")
        
        return OpenAILikeChat(
            id=model_id,
            api_key=self.api_key,
            base_url=self.base_url,
            **kwargs
        )
    
    def get_supported_models(self) -> List[str]:
        """获取支持的OpenAI兼容模型"""
        return self.get_available_models()


class OneAPIProvider(BaseProvider):
    """One-API服务提供商"""
    
    def create_model(self, model_id: str, **kwargs) -> "OneAPIChat":
        """创建One-API模型实例"""
        model_info = self.get_model_info(model_id)
        if not model_info:
            raise ValueError(f"不支持的One-API模型: {model_id}")
        
        return OneAPIChat(
            id=model_id,
            api_key=self.api_key,
            base_url=self.base_url,
            **kwargs
        )
    
    def get_supported_models(self) -> List[str]:
        """获取支持的One-API模型"""
        return self.get_available_models()


class GeminiChat:
    """Gemini聊天模型包装器"""
    
    def __init__(self, id: str, api_key: str, base_url: str, **kwargs):
        self.id = id
        self.api_key = api_key
        self.base_url = base_url
        self.client = httpx.AsyncClient()
        
    async def __call__(self, messages, **kwargs):
        """调用Gemini API"""
        try:
            # 转换消息格式
            gemini_messages = self._convert_messages(messages)
            
            # 构建请求
            url = f"{self.base_url}/models/{self.id}:generateContent"
            headers = {
                "Content-Type": "application/json",
            }
            
            data = {
                "contents": gemini_messages,
                "generationConfig": {
                    "temperature": kwargs.get("temperature", 0.1),
                    "maxOutputTokens": kwargs.get("max_tokens", 2048),
                }
            }
            
            response = await self.client.post(
                url,
                headers=headers,
                json=data,
                params={"key": self.api_key}
            )
            response.raise_for_status()
            
            result = response.json()
            content = result["candidates"][0]["content"]["parts"][0]["text"]
            
            return type('Response', (), {
                'content': content,
                'model': self.id
            })()
            
        except Exception as e:
            logger.error(f"Gemini API调用失败: {e}")
            raise
    
    def _convert_messages(self, messages):
        """转换消息格式为Gemini格式"""
        gemini_messages = []
        for msg in messages:
            role = "user" if msg.get("role") == "user" else "model"
            gemini_messages.append({
                "role": role,
                "parts": [{"text": msg.get("content", "")}]
            })
        return gemini_messages


class QwenChat:
    """通义千问聊天模型包装器"""
    
    def __init__(self, id: str, api_key: str, base_url: str, **kwargs):
        self.id = id
        self.api_key = api_key
        self.base_url = base_url
        self.client = httpx.AsyncClient()
        
    async def __call__(self, messages, **kwargs):
        """调用Qwen API"""
        try:
            headers = {
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json",
            }
            
            data = {
                "model": self.id,
                "messages": messages,
                "temperature": kwargs.get("temperature", 0.1),
                "max_tokens": kwargs.get("max_tokens", 2048),
            }
            
            response = await self.client.post(
                f"{self.base_url}/chat/completions",
                headers=headers,
                json=data
            )
            response.raise_for_status()
            
            result = response.json()
            content = result["choices"][0]["message"]["content"]
            
            return type('Response', (), {
                'content': content,
                'model': self.id
            })()
            
        except Exception as e:
            logger.error(f"Qwen API调用失败: {e}")
            raise


class OpenAILikeChat:
    """OpenAI兼容聊天模型包装器"""
    
    def __init__(self, id: str, api_key: str, base_url: str, **kwargs):
        self.id = id
        self.api_key = api_key
        self.base_url = base_url
        self.client = httpx.AsyncClient()
        
    async def __call__(self, messages, **kwargs):
        """调用OpenAI兼容API"""
        try:
            headers = {
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json",
            }
            
            data = {
                "model": self.id,
                "messages": messages,
                "temperature": kwargs.get("temperature", 0.1),
                "max_tokens": kwargs.get("max_tokens", 2048),
            }
            
            response = await self.client.post(
                f"{self.base_url}/chat/completions",
                headers=headers,
                json=data
            )
            response.raise_for_status()
            
            result = response.json()
            content = result["choices"][0]["message"]["content"]
            
            return type('Response', (), {
                'content': content,
                'model': self.id
            })()
            
        except Exception as e:
            logger.error(f"OpenAI兼容API调用失败: {e}")
            raise


class OneAPIChat:
    """One-API聊天模型包装器"""
    
    def __init__(self, id: str, api_key: str, base_url: str, **kwargs):
        self.id = id
        self.api_key = api_key
        self.base_url = base_url
        self.client = httpx.AsyncClient(timeout=60.0)
        
    async def __call__(self, messages, **kwargs):
        """调用One-API"""
        try:
            headers = {
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json",
            }
            
            data = {
                "model": self.id,
                "messages": messages,
                "temperature": kwargs.get("temperature", 0.1),
                "max_tokens": kwargs.get("max_tokens", 2048),
            }
            
            response = await self.client.post(
                f"{self.base_url}/chat/completions",
                headers=headers,
                json=data
            )
            response.raise_for_status()
            
            result = response.json()
            content = result["choices"][0]["message"]["content"]
            
            return type('Response', (), {
                'content': content,
                'model': self.id
            })()
            
        except Exception as e:
            logger.error(f"One-API调用失败: {e}")
            raise


class LLMServiceFactory(BaseProviderManager):
    """LLM服务工厂 - 继承统一基类"""
    
    _providers: Dict[str, Type[BaseProvider]] = {
        # 主要提供商映射 (按实际厂商)
        "alibaba": QwenProvider,     # 阿里云通义系列
        "google": GeminiProvider,    # Google Gemini系列
        "openai": OpenAILikeProvider, # OpenAI GPT系列
        "custom": OneAPIProvider,    # 自定义模型提供商
        
        # 向后兼容映射 (逐步废弃)
        ModelProvider.QWEN.value: QwenProvider,        # alibaba
        ModelProvider.GEMINI.value: GeminiProvider,    # google  
        ModelProvider.OPENAI_LIKE.value: OpenAILikeProvider, # openai
        # 注意: 移除了 ONE_API 映射，因为它不是模型提供商而是中转网关
    }
    
    @classmethod
    def _get_provider_config(cls, provider_name: str) -> Optional[Any]:
        """获取LLM提供商配置（兼容新格式）"""
        # 优先使用统一网关配置
        if optimized_config_manager.is_gateway_preferred():
            gateway_config = optimized_config_manager.get_unified_gateway_config()
            if gateway_config['enabled']:
                return type('GatewayProviderConfig', (), {
                    'api_key': gateway_config['api_key'],
                    'base_url': gateway_config['base_url'],
                    'timeout': gateway_config['timeout'],
                    'provider_name': provider_name,
                    'models': cls._get_models_for_provider(provider_name)
                })()
        
        # 回退到原有配置方式
        return optimized_config_manager.get_provider_config(provider_name, "llm")
    
    @classmethod
    def _get_models_for_provider(cls, provider_name: str) -> List[str]:
        """获取特定提供商的模型列表"""
        llm_config = optimized_config_manager.get_llm_models_config()
        return llm_config['by_vendor'].get(provider_name, [])
    
    @classmethod
    def create_model(cls, model_path: str, **kwargs) -> Any:
        """
        创建模型实例
        Args:
            model_path: 模型路径，格式为 "provider/model_id"
            **kwargs: 额外的模型参数
        """
        try:
            provider_name, model_id = model_path.split('/', 1)
            provider = cls.get_provider(provider_name)
            return provider.create_model(model_id, **kwargs)
        except ValueError as e:
            logger.error(f"创建模型失败: {e}")
            raise
        except Exception as e:
            logger.error(f"创建模型时发生未知错误: {e}")
            raise ValueError(f"无效的模型路径格式: {model_path}")
    
    @classmethod
    def get_all_models(cls) -> Dict[str, List[str]]:
        """获取所有支持的模型"""
        all_models = {}
        for provider_name in cls._providers.keys():
            try:
                provider = cls.get_provider(provider_name)
                all_models[provider_name] = provider.get_supported_models()
            except Exception as e:
                logger.warning(f"获取提供商 {provider_name} 的模型列表失败: {e}")
                all_models[provider_name] = []
        return all_models


class LLMService:
    """LLM服务主类"""
    
    def __init__(self):
        self.factory = LLMServiceFactory()
    
    def create_model(self, model_path: str, **kwargs) -> Any:
        """创建模型实例"""
        return self.factory.create_model(model_path, **kwargs)
    
    def get_model_config(self, model_path: str) -> Optional[Any]:
        """获取模型配置"""
        try:
            provider_name, model_id = model_path.split('/', 1)
            provider = self.factory.get_provider(provider_name)
            return provider.get_model_config(model_id)
        except Exception as e:
            logger.error(f"获取模型配置失败: {e}")
            return None
    
    def get_supported_models(self) -> Dict[str, List[str]]:
        """获取所有支持的模型 - 直接从GATEWAY_MODELS读取"""
        llm_config = optimized_config_manager.get_llm_models_config()
        return {
            'all': llm_config['all_models'],
            'default': llm_config['default_model'],
            'by_vendor': llm_config['by_vendor'],
            'gateway_enabled': True
        }
    
    def validate_model_path(self, model_path: str) -> bool:
        """验证模型路径是否有效"""
        try:
            provider_name, model_id = model_path.split('/', 1)
            provider = self.factory.get_provider(provider_name)
            return model_id in provider.get_supported_models()
        except Exception:
            return False


# 全局LLM服务实例
llm_service = LLMService() 