-- PostgreSQL Initialization Data Export  
-- Generated from zzdsj_demo database
-- Date: 2025-08-27

-- ============================================================================
-- SYSTEM CONFIGURATIONS
-- ============================================================================

INSERT INTO system_configs (id, category, key, value, description, is_public, created_at, updated_at) VALUES
('vector-search-config', 'search', 'vector_settings', '{"use_rerank": true, "rerank_top_k": 100, "default_top_k": 20, "fusion_weights": {"vector": 0.7, "keyword": 0.3}, "similarity_threshold": 0.7}', '向量检索配置', true, CURRENT_TIMESTAMP, NULL),
('llm-safety-config', 'llm', 'safety_settings', '{"blocked_topics": ["harmful", "illegal"], "content_filter": true, "rate_limit_per_user": 100, "max_tokens_per_request": 4096}', 'LLM安全配置', false, CURRENT_TIMESTAMP, NULL),
('performance-config', 'system', 'performance_settings', '{"cache_ttl": 3600, "enable_caching": true, "timeout_seconds": 300, "max_concurrent_requests": 50}', '系统性能配置', true, CURRENT_TIMESTAMP, NULL),
('notification-config', 'system', 'notification_settings', '{"log_level": "INFO", "email_enabled": false, "webhook_enabled": true, "alert_thresholds": {"error_rate": 0.05, "response_time": 5000}}', '通知配置', false, CURRENT_TIMESTAMP, NULL);

-- ============================================================================
-- DEFAULT CHUNKING CONFIGURATIONS  
-- ============================================================================

INSERT INTO chunking_configs (id, name, description, chunk_overlap, strategy, is_default, created_at, updated_at, chunk_token_num, max_token_num, delimiter, tokenizer_type, preserve_structure, semantic_threshold, supported_formats, is_active, scope, collection_id) VALUES
(gen_random_uuid(), '默认语义切分', '系统默认的语义切分配置', 200, 'semantic', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 400, 512, '!?。！？', 'simple', true, 30, '["pdf", "docx", "txt", "md"]', true, 'global', NULL),
(gen_random_uuid(), '长文本切分', '适用于长篇文档的切分策略', 300, 'semantic', false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 800, 1024, '!?。！？', 'simple', true, 25, '["pdf", "docx", "txt"]', true, 'global', NULL),
(gen_random_uuid(), '技术文档切分', '适用于技术文档的切分策略', 150, 'hybrid', false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 300, 400, '.!?；。！？', 'advanced', true, 35, '["pdf", "docx", "md", "html"]', true, 'global', NULL);

-- ============================================================================  
-- DEFAULT MODEL CONFIGURATIONS
-- ============================================================================

INSERT INTO model_configs (id, name, type, provider, model, api_key, base_url, parameters, is_active, max_tokens, temperature, dimension, created_at, updated_at) VALUES
('qwen-embedding-v4', 'Qwen嵌入模型v4', 'embedding', 'alibaba', 'text-embedding-v4', NULL, NULL, '{"batch_size": 32, "normalization": "l2"}', true, NULL, NULL, 1024, CURRENT_TIMESTAMP, NULL),
('qwen3-30b-instruct', 'Qwen3 30B指令模型', 'chat', 'alibaba', 'qwen3-30b-instruct', NULL, NULL, '{"stream": true, "stop_sequences": ["<|endoftext|>"]}', true, 4096, 0.7, NULL, CURRENT_TIMESTAMP, NULL),
('matbert-domain', 'MatBERT领域嵌入模型', 'embedding', 'custom', 'matbert-v1', NULL, 'http://localhost:8002', '{"domain": "materials", "language": "zh"}', true, NULL, NULL, 768, CURRENT_TIMESTAMP, NULL);

-- ============================================================================
-- DEFAULT USERS (for testing)
-- ============================================================================

INSERT INTO users (id, username, email, hashed_password, full_name, is_active, is_superuser, organization, role, research_interests, created_at, updated_at, last_login, password_hash) VALUES
(1, 'admin', 'admin@matqa.com', '$2b$12$example.hash.placeholder', '系统管理员', true, true, '系统', 'admin', '系统管理', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, NULL, '$2b$12$example.hash.placeholder'),
(2, 'demo_user', 'demo@matqa.com', '$2b$12$example.hash.placeholder', '演示用户', true, false, '演示组织', 'user', '材料科学研究', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, NULL, '$2b$12$example.hash.placeholder');

