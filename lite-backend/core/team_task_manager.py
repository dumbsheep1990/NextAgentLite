"""
Team执行任务管理器 - 专门管理Team模式的Agent执行过程
防止Team执行过程卡死，提供超时控制、任务取消、进度监控
"""
import asyncio
import time
import uuid
from typing import Dict, Any, Optional, List, Callable, Awaitable
from enum import Enum
from dataclasses import dataclass, field
import threading
from contextlib import asynccontextmanager

from core.logger import logger
from core.task_manager import AsyncTaskManager, TaskStatus, TaskInfo, get_task_manager


class TeamExecutionStatus(Enum):
    """Team执行状态"""
    INITIALIZING = "initializing"
    RUNNING = "running"
    AGENT_EXECUTING = "agent_executing"
    KNOWLEDGE_RETRIEVING = "knowledge_retrieving"
    ANSWER_GENERATING = "answer_generating"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"
    TIMEOUT = "timeout"


@dataclass
class TeamAgentProgress:
    """单个Agent进度信息"""
    agent_id: str
    agent_name: str
    status: str = "pending"  # pending, running, completed, error
    start_time: Optional[float] = None
    end_time: Optional[float] = None
    progress_percentage: float = 0.0
    current_step: str = ""
    error_message: Optional[str] = None
    result: Any = None


@dataclass
class TeamExecutionInfo:
    """Team执行信息"""
    execution_id: str
    session_id: str
    query: str
    team_name: str
    status: TeamExecutionStatus = TeamExecutionStatus.INITIALIZING
    start_time: Optional[float] = None
    end_time: Optional[float] = None
    timeout: float = 300.0  # 默认5分钟超时
    
    # Agent执行进度
    agents_progress: Dict[str, TeamAgentProgress] = field(default_factory=dict)
    current_agent: Optional[str] = None
    completed_agents: List[str] = field(default_factory=list)
    failed_agents: List[str] = field(default_factory=list)
    
    # 结果数据
    final_answer: Optional[str] = None
    member_calls: List[Dict[str, Any]] = field(default_factory=list)
    team_decisions: List[Dict[str, Any]] = field(default_factory=list)
    knowledge_sources: List[Dict[str, Any]] = field(default_factory=list)
    metadata: Dict[str, Any] = field(default_factory=dict)
    
    # 错误信息
    error_message: Optional[str] = None
    last_error_agent: Optional[str] = None
    
    @property
    def duration(self) -> Optional[float]:
        """获取执行时间"""
        if self.start_time is None:
            return None
        end = self.end_time or time.time()
        return end - self.start_time
    
    @property
    def progress_percentage(self) -> float:
        """计算整体进度百分比"""
        if not self.agents_progress:
            return 0.0
        
        total_agents = len(self.agents_progress)
        completed_weight = len(self.completed_agents) * 100
        
        # 当前正在执行的Agent的进度
        current_weight = 0.0
        if self.current_agent and self.current_agent in self.agents_progress:
            current_progress = self.agents_progress[self.current_agent].progress_percentage
            current_weight = current_progress
        
        return min(100.0, (completed_weight + current_weight) / total_agents)


