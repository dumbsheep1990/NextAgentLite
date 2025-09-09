-- 为知识库Collection添加切分规则配置支持
-- 迁移日期: 2025-08-25
-- 功能: 支持每个知识库使用不同的切分规则配置

BEGIN;

-- 1. 为knowledge_collections表添加切分配置相关字段
ALTER TABLE knowledge_collections ADD COLUMN IF NOT EXISTS default_chunking_config_id VARCHAR(50);
ALTER TABLE knowledge_collections ADD COLUMN IF NOT EXISTS chunking_config JSONB;

-- 2. 添加外键约束，关联到chunking_configs表
ALTER TABLE knowledge_collections 
ADD CONSTRAINT fk_collections_chunking_config 
FOREIGN KEY (default_chunking_config_id) REFERENCES chunking_configs(id) ON DELETE SET NULL;

-- 3. 创建索引优化查询
CREATE INDEX IF NOT EXISTS idx_knowledge_collections_chunking_config 
ON knowledge_collections(default_chunking_config_id);

-- 4. 更新现有的默认Collection，使用默认的切分配置
UPDATE knowledge_collections 
SET default_chunking_config_id = (
    SELECT id FROM chunking_configs 
    WHERE is_default = true 
    LIMIT 1
),
chunking_config = JSONB_BUILD_OBJECT(
    'inherit_from_global', true,
    'custom_rules', JSONB_BUILD_OBJECT(),
    'override_settings', JSONB_BUILD_OBJECT()
)
WHERE default_chunking_config_id IS NULL;

-- 5. 创建视图：带切分配置信息的Collection详情
CREATE OR REPLACE VIEW collection_with_chunking_config AS
SELECT 
    kc.*,
    cc.name as chunking_config_name,
    cc.description as chunking_config_description,
    cc.strategy as chunking_strategy,
    cc.chunk_token_num,
    cc.max_token_num,
    cc.chunk_overlap,
    cc.delimiter,
    cc.tokenizer_type,
    cc.preserve_structure,
    cc.semantic_threshold,
    cc.supported_formats,
    cc.is_active as chunking_config_active
FROM knowledge_collections kc
LEFT JOIN chunking_configs cc ON kc.default_chunking_config_id = cc.id;

COMMIT;

-- 迁移完成日志
-- 本迁移完成了以下功能:
-- 1. 为knowledge_collections表添加切分配置相关字段
-- 2. 建立与chunking_configs表的外键关联
-- 3. 创建必要的索引优化查询性能
-- 4. 为现有Collection设置默认切分配置
-- 5. 创建包含切分配置信息的Collection视图