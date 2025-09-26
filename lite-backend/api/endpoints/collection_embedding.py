from typing import Any, Dict, Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from core.logger import logger
from service.embedding_model_manager import (
    get_collection_embedding_config,
    set_collection_embedding_config,
    list_gateway_embedding_models,
    get_gateway_default_embedding,
)
from service.collection_revectorize_executor import start_revectorize_task
try:
    from service.redis_support import throttle
except Exception:  # optional
    throttle = None  # type: ignore

router = APIRouter(prefix="/collections", tags=["Embedding 模型"])


class SetEmbeddingModelRequest(BaseModel):
    model_id: str
    provider: str
    dryRun: Optional[bool] = False
    forceReindex: Optional[bool] = True


@router.get("/{collection_id}/embedding-model")
async def get_collection_embedding_model(collection_id: str) -> Dict[str, Any]:
    try:
        current = await get_collection_embedding_config(collection_id)
        default = await get_gateway_default_embedding() or {}
        models = await list_gateway_embedding_models()
        # UI 要求：默认模型名始终显示（不做空判断）
        return {
            "collection_id": collection_id,
            "current": current or {},
            "default": default,  # 若网关不可用，此处为空对象
            "available_models": models,
        }
    except Exception as e:
        logger.error(f"获取集合Embedding模型失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{collection_id}/embedding-model/set")
async def set_collection_embedding_model(collection_id: str, req: SetEmbeddingModelRequest) -> Dict[str, Any]:
    try:
        # dryRun: 简单校验模型是否在可用列表中
        models = await list_gateway_embedding_models()
        exists = any(m.get('id') == req.model_id and (m.get('provider') == req.provider or True) for m in models)
        if req.dryRun:
            return {"ok": exists, "dryRun": True, "message": "模型可用" if exists else "模型不存在或未启用"}
        if not exists:
            raise HTTPException(status_code=400, detail="模型不存在或未启用")
        # 写入集合配置
        ok = await set_collection_embedding_config(collection_id, req.model_id, req.provider)
        if not ok:
            raise HTTPException(status_code=500, detail="写入集合Embedding配置失败")
        # 触发重向量化（骨架占位）：返回sessionId供前端订阅
        session_id = f"revector_{collection_id}"
        if req.forceReindex:
            # 节流：同一集合重向量化 5 分钟内仅允许一次
            try:
                if throttle is not None:
                    allowed = await throttle(f"knowledge:throttle:revectorize:{collection_id}", 300)
                    if not allowed:
                        raise HTTPException(status_code=429, detail="重向量化过于频繁，请稍后再试")
            except HTTPException:
                raise
            except Exception:
                pass
            task_id = await start_revectorize_task(collection_id, session_id=session_id)
            return {"ok": True, "session_id": session_id, "task_id": task_id, "scheduled": True}
        return {"ok": True, "session_id": session_id, "scheduled": False}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"设置集合Embedding模型失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{collection_id}/embedding-model/revectorize")
async def revectorize_collection(collection_id: str) -> Dict[str, Any]:
    try:
        # 节流：同一集合重向量化 5 分钟内仅允许一次
        try:
            if throttle is not None:
                allowed = await throttle(f"knowledge:throttle:revectorize:{collection_id}", 300)
                if not allowed:
                    raise HTTPException(status_code=429, detail="重向量化过于频繁，请稍后再试")
        except HTTPException:
            raise
        except Exception:
            pass
        session_id = f"revector_{collection_id}"
        task_id = await start_revectorize_task(collection_id, session_id=session_id)
        return {"ok": True, "session_id": session_id, "task_id": task_id}
    except Exception as e:
        logger.error(f"触发重向量化失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))
