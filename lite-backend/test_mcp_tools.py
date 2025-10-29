"""
测试MCP工具获取
"""
import asyncio
import sys
from pathlib import Path

# 添加项目路径
project_root = Path(__file__).parent
sys.path.insert(0, str(project_root))


async def test_mcp_tools():
    from service.tools_registry import GatewayClient

    client = GatewayClient()

    print("=" * 60)
    print("测试MCP工具获取")
    print("=" * 60)

    # 1. 获取MCP注册表
    print("\n1. 获取MCP注册表:")
    try:
        registry = await client.list_mcp_registry()
        print(f"找到 {len(registry)} 个MCP服务器:")
        for server in registry:
            print(f"  - {server.get('name')} (状态: {server.get('status')})")
    except Exception as e:
        print(f"❌ 获取注册表失败: {e}")
        return

    # 2. 获取每个服务器的工具列表
    print("\n2. 获取每个服务器的工具列表:")
    for server in registry:
        server_name = server.get('name')
        if not server_name:
            continue

        print(f"\n   服务器: {server_name}")
        try:
            tools = await client.list_mcp_tools(server_name)
            print(f"   工具数量: {len(tools)}")
            for tool in tools:
                tool_name = tool.get('name') or tool.get('id')
                desc = tool.get('description', '无描述')
                print(f"     - {tool_name}: {desc}")
        except Exception as e:
            print(f"   ❌ 获取失败: {e}")

    # 3. 测试从hook tool executor获取
    print("\n3. 测试HookToolExecutor:")
    try:
        from service.hooks.tool_executor import get_hook_tool_executor

        executor = get_hook_tool_executor()
        await executor.initialize()

        mcp_tools = await executor.list_mcp_tools()
        print(f"   MCP工具列表 ({len(mcp_tools)}):")
        for tool_id in mcp_tools:
            print(f"     - {tool_id}")

        api_tools = await executor.list_api_tools()
        print(f"\n   API工具列表 ({len(api_tools)}):")
        for tool_id in api_tools:
            print(f"     - {tool_id}")
    except Exception as e:
        print(f"   ❌ 测试失败: {e}")
        import traceback
        traceback.print_exc()


if __name__ == '__main__':
    asyncio.run(test_mcp_tools())
