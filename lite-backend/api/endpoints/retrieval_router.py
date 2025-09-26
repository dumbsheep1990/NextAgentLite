from typing import Dict, Any, Optional

from fastapi import APIRouter, Body

from core.logger import logger
from db.database import get_async_session
from service.retrieval_router_service import routed_retrieval as service_routed_retrieval
from service.hybrid_search_service import hybrid_search_service


router = APIRouter()

@router.post("/api/v1/retrieval/query")
async def routed_retrieval(
    payload: Dict[str, Any] = Body(
        ..., 
        example={
            "query": "地聚物材料的强度影响因素",
            "collectionId": "default_collection",
            "mode": "auto",  # auto|hybrid|hirag
            "topK": 10,
            "fallbackToHybrid": True,
            "hiragMode": "hi",  # hi|naive|hi_local|hi_global|hi_bridge|hi_nobridge
            "filters": {}
        },
    )
) -> Dict[str, Any]:
    """根据集合检索模式路由到 hybrid 或 hirag 检索。
    - mode=auto: 读取集合配置('hirag'|'hybrid')
    - mode=hirag/hybrid: 强制指定
    - fallbackToHybrid: 当 hirag 未就绪时，是否回退到 hybrid
    """
    query = payload.get("query", "")
    collection_id = payload.get("collectionId")
    requested_mode = (payload.get("mode") or "auto").lower()
    top_k = int(payload.get("topK", 10))
    filters = payload.get("filters") or {}
    fallback = bool(payload.get("fallbackToHybrid", True))
    hirag_mode = (payload.get("hiragMode") or "hi").lower()
    retrieval_template_id = payload.get("retrievalTemplateId") or payload.get("retrieval_template_id")

    if not query:
        return {"success": False, "error": "query is required"}
    if not collection_id:
        return {"success": False, "error": "collectionId is required"}

    try:
        return await service_routed_retrieval(
            query=query,
            collection_id=collection_id,
            mode=requested_mode,
            top_k=top_k,
            filters=filters,
            fallback_to_hybrid=fallback,
            hirag_mode=hirag_mode,
            retrieval_template_id=retrieval_template_id,
        )
    except Exception as e:
        logger.error(f"[RetrievalRouter] routed_retrieval failed: {e}")
        return {"success": False, "error": str(e)}


@router.post("/api/v1/retrieval/debug")
async def retrieval_debug(
    payload: Dict[str, Any] = Body(
        ...,
        example={
            "query": "介绍混凝土外加剂分类",
            "collectionId": "default_collection",
            "topK": 5,
            "filters": {},
            "ensureIndex": False,
            "indexing": "none",  # none|hnsw
        },
    )
) -> Dict[str, Any]:
    """检索诊断端点：返回是否生成向量、ES took/hits、前几条标题等。"""
    query = payload.get("query", "")
    collection_id = payload.get("collectionId")
    top_k = int(payload.get("topK", 5))
    filters = payload.get("filters") or {}
    ensure_index = bool(payload.get("ensureIndex", False))
    indexing = (payload.get("indexing") or "none").lower()

    if not query:
        return {"success": False, "error": "query is required"}
    if not collection_id:
        return {"success": False, "error": "collectionId is required"}

    diag: Dict[str, Any] = {"success": True}
    try:
        if ensure_index:
            idx_info = await hybrid_search_service.ensure_index(force=False, dims=1024, indexing=indexing)
            diag["index_info"] = idx_info
    except Exception as e:
        diag["index_error"] = str(e)

    try:
        info = await hybrid_search_service.diagnose(
            query=query, top_k=top_k, filters=filters, collection_id=collection_id
        )
        diag.update(info)
    except Exception as e:
        diag["error"] = str(e)
        diag.setdefault("success", False)
    return diag
