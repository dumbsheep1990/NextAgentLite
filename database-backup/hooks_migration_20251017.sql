-- ============================================================
-- Hook Pipeline 数据库迁移脚本
-- 版本: 1.0
-- 日期: 2025-10-17
-- 说明: 创建Hook Pipeline相关表结构
-- ============================================================

-- 1. Hook Pipeline配置表
CREATE TABLE IF NOT EXISTS hook_pipelines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pipeline_name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    scenario VARCHAR(50),  -- general | policy | academic | enterprise
    is_active BOOLEAN DEFAULT TRUE,

    -- Pre-hooks配置（JSONB数组）
    pre_hooks_config JSONB DEFAULT '[]'::jsonb,

    -- Post-hooks配置（JSONB数组）
    post_hooks_config JSONB DEFAULT '[]'::jsonb,

    -- 路由规则（JSONB数组）
    routing_rules JSONB DEFAULT '[]'::jsonb,

    -- 元数据
    metadata JSONB DEFAULT '{}'::jsonb,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID,

    CONSTRAINT pipeline_name_length CHECK (char_length(pipeline_name) >= 3)
);

CREATE INDEX IF NOT EXISTS idx_hook_pipelines_scenario ON hook_pipelines(scenario);
CREATE INDEX IF NOT EXISTS idx_hook_pipelines_active ON hook_pipelines(is_active);
CREATE INDEX IF NOT EXISTS idx_hook_pipelines_name ON hook_pipelines(pipeline_name);

COMMENT ON TABLE hook_pipelines IS 'Hook Pipeline配置表 - 定义pre-hooks和post-hooks执行链';
COMMENT ON COLUMN hook_pipelines.pre_hooks_config IS 'Pre-hooks配置数组，每个元素包含hook_id、class、config等';
COMMENT ON COLUMN hook_pipelines.post_hooks_config IS 'Post-hooks配置数组';
COMMENT ON COLUMN hook_pipelines.routing_rules IS '检索策略路由规则数组';

-- 2. Hook执行日志表
CREATE TABLE IF NOT EXISTS hook_execution_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pipeline_id UUID REFERENCES hook_pipelines(id) ON DELETE CASCADE,
    agent_id VARCHAR(100),
    user_id UUID,

    -- 执行信息
    hook_id VARCHAR(100) NOT NULL,
    hook_type VARCHAR(20) NOT NULL,  -- pre | post
    execution_order INT NOT NULL,

    -- 输入/输出快照
    input_snapshot JSONB,
    output_snapshot JSONB,

    -- 执行结果
    status VARCHAR(20) NOT NULL,  -- success | failure | skipped
    error_message TEXT,
    execution_time_ms INT,

    -- 决策记录（用于路由hook）
    routing_decision JSONB,

    -- 时间戳
    executed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_hook_logs_pipeline ON hook_execution_logs(pipeline_id);
CREATE INDEX IF NOT EXISTS idx_hook_logs_agent ON hook_execution_logs(agent_id);
CREATE INDEX IF NOT EXISTS idx_hook_logs_executed_at ON hook_execution_logs(executed_at DESC);
CREATE INDEX IF NOT EXISTS idx_hook_logs_status ON hook_execution_logs(status);
CREATE INDEX IF NOT EXISTS idx_hook_logs_hook_id ON hook_execution_logs(hook_id);

COMMENT ON TABLE hook_execution_logs IS 'Hook执行日志表 - 记录每个hook的执行情况';
COMMENT ON COLUMN hook_execution_logs.routing_decision IS '路由hook的决策记录（策略选择、配置参数等）';

-- 3. 用户智能体与Hook Pipeline关联表
CREATE TABLE IF NOT EXISTS user_agent_pipelines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id VARCHAR(100) NOT NULL,
    pipeline_id UUID REFERENCES hook_pipelines(id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT TRUE,
    priority INT DEFAULT 0,  -- 多个pipeline时的优先级（数字越大优先级越高）

    -- 覆盖配置（可选，用于agent级别的定制）
    override_config JSONB DEFAULT '{}'::jsonb,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(agent_id, pipeline_id)
);

