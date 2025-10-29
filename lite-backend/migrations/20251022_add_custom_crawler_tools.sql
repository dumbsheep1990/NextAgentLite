-- 自定义工具表
-- 用于存储用户自定义的各类工具配置（当前支持网站内容抓取工具）

-- 自定义工具配置表
CREATE TABLE IF NOT EXISTS custom_crawler_tools (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    base_url TEXT NOT NULL,
    url_template TEXT NOT NULL,  -- URL模板，包含占位符 {keyword}
    method VARCHAR(10) DEFAULT 'GET',  -- HTTP方法
    headers JSONB DEFAULT '{}',  -- 自定义请求头
    params_mapping JSONB NOT NULL,  -- URL参数映射配置
    selector_config JSONB NOT NULL,  -- 内容选择器配置
    parse_config JSONB DEFAULT '{}',  -- 解析配置（提取标题、内容、链接等）
    enabled BOOLEAN DEFAULT true,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_method CHECK (method IN ('GET', 'POST'))
);

-- 工具执行历史表
CREATE TABLE IF NOT EXISTS custom_tool_executions (
    id SERIAL PRIMARY KEY,
    tool_id INTEGER NOT NULL REFERENCES custom_crawler_tools(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id),
    query_keyword VARCHAR(500) NOT NULL,
    execution_status VARCHAR(50) DEFAULT 'pending',  -- pending, running, completed, failed
    results_count INTEGER DEFAULT 0,
    results JSONB,  -- 存储爬取结果
    error_message TEXT,
    execution_time FLOAT,  -- 执行耗时（秒）
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    CONSTRAINT chk_status CHECK (execution_status IN ('pending', 'running', 'completed', 'failed'))
);

-- 创建索引
CREATE INDEX idx_custom_crawler_tools_name ON custom_crawler_tools(name);
CREATE INDEX idx_custom_crawler_tools_enabled ON custom_crawler_tools(enabled);
CREATE INDEX idx_custom_crawler_tools_created_by ON custom_crawler_tools(created_by);
CREATE INDEX idx_custom_tool_executions_tool_id ON custom_tool_executions(tool_id);
CREATE INDEX idx_custom_tool_executions_user_id ON custom_tool_executions(user_id);
CREATE INDEX idx_custom_tool_executions_status ON custom_tool_executions(execution_status);
CREATE INDEX idx_custom_tool_executions_created_at ON custom_tool_executions(created_at DESC);

-- 更新时间触发器
CREATE OR REPLACE FUNCTION update_custom_crawler_tools_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_custom_crawler_tools_updated_at
    BEFORE UPDATE ON custom_crawler_tools
    FOR EACH ROW
    EXECUTE FUNCTION update_custom_crawler_tools_updated_at();

-- 插入示例工具配置（贵州六盘水政府网站）
INSERT INTO custom_crawler_tools (
    name,
    description,
    base_url,
    url_template,
    method,
    params_mapping,
    selector_config,
    parse_config
) VALUES (
    '六盘水政府政策搜索',
    '贵州六盘水市政府门户网站政策搜索工具',
    'https://www.gzlps.gov.cn',
    'https://www.gzlps.gov.cn/so/search.shtml?tenantId=30&tenantIds=&configTenantId=&searchWord={keyword}&dataTypeId=124&sign=b402af61-acef-4458-a9f9-b056e187c58a',
    'GET',
    '{
        "searchWord": {
            "param_name": "searchWord",
            "param_type": "query",
            "required": true,
            "description": "搜索关键词"
        },
        "tenantId": {
            "param_name": "tenantId",
            "param_type": "query",
            "required": false,
            "default_value": "30"
        },
        "dataTypeId": {
            "param_name": "dataTypeId",
            "param_type": "query",
            "required": false,
            "default_value": "124"
        }
    }'::jsonb,
    '{
        "result_container": ".search-result-list",
        "item_selector": ".search-result-item",
        "title_selector": ".result-title",
        "link_selector": "a.result-link",
        "content_selector": ".result-content",
        "date_selector": ".result-date"
    }'::jsonb,
    '{
        "extract_full_content": true,
        "follow_links": false,
        "max_results": 20,
        "encoding": "utf-8"
    }'::jsonb
) ON CONFLICT (name) DO NOTHING;

-- 添加注释
COMMENT ON TABLE custom_crawler_tools IS '自定义工具配置表（支持网站内容抓取等多种工具类型）';
COMMENT ON TABLE custom_tool_executions IS '自定义工具执行历史记录表';
COMMENT ON COLUMN custom_crawler_tools.params_mapping IS 'URL参数映射配置，定义如何将用户输入映射到URL参数';
COMMENT ON COLUMN custom_crawler_tools.selector_config IS 'CSS选择器配置，用于提取网页内容';
COMMENT ON COLUMN custom_crawler_tools.parse_config IS '解析配置，控制爬取行为和内容提取策略';
