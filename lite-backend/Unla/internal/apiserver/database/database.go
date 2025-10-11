package database

import (
	"context"
)

// Database defines the methods for database operations.
type Database interface {
	// Close closes the database connection.
	Close() error

	// SaveMessage saves a message to the database.
	SaveMessage(ctx context.Context, message *Message) error
	// GetMessages gets messages for a specific session.
	GetMessages(ctx context.Context, sessionID string) ([]*Message, error)
	// GetMessagesWithPagination gets messages for a specific session with pagination.
	GetMessagesWithPagination(ctx context.Context, sessionID string, page, pageSize int) ([]*Message, error)
	// CreateSession creates a new session with the given sessionId.
	CreateSession(ctx context.Context, sessionId string) error
	// CreateSessionWithTitle creates a new session with the given sessionId and title.
	CreateSessionWithTitle(ctx context.Context, sessionId string, title string) error
	// SessionExists checks if a session exists.
	SessionExists(ctx context.Context, sessionID string) (bool, error)
	// GetSessions gets all chat sessions with their latest message.
	GetSessions(ctx context.Context) ([]*Session, error)
	// UpdateSessionTitle updates the title of a session.
	UpdateSessionTitle(ctx context.Context, sessionID string, title string) error
	// DeleteSession deletes a session by ID.
	DeleteSession(ctx context.Context, sessionID string) error

	CreateUser(ctx context.Context, user *User) error
	GetUserByUsername(ctx context.Context, username string) (*User, error)
	UpdateUser(ctx context.Context, user *User) error
	DeleteUser(ctx context.Context, id uint) error
	ListUsers(ctx context.Context) ([]*User, error)

	CreateTenant(ctx context.Context, tenant *Tenant) error
	GetTenantByName(ctx context.Context, name string) (*Tenant, error)
	GetTenantByID(ctx context.Context, id uint) (*Tenant, error)
	UpdateTenant(ctx context.Context, tenant *Tenant) error
	DeleteTenant(ctx context.Context, id uint) error
	ListTenants(ctx context.Context) ([]*Tenant, error)

	AddUserToTenant(ctx context.Context, userID, tenantID uint) error
	RemoveUserFromTenant(ctx context.Context, userID, tenantID uint) error
	GetUserTenants(ctx context.Context, userID uint) ([]*Tenant, error)
	GetTenantUsers(ctx context.Context, tenantID uint) ([]*User, error)
	DeleteUserTenants(ctx context.Context, userID uint) error

	Transaction(ctx context.Context, fn func(ctx context.Context) error) error

    // System prompt methods
    GetSystemPrompt(ctx context.Context, userID uint) (string, error)
    SaveSystemPrompt(ctx context.Context, userID uint, prompt string) error

    // Embedding models config (DB-backed)
    ListEmbeddingModels(ctx context.Context, provider string) ([]*EmbeddingModel, error)
    CreateEmbeddingModel(ctx context.Context, m *EmbeddingModel) error
    GetEmbeddingDefaults(ctx context.Context) (*EmbeddingDefaults, error)
    SetEmbeddingDefaults(ctx context.Context, embedding string) error
    SetEmbeddingModelStatus(ctx context.Context, provider, modelID, status string) error
    UpdateEmbeddingModel(ctx context.Context, provider, modelID string, updates map[string]interface{}) error

    // Rerank models config (DB-backed)
    ListRerankModels(ctx context.Context, provider string) ([]*RerankModel, error)
    CreateRerankModel(ctx context.Context, m *RerankModel) error
    GetRerankDefaults(ctx context.Context) (*RerankDefaults, error)
    SetRerankDefaults(ctx context.Context, rerank string) error
    SetRerankModelStatus(ctx context.Context, provider, modelID, status string) error
    UpdateRerankModel(ctx context.Context, provider, modelID string, updates map[string]interface{}) error

    // MCP runtime registry (service discovery)
    UpsertMCPInstance(ctx context.Context, m *MCPInstance) error
    HeartbeatMCPInstance(ctx context.Context, tenant, name, status string) error
    ListMCPInstances(ctx context.Context, tenant string) ([]*MCPInstance, error)
    GetMCPInstance(ctx context.Context, tenant, name string) (*MCPInstance, error)
    UpdateMCPInstance(ctx context.Context, tenant, name string, updates map[string]interface{}) error
    DeleteMCPInstance(ctx context.Context, tenant, name string) error
    UpdateMCPInstanceTools(ctx context.Context, tenant, name string, tools []MCPTool) error

    // Chat model meta (tool/fn-call capability tests)
    UpsertChatModelMeta(ctx context.Context, meta *ChatModelMeta) error
    ListChatModelMeta(ctx context.Context, provider string) ([]*ChatModelMeta, error)
}