-- Note: 实际部署时需要修改密码哈希值

-- ============================================================================
-- DEFAULT DOCUMENT CATEGORIES
-- ============================================================================

INSERT INTO document_categories (id, name, display_name, description, parent_id, level, path, storage_prefix, retention_policy, importance_level, is_active, metadata, created_at, updated_at) VALUES
('materials-root', 'materials', '材料科学', '材料科学相关文档', NULL, 1, '/materials', 'materials/', '{"retention_years": 10}', 'high', true, '{}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('geopolymer', 'geopolymer', '地聚物材料', '地聚物材料相关研究文档', 'materials-root', 2, '/materials/geopolymer', 'materials/geopolymer/', '{"retention_years": 10}', 'high', true, '{}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('synthesis', 'synthesis', '合成工艺', '材料合成工艺文档', 'materials-root', 2, '/materials/synthesis', 'materials/synthesis/', '{"retention_years": 8}', 'medium', true, '{}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('characterization', 'characterization', '性能表征', '材料性能测试与表征', 'materials-root', 2, '/materials/characterization', 'materials/characterization/', '{"retention_years": 8}', 'medium', true, '{}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- ============================================================================
-- DEFAULT METADATA TEMPLATES
-- ============================================================================

INSERT INTO metadata_templates (id, name, description, version, template_schema, ui_schema, validation_rules, is_active, is_system, category, tags, usage_count, created_at, updated_at, created_by) VALUES
('material-paper-template', '材料学术论文模板', '用于材料科学学术论文的元数据模板', '1.0', 
'{"type": "object", "properties": {"title": {"type": "string", "title": "论文标题"}, "authors": {"type": "array", "title": "作者列表"}, "journal": {"type": "string", "title": "期刊名称"}, "doi": {"type": "string", "title": "DOI"}, "publication_date": {"type": "string", "format": "date", "title": "发表日期"}, "keywords": {"type": "array", "title": "关键词"}, "abstract": {"type": "string", "title": "摘要"}}}',
'{"title": {"ui:widget": "textarea"}, "abstract": {"ui:widget": "textarea", "ui:options": {"rows": 5}}}',
'{"required": ["title", "authors"]}', 
true, true, '学术文献', '{"academic", "materials", "paper"}', 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 1),

('general-document-template', '通用文档模板', '适用于一般文档的基础元数据模板', '1.0',
'{"type": "object", "properties": {"title": {"type": "string", "title": "文档标题"}, "category": {"type": "string", "title": "文档分类"}, "tags": {"type": "array", "title": "标签"}, "description": {"type": "string", "title": "文档描述"}, "language": {"type": "string", "title": "语言", "default": "zh"}}}',
'{"description": {"ui:widget": "textarea"}}',
'{"required": ["title", "category"]}',
true, true, '通用', '{"general", "basic"}', 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 1);

-- ============================================================================
-- SCHEMA MIGRATIONS RECORD
-- ============================================================================

INSERT INTO schema_migrations (version, description, applied_at, checksum) VALUES
('1.0.0', 'Initial database schema creation', CURRENT_TIMESTAMP, 'abc123def456'),
('1.1.0', 'Add vector support and chunking configs', CURRENT_TIMESTAMP, 'def456ghi789'),
('1.2.0', 'Add team execution system', CURRENT_TIMESTAMP, 'ghi789jkl012'),
('1.3.0', 'Add multimodal and graph support', CURRENT_TIMESTAMP, 'jkl012mno345');

-- ============================================================================
-- PERFORMANCE STATISTICS INITIALIZATION
-- ============================================================================

-- 初始化图谱统计
INSERT INTO graph_stats (id, node_count, edge_count, avg_connections, type_distribution, last_updated, graph_version) VALUES
('global', 0, 0, 0.0, '{}', CURRENT_TIMESTAMP, '1.0');

-- 初始化向量配置
INSERT INTO vector_configs (id, name, description, model_name, model_provider, dimension, normalization_type, distance_metric, is_active, created_at, updated_at) VALUES
('general-vector-config', '通用向量配置', '默认的向量化配置', 'text-embedding-v4', 'alibaba', 1024, 'l2', 'cosine', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('domain-vector-config', '领域向量配置', '材料领域专用向量配置', 'matbert-v1', 'custom', 768, 'l2', 'cosine', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);