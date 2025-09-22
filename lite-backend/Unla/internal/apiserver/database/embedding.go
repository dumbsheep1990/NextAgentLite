package database

import (
    "context"
    "time"
)

// EmbeddingModel represents vector model config stored in Unla DB
type EmbeddingModel struct {
    ID          uint      `json:"id" gorm:"primaryKey;autoIncrement"`
    Provider    string    `json:"provider" gorm:"type:varchar(64);index"`
    ModelID     string    `json:"model_id" gorm:"type:varchar(256);index"`
    DisplayName string    `json:"display_name" gorm:"type:varchar(256)"`
    BaseURL     string    `json:"base_url,omitempty" gorm:"type:varchar(512)"`
    APIKeyEnc   string    `json:"-" gorm:"type:text"`
    Dimension   int       `json:"dimension,omitempty"`
    ContextWindow int     `json:"context_window,omitempty"`
    Status      string    `json:"status" gorm:"type:varchar(16);default:'active'"`
    CreatedAt   time.Time `json:"created_at"`
    UpdatedAt   time.Time `json:"updated_at"`
}

// EmbeddingDefaults holds default embedding selection
type EmbeddingDefaults struct {
    ID               uint      `json:"id" gorm:"primaryKey"`
    DefaultEmbedding string    `json:"default_embedding" gorm:"type:varchar(256)"`
    UpdatedAt        time.Time `json:"updated_at"`
}

// Embedding repository methods on Database
func (db *Postgres) ListEmbeddingModels(ctx context.Context, provider string) ([]*EmbeddingModel, error) {
    var items []*EmbeddingModel
    q := db.db.WithContext(ctx).Model(&EmbeddingModel{})
    if provider != "" { q = q.Where("provider = ?", provider) }
    if err := q.Order("id desc").Find(&items).Error; err != nil { return nil, err }
    return items, nil
}

func (db *Postgres) CreateEmbeddingModel(ctx context.Context, m *EmbeddingModel) error {
    return db.db.WithContext(ctx).Create(m).Error
}

func (db *Postgres) GetEmbeddingDefaults(ctx context.Context) (*EmbeddingDefaults, error) {
    var d EmbeddingDefaults
    if err := db.db.WithContext(ctx).First(&d, 1).Error; err != nil { return &EmbeddingDefaults{}, nil }
    return &d, nil
}

func (db *Postgres) SetEmbeddingDefaults(ctx context.Context, embedding string) error {
    var d EmbeddingDefaults
    if err := db.db.WithContext(ctx).First(&d, 1).Error; err != nil {
        d = EmbeddingDefaults{ID: 1, DefaultEmbedding: embedding, UpdatedAt: time.Now()}
        return db.db.WithContext(ctx).Create(&d).Error
    }
    d.DefaultEmbedding = embedding
    d.UpdatedAt = time.Now()
    return db.db.WithContext(ctx).Save(&d).Error
}

func (db *Postgres) SetEmbeddingModelStatus(ctx context.Context, provider, modelID, status string) error {
    return db.db.WithContext(ctx).Model(&EmbeddingModel{}).
        Where("provider = ? AND model_id = ?", provider, modelID).
        Update("status", status).Error
}

func (db *Postgres) UpdateEmbeddingModel(ctx context.Context, provider, modelID string, updates map[string]interface{}) error {
    if len(updates) == 0 { return nil }
    return db.db.WithContext(ctx).Model(&EmbeddingModel{}).
        Where("provider = ? AND model_id = ?", provider, modelID).
        Updates(updates).Error
}

// SQLite
func (db *SQLite) ListEmbeddingModels(ctx context.Context, provider string) ([]*EmbeddingModel, error) {
    var items []*EmbeddingModel
    q := db.db.WithContext(ctx).Model(&EmbeddingModel{})
    if provider != "" { q = q.Where("provider = ?", provider) }
    if err := q.Order("id desc").Find(&items).Error; err != nil { return nil, err }
    return items, nil
}

