#!/usr/bin/env python3
"""
快速测试指定集合的检索链路：
1) 初始化/校验 ES 索引（可选）
2) 回写该集合到 ES
3) 调用 /api/v1/retrieval/debug 验证命中情况

用法示例：
  python scripts/test_retrieval.py \
    --collection-id 530d2205-65c6-4459-9e09-4c07d908a5d7 \
    --query "NextAgent" --topk 8 --init-index

环境变量：
  BACKEND_BASE_URL  默认为 http://localhost:8000/api/v1
"""
import os
import sys
import json
import argparse
from typing import Any, Dict

try:
    import requests  # type: ignore
except Exception:  # pragma: no cover
    requests = None
    import urllib.request
    import urllib.error


def _post_json(url: str, data: Dict[str, Any], timeout: int = 30) -> Dict[str, Any]:
    if requests is not None:
        r = requests.post(url, json=data, timeout=timeout)
        r.raise_for_status()
        return r.json() if r.text else {}
    # fallback: urllib
    req = urllib.request.Request(url, data=json.dumps(data).encode("utf-8"), headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=timeout) as resp:  # type: ignore
        raw = resp.read().decode("utf-8")
        return json.loads(raw) if raw else {}


def pretty(obj: Any) -> str:
    try:
        return json.dumps(obj, ensure_ascii=False, indent=2)
    except Exception:
        return str(obj)


def main() -> int:
    p = argparse.ArgumentParser(description="Test retrieval pipeline for a collection")
    p.add_argument("--base", default=os.getenv("BACKEND_BASE_URL", "http://localhost:8000/api/v1"), help="Backend base URL (default: %(default)s)")
    p.add_argument("--collection-id", required=True, help="Knowledge collection ID")
    p.add_argument("--query", default="NextAgent", help="Query text")
    p.add_argument("--topk", type=int, default=8, help="Top K results")
    p.add_argument("--init-index", action="store_true", help="Initialize/ensure ES index before reindexing")
    p.add_argument("--force-init", action="store_true", help="Force recreate ES index when initializing (apply new mappings)")
    p.add_argument("--recreate-index", action="store_true", help="Force recreate ES index when reindexing")
    p.add_argument("--dims", type=int, default=1024, help="Embedding dims for index mapping (default: 1024)")
    args = p.parse_args()

    base = args.base.rstrip("/")
    cid = args.collection_id

    print(f"[1/3] Base URL: {base}")

    # 1) 初始化索引（可选）
    if args.init_index:
        url = f"{base}/knowledge/search/init-index"
        payload = {"force": bool(args.force_init), "dims": args.dims, "indexing": "none"}
        print(f"[2/3] Init index: POST {url} -> {payload}")
        try:
            res = _post_json(url, payload)
            print("      Response:")
            print(pretty(res))
        except Exception as e:
            print(f"      ERROR init-index: {e}")
            return 2

    # 2) 回写集合
    url = f"{base}/knowledge/search/reindex-collection"
    payload = {"collection_id": cid, "recreate_index": bool(args.recreate_index), "dims": args.dims}
    print(f"[2/3] Reindex collection: POST {url} -> {payload}")
    try:
        res = _post_json(url, payload)
        print("      Response:")
        print(pretty(res))
        if not res.get("success", True) or res.get("indexed", 0) == 0:
            print("      WARN: indexed=0, 后续检索可能仍然为空")
    except Exception as e:
        print(f"      ERROR reindex-collection: {e}")
        return 3

    # 3) 调试检索
    url = f"{base}/retrieval/debug"
    payload = {"query": args.query, "collectionId": cid, "topK": int(args.topk)}
    print(f"[3/3] Retrieval debug: POST {url} -> {payload}")
    try:
        res = _post_json(url, payload)
        print("      Response (key fields):")
        keys = [
            "vector_ready", "vector_len", "embedding_model",
            "es_took_ms", "es_total", "returned",
            "sample_titles", "sample_ids"
        ]
        summary = {k: res.get(k) for k in keys}
        print(pretty(summary))
        if (res.get("error") or 0) and not res.get("returned"):
            print("      ERROR in debug response:")
            print(pretty(res))
    except Exception as e:
        print(f"      ERROR retrieval-debug: {e}")
        return 4

    print("\nDone.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
