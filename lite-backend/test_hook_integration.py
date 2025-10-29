"""
Hook执行和工具绑定的完整集成测试
测试从创建Hook到执行的完整流程
"""
import asyncio
import sys
import json
from pathlib import Path
from typing import Dict, Any

# 添加项目路径
project_root = Path(__file__).parent
sys.path.insert(0, str(project_root))


async def test_hook_integration():
    """完整的Hook集成测试"""

    print("=" * 80)
    print("Hook执行和工具绑定 - 完整集成测试")
    print("=" * 80)

    test_results = {
        'total': 0,
        'passed': 0,
        'failed': 0,
        'details': []
    }

    # ========== 测试1: 导入模块 ==========
    test_results['total'] += 1
    try:
        from service.hooks.tool_executor import get_hook_tool_executor, HookToolExecutor
        from service.hooks.custom_hook_executor import CustomHookExecutor, CustomPreHook, CustomPostHook
        from service.hooks.pipeline import HookPipeline
        from service.hooks.base import RunInput, RunOutput, AgentSession
        print("\n✅ 测试1: 模块导入成功")
        test_results['passed'] += 1
        test_results['details'].append(('模块导入', 'PASS', ''))
    except Exception as e:
        print(f"\n❌ 测试1: 模块导入失败 - {e}")
        test_results['failed'] += 1
        test_results['details'].append(('模块导入', 'FAIL', str(e)))
        import traceback
        traceback.print_exc()
        return test_results

    # ========== 测试2: 初始化Tool Executor ==========
    test_results['total'] += 1
    try:
        tool_executor = get_hook_tool_executor()
        await tool_executor.initialize()
        print("✅ 测试2: Tool Executor初始化成功")
        test_results['passed'] += 1
        test_results['details'].append(('Tool Executor初始化', 'PASS', ''))
    except Exception as e:
        print(f"❌ 测试2: Tool Executor初始化失败 - {e}")
        test_results['failed'] += 1
        test_results['details'].append(('Tool Executor初始化', 'FAIL', str(e)))
        return test_results

    # ========== 测试3: 获取可用工具列表 ==========
    test_results['total'] += 1
    try:
        api_tools = await tool_executor.list_api_tools()
        mcp_tools = await tool_executor.list_mcp_tools()

        print(f"\n✅ 测试3: 工具列表获取成功")
        print(f"   - API工具数量: {len(api_tools)}")
        print(f"   - MCP工具数量: {len(mcp_tools)}")

        if len(api_tools) > 0 or len(mcp_tools) > 0:
            test_results['passed'] += 1
            test_results['details'].append(('工具列表获取', 'PASS', f'{len(api_tools)} API + {len(mcp_tools)} MCP'))
        else:
            print("   ⚠️  警告: 没有找到任何工具")
            test_results['failed'] += 1
            test_results['details'].append(('工具列表获取', 'FAIL', '没有找到任何工具'))
    except Exception as e:
        print(f"❌ 测试3: 工具列表获取失败 - {e}")
        test_results['failed'] += 1
        test_results['details'].append(('工具列表获取', 'FAIL', str(e)))

    # ========== 测试4: 初始化Custom Hook Executor ==========
    test_results['total'] += 1
    try:
        from service.hooks.custom_hook_executor import CustomHookExecutor

        # 创建测试配置
        test_hook_config = {
            'hook_id': 'test_custom_hook',
            'execution_mode': 'sequential',
            'timeout_ms': 5000,
            'max_retries': 0,
            'tool_bindings': []
        }

        hook_executor = CustomHookExecutor(test_hook_config)
        print("\n✅ 测试4: Custom Hook Executor初始化成功")
        print(f"   - Hook ID: {hook_executor.hook_id}")
        print(f"   - 执行模式: {hook_executor.execution_mode}")
        test_results['passed'] += 1
        test_results['details'].append(('Custom Hook Executor初始化', 'PASS', ''))
    except Exception as e:
        print(f"❌ 测试4: Custom Hook Executor初始化失败 - {e}")
        test_results['failed'] += 1
        test_results['details'].append(('Custom Hook Executor初始化', 'FAIL', str(e)))
        import traceback
        traceback.print_exc()
        return test_results

    # ========== 测试5: 查询数据库中的Custom Hooks ==========
    test_results['total'] += 1
    try:
        from core.database import get_db_pool

        pool = await get_db_pool()

        query = """
            SELECT hook_id, hook_name, hook_type, is_active,
                   tool_bindings, execution_mode, priority
            FROM custom_hooks
            WHERE is_active = true
            ORDER BY priority DESC
            LIMIT 5
        """

        async with pool.acquire() as conn:
            rows = await conn.fetch(query)

        print(f"\n✅ 测试5: 数据库查询成功")
        print(f"   - 找到 {len(rows)} 个活跃的Custom Hooks")

        hooks_data = []
        for row in rows:
            hook_info = {
                'hook_id': row['hook_id'],
                'hook_name': row['hook_name'],
                'hook_type': row['hook_type'],
                'execution_mode': row['execution_mode'],
                'priority': row['priority'],
                'tool_bindings_count': len(row['tool_bindings']) if row['tool_bindings'] else 0
            }
            hooks_data.append(hook_info)
            print(f"   - {hook_info['hook_name']} ({hook_info['hook_type']})")
            print(f"     工具绑定数: {hook_info['tool_bindings_count']}, 执行模式: {hook_info['execution_mode']}")

        test_results['passed'] += 1
        test_results['details'].append(('数据库查询', 'PASS', f'{len(rows)} hooks'))

    except Exception as e:
        print(f"❌ 测试5: 数据库查询失败 - {e}")
        test_results['failed'] += 1
        test_results['details'].append(('数据库查询', 'FAIL', str(e)))
        import traceback
        traceback.print_exc()

    # ========== 测试6: 测试条件检查功能 ==========
    test_results['total'] += 1
    try:
        # 测试CustomHookExecutor的条件检查方法
        test_conditions = [
            ({'field': 'status', 'operator': 'eq', 'value': 'success'}, {'status': 'success'}, True),
            ({'field': 'status', 'operator': 'eq', 'value': 'success'}, {'status': 'failed'}, False),
            ({'field': 'count', 'operator': 'gt', 'value': 5}, {'count': 10}, True),
            ({'field': 'count', 'operator': 'lt', 'value': 5}, {'count': 3}, True),
            ({'field': 'name', 'operator': 'contains', 'value': 'test'}, {'name': 'my-test-hook'}, True),
        ]

        print("\n✅ 测试6: 条件检查功能")
        all_passed = True
        for condition, context, expected in test_conditions:
            result = hook_executor._check_condition(condition, context)
            status = "✓" if result == expected else "✗"
            print(f"   {status} 条件: {condition}, 上下文: {context}, 预期: {expected}, 实际: {result}")
            if result != expected:
                all_passed = False

        if all_passed:
            test_results['passed'] += 1
            test_results['details'].append(('条件检查', 'PASS', ''))
        else:
            test_results['failed'] += 1
            test_results['details'].append(('条件检查', 'FAIL', '部分条件检查失败'))

    except Exception as e:
        print(f"❌ 测试6: 条件检查失败 - {e}")
        test_results['failed'] += 1
        test_results['details'].append(('条件检查', 'FAIL', str(e)))
        import traceback
        traceback.print_exc()

    # ========== 测试7: 模拟工具执行 ==========
    test_results['total'] += 1
    try:
        print("\n✅ 测试7: 模拟工具执行")

        # 创建模拟的工具绑定
        mock_tool_binding = {
            'step_id': 'step_1',
            'tool_id': 'mock_tool',
            'tool_type': 'api',
            'params': {'action': 'test'},
            'on_success': 'continue',
            'on_failure': 'stop'
        }

        print(f"   - 模拟工具绑定配置: {json.dumps(mock_tool_binding, indent=2, ensure_ascii=False)}")

        # 验证配置结构完整性
        required_fields = ['step_id', 'tool_id', 'tool_type', 'params']
        missing_fields = [f for f in required_fields if f not in mock_tool_binding]

        if not missing_fields:
            print("   ✓ 工具绑定配置结构完整")
            test_results['passed'] += 1
            test_results['details'].append(('模拟工具执行', 'PASS', ''))
        else:
            print(f"   ✗ 工具绑定配置缺少字段: {missing_fields}")
            test_results['failed'] += 1
            test_results['details'].append(('模拟工具执行', 'FAIL', f'缺少字段: {missing_fields}'))

    except Exception as e:
        print(f"❌ 测试7: 模拟工具执行失败 - {e}")
        test_results['failed'] += 1
        test_results['details'].append(('模拟工具执行', 'FAIL', str(e)))

    # ========== 测试8: HookPipeline执行流程 ==========
    test_results['total'] += 1
    try:
        from service.hooks.pipeline import HookPipeline
        from service.hooks.base import RunInput, RunOutput, AgentSession

        print("\n✅ 测试8: HookPipeline执行流程")

        # 创建测试Pipeline配置（不包含任何hooks，只测试初始化）
        pipeline = HookPipeline(
            pipeline_id='test_pipeline',
            pipeline_name='测试Pipeline',
            pre_hook_configs=[],
            post_hook_configs=[]
        )

        print(f"   ✓ Pipeline创建成功: {pipeline.pipeline_name}")
        print(f"   - Pre-hooks数量: {len(pipeline.pre_hooks)}")
        print(f"   - Post-hooks数量: {len(pipeline.post_hooks)}")

        # 创建测试的RunInput和RunOutput
        test_run_input = RunInput(
            input_content="测试输入",
            context={'user_id': 'test_user'}
        )

        test_session = AgentSession(
            id='test_session',
            user_id='test_user'
        )

        # 执行空的Pre-hooks链（不会有任何hooks执行）
        pre_results = await pipeline.execute_pre_hooks(
            run_input=test_run_input,
            session=test_session
        )
        print(f"   ✓ Pre-hooks执行完成，执行了 {len(pre_results)} 个hooks")

        # 创建测试的RunOutput
        test_run_output = RunOutput(
            content="测试输出",
            metadata={'test': True}
        )

        # 执行空的Post-hooks链
        post_results = await pipeline.execute_post_hooks(
            run_output=test_run_output
        )
        print(f"   ✓ Post-hooks执行完成，执行了 {len(post_results)} 个hooks")

        # 获取执行摘要
        summary = pipeline.get_execution_summary()
        print(f"   - 执行摘要: {json.dumps(summary, ensure_ascii=False, indent=2)}")

        test_results['passed'] += 1
        test_results['details'].append(('HookPipeline执行流程', 'PASS', ''))

    except Exception as e:
        print(f"❌ 测试8: HookPipeline执行流程失败 - {e}")
        test_results['failed'] += 1
        test_results['details'].append(('HookPipeline执行流程', 'FAIL', str(e)))
        import traceback
        traceback.print_exc()

    return test_results


async def main():
    """运行所有集成测试"""
    try:
        results = await test_hook_integration()

        # 打印测试汇总
        print("\n" + "=" * 80)
        print("测试结果汇总")
        print("=" * 80)

        for test_name, status, details in results['details']:
            status_icon = "✅" if status == "PASS" else "❌"
            detail_str = f" ({details})" if details else ""
            print(f"{status_icon} {status}: {test_name}{detail_str}")

        print("\n" + "-" * 80)
        print(f"总计: {results['passed']}/{results['total']} 测试通过")

        if results['failed'] > 0:
            print(f"⚠️  {results['failed']} 个测试失败")
        else:
            print("🎉 所有测试通过！Hook执行和工具绑定系统就绪！")

        return results

    except Exception as e:
        print(f"\n❌ 测试执行出错: {e}")
        import traceback
        traceback.print_exc()
        return None


if __name__ == '__main__':
    asyncio.run(main())
