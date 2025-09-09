-- ============================================================================
-- MAT-DEMO 完整数据库结构和初始化数据导出
-- 生成时间: 2025-08-12
-- 数据库: PostgreSQL 14+ with pgvector extension
-- 描述: 地聚物材料智能问答系统完整数据库结构
-- 包含: 52个表、完整约束、索引、视图、触发器、初始化数据
-- 数据规模: 1766个文档、100545个QA对、62个对话、140条消息
-- ============================================================================

-- 设置客户端编码
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;

-- 创建必要的扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "vector";
CREATE EXTENSION IF NOT EXISTS "btree_gin";

-- ============================================================================
-- 创建序列（必须在表创建之前）
-- ============================================================================

CREATE SEQUENCE IF NOT EXISTS users_id_seq START 1;
CREATE SEQUENCE IF NOT EXISTS conversations_id_seq START 1;
CREATE SEQUENCE IF NOT EXISTS conversation_messages_id_seq START 1;
CREATE SEQUENCE IF NOT EXISTS agent_memory_id_seq START 1;
CREATE SEQUENCE IF NOT EXISTS agent_storage_id_seq START 1;
CREATE SEQUENCE IF NOT EXISTS team_sessions_id_seq START 1;
CREATE SEQUENCE IF NOT EXISTS team_executions_id_seq START 1;
CREATE SEQUENCE IF NOT EXISTS team_members_id_seq START 1;
CREATE SEQUENCE IF NOT EXISTS team_execution_steps_id_seq START 1;
CREATE SEQUENCE IF NOT EXISTS team_member_calls_id_seq START 1;
CREATE SEQUENCE IF NOT EXISTS knowledge_sources_id_seq START 1;
CREATE SEQUENCE IF NOT EXISTS papers_id_seq START 1;
CREATE SEQUENCE IF NOT EXISTS thinking_steps_id_seq START 1;
CREATE SEQUENCE IF NOT EXISTS langdb_metrics_id_seq START 1;
CREATE SEQUENCE IF NOT EXISTS system_logs_id_seq START 1;

-- ============================================================================
-- 用户管理相关表
-- ============================================================================

-- 用户表
CREATE TABLE IF NOT EXISTS users (
    id INTEGER NOT NULL DEFAULT nextval('users_id_seq'::regclass),
    username VARCHAR(50) NOT NULL,
    email VARCHAR(100) NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    full_name VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    is_superuser BOOLEAN DEFAULT false,
    organization VARCHAR(200),
    role VARCHAR(50),
    research_interests VARCHAR(500),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMPTZ,
    password_hash VARCHAR(255) NOT NULL,
    PRIMARY KEY (id),
    UNIQUE (username),
    UNIQUE (email)
);

