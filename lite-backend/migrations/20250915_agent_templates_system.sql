-- ============================================================================
-- 智能体模板系统数据库迁移
-- 创建时间: 2025-09-15
-- 描述: 将智能体模板从硬编码迁移到数据库管理
-- ============================================================================

-- ============================================================================
-- 1. 系统智能体模板表（预设的智能体模板）
-- ============================================================================
CREATE TABLE IF NOT EXISTS agent_templates (
    id VARCHAR(36) PRIMARY KEY DEFAULT uuid_generate_v4(),
    template_code VARCHAR(100) UNIQUE NOT NULL, -- 模板代码，如 'qa_expert', 'doc_analyst'
    template_name VARCHAR(200) NOT NULL, -- 模板显示名称
    template_type VARCHAR(20) NOT NULL CHECK (template_type IN ('single', 'team')), -- 单体或团队
    category VARCHAR(50), -- 分类：通用、专业、行业等
    description TEXT,
    icon VARCHAR(50) DEFAULT 'RobotOutlined',
    color VARCHAR(20) DEFAULT '#1890ff',
    
    -- 配置信息
    base_config JSONB NOT NULL, -- 基础配置（包含提示词、指令等）
    model_config JSONB, -- 模型配置（默认模型、参数等）
    tools_config JSONB, -- 工具配置
    
    -- 团队特有配置（仅team类型）
    team_members JSONB, -- 团队成员列表
    team_mode VARCHAR(50), -- coordinate, parallel等
    
    -- 元数据
    is_system BOOLEAN DEFAULT true, -- 是否系统预设
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引
CREATE INDEX idx_agent_templates_type ON agent_templates(template_type);
CREATE INDEX idx_agent_templates_category ON agent_templates(category);
CREATE INDEX idx_agent_templates_active ON agent_templates(is_active);

-- ============================================================================
-- 2. 用户自定义智能体表（基于模板创建的实例）
-- ============================================================================
CREATE TABLE IF NOT EXISTS user_agents (
    id VARCHAR(36) PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id INTEGER NOT NULL,
    template_id VARCHAR(36), -- 基于的模板ID（可选）
    agent_code VARCHAR(100) NOT NULL, -- 智能体代码（用户ID_智能体名称）
    agent_name VARCHAR(200) NOT NULL,
    agent_type VARCHAR(20) NOT NULL CHECK (agent_type IN ('single', 'team')),
    description TEXT,
    
    -- 知识库配置
    collection_id VARCHAR(36),
    enable_knowledge_search BOOLEAN DEFAULT true,
    enable_graph_search BOOLEAN DEFAULT false,
    retrieval_mode VARCHAR(20) DEFAULT 'all' CHECK (retrieval_mode IN ('all', 'qa_only', 'papers_only')),
    
    -- 配置信息（继承或覆盖模板配置）
    custom_config JSONB, -- 用户自定义配置
    model_config JSONB, -- 模型配置
    tools_config JSONB, -- 工具配置
    
    -- 团队配置
    team_members JSONB,
    team_mode VARCHAR(50),
    
    -- 元数据
    icon VARCHAR(50),
    color VARCHAR(20),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'deleted')),
    usage_count INTEGER DEFAULT 0,
    last_used_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (template_id) REFERENCES agent_templates(id) ON DELETE SET NULL,
    FOREIGN KEY (collection_id) REFERENCES knowledge_collections(id) ON DELETE SET NULL,
    UNIQUE(user_id, agent_code)
);

-- 创建索引
CREATE INDEX idx_user_agents_user_id ON user_agents(user_id);
CREATE INDEX idx_user_agents_template_id ON user_agents(template_id);
CREATE INDEX idx_user_agents_status ON user_agents(status);

