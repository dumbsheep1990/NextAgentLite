-- QA数据结构统一迁移
-- 统一自动提取QA与知识库QA数据集的存储结构

-- 1. 为qa_datasets表添加自动提取相关字段
ALTER TABLE qa_datasets 
ADD COLUMN IF NOT EXISTS auto_generated BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS source_document_id VARCHAR(50) REFERENCES knowledge_documents(id),
ADD COLUMN IF NOT EXISTS extraction_task_id UUID REFERENCES qa_extraction_queue(id),
ADD COLUMN IF NOT EXISTS extraction_config JSONB,
ADD COLUMN IF NOT EXISTS extraction_started_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS extraction_completed_at TIMESTAMP WITH TIME ZONE;

-- 2. 为qa_pairs表添加自动提取相关字段
ALTER TABLE qa_pairs 
ADD COLUMN IF NOT EXISTS auto_generated BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS source_document_id VARCHAR(50) REFERENCES knowledge_documents(id),
ADD COLUMN IF NOT EXISTS extraction_task_id UUID REFERENCES qa_extraction_queue(id),
ADD COLUMN IF NOT EXISTS source_chunk TEXT,
ADD COLUMN IF NOT EXISTS summary TEXT;

-- 3. 创建qa_datasets和qa_extraction_queue的关联索引
CREATE INDEX IF NOT EXISTS idx_qa_datasets_extraction_task_id 
ON qa_datasets(extraction_task_id);

CREATE INDEX IF NOT EXISTS idx_qa_datasets_source_document_id 
ON qa_datasets(source_document_id);

CREATE INDEX IF NOT EXISTS idx_qa_pairs_extraction_task_id 
ON qa_pairs(extraction_task_id);

CREATE INDEX IF NOT EXISTS idx_qa_pairs_source_document_id 
ON qa_pairs(source_document_id);

CREATE INDEX IF NOT EXISTS idx_qa_pairs_auto_generated 
ON qa_pairs(auto_generated);

CREATE INDEX IF NOT EXISTS idx_qa_datasets_auto_generated 
ON qa_datasets(auto_generated);

-- 4. 为qa_extraction_queue表添加目标数据集ID字段
ALTER TABLE qa_extraction_queue 
ADD COLUMN IF NOT EXISTS target_dataset_id UUID REFERENCES qa_datasets(id);

CREATE INDEX IF NOT EXISTS idx_qa_extraction_queue_target_dataset_id 
ON qa_extraction_queue(target_dataset_id);

-- 5. 创建数据迁移函数：将generated_qa_pairs数据迁移到qa_pairs
CREATE OR REPLACE FUNCTION migrate_generated_qa_to_qa_pairs()
RETURNS INTEGER AS $$
DECLARE
    migrated_count INTEGER := 0;
    qa_record RECORD;
    new_dataset_id UUID;
    new_qa_pair_id UUID;
BEGIN
    -- 为每个task_id创建对应的qa_dataset
    FOR qa_record IN 
        SELECT DISTINCT task_id, 
               (SELECT document_id FROM qa_generation_tasks WHERE id = task_id) as document_id
        FROM generated_qa_pairs 
        WHERE task_id IS NOT NULL
    LOOP
        -- 创建qa_dataset记录
        INSERT INTO qa_datasets (
            id, title, description, file_path, file_name, status, 
            auto_generated, source_document_id, 
            created_at, updated_at
        ) VALUES (
            gen_random_uuid(),
            CONCAT('自动提取-任务', qa_record.task_id),
            CONCAT('从文档', qa_record.document_id, '自动提取的QA数据集'),
            'auto_generated',
            CONCAT('auto_qa_task_', qa_record.task_id, '.json'),
            'completed',
            TRUE,
            qa_record.document_id,
            NOW(),
            NOW()
        ) RETURNING id INTO new_dataset_id;
        
        -- 迁移该task的所有qa_pairs
        INSERT INTO qa_pairs (
            id, dataset_id, question, answer, summary, source_chunk,
            metadata, auto_generated, source_document_id,
            created_at, updated_at
        )
        SELECT 
            gen_random_uuid(),
            new_dataset_id,
            question,
            answer,
            summary,
            source_chunk,
            metadata,
            TRUE,
            qa_record.document_id,
            created_at,
            NOW()
        FROM generated_qa_pairs 
        WHERE task_id = qa_record.task_id;
        
        GET DIAGNOSTICS migrated_count = ROW_COUNT;
        
        -- 更新qa_datasets的qa对数量
        UPDATE qa_datasets 
        SET total_qa_pairs = migrated_count,
            processed_qa_pairs = migrated_count
        WHERE id = new_dataset_id;
        
    END LOOP;
    
    RETURN migrated_count;
END;
$$ LANGUAGE plpgsql;

-- 6. 创建视图：统一QA数据集查询
CREATE OR REPLACE VIEW unified_qa_datasets_view AS
SELECT 
    qd.id,
    qd.title,
    qd.description,
    qd.file_name,
    qd.status,
    qd.total_qa_pairs,
    qd.processed_qa_pairs,
    qd.auto_generated,
    qd.source_document_id,
    qd.extraction_task_id,
    qd.collection_id,
    qd.created_at,
    qd.updated_at,
    kd.title as source_document_title,
    kd.filename as source_document_filename,
    CASE 
        WHEN qd.auto_generated = TRUE THEN 'auto_extraction'
        ELSE 'manual_upload'
    END as data_source_type
FROM qa_datasets qd
LEFT JOIN knowledge_documents kd ON qd.source_document_id = kd.id
ORDER BY qd.created_at DESC;

-- 7. 创建视图：统一QA对查询
CREATE OR REPLACE VIEW unified_qa_pairs_view AS
SELECT 
    qp.id,
    qp.dataset_id,
    qp.question,
    qp.answer,
    qp.summary,
    qp.source_chunk,
    qp.metadata,
    qp.auto_generated,
    qp.source_document_id,
    qp.extraction_task_id,
    qp.confidence_score,
    qp.quality_score,
    qp.vectorized,
    qp.created_at,
    qp.updated_at,
    qd.title as dataset_title,
    kd.title as source_document_title,
    CASE 
        WHEN qp.auto_generated = TRUE THEN 'auto_extraction'
        ELSE 'manual_upload'
    END as data_source_type
FROM qa_pairs qp
LEFT JOIN qa_datasets qd ON qp.dataset_id = qd.id
LEFT JOIN knowledge_documents kd ON qp.source_document_id = kd.id
ORDER BY qp.created_at DESC;

-- 8. 添加注释
COMMENT ON COLUMN qa_datasets.auto_generated IS '是否为自动提取生成的数据集';
COMMENT ON COLUMN qa_datasets.source_document_id IS '源文档ID (用于自动提取)';
COMMENT ON COLUMN qa_datasets.extraction_task_id IS '关联的提取任务ID';

COMMENT ON COLUMN qa_pairs.auto_generated IS '是否为自动提取生成的QA对';
COMMENT ON COLUMN qa_pairs.source_document_id IS '源文档ID (用于自动提取)';
COMMENT ON COLUMN qa_pairs.extraction_task_id IS '关联的提取任务ID';

COMMENT ON VIEW unified_qa_datasets_view IS '统一QA数据集视图，包含手动上传和自动提取的数据集';
COMMENT ON VIEW unified_qa_pairs_view IS '统一QA对视图，包含手动上传和自动提取的QA对';