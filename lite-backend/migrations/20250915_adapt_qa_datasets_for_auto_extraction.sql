-- 适配QA数据集表结构以支持自动提取功能
-- 保持原有字段结构，添加自动提取相关字段

-- 1. 为qa_datasets表添加自动提取支持字段
ALTER TABLE qa_datasets 
ADD COLUMN IF NOT EXISTS data_source_type VARCHAR(20) DEFAULT 'manual_upload' CHECK (data_source_type IN ('manual_upload', 'auto_extraction')),
ADD COLUMN IF NOT EXISTS source_document_id VARCHAR(50) REFERENCES knowledge_documents(id),
ADD COLUMN IF NOT EXISTS extraction_task_id UUID REFERENCES qa_extraction_queue(id),
ADD COLUMN IF NOT EXISTS extraction_config JSONB,
ADD COLUMN IF NOT EXISTS extraction_method VARCHAR(50) DEFAULT 'GC-QA-RAG',
ADD COLUMN IF NOT EXISTS extraction_model VARCHAR(100),
ADD COLUMN IF NOT EXISTS extraction_started_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS extraction_completed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS extraction_duration_seconds INTEGER,
ADD COLUMN IF NOT EXISTS extraction_error_message TEXT;

-- 2. 为qa_pairs表添加自动提取支持字段  
ALTER TABLE qa_pairs
ADD COLUMN IF NOT EXISTS data_source_type VARCHAR(20) DEFAULT 'manual_upload' CHECK (data_source_type IN ('manual_upload', 'auto_extraction')),
ADD COLUMN IF NOT EXISTS source_document_id VARCHAR(50) REFERENCES knowledge_documents(id),
ADD COLUMN IF NOT EXISTS extraction_task_id UUID REFERENCES qa_extraction_queue(id),
ADD COLUMN IF NOT EXISTS source_chunk TEXT,
ADD COLUMN IF NOT EXISTS summary TEXT,
ADD COLUMN IF NOT EXISTS chunk_index INTEGER,
ADD COLUMN IF NOT EXISTS extraction_confidence REAL,
ADD COLUMN IF NOT EXISTS extraction_method VARCHAR(50) DEFAULT 'GC-QA-RAG';

-- 3. 更新qa_datasets表的字段，使其适应自动提取场景
-- file_path字段对于自动提取可以为空，存储虚拟路径
ALTER TABLE qa_datasets 
ALTER COLUMN file_path DROP NOT NULL;

-- file_name字段对于自动提取使用生成的名称
ALTER TABLE qa_datasets 
ALTER COLUMN file_name DROP NOT NULL;

-- 4. 添加新的索引以支持自动提取查询
CREATE INDEX IF NOT EXISTS idx_qa_datasets_data_source_type 
ON qa_datasets(data_source_type);

CREATE INDEX IF NOT EXISTS idx_qa_datasets_source_document_id 
ON qa_datasets(source_document_id);

CREATE INDEX IF NOT EXISTS idx_qa_datasets_extraction_task_id 
ON qa_datasets(extraction_task_id);

CREATE INDEX IF NOT EXISTS idx_qa_pairs_data_source_type 
ON qa_pairs(data_source_type);

CREATE INDEX IF NOT EXISTS idx_qa_pairs_source_document_id 
ON qa_pairs(source_document_id);

CREATE INDEX IF NOT EXISTS idx_qa_pairs_extraction_task_id 
ON qa_pairs(extraction_task_id);

-- 5. 为qa_extraction_queue表添加目标数据集关联
ALTER TABLE qa_extraction_queue 
ADD COLUMN IF NOT EXISTS target_dataset_id UUID REFERENCES qa_datasets(id),
ADD COLUMN IF NOT EXISTS qa_pairs_extracted INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS extraction_method VARCHAR(50) DEFAULT 'GC-QA-RAG',
ADD COLUMN IF NOT EXISTS extraction_model VARCHAR(100);

CREATE INDEX IF NOT EXISTS idx_qa_extraction_queue_target_dataset_id 
ON qa_extraction_queue(target_dataset_id);

-- 6. 创建视图：统一QA数据集查询（包含自动提取信息）
CREATE OR REPLACE VIEW enhanced_qa_datasets_view AS
SELECT 
    qd.id,
    qd.title,
    qd.description,
    qd.category,
    qd.file_name,
    qd.file_path,
    qd.file_size,
    qd.status,
    qd.vectorization_status,
    qd.total_qa_pairs,
    qd.processed_qa_pairs,
    qd.categories_count,
    qd.vector_model,
    qd.dataset_metadata,
    qd.processing_logs,
    qd.collection_id,
    qd.created_at,
    qd.updated_at,
    qd.processed_at,
    
    -- 自动提取相关字段
    qd.data_source_type,
    qd.source_document_id,
    qd.extraction_task_id,
    qd.extraction_config,
    qd.extraction_method,
    qd.extraction_model,
    qd.extraction_started_at,
    qd.extraction_completed_at,
    qd.extraction_duration_seconds,
    qd.extraction_error_message,
    
    -- 关联文档信息
    kd.title as source_document_title,
    kd.filename as source_document_filename,
    kd.file_type as source_document_type,
    
    -- 提取任务状态
    qeq.status as extraction_task_status,
    qeq.priority as extraction_priority,
    qeq.retry_count as extraction_retry_count,
    
    -- 计算字段
    CASE 
        WHEN qd.extraction_started_at IS NOT NULL AND qd.extraction_completed_at IS NOT NULL 
        THEN EXTRACT(EPOCH FROM (qd.extraction_completed_at - qd.extraction_started_at))::INTEGER 
        ELSE qd.extraction_duration_seconds 
    END as calculated_duration_seconds,
    
    CASE 
        WHEN qd.data_source_type = 'auto_extraction' THEN 
            COALESCE(qd.title, CONCAT(kd.title, '_', TO_CHAR(qd.created_at, 'YYYYMMDD_HH24MISS'), '_qa'))
        ELSE qd.title 
    END as display_title

