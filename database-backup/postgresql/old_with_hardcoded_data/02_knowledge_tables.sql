-- Knowledge Management Tables Schema Export
-- Generated from zzdsj_demo database  
-- Date: 2025-08-27
-- Updated: 2025-08-28 - Added metadata template and extraction fields to knowledge_documents table

-- ============================================================================
-- KNOWLEDGE COLLECTIONS AND DOCUMENTS
-- ============================================================================

CREATE TABLE knowledge_collections (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    icon VARCHAR(100),
    color VARCHAR(20),
    is_default BOOLEAN,
    is_public BOOLEAN,
    is_active BOOLEAN,
    metadata_template VARCHAR(50) NOT NULL,
    template_version VARCHAR(20),
    document_count INTEGER,
    total_size BIGINT,
    last_updated TIMESTAMPTZ,
    config JSON,
    extra_metadata JSON,
    template_config JSON,
    extraction_rules JSON,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ,
    default_chunking_config_id VARCHAR(50),
    chunking_config JSONB
);

CREATE TABLE knowledge_documents (
    id VARCHAR(50) PRIMARY KEY,
    title VARCHAR(500) NOT NULL,
    filename VARCHAR(500) NOT NULL,
    file_type VARCHAR(50) NOT NULL,
    file_size INTEGER NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'uploaded',
    tags JSONB,
    document_metadata JSONB,
    vector_status JSONB,
    file_path VARCHAR(1000),
    upload_time TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ,
    collection_id VARCHAR(255),
    -- Metadata template and extraction fields (added 2025-08-28)
    metadata_template_id VARCHAR(50),
    structured_metadata JSONB,
    metadata_extraction_status VARCHAR(20) DEFAULT 'pending',
    metadata_extraction_log JSONB,
    document_category VARCHAR(100),
    domain_type VARCHAR(50),
    effective_date TIMESTAMPTZ,
    expiry_date TIMESTAMPTZ,
    FOREIGN KEY (collection_id) REFERENCES knowledge_collections(id)
);

CREATE TABLE document_chunks (
    id VARCHAR(50) PRIMARY KEY,
    document_id VARCHAR(50),
    content TEXT NOT NULL,
    chunk_index INTEGER NOT NULL,
    embedding JSONB,
    embedding_model VARCHAR(100),
    chunk_metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ,
    general_embedding JSON,
    domain_embedding JSON,
    general_model VARCHAR(100),
    domain_model VARCHAR(100),
    vectorization_strategy VARCHAR(20),
    general_embedding_vector VECTOR(1536),
    domain_embedding_vector VECTOR(1536),
    FOREIGN KEY (document_id) REFERENCES knowledge_documents(id)
);

CREATE TABLE knowledge_sources (
    id SERIAL PRIMARY KEY,
    message_id INTEGER,
    execution_id VARCHAR(100),
    source_type VARCHAR(50) NOT NULL,
    source_id VARCHAR(100),
    title TEXT,
    content TEXT,
    question TEXT,
    answer TEXT,
    authors TEXT,
    publication_date TEXT,
    journal TEXT,
    url TEXT,
    score REAL,
    adopted BOOLEAN DEFAULT false,
    rank_position INTEGER,
    retrieval_method VARCHAR(50),
    language VARCHAR(10),
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- QA DATASETS
-- ============================================================================

CREATE TABLE qa_datasets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    file_path VARCHAR(500) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_size INTEGER,
    file_hash VARCHAR(64),
    status VARCHAR(20) DEFAULT 'pending',
    total_qa_pairs INTEGER DEFAULT 0,
    processed_qa_pairs INTEGER DEFAULT 0,
    categories_count INTEGER DEFAULT 0,
    vectorization_status VARCHAR(20) DEFAULT 'pending',
    vector_model VARCHAR(100),
    dataset_metadata JSONB,
    processing_logs JSONB,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMPTZ
);

CREATE TABLE qa_pairs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dataset_id UUID NOT NULL,
    category_id UUID,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    question_hash VARCHAR(64),
    answer_hash VARCHAR(64),
    metadata JSONB,
    tags TEXT[],
    confidence_score REAL,
    difficulty_level VARCHAR(20),
    source_line_number INTEGER,
    qa_type VARCHAR(50) DEFAULT 'general',
    language VARCHAR(10) DEFAULT 'zh',
    vectorized BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    question_vector VECTOR(1536),
    answer_vector VECTOR(1536),
    FOREIGN KEY (dataset_id) REFERENCES qa_datasets(id)
);

CREATE TABLE qa_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dataset_id UUID NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    qa_pair_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (dataset_id) REFERENCES qa_datasets(id)
);

-- ============================================================================
-- CHUNKING CONFIGURATION
-- ============================================================================

CREATE TABLE chunking_configs (
    id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    chunk_overlap INTEGER NOT NULL DEFAULT 200,
    strategy VARCHAR(50) NOT NULL DEFAULT 'semantic',
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    chunk_token_num INTEGER NOT NULL DEFAULT 400,
    max_token_num INTEGER NOT NULL DEFAULT 512,
    delimiter VARCHAR(50) NOT NULL DEFAULT '!?。！？',
    tokenizer_type VARCHAR(20) NOT NULL DEFAULT 'simple',
    preserve_structure BOOLEAN NOT NULL DEFAULT true,
    semantic_threshold INTEGER NOT NULL DEFAULT 30,
    supported_formats JSONB,
    is_active BOOLEAN NOT NULL DEFAULT true,
    scope VARCHAR(20) DEFAULT 'global',
    collection_id VARCHAR(50)
);