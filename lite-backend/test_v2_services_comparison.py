#!/usr/bin/env python3
"""
V2服务对比测试
比较新旧智能体和嵌入服务的实现一致性
"""
import asyncio
import sys
import os
import time
from typing import List, Dict, Any, Optional

# 添加项目根路径到sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# 导入原有服务
try:
    from service.agent_service import agent_service as agent_service_v1
    _has_agent_v1 = True
except ImportError as e:
    print(f"⚠️ 无法导入原有智能体服务: {e}")
    _has_agent_v1 = False

try:
    from service.embedding_service import embedding_service as embedding_service_v1
    _has_embedding_v1 = True
except ImportError as e:
    print(f"⚠️ 无法导入原有嵌入服务: {e}")
    _has_embedding_v1 = False

# 导入新V2服务
try:
    from service.agent_service_v2 import get_agent_service_v2, create_agent_v2
    from service.embedding_service_v2 import get_embedding_service_v2, create_embeddings_v2
    _has_v2_services = True
except ImportError as e:
    print(f"❌ 无法导入V2服务: {e}")
    _has_v2_services = False

# 导入网关客户端用于健康检查
try:
    from service.llm_config_gateway_client import gateway_health_check
    _has_gateway_client = True
except ImportError as e:
    print(f"⚠️ 无法导入网关客户端: {e}")
    _has_gateway_client = False

async def test_gateway_connectivity():
    """测试网关连接性"""
    print("🔍 测试网关连接性...")
    
    if not _has_gateway_client:
        print("   ❌ 网关客户端不可用")
        return False
    
    try:
        is_healthy = await gateway_health_check()
        if is_healthy:
            print("   ✅ 网关服务正常")
            return True
        else:
            print("   ❌ 网关服务不可用")
            return False
    except Exception as e:
        print(f"   ❌ 网关连接测试失败: {e}")
        return False

async def test_agent_service_comparison():
    """测试智能体服务对比"""
    print("\n🤖 智能体服务对比测试...")
    
    if not _has_agent_v1:
        print("   ⚠️ 跳过智能体服务对比（V1不可用）")
        return
    
    if not _has_v2_services:
        print("   ❌ 跳过智能体服务对比（V2不可用）")
        return
    
    test_agent_name = "qa_team"
    
    # 测试V1智能体创建
    print(f"   测试V1智能体创建: {test_agent_name}")
    try:
        start_time = time.time()
        agent_v1 = agent_service_v1.create_agent(test_agent_name, search_knowledge=False)
        v1_time = time.time() - start_time
        
        if agent_v1:
            print(f"     ✅ V1创建成功 ({v1_time:.2f}s)")
            v1_model = getattr(agent_v1, 'model', None)
            v1_model_info = f"模型: {getattr(v1_model, 'model', 'unknown')}" if v1_model else "无模型信息"
            print(f"     📋 V1 {v1_model_info}")
        else:
            print("     ❌ V1创建失败")
            v1_time = None
    except Exception as e:
        print(f"     ❌ V1创建异常: {e}")
        agent_v1 = None
        v1_time = None
    
    # 测试V2智能体创建
    print(f"   测试V2智能体创建: {test_agent_name}")
    try:
        start_time = time.time()
        agent_v2 = await create_agent_v2(test_agent_name, search_knowledge=False)
        v2_time = time.time() - start_time
        
        if agent_v2:
            print(f"     ✅ V2创建成功 ({v2_time:.2f}s)")
            v2_model = getattr(agent_v2, 'model', None)
            v2_model_info = f"模型: {getattr(v2_model, 'model', 'unknown')}" if v2_model else "无模型信息"
            print(f"     📋 V2 {v2_model_info}")
        else:
            print("     ❌ V2创建失败")
            v2_time = None
    except Exception as e:
        print(f"     ❌ V2创建异常: {e}")
        agent_v2 = None
        v2_time = None
    
    # 对比结果
    if agent_v1 and agent_v2:
        print("   📊 对比结果:")
        print(f"     性能: V1({v1_time:.2f}s) vs V2({v2_time:.2f}s)")
        
        # 对比基本属性
        v1_name = getattr(agent_v1, 'name', 'unknown')
        v2_name = getattr(agent_v2, 'name', 'unknown')
        print(f"     名称: V1({v1_name}) vs V2({v2_name})")
        
        v1_role = getattr(agent_v1, 'role', 'unknown')
        v2_role = getattr(agent_v2, 'role', 'unknown')
        print(f"     角色: V1({v1_role}) vs V2({v2_role})")
        
        # 检查工具数量
        v1_tools = getattr(agent_v1, 'tools', [])
        v2_tools = getattr(agent_v2, 'tools', [])
        print(f"     工具: V1({len(v1_tools) if v1_tools else 0}个) vs V2({len(v2_tools) if v2_tools else 0}个)")
        
        if v1_name == v2_name and v1_role == v2_role:
            print("     ✅ 基本属性一致")
        else:
            print("     ⚠️ 基本属性存在差异")
    
    elif agent_v1 and not agent_v2:
        print("   ⚠️ 仅V1创建成功，V2可能存在问题")
    elif not agent_v1 and agent_v2:
        print("   ⚠️ 仅V2创建成功，V1可能存在问题")
    else:
        print("   ❌ 两个版本都创建失败")

