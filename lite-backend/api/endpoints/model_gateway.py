from typing import Any, Dict, List, Optional

from fastapi import APIRouter, HTTPException, Query

from service.llm_config_gateway_client import (
    get_llm_config_gateway_client,
)
import httpx


router = APIRouter(prefix="/models-gateway", tags=["统一模型网关"])


def _normalize_defaults(raw: Dict[str, Any]) -> Dict[str, Any]:
    """将 9050 返回的 defaults 规格化为 { chat:{model,provider}, embedding:{model,provider} }。
    兼容不同字段命名/结构：
      - raw.embedding: {model,provider} 或 {model_id,provider_name}
      - raw.default_embedding: "provider/model" 或 {model,provider}
      - 同理 chat 段
    """
    def parse_pair(val: Any) -> Dict[str, str]:
        if not val:
            return {"model": "", "provider": ""}
        if isinstance(val, dict):
            model = val.get("model") or val.get("model_id") or val.get("id") or ""
            provider = val.get("provider") or val.get("provider_name") or val.get("vendor") or ""
            return {"model": str(model), "provider": str(provider)}
        if isinstance(val, str):
            s = val.strip()
            if '/' in s:
                prov, mod = s.split('/', 1)
                return {"model": mod.strip(), "provider": prov.strip()}
            return {"model": s, "provider": ""}
        return {"model": "", "provider": ""}

    out = {"chat": {"model": "", "provider": ""}, "embedding": {"model": "", "provider": ""}}
    # chat 优先 raw.chat，否则 raw.default_model
    chat = raw.get("chat") or {}
    out["chat"] = parse_pair(chat)
    if not out["chat"]["model"]:
        out["chat"] = parse_pair(raw.get("default_model"))

    # embedding 优先 raw.embedding，否则 raw.default_embedding
    emb = raw.get("embedding") or {}
    out["embedding"] = parse_pair(emb)
    if not out["embedding"]["model"]:
        out["embedding"] = parse_pair(raw.get("default_embedding"))

    return out


@router.get("/defaults/simple")
async def get_defaults_simple() -> Dict[str, Any]:
    try:
        client = await get_llm_config_gateway_client()
        raw = await client.get_defaults_simple()
        return _normalize_defaults(raw or {})
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


@router.get("/models/enabled")
async def get_models_enabled() -> Dict[str, Any]:
    """直接转发 9050 /v1/models/enabled，统一由后端代理，前端不直连 9050。"""
    try:
        client = await get_llm_config_gateway_client()
        async with httpx.AsyncClient(timeout=15.0) as hc:
            resp = await hc.get(f"{client.base_url}/v1/models/enabled")
            if resp.status_code != 200:
                raise HTTPException(status_code=resp.status_code, detail=resp.text)
            return resp.json() or { "providers": [] }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/models")
async def list_models(
    type: Optional[str] = Query(None, regex="^(chat|embedding|rerank)$"),
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
                        # 支持 chat / embedding / rerank 三类
                        if type and (m.get("model_type") != type):
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
                            "context_length": m.get("context_length") or 0,
                            # 透传默认标识，便于前端直接判断默认
                            "default_chat": bool(m.get("default_chat") or False),
                            "default_embedding": bool(m.get("default_embedding") or False),
                            "default_rerank": bool(m.get("default_rerank") or False),
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
