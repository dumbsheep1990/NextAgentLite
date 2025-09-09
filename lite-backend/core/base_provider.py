"""
统一的Base API Provider - 消除服务层重复逻辑
"""
from abc import ABC, abstractmethod
from typing import Dict, List, Optional, Any, Type
from dataclasses import dataclass
import httpx
import time
from core.logger import logger


@dataclass
class APIResponse:
    """统一的API响应数据结构"""
    content: Any
    model: str
    provider: str
    tokens_used: Optional[int] = None
    processing_time: Optional[float] = None
    metadata: Optional[Dict[str, Any]] = None
    success: bool = True
    error_message: Optional[str] = None


class BaseAPIProvider(ABC):
    """基础API提供商抽象类 - 统一HTTP客户端和错误处理"""
    
    def __init__(self, provider_config: Any):
        self.config = provider_config
        self.provider_name = getattr(provider_config, 'provider_name', 'unknown')
        self.api_key = getattr(provider_config, 'api_key', '')
        self.base_url = getattr(provider_config, 'base_url', '')
        self.timeout = getattr(provider_config, 'timeout', 30)
        
        # 统一的HTTP客户端
        self.client = httpx.AsyncClient(timeout=self.timeout)
    
    def _get_headers(self, additional_headers: Optional[Dict[str, str]] = None) -> Dict[str, str]:
        """获取统一的请求头"""
        headers = {
            "Content-Type": "application/json",
            "User-Agent": "MatDemo/1.0.0"
        }
        
        if self.api_key:
            headers["Authorization"] = f"Bearer {self.api_key}"
        
        if additional_headers:
            headers.update(additional_headers)
        
        return headers
    
    async def _make_request(
        self, 
        method: str, 
        endpoint: str, 
        data: Optional[Dict] = None,
        additional_headers: Optional[Dict[str, str]] = None
    ) -> APIResponse:
        """统一的HTTP请求方法"""
        url = f"{self.base_url.rstrip('/')}/{endpoint.lstrip('/')}"
        headers = self._get_headers(additional_headers)
        
        start_time = time.time()
        
        try:
            response = await self.client.request(
                method=method,
                url=url,
                headers=headers,
                json=data
            )
            
            processing_time = time.time() - start_time
            
            if response.status_code == 200:
                response_data = response.json()
                return APIResponse(
                    content=response_data,
                    model=data.get('model', 'unknown') if data else 'unknown',
                    provider=self.provider_name,
                    processing_time=processing_time,
                    success=True
                )
            else:
                error_msg = f"API请求失败: {response.status_code} - {response.text}"
                logger.error(error_msg)
                return APIResponse(
                    content=None,
                    model='unknown',
                    provider=self.provider_name,
                    processing_time=processing_time,
                    success=False,
                    error_message=error_msg
                )
                
        except Exception as e:
            processing_time = time.time() - start_time
            error_msg = f"API请求异常: {str(e)}"
            logger.error(error_msg)
            return APIResponse(
                content=None,
                model='unknown',
                provider=self.provider_name,
                processing_time=processing_time,
                success=False,
                error_message=error_msg
            )
    
    @abstractmethod
    async def generate(self, model_id: str, **kwargs) -> APIResponse:
        """抽象生成方法 - 由子类实现具体逻辑"""
        pass
    
    def get_available_models(self) -> List[str]:
        """获取可用模型列表"""
        if hasattr(self.config, 'models') and self.config.models:
            return [model.id for model in self.config.models]
        return []
    
    def get_model_info(self, model_id: str) -> Optional[Any]:
        """获取模型信息"""
        if hasattr(self.config, 'models') and self.config.models:
            for model in self.config.models:
                if model.id == model_id:
                    return model
        return None
    
    async def health_check(self) -> bool:
        """健康检查"""
        try:
            response = await self._make_request("GET", "/health")
            return response.success
        except Exception:
            return False
    
    async def close(self):
        """关闭HTTP客户端"""
        if self.client:
            await self.client.aclose()


class BaseProviderManager(ABC):
    """基础提供商管理器 - 统一提供商实例管理"""
    
    _providers: Dict[str, Type[BaseAPIProvider]] = {}
    _instances: Dict[str, BaseAPIProvider] = {}
    
    @classmethod
    @abstractmethod
    def _get_provider_config(cls, provider_name: str) -> Optional[Any]:
        """获取提供商配置 - 由子类实现"""
        pass
    
    @classmethod
    def register_provider(cls, provider_name: str, provider_class: Type[BaseAPIProvider]):
        """注册提供商类"""
        cls._providers[provider_name] = provider_class
    
    @classmethod
    def get_provider(cls, provider_name: str) -> Optional[BaseAPIProvider]:
        """获取提供商实例 - 统一的单例模式"""
        if provider_name not in cls._instances:
            provider_config = cls._get_provider_config(provider_name)
            if not provider_config:
                logger.error(f"未找到提供商配置: {provider_name}")
                return None
            
            provider_class = cls._providers.get(provider_name)
            if not provider_class:
                logger.error(f"不支持的提供商: {provider_name}")
                return None
            
            cls._instances[provider_name] = provider_class(provider_config)
        
        return cls._instances[provider_name]
    
    @classmethod
    def get_available_providers(cls) -> List[str]:
        """获取可用提供商列表"""
        return list(cls._providers.keys())
    
    @classmethod
    async def close_all(cls):
        """关闭所有提供商实例"""
        for provider in cls._instances.values():
            await provider.close()
        cls._instances.clear()


class BaseLLMProvider(BaseAPIProvider):
    """LLM提供商基类"""
    
    async def generate_completion(
        self, 
        model_id: str, 
        messages: List[Dict[str, str]], 
        **kwargs
    ) -> APIResponse:
        """生成文本补全"""
        data = {
            "model": model_id,
            "messages": messages,
            **kwargs
        }
        return await self._make_request("POST", "/chat/completions", data)
    
    async def generate(self, model_id: str, **kwargs) -> APIResponse:
        """实现抽象方法"""
        return await self.generate_completion(model_id, **kwargs)


class BaseEmbeddingProvider(BaseAPIProvider):
    """嵌入模型提供商基类"""
    
    async def generate_embedding(
        self, 
        model_id: str, 
        input_text: str, 
        **kwargs
    ) -> APIResponse:
        """生成嵌入向量"""
        data = {
            "model": model_id,
            "input": input_text,
            **kwargs
        }
        return await self._make_request("POST", "/embeddings", data)
    
    async def generate(self, model_id: str, **kwargs) -> APIResponse:
        """实现抽象方法"""
        return await self.generate_embedding(model_id, **kwargs)