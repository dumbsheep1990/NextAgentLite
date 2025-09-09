-- 添加智能体字段到conversation_messages表
-- 迁移版本: 20250701_add_agent_fields

-- 添加智能体ID字段
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'conversation_messages' 
        AND column_name = 'agent_id'
    ) THEN
        ALTER TABLE conversation_messages 
        ADD COLUMN agent_id VARCHAR(100) NULL;
        
        RAISE NOTICE '添加 agent_id 字段到 conversation_messages 表';
    ELSE
        RAISE NOTICE 'agent_id 字段已存在，跳过添加';
    END IF;
END $$;

-- 添加智能体名称字段
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'conversation_messages' 
        AND column_name = 'agent_name'
    ) THEN
        ALTER TABLE conversation_messages 
        ADD COLUMN agent_name VARCHAR(200) NULL;
        
        RAISE NOTICE '添加 agent_name 字段到 conversation_messages 表';
    ELSE
        RAISE NOTICE 'agent_name 字段已存在，跳过添加';
    END IF;
END $$;

-- 为现有记录设置默认智能体信息
DO $$
BEGIN
    -- 更新现有的AI消息记录，设置默认智能体信息
    UPDATE conversation_messages 
    SET 
        agent_id = 'cailiao_zhuanjia',
        agent_name = '问答专家'
    WHERE 
        message_type = 'ai' 
        AND (agent_id IS NULL OR agent_name IS NULL);
    
    RAISE NOTICE '为现有AI消息设置了默认智能体信息';
END $$;

-- 添加索引提升查询性能
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'conversation_messages' 
        AND indexname = 'idx_conversation_messages_agent_id'
    ) THEN
        CREATE INDEX idx_conversation_messages_agent_id 
        ON conversation_messages(agent_id);
        
        RAISE NOTICE '创建 agent_id 索引';
    ELSE
        RAISE NOTICE 'agent_id 索引已存在，跳过创建';
    END IF;
END $$;

-- 添加注释
COMMENT ON COLUMN conversation_messages.agent_id IS '智能体ID，用于标识回答的智能体';
COMMENT ON COLUMN conversation_messages.agent_name IS '智能体显示名称，用于前端显示';