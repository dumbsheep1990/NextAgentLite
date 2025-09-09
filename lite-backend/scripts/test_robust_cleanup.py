#!/usr/bin/env python3
"""
测试清理API的错误处理能力
包括测试不存在文档的跳过处理
"""

import asyncio
import aiohttp
import json
import sys
import os
from pathlib import Path

# 添加项目根目录到Python路径
project_root = str(Path(__file__).parent.parent)
sys.path.insert(0, project_root)
os.environ['PYTHONPATH'] = project_root

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text, select
from db.database import get_async_session
from models.knowledge import KnowledgeDocument as KnowledgeDocumentModel

async def get_database_stats():
    """获取数据库统计信息"""
    try:
        async with get_async_session() as db:
            # 查询文档状态统计
            result = await db.execute(text("""
                SELECT status, COUNT(*) as count 
                FROM knowledge_documents 
                GROUP BY status
                ORDER BY status
            """))
            doc_stats = {row.status: row.count for row in result.fetchall()}
            
            # 查询任务队列统计
            task_result = await db.execute(text("""
                SELECT status, COUNT(*) as count 
                FROM task_queue 
                WHERE task_type = 'document_processing'
                GROUP BY status
                ORDER BY status
            """))
            task_stats = {row.status: row.count for row in task_result.fetchall()}
            
            return {
                "documents": doc_stats,
                "tasks": task_stats,
                "total_documents": sum(doc_stats.values()),
                "total_tasks": sum(task_stats.values())
            }
    except Exception as e:
        print(f"❌ 获取数据库统计失败: {e}")
        return None

async def test_cleanup_api(endpoint_name, url):
    """测试清理API"""
    print(f"\n🧪 测试 {endpoint_name}...")
    
    try:
        async with aiohttp.ClientSession() as session:
            async with session.delete(url) as response:
                response_text = await response.text()
                
                if response.status == 200:
                    try:
                        data = json.loads(response_text)
                        print(f"✅ {endpoint_name} 成功:")
                        print(f"   - 成功: {data.get('success', False)}")
                        print(f"   - 消息: {data.get('message', 'N/A')}")
                        print(f"   - 删除数量: {data.get('deleted_count', 0)}")
                        
                        cleaned_data = data.get('cleaned_data', {})
                        print(f"   - 清理数据:")
                        print(f"     * PostgreSQL文档: {cleaned_data.get('postgres_documents', 0)}")
                        print(f"     * PostgreSQL分块: {cleaned_data.get('postgres_chunks', 0)}")
                        print(f"     * ElasticSearch: {cleaned_data.get('elasticsearch_documents', 0)}")
                        print(f"     * 任务队列: {cleaned_data.get('task_queue_records', 0)}")
                        
                        if 'breakdown' in data:
                            breakdown = data['breakdown']
                            print(f"   - 细分:")
                            print(f"     * 失败文档: {breakdown.get('failed_documents', 0)}")
                            print(f"     * 等待文档: {breakdown.get('pending_documents', 0)}")
                        
                        return True
                    except json.JSONDecodeError:
                        print(f"⚠️ {endpoint_name} 响应不是有效JSON: {response_text}")
                        return False
                else:
                    print(f"❌ {endpoint_name} 失败: HTTP {response.status}")
                    print(f"   响应: {response_text}")
                    return False
                    
    except aiohttp.ClientError as e:
        print(f"❌ {endpoint_name} 网络错误: {e}")
        return False
    except Exception as e:
        print(f"❌ {endpoint_name} 未知错误: {e}")
        return False

