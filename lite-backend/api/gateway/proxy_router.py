"""API网关代理路由
统一代理转发所有外部服务请求，实现类似nginx反向代理的功能

注意:
- 本网关使用 /api-gateway 前缀，避免与Unla专用网关(/gateway)冲突
- Unla的MCP/SSE协议继续使用 /gateway 路径(端口5235)
- 服务配置从 config/gateway_services.yaml 加载
"""
from fastapi import APIRouter, Request, Response, HTTPException
from fastapi.responses import StreamingResponse
import httpx
from typing import Dict, Optional
import logging
import re
from urllib.parse import urlparse

from .config_loader import get_config_loader, reload_config

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api-gateway", tags=["API Gateway"])

# 全局HTTP客户端（复用连接）
http_client: Optional[httpx.AsyncClient] = None

async def get_http_client() -> httpx.AsyncClient:
    """获取或创建HTTP客户端（使用配置文件中的参数）"""
    global http_client
    if http_client is None:
        config_loader = get_config_loader()
        http_config = config_loader.get_http_config()

        http_client = httpx.AsyncClient(
            timeout=httpx.Timeout(
                connect=http_config.connect_timeout,
                read=http_config.read_timeout,
                write=http_config.write_timeout,
                pool=http_config.connect_timeout  # 连接池超时，使用connect_timeout作为默认值
            ),
            limits=httpx.Limits(
                max_keepalive_connections=http_config.max_keepalive_connections,
                max_connections=http_config.max_connections
            ),
            follow_redirects=http_config.follow_redirects
        )
        logger.info(f"[网关] HTTP客户端已初始化 (连接池: {http_config.max_connections})")
    return http_client

async def close_http_client():
    """关闭HTTP客户端"""
    global http_client
    if http_client:
        await http_client.aclose()
        http_client = None

