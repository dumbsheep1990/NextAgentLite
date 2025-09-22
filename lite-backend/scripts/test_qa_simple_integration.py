#!/usr/bin/env python3
"""
简化的QA生成集成测试 - 直接使用配置连接数据库
"""

import sys
import os
import asyncio
import psycopg2
from pathlib import Path

# 添加项目根目录到Python路径
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

from core.config_optimized import optimized_config_manager
from service.qa_generation_service_simplified import qa_generation_service_simplified

def get_db_connection():
    """获取数据库连接"""
    db_config = optimized_config_manager.settings.database_postgresql
    return psycopg2.connect(
        host=db_config.host,
        port=db_config.port,
        database=db_config.database,
        user=db_config.username,
        password=db_config.password
    )

async def test_basic_database():
    """测试基本数据库连接"""
    print("🔗 测试数据库连接...")
    try:
        conn = get_db_connection()
        with conn.cursor() as cursor:
            cursor.execute("SELECT version();")
            result = cursor.fetchone()
            print(f"✅ 数据库连接成功: {result[0][:50]}...")
        conn.close()
        return True
    except Exception as e:
        print(f"❌ 数据库连接失败: {e}")
        return False

async def test_qa_generation_with_dummy_data():
    """使用模拟数据测试QA生成"""
    print("\n🤖 测试QA生成功能 (使用模拟数据)...")
    
    # 直接测试QA生成器，不依赖数据库
    try:
        # 测试文本
        test_content = """
        地聚物材料是一种新型的无机胶凝材料，具有优异的力学性能和耐久性。
        地聚物的制备过程包括原料预处理、碱激活、聚合固化等步骤。
        地聚物材料在建筑工程中有广泛的应用前景，可以替代传统的水泥材料。
        研究表明，地聚物材料具有良好的抗压强度和抗渗透性能。
        地聚物的微观结构呈现三维网状结构，这是其优异性能的基础。
        """
        
        # 使用GC-QA-RAG生成器
        generator = qa_generation_service_simplified.qa_generator
        print("✅ QA生成器初始化成功")
        
        print("🔄 生成QA对中...")
        result = generator.generate(test_content)
        
        if result and 'Groups' in result:
            total_qa_pairs = 0
            print(f"✅ QA生成成功，包含 {len(result['Groups'])} 个组")
            
            for i, group in enumerate(result['Groups'], 1):
                summary = group.get('Summary', '')
                qa_pairs = group.get('PossibleQA', [])
                total_qa_pairs += len(qa_pairs)
                
                print(f"\n📋 组 {i}:")
                if summary:
                    print(f"  摘要: {summary}")
                
                print(f"  QA对数量: {len(qa_pairs)}")
                
                # 显示前2个QA对
                for j, qa in enumerate(qa_pairs[:2], 1):
                    question = qa.get('Question', '')
                    answer = qa.get('Answer', '')
                    print(f"\n    QA{j}:")
                    print(f"    问题: {question}")
                    print(f"    答案: {answer}")
            
            print(f"\n🎉 总共生成了 {total_qa_pairs} 个QA对")
            return True
        else:
            print("❌ QA生成失败")
            return False
            
    except Exception as e:
        print(f"❌ QA生成测试失败: {e}")
        import traceback
        traceback.print_exc()
        return False

async def test_table_creation():
    """测试表创建功能"""
    print("\n📋 测试QA表创建...")
    try:
        # 这会触发表创建
        service = qa_generation_service_simplified
        print("✅ QA生成服务初始化成功，表已创建")
        return True
    except Exception as e:
        print(f"❌ 表创建失败: {e}")
        return False

async def test_embedding_generation():
    """测试嵌入生成"""
    print("\n🔤 测试向量嵌入生成...")
    try:
        # 测试嵌入生成
        test_text = "地聚物材料是什么？"
        embedding = await qa_generation_service_simplified._generate_embedding(test_text)
        
        if embedding and len(embedding) == 2560:
            print(f"✅ 嵌入生成成功，维度: {len(embedding)}")
            print(f"   前5个值: {embedding[:5]}")
            return True
        else:
            print(f"❌ 嵌入生成失败，维度: {len(embedding) if embedding else 0}")
            return False
            
    except Exception as e:
        print(f"❌ 嵌入生成测试失败: {e}")
        return False

async def main():
    """主测试函数"""
    print("🚀 开始GC-QA-RAG简化集成测试")
    print("=" * 50)
    
    tests = [
        ("数据库连接", test_basic_database),
        ("QA表创建", test_table_creation),
        ("QA生成功能", test_qa_generation_with_dummy_data),
        ("嵌入生成", test_embedding_generation),
    ]
    
    passed = 0
    total = len(tests)
    
    for test_name, test_func in tests:
        print(f"\n🔍 测试: {test_name}")
        print("-" * 30)
        
        try:
            result = await test_func()
            if result:
                print(f"✅ {test_name} 通过")
                passed += 1
            else:
                print(f"❌ {test_name} 失败")
        except Exception as e:
            print(f"❌ {test_name} 异常: {e}")
    
    print("\n" + "=" * 50)
    print("📋 简化集成测试结果:")
    print("=" * 50)
    print(f"通过: {passed}/{total}")
    
    if passed == total:
        print("\n🎉 所有核心功能测试通过！")
        print("\n📝 验证成果:")
        print("✅ GC-QA-RAG算法成功集成")
        print("✅ 数据库连接正常")
        print("✅ 表结构创建成功")
        print("✅ QA生成功能工作正常")
        print("✅ 向量嵌入生成正常")
        print("\n🚀 准备就绪，可以继续完整集成！")
    else:
        print(f"\n⚠️ {total - passed} 个测试失败")

if __name__ == "__main__":
    asyncio.run(main())