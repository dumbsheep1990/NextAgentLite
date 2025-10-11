#!/usr/bin/env python
"""测试工具调用修复 - 使用stream=True"""

import requests
import json

# 测试参数
API_URL = "http://localhost:8000/api/v1/workflows/run"
TEST_AGENT = "qa_agent"  # 使用内置智能体
TEST_QUESTION = "搜索一下2025年最新的AI新闻"

# 请求payload
payload = {
    "agent_name": TEST_AGENT,
    "prompt": TEST_QUESTION,
    "selected_tools": ["baidu_search"],
    "stream": True
}

print(f"正在测试工具调用...")
print(f"API: {API_URL}")
print(f"Agent: {TEST_AGENT}")
print(f"Question: {TEST_QUESTION}")
print(f"Tools: {payload['selected_tools']}")
print("\n" + "="*80)

try:
    response = requests.post(API_URL, json=payload, stream=True, timeout=60)

    if response.status_code != 200:
        print(f"错误: HTTP {response.status_code}")
        print(response.text)
        exit(1)

    print("收到响应，正在处理流式数据...\n")

    tool_calls = []
    content_chunks = []

    for line in response.iter_lines():
        if line:
            line_str = line.decode('utf-8')
            if line_str.startswith('data: '):
                data_str = line_str[6:]  # Remove 'data: ' prefix
                try:
                    data = json.loads(data_str)

                    # 检查状态
                    if 'status' in data:
                        status = data['status']
                        if status == 'tool_calling':
                            print(f"\n[工具调用] {data.get('delta', '')}")
                            tool_calls.append(data.get('delta', ''))
                        elif status == 'thinking':
                            print("[思考中...]")
                        elif status == 'answering' and 'delta' in data:
                            delta = data['delta']
                            print(delta, end='', flush=True)
                            content_chunks.append(delta)

                    # 检查结果
                    if 'result' in data:
                        print("\n\n" + "="*80)
                        print("最终结果:")
                        print(data['result'][:500])
                        if len(data['result']) > 500:
                            print(f"... (还有 {len(data['result'])-500} 个字符)")

                    # 检查错误
                    if 'error' in data:
                        print(f"\n错误: {data['error']}")

                    if 'warning' in data:
                        print(f"\n警告: {data['warning']}")

                except json.JSONDecodeError:
                    print(f"无法解析JSON: {data_str[:100]}")

    print("\n\n" + "="*80)
    print(f"测试完成!")
    print(f"工具调用次数: {len(tool_calls)}")
    if tool_calls:
        print("工具调用详情:")
        for i, call in enumerate(tool_calls, 1):
            print(f"  {i}. {call}")
    else:
        print("❌ 没有检测到工具调用!")

    print(f"生成内容长度: {len(''.join(content_chunks))} 字符")

except requests.exceptions.Timeout:
    print("请求超时!")
except requests.exceptions.ConnectionError:
    print("连接错误! 请确保后端服务正在运行。")
except Exception as e:
    print(f"发生错误: {e}")
    import traceback
    traceback.print_exc()