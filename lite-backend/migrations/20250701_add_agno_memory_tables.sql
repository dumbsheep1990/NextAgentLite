-- 添加Agno框架的memory和storage表
-- 用于支持多轮对话和Agent状态持久化

-- 创建agent_memory表 - 用于存储Agent的对话记忆
CREATE TABLE IF NOT EXISTS agent_memory (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(255) NOT NULL,
    user_id VARCHAR(255),
    memory JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 为session_id创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_agent_memory_session_id ON agent_memory(session_id);
CREATE INDEX IF NOT EXISTS idx_agent_memory_user_id ON agent_memory(user_id);
CREATE INDEX IF NOT EXISTS idx_agent_memory_created_at ON agent_memory(created_at);

-- 创建agent_storage表 - 用于存储Agent的状态信息
CREATE TABLE IF NOT EXISTS agent_storage (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(255) NOT NULL,
    user_id VARCHAR(255),
    agent_data JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 为session_id创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_agent_storage_session_id ON agent_storage(session_id);
CREATE INDEX IF NOT EXISTS idx_agent_storage_user_id ON agent_storage(user_id);
CREATE INDEX IF NOT EXISTS idx_agent_storage_created_at ON agent_storage(created_at);

-- 添加更新时间戳的触发器
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 为agent_memory表创建更新触发器
DROP TRIGGER IF EXISTS update_agent_memory_updated_at ON agent_memory;
CREATE TRIGGER update_agent_memory_updated_at
    BEFORE UPDATE ON agent_memory
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 为agent_storage表创建更新触发器
DROP TRIGGER IF EXISTS update_agent_storage_updated_at ON agent_storage;
CREATE TRIGGER update_agent_storage_updated_at
    BEFORE UPDATE ON agent_storage
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 添加注释
COMMENT ON TABLE agent_memory IS 'Agno框架的Agent记忆表，用于存储多轮对话上下文';
COMMENT ON TABLE agent_storage IS 'Agno框架的Agent状态存储表，用于持久化Agent状态';

COMMENT ON COLUMN agent_memory.session_id IS '会话ID，用于隔离不同对话的记忆';
COMMENT ON COLUMN agent_memory.memory IS '存储的记忆内容，JSON格式';
COMMENT ON COLUMN agent_storage.agent_data IS '存储的Agent状态数据，JSON格式';