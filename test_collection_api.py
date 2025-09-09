#!/usr/bin/env python3
"""
知识库Collection API集成测试脚本
验证新创建的API端点是否正常工作
"""
import asyncio
import aiohttp
import json
import sys
from typing import Dict, Any

# API基础URL
BASE_URL = "http://localhost:8000/api/v1"

async def test_api_endpoint(session: aiohttp.ClientSession, method: str, endpoint: str, data: Dict[str, Any] = None):
    """测试单个API端点"""
    url = f"{BASE_URL}{endpoint}"
    
    try:
        if method.upper() == "GET":
            async with session.get(url) as response:
                result = {
                    "method": method,
                    "endpoint": endpoint,
                    "status": response.status,
                    "success": response.status < 400
                }
                if response.status == 200:
                    try:
                        result["data"] = await response.json()
                    except:
                        result["data"] = await response.text()
                else:
                    result["error"] = await response.text()
                return result
        
        elif method.upper() == "POST":
            async with session.post(url, json=data) as response:
                result = {
                    "method": method,
                    "endpoint": endpoint,
                    "status": response.status,
                    "success": response.status < 400,
                    "data": data
                }
                if response.status < 400:
                    try:
                        result["response"] = await response.json()
                    except:
                        result["response"] = await response.text()
                else:
                    result["error"] = await response.text()
                return result
                
    except Exception as e:
        return {
            "method": method,
            "endpoint": endpoint,
            "status": "connection_error",
            "success": False,
            "error": str(e)
        }

async def main():
    """主测试函数"""
    print("🚀 开始知识库Collection API集成测试...")
    print(f"📍 测试基础URL: {BASE_URL}")
    print("-" * 60)
    
    # 测试用例列表
    test_cases = [
        # 元数据模版API测试
        {
            "name": "获取元数据模版类型",
            "method": "GET",
            "endpoint": "/metadata-templates/types"
        },
        {
            "name": "获取元数据模版列表",
            "method": "GET", 
            "endpoint": "/metadata-templates"
        },
        
        # Collection API测试
        {
            "name": "获取知识库列表",
            "method": "GET",
            "endpoint": "/collections"
        },
        {
            "name": "获取全局统计",
            "method": "GET",
            "endpoint": "/collections/statistics/global"
        },
        {
            "name": "创建测试知识库",
            "method": "POST",
            "endpoint": "/collections",
            "data": {
                "name": "API测试知识库",
                "description": "用于API集成测试的临时知识库",
                "metadata_template": "general"
            }
        }
    ]
    
    results = []
    
    async with aiohttp.ClientSession() as session:
        for i, test_case in enumerate(test_cases, 1):
            print(f"🧪 测试 {i}/{len(test_cases)}: {test_case['name']}")
            
            result = await test_api_endpoint(
                session=session,
                method=test_case['method'],
                endpoint=test_case['endpoint'],
                data=test_case.get('data')
            )
            
            results.append({
                "name": test_case['name'],
                **result
            })
            
            # 显示结果
            if result['success']:
                print(f"   ✅ 成功 (HTTP {result['status']})")
                if result.get('response'):
                    # 显示响应数据的简化信息
                    resp = result['response']
                    if isinstance(resp, dict):
                        if 'collections' in resp:
                            print(f"      📦 找到 {len(resp['collections'])} 个知识库")
                        elif 'templates' in resp:
                            print(f"      📋 找到 {len(resp['templates'])} 个模版")
                        elif 'types' in resp:
                            print(f"      🏷️ 找到 {len(resp['types'])} 种模版类型")
                        elif 'total_collections' in resp:
                            print(f"      📊 系统统计: {resp['total_collections']} 个知识库, {resp.get('total_documents', 0)} 个文档")
                        elif 'name' in resp:
                            print(f"      🆕 创建知识库: {resp['name']} (ID: {resp.get('id', 'N/A')})")
            else:
                print(f"   ❌ 失败 (HTTP {result['status']})")
                if result.get('error'):
                    error_msg = result['error'][:200] + "..." if len(result['error']) > 200 else result['error']
                    print(f"      错误: {error_msg}")
            
            print()
    
    # 生成测试报告
    print("=" * 60)
    print("📋 测试报告")
    print("=" * 60)
    
    total_tests = len(results)
    successful_tests = len([r for r in results if r['success']])
    failed_tests = total_tests - successful_tests
    
    print(f"总测试数: {total_tests}")
    print(f"成功: {successful_tests} ✅")
    print(f"失败: {failed_tests} ❌")
    print(f"成功率: {(successful_tests/total_tests*100):.1f}%")
    
    if failed_tests > 0:
        print("\n❌ 失败的测试:")
        for result in results:
            if not result['success']:
                print(f"  • {result['name']}: {result.get('error', result['status'])}")
    
    # 详细结果保存到文件
    with open('collection_api_test_results.json', 'w', encoding='utf-8') as f:
        json.dump(results, f, ensure_ascii=False, indent=2, default=str)
    
    print(f"\n📄 详细测试结果已保存到: collection_api_test_results.json")
    
    # 根据成功率确定退出码
    sys.exit(0 if successful_tests == total_tests else 1)

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n⚠️ 测试被用户中断")
        sys.exit(1)
    except Exception as e:
        print(f"\n💥 测试执行出错: {e}")
        sys.exit(1)