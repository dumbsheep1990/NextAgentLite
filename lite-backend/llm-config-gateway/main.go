package main

import (
    "context"
    "bytes"
    "encoding/json"
    "errors"
    "fmt"
    "io"
    "log"
    "net/http"
    "net/url"
    "os"
    "strings"
    "time"

    "github.com/gin-gonic/gin"
    gincors "github.com/gin-contrib/cors"
    "gorm.io/driver/postgres"
    "gorm.io/gorm"
    glogger "gorm.io/gorm/logger"
    yaml "gopkg.in/yaml.v3"

    // mcp-go runtime (only used at compile/run time; not needed to read code)
    mcpclient "github.com/mark3labs/mcp-go/client"
    mcptr "github.com/mark3labs/mcp-go/client/transport"
    mcpgo "github.com/mark3labs/mcp-go/mcp"
)

// mustJSON marshals value to JSON; panics avoided by returning empty on error (safe for proxy body)
func mustJSON(v any) []byte {
    b, _ := json.Marshal(v)
    return b
}

// Models
type LLMProvider struct {
    ID        uint      `gorm:"primaryKey" json:"id"`
    Name      string    `gorm:"uniqueIndex;size:128" json:"name"`
    Type      string    `gorm:"size:32" json:"type"` // openai, azure, qwen, oneapi, custom
    BaseURL   string    `gorm:"size:512" json:"base_url"`
    APIKeyEnc string    `gorm:"size:4096" json:"-"` // encrypted at rest (placeholder)
    ExtraHdrs string    `gorm:"type:text" json:"extra_headers"` // JSON string
    Status    string    `gorm:"size:16" json:"status"`         // active, disabled
    CreatedAt time.Time `json:"created_at"`
    UpdatedAt time.Time `json:"updated_at"`
}

type LLMModel struct {
    ID            uint      `gorm:"primaryKey" json:"id"`
    ProviderID    uint      `gorm:"index" json:"provider_id"`
    ModelID       string    `gorm:"index;size:256" json:"model_id"`
    DisplayName   string    `gorm:"size:256" json:"display_name"`
    ContextLength int       `json:"context_length"`
    Capabilities  string    `gorm:"type:text" json:"capabilities"` // JSON
    Pricing       string    `gorm:"type:text" json:"pricing"`      // JSON
    ModelType     string    `gorm:"size:16;default:chat" json:"model_type"` // chat or embedding
    Status        string    `gorm:"size:16" json:"status"`
    CreatedAt     time.Time `json:"created_at"`
    UpdatedAt     time.Time `json:"updated_at"`
}

type LLMAlias struct {
    ID         uint      `gorm:"primaryKey" json:"id"`
    Alias      string    `gorm:"uniqueIndex;size:128" json:"alias"`
    TargetID   uint      `gorm:"index" json:"target_model_id"`
    Tenant     string    `gorm:"size:128" json:"tenant"`
    CreatedAt  time.Time `json:"created_at"`
    UpdatedAt  time.Time `json:"updated_at"`
}

// Config snapshot payload
type ConfigSnapshot struct {
    Providers []LLMProvider `json:"providers"`
    Models    []LLMModel    `json:"models"`
    Aliases   []LLMAlias    `json:"aliases"`
    Defaults  *LLMDefaults  `json:"defaults,omitempty"`
}

type LLMDefaults struct {
    ID                uint      `gorm:"primaryKey" json:"id"`
    DefaultModel      string    `gorm:"size:256" json:"default_model"`
    DefaultEmbedding  string    `gorm:"size:256" json:"default_embedding"`
    DefaultRerank     string    `gorm:"size:256" json:"default_rerank"`
    UpdatedAt         time.Time `json:"updated_at"`
}

// MCP runtime registry (shared-mode): record running/known MCP instances
type MCPInstance struct {
    ID            uint      `gorm:"primaryKey" json:"id"`
    Tenant        string    `gorm:"size:64;index:idx_mcp_tenant_name,unique,priority:1" json:"tenant"`
    Name          string    `gorm:"size:128;index:idx_mcp_tenant_name,unique,priority:2" json:"name"`
    ServerName    string    `gorm:"size:128;index" json:"server_name"`
    Transport     string    `gorm:"size:32" json:"transport"` // stdio/http/ws
    Endpoint      string    `gorm:"size:512" json:"endpoint"`
    Prefix        string    `gorm:"size:128" json:"prefix"`
    Status        string    `gorm:"size:32" json:"status"` // running/stopped/error
    ToolsJSON     string    `gorm:"type:text" json:"tools_json"`
    MetadataJSON  string    `gorm:"type:text" json:"metadata_json"`
    LastHeartbeat time.Time `json:"last_heartbeat"`
    CreatedAt     time.Time `json:"created_at"`
    UpdatedAt     time.Time `json:"updated_at"`
}

func (MCPInstance) TableName() string { return "mcp_instances" }

// Catalog of API tools discovered from Unla configs (persist dynamic cache)
type APIToolCatalog struct {
    ID         uint      `gorm:"primaryKey" json:"id"`
    ConfigName string    `gorm:"size:128;index:idx_api_cfg_name" json:"config_name"`
    Name       string    `gorm:"size:256;index:idx_api_cfg_name" json:"name"`
    Method     string    `gorm:"size:16" json:"method"`
    Endpoint   string    `gorm:"size:512" json:"endpoint"`
    Headers    string    `gorm:"type:text" json:"headers_json"`
    UpdatedAt  time.Time `json:"updated_at"`
    CreatedAt  time.Time `json:"created_at"`
}

func (APIToolCatalog) TableName() string { return "api_tool_catalog" }

// Stats for MCP tool calls
type MCPToolStat struct {
    ID           uint      `gorm:"primaryKey" json:"id"`
    Server       string    `gorm:"size:128;index:idx_mcp_tool" json:"server"`
    Tool         string    `gorm:"size:256;index:idx_mcp_tool" json:"tool"`
    CallCount    int       `json:"call_count"`
    LastCalledAt time.Time `json:"last_called_at"`
    LastError    string    `gorm:"type:text" json:"last_error"`
    Active       bool      `gorm:"default:true" json:"active"`
    UpdatedAt    time.Time `json:"updated_at"`
    CreatedAt    time.Time `json:"created_at"`
}

func (MCPToolStat) TableName() string { return "mcp_tool_stats" }

// Unified tool catalog (MCP + API), for functions export and UI
type ToolCatalog struct {
    ID              uint      `gorm:"primaryKey" json:"id"`
    Name            string    `gorm:"uniqueIndex;size:256" json:"name"`          // mcp:server:tool | api:config:tool
    Title           string    `gorm:"size:256" json:"title"`
    Description     string    `gorm:"type:text" json:"description"`
    Transport       string    `gorm:"size:16" json:"transport"`                 // mcp|api
    RuntimeRef      string    `gorm:"size:256" json:"runtime_ref"`              // server | config
    ParametersJSON  string    `gorm:"type:text" json:"parameters_json"`         // JSON Schema
    Enabled         bool      `gorm:"default:true" json:"enabled"`
    UpdatedAt       time.Time `json:"updated_at"`
    CreatedAt       time.Time `json:"created_at"`
}

func (ToolCatalog) TableName() string { return "tool_catalog" }
// ---------------- API Tools cache (parsed from Unla configs) -----------------
type APITool struct {
    Name          string            `json:"name"`
    Description   string            `json:"description,omitempty"`
    Method        string            `json:"method"`
    Endpoint      string            `json:"endpoint"`
    Headers       map[string]string `json:"headers,omitempty"`
    HeadersOrder  []string          `json:"headersOrder,omitempty"`
}

// Cache: config name -> tools list
var apiToolsCache = map[string][]APITool{}

// Meta for API tools config: parsed servers and routers relations
type APIServerMeta struct {
    Name        string   `json:"name"`
    BaseURL     string   `json:"base_url,omitempty"`
    AllowedAPIs []string `json:"allowed_apis,omitempty"`
}

type APIRouterMeta struct {
    Prefix string `json:"prefix"`
    Server string `json:"server"`
}

type APIToolsConfigMeta struct {
    Servers []APIServerMeta `json:"servers,omitempty"`
    Routers []APIRouterMeta `json:"routers,omitempty"`
}

var apiToolsMeta = map[string]APIToolsConfigMeta{}

// --- Shared runtime (in-memory) for stdio MCP servers ---
type MCPServerSpec struct {
    Name     string
    Type     string // stdio/http (currently support stdio only)
    Command  string
    Args     []string
    Env      map[string]string
    Prefix   string // router prefix (optional)
    Policy   string // onStart/onDemand (optional)
}

type MCPRuntime struct {
    Spec      MCPServerSpec
    Client    *mcpclient.Client
    Running   bool
    LastStart time.Time
}

var (
    rtMap = map[string]*MCPRuntime{}
)

// helper: execute JSON POST/PUT/GET to internal endpoints and stream back response
func doProxyJSON(c *gin.Context, method, target string, body map[string]any) {
    b, _ := json.Marshal(body)
    req, err := http.NewRequestWithContext(c.Request.Context(), method, target, bytes.NewReader(b))
    if err != nil { c.JSON(500, gin.H{"error": err.Error()}); return }
    req.Header.Set("Content-Type", "application/json")
    resp, err := http.DefaultClient.Do(req)
    if err != nil { c.JSON(502, gin.H{"error": err.Error()}); return }
    defer resp.Body.Close()
    for k, v := range resp.Header { if len(v) > 0 { c.Writer.Header()[k] = v } }
    c.Status(resp.StatusCode)
    _, _ = io.Copy(c.Writer, resp.Body)
}

// --- Minimal JSON Schema validator (subset):
// Supports: type=object, properties (type in [string,number,boolean,object,array]), required []
// AdditionalProperties is allowed by default.
func validateArgs(schema map[string]any, args map[string]any) (bool, []string) {
    var errs []string
    // type
    if t, ok := schema["type"].(string); ok {
        if t != "object" {
            return false, []string{"schema type not supported: " + t}
        }
    }
    // required
    if req, ok := schema["required"].([]any); ok {
        for _, r := range req {
            key := fmt.Sprint(r)
            if _, ok := args[key]; !ok {
                errs = append(errs, fmt.Sprintf("missing required field: %s", key))
            }
        }
    }
    // properties
    if props, ok := schema["properties"].(map[string]any); ok {
        for k, v := range props {
            sub, _ := v.(map[string]any)
            if val, exists := args[k]; exists {
                if ok2, e2 := validateType(sub, val, k); !ok2 {
                    errs = append(errs, e2...)
                }
            }
        }
    }
    return len(errs) == 0, errs
}

func validateType(sub map[string]any, val any, path string) (bool, []string) {
    t, _ := sub["type"].(string)
    switch t {
    case "string":
        if _, ok := val.(string); !ok { return false, []string{fmt.Sprintf("%s must be string", path)} }
    case "number", "integer":
        switch val.(type) {
        case float64, float32, int, int64, int32:
        default:
            return false, []string{fmt.Sprintf("%s must be number", path)}
        }
    case "boolean":
        if _, ok := val.(bool); !ok { return false, []string{fmt.Sprintf("%s must be boolean", path)} }
    case "object":
        m, ok := val.(map[string]any)
        if !ok { return false, []string{fmt.Sprintf("%s must be object", path)} }
        // recursive for nested properties if provided
        if props, ok := sub["properties"].(map[string]any); ok {
            var errs []string
            for pk, pv := range props {
                ssub, _ := pv.(map[string]any)
                if v2, ex := m[pk]; ex {
                    if ok2, e2 := validateType(ssub, v2, path+"."+pk); !ok2 { errs = append(errs, e2...) }
                }
            }
            if len(errs) > 0 { return false, errs }
        }
    case "array":
        // minimal: must be slice
        switch val.(type) {
        case []any, []string, []int, []float64:
        default:
            return false, []string{fmt.Sprintf("%s must be array", path)}
        }
    case "":
        // no type means accept
    default:
        // unsupported types pass-through
    }
    return true, nil
}

func envMapToList(m map[string]string) []string {
    if m == nil { return nil }
    out := make([]string, 0, len(m))
    for k, v := range m { out = append(out, k+"="+v) }
    return out
}

func startRuntime(name string) error {
    r, ok := rtMap[name]
    if !ok { return fmt.Errorf("unknown server: %s", name) }
    if r.Running && r.Client != nil { return nil }
    if strings.ToLower(r.Spec.Type) != "stdio" {
        return fmt.Errorf("unsupported type: %s", r.Spec.Type)
    }
    stdio := mcptr.NewStdio(r.Spec.Command, envMapToList(r.Spec.Env), r.Spec.Args...)
    ctx, cancel := context.WithTimeout(context.Background(), 20*time.Second)
    defer cancel()
    if err := stdio.Start(ctx); err != nil { return fmt.Errorf("failed to start stdio: %w", err) }
    c := mcpclient.NewClient(stdio)
    initReq := mcpgo.InitializeRequest{}
    initReq.Params.ProtocolVersion = mcpgo.LATEST_PROTOCOL_VERSION
    initReq.Params.ClientInfo = mcpgo.Implementation{Name: "llm-config-gateway", Version: "0.1.0"}
    if _, err := c.Initialize(ctx, initReq); err != nil {
        _ = stdio.Close()
        return fmt.Errorf("failed to initialize mcp client: %w", err)
    }
    r.Client = c
    r.Running = true
    r.LastStart = time.Now()
    return nil
}

func stopRuntime(name string) error {
    r, ok := rtMap[name]
    if !ok { return fmt.Errorf("unknown server: %s", name) }
    if r.Client != nil {
        _ = r.Client.Close()
        r.Client = nil
    }
    r.Running = false
    return nil
}

func getenv(key, def string) string {
    if v := os.Getenv(key); v != "" {
        return v
    }
    return def
}

func tryParseJSON(s string) any {
    if strings.TrimSpace(s) == "" { return nil }
    var v any
    if err := json.Unmarshal([]byte(s), &v); err == nil { return v }
    return s
}

// pickBestProvider chooses a provider to attach a model to when creating implicitly
func pickBestProvider(db *gorm.DB) *LLMProvider {
    var ps []LLMProvider
    db.Where("status = ?", "active").Find(&ps)
    if len(ps) == 0 {
        db.Find(&ps)
    }
    if len(ps) == 0 { return nil }
    // prefer siliconcloud if present
    for _, p := range ps { if strings.EqualFold(p.Type, "siliconcloud") || strings.EqualFold(p.Name, "siliconcloud") || strings.Contains(strings.ToLower(p.BaseURL), "siliconflow.cn") { return &p } }
    // prefer openai
    for _, p := range ps { if strings.EqualFold(p.Type, "openai") || strings.EqualFold(p.Name, "openai") || strings.Contains(strings.ToLower(p.BaseURL), "openai.com") { return &p } }
    // otherwise first active
    return &ps[0]
}

