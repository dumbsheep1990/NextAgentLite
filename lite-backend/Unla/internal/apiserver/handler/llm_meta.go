package handler

import (
    "net/http"
    "time"

    "github.com/amoylab/unla/internal/apiserver/database"
    "github.com/gin-gonic/gin"
)

type LLMMetaHandler struct {
    db database.Database
}

func NewLLMMetaHandler(db database.Database) *LLMMetaHandler {
    return &LLMMetaHandler{db: db}
}

// SaveTestResult upserts a test result for a chat model (tool-call capability)
type saveTestReq struct {
    Provider      string `json:"provider" binding:"required"`
    ModelID       string `json:"model_id" binding:"required"`
    SupportsTools *bool  `json:"supports_tools"`
    LastError     string `json:"last_error"`
}

func (h *LLMMetaHandler) SaveTestResult(c *gin.Context) {
    var req saveTestReq
    if err := c.ShouldBindJSON(&req); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }
    now := time.Now()
    meta := &database.ChatModelMeta{
        Provider:      req.Provider,
        ModelID:       req.ModelID,
        SupportsTools: req.SupportsTools,
        LastTestAt:    &now,
        LastError:     req.LastError,
    }
    if err := h.db.UpsertChatModelMeta(c.Request.Context(), meta); err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
        return
    }
    c.JSON(200, gin.H{"ok": true})
}

// ListMeta returns meta list (optionally filter by provider)
func (h *LLMMetaHandler) ListMeta(c *gin.Context) {
    provider := c.Query("provider")
    items, err := h.db.ListChatModelMeta(c.Request.Context(), provider)
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
        return
    }
    c.JSON(200, gin.H{"data": items})
}

