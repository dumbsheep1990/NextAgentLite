-- 增强QA提取系统的数据库迁移
-- 支持文档上传时自动QA提取和独立队列管理

BEGIN;

-- 1. 在knowledge_documents表中添加自动QA提取相关字段
ALTER TABLE knowledge_documents 
ADD COLUMN IF NOT EXISTS auto_qa_extraction_enabled BOOLEAN DEFAULT FALSE COMMENT '是否启用自动QA提取',
ADD COLUMN IF NOT EXISTS qa_extraction_status VARCHAR(50) DEFAULT 'not_started' COMMENT 'QA提取状态: not_started, pending, processing, completed, failed',
ADD COLUMN IF NOT EXISTS qa_extraction_task_id INTEGER COMMENT '关联的QA提取任务ID',
ADD COLUMN IF NOT EXISTS qa_dataset_id UUID COMMENT '自动生成的QA数据集ID',
ADD COLUMN IF NOT EXISTS qa_extraction_config JSONB COMMENT 'QA提取配置参数',
ADD COLUMN IF NOT EXISTS qa_extraction_started_at TIMESTAMP COMMENT 'QA提取开始时间',
ADD COLUMN IF NOT EXISTS qa_extraction_completed_at TIMESTAMP COMMENT 'QA提取完成时间',
ADD COLUMN IF NOT EXISTS qa_extraction_error_message TEXT COMMENT 'QA提取错误信息';

-- 2. 增强qa_generation_tasks表
ALTER TABLE qa_generation_tasks
ADD COLUMN IF NOT EXISTS source_type VARCHAR(50) DEFAULT 'manual' COMMENT '任务来源类型: manual, auto_upload, batch',
ADD COLUMN IF NOT EXISTS source_document_path VARCHAR(500) COMMENT '源文档路径',
ADD COLUMN IF NOT EXISTS source_collection_id VARCHAR(255) COMMENT '源知识库集合ID',
ADD COLUMN IF NOT EXISTS auto_create_dataset BOOLEAN DEFAULT FALSE COMMENT '是否自动创建QA数据集',
ADD COLUMN IF NOT EXISTS dataset_name_pattern VARCHAR(255) COMMENT 'QA数据集命名模式',
ADD COLUMN IF NOT EXISTS queue_priority INTEGER DEFAULT 5 COMMENT '队列优先级(1-10, 10最高)',
ADD COLUMN IF NOT EXISTS queue_worker_id VARCHAR(100) COMMENT '处理该任务的工作进程ID',
ADD COLUMN IF NOT EXISTS processing_config JSONB COMMENT '处理配置参数',
ADD COLUMN IF NOT EXISTS result_summary JSONB COMMENT '处理结果摘要',
ADD COLUMN IF NOT EXISTS retry_count INTEGER DEFAULT 0 COMMENT '重试次数',
ADD COLUMN IF NOT EXISTS max_retries INTEGER DEFAULT 3 COMMENT '最大重试次数';

-- 3. 增强qa_datasets表，添加自动生成相关字段
ALTER TABLE qa_datasets
ADD COLUMN IF NOT EXISTS source_document_id VARCHAR(255) COMMENT '源文档ID',
ADD COLUMN IF NOT EXISTS source_document_title VARCHAR(500) COMMENT '源文档标题', 
ADD COLUMN IF NOT EXISTS auto_generated BOOLEAN DEFAULT FALSE COMMENT '是否自动生成',
ADD COLUMN IF NOT EXISTS generation_task_id INTEGER COMMENT '生成任务ID',
ADD COLUMN IF NOT EXISTS naming_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '命名时间戳',
ADD COLUMN IF NOT EXISTS sync_status VARCHAR(50) DEFAULT 'pending' COMMENT '同步状态: pending, syncing, synced, failed',
ADD COLUMN IF NOT EXISTS sync_error_message TEXT COMMENT '同步错误信息',
ADD COLUMN IF NOT EXISTS sync_last_attempt TIMESTAMP COMMENT '最后同步尝试时间';

