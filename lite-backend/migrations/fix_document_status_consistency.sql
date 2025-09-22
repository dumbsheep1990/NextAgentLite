-- 修复文档状态一致性问题
-- 将所有 completed 状态统一改为 vectorized

-- 1. 更新 knowledge_documents 表中的状态
UPDATE knowledge_documents 
SET status = 'vectorized',
    updated_at = CURRENT_TIMESTAMP
WHERE status = 'completed';

-- 2. 输出更新结果
DO $$
DECLARE
    updated_count INTEGER;
BEGIN
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    RAISE NOTICE '已更新 % 个文档的状态从 completed 改为 vectorized', updated_count;
END $$;

-- 3. 查看当前状态分布
SELECT 
    status,
    COUNT(*) as count,
    ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
FROM knowledge_documents
GROUP BY status
ORDER BY count DESC;

-- 4. 检查向量化状态字段 (如果存在)
SELECT 
    CASE 
        WHEN vector_status::jsonb->>'status' = 'completed' THEN 'completed'
        WHEN vector_status::jsonb->>'status' = 'vectorized' THEN 'vectorized'
        WHEN vector_status IS NULL THEN 'null'
        ELSE vector_status::jsonb->>'status'
    END as vector_status,
    COUNT(*) as count
FROM knowledge_documents
GROUP BY vector_status::jsonb->>'status';

-- 5. 更新 vector_status 字段中的 completed 为 vectorized
UPDATE knowledge_documents
SET vector_status = jsonb_set(
    vector_status::jsonb,
    '{status}',
    '"vectorized"'::jsonb
)
WHERE vector_status::jsonb->>'status' = 'completed';

-- 6. 添加约束确保未来一致性（可选）
-- 注意：这会强制所有新记录使用标准状态值
ALTER TABLE knowledge_documents 
ADD CONSTRAINT check_valid_status 
CHECK (status IN ('pending', 'processing', 'vectorized', 'failed', 'graph_extracted'));