-- 添加 collection_id 字段到 knowledge_documents 表
-- Migration: add_collection_id_to_documents
-- Date: 2025-08-25

BEGIN;

-- 步骤 1: 添加 collection_id 字段（可为空）
ALTER TABLE knowledge_documents 
ADD COLUMN collection_id VARCHAR(255);

-- 步骤 2: 创建外键约束（指向 knowledge_collections 表）
ALTER TABLE knowledge_documents 
ADD CONSTRAINT fk_documents_collection 
FOREIGN KEY (collection_id) REFERENCES knowledge_collections(id) ON DELETE SET NULL;

-- 步骤 3: 创建索引提高查询性能
CREATE INDEX idx_knowledge_documents_collection_id 
ON knowledge_documents(collection_id);

-- 步骤 4: 获取默认集合ID（如果存在）
-- 将所有现有文档分配到默认集合
DO $$
DECLARE
    default_collection_id VARCHAR(255);
BEGIN
    -- 查找默认集合
    SELECT id INTO default_collection_id 
    FROM knowledge_collections 
    WHERE is_default = true 
    LIMIT 1;
    
    -- 如果找到默认集合，更新所有现有文档
    IF default_collection_id IS NOT NULL THEN
        UPDATE knowledge_documents 
        SET collection_id = default_collection_id 
        WHERE collection_id IS NULL;
        
        RAISE NOTICE '已将 % 个文档分配到默认集合 %', 
            (SELECT COUNT(*) FROM knowledge_documents WHERE collection_id = default_collection_id),
            default_collection_id;
    ELSE
        RAISE WARNING '未找到默认集合，文档的 collection_id 保持为空';
    END IF;
END $$;

-- 步骤 5: 记录迁移
INSERT INTO schema_migrations (migration_name, applied_at, description)
VALUES (
    'add_collection_id_to_documents',
    CURRENT_TIMESTAMP,
    '为 knowledge_documents 表添加 collection_id 字段，建立与 knowledge_collections 的关联'
);

COMMIT;

-- 验证迁移结果
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'knowledge_documents' 
AND column_name = 'collection_id';

-- 显示约束信息
SELECT 
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
AND tc.table_name='knowledge_documents'
AND kcu.column_name = 'collection_id';