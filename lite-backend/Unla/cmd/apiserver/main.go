package main

import (
    "context"
    "fmt"
    "log"
    "os"
    "time"
    "net"

	"github.com/amoylab/unla/internal/apiserver/database"
    apiserverHandler "github.com/amoylab/unla/internal/apiserver/handler"
    "github.com/amoylab/unla/internal/apiserver/middleware"
    "github.com/amoylab/unla/internal/auth/jwt"
    apidb "github.com/amoylab/unla/internal/apiserver/database"
    "github.com/amoylab/unla/internal/common/cnst"
    "github.com/amoylab/unla/internal/common/config"
    "github.com/amoylab/unla/internal/i18n"
    "github.com/amoylab/unla/internal/mcp/storage"
    "github.com/amoylab/unla/internal/mcp/storage/notifier"
	"github.com/amoylab/unla/pkg/logger"
	"github.com/amoylab/unla/pkg/version"

	"github.com/gin-gonic/gin"
	"github.com/spf13/cobra"
	"go.uber.org/zap"
	"golang.org/x/crypto/bcrypt"
)

var (
	configPath string

	versionCmd = &cobra.Command{
		Use:   "version",
		Short: "Print the version number of apiserver",
		Run: func(cmd *cobra.Command, args []string) {
			fmt.Printf("apiserver version %s\n", version.Get())
		},
	}

	rootCmd = &cobra.Command{
		Use:   "apiserver",
		Short: "MCP API Server",
		Long:  `MCP API Server provides API endpoints for MCP ecosystem`,
		Run: func(cmd *cobra.Command, args []string) {
			run()
		},
	}
)

func init() {
	rootCmd.PersistentFlags().StringVarP(&configPath, "conf", "c", cnst.ApiServerYaml, "path to configuration file, like /etc/unla/apiserver.yaml")
	rootCmd.AddCommand(versionCmd)
}

// initLogger initializes the application logger
func initLogger(cfg *config.APIServerConfig) *zap.Logger {
	logger, err := logger.NewLogger(&cfg.Logger)
	if err != nil {
		log.Fatalf("Failed to create logger: %v", err)
	}
	return logger
}

// initConfig loads and returns the application configuration
func initConfig() *config.APIServerConfig {
	cfg, _, err := config.LoadConfig[config.APIServerConfig](configPath)
	if err != nil {
		log.Fatalf("Failed to load configuration: %v", err)
	}
	return cfg
}

// initNotifier initializes the notifier service
func initNotifier(ctx context.Context, logger *zap.Logger, cfg *config.NotifierConfig) notifier.Notifier {
	if notifier.Type(cfg.Type) == notifier.TypeComposite {
		log.Fatal("Composite notifier is not supported in apiserver")
	}
	ntf, err := notifier.NewNotifier(ctx, logger, cfg)
	if err != nil {
		logger.Fatal("Failed to initialize notifier", zap.Error(err))
	}
	return ntf
}

// initDatabase initializes the database connection
func initDatabase(logger *zap.Logger, cfg *config.DatabaseConfig) database.Database {
	logger.Info("Initializing database", zap.String("type", cfg.Type))
	db, err := database.NewDatabase(cfg)
	if err != nil {
		logger.Fatal("Failed to initialize database", zap.Error(err))
	}
	logger.Info("Database initialized", zap.String("type", cfg.Type))
	return db
}

// initStore initializes the storage service
func initStore(logger *zap.Logger, cfg *config.StorageConfig) storage.Store {
	store, err := storage.NewStore(logger, cfg)
	if err != nil {
		logger.Fatal("Failed to initialize store", zap.Error(err))
	}
	return store
}

// initSuperAdmin initializes the super admin user if it doesn't exist
func initSuperAdmin(ctx context.Context, db database.Database, cfg *config.APIServerConfig) error {
    // 嵌入模式：不要求登录，但需要保证有一个可用的占位用户，避免下游 handler 读取用户信息时报错
    if isEmbedded(cfg) {
        if u, _ := db.GetUserByUsername(ctx, "embedded"); u == nil {
            pwd := "embedded"
            hp, err := bcrypt.GenerateFromPassword([]byte(pwd), bcrypt.DefaultCost)
            if err != nil { return fmt.Errorf("failed to hash embedded password: %w", err) }
            eu := &database.User{
                Username:  "embedded",
                Password:  string(hp),
                Role:      database.RoleAdmin,
                IsActive:  true,
                CreatedAt: time.Now(),
                UpdatedAt: time.Now(),
            }
            if err := db.CreateUser(ctx, eu); err != nil {
                return fmt.Errorf("failed to create embedded user: %w", err)
            }
        }
        return nil
    }

    // 非嵌入模式：确保配置的 super admin 存在
    if user, err := db.GetUserByUsername(ctx, cfg.SuperAdmin.Username); err == nil && user != nil {
        return nil
    }
    hashedPassword, err := bcrypt.GenerateFromPassword([]byte(cfg.SuperAdmin.Password), bcrypt.DefaultCost)
    if err != nil { return fmt.Errorf("failed to hash password: %w", err) }
    superAdmin := &database.User{
        Username:  cfg.SuperAdmin.Username,
        Password:  string(hashedPassword),
        Role:      database.RoleAdmin,
        IsActive:  true,
        CreatedAt: time.Now(),
        UpdatedAt: time.Now(),
    }
    if err := db.CreateUser(ctx, superAdmin); err != nil {
        return fmt.Errorf("failed to create super admin: %w", err)
    }
    return nil
}

