package database

import (
    "context"
    "encoding/json"
    "errors"
    "time"
)

// MCPInstance 记录已运行的 MCP 服务实例（用于服务发现/注册）
type MCPInstance struct {
    ID            uint      `json:"id" gorm:"primaryKey;autoIncrement"`
    Tenant        string    `json:"tenant" gorm:"type:varchar(64);index:idx_mcp_tenant_name,unique,priority:1"`
    Name          string    `json:"name" gorm:"type:varchar(128);index:idx_mcp_tenant_name,unique,priority:2"`
    ServerName    string    `json:"server_name" gorm:"type:varchar(128);index"` // 来自 mcpServers[].name
    Transport     string    `json:"transport" gorm:"type:varchar(32)"`           // stdio/http/ws
    Endpoint      string    `json:"endpoint" gorm:"type:varchar(512)"`           // 供调用方访问的基础地址（如 http://127.0.0.1:9360/servers/playwright）
    Prefix        string    `json:"prefix" gorm:"type:varchar(128)"`             // 可选：网关内的路由前缀
    Status        string    `json:"status" gorm:"type:varchar(32)"`              // running/stopped/error
    ToolsJSON     string    `json:"tools_json" gorm:"type:text"`                 // 缓存的 tools 列表
    MetadataJSON  string    `json:"metadata_json" gorm:"type:text"`              // 其他运行时元信息
    LastHeartbeat time.Time `json:"last_heartbeat"`
    CreatedAt     time.Time `json:"created_at"`
    UpdatedAt     time.Time `json:"updated_at"`
}

func (MCPInstance) TableName() string { return "mcp_instances" }

// 工具条目简化结构（可选）
type MCPTool struct {
    Name        string `json:"name"`
    Description string `json:"description,omitempty"`
}

// --- Postgres 实现 ---

func (db *Postgres) UpsertMCPInstance(ctx context.Context, m *MCPInstance) error {
    if m.Tenant == "" { m.Tenant = "default" }
    now := time.Now()
    if m.CreatedAt.IsZero() { m.CreatedAt = now }
    m.UpdatedAt = now
    var existing MCPInstance
    tx := db.db.WithContext(ctx)
    if err := tx.Where("tenant = ? AND name = ?", m.Tenant, m.Name).First(&existing).Error; err == nil {
        m.ID = existing.ID
        return tx.Save(m).Error
    }
    return tx.Create(m).Error
}

func (db *Postgres) HeartbeatMCPInstance(ctx context.Context, tenant, name, status string) error {
    if tenant == "" { tenant = "default" }
    u := map[string]interface{}{ "last_heartbeat": time.Now() }
    if status != "" { u["status"] = status }
    return db.db.WithContext(ctx).Model(&MCPInstance{}).
        Where("tenant = ? AND name = ?", tenant, name).Updates(u).Error
}

func (db *Postgres) ListMCPInstances(ctx context.Context, tenant string) ([]*MCPInstance, error) {
    var items []*MCPInstance
    q := db.db.WithContext(ctx).Model(&MCPInstance{})
    if tenant != "" { q = q.Where("tenant = ?", tenant) }
    if err := q.Order("updated_at desc").Find(&items).Error; err != nil { return nil, err }
    return items, nil
}

func (db *Postgres) GetMCPInstance(ctx context.Context, tenant, name string) (*MCPInstance, error) {
    if tenant == "" { tenant = "default" }
    var item MCPInstance
    if err := db.db.WithContext(ctx).Where("tenant = ? AND name = ?", tenant, name).First(&item).Error; err != nil { return nil, err }
    return &item, nil
}

func (db *Postgres) UpdateMCPInstance(ctx context.Context, tenant, name string, updates map[string]interface{}) error {
    if len(updates) == 0 { return nil }
    if tenant == "" { tenant = "default" }
    updates["updated_at"] = time.Now()
    return db.db.WithContext(ctx).Model(&MCPInstance{}).
        Where("tenant = ? AND name = ?", tenant, name).
        Updates(updates).Error
}

func (db *Postgres) DeleteMCPInstance(ctx context.Context, tenant, name string) error {
    if tenant == "" { tenant = "default" }
    return db.db.WithContext(ctx).Where("tenant = ? AND name = ?", tenant, name).Delete(&MCPInstance{}).Error
}

// --- SQLite 实现 ---

func (db *SQLite) UpsertMCPInstance(ctx context.Context, m *MCPInstance) error {
    if m.Tenant == "" { m.Tenant = "default" }
    now := time.Now()
    if m.CreatedAt.IsZero() { m.CreatedAt = now }
    m.UpdatedAt = now
    // SQLite 没有原生 upsert by multi-columns 用 Save 即可（以主键为准）；这里采用查找后决定 Create/Save
    var existing MCPInstance
    tx := db.db.WithContext(ctx)
    if err := tx.Where("tenant = ? AND name = ?", m.Tenant, m.Name).First(&existing).Error; err == nil {
        m.ID = existing.ID
        return tx.Save(m).Error
    }
    return tx.Create(m).Error
}

func (db *SQLite) HeartbeatMCPInstance(ctx context.Context, tenant, name, status string) error {
    if tenant == "" { tenant = "default" }
    u := map[string]interface{}{ "last_heartbeat": time.Now() }
    if status != "" { u["status"] = status }
    return db.db.WithContext(ctx).Model(&MCPInstance{}).
        Where("tenant = ? AND name = ?", tenant, name).Updates(u).Error
}

