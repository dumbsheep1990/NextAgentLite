"""API网关代理路由
统一代理转发所有外部服务请求，实现类似nginx反向代理的功能
"""
from fastapi import APIRouter, Request, Response, HTTPException
from fastapi.responses import StreamingResponse
import httpx
from typing import Dict, Optional
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/gateway", tags=["gateway"])

# 服务配置映射
SERVICES = {
    "matgraph": {
        "base_url": "http://127.0.0.1:9622",
        "prefix": "/matgraph",
        "name": "MatGraph知识图谱服务"
    },
    "unla": {
        "base_url": "http://127.0.0.1:5173",
        "prefix": "/unla",
        "name": "Unla模型管理服务"
    },
    "llm_gateway": {
        "base_url": "http://127.0.0.1:9050",
        "prefix": "/llm-gateway",
        "name": "LLM统一网关"
    },
    "deepscrape": {
        "base_url": "http://127.0.0.1:3001",
        "prefix": "/deepscrape",
        "name": "DeepScrape爬虫服务"
    }
}

# 全局HTTP客户端（复用连接）
http_client: Optional[httpx.AsyncClient] = None

async def get_http_client() -> httpx.AsyncClient:
    """获取或创建HTTP客户端"""
    global http_client
    if http_client is None:
        http_client = httpx.AsyncClient(
            timeout=httpx.Timeout(300.0),  # 5分钟超时
            limits=httpx.Limits(max_keepalive_connections=50, max_connections=100),
            follow_redirects=True
        )
    return http_client

async def close_http_client():
    """关闭HTTP客户端"""
    global http_client
    if http_client:
        await http_client.aclose()
        http_client = None

async def proxy_request(
    request: Request,
    target_base_url: str,
    remove_prefix: str = None,
    service_name: str = "未知服务"
) -> Response:
    """
    通用代理请求处理器

    Args:
        request: FastAPI请求对象
        target_base_url: 目标服务的基础URL
        remove_prefix: 需要从路径中移除的前缀
        service_name: 服务名称（用于日志）

    Returns:
        代理后的响应
    """
    try:
        # 构建目标URL
        path = request.url.path
        if remove_prefix and path.startswith(remove_prefix):
            path = path[len(remove_prefix):]

        # 确保路径以/开头
        if not path.startswith("/"):
            path = "/" + path

        target_url = f"{target_base_url}{path}"
        if request.url.query:
            target_url = f"{target_url}?{request.url.query}"

        logger.info(f"[GATEWAY] 代理请求: {service_name} | {request.method} {request.url.path} -> {target_url}")

        # 获取HTTP客户端
        client = await get_http_client()

        # 准备请求头（移除Host头避免冲突）
        headers = dict(request.headers)
        headers.pop('host', None)

        # 读取请求体
        body = await request.body()

        # 发送代理请求
        proxy_response = await client.request(
            method=request.method,
            url=target_url,
            headers=headers,
            content=body,
        )

        # 准备响应头
        response_headers = dict(proxy_response.headers)

        # 移除可能导致问题的头
        for header in ['content-encoding', 'content-length', 'transfer-encoding']:
            response_headers.pop(header, None)

        # 对于流式响应，使用StreamingResponse
        if 'text/event-stream' in response_headers.get('content-type', ''):
            async def stream_generator():
                async for chunk in proxy_response.aiter_bytes():
                    yield chunk

            return StreamingResponse(
                stream_generator(),
                status_code=proxy_response.status_code,
                headers=response_headers,
                media_type=response_headers.get('content-type', 'text/event-stream')
            )

        # 普通响应
        return Response(
            content=proxy_response.content,
            status_code=proxy_response.status_code,
            headers=response_headers,
            media_type=response_headers.get('content-type')
        )

    except httpx.HTTPError as e:
        logger.error(f"[GATEWAY] 代理请求失败: {service_name} | {str(e)}")
        raise HTTPException(
            status_code=502,
            detail=f"代理请求失败: {service_name} 服务不可用"
        )
    except Exception as e:
        logger.error(f"[GATEWAY] 代理处理异常: {service_name} | {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"代理处理异常: {str(e)}"
        )

# MatGraph知识图谱服务代理
@router.api_route("/matgraph/{path:path}", methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"])
async def matgraph_proxy(request: Request, path: str):
    """代理MatGraph知识图谱服务"""
    config = SERVICES["matgraph"]
    return await proxy_request(request, config["base_url"], config["prefix"], config["name"])

# Unla模型管理服务代理
@router.api_route("/unla/{path:path}", methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"])
async def unla_proxy(request: Request, path: str):
    """代理Unla模型管理服务"""
    config = SERVICES["unla"]
    return await proxy_request(request, config["base_url"], config["prefix"], config["name"])

# LLM统一网关代理
@router.api_route("/llm-gateway/{path:path}", methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"])
async def llm_gateway_proxy(request: Request, path: str):
    """代理LLM统一网关"""
    config = SERVICES["llm_gateway"]
    return await proxy_request(request, config["base_url"], config["prefix"], config["name"])

# DeepScrape爬虫服务代理
@router.api_route("/deepscrape/{path:path}", methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"])
async def deepscrape_proxy(request: Request, path: str):
    """代理DeepScrape爬虫服务"""
    config = SERVICES["deepscrape"]
    return await proxy_request(request, config["base_url"], config["prefix"], config["name"])

# 健康检查
@router.get("/health")
async def gateway_health():
    """网关健康检查"""
    services_status = {}
    client = await get_http_client()

    for service_key, config in SERVICES.items():
        try:
            response = await client.get(f"{config['base_url']}/health", timeout=5.0)
            services_status[service_key] = {
                "name": config["name"],
                "status": "healthy" if response.status_code == 200 else "unhealthy",
                "status_code": response.status_code
            }
        except Exception as e:
            services_status[service_key] = {
                "name": config["name"],
                "status": "unavailable",
                "error": str(e)
            }

    all_healthy = all(s.get("status") == "healthy" for s in services_status.values())

    return {
        "gateway": "healthy",
        "services": services_status,
        "overall": "healthy" if all_healthy else "degraded"
    }

# 获取服务配置
@router.get("/services")
async def list_services():
    """列出所有代理服务配置"""
    return {
        "services": [
            {
                "key": key,
                "name": config["name"],
                "prefix": config["prefix"],
                "base_url": config["base_url"]
            }
            for key, config in SERVICES.items()
        ]
    }
