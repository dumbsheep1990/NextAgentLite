"""
对话数据访问层 - Repository模式实现
"""
from typing import List, Optional, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc, text
from sqlalchemy.orm import selectinload
import uuid
import json
import time

from core.logger import logger
from models.conversation import Conversation, ConversationMessage


class ConversationRepository:
    """对话数据仓库"""
    
    def __init__(self, session: AsyncSession):
        self.session = session
    
    async def save_team_conversation(
        self,
        session_id: str,
        question: str,
        answer: str,
        team_name: str,
        team_mode: str,
        team_info: Dict[str, Any],
        model_used: str,
        processing_time: float,
        confidence_score: Optional[float] = None,
        sources: Optional[List[Dict[str, Any]]] = None,
        knowledge_sources: Optional[List[Dict[str, Any]]] = None,
        thinking: Optional[List[Dict[str, Any]]] = None,
        metadata: Optional[Dict[str, Any]] = None,
        user_id: Optional[int] = None
    ) -> int:
        """保存Team模式对话记录"""
        try:
            # 获取或创建Team对话会话
            conversation = await self._get_or_create_team_conversation(
                session_id, team_name, team_mode, user_id=user_id
            )
            
            # 如果对话没有标题，生成新标题
            if not conversation.title or conversation.title in ['新对话', '未命名对话']:
                new_title = self._generate_conversation_title(question)
                conversation.title = new_title
                await self.session.commit()
                logger.info(f"为Team对话生成标题: session_id={session_id}, title={new_title}")
            
            # 保存用户消息
            user_message = ConversationMessage(
                conversation_id=conversation.id,
                message_type="user",
                content=question
            )
            self.session.add(user_message)
            
            # 保存Team AI响应（使用专用的team_info字段和is_team_message标记）
            ai_message = ConversationMessage(
                conversation_id=conversation.id,
                message_type="ai",
                content=answer,
                confidence=confidence_score,
                sources=sources,
                knowledge_sources=knowledge_sources,
                thinking=thinking,  # 保持thinking字段原有格式
                is_team_message=True,  # 🔥 使用专用字段标记Team消息
                team_info=team_info,   # 🔥 使用专用team_info字段存储Team数据
                processing_time=processing_time,
                model_used=model_used,
                tokens_used=metadata.get("tokens_used") if metadata else None,
                agent_id=team_name,
                agent_name=f"Team: {team_name}"
            )
            self.session.add(ai_message)
            
            await self.session.commit()
            await self.session.refresh(ai_message)
            
            # 记录保存结果
            final_message_count = await self._get_message_count(conversation.id)
            logger.info(f"💾 [CONVERSATION_REPO] Team消息保存完成: conv_id={conversation.id}, message_id={ai_message.id}, 总消息数={final_message_count}")
            
            # 保存Team执行记录和成员调用记录 - 🔥 修复：支持新的字段名称
            execution_id = team_info.get('execution_id') or team_info.get('executionId')
            member_calls = team_info.get('member_calls') or team_info.get('memberCalls')
            if execution_id and member_calls:
                await self._save_team_execution_data(
                    conversation.id,
                    ai_message.id,
                    team_info,
                    session_id
                )
            
            logger.info(f"✅ [CONVERSATION_REPO] Team对话记录已保存: session_id={session_id}, message_id={ai_message.id}, 对话总消息数={final_message_count}")
            return ai_message.id
            
        except Exception as e:
            await self.session.rollback()
            logger.error(f"保存Team对话记录失败: {e}")
            raise

    async def save_conversation(
        self,
        session_id: str,
        question: str,
        answer: str,
        agent_name: str,
        model_used: str,
        processing_time: float,
        confidence_score: Optional[float] = None,
        sources: Optional[List[Dict[str, Any]]] = None,
        knowledge_sources: Optional[List[Dict[str, Any]]] = None,
        graph_sources: Optional[Dict[str, Any]] = None,  # 添加图谱检索结果参数
        metadata: Optional[Dict[str, Any]] = None,
        agent_id: Optional[str] = None,
        agent_display_name: Optional[str] = None,
        thinking: Optional[List[Dict[str, Any]]] = None,
        user_id: Optional[int] = None
    ) -> int:
        """保存对话记录"""
        try:
            # 获取或创建对话会话
            conversation = await self._get_or_create_conversation(session_id, user_id=user_id)
            
            # 如果对话没有标题或标题是默认值，生成新标题
            if not conversation.title or conversation.title in ['新对话', '未命名对话']:
                new_title = self._generate_conversation_title(question)
                conversation.title = new_title
                await self.session.commit()
                logger.info(f"为对话生成标题: session_id={session_id}, title={new_title}")
            
            # 保存用户消息
            user_message = ConversationMessage(
                conversation_id=conversation.id,
                message_type="user",
                content=question
            )
            self.session.add(user_message)
            
            # 直接使用独立的knowledge_sources字段
            
            # 保存AI响应 - 创建消息参数字典
            message_params = {
                "conversation_id": conversation.id,
                "message_type": "ai",
                "content": answer,
                "confidence": confidence_score,
                "sources": sources,  # 一般来源
                "knowledge_sources": knowledge_sources,  # 知识库来源
                "thinking": thinking,  # 添加thinking数据
                "processing_time": processing_time,
                "model_used": model_used,
                "tokens_used": metadata.get("tokens_used") if metadata else None,
                "agent_id": agent_id,
                "agent_name": agent_display_name
            }
            
            # 添加graph_sources字段 - 区分启用和未启用图谱检索的情况
            if graph_sources:
                # 用户启用了图谱检索，保存图谱检索结果
                message_params["graph_sources"] = graph_sources
                logger.debug(f"[图谱检索已启用] 保存graph_sources数据: {len(str(graph_sources))} 字符")
                
                # 记录图谱检索的详细信息用于调试
                if isinstance(graph_sources, dict):
                    entities_count = len(graph_sources.get('entities', []))
                    relationships_count = len(graph_sources.get('relationships', []))
                    sources_count = len(graph_sources.get('sources', []))
                    logger.info(f"[图谱检索结果] 实体: {entities_count}个, 关系: {relationships_count}个, 来源: {sources_count}个")
            else:
                # 用户未启用图谱检索或无图谱检索结果
                message_params["graph_sources"] = None
                logger.debug("[图谱检索未启用] graph_sources设为NULL")
            
            ai_message = ConversationMessage(**message_params)
            self.session.add(ai_message)
            
            await self.session.commit()
            await self.session.refresh(ai_message)
            
            logger.info(f"对话记录已保存: session_id={session_id}, message_id={ai_message.id}")
            return ai_message.id
            
        except Exception as e:
            await self.session.rollback()
            logger.error(f"保存对话记录失败: {e}")
            raise
    
    async def get_team_conversation_history(
        self,
        session_id: str,
        limit: int = 50
    ) -> Optional[List[Dict[str, Any]]]:
        """获取Team对话历史"""
        try:
            logger.info(f"开始获取Team对话历史: session_id={session_id}")
            
            # 使用标准的对话查询，简化逻辑
            result = await self.session.execute(
                select(Conversation)
                .options(selectinload(Conversation.messages))
                .where(Conversation.session_id == session_id)
                .where(Conversation.conversation_type == 'team')
            )
            conversation = result.scalar_one_or_none()
            
            if not conversation:
                logger.info(f"未找到Team对话: session_id={session_id}")
                return None
            
            if not conversation.messages:
                logger.info(f"Team对话存在但无消息: session_id={session_id}")
                return []
            
            messages = []
            for message in sorted(conversation.messages, key=lambda x: x.created_at):
                try:
                    msg_dict = {
                        "id": message.id,
                        "type": message.message_type,
                        "content": message.content,
                        "created_at": message.created_at.isoformat() if message.created_at else None,
                    }
                    
                    # 处理Team消息的特殊数据
                    if message.message_type == "ai" and message.agent_id:
                        # 基本AI响应数据
                        if message.sources:
                            msg_dict["sources"] = message.sources
                        if message.knowledge_sources:
                            msg_dict["knowledgeSources"] = message.knowledge_sources
                        if message.thinking:
                            msg_dict["thinking"] = message.thinking
                        if message.processing_time:
                            msg_dict["processing_time"] = message.processing_time
                        if message.model_used:
                            msg_dict["model_used"] = message.model_used
                        if message.agent_id:
                            msg_dict["agent_id"] = message.agent_id
                        if message.agent_name:
                            msg_dict["agent_name"] = message.agent_name
                        
                        # 🔥 修复：优先从专用team_info字段读取，fallback到images字段（向后兼容）
                        team_info = {}
                        if message.team_info and isinstance(message.team_info, dict):
                            team_info = message.team_info
                            logger.info(f"📖 从team_info字段读取Team数据: {list(team_info.keys())}")
                        elif message.images and isinstance(message.images, dict):
                            team_info = message.images
                            logger.info(f"📖 从images字段读取Team数据（兼容模式）: {list(team_info.keys())}")
                        else:
                            logger.warning(f"📖 消息{message.id}没有找到Team数据")
                        
                        execution_id = team_info.get('executionId')
                        
                        # 尝试从专用Team表加载完整数据
                        team_execution_data = {}
                        if execution_id:
                            logger.info(f"🔍 从Team执行表加载数据: execution_id={execution_id}")
                            team_execution_data = await self._load_team_execution_data(execution_id)
                            logger.info(f"📊 加载的Team执行数据: memberCalls={len(team_execution_data.get('memberCalls', []))}, teamDecisions={len(team_execution_data.get('teamDecisions', []))}")
                        
                        # 🔥 修复：直接使用team_info数据，支持新的字段名称格式
                        merged_team_info = {
                            "isTeamMessage": True,
                            "teamName": conversation.team_name or team_info.get('team_name', team_info.get('teamName', 'Unknown Team')),
                            "teamMode": conversation.team_mode or team_info.get('teamMode', 'coordinate'),
                            "executionId": execution_id,
                            # 🔥 优先使用team_info中的直接数据，支持新旧字段名称
                            "memberCalls": team_info.get('member_calls', team_info.get('memberCalls', team_execution_data.get('memberCalls', []))),
                            "teamDecisions": team_info.get('team_decisions', team_info.get('teamDecisions', team_execution_data.get('teamDecisions', []))),
                            "structuredOutput": team_execution_data.get('structuredOutput', team_info.get('structuredOutput')),
                            "coordinationInfo": team_info.get('coordination_info', team_info.get('coordinationInfo', team_execution_data.get('coordinationInfo'))),
                            "monitoringData": team_info.get('monitoringData'),
                            "processingTime": team_info.get('processing_time', team_info.get('processingTime', message.processing_time)),
                            # 将knowledgeSources添加到teamInfo中供溯源使用
                            "knowledge_sources": team_execution_data.get('knowledgeSources', message.knowledge_sources or []),
                            # 保留原始team_info数据中的其他字段
                            **{k: v for k, v in team_info.items() if k not in ['team_name', 'teamName', 'teamMode', 'execution_id', 'executionId', 'member_calls', 'memberCalls', 'team_decisions', 'teamDecisions', 'coordination_info', 'coordinationInfo', 'structuredOutput', 'monitoringData', 'processing_time', 'processingTime']}
                        }
                        
                        msg_dict["teamInfo"] = merged_team_info
                        
                        # 🔥 调试日志：验证数据完整性
                        logger.info(f"📋 消息{message.id}的Team数据: memberCalls={len(merged_team_info.get('memberCalls', []))}, teamDecisions={len(merged_team_info.get('teamDecisions', []))}")
                        
                        # 添加timestamp字段以确保正确显示
                        msg_dict["timestamp"] = int(message.created_at.timestamp() * 1000) if message.created_at else int(time.time() * 1000)
                    
                    # 确保用户消息也有基本的时间戳
                    if "timestamp" not in msg_dict:
                        msg_dict["timestamp"] = int(message.created_at.timestamp() * 1000) if message.created_at else int(time.time() * 1000)
                    
                    messages.append(msg_dict)
                    
                except Exception as msg_error:
                    logger.error(f"处理Team消息失败 (消息 {message.id}): {msg_error}")
                    continue
            
            logger.info(f"成功获取Team对话历史: {len(messages)} 条消息")
            return messages
            
        except Exception as e:
            logger.error(f"获取Team对话历史失败: {e}")
            import traceback
            logger.error(f"详细错误信息: {traceback.format_exc()}")
            return None

    async def get_conversation_history(
        self,
        session_id: str,
        limit: int = 50
    ) -> Optional[List[Dict[str, Any]]]:
        """获取对话历史"""
        try:
            logger.info(f"开始获取对话历史: session_id={session_id}, limit={limit}")
            
            result = await self.session.execute(
                select(Conversation)
                .options(selectinload(Conversation.messages))
                .where(Conversation.session_id == session_id)
            )
            conversation = result.scalar_one_or_none()
            
            if not conversation:
                logger.info(f"未找到对话: session_id={session_id}")
                return None
            
            logger.info(f"找到对话 {conversation.id}，消息数量: {len(conversation.messages)}")
            
            # 如果对话存在但没有消息，返回空列表（不是None）
            if not conversation.messages:
                logger.info(f"对话存在但无消息: session_id={session_id}")
                return []
            
            messages = []
            for message in sorted(conversation.messages, key=lambda x: x.created_at):
                try:
                    msg_dict = {
                        "id": message.id,
                        "type": message.message_type,
                        "content": message.content,
                        "created_at": message.created_at.isoformat(),
                    }
                    
                    # 添加AI响应的元数据
                    if message.message_type == "ai":
                        # 安全地获取每个字段，避免属性不存在的错误
                        ai_metadata = {}
                        
                        # 基本字段
                        if hasattr(message, 'confidence'):
                            ai_metadata["confidence"] = message.confidence
                        if hasattr(message, 'sources'):
                            ai_metadata["sources"] = message.sources
                        if hasattr(message, 'knowledge_sources'):
                            ai_metadata["knowledgeSources"] = message.knowledge_sources
                            logger.debug(f"消息 {message.id} 包含knowledge_sources: {len(message.knowledge_sources) if message.knowledge_sources else 0} 个")
                            
                            # 🔥 添加adopted字段的专项检查
                            if message.knowledge_sources:
                                for i, source in enumerate(message.knowledge_sources):
                                    logger.info(f"[ADOPTED_LOAD_DEBUG] 消息{message.id} Source {i}: adopted={source.get('adopted') if isinstance(source, dict) else 'N/A'}, source_type={source.get('source_type') if isinstance(source, dict) else 'N/A'}")
                        if hasattr(message, 'images'):
                            ai_metadata["images"] = message.images
                        if hasattr(message, 'tables'):
                            ai_metadata["tables"] = message.tables
                        if hasattr(message, 'highlights'):
                            ai_metadata["highlights"] = message.highlights
                        if hasattr(message, 'processing_time'):
                            ai_metadata["processing_time"] = message.processing_time
                        if hasattr(message, 'model_used'):
                            ai_metadata["model_used"] = message.model_used
                        if hasattr(message, 'agent_id'):
                            ai_metadata["agent_id"] = message.agent_id
                        if hasattr(message, 'agent_name'):
                            ai_metadata["agent_name"] = message.agent_name
                            
                        # 特别处理thinking字段
                        try:
                            thinking_data = getattr(message, 'thinking', None)
                            ai_metadata["thinking"] = thinking_data
                            if thinking_data:
                                logger.debug(f"消息 {message.id} 包含thinking数据: {len(thinking_data) if isinstance(thinking_data, list) else 'non-list'}")
                        except Exception as thinking_error:
                            logger.warning(f"获取thinking数据失败 (消息 {message.id}): {thinking_error}")
                            ai_metadata["thinking"] = None
                        
                        # 处理graph_sources字段 - 兼容启用/未启用图谱检索的情况
                        try:
                            if hasattr(message, 'graph_sources'):
                                graph_sources_data = getattr(message, 'graph_sources', None)
                                ai_metadata["graphSources"] = graph_sources_data
                                
                                if graph_sources_data:
                                    # 记录图谱检索结果的统计信息
                                    if isinstance(graph_sources_data, dict):
                                        entities_count = len(graph_sources_data.get('entities', []))
                                        relationships_count = len(graph_sources_data.get('relationships', []))
                                        sources_count = len(graph_sources_data.get('sources', []))
                                        logger.debug(f"[读取图谱数据] 消息 {message.id} - 实体: {entities_count}个, 关系: {relationships_count}个, 来源: {sources_count}个")
                                else:
                                    logger.debug(f"[图谱数据] 消息 {message.id} - 无图谱检索结果")
                            else:
                                # 旧版本消息没有graph_sources字段
                                ai_metadata["graphSources"] = None
                                logger.debug(f"[兼容性] 消息 {message.id} - 旧版本，无graph_sources字段")
                        except Exception as graph_error:
                            logger.warning(f"获取graph_sources数据失败 (消息 {message.id}): {graph_error}")
                            ai_metadata["graphSources"] = None
                        
                        msg_dict.update(ai_metadata)
                    
                    messages.append(msg_dict)
                    
                except Exception as msg_error:
                    logger.error(f"处理消息失败 (消息 {getattr(message, 'id', 'unknown')}): {msg_error}")
                    # 继续处理其他消息，不让单个消息错误中断整个流程
                    continue
            
            result_messages = messages[-limit:] if len(messages) > limit else messages
            logger.info(f"成功获取对话历史: {len(result_messages)} 条消息")
            return result_messages
            
        except Exception as e:
            logger.error(f"获取对话历史失败: {e}")
            # 提供更详细的错误信息
            import traceback
            logger.error(f"详细错误信息: {traceback.format_exc()}")
            # 返回None表示查询失败，让上层判断是否抛出404
            return None
    
    async def get_conversation_list(
        self,
        page: int = 1,
        size: int = 20,
        mode: Optional[str] = None
    ) -> Dict[str, Any]:
        """获取对话列表 - 避免conversation_messages表查询超时"""
        try:
            logger.info(f"开始获取对话列表: page={page}, size={size}, mode={mode}")
            logger.info("[CONV_LIST_DEBUG] get_conversation_list 方法被调用")
            
            # 构建基础查询和计数查询
            base_query = select(Conversation)
            count_query = select(func.count(Conversation.id))
            
            # 根据mode参数添加过滤条件
            if mode:
                if mode == 'expert':
                    # 专家模式：conversation_type为'single'或NULL
                    filter_condition = (Conversation.conversation_type == 'single') | (Conversation.conversation_type.is_(None))
                    logger.info("应用专家模式过滤: conversation_type = 'single' OR conversation_type IS NULL")
                elif mode == 'team':
                    # 团队模式：conversation_type为'team'
                    filter_condition = Conversation.conversation_type == 'team'
                    logger.info("应用团队模式过滤: conversation_type = 'team'")
                else:
                    filter_condition = None
                
                if filter_condition is not None:
                    base_query = base_query.where(filter_condition)
                    count_query = count_query.where(filter_condition)
            
            # 获取总数（应用过滤后的）
            count_result = await self.session.execute(count_query)
            total = count_result.scalar()
            logger.info(f"过滤后对话总数: {total} (mode={mode})")
            
            # 获取对话列表 - 确保包含所有必要字段
            offset = (page - 1) * size
            try:
                result = await self.session.execute(
                    base_query
                    .order_by(desc(Conversation.created_at))  # 直接使用created_at避免updated_at问题
                    .offset(offset)
                    .limit(size)
                )
                conversations = result.scalars().all()
                logger.info(f"获取到 {len(conversations)} 个对话")
            except Exception as query_error:
                logger.error(f"查询对话列表失败: {query_error}")
                raise
            
            # 获取对话摘要信息，包含消息数量和最后消息
            conversation_summaries = []
            for conv in conversations:
                try:
                    # 获取消息数量
                    try:
                        message_count_result = await self.session.execute(
                            select(func.count(ConversationMessage.id))
                            .where(ConversationMessage.conversation_id == conv.id)
                        )
                        message_count = message_count_result.scalar() or 0
                    except Exception as count_error:
                        logger.warning(f"获取消息数量失败 (对话 {conv.id}): {count_error}")
                        message_count = 0
                    
                    # 获取最后一条消息和模式信息
                    try:
                        last_message_result = await self.session.execute(
                            select(ConversationMessage.content, ConversationMessage.agent_id, ConversationMessage.agent_name)
                            .where(ConversationMessage.conversation_id == conv.id)
                            .order_by(desc(ConversationMessage.created_at))
                            .limit(1)
                        )
                        last_message_row = last_message_result.fetchone()
                        last_message = last_message_row[0][:50] + "..." if last_message_row and len(last_message_row[0]) > 50 else (last_message_row[0] if last_message_row else "")
                        
                        # 获取该对话的模式信息（通过分析AI消息的agent_id）
                        mode_result = await self.session.execute(
                            select(ConversationMessage.agent_id)
                            .where(ConversationMessage.conversation_id == conv.id)
                            .where(ConversationMessage.message_type == 'ai')
                            .where(ConversationMessage.agent_id.isnot(None))
                            .limit(1)
                        )
                        mode_row = mode_result.fetchone()
                        agent_id = mode_row[0] if mode_row else None
                        
                        # 判断对话模式 - 优先检查conversation_type字段
                        conversation_mode = "expert"  # 默认专家模式
                        mode_display_name = "专家模式"
                        
                        logger.info(f"[MODE_DEBUG] 对话 {conv.id} 开始模式判断: conversation_type={getattr(conv, 'conversation_type', None)}, team_name={getattr(conv, 'team_name', None)}")
                        
                        logger.info(f"[MODE_DEBUG] 对话 {conv.id} conversation_type: {getattr(conv, 'conversation_type', None)}, agent_id: {agent_id}")
                        
                        # 首先检查conversation_type字段
                        conv_type = getattr(conv, 'conversation_type', None)
                        if conv_type == 'team':
                            conversation_mode = "team"
                            mode_display_name = "Team模式"
                            logger.info(f"[MODE_DEBUG] 对话 {conv.id} 通过conversation_type='team'识别为team模式")
                        else:
                            # conversation_type 为 'single'、None 或其他值时的处理
                            if conv_type == 'single':
                                # 明确标记为单智能体模式的对话
                                conversation_mode = "expert"
                                mode_display_name = "专家模式"
                                logger.info(f"[MODE_DEBUG] 对话 {conv.id} 通过conversation_type='single'识别为expert模式")
                            else:
                                # conversation_type 为 None 或其他值时进行额外检查
                                logger.info(f"[MODE_DEBUG] 对话 {conv.id} conversation_type='{conv_type}'，进行额外检查")
                                
                                # 检查是否有team_name字段（更强的team模式识别）
                                if hasattr(conv, 'team_name') and conv.team_name:
                                    conversation_mode = "team"
                                    mode_display_name = "Team模式"
                                    logger.info(f"[MODE_DEBUG] 对话 {conv.id} 通过team_name字段识别为team模式: {conv.team_name}")
                                elif agent_id:
                                    # 检查agent_id是否为team相关
                                    team_agents = ["geopolymer_qa_team_v2", "qa_team", "dijuwu_wendatuandui"]
                                    if any(team_id in agent_id.lower() for team_id in ["team", "tuandui"]) or agent_id in team_agents:
                                        conversation_mode = "team"
                                        mode_display_name = "Team模式"
                                        logger.info(f"[MODE_DEBUG] 对话 {conv.id} 通过agent_id识别为team模式: {agent_id}")
                                # 额外检查：如果消息中包含team相关的metadata
                                elif hasattr(last_message_obj, 'images') and last_message_obj.images:
                                    try:
                                        images_data = last_message_obj.images
                                        if isinstance(images_data, str):
                                            import json
                                            images_data = json.loads(images_data)
                                        if isinstance(images_data, dict) and (
                                            images_data.get('teamName') or 
                                            images_data.get('teamId') or
                                            images_data.get('teamDecisions') or
                                            images_data.get('memberCalls')
                                        ):
                                            conversation_mode = "team"
                                            mode_display_name = "Team模式"
                                            logger.info(f"[MODE_DEBUG] 对话 {conv.id} 通过消息team_info识别为team模式")
                                    except Exception as team_check_error:
                                        logger.debug(f"[MODE_DEBUG] Team信息检查失败: {team_check_error}")
                                
                                # 如果所有检查都没有识别为team模式，保持默认的expert模式
                                if conversation_mode == "expert":
                                    logger.info(f"[MODE_DEBUG] 对话 {conv.id} 额外检查后仍为expert模式")
                                
                        logger.info(f"[MODE_DEBUG] 对话 {conv.id} 判断结果: {conversation_mode}")
                        
                    except Exception as last_msg_error:
                        logger.warning(f"获取最后消息失败 (对话 {conv.id}): {last_msg_error}")
                        last_message = ""
                        conversation_mode = "expert"
                        mode_display_name = "专家模式"
                        logger.warning(f"[MODE_DEBUG] 对话 {conv.id} 异常，设置为默认专家模式")
                    
                    # 安全地获取时间戳
                    try:
                        created_at = conv.created_at.isoformat() if hasattr(conv, 'created_at') and conv.created_at else None
                        updated_at = conv.updated_at.isoformat() if hasattr(conv, 'updated_at') and conv.updated_at else None
                    except Exception as time_error:
                        logger.warning(f"时间戳转换失败 (对话 {conv.id}): {time_error}")
                        created_at = None
                        updated_at = None
                    
                    conversation_summaries.append({
                        "id": getattr(conv, 'id', None),
                        "session_id": getattr(conv, 'session_id', None),
                        "title": getattr(conv, 'title', '未命名对话'),
                        "message_count": message_count,
                        "last_message": last_message,
                        "created_at": created_at,
                        "updated_at": updated_at,
                        # 新增模式信息
                        "conversation_mode": conversation_mode,
                        "mode_display_name": mode_display_name
                    })
                    
                except Exception as conv_error:
                    logger.error(f"处理对话失败 (对话 {getattr(conv, 'id', 'unknown')}): {conv_error}")
                    # 继续处理其他对话，不让单个对话错误中断整个流程
                    continue
            
            logger.info(f"成功获取对话列表: {len(conversation_summaries)} 个对话")
            return {
                "conversations": conversation_summaries,
                "total": total,
                "page": page,
                "size": size,
                "total_pages": (total + size - 1) // size
            }
            
        except Exception as e:
            logger.error(f"获取对话列表失败: {e}")
            # 提供更详细的错误信息
            import traceback
            logger.error(f"详细错误信息: {traceback.format_exc()}")
            raise
    
    async def delete_conversation(self, session_id: str) -> bool:
        """删除对话"""
        try:
            result = await self.session.execute(
                select(Conversation).where(Conversation.session_id == session_id)
            )
            conversation = result.scalar_one_or_none()
            
            if not conversation:
                return False
            
            await self.session.delete(conversation)
            await self.session.commit()
            
            logger.info(f"对话已删除: session_id={session_id}")
            return True
            
        except Exception as e:
            await self.session.rollback()
            logger.error(f"删除对话失败: {e}")
            raise
    
    async def update_conversation_title(self, session_id: str, title: str) -> bool:
        """更新对话标题"""
        try:
            result = await self.session.execute(
                select(Conversation).where(Conversation.session_id == session_id)
            )
            conversation = result.scalar_one_or_none()
            
            if not conversation:
                return False
            
            conversation.title = title
            await self.session.commit()
            
            logger.info(f"对话标题已更新: session_id={session_id}, title={title}")
            return True
            
        except Exception as e:
            await self.session.rollback()
            logger.error(f"更新对话标题失败: {e}")
            raise
    
    async def save_evaluation(
        self,
        session_id: str,
        rating: int,
        feedback: str = ""
    ) -> bool:
        """保存用户评估"""
        try:
            # 这里可以添加评估表，暂时记录在日志中
            logger.info(f"用户评估: session_id={session_id}, rating={rating}, feedback={feedback}")
            return True
            
        except Exception as e:
            logger.error(f"保存评估失败: {e}")
            raise
    
    async def get_conversation_stats(self) -> Dict[str, Any]:
        """获取对话统计信息"""
        try:
            # 总对话数
            total_conv_result = await self.session.execute(
                select(func.count(Conversation.id))
            )
            total_conversations = total_conv_result.scalar()
            
            # 总消息数
            total_msg_result = await self.session.execute(
                select(func.count(ConversationMessage.id))
            )
            total_messages = total_msg_result.scalar()
            
            # 按消息类型统计
            msg_type_result = await self.session.execute(
                select(ConversationMessage.message_type, func.count(ConversationMessage.id))
                .group_by(ConversationMessage.message_type)
            )
            message_type_stats = {row[0]: row[1] for row in msg_type_result.fetchall()}
            
            # 平均置信度
            avg_confidence_result = await self.session.execute(
                select(func.avg(ConversationMessage.confidence))
                .where(ConversationMessage.message_type == "ai")
                .where(ConversationMessage.confidence.isnot(None))
            )
            avg_confidence = avg_confidence_result.scalar() or 0.0
            
            # 平均处理时间
            avg_time_result = await self.session.execute(
                select(func.avg(ConversationMessage.processing_time))
                .where(ConversationMessage.processing_time.isnot(None))
            )
            avg_processing_time = avg_time_result.scalar() or 0.0
            
            return {
                "total_conversations": total_conversations,
                "total_messages": total_messages,
                "message_type_stats": message_type_stats,
                "avg_confidence": round(avg_confidence, 2),
                "avg_processing_time": round(avg_processing_time, 2)
            }
            
        except Exception as e:
            logger.error(f"获取对话统计失败: {e}")
            raise
    
    async def _get_or_create_conversation(self, session_id: str, title: str = None, user_id: Optional[int] = None) -> Conversation:
        """获取或创建对话会话"""
        result = await self.session.execute(
            select(Conversation).where(Conversation.session_id == session_id)
        )
        conversation = result.scalar_one_or_none()
        
        if not conversation:
            conversation = Conversation(session_id=session_id, title=title, user_id=user_id)
            self.session.add(conversation)
            await self.session.commit()
            await self.session.refresh(conversation)
        
        return conversation
    
    async def _get_or_create_team_conversation(
        self, 
        session_id: str, 
        team_name: str, 
        team_mode: str, 
        title: str = None,
        user_id: Optional[int] = None
    ) -> Conversation:
        """获取或创建Team对话会话"""
        logger.info(f"🔍 [CONVERSATION_REPO] 查找Team对话: session_id={session_id}")
        
        result = await self.session.execute(
            select(Conversation).where(Conversation.session_id == session_id)
        )
        conversation = result.scalar_one_or_none()
        
        if not conversation:
            logger.info(f"📝 [CONVERSATION_REPO] 创建新Team对话: session_id={session_id}, team_name={team_name}")
            conversation = Conversation(
                session_id=session_id, 
                title=title,
                conversation_type='team',
                team_name=team_name,
                team_mode=team_mode,
                user_id=user_id
            )
            self.session.add(conversation)
            await self.session.commit()
            await self.session.refresh(conversation)
            logger.info(f"✅ [CONVERSATION_REPO] 新Team对话创建成功: id={conversation.id}, session_id={session_id}")
        else:
            logger.info(f"♻️  [CONVERSATION_REPO] 找到现有Team对话: id={conversation.id}, session_id={session_id}, 消息数={await self._get_message_count(conversation.id)}")
            # 更新已存在对话的Team信息
            if conversation.conversation_type != 'team':
                logger.info(f"🔄 [CONVERSATION_REPO] 更新对话类型: {conversation.conversation_type} -> team")
                conversation.conversation_type = 'team'
                conversation.team_name = team_name
                conversation.team_mode = team_mode
                await self.session.commit()
            
            # 🔥 修复：如果现有对话没有user_id，但传递了user_id，则更新它
            if user_id is not None and conversation.user_id is None:
                logger.info(f"🔄 [CONVERSATION_REPO] 更新现有对话的user_id: None -> {user_id}")
                conversation.user_id = user_id
                await self.session.commit()
        
        return conversation
    
    async def _get_message_count(self, conversation_id: int) -> int:
        """获取对话的消息数量"""
        result = await self.session.execute(
            select(func.count(ConversationMessage.id)).where(ConversationMessage.conversation_id == conversation_id)
        )
        return result.scalar() or 0
    
    async def _save_team_execution_data(
        self, 
        conversation_id: int, 
        message_id: int, 
        team_info: Dict[str, Any],
        session_id: str
    ):
        """保存Team执行数据到专用表"""
        try:
            execution_id = team_info.get('executionId', str(uuid.uuid4()))
            team_name = team_info.get('teamName', '')
            team_mode = team_info.get('teamMode', 'coordinate')
            member_calls = team_info.get('memberCalls', [])
            structured_output = team_info.get('structuredOutput')
            coordination_info = team_info.get('coordinationInfo')
            
            # 保存Team执行记录
            await self.session.execute(
                text("""
                    INSERT INTO team_executions 
                    (conversation_id, message_id, execution_id, team_name, team_mode, 
                     query, status, structured_output, coordination_info, total_duration_ms, session_id)
                    VALUES (:conversation_id, :message_id, :execution_id, :team_name, :team_mode,
                            :query, :status, :structured_output, :coordination_info, :total_duration_ms, :session_id)
                """),
                {
                    'conversation_id': conversation_id,
                    'message_id': message_id,
                    'execution_id': execution_id,
                    'team_name': team_name,
                    'team_mode': team_mode,
                    'query': team_info.get('query', ''),
                    'status': 'completed',
                    'structured_output': json.dumps(structured_output) if structured_output else None,
                    'coordination_info': json.dumps(coordination_info) if coordination_info else None,
                    'total_duration_ms': sum(call.get('durationMs', 0) for call in member_calls),
                    'session_id': session_id
                }
            )
            
            # 保存Team成员调用记录
            for call in member_calls:
                # 映射status值以符合数据库约束 (failed -> error)
                call_status = call.get('status', 'completed')
                if call_status == 'failed':
                    call_status = 'error'
                
                await self.session.execute(
                    text("""
                        INSERT INTO team_member_calls
                        (execution_id, member_id, member_name, role, action, call_type,
                         input_data, output_data, status, duration_ms, confidence)
                        VALUES (:execution_id, :member_id, :member_name, :role, :action, :call_type,
                                :input_data, :output_data, :status, :duration_ms, :confidence)
                    """),
                    {
                        'execution_id': execution_id,
                        'member_id': call.get('memberId', ''),
                        'member_name': call.get('memberName', ''),
                        'role': call.get('role', ''),
                        'action': call.get('action', ''),
                        'call_type': 'execute',
                        'input_data': json.dumps(call.get('input', {})),
                        'output_data': json.dumps(call.get('output', {})),
                        'status': call_status,
                        'duration_ms': call.get('durationMs', 0),
                        'confidence': call.get('confidence', 0.0)
                    }
                )
            
            # 保存知识源记录
            knowledge_sources = team_info.get('knowledgeSources', [])
            for source in knowledge_sources:
                await self.session.execute(
                    text("""
                        INSERT INTO knowledge_sources
                        (message_id, execution_id, source_type, source_id, title, content,
                         question, answer, score, adopted, retrieval_method)
                        VALUES (:message_id, :execution_id, :source_type, :source_id, :title, :content,
                                :question, :answer, :score, :adopted, :retrieval_method)
                    """),
                    {
                        'message_id': message_id,
                        'execution_id': execution_id,
                        'source_type': source.get('source_type', 'document'),
                        'source_id': source.get('id', ''),
                        'title': source.get('title', ''),
                        'content': source.get('content', ''),
                        'question': source.get('question', ''),
                        'answer': source.get('answer', ''),
                        'score': source.get('score', 0.0),
                        'adopted': source.get('adopted', False),
                        'retrieval_method': source.get('retrieval_method', 'vector')
                    }
                )
            
            # 保存Agent思考步骤（个体推理）
            thinking_steps = team_info.get('thinking', [])
            for i, step in enumerate(thinking_steps):
                await self.session.execute(
                    text("""
                        INSERT INTO thinking_steps
                        (message_id, execution_id, step_order, step_type, step_title, step_content, confidence)
                        VALUES (:message_id, :execution_id, :step_order, :step_type, :step_title, :step_content, :confidence)
                    """),
                    {
                        'message_id': message_id,
                        'execution_id': execution_id,
                        'step_order': i + 1,
                        'step_type': f"agent_{step.get('name', 'analysis')}",  # 标记为Agent思考
                        'step_title': step.get('arguments', {}).get('title', ''),
                        'step_content': step.get('arguments', {}).get('thought', ''),
                        'confidence': step.get('arguments', {}).get('confidence', 0.0)
                    }
                )
            
            # 保存Team决策步骤（团队协调决策）
            team_decisions = team_info.get('teamDecisions', [])
            for i, decision in enumerate(team_decisions):
                await self.session.execute(
                    text("""
                        INSERT INTO thinking_steps
                        (message_id, execution_id, step_order, step_type, step_title, step_content, confidence, metadata)
                        VALUES (:message_id, :execution_id, :step_order, :step_type, :step_title, :step_content, :confidence, :metadata)
                    """),
                    {
                        'message_id': message_id,
                        'execution_id': execution_id,
                        'step_order': len(thinking_steps) + i + 1,  # 在Agent思考之后
                        'step_type': f"team_{decision.get('type', 'decision')}",  # 标记为Team决策
                        'step_title': decision.get('title', ''),
                        'step_content': decision.get('content', ''),
                        'confidence': decision.get('confidence', 0.0),
                        'metadata': json.dumps({
                            'decision_type': decision.get('type'),
                            'affected_agents': decision.get('affected_agents', []),
                            'reasoning': decision.get('reasoning', ''),
                            'alternatives': decision.get('alternatives', [])
                        })
                    }
                )
            
            await self.session.commit()
            logger.info(f"Team执行数据已保存: execution_id={execution_id}, member_calls={len(member_calls)}")
            
        except Exception as e:
            await self.session.rollback()
            logger.error(f"保存Team执行数据失败: {e}")
            raise
    
    async def _load_team_execution_data(self, execution_id: str) -> Dict[str, Any]:
        """加载Team执行的完整数据"""
        try:
            # 加载成员调用记录
            member_calls_result = await self.session.execute(
                text("""
                    SELECT member_id, member_name, role, action, call_type,
                           input_data, output_data, status, duration_ms, confidence
                    FROM team_member_calls
                    WHERE execution_id = :execution_id
                    ORDER BY created_at ASC
                """),
                {"execution_id": execution_id}
            )
            
            member_calls = []
            for row in member_calls_result.fetchall():
                member_calls.append({
                    "memberId": row.member_id,
                    "memberName": row.member_name,
                    "role": row.role,
                    "action": row.action,
                    "input": json.loads(row.input_data) if row.input_data else {},
                    "output": json.loads(row.output_data) if row.output_data else {},
                    "status": row.status,
                    "durationMs": row.duration_ms,
                    "confidence": row.confidence
                })
            
            # 加载知识源记录
            knowledge_sources_result = await self.session.execute(
                text("""
                    SELECT source_type, source_id, title, content, question, answer,
                           score, adopted, retrieval_method
                    FROM knowledge_sources
                    WHERE execution_id = :execution_id
                    ORDER BY created_at ASC
                """),
                {"execution_id": execution_id}
            )
            
            knowledge_sources = []
            for row in knowledge_sources_result.fetchall():
                knowledge_sources.append({
                    "id": row.source_id,
                    "source_type": row.source_type,
                    "title": row.title,
                    "content": row.content,
                    "question": row.question,
                    "answer": row.answer,
                    "score": row.score,
                    "adopted": row.adopted,
                    "retrieval_method": row.retrieval_method
                })
            
            # 分别加载Agent思考步骤和Team决策步骤
            thinking_steps_result = await self.session.execute(
                text("""
                    SELECT step_order, step_type, step_title, step_content, confidence, metadata
                    FROM thinking_steps
                    WHERE execution_id = :execution_id
                    ORDER BY step_order ASC
                """),
                {"execution_id": execution_id}
            )
            
            agent_thinking = []  # Agent个体思考
            team_decisions = []  # Team决策过程
            
            for row in thinking_steps_result.fetchall():
                step_data = {
                    "name": row.step_type,
                    "arguments": {
                        "title": row.step_title,
                        "thought": row.step_content,
                        "confidence": row.confidence
                    }
                }
                
                if row.step_type.startswith('team_'):
                    # Team决策步骤
                    decision_data = {
                        "type": row.step_type.replace('team_', ''),
                        "title": row.step_title,
                        "content": row.step_content,
                        "confidence": row.confidence
                    }
                    
                    # 添加元数据
                    if row.metadata:
                        try:
                            metadata = json.loads(row.metadata)
                            decision_data.update(metadata)
                        except:
                            pass
                    
                    team_decisions.append(decision_data)
                else:
                    # Agent思考步骤
                    agent_thinking.append(step_data)
            
            return {
                "memberCalls": member_calls,
                "knowledgeSources": knowledge_sources,
                "thinking": agent_thinking,  # Agent个体思考
                "teamDecisions": team_decisions  # Team决策过程
            }
            
        except Exception as e:
            logger.error(f"加载Team执行数据失败: execution_id={execution_id}, error={e}")
            return {
                "memberCalls": [],
                "knowledgeSources": [],
                "thinking": [],
                "teamDecisions": []  # 🔥 修复：确保错误情况下也返回teamDecisions字段
            }
    
    def _generate_conversation_title(self, question: str) -> str:
        """智能生成对话标题"""
        if not question or not question.strip():
            return "新对话"
        
        # 清理问题文本
        clean_question = question.strip()
        
        # 如果问题过长，截取前30个字符并添加省略号
        if len(clean_question) > 30:
            # 在30字符内找最后一个完整的词或句子结束点
            truncated = clean_question[:30]
            # 尝试在标点符号处截断
            for punct in ['。', '？', '！', '，', '、']:
                if punct in truncated:
                    punctuation_index = truncated.rfind(punct)
                    if punctuation_index > 10:  # 确保标题不会太短
                        return truncated[:punctuation_index + 1]
            
            # 如果没有找到合适的标点，在词边界截断
            if ' ' in truncated:
                space_index = truncated.rfind(' ')
                if space_index > 10:
                    return truncated[:space_index] + "..."
            
            return truncated + "..."
        
        # 移除末尾的问号，使标题更简洁
        if clean_question.endswith('？') or clean_question.endswith('?'):
            clean_question = clean_question[:-1]
            
        return clean_question
    
    async def update_conversation_title_if_needed(self, session_id: str, question: str):
        """如果对话标题为空或是默认标题，则更新标题"""
        try:
            result = await self.session.execute(
                select(Conversation).where(Conversation.session_id == session_id)
            )
            conversation = result.scalar_one_or_none()
            
            if conversation and (not conversation.title or conversation.title in ['新对话', '未命名对话']):
                new_title = self._generate_conversation_title(question)
                conversation.title = new_title
                await self.session.commit()
                logger.info(f"对话标题已更新: session_id={session_id}, title={new_title}")
                
        except Exception as e:
            logger.error(f"更新对话标题失败: {e}")
            # 不抛出异常，因为这不是关键功能
