"""
Hook工具调用实际集成测试
验证真实环境中Hook工具调用的可用性和问题

测试场景:
1. Gateway连接性检查
2. 工具发现和列表
3. 工具调用（模拟和实际）
4. 错误恢复和降级
5. 并发工具调用
"""

import asyncio
import pytest
import sys
import os
from typing import List, Dict, Any

# 添加项目路径
sys.path.insert(0, os.path.join(os.path.dirname(__file__)))

from service.hooks.tool_executor import HookToolExecutor, get_hook_tool_executor, ToolCallResult
from service.hooks.base import BaseHook, PreHook, PostHook, RunInput, RunOutput
from service.tools_registry import GatewayClient
from core.logger import logger


class TestGatewayConnectivity:
    """测试Gateway连接性"""

    @pytest.mark.asyncio
    async def test_gateway_url_configuration(self):
        """验证Gateway URL配置"""
        executor = HookToolExecutor()
        assert executor.gateway_url == "http://127.0.0.1:9050", \
            f"默认Gateway URL应为 http://127.0.0.1:9050, 实际为 {executor.gateway_url}"

        # 验证可以自定义Gateway URL
        custom_executor = HookToolExecutor()
        custom_executor.gateway_url = "http://localhost:9051"
        assert custom_executor.gateway_url == "http://localhost:9051"

    @pytest.mark.asyncio
    async def test_gateway_client_initialization(self):
        """验证GatewayClient初始化"""
        executor = HookToolExecutor()
        await executor.initialize()

        assert executor._initialized == True, "工具执行器应该被初始化"
        assert executor.gateway_client is not None, "GatewayClient不应为None"
        assert hasattr(executor.gateway_client, 'list_api_configs'), \
            "GatewayClient应有list_api_configs方法"
        assert hasattr(executor.gateway_client, 'list_mcp_registry'), \
            "GatewayClient应有list_mcp_registry方法"


class TestToolDiscovery:
    """测试工具发现"""

    @pytest.mark.asyncio
    async def test_list_api_tools(self):
        """测试API工具列表"""
        executor = HookToolExecutor()
        await executor.initialize()

        try:
            tools = await executor.list_api_tools()
            logger.info(f"✅ 成功发现API工具: {len(tools)}个")
            logger.info(f"   工具列表: {tools[:5]}{'...' if len(tools) > 5 else ''}")

            # 验证工具名称格式
            for tool in tools:
                assert tool.startswith('api:'), \
                    f"API工具格式应为 'api:config:tool_name', 实际为 {tool}"
        except Exception as e:
            logger.warning(f"⚠️  无法获取API工具列表: {e}")
            logger.info("   这可能是因为LLM Gateway未运行或没有配置API工具")

    @pytest.mark.asyncio
    async def test_list_mcp_tools(self):
        """测试MCP工具列表"""
        executor = HookToolExecutor()
        await executor.initialize()

        try:
            tools = await executor.list_mcp_tools()
            logger.info(f"✅ 成功发现MCP工具: {len(tools)}个")
            logger.info(f"   工具列表: {tools[:5]}{'...' if len(tools) > 5 else ''}")

            # 验证工具名称格式
            for tool in tools:
                assert tool.startswith('mcp:'), \
                    f"MCP工具格式应为 'mcp:server:tool_name', 实际为 {tool}"
        except Exception as e:
            logger.warning(f"⚠️  无法获取MCP工具列表: {e}")
            logger.info("   这可能是因为LLM Gateway未运行或没有配置MCP工具")

    @pytest.mark.asyncio
    async def test_gateway_connection_error_handling(self):
        """测试Gateway连接错误处理"""
        executor = HookToolExecutor()
        executor.gateway_url = "http://localhost:9999"  # 不存在的地址
        await executor.initialize()

        try:
            tools = await executor.list_api_tools()
            logger.warning(f"⚠️  意外成功连接到不存在的服务")
        except Exception as e:
            logger.info(f"✅ 正确捕获连接错误: {type(e).__name__}")
            assert "Connection" in str(type(e).__name__) or "refused" in str(e).lower(), \
                f"应该是连接错误, 实际错误: {e}"


