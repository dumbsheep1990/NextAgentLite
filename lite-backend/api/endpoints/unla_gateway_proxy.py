"""
Unla 网关反向代理
将 `/gateway/{path}` 代理到 UNLA_GATEWAY_URL，支持 GET/POST/DELETE 以及 SSE 流式响应。
"""
from __future__ import annotations

import os
from typing import Dict

import httpx
from fastapi import APIRouter, Request, Response
from fastapi.responses import StreamingResponse


UNLA_GATEWAY_URL = os.getenv("UNLA_GATEWAY_URL", "http://127.0.0.1:5235")

router = APIRouter(prefix="/gateway", tags=["Unla Gateway Proxy"])


def _build_target_url(path: str, query: str) -> str:
    base = UNLA_GATEWAY_URL.rstrip("/")
    p = path.lstrip("/")
    if query:
        return f"{base}/{p}?{query}"
    return f"{base}/{p}"


async def _proxy_stream(method: str, request: Request, target_url: str) -> Response:
    headers: Dict[str, str] = {}
    # 透传必要头部，过滤 hop-by-hop
    for k, v in request.headers.items():
        if k.lower() not in {"host", "content-length"}:
            headers[k] = v

    async with httpx.AsyncClient(timeout=None) as client:
        if method == "GET":
            r = await client.stream("GET", target_url, headers=headers)
        elif method == "DELETE":
            r = await client.stream("DELETE", target_url, headers=headers)
        else:
            body = await request.body()
            r = await client.stream("POST", target_url, headers=headers, content=body)

        # 构造 StreamingResponse，透传关键响应头
        content_type = r.headers.get("content-type", "application/octet-stream")
        session_id = r.headers.get("Mcp-Session-Id")

        async def iter_bytes():
            async for chunk in r.aiter_bytes():
                yield chunk

        resp = StreamingResponse(iter_bytes(), media_type=content_type, status_code=r.status_code)
        # 透传 Mcp-Session-Id 以便上层使用
        if session_id:
            resp.headers["Mcp-Session-Id"] = session_id
        return resp


@router.api_route("/{path:path}", methods=["GET", "POST", "DELETE"], include_in_schema=False)
async def proxy_all(path: str, request: Request) -> Response:
    target_url = _build_target_url(path, request.url.query)
    return await _proxy_stream(request.method.upper(), request, target_url)