func guessProviderType(name string) string {
    n := strings.ToLower(strings.TrimSpace(name))
    switch n {
    case "openai", "azure", "ollama", "qwen", "moonshot", "minimax", "zhipu", "wenxin", "cohere", "hunyuan", "tencentcloud", "xinference", "vllm", "huggingface", "openrouter", "jina", "siliconcloud":
        return n
    default:
        return "custom"
    }
}

func ternary[T any](cond bool, a, b T) T { if cond { return a }; return b }

// guessProviderFromModelID tries to infer provider name from model id string
func guessProviderFromModelID(model string) string {
    s := strings.ToLower(strings.TrimSpace(model))
    if s == "" { return "" }
    // explicit namespace like qwen/..., zhipu/..., openai/...
    parts := strings.Split(s, "/")
    if len(parts) > 1 {
        head := parts[0]
        switch head {
        case "qwen", "zhipu", "openai", "ollama", "moonshot", "minimax", "wenxin", "tencentcloud", "huggingface", "openrouter", "cohere", "xinference", "vllm", "siliconcloud", "mistral", "deepseek", "groq", "anthropic", "fireworksai", "higress":
            return head
        }
    }
    // keyword heuristics
    if strings.Contains(s, "gpt") || strings.Contains(s, "o1-") || strings.Contains(s, "o3-") { return "openai" }
    if strings.Contains(s, "qwen") { return "qwen" }
    if strings.Contains(s, "glm") { return "zhipu" }
    if strings.Contains(s, "ollama") || strings.Contains(s, ":latest") { return "ollama" }
    if strings.Contains(s, "mistral") { return "mistral" }
    if strings.Contains(s, "deepseek") { return "deepseek" }
    if strings.Contains(s, "groq") { return "groq" }
    if strings.Contains(s, "anthropic") || strings.Contains(s, "claude") { return "anthropic" }
    if strings.Contains(s, "openrouter") { return "openrouter" }
    if strings.Contains(s, "moonshot") || strings.Contains(s, "kimi") { return "moonshot" }
    if strings.Contains(s, "minimax") { return "minimax" }
    if strings.Contains(s, "wenxin") || strings.Contains(s, "ernie") { return "wenxin" }
    if strings.Contains(s, "tencent") || strings.Contains(s, "hunyuan") { return "tencentcloud" }
    if strings.Contains(s, "huggingface") || strings.Contains(s, "hf/") { return "huggingface" }
    if strings.Contains(s, "cohere") { return "cohere" }
    if strings.Contains(s, "xinference") { return "xinference" }
    if strings.Contains(s, "vllm") { return "vllm" }
    if strings.Contains(s, "silicon") || strings.Contains(s, "siliconflow") { return "siliconcloud" }
    if strings.Contains(s, "fireworks") { return "fireworksai" }
    if strings.Contains(s, "higress") { return "higress" }
    return ""
}

// defaultSwaggerHTML is used if swagger.html file is missing.
const defaultSwaggerHTML = `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>LLM Config Gateway · Swagger UI</title>
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist/swagger-ui.css" />
  <style>
    body { margin: 0; }
    #swagger-ui { height: 100vh; }
  </style>
  <script>
    // prefer same-origin spec
    window.__SPEC_URL__ = (location.origin + '/openapi.json');
  </script>
  <script src="https://unpkg.com/swagger-ui-dist/swagger-ui-bundle.js"></script>
  <script src="https://unpkg.com/swagger-ui-dist/swagger-ui-standalone-preset.js"></script>
</head>
<body>
  <div id="swagger-ui"></div>
  <script>
    window.ui = SwaggerUIBundle({
      url: window.__SPEC_URL__,
      dom_id: '#swagger-ui',
      presets: [SwaggerUIBundle.presets.apis, SwaggerUIStandalonePreset],
      layout: 'BaseLayout',
      deepLinking: true,
      tryItOutEnabled: true,
      displayRequestDuration: true,
    });
  </script>
</body>
</html>`

func dbConnect() *gorm.DB {
    host := getenv("LLM_DB_HOST", "localhost")
    port := getenv("LLM_DB_PORT", "5434")
    user := getenv("LLM_DB_USER", "postgres")
    pass := getenv("LLM_DB_PASSWORD", "")
    dbname := getenv("LLM_DB_NAME", "zzdsj_demo")
    sslmode := getenv("LLM_DB_SSLMODE", "disable")
    dsn := "postgres://" + user + ":" + pass + "@" + host + ":" + port + "/" + dbname + "?sslmode=" + sslmode
    db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{ Logger: glogger.Default.LogMode(glogger.Warn) })
    if err != nil {
        log.Fatalf("failed to connect db: %v", err)
    }
    if err := db.AutoMigrate(&LLMProvider{}, &LLMModel{}, &LLMAlias{}, &LLMDefaults{}, &MCPInstance{}, &APIToolCatalog{}, &MCPToolStat{}, &ToolCatalog{}); err != nil {
        log.Fatalf("failed to migrate: %v", err)
    }
    return db
}

// --- Unla mcp_configs row helpers ---
type unlaMCPRow struct {
    ID       uint
    Name     string
    Tenant   string
    Servers  string
    Routers  string
    Tools    string
    UpdatedAt time.Time
}

func loadUnlaConfigRow(db *gorm.DB, table, tenant, name string) (*unlaMCPRow, error) {
    var row unlaMCPRow
    q := fmt.Sprintf("SELECT id, name, tenant, servers, routers, tools, updated_at FROM %s WHERE deleted_at IS NULL AND name = ?", table)
    var args []any
    if strings.TrimSpace(tenant) != "" {
        q += " AND tenant = ?"
        args = []any{name, tenant}
    } else {
        args = []any{name}
    }
    if err := db.Raw(q, args...).Scan(&row).Error; err != nil {
        return nil, err
    }
    if strings.TrimSpace(row.Name) == "" {
        return nil, gorm.ErrRecordNotFound
    }
    return &row, nil
}

func saveUnlaConfigServers(db *gorm.DB, table string, id uint, serversJSON string) error {
    return db.Exec("UPDATE "+table+" SET servers = ?, updated_at = ? WHERE id = ?", serversJSON, time.Now(), id).Error
}

func saveUnlaConfigRouters(db *gorm.DB, table string, id uint, routersJSON string) error {
    return db.Exec("UPDATE "+table+" SET routers = ?, updated_at = ? WHERE id = ?", routersJSON, time.Now(), id).Error
}

// findModelNoCheck resolves alias or model_id to provider+model without checking status
func findModelNoCheck(db *gorm.DB, name string) (*LLMProvider, *LLMModel, error) {
    // alias（使用 Find 避免 ErrRecordNotFound 打印）
    var alias LLMAlias
    db.Where("alias = ?", name).Limit(1).Find(&alias)
    if alias.ID != 0 {
        var model LLMModel
        if e := db.Where("id = ?", alias.TargetID).Limit(1).Find(&model).Error; e != nil { return nil, nil, e }
        if model.ID == 0 { return nil, nil, errors.New("model not found for alias") }
        var prov LLMProvider
        if e := db.Where("id = ?", model.ProviderID).Limit(1).Find(&prov).Error; e != nil { return nil, nil, e }
        if prov.ID == 0 { return nil, nil, errors.New("provider not found for model") }
        return &prov, &model, nil
    }
    // model_id
    var model LLMModel
    if e := db.Where("model_id = ?", name).Limit(1).Find(&model).Error; e != nil { return nil, nil, e }
    if model.ID == 0 { return nil, nil, errors.New("model or alias not found") }
    var prov LLMProvider
    if e := db.Where("id = ?", model.ProviderID).Limit(1).Find(&prov).Error; e != nil { return nil, nil, e }
    if prov.ID == 0 { return nil, nil, errors.New("provider not found for model") }
    return &prov, &model, nil
}

// normalizeModelName removes known, non上游识别的前缀（如 Pro/）并做简易清洗
func normalizeModelName(name string) string {
    n := strings.TrimSpace(name)
    if n == "" { return n }
    // 去掉常见前缀，如 Pro/
    if strings.HasPrefix(n, "Pro/") || strings.HasPrefix(n, "pro/") || strings.HasPrefix(n, "PRO/") {
        n = strings.TrimPrefix(n, "Pro/")
        n = strings.TrimPrefix(n, "pro/")
        n = strings.TrimPrefix(n, "PRO/")
    }
    // 避免多余空格
    n = strings.Trim(n, " ")
    return n
}

