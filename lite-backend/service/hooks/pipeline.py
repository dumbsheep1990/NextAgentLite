"""
Hook Pipeline执行引擎

管理Hook链的执行，支持按顺序执行多个hooks
"""

from typing import List, Dict, Any, Optional
import time
import logging
from .base import (
    PreHook, PostHook, RunInput, RunOutput, AgentSession,
    HookType, HookStatus, HookExecutionResult, HookCheckError
)
from .registry import hook_registry

logger = logging.getLogger(__name__)


class HookPipeline:
    """Hook Pipeline

    管理pre-hooks和post-hooks的执行链
    """

    def __init__(
        self,
        pipeline_id: str,
        pipeline_name: str,
        pre_hook_configs: List[Dict[str, Any]] = None,
        post_hook_configs: List[Dict[str, Any]] = None
    ):
        """初始化Pipeline

        Args:
            pipeline_id: Pipeline唯一标识
            pipeline_name: Pipeline名称
            pre_hook_configs: Pre-hooks配置列表
            post_hook_configs: Post-hooks配置列表
        """
        self.pipeline_id = pipeline_id
        self.pipeline_name = pipeline_name
        self.pre_hook_configs = pre_hook_configs or []
        self.post_hook_configs = post_hook_configs or []

        # 初始化hooks实例
        self.pre_hooks: List[PreHook] = []
        self.post_hooks: List[PostHook] = []
        self.execution_results: List[HookExecutionResult] = []

        self._initialize_hooks()

    def _initialize_hooks(self) -> None:
        """初始化hooks实例"""
        # 初始化Pre-hooks
        for config in self.pre_hook_configs:
            hook_id = config.get('hook_id')
            enabled = config.get('enabled', True)

            if not enabled:
                logger.debug(f"Pre-hook {hook_id} 已禁用，跳过初始化")
                continue

            hook_class = config.get('class')
            if isinstance(hook_class, str):
                # 从注册中心获取
                hook_class = hook_registry.get_pre_hook(hook_class)

            if hook_class is None:
                logger.warning(f"Pre-hook {hook_id} 的类未找到，跳过")
                continue

            try:
                hook_instance = hook_class(config)
                self.pre_hooks.append(hook_instance)
                logger.info(f"初始化Pre-hook: {hook_id}")
            except Exception as e:
                logger.error(f"初始化Pre-hook {hook_id} 失败: {e}")

        # 初始化Post-hooks
        for config in self.post_hook_configs:
            hook_id = config.get('hook_id')
            enabled = config.get('enabled', True)

            if not enabled:
                logger.debug(f"Post-hook {hook_id} 已禁用，跳过初始化")
                continue

            hook_class = config.get('class')
            if isinstance(hook_class, str):
                # 从注册中心获取
                hook_class = hook_registry.get_post_hook(hook_class)

            if hook_class is None:
                logger.warning(f"Post-hook {hook_id} 的类未找到，跳过")
                continue

            try:
                hook_instance = hook_class(config)
                self.post_hooks.append(hook_instance)
                logger.info(f"初始化Post-hook: {hook_id}")
            except Exception as e:
                logger.error(f"初始化Post-hook {hook_id} 失败: {e}")

    async def execute_pre_hooks(
        self,
        run_input: RunInput,
        session: AgentSession,
        user_id: Optional[str] = None,
        debug_mode: Optional[bool] = None,
        **kwargs
    ) -> List[HookExecutionResult]:
        """执行Pre-hooks链

        Args:
            run_input: 运行输入
            session: 会话信息
            user_id: 用户ID
            debug_mode: 调试模式
            **kwargs: 其他参数

        Returns:
            执行结果列表

        Raises:
            HookCheckError: 当任何hook检查失败时
        """
        results = []

        logger.info(f"[Pipeline {self.pipeline_id}] 开始执行{len(self.pre_hooks)}个Pre-hooks")

        for idx, hook in enumerate(self.pre_hooks):
            start_time = time.time()
            hook_id = hook.hook_id

            try:
                logger.debug(f"执行Pre-hook [{idx+1}/{len(self.pre_hooks)}]: {hook_id}")

                # 执行hook
                await hook(run_input, session, user_id, debug_mode, **kwargs)

                # 记录成功结果
                execution_time_ms = int((time.time() - start_time) * 1000)
                result = HookExecutionResult(
                    hook_id=hook_id,
                    hook_type=HookType.PRE,
                    status=HookStatus.SUCCESS,
                    execution_time_ms=execution_time_ms,
                    input_snapshot={'content_length': len(run_input.input_content)},
                    routing_decision=run_input.context.get('retrieval_strategy')
                )
                results.append(result)

                logger.info(f"Pre-hook {hook_id} 执行成功 ({execution_time_ms}ms)")

            except HookCheckError as e:
                # Hook检查失败，记录并抛出
                execution_time_ms = int((time.time() - start_time) * 1000)
                result = HookExecutionResult(
                    hook_id=hook_id,
                    hook_type=HookType.PRE,
                    status=HookStatus.FAILURE,
                    execution_time_ms=execution_time_ms,
                    error_message=str(e),
                    metadata={'check_trigger': e.check_trigger}
                )
                results.append(result)

                logger.warning(f"Pre-hook {hook_id} 检查失败: {e.message}")
                raise

            except Exception as e:
                # 其他异常，记录并继续（可配置是否中断）
                execution_time_ms = int((time.time() - start_time) * 1000)
                result = HookExecutionResult(
                    hook_id=hook_id,
                    hook_type=HookType.PRE,
                    status=HookStatus.FAILURE,
                    execution_time_ms=execution_time_ms,
                    error_message=str(e)
                )
                results.append(result)

                logger.error(f"Pre-hook {hook_id} 执行异常: {e}")

                # 根据配置决定是否中断
                if hook.config.get('stop_on_error', False):
                    raise

        self.execution_results.extend(results)
        return results

    async def execute_post_hooks(
        self,
        run_output: RunOutput,
        **kwargs
    ) -> List[HookExecutionResult]:
        """执行Post-hooks链

        Args:
            run_output: 运行输出
            **kwargs: 其他参数

        Returns:
            执行结果列表

        Raises:
            HookCheckError: 当任何hook检查失败时
        """
        results = []

        logger.info(f"[Pipeline {self.pipeline_id}] 开始执行{len(self.post_hooks)}个Post-hooks")

        for idx, hook in enumerate(self.post_hooks):
            start_time = time.time()
            hook_id = hook.hook_id

            try:
                logger.debug(f"执行Post-hook [{idx+1}/{len(self.post_hooks)}]: {hook_id}")

                # 执行hook
                await hook(run_output, **kwargs)

                # 记录成功结果
                execution_time_ms = int((time.time() - start_time) * 1000)
                result = HookExecutionResult(
                    hook_id=hook_id,
                    hook_type=HookType.POST,
                    status=HookStatus.SUCCESS,
                    execution_time_ms=execution_time_ms,
                    output_snapshot={'content_length': len(run_output.content)}
                )
                results.append(result)

                logger.info(f"Post-hook {hook_id} 执行成功 ({execution_time_ms}ms)")

            except HookCheckError as e:
                # Hook检查失败，记录并抛出
                execution_time_ms = int((time.time() - start_time) * 1000)
                result = HookExecutionResult(
                    hook_id=hook_id,
                    hook_type=HookType.POST,
                    status=HookStatus.FAILURE,
                    execution_time_ms=execution_time_ms,
                    error_message=str(e),
                    metadata={'check_trigger': e.check_trigger}
                )
                results.append(result)

                logger.warning(f"Post-hook {hook_id} 检查失败: {e.message}")
                raise

            except Exception as e:
                # 其他异常，记录并继续
                execution_time_ms = int((time.time() - start_time) * 1000)
                result = HookExecutionResult(
                    hook_id=hook_id,
                    hook_type=HookType.POST,
                    status=HookStatus.FAILURE,
                    execution_time_ms=execution_time_ms,
                    error_message=str(e)
                )
                results.append(result)

                logger.error(f"Post-hook {hook_id} 执行异常: {e}")

                # 根据配置决定是否中断
                if hook.config.get('stop_on_error', False):
                    raise

        self.execution_results.extend(results)
        return results

    def get_execution_summary(self) -> Dict[str, Any]:
        """获取执行摘要

        Returns:
            执行摘要字典
        """
        total_hooks = len(self.execution_results)
        success_count = sum(1 for r in self.execution_results if r.status == HookStatus.SUCCESS)
        failure_count = sum(1 for r in self.execution_results if r.status == HookStatus.FAILURE)
        total_time_ms = sum(r.execution_time_ms for r in self.execution_results)

        return {
            'pipeline_id': self.pipeline_id,
            'pipeline_name': self.pipeline_name,
            'total_hooks': total_hooks,
            'success_count': success_count,
            'failure_count': failure_count,
            'total_time_ms': total_time_ms,
            'results': [
                {
                    'hook_id': r.hook_id,
                    'hook_type': r.hook_type,
                    'status': r.status,
                    'execution_time_ms': r.execution_time_ms,
                    'error_message': r.error_message
                }
                for r in self.execution_results
            ]
        }
