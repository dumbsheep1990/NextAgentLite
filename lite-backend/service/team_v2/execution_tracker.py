"""
执行追踪器
追踪Team执行过程，记录性能指标和状态
"""
import time
import json
import asyncio
from typing import Dict, List, Optional, Any
from dataclasses import dataclass, asdict
from datetime import datetime

from core.logger import logger


@dataclass
class AgentExecutionStep:
    """Agent执行步骤记录"""
    agent_name: str
    action: str
    start_time: float
    end_time: Optional[float] = None
    duration_ms: Optional[int] = None
    status: str = "running"  # running, completed, failed, timeout
    input_data: Optional[Dict] = None
    output_data: Optional[Dict] = None
    error_message: Optional[str] = None
    retry_count: int = 0
    confidence: Optional[float] = None
    resource_usage: Optional[Dict] = None
    
    def complete(self, output_data: Optional[Dict] = None, confidence: Optional[float] = None):
        """标记步骤完成"""
        self.end_time = time.time()
        self.duration_ms = int((self.end_time - self.start_time) * 1000)
        self.status = "completed"
        if output_data:
            self.output_data = output_data
        if confidence is not None:
            self.confidence = confidence
    
    def fail(self, error_message: str):
        """标记步骤失败"""
        self.end_time = time.time()
        self.duration_ms = int((self.end_time - self.start_time) * 1000)
        self.status = "failed"
        self.error_message = error_message
    
    def timeout(self):
        """标记步骤超时"""
        self.end_time = time.time()
        self.duration_ms = int((self.end_time - self.start_time) * 1000)
        self.status = "timeout"
        self.error_message = "执行超时"


@dataclass
class TeamExecutionTrace:
    """Team执行追踪记录"""
    execution_id: str
    session_id: str
    team_name: str
    template_id: str
    query_text: str
    execution_mode: str
    start_time: float
    end_time: Optional[float] = None
    total_duration_ms: Optional[int] = None
    status: str = "running"  # running, completed, failed, timeout
    agent_steps: List[AgentExecutionStep] = None
    performance_metrics: Dict[str, Any] = None
    error_info: Optional[Dict] = None
    resource_usage: Dict[str, Any] = None
    agent_results: Dict[str, Any] = None  # 存储Agent执行结果
    
    def __post_init__(self):
        if self.agent_steps is None:
            self.agent_steps = []
        if self.performance_metrics is None:
            self.performance_metrics = {}
        if self.resource_usage is None:
            self.resource_usage = {}
        if self.agent_results is None:
            self.agent_results = {}
    
    def add_agent_step(self, agent_name: str, action: str, input_data: Optional[Dict] = None) -> AgentExecutionStep:
        """添加Agent执行步骤"""
        step = AgentExecutionStep(
            agent_name=agent_name,
            action=action,
            start_time=time.time(),
            input_data=input_data
        )
        self.agent_steps.append(step)
        return step
    
    def complete(self):
        """标记执行完成"""
        self.end_time = time.time()
        self.total_duration_ms = int((self.end_time - self.start_time) * 1000)
        self.status = "completed"
        self._calculate_performance_metrics()
    
    def fail(self, error_message: str, error_details: Optional[Dict] = None):
        """标记执行失败"""
        self.end_time = time.time()
        self.total_duration_ms = int((self.end_time - self.start_time) * 1000)
        self.status = "failed"
        self.error_info = {
            "error_message": error_message,
            "error_details": error_details or {},
            "failed_at": time.time()
        }
        self._calculate_performance_metrics()
    
    def _calculate_performance_metrics(self):
        """计算性能指标"""
        completed_steps = [step for step in self.agent_steps if step.status == "completed"]
        failed_steps = [step for step in self.agent_steps if step.status == "failed"]
        timeout_steps = [step for step in self.agent_steps if step.status == "timeout"]
        
        self.performance_metrics = {
            "total_steps": len(self.agent_steps),
            "completed_steps": len(completed_steps),
            "failed_steps": len(failed_steps),
            "timeout_steps": len(timeout_steps),
            "success_rate": len(completed_steps) / len(self.agent_steps) if self.agent_steps else 0,
            "average_step_duration": sum(step.duration_ms for step in completed_steps) / len(completed_steps) if completed_steps else 0,
            "total_duration_ms": self.total_duration_ms,
            "agent_performance": {
                step.agent_name: {
                    "duration_ms": step.duration_ms,
                    "status": step.status,
                    "confidence": step.confidence,
                    "retry_count": step.retry_count
                } for step in self.agent_steps
            }
        }


