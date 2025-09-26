"""
Embedding服务 - 支持多种嵌入模型提供商
"""
from abc import ABC, abstractmethod
from typing import Dict, List, Optional, Any, Type
from dataclasses import dataclass
from enum import Enum
import httpx
import numpy as np
import asyncio

from core.config_optimized import optimized_config_manager
from core.base_provider import BaseEmbeddingProvider as BaseProvider, BaseProviderManager
from service.llm_config_gateway_client import get_llm_config_gateway_client
from core.logger import logger


class EmbeddingProvider(Enum):
    """嵌入模型提供商枚举 - 按实际厂商分类"""
    ALIBABA_EMBEDDING = "alibaba"    # 阿里云嵌入模型
    OPENAI_EMBEDDING = "openai"      # OpenAI嵌入模型
    CUSTOM_EMBEDDING = "custom"      # 自定义嵌入模型
    
    # 向后兼容的别名 (逐步废弃)
    QWEN_EMBEDDING = "alibaba"       # @deprecated: 使用 ALIBABA_EMBEDDING
    # 注意: 移除了 ONE_API_EMBEDDING，因为它是中转网关而非模型提供商


@dataclass
class EmbeddingResponse:
    """嵌入响应数据结构"""
    embeddings: List[List[float]]
    model: str
    provider: str
    dimension: int
    tokens_used: Optional[int] = None
    processing_time: Optional[float] = None


class BaseEmbeddingProvider(ABC):
    """嵌入模型提供商基类"""
    
    def __init__(self, config: Any):
        self.config = config
        self.models = {model.id: model for model in config.models}
        # 改进HTTP客户端配置，增加连接池管理和重试机制
        self.client = httpx.AsyncClient(
            timeout=30.0,
            limits=httpx.Limits(max_keepalive_connections=5, max_connections=10),
            transport=httpx.AsyncHTTPTransport(retries=1)
        )
    
    @abstractmethod
    async def create_embeddings(self, texts: List[str], model_id: str, **kwargs) -> EmbeddingResponse:
        """创建文本嵌入"""
        pass
    
    @abstractmethod
    def get_supported_models(self) -> List[str]:
        """获取支持的模型列表"""
        pass
    
    def get_model_config(self, model_id: str) -> Optional[Any]:
        """获取模型配置"""
        return self.models.get(model_id)
    
    async def close(self):
        """关闭HTTP客户端"""
        await self.client.aclose()


class QwenEmbeddingProvider(BaseEmbeddingProvider):
    """通义千问嵌入模型提供商"""
    
    async def create_embeddings(self, texts: List[str], model_id: str, **kwargs) -> EmbeddingResponse:
        """创建Qwen嵌入"""
        model_config = self.get_model_config(model_id)
        if not model_config:
            raise ValueError(f"不支持的Qwen嵌入模型: {model_id}")
        
        # 重试机制
        max_retries = 3
        last_error = None
        
        for attempt in range(max_retries):
            try:
                headers = {
                    "Authorization": f"Bearer {self.config.api_key}",
                    "Content-Type": "application/json",
                }
                
                data = {
                    "model": model_id,
                    "input": texts
                }
                
                response = await self.client.post(
                    f"{self.config.base_url}/embeddings",
                    headers=headers,
                    json=data
                )
                response.raise_for_status()
                
                result = response.json()
                embeddings = [item["embedding"] for item in result["data"]]
                
                return EmbeddingResponse(
                    embeddings=embeddings,
                    model=model_id,
                    provider="qwen_embedding",
                    dimension=len(embeddings[0]) if embeddings else 0,
                    tokens_used=result.get("usage", {}).get("total_tokens")
                )
                
            except httpx.HTTPStatusError as e:
                error_detail = f"HTTP {e.response.status_code}: {e.response.text}"
                last_error = f"API调用失败: {error_detail}"
                logger.error(f"Qwen嵌入API HTTP错误 (尝试 {attempt + 1}/{max_retries}): {error_detail}")
                if attempt < max_retries - 1:
                    await asyncio.sleep(1 * (attempt + 1))  # 递增延迟
                    continue
            except httpx.TimeoutException as e:
                last_error = f"API调用超时: {e}"
                logger.error(f"Qwen嵌入API超时 (尝试 {attempt + 1}/{max_retries}): {e}")
                if attempt < max_retries - 1:
                    await asyncio.sleep(2 * (attempt + 1))  # 递增延迟
                    continue
            except (RuntimeError, httpx.ConnectError, httpx.RemoteProtocolError) as e:
                # 连接相关错误，需要重新创建客户端
                last_error = f"连接错误: {type(e).__name__}: {e}"
                logger.warning(f"Qwen嵌入API连接错误 (尝试 {attempt + 1}/{max_retries}): {last_error}")
                
                if attempt < max_retries - 1:
                    # 重新创建HTTP客户端
                    await self.client.aclose()
                    self.client = httpx.AsyncClient(
                        timeout=30.0,
                        limits=httpx.Limits(max_keepalive_connections=5, max_connections=10),
                        transport=httpx.AsyncHTTPTransport(retries=1)
                    )
                    await asyncio.sleep(2 * (attempt + 1))  # 递增延迟
                    continue
            except Exception as e:
                last_error = f"{type(e).__name__}: {e}"
                logger.error(f"Qwen嵌入API调用失败 (尝试 {attempt + 1}/{max_retries}): {type(e).__name__}: {e}")
                if attempt < max_retries - 1:
                    await asyncio.sleep(1 * (attempt + 1))  # 递增延迟
                    continue
        
        # 所有重试都失败了
        raise Exception(f"API调用失败，已重试{max_retries}次: {last_error}")
    
    def get_supported_models(self) -> List[str]:
        """获取支持的Qwen嵌入模型"""
        return list(self.models.keys())


