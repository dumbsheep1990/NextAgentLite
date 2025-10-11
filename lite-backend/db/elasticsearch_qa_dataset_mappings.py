"""
QA数据集的ElasticSearch索引映射配置
"""

# QA问答对向量索引映射
QA_PAIRS_VECTOR_MAPPING = {
    "mappings": {
        "properties": {
            # 归属集合（便于按知识库过滤）
            "collection_id": {
                "type": "keyword"
            },
            # 基本信息
            "qa_pair_id": {
                "type": "keyword"
            },
            "dataset_id": {
                "type": "keyword"
            },
            "category": {
                "type": "keyword"
            },
            
            # 问答内容
            "question": {
                "type": "text",
                "analyzer": "icu_analyzer",
                "search_analyzer": "icu_analyzer",
                "fields": {
                    "keyword": {
                        "type": "keyword",
                        "ignore_above": 256
                    }
                }
            },
            "answer": {
                "type": "text",
                "analyzer": "icu_analyzer",
                "search_analyzer": "icu_analyzer"
            },
            
            # 向量字段
            "question_vector_general": {
                "type": "dense_vector",
                "dims": 1024,  # 实际的text-embedding-v4模型维度
                "index": True,
                "similarity": "cosine"
            },
            "question_vector_domain": {
                "type": "dense_vector", 
                "dims": 768,   # MatBERT领域模型维度
                "index": True,
                "similarity": "cosine"
            },
            
            # 元数据
            "source_sheet": {
                "type": "keyword"
            },
            "row_number": {
                "type": "integer"
            },
            "quality_score": {
                "type": "integer"
            },
            "is_validated": {
                "type": "boolean"
            },
            
            # 使用统计
            "usage_count": {
                "type": "integer"
            },
            "last_used_at": {
                "type": "date"
            },
            
            # 时间戳
            "created_at": {
                "type": "date"
            },
            "updated_at": {
                "type": "date"
            }
        }
    },
    "settings": {
        "number_of_shards": 1,
        "number_of_replicas": 0,
        "analysis": {
            "analyzer": {
                "icu_analyzer": {
                    "tokenizer": "icu_tokenizer",
                    "filter": ["lowercase", "icu_folding"]
                }
            }
        }
    }
}

# QA数据集索引映射（用于数据集级别的搜索）
QA_DATASETS_MAPPING = {
    "mappings": {
        "properties": {
            "collection_id": {
                "type": "keyword"
            },
            "dataset_id": {
                "type": "keyword"
            },
            "title": {
                "type": "text",
                "analyzer": "icu_analyzer",
                "search_analyzer": "icu_analyzer",
                "fields": {
                    "keyword": {
                        "type": "keyword",
                        "ignore_above": 256
                    }
                }
            },
            "description": {
                "type": "text",
                "analyzer": "icu_analyzer",
                "search_analyzer": "icu_analyzer"
            },
            "category": {
                "type": "keyword"
            },
            "status": {
                "type": "keyword"
            },
            "vectorization_status": {
                "type": "keyword"
            },
            "total_qa_pairs": {
                "type": "integer"
            },
            "processed_qa_pairs": {
                "type": "integer"
            },
            "categories_count": {
                "type": "integer"
            },
            "created_at": {
                "type": "date"
            },
            "updated_at": {
                "type": "date"
            }
        }
    },
    "settings": {
        "number_of_shards": 1,
        "number_of_replicas": 0
    }
}

# 索引名称定义
QA_PAIRS_VECTOR_INDEX = "mat_qa_pairs_vectors"
QA_DATASETS_INDEX = "mat_qa_datasets"
