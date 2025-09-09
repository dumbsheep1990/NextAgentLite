#!/usr/bin/env python3
"""
ElasticSearch和Redis初始化脚本
基于模板自动创建索引和Redis键结构
用于MAT-DEMO地聚物材料智能问答系统
"""

import json
import time
import hashlib
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
import argparse
import sys
import os

# ElasticSearch相关导入
try:
    from elasticsearch import Elasticsearch
    from elasticsearch.exceptions import ConnectionError as ESConnectionError, NotFoundError, RequestError
    ES_AVAILABLE = True
except ImportError:
    ES_AVAILABLE = False
    print("⚠️  elasticsearch包未安装，跳过ES初始化")

# Redis相关导入
try:
    import redis
    from redis.exceptions import ConnectionError as RedisConnectionError, TimeoutError
    REDIS_AVAILABLE = True
except ImportError:
    REDIS_AVAILABLE = False
    print("⚠️  redis包未安装，跳过Redis初始化")


class ElasticSearchManager:
    """ElasticSearch管理器"""
    
    def __init__(self, config: Dict[str, Any]):
        if not ES_AVAILABLE:
            raise RuntimeError("elasticsearch包未安装")
        
        self.config = config
        self.es = Elasticsearch(**config.get('connection_settings', {}))
        self.templates = config.get('index_templates', {})
        self.aliases = config.get('index_aliases', {})
    
    async def test_connection(self) -> bool:
        """测试ES连接"""
        try:
            info = self.es.info()
            print(f"✓ 连接到 ElasticSearch {info['version']['number']}")
            return True
        except ESConnectionError:
            print("✗ 无法连接到ElasticSearch")
            return False
        except Exception as e:
            print(f"✗ ES连接错误: {e}")
            return False
    
    def create_index_templates(self) -> bool:
        """创建索引模板"""
        success = True
        print("\n📝 创建ElasticSearch索引模板...")
        
        for template_name, template_config in self.templates.items():
            try:
                # 检查索引是否已存在
                if self.es.indices.exists(index=template_name):
                    print(f"  ✓ 索引 {template_name} 已存在")
                    continue
                
                print(f"  📝 创建索引: {template_name}")
                
                # 创建索引
                self.es.indices.create(
                    index=template_name,
                    body=template_config['template']
                )
                
                print(f"  ✓ 创建成功: {template_name}")
                
            except RequestError as e:
                print(f"  ✗ 创建失败 {template_name}: {e}")
                success = False
            except Exception as e:
                print(f"  ✗ 未知错误 {template_name}: {e}")
                success = False
        
        return success
    
    def create_aliases(self) -> bool:
        """创建索引别名"""
        print("\n🏷️  创建索引别名...")
        
        try:
            actions = []
            for alias, index in self.aliases.items():
                if not self.es.indices.exists_alias(name=alias):
                    actions.append({"add": {"index": index, "alias": alias}})
            
            if actions:
                self.es.indices.update_aliases(body={"actions": actions})
                aliases_created = [a['add']['alias'] for a in actions]
                print(f"  ✓ 创建别名: {aliases_created}")
            else:
                print("  ✓ 所有别名已存在")
            
            return True
        except Exception as e:
            print(f"  ✗ 别名创建失败: {e}")
            return False
    
    def insert_test_data(self) -> bool:
        """插入测试数据验证功能"""
        print("\n🧪 插入测试数据...")
        
        test_documents = [
            {
                "index": "mat_qa_chunks",
                "id": "test_chunk_001",
                "data": {
                    "id": "test_chunk_001",
                    "document_id": "test_doc_001",
                    "chunk_index": 0,
                    "content": "地聚物是一种新型绿色建筑材料，具有优异的力学性能和环境友好特性。",
                    "title": "地聚物材料性能研究",
                    "general_model": "text-embedding-v4",
                    "document_type": "pdf",
                    "tags": ["地聚物", "建筑材料", "绿色材料"],
                    "metadata": {
                        "page": 1,
                        "section": "introduction",
                        "confidence": 0.95,
                        "language": "zh"
                    },
                    "source_info": {
                        "filename": "geopolymer_research.pdf",
                        "file_type": "pdf",
                        "page": 1,
                        "section": "引言"
                    },
                    "created_at": datetime.now().isoformat()
                }
            },
            {
                "index": "mat_qa_documents",
                "id": "test_doc_001",
                "data": {
                    "id": "test_doc_001",
                    "title": "地聚物材料性能研究",
                    "filename": "geopolymer_research.pdf",
                    "file_type": "pdf",
                    "file_size": 1024000,
                    "status": "vectorized",
                    "tags": ["地聚物", "材料科学"],
                    "metadata": {
                        "author": "张三",
                        "keywords": ["地聚物", "强度", "耐久性"],
                        "language": "zh"
                    },
                    "vector_status": {
                        "progress": 100,
                        "model": "text-embedding-v4",
                        "chunks": 15,
                        "completed_at": datetime.now().isoformat()
                    },
                    "file_path": "/uploads/test/geopolymer_research.pdf",
                    "upload_time": datetime.now().isoformat(),
                    "created_at": datetime.now().isoformat(),
                    "updated_at": datetime.now().isoformat()
                }
            }
        ]
        
        try:
            for doc in test_documents:
                # 插入测试文档
                self.es.index(
                    index=doc["index"],
                    id=doc["id"],
                    body=doc["data"]
                )
            
            # 刷新索引
            self.es.indices.refresh(index="mat_qa_chunks,mat_qa_documents")
            
            # 测试搜索
            search_result = self.es.search(
                index="mat_qa_chunks",
                body={
                    "query": {
                        "match": {
                            "content": "地聚物"
                        }
                    }
                }
            )
            
            if search_result["hits"]["total"]["value"] > 0:
                print("  ✓ 测试数据插入成功，搜索功能正常")
                
                # 清理测试数据
                for doc in test_documents:
                    self.es.delete(index=doc["index"], id=doc["id"])
                print("  ✓ 清理测试数据完成")
                return True
            else:
                print("  ✗ 搜索测试失败")
                return False
                
        except Exception as e:
            print(f"  ✗ 测试数据操作失败: {e}")
            return False


