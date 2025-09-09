"""
问答API端点 - 基于Agno框架的智能问答接口
"""
from fastapi import APIRouter, HTTPException, Depends, Query, Request
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any, AsyncGenerator
import time
import json
import asyncio
import re
import os
import uuid
from sqlalchemy import text

from core.logger import logger
try:
    from service.agent_service import agent_service, AgentResponse
except ImportError:
    # 使用模拟服务避免agno依赖问题
    from service.agent_service_mock import agent_service, AgentResponse

# 导入翻译上下文
try:
    from service.translation_context import TranslationContext
    _has_translation_context = True
except ImportError:
    _has_translation_context = False
    class TranslationContext:
        @staticmethod
        def enable():
            class DummyContext:
                def __enter__(self): return self
                def __exit__(self, *args): pass
            return DummyContext()
        
        @staticmethod
        def disable():
            class DummyContext:
                def __enter__(self): return self
                def __exit__(self, *args): pass
            return DummyContext()
try:
    from service.intelligent_retrieval_service import intelligent_retrieval_service
except ImportError:
    # 创建模拟的智能检索服务
    class MockIntelligentRetrievalService:
        async def search(self, query: str, top_k: int = 5, mode: str = "dual"):
            return [{"content": f"模拟检索结果：{query}", "score": 0.9}]
    intelligent_retrieval_service = MockIntelligentRetrievalService()

try:
    from db.repositories.conversation_repository import ConversationRepository
    from db.database import get_db
    _has_db = True
except ImportError:
    # 模拟数据库依赖
    class ConversationRepository:
        def __init__(self, session=None):
            pass
        async def save_conversation(self, **kwargs):
            pass
        async def get_conversation_by_session(self, session_id):
            return {"question": "模拟问题", "agent_name": "模拟智能体", "sources": []}
        async def save_evaluation(self, **kwargs):
            pass
    
    def get_db():
        return None
    _has_db = False

router = APIRouter()


def _has_agno_memory_enabled() -> bool:
    """检查是否启用了Agno原生memory功能"""
    try:
        from agno.memory import AgentMemory
        return True
    except ImportError:
        return False


# 依赖注入函数
async def get_conversation_repository(session = Depends(get_db)):
    """获取对话仓库实例"""
    try:
        if session is None:
            logger.error("数据库会话为None，无法创建对话仓库")
            raise HTTPException(status_code=500, detail="数据库连接不可用")
        return ConversationRepository(session)
    except Exception as e:
        logger.error(f"创建对话仓库失败: {e}")
        raise HTTPException(status_code=500, detail="数据库服务不可用")


class QARequest(BaseModel):
    """问答请求模型"""
    question: str = Field(..., description="用户问题", min_length=1, max_length=1000)
    session_id: Optional[str] = Field(None, description="会话ID")
    agent_type: Optional[str] = Field("team", description="智能体类型: single/team")
    agent_name: Optional[str] = Field(None, description="指定智能体名称")
    model_name: Optional[str] = Field(None, description="指定模型名称")
    context: Optional[Dict[str, Any]] = Field(None, description="额外上下文信息")
    user_id: Optional[int] = Field(None, description="当前用户ID")
    # Collection知识库过滤
    collection_id: Optional[str] = Field(None, description="知识库Collection ID（用于限制检索范围）")
    # 检索模式控制
    retrieval_mode: Optional[str] = Field(None, description="检索模式: general（覆盖系统默认配置）")
    
    # 知识库检索模式控制
    search_knowledge: Optional[bool] = Field(None, description="是否启用知识库检索（默认True）")
    search_graph: Optional[bool] = Field(None, description="是否启用知识图谱检索（默认False）")
    knowledge_retrieval_mode: Optional[str] = Field(None, description="知识库检索模式: qa_only/papers_only/all（默认all）")
    
    # 新增模型参数配置
    temperature: Optional[float] = Field(None, description="创造性温度", ge=0.0, le=2.0)
    max_tokens: Optional[int] = Field(None, description="最大回复长度", ge=100, le=8192)
    top_p: Optional[float] = Field(None, description="Top-p采样", ge=0.0, le=1.0)
    
    # 对话管理参数
    enable_streaming: Optional[bool] = Field(None, description="启用流式输出")
    enable_context_memory: Optional[bool] = Field(None, description="启用上下文记忆")
    max_context_turns: Optional[int] = Field(None, description="最大上下文轮次", ge=1, le=50)
    
    # 快速预设
    preset_name: Optional[str] = Field(None, description="使用预设配置: professional/balanced/creative")
    
    # 翻译功能控制
    enable_translation: Optional[bool] = Field(None, description="是否启用中英文翻译检索（默认False）")


class QAResponse(BaseModel):
    """问答响应模型"""
    answer: str = Field(..., description="回答内容")
    session_id: str = Field(..., description="会话ID")
    agent_name: str = Field(..., description="回答的智能体名称")
    model_used: str = Field(..., description="使用的模型")
    confidence_score: Optional[float] = Field(None, description="置信度分数")
    processing_time: float = Field(..., description="处理时间(秒)")
    sources: Optional[List[Dict[str, Any]]] = Field(None, description="参考来源")
    knowledgeSources: Optional[List[Dict[str, Any]]] = Field(None, description="知识库检索来源")
    metadata: Optional[Dict[str, Any]] = Field(None, description="元数据")
    timestamp: float = Field(..., description="时间戳")


class AgentInfo(BaseModel):
    """智能体信息模型"""
    name: str
    type: str  # agent 或 team
    description: str


class RegenerateRequest(BaseModel):
    """重新生成请求模型"""
    session_id: str = Field(..., description="会话ID")
    message_id: str = Field(..., description="消息ID")
    use_different_strategy: Optional[bool] = Field(False, description="是否使用不同策略")
    agent_name: Optional[str] = Field(None, description="指定智能体")


class SourceDetail(BaseModel):
    """详细溯源信息模型"""
    id: str
    title: str
    content: str
    relevance_score: float
    document_id: str
    chunk_index: int
    metadata: Optional[Dict[str, Any]] = None


class ConversationSummary(BaseModel):
    """对话摘要模型"""
    id: int
    session_id: str
    title: Optional[str] = None
    message_count: int
    last_message: Optional[str] = None
    created_at: str
    updated_at: Optional[str] = None
    # 新增模式信息
    conversation_mode: Optional[str] = None
    mode_display_name: Optional[str] = None


class ConversationListResponse(BaseModel):
    """对话列表响应模型"""
    conversations: List[ConversationSummary]
    total: int
    page: int
    size: int


class ConversationHistoryResponse(BaseModel):
    """对话历史响应模型"""
    session_id: str
    messages: List[Dict[str, Any]]
    total_messages: int


