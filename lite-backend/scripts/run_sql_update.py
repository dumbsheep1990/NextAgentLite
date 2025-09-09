#!/usr/bin/env python3
"""
使用psycopg2直接执行SQL更新对话标题
"""

import os
import sys
from pathlib import Path

try:
    import psycopg2
    from psycopg2.extras import RealDictCursor
except ImportError:
    print("❌ 需要安装psycopg2: pip install psycopg2-binary")
    sys.exit(1)

# 添加项目根目录到Python路径
sys.path.append(str(Path(__file__).parent.parent))

from core.logger import logger


def get_db_connection():
    """获取数据库连接"""
    # 从环境变量读取数据库配置
    config = {
        'host': os.getenv('POSTGRESQL_HOST', '8.153.90.125'),
        'port': int(os.getenv('POSTGRESQL_PORT', 5432)),
        'database': os.getenv('POSTGRESQL_DATABASE', 'mat_demo'),
        'user': os.getenv('POSTGRESQL_USERNAME', 'mat_demo'),
        'password': os.getenv('POSTGRESQL_PASSWORD', '')
    }
    
    if not config['password']:
        print("❌ 请设置POSTGRESQL_PASSWORD环境变量")
        sys.exit(1)
    
    logger.info(f"连接数据库: {config['host']}:{config['port']}/{config['database']}")
    
    try:
        conn = psycopg2.connect(**config)
        return conn
    except Exception as e:
        logger.error(f"数据库连接失败: {e}")
        raise


def update_conversation_titles():
    """更新对话标题"""
    conn = get_db_connection()
    
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            # 查看当前状况
            cur.execute("""
                SELECT 
                    COUNT(*) as total_unnamed,
                    (SELECT COUNT(*) FROM conversations) as total_conversations
                FROM conversations 
                WHERE title IS NULL OR title = '' OR title = '未命名对话' OR title = '新对话' OR title = '点击开始对话';
            """)
            
            stats = cur.fetchone()
            logger.info(f"找到 {stats['total_unnamed']} 个需要更新的对话，总对话数: {stats['total_conversations']}")
            
            if stats['total_unnamed'] == 0:
                logger.info("没有需要更新的对话")
                return
            
            # 显示一些待更新的对话
            cur.execute("""
                SELECT 
                    c.id,
                    c.session_id,
                    c.title as current_title,
                    cm.content as first_user_message,
                    c.created_at
                FROM conversations c
                JOIN conversation_messages cm ON c.id = cm.conversation_id
                WHERE (c.title IS NULL OR c.title = '' OR c.title = '未命名对话' OR c.title = '新对话' OR c.title = '点击开始对话')
                  AND cm.message_type = 'user'
                  AND cm.id = (
                    SELECT MIN(cm2.id) 
                    FROM conversation_messages cm2 
                    WHERE cm2.conversation_id = c.id AND cm2.message_type = 'user'
                  )
                ORDER BY c.created_at DESC
                LIMIT 5;
            """)
            
            sample_conversations = cur.fetchall()
            logger.info("待更新的对话示例:")
            for conv in sample_conversations:
                logger.info(f"  {conv['session_id'][:20]}... | {conv['current_title']} | {conv['first_user_message'][:30]}...")
            
            # 执行批量更新
            update_sql = """
                UPDATE conversations 
                SET title = CASE 
                    WHEN (
                        SELECT cm.content 
                        FROM conversation_messages cm 
                        WHERE cm.conversation_id = conversations.id 
                          AND cm.message_type = 'user'
                        ORDER BY cm.created_at ASC 
                        LIMIT 1
                    ) IS NULL THEN '空对话'
                    WHEN LENGTH(TRIM(
                        SELECT cm.content 
                        FROM conversation_messages cm 
                        WHERE cm.conversation_id = conversations.id 
                          AND cm.message_type = 'user'
                        ORDER BY cm.created_at ASC 
                        LIMIT 1
                    )) <= 30 THEN TRIM(
                        SELECT cm.content 
                        FROM conversation_messages cm 
                        WHERE cm.conversation_id = conversations.id 
                          AND cm.message_type = 'user'
                        ORDER BY cm.created_at ASC 
                        LIMIT 1
                    )
                    ELSE LEFT(TRIM(
                        SELECT cm.content 
                        FROM conversation_messages cm 
                        WHERE cm.conversation_id = conversations.id 
                          AND cm.message_type = 'user'
                        ORDER BY cm.created_at ASC 
                        LIMIT 1
                    ), 30) || '...'
                END
                WHERE title IS NULL OR title = '' OR title = '未命名对话' OR title = '新对话' OR title = '点击开始对话';
            """
            
            cur.execute(update_sql)
            updated_rows = cur.rowcount
            conn.commit()
            
            logger.info(f"✅ 成功更新 {updated_rows} 个对话的标题")
            
            # 显示更新后的结果
            cur.execute("""
                SELECT 
                    session_id,
                    title,
                    created_at,
                    (SELECT COUNT(*) FROM conversation_messages WHERE conversation_id = conversations.id) as message_count
                FROM conversations 
                WHERE title IS NOT NULL AND title != '' AND title != '未命名对话' AND title != '新对话' AND title != '点击开始对话'
                ORDER BY created_at DESC 
                LIMIT 10;
            """)
            
            updated_conversations = cur.fetchall()
            logger.info("更新后的对话示例:")
            for conv in updated_conversations:
                logger.info(f"  {conv['session_id'][:20]}... | {conv['title']} | {conv['message_count']}条消息")
                
    except Exception as e:
        logger.error(f"更新失败: {e}")
        conn.rollback()
        raise
    finally:
        conn.close()


def main():
    """主函数"""
    logger.info("🚀 开始更新历史对话标题...")
    
    try:
        update_conversation_titles()
        logger.info("✅ 对话标题更新完成!")
    except Exception as e:
        logger.error(f"❌ 更新失败: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()