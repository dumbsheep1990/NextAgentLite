import os
from typing import List, Tuple, Dict, Any
import httpx


class RerankerVendor:
    async def rerank(self, model: str, query: str, documents: List[str]) -> List[Tuple[int, float]]:
        raise NotImplementedError


class GatewayRerankVendor(RerankerVendor):
    """Call LLM gateway's OpenAI-like rerank endpoint.

    Request body (SiliconFlow compatible):
    {
      "model": "BAAI/bge-reranker-v2-m3",
      "query": "Apple",
      "documents": ["apple", "banana", ...]
    }

    Response (SiliconFlow compatible):
    {
      "id": "...",
      "results": [
        { "document": {"text": "..."}, "index": 0, "relevance_score": 0.82 },
        ...
      ],
      "tokens": {"input_tokens": 0, "output_tokens": 0}
    }
    """

    def __init__(self, base_url: str | None = None):
        self.base_url = (base_url or os.getenv('LLM_GATEWAY_URL', 'http://127.0.0.1:9050')).rstrip('/')

    async def rerank(self, model: str, query: str, documents: List[str]) -> List[Tuple[int, float]]:
        if not documents:
            return []
        payload = {"model": model, "query": query, "documents": documents}
        url = f"{self.base_url}/v1/rerank"
        async with httpx.AsyncClient(timeout=20.0) as hc:
            resp = await hc.post(url, json=payload)
            if resp.status_code != 200:
                raise RuntimeError(f"rerank failed: {resp.status_code} {resp.text}")
            data = resp.json() or {}
            out: List[Tuple[int, float]] = []
            for item in data.get("results", []):
                try:
                    idx = int(item.get("index"))
                    score = float(item.get("relevance_score"))
                    out.append((idx, score))
                except Exception:
                    continue
            # Sort by score desc if not guaranteed
            out.sort(key=lambda x: x[1], reverse=True)
            return out


def get_rerank_vendor(provider: str | None = None) -> RerankerVendor:
    # 当前统一通过 Gateway 调用；后续可根据 provider 返回不同实现
    return GatewayRerankVendor()

