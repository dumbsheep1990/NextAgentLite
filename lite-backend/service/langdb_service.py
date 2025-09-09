"""
LangDB服务 - 用于监控和记录Agno Team的执行数据
"""
import asyncio
import json
import time
from datetime import datetime
from typing import Dict, List, Optional, Any
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from db.database import get_db_session
from core.logger import logger
from models.conversation import ConversationMessage


class LangDBService:
    """LangDB监控服务"""
    
    def __init__(self):
        self.metrics_buffer: List[Dict[str, Any]] = []
        self.buffer_size = 100
        self.flush_interval = 30  # 30秒刷新一次
        
    async def record_execution_start(self, execution_id: str, team_name: str, query: str, session_id: str) -> None:
        """记录执行开始"""
        try:
            async with get_db_session() as session:
                # 插入执行记录
                await session.execute(text("""
                    INSERT INTO team_executions 
                    (execution_id, session_id, team_name, query, status, start_time, metadata)
                    VALUES (:execution_id, :session_id, :team_name, :query, 'running', NOW(), :metadata)
                """), {
                    'execution_id': execution_id,
                    'session_id': session_id,
                    'team_name': team_name,
                    'query': query,
                    'metadata': json.dumps({
                        'start_time': datetime.now().isoformat(),
                        'query_length': len(query)
                    })
                })
                await session.commit()
                
                # 记录指标
                await self._record_metric(
                    session_id=session_id,
                    metric_type='execution_start',
                    metric_name='Execution Started',
                    metric_value={
                        'execution_id': execution_id,
                        'team_name': team_name,
                        'query_length': len(query)
                    },
                    metadata={'execution_id': execution_id}
                )
                
                logger.info(f"LangDB: 记录执行开始 - {execution_id}")
                
        except Exception as e:
            logger.error(f"LangDB: 记录执行开始失败 - {e}")
    
    async def record_execution_end(self, execution_id: str, status: str, result_content: str = None, 
                                 error_message: str = None, duration_ms: int = None) -> None:
        """记录执行结束"""
        try:
            async with get_db_session() as session:
                # 更新执行记录
                await session.execute(text("""
                    UPDATE team_executions 
                    SET status = :status, end_time = NOW(), duration_ms = :duration_ms,
                        result_content = :result_content, error_message = :error_message
                    WHERE execution_id = :execution_id
                """), {
                    'status': status,
                    'duration_ms': duration_ms,
                    'result_content': result_content,
                    'error_message': error_message,
                    'execution_id': execution_id
                })
                await session.commit()
                
                # 记录指标
                await self._record_metric(
                    session_id=execution_id,  # 使用execution_id作为session_id
                    metric_type='execution_end',
                    metric_name='Execution Completed',
                    metric_value={
                        'status': status,
                        'duration_ms': duration_ms,
                        'result_length': len(result_content) if result_content else 0,
                        'has_error': bool(error_message)
                    },
                    metadata={'execution_id': execution_id}
                )
                
                logger.info(f"LangDB: 记录执行结束 - {execution_id}, 状态: {status}")
                
        except Exception as e:
            logger.error(f"LangDB: 记录执行结束失败 - {e}")
    
    async def record_member_call(self, execution_id: str, member_id: str, member_name: str, 
                               action: str, input_data: Dict[str, Any], output_data: Dict[str, Any],
                               status: str, duration_ms: int = None, error_message: str = None) -> None:
        """记录成员调用"""
        try:
            async with get_db_session() as session:
                # 插入执行步骤记录
                step_id = f"{execution_id}_{member_id}_{int(time.time() * 1000)}"
                await session.execute(text("""
                    INSERT INTO team_execution_steps 
                    (execution_id, step_id, member_id, member_name, action, input_data, output_data,
                     status, start_time, end_time, duration_ms, error_message)
                    VALUES (:execution_id, :step_id, :member_id, :member_name, :action, :input_data, :output_data,
                           :status, NOW(), NOW(), :duration_ms, :error_message)
                """), {
                    'execution_id': execution_id,
                    'step_id': step_id,
                    'member_id': member_id,
                    'member_name': member_name,
                    'action': action,
                    'input_data': json.dumps(input_data),
                    'output_data': json.dumps(output_data),
                    'status': status,
                    'duration_ms': duration_ms,
                    'error_message': error_message
                })
                await session.commit()
                
                # 记录指标
                await self._record_metric(
                    session_id=execution_id,
                    metric_type='member_performance',
                    metric_name=f'{member_name} Performance',
                    metric_value={
                        'member_id': member_id,
                        'action': action,
                        'status': status,
                        'duration_ms': duration_ms,
                        'input_size': len(json.dumps(input_data)),
                        'output_size': len(json.dumps(output_data))
                    },
                    metadata={
                        'execution_id': execution_id,
                        'step_id': step_id,
                        'member_id': member_id
                    }
                )
                
                logger.info(f"LangDB: 记录成员调用 - {member_id}, 动作: {action}, 状态: {status}")
                
        except Exception as e:
            logger.error(f"LangDB: 记录成员调用失败 - {e}")
    
    async def record_coordination_info(self, execution_id: str, coordinator_id: str, 
                                     coordination_mode: str, shared_state: Dict[str, Any],
                                     routing_decisions: List[Dict[str, Any]], 
                                     performance_metrics: Dict[str, Any]) -> None:
        """记录协调信息"""
        try:
            async with get_db_session() as session:
                # 记录指标
                await self._record_metric(
                    session_id=execution_id,
                    metric_type='coordination',
                    metric_name='Coordination Info',
                    metric_value={
                        'coordinator_id': coordinator_id,
                        'coordination_mode': coordination_mode,
                        'shared_state_size': len(json.dumps(shared_state)),
                        'routing_decisions_count': len(routing_decisions),
                        'performance_metrics': performance_metrics
                    },
                    metadata={'execution_id': execution_id}
                )
                
                logger.info(f"LangDB: 记录协调信息 - {execution_id}")
                
        except Exception as e:
            logger.error(f"LangDB: 记录协调信息失败 - {e}")
    
    async def record_structured_output(self, execution_id: str, output_type: str, 
                                     output_data: Dict[str, Any], confidence: float) -> None:
        """记录结构化输出"""
        try:
            await self._record_metric(
                session_id=execution_id,
                metric_type='structured_output',
                metric_name='Structured Output',
                metric_value={
                    'output_type': output_type,
                    'confidence': confidence,
                    'data_size': len(json.dumps(output_data))
                },
                metadata={'execution_id': execution_id}
            )
            
            logger.info(f"LangDB: 记录结构化输出 - {execution_id}, 类型: {output_type}")
            
        except Exception as e:
            logger.error(f"LangDB: 记录结构化输出失败 - {e}")
    
    async def _record_metric(self, session_id: str, metric_type: str, metric_name: str,
                           metric_value: Dict[str, Any], metadata: Optional[Dict[str, Any]] = None) -> None:
        """记录指标到数据库"""
        try:
            async with get_db_session() as session:
                await session.execute(text("""
                    INSERT INTO langdb_metrics 
                    (session_id, metric_type, metric_name, metric_value, timestamp, metadata)
                    VALUES (:session_id, :metric_type, :metric_name, :metric_value, NOW(), :metadata)
                """), {
                    'session_id': session_id,
                    'metric_type': metric_type,
                    'metric_name': metric_name,
                    'metric_value': json.dumps(metric_value),
                    'metadata': json.dumps(metadata) if metadata else None
                })
                await session.commit()
                
        except Exception as e:
            logger.error(f"LangDB: 记录指标失败 - {e}")
    
    async def get_execution_metrics(self, execution_id: str) -> List[Dict[str, Any]]:
        """获取执行指标"""
        try:
            async with get_db_session() as session:
                result = await session.execute(text("""
                    SELECT * FROM langdb_metrics 
                    WHERE metadata->>'execution_id' = :execution_id
                    ORDER BY timestamp DESC
                """), {'execution_id': execution_id})
                
                metrics = []
                for row in result.fetchall():
                    metrics.append({
                        'id': row[0],
                        'session_id': row[1],
                        'metric_type': row[2],
                        'metric_name': row[3],
                        'metric_value': json.loads(row[4]),
                        'timestamp': row[5].isoformat() if row[5] else None,
                        'metadata': json.loads(row[6]) if row[6] else None
                    })
                
                return metrics
                
        except Exception as e:
            logger.error(f"LangDB: 获取执行指标失败 - {e}")
            return []
    
    async def get_team_stats(self, team_name: str = None) -> List[Dict[str, Any]]:
        """获取团队统计"""
        try:
            async with get_db_session() as session:
                if team_name:
                    result = await session.execute(text("""
                        SELECT * FROM team_execution_stats 
                        WHERE team_name = :team_name
                    """), {'team_name': team_name})
                else:
                    result = await session.execute(text("""
                        SELECT * FROM team_execution_stats
                    """))
                
                stats = []
                for row in result.fetchall():
                    stats.append({
                        'team_name': row[0],
                        'total_executions': row[1],
                        'successful_executions': row[2],
                        'failed_executions': row[3],
                        'avg_duration_ms': row[4],
                        'last_execution_time': row[5].isoformat() if row[5] else None
                    })
                
                return stats
                
        except Exception as e:
            logger.error(f"LangDB: 获取团队统计失败 - {e}")
            return []
    
    async def get_member_performance(self, member_id: str = None) -> List[Dict[str, Any]]:
        """获取成员性能统计"""
        try:
            async with get_db_session() as session:
                if member_id:
                    result = await session.execute(text("""
                        SELECT * FROM team_member_performance 
                        WHERE member_id = :member_id
                    """), {'member_id': member_id})
                else:
                    result = await session.execute(text("""
                        SELECT * FROM team_member_performance
                    """))
                
                performance = []
                for row in result.fetchall():
                    performance.append({
                        'member_id': row[0],
                        'member_name': row[1],
                        'total_steps': row[2],
                        'successful_steps': row[3],
                        'failed_steps': row[4],
                        'avg_duration_ms': row[5],
                        'last_step_time': row[6].isoformat() if row[6] else None
                    })
                
                return performance
                
        except Exception as e:
            logger.error(f"LangDB: 获取成员性能统计失败 - {e}")
            return []
    
    async def get_recent_metrics(self, hours: int = 24) -> List[Dict[str, Any]]:
        """获取最近的指标数据"""
        try:
            async with get_db_session() as session:
                result = await session.execute(text("""
                    SELECT * FROM langdb_metrics 
                    WHERE timestamp >= NOW() - INTERVAL ':hours hours'
                    ORDER BY timestamp DESC
                """), {'hours': hours})
                
                metrics = []
                for row in result.fetchall():
                    metrics.append({
                        'id': row[0],
                        'session_id': row[1],
                        'metric_type': row[2],
                        'metric_name': row[3],
                        'metric_value': json.loads(row[4]),
                        'timestamp': row[5].isoformat() if row[5] else None,
                        'metadata': json.loads(row[6]) if row[6] else None
                    })
                
                return metrics
                
        except Exception as e:
            logger.error(f"LangDB: 获取最近指标失败 - {e}")
            return []
    
    async def cleanup_old_metrics(self, days: int = 30) -> int:
        """清理旧的指标数据"""
        try:
            async with get_db_session() as session:
                result = await session.execute(text("""
                    DELETE FROM langdb_metrics 
                    WHERE timestamp < NOW() - INTERVAL ':days days'
                """), {'days': days})
                
                deleted_count = result.rowcount
                await session.commit()
                
                logger.info(f"LangDB: 清理了 {deleted_count} 条旧指标数据")
                return deleted_count
                
        except Exception as e:
            logger.error(f"LangDB: 清理旧指标失败 - {e}")
            return 0
    
    async def start_monitoring(self, session_id: str, team_config: Dict[str, Any]) -> bool:
        """启动监控会话"""
        try:
            # 记录监控开始
            await self._record_metric(
                session_id=session_id,
                metric_type='monitoring_start',
                metric_name='Monitoring Started',
                metric_value={
                    'team_config': team_config,
                    'start_time': datetime.now().isoformat()
                },
                metadata={'session_id': session_id}
            )
            
            logger.info(f"LangDB: 启动监控会话 - {session_id}")
            return True
            
        except Exception as e:
            logger.error(f"LangDB: 启动监控失败 - {e}")
            return False
    
    async def stop_monitoring(self, session_id: str) -> bool:
        """停止监控会话"""
        try:
            # 记录监控结束
            await self._record_metric(
                session_id=session_id,
                metric_type='monitoring_stop',
                metric_name='Monitoring Stopped',
                metric_value={
                    'stop_time': datetime.now().isoformat()
                },
                metadata={'session_id': session_id}
            )
            
            logger.info(f"LangDB: 停止监控会话 - {session_id}")
            return True
            
        except Exception as e:
            logger.error(f"LangDB: 停止监控失败 - {e}")
            return False
    
    async def get_session_metrics(self, session_id: str) -> Optional[Dict[str, Any]]:
        """获取会话指标"""
        try:
            async with get_db_session() as session:
                # 获取会话的所有指标
                result = await session.execute(text("""
                    SELECT * FROM langdb_metrics 
                    WHERE session_id = :session_id
                    ORDER BY timestamp DESC
                """), {'session_id': session_id})
                
                metrics = []
                for row in result.fetchall():
                    metrics.append({
                        'id': row[0],
                        'session_id': row[1],
                        'metric_type': row[2],
                        'metric_name': row[3],
                        'metric_value': json.loads(row[4]),
                        'timestamp': row[5].isoformat() if row[5] else None,
                        'metadata': json.loads(row[6]) if row[6] else None
                    })
                
                # 获取执行历史
                history_result = await session.execute(text("""
                    SELECT * FROM team_executions 
                    WHERE session_id = :session_id
                    ORDER BY start_time DESC
                """), {'session_id': session_id})
                
                execution_history = []
                for row in history_result.fetchall():
                    execution_history.append({
                        'execution_id': row[0],
                        'team_name': row[2],
                        'status': row[4],
                        'start_time': row[5].isoformat() if row[5] else None,
                        'end_time': row[6].isoformat() if row[6] else None,
                        'duration_ms': row[7],
                        'query': row[3]
                    })
                
                return {
                    'metrics': metrics,
                    'execution_history': execution_history,
                    'member_performance': {}  # 可以进一步实现
                }
                
        except Exception as e:
            logger.error(f"LangDB: 获取会话指标失败 - {e}")
            return None
    
    async def get_execution_history(self, session_id: str, limit: int = 50) -> List[Dict[str, Any]]:
        """获取执行历史"""
        try:
            async with get_db_session() as session:
                result = await session.execute(text("""
                    SELECT * FROM team_executions 
                    WHERE session_id = :session_id
                    ORDER BY start_time DESC
                    LIMIT :limit
                """), {'session_id': session_id, 'limit': limit})
                
                history = []
                for row in result.fetchall():
                    history.append({
                        'execution_id': row[0],
                        'team_name': row[2],
                        'status': row[4],
                        'start_time': row[5].isoformat() if row[5] else None,
                        'end_time': row[6].isoformat() if row[6] else None,
                        'duration_ms': row[7],
                        'query': row[3]
                    })
                
                return history
                
        except Exception as e:
            logger.error(f"LangDB: 获取执行历史失败 - {e}")
            return []
    
    async def record_execution_completion(self, execution_id: str, team_name: str, status: str, 
                                        duration: float, member_calls: List[Dict[str, Any]] = None,
                                        structured_output: Dict[str, Any] = None,
                                        coordination_info: Dict[str, Any] = None,
                                        error_message: str = None) -> None:
        """记录执行完成"""
        try:
            # 记录执行结束
            await self.record_execution_end(
                execution_id=execution_id,
                status=status,
                result_content=str(structured_output) if structured_output else None,
                error_message=error_message,
                duration_ms=int(duration * 1000)
            )
            
            # 记录成员调用
            if member_calls:
                for call in member_calls:
                    await self.record_member_call(
                        execution_id=execution_id,
                        member_id=call.get('memberId', 'unknown'),
                        member_name=call.get('memberName', 'Unknown'),
                        action=call.get('action', 'unknown'),
                        input_data=call.get('input', {}),
                        output_data=call.get('output', {}),
                        status=call.get('status', 'completed'),
                        duration_ms=call.get('durationMs', 0),
                        error_message=call.get('errorMessage')
                    )
            
            # 记录结构化输出
            if structured_output:
                await self.record_structured_output(
                    execution_id=execution_id,
                    output_type=structured_output.get('type', 'unknown'),
                    output_data=structured_output.get('data', {}),
                    confidence=structured_output.get('confidence', 0.0)
                )
            
            # 记录协调信息
            if coordination_info:
                await self.record_coordination_info(
                    execution_id=execution_id,
                    coordinator_id=coordination_info.get('coordinatorId', 'unknown'),
                    coordination_mode=coordination_info.get('coordinationMode', 'unknown'),
                    shared_state=coordination_info.get('sharedState', {}),
                    routing_decisions=coordination_info.get('routingDecisions', []),
                    performance_metrics=coordination_info.get('performanceMetrics', {})
                )
            
            logger.info(f"LangDB: 记录执行完成 - {execution_id}")
            
        except Exception as e:
            logger.error(f"LangDB: 记录执行完成失败 - {e}")
    
    async def get_overall_stats(self) -> Dict[str, Any]:
        """获取总体统计"""
        try:
            async with get_db_session() as session:
                # 获取执行统计
                result = await session.execute(text("""
                    SELECT 
                        COUNT(*) as total_executions,
                        COUNT(CASE WHEN status = 'success' THEN 1 END) as successful_executions,
                        COUNT(CASE WHEN status = 'error' THEN 1 END) as failed_executions,
                        AVG(duration_ms) as average_duration
                    FROM team_executions
                """))
                
                row = result.fetchone()
                if row:
                    return {
                        'total_executions': row[0] or 0,
                        'successful_executions': row[1] or 0,
                        'failed_executions': row[2] or 0,
                        'average_duration': float(row[3]) if row[3] else 0
                    }
                
                return {
                    'total_executions': 0,
                    'successful_executions': 0,
                    'failed_executions': 0,
                    'average_duration': 0
                }
                
        except Exception as e:
            logger.error(f"LangDB: 获取总体统计失败 - {e}")
            return {
                'total_executions': 0,
                'successful_executions': 0,
                'failed_executions': 0,
                'average_duration': 0
            } 