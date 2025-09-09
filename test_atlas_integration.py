#!/usr/bin/env python3
"""
Embedding Atlas 集成测试脚本
测试Atlas与NextAgentLite系统的集成功能
"""

import asyncio
import aiohttp
import json
import time
import sys
import os
from pathlib import Path

# 测试配置
API_BASE_URL = "http://localhost:8000"
ATLAS_TEST_PORT = 8082

class AtlasIntegrationTester:
    """Atlas集成测试类"""
    
    def __init__(self):
        self.session = None
        self.tests_passed = 0
        self.tests_failed = 0
        
    async def __aenter__(self):
        self.session = aiohttp.ClientSession()
        return self
        
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            await self.session.close()
    
    def print_test(self, test_name: str, status: str, message: str = ""):
        """打印测试结果"""
        status_color = {
            'PASS': '\033[92m✅',
            'FAIL': '\033[91m❌',
            'INFO': '\033[94mℹ️ ',
            'WARN': '\033[93m⚠️ '
        }
        
        color = status_color.get(status, '')
        reset = '\033[0m' if color else ''
        
        print(f"{color} {test_name}: {message}{reset}")
        
        if status == 'PASS':
            self.tests_passed += 1
        elif status == 'FAIL':
            self.tests_failed += 1
    
    async def test_backend_health(self):
        """测试后端健康状态"""
        try:
            async with self.session.get(f"{API_BASE_URL}/health") as resp:
                if resp.status == 200:
                    self.print_test("后端健康检查", "PASS", "后端服务正常运行")
                    return True
                else:
                    self.print_test("后端健康检查", "FAIL", f"状态码: {resp.status}")
                    return False
        except Exception as e:
            self.print_test("后端健康检查", "FAIL", f"连接失败: {str(e)}")
            return False
    
    async def test_atlas_api_endpoints(self):
        """测试Atlas API端点"""
        # 测试获取数据统计
        try:
            async with self.session.get(f"{API_BASE_URL}/atlas/data-stats") as resp:
                if resp.status == 200:
                    data = await resp.json()
                    if data.get('success'):
                        stats = data.get('data', {})
                        total_chunks = stats.get('total_chunks', 0)
                        self.print_test("数据统计API", "PASS", f"找到 {total_chunks} 个文档块")
                    else:
                        self.print_test("数据统计API", "FAIL", data.get('message', '未知错误'))
                        return False
                else:
                    self.print_test("数据统计API", "FAIL", f"状态码: {resp.status}")
                    return False
        except Exception as e:
            self.print_test("数据统计API", "FAIL", f"请求失败: {str(e)}")
            return False
        
        # 测试获取服务状态
        try:
            async with self.session.get(f"{API_BASE_URL}/atlas/status") as resp:
                if resp.status == 200:
                    data = await resp.json()
                    if data.get('success'):
                        status_data = data.get('data', {})
                        running_count = status_data.get('count', 0)
                        self.print_test("服务状态API", "PASS", f"当前有 {running_count} 个Atlas服务运行")
                    else:
                        self.print_test("服务状态API", "FAIL", data.get('message', '未知错误'))
                        return False
                else:
                    self.print_test("服务状态API", "FAIL", f"状态码: {resp.status}")
                    return False
        except Exception as e:
            self.print_test("服务状态API", "FAIL", f"请求失败: {str(e)}")
            return False
        
        return True
    
    async def test_atlas_service_lifecycle(self):
        """测试Atlas服务生命周期"""
        # 启动服务
        try:
            payload = {
                "port": ATLAS_TEST_PORT,
                "limit": 100,  # 限制数据量用于测试
                "host": "localhost"
            }
            
            async with self.session.post(
                f"{API_BASE_URL}/atlas/start", 
                json=payload
            ) as resp:
                if resp.status == 200:
                    data = await resp.json()
                    if data.get('success'):
                        service_data = data.get('data', {})
                        service_url = service_data.get('url')
                        data_count = service_data.get('data_count', 0)
                        self.print_test(
                            "Atlas服务启动", 
                            "PASS", 
                            f"服务地址: {service_url}, 数据量: {data_count}"
                        )
                    else:
                        self.print_test("Atlas服务启动", "FAIL", data.get('message', '启动失败'))
                        return False
                else:
                    response_text = await resp.text()
                    self.print_test("Atlas服务启动", "FAIL", f"状态码: {resp.status}, 响应: {response_text}")
                    return False
        except Exception as e:
            self.print_test("Atlas服务启动", "FAIL", f"请求失败: {str(e)}")
            return False
        
        # 等待服务完全启动
        await asyncio.sleep(5)
        
        # 验证服务运行状态
        try:
            async with self.session.get(f"{API_BASE_URL}/atlas/status") as resp:
                if resp.status == 200:
                    data = await resp.json()
                    if data.get('success'):
                        status_data = data.get('data', {})
                        services = status_data.get('services', [])
                        
                        # 查找我们启动的服务
                        test_service = None
                        for service in services:
                            if service.get('port') == ATLAS_TEST_PORT:
                                test_service = service
                                break
                        
                        if test_service:
                            self.print_test("Atlas服务运行验证", "PASS", f"服务正在端口 {ATLAS_TEST_PORT} 运行")
                        else:
                            self.print_test("Atlas服务运行验证", "FAIL", f"未找到端口 {ATLAS_TEST_PORT} 的服务")
                            return False
                    else:
                        self.print_test("Atlas服务运行验证", "FAIL", data.get('message', '获取状态失败'))
                        return False
        except Exception as e:
            self.print_test("Atlas服务运行验证", "FAIL", f"请求失败: {str(e)}")
            return False
        
        # 停止服务
        try:
            async with self.session.post(
                f"{API_BASE_URL}/atlas/stop", 
                params={"port": ATLAS_TEST_PORT}
            ) as resp:
                if resp.status == 200:
                    data = await resp.json()
                    if data.get('success'):
                        self.print_test("Atlas服务停止", "PASS", "服务已成功停止")
                    else:
                        self.print_test("Atlas服务停止", "FAIL", data.get('message', '停止失败'))
                        return False
                else:
                    self.print_test("Atlas服务停止", "FAIL", f"状态码: {resp.status}")
                    return False
        except Exception as e:
            self.print_test("Atlas服务停止", "FAIL", f"请求失败: {str(e)}")
            return False
        
        return True
    
    async def test_data_preparation(self):
        """测试数据准备功能"""
        # 这里可以测试数据转换和处理逻辑
        # 由于涉及数据库操作，这里只测试API是否响应
        try:
            # 尝试获取统计信息来验证数据处理能力
            async with self.session.get(f"{API_BASE_URL}/atlas/data-stats") as resp:
                if resp.status == 200:
                    data = await resp.json()
                    if data.get('success'):
                        stats = data.get('data', {})
                        vectorized_rate = stats.get('vectorization_rate', 0)
                        if vectorized_rate > 0:
                            self.print_test("数据准备功能", "PASS", f"向量化率: {vectorized_rate:.1f}%")
                        else:
                            self.print_test("数据准备功能", "WARN", "没有发现向量化数据，请确保数据库中有向量数据")
                    else:
                        self.print_test("数据准备功能", "FAIL", data.get('message', '获取统计失败'))
                        return False
                else:
                    self.print_test("数据准备功能", "FAIL", f"状态码: {resp.status}")
                    return False
        except Exception as e:
            self.print_test("数据准备功能", "FAIL", f"请求失败: {str(e)}")
            return False
        
        return True
    
    async def run_all_tests(self):
        """运行所有测试"""
        print("🧪 开始 Embedding Atlas 集成测试...\n")
        
        # 测试后端连接
        if not await self.test_backend_health():
            print("\n❌ 后端连接失败，请确保后端服务正在运行 (python main.py)")
            return False
        
        # 测试API端点
        if not await self.test_atlas_api_endpoints():
            print("\n❌ Atlas API端点测试失败")
            return False
        
        # 测试数据准备
        await self.test_data_preparation()
        
        # 测试服务生命周期
        if not await self.test_atlas_service_lifecycle():
            print("\n❌ Atlas服务生命周期测试失败")
            return False
        
        # 输出测试结果
        print(f"\n📊 测试结果:")
        print(f"   ✅ 通过: {self.tests_passed}")
        print(f"   ❌ 失败: {self.tests_failed}")
        print(f"   📈 成功率: {(self.tests_passed / (self.tests_passed + self.tests_failed) * 100):.1f}%")
        
        if self.tests_failed == 0:
            print("\n🎉 所有测试通过！Atlas集成功能正常")
            return True
        else:
            print(f"\n⚠️  有 {self.tests_failed} 个测试失败，请检查相关功能")
            return False

async def main():
    """主函数"""
    print("=== Embedding Atlas 集成测试工具 ===\n")
    
    # 检查项目环境
    project_root = Path.cwd()
    if not (project_root / "mat-backend").exists() or not (project_root / "mat-qa").exists():
        print("❌ 请在NextAgentLite项目根目录下运行此脚本")
        sys.exit(1)
    
    # 运行测试
    async with AtlasIntegrationTester() as tester:
        success = await tester.run_all_tests()
        
        if success:
            print("\n✅ Atlas集成测试完成，功能正常!")
            print("💡 可以通过前端界面 http://localhost:3000 使用Atlas可视化功能")
            sys.exit(0)
        else:
            print("\n❌ 集成测试发现问题，请检查配置和服务状态")
            print("💡 确保:")
            print("   1. 后端服务正在运行 (python mat-backend/main.py)")
            print("   2. 数据库中有向量化的文档数据")
            print("   3. Atlas依赖已正确安装 (embedding-atlas)")
            sys.exit(1)

if __name__ == "__main__":
    asyncio.run(main())