func (db *SQLite) CreateEmbeddingModel(ctx context.Context, m *EmbeddingModel) error {
    return db.db.WithContext(ctx).Create(m).Error
}

func (db *SQLite) GetEmbeddingDefaults(ctx context.Context) (*EmbeddingDefaults, error) {
    var d EmbeddingDefaults
    if err := db.db.WithContext(ctx).First(&d, 1).Error; err != nil { return &EmbeddingDefaults{}, nil }
    return &d, nil
}

func (db *SQLite) SetEmbeddingDefaults(ctx context.Context, embedding string) error {
    var d EmbeddingDefaults
    if err := db.db.WithContext(ctx).First(&d, 1).Error; err != nil {
        d = EmbeddingDefaults{ID: 1, DefaultEmbedding: embedding, UpdatedAt: time.Now()}
        return db.db.WithContext(ctx).Create(&d).Error
    }
    d.DefaultEmbedding = embedding
    d.UpdatedAt = time.Now()
    return db.db.WithContext(ctx).Save(&d).Error
}

func (db *SQLite) SetEmbeddingModelStatus(ctx context.Context, provider, modelID, status string) error {
    return db.db.WithContext(ctx).Model(&EmbeddingModel{}).
        Where("provider = ? AND model_id = ?", provider, modelID).
        Update("status", status).Error
}

func (db *SQLite) UpdateEmbeddingModel(ctx context.Context, provider, modelID string, updates map[string]interface{}) error {
    if len(updates) == 0 { return nil }
    return db.db.WithContext(ctx).Model(&EmbeddingModel{}).
        Where("provider = ? AND model_id = ?", provider, modelID).
        Updates(updates).Error
}

// MySQL
func (db *MySQL) ListEmbeddingModels(ctx context.Context, provider string) ([]*EmbeddingModel, error) {
    var items []*EmbeddingModel
    q := db.db.WithContext(ctx).Model(&EmbeddingModel{})
    if provider != "" { q = q.Where("provider = ?", provider) }
    if err := q.Order("id desc").Find(&items).Error; err != nil { return nil, err }
    return items, nil
}

func (db *MySQL) CreateEmbeddingModel(ctx context.Context, m *EmbeddingModel) error {
    return db.db.WithContext(ctx).Create(m).Error
}

func (db *MySQL) GetEmbeddingDefaults(ctx context.Context) (*EmbeddingDefaults, error) {
    var d EmbeddingDefaults
    if err := db.db.WithContext(ctx).First(&d, 1).Error; err != nil { return &EmbeddingDefaults{}, nil }
    return &d, nil
}

func (db *MySQL) SetEmbeddingDefaults(ctx context.Context, embedding string) error {
    var d EmbeddingDefaults
    if err := db.db.WithContext(ctx).First(&d, 1).Error; err != nil {
        d = EmbeddingDefaults{ID: 1, DefaultEmbedding: embedding, UpdatedAt: time.Now()}
        return db.db.WithContext(ctx).Create(&d).Error
    }
    d.DefaultEmbedding = embedding
    d.UpdatedAt = time.Now()
    return db.db.WithContext(ctx).Save(&d).Error
}

func (db *MySQL) SetEmbeddingModelStatus(ctx context.Context, provider, modelID, status string) error {
    return db.db.WithContext(ctx).Model(&EmbeddingModel{}).
        Where("provider = ? AND model_id = ?", provider, modelID).
        Update("status", status).Error
}

func (db *MySQL) UpdateEmbeddingModel(ctx context.Context, provider, modelID string, updates map[string]interface{}) error {
    if len(updates) == 0 { return nil }
    return db.db.WithContext(ctx).Model(&EmbeddingModel{}).
        Where("provider = ? AND model_id = ?", provider, modelID).
        Updates(updates).Error
}
