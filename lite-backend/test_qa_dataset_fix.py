#!/usr/bin/env python3
"""
测试QA数据集上传修复
"""

import asyncio
import sys
import os

# 添加项目路径
sys.path.insert(0, os.path.dirname(__file__))

from db.database import get_async_session
from db.repositories.knowledge_repository import KnowledgeRepository

async def test_collection_method():
    """测试get_collection_by_id方法"""
    
    print("🧪 测试QA数据集上传修复")
    print("=" * 40)
    
    try:
        async with get_async_session() as session:
            knowledge_repo = KnowledgeRepository(session)
            
            # 测试方法是否存在并可以调用
            print("✅ KnowledgeRepository 初始化成功")
            print(f"✅ get_collection_by_id 方法存在: {hasattr(knowledge_repo, 'get_collection_by_id')}")
            
            # 尝试调用方法（使用一个不存在的ID）
            test_collection_id = "test-id-12345"
            result = await knowledge_repo.get_collection_by_id(test_collection_id)
            print(f"✅ 方法调用成功，结果: {result}")
            
            if result is None:
                print("✅ 对于不存在的collection_id，返回None（正确行为）")
            else:
                print(f"ℹ️  找到collection: {result.name}")
            
            print("\n🎉 QA数据集上传修复测试完成！")
            print("现在 get_collection_by_id 方法应该正常工作了")
            
    except Exception as e:
        print(f"❌ 测试失败: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_collection_method())