@router.post("/ask/stream")
async def ask_question_stream(
    request: QARequest,
    http_request: Request,
    conversation_repo: ConversationRepository = Depends(get_conversation_repository)
):
    """流式问答接口"""
    print("=" * 80)
    print("🔍 [REQUEST DEBUG] 收到流式问答请求")
    print(f"📋 原始请求对象: {request}")
    print(f"📝 请求参数详情:")
    print(f"   question: {repr(request.question)}")
    print(f"   session_id: {repr(request.session_id)}")
    print(f"   agent_type: {repr(request.agent_type)}")
    print(f"   agent_name: {repr(request.agent_name)}")
    print(f"   model_name: {repr(request.model_name)}")
    print(f"   search_knowledge: {repr(request.search_knowledge)}")
    print(f"   enable_context_memory: {repr(request.enable_context_memory)}")
    print(f"   max_context_turns: {repr(request.max_context_turns)}")
    print("=" * 80)
    """
    智能问答流式接口 - 支持SSE和客户端断开检测
    """
    try:
        # 生成或使用会话ID
        import uuid
        session_id = request.session_id or f"session_{uuid.uuid4().hex[:16]}_{int(time.time())}"
        
        # 处理配置参数
        model_params = await _process_qa_config(request)
        print("🔧 [CONFIG DEBUG] 配置参数处理完成")
        print(f"   model_params: {json.dumps(model_params, indent=2, ensure_ascii=False)}")
        print(f"   session_id: {repr(session_id)}")
        
        async def generate_sse():
            try:
                # 记录SSE生成器开始时间
                sse_start_time = time.time()
                request_processing_latency = sse_start_time - time.time()
                logger.info(f"[LATENCY] SSE生成器启动，当前时间戳: {sse_start_time:.3f}")
                
                # 注册会话到agent_service进行管理
                await agent_service.register_session(session_id)
                
                # 智能上下文记忆应用
                context_start_time = time.time()
                # 检查是否启用了Agno原生memory
                if _has_agno_memory_enabled():
                    # 使用Agno原生memory，无需手动构建上下文
                    enhanced_question = request.question
                    logger.info(f"[MEMORY] 使用Agno原生memory管理上下文，session_id: {session_id}")
                else:
                    # 降级使用传统上下文记忆
                    enhanced_question = await _apply_context_memory(request, model_params, session_id)
                    logger.info(f"[MEMORY] 使用传统上下文记忆管理")
                
                context_latency = time.time() - context_start_time
                logger.info(f"[LATENCY] 上下文记忆应用耗时: {context_latency:.3f}s")
                
                # 设置翻译上下文
                translation_enabled = request.enable_translation if request.enable_translation is not None else False
                current_model = request.model_name  # 获取用户选择的模型
                logger.info(f"[TRANSLATION] 翻译功能状态: {translation_enabled}, 使用模型: {current_model}")
                
                # 用于收集完整回答内容进行保存
                collected_content = ""
                agent_name_used = ""
                model_used = ""
                sources_collected = []
                knowledge_sources_collected = []  # 收集知识库来源
                graph_sources_collected = {}  # 收集知识图谱来源
                metadata_collected = {}
                thinking_data_collected = []  # 收集Agent个体thinking数据
                team_decisions_collected = []  # 收集Team决策过程数据
                team_info_collected = {}  # 收集Team特有数据
                
                # 记录智能体调用开始时间
                agent_call_start_time = time.time()
                
                # 根据请求类型调用不同的智能体
                if request.agent_type == "single" and request.agent_name:
                    search_knowledge_param = request.search_knowledge if request.search_knowledge is not None else True
                    search_graph_param = request.search_graph if request.search_graph is not None else False
                    logger.info(f"[LATENCY] 开始单智能体查询: {request.agent_name}, 知识库检索: {search_knowledge_param}, 知识图谱检索: {search_graph_param}")
                    
                    # 打印single_agent_query调用参数
                    print("🤖 [AGENT DEBUG] 调用single_agent_query参数:")
                    print(f"   agent_name: {repr(request.agent_name)}")
                    print(f"   enhanced_question: {repr(enhanced_question)}")
                    print(f"   stream: {repr(model_params['conversation_params'].get('enable_streaming', True))}")
                    print(f"   model_name: {repr(request.model_name)}")
                    print(f"   model_params: {json.dumps(model_params['model_params'], indent=2, ensure_ascii=False)}")
                    print(f"   search_knowledge: {repr(search_knowledge_param)}")
                    print(f"   search_graph: {repr(search_graph_param)}")
                    print(f"   enable_translation: {repr(translation_enabled)}")
                    print(f"   session_id: {repr(session_id)}")
                    
                    # 在翻译上下文中调用单智能体查询
                    
                    # 🔥 根据是否启用知识图谱检索选择不同的查询方法
                    print(f"🔍 [ROUTING DEBUG] 使用统一查询方法，支持图谱检索: search_graph={search_graph_param}")
                    
                    # 单智能体查询返回async generator，需要异步迭代
                    if translation_enabled:
                        with TranslationContext.enable(current_model):
                            print("🔧 [ROUTING] 使用统一查询方法: single_agent_query")
                            single_agent_stream = agent_service.single_agent_query(
                                request.agent_name, 
                                enhanced_question,
                                stream=model_params['conversation_params'].get('enable_streaming', True),
                                model_name=request.model_name,
                                model_params=model_params['model_params'],
                                search_knowledge=search_knowledge_param,
                                search_graph=search_graph_param,
                                knowledge_retrieval_mode=request.knowledge_retrieval_mode or 'all',
                                session_id=session_id,  # 传递session_id启用Agno memory
                                collection_id=request.collection_id
                            )
                    else:
                        with TranslationContext.disable():
                            print("🔧 [ROUTING] 使用统一查询方法: single_agent_query")
                            single_agent_stream = agent_service.single_agent_query(
                                request.agent_name, 
                                enhanced_question,
                                stream=model_params['conversation_params'].get('enable_streaming', True),
                                model_name=request.model_name,
                                model_params=model_params['model_params'],
                                search_knowledge=search_knowledge_param,
                                search_graph=search_graph_param,
                                knowledge_retrieval_mode=request.knowledge_retrieval_mode or 'all',
                                session_id=session_id,  # 传递session_id启用Agno memory
                                collection_id=request.collection_id
                            )
                    
                    agent_call_latency = time.time() - agent_call_start_time
                    logger.info(f"[LATENCY] 单智能体查询调用完成耗时: {agent_call_latency:.3f}s")
                else:
                    logger.info(f"[LATENCY] 开始团队查询: {request.agent_name or 'geopolymer_qa_team_v2'}")
                    # 团队查询使用真正的流式接口
                    team_name = request.agent_name or os.getenv('TEAM_DEFAULT_NAME', 'geopolymer_qa_team_v2')
                    
                    first_event_yielded = False
                    # 在翻译上下文中调用团队查询
                    if translation_enabled:
                        with TranslationContext.enable(current_model):
                            team_query_stream = agent_service.team_query_stream(
                                team_name, 
                                enhanced_question, 
                                session_id=session_id,
                                knowledge_retrieval_mode=request.knowledge_retrieval_mode or 'all'
                            )
                    else:
                        with TranslationContext.disable():
                            team_query_stream = agent_service.team_query_stream(
                                team_name, 
                                enhanced_question, 
                                session_id=session_id,
                                knowledge_retrieval_mode=request.knowledge_retrieval_mode or 'all'
                            )
                    
                    # 使用新的团队流式接口，传递session_id启用Agno memory
                    async for event in team_query_stream:
                        # 检查客户端是否断开连接
                        if await http_request.is_disconnected():
                            logger.info(f"[INTERRUPT] 客户端断开连接，停止团队查询: {session_id}")
                            await agent_service.cancel_session(session_id)
                            break
                            
                        if event:  # 过滤None事件
                            # 记录首个事件的延迟
                            if not first_event_yielded:
                                first_event_yielded = True
                                first_event_time = time.time()
                                total_first_event_latency = first_event_time - sse_start_time
                                logger.info(f"[LATENCY] 首个SSE事件发送延迟: {total_first_event_latency:.3f}s")
                            
                            # 收集团队查询的元数据（不累积content）
                            if isinstance(event, dict):
                                if event.get('type') == 'chunk':
                                    chunk_data = event.get('data', {})
                                    # 🔥 Team模式：不再累积content，只收集必要的元数据
                                    
                                    # 收集元数据
                                    if not agent_name_used:
                                        agent_name_used = chunk_data.get('agent_name', '')
                                    if not model_used:
                                        model_used = chunk_data.get('model_used', '')
                                
                                elif event.get('type') == 'thinking':
                                    # 收集Agent个体thinking数据
                                    thinking_item = {
                                        'title': event.get('title', '思考中...'),
                                        'content': event.get('content', ''),
                                        'timestamp': event.get('timestamp', time.time() * 1000)
                                    }
                                    thinking_data_collected.append(thinking_item)
                                    logger.info(f"[THINKING] 团队查询收集到Agent思考数据: {thinking_item['title'][:50]}")
                                
                                elif event.get('type') == 'team_decision':
                                    # 收集Team决策过程数据
                                    decision_data = event.get('data', {})
                                    decision_item = {
                                        'type': decision_data.get('type', 'decision'),
                                        'title': decision_data.get('title', 'Team决策'),
                                        'content': decision_data.get('content', ''),
                                        'confidence': decision_data.get('confidence', 0.0),
                                        'reasoning': decision_data.get('reasoning', ''),
                                        'affected_agents': decision_data.get('affected_agents', []),
                                        'alternatives': decision_data.get('alternatives', []),
                                        'timestamp': event.get('timestamp', time.time() * 1000)
                                    }
                                    team_decisions_collected.append(decision_item)
                                    logger.info(f"[TEAM_DECISION] 收集到Team决策: {decision_item['title'][:50]}")
                                
                                elif event.get('type') == 'team_coordination':
                                    # 收集Team协调决策数据
                                    coord_data = event.get('data', {})
                                    coordination_decision = {
                                        'type': 'coordination',
                                        'title': coord_data.get('title', 'Team协调'),
                                        'content': coord_data.get('content', ''),
                                        'confidence': coord_data.get('confidence', 0.0),
                                        'coordination_type': coord_data.get('coordination_type', 'task_assignment'),
                                        'agents_involved': coord_data.get('agents_involved', []),
                                        'strategy': coord_data.get('strategy', ''),
                                        'timestamp': event.get('timestamp', time.time() * 1000)
                                    }
                                    team_decisions_collected.append(coordination_decision)
                                    logger.info(f"[TEAM_COORDINATION] 收集到Team协调决策: {coordination_decision['title'][:50]}")
                                
                                elif event.get('type') == 'team_member_call':
                                    # 收集Team成员调用数据
                                    call_data = event.get('data', {})
                                    if 'memberCalls' not in team_info_collected:
                                        team_info_collected['memberCalls'] = []
                                    team_info_collected['memberCalls'].append(call_data)
                                    logger.info(f"[TEAM] 收集到成员调用: {call_data.get('memberName', 'Unknown')}")
                                
                                elif event.get('type') == 'knowledge_sources':
                                    # 收集团队查询的知识源事件
                                    logger.info(f"[KNOWLEDGE_DEBUG] 团队查询接收到knowledge_sources事件: {event}")
                                    data = event.get('data', {})
                                    team_knowledge_sources = data.get('knowledge_sources', [])
                                    if team_knowledge_sources:
                                        knowledge_sources_collected.extend(team_knowledge_sources)
                                        team_info_collected['knowledgeSources'] = team_knowledge_sources
                                        logger.info(f"[KNOWLEDGE_DEBUG] 团队查询从knowledge_sources收集到 {len(team_knowledge_sources)} 个知识来源")
                                        logger.info(f"[KNOWLEDGE_DEBUG] 团队查询当前knowledge_sources_collected长度: {len(knowledge_sources_collected)}")
                                        logger.info(f"[KNOWLEDGE_DEBUG] 团队查询收集到的具体知识来源: {team_knowledge_sources}")
                                    else:
                                        logger.warning(f"[KNOWLEDGE_DEBUG] 团队查询knowledge_sources事件中没有knowledge_sources数据")
                                
                                elif event.get('type') == 'done':
                                    # 收集完成时的最终元数据和Team信息，但不在后端保存
                                    done_data = event.get('data', {})
                                    if not agent_name_used:
                                        agent_name_used = done_data.get('agent_name', '')
                                    metadata_collected = done_data
                                    
                                    # 🔥 Team模式：后端不再自动保存，由team_api负责保存
                                    logger.info(f"[TEAM_STREAM] Team查询完成，保存由team_api.py处理")
                            
                            yield f"data: {json.dumps(event)}\n\n"
                    return
                
                # 处理单智能体异步生成器响应
                if 'single_agent_stream' in locals():
                    # 单智能体查询返回async generator，需要异步迭代
                    first_response_yielded = False
                    async for event in single_agent_stream:
                        # 检查客户端是否断开连接
                        if await http_request.is_disconnected():
                            logger.info(f"[INTERRUPT] 客户端断开连接，停止单智能体查询: {session_id}")
                            await agent_service.cancel_session(session_id)
                            break
                        
                        # 记录首个响应事件的延迟
                        if not first_response_yielded:
                            first_response_yielded = True
                            first_response_time = time.time()
                            total_first_response_latency = first_response_time - sse_start_time
                            logger.info(f"[LATENCY] 首个单智能体响应事件延迟: {total_first_response_latency:.3f}s")
                        
                        # 收集内容用于保存 - 先检查event是否为字典
                        logger.info(f"[EVENT_DEBUG] 收到事件: {type(event)} - {event}")
                        if isinstance(event, dict):
                            if event.get('type') == 'chunk':
                                chunk_data = event.get('data', {})
                                content = chunk_data.get('content', '')
                                if content:
                                    collected_content += content
                                
                                # 收集元数据
                                if not agent_name_used:
                                    agent_name_used = chunk_data.get('agent_name', '')
                                if not model_used:
                                    model_used = chunk_data.get('model_used', '')
                            
                            elif event.get('type') == 'thinking':
                                # 收集thinking数据 - 添加详细调试
                                logger.info(f"[THINKING_DEBUG] 接收到thinking事件: {event}")
                                thinking_item = {
                                    'title': event.get('title', '思考中...'),
                                    'content': event.get('content', ''),
                                    'timestamp': event.get('timestamp', time.time() * 1000)
                                }
                                thinking_data_collected.append(thinking_item)
                                logger.info(f"[THINKING_DEBUG] 收集到thinking数据: {thinking_item}")
                                logger.info(f"[THINKING_DEBUG] 当前thinking_data_collected长度: {len(thinking_data_collected)}")
                            
                            elif event.get('type') == 'knowledge_search':
                                    # 知识库检索开始事件 - 仅记录日志，不收集结果（避免重复）
                                    logger.info(f"[KNOWLEDGE_DEBUG] 接收到knowledge_search开始事件: {event}")
                                    search_results = event.get('results', [])
                                    logger.info(f"[KNOWLEDGE_DEBUG] knowledge_search事件包含 {len(search_results)} 个初步结果，等待complete事件获取最终结果")
                                
                            elif event.get('type') == 'knowledge_search_complete':
                                # 收集知识库检索结果完成事件 - 这里是真正的结果
                                logger.info(f"[KNOWLEDGE_DEBUG] 接收到knowledge_search_complete事件: {event}")
                                search_results = event.get('results', [])
                                if search_results:
                                    knowledge_sources_collected.extend(search_results)
                                    logger.info(f"[KNOWLEDGE_DEBUG] 从knowledge_search_complete收集到 {len(search_results)} 个知识来源")
                                    logger.info(f"[KNOWLEDGE_DEBUG] 当前knowledge_sources_collected长度: {len(knowledge_sources_collected)}")
                                    logger.info(f"[KNOWLEDGE_DEBUG] 收集到的具体知识来源: {search_results}")
                                else:
                                    logger.warning(f"[KNOWLEDGE_DEBUG] knowledge_search_complete事件中没有results数据")
                            
                            # 🔥 删除重复的knowledge_sources处理逻辑，避免重复收集
                            # （此处的knowledge_sources事件已在前面的Team模式处理中统一处理）
                                
                            elif event.get('type') == 'sources':
                                # 收集一般来源信息
                                logger.info(f"[SOURCES_DEBUG] 接收到sources事件: {event}")
                                source_results = event.get('data', [])
                                if source_results:
                                    sources_collected.extend(source_results)
                                    logger.info(f"[SOURCES_DEBUG] 收集到 {len(source_results)} 个一般来源")
                            
                            elif event.get('type') == 'done':
                                # 收集完成时的最终元数据
                                done_data = event.get('data', {})
                                if not agent_name_used:
                                    agent_name_used = done_data.get('agent_name', '')
                                metadata_collected = done_data
                                
                                # 🔥 不再从done事件重复收集knowledge_sources，避免重复数据
                                # 检查done事件中的knowledge_sources是否与已收集的一致
                                if 'knowledge_sources' in done_data:
                                    done_sources_count = len(done_data['knowledge_sources'])
                                    collected_count = len(knowledge_sources_collected)
                                    logger.info(f"[KNOWLEDGE_DEBUG] done事件包含 {done_sources_count} 个知识来源，已收集 {collected_count} 个（不重复收集）")
                                    
                                    # 仅在没有收集到任何数据时才使用done事件的数据（备用方案）
                                    if collected_count == 0 and done_sources_count > 0:
                                        knowledge_sources_collected.extend(done_data['knowledge_sources'])
                                        logger.info(f"[KNOWLEDGE_DEBUG] 使用done事件作为备用数据源，收集到 {done_sources_count} 个知识来源")
                                
                                # 🔥 收集知识图谱来源数据
                                if 'graph_sources' in done_data:
                                    graph_sources_collected = done_data['graph_sources']
                                    logger.info(f"[GRAPH_DEBUG] 从done事件收集到图谱数据: success={graph_sources_collected.get('success', False)}")
                                    logger.info(f"[GRAPH_DEBUG] 图谱实体数量: {len(graph_sources_collected.get('entities', []))}")
                                    logger.info(f"[GRAPH_DEBUG] 图谱关系数量: {len(graph_sources_collected.get('relationships', []))}")
                                    logger.info(f"[GRAPH_DEBUG] 图谱来源数量: {len(graph_sources_collected.get('sources', []))}")
                            else:
                                # 如果event是字符串，记录但跳过处理
                                logger.debug(f"收到字符串类型的event: {type(event)} - {str(event)[:100]}")
                            
                            # 🔥 关键修复：对done事件进行特殊处理，合并收集的知识源数据
                            if event.get('type') == 'done':
                                # 对done事件合并收集到的knowledge_sources数据
                                done_data = event.get('data', {})
                                done_data['knowledgeSources'] = knowledge_sources_collected  # 🔥 修复：使用camelCase字段名
                                logger.info(f"[KNOWLEDGE_DEBUG] 最终done事件包含knowledgeSources数量: {len(knowledge_sources_collected)}")
                                
                                # 生成知识源统计信息
                                knowledge_stats = {
                                    "total_sources": len(knowledge_sources_collected),
                                    "source_types": {},
                                    "adopted_sources": 0,
                                    "adopted_types": {},
                                    "average_score": 0.0,
                                    "search_time": 0
                                }
                                
                                if knowledge_sources_collected:
                                    # 统计不同类型的数据源和采用状态
                                    for source in knowledge_sources_collected:
                                        source_type = source.get("source_type", "unknown")
                                        knowledge_stats["source_types"][source_type] = knowledge_stats["source_types"].get(source_type, 0) + 1
                                        
                                        # 统计采用状态
                                        if source.get("adopted"):
                                            knowledge_stats["adopted_sources"] += 1
                                            knowledge_stats["adopted_types"][source_type] = knowledge_stats["adopted_types"].get(source_type, 0) + 1
                                    
                                    # 计算平均分数
                                    scores = [source.get("score", 0.0) for source in knowledge_sources_collected]
                                    knowledge_stats["average_score"] = sum(scores) / len(scores) if scores else 0.0
                                
                                done_data['knowledge_stats'] = knowledge_stats
                                
                                enhanced_done_event = {
                                    "type": "done",
                                    "data": done_data
                                }
                                yield f"data: {json.dumps(enhanced_done_event)}\n\n"
                            else:
                                # 其他事件直接透传
                                yield f"data: {json.dumps(event)}\n\n"
                    
                    # 🔥 关键修复：单智能体查询完成后立即保存对话记录
                    logger.info(f"[SAVE_DEBUG] 单智能体查询完成，准备保存对话: collected_content长度={len(collected_content)}")
                    try:
                        processing_time = time.time() - sse_start_time
                        
                        # 如果没有收集到内容，使用默认回复
                        final_answer = collected_content.strip() if collected_content.strip() else "抱歉，没有收到完整的回复内容。"
                        
                        # 保存单智能体对话记录
                        # 🔥 去重knowledge_sources避免重复数据
                        deduplicated_knowledge_sources = []
                        seen_ids = set()
                        for source in knowledge_sources_collected:
                            source_id = source.get('id')
                            if source_id and source_id not in seen_ids:
                                seen_ids.add(source_id)
                                deduplicated_knowledge_sources.append(source)
                            elif not source_id:  # 没有ID的情况下，基于content去重
                                content_hash = hash(source.get('content', ''))
                                if content_hash not in seen_ids:
                                    seen_ids.add(content_hash)
                                    deduplicated_knowledge_sources.append(source)
                        
                        if len(knowledge_sources_collected) != len(deduplicated_knowledge_sources):
                            logger.warning(f"[DEDUP] 检测到重复的knowledge_sources: 原始{len(knowledge_sources_collected)}个 -> 去重后{len(deduplicated_knowledge_sources)}个")
                        
                        await conversation_repo.save_conversation(
                            session_id=session_id,
                            question=request.question,
                            answer=final_answer,
                            agent_name=agent_name_used or request.agent_name or 'qa_agent',
                            model_used=model_used or 'unknown',
                            processing_time=processing_time,
                            confidence_score=None,  # 流式响应中一般没有置信度
                            sources=sources_collected,
                            knowledge_sources=deduplicated_knowledge_sources,  # 🔥 使用去重后的数据
                            graph_sources=graph_sources_collected,  # 🔥 添加图谱检索结果
                            user_id=request.user_id,  # 传递用户ID
                            thinking=thinking_data_collected if thinking_data_collected else None,
                            metadata={
                                **metadata_collected,
                                'streaming': True,
                                'agent_type': 'single',
                                'enhanced_question_used': enhanced_question != request.question,
                                'knowledge_sources_count': len(deduplicated_knowledge_sources)  # 更新计数
                            },
                            agent_id=request.agent_name or 'cailiao_zhuanjia',
                            agent_display_name=agent_name_used or '问答专家'
                        )
                        logger.info(f"单智能体对话记录已保存: session_id={session_id}")
                    except Exception as e:
                        logger.warning(f"保存单智能体对话记录失败: {e}")
                    
                    return  # 单智能体查询完成，返回
                
                # 流式响应完成后保存对话记录 - 即使内容为空也要保存问题
                logger.info(f"[SAVE_DEBUG] 准备保存对话: collected_content长度={len(collected_content)}, 是否为空={not collected_content.strip()}")
                try:
                    processing_time = time.time() - sse_start_time
                    
                    # 如果没有收集到内容，使用默认回复
                    final_answer = collected_content.strip() if collected_content.strip() else "抱歉，没有收到完整的回复内容。"
                    
                    # 添加thinking调试信息
                    logger.info(f"[THINKING_DEBUG] 保存前thinking_data_collected: {thinking_data_collected}")
                    logger.info(f"[THINKING_DEBUG] 保存前thinking数据长度: {len(thinking_data_collected)}")
                    thinking_to_save = thinking_data_collected if thinking_data_collected else None
                    logger.info(f"[THINKING_DEBUG] 实际保存的thinking数据: {thinking_to_save}")
                    
                    # 增强调试信息 - 检查溯源数据保存
                    logger.info(f"[SOURCES_SAVE_DEBUG] 准备保存溯源数据:")
                    logger.info(f"[SOURCES_SAVE_DEBUG] - sources_collected: {len(sources_collected)} 条")
                    logger.info(f"[SOURCES_SAVE_DEBUG] - knowledge_sources_collected: {len(knowledge_sources_collected)} 条")
                    logger.info(f"[SOURCES_SAVE_DEBUG] - knowledge_sources_collected内容: {knowledge_sources_collected}")
                    
                    # 🔥 添加adopted字段的专项检查
                    for i, source in enumerate(knowledge_sources_collected):
                        logger.info(f"[ADOPTED_DEBUG] Source {i}: adopted={source.get('adopted')}, source_type={source.get('source_type')}, id={source.get('id')}")
                    
                    await conversation_repo.save_conversation(
                        session_id=session_id,
                        question=request.question,
                        answer=final_answer,
                        agent_name=agent_name_used or request.agent_name or 'qa_agent',
                        model_used=model_used or 'unknown',
                        processing_time=processing_time,
                        confidence_score=None,  # 流式响应中一般没有置信度
                        sources=sources_collected,
                        knowledge_sources=knowledge_sources_collected,  # 添加知识库来源
                        graph_sources=graph_sources_collected,  # 🔥 添加图谱检索结果
                        user_id=request.user_id,  # 传递用户ID
                        thinking=thinking_to_save,  # 使用调试过的thinking数据
                        metadata={
                            **metadata_collected,
                            'streaming': True,
                            'enhanced_question_used': enhanced_question != request.question,
                            'knowledge_sources_count': len(knowledge_sources_collected)  # 添加统计信息
                        },
                        agent_id=request.agent_name or 'cailiao_zhuanjia',  # 传递智能体ID
                        agent_display_name=agent_name_used or '问答专家'  # 传递显示名称
                    )
                    logger.info(f"流式对话记录已保存: session_id={session_id}")
                    logger.info(f"[THINKING_DEBUG] 已保存thinking数据到数据库: {thinking_to_save}")
                except Exception as e:
                        logger.warning(f"保存流式对话记录失败: {e}")
                    
            except asyncio.CancelledError:
                logger.info(f"[INTERRUPT] 流式查询被取消: {session_id}")
                await agent_service.cleanup_session(session_id)
                yield f"data: {json.dumps({'type': 'cancelled', 'data': {'message': '查询已被中断'}})}\n\n"
            except Exception as e:
                logger.error(f"流式问答处理失败: {e}")
                await agent_service.cleanup_session(session_id)
                yield f"data: {json.dumps({'type': 'error', 'data': {'error': str(e)}})}\n\n"
            finally:
                # 确保会话资源得到清理
                await agent_service.cleanup_session(session_id)
        
        return StreamingResponse(
            generate_sse(),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache, no-store, must-revalidate",
                "Connection": "keep-alive",
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Headers": "*",
                "X-Accel-Buffering": "no",  # 禁用Nginx缓冲
                "Transfer-Encoding": "chunked",
                "Content-Encoding": "identity",  # 禁用压缩以减少延迟
            }
        )
        
    except Exception as e:
        logger.error(f"流式问答接口错误: {e}")
        raise HTTPException(status_code=500, detail=f"流式问答处理失败: {str(e)}")


