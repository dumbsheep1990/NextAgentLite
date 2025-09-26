"""
Redis support (non-intrusive) for knowledge document task status snapshots and session-task mapping.

- Enabled only when REDIS_URL is configured (env). Otherwise all calls are no-ops.
- Uses redis.asyncio (optional). If not installed or init fails, auto-disable.

Key patterns:
- knowledge:task:{task_id} -> HASH { status, progress, stage, detail, document_id, collection_id, updated_at }
- knowledge:session:{session_id}:tasks -> SET of task_ids

TTL strategy:
- Task snapshot: 24h
- Session->tasks mapping: 24h (refreshed on updates)
"""
from __future__ import annotations

import os
import asyncio
from datetime import datetime, timezone
from typing import Any, Dict, Optional

_enabled = False
_redis = None  # type: ignore
_lock = asyncio.Lock()

DEFAULT_TTL_SECONDS = int(os.getenv("REDIS_KNOWLEDGE_TTL", "86400"))  # 24h


def _utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


async def _ensure_client():
    global _enabled, _redis
    if _redis is not None or _enabled is False:
        return
    async with _lock:
        if _redis is not None or _enabled is False:
            return
        url = os.getenv("REDIS_URL") or os.getenv("REDIS_KNOWLEDGE_URL")
        if not url:
            _enabled = False
            return
        try:
            # Lazy import to avoid hard dependency
            import redis.asyncio as redis  # type: ignore

            _redis = redis.from_url(url, decode_responses=True)
            # simple ping test
            try:
                await _redis.ping()
                _enabled = True
            except Exception:
                _redis = None
                _enabled = False
        except Exception:
            _redis = None
            _enabled = False


def is_enabled() -> bool:
    return bool(os.getenv("REDIS_URL") or os.getenv("REDIS_KNOWLEDGE_URL"))


async def _get() -> Optional[Any]:  # redis client
    await _ensure_client()
    return _redis


async def save_task_snapshot(task_id: str, *, status: str, progress: int, stage: str, detail: str,
                             document_id: Optional[str] = None, collection_id: Optional[str] = None,
                             ttl: Optional[int] = None) -> None:
    """Upsert task snapshot to Redis; no-op when disabled."""
    if not is_enabled():
        return
    r = await _get()
    if not r:
        return
    key = f"knowledge:task:{task_id}"
    try:
        payload: Dict[str, Any] = {
            "status": status,
            "progress": str(int(progress)),
            "stage": stage or "",
            "detail": detail or "",
            "updated_at": _utc_now_iso(),
        }
        if document_id:
            payload["document_id"] = document_id
        if collection_id:
            payload["collection_id"] = collection_id
        await r.hset(key, mapping=payload)
        await r.expire(key, int(ttl or DEFAULT_TTL_SECONDS))
    except Exception:
        # best-effort, ignore errors
        return


async def add_session_task(session_id: Optional[str], task_id: str, *, ttl: Optional[int] = None) -> None:
    """Map session_id to task_id in a SET; no-op when disabled or session_id missing."""
    if not session_id or not is_enabled():
        return
    r = await _get()
    if not r:
        return
    key = f"knowledge:session:{session_id}:tasks"
    try:
        await r.sadd(key, task_id)
        await r.expire(key, int(ttl or DEFAULT_TTL_SECONDS))
    except Exception:
        return


async def mark_task_cancelled(task_id: str, *, ttl: Optional[int] = None) -> None:
    if not is_enabled():
        return
    r = await _get()
    if not r:
        return
    try:
        set_key = "knowledge:task:cancelled"
        await r.sadd(set_key, task_id)
        # optional: we can add a per-task cancel key with TTL
        await r.setex(f"knowledge:task:{task_id}:cancel", int(ttl or DEFAULT_TTL_SECONDS), "1")
    except Exception:
        return


async def is_task_cancelled(task_id: str) -> bool:
    if not is_enabled():
        return False
    r = await _get()
    if not r:
        return False
    try:
        if await r.sismember("knowledge:task:cancelled", task_id):
            return True
        if await r.exists(f"knowledge:task:{task_id}:cancel"):
            return True
    except Exception:
        return False
    return False


# ---------- Locks & Throttle ----------

async def acquire_lock(key: str, ttl_seconds: int) -> bool:
    """Try acquire a simple lock with TTL. Returns True if acquired.
    No-op (False) when disabled.
    """
    if not is_enabled():
        return False
    r = await _get()
    if not r:
        return False
    try:
        # SET key value NX EX ttl
        ok = await r.set(key, "1", ex=int(ttl_seconds), nx=True)
        return bool(ok)
    except Exception:
        return False


async def release_lock(key: str) -> None:
    if not is_enabled():
        return
    r = await _get()
    if not r:
        return
    try:
        await r.delete(key)
    except Exception:
        return


async def throttle(key: str, ttl_seconds: int) -> bool:
    """Return True if allowed (not throttled). Internally use SETNX with TTL."""
    return await acquire_lock(key, ttl_seconds)


# ---------- Pub/Sub for SSE Bridge ----------

async def publish_sse(session_id: str, message: Dict[str, Any], *, sender: Optional[str] = None) -> None:
    """Publish SSE payload to Redis channel; no-op when disabled.
    - session_id: 'all' for broadcast, or concrete session id
    - message: JSON serializable dict; we will wrap with { session_id, sender, payload }
    """
    if not is_enabled():
        return
    r = await _get()
    if not r:
        return
    try:
        import json as _json
        channel = "knowledge:sse:all" if session_id in (None, "", "all") else f"knowledge:sse:session:{session_id}"
        envelope = {"session_id": session_id or "all", "sender": sender or "", "payload": message}
        await r.publish(channel, _json.dumps(envelope, ensure_ascii=False))
    except Exception:
        return


# ---------- Query helpers ----------

async def get_session_tasks(session_id: str) -> Optional[list[str]]:
    if not is_enabled():
        return None
    r = await _get()
    if not r:
        return None
    try:
        key = f"knowledge:session:{session_id}:tasks"
        return await r.smembers(key)
    except Exception:
        return None


async def get_task_snapshot(task_id: str) -> Optional[Dict[str, Any]]:
    if not is_enabled():
        return None
    r = await _get()
    if not r:
        return None
    try:
        key = f"knowledge:task:{task_id}"
        data = await r.hgetall(key)
        if not data:
            return None
        return data
    except Exception:
        return None
