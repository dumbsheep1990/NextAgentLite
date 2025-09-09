-- 添加切分配置作用域字段
-- 用于区分全局配置和知识库专属配置

-- 添加作用域字段
ALTER TABLE chunking_configs 
ADD COLUMN IF NOT EXISTS scope VARCHAR(20) DEFAULT 'global';

-- 添加归属知识库ID字段
ALTER TABLE chunking_configs 
ADD COLUMN IF NOT EXISTS collection_id VARCHAR(50);

-- 添加外键约束
ALTER TABLE chunking_configs 
ADD CONSTRAINT IF NOT EXISTS fk_chunking_configs_collection 
FOREIGN KEY (collection_id) REFERENCES knowledge_collections(id) ON DELETE CASCADE;

-- 添加索引
CREATE INDEX IF NOT EXISTS idx_chunking_configs_scope ON chunking_configs(scope);
CREATE INDEX IF NOT EXISTS idx_chunking_configs_collection_id ON chunking_configs(collection_id);

-- 添加约束：collection_specific 配置必须有 collection_id
ALTER TABLE chunking_configs 
ADD CONSTRAINT IF NOT EXISTS chk_collection_specific_has_collection_id 
CHECK (
    (scope = 'global' AND collection_id IS NULL) OR 
    (scope = 'collection_specific' AND collection_id IS NOT NULL)
);

-- 更新现有记录为全局作用域
UPDATE chunking_configs 
SET scope = 'global' 
WHERE scope IS NULL OR scope = '';

-- 添加注释
COMMENT ON COLUMN chunking_configs.scope IS '配置作用域: global(全局) | collection_specific(知识库专属)';
COMMENT ON COLUMN chunking_configs.collection_id IS '专属配置归属的知识库ID';