"""
Hook基类和核心接口定义

基于Agno Hooks机制，定义pre-hooks和post-hooks的基础接口
"""

from abc import ABC, abstractmethod
from typing import Any, Dict, Optional
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
import logging

logger = logging.getLogger(__name__)


class HookType(str, Enum):
    """Hook类型"""
    PRE = "pre"
    POST = "post"


class HookStatus(str, Enum):
    """Hook执行状态"""
    SUCCESS = "success"
    FAILURE = "failure"
    SKIPPED = "skipped"


@dataclass
class RunInput:
    """Agent运行输入

    兼容Agno的RunInput接口，同时支持自定义上下文
    """
    input_content: str
    context: Dict[str, Any] = field(default_factory=dict)
    session_id: Optional[str] = None
    user_id: Optional[str] = None
    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass
class RunOutput:
    """Agent运行输出

    兼容Agno的RunOutput接口
    """
    content: str
    metadata: Dict[str, Any] = field(default_factory=dict)
    citations: list = field(default_factory=list)


@dataclass
class AgentSession:
    """Agent会话信息"""
    id: str
    user_id: Optional[str] = None
    agent_id: Optional[str] = None
    created_at: datetime = field(default_factory=datetime.utcnow)
    metadata: Dict[str, Any] = field(default_factory=dict)


class HookCheckError(Exception):
    """Hook检查异常基类"""
    def __init__(self, message: str, check_trigger: str = ""):
        self.message = message
        self.check_trigger = check_trigger
        super().__init__(self.message)


class InputCheckError(HookCheckError):
    """输入检查异常"""
    pass


class OutputCheckError(HookCheckError):
    """输出检查异常"""
    pass


class CheckTrigger:
    """检查触发器常量"""
    INPUT_NOT_ALLOWED = "INPUT_NOT_ALLOWED"
    OUTPUT_NOT_ALLOWED = "OUTPUT_NOT_ALLOWED"
    VALIDATION_FAILED = "VALIDATION_FAILED"
    SECURITY_VIOLATION = "SECURITY_VIOLATION"


class BaseHook(ABC):
    """Hook基类

    所有pre-hooks和post-hooks的抽象基类
    支持工具调用能力
    """

    def __init__(self, config: Dict[str, Any]):
        """初始化Hook

        Args:
            config: Hook配置字典
        """
        self.config = config
        self.hook_id = config.get('hook_id', self.__class__.__name__)
        self.enabled = config.get('enabled', True)
        self.description = config.get('description', '')
        self.priority = config.get('priority', 0)

        # 工具配置
        self.tools_config = config.get('tools', {})
        self._tool_executor = None

    @abstractmethod
    async def execute(self, *args, **kwargs) -> Any:
        """执行Hook逻辑

        子类必须实现此方法
        """
        pass

    def validate_config(self) -> bool:
        """验证配置

        Returns:
            配置是否有效
        """
        return True

    async def on_error(self, error: Exception) -> None:
        """错误处理钩子

        Args:
            error: 执行过程中发生的异常
        """
        logger.error(f"Hook {self.hook_id} 执行失败: {error}")

    def _get_tool_executor(self):
        """获取工具执行器（延迟初始化）"""
        if self._tool_executor is None:
            from service.hooks.tool_executor import get_hook_tool_executor
            self._tool_executor = get_hook_tool_executor()
        return self._tool_executor

    async def call_tool(
        self,
        tool_id: str,
        tool_type: str = 'auto',
        **kwargs
    ) -> Dict[str, Any]:
        """调用工具（API或MCP）

        Args:
            tool_id: 工具ID (格式: tool_name 或 source:tool_name)
            tool_type: 工具类型 ('api', 'mcp', 'auto')
            **kwargs: 工具参数

        Returns:
            工具执行结果字典

        Example:
            # 调用API工具
            result = await self.call_tool('text_cleaning', content='hello')

            # 调用MCP工具
            result = await self.call_tool('mcp:pii_masking', text='xxx')
        """
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

    async def call_api_tool(self, tool_name: str, **kwargs) -> Dict[str, Any]:
        """调用API工具

        Args:
            tool_name: 工具名称
            **kwargs: 工具参数

        Returns:
            工具执行结果字典
        """
        return await self.call_tool(tool_name, tool_type='api', **kwargs)

    async def call_mcp_tool(self, tool_name: str, **kwargs) -> Dict[str, Any]:
        """调用MCP工具

        Args:
            tool_name: 工具名称
            **kwargs: 工具参数

        Returns:
            工具执行结果字典
        """
        return await self.call_tool(f'mcp:{tool_name}', tool_type='mcp', **kwargs)

    async def get_tool_schema(self, tool_id: str) -> Optional[Dict[str, Any]]:
        """获取工具模式定义

        Args:
            tool_id: 工具ID

        Returns:
            工具模式或None
        """
        executor = self._get_tool_executor()
        return await executor.get_tool_schema(tool_id)


class PreHook(BaseHook):
    """Pre-hook基类

    在Agent处理输入之前执行
    """

    @abstractmethod
    async def execute(
        self,
        run_input: RunInput,
        session: AgentSession,
        user_id: Optional[str] = None,
        debug_mode: Optional[bool] = None,
        **kwargs
    ) -> None:
        """执行pre-hook

        Args:
            run_input: 运行输入，可修改
            session: 会话信息
            user_id: 用户ID
            debug_mode: 调试模式
            **kwargs: 其他参数

        Raises:
            InputCheckError: 输入不符合要求时抛出
        """
        pass

    async def __call__(
        self,
        run_input: RunInput,
        session: AgentSession,
        user_id: Optional[str] = None,
        debug_mode: Optional[bool] = None,
        **kwargs
    ) -> None:
        """使PreHook可调用"""
        if not self.enabled:
            logger.debug(f"PreHook {self.hook_id} 已禁用，跳过执行")
            return

        try:
            await self.execute(run_input, session, user_id, debug_mode, **kwargs)
        except InputCheckError:
            raise
        except Exception as e:
            await self.on_error(e)
            raise


class PostHook(BaseHook):
    """Post-hook基类

    在Agent生成响应之后执行
    注意：不支持流式场景
    """

    @abstractmethod
    async def execute(
        self,
        run_output: RunOutput,
        **kwargs
    ) -> None:
        """执行post-hook

        Args:
            run_output: 运行输出，可修改
            **kwargs: 其他参数

        Raises:
            OutputCheckError: 输出不符合要求时抛出
        """
        pass

    async def __call__(
        self,
        run_output: RunOutput,
        **kwargs
    ) -> None:
        """使PostHook可调用"""
        if not self.enabled:
            logger.debug(f"PostHook {self.hook_id} 已禁用，跳过执行")
            return

        try:
            await self.execute(run_output, **kwargs)
        except OutputCheckError:
            raise
        except Exception as e:
            await self.on_error(e)
            raise


@dataclass
class HookExecutionResult:
    """Hook执行结果"""
    hook_id: str
    hook_type: HookType
    status: HookStatus
    execution_time_ms: int
    error_message: Optional[str] = None
    input_snapshot: Optional[Dict] = None
    output_snapshot: Optional[Dict] = None
    routing_decision: Optional[Dict] = None
    metadata: Dict[str, Any] = field(default_factory=dict)
