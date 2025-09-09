-- NextAgent Lite 政策问答团队模板数据库迁移
-- 创建日期: 2025-08-12
-- 描述: 添加政策问答团队的执行模板到数据库

BEGIN;

-- 删除旧的地聚物材料相关模板（如果存在）
DELETE FROM team_execution_templates WHERE template_id LIKE '%geopolymer%';

-- 插入NextAgent Lite政策问答团队模板
INSERT INTO team_execution_templates (
    template_id, 
    team_name, 
    execution_mode, 
    agent_sequence, 
    dependencies, 
    timeout_config, 
    retry_config, 
    is_active, 
    version, 
    created_at, 
    updated_at
) VALUES 
-- 直接回答模式模板
(
    'nextAgent_direct_answer_template',
    'nextAgent_policy_qa_team',
    'sequential',
    '["intelligent_routing_agent", "summary_answer_agent"]',
    '{
        "intelligent_routing_agent": [],
        "summary_answer_agent": ["intelligent_routing_agent"]
    }',
    '{
        "total_timeout": 15,
        "agent_timeouts": {
            "intelligent_routing_agent": 8,
            "summary_answer_agent": 7
        }
    }',
    '{
        "max_retries": 2,
        "retry_delay": 1,
        "retry_agents": ["intelligent_routing_agent", "summary_answer_agent"]
    }',
    true,
    '1.0.0',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),

-- 知识库检索模式模板
(
    'nextAgent_knowledge_retrieval_template',
    'nextAgent_policy_qa_team',
    'sequential',
    '["intelligent_routing_agent", "knowledge_retrieval_agent", "summary_answer_agent"]',
    '{
        "intelligent_routing_agent": [],
        "knowledge_retrieval_agent": ["intelligent_routing_agent"],
        "summary_answer_agent": ["knowledge_retrieval_agent"]
    }',
    '{
        "total_timeout": 30,
        "agent_timeouts": {
            "intelligent_routing_agent": 8,
            "knowledge_retrieval_agent": 15,
            "summary_answer_agent": 7
        }
    }',
    '{
        "max_retries": 2,
        "retry_delay": 2,
        "retry_agents": ["knowledge_retrieval_agent", "summary_answer_agent"]
    }',
    true,
    '1.0.0',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),

-- 图谱增强检索模式模板
(
    'nextAgent_graph_enhanced_template',
    'nextAgent_policy_qa_team',
    'mixed', -- 混合模式：串行+并行
    '["intelligent_routing_agent", ["knowledge_retrieval_agent", "knowledge_graph_agent"], "summary_answer_agent"]',
    '{
        "intelligent_routing_agent": [],
        "knowledge_retrieval_agent": ["intelligent_routing_agent"],
        "knowledge_graph_agent": ["intelligent_routing_agent"],
        "summary_answer_agent": ["knowledge_retrieval_agent", "knowledge_graph_agent"]
    }',
    '{
        "total_timeout": 45,
        "agent_timeouts": {
            "intelligent_routing_agent": 8,
            "knowledge_retrieval_agent": 20,
            "knowledge_graph_agent": 15,
            "summary_answer_agent": 10
        }
    }',
    '{
        "max_retries": 2,
        "retry_delay": 3,
        "retry_agents": ["knowledge_retrieval_agent", "knowledge_graph_agent", "summary_answer_agent"]
    }',
    true,
    '1.0.0',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);

-- 插入智能体配置到agent_configs表（如果不存在）
INSERT INTO agent_configs (
    agent_id,
    name,
    description,
    model_provider,
    model_id,
    temperature,
    max_tokens,
    system_prompt,
    is_active,
    created_at,
    updated_at
) VALUES 
-- 智能路由决策智能体
(
    'intelligent_routing_agent',
    '智能路由决策专家',
    '根据用户问题类型和复杂度，智能决策是否调用知识库检索和知识图谱检索',
    'one_api',
    'Qwen/Qwen3-30B-A3B-Thinking-2507',
    0.1,
    2048,
    '你是一个智能路由决策专家，负责分析用户问题并决定最优的处理路径。你需要根据问题类型决定是直接回答、调用知识库检索，还是同时调用知识图谱检索。',
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),

-- 政策知识检索智能体
(
    'policy_knowledge_retrieval_agent',
    '政策知识检索专家', 
    '从政策文档库中检索相关信息，提供准确的政策内容',
    'one_api',
    'Qwen/Qwen3-30B-A3B-Thinking-2507',
    0.1,
    3072,
    '你是一个政策知识检索专家，专门从政策文档知识库中检索相关信息。你需要使用混合检索策略，确保检索结果的准确性和时效性。',
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),

-- 政策知识图谱智能体
(
    'policy_knowledge_graph_agent',
    '政策知识图谱专家',
    '从政策知识图谱中检索实体关系信息，提供政策间的关联分析',
    'one_api', 
    'Qwen/Qwen3-30B-A3B-Thinking-2507',
    0.1,
    2048,
    '你是一个政策知识图谱专家，专门从政策知识图谱中检索实体和关系信息。你需要分析政策间的关联关系，提供政策相关实体和关系推荐。',
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),

-- 政策问答总结智能体
(
    'policy_summary_answer_agent',
    '政策问答总结专家',
    '整合各智能体结果，生成专业、准确、易懂的政策问答回答',
    'one_api',
    'Qwen/Qwen3-30B-A3B-Thinking-2507',
    0.1,
    4096,
    '你是一个政策问答总结专家，负责整合检索结果并生成高质量的政策问答回答。你需要提供结构化、专业且易懂的回答。',
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
)
ON CONFLICT (agent_id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    model_provider = EXCLUDED.model_provider,
    model_id = EXCLUDED.model_id,
    temperature = EXCLUDED.temperature,
    max_tokens = EXCLUDED.max_tokens,
    system_prompt = EXCLUDED.system_prompt,
    updated_at = CURRENT_TIMESTAMP;

-- 更新系统配置，设置默认团队模板
INSERT INTO system_configs (category, key, value, description, is_public, created_at) VALUES
('team_templates', 'default_policy_team', 'nextAgent_policy_qa_team', 'NextAgent Lite默认政策问答团队', false, CURRENT_TIMESTAMP),
('team_templates', 'default_execution_mode', 'knowledge_retrieval', '默认执行模式', false, CURRENT_TIMESTAMP),
('team_templates', 'available_modes', '["direct_answer", "knowledge_retrieval", "graph_enhanced"]', '可用执行模式列表', false, CURRENT_TIMESTAMP)
ON CONFLICT (category, key) DO UPDATE SET 
    value = EXCLUDED.value,
    description = EXCLUDED.description,
    updated_at = CURRENT_TIMESTAMP;

-- 添加迁移记录
INSERT INTO migrations (version, name, executed_at, checksum) VALUES
('20250812_003', 'add_policy_qa_team_templates', CURRENT_TIMESTAMP, 'policy_qa_templates_checksum');

COMMIT;