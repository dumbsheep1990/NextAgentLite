-- 文件夹系统支持 - 数据库迁移脚本
-- Date: 2025-08-28
-- Purpose: 添加文件夹结构支持，最多2层嵌套

BEGIN;

-- 1. 创建文件夹表
CREATE TABLE IF NOT EXISTS knowledge_folders (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    parent_folder_id VARCHAR(50) NULL, -- 父文件夹ID，NULL表示根文件夹
    collection_id VARCHAR(50) NOT NULL, -- 所属知识库
    folder_path TEXT NOT NULL, -- 完整路径，如 "/root/subfolder"
    depth_level INTEGER NOT NULL DEFAULT 0 CHECK (depth_level <= 1), -- 层级深度，最大为1（0层为根，1层为子文件夹）
    sort_order INTEGER DEFAULT 0, -- 排序顺序
    is_active BOOLEAN DEFAULT true,
    folder_metadata JSONB, -- 文件夹元数据
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(50),
    
    -- 约束
    CONSTRAINT fk_parent_folder FOREIGN KEY (parent_folder_id) REFERENCES knowledge_folders(id) ON DELETE CASCADE,
    CONSTRAINT fk_folder_collection FOREIGN KEY (collection_id) REFERENCES knowledge_collections(id) ON DELETE CASCADE,
    CONSTRAINT unique_folder_name_in_parent UNIQUE (collection_id, parent_folder_id, name),
    CONSTRAINT check_folder_depth CHECK (
        (depth_level = 0 AND parent_folder_id IS NULL) OR
        (depth_level = 1 AND parent_folder_id IS NOT NULL)
    )
);

-- 2. 为文档表添加文件夹关联字段
ALTER TABLE knowledge_documents ADD COLUMN IF NOT EXISTS folder_id VARCHAR(50);
ALTER TABLE knowledge_documents ADD COLUMN IF NOT EXISTS folder_path TEXT;

-- 添加外键约束
ALTER TABLE knowledge_documents ADD CONSTRAINT fk_document_folder 
    FOREIGN KEY (folder_id) REFERENCES knowledge_folders(id) ON DELETE SET NULL;

