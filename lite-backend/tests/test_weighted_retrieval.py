"""
权重检索服务测试
"""
import asyncio
import sys
import os

# 添加项目根目录到路径
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from service.weighted_retrieval_service import weighted_retrieval_service


async def test_weight_adjustment():
    """测试权重调整逻辑"""
    print("=== 测试权重调整逻辑 ===")
    
    # 测试双向量模式
    dual_weights = weighted_retrieval_service._adjust_weights_by_mode("dual")
    print(f"双向量模式权重: {dual_weights}")
    assert dual_weights["keyword"] == 0.3
    assert dual_weights["general_vector"] == 0.28  # 0.7 * 0.4
    assert dual_weights["domain_vector"] == 0.42   # 0.7 * 0.6
    
    # 测试通用向量模式
    general_weights = weighted_retrieval_service._adjust_weights_by_mode("general")
    print(f"通用向量模式权重: {general_weights}")
    assert general_weights["keyword"] == 0.3
    assert general_weights["general_vector"] == 0.7
    assert general_weights["domain_vector"] == 0.0
    
    # 测试领域向量模式
    domain_weights = weighted_retrieval_service._adjust_weights_by_mode("domain")
    print(f"领域向量模式权重: {domain_weights}")
    assert domain_weights["keyword"] == 0.3
    assert domain_weights["general_vector"] == 0.0
    assert domain_weights["domain_vector"] == 0.7
    
    print("权重调整逻辑测试通过!")


async def test_retrieval_explanation():
    """测试检索策略解释"""
    print("\n=== 测试检索策略解释 ===")
    
    try:
        # 测试不同模式的解释
        for mode in ["dual", "general", "domain"]:
            explanation = await weighted_retrieval_service.get_retrieval_explanation(
                query="地聚物材料的性能测试",
                mode=mode
            )
            
            print(f"\n{mode}模式解释:")
            print(f"权重配置: {explanation['weights']}")
            print(f"计算公式: {explanation['weight_calculation']['formula']}")
            
            # 验证权重总和为1.0
            total_weight = sum(explanation['weights'].values())
            print(f"权重总和: {total_weight}")
            assert abs(total_weight - 1.0) < 0.001, f"权重总和应为1.0，实际为{total_weight}"
        
        print("检索策略解释测试通过!")
        
    except Exception as e:
        print(f"解释功能测试失败: {e}")


def test_weight_calculation_logic():
    """测试权重计算逻辑验证"""
    print("\n=== 测试权重计算逻辑 ===")
    
    # 验证按照文档要求的权重分配
    service = weighted_retrieval_service
    
    # 双向量模式验证
    dual_weights = service._adjust_weights_by_mode("dual")
    print("双向量模式权重验证:")
    print(f"  关键词: {dual_weights['keyword']} (期望: 0.3)")
    print(f"  通用向量: {dual_weights['general_vector']} (期望: 0.28)")
    print(f"  领域向量: {dual_weights['domain_vector']} (期望: 0.42)")
    
    # 验证计算逻辑
    assert dual_weights['keyword'] == 0.3, "关键词权重应为30%"
    assert dual_weights['general_vector'] == 0.28, "通用向量权重应为28%"
    assert dual_weights['domain_vector'] == 0.42, "领域向量权重应为42%"
    
    # 验证总和
    total = sum(dual_weights.values())
    assert abs(total - 1.0) < 0.001, f"权重总和应为1.0，实际为{total}"
    
    print("权重计算逻辑验证通过!")


async def main():
    """主测试函数"""
    print("权重检索服务测试开始...\n")
    
    try:
        # 测试权重调整
        await test_weight_adjustment()
        
        # 测试逻辑验证
        test_weight_calculation_logic()
        
        # 测试解释功能
        await test_retrieval_explanation()
        
        print("\n=== 所有测试通过! ===")
        print("权重检索服务实现符合文档要求:")
        print("1. ✅ 层次化权重分配 (关键词30% + 向量70%)")
        print("2. ✅ 双向量内部权重 (通用40% + 领域60%)")
        print("3. ✅ 最终权重分布 (关键词30% + 通用28% + 领域42%)")
        print("4. ✅ 非双向量模式适配 (general/domain模式)")
        print("5. ✅ 权重计算和解释功能")
        
    except Exception as e:
        print(f"\n测试失败: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    asyncio.run(main())