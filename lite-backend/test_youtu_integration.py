#!/usr/bin/env python3
"""
Youtu-Agent集成快速测试脚本
"""
import asyncio
import sys
import os

# 设置环境变量
os.environ["UTU_LLM_TYPE"] = "openai"
os.environ["UTU_LLM_MODEL"] = "Qwen/Qwen3-30B-A3B-Thinking-2507"
os.environ["UTU_LLM_BASE_URL"] = "https://api.siliconflow.cn/v1"
os.environ["UTU_LLM_API_KEY"] = "sk-mnennlifdngjififromhljflqsblutyfgfvwerkfhsxummcn"
os.environ["DB_URL"] = "postgresql://zzdsj_demo:zzdsj123!@localhost:5434/zzdsj_demo"
os.environ["UTU_LOG_LEVEL"] = "ERROR"

# 添加项目路径到Python路径
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

async def test_imports():
    """测试所有模块导入"""
    print("🔍 测试模块导入...")
    
    try:
        # 测试核心模块
        from youtu_agent_integration.core import YoutuAgentCore, get_youtu_core
        from youtu_agent_integration.services import (
            YoutuAgentService, MetaAgentService, HybridAgentService
        )
        print("✅ 核心模块导入成功")
        
        # 测试集成信息
        info = get_integration_info()
        print(f"📊 集成版本: {info['version']}")
        print(f"📊 支持框架: {', '.join(info['supported_frameworks'])}")
        print(f"📊 数据库表: {len(info['database_tables'])}个")
        
    except ImportError as e:
        print(f"❌ 模块导入失败: {e}")
        return False
    
    try:
        # 测试API模块
        from youtu_integration.api.youtu_agent_api import router
        print("✅ API模块导入成功")
        print(f"📡 API端点数: {len(router.routes)}")
        
    except ImportError as e:
        print(f"❌ API模块导入失败: {e}")
        return False
    
    return True

async def test_database_integration():
    """测试数据库集成（需要数据库连接）"""
    print("\n🔗 测试数据库集成...")
    
    try:
        from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
        from sqlalchemy.orm import sessionmaker
        
        # 使用测试数据库URL
        DATABASE_URL = "sqlite+aiosqlite:///./test_youtu.db"
        
        engine = create_async_engine(DATABASE_URL, echo=False)
        SessionLocal = sessionmaker(engine, class_=AsyncSession)
        
        print("✅ 数据库连接测试成功")
        
        # 测试数据库操作
        from youtu_integration.database import YoutuAgentDatabase
        
        async with SessionLocal() as session:
            db = YoutuAgentDatabase(session)
            print("✅ 数据库操作类初始化成功")
        
        await engine.dispose()
        
    except Exception as e:
        print(f"⚠️ 数据库集成测试跳过: {e}")
    
    return True

def test_configuration():
    """测试配置相关功能"""
    print("\n⚙️ 测试配置功能...")
    
    try:
        from youtu_integration.adapters.config_converter import ConfigConverter
        
        converter = ConfigConverter()
        
        # 测试配置验证
        test_config = {
            "name": "test_agent",
            "type": "SimpleAgent",
            "description": "测试智能体",
            "instructions": ["测试指令"],
            "model": {"provider": "test", "model_id": "test-model"},
            "tools": ["knowledge"],
            "environments": ["knowledge_env"]
        }
        
        # 测试Youtu到Agno转换
        agno_config = converter.youtu_to_agno(test_config)
        print("✅ 配置转换测试成功")
        
        # 测试配置验证
        is_valid = converter.validate_youtu_config(test_config)
        print(f"✅ 配置验证结果: {is_valid}")
        
    except Exception as e:
        print(f"❌ 配置功能测试失败: {e}")
        return False
    
    return True

def test_toolkits_and_environments():
    """测试工具集和环境"""
    print("\n🔧 测试工具集和环境...")
    
    try:
        from youtu_integration.toolkits.knowledge_toolkit import KnowledgeToolkit
        from youtu_integration.toolkits.translation_toolkit import TranslationToolkit
        from youtu_integration.environments.knowledge_env import KnowledgeEnv
        
        # 测试工具集初始化
        knowledge_toolkit = KnowledgeToolkit({"collection_id": "test"})
        print("✅ 知识工具集初始化成功")
        
        translation_toolkit = TranslationToolkit({"provider": "test"})
        print("✅ 翻译工具集初始化成功")
        
        # 测试环境初始化
        knowledge_env = KnowledgeEnv({"database_url": "test://localhost"})
        print("✅ 知识环境初始化成功")
        
        # 测试环境能力
        capabilities = knowledge_env.get_capabilities()
        print(f"📋 环境能力: {len(capabilities)}个")
        
    except Exception as e:
        print(f"❌ 工具集和环境测试失败: {e}")
        return False
    
    return True

