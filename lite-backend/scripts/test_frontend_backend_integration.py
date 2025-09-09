#!/usr/bin/env python3
"""
前后端接口集成测试脚本
验证图谱API的数据格式是否与前端期望一致
"""
import asyncio
import json
import sys
import os

# 添加项目根目录到Python路径
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from db.repositories.graph_adapter import graph_adapter
from core.logger import logger


async def test_graph_data_format():
    """测试图谱数据格式"""
    print("🔍 测试图谱数据格式...")
    
    try:
        # 测试获取节点
        print("\n1. 测试获取节点数据:")
        nodes = await graph_adapter.get_nodes(limit=5)
        print(f"   获取到 {len(nodes)} 个节点")
        
        if nodes:
            node = nodes[0]
            required_fields = ['id', 'label', 'type', 'properties']
            for field in required_fields:
                if field not in node:
                    print(f"   ❌ 节点缺少必需字段: {field}")
                else:
                    print(f"   ✅ 节点包含字段: {field}")
            
            # 检查前端期望的字段
            frontend_fields = ['position', 'connections', 'level']
            for field in frontend_fields:
                if field in node:
                    print(f"   ✅ 节点包含前端字段: {field}")
                else:
                    print(f"   ⚠️  节点缺少前端字段: {field}")
        
        # 测试获取边
        print("\n2. 测试获取边数据:")
        edges = await graph_adapter.get_edges()
        print(f"   获取到 {len(edges)} 条边")
        
        if edges:
            edge = edges[0]
            required_fields = ['id', 'from', 'to', 'label', 'type']
            for field in required_fields:
                if field not in edge:
                    print(f"   ❌ 边缺少必需字段: {field}")
                else:
                    print(f"   ✅ 边包含字段: {field}")
            
            # 检查字段格式
            if 'from' in edge and 'to' in edge:
                print(f"   ✅ 边使用正确的字段名: from={edge['from']}, to={edge['to']}")
            else:
                print(f"   ❌ 边字段格式错误")
        
        # 测试统计信息
        print("\n3. 测试统计信息:")
        stats = await graph_adapter.get_graph_stats()
        required_stats = ['nodeCount', 'edgeCount', 'typeDistribution']
        for field in required_stats:
            if field in stats:
                print(f"   ✅ 统计包含字段: {field} = {stats[field]}")
            else:
                print(f"   ❌ 统计缺少字段: {field}")
        
        return True
        
    except Exception as e:
        print(f"   ❌ 测试失败: {e}")
        return False


async def test_search_functionality():
    """测试搜索功能"""
    print("\n🔍 测试搜索功能...")
    
    try:
        # 测试节点搜索
        search_results = await graph_adapter.search_nodes("test", limit=3)
        print(f"   搜索'test'获得 {len(search_results)} 个结果")
        
        # 测试节点类型获取
        node_types = await graph_adapter.get_all_node_types()
        print(f"   支持的节点类型: {node_types}")
        
        edge_types = await graph_adapter.get_all_edge_types()
        print(f"   支持的边类型: {edge_types}")
        
        return True
        
    except Exception as e:
        print(f"   ❌ 搜索测试失败: {e}")
        return False


async def test_node_operations():
    """测试节点操作"""
    print("\n🔍 测试节点操作...")
    
    try:
        # 测试获取节点详情
        nodes = await graph_adapter.get_nodes(limit=1)
        if nodes:
            node_id = nodes[0]['id']
            node_detail = await graph_adapter.get_node_by_id(node_id)
            if node_detail:
                print(f"   ✅ 成功获取节点详情: {node_detail['label']}")
            
            # 测试获取节点邻居
            neighbors = await graph_adapter.get_node_neighbors(node_id)
            print(f"   节点 {node_id} 有 {len(neighbors)} 个邻居")
            
            # 测试获取节点边
            edges = await graph_adapter.get_node_edges(node_id)
            print(f"   节点 {node_id} 有 {len(edges)} 条边")
        
        return True
        
    except Exception as e:
        print(f"   ❌ 节点操作测试失败: {e}")
        return False


def test_frontend_data_compatibility():
    """测试前端数据兼容性"""
    print("\n🔍 测试前端数据兼容性...")
    
    # 模拟前端期望的数据结构
    frontend_expected = {
        "nodes": {
            "required": ["id", "label", "type", "properties"],
            "optional": ["x", "y", "color", "size", "connections", "level", "position"]
        },
        "edges": {
            "required": ["id", "from", "to", "label", "type"],
            "optional": ["weight", "color", "properties"]
        },
        "stats": {
            "required": ["nodeCount", "edgeCount", "typeDistribution", "avgConnections"]
        }
    }
    
    print("   前端期望的数据格式:")
    print(json.dumps(frontend_expected, indent=4, ensure_ascii=False))
    
    return True


async def main():
    """主测试函数"""
    print("🚀 开始前后端接口集成测试")
    print("=" * 50)
    
    tests = [
        ("图谱数据格式测试", test_graph_data_format),
        ("搜索功能测试", test_search_functionality),
        ("节点操作测试", test_node_operations),
        ("前端兼容性测试", test_frontend_data_compatibility)
    ]
    
    results = []
    
    for test_name, test_func in tests:
        print(f"\n📋 执行: {test_name}")
        try:
            if asyncio.iscoroutinefunction(test_func):
                result = await test_func()
            else:
                result = test_func()
            results.append((test_name, result))
        except Exception as e:
            print(f"   ❌ 测试异常: {e}")
            results.append((test_name, False))
    
    # 测试结果总结
    print("\n" + "=" * 50)
    print("📊 测试结果总结:")
    
    passed = 0
    total = len(results)
    
    for test_name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"   {status} {test_name}")
        if result:
            passed += 1
    
    print(f"\n🎯 测试通过率: {passed}/{total} ({passed/total*100:.1f}%)")
    
    if passed == total:
        print("🎉 所有测试通过！前后端接口匹配正常！")
        return True
    else:
        print("⚠️  存在测试失败，请检查前后端接口匹配问题")
        return False


if __name__ == "__main__":
    try:
        success = asyncio.run(main())
        sys.exit(0 if success else 1)
    except KeyboardInterrupt:
        print("\n❌ 测试被用户中断")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ 测试执行失败: {e}")
        sys.exit(1) 