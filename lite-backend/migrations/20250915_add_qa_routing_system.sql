-- =====================================================
-- QA路由系统数据库设计
-- 功能：为知识库实现自定义问答路由，支持三层检索架构
-- =====================================================

-- 1. 问答路由主表：存储知识库绑定的问答对
CREATE TABLE IF NOT EXISTS qa_routes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    knowledge_base_id VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL, -- 分类（如：常见问题、使用指南、技术文档等）
    question TEXT NOT NULL, -- 问题
    answer TEXT NOT NULL, -- 答案
    keywords TEXT[], -- 关键词数组，用于快速匹配
    priority INTEGER DEFAULT 0, -- 优先级，数值越大优先级越高
    is_active BOOLEAN DEFAULT true, -- 是否启用
    source_type VARCHAR(50) DEFAULT 'manual', -- 来源类型：manual/imported
    source_ref VARCHAR(255), -- 来源引用（如QA数据集ID）
    metadata JSONB DEFAULT '{}', -- 扩展元数据
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER,
    updated_by INTEGER
);

-- 2. 检索路径配置表：定义每个知识库的检索策略
CREATE TABLE IF NOT EXISTS retrieval_path_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    knowledge_base_id VARCHAR(255) NOT NULL,
    path_name VARCHAR(100) NOT NULL, -- 路径名称
    path_order INTEGER NOT NULL, -- 执行顺序
    source_type VARCHAR(50) NOT NULL, -- 数据源类型：qa_routes/qa_datasets/documents
    is_enabled BOOLEAN DEFAULT true, -- 是否启用该路径
    config JSONB DEFAULT '{}', -- 路径配置（如检索参数、过滤条件等）
    fallback_action VARCHAR(50) DEFAULT 'continue', -- 失败后的动作：continue/stop
    min_confidence FLOAT DEFAULT 0.7, -- 最小置信度阈值
    max_results INTEGER DEFAULT 5, -- 最大返回结果数
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(knowledge_base_id, path_order)
);

-- 3. QA路由匹配日志表：记录路由匹配和使用情况
CREATE TABLE IF NOT EXISTS qa_route_match_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    qa_route_id UUID REFERENCES qa_routes(id) ON DELETE SET NULL,
    knowledge_base_id VARCHAR(255),
    user_query TEXT NOT NULL, -- 用户原始查询
    match_score FLOAT, -- 匹配分数
    match_method VARCHAR(50), -- 匹配方法：exact/keyword/semantic
    response_time_ms INTEGER, -- 响应时间（毫秒）
    is_helpful BOOLEAN, -- 用户反馈是否有帮助
    session_id VARCHAR(100), -- 会话ID
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    user_id INTEGER
);

-- 4. QA路由分类表：管理问答对的分类
CREATE TABLE IF NOT EXISTS qa_route_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    knowledge_base_id VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL, -- 分类名称
    description TEXT, -- 分类描述
    icon VARCHAR(50), -- 图标标识
    display_order INTEGER DEFAULT 0, -- 显示顺序
    parent_id UUID REFERENCES qa_route_categories(id) ON DELETE CASCADE, -- 父分类ID
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(knowledge_base_id, name)
);

-- 5. QA路由导入历史表：记录从QA数据集导入的历史
CREATE TABLE IF NOT EXISTS qa_route_import_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    knowledge_base_id VARCHAR(255) NOT NULL,
    qa_dataset_id UUID REFERENCES qa_datasets(id) ON DELETE SET NULL,
    import_type VARCHAR(50) NOT NULL, -- 导入类型：full/incremental
    total_items INTEGER NOT NULL, -- 总条目数
    imported_items INTEGER NOT NULL, -- 成功导入数
    failed_items INTEGER DEFAULT 0, -- 失败条目数
    import_config JSONB DEFAULT '{}', -- 导入配置
    error_details JSONB DEFAULT '[]', -- 错误详情
    status VARCHAR(50) DEFAULT 'pending', -- 状态：pending/processing/completed/failed
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_by INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引以优化查询性能
CREATE INDEX idx_qa_routes_kb_id ON qa_routes(knowledge_base_id);
CREATE INDEX idx_qa_routes_category ON qa_routes(category);
CREATE INDEX idx_qa_routes_keywords ON qa_routes USING GIN(keywords);
CREATE INDEX idx_qa_routes_active ON qa_routes(is_active) WHERE is_active = true;
CREATE INDEX idx_qa_routes_priority ON qa_routes(priority DESC);

