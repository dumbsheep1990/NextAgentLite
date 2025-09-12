"""
Youtu-Agent 服务层 - 基于真实的youtu-agent实现
"""
import asyncio
import json
import uuid
from typing import Dict, Any, List, Optional, AsyncGenerator
from datetime import datetime

from core.logger import logger
from .core import get_youtu_core


class YoutuAgentService:
    """Youtu-Agent核心服务 - 基于真实的youtu-agent框架"""
    
    async def create_agent(
        self,
        name: str,
        agent_type: str = "simple",
        instructions: str = "你是一个专业的AI助手。",
        toolkits: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """创建Agent"""
        async with get_youtu_core() as core:
            agent = await core.create_agent(
                agent_type=agent_type,
                name=name,
                instructions=instructions,
                toolkits=toolkits
            )
            
            return {
                "id": str(uuid.uuid4()),
                "name": name,
                "type": agent_type,
                "instructions": instructions,
                "status": "active",
                "created_at": datetime.now().isoformat()
            }
    
    async def list_agents(self) -> List[Dict[str, Any]]:
        """列出所有Agent"""
        async with get_youtu_core() as core:
            agents = await core.list_agents()
            return [
                {
                    "name": name,
                    "type": agent_type,
                    "status": "active"
                }
                for name, agent_type in agents.items()
            ]
    
    async def execute_agent(
        self,
        agent_name: str,
        query: str,
        stream: bool = False
    ) -> Any:
        """执行Agent查询"""
        async with get_youtu_core() as core:
            agent = await core.get_agent(agent_name)
            if not agent:
                raise ValueError(f"Agent '{agent_name}' 不存在")
            
            try:
                if stream:
                    return self._execute_agent_stream(agent, query)
                else:
                    return await self._execute_agent_sync(agent, query)
                    
            except Exception as e:
                logger.error(f"Agent执行失败: {e}")
                raise
    
    async def _execute_agent_sync(self, agent: Any, query: str) -> Dict[str, Any]:
        """同步执行Agent"""
        try:
            # 使用youtu-agent的run方法执行查询
            result = await agent.run(query)
            
            return {
                "success": True,
                "result": result,
                "timestamp": datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Agent同步执行失败: {e}")
            return {
                "success": False,
                "error": str(e),
                "timestamp": datetime.now().isoformat()
            }
    
    async def _execute_agent_stream(self, agent: Any, query: str) -> AsyncGenerator[str, None]:
        """流式执行Agent"""
        try:
            # youtu-agent支持流式执行
            async for chunk in agent.run_stream(query):
                yield json.dumps({
                    "type": "chunk",
                    "content": str(chunk),
                    "timestamp": datetime.now().isoformat()
                }) + "\n"
                
            yield json.dumps({
                "type": "complete",
                "timestamp": datetime.now().isoformat()
            }) + "\n"
            
        except Exception as e:
            logger.error(f"Agent流式执行失败: {e}")
            yield json.dumps({
                "type": "error",
                "error": str(e),
                "timestamp": datetime.now().isoformat()
            }) + "\n"


class MetaAgentService:
    """Meta-Agent服务 - 智能生成Agent配置"""
    
    async def create_session(
        self,
        user_description: str,
        domain: str = "general",
        user_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """创建Meta-Agent会话 - 开始4步生成流程"""
        
        try:
            async with get_youtu_core() as core:
                # 启动youtu-agent的4步生成流程
                result = await core.start_meta_generation(
                    user_description=user_description,
                    ask_function=None  # 这里需要设置交互函数
                )
            
            return {
                "session_id": str(result["session_id"]),
                "status": "step1_started",
                "current_step": 1,
                "total_steps": 4,
                "step_name": "需求澄清",
                "domain": domain,
                "created_at": datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Meta-Agent会话创建失败: {e}")
            fallback_session_id = str(uuid.uuid4())
            return {
                "session_id": fallback_session_id,
                "status": "failed",
                "error": str(e),
                "created_at": datetime.now().isoformat()
            }
    
    async def continue_session(
        self,
        session_id: str,
        user_response: str
    ) -> Dict[str, Any]:
        """继续Meta-Agent会话 - 处理youtu-agent的4步流程"""
        try:
            async with get_youtu_core() as core:
                # 继续meta-agent生成流程
                result = await core.continue_meta_generation(
                    session_id=session_id,
                    user_response=user_response
                )
                
                return {
                    "session_id": session_id,
                    "status": result.get("status", "in_progress"),
                    "current_step": result.get("current_step", 1),
                    "step_name": result.get("step_name", "需求澄清"),
                    "assistant_response": result.get("message", f"正在处理您的响应: {user_response}"),
                    "is_complete": result.get("status") == "completed",
                    "generated_config": result.get("generated_config"),
                    "timestamp": datetime.now().isoformat()
                }
                
        except Exception as e:
            logger.error(f"Meta-Agent会话继续失败: {e}")
            return {
                "session_id": session_id,
                "status": "error",
                "error": str(e),
                "assistant_response": "抱歉，处理您的响应时出现了问题，请重试。",
                "timestamp": datetime.now().isoformat()
            }
    
    async def continue_conversation(
        self,
        session_id: str,
        user_message: str
    ) -> Dict[str, Any]:
        """继续Meta-Agent对话 - 兼容旧接口"""
        return await self.continue_session(session_id, user_message)


class HybridAgentService:
    """混合Agent服务 - 支持多种执行策略"""
    
    def __init__(self):
        self.strategies = {
            "intelligent_routing": self._intelligent_routing_strategy,
            "performance_balanced": self._performance_balanced_strategy,
            "domain_specialized": self._domain_specialized_strategy
        }
    
    async def get_available_strategies(self) -> Dict[str, Dict[str, Any]]:
        """获取可用的执行策略"""
        return {
            "intelligent_routing": {
                "name": "智能路由",
                "description": "基于问题类型智能选择最佳Agent",
                "enabled": True
            },
            "performance_balanced": {
                "name": "性能均衡",
                "description": "在性能和准确性之间取得平衡",
                "enabled": True
            },
            "domain_specialized": {
                "name": "领域专业化",
                "description": "根据领域选择专业Agent",
                "enabled": True
            }
        }
    
    async def execute_hybrid_query(
        self,
        query: str,
        strategy: str = "intelligent_routing",
        context: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """执行混合查询"""
        if strategy not in self.strategies:
            raise ValueError(f"未知策略: {strategy}")
        
        strategy_func = self.strategies[strategy]
        
        try:
            result = await strategy_func(query, context or {})
            
            return {
                "success": True,
                "strategy_used": strategy,
                "result": result,
                "timestamp": datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"混合查询执行失败: {e}")
            return {
                "success": False,
                "error": str(e),
                "timestamp": datetime.now().isoformat()
            }
    
    async def _intelligent_routing_strategy(self, query: str, context: Dict[str, Any]) -> str:
        """智能路由策略"""
        # 简化实现：根据查询内容选择Agent类型
        if "分析" in query or "复杂" in query:
            agent_type = "orchestra"
        else:
            agent_type = "simple"
        
        agent_service = YoutuAgentService()
        
        # 创建临时Agent
        agent_name = f"temp_agent_{uuid.uuid4().hex[:8]}"
        await agent_service.create_agent(
            name=agent_name,
            agent_type=agent_type,
            instructions="根据用户查询提供专业回答"
        )
        
        # 执行查询
        result = await agent_service.execute_agent(agent_name, query)
        return result.get("result", "执行失败")
    
    async def _performance_balanced_strategy(self, query: str, context: Dict[str, Any]) -> str:
        """性能均衡策略"""
        # 使用SimpleAgent以获得更好的性能
        agent_service = YoutuAgentService()
        
        agent_name = f"balanced_agent_{uuid.uuid4().hex[:8]}"
        await agent_service.create_agent(
            name=agent_name,
            agent_type="simple",
            instructions="提供准确且高效的回答"
        )
        
        result = await agent_service.execute_agent(agent_name, query)
        return result.get("result", "执行失败")
    
    async def _domain_specialized_strategy(self, query: str, context: Dict[str, Any]) -> str:
        """领域专业化策略"""
        # 根据上下文确定领域并创建专业Agent
        domain = context.get("domain", "general")
        
        agent_service = YoutuAgentService()
        
        agent_name = f"specialist_agent_{uuid.uuid4().hex[:8]}"
        instructions = f"你是{domain}领域的专家，请提供专业的回答。"
        
        await agent_service.create_agent(
            name=agent_name,
            agent_type="simple",
            instructions=instructions
        )
        
        result = await agent_service.execute_agent(agent_name, query)
        return result.get("result", "执行失败")