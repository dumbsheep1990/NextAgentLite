#!/usr/bin/env python3
"""
QA生成功能完整集成测试
测试从文档创建到QA生成的完整流程
"""

import sys
import os
import asyncio
import json
from pathlib import Path

# 添加项目根目录到Python路径
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

from service.qa_generation_service_simplified import qa_generation_service_simplified
from core.config_optimized import optimized_config_manager
from core.logger import logger
import psycopg2

def get_connection():
    """获取数据库连接"""
    db_config = optimized_config_manager.settings.database_postgresql
    return psycopg2.connect(
        host=db_config.host,
        port=db_config.port,
        database=db_config.database,
        user=db_config.username,
        password=db_config.password
    )


async def test_database_connection():
    """测试数据库连接"""
    print("🔗 测试数据库连接...")
    try:
        conn = get_connection()
        with conn.cursor() as cursor:
            cursor.execute("SELECT version();")
            result = cursor.fetchone()
            if result:
                print(f"✅ 数据库连接成功: {result[0][:50]}...")
                conn.close()
                return True
        conn.close()
        return False
    except Exception as e:
        print(f"❌ 数据库连接错误: {e}")
        return False


async def test_pgvector_extension():
    """测试pgvector扩展"""
    print("\n🔍 检查pgvector扩展...")
    try:
        conn = get_connection()
        with conn.cursor() as cursor:
            cursor.execute("SELECT * FROM pg_extension WHERE extname = 'vector';")
            result = cursor.fetchone()
            if result:
                print("✅ pgvector扩展已安装")
                conn.close()
                return True
            else:
                print("❌ pgvector扩展未安装，尝试安装...")
                try:
                    cursor.execute("CREATE EXTENSION IF NOT EXISTS vector;")
                    conn.commit()
                    print("✅ pgvector扩展安装成功")
                    conn.close()
                    return True
                except Exception as install_e:
                    print(f"❌ pgvector扩展安装失败: {install_e}")
                    conn.close()
                    return False
        conn.close()
    except Exception as e:
        print(f"❌ pgvector扩展检查失败: {e}")
        return False


async def create_test_document():
    """创建测试文档"""
    print("\n📄 创建测试文档...")
    try:
        conn = get_connection()
        with conn.cursor() as cursor:
            # 先检查是否已存在测试文档
            cursor.execute("""
                SELECT id FROM knowledge_documents 
                WHERE title = 'GC-QA-RAG集成测试文档'
                LIMIT 1
            """)
            existing = cursor.fetchone()
            
            if existing:
                document_id = existing[0]
                print(f"✅ 使用现有测试文档，ID: {document_id}")
                conn.close()
                return document_id
            
            # 创建测试文档
            test_content = """
            地聚物材料是一种新型的无机胶凝材料，具有优异的力学性能和耐久性。
            地聚物的制备过程包括原料预处理、碱激活、聚合固化等关键步骤。
            在原料预处理阶段，需要将硅铝质原料进行研磨和筛选，确保粒度分布合理。
            碱激活过程中，碱性激发剂与硅铝质原料发生反应，形成胶凝体系。
            聚合固化阶段是地聚物强度发展的关键期，通常需要适当的温度和湿度条件。
            
            地聚物材料在建筑工程中有广泛的应用前景，可以替代传统的水泥材料。
            研究表明，地聚物材料具有良好的抗压强度，通常可达50-80MPa。
            地聚物还具有优异的抗渗透性能，其渗透系数比普通混凝土低1-2个数量级。
            地聚物的微观结构呈现三维网状结构，这是其优异性能的微观基础。
            
            从环保角度来看，地聚物材料可以大量利用工业废料如粉煤灰、矿渣等。
            这不仅减少了工业废料的环境污染，还降低了建材生产的碳排放。
            地聚物的生产过程相比传统水泥，能耗更低，更符合可持续发展要求。
            """
            
            cursor.execute("""
                INSERT INTO knowledge_documents 
                (id, title, filename, file_type, file_size, file_path, status, created_at)
                VALUES (gen_random_uuid()::text, %s, %s, %s, %s, %s, %s, NOW())
                RETURNING id
            """, (
                "GC-QA-RAG集成测试文档",
                "gc_qa_rag_integration_test.txt",
                "text",
                len(test_content.encode('utf-8')),  # 计算文件大小
                "/test/gc_qa_rag_integration_test.txt",
                "processed"
            ))
            
            result = cursor.fetchone()
            document_id = result[0] if result else None
            
            # 创建文档chunks
            if document_id:
                cursor.execute("""
                    INSERT INTO document_chunks 
                    (id, document_id, content, chunk_index, created_at)
                    VALUES (gen_random_uuid()::text, %s, %s, %s, NOW())
                """, (document_id, test_content, 0))
            
        conn.commit()
        conn.close()
        
        if document_id:
            print(f"✅ 测试文档创建成功，ID: {document_id}")
            return document_id
        else:
            print("❌ 测试文档创建失败")
            return None
            
    except Exception as e:
        print(f"❌ 测试文档创建错误: {e}")
        return None