@router.post("/ask", response_model=QAResponse)
async def ask_question(
    request: QARequest,
    conversation_repo: ConversationRepository = Depends(get_conversation_repository)
):
    """
    智能问答接口 - 非流式
    """
    try:
        start_time = time.time()
        
        # 生成或使用会话ID
        import uuid
        session_id = request.session_id or f"session_{uuid.uuid4().hex[:16]}_{int(time.time())}"
        
        # 处理配置参数
        config = await _process_qa_config(request)
        
        # 应用上下文记忆
        enhanced_question = await _apply_context_memory(request, config, session_id)
        
        # 设置翻译上下文
        translation_enabled = request.enable_translation if request.enable_translation is not None else False
        current_model = request.model_name
        logger.info(f"[TRANSLATION] 非流式 - 翻译功能状态: {translation_enabled}, 使用模型: {current_model}")
        
        # 根据请求类型调用不同的智能体
        agent_response: Optional[AgentResponse] = None
        
        if request.agent_type == "single" and request.agent_name:
            # 单智能体查询
            search_knowledge_param = request.search_knowledge if request.search_knowledge is not None else True
            search_graph_param = request.search_graph if request.search_graph is not None else False
            logger.info(f"非流式单智能体查询: {request.agent_name}, 知识库检索: {search_knowledge_param}, 知识图谱检索: {search_graph_param}")
            
            # 🔥 根据是否启用知识图谱检索选择不同的查询方法（非流式版本）
            logger.info(f"[ROUTING_NON_STREAM] 路由选择: search_graph={search_graph_param}")
            
            # 在翻译上下文中调用
            if translation_enabled:
                with TranslationContext.enable(current_model):
                    if search_graph_param:
                        # 使用图谱增强的查询方法
                        logger.info("[ROUTING_NON_STREAM] 使用图谱增强查询: single_agent_query")
                        agent_response_stream = agent_service.single_agent_query(
                            request.agent_name, 
                            enhanced_question,
                            stream=False,
                            model_name=request.model_name,
                            model_params=config['model_params'],
                            search_knowledge=search_knowledge_param,
                            search_graph=search_graph_param,
                            knowledge_retrieval_mode=request.knowledge_retrieval_mode or 'all',
                            session_id=session_id,
                            collection_id=request.collection_id
                        )
                    else:
                        # 使用原始查询方法
                        logger.info("[ROUTING_NON_STREAM] 使用原始查询: single_agent_query")
                        agent_response_stream = agent_service.single_agent_query(
                            request.agent_name, 
                            enhanced_question,
                            stream=False,
                            model_name=request.model_name,
                            model_params=config['model_params'],
                            search_knowledge=search_knowledge_param,
                            search_graph=search_graph_param,
                            knowledge_retrieval_mode=request.knowledge_retrieval_mode or 'all',
                            session_id=session_id,
                            collection_id=request.collection_id
                        )
                    # Collect the response from async generator
                    agent_response = None
                    async for event in agent_response_stream:
                        if event.get('type') == 'complete':
                            data = event.get('data')
                            # 转换字典为AgentResponse对象以保持兼容性
                            from models.conversation import AgentResponse
                            agent_response = AgentResponse(
                                content=data.get('content', ''),
                                agent_name=data.get('agent_name', ''),
                                model_used=data.get('model_used', ''),
                                processing_time=data.get('processing_time', 0.0),
                                confidence_score=data.get('confidence_score', 0.0),
                                sources=data.get('sources', []),
                                knowledge_sources=data.get('knowledge_sources', []),
                                knowledge_stats=data.get('knowledge_stats', {}),
                                graph_sources=data.get('graph_sources', {}),  # 添加图谱检索结果
                                metadata=data.get('metadata', {})
                            )
                            break
                        elif event.get('type') == 'error':
                            data = event.get('data')
                            # 转换字典为AgentResponse对象以保持兼容性
                            from models.conversation import AgentResponse
                            agent_response = AgentResponse(
                                content=data.get('content', '处理请求时出现错误'),
                                agent_name=data.get('agent_name', ''),
                                model_used=data.get('model_used', 'error_fallback'),
                                processing_time=data.get('processing_time', 0.0),
                                confidence_score=data.get('confidence_score', 0.0),
                                sources=data.get('sources', []),
                                knowledge_sources=data.get('knowledge_sources', []),
                                knowledge_stats=data.get('knowledge_stats', {}),
                                metadata=data.get('metadata', {})
                            )
                            break
            else:
                with TranslationContext.disable():
                    logger.info("[ROUTING_NON_STREAM] 使用统一查询方法: single_agent_query")
                    agent_response_stream = agent_service.single_agent_query(
                        request.agent_name, 
                        enhanced_question,
                        stream=False,
                        model_name=request.model_name,
                        model_params=config['model_params'],
                        search_knowledge=search_knowledge_param,
                        search_graph=search_graph_param,
                        knowledge_retrieval_mode=request.knowledge_retrieval_mode or 'all',
                        session_id=session_id,
                        collection_id=request.collection_id
                    )
                    # Collect the response from async generator
                    agent_response = None
                    async for event in agent_response_stream:
                        if event.get('type') == 'complete':
                            data = event.get('data')
                            # 转换字典为AgentResponse对象以保持兼容性
                            from models.conversation import AgentResponse
                            agent_response = AgentResponse(
                                content=data.get('content', ''),
                                agent_name=data.get('agent_name', ''),
                                model_used=data.get('model_used', ''),
                                processing_time=data.get('processing_time', 0.0),
                                confidence_score=data.get('confidence_score', 0.0),
                                sources=data.get('sources', []),
                                knowledge_sources=data.get('knowledge_sources', []),
                                knowledge_stats=data.get('knowledge_stats', {}),
                                graph_sources=data.get('graph_sources', {}),  # 添加图谱检索结果
                                metadata=data.get('metadata', {})
                            )
                            break
                        elif event.get('type') == 'error':
                            data = event.get('data')
                            # 转换字典为AgentResponse对象以保持兼容性
                            from models.conversation import AgentResponse
                            agent_response = AgentResponse(
                                content=data.get('content', '处理请求时出现错误'),
                                agent_name=data.get('agent_name', ''),
                                model_used=data.get('model_used', 'error_fallback'),
                                processing_time=data.get('processing_time', 0.0),
                                confidence_score=data.get('confidence_score', 0.0),
                                sources=data.get('sources', []),
                                knowledge_sources=data.get('knowledge_sources', []),
                                knowledge_stats=data.get('knowledge_stats', {}),
                                metadata=data.get('metadata', {})
                            )
                            break
        elif request.agent_type == "team":
            # 团队查询
            team_name = request.agent_name or os.getenv('TEAM_DEFAULT_NAME', 'geopolymer_qa_team_v2')
            
            # 在翻译上下文中调用
            if translation_enabled:
                with TranslationContext.enable(current_model):
                    agent_response = await agent_service.team_query(
                        team_name,
                        enhanced_question,
                        session_id=session_id,
                        knowledge_retrieval_mode=request.knowledge_retrieval_mode or 'all'
                    )
            else:
                with TranslationContext.disable():
                    agent_response = await agent_service.team_query(
                        team_name,
                        enhanced_question,
                        session_id=session_id,
                        knowledge_retrieval_mode=request.knowledge_retrieval_mode or 'all'
                    )
        else:
            # 默认地聚物问答
            if translation_enabled:
                with TranslationContext.enable(current_model):
                    agent_response = await agent_service.geopolymer_qa(
                        enhanced_question,
                        use_team=(request.agent_type == "team"),
                        agent_name=request.agent_name,
                        session_id=session_id
                    )
            else:
                with TranslationContext.disable():
                    agent_response = await agent_service.geopolymer_qa(
                        enhanced_question,
                        use_team=(request.agent_type == "team"),
                        agent_name=request.agent_name,
                        session_id=session_id
                    )
        
        if not agent_response:
            raise HTTPException(status_code=500, detail="智能体查询失败")
        
        # 保存对话记录
        try:
            # 从metadata中提取thinking数据（如果有的话）
            thinking_data = None
            if agent_response.metadata and 'thinking_data' in agent_response.metadata:
                thinking_data = agent_response.metadata['thinking_data']
            
            await conversation_repo.save_conversation(
                session_id=session_id,
                question=request.question,
                answer=agent_response.content,
                agent_name=agent_response.agent_name,
                model_used=agent_response.model_used,
                processing_time=agent_response.processing_time,
                confidence_score=agent_response.confidence_score,
                sources=agent_response.sources,
                user_id=request.user_id,  # 传递用户ID
                thinking=thinking_data,  # 添加thinking数据
                metadata=agent_response.metadata
            )
        except Exception as e:
            logger.warning(f"保存对话记录失败: {e}")
        
        return QAResponse(
            answer=agent_response.content,
            session_id=session_id,
            agent_name=agent_response.agent_name,
            model_used=agent_response.model_used,
            confidence_score=agent_response.confidence_score,
            processing_time=agent_response.processing_time,
            sources=agent_response.sources,
            metadata=agent_response.metadata,
            timestamp=time.time()
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"问答处理失败: {e}")
        raise HTTPException(status_code=500, detail=f"问答处理失败: {str(e)}")


