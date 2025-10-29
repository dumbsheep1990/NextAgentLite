from typing import List, Dict, Any, Optional

import asyncio
from fastapi import APIRouter, Body, Query
from pydantic import BaseModel


router = APIRouter()


class PortTarget(BaseModel):
    key: str
    host: str = "localhost"
    port: int


class PortCheckRequest(BaseModel):
    targets: List[PortTarget]


async def _probe_port(host: str, port: int, timeout: float = 1.2) -> bool:
    """尽力探测端口是否可连接。
    - 当 host 为 localhost 时，依次尝试 ['127.0.0.1', 'localhost', '::1'] 以规避 IPv4/IPv6 差异。
    - 对于远程主机，直接尝试连接。
    - 成功建立 TCP 连接即视为 up。
    """
    # 本地主机尝试多个候选地址
    candidates = [host]
    if host in ("localhost", "127.0.0.1", "::1"):
        candidates = ["127.0.0.1", "localhost", "::1"]

    for h in candidates:
        try:
            coro = asyncio.open_connection(host=h, port=port)
            reader, writer = await asyncio.wait_for(coro, timeout=timeout)
            writer.close()
            try:
                await writer.wait_closed()
            except Exception:
                pass
            return True
        except Exception:
            continue
    return False


@router.post("/system/ports/check")
async def check_ports(payload: PortCheckRequest = Body(...)) -> Dict[str, Any]:
    statuses: Dict[str, str] = {}

    async def _one(t: PortTarget):
        up = await _probe_port(t.host, t.port)
        statuses[t.key] = "up" if up else "down"

    await asyncio.gather(*[_one(t) for t in payload.targets])
    return {"success": True, "statuses": statuses}


@router.get("/system/ports/check")
async def check_ports_quick(
    ports: str = Query(..., description="逗号分隔的端口列表，如 8000,5173"),
    host: str = Query("localhost")
) -> Dict[str, Any]:
    parts = [p.strip() for p in ports.split(",") if p.strip()]
    statuses: Dict[str, str] = {}
    for p in parts:
        try:
            port = int(p)
        except Exception:
            continue
        up = await _probe_port(host, port)
        statuses[str(port)] = "up" if up else "down"
    return {"success": True, "host": host, "statuses": statuses}