class TeamTaskManager:
    """
    Team任务管理器
    
    专门管理Team模式的执行过程，包括：
    1. Agent执行监控
    2. 超时控制
    3. 任务取消
    4. 进度跟踪
    5. 错误恢复
    """
    
    def __init__(self):
        self.base_task_manager = get_task_manager()
        self.team_executions: Dict[str, TeamExecutionInfo] = {}
        self._execution_tasks: Dict[str, asyncio.Task] = {}
        self._lock = asyncio.Lock()
        
        logger.info("TeamTaskManager initialized")
    
    async def start_team_execution(
        self,
        session_id: str,
        query: str,
        team_name: str,
        team_service,  # enhanced_team_service实例
        execution_params: Optional[Dict[str, Any]] = None,
        timeout: float = 300.0,  # 5分钟默认超时
        execution_id: Optional[str] = None
    ) -> str:
        """
        启动Team执行任务
        
        Args:
            session_id: 会话ID
            query: 查询问题
            team_name: 团队名称
            team_service: 团队服务实例
            execution_params: 执行参数
            timeout: 超时时间(秒)
            execution_id: 自定义执行ID
            
        Returns:
            str: 执行ID
        """
        if execution_id is None:
            execution_id = f"team_{uuid.uuid4().hex[:12]}"
        
        # 创建执行信息
        execution_info = TeamExecutionInfo(
            execution_id=execution_id,
            session_id=session_id,
            query=query,
            team_name=team_name,
            timeout=timeout,
            metadata=execution_params or {}
        )
        
        async with self._lock:
            self.team_executions[execution_id] = execution_info
        
        # 在基础任务管理器中创建任务
        task_id = await self.base_task_manager.submit_async_task(
            self._execute_team_task,
            execution_info,
            team_service,
            task_name=f"team_execution_{team_name}",
            timeout=timeout,
            task_id=execution_id,
            session_id=session_id,  # 传递session_id参数
            metadata={
                "type": "team_execution",
                "session_id": session_id,
                "team_name": team_name,
                "query": query[:100]  # 截断长查询
            }
        )
        
        logger.info(f"Started team execution: {execution_id} for session: {session_id}")
        return execution_id
    
    async def _execute_team_task(
        self,
        execution_info: TeamExecutionInfo,
        team_service
    ):
        """执行Team任务的内部方法"""
        execution_id = execution_info.execution_id
        
        try:
            execution_info.status = TeamExecutionStatus.RUNNING
            execution_info.start_time = time.time()
            
            logger.info(f"[TEAM_TASK] 开始执行Team任务: {execution_id}")
            
            # 预定义的Agent列表（根据实际团队配置）
            expected_agents = [
                "qa_coordinator_v2",
                "question_decomposition_agent", 
                "translation_agent",
                "knowledge_retrieval_agent",
                "knowledge_graph_agent",
                "summary_answer_agent"
            ]
            
            # 初始化Agent进度跟踪
            for agent_id in expected_agents:
                execution_info.agents_progress[agent_id] = TeamAgentProgress(
                    agent_id=agent_id,
                    agent_name=self._get_agent_display_name(agent_id)
                )
            
            # 创建一个可取消的任务来执行实际的Team查询
            execution_task = asyncio.create_task(
                self._wrapped_team_execution(execution_info, team_service)
            )
            
            # 存储任务引用以便取消
            self._execution_tasks[execution_id] = execution_task
            
            # 等待任务完成
            result = await execution_task
            
            # 处理结果
            execution_info.status = TeamExecutionStatus.COMPLETED
            execution_info.end_time = time.time()
            execution_info.final_answer = result.content if hasattr(result, 'content') else str(result)
            
            if hasattr(result, 'member_calls'):
                execution_info.member_calls = result.member_calls
            if hasattr(result, 'team_decisions') and result.team_decisions:
                execution_info.team_decisions = result.team_decisions
            if hasattr(result, 'knowledge_sources') and result.knowledge_sources:
                execution_info.knowledge_sources = result.knowledge_sources
            
            logger.info(f"[TEAM_TASK] Team任务执行完成: {execution_id}, 耗时: {execution_info.duration:.2f}s")
            return result
            
        except asyncio.CancelledError:
            execution_info.status = TeamExecutionStatus.CANCELLED
            execution_info.end_time = time.time()
            execution_info.error_message = "任务被用户取消"
            
            logger.info(f"[TEAM_TASK] Team任务被取消: {execution_id}")
            raise
            
        except Exception as e:
            execution_info.status = TeamExecutionStatus.FAILED
            execution_info.end_time = time.time()
            execution_info.error_message = str(e)
            
            logger.error(f"[TEAM_TASK] Team任务执行失败: {execution_id}, 错误: {e}")
            raise
            
        finally:
            # 清理任务引用
            self._execution_tasks.pop(execution_id, None)
    
    async def _wrapped_team_execution(self, execution_info: TeamExecutionInfo, team_service):
        """包装的Team执行，带进度监控"""
        
        # 创建进度监控回调
        def progress_callback(agent_id: str, status: str, progress: float = 0.0, step: str = "", result: Any = None):
            """进度回调函数"""
            if agent_id in execution_info.agents_progress:
                agent_progress = execution_info.agents_progress[agent_id]
                agent_progress.status = status
                agent_progress.progress_percentage = progress
                agent_progress.current_step = step
                
                if status == "running":
                    agent_progress.start_time = time.time()
                    execution_info.current_agent = agent_id
                    execution_info.status = TeamExecutionStatus.AGENT_EXECUTING
                    
                elif status == "completed":
                    agent_progress.end_time = time.time()
                    agent_progress.result = result
                    agent_progress.progress_percentage = 100.0
                    
                    if agent_id not in execution_info.completed_agents:
                        execution_info.completed_agents.append(agent_id)
                    
                    # 检查是否是知识检索阶段
                    if "knowledge" in agent_id.lower() or "retrieval" in agent_id.lower():
                        execution_info.status = TeamExecutionStatus.KNOWLEDGE_RETRIEVING
                    elif "summary" in agent_id.lower() or "answer" in agent_id.lower():
                        execution_info.status = TeamExecutionStatus.ANSWER_GENERATING
                        
                elif status in ["failed", "error"]:  # 支持两种错误状态
                    agent_progress.end_time = time.time()
                    agent_progress.error_message = step  # step字段用来传递错误信息
                    
                    if agent_id not in execution_info.failed_agents:
                        execution_info.failed_agents.append(agent_id)
                    
                    execution_info.last_error_agent = agent_id
                
                logger.debug(f"[TEAM_PROGRESS] {agent_id}: {status} ({progress:.1f}%) - {step}")
        
        # 使用原有的team service执行，但是需要拦截和监控执行过程
        # 这里我们使用stream模式来监控进度
        try:
            result = await team_service.execute_team_query(
                team_name=execution_info.team_name,
                query=execution_info.query,
                session_id=execution_info.session_id,
                stream=False,  # 使用非流式以便获取完整结果
                enable_monitoring=True,
                knowledge_retrieval_mode="all"
            )
            
            # 模拟进度更新（因为原service可能不支持回调）
            # 在实际集成时，需要修改enhanced_team_service来支持进度回调
            for i, agent_id in enumerate(execution_info.agents_progress.keys()):
                progress_callback(agent_id, "completed", 100.0, "执行完成")
                await asyncio.sleep(0.1)  # 避免过快更新
            
            return result
            
        except Exception as e:
            # 记录失败的Agent (使用error状态以符合数据库约束)
            if execution_info.current_agent:
                progress_callback(execution_info.current_agent, "error", 0.0, str(e))
            raise
    
    def _get_agent_display_name(self, agent_id: str) -> str:
        """获取Agent显示名称"""
        agent_names = {
            "qa_coordinator_v2": "问答协调器",
            "question_decomposition_agent": "问题分解智能体",
            "translation_agent": "翻译智能体", 
            "knowledge_retrieval_agent": "知识检索智能体",
            "knowledge_graph_agent": "知识图谱智能体",
            "summary_answer_agent": "答案总结智能体"
        }
        return agent_names.get(agent_id, agent_id)
    
    async def cancel_team_execution(self, execution_id: str) -> bool:
        """取消Team执行"""
        try:
            # 取消基础任务管理器中的任务
            success = await self.base_task_manager.cancel_task(execution_id)
            
            # 取消执行任务
            if execution_id in self._execution_tasks:
                execution_task = self._execution_tasks[execution_id]
                execution_task.cancel()
            
            # 更新执行状态
            if execution_id in self.team_executions:
                execution_info = self.team_executions[execution_id]
                execution_info.status = TeamExecutionStatus.CANCELLED
                execution_info.end_time = time.time()
                execution_info.error_message = "任务被用户取消"
            
            logger.info(f"[TEAM_TASK] Team执行已取消: {execution_id}")
            return success
            
        except Exception as e:
            logger.error(f"[TEAM_TASK] 取消Team执行失败: {execution_id}, 错误: {e}")
            return False
    
    def get_execution_status(self, execution_id: str) -> Optional[TeamExecutionInfo]:
        """获取执行状态"""
        return self.team_executions.get(execution_id)
    
    def get_session_executions(self, session_id: str) -> List[TeamExecutionInfo]:
        """获取会话的所有执行"""
        return [
            execution for execution in self.team_executions.values()
            if execution.session_id == session_id
        ]
    
    def get_running_executions(self) -> List[TeamExecutionInfo]:
        """获取运行中的执行"""
        return [
            execution for execution in self.team_executions.values()
            if execution.status in [
                TeamExecutionStatus.INITIALIZING,
                TeamExecutionStatus.RUNNING,
                TeamExecutionStatus.AGENT_EXECUTING,
                TeamExecutionStatus.KNOWLEDGE_RETRIEVING,
                TeamExecutionStatus.ANSWER_GENERATING
            ]
        ]
    
    async def cancel_session_executions(self, session_id: str) -> int:
        """取消会话的所有运行中执行"""
        session_executions = self.get_session_executions(session_id)
        cancelled_count = 0
        
        for execution in session_executions:
            if execution.status in [
                TeamExecutionStatus.INITIALIZING,
                TeamExecutionStatus.RUNNING, 
                TeamExecutionStatus.AGENT_EXECUTING,
                TeamExecutionStatus.KNOWLEDGE_RETRIEVING,
                TeamExecutionStatus.ANSWER_GENERATING
            ]:
                success = await self.cancel_team_execution(execution.execution_id)
                if success:
                    cancelled_count += 1
        
        logger.info(f"[TEAM_TASK] 已取消会话 {session_id} 的 {cancelled_count} 个执行任务")
        return cancelled_count
    
    def cleanup_old_executions(self, max_age_hours: int = 2):
        """清理旧的执行记录"""
        current_time = time.time()
        max_age_seconds = max_age_hours * 3600
        
        executions_to_remove = []
        for execution_id, execution in self.team_executions.items():
            if (execution.end_time and 
                current_time - execution.end_time > max_age_seconds and
                execution.status in [
                    TeamExecutionStatus.COMPLETED,
                    TeamExecutionStatus.FAILED,
                    TeamExecutionStatus.CANCELLED,
                    TeamExecutionStatus.TIMEOUT
                ]):
                executions_to_remove.append(execution_id)
        
        for execution_id in executions_to_remove:
            del self.team_executions[execution_id]
        
        if executions_to_remove:
            logger.info(f"[TEAM_TASK] 清理了 {len(executions_to_remove)} 个过期的Team执行记录")
        
        return len(executions_to_remove)
    
    def get_stats(self) -> Dict[str, Any]:
        """获取统计信息"""
        status_counts = {}
        for status in TeamExecutionStatus:
            status_counts[status.value] = len([
                e for e in self.team_executions.values() 
                if e.status == status
            ])
        
        running_count = len(self.get_running_executions())
        
        return {
            "total_executions": len(self.team_executions),
            "running_executions": running_count,
            "status_distribution": status_counts,
            "base_task_stats": self.base_task_manager.get_stats()
        }


