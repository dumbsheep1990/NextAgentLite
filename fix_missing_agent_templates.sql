-- 为缺失的子智能体创建模板记录
-- 执行方式：PGPASSWORD='zzdsj123!' psql -h localhost -p 5434 -U zzdsj_demo -d zzdsj_demo -f fix_missing_agent_templates.sql

-- 1. 智能路由决策专家
INSERT INTO agent_templates (
    id,
    template_code,
    template_name,
    template_type,
    category,
    description,
    icon,
    color,
    base_config,
    model_config,
    tools_config,
    team_members,
    team_mode,
    is_system,
    is_active,
    created_at,
    updated_at
) VALUES (
    gen_random_uuid(),
    'intelligent_routing_agent',
    '智能路由决策专家',
    'single',
    '路由决策',
    '智能分析用户问题，决定最优的处理路径，包括是否调用知识库检索和知识图谱检索',
    'BranchesOutlined',
    '#52c41a',
    jsonb_build_object(
        'prompt', '你是智能路由决策专家，根据用户问题类型和复杂度，智能决策是否调用知识库检索和知识图谱检索。

核心职责：
- 【核心职责】智能分析用户问题，决定最优的处理路径
- 【问题分类】识别问题类型：
  - 简单问候/闲聊：直接回答，无需调用检索
  - 常识性政策问题：基于通用知识回答，可选择性调用检索
  - 具体政策查询：必须调用知识库检索获取准确信息
  - 复杂政策分析：同时调用知识库检索和知识图谱检索
- 【路径决策】为不同问题制定执行策略：
  - 直接回答：仅调用总结回答Agent
  - 知识库检索：调用知识检索→总结回答
  - 图谱增强：调用知识检索→图谱检索→总结回答
- 【效率优化】避免不必要的检索调用，提高响应速度
- 【智能判断】基于问题关键词、语义和上下文进行决策'
    ),
    jsonb_build_object(
        'model_id', 'qwen3-30b-a3b-instruct-2507',
        'temperature', 0.7,
        'max_tokens', 2000
    ),
    jsonb_build_object(
        'selected', '[]'::jsonb
    ),
    '[]'::jsonb,
    NULL,
    true,
    true,
    now(),
    now()
)
ON CONFLICT (template_code)
DO UPDATE SET
    base_config = EXCLUDED.base_config,
    model_config = EXCLUDED.model_config,
    template_name = EXCLUDED.template_name,
    description = EXCLUDED.description,
    updated_at = now();

-- 2. DAG执行图重构专家
INSERT INTO agent_templates (
    id,
    template_code,
    template_name,
    template_type,
    category,
    description,
    icon,
    color,
    base_config,
    model_config,
    tools_config,
    team_members,
    team_mode,
    is_system,
    is_active,
    created_at,
    updated_at
) VALUES (
    gen_random_uuid(),
    'dag_reconstruction_agent',
    'DAG执行图重构专家',
    'single',
    'DAG重构',
    '基于路由决策动态重构Agent执行图，优化并发和依赖关系',
    'DeploymentUnitOutlined',
    '#1890ff',
    jsonb_build_object(
        'prompt', '你是DAG执行图重构专家，基于路由决策动态重构Agent执行图，优化并发和依赖关系。

核心职责：
- 【核心职责】基于智能路由决策重构DAG执行图
- 【执行模式选择】根据问题类型选择执行模式：
  - 快速模式：仅总结Agent（简单问题）
  - 标准模式：翻译->检索->图谱->总结（一般技术问题）
  - 并行模式：检索和图谱并行执行（复杂问题）
  - 深度模式：包含问题分解的完整流程（复合问题）
- 【依赖关系管理】优化Agent间的依赖关系和数据流
- 【并发优化】识别可并行执行的Agent组合
- 【资源调度】根据系统负载动态调整执行策略
- 【执行计划输出】生成详细的DAG执行图和时间估算'
    ),
    jsonb_build_object(
        'model_id', 'qwen3-30b-a3b-instruct-2507',
        'temperature', 0.7,
        'max_tokens', 2000
    ),
    jsonb_build_object(
        'selected', '[]'::jsonb
    ),
    '[]'::jsonb,
    NULL,
    true,
    true,
    now(),
    now()
)
ON CONFLICT (template_code)
DO UPDATE SET
    base_config = EXCLUDED.base_config,
    model_config = EXCLUDED.model_config,
    template_name = EXCLUDED.template_name,
    description = EXCLUDED.description,
    updated_at = now();

-- 验证插入结果
SELECT
    template_code,
    template_name,
    length(base_config->>'prompt') as prompt_length,
    model_config->>'model_id' as model_id
FROM agent_templates
WHERE template_code IN ('intelligent_routing_agent', 'dag_reconstruction_agent');
