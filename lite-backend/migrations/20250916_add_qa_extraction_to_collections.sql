-- 为knowledge_collections表添加QA提取相关字段
-- 修复问答对提取开关功能

BEGIN;

-- 1. 为knowledge_collections表添加QA提取相关字段
ALTER TABLE knowledge_collections 
ADD COLUMN IF NOT EXISTS auto_qa_extraction_enabled BOOLEAN DEFAULT FALSE COMMENT '是否启用自动QA提取',
ADD COLUMN IF NOT EXISTS qa_extraction_config JSONB COMMENT 'QA提取配置参数',
ADD COLUMN IF NOT EXISTS qa_extraction_last_run TIMESTAMP COMMENT '最后执行QA提取的时间',
ADD COLUMN IF NOT EXISTS qa_extraction_total_pairs INTEGER DEFAULT 0 COMMENT '该知识库总共提取的QA对数量';

-- 2. 为新字段添加索引
CREATE INDEX IF NOT EXISTS idx_knowledge_collections_qa_extraction_enabled 
ON knowledge_collections(auto_qa_extraction_enabled) WHERE auto_qa_extraction_enabled = TRUE;

-- 3. 为新字段添加注释
COMMENT ON COLUMN knowledge_collections.auto_qa_extraction_enabled IS '知识库是否启用自动QA提取功能';
COMMENT ON COLUMN knowledge_collections.qa_extraction_config IS 'QA提取配置参数，包含模型、参数等';
COMMENT ON COLUMN knowledge_collections.qa_extraction_last_run IS '最后一次执行QA提取的时间';
COMMENT ON COLUMN knowledge_collections.qa_extraction_total_pairs IS '该知识库累计提取的QA对总数';

-- 4. 更新现有记录的默认值
UPDATE knowledge_collections 
SET auto_qa_extraction_enabled = FALSE,
    qa_extraction_total_pairs = 0
WHERE auto_qa_extraction_enabled IS NULL;

COMMIT;

-- 验证字段是否添加成功
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'knowledge_collections' 
    AND column_name IN ('auto_qa_extraction_enabled', 'qa_extraction_config', 'qa_extraction_last_run', 'qa_extraction_total_pairs')
ORDER BY column_name;