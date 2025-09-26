#!/usr/bin/env python3
"""
Initialize or rebuild Elasticsearch index for knowledge retrieval (mat_qa_chunks).

Usage:
  python scripts/es_init_index.py --host http://localhost:9200 --dims 1024 [--force]

Notes:
  - dims must match your embedding model dimension (e.g., text-embedding-v4 = 1024)
  - Requires 'elasticsearch' Python client: pip install elasticsearch==8.*
"""
import argparse
import sys
from elasticsearch import Elasticsearch


def ensure_index(es: Elasticsearch, index: str, force: bool, dims: int):
    exists = es.indices.exists(index=index)
    if exists and force:
        es.indices.delete(index=index, ignore=[404])
        exists = False

    if not exists:
        body = {
            "settings": {
                "number_of_shards": 1,
                "number_of_replicas": 0
            },
            "mappings": {
                "properties": {
                    "id": {"type": "keyword"},
                    "document_id": {"type": "keyword"},
                    "chunk_index": {"type": "integer"},
                    "title": {"type": "text"},
                    "content": {"type": "text"},
                    "general_model": {"type": "keyword"},
                    "vectorization_strategy": {"type": "keyword"},
                    "metadata": {"type": "object", "enabled": True},
                    "created_at": {"type": "date"},
                    "updated_at": {"type": "date"},
                    "general_embedding": {
                        "type": "dense_vector",
                        "dims": dims,
                        "index": False
                    }
                }
            }
        }
        es.indices.create(index=index, body=body)
        return {"created": True, "index": index, "dims": dims}
    else:
        return {"created": False, "index": index, "message": "exists"}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--host', default='http://localhost:9200', help='Elasticsearch host URL')
    parser.add_argument('--index', default='mat_qa_chunks', help='Index name')
    parser.add_argument('--dims', type=int, default=1024, help='Vector dimension')
    parser.add_argument('--force', action='store_true', help='Force rebuild index')
    args = parser.parse_args()

    try:
        es = Elasticsearch(hosts=[args.host], verify_certs=False)
        res = ensure_index(es, args.index, args.force, args.dims)
        print(res)
    except Exception as e:
        print(f"Failed to init index: {e}")
        sys.exit(1)


if __name__ == '__main__':
    main()

