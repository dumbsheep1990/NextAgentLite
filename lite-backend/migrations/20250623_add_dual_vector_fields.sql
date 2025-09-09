-- 添加双向量化支持字段
-- Version: 20250623_001
-- Description: Add dual vector fields to document_chunks table

-- 添加双向量化字段到 document_chunks 表
ALTER TABLE document_chunks 
ADD COLUMN IF NOT EXISTS general_embedding JSON,
ADD COLUMN IF NOT EXISTS domain_embedding JSON,
ADD COLUMN IF NOT EXISTS general_model VARCHAR(100),
ADD COLUMN IF NOT EXISTS domain_model VARCHAR(100),
ADD COLUMN IF NOT EXISTS vectorization_strategy VARCHAR(20);

-- 添加索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_document_chunks_vectorization_strategy 
ON document_chunks(vectorization_strategy);

CREATE INDEX IF NOT EXISTS idx_document_chunks_general_model 
ON document_chunks(general_model);

CREATE INDEX IF NOT EXISTS idx_document_chunks_domain_model 
ON document_chunks(domain_model);

-- 更新现有记录的默认值（如果需要）
UPDATE document_chunks 
SET vectorization_strategy = 'general' 
WHERE vectorization_strategy IS NULL AND embedding IS NOT NULL;

-- 添加注释
COMMENT ON COLUMN document_chunks.general_embedding IS '通用向量嵌入 (text-embedding-v4, 1536维)';
COMMENT ON COLUMN document_chunks.domain_embedding IS '领域向量嵌入 (matbert-base-v1, 768维)';
COMMENT ON COLUMN document_chunks.general_model IS '通用向量模型名称';
COMMENT ON COLUMN document_chunks.domain_model IS '领域向量模型名称';
COMMENT ON COLUMN document_chunks.vectorization_strategy IS '向量化策略: dual|general|domain';