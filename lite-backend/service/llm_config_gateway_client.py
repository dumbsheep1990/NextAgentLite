"""
LLM Config Gateway 客户端
与端口9050的统一模型配置服务进行交互
"""
import asyncio
import httpx
import json
import time
from typing import Dict, List, Optional, Any, Tuple
from dataclasses import dataclass
from core.logger import logger

@dataclass
class ModelInfo:
    """模型信息"""
    id: int
    model_id: str
    display_name: str
    model_type: str  # chat, embedding
    provider_name: str
    provider_type: str
    base_url: str
    context_length: Optional[int] = None
    capabilities: Optional[Dict] = None
    pricing: Optional[Dict] = None

@dataclass
class ProviderInfo:
    """厂商信息"""
    id: int
    name: str
    type: str
    base_url: str
    status: str

class LLMConfigGatewayClient:
    """LLM配置网关客户端"""
    
    def __init__(self, base_url: str = "http://localhost:9050"):
        self.base_url = base_url.rstrip('/')
        self.client = httpx.AsyncClient(timeout=30.0)
        
        # 缓存机制
        self._cache = {}
        self._cache_ttl = 300  # 5分钟缓存
        self._last_cache_time = {}
        
    async def __aenter__(self):
        return self
        
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        await self.client.aclose()
    
    def _is_cache_valid(self, key: str) -> bool:
        """检查缓存是否有效"""
        if key not in self._cache:
            return False
        if key not in self._last_cache_time:
            return False
        return time.time() - self._last_cache_time[key] < self._cache_ttl
    
    def _set_cache(self, key: str, value: Any) -> None:
        """设置缓存"""
        self._cache[key] = value
        self._last_cache_time[key] = time.time()
    
    async def health_check(self) -> bool:
        """健康检查"""
        try:
            response = await self.client.get(f"{self.base_url}/health")
            return response.status_code == 200
        except Exception as e:
            logger.warning(f"LLM Config Gateway健康检查失败: {e}")
            return False
    
    async def get_defaults_simple(self) -> Dict[str, Any]:
        """获取简化的默认配置"""
        cache_key = "defaults_simple"
        if self._is_cache_valid(cache_key):
            return self._cache[cache_key]
            
        try:
            response = await self.client.get(f"{self.base_url}/v1/defaults/simple")
            if response.status_code == 200:
                data = response.json()
                self._set_cache(cache_key, data)
                return data
            else:
                logger.error(f"获取默认配置失败: {response.status_code}")
                return {}
        except Exception as e:
            logger.error(f"获取默认配置异常: {e}")
            return {}
    
    async def get_default_chat_model(self) -> Optional[Tuple[str, str]]:
        """获取默认聊天模型 (model, provider)"""
        defaults = await self.get_defaults_simple()
        chat_config = defaults.get('chat', {})
        model = chat_config.get('model')
        provider = chat_config.get('provider')
        if model and provider:
            return model, provider
        return None
    
    async def get_default_embedding_model(self) -> Optional[Tuple[str, str]]:
        """获取默认嵌入模型 (model, provider)"""
        defaults = await self.get_defaults_simple()
        embedding_config = defaults.get('embedding', {})
        model = embedding_config.get('model')
        provider = embedding_config.get('provider')
        if model and provider:
            return model, provider
        return None
    
    async def list_providers(self) -> List[ProviderInfo]:
        """获取厂商列表"""
        cache_key = "providers"
        if self._is_cache_valid(cache_key):
            return self._cache[cache_key]
            
        try:
            response = await self.client.get(f"{self.base_url}/v1/providers")
            if response.status_code == 200:
                data = response.json()
                providers = []
                for item in data:
                    providers.append(ProviderInfo(
                        id=item.get('id'),
                        name=item.get('name'),
                        type=item.get('type'),
                        base_url=item.get('base_url'),
                        status=item.get('status', 'unknown')
                    ))
                self._set_cache(cache_key, providers)
                return providers
            else:
                logger.error(f"获取厂商列表失败: {response.status_code}")
                return []
        except Exception as e:
            logger.error(f"获取厂商列表异常: {e}")
            return []
    
    async def list_models(self, provider_id: Optional[int] = None, model_type: Optional[str] = None) -> List[ModelInfo]:
        """获取模型列表"""
        cache_key = f"models_{provider_id}_{model_type}"
        if self._is_cache_valid(cache_key):
            return self._cache[cache_key]
            
        try:
            params = {}
            if provider_id:
                params['provider_id'] = str(provider_id)
            if model_type:
                params['type'] = model_type
                
            response = await self.client.get(f"{self.base_url}/v1/models", params=params)
            if response.status_code == 200:
                data = response.json()
                models = []
                for item in data:
                    provider_info = item.get('provider', {})
                    models.append(ModelInfo(
                        id=item.get('id'),
                        model_id=item.get('model_id'),
                        display_name=item.get('display_name'),
                        model_type=item.get('model_type'),
                        provider_name=provider_info.get('name', ''),
                        provider_type=provider_info.get('type', ''),
                        base_url=provider_info.get('base_url', ''),
                        context_length=item.get('context_length'),
                        capabilities=item.get('capabilities'),
                        pricing=item.get('pricing')
                    ))
                self._set_cache(cache_key, models)
                return models
            else:
                logger.error(f"获取模型列表失败: {response.status_code}")
                return []
        except Exception as e:
            logger.error(f"获取模型列表异常: {e}")
            return []
    
    async def get_chat_models(self) -> List[ModelInfo]:
        """获取聊天模型列表"""
        return await self.list_models(model_type="chat")
    
    async def get_embedding_models(self) -> List[ModelInfo]:
        """获取嵌入模型列表"""
        return await self.list_models(model_type="embedding")
    
    async def set_defaults(self, 
                          default_model: Optional[str] = None, 
                          default_embedding: Optional[str] = None,
                          provider: Optional[str] = None) -> bool:
        """设置默认模型"""
        try:
            payload = {}
            if default_model:
                payload['default_model'] = default_model
            if default_embedding:
                payload['default_embedding'] = default_embedding
            if provider:
                payload['provider'] = provider
                
            response = await self.client.post(
                f"{self.base_url}/v1/defaults/simple", 
                json=payload
            )
            
            if response.status_code == 200:
                # 清除相关缓存
                self._cache.pop("defaults_simple", None)
                self._last_cache_time.pop("defaults_simple", None)
                return True
            else:
                logger.error(f"设置默认模型失败: {response.status_code}")
                return False
        except Exception as e:
            logger.error(f"设置默认模型异常: {e}")
            return False
    
    async def create_chat_completion(self, model: str, messages: List[Dict], **kwargs) -> Dict:
        """创建聊天完成 (OpenAI兼容接口)"""
        try:
            payload = {
                "model": model,
                "messages": messages,
                **kwargs
            }
            
            response = await self.client.post(
                f"{self.base_url}/v1/chat/completions",
                json=payload
            )
            
            if response.status_code == 200:
                return response.json()
            else:
                logger.error(f"聊天完成请求失败: {response.status_code}")
                return {}
        except Exception as e:
            logger.error(f"聊天完成请求异常: {e}")
            return {}
    
    async def create_embeddings(self, model: str, input_text: Any) -> Dict:
        """创建嵌入 (OpenAI兼容接口)"""
        try:
            payload = {
                "model": model,
                "input": input_text
            }
            
            response = await self.client.post(
                f"{self.base_url}/v1/embeddings",
                json=payload
            )
            
            if response.status_code == 200:
                return response.json()
            else:
                logger.error(f"嵌入请求失败: {response.status_code}")
                return {}
        except Exception as e:
            logger.error(f"嵌入请求异常: {e}")
            return {}

# 全局客户端实例
_gateway_client = None

async def get_llm_config_gateway_client() -> LLMConfigGatewayClient:
    """获取LLM配置网关客户端单例"""
    global _gateway_client
    if _gateway_client is None:
        _gateway_client = LLMConfigGatewayClient()
    return _gateway_client

# 便捷函数
async def get_default_chat_config() -> Optional[Tuple[str, str]]:
    """获取默认聊天模型配置"""
    client = await get_llm_config_gateway_client()
    return await client.get_default_chat_model()

async def get_default_embedding_config() -> Optional[Tuple[str, str]]:
    """获取默认嵌入模型配置"""
    client = await get_llm_config_gateway_client()
    return await client.get_default_embedding_model()

async def get_available_chat_models() -> List[ModelInfo]:
    """获取可用的聊天模型列表"""
    client = await get_llm_config_gateway_client()
    return await client.get_chat_models()

async def get_available_embedding_models() -> List[ModelInfo]:
    """获取可用的嵌入模型列表"""
    client = await get_llm_config_gateway_client()
    return await client.get_embedding_models()

async def gateway_health_check() -> bool:
    """检查网关服务健康状态"""
    client = await get_llm_config_gateway_client()
    return await client.health_check()