"""
集合级重向量化执行器
 - 按集合的 Embedding 模型重新为所有分块生成向量，并写入 ES 索引
 - 通过 UnifiedSSEManager 推送进度（session_id）
 - 支持取消（依赖 AsyncTaskManager 的 cancel_task）
"""
from typing import Any, Dict, List, Optional
import asyncio
from sqlalchemy import select, join

from core.logger import logger
from core.task_manager import get_task_manager
from db.database import get_async_session
from models.knowledge import KnowledgeDocument as KD, DocumentChunk as DC
from service.embedding_model_manager import get_model_for_collection
from service.embedding_service import embedding_service
from service.hybrid_search_service import hybrid_search_service
from utils.timezone_utils import get_china_now


async def _detect_dims(model_path: str) -> int:
    try:
        resp = await embedding_service.create_embeddings(model_path=model_path, texts=["__dim_probe__"])
        dim = getattr(resp, 'dimension', None)
        if isinstance(dim, int) and dim > 0:
            return dim
    except Exception as e:
        logger.warning(f"[Revectorize] 维度探测失败: {e}")
    return 1024


async def _broadcast(session_id: str, payload: Dict[str, Any]):
    try:
        from api.routes import unified_sse_manager
        await unified_sse_manager._send_to_session(session_id, payload)
    except Exception:
        pass


async def run_revectorize_collection(collection_id: str, session_id: str) -> Dict[str, Any]:
    """执行重向量化主流程"""
    try:
        # 1) 解析模型
        model_cfg = await get_model_for_collection(collection_id)
        if not model_cfg:
            raise RuntimeError("未配置可用的Embedding模型")
        model_id, provider = model_cfg
        model_path = f"{provider}/{model_id}"

        # 2) 计算总量
        async with get_async_session() as session:
            j = join(DC, KD, DC.document_id == KD.id)
            # 预取 chunk id 与对应文档的 collection_id，后续回写 ES 需要
            stmt = (
                select(DC.id, KD.collection_id)
                .select_from(j)
                .where(KD.collection_id == collection_id)
            )
            result = await session.execute(stmt)
            rows_all = result.fetchall()
            all_ids = [r[0] for r in rows_all]
            coll_map = {r[0]: r[1] for r in rows_all}
        total = len(all_ids)
        if total == 0:
            await _broadcast(session_id, {"type": "revectorize", "data": {"status": "no_chunks", "total": 0}})
            return {"total": 0, "indexed": 0}

        # 3) 维度探测 + 索引确保
        dims = await _detect_dims(model_path)
        await hybrid_search_service.ensure_index(force=True, dims=dims)

        # 4) 分批读取chunk内容并生成向量
        batch = 64
        indexed = 0
        for i in range(0, total, batch):
            batch_ids = all_ids[i:i+batch]
            # 取内容
            async with get_async_session() as session:
                q = (
                    select(DC, KD.id.label('doc_id'), KD.collection_id.label('collection_id'))
                    .select_from(join(DC, KD, DC.document_id == KD.id))
                    .where(DC.id.in_(batch_ids))
                )
                res = await session.execute(q)
                rows = res.fetchall()
            texts = [row[0].content for row in rows]
            try:
                emb = await embedding_service.create_embeddings(model_path=model_path, texts=texts)
                vectors = emb.embeddings if emb and getattr(emb, 'embeddings', None) else []
            except Exception as e:
                await _broadcast(session_id, {"type": "revectorize", "data": {"status": "error", "error": str(e)}})
                raise
            # 写入ES
            for k, row in enumerate(rows):
                chunk: Any = row[0]
                doc_id: str = row[1]
                coll_id: str = row[2]
                vec = vectors[k] if k < len(vectors) else []
                try:
                    doc_body = {
                        "id": chunk.id,
                        "document_id": doc_id,
                        "collection_id": coll_id,
                        "chunk_index": chunk.chunk_index,
                        "content": chunk.content,
                        "title": getattr(chunk, 'title', '') or '',
                        "general_embedding": [float(x) for x in vec],
                        "general_model": model_id,
                        "vectorization_strategy": "general",
                        # 补齐 metadata.collection_id 便于检索端过滤
                        "metadata": {
                            **(getattr(chunk, 'chunk_metadata', {}) or {}),
                            "collection_id": coll_id,
                        },
                        "created_at": get_china_now().isoformat(),
                        "updated_at": get_china_now().isoformat()
                    }
                    await hybrid_search_service.es.index(
                        index=hybrid_search_service.index_name,
                        id=chunk.id,
                        body=doc_body,
                    )
                    indexed += 1
                except Exception as e:
                    await _broadcast(session_id, {"type": "revectorize", "data": {"status": "index_error", "chunk_id": chunk.id, "error": str(e)}})
            # 进度
            await _broadcast(session_id, {"type": "revectorize", "data": {"status": "running", "indexed": indexed, "total": total}})
            await asyncio.sleep(0)

        await _broadcast(session_id, {"type": "revectorize", "data": {"status": "completed", "indexed": indexed, "total": total}})
        return {"total": total, "indexed": indexed}
    except Exception as e:
        await _broadcast(session_id, {"type": "revectorize", "data": {"status": "failed", "error": str(e)}})
        return {"total": 0, "indexed": 0, "error": str(e)}


async def start_revectorize_task(collection_id: str, session_id: Optional[str] = None) -> str:
    manager = get_task_manager()
    task_id = await manager.submit_async_task(
        run_revectorize_collection,
        collection_id,
        session_id or f"revector_{collection_id}",
        task_name="collection_revectorize",
        timeout=3600,
        session_id=session_id or f"revector_{collection_id}",
        metadata={"collection_id": collection_id}
    )
    return task_id