@router.get("/agents", response_model=List[AgentInfo])
async def get_available_agents():
    """
    获取可用的智能体列表 - 返回前端需要的格式
    """
    try:
        # 根据截图恢复正确的角色设定
        agents_info = [
            AgentInfo(
                name="cailiao_zhuanjia",  # 前端ID
                type="agent",
                description="问答专家"  # 前端显示名称
            ),
            AgentInfo(
                name="wenxian_jiansuozhuanjia",  # 前端ID  
                type="agent",
                description="文档分析专家"  # 前端显示名称
            ),
            AgentInfo(
                name="shuju_fenxizhuanjia",  # 前端ID
                type="agent", 
                description="多模态专家"  # 前端显示名称
            ),
            AgentInfo(
                name="geopolymer_qa_team_v2",  # 前端ID
                type="team",
                description="地聚物多语言问答团队V2"  # 前端显示名称
            )
        ]
        
        return agents_info
        
    except Exception as e:
        logger.error(f"获取智能体列表失败: {e}")
        raise HTTPException(status_code=500, detail=f"获取智能体列表失败: {str(e)}")


@router.get("/models")
async def get_available_models():
    """
    获取可用的LLM模型列表
    """
    try:
        from service.llm_service import llm_service
        models = llm_service.get_supported_models()
        return {"models": models}
    except Exception as e:
        logger.error(f"获取模型列表失败: {e}")
        raise HTTPException(status_code=500, detail=f"获取模型列表失败: {str(e)}")


