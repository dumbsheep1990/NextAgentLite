-- ============================================================================
-- Hook Pipelines系统数据库迁移
-- 创建时间: 2025-10-18
-- 描述: 添加Hook Pipeline相关表，支持检索路由和处理的灵活配置
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. Hook Pipeline配置表
-- ============================================================================
CREATE TABLE IF NOT EXISTS hook_pipelines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pipeline_name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    scenario VARCHAR(50) DEFAULT 'general',  -- general | policy | academic | enterprise
    is_active BOOLEAN DEFAULT TRUE,

    -- Pre-hooks配置 (JSONB数组)
    -- 格式: [{"hook_id": "input_validation", "enabled": true, "config": {...}}, ...]
    pre_hooks_config JSONB DEFAULT '[]'::jsonb,

    -- Post-hooks配置 (JSONB数组)
    -- 格式: [{"hook_id": "output_validation", "enabled": true, "config": {...}}, ...]
    post_hooks_config JSONB DEFAULT '[]'::jsonb,

    -- 路由规则 (JSONB数组)
    -- 格式: [{"conditions": {"intent": "fact", "complexity": "simple"}, "strategy": "qa_direct"}, ...]
    routing_rules JSONB DEFAULT '[]'::jsonb,

    -- 元数据
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,

    CONSTRAINT pipeline_name_length CHECK (char_length(pipeline_name) >= 3)
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_hook_pipelines_scenario ON hook_pipelines(scenario);
CREATE INDEX IF NOT EXISTS idx_hook_pipelines_active ON hook_pipelines(is_active);
CREATE INDEX IF NOT EXISTS idx_hook_pipelines_name ON hook_pipelines(pipeline_name);

-- 创建更新触发器
DROP TRIGGER IF EXISTS update_hook_pipelines_updated_at ON hook_pipelines;
CREATE TRIGGER update_hook_pipelines_updated_at
BEFORE UPDATE ON hook_pipelines
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 2. Hook执行日志表
-- ============================================================================
CREATE TABLE IF NOT EXISTS hook_execution_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pipeline_id UUID REFERENCES hook_pipelines(id) ON DELETE SET NULL,
    agent_id VARCHAR(100),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,

    -- 执行信息
    hook_id VARCHAR(100) NOT NULL,
    hook_type VARCHAR(20) NOT NULL CHECK (hook_type IN ('pre', 'post')),
    execution_order INT NOT NULL,

    -- 输入/输出快照
    input_snapshot JSONB,
    output_snapshot JSONB,

    -- 执行结果
    status VARCHAR(20) NOT NULL CHECK (status IN ('success', 'failure', 'skipped')),
    error_message TEXT,
    execution_time_ms INT,

    -- 决策记录（用于路由hook）
    routing_decision JSONB,

    executed_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_hook_logs_pipeline ON hook_execution_logs(pipeline_id);
CREATE INDEX IF NOT EXISTS idx_hook_logs_agent ON hook_execution_logs(agent_id);
CREATE INDEX IF NOT EXISTS idx_hook_logs_user ON hook_execution_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_hook_logs_executed_at ON hook_execution_logs(executed_at DESC);
CREATE INDEX IF NOT EXISTS idx_hook_logs_status ON hook_execution_logs(status);

-- ============================================================================
-- 3. 用户智能体与Hook Pipeline关联表
-- ============================================================================
CREATE TABLE IF NOT EXISTS user_agent_pipelines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id VARCHAR(100) NOT NULL,
    pipeline_id UUID REFERENCES hook_pipelines(id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT TRUE,
    priority INT DEFAULT 0,  -- 多个pipeline时的优先级

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(agent_id, pipeline_id)
);

-- 创建索引
CREATE INDEX idx_agent_pipelines_agent ON user_agent_pipelines(agent_id);
CREATE INDEX idx_agent_pipelines_pipeline ON user_agent_pipelines(pipeline_id);
CREATE INDEX idx_agent_pipelines_active ON user_agent_pipelines(is_active);

