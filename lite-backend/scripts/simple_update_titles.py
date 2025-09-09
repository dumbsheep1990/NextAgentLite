#!/usr/bin/env python3
"""
简单的对话标题更新脚本
"""

import sys
from pathlib import Path

# 添加项目根目录到Python路径
sys.path.append(str(Path(__file__).parent.parent))

from sqlalchemy import text
from core.logger import logger
from db.database import get_session
from db.repositories.conversation_repository import ConversationRepository


def generate_title_from_content(content):
    """生成对话标题"""
    if not content or not content.strip():
        return '新对话'
    
    clean_content = content.strip()
    
    if len(clean_content) <= 30:
        return clean_content
    
    # 截取前30个字符
    title = clean_content[:30]
    
    # 寻找合适的截断点
    punctuation = '。！？，；： '
    for i in range(len(title) - 1, max(15, len(title) - 10), -1):
        if title[i] in punctuation:
            title = title[:i + 1]
            break
    else:
        if not title[-1] in punctuation:
            title = title + '...'
    
    return title


def main():
    """主函数"""
    try:
        logger.info("开始更新历史对话标题...")
        
        # 获取数据库会话
        session = get_session()
        
        # 获取所有需要更新标题的对话
        result = session.execute(text("""
            SELECT DISTINCT c.id, c.session_id, c.title, cm.content as first_user_message
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
            conv_id = conv.id
            session_id = conv.session_id
            current_title = conv.title
            first_message = conv.first_user_message
            
            # 生成新标题
            new_title = generate_title_from_content(first_message)
            
            # 更新标题
            try:
                session.execute(text("""
                    UPDATE conversations 
                    SET title = :title 
                    WHERE id = :conv_id
                """), {"title": new_title, "conv_id": conv_id})
                
                session.commit()
                updated_count += 1
                logger.info(f"更新成功: {session_id[:20]}... | {current_title} -> {new_title}")
                
            except Exception as e:
                logger.error(f"更新标题失败: {session_id} - {e}")
                session.rollback()
        
        logger.info(f"批量更新完成: 成功更新 {updated_count}/{len(conversations_to_update)} 个对话标题")
        
        # 显示更新后的结果
        result = session.execute(text("""
            SELECT session_id, title, created_at,
                   (SELECT COUNT(*) FROM conversation_messages WHERE conversation_id = conversations.id) as message_count
            FROM conversations 
            WHERE title IS NOT NULL AND title != '' AND title != '未命名对话'
            ORDER BY created_at DESC 
            LIMIT 10;
        """))
        
        recent_conversations = result.fetchall()
        logger.info("最近更新的对话:")
        for conv in recent_conversations:
            logger.info(f"  {conv.session_id[:20]}... | {conv.title} | {conv.message_count}条消息")
        
        session.close()
        
    except Exception as e:
        logger.error(f"更新对话标题失败: {e}")
        raise


if __name__ == "__main__":
    main()