class ExecutionTracker:
    """执行追踪器"""
    
    def __init__(self):
        self._active_traces: Dict[str, TeamExecutionTrace] = {}
        self._completed_traces: Dict[str, TeamExecutionTrace] = {}
        self._max_completed_traces = 1000  # 最多保留1000个完成的追踪记录
        self._cleanup_interval = 3600  # 1小时清理一次
        self._cleanup_task: Optional[asyncio.Task] = None
        self._cleanup_started = False
    
    def start_execution(
        self,
        execution_id: str,
        session_id: str,
        team_name: str,
        template_id: str,
        query_text: str,
        execution_mode: str
    ) -> TeamExecutionTrace:
        """开始追踪执行"""
        # 确保清理任务已启动
        self._ensure_cleanup_task_started()
        
        trace = TeamExecutionTrace(
            execution_id=execution_id,
            session_id=session_id,
            team_name=team_name,
            template_id=template_id,
            query_text=query_text,
            execution_mode=execution_mode,
            start_time=time.time()
        )
        
        self._active_traces[execution_id] = trace
        logger.info(f"[EXECUTION_TRACKER] 开始追踪执行: {execution_id}")
        return trace
    
    def get_trace(self, execution_id: str) -> Optional[TeamExecutionTrace]:
        """获取执行追踪记录"""
        if execution_id in self._active_traces:
            return self._active_traces[execution_id]
        if execution_id in self._completed_traces:
            return self._completed_traces[execution_id]
        return None
    
    def add_agent_step(
        self,
        execution_id: str,
        agent_name: str,
        action: str,
        input_data: Optional[Dict] = None
    ) -> Optional[AgentExecutionStep]:
        """添加Agent执行步骤"""
        trace = self._active_traces.get(execution_id)
        if trace:
            step = trace.add_agent_step(agent_name, action, input_data)
            logger.debug(f"[EXECUTION_TRACKER] 添加Agent步骤: {execution_id} - {agent_name}:{action}")
            return step
        return None
    
    def complete_execution(self, execution_id: str):
        """完成执行追踪"""
        trace = self._active_traces.get(execution_id)
        if trace:
            trace.complete()
            self._completed_traces[execution_id] = trace
            del self._active_traces[execution_id]
            
            logger.info(f"[EXECUTION_TRACKER] 执行追踪完成: {execution_id}, 耗时: {trace.total_duration_ms}ms")
            
            # 异步保存到数据库
            asyncio.create_task(self._save_trace_to_db(trace))
    
    def fail_execution(self, execution_id: str, error_message: str, error_details: Optional[Dict] = None):
        """失败执行追踪"""
        trace = self._active_traces.get(execution_id)
        if trace:
            trace.fail(error_message, error_details)
            self._completed_traces[execution_id] = trace
            del self._active_traces[execution_id]
            
            logger.error(f"[EXECUTION_TRACKER] 执行追踪失败: {execution_id}, 错误: {error_message}")
            
            # 异步保存到数据库
            asyncio.create_task(self._save_trace_to_db(trace))
    
    async def _save_trace_to_db(self, trace: TeamExecutionTrace):
        """保存追踪记录到数据库"""
        try:
            # 准备数据
            agent_traces_json = json.dumps([asdict(step) for step in trace.agent_steps])
            performance_metrics_json = json.dumps(trace.performance_metrics)
            error_info_json = json.dumps(trace.error_info) if trace.error_info else None
            resource_usage_json = json.dumps(trace.resource_usage)
            
            # 这里应该使用MCP工具保存到数据库
            # 暂时只记录日志
            logger.info(f"[EXECUTION_TRACKER] 保存追踪记录到数据库: {trace.execution_id}")
            logger.debug(f"[EXECUTION_TRACKER] 追踪详情: {trace.performance_metrics}")
            
        except Exception as e:
            logger.error(f"[EXECUTION_TRACKER] 保存追踪记录失败: {e}")
    
    def get_execution_statistics(self) -> Dict[str, Any]:
        """获取执行统计信息"""
        total_active = len(self._active_traces)
        total_completed = len(self._completed_traces)
        
        # 统计完成的执行
        success_count = sum(1 for trace in self._completed_traces.values() if trace.status == "completed")
        failed_count = sum(1 for trace in self._completed_traces.values() if trace.status == "failed")
        
        # 平均执行时间
        completed_traces = [trace for trace in self._completed_traces.values() if trace.total_duration_ms]
        avg_duration = sum(trace.total_duration_ms for trace in completed_traces) / len(completed_traces) if completed_traces else 0
        
        return {
            "active_executions": total_active,
            "completed_executions": total_completed,
            "success_executions": success_count,
            "failed_executions": failed_count,
            "success_rate": success_count / total_completed if total_completed > 0 else 0,
            "average_duration_ms": avg_duration,
            "active_execution_ids": list(self._active_traces.keys()),
            "recent_completed": list(self._completed_traces.keys())[-10:] if self._completed_traces else []
        }
    
    def get_agent_performance_stats(self) -> Dict[str, Any]:
        """获取Agent性能统计"""
        agent_stats = {}
        
        for trace in self._completed_traces.values():
            for step in trace.agent_steps:
                agent_name = step.agent_name
                if agent_name not in agent_stats:
                    agent_stats[agent_name] = {
                        "total_calls": 0,
                        "successful_calls": 0,
                        "failed_calls": 0,
                        "timeout_calls": 0,
                        "total_duration_ms": 0,
                        "average_duration_ms": 0,
                        "total_retries": 0,
                        "confidence_scores": []
                    }
                
                stats = agent_stats[agent_name]
                stats["total_calls"] += 1
                
                if step.status == "completed":
                    stats["successful_calls"] += 1
                elif step.status == "failed":
                    stats["failed_calls"] += 1
                elif step.status == "timeout":
                    stats["timeout_calls"] += 1
                
                if step.duration_ms:
                    stats["total_duration_ms"] += step.duration_ms
                
                stats["total_retries"] += step.retry_count
                
                if step.confidence is not None:
                    stats["confidence_scores"].append(step.confidence)
        
        # 计算平均值
        for agent_name, stats in agent_stats.items():
            if stats["successful_calls"] > 0:
                stats["average_duration_ms"] = stats["total_duration_ms"] / stats["successful_calls"]
                stats["success_rate"] = stats["successful_calls"] / stats["total_calls"]
            
            if stats["confidence_scores"]:
                stats["average_confidence"] = sum(stats["confidence_scores"]) / len(stats["confidence_scores"])
                del stats["confidence_scores"]  # 删除原始数据以节省空间
        
        return agent_stats
    
    def _ensure_cleanup_task_started(self):
        """确保清理任务已启动"""
        if not self._cleanup_started:
            try:
                # 检查是否有运行的事件循环
                loop = asyncio.get_running_loop()
                if loop and not loop.is_closed():
                    self._start_cleanup_task()
                    self._cleanup_started = True
            except RuntimeError:
                # 没有运行的事件循环，稍后再启动
                logger.debug("[EXECUTION_TRACKER] 暂时无法启动清理任务，没有运行的事件循环")
    
    def _start_cleanup_task(self):
        """启动清理任务"""
        async def cleanup_loop():
            while True:
                try:
                    await asyncio.sleep(self._cleanup_interval)
                    await self._cleanup_old_traces()
                except asyncio.CancelledError:
                    break
                except Exception as e:
                    logger.error(f"[EXECUTION_TRACKER] 清理任务异常: {e}")
        
        self._cleanup_task = asyncio.create_task(cleanup_loop())
        logger.info("[EXECUTION_TRACKER] 清理任务已启动")
    
    async def _cleanup_old_traces(self):
        """清理旧的追踪记录"""
        if len(self._completed_traces) > self._max_completed_traces:
            # 按时间排序，删除最旧的记录
            sorted_traces = sorted(
                self._completed_traces.items(),
                key=lambda x: x[1].start_time
            )
            
            to_remove = len(sorted_traces) - self._max_completed_traces
            for i in range(to_remove):
                execution_id = sorted_traces[i][0]
                del self._completed_traces[execution_id]
            
            logger.info(f"[EXECUTION_TRACKER] 清理了 {to_remove} 个旧的追踪记录")


# 全局执行追踪器实例
execution_tracker = ExecutionTracker()