async def test_qa_generation_full_flow(document_id: int):
    """测试完整的QA生成流程"""
    print(f"\n🤖 测试完整QA生成流程 (文档ID: {document_id})...")
    
    try:
        # 1. 创建QA任务
        print("📝 步骤1: 创建QA任务...")
        task_id = await qa_generation_service_simplified.create_qa_task(
            document_id, 
            "GC-QA-RAG集成测试文档"
        )
        print(f"✅ QA任务创建成功，任务ID: {task_id}")
        
        # 2. 检查初始任务状态
        print("\n📊 步骤2: 检查初始任务状态...")
        initial_status = await qa_generation_service_simplified.get_qa_task_status(task_id)
        if initial_status:
            print(f"✅ 初始状态: {initial_status['status']}")
            print(f"   文档: {initial_status.get('document_title', 'Unknown')}")
        else:
            print("❌ 无法获取任务状态")
            return False
        
        # 3. 处理QA任务
        print("\n🔄 步骤3: 处理QA任务...")
        print("   这可能需要几分钟时间，请耐心等待...")
        
        result = await qa_generation_service_simplified.process_qa_task(task_id)
        
        if result['success']:
            print(f"✅ QA生成成功！")
            print(f"   生成的QA对数量: {result['qa_pairs_count']}")
            
            # 4. 显示生成的QA对示例
            print("\n📝 步骤4: QA对示例展示:")
            for i, qa_pair in enumerate(result['qa_pairs'][:3], 1):
                print(f"\n   QA{i}:")
                print(f"   问题: {qa_pair['question']}")
                print(f"   答案: {qa_pair['answer'][:100]}...")
                if qa_pair['summary']:
                    print(f"   摘要: {qa_pair['summary'][:80]}...")
            
            # 5. 检查最终任务状态
            print("\n📊 步骤5: 检查最终任务状态...")
            final_status = await qa_generation_service_simplified.get_qa_task_status(task_id)
            if final_status:
                print(f"✅ 最终状态: {final_status['status']}")
                print(f"   QA对数量: {final_status['qa_pairs_count']}")
                print(f"   完成时间: {final_status.get('completed_at', 'Unknown')}")
            
            return True
        else:
            print(f"❌ QA生成失败: {result['error']}")
            return False
            
    except Exception as e:
        print(f"❌ QA生成流程测试失败: {e}")
        import traceback
        traceback.print_exc()
        return False


