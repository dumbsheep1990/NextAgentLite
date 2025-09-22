"""
Agno多层检索工具集
将多层检索服务集成到Agno框架中
"""
import logging
from typing import Dict, List, Optional, Any
from agno.tools.toolkit import Toolkit
from agno.tools import tool

from service.multilayer_retrieval_service import multilayer_retrieval_service
from service.qa_routing_service import qa_routing_service

logger = logging.getLogger(__name__)


class MultilayerRetrievalTools(Toolkit):
    """多层检索工具集 - 支持四层路由架构"""
    
    def __init__(self):
        super().__init__(name="multilayer_retrieval_tools")
        self.multilayer_service = multilayer_retrieval_service
        self.routing_service = qa_routing_service
        self._initialized = False
        
    async def _ensure_initialized(self):
        """确保服务已初始化"""
        if not self._initialized:
            await self.multilayer_service.initialize()
            await self.routing_service.initialize()
            self._initialized = True
            
    @tool
    async def route_and_retrieve(
        self, 
        query: str, 
        knowledge_base_id: str,
        session_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        执行路由决策并进行多层检索
        
        这是Agno框架中的主要入口，完成：
        1. 路由决策（调用qa_routing_service）
        2. 多层检索（调用multilayer_retrieval_service）
        3. 结果聚合
        
        Args:
            query: 用户查询
            knowledge_base_id: 知识库ID
            session_id: 会话ID
            
        Returns:
            包含答案和检索信息的字典
        """
        await self._ensure_initialized()
        
        try:
            logger.info(f"[AGNO_MULTILAYER] 开始处理查询: {query}")
            
            # 1. 执行路由决策
            from models.qa_routing import QARouteQuery
            
            route_query = QARouteQuery(
                knowledge_base_id=knowledge_base_id,
                query=query,
                use_semantic=True
            )
            
            routing_response = await self.routing_service.search_qa_routes(
                query_data=route_query,
                session_id=session_id
            )
            
            logger.info(f"[AGNO_MULTILAYER] 路由层: {routing_response.routing_layer}")
            
            # 2. 构建路由决策
            routing_decision = self._build_routing_decision(routing_response)
            
            # 3. 执行多层检索
            retrieval_result = await self.multilayer_service.execute_multilayer_retrieval(
                query=query,
                routing_decision=routing_decision,
                knowledge_base_id=knowledge_base_id,
                session_id=session_id
            )
            
            # 4. 如果没有找到答案，生成默认回复
            if not retrieval_result.get("final_answer"):
                retrieval_result["final_answer"] = await self._generate_default_answer(
                    query, retrieval_result.get("retrieved_items", [])
                )
                
            logger.info(f"[AGNO_MULTILAYER] 执行层级: {retrieval_result.get('layers_executed')}")
            
            return {
                "answer": retrieval_result.get("final_answer"),
                "routing_info": {
                    "layer": routing_response.routing_layer,
                    "matched_rules": len(routing_response.matched_routes) if routing_response.matched_routes else 0
                },
                "retrieval_info": {
                    "layers_executed": retrieval_result.get("layers_executed", []),
                    "items_retrieved": len(retrieval_result.get("retrieved_items", [])),
                    "execution_time_ms": retrieval_result.get("execution_time_ms", 0)
                },
                "sources": retrieval_result.get("retrieved_items", [])[:5],  # 返回前5个来源
                "session_id": session_id
            }
            
        except Exception as e:
            logger.error(f"[AGNO_MULTILAYER] 路由检索失败: {e}")
            return {
                "answer": f"抱歉，处理您的查询时遇到了问题: {str(e)}",
                "error": str(e)
            }
            
    @tool
    async def execute_fixed_qa_retrieval(
        self,
        query: str,
        knowledge_base_id: str
    ) -> Optional[str]:
        """
        专门执行固定问答对检索
        
        Args:
            query: 查询文本
            knowledge_base_id: 知识库ID
            
        Returns:
            匹配的固定答案或None
        """
        await self._ensure_initialized()
        
        try:
            # 直接执行固定问答对检索
            result = await self.multilayer_service._execute_fixed_qa_cascade(
                query=query,
                knowledge_base_id=knowledge_base_id
            )
            
            if result and result.get("answer"):
                logger.info(f"[AGNO_MULTILAYER] 找到固定答案，相似度: {result.get('confidence')}")
                return result["answer"]
                
            return None
            
        except Exception as e:
            logger.error(f"[AGNO_MULTILAYER] 固定问答对检索失败: {e}")
            return None
            
    @tool
    async def execute_cascade_retrieval(
        self,
        query: str,
        knowledge_base_id: str,
        skip_layers: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """
        执行标准的四层级联检索
        
        Args:
            query: 查询文本
            knowledge_base_id: 知识库ID
            skip_layers: 要跳过的层级列表
            
        Returns:
            检索结果
        """
        await self._ensure_initialized()
        
        skip_layers = skip_layers or []
        
        # 构建默认的四层级联决策
        routing_decision = {
            "type": "default_cascade",
            "strategy": "full_cascade",
            "retrieval_layers": []
        }
        
        # 添加各层（除非被跳过）
        if "fixed_qa" not in skip_layers:
            routing_decision["retrieval_layers"].append({
                "layer": "fixed_qa",
                "knowledge_base_id": knowledge_base_id,
                "priority": 1
            })
            
        if "qa_dataset" not in skip_layers:
            routing_decision["retrieval_layers"].append({
                "layer": "qa_dataset",
                "datasets": ["*"],
                "priority": 2
            })
            
        if "knowledge_base" not in skip_layers:
            routing_decision["retrieval_layers"].append({
                "layer": "knowledge_base",
                "collections": [knowledge_base_id],
                "priority": 3
            })
            
        if "agent" not in skip_layers:
            routing_decision["retrieval_layers"].append({
                "layer": "agent",
                "agents": ["summary_answer_agent"],
                "priority": 4
            })
            
        # 执行级联检索
        result = await self.multilayer_service.execute_multilayer_retrieval(
            query=query,
            routing_decision=routing_decision,
            knowledge_base_id=knowledge_base_id
        )
        
        return result
        
    def _build_routing_decision(self, routing_response) -> Dict[str, Any]:
        """从路由响应构建路由决策"""
        # 如果路由响应中已经有决策，直接使用
        if hasattr(routing_response, 'routing_decision') and routing_response.routing_decision:
            return routing_response.routing_decision
            
        # 否则构建默认决策
        if routing_response.routing_layer == "fixed_qa":
            # 固定问答对路由
            fixed_qa_ids = []
            if routing_response.matched_routes:
                fixed_qa_ids = [str(route.route.id) for route in routing_response.matched_routes]
                
            return {
                "type": "fixed_qa_retrieval",
                "fixed_qa_ids": fixed_qa_ids,
                "retrieval_params": {
                    "top_k": 5,
                    "threshold": 0.85
                }
            }
        else:
            # 默认级联路由
            return {
                "type": "default_cascade",
                "strategy": "full_cascade",
                "retrieval_layers": [
                    {
                        "layer": "fixed_qa",
                        "knowledge_base_id": routing_response.knowledge_base_id,
                        "priority": 1
                    },
                    {
                        "layer": "qa_dataset",
                        "datasets": ["*"],
                        "priority": 2
                    },
                    {
                        "layer": "knowledge_base",
                        "collections": [routing_response.knowledge_base_id],
                        "priority": 3
                    },
                    {
                        "layer": "agent",
                        "agents": ["summary_answer_agent"],
                        "priority": 4
                    }
                ]
            }
            
    async def _generate_default_answer(
        self, 
        query: str, 
        retrieved_items: List[Dict[str, Any]]
    ) -> str:
        """生成默认答案"""
        if not retrieved_items:
            return f"抱歉，我无法找到与您的问题 '{query}' 相关的信息。请尝试换一种方式提问。"
            
        # 如果有检索结果但没有直接答案，尝试总结
        try:
            from service.agent_service import agent_service
            
            # 构建上下文
            context_items = []
            for item in retrieved_items[:5]:  # 最多使用前5个结果
                if item.get("type") == "knowledge_base":
                    context_items.extend([i.get("content", "") for i in item.get("items", [])])
                elif item.get("content"):
                    context_items.append(item["content"])
                    
            context = "\n\n".join(context_items[:3])  # 限制上下文长度
            
            # 调用总结Agent
            prompt = f"""基于以下信息回答用户问题：

问题：{query}

相关信息：
{context}

请提供简洁准确的回答。"""
            
            result = await agent_service.call_agent(
                agent_name="summary_answer_agent",
                question=prompt
            )
            
            if result:
                return result.get("content", result)
                
        except Exception as e:
            logger.error(f"[AGNO_MULTILAYER] 生成默认答案失败: {e}")
            
        return f"基于检索结果，我找到了{len(retrieved_items)}条相关信息，但无法直接回答您的问题。建议您查看具体的文档内容。"


# 创建工具集实例
multilayer_retrieval_tools = MultilayerRetrievalTools()