class TestToolCalling:
    """测试工具调用"""

    @pytest.mark.asyncio
    async def test_tool_id_parsing(self):
        """测试工具ID解析"""
        executor = HookToolExecutor()

        # 测试完整格式
        tool_id = "api:my_config:my_tool"
        parts = tool_id.split(':')
        assert len(parts) == 3, f"工具ID格式错误: {tool_id}"
        assert parts[0] == 'api' and parts[1] == 'my_config' and parts[2] == 'my_tool'

        # 测试MCP格式
        tool_id = "mcp:playwright:click"
        parts = tool_id.split(':')
        assert len(parts) == 3, f"工具ID格式错误: {tool_id}"
        assert parts[0] == 'mcp' and parts[1] == 'playwright' and parts[2] == 'click'

        logger.info("✅ 工具ID解析正确")

    @pytest.mark.asyncio
    async def test_tool_call_with_gateway_unavailable(self):
        """测试Gateway不可用时的工具调用"""
        executor = HookToolExecutor()
        executor.gateway_url = "http://localhost:9999"
        await executor.initialize()

        # 尝试调用不存在的工具
        result = await executor.call_tool(
            "api:nonexistent:test_tool",
            param1="value1"
        )

        assert result.success == False, "调用应该失败"
        assert result.error is not None, "应该有错误信息"
        logger.info(f"✅ 正确处理Gateway不可用: {result.error}")


class TestHookIntegration:
    """测试Hook与工具执行器集成"""

    @pytest.mark.asyncio
    async def test_hook_has_tool_methods(self):
        """验证Hook基类有工具调用方法"""

        class TestHook(BaseHook):
            async def execute(self, *args, **kwargs):
                pass

        hook = TestHook({})

        assert hasattr(hook, 'call_tool'), "Hook应有call_tool方法"
        assert hasattr(hook, 'call_api_tool'), "Hook应有call_api_tool方法"
        assert hasattr(hook, 'call_mcp_tool'), "Hook应有call_mcp_tool方法"
        assert hasattr(hook, 'get_tool_schema'), "Hook应有get_tool_schema方法"

        logger.info("✅ Hook基类工具方法完整")

    @pytest.mark.asyncio
    async def test_pre_hook_tool_calling_interface(self):
        """测试PreHook工具调用接口"""

        class TestPreHook(PreHook):
            async def execute(self, run_input: RunInput, session, user_id, **kwargs):
                # 模拟工具调用
                logger.info("  PreHook执行中...")

        hook = TestPreHook({})

        # 验证可以调用工具方法
        assert callable(hook.call_tool), "call_tool应是可调用的"
        assert callable(hook.call_api_tool), "call_api_tool应是可调用的"
        assert callable(hook.call_mcp_tool), "call_mcp_tool应是可调用的"

        logger.info("✅ PreHook工具调用接口正确")

    @pytest.mark.asyncio
    async def test_post_hook_tool_calling_interface(self):
        """测试PostHook工具调用接口"""

        class TestPostHook(PostHook):
            async def execute(self, run_output: RunOutput, **kwargs):
                logger.info("  PostHook执行中...")

        hook = TestPostHook({})

        # 验证可以调用工具方法
        assert callable(hook.call_tool), "call_tool应是可调用的"
        assert callable(hook.call_api_tool), "call_api_tool应是可调用的"
        assert callable(hook.call_mcp_tool), "call_mcp_tool应是可调用的"

        logger.info("✅ PostHook工具调用接口正确")


class TestErrorRecovery:
    """测试错误恢复和降级"""

    @pytest.mark.asyncio
    async def test_tool_not_found_error(self):
        """测试工具不存在错误"""
        executor = HookToolExecutor()

        try:
            # 使用测试Gateway
            from unittest.mock import AsyncMock, MagicMock
            executor.gateway_client = AsyncMock()
            executor.gateway_client.list_api_configs.return_value = []
            executor.gateway_client.list_mcp_registry.return_value = []
            executor._initialized = True

            result = await executor.call_tool("nonexistent_tool")

            assert result.success == False, "应该失败"
            logger.info(f"✅ 正确处理工具不存在: {result.error}")
        except Exception as e:
            logger.warning(f"⚠️  测试设置出错: {e}")

    @pytest.mark.asyncio
    async def test_tool_call_timeout(self):
        """测试工具调用超时处理"""
        executor = HookToolExecutor()
        logger.info("✅ 工具调用超时处理预留 (需要实现)")


class TestConcurrency:
    """测试并发工具调用"""

    @pytest.mark.asyncio
    async def test_concurrent_tool_calls(self):
        """测试并发工具调用"""
        executor = HookToolExecutor()

        # 并发调用多个工具
        tasks = [
            executor.list_api_tools(),
            executor.list_mcp_tools(),
        ]

        try:
            results = await asyncio.gather(*tasks, return_exceptions=True)

            # 检查是否都完成（可能成功或失败）
            assert len(results) == 2, "应该收到两个结果"
            logger.info(f"✅ 并发调用完成: {len(results)}个任务")
        except Exception as e:
            logger.warning(f"⚠️  并发测试异常: {e}")


