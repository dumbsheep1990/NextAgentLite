-- QA生成功能数据库迁移
-- 创建QA生成相关表结构，支持2560维向量 (text-embedding-v4)

-- 创建QA生成任务表
CREATE TABLE IF NOT EXISTS qa_generation_tasks (
    id SERIAL PRIMARY KEY,
    document_id INTEGER REFERENCES knowledge_documents(id) ON DELETE CASCADE,
    status VARCHAR(50) DEFAULT 'pending',
    qa_pairs_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP,
    error_message TEXT
);

-- 创建QA对存储表 (支持2560维向量)
CREATE TABLE IF NOT EXISTS generated_qa_pairs (
    id SERIAL PRIMARY KEY,
    task_id INTEGER REFERENCES qa_generation_tasks(id) ON DELETE CASCADE,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    summary TEXT,
    source_chunk TEXT,
    question_embedding vector(2560),  -- text-embedding-v4 维度
    answer_embedding vector(2560),    -- text-embedding-v4 维度
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 创建别名表（兼容GC-QA-RAG）
CREATE TABLE IF NOT EXISTS collection_aliases (
    alias_name VARCHAR(255) PRIMARY KEY,
    collection_name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_qa_tasks_document_id ON qa_generation_tasks(document_id);
CREATE INDEX IF NOT EXISTS idx_qa_tasks_status ON qa_generation_tasks(status);
CREATE INDEX IF NOT EXISTS idx_qa_tasks_created_at ON qa_generation_tasks(created_at);

CREATE INDEX IF NOT EXISTS idx_qa_pairs_task_id ON generated_qa_pairs(task_id);
CREATE INDEX IF NOT EXISTS idx_qa_pairs_created_at ON generated_qa_pairs(created_at);

-- 向量索引 (需要pgvector扩展)
CREATE INDEX IF NOT EXISTS idx_qa_question_embedding 
ON generated_qa_pairs USING ivfflat (question_embedding vector_cosine_ops);

CREATE INDEX IF NOT EXISTS idx_qa_answer_embedding 
ON generated_qa_pairs USING ivfflat (answer_embedding vector_cosine_ops);

-- GIN索引用于JSONB搜索
CREATE INDEX IF NOT EXISTS idx_qa_pairs_metadata 
ON generated_qa_pairs USING gin (metadata);

-- 创建别名表索引
CREATE INDEX IF NOT EXISTS idx_collection_aliases_collection 
ON collection_aliases(collection_name);

-- 添加注释
COMMENT ON TABLE qa_generation_tasks IS 'QA生成任务管理表';
COMMENT ON TABLE generated_qa_pairs IS 'QA对存储表，支持向量检索';
COMMENT ON TABLE collection_aliases IS '集合别名表，兼容GC-QA-RAG架构';

COMMENT ON COLUMN generated_qa_pairs.question_embedding IS '问题向量嵌入 (text-embedding-v4, 2560维)';
COMMENT ON COLUMN generated_qa_pairs.answer_embedding IS '答案向量嵌入 (text-embedding-v4, 2560维)';
COMMENT ON COLUMN generated_qa_pairs.metadata IS 'QA对元数据，包含生成参数和质量信息';

-- 确保pgvector扩展存在
CREATE EXTENSION IF NOT EXISTS vector;

-- 插入示例别名（可选）
INSERT INTO collection_aliases (alias_name, collection_name, updated_at)
VALUES ('qa_generic_prod', 'generated_qa_pairs', NOW())
ON CONFLICT (alias_name) DO UPDATE SET
    collection_name = EXCLUDED.collection_name,
    updated_at = EXCLUDED.updated_at;