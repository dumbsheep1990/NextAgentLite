-- Indexes and Constraints Export
-- Generated from zzdsj_demo database
-- Date: 2025-08-27
-- Updated: 2025-08-28 - Added indexes for new knowledge_documents metadata fields

-- ============================================================================
-- PERFORMANCE INDEXES
-- ============================================================================

-- Agent Tool Calls Indexes
CREATE INDEX idx_agent_tool_calls_agent_id ON agent_tool_calls(agent_id);
CREATE INDEX idx_agent_tool_calls_execution_id ON agent_tool_calls(execution_id);

-- API Access Logs Indexes
CREATE INDEX idx_api_access_logs_created_at ON api_access_logs(created_at);
CREATE INDEX idx_api_access_logs_endpoint ON api_access_logs(endpoint);
CREATE INDEX idx_api_access_logs_user_id ON api_access_logs(user_id);

-- Chunking Configs Indexes
CREATE INDEX idx_chunking_configs_collection_id ON chunking_configs(collection_id);
CREATE INDEX idx_chunking_configs_scope ON chunking_configs(scope);
CREATE UNIQUE INDEX idx_chunking_configs_unique_name ON chunking_configs(name, COALESCE(collection_id, ''));

-- Conversation Indexes
CREATE UNIQUE INDEX conversations_session_id_key ON conversations(session_id);

-- Document Category Mappings Indexes
CREATE UNIQUE INDEX document_category_mappings_document_id_category_id_key ON document_category_mappings(document_id, category_id);

-- Vector Similarity Indexes (requires pgvector extension)
CREATE INDEX idx_chunks_domain_embedding_vector ON document_chunks USING ivfflat (domain_embedding_vector vector_cosine_ops) WITH (lists=100);
CREATE INDEX idx_chunks_general_embedding_vector ON document_chunks USING ivfflat (general_embedding_vector vector_cosine_ops) WITH (lists=100);

-- QA Pairs Vector Indexes
CREATE INDEX idx_qa_pairs_question_vector ON qa_pairs USING ivfflat (question_vector vector_cosine_ops) WITH (lists=100);
CREATE INDEX idx_qa_pairs_answer_vector ON qa_pairs USING ivfflat (answer_vector vector_cosine_ops) WITH (lists=100);

-- File Processing Indexes
CREATE INDEX idx_file_processing_tasks_status ON file_processing_tasks(status);
CREATE INDEX idx_file_processing_tasks_task_type ON file_processing_tasks(task_type);

-- Graph Layout Indexes
CREATE UNIQUE INDEX graph_layouts_name_key ON graph_layouts(layout_name);

-- Knowledge Collections Indexes
CREATE INDEX idx_knowledge_collections_chunking_config ON knowledge_collections(default_chunking_config_id);
CREATE INDEX ix_knowledge_collections_document_count ON knowledge_collections(document_count);
CREATE INDEX ix_knowledge_collections_id ON knowledge_collections(id);
CREATE INDEX ix_knowledge_collections_is_active ON knowledge_collections(is_active);
CREATE INDEX ix_knowledge_collections_is_default ON knowledge_collections(is_default);

-- Knowledge Documents Indexes
CREATE INDEX ix_knowledge_documents_collection_id ON knowledge_documents(collection_id);
CREATE INDEX ix_knowledge_documents_status ON knowledge_documents(status);
CREATE INDEX ix_knowledge_documents_file_type ON knowledge_documents(file_type);
CREATE INDEX ix_knowledge_documents_created_at ON knowledge_documents(created_at);
-- Metadata template and extraction indexes (added 2025-08-28)
CREATE INDEX idx_knowledge_docs_metadata_template_id ON knowledge_documents(metadata_template_id);
CREATE INDEX idx_knowledge_docs_document_category ON knowledge_documents(document_category);
CREATE INDEX idx_knowledge_docs_domain_type ON knowledge_documents(domain_type);
CREATE INDEX idx_knowledge_docs_extraction_status ON knowledge_documents(metadata_extraction_status);

-- Task Queue Indexes
CREATE INDEX idx_task_queue_status ON task_queue(status);
CREATE INDEX idx_task_queue_task_type ON task_queue(task_type);
CREATE INDEX idx_task_queue_priority ON task_queue(priority);
CREATE INDEX idx_task_queue_scheduled_at ON task_queue(scheduled_at);

