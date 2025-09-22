#!/usr/bin/env python3
"""
QA生成功能测试脚本
测试GC-QA-RAG集成到NextAgentLite的功能
"""

import sys
import os
import asyncio
import json
from pathlib import Path

# 添加项目根目录到Python路径
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

from service.qa_generation_service import qa_generation_service
from db.database_utils import DatabaseUtils
from core.logger import logger


async def test_database_connection():
    """测试数据库连接"""
    print("🔗 测试数据库连接...")
    try:
        db_utils = DatabaseUtils()
        result = db_utils.execute_sql("SELECT version();")
        if result:
            print(f"✅ 数据库连接成功: {result[0][0]}")
            return True
        else:
            print("❌ 数据库连接失败")
            return False
    except Exception as e:
        print(f"❌ 数据库连接错误: {e}")
        return False


async def test_table_creation():
    """测试表创建"""
    print("\n📋 测试QA表创建...")
    try:
        # 这会自动创建表
        qa_generation_service._ensure_tables_exist()
        print("✅ QA表创建成功")
        return True
    except Exception as e:
        print(f"❌ QA表创建失败: {e}")
        return False


async def test_pgvector_extension():
    """测试pgvector扩展"""
    print("\n🔍 检查pgvector扩展...")
    try:
        db_utils = DatabaseUtils()
        result = db_utils.execute_sql("SELECT * FROM pg_extension WHERE extname = 'vector';")
        if result:
            print("✅ pgvector扩展已安装")
            return True
        else:
            print("❌ pgvector扩展未安装，尝试安装...")
            try:
                db_utils.execute_sql("CREATE EXTENSION IF NOT EXISTS vector;")
                print("✅ pgvector扩展安装成功")
                return True
            except Exception as install_e:
                print(f"❌ pgvector扩展安装失败: {install_e}")
                return False
    except Exception as e:
        print(f"❌ pgvector扩展检查失败: {e}")
        return False


async def test_sample_document():
    """创建测试文档"""
    print("\n📄 创建测试文档...")
    try:
        db_utils = DatabaseUtils()
        
        # 插入测试文档
        insert_doc_sql = """
        INSERT INTO knowledge_documents 
        (title, content, extracted_text, document_type, file_path, status, created_at)
        VALUES (%s, %s, %s, %s, %s, %s, NOW())
        RETURNING id
        """
        
        test_content = """
        地聚物材料是一种新型的无机胶凝材料，具有优异的力学性能和耐久性。
        地聚物的制备过程包括原料预处理、碱激活、聚合固化等步骤。
        地聚物材料在建筑工程中有广泛的应用前景，可以替代传统的水泥材料。
        研究表明，地聚物材料具有良好的抗压强度和抗渗透性能。
        地聚物的微观结构呈现三维网状结构，这是其优异性能的基础。
        """
        
        result = db_utils.execute_sql(insert_doc_sql, (
            "地聚物材料测试文档",
            test_content,
            test_content,
            "text",
            "/test/geopolymer_test.txt",
            "processed"
        ))
        
        if result:
            document_id = result[0][0]
            print(f"✅ 测试文档创建成功，ID: {document_id}")
            return document_id
        else:
            print("❌ 测试文档创建失败")
            return None
            
    except Exception as e:
        print(f"❌ 测试文档创建错误: {e}")
        return None


async def test_qa_generation(document_id: int):
    """测试QA生成功能"""
    print(f"\n🤖 测试QA生成功能 (文档ID: {document_id})...")
    try:
        # 创建QA任务
        task_id = await qa_generation_service.create_qa_task(document_id)
        print(f"✅ QA任务创建成功，任务ID: {task_id}")
        
        # 处理QA任务
        print("🔄 处理QA任务中...")
        result = await qa_generation_service.process_qa_task(task_id)
        
        if result['success']:
            print(f"✅ QA生成成功，生成了 {result['qa_pairs_count']} 个QA对")
            
            # 获取生成的QA对
            qa_pairs = await qa_generation_service.get_qa_pairs_by_task(task_id)
            print(f"\n📝 生成的QA对示例:")
            for i, qa_pair in enumerate(qa_pairs[:3], 1):  # 只显示前3个
                print(f"\n{i}. 问题: {qa_pair['question']}")
                print(f"   答案: {qa_pair['answer'][:100]}...")
                if qa_pair['summary']:
                    print(f"   摘要: {qa_pair['summary'][:50]}...")
                    
            return True
        else:
            print(f"❌ QA生成失败: {result['error']}")
            return False
            
    except Exception as e:
        print(f"❌ QA生成测试错误: {e}")
        return False


