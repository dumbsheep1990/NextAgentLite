-- Team模式对话支持数据库迁移
-- 创建时间: 2025-08-05
-- 目的: 支持Team模式的对话保存、Agent调用记录和溯源数据

-- Team会话表 - 扩展原有conversations表
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS conversation_type VARCHAR(10) DEFAULT 'single' CHECK (conversation_type IN ('single', 'team'));
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS team_name VARCHAR(100);
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS team_mode VARCHAR(20) CHECK (team_mode IN ('coordinate', 'collaborate', 'route'));

-- 扩展conversation_messages表以支持Team消息
ALTER TABLE conversation_messages ADD COLUMN IF NOT EXISTS agent_id VARCHAR(100);
ALTER TABLE conversation_messages ADD COLUMN IF NOT EXISTS agent_name VARCHAR(100);
ALTER TABLE conversation_messages ADD COLUMN IF NOT EXISTS is_team_message BOOLEAN DEFAULT FALSE;
ALTER TABLE conversation_messages ADD COLUMN IF NOT EXISTS team_info JSONB;
ALTER TABLE conversation_messages ADD COLUMN IF NOT EXISTS knowledge_sources JSONB;
ALTER TABLE conversation_messages ADD COLUMN IF NOT EXISTS thinking_process JSONB;

-- Team执行记录表
CREATE TABLE IF NOT EXISTS team_executions (
    id SERIAL PRIMARY KEY,
    conversation_id INTEGER REFERENCES conversations(id) ON DELETE CASCADE,
    message_id INTEGER REFERENCES conversation_messages(id) ON DELETE CASCADE,
    execution_id VARCHAR(100) UNIQUE NOT NULL,
    team_name VARCHAR(100) NOT NULL,
    team_mode VARCHAR(20) NOT NULL CHECK (team_mode IN ('coordinate', 'collaborate', 'route')),
    query TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'error')),
    start_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    end_time TIMESTAMP WITH TIME ZONE,
    total_duration_ms INTEGER,
    error_message TEXT,
    structured_output JSONB,
    coordination_info JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Team成员调用记录表
CREATE TABLE IF NOT EXISTS team_member_calls (
    id SERIAL PRIMARY KEY,
    execution_id VARCHAR(100) REFERENCES team_executions(execution_id) ON DELETE CASCADE,
    member_id VARCHAR(100) NOT NULL,
    member_name VARCHAR(100) NOT NULL,
    role VARCHAR(100) NOT NULL,
    action TEXT NOT NULL,
    call_type VARCHAR(50) DEFAULT 'execute',
    input_data JSONB,
    output_data JSONB,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'error')),
    start_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    end_time TIMESTAMP WITH TIME ZONE,
    duration_ms INTEGER,
    confidence REAL,
    error_message TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 知识源记录表 - 支持详细的溯源信息
CREATE TABLE IF NOT EXISTS knowledge_sources (
    id SERIAL PRIMARY KEY,
    message_id INTEGER REFERENCES conversation_messages(id) ON DELETE CASCADE,
    execution_id VARCHAR(100),
    source_type VARCHAR(50) NOT NULL, -- 'document', 'qa_dataset', 'graph'
    source_id VARCHAR(100),
    title TEXT,
    content TEXT,
    question TEXT, -- QA数据集的问题
    answer TEXT,   -- QA数据集的答案
    authors TEXT,
    publication_date TEXT,
    journal TEXT,
    url TEXT,
    score REAL,
    adopted BOOLEAN DEFAULT FALSE,
    rank_position INTEGER,
    retrieval_method VARCHAR(50), -- 'vector', 'keyword', 'hybrid'
    language VARCHAR(10),
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 思考过程记录表 - 保存Agent的推理过程
CREATE TABLE IF NOT EXISTS thinking_steps (
    id SERIAL PRIMARY KEY,
    message_id INTEGER REFERENCES conversation_messages(id) ON DELETE CASCADE,
    execution_id VARCHAR(100),
    step_order INTEGER NOT NULL,
    step_type VARCHAR(50), -- 'search', 'analysis', 'reasoning', 'synthesis'
    step_title TEXT,
    step_content TEXT,
    search_results JSONB,
    analysis_data JSONB,
    confidence REAL,
    duration_ms INTEGER,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_conversations_type ON conversations(conversation_type);
CREATE INDEX IF NOT EXISTS idx_conversations_team_name ON conversations(team_name);
CREATE INDEX IF NOT EXISTS idx_conversation_messages_team ON conversation_messages(is_team_message);
CREATE INDEX IF NOT EXISTS idx_team_executions_conversation ON team_executions(conversation_id);
CREATE INDEX IF NOT EXISTS idx_team_member_calls_execution ON team_member_calls(execution_id);
CREATE INDEX IF NOT EXISTS idx_team_member_calls_member ON team_member_calls(member_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_sources_message ON knowledge_sources(message_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_sources_execution ON knowledge_sources(execution_id);
CREATE INDEX IF NOT EXISTS idx_thinking_steps_message ON thinking_steps(message_id);
CREATE INDEX IF NOT EXISTS idx_thinking_steps_execution ON thinking_steps(execution_id);

-- 创建更新时间戳触发器
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_team_executions_updated_at BEFORE UPDATE ON team_executions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 创建视图以便于查询Team对话的完整信息
CREATE OR REPLACE VIEW team_conversation_details AS
SELECT 
    c.id as conversation_id,
    c.session_id,
    c.title,
    c.conversation_type,
    c.team_name,
    c.team_mode,
    c.created_at as conversation_created_at,
    cm.id as message_id,
    cm.message_type,
    cm.content,
    cm.agent_id,
    cm.agent_name,
    cm.is_team_message,
    cm.team_info,
    cm.knowledge_sources,
    cm.thinking_process,
    cm.sources,
    cm.processing_time,
    cm.model_used,
    cm.created_at as message_created_at,
    te.execution_id,
    te.status as execution_status,
    te.total_duration_ms,
    te.structured_output,
    te.coordination_info
FROM conversations c
LEFT JOIN conversation_messages cm ON c.id = cm.conversation_id
LEFT JOIN team_executions te ON cm.id = te.message_id
WHERE c.conversation_type = 'team'
ORDER BY c.created_at DESC, cm.created_at ASC;

-- 创建Team成员性能统计视图
CREATE OR REPLACE VIEW team_member_performance_stats AS
SELECT 
    member_id,
    member_name,
    role,
    COUNT(*) as total_calls,
    COUNT(CASE WHEN status = 'completed' THEN 1 END) as successful_calls,
    COUNT(CASE WHEN status = 'error' THEN 1 END) as failed_calls,
    AVG(duration_ms) as avg_duration_ms,
    SUM(duration_ms) as total_duration_ms,
    MAX(created_at) as last_call_time
FROM team_member_calls
GROUP BY member_id, member_name, role;

COMMENT ON TABLE conversations IS 'Conversations table extended to support both single agent and team conversations';
COMMENT ON TABLE team_executions IS 'Team execution records with detailed coordination information';
COMMENT ON TABLE team_member_calls IS 'Individual agent calls within team executions';
COMMENT ON TABLE knowledge_sources IS 'Knowledge source citations with detailed retrieval information';
COMMENT ON TABLE thinking_steps IS 'Agent reasoning and thinking process steps';
COMMENT ON VIEW team_conversation_details IS 'Complete view of team conversations with all related data';
COMMENT ON VIEW team_member_performance_stats IS 'Performance statistics for team members';