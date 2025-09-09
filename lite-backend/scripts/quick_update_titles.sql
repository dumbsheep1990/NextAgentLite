-- 快速更新对话标题
-- 这个脚本会为所有"未命名对话"生成标题

-- 首先看看当前有多少未命名对话
SELECT 
    COUNT(*) as total_unnamed,
    (SELECT COUNT(*) FROM conversations) as total_conversations
FROM conversations 
WHERE title IS NULL OR title = '' OR title = '未命名对话' OR title = '新对话';

-- 显示一些需要更新的对话示例
SELECT 
    c.id,
    c.session_id,
    c.title as current_title,
    cm.content as first_user_message,
    c.created_at
FROM conversations c
JOIN conversation_messages cm ON c.id = cm.conversation_id
WHERE (c.title IS NULL OR c.title = '' OR c.title = '未命名对话' OR c.title = '新对话')
  AND cm.message_type = 'user'
  AND cm.id = (
    SELECT MIN(cm2.id) 
    FROM conversation_messages cm2 
    WHERE cm2.conversation_id = c.id AND cm2.message_type = 'user'
  )
ORDER BY c.created_at DESC
LIMIT 10;

-- 批量更新标题
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
WHERE title IS NULL OR title = '' OR title = '未命名对话' OR title = '新对话';

-- 显示更新后的结果
SELECT 
    COUNT(*) as updated_conversations
FROM conversations 
WHERE title IS NOT NULL AND title != '' AND title != '未命名对话' AND title != '新对话';

-- 显示一些更新后的对话
SELECT 
    session_id,
    title,
    created_at,
    (SELECT COUNT(*) FROM conversation_messages WHERE conversation_id = conversations.id) as message_count
FROM conversations 
WHERE title IS NOT NULL AND title != '' AND title != '未命名对话' AND title != '新对话'
ORDER BY created_at DESC 
LIMIT 10;