async def test_embedding_service_comparison():
    """测试嵌入服务对比"""
    print("\n🔢 嵌入服务对比测试...")
    
    if not _has_embedding_v1:
        print("   ⚠️ 跳过嵌入服务对比（V1不可用）")
        return
    
    if not _has_v2_services:
        print("   ❌ 跳过嵌入服务对比（V2不可用）")
        return
    
    test_texts = ["这是一个测试文本", "用于验证嵌入服务的功能"]
    test_model = "text-embedding-v4"  # 常用的嵌入模型
    
    # 测试V1嵌入创建
    print(f"   测试V1嵌入创建: {test_model}")
    try:
        start_time = time.time()
        result_v1 = await embedding_service_v1.create_embeddings(f"alibaba/{test_model}", test_texts)
        v1_time = time.time() - start_time
        
        if result_v1:
            print(f"     ✅ V1创建成功 ({v1_time:.2f}s)")
            print(f"     📋 V1 模型: {result_v1.model}, 维度: {result_v1.dimension}, 向量数: {len(result_v1.embeddings)}")
        else:
            print("     ❌ V1创建失败")
            v1_time = None
    except Exception as e:
        print(f"     ❌ V1创建异常: {e}")
        result_v1 = None
        v1_time = None
    
    # 测试V2嵌入创建
    print(f"   测试V2嵌入创建: {test_model}")
    try:
        start_time = time.time()
        result_v2 = await create_embeddings_v2(f"alibaba/{test_model}", test_texts)
        v2_time = time.time() - start_time
        
        if result_v2:
            print(f"     ✅ V2创建成功 ({v2_time:.2f}s)")
            print(f"     📋 V2 模型: {result_v2.model}, 维度: {result_v2.dimension}, 向量数: {len(result_v2.embeddings)}")
            print(f"     📋 V2 来源: {'网关' if result_v2.gateway_source else '降级'}")
        else:
            print("     ❌ V2创建失败")
            v2_time = None
    except Exception as e:
        print(f"     ❌ V2创建异常: {e}")
        result_v2 = None
        v2_time = None
    
    # 对比结果
    if result_v1 and result_v2:
        print("   📊 对比结果:")
        print(f"     性能: V1({v1_time:.2f}s) vs V2({v2_time:.2f}s)")
        print(f"     模型: V1({result_v1.model}) vs V2({result_v2.model})")
        print(f"     维度: V1({result_v1.dimension}) vs V2({result_v2.dimension})")
        print(f"     厂商: V1({result_v1.provider}) vs V2({result_v2.provider})")
        
        # 检查向量一致性（如果使用相同模型）
        if result_v1.model == result_v2.model and result_v1.dimension == result_v2.dimension:
            # 计算向量相似度（简单检查）
            if len(result_v1.embeddings) == len(result_v2.embeddings):
                print("     ✅ 向量数量一致")
                # 这里可以添加更详细的向量相似性检查
            else:
                print("     ⚠️ 向量数量不一致")
        
        if (result_v1.model == result_v2.model and 
            result_v1.dimension == result_v2.dimension and
            result_v1.provider == result_v2.provider):
            print("     ✅ 嵌入结果基本一致")
        else:
            print("     ⚠️ 嵌入结果存在差异")
    
    elif result_v1 and not result_v2:
        print("   ⚠️ 仅V1创建成功，V2可能存在问题")
    elif not result_v1 and result_v2:
        print("   ⚠️ 仅V2创建成功，V1可能存在问题")
    else:
        print("   ❌ 两个版本都创建失败")