-- 4. 增强generated_qa_pairs表，添加数据集同步字段
ALTER TABLE generated_qa_pairs
ADD COLUMN IF NOT EXISTS synced_to_dataset BOOLEAN DEFAULT FALSE COMMENT '是否已同步到QA数据集',
ADD COLUMN IF NOT EXISTS target_dataset_id UUID COMMENT '目标QA数据集ID',
ADD COLUMN IF NOT EXISTS target_qa_pair_id UUID COMMENT '目标QA对ID',
ADD COLUMN IF NOT EXISTS sync_status VARCHAR(50) DEFAULT 'pending' COMMENT '同步状态',
ADD COLUMN IF NOT EXISTS sync_error_message TEXT COMMENT '同步错误信息',
ADD COLUMN IF NOT EXISTS sync_timestamp TIMESTAMP COMMENT '同步时间戳';

-- 5. 创建QA提取队列管理表
CREATE TABLE IF NOT EXISTS qa_extraction_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_type VARCHAR(50) NOT NULL DEFAULT 'qa_extraction' COMMENT '任务类型',
    document_id VARCHAR(255) NOT NULL COMMENT '文档ID',
    document_title VARCHAR(500) COMMENT '文档标题',
    collection_id VARCHAR(255) COMMENT '知识库集合ID',
    priority INTEGER DEFAULT 5 COMMENT '优先级(1-10, 10最高)',
    status VARCHAR(50) DEFAULT 'pending' COMMENT '状态: pending, processing, completed, failed, cancelled',
    
    -- 配置信息
    extraction_config JSONB COMMENT 'QA提取配置',
    auto_create_dataset BOOLEAN DEFAULT TRUE COMMENT '自动创建数据集',
    dataset_naming_pattern VARCHAR(255) COMMENT '数据集命名模式',
    
    -- 执行信息
    worker_id VARCHAR(100) COMMENT '工作进程ID',
    retry_count INTEGER DEFAULT 0 COMMENT '重试次数',
    max_retries INTEGER DEFAULT 3 COMMENT '最大重试次数',
    
    -- 关联信息
    qa_generation_task_id INTEGER COMMENT '关联的QA生成任务ID',
    target_dataset_id UUID COMMENT '目标QA数据集ID',
    
    -- 结果信息
    qa_pairs_generated INTEGER DEFAULT 0 COMMENT '生成的QA对数量',
    processing_duration INTEGER COMMENT '处理耗时(秒)',
    error_message TEXT COMMENT '错误信息',
    result_summary JSONB COMMENT '处理结果摘要',
    
    -- 时间戳
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    scheduled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '计划执行时间',
    started_at TIMESTAMP COMMENT '开始执行时间',
    completed_at TIMESTAMP COMMENT '完成时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. 创建QA提取工作进程状态表
CREATE TABLE IF NOT EXISTS qa_extraction_workers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    worker_id VARCHAR(100) UNIQUE NOT NULL COMMENT '工作进程唯一标识',
    worker_name VARCHAR(200) COMMENT '工作进程名称',
    status VARCHAR(50) DEFAULT 'idle' COMMENT '状态: idle, busy, offline, error',
    
    -- 能力配置
    max_concurrent_tasks INTEGER DEFAULT 1 COMMENT '最大并发任务数',
    current_task_count INTEGER DEFAULT 0 COMMENT '当前任务数',
    supported_document_types TEXT[] COMMENT '支持的文档类型',
    
    -- 当前任务信息
    current_task_id UUID COMMENT '当前处理的任务ID',
    current_task_started_at TIMESTAMP COMMENT '当前任务开始时间',
    
    -- 统计信息
    total_tasks_processed INTEGER DEFAULT 0 COMMENT '总处理任务数',
    successful_tasks INTEGER DEFAULT 0 COMMENT '成功任务数',
    failed_tasks INTEGER DEFAULT 0 COMMENT '失败任务数',
    avg_processing_time REAL COMMENT '平均处理时间(秒)',
    
    -- 健康状态
    last_heartbeat TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '最后心跳时间',
    last_error_message TEXT COMMENT '最后错误信息',
    error_count INTEGER DEFAULT 0 COMMENT '错误次数',
    
    -- 时间戳
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. 创建索引优化查询性能
CREATE INDEX IF NOT EXISTS idx_knowledge_documents_qa_extraction_status 
ON knowledge_documents(qa_extraction_status) WHERE qa_extraction_status IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_knowledge_documents_auto_qa_enabled 
ON knowledge_documents(auto_qa_extraction_enabled) WHERE auto_qa_extraction_enabled = TRUE;

