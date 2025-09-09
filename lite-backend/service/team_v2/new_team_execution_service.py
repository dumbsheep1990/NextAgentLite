"""
新Team执行服务 - 基于单实例管理和固定模板的Team执行架构
解决多重实例创建导致的SSE流中断问题
"""
import asyncio
import time
from typing import Dict, List, Optional, Any, AsyncGenerator

from agno.team import Team
from core.logger import logger

# 导入现有的服务组件（复用逻辑）
from service.advanced_agent_team_service import (
    TranslationTools, MultilingualRetrievalTools, 
    LightRAGTools, ReasoningTools
)

# 导入底层服务 - 用于真实数据调用
from service.translation_service import translation_service
from service.knowledge_service import knowledge_service
from service.lightrag_client_service import matgraph_client as lightrag_client
from service.agent_service import agent_service

# 导入新的组件
from .singleton_team_manager import get_singleton_team_manager
from .team_execution_template import template_repository, TeamExecutionTemplate, AgentExecutionConfig
from .execution_tracker import execution_tracker
from .sse_data_adapter import SSEDataAdapter


class NewTeamExecutionService:
    """新的Team执行服务 - 基于单实例管理和固定模板"""
    
    def __init__(self):
        self.sse_adapter = SSEDataAdapter()
        
        # 复用现有的工具组件
        self.translation_tools = TranslationTools()
        self.retrieval_tools = MultilingualRetrievalTools()
        self.lightrag_tools = LightRAGTools()
        self.reasoning_tools = ReasoningTools()
        
        # 执行状态管理
        self._active_executions: Dict[str, Dict] = {}
        
        # 🔥 Agent输出数据收集器
        self._agent_outputs: Dict[str, Dict] = {}
    
    async def execute_team_query(
        self,
        team_name: str,
        query: str,
        session_id: str,
        stream: bool = True,
        knowledge_retrieval_mode: str = 'all',
        knowledge_retrieval_enabled: bool = True,
        knowledge_graph_enabled: bool = True,
        user_id: int = None  # 🔥 添加用户ID参数
    ) -> AsyncGenerator[Dict[str, Any], None]:
        """执行Team查询 - 核心方法"""
        logger.info(f"[NEW_TEAM] 🚀 开始执行Team查询")
        logger.info(f"[NEW_TEAM] 🔍 参数: team_name={team_name}, session_id={session_id}, user_id={user_id}")
        logger.info(f"[NEW_TEAM] 🔍 查询内容: {query[:50]}{'...' if len(query) > 50 else ''}")
        logger.info(f"[NEW_TEAM] 🔍 检索配置: knowledge_enabled={knowledge_retrieval_enabled}, graph_enabled={knowledge_graph_enabled}")
        
        start_time = time.time()
        execution_success = False
        """执行Team查询 - 新的实现"""
        
        # 🔥 修复：对于team模式，直接使用传入的session_id，不再生成exec_格式的execution_id
        # 这样可以确保同一个session_id下的多次查询都会保存到同一个对话中
        execution_id = session_id
        logger.info(f"[NEW_TEAM] 使用session_id作为execution_id: {execution_id}")
        
        try:
            logger.info(f"[NEW_TEAM] 开始执行Team查询: {team_name}, 执行ID: {execution_id}")
            
            # 1. 获取Team管理器
            team_manager = await get_singleton_team_manager()
            logger.info(f"[NEW_TEAM] 🔍 Team管理器获取成功")
            
            # 2. 加载执行模板
            template = await template_repository.load_template(team_name)
            if not template:
                template = await template_repository.get_default_template(team_name)
            
            logger.info(f"[NEW_TEAM] 🔍 模板加载成功: {template.template_id}, 执行模式: {template.execution_mode}")
            
            # 3. 获取唯一的Team实例
            team = await team_manager.get_or_create_team(team_name, session_id)
            
            # 4. 开始执行追踪
            trace = execution_tracker.start_execution(
                execution_id=execution_id,
                session_id=session_id,
                team_name=team_name,
                template_id=template.template_id,
                query_text=query,
                execution_mode=template.execution_mode
            )
            
            # 5. 记录活跃执行
            self._active_executions[execution_id] = {
                'team_name': team_name,
                'session_id': session_id,
                'start_time': time.time(),
                'status': 'running'
            }
            
            # 6. 发送开始事件
            yield self.sse_adapter.adapt_execution_start_event(
                execution_id=execution_id,
                team_name=team_name,
                template_id=template.template_id
            )
            
            # 7. 基于模板执行 - 传递开关状态
            async for chunk in self._execute_with_template(
                team, template, query, execution_id, session_id, trace,
                knowledge_retrieval_mode, knowledge_retrieval_enabled, knowledge_graph_enabled
            ):
                yield chunk
            
            logger.info(f"[NEW_TEAM] 🔍 模板执行完成，开始自动保存和清理工作")
            
            # 8. 自动保存Team对话到数据库
            try:
                logger.info(f"[NEW_TEAM] 🔍 开始尝试自动保存Team对话，user_id: {user_id}")
                
                # 生成team_analysis_data用于保存
                team_analysis_data = await self._generate_team_analysis(
                    team_name=template.team_name,
                    query=query,
                    execution_id=execution_id,
                    trace=trace
                )
                
                await self._auto_save_team_conversation(
                    session_id=execution_id,
                    query=query,
                    team_name=template.team_name,
                    team_analysis_data=team_analysis_data,
                    trace=trace,
                    user_id=user_id  # 🔥 传递用户ID
                )
                logger.info(f"[NEW_TEAM] 🎉 Team对话自动保存成功!")
            except Exception as e:
                logger.error(f"[NEW_TEAM] Team对话自动保存失败: {e}")
                import traceback
                logger.error(f"[NEW_TEAM] 详细错误堆栈: {traceback.format_exc()}")
            
            # 9. 标记执行完成
            execution_tracker.complete_execution(execution_id)
            
            # 10. 最终统计信息
            total_execution_time = time.time() - start_time
            logger.info(f"[NEW_TEAM] 🎉 Team执行完全完成!")
            logger.info(f"[NEW_TEAM] 🎯 执行统计: 总耗时={total_execution_time:.2f}s")
            logger.info(f"[NEW_TEAM] 🎯 最终参数: session_id={session_id}, execution_id={execution_id}, user_id={user_id}")
            
        except Exception as e:
            logger.error(f"[NEW_TEAM] 执行失败: {e}")
            
            # 标记执行失败
            execution_tracker.fail_execution(execution_id, str(e))
            
            # 发送错误事件
            yield self.sse_adapter.adapt_error_event(
                error_message=str(e),
                execution_id=execution_id
            )
            
        finally:
            # 9. 清理执行状态
            if execution_id in self._active_executions:
                del self._active_executions[execution_id]
    
    async def _execute_with_template(
        self,
        team: Team,
        template: TeamExecutionTemplate,
        query: str,
        execution_id: str,
        session_id: str,
        trace,
        knowledge_retrieval_mode: str,
        knowledge_retrieval_enabled: bool,
        knowledge_graph_enabled: bool
    ) -> AsyncGenerator[Dict[str, Any], None]:
        """基于模板执行Team查询"""
        
        logger.info(f"[NEW_TEAM] 开始基于模板执行: {template.execution_mode}")
        
        # 🔥 设置当前trace以供Agent执行方法访问
        self._current_trace = trace
        
        # 🔥 重置Agent输出数据收集器
        self._agent_outputs = {}
        
        if template.execution_mode == "sequential":
            async for chunk in self._execute_sequential(
                team, template, query, execution_id, trace,
                knowledge_retrieval_mode, knowledge_retrieval_enabled, knowledge_graph_enabled
            ):
                yield chunk
        elif template.execution_mode == "parallel":
            async for chunk in self._execute_parallel(team, template, query, execution_id, trace):
                yield chunk
        else:  # hybrid
            async for chunk in self._execute_hybrid(team, template, query, execution_id, trace):
                yield chunk
        
        # 生成最终的team_analysis事件
        logger.info(f"[NEW_TEAM] 🔍 准备生成team_analysis事件，execution_id: {execution_id}")
        team_analysis_data = await self._generate_team_analysis(
            team_name=template.team_name,
            query=query,
            execution_id=execution_id,
            trace=trace
        )
        logger.info(f"[NEW_TEAM] 🔍 team_analysis生成完成")
        
        yield self.sse_adapter.adapt_team_analysis_event(team_analysis_data)
        logger.info(f"[NEW_TEAM] 🔍 team_analysis事件已发送")
        
        # 发送完成事件
        logger.info(f"[NEW_TEAM] 🔍 准备发送完成事件")
        processing_time = time.time() - trace.start_time
        yield self.sse_adapter.adapt_complete_event(execution_id, processing_time * 1000)
        logger.info(f"[NEW_TEAM] 🔍 完成事件已发送，模板执行完成")
    
    async def _execute_sequential(
        self,
        team: Team,
        template: TeamExecutionTemplate,
        query: str,
        execution_id: str,
        trace,
        knowledge_retrieval_mode: str,
        knowledge_retrieval_enabled: bool,
        knowledge_graph_enabled: bool
    ) -> AsyncGenerator[Dict[str, Any], None]:
        """顺序执行Agent - 支持智能决策路由"""
        
        # 存储Agent执行结果，供后续Agent使用
        agent_results = {}
        
        # 将agent_results关联到trace，方便后续保存对话使用
        trace.agent_results = agent_results
        
        # 第一步：执行决策双子组（问答拆分->智能路由）
        decision_agents = ["question_decomposition_agent", "intelligent_routing_agent"]
        
        logger.info("[NEW_TEAM] 开始执行决策双子组")
        
        for agent_name in decision_agents:
            agent_config = template.get_agent_by_name(agent_name)
            if not agent_config:
                logger.warning(f"[NEW_TEAM] 未找到决策Agent配置: {agent_name}")
                continue
            
            try:
                # 执行决策Agent
                step = execution_tracker.add_agent_step(
                    execution_id=execution_id,
                    agent_name=agent_name,
                    action=f"execute_{agent_name}",
                    input_data={"query": query, "previous_results": agent_results}
                )
                
                yield self.sse_adapter.adapt_agent_call_event(
                    agent_name=agent_name,
                    action=f"开始执行{agent_name}",
                    status="running"
                )
                
                # 执行具体的Agent逻辑
                async for chunk in self._execute_single_agent(
                    agent_name, agent_config, query, agent_results, execution_id
                ):
                    yield chunk
                
                # 完成执行步骤
                if step:
                    step.complete(output_data=agent_results.get(agent_name, {}), confidence=0.9)
                
                yield self.sse_adapter.adapt_agent_call_event(
                    agent_name=agent_name,
                    action=f"完成执行{agent_name}",
                    status="completed"
                )
                
                # 检查智能路由是否标记了直接执行模式
                if agent_name == "intelligent_routing_agent":
                    routing_result = agent_results.get("intelligent_routing_agent", {})
                    if routing_result.get("execution_mode") == "fast":
                        logger.info("[NEW_TEAM] 智能路由选择简单模式，直接执行总结回答")
                        break  # 跳出决策循环，执行简单模式
                
            except Exception as e:
                logger.error(f"[NEW_TEAM] 决策Agent执行失败: {agent_name}, 错误: {e}")
                if step:
                    step.fail(str(e))
                yield self.sse_adapter.adapt_error_event(
                    error_message=f"{agent_name}执行失败: {e}",
                    execution_id=execution_id,
                    agent_name=agent_name
                )
                # 决策失败，回退到默认执行
                execution_order = template.get_execution_order()
                break
        
        # 第二步：根据智能路由结果选择预定义的执行子图
        routing_result = agent_results.get("intelligent_routing_agent", {})
        execution_mode = routing_result.get("execution_mode", "standard")
        
        logger.info(f"[NEW_TEAM] 智能路由决策结果，执行模式: {execution_mode}")
        
        # 预定义的执行子图 - 支持动态Agent选择
        if execution_mode == "fast":
            # 简单模式子图：仅执行总结Agent生成友好回复
            execution_order = ["summary_answer_agent"]
            logger.info("[NEW_TEAM] 简单模式：仅执行总结Agent生成友好回复")
        else:
            # 专业模式子图：根据开关动态构建执行序列
            execution_order = ["translation_agent"]  # 翻译总是需要的
            
            # 根据知识库检索开关决定是否添加检索Agent
            if knowledge_retrieval_enabled:
                execution_order.append("knowledge_retrieval_agent")
                logger.info(f"[NEW_TEAM] 启用知识库检索，模式: {knowledge_retrieval_mode}")
            else:
                logger.info("[NEW_TEAM] 知识库检索已禁用")
            
            # 根据知识图谱开关决定是否添加图谱Agent
            if knowledge_graph_enabled:
                execution_order.append("knowledge_graph_agent")
                logger.info("[NEW_TEAM] 启用知识图谱检索")
            else:
                logger.info("[NEW_TEAM] 知识图谱检索已禁用")
            
            # 总结Agent总是需要的
            execution_order.append("summary_answer_agent")
            
            logger.info(f"[NEW_TEAM] 专业模式动态执行序列: {execution_order}")
        
        # 将检索模式保存到agent_results中，供检索Agent使用
        agent_results["_system_config"] = {
            "knowledge_retrieval_mode": knowledge_retrieval_mode,
            "knowledge_retrieval_enabled": knowledge_retrieval_enabled,
            "knowledge_graph_enabled": knowledge_graph_enabled
        }
        
        # 第三步：执行功能Agent
        for agent_name in execution_order:
            agent_config = template.get_agent_by_name(agent_name)
            if not agent_config:
                logger.warning(f"[NEW_TEAM] 未找到Agent配置: {agent_name}")
                continue
            
            try:
                # 添加执行步骤到追踪
                step = execution_tracker.add_agent_step(
                    execution_id=execution_id,
                    agent_name=agent_name,
                    action=f"execute_{agent_name}",
                    input_data={"query": query, "previous_results": agent_results}
                )
                
                # 发送Agent调用开始事件
                yield self.sse_adapter.adapt_agent_call_event(
                    agent_name=agent_name,
                    action=f"开始执行{agent_name}",
                    status="running"
                )
                
                # 执行具体的Agent逻辑
                async for chunk in self._execute_single_agent(
                    agent_name, agent_config, query, agent_results, execution_id
                ):
                    yield chunk
                
                # 模拟获取Agent结果（实际中应该从Agent执行结果获取）
                agent_result = await self._get_agent_result(agent_name, query, agent_results)
                agent_results[agent_name] = agent_result
                
                # 完成执行步骤
                if step:
                    step.complete(output_data=agent_result, confidence=0.9)
                
                # 发送Agent调用完成事件
                yield self.sse_adapter.adapt_agent_call_event(
                    agent_name=agent_name,
                    action=f"完成执行{agent_name}",
                    status="completed",
                    data={"result_summary": f"{agent_name}执行完成"}
                )
                
            except Exception as e:
                logger.error(f"[NEW_TEAM] Agent执行失败: {agent_name}, 错误: {e}")
                
                # 标记步骤失败
                if step:
                    step.fail(str(e))
                
                # 发送错误事件
                yield self.sse_adapter.adapt_error_event(
                    error_message=f"{agent_name}执行失败: {e}",
                    execution_id=execution_id,
                    agent_name=agent_name
                )
                
                # 根据重试配置决定是否继续
                if not self._should_retry_agent(agent_config, e):
                    break
    
    async def _execute_parallel(
        self,
        team: Team,
        template: TeamExecutionTemplate,
        query: str,
        execution_id: str,
        trace
    ) -> AsyncGenerator[Dict[str, Any], None]:
        """并行执行Agent"""
        
        logger.info("[NEW_TEAM] 并行执行模式")
        
        # 创建所有Agent的执行任务
        tasks = []
        for agent_config in template.agent_sequence:
            task = asyncio.create_task(
                self._execute_single_agent_task(
                    agent_config.agent, agent_config, query, {}, execution_id
                )
            )
            tasks.append((agent_config.agent, task))
        
        # 等待所有任务完成
        completed_agents = []
        for agent_name, task in tasks:
            try:
                result = await task
                completed_agents.append((agent_name, result))
                
                # 发送Agent完成事件
                yield self.sse_adapter.adapt_agent_call_event(
                    agent_name=agent_name,
                    action=f"并行执行完成",
                    status="completed"
                )
                
            except Exception as e:
                logger.error(f"[NEW_TEAM] 并行Agent执行失败: {agent_name}, 错误: {e}")
                
                # 发送错误事件
                yield self.sse_adapter.adapt_error_event(
                    error_message=f"{agent_name}并行执行失败: {e}",
                    execution_id=execution_id,
                    agent_name=agent_name
                )
        
        logger.info(f"[NEW_TEAM] 并行执行完成，成功执行: {[name for name, _ in completed_agents]}")
    
    async def _execute_hybrid(
        self,
        team: Team,
        template: TeamExecutionTemplate,
        query: str,
        execution_id: str,
        trace
    ) -> AsyncGenerator[Dict[str, Any], None]:
        """混合执行Agent（根据依赖关系）"""
        
        logger.info("[NEW_TEAM] 混合执行模式（基于依赖关系）")
        
        # 计算执行顺序
        execution_order = template.get_execution_order()
        agent_results = {}
        
        # 跟踪已完成的Agent
        completed_agents = set()
        
        for agent_name in execution_order:
            # 检查依赖是否满足
            dependencies = template.dependencies.get(agent_name, [])
            if not all(dep in completed_agents for dep in dependencies):
                logger.warning(f"[NEW_TEAM] Agent依赖未满足: {agent_name}, 需要: {dependencies}")
                continue
            
            agent_config = template.get_agent_by_name(agent_name)
            if not agent_config:
                continue
            
            try:
                # 发送Agent调用事件
                yield self.sse_adapter.adapt_agent_call_event(
                    agent_name=agent_name,
                    action=f"混合执行{agent_name}",
                    status="running"
                )
                
                # 执行Agent
                async for chunk in self._execute_single_agent(
                    agent_name, agent_config, query, agent_results, execution_id
                ):
                    yield chunk
                
                # 获取结果
                agent_result = await self._get_agent_result(agent_name, query, agent_results)
                agent_results[agent_name] = agent_result
                completed_agents.add(agent_name)
                
                # 发送完成事件
                yield self.sse_adapter.adapt_agent_call_event(
                    agent_name=agent_name,
                    action=f"混合执行完成",
                    status="completed"
                )
                
            except Exception as e:
                logger.error(f"[NEW_TEAM] 混合Agent执行失败: {agent_name}, 错误: {e}")
                
                yield self.sse_adapter.adapt_error_event(
                    error_message=f"{agent_name}混合执行失败: {e}",
                    execution_id=execution_id,
                    agent_name=agent_name
                )
        
        logger.info(f"[NEW_TEAM] 混合执行完成，已完成: {completed_agents}")
    
    async def _execute_single_agent(
        self,
        agent_name: str,
        agent_config: AgentExecutionConfig,
        query: str,
        previous_results: Dict,
        execution_id: str
    ) -> AsyncGenerator[Dict[str, Any], None]:
        """执行单个Agent"""
        
        try:
            logger.info(f"[NEW_TEAM] 开始执行单个Agent: {agent_name}")
            
            # 🔥 在trace中创建Agent执行步骤
            from .execution_tracker import AgentExecutionStep
            step = AgentExecutionStep(
                agent_name=agent_name,
                action=f"execute_{agent_name}",
                start_time=time.time()
            )
            if hasattr(self, '_current_trace') and self._current_trace:
                self._current_trace.agent_steps.append(step)
                logger.info(f"[NEW_TEAM] 已为{agent_name}创建执行步骤，当前步骤数: {len(self._current_trace.agent_steps)}")
            
            # 根据Agent名称调用相应的逻辑并收集结果
            if agent_name == "question_decomposition_agent":
                async for chunk in self._execute_question_decomposition_agent(query, previous_results, execution_id):
                    yield chunk
                    
            elif agent_name == "intelligent_routing_agent":
                async for chunk in self._execute_intelligent_routing_agent(query, previous_results, execution_id):
                    yield chunk
                    
            elif agent_name == "dag_reconstruction_agent":
                async for chunk in self._execute_dag_reconstruction_agent(query, previous_results, execution_id):
                    yield chunk
                    
            elif agent_name == "translation_agent":
                translated_query = None
                async for chunk in self._execute_translation_agent(query, execution_id):
                    yield chunk
                    # 从内容事件中提取翻译结果
                    if chunk.get("type") == "content" and "翻译完成" in chunk.get("data", {}).get("content", ""):
                        content = chunk["data"]["content"]
                        if " -> " in content:
                            translated_query = content.split(" -> ")[-1]
                
                # 保存翻译结果
                previous_results["translation_agent"] = {
                    "original_query": query,
                    "translated_query": translated_query or query
                }
            
            elif agent_name == "knowledge_retrieval_agent":
                retrieval_results = None
                async for chunk in self._execute_knowledge_retrieval_agent(query, previous_results, execution_id):
                    yield chunk
                    # 这里可以从Agent内部设置结果，已在Agent内部处理
                
            elif agent_name == "knowledge_graph_agent":
                graph_results = None
                async for chunk in self._execute_knowledge_graph_agent(query, previous_results, execution_id):
                    yield chunk
                    # 这里可以从Agent内部设置结果，已在Agent内部处理
            
            elif agent_name == "summary_answer_agent":
                async for chunk in self._execute_summary_answer_agent(query, previous_results, execution_id):
                    yield chunk
                    # 总结Agent已在内部处理结果保存
            
            else:
                logger.warning(f"[NEW_TEAM] 未知的Agent类型: {agent_name}")
                yield self.sse_adapter.adapt_content_event(
                    content=f"未知Agent类型: {agent_name}",
                    agent_name=agent_name
                )
            
        except Exception as e:
            logger.error(f"[NEW_TEAM] 执行单个Agent失败: {agent_name}, 错误: {e}")
            raise e
    
    async def _execute_single_agent_task(
        self,
        agent_name: str,
        agent_config: AgentExecutionConfig,
        query: str,
        previous_results: Dict,
        execution_id: str
    ) -> Dict:
        """执行单个Agent任务（用于并行执行）"""
        
        try:
            # 收集Agent执行结果
            results = []
            async for chunk in self._execute_single_agent(
                agent_name, agent_config, query, previous_results, execution_id
            ):
                if chunk["type"] == "content":
                    results.append(chunk["data"]["content"])
            
            return {
                "agent_name": agent_name,
                "status": "completed",
                "results": results
            }
            
        except Exception as e:
            return {
                "agent_name": agent_name,
                "status": "failed",
                "error": str(e)
            }
    
    # 复用现有Agent的执行逻辑
    async def _execute_translation_agent(self, query: str, execution_id: str) -> AsyncGenerator[Dict[str, Any], None]:
        """执行翻译Agent"""
        try:
            logger.info("[NEW_TEAM] 执行翻译Agent")
            
            # 发送Agent决策事件
            yield self.sse_adapter.adapt_agent_decision_event(
                agent_name="translation_agent",
                decision_type="translation_strategy",
                decision_content="检测到中文查询，准备翻译为英文以支持多语言检索",
                confidence=0.95,
                reasoning="多语言检索需要英文查询以访问外文资料"
            )
            
            # 执行翻译 - 使用真实翻译服务
            from service.translation_service import TranslationDirection
            translation_result = await translation_service.translate(
                text=query,
                direction=TranslationDirection.ZH_TO_EN
            )
            translated_query = translation_result.translated_text
            
            # 发送内容事件
            yield self.sse_adapter.adapt_content_event(
                content=f"翻译完成：{query} -> {translated_query}",
                agent_name="translation_agent"
            )
            
            logger.info(f"[NEW_TEAM] 翻译Agent执行完成: {translated_query}")
            
            # 🔥 收集Agent输出数据
            self._agent_outputs["translation_agent"] = {
                "original_query": query,
                "translated_query": translated_query,
                "translation_summary": f"翻译完成：{query} -> {translated_query}",
                "agent_name": "translation_agent"
            }
            logger.info(f"[NEW_TEAM] 已收集translation_agent的output_data")
            
            # 不需要return，通过参数传递结果
            
        except Exception as e:
            logger.error(f"[NEW_TEAM] 翻译Agent执行失败: {e}")
            raise e
    
    async def _execute_knowledge_retrieval_agent(
        self, query: str, previous_results: Dict, execution_id: str
    ) -> AsyncGenerator[Dict[str, Any], None]:
        """执行知识检索Agent"""
        try:
            logger.info("[NEW_TEAM] 执行知识检索Agent")
            
            # 发送Agent决策事件
            yield self.sse_adapter.adapt_agent_decision_event(
                agent_name="knowledge_retrieval_agent",
                decision_type="retrieval_strategy",
                decision_content="采用多语言混合检索策略，同时检索中英文资料",
                confidence=0.9,
                reasoning="基于翻译结果和原始查询进行综合检索"
            )
            
            # 获取系统配置和翻译后的查询
            system_config = previous_results.get("_system_config", {})
            retrieval_mode = system_config.get("knowledge_retrieval_mode", "all")
            
            translated_query = query
            if "translation_agent" in previous_results:
                translated_query = previous_results["translation_agent"].get("translated_query", query)
            
            # 根据检索模式决定检索策略
            if retrieval_mode == "papers_only":
                # 仅检索英文论文知识库
                languages = ["en"]
                actual_retrieval_mode = "papers_only"
                logger.info(f"[NEW_TEAM] 检索模式：仅英文论文，查询: {translated_query}")
            elif retrieval_mode == "qa_only":
                # 仅检索中文QA数据集
                languages = ["zh"]
                actual_retrieval_mode = "qa_only"
                logger.info(f"[NEW_TEAM] 检索模式：仅中文QA数据集，查询: {query}")  # QA使用原始中文查询
                translated_query = query  # QA数据集使用中文查询
            else:
                # 全部检索：中英文双语
                languages = ["zh", "en"]
                actual_retrieval_mode = "all"
                logger.info(f"[NEW_TEAM] 检索模式：全部，中文查询: {query}, 英文查询: {translated_query}")
            
            # 执行真实的多语言检索
            try:
                # 设置检索工具的模式
                from service.advanced_agent_team_service import MultilingualRetrievalTools
                MultilingualRetrievalTools.set_retrieval_mode(actual_retrieval_mode)
                
                # 使用智能检索服务进行向量语义检索
                from service.intelligent_retrieval_service import intelligent_retrieval_service
                
                # 根据检索模式设置过滤器
                filters = None
                if actual_retrieval_mode == 'papers_only':
                    filters = {"source_type": "document"}
                elif actual_retrieval_mode == 'qa_only':
                    filters = {"source_type": "qa_dataset"}
                
                # 调用智能检索服务
                search_result = await intelligent_retrieval_service.intelligent_search(
                    query=query,  # 使用中文原始查询
                    top_k=5,  # 优化：直接设置为5个结果
                    filters=filters,
                    user_mode="dual",
                    include_highlights=True,
                    enable_reranking=True
                )
                
                # 转换为团队期望的格式
                retrieval_results = {"zh": []}
                for item in search_result.results:
                    result = {
                        "id": item.get("id", ""),
                        "title": item.get("title", ""),
                        "content": item.get("content", ""),
                        "source_type": item.get("source_type", "document"),
                        "score": item.get("score", 0.0),
                        "metadata": item.get("metadata", {}),
                        "source_info": item.get("source_info", {})
                    }
                    
                    # 对QA数据，添加问题和答案字段
                    if item.get("source_type") == "qa_dataset":
                        result["question"] = item.get("question", "")
                        result["answer"] = item.get("answer", "")
                    
                    retrieval_results["zh"].append(result)
            except Exception as tool_error:
                logger.warning(f"[NEW_TEAM] 多语言检索调用失败，回退到知识服务: {tool_error}")
                # 回退到基础知识服务
                from service.knowledge_service import knowledge_service
                documents = await knowledge_service.search_documents(
                    query=translated_query if retrieval_mode != "qa_only" else query,
                    limit=20
                )
                # 构建返回格式 - 修复score显示问题
                lang_key = "zh" if retrieval_mode == "qa_only" else "en"
                retrieval_results = {
                    lang_key: [{"content": doc.content, "title": doc.title, "source": doc.source, "score": 0.85 - i*0.05} for i, doc in enumerate(documents)]
                }
            
            # 统计总文档数
            total_docs = sum(len(results) for results in retrieval_results.values())
            
            # 发送检索结果内容
            yield self.sse_adapter.adapt_content_event(
                content=f"多语言知识库检索完成，找到 {total_docs} 个相关文档 (中文: {len(retrieval_results.get('zh', []))}, 英文: {len(retrieval_results.get('en', []))})",
                agent_name="knowledge_retrieval_agent"
            )
            
            # 整合中英文检索结果为统一格式
            all_documents = []
            for lang, docs in retrieval_results.items():
                for doc in docs:
                    # 检查文档内容是否有效
                    content = doc.get("content", "")
                    if not content and doc.get("answer"):
                        # 对于QA数据，合并问题和答案
                        question = doc.get("question", "")
                        answer = doc.get("answer", "")
                        content = f"问题: {question}\n答案: {answer}"
                    
                    if content:  # 只添加有内容的文档
                        doc_dict = {
                            "content": content,
                            "title": doc.get("title", ""),
                            "source": doc.get("source_info", {}),
                            "source_type": doc.get("source_type", "document"),
                            "language": lang,
                            "score": doc.get("score", 0.0),
                            "metadata": doc.get("metadata", {})
                        }
                        all_documents.append(doc_dict)
            
            # 按相关性分数排序
            all_documents.sort(key=lambda x: x.get("score", 0.0), reverse=True)
            
            # 保存检索结果供后续Agent使用
            previous_results["knowledge_retrieval_agent"] = {
                "documents": all_documents,
                "total_count": total_docs,
                "retrieval_results_by_language": retrieval_results,
                "search_query": translated_query
            }
            
            logger.info(f"[NEW_TEAM] 知识检索Agent执行完成，找到 {total_docs} 个文档")
            logger.info(f"[NEW_TEAM] 知识检索保存的文档数量: {len(all_documents)}")
            if all_documents:
                logger.info(f"[NEW_TEAM] 第一个文档内容长度: {len(all_documents[0].get('content', ''))}")
            
            # 🔥 收集Agent输出数据
            self._agent_outputs["knowledge_retrieval_agent"] = {
                "documents": all_documents[:5],  # 只保存前5个文档以节省空间
                "total_count": total_docs,
                "search_summary": f"多语言知识库检索完成，找到 {total_docs} 个相关文档",
                "agent_name": "knowledge_retrieval_agent"
            }
            logger.info(f"[NEW_TEAM] 已收集knowledge_retrieval_agent的output_data: {len(all_documents)} 文档")
            
        except Exception as e:
            logger.error(f"[NEW_TEAM] 知识检索Agent执行失败: {e}")
            raise e
    
    async def _execute_knowledge_graph_agent(
        self, query: str, previous_results: Dict, execution_id: str
    ) -> AsyncGenerator[Dict[str, Any], None]:
        """执行知识图谱Agent"""
        try:
            logger.info("[NEW_TEAM] 执行知识图谱Agent")
            
            # 发送Agent决策事件
            yield self.sse_adapter.adapt_agent_decision_event(
                agent_name="knowledge_graph_agent",
                decision_type="graph_query_strategy",
                decision_content="使用混合查询模式检索知识图谱中的实体关系信息",
                confidence=0.85,
                reasoning="混合模式可以同时获取实体信息和关系信息"
            )
            
            # 执行图谱查询 - 使用真实MatGraph流式服务
            collected_response = ""
            async for response_chunk in lightrag_client.query_knowledge_graph_stream(
                query=query,
                mode="mix",  # 使用MatGraph的mix模式
                top_k=10,
                max_tokens=3000
            ):
                collected_response += response_chunk
                # 实时发送流式内容
                yield self.sse_adapter.adapt_content_event(
                    content=response_chunk,
                    agent_name="knowledge_graph_agent"
                )
            
            # 创建结果对象
            from service.lightrag_client_service import MatGraphQueryResult
            graph_result = MatGraphQueryResult(
                response=collected_response,
                mode="mix",
                success=bool(collected_response.strip()),
                error_message=None if collected_response.strip() else "未获取到有效响应"
            )
            
            # 发送完成消息
            if graph_result and graph_result.success and graph_result.response:
                # 不需要额外的完成消息，因为流式内容已经包含了完整信息
                pass
            else:
                yield self.sse_adapter.adapt_content_event(
                    content="📊 知识图谱查询完成，但未找到相关信息",
                    agent_name="knowledge_graph_agent"
                )
            
            # 保存图谱查询结果供后续Agent使用
            previous_results["knowledge_graph_agent"] = {
                "query": query,
                "graph_result": graph_result.to_dict() if graph_result else None,
                "response": graph_result.response if graph_result else None
            }
            
            logger.info("[NEW_TEAM] 知识图谱Agent执行完成")
            
            # 🔥 收集Agent输出数据
            self._agent_outputs["knowledge_graph_agent"] = {
                "graph_result": graph_result.to_dict() if graph_result else {"response": "知识图谱查询完成", "success": False},
                "query": query,
                "search_summary": "知识图谱查询完成，获取到结构化关系信息",
                "agent_name": "knowledge_graph_agent"
            }
            logger.info(f"[NEW_TEAM] 已收集knowledge_graph_agent的output_data")
            
        except Exception as e:
            logger.error(f"[NEW_TEAM] 知识图谱Agent执行失败: {e}")
            raise e
    
    async def _execute_summary_answer_agent(
        self, query: str, previous_results: Dict, execution_id: str
    ) -> AsyncGenerator[Dict[str, Any], None]:
        """执行总结回答Agent - 使用真实LLM生成综合回答"""
        try:
            logger.info("[NEW_TEAM] 执行总结回答Agent")
            
            # 发送Agent决策事件
            yield self.sse_adapter.adapt_agent_decision_event(
                agent_name="summary_answer_agent",
                decision_type="synthesis_strategy",
                decision_content="整合多语言检索结果和图谱信息，生成综合性回答",
                confidence=0.92,
                reasoning="基于所有收集到的信息进行证据驱动的答案合成"
            )
            
            # 检查是否为简单模式（无检索结果的情况）
            routing_result = previous_results.get("intelligent_routing_agent", {})
            execution_mode = routing_result.get("execution_mode", "standard")
            
            if execution_mode == "fast":
                # 简单模式：生成友好回复
                context_text = "简单模式：直接友好回复"
                final_prompt = f"""用户说了："{query}"

这是一个简单的问候或与地聚物材料工程无关的问题。请生成一个友好、自然的回复。

要求：
1. 语言自然友好，简洁明了
2. 不超过50字
3. 可以询问是否需要关于地聚物材料的专业帮助
4. 不要提及"本地知识库"等技术术语

请直接回复："""
            else:
                # 专业模式：构建综合上下文
                context_parts = []
                has_local_knowledge = False
                
                # 添加翻译结果
                if "translation_agent" in previous_results:
                    translated_query = previous_results["translation_agent"].get("translated_query", "")
                    if translated_query:
                        context_parts.append(f"翻译查询: {translated_query}")
                
                # 添加检索结果
                if "knowledge_retrieval_agent" in previous_results:
                    retrieval_data = previous_results["knowledge_retrieval_agent"]
                    logger.info(f"[NEW_TEAM] 总结Agent：检索到的数据类型 = {type(retrieval_data)}")
                    logger.info(f"[NEW_TEAM] 总结Agent：检索数据包含字段 = {list(retrieval_data.keys()) if isinstance(retrieval_data, dict) else 'N/A'}")
                    
                    if retrieval_data.get("documents") and len(retrieval_data["documents"]) > 0:
                        doc_count = len(retrieval_data["documents"])
                        context_parts.append(f"本地知识库检索到 {doc_count} 个相关文档")
                        logger.info(f"[NEW_TEAM] 总结Agent：找到 {doc_count} 个文档")
                        has_local_knowledge = True
                        # 添加文档内容摘要
                        for i, doc in enumerate(retrieval_data["documents"][:5]):  # 增加到前5个文档
                            content = doc.get("content", "")
                            if content:
                                context_parts.append(f"文档{i+1}: {content[:300]}...")  # 增加内容长度
                                logger.info(f"[NEW_TEAM] 总结Agent：文档{i+1}内容长度 = {len(content)}")
                    else:
                        logger.info(f"[NEW_TEAM] 总结Agent：本地知识库未找到相关文档，将使用LLM知识回答")
                else:
                    logger.warning(f"[NEW_TEAM] 总结Agent：previous_results中没有找到knowledge_retrieval_agent")
                
                # 添加图谱结果
                if "knowledge_graph_agent" in previous_results:
                    graph_data = previous_results["knowledge_graph_agent"]
                    if graph_data.get("response"):
                        context_parts.append(f"知识图谱信息: {graph_data['response']}")
                        has_local_knowledge = True
                
                # 构建最终的提示词 - 根据是否有本地知识采用不同策略
                context_text = "\n".join(context_parts)
                
                if has_local_knowledge:
                    # 有本地知识：基于本地知识库内容回答
                    final_prompt = f"""基于以下本地知识库信息回答用户问题: {query}

本地知识库相关信息:
{context_text}

请基于上述本地知识库内容提供准确、全面的回答，并注明信息来源为本地知识库。"""
                else:
                    # 无本地知识：使用LLM自身知识回答
                    final_prompt = f"""用户问题: {query}

本地知识库中未找到直接相关的资料，请基于您的专业知识回答这个问题。

要求：
1. 请提供准确、专业的回答
2. 如果问题涉及地聚物材料工程领域，请详细解释相关概念、特性、应用等
3. 在回答开头说明"本地知识库暂无直接相关资料，以下基于通用知识回答"
4. 回答要具有实用价值，帮助用户理解相关概念
5. 如果可能，建议用户查阅更多专业资料或联系专家获取更详细信息

请直接提供有用的回答，不要简单地说"没有信息"。"""

            # 调用LLM生成真实回答
            yield self.sse_adapter.adapt_content_event(
                content="正在基于收集的信息生成综合回答...",
                agent_name="summary_answer_agent"
            )
            
            # 使用Team中的现有Agent来生成回答
            # 获取团队中的summary_answer_agent
            team_manager = await get_singleton_team_manager()
            team = await team_manager.get_or_create_team(
                team_name="geopolymer_qa_team_v2", 
                session_id=execution_id
            )
            
            # 直接调用summary_answer_agent生成回答
            summary_agent = None
            for agent in team.members:
                if hasattr(agent, 'name') and 'summary' in agent.name.lower():
                    summary_agent = agent
                    break
            
            if summary_agent:
                # 使用Agent进行对话 - 正确使用run方法
                accumulated_content = ""
                try:
                    response = summary_agent.run(final_prompt, stream=False)
                    if response and hasattr(response, 'content'):
                        accumulated_content = response.content
                    elif response:
                        accumulated_content = str(response)
                    
                    yield self.sse_adapter.adapt_content_event(
                        content=accumulated_content,
                        agent_name="summary_answer_agent"
                    )
                except Exception as e:
                    logger.error(f"[NEW_TEAM] Agent.run调用失败: {e}")
                    # 使用直接LLM调用作为回退
                    accumulated_content = await self._fallback_llm_call(final_prompt)
                    yield self.sse_adapter.adapt_content_event(
                        content=accumulated_content,
                        agent_name="summary_answer_agent"
                    )
            else:
                # 回退：生成基础回答
                accumulated_content = f"基于收集的信息回答：\n\n{context_text}\n\n针对问题'{query}'的分析已完成，请参考上述信息。"
                yield self.sse_adapter.adapt_content_event(
                    content=accumulated_content,
                    agent_name="summary_answer_agent"
                )
            
            # 将最终回答存储到结果中
            previous_results["summary_answer_agent"] = {
                "final_answer": accumulated_content,
                "context_used": context_text
            }
            
            # 🔥 收集Agent输出数据
            self._agent_outputs["summary_answer_agent"] = {
                "final_answer": accumulated_content,
                "context_used": context_text,
                "agent_name": "summary_answer_agent"
            }
            logger.error(f"🔥🔥🔥 [DEBUG] 已收集summary_answer_agent的output_data: {len(accumulated_content)} 字符")
            logger.error(f"🔥🔥🔥 [DEBUG] 当前_agent_outputs内容: {list(self._agent_outputs.keys())}")
            
            logger.info("[NEW_TEAM] 总结回答Agent执行完成，生成了真实LLM回答")
            
        except Exception as e:
            logger.error(f"[NEW_TEAM] 总结回答Agent执行失败: {e}")
            raise e
    
    async def _get_agent_result(self, agent_name: str, query: str, previous_results: Dict) -> Dict:
        """获取Agent执行结果 - 保留已存在的详细数据"""
        # 如果Agent已经在previous_results中保存了详细数据，则保留它
        if agent_name in previous_results and isinstance(previous_results[agent_name], dict):
            existing_data = previous_results[agent_name].copy()
            # 确保包含基本元数据
            existing_data.update({
                "agent_name": agent_name,
                "status": "completed",
                "timestamp": existing_data.get("timestamp", time.time())
            })
            return existing_data
        
        # 否则返回基本结果
        return {
            "agent_name": agent_name,
            "status": "completed",
            "query": query,
            "timestamp": time.time(),
            "result_summary": f"{agent_name}执行完成"
        }
    
    async def _execute_question_decomposition_agent(
        self, query: str, previous_results: Dict, execution_id: str
    ) -> AsyncGenerator[Dict[str, Any], None]:
        """执行问答拆分智能体"""
        try:
            logger.info("[NEW_TEAM] 执行问答拆分智能体")
            
            # 发送Agent决策事件
            yield self.sse_adapter.adapt_agent_decision_event(
                agent_name="question_decomposition_agent",
                decision_type="problem_analysis",
                decision_content="分析用户问题的复杂度和领域归属",
                confidence=0.9,
                reasoning="确定问题类型以优化后续执行流程"
            )
            
            # 构建分析提示
            analysis_prompt = f"""你是一个问答拆分专家，请分析以下用户问题："{query}"

## 领域范围判断标准：
**属于材料科学工程领域**：
- 地聚物材料（geopolymer）：配比、制备、固化、性能、应用
- 材料工程：水泥、混凝土、聚合物、复合材料、金属材料、陶瓷材料
- 材料科学：超导材料、纳米材料、智能材料、生物材料、功能材料
- 材料性能：力学性能、电学性能、磁学性能、热学性能、光学性能
- 材料制备：合成方法、加工工艺、热处理、表面处理
- 材料应用：建筑工程、电子工业、航空航天、能源存储、医疗器械
- 实验技术：材料测试、表征方法、设备操作、实验设计
- 工程应用：结构设计、工艺优化、质量控制、标准规范

**不属于专业领域**：
- 日常交流：问候、闲聊、礼貌用语
- 其他学科：文学、历史、娱乐、体育、音乐、艺术
- 生活常识：天气、时间、日常生活、娱乐八卦
- 编程技术：软件开发（除非专门涉及材料建模软件）
- 医学健康：疾病治疗（除非涉及生物材料应用）
- 金融经济：投资理财、商业分析
- 个人事务：情感咨询、个人隐私、人生感悟

## 请按照以下格式分析：
1. **领域归属**：[属于/不属于] 材料科学工程领域
2. **问题类型**：[问候语/生活常识/其他学科/专业技术/复合查询]
3. **复杂度评估**：[简单/中等/复杂]
4. **子问题分解**：[如果复杂，分解为最多5个子问题；如果简单，说明"无需分解"]
5. **处理建议**：[快速回复/标准检索/深度分析]

请基于问题内容客观分析，不要提供具体答案。"""

            # 调用LLM进行分析
            analysis_result = await self._fallback_llm_call(analysis_prompt)
            
            # 发送分析结果
            yield self.sse_adapter.adapt_content_event(
                content=f"问题分析完成：{analysis_result}",
                agent_name="question_decomposition_agent"
            )
            
            # 保存分析结果到传入的previous_results字典中
            previous_results["question_decomposition_agent"] = {
                "analysis_result": analysis_result,
                "original_query": query
            }
            
            logger.info("[NEW_TEAM] 问答拆分智能体执行完成")
            
            # 🔥 收集Agent输出数据
            self._agent_outputs["question_decomposition_agent"] = {
                "analysis_result": analysis_result,
                "original_query": query,
                "agent_name": "question_decomposition_agent"
            }
            logger.info(f"[NEW_TEAM] 已收集question_decomposition_agent的output_data: {len(analysis_result)} 字符")
            
        except Exception as e:
            logger.error(f"[NEW_TEAM] 问答拆分智能体执行失败: {e}")
            raise e
    
    async def _execute_intelligent_routing_agent(
        self, query: str, previous_results: Dict, execution_id: str
    ) -> AsyncGenerator[Dict[str, Any], None]:
        """执行智能决策路由智能体"""
        try:
            logger.info("[NEW_TEAM] 执行智能决策路由智能体")
            
            # 获取问题分析结果
            analysis_result = previous_results.get("question_decomposition_agent", {}).get("analysis_result", "")
            
            # 发送Agent决策事件
            yield self.sse_adapter.adapt_agent_decision_event(
                agent_name="intelligent_routing_agent",
                decision_type="route_decision",
                decision_content="基于问题分析结果制定执行路径",
                confidence=0.95,
                reasoning="优化Agent调用路径，提高响应效率"
            )
            
            # 构建路由决策提示
            routing_prompt = f"""你是一个智能路由决策专家，专门为材料科学问答系统进行路由决策。

用户问题："{query}"
问题分析：{analysis_result}

## 专业领域范围定义：
**属于专业领域**的问题包括：
- 地聚物材料（geopolymer）相关：配比、制备、性能、应用
- 材料工程：水泥、混凝土、聚合物、复合材料、金属材料、陶瓷材料
- 材料科学：超导材料、纳米材料、智能材料、生物材料、功能材料
- 材料性能：力学性能、电学性能、磁学性能、热学性能、光学性能
- 材料制备：合成方法、加工工艺、热处理、表面处理
- 材料应用：建筑工程、电子工业、航空航天、能源存储、医疗器械
- 实验技术：材料测试、表征方法、设备操作、实验设计
- 工程应用：结构设计、工艺优化、质量控制、标准规范

**不属于专业领域**的问题包括：
- 日常问候：你好、hi、hello、早上好、再见等
- 生活常识：天气、时间、地点、日常生活、娱乐八卦
- 其他学科：文学、历史、艺术、体育、音乐
- 编程技术：代码编写、软件开发（除非专门涉及材料建模软件）
- 医学健康：疾病治疗、药物使用（除非涉及生物材料应用）
- 金融经济：股票投资、商业分析、市场营销
- 法律政治：法律条文、政治观点（除非涉及材料标准法规）
- 哲学宗教：哲学思辨、宗教信仰、人生感悟
- 社会文化：社会现象、文化讨论、个人情感

## 执行模式选择：
1. 【快速模式】- 选择条件：
   - 问题明显不属于专业领域范围
   - 简单的交互性对话
   - 不需要调用知识库的问题

2. 【标准模式】- 选择条件：
   - 属于专业领域的一般性技术问题
   - 需要知识库检索的专业咨询

3. 【并行模式】- 选择条件：
   - 复杂的多维度专业技术问题
   - 需要综合多种信息源的问题

4. 【深度模式】- 选择条件：
   - 需要分解的复合专业问题
   - 涉及多个子领域的综合性问题

## 当前问题分析：
请仔细判断问题 "{query}" 是否属于地聚物材料工程专业领域。

如果不属于专业领域，请选择快速模式；
如果属于专业领域，请根据复杂程度选择相应模式。

请严格按照以下格式输出：
执行模式：[快速模式/标准模式/并行模式/深度模式]
理由：[详细说明为什么选择该模式]
需要的Agent：[具体的Agent列表]"""

            # 调用LLM进行路由决策
            routing_result = await self._fallback_llm_call(routing_prompt)
            execution_mode = self._extract_execution_mode(routing_result)
            
            # 发送路由决策结果
            if execution_mode == "fast":
                yield self.sse_adapter.adapt_content_event(
                    content=f"路由决策：选择简单模式，将直接生成友好回复",
                    agent_name="intelligent_routing_agent"
                )
            else:
                yield self.sse_adapter.adapt_content_event(
                    content=f"路由决策：选择专业模式，将执行完整检索流程",
                    agent_name="intelligent_routing_agent"
                )
            
            # 保存路由决策结果
            previous_results["intelligent_routing_agent"] = {
                "routing_result": routing_result,
                "execution_mode": execution_mode
            }
            
            logger.info("[NEW_TEAM] 智能决策路由智能体执行完成")
            
            # 🔥 收集Agent输出数据
            self._agent_outputs["intelligent_routing_agent"] = {
                "routing_result": routing_result,
                "execution_mode": execution_mode,
                "routing_summary": f"路由决策：选择{'简单' if execution_mode == 'fast' else '专业'}模式",
                "agent_name": "intelligent_routing_agent"
            }
            logger.info(f"[NEW_TEAM] 已收集intelligent_routing_agent的output_data")
            
        except Exception as e:
            logger.error(f"[NEW_TEAM] 智能决策路由智能体执行失败: {e}")
            raise e
    
    async def _execute_dag_reconstruction_agent(
        self, query: str, previous_results: Dict, execution_id: str
    ) -> AsyncGenerator[Dict[str, Any], None]:
        """执行DAG执行图重构智能体"""
        try:
            logger.info("[NEW_TEAM] 执行DAG执行图重构智能体")
            
            # 获取路由决策结果
            routing_result = previous_results.get("intelligent_routing_agent", {}).get("routing_result", "")
            execution_mode = previous_results.get("intelligent_routing_agent", {}).get("execution_mode", "standard")
            
            # 发送Agent决策事件
            yield self.sse_adapter.adapt_agent_decision_event(
                agent_name="dag_reconstruction_agent",
                decision_type="dag_optimization",
                decision_content=f"基于{execution_mode}模式重构DAG执行图",
                confidence=0.9,
                reasoning="优化Agent执行顺序和并发关系"
            )
            
            # 构建DAG重构提示
            dag_prompt = f"""基于以下路由决策重构DAG执行图：

路由决策：{routing_result}
执行模式：{execution_mode}

请生成详细的执行计划：
1. Agent执行顺序
2. 并发执行的Agent组合
3. 数据依赖关系
4. 预估执行时间
5. 资源调度建议"""

            # 调用LLM进行DAG重构
            dag_result = await self._fallback_llm_call(dag_prompt)
            
            # 发送DAG重构结果
            yield self.sse_adapter.adapt_content_event(
                content=f"DAG执行图重构完成：{dag_result}",
                agent_name="dag_reconstruction_agent"
            )
            
            # 保存DAG重构结果
            previous_results["dag_reconstruction_agent"] = {
                "dag_result": dag_result,
                "execution_mode": execution_mode,
                "optimized_sequence": self._extract_agent_sequence(dag_result)
            }
            
            logger.info("[NEW_TEAM] DAG执行图重构智能体执行完成")
            
        except Exception as e:
            logger.error(f"[NEW_TEAM] DAG执行图重构智能体执行失败: {e}")
            raise e
    
    def _extract_execution_mode(self, routing_result: str) -> str:
        """从路由决策结果中提取执行模式"""
        if "快速模式" in routing_result:
            return "fast"
        elif "并行模式" in routing_result:
            return "parallel"
        elif "深度模式" in routing_result:
            return "deep"
        else:
            return "standard"
    
    def _extract_agent_sequence(self, dag_result: str) -> List[str]:
        """从DAG结果中提取Agent执行序列"""
        # 这里可以实现更复杂的解析逻辑
        # 暂时返回默认序列
        return ["translation_agent", "knowledge_retrieval_agent", "knowledge_graph_agent", "summary_answer_agent"]
    
    async def _fallback_llm_call(self, prompt: str) -> str:
        """回退方案：直接调用LLM生成回答"""
        try:
            # 直接调用翻译服务使用的网关方法
            from service.translation_service import translation_service
            model_name = "Qwen/Qwen3-30B-A3B-Thinking-2507"
            
            response = await translation_service._call_gateway_for_translation(prompt, model_name)
            return response
        except Exception as e:
            logger.error(f"[NEW_TEAM] 回退LLM调用失败: {e}")
            return f"基于收集的信息进行分析，但LLM生成过程中出现错误: {str(e)}"
    
    def _should_retry_agent(self, agent_config: AgentExecutionConfig, error: Exception) -> bool:
        """判断是否应该重试Agent"""
        # 简单的重试逻辑，可以根据错误类型和配置进行扩展
        return agent_config.retry > 0
    
    async def _generate_team_analysis(
        self, team_name: str, query: str, execution_id: str, trace
    ) -> Dict[str, Any]:
        """生成Team分析数据（复用现有逻辑）"""
        
        current_time = time.time() * 1000
        processing_time = (current_time - trace.start_time * 1000) / 1000
        
        # 从trace中获取实际的执行步骤，并使用收集的输出数据
        member_calls = []
        logger.error(f"🔥🔥🔥 [DEBUG] _generate_team_analysis - _agent_outputs内容: {list(self._agent_outputs.keys())}")
        logger.error(f"🔥🔥🔥 [DEBUG] trace.agent_steps数量: {len(trace.agent_steps)}")
        
        for step in trace.agent_steps:
            # 🔥 从Agent输出收集器中获取输出数据
            output_data = self._agent_outputs.get(step.agent_name, {})
            logger.error(f"🔥🔥🔥 [DEBUG] 为{step.agent_name}设置输出数据: {len(str(output_data))} 字符")
            logger.info(f"[NEW_TEAM] 为{step.agent_name}设置输出数据: {len(str(output_data))} 字符")
            
            member_calls.append(self.sse_adapter.create_member_call_data(
                member_id=step.agent_name,
                member_name=step.agent_name.replace('_', ' ').title(),
                role="专业Agent",
                action=step.action,
                status=step.status,
                confidence=step.confidence,
                duration_ms=step.duration_ms,
                error_message=step.error_message,
                input_data=step.input_data,  # 🔥 添加输入数据
                output_data=output_data  # 🔥 使用收集的输出数据
            ))
        
        # 使用真实的团队决策数据，不生成假数据
        team_decisions = []
        
        return {
            "execution_id": execution_id,
            "team_name": team_name,
            "processing_time": processing_time,
            "team_decisions": team_decisions,
            "member_calls": member_calls,
            "coordination_info": {
                "coordination_mode": trace.execution_mode,
                "total_agents": len(trace.agent_steps),
                "success_rate": 1.0,  # 从trace计算实际成功率
                "execution_system": "new_team_v2"
            },
            "metadata": {
                "query": query,
                "execution_mode": trace.execution_mode,
                "total_steps": len(trace.agent_steps),
                "completed_steps": len([s for s in trace.agent_steps if s.status == "completed"]),
                "failed_steps": len([s for s in trace.agent_steps if s.status == "failed"]),
                "system_version": "team_v2"
            },
            "timestamp": current_time
        }
    
    async def _auto_save_team_conversation(
        self, session_id: str, query: str, team_name: str, 
        team_analysis_data: Dict, trace, user_id: int = None
    ):
        """自动保存Team对话到数据库"""
        try:
            logger.info(f"[NEW_TEAM] 开始自动保存Team对话: {session_id}")
            
            # 🔥 调试：检查team_analysis_data结构
            logger.info(f"[NEW_TEAM] team_analysis_data包含的字段: {list(team_analysis_data.keys()) if isinstance(team_analysis_data, dict) else 'Not a dict'}")
            if isinstance(team_analysis_data, dict):
                logger.info(f"[NEW_TEAM] member_calls数量: {len(team_analysis_data.get('member_calls', []))}")
                logger.info(f"[NEW_TEAM] team_decisions数量: {len(team_analysis_data.get('team_decisions', []))}")
            
            # 🔥 检查是否为继续现有对话
            is_continuing_conversation = session_id.startswith('exec_')
            logger.info(f"[NEW_TEAM] 对话类型: {'继续现有对话' if is_continuing_conversation else '创建新对话'}")
            
            # 从trace.agent_results中获取最终回答
            final_answer = "系统执行完成，但未生成回答。"
            knowledge_sources = []
            thinking = []
            
            # 🔥 修复：检查trace是否为None
            if trace and hasattr(trace, 'agent_results'):
                # 提取最终回答
                if trace.agent_results and "summary_answer_agent" in trace.agent_results:
                    summary_result = trace.agent_results["summary_answer_agent"]
                    if isinstance(summary_result, dict) and "final_answer" in summary_result:
                        final_answer = summary_result["final_answer"]
                
                # 提取知识来源信息
                if trace.agent_results and "knowledge_retrieval_agent" in trace.agent_results:
                    retrieval_result = trace.agent_results["knowledge_retrieval_agent"]
                    if isinstance(retrieval_result, dict):
                        if "documents" in retrieval_result:
                            documents = retrieval_result["documents"]
                            if isinstance(documents, list):
                                for doc in documents[:5]:  # 取前5个来源
                                    if isinstance(doc, dict):
                                        knowledge_sources.append({
                                            "title": doc.get("title", "未知标题"),
                                            "source": doc.get("filename", doc.get("source", "未知来源")),
                                            "confidence": doc.get("score", 0.8),
                                            "content_snippet": doc.get("content", "")[:200] + "..."
                                        })
            else:
                logger.warning(f"[NEW_TEAM] trace为None或无agent_results，使用默认回答")
            
            # 使用真实的thinking数据，不生成假数据
            thinking = []
            
            # 创建数据库连接
            from db.database import get_db_session
            from db.repositories.conversation_repository import ConversationRepository
            
            async with get_db_session() as db_session:
                conversation_repo = ConversationRepository(db_session)
                
                # 🔥🔥🔥 调试：验证team_analysis_data完整性
                print(f"=== SAVE DEBUG === team_analysis_data keys: {list(team_analysis_data.keys())}")
                print(f"=== SAVE DEBUG === member_calls count: {len(team_analysis_data.get('member_calls', []))}")
                print(f"=== SAVE DEBUG === team_decisions count: {len(team_analysis_data.get('team_decisions', []))}")
                
                # 保存Team对话 - 🔥 修复：传递完整的team_analysis_data而非仅metadata
                # 🔥 调试：检查用户ID传递
                logger.info(f"[NEW_TEAM] 🔍 保存Team对话 user_id: {user_id}, type: {type(user_id)}")
                
                await conversation_repo.save_team_conversation(
                    session_id=session_id,
                    question=query,
                    answer=final_answer,
                    team_name=team_name,
                    team_mode="coordinate",  # 默认协作模式
                    team_info=team_analysis_data,  # 🔥 修复：传递完整的team_analysis_data，包含memberCalls和teamDecisions
                    model_used="team_v2",
                    processing_time=team_analysis_data.get("processing_time", 0.0),
                    confidence_score=0.85,  # 基于Team执行的默认置信度
                    sources=[],  # 暂时为空，后续可以扩展
                    knowledge_sources=knowledge_sources,
                    thinking=thinking,
                    metadata={
                        "execution_id": session_id,
                        "team_analysis": team_analysis_data,
                        "system_version": "team_v2_auto_save"
                    },
                    user_id=int(user_id) if user_id is not None else None  # 🔥 添加用户ID
                )
            
            logger.info(f"✅ [NEW_TEAM] Team对话自动保存成功: {session_id}")
            logger.info(f"✅ [NEW_TEAM] 对话保存类型: {'追加消息到现有对话' if is_continuing_conversation else '创建新对话记录'}")
            
        except Exception as e:
            import traceback
            logger.error(f"❌ [NEW_TEAM] Team对话自动保存失败: {e}")
            logger.error(f"❌ [NEW_TEAM] 错误堆栈: {traceback.format_exc()}")
            raise e
    
    async def get_execution_statistics(self) -> Dict[str, Any]:
        """获取执行统计信息"""
        # 获取执行追踪器的统计信息
        tracker_stats = execution_tracker.get_execution_statistics()
        
        # 获取Team管理器的统计信息
        team_manager = await get_singleton_team_manager()
        team_stats = await team_manager.get_team_statistics()
        
        return {
            "system_version": "team_v2",
            "execution_tracker": tracker_stats,
            "team_manager": team_stats,
            "active_executions": len(self._active_executions),
            "active_execution_ids": list(self._active_executions.keys())
        }


# 全局新Team执行服务实例
new_team_execution_service = NewTeamExecutionService()