class CustomEmbeddingProvider(BaseEmbeddingProvider):
    """自定义嵌入模型提供商"""
    
    async def create_embeddings(self, texts: List[str], model_id: str, **kwargs) -> EmbeddingResponse:
        """创建自定义嵌入"""
        model_config = self.get_model_config(model_id)
        if not model_config:
            raise ValueError(f"不支持的自定义嵌入模型: {model_id}")
        
        try:
            headers = {
                "Authorization": f"Bearer {self.config.api_key}",
                "Content-Type": "application/json",
            }
            
            # 假设自定义服务使用类似OpenAI的API格式
            data = {
                "model": model_id,
                "input": texts
            }
            
            response = await self.client.post(
                f"{self.config.base_url}/embeddings",
                headers=headers,
                json=data
            )
            response.raise_for_status()
            
            result = response.json()
            embeddings = [item["embedding"] for item in result["data"]]
            
            return EmbeddingResponse(
                embeddings=embeddings,
                model=model_id,
                provider="custom_embedding",
                dimension=len(embeddings[0]) if embeddings else 0,
                tokens_used=result.get("usage", {}).get("total_tokens")
            )
            
        except (RuntimeError, httpx.ConnectError, httpx.RemoteProtocolError) as e:
            logger.warning(f"自定义嵌入API连接错误: {e}")
            # 重新创建HTTP客户端并重试一次
            await self.client.aclose()
            self.client = httpx.AsyncClient(
                timeout=30.0,
                limits=httpx.Limits(max_keepalive_connections=5, max_connections=10),
                transport=httpx.AsyncHTTPTransport(retries=1)
            )
            # 重试一次
            try:
                response = await self.client.post(
                    f"{self.config.base_url}/embeddings",
                    headers=headers,
                    json=data
                )
                response.raise_for_status()
                result = response.json()
                embeddings = [item["embedding"] for item in result["data"]]
                
                return EmbeddingResponse(
                    embeddings=embeddings,
                    model=model_id,
                    provider="custom_embedding",
                    dimension=len(embeddings[0]) if embeddings else 0,
                    tokens_used=result.get("usage", {}).get("total_tokens")
                )
            except Exception as retry_e:
                logger.error(f"自定义嵌入API重试失败: {retry_e}")
                raise
        except Exception as e:
            logger.error(f"自定义嵌入API调用失败: {e}")
            raise
    
    def get_supported_models(self) -> List[str]:
        """获取支持的自定义嵌入模型"""
        return list(self.models.keys())




