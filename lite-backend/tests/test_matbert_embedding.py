#!/usr/bin/env python3
"""
MatBERT嵌入服务测试脚本
"""
import asyncio
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from service.embedding_service import embedding_service

async def test_matbert_embedding():
    """测试MatBERT嵌入服务"""
    
    test_texts = [
        "地聚物材料的力学性能研究",
        "粉煤灰基地聚物混凝土的耐久性分析", 
        "硅酸盐胶凝材料的水化机理"
    ]
    
    try:
        print("开始测试MatBERT嵌入服务...")
        print(f"测试文本: {len(test_texts)} 条")
        
        # 测试MatBERT嵌入
        response = await embedding_service.create_embeddings(
            "matbert_embedding/matbert-base-v1",
            test_texts
        )
        
        print(f"\n测试结果:")
        print(f"  模型: {response.model}")
        print(f"  提供商: {response.provider}")
        print(f"  维度: {response.dimension}")
        print(f"  向量数量: {len(response.embeddings)}")
        if response.processing_time:
            print(f"  处理时间: {response.processing_time}s")
        if response.tokens_used:
            print(f"  Token使用: {response.tokens_used}")
        
        # 验证向量维度
        assert response.dimension == 768, f"预期维度768，实际{response.dimension}"
        assert len(response.embeddings) == len(test_texts), f"向量数量不匹配"
        assert all(len(embedding) == 768 for embedding in response.embeddings), "向量维度不一致"
        
        # 输出部分向量值用于验证
        print(f"\n第一个向量前5个值: {response.embeddings[0][:5]}")
        
        print("\nMatBERT嵌入服务测试通过")
        return True
        
    except Exception as e:
        print(f"\nMatBERT嵌入服务测试失败: {e}")
        return False
    
    finally:
        await embedding_service.close()

async def test_all_embedding_models():
    """测试所有可用的嵌入模型"""
    
    try:
        print("\n获取所有支持的嵌入模型...")
        all_models = await embedding_service.get_supported_models()
        
        print(f"支持的提供商和模型:")
        for provider, models in all_models.items():
            print(f"  {provider}: {models}")
        
        # 测试模型路径验证
        test_paths = [
            "qwen_embedding/text-embedding-v3",
            "matbert_embedding/matbert-base-v1",
            "invalid_provider/model",
            "qwen_embedding/invalid_model"
        ]
        
        print(f"\n测试模型路径验证:")
        for path in test_paths:
            valid = await embedding_service.validate_model_path(path)
            status = "通过" if valid else "失败"
            print(f"  {status} {path}")
        
        return True
        
    except Exception as e:
        print(f"模型列表获取失败: {e}")
        return False

if __name__ == "__main__":
    async def main():
        print("开始MatBERT嵌入服务测试")
        print("=" * 50)
        
        # 测试MatBERT嵌入
        success1 = await test_matbert_embedding()
        
        # 测试所有模型
        success2 = await test_all_embedding_models()
        
        print("=" * 50)
        if success1 and success2:
            print("所有测试通过！")
        else:
            print("部分测试失败！")
            sys.exit(1)
    
    asyncio.run(main())