from typing import Any, Dict, List, Optional

from fastapi import APIRouter, HTTPException, Query

from service.llm_config_gateway_client import (
    get_llm_config_gateway_client,
)
import httpx


router = APIRouter(prefix="/models-gateway", tags=["统一模型网关"])


@router.get("/defaults/simple")
async def get_defaults_simple() -> Dict[str, Any]:
    try:
        client = await get_llm_config_gateway_client()
        return await client.get_defaults_simple()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/providers")
async def list_providers() -> List[Dict[str, Any]]:
    try:
        client = await get_llm_config_gateway_client()
        prov = await client.list_providers()
        return [p.__dict__ for p in prov]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/models")
async def list_models(
    type: Optional[str] = Query(None, regex="^(chat|embedding)$"),
    enabled: bool = Query(True, description="仅返回已启用模型")
) -> List[Dict[str, Any]]:
    try:
        client = await get_llm_config_gateway_client()
        # 仅返回启用：从 9050 的 /v1/models/enabled 拉取并扁平化
        if enabled:
            async with httpx.AsyncClient(timeout=15.0) as hc:
                resp = await hc.get(f"{client.base_url}/v1/models/enabled")
                if resp.status_code != 200:
                    raise HTTPException(status_code=resp.status_code, detail=resp.text)
                data = resp.json() or {}
                out: List[Dict[str, Any]] = []
                for prov in data.get("providers", []):
                    pname = prov.get("name", "")
                    ptype = prov.get("type", "")
                    for m in prov.get("models", []):
                        if type and m.get("model_type") != type:
                            continue
                        mid = (m.get("model_id") or "").strip()
                        dname = (m.get("display_name") or mid).strip()
                        # 过滤异常占位项
                        if not mid or mid.lower() == 'string' or dname.lower() == 'string':
                            continue
                        out.append({
                            "id": 0,
                            "model_id": mid,
                            "display_name": dname,
                            "model_type": m.get("model_type"),
                            "provider_name": pname,
                            "provider_type": ptype,
                            "base_url": "",
                        })
                return out
        else:
            # 返回完整列表时，直接透传 9050 /v1/models，并补充上下文长度
            async with httpx.AsyncClient(timeout=15.0) as hc:
                resp = await hc.get(f"{client.base_url}/v1/models", params={"type": type} if type else None)
                if resp.status_code != 200:
                    raise HTTPException(status_code=resp.status_code, detail=resp.text)
                items = resp.json() or []
                out: List[Dict[str, Any]] = []
                for m in items:
                    mid = (m.get("model_id") or "").strip()
                    dname = (m.get("display_name") or mid).strip()
                    if not mid or mid.lower() == 'string' or dname.lower() == 'string':
                        continue
                    out.append({
                        "id": m.get("id", 0),
                        "model_id": mid,
                        "display_name": dname,
                        "model_type": m.get("model_type"),
                        "provider_name": "",
                        "provider_type": "",
                        "base_url": "",
                        "context_length": m.get("context_length") or 0,
                    })
                return out
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
