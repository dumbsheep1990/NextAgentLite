"""
通用自定义Hook执行引擎

根据JSON配置动态执行工具调用，支持：
- 顺序/并行执行模式
- 条件判断
- 错误处理
- 执行日志记录
"""

import logging
import asyncio
import time
from typing import Any, Dict, Optional, List
from datetime import datetime
import json
from uuid import uuid4

from .base import PreHook, PostHook, RunInput, RunOutput, AgentSession, InputCheckError, OutputCheckError, CheckTrigger
from .registry import register_pre_hook, register_post_hook
import asyncpg

logger = logging.getLogger(__name__)


class CustomHookExecutor:
    """自定义Hook执行引擎基类

    提供通用的工具调用执行逻辑
    """

    def __init__(self, config: Dict):
        """初始化执行器

        Args:
            config: Hook配置，包含：
                - hook_id: Hook ID
                - execution_mode: 执行模式 (sequential/parallel)
                - timeout_ms: 超时时间
                - max_retries: 最大重试次数
                - tool_bindings: 工具绑定配置列表
        """
        self.hook_id = config.get('hook_id', 'unknown')
        self.execution_mode = config.get('execution_mode', 'sequential')
        self.timeout_ms = config.get('timeout_ms', 5000)
        self.max_retries = config.get('max_retries', 0)
        self.tool_bindings = config.get('tool_bindings', [])

        # 工具执行器（从BaseHook继承）
        self._tool_executor = None

        logger.info(
            f"CustomHookExecutor初始化: hook_id={self.hook_id}, "
            f"mode={self.execution_mode}, tools={len(self.tool_bindings)}"
        )

    def _get_tool_executor(self):
        """获取工具执行器（延迟初始化）"""
        if self._tool_executor is None:
            from service.hooks.tool_executor import get_hook_tool_executor
            self._tool_executor = get_hook_tool_executor()
        return self._tool_executor

    async def _call_tool(
        self,
        tool_id: str,
        tool_type: str = 'auto',
        **kwargs
    ) -> Dict[str, Any]:
        """调用工具（与BaseHook的call_tool方法相同）"""
        executor = self._get_tool_executor()
        tool_result = await executor.call_tool(tool_id, tool_type, **kwargs)

        if tool_result.success:
            logger.debug(f"Hook {self.hook_id} 工具调用成功: {tool_id}")
            return {
                'success': True,
                'data': tool_result.result,
                'metadata': tool_result.metadata
            }
        else:
            logger.warning(f"Hook {self.hook_id} 工具调用失败: {tool_id}, 错误: {tool_result.error}")
            return {
                'success': False,
                'error': tool_result.error,
                'metadata': tool_result.metadata
            }

    def _check_condition(self, condition: Optional[Dict], context: Dict) -> bool:
        """检查执行条件

        Args:
            condition: 条件配置，格式：
                {
                    "field": "language",
                    "operator": "eq",  # eq, ne, gt, lt, contains, regex
                    "value": "zh"
                }
            context: 上下文数据

        Returns:
            是否满足条件
        """
        if not condition:
            return True

        field = condition.get('field')
        operator = condition.get('operator', 'eq')
        expected_value = condition.get('value')

        # 从context中获取字段值
        actual_value = context.get(field)

        # 执行比较
        try:
            if operator == 'eq':
                return actual_value == expected_value
            elif operator == 'ne':
                return actual_value != expected_value
            elif operator == 'gt':
                return actual_value > expected_value
            elif operator == 'lt':
                return actual_value < expected_value
            elif operator == 'contains':
                return expected_value in str(actual_value)
            elif operator == 'regex':
                import re
                return bool(re.search(expected_value, str(actual_value)))
            else:
                logger.warning(f"未知的条件操作符: {operator}")
                return True
        except Exception as e:
            logger.error(f"条件判断失败: {e}")
            return False

    async def _execute_tool_step(
        self,
        step: Dict,
        context: Dict,
        execution_id: str
    ) -> Dict[str, Any]:
        """执行单个工具步骤

        Args:
            step: 工具步骤配置
            context: 上下文数据
            execution_id: 执行ID

        Returns:
            步骤执行结果
        """
        step_id = step.get('step_id', 'unknown')
        tool_id = step.get('tool_id')
        tool_type = step.get('tool_type', 'auto')
        params = step.get('params', {})
        condition = step.get('condition')
        on_success = step.get('on_success', 'continue')
        on_failure = step.get('on_failure', 'continue')

        start_time = time.time()
        result = {
            'step_id': step_id,
            'tool_id': tool_id,
            'started_at': datetime.now().isoformat(),
            'status': 'pending'
        }

        try:
            # 1. 检查条件
            if not self._check_condition(condition, context):
                logger.info(f"步骤 {step_id} 条件不满足，跳过执行")
                result['status'] = 'skipped'
                result['reason'] = 'condition_not_met'
                result['completed_at'] = datetime.now().isoformat()
                result['execution_time_ms'] = int((time.time() - start_time) * 1000)
                return result

            # 2. 执行工具调用
            logger.info(f"执行步骤 {step_id}: tool={tool_id}, params={params}")

            tool_result = await self._call_tool(
                tool_id,
                tool_type=tool_type,
                **params
            )

            # 3. 处理结果
            if tool_result['success']:
                result['status'] = 'success'
                result['result'] = tool_result['data']
                result['metadata'] = tool_result.get('metadata', {})
                result['next_action'] = on_success

                # 保存到context
                context[step_id] = tool_result['data']

                logger.info(f"✅ 步骤 {step_id} 执行成功")
            else:
                result['status'] = 'failure'
                result['error'] = tool_result['error']
                result['next_action'] = on_failure

                logger.warning(f"❌ 步骤 {step_id} 执行失败: {tool_result['error']}")

        except Exception as e:
            result['status'] = 'error'
            result['error'] = str(e)
            result['next_action'] = on_failure
            logger.error(f"❌ 步骤 {step_id} 执行异常: {e}", exc_info=True)

        finally:
            result['completed_at'] = datetime.now().isoformat()
            result['execution_time_ms'] = int((time.time() - start_time) * 1000)

        return result

    async def execute_sequential(
        self,
        context: Dict,
        execution_id: str
    ) -> Dict[str, Any]:
        """顺序执行所有工具步骤

        Args:
            context: 上下文数据
            execution_id: 执行ID

        Returns:
            执行结果汇总
        """
        results = []
        should_continue = True

        for step in self.tool_bindings:
            if not should_continue:
                logger.info(f"Hook执行提前终止")
                break

            step_result = await self._execute_tool_step(step, context, execution_id)
            results.append(step_result)

            # 根据next_action决定是否继续
            next_action = step_result.get('next_action', 'continue')
            if next_action == 'abort':
                should_continue = False
                logger.info(f"步骤 {step_result['step_id']} 要求终止执行")
            elif next_action == 'stop':
                should_continue = False

        return {
            'execution_mode': 'sequential',
            'total_steps': len(self.tool_bindings),
            'executed_steps': len(results),
            'results': results
        }

    async def execute_parallel(
        self,
        context: Dict,
        execution_id: str
    ) -> Dict[str, Any]:
        """并行执行所有工具步骤

        Args:
            context: 上下文数据
            execution_id: 执行ID

        Returns:
            执行结果汇总
        """
        # 创建所有步骤的任务
        tasks = [
            self._execute_tool_step(step, context, execution_id)
            for step in self.tool_bindings
        ]

        # 并行执行所有任务
        results = await asyncio.gather(*tasks, return_exceptions=True)

        # 处理异常结果
        processed_results = []
        for i, result in enumerate(results):
            if isinstance(result, Exception):
                processed_results.append({
                    'step_id': self.tool_bindings[i].get('step_id', f'step_{i}'),
                    'status': 'error',
                    'error': str(result)
                })
            else:
                processed_results.append(result)

        return {
            'execution_mode': 'parallel',
            'total_steps': len(self.tool_bindings),
            'executed_steps': len(processed_results),
            'results': processed_results
        }

    async def execute(
        self,
        context: Dict,
        execution_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """执行Hook

        Args:
            context: 上下文数据（会被修改）
            execution_id: 执行ID（用于日志记录）

        Returns:
            执行结果
        """
        if not execution_id:
            execution_id = str(uuid4())

        start_time = time.time()

        logger.info(
            f"开始执行自定义Hook: {self.hook_id}, "
            f"mode={self.execution_mode}, "
            f"execution_id={execution_id}"
        )

        try:
            # 根据执行模式选择执行方法
            if self.execution_mode == 'parallel':
                execution_result = await self.execute_parallel(context, execution_id)
            else:
                execution_result = await self.execute_sequential(context, execution_id)

            # 计算统计信息
            total_time_ms = int((time.time() - start_time) * 1000)
            results = execution_result['results']

            successful_steps = sum(1 for r in results if r.get('status') == 'success')
            failed_steps = sum(1 for r in results if r.get('status') in ['failure', 'error'])
            skipped_steps = sum(1 for r in results if r.get('status') == 'skipped')

            summary = {
                'execution_id': execution_id,
                'hook_id': self.hook_id,
                'status': 'success' if failed_steps == 0 else 'partial_failure',
                'execution_time_ms': total_time_ms,
                'total_steps': len(self.tool_bindings),
                'successful_steps': successful_steps,
                'failed_steps': failed_steps,
                'skipped_steps': skipped_steps,
                'execution_mode': execution_result['execution_mode'],
                'tool_calls': results
            }

            logger.info(
                f"✅ Hook执行完成: {self.hook_id}, "
                f"耗时={total_time_ms}ms, "
                f"成功={successful_steps}, 失败={failed_steps}"
            )

            return summary

        except Exception as e:
            logger.error(f"❌ Hook执行失败: {self.hook_id}, 错误={e}", exc_info=True)
            return {
                'execution_id': execution_id,
                'hook_id': self.hook_id,
                'status': 'error',
                'error': str(e),
                'execution_time_ms': int((time.time() - start_time) * 1000)
            }


# ========================================
# Pre-Hook实现
# ========================================

@register_pre_hook(
    hook_id='custom_pre_hook',
    metadata={
        'name': '自定义Pre-Hook',
        'description': '通用自定义Pre-Hook执行器',
        'category': 'custom'
    }
)
class CustomPreHook(PreHook):
    """自定义Pre-Hook执行器

    从数据库加载配置并执行工具调用
    """

    def __init__(self, config: Dict):
        super().__init__(config)

        # 提取配置
        hook_config = config.get('config', {})
        self.db_hook_id = hook_config.get('db_hook_id')  # 数据库中的Hook ID

        # 如果提供了完整的工具绑定配置，直接使用
        if 'tool_bindings' in hook_config:
            self.executor = CustomHookExecutor({
                'hook_id': self.hook_id,
                'execution_mode': hook_config.get('execution_mode', 'sequential'),
                'timeout_ms': hook_config.get('timeout_ms', 5000),
                'max_retries': hook_config.get('max_retries', 0),
                'tool_bindings': hook_config.get('tool_bindings', [])
            })
        else:
            self.executor = None

        logger.info(f"CustomPreHook初始化: hook_id={self.hook_id}, db_hook_id={self.db_hook_id}")

    async def _load_from_database(self) -> Optional[CustomHookExecutor]:
        """从数据库加载Hook配置"""
        if not self.db_hook_id:
            return None

        try:
            from core.database import get_db_pool
            pool = await get_db_pool()

            query = """
                SELECT hook_id, execution_mode, timeout_ms, max_retries, tool_bindings
                FROM custom_hooks
                WHERE hook_id = $1 AND is_active = true
            """

            async with pool.acquire() as conn:
                row = await conn.fetchrow(query, self.db_hook_id)

            if not row:
                logger.error(f"数据库中未找到Hook: {self.db_hook_id}")
                return None

            # 创建执行器
            executor = CustomHookExecutor({
                'hook_id': row['hook_id'],
                'execution_mode': row['execution_mode'],
                'timeout_ms': row['timeout_ms'],
                'max_retries': row['max_retries'],
                'tool_bindings': row['tool_bindings'] or []
            })

            logger.info(f"✅ 从数据库加载Hook配置成功: {self.db_hook_id}")
            return executor

        except Exception as e:
            logger.error(f"❌ 从数据库加载Hook配置失败: {e}", exc_info=True)
            return None

    async def execute(
        self,
        run_input: RunInput,
        session: AgentSession,
        user_id: Optional[str] = None,
        debug_mode: Optional[bool] = None,
        **kwargs
    ) -> None:
        """执行自定义Pre-Hook

        Args:
            run_input: 运行输入（会被修改）
            session: 会话信息
            user_id: 用户ID
            debug_mode: 调试模式
        """
        # 如果没有预加载executor，从数据库加载
        if self.executor is None:
            self.executor = await self._load_from_database()

        if self.executor is None:
            logger.warning(f"CustomPreHook未配置executor，跳过执行")
            return

        # 准备context
        context = run_input.context.copy()
        context['input_content'] = run_input.input_content
        context['session_id'] = session.id
        context['user_id'] = user_id

        # 执行Hook
        execution_result = await self.executor.execute(
            context,
            execution_id=f"{session.id}_{self.hook_id}"
        )

        # 更新run_input.context
        for key, value in context.items():
            if key not in ['input_content', 'session_id', 'user_id']:
                run_input.context[key] = value

        # 保存执行结果
        run_input.context[f'_hook_execution_{self.hook_id}'] = execution_result

        # 如果有失败的步骤且配置为阻断，则抛出异常
        if execution_result.get('failed_steps', 0) > 0:
            # 检查是否有步骤要求abort
            for tool_call in execution_result.get('tool_calls', []):
                if tool_call.get('next_action') == 'abort' and tool_call.get('status') != 'success':
                    raise InputCheckError(
                        f"Hook执行失败: {tool_call.get('error', '未知错误')}",
                        check_trigger=CheckTrigger.VALIDATION_FAILED
                    )


# ========================================
# Post-Hook实现
# ========================================

@register_post_hook(
    hook_id='custom_post_hook',
    metadata={
        'name': '自定义Post-Hook',
        'description': '通用自定义Post-Hook执行器',
        'category': 'custom'
    }
)
class CustomPostHook(PostHook):
    """自定义Post-Hook执行器"""

    def __init__(self, config: Dict):
        super().__init__(config)

        hook_config = config.get('config', {})
        self.db_hook_id = hook_config.get('db_hook_id')

        if 'tool_bindings' in hook_config:
            self.executor = CustomHookExecutor({
                'hook_id': self.hook_id,
                'execution_mode': hook_config.get('execution_mode', 'sequential'),
                'timeout_ms': hook_config.get('timeout_ms', 5000),
                'max_retries': hook_config.get('max_retries', 0),
                'tool_bindings': hook_config.get('tool_bindings', [])
            })
        else:
            self.executor = None

    async def _load_from_database(self) -> Optional[CustomHookExecutor]:
        """从数据库加载Hook配置"""
        if not self.db_hook_id:
            return None

        try:
            from core.database import get_db_pool
            pool = await get_db_pool()

            query = """
                SELECT hook_id, execution_mode, timeout_ms, max_retries, tool_bindings
                FROM custom_hooks
                WHERE hook_id = $1 AND is_active = true
            """

            async with pool.acquire() as conn:
                row = await conn.fetchrow(query, self.db_hook_id)

            if not row:
                logger.error(f"数据库中未找到Hook: {self.db_hook_id}")
                return None

            executor = CustomHookExecutor({
                'hook_id': row['hook_id'],
                'execution_mode': row['execution_mode'],
                'timeout_ms': row['timeout_ms'],
                'max_retries': row['max_retries'],
                'tool_bindings': row['tool_bindings'] or []
            })

            logger.info(f"✅ 从数据库加载Hook配置成功: {self.db_hook_id}")
            return executor

        except Exception as e:
            logger.error(f"❌ 从数据库加载Hook配置失败: {e}", exc_info=True)
            return None

    async def execute(
        self,
        run_output: RunOutput,
        **kwargs
    ) -> None:
        """执行自定义Post-Hook

        Args:
            run_output: 运行输出（会被修改）
        """
        if self.executor is None:
            self.executor = await self._load_from_database()

        if self.executor is None:
            logger.warning(f"CustomPostHook未配置executor，跳过执行")
            return

        # 准备context
        context = run_output.metadata.copy()
        context['output_content'] = run_output.content

        # 执行Hook
        execution_result = await self.executor.execute(context)

        # 更新run_output.metadata
        for key, value in context.items():
            if key != 'output_content':
                run_output.metadata[key] = value

        # 保存执行结果
        run_output.metadata[f'_hook_execution_{self.hook_id}'] = execution_result
