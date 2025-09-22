-- ================================================================
-- Unla 统一网关路由映射表
-- 用途: 将 Unla 的租户/路由前缀/协议 与 统一网关端点固化，供业务查询与权限过滤
-- 创建时间: 2025-09-17
-- ================================================================

CREATE TABLE IF NOT EXISTS unla_router_map (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant VARCHAR(100) NOT NULL,
    server_name VARCHAR(200) NOT NULL,
    router_prefix VARCHAR(300) NOT NULL,
    proto_type VARCHAR(32) NOT NULL,
    mcp_endpoint VARCHAR(512) NOT NULL,
    sse_endpoint VARCHAR(512) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    version VARCHAR(50),
    last_synced_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tenant, router_prefix)
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_unla_router_tenant ON unla_router_map(tenant);
CREATE INDEX IF NOT EXISTS idx_unla_router_server ON unla_router_map(server_name);
CREATE INDEX IF NOT EXISTS idx_unla_router_prefix ON unla_router_map(router_prefix);
CREATE INDEX IF NOT EXISTS idx_unla_router_proto ON unla_router_map(proto_type);
CREATE INDEX IF NOT EXISTS idx_unla_router_active ON unla_router_map(is_active);

-- 更新时间触发器
CREATE OR REPLACE FUNCTION update_unla_router_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_unla_router_updated_at 
BEFORE UPDATE ON unla_router_map 
FOR EACH ROW EXECUTE FUNCTION update_unla_router_updated_at_column();

