#!/usr/bin/env python
"""调试工具调用 - 打印所有响应"""

import requests
import json

API_URL = "http://localhost:8000/api/v1/workflows/run"

payload = {
    "agent_name": "qa_agent",
    "prompt": "搜索一下2025年最新的AI新闻",
    "selected_tools": ["baidu_search"],
    "stream": True
}

print("发送请求...")
print(json.dumps(payload, indent=2, ensure_ascii=False))
print("\n" + "="*80)

response = requests.post(API_URL, json=payload, stream=True, timeout=60)

print(f"HTTP状态码: {response.status_code}")
print(f"响应头: {dict(response.headers)}")
print("\n流式数据:\n")

line_count = 0
for line in response.iter_lines():
    if line:
        line_count += 1
        line_str = line.decode('utf-8')
        print(f"[{line_count}] {line_str}")

print(f"\n共接收 {line_count} 行数据")