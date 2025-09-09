-- Graph and Knowledge Graph Tables Schema Export
-- Generated from zzdsj_demo database  
-- Date: 2025-08-27

-- ============================================================================
-- KNOWLEDGE GRAPH TABLES
-- ============================================================================

CREATE TABLE graph_nodes (
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
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ
);

CREATE TABLE graph_edges (
    id VARCHAR(50) PRIMARY KEY,
    from_node_id VARCHAR(50),
    to_node_id VARCHAR(50),
    label VARCHAR(200) NOT NULL,
    type VARCHAR(100) NOT NULL,
    properties JSONB,
    weight REAL DEFAULT 1.0,
    confidence REAL DEFAULT 0.0,
    color VARCHAR(20),
    source_document_id VARCHAR(50),
    source_chunk_id VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ,
    FOREIGN KEY (from_node_id) REFERENCES graph_nodes(id),
    FOREIGN KEY (to_node_id) REFERENCES graph_nodes(id),
    FOREIGN KEY (source_document_id) REFERENCES knowledge_documents(id),
    FOREIGN KEY (source_chunk_id) REFERENCES document_chunks(id)
);

CREATE TABLE graph_stats (
    id VARCHAR(50) PRIMARY KEY,
    node_count INTEGER NOT NULL DEFAULT 0,
    edge_count INTEGER NOT NULL DEFAULT 0,
    avg_connections REAL NOT NULL DEFAULT 0.0,
    type_distribution JSONB,
    last_updated TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    graph_version VARCHAR(50)
);

CREATE TABLE graph_stats_backup (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    stat_type VARCHAR(50),
    stat_name VARCHAR(100),
    stat_value JSONB,
    calculated_at TIMESTAMPTZ,
    metadata JSONB
);

-- ============================================================================
-- GRAPH VISUALIZATION AND MANAGEMENT
-- ============================================================================

CREATE TABLE graph_layouts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    layout_name VARCHAR(100) NOT NULL,
    layout_config JSONB NOT NULL,
    node_positions JSONB,
    edge_styles JSONB,
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER
);

CREATE TABLE graph_filters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    filter_name VARCHAR(100) NOT NULL,
    filter_config JSONB NOT NULL,
    node_filters JSONB,
    edge_filters JSONB,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER
);

CREATE TABLE graph_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    snapshot_name VARCHAR(255) NOT NULL,
    description TEXT,
    graph_data JSONB NOT NULL,
    node_count INTEGER,
    edge_count INTEGER,
    snapshot_metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER
);

CREATE TABLE graph_algorithm_executions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    algorithm_name VARCHAR(100) NOT NULL,
    algorithm_config JSONB,
    input_graph_data JSONB,
    output_results JSONB,
    execution_status VARCHAR(20) DEFAULT 'pending',
    started_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMPTZ,
    execution_time_ms INTEGER,
    error_message TEXT,
    created_by INTEGER
);

-- ============================================================================
-- MEDIA AND MULTIMODAL TABLES
-- ============================================================================

CREATE TABLE media_files (
    id VARCHAR(50) PRIMARY KEY,
    filename VARCHAR(500) NOT NULL,
    original_filename VARCHAR(500),
    mime_type VARCHAR(100) NOT NULL,
    file_size BIGINT NOT NULL,
    file_path VARCHAR(1000) NOT NULL,
    thumbnail_path VARCHAR(1000),
    upload_time TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    uploader_id INTEGER,
    metadata JSONB,
    status VARCHAR(20) DEFAULT 'uploaded',
    is_public BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE message_media_files (
    id SERIAL PRIMARY KEY,
    message_id INTEGER NOT NULL,
    media_file_id VARCHAR(50) NOT NULL,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (message_id) REFERENCES conversation_messages(id),
    FOREIGN KEY (media_file_id) REFERENCES media_files(id)
);

CREATE TABLE ocr_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    media_file_id VARCHAR(50) NOT NULL,
    engine VARCHAR(50) NOT NULL,
    extracted_text TEXT,
    confidence REAL,
    bounding_boxes JSONB,
    processing_time_ms INTEGER,
    status VARCHAR(20) DEFAULT 'pending',
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (media_file_id) REFERENCES media_files(id)
);

CREATE TABLE video_analysis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    media_file_id VARCHAR(50) NOT NULL,
    analysis_type VARCHAR(50) NOT NULL,
    frame_count INTEGER,
    duration_seconds REAL,
    key_frames JSONB,
    analysis_results JSONB,
    processing_time_ms INTEGER,
    status VARCHAR(20) DEFAULT 'pending',
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (media_file_id) REFERENCES media_files(id)
);

CREATE TABLE multimodal_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_type VARCHAR(50) NOT NULL,
    input_media_id VARCHAR(50),
    input_text TEXT,
    output_data JSONB,
    model_used VARCHAR(100),
    processing_time_ms INTEGER,
    status VARCHAR(20) DEFAULT 'pending',
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMPTZ,
    FOREIGN KEY (input_media_id) REFERENCES media_files(id)
);