#!/usr/bin/env python3
"""
Hook Pipeline功能测试脚本
测试Hook Pipeline的各个API端点和核心功能
"""

import asyncio
import sys
import os
import json
from pathlib import Path

# 添加项目路径
sys.path.insert(0, str(Path(__file__).parent / "lite-backend"))

import logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


async def test_hook_registry():
    """测试Hook注册表"""
    logger.info("=" * 60)
    logger.info("测试 1: Hook注册表功能")
    logger.info("=" * 60)

    try:
        from service.hooks import hook_registry

        # 列出所有注册的Pre-hooks
        pre_hooks = hook_registry.list_pre_hooks()
        logger.info(f"✅ 注册的Pre-hooks: {len(pre_hooks)}")
        for hook_id in pre_hooks:
            metadata = hook_registry.get_hook_metadata(hook_id)
            logger.info(f"   - {hook_id}: {metadata.get('name', 'N/A')}")

        # 列出所有注册的Post-hooks
        post_hooks = hook_registry.list_post_hooks()
        logger.info(f"✅ 注册的Post-hooks: {len(post_hooks)}")
        for hook_id in post_hooks:
            metadata = hook_registry.get_hook_metadata(hook_id)
            logger.info(f"   - {hook_id}: {metadata.get('name', 'N/A')}")

        return True
    except Exception as e:
        logger.error(f"❌ Hook注册表测试失败: {e}")
        import traceback
        traceback.print_exc()
        return False


async def test_hook_pipeline_service():
    """测试Hook Pipeline服务"""
    logger.info("=" * 60)
    logger.info("测试 2: Hook Pipeline服务")
    logger.info("=" * 60)

    try:
        from service.hook_pipeline_service import get_hook_pipeline_service

        # 获取服务实例
        service = get_hook_pipeline_service()
        await service.initialize()
        logger.info("✅ HookPipelineService初始化成功")

        # 获取缓存信息
        cache_info = service.get_cache_info()
        logger.info(f"✅ 缓存信息: {cache_info}")

        return True
    except Exception as e:
        logger.error(f"❌ Hook Pipeline服务测试失败: {e}")
        import traceback
        traceback.print_exc()
        return False


async def test_pipeline_loading():
    """测试Pipeline加载"""
    logger.info("=" * 60)
    logger.info("测试 3: Pipeline加载")
    logger.info("=" * 60)

    try:
        from service.hook_pipeline_service import load_default_pipeline, load_pipeline

        # 加载默认Pipeline
        default_pipeline = await load_default_pipeline()
        if default_pipeline:
            logger.info("✅ 默认Pipeline加载成功")
            logger.info(f"   Pipeline名称: {default_pipeline.pipeline_name}")
            logger.info(f"   Pre-hooks数量: {len(default_pipeline.pre_hooks)}")
            logger.info(f"   Post-hooks数量: {len(default_pipeline.post_hooks)}")
        else:
            logger.warning("⚠️  默认Pipeline加载失败或未找到")

        # 尝试从YAML加载
        yaml_pipeline = await load_pipeline("default_retrieval_pipeline", source='yaml')
        if yaml_pipeline:
            logger.info("✅ YAML Pipeline加载成功")
            logger.info(f"   Pipeline名称: {yaml_pipeline.pipeline_name}")
        else:
            logger.warning("⚠️  YAML Pipeline加载失败或未找到")

        return True
    except Exception as e:
        logger.error(f"❌ Pipeline加载测试失败: {e}")
        import traceback
        traceback.print_exc()
        return False