class RedisManager:
    """Redis管理器"""
    
    def __init__(self, config: Dict[str, Any]):
        if not REDIS_AVAILABLE:
            raise RuntimeError("redis包未安装")
        
        self.config = config
        conn_settings = config.get('connection_settings', {})
        
        # 构建Redis连接配置
        redis_config = {
            'host': conn_settings.get('host', 'localhost'),
            'port': conn_settings.get('port', 6379),
            'db': conn_settings.get('db', 0),
            'decode_responses': True,
            'socket_timeout': conn_settings.get('timeout', 10),
            'socket_connect_timeout': conn_settings.get('timeout', 10),
            'retry_on_timeout': True
        }
        
        # 如果有密码则添加
        if conn_settings.get('password'):
            redis_config['password'] = conn_settings['password']
        
        # 创建连接池
        pool = redis.ConnectionPool(**redis_config)
        self.redis = redis.Redis(connection_pool=pool)
        
        self.namespaces = config.get('namespace_definitions', {})
    
    def test_connection(self) -> bool:
        """测试Redis连接"""
        try:
            info = self.redis.info()
            version = info.get('redis_version', 'unknown')
            print(f"✓ 连接到 Redis {version}")
            return True
        except RedisConnectionError:
            print("✗ 无法连接到Redis")
            return False
        except Exception as e:
            print(f"✗ Redis连接错误: {e}")
            return False
    
    def create_namespace_examples(self) -> bool:
        """创建命名空间示例数据"""
        print("\n📝 创建Redis命名空间示例...")
        
        success = True
        current_time = int(time.time())
        
        for namespace, config in self.namespaces.items():
            try:
                if 'example_key' not in config or 'example_data' not in config:
                    continue
                
                example_key = config['example_key']
                example_data = config['example_data'].copy()
                
                # 更新时间戳字段
                if 'create_time' in example_data:
                    example_data['create_time'] = current_time
                if 'update_time' in example_data:
                    example_data['update_time'] = current_time
                if 'created_at' in example_data:
                    example_data['created_at'] = datetime.now().isoformat()
                if 'updated_at' in example_data:
                    example_data['updated_at'] = datetime.now().isoformat()
                
                # 设置TTL（如果配置了）
                ttl = config.get('ttl')
                if ttl and isinstance(ttl, int):
                    self.redis.setex(example_key, ttl, json.dumps(example_data))
                    print(f"  ✓ 创建示例 {namespace}: {example_key} (TTL: {ttl}s)")
                else:
                    self.redis.set(example_key, json.dumps(example_data))
                    print(f"  ✓ 创建示例 {namespace}: {example_key}")
                    
            except Exception as e:
                print(f"  ✗ 创建示例失败 {namespace}: {e}")
                success = False
        
        return success
    
    def test_operations(self) -> bool:
        """测试Redis操作"""
        print("\n🧪 测试Redis操作...")
        
        try:
            # 测试基本操作
            test_key = "test:operation:example"
            test_data = {
                "message": "Redis连接测试",
                "timestamp": time.time(),
                "status": "success"
            }
            
            # SET操作
            self.redis.set(test_key, json.dumps(test_data))
            
            # GET操作
            retrieved = self.redis.get(test_key)
            if retrieved:
                parsed_data = json.loads(retrieved)
                if parsed_data["message"] == test_data["message"]:
                    print("  ✓ 基本读写操作正常")
                else:
                    print("  ✗ 数据读写不一致")
                    return False
            else:
                print("  ✗ 无法读取写入的数据")
                return False
            
            # Pipeline操作测试
            pipe = self.redis.pipeline()
            for i in range(5):
                pipe.set(f"test:pipeline:{i}", f"value_{i}")
            pipe.execute()
            
            # 批量获取
            pipeline_keys = [f"test:pipeline:{i}" for i in range(5)]
            values = self.redis.mget(pipeline_keys)
            if all(v is not None for v in values):
                print("  ✓ Pipeline批量操作正常")
            else:
                print("  ✗ Pipeline操作失败")
                return False
            
            # 清理测试数据
            self.redis.delete(test_key)
            self.redis.delete(*pipeline_keys)
            print("  ✓ 测试数据清理完成")
            
            return True
            
        except Exception as e:
            print(f"  ✗ Redis操作测试失败: {e}")
            return False
    
    def show_statistics(self):
        """显示Redis统计信息"""
        print("\n📊 Redis统计信息:")
        try:
            info = self.redis.info()
            print(f"  - 数据库大小: {self.redis.dbsize()} 个键")
            print(f"  - 内存使用: {info.get('used_memory_human', 'N/A')}")
            print(f"  - 连接数: {info.get('connected_clients', 'N/A')}")
            print(f"  - 命中率: {info.get('keyspace_hits', 0) / max(info.get('keyspace_hits', 0) + info.get('keyspace_misses', 1), 1) * 100:.2f}%")
        except Exception as e:
            print(f"  ✗ 获取统计信息失败: {e}")


