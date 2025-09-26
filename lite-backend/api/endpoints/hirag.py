from typing import Optional, Dict, Any, List

from fastapi import APIRouter, Body, Query

from core.logger import logger
from db.database import get_async_session
from db.repositories.hirag_repository import HiRAGRepository
from service.hirag_agno_integration import HiRAGTools
from service.graph_service import GraphService
from service.llm_config_gateway_client import LLMConfigGatewayClient
from api.websocket.document_status_sse import document_sse
import uuid
import os


router = APIRouter()

# 延迟初始化，避免在网关未准备好时阻塞应用启动
_tools: Optional[HiRAGTools] = None
_graph_service = GraphService()


async def _ensure_tools() -> HiRAGTools | None:
    global _tools
    if _tools is not None:
        return _tools
    try:
        _tools = HiRAGTools()
        return _tools
    except Exception as e:
        logger.error(f"[HiRAG] 初始化失败: {e}")
        return None


@router.post("/api/v1/hirag/init")
async def hirag_init() -> Dict[str, Any]:
    """Initialize HiRAG capability and ensure minimal tables exist (via migration)."""
    try:
        # 仅作为就绪探针；真实建表依赖 migrations 脚本
        tools_ready = await _ensure_tools()
        return {
            "success": tools_ready is not None,
            "message": "HiRAG initialized (ensure migrations applied)",
            "capabilities": {
                "modes": [
                    "hi",
                    "naive",
                    "hi_local",
                    "hi_global",
                    "hi_bridge",
                    "hi_nobridge",
                ],
                "endpoints": [
                    "/api/v1/hirag/index-collection",
                    "/api/v1/hirag/search",
                    "/api/v1/hirag/community-reports",
                    "/api/v1/hirag/graph",
                    "/api/v1/hirag/status",
                ],
            },
        }
    except Exception as e:
        logger.error(f"[HiRAG] init failed: {e}")
        return {"success": False, "error": str(e)}


@router.get("/api/v1/hirag/status")
async def hirag_status() -> Dict[str, Any]:
    """返回 HiRAG 运行所需依赖的健康状态（全局模型网关与默认模型配置）。"""
    gateway_ok = False
    defaults: Dict[str, Any] = {"chat": None, "embedding": None}
    errors: List[str] = []
    try:
        async with LLMConfigGatewayClient() as gw:
            gateway_ok = await gw.health_check()
            if not gateway_ok:
                errors.append("LLM Config Gateway health check failed")
            chat = await gw.get_default_chat_model()
            emb = await gw.get_default_embedding_model()
            if chat and chat[0] and chat[1]:
                defaults["chat"] = {"model": chat[0], "provider": chat[1]}
            else:
                errors.append("Default chat model not configured")
            if emb and emb[0] and emb[1]:
                defaults["embedding"] = {"model": emb[0], "provider": emb[1]}
            else:
                errors.append("Default embedding model not configured")
    except Exception as e:
        logger.error(f"[HiRAG] status check error: {e}")
        errors.append(str(e))

    ready = gateway_ok and defaults["chat"] is not None and defaults["embedding"] is not None
    return {
        "success": ready,
        "gateway": {"reachable": gateway_ok},
        "defaults": defaults,
        "ready": ready,
        "errors": errors,
    }


@router.post("/api/v1/hirag/backfill-working-dirs")
async def hirag_backfill_working_dirs() -> Dict[str, Any]:
    """为现有集合补齐 per-collection working_dir，并在文件系统中创建目录。"""
    try:
        base_dir = os.getenv('HIRAG_BASE_DIR', './hirag_workspace')
        created = 0
        updated = 0
        from sqlalchemy import text
        async with get_async_session() as session:
            rows = await session.execute(text("SELECT id, config FROM knowledge_collections"))
            rows = rows.fetchall()
            for row in rows:
                cid = row[0]
                cfg = row[1] or {}
                hirag_cfg = (cfg.get('hirag') if isinstance(cfg, dict) else None) or {}
                wdir = hirag_cfg.get('working_dir')
                if not wdir:
                    wdir = os.path.join(base_dir, cid)
                    os.makedirs(wdir, exist_ok=True)
                    # 更新 config.hirag.working_dir
                    await session.execute(
                        text(
                            """
                            UPDATE knowledge_collections
                            SET config = jsonb_set(
                                COALESCE(config,'{}'::jsonb), '{hirag,working_dir}', to_jsonb(:wd::text), true
                            )
                            WHERE id=:cid
                            """
                        ),
                        {"cid": cid, "wd": wdir},
                    )
                    created += 1
                else:
                    try:
                        os.makedirs(wdir, exist_ok=True)
                    except Exception:
                        pass
                    updated += 1
            await session.commit()
        return {"success": True, "created": created, "checked": updated}
    except Exception as e:
        logger.error(f"[HiRAG] backfill working dirs failed: {e}")
        return {"success": False, "error": str(e)}


