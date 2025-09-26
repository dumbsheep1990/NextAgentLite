#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
简单的 Embeddings 联调脚本
- 默认通过 9050 网关（OpenAI 兼容）测试 /v1/embeddings
- 可选直连硅基流动，用于对比排查（需提供 API Key）

用法示例：
  # 1) 仅测 9050，自动读取默认 embedding 模型
  python scripts/test_embeddings.py --input "hello from test"

  # 2) 指定 9050 模型
  python scripts/test_embeddings.py --model BAAI/bge-large-zh-v1.5 --input "一键联调"

  # 3) 直连硅基流动（需设置环境变量 SILICONFLOW_API_KEY 或使用 --sf-key）
  python scripts/test_embeddings.py --direct --sf-model BAAI/bge-large-zh-v1.5 --input "直连测试"
"""

import argparse
import json
import os
import sys
from typing import Optional

import requests


def pretty(obj):
    try:
        return json.dumps(obj, ensure_ascii=False, indent=2)
    except Exception:
        return str(obj)


def fetch_default_embedding(base: str) -> Optional[str]:
    url = base.rstrip('/') + '/defaults/simple'
    try:
        r = requests.get(url, timeout=15)
        print(f"[9050] GET {url} => {r.status_code}")
        if r.status_code != 200:
            print(r.text)
            return None
        data = r.json()
        emb = (data or {}).get('embedding', {})
        model = emb.get('model')
        print(f"[9050] defaults.simple.embedding.model = {model}")
        return model
    except Exception as e:
        print(f"[ERR] 读取默认模型失败: {e}")
        return None


def test_9050(base: str, model: str, text: str):
    url = base.rstrip('/') + '/embeddings'
    payload = {"model": model, "input": text}
    print(f"\n[9050] POST {url}\nPayload: {pretty(payload)}")
    try:
        r = requests.post(url, json=payload, timeout=30)
        print(f"[9050] Status: {r.status_code}")
        try:
            print(pretty(r.json()))
        except Exception:
            print(r.text)
    except Exception as e:
        print(f"[ERR] 9050 请求异常: {e}")


def test_siliconflow(sf_model: str, text: str, api_key: Optional[str]):
    if not api_key:
        print("[SF] 缺少 API Key。请设置环境变量 SILICONFLOW_API_KEY 或使用 --sf-key 传入。")
        return
    url = 'https://api.siliconflow.cn/v1/embeddings'
    headers = {
        'Authorization': f'Bearer {api_key}',
        'Content-Type': 'application/json',
    }
    payload = {"model": sf_model, "input": text}
    print(f"\n[SF] POST {url}\nPayload: {pretty(payload)}")
    try:
        r = requests.post(url, headers=headers, json=payload, timeout=30)
        print(f"[SF] Status: {r.status_code}")
        try:
            print(pretty(r.json()))
        except Exception:
            print(r.text)
    except Exception as e:
        print(f"[ERR] SiliconFlow 请求异常: {e}")


def main():
    parser = argparse.ArgumentParser(description="Embeddings 联调脚本")
    parser.add_argument('--base', default=os.getenv('LLM_GATEWAY_URL', 'http://127.0.0.1:9050') + '/v1',
                        help='9050 网关 base（默认取环境 LLM_GATEWAY_URL/v1 或 http://127.0.0.1:9050/v1）')
    parser.add_argument('--model', default=None, help='9050 测试的 embedding 模型（默认自动读取）')
    parser.add_argument('--input', required=True, help='要嵌入的测试文本')
    parser.add_argument('--direct', action='store_true', help='是否直连硅基流动测试')
    parser.add_argument('--sf-model', default='BAAI/bge-large-zh-v1.5', help='硅基流动直连的模型ID')
    parser.add_argument('--sf-key', default=os.getenv('SILICONFLOW_API_KEY'), help='硅基流动 API Key（也可用环境变量）')

    args = parser.parse_args()

    # 1) 9050 测试
    model = args.model or fetch_default_embedding(args.base)
    if not model:
        print("[9050] 未获取到默认 embedding 模型，请先在 9050 设置默认 embedding。")
    else:
        test_9050(args.base, model, args.input)

    # 2) 直连硅基流动（可选）
    if args.direct:
        test_siliconflow(args.sf_model, args.input, args.sf_key)


if __name__ == '__main__':
    sys.exit(main())