-- 用户偏好设置表
CREATE TABLE IF NOT EXISTS user_preferences (
    id VARCHAR(50) NOT NULL,
    user_id VARCHAR(50),
    theme VARCHAR(20) DEFAULT 'light'::character varying,
    language VARCHAR(10) DEFAULT 'zh'::character varying,
    font_size VARCHAR(20) DEFAULT 'medium'::character varying,
    auto_save BOOLEAN DEFAULT true,
    show_sources BOOLEAN DEFAULT true,
    show_confidence BOOLEAN DEFAULT true,
    preferences JSONB,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

-- 创建数据库（如果不存在）
-- CREATE DATABASE matdemo WITH TEMPLATE = template0 ENCODING = 'UTF8' LOCALE = 'zh_CN.UTF-8';
-- \connect matdemo

-- ============================================================================
-- 扩展安装
-- ============================================================================

-- 创建必要的扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA public;
CREATE EXTENSION IF NOT EXISTS "vector" WITH SCHEMA public;
CREATE EXTENSION IF NOT EXISTS "pg_trgm" WITH SCHEMA public;

-- 设置搜索路径
SET search_path = public, extensions;

-- ============================================================================
-- 序列定义
-- ============================================================================

CREATE SEQUENCE IF NOT EXISTS users_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

CREATE SEQUENCE IF NOT EXISTS conversations_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

CREATE SEQUENCE IF NOT EXISTS conversation_messages_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

CREATE SEQUENCE IF NOT EXISTS agent_memory_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

CREATE SEQUENCE IF NOT EXISTS agent_storage_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

CREATE SEQUENCE IF NOT EXISTS team_sessions_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

CREATE SEQUENCE IF NOT EXISTS team_executions_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

CREATE SEQUENCE IF NOT EXISTS team_members_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

CREATE SEQUENCE IF NOT EXISTS team_execution_steps_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

CREATE SEQUENCE IF NOT EXISTS team_member_calls_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

CREATE SEQUENCE IF NOT EXISTS team_execution_templates_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

CREATE SEQUENCE IF NOT EXISTS team_execution_traces_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

CREATE SEQUENCE IF NOT EXISTS team_session_instances_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

CREATE SEQUENCE IF NOT EXISTS knowledge_sources_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

CREATE SEQUENCE IF NOT EXISTS papers_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

CREATE SEQUENCE IF NOT EXISTS thinking_steps_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

CREATE SEQUENCE IF NOT EXISTS langdb_metrics_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

CREATE SEQUENCE IF NOT EXISTS system_logs_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

CREATE SEQUENCE IF NOT EXISTS task_statistics_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

CREATE SEQUENCE IF NOT EXISTS schema_migrations_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

-- ============================================================================
-- 表结构定义
-- ============================================================================

-- ============================================================================
-- 用户管理相关表
-- ============================================================================

-- 用户表
CREATE TABLE IF NOT EXISTS users (
    id INTEGER NOT NULL DEFAULT nextval('users_id_seq'::regclass),
    username CHARACTER VARYING(50) NOT NULL,
    email CHARACTER VARYING(100) NOT NULL,
    hashed_password CHARACTER VARYING(255) NOT NULL,
    full_name CHARACTER VARYING(100),
    is_active BOOLEAN DEFAULT true,
    is_superuser BOOLEAN DEFAULT false,
    organization CHARACTER VARYING(200),
    role CHARACTER VARYING(50),
    research_interests CHARACTER VARYING(500),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE,
    last_login TIMESTAMP WITH TIME ZONE,
    password_hash CHARACTER VARYING(255) NOT NULL,
    CONSTRAINT users_pkey PRIMARY KEY (id),
    CONSTRAINT users_username_key UNIQUE (username),
    CONSTRAINT users_email_key UNIQUE (email)
);

-- 用户偏好设置表
CREATE TABLE IF NOT EXISTS user_preferences (
    id CHARACTER VARYING(50) NOT NULL,
    user_id CHARACTER VARYING(50),
    theme CHARACTER VARYING(20) DEFAULT 'light'::character varying,
    language CHARACTER VARYING(10) DEFAULT 'zh'::character varying,
    font_size CHARACTER VARYING(20) DEFAULT 'medium'::character varying,
    auto_save BOOLEAN DEFAULT true,
    show_sources BOOLEAN DEFAULT true,
    show_confidence BOOLEAN DEFAULT true,
    preferences JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT user_preferences_pkey PRIMARY KEY (id)
);

-- ============================================================================
-- 对话系统相关表
-- ============================================================================

-- 对话会话表
CREATE TABLE IF NOT EXISTS conversations (
    id INTEGER NOT NULL DEFAULT nextval('conversations_id_seq'::regclass),
    session_id CHARACTER VARYING(100) NOT NULL,
    title CHARACTER VARYING(200),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE,
    conversation_type CHARACTER VARYING(10) DEFAULT 'single'::character varying,
    team_name CHARACTER VARYING(100),
    team_mode CHARACTER VARYING(20),
    user_id INTEGER,
    CONSTRAINT conversations_pkey PRIMARY KEY (id),
    CONSTRAINT conversations_session_id_key UNIQUE (session_id),
    CONSTRAINT conversations_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- 对话消息表
CREATE TABLE IF NOT EXISTS conversation_messages (
    id INTEGER NOT NULL DEFAULT nextval('conversation_messages_id_seq'::regclass),
    conversation_id INTEGER,
    message_type CHARACTER VARYING(10) NOT NULL,
    content TEXT NOT NULL,
    confidence REAL,
    sources JSONB,
    images JSONB,
    tables JSONB,
    highlights JSONB,
    processing_time REAL,
    model_used CHARACTER VARYING(100),
    tokens_used INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    agent_id CHARACTER VARYING(100),
    agent_name CHARACTER VARYING(200),
    thinking JSON,
    knowledge_sources JSON,
    is_team_message BOOLEAN DEFAULT false,
    team_info JSONB,
    thinking_process JSONB,
    graph_sources JSONB,
    CONSTRAINT conversation_messages_pkey PRIMARY KEY (id),
    CONSTRAINT conversation_messages_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
);

-- ============================================================================
-- Agent和Team相关表
-- ============================================================================

-- Agent配置表
CREATE TABLE IF NOT EXISTS agent_configs (
    id CHARACTER VARYING(36) NOT NULL,
    agent_name CHARACTER VARYING(100) NOT NULL,
    team_name CHARACTER VARYING(100),
    model_provider CHARACTER VARYING(50),
    model_id CHARACTER VARYING(100),
    temperature DOUBLE PRECISION,
    max_tokens INTEGER,
    top_p DOUBLE PRECISION,
    frequency_penalty DOUBLE PRECISION,
    presence_penalty DOUBLE PRECISION,
    extra_config TEXT,
    is_active BOOLEAN NOT NULL,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    CONSTRAINT agent_configs_pkey PRIMARY KEY (id)
);

-- Agent记忆表
CREATE TABLE IF NOT EXISTS agent_memory (
    id INTEGER NOT NULL DEFAULT nextval('agent_memory_id_seq'::regclass),
    session_id CHARACTER VARYING(255) NOT NULL,
    user_id CHARACTER VARYING(255),
    memory JSONB NOT NULL,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT agent_memory_pkey PRIMARY KEY (id)
);

-- Agent存储表
CREATE TABLE IF NOT EXISTS agent_storage (
    id INTEGER NOT NULL DEFAULT nextval('agent_storage_id_seq'::regclass),
    session_id CHARACTER VARYING(255) NOT NULL,
    user_id CHARACTER VARYING(255),
    agent_data JSONB NOT NULL,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT agent_storage_pkey PRIMARY KEY (id)
);

-- Team会话表
CREATE TABLE IF NOT EXISTS team_sessions (
    id INTEGER NOT NULL DEFAULT nextval('team_sessions_id_seq'::regclass),
    session_id CHARACTER VARYING(100) NOT NULL,
    team_name CHARACTER VARYING(200) NOT NULL,
    team_mode CHARACTER VARYING(50) NOT NULL DEFAULT 'coordinate'::character varying,
    coordinator_id CHARACTER VARYING(100),
    status CHARACTER VARYING(50) NOT NULL DEFAULT 'active'::character varying,
    start_time TIMESTAMP WITH TIME ZONE DEFAULT now(),
    end_time TIMESTAMP WITH TIME ZONE,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    CONSTRAINT team_sessions_pkey PRIMARY KEY (id),
    CONSTRAINT team_sessions_session_id_key UNIQUE (session_id)
);

-- Team执行表
CREATE TABLE IF NOT EXISTS team_executions (
    id INTEGER NOT NULL DEFAULT nextval('team_executions_id_seq'::regclass),
    session_id CHARACTER VARYING(100) NOT NULL,
    execution_id CHARACTER VARYING(100) NOT NULL,
    team_name CHARACTER VARYING(200) NOT NULL,
    query TEXT NOT NULL,
    status CHARACTER VARYING(50) NOT NULL DEFAULT 'pending'::character varying,
    start_time TIMESTAMP WITH TIME ZONE DEFAULT now(),
    end_time TIMESTAMP WITH TIME ZONE,
    duration_ms INTEGER,
    result_content TEXT,
    error_message TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    conversation_id INTEGER,
    message_id INTEGER,
    total_duration_ms INTEGER,
    structured_output JSONB,
    coordination_info JSONB,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    team_mode CHARACTER VARYING(50) DEFAULT 'coordinate'::character varying,
    CONSTRAINT team_executions_pkey PRIMARY KEY (id),
    CONSTRAINT team_executions_execution_id_key UNIQUE (execution_id),
    CONSTRAINT team_executions_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE SET NULL,
    CONSTRAINT team_executions_message_id_fkey FOREIGN KEY (message_id) REFERENCES conversation_messages(id) ON DELETE SET NULL
);

-- Team成员表
CREATE TABLE IF NOT EXISTS team_members (
    id INTEGER NOT NULL DEFAULT nextval('team_members_id_seq'::regclass),
    team_name CHARACTER VARYING(200) NOT NULL,
    member_id CHARACTER VARYING(100) NOT NULL,
    member_name CHARACTER VARYING(200) NOT NULL,
    role CHARACTER VARYING(200) NOT NULL,
    model_provider CHARACTER VARYING(100),
    model_id CHARACTER VARYING(100),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    CONSTRAINT team_members_pkey PRIMARY KEY (id),
    CONSTRAINT team_members_team_name_member_id_key UNIQUE (team_name, member_id)
);

-- Team执行步骤表
CREATE TABLE IF NOT EXISTS team_execution_steps (
    id INTEGER NOT NULL DEFAULT nextval('team_execution_steps_id_seq'::regclass),
    execution_id CHARACTER VARYING(100) NOT NULL,
    step_id CHARACTER VARYING(100) NOT NULL,
    member_id CHARACTER VARYING(100) NOT NULL,
    member_name CHARACTER VARYING(200) NOT NULL,
    action CHARACTER VARYING(200) NOT NULL,
    input_data JSONB,
    output_data JSONB,
    status CHARACTER VARYING(50) NOT NULL DEFAULT 'pending'::character varying,
    start_time TIMESTAMP WITH TIME ZONE DEFAULT now(),
    end_time TIMESTAMP WITH TIME ZONE,
    duration_ms INTEGER,
    error_message TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    CONSTRAINT team_execution_steps_pkey PRIMARY KEY (id)
);

-- Team成员调用表
CREATE TABLE IF NOT EXISTS team_member_calls (
    id INTEGER NOT NULL DEFAULT nextval('team_member_calls_id_seq'::regclass),
    execution_id CHARACTER VARYING(100),
    member_id CHARACTER VARYING(100) NOT NULL,
    member_name CHARACTER VARYING(100) NOT NULL,
    role CHARACTER VARYING(100) NOT NULL,
    action TEXT NOT NULL,
    call_type CHARACTER VARYING(50) DEFAULT 'execute'::character varying,
    input_data JSONB,
    output_data JSONB,
    status CHARACTER VARYING(20) DEFAULT 'pending'::character varying,
    start_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    end_time TIMESTAMP WITH TIME ZONE,
    duration_ms INTEGER,
    confidence REAL,
    error_message TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT team_member_calls_pkey PRIMARY KEY (id),
    CONSTRAINT team_member_calls_execution_id_fkey FOREIGN KEY (execution_id) REFERENCES team_executions(execution_id) ON DELETE SET NULL
);

-- Team执行模板表
CREATE TABLE IF NOT EXISTS team_execution_templates (
    id INTEGER NOT NULL DEFAULT nextval('team_execution_templates_id_seq'::regclass),
    template_id CHARACTER VARYING(100) NOT NULL,
    team_name CHARACTER VARYING(100) NOT NULL,
    execution_mode CHARACTER VARYING(20) NOT NULL DEFAULT 'sequential'::character varying,
    agent_sequence JSONB NOT NULL,
    dependencies JSONB NOT NULL DEFAULT '{}'::jsonb,
    timeout_config JSONB NOT NULL DEFAULT '{"step": 15, "agent": 30, "total": 300}'::jsonb,
    retry_config JSONB NOT NULL DEFAULT '{"max_retries": 2, "backoff_factor": 1.5}'::jsonb,
    is_active BOOLEAN DEFAULT true,
    version INTEGER DEFAULT 1,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
    CONSTRAINT team_execution_templates_pkey PRIMARY KEY (id),
    CONSTRAINT team_execution_templates_template_id_key UNIQUE (template_id)
);

-- Team执行追踪表
CREATE TABLE IF NOT EXISTS team_execution_traces (
    id INTEGER NOT NULL DEFAULT nextval('team_execution_traces_id_seq'::regclass),
    execution_id CHARACTER VARYING(100) NOT NULL,
    session_id CHARACTER VARYING(100) NOT NULL,
    team_name CHARACTER VARYING(100) NOT NULL,
    template_id CHARACTER VARYING(100),
    query_text TEXT,
    status CHARACTER VARYING(20) DEFAULT 'running'::character varying,
    execution_mode CHARACTER VARYING(20) DEFAULT 'sequential'::character varying,
    start_time TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
    end_time TIMESTAMP WITHOUT TIME ZONE,
    total_duration_ms INTEGER,
    agent_traces JSONB DEFAULT '[]'::jsonb,
    error_info JSONB,
    performance_metrics JSONB DEFAULT '{}'::jsonb,
    resource_usage JSONB DEFAULT '{}'::jsonb,
    CONSTRAINT team_execution_traces_pkey PRIMARY KEY (id),
    CONSTRAINT team_execution_traces_execution_id_key UNIQUE (execution_id)
);

-- Team会话实例表
CREATE TABLE IF NOT EXISTS team_session_instances (
    id INTEGER NOT NULL DEFAULT nextval('team_session_instances_id_seq'::regclass),
    session_id CHARACTER VARYING(100) NOT NULL,
    team_name CHARACTER VARYING(100) NOT NULL,
    instance_key CHARACTER VARYING(200) NOT NULL,
    status CHARACTER VARYING(20) DEFAULT 'active'::character varying,
    last_query_time TIMESTAMP WITHOUT TIME ZONE,
    resource_usage JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
    last_used_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
    CONSTRAINT team_session_instances_pkey PRIMARY KEY (id),
    CONSTRAINT team_session_instances_instance_key_key UNIQUE (instance_key)
);

-- ============================================================================
-- 知识库相关表
-- ============================================================================

-- 知识文档表
CREATE TABLE IF NOT EXISTS knowledge_documents (
    id CHARACTER VARYING(50) NOT NULL,
    title CHARACTER VARYING(500) NOT NULL,
    filename CHARACTER VARYING(500) NOT NULL,
    file_type CHARACTER VARYING(50) NOT NULL,
    file_size INTEGER NOT NULL,
    status CHARACTER VARYING(20) NOT NULL DEFAULT 'uploaded'::character varying,
    tags JSONB,
    document_metadata JSONB,
    vector_status JSONB,
    file_path CHARACTER VARYING(1000),
    upload_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT knowledge_documents_pkey PRIMARY KEY (id)
);

-- 文档分块表
CREATE TABLE IF NOT EXISTS document_chunks (
    id CHARACTER VARYING(50) NOT NULL,
    document_id CHARACTER VARYING(50),
    content TEXT NOT NULL,
    chunk_index INTEGER NOT NULL,
    embedding JSONB,
    embedding_model CHARACTER VARYING(100),
    chunk_metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE,
    general_embedding JSON,
    general_model CHARACTER VARYING(100),
    vectorization_strategy CHARACTER VARYING(20),
    CONSTRAINT document_chunks_pkey PRIMARY KEY (id),
    CONSTRAINT document_chunks_document_id_fkey FOREIGN KEY (document_id) REFERENCES knowledge_documents(id) ON DELETE CASCADE
);

-- 知识源表
CREATE TABLE IF NOT EXISTS knowledge_sources (
    id INTEGER NOT NULL DEFAULT nextval('knowledge_sources_id_seq'::regclass),
    message_id INTEGER,
    execution_id CHARACTER VARYING(100),
    source_type CHARACTER VARYING(50) NOT NULL,
    source_id CHARACTER VARYING(100),
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
    retrieval_method CHARACTER VARYING(50),
    language CHARACTER VARYING(10),
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT knowledge_sources_pkey PRIMARY KEY (id),
    CONSTRAINT knowledge_sources_message_id_fkey FOREIGN KEY (message_id) REFERENCES conversation_messages(id) ON DELETE CASCADE
);

-- 检索结果表
CREATE TABLE IF NOT EXISTS retrieval_results (
    id CHARACTER VARYING(50) NOT NULL,
    query TEXT NOT NULL,
    query_hash CHARACTER VARYING(100) NOT NULL,
    results JSONB NOT NULL,
    top_k INTEGER NOT NULL,
    threshold REAL,
    rerank BOOLEAN DEFAULT false,
    model_used CHARACTER VARYING(200),
    retrieval_time REAL,
    total_matches INTEGER,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT retrieval_results_pkey PRIMARY KEY (id)
);

-- ============================================================================
-- 配置相关表
-- ============================================================================

-- 模型配置表
CREATE TABLE IF NOT EXISTS model_configs (
    id CHARACTER VARYING(50) NOT NULL,
    name CHARACTER VARYING(200) NOT NULL,
    type CHARACTER VARYING(50) NOT NULL,
    provider CHARACTER VARYING(100) NOT NULL,
    model CHARACTER VARYING(200) NOT NULL,
    api_key CHARACTER VARYING(500),
    base_url CHARACTER VARYING(500),
    parameters JSONB,
    is_active BOOLEAN DEFAULT true,
    max_tokens INTEGER,
    temperature REAL,
    dimension INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT model_configs_pkey PRIMARY KEY (id)
);

-- 分块配置表
CREATE TABLE IF NOT EXISTS chunking_configs (
    id CHARACTER VARYING(36) NOT NULL,
    name CHARACTER VARYING(100) NOT NULL,
    description TEXT,
    strategy CHARACTER VARYING(20) NOT NULL DEFAULT 'semantic'::character varying,
    chunk_token_num INTEGER NOT NULL DEFAULT 400,
    max_token_num INTEGER NOT NULL DEFAULT 512,
    chunk_overlap INTEGER NOT NULL DEFAULT 50,
    delimiter CHARACTER VARYING(50) NOT NULL DEFAULT '.!?'::character varying,
    tokenizer_type CHARACTER VARYING(20) NOT NULL DEFAULT 'simple'::character varying,
    preserve_structure BOOLEAN NOT NULL DEFAULT true,
    semantic_threshold INTEGER NOT NULL DEFAULT 30,
    supported_formats JSONB NOT NULL DEFAULT '["txt", "md", "pdf", "docx"]'::jsonb,
    is_default BOOLEAN NOT NULL DEFAULT false,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chunking_configs_pkey PRIMARY KEY (id)
);

-- 向量配置表
CREATE TABLE IF NOT EXISTS vector_configs (
    id CHARACTER VARYING(50) NOT NULL,
    name CHARACTER VARYING(200) NOT NULL,
    model CHARACTER VARYING(200) NOT NULL,
    dimension INTEGER NOT NULL,
    chunk_size INTEGER NOT NULL,
    chunk_overlap INTEGER NOT NULL,
    strategy CHARACTER VARYING(50) NOT NULL,
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT vector_configs_pkey PRIMARY KEY (id)
);

-- 系统配置表
CREATE TABLE IF NOT EXISTS system_configs (
    id CHARACTER VARYING(50) NOT NULL,
    category CHARACTER VARYING(100) NOT NULL,
    key CHARACTER VARYING(200) NOT NULL,
    value JSONB NOT NULL,
    description TEXT,
    is_public BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT system_configs_pkey PRIMARY KEY (id),
    CONSTRAINT system_configs_category_key_key UNIQUE (category, key)
);

-- ============================================================================
-- 知识图谱相关表
-- ============================================================================

-- 图节点表
CREATE TABLE IF NOT EXISTS graph_nodes (
    id CHARACTER VARYING(50) NOT NULL,
    label CHARACTER VARYING(500) NOT NULL,
    type CHARACTER VARYING(100) NOT NULL,
    properties JSONB,
    x REAL,
    y REAL,
    color CHARACTER VARYING(20),
    size REAL,
    connections INTEGER DEFAULT 0,
    level INTEGER,
    source_document_id CHARACTER VARYING(50),
    source_chunk_id CHARACTER VARYING(50),
    weight REAL DEFAULT 1.0,
    confidence REAL DEFAULT 0.0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT graph_nodes_pkey PRIMARY KEY (id)
);

-- 图边表
CREATE TABLE IF NOT EXISTS graph_edges (
    id CHARACTER VARYING(50) NOT NULL,
    from_node_id CHARACTER VARYING(50),
    to_node_id CHARACTER VARYING(50),
    label CHARACTER VARYING(200) NOT NULL,
    type CHARACTER VARYING(100) NOT NULL,
    properties JSONB,
    weight REAL DEFAULT 1.0,
    confidence REAL DEFAULT 0.0,
    color CHARACTER VARYING(20),
    source_document_id CHARACTER VARYING(50),
    source_chunk_id CHARACTER VARYING(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT graph_edges_pkey PRIMARY KEY (id),
    CONSTRAINT graph_edges_from_node_id_fkey FOREIGN KEY (from_node_id) REFERENCES graph_nodes(id) ON DELETE CASCADE,
    CONSTRAINT graph_edges_to_node_id_fkey FOREIGN KEY (to_node_id) REFERENCES graph_nodes(id) ON DELETE CASCADE
);

-- 图统计表
CREATE TABLE IF NOT EXISTS graph_stats (
    id CHARACTER VARYING(50) NOT NULL,
    node_count INTEGER NOT NULL DEFAULT 0,
    edge_count INTEGER NOT NULL DEFAULT 0,
    avg_connections REAL NOT NULL DEFAULT 0.0,
    type_distribution JSONB,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    graph_version CHARACTER VARYING(50),
    CONSTRAINT graph_stats_pkey PRIMARY KEY (id)
);

-- 图布局表
CREATE TABLE IF NOT EXISTS graph_layouts (
    id CHARACTER VARYING(50) NOT NULL,
    name CHARACTER VARYING(200) NOT NULL,
    algorithm CHARACTER VARYING(50) NOT NULL,
    physics_config JSONB,
    node_config JSONB,
    edge_config JSONB,
    is_default BOOLEAN DEFAULT false,
    graph_types JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT graph_layouts_pkey PRIMARY KEY (id)
);

-- 图过滤器表
CREATE TABLE IF NOT EXISTS graph_filters (
    id CHARACTER VARYING(50) NOT NULL,
    name CHARACTER VARYING(200) NOT NULL,
    node_types JSONB,
    edge_types JSONB,
    search_text CHARACTER VARYING(1000),
    view_mode CHARACTER VARYING(50) NOT NULL DEFAULT 'overview'::character varying,
    min_connections INTEGER,
    max_connections INTEGER,
    confidence_threshold REAL,
    user_id CHARACTER VARYING(50),
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT graph_filters_pkey PRIMARY KEY (id)
);

-- 图快照表
CREATE TABLE IF NOT EXISTS graph_snapshots (
    id CHARACTER VARYING(50) NOT NULL,
    name CHARACTER VARYING(200) NOT NULL,
    description TEXT,
    nodes_data JSONB NOT NULL,
    edges_data JSONB NOT NULL,
    layout_data JSONB,
    node_count INTEGER NOT NULL,
    edge_count INTEGER NOT NULL,
    created_by CHARACTER VARYING(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT graph_snapshots_pkey PRIMARY KEY (id)
);

-- 图算法执行表
CREATE TABLE IF NOT EXISTS graph_algorithm_executions (
    id CHARACTER VARYING(50) NOT NULL,
    algorithm_name CHARACTER VARYING(100) NOT NULL,
    parameters JSONB,
    result JSONB,
    execution_time REAL NOT NULL,
    status CHARACTER VARYING(20) NOT NULL DEFAULT 'completed'::character varying,
    error_message TEXT,
    created_by CHARACTER VARYING(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT graph_algorithm_executions_pkey PRIMARY KEY (id)
);

-- ============================================================================
-- 任务管理相关表
-- ============================================================================

-- 任务队列表
CREATE TABLE IF NOT EXISTS task_queue (
    id CHARACTER VARYING(50) NOT NULL,
    task_type CHARACTER VARYING(50) NOT NULL,
    priority INTEGER DEFAULT 0,
    status CHARACTER VARYING(20) NOT NULL DEFAULT 'pending'::character varying,
    worker_id CHARACTER VARYING(100),
    task_data JSONB NOT NULL,
    session_id CHARACTER VARYING(100),
    progress INTEGER DEFAULT 0,
    current_stage CHARACTER VARYING(100),
    stage_detail TEXT,
    result JSONB,
    error_message TEXT,
    error_details JSONB,
    depends_on JSONB,
    blocks JSONB,
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    memory_usage BIGINT,
    cpu_time REAL,
    processing_time REAL,
    CONSTRAINT task_queue_pkey PRIMARY KEY (id)
);

-- 任务锁表
CREATE TABLE IF NOT EXISTS task_locks (
    resource_id CHARACTER VARYING(100) NOT NULL,
    resource_type CHARACTER VARYING(50) NOT NULL,
    task_id CHARACTER VARYING(50),
    locked_by CHARACTER VARYING(100) NOT NULL,
    locked_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    CONSTRAINT task_locks_pkey PRIMARY KEY (resource_id, resource_type),
    CONSTRAINT task_locks_task_id_fkey FOREIGN KEY (task_id) REFERENCES task_queue(id) ON DELETE SET NULL
);

-- 任务工作者表
CREATE TABLE IF NOT EXISTS task_workers (
    worker_id CHARACTER VARYING(100) NOT NULL,
    worker_type CHARACTER VARYING(50) NOT NULL,
    max_concurrent_tasks INTEGER DEFAULT 1,
    current_task_count INTEGER DEFAULT 0,
    status CHARACTER VARYING(20) DEFAULT 'active'::character varying,
    last_heartbeat TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    capabilities JSONB,
    metadata JSONB,
    CONSTRAINT task_workers_pkey PRIMARY KEY (worker_id)
);

-- 任务统计表
CREATE TABLE IF NOT EXISTS task_statistics (
    id INTEGER NOT NULL DEFAULT nextval('task_statistics_id_seq'::regclass),
    date DATE NOT NULL,
    task_type CHARACTER VARYING(50) NOT NULL,
    status CHARACTER VARYING(20) NOT NULL,
    count INTEGER DEFAULT 0,
    avg_processing_time REAL,
    avg_memory_usage BIGINT,
    total_cpu_time REAL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT task_statistics_pkey PRIMARY KEY (id),
    CONSTRAINT task_statistics_date_task_type_status_key UNIQUE (date, task_type, status)
);

-- 文件处理任务表
CREATE TABLE IF NOT EXISTS file_processing_tasks (
    id CHARACTER VARYING(50) NOT NULL,
    file_id CHARACTER VARYING(50) NOT NULL,
    task_type CHARACTER VARYING(50) NOT NULL,
    status CHARACTER VARYING(20) NOT NULL DEFAULT 'pending'::character varying,
    progress INTEGER DEFAULT 0,
    result JSONB,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT file_processing_tasks_pkey PRIMARY KEY (id)
);

-- ============================================================================
-- 论文和QA数据集相关表
-- ============================================================================

-- 论文表
CREATE TABLE IF NOT EXISTS papers (
    id INTEGER NOT NULL DEFAULT nextval('papers_id_seq'::regclass),
    title CHARACTER VARYING(500) NOT NULL,
    authors CHARACTER VARYING(1000) NOT NULL,
    journal CHARACTER VARYING(200),
    year INTEGER,
    pages CHARACTER VARYING(50),
    doi CHARACTER VARYING(100),
    url CHARACTER VARYING(500),
    abstract TEXT,
    content TEXT,
    keywords JSONB,
    title_embedding JSONB,
    abstract_embedding JSONB,
    content_embedding JSONB,
    file_path CHARACTER VARYING(500),
    file_size INTEGER,
    processed CHARACTER VARYING(20) DEFAULT 'pending'::character varying,
    confidence_score REAL DEFAULT 0.0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT papers_pkey PRIMARY KEY (id),
    CONSTRAINT papers_doi_key UNIQUE (doi)
);

-- QA数据集表
CREATE TABLE IF NOT EXISTS qa_datasets (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    title CHARACTER VARYING(255) NOT NULL,
    description TEXT,
    category CHARACTER VARYING(100),
    file_path CHARACTER VARYING(500) NOT NULL,
    file_name CHARACTER VARYING(255) NOT NULL,
    file_size INTEGER,
    file_hash CHARACTER VARYING(64),
    status CHARACTER VARYING(20) DEFAULT 'pending'::character varying,
    total_qa_pairs INTEGER DEFAULT 0,
    processed_qa_pairs INTEGER DEFAULT 0,
    categories_count INTEGER DEFAULT 0,
    vectorization_status CHARACTER VARYING(20) DEFAULT 'pending'::character varying,
    vector_model CHARACTER VARYING(100),
    dataset_metadata JSONB,
    processing_logs JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT qa_datasets_pkey PRIMARY KEY (id)
);

-- QA分类表
CREATE TABLE IF NOT EXISTS qa_categories (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    dataset_id UUID NOT NULL,
    name CHARACTER VARYING(100) NOT NULL,
    description TEXT,
    qa_count INTEGER DEFAULT 0,
    category_metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT qa_categories_pkey PRIMARY KEY (id),
    CONSTRAINT qa_categories_dataset_id_fkey FOREIGN KEY (dataset_id) REFERENCES qa_datasets(id) ON DELETE CASCADE
);

-- QA问答对表
CREATE TABLE IF NOT EXISTS qa_pairs (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    dataset_id UUID NOT NULL,
    category CHARACTER VARYING(100),
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    row_number INTEGER,
    source_sheet CHARACTER VARYING(100),
    question_vector_id CHARACTER VARYING(255),
    vector_status CHARACTER VARYING(20) DEFAULT 'pending'::character varying,
    quality_score INTEGER,
    is_validated BOOLEAN DEFAULT false,
    validation_notes TEXT,
    usage_count INTEGER DEFAULT 0,
    last_used_at TIMESTAMP WITH TIME ZONE,
    qa_metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT qa_pairs_pkey PRIMARY KEY (id),
    CONSTRAINT qa_pairs_dataset_id_fkey FOREIGN KEY (dataset_id) REFERENCES qa_datasets(id) ON DELETE CASCADE
);

-- ============================================================================
-- 思考步骤和监控表
-- ============================================================================

-- 思考步骤表
CREATE TABLE IF NOT EXISTS thinking_steps (
    id INTEGER NOT NULL DEFAULT nextval('thinking_steps_id_seq'::regclass),
    message_id INTEGER,
    execution_id CHARACTER VARYING(100),
    step_order INTEGER NOT NULL,
    step_type CHARACTER VARYING(50),
    step_title TEXT,
    step_content TEXT,
    search_results JSONB,
    analysis_data JSONB,
    confidence REAL,
    duration_ms INTEGER,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT thinking_steps_pkey PRIMARY KEY (id),
    CONSTRAINT thinking_steps_message_id_fkey FOREIGN KEY (message_id) REFERENCES conversation_messages(id) ON DELETE CASCADE
);

-- LangDB监控指标表
CREATE TABLE IF NOT EXISTS langdb_metrics (
    id INTEGER NOT NULL DEFAULT nextval('langdb_metrics_id_seq'::regclass),
    session_id CHARACTER VARYING(100) NOT NULL,
    metric_type CHARACTER VARYING(100) NOT NULL,
    metric_name CHARACTER VARYING(200) NOT NULL,
    metric_value JSONB NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT now(),
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    CONSTRAINT langdb_metrics_pkey PRIMARY KEY (id)
);

-- 系统日志表
CREATE TABLE IF NOT EXISTS system_logs (
    id INTEGER NOT NULL DEFAULT nextval('system_logs_id_seq'::regclass),
    user_id CHARACTER VARYING(50),
    action CHARACTER VARYING(100) NOT NULL,
    resource_type CHARACTER VARYING(100),
    resource_id CHARACTER VARYING(100),
    details JSONB,
    ip_address INET,
    user_agent TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT system_logs_pkey PRIMARY KEY (id)
);

-- ============================================================================
-- 多媒体处理相关表
-- ============================================================================

-- 媒体文件表
CREATE TABLE IF NOT EXISTS media_files (
    id CHARACTER VARYING(50) NOT NULL,
    filename CHARACTER VARYING(500) NOT NULL,
    original_filename CHARACTER VARYING(500) NOT NULL,
    file_type CHARACTER VARYING(50) NOT NULL,
    mime_type CHARACTER VARYING(100) NOT NULL,
    file_size BIGINT NOT NULL,
    file_path CHARACTER VARYING(1000) NOT NULL,
    file_url CHARACTER VARYING(1000),
    file_hash CHARACTER VARYING(100),
    media_type CHARACTER VARYING(20) NOT NULL,
    metadata JSONB,
    thumbnail_path CHARACTER VARYING(1000),
    duration REAL,
    dimensions JSONB,
    upload_source CHARACTER VARYING(50) DEFAULT 'user'::character varying,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT media_files_pkey PRIMARY KEY (id)
);

-- 消息媒体文件关联表
CREATE TABLE IF NOT EXISTS message_media_files (
    id CHARACTER VARYING(50) NOT NULL,
    message_id INTEGER,
    media_file_id CHARACTER VARYING(50),
    media_role CHARACTER VARYING(20) NOT NULL,
    order_index INTEGER DEFAULT 0,
    caption TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT message_media_files_pkey PRIMARY KEY (id),
    CONSTRAINT message_media_files_message_id_media_file_id_media_role_key UNIQUE (message_id, media_file_id, media_role),
    CONSTRAINT message_media_files_message_id_fkey FOREIGN KEY (message_id) REFERENCES conversation_messages(id) ON DELETE CASCADE,
    CONSTRAINT message_media_files_media_file_id_fkey FOREIGN KEY (media_file_id) REFERENCES media_files(id) ON DELETE CASCADE
);

-- OCR结果表
CREATE TABLE IF NOT EXISTS ocr_results (
    id CHARACTER VARYING(50) NOT NULL,
    media_file_id CHARACTER VARYING(50),
    text_content TEXT NOT NULL,
    confidence REAL,
    language CHARACTER VARYING(10),
    bounding_boxes JSONB,
    raw_result JSONB,
    ocr_engine CHARACTER VARYING(50) DEFAULT 'qwen-vl'::character varying,
    processing_time REAL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT ocr_results_pkey PRIMARY KEY (id),
    CONSTRAINT ocr_results_media_file_id_fkey FOREIGN KEY (media_file_id) REFERENCES media_files(id) ON DELETE CASCADE
);

-- 视频分析表
CREATE TABLE IF NOT EXISTS video_analysis (
    id CHARACTER VARYING(50) NOT NULL,
    media_file_id CHARACTER VARYING(50),
    key_frames JSONB NOT NULL,
    scene_description TEXT,
    objects_detected JSONB,
    transcript TEXT,
    summary TEXT,
    analysis_model CHARACTER VARYING(100) DEFAULT 'qwen-vl-max'::character varying,
    processing_time REAL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT video_analysis_pkey PRIMARY KEY (id),
    CONSTRAINT video_analysis_media_file_id_fkey FOREIGN KEY (media_file_id) REFERENCES media_files(id) ON DELETE CASCADE
);

-- 多模态任务表
CREATE TABLE IF NOT EXISTS multimodal_tasks (
    id CHARACTER VARYING(50) NOT NULL,
    task_type CHARACTER VARYING(50) NOT NULL,
    media_file_id CHARACTER VARYING(50),
    input_data JSONB NOT NULL,
    output_data JSONB,
    status CHARACTER VARYING(20) NOT NULL DEFAULT 'pending'::character varying,
    progress INTEGER DEFAULT 0,
    model_used CHARACTER VARYING(100),
    error_message TEXT,
    processing_time REAL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT multimodal_tasks_pkey PRIMARY KEY (id),
    CONSTRAINT multimodal_tasks_media_file_id_fkey FOREIGN KEY (media_file_id) REFERENCES media_files(id) ON DELETE SET NULL
);

-- ============================================================================
-- 模式迁移表
-- ============================================================================

-- 数据库迁移记录表
CREATE TABLE IF NOT EXISTS schema_migrations (
    id INTEGER NOT NULL DEFAULT nextval('schema_migrations_id_seq'::regclass),
    version CHARACTER VARYING(50) NOT NULL,
    name CHARACTER VARYING(200) NOT NULL,
    applied_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    checksum CHARACTER VARYING(100),
    CONSTRAINT schema_migrations_pkey PRIMARY KEY (id),
    CONSTRAINT schema_migrations_version_key UNIQUE (version)
);

-- ============================================================================
-- 创建索引（性能优化）
-- ============================================================================

-- 用户相关索引
CREATE INDEX IF NOT EXISTS idx_users_username ON users USING btree (username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users USING btree (email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users USING btree (role);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users USING btree (is_active);

-- 对话相关索引
CREATE INDEX IF NOT EXISTS idx_conversations_session_id ON conversations USING btree (session_id);
CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations USING btree (user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_conversation_type ON conversations USING btree (conversation_type);
CREATE INDEX IF NOT EXISTS idx_conversations_created_at ON conversations USING btree (created_at);

CREATE INDEX IF NOT EXISTS idx_conversation_messages_conversation_id ON conversation_messages USING btree (conversation_id);
CREATE INDEX IF NOT EXISTS idx_conversation_messages_message_type ON conversation_messages USING btree (message_type);
CREATE INDEX IF NOT EXISTS idx_conversation_messages_agent_id ON conversation_messages USING btree (agent_id);
CREATE INDEX IF NOT EXISTS idx_conversation_messages_created_at ON conversation_messages USING btree (created_at);

-- Agent和Team相关索引
CREATE INDEX IF NOT EXISTS idx_agent_configs_agent_name ON agent_configs USING btree (agent_name);
CREATE INDEX IF NOT EXISTS idx_agent_configs_team_name ON agent_configs USING btree (team_name);
CREATE INDEX IF NOT EXISTS idx_agent_configs_is_active ON agent_configs USING btree (is_active);

CREATE INDEX IF NOT EXISTS idx_agent_memory_session_id ON agent_memory USING btree (session_id);
CREATE INDEX IF NOT EXISTS idx_agent_memory_user_id ON agent_memory USING btree (user_id);

CREATE INDEX IF NOT EXISTS idx_agent_storage_session_id ON agent_storage USING btree (session_id);
CREATE INDEX IF NOT EXISTS idx_agent_storage_user_id ON agent_storage USING btree (user_id);

CREATE INDEX IF NOT EXISTS idx_team_sessions_session_id ON team_sessions USING btree (session_id);
CREATE INDEX IF NOT EXISTS idx_team_sessions_team_name ON team_sessions USING btree (team_name);
CREATE INDEX IF NOT EXISTS idx_team_sessions_status ON team_sessions USING btree (status);

CREATE INDEX IF NOT EXISTS idx_team_executions_session_id ON team_executions USING btree (session_id);
CREATE INDEX IF NOT EXISTS idx_team_executions_execution_id ON team_executions USING btree (execution_id);
CREATE INDEX IF NOT EXISTS idx_team_executions_team_name ON team_executions USING btree (team_name);
CREATE INDEX IF NOT EXISTS idx_team_executions_status ON team_executions USING btree (status);
CREATE INDEX IF NOT EXISTS idx_team_executions_created_at ON team_executions USING btree (created_at);

CREATE INDEX IF NOT EXISTS idx_team_members_team_name ON team_members USING btree (team_name);
CREATE INDEX IF NOT EXISTS idx_team_members_member_id ON team_members USING btree (member_id);
CREATE INDEX IF NOT EXISTS idx_team_members_is_active ON team_members USING btree (is_active);

CREATE INDEX IF NOT EXISTS idx_team_execution_steps_execution_id ON team_execution_steps USING btree (execution_id);
CREATE INDEX IF NOT EXISTS idx_team_execution_steps_member_id ON team_execution_steps USING btree (member_id);
CREATE INDEX IF NOT EXISTS idx_team_execution_steps_status ON team_execution_steps USING btree (status);

CREATE INDEX IF NOT EXISTS idx_team_member_calls_execution_id ON team_member_calls USING btree (execution_id);
CREATE INDEX IF NOT EXISTS idx_team_member_calls_member_id ON team_member_calls USING btree (member_id);
CREATE INDEX IF NOT EXISTS idx_team_member_calls_status ON team_member_calls USING btree (status);

-- 知识库相关索引
CREATE INDEX IF NOT EXISTS idx_knowledge_documents_status ON knowledge_documents USING btree (status);
CREATE INDEX IF NOT EXISTS idx_knowledge_documents_file_type ON knowledge_documents USING btree (file_type);
CREATE INDEX IF NOT EXISTS idx_knowledge_documents_created_at ON knowledge_documents USING btree (created_at);

CREATE INDEX IF NOT EXISTS idx_document_chunks_document_id ON document_chunks USING btree (document_id);
CREATE INDEX IF NOT EXISTS idx_document_chunks_chunk_index ON document_chunks USING btree (chunk_index);
CREATE INDEX IF NOT EXISTS idx_document_chunks_embedding_model ON document_chunks USING btree (embedding_model);

CREATE INDEX IF NOT EXISTS idx_knowledge_sources_message_id ON knowledge_sources USING btree (message_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_sources_execution_id ON knowledge_sources USING btree (execution_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_sources_source_type ON knowledge_sources USING btree (source_type);
CREATE INDEX IF NOT EXISTS idx_knowledge_sources_score ON knowledge_sources USING btree (score);

CREATE INDEX IF NOT EXISTS idx_retrieval_results_query_hash ON retrieval_results USING btree (query_hash);
CREATE INDEX IF NOT EXISTS idx_retrieval_results_created_at ON retrieval_results USING btree (created_at);
CREATE INDEX IF NOT EXISTS idx_retrieval_results_expires_at ON retrieval_results USING btree (expires_at);

-- 配置相关索引
CREATE INDEX IF NOT EXISTS idx_model_configs_type ON model_configs USING btree (type);
CREATE INDEX IF NOT EXISTS idx_model_configs_provider ON model_configs USING btree (provider);
CREATE INDEX IF NOT EXISTS idx_model_configs_is_active ON model_configs USING btree (is_active);

CREATE INDEX IF NOT EXISTS idx_chunking_configs_strategy ON chunking_configs USING btree (strategy);
CREATE INDEX IF NOT EXISTS idx_chunking_configs_is_default ON chunking_configs USING btree (is_default);
CREATE INDEX IF NOT EXISTS idx_chunking_configs_is_active ON chunking_configs USING btree (is_active);

CREATE INDEX IF NOT EXISTS idx_vector_configs_model ON vector_configs USING btree (model);
CREATE INDEX IF NOT EXISTS idx_vector_configs_is_default ON vector_configs USING btree (is_default);

CREATE INDEX IF NOT EXISTS idx_system_configs_category ON system_configs USING btree (category);
CREATE INDEX IF NOT EXISTS idx_system_configs_is_public ON system_configs USING btree (is_public);

-- 任务相关索引
CREATE INDEX IF NOT EXISTS idx_task_queue_task_type ON task_queue USING btree (task_type);
CREATE INDEX IF NOT EXISTS idx_task_queue_status ON task_queue USING btree (status);
CREATE INDEX IF NOT EXISTS idx_task_queue_priority ON task_queue USING btree (priority);
CREATE INDEX IF NOT EXISTS idx_task_queue_worker_id ON task_queue USING btree (worker_id);
CREATE INDEX IF NOT EXISTS idx_task_queue_session_id ON task_queue USING btree (session_id);
CREATE INDEX IF NOT EXISTS idx_task_queue_created_at ON task_queue USING btree (created_at);

CREATE INDEX IF NOT EXISTS idx_task_workers_worker_type ON task_workers USING btree (worker_type);
CREATE INDEX IF NOT EXISTS idx_task_workers_status ON task_workers USING btree (status);

-- 图谱相关索引
CREATE INDEX IF NOT EXISTS idx_graph_nodes_type ON graph_nodes USING btree (type);
CREATE INDEX IF NOT EXISTS idx_graph_nodes_source_document_id ON graph_nodes USING btree (source_document_id);
CREATE INDEX IF NOT EXISTS idx_graph_nodes_confidence ON graph_nodes USING btree (confidence);

CREATE INDEX IF NOT EXISTS idx_graph_edges_from_node_id ON graph_edges USING btree (from_node_id);
CREATE INDEX IF NOT EXISTS idx_graph_edges_to_node_id ON graph_edges USING btree (to_node_id);
CREATE INDEX IF NOT EXISTS idx_graph_edges_type ON graph_edges USING btree (type);
CREATE INDEX IF NOT EXISTS idx_graph_edges_confidence ON graph_edges USING btree (confidence);

-- 论文和QA数据集相关索引
CREATE INDEX IF NOT EXISTS idx_papers_doi ON papers USING btree (doi);
CREATE INDEX IF NOT EXISTS idx_papers_year ON papers USING btree (year);
CREATE INDEX IF NOT EXISTS idx_papers_processed ON papers USING btree (processed);

CREATE INDEX IF NOT EXISTS idx_qa_datasets_status ON qa_datasets USING btree (status);
CREATE INDEX IF NOT EXISTS idx_qa_datasets_category ON qa_datasets USING btree (category);
CREATE INDEX IF NOT EXISTS idx_qa_datasets_vectorization_status ON qa_datasets USING btree (vectorization_status);

CREATE INDEX IF NOT EXISTS idx_qa_pairs_dataset_id ON qa_pairs USING btree (dataset_id);
CREATE INDEX IF NOT EXISTS idx_qa_pairs_category ON qa_pairs USING btree (category);
CREATE INDEX IF NOT EXISTS idx_qa_pairs_vector_status ON qa_pairs USING btree (vector_status);

-- 思考步骤和监控相关索引
CREATE INDEX IF NOT EXISTS idx_thinking_steps_message_id ON thinking_steps USING btree (message_id);
CREATE INDEX IF NOT EXISTS idx_thinking_steps_execution_id ON thinking_steps USING btree (execution_id);
CREATE INDEX IF NOT EXISTS idx_thinking_steps_step_type ON thinking_steps USING btree (step_type);
CREATE INDEX IF NOT EXISTS idx_thinking_steps_step_order ON thinking_steps USING btree (step_order);

CREATE INDEX IF NOT EXISTS idx_langdb_metrics_session_id ON langdb_metrics USING btree (session_id);
CREATE INDEX IF NOT EXISTS idx_langdb_metrics_metric_type ON langdb_metrics USING btree (metric_type);
CREATE INDEX IF NOT EXISTS idx_langdb_metrics_timestamp ON langdb_metrics USING btree (timestamp);

CREATE INDEX IF NOT EXISTS idx_system_logs_user_id ON system_logs USING btree (user_id);
CREATE INDEX IF NOT EXISTS idx_system_logs_action ON system_logs USING btree (action);
CREATE INDEX IF NOT EXISTS idx_system_logs_resource_type ON system_logs USING btree (resource_type);
CREATE INDEX IF NOT EXISTS idx_system_logs_timestamp ON system_logs USING btree (timestamp);

-- 多媒体相关索引
CREATE INDEX IF NOT EXISTS idx_media_files_media_type ON media_files USING btree (media_type);
CREATE INDEX IF NOT EXISTS idx_media_files_file_type ON media_files USING btree (file_type);
CREATE INDEX IF NOT EXISTS idx_media_files_file_hash ON media_files USING btree (file_hash);

CREATE INDEX IF NOT EXISTS idx_ocr_results_media_file_id ON ocr_results USING btree (media_file_id);
CREATE INDEX IF NOT EXISTS idx_ocr_results_language ON ocr_results USING btree (language);

-- 全文搜索索引
CREATE INDEX IF NOT EXISTS idx_conversation_messages_content_gin ON conversation_messages USING gin (to_tsvector('english'::regconfig, content));
CREATE INDEX IF NOT EXISTS idx_knowledge_documents_title_gin ON knowledge_documents USING gin (to_tsvector('english'::regconfig, title));
CREATE INDEX IF NOT EXISTS idx_document_chunks_content_gin ON document_chunks USING gin (to_tsvector('english'::regconfig, content));

-- ============================================================================
-- 创建视图
-- ============================================================================

-- Team对话详情视图
CREATE OR REPLACE VIEW team_conversation_details AS
SELECT 
    c.id as conversation_id,
    c.session_id,
    c.title,
    c.conversation_type,
    c.team_name,
    c.team_mode,
    c.created_at as conversation_created_at,
    cm.id as message_id,
    cm.message_type,
    cm.content,
    cm.agent_id,
    cm.agent_name,
    cm.is_team_message,
    cm.team_info,
    cm.knowledge_sources,
    cm.thinking_process,
    cm.sources,
    cm.processing_time,
    cm.model_used,
    cm.created_at as message_created_at,
    te.execution_id,
    te.status as execution_status,
    te.total_duration_ms,
    te.structured_output,
    te.coordination_info
FROM conversations c
LEFT JOIN conversation_messages cm ON c.id = cm.conversation_id
LEFT JOIN team_executions te ON c.session_id = te.session_id
WHERE c.conversation_type = 'team';

-- Team执行统计视图
CREATE OR REPLACE VIEW team_execution_stats AS
SELECT 
    team_name,
    COUNT(*) as total_executions,
    COUNT(CASE WHEN status = 'completed' THEN 1 END) as successful_executions,
    COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_executions,
    AVG(total_duration_ms) as avg_duration_ms,
    MAX(created_at) as last_execution_time
FROM team_executions
GROUP BY team_name;

-- Team成员性能统计视图
CREATE OR REPLACE VIEW team_member_performance_stats AS
SELECT 
    member_id,
    member_name,
    role,
    COUNT(*) as total_calls,
    COUNT(CASE WHEN status = 'completed' THEN 1 END) as successful_calls,
    COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_calls,
    AVG(duration_ms) as avg_duration_ms,
    SUM(duration_ms) as total_duration_ms,
    MAX(created_at) as last_call_time
FROM team_member_calls
GROUP BY member_id, member_name, role;

-- Team成员执行步骤性能统计视图
CREATE OR REPLACE VIEW team_member_performance AS
SELECT 
    member_id,
    member_name,
    COUNT(*) as total_steps,
    COUNT(CASE WHEN status = 'completed' THEN 1 END) as successful_steps,
    COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_steps,
    AVG(duration_ms) as avg_duration_ms,
    MAX(created_at) as last_step_time
FROM team_execution_steps
GROUP BY member_id, member_name;

-- ============================================================================
-- 触发器和函数定义
-- ============================================================================

-- 更新时间戳触发器函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 为需要的表添加更新时间戳触发器
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_preferences_updated_at BEFORE UPDATE ON user_preferences FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON conversations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_knowledge_documents_updated_at BEFORE UPDATE ON knowledge_documents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_document_chunks_updated_at BEFORE UPDATE ON document_chunks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_model_configs_updated_at BEFORE UPDATE ON model_configs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_vector_configs_updated_at BEFORE UPDATE ON vector_configs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_system_configs_updated_at BEFORE UPDATE ON system_configs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_graph_nodes_updated_at BEFORE UPDATE ON graph_nodes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_graph_edges_updated_at BEFORE UPDATE ON graph_edges FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_papers_updated_at BEFORE UPDATE ON papers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_media_files_updated_at BEFORE UPDATE ON media_files FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 图统计更新触发器函数
CREATE OR REPLACE FUNCTION update_graph_stats()
RETURNS TRIGGER AS $$
BEGIN
    -- 更新节点和边的统计信息
    UPDATE graph_stats SET
        node_count = (SELECT COUNT(*) FROM graph_nodes),
        edge_count = (SELECT COUNT(*) FROM graph_edges),
        avg_connections = (SELECT AVG(connections) FROM graph_nodes),
        last_updated = CURRENT_TIMESTAMP
    WHERE id = 'main_graph';
    
    -- 如果统计记录不存在则创建
    INSERT INTO graph_stats (id, node_count, edge_count, avg_connections, last_updated)
    SELECT 'main_graph', 
           (SELECT COUNT(*) FROM graph_nodes),
           (SELECT COUNT(*) FROM graph_edges),
           (SELECT COALESCE(AVG(connections), 0) FROM graph_nodes),
           CURRENT_TIMESTAMP
    WHERE NOT EXISTS (SELECT 1 FROM graph_stats WHERE id = 'main_graph');
    
    RETURN COALESCE(NEW, OLD);
END;
$$ language 'plpgsql';

-- 为图相关表添加统计更新触发器
CREATE TRIGGER update_graph_stats_on_node_change 
    AFTER INSERT OR UPDATE OR DELETE ON graph_nodes 
    FOR EACH STATEMENT EXECUTE FUNCTION update_graph_stats();

CREATE TRIGGER update_graph_stats_on_edge_change 
    AFTER INSERT OR UPDATE OR DELETE ON graph_edges 
    FOR EACH STATEMENT EXECUTE FUNCTION update_graph_stats();

-- ============================================================================
-- 初始数据插入
-- ============================================================================

-- 插入默认用户数据
INSERT INTO users (username, email, hashed_password, full_name, role, is_active, is_superuser, password_hash, created_at)
VALUES 
('admin', 'admin@geopolymer.com', '$2b$12$LVHoEr8JKpmh7L9jCOPm8O8QfWw8oUKC7sW6hzG3BfTKC8k5OVYzW', '系统管理员', 'admin', true, true, '$2b$12$LVHoEr8JKpmh7L9jCOPm8O8QfWw8oUKC7sW6hzG3BfTKC8k5OVYzW', '2025-08-10 10:51:10.184501+08'),
('researcher1', 'researcher1@geopolymer.com', '$2b$12$LVHoEr8JKpmh7L9jCOPm8O8QfWw8oUKC7sW6hzG3BfTKC8k5OVYzW', '研究员1', 'researcher', true, false, '$2b$12$LVHoEr8JKpmh7L9jCOPm8O8QfWw8oUKC7sW6hzG3BfTKC8k5OVYzW', '2025-08-10 10:51:10.184501+08'),
('researcher2', 'researcher2@geopolymer.com', '$2b$12$LVHoEr8JKpmh7L9jCOPm8O8QfWw8oUKC7sW6hzG3BfTKC8k5OVYzW', '研究员2', 'researcher', true, false, '$2b$12$LVHoEr8JKpmh7L9jCOPm8O8QfWw8oUKC7sW6hzG3BfTKC8k5OVYzW', '2025-08-10 12:53:42.802634+08'),
('researcher3', 'researcher3@geopolymer.com', '$2b$12$LVHoEr8JKpmh7L9jCOPm8O8QfWw8oUKC7sW6hzG3BfTKC8k5OVYzW', '研究员3', 'researcher', true, false, '$2b$12$LVHoEr8JKpmh7L9jCOPm8O8QfWw8oUKC7sW6hzG3BfTKC8k5OVYzW', '2025-08-10 12:53:42.802634+08')
ON CONFLICT (username) DO NOTHING;

-- 插入系统配置数据
INSERT INTO system_configs (id, category, key, value, description, is_public, created_at)
VALUES 
('app-basic-config', 'application', 'basic_settings', '{"name": "地聚物材料智能问答系统", "version": "1.3.2", "environment": "production"}', '应用基础配置', true, '2025-08-12 10:00:00+08'),
('search-config', 'search', 'retrieval_settings', '{"cache_ttl": 3600, "default_top_k": 10, "enable_rerank": true, "default_threshold": 0.7, "hybrid_weights": {"vector": 0.6, "keyword": 0.4}}', '检索配置', true, '2025-08-12 10:00:00+08'),
('graph-config', 'graph', 'visualization_settings', '{"edge_limit": 5000, "node_limit": 1000, "default_layout": "spring", "physics_enabled": true, "clustering_enabled": true}', '图谱可视化配置', true, '2025-08-12 10:00:00+08'),
('upload-config', 'upload', 'file_settings', '{"chunk_size": 8192, "max_file_size": 52428800, "allowed_extensions": ["pdf", "docx", "txt", "md", "xlsx"], "auto_vectorization": true}', '文件上传配置', true, '2025-08-12 10:00:00+08'),
('multimodal-config', 'multimodal', 'processing_settings', '{"ocr_enabled": true, "max_image_size": "2048x2048", "max_video_duration": 300, "thumbnail_generation": true, "video_analysis_enabled": true, "supported_image_formats": ["jpg", "jpeg", "png", "webp", "bmp"], "supported_video_formats": ["mp4", "avi", "mov"]}', '多模态处理配置', true, '2025-08-12 10:00:00+08'),
('multimodal-models', 'multimodal', 'model_settings', '{"ocr_model": "qwen-vl-plus-model", "video_model": "qwen-vl-max-model", "default_vl_model": "qwen-vl-chat-model", "auto_model_selection": true}', '多模态模型配置', true, '2025-08-12 10:00:00+08'),
('media-storage', 'storage', 'media_settings', '{"base_path": "/uploads/media", "storage_type": "local", "max_file_size": 52428800, "thumbnail_path": "/uploads/thumbnails", "cleanup_interval": 86400}', '媒体文件存储配置', true, '2025-08-12 10:00:00+08'),
('llm-models', 'models', 'llm_settings', '{"default_model": "Qwen/Qwen3-30B-A3B-Thinking-2507", "backup_model": "Qwen/Qwen3-30B-A3B-Instruct-2507", "temperature": 0.1, "max_tokens": 4096, "providers": ["oneapi", "siliconflow"]}', 'LLM模型配置', false, '2025-08-12 10:00:00+08'),
('embedding-models', 'models', 'embedding_settings', '{"default_model": "Qwen/Qwen3-Embedding-4B", "dimension": 2048, "batch_size": 16, "providers": ["oneapi", "openai"]}', '嵌入模型配置', false, '2025-08-12 10:00:00+08')
ON CONFLICT (category, key) DO UPDATE SET 
    value = EXCLUDED.value,
    description = EXCLUDED.description,
    updated_at = CURRENT_TIMESTAMP;

-- 插入默认分块配置
INSERT INTO chunking_configs (id, name, description, strategy, chunk_token_num, max_token_num, chunk_overlap, delimiter, tokenizer_type, preserve_structure, semantic_threshold, supported_formats, is_default, is_active, created_at, updated_at)
VALUES 
('77ebf712-9ad7-4130-9f1a-624eade0f733', '通用文档切分', '适合大多数文档的通用切分配置，平衡切分质量和处理效率', 'semantic', 400, 512, 50, '!?。！？.;', 'simple', true, 30, '["txt", "md", "pdf", "docx"]', true, true, '2025-08-12 10:00:00', '2025-08-12 10:00:00'),
('e96ba455-3684-4e6f-90fe-fe1dd57ca8b7', '学术论文切分', '专门针对学术论文的切分配置，保留更多结构信息', 'semantic', 300, 600, 80, '!?。！？.;', 'advanced', true, 40, '["pdf", "docx", "txt"]', false, true, '2025-08-12 10:00:00', '2025-08-12 10:00:00'),
('3500be30-47dc-4748-9edc-2f82999faf8f', '快速处理切分', '快速处理模式，适合大批量文档的快速切分', 'fixed', 256, 400, 20, '。！？', 'simple', false, 20, '["txt", "md"]', false, true, '2025-08-12 10:00:00', '2025-08-12 10:00:00'),
('281088f9-dd85-4a1a-bc74-cac64fe09b5c', '精细切分', '高质量精细切分，适合重要文档的详细分析', 'semantic', 200, 400, 100, '!?。！？.;,:：，', 'advanced', true, 50, '["pdf", "docx", "md", "txt"]', false, true, '2025-08-12 10:00:00', '2025-08-12 10:00:00')
ON CONFLICT (id) DO UPDATE SET
    description = EXCLUDED.description,
    updated_at = EXCLUDED.updated_at;

-- 插入默认Agent配置
INSERT INTO agent_configs (id, agent_name, team_name, model_provider, model_id, temperature, max_tokens, top_p, frequency_penalty, presence_penalty, is_active, created_at, updated_at)
VALUES 
('2eb3dd2e-0893-441d-bef2-b359af282fcd', 'question_decomposition_agent', 'geopolymer_qa_team_v2', 'one_api', 'qwen3-30b-a3b-instruct-2507', 0.1, 4096, 1.0, 0.0, 0.0, true, '2025-08-03 17:50:04', '2025-08-12 10:00:00')
ON CONFLICT (id) DO UPDATE SET
    model_id = EXCLUDED.model_id,
    updated_at = EXCLUDED.updated_at;

-- 插入Team成员配置
INSERT INTO team_members (team_name, member_id, member_name, role, model_provider, model_id, is_active, created_at, updated_at)
VALUES 
('geopolymer_qa_team_v2', 'question_decomposition_agent', '问题分解专家', '问题分解和领域识别', 'one_api', 'qwen3-30b-a3b-instruct-2507', true, '2025-08-12 10:00:00+08', '2025-08-12 10:00:00+08'),
('geopolymer_qa_team_v2', 'translation_agent', '实时翻译专家', '多语言翻译和术语处理', 'one_api', 'gemini-2.5-flash-preview-thinking', true, '2025-08-12 10:00:00+08', '2025-08-12 10:00:00+08'),
('geopolymer_qa_team_v2', 'knowledge_retrieval_agent', '多语言知识检索专家', '多语言检索和相关性评分', 'one_api', 'qwen3-30b-a3b-instruct-2507', true, '2025-08-12 10:00:00+08', '2025-08-12 10:00:00+08'),
('geopolymer_qa_team_v2', 'knowledge_graph_agent', '知识图谱专家', '图谱数据检索和实体关系分析', 'one_api', 'qwen3-30b-a3b-instruct-2507', true, '2025-08-12 10:00:00+08', '2025-08-12 10:00:00+08'),
('geopolymer_qa_team_v2', 'summary_answer_agent', '总结回答专家', '结果整合和结构化输出', 'one_api', 'qwen3-30b-a3b-instruct-2507', true, '2025-08-12 10:00:00+08', '2025-08-12 10:00:00+08'),
('geopolymer_qa_team_v2', 'qa_coordinator_v2', '多语言问答协调器', '流程协调和质量监控', 'one_api', 'qwen3-30b-a3b-instruct-2507', true, '2025-08-12 10:00:00+08', '2025-08-12 10:00:00+08')
ON CONFLICT (team_name, member_id) DO UPDATE SET
    model_id = EXCLUDED.model_id,
    updated_at = EXCLUDED.updated_at;

-- 插入Team执行模板
INSERT INTO team_execution_templates (template_id, team_name, execution_mode, agent_sequence, dependencies, timeout_config, retry_config, is_active, version, created_at, updated_at)
VALUES 
('geopolymer_qa_v2_template', 'geopolymer_qa_team_v2', 'sequential', 
 '[
   {"step": 1, "agent": "question_decomposition_agent", "required": true},
   {"step": 2, "agent": "translation_agent", "required": false, "condition": "multilingual"},
   {"step": 3, "agent": "knowledge_retrieval_agent", "required": true, "parallel": ["knowledge_graph_agent"]},
   {"step": 4, "agent": "knowledge_graph_agent", "required": true},
   {"step": 5, "agent": "summary_answer_agent", "required": true},
   {"step": 6, "agent": "qa_coordinator_v2", "required": true}
 ]'::jsonb,
 '{"knowledge_retrieval_agent": ["question_decomposition_agent"], "knowledge_graph_agent": ["question_decomposition_agent"], "summary_answer_agent": ["knowledge_retrieval_agent", "knowledge_graph_agent"]}'::jsonb,
 '{"step": 30, "agent": 60, "total": 600}'::jsonb,
 '{"max_retries": 3, "backoff_factor": 1.5, "retry_on": ["timeout", "model_error"]}'::jsonb,
 true, 1, '2025-08-12 10:00:00', '2025-08-12 10:00:00')
ON CONFLICT (template_id) DO UPDATE SET
    agent_sequence = EXCLUDED.agent_sequence,
    timeout_config = EXCLUDED.timeout_config,
    updated_at = EXCLUDED.updated_at;

-- 插入默认向量配置
INSERT INTO vector_configs (id, name, model, dimension, chunk_size, chunk_overlap, strategy, is_default, created_at, updated_at)
VALUES 
('qwen3-embedding-4b-config', 'Qwen3 Embedding 4B 配置', 'Qwen/Qwen3-Embedding-4B', 2048, 400, 50, 'general', true, '2025-08-12 10:00:00+08', '2025-08-12 10:00:00+08'),
('matbert-config', 'MatBERT 领域配置', 'matbert', 768, 400, 50, 'domain', false, '2025-08-12 10:00:00+08', '2025-08-12 10:00:00+08'),
('openai-ada-config', 'OpenAI Ada 配置', 'text-embedding-ada-002', 1536, 512, 64, 'general', false, '2025-08-12 10:00:00+08', '2025-08-12 10:00:00+08')
ON CONFLICT (id) DO UPDATE SET
    dimension = EXCLUDED.dimension,
    updated_at = EXCLUDED.updated_at;

-- 插入默认任务工作者
INSERT INTO task_workers (worker_id, worker_type, max_concurrent_tasks, current_task_count, status, capabilities, metadata, last_heartbeat)
VALUES 
('vectorization-worker-1', 'vectorization', 3, 0, 'active', '["text_embedding", "batch_processing"]'::jsonb, '{"hardware": "GPU", "memory": "16GB", "location": "main_server"}'::jsonb, '2025-08-12 10:00:00+08'),
('file-processing-worker-1', 'file_processing', 5, 0, 'active', '["pdf_parse", "docx_parse", "text_extract", "ocr"]'::jsonb, '{"hardware": "CPU", "memory": "8GB", "location": "worker_server"}'::jsonb, '2025-08-12 10:00:00+08'),
('graph-worker-1', 'knowledge_graph', 2, 0, 'active', '["entity_extraction", "relation_extraction", "graph_construction"]'::jsonb, '{"hardware": "CPU", "memory": "16GB", "location": "main_server"}'::jsonb, '2025-08-12 10:00:00+08')
ON CONFLICT (worker_id) DO UPDATE SET
    max_concurrent_tasks = EXCLUDED.max_concurrent_tasks,
    capabilities = EXCLUDED.capabilities,
    metadata = EXCLUDED.metadata,
    last_heartbeat = EXCLUDED.last_heartbeat;

-- 插入初始图统计数据
INSERT INTO graph_stats (id, node_count, edge_count, avg_connections, type_distribution, last_updated, graph_version)
VALUES 
('main_graph', 0, 0, 0.0, '{}'::jsonb, '2025-08-12 10:00:00+08', '1.0'),
('temp_graph', 0, 0, 0.0, '{}'::jsonb, '2025-08-12 10:00:00+08', '1.0')
ON CONFLICT (id) DO UPDATE SET
    last_updated = EXCLUDED.last_updated,
    graph_version = EXCLUDED.graph_version;

-- 插入数据库迁移记录
INSERT INTO schema_migrations (version, name, applied_at, checksum)
VALUES 
('20250812_001', 'initial_database_setup', '2025-08-12 10:00:00+08', 'abc123def456'),
('20250812_002', 'add_team_execution_templates', '2025-08-12 10:00:00+08', 'def456ghi789'),
('20250812_003', 'add_multimodal_support', '2025-08-12 10:00:00+08', 'ghi789jkl012'),
('20250812_004', 'add_performance_views', '2025-08-12 10:00:00+08', 'jkl012mno345')
ON CONFLICT (version) DO NOTHING;

-- ============================================================================
-- 权限和安全设置
-- ============================================================================

-- 创建应用角色（生产环境中应该创建专门的数据库用户）
-- CREATE ROLE mat_app_user LOGIN PASSWORD 'secure_password_here';
-- CREATE ROLE mat_readonly_user LOGIN PASSWORD 'readonly_password_here';

-- 授权示例（生产环境中取消注释并配置适当的密码）
-- GRANT CONNECT ON DATABASE matdemo TO mat_app_user;
-- GRANT USAGE ON SCHEMA public TO mat_app_user;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO mat_app_user;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO mat_app_user;

-- 只读用户权限
-- GRANT CONNECT ON DATABASE matdemo TO mat_readonly_user;
-- GRANT USAGE ON SCHEMA public TO mat_readonly_user;
-- GRANT SELECT ON ALL TABLES IN SCHEMA public TO mat_readonly_user;

-- 行级安全策略示例（如需要）
-- ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY user_conversations ON conversations FOR ALL TO mat_app_user USING (user_id = current_setting('app.current_user_id')::integer);

-- ============================================================================
-- 数据库维护建议
-- ============================================================================

-- 定期清理任务
-- 1. 清理过期的检索结果缓存
-- DELETE FROM retrieval_results WHERE expires_at IS NOT NULL AND expires_at < NOW() - INTERVAL '7 days';

-- 2. 清理已完成的任务队列记录
-- DELETE FROM task_queue WHERE status = 'completed' AND completed_at < NOW() - INTERVAL '30 days';

-- 3. 清理过期的任务锁
-- DELETE FROM task_locks WHERE expires_at < NOW();

-- 4. 归档旧的系统日志
-- DELETE FROM system_logs WHERE timestamp < NOW() - INTERVAL '90 days';

-- 性能监控查询示例
-- SELECT schemaname, tablename, 
--        pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
--        pg_total_relation_size(schemaname||'.'||tablename) as size_bytes
-- FROM pg_tables 
-- WHERE schemaname = 'public' 
-- ORDER BY size_bytes DESC;

-- 索引使用情况监控
-- SELECT schemaname, tablename, indexname, idx_tup_read, idx_tup_fetch
-- FROM pg_stat_user_indexes
-- WHERE idx_tup_read > 0
-- ORDER BY idx_tup_read DESC;

-- ============================================================================
-- 完成标记
-- ============================================================================

-- 更新数据库版本信息
UPDATE system_configs 
SET value = '{"name": "地聚物材料智能问答系统", "version": "1.3.2", "environment": "production", "db_initialized": true, "db_version": "2025.08.12", "last_updated": "2025-08-12T10:00:00Z"}'::jsonb,
    updated_at = CURRENT_TIMESTAMP
WHERE category = 'application' AND key = 'basic_settings';

-- 提交事务
COMMIT;

-- ============================================================================
-- 数据库初始化完成
-- 生成时间: 2025-08-12
-- 总表数: 52 个表
-- 总索引数: 80+ 个索引  
-- 总视图数: 4 个视图
-- 总触发器数: 15+ 个触发器
-- 总初始记录数: 50+ 条记录
-- ============================================================================

-- 验证数据库完整性
-- SELECT 'Database initialization completed successfully!' as status;
-- SELECT COUNT(*) as total_tables FROM information_schema.tables WHERE table_schema = 'public';
-- SELECT COUNT(*) as total_indexes FROM pg_indexes WHERE schemaname = 'public';
-- SELECT COUNT(*) as initial_users FROM users;
-- SELECT COUNT(*) as initial_configs FROM system_configs;