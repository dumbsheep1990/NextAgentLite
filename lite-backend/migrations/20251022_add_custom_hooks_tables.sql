-- 自定义Hooks功能数据库迁移
-- 创建日期: 2025-10-22
-- 说明: 支持用户通过UI创建和配置自定义Hook

-- =====================================================
-- 1. custom_hooks表 - 存储自定义Hook定义
-- =====================================================
CREATE TABLE IF NOT EXISTS custom_hooks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- 基本信息
    hook_id VARCHAR(100) UNIQUE NOT NULL,  -- Hook唯一标识
    hook_name VARCHAR(200) NOT NULL,       -- Hook名称
    hook_type VARCHAR(10) NOT NULL CHECK (hook_type IN ('pre', 'post')),
    description TEXT,
    category VARCHAR(50),                  -- 分类: security, validation, enhancement等

    -- 创建者信息
    created_by UUID,                       -- 创建用户ID
    organization_id UUID,                  -- 组织ID（多租户）

    -- Hook配置
    is_system BOOLEAN DEFAULT FALSE,       -- 是否系统内置Hook
    is_active BOOLEAN DEFAULT TRUE,        -- 是否启用
    priority INTEGER DEFAULT 0,            -- 执行优先级

    -- 执行配置
    execution_mode VARCHAR(20) DEFAULT 'sequential',  -- sequential/parallel
    timeout_ms INTEGER DEFAULT 5000,       -- 超时时间
    max_retries INTEGER DEFAULT 0,         -- 最大重试次数

    -- 工具绑定配置（JSON格式）
    tool_bindings JSONB DEFAULT '[]'::jsonb,
    -- 格式示例:
    -- [
    --   {
    --     "step_id": "step1",
    --     "tool_id": "api:service:tool",
    --     "tool_type": "api",
    --     "params": {...},
    --     "condition": {...},
    --     "on_success": "continue",
    --     "on_failure": "abort"
    --   }
    -- ]

    -- 输入/输出模式（用于验证）
    input_schema JSONB,
    output_schema JSONB,

    -- 元数据
    metadata JSONB DEFAULT '{}'::jsonb,
    tags TEXT[],                           -- 标签

    -- 时间戳
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    -- 索引
    CONSTRAINT custom_hooks_hook_id_check CHECK (char_length(hook_id) >= 3)
);

-- 索引
CREATE INDEX idx_custom_hooks_hook_type ON custom_hooks(hook_type);
CREATE INDEX idx_custom_hooks_category ON custom_hooks(category);
CREATE INDEX idx_custom_hooks_created_by ON custom_hooks(created_by);
CREATE INDEX idx_custom_hooks_is_active ON custom_hooks(is_active);
CREATE INDEX idx_custom_hooks_tags ON custom_hooks USING gin(tags);

-- 注释
COMMENT ON TABLE custom_hooks IS '自定义Hook定义表';
COMMENT ON COLUMN custom_hooks.hook_id IS 'Hook唯一标识';
COMMENT ON COLUMN custom_hooks.tool_bindings IS '工具绑定配置（JSON数组）';
COMMENT ON COLUMN custom_hooks.execution_mode IS '执行模式：sequential(顺序)/parallel(并行)';


-- =====================================================
-- 2. custom_hook_versions表 - Hook版本管理
-- =====================================================
CREATE TABLE IF NOT EXISTS custom_hook_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    hook_id VARCHAR(100) NOT NULL,
    version INTEGER NOT NULL,              -- 版本号

    -- 版本快照（完整配置）
    config_snapshot JSONB NOT NULL,

    -- 版本信息
    version_description TEXT,
    is_published BOOLEAN DEFAULT FALSE,    -- 是否已发布

    -- 创建信息
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (hook_id) REFERENCES custom_hooks(hook_id) ON DELETE CASCADE,
    CONSTRAINT custom_hook_versions_unique UNIQUE (hook_id, version)
);

-- 索引
CREATE INDEX idx_custom_hook_versions_hook_id ON custom_hook_versions(hook_id);
CREATE INDEX idx_custom_hook_versions_published ON custom_hook_versions(is_published);

COMMENT ON TABLE custom_hook_versions IS 'Hook版本管理表';


-- =====================================================
-- 3. custom_hook_executions表 - Hook执行日志
-- =====================================================
CREATE TABLE IF NOT EXISTS custom_hook_executions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    hook_id VARCHAR(100) NOT NULL,
    execution_id UUID NOT NULL,            -- 关联的执行ID

    -- 执行信息
    pipeline_id UUID,                      -- 所属Pipeline
    agent_id UUID,                         -- 执行的Agent
    user_id UUID,                          -- 用户ID
    session_id VARCHAR(200),               -- 会话ID

    -- 执行结果
    status VARCHAR(20) NOT NULL,           -- success/failure/timeout/skipped
    execution_order INTEGER,               -- 执行顺序

    -- 工具调用记录
    tool_calls JSONB DEFAULT '[]'::jsonb,
    -- 格式:
    -- [
    --   {
    --     "step_id": "step1",
    --     "tool_id": "api:service:tool",
    --     "started_at": "...",
    --     "completed_at": "...",
    --     "status": "success",
    --     "result": {...}
    --   }
    -- ]

    -- 性能指标
    execution_time_ms INTEGER,
    total_tool_calls INTEGER DEFAULT 0,
    successful_tool_calls INTEGER DEFAULT 0,
    failed_tool_calls INTEGER DEFAULT 0,

    -- 错误信息
    error_message TEXT,
    error_stack TEXT,

    -- 输入输出快照
    input_snapshot JSONB,
    output_snapshot JSONB,

    -- 时间戳
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (hook_id) REFERENCES custom_hooks(hook_id) ON DELETE CASCADE
);