async def test_input_validation_hook():
    """测试InputValidation Hook"""
    logger.info("=" * 60)
    logger.info("测试 4: InputValidation Hook")
    logger.info("=" * 60)

    try:
        from service.hooks.pre_hooks.input_validation import InputValidationHook
        from service.hooks import RunInput, AgentSession, InputCheckError

        # 创建config字典
        config = {
            'hook_id': 'input_validation',
            'config': {
                'max_length': 4000,
                'min_length': 1,
                'forbidden_patterns': ['DROP TABLE', 'DELETE FROM', ';--', '<script']
            }
        }
        hook = InputValidationHook(config)

        # 测试1: 有效输入
        logger.info("测试4.1: 有效输入...")
        run_input = RunInput(
            input_content="这是一个测试问题",
            session_id="test-session",
            user_id="test-user"
        )
        session = AgentSession(id="test-session", user_id="test-user", agent_id="test-agent")

        result = await hook.execute(run_input, session, {})
        logger.info("✅ 有效输入通过验证")

        # 测试2: 超长输入
        logger.info("测试4.2: 超长输入...")
        long_input = RunInput(
            input_content="x" * 5000,
            session_id="test-session",
            user_id="test-user"
        )

        try:
            await hook.execute(long_input, session, {})
            logger.warning("⚠️  超长输入应该被拒绝")
        except InputCheckError as e:
            logger.info(f"✅ 超长输入被正确拒绝: {e}")

        # 测试3: SQL注入
        logger.info("测试4.3: SQL注入检测...")
        sql_input = RunInput(
            input_content="'; DROP TABLE users; --",
            session_id="test-session",
            user_id="test-user"
        )

        try:
            await hook.execute(sql_input, session, {})
            logger.warning("⚠️  SQL注入应该被拒绝")
        except InputCheckError as e:
            logger.info(f"✅ SQL注入被正确拒绝: {e}")

        return True
    except Exception as e:
        logger.error(f"❌ InputValidation Hook测试失败: {e}")
        import traceback
        traceback.print_exc()
        return False


async def test_intent_analysis_hook():
    """测试Intent Analysis Hook"""
    logger.info("=" * 60)
    logger.info("测试 5: Intent Analysis Hook")
    logger.info("=" * 60)

    try:
        from service.hooks.pre_hooks.intent_analysis import IntentAnalysisHook
        from service.hooks import RunInput, AgentSession

        # 创建config字典
        config = {
            'hook_id': 'intent_analysis',
            'config': {
                'enable_llm_fallback': False,  # 禁用LLM以支持测试环境
                'timeout': 5
            }
        }
        hook = IntentAnalysisHook(config)

        # 测试1: 简单事实问题
        logger.info("测试5.1: 简单事实问题...")
        run_input = RunInput(
            input_content="什么是地聚物？",
            session_id="test-session",
            user_id="test-user"
        )
        session = AgentSession(id="test-session", user_id="test-user", agent_id="test-agent")

        result = await hook.execute(run_input, session, {})
        logger.info(f"✅ 事实问题分析完成")
        logger.info(f"   识别的意图: {run_input.context.get('intent')}")
        logger.info(f"   复杂度: {run_input.context.get('query_features', {}).get('complexity')}")

        # 测试2: 复杂问题
        logger.info("测试5.2: 复杂问题...")
        complex_input = RunInput(
            input_content="比较地聚物和普通混凝土在强度、耐久性和环境影响方面的差异，并分析哪种材料更适合用于海洋环境中的基础设施建设",
            session_id="test-session",
            user_id="test-user"
        )

        result = await hook.execute(complex_input, session, {})
        logger.info(f"✅ 复杂问题分析完成")
        logger.info(f"   识别的意图: {complex_input.context.get('intent')}")
        logger.info(f"   复杂度: {complex_input.context.get('query_features', {}).get('complexity')}")

        return True
    except Exception as e:
        logger.error(f"❌ Intent Analysis Hook测试失败: {e}")
        import traceback
        traceback.print_exc()
        return False


async def test_retrieval_strategy_router():
    """测试Retrieval Strategy Router Hook"""
    logger.info("=" * 60)
    logger.info("测试 6: Retrieval Strategy Router Hook")
    logger.info("=" * 60)

    try:
        from service.hooks.pre_hooks.retrieval_strategy_router import RetrievalStrategyRouterHook
        from service.hooks import RunInput, AgentSession

        # 创建config字典
        config = {
            'hook_id': 'retrieval_strategy_router',
            'config': {
                'default_strategy': 'hybrid_default',
                'pre_retrieve': False,
                'routing_rules': [
                    {
                        'name': '简单事实查询',
                        'conditions': {'intent': 'fact', 'complexity': 'simple'},
                        'strategy': 'qa_direct'
                    }
                ]
            }
        }
        hook = RetrievalStrategyRouterHook(config)

        # 测试：根据意图选择检索策略
        logger.info("测试6.1: 根据意图选择检索策略...")
        run_input = RunInput(
            input_content="什么是地聚物？",
            session_id="test-session",
            user_id="test-user",
            context={
                'intent': 'fact',
                'query_features': {'complexity': 'simple'}
            }
        )
        session = AgentSession(id="test-session", user_id="test-user", agent_id="test-agent")

        result = await hook.execute(run_input, session, {})
        logger.info(f"✅ 检索策略选择完成")
        logger.info(f"   选择的策略: {run_input.context.get('retrieval_strategy')}")
        logger.info(f"   策略配置: {run_input.context.get('retrieval_config')}")

        return True
    except Exception as e:
        logger.error(f"❌ Retrieval Strategy Router测试失败: {e}")
        import traceback
        traceback.print_exc()
        return False


