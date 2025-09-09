#!/usr/bin/env python3
"""
Team功能测试脚本
用于验证Agno Team的查询、监控和管理功能
"""
import asyncio
import json
import time
import requests
from typing import Dict, Any
import sys
import os

# 添加项目根目录到Python路径
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from core.logger import logger

class TeamFunctionalityTester:
    """Team功能测试器"""
    
    def __init__(self, base_url: str = "http://localhost:8000"):
        self.base_url = base_url
        self.session = requests.Session()
        self.test_results = []
    
    def log_test(self, test_name: str, success: bool, message: str = "", data: Any = None):
        """记录测试结果"""
        result = {
            "test_name": test_name,
            "success": success,
            "message": message,
            "data": data,
            "timestamp": time.time()
        }
        self.test_results.append(result)
        
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}: {message}")
        
        if data and not success:
            print(f"   错误详情: {json.dumps(data, indent=2, ensure_ascii=False)}")
    
    def test_health_check(self) -> bool:
        """测试健康检查"""
        try:
            response = self.session.get(f"{self.base_url}/health")
            if response.status_code == 200:
                self.log_test("健康检查", True, "服务正常运行")
                return True
            else:
                self.log_test("健康检查", False, f"服务异常，状态码: {response.status_code}")
                return False
        except Exception as e:
            self.log_test("健康检查", False, f"连接失败: {str(e)}")
            return False
    
    def test_system_info(self) -> bool:
        """测试系统信息"""
        try:
            response = self.session.get(f"{self.base_url}/info")
            if response.status_code == 200:
                data = response.json()
                self.log_test("系统信息", True, "系统信息获取成功", data)
                return True
            else:
                self.log_test("系统信息", False, f"获取失败，状态码: {response.status_code}")
                return False
        except Exception as e:
            self.log_test("系统信息", False, f"请求失败: {str(e)}")
            return False
    
    def test_get_available_teams(self) -> bool:
        """测试获取可用团队列表"""
        try:
            response = self.session.get(f"{self.base_url}/api/team/teams")
            if response.status_code == 200:
                data = response.json()
                if data.get("success") and data.get("data"):
                    teams = data["data"]
                    self.log_test("获取团队列表", True, f"成功获取 {len(teams)} 个团队", teams)
                    return True
                else:
                    self.log_test("获取团队列表", False, "响应格式错误", data)
                    return False
            else:
                self.log_test("获取团队列表", False, f"请求失败，状态码: {response.status_code}")
                return False
        except Exception as e:
            self.log_test("获取团队列表", False, f"请求异常: {str(e)}")
            return False
    
    def test_team_query(self) -> bool:
        """测试Team查询"""
        try:
            query_data = {
                "team_name": "geopolymer_qa_team_v2",
                "query": "地聚物材料的强度特性是什么？",
                "session_id": f"test_session_{int(time.time())}",
                "stream": False,
                "enable_monitoring": True
            }
            
            response = self.session.post(
                f"{self.base_url}/api/team/query",
                json=query_data,
                timeout=60
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get("success") and data.get("data"):
                    result = data["data"]
                    self.log_test("Team查询", True, "查询执行成功", {
                        "execution_id": result.get("execution_id"),
                        "processing_time": result.get("processing_time"),
                        "content_length": len(result.get("content", ""))
                    })
                    return result.get("execution_id")
                else:
                    self.log_test("Team查询", False, "响应格式错误", data)
                    return False
            else:
                self.log_test("Team查询", False, f"查询失败，状态码: {response.status_code}")
                return False
        except Exception as e:
            self.log_test("Team查询", False, f"查询异常: {str(e)}")
            return False
    
    def test_get_execution_status(self, execution_id: str) -> bool:
        """测试获取执行状态"""
        try:
            response = self.session.get(f"{self.base_url}/api/team/status/{execution_id}")
            if response.status_code == 200:
                data = response.json()
                if data.get("success") and data.get("data"):
                    status_data = data["data"]
                    self.log_test("获取执行状态", True, "状态获取成功", status_data)
                    return True
                else:
                    self.log_test("获取执行状态", False, "响应格式错误", data)
                    return False
            else:
                self.log_test("获取执行状态", False, f"请求失败，状态码: {response.status_code}")
                return False
        except Exception as e:
            self.log_test("获取执行状态", False, f"请求异常: {str(e)}")
            return False
    
    def test_get_execution_metrics(self, execution_id: str) -> bool:
        """测试获取执行指标"""
        try:
            response = self.session.get(f"{self.base_url}/api/team/metrics/{execution_id}")
            if response.status_code == 200:
                data = response.json()
                if data.get("success") and data.get("data"):
                    metrics = data["data"]
                    self.log_test("获取执行指标", True, "指标获取成功", {
                        "metrics_count": len(metrics) if isinstance(metrics, list) else "N/A"
                    })
                    return True
                else:
                    self.log_test("获取执行指标", False, "响应格式错误", data)
                    return False
            else:
                self.log_test("获取执行指标", False, f"请求失败，状态码: {response.status_code}")
                return False
        except Exception as e:
            self.log_test("获取执行指标", False, f"请求异常: {str(e)}")
            return False
    
    def test_get_team_stats(self) -> bool:
        """测试获取Team统计"""
        try:
            response = self.session.get(f"{self.base_url}/api/team/stats")
            if response.status_code == 200:
                data = response.json()
                if data.get("success") and data.get("data"):
                    stats = data["data"]
                    self.log_test("获取Team统计", True, "统计获取成功", stats)
                    return True
                else:
                    self.log_test("获取Team统计", False, "响应格式错误", data)
                    return False
            else:
                self.log_test("获取Team统计", False, f"请求失败，状态码: {response.status_code}")
                return False
        except Exception as e:
            self.log_test("获取Team统计", False, f"请求异常: {str(e)}")
            return False
    
    def test_langdb_metrics(self, session_id: str) -> bool:
        """测试LangDB监控指标"""
        try:
            response = self.session.get(f"{self.base_url}/api/team/langdb/metrics/{session_id}")
            if response.status_code == 200:
                data = response.json()
                if data.get("success") and data.get("data"):
                    metrics = data["data"]
                    self.log_test("LangDB监控指标", True, "监控指标获取成功", {
                        "metrics_count": len(metrics.get("metrics", [])),
                        "history_count": len(metrics.get("execution_history", []))
                    })
                    return True
                else:
                    self.log_test("LangDB监控指标", False, "响应格式错误", data)
                    return False
            else:
                self.log_test("LangDB监控指标", False, f"请求失败，状态码: {response.status_code}")
                return False
        except Exception as e:
            self.log_test("LangDB监控指标", False, f"请求异常: {str(e)}")
            return False
    
    def test_team_functionality(self) -> bool:
        """测试Team功能"""
        try:
            response = self.session.post(f"{self.base_url}/api/team/test")
            if response.status_code == 200:
                data = response.json()
                if data.get("success") and data.get("data"):
                    test_result = data["data"]
                    self.log_test("Team功能测试", True, "功能测试成功", test_result)
                    return True
                else:
                    self.log_test("Team功能测试", False, "响应格式错误", data)
                    return False
            else:
                self.log_test("Team功能测试", False, f"测试失败，状态码: {response.status_code}")
                return False
        except Exception as e:
            self.log_test("Team功能测试", False, f"测试异常: {str(e)}")
            return False
    
    def run_all_tests(self) -> Dict[str, Any]:
        """运行所有测试"""
        print("🚀 开始Team功能测试")
        print("=" * 50)
        
        # 基础健康检查
        if not self.test_health_check():
            return {"success": False, "message": "服务不可用"}
        
        # 系统信息
        self.test_system_info()
        
        # 获取团队列表
        self.test_get_available_teams()
        
        # Team查询测试
        execution_id = self.test_team_query()
        if execution_id:
            # 获取执行状态
            self.test_get_execution_status(execution_id)
            
            # 获取执行指标
            self.test_get_execution_metrics(execution_id)
            
            # LangDB监控测试
            session_id = f"test_session_{int(time.time())}"
            self.test_langdb_metrics(session_id)
        
        # Team统计
        self.test_get_team_stats()
        
        # Team功能测试
        self.test_team_functionality()
        
        # 统计结果
        total_tests = len(self.test_results)
        passed_tests = sum(1 for result in self.test_results if result["success"])
        failed_tests = total_tests - passed_tests
        
        print("\n" + "=" * 50)
        print("📊 测试结果统计")
        print(f"总测试数: {total_tests}")
        print(f"通过: {passed_tests}")
        print(f"失败: {failed_tests}")
        print(f"成功率: {(passed_tests/total_tests)*100:.1f}%")
        
        if failed_tests > 0:
            print("\n❌ 失败的测试:")
            for result in self.test_results:
                if not result["success"]:
                    print(f"  - {result['test_name']}: {result['message']}")
        
        return {
            "success": failed_tests == 0,
            "total_tests": total_tests,
            "passed_tests": passed_tests,
            "failed_tests": failed_tests,
            "success_rate": (passed_tests/total_tests)*100,
            "results": self.test_results
        }

def main():
    """主函数"""
    import argparse
    
    parser = argparse.ArgumentParser(description="Team功能测试脚本")
    parser.add_argument("--url", default="http://localhost:8000", help="后端服务URL")
    parser.add_argument("--output", help="输出结果到文件")
    
    args = parser.parse_args()
    
    # 创建测试器
    tester = TeamFunctionalityTester(args.url)
    
    # 运行测试
    result = tester.run_all_tests()
    
    # 输出结果
    if args.output:
        with open(args.output, 'w', encoding='utf-8') as f:
            json.dump(result, f, indent=2, ensure_ascii=False)
        print(f"\n📄 测试结果已保存到: {args.output}")
    
    # 返回退出码
    sys.exit(0 if result["success"] else 1)

if __name__ == "__main__":
    main() 