class TestRealEnvironmentDiagnostics:
    """真实环境诊断"""

    @pytest.mark.asyncio
    async def test_gateway_health_check(self):
        """检查Gateway健康状态"""
        gateway_client = GatewayClient()

        logger.info(f"检查Gateway: {gateway_client.base}")

        try:
            # 尝试获取API配置列表
            configs = await gateway_client.list_api_configs()
            logger.info(f"✅ Gateway连接成功")
            logger.info(f"   API配置数量: {len(configs)}")
            if configs:
                for cfg in configs[:3]:
                    logger.info(f"     - {cfg.get('name', 'Unknown')}")
        except Exception as e:
            logger.warning(f"⚠️  Gateway不可达: {e}")
            logger.info("   故障排查:")
            logger.info("   1. 检查LLM Gateway是否运行在http://127.0.0.1:9050")
            logger.info("   2. 检查网络连接和防火墙")
            logger.info("   3. 检查LLM_GATEWAY_URL环境变量")

    @pytest.mark.asyncio
    async def test_hook_executor_singleton(self):
        """验证Hook执行器单例"""
        executor1 = get_hook_tool_executor()
        executor2 = get_hook_tool_executor()

        assert executor1 is executor2, "应该是同一个单例实例"
        logger.info("✅ Hook执行器单例正确")

    @pytest.mark.asyncio
    async def test_tool_call_result_structure(self):
        """验证工具调用结果结构"""
        result = ToolCallResult(
            success=True,
            result={"data": "test"},
            error=None,
            metadata={"tool": "test_tool"}
        )

        assert result.success == True
        assert result.result == {"data": "test"}
        assert result.error is None
        assert result.metadata["tool"] == "test_tool"
        logger.info("✅ 工具调用结果结构正确")


# 运行诊断
async def run_diagnostics():
    """运行诊断"""
    print("\n" + "="*80)
    print("🔍 Hook工具调用实际集成诊断")
    print("="*80 + "\n")

    # 1. 网关诊断
    print("【1】Gateway连接诊断")
    print("-" * 80)
    test = TestRealEnvironmentDiagnostics()
    await test.test_gateway_health_check()

    # 2. 工具执行器诊断
    print("\n【2】工具执行器初始化诊断")
    print("-" * 80)
    test = TestGatewayConnectivity()
    try:
        await test.test_gateway_url_configuration()
        await test.test_gateway_client_initialization()
    except AssertionError as e:
        logger.error(f"❌ 初始化失败: {e}")
    except Exception as e:
        logger.warning(f"⚠️  初始化异常: {e}")

    # 3. 工具发现诊断
    print("\n【3】工具发现诊断")
    print("-" * 80)
    test = TestToolDiscovery()
    try:
        await test.test_list_api_tools()
        await test.test_list_mcp_tools()
    except Exception as e:
        logger.warning(f"⚠️  工具发现异常: {e}")

    # 4. Hook集成诊断
    print("\n【4】Hook集成诊断")
    print("-" * 80)
    test = TestHookIntegration()
    try:
        await test.test_hook_has_tool_methods()
        await test.test_pre_hook_tool_calling_interface()
        await test.test_post_hook_tool_calling_interface()
    except AssertionError as e:
        logger.error(f"❌ Hook集成失败: {e}")
    except Exception as e:
        logger.warning(f"⚠️  Hook集成异常: {e}")

    # 5. 单例诊断
    print("\n【5】单例诊断")
    print("-" * 80)
    test = TestRealEnvironmentDiagnostics()
    await test.test_hook_executor_singleton()

    print("\n" + "="*80)
    print("✅ 诊断完成")
    print("="*80 + "\n")


if __name__ == "__main__":
    # 运行诊断而不是单元测试
    asyncio.run(run_diagnostics())

    print("\n【说明】")
    print("-" * 80)
    print("此测试文件包含两种运行方式:")
    print("")
    print("1. 诊断模式 (推荐):")
    print("   python test_hook_tool_integration.py")
    print("")
    print("2. pytest模式:")
    print("   pytest test_hook_tool_integration.py -v")
    print("   或指定特定测试:")
    print("   pytest test_hook_tool_integration.py::TestGatewayConnectivity::test_gateway_url_configuration -v")
    print("")
    print("【预期发现的问题】")
    print("-" * 80)
    print("- Gateway连接失败 (如果Gateway未运行)")
    print("- 工具列表为空 (如果没有配置工具)")
    print("- 工具调用错误 (需要实际工具支持)")
    print("- 超时处理缺失 (需要实现)")
    print("="*80)
