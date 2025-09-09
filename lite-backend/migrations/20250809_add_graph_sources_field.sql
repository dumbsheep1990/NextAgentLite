-- 添加知识图谱检索结果字段到conversation_messages表
-- Migration: 20250809_add_graph_sources_field.sql
-- Date: 2025-08-09
-- Description: 添加graph_sources字段用于存储知识图谱检索结果

BEGIN;

-- 添加graph_sources字段
ALTER TABLE conversation_messages 
ADD COLUMN IF NOT EXISTS graph_sources JSONB;

-- 添加索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_conversation_messages_graph_sources 
ON conversation_messages USING gin(graph_sources);

-- 添加注释
COMMENT ON COLUMN conversation_messages.graph_sources IS '知识图谱检索结果，包含entities、relationships、sources等信息';

COMMIT;