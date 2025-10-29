#!/usr/bin/env python3
"""
Hook工具调用功能测试

测试Hook系统的工具调用能力（API工具和MCP工具）
"""

import asyncio
import sys
import logging
from pathlib import Path

# 添加项目路径
sys.path.insert(0, str(Path(__file__).parent / "lite-backend"))

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


# 模拟工具管理器（用于测试）
class MockToolManager:
    """模拟工具管理器"""

    def __init__(self):
        self.tools = {
            'text_cleaning_api': self._mock_text_cleaning,
            'pii_masking_api': self._mock_pii_masking,
            'content_safety_api': self._mock_content_safety,
        }

    async def execute_tool(self, tool_name: str, **kwargs):
        """执行工具"""
        if tool_name in self.tools:
            return await self.tools[tool_name](**kwargs)
        else:
            raise ValueError(f"工具未找到: {tool_name}")

    async def _mock_text_cleaning(self, text: str, **kwargs):
        """模拟文本清洗"""
        # 模拟清洗：去除特殊字符，标准化空白
        import re
        cleaned = re.sub(r'\s+', ' ', text.strip())
        return {
            'result': cleaned,
            'cleaned': True,
            'method': 'api_cleaning'
        }

    async def _mock_pii_masking(self, content: str, **kwargs):
        """模拟敏感信息脱敏"""
        import re
        masked = content
        # 脱敏邮箱
        masked = re.sub(r'[\w\.-]+@[\w\.-]+ \.\w+', '[EMAIL_MASKED]', masked)
        # 脱敏手机号
        masked = re.sub(r'1[3-9]\d{9}', '[PHONE_MASKED]', masked)
        return {
            'result': masked,
            'masked': True,
            'method': 'api_masking'
        }

    async def _mock_content_safety(self, content: str, **kwargs):
        """模拟内容安全检查"""
        # 检查是否包含不安全内容
        unsafe_keywords = ['drop table', 'delete from', '<script']
        is_safe = not any(keyword in content.lower() for keyword in unsafe_keywords)
        return {
            'is_safe': is_safe,
            'method': 'api_safety_check'
        }

    async def list_tools(self):
        """列出可用工具"""
        return list(self.tools.keys())

    async def get_tool_schema(self, tool_name: str):
        """获取工具模式"""
        schemas = {
            'text_cleaning_api': {
                'name': 'text_cleaning_api',
                'description': '文本清洗工具',
                'parameters': {
                    'text': 'string',
                    'normalize': 'boolean'
                }
            },
            'pii_masking_api': {
                'name': 'pii_masking_api',
                'description': 'PII脱敏工具',
                'parameters': {
                    'content': 'string',
                    'mask_types': 'object'
                }
            }
        }
        return schemas.get(tool_name)


async def test_tool_executor_basic():
    """测试工具执行器基础功能"""
    logger.info("=" * 60)
    logger.info("测试 1: 工具执行器基础功能")
    logger.info("=" * 60)

    try:
        from service.hooks.tool_executor import get_hook_tool_executor

        executor = get_hook_tool_executor()
        # 不初始化真实工具管理器，直接使用模拟
        executor.api_tool_manager = MockToolManager()
        executor._initialized = True

        logger.info("✅ 工具执行器创建成功")

        # 测试调用工具
        result = await executor.call_api_tool('text_cleaning_api', text="  hello   world  ")
        logger.info(f"✅ API工具调用成功: {result}")

        return True
    except Exception as e:
        logger.error(f"❌ 测试失败: {e}")
        import traceback
        traceback.print_exc()
        return False


async def test_data_cleaning_hook():
    """测试数据清洗Hook"""
    logger.info("=" * 60)
    logger.info("测试 2: 数据清洗Hook（含工具调用）")
    logger.info("=" * 60)

    try:
        from service.hooks.pre_hooks.data_cleaning import DataCleaningPreHook
        from service.hooks.tool_executor import get_hook_tool_executor
        from service.hooks import RunInput, AgentSession

        # 配置Hook
        config = {
            'hook_id': 'data_cleaning',
            'enabled': True,
            'config': {
                'normalize': True,
                'cleaning_tool': 'text_cleaning_api',
                'remove_special_chars': False,
                'lowercase': False
            }
        }

        hook = DataCleaningPreHook(config)

        # 注入模拟工具管理器
        executor = get_hook_tool_executor()
        executor.api_tool_manager = MockToolManager()
        executor._initialized = True

        # 准备输入
        run_input = RunInput(
            input_content="   Hello   World!   This is   a test   message   ",
            session_id="test-session",
            user_id="test-user"
        )
        session = AgentSession(id="test-session", user_id="test-user", agent_id="test-agent")

        # 执行Hook
        logger.info("测试2.1: 执行数据清洗Hook...")
        await hook.execute(run_input, session)

        logger.info(f"✅ 数据清洗完成")
        logger.info(f"   原始: '{run_input.metadata.get('original', run_input.input_content)}'")
        logger.info(f"   清洗后: '{run_input.input_content}'")
        logger.info(f"   清洗信息: {run_input.context.get('data_cleaning')}")

        return True

    except Exception as e:
        logger.error(f"❌ 测试失败: {e}")
        import traceback
        traceback.print_exc()
        return False


