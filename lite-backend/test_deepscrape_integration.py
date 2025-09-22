#!/usr/bin/env python3
"""
DeepScrape集成测试脚本
测试DeepScrape服务集成功能
"""

import asyncio
import json
import sys
import os
from pathlib import Path

# 添加项目根目录到Python路径
project_root = Path(__file__).parent
sys.path.insert(0, str(project_root))

from core.logger import logger
from service.deepscrape_service import deepscrape_service


async def test_deepscrape_health():
    """测试DeepScrape服务健康状态"""
    print("=" * 60)
    print("📊 测试DeepScrape服务健康状态")
    print("=" * 60)
    
    try:
        async with deepscrape_service as service:
            health_result = await service.check_health()
            
            print(f"健康状态: {health_result['status']}")
            if health_result['status'] == 'healthy':
                print("✅ DeepScrape服务可用")
                if 'response_time' in health_result:
                    print(f"响应时间: {health_result['response_time']:.3f}秒")
                return True
            else:
                print("❌ DeepScrape服务不可用")
                print(f"错误信息: {health_result.get('error', 'Unknown error')}")
                return False
                
    except Exception as e:
        print(f"❌ 健康检查失败: {e}")
        return False


async def test_single_url_scraping():
    """测试单URL抓取"""
    print("\n" + "=" * 60)
    print("🌐 测试单URL抓取功能")
    print("=" * 60)
    
    test_url = "https://httpbin.org/html"
    
    try:
        async with deepscrape_service as service:
            result = await service.scrape_single_url(
                url=test_url,
                options={
                    'extractorFormat': 'markdown',
                    'waitForTimeout': 3000
                }
            )
            
            if result['success']:
                print(f"✅ 成功抓取: {test_url}")
                print(f"标题: {result.get('title', 'N/A')}")
                print(f"内容长度: {len(result.get('content', ''))} 字符")
                
                # 显示内容预览
                content_preview = result.get('content', '')[:200]
                print(f"内容预览: {content_preview}...")
                
                return True
            else:
                print(f"❌ 抓取失败: {result.get('error', 'Unknown error')}")
                return False
                
    except Exception as e:
        print(f"❌ 单URL抓取测试失败: {e}")
        return False


async def test_schema_extraction():
    """测试Schema结构化抽取"""
    print("\n" + "=" * 60)
    print("🔍 测试Schema结构化抽取")
    print("=" * 60)
    
    test_url = "https://httpbin.org/json"
    schema = {
        "type": "object",
        "properties": {
            "url": {
                "type": "string",
                "description": "The URL that was accessed"
            },
            "origin": {
                "type": "string", 
                "description": "The origin IP address"
            },
            "headers": {
                "type": "object",
                "description": "HTTP headers"
            }
        },
        "required": ["url"]
    }
    
    try:
        async with deepscrape_service as service:
            result = await service.extract_with_schema(
                url=test_url,
                schema=schema,
                options={
                    'extractorFormat': 'text',
                    'waitForTimeout': 3000
                }
            )
            
            if result['success']:
                print(f"✅ 成功执行Schema抽取: {test_url}")
                extracted_data = result.get('extracted_data', {})
                print("抽取结果:")
                print(json.dumps(extracted_data, indent=2, ensure_ascii=False))
                
                return True
            else:
                print(f"❌ Schema抽取失败: {result.get('error', 'Unknown error')}")
                return False
                
    except Exception as e:
        print(f"❌ Schema抽取测试失败: {e}")
        return False


async def test_content_summarization():
    """测试内容摘要生成"""
    print("\n" + "=" * 60)
    print("📝 测试内容摘要生成")
    print("=" * 60)
    
    test_url = "https://httpbin.org/html"
    
    try:
        async with deepscrape_service as service:
            result = await service.summarize_content(
                url=test_url,
                max_length=200,
                options={
                    'extractorFormat': 'markdown',
                    'waitForTimeout': 3000,
                    'temperature': 0.3
                }
            )
            
            if result['success']:
                print(f"✅ 成功生成摘要: {test_url}")
                summary = result.get('summary', '')
                print(f"摘要长度: {len(summary)} 字符")
                print(f"摘要内容: {summary}")
                
                return True
            else:
                print(f"❌ 摘要生成失败: {result.get('error', 'Unknown error')}")
                return False
                
    except Exception as e:
        print(f"❌ 摘要生成测试失败: {e}")
        return False


async def test_batch_processing():
    """测试批量处理"""
    print("\n" + "=" * 60)
    print("🚀 测试批量处理功能")
    print("=" * 60)
    
    test_urls = [
        "https://httpbin.org/html",
        "https://httpbin.org/json",
        "https://httpbin.org/xml"
    ]
    
    try:
        async with deepscrape_service as service:
            result = await service.batch_scrape(
                urls=test_urls,
                concurrency=2,
                options={
                    'extractorFormat': 'markdown',
                    'waitForTimeout': 3000
                }
            )
            
            if result['success']:
                print(f"✅ 成功完成批量处理")
                statistics = result.get('statistics', {})
                print(f"总URL数: {statistics.get('total_urls', 0)}")
                print(f"成功数: {statistics.get('completed_urls', 0)}")
                print(f"失败数: {statistics.get('failed_urls', 0)}")
                print(f"处理时间: {statistics.get('processing_time', 0)}ms")
                
                return True
            else:
                print(f"❌ 批量处理失败: {result.get('error', 'Unknown error')}")
                return False
                
    except Exception as e:
        print(f"❌ 批量处理测试失败: {e}")
        return False


