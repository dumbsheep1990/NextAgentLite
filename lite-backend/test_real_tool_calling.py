"""
真实工具调用测试
验证Hook工具执行器与实际API/MCP工具的集成
"""

import asyncio
import sys
import os
from typing import Dict, Any

sys.path.insert(0, os.path.join(os.path.dirname(__file__)))

from service.hooks.tool_executor import HookToolExecutor, get_hook_tool_executor
from service.hooks.base import PreHook, PostHook, RunInput, RunOutput
from service.tools_registry import GatewayClient
from core.logger import logger


async def test_gateway_api_tool():
    """测试Gateway中的API工具调用"""
    print("\n" + "="*80)
    print("【实际API工具调用测试】")
    print("="*80)

    gateway = GatewayClient()

    # 1. 列出API配置
    print("\n1️⃣ 列出API配置:")
    configs = await gateway.list_api_configs()
    for cfg in configs:
        print(f"   - {cfg.get('name')}: {cfg.get('description', 'N/A')}")

    # 2. 列出API工具
    print("\n2️⃣ 列出API工具:")
    if configs:
        config_name = configs[0].get('name')
        tools = await gateway.list_api_tools(config_name)
        print(f"   配置 '{config_name}' 中的工具:")
        for tool in tools:
            print(f"     - {tool.get('name')}")
            print(f"       描述: {tool.get('description', 'N/A')}")
            if 'input_schema' in tool:
                print(f"       参数: {tool.get('input_schema', {})}")

        # 3. 调用API工具
        if tools:
            tool_name = tools[0].get('name')
            print(f"\n3️⃣ 调用API工具: {config_name}:{tool_name}")

            try:
                # 构建参数
                test_args = {
                    "text": "这是一个测试文本",
                    "options": {}
                }

                result = await gateway.call_api_tool(config_name, tool_name, test_args)
                print(f"   ✅ 调用成功!")
                print(f"   返回值: {result}")
            except Exception as e:
                print(f"   ⚠️  调用失败: {e}")


async def test_hook_tool_executor():
    """测试HookToolExecutor"""
    print("\n" + "="*80)
    print("【HookToolExecutor工具调用测试】")
    print("="*80)

    executor = HookToolExecutor()
    await executor.initialize()

    # 1. 列出所有API工具
    print("\n1️⃣ 使用执行器列出API工具:")
    api_tools = await executor.list_api_tools()
    for tool_id in api_tools:
        print(f"   - {tool_id}")

    # 2. 调用API工具
    if api_tools:
        tool_id = api_tools[0]
        print(f"\n2️⃣ 使用执行器调用工具: {tool_id}")

        result = await executor.call_tool(
            tool_id,
            text="Hook系统测试文本",
            options={"normalize": True}
        )

        print(f"   成功: {result.success}")
        print(f"   结果: {result.result}")
        if result.error:
            print(f"   错误: {result.error}")
        print(f"   元数据: {result.metadata}")


async def test_hook_with_tool_calling():
    """测试Hook内部的工具调用"""
    print("\n" + "="*80)
    print("【Hook内部工具调用测试】")
    print("="*80)

    # 创建一个简单的PreHook来演示工具调用
    class DemoPreHook(PreHook):
        """演示PreHook - 调用API工具处理输入"""

        async def execute(self, run_input: RunInput, session, user_id, **kwargs):
            print(f"\n  PreHook执行中...")
            print(f"  原始输入: {run_input.input_content[:50]}...")

            # 获取可用工具
            from service.tools_registry import ToolRegistry
            registry = ToolRegistry()
            await registry.refresh()

            api_tools = await self.call_tool(
                tool_id="api:apitest:api-test",
                text=run_input.input_content,
                options={"normalize": True}
            )

            print(f"  工具调用结果: {type(api_tools)}")

    # 创建一个PostHook来演示脱敏
    class DemoPostHook(PostHook):
        """演示PostHook - 对输出进行脱敏"""

        async def execute(self, run_output: RunOutput, **kwargs):
            print(f"\n  PostHook执行中...")
            print(f"  原始输出: {run_output.content[:50]}...")

            # 这里可以调用脱敏工具
            # result = await self.call_api_tool('pii_masking', content=run_output.content)

    # 创建输入和输出
    run_input = RunInput(input_content="这是一个测试输入，包含邮箱test@example.com和电话13800000000")
    run_output = RunOutput(content="这是一个测试输出，包含邮箱admin@company.com和身份证号110101199003079910")

    # 执行PreHook
    pre_hook = DemoPreHook({})
    await pre_hook.execute(run_input, None, "user1")

    # 执行PostHook
    post_hook = DemoPostHook({})
    await post_hook.execute(run_output)

    print(f"\n✅ Hook工具调用演示完成")


async def test_tool_calling_errors():
    """测试工具调用错误处理"""
    print("\n" + "="*80)
    print("【工具调用错误处理测试】")
    print("="*80)

    executor = HookToolExecutor()
    await executor.initialize()

    # 1. 工具不存在
    print("\n1️⃣ 测试不存在的工具:")
    result = await executor.call_tool("nonexistent_tool")
    print(f"   成功: {result.success}")
    print(f"   错误: {result.error}")

    # 2. 无效的工具ID格式
    print("\n2️⃣ 测试无效的工具ID格式:")
    result = await executor.call_tool("invalid:tool:id:format")
    print(f"   成功: {result.success}")
    print(f"   错误: {result.error}")

    # 3. 错误的工具类型
    print("\n3️⃣ 测试错误的工具类型:")
    result = await executor.call_tool("api:config:tool", tool_type="invalid")
    print(f"   成功: {result.success}")
    print(f"   错误: {result.error}")

    print("\n✅ 错误处理测试完成")


async def main():
    """主函数"""
    try:
        # 测试1: Gateway API工具
        await test_gateway_api_tool()

        # 测试2: HookToolExecutor
        await test_hook_tool_executor()

        # 测试3: Hook内部工具调用
        await test_hook_with_tool_calling()

        # 测试4: 错误处理
        await test_tool_calling_errors()

        print("\n" + "="*80)
        print("✅ 所有真实工具调用测试完成！")
        print("="*80)

    except Exception as e:
        print(f"\n❌ 测试出错: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    asyncio.run(main())
