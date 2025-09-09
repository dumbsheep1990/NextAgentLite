# Elasticsearch Configuration Export

**Database**: NextAgent Lite Elasticsearch Indices  
**Server**: https://103.6.168.6:9200  
**Export Date**: 2025-08-27  

## Connection Configuration

```yaml
elasticsearch:
  hosts: ["https://103.6.168.6:9200"]
  username: "elastic"
  password: "n_pehJf6G7WsW4=5zkpq"
  verify_certs: false
  ssl_show_warn: false
  request_timeout: 30
  max_retries: 3
```

## Index Overview

The system uses 7 main index patterns:

1. **mat_qa_chunks** - Document chunks with dual vector embeddings (general + domain)
2. **mat_qa_general_vectors** - Standalone general vector index
3. **mat_qa_domain_vectors** - Standalone domain-specific vector index
4. **mat_qa_papers** - Academic papers with semantic analysis
5. **mat_qa_documents** - Knowledge base documents metadata
6. **mat_qa_retrieval_cache** - Search result caching
7. **mat_qa_media** - Multimodal media files (images, videos)

## Key Features

### Vector Search Support
- **General Embeddings**: 2048-dimension (text-embedding-v4)
- **Domain Embeddings**: 768-dimension (MatBERT)
- **Similarity**: Cosine similarity for all vectors
- **Hybrid Search**: Combines vector + keyword search

### Language Analysis
- **Chinese Analyzer**: Custom tokenizer with Chinese stop words
- **English Analyzer**: Standard with stemming
- **Mixed Analyzer**: Handles multilingual content
- **Academic Analyzer**: Specialized for research papers

### Performance Settings
- **Shards**: 1 per index (single node setup)
- **Replicas**: 0 (development environment)
- **Max Result Window**: 50,000 results
- **Refresh Interval**: 30s for cache indices

## Index Templates Location

Complete index templates are stored in:
- `elasticsearch_index_templates.json` - Complete configuration file

## Setup Commands

### 1. Create Index Templates
```bash
# Apply all index templates
curl -X PUT "https://103.6.168.6:9200/_index_template/mat_qa_chunks" \
  -u "elastic:n_pehJf6G7WsW4=5zkpq" \
  -H "Content-Type: application/json" \
  -d @chunks_template.json

# Repeat for all 7 index templates
```

### 2. Create Index Aliases
```bash
curl -X POST "https://103.6.168.6:9200/_aliases" \
  -u "elastic:n_pehJf6G7WsW4=5zkpq" \
  -H "Content-Type: application/json" \
  -d '{
    "actions": [
      {"add": {"index": "mat_qa_chunks", "alias": "chunks"}},
      {"add": {"index": "mat_qa_papers", "alias": "papers"}},
      {"add": {"index": "mat_qa_documents", "alias": "documents"}},
      {"add": {"index": "mat_qa_retrieval_cache", "alias": "cache"}},
      {"add": {"index": "mat_qa_media", "alias": "media"}}
    ]
  }'
```

### 3. Verify Setup
```bash
# Check cluster health
curl -u "elastic:n_pehJf6G7WsW4=5zkpq" \
  "https://103.6.168.6:9200/_cluster/health?pretty"

# List all indices
curl -u "elastic:n_pehJf6G7WsW4=5zkpq" \
  "https://103.6.168.6:9200/_cat/indices?v"

# Check index templates
curl -u "elastic:n_pehJf6G7WsW4=5zkpq" \
  "https://103.6.168.6:9200/_index_template"
```

## Sample Queries

The configuration includes several pre-defined query patterns:

1. **Hybrid Search** - Combines vector and keyword search
2. **Semantic Search** - Pure vector similarity search  
3. **Dual Vector Search** - Uses both general and domain embeddings
4. **Filtered Search** - Keyword search with filters

## Migration Notes

When migrating to a new Elasticsearch cluster:

1. **Apply index templates first** before creating any indices
2. **Adjust shard/replica settings** based on cluster size
3. **Update connection credentials** in application configuration
4. **Test vector search functionality** with sample embeddings
5. **Verify analysis chain** with sample Chinese/English text

## Dependencies

- **Elasticsearch**: 7.17+ or 8.x (tested with 8.x)
- **Plugins Required**: 
  - ICU Analysis Plugin (for international text)
  - Vector search support (built-in from 8.0+)
- **JVM Memory**: Minimum 2GB heap size recommended