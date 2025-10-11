package database

import "time"

// ChatModelMeta stores capability test results per provider+model
type ChatModelMeta struct {
    ID            uint       `json:"id" gorm:"primaryKey"`
    Provider      string     `json:"provider" gorm:"type:varchar(64);index:idx_provider_model,unique"`
    ModelID       string     `json:"model_id" gorm:"type:varchar(256);index:idx_provider_model,unique"`
    SupportsTools *bool      `json:"supports_tools" gorm:"default:null"`
    LastTestAt    *time.Time `json:"last_test_at"`
    LastError     string     `json:"last_error" gorm:"type:text"`
    CreatedAt     time.Time  `json:"created_at"`
    UpdatedAt     time.Time  `json:"updated_at"`
}