CREATE INDEX IF NOT EXISTS idx_agent_pipelines_agent ON user_agent_pipelines(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_pipelines_pipeline ON user_agent_pipelines(pipeline_id);
CREATE INDEX IF NOT EXISTS idx_agent_pipelines_active ON user_agent_pipelines(is_active);

COMMENT ON TABLE user_agent_pipelines IS '用户智能体与Hook Pipeline关联表';
COMMENT ON COLUMN user_agent_pipelines.override_config IS 'Agent级别的配置覆盖（覆盖pipeline默认配置）';

-- 4. 检索策略配置表（扩展）
CREATE TABLE IF NOT EXISTS retrieval_strategies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    strategy_name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,

    -- 策略类型
    strategy_type VARCHAR(50) NOT NULL,  -- qa_direct | hybrid | graph_enhanced | hierarchical | custom

    -- 配置参数
    config JSONB DEFAULT '{}'::jsonb,

    -- 适用场景
    applicable_intents TEXT[] DEFAULT '{}',  -- ['fact', 'summary', ...]
    applicable_domains TEXT[] DEFAULT '{}',  -- ['policy', 'academic', ...]
    applicable_complexities TEXT[] DEFAULT '{}',  -- ['simple', 'medium', 'high']

    -- 性能指标（可选）
    avg_execution_time_ms INT,
    success_rate FLOAT,
    last_used_at TIMESTAMPTZ,
    usage_count INT DEFAULT 0,

    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_retrieval_strategies_type ON retrieval_strategies(strategy_type);
CREATE INDEX IF NOT EXISTS idx_retrieval_strategies_active ON retrieval_strategies(is_active);
CREATE INDEX IF NOT EXISTS idx_retrieval_strategies_intents ON retrieval_strategies USING GIN(applicable_intents);
CREATE INDEX IF NOT EXISTS idx_retrieval_strategies_domains ON retrieval_strategies USING GIN(applicable_domains);

COMMENT ON TABLE retrieval_strategies IS '检索策略配置表 - 定义各种检索策略的参数和适用场景';

-- 5. 插入默认的检索策略
INSERT INTO retrieval_strategies (strategy_name, description, strategy_type, config, applicable_intents, applicable_domains) VALUES
('qa_direct', 'QA直达 - 直接匹配QA数据集', 'qa_direct',
 '{"top_k": 3, "source": "qa_only", "rerank": false}'::jsonb,
 ARRAY['fact'],
 ARRAY['general']
),
('hybrid_default', '混合检索 - 向量+关键词', 'hybrid',
 '{"top_k": 10, "rerank": true, "source": "all"}'::jsonb,
 ARRAY['other'],
 ARRAY['general']
),
('full_retrieval_with_rerank', '全量检索+重排 - 大规模召回后重排序', 'hybrid',
 '{"top_k": 50, "rerank": true, "rerank_top_k": 10, "source": "all"}'::jsonb,
 ARRAY['summary', 'compare', 'list'],
 ARRAY['general']
),
('graph_enhanced', '图谱增强 - 混合检索+知识图谱', 'graph_enhanced',
 '{"top_k": 10, "enable_graph": true, "graph_mode": "mix", "source": "all"}'::jsonb,
 ARRAY['entity', 'fact'],
 ARRAY['policy', 'academic']
),
('hierarchical_retrieval', '层次检索(HiRAG) - 多层次召回', 'hierarchical',
 '{"mode": "hirag", "hirag_mode": "hi", "top_k": 10}'::jsonb,
 ARRAY['summary', 'compare'],
 ARRAY['general']
),
('policy_enhanced', '政策专用 - 元数据过滤+图谱', 'custom',
 '{"top_k": 10, "enable_graph": true, "enable_metadata_filter": true, "source": "all"}'::jsonb,
 ARRAY['fact', 'summary'],
 ARRAY['policy']
),
('academic_enhanced', '学术专用 - 引用分析+重排', 'custom',
 '{"top_k": 20, "rerank": true, "rerank_top_k": 8, "enable_citation_analysis": true, "source": "all"}'::jsonb,
 ARRAY['fact', 'summary'],
 ARRAY['academic']
)
ON CONFLICT (strategy_name) DO NOTHING;

-- 6. 插入默认的Hook Pipeline配置
INSERT INTO hook_pipelines (pipeline_name, description, scenario, pre_hooks_config, post_hooks_config, routing_rules) VALUES
(
  'default_retrieval_pipeline',
  '默认检索路由Pipeline - 适用于通用问答场景',
  'general',
  '[
    {
      "hook_id": "input_validation",
      "enabled": true,
      "class": "InputValidationHook",
      "config": {
        "max_length": 4000,
        "min_length": 1,
        "forbidden_patterns": ["DROP TABLE", "DELETE FROM", ";--"]
      }
    },
    {
      "hook_id": "intent_analysis",
      "enabled": true,
      "class": "IntentAnalysisHook",
      "config": {
        "llm_gateway_url": "http://127.0.0.1:9050",
        "model_id": "Qwen/Qwen2.5-7B-Instruct",
        "enable_llm_fallback": true
      }
    },
    {
      "hook_id": "retrieval_strategy_router",
      "enabled": true,
      "class": "RetrievalStrategyRouterHook",
      "config": {
        "pre_retrieve": false,
        "default_strategy": "hybrid_default",
        "routing_rules": [
          {
            "name": "事实查询-QA直达",
            "conditions": {"intent": "fact", "complexity": "simple"},
            "strategy": "qa_direct"
          },
          {
            "name": "综述查询-全量重排",
            "conditions": {"intent": ["summary", "compare", "list"]},
            "strategy": "full_retrieval_with_rerank"
          },
          {
            "name": "复杂查询-层次检索",
            "conditions": {"complexity": "high"},
            "strategy": "hierarchical_retrieval"
          }
        ]
      }
    }
  ]'::jsonb,
  '[
    {
      "hook_id": "output_validation",
      "enabled": true,
      "class": "OutputValidationHook",
      "config": {
        "min_length": 10,
        "max_length": 5000
      }
    }
  ]'::jsonb,
  '[]'::jsonb
),
(
  'policy_qa_pipeline',
  '政策问答Pipeline - 针对政策文档优化',
  'policy',
  '[
    {
      "hook_id": "input_validation",
      "enabled": true,
      "class": "InputValidationHook",
      "config": {"max_length": 4000, "min_length": 1}
    },
    {
      "hook_id": "intent_analysis",
      "enabled": true,
      "class": "IntentAnalysisHook",
      "config": {"enable_llm_fallback": true}
    },
    {
      "hook_id": "retrieval_strategy_router",
      "enabled": true,
      "class": "RetrievalStrategyRouterHook",
      "config": {
        "default_strategy": "policy_enhanced",
        "routing_rules": [
          {
            "name": "政策领域-图谱增强",
            "conditions": {"domain": "policy"},
            "strategy": "policy_enhanced"
          }
        ]
      }
    }
  ]'::jsonb,
  '[
    {
      "hook_id": "output_validation",
      "enabled": true,
      "class": "OutputValidationHook",
      "config": {"min_length": 10}
    }
  ]'::jsonb,
  '[]'::jsonb
)
ON CONFLICT (pipeline_name) DO NOTHING;

-- 7. 创建更新触发器
CREATE OR REPLACE FUNCTION update_hook_pipelines_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_hook_pipelines_updated_at ON hook_pipelines;
CREATE TRIGGER trigger_update_hook_pipelines_updated_at
    BEFORE UPDATE ON hook_pipelines
    FOR EACH ROW
    EXECUTE FUNCTION update_hook_pipelines_updated_at();

DROP TRIGGER IF EXISTS trigger_update_user_agent_pipelines_updated_at ON user_agent_pipelines;
CREATE TRIGGER trigger_update_user_agent_pipelines_updated_at
    BEFORE UPDATE ON user_agent_pipelines
    FOR EACH ROW
    EXECUTE FUNCTION update_hook_pipelines_updated_at();

-- 8. 授权（根据实际用户调整）
-- GRANT ALL PRIVILEGES ON hook_pipelines TO your_user;
-- GRANT ALL PRIVILEGES ON hook_execution_logs TO your_user;
-- GRANT ALL PRIVILEGES ON user_agent_pipelines TO your_user;
-- GRANT ALL PRIVILEGES ON retrieval_strategies TO your_user;

-- ============================================================
-- 迁移完成
-- ============================================================