async def test_statistics_api():
    """测试统计API"""
    print(f"\n📊 测试统计API...")
    
    try:
        async with aiohttp.ClientSession() as session:
            async with session.get("http://localhost:8000/api/v1/knowledge/documents/status-statistics") as response:
                response_text = await response.text()
                
                if response.status == 200:
                    try:
                        data = json.loads(response_text)
                        print(f"✅ 统计API成功:")
                        print(f"   - 成功: {data.get('success', False)}")
                        
                        stats = data.get('statistics', {})
                        doc_status = stats.get('document_status', {})
                        problematic = stats.get('problematic_documents', {})
                        task_queue = stats.get('task_queue', {})
                        
                        print(f"   - 文档状态:")
                        for status, count in doc_status.items():
                            print(f"     * {status}: {count}")
                        
                        print(f"   - 问题文档:")
                        print(f"     * 失败: {problematic.get('failed', 0)}")
                        print(f"     * 等待: {problematic.get('pending', 0)}")
                        print(f"     * 总计: {problematic.get('total', 0)}")
                        
                        print(f"   - 任务队列:")
                        for status, count in task_queue.items():
                            print(f"     * {status}: {count}")
                        
                        return True
                    except json.JSONDecodeError:
                        print(f"⚠️ 统计API响应不是有效JSON: {response_text}")
                        return False
                else:
                    print(f"❌ 统计API失败: HTTP {response.status}")
                    print(f"   响应: {response_text}")
                    return False
                    
    except aiohttp.ClientError as e:
        print(f"❌ 统计API网络错误: {e}")
        return False
    except Exception as e:
        print(f"❌ 统计API未知错误: {e}")
        return False

async def main():
    """主测试函数"""
    print("🔧 开始测试清理API的健壮性...")
    
    # 获取初始统计
    print("\n📊 获取初始数据库统计...")
    initial_stats = await get_database_stats()
    if initial_stats:
        print("初始统计:")
        print(f"  - 文档: {initial_stats['documents']}")
        print(f"  - 任务: {initial_stats['tasks']}")
        print(f"  - 总文档数: {initial_stats['total_documents']}")
        print(f"  - 总任务数: {initial_stats['total_tasks']}")
    
    # 测试统计API
    await test_statistics_api()
    
    # 测试清理API（依次进行，避免并发冲突）
    test_results = []
    
    # 1. 测试清理pending文档
    result1 = await test_cleanup_api(
        "清理Pending文档", 
        "http://localhost:8000/api/v1/knowledge/documents/clear-pending"
    )
    test_results.append(("清理Pending文档", result1))
    
    # 等待一下再进行下一个测试
    await asyncio.sleep(1)
    
    # 2. 测试清理所有问题文档
    result2 = await test_cleanup_api(
        "清理所有问题文档", 
        "http://localhost:8000/api/v1/knowledge/documents/clear-problematic"
    )
    test_results.append(("清理所有问题文档", result2))
    
    # 获取最终统计
    print("\n📊 获取最终数据库统计...")
    final_stats = await get_database_stats()
    if final_stats:
        print("最终统计:")
        print(f"  - 文档: {final_stats['documents']}")
        print(f"  - 任务: {final_stats['tasks']}")
        print(f"  - 总文档数: {final_stats['total_documents']}")
        print(f"  - 总任务数: {final_stats['total_tasks']}")
    
    # 计算变化
    if initial_stats and final_stats:
        doc_change = final_stats['total_documents'] - initial_stats['total_documents']
        task_change = final_stats['total_tasks'] - initial_stats['total_tasks']
        print(f"\n📈 变化统计:")
        print(f"  - 文档变化: {doc_change:+d}")
        print(f"  - 任务变化: {task_change:+d}")
    
    # 最终测试统计API
    await test_statistics_api()
    
    # 测试结果总结
    print(f"\n🎯 测试结果总结:")
    success_count = sum(1 for _, result in test_results if result)
    total_count = len(test_results)
    
    for test_name, result in test_results:
        status = "✅ 成功" if result else "❌ 失败"
        print(f"  - {test_name}: {status}")
    
    print(f"\n总体成功率: {success_count}/{total_count} ({success_count/total_count*100:.1f}%)")
    
    if success_count == total_count:
        print("🎉 所有测试通过！清理API已具备健壮的错误处理能力。")
    else:
        print("⚠️ 部分测试失败，需要进一步检查。")

if __name__ == "__main__":
    asyncio.run(main()) 