#!/usr/bin/env python3
"""
MCP集成功能测试脚本
"""
import asyncio
import json
import sys
from pathlib import Path

# 添加项目根目录到Python路径
sys.path.insert(0, str(Path(__file__).parent))

async def test_mcp_integration():
    """测试MCP集成功能"""
    print("🔍 开始测试MCP集成功能...")
    
    try:
        # 测试模型导入
        print("\n1. 测试数据模型导入...")
        from models.mcp_models import MCPServer, MCPTool, MCPResource
        print("✅ MCP数据模型导入成功")
        
        # 测试服务导入
        print("\n2. 测试服务模块导入...")
        from service.mcp_integration_service import mcp_integration_service
        print("✅ MCP集成服务导入成功")
        
        # 测试API端点导入
        print("\n3. 测试API端点导入...")
        from api.endpoints.mcp_integration_api import router
        print("✅ MCP API端点导入成功")
        
        # 测试数据库连接
        print("\n4. 测试数据库连接...")
        from db.database import get_async_session
        
        async with get_async_session() as session:
            # 尝试查询MCP服务器表
            from sqlalchemy import select, text
            
            # 检查表是否存在
            result = await session.execute(
                text("SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'mcp_servers')")
            )
            table_exists = result.scalar()
            
            if table_exists:
                print("✅ MCP数据库表存在")
                
                # 查询服务器数量
                result = await session.execute(select(MCPServer))
                servers = result.scalars().all()
                print(f"📊 当前MCP服务器数量: {len(servers)}")
            else:
                print("⚠️  MCP数据库表不存在，需要运行数据库迁移")
        
        print("\n🎉 MCP集成功能测试完成！")
        return True
        
    except ImportError as e:
        print(f"❌ 模块导入失败: {e}")
        return False
    except Exception as e:
        print(f"❌ 测试失败: {e}")
        return False

async def test_api_endpoints():
    """测试API端点"""
    print("\n🌐 测试API端点...")
    
    try:
        import httpx
        
        # 测试健康检查端点
        async with httpx.AsyncClient() as client:
            try:
                response = await client.get("http://localhost:8080/api/mcp/health", timeout=5.0)
                print(f"📡 MCP健康检查: {response.status_code}")
                
                if response.status_code == 200:
                    data = response.json()
                    print(f"   状态: {data.get('status', '未知')}")
                else:
                    print(f"   响应: {response.text}")
                    
            except httpx.ConnectError:
                print("⚠️  无法连接到后端服务 (http://localhost:8080)")
            except Exception as e:
                print(f"⚠️  API测试失败: {e}")
                
    except ImportError:
        print("⚠️  httpx未安装，跳过API端点测试")

def test_configuration():
    """测试配置文件"""
    print("\n⚙️  测试配置文件...")
    
    # 检查配置文件是否存在
    config_file = Path(__file__).parent / "config" / "mcp_config.yaml"
    
    if config_file.exists():
        print("✅ MCP配置文件存在")
        
        try:
            import yaml
            with open(config_file, 'r', encoding='utf-8') as f:
                config = yaml.safe_load(f)
            
            print(f"   Gateway地址: {config.get('mcp_gateway', {}).get('base_url', '未配置')}")
            print(f"   默认服务器数量: {len(config.get('default_servers', []))}")
            
        except ImportError:
            print("⚠️  PyYAML未安装，无法解析配置文件")
        except Exception as e:
            print(f"⚠️  配置文件解析失败: {e}")
    else:
        print("⚠️  MCP配置文件不存在")

def test_migration_script():
    """测试迁移脚本"""
    print("\n📄 测试数据库迁移脚本...")
    
    migration_file = Path(__file__).parent / "migrations" / "20250912_add_mcp_integration_tables.sql"
    
    if migration_file.exists():
        print("✅ MCP数据库迁移脚本存在")
        
        # 检查脚本内容
        with open(migration_file, 'r', encoding='utf-8') as f:
            content = f.read()
            
        tables = ['mcp_servers', 'mcp_tools', 'mcp_resources', 'mcp_prompts', 'mcp_tool_calls', 'mcp_gateway_config']
        
        for table in tables:
            if f"CREATE TABLE IF NOT EXISTS {table}" in content:
                print(f"   ✅ {table} 表定义存在")
            else:
                print(f"   ⚠️  {table} 表定义缺失")
    else:
        print("⚠️  MCP数据库迁移脚本不存在")

async def main():
    """主测试函数"""
    print("🚀 NextAgent Lite MCP集成测试")
    print("=" * 50)
    
    # 运行所有测试
    success = await test_mcp_integration()
    test_configuration()
    test_migration_script()
    await test_api_endpoints()
    
    print("\n" + "=" * 50)
    if success:
        print("✅ MCP集成基础测试通过")
        print("\n📋 下一步操作:")
        print("1. 运行数据库迁移: psql -d your_database -f migrations/20250912_add_mcp_integration_tables.sql")
        print("2. 启动MCP Context Forge Gateway")
        print("3. 启动后端服务: python main.py")
        print("4. 访问前端页面: http://localhost:3000/app/tools")
    else:
        print("❌ MCP集成测试失败，请检查错误信息")
    
    return success

if __name__ == "__main__":
    asyncio.run(main())