# 全局Team任务管理器实例
_team_task_manager: Optional[TeamTaskManager] = None


def get_team_task_manager() -> TeamTaskManager:
    """获取全局Team任务管理器实例"""
    global _team_task_manager
    if _team_task_manager is None:
        _team_task_manager = TeamTaskManager()
    return _team_task_manager


@asynccontextmanager
async def managed_team_execution(
    session_id: str,
    query: str, 
    team_name: str,
    team_service,
    timeout: float = 300.0,
    execution_params: Optional[Dict[str, Any]] = None
):
    """
    Team执行的上下文管理器
    
    使用方式:
    async with managed_team_execution(session_id, query, team_name, team_service) as execution_id:
        # 监控执行状态
        status = get_team_task_manager().get_execution_status(execution_id)
        return status
    """
    manager = get_team_task_manager()
    
    execution_id = await manager.start_team_execution(
        session_id=session_id,
        query=query,
        team_name=team_name, 
        team_service=team_service,
        timeout=timeout,
        execution_params=execution_params
    )
    
    try:
        yield execution_id
    finally:
        # 确保执行完成或被取消
        execution_info = manager.get_execution_status(execution_id)
        if execution_info and execution_info.status in [
            TeamExecutionStatus.INITIALIZING,
            TeamExecutionStatus.RUNNING,
            TeamExecutionStatus.AGENT_EXECUTING,
            TeamExecutionStatus.KNOWLEDGE_RETRIEVING,
            TeamExecutionStatus.ANSWER_GENERATING
        ]:
            logger.info(f"[TEAM_TASK] 上下文结束，取消未完成的执行: {execution_id}")
            await manager.cancel_team_execution(execution_id)