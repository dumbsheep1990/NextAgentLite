#!/usr/bin/env python3
"""
测试URL爬取功能
"""

import asyncio
import sys
import os

# 添加项目路径
sys.path.insert(0, os.path.dirname(__file__))

from service.url_crawl_service import url_crawl_service

async def test_url_crawl():
    """测试URL爬取功能"""
    
    print("🧪 开始测试URL爬取功能")
    print("=" * 50)
    
    # 测试URL列表
    test_urls = [
        "https://httpbin.org/html",  # 简单HTML测试页面
        "https://example.com",        # 基础网站
        "https://www.google.com",     # 大型网站
        "https://invalid-url-test-12345.com"  # 无效URL测试
    ]
    
    try:
        # 使用异步上下文管理器
        async with url_crawl_service as service:
            print(f"📋 爬取服务配置:")
            config = service.get_config()
            for key, value in config.items():
                print(f"   {key}: {value}")
            print()
            
            print(f"📝 测试URL列表:")
            for i, url in enumerate(test_urls, 1):
                print(f"   {i}. {url}")
            print()
            
            # 批量爬取测试
            print("🚀 开始批量爬取测试...")
            results = await service.crawl_multiple_urls(test_urls)
            
            print(f"\n📊 爬取结果统计:")
            successful = sum(1 for r in results if r.success)
            failed = len(results) - successful
            print(f"   总计: {len(results)} 个URL")
            print(f"   成功: {successful} 个")
            print(f"   失败: {failed} 个")
            print(f"   成功率: {successful/len(results)*100:.1f}%")
            
            print(f"\n📋 详细结果:")
            for i, result in enumerate(results, 1):
                print(f"\n{i}. {result.url}")
                print(f"   成功: {'✅' if result.success else '❌'}")
                if result.success:
                    title = result.title or "无标题"
                    print(f"   标题: {title[:50]}{'...' if len(title) > 50 else ''}")
                    print(f"   内容大小: {result.file_size} 字节")
                    markdown_preview = result.markdown or ""
                    print(f"   Markdown预览: {markdown_preview[:100].replace(chr(10), ' ')}{'...' if len(markdown_preview) > 100 else ''}")
                    if result.metadata:
                        print(f"   爬取方法: {result.metadata.get('crawl_method', '未知')}")
                        print(f"   内容类型: {result.metadata.get('content_type', '未知')}")
                else:
                    print(f"   错误: {result.error}")
            
            # 单个URL测试（使用不同的策略）
            print(f"\n🎯 单个URL爬取测试 (使用不同策略):")
            test_url = "https://httpbin.org/html"
            
            print(f"\n1️⃣ 使用Crawl4AI爬取:")
            result1 = await service.crawl_single_url(test_url, use_crawl4ai=True)
            print(f"   成功: {'✅' if result1.success else '❌'}")
            if result1.success:
                title1 = result1.title or "无标题"
                print(f"   标题: {title1}")
                print(f"   内容大小: {result1.file_size} 字节")
                print(f"   爬取方法: {result1.metadata.get('crawl_method', '未知') if result1.metadata else '未知'}")
            else:
                print(f"   错误: {result1.error}")
            
            print(f"\n2️⃣ 使用基础HTTP爬取:")
            result2 = await service.crawl_single_url(test_url, use_crawl4ai=False)
            print(f"   成功: {'✅' if result2.success else '❌'}")
            if result2.success:
                title2 = result2.title or "无标题"
                print(f"   标题: {title2}")
                print(f"   内容大小: {result2.file_size} 字节")
                print(f"   爬取方法: {result2.metadata.get('crawl_method', '未知') if result2.metadata else '未知'}")
            else:
                print(f"   错误: {result2.error}")
            
            print(f"\n🎉 URL爬取功能测试完成!")
            
    except Exception as e:
        print(f"❌ 测试过程中发生错误: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_url_crawl())