-- ============================================================================
-- 3. 智能体工具定义表
-- ============================================================================
CREATE TABLE IF NOT EXISTS agent_tools (
    id VARCHAR(36) PRIMARY KEY DEFAULT uuid_generate_v4(),
    tool_code VARCHAR(100) UNIQUE NOT NULL,
    tool_name VARCHAR(200) NOT NULL,
    tool_type VARCHAR(50) NOT NULL, -- search, compute, translate, graph等
    description TEXT,
    config_schema JSONB, -- 工具配置模式
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 4. 智能体模板工具关联表
-- ============================================================================
CREATE TABLE IF NOT EXISTS agent_template_tools (
    id VARCHAR(36) PRIMARY KEY DEFAULT uuid_generate_v4(),
    template_id VARCHAR(36) NOT NULL,
    tool_id VARCHAR(36) NOT NULL,
    is_required BOOLEAN DEFAULT false,
    default_config JSONB,
    FOREIGN KEY (template_id) REFERENCES agent_templates(id) ON DELETE CASCADE,
    FOREIGN KEY (tool_id) REFERENCES agent_tools(id) ON DELETE CASCADE,
    UNIQUE(template_id, tool_id)
);

-- ============================================================================
-- 5. 用户智能体工具配置表
-- ============================================================================
CREATE TABLE IF NOT EXISTS user_agent_tools (
    id VARCHAR(36) PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id VARCHAR(36) NOT NULL,
    tool_id VARCHAR(36) NOT NULL,
    enabled BOOLEAN DEFAULT true,
    custom_config JSONB,
    FOREIGN KEY (agent_id) REFERENCES user_agents(id) ON DELETE CASCADE,
    FOREIGN KEY (tool_id) REFERENCES agent_tools(id) ON DELETE CASCADE,
    UNIQUE(agent_id, tool_id)
);

-- ============================================================================
-- 6. 智能体对话历史关联
-- ============================================================================
CREATE TABLE IF NOT EXISTS agent_conversations (
    id VARCHAR(36) PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id VARCHAR(36), -- 用户智能体ID（可选）
    template_id VARCHAR(36), -- 模板ID（可选）
    conversation_id INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (agent_id) REFERENCES user_agents(id) ON DELETE SET NULL,
    FOREIGN KEY (template_id) REFERENCES agent_templates(id) ON DELETE SET NULL,
    FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
);

-- ============================================================================
-- 7. 触发器
-- ============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 为需要的表创建触发器
CREATE TRIGGER update_agent_templates_updated_at 
BEFORE UPDATE ON agent_templates 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_agents_updated_at 
BEFORE UPDATE ON user_agents 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 8. 初始化系统预设数据
-- ============================================================================

-- 插入系统工具
INSERT INTO agent_tools (tool_code, tool_name, tool_type, description, config_schema) VALUES
('knowledge_search', '知识库检索', 'search', '从知识库中检索相关内容', '{"enable": true, "top_k": 10}'::jsonb),
('graph_search', '图谱检索', 'graph', '从知识图谱中查询实体关系', '{"enable": false, "mode": "hybrid"}'::jsonb),
('translation', '翻译工具', 'translate', '多语言翻译服务', '{"enable": false, "source_lang": "auto", "target_lang": "zh"}'::jsonb),
('web_search', '网络搜索', 'search', '搜索互联网内容', '{"enable": false, "engine": "bing"}'::jsonb),
('calculator', '计算器', 'compute', '数学计算工具', '{"enable": false}'::jsonb),
('code_interpreter', '代码解释器', 'code', 'Python代码执行', '{"enable": false, "timeout": 30}'::jsonb)
ON CONFLICT (tool_code) DO NOTHING;

-- 插入单体智能体模板
INSERT INTO agent_templates (
    template_code, template_name, template_type, category, description,
    icon, color, base_config, model_config, is_system
) VALUES
(
    'qa_expert',
    '问答专家',
    'single',
    '通用',
    '通用知识问答专家，擅长回答各类问题',
    'ExperimentOutlined',
    '#1890ff',
    '{
        "role": "通用知识问答专家",
        "instructions": [
            "准确理解用户问题",
            "提供专业、准确的回答",
            "基于知识库内容回答，避免幻觉"
        ],
        "capabilities": ["知识问答", "信息检索", "内容理解"]
    }'::jsonb,
    '{
        "default_model": "qwen3-30b-a3b-instruct-2507",
        "temperature": 0.7,
        "max_tokens": 2000,
        "supported_models": [
            "qwen3-30b-a3b-instruct-2507",
            "kimi-k2-siliconflow",
            "qwen-plus-latest",
            "gpt-4o-mini"
        ]
    }'::jsonb,
    true
),
(
    'doc_analyst',
    '文档分析专家',
    'single',
    '专业',
    '文档分析专家，擅长文献检索和内容分析',
    'FileSearchOutlined',
    '#52c41a',
    '{
        "role": "文档分析和文献检索专家",
        "instructions": [
            "深入分析文档内容",
            "提取关键信息和观点",
            "进行文献对比和总结"
        ],
        "capabilities": ["文档分析", "文献检索", "内容总结", "信息提取"]
    }'::jsonb,
    '{
        "default_model": "qwen3-30b-a3b-instruct-2507",
        "temperature": 0.5,
        "max_tokens": 3000
    }'::jsonb,
    true
),
(
    'multimodal_expert',
    '多模态专家',
    'single',
    '专业',
    '多模态内容处理专家，支持图文混合分析',
    'BarChartOutlined',
    '#fa8c16',
    '{
        "role": "多模态内容处理专家",
        "instructions": [
            "分析图表和数据",
            "理解图文混合内容",
            "生成数据洞察报告"
        ],
        "capabilities": ["图表分析", "数据处理", "可视化", "报告生成"]
    }'::jsonb,
    '{
        "default_model": "gemini-2.5-flash-preview-thinking",
        "temperature": 0.6,
        "max_tokens": 2500
    }'::jsonb,
    true
);