func main() {
    db := dbConnect()
    // global assign
    // gorm is thread-safe; store pointer for runtime helpers via closure where needed
    r := gin.Default()
    // CORS for browser-based UI (Unla web on :5173)
    r.Use(gincors.New(gincors.Config{
        AllowOrigins:     []string{"http://localhost:5173", "http://127.0.0.1:5173", "*"},
        AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
        AllowHeaders:     []string{"Authorization", "Content-Type"},
        ExposeHeaders:    []string{"Content-Type"},
        AllowCredentials: true,
        MaxAge:           600 * time.Second,
    }))

    // Health & Ready & OpenAPI docs
    r.GET("/health", func(c *gin.Context) { c.JSON(http.StatusOK, gin.H{"status": "ok"}) })
    r.GET("/readyz", func(c *gin.Context) {
        // 简单就绪检查：DB 可用
        sqlDB, err := db.DB()
        if err != nil { c.JSON(http.StatusServiceUnavailable, gin.H{"status":"db_error","error": err.Error()}); return }
        if err := sqlDB.PingContext(c.Request.Context()); err != nil {
            c.JSON(http.StatusServiceUnavailable, gin.H{"status":"db_unreachable","error": err.Error()})
            return
        }
        c.JSON(http.StatusOK, gin.H{"status":"ready"})
    })
    // Serve OpenAPI spec (YAML/JSON)
    r.GET("/openapi.yaml", func(c *gin.Context) {
        // Serve static file content
        data, err := os.ReadFile("openapi.yaml")
        if err != nil { c.String(404, "openapi.yaml not found"); return }
        c.Data(200, "application/yaml", data)
    })
    r.GET("/openapi.json", func(c *gin.Context) {
        data, err := os.ReadFile("openapi.yaml")
        if err != nil { c.JSON(404, gin.H{"error":"openapi.yaml not found"}); return }
        var v any
        if err := yaml.Unmarshal(data, &v); err != nil { c.JSON(500, gin.H{"error": err.Error()}); return }
        c.JSON(200, v)
    })
    // Swagger UI page
    r.GET("/docs", func(c *gin.Context) {
        html, err := os.ReadFile("swagger.html")
        if err != nil {
            // Fallback: inline minimal HTML
            c.Data(200, "text/html; charset=utf-8", []byte(defaultSwaggerHTML))
            return
        }
        c.Data(200, "text/html; charset=utf-8", html)
    })
    r.GET("/swagger", func(c *gin.Context) { c.Redirect(302, "/docs") })

    // --- MCP Registry (shared mode) ---
    type RegReq struct {
        Tenant     string                 `json:"tenant"`
        Name       string                 `json:"name"`
        ServerName string                 `json:"server_name"`
        Transport  string                 `json:"transport"`
        Endpoint   string                 `json:"endpoint"`
        Prefix     string                 `json:"prefix"`
        Status     string                 `json:"status"`
        Tools      []map[string]any       `json:"tools"`
        Metadata   map[string]any         `json:"metadata"`
    }
    r.POST("/mcp/registry/register", func(c *gin.Context) {
        var req RegReq
        if err := c.BindJSON(&req); err != nil { c.JSON(400, gin.H{"error": err.Error()}); return }
        if strings.TrimSpace(req.Name) == "" { c.JSON(400, gin.H{"error":"name required"}); return }
        if strings.TrimSpace(req.Endpoint) == "" { c.JSON(400, gin.H{"error":"endpoint required"}); return }
        tenant := req.Tenant; if tenant == "" { tenant = "default" }
        inst := MCPInstance{
            Tenant: tenant, Name: req.Name, ServerName: req.ServerName,
            Transport: req.Transport, Endpoint: req.Endpoint, Prefix: req.Prefix,
            Status: ternary(req.Status!="", req.Status, "running"), LastHeartbeat: time.Now(),
        }
        var exist MCPInstance
        if err := db.Where("tenant = ? AND name = ?", tenant, req.Name).First(&exist).Error; err == nil {
            inst.ID = exist.ID
        }
        if err := db.Save(&inst).Error; err != nil { c.JSON(500, gin.H{"error": err.Error()}); return }
        // tools/metadata optional
        updates := map[string]any{"updated_at": time.Now()}
        if len(req.Tools) > 0 { b, _ := json.Marshal(req.Tools); updates["tools_json"] = string(b) }
        if req.Metadata != nil { b, _ := json.Marshal(req.Metadata); updates["metadata_json"] = string(b) }
        _ = db.Model(&MCPInstance{}).Where("tenant = ? AND name = ?", tenant, req.Name).Updates(updates).Error
        c.JSON(200, gin.H{"ok": true})
    })
    r.POST("/mcp/registry/heartbeat", func(c *gin.Context) {
        var req struct { Tenant, Name, Status string }
        if err := c.BindJSON(&req); err != nil { c.JSON(400, gin.H{"error": err.Error()}); return }
        if req.Name == "" { c.JSON(400, gin.H{"error":"name required"}); return }
        tenant := req.Tenant; if tenant == "" { tenant = "default" }
        updates := map[string]any{"last_heartbeat": time.Now()}
        if req.Status != "" { updates["status"] = req.Status }
        if err := db.Model(&MCPInstance{}).Where("tenant = ? AND name = ?", tenant, req.Name).Updates(updates).Error; err != nil {
            c.JSON(500, gin.H{"error": err.Error()}); return
        }
        c.JSON(200, gin.H{"ok": true})
    })
    r.GET("/mcp/registry", func(c *gin.Context) {
        tenant := c.Query("tenant")
        var items []MCPInstance
        q := db.Model(&MCPInstance{})
        if tenant != "" { q = q.Where("tenant = ?", tenant) }
        if err := q.Order("updated_at DESC").Find(&items).Error; err != nil { c.JSON(500, gin.H{"error": err.Error()}); return }
        c.JSON(200, items)
    })
    r.GET("/mcp/registry/:tenant/:name", func(c *gin.Context) {
        tenant := c.Param("tenant"); if tenant == "" { tenant = "default" }
        name := c.Param("name")
        var inst MCPInstance
        if err := db.Where("tenant = ? AND name = ?", tenant, name).First(&inst).Error; err != nil { c.JSON(404, gin.H{"error":"not found"}); return }
        c.JSON(200, inst)
    })
    r.PUT("/mcp/registry/:tenant/:name/tools", func(c *gin.Context) {
        tenant := c.Param("tenant"); if tenant == "" { tenant = "default" }
        name := c.Param("name")
        var req struct { Tools []map[string]any `json:"tools"` }
        if err := c.BindJSON(&req); err != nil { c.JSON(400, gin.H{"error": err.Error()}); return }
        b, _ := json.Marshal(req.Tools)
        if err := db.Model(&MCPInstance{}).Where("tenant = ? AND name = ?", tenant, name).Updates(map[string]any{"tools_json": string(b), "updated_at": time.Now()}).Error; err != nil {
            c.JSON(500, gin.H{"error": err.Error()}); return
        }
        c.JSON(200, gin.H{"ok": true})
    })
    r.DELETE("/mcp/registry/:tenant/:name", func(c *gin.Context) {
        tenant := c.Param("tenant"); if tenant == "" { tenant = "default" }
        name := c.Param("name")
        if err := db.Where("tenant = ? AND name = ?", tenant, name).Delete(&MCPInstance{}).Error; err != nil { c.JSON(500, gin.H{"error": err.Error()}); return }
        c.JSON(200, gin.H{"ok": true})
    })
    // Convenience aliases
    r.GET("/mcp/servers", func(c *gin.Context) { c.Redirect(307, "/mcp/registry") })
    r.GET("/mcp/servers/:name/tools", func(c *gin.Context) {
        name := c.Param("name")
        // live list if runtime is up
        if rt, ok := rtMap[name]; ok && rt.Running && rt.Client != nil {
            ctx, cancel := context.WithTimeout(c.Request.Context(), 15*time.Second)
            defer cancel()
            toolsRes, err := rt.Client.ListTools(ctx, mcpgo.ListToolsRequest{})
            if err == nil {
                // project to simple form & update registry cache
                simple := make([]map[string]any, 0, len(toolsRes.Tools))
                for _, t := range toolsRes.Tools {
                    simple = append(simple, map[string]any{"name": t.Name, "description": t.Description})
                }
                // cache
                b, _ := json.Marshal(simple)
                _ = db.Model(&MCPInstance{}).Where("name = ?", name).Updates(map[string]any{"tools_json": string(b), "updated_at": time.Now()}).Error
                c.JSON(200, simple)
                return
            }
        }
        // fallback to cache
        var inst MCPInstance
        if err := db.Where("name = ?", name).First(&inst).Error; err != nil { c.JSON(404, gin.H{"error":"not found"}); return }
        if strings.TrimSpace(inst.ToolsJSON) == "" { c.JSON(200, []any{}); return }
        var tools any
        _ = json.Unmarshal([]byte(inst.ToolsJSON), &tools)
        c.JSON(200, tools)
    })
    r.POST("/mcp/servers/:name/tools/:tool/call", func(c *gin.Context) {
        name := c.Param("name"); tool := c.Param("tool")
        // 如果运行时不存在，尝试从 Unla DB 懒加载规格
        if _, ok := rtMap[name]; !ok {
            prefix := getenv("UNLA_DB_TABLE_PREFIX", "unla_")
            table := prefix + "mcp_configs"
            type row struct{ Name string; Tenant string; Routers string; McpServers string }
            var rows []row
            if err := db.Raw("SELECT name, tenant, routers, mcp_servers FROM "+table+" WHERE deleted_at IS NULL").Scan(&rows).Error; err == nil {
                for _, r0 := range rows {
                    // server -> prefix
                    prefixMap := map[string]string{}
                    if strings.TrimSpace(r0.Routers) != "" {
                        var rs []map[string]any
                        if json.Unmarshal([]byte(r0.Routers), &rs) == nil {
                            for _, rr := range rs {
                                sname := fmt.Sprint(rr["server"]) ; pfx := fmt.Sprint(rr["prefix"]) ; if sname != "" && pfx != "" { prefixMap[sname] = pfx }
                            }
                        }
                    }
                    if strings.TrimSpace(r0.McpServers) == "" { continue }
                    var servers []map[string]any
                    if json.Unmarshal([]byte(r0.McpServers), &servers) != nil { continue }
                    for _, smm := range servers {
                        if strings.ToLower(fmt.Sprint(smm["type"])) != "stdio" { continue }
                        sname := fmt.Sprint(smm["name"]) ; if sname != name { continue }
                        cmd := fmt.Sprint(smm["command"]) ; var args []string
                        if av, ok := smm["args"].([]any); ok { for _, a := range av { args = append(args, fmt.Sprint(a)) } }
                        env := map[string]string{} ; if ev, ok := smm["env"].(map[string]any); ok { for k, v := range ev { env[k] = fmt.Sprint(v) } }
                        spec := MCPServerSpec{ Name: sname, Type: "stdio", Command: cmd, Args: args, Env: env, Prefix: prefixMap[sname], Policy: fmt.Sprint(smm["policy"]) }
                        rtMap[sname] = &MCPRuntime{ Spec: spec }
                        // 注册表（可选）
                        inst := MCPInstance{ Tenant: "default", Name: sname, ServerName: sname, Transport: "stdio", Endpoint: "http://127.0.0.1:9050/servers/"+sname, Prefix: spec.Prefix, Status: "stopped", LastHeartbeat: time.Now() }
                        var exist MCPInstance
                        if err := db.Where("tenant = ? AND name = ?", "default", sname).First(&exist).Error; err == nil { inst.ID = exist.ID }
                        _ = db.Save(&inst).Error
                    }
                }
            }
        }

        rt, ok := rtMap[name]
        if !ok {
            c.JSON(404, gin.H{"error":"server not found"}); return
        }
        if !rt.Running || rt.Client == nil {
            if err := startRuntime(name); err != nil { c.JSON(500, gin.H{"error": err.Error()}); return }
        }

        var body map[string]any
        _ = c.BindJSON(&body)
        // mcp-go expects map for arguments; ensure non-nil
        args := map[string]any{}
        if v, ok := body["args"].(map[string]any); ok { args = v } else { args = body }
        ctx, cancel := context.WithTimeout(c.Request.Context(), 60*time.Second)
        defer cancel()
        req := mcpgo.CallToolRequest{}
        req.Params.Name = tool
        req.Params.Arguments = args
        res, err := rt.Client.CallTool(ctx, req)
        if err != nil {
            // 记录失败统计
            _ = db.Transaction(func(tx *gorm.DB) error {
                var st MCPToolStat
                if e := tx.Where("server = ? AND tool = ?", name, tool).First(&st).Error; e != nil { /* ignore */ }
                st.Server = name; st.Tool = tool; st.LastError = err.Error(); st.UpdatedAt = time.Now()
                if st.ID == 0 { st.CreatedAt = time.Now() }
                return tx.Save(&st).Error
            })
            c.JSON(500, gin.H{"error": err.Error()}); return
        }
        // 记录成功统计
        _ = db.Transaction(func(tx *gorm.DB) error {
            var st MCPToolStat
            if e := tx.Where("server = ? AND tool = ?", name, tool).First(&st).Error; e != nil { /* ignore */ }
            st.Server = name; st.Tool = tool; st.CallCount += 1; st.LastCalledAt = time.Now(); st.LastError = ""; st.Active = true; st.UpdatedAt = time.Now()
            if st.ID == 0 { st.CreatedAt = time.Now() }
            return tx.Save(&st).Error
        })
        c.JSON(200, res)
        // optional: onDemand policy stop
        if strings.ToLower(rt.Spec.Policy) == "ondemand" {
            _ = stopRuntime(name)
        }
    })

    // --- Unified Tools Execute ---
    // Body: { "tool": "mcp:server:tool" | "api:config:tool" | "server:tool", "args": { ... } }
    r.POST("/tools/execute", func(c *gin.Context) {
        var body struct {
            Tool string                 `json:"tool"`
            Args map[string]any         `json:"args"`
        }
        if err := c.BindJSON(&body); err != nil { c.JSON(400, gin.H{"error": "invalid json: "+err.Error()}); return }
        tool := strings.TrimSpace(body.Tool)
        if tool == "" { c.JSON(400, gin.H{"error": "tool required"}); return }

        // minimal validation
        if body.Args == nil { body.Args = map[string]any{} }

        // Validate against catalog schema if present
        var cat ToolCatalog
        if err := db.Where("name = ? AND enabled = ?", tool, true).First(&cat).Error; err == nil {
            if strings.TrimSpace(cat.ParametersJSON) != "" {
                var schema map[string]any
                if json.Unmarshal([]byte(cat.ParametersJSON), &schema) == nil {
                    if ok, errs := validateArgs(schema, body.Args); !ok {
                        c.JSON(400, gin.H{"error": "invalid arguments", "details": errs})
                        return
                    }
                }
            }
        }

        lower := strings.ToLower(tool)
        // Parse forms
        if strings.HasPrefix(lower, "mcp:") {
            parts := strings.SplitN(tool, ":", 3)
            if len(parts) < 3 { c.JSON(400, gin.H{"error": "invalid mcp tool format. expected mcp:{server}:{tool}"}); return }
            server := parts[1]
            tname := parts[2]
            // ensure runtime exists and is started (lazy load from Unla DB if missing)
            if _, ok := rtMap[server]; !ok {
                // try lazy resolve from Unla DB like /mcp/servers/:name/start
                prefix := getenv("UNLA_DB_TABLE_PREFIX", "unla_")
                table := prefix + "mcp_configs"
                type row struct{ Name string; Tenant string; Routers string; McpServers string }
                var rows []row
                if err := db.Raw("SELECT name, tenant, routers, mcp_servers FROM "+table+" WHERE deleted_at IS NULL").Scan(&rows).Error; err == nil {
                    for _, r0 := range rows {
                        // build server -> prefix
                        prefixMap := map[string]string{}
                        if strings.TrimSpace(r0.Routers) != "" {
                            var rs []map[string]any
                            if json.Unmarshal([]byte(r0.Routers), &rs) == nil {
                                for _, rr := range rs {
                                    sname := fmt.Sprint(rr["server"]) ; pfx := fmt.Sprint(rr["prefix"]) ; if sname != "" && pfx != "" { prefixMap[sname] = pfx }
                                }
                            }
                        }
                        if strings.TrimSpace(r0.McpServers) == "" { continue }
                        var servers []map[string]any
                        if json.Unmarshal([]byte(r0.McpServers), &servers) != nil { continue }
                        for _, smm := range servers {
                            if strings.ToLower(fmt.Sprint(smm["type"])) != "stdio" { continue }
                            sname := fmt.Sprint(smm["name"]) ; if sname != server { continue }
                            cmd := fmt.Sprint(smm["command"]) ; var args []string
                            if av, ok := smm["args"].([]any); ok { for _, a := range av { args = append(args, fmt.Sprint(a)) } }
                            env := map[string]string{} ; if ev, ok := smm["env"].(map[string]any); ok { for k, v := range ev { env[k] = fmt.Sprint(v) } }
                            spec := MCPServerSpec{ Name: sname, Type: "stdio", Command: cmd, Args: args, Env: env, Prefix: prefixMap[sname], Policy: fmt.Sprint(smm["policy"]) }
                            rtMap[sname] = &MCPRuntime{ Spec: spec }
                            // registry upsert as stopped (optional)
                            inst := MCPInstance{ Tenant: "default", Name: sname, ServerName: sname, Transport: "stdio", Endpoint: "http://127.0.0.1:9050/servers/"+sname, Prefix: spec.Prefix, Status: "stopped", LastHeartbeat: time.Now() }
                            var exist MCPInstance
                            if err := db.Where("tenant = ? AND name = ?", "default", sname).First(&exist).Error; err == nil { inst.ID = exist.ID }
                            _ = db.Save(&inst).Error
                        }
                    }
                }
            }
            // if still missing, return 404
            if _, ok := rtMap[server]; !ok {
                c.JSON(404, gin.H{"error": "mcp server not found"}); return
            }
            // ensure started
            if rt := rtMap[server]; rt != nil && (!rt.Running || rt.Client == nil) {
                if err := startRuntime(server); err != nil { c.JSON(500, gin.H{"error": err.Error()}); return }
            }
            // proxy to internal MCP call
            c.Request.Body = io.NopCloser(bytes.NewReader(mustJSON(body.Args)))
            c.Params = append(c.Params[:0],
                gin.Param{Key: "name", Value: server},
                gin.Param{Key: "tool", Value: tname},
            )
            // delegate to handler function by rewriting context (simplify using redirect)
            // Simpler: perform local HTTP call
            goURL := strings.TrimRight(getenv("LLM_GATEWAY_INTERNAL_BASE", "http://127.0.0.1:9050"), "/") + "/mcp/servers/"+url.PathEscape(server)+"/tools/"+url.PathEscape(tname)+"/call"
            doProxyJSON(c, http.MethodPost, goURL, body.Args)
            return
        }
        if strings.HasPrefix(lower, "api:") {
            parts := strings.SplitN(tool, ":", 3)
            if len(parts) < 3 { c.JSON(400, gin.H{"error": "invalid api tool format. expected api:{config}:{tool}"}); return }
            cfg := parts[1]
            tname := parts[2]
            goURL := strings.TrimRight(getenv("LLM_GATEWAY_INTERNAL_BASE", "http://127.0.0.1:9050"), "/") + "/api-tools/configs/"+url.PathEscape(cfg)+"/tools/"+url.PathEscape(tname)+"/call"
            doProxyJSON(c, http.MethodPost, goURL, body.Args)
            return
        }
        // fallback: treat as mcp server:tool
        if strings.Count(tool, ":") == 1 {
            parts := strings.SplitN(tool, ":", 2)
            server, tname := parts[0], parts[1]
            goURL := strings.TrimRight(getenv("LLM_GATEWAY_INTERNAL_BASE", "http://127.0.0.1:9050"), "/") + "/mcp/servers/"+url.PathEscape(server)+"/tools/"+url.PathEscape(tname)+"/call"
            doProxyJSON(c, http.MethodPost, goURL, body.Args)
            return
        }
        c.JSON(400, gin.H{"error": "unknown tool format"})
    })

    // Export tools as OpenAI functions for models that support native tools
    r.GET("/tools/functions", func(c *gin.Context) {
        // each item: {name, description, parameters}
        type Fn struct {
            Name        string      `json:"name"`
            Description string      `json:"description"`
            Parameters  interface{} `json:"parameters"`
        }
        fns := []Fn{}

        // Prefer catalog from DB if available
        var cats []ToolCatalog
        if err := db.Find(&cats).Error; err == nil && len(cats) > 0 {
            for _, tc := range cats {
                var params any
                if strings.TrimSpace(tc.ParametersJSON) != "" {
                    if json.Unmarshal([]byte(tc.ParametersJSON), &params) != nil {
                        params = map[string]any{"type":"object", "additionalProperties": true}
                    }
                } else {
                    params = map[string]any{"type":"object", "additionalProperties": true}
                }
                fns = append(fns, Fn{Name: tc.Name, Description: tc.Description, Parameters: params})
            }
            c.JSON(200, gin.H{"functions": fns})
            return
        }

        // MCP tools from runtimes and registry (cache)
        addMcpFn := func(server string, name string, desc string) {
            fnName := "mcp:"+server+":"+name
            param := map[string]any{"type":"object", "properties": map[string]any{}, "additionalProperties": true}
            fns = append(fns, Fn{Name: fnName, Description: desc, Parameters: param})
        }
        // Prefer runtime live list; fallback to DB tools_json
        for server := range rtMap {
            // try live
            tools := []map[string]any{}
            if rt := rtMap[server]; rt != nil {
                if rt.Running && rt.Client != nil {
                    ctx, cancel := context.WithTimeout(c.Request.Context(), 10*time.Second)
                    defer cancel()
                    if res, err := rt.Client.ListTools(ctx, mcpgo.ListToolsRequest{}); err == nil {
                        for _, t := range res.Tools { addMcpFn(server, t.Name, t.Description) }
                        tools = nil // done
                    }
                }
            }
            if tools != nil { // fallback registry
                var inst MCPInstance
                if err := db.Where("name = ?", server).First(&inst).Error; err == nil {
                    if strings.TrimSpace(inst.ToolsJSON) != "" {
                        var arr []map[string]any
                        if json.Unmarshal([]byte(inst.ToolsJSON), &arr) == nil {
                            for _, t := range arr { addMcpFn(server, fmt.Sprint(t["name"]), fmt.Sprint(t["description"])) }
                        }
                    }
                }
            }
        }

        // API tools from cache
        for cfg, list := range apiToolsCache {
            for _, t := range list {
                name := "api:"+cfg+":"+t.Name
                desc := t.Description
                param := map[string]any{"type":"object", "properties": map[string]any{}, "additionalProperties": true}
                fns = append(fns, Fn{Name: name, Description: desc, Parameters: param})
            }
        }
        c.JSON(200, gin.H{"functions": fns})
    })

    // List unified tool catalog (MCP + API) for UI/backends
    r.GET("/tools/catalog", func(c *gin.Context) {
        type Item struct {
            Type        string `json:"type"`  // mcp|api
            Name        string `json:"name"`  // full name, e.g., mcp:playwright:browser_navigate
            Title       string `json:"title"`
            Description string `json:"description"`
        }
        out := []Item{}

        // Prefer catalog table
        var cats []ToolCatalog
        if err := db.Find(&cats).Error; err == nil && len(cats) > 0 {
            for _, tc := range cats {
                out = append(out, Item{Type: tc.Transport, Name: tc.Name, Title: tc.Title, Description: tc.Description})
            }
            c.JSON(200, gin.H{"tools": out})
            return
        }
        // MCP (runtime live)
        for server, rt := range rtMap {
            if rt != nil && rt.Running && rt.Client != nil {
                ctx, cancel := context.WithTimeout(c.Request.Context(), 10*time.Second)
                defer cancel()
                if res, err := rt.Client.ListTools(ctx, mcpgo.ListToolsRequest{}); err == nil {
                    for _, t := range res.Tools {
                        out = append(out, Item{Type: "mcp", Name: "mcp:"+server+":"+t.Name, Title: t.Name, Description: t.Description})
                    }
                }
            }
        }
        // MCP (registry fallback)
        for server := range rtMap {
            var inst MCPInstance
            if err := db.Where("name = ?", server).First(&inst).Error; err == nil {
                if strings.TrimSpace(inst.ToolsJSON) != "" {
                    var arr []map[string]any
                    if json.Unmarshal([]byte(inst.ToolsJSON), &arr) == nil {
                        for _, t := range arr {
                            name := fmt.Sprint(t["name"]) ; if name == "" { continue }
                            desc := fmt.Sprint(t["description"]) 
                            out = append(out, Item{Type: "mcp", Name: "mcp:"+server+":"+name, Title: name, Description: desc})
                        }
                    }
                }
            }
        }
        // API
        for cfg, list := range apiToolsCache {
            for _, t := range list {
                out = append(out, Item{Type: "api", Name: "api:"+cfg+":"+t.Name, Title: t.Name, Description: t.Description})
            }
        }
        c.JSON(200, gin.H{"tools": out})
    })

    // Admin: Sync unified tool catalog from current MCP runtimes/registry and API caches
    r.POST("/admin/sync-tools-catalog", func(c *gin.Context) {
        // build list
        now := time.Now()
        synced := 0
        upsert := func(name, title, desc, transport, ref string, params map[string]any) {
            var rec ToolCatalog
            if err := db.Where("name = ?", name).First(&rec).Error; err != nil {
                rec = ToolCatalog{Name: name, CreatedAt: now}
            }
            rec.Title = title
            rec.Description = desc
            rec.Transport = transport
            rec.RuntimeRef = ref
            if b, e := json.Marshal(params); e == nil { rec.ParametersJSON = string(b) }
            rec.Enabled = true
            rec.UpdatedAt = now
            if err := db.Save(&rec).Error; err == nil { synced++ }
        }

        // MCP live
        for server, rt := range rtMap {
            if rt != nil && rt.Running && rt.Client != nil {
                ctx, cancel := context.WithTimeout(c.Request.Context(), 10*time.Second)
                defer cancel()
                if res, err := rt.Client.ListTools(ctx, mcpgo.ListToolsRequest{}); err == nil {
                    for _, t := range res.Tools {
                        upsert("mcp:"+server+":"+t.Name, t.Name, t.Description, "mcp", server, map[string]any{"type":"object", "additionalProperties": true})
                    }
                }
            }
        }
        // MCP registry fallback
        for server := range rtMap {
            var inst MCPInstance
            if err := db.Where("name = ?", server).First(&inst).Error; err == nil {
                if strings.TrimSpace(inst.ToolsJSON) != "" {
                    var arr []map[string]any
                    if json.Unmarshal([]byte(inst.ToolsJSON), &arr) == nil {
                        for _, t := range arr {
                            name := fmt.Sprint(t["name"]) ; if name == "" { continue }
                            desc := fmt.Sprint(t["description"]) 
                            upsert("mcp:"+server+":"+name, name, desc, "mcp", server, map[string]any{"type":"object", "additionalProperties": true})
                        }
                    }
                }
            }
        }
        // API cache
        for cfg, list := range apiToolsCache {
            for _, t := range list {
                // basic schema for API tools
                schema := map[string]any{
                    "type": "object",
                    "properties": map[string]any{
                        "path": map[string]any{"type":"object", "additionalProperties": true},
                        "query": map[string]any{"type":"object", "additionalProperties": true},
                        "headers": map[string]any{"type":"object", "additionalProperties": true},
                        "body": map[string]any{"type":"object", "additionalProperties": true},
                    },
                    "additionalProperties": true,
                }
                upsert("api:"+cfg+":"+t.Name, t.Name, t.Description, "api", cfg, schema)
            }
        }

        c.JSON(200, gin.H{"ok": true, "synced": synced})
    })

    // Manage runtime lifecycle
    r.POST("/mcp/servers/:name/start", func(c *gin.Context) {
        name := c.Param("name")
        if _, ok := rtMap[name]; !ok {
            // Lazy resolve from Unla DB if not configured in memory
            prefix := getenv("UNLA_DB_TABLE_PREFIX", "unla_")
            table := prefix + "mcp_configs"
            type row struct{ Name string; Tenant string; Routers string; McpServers string }
            var rows []row
            if err := db.Raw("SELECT name, tenant, routers, mcp_servers FROM " + table + " WHERE deleted_at IS NULL").Scan(&rows).Error; err == nil {
                for _, r0 := range rows {
                    // build server -> prefix
                    prefixMap := map[string]string{}
                    if strings.TrimSpace(r0.Routers) != "" {
                        var rs []map[string]any
                        if json.Unmarshal([]byte(r0.Routers), &rs) == nil {
                            for _, rr := range rs {
                                sname := fmt.Sprint(rr["server"]) ; pfx := fmt.Sprint(rr["prefix"]) ; if sname != "" && pfx != "" { prefixMap[sname] = pfx }
                            }
                        }
                    }
                    if strings.TrimSpace(r0.McpServers) == "" { continue }
                    var servers []map[string]any
                    if json.Unmarshal([]byte(r0.McpServers), &servers) != nil { continue }
                    for _, smm := range servers {
                        if strings.ToLower(fmt.Sprint(smm["type"])) != "stdio" { continue }
                        sname := fmt.Sprint(smm["name"]) ; if sname != name { continue }
                        cmd := fmt.Sprint(smm["command"]) ; var args []string
                        if av, ok := smm["args"].([]any); ok { for _, a := range av { args = append(args, fmt.Sprint(a)) } }
                        env := map[string]string{} ; if ev, ok := smm["env"].(map[string]any); ok { for k, v := range ev { env[k] = fmt.Sprint(v) } }
                        spec := MCPServerSpec{ Name: sname, Type: "stdio", Command: cmd, Args: args, Env: env, Prefix: prefixMap[sname], Policy: fmt.Sprint(smm["policy"]) }
                        rtMap[name] = &MCPRuntime{ Spec: spec }
                        break
                    }
                }
            }
            if _, ok2 := rtMap[name]; !ok2 { c.JSON(404, gin.H{"error":"server not configured"}); return }
        }
        if err := startRuntime(name); err != nil { c.JSON(500, gin.H{"error": err.Error()}); return }
        // auto register
        // determine prefix from spec or default
        prefix := rtMap[name].Spec.Prefix
        if prefix == "" { prefix = "/" + name }
        inst := MCPInstance{ Tenant: "default", Name: name, ServerName: name, Transport: "stdio", Endpoint: "http://127.0.0.1:9050/servers/"+name, Prefix: prefix, Status: "running", LastHeartbeat: time.Now() }
        var exist MCPInstance
        if err := db.Where("tenant = ? AND name = ?", "default", name).First(&exist).Error; err == nil { inst.ID = exist.ID }
        _ = db.Save(&inst).Error
        // Mirror to Unla registry if available
        if base := getenv("UNLA_APISERVER_BASE", ""); strings.TrimSpace(base) != "" {
            payload := map[string]any{
                "tenant":"default","name": name, "server_name": name,
                "transport":"stdio","endpoint": inst.Endpoint, "prefix": prefix, "status":"running",
            }
            b, _ := json.Marshal(payload)
            req, _ := http.NewRequestWithContext(c.Request.Context(), http.MethodPost, strings.TrimRight(base, "/")+"/api/mcp/registry/register", bytes.NewReader(b))
            req.Header.Set("Content-Type","application/json")
            req.Header.Set("X-Internal-Request","1")
            http.DefaultClient.Do(req)
        }
        c.JSON(200, gin.H{"ok": true})
    })
    r.POST("/mcp/servers/:name/stop", func(c *gin.Context) {
        name := c.Param("name")
        if _, ok := rtMap[name]; !ok { c.JSON(404, gin.H{"error":"server not configured"}); return }
        if err := stopRuntime(name); err != nil { c.JSON(500, gin.H{"error": err.Error()}); return }
        _ = db.Model(&MCPInstance{}).Where("tenant=? AND name=?", "default", name).Updates(map[string]any{"status":"stopped","last_heartbeat": time.Now(), "updated_at": time.Now()}).Error
        if base := getenv("UNLA_APISERVER_BASE", ""); strings.TrimSpace(base) != "" {
            payload := map[string]any{"tenant":"default","name": name, "status":"stopped"}
            b, _ := json.Marshal(payload)
            req, _ := http.NewRequestWithContext(c.Request.Context(), http.MethodPost, strings.TrimRight(base, "/")+"/api/mcp/registry/heartbeat", bytes.NewReader(b))
            req.Header.Set("Content-Type","application/json")
            req.Header.Set("X-Internal-Request","1")
            http.DefaultClient.Do(req)
        }
        c.JSON(200, gin.H{"ok": true})
    })

    // Fallback routes: allow start/stop via query/body when path param form is not reachable
    r.POST("/mcp/servers/start", func(c *gin.Context) {
        name := strings.TrimSpace(c.Query("name"))
        if name == "" {
            var body struct{ Name string `json:"name"` }
            _ = c.BindJSON(&body)
            name = strings.TrimSpace(body.Name)
        }
        if name == "" { c.JSON(400, gin.H{"error":"name required"}); return }
        c.Params = append(c.Params, gin.Param{Key: "name", Value: name})
        c.Request.URL.Path = "/mcp/servers/" + url.PathEscape(name) + "/start"
        r.HandleContext(c)
    })
    r.POST("/mcp/servers/stop", func(c *gin.Context) {
        name := strings.TrimSpace(c.Query("name"))
        if name == "" {
            var body struct{ Name string `json:"name"` }
            _ = c.BindJSON(&body)
            name = strings.TrimSpace(body.Name)
        }
        if name == "" { c.JSON(400, gin.H{"error":"name required"}); return }
        c.Params = append(c.Params, gin.Param{Key: "name", Value: name})
        c.Request.URL.Path = "/mcp/servers/" + url.PathEscape(name) + "/stop"
        r.HandleContext(c)
    })

    // Admin sync: import Unla embedding models into gateway tables
    r.POST("/admin/sync-from-unla", func(c *gin.Context) {
        type UnlaRow struct {
            Provider      string
            ModelID       string
            DisplayName   string
            BaseURL       string
            APIKeyEnc     string
            Dimension     int
            ContextWindow int
            Status        string
        }
        // Detect possible table prefix
        prefix := getenv("UNLA_DB_TABLE_PREFIX", "unla_")
        table := prefix + "embedding_models"
        // Pull all rows
        var rows []UnlaRow
        tx := db.Raw("SELECT provider, model_id, display_name, base_url, api_key_enc, dimension, context_window, status FROM " + table + " ORDER BY id ASC").Scan(&rows)
        if tx.Error != nil {
            c.JSON(500, gin.H{"error": tx.Error.Error()})
            return
        }
        // Map provider name -> id
        var providers []LLMProvider
        db.Find(&providers)
        pidMap := map[string]uint{}
        for _, p := range providers { pidMap[p.Name] = p.ID }

        createdProv := 0
        createdMods := 0
        for _, rrow := range rows {
            // Ensure provider exists
            pid, ok := pidMap[rrow.Provider]
            if !ok {
                p := LLMProvider{
                    Name:    rrow.Provider,
                    Type:    guessProviderType(rrow.Provider),
                    BaseURL: rrow.BaseURL,
                    APIKeyEnc: rrow.APIKeyEnc,
                    Status:  "active",
                }
                if err := db.Create(&p).Error; err != nil {
                    c.JSON(500, gin.H{"error": err.Error(), "provider": rrow.Provider})
                    return
                }
                pid = p.ID
                pidMap[rrow.Provider] = pid
                createdProv++
            }
            // Upsert model
            var exist LLMModel
            if err := db.Where("provider_id = ? AND model_id = ?", pid, rrow.ModelID).First(&exist).Error; err == nil {
                // Update minimal fields
                exist.DisplayName = rrow.DisplayName
                exist.ModelType = "embedding"
                if rrow.Status != "" { exist.Status = rrow.Status } else { exist.Status = "inactive" }
                exist.ContextLength = rrow.ContextWindow
                if uerr := db.Save(&exist).Error; uerr != nil { c.JSON(500, gin.H{"error": uerr.Error()}); return }
            } else {
                m := LLMModel{
                    ProviderID:    pid,
                    ModelID:       rrow.ModelID,
                    DisplayName:   rrow.DisplayName,
                    ModelType:     "embedding",
                    Status:        ternary(rrow.Status != "", rrow.Status, "inactive"),
                    ContextLength: rrow.ContextWindow,
                }
                if ierr := db.Create(&m).Error; ierr != nil { c.JSON(500, gin.H{"error": ierr.Error()}); return }
                createdMods++
            }
        }
        // Sync default embedding
        dtable := prefix + "embedding_defaults"
        var defRow struct { DefaultEmbedding string }
        if err := db.Raw("SELECT default_embedding FROM "+dtable+" WHERE id=1").Scan(&defRow).Error; err == nil {
            if defRow.DefaultEmbedding != "" {
                var d LLMDefaults
                if err := db.First(&d, 1).Error; err != nil {
                    d = LLMDefaults{ID: 1, DefaultEmbedding: defRow.DefaultEmbedding, UpdatedAt: time.Now()}
                    _ = db.Create(&d).Error
                } else {
                    d.DefaultEmbedding = defRow.DefaultEmbedding
                    d.UpdatedAt = time.Now()
                    _ = db.Save(&d).Error
                }
            }
        }
        c.JSON(200, gin.H{"ok": true, "created_providers": createdProv, "created_models": createdMods, "total_rows": len(rows) })
    })

    // Sync MCP configs from Unla and populate shared runtime specs (stdio only)
    r.POST("/admin/sync-mcp-from-unla", func(c *gin.Context) {
        // Optional JSON body: { base?: string, token?: string }
        var body map[string]any
        _ = c.BindJSON(&body)
        base := getenv("UNLA_APISERVER_BASE", "http://127.0.0.1:5234")
        if v, ok := body["base"].(string); ok && strings.TrimSpace(v) != "" { base = v }
        token := os.Getenv("UNLA_API_TOKEN")
        if v := c.GetHeader("Authorization"); strings.HasPrefix(v, "Bearer ") { token = strings.TrimPrefix(v, "Bearer ") }
        if v, ok := body["token"].(string); ok && strings.TrimSpace(v) != "" { token = v }
        // Try internal trusted endpoint first (no auth required if Unla trusts local)
        url1 := strings.TrimRight(base, "/") + "/api/internal/mcp/configs"
        req1, _ := http.NewRequestWithContext(c.Request.Context(), http.MethodGet, url1, nil)
        req1.Header.Set("X-Internal-Request", "1")
        resp, err := http.DefaultClient.Do(req1)
        if err == nil && resp.StatusCode == 200 {
            // continue
        } else {
            if resp != nil { resp.Body.Close() }
            // Fallback to protected endpoint with token
            url2 := strings.TrimRight(base, "/") + "/api/mcp/configs"
            req2, _ := http.NewRequestWithContext(c.Request.Context(), http.MethodGet, url2, nil)
            if strings.TrimSpace(token) != "" { req2.Header.Set("Authorization", "Bearer "+token) }
            resp, err = http.DefaultClient.Do(req2)
            if err != nil { c.JSON(502, gin.H{"error": err.Error()}); return }
        }
        if err != nil { c.JSON(502, gin.H{"error": err.Error()}); return }
        defer resp.Body.Close()
        if resp.StatusCode != 200 {
            b, _ := io.ReadAll(resp.Body)
            c.JSON(resp.StatusCode, gin.H{"error": "unla_error", "status": resp.StatusCode, "body": string(b)})
            return
        }
        var raw any
        if derr := json.NewDecoder(resp.Body).Decode(&raw); derr != nil { c.JSON(500, gin.H{"error": derr.Error()}); return }
        // try to locate configs array under data or root
        var cfgs []any
        if m, ok := raw.(map[string]any); ok {
            if v, ok := m["data"].([]any); ok { cfgs = v } else if v2, ok2 := m["data"].(map[string]any); ok2 {
                // maybe {data:{list:[...]}}
                if l, ok := v2["list"].([]any); ok { cfgs = l }
            } else if l, ok := m["configs"].([]any); ok { cfgs = l }
        } else if arr, ok := raw.([]any); ok { cfgs = arr }
        if len(cfgs) == 0 { c.JSON(200, gin.H{"synced": 0}); return }
        count := 0
        for _, item := range cfgs {
            mm, ok := item.(map[string]any); if !ok { continue }
            // routers: find server->prefix mapping
            serverToPrefix := map[string]string{}
            if rs, ok := mm["routers"].([]any); ok {
                for _, r0 := range rs {
                    if rmm, ok := r0.(map[string]any); ok {
                        sname, _ := rmm["server"].(string)
                        pfx, _ := rmm["prefix"].(string)
                        if sname != "" && pfx != "" { serverToPrefix[sname] = pfx }
                    }
                }
            }
            // mcpServers: stdio only
            var servers []any
            if ms, ok := mm["mcpServers"].([]any); ok { servers = ms }
            if len(servers) == 0 { continue }
            for _, s0 := range servers {
                smm, ok := s0.(map[string]any); if !ok { continue }
                typ := strings.ToLower(fmt.Sprint(smm["type"]))
                name := fmt.Sprint(smm["name"])
                if name == "" { continue }
                if typ != "stdio" { continue }
                cmd := fmt.Sprint(smm["command"])
                // args may be []any or []string
                var args []string
                if av, ok := smm["args"].([]any); ok {
                    for _, a := range av { args = append(args, fmt.Sprint(a)) }
                } else if sv, ok := smm["args"].([]string); ok {
                    args = append(args, sv...)
                }
                env := map[string]string{}
                if ev, ok := smm["env"].(map[string]any); ok {
                    for k, v := range ev { env[k] = fmt.Sprint(v) }
                }
                spec := MCPServerSpec{ Name: name, Type: typ, Command: cmd, Args: args, Env: env, Prefix: serverToPrefix[name], Policy: fmt.Sprint(smm["policy"]) }
                rtMap[name] = &MCPRuntime{ Spec: spec }
                // upsert to registry with stopped status
                inst := MCPInstance{ Tenant: "default", Name: name, ServerName: name, Transport: "stdio", Endpoint: "http://127.0.0.1:9050/servers/"+name, Prefix: spec.Prefix, Status: "stopped", LastHeartbeat: time.Now() }
                var exist MCPInstance
                if err := db.Where("tenant = ? AND name = ?", "default", name).First(&exist).Error; err == nil { inst.ID = exist.ID }
                _ = db.Save(&inst).Error
                count++
            }
        }
        c.JSON(200, gin.H{"ok": true, "synced": count})
    })

    // Alternative: Sync MCP from Unla DB directly (no HTTP auth needed)
    r.POST("/admin/sync-mcp-from-unla-db", func(c *gin.Context) {
        var body struct{
            Prefix string `json:"prefix"` // table prefix, default: unla_
        }
        _ = c.BindJSON(&body)
        prefix := body.Prefix
        if strings.TrimSpace(prefix) == "" { prefix = getenv("UNLA_DB_TABLE_PREFIX", "unla_") }
        // GORM default naming splits capitals: MCPConfig -> m_c_p_configs
        tbl := prefix + "mcp_configs"
        type row struct{
            Name string
            Tenant string
            Routers string
            McpServers string
        }
        var rows []row
        q := fmt.Sprintf("SELECT name, tenant, routers, mcp_servers FROM %s WHERE deleted_at IS NULL", tbl)
        if err := db.Raw(q).Scan(&rows).Error; err != nil {
            c.JSON(500, gin.H{"error": err.Error()}); return
        }
        count := 0
        for _, r0 := range rows {
            // parse routers
            serverToPrefix := map[string]string{}
            if strings.TrimSpace(r0.Routers) != "" {
                var rs []map[string]any
                if json.Unmarshal([]byte(r0.Routers), &rs) == nil {
                    for _, rr := range rs {
                        sname := fmt.Sprint(rr["server"]) ; pfx := fmt.Sprint(rr["prefix"]) ; if sname != "" && pfx != "" { serverToPrefix[sname] = pfx }
                    }
                }
            }
            // parse mcpServers
            if strings.TrimSpace(r0.McpServers) == "" { continue }
            var servers []map[string]any
            if err := json.Unmarshal([]byte(r0.McpServers), &servers); err != nil { continue }
            for _, smm := range servers {
                typ := strings.ToLower(fmt.Sprint(smm["type"]))
                name := fmt.Sprint(smm["name"]) ; if name == "" { continue }
                if typ != "stdio" { continue }
                cmd := fmt.Sprint(smm["command"]) ; var args []string
                if av, ok := smm["args"].([]any); ok { for _, a := range av { args = append(args, fmt.Sprint(a)) } }
                env := map[string]string{} ; if ev, ok := smm["env"].(map[string]any); ok { for k, v := range ev { env[k] = fmt.Sprint(v) } }
                spec := MCPServerSpec{ Name: name, Type: typ, Command: cmd, Args: args, Env: env, Prefix: serverToPrefix[name], Policy: fmt.Sprint(smm["policy"]) }
                rtMap[name] = &MCPRuntime{ Spec: spec }
                // registry upsert as stopped
                inst := MCPInstance{ Tenant: "default", Name: name, ServerName: name, Transport: "stdio", Endpoint: "http://127.0.0.1:9050/servers/"+name, Prefix: spec.Prefix, Status: "stopped", LastHeartbeat: time.Now() }
                var exist MCPInstance
                if err := db.Where("tenant = ? AND name = ?", "default", name).First(&exist).Error; err == nil { inst.ID = exist.ID }
                _ = db.Save(&inst).Error
                count++
            }
        }
        c.JSON(200, gin.H{"ok": true, "synced": count})
    })

    // Sync API tools from Unla DB directly (parse tools json)
    r.POST("/admin/sync-api-from-unla-db", func(c *gin.Context) {
        var body struct{ Prefix string `json:"prefix"` }
        _ = c.BindJSON(&body)
        prefix := body.Prefix
        if strings.TrimSpace(prefix) == "" { prefix = getenv("UNLA_DB_TABLE_PREFIX", "unla_") }
        table := prefix + "mcp_configs"
        type row struct{ Name string; Tenant string; Tools string; Servers string; Routers string }
        var rows []row
        if err := db.Raw("SELECT name, tenant, tools, servers, routers FROM "+table+" WHERE deleted_at IS NULL").Scan(&rows).Error; err != nil {
            c.JSON(500, gin.H{"error": err.Error()}); return
        }
        synced := 0
        for _, r0 := range rows {
            if strings.TrimSpace(r0.Tools) == "" { continue }
            var ts []map[string]any
            if err := json.Unmarshal([]byte(r0.Tools), &ts); err != nil { continue }
            list := make([]APITool, 0, len(ts))
            for _, t := range ts {
                at := APITool{
                    Name:       fmt.Sprint(t["name"]),
                    Description: fmt.Sprint(t["description"]),
                    Method:     strings.ToUpper(fmt.Sprint(t["method"])) ,
                    Endpoint:   fmt.Sprint(t["endpoint"]),
                }
                if hv, ok := t["headers"].(map[string]any); ok {
                    at.Headers = map[string]string{}
                    for k, v := range hv { at.Headers[k] = fmt.Sprint(v) }
                }
                if ho, ok := t["headersOrder"].([]any); ok { for _, e := range ho { at.HeadersOrder = append(at.HeadersOrder, fmt.Sprint(e)) } }
                if at.Name != "" && at.Method != "" && at.Endpoint != "" { list = append(list, at) }
                // 持久化到 catalog
                _ = db.Transaction(func(tx *gorm.DB) error {
                    var rec APIToolCatalog
                    if e := tx.Where("config_name = ? AND name = ?", r0.Name, at.Name).First(&rec).Error; e != nil { /* ignore */ }
                    rec.ConfigName = r0.Name
                    rec.Name = at.Name
                    rec.Method = at.Method
                    rec.Endpoint = at.Endpoint
                    if len(at.Headers) > 0 {
                        b, _ := json.Marshal(at.Headers)
                        rec.Headers = string(b)
                    }
                    rec.UpdatedAt = time.Now()
                    if rec.ID == 0 { rec.CreatedAt = time.Now() }
                    return tx.Save(&rec).Error
                })
            }
            if len(list) > 0 { apiToolsCache[r0.Name] = list; synced++ }

            // parse servers meta
            meta := APIToolsConfigMeta{}
            if strings.TrimSpace(r0.Servers) != "" {
                var sv []map[string]any
                if err := json.Unmarshal([]byte(r0.Servers), &sv); err == nil {
                    for _, s := range sv {
                        sm := APIServerMeta{Name: fmt.Sprint(s["name"]) }
                        if sm.Name == "" { continue }
                        // baseUrl could be under baseUrl/baseURL/url; ignore <nil>/null
                        if v := strings.TrimSpace(fmt.Sprint(s["baseUrl"])); v != "" && v != "<nil>" && !strings.EqualFold(v, "null") { sm.BaseURL = v } else if v2 := strings.TrimSpace(fmt.Sprint(s["baseURL"])); v2 != "" && v2 != "<nil>" && !strings.EqualFold(v2, "null") { sm.BaseURL = v2 } else if v3 := strings.TrimSpace(fmt.Sprint(s["url"])); v3 != "" && v3 != "<nil>" && !strings.EqualFold(v3, "null") { sm.BaseURL = v3 }
                        // allowed tools
                        if at, ok := s["allowedTools"].([]any); ok {
                            for _, x := range at { sm.AllowedAPIs = append(sm.AllowedAPIs, fmt.Sprint(x)) }
                        } else if aa, ok := s["allowedAPIs"].([]any); ok {
                            for _, x := range aa { sm.AllowedAPIs = append(sm.AllowedAPIs, fmt.Sprint(x)) }
                        }
                        meta.Servers = append(meta.Servers, sm)
                    }
                }
            }
            // parse routers meta
            if strings.TrimSpace(r0.Routers) != "" {
                var rs []map[string]any
                if err := json.Unmarshal([]byte(r0.Routers), &rs); err == nil {
                    for _, r := range rs {
                        rm := APIRouterMeta{ Prefix: fmt.Sprint(r["prefix"]), Server: fmt.Sprint(r["server"]) }
                        if rm.Prefix != "" && rm.Server != "" { meta.Routers = append(meta.Routers, rm) }
                    }
                }
            }
            apiToolsMeta[r0.Name] = meta
        }
        c.JSON(200, gin.H{"ok": true, "synced": synced})
    })

    // API-Tools discovery
    r.GET("/api-tools/configs", func(c *gin.Context) {
        // lazy meta fill from Unla if missing
        ensureMetaFromUnla := func() {
            base := getenv("UNLA_APISERVER_BASE", "http://127.0.0.1:5234")
            url1 := strings.TrimRight(base, "/") + "/api/internal/mcp/configs"
            req1, _ := http.NewRequestWithContext(c.Request.Context(), http.MethodGet, url1, nil)
            req1.Header.Set("X-Internal-Request", "1")
            resp, err := http.DefaultClient.Do(req1)
            if err != nil { return }
            defer resp.Body.Close()
            if resp.StatusCode != 200 { return }
            var raw any
            if err := json.NewDecoder(resp.Body).Decode(&raw); err != nil { return }
            var cfgs []map[string]any
            if arr, ok := raw.([]any); ok {
                for _, it := range arr { if mm, ok := it.(map[string]any); ok { cfgs = append(cfgs, mm) } }
            } else if m, ok := raw.(map[string]any); ok {
                if arr2, ok2 := m["data"].([]any); ok2 { for _, it := range arr2 { if mm, ok := it.(map[string]any); ok { cfgs = append(cfgs, mm) } } }
            }
            for _, mm := range cfgs {
                name := fmt.Sprint(mm["name"])
                if strings.TrimSpace(name) == "" { continue }
                // servers
                meta := apiToolsMeta[name]
                if len(meta.Servers) == 0 {
                    if sv, ok := mm["servers"].([]any); ok {
                        for _, s := range sv {
                            if sm, ok := s.(map[string]any); ok {
                                smeta := APIServerMeta{Name: fmt.Sprint(sm["name"]) }
                                if v := strings.TrimSpace(fmt.Sprint(sm["baseUrl"])); v != "" && v != "<nil>" && !strings.EqualFold(v, "null") { smeta.BaseURL = v } else if v2 := strings.TrimSpace(fmt.Sprint(sm["baseURL"])); v2 != "" && v2 != "<nil>" && !strings.EqualFold(v2, "null") { smeta.BaseURL = v2 } else if v3 := strings.TrimSpace(fmt.Sprint(sm["url"])); v3 != "" && v3 != "<nil>" && !strings.EqualFold(v3, "null") { smeta.BaseURL = v3 }
                                if at, ok := sm["allowedTools"].([]any); ok { for _, x := range at { smeta.AllowedAPIs = append(smeta.AllowedAPIs, fmt.Sprint(x)) } }
                                if smeta.Name != "" { meta.Servers = append(meta.Servers, smeta) }
                            }
                        }
                    }
                }
                // routers
                if len(meta.Routers) == 0 {
                    if rs, ok := mm["routers"].([]any); ok {
                        for _, r0 := range rs {
                            if rm, ok := r0.(map[string]any); ok {
                                p := fmt.Sprint(rm["prefix"])
                                s := fmt.Sprint(rm["server"])
                                if p != "" && s != "" { meta.Routers = append(meta.Routers, APIRouterMeta{Prefix: p, Server: s}) }
                            }
                        }
                    }
                }
                apiToolsMeta[name] = meta
            }
        }
        // if any config lacks meta, try fill once via Unla HTTP
        need := false
        for k := range apiToolsCache { if len(apiToolsMeta[k].Servers) == 0 && len(apiToolsMeta[k].Routers) == 0 { need = true; break } }
        if need { ensureMetaFromUnla() }

        out := make([]gin.H, 0, len(apiToolsCache))
        for k, v := range apiToolsCache {
            meta := apiToolsMeta[k]
            // DB fallback: if still empty, read current row from DB
            if len(meta.Servers) == 0 && len(meta.Routers) == 0 {
                table := getenv("UNLA_DB_TABLE_PREFIX", "unla_") + "mcp_configs"
                if row, err := loadUnlaConfigRow(db, table, "", k); err == nil {
                    if strings.TrimSpace(row.Servers) != "" {
                        var sv []map[string]any
                        if err := json.Unmarshal([]byte(row.Servers), &sv); err == nil {
                            for _, s := range sv {
                                sm := APIServerMeta{Name: fmt.Sprint(s["name"]) }
                                if v := fmt.Sprint(s["baseUrl"]); v != "" { sm.BaseURL = v } else if v2 := fmt.Sprint(s["baseURL"]); v2 != "" { sm.BaseURL = v2 } else if v3 := fmt.Sprint(s["url"]); v3 != "" { sm.BaseURL = v3 }
                                if at, ok := s["allowedTools"].([]any); ok { for _, x := range at { sm.AllowedAPIs = append(sm.AllowedAPIs, fmt.Sprint(x)) } }
                                if sm.Name != "" { meta.Servers = append(meta.Servers, sm) }
                            }
                        }
                    }
                    if strings.TrimSpace(row.Routers) != "" {
                        var rs []map[string]any
                        if err := json.Unmarshal([]byte(row.Routers), &rs); err == nil {
                            for _, r0 := range rs {
                                p := fmt.Sprint(r0["prefix"])
                                s := fmt.Sprint(r0["server"])
                                if p != "" && s != "" { meta.Routers = append(meta.Routers, APIRouterMeta{Prefix: p, Server: s}) }
                            }
                        }
                    }
                    apiToolsMeta[k] = meta
                }
            }
            // compute per-server allowed count
            servers := make([]gin.H, 0, len(meta.Servers))
            for _, s := range meta.Servers {
                allowed := 0
                if len(s.AllowedAPIs) > 0 {
                    set := map[string]struct{}{}
                    for _, a := range s.AllowedAPIs { set[a] = struct{}{} }
                    for _, t := range v { if _, ok := set[t.Name]; ok { allowed++ } }
                }
                servers = append(servers, gin.H{"name": s.Name, "base_url": s.BaseURL, "allowed": allowed})
            }
            routers := make([]gin.H, 0, len(meta.Routers))
            for _, r0 := range meta.Routers { routers = append(routers, gin.H{"prefix": r0.Prefix, "server": r0.Server}) }
            out = append(out, gin.H{"name": k, "tools": len(v), "servers": servers, "routers": routers})
        }
        c.JSON(200, out)
    })

    // Allow/Disallow APIs on a server under a config
    // Body: { server: string, tools: [string], action: "add"|"remove", tenant?: string }
    r.POST("/api-tools/configs/:name/allow", func(c *gin.Context) {
        cfgName := c.Param("name")
        var req struct{
            Server string   `json:"server"`
            Tools  []string `json:"tools"`
            Action string   `json:"action"`
            Tenant string   `json:"tenant"`
        }
        if err := c.BindJSON(&req); err != nil { c.JSON(400, gin.H{"error": err.Error()}); return }
        if req.Server == "" || len(req.Tools) == 0 { c.JSON(400, gin.H{"error":"server and tools required"}); return }
        action := strings.ToLower(strings.TrimSpace(req.Action))
        if action == "" { action = "add" }
        table := getenv("UNLA_DB_TABLE_PREFIX", "unla_") + "mcp_configs"
        row, err := loadUnlaConfigRow(db, table, req.Tenant, cfgName)
        if err != nil { c.JSON(404, gin.H{"error": err.Error()}); return }
        // parse servers
        var servers []map[string]any
        _ = json.Unmarshal([]byte(row.Servers), &servers)
        found := false
        for _, s := range servers {
            if fmt.Sprint(s["name"]) == req.Server {
                found = true
                // allowedTools is []string or []any
                var list []string
                if at, ok := s["allowedTools"].([]any); ok {
                    for _, x := range at { list = append(list, fmt.Sprint(x)) }
                } else if ats, ok := s["allowedTools"].([]string); ok {
                    list = append(list, ats...)
                }
                set := map[string]struct{}{}
                for _, v := range list { set[v] = struct{}{} }
                switch action {
                case "add":
                    for _, t := range req.Tools { if _, ok := set[t]; !ok { list = append(list, t); set[t] = struct{}{} } }
                case "remove":
                    filtered := make([]string, 0, len(list))
                    rm := map[string]struct{}{}
                    for _, t := range req.Tools { rm[t] = struct{}{} }
                    for _, v := range list { if _, drop := rm[v]; !drop { filtered = append(filtered, v) } }
                    list = filtered
                default:
                }
                s["allowedTools"] = list
                break
            }
        }
        if !found { c.JSON(404, gin.H{"error":"server not found in config"}); return }
        b, _ := json.Marshal(servers)
        if err := saveUnlaConfigServers(db, table, row.ID, string(b)); err != nil { c.JSON(500, gin.H{"error": err.Error()}); return }
        // update meta cache
        meta := apiToolsMeta[cfgName]
        updated := false
        for i := range meta.Servers { if meta.Servers[i].Name == req.Server { meta.Servers[i].AllowedAPIs = nil; meta.Servers[i].AllowedAPIs = append(meta.Servers[i].AllowedAPIs, req.Tools...); updated = true; break } }
        if !updated { meta.Servers = append(meta.Servers, APIServerMeta{Name: req.Server, AllowedAPIs: append([]string{}, req.Tools...)}) }
        apiToolsMeta[cfgName] = meta
        c.JSON(200, gin.H{"ok": true})
    })

    // Routers management: add/remove router for a server
    // Body: { action: "add"|"remove", prefix: string, server: string, tenant?: string }
    r.POST("/api-tools/configs/:name/routers", func(c *gin.Context) {
        cfgName := c.Param("name")
        var req struct{
            Action string `json:"action"`
            Prefix string `json:"prefix"`
            Server string `json:"server"`
            Tenant string `json:"tenant"`
        }
        if err := c.BindJSON(&req); err != nil { c.JSON(400, gin.H{"error": err.Error()}); return }
        if req.Prefix == "" || req.Server == "" { c.JSON(400, gin.H{"error":"prefix and server required"}); return }
        action := strings.ToLower(strings.TrimSpace(req.Action))
        if action == "" { action = "add" }
        table := getenv("UNLA_DB_TABLE_PREFIX", "unla_") + "mcp_configs"
        row, err := loadUnlaConfigRow(db, table, req.Tenant, cfgName)
        if err != nil { c.JSON(404, gin.H{"error": err.Error()}); return }
        var routers []map[string]any
        _ = json.Unmarshal([]byte(row.Routers), &routers)
        switch action {
        case "add":
            // check exist
            exist := false
            for _, r0 := range routers { if fmt.Sprint(r0["prefix"]) == req.Prefix && fmt.Sprint(r0["server"]) == req.Server { exist = true; break } }
            if !exist { routers = append(routers, map[string]any{"prefix": req.Prefix, "server": req.Server}) }
        case "remove":
            filtered := make([]map[string]any, 0, len(routers))
            for _, r0 := range routers { if !(fmt.Sprint(r0["prefix"]) == req.Prefix && fmt.Sprint(r0["server"]) == req.Server) { filtered = append(filtered, r0) } }
            routers = filtered
        }
        b, _ := json.Marshal(routers)
        if err := saveUnlaConfigRouters(db, table, row.ID, string(b)); err != nil { c.JSON(500, gin.H{"error": err.Error()}); return }
        // update meta cache
        meta := apiToolsMeta[cfgName]
        if action == "add" {
            meta.Routers = append(meta.Routers, APIRouterMeta{Prefix: req.Prefix, Server: req.Server})
        } else {
            nr := make([]APIRouterMeta, 0, len(meta.Routers))
            for _, r0 := range meta.Routers { if !(r0.Prefix == req.Prefix && r0.Server == req.Server) { nr = append(nr, r0) } }
            meta.Routers = nr
        }
        apiToolsMeta[cfgName] = meta
        c.JSON(200, gin.H{"ok": true})
    })
    r.GET("/api-tools/configs/:name/tools", func(c *gin.Context) {
        name := c.Param("name")
        list, ok := apiToolsCache[name]
        if !ok { c.JSON(404, gin.H{"error":"config not found"}); return }
        c.JSON(200, list)
    })
    // Call API tool via 9050 proxy
    r.POST("/api-tools/configs/:name/tools/:tool/call", func(c *gin.Context) {
        cfgName := c.Param("name")
        toolName := c.Param("tool")
        list, ok := apiToolsCache[cfgName]
        if !ok { c.JSON(404, gin.H{"error":"config not found"}); return }
        var def *APITool
        for i := range list { if list[i].Name == toolName { def = &list[i]; break } }
        if def == nil { c.JSON(404, gin.H{"error":"tool not found"}); return }

        var body map[string]any
        _ = c.BindJSON(&body)
        // args.path / args.query / args.headers / args.body
        var (
            pathVars map[string]any
            queryVars map[string]any
            headerVars map[string]any
            payload any
        )
        if a, ok := body["args"].(map[string]any); ok {
            if pv, ok := a["path"].(map[string]any); ok { pathVars = pv }
            if qv, ok := a["query"].(map[string]any); ok { queryVars = qv }
            if hv, ok := a["headers"].(map[string]any); ok { headerVars = hv }
            if bv, ok := a["body"]; ok { payload = bv }
        } else {
            payload = body
        }

        // Build URL with path replacement (support :var and {var})
        urlStr := def.Endpoint
        for k, v := range pathVars { urlStr = strings.ReplaceAll(urlStr, ":"+k, fmt.Sprint(v)); urlStr = strings.ReplaceAll(urlStr, "{"+k+"}", fmt.Sprint(v)) }
        // Append query
        if len(queryVars) > 0 {
            q := url.Values{}
            for k, v := range queryVars { q.Set(k, fmt.Sprint(v)) }
            if strings.Contains(urlStr, "?") { urlStr += "&" + q.Encode() } else { urlStr += "?" + q.Encode() }
        }

        // Prepare request
        method := strings.ToUpper(def.Method)
        if method == "" { method = http.MethodGet }
        var reqBody io.Reader
        if payload != nil && (method == http.MethodPost || method == http.MethodPut || method == http.MethodPatch) {
            b, _ := json.Marshal(payload)
            reqBody = bytes.NewReader(b)
        }
        req, err := http.NewRequestWithContext(c.Request.Context(), method, urlStr, reqBody)
        if err != nil { c.JSON(500, gin.H{"error": err.Error()}); return }
        // Headers: base + call-time overrides (order-friendly)
        for k, v := range def.Headers { req.Header.Set(k, v) }
        for k, v := range headerVars { req.Header.Set(k, fmt.Sprint(v)) }
        if reqBody != nil && req.Header.Get("Content-Type") == "" { req.Header.Set("Content-Type", "application/json") }

        client := &http.Client{ Timeout: 30 * time.Second }
        resp, err := client.Do(req)
        if err != nil { c.JSON(502, gin.H{"error": err.Error()}); return }
        defer resp.Body.Close()
        // Proxy response
        for k, vals := range resp.Header { if len(vals) > 0 && (k == "Content-Type" || strings.HasPrefix(strings.ToLower(k), "x-")) { c.Header(k, vals[0]) } }
        c.Status(resp.StatusCode)
        _, _ = io.Copy(c.Writer, resp.Body)
    })
    // Import chat config from Unla Web (browser-side config)
    // Payload example:
    // { providers: [ { name:"siliconcloud", type:"openai", base_url:"...", api_key:"...", models:[{ id:"Qwen/...", enabled:true }] } ], default_model: "..." }
    r.POST("/admin/import-chat-config", func(c *gin.Context) {
        var req struct {
            Providers []struct {
                Name    string `json:"name"`
                Type    string `json:"type"`
                BaseURL string `json:"base_url"`
                APIKey  string `json:"api_key"`
                Models  []struct{
                    ID      string `json:"id"`
                    Enabled bool   `json:"enabled"`
                } `json:"models"`
            } `json:"providers"`
            DefaultModel string `json:"default_model"`
        }
        if err := c.BindJSON(&req); err != nil { c.JSON(400, gin.H{"error": err.Error()}); return }
        createdProv := 0
        createdMods := 0
        for _, p := range req.Providers {
            // upsert provider by name or type
            var prov LLMProvider
            q := db.Where("LOWER(name)=? OR LOWER(type)=?", strings.ToLower(p.Name), strings.ToLower(p.Type)).First(&prov)
            if q.Error != nil {
                prov = LLMProvider{Name: p.Name, Type: p.Type, BaseURL: p.BaseURL, APIKeyEnc: p.APIKey, Status: "active"}
                if err := db.Create(&prov).Error; err != nil { c.JSON(500, gin.H{"error": err.Error()}); return }
                createdProv++
            } else {
                // update basic fields
                prov.BaseURL = ternary(p.BaseURL != "", p.BaseURL, prov.BaseURL)
                if p.APIKey != "" { prov.APIKeyEnc = p.APIKey }
                if prov.Status == "" { prov.Status = "active" }
                _ = db.Save(&prov).Error
            }
            // upsert models under this provider
            for _, m := range p.Models {
                if strings.TrimSpace(m.ID) == "" { continue }
                var row LLMModel
                if err := db.Where("provider_id = ? AND model_id = ?", prov.ID, m.ID).First(&row).Error; err != nil {
                    row = LLMModel{ProviderID: prov.ID, ModelID: m.ID, DisplayName: m.ID, ModelType: "chat", Status: ternary(m.Enabled, "active", "inactive")}
                    if e := db.Create(&row).Error; e != nil { c.JSON(500, gin.H{"error": e.Error()}); return }
                    createdMods++
                } else {
                    row.Status = ternary(m.Enabled, "active", "inactive")
                    _ = db.Save(&row).Error
                }
            }
        }
        // default model if provided
        if strings.TrimSpace(req.DefaultModel) != "" {
            var d LLMDefaults
            _ = db.First(&d, 1).Error
            d.DefaultModel = req.DefaultModel
            d.UpdatedAt = time.Now()
            if d.ID == 0 { d.ID = 1; _ = db.Create(&d).Error } else { _ = db.Save(&d).Error }
        }
        c.JSON(200, gin.H{"ok": true, "created_providers": createdProv, "created_models": createdMods})
    })

    // Config snapshot
    r.GET("/v1/config", func(c *gin.Context) {
        var prov []LLMProvider
        var mods []LLMModel
        var als []LLMAlias
        var defs LLMDefaults
        db.Find(&prov)
        db.Find(&mods)
        db.Find(&als)
        _ = db.First(&defs, 1).Error
        snap := ConfigSnapshot{Providers: prov, Models: mods, Aliases: als}
        if defs.ID != 0 { snap.Defaults = &defs }
        c.JSON(http.StatusOK, snap)
    })

    // Providers CRUD (minimal)
    r.GET("/v1/providers", func(c *gin.Context) {
        var prov []LLMProvider
        db.Find(&prov)
        c.JSON(http.StatusOK, prov)
    })
    r.POST("/v1/providers", func(c *gin.Context) {
        var p LLMProvider
        if err := c.BindJSON(&p); err != nil { c.JSON(400, gin.H{"error": err.Error()}); return }
        if p.Status == "" { p.Status = "active" }
        if err := db.Create(&p).Error; err != nil { c.JSON(500, gin.H{"error": err.Error()}); return }
        c.JSON(201, p)
    })

    // Models CRUD (minimal)
    r.GET("/v1/models", func(c *gin.Context) {
        var m []LLMModel
        q := db
        if pid := c.Query("provider_id"); pid != "" { q = q.Where("provider_id = ?", pid) }
        if t := c.Query("type"); t != "" { q = q.Where("model_type = ?", t) }
        q.Find(&m)
        c.JSON(http.StatusOK, m)
    })
    r.POST("/v1/models", func(c *gin.Context) {
        var m LLMModel
        if err := c.BindJSON(&m); err != nil { c.JSON(400, gin.H{"error": err.Error()}); return }
        if m.Status == "" { m.Status = "active" }
        if m.ModelType == "" { m.ModelType = "chat" }
        if err := db.Create(&m).Error; err != nil { c.JSON(500, gin.H{"error": err.Error()}); return }
        c.JSON(201, m)
    })

    // Aliases CRUD (minimal)
    r.GET("/v1/aliases", func(c *gin.Context) {
        var a []LLMAlias
        db.Find(&a)
        c.JSON(http.StatusOK, a)
    })
    r.POST("/v1/aliases", func(c *gin.Context) {
        var a LLMAlias
        if err := c.BindJSON(&a); err != nil { c.JSON(400, gin.H{"error": err.Error()}); return }
        if err := db.Create(&a).Error; err != nil { c.JSON(500, gin.H{"error": err.Error()}); return }
        c.JSON(201, a)
    })

    // Defaults
    // Defaults (with enriched info)
    enrich := func(d LLMDefaults) gin.H {
        out := gin.H{"default_model": d.DefaultModel, "default_embedding": d.DefaultEmbedding, "default_rerank": d.DefaultRerank}
        if d.DefaultModel != "" {
            if p, m, err := findModelNoCheck(db, d.DefaultModel); err == nil {
                out["default_model_info"] = gin.H{
                    "id": m.ID,
                    "model_id": m.ModelID,
                    "display_name": m.DisplayName,
                    "model_type": m.ModelType,
                    "status": m.Status,
                    "context_length": m.ContextLength,
                    "capabilities": tryParseJSON(m.Capabilities),
                    "pricing": tryParseJSON(m.Pricing),
                    "created_at": m.CreatedAt,
                    "updated_at": m.UpdatedAt,
                    "provider": gin.H{
                        "id": p.ID,
                        "name": p.Name,
                        "type": p.Type,
                        "base_url": p.BaseURL,
                        "status": p.Status,
                        "created_at": p.CreatedAt,
                        "updated_at": p.UpdatedAt,
                    },
                }
            }
        }
        if d.DefaultEmbedding != "" {
            if p, m, err := findModelNoCheck(db, d.DefaultEmbedding); err == nil {
                out["default_embedding_info"] = gin.H{
                    "id": m.ID,
                    "model_id": m.ModelID,
                    "display_name": m.DisplayName,
                    "model_type": m.ModelType,
                    "status": m.Status,
                    "context_length": m.ContextLength,
                    "capabilities": tryParseJSON(m.Capabilities),
                    "pricing": tryParseJSON(m.Pricing),
                    "created_at": m.CreatedAt,
                    "updated_at": m.UpdatedAt,
                    "provider": gin.H{
                        "id": p.ID,
                        "name": p.Name,
                        "type": p.Type,
                        "base_url": p.BaseURL,
                        "status": p.Status,
                        "created_at": p.CreatedAt,
                        "updated_at": p.UpdatedAt,
                    },
                }
            }
        }
        if d.DefaultRerank != "" {
            if p, m, err := findModelNoCheck(db, d.DefaultRerank); err == nil {
                out["default_rerank_info"] = gin.H{
                    "id": m.ID,
                    "model_id": m.ModelID,
                    "display_name": m.DisplayName,
                    "model_type": m.ModelType,
                    "status": m.Status,
                    "context_length": m.ContextLength,
                    "capabilities": tryParseJSON(m.Capabilities),
                    "pricing": tryParseJSON(m.Pricing),
                    "created_at": m.CreatedAt,
                    "updated_at": m.UpdatedAt,
                    "provider": gin.H{
                        "id": p.ID,
                        "name": p.Name,
                        "type": p.Type,
                        "base_url": p.BaseURL,
                        "status": p.Status,
                        "created_at": p.CreatedAt,
                        "updated_at": p.UpdatedAt,
                    },
                }
            }
        }
        return out
    }
    r.GET("/v1/defaults", func(c *gin.Context) {
        var d LLMDefaults
        if err := db.First(&d, 1).Error; err != nil {
            c.JSON(200, gin.H{"default_model": "", "default_embedding": "", "default_rerank": ""})
            return
        }
        c.JSON(200, enrich(d))
    })
    r.GET("/v1/default", func(c *gin.Context) {
        var d LLMDefaults
        if err := db.First(&d, 1).Error; err != nil { c.JSON(200, gin.H{"default_model": "", "default_embedding": "", "default_rerank": ""}); return }
        c.JSON(200, enrich(d))
    })

    // Simplified defaults: only model name and provider
    r.GET("/v1/defaults/simple", func(c *gin.Context) {
        var d LLMDefaults
        if err := db.First(&d, 1).Error; err != nil {
            c.JSON(200, gin.H{"chat": gin.H{"model":"","provider":""}, "embedding": gin.H{"model":"","provider":""}, "rerank": gin.H{"model":"","provider":""}})
            return
        }
        out := gin.H{}
        // chat
        {
            name := d.DefaultModel
            provName := ""
            if name != "" {
                if p, _, err := findModelNoCheck(db, name); err == nil {
                    provName = p.Name
                } else {
                    // fall back to heuristic
                    provName = guessProviderFromModelID(name)
                }
            }
            out["chat"] = gin.H{"model": name, "provider": provName}
        }
        // embedding
        {
            name := d.DefaultEmbedding
            provName := ""
            if name != "" {
                if p, _, err := findModelNoCheck(db, name); err == nil {
                    provName = p.Name
                } else {
                    provName = guessProviderFromModelID(name)
                }
            }
            out["embedding"] = gin.H{"model": name, "provider": provName}
        }
        // rerank
        {
            name := d.DefaultRerank
            provName := ""
            if name != "" {
                if p, _, err := findModelNoCheck(db, name); err == nil {
                    provName = p.Name
                } else { provName = guessProviderFromModelID(name) }
            }
            out["rerank"] = gin.H{"model": name, "provider": provName}
        }
        c.JSON(200, out)
    })
    r.POST("/v1/defaults", func(c *gin.Context) {
        var body map[string]interface{}
        if err := c.BindJSON(&body); err != nil { c.JSON(400, gin.H{"error": err.Error()}); return }
        // 读取当前值
        var d LLMDefaults
        _ = db.First(&d, 1).Error
        curModel := d.DefaultModel
        curEmb := d.DefaultEmbedding
        curRerank := d.DefaultRerank
        // 合并策略：
        // - 若给的是空字符串，则清空
        // - 若给的是 "string"（Swagger 默认示例），视为未提供 -> 保持原值
        // - 若给的是其它非空字符串，则更新为该值
        if v, ok := body["default_model"]; ok {
            s, _ := v.(string)
            if s == "" {
                curModel = ""
            } else if strings.ToLower(strings.TrimSpace(s)) == "string" {
                // keep
            } else {
                curModel = s
            }
        }
        if v, ok := body["default_embedding"]; ok {
            s, _ := v.(string)
            if s == "" {
                curEmb = ""
            } else if strings.ToLower(strings.TrimSpace(s)) == "string" {
                // keep
            } else {
                curEmb = s
            }
        }
        // ensure chat model exists in DB with provider mapping when setting default chat
        if curModel != "" {
            var m LLMModel
            if err := db.Where("model_id = ?", curModel).First(&m).Error; err != nil {
                // try use provided provider or select best
                var pid uint
                if v, ok := body["provider_id"]; ok {
                    if f, ok2 := v.(float64); ok2 { pid = uint(f) }
                }
                if pid == 0 {
                    if v, ok := body["provider"]; ok { // name/type
                        s, _ := v.(string)
                        if s != "" {
                            var p LLMProvider
                            if e := db.Where("LOWER(name) = ? OR LOWER(type) = ?", strings.ToLower(s), strings.ToLower(s)).First(&p).Error; e == nil { pid = p.ID }
                        }
                    }
                }
                if pid == 0 {
                    if p := pickBestProvider(db); p != nil { pid = p.ID }
                }
                if pid != 0 {
                    nm := LLMModel{ProviderID: pid, ModelID: curModel, DisplayName: curModel, ModelType: "chat", Status: "active"}
                    _ = db.Create(&nm).Error
                }
            }
        }

        if v, ok := body["default_rerank"]; ok {
            s, _ := v.(string)
            if s == "" {
                curRerank = ""
            } else if strings.ToLower(strings.TrimSpace(s)) == "string" {
                // keep
            } else {
                curRerank = s
            }
        }

        if d.ID == 0 {
            d = LLMDefaults{ID: 1, DefaultModel: curModel, DefaultEmbedding: curEmb, DefaultRerank: curRerank, UpdatedAt: time.Now()}
            if e := db.Create(&d).Error; e != nil { c.JSON(500, gin.H{"error": e.Error()}); return }
        } else {
            d.DefaultModel = curModel
            d.DefaultEmbedding = curEmb
            d.DefaultRerank = curRerank
            d.UpdatedAt = time.Now()
            if e := db.Save(&d).Error; e != nil { c.JSON(500, gin.H{"error": e.Error()}); return }
        }
        c.JSON(200, enrich(d))
    })

    // Repair defaults if accidentally set to placeholder like "string"
    r.POST("/admin/defaults/repair", func(c *gin.Context) {
        var d LLMDefaults
        _ = db.First(&d, 1).Error
        fixed := false
        // fix chat default
        if d.DefaultModel == "" || strings.EqualFold(strings.TrimSpace(d.DefaultModel), "string") {
            // choose first active chat model
            var m LLMModel
            if err := db.Where("model_type = ? AND status = ?", "chat", "active").First(&m).Error; err == nil {
                d.DefaultModel = m.ModelID
                fixed = true
            }
        }
        // fix embedding default（优先使用 Unla 的 embedding_defaults）
        if d.DefaultEmbedding == "" || strings.EqualFold(strings.TrimSpace(d.DefaultEmbedding), "string") {
            prefix := getenv("UNLA_DB_TABLE_PREFIX", "unla_")
            var x struct{ DefaultEmbedding string }
            if err := db.Raw("SELECT default_embedding FROM "+prefix+"embedding_defaults WHERE id=1").Scan(&x).Error; err == nil && x.DefaultEmbedding != "" {
                d.DefaultEmbedding = x.DefaultEmbedding
                fixed = true
            } else {
                var em LLMModel
                if err := db.Where("model_type = ? AND status = ?", "embedding", "active").First(&em).Error; err == nil {
                    d.DefaultEmbedding = em.ModelID
                    fixed = true
                }
            }
        }
        if fixed {
            d.UpdatedAt = time.Now()
            if d.ID == 0 { d.ID = 1; _ = db.Create(&d).Error } else { _ = db.Save(&d).Error }
        }
        c.JSON(200, gin.H{"ok": true, "fixed": fixed, "defaults": enrich(d)})
    })

    // OpenAI-compatible chat proxy (basic, non-streaming)
    r.POST("/v1/chat/completions", func(c *gin.Context) {
        // Read raw body for upstream pass-through
        bodyBytes, err := io.ReadAll(c.Request.Body)
        if err != nil { c.JSON(400, gin.H{"error": err.Error()}); return }
        // Parse model field and stream flag
        var payload map[string]interface{}
        if err := json.Unmarshal(bodyBytes, &payload); err != nil {
            c.JSON(400, gin.H{"error": "invalid json: " + err.Error()}); return
        }
        // Normalize non-standard roles (e.g., 'developer' -> 'system') for better upstream compatibility
        if mv, ok := payload["messages"].([]any); ok && len(mv) > 0 {
            changed := false
            for i, m := range mv {
                if mm, ok := m.(map[string]any); ok {
                    if r, ok := mm["role"].(string); ok {
                        lr := strings.ToLower(strings.TrimSpace(r))
                        if lr == "developer" {
                            mm["role"] = "system"
                            mv[i] = mm
                            changed = true
                        }
                    }
                }
            }
            if changed {
                payload["messages"] = mv
                bodyBytes, _ = json.Marshal(payload)
            }
        }
        modelName, _ := payload["model"].(string)
        modelName = normalizeModelName(modelName)
        if modelName == "" {
            // 尝试使用默认聊天模型
            var d LLMDefaults
            if err := db.First(&d, 1).Error; err == nil && d.DefaultModel != "" {
                modelName = d.DefaultModel
            } else {
                c.JSON(400, gin.H{"error": "missing model"}); return
            }
        }
        stream := false
        if streamVal, ok := payload["stream"].(bool); ok && streamVal { stream = true }

        prov, model, err := resolveRoute(db, modelName)
        if err != nil {
            if strings.Contains(err.Error(), "disabled") {
                c.JSON(403, gin.H{"error": err.Error()}); return
            }
            c.JSON(400, gin.H{"error": err.Error()}); return
        }

        // Ensure upstream URL
        up := upstreamCompletionsURL(prov.BaseURL)
        // Replace alias model with actual model id in body (if alias used)
        if modelName != model.ModelID {
            payload["model"] = model.ModelID
            bodyBytes, _ = json.Marshal(payload)
        }

        // Build request
        timeoutMs := 30000
        if v := getenv("LLM_UPSTREAM_TIMEOUT_MS", ""); v != "" {
            if n, e := fmt.Sscanf(v, "%d", &timeoutMs); n == 1 && e == nil { /* ok */ }
        }
        client := &http.Client{ Timeout: time.Duration(timeoutMs) * time.Millisecond }

        doReq := func() (*http.Response, error) {
            req, err := http.NewRequestWithContext(c.Request.Context(), http.MethodPost, up, bytes.NewReader(bodyBytes))
            if err != nil { return nil, err }
            req.Header.Set("Content-Type", "application/json")
            if strings.TrimSpace(prov.APIKeyEnc) != "" {
                req.Header.Set("Authorization", "Bearer "+prov.APIKeyEnc)
            }
            if strings.TrimSpace(prov.ExtraHdrs) != "" {
                var hdrs map[string]string
                if json.Unmarshal([]byte(prov.ExtraHdrs), &hdrs) == nil {
                    for k, v := range hdrs { req.Header.Set(k, v) }
                }
            }
            return client.Do(req)
        }

        // retry policy
        maxRetry := 1
        if v := getenv("LLM_UPSTREAM_RETRY", ""); v != "" {
            fmt.Sscanf(v, "%d", &maxRetry)
        }
        var resp *http.Response
        var errDo error
        for attempt := 0; attempt <= maxRetry; attempt++ {
            resp, errDo = doReq()
            if errDo == nil && resp.StatusCode < 500 { break }
            if resp != nil { resp.Body.Close() }
            time.Sleep(time.Duration(200*(attempt+1)) * time.Millisecond)
        }
        if errDo != nil { c.JSON(502, gin.H{"error": errDo.Error()}); return }
        defer resp.Body.Close()

        if stream {
            // SSE/text-event-stream proxy（加强 headers 与 flush）
            ct := resp.Header.Get("Content-Type")
            if ct == "" { ct = "text/event-stream" }
            c.Writer.Header().Set("Content-Type", ct)
            c.Writer.Header().Set("Cache-Control", "no-cache")
            c.Writer.Header().Set("Connection", "keep-alive")
            c.Writer.WriteHeader(resp.StatusCode)
            flusher, _ := c.Writer.(http.Flusher)
            buf := make([]byte, 32*1024)
            done := c.Request.Context().Done()
            for {
                n, er := resp.Body.Read(buf)
                if n > 0 {
                    if _, ew := c.Writer.Write(buf[:n]); ew != nil { break }
                    if flusher != nil { flusher.Flush() }
                }
                if er != nil { break }
                select {
                case <-done:
                    return
                default:
                }
            }
            return
        }

        // non-streaming passthrough
        c.Header("Content-Type", resp.Header.Get("Content-Type"))
        c.Status(resp.StatusCode)
        _, _ = io.Copy(c.Writer, resp.Body)
    })

    // OpenAI-compatible embeddings proxy (non-streaming)
    r.POST("/v1/embeddings", func(c *gin.Context) {
        bodyBytes, err := io.ReadAll(c.Request.Body)
        if err != nil { c.JSON(400, gin.H{"error": err.Error()}); return }
        var payload map[string]interface{}
        if err := json.Unmarshal(bodyBytes, &payload); err != nil { c.JSON(400, gin.H{"error": "invalid json: "+err.Error()}); return }
        modelName, _ := payload["model"].(string)
        modelName = normalizeModelName(modelName)
        if modelName == "" {
            // 尝试使用默认向量模型
            var d LLMDefaults
            if err := db.First(&d, 1).Error; err == nil && d.DefaultEmbedding != "" {
                modelName = d.DefaultEmbedding
            } else {
                c.JSON(400, gin.H{"error": "missing model"}); return
            }
        }
        prov, model, err := resolveRoute(db, modelName)
        if err != nil {
            if strings.Contains(err.Error(), "disabled") {
                c.JSON(403, gin.H{"error": err.Error()}); return
            }
            c.JSON(400, gin.H{"error": err.Error()}); return
        }
        // ensure model id
        if modelName != model.ModelID { payload["model"] = model.ModelID; bodyBytes, _ = json.Marshal(payload) }
        up := upstreamEmbeddingsURL(prov.BaseURL)

        timeoutMs := 30000
        client := &http.Client{ Timeout: time.Duration(timeoutMs) * time.Millisecond }
        req, err := http.NewRequestWithContext(c.Request.Context(), http.MethodPost, up, bytes.NewReader(bodyBytes))
        if err != nil { c.JSON(500, gin.H{"error": err.Error()}); return }
        req.Header.Set("Content-Type", "application/json")
        if strings.TrimSpace(prov.APIKeyEnc) != "" { req.Header.Set("Authorization", "Bearer "+prov.APIKeyEnc) }
        if strings.TrimSpace(prov.ExtraHdrs) != "" {
            var hdrs map[string]string
            if json.Unmarshal([]byte(prov.ExtraHdrs), &hdrs) == nil { for k, v := range hdrs { req.Header.Set(k, v) } }
        }
        resp, err := client.Do(req)
        if err != nil { c.JSON(502, gin.H{"error": err.Error()}); return }
        defer resp.Body.Close()
        c.Header("Content-Type", resp.Header.Get("Content-Type"))
        c.Status(resp.StatusCode)
        _, _ = io.Copy(c.Writer, resp.Body)
    })

    // List all enabled models grouped by provider
    r.GET("/v1/models/enabled", func(c *gin.Context) {
        type OutModel struct {
            ModelID     string `json:"model_id"`
            DisplayName string `json:"display_name"`
            ModelType   string `json:"model_type"`
        }
        type OutProv struct {
            ID     uint       `json:"id"`
            Name   string     `json:"name"`
            Type   string     `json:"type"`
            Models []OutModel `json:"models"`
        }
        var models []LLMModel
        if err := db.Where("status = ?", "active").Find(&models).Error; err != nil { c.JSON(500, gin.H{"error": err.Error()}); return }
        provIDs := map[uint]struct{}{}
        for _, m := range models { provIDs[m.ProviderID] = struct{}{} }
        ids := make([]uint, 0, len(provIDs))
        for id := range provIDs { ids = append(ids, id) }
        provMap := map[uint]LLMProvider{}
        if len(ids) > 0 {
            var provs []LLMProvider
            _ = db.Where("id IN ?", ids).Find(&provs).Error
            for _, p := range provs { provMap[p.ID] = p }
        }
        groups := map[uint]*OutProv{}
        out := []OutProv{}
        for _, m := range models {
            p := provMap[m.ProviderID]
            if p.ID == 0 || p.Status == "disabled" { continue }
            g := groups[p.ID]
            if g == nil {
                g = &OutProv{ ID: p.ID, Name: p.Name, Type: p.Type, Models: []OutModel{} }
                groups[p.ID] = g
                out = append(out, *g)
            }
            om := OutModel{ ModelID: m.ModelID, DisplayName: m.DisplayName, ModelType: m.ModelType }
            for i := range out { if out[i].ID == p.ID { out[i].Models = append(out[i].Models, om) } }
        }
        c.JSON(200, gin.H{"providers": out})
    })

    addr := ":9050"
    if v := os.Getenv("LLM_GATEWAY_PORT"); v != "" { addr = ":" + v }
    log.Printf("llm-config-gateway listening on %s", addr)
    if err := r.Run(addr); err != nil { log.Fatal(err) }
}