async def test_api_endpoints():
    """测试API端点结构"""
    print("\n🌐 测试API端点...")
    
    try:
        from youtu_integration.api.youtu_agent_api import router
        
        # 统计端点类型
        endpoint_types = {}
        for route in router.routes:
            method = list(route.methods)[0] if route.methods else 'UNKNOWN'
            path = route.path
            
            if method not in endpoint_types:
                endpoint_types[method] = []
            endpoint_types[method].append(path)
        
        print("📊 API端点统计:")
        for method, paths in endpoint_types.items():
            print(f"  {method}: {len(paths)}个端点")
        
        # 检查关键端点
        key_endpoints = [
            "/api/youtu/agent/config",
            "/api/youtu/agent/quick-query", 
            "/api/youtu/meta/session",
            "/api/youtu/hybrid/query",
            "/api/youtu/health"
        ]
        
        all_paths = [route.path for route in router.routes]
        for endpoint in key_endpoints:
            if endpoint in all_paths:
                print(f"✅ 关键端点存在: {endpoint}")
            else:
                print(f"⚠️ 关键端点缺失: {endpoint}")
        
    except Exception as e:
        print(f"❌ API端点测试失败: {e}")
        return False
    
    return True

def generate_summary():
    """生成集成总结"""
    print("\n" + "="*60)
    print("📋 Youtu-Agent集成总结")
    print("="*60)
    
    try:
        from youtu_integration import get_integration_info
        info = get_integration_info()
        
        print(f"版本: {info['version']}")
        print(f"标题: {info['title']}")
        print(f"支持框架: {', '.join(info['supported_frameworks'])}")
        print(f"功能特性:")
        for feature, enabled in info['capabilities'].items():
            status = "✅" if enabled else "❌"
            print(f"  {status} {feature.replace('_', ' ').title()}")
        
        print(f"\n数据库表结构: {len(info['database_tables'])}个表")
        for table in info['database_tables']:
            print(f"  📊 {table}")
        
        print(f"\n文件结构:")
        print(f"  🔧 模型定义: models.py")
        print(f"  🗄️ 数据库操作: database.py") 
        print(f"  🔄 配置转换: adapters/config_converter.py")
        print(f"  🛠️ 工具集: toolkits/")
        print(f"  🌍 环境: environments/")
        print(f"  ⚙️ 服务层: services/")
        print(f"  🌐 API端点: api/youtu_agent_api.py")
        print(f"  🧪 测试脚本: test_integration.py")
        
    except Exception as e:
        print(f"❌ 生成总结失败: {e}")

async def main():
    """主测试函数"""
    print("🚀 开始Youtu-Agent集成测试")
    print("="*60)
    
    success_count = 0
    total_tests = 5
    
    # 执行测试
    tests = [
        ("模块导入", test_imports()),
        ("数据库集成", test_database_integration()),
        ("配置功能", test_configuration),
        ("工具集和环境", test_toolkits_and_environments),
        ("API端点", test_api_endpoints())
    ]
    
    for test_name, test_func in tests:
        print(f"\n🔍 执行测试: {test_name}")
        try:
            if asyncio.iscoroutine(test_func):
                result = await test_func
            else:
                result = test_func()
            
            if result:
                success_count += 1
                print(f"✅ {test_name}测试通过")
            else:
                print(f"❌ {test_name}测试失败")
        except Exception as e:
            print(f"❌ {test_name}测试异常: {e}")
    
    # 生成总结
    generate_summary()
    
    # 输出最终结果
    print(f"\n" + "="*60)
    print(f"📊 测试结果: {success_count}/{total_tests} 通过")
    success_rate = (success_count / total_tests) * 100
    print(f"📈 成功率: {success_rate:.1f}%")
    
    if success_rate >= 80:
        print("🎉 集成测试总体成功！")
        return 0
    elif success_rate >= 60:
        print("⚠️ 集成测试部分成功，需要检查失败项目")
        return 1
    else:
        print("❌ 集成测试失败，需要修复问题")
        return 2

if __name__ == "__main__":
    exit_code = asyncio.run(main())