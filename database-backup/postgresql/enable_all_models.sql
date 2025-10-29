-- ========================================
-- 启用所有 Unla 模型配置
-- 执行时间: 2025-10-28
-- ========================================

-- 1. 启用所有 Embedding 模型
UPDATE unla_embedding_models
SET status = 'active',
    updated_at = NOW()
WHERE status = 'inactive';

-- 查看启用的 Embedding 模型数量
SELECT
    status,
    COUNT(*) as count,
    string_agg(model_id, ', ') as models
FROM unla_embedding_models
GROUP BY status;

-- 2. 启用所有 Rerank 模型
UPDATE unla_rerank_models
SET status = 'active',
    updated_at = NOW()
WHERE status = 'inactive';

-- 查看启用的 Rerank 模型数量
SELECT
    status,
    COUNT(*) as count,
    string_agg(model_id, ', ') as models
FROM unla_rerank_models
GROUP BY status;

-- 3. 确保所有 LLM Providers 都是启用状态
UPDATE llm_providers
SET status = 'active',
    updated_at = NOW()
WHERE status IS NULL OR status != 'active';

-- 查看 LLM Providers 状态
SELECT
    status,
    COUNT(*) as count,
    string_agg(name, ', ') as providers
FROM llm_providers
GROUP BY status;

-- ========================================
-- 验证结果
-- ========================================

-- 显示所有 Embedding 模型
SELECT
    id,
    provider,
    model_id,
    display_name,
    status,
    updated_at
FROM unla_embedding_models
ORDER BY id;

-- 显示所有 Rerank 模型
SELECT
    id,
    provider,
    model_id,
    display_name,
    status,
    updated_at
FROM unla_rerank_models
ORDER BY id;

-- 显示所有 LLM Providers
SELECT
    id,
    name,
    type,
    base_url,
    status,
    updated_at
FROM llm_providers
ORDER BY id;

-- ========================================
-- 完成
-- ========================================
\echo '✅ 所有模型已启用！'
