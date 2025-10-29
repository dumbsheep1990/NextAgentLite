-- DeepScrape全局配置表
-- 用于存储用户的DeepScrape爬虫服务配置（LLM、内容清洗、爬取参数等）

-- 创建DeepScrape配置表
CREATE TABLE IF NOT EXISTS deepscrape_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    config_name VARCHAR(200) DEFAULT 'default',

    -- LLM配置
    llm_enabled BOOLEAN DEFAULT FALSE,
    llm_provider VARCHAR(50) DEFAULT 'openai',
    llm_model VARCHAR(200),
    llm_temperature DECIMAL(3, 2) DEFAULT 0.2,
    llm_max_tokens INTEGER DEFAULT 4000,
    llm_timeout INTEGER DEFAULT 120000,
    llm_max_retries INTEGER DEFAULT 3,
    llm_extraction_type VARCHAR(50) DEFAULT 'summary',
    llm_prompt_format VARCHAR(50) DEFAULT 'zero-shot',

    -- 内容清洗配置
    cleaning_remove_ads BOOLEAN DEFAULT TRUE,
    cleaning_remove_tracking BOOLEAN DEFAULT TRUE,
    cleaning_remove_scripts BOOLEAN DEFAULT TRUE,
    cleaning_remove_hidden_elements BOOLEAN DEFAULT TRUE,
    cleaning_remove_social_buttons BOOLEAN DEFAULT TRUE,
    cleaning_remove_comments BOOLEAN DEFAULT TRUE,
    cleaning_remove_popups BOOLEAN DEFAULT TRUE,

    -- 爬取配置
    scraping_timeout INTEGER DEFAULT 30000,
    scraping_block_ads BOOLEAN DEFAULT TRUE,
    scraping_block_resources BOOLEAN DEFAULT TRUE,
    scraping_user_agent TEXT,
    scraping_javascript BOOLEAN DEFAULT TRUE,
    scraping_full_page BOOLEAN DEFAULT FALSE,
    scraping_extractor_format VARCHAR(20) DEFAULT 'markdown',

    -- 批处理配置
    batch_enabled BOOLEAN DEFAULT TRUE,
    batch_concurrency INTEGER DEFAULT 3,
    batch_max_concurrent_jobs INTEGER DEFAULT 5,

    -- 扩展配置（JSON格式存储其他自定义配置）
    extended_config JSONB DEFAULT '{}'::jsonb,

    -- 元数据
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- 确保每个用户只有一个默认配置
    UNIQUE (user_id, config_name),
    CONSTRAINT check_temperature CHECK (llm_temperature >= 0 AND llm_temperature <= 2)
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_deepscrape_configs_user_id ON deepscrape_configs(user_id);
CREATE INDEX IF NOT EXISTS idx_deepscrape_configs_is_default ON deepscrape_configs(user_id, is_default) WHERE is_default = TRUE;

-- 添加更新时间戳触发器
CREATE OR REPLACE FUNCTION update_deepscrape_configs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_deepscrape_configs_updated_at
    BEFORE UPDATE ON deepscrape_configs
    FOR EACH ROW
    EXECUTE FUNCTION update_deepscrape_configs_updated_at();

-- 添加注释
COMMENT ON TABLE deepscrape_configs IS 'DeepScrape爬虫服务全局配置表';
COMMENT ON COLUMN deepscrape_configs.llm_enabled IS '是否启用LLM智能处理';
COMMENT ON COLUMN deepscrape_configs.llm_provider IS 'LLM提供商：openai, vllm, ollama, localai, litellm, custom';
COMMENT ON COLUMN deepscrape_configs.llm_extraction_type IS '提取模式：structured, summary, qa';
COMMENT ON COLUMN deepscrape_configs.scraping_extractor_format IS '输出格式：html, markdown, text';
COMMENT ON COLUMN deepscrape_configs.extended_config IS '扩展配置JSON，用于存储其他自定义配置';
COMMENT ON COLUMN deepscrape_configs.is_default IS '是否为用户的默认配置';
