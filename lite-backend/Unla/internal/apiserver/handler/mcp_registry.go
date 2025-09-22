package handler

import (
    "net/http"
    "time"
    "encoding/json"

    "github.com/amoylab/unla/internal/apiserver/database"
    "github.com/gin-gonic/gin"
)

type MCPRegistryHandler struct { db database.Database }

func NewMCPRegistryHandler(db database.Database) *MCPRegistryHandler { return &MCPRegistryHandler{db: db} }

// RegisterRequest 用于注册/更新 MCP 实例
type RegisterRequest struct {
    Tenant     string                 `json:"tenant"`
    Name       string                 `json:"name" binding:"required"`
    ServerName string                 `json:"server_name"`
    Transport  string                 `json:"transport" binding:"required"`
    Endpoint   string                 `json:"endpoint" binding:"required"`
    Prefix     string                 `json:"prefix"`
    Status     string                 `json:"status"`
    Tools      []database.MCPTool     `json:"tools"`
    Metadata   map[string]interface{} `json:"metadata"`
}

func (h *MCPRegistryHandler) Register(c *gin.Context) {
    var req RegisterRequest
    if err := c.ShouldBindJSON(&req); err != nil { c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()}); return }
    if req.Tenant == "" { req.Tenant = "default" }

    // 序列化 tools/metadata
    inst := &database.MCPInstance{
        Tenant:        req.Tenant,
        Name:          req.Name,
        ServerName:    req.ServerName,
        Transport:     req.Transport,
        Endpoint:      req.Endpoint,
        Prefix:        req.Prefix,
        Status:        ifEmpty(req.Status, "running"),
        LastHeartbeat: time.Now(),
        CreatedAt:     time.Now(),
        UpdatedAt:     time.Now(),
    }
    if len(req.Tools) > 0 {
        _ = h.db.UpdateMCPInstanceTools(c.Request.Context(), req.Tenant, req.Name, req.Tools)
    }
    if req.Metadata != nil {
        // 为简单起见，交给 Update 时再写 metadata_json
    }
    if err := h.db.UpsertMCPInstance(c.Request.Context(), inst); err != nil { c.JSON(500, gin.H{"error": err.Error()}); return }
    // metadata/tools 再次覆盖（确保 upsert 后存在记录）
    updates := map[string]interface{}{}
    if req.Metadata != nil { updates["metadata_json"] = mustJSON(req.Metadata) }
    if len(updates) > 0 {
        _ = h.db.UpdateMCPInstance(c.Request.Context(), req.Tenant, req.Name, updates)
    }
    c.JSON(200, gin.H{"ok": true})
}

type HeartbeatRequest struct {
    Tenant string `json:"tenant"`
    Name   string `json:"name" binding:"required"`
    Status string `json:"status"`
}

func (h *MCPRegistryHandler) Heartbeat(c *gin.Context) {
    var req HeartbeatRequest
    if err := c.ShouldBindJSON(&req); err != nil { c.JSON(400, gin.H{"error": err.Error()}); return }
    if req.Tenant == "" { req.Tenant = "default" }
    if err := h.db.HeartbeatMCPInstance(c.Request.Context(), req.Tenant, req.Name, req.Status); err != nil { c.JSON(500, gin.H{"error": err.Error()}); return }
    c.JSON(200, gin.H{"ok": true})
}

func (h *MCPRegistryHandler) List(c *gin.Context) {
    tenant := c.Query("tenant")
    items, err := h.db.ListMCPInstances(c.Request.Context(), tenant)
    if err != nil { c.JSON(500, gin.H{"error": err.Error()}); return }
    c.JSON(200, items)
}

func (h *MCPRegistryHandler) Get(c *gin.Context) {
    tenant := c.Param("tenant")
    name := c.Param("name")
    if tenant == "" { tenant = "default" }
    item, err := h.db.GetMCPInstance(c.Request.Context(), tenant, name)
    if err != nil { c.JSON(404, gin.H{"error": "not found"}); return }
    c.JSON(200, item)
}

func (h *MCPRegistryHandler) Delete(c *gin.Context) {
    tenant := c.Param("tenant")
    name := c.Param("name")
    if tenant == "" { tenant = "default" }
    if err := h.db.DeleteMCPInstance(c.Request.Context(), tenant, name); err != nil { c.JSON(500, gin.H{"error": err.Error()}); return }
    c.JSON(200, gin.H{"ok": true})
}

func (h *MCPRegistryHandler) Tools(c *gin.Context) {
    tenant := c.Param("tenant")
    name := c.Param("name")
    if tenant == "" { tenant = "default" }
    item, err := h.db.GetMCPInstance(c.Request.Context(), tenant, name)
    if err != nil { c.JSON(404, gin.H{"error": "not found"}); return }
    tools, _ := item.ParseTools()
    c.JSON(200, tools)
}

type UpdateToolsRequest struct { Tools []database.MCPTool `json:"tools" binding:"required"` }

func (h *MCPRegistryHandler) UpdateTools(c *gin.Context) {
    tenant := c.Param("tenant")
    name := c.Param("name")
    if tenant == "" { tenant = "default" }
    var req UpdateToolsRequest
    if err := c.ShouldBindJSON(&req); err != nil { c.JSON(400, gin.H{"error": err.Error()}); return }
    if err := h.db.UpdateMCPInstanceTools(c.Request.Context(), tenant, name, req.Tools); err != nil { c.JSON(500, gin.H{"error": err.Error()}); return }
    c.JSON(200, gin.H{"ok": true})
}

// --- helpers ---

func ifEmpty(s, def string) string { if s == "" { return def }; return s }

func mustJSON(m map[string]interface{}) string {
    b, _ := jsonMarshal(m)
    return string(b)
}

func jsonMarshal(v interface{}) ([]byte, error) {
    return json.Marshal(v)
}
