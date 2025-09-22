#!/usr/bin/env python3
"""
测试 LLM Config Gateway 客户端
验证与端口9050服务的连接和功能
"""
import asyncio
import sys
import os

# 添加项目根路径到sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from service.llm_config_gateway_client import (
    get_llm_config_gateway_client,
    get_default_chat_config,
    get_default_embedding_config,
    get_available_chat_models,
    get_available_embedding_models,
    gateway_health_check
)

async def test_gateway_connection():
    """测试网关连接"""
    print("🔍 测试 LLM Config Gateway 连接...")
    
    # 1. 健康检查
    print("\n1. 健康检查")
    is_healthy = await gateway_health_check()
    print(f"   网关状态: {'✅ 正常' if is_healthy else '❌ 异常'}")
    
    if not is_healthy:
        print("   ⚠️ 请确保 LLM Config Gateway 服务运行在端口 9050")
        return False
    
    # 2. 获取默认配置
    print("\n2. 获取默认模型配置")
    chat_config = await get_default_chat_config()
    embedding_config = await get_default_embedding_config()
    
    if chat_config:
        model, provider = chat_config
        print(f"   默认聊天模型: {model} (厂商: {provider})")
    else:
        print("   ❌ 未设置默认聊天模型")
    
    if embedding_config:
        model, provider = embedding_config
        print(f"   默认嵌入模型: {model} (厂商: {provider})")
    else:
        print("   ❌ 未设置默认嵌入模型")
    
    # 3. 获取可用模型列表
    print("\n3. 获取可用模型列表")
    
    chat_models = await get_available_chat_models()
    print(f"   聊天模型数量: {len(chat_models)}")
    for model in chat_models[:3]:  # 只显示前3个
        print(f"     - {model.display_name} ({model.provider_name})")
    if len(chat_models) > 3:
        print(f"     ... 还有 {len(chat_models) - 3} 个模型")
    
    embedding_models = await get_available_embedding_models()
    print(f"   嵌入模型数量: {len(embedding_models)}")
    for model in embedding_models[:3]:  # 只显示前3个
        print(f"     - {model.display_name} ({model.provider_name})")
    if len(embedding_models) > 3:
        print(f"     ... 还有 {len(embedding_models) - 3} 个模型")
    
    # 4. 获取厂商列表
    print("\n4. 获取厂商列表")
    client = await get_llm_config_gateway_client()
    providers = await client.list_providers()
    print(f"   厂商数量: {len(providers)}")
    for provider in providers:
        print(f"     - {provider.name} ({provider.type}) - {provider.status}")
    
    return True

async def test_model_configuration_fallback():
    """测试模型配置的降级策略"""
    print("\n🔄 测试配置降级策略...")
    
    # 模拟网关不可用的情况
    client = await get_llm_config_gateway_client()
    original_url = client.base_url
    client.base_url = "http://localhost:9999"  # 不存在的端口
    
    print("   模拟网关服务不可用...")
    is_healthy = await gateway_health_check()
    print(f"   健康检查结果: {'✅ 正常' if is_healthy else '❌ 异常 (预期)'}")
    
    # 恢复原始URL
    client.base_url = original_url
    print("   恢复网关连接...")
    
    return True

async def main():
    """主测试函数"""
    print("🚀 LLM Config Gateway 客户端测试")
    print("=" * 50)
    
    try:
        # 基础连接测试
        success = await test_gateway_connection()
        
        if success:
            # 降级策略测试
            await test_model_configuration_fallback()
            print("\n✅ 所有测试通过！")
        else:
            print("\n❌ 基础连接测试失败")
            return 1
            
    except Exception as e:
        print(f"\n❌ 测试过程中发生异常: {e}")
        import traceback
        traceback.print_exc()
        return 1
    
    return 0

if __name__ == "__main__":
    exit_code = asyncio.run(main())
    sys.exit(exit_code)