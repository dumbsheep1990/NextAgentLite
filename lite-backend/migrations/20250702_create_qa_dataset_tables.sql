-- QA数据集相关表创建
-- 执行时间: 2025-07-02

-- QA数据集表
CREATE TABLE IF NOT EXISTS qa_datasets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    
    -- 文件信息
    file_path VARCHAR(500) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_size INTEGER,
    file_hash VARCHAR(64),
    
    -- 处理状态
    status VARCHAR(20) DEFAULT 'pending',
    
    -- 统计信息
    total_qa_pairs INTEGER DEFAULT 0,
    processed_qa_pairs INTEGER DEFAULT 0,
    categories_count INTEGER DEFAULT 0,
    
    -- 向量化信息
    vectorization_status VARCHAR(20) DEFAULT 'pending',
    vector_model VARCHAR(100),
    
    -- 元数据
    dataset_metadata JSONB,
    processing_logs JSONB,
    
    -- 时间戳
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP WITH TIME ZONE
);

-- QA问答对表
CREATE TABLE IF NOT EXISTS qa_pairs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dataset_id UUID NOT NULL REFERENCES qa_datasets(id) ON DELETE CASCADE,
    
    -- QA内容
    category VARCHAR(100),
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    
    -- 原始数据信息
    row_number INTEGER,
    source_sheet VARCHAR(100),
    
    -- 向量化信息
    question_vector_id VARCHAR(255),
    vector_status VARCHAR(20) DEFAULT 'pending',
    
    -- 质量评估
    quality_score INTEGER,
    is_validated BOOLEAN DEFAULT FALSE,
    validation_notes TEXT,
    
    -- 使用统计
    usage_count INTEGER DEFAULT 0,
    last_used_at TIMESTAMP WITH TIME ZONE,
    
    -- 元数据
    qa_metadata JSONB,
    
    -- 时间戳
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- QA分类表
CREATE TABLE IF NOT EXISTS qa_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dataset_id UUID NOT NULL REFERENCES qa_datasets(id) ON DELETE CASCADE,
    
    name VARCHAR(100) NOT NULL,
    description TEXT,
    
    -- 统计信息
    qa_count INTEGER DEFAULT 0,
    
    -- 元数据
    category_metadata JSONB,
    
    -- 时间戳
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_qa_pairs_dataset_id ON qa_pairs(dataset_id);
CREATE INDEX IF NOT EXISTS idx_qa_pairs_category ON qa_pairs(category);
CREATE INDEX IF NOT EXISTS idx_qa_pairs_vector_status ON qa_pairs(vector_status);
CREATE INDEX IF NOT EXISTS idx_qa_pairs_question_vector_id ON qa_pairs(question_vector_id);
CREATE INDEX IF NOT EXISTS idx_qa_categories_dataset_id ON qa_categories(dataset_id);
CREATE INDEX IF NOT EXISTS idx_qa_datasets_status ON qa_datasets(status);

-- 添加注释
COMMENT ON TABLE qa_datasets IS 'QA数据集管理表';
COMMENT ON TABLE qa_pairs IS 'QA问答对存储表';
COMMENT ON TABLE qa_categories IS 'QA分类管理表';

COMMENT ON COLUMN qa_datasets.status IS '处理状态: pending/processing/completed/failed';
COMMENT ON COLUMN qa_datasets.vectorization_status IS '向量化状态: pending/processing/completed/failed';
COMMENT ON COLUMN qa_pairs.vector_status IS '向量化状态: pending/processing/completed/failed';