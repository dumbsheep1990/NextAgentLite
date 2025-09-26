-- ========================================
-- MAT-DEMO 数据库表创建SQL
-- 基于SQLAlchemy模型生成
-- ========================================

-- 清理已存在的表（谨慎使用）
-- DROP TABLE IF EXISTS conversation_messages CASCADE;
-- DROP TABLE IF EXISTS conversations CASCADE;
-- DROP TABLE IF EXISTS document_chunks CASCADE;
-- DROP TABLE IF EXISTS knowledge_documents CASCADE;
-- DROP TABLE IF EXISTS retrieval_results CASCADE;
-- DROP TABLE IF EXISTS model_configs CASCADE;
-- DROP TABLE IF EXISTS vector_configs CASCADE;
-- DROP TABLE IF EXISTS agent_configs CASCADE;
-- DROP TABLE IF EXISTS papers CASCADE;
-- DROP TABLE IF EXISTS users CASCADE;
-- DROP TABLE IF EXISTS chunking_configs CASCADE;
-- DROP TABLE IF EXISTS graph_nodes CASCADE;
-- DROP TABLE IF EXISTS graph_edges CASCADE;
-- DROP TABLE IF EXISTS graph_layouts CASCADE;
-- DROP TABLE IF EXISTS graph_filters CASCADE;
-- DROP TABLE IF EXISTS graph_stats CASCADE;
-- DROP TABLE IF EXISTS graph_snapshots CASCADE;
-- DROP TABLE IF EXISTS qa_datasets CASCADE;
-- DROP TABLE IF EXISTS qa_pairs CASCADE;
-- DROP TABLE IF EXISTS qa_categories CASCADE;

-- ========================================
-- 1. 用户表
-- ========================================
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    is_superuser BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);

-- ========================================
-- 2. 对话相关表
-- ========================================

