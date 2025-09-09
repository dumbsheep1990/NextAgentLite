-- 添加thinking字段到conversation_messages表
-- 用于存储AI思考过程数据

ALTER TABLE conversation_messages 
ADD COLUMN thinking JSON;

-- 添加索引提升查询性能
CREATE INDEX IF NOT EXISTS idx_conversation_messages_thinking 
ON conversation_messages USING GIN (thinking);

-- 添加注释
COMMENT ON COLUMN conversation_messages.thinking IS 'AI思考过程数据，JSON格式存储';