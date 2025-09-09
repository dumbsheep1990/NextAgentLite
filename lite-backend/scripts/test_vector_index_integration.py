"""
向量索引管理系统集成测试脚本

测试向量索引管理的完整工作流程：
1. 创建测试Collection
2. 添加测试文档和向量数据
3. 测试向量索引管理API
4. 清理测试数据
"""

import asyncio
import json
import time
from datetime import datetime
from typing import Dict, Any
import httpx
import uuid

# API基础URL
BASE_URL = "http://localhost:8000/api/v1"

class VectorIndexIntegrationTest:
    def __init__(self):
        self.client = httpx.AsyncClient()
        self.test_collection_id = None
        self.test_document_ids = []

    async def cleanup(self):
        """清理HTTP客户端"""
        await self.client.aclose()

    async def create_test_collection(self) -> str:
        """创建测试用的Collection"""
        print("🏗️  创建测试Collection...")
        
        collection_data = {
            "name": f"向量索引测试集合_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
            "description": "用于测试向量索引管理功能的临时集合",
            "metadata_template": "general",
            "config": {
                "test_purpose": "vector_index_testing",
                "created_by": "integration_test"
            }
        }
        
        response = await self.client.post(
            f"{BASE_URL}/collections",
            json=collection_data
        )
        
        if response.status_code != 200:
            raise Exception(f"创建Collection失败: {response.status_code} - {response.text}")
        
        result = response.json()
        self.test_collection_id = result["id"]
        print(f"✅ 测试Collection创建成功: {self.test_collection_id}")
        return self.test_collection_id

    async def add_test_documents(self, collection_id: str):
        """添加测试文档和向量数据"""
        print("📄 添加测试文档和向量数据...")
        
        # 模拟文档数据
        test_documents = [
            {
                "title": "向量索引测试文档1",
                "content": "这是一个用于测试向量索引功能的文档。包含一些示例内容来生成向量嵌入。",
                "source": "integration_test",
                "collection_id": collection_id
            },
            {
                "title": "向量索引测试文档2", 
                "content": "另一个测试文档，用于验证向量索引的创建和查询功能。包含不同的内容特征。",
                "source": "integration_test",
                "collection_id": collection_id
            }
        ]
        
        for doc_data in test_documents:
            # 创建文档记录
            response = await self.client.post(
                f"{BASE_URL}/knowledge/documents",
                json=doc_data
            )
            
            if response.status_code != 200:
                print(f"⚠️  创建文档失败: {response.status_code} - {response.text}")
                continue
            
            doc_result = response.json()
            doc_id = doc_result["id"]
            self.test_document_ids.append(doc_id)
            
            # 模拟向量数据插入 (通常由向量化服务完成)
            await self._insert_mock_vectors(doc_id, doc_data["content"])
        
        print(f"✅ 添加了 {len(self.test_document_ids)} 个测试文档")

    async def _insert_mock_vectors(self, document_id: str, content: str):
        """插入模拟向量数据到document_chunks表"""
        
        # 生成模拟向量 (实际应该使用embedding模型)
        import random
        general_vector = [random.uniform(-1, 1) for _ in range(1536)]
        domain_vector = [random.uniform(-1, 1) for _ in range(768)]
        
        # 创建chunk记录
        chunk_data = {
            "document_id": document_id,
            "content": content,
            "chunk_index": 0,
            "general_embedding": general_vector,
            "domain_embedding": domain_vector,
            "general_model": "text-embedding-v4",
            "domain_model": "matbert-base-v1",
            "vectorization_strategy": "dual"
        }
        
        # 直接通过数据库API插入 (简化测试)
        response = await self.client.post(
            f"{BASE_URL}/database/execute",
            json={
                "query": """
                INSERT INTO document_chunks 
                (id, document_id, content, chunk_index, general_embedding, domain_embedding, 
                 general_model, domain_model, vectorization_strategy, created_at)
                VALUES ($1, $2, $3, $4, $5::jsonb, $6::jsonb, $7, $8, $9, NOW())
                """,
                "params": [
                    str(uuid.uuid4()),
                    document_id,
                    content,
                    0,
                    json.dumps(general_vector),
                    json.dumps(domain_vector),
                    "text-embedding-v4",
                    "matbert-base-v1", 
                    "dual"
                ]
            }
        )
        
        if response.status_code == 200:
            print(f"  ✅ 为文档 {document_id} 插入了向量数据")
        else:
            print(f"  ⚠️  向量数据插入失败: {response.text}")

    async def test_vector_analysis(self, collection_id: str):
        """测试向量数据分析"""
        print("🔍 测试向量数据分析...")
        
        response = await self.client.get(
            f"{BASE_URL}/vector-index/collections/{collection_id}/analysis"
        )
        
        if response.status_code != 200:
            print(f"❌ 向量分析失败: {response.status_code} - {response.text}")
            return None
        
        analysis = response.json()
        print("✅ 向量分析结果:")
        print(f"   Collection ID: {analysis['collection_id']}")
        print(f"   文档分块总数: {analysis['total_chunks']}")
        
        stats = analysis['vector_statistics']
        for field, info in stats.items():
            if info['count'] > 0:
                print(f"   {field}: {info['count']} 个向量, 维度 {info['dimension']}")
        
        return analysis

    async def test_index_status(self, collection_id: str):
        """测试索引状态查询"""
        print("📊 测试索引状态查询...")
        
        response = await self.client.get(
            f"{BASE_URL}/vector-index/collections/{collection_id}/status"
        )
        
        if response.status_code != 200:
            print(f"❌ 索引状态查询失败: {response.status_code} - {response.text}")
            return None
        
        statuses = response.json()
        print(f"✅ 索引状态查询成功 ({len(statuses)} 个向量字段):")
        
        for status in statuses:
            print(f"   字段 {status['vector_field']}:")
            print(f"     索引类型: {status['index_type']}")
            print(f"     存在: {'是' if status['exists'] else '否'}")
            print(f"     有效: {'是' if status['is_valid'] else '否'}")
            print(f"     向量总数: {status['total_vectors']}")
        
        return statuses

    async def test_create_index(self, collection_id: str):
        """测试创建向量索引"""
        print("🔨 测试创建向量索引...")
        
        # 为general_embedding字段创建HNSW索引
        index_config = {
            "collection_id": collection_id,
            "vector_field": "general_embedding",
            "config": {
                "index_type": "hnsw",
                "distance_metric": "vector_cosine_ops",
                "m": 16,
                "ef_construction": 64
            },
            "force_recreate": True
        }
        
        response = await self.client.post(
            f"{BASE_URL}/vector-index/create",
            json=index_config
        )
        
        if response.status_code != 200:
            print(f"❌ 创建索引失败: {response.status_code} - {response.text}")
            return None
        
        result = response.json()
        print("✅ 索引创建成功:")
        print(f"   索引名: {result['data']['index_name']}")
        print(f"   构建耗时: {result['data']['build_time']:.2f} 秒")
        print(f"   索引类型: {result['data']['index_type']}")
        
        return result

    async def test_rebuild_indexes(self, collection_id: str):
        """测试重建索引"""
        print("🔄 测试重建索引...")
        
        rebuild_config = {
            "collection_id": collection_id,
            "vector_fields": ["general_embedding"],
            "config": {
                "index_type": "hnsw",
                "distance_metric": "vector_cosine_ops",
                "m": 16,
                "ef_construction": 64
            }
        }
        
        response = await self.client.post(
            f"{BASE_URL}/vector-index/rebuild",
            json=rebuild_config
        )
        
        if response.status_code != 200:
            print(f"❌ 重建索引失败: {response.status_code} - {response.text}")
            return None
        
        result = response.json()
        print("✅ 索引重建成功:")
        
        if result.get('async_mode'):
            print(f"   后台模式: 预计耗时 {result['data'].get('estimated_time_minutes', 'N/A')} 分钟")
        else:
            print(f"   同步模式: 总耗时 {result['data'].get('total_build_time', 0):.2f} 秒")
            print(f"   重建索引数: {len(result['data'].get('rebuilt_indexes', []))}")
        
        return result

    async def test_supported_configs(self):
        """测试获取支持的配置"""
        print("⚙️  测试获取支持的配置...")
        
        response = await self.client.get(
            f"{BASE_URL}/vector-index/supported-configs"
        )
        
        if response.status_code != 200:
            print(f"❌ 获取配置失败: {response.status_code} - {response.text}")
            return None
        
        configs = response.json()
        print("✅ 支持的配置:")
        print(f"   索引类型: {len(configs['index_types'])} 种")
        print(f"   距离度量: {len(configs['distance_metrics'])} 种")
        print(f"   默认配置: {configs['default_config']['index_type']}")
        
        return configs

    async def cleanup_test_data(self):
        """清理测试数据"""
        print("🧹 清理测试数据...")
        
        # 删除测试Collection (会级联删除相关数据)
        if self.test_collection_id:
            response = await self.client.delete(
                f"{BASE_URL}/collections/{self.test_collection_id}"
            )
            
            if response.status_code == 200:
                print(f"✅ 测试Collection {self.test_collection_id} 清理完成")
            else:
                print(f"⚠️  清理测试Collection失败: {response.text}")

    async def run_full_test(self):
        """运行完整的集成测试"""
        print("🚀 开始向量索引管理系统集成测试\n")
        
        try:
            # 1. 测试支持的配置
            await self.test_supported_configs()
            print("\n" + "="*60)
            
            # 2. 创建测试Collection
            collection_id = await self.create_test_collection()
            print("\n" + "="*60)
            
            # 3. 添加测试数据
            await self.add_test_documents(collection_id)
            print("\n" + "="*60)
            
            # 等待一下让数据就绪
            print("⏳ 等待数据就绪...")
            await asyncio.sleep(2)
            
            # 4. 测试向量分析
            await self.test_vector_analysis(collection_id)
            print("\n" + "="*60)
            
            # 5. 测试索引状态查询
            await self.test_index_status(collection_id)
            print("\n" + "="*60)
            
            # 6. 测试创建索引
            await self.test_create_index(collection_id)
            print("\n" + "="*60)
            
            # 7. 测试重建索引
            await self.test_rebuild_indexes(collection_id)
            print("\n" + "="*60)
            
            # 8. 再次查询索引状态验证
            print("🔍 最终验证索引状态...")
            await self.test_index_status(collection_id)
            
            print("\n" + "="*60)
            print("🎉 向量索引管理系统集成测试完成！")
            
        except Exception as e:
            print(f"❌ 测试过程中出现异常: {e}")
            import traceback
            traceback.print_exc()
        
        finally:
            # 清理测试数据
            print("\n" + "="*60)
            await self.cleanup_test_data()


async def main():
    """主函数"""
    test = VectorIndexIntegrationTest()
    
    try:
        await test.run_full_test()
    finally:
        await test.cleanup()


if __name__ == "__main__":
    asyncio.run(main())