async def test_api_integration():
    """测试API集成"""
    print("\n" + "=" * 60)
    print("🔌 测试API集成")
    print("=" * 60)
    
    try:
        # 模拟API调用
        from api.endpoints.url_crawl_api import crawl_urls, URLCrawlRequest
        
        # 创建请求对象
        request = URLCrawlRequest(
            urls=["https://httpbin.org/html"],
            engine="deepscrape",
            options={
                'extractorFormat': 'markdown',
                'waitForTimeout': 3000
            }
        )
        
        # 调用API
        response = await crawl_urls(request)
        
        if response.success:
            print("✅ API集成测试成功")
            print(f"消息: {response.message}")
            print(f"处理结果数: {len(response.results)}")
            
            statistics = response.statistics
            print(f"引擎: {statistics.get('engine', 'unknown')}")
            print(f"成功率: {statistics.get('success_rate', 0):.1f}%")
            
            return True
        else:
            print("❌ API集成测试失败")
            return False
            
    except Exception as e:
        print(f"❌ API集成测试失败: {e}")
        return False


def print_configuration_info():
    """打印配置信息"""
    print("=" * 60)
    print("⚙️  当前配置信息")
    print("=" * 60)
    
    try:
        from core.config_optimized import optimized_config_manager
        config = optimized_config_manager.settings
        deepscrape_config = config.deepscrape
        
        print(f"DeepScrape Base URL: {deepscrape_config.base_url}")
        print(f"API Key: {'*' * len(deepscrape_config.api_key[:-4]) + deepscrape_config.api_key[-4:]}")
        print(f"超时时间: {deepscrape_config.timeout}秒")
        print(f"服务启用: {deepscrape_config.enabled}")
        print(f"默认格式: {deepscrape_config.default_extractor_format}")
        print(f"默认并发: {deepscrape_config.default_concurrency}")
        
    except Exception as e:
        print(f"获取配置信息失败: {e}")


def print_usage_instructions():
    """打印使用说明"""
    print("\n" + "=" * 60)
    print("📚 使用说明")
    print("=" * 60)
    
    print("1. 确保DeepScrape服务已启动:")
    print("   cd deepscrape")
    print("   # 在.env中设置 PORT=3001 避免与前端端口冲突") 
    print("   npm run dev")
    print()
    print("2. 配置环境变量:")
    print("   cp env.deepscrape.example .env")
    print("   # 编辑.env文件，设置DEEPSCRAPE_ENABLED=true")
    print()
    print("3. API端点:")
    print("   - 标准抓取: POST /api/v1/url-crawl/crawl")
    print("   - 智能抓取: POST /api/v1/url-crawl/deepscrape") 
    print("   - 网站爬取: POST /api/v1/url-crawl/deepscrape/crawl")
    print("   - 配置查询: GET /api/v1/url-crawl/config")
    print()
    print("4. 示例请求:")
    print("""   curl -X POST http://localhost:8000/api/v1/url-crawl/deepscrape \\
     -H "Content-Type: application/json" \\
     -d '{
       "urls": ["https://example.com"],
       "extraction_schema": {
         "type": "object",
         "properties": {
           "title": {"type": "string"},
           "content": {"type": "string"}
         }
       }
     }'""")


async def main():
    """主测试函数"""
    print("🚀 DeepScrape集成测试")
    print("=" * 60)
    
    # 打印配置信息
    print_configuration_info()
    
    # 运行测试
    tests = [
        ("服务健康检查", test_deepscrape_health),
        ("单URL抓取", test_single_url_scraping),
        ("Schema结构化抽取", test_schema_extraction),
        ("内容摘要生成", test_content_summarization),
        ("批量处理", test_batch_processing),
        ("API集成", test_api_integration),
    ]
    
    results = []
    
    for test_name, test_func in tests:
        try:
            result = await test_func()
            results.append((test_name, result))
        except Exception as e:
            logger.error(f"测试 {test_name} 出现异常: {e}")
            results.append((test_name, False))
    
    # 打印测试总结
    print("\n" + "=" * 60)
    print("📊 测试结果总结")
    print("=" * 60)
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for test_name, result in results:
        status = "✅ 通过" if result else "❌ 失败"
        print(f"{test_name}: {status}")
    
    print(f"\n通过率: {passed}/{total} ({passed/total*100:.1f}%)")
    
    if passed == total:
        print("🎉 所有测试通过！DeepScrape集成成功！")
    else:
        print("⚠️  部分测试失败，请检查配置和服务状态")
    
    # 打印使用说明
    print_usage_instructions()
    
    return passed == total


if __name__ == "__main__":
    try:
        success = asyncio.run(main())
        sys.exit(0 if success else 1)
    except KeyboardInterrupt:
        print("\n❌ 测试被用户中断")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ 测试运行失败: {e}")
        sys.exit(1)