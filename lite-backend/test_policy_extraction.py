#!/usr/bin/env python3
"""测试政策文档元数据提取"""
import asyncio
from service.metadata_extraction.policy_extractor import PolicyMetadataExtractor

async def test_extraction():
    # 读取测试文档
    with open('/Users/wxn/Desktop/NextAgentLite/lite-backend/uploads/documents/20251028/99a65061-a803-4a7a-9ff6-e0c2afce6592.md', 'r', encoding='utf-8') as f:
        content = f.read()
    
    # 创建提取器
    extractor = PolicyMetadataExtractor()
    
    # 配置
    config = {
        'enable_llm_extraction': False  # 暂时关闭LLM提取
    }
    
    # 提取元数据
    print("=== 开始提取政策元数据 ===\n")
    result = await extractor.extract(content, "test.md", config)
    
    print(f"提取成功: {result.success}")
    print(f"置信度: {result.confidence_score}")
    print(f"提取时间: {result.extraction_time:.2f}s")
    print()
    
    if result.extracted_metadata:
        print("📊 提取的元数据:")
        for key, value in result.extracted_metadata.items():
            print(f"  - {key}: {value}")
    
    if result.warnings:
        print("\n⚠️ 警告:")
        for warning in result.warnings:
            print(f"  - {warning}")
    
    if result.errors:
        print("\n❌ 错误:")
        for error in result.errors:
            print(f"  - {error}")

if __name__ == "__main__":
    asyncio.run(test_extraction())
