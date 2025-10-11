"""
工具集成测试脚本
测试内置、MCP和API三种类型的工具
"""
import asyncio
import sys
import os

# 添加项目路径
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from core.logger import logger
from service.agent_service_v2 import get_agent_service_v2


async def test_builtin_tools():
    """测试内置工具 - 百度搜索"""
    print("\n" + "="*60)
    print("测试 1: 内置工具 - 百度搜索")
    print("="*60)

    try:
        service = await get_agent_service_v2()

        # 创建带百度搜索工具的Agent
        agent = await service.create_agent_v2(
            agent_name="test_builtin_agent",
            selected_tools=["builtin:baidusearch"],
            model_name="Qwen/Qwen2.5-7B-Instruct",
            model_provider="siliconflow",
            search_knowledge=False,
            search_graph=False,
        )

        if agent is None:
            print("❌ Agent创建失败")
            return False

        print(f"✅ Agent创建成功: {agent.name}")
        print(f"   工具数量: {len(agent.tools) if hasattr(agent, 'tools') else 0}")

        # 检查工具列表
        if hasattr(agent, 'tools') and agent.tools:
            for tool in agent.tools:
                tool_name = getattr(tool, 'name', getattr(tool, '__name__', str(tool)))
                print(f"   - {tool_name}")

        # 测试搜索功能
        print("\n测试搜索: '2025年人工智能发展趋势'")
        try:
            response = agent.run("请使用百度搜索查询: 2025年人工智能发展趋势，返回前3条结果")
            print(f"\n搜索结果:")
            print("-" * 60)
            print(response.content if hasattr(response, 'content') else str(response))
            print("-" * 60)
            print("✅ 百度搜索工具测试通过")
            return True
        except Exception as e:
            print(f"❌ 搜索测试失败: {e}")
            import traceback
            traceback.print_exc()
            return False

    except Exception as e:
        print(f"❌ 内置工具测试失败: {e}")
        import traceback
        traceback.print_exc()
        return False


async def test_mcp_tools():
    """测试MCP工具"""
    print("\n" + "="*60)
    print("测试 2: MCP工具")
    print("="*60)

    try:
        # 首先检查MCP服务器状态
        import httpx
        gw_base = os.getenv('LLM_GATEWAY_URL', 'http://127.0.0.1:9050')

        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(f"{gw_base}/mcp/registry")
            if resp.status_code != 200:
                print(f"⚠️  MCP服务不可用，跳过测试")
                return None

            mcp_servers = resp.json() or []
            if not mcp_servers:
                print("⚠️  没有注册的MCP服务器，跳过测试")
                return None

            print(f"发现 {len(mcp_servers)} 个MCP服务器:")
            for srv in mcp_servers:
                name = srv.get('name', '')
                status = srv.get('status', '')
                print(f"   - {name} ({status})")

            # 选择第一个服务器进行测试
            first_server = mcp_servers[0].get('name')
            print(f"\n使用服务器: {first_server}")

            # 获取该服务器的工具
            tools_resp = await client.get(f"{gw_base}/mcp/servers/{first_server}/tools")
            if tools_resp.status_code != 200:
                print(f"❌ 获取工具列表失败")
                return False

            tools = tools_resp.json() or []
            if not tools:
                print(f"⚠️  服务器 {first_server} 没有工具")
                return None

            print(f"发现 {len(tools)} 个工具:")
            for t in tools[:5]:  # 只显示前5个
                print(f"   - {t.get('name', '')}: {t.get('description', '')[:50]}")

        # 创建带MCP工具的Agent
        service = await get_agent_service_v2()
        tool_code = f"mcp:{first_server}"

        agent = await service.create_agent_v2(
            agent_name="test_mcp_agent",
            selected_tools=[tool_code],
            model_name="Qwen/Qwen2.5-7B-Instruct",
            model_provider="siliconflow",
            search_knowledge=False,
            search_graph=False,
        )

        if agent is None:
            print("❌ Agent创建失败")
            return False

        print(f"\n✅ Agent创建成功: {agent.name}")
        print(f"   工具数量: {len(agent.tools) if hasattr(agent, 'tools') else 0}")

        if hasattr(agent, 'tools') and agent.tools:
            for tool in agent.tools[:5]:
                tool_name = getattr(tool, 'name', getattr(tool, '__name__', str(tool)))
                print(f"   - {tool_name}")

        print("✅ MCP工具加载测试通过")
        return True

    except Exception as e:
        print(f"❌ MCP工具测试失败: {e}")
        import traceback
        traceback.print_exc()
        return False


