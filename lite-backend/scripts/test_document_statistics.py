#!/usr/bin/env python3
"""
测试文档状态统计API功能
"""
import asyncio
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

async def get_database_statistics():
    """直接从数据库获取文档状态统计"""
    try:
        async with get_async_session() as session:
            # 查询文档状态统计
            query = text("""
                SELECT status, COUNT(*) as count 
                FROM knowledge_documents 
                GROUP BY status
                ORDER BY status
            """)
            result = await session.execute(query)
            stats = {row.status: row.count for row in result.fetchall()}
            
            print("\n📊 数据库中的文档状态统计:")
            print("=" * 40)
            total_docs = 0
            for status, count in stats.items():
                print(f"  {status}: {count}")
                total_docs += count
            print(f"  总计: {total_docs}")
            
            # 计算问题文档
            failed = stats.get('failed', 0)
            pending = stats.get('pending', 0)
            problematic = failed + pending
            
            print(f"\n🚨 问题文档统计:")
            print(f"  失败文档: {failed}")
            print(f"  等待文档: {pending}")
            print(f"  问题总计: {problematic}")
            
            return stats, {'failed': failed, 'pending': pending, 'problematic': problematic}
            
    except Exception as e:
        print(f"❌ 获取数据库统计失败: {e}")
        return {}, {}

async def test_statistics_api():
    """测试文档状态统计API"""
    print("\n🧪 测试文档状态统计API...")
    
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(f"{API_BASE_URL}/knowledge/documents/status-statistics")
            
            if response.status_code == 200:
                result = response.json()
                print("✅ API调用成功!")
                
                if result.get('success'):
                    stats = result['statistics']
                    print(f"\n📄 API返回的文档状态统计:")
                    for status, count in stats['document_status'].items():
                        print(f"  {status}: {count}")
                    
                    print(f"\n🚨 API返回的问题文档统计:")
                    problematic = stats['problematic_documents']
                    print(f"  失败文档: {problematic['failed']}")
                    print(f"  等待文档: {problematic['pending']}")
                    print(f"  问题总计: {problematic['total']}")
                    
                    return problematic
                else:
                    print(f"❌ API返回失败: {result}")
                    return None
            else:
                print(f"❌ API调用失败: {response.status_code}")
                print(f"错误信息: {response.text}")
                return None
                
    except Exception as e:
        print(f"❌ API测试失败: {e}")
        return None

async def compare_statistics():
    """对比数据库统计和API统计"""
    print("\n🔍 对比数据库统计和API统计...")
    
    # 获取数据库统计
    db_stats, db_problematic = await get_database_statistics()
    
    # 获取API统计
    api_problematic = await test_statistics_api()
    
    if db_problematic and api_problematic:
        print(f"\n📊 统计对比结果:")
        print("=" * 50)
        print(f"数据源 | 失败文档 | 等待文档 | 问题总计")
        print("-" * 50)
        print(f"数据库 | {db_problematic['failed']:8d} | {db_problematic['pending']:8d} | {db_problematic['problematic']:8d}")
        print(f"API    | {api_problematic['failed']:8d} | {api_problematic['pending']:8d} | {api_problematic['total']:8d}")
        
        # 检查一致性
        failed_match = db_problematic['failed'] == api_problematic['failed']
        pending_match = db_problematic['pending'] == api_problematic['pending']
        total_match = db_problematic['problematic'] == api_problematic['total']
        
        if failed_match and pending_match and total_match:
            print("\n✅ 数据库和API统计完全一致!")
        else:
            print("\n❌ 数据库和API统计不一致:")
            if not failed_match:
                print(f"  失败文档不匹配: DB({db_problematic['failed']}) vs API({api_problematic['failed']})")
            if not pending_match:
                print(f"  等待文档不匹配: DB({db_problematic['pending']}) vs API({api_problematic['pending']})")
            if not total_match:
                print(f"  总计不匹配: DB({db_problematic['problematic']}) vs API({api_problematic['total']})")

async def test_api_performance():
    """测试API性能"""
    print("\n⚡ 测试API性能...")
    
    import time
    
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            # 测试多次调用的性能
            times = []
            for i in range(5):
                start_time = time.time()
                response = await client.get(f"{API_BASE_URL}/knowledge/documents/status-statistics")
                end_time = time.time()
                
                if response.status_code == 200:
                    duration = end_time - start_time
                    times.append(duration)
                    print(f"  第{i+1}次调用: {duration:.3f}秒")
                else:
                    print(f"  第{i+1}次调用失败: {response.status_code}")
            
            if times:
                avg_time = sum(times) / len(times)
                min_time = min(times)
                max_time = max(times)
                
                print(f"\n📈 性能统计:")
                print(f"  平均响应时间: {avg_time:.3f}秒")
                print(f"  最快响应时间: {min_time:.3f}秒")
                print(f"  最慢响应时间: {max_time:.3f}秒")
                
                if avg_time < 1.0:
                    print("  ✅ API性能良好")
                elif avg_time < 3.0:
                    print("  ⚠️  API性能一般")
                else:
                    print("  ❌ API性能较差")
                    
    except Exception as e:
        print(f"❌ 性能测试失败: {e}")

async def main():
    """主测试函数"""
    print("🚀 开始测试文档状态统计API功能")
    print("=" * 60)
    
    # 1. 对比数据库和API统计
    await compare_statistics()
    
    # 2. 测试API性能
    await test_api_performance()
    
    print(f"\n🎯 测试建议:")
    print("1. 确保后端服务正在运行")
    print("2. 检查数据库连接配置")
    print("3. 如果统计不一致，检查API逻辑")
    print("4. 如果性能较差，考虑添加缓存")
    
    print("\n✅ 测试完成!")

if __name__ == "__main__":
    asyncio.run(main()) 