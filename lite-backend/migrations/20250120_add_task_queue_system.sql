-- ================================================================
-- 任务队列系统数据库迁移 - 持久化任务管理
-- ================================================================
-- 创建时间: 2025-01-20
-- 版本: v1.0
-- 功能: 替代内存任务管理器，实现任务状态持久化和并发控制
-- ================================================================

-- 任务队列表 - 主任务表
CREATE TABLE IF NOT EXISTS task_queue (
    id VARCHAR(50) PRIMARY KEY,
    task_type VARCHAR(50) NOT NULL,                    -- 任务类型: document_processing, vectorization, qa_dataset, graph_extraction
    priority INTEGER DEFAULT 0,                        -- 任务优先级 (数字越大优先级越高)
    status VARCHAR(20) NOT NULL DEFAULT 'pending',     -- 任务状态: pending, running, completed, failed, cancelled
    worker_id VARCHAR(100),                            -- 处理该任务的工作进程ID
    
    -- 任务参数
    task_data JSONB NOT NULL,                          -- 任务参数 (document_id, config等)
    session_id VARCHAR(100),                           -- 前端会话ID，用于状态恢复
    
    -- 进度跟踪
    progress INTEGER DEFAULT 0,                        -- 任务进度 0-100
    current_stage VARCHAR(100),                        -- 当前阶段描述
    stage_detail TEXT,                                 -- 阶段详细信息
    
    -- 结果和错误
    result JSONB,                                      -- 任务结果
    error_message TEXT,                                -- 错误信息
    error_details JSONB,                               -- 错误详细信息
    
    -- 依赖管理
    depends_on JSONB,                                  -- 依赖的任务ID列表
    blocks JSONB,                                      -- 此任务阻塞的任务ID列表
    
    -- 重试机制
    retry_count INTEGER DEFAULT 0,                     -- 已重试次数
    max_retries INTEGER DEFAULT 3,                     -- 最大重试次数
    
    -- 时间戳
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,               -- 任务过期时间
    
    -- 资源消耗跟踪
    memory_usage BIGINT,                               -- 内存使用量 (bytes)
    cpu_time REAL,                                     -- CPU使用时间 (seconds)
    processing_time REAL                               -- 总处理时间 (seconds)
);

-- 任务锁表 - 用于并发控制
CREATE TABLE IF NOT EXISTS task_locks (
    resource_id VARCHAR(100) PRIMARY KEY,              -- 资源ID (如document_id)
    resource_type VARCHAR(50) NOT NULL,                -- 资源类型
    task_id VARCHAR(50) REFERENCES task_queue(id) ON DELETE CASCADE,
    locked_by VARCHAR(100) NOT NULL,                   -- 锁定的工作进程ID
    locked_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL       -- 锁过期时间
);

-- 工作进程注册表
CREATE TABLE IF NOT EXISTS task_workers (
    worker_id VARCHAR(100) PRIMARY KEY,
    worker_type VARCHAR(50) NOT NULL,                  -- 工作进程类型: vectorization, processing, graph
    max_concurrent_tasks INTEGER DEFAULT 1,            -- 最大并发任务数
    current_task_count INTEGER DEFAULT 0,              -- 当前任务数
    status VARCHAR(20) DEFAULT 'active',               -- 工作进程状态: active, idle, stopped
    last_heartbeat TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    capabilities JSONB,                                -- 工作进程能力描述
    metadata JSONB                                     -- 工作进程元数据
);

-- 任务统计表
CREATE TABLE IF NOT EXISTS task_statistics (
    id SERIAL PRIMARY KEY,
    date DATE NOT NULL,
    task_type VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL,
    count INTEGER DEFAULT 0,
    avg_processing_time REAL,
    avg_memory_usage BIGINT,
    total_cpu_time REAL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(date, task_type, status)
);

-- ================================================================
-- 索引创建
-- ================================================================

-- 任务队列索引
CREATE INDEX IF NOT EXISTS idx_task_queue_status ON task_queue(status);
CREATE INDEX IF NOT EXISTS idx_task_queue_task_type ON task_queue(task_type);
CREATE INDEX IF NOT EXISTS idx_task_queue_priority ON task_queue(priority DESC);
CREATE INDEX IF NOT EXISTS idx_task_queue_session_id ON task_queue(session_id);
CREATE INDEX IF NOT EXISTS idx_task_queue_worker_id ON task_queue(worker_id);
CREATE INDEX IF NOT EXISTS idx_task_queue_created_at ON task_queue(created_at);
CREATE INDEX IF NOT EXISTS idx_task_queue_status_priority ON task_queue(status, priority DESC);
CREATE INDEX IF NOT EXISTS idx_task_queue_type_status ON task_queue(task_type, status);

-- 任务锁索引
CREATE INDEX IF NOT EXISTS idx_task_locks_resource_type ON task_locks(resource_type);
CREATE INDEX IF NOT EXISTS idx_task_locks_expires_at ON task_locks(expires_at);
CREATE INDEX IF NOT EXISTS idx_task_locks_locked_by ON task_locks(locked_by);

-- 工作进程索引
CREATE INDEX IF NOT EXISTS idx_task_workers_worker_type ON task_workers(worker_type);
CREATE INDEX IF NOT EXISTS idx_task_workers_status ON task_workers(status);
CREATE INDEX IF NOT EXISTS idx_task_workers_heartbeat ON task_workers(last_heartbeat);

