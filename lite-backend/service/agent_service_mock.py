"""
智能体服务模拟版本 - 用于避免agno依赖问题
"""
import time
from typing import Dict, List, Optional, Any
from dataclasses import dataclass

from core.logger import logger

@dataclass
class AgentResponse:
    """智能体响应数据结构"""
    content: str
    agent_name: str
    model_used: str
    processing_time: float
    confidence_score: Optional[float] = None
    sources: Optional[List[Dict[str, Any]]] = None
    metadata: Optional[Dict[str, Any]] = None

class MockAgentService:
    """模拟智能体服务"""
    
    def __init__(self):
        self.available_agents = ["材料专家", "工程师", "研究员"]
        self.available_teams = ["geopolymer_qa_team", "material_analysis_team"]
        self.active_sessions = {}  # 跟踪活跃会话
    
    async def register_session(self, session_id: str) -> None:
        """注册新的会话"""
        self.active_sessions[session_id] = {
            'start_time': time.time(),
            'status': 'active',
            'cancelled': False
        }
        logger.info(f"[MOCK SESSION] 注册会话: {session_id}")
    
    async def cancel_session(self, session_id: str) -> bool:
        """取消指定会话的所有任务"""
        if session_id in self.active_sessions:
            self.active_sessions[session_id]['cancelled'] = True
            self.active_sessions[session_id]['status'] = 'cancelled'
            logger.info(f"[MOCK SESSION] 会话已标记为取消: {session_id}")
            return True
        else:
            logger.info(f"[MOCK SESSION] 会话 {session_id} 不存在，无法取消")
            return False
    
    async def cleanup_session(self, session_id: str) -> None:
        """清理会话资源"""
        if session_id in self.active_sessions:
            del self.active_sessions[session_id]
            logger.info(f"[MOCK SESSION] 清理会话资源: {session_id}")
        else:
            logger.info(f"[MOCK SESSION] 会话 {session_id} 不存在，无需清理")
    
    def get_available_agents(self) -> List[str]:
        """获取可用的智能体列表"""
        return self.available_agents
    
    def get_available_teams(self) -> List[str]:
        """获取可用的智能体团队列表"""
        return self.available_teams
    
    async def single_agent_query(self, agent_name: str, question: str, stream: bool = False, model_name: str = None, model_params: dict = None, search_knowledge: bool = True, session_id: str = None) -> AgentResponse:
        """单智能体查询"""
        start_time = time.time()
        
        # 记录接收到的参数
        if model_params:
            logger.info(f"模拟服务接收到模型参数: {model_params}")
        if model_name:
            logger.info(f"模拟服务接收到模型名称: {model_name}")
        if session_id:
            logger.info(f"模拟服务接收到session_id: {session_id}")
        
        # 模拟处理时间
        processing_time = time.time() - start_time + 1.5
        
        return AgentResponse(
            content=f"这是来自{agent_name}的回答：{question}的相关信息...",
            agent_name=agent_name,
            model_used="claude-3-sonnet",
            processing_time=processing_time,
            confidence_score=0.85,
            sources=[
                {
                    "id": "doc_001",
                    "title": "地聚物研究文档",
                    "relevance": 0.9
                }
            ],
            metadata={"mock": True, "session_id": session_id}
        )
    
    async def team_query(self, team_name: str, question: str, session_id: str = None) -> AgentResponse:
        """团队查询"""
        start_time = time.time()
        
        if session_id:
            logger.info(f"模拟团队服务接收到session_id: {session_id}")
        
        # 模拟处理时间
        processing_time = time.time() - start_time + 2.1
        
        return AgentResponse(
            content=f"这是来自{team_name}团队的综合回答：{question}...",
            agent_name=team_name,
            model_used="claude-3-sonnet",
            processing_time=processing_time,
            confidence_score=0.92,
            sources=[
                {
                    "id": "doc_001",
                    "title": "地聚物研究文档",
                    "relevance": 0.9
                },
                {
                    "id": "doc_002", 
                    "title": "材料性能分析",
                    "relevance": 0.85
                }
            ],
            metadata={"mock": True, "team_size": 3, "session_id": session_id}
        )
    
    async def team_query_stream(self, team_name: str, question: str, session_id: str = None):
        """团队流式查询"""
        if session_id:
            logger.info(f"模拟团队流式服务接收到session_id: {session_id}")
        
        # 模拟流式响应
        yield {
            "type": "chunk",
            "data": {
                "content": f"这是来自{team_name}团队的",
                "agent_name": team_name,
                "model_used": "claude-3-sonnet",
                "timestamp": time.time()
            }
        }
        
        yield {
            "type": "chunk", 
            "data": {
                "content": f"综合回答：{question}...",
                "agent_name": team_name,
                "model_used": "claude-3-sonnet", 
                "timestamp": time.time()
            }
        }
        
        yield {
            "type": "done",
            "data": {
                "agent_name": team_name,
                "total_processing_time": 2.1,
                "timestamp": time.time()
            }
        }
    
    async def geopolymer_qa(self, question: str, use_team: bool = True, agent_name: str = None, session_id: str = None) -> AgentResponse:
        """地聚物问答"""
        if use_team:
            return await self.team_query("geopolymer_qa_team", question, session_id)
        else:
            return await self.single_agent_query(agent_name or "材料专家", question, session_id=session_id)

# 创建全局实例
agent_service = MockAgentService()