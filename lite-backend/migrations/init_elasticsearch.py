#!/usr/bin/env python3
"""
ElasticSearch 初始化脚本
用于系统启动时自动创建和配置ElasticSearch索引
"""

import json
import time
from typing import Dict, Any, List
from elasticsearch import Elasticsearch
from elasticsearch.exceptions import ConnectionError, NotFoundError, RequestError

class ElasticSearchInitializer:
    """ElasticSearch初始化器"""
    
    # 当前迁移版本
    CURRENT_VERSION = "1.0.0"
    
    # ES连接配置
    ES_CONFIG = {
        "hosts": ["http://localhost:9200"],
        "request_timeout": 30,
        "max_retries": 3,
        "retry_on_timeout": True,
        "verify_certs": False,  # 禁用SSL证书验证
        "ssl_show_warn": False  # 禁用SSL警告
    }
    
    def __init__(self, es_config: Dict = None):
        """初始化ES连接"""
        self.config = es_config or self.ES_CONFIG
        self.es = None
        self._connect()
    
    def _connect(self):
        """连接ElasticSearch"""
        try:
            self.es = Elasticsearch(**self.config)
            # 测试连接
            info = self.es.info()
            pass  # 静默连接，避免日志噪音
        except ConnectionError:
            print("✗ 无法连接到ElasticSearch，请确保服务已启动")
            raise
        except Exception as e:
            print(f"✗ ES连接错误: {e}")
            raise
    
    def check_version(self) -> str:
        """检查当前ES迁移版本"""
        try:
            response = self.es.get(
                index=".mat_migrations",
                id="elasticsearch_version"
            )
            return response["_source"]["version"]
        except NotFoundError:
            return "0.0.0"  # 首次安装
        except Exception:
            return "0.0.0"
    
    def update_version(self, version: str):
        """更新迁移版本"""
        try:
            # 确保迁移索引存在
            if not self.es.indices.exists(index=".mat_migrations"):
                self.es.indices.create(
                    index=".mat_migrations",
                    body={
                        "mappings": {
                            "properties": {
                                "version": {"type": "keyword"},
                                "timestamp": {"type": "date"},
                                "description": {"type": "text"}
                            }
                        }
                    }
                )
            
            # 更新版本
            self.es.index(
                index=".mat_migrations",
                id="elasticsearch_version",
                body={
                    "version": version,
                    "timestamp": time.time(),
                    "description": f"ElasticSearch迁移到版本 {version}"
                }
            )
            print(f"✓ 版本更新到: {version}")
        except Exception as e:
            print(f"✗ 版本更新失败: {e}")
            raise
    
    def create_chunks_index(self):
        """创建文档分块索引"""
        index_name = "document_chunks"
        
        if self.es.indices.exists(index=index_name):
            print(f"✓ 索引 {index_name} 已存在")
            return
        
        print(f"📝 创建索引: {index_name}")
        
        mapping = {
            "settings": {
                "number_of_shards": 1,
                "number_of_replicas": 0,
                "analysis": {
                    "analyzer": {
                        "chinese_analyzer": {
                            "type": "custom",
                            "tokenizer": "standard",
                            "filter": ["lowercase", "stop"]
                        },
                        "english_analyzer": {
                            "type": "custom",
                            "tokenizer": "standard",
                            "filter": ["lowercase", "stop", "stemmer"]
                        }
                    }
                }
            },
            "mappings": {
                "properties": {
                    "id": {"type": "keyword"},
                    "document_id": {"type": "keyword"},
                    "chunk_index": {"type": "integer"},
                    "content": {
                        "type": "text",
                        "analyzer": "chinese_analyzer",
                        "fields": {
                            "english": {"type": "text", "analyzer": "english_analyzer"},
                            "keyword": {"type": "keyword", "ignore_above": 256}
                        }
                    },
                    "title": {
                        "type": "text",
                        "analyzer": "chinese_analyzer",
                        "fields": {
                            "keyword": {"type": "keyword", "ignore_above": 256}
                        }
                    },
                    # 向量嵌入 (Qwen3-Embedding-4B)
                    "embedding": {
                        "type": "dense_vector",
                        "dims": 2560,
                        "index": True,
                        "similarity": "cosine"
                    },
                    "embedding_model": {"type": "keyword"},
                    "document_type": {"type": "keyword"},
                    "tags": {"type": "keyword"},
                    "metadata": {"type": "object", "dynamic": True},
                    "source_info": {
                        "type": "object",
                        "properties": {
                            "filename": {"type": "keyword"},
                            "file_type": {"type": "keyword"},
                            "page": {"type": "integer"},
                            "section": {"type": "text"}
                        }
                    },
                    "created_at": {"type": "date"},
                    "updated_at": {"type": "date"}
                }
            }
        }
        
        try:
            self.es.indices.create(index=index_name, body=mapping)
            print(f"✓ 创建索引: {index_name}")
        except Exception as e:
            print(f"✗ 创建索引失败 {index_name}: {e}")
            raise

    def create_general_vectors_index(self):
        """创建通用向量索引（独立存储）"""
        index_name = "general_vectors"
        
        if self.es.indices.exists(index=index_name):
            print(f"✓ 索引 {index_name} 已存在")
            return
        
        print(f"📝 创建索引: {index_name}")
        
        mapping = {
            "settings": {
                "number_of_shards": 1,
                "number_of_replicas": 0,
                "analysis": {
                    "analyzer": {
                        "chinese_analyzer": {
                            "type": "custom",
                            "tokenizer": "standard",
                            "filter": ["lowercase", "stop"]
                        },
                        "english_analyzer": {
                            "type": "custom",
                            "tokenizer": "standard",
                            "filter": ["lowercase", "stop", "stemmer"]
                        }
                    }
                }
            },
            "mappings": {
                "properties": {
                    "id": {"type": "keyword"},
                    "document_id": {"type": "keyword"},
                    "chunk_index": {"type": "integer"},
                    "content": {
                        "type": "text",
                        "analyzer": "chinese_analyzer",
                        "fields": {
                            "english": {"type": "text", "analyzer": "english_analyzer"},
                            "keyword": {"type": "keyword", "ignore_above": 256}
                        }
                    },
                    "title": {
                        "type": "text",
                        "analyzer": "chinese_analyzer",
                        "fields": {
                            "keyword": {"type": "keyword", "ignore_above": 256}
                        }
                    },
                    # 向量嵌入 (Qwen3-Embedding-4B)
                    "embedding": {
                        "type": "dense_vector",
                        "dims": 2560,
                        "index": True,
                        "similarity": "cosine"
                    },
                    "embedding_model": {"type": "keyword"},
                    "tags": {"type": "keyword"},
                    "metadata": {"type": "object", "dynamic": True},
                    "source_info": {
                        "type": "object",
                        "properties": {
                            "filename": {"type": "keyword"},
                            "file_type": {"type": "keyword"},
                            "page": {"type": "integer"},
                            "section": {"type": "text"}
                        }
                    },
                    "created_at": {"type": "date"},
                    "updated_at": {"type": "date"}
                }
            }
        }
        
        try:
            self.es.indices.create(index=index_name, body=mapping)
            print(f"✓ 创建索引: {index_name}")
        except Exception as e:
            print(f"✗ 创建索引失败 {index_name}: {e}")
            raise

    def create_domain_vectors_index(self):
        """创建领域向量索引（独立存储）"""
        index_name = "domain_vectors"
        
        if self.es.indices.exists(index=index_name):
            print(f"✓ 索引 {index_name} 已存在")
            return
        
        print(f"📝 创建索引: {index_name}")
        
        mapping = {
            "settings": {
                "number_of_shards": 1,
                "number_of_replicas": 0,
                "analysis": {
                    "analyzer": {
                        "chinese_analyzer": {
                            "type": "custom",
                            "tokenizer": "standard",
                            "filter": ["lowercase", "stop"]
                        },
                        "english_analyzer": {
                            "type": "custom",
                            "tokenizer": "standard",
                            "filter": ["lowercase", "stop", "stemmer"]
                        }
                    }
                }
            },
            "mappings": {
                "properties": {
                    "id": {"type": "keyword"},
                    "document_id": {"type": "keyword"},
                    "chunk_index": {"type": "integer"},
                    "content": {
                        "type": "text",
                        "analyzer": "chinese_analyzer",
                        "fields": {
                            "english": {"type": "text", "analyzer": "english_analyzer"},
                            "keyword": {"type": "keyword", "ignore_above": 256}
                        }
                    },
                    "title": {
                        "type": "text",
                        "analyzer": "chinese_analyzer",
                        "fields": {
                            "keyword": {"type": "keyword", "ignore_above": 256}
                        }
                    },
                    # 领域向量
                    "domain_embedding": {
                        "type": "dense_vector",
                        "dims": 768,
                        "index": True,
                        "similarity": "cosine"
                    },
                    "domain_model": {"type": "keyword"},
                    "vectorization_strategy": {"type": "keyword"},
                    "tags": {"type": "keyword"},
                    "metadata": {"type": "object", "dynamic": True},
                    "source_info": {
                        "type": "object",
                        "properties": {
                            "filename": {"type": "keyword"},
                            "file_type": {"type": "keyword"},
                            "page": {"type": "integer"},
                            "section": {"type": "text"}
                        }
                    },
                    "created_at": {"type": "date"},
                    "updated_at": {"type": "date"}
                }
            }
        }
        
        try:
            self.es.indices.create(index=index_name, body=mapping)
            print(f"✓ 创建索引: {index_name}")
        except Exception as e:
            print(f"✗ 创建索引失败 {index_name}: {e}")
            raise
    
    def create_papers_index(self):
        """创建学术论文索引"""
        index_name = "papers"
        
        if self.es.indices.exists(index=index_name):
            print(f"✓ 索引 {index_name} 已存在")
            return
        
        print(f"📝 创建索引: {index_name}")
        
        mapping = {
            "settings": {
                "number_of_shards": 1,
                "number_of_replicas": 0,
                "analysis": {
                    "analyzer": {
                        "chinese_analyzer": {
                            "type": "custom",
                            "tokenizer": "icu_tokenizer", 
                            "filter": ["lowercase", "icu_folding"]
                        }
                    }
                }
            },
            "mappings": {
                "properties": {
                    "id": {"type": "keyword"},
                    "title": {
                        "type": "text",
                        "analyzer": "chinese_analyzer",
                        "fields": {
                            "keyword": {"type": "keyword", "ignore_above": 256}
                        }
                    },
                    "authors": {"type": "text"},
                    "journal": {"type": "keyword"},
                    "year": {"type": "integer"},
                    "doi": {"type": "keyword"},
                    "abstract": {
                        "type": "text",
                        "analyzer": "chinese_analyzer"
                    },
                    "content": {
                        "type": "text",
                        "analyzer": "chinese_analyzer"
                    },
                    "keywords": {"type": "keyword"},
                    "categories": {"type": "keyword"},
                    "language": {"type": "keyword"},
                    
                    # Ali嵌入向量
                    "title_ali_embedding": {
                        "type": "dense_vector",
                        "dims": 1024,
                        "index": True,
                        "similarity": "cosine"
                    },
                    "abstract_ali_embedding": {
                        "type": "dense_vector",
                        "dims": 1024,
                        "index": True,
                        "similarity": "cosine"
                    },
                    "content_ali_embedding": {
                        "type": "dense_vector",
                        "dims": 1024,
                        "index": True,
                        "similarity": "cosine"
                    },
                    
                    # MatBERT嵌入向量
                    "title_matbert_embedding": {
                        "type": "dense_vector",
                        "dims": 768,
                        "index": True,
                        "similarity": "cosine"
                    },
                    "abstract_matbert_embedding": {
                        "type": "dense_vector",
                        "dims": 768,
                        "index": True,
                        "similarity": "cosine"
                    },
                    "content_matbert_embedding": {
                        "type": "dense_vector",
                        "dims": 768,
                        "index": True,
                        "similarity": "cosine"
                    },
                    
                    "file_path": {"type": "keyword"},
                    "file_size": {"type": "long"},
                    "processed": {"type": "boolean"},
                    "confidence_score": {"type": "float"},
                    "created_at": {"type": "date"},
                    "updated_at": {"type": "date"}
                }
            }
        }
        
        try:
            self.es.indices.create(index=index_name, body=mapping)
            print(f"✓ 创建索引: {index_name}")
        except Exception as e:
            print(f"✗ 创建索引失败 {index_name}: {e}")
            raise
    
    def create_documents_index(self):
        """创建知识库文档索引"""
        index_name = "documents"
        
        if self.es.indices.exists(index=index_name):
            print(f"✓ 索引 {index_name} 已存在")
            return
        
        print(f"📝 创建索引: {index_name}")
        
        mapping = {
            "settings": {
                "number_of_shards": 1,
                "number_of_replicas": 0,
                "analysis": {
                    "analyzer": {
                        "chinese_analyzer": {
                            "type": "custom",
                            "tokenizer": "icu_tokenizer", 
                            "filter": ["lowercase", "icu_folding"]
                        }
                    }
                }
            },
            "mappings": {
                "properties": {
                    "id": {"type": "keyword"},
                    "title": {
                        "type": "text",
                        "analyzer": "chinese_analyzer",
                        "fields": {
                            "keyword": {"type": "keyword", "ignore_above": 256}
                        }
                    },
                    "filename": {"type": "keyword"},
                    "file_type": {"type": "keyword"},
                    "file_size": {"type": "long"},
                    "status": {"type": "keyword"},  # uploaded, processing, vectorized, failed
                    "tags": {"type": "keyword"},
                    "metadata": {"type": "object", "dynamic": True},
                    "vector_status": {
                        "type": "object",
                        "properties": {
                            "progress": {"type": "integer"},
                            "model": {"type": "keyword"},
                            "chunks": {"type": "integer"},
                            "completed_at": {"type": "date"}
                        }
                    },
                    "file_path": {"type": "keyword"},
                    "upload_time": {"type": "date"},
                    "created_at": {"type": "date"},
                    "updated_at": {"type": "date"}
                }
            }
        }
        
        try:
            self.es.indices.create(index=index_name, body=mapping)
            print(f"✓ 创建索引: {index_name}")
        except Exception as e:
            print(f"✗ 创建索引失败 {index_name}: {e}")
            raise
    
    def create_cache_index(self):
        """创建检索结果缓存索引"""
        index_name = "retrieval_cache"
        
        if self.es.indices.exists(index=index_name):
            print(f"✓ 索引 {index_name} 已存在")
            return
        
        print(f"📝 创建索引: {index_name}")
        
        mapping = {
            "settings": {
                "number_of_shards": 1,
                "number_of_replicas": 0
            },
            "mappings": {
                "properties": {
                    "query_hash": {"type": "keyword"},
                    "query_text": {"type": "text"},
                    "query_vector": {
                        "type": "dense_vector",
                        "dims": 1024,
                        "index": False
                    },
                    "retrieval_params": {"type": "object"},
                    "results": {
                        "type": "nested",
                        "properties": {
                            "chunks": {
                                "type": "nested",
                                "properties": {
                                    "id": {"type": "keyword"},
                                    "content": {"type": "text"},
                                    "score": {"type": "float"},
                                    "document_id": {"type": "keyword"},
                                    "title": {"type": "text"},
                                    "metadata": {"type": "object"}
                                }
                            },
                            "total_matches": {"type": "integer"},
                            "max_score": {"type": "float"}
                        }
                    },
                    "created_at": {"type": "date"},
                    "expires_at": {"type": "date"},
                    "hit_count": {"type": "integer"}
                }
            }
        }
        
        try:
            self.es.indices.create(index=index_name, body=mapping)
            print(f"✓ 创建索引: {index_name}")
        except Exception as e:
            print(f"✗ 创建索引失败 {index_name}: {e}")
            raise
    
    def create_media_index(self):
        """创建多模态媒体索引"""
        index_name = "media"
        
        if self.es.indices.exists(index=index_name):
            print(f"✓ 索引 {index_name} 已存在")
            return
        
        print(f"📝 创建索引: {index_name}")
        
        mapping = {
            "settings": {
                "number_of_shards": 1,
                "number_of_replicas": 0,
                "analysis": {
                    "analyzer": {
                        "chinese_analyzer": {
                            "type": "custom",
                            "tokenizer": "icu_tokenizer", 
                            "filter": ["lowercase", "icu_folding"]
                        }
                    }
                }
            },
            "mappings": {
                "properties": {
                    "id": {"type": "keyword"},
                    "filename": {"type": "keyword"},
                    "file_type": {"type": "keyword"},  # image, video, audio, document
                    "file_path": {"type": "keyword"},
                    "file_size": {"type": "long"},
                    "file_hash": {"type": "keyword"},
                    "media_type": {"type": "keyword"},
                    
                    # 基本元数据
                    "metadata": {
                        "type": "object",
                        "properties": {
                            "dimensions": {"type": "keyword"},  # 图片/视频尺寸
                            "duration": {"type": "float"},      # 视频/音频时长
                            "format": {"type": "keyword"},      # 文件格式
                            "codec": {"type": "keyword"}        # 编码格式
                        }
                    },
                    
                    # OCR结果
                    "ocr_content": {"type": "text", "analyzer": "chinese_analyzer"},
                    "ocr_confidence": {"type": "float"},
                    "ocr_language": {"type": "keyword"},
                    
                    # 视频分析结果
                    "video_analysis": {
                        "type": "object",
                        "properties": {
                            "scene_description": {"type": "text"},
                            "objects_detected": {"type": "keyword"},
                            "key_frames": {"type": "keyword"},
                            "transcript": {"type": "text"}
                        }
                    },
                    
                    # 关联文档
                    "document_id": {"type": "keyword"},
                    "conversation_id": {"type": "keyword"},
                    
                    # 状态和时间
                    "processed": {"type": "boolean"},
                    "created_at": {"type": "date"},
                    "updated_at": {"type": "date"}
                }
            }
        }
        
        try:
            self.es.indices.create(index=index_name, body=mapping)
            print(f"✓ 创建索引: {index_name}")
        except Exception as e:
            print(f"✗ 创建索引失败 {index_name}: {e}")
            raise
    
    def create_aliases(self):
        """创建索引别名"""
        print("📝 创建索引别名...")
        
        aliases = [
            {"index": "document_chunks", "alias": "chunks"},
            {"index": "retrieval_cache", "alias": "cache"}
        ]
        
        try:
            actions = []
            for alias_config in aliases:
                # 检查别名是否已存在
                if not self.es.indices.exists_alias(name=alias_config["alias"]):
                    actions.append({"add": alias_config})
            
            if actions:
                self.es.indices.update_aliases(body={"actions": actions})
                print(f"✓ 创建别名: {[a['add']['alias'] for a in actions]}")
            else:
                print("✓ 所有别名已存在")
                
        except Exception as e:
            print(f"✗ 创建别名失败: {e}")
            raise
    
    def verify_indices(self) -> bool:
        """验证索引创建结果"""
        print("🔍 验证索引创建结果...")
        
        expected_indices = [
            "document_chunks",
            "general_vectors",
            "domain_vectors",
            "papers", 
            "documents",
            "retrieval_cache",
            "media"
        ]
        
        expected_aliases = [
            "chunks",
            "general_vectors",
            "domain_vectors",
            "papers",
            "documents", 
            "cache",
            "media"
        ]
        
        success = True
        
        # 检查索引
        for index in expected_indices:
            if self.es.indices.exists(index=index):
                print(f"✓ 索引 {index} 存在")
            else:
                print(f"✗ 索引 {index} 不存在")
                success = False
        
        # 检查别名
        for alias in expected_aliases:
            if self.es.indices.exists_alias(name=alias):
                print(f"✓ 别名 {alias} 存在")
            else:
                print(f"✗ 别名 {alias} 不存在")
                success = False
        
        return success
    
    def insert_test_data(self):
        """插入测试数据验证功能"""
        print("📝 插入测试数据...")
        
        test_doc = {
            "id": "test_chunk_001",
            "document_id": "test_doc_001",
            "chunk_index": 0,
            "content": "地聚物是一种新型绿色建筑材料，具有优异的力学性能和环境友好特性。",
            "title": "地聚物材料性能研究测试文档",
            "embedding_model": "text-embedding-v4",
            "document_type": "pdf",
            "tags": ["地聚物", "建筑材料", "测试"],
            "metadata": {
                "page": 1,
                "section": "introduction",
                "confidence": 0.95
            },
            "source_info": {
                "filename": "test_research.pdf",
                "file_type": "pdf",
                "page": 1,
                "section": "引言"
            },
            "created_at": "2025-01-19T12:00:00Z"
        }
        
        try:
            # 使用别名插入测试文档
            self.es.index(
                index="chunks",
                id="test_chunk_001",
                body=test_doc
            )
            
            # 强制刷新索引
            self.es.indices.refresh(index="chunks")
            
            # 测试搜索
            search_result = self.es.search(
                index="chunks",
                body={
                    "query": {
                        "match": {
                            "content": "地聚物"
                        }
                    }
                }
            )
            
            if search_result["hits"]["total"]["value"] > 0:
                print("✓ 测试数据插入成功，搜索功能正常")
                
                # 清理测试数据
                self.es.delete(index="chunks", id="test_chunk_001")
                print("✓ 清理测试数据完成")
                return True
            else:
                print("✗ 搜索测试失败")
                return False
                
        except Exception as e:
            print(f"✗ 测试数据插入失败: {e}")
            return False
    
    def run_initialization(self) -> bool:
        """执行完整初始化流程"""
        print("🚀 开始ElasticSearch初始化...")
        print("=" * 50)
        
        try:
            # 检查版本
            current_version = self.check_version()
            print(f"📋 当前版本: {current_version}")
            print(f"📋 目标版本: {self.CURRENT_VERSION}")
            
            if current_version == self.CURRENT_VERSION:
                print("✓ ElasticSearch已是最新版本，跳过初始化")
                return True
            
            # 创建所有索引
            self.create_chunks_index()
            self.create_general_vectors_index()
            self.create_domain_vectors_index()
            self.create_papers_index()
            self.create_documents_index()
            self.create_cache_index()
            self.create_media_index()
            
            # 创建别名
            self.create_aliases()
            
            # 验证结果
            if not self.verify_indices():
                print("✗ 索引验证失败")
                return False
            
            # 功能测试
            if not self.insert_test_data():
                print("✗ 功能测试失败")
                return False
            
            # 更新版本
            self.update_version(self.CURRENT_VERSION)
            
            print("=" * 50)
            print("🎉 ElasticSearch初始化完成！")
            return True
            
        except Exception as e:
            print(f"✗ 初始化失败: {e}")
            return False


def main():
    """主函数，用于独立运行初始化"""
    import sys
    
    # 支持命令行参数配置ES连接
    es_config = None
    if len(sys.argv) > 1:
        if sys.argv[1] == "--help":
            print("使用方法:")
            print("  python init_elasticsearch.py")
            print("  python init_elasticsearch.py --host <host:port>")
            return
        elif sys.argv[1] == "--host" and len(sys.argv) > 2:
            host = sys.argv[2]
            es_config = {
                "hosts": [host],
                "request_timeout": 30,
                "max_retries": 3,
                "retry_on_timeout": True,
                "verify_certs": False,  # 禁用SSL证书验证
                "ssl_show_warn": False  # 禁用SSL警告
            }
    
    try:
        initializer = ElasticSearchInitializer(es_config)
        success = initializer.run_initialization()
        sys.exit(0 if success else 1)
    except Exception as e:
        print(f"❌ 初始化失败: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main() 