-- 统计索引
CREATE INDEX IF NOT EXISTS idx_task_statistics_date ON task_statistics(date);
CREATE INDEX IF NOT EXISTS idx_task_statistics_type_date ON task_statistics(task_type, date);

-- ================================================================
-- 触发器和函数
-- ================================================================

-- 更新任务队列updated_at字段的触发器
DROP TRIGGER IF EXISTS update_task_queue_updated_at ON task_queue;
CREATE TRIGGER update_task_queue_updated_at 
    BEFORE UPDATE ON task_queue 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 自动清理过期锁的函数
CREATE OR REPLACE FUNCTION cleanup_expired_locks()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM task_locks WHERE expires_at < CURRENT_TIMESTAMP;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE 'plpgsql';

-- 获取下一个待处理任务的函数
CREATE OR REPLACE FUNCTION get_next_pending_task(
    worker_type_param VARCHAR(50),
    worker_id_param VARCHAR(100)
)
RETURNS TABLE(
    task_id VARCHAR(50),
    task_type VARCHAR(50),
    task_data JSONB,
    priority INTEGER
) AS $$
BEGIN
    RETURN QUERY
    UPDATE task_queue 
    SET 
        status = 'running',
        worker_id = worker_id_param,
        started_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = (
        SELECT tq.id
        FROM task_queue tq
        LEFT JOIN task_locks tl ON (tq.task_data->>'document_id')::text = tl.resource_id
        WHERE tq.status = 'pending'
          AND tq.task_type = worker_type_param
          AND (tl.resource_id IS NULL OR tl.expires_at < CURRENT_TIMESTAMP)
          AND (tq.depends_on IS NULL OR 
               NOT EXISTS (
                   SELECT 1 FROM task_queue dep 
                   WHERE dep.id = ANY(ARRAY(SELECT jsonb_array_elements_text(tq.depends_on)))
                     AND dep.status NOT IN ('completed', 'cancelled')
               ))
        ORDER BY tq.priority DESC, tq.created_at ASC
        LIMIT 1
        FOR UPDATE SKIP LOCKED
    )
    RETURNING 
        task_queue.id,
        task_queue.task_type,
        task_queue.task_data,
        task_queue.priority;
END;
$$ LANGUAGE 'plpgsql';

-- 更新任务进度的函数
CREATE OR REPLACE FUNCTION update_task_progress(
    task_id_param VARCHAR(50),
    progress_param INTEGER,
    stage_param VARCHAR(100) DEFAULT NULL,
    detail_param TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE task_queue 
    SET 
        progress = progress_param,
        current_stage = COALESCE(stage_param, current_stage),
        stage_detail = COALESCE(detail_param, stage_detail),
        updated_at = CURRENT_TIMESTAMP
    WHERE id = task_id_param
      AND status = 'running';
    
    RETURN FOUND;
END;
$$ LANGUAGE 'plpgsql';

-- 完成任务的函数
CREATE OR REPLACE FUNCTION complete_task(
    task_id_param VARCHAR(50),
    result_param JSONB DEFAULT NULL,
    processing_time_param REAL DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE task_queue 
    SET 
        status = 'completed',
        progress = 100,
        result = result_param,
        processing_time = processing_time_param,
        completed_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = task_id_param
      AND status = 'running';
    
    -- 清理相关的锁
    DELETE FROM task_locks WHERE task_id = task_id_param;
    
    RETURN FOUND;
END;
$$ LANGUAGE 'plpgsql';

-- 任务失败的函数
CREATE OR REPLACE FUNCTION fail_task(
    task_id_param VARCHAR(50),
    error_message_param TEXT,
    error_details_param JSONB DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    task_record RECORD;
BEGIN
    SELECT retry_count, max_retries INTO task_record
    FROM task_queue 
    WHERE id = task_id_param;
    
    IF task_record.retry_count < task_record.max_retries THEN
        -- 重试任务
        UPDATE task_queue 
        SET 
            status = 'pending',
            worker_id = NULL,
            retry_count = retry_count + 1,
            error_message = error_message_param,
            error_details = error_details_param,
            started_at = NULL,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = task_id_param;
    ELSE
        -- 标记为失败
        UPDATE task_queue 
        SET 
            status = 'failed',
            error_message = error_message_param,
            error_details = error_details_param,
            completed_at = CURRENT_TIMESTAMP,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = task_id_param;
    END IF;
    
    -- 清理相关的锁
    DELETE FROM task_locks WHERE task_id = task_id_param;
    
    RETURN FOUND;
END;
$$ LANGUAGE 'plpgsql';

-- ================================================================
-- 初始化数据
-- ================================================================

-- 插入默认工作进程配置
INSERT INTO task_workers (worker_id, worker_type, max_concurrent_tasks, capabilities) 
VALUES 
('vectorization-worker-1', 'vectorization', 2, '{"models": ["text-embedding-v4", "matbert"], "max_file_size": 52428800}'),
('document-processor-1', 'document_processing', 3, '{"file_types": ["pdf", "docx", "txt", "md"], "max_file_size": 52428800}'),
('qa-processor-1', 'qa_dataset', 1, '{"file_types": ["xlsx", "xls"], "max_rows": 10000}')
ON CONFLICT (worker_id) DO NOTHING; 