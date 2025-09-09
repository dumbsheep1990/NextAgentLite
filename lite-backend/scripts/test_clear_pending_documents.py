#!/usr/bin/env python3
"""
测试清理队列等待文档的功能
"""
import asyncio
import json
import httpx
from sqlalchemy import text
from db.database import get_async_session
import os
import sys

# 添加项目根目录到Python路径
project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, project_root)

# 设置环境变量
os.environ['PYTHONPATH'] = project_root

# API基础URL
API_BASE_URL = "http://localhost:8000"

async def get_document_statistics():
    """获取文档状态统计"""
    try:
        async with get_async_session() as session:
            # 统计各状态文档数量
            query = text("""
                SELECT status, COUNT(*) as count 
                FROM knowledge_documents 
                GROUP BY status
                ORDER BY status
            """)
            result = await session.execute(query)
            stats = {row.status: row.count for row in result.fetchall()}
            
            # 统计任务队列
            task_query = text("""
                SELECT status, COUNT(*) as count 
                FROM task_queue 
                WHERE task_type = 'document_processing'
                GROUP BY status
                ORDER BY status
            """)
            task_result = await session.execute(task_query)
            task_stats = {row.status: row.count for row in task_result.fetchall()}
            
            print("\n📊 当前数据库统计:")
            print("=" * 50)
            print("📄 文档状态统计:")
            for status, count in stats.items():
                print(f"  {status}: {count}")
            
            print("\n📋 任务队列统计:")
            for status, count in task_stats.items():
                print(f"  {status}: {count}")
            
            return stats, task_stats
            
    except Exception as e:
        print(f"❌ 获取统计信息失败: {e}")
        return {}, {}

async def test_clear_pending_api():
    """测试清理pending文档的API"""
    print("\n🧪 测试清理pending文档API...")
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.delete(f"{API_BASE_URL}/knowledge/documents/clear-pending")
            
            if response.status_code == 200:
                result = response.json()
                print("✅ API调用成功!")
                print(f"📄 删除文档数量: {result['deleted_count']}")
                print(f"📝 清理详情:")
                for key, value in result['cleaned_data'].items():
                    print(f"  {key}: {value}")
                return result
            else:
                print(f"❌ API调用失败: {response.status_code}")
                print(f"错误信息: {response.text}")
                return None
                
    except Exception as e:
        print(f"❌ API测试失败: {e}")
        return None

async def test_clear_problematic_api():
    """测试清理所有问题文档的API"""
    print("\n🧪 测试清理所有问题文档API...")
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.delete(f"{API_BASE_URL}/knowledge/documents/clear-problematic")
            
            if response.status_code == 200:
                result = response.json()
                print("✅ API调用成功!")
                print(f"📄 删除文档数量: {result['deleted_count']}")
                if 'breakdown' in result:
                    print(f"📊 文档类型分布:")
                    print(f"  失败文档: {result['breakdown']['failed_documents']}")
                    print(f"  等待文档: {result['breakdown']['pending_documents']}")
                print(f"📝 清理详情:")
                for key, value in result['cleaned_data'].items():
                    print(f"  {key}: {value}")
                return result
            else:
                print(f"❌ API调用失败: {response.status_code}")
                print(f"错误信息: {response.text}")
                return None
                
    except Exception as e:
        print(f"❌ API测试失败: {e}")
        return None

async def create_test_documents():
    """创建一些测试用的pending文档"""
    print("\n🔧 创建测试文档...")
    
    try:
        async with get_async_session() as session:
            # 插入几个pending状态的测试文档
            insert_query = text("""
                INSERT INTO knowledge_documents 
                (id, title, filename, file_type, file_size, status, tags, upload_time, created_at, updated_at)
                VALUES 
                ('test-pending-1', 'Test Pending Doc 1', 'test1.pdf', 'pdf', 1024, 'pending', '[]', NOW(), NOW(), NOW()),
                ('test-pending-2', 'Test Pending Doc 2', 'test2.pdf', 'pdf', 2048, 'pending', '[]', NOW(), NOW(), NOW()),
                ('test-failed-1', 'Test Failed Doc 1', 'test3.pdf', 'pdf', 1536, 'failed', '[]', NOW(), NOW(), NOW())
                ON CONFLICT (id) DO NOTHING
            """)
            await session.execute(insert_query)
            await session.commit()
            print("✅ 测试文档创建完成")
            
    except Exception as e:
        print(f"❌ 创建测试文档失败: {e}")

async def main():
    """主测试函数"""
    print("🚀 开始测试清理队列等待文档功能")
    print("=" * 60)
    
    # 1. 获取清理前的统计
    print("\n📊 步骤1: 获取清理前的统计")
    before_stats, before_task_stats = await get_document_statistics()
    
    # 2. 创建测试文档（如果需要）
    if before_stats.get('pending', 0) == 0:
        await create_test_documents()
        print("\n📊 创建测试文档后的统计:")
        before_stats, before_task_stats = await get_document_statistics()
    
    # 3. 测试清理pending文档API
    print("\n🔧 步骤2: 测试清理pending文档")
    pending_result = await test_clear_pending_api()
    
    # 4. 获取清理后的统计
    print("\n📊 步骤3: 获取清理后的统计")
    after_stats, after_task_stats = await get_document_statistics()
    
    # 5. 对比清理效果
    print("\n📈 清理效果对比:")
    print("=" * 50)
    pending_before = before_stats.get('pending', 0)
    pending_after = after_stats.get('pending', 0)
    print(f"Pending文档: {pending_before} → {pending_after} (减少: {pending_before - pending_after})")
    
    # 6. 测试清理所有问题文档API
    if after_stats.get('failed', 0) > 0:
        print("\n🔧 步骤4: 测试清理所有问题文档")
        problematic_result = await test_clear_problematic_api()
        
        print("\n📊 最终统计:")
        final_stats, final_task_stats = await get_document_statistics()
    
    print("\n✅ 测试完成!")

if __name__ == "__main__":
    asyncio.run(main()) 