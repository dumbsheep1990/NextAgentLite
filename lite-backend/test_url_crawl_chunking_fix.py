#!/usr/bin/env python3
"""测试URL爬取是否使用了知识库的切分配置"""
import asyncio
import httpx
from core.logger import logger

async def test_url_crawl_with_collection_config():
    """测试URL爬取功能是否正确使用知识库切分配置"""

    # 政策知识库ID
    collection_id = "df302d09-1821-479d-a36d-c59c5c9846ec"

    # 测试URL
    test_url = "https://www.gov.cn/zhengce/content/202510/content_6981234.htm"

    print("=" * 80)
    print("测试URL爬取切分配置修复")
    print("=" * 80)
    print(f"\n知识库ID: {collection_id}")
    print(f"测试URL: {test_url}")
    print(f"\n预期行为:")
    print("  - 应该自动使用知识库配置的切分策略: 测试切分1")
    print("  - chunk_size应该是550 (而不是380)")
    print("  - chunk_overlap应该是50 (而不是40)")
    print("\n开始测试...\n")

    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            # 发送URL处理请求
            response = await client.post(
                "http://localhost:8000/api/v1/url-crawl/process",
                json={
                    "urls": [test_url],
                    "collection_id": collection_id,
                    "tags": ["测试"],
                    "description": "测试切分配置修复",
                    "crawl_options": {}
                }
            )

            if response.status_code == 200:
                result = response.json()
                print(f"✅ URL处理请求已提交")
                print(f"   任务ID: {result.get('task_id')}")
                print(f"   状态: {result.get('status')}")
                print(f"\n⏳ 等待处理完成... (可能需要30-60秒)")

                # 等待一段时间让处理完成
                await asyncio.sleep(30)

                print(f"\n📋 请检查后端日志，查找类似以下内容:")
                print(f"   '后台任务 xxx: 使用知识库指定的切分配置: 52c94e0d-85c0-467a-a753-db7a21fb8023'")
                print(f"\n💡 你也可以通过前端查看新文档的切分配置")

            else:
                print(f"❌ 请求失败: {response.status_code}")
                print(f"   响应: {response.text}")

    except Exception as e:
        print(f"❌ 测试失败: {e}")

if __name__ == "__main__":
    asyncio.run(test_url_crawl_with_collection_config())
