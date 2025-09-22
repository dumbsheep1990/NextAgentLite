package handler

import (
    "net/http"
    "time"
    "github.com/amoylab/unla/internal/apiserver/database"
    "github.com/gin-gonic/gin"
)

type RerankHandler struct { db database.Database }

func NewRerankHandler(db database.Database) *RerankHandler { return &RerankHandler{db: db} }

// Providers whitelist for rerank
var rerankVendors = []string{"siliconcloud", "ollama", "vllm", "qwen", "jina"}

func (h *RerankHandler) ListProviders(c *gin.Context) { c.JSON(http.StatusOK, rerankVendors) }

func (h *RerankHandler) ListModels(c *gin.Context) {
    provider := c.Query("provider")
    items, err := h.db.ListRerankModels(c.Request.Context(), provider)
    if err != nil { c.JSON(500, gin.H{"error": err.Error()}); return }
    c.JSON(200, items)
}

type createRerankReq struct {
    Provider    string `json:"provider" binding:"required"`
    ModelID     string `json:"model_id" binding:"required"`
    DisplayName string `json:"display_name"`
    BaseURL     string `json:"base_url"`
    APIKey      string `json:"api_key"`
}

func (h *RerankHandler) CreateModel(c *gin.Context) {
    var req createRerankReq
    if err := c.ShouldBindJSON(&req); err != nil { c.JSON(400, gin.H{"error": err.Error()}); return }
    m := &database.RerankModel{ Provider: req.Provider, ModelID: req.ModelID, DisplayName: req.DisplayName, BaseURL: req.BaseURL, APIKeyEnc: req.APIKey, Status: "active", CreatedAt: time.Now(), UpdatedAt: time.Now() }
    if err := h.db.CreateRerankModel(c.Request.Context(), m); err != nil { c.JSON(500, gin.H{"error": err.Error()}); return }
    c.JSON(201, m)
}

func (h *RerankHandler) GetDefaults(c *gin.Context) {
    d, err := h.db.GetRerankDefaults(c.Request.Context())
    if err != nil { c.JSON(500, gin.H{"error": err.Error()}); return }
    c.JSON(200, gin.H{"default_rerank": d.DefaultRerank})
}

type setRerankDefaultsReq struct { DefaultRerank string `json:"default_rerank" binding:"required"` }

func (h *RerankHandler) SetDefaults(c *gin.Context) {
    var req setRerankDefaultsReq
    if err := c.ShouldBindJSON(&req); err != nil { c.JSON(400, gin.H{"error": err.Error()}); return }
    if err := h.db.SetRerankDefaults(c.Request.Context(), req.DefaultRerank); err != nil { c.JSON(500, gin.H{"error": err.Error()}); return }
    c.JSON(200, gin.H{"ok": true})
}

type setRerankStatusReq struct {
    Provider string `json:"provider" binding:"required"`
    ModelID  string `json:"model_id" binding:"required"`
    Status   string `json:"status" binding:"required"` // active/inactive
}

func (h *RerankHandler) SetModelStatus(c *gin.Context) {
    var req setRerankStatusReq
    if err := c.ShouldBindJSON(&req); err != nil { c.JSON(400, gin.H{"error": err.Error()}); return }
    if req.Status != "active" && req.Status != "inactive" { c.JSON(400, gin.H{"error": "invalid status"}); return }
    if err := h.db.SetRerankModelStatus(c.Request.Context(), req.Provider, req.ModelID, req.Status); err != nil { c.JSON(500, gin.H{"error": err.Error()}); return }
    c.JSON(200, gin.H{"ok": true})
}

// Bulk upsert rerank models
type bulkRerankUpsertReq struct {
    Provider string   `json:"provider" binding:"required"`
    Models   []string `json:"models" binding:"required"`
}

func (h *RerankHandler) BulkUpsertModels(c *gin.Context) {
    var req bulkRerankUpsertReq
    if err := c.ShouldBindJSON(&req); err != nil { c.JSON(400, gin.H{"error": err.Error()}); return }
    if len(req.Models) == 0 { c.JSON(200, gin.H{"created": 0}); return }
    existing, err := h.db.ListRerankModels(c.Request.Context(), req.Provider)
    if err != nil { c.JSON(500, gin.H{"error": err.Error()}); return }
    exists := map[string]struct{}{}
    for _, m := range existing { exists[m.ModelID] = struct{}{} }
    created := 0
    now := time.Now()
    for _, mid := range req.Models {
        if mid == "" { continue }
        if _, ok := exists[mid]; ok { continue }
        m := &database.RerankModel{ Provider: req.Provider, ModelID: mid, DisplayName: mid, Status: "inactive", CreatedAt: now, UpdatedAt: now }
        if err := h.db.CreateRerankModel(c.Request.Context(), m); err == nil { created++ }
    }
    c.JSON(200, gin.H{"created": created})
}

// Update rerank model
type updateRerankReq struct {
    Provider      string  `json:"provider" binding:"required"`
    ModelID       string  `json:"model_id" binding:"required"`
    DisplayName   *string `json:"display_name"`
    BaseURL       *string `json:"base_url"`
    APIKey        *string `json:"api_key"`
}

func (h *RerankHandler) UpdateModel(c *gin.Context) {
    var req updateRerankReq
    if err := c.ShouldBindJSON(&req); err != nil { c.JSON(400, gin.H{"error": err.Error()}); return }
    updates := map[string]interface{}{}
    if req.DisplayName != nil { updates["display_name"] = *req.DisplayName }
    if req.BaseURL != nil { updates["base_url"] = *req.BaseURL }
    if req.APIKey != nil { updates["api_key_enc"] = *req.APIKey }
    if err := h.db.UpdateRerankModel(c.Request.Context(), req.Provider, req.ModelID, updates); err != nil { c.JSON(500, gin.H{"error": err.Error()}); return }
    c.JSON(200, gin.H{"ok": true})
}