FROM qa_datasets qd
LEFT JOIN knowledge_documents kd ON qd.source_document_id = kd.id
LEFT JOIN qa_extraction_queue qeq ON qd.extraction_task_id = qeq.id
ORDER BY qd.created_at DESC;

-- 7. 创建视图：统一QA对查询（包含自动提取信息）
CREATE OR REPLACE VIEW enhanced_qa_pairs_view AS
SELECT 
    qp.id,
    qp.dataset_id,
    qp.category_id,
    qp.question,
    qp.answer,
    qp.question_hash,
    qp.answer_hash,
    qp.metadata,
    qp.tags,
    qp.confidence_score,
    qp.difficulty_level,
    qp.source_line_number,
    qp.qa_type,
    qp.language,
    qp.vectorized,
    qp.vector_status,
    qp.quality_score,
    qp.is_validated,
    qp.validation_notes,
    qp.usage_count,
    qp.last_used_at,
    qp.qa_metadata,
    qp.created_at,
    qp.updated_at,
    
    -- 自动提取相关字段
    qp.data_source_type,
    qp.source_document_id,
    qp.extraction_task_id,
    qp.source_chunk,
    qp.summary,
    qp.chunk_index,
    qp.extraction_confidence,
    qp.extraction_method,
    
    -- 关联信息
    qd.title as dataset_title,
    qd.data_source_type as dataset_source_type,
    kd.title as source_document_title,
    kd.filename as source_document_filename
    
FROM qa_pairs qp
LEFT JOIN qa_datasets qd ON qp.dataset_id = qd.id
LEFT JOIN knowledge_documents kd ON qp.source_document_id = kd.id
ORDER BY qp.created_at DESC;

-- 8. 创建函数：自动生成QA数据集标题
CREATE OR REPLACE FUNCTION generate_qa_dataset_title(
    document_title TEXT,
    extraction_time TIMESTAMP WITH TIME ZONE DEFAULT NOW()
) RETURNS TEXT AS $$
BEGIN
    RETURN CONCAT(
        COALESCE(document_title, 'unknown_document'),
        '_',
        TO_CHAR(extraction_time, 'YYYYMMDD_HH24MISS'),
        '_qa'
    );
END;
$$ LANGUAGE plpgsql;

-- 9. 创建函数：自动生成QA数据集文件名
CREATE OR REPLACE FUNCTION generate_qa_dataset_filename(
    document_filename TEXT,
    extraction_time TIMESTAMP WITH TIME ZONE DEFAULT NOW()
) RETURNS TEXT AS $$
DECLARE
    base_name TEXT;
    extension TEXT;
BEGIN
    -- 提取文件名和扩展名
    base_name := regexp_replace(COALESCE(document_filename, 'unknown'), '\.[^.]*$', '');
    extension := '.json'; -- 自动提取的QA数据集使用JSON格式
    
    RETURN CONCAT(
        base_name,
        '_',
        TO_CHAR(extraction_time, 'YYYYMMDD_HH24MISS'),
        '_qa',
        extension
    );
END;
$$ LANGUAGE plpgsql;

-- 10. 更新现有数据的data_source_type
UPDATE qa_datasets 
SET data_source_type = 'manual_upload' 
WHERE data_source_type IS NULL;

UPDATE qa_pairs 
SET data_source_type = 'manual_upload' 
WHERE data_source_type IS NULL;

-- 11. 添加注释
COMMENT ON COLUMN qa_datasets.data_source_type IS '数据来源类型: manual_upload(手动上传) 或 auto_extraction(自动提取)';
COMMENT ON COLUMN qa_datasets.source_document_id IS '源文档ID (仅用于自动提取)';
COMMENT ON COLUMN qa_datasets.extraction_task_id IS '关联的提取任务ID';
COMMENT ON COLUMN qa_datasets.extraction_config IS '提取配置参数';
COMMENT ON COLUMN qa_datasets.extraction_method IS '提取方法 (如 GC-QA-RAG)';
COMMENT ON COLUMN qa_datasets.extraction_model IS '使用的模型名称';

COMMENT ON COLUMN qa_pairs.data_source_type IS '数据来源类型: manual_upload(手动上传) 或 auto_extraction(自动提取)';
COMMENT ON COLUMN qa_pairs.source_document_id IS '源文档ID (仅用于自动提取)';
COMMENT ON COLUMN qa_pairs.extraction_task_id IS '关联的提取任务ID';
COMMENT ON COLUMN qa_pairs.source_chunk IS '源文档块内容';
COMMENT ON COLUMN qa_pairs.summary IS 'QA对的摘要';
COMMENT ON COLUMN qa_pairs.chunk_index IS '在源文档中的块索引';
COMMENT ON COLUMN qa_pairs.extraction_confidence IS '提取置信度 (0-1)';

COMMENT ON VIEW enhanced_qa_datasets_view IS '增强的QA数据集视图，支持手动上传和自动提取的统一展示';
COMMENT ON VIEW enhanced_qa_pairs_view IS '增强的QA对视图，支持手动上传和自动提取的统一展示';

COMMENT ON FUNCTION generate_qa_dataset_title(TEXT, TIMESTAMP WITH TIME ZONE) IS '为自动提取的QA数据集生成标题';
COMMENT ON FUNCTION generate_qa_dataset_filename(TEXT, TIMESTAMP WITH TIME ZONE) IS '为自动提取的QA数据集生成文件名';