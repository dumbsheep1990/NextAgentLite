package database

import (
    "context"
    "time"
)

// RerankModel represents rerank model config stored in Unla DB
type RerankModel struct {
    ID          uint      `json:"id" gorm:"primaryKey;autoIncrement"`
    Provider    string    `json:"provider" gorm:"type:varchar(64);index"`
    ModelID     string    `json:"model_id" gorm:"type:varchar(256);index"`
    DisplayName string    `json:"display_name" gorm:"type:varchar(256)"`
    BaseURL     string    `json:"base_url,omitempty" gorm:"type:varchar(512)"`
    APIKeyEnc   string    `json:"-" gorm:"type:text"`
    Status      string    `json:"status" gorm:"type:varchar(16);default:'active'"`
    CreatedAt   time.Time `json:"created_at"`
    UpdatedAt   time.Time `json:"updated_at"`
}

// RerankDefaults holds default rerank selection
type RerankDefaults struct {
    ID            uint      `json:"id" gorm:"primaryKey"`
    DefaultRerank string    `json:"default_rerank" gorm:"type:varchar(256)"`
    UpdatedAt     time.Time `json:"updated_at"`
}

// Postgres
func (db *Postgres) ListRerankModels(ctx context.Context, provider string) ([]*RerankModel, error) {
    var items []*RerankModel
    q := db.db.WithContext(ctx).Model(&RerankModel{})
    if provider != "" { q = q.Where("provider = ?", provider) }
    if err := q.Order("id desc").Find(&items).Error; err != nil { return nil, err }
    return items, nil
}

func (db *Postgres) CreateRerankModel(ctx context.Context, m *RerankModel) error {
    return db.db.WithContext(ctx).Create(m).Error
}

func (db *Postgres) GetRerankDefaults(ctx context.Context) (*RerankDefaults, error) {
    var d RerankDefaults
    if err := db.db.WithContext(ctx).First(&d, 1).Error; err != nil { return &RerankDefaults{}, nil }
    return &d, nil
}

func (db *Postgres) SetRerankDefaults(ctx context.Context, rerank string) error {
    var d RerankDefaults
    if err := db.db.WithContext(ctx).First(&d, 1).Error; err != nil {
        d = RerankDefaults{ID: 1, DefaultRerank: rerank, UpdatedAt: time.Now()}
        return db.db.WithContext(ctx).Create(&d).Error
    }
    d.DefaultRerank = rerank
    d.UpdatedAt = time.Now()
    return db.db.WithContext(ctx).Save(&d).Error
}

func (db *Postgres) SetRerankModelStatus(ctx context.Context, provider, modelID, status string) error {
    return db.db.WithContext(ctx).Model(&RerankModel{}).
        Where("provider = ? AND model_id = ?", provider, modelID).
        Update("status", status).Error
}

func (db *Postgres) UpdateRerankModel(ctx context.Context, provider, modelID string, updates map[string]interface{}) error {
    if len(updates) == 0 { return nil }
    return db.db.WithContext(ctx).Model(&RerankModel{}).
        Where("provider = ? AND model_id = ?", provider, modelID).
        Updates(updates).Error
}

// SQLite
func (db *SQLite) ListRerankModels(ctx context.Context, provider string) ([]*RerankModel, error) {
    var items []*RerankModel
    q := db.db.WithContext(ctx).Model(&RerankModel{})
    if provider != "" { q = q.Where("provider = ?", provider) }
    if err := q.Order("id desc").Find(&items).Error; err != nil { return nil, err }
    return items, nil
}

func (db *SQLite) CreateRerankModel(ctx context.Context, m *RerankModel) error {
    return db.db.WithContext(ctx).Create(m).Error
}

func (db *SQLite) GetRerankDefaults(ctx context.Context) (*RerankDefaults, error) {
    var d RerankDefaults
    if err := db.db.WithContext(ctx).First(&d, 1).Error; err != nil { return &RerankDefaults{}, nil }
    return &d, nil
}

func (db *SQLite) SetRerankDefaults(ctx context.Context, rerank string) error {
    var d RerankDefaults
    if err := db.db.WithContext(ctx).First(&d, 1).Error; err != nil {
        d = RerankDefaults{ID: 1, DefaultRerank: rerank, UpdatedAt: time.Now()}
        return db.db.WithContext(ctx).Create(&d).Error
    }
    d.DefaultRerank = rerank
    d.UpdatedAt = time.Now()
    return db.db.WithContext(ctx).Save(&d).Error
}

func (db *SQLite) SetRerankModelStatus(ctx context.Context, provider, modelID, status string) error {
    return db.db.WithContext(ctx).Model(&RerankModel{}).
        Where("provider = ? AND model_id = ?", provider, modelID).
        Update("status", status).Error
}

func (db *SQLite) UpdateRerankModel(ctx context.Context, provider, modelID string, updates map[string]interface{}) error {
    if len(updates) == 0 { return nil }
    return db.db.WithContext(ctx).Model(&RerankModel{}).
        Where("provider = ? AND model_id = ?", provider, modelID).
        Updates(updates).Error
}

// MySQL
func (db *MySQL) ListRerankModels(ctx context.Context, provider string) ([]*RerankModel, error) {
    var items []*RerankModel
    q := db.db.WithContext(ctx).Model(&RerankModel{})
    if provider != "" { q = q.Where("provider = ?", provider) }
    if err := q.Order("id desc").Find(&items).Error; err != nil { return nil, err }
    return items, nil
}

func (db *MySQL) CreateRerankModel(ctx context.Context, m *RerankModel) error {
    return db.db.WithContext(ctx).Create(m).Error
}

func (db *MySQL) GetRerankDefaults(ctx context.Context) (*RerankDefaults, error) {
    var d RerankDefaults
    if err := db.db.WithContext(ctx).First(&d, 1).Error; err != nil { return &RerankDefaults{}, nil }
    return &d, nil
}

func (db *MySQL) SetRerankDefaults(ctx context.Context, rerank string) error {
    var d RerankDefaults
    if err := db.db.WithContext(ctx).First(&d, 1).Error; err != nil {
        d = RerankDefaults{ID: 1, DefaultRerank: rerank, UpdatedAt: time.Now()}
        return db.db.WithContext(ctx).Create(&d).Error
    }
    d.DefaultRerank = rerank
    d.UpdatedAt = time.Now()
    return db.db.WithContext(ctx).Save(&d).Error
}

func (db *MySQL) SetRerankModelStatus(ctx context.Context, provider, modelID, status string) error {
    return db.db.WithContext(ctx).Model(&RerankModel{}).
        Where("provider = ? AND model_id = ?", provider, modelID).
        Update("status", status).Error
}

func (db *MySQL) UpdateRerankModel(ctx context.Context, provider, modelID string, updates map[string]interface{}) error {
    if len(updates) == 0 { return nil }
    return db.db.WithContext(ctx).Model(&RerankModel{}).
        Where("provider = ? AND model_id = ?", provider, modelID).
        Updates(updates).Error
}

