package handler

import (
    "net/http"
    "time"
    "github.com/amoylab/unla/internal/apiserver/database"
    "github.com/gin-gonic/gin"
)

type EmbeddingHandler struct { db database.Database }

func NewEmbeddingHandler(db database.Database) *EmbeddingHandler { return &EmbeddingHandler{db: db} }

// Providers list (static for now; aligned with existing provider concepts)
var embeddingVendors = []string{"openai", "alibaba", "azure", "google", "zhipu", "custom"}

func (h *EmbeddingHandler) ListProviders(c *gin.Context) {
    c.JSON(http.StatusOK, embeddingVendors)
}

func (h *EmbeddingHandler) ListModels(c *gin.Context) {
    provider := c.Query("provider")
    items, err := h.db.ListEmbeddingModels(c.Request.Context(), provider)
    if err != nil { c.JSON(500, gin.H{"error": err.Error()}); return }
    c.JSON(200, items)
}

type createModelReq struct {
    Provider    string `json:"provider" binding:"required"`
    ModelID     string `json:"model_id" binding:"required"`
    DisplayName string `json:"display_name"`
    BaseURL     string `json:"base_url"`
    APIKey      string `json:"api_key"`
    Dimension   int    `json:"dimension"`
    ContextWindow int  `json:"context_window"`
}

func (h *EmbeddingHandler) CreateModel(c *gin.Context) {
    var req createModelReq
    if err := c.ShouldBindJSON(&req); err != nil { c.JSON(400, gin.H{"error": err.Error()}); return }
    m := &database.EmbeddingModel{ Provider: req.Provider, ModelID: req.ModelID, DisplayName: req.DisplayName, BaseURL: req.BaseURL, APIKeyEnc: req.APIKey, Dimension: req.Dimension, ContextWindow: req.ContextWindow, Status: "active", CreatedAt: time.Now(), UpdatedAt: time.Now() }
    if err := h.db.CreateEmbeddingModel(c.Request.Context(), m); err != nil { c.JSON(500, gin.H{"error": err.Error()}); return }
    c.JSON(201, m)
}

func (h *EmbeddingHandler) GetDefaults(c *gin.Context) {
    d, err := h.db.GetEmbeddingDefaults(c.Request.Context())
    if err != nil { c.JSON(500, gin.H{"error": err.Error()}); return }
    c.JSON(200, gin.H{"default_embedding": d.DefaultEmbedding})
}

type setDefaultsReq struct { DefaultEmbedding string `json:"default_embedding" binding:"required"` }

func (h *EmbeddingHandler) SetDefaults(c *gin.Context) {
    var req setDefaultsReq
    if err := c.ShouldBindJSON(&req); err != nil { c.JSON(400, gin.H{"error": err.Error()}); return }
    if err := h.db.SetEmbeddingDefaults(c.Request.Context(), req.DefaultEmbedding); err != nil { c.JSON(500, gin.H{"error": err.Error()}); return }
    c.JSON(200, gin.H{"ok": true})
}

type setStatusReq struct {
    Provider string `json:"provider" binding:"required"`
    ModelID  string `json:"model_id" binding:"required"`
    Status   string `json:"status" binding:"required"` // active/inactive
}

func (h *EmbeddingHandler) SetModelStatus(c *gin.Context) {
    var req setStatusReq
    if err := c.ShouldBindJSON(&req); err != nil { c.JSON(400, gin.H{"error": err.Error()}); return }
    if req.Status != "active" && req.Status != "inactive" { c.JSON(400, gin.H{"error": "invalid status"}); return }
    if err := h.db.SetEmbeddingModelStatus(c.Request.Context(), req.Provider, req.ModelID, req.Status); err != nil { c.JSON(500, gin.H{"error": err.Error()}); return }
    c.JSON(200, gin.H{"ok": true})
}

// Bulk upsert models fetched from provider; new ones will be created as inactive
type bulkUpsertReq struct {
    Provider string   `json:"provider" binding:"required"`
    Models   []string `json:"models" binding:"required"`
}

func (h *EmbeddingHandler) BulkUpsertModels(c *gin.Context) {
    var req bulkUpsertReq
    if err := c.ShouldBindJSON(&req); err != nil { c.JSON(400, gin.H{"error": err.Error()}); return }
    if len(req.Models) == 0 { c.JSON(200, gin.H{"created": 0}); return }

    // load existing to avoid duplicates
    existing, err := h.db.ListEmbeddingModels(c.Request.Context(), req.Provider)
    if err != nil { c.JSON(500, gin.H{"error": err.Error()}); return }
    exists := map[string]struct{}{}
    for _, m := range existing { exists[m.ModelID] = struct{}{} }

    created := 0
    now := time.Now()
    for _, mid := range req.Models {
        if mid == "" { continue }
        if _, ok := exists[mid]; ok { continue }
        m := &database.EmbeddingModel{ Provider: req.Provider, ModelID: mid, DisplayName: mid, Status: "inactive", CreatedAt: now, UpdatedAt: now }
        if err := h.db.CreateEmbeddingModel(c.Request.Context(), m); err == nil {
            created++
        }
    }
    c.JSON(200, gin.H{"created": created})
}

// Update model fields such as base_url, api_key, display_name, dimension, context_window
type updateModelReq struct {
    Provider      string  `json:"provider" binding:"required"`
    ModelID       string  `json:"model_id" binding:"required"`
    DisplayName   *string `json:"display_name"`
    BaseURL       *string `json:"base_url"`
    APIKey        *string `json:"api_key"`
    Dimension     *int    `json:"dimension"`
    ContextWindow *int    `json:"context_window"`
}

func (h *EmbeddingHandler) UpdateModel(c *gin.Context) {
    var req updateModelReq
    if err := c.ShouldBindJSON(&req); err != nil { c.JSON(400, gin.H{"error": err.Error()}); return }
    updates := map[string]interface{}{}
    if req.DisplayName != nil { updates["display_name"] = *req.DisplayName }
    if req.BaseURL != nil { updates["base_url"] = *req.BaseURL }
    if req.APIKey != nil { updates["api_key_enc"] = *req.APIKey }
    if req.Dimension != nil { updates["dimension"] = *req.Dimension }
    if req.ContextWindow != nil { updates["context_window"] = *req.ContextWindow }
    if err := h.db.UpdateEmbeddingModel(c.Request.Context(), req.Provider, req.ModelID, updates); err != nil { c.JSON(500, gin.H{"error": err.Error()}); return }
    c.JSON(200, gin.H{"ok": true})
}
