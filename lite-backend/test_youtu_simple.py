#!/usr/bin/env python3
"""
简单的Youtu Agent集成测试
"""
import os
import sys
import asyncio

# 设置环境变量
os.environ["UTU_LLM_TYPE"] = "openai"
os.environ["UTU_LLM_MODEL"] = "Qwen/Qwen3-30B-A3B-Thinking-2507"
os.environ["UTU_LLM_BASE_URL"] = "https://api.siliconflow.cn/v1"
os.environ["UTU_LLM_API_KEY"] = "sk-mnennlifdngjififromhljflqsblutyfgfvwerkfhsxummcn"
os.environ["DB_URL"] = "postgresql://zzdsj_demo:zzdsj123!@localhost:5434/zzdsj_demo"
os.environ["UTU_LOG_LEVEL"] = "ERROR"

# 添加当前目录到路径
sys.path.insert(0, '.')

async def main():
    print("=" * 60)
    print("Youtu Agent集成测试")
    print("=" * 60)
    
    # 1. 测试导入
    print("\n1. 测试模块导入...")
    try:
        from youtu_agent_integration.core import get_youtu_core
        from youtu_agent_integration.services import YoutuAgentService
        from youtu_agent_integration.api import youtu_agent_router
        print("   ✅ 所有模块导入成功")
    except Exception as e:
        print(f"   ❌ 导入失败: {e}")
        return False
    
    # 2. 测试核心初始化
    print("\n2. 测试核心初始化...")
    try:
        async with get_youtu_core() as core:
            print("   ✅ 核心初始化成功")
    except Exception as e:
        print(f"   ❌ 初始化失败: {e}")
        return False
    
    # 3. 测试API端点
    print("\n3. 测试API端点...")
    print(f"   路由前缀: {youtu_agent_router.prefix}")
    print(f"   端点数量: {len(youtu_agent_router.routes)}")
    
    print("\n   可用端点:")
    for route in youtu_agent_router.routes:
        if hasattr(route, 'path'):
            print(f"      {youtu_agent_router.prefix}{route.path}")
    
    print("\n" + "=" * 60)
    print("🎉 测试完成！Youtu Agent集成正常工作")
    print("=" * 60)
    return True

if __name__ == "__main__":
    success = asyncio.run(main())
    sys.exit(0 if success else 1)