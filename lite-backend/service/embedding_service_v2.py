"""
Embedding服务 V2 - 基于统一模型配置网关的新实现
使用 LLM Config Gateway (端口9050) 获取嵌入模型配置
"""
from abc import ABC, abstractmethod
from typing import Dict, List, Optional, Any, Type, Tuple
from dataclasses import dataclass
from enum import Enum
import httpx
import numpy as np
import asyncio
import time

# 导入新的统一模型配置客户端
from service.llm_config_gateway_client import (
    get_llm_config_gateway_client,
    get_default_embedding_config,
    get_available_embedding_models,
    gateway_health_check,
    ModelInfo
)

# 保留原有相关导入
from core.config_optimized import optimized_config_manager
from core.logger import logger

@dataclass
class EmbeddingResponseV2:
    """嵌入响应数据结构V2"""
    embeddings: List[List[float]]
    model: str
    provider: str
    dimension: int
    tokens_used: Optional[int] = None
    processing_time: Optional[float] = None
    # 新增字段
    gateway_source: bool = False  # 标识是否来自网关
    fallback_used: bool = False   # 标识是否使用了降级策略

class EmbeddingServiceV2:
    """嵌入服务V2 - 基于统一模型配置网关"""
    
    def __init__(self):
        self.client = None
        self._config_cache = {}
        self._config_cache_time = {}
        self._cache_ttl = 300  # 5分钟缓存
        
        # 降级策略相关
        self._gateway_available = None
        self._last_health_check = 0
        self._health_check_interval = 60  # 60秒检查一次
        
        # HTTP客户端
        self._http_client = httpx.AsyncClient(
            timeout=30.0,
            limits=httpx.Limits(max_keepalive_connections=5, max_connections=10)
        )
    
    async def _ensure_client(self):
        """确保客户端连接"""
        if self.client is None:
            self.client = await get_llm_config_gateway_client()
    
    async def _check_gateway_health(self) -> bool:
        """检查网关健康状态（带缓存）"""
        current_time = time.time()
        
        # 如果最近检查过且结果为可用，直接返回
        if (self._gateway_available and 
            current_time - self._last_health_check < self._health_check_interval):
            return True
        
        # 执行健康检查
        is_healthy = await gateway_health_check()
        self._gateway_available = is_healthy
        self._last_health_check = current_time
        
        if not is_healthy:
            logger.warning("LLM Config Gateway 不可用，嵌入服务将使用降级策略")
        
        return is_healthy
    
    async def get_embedding_config_from_gateway(self, 
                                              prefer_model: Optional[str] = None,
                                              prefer_provider: Optional[str] = None) -> Optional[Tuple[str, str, ModelInfo]]:
        """从网关获取嵌入模型配置"""
        try:
            await self._ensure_client()
            
            # 检查网关健康状态
            if not await self._check_gateway_health():
                return None
            
            # 如果指定了模型和厂商，查找具体信息
            if prefer_model and prefer_provider:
                available_models = await get_available_embedding_models()
                for model_info in available_models:
                    if (model_info.model_id == prefer_model and 
                        model_info.provider_name == prefer_provider):
                        return prefer_model, prefer_provider, model_info
                
                logger.warning(f"指定的嵌入模型不存在: {prefer_model} (厂商: {prefer_provider})")
            
            # 获取默认配置
            default_config = await get_default_embedding_config()
            if default_config:
                model, provider = default_config
                # 获取模型详细信息
                available_models = await get_available_embedding_models()
                for model_info in available_models:
                    if (model_info.model_id == model and 
                        model_info.provider_name == provider):
                        logger.info(f"使用网关默认嵌入模型: {model} (厂商: {provider})")
                        return model, provider, model_info
            
            # 如果没有默认配置，获取第一个可用模型
            available_models = await get_available_embedding_models()
            if available_models:
                first_model = available_models[0]
                logger.info(f"使用网关第一个可用嵌入模型: {first_model.model_id} (厂商: {first_model.provider_name})")
                return first_model.model_id, first_model.provider_name, first_model
            
            logger.warning("无法从网关获取任何可用嵌入模型")
            return None
            
        except Exception as e:
            logger.error(f"从网关获取嵌入模型配置失败: {e}")
            return None
    
    def get_fallback_embedding_config(self) -> Tuple[str, str]:
        """获取降级嵌入模型配置（从原有配置系统）"""
        try:
            # 尝试从原有配置系统获取
            embedding_config = optimized_config_manager.get_embedding_config()
            if embedding_config:
                # 从配置中提取第一个可用的嵌入模型
                for provider_name, provider_config in embedding_config.items():
                    if hasattr(provider_config, 'models') and provider_config.models:
                        first_model = provider_config.models[0]
                        model_id = getattr(first_model, 'id', 'text-embedding-v4')
                        logger.info(f"使用降级嵌入配置: {model_id} (厂商: {provider_name})")
                        return model_id, provider_name
        except Exception as e:
            logger.warning(f"获取原有嵌入配置失败: {e}")
        
        # 硬编码的最后降级选项
        fallback_model = "text-embedding-v4"
        fallback_provider = "alibaba"
        logger.warning(f"使用硬编码降级嵌入配置: {fallback_model} (厂商: {fallback_provider})")
        return fallback_model, fallback_provider
    
    async def resolve_embedding_config(self, 
                                     prefer_model: Optional[str] = None,
                                     prefer_provider: Optional[str] = None) -> Tuple[str, str, Optional[ModelInfo], bool, bool]:
        """解析嵌入模型配置（网关优先，降级支持）
        
        Returns:
            Tuple[model_id, provider, model_info, gateway_source, fallback_used]
        """
        
        # 优先从网关获取
        gateway_config = await self.get_embedding_config_from_gateway(prefer_model, prefer_provider)
        
        if gateway_config:
            model, provider, model_info = gateway_config
            return model, provider, model_info, True, False
        
        # 降级到原有配置系统
        logger.info("使用降级嵌入模型配置策略")
        model, provider = self.get_fallback_embedding_config()
        return model, provider, None, False, True
    
    async def create_embeddings_via_gateway(self, 
                                          model: str, 
                                          texts: List[str], 
                                          **kwargs) -> Optional[EmbeddingResponseV2]:
        """通过网关创建嵌入"""
        try:
            await self._ensure_client()
            
            # 使用网关的OpenAI兼容接口
            start_time = time.time()
            
            response = await self.client.create_embeddings(model, texts)
            
            processing_time = time.time() - start_time
            
            if response and 'data' in response:
                embeddings = []
                total_tokens = 0
                
                for item in response['data']:
                    embeddings.append(item['embedding'])
                
                # 获取使用情况
                usage = response.get('usage', {})
                total_tokens = usage.get('total_tokens', 0)
                
                # 确定维度
                dimension = len(embeddings[0]) if embeddings else 0
                
                return EmbeddingResponseV2(
                    embeddings=embeddings,
                    model=response.get('model', model),
                    provider="gateway",  # 标识为网关来源
                    dimension=dimension,
                    tokens_used=total_tokens,
                    processing_time=processing_time,
                    gateway_source=True,
                    fallback_used=False
                )
            else:
                logger.error("网关嵌入响应格式无效")
                return None
                
        except Exception as e:
            logger.error(f"通过网关创建嵌入失败: {e}")
            return None
    
    async def create_embeddings_fallback(self, 
                                       model: str, 
                                       provider: str,
                                       texts: List[str], 
                                       **kwargs) -> Optional[EmbeddingResponseV2]:
        """降级方式创建嵌入（直接调用厂商API）"""
        try:
            start_time = time.time()
            
            if provider == "alibaba":
                # 调用阿里云API
                result = await self._call_alibaba_embedding_api(model, texts, **kwargs)
            elif provider == "openai":
                # 调用OpenAI API
                result = await self._call_openai_embedding_api(model, texts, **kwargs)
            else:
                logger.error(f"不支持的降级厂商: {provider}")
                return None
            
            if result:
                processing_time = time.time() - start_time
                result.processing_time = processing_time
                result.gateway_source = False
                result.fallback_used = True
                return result
            else:
                return None
                
        except Exception as e:
            logger.error(f"降级方式创建嵌入失败: {e}")
            return None
    
    async def _call_alibaba_embedding_api(self, model: str, texts: List[str], **kwargs) -> Optional[EmbeddingResponseV2]:
        """调用阿里云嵌入API"""
        try:
            api_key = optimized_config_manager.get_alibaba_api_key()
            if not api_key:
                logger.error("未配置阿里云API密钥")
                return None
            
            url = "https://dashscope.aliyuncs.com/api/v1/services/embeddings/text-embedding/text-embedding"
            headers = {
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json"
            }
            
            payload = {
                "model": model,
                "input": {
                    "texts": texts
                },
                "parameters": kwargs
            }
            
            response = await self._http_client.post(url, json=payload, headers=headers)
            
            if response.status_code == 200:
                data = response.json()
                if data.get("output"):
                    embeddings = data["output"]["embeddings"]
                    dimension = len(embeddings[0]["embedding"]) if embeddings else 0
                    
                    return EmbeddingResponseV2(
                        embeddings=[item["embedding"] for item in embeddings],
                        model=model,
                        provider="alibaba",
                        dimension=dimension,
                        tokens_used=data.get("usage", {}).get("total_tokens"),
                        processing_time=None  # 将在调用方设置
                    )
            else:
                logger.error(f"阿里云嵌入API调用失败: {response.status_code}")
                return None
                
        except Exception as e:
            logger.error(f"调用阿里云嵌入API异常: {e}")
            return None
    
    async def _call_openai_embedding_api(self, model: str, texts: List[str], **kwargs) -> Optional[EmbeddingResponseV2]:
        """调用OpenAI嵌入API"""
        try:
            api_key = optimized_config_manager.get_openai_api_key()
            base_url = optimized_config_manager.get_openai_base_url() or "https://api.openai.com/v1"
            
            if not api_key:
                logger.error("未配置OpenAI API密钥")
                return None
            
            url = f"{base_url}/embeddings"
            headers = {
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json"
            }
            
            payload = {
                "model": model,
                "input": texts,
                **kwargs
            }
            
            response = await self._http_client.post(url, json=payload, headers=headers)
            
            if response.status_code == 200:
                data = response.json()
                embeddings = [item["embedding"] for item in data["data"]]
                dimension = len(embeddings[0]) if embeddings else 0
                
                return EmbeddingResponseV2(
                    embeddings=embeddings,
                    model=data.get("model", model),
                    provider="openai",
                    dimension=dimension,
                    tokens_used=data.get("usage", {}).get("total_tokens"),
                    processing_time=None  # 将在调用方设置
                )
            else:
                logger.error(f"OpenAI嵌入API调用失败: {response.status_code}")
                return None
                
        except Exception as e:
            logger.error(f"调用OpenAI嵌入API异常: {e}")
            return None
    
    async def create_embeddings_v2(self, 
                                 model_path: str, 
                                 texts: List[str], 
                                 **kwargs) -> Optional[EmbeddingResponseV2]:
        """创建嵌入V2主方法"""
        if not texts:
            logger.warning("输入文本列表为空")
            return None
        
        try:
            # 解析模型路径（支持 "provider/model" 格式）
            prefer_model = None
            prefer_provider = None
            
            if '/' in model_path:
                prefer_provider, prefer_model = model_path.split('/', 1)
            else:
                prefer_model = model_path
            
            # 解析配置
            model, provider, model_info, gateway_source, fallback_used = await self.resolve_embedding_config(
                prefer_model, prefer_provider
            )
            
            # 优先使用网关
            if gateway_source and await self._check_gateway_health():
                result = await self.create_embeddings_via_gateway(model, texts, **kwargs)
                if result:
                    logger.info(f"通过网关成功创建嵌入: {model} (厂商: {provider})")
                    return result
                else:
                    logger.warning("网关创建嵌入失败，尝试降级方式")
            
            # 降级方式
            result = await self.create_embeddings_fallback(model, provider, texts, **kwargs)
            if result:
                logger.info(f"通过降级方式成功创建嵌入: {model} (厂商: {provider})")
                return result
            else:
                logger.error(f"所有方式创建嵌入均失败: {model_path}")
                return None
                
        except Exception as e:
            logger.error(f"创建嵌入V2失败: {e}")
            return None
    
    async def get_supported_models_v2(self) -> Dict[str, List[ModelInfo]]:
        """获取支持的嵌入模型V2"""
        try:
            await self._ensure_client()
            
            if await self._check_gateway_health():
                models = await get_available_embedding_models()
                # 按厂商分组
                grouped_models = {}
                for model in models:
                    provider = model.provider_name
                    if provider not in grouped_models:
                        grouped_models[provider] = []
                    grouped_models[provider].append(model)
                
                return grouped_models
            else:
                logger.warning("网关不可用，返回降级模型列表")
                # TODO: 从原有配置系统获取模型列表
                return {}
                
        except Exception as e:
            logger.error(f"获取支持的模型失败: {e}")
            return {}
    
    async def validate_model_path_v2(self, model_path: str) -> bool:
        """验证嵌入模型路径是否有效V2"""
        try:
            models = await self.get_supported_models_v2()
            
            # 检查 provider/model 格式
            if '/' in model_path:
                provider, model = model_path.split('/', 1)
                if provider in models:
                    for model_info in models[provider]:
                        if model_info.model_id == model:
                            return True
            else:
                # 检查所有厂商中是否有该模型
                for provider_models in models.values():
                    for model_info in provider_models:
                        if model_info.model_id == model_path:
                            return True
            
            return False
            
        except Exception as e:
            logger.error(f"验证模型路径失败: {e}")
            return False
    
    async def close(self):
        """关闭服务"""
        try:
            if self._http_client:
                await self._http_client.aclose()
            if self.client:
                await self.client.client.aclose()
        except Exception as e:
            logger.warning(f"关闭嵌入服务失败: {e}")

# 全局嵌入服务V2实例
_embedding_service_v2 = None

async def get_embedding_service_v2() -> EmbeddingServiceV2:
    """获取嵌入服务V2单例"""
    global _embedding_service_v2
    if _embedding_service_v2 is None:
        _embedding_service_v2 = EmbeddingServiceV2()
    return _embedding_service_v2

# 便捷函数
async def create_embeddings_v2(model_path: str, texts: List[str], **kwargs) -> Optional[EmbeddingResponseV2]:
    """创建嵌入V2便捷函数"""
    service = await get_embedding_service_v2()
    return await service.create_embeddings_v2(model_path, texts, **kwargs)

async def get_supported_embedding_models_v2() -> Dict[str, List[ModelInfo]]:
    """获取支持的嵌入模型V2便捷函数"""
    service = await get_embedding_service_v2()
    return await service.get_supported_models_v2()