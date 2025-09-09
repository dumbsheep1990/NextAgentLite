"""
SSE数据格式适配器
保持与现有前端的完全兼容性
"""
import time
from typing import Dict, List, Optional, Any

from core.logger import logger


class SSEDataAdapter:
    """SSE数据格式适配器 - 保持与现有前端的兼容性"""
    
    @staticmethod
    def adapt_execution_start_event(execution_id: str, team_name: str, template_id: str) -> Dict:
        """适配执行开始事件"""
        return {
            "type": "team_start",
            "data": {
                "execution_id": execution_id,
                "team_name": team_name,
                "template_id": template_id,
                "timestamp": time.time()
            }
        }
    
    @staticmethod
    def adapt_agent_call_event(
        agent_name: str, 
        action: str, 
        data: Optional[Dict] = None,
        status: str = "running"
    ) -> Dict:
        """适配agent_call事件格式"""
        event_data = {
            "agent_name": agent_name,
            "action": action,
            "status": status,
            "timestamp": time.time()
        }
        
        if data:
            event_data.update(data)
        
        return {
            "type": "agent_call",
            "data": event_data
        }
    
    @staticmethod
    def adapt_content_event(content: str, agent_name: str, chunk_id: Optional[str] = None) -> Dict:
        """适配content事件格式"""
        event_data = {
            "content": content,
            "agent_name": agent_name,
            "timestamp": time.time()
        }
        
        if chunk_id:
            event_data["chunk_id"] = chunk_id
        
        return {
            "type": "content",
            "data": event_data
        }
    
    @staticmethod
    def adapt_agent_decision_event(
        agent_name: str,
        decision_type: str,
        decision_content: str,
        confidence: Optional[float] = None,
        reasoning: Optional[str] = None
    ) -> Dict:
        """适配agent_decision事件格式"""
        event_data = {
            "agent_name": agent_name,
            "decision_type": decision_type,
            "decision_content": decision_content,
            "timestamp": time.time()
        }
        
        if confidence is not None:
            event_data["confidence"] = confidence
        
        if reasoning:
            event_data["reasoning"] = reasoning
        
        return {
            "type": "agent_decision",
            "data": event_data
        }
    
    @staticmethod
    def adapt_team_analysis_event(analysis_data: Dict) -> Dict:
        """适配team_analysis事件格式"""
        # 确保分析数据包含必要的字段
        required_fields = {
            "execution_id": analysis_data.get("execution_id", "unknown"),
            "team_name": analysis_data.get("team_name", "unknown"),
            "processing_time": analysis_data.get("processing_time", 0),
            "team_decisions": analysis_data.get("team_decisions", []),
            "member_calls": analysis_data.get("member_calls", []),
            "coordination_info": analysis_data.get("coordination_info", {}),
            "metadata": analysis_data.get("metadata", {}),
            "timestamp": analysis_data.get("timestamp", time.time() * 1000)
        }
        
        return {
            "type": "team_analysis",
            "data": required_fields
        }
    
    @staticmethod
    def adapt_coordination_decision_event(
        coordinator_name: str,
        decision_type: str,
        affected_agents: List[str],
        decision_details: Dict
    ) -> Dict:
        """适配coordination_decision事件格式"""
        return {
            "type": "coordination_decision",
            "data": {
                "coordinator_name": coordinator_name,
                "decision_type": decision_type,
                "affected_agents": affected_agents,
                "decision_details": decision_details,
                "timestamp": time.time()
            }
        }
    
    @staticmethod
    def adapt_error_event(
        error_message: str,
        execution_id: Optional[str] = None,
        agent_name: Optional[str] = None,
        error_details: Optional[Dict] = None
    ) -> Dict:
        """适配error事件格式"""
        event_data = {
            "error": error_message,
            "timestamp": time.time()
        }
        
        if execution_id:
            event_data["execution_id"] = execution_id
        
        if agent_name:
            event_data["agent_name"] = agent_name
        
        if error_details:
            event_data["error_details"] = error_details
        
        return {
            "type": "error",
            "data": event_data
        }
    
    @staticmethod
    def adapt_complete_event(execution_id: str, processing_time: float) -> Dict:
        """适配complete事件格式"""
        return {
            "type": "complete",
            "data": {
                "execution_id": execution_id,
                "processing_time": processing_time,
                "timestamp": time.time()
            }
        }
    
    @staticmethod
    def adapt_done_event(execution_id: str, processing_time: float) -> Dict:
        """适配done事件格式（兼容现有前端）"""
        return {
            "type": "done",
            "data": {
                "execution_id": execution_id,
                "processing_time": processing_time,
                "timestamp": time.time()
            }
        }
    
    @staticmethod
    def create_member_call_data(
        member_id: str,
        member_name: str,
        role: str,
        action: str,
        call_type: str = "tool",
        input_data: Optional[Dict] = None,
        output_data: Optional[Dict] = None,
        status: str = "completed",
        confidence: Optional[float] = None,
        duration_ms: Optional[int] = None,
        error_message: Optional[str] = None
    ) -> Dict:
        """创建标准的成员调用数据格式"""
        current_time = int(time.time() * 1000)
        
        return {
            "memberId": member_id,
            "memberName": member_name,
            "role": role,
            "action": action,
            "callType": call_type,
            "input": input_data or {},
            "output": output_data or {},
            "startTime": current_time - (duration_ms or 0),
            "endTime": current_time,
            "durationMs": duration_ms or 0,
            "status": status,
            "confidence": confidence,
            "errorMessage": error_message,
            "metadata": {
                "execution_type": "new_team_system_v2",
                "timestamp": current_time
            }
        }
    
    @staticmethod
    def create_team_decision_data(
        decision_type: str,
        title: str,
        content: str,
        confidence: float = 0.9,
        reasoning: str = "",
        affected_agents: Optional[List[str]] = None,
        alternatives: Optional[List[str]] = None,
        timestamp_offset: int = 0
    ) -> Dict:
        """创建标准的团队决策数据格式"""
        current_time = time.time() * 1000 - timestamp_offset
        
        return {
            "type": decision_type,
            "title": title,
            "content": content,
            "confidence": confidence,
            "reasoning": reasoning,
            "affected_agents": affected_agents or [],
            "alternatives": alternatives or [],
            "timestamp": current_time
        }
    
    @staticmethod
    def validate_sse_event(event: Dict) -> bool:
        """验证SSE事件格式是否正确"""
        try:
            # 检查必须的字段
            if "type" not in event or "data" not in event:
                logger.warning(f"[SSE_ADAPTER] SSE事件缺少必须字段: {event}")
                return False
            
            # 检查事件类型
            valid_types = [
                "team_start", "agent_call", "content", "agent_decision",
                "coordination_decision", "team_analysis", "error", "complete", "done"
            ]
            
            if event["type"] not in valid_types:
                logger.warning(f"[SSE_ADAPTER] 无效的SSE事件类型: {event['type']}")
                return False
            
            # 检查data字段
            if not isinstance(event["data"], dict):
                logger.warning(f"[SSE_ADAPTER] SSE事件data字段必须是字典: {event}")
                return False
            
            # 检查是否有timestamp
            if "timestamp" not in event["data"]:
                event["data"]["timestamp"] = time.time()
            
            return True
            
        except Exception as e:
            logger.error(f"[SSE_ADAPTER] 验证SSE事件时发生异常: {e}")
            return False
    
    @staticmethod
    def ensure_compatibility(event: Dict) -> Dict:
        """确保事件与现有前端兼容"""
        try:
            # 复制事件以避免修改原始数据
            compatible_event = event.copy()
            compatible_event["data"] = event["data"].copy()
            
            # 添加兼容性字段
            if "timestamp" not in compatible_event["data"]:
                compatible_event["data"]["timestamp"] = time.time()
            
            # 根据事件类型添加特定的兼容性字段
            event_type = compatible_event["type"]
            
            if event_type == "agent_call" and "agent_name" in compatible_event["data"]:
                # 确保agent_call事件有必要的字段
                data = compatible_event["data"]
                if "action" not in data:
                    data["action"] = "unknown_action"
                if "status" not in data:
                    data["status"] = "running"
            
            elif event_type == "content" and "content" in compatible_event["data"]:
                # 确保content事件有必要的字段
                data = compatible_event["data"]
                if "agent_name" not in data:
                    data["agent_name"] = "unknown_agent"
            
            elif event_type == "team_analysis":
                # 确保team_analysis事件有必要的字段
                data = compatible_event["data"]
                required_fields = ["execution_id", "team_name", "processing_time"]
                for field in required_fields:
                    if field not in data:
                        data[field] = "unknown" if field != "processing_time" else 0
            
            return compatible_event
            
        except Exception as e:
            logger.error(f"[SSE_ADAPTER] 确保兼容性时发生异常: {e}")
            return event  # 返回原始事件
    
    @classmethod
    def create_standard_events_from_legacy(cls, legacy_data: Dict) -> List[Dict]:
        """从旧格式数据创建标准SSE事件序列"""
        events = []
        
        try:
            # 如果有团队分析数据，创建team_analysis事件
            if "team_analysis" in legacy_data:
                events.append(cls.adapt_team_analysis_event(legacy_data["team_analysis"]))
            
            # 如果有成员调用数据，创建agent_call事件
            if "member_calls" in legacy_data:
                for call in legacy_data["member_calls"]:
                    events.append(cls.adapt_agent_call_event(
                        agent_name=call.get("memberName", "Unknown"),
                        action=call.get("action", "unknown"),
                        data=call,
                        status=call.get("status", "completed")
                    ))
            
            # 如果有内容数据，创建content事件
            if "content" in legacy_data:
                events.append(cls.adapt_content_event(
                    content=legacy_data["content"],
                    agent_name=legacy_data.get("agent_name", "system")
                ))
            
            return events
            
        except Exception as e:
            logger.error(f"[SSE_ADAPTER] 从旧格式创建事件时发生异常: {e}")
            return []