package database

import (
    "context"
    "time"
)

// UpsertChatModelMeta: Postgres
func (db *Postgres) UpsertChatModelMeta(ctx context.Context, meta *ChatModelMeta) error {
    now := time.Now()
    meta.UpdatedAt = now
    if meta.CreatedAt.IsZero() {
        meta.CreatedAt = now
    }
    // try update first
    tx := db.db.WithContext(ctx).Model(&ChatModelMeta{}).
        Where("provider = ? AND model_id = ?", meta.Provider, meta.ModelID).
        Updates(map[string]interface{}{
            "supports_tools": meta.SupportsTools,
            "last_test_at":   meta.LastTestAt,
            "last_error":     meta.LastError,
            "updated_at":     meta.UpdatedAt,
        })
    if tx.Error != nil {
        return tx.Error
    }
    if tx.RowsAffected > 0 {
        return nil
    }
    return db.db.WithContext(ctx).Create(meta).Error
}

func (db *Postgres) ListChatModelMeta(ctx context.Context, provider string) ([]*ChatModelMeta, error) {
    var items []*ChatModelMeta
    q := db.db.WithContext(ctx).Model(&ChatModelMeta{})
    if provider != "" {
        q = q.Where("provider = ?", provider)
    }
    if err := q.Order("updated_at desc").Find(&items).Error; err != nil {
        return nil, err
    }
    return items, nil
}

// UpsertChatModelMeta: SQLite
func (db *SQLite) UpsertChatModelMeta(ctx context.Context, meta *ChatModelMeta) error {
    now := time.Now()
    meta.UpdatedAt = now
    if meta.CreatedAt.IsZero() {
        meta.CreatedAt = now
    }
    tx := db.db.WithContext(ctx).Model(&ChatModelMeta{}).
        Where("provider = ? AND model_id = ?", meta.Provider, meta.ModelID).
        Updates(map[string]interface{}{
            "supports_tools": meta.SupportsTools,
            "last_test_at":   meta.LastTestAt,
            "last_error":     meta.LastError,
            "updated_at":     meta.UpdatedAt,
        })
    if tx.Error != nil {
        return tx.Error
    }
    if tx.RowsAffected > 0 {
        return nil
    }
    return db.db.WithContext(ctx).Create(meta).Error
}

func (db *SQLite) ListChatModelMeta(ctx context.Context, provider string) ([]*ChatModelMeta, error) {
    var items []*ChatModelMeta
    q := db.db.WithContext(ctx).Model(&ChatModelMeta{})
    if provider != "" {
        q = q.Where("provider = ?", provider)
    }
    if err := q.Order("updated_at desc").Find(&items).Error; err != nil {
        return nil, err
    }
    return items, nil
}

// UpsertChatModelMeta: MySQL
func (db *MySQL) UpsertChatModelMeta(ctx context.Context, meta *ChatModelMeta) error {
    now := time.Now()
    meta.UpdatedAt = now
    if meta.CreatedAt.IsZero() {
        meta.CreatedAt = now
    }
    tx := db.db.WithContext(ctx).Model(&ChatModelMeta{}).
        Where("provider = ? AND model_id = ?", meta.Provider, meta.ModelID).
        Updates(map[string]interface{}{
            "supports_tools": meta.SupportsTools,
            "last_test_at":   meta.LastTestAt,
            "last_error":     meta.LastError,
            "updated_at":     meta.UpdatedAt,
        })
    if tx.Error != nil {
        return tx.Error
    }
    if tx.RowsAffected > 0 {
        return nil
    }
    return db.db.WithContext(ctx).Create(meta).Error
}

func (db *MySQL) ListChatModelMeta(ctx context.Context, provider string) ([]*ChatModelMeta, error) {
    var items []*ChatModelMeta
    q := db.db.WithContext(ctx).Model(&ChatModelMeta{})
    if provider != "" {
        q = q.Where("provider = ?", provider)
    }
    if err := q.Order("updated_at desc").Find(&items).Error; err != nil {
        return nil, err
    }
    return items, nil
}

