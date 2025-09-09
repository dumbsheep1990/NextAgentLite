#!/usr/bin/env python3
"""
CORS配置验证脚本
用于验证生产环境的CORS配置是否正确
"""

import requests
import os
import sys
from typing import List

def test_cors_config(base_url: str, frontend_origins: List[str]) -> None:
    """测试CORS配置是否正确"""
    
    print(f"🔍 测试后端服务: {base_url}")
    print(f"🌐 前端域名: {frontend_origins}")
    print("=" * 60)
    
    # 测试端点
    test_endpoint = f"{base_url}/api/v1/config/"
    
    for origin in frontend_origins:
        print(f"\n🧪 测试来源: {origin}")
        
        try:
            # 测试GET请求
            response = requests.get(
                test_endpoint,
                headers={"Origin": origin},
                timeout=10
            )
            
            if response.status_code == 200:
                # 检查CORS头部
                cors_origin = response.headers.get('Access-Control-Allow-Origin')
                cors_credentials = response.headers.get('Access-Control-Allow-Credentials')
                
                print(f"   ✅ 状态码: {response.status_code}")
                print(f"   🔑 Access-Control-Allow-Origin: {cors_origin}")
                print(f"   🍪 Access-Control-Allow-Credentials: {cors_credentials}")
                
                if cors_origin == origin:
                    print(f"   ✅ CORS配置正确!")
                else:
                    print(f"   ❌ CORS配置错误! 期望: {origin}, 实际: {cors_origin}")
            else:
                print(f"   ❌ 请求失败: {response.status_code}")
                
        except requests.exceptions.RequestException as e:
            print(f"   ❌ 连接失败: {e}")
            
        try:
            # 测试OPTIONS预检请求
            options_response = requests.options(
                test_endpoint,
                headers={
                    "Origin": origin,
                    "Access-Control-Request-Method": "POST",
                    "Access-Control-Request-Headers": "Content-Type"
                },
                timeout=10
            )
            
            if options_response.status_code == 200:
                allow_methods = options_response.headers.get('Access-Control-Allow-Methods')
                allow_headers = options_response.headers.get('Access-Control-Allow-Headers')
                
                print(f"   🛠️  OPTIONS预检: ✅")
                print(f"   📝 允许方法: {allow_methods}")
                print(f"   📄 允许头部: {allow_headers}")
            else:
                print(f"   🛠️  OPTIONS预检: ❌ ({options_response.status_code})")
                
        except requests.exceptions.RequestException as e:
            print(f"   🛠️  OPTIONS预检失败: {e}")

def main():
    """主函数"""
    
    # 从环境变量或命令行参数获取配置
    backend_url = os.getenv('BACKEND_URL', 'http://localhost:8000')
    cors_origins = os.getenv('CORS_ORIGINS', 'http://localhost:3000').split(',')
    
    # 命令行参数优先
    if len(sys.argv) > 1:
        backend_url = sys.argv[1]
    if len(sys.argv) > 2:
        cors_origins = sys.argv[2].split(',')
    
    # 清理域名列表
    cors_origins = [origin.strip() for origin in cors_origins if origin.strip()]
    
    print("🚀 CORS配置验证工具")
    print("=" * 60)
    
    test_cors_config(backend_url, cors_origins)
    
    print("\n" + "=" * 60)
    print("✅ 验证完成!")
    print("\n💡 使用方法:")
    print("   python verify_cors_config.py")
    print("   python verify_cors_config.py http://8.153.90.125:8000 http://8.153.90.125:3000")
    print("   BACKEND_URL=http://8.153.90.125:8000 CORS_ORIGINS=http://8.153.90.125:3000 python verify_cors_config.py")

if __name__ == "__main__":
    main() 