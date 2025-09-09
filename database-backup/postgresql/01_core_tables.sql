-- Core Tables Schema Export
-- Generated from zzdsj_demo database
-- Date: 2025-08-27

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";
CREATE EXTENSION IF NOT EXISTS "btree_gin";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ============================================================================
-- AGENT AND TEAM MANAGEMENT TABLES
-- ============================================================================

CREATE TABLE agent_configs (
    id VARCHAR(36) NOT NULL,
    agent_name VARCHAR(100) NOT NULL,
    team_name VARCHAR(100),
    model_provider VARCHAR(50),
    model_id VARCHAR(100),
    temperature DOUBLE PRECISION,
    max_tokens INTEGER,
    top_p DOUBLE PRECISION,
    frequency_penalty DOUBLE PRECISION,
    presence_penalty DOUBLE PRECISION,
    extra_config TEXT,
    is_active BOOLEAN NOT NULL,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL
);

CREATE TABLE agent_memory (
    id SERIAL PRIMARY KEY,
    content TEXT NOT NULL,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    session_id VARCHAR(255) NOT NULL DEFAULT 'default_session',
    user_id VARCHAR(255),
    memory JSONB NOT NULL DEFAULT '{}'
);

CREATE TABLE agent_storage (
    id SERIAL PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    session_id VARCHAR(255) NOT NULL DEFAULT 'default_session',
    user_id VARCHAR(255),
    agent_data JSONB NOT NULL DEFAULT '{}'
);

CREATE TABLE agent_tool_calls (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    execution_id VARCHAR(100),
    agent_id VARCHAR(100) NOT NULL,
    tool_name VARCHAR(100) NOT NULL,
    tool_input JSONB,
    tool_output JSONB,
    call_status VARCHAR(20) DEFAULT 'pending',
    start_time TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    end_time TIMESTAMPTZ,
    duration_ms INTEGER,
    error_message TEXT,
    metadata JSONB
);

-- ============================================================================
-- USER MANAGEMENT TABLES  
-- ============================================================================

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
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
    updated_at TIMESTAMPTZ,
    last_login TIMESTAMPTZ,
    password_hash VARCHAR(255) NOT NULL
);

CREATE TABLE user_preferences (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    preference_key VARCHAR(100) NOT NULL,
    preference_value JSONB,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE user_sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    session_token VARCHAR(255) NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    last_activity TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    ip_address INET,
    user_agent TEXT
);

-- ============================================================================
-- CONVERSATION TABLES
-- ============================================================================

CREATE TABLE conversations (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(100) NOT NULL,
    title VARCHAR(200),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ,
    conversation_type VARCHAR(10) DEFAULT 'single',
    team_name VARCHAR(100),
    team_mode VARCHAR(20),
    user_id INTEGER
);

CREATE TABLE conversation_messages (
    id SERIAL PRIMARY KEY,
    conversation_id INTEGER,
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
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    agent_id VARCHAR(100),
    agent_name VARCHAR(200),
    thinking JSON,
    knowledge_sources JSON,
    is_team_message BOOLEAN DEFAULT false,
    team_info JSONB,
    thinking_process JSONB,
    graph_sources JSONB
);