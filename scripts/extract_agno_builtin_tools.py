#!/usr/bin/env python3
"""
Extract (heuristic) builtin tools from downloaded Agno docs and write to docs/agno-tools/builtin-tools.json.

Notes:
- Agno 官方文档没有提供固定的“内置工具清单”接口，文档页多为概念与示例。
- 本脚本以“保守合并”为原则：
  1) 载入现有 builtin-tools.json 作为基线；
  2) 在已抓取的 HTML 中检索已知关键字，若命中则补充条目；
  3) 去重（以 tool_code 为键）。

当前仅确保 Reasoning 与 DuckDuckGo 两项存在；若需要扩展，请在 builtin-tools.json 内直接维护更完整的清单。
"""
import json
import os
import re
from pathlib import Path

ROOTS = [
    Path('docs/agno-tools'),
    Path('../docs/agno-tools'),
]

DEFAULTS = [
    {
        "tool_code": "builtin:reasoning",
        "tool_name": "推理(思考)",
        "tool_type": "builtin",
        "description": "显式思考与分解步骤，帮助模型逐步规划与总结。",
        "config_schema": {}
    },
    {
        "tool_code": "builtin:duckduckgo",
        "tool_name": "DuckDuckGo 搜索",
        "tool_type": "builtin",
        "description": "使用 DuckDuckGo 进行基础网页搜索。",
        "config_schema": {
            "type": "object",
            "properties": {
                "region": {"type": "string", "description": "区域(如 'cn-zh')"}
            },
            "additionalProperties": True
        }
    }
]

def load_existing_json() -> tuple[Path, list]:
    for root in ROOTS:
        p = root / 'builtin-tools.json'
        if p.exists():
            try:
                return p, json.loads(p.read_text('utf-8') or '[]')
            except Exception:
                return p, []
    # fallback to first root
    ROOTS[0].mkdir(parents=True, exist_ok=True)
    return ROOTS[0]/'builtin-tools.json', []

def scan_docs() -> list[dict]:
    found = []
    # 粗略从 HTML 里查找关键词，以后可按需要扩展解析规则
    keywords = {
        'builtin:reasoning': [r'ReasoningTools?', r'think\('],
        'builtin:duckduckgo': [r'DuckDuckGo', r'duckduckgo']
    }
    def ensure(code: str, name: str, desc: str, schema=None):
        found.append({
            "tool_code": code,
            "tool_name": name,
            "tool_type": "builtin",
            "description": desc,
            "config_schema": schema or {}
        })

    html_files = []
    for root in ROOTS:
        if root.exists():
            html_files.extend(list(root.glob('*.html')))

    content = ''
    for f in html_files:
        try:
            content += f.read_text('utf-8', errors='ignore') + '\n'
        except Exception:
            pass

    # 检出
    text = content
    if any(re.search(pat, text, re.I) for pat in keywords['builtin:reasoning']):
        ensure('builtin:reasoning', '推理(思考)', '显式思考与分解步骤，帮助模型逐步规划与总结。')
    if any(re.search(pat, text, re.I) for pat in keywords['builtin:duckduckgo']):
        ensure('builtin:duckduckgo', 'DuckDuckGo 搜索', '使用 DuckDuckGo 进行基础网页搜索。', {
            "type": "object",
            "properties": {"region": {"type": "string", "description": "区域(如 'cn-zh')"}},
            "additionalProperties": True
        })

    return found

def merge_unique(base: list, extra: list) -> list:
    out = { (x.get('tool_code') or '').strip(): x for x in base if x.get('tool_code') }
    for e in extra:
        code = (e.get('tool_code') or '').strip()
        if not code:
            continue
        if code not in out:
            out[code] = e
    # 确保默认项
    for d in DEFAULTS:
        code = d['tool_code']
        if code not in out:
            out[code] = d
    return list(out.values())

def main():
    path, existing = load_existing_json()
    scanned = scan_docs()
    merged = merge_unique(existing, scanned)
    path.write_text(json.dumps(merged, ensure_ascii=False, indent=2), 'utf-8')
    print(f"✅ 写入: {path} (共 {len(merged)} 项)")

if __name__ == '__main__':
    main()