async def test_desensitization_hook():
    """测试敏感信息脱敏Hook"""
    logger.info("=" * 60)
    logger.info("测试 3: 敏感信息脱敏Hook（含工具调用）")
    logger.info("=" * 60)

    try:
        from service.hooks.post_hooks.desensitization import DesensitizationPostHook
        from service.hooks.tool_executor import get_hook_tool_executor
        from service.hooks import RunOutput

        # 配置Hook
        config = {
            'hook_id': 'desensitization',
            'enabled': True,
            'config': {
                'mask_email': True,
                'mask_phone': True,
                'mask_id': True,
                'mask_bank_card': True,
                'mask_ip': True,
                'desensitization_tool': None  # 仅使用本地脱敏
            }
        }

        hook = DesensitizationPostHook(config)

        # 准备输出（包含敏感信息）
        run_output = RunOutput(
            content="用户邮箱: test@example.com, 电话: 13812345678, IP: 192.168.1.1"
        )

        # 执行Hook
        logger.info("测试3.1: 执行敏感信息脱敏Hook...")
        await hook.execute(run_output)

        logger.info(f"✅ 敏感信息脱敏完成")
        logger.info(f"   原始: '{run_output.metadata.get('original', run_output.content)}'")
        logger.info(f"   脱敏后: '{run_output.content}'")
        logger.info(f"   脱敏信息: {run_output.metadata.get('desensitization')}")

        return True

    except Exception as e:
        logger.error(f"❌ 测试失败: {e}")
        import traceback
        traceback.print_exc()
        return False


async def test_full_pipeline_with_tools():
    """测试包含工具调用的完整Pipeline"""
    logger.info("=" * 60)
    logger.info("测试 4: 完整Pipeline（数据清洗 + 脱敏）")
    logger.info("=" * 60)

    try:
        from service.hook_pipeline_service import get_hook_pipeline_service
        from service.hooks.tool_executor import get_hook_tool_executor
        from service.hooks import RunInput, RunOutput, AgentSession

        # 配置工具管理器
        executor = get_hook_tool_executor()
        executor.api_tool_manager = MockToolManager()
        executor._initialized = True

        # 加载增强Pipeline
        service = get_hook_pipeline_service()
        yaml_path = "/Users/wxn/Desktop/NextAgentLite/lite-backend/config/hook_pipelines/enhanced_data_pipeline.yaml"

        logger.info(f"测试4.1: 从YAML加载Pipeline...")
        pipeline = service.load_pipeline_from_yaml(yaml_path)

        if not pipeline:
            logger.error("❌ Pipeline加载失败")
            return False

        logger.info(f"✅ Pipeline加载成功: {pipeline.pipeline_name}")
        logger.info(f"   Pre-hooks: {len(pipeline.pre_hooks)}")
        logger.info(f"   Post-hooks: {len(pipeline.post_hooks)}")

        # 执行Pipeline
        logger.info(f"测试4.2: 执行Pipeline...")

        run_input = RunInput(
            input_content="   User email: test@example.com, Phone: 13812345678   ",
            session_id="test-session",
            user_id="test-user"
        )
        session = AgentSession(id="test-session", user_id="test-user", agent_id="test-agent")

        # 执行Pre-hooks
        await pipeline.execute_pre_hooks(run_input, session)
        logger.info(f"✅ Pre-hooks执行完成")
        logger.info(f"   数据清洗: {run_input.context.get('data_cleaning')}")
        logger.info(f"   意图分析: {run_input.context.get('intent')}")
        logger.info(f"   清洗后内容: {run_input.input_content}")

        # 执行Post-hooks
        run_output = RunOutput(
            content=f"用户信息: {run_input.input_content}"
        )
        await pipeline.execute_post_hooks(run_output)
        logger.info(f"✅ Post-hooks执行完成")
        logger.info(f"   敏感信息脱敏: {run_output.metadata.get('desensitization')}")
        logger.info(f"   脱敏后内容: {run_output.content}")

        return True

    except Exception as e:
        logger.error(f"❌ 测试失败: {e}")
        import traceback
        traceback.print_exc()
        return False


async def run_all_tests():
    """运行所有测试"""
    logger.info("\n" + "=" * 60)
    logger.info("🧪 开始Hook工具调用功能测试套件")
    logger.info("=" * 60 + "\n")

    results = {
        "工具执行器基础功能": await test_tool_executor_basic(),
        "数据清洗Hook": await test_data_cleaning_hook(),
        "敏感信息脱敏Hook": await test_desensitization_hook(),
        "完整Pipeline": await test_full_pipeline_with_tools(),
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
