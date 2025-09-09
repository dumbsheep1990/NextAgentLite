-- 知识库Collection和元数据模版系统迁移
-- 迁移日期: 2025-08-21
-- 功能: 添加知识库Collection管理和四种元数据模版支持

BEGIN;

-- 1. 创建知识库集合表
CREATE TABLE IF NOT EXISTS knowledge_collections (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    icon VARCHAR(100),
    color VARCHAR(20),
    is_default BOOLEAN DEFAULT false,
    is_public BOOLEAN DEFAULT true,
    is_active BOOLEAN DEFAULT true,
    metadata_template VARCHAR(50) NOT NULL DEFAULT 'general',
    template_version VARCHAR(20) DEFAULT '1.0',
    document_count INTEGER DEFAULT 0,
    total_size BIGINT DEFAULT 0,
    last_updated TIMESTAMPTZ,
    config JSONB,
    metadata JSONB,
    template_config JSONB,
    extraction_rules JSONB,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 2. 创建元数据模版表
CREATE TABLE IF NOT EXISTS metadata_templates (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    template_type VARCHAR(50) NOT NULL,
    version VARCHAR(20) DEFAULT '1.0',
    description TEXT,
    schema_definition JSONB NOT NULL,
    extraction_config JSONB,
    validation_rules JSONB,
    display_config JSONB,
    search_config JSONB,
    is_active BOOLEAN DEFAULT true,
    is_system BOOLEAN DEFAULT false,
    usage_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 3. 扩展knowledge_documents表，添加新字段
ALTER TABLE knowledge_documents ADD COLUMN IF NOT EXISTS collection_id VARCHAR(50);
ALTER TABLE knowledge_documents ADD COLUMN IF NOT EXISTS metadata_template_id VARCHAR(50);
ALTER TABLE knowledge_documents ADD COLUMN IF NOT EXISTS structured_metadata JSONB;
ALTER TABLE knowledge_documents ADD COLUMN IF NOT EXISTS metadata_extraction_status VARCHAR(20) DEFAULT 'pending';
ALTER TABLE knowledge_documents ADD COLUMN IF NOT EXISTS metadata_extraction_log JSONB;
ALTER TABLE knowledge_documents ADD COLUMN IF NOT EXISTS document_category VARCHAR(100);
ALTER TABLE knowledge_documents ADD COLUMN IF NOT EXISTS domain_type VARCHAR(50);
ALTER TABLE knowledge_documents ADD COLUMN IF NOT EXISTS effective_date TIMESTAMPTZ;
ALTER TABLE knowledge_documents ADD COLUMN IF NOT EXISTS expiry_date TIMESTAMPTZ;

-- 4. 创建索引以优化查询性能
-- Collection表索引
CREATE INDEX IF NOT EXISTS idx_knowledge_collections_name ON knowledge_collections(name);
CREATE INDEX IF NOT EXISTS idx_knowledge_collections_is_default ON knowledge_collections(is_default);
CREATE INDEX IF NOT EXISTS idx_knowledge_collections_is_active ON knowledge_collections(is_active);
CREATE INDEX IF NOT EXISTS idx_knowledge_collections_metadata_template ON knowledge_collections(metadata_template);

-- 模版表索引
CREATE INDEX IF NOT EXISTS idx_metadata_templates_name ON metadata_templates(name);
CREATE INDEX IF NOT EXISTS idx_metadata_templates_type ON metadata_templates(template_type);
CREATE INDEX IF NOT EXISTS idx_metadata_templates_is_active ON metadata_templates(is_active);
CREATE INDEX IF NOT EXISTS idx_metadata_templates_is_system ON metadata_templates(is_system);

-- Document表新增字段索引
CREATE INDEX IF NOT EXISTS idx_knowledge_docs_collection_id ON knowledge_documents(collection_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_docs_metadata_template_id ON knowledge_documents(metadata_template_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_docs_document_category ON knowledge_documents(document_category);
CREATE INDEX IF NOT EXISTS idx_knowledge_docs_domain_type ON knowledge_documents(domain_type);
CREATE INDEX IF NOT EXISTS idx_knowledge_docs_effective_date ON knowledge_documents(effective_date);
CREATE INDEX IF NOT EXISTS idx_knowledge_docs_expiry_date ON knowledge_documents(expiry_date);
CREATE INDEX IF NOT EXISTS idx_knowledge_docs_extraction_status ON knowledge_documents(metadata_extraction_status);

-- 5. 添加外键约束
ALTER TABLE knowledge_documents 
ADD CONSTRAINT fk_knowledge_docs_collection 
FOREIGN KEY (collection_id) REFERENCES knowledge_collections(id) ON DELETE SET NULL;

ALTER TABLE knowledge_documents 
ADD CONSTRAINT fk_knowledge_docs_metadata_template 
FOREIGN KEY (metadata_template_id) REFERENCES metadata_templates(id) ON DELETE SET NULL;

-- 6. 创建默认的知识库Collection
INSERT INTO knowledge_collections (
    id, 
    name, 
    description, 
    is_default, 
    is_public, 
    metadata_template,
    config,
    template_config
) VALUES (
    'default_collection',
    '默认知识库',
    '系统默认的知识库集合，用于存储未分类的文档',
    true,
    true,
    'general',
    '{"search": {"default_top_k": 20, "rerank_enabled": true, "filter_strategy": "auto"}, "extraction": {"auto_extract": true, "batch_size": 10, "retry_limit": 3}, "permissions": {"public_read": true, "auto_approve": true}}',
    '{"extraction": {"llm_model": "qwen3-30b-a3b-instruct-2507", "confidence_threshold": 0.8, "max_retries": 2}, "validation": {"required_fields": [], "strict_mode": false}}'
) ON CONFLICT (id) DO NOTHING;

-- 7. 将现有文档关联到默认Collection
UPDATE knowledge_documents 
SET collection_id = 'default_collection' 
WHERE collection_id IS NULL;

-- 8. 更新默认Collection的文档统计
UPDATE knowledge_collections 
SET document_count = (
    SELECT COUNT(*) 
    FROM knowledge_documents 
    WHERE collection_id = 'default_collection'
),
total_size = (
    SELECT COALESCE(SUM(file_size), 0) 
    FROM knowledge_documents 
    WHERE collection_id = 'default_collection'
),
last_updated = CURRENT_TIMESTAMP
WHERE id = 'default_collection';

-- 9. 创建更新统计信息的触发器函数
CREATE OR REPLACE FUNCTION update_collection_stats() 
RETURNS TRIGGER AS $$
BEGIN
    -- 当文档被插入、更新或删除时，自动更新Collection统计
    IF TG_OP = 'INSERT' THEN
        UPDATE knowledge_collections 
        SET document_count = document_count + 1,
            total_size = total_size + NEW.file_size,
            last_updated = CURRENT_TIMESTAMP
        WHERE id = NEW.collection_id;
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        -- 如果文档在Collection间移动
        IF OLD.collection_id != NEW.collection_id THEN
            -- 从旧Collection减少
            UPDATE knowledge_collections 
            SET document_count = document_count - 1,
                total_size = total_size - OLD.file_size,
                last_updated = CURRENT_TIMESTAMP
            WHERE id = OLD.collection_id;
            -- 在新Collection增加
            UPDATE knowledge_collections 
            SET document_count = document_count + 1,
                total_size = total_size + NEW.file_size,
                last_updated = CURRENT_TIMESTAMP
            WHERE id = NEW.collection_id;
        -- 如果文档大小改变
        ELSIF OLD.file_size != NEW.file_size THEN
            UPDATE knowledge_collections 
            SET total_size = total_size - OLD.file_size + NEW.file_size,
                last_updated = CURRENT_TIMESTAMP
            WHERE id = NEW.collection_id;
        END IF;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE knowledge_collections 
        SET document_count = document_count - 1,
            total_size = total_size - OLD.file_size,
            last_updated = CURRENT_TIMESTAMP
        WHERE id = OLD.collection_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 10. 创建触发器
DROP TRIGGER IF EXISTS trigger_update_collection_stats ON knowledge_documents;
CREATE TRIGGER trigger_update_collection_stats
    AFTER INSERT OR UPDATE OR DELETE ON knowledge_documents
    FOR EACH ROW EXECUTE FUNCTION update_collection_stats();

COMMIT;

-- 迁移完成日志
-- 本迁移完成了以下功能:
-- 1. 创建knowledge_collections和metadata_templates表
-- 2. 扩展knowledge_documents表添加Collection和元数据模版支持
-- 3. 创建必要的索引和外键约束
-- 4. 初始化默认Collection并关联现有文档
-- 5. 创建自动维护Collection统计信息的触发器
-- 6. 所有修改都使用IF NOT EXISTS确保幂等性