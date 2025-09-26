"""
每集合（知识库）Embedding 模型管理
- 读取/写入 knowledge_collections.config.embeddings
- 访问 9050 网关获取默认与可用Embedding模型
"""
from typing import Optional, Tuple, Dict, Any, List
from uuid import UUID

from core.logger import logger
from db.database import get_async_session
from sqlalchemy import text
from service.llm_config_gateway_client import (
    get_llm_config_gateway_client,
    get_available_embedding_models,
    get_default_embedding_config,
)


async def get_collection_embedding_config(collection_id: str) -> Optional[Dict[str, Any]]:
    """读取集合的 embedding 配置（config.embeddings）。"""
    try:
        async with get_async_session() as session:
            res = await session.execute(text("SELECT config FROM knowledge_collections WHERE id=:cid"), {"cid": collection_id})
            row = res.first()
            if not row:
                return None
            cfg = row[0] or {}
            emb = (cfg.get("embeddings") or cfg.get("embedding") or {}).copy()
            if not emb:
                return None
            return emb
    except Exception as e:
        logger.warning(f"[EmbeddingModelManager] 读取集合配置失败: {e}")
        return None


async def set_collection_embedding_config(collection_id: str, model_id: str, provider: str, dims: Optional[int] = None) -> bool:
    """写入集合的 embedding 配置。"""
    try:
        async with get_async_session() as session:
            # 读出现有 config
            res = await session.execute(text("SELECT config FROM knowledge_collections WHERE id=:cid FOR UPDATE"), {"cid": collection_id})
            row = res.first()
            if not row:
                return False
            cfg = row[0] or {}
            cfg.setdefault("embeddings", {})
            cfg["embeddings"]["model_id"] = model_id
            cfg["embeddings"]["provider"] = provider
            if dims:
                cfg["embeddings"]["dims"] = int(dims)
            await session.execute(
                text("UPDATE knowledge_collections SET config=:cfg WHERE id=:cid"),
                {"cid": collection_id, "cfg": cfg},
            )
            await session.commit()
            return True
    except Exception as e:
        logger.error(f"[EmbeddingModelManager] 写入集合配置失败: {e}")
        return False


async def get_model_for_collection(collection_id: Optional[str]) -> Optional[Tuple[str, str]]:
    """返回 (model_id, provider)。若集合未配置，则返回网关默认。"""
    try:
        if collection_id:
            emb = await get_collection_embedding_config(collection_id)
            if emb and emb.get("model_id") and emb.get("provider"):
                return emb["model_id"], emb["provider"]
        # 回退默认
        cfg = await get_default_embedding_config()
        if cfg:
            return cfg[0], cfg[1]
        return None
    except Exception as e:
        logger.warning(f"[EmbeddingModelManager] 获取集合模型失败: {e}")
        return None


async def list_gateway_embedding_models() -> List[Dict[str, Any]]:
    """列出网关可用的嵌入模型（已启用）。"""
    try:
        models = await get_available_embedding_models()
        out = []
        for m in models:
            out.append({
                "id": m.model_id,
                "display_name": m.display_name,
                "provider": m.provider_name,
                "provider_type": m.provider_type,
                "context_length": m.context_length,
                "capabilities": m.capabilities,
                "base_url": m.base_url,
            })
        return out
    except Exception as e:
        logger.error(f"[EmbeddingModelManager] 获取网关模型失败: {e}")
        return []


async def get_gateway_default_embedding() -> Optional[Dict[str, Any]]:
    cfg = await get_default_embedding_config()
    if not cfg:
        return None
    return {"model_id": cfg[0], "provider": cfg[1]}