@router.post("/evaluate")
async def evaluate_answer(
    request: dict,
    conversation_repo: ConversationRepository = Depends(get_conversation_repository)
):
    """
    评估回答质量
    """
    try:
        session_id = request.get("session_id")
        rating = request.get("rating")  # 1-5分
        feedback = request.get("feedback", "")
        
        if not session_id or not rating:
            raise HTTPException(status_code=400, detail="缺少必要参数")
        
        # 保存评估结果
        await conversation_repo.save_evaluation(
            session_id=session_id,
            rating=rating,
            feedback=feedback
        )
        
        return {"message": "评估已保存", "session_id": session_id}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"保存评估失败: {e}")
        raise HTTPException(status_code=500, detail=f"保存评估失败: {str(e)}")


@router.post("/regenerate")
async def regenerate_answer(
    request: RegenerateRequest,
    conversation_repo: ConversationRepository = Depends(get_conversation_repository)
):
    """重新生成回答"""
    try:
        # 获取原始对话信息
        conversation = await conversation_repo.get_conversation_by_session(
            request.session_id
        )
        
        if not conversation:
            raise HTTPException(status_code=404, detail="对话不存在")
        
        # 获取原始问题
        original_question = conversation.get('question', '')
        if not original_question:
            raise HTTPException(status_code=400, detail="无法获取原始问题")
        
        start_time = time.time()
        
        # 重新生成回答
        agent_response: Optional[AgentResponse] = None
        
        if request.use_different_strategy:
            # 使用不同策略重新生成
            agent_response = await agent_service.team_query(
                os.getenv('TEAM_DEFAULT_NAME', 'geopolymer_qa_team_v2'),
                original_question,
                session_id=request.session_id
            )
        else:
            # 使用相同策略重新生成
            agent_name = request.agent_name or conversation.get('agent_name', os.getenv('TEAM_DEFAULT_NAME', 'geopolymer_qa_team_v2'))
            agent_response_stream = agent_service.single_agent_query(
                agent_name,
                original_question,
                search_knowledge=True,  # 重新生成时默认启用知识库
                search_graph=False,  # 重新生成时默认关闭知识图谱检索
                session_id=request.session_id,
                collection_id=None  # 重新生成时暂时不指定collection
            )
            # Collect the response from async generator
            agent_response = None
            async for event in agent_response_stream:
                if event.get('type') == 'complete':
                    data = event.get('data')
                    # 转换字典为AgentResponse对象以保持兼容性
                    from models.conversation import AgentResponse
                    agent_response = AgentResponse(
                        content=data.get('content', ''),
                        agent_name=data.get('agent_name', ''),
                        model_used=data.get('model_used', ''),
                        processing_time=data.get('processing_time', 0.0),
                        confidence_score=data.get('confidence_score', 0.0),
                        sources=data.get('sources', []),
                        knowledge_sources=data.get('knowledge_sources', []),
                        knowledge_stats=data.get('knowledge_stats', {}),
                        metadata=data.get('metadata', {})
                    )
                    break
                elif event.get('type') == 'error':
                    data = event.get('data')
                    # 转换字典为AgentResponse对象以保持兼容性
                    from models.conversation import AgentResponse
                    agent_response = AgentResponse(
                        content=data.get('content', '处理请求时出现错误'),
                        agent_name=data.get('agent_name', ''),
                        model_used=data.get('model_used', 'error_fallback'),
                        processing_time=data.get('processing_time', 0.0),
                        confidence_score=data.get('confidence_score', 0.0),
                        sources=data.get('sources', []),
                        knowledge_sources=data.get('knowledge_sources', []),
                        knowledge_stats=data.get('knowledge_stats', {}),
                        metadata=data.get('metadata', {})
                    )
                    break
        
        if not agent_response:
            raise HTTPException(status_code=500, detail="重新生成失败")
        
        # 保存新的回答
        # 从metadata中提取thinking数据（如果有的话）
        thinking_data = None
        if agent_response.metadata and 'thinking_data' in agent_response.metadata:
            thinking_data = agent_response.metadata['thinking_data']
        
        await conversation_repo.save_conversation(
            session_id=request.session_id,
            question=original_question,
            answer=agent_response.content,
            agent_name=agent_response.agent_name,
            model_used=agent_response.model_used,
            processing_time=agent_response.processing_time,
            confidence_score=agent_response.confidence_score,
            sources=agent_response.sources,
            user_id=conversation.get('user_id'),  # 从原对话获取用户ID
            thinking=thinking_data,  # 添加thinking数据
            metadata={
                **agent_response.metadata,
                "regenerated": True,
                "original_message_id": request.message_id
            }
        )
        
        return QAResponse(
            answer=agent_response.content,
            session_id=request.session_id,
            agent_name=agent_response.agent_name,
            model_used=agent_response.model_used,
            confidence_score=agent_response.confidence_score,
            processing_time=agent_response.processing_time,
            sources=agent_response.sources,
            metadata=agent_response.metadata,
            timestamp=time.time(),
            knowledge_sources=agent_response.knowledge_sources,
            knowledge_stats=agent_response.knowledge_stats
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"重新生成回答失败: {e}")
        raise HTTPException(status_code=500, detail="重新生成失败")


