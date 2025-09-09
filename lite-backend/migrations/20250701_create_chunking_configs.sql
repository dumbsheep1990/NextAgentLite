-- 创建切分配置表
CREATE TABLE IF NOT EXISTS chunking_configs (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    strategy VARCHAR(20) NOT NULL DEFAULT 'semantic',
    chunk_token_num INTEGER NOT NULL DEFAULT 400,
    max_token_num INTEGER NOT NULL DEFAULT 512,
    chunk_overlap INTEGER NOT NULL DEFAULT 50,
    delimiter VARCHAR(50) NOT NULL DEFAULT '.!?',
    tokenizer_type VARCHAR(20) NOT NULL DEFAULT 'simple',
    preserve_structure BOOLEAN NOT NULL DEFAULT TRUE,
    semantic_threshold INTEGER NOT NULL DEFAULT 30,
    supported_formats JSONB NOT NULL DEFAULT '["txt", "md", "pdf", "docx"]',
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_chunking_configs_strategy ON chunking_configs(strategy);
CREATE INDEX IF NOT EXISTS idx_chunking_configs_is_default ON chunking_configs(is_default);
CREATE INDEX IF NOT EXISTS idx_chunking_configs_is_active ON chunking_configs(is_active);

-- 添加列注释
COMMENT ON TABLE chunking_configs IS '文档切分配置表';
COMMENT ON COLUMN chunking_configs.name IS '配置名称';
COMMENT ON COLUMN chunking_configs.description IS '配置描述';
COMMENT ON COLUMN chunking_configs.strategy IS '切分策略: semantic, fixed, naive';
COMMENT ON COLUMN chunking_configs.chunk_token_num IS '最小token数';
COMMENT ON COLUMN chunking_configs.max_token_num IS '最大token数';
COMMENT ON COLUMN chunking_configs.chunk_overlap IS '重叠token数';
COMMENT ON COLUMN chunking_configs.delimiter IS '分隔符';
COMMENT ON COLUMN chunking_configs.tokenizer_type IS '分词器类型: simple, advanced';
COMMENT ON COLUMN chunking_configs.preserve_structure IS '是否保留文档结构';
COMMENT ON COLUMN chunking_configs.semantic_threshold IS '语义阈值(0-100)';
COMMENT ON COLUMN chunking_configs.supported_formats IS '支持的文件格式';
COMMENT ON COLUMN chunking_configs.is_default IS '是否为默认配置';
COMMENT ON COLUMN chunking_configs.is_active IS '是否激活';

-- 插入默认配置
INSERT INTO chunking_configs (
    id, name, description, strategy, chunk_token_num, max_token_num, 
    chunk_overlap, delimiter, tokenizer_type, preserve_structure, 
    semantic_threshold, supported_formats, is_default, is_active
) VALUES 
(
    gen_random_uuid()::text, 
    '默认语义切分', 
    '基于语义相关性的智能文档切分，适用于大部分文档类型', 
    'semantic', 
    400, 
    512, 
    50, 
    '.!?', 
    'simple', 
    TRUE, 
    30, 
    '["txt", "md", "pdf", "docx"]'::jsonb, 
    TRUE, 
    TRUE
),
(
    gen_random_uuid()::text, 
    '固定长度切分', 
    '严格按照Token数量限制进行文档切分，确保每个块大小一致', 
    'fixed', 
    256, 
    256, 
    25, 
    '.!?', 
    'simple', 
    FALSE, 
    0, 
    '["txt", "md", "pdf", "docx"]'::jsonb, 
    FALSE, 
    TRUE
),
(
    gen_random_uuid()::text, 
    '朴素段落切分', 
    '基础的段落分割方法，保持文档原有结构', 
    'naive', 
    300, 
    600, 
    30, 
    '.!?', 
    'simple', 
    TRUE, 
    0, 
    '["txt", "md", "pdf", "docx"]'::jsonb, 
    FALSE, 
    TRUE
);