class OneAPIEmbeddingProvider(BaseEmbeddingProvider):
    """One-API嵌入模型提供商"""
    
    async def create_embeddings(self, texts: List[str], model_id: str, **kwargs) -> EmbeddingResponse:
        """创建One-API嵌入"""
        model_config = self.get_model_config(model_id)
        if not model_config:
            raise ValueError(f"不支持的One-API嵌入模型: {model_id}")
        
        try:
            headers = {
                "Authorization": f"Bearer {self.config.api_key}",
                "Content-Type": "application/json",
            }
            
            # One-API向量模型请求格式
            data = {
                "input": texts[0] if len(texts) == 1 else texts,  # 支持单个文本或文本列表
                "model": model_id,
                            }
            
            response = await self.client.post(
                f"{self.config.base_url}/embeddings",
                headers=headers,
                json=data
            )
            response.raise_for_status()
            
            result = response.json()
            
            # 处理响应格式
            if isinstance(result.get("data"), list):
                embeddings = [item["embedding"] for item in result["data"]]
            else:
                # 如果返回的是单个向量
                embeddings = [result.get("embedding", [])]
            
            return EmbeddingResponse(
                embeddings=embeddings,
                model=model_id,
                provider="custom",
                dimension=len(embeddings[0]) if embeddings and embeddings[0] else 0,
                tokens_used=result.get("usage", {}).get("total_tokens"),
                processing_time=None
            )
            
        except Exception as e:
            logger.error(f"One-API嵌入API调用失败: {e}")
            raise
    
    def get_supported_models(self) -> List[str]:
        """获取支持的One-API嵌入模型"""
        return list(self.models.keys())


