-- QA生成配置表
-- 用于存储用户级别的QA生成默认配置

CREATE TABLE IF NOT EXISTS qa_generation_configs (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255),  -- 用户ID，NULL表示全局默认配置
    collection_id VARCHAR(255),  -- 知识库ID，NULL表示全局配置

    -- QA生成参数
    chunk_size INTEGER NOT NULL DEFAULT 1200,  -- 文档分块大小 (800-1600)
    chunk_overlap INTEGER NOT NULL DEFAULT 100,  -- 分块重叠字符数 (0-200)
    qa_count_per_chunk INTEGER NOT NULL DEFAULT 3,  -- 每块生成QA数量 (1-8)
    language VARCHAR(10) NOT NULL DEFAULT 'zh',  -- 语言设置 (zh/en)
    quality_threshold DECIMAL(3, 2) NOT NULL DEFAULT 0.7,  -- 质量过滤阈值 (0.5-0.9)
    include_summary BOOLEAN NOT NULL DEFAULT TRUE,  -- 是否包含摘要

    -- 元数据
    is_default BOOLEAN NOT NULL DEFAULT FALSE,  -- 是否为系统默认配置
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255),

    -- 约束
    CONSTRAINT qa_config_unique_user_collection UNIQUE (user_id, collection_id),
    CONSTRAINT qa_config_chunk_size_range CHECK (chunk_size >= 800 AND chunk_size <= 1600),
    CONSTRAINT qa_config_chunk_overlap_range CHECK (chunk_overlap >= 0 AND chunk_overlap <= 200),
    CONSTRAINT qa_config_qa_count_range CHECK (qa_count_per_chunk >= 1 AND qa_count_per_chunk <= 8),
    CONSTRAINT qa_config_quality_threshold_range CHECK (quality_threshold >= 0.5 AND quality_threshold <= 0.9),
    CONSTRAINT qa_config_language_check CHECK (language IN ('zh', 'en'))
);

-- 索引
CREATE INDEX idx_qa_generation_configs_user_id ON qa_generation_configs(user_id);
CREATE INDEX idx_qa_generation_configs_collection_id ON qa_generation_configs(collection_id);
CREATE INDEX idx_qa_generation_configs_is_default ON qa_generation_configs(is_default);

-- 更新时间触发器
CREATE OR REPLACE FUNCTION update_qa_generation_configs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_qa_generation_configs_updated_at
    BEFORE UPDATE ON qa_generation_configs
    FOR EACH ROW
    EXECUTE FUNCTION update_qa_generation_configs_updated_at();

-- 插入系统默认配置
INSERT INTO qa_generation_configs (
    user_id,
    collection_id,
    chunk_size,
    chunk_overlap,
    qa_count_per_chunk,
    language,
    quality_threshold,
    include_summary,
    is_default,
    created_by
) VALUES (
    NULL,
    NULL,
    1200,
    100,
    3,
    'zh',
    0.7,
    TRUE,
    TRUE,
    'system'
) ON CONFLICT (user_id, collection_id) DO NOTHING;

-- 注释
COMMENT ON TABLE qa_generation_configs IS 'QA生成配置表，支持用户级别和知识库级别的配置';
COMMENT ON COLUMN qa_generation_configs.user_id IS '用户ID，NULL表示全局默认配置';
COMMENT ON COLUMN qa_generation_configs.collection_id IS '知识库ID，NULL表示全局配置';
COMMENT ON COLUMN qa_generation_configs.chunk_size IS '文档分块大小，范围800-1600字符';
COMMENT ON COLUMN qa_generation_configs.chunk_overlap IS '分块重叠字符数，范围0-200字符';
COMMENT ON COLUMN qa_generation_configs.qa_count_per_chunk IS '每块生成QA数量，范围1-8';
COMMENT ON COLUMN qa_generation_configs.quality_threshold IS '质量过滤阈值，范围0.5-0.9';
COMMENT ON COLUMN qa_generation_configs.is_default IS '是否为系统默认配置';
