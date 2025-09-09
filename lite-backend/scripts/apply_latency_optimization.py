#!/usr/bin/env python3
"""
首token延迟优化快速应用脚本
"""
import sys
import asyncio
import time
from pathlib import Path

# 添加项目根目录到路径
sys.path.append(str(Path(__file__).parent.parent))

from core.logger import logger
from service.latency_optimization_service import latency_optimization_service


async def apply_optimization():
    """应用延迟优化配置"""
    print("🚀 开始应用首token延迟优化...")
    
    try:
        # 1. 初始化延迟优化服务
        print("⚡ 步骤 1/4: 初始化延迟优化服务")
        success = await latency_optimization_service.initialize()
        if success:
            print("   ✅ 延迟优化服务初始化成功")
        else:
            print("   ⚠️ 延迟优化服务初始化部分失败")
        
        # 2. 检查优化状态
        print("📊 步骤 2/4: 检查当前优化状态")
        config = latency_optimization_service.config
        
        warmup_enabled = config.get('model_calling', {}).get('enable_warmup', False)
        monitoring_enabled = latency_optimization_service.monitoring_enabled
        
        print(f"   模型预热: {'✅ 启用' if warmup_enabled else '❌ 禁用'}")
        print(f"   延迟监控: {'✅ 启用' if monitoring_enabled else '❌ 禁用'}")
        
        warmed_models = list(latency_optimization_service.model_warmer.warmed_models)
        if warmed_models:
            print(f"   预热模型: {', '.join(warmed_models)}")
        else:
            print("   预热模型: 无")
        
        # 3. 获取优化建议
        print("💡 步骤 3/4: 生成优化建议")
        recommendations = latency_optimization_service.get_optimization_recommendations()
        
        if "message" in recommendations:
            print(f"   ℹ️ {recommendations['message']}")
        else:
            avg_metrics = recommendations.get('average_metrics', {})
            rec_list = recommendations.get('recommendations', [])
            
            print("   📈 当前平均延迟指标:")
            for metric, value in avg_metrics.items():
                print(f"     • {metric}: {value}")
            
            if rec_list:
                print("   🎯 优化建议:")
                for i, rec in enumerate(rec_list, 1):
                    priority_emoji = "🔴" if rec['priority'] == 'high' else "🟡" if rec['priority'] == 'medium' else "🟢"
                    print(f"     {i}. {priority_emoji} {rec['issue']}")
                    print(f"        💡 {rec['suggestion']}")
            else:
                print("   ✅ 当前性能良好，无需特殊优化")
        
        # 4. 测试延迟优化效果
        print("🧪 步骤 4/4: 测试延迟优化效果")
        
        # 模拟一次查询来测试延迟
        try:
            from service.agent_service import agent_service
            
            test_query = "测试查询"
            start_time = time.time()
            
            # 测试单智能体查询
            response = await agent_service.single_agent_query(
                "qa_agent", 
                test_query,
                stream=False
            )
            
            end_time = time.time()
            test_latency = end_time - start_time
            
            if response:
                print(f"   ✅ 测试查询成功，延迟: {test_latency:.3f}s")
                
                # 检查延迟是否在合理范围
                if test_latency < 2.0:
                    print("   🎉 延迟性能良好")
                elif test_latency < 5.0:
                    print("   ⚠️ 延迟性能一般，建议进一步优化")
                else:
                    print("   ❌ 延迟性能较差，需要深度优化")
            else:
                print("   ❌ 测试查询失败")
                
        except Exception as e:
            print(f"   ⚠️ 测试查询异常: {e}")
        
        print("\n🎊 延迟优化应用完成!")
        print("\n📋 使用说明:")
        print("1. 重启后端服务以确保所有优化生效")
        print("2. 使用 GET /api/v1/latency/status 检查优化状态")
        print("3. 使用 GET /api/v1/latency/recommendations 获取实时建议")
        print("4. 在前端发送问题时观察控制台的 [LATENCY] 日志")
        
        return True
        
    except Exception as e:
        print(f"❌ 优化应用失败: {e}")
        import traceback
        traceback.print_exc()
        return False
    
    finally:
        # 清理资源
        try:
            await latency_optimization_service.cleanup()
        except Exception as e:
            print(f"⚠️ 清理资源失败: {e}")


def main():
    """主函数"""
    print("=" * 60)
    print("🔧 首token延迟优化工具")
    print("=" * 60)
    
    # 运行优化
    success = asyncio.run(apply_optimization())
    
    print("=" * 60)
    
    if success:
        print("✅ 优化应用成功")
        sys.exit(0)
    else:
        print("❌ 优化应用失败")
        sys.exit(1)


if __name__ == "__main__":
    main()