CREATE INDEX idx_retrieval_paths_kb_id ON retrieval_path_configs(knowledge_base_id);
CREATE INDEX idx_retrieval_paths_order ON retrieval_path_configs(knowledge_base_id, path_order);

CREATE INDEX idx_route_logs_kb_id ON qa_route_match_logs(knowledge_base_id);
CREATE INDEX idx_route_logs_route_id ON qa_route_match_logs(qa_route_id);
CREATE INDEX idx_route_logs_created ON qa_route_match_logs(created_at DESC);

-- 创建触发器自动更新updated_at字段
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_qa_routes_updated_at BEFORE UPDATE
    ON qa_routes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_retrieval_paths_updated_at BEFORE UPDATE
    ON retrieval_path_configs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_qa_categories_updated_at BEFORE UPDATE
    ON qa_route_categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 添加默认检索路径配置示例
INSERT INTO retrieval_path_configs (knowledge_base_id, path_name, path_order, source_type, config)
SELECT 
    id,
    'QA路由优先',
    1,
    'qa_routes',
    '{"match_strategy": "hybrid", "boost_exact_match": 2.0}'::jsonb
FROM knowledge_collections
WHERE NOT EXISTS (
    SELECT 1 FROM retrieval_path_configs 
    WHERE knowledge_base_id = knowledge_collections.id
)
ON CONFLICT DO NOTHING;

INSERT INTO retrieval_path_configs (knowledge_base_id, path_name, path_order, source_type, config)
SELECT 
    id,
    'QA数据集次优',
    2,
    'qa_datasets',
    '{"search_mode": "semantic", "min_score": 0.75}'::jsonb
FROM knowledge_collections
WHERE NOT EXISTS (
    SELECT 1 FROM retrieval_path_configs 
    WHERE knowledge_base_id = knowledge_collections.id AND path_order = 2
)
ON CONFLICT DO NOTHING;

INSERT INTO retrieval_path_configs (knowledge_base_id, path_name, path_order, source_type, config)
SELECT 
    id,
    '知识文档兜底',
    3,
    'documents',
    '{"search_mode": "hybrid", "rerank": true}'::jsonb
FROM knowledge_collections
WHERE NOT EXISTS (
    SELECT 1 FROM retrieval_path_configs 
    WHERE knowledge_base_id = knowledge_collections.id AND path_order = 3
)
ON CONFLICT DO NOTHING;

-- 添加注释
COMMENT ON TABLE qa_routes IS '知识库问答路由表，存储预定义的问答对';
COMMENT ON TABLE retrieval_path_configs IS '检索路径配置表，定义多层检索策略';
COMMENT ON TABLE qa_route_match_logs IS 'QA路由匹配日志，用于分析和优化';
COMMENT ON TABLE qa_route_categories IS 'QA路由分类管理表';
COMMENT ON TABLE qa_route_import_history IS 'QA路由导入历史记录表';

COMMENT ON COLUMN qa_routes.priority IS '优先级：当多个路由匹配时，优先返回高优先级的答案';
COMMENT ON COLUMN retrieval_path_configs.fallback_action IS '失败动作：continue继续下一层，stop停止检索';
COMMENT ON COLUMN qa_route_match_logs.match_method IS '匹配方法：exact精确匹配，keyword关键词匹配，semantic语义匹配';