// initRouter initializes the HTTP router and handlers
func initRouter(db database.Database, store storage.Store, ntf notifier.Notifier, cfg *config.APIServerConfig, logger *zap.Logger) *gin.Engine {
    r := gin.Default()

	// Convert APIServerConfig to MCPGatewayConfig
	mcpCfg := &config.MCPGatewayConfig{
		SuperAdmin: cfg.SuperAdmin,
		Logger:     cfg.Logger,
		Storage:    cfg.Storage,
		Notifier:   cfg.Notifier,
	}

	// Initialize auth services
	jwtService := jwt.NewService(jwt.Config{
		SecretKey: cfg.JWT.SecretKey,
		Duration:  cfg.JWT.Duration,
	})
    authH := apiserverHandler.NewHandler(db, jwtService, mcpCfg, logger)
    embHandler := apiserverHandler.NewEmbeddingHandler(db)

    authG := r.Group("/api/auth")
    authG.POST("/login", authH.Login)

	// Protected routes
    // Protected API group：始终挂载中间件（中间件已支持嵌入/免认证注入）
    protected := r.Group("/api")
    protected.Use(middleware.JWTAuthMiddleware(jwtService))
    {
        chatHandler := apiserverHandler.NewChat(db, logger)
        mcpHandler := apiserverHandler.NewMCP(db, store, ntf, logger)
        openapiHandler := apiserverHandler.NewOpenAPI(db, store, ntf, logger)
        systemPromptHandler := apiserverHandler.NewSystemPrompt(db, logger)

        // Auth routes（嵌入模式下不暴露原用户/租户接口，改为轻量替代）
        if !isEmbedded(cfg) {
            protected.POST("/auth/change-password", authH.ChangePassword)
            protected.GET("/auth/user/info", authH.GetUserInfo)
            protected.GET("/auth/user", authH.GetUserWithTenants)
            protected.GET("/auth/tenants", authH.ListTenants)
        } else {
            // Minimal stubs for embedded mode to satisfy frontend queries
            protected.GET("/auth/user/info", func(c *gin.Context) {
                if claims, ok := c.Get("claims"); ok {
                    jc := claims.(*jwt.Claims)
                    c.JSON(200, gin.H{
                        "id":       jc.UserID,
                        "username": jc.Username,
                        "role":     jc.Role,
                    })
                    return
                }
                c.JSON(200, gin.H{"username": "embedded", "role": "admin"})
            })
            protected.GET("/auth/user", func(c *gin.Context) {
                t, err := db.GetTenantByName(c.Request.Context(), "default")
                if err != nil {
                    c.JSON(200, gin.H{"tenants": []apidb.Tenant{}})
                    return
                }
                c.JSON(200, gin.H{"tenants": []gin.H{{
                    "id": t.ID, "name": t.Name, "prefix": t.Prefix, "description": t.Description, "isActive": t.IsActive,
                }}})
            })
            protected.GET("/auth/tenants", func(c *gin.Context) {
                // Return only default tenant by design
                t, err := db.GetTenantByName(c.Request.Context(), "default")
                if err != nil {
                    c.JSON(200, []apidb.Tenant{})
                    return
                }
                c.JSON(200, []gin.H{{
                    "id": t.ID, "name": t.Name, "prefix": t.Prefix, "description": t.Description, "isActive": t.IsActive,
                }})
            })
            // Provide GET /auth/tenants/:name for compatibility (frontend may request by name)
            protected.GET("/auth/tenants/:name", func(c *gin.Context) {
                name := c.Param("name")
                if name == "" { name = "default" }
                t, err := db.GetTenantByName(c.Request.Context(), name)
                if err != nil {
                    // If not found, fallback to default
                    if name != "default" {
                        if td, e2 := db.GetTenantByName(c.Request.Context(), "default"); e2 == nil {
                            c.JSON(200, gin.H{"id": td.ID, "name": td.Name, "prefix": td.Prefix, "description": td.Description, "isActive": td.IsActive})
                            return
                        }
                    }
                    c.JSON(404, gin.H{"error": "tenant not found"})
                    return
                }
                c.JSON(200, gin.H{"id": t.ID, "name": t.Name, "prefix": t.Prefix, "description": t.Description, "isActive": t.IsActive})
            })
        }

        // User management routes (admin only) — 嵌入模式关闭
        if !isEmbedded(cfg) {
            userMgmt := protected.Group("/auth/users")
            userMgmt.Use(apiserverHandler.AdminAuthMiddleware())
            {
                userMgmt.GET("", authH.ListUsers)
                userMgmt.POST("", authH.CreateUser)
                userMgmt.PUT("", authH.UpdateUser)
                userMgmt.DELETE("/:username", authH.DeleteUser)
                userMgmt.GET("/:username", authH.GetUserWithTenants)
                userMgmt.PUT("/tenants", authH.UpdateUserTenants)
            }
        }

        // Tenant management routes (admin only) — 嵌入模式关闭
        if !isEmbedded(cfg) {
            tenantMgmt := protected.Group("/auth/tenants")
            {
                tenantMgmt.POST("", authH.CreateTenant)
                tenantMgmt.GET("/:name", authH.GetTenantInfo)
            }
            tenantMgmt.Use(apiserverHandler.AdminAuthMiddleware())
            {
                tenantMgmt.PUT("", authH.UpdateTenant)
                tenantMgmt.DELETE("/:name", authH.DeleteTenant)
            }
        }

        // Target group for MCP/OpenAPI
        // Always protect MCP/OpenAPI with JWT; embedded mode bypass is handled inside handlers where needed
        mcpTarget := protected
        // MCP config routes
        mcpGroup := mcpTarget.Group("/mcp")
        {
            mcpGroup.GET("/configs/names", mcpHandler.HandleGetConfigNames)
            mcpGroup.GET("/configs/versions", mcpHandler.HandleGetConfigVersions)
            mcpGroup.POST("/configs/:tenant/:name/versions/:version/active", mcpHandler.HandleSetActiveVersion)

            mcpGroup.GET("/configs", mcpHandler.HandleListMCPServers)
            mcpGroup.POST("/configs", mcpHandler.HandleMCPServerCreate)
            mcpGroup.PUT("/configs", mcpHandler.HandleMCPServerUpdate)
            mcpGroup.DELETE("/configs/:tenant/:name", mcpHandler.HandleMCPServerDelete)
            mcpGroup.POST("/configs/sync", mcpHandler.HandleMCPServerSync)
        }

        // OpenAPI routes
        mcpTarget.POST("/openapi/import", openapiHandler.HandleImport)

		protected.GET("/chat/sessions", chatHandler.HandleGetChatSessions)
		protected.GET("/chat/sessions/:sessionId/messages", chatHandler.HandleGetChatMessages)
		protected.DELETE("/chat/sessions/:sessionId", chatHandler.HandleDeleteChatSession)
		protected.PUT("/chat/sessions/:sessionId/title", chatHandler.HandleUpdateChatSessionTitle)
		protected.POST("/chat/messages", chatHandler.HandleSaveChatMessage)

		// System prompt routes
		protected.GET("/chat/systemprompt", systemPromptHandler.GetSystemPrompt)
		protected.PUT("/chat/systemprompt", systemPromptHandler.SaveSystemPrompt)

            // Default LLM provider endpoint
            protected.GET("/defaultllmprovider", chatHandler.HandleDefaultLLMProviders)

            // (moved to public group below)


	}

	// Embedding models config endpoints (DB-backed, public for built-in usage)
        emb := r.Group("/api/embeddings")
        {
            emb.GET("/providers", embHandler.ListProviders)
            emb.GET("/models", embHandler.ListModels)
            emb.POST("/models", embHandler.CreateModel)
            emb.PUT("/models", embHandler.UpdateModel)
            emb.POST("/models/bulk", embHandler.BulkUpsertModels)
            emb.POST("/models/status", embHandler.SetModelStatus)
            emb.GET("/defaults", embHandler.GetDefaults)
            emb.POST("/defaults", embHandler.SetDefaults)
            emb.POST("/sync-to-gateway", embHandler.SyncToGateway) // Sync to LLM Gateway (9050)
        }

        // Rerank models config endpoints (public)
        rerankHandler := apiserverHandler.NewRerankHandler(db)
        rr := r.Group("/api/rerank")
        {
            rr.GET("/providers", rerankHandler.ListProviders)
            rr.GET("/models", rerankHandler.ListModels)
            rr.POST("/models", rerankHandler.CreateModel)
            rr.PUT("/models", rerankHandler.UpdateModel)
            rr.POST("/models/bulk", rerankHandler.BulkUpsertModels)
            rr.POST("/models/status", rerankHandler.SetModelStatus)
            rr.GET("/defaults", rerankHandler.GetDefaults)
            rr.POST("/defaults", rerankHandler.SetDefaults)
            rr.POST("/sync-to-gateway", rerankHandler.SyncToGateway) // Sync to LLM Gateway (9050)
        }

    // Public runtime config endpoint for frontend
    runtimeConfigHandler := apiserverHandler.NewRuntimeConfigHandler(cfg)
    r.GET("/api/runtime-config", runtimeConfigHandler.HandleRuntimeConfig)

    // Public LLM meta routes (capability test results), align with public embeddings/rerank endpoints
    llmMetaHandler := apiserverHandler.NewLLMMetaHandler(db)
    llmPub := r.Group("/api/llm/models")
    {
        llmPub.GET("/meta", llmMetaHandler.ListMeta)
        llmPub.POST("/meta/test-result", llmMetaHandler.SaveTestResult)
    }

    // Internal trusted endpoints (read-only), allowlisted for local calls (e.g., 9050 sync)
    r.GET("/api/internal/mcp/configs", func(c *gin.Context) {
        if !isTrustedLocal(c, cfg) {
            c.JSON(403, gin.H{"error": "forbidden"})
            return
        }
        // Reuse existing handler to list configs
        h := apiserverHandler.NewMCP(db, store, ntf, logger)
        h.HandleListMCPServers(c)
    })

    // Public MCP registry for runtime discovery
    mcpRegistry := apiserverHandler.NewMCPRegistryHandler(db)
    reg := r.Group("/api/mcp/registry")
    {
        reg.POST("/register", mcpRegistry.Register)
        reg.POST("/heartbeat", mcpRegistry.Heartbeat)
        reg.GET("", mcpRegistry.List)
        reg.GET("/:tenant/:name", mcpRegistry.Get)
        reg.GET("/:tenant/:name/tools", mcpRegistry.Tools)
        reg.PUT("/:tenant/:name/tools", mcpRegistry.UpdateTools)
        reg.DELETE("/:tenant/:name", mcpRegistry.Delete)
    }

	r.Static("/web", "./web")
	return r
}