-- 索引
CREATE INDEX idx_custom_hook_executions_hook_id ON custom_hook_executions(hook_id);
CREATE INDEX idx_custom_hook_executions_status ON custom_hook_executions(status);
CREATE INDEX idx_custom_hook_executions_agent_id ON custom_hook_executions(agent_id);
CREATE INDEX idx_custom_hook_executions_user_id ON custom_hook_executions(user_id);
CREATE INDEX idx_custom_hook_executions_created_at ON custom_hook_executions(created_at DESC);

COMMENT ON TABLE custom_hook_executions IS 'Hook执行日志表';


-- =====================================================
-- 4. hook_tool_templates表 - Hook工具模板
-- =====================================================
CREATE TABLE IF NOT EXISTS hook_tool_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    template_id VARCHAR(100) UNIQUE NOT NULL,
    template_name VARCHAR(200) NOT NULL,
    description TEXT,

    -- 模板类型
    template_type VARCHAR(50),             -- validation, enhancement, routing等
    hook_type VARCHAR(10) CHECK (hook_type IN ('pre', 'post')),

    -- 预定义的工具绑定配置
    tool_bindings_template JSONB NOT NULL,

    -- 参数模板
    param_schema JSONB,

    -- 标签
    tags TEXT[],
    category VARCHAR(50),

    -- 是否系统内置
    is_system BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 索引
CREATE INDEX idx_hook_tool_templates_type ON hook_tool_templates(template_type);
CREATE INDEX idx_hook_tool_templates_hook_type ON hook_tool_templates(hook_type);

COMMENT ON TABLE hook_tool_templates IS 'Hook工具模板库';


-- =====================================================
-- 5. 触发器 - 自动更新时间戳
-- =====================================================
CREATE OR REPLACE FUNCTION update_custom_hooks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_custom_hooks_updated_at
    BEFORE UPDATE ON custom_hooks
    FOR EACH ROW
    EXECUTE FUNCTION update_custom_hooks_updated_at();


-- =====================================================
-- 6. 初始化系统Hook模板
-- =====================================================
INSERT INTO hook_tool_templates (template_id, template_name, description, template_type, hook_type, tool_bindings_template, is_system) VALUES
(
    'sensitive_word_check_template',
    '敏感词检测模板',
    '使用外部API检测敏感词',
    'security',
    'pre',
    '[
        {
            "step_id": "check_sensitive_words",
            "tool_id": "api:content_safety:check_sensitive_words",
            "tool_type": "api",
            "params": {
                "categories": ["political", "legal", "ethnic"]
            },
            "on_failure": "continue"
        }
    ]'::jsonb,
    true
),
(
    'translation_template',
    '查询翻译模板',
    '使用翻译API翻译用户查询',
    'enhancement',
    'pre',
    '[
        {
            "step_id": "translate_query",
            "tool_id": "api:translation:translate_text",
            "tool_type": "api",
            "params": {
                "source_lang": "auto",
                "target_lang": "en"
            },
            "on_failure": "continue"
        }
    ]'::jsonb,
    true
),
(
    'text_cleaning_template',
    '文本清洗模板',
    '使用MCP工具清洗文本',
    'preprocessing',
    'pre',
    '[
        {
            "step_id": "clean_text",
            "tool_id": "mcp:text_processor:clean_text",
            "tool_type": "mcp",
            "params": {
                "remove_html": true,
                "normalize_whitespace": true
            },
            "on_failure": "continue"
        }
    ]'::jsonb,
    true
)
ON CONFLICT (template_id) DO NOTHING;


-- =====================================================
-- 7. 视图 - 便捷查询
-- =====================================================

-- 活跃的自定义Hooks视图
CREATE OR REPLACE VIEW v_active_custom_hooks AS
SELECT
    h.id,
    h.hook_id,
    h.hook_name,
    h.hook_type,
    h.description,
    h.category,
    h.priority,
    h.is_system,
    jsonb_array_length(h.tool_bindings) as tool_count,
    h.created_at,
    h.updated_at,
    -- 统计信息
    (SELECT COUNT(*) FROM custom_hook_executions e WHERE e.hook_id = h.hook_id) as total_executions,
    (SELECT COUNT(*) FROM custom_hook_executions e WHERE e.hook_id = h.hook_id AND e.status = 'success') as successful_executions
FROM custom_hooks h
WHERE h.is_active = true;

COMMENT ON VIEW v_active_custom_hooks IS '活跃的自定义Hooks视图';


-- Hook执行统计视图
CREATE OR REPLACE VIEW v_hook_execution_stats AS
SELECT
    hook_id,
    COUNT(*) as total_executions,
    COUNT(*) FILTER (WHERE status = 'success') as successful_executions,
    COUNT(*) FILTER (WHERE status = 'failure') as failed_executions,
    AVG(execution_time_ms) as avg_execution_time_ms,
    MAX(execution_time_ms) as max_execution_time_ms,
    MIN(execution_time_ms) as min_execution_time_ms,
    AVG(total_tool_calls) as avg_tool_calls,
    MAX(created_at) as last_execution_at
FROM custom_hook_executions
GROUP BY hook_id;

COMMENT ON VIEW v_hook_execution_stats IS 'Hook执行统计视图';


-- =====================================================
-- 完成提示
-- =====================================================
DO $$
BEGIN
    RAISE NOTICE '✅ 自定义Hooks数据库迁移完成!';
    RAISE NOTICE '   - custom_hooks表已创建';
    RAISE NOTICE '   - custom_hook_versions表已创建';
    RAISE NOTICE '   - custom_hook_executions表已创建';
    RAISE NOTICE '   - hook_tool_templates表已创建';
    RAISE NOTICE '   - 初始化了3个系统模板';
END $$;