-- 创建更新触发器
CREATE TRIGGER update_user_agent_pipelines_updated_at
BEFORE UPDATE ON user_agent_pipelines
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 4. 扩展user_agents表
-- ============================================================================
-- 添加Hook Pipeline关联字段
ALTER TABLE user_agents
ADD COLUMN IF NOT EXISTS default_pipeline_id UUID REFERENCES hook_pipelines(id) ON DELETE SET NULL;

ALTER TABLE user_agents
ADD COLUMN IF NOT EXISTS enable_pre_hooks BOOLEAN DEFAULT false;

ALTER TABLE user_agents
ADD COLUMN IF NOT EXISTS enable_post_hooks BOOLEAN DEFAULT false;

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_user_agents_pipeline ON user_agents(default_pipeline_id);

-- ============================================================================
-- 5. 插入默认Hook Pipeline配置
-- ============================================================================

-- 5.1 通用检索Pipeline
INSERT INTO hook_pipelines (
    pipeline_name,
    description,
    scenario,
    pre_hooks_config,
    post_hooks_config,
    routing_rules,
    is_active
) VALUES (
    'default_retrieval_pipeline',
    '默认检索路由Pipeline，支持意图分析和动态检索策略',
    'general',
    -- Pre-hooks配置
    '[
        {
            "hook_id": "input_validation",
            "enabled": true,
            "config": {
                "max_length": 4000,
                "min_length": 1
            }
        },
        {
            "hook_id": "intent_analysis",
            "enabled": true,
            "config": {
                "enable_llm_fallback": true
            }
        },
        {
            "hook_id": "retrieval_strategy_router",
            "enabled": true,
            "config": {
                "pre_retrieve": false,
                "default_strategy": "hybrid_default"
            }
        }
    ]'::jsonb,
    -- Post-hooks配置
    '[
        {
            "hook_id": "output_validation",
            "enabled": true,
            "config": {
                "min_length": 10,
                "max_length": 5000
            }
        },
        {
            "hook_id": "citation_formatter",
            "enabled": true,
            "config": {
                "format_style": "numbered",
                "add_source_links": true
            }
        }
    ]'::jsonb,
    -- 路由规则
    '[
        {
            "conditions": {"intent": "fact", "complexity": "simple"},
            "strategy": "qa_direct"
        },
        {
            "conditions": {"intent": "summary"},
            "strategy": "full_retrieval_with_rerank"
        },
        {
            "conditions": {"intent": "compare"},
            "strategy": "full_retrieval_with_rerank"
        },
        {
            "conditions": {"complexity": "high"},
            "strategy": "hierarchical_retrieval"
        }
    ]'::jsonb,
    true
) ON CONFLICT (pipeline_name) DO NOTHING;

-- 5.2 政策问答Pipeline
INSERT INTO hook_pipelines (
    pipeline_name,
    description,
    scenario,
    pre_hooks_config,
    post_hooks_config,
    routing_rules,
    is_active
) VALUES (
    'policy_qa_pipeline',
    '政策问答专用Pipeline，支持政策元数据提取和图谱增强',
    'policy',
    -- Pre-hooks配置
    '[
        {
            "hook_id": "input_validation",
            "enabled": true,
            "config": {
                "max_length": 4000,
                "min_length": 1
            }
        },
        {
            "hook_id": "intent_analysis",
            "enabled": true,
            "config": {
                "enable_llm_fallback": true
            }
        },
        {
            "hook_id": "policy_metadata_extractor",
            "enabled": true,
            "config": {
                "extract_policy_number": true,
                "extract_date": true,
                "extract_issuer": true
            }
        },
        {
            "hook_id": "retrieval_strategy_router",
            "enabled": true,
            "config": {
                "pre_retrieve": false,
                "default_strategy": "graph_enhanced"
            }
        }
    ]'::jsonb,
    -- Post-hooks配置
    '[
        {
            "hook_id": "output_validation",
            "enabled": true,
            "config": {
                "min_length": 10,
                "max_length": 5000
            }
        },
        {
            "hook_id": "citation_formatter",
            "enabled": true,
            "config": {
                "format_style": "numbered",
                "add_source_links": true
            }
        }
    ]'::jsonb,
    -- 路由规则（政策专用）
    '[
        {
            "conditions": {"domain": "policy"},
            "strategy": "graph_enhanced"
        },
        {
            "conditions": {"intent": "fact", "complexity": "simple"},
            "strategy": "qa_direct"
        },
        {
            "conditions": {"intent": "summary"},
            "strategy": "full_retrieval_with_rerank"
        }
    ]'::jsonb,
    true
) ON CONFLICT (pipeline_name) DO NOTHING;

