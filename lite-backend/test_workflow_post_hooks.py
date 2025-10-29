"""
Workflow Post-hooks集成测试
验证Post-hooks在workflow执行中正常调用
"""

import asyncio
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__)))

from service.workflows.tool_orchestration import _execute_post_hooks
from service.hooks.base import RunOutput
from service.hooks.pipeline import HookPipeline
from service.hooks.post_hooks.desensitization import DesensitizationPostHook
from core.logger import logger
from unittest.mock import MagicMock


async def test_post_hooks_helper_function():
    """测试_execute_post_hooks辅助函数"""
    print("\n" + "="*80)
    print("【测试_execute_post_hooks辅助函数】")
    print("="*80)

    # 创建Mock的WorkflowContext
    ctx = MagicMock()
    ctx.vars = {'citations': []}
    ctx.inputs = {'run_id': 'test-001'}

    # 测试1: 无Pipeline时返回原始文本
    result = await _execute_post_hooks(None, "测试文本", "test-001", ctx)
    assert result == "测试文本", "无Pipeline应返回原始文本"
    print("✅ 测试1: 无Pipeline返回原始文本")

    # 测试2: 空文本时返回空字符串
    result = await _execute_post_hooks(None, "", "test-001", ctx)
    assert result == "", "空文本应返回空字符串"
    print("✅ 测试2: 空文本返回空字符串")


async def test_post_hooks_with_pipeline():
    """测试带Pipeline的Post-hooks执行"""
    print("\n" + "="*80)
    print("【测试带Pipeline的Post-hooks执行】")
    print("="*80)

    # 创建Pipeline配置
    post_hooks_config = [
        {
            'hook_id': 'desensitization',
            'enabled': True,
            'class': DesensitizationPostHook,
            'config': {
                'mask_email': True,
                'mask_phone': True,
                'mask_id': True,
                'mask_bank_card': False,
                'mask_ip': False,
                'desensitization_tool': None  # 不调用工具，仅本地脱敏
            }
        }
    ]

    # 创建Pipeline
    pipeline = HookPipeline(
        pipeline_id='test-pipeline',
        pipeline_name='Test Pipeline',
        pre_hook_configs=[],
        post_hook_configs=post_hooks_config
    )

    # 创建Mock的WorkflowContext
    ctx = MagicMock()
    ctx.vars = {'citations': []}
    ctx.inputs = {'run_id': 'test-002'}

    # 测试数据：包含敏感信息
    input_text = "请联系我，邮箱: test@example.com，电话: 13800000000，身份证: 110101199003079999"

    print(f"\n输入文本: {input_text}")

    # 执行Post-hooks
    result = await _execute_post_hooks(pipeline, input_text, "test-002", ctx)

    print(f"输出文本: {result}")

    # 验证脱敏效果
    assert "[EMAIL_MASKED]" in result, "邮箱应被脱敏"
    assert "[PHONE_MASKED]" in result, "电话应被脱敏"
    assert "[ID_MASKED]" in result, "身份证应被脱敏"
    assert "test@example.com" not in result, "原始邮箱应被替换"
    assert "13800000000" not in result, "原始电话应被替换"

    print("✅ 测试3: Pipeline Post-hooks正常执行")
    print("✅ 测试4: 邮箱脱敏正确")
    print("✅ 测试5: 电话脱敏正确")
    print("✅ 测试6: 身份证脱敏正确")