async def proxy_request_direct(
    request: Request,
    target_url: str,
    service_name: str = "未知服务",
    gateway_prefix: str = None
) -> Response:
    """
    直接代理请求处理器（使用完整目标URL）

    Args:
        request: FastAPI请求对象
        target_url: 完整的目标URL
        service_name: 服务名称（用于日志）
        gateway_prefix: 网关前缀路径，用于重写HTML中的资源路径

    Returns:
        代理后的响应
    """
    try:
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

        # 获取响应内容
        content = proxy_response.content
        content_type = response_headers.get('content-type', '')

        # 对于JavaScript内容，重写monaco-editor路径
        # 检查content-type或URL路径中的.js扩展名
        is_javascript = (
            'application/javascript' in content_type or
            'text/javascript' in content_type or
            target_url.endswith('.js') or
            '/monaco-editor/vs/' in target_url
        )

        if gateway_prefix and is_javascript:
            try:
                content_str = content.decode('utf-8')

                # 重写monaco-editor路径配置
                # 1. 匹配 loader.config paths: vs: '/monaco-editor/vs'
                # 2. 匹配 getWorkerUrl function return '/monaco-editor/...'
                # 3. 匹配变量赋值 const n="/monaco-editor/vs"
                # 4. 匹配 baseUrl: "/monaco-editor/vs"
                monaco_path_patterns = [
                    # Pattern 1: Rewrite vs path in loader config - paths.vs: '/monaco-editor/vs'
                    (r"(['\"])\/monaco-editor\/vs\1", rf"\1{gateway_prefix}/monaco-editor/vs\1"),
                    # Pattern 2: Rewrite getWorkerUrl return path
                    (r'return\s*(["\'])\/monaco-editor\/', rf'return \1{gateway_prefix}/monaco-editor/'),
                    # Pattern 3: Rewrite variable assignment: const n="/monaco-editor/vs"
                    (r'(const|let|var)\s+(\w+)\s*=\s*(["\'])\/monaco-editor\/vs\3', rf'\1 \2=\3{gateway_prefix}/monaco-editor/vs\3'),
                    # Pattern 4: Rewrite baseUrl property: baseUrl:"/monaco-editor/vs"
                    (r'baseUrl\s*:\s*(["\'])\/monaco-editor\/vs\1', rf'baseUrl:\1{gateway_prefix}/monaco-editor/vs\1'),
                    # Pattern 5: Rewrite any standalone "/monaco-editor/vs" string literals in assignment context
                    (r'([=:,(\[\s])(["\'])\/monaco-editor\/vs\2', rf'\1\2{gateway_prefix}/monaco-editor/vs\2'),
                ]

                original_content = content_str
                for pattern, replacement in monaco_path_patterns:
                    content_str = re.sub(pattern, replacement, content_str)

                if content_str != original_content:
                    logger.info(f"[GATEWAY] JS内容重写: Monaco路径已更新为 {gateway_prefix}/monaco-editor/vs")
                    content = content_str.encode('utf-8')
                else:
                    content = original_content.encode('utf-8')
            except Exception as e:
                logger.warning(f"[GATEWAY] JS路径重写失败: {e}，使用原始内容")

        # 对于HTML内容，重写资源路径以支持iframe嵌入
        elif gateway_prefix and ('text/html' in content_type or 'application/xhtml' in content_type):
            try:
                content_str = content.decode('utf-8')

                # 解析目标URL获取路径前缀
                parsed_target = urlparse(target_url)
                target_path_prefix = parsed_target.path.rstrip('/')

                # 特殊识别：Unla Web服务（即使有路径前缀也按SPA处理）
                is_unla_web = (
                    gateway_prefix == "/api-gateway/model" or
                    "模型管理" in service_name or
                    "Unla" in service_name
                )

                # 情况1：有路径前缀的服务（如 MatGraph: /webui），但排除Unla Web
                if target_path_prefix and not is_unla_web:
                    # 重写绝对路径的静态资源引用
                    # 将 /webui/assets/xxx 重写为 /api-gateway/matgraph/webui/assets/xxx
                    old_prefix = f"{target_path_prefix}/"
                    new_prefix = f"{gateway_prefix}{target_path_prefix}/"

                    replacements = [
                        (f'src="{old_prefix}', f'src="{new_prefix}'),
                        (f"src='{old_prefix}", f"src='{new_prefix}"),
                        (f'href="{old_prefix}', f'href="{new_prefix}'),
                        (f"href='{old_prefix}", f"href='{new_prefix}"),
                        (f'url({old_prefix}', f'url({new_prefix}'),
                        (f'url("{old_prefix}', f'url("{new_prefix}'),
                        (f"url('{old_prefix}", f"url('{new_prefix}"),
                    ]

                    for old, new in replacements:
                        content_str = content_str.replace(old, new)

                    logger.debug(f"[GATEWAY] HTML路径重写(有前缀): {old_prefix} -> {new_prefix}")

                    # 为DataGraph WebUI注入API路径拦截器
                    # 拦截所有API请求，将相对路径转换为网关路径
                    if '<head>' in content_str:
                        config_script = f'''<script>
    // DataGraph API base path and theme configuration injected by gateway
    (function() {{
        const GATEWAY_PREFIX = '{gateway_prefix}';
        console.log('[Gateway] Injecting DataGraph API interceptor, prefix:', GATEWAY_PREFIX);

        // 强制设置light主题
        try {{
            const settingsKey = 'settings-storage';
            const settingsStr = localStorage.getItem(settingsKey);
            if (settingsStr) {{
                const settings = JSON.parse(settingsStr);
                if (settings.state && settings.state.theme !== 'light') {{
                    settings.state.theme = 'light';
                    localStorage.setItem(settingsKey, JSON.stringify(settings));
                    console.log('[Gateway] Force set DataGraph theme to light');
                }}
            }}
        }} catch (e) {{
            console.warn('[Gateway] Failed to set theme:', e);
        }}

        // 拦截fetch请求
        const originalFetch = window.fetch;
        window.fetch = function(url, options) {{
            // 如果是相对于根的绝对路径（如 /auth-status, /health）
            if (typeof url === 'string' && url.startsWith('/') && !url.startsWith('/api-gateway') && !url.startsWith('http')) {{
                // 重写为网关路径
                const newUrl = GATEWAY_PREFIX + url;
                console.log('[Gateway] Rewriting fetch URL:', url, '->', newUrl);
                return originalFetch.call(this, newUrl, options);
            }}
            return originalFetch.call(this, url, options);
        }};

        // 拦截XMLHttpRequest
        const originalOpen = XMLHttpRequest.prototype.open;
        XMLHttpRequest.prototype.open = function(method, url, ...args) {{
            if (typeof url === 'string' && url.startsWith('/') && !url.startsWith('/api-gateway') && !url.startsWith('http')) {{
                const newUrl = GATEWAY_PREFIX + url;
                console.log('[Gateway] Rewriting XHR URL:', url, '->', newUrl);
                return originalOpen.call(this, method, newUrl, ...args);
            }}
            return originalOpen.call(this, method, url, ...args);
        }};

        console.log('[Gateway] DataGraph API interceptor installed successfully');
    }})();
</script>'''
                        content_str = content_str.replace('<head>', f'<head>\n{config_script}', 1)
                        logger.debug(f"[GATEWAY] 注入DataGraph API拦截器: {gateway_prefix}")

                # 情况2：SPA应用（如 Unla Web: 使用React Router，路径由前端控制）
                else:
                    # 策略：同时使用路径重写和base标签
                    # - 路径重写：处理HTML中的静态资源（绝对路径不受base标签影响）
                    # - base标签：处理JS中动态生成的路径（相对路径）

                    # 步骤1：重写HTML中的绝对路径静态资源
                    patterns = [
                        (r'src="(/(?!api-gateway|http)[^"]+)"', rf'src="{gateway_prefix}\1"'),
                        (r"src='(/(?!api-gateway|http)[^']+)'", rf"src='{gateway_prefix}\1'"),
                        (r'href="(/(?!api-gateway|http)[^"]+)"', rf'href="{gateway_prefix}\1"'),
                        (r"href='(/(?!api-gateway|http)[^']+)'", rf"href='{gateway_prefix}\1'"),
                        (r'url\((/(?!api-gateway|http)[^)]+)\)', rf'url({gateway_prefix}\1)'),
                    ]

                    for pattern, replacement in patterns:
                        content_str = re.sub(pattern, replacement, content_str)

                    logger.debug(f"[GATEWAY] HTML路径重写(SPA应用): {service_name} | {target_path_prefix or '/'} -> {gateway_prefix}/")

                    # 步骤2：注入API拦截器 + base标签
                    if '<head>' in content_str:
                        # 注入请求拦截器处理JS动态路径
                        interceptor_script = f'''<script>
    // Gateway API interceptor for Unla Web
    (function() {{
        const GATEWAY_PREFIX = '{gateway_prefix}';
        console.log('[Gateway] Injecting Unla Web comprehensive interceptor, prefix:', GATEWAY_PREFIX);

        // 辅助函数：重写URL
        function rewriteUrl(url) {{
            if (typeof url === 'string' && url.startsWith('/') && !url.startsWith('/api-gateway') && !url.startsWith('http')) {{
                // 所有请求都加网关前缀（包括/api/），避免CORS问题
                return GATEWAY_PREFIX + url;
            }}
            return url;
        }}

        // 1. 拦截fetch请求
        const originalFetch = window.fetch;
        window.fetch = function(url, options) {{
            const newUrl = rewriteUrl(url);
            if (newUrl !== url) console.log('[Gateway] Fetch:', url, '->', newUrl);
            return originalFetch.call(this, newUrl, options);
        }};

        // 2. 拦截XMLHttpRequest
        const originalOpen = XMLHttpRequest.prototype.open;
        XMLHttpRequest.prototype.open = function(method, url, ...args) {{
            const newUrl = rewriteUrl(url);
            if (newUrl !== url) console.log('[Gateway] XHR:', url, '->', newUrl);
            return originalOpen.call(this, method, newUrl, ...args);
        }};

        // 3. 拦截Image对象的src属性
        const OriginalImage = window.Image;
        window.Image = function() {{
            const img = new OriginalImage();
            const descriptor = Object.getOwnPropertyDescriptor(HTMLImageElement.prototype, 'src');
            Object.defineProperty(img, 'src', {{
                get: function() {{
                    return descriptor.get.call(this);
                }},
                set: function(value) {{
                    const newValue = rewriteUrl(value);
                    if (newValue !== value) console.log('[Gateway] Image src:', value, '->', newValue);
                    descriptor.set.call(this, newValue);
                }}
            }});
            return img;
        }};

        // 4. 拦截HTMLImageElement的src属性设置
        const imgSrcDescriptor = Object.getOwnPropertyDescriptor(HTMLImageElement.prototype, 'src');
        if (imgSrcDescriptor && imgSrcDescriptor.set) {{
            const originalSrcSetter = imgSrcDescriptor.set;
            Object.defineProperty(HTMLImageElement.prototype, 'src', {{
                get: imgSrcDescriptor.get,
                set: function(value) {{
                    const newValue = rewriteUrl(value);
                    if (newValue !== value) console.log('[Gateway] IMG.src:', value, '->', newValue);
                    originalSrcSetter.call(this, newValue);
                }},
                configurable: true,
                enumerable: true
            }});
        }}

        // 5. 拦截setAttribute - 扩展到script和link标签
        const originalSetAttribute = Element.prototype.setAttribute;
        Element.prototype.setAttribute = function(name, value) {{
            if ((name === 'src' && (this.tagName === 'IMG' || this.tagName === 'SCRIPT')) ||
                (name === 'href' && this.tagName === 'LINK')) {{
                const newValue = rewriteUrl(value);
                if (newValue !== value) console.log('[Gateway] setAttribute', name + ':', value, '->', newValue);
                return originalSetAttribute.call(this, name, newValue);
            }}
            return originalSetAttribute.call(this, name, value);
        }};

        // 6. 拦截HTMLScriptElement的src属性（用于monaco-editor等动态加载）
        const scriptSrcDescriptor = Object.getOwnPropertyDescriptor(HTMLScriptElement.prototype, 'src');
        if (scriptSrcDescriptor && scriptSrcDescriptor.set) {{
            const originalScriptSrcSetter = scriptSrcDescriptor.set;
            Object.defineProperty(HTMLScriptElement.prototype, 'src', {{
                get: scriptSrcDescriptor.get,
                set: function(value) {{
                    const newValue = rewriteUrl(value);
                    if (newValue !== value) console.log('[Gateway] SCRIPT.src:', value, '->', newValue);
                    originalScriptSrcSetter.call(this, newValue);
                }},
                configurable: true,
                enumerable: true
            }});
        }}

        // 7. 拦截HTMLLinkElement的href属性
        const linkHrefDescriptor = Object.getOwnPropertyDescriptor(HTMLLinkElement.prototype, 'href');
        if (linkHrefDescriptor && linkHrefDescriptor.set) {{
            const originalLinkHrefSetter = linkHrefDescriptor.set;
            Object.defineProperty(HTMLLinkElement.prototype, 'href', {{
                get: linkHrefDescriptor.get,
                set: function(value) {{
                    const newValue = rewriteUrl(value);
                    if (newValue !== value) console.log('[Gateway] LINK.href:', value, '->', newValue);
                    originalLinkHrefSetter.call(this, newValue);
                }},
                configurable: true,
                enumerable: true
            }});
        }}

        console.log('[Gateway] Unla Web interceptor installed (fetch, XHR, Image, Script, Link, setAttribute)');
    }})();
</script>
'''
                        # 同时插入base标签作为兜底
                        base_tag = f'<base href="{gateway_prefix}/">'
                        content_str = content_str.replace('<head>', f'<head>\n{interceptor_script}\n    {base_tag}', 1)
                        logger.debug(f"[GATEWAY] 注入SPA应用拦截器和base标签: {service_name} | {gateway_prefix}")

                content = content_str.encode('utf-8')
            except Exception as e:
                logger.warning(f"[GATEWAY] HTML路径重写失败: {e}，使用原始内容")

        # 普通响应
        return Response(
            content=content,
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
    config_loader = get_config_loader()
    service_config = config_loader.get_service("matgraph")
    if not service_config or not service_config.enabled:
        raise HTTPException(status_code=503, detail="MatGraph服务未启用")

    # 直接使用路由path参数构建目标URL
    target_url = f"{service_config.base_url}/{path}"
    if request.url.query:
        target_url = f"{target_url}?{request.url.query}"

    # 传入网关前缀以重写HTML中的静态资源路径
    return await proxy_request_direct(request, target_url, service_config.name, gateway_prefix="/api-gateway/matgraph")

# LLM统一网关代理
@router.api_route("/llm-gateway/{path:path}", methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"])
async def llm_gateway_proxy(request: Request, path: str):
    """代理LLM统一网关"""
    config_loader = get_config_loader()
    service_config = config_loader.get_service("llm_gateway")
    if not service_config or not service_config.enabled:
        raise HTTPException(status_code=503, detail="LLM Gateway服务未启用")

    # 直接使用路由path参数构建目标URL
    target_url = f"{service_config.base_url}/{path}"
    if request.url.query:
        target_url = f"{target_url}?{request.url.query}"

    return await proxy_request_direct(request, target_url, service_config.name)

# DeepScrape爬虫服务代理
@router.api_route("/deepscrape/{path:path}", methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"])
async def deepscrape_proxy(request: Request, path: str):
    """代理DeepScrape爬虫服务"""
    config_loader = get_config_loader()
    service_config = config_loader.get_service("deepscrape")
    if not service_config or not service_config.enabled:
        raise HTTPException(status_code=503, detail="DeepScrape服务未启用")

    # 直接使用路由path参数构建目标URL
    target_url = f"{service_config.base_url}/{path}"
    if request.url.query:
        target_url = f"{target_url}?{request.url.query}"

    return await proxy_request_direct(request, target_url, service_config.name)

# Unla API服务代理（优先匹配 /model/api/*）
@router.api_route("/model/api/{path:path}", methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"])
async def unla_api_proxy(request: Request, path: str):
    """代理Unla API服务（对话模型、向量模型、重排模型等API）"""
    # Unla API服务运行在5234端口
    unla_api_base_url = "http://localhost:5234"

    # 构建目标URL: http://localhost:5234/api/{path}
    target_url = f"{unla_api_base_url}/api/{path}"
    if request.url.query:
        target_url = f"{target_url}?{request.url.query}"

    logger.info(f"[GATEWAY] Unla API代理: /model/api/{path} -> {target_url}")

    return await proxy_request_direct(request, target_url, "Unla API服务")

# LLM模型管理Web服务代理
@router.api_route("/model/{path:path}", methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"])
async def unla_web_proxy(request: Request, path: str):
    """代理LLM模型管理Web服务"""
    config_loader = get_config_loader()
    service_config = config_loader.get_service("unla")
    if not service_config or not service_config.enabled:
        raise HTTPException(status_code=503, detail="模型管理服务未启用")

    # 直接使用路由path参数构建目标URL
    target_url = f"{service_config.base_url}/{path}"
    if request.url.query:
        target_url = f"{target_url}?{request.url.query}"

    # 传入网关前缀以重写HTML中的静态资源路径
    return await proxy_request_direct(request, target_url, service_config.name, gateway_prefix="/api-gateway/model")

# 健康检查
@router.get("/health")
async def gateway_health():
    """网关健康检查"""
    config_loader = get_config_loader()
    services = config_loader.get_enabled_services()
    services_status = {}
    client = await get_http_client()

    for service_key, service_config in services.items():
        if service_config.health_check:
            try:
                health_url = f"{service_config.base_url}{service_config.health_check}"
                response = await client.get(health_url, timeout=5.0)
                services_status[service_key] = {
                    "name": service_config.name,
                    "status": "healthy" if response.status_code == 200 else "unhealthy",
                    "status_code": response.status_code
                }
            except Exception as e:
                services_status[service_key] = {
                    "name": service_config.name,
                    "status": "unavailable",
                    "error": str(e)
                }
        else:
            services_status[service_key] = {
                "name": service_config.name,
                "status": "no_health_check",
                "message": "服务未配置健康检查端点"
            }

    all_healthy = all(
        s.get("status") in ["healthy", "no_health_check"]
        for s in services_status.values()
    )

    return {
        "gateway": "healthy",
        "services": services_status,
        "overall": "healthy" if all_healthy else "degraded"
    }

# 获取服务配置
@router.get("/services")
async def list_services():
    """列出所有代理服务配置"""
    config_loader = get_config_loader()
    services = config_loader.get_enabled_services()

    return {
        "services": [
            {
                "key": key,
                "name": config.name,
                "prefix": config.prefix,
                "base_url": config.base_url,
                "description": config.description,
                "timeout": config.timeout
            }
            for key, config in services.items()
        ]
    }

# 重新加载配置
@router.post("/reload")
async def reload_gateway_config():
    """重新加载网关配置"""
    try:
        reload_config()
        # 重置HTTP客户端以应用新配置
        await close_http_client()
        return {"status": "success", "message": "配置已重新加载"}
    except Exception as e:
        logger.error(f"[网关] 重新加载配置失败: {e}")
        raise HTTPException(status_code=500, detail=f"重新加载配置失败: {str(e)}")
