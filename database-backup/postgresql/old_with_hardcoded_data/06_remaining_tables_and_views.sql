-- Remaining Tables and Views Schema Export
-- Generated from zzdsj_demo database
-- Date: 2025-08-27

-- ============================================================================
-- METADATA AND TEMPLATE TABLES
-- ============================================================================

CREATE TABLE metadata_templates (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    version VARCHAR(20) NOT NULL DEFAULT '1.0',
    template_schema JSONB NOT NULL,
    ui_schema JSONB,
    validation_rules JSONB,
    is_active BOOLEAN DEFAULT true,
    is_system BOOLEAN DEFAULT false,
    category VARCHAR(100),
    tags TEXT[],
    usage_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER
);

CREATE TABLE document_categories (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    display_name VARCHAR(200) NOT NULL,
    description TEXT,
    parent_id VARCHAR(50),
    level INTEGER NOT NULL DEFAULT 1,
    path VARCHAR(500) NOT NULL,
    storage_prefix VARCHAR(200) NOT NULL,
    retention_policy JSONB,
    importance_level VARCHAR(20) DEFAULT 'medium',
    is_active BOOLEAN DEFAULT true,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_id) REFERENCES document_categories(id)
);

CREATE TABLE document_category_mappings (
    id VARCHAR(50) PRIMARY KEY,
    document_id VARCHAR(50) NOT NULL,
    category_id VARCHAR(50) NOT NULL,
    classification_method VARCHAR(50) NOT NULL,
    confidence_score DOUBLE PRECISION,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (document_id) REFERENCES knowledge_documents(id),
    FOREIGN KEY (category_id) REFERENCES document_categories(id)
);

CREATE TABLE document_classification_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rule_name VARCHAR(200) NOT NULL,
    description TEXT,
    category_id VARCHAR(50) NOT NULL,
    rule_type VARCHAR(50) NOT NULL,
    rule_config JSONB NOT NULL,
    priority INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES document_categories(id)
);

-- ============================================================================
-- ADDITIONAL SYSTEM TABLES
-- ============================================================================

CREATE TABLE papers (
    id VARCHAR(50) PRIMARY KEY,
    title VARCHAR(1000) NOT NULL,
    authors TEXT,
    abstract TEXT,
    publication_date DATE,
    journal VARCHAR(500),
    doi VARCHAR(200),
    url TEXT,
    keywords TEXT[],
    pdf_path VARCHAR(1000),
    status VARCHAR(20) DEFAULT 'imported',
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ
);

CREATE TABLE retrieval_results (
    id SERIAL PRIMARY KEY,
    query_id VARCHAR(100) NOT NULL,
    source_type VARCHAR(50) NOT NULL,
    source_id VARCHAR(100) NOT NULL,
    title TEXT,
    content TEXT,
    score REAL NOT NULL,
    retrieval_method VARCHAR(50),
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE qa_retrieval_history (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(100) NOT NULL,
    question TEXT NOT NULL,
    retrieval_results JSONB,
    retrieval_stats JSONB,
    model_used VARCHAR(100),
    response_time_ms INTEGER,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE thinking_steps (
    id SERIAL PRIMARY KEY,
    message_id INTEGER NOT NULL,
    step_number INTEGER NOT NULL,
    step_type VARCHAR(50) NOT NULL,
    content TEXT NOT NULL,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (message_id) REFERENCES conversation_messages(id)
);

CREATE TABLE file_processing_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    file_id VARCHAR(50) NOT NULL,
    task_type VARCHAR(50) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    progress INTEGER DEFAULT 0,
    error_message TEXT,
    result_data JSONB,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    processing_time_ms INTEGER,
    worker_id VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE vector_configs (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    model_name VARCHAR(100) NOT NULL,
    model_provider VARCHAR(50) NOT NULL,
    dimension INTEGER NOT NULL,
    normalization_type VARCHAR(20) DEFAULT 'l2',
    distance_metric VARCHAR(20) DEFAULT 'cosine',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE schema_migrations (
    id SERIAL PRIMARY KEY,
    version VARCHAR(50) NOT NULL UNIQUE,
    description VARCHAR(255),
    applied_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    checksum VARCHAR(64)
);

-- ============================================================================
-- VIEWS DEFINITIONS
-- ============================================================================

CREATE VIEW v_knowledge_stats AS 
SELECT 
    count(*) AS total_documents,
    sum(file_size) AS total_size,
    count(CASE WHEN status = 'processed' THEN 1 ELSE NULL END) AS processed_count,
    count(CASE WHEN status = 'uploaded' THEN 1 ELSE NULL END) AS pending_count,
    avg(file_size) AS avg_file_size,
    max(created_at) AS latest_upload
FROM knowledge_documents;

CREATE VIEW v_qa_dataset_stats AS
SELECT 
    qd.id,
    qd.title,
    qd.total_qa_pairs,
    qd.processed_qa_pairs,
    qd.status,
    count(qp.id) AS actual_qa_count,
    count(CASE WHEN qp.vectorized = true THEN 1 ELSE NULL END) AS vectorized_count
FROM qa_datasets qd
LEFT JOIN qa_pairs qp ON qd.id = qp.dataset_id
GROUP BY qd.id, qd.title, qd.total_qa_pairs, qd.processed_qa_pairs, qd.status;

CREATE VIEW v_team_performance AS
SELECT 
    team_name,
    count(*) AS total_executions,
    count(CASE WHEN status = 'completed' THEN 1 ELSE NULL END) AS successful_executions,
    count(CASE WHEN status = 'failed' THEN 1 ELSE NULL END) AS failed_executions,
    avg(duration_ms) AS avg_duration_ms,
    max(created_at) AS last_execution
FROM team_executions
GROUP BY team_name;

CREATE VIEW v_user_activity AS
SELECT 
    u.id,
    u.username,
    u.last_login,
    count(c.id) AS total_conversations,
    count(cm.id) AS total_messages,
    max(cm.created_at) AS last_activity
FROM users u
LEFT JOIN conversations c ON u.id = c.user_id
LEFT JOIN conversation_messages cm ON c.id = cm.conversation_id
GROUP BY u.id, u.username, u.last_login;

CREATE VIEW collection_with_chunking_config AS
SELECT 
    kc.*,
    cc.name as chunking_config_name,
    cc.strategy as chunking_strategy,
    cc.chunk_token_num,
    cc.chunk_overlap
FROM knowledge_collections kc
LEFT JOIN chunking_configs cc ON kc.default_chunking_config_id = cc.id;