-- 3. 创建索引提高查询性能
CREATE INDEX IF NOT EXISTS idx_knowledge_folders_collection_id ON knowledge_folders(collection_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_folders_parent_id ON knowledge_folders(parent_folder_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_folders_path ON knowledge_folders(folder_path);
CREATE INDEX IF NOT EXISTS idx_knowledge_folders_depth ON knowledge_folders(depth_level);
CREATE INDEX IF NOT EXISTS idx_knowledge_documents_folder_id ON knowledge_documents(folder_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_documents_folder_path ON knowledge_documents USING gin(to_tsvector('simple', folder_path));

-- 4. 创建用于层级查询的递归视图
CREATE OR REPLACE VIEW v_folder_hierarchy AS
WITH RECURSIVE folder_tree AS (
    -- 根文件夹（depth_level = 0）
    SELECT 
        id,
        name,
        description,
        parent_folder_id,
        collection_id,
        folder_path,
        depth_level,
        sort_order,
        is_active,
        folder_metadata,
        created_at,
        updated_at,
        ARRAY[name] as path_array,
        name as full_path_name
    FROM knowledge_folders
    WHERE parent_folder_id IS NULL AND is_active = true
    
    UNION ALL
    
    -- 子文件夹
    SELECT 
        f.id,
        f.name,
        f.description,
        f.parent_folder_id,
        f.collection_id,
        f.folder_path,
        f.depth_level,
        f.sort_order,
        f.is_active,
        f.folder_metadata,
        f.created_at,
        f.updated_at,
        ft.path_array || f.name,
        ft.full_path_name || ' / ' || f.name
    FROM knowledge_folders f
    INNER JOIN folder_tree ft ON f.parent_folder_id = ft.id
    WHERE f.is_active = true
)
SELECT * FROM folder_tree;

-- 5. 创建文档统计视图
CREATE OR REPLACE VIEW v_folder_document_stats AS
SELECT 
    f.id as folder_id,
    f.name as folder_name,
    f.collection_id,
    f.folder_path,
    f.depth_level,
    COUNT(d.id) as document_count,
    COALESCE(SUM(d.file_size), 0) as total_size,
    MAX(d.updated_at) as last_updated
FROM knowledge_folders f
LEFT JOIN knowledge_documents d ON f.id = d.folder_id AND d.status != 'deleted'
WHERE f.is_active = true
GROUP BY f.id, f.name, f.collection_id, f.folder_path, f.depth_level;

-- 6. 创建触发器函数用于自动更新文件夹路径
CREATE OR REPLACE FUNCTION update_folder_path()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.parent_folder_id IS NULL THEN
        -- 根文件夹
        NEW.folder_path := '/' || NEW.name;
        NEW.depth_level := 0;
    ELSE
        -- 子文件夹
        SELECT folder_path || '/' || NEW.name, depth_level + 1
        INTO NEW.folder_path, NEW.depth_level
        FROM knowledge_folders
        WHERE id = NEW.parent_folder_id;
        
        -- 检查深度限制
        IF NEW.depth_level > 1 THEN
            RAISE EXCEPTION 'Folder nesting depth cannot exceed 2 levels';
        END IF;
    END IF;
    
    NEW.updated_at := CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 7. 创建触发器
DROP TRIGGER IF EXISTS trigger_update_folder_path ON knowledge_folders;
CREATE TRIGGER trigger_update_folder_path
    BEFORE INSERT OR UPDATE ON knowledge_folders
    FOR EACH ROW
    EXECUTE FUNCTION update_folder_path();

-- 8. 创建文档文件夹路径更新函数
CREATE OR REPLACE FUNCTION update_document_folder_path()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.folder_id IS NOT NULL THEN
        -- 获取文件夹路径
        SELECT folder_path INTO NEW.folder_path
        FROM knowledge_folders
        WHERE id = NEW.folder_id;
    ELSE
        NEW.folder_path := NULL;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 9. 为文档表创建触发器
DROP TRIGGER IF EXISTS trigger_update_document_folder_path ON knowledge_documents;
CREATE TRIGGER trigger_update_document_folder_path
    BEFORE INSERT OR UPDATE ON knowledge_documents
    FOR EACH ROW
    EXECUTE FUNCTION update_document_folder_path();

-- 10. 插入系统默认文件夹（为每个知识库创建根文件夹）
INSERT INTO knowledge_folders (
    id, 
    name, 
    description, 
    collection_id, 
    folder_path, 
    depth_level,
    folder_metadata,
    created_by
)
SELECT 
    'folder_root_' || kc.id,
    '根目录',
    '知识库 ' || kc.name || ' 的根目录',
    kc.id,
    '/根目录',
    0,
    jsonb_build_object(
        'type', 'root',
        'auto_created', true,
        'system_folder', true
    ),
    'system'
FROM knowledge_collections kc
WHERE NOT EXISTS (
    SELECT 1 FROM knowledge_folders kf 
    WHERE kf.collection_id = kc.id AND kf.depth_level = 0
)
ON CONFLICT (collection_id, parent_folder_id, name) DO NOTHING;

-- 11. 为现有文档分配到根文件夹
UPDATE knowledge_documents 
SET 
    folder_id = 'folder_root_' || collection_id,
    folder_path = '/根目录'
WHERE folder_id IS NULL 
    AND collection_id IS NOT NULL
    AND EXISTS (
        SELECT 1 FROM knowledge_folders kf 
        WHERE kf.id = 'folder_root_' || knowledge_documents.collection_id
    );

COMMIT;

-- 验证创建结果
DO $$
BEGIN
    RAISE NOTICE 'Folder system migration completed successfully';
    RAISE NOTICE 'Created folders: %', (SELECT COUNT(*) FROM knowledge_folders);
    RAISE NOTICE 'Documents in folders: %', (SELECT COUNT(*) FROM knowledge_documents WHERE folder_id IS NOT NULL);
END $$;