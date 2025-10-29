"""
Hook系统通用测试示例
展示如何配置和测试自定义Hook
"""
import asyncio
import json
from typing import Dict, Any

# 示例1: 简单的单工具Hook配置
EXAMPLE_SINGLE_TOOL_HOOK = {
    "hook_id": "example_single_tool",
    "hook_name": "示例单工具Hook",
    "hook_type": "pre",
    "description": "演示单个工具调用的Hook配置",
    "execution_mode": "sequential",
    "timeout_ms": 5000,
    "max_retries": 1,
    "tool_bindings": [
        {
            "step_id": "step_1",
            "tool_id": "example_api_tool",
            "tool_type": "api",
            "params": {
                "action": "validate",
                "mode": "strict"
            },
            "condition": None,
            "on_success": "continue",
            "on_failure": "stop"
        }
    ]
}

# 示例2: 多工具顺序执行Hook配置
EXAMPLE_SEQUENTIAL_HOOK = {
    "hook_id": "example_sequential",
    "hook_name": "示例顺序执行Hook",
    "hook_type": "pre",
    "description": "演示多个工具按顺序执行的Hook配置",
    "execution_mode": "sequential",
    "timeout_ms": 10000,
    "max_retries": 2,
    "tool_bindings": [
        {
            "step_id": "validate_input",
            "tool_id": "input_validator",
            "tool_type": "api",
            "params": {
                "rules": ["required", "length_min_5"]
            },
            "condition": None,
            "on_success": "continue",
            "on_failure": "abort"
        },
        {
            "step_id": "enrich_data",
            "tool_id": "data_enricher",
            "tool_type": "api",
            "params": {
                "source": "database",
                "cache": True
            },
            "condition": {
                "field": "validate_input.status",
                "operator": "eq",
                "value": "success"
            },
            "on_success": "continue",
            "on_failure": "continue"
        },
        {
            "step_id": "log_request",
            "tool_id": "logger_tool",
            "tool_type": "api",
            "params": {
                "level": "info",
                "category": "hook_execution"
            },
            "condition": None,
            "on_success": "continue",
            "on_failure": "continue"
        }
    ]
}

# 示例3: 多工具并行执行Hook配置
EXAMPLE_PARALLEL_HOOK = {
    "hook_id": "example_parallel",
    "hook_name": "示例并行执行Hook",
    "hook_type": "post",
    "description": "演示多个工具并行执行的Hook配置",
    "execution_mode": "parallel",
    "timeout_ms": 15000,
    "max_retries": 0,
    "tool_bindings": [
        {
            "step_id": "generate_summary",
            "tool_id": "summarizer",
            "tool_type": "api",
            "params": {
                "max_length": 200,
                "language": "zh"
            },
            "condition": None,
            "on_success": "continue",
            "on_failure": "continue"
        },
        {
            "step_id": "extract_keywords",
            "tool_id": "keyword_extractor",
            "tool_type": "api",
            "params": {
                "top_n": 10,
                "algorithm": "tfidf"
            },
            "condition": None,
            "on_success": "continue",
            "on_failure": "continue"
        },
        {
            "step_id": "analyze_sentiment",
            "tool_id": "sentiment_analyzer",
            "tool_type": "api",
            "params": {
                "model": "default"
            },
            "condition": None,
            "on_success": "continue",
            "on_failure": "continue"
        }
    ]
}

# 示例4: 带条件判断的Hook配置
EXAMPLE_CONDITIONAL_HOOK = {
    "hook_id": "example_conditional",
    "hook_name": "示例条件判断Hook",
    "hook_type": "pre",
    "description": "演示带条件判断的Hook配置",
    "execution_mode": "sequential",
    "timeout_ms": 8000,
    "max_retries": 1,
    "tool_bindings": [
        {
            "step_id": "detect_language",
            "tool_id": "language_detector",
            "tool_type": "api",
            "params": {},
            "condition": None,
            "on_success": "continue",
            "on_failure": "stop"
        },
        {
            "step_id": "translate_to_english",
            "tool_id": "translator",
            "tool_type": "api",
            "params": {
                "target_lang": "en"
            },
            "condition": {
                "field": "detect_language.language",
                "operator": "ne",
                "value": "en"
            },
            "on_success": "continue",
            "on_failure": "continue"
        },
        {
            "step_id": "translate_to_chinese",
            "tool_id": "translator",
            "tool_type": "api",
            "params": {
                "target_lang": "zh"
            },
            "condition": {
                "field": "detect_language.language",
                "operator": "eq",
                "value": "en"
            },
            "on_success": "continue",
            "on_failure": "continue"
        }
    ]
}