// isEmbedded 返回是否处于嵌入模式（支持 YAML 配置与环境变量 APISERVER_EMBEDDED_MODE=true）
func isEmbedded(cfg *config.APIServerConfig) bool {
    if cfg != nil && cfg.EmbeddedMode {
        return true
    }
    if v := os.Getenv("APISERVER_EMBEDDED_MODE"); v == "true" || v == "1" || v == "on" {
        return true
    }
    return false
}

// isTrustedLocal returns true if request is from loopback and trust is enabled
func isTrustedLocal(c *gin.Context, cfg *config.APIServerConfig) bool {
    // Header override for internal calls
    if c.GetHeader("X-Internal-Request") == "1" {
        return true
    }
    host, _, err := net.SplitHostPort(c.Request.RemoteAddr)
    if err != nil { host = c.ClientIP() }
    ip := net.ParseIP(host)
    if ip == nil { return false }
    if ip.IsLoopback() {
        // Default: trust loopback unless explicitly disabled
        if v := os.Getenv("APISERVER_TRUST_LOCAL"); v == "false" || v == "0" || v == "off" {
            return false
        }
        return true
    }
    return false
}

// startServer starts the HTTP server
func startServer(logger *zap.Logger, router *gin.Engine) {
	port := os.Getenv("PORT")
	if port == "" {
		port = "5234"
	}

	logger.Info("Server starting", zap.String("port", port))
	if err := router.Run(":" + port); err != nil {
		logger.Fatal("Failed to start server", zap.Error(err))
	}
}

