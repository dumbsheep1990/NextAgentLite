#!/usr/bin/env python3
"""
更新历史对话标题的脚本
"""

import asyncio
import sys
import os
from pathlib import Path

# 添加项目根目录到Python路径
sys.path.append(str(Path(__file__).parent.parent))

from sqlalchemy import text
from core.logger import logger
from db.database import get_session
from db.repositories.conversation_repository import ConversationRepository


def update_conversation_titles():
    """更新所有历史对话的标题"""
    try:
        # 获取数据库会话
        session = get_session()
        # 创建ConversationRepository实例 
        conversation_repo = ConversationRepository(session)
        
        # 获取所有需要更新标题的对话
        result = session.execute(text("""
                SELECT DISTINCT c.session_id, c.title, cm.content as first_user_message
                FROM conversations c
                JOIN conversation_messages cm ON c.id = cm.conversation_id
                WHERE (c.title IS NULL OR c.title = '' OR c.title = '未命名对话' OR c.title = '新对话')
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
                logger.info("没有找到需要更新标题的对话")
                return
            
            logger.info(f"找到 {len(conversations_to_update)} 个需要更新标题的对话")
            
            # 批量更新对话标题
            updated_count = 0
            for conv in conversations_to_update:
                session_id = conv.session_id
                current_title = conv.title
                first_message = conv.first_user_message
                
                # 生成新标题
                new_title = conversation_repo._generate_conversation_title(first_message)
                
                # 更新标题
                try:
                    success = await conversation_repo.update_conversation_title(session_id, new_title)
                    if success:
                        updated_count += 1
                        logger.info(f"更新成功: {session_id[:20]}... | {current_title} -> {new_title}")
                    else:
                        logger.warning(f"更新失败: {session_id} - 对话不存在")
                except Exception as e:
                    logger.error(f"更新标题失败: {session_id} - {e}")
            
            logger.info(f"批量更新完成: 成功更新 {updated_count}/{len(conversations_to_update)} 个对话标题")
            
            # 显示更新后的结果
            result = await session.execute(text("""
                SELECT session_id, title, created_at,
                       (SELECT COUNT(*) FROM conversation_messages WHERE conversation_id = conversations.id) as message_count
                FROM conversations 
                WHERE title IS NOT NULL AND title != ''
                ORDER BY created_at DESC 
                LIMIT 10;
            """))
            
            recent_conversations = result.fetchall()
            logger.info("最近更新的对话:")
            for conv in recent_conversations:
                logger.info(f"  {conv.session_id[:20]}... | {conv.title} | {conv.message_count}条消息")
                
    except Exception as e:
        logger.error(f"更新对话标题失败: {e}")
        raise


async def verify_title_generation():
    """验证标题生成功能"""
    try:
        async_session = get_async_session()
        async with async_session() as session:
            conversation_repo = ConversationRepository(session)
            
            # 测试标题生成
            test_cases = [
                "什么是地聚物材料?",
                "请介绍一下地聚物材料的力学性能和应用领域，包括在建筑工程中的具体使用情况",
                "hi",
                "地聚物材料在高温环境下的性能如何？",
                "How to prepare geopolymer materials?"
            ]
            
            logger.info("测试标题生成功能:")
            for question in test_cases:
                title = conversation_repo._generate_conversation_title(question)
                logger.info(f"  问题: {question}")
                logger.info(f"  标题: {title}")
                logger.info("")
                
    except Exception as e:
        logger.error(f"验证标题生成功能失败: {e}")


async def main():
    """主函数"""
    logger.info("开始更新历史对话标题...")
    
    # 首先验证标题生成功能
    await verify_title_generation()
    
    # 然后更新历史对话标题
    await update_conversation_titles()
    
    logger.info("对话标题更新完成!")


if __name__ == "__main__":
    asyncio.run(main())