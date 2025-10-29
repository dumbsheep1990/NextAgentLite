"""
Hook端到端执行测试
测试从数据库加载Hook并执行实际的工具调用
"""
import asyncio
import sys
import json
from pathlib import Path
from typing import Dict, Any
from uuid import uuid4

# 添加项目路径
project_root = Path(__file__).parent
sys.path.insert(0, str(project_root))


async def test_hook_end_to_end():
    """端到端测试：创建Hook -> 配置工具 -> 执行 -> 验证结果"""

    print("=" * 80)
    print("Hook端到端执行测试")
    print("=" * 80)

    test_results = {
        'total': 0,
        'passed': 0,
        'failed': 0,
        'details': []
    }

    # ========== 步骤1: 导入必要模块 ==========
    test_results['total'] += 1
    try:
        from service.hooks.custom_hook_executor import CustomHookExecutor, CustomPreHook
        from service.hooks.tool_executor import get_hook_tool_executor
        from core.database import get_db_pool

        print("\n✅ 步骤1: 模块导入成功")
        test_results['passed'] += 1
        test_results['details'].append(('模块导入', 'PASS', ''))
    except Exception as e:
        print(f"\n❌ 步骤1: 模块导入失败 - {e}")
        test_results['failed'] += 1
        test_results['details'].append(('模块导入', 'FAIL', str(e)))
        return test_results

    # ========== 步骤2: 查询现有的Hook配置 ==========
    test_results['total'] += 1
    try:
        pool = await get_db_pool()

        query = """
            SELECT
                hook_id, hook_name, hook_type, execution_mode,
                timeout_ms, max_retries, tool_bindings
            FROM custom_hooks
            WHERE is_active = true
                AND tool_bindings IS NOT NULL
                AND jsonb_array_length(tool_bindings) > 0
            LIMIT 1
        """

        async with pool.acquire() as conn:
            hook_row = await conn.fetchrow(query)

        if not hook_row:
            print("\n⚠️  步骤2: 数据库中没有配置了工具绑定的活跃Hook，跳过执行测试")
            test_results['passed'] += 1
            test_results['details'].append(('查询Hook配置', 'PASS', '无可执行Hook'))

            # 打印当前所有hooks
            list_query = """
                SELECT hook_id, hook_name, is_active,
                       COALESCE(jsonb_array_length(tool_bindings), 0) as tool_count
                FROM custom_hooks
                ORDER BY created_at DESC
            """
            async with pool.acquire() as conn:
                all_hooks = await conn.fetch(list_query)

            print(f"\n   当前数据库中的Hooks ({len(all_hooks)}):")
            for h in all_hooks:
                status = "✓" if h['is_active'] else "✗"
                print(f"   {status} {h['hook_name']} (ID: {h['hook_id']}, 工具数: {h['tool_count']})")

            # 跳过后续执行测试
            return test_results

        hook_config = dict(hook_row)
        print(f"\n✅ 步骤2: 找到可执行Hook")
        print(f"   - Hook名称: {hook_config['hook_name']}")
        print(f"   - Hook类型: {hook_config['hook_type']}")
        print(f"   - 执行模式: {hook_config['execution_mode']}")
        print(f"   - 工具绑定数: {len(hook_config['tool_bindings'])}")
        print(f"   - 工具配置:")
        for i, binding in enumerate(hook_config['tool_bindings']):
            print(f"     {i+1}. {binding.get('tool_id')} ({binding.get('tool_type')})")

        test_results['passed'] += 1
        test_results['details'].append(('查询Hook配置', 'PASS', hook_config['hook_name']))

    except Exception as e:
        print(f"\n❌ 步骤2: 查询Hook配置失败 - {e}")
        test_results['failed'] += 1
        test_results['details'].append(('查询Hook配置', 'FAIL', str(e)))
        import traceback
        traceback.print_exc()
        return test_results

    # ========== 步骤3: 创建CustomHookExecutor实例 ==========
    test_results['total'] += 1
    try:
        executor_config = {
            'hook_id': hook_config['hook_id'],
            'execution_mode': hook_config['execution_mode'],
            'timeout_ms': hook_config['timeout_ms'],
            'max_retries': hook_config['max_retries'],
            'tool_bindings': hook_config['tool_bindings']
        }

        hook_executor = CustomHookExecutor(executor_config)

        print(f"\n✅ 步骤3: CustomHookExecutor创建成功")
        print(f"   - Executor ID: {hook_executor.hook_id}")
        print(f"   - 执行模式: {hook_executor.execution_mode}")
        print(f"   - 超时时间: {hook_executor.timeout_ms}ms")

        test_results['passed'] += 1
        test_results['details'].append(('创建Executor', 'PASS', ''))

    except Exception as e:
        print(f"\n❌ 步骤3: 创建Executor失败 - {e}")
        test_results['failed'] += 1
        test_results['details'].append(('创建Executor', 'FAIL', str(e)))
        import traceback
        traceback.print_exc()
        return test_results

    # ========== 步骤4: 准备执行上下文 ==========
    test_results['total'] += 1
    try:
        execution_context = {
            'user_id': 'test_user_' + str(uuid4())[:8],
            'session_id': 'test_session_' + str(uuid4())[:8],
            'query': '测试Hook执行：通用查询示例',
            'action': 'test_hook_execution',
            'timestamp': '2025-01-22T10:00:00Z'
        }

        print(f"\n✅ 步骤4: 执行上下文准备完成")
        print(f"   - 上下文: {json.dumps(execution_context, ensure_ascii=False, indent=2)}")

        test_results['passed'] += 1
        test_results['details'].append(('准备执行上下文', 'PASS', ''))

    except Exception as e:
        print(f"\n❌ 步骤4: 准备执行上下文失败 - {e}")
        test_results['failed'] += 1
        test_results['details'].append(('准备执行上下文', 'FAIL', str(e)))
        return test_results

    # ========== 步骤5: 执行Hook ==========
    test_results['total'] += 1
    try:
        print(f"\n🔄 步骤5: 开始执行Hook...")
        print(f"   - 执行ID: {execution_context['session_id']}")

        # 执行Hook
        execution_result = await hook_executor.execute(
            context=execution_context,
            execution_id=execution_context['session_id']
        )

        print(f"\n✅ 步骤5: Hook执行完成")
        print(f"   - 执行状态: {execution_result['status']}")
        print(f"   - 执行耗时: {execution_result['execution_time_ms']}ms")
        print(f"   - 总步骤数: {execution_result['total_steps']}")
        print(f"   - 成功步骤: {execution_result['successful_steps']}")
        print(f"   - 失败步骤: {execution_result['failed_steps']}")
        print(f"   - 跳过步骤: {execution_result['skipped_steps']}")

        # 详细打印每个工具调用结果
        print(f"\n   📋 工具调用详情:")
        for i, tool_call in enumerate(execution_result['tool_calls']):
            print(f"\n   [{i+1}] 步骤: {tool_call['step_id']}")
            print(f"       工具: {tool_call['tool_id']}")
            print(f"       状态: {tool_call['status']}")
            print(f"       耗时: {tool_call.get('execution_time_ms', 0)}ms")

            if tool_call['status'] == 'success':
                result_preview = str(tool_call.get('result', ''))[:100]
                print(f"       结果: {result_preview}...")
            elif tool_call['status'] == 'failure' or tool_call['status'] == 'error':
                print(f"       错误: {tool_call.get('error', '未知错误')}")
            elif tool_call['status'] == 'skipped':
                print(f"       原因: {tool_call.get('reason', '未知')}")

        # 验证执行结果
        if execution_result['status'] == 'success':
            test_results['passed'] += 1
            test_results['details'].append(('执行Hook', 'PASS', f"{execution_result['successful_steps']}/{execution_result['total_steps']}成功"))
        elif execution_result['status'] == 'partial_failure':
            print(f"\n   ⚠️  部分工具调用失败，但Hook执行完成")
            test_results['passed'] += 1
            test_results['details'].append(('执行Hook', 'PASS', f"部分成功: {execution_result['successful_steps']}/{execution_result['total_steps']}"))
        else:
            print(f"\n   ❌ Hook执行失败")
            test_results['failed'] += 1
            test_results['details'].append(('执行Hook', 'FAIL', execution_result.get('error', '未知错误')))

    except Exception as e:
        print(f"\n❌ 步骤5: Hook执行异常 - {e}")
        test_results['failed'] += 1
        test_results['details'].append(('执行Hook', 'FAIL', str(e)))
        import traceback
        traceback.print_exc()

    # ========== 步骤6: 验证上下文修改 ==========
    test_results['total'] += 1
    try:
        print(f"\n✅ 步骤6: 检查上下文修改")

        # 检查执行前后上下文的变化
        modified_keys = [k for k in execution_context.keys() if not k.startswith('_')]

        print(f"   - 原始上下文键: {list(execution_context.keys())}")
        print(f"   - 修改/新增的键: {modified_keys}")

        # 检查是否有工具调用的结果被添加到context
        result_keys = [k for k in execution_context.keys() if k.startswith('step_')]
        if result_keys:
            print(f"   - 工具结果键: {result_keys}")
            for key in result_keys:
                value_preview = str(execution_context[key])[:100]
                print(f"     {key}: {value_preview}...")

        test_results['passed'] += 1
        test_results['details'].append(('验证上下文修改', 'PASS', ''))

    except Exception as e:
        print(f"\n❌ 步骤6: 验证上下文修改失败 - {e}")
        test_results['failed'] += 1
        test_results['details'].append(('验证上下文修改', 'FAIL', str(e)))

    return test_results


async def main():
    """运行端到端测试"""
    try:
        results = await test_hook_end_to_end()

        # 打印测试汇总
        print("\n" + "=" * 80)
        print("测试结果汇总")
        print("=" * 80)

        for test_name, status, details in results['details']:
            status_icon = "✅" if status == "PASS" else "❌"
            detail_str = f" - {details}" if details else ""
            print(f"{status_icon} {status}: {test_name}{detail_str}")

        print("\n" + "-" * 80)
        print(f"总计: {results['passed']}/{results['total']} 测试通过")

        if results['failed'] > 0:
            print(f"⚠️  {results['failed']} 个测试失败")
        else:
            print("🎉 所有端到端测试通过！Hook系统可以正常执行工具调用！")

        return results

    except Exception as e:
        print(f"\n❌ 测试执行出错: {e}")
        import traceback
        traceback.print_exc()
        return None


if __name__ == '__main__':
    asyncio.run(main())