// resolveRoute finds provider and model by alias or model id
func resolveRoute(db *gorm.DB, name string) (*LLMProvider, *LLMModel, error) {
    var alias LLMAlias
    if err := db.Where("alias = ?", name).First(&alias).Error; err == nil {
        var model LLMModel
        if e := db.Where("id = ?", alias.TargetID).First(&model).Error; e != nil { return nil, nil, e }
        var prov LLMProvider
        if e := db.Where("id = ?", model.ProviderID).First(&prov).Error; e != nil { return nil, nil, e }
        if prov.Status != "active" || model.Status != "active" { return nil, nil, errors.New("model/provider disabled") }
        return &prov, &model, nil
    }
    // Try model_id direct
    var model LLMModel
    if err := db.Where("model_id = ?", name).First(&model).Error; err != nil { return nil, nil, errors.New("model or alias not found") }
    var prov LLMProvider
    if err := db.Where("id = ?", model.ProviderID).First(&prov).Error; err != nil { return nil, nil, err }
    if prov.Status != "active" || model.Status != "active" { return nil, nil, errors.New("model/provider disabled") }
    return &prov, &model, nil
}

func upstreamCompletionsURL(base string) string {
    // If base ends with /v1 -> append /chat/completions; else append /v1/chat/completions
    u := strings.TrimRight(base, "/")
    if u == "" { return "/v1/chat/completions" }
    // Ensure valid URL
    if _, err := url.Parse(u); err != nil { return "/v1/chat/completions" }
    if strings.HasSuffix(u, "/v1") {
        return u + "/chat/completions"
    }
    return u + "/v1/chat/completions"
}

func upstreamEmbeddingsURL(base string) string {
    u := strings.TrimRight(base, "/")
    if u == "" { return "/v1/embeddings" }
    if _, err := url.Parse(u); err != nil { return "/v1/embeddings" }
    if strings.HasSuffix(u, "/v1") { return u + "/embeddings" }
    return u + "/v1/embeddings"
}