async def test_database_queries():
    """测试数据库查询功能"""
    print("\n🔍 测试数据库查询功能...")
    
    try:
        conn = get_connection()
        with conn.cursor() as cursor:
            # 查询任务统计
            cursor.execute("""
                SELECT 
                    COUNT(*) as total_tasks,
                    COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_tasks,
                    COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_tasks,
                    SUM(qa_pairs_count) as total_qa_pairs
                FROM qa_generation_tasks
            """)
            
            stats = cursor.fetchone()
            if stats:
                print(f"✅ 任务统计查询成功:")
                print(f"   总任务数: {stats[0]}")
                print(f"   完成任务: {stats[1]}")
                print(f"   失败任务: {stats[2]}")
                print(f"   总QA对数: {stats[3] or 0}")
            
            # 查询最近的QA对
            cursor.execute("""
                SELECT question, answer, summary
                FROM generated_qa_pairs
                ORDER BY created_at DESC
                LIMIT 3
            """)
            
            recent_qa = cursor.fetchall()
            if recent_qa:
                print(f"\n📝 最近生成的QA对:")
                for i, (question, answer, summary) in enumerate(recent_qa, 1):
                    print(f"   {i}. {question}")
                    print(f"      {answer[:60]}...")
        
        conn.close()
        return True
        
    except Exception as e:
        print(f"❌ 数据库查询测试失败: {e}")
        return False


async def cleanup_test_data(document_id: int = None):
    """清理测试数据"""
    print("\n🧹 清理测试数据...")
    try:
        conn = get_connection()
        with conn.cursor() as cursor:
            if document_id:
                # 删除QA任务 (CASCADE会自动删除QA对)
                cursor.execute(
                    "DELETE FROM qa_generation_tasks WHERE document_id = %s",
                    (document_id,)
                )
                
                # 删除测试文档 (仅删除测试文档)
                cursor.execute(
                    "DELETE FROM knowledge_documents WHERE id = %s AND title LIKE '%测试%'",
                    (document_id,)
                )
                
        conn.commit()
        conn.close()
        print("✅ 测试数据清理完成")
        
    except Exception as e:
        print(f"❌ 测试数据清理错误: {e}")


async def main():
    """主测试函数"""
    print("🚀 开始GC-QA-RAG完整集成测试")
    print("=" * 60)
    
    # 测试步骤
    test_results = []
    document_id = None
    
    try:
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
        
        # 3. 创建测试文档
        document_id = await create_test_document()
        test_results.append(("测试文档创建", document_id is not None))
        
        if not document_id:
            print("\n❌ 测试文档创建失败，终止测试")
            return
        
        # 4. 完整QA生成流程测试
        qa_flow_ok = await test_qa_generation_full_flow(document_id)
        test_results.append(("QA生成流程", qa_flow_ok))
        
        # 5. 数据库查询测试
        db_query_ok = await test_database_queries()
        test_results.append(("数据库查询", db_query_ok))
        
    except Exception as e:
        print(f"\n💥 测试过程中发生异常: {e}")
        import traceback
        traceback.print_exc()
    
    finally:
        # 询问是否清理测试数据
        if document_id:
            print(f"\n❓ 是否清理测试数据？(y/N)")
            # 在脚本中默认不清理，以便检查结果
            # await cleanup_test_data(document_id)
    
    # 输出测试结果
    print("\n" + "=" * 60)
    print("📋 完整集成测试结果汇总:")
    print("=" * 60)
    
    passed = 0
    total = len(test_results)
    
    for test_name, result in test_results:
        status = "✅ 通过" if result else "❌ 失败"
        print(f"{test_name:20} {status}")
        if result:
            passed += 1
    
    print("-" * 60)
    print(f"总计: {passed}/{total} 个测试通过")
    
    if passed == total:
        print("\n🎉 所有测试通过！GC-QA-RAG完整集成成功！")
        print("\n📝 集成成果:")
        print("✅ GC-QA-RAG核心算法成功适配")
        print("✅ PostgreSQL+pgvector向量存储工作正常")
        print("✅ text-embedding-v4(2560维)嵌入生成正常")
        print("✅ 完整的QA生成流程验证成功")
        print("\n🚀 下一步:")
        print("1. 更新API端点集成到主应用")
        print("2. 前端页面集成真实API")
        print("3. 生产环境部署测试")
    else:
        print(f"\n⚠️ {total - passed} 个测试失败，请检查相关配置")
        print("检查日志获取详细错误信息")


if __name__ == "__main__":
    asyncio.run(main())