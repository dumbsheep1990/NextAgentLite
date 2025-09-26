"""
对话管理端点
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

try:
    from sqlalchemy.ext.asyncio import AsyncSession
    from sqlalchemy import select, func, desc, delete
    from sqlalchemy.orm import selectinload
except ImportError:
    AsyncSession = None

try:
    from db.database import get_db
except ImportError:
    def get_db():
        return None

from core.logger import logger

try:
    from models.conversation import Conversation, ConversationMessage, ConversationMessageReaction
except ImportError:
    Conversation = None
    ConversationMessage = None
    ConversationMessageReaction = None

router = APIRouter()


class ConversationSummary(BaseModel):
    """对话摘要数据模型"""
    id: int
    session_id: str
    title: Optional[str]
    message_count: int
    last_message: Optional[str]
    created_at: datetime
    updated_at: Optional[datetime]
    # 新增模式相关字段
    conversation_mode: Optional[str] = 'expert'  # 'expert' | 'team'
    mode_display_name: Optional[str] = '专家模式'


class ConversationListResponse(BaseModel):
    """对话列表响应模型"""
    conversations: List[ConversationSummary]
    total: int
    page: int
    size: int


@router.get("/", response_model=ConversationListResponse)
async def get_conversations(
    page: int = Query(1, ge=1, description="Page number"),
    size: int = Query(20, ge=1, le=100, description="Page size"),
    mode: Optional[str] = Query(None, description="Filter by conversation mode: 'expert' or 'team'"),
    user_id: Optional[int] = Query(None, description="Filter by user ID"),
    db: AsyncSession = Depends(get_db)
):
    """
    Get list of conversations with pagination and optional mode filtering.
    """
    try:
        # Build base query with optional filters
        base_query = select(Conversation)
        count_query = select(func.count(Conversation.id))
        
        # Apply user filter if specified
        if user_id:
            logger.info(f"Filtering conversations by user_id: {user_id}")
            base_query = base_query.where(Conversation.user_id == user_id)
            count_query = count_query.where(Conversation.user_id == user_id)
        
        # Apply mode filter if specified
        if mode:
            logger.info(f"Filtering conversations by mode: {mode}")
            if mode == 'expert':
                # Expert mode includes conversations with type 'single' or NULL (default)
                base_query = base_query.where(
                    (Conversation.conversation_type == 'single') | 
                    (Conversation.conversation_type.is_(None))
                )
                count_query = count_query.where(
                    (Conversation.conversation_type == 'single') | 
                    (Conversation.conversation_type.is_(None))
                )
                logger.info("Applied expert mode filter: conversation_type == 'single' OR conversation_type IS NULL")
            elif mode == 'team':
                # Team mode includes conversations with type 'team'
                base_query = base_query.where(Conversation.conversation_type == 'team')
                count_query = count_query.where(Conversation.conversation_type == 'team')
                logger.info("Applied team mode filter: conversation_type == 'team'")
        
        # Get total count with filter
        count_result = await db.execute(count_query)
        total = count_result.scalar()
        logger.info(f"Filtered conversation count for mode '{mode}': {total}")
        
        # Get conversations with pagination and filter
        offset = (page - 1) * size
        query = (
            base_query
            .order_by(desc(Conversation.updated_at))
            .offset(offset)
            .limit(size)
        )
        
        result = await db.execute(query)
        conversations = result.scalars().all()
        
        # Get message counts and last messages for each conversation
        conversation_summaries = []
        for conv in conversations:
            # Get message count
            msg_count_result = await db.execute(
                select(func.count(ConversationMessage.id))
                .where(ConversationMessage.conversation_id == conv.id)
            )
            message_count = msg_count_result.scalar()
            
            # Get last message
            last_msg_result = await db.execute(
                select(ConversationMessage.content)
                .where(ConversationMessage.conversation_id == conv.id)
                .order_by(desc(ConversationMessage.created_at))
                .limit(1)
            )
            last_message = last_msg_result.scalar()
            
            # 确定对话模式
            conversation_type = conv.conversation_type or 'single'
            conversation_mode = 'team' if conversation_type == 'team' else 'expert'
            mode_display_name = 'Team模式' if conversation_mode == 'team' else '专家模式'
            
            conversation_summaries.append(ConversationSummary(
                id=conv.id,
                session_id=conv.session_id,
                title=conv.title,
                message_count=message_count,
                last_message=last_message[:100] + "..." if last_message and len(last_message) > 100 else last_message,
                created_at=conv.created_at,
                updated_at=conv.updated_at,
                conversation_mode=conversation_mode,
                mode_display_name=mode_display_name
            ))
        
        return ConversationListResponse(
            conversations=conversation_summaries,
            total=total,
            page=page,
            size=size
        )
        
    except Exception as e:
        logger.error(f"Error getting conversations: {e}")
        raise HTTPException(status_code=500, detail=f"Error getting conversations: {str(e)}")


@router.delete("/{session_id}")
async def delete_conversation(
    session_id: str,
    db: AsyncSession = Depends(get_db)
):
    """
    Delete a conversation by session ID.
    增强版本支持删除失败的对话卡片（包括异常状态的对话）
    """
    try:
        # 查找对话及其消息信息
        result = await db.execute(
            select(Conversation).where(Conversation.session_id == session_id)
        )
        conversation = result.scalar_one_or_none()
        
        if not conversation:
            # 尝试查找是否存在孤立的消息（没有对话记录但有消息）
            orphan_messages_result = await db.execute(
                select(ConversationMessage).where(
                    ConversationMessage.conversation_id.in_(
                        select(Conversation.id).where(Conversation.session_id == session_id)
                    )
                )
            )
            orphan_messages = orphan_messages_result.scalars().all()
            
            if orphan_messages:
                logger.warning(f"找到孤立消息但无对话记录: {session_id}, 消息数量: {len(orphan_messages)}")
                # 删除孤立的消息
                for message in orphan_messages:
                    await db.delete(message)
                await db.commit()
                logger.info(f"清理了 {len(orphan_messages)} 条孤立消息: {session_id}")
                return {
                    "message": "Cleaned up orphaned messages successfully", 
                    "deleted_messages": len(orphan_messages),
                    "conversation_status": "orphaned"
                }
            
            raise HTTPException(status_code=404, detail="Conversation not found")
        
        # 检查对话状态和消息情况
        messages_result = await db.execute(
            select(ConversationMessage).where(ConversationMessage.conversation_id == conversation.id)
        )
        messages = messages_result.scalars().all()
        message_count = len(messages)
        
        # 检查是否为失败的对话（有对话记录但没有有效消息或消息异常）
        failed_conversation_indicators = []
        
        if message_count == 0:
            failed_conversation_indicators.append("无消息记录")
        else:
            # 检查消息完整性
            for msg in messages:
                if not msg.content or len(msg.content.strip()) < 5:
                    failed_conversation_indicators.append("包含空或无效内容的消息")
                    break
                
                # 检查AI消息是否有异常标记
                if msg.message_type == "ai" and msg.content:
                    if any(keyword in msg.content for keyword in [
                        "工具不可用", "系统错误", "处理失败", "抱歉，出现了错误", 
                        "500", "Internal Server Error", "数据库错误"
                    ]):
                        failed_conversation_indicators.append("包含错误消息")
                        break
        
        # 记录对话状态
        conversation_status = "normal"
        if failed_conversation_indicators:
            conversation_status = "failed"
            logger.info(f"识别到失败的对话: {session_id}, 问题: {', '.join(failed_conversation_indicators)}")
        
        # 删除对话（消息会通过级联删除）
        await db.delete(conversation)
        await db.commit()
        
        logger.info(f"删除对话: {session_id}, 状态: {conversation_status}, 消息数量: {message_count}")
        
        return {
            "message": "Conversation deleted successfully",
            "conversation_status": conversation_status,
            "deleted_messages": message_count,
            "failure_indicators": failed_conversation_indicators if failed_conversation_indicators else None
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"删除对话时出错 {session_id}: {e}")
        
        # 尝试强制删除（用于处理严重损坏的对话数据）
        try:
            logger.warning(f"尝试强制删除对话: {session_id}")
            
            # 先删除相关消息
            await db.execute(
                delete(ConversationMessage).where(
                    ConversationMessage.conversation_id.in_(
                        select(Conversation.id).where(Conversation.session_id == session_id)
                    )
                )
            )
            
            # 再删除对话记录
            await db.execute(
                delete(Conversation).where(Conversation.session_id == session_id)
            )
            
            await db.commit()
            
            logger.info(f"强制删除成功: {session_id}")
            return {
                "message": "Conversation force deleted successfully",
                "conversation_status": "force_deleted",
                "note": "数据异常，已强制删除"
            }
            
        except Exception as force_delete_error:
            logger.error(f"强制删除也失败: {session_id}: {force_delete_error}")
            raise HTTPException(
                status_code=500, 
                detail=f"无法删除对话，请联系管理员: {str(e)}"
            )


@router.delete("/")
async def clear_all_conversations(
    db: AsyncSession = Depends(get_db)
):
    """
    Clear all conversations and their messages.
    """
    try:
        # Get total count before deletion for logging
        count_result = await db.execute(select(func.count(Conversation.id)))
        total_conversations = count_result.scalar()
        
        msg_count_result = await db.execute(select(func.count(ConversationMessage.id)))
        total_messages = msg_count_result.scalar()
        
        # Delete all conversations (messages will be deleted by cascade)
        await db.execute(
            select(Conversation).where(True)  # Select all conversations
        )
        result = await db.execute(select(Conversation))
        conversations = result.scalars().all()
        
        # Delete all conversations
        for conversation in conversations:
            await db.delete(conversation)
        
        await db.commit()
        
        logger.info(f"Cleared all conversation history - deleted {total_conversations} conversations and {total_messages} messages")
        return {
            "message": "All conversation history cleared successfully",
            "deleted_conversations": total_conversations,
            "deleted_messages": total_messages
        }
        
    except Exception as e:
        logger.error(f"Error clearing all conversations: {e}")
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Error clearing conversation history: {str(e)}")


@router.delete("/failed/cleanup")
async def cleanup_failed_conversations(
    db: AsyncSession = Depends(get_db)
):
    """
    批量清理失败的对话卡片
    识别并删除异常状态的对话（无消息、错误消息、孤立数据等）
    """
    try:
        cleanup_stats = {
            "empty_conversations": 0,
            "error_conversations": 0,
            "orphaned_messages": 0,
            "total_deleted": 0
        }
        
        # 1. 查找没有消息的对话
        empty_conversations_result = await db.execute(
            select(Conversation).where(
                ~Conversation.id.in_(
                    select(ConversationMessage.conversation_id).distinct()
                )
            )
        )
        empty_conversations = empty_conversations_result.scalars().all()
        
        for conv in empty_conversations:
            await db.delete(conv)
            cleanup_stats["empty_conversations"] += 1
        
        logger.info(f"发现 {len(empty_conversations)} 个无消息的对话")
        
        # 2. 查找包含错误消息的对话
        error_keywords = [
            "工具不可用", "系统错误", "处理失败", "抱歉，出现了错误",
            "500", "Internal Server Error", "数据库错误", "graph_sources.*does not exist"
        ]
        
        conversations_with_errors = []
        all_conversations_result = await db.execute(
            select(Conversation).options(selectinload(Conversation.messages))
        )
        all_conversations = all_conversations_result.scalars().all()
        
        for conv in all_conversations:
            if conv.messages:  # 跳过已经在步骤1处理的空对话
                has_error = False
                for msg in conv.messages:
                    if msg.message_type == "ai" and msg.content:
                        for keyword in error_keywords:
                            if keyword in msg.content:
                                has_error = True
                                break
                        if has_error:
                            break
                
                if has_error:
                    conversations_with_errors.append(conv)
        
        for conv in conversations_with_errors:
            await db.delete(conv)
            cleanup_stats["error_conversations"] += 1
        
        logger.info(f"发现 {len(conversations_with_errors)} 个包含错误消息的对话")
        
        # 3. 查找孤立的消息（对话ID指向不存在的对话）
        orphaned_messages_result = await db.execute(
            select(ConversationMessage).where(
                ~ConversationMessage.conversation_id.in_(
                    select(Conversation.id)
                )
            )
        )
        orphaned_messages = orphaned_messages_result.scalars().all()
        
        for msg in orphaned_messages:
            await db.delete(msg)
            cleanup_stats["orphaned_messages"] += 1
        
        logger.info(f"发现 {len(orphaned_messages)} 条孤立的消息")
        
        # 提交所有删除操作
        await db.commit()
        
        cleanup_stats["total_deleted"] = (
            cleanup_stats["empty_conversations"] + 
            cleanup_stats["error_conversations"] + 
            cleanup_stats["orphaned_messages"]
        )
        
        logger.info(f"失败对话清理完成: {cleanup_stats}")
        
        return {
            "message": "Failed conversations cleanup completed",
            "cleanup_statistics": cleanup_stats
        }
        
    except Exception as e:
        logger.error(f"清理失败对话时出错: {e}")
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Error cleaning up failed conversations: {str(e)}")


@router.put("/{session_id}/title")
async def update_conversation_title(
    session_id: str,
    title_data: dict,
    db: AsyncSession = Depends(get_db)
):
    """
    Update conversation title.
    """
    try:
        # Find conversation
        result = await db.execute(
            select(Conversation).where(Conversation.session_id == session_id)
        )
        conversation = result.scalar_one_or_none()
        
        if not conversation:
            raise HTTPException(status_code=404, detail="Conversation not found")
        
        # Update title
        conversation.title = title_data.get("title", "")
        await db.commit()
        
        return {"message": "Title updated successfully", "title": conversation.title}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating conversation title for {session_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Error updating title: {str(e)}")


@router.get("/stats/overview")
async def get_conversation_stats(db: AsyncSession = Depends(get_db)):
    """
    Get conversation statistics.
    """
    try:
        # Total conversations
        total_conv_result = await db.execute(select(func.count(Conversation.id)))
        total_conversations = total_conv_result.scalar()
        
        # Total messages
        total_msg_result = await db.execute(select(func.count(ConversationMessage.id)))
        total_messages = total_msg_result.scalar()
        
        # Messages by type
        msg_type_result = await db.execute(
            select(ConversationMessage.message_type, func.count(ConversationMessage.id))
            .group_by(ConversationMessage.message_type)
        )
        message_type_stats = {row[0]: row[1] for row in msg_type_result.fetchall()}
        
        # Average confidence score for AI messages
        avg_confidence_result = await db.execute(
            select(func.avg(ConversationMessage.confidence))
            .where(ConversationMessage.message_type == "ai")
            .where(ConversationMessage.confidence.isnot(None))
        )
        avg_confidence = avg_confidence_result.scalar() or 0.0
        
        # Average processing time
        avg_time_result = await db.execute(
            select(func.avg(ConversationMessage.processing_time))
            .where(ConversationMessage.processing_time.isnot(None))
        )
        avg_processing_time = avg_time_result.scalar() or 0.0
        
        return {
            "total_conversations": total_conversations,
            "total_messages": total_messages,
            "message_type_distribution": message_type_stats,
            "average_confidence": round(avg_confidence, 2),
            "average_processing_time": round(avg_processing_time, 2)
        }
        
    except Exception as e:
        logger.error(f"Error getting conversation stats: {e}")
        raise HTTPException(status_code=500, detail=f"Error getting stats: {str(e)}")


class TeamConversationSaveRequest(BaseModel):
    """Team对话保存请求模型"""
    session_id: str
    question: str
    answer: str
    team_name: str
    team_mode: str = 'coordinate'
    team_info: Optional[dict] = None
    model_used: str = 'team'
    processing_time: Optional[float] = 0.0
    confidence_score: Optional[float] = None
    sources: Optional[list] = None
    knowledge_sources: Optional[list] = None
    thinking: Optional[list] = None
    metadata: Optional[dict] = None
    user_id: Optional[int] = None  # 新增用户ID字段


@router.post("/team")
async def save_team_conversation(
    request: TeamConversationSaveRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Save team conversation from frontend (after stream completion).
    """
    try:
        logger.info(f"💾 [CONVERSATIONS] 前端请求保存Team对话: {request.session_id}")
        logger.info(f"💾 [CONVERSATIONS] 请求数据: question={request.question[:50]}..., team_name={request.team_name}")
        
        # 检查db session是否有效
        if db is None:
            raise Exception("数据库会话为空")
            
        # 使用ConversationRepository保存对话
        from db.repositories.conversation_repository import ConversationRepository
        
        logger.info(f"💾 [CONVERSATIONS] 创建ConversationRepository...")
        conversation_repo = ConversationRepository(db)
        
        logger.info(f"💾 [CONVERSATIONS] 开始调用save_team_conversation...")
        await conversation_repo.save_team_conversation(
            session_id=request.session_id,
            question=request.question,
            answer=request.answer,
            team_name=request.team_name,
            team_mode=request.team_mode,
            team_info=request.team_info or {},  # 提供默认空字典
            model_used=request.model_used,
            processing_time=request.processing_time,
            confidence_score=request.confidence_score,
            sources=request.sources or [],      # 提供默认空列表
            knowledge_sources=request.knowledge_sources or [],  # 提供默认空列表
            thinking=request.thinking or [],    # 提供默认空列表
            metadata=request.metadata or {},    # 提供默认空字典
            user_id=request.user_id             # 传递用户ID
        )
        
        logger.info(f"✅ [CONVERSATIONS] Team对话保存成功: {request.session_id}")
        return {"message": "Team对话保存成功", "session_id": request.session_id}
        
    except Exception as e:
        import traceback
        logger.error(f"❌ [CONVERSATIONS] Team对话保存失败: {e}")
        logger.error(f"❌ [CONVERSATIONS] 错误堆栈: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Team对话保存失败: {str(e)}") 
class ReactionRequest(BaseModel):
    """对话消息反馈请求"""
    session_id: str
    content: str
    mark: str  # 'like' | 'dislike'
    message_id: Optional[int] = None
    conversation_id: Optional[int] = None
    message_type: Optional[str] = None  # 'user' | 'ai'
    user_id: Optional[int] = None


@router.post("/reactions")
async def save_reaction(req: ReactionRequest, db: AsyncSession = Depends(get_db)):
    """保存对话消息反馈（点赞/点踩）。"""
    try:
        mk = (req.mark or '').lower()
        if mk not in ('like', 'dislike'):
            raise HTTPException(status_code=400, detail="invalid mark; expected 'like' or 'dislike'")
        if not req.session_id or not req.content:
            raise HTTPException(status_code=400, detail="session_id and content are required")

        rec = ConversationMessageReaction(
            session_id=req.session_id,
            conversation_id=req.conversation_id,
            message_id=req.message_id,
            message_type=req.message_type,
            content=req.content,
            mark=mk,
        )
        db.add(rec)
        await db.commit()
        await db.refresh(rec)
        return {"id": rec.id, "created_at": rec.created_at}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"保存消息反馈失败: {e}")
        raise HTTPException(status_code=500, detail="failed to save reaction")
