#!/usr/bin/env python3
"""
URL爬取功能测试脚本
"""
import asyncio
import sys
import os
from pathlib import Path

# 添加项目根目录到Python路径
sys.path.insert(0, str(Path(__file__).parent))

from service.url_crawl_service import url_crawl_service
from service.knowledge_service import knowledge_service

async def test_url_crawl():
    """测试URL爬取基础功能"""
    print("🌐 测试URL爬取基础功能...")
    
    test_urls = [
        "https://www.example.com",
        "https://httpbin.org/html",  # 简单的HTML测试页面
    ]
    
    async with url_crawl_service as service:
        print(f"📋 服务配置: {service.get_config()}")
        
        # 测试单个URL爬取
        print("\n🔍 测试单个URL爬取:")
        for url in test_urls:
            try:
                result = await service.crawl_single_url(url)
                print(f"✅ {url}")
                print(f"   标题: {result.title}")
                print(f"   成功: {result.success}")
                print(f"   内容长度: {result.file_size} 字节")
                if result.success:
                    print(f"   Markdown预览: {result.markdown[:200]}...")
                else:
                    print(f"   错误: {result.error}")
                print()
            except Exception as e:
                print(f"❌ {url}: {str(e)}")
        
        # 测试批量URL爬取
        print("\n🔍 测试批量URL爬取:")
        try:
            results = await service.crawl_multiple_urls(test_urls[:1])  # 只测试第一个URL
            print(f"✅ 批量爬取完成，共处理 {len(results)} 个URL")
            for i, result in enumerate(results):
                print(f"   URL {i+1}: {result.url}")
                print(f"   成功: {result.success}")
                if result.success:
                    print(f"   标题: {result.title}")
                    print(f"   大小: {result.file_size} 字节")
        except Exception as e:
            print(f"❌ 批量爬取失败: {str(e)}")

async def test_knowledge_integration():
    """测试URL内容与知识库集成"""
    print("\n📚 测试URL内容与知识库集成...")
    
    test_document_data = {
        'filename': 'test_crawled_page.md',
        'content': '''# 测试页面

这是一个测试页面，包含以下内容：

## 第一部分
这是第一个段落，包含一些基本信息。

## 第二部分  
这是第二个段落，包含更多详细信息。

### 子标题
这是一个子部分的内容。
''',
        'source_url': 'https://test.example.com',
        'original_title': '测试页面',
        'crawl_metadata': {
            'method': 'test',
            'timestamp': '2025-08-28'
        },
        'file_size': 200,
        'content_type': 'text/markdown'
    }
    
    try:
        if knowledge_service:
            chunks = await knowledge_service.process_url_content(
                document_data=test_document_data,
                tags=['测试', 'URL爬取'],
                description='URL爬取功能测试文档'
            )
            print(f"✅ 知识库处理成功，生成 {len(chunks)} 个文档块")
            for i, chunk in enumerate(chunks[:3]):  # 只显示前3个块
                print(f"   块 {i+1}: {chunk.content[:100]}...")
        else:
            print("❌ 知识服务未初始化")
    except Exception as e:
        print(f"❌ 知识库集成测试失败: {str(e)}")

async def main():
    """主测试函数"""
    print("🚀 开始URL爬取功能测试")
    print("=" * 50)
    
    try:
        # 测试基础爬取功能
        await test_url_crawl()
        
        # 测试知识库集成
        await test_knowledge_integration()
        
        print("\n" + "=" * 50)
        print("✅ 所有测试完成")
        
    except Exception as e:
        print(f"\n❌ 测试过程中出错: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(main())