@router.get("/sources/{session_id}/{message_id}")
async def get_answer_sources(
    session_id: str,
    message_id: str,
    conversation_repo: ConversationRepository = Depends(get_conversation_repository)
):
    """获取回答的详细溯源信息"""
    try:
        # 获取对话记录
        conversation = await conversation_repo.get_conversation_by_session(session_id)
        
        if not conversation:
            raise HTTPException(status_code=404, detail="对话不存在")
        
        # 获取详细的溯源信息
        sources = conversation.get('sources', [])
        detailed_sources = []
        
        for source in sources:
            # 如果有document_id，获取完整的文档内容
            if 'document_id' in source:
                try:
                    # 这里可以调用文档服务获取完整内容
                    detailed_source = SourceDetail(
                        id=source.get('id', ''),
                        title=source.get('title', ''),
                        content=source.get('content', ''),
                        relevance_score=source.get('relevance', 0.0),
                        document_id=source.get('document_id', ''),
                        chunk_index=source.get('chunk_index', 0),
                        metadata=source.get('metadata', {})
                    )
                    detailed_sources.append(detailed_source.dict())
                except Exception as e:
                    logger.warning(f"获取详细溯源信息失败: {e}")
                    detailed_sources.append(source)
            else:
                detailed_sources.append(source)
        
        return {
            "success": True,
            "data": {
                "session_id": session_id,
                "message_id": message_id,
                "sources": detailed_sources,
                "total_sources": len(detailed_sources)
            },
            "message": "获取溯源信息成功"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"获取溯源信息失败: {e}")
        raise HTTPException(status_code=500, detail="获取溯源信息失败")


@router.get("/suggestions")
async def get_query_suggestions(
    partial_query: str = Query(..., description="部分查询文本"),
    limit: int = Query(10, ge=1, le=20, description="建议数量限制")
):
    """获取查询建议"""
    try:
        if len(partial_query.strip()) < 2:
            return {
                "success": True,
                "data": {"suggestions": []},
                "message": "查询文本太短"
            }
        
        # 基于历史查询和知识库内容生成建议
        suggestions = []
        
        # 1. 基于关键词的建议
        keyword_suggestions = await _get_keyword_suggestions(partial_query)
        suggestions.extend(keyword_suggestions)
        
        # 2. 基于历史查询的建议
        history_suggestions = await _get_history_suggestions(partial_query)
        suggestions.extend(history_suggestions)
        
        # 3. 基于知识库内容的建议
        content_suggestions = await _get_content_suggestions(partial_query)
        suggestions.extend(content_suggestions)
        
        # 去重并限制数量
        unique_suggestions = list(dict.fromkeys(suggestions))[:limit]
        
        return {
            "success": True,
            "data": {"suggestions": unique_suggestions},
            "message": "获取查询建议成功"
        }
        
    except Exception as e:
        logger.error(f"获取查询建议失败: {e}")
        raise HTTPException(status_code=500, detail="获取建议失败")


async def _get_keyword_suggestions(partial_query: str) -> List[str]:
    """基于关键词获取建议"""
    # 地聚物相关的常见查询模板
    templates = [
        "地聚物材料的{}性能如何？",
        "{}对地聚物性能的影响",
        "地聚物在{}方面的应用",
        "如何提高地聚物的{}？",
        "地聚物{}的机理是什么？"
    ]
    
    # 常见关键词
    keywords = [
        "抗压强度", "抗折强度", "耐久性", "孔隙率", 
        "流动性", "凝结时间", "收缩", "碳化",
        "耐火性", "耐酸性", "热稳定性"
    ]
    
    suggestions = []
    query_lower = partial_query.lower()
    
    # 匹配关键词
    for keyword in keywords:
        if query_lower in keyword.lower() or keyword.lower() in query_lower:
            for template in templates:
                suggestion = template.format(keyword)
                if partial_query.lower() in suggestion.lower():
                    suggestions.append(suggestion)
    
    return suggestions[:5]


