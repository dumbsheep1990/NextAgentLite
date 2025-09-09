"""
测试向量索引管理API的脚本

演示如何使用PostgreSQL + pgvector的索引管理功能
"""

import asyncio
import json
import requests
from typing import Dict, Any

# API基础URL
BASE_URL = "http://localhost:8000/api/v1"

def test_get_supported_configs():
    """测试获取支持的索引配置选项"""
    print("🔧 测试获取支持的索引配置...")
    
    response = requests.get(f"{BASE_URL}/vector-index/supported-configs")
    
    if response.status_code == 200:
        data = response.json()
        print("✅ 支持的索引配置:")
        print(f"   索引类型: {len(data['index_types'])} 种")
        for idx_type in data['index_types']:
            default_mark = " (默认)" if idx_type.get('is_default') else ""
            print(f"     - {idx_type['name']}: {idx_type['description']}{default_mark}")
        
        print(f"   距离度量: {len(data['distance_metrics'])} 种")
        for metric in data['distance_metrics']:
            default_mark = " (默认)" if metric.get('is_default') else ""
            print(f"     - {metric['name']}: {metric['description']}{default_mark}")
        
        print("   默认配置:")
        default_config = data['default_config']
        print(f"     - 索引类型: {default_config['index_type']}")
        print(f"     - 距离度量: {default_config['distance_metric']}")
        print(f"     - 参数: {default_config['parameters']}")
        
        return data
    else:
        print(f"❌ 请求失败: {response.status_code} - {response.text}")
        return None

def test_analyze_collection_vectors(collection_id: str):
    """测试分析Collection向量数据"""
    print(f"📊 测试分析Collection {collection_id} 的向量数据...")
    
    response = requests.get(f"{BASE_URL}/vector-index/collections/{collection_id}/analysis")
    
    if response.status_code == 200:
        data = response.json()
        print("✅ 向量分析结果:")
        print(f"   Collection ID: {data['collection_id']}")
        print(f"   文档分块总数: {data['total_chunks']}")
        print(f"   默认配置: HNSW (m=16, ef_construction=64)")
        
        # 显示向量统计
        stats = data['vector_statistics']
        for field, info in stats.items():
            if info['count'] > 0:
                print(f"   {field}: {info['count']} 个向量, 维度 {info['dimension']}")
        
        return data
    else:
        print(f"❌ 请求失败: {response.status_code} - {response.text}")
        return None

def test_get_index_status(collection_id: str):
    """测试获取索引状态"""
    print(f"📈 测试获取Collection {collection_id} 的索引状态...")
    
    response = requests.get(f"{BASE_URL}/vector-index/collections/{collection_id}/status")
    
    if response.status_code == 200:
        data = response.json()
        print(f"✅ 索引状态 ({len(data)} 个向量字段):")
        
        for status in data:
            print(f"   字段 {status['vector_field']}:")
            print(f"     索引名: {status['index_name']}")
            print(f"     索引类型: {status['index_type']}")
            print(f"     存在: {'是' if status['exists'] else '否'}")
            print(f"     有效: {'是' if status['is_valid'] else '否'}")
            print(f"     大小: {status['size_mb']:.2f} MB")
            print(f"     向量总数: {status['total_vectors']}")
        
        return data
    else:
        print(f"❌ 请求失败: {response.status_code} - {response.text}")
        return None

def test_create_index(collection_id: str, vector_field: str = "general_embedding"):
    """测试创建向量索引"""
    print(f"🔨 测试为Collection {collection_id} 的 {vector_field} 字段创建索引...")
    
    # 使用HNSW索引配置
    request_data = {
        "collection_id": collection_id,
        "vector_field": vector_field,
        "config": {
            "index_type": "hnsw",
            "distance_metric": "vector_cosine_ops",
            "m": 16,
            "ef_construction": 64
        },
        "force_recreate": True  # 强制重建以避免已存在的错误
    }
    
    response = requests.post(
        f"{BASE_URL}/vector-index/create",
        json=request_data,
        headers={"Content-Type": "application/json"}
    )
    
    if response.status_code == 200:
        data = response.json()
        print("✅ 索引创建成功:")
        print(f"   索引名: {data['data']['index_name']}")
        print(f"   构建耗时: {data['data']['build_time']:.2f} 秒")
        print(f"   索引类型: {data['data']['index_type']}")
        
        return data
    else:
        print(f"❌ 创建索引失败: {response.status_code} - {response.text}")
        return None

def test_rebuild_indexes(collection_id: str):
    """测试重建Collection的所有索引"""
    print(f"🔄 测试重建Collection {collection_id} 的所有索引...")
    
    request_data = {
        "collection_id": collection_id,
        "vector_fields": ["general_embedding"],  # 只重建general_embedding
        "config": {
            "index_type": "hnsw",
            "distance_metric": "vector_cosine_ops", 
            "m": 16,
            "ef_construction": 64
        }
    }
    
    response = requests.post(
        f"{BASE_URL}/vector-index/rebuild",
        json=request_data,
        headers={"Content-Type": "application/json"}
    )
    
    if response.status_code == 200:
        data = response.json()
        print("✅ 索引重建完成:")
        
        if data.get('async_mode'):
            print(f"   后台模式: 预计耗时 {data['data'].get('estimated_time_minutes', 'N/A')} 分钟")
            print(f"   总向量数: {data['data'].get('total_vectors', 0)}")
        else:
            print(f"   同步模式: 总耗时 {data['data'].get('total_build_time', 0):.2f} 秒")
            print(f"   重建索引数: {len(data['data'].get('rebuilt_indexes', []))}")
        
        return data
    else:
        print(f"❌ 重建索引失败: {response.status_code} - {response.text}")
        return None

def main():
    """主测试函数"""
    print("🚀 开始测试向量索引管理API\n")
    
    # 测试用的Collection ID - 需要替换为实际存在的ID
    test_collection_id = "test_collection_id"  # 替换为实际的Collection ID
    
    try:
        # 1. 获取支持的配置选项
        configs = test_get_supported_configs()
        if not configs:
            print("❌ 无法获取配置信息，停止测试")
            return
        
        print("\n" + "="*60)
        
        # 2. 分析Collection向量数据（需要实际存在的Collection）
        print(f"📝 注意: 请将 test_collection_id 替换为实际存在的Collection ID")
        print(f"📝 当前使用的测试ID: {test_collection_id}")
        
        # 分析向量数据
        analysis = test_analyze_collection_vectors(test_collection_id)
        
        print("\n" + "="*60)
        
        # 3. 获取当前索引状态
        status = test_get_index_status(test_collection_id)
        
        print("\n" + "="*60)
        
        # 4. 创建索引（如果分析成功）
        if analysis and analysis.get('vector_statistics', {}).get('general_embedding', {}).get('count', 0) > 0:
            create_result = test_create_index(test_collection_id, "general_embedding")
            
            print("\n" + "="*60)
            
            # 5. 重建索引
            if create_result:
                rebuild_result = test_rebuild_indexes(test_collection_id)
        else:
            print("⚠️  跳过索引创建测试 - Collection不存在或无向量数据")
        
        print("\n" + "="*60)
        print("🎉 向量索引管理API测试完成")
        
    except Exception as e:
        print(f"❌ 测试过程中出现异常: {e}")

if __name__ == "__main__":
    main()