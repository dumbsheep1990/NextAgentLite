-- Agno Team集成数据库迁移脚本 (安全版本)
-- 迁移版本: 20250730_add_agno_team_tables_safe
-- 描述: 只添加新表，不修改现有表结构，确保完全向后兼容

-- 1. 创建team_sessions表
CREATE TABLE IF NOT EXISTS team_sessions (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(100) UNIQUE NOT NULL,
    team_name VARCHAR(200) NOT NULL,
    team_mode VARCHAR(50) NOT NULL DEFAULT 'coordinate',
    coordinator_id VARCHAR(100),
    status VARCHAR(50) NOT NULL DEFAULT 'active',
    start_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    end_time TIMESTAMP WITH TIME ZONE,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 添加索引
CREATE INDEX IF NOT EXISTS idx_team_sessions_session_id ON team_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_team_sessions_team_name ON team_sessions(team_name);
CREATE INDEX IF NOT EXISTS idx_team_sessions_status ON team_sessions(status);

-- 2. 创建team_executions表
CREATE TABLE IF NOT EXISTS team_executions (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(100) NOT NULL,
    execution_id VARCHAR(100) UNIQUE NOT NULL,
    team_name VARCHAR(200) NOT NULL,
    query TEXT NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    start_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    end_time TIMESTAMP WITH TIME ZONE,
    duration_ms INTEGER,
    result_content TEXT,
    error_message TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 添加索引
CREATE INDEX IF NOT EXISTS idx_team_executions_session_id ON team_executions(session_id);
CREATE INDEX IF NOT EXISTS idx_team_executions_execution_id ON team_executions(execution_id);
CREATE INDEX IF NOT EXISTS idx_team_executions_team_name ON team_executions(team_name);
CREATE INDEX IF NOT EXISTS idx_team_executions_status ON team_executions(status);

-- 3. 创建team_execution_steps表
CREATE TABLE IF NOT EXISTS team_execution_steps (
    id SERIAL PRIMARY KEY,
    execution_id VARCHAR(100) NOT NULL,
    step_id VARCHAR(100) NOT NULL,
    member_id VARCHAR(100) NOT NULL,
    member_name VARCHAR(200) NOT NULL,
    action VARCHAR(200) NOT NULL,
    input_data JSONB,
    output_data JSONB,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    start_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    end_time TIMESTAMP WITH TIME ZONE,
    duration_ms INTEGER,
    error_message TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 添加索引
CREATE INDEX IF NOT EXISTS idx_team_execution_steps_execution_id ON team_execution_steps(execution_id);
CREATE INDEX IF NOT EXISTS idx_team_execution_steps_member_id ON team_execution_steps(member_id);
CREATE INDEX IF NOT EXISTS idx_team_execution_steps_status ON team_execution_steps(status);

-- 4. 创建team_members表
CREATE TABLE IF NOT EXISTS team_members (
    id SERIAL PRIMARY KEY,
    team_name VARCHAR(200) NOT NULL,
    member_id VARCHAR(100) NOT NULL,
    member_name VARCHAR(200) NOT NULL,
    role VARCHAR(200) NOT NULL,
    model_provider VARCHAR(100),
    model_id VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(team_name, member_id)
);

-- 添加索引
CREATE INDEX IF NOT EXISTS idx_team_members_team_name ON team_members(team_name);
CREATE INDEX IF NOT EXISTS idx_team_members_member_id ON team_members(member_id);
CREATE INDEX IF NOT EXISTS idx_team_members_is_active ON team_members(is_active);

-- 5. 创建langdb_metrics表
CREATE TABLE IF NOT EXISTS langdb_metrics (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(100) NOT NULL,
    metric_type VARCHAR(100) NOT NULL,
    metric_name VARCHAR(200) NOT NULL,
    metric_value JSONB NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 添加索引
CREATE INDEX IF NOT EXISTS idx_langdb_metrics_session_id ON langdb_metrics(session_id);
CREATE INDEX IF NOT EXISTS idx_langdb_metrics_metric_type ON langdb_metrics(metric_type);
CREATE INDEX IF NOT EXISTS idx_langdb_metrics_timestamp ON langdb_metrics(timestamp);

-- 6. 插入默认的Team成员数据
INSERT INTO team_members (team_name, member_id, member_name, role, model_provider, model_id) VALUES
('geopolymer_qa_team_v2', 'question_decomposition_agent', '问题分解专家', '问题分解和领域识别', 'one_api', 'qwen3-30b-a3b-instruct-2507'),
('geopolymer_qa_team_v2', 'translation_agent', '实时翻译专家', '多语言翻译和术语处理', 'one_api', 'gemini-2.5-flash-preview-thinking'),
('geopolymer_qa_team_v2', 'knowledge_retrieval_agent', '多语言知识检索专家', '多语言检索和相关性评分', 'one_api', 'qwen3-30b-a3b-instruct-2507'),
('geopolymer_qa_team_v2', 'knowledge_graph_agent', '知识图谱专家', '图谱数据检索和实体关系分析', 'one_api', 'qwen3-30b-a3b-instruct-2507'),
('geopolymer_qa_team_v2', 'summary_answer_agent', '总结回答专家', '结果整合和结构化输出', 'one_api', 'qwen3-30b-a3b-instruct-2507'),
('geopolymer_qa_team_v2', 'qa_coordinator_v2', '多语言问答协调器', '流程协调和质量监控', 'one_api', 'qwen3-30b-a3b-instruct-2507')
ON CONFLICT (team_name, member_id) DO NOTHING;

-- 7. 添加表注释
COMMENT ON TABLE team_sessions IS 'Team会话表，存储智能体团队的会话信息';
COMMENT ON TABLE team_executions IS 'Team执行记录表，存储每次Team查询的执行记录';
COMMENT ON TABLE team_execution_steps IS 'Team执行步骤表，存储Team执行过程中的详细步骤';
COMMENT ON TABLE team_members IS 'Team成员表，存储智能体团队的成员信息';
COMMENT ON TABLE langdb_metrics IS 'LangDB监控指标表，存储Team执行的监控数据';

-- 8. 创建视图用于Team执行统计
CREATE OR REPLACE VIEW team_execution_stats AS
SELECT 
    te.team_name,
    COUNT(*) as total_executions,
    COUNT(CASE WHEN te.status = 'completed' THEN 1 END) as successful_executions,
    COUNT(CASE WHEN te.status = 'error' THEN 1 END) as failed_executions,
    AVG(te.duration_ms) as avg_duration_ms,
    MAX(te.created_at) as last_execution_time
FROM team_executions te
GROUP BY te.team_name;

-- 9. 创建视图用于成员性能统计
CREATE OR REPLACE VIEW team_member_performance AS
SELECT 
    tes.member_id,
    tes.member_name,
    COUNT(*) as total_steps,
    COUNT(CASE WHEN tes.status = 'completed' THEN 1 END) as successful_steps,
    COUNT(CASE WHEN tes.status = 'error' THEN 1 END) as failed_steps,
    AVG(tes.duration_ms) as avg_duration_ms,
    MAX(tes.created_at) as last_step_time
FROM team_execution_steps tes
GROUP BY tes.member_id, tes.member_name;

-- 迁移完成
SELECT 'Agno Team数据库迁移完成 (安全版本) - 只添加新表，未修改现有表结构' as migration_status; 