async def _get_history_suggestions(partial_query: str) -> List[str]:
    """基于历史查询获取建议"""
    # 这里应该查询数据库中的历史问题
    # 暂时返回模拟数据
    common_queries = [
        "地聚物材料的制备工艺是什么？",
        "地聚物混凝土的抗压强度如何？",
        "地聚物的耐久性能怎么样？",
        "如何优化地聚物的配合比？",
        "地聚物在建筑工程中的应用前景"
    ]
    
    suggestions = []
    query_lower = partial_query.lower()
    
    for query in common_queries:
        if query_lower in query.lower():
            suggestions.append(query)
    
    return suggestions[:3]


async def _get_content_suggestions(partial_query: str) -> List[str]:
    """基于知识库内容获取建议"""
    try:
        # 使用检索服务查找相关内容
        results = await intelligent_retrieval_service.search(
            query=partial_query,
            top_k=5,
            mode="dual"
        )
        
        suggestions = []
        for result in results:
            # 从检索结果中提取可能的查询建议
            content = result.get('content', '')
            if len(content) > 50:
                # 简化为问题形式
                suggestion = f"关于{partial_query}的{content[:20]}...的问题"
                suggestions.append(suggestion)
        
        return suggestions[:2]
        
    except Exception as e:
        logger.warning(f"基于内容获取建议失败: {e}")
        return []


async def _process_qa_config(request: QARequest, user_id: str = "default") -> Dict[str, Any]:
    """处理QA请求的配置参数"""
    try:
        # 加载用户的对话配置
        from api.endpoints.conversation_config import load_conversation_config
        user_config = load_conversation_config(user_id)
        
        # 如果指定了预设，应用预设配置
        if request.preset_name:
            preset = None
            for p in user_config.quick_presets:
                if p.name == request.preset_name:
                    preset = p
                    break
            
            if preset:
                # 应用预设的模型参数
                model_params = preset.model_params.dict()
                conv_params = preset.conversation_params.dict()
            else:
                logger.warning(f"预设 '{request.preset_name}' 不存在，使用默认配置")
                model_params = user_config.model_params.dict()
                conv_params = user_config.conversation_management.dict()
        else:
            # 使用用户当前配置
            model_params = user_config.model_params.dict()
            conv_params = user_config.conversation_management.dict()
        
        # 请求参数覆盖配置参数
        if request.temperature is not None:
            model_params['temperature'] = request.temperature
        if request.max_tokens is not None:
            model_params['max_tokens'] = request.max_tokens
        if request.top_p is not None:
            model_params['top_p'] = request.top_p
        if request.enable_streaming is not None:
            conv_params['enable_streaming'] = request.enable_streaming
        if request.enable_context_memory is not None:
            conv_params['enable_context_memory'] = request.enable_context_memory
        if request.max_context_turns is not None:
            conv_params['context_window_size'] = request.max_context_turns
        
        return {
            'model_params': model_params,
            'conversation_params': conv_params,
            'preset_name': request.preset_name
        }
        
    except Exception as e:
        logger.warning(f"处理QA配置失败，使用默认参数: {e}")
        return {
            'model_params': {
                'temperature': 0.7,
                'max_tokens': 2000,
                'top_p': 0.95
            },
            'conversation_params': {
                'enable_streaming': True,
                'enable_context_memory': True,
                'context_window_size': 10,
                'max_conversation_turns': 20
            },
            'preset_name': None
        }


async def _apply_context_memory(request: QARequest, config: Dict[str, Any], session_id: str) -> str:
    """应用智能上下文记忆逻辑 - 优化版本"""
    try:
        conv_params = config['conversation_params']
        
        if not conv_params.get('enable_context_memory', True):
            return request.question
        
        # 获取数据库会话
        from db.database import get_session
        from db.repositories.conversation_repository import ConversationRepository
        
        # 创建临时会话获取历史对话
        async_session = get_session()
        if async_session is None:
            logger.warning("数据库会话不可用，跳过上下文记忆")
            return request.question
            
        try:
            conversation_repo = ConversationRepository(async_session)
            
            # 获取历史对话
            context_window_size = conv_params.get('context_window_size', 8)  # 减少到8轮避免token过多
            history = await conversation_repo.get_conversation_history(session_id, limit=context_window_size * 2)
            
            if not history or len(history) < 2:  # 至少需要一轮对话（用户+AI）
                return request.question
            
            # 智能过滤和构建上下文
            context_messages = []
            relevant_pairs = 0
            max_context_length = 1500  # 限制上下文长度避免token超限
            current_length = 0
            
            # 逆序处理，优先包含最近的对话
            for i in range(len(history) - 1, -1, -1):
                msg = history[i]
                content = msg['content']
                
                # 过滤过长的消息
                if len(content) > 300:
                    content = content[:300] + "..."
                
                # 检查是否超过长度限制
                estimated_length = len(content) + 20  # 加上格式字符
                if current_length + estimated_length > max_context_length:
                    break
                
                if msg['type'] == 'user':
                    context_messages.insert(0, f"用户: {content}")
                    current_length += estimated_length
                elif msg['type'] == 'ai':
                    # 过滤AI回复中的过长技术细节
                    if len(content) > 200:
                        # 尝试提取关键信息
                        lines = content.split('\n')
                        key_lines = [line for line in lines if not line.strip().startswith(('```', '#', '## ', '* ', '- '))]
                        if key_lines:
                            content = '\n'.join(key_lines[:3])  # 只取前3个关键行
                    
                    context_messages.insert(0, f"助手: {content}")
                    current_length += estimated_length
                    relevant_pairs += 1
                
                # 限制对话轮数
                if relevant_pairs >= context_window_size:
                    break
            
            if not context_messages:
                return request.question
            
            # 智能判断是否需要上下文
            question_keywords = set(request.question.lower().split())
            context_text = ' '.join(context_messages).lower()
            
            # 如果问题包含指代词或相关词汇，使用完整上下文
            referential_words = {'这个', '那个', '它', '此', '前面', '上面', '刚才', '之前', '继续', '还有', '另外'}
            needs_context = any(word in request.question for word in referential_words)
            
            if needs_context or any(keyword in context_text for keyword in question_keywords):
                # 格式化包含上下文的提示
                enhanced_question = f"""参考对话历史回答问题：

{chr(10).join(context_messages[-6:])}  // 最多显示最近3轮对话

当前问题: {request.question}

请基于对话历史提供连贯的回答。"""
                
                logger.info(f"应用智能上下文记忆: 会话ID={session_id}, 上下文消息数={len(context_messages)}, 上下文长度={current_length}")
                return enhanced_question.strip()
            else:
                # 问题相对独立，不需要详细上下文
                logger.info(f"问题相对独立，跳过详细上下文: {request.question[:50]}")
                return request.question
            
        finally:
            if hasattr(async_session, 'close'):
                await async_session.close()
        
    except Exception as e:
        logger.warning(f"应用上下文记忆失败: {e}")
        return request.question


@router.get("/conversations", response_model=ConversationListResponse)
async def get_conversation_list(
    page: int = Query(1, ge=1, description="页码"),
    size: int = Query(20, ge=1, le=100, description="每页大小"),
    mode: Optional[str] = Query(None, description="对话模式过滤: 'expert' 或 'team'"),
    conversation_repo: ConversationRepository = Depends(get_conversation_repository)
):
    """
    获取对话列表
    """
    try:
        logger.info(f"获取对话列表: page={page}, size={size}, mode={mode}")
        result = await conversation_repo.get_conversation_list(page=page, size=size, mode=mode)
        
        conversations = []
        for conv_data in result.get('conversations', []):
            conversations.append(ConversationSummary(
                id=conv_data.get('id'),
                session_id=conv_data.get('session_id'),
                title=conv_data.get('title', '未命名对话'),
                message_count=conv_data.get('message_count', 0),
                last_message=conv_data.get('last_message', ''),
                created_at=conv_data.get('created_at', ''),
                updated_at=conv_data.get('updated_at'),
                # 新增模式信息
                conversation_mode=conv_data.get('conversation_mode', 'expert'),
                mode_display_name=conv_data.get('mode_display_name', '专家模式')
            ))
        
        return ConversationListResponse(
            conversations=conversations,
            total=result.get('total', 0),
            page=page,
            size=size
        )
        
    except Exception as e:
        logger.error(f"获取对话列表失败: {e}")
        raise HTTPException(status_code=500, detail=f"获取对话列表失败: {str(e)}")


