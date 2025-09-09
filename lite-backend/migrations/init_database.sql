-- ================================================================
-- 地聚物材料智能问答系统 - 完整数据库初始化脚本
-- ================================================================
-- 创建时间: 2025-06-19
-- 更新时间: 2025-06-23 (添加双向量化支持)
-- 版本: v3.0
-- 包含: 25个表，46个索引，14个触发器，双向量化配置
-- 新特性: 双向量系统 (通用向量 + 领域向量)
-- ================================================================

-- ================================================================
-- 基础表结构创建
-- ================================================================

-- 用户表
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    full_name VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    is_superuser BOOLEAN DEFAULT FALSE,
    organization VARCHAR(200),
    role VARCHAR(50),
    research_interests VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE,
    last_login TIMESTAMP WITH TIME ZONE
);

-- 用户偏好设置表
CREATE TABLE IF NOT EXISTS user_preferences (
    id VARCHAR(50) PRIMARY KEY,
    user_id VARCHAR(50),
    theme VARCHAR(20) DEFAULT 'light',
    language VARCHAR(10) DEFAULT 'zh',
    font_size VARCHAR(20) DEFAULT 'medium',
    auto_save BOOLEAN DEFAULT TRUE,
    show_sources BOOLEAN DEFAULT TRUE,
    show_confidence BOOLEAN DEFAULT TRUE,
    preferences JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE
);

-- 对话表
CREATE TABLE IF NOT EXISTS conversations (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(100) UNIQUE NOT NULL,
    title VARCHAR(200),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE
);

