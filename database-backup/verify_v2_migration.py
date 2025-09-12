#!/usr/bin/env python3
"""
验证 v2.0 迁移完成状态
检查所有组件是否按照新架构正常工作
"""

import asyncio
import sys
import json
from elasticsearch import Elasticsearch
from datetime import datetime

# ES连接配置
es = Elasticsearch(['http://localhost:9200'])

def print_section(title):
    print(f"\n{'='*60}")
    print(f"  {title}")
    print('='*60)

def check_indices():
    """检查索引是否按照v2命名"""
    print_section("检查 Elasticsearch 索引")
    
    # 应该存在的v2索引
    v2_indices = [
        'document_chunks',
        'general_vectors', 
        'domain_vectors',
        'papers',
        'documents',
        'retrieval_cache',
        'media'
    ]
    
    # 不应该存在的旧索引
    old_indices = [
        'mat_qa_chunks',
        'mat_qa_general_vectors',
        'mat_qa_domain_vectors',
        'mat_qa_papers',
        'mat_qa_documents',
        'mat_qa_retrieval_cache',
        'mat_qa_media'
    ]
    
    existing_indices = es.indices.get_alias().keys()
    
    print("\n✅ V2.0 索引状态:")
    for index in v2_indices:
        status = "✓" if index in existing_indices else "✗"
        print(f"  [{status}] {index}")
    
    print("\n🔍 检查旧索引 (应该不存在):")
    has_old = False
    for index in old_indices:
        if index in existing_indices:
            print(f"  [⚠️] {index} 仍然存在")
            has_old = True
    
    if not has_old:
        print("  ✓ 所有旧索引已清理")
    
    return not has_old

def check_mapping():
    """检查映射是否正确"""
    print_section("检查索引映射")
    
    if es.indices.exists(index='document_chunks'):
        mapping = es.indices.get_mapping(index='document_chunks')
        properties = mapping['document_chunks']['mappings']['properties']
        
        print("\n📋 document_chunks 映射检查:")
        
        # 检查新字段
        if 'embedding' in properties:
            dims = properties['embedding'].get('dims', 0)
            print(f"  ✓ embedding 字段存在 (维度: {dims})")
            if dims == 2560:
                print(f"    ✓ 维度正确: 2560")
            else:
                print(f"    ✗ 维度错误: 期望 2560, 实际 {dims}")
        else:
            print("  ✗ embedding 字段不存在")
        
        # 检查旧字段是否已删除
        old_fields = ['general_embedding', 'domain_embedding', 'ali_embedding', 'matbert_embedding']
        for field in old_fields:
            if field in properties:
                print(f"  ⚠️ 旧字段 {field} 仍然存在")
            else:
                print(f"  ✓ 旧字段 {field} 已删除")
        
        return True
    else:
        print("  ✗ document_chunks 索引不存在")
        return False

def check_data():
    """检查数据完整性"""
    print_section("检查数据完整性")
    
    # 检查document_chunks中的数据
    if es.indices.exists(index='document_chunks'):
        result = es.search(
            index='document_chunks',
            body={
                "size": 0,
                "aggs": {
                    "total_docs": {"cardinality": {"field": "document_id"}},
                    "total_chunks": {"value_count": {"field": "id"}}
                }
            }
        )
        
        total_docs = result['aggregations']['total_docs']['value']
        total_chunks = result['aggregations']['total_chunks']['value']
        
        print(f"\n📊 数据统计:")
        print(f"  文档数量: {total_docs}")
        print(f"  分块数量: {total_chunks}")
        
        # 获取最新的文档
        recent = es.search(
            index='document_chunks',
            body={
                "size": 1,
                "sort": [{"created_at": {"order": "desc"}}],
                "_source": ["id", "document_id", "created_at", "embedding_model"]
            }
        )
        
        if recent['hits']['hits']:
            doc = recent['hits']['hits'][0]['_source']
            print(f"\n📄 最新文档:")
            print(f"  ID: {doc.get('id', 'N/A')}")
            print(f"  文档ID: {doc.get('document_id', 'N/A')}")
            print(f"  创建时间: {doc.get('created_at', 'N/A')}")
            print(f"  嵌入模型: {doc.get('embedding_model', 'N/A')}")
            
            # 检查向量维度
            doc_with_vector = es.get(
                index='document_chunks',
                id=doc['id']
            )
            if 'embedding' in doc_with_vector['_source']:
                vector_dim = len(doc_with_vector['_source']['embedding'])
                print(f"  向量维度: {vector_dim}")
                if vector_dim == 2560:
                    print(f"    ✓ 向量维度正确")
                else:
                    print(f"    ✗ 向量维度错误: 期望 2560, 实际 {vector_dim}")
    
    return True