async def test_api_tools():
    """测试API工具"""
    print("\n" + "="*60)
    print("测试 3: API工具")
    print("="*60)

    try:
        # 检查API工具配置
        import httpx
        gw_base = os.getenv('LLM_GATEWAY_URL', 'http://127.0.0.1:9050')

        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(f"{gw_base}/api-tools/configs")
            if resp.status_code != 200:
                print(f"⚠️  API工具服务不可用，跳过测试")
                return None

            api_configs = resp.json() or []
            if not api_configs:
                print("⚠️  没有配置的API工具，跳过测试")
                return None

            print(f"发现 {len(api_configs)} 个API配置:")
            for cfg in api_configs:
                name = cfg.get('name', '')
                desc = cfg.get('description', '')
                print(f"   - {name}: {desc}")

            # 选择第一个配置进行测试
            first_config = api_configs[0].get('name')
            print(f"\n使用配置: {first_config}")

            # 获取该配置的工具
            tools_resp = await client.get(f"{gw_base}/api-tools/configs/{first_config}/tools")
            if tools_resp.status_code != 200:
                print(f"❌ 获取工具列表失败")
                return False

            tools = tools_resp.json() or []
            if not tools:
                print(f"⚠️  配置 {first_config} 没有工具")
                return None

            print(f"发现 {len(tools)} 个工具:")
            for t in tools[:5]:
                print(f"   - {t.get('name', '')}: {t.get('description', '')[:50]}")

        # 创建带API工具的Agent
        service = await get_agent_service_v2()
        tool_code = f"api:{first_config}"

        agent = await service.create_agent_v2(
            agent_name="test_api_agent",
            selected_tools=[tool_code],
            model_name="Qwen/Qwen2.5-7B-Instruct",
            model_provider="siliconflow",
            search_knowledge=False,
            search_graph=False,
        )

        if agent is None:
            print("❌ Agent创建失败")
            return False

        print(f"\n✅ Agent创建成功: {agent.name}")
        print(f"   工具数量: {len(agent.tools) if hasattr(agent, 'tools') else 0}")

        if hasattr(agent, 'tools') and agent.tools:
            for tool in agent.tools[:5]:
                tool_name = getattr(tool, 'name', getattr(tool, '__name__', str(tool)))
                print(f"   - {tool_name}")

        print("✅ API工具加载测试通过")
        return True

    except Exception as e:
        print(f"❌ API工具测试失败: {e}")
        import traceback
        traceback.print_exc()
        return False


async def test_mixed_tools():
    """测试混合工具（内置+MCP+API）"""
    print("\n" + "="*60)
    print("测试 4: 混合工具 (内置+MCP+API)")
    print("="*60)

    try:
        # 构建混合工具列表
        selected_tools = ["builtin:baidusearch", "builtin:duckduckgo"]

        # 尝试添加MCP工具
        import httpx
        gw_base = os.getenv('LLM_GATEWAY_URL', 'http://127.0.0.1:9050')

        async with httpx.AsyncClient(timeout=5.0) as client:
            try:
                resp = await client.get(f"{gw_base}/mcp/registry")
                if resp.status_code == 200:
                    mcp_servers = resp.json() or []
                    if mcp_servers:
                        first_server = mcp_servers[0].get('name')
                        selected_tools.append(f"mcp:{first_server}")
            except:
                pass

            try:
                resp = await client.get(f"{gw_base}/api-tools/configs")
                if resp.status_code == 200:
                    api_configs = resp.json() or []
                    if api_configs:
                        first_config = api_configs[0].get('name')
                        selected_tools.append(f"api:{first_config}")
            except:
                pass

        print(f"选择的工具: {selected_tools}")

        service = await get_agent_service_v2()
        agent = await service.create_agent_v2(
            agent_name="test_mixed_agent",
            selected_tools=selected_tools,
            model_name="Qwen/Qwen2.5-7B-Instruct",
            model_provider="siliconflow",
            search_knowledge=False,
            search_graph=False,
        )

        if agent is None:
            print("❌ Agent创建失败")
            return False

        print(f"\n✅ Agent创建成功: {agent.name}")
        print(f"   工具数量: {len(agent.tools) if hasattr(agent, 'tools') else 0}")

        if hasattr(agent, 'tools') and agent.tools:
            print("\n加载的工具:")
            for tool in agent.tools:
                tool_name = getattr(tool, 'name', getattr(tool, '__name__', str(tool)))
                print(f"   - {tool_name}")

        print("\n✅ 混合工具加载测试通过")
        return True

    except Exception as e:
        print(f"❌ 混合工具测试失败: {e}")
        import traceback
        traceback.print_exc()
        return False


async def main():
    """主测试函数"""
    print("\n" + "="*60)
    print("工具集成测试")
    print("="*60)

    results = {
        "内置工具": None,
        "MCP工具": None,
        "API工具": None,
        "混合工具": None,
    }

    # 测试1: 内置工具
    results["内置工具"] = await test_builtin_tools()

    # 测试2: MCP工具
    results["MCP工具"] = await test_mcp_tools()

    # 测试3: API工具
    results["API工具"] = await test_api_tools()

    # 测试4: 混合工具
    results["混合工具"] = await test_mixed_tools()

    # 汇总结果
    print("\n" + "="*60)
    print("测试结果汇总")
    print("="*60)

    for test_name, result in results.items():
        if result is True:
            status = "✅ 通过"
        elif result is False:
            status = "❌ 失败"
        else:
            status = "⚠️  跳过"
        print(f"{test_name}: {status}")

    # 统计
    passed = sum(1 for r in results.values() if r is True)
    failed = sum(1 for r in results.values() if r is False)
    skipped = sum(1 for r in results.values() if r is None)

    print(f"\n总计: {passed} 通过, {failed} 失败, {skipped} 跳过")

    return failed == 0


if __name__ == "__main__":
    try:
        success = asyncio.run(main())
        sys.exit(0 if success else 1)
    except KeyboardInterrupt:
        print("\n测试被中断")
        sys.exit(1)
    except Exception as e:
        print(f"\n测试执行失败: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)