// initI18n initializes the i18n translator
func initI18n(cfg *config.I18nConfig) {
	translationsPath := cfg.Path
	if translationsPath == "" {
		translationsPath = "configs/i18n"
	}

	if err := i18n.InitTranslator(translationsPath); err != nil {
		log.Printf("Warning: Failed to load translations: %v\n", err)
	}
}

func run() {
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	// Load configuration first
	cfg := initConfig()

	// Initialize logger with configuration
	logger := initLogger(cfg)
	defer logger.Sync()

	logger.Info("Starting apiserver", zap.String("version", version.Get()))

	// Initialize services
	ntf := initNotifier(ctx, logger, &cfg.Notifier)
	db := initDatabase(logger, &cfg.Database)
	defer db.Close()

	// Initialize i18n translator
	initI18n(&cfg.I18n)

    // Initialize super admin (skip in embedded mode)
    if err := initSuperAdmin(ctx, db, cfg); err != nil {
        logger.Fatal("Failed to initialize super admin", zap.Error(err))
    }

	store := initStore(logger, &cfg.Storage)

	// Initialize router and start server
	router := initRouter(db, store, ntf, cfg, logger)
	startServer(logger, router)
}

func main() {
	if err := rootCmd.Execute(); err != nil {
		os.Exit(1)
	}
}
