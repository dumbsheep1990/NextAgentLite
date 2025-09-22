"""
测试QA路由四层架构与Agno框架集成
"""
import asyncio
import json
import sys
from pathlib import Path
from typing import Dict, List, Any
import httpx
from datetime import datetime

# 添加项目根目录到Python路径
sys.path.insert(0, str(Path(__file__).parent.parent))

from core.config_optimized import optimized_config_manager
from service.agno_multilayer_tools import multilayer_retrieval_tools
from service.multilayer_retrieval_service import multilayer_retrieval_service
from service.qa_routing_service import qa_routing_service
from models.qa_routing import QARouteQuery

# 测试配置  
TEST_KNOWLEDGE_BASE_ID = "test-kb-001"
API_BASE_URL = "http://localhost:8000/api/v1"


class QARoutingAgnoTester:
    """QA路由与Agno集成测试器"""
    
    def __init__(self):
        self.client = httpx.AsyncClient(timeout=30.0)
        self.test_results = []
        
    async def setup_test_data(self):
        """设置测试数据"""
        print("\n=== 设置测试数据 ===")
        
        # 1. 创建测试用的固定问答对
        fixed_qas = [
            {
                "knowledge_base_id": TEST_KNOWLEDGE_BASE_ID,
                "category": "材料基础",
                "question": "什么是地聚物",
                "answer": "地聚物是一种通过碱激发铝硅酸盐原材料制得的新型无机胶凝材料。",
                "keywords": ["地聚物", "geopolymer", "定义"],
                "priority": 100
            },
            {
                "knowledge_base_id": TEST_KNOWLEDGE_BASE_ID,
                "category": "应用场景",
                "question": "地聚物的主要应用",
                "answer": "地聚物主要应用于建筑材料、固废处理、重金属固化等领域。",
                "keywords": ["应用", "用途", "场景"],
                "priority": 95
            }
        ]
        
        for qa in fixed_qas:
            response = await self.client.post(
                f"{API_BASE_URL}/qa-routing/fixed-qa",
                json=qa
            )
            if response.status_code == 200:
                print(f"✅ 创建固定问答对: {qa['question'][:20]}...")
            else:
                print(f"❌ 创建失败: {response.text}")
                
        # 2. 创建测试路由规则
        rules = [
            {
                "knowledge_base_id": TEST_KNOWLEDGE_BASE_ID,
                "rule_name": "材料性能查询",
                "rule_type": "qa_dataset_priority",
                "pattern": "强度|性能|耐久性|抗压",
                "description": "材料性能相关问题优先从QA数据集检索",
                "priority": 80,
                "metadata": {
                    "target_qa_datasets": ["material_properties"],
                    "fallback": "knowledge_base"
                }
            },
            {
                "knowledge_base_id": TEST_KNOWLEDGE_BASE_ID,
                "rule_name": "研究论文查询",
                "rule_type": "knowledge_base_priority",
                "pattern": "论文|研究|文献|发表",
                "description": "学术研究相关问题优先从知识库检索",
                "priority": 75,
                "metadata": {
                    "target_collections": ["research_papers"],
                    "enable_graph": True
                }
            }
        ]
        
        for rule in rules:
            response = await self.client.post(
                f"{API_BASE_URL}/qa-routing/rules",
                json=rule
            )
            if response.status_code == 200:
                print(f"✅ 创建路由规则: {rule['rule_name']}")
            else:
                print(f"❌ 创建失败: {response.text}")
    
    async def test_routing_layers(self):
        """测试四层路由架构"""
        print("\n=== 测试四层路由架构 ===")
        
        test_queries = [
            # 第一层：固定问答对
            {
                "query": "什么是地聚物",
                "expected_layer": "fixed_qa",
                "description": "测试固定问答对匹配"
            },
            # 第二层：QA数据集
            {
                "query": "地聚物的抗压强度是多少",
                "expected_layer": "rule_based",
                "expected_target": "qa_dataset",
                "description": "测试QA数据集路由"
            },
            # 第三层：知识库
            {
                "query": "关于地聚物的最新研究论文",
                "expected_layer": "rule_based",
                "expected_target": "knowledge_base",
                "description": "测试知识库路由"
            },
            # 第四层：Agent路由（默认）
            {
                "query": "如何制备高性能地聚物混凝土",
                "expected_layer": "default",
                "description": "测试默认Agent路由"
            }
        ]
        
        for test_case in test_queries:
            print(f"\n测试: {test_case['description']}")
            print(f"查询: {test_case['query']}")
            
            # 调用路由测试接口
            response = await self.client.post(
                f"{API_BASE_URL}/qa-routing/rules/test",
                json={
                    "knowledge_base_id": TEST_KNOWLEDGE_BASE_ID,
                    "query": test_case["query"]
                }
            )
            
            if response.status_code == 200:
                result = response.json()
                print(f"路由层: {result.get('routing_layer')}")
                print(f"路由决策: {json.dumps(result.get('routing_decision'), indent=2, ensure_ascii=False)}")
                
                # 验证结果
                if result.get('routing_layer') == test_case['expected_layer']:
                    print(f"✅ 路由层匹配正确")
                    
                    # 检查具体目标
                    if 'expected_target' in test_case:
                        decision = result.get('routing_decision', {})
                        if test_case['expected_target'] in str(decision):
                            print(f"✅ 目标匹配正确: {test_case['expected_target']}")
                        else:
                            print(f"⚠️ 目标不匹配: 期望 {test_case['expected_target']}")
                else:
                    print(f"❌ 路由层不匹配: 期望 {test_case['expected_layer']}, 实际 {result.get('routing_layer')}")
                    
                self.test_results.append({
                    "test": test_case['description'],
                    "success": result.get('routing_layer') == test_case['expected_layer'],
                    "details": result
                })
            else:
                print(f"❌ API调用失败: {response.text}")
                self.test_results.append({
                    "test": test_case['description'],
                    "success": False,
                    "error": response.text
                })
    
    async def test_agno_integration(self):
        """测试Agno框架集成"""
        print("\n=== 测试Agno框架集成 ===")
        
        # 初始化服务
        await multilayer_retrieval_service.initialize()
        
        test_query = "地聚物的基本定义和主要应用是什么"
        print(f"测试查询: {test_query}")
        
        try:
            # 使用Agno工具执行路由和检索
            result = await multilayer_retrieval_tools.route_and_retrieve(
                query=test_query,
                knowledge_base_id=TEST_KNOWLEDGE_BASE_ID,
                session_id="test-session-001"
            )
            
            print("\n检索结果:")
            print(f"答案: {result.get('answer', '无')[:200]}...")
            print(f"路由信息: {result.get('routing_info')}")
            print(f"检索信息: {result.get('retrieval_info')}")
            
            if result.get('sources'):
                print(f"来源数量: {len(result['sources'])}")
                for i, source in enumerate(result['sources'][:3], 1):
                    print(f"  来源{i}: {source.get('title', source.get('id', 'unknown'))}")
                    
            self.test_results.append({
                "test": "Agno框架集成",
                "success": bool(result.get('answer')),
                "details": {
                    "has_answer": bool(result.get('answer')),
                    "routing_layer": result.get('routing_info', {}).get('layer'),
                    "layers_executed": result.get('retrieval_info', {}).get('layers_executed', [])
                }
            })
            
        except Exception as e:
            print(f"❌ Agno集成测试失败: {e}")
            self.test_results.append({
                "test": "Agno框架集成",
                "success": False,
                "error": str(e)
            })
    
    async def test_cascade_retrieval(self):
        """测试级联检索"""
        print("\n=== 测试级联检索 ===")
        
        try:
            # 测试跳过某些层的级联检索
            result = await multilayer_retrieval_tools.execute_cascade_retrieval(
                query="地聚物混凝土的制备工艺",
                knowledge_base_id=TEST_KNOWLEDGE_BASE_ID,
                skip_layers=["fixed_qa"]  # 跳过固定问答对层
            )
            
            print(f"级联检索结果:")
            print(f"执行的层: {result.get('layers_executed', [])}")
            print(f"最终答案: {result.get('final_answer', '无')[:200]}...")
            print(f"检索到的条目数: {len(result.get('retrieved_items', []))}")
            
            self.test_results.append({
                "test": "级联检索（跳过固定问答对）",
                "success": len(result.get('layers_executed', [])) > 0,
                "details": {
                    "layers": result.get('layers_executed', []),
                    "items_count": len(result.get('retrieved_items', []))
                }
            })
            
        except Exception as e:
            print(f"❌ 级联检索测试失败: {e}")
            self.test_results.append({
                "test": "级联检索",
                "success": False,
                "error": str(e)
            })
    
    async def test_performance(self):
        """性能测试"""
        print("\n=== 性能测试 ===")
        
        queries = [
            "什么是地聚物",
            "地聚物的强度特性",
            "地聚物研究进展",
            "如何制备地聚物"
        ]
        
        total_time = 0
        success_count = 0
        
        for query in queries:
            start_time = datetime.now()
            
            response = await self.client.post(
                f"{API_BASE_URL}/qa-routing/rules/test",
                json={
                    "knowledge_base_id": TEST_KNOWLEDGE_BASE_ID,
                    "query": query
                }
            )
            
            elapsed = (datetime.now() - start_time).total_seconds()
            total_time += elapsed
            
            if response.status_code == 200:
                success_count += 1
                print(f"✅ {query[:20]}... - {elapsed:.2f}秒")
            else:
                print(f"❌ {query[:20]}... - 失败")
        
        avg_time = total_time / len(queries)
        success_rate = success_count / len(queries) * 100
        
        print(f"\n性能统计:")
        print(f"平均响应时间: {avg_time:.2f}秒")
        print(f"成功率: {success_rate:.1f}%")
        
        self.test_results.append({
            "test": "性能测试",
            "success": success_rate > 80 and avg_time < 2.0,
            "details": {
                "avg_response_time": avg_time,
                "success_rate": success_rate,
                "total_queries": len(queries)
            }
        })
    
    def print_summary(self):
        """打印测试总结"""
        print("\n" + "="*50)
        print("测试总结")
        print("="*50)
        
        total_tests = len(self.test_results)
        passed_tests = sum(1 for r in self.test_results if r['success'])
        
        print(f"总测试数: {total_tests}")
        print(f"通过数: {passed_tests}")
        print(f"失败数: {total_tests - passed_tests}")
        print(f"通过率: {passed_tests/total_tests*100:.1f}%")
        
        print("\n详细结果:")
        for result in self.test_results:
            status = "✅" if result['success'] else "❌"
            print(f"{status} {result['test']}")
            if not result['success'] and 'error' in result:
                print(f"   错误: {result.get('error', 'Unknown')}")
    
    async def cleanup(self):
        """清理测试数据"""
        print("\n=== 清理测试数据 ===")
        
        # 获取并删除测试创建的固定问答对
        response = await self.client.get(
            f"{API_BASE_URL}/api/qa-routing/fixed-qa",
            params={"knowledge_base_id": TEST_KNOWLEDGE_BASE_ID}
        )
        
        if response.status_code == 200:
            items = response.json().get('items', [])
            for item in items:
                await self.client.delete(
                    f"{API_BASE_URL}/api/qa-routing/fixed-qa/{item['id']}"
                )
            print(f"✅ 清理了 {len(items)} 个固定问答对")
        
        # 关闭连接
        await self.client.aclose()
        await multilayer_retrieval_service.close()
    
    async def run_all_tests(self):
        """运行所有测试"""
        print("="*50)
        print("QA路由四层架构与Agno集成测试")
        print("="*50)
        
        try:
            await self.setup_test_data()
            await self.test_routing_layers()
            await self.test_agno_integration()
            await self.test_cascade_retrieval()
            await self.test_performance()
            
            self.print_summary()
            
        finally:
            await self.cleanup()


async def main():
    """主函数"""
    tester = QARoutingAgnoTester()
    await tester.run_all_tests()


if __name__ == "__main__":
    # 运行测试
    asyncio.run(main())