-- 对话消息表
CREATE TABLE IF NOT EXISTS conversation_messages (
    id SERIAL PRIMARY KEY,
    conversation_id INTEGER REFERENCES conversations(id) ON DELETE CASCADE,
    message_type VARCHAR(10) NOT NULL,
    content TEXT NOT NULL,
    confidence REAL,
    sources JSONB,
    images JSONB,
    tables JSONB,
    highlights JSONB,
    processing_time REAL,
    model_used VARCHAR(100),
    tokens_used INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 论文表
CREATE TABLE IF NOT EXISTS papers (
    id SERIAL PRIMARY KEY,
    title VARCHAR(500) NOT NULL,
    authors VARCHAR(1000) NOT NULL,
    journal VARCHAR(200),
    year INTEGER,
    pages VARCHAR(50),
    doi VARCHAR(100) UNIQUE,
    url VARCHAR(500),
    abstract TEXT,
    content TEXT,
    keywords JSONB,
    title_embedding JSONB,
    abstract_embedding JSONB,
    content_embedding JSONB,
    file_path VARCHAR(500),
    file_size INTEGER,
    processed VARCHAR(20) DEFAULT 'pending',
    confidence_score REAL DEFAULT 0.0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE
);

-- 知识库文档表
CREATE TABLE IF NOT EXISTS knowledge_documents (
    id VARCHAR(50) PRIMARY KEY,
    title VARCHAR(500) NOT NULL,
    filename VARCHAR(500) NOT NULL,
    file_type VARCHAR(50) NOT NULL,
    file_size INTEGER NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'uploaded',
    tags JSONB,
    metadata JSONB,
    vector_status JSONB,
    file_path VARCHAR(1000),
    upload_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE
);

-- 文档分块表（包含双向量化支持）
CREATE TABLE IF NOT EXISTS document_chunks (
    id VARCHAR(50) PRIMARY KEY,
    document_id VARCHAR(50) REFERENCES knowledge_documents(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    chunk_index INTEGER NOT NULL,
    
    -- 向后兼容的单向量字段
    embedding JSONB,
    embedding_model VARCHAR(100),
    
    -- 双向量化支持字段
    general_embedding JSONB,  -- 通用向量 (text-embedding-v4, 1536维)
    domain_embedding JSONB,   -- 领域向量 (matbert-base-v1, 768维)
    general_model VARCHAR(100),  -- 通用模型名称
    domain_model VARCHAR(100),   -- 领域模型名称
    vectorization_strategy VARCHAR(20),  -- 向量化策略: dual|general|domain
    
    -- 分块元数据
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE
);

-- 向量配置表
CREATE TABLE IF NOT EXISTS vector_configs (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    model VARCHAR(200) NOT NULL,
    dimension INTEGER NOT NULL,
    chunk_size INTEGER NOT NULL,
    chunk_overlap INTEGER NOT NULL,
    strategy VARCHAR(50) NOT NULL,
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE
);

-- 模型配置表
CREATE TABLE IF NOT EXISTS model_configs (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    type VARCHAR(50) NOT NULL,
    provider VARCHAR(100) NOT NULL,
    model VARCHAR(200) NOT NULL,
    api_key VARCHAR(500),
    base_url VARCHAR(500),
    parameters JSONB,
    is_active BOOLEAN DEFAULT TRUE,
    max_tokens INTEGER,
    temperature REAL,
    dimension INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE
);

-- 检索结果缓存表
CREATE TABLE IF NOT EXISTS retrieval_results (
    id VARCHAR(50) PRIMARY KEY,
    query TEXT NOT NULL,
    query_hash VARCHAR(100) NOT NULL,
    results JSONB NOT NULL,
    top_k INTEGER NOT NULL,
    threshold REAL,
    rerank BOOLEAN DEFAULT FALSE,
    model_used VARCHAR(200),
    retrieval_time REAL,
    total_matches INTEGER,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ================================================================
-- 多模态相关表结构
-- ================================================================

-- 媒体文件管理表
CREATE TABLE IF NOT EXISTS media_files (
    id VARCHAR(50) PRIMARY KEY,
    filename VARCHAR(500) NOT NULL,
    original_filename VARCHAR(500) NOT NULL,
    file_type VARCHAR(50) NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    file_size BIGINT NOT NULL,
    file_path VARCHAR(1000) NOT NULL,
    file_url VARCHAR(1000),
    file_hash VARCHAR(100),
    media_type VARCHAR(20) NOT NULL CHECK (media_type IN ('image', 'video', 'audio', 'document')),
    metadata JSONB,
    thumbnail_path VARCHAR(1000),
    duration REAL,
    dimensions JSONB,
    upload_source VARCHAR(50) DEFAULT 'user',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE
);

-- OCR识别结果表
CREATE TABLE IF NOT EXISTS ocr_results (
    id VARCHAR(50) PRIMARY KEY,
    media_file_id VARCHAR(50) REFERENCES media_files(id) ON DELETE CASCADE,
    text_content TEXT NOT NULL,
    confidence REAL,
    language VARCHAR(10),
    bounding_boxes JSONB,
    raw_result JSONB,
    ocr_engine VARCHAR(50) DEFAULT 'qwen-vl',
    processing_time REAL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 视频分析结果表
CREATE TABLE IF NOT EXISTS video_analysis (
    id VARCHAR(50) PRIMARY KEY,
    media_file_id VARCHAR(50) REFERENCES media_files(id) ON DELETE CASCADE,
    key_frames JSONB NOT NULL,
    scene_description TEXT,
    objects_detected JSONB,
    transcript TEXT,
    summary TEXT,
    analysis_model VARCHAR(100) DEFAULT 'qwen-vl-max',
    processing_time REAL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 多模态处理任务表
CREATE TABLE IF NOT EXISTS multimodal_tasks (
    id VARCHAR(50) PRIMARY KEY,
    task_type VARCHAR(50) NOT NULL CHECK (task_type IN ('ocr', 'video_analysis', 'image_captioning', 'visual_qa')),
    media_file_id VARCHAR(50) REFERENCES media_files(id) ON DELETE CASCADE,
    input_data JSONB NOT NULL,
    output_data JSONB,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
    progress INTEGER DEFAULT 0,
    model_used VARCHAR(100),
    error_message TEXT,
    processing_time REAL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE
);

-- 消息与媒体文件关联表
CREATE TABLE IF NOT EXISTS message_media_files (
    id VARCHAR(50) PRIMARY KEY,
    message_id INTEGER REFERENCES conversation_messages(id) ON DELETE CASCADE,
    media_file_id VARCHAR(50) REFERENCES media_files(id) ON DELETE CASCADE,
    media_role VARCHAR(20) NOT NULL CHECK (media_role IN ('input', 'output', 'reference')),
    order_index INTEGER DEFAULT 0,
    caption TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(message_id, media_file_id, media_role)
);

-- ================================================================
-- 知识图谱相关表结构
-- ================================================================

-- 图谱节点表
CREATE TABLE IF NOT EXISTS graph_nodes (
    id VARCHAR(50) PRIMARY KEY,
    label VARCHAR(500) NOT NULL,
    type VARCHAR(100) NOT NULL,
    properties JSONB,
    x REAL,
    y REAL,
    color VARCHAR(20),
    size REAL,
    connections INTEGER DEFAULT 0,
    level INTEGER,
    source_document_id VARCHAR(50),
    source_chunk_id VARCHAR(50),
    weight REAL DEFAULT 1.0,
    confidence REAL DEFAULT 0.0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE
);

-- 图谱边表
CREATE TABLE IF NOT EXISTS graph_edges (
    id VARCHAR(50) PRIMARY KEY,
    from_node_id VARCHAR(50) REFERENCES graph_nodes(id) ON DELETE CASCADE,
    to_node_id VARCHAR(50) REFERENCES graph_nodes(id) ON DELETE CASCADE,
    label VARCHAR(200) NOT NULL,
    type VARCHAR(100) NOT NULL,
    properties JSONB,
    weight REAL DEFAULT 1.0,
    confidence REAL DEFAULT 0.0,
    color VARCHAR(20),
    source_document_id VARCHAR(50),
    source_chunk_id VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE
);

-- 图谱布局表
CREATE TABLE IF NOT EXISTS graph_layouts (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    algorithm VARCHAR(50) NOT NULL,
    physics_config JSONB,
    node_config JSONB,
    edge_config JSONB,
    is_default BOOLEAN DEFAULT FALSE,
    graph_types JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE
);

-- 图谱过滤器表
CREATE TABLE IF NOT EXISTS graph_filters (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    node_types JSONB,
    edge_types JSONB,
    search_text VARCHAR(1000),
    view_mode VARCHAR(50) NOT NULL DEFAULT 'overview',
    min_connections INTEGER,
    max_connections INTEGER,
    confidence_threshold REAL,
    user_id VARCHAR(50),
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE
);

-- 图谱统计表
CREATE TABLE IF NOT EXISTS graph_stats (
    id VARCHAR(50) PRIMARY KEY,
    node_count INTEGER NOT NULL DEFAULT 0,
    edge_count INTEGER NOT NULL DEFAULT 0,
    avg_connections REAL NOT NULL DEFAULT 0.0,
    type_distribution JSONB,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    graph_version VARCHAR(50)
);

-- 图谱快照表
CREATE TABLE IF NOT EXISTS graph_snapshots (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    nodes_data JSONB NOT NULL,
    edges_data JSONB NOT NULL,
    layout_data JSONB,
    node_count INTEGER NOT NULL,
    edge_count INTEGER NOT NULL,
    created_by VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 图谱算法执行记录表
CREATE TABLE IF NOT EXISTS graph_algorithm_executions (
    id VARCHAR(50) PRIMARY KEY,
    algorithm_name VARCHAR(100) NOT NULL,
    parameters JSONB,
    result JSONB,
    execution_time REAL NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'completed',
    error_message TEXT,
    created_by VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ================================================================
-- 系统管理相关表结构
-- ================================================================

-- 文件处理任务表
CREATE TABLE IF NOT EXISTS file_processing_tasks (
    id VARCHAR(50) PRIMARY KEY,
    file_id VARCHAR(50) NOT NULL,
    task_type VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    progress INTEGER DEFAULT 0,
    result JSONB,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE
);

-- 系统配置表
CREATE TABLE IF NOT EXISTS system_configs (
    id VARCHAR(50) PRIMARY KEY,
    category VARCHAR(100) NOT NULL,
    key VARCHAR(200) NOT NULL,
    value JSONB NOT NULL,
    description TEXT,
    is_public BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(category, key)
);

-- 系统操作日志表
CREATE TABLE IF NOT EXISTS system_logs (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(50),
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(100),
    resource_id VARCHAR(100),
    details JSONB,
    ip_address INET,
    user_agent TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ================================================================
-- 索引创建
-- ================================================================

-- 用户相关索引
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);

-- 对话相关索引
CREATE INDEX IF NOT EXISTS idx_conversations_session_id ON conversations(session_id);
CREATE INDEX IF NOT EXISTS idx_conversation_messages_conversation_id ON conversation_messages(conversation_id);

-- 论文相关索引
CREATE INDEX IF NOT EXISTS idx_papers_title ON papers(title);
CREATE INDEX IF NOT EXISTS idx_papers_doi ON papers(doi);

-- 知识库相关索引
CREATE INDEX IF NOT EXISTS idx_knowledge_documents_title ON knowledge_documents(title);
CREATE INDEX IF NOT EXISTS idx_knowledge_documents_status ON knowledge_documents(status);
CREATE INDEX IF NOT EXISTS idx_document_chunks_document_id ON document_chunks(document_id);

-- 双向量化相关索引
CREATE INDEX IF NOT EXISTS idx_document_chunks_vectorization_strategy ON document_chunks(vectorization_strategy);
CREATE INDEX IF NOT EXISTS idx_document_chunks_general_model ON document_chunks(general_model);
CREATE INDEX IF NOT EXISTS idx_document_chunks_domain_model ON document_chunks(domain_model);

CREATE INDEX IF NOT EXISTS idx_retrieval_results_query_hash ON retrieval_results(query_hash);

-- 多模态相关索引
CREATE INDEX IF NOT EXISTS idx_media_files_media_type ON media_files(media_type);
CREATE INDEX IF NOT EXISTS idx_media_files_file_type ON media_files(file_type);
CREATE INDEX IF NOT EXISTS idx_media_files_file_hash ON media_files(file_hash);
CREATE INDEX IF NOT EXISTS idx_media_files_upload_source ON media_files(upload_source);
CREATE INDEX IF NOT EXISTS idx_ocr_results_media_file_id ON ocr_results(media_file_id);
CREATE INDEX IF NOT EXISTS idx_ocr_results_language ON ocr_results(language);
CREATE INDEX IF NOT EXISTS idx_ocr_results_confidence ON ocr_results(confidence);
CREATE INDEX IF NOT EXISTS idx_video_analysis_media_file_id ON video_analysis(media_file_id);
CREATE INDEX IF NOT EXISTS idx_video_analysis_model ON video_analysis(analysis_model);
CREATE INDEX IF NOT EXISTS idx_multimodal_tasks_task_type ON multimodal_tasks(task_type);
CREATE INDEX IF NOT EXISTS idx_multimodal_tasks_status ON multimodal_tasks(status);
CREATE INDEX IF NOT EXISTS idx_multimodal_tasks_media_file_id ON multimodal_tasks(media_file_id);
CREATE INDEX IF NOT EXISTS idx_message_media_files_message_id ON message_media_files(message_id);
CREATE INDEX IF NOT EXISTS idx_message_media_files_media_file_id ON message_media_files(media_file_id);
CREATE INDEX IF NOT EXISTS idx_message_media_files_role ON message_media_files(media_role);

-- 图谱相关索引
CREATE INDEX IF NOT EXISTS idx_graph_nodes_label ON graph_nodes(label);
CREATE INDEX IF NOT EXISTS idx_graph_nodes_type ON graph_nodes(type);
CREATE INDEX IF NOT EXISTS idx_graph_edges_from_node ON graph_edges(from_node_id);
CREATE INDEX IF NOT EXISTS idx_graph_edges_to_node ON graph_edges(to_node_id);
CREATE INDEX IF NOT EXISTS idx_graph_edges_type ON graph_edges(type);
CREATE INDEX IF NOT EXISTS idx_graph_algorithm_executions_algorithm ON graph_algorithm_executions(algorithm_name);
CREATE INDEX IF NOT EXISTS idx_graph_algorithm_executions_status ON graph_algorithm_executions(status);

-- 系统管理相关索引
CREATE INDEX IF NOT EXISTS idx_file_processing_tasks_file_id ON file_processing_tasks(file_id);
CREATE INDEX IF NOT EXISTS idx_file_processing_tasks_status ON file_processing_tasks(status);
CREATE INDEX IF NOT EXISTS idx_system_configs_category ON system_configs(category);
CREATE INDEX IF NOT EXISTS idx_system_logs_user_id ON system_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_system_logs_action ON system_logs(action);
CREATE INDEX IF NOT EXISTS idx_system_logs_timestamp ON system_logs(timestamp);

-- ================================================================
-- 触发器函数和触发器创建
-- ================================================================

-- 创建触发器函数用于更新时间戳
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 为需要的表创建更新时间戳触发器
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_preferences_updated_at ON user_preferences;
CREATE TRIGGER update_user_preferences_updated_at 
    BEFORE UPDATE ON user_preferences 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_conversations_updated_at ON conversations;
CREATE TRIGGER update_conversations_updated_at 
    BEFORE UPDATE ON conversations 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_papers_updated_at ON papers;
CREATE TRIGGER update_papers_updated_at 
    BEFORE UPDATE ON papers 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_knowledge_documents_updated_at ON knowledge_documents;
CREATE TRIGGER update_knowledge_documents_updated_at 
    BEFORE UPDATE ON knowledge_documents 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_document_chunks_updated_at ON document_chunks;
CREATE TRIGGER update_document_chunks_updated_at 
    BEFORE UPDATE ON document_chunks 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_vector_configs_updated_at ON vector_configs;
CREATE TRIGGER update_vector_configs_updated_at 
    BEFORE UPDATE ON vector_configs 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_model_configs_updated_at ON model_configs;
CREATE TRIGGER update_model_configs_updated_at 
    BEFORE UPDATE ON model_configs 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_media_files_updated_at ON media_files;
CREATE TRIGGER update_media_files_updated_at 
    BEFORE UPDATE ON media_files 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_graph_nodes_updated_at ON graph_nodes;
CREATE TRIGGER update_graph_nodes_updated_at 
    BEFORE UPDATE ON graph_nodes 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_graph_edges_updated_at ON graph_edges;
CREATE TRIGGER update_graph_edges_updated_at 
    BEFORE UPDATE ON graph_edges 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_graph_layouts_updated_at ON graph_layouts;
CREATE TRIGGER update_graph_layouts_updated_at 
    BEFORE UPDATE ON graph_layouts 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_graph_filters_updated_at ON graph_filters;
CREATE TRIGGER update_graph_filters_updated_at 
    BEFORE UPDATE ON graph_filters 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_system_configs_updated_at ON system_configs;
CREATE TRIGGER update_system_configs_updated_at 
    BEFORE UPDATE ON system_configs 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ================================================================
-- 初始数据插入
-- ================================================================

-- 默认向量配置（更新为双向量系统）
INSERT INTO vector_configs (id, name, model, dimension, chunk_size, chunk_overlap, strategy, is_default) 
VALUES 
(
    'dual-vector-config',
    '双向量配置 (通用+领域)',
    'dual-vector',
    2304,  -- 1536 + 768
    500,
    50,
    'dual',
    TRUE
),
(
    'general-vector-config',
    '通用向量配置 (text-embedding-v4)',
    'text-embedding-v4',
    1536,
    500,
    50,
    'general',
    FALSE
),
(
    'domain-vector-config',
    '领域向量配置 (matbert-base-v1)',
    'matbert-base-v1',
    768,
    400,
    40,
    'domain',
    FALSE
) ON CONFLICT (id) DO NOTHING;

-- 默认模型配置（更新为当前实际使用的模型）
INSERT INTO model_configs (id, name, type, provider, model, parameters, is_active, max_tokens, temperature, dimension) 
VALUES 
-- 嵌入模型
(
    'one-api-text-embedding-v4',
    'One API Text Embedding V4',
    'embedding',
    'one_api_embedding',
    'text-embedding-v4',
    '{"dimension": 1536, "api_type": "one_api"}',
    TRUE,
    NULL,
    NULL,
    1536
),
(
    'matbert-base-v1',
    'MatBERT 材料科学领域嵌入模型',
    'embedding',
    'matbert_embedding',
    'matbert-base-v1',
    '{"dimension": 768, "max_length": 512, "model_type": "bert", "domain": "materials"}',
    TRUE,
    NULL,
    NULL,
    768
),
-- 对话模型（当前实际使用的模型）
(
    'qwen-plus-latest',
    'Qwen Plus 最新版对话模型',
    'chat',
    'one_api',
    'qwen-plus-latest',
    '{"max_tokens": 8192, "temperature": 0.7, "top_p": 0.95, "api_type": "one_api"}',
    TRUE,
    8192,
    0.7,
    NULL
),
(
    'gpt-4o-mini',
    'GPT-4O Mini 轻量对话模型',
    'chat',
    'one_api',
    'gpt-4o-mini',
    '{"max_tokens": 4096, "temperature": 0.7, "top_p": 0.95, "api_type": "one_api"}',
    TRUE,
    4096,
    0.7,
    NULL
),
(
    'gemini-flash-thinking',
    'Gemini 2.5 Flash 思考型模型',
    'chat',
    'one_api',
    'gemini-2.5-flash-preview-thinking',
    '{"max_tokens": 8192, "temperature": 0.6, "top_p": 0.9, "api_type": "one_api", "thinking_mode": true}',
    TRUE,
    8192,
    0.6,
    NULL
)
-- 双向量化系统模型配置完成
ON CONFLICT (id) DO NOTHING;

-- 添加双向量化配置注释
COMMENT ON COLUMN document_chunks.general_embedding IS '通用向量嵌入 (text-embedding-v4, 1536维)';
COMMENT ON COLUMN document_chunks.domain_embedding IS '领域向量嵌入 (matbert-base-v1, 768维)';
COMMENT ON COLUMN document_chunks.general_model IS '通用向量模型名称';
COMMENT ON COLUMN document_chunks.domain_model IS '领域向量模型名称';
COMMENT ON COLUMN document_chunks.vectorization_strategy IS '向量化策略: dual|general|domain';

-- 默认图谱布局
INSERT INTO graph_layouts (id, name, algorithm, physics_config, node_config, edge_config, is_default) 
VALUES (
    'default-spring-layout',
    '默认弹簧布局',
    'spring',
    '{"enabled": true, "stabilization": {"iterations": 100}, "barnesHut": {"gravitationalConstant": -2000, "centralGravity": 0.3, "springLength": 95, "springConstant": 0.04, "damping": 0.09}}',
    '{"shape": "dot", "size": 16, "font": {"size": 12}, "borderWidth": 2}',
    '{"width": 1, "smooth": {"type": "continuous", "enabled": true}, "arrows": {"to": {"enabled": true}}}',
    TRUE
) ON CONFLICT (id) DO NOTHING;

-- 默认图谱过滤器
INSERT INTO graph_filters (id, name, node_types, edge_types, search_text, view_mode, is_default) 
VALUES (
    'default-filter',
    '默认过滤器',
    NULL,
    NULL,
    NULL,
    'overview',
    TRUE
) ON CONFLICT (id) DO NOTHING;

-- 系统配置
INSERT INTO system_configs (id, category, key, value, description, is_public) 
VALUES 
-- 应用基础配置
(
    'app-basic-config',
    'application',
    'basic_settings',
    '{"name": "地聚物材料智能问答系统", "version": "1.0.0", "environment": "development"}',
    '应用基础配置',
    TRUE
),
-- 文件上传配置
(
    'upload-config',
    'upload',
    'file_settings',
    '{"max_file_size": 10485760, "allowed_extensions": ["pdf", "docx", "txt", "md"], "chunk_size": 8192}',
    '文件上传配置',
    TRUE
),
-- 检索配置
(
    'search-config',
    'search',
    'retrieval_settings',
    '{"default_top_k": 10, "default_threshold": 0.7, "enable_rerank": true, "cache_ttl": 3600}',
    '检索配置',
    TRUE
),
-- 图谱可视化配置
(
    'graph-config',
    'graph',
    'visualization_settings',
    '{"default_layout": "spring", "node_limit": 1000, "edge_limit": 5000, "physics_enabled": true}',
    '图谱可视化配置',
    TRUE
),
-- 多模态处理配置
(
    'multimodal-config',
    'multimodal',
    'processing_settings',
    '{"max_image_size": "2048x2048", "max_video_duration": 300, "supported_image_formats": ["jpg", "jpeg", "png", "webp", "bmp"], "supported_video_formats": ["mp4", "avi", "mov"], "ocr_enabled": true, "video_analysis_enabled": true, "thumbnail_generation": true}',
    '多模态处理配置',
    TRUE
),
-- 多模态模型配置
(
    'multimodal-models',
    'multimodal',
    'model_settings',
    '{"default_vl_model": "qwen-vl-chat-model", "ocr_model": "qwen-vl-plus-model", "video_model": "qwen-vl-max-model", "auto_model_selection": true}',
    '多模态模型配置',
    TRUE
),
-- 媒体存储配置
(
    'media-storage',
    'storage',
    'media_settings',
    '{"base_path": "/uploads/media", "thumbnail_path": "/uploads/thumbnails", "max_file_size": 52428800, "storage_type": "local", "cleanup_interval": 86400}',
    '媒体文件存储配置',
    TRUE
) ON CONFLICT (id) DO NOTHING;

-- ================================================================
-- 双向量化系统说明
-- ================================================================
-- 
-- 双向量化系统特性:
-- 1. 支持三种向量化策略:
--    - dual: 同时使用通用向量和领域向量
--    - general: 仅使用通用向量 (text-embedding-v4, 1536维)
--    - domain: 仅使用领域向量 (matbert-base-v1, 768维)
--
-- 2. 向量模型配置:
--    - 通用模型: one_api_embedding/text-embedding-v4 (1536维)
--    - 领域模型: matbert_embedding/matbert-base-v1 (768维)
--    - 合计维度: 2304维 (双向量模式)
--
-- 3. 聊天模型配置:
--    - qwen-plus-latest: 主要对话模型
--    - gpt-4o-mini: 轻量对话模型
--    - gemini-2.5-flash-preview-thinking: 思考型模型
--
-- 4. 数据库字段说明:
--    - general_embedding: 通用向量存储
--    - domain_embedding: 领域向量存储
--    - general_model: 通用模型名称
--    - domain_model: 领域模型名称
--    - vectorization_strategy: 向量化策略标识
--
-- ================================================================
-- 数据库初始化完成
-- ================================================================

-- 显示初始化统计信息
DO $$
DECLARE
    table_count INTEGER;
    index_count INTEGER;
    config_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO table_count FROM information_schema.tables WHERE table_schema = 'public';
    SELECT COUNT(*) INTO index_count FROM pg_indexes WHERE schemaname = 'public' AND indexname NOT LIKE '%_pkey';
    SELECT COUNT(*) INTO config_count FROM system_configs;
    
    RAISE NOTICE '================================================================';
    RAISE NOTICE '数据库初始化完成！';
    RAISE NOTICE '总计表数量: %', table_count;
    RAISE NOTICE '总计索引数量: %', index_count;
    RAISE NOTICE '总计配置数量: %', config_count;
    RAISE NOTICE '================================================================';
END $$;