#!/usr/bin/env python3
"""
智能检索服务测试脚本
"""
import asyncio
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from service.intelligent_retrieval_service import intelligent_retrieval_service
from service.vectorization_config_service import vectorization_config_service

async def test_query_analysis():
    """测试查询分析功能"""
    
    test_queries = [
        "地聚物材料的力学性能研究",
        "今天天气怎么样",
        "混凝土强度测试方法",
        "机器学习算法优化"
    ]
    
    try:
        print("测试查询分析功能...")
        
        for query in test_queries:
            analysis = await intelligent_retrieval_service._analyze_query(query)
            
            print(f"\n查询: {query}")
            print(f"  领域相关性: {analysis['domain_relevance']:.3f}")
            print(f"  建议模式: {analysis['suggested_mode']}")
            print(f"  置信度: {analysis['confidence']:.3f}")
            print(f"  匹配关键词: {analysis['matched_keywords']}")
        
        print("\n查询分析测试通过")
        return True
        
    except Exception as e:
        print(f"查询分析测试失败: {e}")
        return False

async def test_vectorization_config():
    """测试向量化配置服务"""
    
    test_files = [
        ("research_paper.pdf", 2 * 1024 * 1024, "地聚物材料性能研究。本文分析了粉煤灰基地聚物的强度特性..."),
        ("report.docx", 1024 * 1024, "项目进展报告。本月完成了基础框架开发..."),
        ("note.txt", 1024, "今天的会议记录"),
        ("technical_spec.pdf", 5 * 1024 * 1024, "技术规范文档。涉及材料配比、混凝土强度等专业内容...")
    ]
    
    try:
        print("\n测试向量化配置决策...")
        
        for filename, file_size, content in test_files:
            decision = vectorization_config_service.decide_vectorization_strategy(
                filename=filename,
                file_size=file_size,
                file_content=content
            )
            
            print(f"\n文件: {filename}")
            print(f"  策略: {decision.strategy.value}")
            print(f"  置信度: {decision.confidence:.3f}")
            print(f"  原因: {decision.reason}")
        
        print("\n向量化配置测试通过")
        return True
        
    except Exception as e:
        print(f"向量化配置测试失败: {e}")
        return False

async def test_strategy_explanation():
    """测试策略解释功能"""
    
    test_queries = [
        "地聚物混凝土的强度特性",
        "今天天气很好",
        "粉煤灰在建筑材料中的应用"
    ]
    
    try:
        print("\n测试策略解释功能...")
        
        for query in test_queries:
            explanation = await intelligent_retrieval_service.explain_search_strategy(query)
            
            print(f"\n查询: {query}")
            print(f"  选择策略: {explanation['selected_strategy']}")
            print(f"  选择原因: {explanation['reason']}")
            print(f"  可选策略: {[alt['strategy'] for alt in explanation['alternatives']]}")
        
        print("\n策略解释测试通过")
        return True
        
    except Exception as e:
        print(f"策略解释测试失败: {e}")
        return False

async def test_search_suggestions():
    """测试搜索建议功能"""
    
    partial_queries = [
        "地聚物",
        "混凝土",
        "材料",
        "强度"
    ]
    
    try:
        print("\n测试搜索建议功能...")
        
        for partial in partial_queries:
            suggestions = await intelligent_retrieval_service.get_search_suggestions(partial)
            
            print(f"\n输入: {partial}")
            print(f"  建议: {suggestions[:3]}")  # 只显示前3个建议
        
        print("\n搜索建议测试通过")
        return True
        
    except Exception as e:
        print(f"搜索建议测试失败: {e}")
        return False

async def test_config_summary():
    """测试配置摘要"""
    
    try:
        print("\n测试配置摘要...")
        
        summary = vectorization_config_service.get_config_summary()
        
        print(f"系统模式: {summary['system_mode']}")
        print(f"支持的策略: {summary['supported_strategies']}")
        print(f"支持的模式: {summary['supported_modes']}")
        print(f"默认模型: {summary['default_models']}")
        
        print("\n配置摘要测试通过")
        return True
        
    except Exception as e:
        print(f"配置摘要测试失败: {e}")
        return False

if __name__ == "__main__":
    async def main():
        print("开始智能检索服务测试")
        print("=" * 50)
        
        tests = [
            test_query_analysis(),
            test_vectorization_config(),
            test_strategy_explanation(),
            test_search_suggestions(),
            test_config_summary()
        ]
        
        results = await asyncio.gather(*tests, return_exceptions=True)
        
        success_count = sum(1 for result in results if result is True)
        total_count = len(results)
        
        print("=" * 50)
        print(f"测试完成: {success_count}/{total_count} 通过")
        
        if success_count == total_count:
            print("所有测试通过！")
        else:
            print("部分测试失败！")
            for i, result in enumerate(results):
                if isinstance(result, Exception):
                    print(f"测试 {i+1} 异常: {result}")
            sys.exit(1)
    
    asyncio.run(main())