@router.post("/api/v1/hirag/index-collection")
async def hirag_index_collection(
    payload: Dict[str, Any] = Body(
        ..., 
        example={
            "collectionId": "default_collection",
            "force": False,
            "dryRun": True,
            "confirm": False,
            "async": True,
            "sessionId": "session_..."
        },
    )
) -> Dict[str, Any]:
    """Build hierarchical index for a collection. Synchronous MVP; can be task-ized later."""
    # collection_id 在数据库为 VARCHAR(50)
    collection_id = str(payload.get("collectionId"))
    force = bool(payload.get("force", False))
    # 手动确认流程支持：若 dryRun 或未确认，则仅返回估算信息
    dry_run = bool(payload.get("dryRun", False))
    confirm = bool(payload.get("confirm", False))

    # 统计估算
    stats = {"documents": 0, "chunks": 0, "est_tokens": 0}
    try:
        async with get_async_session() as session:
            from sqlalchemy import text
            docs_q = text(
                "SELECT COUNT(*) AS c FROM knowledge_documents WHERE collection_id = :cid"
            )
            chunks_q = text(
                """
                SELECT COUNT(*) AS c, COALESCE(SUM(LENGTH(dc.content)),0) AS sum_chars
                FROM document_chunks dc
                JOIN knowledge_documents kd ON kd.id = dc.document_id
                WHERE kd.collection_id = :cid
                """
            )
            dres = await session.execute(docs_q, {"cid": collection_id})
            cres = await session.execute(chunks_q, {"cid": collection_id})
            drow = dres.first()
            crow = cres.first()
            stats["documents"] = int(drow[0] if drow and drow[0] is not None else 0)
            stats["chunks"] = int(crow[0] if crow and crow[0] is not None else 0)
            sum_chars = int(crow[1] if crow and crow[1] is not None else 0)
            # 粗略 token 估算（平均4字符≈1 token）
            stats["est_tokens"] = max(0, sum_chars // 4)
    except Exception as e:
        logger.warning(f"[HiRAG] 估算统计失败: {e}")

    if dry_run or not confirm:
        return {
            "success": True,
            "requires_confirmation": True,
            "message": "HiRAG index will process documents and generate community reports.",
            "stats": stats,
        }

    tools = await _ensure_tools()
    if not tools:
        return {
            "success": False,
            "error": "HiRAG not ready: global model service unavailable or defaults missing",
        }
    # 是否异步运行 + SSE 进度
    run_async = bool(payload.get("async", True))
    session_id = payload.get("sessionId")

    async def _run_task(task_id: str):
        # Stage: starting
        try:
            if session_id:
                await document_sse.broadcast_task_progress(
                    session_id,
                    task_id,
                    {"progress": 1, "stage": "准备中", "detail": "初始化HiRAG索引", "status": "running"},
                )
            else:
                await document_sse.broadcast_task_progress_to_all(
                    task_id,
                    document_id="",
                    progress_data={"progress": 1, "stage": "准备中", "detail": "初始化HiRAG索引", "status": "running"},
                    collection_id=collection_id,
                )
        except Exception:
            pass

        # 执行索引
        try:
            result = await tools.index_collection_with_hirag(collection_id, force_rebuild=force)
            if session_id:
                await document_sse.broadcast_task_progress(
                    session_id,
                    task_id,
                    {"progress": 60, "stage": "抽取与社区生成", "detail": "完成基础构建", "status": "running"},
                )
            else:
                await document_sse.broadcast_task_progress_to_all(
                    task_id,
                    document_id="",
                    progress_data={"progress": 60, "stage": "抽取与社区生成", "detail": "完成基础构建", "status": "running"},
                    collection_id=collection_id,
                )
        except Exception as e:
            if session_id:
                await document_sse.broadcast_task_failed(
                    session_id,
                    task_id,
                    {"progress": 1, "detail": "索引构建失败", "error_message": str(e)},
                )
            else:
                await document_sse.broadcast_task_failed_to_all(
                    task_id,
                    document_id="",
                    error_data={"progress": 1, "detail": "索引构建失败", "error_message": str(e)},
                    collection_id=collection_id,
                )
            return

        # 持久化社区报告
        persisted = 0
        try:
            report_keys = await tools.hirag.community_reports.all_keys()
            reports = {}
            for k in report_keys:
                v = await tools.hirag.community_reports.get_by_id(k)
                if v is not None:
                    reports[str(k)] = v
            async with get_async_session() as session:
                repo = HiRAGRepository(session)
                persisted = await repo.bulk_upsert_community_reports(collection_id, reports)
            if session_id:
                await document_sse.broadcast_task_progress(
                    session_id,
                    task_id,
                    {"progress": 85, "stage": "持久化", "detail": f"写入社区报告: {persisted}", "status": "running"},
                )
            else:
                await document_sse.broadcast_task_progress_to_all(
                    task_id,
                    document_id="",
                    progress_data={"progress": 85, "stage": "持久化", "detail": f"写入社区报告: {persisted}", "status": "running"},
                    collection_id=collection_id,
                )
        except Exception as e:
            if session_id:
                await document_sse.broadcast_task_failed(
                    session_id,
                    task_id,
                    {"progress": 80, "detail": "持久化失败", "error_message": str(e)},
                )
            else:
                await document_sse.broadcast_task_failed_to_all(
                    task_id,
                    document_id="",
                    error_data={"progress": 80, "detail": "持久化失败", "error_message": str(e)},
                    collection_id=collection_id,
                )
            return

        # 完成
        if session_id:
            await document_sse.broadcast_task_completed(
                session_id,
                task_id,
                {
                    "detail": "HiRAG索引构建完成",
                    "result": {"persisted_reports": persisted, "collection_id": collection_id, "stats": stats},
                },
            )
        else:
            await document_sse.broadcast_task_completed_to_all(
                task_id,
                document_id="",
                result_data={
                    "task_id": task_id,
                    "progress": 100,
                    "stage": "完成",
                    "detail": "HiRAG索引构建完成",
                    "status": "completed",
                    "result": {"persisted_reports": persisted, "collection_id": collection_id, "stats": stats},
                },
                collection_id=collection_id,
            )

    if run_async:
        task_id = f"hirag_{uuid.uuid4()}"
        # 创建后台任务
        import asyncio as _asyncio
        _asyncio.create_task(_run_task(task_id))
        return {"success": True, "queued": True, "taskId": task_id, "stats": stats}

    # 同步执行
    await _run_task(task_id := f"hirag_{uuid.uuid4()}")
    return {"success": True, "queued": False, "taskId": task_id, "stats": stats}


@router.post("/api/v1/hirag/search")
async def hirag_search(
    payload: Dict[str, Any] = Body(
        ..., 
        example={
            "query": "地聚物材料的强度影响因素",
            "mode": "hi",
            "collectionId": 1,
            "topK": 10,
        },
    )
) -> Dict[str, Any]:
    """Run hierarchical search via HiRAG."""
    query = payload.get("query", "")
    mode = payload.get("mode", "hi")
    collection_id = payload.get("collectionId")
    top_k = int(payload.get("topK", 10))

    # 访问控制：只有当集合检索模式为 hirag 且已就绪时，才能使用 HiRAG 检索
    if collection_id:
        # 读取集合配置
        cfg = await get_collection_retrieval_config(str(collection_id))
        if not cfg.get("success"):
            return {"success": False, "error": "Failed to read collection retrieval config"}
        enabled = ((cfg.get("retrieval") or {}).get("mode") == "hirag")
        ready_info = await hirag_collection_readiness(str(collection_id))
        ready = bool(ready_info.get("ready")) if ready_info.get("success") else False
        if not enabled or not ready:
            return {
                "success": False,
                "error": "HiRAG retrieval not enabled or not ready for this collection",
                "detail": {
                    "enabled": enabled,
                    "ready": ready,
                    "hint": "Please switch retrieval mode to 'hirag' and build HiRAG index first."
                },
            }
    tools = await _ensure_tools()
    if not tools:
        return {
            "success": False,
            "error": "HiRAG not ready: global model service unavailable or defaults missing",
        }
    result = await tools.hierarchical_search(
        query=query, mode=mode, collection_id=collection_id, top_k=top_k
    )
    return result


@router.get("/api/v1/hirag/community-reports")
async def hirag_community_reports(
    collection_id: Optional[int] = Query(None), level: Optional[int] = Query(None)
) -> Dict[str, Any]:
    """List community reports (global knowledge).
    优先从数据库读取；若数据库为空，则从 HiRAG KV 读取（便于首轮联调）。
    """
    coll = str(collection_id) if collection_id is not None else None
    try:
        async with get_async_session() as session:
            repo = HiRAGRepository(session)
            items = await repo.list_community_reports(collection_id=coll, level=level)
            if items:
                return {"success": True, "items": items, "total": len(items)}
    except Exception as e:
        logger.warning(f"[HiRAG] 读取DB社区报告失败，回退到KV: {e}")

    # 回退到 KV（不含 DB 字段）
    kv_items: List[Dict[str, Any]] = []
    try:
        tools = await _ensure_tools()
        if not tools:
            return {"success": True, "items": [], "total": 0}
        keys = await tools.hirag.community_reports.all_keys()
        for k in keys:
            v = await tools.hirag.community_reports.get_by_id(k)
            if v is None:
                continue
            if level is not None and int(v.get("level", 1)) != int(level):
                continue
            kv_items.append({
                "community_id": str(k),
                "level": int(v.get("level", 1)),
                "title": (v.get("report_json") or {}).get("title"),
                "summary": (v.get("report_json") or {}).get("summary"),
                "impact_rating": (v.get("report_json") or {}).get("rating"),
                "entity_count": len(v.get("nodes") or []),
                "relationship_count": len(v.get("edges") or []),
                "entities": v.get("nodes") or [],
                "detailed_findings": (v.get("report_json") or {}).get("findings"),
            })
    except Exception as e:
        logger.error(f"[HiRAG] 读取KV社区报告失败: {e}")
        return {"success": False, "error": str(e), "items": [], "total": 0}

    return {"success": True, "items": kv_items, "total": len(kv_items)}


@router.get("/api/v1/hirag/collections/{collection_id}/capabilities")
async def hirag_collection_capabilities(collection_id: str) -> Dict[str, Any]:
    """汇总返回集合是否支持/启用/就绪 HiRAG，以及可执行的下一步动作。"""
    # 当前所有集合在后端均“支持”，但需已启用且构建完成才可使用
    try:
        cfg = await get_collection_retrieval_config(collection_id)
        enabled = ((cfg.get("retrieval") or {}).get("mode") == "hirag") if cfg.get("success") else False
        ready_info = await hirag_collection_readiness(collection_id)
        ready = bool(ready_info.get("ready")) if ready_info.get("success") else False
        return {
            "success": True,
            "supports": True,
            "enabled": enabled,
            "ready": ready,
            "actions": {
                "canEnable": not enabled and ready,
                "needBuild": not ready,
                "needSwitchMode": not enabled,
            },
            "stats": (ready_info.get("stats") if ready_info.get("success") else {}),
        }
    except Exception as e:
        logger.error(f"[HiRAG] capabilities failed: {e}")
        return {"success": False, "error": str(e)}


@router.get("/api/v1/hirag/graph")
async def hirag_graph(
    entity: Optional[str] = Query(None, description="实体名称（可选）"),
    center_node_id: Optional[str] = Query(None, description="中心节点ID（可选）"),
    radius: int = Query(2),
    max_nodes: int = Query(100),
) -> Dict[str, Any]:
    """Return a small subgraph for visualization.
    If entity provided, search node by label then return its subgraph.
    """
    try:
        if center_node_id:
            subgraph = await _graph_service.get_subgraph(center_node_id, radius=radius, max_nodes=max_nodes)
            return {"success": True, **subgraph}
        if entity:
            nodes = await _graph_service.search_nodes(entity, limit=1)
            if not nodes:
                return {"success": True, "nodes": [], "edges": []}
            subgraph = await _graph_service.get_subgraph(nodes[0]["id"], radius=radius, max_nodes=max_nodes)
            return {"success": True, **subgraph}
        # fallback: return basic graph stats
        stats = await _graph_service.get_graph_stats()
        return {"success": True, "stats": stats}
    except Exception as e:
        logger.error(f"[HiRAG] graph endpoint error: {e}")
        return {"success": False, "error": str(e)}


@router.get("/api/v1/hirag/collections/{collection_id}/readiness")
async def hirag_collection_readiness(collection_id: str) -> Dict[str, Any]:
    """检查集合的 HiRAG 就绪度：社区报告条数、文档/分块数量与简易覆盖估算。"""
    stats = {"documents": 0, "chunks": 0, "community_reports": 0}
    try:
        async with get_async_session() as session:
            from sqlalchemy import text
            dres = await session.execute(
                text("SELECT COUNT(*) FROM knowledge_documents WHERE collection_id=:cid"),
                {"cid": collection_id},
            )
            cres = await session.execute(
                text(
                    """
                    SELECT COUNT(*)
                    FROM document_chunks dc
                    JOIN knowledge_documents kd ON kd.id = dc.document_id
                    WHERE kd.collection_id = :cid
                    """
                ),
                {"cid": collection_id},
            )
            rres = await session.execute(
                text(
                    "SELECT COUNT(*) FROM hirag_community_reports WHERE collection_id=:cid"
                ),
                {"cid": collection_id},
            )
            stats["documents"] = int(dres.scalar() or 0)
            stats["chunks"] = int(cres.scalar() or 0)
            stats["community_reports"] = int(rres.scalar() or 0)
    except Exception as e:
        logger.error(f"[HiRAG] readiness check failed: {e}")
        return {"success": False, "error": str(e), "stats": stats}

    ready = stats["community_reports"] > 0
    return {"success": True, "ready": ready, "stats": stats}


@router.get("/api/v1/hirag/collections/{collection_id}/retrieval-config")
async def get_collection_retrieval_config(collection_id: str) -> Dict[str, Any]:
    """读取集合的检索配置（存放于 knowledge_collections.config）。"""
    try:
        async with get_async_session() as session:
            from sqlalchemy import text
            q = text(
                "SELECT config FROM knowledge_collections WHERE id=:cid LIMIT 1"
            )
            res = await session.execute(q, {"cid": collection_id})
            row = res.first()
            config = row[0] if row else None
            retrieval = (config or {}).get("retrieval") if isinstance(config, dict) else None
            hirag = (config or {}).get("hirag") if isinstance(config, dict) else None
            return {
                "success": True,
                "collection_id": collection_id,
                "retrieval": retrieval or {},
                "hirag": hirag or {},
                "raw": config or {},
            }
    except Exception as e:
        logger.error(f"[HiRAG] get retrieval-config failed: {e}")
        return {"success": False, "error": str(e)}


@router.post("/api/v1/hirag/collections/{collection_id}/retrieval-config")
async def set_collection_retrieval_config(
    collection_id: str,
    payload: Dict[str, Any] = Body(
        ..., example={"mode": "hirag", "requireReady": True}
    ),
) -> Dict[str, Any]:
    """设置集合检索模式（hybrid|hirag）。
    - 当切换为 hirag 且 requireReady=true 时，会检查 readiness，不满足则返回错误。
    - 在 config JSONB 中写入：retrieval.mode 与 hirag.status（ready|not_ready）。
    """
    mode = (payload.get("mode") or "").lower()
    require_ready = bool(payload.get("requireReady", True))
    if mode not in ("hybrid", "hirag"):
        return {"success": False, "error": "Invalid mode, expect 'hybrid' or 'hirag'"}

    # readiness 检查
    ready = True
    if mode == "hirag":
        readiness = await hirag_collection_readiness(collection_id)
        if not readiness.get("success"):
            return {"success": False, "error": "Readiness check failed", "detail": readiness}
        ready = bool(readiness.get("ready"))
        if require_ready and not ready:
            return {
                "success": False,
                "error": "HiRAG not ready for this collection",
                "detail": readiness,
            }

    # 写入配置
    try:
        async with get_async_session() as session:
            from sqlalchemy import text
            # 设置 retrieval.mode
            upd1 = text(
                """
                UPDATE knowledge_collections
                SET config = jsonb_set(
                    COALESCE(config,'{}'::jsonb), '{retrieval,mode}', to_jsonb(:mode::text), true
                )
                WHERE id=:cid
                """
            )
            await session.execute(upd1, {"cid": collection_id, "mode": mode})

            # 设置 hirag.status
            status = "ready" if (mode == "hirag" and ready) else ("not_ready" if mode == "hirag" else "disabled")
            upd2 = text(
                """
                UPDATE knowledge_collections
                SET config = jsonb_set(
                    COALESCE(config,'{}'::jsonb), '{hirag,status}', to_jsonb(:status::text), true
                )
                WHERE id=:cid
                """
            )
            await session.execute(upd2, {"cid": collection_id, "status": status})
            await session.commit()

        # 返回更新后的配置
        return await get_collection_retrieval_config(collection_id)
    except Exception as e:
        logger.error(f"[HiRAG] set retrieval-config failed: {e}")
        return {"success": False, "error": str(e)}