async def test_qa_search():
    """测试QA搜索功能"""
    print("\n🔍 测试QA搜索功能...")
    try:
        # 搜索与地聚物相关的QA对
        search_results = await qa_generation_service.search_qa_pairs(
            query="地聚物材料的性能特点",
            vector_field="question",
            limit=5
        )
        
        if search_results:
            print(f"✅ QA搜索成功，找到 {len(search_results)} 个结果")
            
            for i, result in enumerate(search_results[:2], 1):  # 显示前2个结果
                print(f"\n{i}. 问题: {result['question']}")
                print(f"   答案: {result['answer'][:100]}...")
                print(f"   相似度: {result.get('similarity_score', 0):.3f}")
                
            return True
        else:
            print("⚠️ QA搜索未找到结果")
            return False
            
    except Exception as e:
        print(f"❌ QA搜索测试错误: {e}")
        return False


async def test_statistics():
    """测试统计功能"""
    print("\n📊 测试统计功能...")
    try:
        stats = await qa_generation_service.get_qa_task_status(1)  # 假设存在任务ID 1
        if stats:
            print("✅ 统计功能正常")
            print(f"   任务状态: {stats['status']}")
            print(f"   QA对数量: {stats['qa_pairs_count']}")
            return True
        else:
            print("⚠️ 未找到统计数据")
            return False
            
    except Exception as e:
        print(f"❌ 统计功能测试错误: {e}")
        return False


async def cleanup_test_data(document_id: int = None):
    """清理测试数据"""
    print("\n🧹 清理测试数据...")
    try:
        db_utils = DatabaseUtils()
        
        if document_id:
            # 删除QA对 (CASCADE会自动删除)
            db_utils.execute_sql(
                "DELETE FROM qa_generation_tasks WHERE document_id = %s",
                (document_id,)
            )
            
            # 删除测试文档
            db_utils.execute_sql(
                "DELETE FROM knowledge_documents WHERE id = %s",
                (document_id,)
            )
            
        print("✅ 测试数据清理完成")
        
    except Exception as e:
        print(f"❌ 测试数据清理错误: {e}")


async def main():
    """主测试函数"""
    print("🚀 开始QA生成功能集成测试")
    print("=" * 50)
    
    # 测试步骤
    test_results = []
    
    # 1. 数据库连接测试
    db_ok = await test_database_connection()
    test_results.append(("数据库连接", db_ok))
    
    if not db_ok:
        print("\n❌ 数据库连接失败，终止测试")
        return
    
    # 2. pgvector扩展测试
    vector_ok = await test_pgvector_extension()
    test_results.append(("pgvector扩展", vector_ok))
    
    if not vector_ok:
        print("\n❌ pgvector扩展不可用，终止测试")
        return
    
    # 3. 表创建测试
    table_ok = await test_table_creation()
    test_results.append(("表创建", table_ok))
    
    if not table_ok:
        print("\n❌ 表创建失败，终止测试")
        return
    
    # 4. 创建测试文档
    document_id = await test_sample_document()
    test_results.append(("测试文档创建", document_id is not None))
    
    if not document_id:
        print("\n❌ 测试文档创建失败，终止测试")
        return
    
    try:
        # 5. QA生成测试
        qa_ok = await test_qa_generation(document_id)
        test_results.append(("QA生成", qa_ok))
        
        # 6. QA搜索测试
        search_ok = await test_qa_search()
        test_results.append(("QA搜索", search_ok))
        
        # 7. 统计功能测试
        stats_ok = await test_statistics()
        test_results.append(("统计功能", stats_ok))
        
    finally:
        # 清理测试数据
        await cleanup_test_data(document_id)
    
    # 输出测试结果
    print("\n" + "=" * 50)
    print("📋 测试结果汇总:")
    print("=" * 50)
    
    passed = 0
    total = len(test_results)
    
    for test_name, result in test_results:
        status = "✅ 通过" if result else "❌ 失败"
        print(f"{test_name:20} {status}")
        if result:
            passed += 1
    
    print("-" * 50)
    print(f"总计: {passed}/{total} 个测试通过")
    
    if passed == total:
        print("\n🎉 所有测试通过！QA生成功能集成成功！")
        print("\n📝 接下来可以:")
        print("1. 启动后端服务测试API")
        print("2. 更新前端页面集成QA生成功能")
        print("3. 运行完整的端到端测试")
    else:
        print(f"\n⚠️ {total - passed} 个测试失败，请检查相关配置")


if __name__ == "__main__":
    asyncio.run(main())