func (db *SQLite) ListMCPInstances(ctx context.Context, tenant string) ([]*MCPInstance, error) {
    var items []*MCPInstance
    q := db.db.WithContext(ctx).Model(&MCPInstance{})
    if tenant != "" { q = q.Where("tenant = ?", tenant) }
    if err := q.Order("updated_at desc").Find(&items).Error; err != nil { return nil, err }
    return items, nil
}

func (db *SQLite) GetMCPInstance(ctx context.Context, tenant, name string) (*MCPInstance, error) {
    if tenant == "" { tenant = "default" }
    var item MCPInstance
    if err := db.db.WithContext(ctx).Where("tenant = ? AND name = ?", tenant, name).First(&item).Error; err != nil { return nil, err }
    return &item, nil
}

func (db *SQLite) UpdateMCPInstance(ctx context.Context, tenant, name string, updates map[string]interface{}) error {
    if len(updates) == 0 { return nil }
    if tenant == "" { tenant = "default" }
    updates["updated_at"] = time.Now()
    return db.db.WithContext(ctx).Model(&MCPInstance{}).
        Where("tenant = ? AND name = ?", tenant, name).
        Updates(updates).Error
}

func (db *SQLite) DeleteMCPInstance(ctx context.Context, tenant, name string) error {
    if tenant == "" { tenant = "default" }
    return db.db.WithContext(ctx).Where("tenant = ? AND name = ?", tenant, name).Delete(&MCPInstance{}).Error
}

// --- MySQL 实现 ---

func (db *MySQL) UpsertMCPInstance(ctx context.Context, m *MCPInstance) error {
    if m.Tenant == "" { m.Tenant = "default" }
    now := time.Now()
    if m.CreatedAt.IsZero() { m.CreatedAt = now }
    m.UpdatedAt = now
    var existing MCPInstance
    tx := db.db.WithContext(ctx)
    if err := tx.Where("tenant = ? AND name = ?", m.Tenant, m.Name).First(&existing).Error; err == nil {
        m.ID = existing.ID
        return tx.Save(m).Error
    }
    return tx.Create(m).Error
}

func (db *MySQL) HeartbeatMCPInstance(ctx context.Context, tenant, name, status string) error {
    if tenant == "" { tenant = "default" }
    u := map[string]interface{}{ "last_heartbeat": time.Now() }
    if status != "" { u["status"] = status }
    return db.db.WithContext(ctx).Model(&MCPInstance{}).
        Where("tenant = ? AND name = ?", tenant, name).Updates(u).Error
}

func (db *MySQL) ListMCPInstances(ctx context.Context, tenant string) ([]*MCPInstance, error) {
    var items []*MCPInstance
    q := db.db.WithContext(ctx).Model(&MCPInstance{})
    if tenant != "" { q = q.Where("tenant = ?", tenant) }
    if err := q.Order("updated_at desc").Find(&items).Error; err != nil { return nil, err }
    return items, nil
}

func (db *MySQL) GetMCPInstance(ctx context.Context, tenant, name string) (*MCPInstance, error) {
    if tenant == "" { tenant = "default" }
    var item MCPInstance
    if err := db.db.WithContext(ctx).Where("tenant = ? AND name = ?", tenant, name).First(&item).Error; err != nil { return nil, err }
    return &item, nil
}

func (db *MySQL) UpdateMCPInstance(ctx context.Context, tenant, name string, updates map[string]interface{}) error {
    if len(updates) == 0 { return nil }
    if tenant == "" { tenant = "default" }
    updates["updated_at"] = time.Now()
    return db.db.WithContext(ctx).Model(&MCPInstance{}).
        Where("tenant = ? AND name = ?", tenant, name).
        Updates(updates).Error
}

func (db *MySQL) DeleteMCPInstance(ctx context.Context, tenant, name string) error {
    if tenant == "" { tenant = "default" }
    return db.db.WithContext(ctx).Where("tenant = ? AND name = ?", tenant, name).Delete(&MCPInstance{}).Error
}

// --- 通用工具函数 ---

// 简单封装：生成针对 (tenant,name) 的唯一冲突策略
func uniqueTenantNameConflict() interface{} { return nil }

// ParseTools 返回工具列表（解析缓存 JSON）
func (m *MCPInstance) ParseTools() ([]MCPTool, error) {
    if m.ToolsJSON == "" { return []MCPTool{}, nil }
    var tools []MCPTool
    if err := json.Unmarshal([]byte(m.ToolsJSON), &tools); err != nil { return nil, err }
    return tools, nil
}

// UpdateTools 设置工具缓存
func (db *Postgres) UpdateMCPInstanceTools(ctx context.Context, tenant, name string, tools []MCPTool) error {
    b, err := json.Marshal(tools)
    if err != nil { return err }
    return db.UpdateMCPInstance(ctx, tenant, name, map[string]interface{}{ "tools_json": string(b) })
}

func (db *SQLite) UpdateMCPInstanceTools(ctx context.Context, tenant, name string, tools []MCPTool) error {
    b, err := json.Marshal(tools)
    if err != nil { return err }
    return db.UpdateMCPInstance(ctx, tenant, name, map[string]interface{}{ "tools_json": string(b) })
}

func (db *MySQL) UpdateMCPInstanceTools(ctx context.Context, tenant, name string, tools []MCPTool) error {
    b, err := json.Marshal(tools)
    if err != nil { return err }
    return db.UpdateMCPInstance(ctx, tenant, name, map[string]interface{}{ "tools_json": string(b) })
}

var ErrNotFound = errors.New("not found")
