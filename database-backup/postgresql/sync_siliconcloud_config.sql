-- ========================================
-- 同步 siliconCloud 完整配置到测试服务器
-- 执行时间: 2025-10-28
-- ========================================

-- 重要说明：
-- 本地数据库中 siliconcloud 的最新配置
-- API Key: sk-abpjgaflfhrqthzitxyuifuxqjdtdrbwuspbuwzunlzofhlj
-- 这个脚本将完整同步 siliconcloud 的所有配置

\echo '=== 开始同步 siliconCloud 配置 ==='
\echo ''

-- 1. 更新 llm_providers 表中的 siliconcloud 配置
\echo '[1/3] 更新 LLM Provider 配置...'

UPDATE llm_providers
SET
    type = 'siliconcloud',
    base_url = 'https://api.siliconflow.cn/v1',
    api_key_enc = 'sk-abpjgaflfhrqthzitxyuifuxqjdtdrbwuspbuwzunlzofhlj',
    extra_hdrs = '',
    status = 'active',
    updated_at = NOW()
WHERE name = 'siliconcloud';

-- 验证更新
SELECT
    id,
    name,
    type,
    base_url,
    LEFT(api_key_enc, 10) || '...' as api_key_preview,
    status,
    updated_at
FROM llm_providers
WHERE name = 'siliconcloud';

\echo ''
\echo '[2/3] 同步 Embedding 模型配置...'

-- 2. 同步 Embedding 模型配置
-- 首先将所有 siliconcloud 的 embedding 模型设为 inactive
UPDATE unla_embedding_models
SET status = 'inactive', updated_at = NOW()
WHERE provider = 'siliconcloud';

-- 只启用本地启用的两个模型
UPDATE unla_embedding_models
SET status = 'active', updated_at = NOW()
WHERE provider = 'siliconcloud'
  AND model_id IN ('Qwen/Qwen3-Embedding-8B', 'Qwen/Qwen3-Embedding-0.6B');

-- 验证 Embedding 模型
SELECT
    id,
    provider,
    model_id,
    display_name,
    status
FROM unla_embedding_models
WHERE provider = 'siliconcloud'
ORDER BY id;

\echo ''
\echo '[3/3] 同步 Rerank 模型配置...'

-- 3. 同步 Rerank 模型配置
-- 首先将所有 siliconcloud 的 rerank 模型设为 inactive
UPDATE unla_rerank_models
SET status = 'inactive', updated_at = NOW()
WHERE provider = 'siliconcloud';

-- 只启用本地启用的模型
UPDATE unla_rerank_models
SET status = 'active', updated_at = NOW()
WHERE provider = 'siliconcloud'
  AND model_id IN ('Qwen/Qwen3-Reranker-0.6B', 'Qwen/Qwen3-Reranker-4B', 'Qwen/Qwen3-Reranker-8B');

-- 验证 Rerank 模型
SELECT
    id,
    provider,
    model_id,
    status
FROM unla_rerank_models
WHERE provider = 'siliconcloud'
ORDER BY id;

-- ========================================
-- 最终验证
-- ========================================

\echo ''
\echo '=== siliconCloud 配置同步完成 ==='
\echo ''
\echo '配置详情:'
\echo '---------'

SELECT
    'LLM Provider' as config_type,
    name as provider,
    base_url,
    LEFT(api_key_enc, 15) || '...' as api_key,
    status
FROM llm_providers
WHERE name = 'siliconcloud'
UNION ALL
SELECT
    'Embedding Model' as config_type,
    provider,
    model_id as base_url,
    status as api_key,
    status
FROM unla_embedding_models
WHERE provider = 'siliconcloud' AND status = 'active'
UNION ALL
SELECT
    'Rerank Model' as config_type,
    provider,
    model_id as base_url,
    status as api_key,
    status
FROM unla_rerank_models
WHERE provider = 'siliconcloud' AND status = 'active';

\echo ''
\echo '✅ siliconCloud 完整配置已同步！'
\echo ''
\echo '下一步：在测试服务器 Unla Web 中验证'
\echo '1. 访问: http://8.136.49.11:8000/api-gateway/model'
\echo '2. 查看 LLM 厂商列表，siliconCloud 应显示为已启用'
\echo '3. 检查 Embedding 和 Rerank 模型配置'
