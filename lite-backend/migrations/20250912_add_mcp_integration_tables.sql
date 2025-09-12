-- ================================================================
-- MCP Context Forge 集成相关表结构
-- ================================================================
-- 创建时间: 2025-09-12
-- 用途: 支持MCP工具注册、管理和调用
-- ================================================================

-- MCP 服务器注册表
CREATE TABLE IF NOT EXISTS mcp_servers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) UNIQUE NOT NULL,
    display_name VARCHAR(200) NOT NULL,
    description TEXT,
    server_type VARCHAR(50) NOT NULL DEFAULT 'external', -- 'external', 'internal', 'virtual'
    connection_config JSONB NOT NULL, -- 连接配置（URL、认证等）
    transport_type VARCHAR(20) NOT NULL DEFAULT 'stdio', -- 'stdio', 'http', 'sse', 'websocket'
    is_enabled BOOLEAN DEFAULT TRUE,
    health_status VARCHAR(20) DEFAULT 'unknown', -- 'healthy', 'unhealthy', 'unknown'
    last_health_check TIMESTAMP WITH TIME ZONE,
    server_metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- MCP 工具注册表
CREATE TABLE IF NOT EXISTS mcp_tools (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    server_id UUID REFERENCES mcp_servers(id) ON DELETE CASCADE,
    tool_name VARCHAR(100) NOT NULL,
    display_name VARCHAR(200) NOT NULL,
    description TEXT,
    tool_schema JSONB NOT NULL, -- MCP工具schema定义
    category VARCHAR(50), -- 工具分类
    tags TEXT[], -- 工具标签
    is_enabled BOOLEAN DEFAULT TRUE,
    usage_count INTEGER DEFAULT 0,
    last_used_at TIMESTAMP WITH TIME ZONE,
    performance_metrics JSONB DEFAULT '{}', -- 性能指标
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(server_id, tool_name)
);

-- MCP 资源注册表
CREATE TABLE IF NOT EXISTS mcp_resources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    server_id UUID REFERENCES mcp_servers(id) ON DELETE CASCADE,
    resource_uri VARCHAR(500) NOT NULL,
    resource_name VARCHAR(200) NOT NULL,
    resource_type VARCHAR(50), -- 'file', 'url', 'data', etc.
    description TEXT,
    mime_type VARCHAR(100),
    resource_schema JSONB,
    is_enabled BOOLEAN DEFAULT TRUE,
    access_count INTEGER DEFAULT 0,
    last_accessed_at TIMESTAMP WITH TIME ZONE,
    resource_metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(server_id, resource_uri)
);

-- MCP 提示模板注册表
CREATE TABLE IF NOT EXISTS mcp_prompts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    server_id UUID REFERENCES mcp_servers(id) ON DELETE CASCADE,
    prompt_name VARCHAR(100) NOT NULL,
    display_name VARCHAR(200) NOT NULL,
    description TEXT,
    prompt_template TEXT NOT NULL,
    prompt_schema JSONB, -- 参数schema
    category VARCHAR(50),
    tags TEXT[],
    is_enabled BOOLEAN DEFAULT TRUE,
    usage_count INTEGER DEFAULT 0,
    last_used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(server_id, prompt_name)
);

-- MCP 工具调用日志
CREATE TABLE IF NOT EXISTS mcp_tool_calls (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tool_id UUID REFERENCES mcp_tools(id) ON DELETE CASCADE,
    session_id VARCHAR(100),
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    call_request JSONB NOT NULL, -- 调用请求
    call_response JSONB, -- 调用响应
    call_status VARCHAR(20) NOT NULL DEFAULT 'pending', -- 'pending', 'success', 'error', 'timeout'
    error_message TEXT,
    duration_ms INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE
);

-- MCP 网关配置表
CREATE TABLE IF NOT EXISTS mcp_gateway_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    config_name VARCHAR(100) UNIQUE NOT NULL,
    config_type VARCHAR(50) NOT NULL, -- 'auth', 'routing', 'security', 'performance'
    config_value JSONB NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_mcp_servers_name ON mcp_servers(name);
CREATE INDEX IF NOT EXISTS idx_mcp_servers_type ON mcp_servers(server_type);
CREATE INDEX IF NOT EXISTS idx_mcp_servers_enabled ON mcp_servers(is_enabled);
CREATE INDEX IF NOT EXISTS idx_mcp_servers_health ON mcp_servers(health_status);

