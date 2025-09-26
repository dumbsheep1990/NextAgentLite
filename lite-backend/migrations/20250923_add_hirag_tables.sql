-- HiRAG minimal tables: community reports and per-collection configs
-- Safe to run multiple times (IF NOT EXISTS guards)

CREATE TABLE IF NOT EXISTS hirag_community_reports (
    id SERIAL PRIMARY KEY,
    community_id VARCHAR(100) UNIQUE NOT NULL,
    collection_id VARCHAR(50) REFERENCES knowledge_collections(id) ON DELETE SET NULL,
    level INTEGER NOT NULL DEFAULT 1,
    parent_community_id VARCHAR(100),
    title VARCHAR(500),
    summary TEXT,
    impact_rating REAL,
    rating_explanation TEXT,
    detailed_findings JSONB,
    entities JSONB,
    entity_count INTEGER,
    relationship_count INTEGER,
    generation_model VARCHAR(100),
    generation_prompt TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_hirag_community_level ON hirag_community_reports(level);
CREATE INDEX IF NOT EXISTS idx_hirag_community_collection ON hirag_community_reports(collection_id);
CREATE INDEX IF NOT EXISTS idx_hirag_community_entities ON hirag_community_reports USING GIN(entities);

CREATE TABLE IF NOT EXISTS hirag_configs (
    id SERIAL PRIMARY KEY,
    collection_id VARCHAR(50) REFERENCES knowledge_collections(id) ON DELETE SET NULL,
    config_type VARCHAR(50),         -- 'indexing' | 'retrieval'
    config_data JSONB,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_hirag_configs_collection_type ON hirag_configs(collection_id, config_type);