-- 插入团队智能体模板
INSERT INTO agent_templates (
    template_code, template_name, template_type, category, description,
    icon, color, base_config, model_config, team_members, team_mode, is_system
) VALUES
(
    'general_qa_team',
    '通用智能问答团队',
    'team',
    '通用',
    '基于Agno框架的通用智能体团队，支持多领域知识问答',
    'TeamOutlined',
    '#f97316',
    '{
        "role": "通用智能问答团队",
        "instructions": [
            "协调多个专业智能体协作",
            "智能路由和任务分配",
            "综合多源信息生成答案"
        ],
        "capabilities": ["多智能体协作", "智能路由", "并行处理", "综合分析"]
    }'::jsonb,
    '{
        "default_model": "qwen3-30b-a3b-instruct-2507",
        "temperature": 0.7,
        "max_tokens": 4000
    }'::jsonb,
    '[
        "question_decomposition_agent",
        "intelligent_routing_agent",
        "translation_agent",
        "knowledge_retrieval_agent",
        "knowledge_graph_agent",
        "summary_answer_agent"
    ]'::jsonb,
    'coordinate',
    true
);

-- 关联模板和工具
INSERT INTO agent_template_tools (template_id, tool_id, is_required, default_config)
SELECT 
    t.id as template_id,
    tool.id as tool_id,
    CASE 
        WHEN tool.tool_code = 'knowledge_search' THEN true
        ELSE false
    END as is_required,
    CASE 
        WHEN tool.tool_code = 'knowledge_search' THEN '{"enabled": true, "top_k": 10}'::jsonb
        WHEN tool.tool_code = 'graph_search' THEN '{"enabled": false, "mode": "hybrid"}'::jsonb
        ELSE '{}'::jsonb
    END as default_config
FROM agent_templates t
CROSS JOIN agent_tools tool
WHERE t.template_type = 'single'
AND tool.tool_code IN ('knowledge_search', 'graph_search', 'translation');

-- 为团队模板关联所有工具
INSERT INTO agent_template_tools (template_id, tool_id, is_required, default_config)
SELECT 
    t.id as template_id,
    tool.id as tool_id,
    CASE 
        WHEN tool.tool_code IN ('knowledge_search', 'graph_search') THEN true
        ELSE false
    END as is_required,
    '{"enabled": true}'::jsonb as default_config
FROM agent_templates t
CROSS JOIN agent_tools tool
WHERE t.template_type = 'team';

-- ============================================================================
-- 9. 视图
-- ============================================================================

-- 创建智能体模板完整信息视图
CREATE OR REPLACE VIEW v_agent_templates_full AS
SELECT 
    t.*,
    COALESCE(
        json_agg(
            json_build_object(
                'tool_code', tool.tool_code,
                'tool_name', tool.tool_name,
                'tool_type', tool.tool_type,
                'is_required', att.is_required,
                'default_config', att.default_config
            )
        ) FILTER (WHERE tool.id IS NOT NULL),
        '[]'::json
    ) as tools
FROM agent_templates t
LEFT JOIN agent_template_tools att ON t.id = att.template_id
LEFT JOIN agent_tools tool ON att.tool_id = tool.id
WHERE t.is_active = true
GROUP BY t.id;

-- 创建用户智能体完整信息视图
CREATE OR REPLACE VIEW v_user_agents_full AS
SELECT 
    ua.*,
    u.username,
    t.template_name,
    kc.name as collection_name,
    COALESCE(
        json_agg(
            json_build_object(
                'tool_code', tool.tool_code,
                'tool_name', tool.tool_name,
                'enabled', uat.enabled,
                'custom_config', uat.custom_config
            )
        ) FILTER (WHERE tool.id IS NOT NULL),
        '[]'::json
    ) as tools
FROM user_agents ua
LEFT JOIN users u ON ua.user_id = u.id
LEFT JOIN agent_templates t ON ua.template_id = t.id
LEFT JOIN knowledge_collections kc ON ua.collection_id = kc.id
LEFT JOIN user_agent_tools uat ON ua.id = uat.agent_id
LEFT JOIN agent_tools tool ON uat.tool_id = tool.id
WHERE ua.status = 'active'
GROUP BY ua.id, u.username, t.template_name, kc.name;

COMMENT ON TABLE agent_templates IS '系统智能体模板表';
COMMENT ON TABLE user_agents IS '用户自定义智能体表';
COMMENT ON TABLE agent_tools IS '智能体工具定义表';
COMMENT ON TABLE agent_template_tools IS '模板工具关联表';
COMMENT ON TABLE user_agent_tools IS '用户智能体工具配置表';
COMMENT ON TABLE agent_conversations IS '智能体对话历史关联表';