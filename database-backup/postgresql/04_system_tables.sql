-- System and Task Management Tables Schema Export  
-- Generated from zzdsj_demo database
-- Date: 2025-08-27

-- ============================================================================
-- SYSTEM CONFIGURATION TABLES
-- ============================================================================

CREATE TABLE system_configs (
    id VARCHAR(50) PRIMARY KEY,
    category VARCHAR(100) NOT NULL,
    key VARCHAR(200) NOT NULL,
    value JSONB NOT NULL,
    description TEXT,
    is_public BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ
);

CREATE TABLE model_configs (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    type VARCHAR(50) NOT NULL,
    provider VARCHAR(100) NOT NULL,
    model VARCHAR(200) NOT NULL,
    api_key VARCHAR(500),
    base_url VARCHAR(500),
    parameters JSONB,
    is_active BOOLEAN DEFAULT true,
    max_tokens INTEGER,
    temperature REAL,
    dimension INTEGER,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ
);

-- ============================================================================
-- TASK QUEUE SYSTEM  
-- ============================================================================

CREATE TABLE task_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_type VARCHAR(100) NOT NULL,
    task_name VARCHAR(200),
    task_data JSONB NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    priority INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,
    retry_count INTEGER DEFAULT 0,
    worker_id VARCHAR(100),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    failed_at TIMESTAMPTZ,
    error_message TEXT,
    result_data JSONB,
    timeout_seconds INTEGER,
    scheduled_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER,
    tags TEXT[],
    dependencies UUID[],
    progress_percentage INTEGER DEFAULT 0,
    estimated_duration_seconds INTEGER,
    actual_duration_seconds INTEGER,
    parent_task_id UUID,
    FOREIGN KEY (parent_task_id) REFERENCES task_queue(id)
);

CREATE TABLE task_workers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    worker_name VARCHAR(100) NOT NULL,
    worker_type VARCHAR(50) DEFAULT 'general',
    status VARCHAR(20) DEFAULT 'idle',
    supported_task_types TEXT[],
    current_task_id UUID,
    last_heartbeat TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    worker_metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (current_task_id) REFERENCES task_queue(id)
);

CREATE TABLE task_statistics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_type VARCHAR(100) NOT NULL,
    period_type VARCHAR(20) DEFAULT 'daily',
    period_start TIMESTAMPTZ NOT NULL,
    period_end TIMESTAMPTZ NOT NULL,
    total_tasks INTEGER DEFAULT 0,
    completed_tasks INTEGER DEFAULT 0,
    failed_tasks INTEGER DEFAULT 0,
    avg_duration_ms REAL,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE task_locks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    resource_name VARCHAR(200) NOT NULL,
    lock_key VARCHAR(200) NOT NULL,
    owner_id VARCHAR(100) NOT NULL,
    acquired_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMPTZ NOT NULL,
    metadata JSONB
);

-- ============================================================================
-- LOGGING AND MONITORING TABLES
-- ============================================================================

CREATE TABLE api_access_logs (
    id BIGSERIAL PRIMARY KEY,
    user_id INTEGER,
    endpoint VARCHAR(200) NOT NULL,
    method VARCHAR(10) NOT NULL,
    request_data JSONB,
    response_status INTEGER,
    response_time_ms INTEGER,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE system_logs (
    id BIGSERIAL PRIMARY KEY,
    level VARCHAR(20) NOT NULL,
    logger VARCHAR(100) NOT NULL,
    message TEXT NOT NULL,
    timestamp TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    module VARCHAR(100),
    function VARCHAR(100),
    line_number INTEGER,
    extra_data JSONB
);

CREATE TABLE performance_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    metric_name VARCHAR(100) NOT NULL,
    metric_type VARCHAR(50) NOT NULL,
    metric_value DOUBLE PRECISION NOT NULL,
    tags JSONB,
    timestamp TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE langdb_metrics (
    id BIGSERIAL PRIMARY KEY,
    session_id VARCHAR(100),
    operation_type VARCHAR(50) NOT NULL,
    operation_name VARCHAR(100),
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ,
    duration_ms INTEGER,
    success BOOLEAN,
    error_message TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);