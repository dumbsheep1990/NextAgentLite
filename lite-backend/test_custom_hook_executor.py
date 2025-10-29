"""
测试自定义Hook执行引擎
"""

import asyncio
import sys
from pathlib import Path

# 添加项目路径
project_root = Path(__file__).parent
sys.path.insert(0, str(project_root))


async def test_executor_import():
    """测试模块导入"""
    try:
        from service.hooks.custom_hook_executor import CustomHookExecutor, CustomPreHook, CustomPostHook
        print("✅ 模块导入成功")
        return True
    except Exception as e:
        print(f"❌ 模块导入失败: {e}")
        import traceback
        traceback.print_exc()
        return False


async def test_executor_initialization():
    """测试执行器初始化"""
    try:
        from service.hooks.custom_hook_executor import CustomHookExecutor

        config = {
            'hook_id': 'test_hook',
            'execution_mode': 'sequential',
            'timeout_ms': 5000,
            'max_retries': 2,
            'tool_bindings': [
                {
                    'step_id': 'step1',
                    'tool_id': 'test:tool:example',
                    'tool_type': 'api',
                    'params': {'param1': 'value1'},
                    'on_success': 'continue',
                    'on_failure': 'continue'
                }
            ]
        }

        executor = CustomHookExecutor(config)

        assert executor.hook_id == 'test_hook'
        assert executor.execution_mode == 'sequential'
        assert len(executor.tool_bindings) == 1

        print("✅ 执行器初始化成功")
        print(f"   - Hook ID: {executor.hook_id}")
        print(f"   - 执行模式: {executor.execution_mode}")
        print(f"   - 工具绑定数: {len(executor.tool_bindings)}")
        return True

    except Exception as e:
        print(f"❌ 执行器初始化失败: {e}")
        import traceback
        traceback.print_exc()
        return False


async def test_condition_check():
    """测试条件检查功能"""
    try:
        from service.hooks.custom_hook_executor import CustomHookExecutor

        executor = CustomHookExecutor({'hook_id': 'test'})

        # 测试相等条件
        condition = {'field': 'language', 'operator': 'eq', 'value': 'zh'}
        context = {'language': 'zh'}
        assert executor._check_condition(condition, context) == True

        # 测试不相等条件
        context = {'language': 'en'}
        assert executor._check_condition(condition, context) == False

        # 测试contains条件
        condition = {'field': 'text', 'operator': 'contains', 'value': 'test'}
        context = {'text': 'this is a test string'}
        assert executor._check_condition(condition, context) == True

        print("✅ 条件检查功能测试通过")
        return True

    except Exception as e:
        print(f"❌ 条件检查功能测试失败: {e}")
        import traceback
        traceback.print_exc()
        return False


async def test_pre_hook_initialization():
    """测试PreHook初始化"""
    try:
        from service.hooks.custom_hook_executor import CustomPreHook

        config = {
            'hook_id': 'test_pre_hook',
            'priority': 10,
            'config': {
                'db_hook_id': 'my_custom_hook',
                'execution_mode': 'sequential',
                'tool_bindings': [
                    {
                        'step_id': 'test_step',
                        'tool_id': 'api:test:tool',
                        'tool_type': 'api',
                        'params': {}
                    }
                ]
            }
        }

        hook = CustomPreHook(config)

        assert hook.hook_id == 'test_pre_hook'
        assert hook.executor is not None
        assert hook.executor.hook_id == 'test_pre_hook'

        print("✅ PreHook初始化成功")
        print(f"   - Hook ID: {hook.hook_id}")
        print(f"   - 优先级: {hook.priority}")
        print(f"   - 执行器已加载: {hook.executor is not None}")
        return True

    except Exception as e:
        print(f"❌ PreHook初始化失败: {e}")
        import traceback
        traceback.print_exc()
        return False


async def main():
    """运行所有测试"""
    print("="*60)
    print("开始测试自定义Hook执行引擎")
    print("="*60)

    tests = [
        ("模块导入", test_executor_import),
        ("执行器初始化", test_executor_initialization),
        ("条件检查", test_condition_check),
        ("PreHook初始化", test_pre_hook_initialization)
    ]

    results = []

    for test_name, test_func in tests:
        print(f"\n📝 测试: {test_name}")
        print("-"*60)
        result = await test_func()
        results.append((test_name, result))
        print()

    # 汇总结果
    print("="*60)
    print("测试结果汇总")
    print("="*60)

    passed = sum(1 for _, result in results if result)
    total = len(results)

    for test_name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status}: {test_name}")

    print(f"\n总计: {passed}/{total} 测试通过")

    if passed == total:
        print("\n🎉 所有测试通过！执行引擎就绪！")
        return 0
    else:
        print(f"\n⚠️  有 {total - passed} 个测试失败")
        return 1


if __name__ == '__main__':
    exit_code = asyncio.run(main())
    sys.exit(exit_code)