-- Team Execution Indexes
CREATE INDEX idx_team_executions_session_id ON team_executions(session_id);
CREATE INDEX idx_team_executions_team_name ON team_executions(team_name);
CREATE INDEX idx_team_executions_status ON team_executions(status);
CREATE INDEX idx_team_executions_start_time ON team_executions(start_time);

-- User Session Indexes
CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_expires_at ON user_sessions(expires_at);

-- ============================================================================
-- FULL TEXT SEARCH INDEXES
-- ============================================================================

-- Document content search
CREATE INDEX idx_document_chunks_content_fts ON document_chunks USING gin(to_tsvector('english', content));
CREATE INDEX idx_knowledge_documents_title_fts ON knowledge_documents USING gin(to_tsvector('english', title));

-- QA pairs search
CREATE INDEX idx_qa_pairs_question_fts ON qa_pairs USING gin(to_tsvector('english', question));
CREATE INDEX idx_qa_pairs_answer_fts ON qa_pairs USING gin(to_tsvector('english', answer));

-- Conversation messages search
CREATE INDEX idx_conversation_messages_content_fts ON conversation_messages USING gin(to_tsvector('english', content));

-- ============================================================================
-- JSONB INDEXES
-- ============================================================================

-- JSONB GIN indexes for fast JSON queries
CREATE INDEX idx_document_chunks_metadata_gin ON document_chunks USING gin(chunk_metadata);
CREATE INDEX idx_knowledge_documents_metadata_gin ON knowledge_documents USING gin(document_metadata);
CREATE INDEX idx_system_configs_value_gin ON system_configs USING gin(value);
CREATE INDEX idx_task_queue_data_gin ON task_queue USING gin(task_data);
-- Structured metadata indexes (added 2025-08-28)
CREATE INDEX idx_knowledge_docs_structured_metadata_gin ON knowledge_documents USING gin(structured_metadata);
CREATE INDEX idx_knowledge_docs_extraction_log_gin ON knowledge_documents USING gin(metadata_extraction_log);

-- ============================================================================
-- UNIQUE CONSTRAINTS
-- ============================================================================

-- User constraints
ALTER TABLE users ADD CONSTRAINT users_username_key UNIQUE (username);
ALTER TABLE users ADD CONSTRAINT users_email_key UNIQUE (email);

-- QA dataset constraints
ALTER TABLE qa_pairs ADD CONSTRAINT qa_pairs_question_hash_dataset_key UNIQUE (question_hash, dataset_id);

-- System config constraints
ALTER TABLE system_configs ADD CONSTRAINT system_configs_category_key_unique UNIQUE (category, key);

-- Model config constraints
ALTER TABLE model_configs ADD CONSTRAINT model_configs_name_key UNIQUE (name);

-- ============================================================================
-- CHECK CONSTRAINTS
-- ============================================================================

-- Status value constraints
ALTER TABLE task_queue ADD CONSTRAINT task_queue_status_check CHECK (status IN ('pending', 'running', 'completed', 'failed', 'cancelled'));
ALTER TABLE team_executions ADD CONSTRAINT team_executions_status_check CHECK (status IN ('pending', 'running', 'completed', 'failed', 'cancelled'));

-- Priority constraints
ALTER TABLE task_queue ADD CONSTRAINT task_queue_priority_check CHECK (priority >= 0 AND priority <= 10);

-- Progress constraints
ALTER TABLE task_queue ADD CONSTRAINT task_queue_progress_check CHECK (progress_percentage >= 0 AND progress_percentage <= 100);
ALTER TABLE file_processing_tasks ADD CONSTRAINT file_processing_tasks_progress_check CHECK (progress >= 0 AND progress <= 100);

-- Confidence score constraints
ALTER TABLE qa_pairs ADD CONSTRAINT qa_pairs_confidence_check CHECK (confidence_score >= 0.0 AND confidence_score <= 1.0);
ALTER TABLE graph_nodes ADD CONSTRAINT graph_nodes_confidence_check CHECK (confidence >= 0.0 AND confidence <= 1.0);
ALTER TABLE graph_edges ADD CONSTRAINT graph_edges_confidence_check CHECK (confidence >= 0.0 AND confidence <= 1.0);