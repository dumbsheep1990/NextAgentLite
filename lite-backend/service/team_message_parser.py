"""
Team消息解析服务 - 解析和处理Agno Team的消息格式
支持消息格式转换、结构化输出解析、监控数据提取
"""
import json
import time
import re
from typing import Dict, List, Optional, Any, Union
from dataclasses import dataclass, asdict
from datetime import datetime

from core.logger import logger
from models.conversation import ConversationMessage


@dataclass
class TeamMemberCall:
    """Team成员调用数据结构"""
    memberId: str
    memberName: str
    role: str
    action: str
    callType: str  # 'tool' | 'reasoning' | 'coordination'
    input: Any
    output: Any
    startTime: int
    endTime: int
    durationMs: int
    status: str  # 'pending' | 'running' | 'completed' | 'error'
    confidence: Optional[float] = None
    errorMessage: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None


@dataclass
class TeamStructuredOutput:
    """Team结构化输出数据结构"""
    type: str
    data: Any
    confidence: float
    sources: List[str]
    metadata: Optional[Dict[str, Any]] = None


@dataclass
class TeamCoordinationInfo:
    """Team协调信息数据结构"""
    coordinatorId: str
    coordinationMode: str
    coordinationStrategy: str
    memberAssignments: Dict[str, List[str]]
    executionOrder: List[str]
    performanceMetrics: Dict[str, Any]
    routingDecisions: List[Dict[str, Any]]
    sharedState: Dict[str, Any]


@dataclass
class TeamMessageData:
    """Team消息数据结构"""
    teamId: str
    teamName: str
    teamMode: str
    executionId: str
    memberCalls: List[TeamMemberCall]
    structuredOutput: Optional[TeamStructuredOutput] = None
    coordinationInfo: Optional[TeamCoordinationInfo] = None
    processingTime: Optional[float] = None
    totalSteps: int = 0
    completedSteps: int = 0
    failedSteps: int = 0