class EmbeddingServiceFactory:
    """嵌入服务工厂"""
    
    _providers: Dict[str, Type[BaseEmbeddingProvider]] = {
        # 主要提供商映射 (按实际厂商)
        "alibaba": QwenEmbeddingProvider,      # 阿里云嵌入模型
        "openai": CustomEmbeddingProvider,     # OpenAI嵌入模型  
        "custom": CustomEmbeddingProvider,     # 自定义嵌入模型
        
        # 向后兼容映射 (逐步废弃)
        EmbeddingProvider.QWEN_EMBEDDING.value: QwenEmbeddingProvider,    # alibaba
        EmbeddingProvider.CUSTOM_EMBEDDING.value: CustomEmbeddingProvider, # custom
        # 注意: 移除了 ONE_API_EMBEDDING 映射，因为它是中转网关而非模型提供商
    }
    
    _instances: Dict[str, BaseEmbeddingProvider] = {}
    
    @classmethod
    async def get_provider(cls, provider_name: str) -> BaseEmbeddingProvider:
        """获取嵌入提供商实例"""
        if provider_name not in cls._instances:
            # 从配置中获取嵌入提供商配置
            provider_config = cls._get_embedding_provider_config(provider_name)
            if not provider_config:
                raise ValueError(f"未找到嵌入提供商配置: {provider_name}")
            
            provider_class = cls._providers.get(provider_name)
            if not provider_class:
                raise ValueError(f"不支持的嵌入提供商: {provider_name}")
            
            cls._instances[provider_name] = provider_class(provider_config)
        
        return cls._instances[provider_name]
    
    @classmethod
    def _get_embedding_provider_config(cls, provider_name: str) -> Optional[Any]:
        """获取嵌入提供商配置"""
        try:
            # 优先使用统一模型网关（llm-config-gateway）默认配置
            try:
                from service.llm_unified_config_service import llm_unified_config_service
                import os as _os
                snap = llm_unified_config_service.get_snapshot() or {}
                defaults = snap.get('defaults') or {}
                gw = _os.getenv('LLM_CONFIG_GATEWAY_URL', 'http://127.0.0.1:9050').rstrip('/') + '/v1'
                if defaults and provider_name in ('custom', 'openai', 'alibaba'):
                    default_embedding = defaults.get('default_embedding')
                    if default_embedding:
                        from core.config_optimized import ModelConfig
                        model_cfg = ModelConfig(
                            id=default_embedding,
                            name=default_embedding,
                            model_name=default_embedding,
                            provider='gateway',
                            dimension=0
                        )
                        return type('LLMProviderConfig', (), {
                            'api_key': '',
                            'base_url': gw,
                            'models': [model_cfg],
                            'provider_name': provider_name,
                        })()
            except Exception as _ge:
                logger.debug(f"[EMB] 统一网关默认配置读取失败或未设置: {_ge}")
            
            # 对于alibaba，使用环境变量直接配置（临时修复）
            if provider_name == 'alibaba':
                import os
                api_key = os.getenv('ONE_API_KEY')
                base_url = os.getenv('ONE_API_BASE_URL')
                
                if api_key and base_url:
                    from core.config_optimized import ModelConfig
                    alibaba_model = ModelConfig(
                        id='Qwen/Qwen3-Embedding-4B',
                        name='Qwen/Qwen3-Embedding-4B',
                        model_name='Qwen/Qwen3-Embedding-4B',
                        provider='oneapi',
                        dimension=2560
                    )
                    
                    return type('LLMProviderConfig', (), {
                        'api_key': api_key,
                        'base_url': base_url,
                        'models': [alibaba_model],
                        'provider_name': provider_name,
                    })()
                else:
                    logger.warning(f"环境变量 ONE_API_KEY 或 ONE_API_BASE_URL 未设置")
                    return None
            
            # 对于其他提供商，使用标准配置系统
            provider_config = optimized_config_manager.get_provider_config(provider_name, "embeddings")
            
            if not provider_config:
                return None
            
            # 获取API配置（自动处理网关和直连选择）
            api_config = optimized_config_manager.get_api_config(provider_name, "embeddings")
            
            # 创建兼容的配置对象
            return type('LLMProviderConfig', (), {
                'api_key': api_config.api_key if api_config else '',
                'base_url': api_config.base_url if api_config else '',
                'models': provider_config.models,
                'provider_name': provider_name,
            })()
            
        except Exception as e:
            logger.error(f"获取嵌入提供商配置失败: {e}")
            return None
    
    @classmethod
    async def create_embeddings(cls, model_path: str, texts: List[str], **kwargs) -> EmbeddingResponse:
        """统一通过9050网关创建嵌入（禁用直连/回退）。"""
        try:
            client = await get_llm_config_gateway_client()
            # 解析模型ID：允许传入 'provider/model' 或直接 'model'
            model_id = model_path.split('/', 1)[1] if '/' in model_path else model_path
            logger.info(
                f"[EMB] request via gateway model={model_id} texts={len(texts)} first={repr((texts[0] if texts else '')[:120])}"
            )
            resp = await client.create_embeddings(model_id, texts)
            if not resp or 'data' not in resp or not resp['data']:
                # 详细错误透传
                if isinstance(resp, dict) and resp.get('error'):
                    logger.error(f"[EMB] gateway error status={resp.get('status')} body={resp.get('body')}")
                raise RuntimeError("网关未返回embedding结果")
            vectors = [item.get('embedding') for item in resp['data'] if item.get('embedding')]
            if not vectors:
                raise RuntimeError("网关未返回有效embedding数组")
            dim = len(vectors[0])
            return EmbeddingResponse(
                embeddings=vectors,
                model=resp.get('model', model_id),
                provider='gateway',
                dimension=dim,
                tokens_used=(resp.get('usage') or {}).get('total_tokens')
            )
        except Exception as e:
            logger.error(f"通过网关创建嵌入失败: {e}")
            raise
    
    @classmethod
    async def get_all_models(cls) -> Dict[str, List[str]]:
        """获取所有支持的嵌入模型"""
        all_models = {}
        for provider_name in cls._providers.keys():
            try:
                provider = await cls.get_provider(provider_name)
                all_models[provider_name] = provider.get_supported_models()
            except Exception as e:
                logger.warning(f"获取嵌入提供商 {provider_name} 的模型列表失败: {e}")
                all_models[provider_name] = []
        return all_models
    
    @classmethod
    async def close_all(cls):
        """关闭所有提供商的HTTP客户端"""
        for provider in cls._instances.values():
            await provider.close()
        cls._instances.clear()


class EmbeddingService:
    """嵌入服务主类"""
    
    def __init__(self):
        self.factory = EmbeddingServiceFactory()
    
    async def create_embeddings(self, model_path: str, texts: List[str], **kwargs) -> EmbeddingResponse:
        """创建嵌入"""
        return await self.factory.create_embeddings(model_path, texts, **kwargs)
    
    async def get_supported_models(self) -> Dict[str, List[str]]:
        """获取所有支持的嵌入模型"""
        return await self.factory.get_all_models()
    
    async def validate_model_path(self, model_path: str) -> bool:
        """验证嵌入模型路径是否有效"""
        try:
            provider_name, model_id = model_path.split('/', 1)
            provider = await self.factory.get_provider(provider_name)
            return model_id in provider.get_supported_models()
        except Exception:
            return False
    
    async def close(self):
        """关闭服务"""
        await self.factory.close_all()


# 全局嵌入服务实例
embedding_service = EmbeddingService()