async def test_model_configuration_sources():
    """测试模型配置来源"""
    print("\n⚙️ 模型配置来源测试...")
    
    if not _has_v2_services:
        print("   ❌ V2服务不可用，跳过测试")
        return
    
    # 测试智能体模型配置
    print("   测试智能体模型配置来源:")
    try:
        agent_service_v2 = await get_agent_service_v2()
        
        # 测试从网关获取配置
        gateway_config = await agent_service_v2.get_model_config_from_gateway("test_agent")
        if gateway_config:
            model, provider = gateway_config
            print(f"     ✅ 网关配置: {model} (厂商: {provider})")
        else:
            print("     ⚠️ 网关配置不可用")
        
        # 测试降级配置
        fallback_config = agent_service_v2.get_fallback_model_config("test_agent")
        model, provider = fallback_config
        print(f"     ✅ 降级配置: {model} (厂商: {provider})")
        
    except Exception as e:
        print(f"     ❌ 智能体配置测试失败: {e}")
    
    # 测试嵌入模型配置
    print("   测试嵌入模型配置来源:")
    try:
        embedding_service_v2 = await get_embedding_service_v2()
        
        # 测试从网关获取配置
        gateway_config = await embedding_service_v2.get_embedding_config_from_gateway()
        if gateway_config:
            model, provider, model_info = gateway_config
            print(f"     ✅ 网关配置: {model} (厂商: {provider})")
        else:
            print("     ⚠️ 网关配置不可用")
        
        # 测试降级配置
        fallback_config = embedding_service_v2.get_fallback_embedding_config()
        model, provider = fallback_config
        print(f"     ✅ 降级配置: {model} (厂商: {provider})")
        
    except Exception as e:
        print(f"     ❌ 嵌入配置测试失败: {e}")

async def main():
    """主测试函数"""
    print("🚀 V2服务对比测试")
    print("=" * 60)
    
    try:
        # 检查基础依赖
        if not _has_v2_services:
            print("❌ V2服务不可用，无法进行对比测试")
            return 1
        
        # 1. 网关连接性测试
        gateway_available = await test_gateway_connectivity()
        
        # 2. 模型配置来源测试
        await test_model_configuration_sources()
        
        # 3. 智能体服务对比测试
        await test_agent_service_comparison()
        
        # 4. 嵌入服务对比测试
        await test_embedding_service_comparison()
        
        # 总结
        print("\n📋 测试总结:")
        print(f"   网关状态: {'✅ 可用' if gateway_available else '❌ 不可用'}")
        print(f"   V1智能体服务: {'✅ 可用' if _has_agent_v1 else '❌ 不可用'}")
        print(f"   V1嵌入服务: {'✅ 可用' if _has_embedding_v1 else '❌ 不可用'}")
        print(f"   V2服务: {'✅ 可用' if _has_v2_services else '❌ 不可用'}")
        
        if gateway_available:
            print("\n✅ 推荐使用V2服务（网关优先，降级支持）")
        else:
            print("\n⚠️ 网关不可用，V2服务将使用降级策略")
        
        print("\n🎉 对比测试完成！")
        return 0
        
    except Exception as e:
        print(f"\n❌ 测试过程中发生异常: {e}")
        import traceback
        traceback.print_exc()
        return 1

if __name__ == "__main__":
    exit_code = asyncio.run(main())
    sys.exit(exit_code)