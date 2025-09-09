-- 添加文档切分配置表
-- 执行时间: 2025-07-01

CREATE TABLE IF NOT EXISTS chunking_configs (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(100) NOT NULL COMMENT '配置名称',
    description TEXT COMMENT '配置描述',
    
    -- 切分策略
    strategy VARCHAR(20) NOT NULL DEFAULT 'semantic' COMMENT '切分策略: semantic, fixed, naive',
    
    -- 基本参数
    chunk_token_num INTEGER NOT NULL DEFAULT 400 COMMENT '最小token数',
    max_token_num INTEGER NOT NULL DEFAULT 512 COMMENT '最大token数',
    chunk_overlap INTEGER NOT NULL DEFAULT 50 COMMENT '重叠token数',
    
    -- 分隔符设置
    delimiter VARCHAR(50) NOT NULL DEFAULT '!?。！？' COMMENT '分隔符',
    
    -- 高级设置
    tokenizer_type VARCHAR(20) NOT NULL DEFAULT 'simple' COMMENT '分词器类型: simple, advanced',
    preserve_structure BOOLEAN NOT NULL DEFAULT TRUE COMMENT '是否保留文档结构',
    semantic_threshold INTEGER NOT NULL DEFAULT 30 COMMENT '语义相关性阈值(百分比)',
    
    -- 文件类型支持
    supported_formats JSON COMMENT '支持的文件格式',
    
    -- 状态管理
    is_default BOOLEAN NOT NULL DEFAULT FALSE COMMENT '是否为默认配置',
    is_active BOOLEAN NOT NULL DEFAULT TRUE COMMENT '是否启用',
    
    -- 时间戳
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    
    -- 索引
    INDEX idx_chunking_configs_strategy (strategy),
    INDEX idx_chunking_configs_is_default (is_default),
    INDEX idx_chunking_configs_is_active (is_active),
    INDEX idx_chunking_configs_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='文档切分配置表';

-- 插入默认配置
INSERT IGNORE INTO chunking_configs (
    id, name, description, strategy, chunk_token_num, max_token_num, 
    chunk_overlap, delimiter, tokenizer_type, preserve_structure, 
    semantic_threshold, supported_formats, is_default, is_active
) VALUES
(
    'default-general-config', 
    '通用文档切分', 
    '适合大多数文档的通用切分配置，平衡切分质量和处理效率',
    'semantic', 
    400, 
    512, 
    50, 
    '!?。！？.;', 
    'simple', 
    TRUE, 
    30, 
    JSON_ARRAY('txt', 'md', 'pdf', 'docx'), 
    TRUE, 
    TRUE
),
(
    'academic-paper-config', 
    '学术论文切分', 
    '专门针对学术论文的切分配置，保留更多结构信息',
    'semantic', 
    300, 
    600, 
    80, 
    '!?。！？.;', 
    'advanced', 
    TRUE, 
    40, 
    JSON_ARRAY('pdf', 'docx', 'txt'), 
    FALSE, 
    TRUE
),
(
    'fast-processing-config', 
    '快速处理切分', 
    '快速处理模式，适合大批量文档的快速切分',
    'fixed', 
    256, 
    400, 
    20, 
    '。！？', 
    'simple', 
    FALSE, 
    20, 
    JSON_ARRAY('txt', 'md'), 
    FALSE, 
    TRUE
),
(
    'fine-grained-config', 
    '精细切分', 
    '高质量精细切分，适合重要文档的详细分析',
    'semantic', 
    200, 
    400, 
    100, 
    '!?。！？.;,:：，', 
    'advanced', 
    TRUE, 
    50, 
    JSON_ARRAY('pdf', 'docx', 'md', 'txt'), 
    FALSE, 
    TRUE
);

-- 验证插入
SELECT 
    COUNT(*) as config_count,
    SUM(CASE WHEN is_default = TRUE THEN 1 ELSE 0 END) as default_count
FROM chunking_configs
WHERE is_active = TRUE;