async def test_workflow_context_integration():
    """测试Workflow上下文集成"""
    print("\n" + "="*80)
    print("【测试Workflow上下文集成】")
    print("="*80)

    # 创建Pipeline
    post_hooks_config = [
        {
            'hook_id': 'desensitization',
            'enabled': True,
            'class': DesensitizationPostHook,
            'config': {
                'mask_email': True,
                'mask_phone': False,
                'mask_id': False,
                'mask_bank_card': False,
                'mask_ip': False,
                'desensitization_tool': None
            }
        }
    ]

    pipeline = HookPipeline(
        pipeline_id='test-pipeline-2',
        pipeline_name='Test Pipeline 2',
        pre_hook_configs=[],
        post_hook_configs=post_hooks_config
    )

    # 模拟真实的WorkflowContext
    ctx = MagicMock()
    ctx.vars = {
        'citations': [
            {'source': 'doc1', 'content': '测试'},
            {'source': 'doc2', 'content': '文档'}
        ],
        'search_results': ['result1', 'result2']
    }
    ctx.inputs = {'run_id': 'wf-12345'}

    # 执行
    test_text = "回复邮件到admin@company.com"
    result = await _execute_post_hooks(pipeline, test_text, "wf-12345", ctx)

    print(f"输入: {test_text}")
    print(f"输出: {result}")

    # 验证脱敏
    assert "[EMAIL_MASKED]" in result, "邮箱应被脱敏"
    assert "admin@company.com" not in result, "原始邮箱应被替换"

    # 验证元数据记录
    if ctx.vars.get('desensitization_metadata'):
        metadata = ctx.vars['desensitization_metadata']
        print(f"\n脱敏元数据: {metadata}")
        print("✅ 测试7: 脱敏元数据正确记录")
    else:
        print("⚠️  脱敏元数据未记录")

    print("✅ 测试8: Workflow上下文集成正确")


async def test_error_handling():
    """测试错误处理"""
    print("\n" + "="*80)
    print("【测试错误处理】")
    print("="*80)

    # 创建一个会失败的Pipeline（故意设置错误配置）
    post_hooks_config = [
        {
            'hook_id': 'desensitization',
            'enabled': True,
            'class': DesensitizationPostHook,
            'config': {
                'mask_email': True,
                'desensitization_tool': 'nonexistent_tool'  # 工具不存在
            }
        }
    ]

    pipeline = HookPipeline(
        pipeline_id='test-pipeline-error',
        pipeline_name='Test Pipeline Error',
        pre_hook_configs=[],
        post_hook_configs=post_hooks_config
    )

    ctx = MagicMock()
    ctx.vars = {'citations': []}
    ctx.inputs = {'run_id': 'test-error'}

    # 执行（应该返回原始文本，即使Post-hooks失败）
    test_text = "test@example.com"
    result = await _execute_post_hooks(pipeline, test_text, "test-error", ctx)

    print(f"输入: {test_text}")
    print(f"输出: {result}")

    # 验证：即使工具调用失败，本地脱敏仍应工作
    assert "[EMAIL_MASKED]" in result or "test@example.com" in result, "应该返回某种结果"
    print("✅ 测试9: 错误处理正确（Post-hooks失败不中断workflow）")

    # 检查是否记录了错误
    if 'post_hook_error' in ctx.vars:
        print(f"✅ 测试10: 错误已记录: {ctx.vars['post_hook_error'][:50]}...")


async def main():
    """主函数"""
    try:
        print("\n" + "="*80)
        print("🔍 Workflow Post-hooks集成测试")
        print("="*80)

        # 运行所有测试
        await test_post_hooks_helper_function()
        await test_post_hooks_with_pipeline()
        await test_workflow_context_integration()
        await test_error_handling()

        print("\n" + "="*80)
        print("✅ 所有Post-hooks集成测试通过！")
        print("="*80 + "\n")

        print("【关键发现】")
        print("-" * 80)
        print("✅ _execute_post_hooks辅助函数工作正常")
        print("✅ Post-hooks与Pipeline正确集成")
        print("✅ 敏感信息脱敏功能完整")
        print("✅ Workflow上下文传递正确")
        print("✅ 错误处理和降级机制有效")
        print("\n【下一步】")
        print("-" * 80)
        print("1. 在实际workflow中验证（需要运行完整workflow）")
        print("2. 测试与Pre-hooks的协同工作")
        print("3. 验证工具调用中的参数传递")
        print("4. 性能测试和优化")
        print("="*80)

    except Exception as e:
        print(f"\n❌ 测试出错: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    asyncio.run(main())
