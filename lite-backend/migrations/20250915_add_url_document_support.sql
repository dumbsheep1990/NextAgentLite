-- 添加URL文档支持的数据库迁移
-- 日期: 2025-09-15
-- 描述: 为知识库文档表添加URL文档类型支持

-- 添加URL文档特有字段
ALTER TABLE knowledge_documents 
ADD COLUMN IF NOT EXISTS source_url VARCHAR(2000),
ADD COLUMN IF NOT EXISTS scrape_method VARCHAR(50),
ADD COLUMN IF NOT EXISTS scrape_metadata JSONB,
ADD COLUMN IF NOT EXISTS content_hash VARCHAR(64);

-- 添加索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_knowledge_documents_source_url ON knowledge_documents(source_url);
CREATE INDEX IF NOT EXISTS idx_knowledge_documents_content_hash ON knowledge_documents(content_hash);
CREATE INDEX IF NOT EXISTS idx_knowledge_documents_scrape_method ON knowledge_documents(scrape_method);

-- 添加file_type的索引以支持快速筛选
CREATE INDEX IF NOT EXISTS idx_knowledge_documents_file_type ON knowledge_documents(file_type);

-- 更新现有文档，确保非URL文档的新字段为NULL
UPDATE knowledge_documents 
SET source_url = NULL, scrape_method = NULL, scrape_metadata = NULL, content_hash = NULL
WHERE file_type != 'url' AND (source_url IS NOT NULL OR scrape_method IS NOT NULL);

-- 添加约束：URL类型文档必须有source_url
ALTER TABLE knowledge_documents 
ADD CONSTRAINT chk_url_document_has_source 
CHECK (
    (file_type = 'url' AND source_url IS NOT NULL) OR 
    (file_type != 'url')
);

-- 为URL文档类型添加注释
COMMENT ON COLUMN knowledge_documents.source_url IS '原始URL地址，仅URL类型文档使用';
COMMENT ON COLUMN knowledge_documents.scrape_method IS '抓取方法：crawl4ai, deepscrape';
COMMENT ON COLUMN knowledge_documents.scrape_metadata IS '抓取元数据：响应时间、状态码、抓取时间等';
COMMENT ON COLUMN knowledge_documents.content_hash IS '内容哈希值，用于检测URL内容更新';

-- 创建视图，方便查询不同类型的文档
CREATE OR REPLACE VIEW v_url_documents AS
SELECT 
    id,
    title,
    source_url,
    scrape_method,
    scrape_metadata,
    content_hash,
    status,
    collection_id,
    folder_id,
    tags,
    created_at,
    updated_at
FROM knowledge_documents 
WHERE file_type = 'url';

CREATE OR REPLACE VIEW v_file_documents AS
SELECT 
    id,
    title,
    filename,
    file_type,
    file_size,
    file_path,
    status,
    collection_id,
    folder_id,
    tags,
    created_at,
    updated_at
FROM knowledge_documents 
WHERE file_type != 'url';

-- 添加统计信息
CREATE OR REPLACE VIEW v_document_statistics AS
SELECT 
    file_type,
    COUNT(*) as total_count,
    COUNT(CASE WHEN status = 'vectorized' THEN 1 END) as vectorized_count,
    COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_count,
    AVG(file_size) as avg_file_size
FROM knowledge_documents 
GROUP BY file_type;

-- 记录迁移日志
INSERT INTO migration_log (migration_name, executed_at, description) 
VALUES (
    '20250915_add_url_document_support', 
    NOW(), 
    '添加URL文档类型支持：source_url, scrape_method, scrape_metadata, content_hash字段及相关索引和约束'
)
ON CONFLICT (migration_name) DO NOTHING;