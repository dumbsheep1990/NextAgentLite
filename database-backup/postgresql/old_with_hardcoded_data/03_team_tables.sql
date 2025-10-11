-- Team Management Tables Schema Export
-- Generated from zzdsj_demo database
-- Date: 2025-08-27

-- ============================================================================
-- TEAM EXECUTION SYSTEM
-- ============================================================================

CREATE TABLE team_sessions (
    id SERIAL PRIMARY KEY,
    session_name VARCHAR(255) NOT NULL,
    team_config JSONB NOT NULL,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER
);

CREATE TABLE team_session_instances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id INTEGER NOT NULL,
    instance_name VARCHAR(255),
    config_overrides JSONB,
    status VARCHAR(20) DEFAULT 'active',
    started_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    ended_at TIMESTAMPTZ,
    execution_count INTEGER DEFAULT 0,
    last_activity TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES team_sessions(id)
);

CREATE TABLE team_executions (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(100) NOT NULL,
    execution_id VARCHAR(100) NOT NULL,
    team_name VARCHAR(200) NOT NULL,
    query TEXT NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    start_time TIMESTAMPTZ DEFAULT now(),
    end_time TIMESTAMPTZ,
    duration_ms INTEGER,
    result_content TEXT,
    error_message TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT now(),
    conversation_id INTEGER,
    message_id INTEGER,
    total_duration_ms INTEGER,
    structured_output JSONB,
    coordination_info JSONB,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    team_mode VARCHAR(50) DEFAULT 'coordinate',
    execution_mode VARCHAR(20) DEFAULT 'sequential',
    performance_metrics JSONB DEFAULT '{}'
);

CREATE TABLE team_members (
    id SERIAL PRIMARY KEY,
    team_name VARCHAR(200) NOT NULL,
    member_id VARCHAR(100) NOT NULL,
    member_name VARCHAR(200) NOT NULL,
    role VARCHAR(200) NOT NULL,
    model_provider VARCHAR(100),
    model_id VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE team_execution_steps (
    id SERIAL PRIMARY KEY,
    execution_id INTEGER NOT NULL,
    step_number INTEGER NOT NULL,
    agent_name VARCHAR(100) NOT NULL,
    step_type VARCHAR(50) DEFAULT 'action',
    input_data JSONB,
    output_data JSONB,
    status VARCHAR(20) DEFAULT 'pending',
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    error_message TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (execution_id) REFERENCES team_executions(id)
);

CREATE TABLE team_member_calls (
    id SERIAL PRIMARY KEY,
    execution_id INTEGER NOT NULL,
    member_id VARCHAR(100) NOT NULL,
    call_type VARCHAR(50) DEFAULT 'tool',
    call_data JSONB NOT NULL,
    response_data JSONB,
    status VARCHAR(20) DEFAULT 'pending',
    start_time TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    end_time TIMESTAMPTZ,
    duration_ms INTEGER,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (execution_id) REFERENCES team_executions(id)
);

CREATE TABLE team_execution_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_name VARCHAR(255) NOT NULL,
    description TEXT,
    team_config JSONB NOT NULL,
    execution_flow JSONB,
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER
);

CREATE TABLE team_execution_traces (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    execution_id INTEGER NOT NULL,
    trace_type VARCHAR(50) NOT NULL,
    trace_data JSONB NOT NULL,
    timestamp_ms BIGINT NOT NULL,
    sequence_number INTEGER,
    parent_trace_id UUID,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (execution_id) REFERENCES team_executions(id),
    FOREIGN KEY (parent_trace_id) REFERENCES team_execution_traces(id)
);