class TeamMessageParser:
    """Team消息解析器"""
    
    def __init__(self):
        self.patterns = {
            'member_call': r'Member\s+(\w+)\s+\(([^)]+)\)\s+executed\s+(\w+)\s+in\s+([\d.]+)ms',
            'tool_call': r'Tool\s+(\w+)\s+called\s+with\s+([^,]+)',
            'coordination': r'Coordinator\s+(\w+)\s+assigned\s+(\w+)\s+to\s+(\w+)',
            'structured_output': r'Structured\s+output\s+type:\s+(\w+),\s+confidence:\s+([\d.]+)',
        }
    
    def parse_team_message(self, content: str, metadata: Dict[str, Any] = None) -> TeamMessageData:
        """解析Team消息内容"""
        try:
            # 提取基本信息
            team_info = self._extract_team_info(content, metadata)
            
            # 解析成员调用
            member_calls = self._parse_member_calls(content)
            
            # 解析结构化输出
            structured_output = self._parse_structured_output(content)
            
            # 解析协调信息
            coordination_info = self._parse_coordination_info(content)
            
            # 计算统计信息
            total_steps = len(member_calls)
            completed_steps = len([call for call in member_calls if call.status == 'completed'])
            failed_steps = len([call for call in member_calls if call.status == 'error'])
            
            return TeamMessageData(
                teamId=team_info.get('teamId', 'unknown'),
                teamName=team_info.get('teamName', 'Unknown Team'),
                teamMode=team_info.get('teamMode', 'coordinate'),
                executionId=team_info.get('executionId', f'exec_{int(time.time())}'),
                memberCalls=member_calls,
                structuredOutput=structured_output,
                coordinationInfo=coordination_info,
                processingTime=team_info.get('processingTime'),
                totalSteps=total_steps,
                completedSteps=completed_steps,
                failedSteps=failed_steps
            )
            
        except Exception as e:
            logger.error(f"解析Team消息失败: {e}")
            return self._create_fallback_message_data()
    
    def _extract_team_info(self, content: str, metadata: Dict[str, Any] = None) -> Dict[str, Any]:
        """提取Team基本信息"""
        team_info = {
            'teamId': 'unknown',
            'teamName': 'Unknown Team',
            'teamMode': 'coordinate',
            'executionId': f'exec_{int(time.time())}',
            'processingTime': None
        }
        
        # 从metadata中提取信息
        if metadata:
            team_info.update({
                'teamId': metadata.get('teamId', team_info['teamId']),
                'teamName': metadata.get('teamName', team_info['teamName']),
                'teamMode': metadata.get('teamMode', team_info['teamMode']),
                'executionId': metadata.get('executionId', team_info['executionId']),
                'processingTime': metadata.get('processingTime', team_info['processingTime'])
            })
        
        # 从内容中提取信息
        if 'Team:' in content:
            team_match = re.search(r'Team:\s*([^\n]+)', content)
            if team_match:
                team_info['teamName'] = team_match.group(1).strip()
        
        if 'Mode:' in content:
            mode_match = re.search(r'Mode:\s*([^\n]+)', content)
            if mode_match:
                team_info['teamMode'] = mode_match.group(1).strip()
        
        if 'Execution ID:' in content:
            exec_match = re.search(r'Execution ID:\s*([^\n]+)', content)
            if exec_match:
                team_info['executionId'] = exec_match.group(1).strip()
        
        return team_info
    
    def _parse_member_calls(self, content: str) -> List[TeamMemberCall]:
        """解析成员调用信息"""
        member_calls = []
        
        # 查找成员调用模式
        call_patterns = [
            r'Member\s+(\w+)\s+\(([^)]+)\)\s+executed\s+(\w+)\s+in\s+([\d.]+)ms',
            r'(\w+)\s+agent\s+executed\s+(\w+)\s+in\s+([\d.]+)ms',
            r'Agent\s+(\w+)\s+completed\s+(\w+)\s+in\s+([\d.]+)ms'
        ]
        
        for pattern in call_patterns:
            matches = re.finditer(pattern, content, re.IGNORECASE)
            for match in matches:
                try:
                    if len(match.groups()) == 4:
                        # 完整格式
                        member_id = match.group(1)
                        member_name = match.group(2)
                        action = match.group(3)
                        duration = float(match.group(4))
                    else:
                        # 简化格式
                        member_id = match.group(1)
                        member_name = member_id
                        action = match.group(2)
                        duration = float(match.group(3))
                    
                    # 确定调用类型
                    call_type = self._determine_call_type(action)
                    
                    # 确定状态
                    status = self._determine_call_status(content, member_id)
                    
                    # 提取输入输出
                    input_data, output_data = self._extract_call_data(content, member_id)
                    
                    # 提取错误信息
                    error_message = self._extract_error_message(content, member_id)
                    
                    # 计算时间
                    current_time = int(time.time() * 1000)
                    start_time = current_time - int(duration)
                    
                    member_call = TeamMemberCall(
                        memberId=member_id,
                        memberName=member_name,
                        role=self._get_member_role(member_id),
                        action=action,
                        callType=call_type,
                        input=input_data,
                        output=output_data,
                        startTime=start_time,
                        endTime=current_time,
                        durationMs=int(duration),
                        status=status,
                        errorMessage=error_message
                    )
                    
                    member_calls.append(member_call)
                    
                except Exception as e:
                    logger.warning(f"解析成员调用失败: {e}")
                    continue
        
        return member_calls
    
    def _parse_structured_output(self, content: str) -> Optional[TeamStructuredOutput]:
        """解析结构化输出"""
        try:
            # 查找结构化输出模式
            output_patterns = [
                r'Structured\s+output\s+type:\s+(\w+),\s+confidence:\s+([\d.]+)',
                r'Output\s+type:\s+(\w+),\s+confidence:\s+([\d.]+)',
                r'Result\s+type:\s+(\w+),\s+confidence:\s+([\d.]+)'
            ]
            
            for pattern in output_patterns:
                match = re.search(pattern, content, re.IGNORECASE)
                if match:
                    output_type = match.group(1)
                    confidence = float(match.group(2))
                    
                    # 提取输出数据
                    data = self._extract_structured_data(content)
                    
                    # 提取源信息
                    sources = self._extract_sources(content)
                    
                    return TeamStructuredOutput(
                        type=output_type,
                        data=data,
                        confidence=confidence,
                        sources=sources
                    )
            
            return None
            
        except Exception as e:
            logger.warning(f"解析结构化输出失败: {e}")
            return None
    
    def _parse_coordination_info(self, content: str) -> Optional[TeamCoordinationInfo]:
        """解析协调信息"""
        try:
            # 查找协调器信息
            coordinator_match = re.search(r'Coordinator:\s*(\w+)', content, re.IGNORECASE)
            if not coordinator_match:
                return None
            
            coordinator_id = coordinator_match.group(1)
            
            # 查找协调模式
            mode_match = re.search(r'Coordination\s+mode:\s*(\w+)', content, re.IGNORECASE)
            coordination_mode = mode_match.group(1) if mode_match else 'coordinate'
            
            # 查找成员分配
            member_assignments = self._extract_member_assignments(content)
            
            # 查找执行顺序
            execution_order = self._extract_execution_order(content)
            
            # 查找性能指标
            performance_metrics = self._extract_performance_metrics(content)
            
            # 查找路由决策
            routing_decisions = self._extract_routing_decisions(content)
            
            # 查找共享状态
            shared_state = self._extract_shared_state(content)
            
            return TeamCoordinationInfo(
                coordinatorId=coordinator_id,
                coordinationMode=coordination_mode,
                coordinationStrategy='adaptive',
                memberAssignments=member_assignments,
                executionOrder=execution_order,
                performanceMetrics=performance_metrics,
                routingDecisions=routing_decisions,
                sharedState=shared_state
            )
            
        except Exception as e:
            logger.warning(f"解析协调信息失败: {e}")
            return None
    
    def _determine_call_type(self, action: str) -> str:
        """确定调用类型"""
        action_lower = action.lower()
        
        if any(keyword in action_lower for keyword in ['search', 'retrieve', 'query', 'find']):
            return 'tool'
        elif any(keyword in action_lower for keyword in ['think', 'reason', 'analyze', 'process']):
            return 'reasoning'
        elif any(keyword in action_lower for keyword in ['coordinate', 'assign', 'route', 'manage']):
            return 'coordination'
        else:
            return 'tool'
    
    def _determine_call_status(self, content: str, member_id: str) -> str:
        """确定调用状态"""
        # 查找错误信息
        error_patterns = [
            rf'{member_id}.*error',
            rf'{member_id}.*failed',
            rf'{member_id}.*exception'
        ]
        
        for pattern in error_patterns:
            if re.search(pattern, content, re.IGNORECASE):
                return 'error'
        
        # 查找完成信息
        complete_patterns = [
            rf'{member_id}.*completed',
            rf'{member_id}.*finished',
            rf'{member_id}.*success'
        ]
        
        for pattern in complete_patterns:
            if re.search(pattern, content, re.IGNORECASE):
                return 'completed'
        
        # 查找运行信息
        running_patterns = [
            rf'{member_id}.*running',
            rf'{member_id}.*executing',
            rf'{member_id}.*processing'
        ]
        
        for pattern in running_patterns:
            if re.search(pattern, content, re.IGNORECASE):
                return 'running'
        
        return 'pending'
    
    def _extract_call_data(self, content: str, member_id: str) -> tuple:
        """提取调用数据"""
        # 查找输入数据
        input_pattern = rf'{member_id}.*input:\s*(\{{[^}}]*\}}|\[[^\]]*\])'
        input_match = re.search(input_pattern, content, re.IGNORECASE)
        input_data = {}
        if input_match:
            try:
                input_data = json.loads(input_match.group(1))
            except:
                input_data = {'raw': input_match.group(1)}
        
        # 查找输出数据
        output_pattern = rf'{member_id}.*output:\s*(\{{[^}}]*\}}|\[[^\]]*\])'
        output_match = re.search(output_pattern, content, re.IGNORECASE)
        output_data = {}
        if output_match:
            try:
                output_data = json.loads(output_match.group(1))
            except:
                output_data = {'raw': output_match.group(1)}
        
        return input_data, output_data
    
    def _extract_error_message(self, content: str, member_id: str) -> Optional[str]:
        """提取错误信息"""
        error_pattern = rf'{member_id}.*error[:\s]+([^\n]+)'
        error_match = re.search(error_pattern, content, re.IGNORECASE)
        return error_match.group(1).strip() if error_match else None
    
    def _get_member_role(self, member_id: str) -> str:
        """获取成员角色"""
        role_mapping = {
            'question_decomposition_agent': '问题分解专家',
            'translation_agent': '实时翻译专家',
            'knowledge_retrieval_agent': '多语言知识检索专家',
            'knowledge_graph_agent': '知识图谱专家',
            'summary_answer_agent': '总结回答专家',
            'qa_coordinator_v2': '多语言问答协调器'
        }
        return role_mapping.get(member_id, '未知角色')
    
    def _extract_structured_data(self, content: str) -> Any:
        """提取结构化数据"""
        # 查找JSON格式的数据
        json_pattern = r'\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}'
        json_matches = re.findall(json_pattern, content)
        
        for json_str in json_matches:
            try:
                return json.loads(json_str)
            except:
                continue
        
        # 如果没有找到JSON，返回原始内容的一部分
        return {'content': content[:200] + '...' if len(content) > 200 else content}
    
    def _extract_sources(self, content: str) -> List[str]:
        """提取源信息"""
        sources = []
        
        # 查找源引用
        source_patterns = [
            r'source[s]?:\s*([^\n]+)',
            r'reference[s]?:\s*([^\n]+)',
            r'from:\s*([^\n]+)'
        ]
        
        for pattern in source_patterns:
            matches = re.findall(pattern, content, re.IGNORECASE)
            sources.extend(matches)
        
        return list(set(sources))  # 去重
    
    def _extract_member_assignments(self, content: str) -> Dict[str, List[str]]:
        """提取成员分配信息"""
        assignments = {}
        
        # 查找分配模式
        assignment_pattern = r'(\w+)\s+assigned\s+to\s+(\w+)'
        matches = re.findall(assignment_pattern, content, re.IGNORECASE)
        
        for task, member in matches:
            if task not in assignments:
                assignments[task] = []
            assignments[task].append(member)
        
        return assignments
    
    def _extract_execution_order(self, content: str) -> List[str]:
        """提取执行顺序"""
        order = []
        
        # 查找执行顺序
        order_pattern = r'Step\s+\d+:\s+(\w+)'
        matches = re.findall(order_pattern, content, re.IGNORECASE)
        
        return matches
    
    def _extract_performance_metrics(self, content: str) -> Dict[str, Any]:
        """提取性能指标"""
        metrics = {
            'totalExecutionTime': 0,
            'totalSteps': 0,
            'completedSteps': 0,
            'failedSteps': 0,
            'averageStepDuration': 0
        }
        
        # 查找时间指标
        time_pattern = r'total\s+time:\s*([\d.]+)ms'
        time_match = re.search(time_pattern, content, re.IGNORECASE)
        if time_match:
            metrics['totalExecutionTime'] = float(time_match.group(1))
        
        # 查找步骤指标
        steps_pattern = r'total\s+steps:\s*(\d+)'
        steps_match = re.search(steps_pattern, content, re.IGNORECASE)
        if steps_match:
            metrics['totalSteps'] = int(steps_match.group(1))
        
        return metrics
    
    def _extract_routing_decisions(self, content: str) -> List[Dict[str, Any]]:
        """提取路由决策"""
        decisions = []
        
        # 查找路由决策
        decision_pattern = r'Route\s+(\w+)\s+to\s+(\w+)\s+because\s+([^,]+)'
        matches = re.findall(decision_pattern, content, re.IGNORECASE)
        
        for task, member, reason in matches:
            decisions.append({
                'task': task,
                'memberId': member,
                'reason': reason.strip(),
                'confidence': 0.8  # 默认置信度
            })
        
        return decisions
    
    def _extract_shared_state(self, content: str) -> Dict[str, Any]:
        """提取共享状态"""
        state = {}
        
        # 查找共享状态
        state_pattern = r'shared\s+state[:\s]+(\{[^}]*\})'
        state_match = re.search(state_pattern, content, re.IGNORECASE)
        
        if state_match:
            try:
                state = json.loads(state_match.group(1))
            except:
                state = {'raw': state_match.group(1)}
        
        return state
    
    def _create_fallback_message_data(self) -> TeamMessageData:
        """创建回退消息数据"""
        return TeamMessageData(
            teamId='unknown',
            teamName='Unknown Team',
            teamMode='coordinate',
            executionId=f'exec_{int(time.time())}',
            memberCalls=[],
            totalSteps=0,
            completedSteps=0,
            failedSteps=0
        )
    
    def convert_to_frontend_format(self, team_data: TeamMessageData) -> Dict[str, Any]:
        """转换为前端格式"""
        return {
            'teamInfo': {
                'isTeamMessage': True,
                'teamId': team_data.teamId,
                'teamName': team_data.teamName,
                'teamMode': team_data.teamMode,
                'executionId': team_data.executionId,
                'memberCalls': [asdict(call) for call in team_data.memberCalls],
                'structuredOutput': asdict(team_data.structuredOutput) if team_data.structuredOutput else None,
                'coordinationInfo': asdict(team_data.coordinationInfo) if team_data.coordinationInfo else None
            }
        }
    
    def extract_monitoring_data(self, team_data: TeamMessageData) -> Dict[str, Any]:
        """提取监控数据"""
        return {
            'execution_id': team_data.executionId,
            'team_name': team_data.teamName,
            'team_mode': team_data.teamMode,
            'total_steps': team_data.totalSteps,
            'completed_steps': team_data.completedSteps,
            'failed_steps': team_data.failedSteps,
            'processing_time': team_data.processingTime,
            'member_calls': [asdict(call) for call in team_data.memberCalls],
            'timestamp': int(time.time())
        }


# 全局实例
team_message_parser = TeamMessageParser() 