"""
Unla 集成服务
- 管理：对接 Unla apiserver（配置增删改查、OpenAPI 导入、同步触发）
- 同步：将 Unla 的租户/路由前缀/协议映射到本地数据库（MCPServer.server_metadata 与 UnlaRouterMap）
"""
from __future__ import annotations

import os
import io
import json
import datetime as dt
from typing import Any, Dict, List, Optional

import httpx
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from core.logger import logger
from db.database import get_async_session
from models.mcp_models import MCPServer, UnlaRouterMap


def _env(name: str, default: str = "") -> str:
    return os.getenv(name, default)


class UnlaIntegrationService:
    def __init__(self) -> None:
        self.apiserver_base = _env("UNLA_APISERVER_URL", "http://localhost:5234")
        self.gateway_base = _env("UNLA_GATEWAY_URL", "http://localhost:5235")
        # 内嵌模式下不再依赖 Unla 自身的用户系统，这里保留字段仅兼容旧逻辑
        self.sa_user = _env("UNLA_SUPER_ADMIN_USERNAME", "admin")
        self.sa_pass = _env("UNLA_SUPER_ADMIN_PASSWORD", "admin")
        self.default_tenant = _env("UNLA_TENANT_DEFAULT", "default")
        self._token: Optional[str] = None
        self._client = httpx.AsyncClient(timeout=30.0)

    def _get_service_token(self) -> str:
        """使用宿主后端与 Unla 共用的 SECRET_KEY 本地签发服务 JWT。

        要求：脚本已将 SECRET_KEY 透传为 Unla 的 APISERVER_JWT_SECRET_KEY（unla_env.sh 已实现）。
        """
        from utils.jwt_utils import create_access_token
        token = create_access_token({
            "username": "system_admin",
            "role": "admin",
            "name": "System Admin",
        })
        return token

    def _auth_headers(self) -> Dict[str, str]:
        return {"Authorization": f"Bearer {self._get_service_token()}"}

    async def list_configs(self) -> List[Dict[str, Any]]:
        url = f"{self.apiserver_base}/api/mcp/configs"
        r = await self._client.get(url, headers=self._auth_headers())
        r.raise_for_status()
        data = r.json() or {}
        # apiserver handler sends i18n envelope; try unwrap
        items = data.get("data") or data
        return items if isinstance(items, list) else []

    async def sync_gateway(self) -> None:
        url = f"{self.apiserver_base}/api/mcp/configs/sync"
        r = await self._client.post(url, headers=self._auth_headers())
        r.raise_for_status()

    async def import_openapi(self, file_bytes: bytes, filename: str, tenant_name: Optional[str] = None, prefix: Optional[str] = None) -> Dict[str, Any]:
        url = f"{self.apiserver_base}/api/openapi/import"
        headers = self._auth_headers()
        tenant_name = tenant_name or self.default_tenant
        form = {
            "tenantName": (None, tenant_name),
        }
        if prefix:
            form["prefix"] = (None, prefix)
        files = {
            "file": (filename, io.BytesIO(file_bytes), "application/octet-stream"),
        }
        r = await self._client.post(url, headers=headers, files=files, data=form)
        r.raise_for_status()
        return r.json()

    async def _upsert_unla_router(self, session: AsyncSession, router: Dict[str, Any], server_name: str, tenant: str) -> None:
        prefix = router.get("prefix") or ""
        proto_type = (router.get("protoType") or router.get("proto_type") or "").lower()
        version = router.get("version") or ""
        now = dt.datetime.now(dt.timezone.utc)
        mcp_endpoint = f"/gateway{prefix}/mcp"
        sse_endpoint = f"/gateway{prefix}/sse"

        # upsert UnlaRouterMap
        exists_q = await session.execute(select(UnlaRouterMap).where(UnlaRouterMap.tenant == tenant, UnlaRouterMap.router_prefix == prefix))
        existing = exists_q.scalar_one_or_none()
        if existing:
            existing.server_name = server_name
            existing.proto_type = proto_type
            existing.mcp_endpoint = mcp_endpoint
            existing.sse_endpoint = sse_endpoint
            existing.version = version
            existing.last_synced_at = now
            existing.updated_at = now
        else:
            session.add(UnlaRouterMap(
                tenant=tenant,
                server_name=server_name,
                router_prefix=prefix,
                proto_type=proto_type,
                mcp_endpoint=mcp_endpoint,
                sse_endpoint=sse_endpoint,
                version=version,
                last_synced_at=now,
            ))

    async def sync_configs_to_db(self) -> Dict[str, int]:
        """从 Unla 同步路由/服务器到本地数据库。

        将关键信息写入 MCPServer.server_metadata 并刷新 UnlaRouterMap。
        """
        items = await self.list_configs()
        created_or_updated = 0
        routers_synced = 0

        async with get_async_session() as session:
            for cfg in items:
                # cfg: { name, tenant, routers:[], servers:[], ... }
                server_name = cfg.get("name") or ""
                tenant = cfg.get("tenant") or self.default_tenant
                routers = cfg.get("routers") or cfg.get("Routers") or []

                # 将映射写入 UnlaRouterMap
                for r in routers:
                    await self._upsert_unla_router(session, r, server_name, tenant)
                    routers_synced += 1

                # 影子写入 MCPServer.server_metadata（若存在同名则更新）
                # 使用 name 作为唯一键（与现有表唯一约束一致）
                q = await session.execute(select(MCPServer).where(MCPServer.name == server_name))
                mcp_server = q.scalar_one_or_none()
                metadata = {
                    "unla": True,
                    "tenant": tenant,
                    "routers": routers,
                }
                if mcp_server:
                    mcp_server.server_metadata = {**(mcp_server.server_metadata or {}), **metadata}
                else:
                    # 最小化影子对象，必要字段占位
                    mcp_server = MCPServer(
                        name=server_name,
                        display_name=server_name,
                        description=f"Unla server mirror for {server_name}",
                        server_type="external",
                        connection_config={},
                        transport_type="http",
                        server_metadata=metadata,
                        is_enabled=True,
                        health_status="unknown",
                    )
                    session.add(mcp_server)
                created_or_updated += 1

            await session.commit()

        return {"servers": created_or_updated, "routers": routers_synced}


# 全局实例
unla_integration_service = UnlaIntegrationService()