@router.get("/conversations/{session_id}/history", response_model=ConversationHistoryResponse)
async def get_conversation_history(
    session_id: str,
    limit: int = Query(50, ge=1, le=200, description="消息数量限制"),
    conversation_repo: ConversationRepository = Depends(get_conversation_repository)
):
    """
    获取指定对话的历史消息 - 自动检测Team模式
    """
    try:
        # 首先检查是否是Team对话
        is_team_conversation = await _is_team_conversation(session_id, conversation_repo)
        
        if is_team_conversation:
            logger.info(f"检测到Team对话，使用Team历史加载: {session_id}")
            history = await conversation_repo.get_team_conversation_history(session_id, limit=limit)
        else:
            logger.info(f"普通对话，使用标准历史加载: {session_id}")
            history = await conversation_repo.get_conversation_history(session_id, limit=limit)
        
        # 区分对话不存在和对话无消息的情况
        if history is None:
            raise HTTPException(status_code=404, detail="对话不存在")
        
        # 如果history是空列表，说明对话存在但无消息，这是正常情况
        if not isinstance(history, list):
            history = []
        
        return ConversationHistoryResponse(
            session_id=session_id,
            messages=history,
            total_messages=len(history)
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"获取对话历史失败: {e}")
        raise HTTPException(status_code=500, detail=f"获取对话历史失败: {str(e)}")

async def _is_team_conversation(session_id: str, conversation_repo: ConversationRepository) -> bool:
    """检查对话是否为Team模式"""
    try:
        # 添加session是否存在的检查
        if not hasattr(conversation_repo, 'session') or conversation_repo.session is None:
            logger.warning("数据库会话不可用，默认使用普通对话模式")
            return False
            
        result = await conversation_repo.session.execute(
            text("SELECT conversation_type FROM conversations WHERE session_id = :session_id"),
            {"session_id": session_id}
        )
        row = result.fetchone()
        return row and row[0] == 'team'
    except Exception as e:
        logger.warning(f"检查Team对话类型失败: {e}")
        return False


@router.delete("/conversations/{session_id}")
async def delete_conversation(
    session_id: str,
    conversation_repo: ConversationRepository = Depends(get_conversation_repository)
):
    """
    删除指定对话
    """
    try:
        # 调用conversation_repo的删除方法
        success = await conversation_repo.delete_conversation(session_id)
        
        if not success:
            raise HTTPException(status_code=404, detail="对话不存在")
        
        return {"message": "对话删除成功", "session_id": session_id}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"删除对话失败: {e}")
        raise HTTPException(status_code=500, detail=f"删除对话失败: {str(e)}")


@router.put("/conversations/{session_id}/title")
async def update_conversation_title(
    session_id: str,
    title_data: Dict[str, str],
    conversation_repo: ConversationRepository = Depends(get_conversation_repository)
):
    """
    更新对话标题
    """
    try:
        new_title = title_data.get('title', '').strip()
        if not new_title:
            raise HTTPException(status_code=400, detail="标题不能为空")
        
        success = await conversation_repo.update_conversation_title(session_id, new_title)
        
        if not success:
            raise HTTPException(status_code=404, detail="对话不存在")
        
        return {"message": "标题更新成功", "session_id": session_id, "title": new_title}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"更新对话标题失败: {e}")
        raise HTTPException(status_code=500, detail=f"更新对话标题失败: {str(e)}")


@router.post("/conversations/{session_id}/auto-title")
async def auto_generate_title(
    session_id: str,
    conversation_repo: ConversationRepository = Depends(get_conversation_repository)
):
    """
    为对话自动生成标题（基于第一个用户问题）
    """
    try:
        # 获取对话历史
        history = await conversation_repo.get_conversation_history(session_id, limit=10)
        
        if not history:
            raise HTTPException(status_code=404, detail="对话不存在")
        
        # 找到第一个用户消息
        first_user_message = None
        for message in history:
            if message.get('type') == 'user':
                first_user_message = message.get('content', '')
                break
        
        if not first_user_message:
            raise HTTPException(status_code=400, detail="对话中没有用户消息")
        
        # 生成标题
        repo = conversation_repo
        new_title = repo._generate_conversation_title(first_user_message)
        
        # 更新标题
        success = await conversation_repo.update_conversation_title(session_id, new_title)
        
        if not success:
            raise HTTPException(status_code=404, detail="对话不存在")
        
        return {
            "message": "标题自动生成成功",
            "session_id": session_id,
            "title": new_title,
            "source_message": first_user_message[:50] + "..." if len(first_user_message) > 50 else first_user_message
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"自动生成对话标题失败: {e}")
        raise HTTPException(status_code=500, detail=f"自动生成标题失败: {str(e)}")


@router.post("/interrupt/{session_id}")
async def interrupt_session(
    session_id: str
):
    """
    中断指定会话的处理
    """
    try:
        from service.agent_service import agent_service
        success = await agent_service.cancel_session(session_id)
        
        if success:
            return {
                "success": True,
                "message": f"会话 {session_id} 已被中断",
                "session_id": session_id
            }
        else:
            return {
                "success": False,
                "message": f"会话 {session_id} 不存在或已结束",
                "session_id": session_id
            }
    except Exception as e:
        logger.error(f"中断会话失败: {e}")
        raise HTTPException(status_code=500, detail=f"中断会话失败: {str(e)}")


@router.post("/conversations/batch-update-titles")
async def batch_update_conversation_titles(
    conversation_repo: ConversationRepository = Depends(get_conversation_repository)
):
    """
    批量更新所有历史对话的标题
    """
    try:
        from sqlalchemy import text
        
        # 获取所有需要更新标题的对话
        result = await conversation_repo.session.execute(text("""
            SELECT DISTINCT c.session_id, c.title, cm.content as first_user_message, c.created_at
            FROM conversations c
            JOIN conversation_messages cm ON c.id = cm.conversation_id
            WHERE (c.title IS NULL OR c.title = '' OR c.title = '未命名对话' OR c.title = '新对话' OR c.title = '点击开始对话')
              AND cm.message_type = 'user'
              AND cm.id = (
                SELECT MIN(cm2.id) 
                FROM conversation_messages cm2 
                WHERE cm2.conversation_id = c.id AND cm2.message_type = 'user'
              )
            ORDER BY c.created_at DESC;
        """))
        
        conversations_to_update = result.fetchall()
        
        if not conversations_to_update:
            return {
                "message": "没有找到需要更新标题的对话", 
                "updated_count": 0,
                "total_found": 0
            }
        
        # 批量更新对话标题
        updated_count = 0
        error_count = 0
        
        for conv in conversations_to_update:
            session_id = conv.session_id
            first_message = conv.first_user_message
            
            try:
                # 生成新标题
                new_title = conversation_repo._generate_conversation_title(first_message)
                
                # 更新标题
                success = await conversation_repo.update_conversation_title(session_id, new_title)
                if success:
                    updated_count += 1
                    logger.info(f"批量更新标题: {session_id[:20]}... -> {new_title}")
                else:
                    error_count += 1
                    
            except Exception as e:
                error_count += 1
                logger.error(f"更新单个对话标题失败: {session_id} - {e}")
        
        return {
            "message": f"批量更新完成",
            "total_found": len(conversations_to_update),
            "updated_count": updated_count,
            "error_count": error_count,
            "success_rate": f"{updated_count / len(conversations_to_update) * 100:.1f}%" if conversations_to_update else "0%"
        }
        
    except Exception as e:
        logger.error(f"批量更新对话标题失败: {e}")
        raise HTTPException(status_code=500, detail=f"批量更新失败: {str(e)}")


@router.get("/defaults")
async def get_default_configurations():
    """获取系统默认配置（包括专家模式和Team模式）"""
    try:
        # 从环境变量获取默认配置
        default_expert_model = os.getenv('DEFAULT_LLM_MODEL', 'qwen3-30b-a3b-instruct-2507')
        default_team_name = os.getenv('TEAM_DEFAULT_NAME', 'geopolymer_qa_team_v2')
        default_team_model = os.getenv('TEAM_DEFAULT_MODEL', 'qwen3-30b-a3b-instruct-2507')
        default_translation_model = os.getenv('TEAM_TRANSLATION_MODEL', 'gemini-2.5-flash-preview-thinking')
        
        return {
            "success": True,
            "data": {
                "expert": {
                    "default_model": default_expert_model
                },
                "team": {
                    "default_name": default_team_name,
                    "default_model": default_team_model,
                    "default_translation_model": default_translation_model
                },
                "models": {
                    "expert_default": default_expert_model,
                    "team_default": default_team_model,
                    "available_models": [
                        "qwen3-235b-a22b-instruct-2507",
                        "qwen3-30b-a3b-instruct-2507", 
                        "kimi-k2-siliconflow",
                        "gpt-4o-mini",
                        "gemini-2.5-flash-preview-thinking"
                    ]
                }
            }
        }
        
    except Exception as e:
        logger.error(f"获取默认配置失败: {e}")
        raise HTTPException(status_code=500, detail=f"获取默认配置失败: {str(e)}")


