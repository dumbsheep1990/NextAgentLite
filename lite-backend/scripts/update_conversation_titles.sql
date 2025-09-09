-- 更新历史对话标题的SQL脚本
-- 为现有的空标题或"未命名对话"的对话生成标题

-- 临时函数：生成对话标题
CREATE OR REPLACE FUNCTION generate_title_from_content(content TEXT)
RETURNS TEXT AS $$
DECLARE
    clean_content TEXT;
    title TEXT;
    truncate_pos INTEGER;
BEGIN
    -- 清理内容
    clean_content := TRIM(content);
    
    -- 如果内容为空，返回默认标题
    IF clean_content IS NULL OR LENGTH(clean_content) = 0 THEN
        RETURN '新对话';
    END IF;
    
    -- 如果内容不超过30个字符，直接返回
    IF LENGTH(clean_content) <= 30 THEN
        RETURN clean_content;
    END IF;
    
    -- 截取前30个字符
    title := SUBSTRING(clean_content FROM 1 FOR 30);
    
    -- 寻找合适的截断点（向前查找标点符号）
    FOR truncate_pos IN REVERSE 30..20 LOOP
        IF SUBSTRING(title FROM truncate_pos FOR 1) ~ '[。！？，；：\s]' THEN
            title := SUBSTRING(title FROM 1 FOR truncate_pos);
            EXIT;
        END IF;
    END LOOP;
    
    -- 如果没有找到合适的截断点，添加省略号
    IF LENGTH(title) = 30 AND NOT (SUBSTRING(title FROM 30 FOR 1) ~ '[。！？，；：\s]') THEN
        title := title || '...';
    END IF;
    
    RETURN title;
END;
$$ LANGUAGE plpgsql;

-- 更新所有需要标题的对话
UPDATE conversations 
SET title = (
    SELECT generate_title_from_content(cm.content)
    FROM conversation_messages cm 
    WHERE cm.conversation_id = conversations.id 
      AND cm.message_type = 'user'
    ORDER BY cm.created_at ASC 
    LIMIT 1
)
WHERE (title IS NULL OR title = '' OR title = '未命名对话' OR title = '新对话')
  AND EXISTS (
    SELECT 1 FROM conversation_messages cm 
    WHERE cm.conversation_id = conversations.id 
      AND cm.message_type = 'user'
  );

-- 为没有用户消息的对话设置默认标题
UPDATE conversations 
SET title = '空对话'
WHERE (title IS NULL OR title = '' OR title = '未命名对话' OR title = '新对话')
  AND NOT EXISTS (
    SELECT 1 FROM conversation_messages cm 
    WHERE cm.conversation_id = conversations.id 
      AND cm.message_type = 'user'
  );

-- 删除临时函数
DROP FUNCTION generate_title_from_content(TEXT);

-- 查看更新结果
SELECT 
    session_id,
    title,
    created_at,
    (SELECT COUNT(*) FROM conversation_messages WHERE conversation_id = conversations.id) as message_count
FROM conversations 
ORDER BY created_at DESC 
LIMIT 10;