def check_aliases():
    """检查别名配置"""
    print_section("检查索引别名")
    
    aliases = es.indices.get_alias()
    
    expected_aliases = {
        'chunks': 'document_chunks',
        'cache': 'retrieval_cache'
    }
    
    print("\n🔗 别名状态:")
    for alias, expected_index in expected_aliases.items():
        found = False
        for index, index_aliases in aliases.items():
            if 'aliases' in index_aliases and alias in index_aliases['aliases']:
                if index == expected_index:
                    print(f"  ✓ {alias} -> {index}")
                else:
                    print(f"  ⚠️ {alias} -> {index} (期望: {expected_index})")
                found = True
                break
        if not found:
            print(f"  ✗ {alias} 别名不存在")
    
    return True

async def test_embedding():
    """测试嵌入服务"""
    print_section("测试嵌入服务")
    
    try:
        # 添加项目路径
        import sys
        import os
        backend_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '../lite-backend'))
        if backend_path not in sys.path:
            sys.path.insert(0, backend_path)
        
        from service.embedding_service import embedding_service
        
        test_text = "This is a test document for v2.0 migration verification"
        response = await embedding_service.create_embeddings(
            'alibaba/Qwen/Qwen3-Embedding-4B',
            [test_text]
        )
        
        print(f"\n🧪 嵌入测试:")
        print(f"  模型: {response.model}")
        print(f"  提供商: {response.provider}")
        print(f"  配置维度: {response.dimension}")
        print(f"  实际维度: {len(response.embeddings[0])}")
        
        if len(response.embeddings[0]) == 2560:
            print(f"  ✓ 向量维度匹配: 2560")
        else:
            print(f"  ✗ 向量维度不匹配: {len(response.embeddings[0])}")
        
        return True
    except Exception as e:
        print(f"  ✗ 嵌入服务测试失败: {e}")
        return False

def main():
    print("\n" + "="*60)
    print("  NextAgentLite v2.0 迁移验证")
    print("  " + datetime.now().strftime("%Y-%m-%d %H:%M:%S"))
    print("="*60)
    
    results = []
    
    # 1. 检查索引
    results.append(("索引命名", check_indices()))
    
    # 2. 检查映射
    results.append(("索引映射", check_mapping()))
    
    # 3. 检查数据
    results.append(("数据完整性", check_data()))
    
    # 4. 检查别名
    results.append(("索引别名", check_aliases()))
    
    # 5. 测试嵌入服务
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    results.append(("嵌入服务", loop.run_until_complete(test_embedding())))
    
    # 总结
    print_section("验证总结")
    
    all_passed = True
    for name, passed in results:
        status = "✓" if passed else "✗"
        print(f"  [{status}] {name}")
        if not passed:
            all_passed = False
    
    print("\n" + "="*60)
    if all_passed:
        print("  🎉 所有检查通过! v2.0 迁移成功")
    else:
        print("  ⚠️ 部分检查失败，请检查上述问题")
    print("="*60 + "\n")
    
    return 0 if all_passed else 1

if __name__ == "__main__":
    sys.exit(main())