def load_config_file(filepath: str) -> Dict[str, Any]:
    """加载配置文件"""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            return json.load(f)
    except FileNotFoundError:
        print(f"✗ 配置文件不存在: {filepath}")
        return {}
    except json.JSONDecodeError as e:
        print(f"✗ 配置文件JSON格式错误: {e}")
        return {}
    except Exception as e:
        print(f"✗ 加载配置文件失败: {e}")
        return {}


def main():
    parser = argparse.ArgumentParser(description='MAT-DEMO ElasticSearch和Redis初始化工具')
    parser.add_argument('--es-config', default='elasticsearch_index_templates.json',
                       help='ElasticSearch配置文件路径')
    parser.add_argument('--redis-config', default='redis_key_design_templates.json',
                       help='Redis配置文件路径')
    parser.add_argument('--skip-es', action='store_true', help='跳过ElasticSearch初始化')
    parser.add_argument('--skip-redis', action='store_true', help='跳过Redis初始化')
    parser.add_argument('--test-only', action='store_true', help='仅执行连接测试')
    parser.add_argument('--verbose', '-v', action='store_true', help='详细输出')
    
    args = parser.parse_args()
    
    print("🚀 MAT-DEMO 数据库初始化工具")
    print("=" * 50)
    
    overall_success = True
    
    # ElasticSearch初始化
    if not args.skip_es and ES_AVAILABLE:
        print("\n📊 ElasticSearch初始化")
        print("-" * 30)
        
        es_config = load_config_file(args.es_config)
        if not es_config:
            print("✗ 无法加载ElasticSearch配置，跳过ES初始化")
            overall_success = False
        else:
            try:
                es_manager = ElasticSearchManager(es_config['elasticsearch_index_design'])
                
                # 测试连接
                if not await es_manager.test_connection():
                    overall_success = False
                elif not args.test_only:
                    # 创建索引模板
                    if not es_manager.create_index_templates():
                        overall_success = False
                    
                    # 创建别名
                    if not es_manager.create_aliases():
                        overall_success = False
                    
                    # 测试功能
                    if not es_manager.insert_test_data():
                        overall_success = False
                
            except Exception as e:
                print(f"✗ ElasticSearch初始化失败: {e}")
                overall_success = False
    
    # Redis初始化
    if not args.skip_redis and REDIS_AVAILABLE:
        print("\n🗃️  Redis初始化")
        print("-" * 30)
        
        redis_config = load_config_file(args.redis_config)
        if not redis_config:
            print("✗ 无法加载Redis配置，跳过Redis初始化")
            overall_success = False
        else:
            try:
                redis_manager = RedisManager(redis_config['redis_key_design'])
                
                # 测试连接
                if not redis_manager.test_connection():
                    overall_success = False
                elif not args.test_only:
                    # 创建命名空间示例
                    if not redis_manager.create_namespace_examples():
                        overall_success = False
                    
                    # 测试操作
                    if not redis_manager.test_operations():
                        overall_success = False
                
                # 显示统计信息
                if args.verbose:
                    redis_manager.show_statistics()
                
            except Exception as e:
                print(f"✗ Redis初始化失败: {e}")
                overall_success = False
    
    # 结果总结
    print("\n" + "=" * 50)
    if overall_success:
        print("🎉 初始化完成！所有组件运行正常")
        if not args.test_only:
            print("\n📋 后续建议:")
            print("  1. 配置生产环境的安全设置")
            print("  2. 设置监控和日志收集")
            print("  3. 定期备份重要数据")
            print("  4. 根据负载调整性能参数")
    else:
        print("❌ 初始化过程中发现问题，请检查上述错误信息")
        sys.exit(1)


if __name__ == "__main__":
    main()