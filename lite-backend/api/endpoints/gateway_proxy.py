from fastapi import APIRouter, HTTPException
import os
import httpx

router = APIRouter(prefix="/gateway", tags=["Gateway Proxy"])


def _gw_base() -> str:
    base = os.getenv("LLM_GATEWAY_URL", "http://127.0.0.1:9050").rstrip("/")
    return base


@router.get("/mcp/registry")
async def proxy_mcp_registry():
    base = _gw_base()
    url = f"{base}/mcp/registry"
    try:
        async with httpx.AsyncClient(timeout=10.0) as hc:
            r = await hc.get(url)
            if r.status_code >= 500:
                raise HTTPException(status_code=502, detail="gateway upstream error")
            return r.json()
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"proxy error: {e}")


@router.get("/mcp/servers/{name}/tools")
async def proxy_mcp_server_tools(name: str):
    base = _gw_base()
    url = f"{base}/mcp/servers/{name}/tools"
    try:
        async with httpx.AsyncClient(timeout=15.0) as hc:
            r = await hc.get(url)
            if r.status_code >= 500:
                raise HTTPException(status_code=502, detail="gateway upstream error")
            return r.json()
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"proxy error: {e}")


# ---------------- API Tools ----------------

@router.get("/api-tools/configs")
async def proxy_api_tools_configs():
    base = _gw_base()
    url = f"{base}/api-tools/configs"
    try:
        async with httpx.AsyncClient(timeout=10.0) as hc:
            r = await hc.get(url)
            if r.status_code >= 500:
                raise HTTPException(status_code=502, detail="gateway upstream error")
            return r.json()
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"proxy error: {e}")


@router.get("/api-tools/configs/{name}/tools")
async def proxy_api_tools_of_config(name: str):
    base = _gw_base()
    url = f"{base}/api-tools/configs/{name}/tools"
    try:
        async with httpx.AsyncClient(timeout=10.0) as hc:
            r = await hc.get(url)
            if r.status_code >= 500:
                raise HTTPException(status_code=502, detail="gateway upstream error")
            return r.json()
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"proxy error: {e}")
