"""
NextAgent Lite 政策问答DAG执行服务
基于智能路由决策的动态DAG执行逻辑
"""

import asyncio
import json
import logging
from typing import Dict, List, Optional, Any, Tuple
from dataclasses import dataclass
from datetime import datetime
from enum import Enum

from service.team_template_service import team_template_service, TeamInstance
from service.agent_service import agent_service
from core.logger import setup_logger

logger = setup_logger(__name__)

class ExecutionMode(Enum):
    """执行模式枚举"""
    DIRECT_ANSWER = "direct_answer"
    KNOWLEDGE_RETRIEVAL = "knowledge_retrieval"
    GRAPH_ENHANCED = "graph_enhanced"

@dataclass
class RoutingDecision:
    """路由决策结果"""
    execution_mode: ExecutionMode
    use_knowledge_retrieval: bool
    use_graph_retrieval: bool
    reasoning: str
    confidence: float

@dataclass
class ExecutionStep:
    """执行步骤"""
    agent_id: str
    action: str
    depends_on: List[str]
    status: str  # pending, running, completed, failed
    start_time: Optional[datetime]
    end_time: Optional[datetime]
    result: Optional[Dict[str, Any]]
    error: Optional[str]

class PolicyDAGExecutor:
    """政策问答DAG执行器"""
    
    def __init__(self):
        self.execution_history: Dict[str, List[ExecutionStep]] = {}
        self.active_executions: Dict[str, Dict[str, Any]] = {}
    
    async def execute_policy_qa(
        self, 
        user_question: str,
        session_id: str,
        execution_mode: Optional[str] = None,
        context: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """执行政策问答DAG"""
        
        try:
            logger.info(f"开始执行政策问答DAG, 问题: {user_question[:100]}...")
            
            # 1. 创建团队实例
            instance = await team_template_service.create_team_instance(
                template_id="nextAgent_policy_qa_team",
                execution_mode=execution_mode
            )
            
            if not instance:
                raise Exception("创建团队实例失败")
            
            # 2. 初始化执行状态
            execution_id = f"{session_id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
            self.active_executions[execution_id] = {
                "instance": instance,
                "user_question": user_question,
                "status": "running",
                "start_time": datetime.now(),
                "context": context or {}
            }
            
            # 3. 执行智能路由决策
            routing_decision = await self._execute_intelligent_routing(
                user_question, instance, execution_id
            )
            
            # 4. 根据路由决策动态执行DAG
            final_result = await self._execute_dynamic_dag(
                routing_decision, instance, execution_id, user_question, context
            )
            
            # 5. 更新执行状态
            self.active_executions[execution_id]["status"] = "completed"
            self.active_executions[execution_id]["end_time"] = datetime.now()
            self.active_executions[execution_id]["result"] = final_result
            
            logger.info(f"政策问答DAG执行完成, 执行ID: {execution_id}")
            return final_result
            
        except Exception as e:
            logger.error(f"政策问答DAG执行失败: {e}")
            if execution_id in self.active_executions:
                self.active_executions[execution_id]["status"] = "failed"
                self.active_executions[execution_id]["error"] = str(e)
            
            # 返回错误回答
            return {
                "answer": "抱歉，处理您的问题时遇到了技术问题。请稍后重试或联系管理员。",
                "error": str(e),
                "execution_mode": execution_mode or "unknown",
                "routing_decision": None
            }
    
    async def _execute_intelligent_routing(
        self, 
        user_question: str, 
        instance: TeamInstance, 
        execution_id: str
    ) -> RoutingDecision:
        """执行智能路由决策"""
        
        try:
            logger.info("执行智能路由决策...")
            
            # 构建路由提示词
            routing_prompt = f"""
作为智能路由决策专家，请分析用户问题并决定最优的处理路径。

用户问题：{user_question}

请根据问题特点，选择合适的执行模式：

1. **direct_answer** - 直接回答模式
   - 适用于：简单问候、闲聊、常识性问题
   - 特征：不需要查询具体政策信息
   - 例如："你好"、"今天天气如何"、"什么是税收"

2. **knowledge_retrieval** - 知识库检索模式  
   - 适用于：具体政策条款查询、标准政策问题
   - 特征：需要查询准确的政策信息
   - 例如："个人所得税起征点是多少"、"小微企业税收优惠政策"

3. **graph_enhanced** - 图谱增强模式
   - 适用于：复杂政策关系分析、多政策关联查询
   - 特征：需要分析政策间关系
   - 例如："企业注册需要哪些税务手续"、"住房公积金与个税的关系"

请以JSON格式回复：
{{
    "execution_mode": "direct_answer/knowledge_retrieval/graph_enhanced",
    "use_knowledge_retrieval": true/false,
    "use_graph_retrieval": true/false,
    "reasoning": "决策理由",
    "confidence": 0.8
}}
"""
            
            # 调用智能路由Agent
            routing_result = await agent_service.call_agent(
                agent_name="intelligent_routing_agent",
                question=routing_prompt,
                session_id=execution_id,
                context={"task": "routing_decision"}
            )
            
            # 解析路由决策
            decision = self._parse_routing_decision(routing_result)
            
            # 记录决策步骤
            self._record_execution_step(
                execution_id, 
                "intelligent_routing_agent", 
                "routing_decision",
                [],
                "completed",
                {"decision": decision}
            )
            
            logger.info(f"路由决策完成: {decision.execution_mode.value}, 置信度: {decision.confidence}")
            return decision
            
        except Exception as e:
            logger.error(f"智能路由决策失败: {e}")
            # 默认使用知识库检索模式
            return RoutingDecision(
                execution_mode=ExecutionMode.KNOWLEDGE_RETRIEVAL,
                use_knowledge_retrieval=True,
                use_graph_retrieval=False,
                reasoning=f"路由决策失败，使用默认模式: {str(e)}",
                confidence=0.5
            )
    
    async def _execute_dynamic_dag(
        self,
        routing_decision: RoutingDecision,
        instance: TeamInstance,
        execution_id: str,
        user_question: str,
        context: Optional[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """根据路由决策动态执行DAG"""
        
        mode = routing_decision.execution_mode
        
        if mode == ExecutionMode.DIRECT_ANSWER:
            return await self._execute_direct_answer_dag(
                instance, execution_id, user_question, routing_decision, context
            )
        elif mode == ExecutionMode.KNOWLEDGE_RETRIEVAL:
            return await self._execute_knowledge_retrieval_dag(
                instance, execution_id, user_question, routing_decision, context
            )
        elif mode == ExecutionMode.GRAPH_ENHANCED:
            return await self._execute_graph_enhanced_dag(
                instance, execution_id, user_question, routing_decision, context
            )
        else:
            raise Exception(f"未知的执行模式: {mode}")
    
    async def _execute_direct_answer_dag(
        self,
        instance: TeamInstance,
        execution_id: str,
        user_question: str,
        routing_decision: RoutingDecision,
        context: Optional[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """执行直接回答DAG"""
        
        logger.info("执行直接回答模式DAG")
        
        # 直接调用总结回答Agent
        final_prompt = f"""
用户问题：{user_question}

路由决策：{routing_decision.reasoning}

请直接提供友好、准确的回答。对于政策相关的常识性问题，可以基于通用知识回答。
"""
        
        result = await agent_service.call_agent(
            agent_name="summary_answer_agent",
            question=final_prompt,
            session_id=execution_id,
            context={"mode": "direct_answer", "routing": routing_decision.__dict__}
        )
        
        self._record_execution_step(
            execution_id,
            "summary_answer_agent",
            "direct_answer",
            ["intelligent_routing_agent"],
            "completed",
            {"result": result}
        )
        
        return {
            "answer": result.get("answer", result.get("response", "抱歉，无法处理您的问题。")),
            "execution_mode": "direct_answer",
            "routing_decision": routing_decision.__dict__,
            "agents_used": ["intelligent_routing_agent", "summary_answer_agent"],
            "knowledge_sources": [],
            "graph_entities": []
        }
    
    async def _execute_knowledge_retrieval_dag(
        self,
        instance: TeamInstance,
        execution_id: str,
        user_question: str,
        routing_decision: RoutingDecision,
        context: Optional[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """执行知识库检索DAG"""
        
        logger.info("执行知识库检索模式DAG")
        
        # 1. 执行知识库检索
        knowledge_result = await agent_service.call_agent(
            agent_name="knowledge_retrieval_agent",
            question=user_question,
            session_id=execution_id,
            context={"mode": "policy_search", "routing": routing_decision.__dict__}
        )
        
        self._record_execution_step(
            execution_id,
            "knowledge_retrieval_agent",
            "policy_search",
            ["intelligent_routing_agent"],
            "completed",
            {"result": knowledge_result}
        )
        
        # 2. 执行总结回答
        summary_prompt = f"""
用户问题：{user_question}

知识库检索结果：
{knowledge_result.get('documents', [])}

路由决策：{routing_decision.reasoning}

请基于检索到的政策信息，提供结构化、专业的回答。格式要求：
1. 政策要点
2. 具体规定
3. 申请条件（如适用）
4. 办理流程（如适用）
5. 相关政策推荐（如适用）
"""
        
        final_result = await agent_service.call_agent(
            agent_name="summary_answer_agent",
            question=summary_prompt,
            session_id=execution_id,
            context={"mode": "knowledge_summary", "routing": routing_decision.__dict__}
        )
        
        self._record_execution_step(
            execution_id,
            "summary_answer_agent",
            "knowledge_summary",
            ["knowledge_retrieval_agent"],
            "completed",
            {"result": final_result}
        )
        
        return {
            "answer": final_result.get("answer", final_result.get("response", "抱歉，无法处理您的问题。")),
            "execution_mode": "knowledge_retrieval",
            "routing_decision": routing_decision.__dict__,
            "agents_used": ["intelligent_routing_agent", "knowledge_retrieval_agent", "summary_answer_agent"],
            "knowledge_sources": knowledge_result.get("sources", []),
            "graph_entities": []
        }
    
    async def _execute_graph_enhanced_dag(
        self,
        instance: TeamInstance,
        execution_id: str,
        user_question: str,
        routing_decision: RoutingDecision,
        context: Optional[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """执行图谱增强DAG（并行执行知识库和图谱检索）"""
        
        logger.info("执行图谱增强模式DAG")
        
        # 并行执行知识库检索和图谱检索
        knowledge_task = agent_service.call_agent(
            agent_name="knowledge_retrieval_agent",
            question=user_question,
            session_id=execution_id,
            context={"mode": "policy_search", "routing": routing_decision.__dict__}
        )
        
        graph_task = agent_service.call_agent(
            agent_name="knowledge_graph_agent", 
            question=user_question,
            session_id=execution_id,
            context={"mode": "graph_search", "routing": routing_decision.__dict__}
        )
        
        # 等待并行任务完成
        knowledge_result, graph_result = await asyncio.gather(
            knowledge_task, graph_task, return_exceptions=True
        )
        
        # 记录执行步骤
        self._record_execution_step(
            execution_id,
            "knowledge_retrieval_agent",
            "policy_search",
            ["intelligent_routing_agent"],
            "completed" if not isinstance(knowledge_result, Exception) else "failed",
            {"result": knowledge_result if not isinstance(knowledge_result, Exception) else {"error": str(knowledge_result)}}
        )
        
        self._record_execution_step(
            execution_id,
            "knowledge_graph_agent",
            "graph_search", 
            ["intelligent_routing_agent"],
            "completed" if not isinstance(graph_result, Exception) else "failed",
            {"result": graph_result if not isinstance(graph_result, Exception) else {"error": str(graph_result)}}
        )
        
        # 处理异常结果
        if isinstance(knowledge_result, Exception):
            logger.warning(f"知识库检索失败: {knowledge_result}")
            knowledge_result = {"documents": [], "error": str(knowledge_result)}
            
        if isinstance(graph_result, Exception):
            logger.warning(f"图谱检索失败: {graph_result}")
            graph_result = {"entities": [], "relationships": [], "error": str(graph_result)}
        
        # 执行总结回答
        summary_prompt = f"""
用户问题：{user_question}

知识库检索结果：
{knowledge_result.get('documents', [])}

知识图谱检索结果：
实体: {graph_result.get('entities', [])}
关系: {graph_result.get('relationships', [])}

路由决策：{routing_decision.reasoning}

请基于知识库和知识图谱的信息，提供全面、结构化的回答。特别关注：
1. 政策要点和具体规定
2. 政策间的关联关系
3. 相关实体和流程
4. 完整的操作指南
"""
        
        final_result = await agent_service.call_agent(
            agent_name="summary_answer_agent",
            question=summary_prompt,
            session_id=execution_id,
            context={"mode": "graph_enhanced_summary", "routing": routing_decision.__dict__}
        )
        
        self._record_execution_step(
            execution_id,
            "summary_answer_agent", 
            "graph_enhanced_summary",
            ["knowledge_retrieval_agent", "knowledge_graph_agent"],
            "completed",
            {"result": final_result}
        )
        
        return {
            "answer": final_result.get("answer", final_result.get("response", "抱歉，无法处理您的问题。")),
            "execution_mode": "graph_enhanced",
            "routing_decision": routing_decision.__dict__,
            "agents_used": ["intelligent_routing_agent", "knowledge_retrieval_agent", "knowledge_graph_agent", "summary_answer_agent"],
            "knowledge_sources": knowledge_result.get("sources", []),
            "graph_entities": graph_result.get("entities", []),
            "graph_relationships": graph_result.get("relationships", [])
        }
    
    def _parse_routing_decision(self, routing_result: Dict[str, Any]) -> RoutingDecision:
        """解析路由决策结果"""
        try:
            # 尝试从结果中提取JSON
            response_text = routing_result.get("response", routing_result.get("answer", ""))
            
            # 查找JSON内容
            import re
            json_match = re.search(r'\{[^}]*\}', response_text)
            if json_match:
                decision_data = json.loads(json_match.group())
            else:
                # 如果没有找到JSON，使用默认解析
                decision_data = self._parse_text_decision(response_text)
            
            execution_mode = ExecutionMode(decision_data.get("execution_mode", "knowledge_retrieval"))
            
            return RoutingDecision(
                execution_mode=execution_mode,
                use_knowledge_retrieval=decision_data.get("use_knowledge_retrieval", True),
                use_graph_retrieval=decision_data.get("use_graph_retrieval", False),
                reasoning=decision_data.get("reasoning", "默认决策"),
                confidence=float(decision_data.get("confidence", 0.8))
            )
            
        except Exception as e:
            logger.warning(f"解析路由决策失败: {e}, 使用默认决策")
            return RoutingDecision(
                execution_mode=ExecutionMode.KNOWLEDGE_RETRIEVAL,
                use_knowledge_retrieval=True,
                use_graph_retrieval=False,
                reasoning="解析失败，使用默认模式",
                confidence=0.5
            )
    
    def _parse_text_decision(self, text: str) -> Dict[str, Any]:
        """从文本中解析决策信息"""
        # 简单的文本解析逻辑
        text_lower = text.lower()
        
        if any(keyword in text_lower for keyword in ["问候", "你好", "闲聊", "常识"]):
            mode = "direct_answer"
            use_knowledge = False
            use_graph = False
        elif any(keyword in text_lower for keyword in ["关系", "关联", "复杂", "分析"]):
            mode = "graph_enhanced"
            use_knowledge = True
            use_graph = True
        else:
            mode = "knowledge_retrieval"
            use_knowledge = True
            use_graph = False
        
        return {
            "execution_mode": mode,
            "use_knowledge_retrieval": use_knowledge,
            "use_graph_retrieval": use_graph,
            "reasoning": f"基于文本分析的决策: {text[:50]}...",
            "confidence": 0.7
        }
    
    def _record_execution_step(
        self,
        execution_id: str,
        agent_id: str,
        action: str,
        depends_on: List[str],
        status: str,
        result: Optional[Dict[str, Any]] = None,
        error: Optional[str] = None
    ):
        """记录执行步骤"""
        if execution_id not in self.execution_history:
            self.execution_history[execution_id] = []
        
        step = ExecutionStep(
            agent_id=agent_id,
            action=action,
            depends_on=depends_on,
            status=status,
            start_time=datetime.now(),
            end_time=datetime.now() if status in ["completed", "failed"] else None,
            result=result,
            error=error
        )
        
        self.execution_history[execution_id].append(step)
    
    async def get_execution_status(self, execution_id: str) -> Optional[Dict[str, Any]]:
        """获取执行状态"""
        if execution_id not in self.active_executions:
            return None
        
        execution = self.active_executions[execution_id]
        history = self.execution_history.get(execution_id, [])
        
        return {
            "execution_id": execution_id,
            "status": execution["status"],
            "start_time": execution["start_time"],
            "end_time": execution.get("end_time"),
            "question": execution["user_question"],
            "steps": [
                {
                    "agent_id": step.agent_id,
                    "action": step.action,
                    "status": step.status,
                    "start_time": step.start_time,
                    "end_time": step.end_time
                }
                for step in history
            ],
            "result": execution.get("result"),
            "error": execution.get("error")
        }

# 全局服务实例
policy_dag_executor = PolicyDAGExecutor()