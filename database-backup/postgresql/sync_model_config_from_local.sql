-- ========================================
-- 同步测试服务器的模型配置到与本地一致
-- 执行时间: 2025-10-28
-- ========================================

-- 1. Embedding 模型配置（与本地一致）
-- 首先将所有设为 inactive
UPDATE unla_embedding_models
SET status = 'inactive', updated_at = NOW();

-- 只启用本地启用的模型
UPDATE unla_embedding_models
SET status = 'active', updated_at = NOW()
WHERE id IN (7, 8);  -- Qwen3-Embedding-8B, Qwen3-Embedding-0.6B

-- 验证 Embedding 模型
SELECT
    id,
    provider,
    model_id,
    status
FROM unla_embedding_models
ORDER BY id;

-- 2. Rerank 模型配置（与本地一致）
-- 首先将所有设为 inactive
UPDATE unla_rerank_models
SET status = 'inactive', updated_at = NOW();

-- 只启用本地启用的模型
UPDATE unla_rerank_models
SET status = 'active', updated_at = NOW()
WHERE id IN (4, 5, 6);  -- Qwen3-Reranker-0.6B, Qwen3-Reranker-4B, Qwen3-Reranker-8B

-- 验证 Rerank 模型
SELECT
    id,
    provider,
    model_id,
    status
FROM unla_rerank_models
ORDER BY id;

-- 3. LLM Providers（本地全部 active）
UPDATE llm_providers
SET status = 'active', updated_at = NOW();

-- 验证 LLM Providers
SELECT
    COUNT(*) as total_providers,
    COUNT(CASE WHEN status = 'active' THEN 1 END) as active_count
FROM llm_providers;

-- ========================================
-- 最终验证
-- ========================================

\echo '=== Embedding Models Status ==='
SELECT
    status,
    COUNT(*) as count,
    string_agg(model_id, ', ' ORDER BY id) as models
FROM unla_embedding_models
GROUP BY status
ORDER BY status DESC;

\echo ''
\echo '=== Rerank Models Status ==='
SELECT
    status,
    COUNT(*) as count,
    string_agg(model_id, ', ' ORDER BY id) as models
FROM unla_rerank_models
GROUP BY status
ORDER BY status DESC;

\echo ''
\echo '=== Summary ==='
SELECT
    'Embedding' as model_type,
    COUNT(CASE WHEN status = 'active' THEN 1 END) as active,
    COUNT(CASE WHEN status = 'inactive' THEN 1 END) as inactive
FROM unla_embedding_models
UNION ALL
SELECT
    'Rerank' as model_type,
    COUNT(CASE WHEN status = 'active' THEN 1 END) as active,
    COUNT(CASE WHEN status = 'inactive' THEN 1 END) as inactive
FROM unla_rerank_models
UNION ALL
SELECT
    'LLM Provider' as model_type,
    COUNT(CASE WHEN status = 'active' THEN 1 END) as active,
    COUNT(CASE WHEN status != 'active' THEN 1 END) as inactive
FROM llm_providers;

\echo ''
\echo '✅ 模型配置已同步到与本地一致！'