CREATE INDEX IF NOT EXISTS idx_mcp_tools_server_id ON mcp_tools(server_id);
CREATE INDEX IF NOT EXISTS idx_mcp_tools_name ON mcp_tools(tool_name);
CREATE INDEX IF NOT EXISTS idx_mcp_tools_category ON mcp_tools(category);
CREATE INDEX IF NOT EXISTS idx_mcp_tools_enabled ON mcp_tools(is_enabled);
CREATE INDEX IF NOT EXISTS idx_mcp_tools_tags ON mcp_tools USING GIN(tags);

CREATE INDEX IF NOT EXISTS idx_mcp_resources_server_id ON mcp_resources(server_id);
CREATE INDEX IF NOT EXISTS idx_mcp_resources_uri ON mcp_resources(resource_uri);
CREATE INDEX IF NOT EXISTS idx_mcp_resources_type ON mcp_resources(resource_type);
CREATE INDEX IF NOT EXISTS idx_mcp_resources_enabled ON mcp_resources(is_enabled);

CREATE INDEX IF NOT EXISTS idx_mcp_prompts_server_id ON mcp_prompts(server_id);
CREATE INDEX IF NOT EXISTS idx_mcp_prompts_name ON mcp_prompts(prompt_name);
CREATE INDEX IF NOT EXISTS idx_mcp_prompts_category ON mcp_prompts(category);
CREATE INDEX IF NOT EXISTS idx_mcp_prompts_enabled ON mcp_prompts(is_enabled);
CREATE INDEX IF NOT EXISTS idx_mcp_prompts_tags ON mcp_prompts USING GIN(tags);

CREATE INDEX IF NOT EXISTS idx_mcp_tool_calls_tool_id ON mcp_tool_calls(tool_id);
CREATE INDEX IF NOT EXISTS idx_mcp_tool_calls_session_id ON mcp_tool_calls(session_id);
CREATE INDEX IF NOT EXISTS idx_mcp_tool_calls_user_id ON mcp_tool_calls(user_id);
CREATE INDEX IF NOT EXISTS idx_mcp_tool_calls_status ON mcp_tool_calls(call_status);
CREATE INDEX IF NOT EXISTS idx_mcp_tool_calls_created_at ON mcp_tool_calls(created_at);

CREATE INDEX IF NOT EXISTS idx_mcp_gateway_config_name ON mcp_gateway_config(config_name);
CREATE INDEX IF NOT EXISTS idx_mcp_gateway_config_type ON mcp_gateway_config(config_type);
CREATE INDEX IF NOT EXISTS idx_mcp_gateway_config_active ON mcp_gateway_config(is_active);

-- 创建更新时间触发器
CREATE OR REPLACE FUNCTION update_mcp_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_mcp_servers_updated_at BEFORE UPDATE ON mcp_servers FOR EACH ROW EXECUTE FUNCTION update_mcp_updated_at_column();
CREATE TRIGGER update_mcp_tools_updated_at BEFORE UPDATE ON mcp_tools FOR EACH ROW EXECUTE FUNCTION update_mcp_updated_at_column();
CREATE TRIGGER update_mcp_resources_updated_at BEFORE UPDATE ON mcp_resources FOR EACH ROW EXECUTE FUNCTION update_mcp_updated_at_column();
CREATE TRIGGER update_mcp_prompts_updated_at BEFORE UPDATE ON mcp_prompts FOR EACH ROW EXECUTE FUNCTION update_mcp_updated_at_column();
CREATE TRIGGER update_mcp_gateway_config_updated_at BEFORE UPDATE ON mcp_gateway_config FOR EACH ROW EXECUTE FUNCTION update_mcp_updated_at_column();

-- 插入默认配置
INSERT INTO mcp_gateway_config (config_name, config_type, config_value, description) VALUES
('default_auth', 'auth', '{"type": "basic", "enabled": true}', '默认认证配置'),
('rate_limiting', 'performance', '{"enabled": true, "requests_per_minute": 60}', '速率限制配置'),
('security_headers', 'security', '{"enabled": true, "cors": true}', '安全头配置'),
('tool_routing', 'routing', '{"strategy": "round_robin", "retry_attempts": 3}', '工具路由配置')
ON CONFLICT (config_name) DO NOTHING;