# 示例5: 使用MCP工具的Hook配置
EXAMPLE_MCP_TOOL_HOOK = {
    "hook_id": "example_mcp_tool",
    "hook_name": "示例MCP工具Hook",
    "hook_type": "pre",
    "description": "演示使用MCP工具的Hook配置",
    "execution_mode": "sequential",
    "timeout_ms": 30000,
    "max_retries": 1,
    "tool_bindings": [
        {
            "step_id": "navigate_page",
            "tool_id": "playwright__navigate",
            "tool_type": "mcp",
            "params": {
                "url": "https://example.com"
            },
            "condition": None,
            "on_success": "continue",
            "on_failure": "stop"
        },
        {
            "step_id": "take_screenshot",
            "tool_id": "playwright__screenshot",
            "tool_type": "mcp",
            "params": {
                "fullPage": True
            },
            "condition": {
                "field": "navigate_page.status",
                "operator": "eq",
                "value": "success"
            },
            "on_success": "continue",
            "on_failure": "continue"
        }
    ]
}


def print_example_config(name: str, config: Dict[str, Any]):
    """打印示例配置"""
    print(f"\n{'=' * 80}")
    print(f"示例: {name}")
    print('=' * 80)
    print(json.dumps(config, indent=2, ensure_ascii=False))
    print()


def print_all_examples():
    """打印所有示例配置"""
    print("\n" + "=" * 80)
    print("Hook系统配置示例")
    print("=" * 80)
    print("\n这些示例展示了如何配置不同类型的Hook：")
    print("1. 单工具Hook")
    print("2. 顺序执行多工具Hook")
    print("3. 并行执行多工具Hook")
    print("4. 带条件判断的Hook")
    print("5. 使用MCP工具的Hook")

    print_example_config("单工具Hook", EXAMPLE_SINGLE_TOOL_HOOK)
    print_example_config("顺序执行Hook", EXAMPLE_SEQUENTIAL_HOOK)
    print_example_config("并行执行Hook", EXAMPLE_PARALLEL_HOOK)
    print_example_config("条件判断Hook", EXAMPLE_CONDITIONAL_HOOK)
    print_example_config("MCP工具Hook", EXAMPLE_MCP_TOOL_HOOK)

    print("\n" + "=" * 80)
    print("使用说明")
    print("=" * 80)
    print("""
1. 创建Hook:
   POST /api/v1/custom-hooks
   Body: 使用上述任一示例配置

2. 测试Hook:
   python test_hook_e2e_execution.py

3. 查看Hook列表:
   GET /api/v1/custom-hooks

4. 更新Hook:
   PUT /api/v1/custom-hooks/{hook_id}

5. 删除Hook:
   DELETE /api/v1/custom-hooks/{hook_id}
    """)


async def test_hook_context_flow():
    """测试上下文传递流程"""
    print("\n" + "=" * 80)
    print("上下文传递流程示例")
    print("=" * 80)

    # 初始上下文
    context = {
        'user_id': 'test_user_123',
        'request_id': 'req_456',
        'language': 'zh',
        'action': 'query_data'
    }

    print("\n初始上下文:")
    print(json.dumps(context, indent=2, ensure_ascii=False))

    # 模拟步骤1执行后
    context['validate_input'] = {
        'status': 'success',
        'validated_fields': ['user_id', 'action'],
        'timestamp': '2025-01-22T10:00:00Z'
    }

    print("\n步骤1 (validate_input) 执行后:")
    print(json.dumps(context, indent=2, ensure_ascii=False))

    # 模拟步骤2执行后
    context['enrich_data'] = {
        'status': 'success',
        'user_profile': {
            'name': 'Test User',
            'permissions': ['read', 'write']
        }
    }

    print("\n步骤2 (enrich_data) 执行后:")
    print(json.dumps(context, indent=2, ensure_ascii=False))

    # 模拟步骤3执行后
    context['log_request'] = {
        'status': 'success',
        'log_id': 'log_789'
    }

    print("\n步骤3 (log_request) 执行后:")
    print(json.dumps(context, indent=2, ensure_ascii=False))

    print("\n" + "-" * 80)
    print("说明:")
    print("- 每个步骤的结果都保存在 context[step_id] 中")
    print("- 后续步骤可以通过 condition 访问前面步骤的结果")
    print("- 最终context包含所有步骤的执行结果")


def main():
    """主函数"""
    import sys

    if len(sys.argv) > 1:
        command = sys.argv[1]
        if command == 'examples':
            print_all_examples()
        elif command == 'context':
            asyncio.run(test_hook_context_flow())
        else:
            print(f"未知命令: {command}")
            print("可用命令: examples, context")
    else:
        print_all_examples()


if __name__ == '__main__':
    main()
