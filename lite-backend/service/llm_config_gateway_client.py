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
            urls = [f"{self.base_url}/v1/defaults/simple", f"{self.base_url}/v1/defaults"]
            for url in urls:
                try:
                    response = await self.client.get(url)
                    if response.status_code == 200:
                        data = response.json() or {}
                        self._set_cache(cache_key, data)
                        return data
                except Exception as ie:
                    logger.warning(f"默认配置接口访问失败 {url}: {ie}")
            logger.error("获取默认配置失败: 所有默认接口均不可用")
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
        defaults = await self.get_defaults_simple() or {}
        embedding_config = defaults.get('embedding', {}) or {}
        model = embedding_config.get('model')
        provider = embedding_config.get('provider')
        if model and provider:
            return model, provider
        # 回退：从启用模型中取第一个 embedding
        try:
            models = await self.list_models(model_type='embedding')
            if models:
                m = models[0]
                return m.model_id, (m.provider_name or '')
        except Exception:
            pass
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
        """获取模型列表（优先 /v1/models/enabled）"""
        cache_key = f"models_{provider_id}_{model_type}"
        if self._is_cache_valid(cache_key):
            return self._cache[cache_key]
            
        try:
            # 优先使用 /v1/models/enabled 并扁平化
            enabled_url = f"{self.base_url}/v1/models/enabled"
            resp = await self.client.get(enabled_url)
            models: List[ModelInfo] = []
            if resp.status_code == 200:
                data = resp.json() or {}
                for prov in data.get('providers', []) or []:
                    pname = prov.get('name') or ''
                    ptype = prov.get('type') or ''
                    for m in prov.get('models', []) or []:
                        if model_type and m.get('model_type') != model_type:
                            continue
                        mid = (m.get('model_id') or '').strip()
                        dname = (m.get('display_name') or mid).strip()
                        if not mid or mid.lower() == 'string' or dname.lower() == 'string':
                            continue
                        models.append(ModelInfo(
                            id=0,
                            model_id=mid,
                            display_name=dname,
                            model_type=m.get('model_type') or '',
                            provider_name=pname,
                            provider_type=ptype,
                            base_url='',
                        ))
                self._set_cache(cache_key, models)
                return models
            # 回退 /v1/models
            params = {"type": model_type} if model_type else None
            response = await self.client.get(f"{self.base_url}/v1/models", params=params)
            if response.status_code == 200:
                data = response.json() or []
                out: List[ModelInfo] = []
                for item in data:
                    mid = (item.get('model_id') or '').strip()
                    dname = (item.get('display_name') or mid).strip()
                    if not mid or mid.lower() == 'string' or dname.lower() == 'string':
                        continue
                    out.append(ModelInfo(
                        id=item.get('id') or 0,
                        model_id=mid,
                        display_name=dname,
                        model_type=item.get('model_type') or '',
                        provider_name='',
                        provider_type='',
                        base_url='',
                        context_length=item.get('context_length'),
                        capabilities=item.get('capabilities'),
                        pricing=item.get('pricing')
                    ))
                self._set_cache(cache_key, out)
                return out
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
            url = f"{self.base_url}/v1/chat/completions"
            start = time.time()
            response = await self.client.post(url, json=payload)
            elapsed_ms = int((time.time() - start) * 1000)
            if response.status_code == 200:
                logger.debug(f"[LLM-GW] chat ok {response.status_code} {elapsed_ms}ms model={model}")
                return response.json()
            else:
                # 打印详细错误（截断请求与响应）
                body_preview = None
                try:
                    body_preview = response.text[:500]
                except Exception:
                    body_preview = ""
                msg_preview = " | ".join([m.get('content','') for m in messages[:2] if isinstance(m, dict)])[:200]
                logger.error(
                    f"[LLM-GW] chat failed {response.status_code} {elapsed_ms}ms url={url} model={model} "
                    f"req_preview={msg_preview!r} resp_preview={body_preview!r}"
                )
                return {"error": "gateway_error", "status": response.status_code, "body": body_preview}
        except Exception as e:
            logger.error(f"[LLM-GW] chat exception url={self.base_url}/v1/chat/completions model={model} err={e}")
            return {"error": "exception", "message": str(e)}
    
    async def create_embeddings(self, model: str, input_text: Any) -> Dict:
        """创建嵌入 (OpenAI兼容接口)"""
        try:
            payload = {
                "model": model,
                "input": input_text
            }
            url = f"{self.base_url}/v1/embeddings"
            start = time.time()
            response = await self.client.post(url, json=payload)
            elapsed_ms = int((time.time() - start) * 1000)
            if response.status_code == 200:
                logger.debug(f"[LLM-GW] emb ok {response.status_code} {elapsed_ms}ms model={model} inputs={len(input_text) if isinstance(input_text, list) else 1}")
                return response.json()
            else:
                body = None
                try:
                    body = response.text[:500]
                except Exception:
                    body = ""
                # 打印请求与响应摘要，避免日志过大
                input_preview = None
                try:
                    if isinstance(input_text, list) and input_text:
                        input_preview = f"count={len(input_text)} first={repr(str(input_text[0])[:200])}"
                    else:
                        input_preview = repr(str(input_text)[:200])
                except Exception:
                    input_preview = "<unrepr>"
                logger.error(
                    f"[LLM-GW] emb failed {response.status_code} {elapsed_ms}ms url={url} model={model} "
                    f"input={input_preview} resp_preview={body!r}"
                )
                return {"error": "gateway_error", "status": response.status_code, "body": body}
        except Exception as e:
            logger.error(f"[LLM-GW] emb exception url={self.base_url}/v1/embeddings model={model} err={e}")
            return {"error": "exception", "message": str(e)}

# 全局客户端实例
_gateway_client = None

async def get_llm_config_gateway_client() -> LLMConfigGatewayClient:
    """获取LLM配置网关客户端单例"""
    global _gateway_client
    if _gateway_client is None:
        _gateway_client = LLMConfigGatewayClient()
        try:
            logger.info(f"[LLM-GW] client initialized base_url={_gateway_client.base_url}")
        except Exception:
            pass
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
