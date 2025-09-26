from typing import Dict, Any, Optional, List
from uuid import UUID
from core.logger import logger
from db.database import get_async_session
from service.hybrid_search_service import HybridSearchService
from service.hirag_agno_integration import HiRAGTools
from service.llm_config_gateway_client import LLMConfigGatewayClient

_hybrid = HybridSearchService()
_hirag_tools: Optional[HiRAGTools] = None
_qa_routing_service = None


async def _ensure_hirag_tools() -> Optional[HiRAGTools]:
    global _hirag_tools
    if _hirag_tools is not None:
        return _hirag_tools
    try:
        async with LLMConfigGatewayClient() as gw:
            if not await gw.health_check():
                raise RuntimeError("LLM Config Gateway not reachable")
            if not await gw.get_default_embedding_model():
                raise RuntimeError("Default embedding model missing in gateway")
            if not await gw.get_default_chat_model():
                raise RuntimeError("Default chat model missing in gateway")
        _hirag_tools = HiRAGTools()
        return _hirag_tools
    except Exception as e:
        logger.error(f"[RetrievalRouterService] init HiRAGTools failed: {e}")
        return None


async def _apply_retrieval_template_if_any(template_id: Optional[str]) -> None:
    """若提供了路由模板ID，则应用该模板（影响检索路径配置）。
    该操作是幂等的；若ID无效或不匹配则忽略错误。
    """
    global _qa_routing_service
    if not template_id:
        return
    try:
        # 延迟初始化服务
        if _qa_routing_service is None:
            from service.qa_routing_service import QARoutingService
            _qa_routing_service = QARoutingService()
        # 应用模板
        tid = UUID(str(template_id))
        await _qa_routing_service.apply_template(tid)
        logger.info(f"[RetrievalRouterService] 已应用路由模板: {template_id}")
    except Exception as e:
        logger.warning(f"[RetrievalRouterService] 应用路由模板失败或忽略: {e}")


async def _get_collection_mode(collection_id: str) -> str:
    try:
        async with get_async_session() as session:
            from sqlalchemy import text
            q = text("SELECT config FROM knowledge_collections WHERE id=:cid LIMIT 1")
            res = await session.execute(q, {"cid": collection_id})
            row = res.first()
            cfg = row[0] if row else None
            if isinstance(cfg, dict):
                mode = ((cfg.get("retrieval") or {}).get("mode") or "hybrid").lower()
                return mode if mode in ("hybrid", "hirag") else "hybrid"
    except Exception as e:
        logger.warning(f"[RetrievalRouterService] get mode failed: {e}")
    return "hybrid"


async def _hirag_ready(collection_id: str) -> bool:
    try:
        async with get_async_session() as session:
            from sqlalchemy import text
            q = text("SELECT COUNT(*) FROM hirag_community_reports WHERE collection_id=:cid")
            res = await session.execute(q, {"cid": collection_id})
            count = int(res.scalar() or 0)
            return count > 0
    except Exception as e:
        logger.warning(f"[RetrievalRouterService] readiness check failed: {e}")
        return False


async def routed_retrieval(
    query: str,
    collection_id: str,
    mode: str = "auto",
    top_k: int = 10,
    filters: Optional[Dict[str, Any]] = None,
    fallback_to_hybrid: bool = True,
    hirag_mode: str = "hi",
    retrieval_template_id: Optional[str] = None,
) -> Dict[str, Any]:
    """根据集合配置或显式模式执行检索，返回统一结构。"""
    if not query:
        return {"success": False, "error": "query is required"}
    if not collection_id:
        return {"success": False, "error": "collectionId is required"}

    # 若传入模板，先尝试应用（不会阻断主流程）
    await _apply_retrieval_template_if_any(retrieval_template_id)

    requested_mode = (mode or "auto").lower()
    if requested_mode == "auto":
        final_mode = await _get_collection_mode(collection_id)
    elif requested_mode in ("hybrid", "hirag"):
        final_mode = requested_mode
    else:
        final_mode = "hybrid"

    # 诊断日志：记录请求与最终模式
    logger.info(
        f"[RetrievalRouter] request query='{query[:60]}', collection_id={collection_id}, "
        f"requested_mode={requested_mode}, final_mode={final_mode}, top_k={top_k}"
    )

    # hirag 校验与回退
    if final_mode == "hirag":
        configured_mode = await _get_collection_mode(collection_id)
        ready = await _hirag_ready(collection_id)
        if configured_mode != "hirag" or not ready:
            if requested_mode == "hirag":
                return {
                    "success": False,
                    "error": "HiRAG not enabled or not ready for this collection",
                    "detail": {"enabled": configured_mode == "hirag", "ready": ready},
                }
            if fallback_to_hybrid:
                final_mode = "hybrid"
            else:
                return {
                    "success": False,
                    "error": "HiRAG not enabled or not ready for this collection",
                    "detail": {"enabled": configured_mode == "hirag", "ready": ready},
                }

    # 执行
    if final_mode == "hybrid":
        results = await _hybrid.hybrid_search(
            query=query,
            top_k=top_k,
            filters=filters or {},
            collection_id=collection_id,
        )
        return {
            "success": True,
            "mode": "hybrid",
            "items": [r.__dict__ for r in results],
        }

    tools = await _ensure_hirag_tools()
    if not tools:
        return {"success": False, "error": "HiRAG not ready: global model service issue"}
    result = await tools.hierarchical_search(
        query=query, mode=hirag_mode, collection_id=collection_id, top_k=top_k
    )
    return {"success": True, "mode": f"hirag/{hirag_mode}", **result}
