-- 添加知识库切分配置字段
-- 用于持久化保存每个知识库的切分策略选择

-- 检查并添加 default_chunking_config_id 字段
DO $$ 
BEGIN
    -- 检查字段是否存在
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'knowledge_collections' 
        AND column_name = 'default_chunking_config_id'
    ) THEN
        -- 添加字段
        ALTER TABLE knowledge_collections 
        ADD COLUMN default_chunking_config_id VARCHAR(50);
        
        -- 添加外键约束（可选，如果chunking_configs表存在）
        IF EXISTS (
            SELECT 1 
            FROM information_schema.tables 
            WHERE table_name = 'chunking_configs'
        ) THEN
            ALTER TABLE knowledge_collections
            ADD CONSTRAINT fk_collection_chunking_config
            FOREIGN KEY (default_chunking_config_id)
            REFERENCES chunking_configs(id)
            ON DELETE SET NULL;
        END IF;
        
        RAISE NOTICE '已添加 default_chunking_config_id 字段';
    ELSE
        RAISE NOTICE 'default_chunking_config_id 字段已存在';
    END IF;
END $$;

-- 检查并添加 chunking_config JSONB字段（用于存储自定义配置）
DO $$ 
BEGIN
    -- 检查字段是否存在
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'knowledge_collections' 
        AND column_name = 'chunking_config'
    ) THEN
        -- 添加字段
        ALTER TABLE knowledge_collections 
        ADD COLUMN chunking_config JSONB DEFAULT '{}';
        
        RAISE NOTICE '已添加 chunking_config 字段';
    ELSE
        -- 如果字段存在但类型不对，转换类型
        IF EXISTS (
            SELECT 1 
            FROM information_schema.columns 
            WHERE table_name = 'knowledge_collections' 
            AND column_name = 'chunking_config'
            AND data_type != 'jsonb'
        ) THEN
            ALTER TABLE knowledge_collections 
            ALTER COLUMN chunking_config TYPE JSONB USING chunking_config::jsonb;
            
            RAISE NOTICE '已将 chunking_config 字段转换为 JSONB 类型';
        ELSE
            RAISE NOTICE 'chunking_config 字段已存在且类型正确';
        END IF;
    END IF;
END $$;

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_collections_chunking_config 
ON knowledge_collections(default_chunking_config_id);

-- 更新现有记录，设置默认值
UPDATE knowledge_collections 
SET chunking_config = '{"inherit_from_global": true}'::jsonb
WHERE chunking_config IS NULL;

-- 添加注释
COMMENT ON COLUMN knowledge_collections.default_chunking_config_id IS '知识库使用的切分配置ID';
COMMENT ON COLUMN knowledge_collections.chunking_config IS '知识库的自定义切分配置参数';