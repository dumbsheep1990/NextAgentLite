-- 为知识库集合表添加向量化文档数量统计字段
ALTER TABLE knowledge_collections 
ADD COLUMN IF NOT EXISTS vectorized_count INTEGER DEFAULT 0;

-- 创建索引以提升查询性能
CREATE INDEX IF NOT EXISTS idx_collections_vectorized_count 
ON knowledge_collections(vectorized_count);

-- 更新现有数据：统计每个知识库中已向量化的文档数量
UPDATE knowledge_collections kc
SET vectorized_count = (
    SELECT COUNT(*)
    FROM knowledge_documents kd
    WHERE kd.collection_id = kc.id
    AND kd.status IN ('vectorized', 'completed')  -- 兼容两种状态
);

-- 添加注释
COMMENT ON COLUMN knowledge_collections.vectorized_count IS '已向量化的文档数量';