-- 对话会话表
CREATE TABLE conversations (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(100) UNIQUE NOT NULL,
    title VARCHAR(200),
    conversation_type VARCHAR(20) DEFAULT 'single',  -- 'single', 'team'
    team_name VARCHAR(100),
    team_mode VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_conversations_session_id ON conversations(session_id);
CREATE INDEX idx_conversations_type ON conversations(conversation_type);
CREATE INDEX idx_conversations_created_at ON conversations(created_at);

-- 对话消息表
CREATE TABLE conversation_messages (
    id SERIAL PRIMARY KEY,
    conversation_id INTEGER REFERENCES conversations(id) ON DELETE CASCADE,
    message_type VARCHAR(10) NOT NULL,  -- 'user' or 'ai'
    content TEXT NOT NULL,
    confidence REAL,
    sources JSONB,  -- 引用的论文来源
    knowledge_sources JSONB,  -- 知识库检索来源
    images JSONB,  -- 生成的图表/图片
    tables JSONB,  -- 数据表格
    agent_name VARCHAR(100),
    model_name VARCHAR(100),
    processing_time REAL,
    metadata JSONB,  -- 其他元数据
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_conversation_messages_conversation_id ON conversation_messages(conversation_id);
CREATE INDEX idx_conversation_messages_type ON conversation_messages(message_type);
CREATE INDEX idx_conversation_messages_created_at ON conversation_messages(created_at);

-- 对话消息反馈表（点赞/点踩）
CREATE TABLE IF NOT EXISTS conversation_message_reactions (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(100) NOT NULL,
    conversation_id INTEGER REFERENCES conversations(id) ON DELETE SET NULL,
    message_id INTEGER REFERENCES conversation_messages(id) ON DELETE SET NULL,
    message_type VARCHAR(10), -- 'user' | 'ai'
    content TEXT NOT NULL,
    mark VARCHAR(10) NOT NULL, -- 'like' | 'dislike'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_cmr_session_id ON conversation_message_reactions(session_id);
CREATE INDEX IF NOT EXISTS idx_cmr_mark ON conversation_message_reactions(mark);

-- 用户智能体发布记录表
CREATE TABLE IF NOT EXISTS user_agent_releases (
    id SERIAL PRIMARY KEY,
    agent_id VARCHAR(100) NOT NULL,
    user_id INTEGER,
    version INTEGER NOT NULL,
    snapshot JSONB, -- 发布时的配置快照
    notes TEXT,
    published_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_uar_agent ON user_agent_releases(agent_id);
CREATE INDEX IF NOT EXISTS idx_uar_user ON user_agent_releases(user_id);
CREATE INDEX IF NOT EXISTS idx_uar_published_at ON user_agent_releases(published_at DESC);

-- 用户智能体发布状态（启用/禁用/删除）
CREATE TABLE IF NOT EXISTS user_agent_publish_status (
    agent_id VARCHAR(100) PRIMARY KEY,
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    deleted BOOLEAN NOT NULL DEFAULT FALSE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ========================================
-- 3. 知识库相关表
-- ========================================

-- 知识库文档表
CREATE TABLE knowledge_documents (
    id VARCHAR(50) PRIMARY KEY,  -- UUID
    title VARCHAR(500) NOT NULL,
    filename VARCHAR(500) NOT NULL,
    file_type VARCHAR(50) NOT NULL,
    file_size INTEGER NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',  -- pending, processing, vectorized, failed, graph_extracted
    tags JSONB,  -- 标签数组
    document_metadata JSONB,  -- 包含author, keywords, description, language等
    vector_status JSONB,  -- 包含progress, model, chunks等信息
    file_path VARCHAR(1000),
    upload_time TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE INDEX idx_knowledge_documents_title ON knowledge_documents(title);
CREATE INDEX idx_knowledge_documents_status ON knowledge_documents(status);
CREATE INDEX idx_knowledge_documents_file_type ON knowledge_documents(file_type);
CREATE INDEX idx_knowledge_documents_created_at ON knowledge_documents(created_at);

-- 文档分块表
CREATE TABLE document_chunks (
    id VARCHAR(50) PRIMARY KEY,  -- UUID
    document_id VARCHAR(50) REFERENCES knowledge_documents(id) ON DELETE CASCADE,
    chunk_index INTEGER NOT NULL,
    content TEXT NOT NULL,
    content_type VARCHAR(50) DEFAULT 'text',
    metadata JSONB,  -- 包含页码、章节等信息
    embedding_vectors JSONB,  -- 向量嵌入
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_document_chunks_document_id ON document_chunks(document_id);
CREATE INDEX idx_document_chunks_chunk_index ON document_chunks(chunk_index);
CREATE INDEX idx_document_chunks_content_type ON document_chunks(content_type);

-- 向量配置表
CREATE TABLE vector_configs (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    model_provider VARCHAR(50) NOT NULL,
    model_name VARCHAR(100) NOT NULL,
    embedding_dimension INTEGER NOT NULL,
    chunk_size INTEGER DEFAULT 1000,
    chunk_overlap INTEGER DEFAULT 200,
    is_active BOOLEAN DEFAULT true,
    config_data JSONB,  -- 其他配置参数
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_vector_configs_name ON vector_configs(name);
CREATE INDEX idx_vector_configs_provider ON vector_configs(model_provider);

-- 模型配置表
CREATE TABLE model_configs (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    model_type VARCHAR(50) NOT NULL,  -- 'chat', 'embedding'
    provider VARCHAR(50) NOT NULL,
    model VARCHAR(100) NOT NULL,
    parameters JSONB,  -- 模型参数
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_model_configs_name ON model_configs(name);
CREATE INDEX idx_model_configs_type ON model_configs(model_type);
CREATE INDEX idx_model_configs_provider ON model_configs(provider);

-- 检索结果表
CREATE TABLE retrieval_results (
    id SERIAL PRIMARY KEY,
    query_hash VARCHAR(64) NOT NULL,  -- 查询的哈希值
    query_text TEXT NOT NULL,
    results JSONB NOT NULL,  -- 检索结果
    retrieval_params JSONB,  -- 检索参数
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_retrieval_results_query_hash ON retrieval_results(query_hash);
CREATE INDEX idx_retrieval_results_created_at ON retrieval_results(created_at);

-- ========================================
-- 4. Agent配置表
-- ========================================
CREATE TABLE agent_configs (
    id SERIAL PRIMARY KEY,
    agent_name VARCHAR(100) UNIQUE NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    description TEXT,
    model_provider VARCHAR(50) NOT NULL,
    model_id VARCHAR(100) NOT NULL,
    temperature REAL DEFAULT 0.7,
    max_tokens INTEGER DEFAULT 2000,
    system_prompt TEXT,
    instructions JSONB,  -- 指令列表
    tools JSONB,  -- 工具配置
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_agent_configs_name ON agent_configs(agent_name);
CREATE INDEX idx_agent_configs_provider ON agent_configs(model_provider);
CREATE INDEX idx_agent_configs_active ON agent_configs(is_active);

-- ========================================
-- 5. 论文表
-- ========================================
CREATE TABLE papers (
    id SERIAL PRIMARY KEY,
    title VARCHAR(500) NOT NULL,
    authors TEXT,
    abstract TEXT,
    keywords TEXT,
    doi VARCHAR(100),
    arxiv_id VARCHAR(50),
    publication_date DATE,
    journal VARCHAR(200),
    pdf_url VARCHAR(500),
    file_path VARCHAR(500),
    status VARCHAR(20) DEFAULT 'pending',  -- pending, downloaded, processed
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_papers_title ON papers(title);
CREATE INDEX idx_papers_doi ON papers(doi);
CREATE INDEX idx_papers_arxiv_id ON papers(arxiv_id);
CREATE INDEX idx_papers_status ON papers(status);
CREATE INDEX idx_papers_publication_date ON papers(publication_date);

-- ========================================
-- 6. 分块配置表
-- ========================================
CREATE TABLE chunking_configs (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    chunk_size INTEGER NOT NULL DEFAULT 1000,
    chunk_overlap INTEGER NOT NULL DEFAULT 200,
    chunking_strategy VARCHAR(50) DEFAULT 'recursive',  -- recursive, semantic, fixed
    separator_patterns JSONB,  -- 分隔符模式
    metadata_extraction JSONB,  -- 元数据提取规则
    is_default BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_chunking_configs_name ON chunking_configs(name);
CREATE INDEX idx_chunking_configs_default ON chunking_configs(is_default);

-- ========================================
-- 7. 知识图谱相关表
-- ========================================

-- 图谱节点表
CREATE TABLE graph_nodes (
    id VARCHAR(50) PRIMARY KEY,  -- UUID
    node_type VARCHAR(50) NOT NULL,  -- entity_type like 'Material', 'Property', etc.
    name VARCHAR(200) NOT NULL,
    properties JSONB,  -- 节点属性
    embedding_vector JSONB,  -- 节点嵌入向量
    source_documents JSONB,  -- 来源文档
    confidence REAL DEFAULT 1.0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_graph_nodes_type ON graph_nodes(node_type);
CREATE INDEX idx_graph_nodes_name ON graph_nodes(name);
CREATE INDEX idx_graph_nodes_created_at ON graph_nodes(created_at);

-- 图谱边表
CREATE TABLE graph_edges (
    id VARCHAR(50) PRIMARY KEY,  -- UUID
    source_node_id VARCHAR(50) REFERENCES graph_nodes(id) ON DELETE CASCADE,
    target_node_id VARCHAR(50) REFERENCES graph_nodes(id) ON DELETE CASCADE,
    edge_type VARCHAR(50) NOT NULL,  -- relationship type
    properties JSONB,  -- 边属性
    weight REAL DEFAULT 1.0,
    confidence REAL DEFAULT 1.0,
    source_documents JSONB,  -- 来源文档
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_graph_edges_source ON graph_edges(source_node_id);
CREATE INDEX idx_graph_edges_target ON graph_edges(target_node_id);
CREATE INDEX idx_graph_edges_type ON graph_edges(edge_type);

-- 图谱布局表
CREATE TABLE graph_layouts (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    layout_type VARCHAR(50) NOT NULL,  -- 'force', 'hierarchical', 'circular', etc.
    node_positions JSONB NOT NULL,  -- 节点位置信息
    layout_params JSONB,  -- 布局参数
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_graph_layouts_name ON graph_layouts(name);
CREATE INDEX idx_graph_layouts_type ON graph_layouts(layout_type);

-- 图谱过滤器表
CREATE TABLE graph_filters (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    filter_type VARCHAR(50) NOT NULL,  -- 'node_type', 'edge_type', 'property', etc.
    filter_criteria JSONB NOT NULL,  -- 过滤条件
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_graph_filters_name ON graph_filters(name);
CREATE INDEX idx_graph_filters_type ON graph_filters(filter_type);

-- 图谱统计表
CREATE TABLE graph_stats (
    id SERIAL PRIMARY KEY,
    stat_date DATE NOT NULL,
    node_count INTEGER DEFAULT 0,
    edge_count INTEGER DEFAULT 0,
    node_type_distribution JSONB,  -- 节点类型分布
    edge_type_distribution JSONB,  -- 边类型分布
    density REAL DEFAULT 0.0,
    clustering_coefficient REAL DEFAULT 0.0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_graph_stats_date ON graph_stats(stat_date);

-- 图谱快照表
CREATE TABLE graph_snapshots (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    snapshot_data JSONB NOT NULL,  -- 完整的图谱数据快照
    node_count INTEGER DEFAULT 0,
    edge_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_graph_snapshots_name ON graph_snapshots(name);
CREATE INDEX idx_graph_snapshots_created_at ON graph_snapshots(created_at);

-- ========================================
-- 8. QA数据集相关表
-- ========================================

-- QA数据集表
CREATE TABLE qa_datasets (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    dataset_type VARCHAR(50) DEFAULT 'general',  -- general, domain_specific, benchmark
    language VARCHAR(10) DEFAULT 'zh',
    total_pairs INTEGER DEFAULT 0,
    metadata JSONB,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_qa_datasets_name ON qa_datasets(name);
CREATE INDEX idx_qa_datasets_type ON qa_datasets(dataset_type);

-- QA分类表
CREATE TABLE qa_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    parent_id INTEGER REFERENCES qa_categories(id),
    dataset_id INTEGER REFERENCES qa_datasets(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_qa_categories_name ON qa_categories(name);
CREATE INDEX idx_qa_categories_dataset ON qa_categories(dataset_id);

-- QA问答对表
CREATE TABLE qa_pairs (
    id SERIAL PRIMARY KEY,
    dataset_id INTEGER REFERENCES qa_datasets(id) ON DELETE CASCADE,
    category_id INTEGER REFERENCES qa_categories(id),
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    question_type VARCHAR(50),  -- factual, reasoning, comparison, etc.
    difficulty VARCHAR(20) DEFAULT 'medium',  -- easy, medium, hard
    keywords JSONB,  -- 关键词标签
    source_documents JSONB,  -- 来源文档
    quality_score REAL DEFAULT 1.0,
    is_verified BOOLEAN DEFAULT false,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_qa_pairs_dataset ON qa_pairs(dataset_id);
CREATE INDEX idx_qa_pairs_category ON qa_pairs(category_id);
CREATE INDEX idx_qa_pairs_type ON qa_pairs(question_type);
CREATE INDEX idx_qa_pairs_difficulty ON qa_pairs(difficulty);

-- ========================================
-- 9. 创建更新时间触发器函数
-- ========================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 为所有有updated_at字段的表创建触发器
CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON conversations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_knowledge_documents_updated_at BEFORE UPDATE ON knowledge_documents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_document_chunks_updated_at BEFORE UPDATE ON document_chunks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_vector_configs_updated_at BEFORE UPDATE ON vector_configs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_model_configs_updated_at BEFORE UPDATE ON model_configs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_agent_configs_updated_at BEFORE UPDATE ON agent_configs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_papers_updated_at BEFORE UPDATE ON papers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_chunking_configs_updated_at BEFORE UPDATE ON chunking_configs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_graph_nodes_updated_at BEFORE UPDATE ON graph_nodes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_graph_edges_updated_at BEFORE UPDATE ON graph_edges FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_graph_layouts_updated_at BEFORE UPDATE ON graph_layouts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_qa_datasets_updated_at BEFORE UPDATE ON qa_datasets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_qa_pairs_updated_at BEFORE UPDATE ON qa_pairs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- 10. 插入默认数据
-- ========================================

-- 默认分块配置
INSERT INTO chunking_configs (name, description, chunk_size, chunk_overlap, is_default, is_active) VALUES
('default', '默认分块配置', 1000, 200, true, true),
('small_chunks', '小分块配置', 500, 100, false, true),
('large_chunks', '大分块配置', 2000, 400, false, true);

-- 默认向量配置
INSERT INTO vector_configs (name, model_provider, model_name, embedding_dimension, is_active) VALUES
('default_embedding', 'openai', 'text-embedding-ada-002', 1536, true),
('matbert_embedding', 'matbert', 'matbert-embedding', 768, true);

-- 默认模型配置
INSERT INTO model_configs (name, model_type, provider, model, parameters, is_active) VALUES
('default_chat', 'chat', 'openai', 'gpt-3.5-turbo', '{"temperature": 0.7, "max_tokens": 2000}', true),
('qwen_chat', 'chat', 'one_api', 'qwen-turbo', '{"temperature": 0.7, "max_tokens": 2000}', true);

-- 默认QA数据集
INSERT INTO qa_datasets (name, description, dataset_type, language, is_active) VALUES
('geopolymer_qa', '地聚物材料问答数据集', 'domain_specific', 'zh', true),
('general_qa', '通用问答数据集', 'general', 'zh', true);

-- ========================================
-- 完成
-- ========================================
COMMENT ON DATABASE mat_demo IS 'MAT-DEMO 材料问答系统数据库';

-- 创建数据库用户和权限（可选）
-- CREATE USER mat_demo_user WITH PASSWORD 'your_password';
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO mat_demo_user;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO mat_demo_user;

-- 查看所有表
SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;