-- 5.3 学术问答Pipeline
INSERT INTO hook_pipelines (
    pipeline_name,
    description,
    scenario,
    pre_hooks_config,
    post_hooks_config,
    routing_rules,
    is_active
) VALUES (
    'academic_qa_pipeline',
    '学术问答专用Pipeline，支持学术元数据提取和引用分析',
    'academic',
    -- Pre-hooks配置
    '[
        {
            "hook_id": "input_validation",
            "enabled": true,
            "config": {
                "max_length": 4000,
                "min_length": 1
            }
        },
        {
            "hook_id": "intent_analysis",
            "enabled": true,
            "config": {
                "enable_llm_fallback": true
            }
        },
        {
            "hook_id": "academic_metadata_extractor",
            "enabled": true,
            "config": {
                "extract_citations": true,
                "extract_authors": true,
                "extract_year": true
            }
        },
        {
            "hook_id": "retrieval_strategy_router",
            "enabled": true,
            "config": {
                "pre_retrieve": false,
                "default_strategy": "hybrid_default"
            }
        }
    ]'::jsonb,
    -- Post-hooks配置
    '[
        {
            "hook_id": "output_validation",
            "enabled": true,
            "config": {
                "min_length": 10,
                "max_length": 5000
            }
        },
        {
            "hook_id": "citation_formatter",
            "enabled": true,
            "config": {
                "format_style": "numbered",
                "add_source_links": true
            }
        }
    ]'::jsonb,
    -- 路由规则（学术专用）
    '[
        {
            "conditions": {"domain": "academic"},
            "strategy": "academic_enhanced"
        },
        {
            "conditions": {"intent": "fact"},
            "strategy": "qa_direct"
        },
        {
            "conditions": {"intent": "summary"},
            "strategy": "full_retrieval_with_rerank"
        }
    ]'::jsonb,
    true
) ON CONFLICT (pipeline_name) DO NOTHING;

-- ============================================================================
-- 6. 添加注释
-- ============================================================================
COMMENT ON TABLE hook_pipelines IS 'Hook Pipeline配置表，定义Pre-hooks和Post-hooks的执行链';
COMMENT ON TABLE hook_execution_logs IS 'Hook执行日志表，记录每次Hook执行的详细信息';
COMMENT ON TABLE user_agent_pipelines IS '用户智能体与Hook Pipeline关联表';

COMMENT ON COLUMN hook_pipelines.pre_hooks_config IS 'Pre-hooks配置（JSONB数组），在Agent处理输入之前执行';
COMMENT ON COLUMN hook_pipelines.post_hooks_config IS 'Post-hooks配置（JSONB数组），在Agent生成响应之后执行';
COMMENT ON COLUMN hook_pipelines.routing_rules IS '检索路由规则（JSONB数组），定义条件和对应的策略';
COMMENT ON COLUMN hook_execution_logs.routing_decision IS '路由决策记录，存储RetrievalStrategyRouterHook的决策结果';

-- ============================================================================
-- 7. 添加迁移记录
-- ============================================================================
INSERT INTO migrations (version, name, executed_at, checksum)
VALUES ('20251018_001', 'add_hook_pipelines_tables', CURRENT_TIMESTAMP, 'hook_pipelines_system')
ON CONFLICT (version) DO NOTHING;

COMMIT;