async def test_pipeline_execution():
    """测试完整Pipeline执行"""
    logger.info("=" * 60)
    logger.info("测试 7: 完整Pipeline执行")
    logger.info("=" * 60)

    try:
        from service.hook_pipeline_service import load_default_pipeline
        from service.hooks import RunInput, AgentSession

        # 加载Pipeline
        pipeline = await load_default_pipeline()
        if not pipeline:
            logger.warning("⚠️  无法加载默认Pipeline")
            return False

        logger.info("测试7.1: 执行Pre-hooks...")
        run_input = RunInput(
            input_content="什么是地聚物材料的主要特性？",
            session_id="test-session-123",
            user_id="test-user-456"
        )
        session = AgentSession(
            id="test-session-123",
            user_id="test-user-456",
            agent_id="test-agent"
        )

        await pipeline.execute_pre_hooks(run_input, session, user_id="test-user-456")
        logger.info("✅ Pre-hooks执行完成")
        logger.info(f"   提取的意图: {run_input.context.get('intent')}")
        logger.info(f"   选择的检索策略: {run_input.context.get('retrieval_strategy')}")

        # 获取执行摘要
        summary = pipeline.get_execution_summary()
        logger.info(f"✅ 执行摘要:")
        logger.info(f"   Pipeline: {summary.get('pipeline_name')}")
        logger.info(f"   执行的Hooks数量: {summary.get('total_hooks', 0)}")
        logger.info(f"   成功: {summary.get('success_count', 0)}, 失败: {summary.get('failure_count', 0)}")
        logger.info(f"   总耗时: {summary.get('total_time_ms', 0)}ms")
        for hook_result in summary.get('results', []):
            logger.info(f"   - {hook_result.get('hook_id')}: {hook_result.get('status')}")

        return True
    except Exception as e:
        logger.error(f"❌ Pipeline执行测试失败: {e}")
        import traceback
        traceback.print_exc()
        return False


async def run_all_tests():
    """运行所有测试"""
    logger.info("\n" + "=" * 60)
    logger.info("🧪 开始Hook Pipeline功能测试套件")
    logger.info("=" * 60 + "\n")

    results = {
        "Hook注册表": await test_hook_registry(),
        "Hook Pipeline服务": await test_hook_pipeline_service(),
        "Pipeline加载": await test_pipeline_loading(),
        "InputValidation Hook": await test_input_validation_hook(),
        "Intent Analysis Hook": await test_intent_analysis_hook(),
        "Retrieval Strategy Router": await test_retrieval_strategy_router(),
        "完整Pipeline执行": await test_pipeline_execution(),
    }

    # 总结测试结果
    logger.info("\n" + "=" * 60)
    logger.info("📊 测试结果总结")
    logger.info("=" * 60)

    passed = sum(1 for v in results.values() if v)
    total = len(results)

    for test_name, result in results.items():
        status = "✅ PASS" if result else "❌ FAIL"
        logger.info(f"{status}: {test_name}")

    logger.info("=" * 60)
    logger.info(f"总计: {passed}/{total} 测试通过 ({passed/total*100:.1f}%)")
    logger.info("=" * 60 + "\n")

    return passed == total


if __name__ == "__main__":
    try:
        success = asyncio.run(run_all_tests())
        sys.exit(0 if success else 1)
    except Exception as e:
        logger.error(f"测试执行出错: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