CREATE INDEX IF NOT EXISTS idx_qa_generation_tasks_source_type 
ON qa_generation_tasks(source_type);

CREATE INDEX IF NOT EXISTS idx_qa_generation_tasks_queue_priority 
ON qa_generation_tasks(queue_priority DESC, created_at ASC);

CREATE INDEX IF NOT EXISTS idx_qa_extraction_queue_status_priority 
ON qa_extraction_queue(status, priority DESC, created_at ASC);

CREATE INDEX IF NOT EXISTS idx_qa_extraction_queue_document_id 
ON qa_extraction_queue(document_id);

CREATE INDEX IF NOT EXISTS idx_qa_extraction_queue_worker_id 
ON qa_extraction_queue(worker_id) WHERE worker_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_qa_extraction_workers_status 
ON qa_extraction_workers(status);

CREATE INDEX IF NOT EXISTS idx_qa_extraction_workers_heartbeat 
ON qa_extraction_workers(last_heartbeat DESC);

CREATE INDEX IF NOT EXISTS idx_qa_datasets_auto_generated 
ON qa_datasets(auto_generated) WHERE auto_generated = TRUE;

CREATE INDEX IF NOT EXISTS idx_qa_datasets_source_document 
ON qa_datasets(source_document_id) WHERE source_document_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_generated_qa_pairs_sync_status 
ON generated_qa_pairs(sync_status) WHERE sync_status != 'completed';

-- 8. 创建外键约束
ALTER TABLE qa_extraction_queue 
ADD CONSTRAINT fk_qa_extraction_queue_document 
FOREIGN KEY (document_id) REFERENCES knowledge_documents(id) ON DELETE CASCADE;

ALTER TABLE qa_extraction_queue 
ADD CONSTRAINT fk_qa_extraction_queue_task 
FOREIGN KEY (qa_generation_task_id) REFERENCES qa_generation_tasks(id) ON DELETE SET NULL;

ALTER TABLE qa_extraction_queue 
ADD CONSTRAINT fk_qa_extraction_queue_dataset 
FOREIGN KEY (target_dataset_id) REFERENCES qa_datasets(id) ON DELETE SET NULL;

-- 9. 创建更新时间戳的触发器
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_qa_extraction_queue_updated_at 
BEFORE UPDATE ON qa_extraction_queue 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_qa_extraction_workers_updated_at 
BEFORE UPDATE ON qa_extraction_workers 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 10. 插入默认的QA提取工作进程
INSERT INTO qa_extraction_workers (worker_id, worker_name, max_concurrent_tasks, supported_document_types)
VALUES 
('qa-worker-01', 'QA提取工作进程-01', 2, ARRAY['pdf', 'txt', 'docx', 'md']),
('qa-worker-02', 'QA提取工作进程-02', 1, ARRAY['pdf', 'txt', 'docx', 'md'])
ON CONFLICT (worker_id) DO NOTHING;

COMMIT;

-- 添加表注释
COMMENT ON TABLE qa_extraction_queue IS 'QA提取任务队列 - 管理文档的QA提取任务';
COMMENT ON TABLE qa_extraction_workers IS 'QA提取工作进程状态表 - 管理QA提取的工作进程';

-- 添加重要字段注释
COMMENT ON COLUMN knowledge_documents.auto_qa_extraction_enabled IS '文档上传时是否自动启用QA提取';
COMMENT ON COLUMN knowledge_documents.qa_extraction_status IS 'QA提取状态跟踪';
COMMENT ON COLUMN qa_generation_tasks.source_type IS '任务来源: manual(手动), auto_upload(文档上传自动), batch(批量处理)';
COMMENT ON COLUMN qa_datasets.auto_generated IS '标识该数据集是否由文档自动生成';
COMMENT ON COLUMN generated_qa_pairs.synced_to_dataset IS '标识是否已同步到QA数据集表';