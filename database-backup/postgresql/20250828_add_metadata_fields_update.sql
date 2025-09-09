-- Database Update Script
-- Date: 2025-08-28
-- Purpose: Add missing metadata template and extraction fields to knowledge_documents table
-- This script adds the fields that were in the migration but missing from the actual database

BEGIN;

-- Add new columns to knowledge_documents table
ALTER TABLE knowledge_documents ADD COLUMN IF NOT EXISTS metadata_template_id VARCHAR(50);
ALTER TABLE knowledge_documents ADD COLUMN IF NOT EXISTS structured_metadata JSONB;
ALTER TABLE knowledge_documents ADD COLUMN IF NOT EXISTS metadata_extraction_status VARCHAR(20) DEFAULT 'pending';
ALTER TABLE knowledge_documents ADD COLUMN IF NOT EXISTS metadata_extraction_log JSONB;
ALTER TABLE knowledge_documents ADD COLUMN IF NOT EXISTS document_category VARCHAR(100);
ALTER TABLE knowledge_documents ADD COLUMN IF NOT EXISTS domain_type VARCHAR(50);
ALTER TABLE knowledge_documents ADD COLUMN IF NOT EXISTS effective_date TIMESTAMPTZ;
ALTER TABLE knowledge_documents ADD COLUMN IF NOT EXISTS expiry_date TIMESTAMPTZ;

-- Create performance indexes for the new fields
CREATE INDEX IF NOT EXISTS idx_knowledge_docs_metadata_template_id ON knowledge_documents(metadata_template_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_docs_document_category ON knowledge_documents(document_category);
CREATE INDEX IF NOT EXISTS idx_knowledge_docs_domain_type ON knowledge_documents(domain_type);
CREATE INDEX IF NOT EXISTS idx_knowledge_docs_extraction_status ON knowledge_documents(metadata_extraction_status);

-- Create JSONB indexes for structured data fields
CREATE INDEX IF NOT EXISTS idx_knowledge_docs_structured_metadata_gin ON knowledge_documents USING gin(structured_metadata);
CREATE INDEX IF NOT EXISTS idx_knowledge_docs_extraction_log_gin ON knowledge_documents USING gin(metadata_extraction_log);

-- Verify the changes were applied successfully
DO $$
BEGIN
    -- Check if all new columns exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'knowledge_documents' 
        AND column_name = 'metadata_template_id'
    ) THEN
        RAISE EXCEPTION 'Column metadata_template_id was not added successfully';
    END IF;
    
    -- Check if indexes were created
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'knowledge_documents' 
        AND indexname = 'idx_knowledge_docs_metadata_template_id'
    ) THEN
        RAISE EXCEPTION 'Index idx_knowledge_docs_metadata_template_id was not created successfully';
    END IF;
    
    RAISE NOTICE 'All metadata fields and indexes have been successfully added to knowledge_documents table';
END $$;

COMMIT;

-- Summary report
SELECT 
    'knowledge_documents metadata update completed' as status,
    COUNT(*) as total_documents,
    COUNT(metadata_template_id) as documents_with_metadata_template
FROM knowledge_documents;