#!/usr/bin/env python3
"""
数据库连接测试脚本
测试PostgreSQL和Elasticsearch的连接配置
"""
import asyncio
import httpx
import traceback
import json
import base64
import os
from dotenv import load_dotenv

# 加载环境变量
load_dotenv()

# 从环境变量读取数据库配置
DB_CONFIG = {
    "postgresql": {
        "host": os.getenv("POSTGRESQL_HOST", "localhost"),
        "port": int(os.getenv("POSTGRESQL_PORT", "5432")),
        "database": os.getenv("POSTGRESQL_DATABASE", "mat_demo"),
        "username": os.getenv("POSTGRESQL_USERNAME", "mat_demo"),
        "password": os.getenv("POSTGRESQL_PASSWORD", "")
    },
    "elasticsearch": {
        "url": os.getenv("ELASTICSEARCH_URL", "http://localhost:9200"),
        "username": os.getenv("ELASTICSEARCH_USERNAME", "elastic"),
        "password": os.getenv("ELASTICSEARCH_PASSWORD", ""),
        "api_key": os.getenv("ELASTICSEARCH_API_KEY", "")
    }
    # 移除 ArangoDB 配置
}


async def test_postgresql_connection():
    """测试PostgreSQL连接"""
    print("\n🗄️  测试PostgreSQL连接")
    
    config = DB_CONFIG["postgresql"]
    print(f"📍 连接: {config['username']}@{config['host']}:{config['port']}/{config['database']}")
    
    try:
        # 使用asyncpg测试连接
        import asyncpg
        
        connection = await asyncpg.connect(
            host=config["host"],
            port=config["port"],
            database=config["database"],
            user=config["username"],
            password=config["password"],
            timeout=10.0
        )
        
        # 测试查询
        version = await connection.fetchval("SELECT version()")
        await connection.close()
        
        print(f"✅ PostgreSQL连接成功")
        print(f"📊 数据库版本: {version.split(',')[0]}")
        
        return {"status": "success", "version": version.split(',')[0]}
        
    except ImportError:
        print("⚠️  asyncpg未安装，使用HTTP方式测试连接性")
        # 如果没有asyncpg，至少测试端口连通性
        try:
            import socket
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            sock.settimeout(5.0)
            result = sock.connect_ex((config["host"], config["port"]))
            sock.close()
            
            if result == 0:
                print(f"✅ PostgreSQL端口可达")
                return {"status": "reachable", "message": "端口可达，但未测试认证"}
            else:
                print(f"❌ PostgreSQL端口不可达")
                return {"status": "failed", "error": "端口不可达"}
        except Exception as e:
            print(f"❌ 连接测试失败: {e}")
            return {"status": "failed", "error": str(e)}
    except Exception as e:
        print(f"❌ PostgreSQL连接失败: {e}")
        return {"status": "failed", "error": str(e)}


async def test_elasticsearch_connection():
    """测试Elasticsearch连接"""
    print("\n🔍 测试Elasticsearch连接")
    
    config = DB_CONFIG["elasticsearch"]
    print(f"📍 连接: {config['url']}")
    
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            # 方法1: 使用用户名密码认证
            auth = (config["username"], config["password"])
            
            response = await client.get(
                f"{config['url']}/_cluster/health",
                auth=auth
            )
            
            if response.status_code == 200:
                result = response.json()
                print(f"✅ Elasticsearch连接成功 (用户名密码认证)")
                print(f"📊 集群状态: {result['status']}")
                print(f"🏷️  集群名称: {result['cluster_name']}")
                print(f"📈 节点数量: {result['number_of_nodes']}")
                
                return {
                    "status": "success", 
                    "cluster_status": result['status'],
                    "cluster_name": result['cluster_name'],
                    "nodes": result['number_of_nodes']
                }
            else:
                print(f"❌ 用户名密码认证失败: {response.status_code}")
                
                # 方法2: 尝试API Key认证
                headers = {"Authorization": f"ApiKey {config['api_key']}"}
                response = await client.get(
                    f"{config['url']}/_cluster/health",
                    headers=headers
                )
                
                if response.status_code == 200:
                    result = response.json()
                    print(f"✅ Elasticsearch连接成功 (API Key认证)")
                    print(f"📊 集群状态: {result['status']}")
                    print(f"🏷️  集群名称: {result['cluster_name']}")
                    print(f"📈 节点数量: {result['number_of_nodes']}")
                    
                    return {
                        "status": "success", 
                        "cluster_status": result['status'],
                        "cluster_name": result['cluster_name'],
                        "nodes": result['number_of_nodes']
                    }
                else:
                    print(f"❌ API Key认证也失败: {response.status_code}")
                    return {"status": "failed", "error": f"认证失败: {response.status_code}"}
        
    except Exception as e:
        print(f"❌ Elasticsearch连接失败: {e}")
        return {"status": "failed", "error": str(e)}


async def test_arangodb_connection():
    """测试ArangoDB连接"""
    print("\n📊 测试ArangoDB连接")
    
    config = DB_CONFIG["arangodb"]
    print(f"📍 连接: {config['url']}")
    
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            # 创建基础认证头
            auth_string = f"{config['username']}:{config['password']}"
            auth_bytes = auth_string.encode('ascii')
            auth_b64 = base64.b64encode(auth_bytes).decode('ascii')
            
            headers = {
                "Authorization": f"Basic {auth_b64}",
                "Content-Type": "application/json"
            }
            
            # 测试服务器信息
            response = await client.get(
                f"{config['url']}/_api/version",
                headers=headers
            )
            
            if response.status_code == 200:
                result = response.json()
                print(f"✅ ArangoDB连接成功")
                print(f"📊 服务器版本: {result['version']}")
                print(f"🏷️  服务器名称: {result.get('server', 'ArangoDB')}")
                
                # 测试数据库列表
                db_response = await client.get(
                    f"{config['url']}/_api/database/user",
                    headers=headers
                )
                
                if db_response.status_code == 200:
                    databases = db_response.json()['result']
                    print(f"📋 可访问的数据库: {', '.join(databases)}")
                    
                    if config['database'] in databases:
                        print(f"✅ 目标数据库 '{config['database']}' 存在")
                    else:
                        print(f"⚠️  目标数据库 '{config['database']}' 不存在")
                
                return {
                    "status": "success", 
                    "version": result['version'],
                    "server": result.get('server', 'ArangoDB')
                }
            else:
                print(f"❌ ArangoDB认证失败: {response.status_code}")
                print(f"📄 响应内容: {response.text}")
                return {"status": "failed", "error": f"认证失败: {response.status_code}"}
        
    except Exception as e:
        print(f"❌ ArangoDB连接失败: {e}")
        return {"status": "failed", "error": str(e)}


def print_test_summary(results):
    """打印测试总结"""
    print("\n" + "="*60)
    print("🔍 数据库连接测试总结")
    print("="*60)
    
    print(f"\n📋 测试结果:")
    
    # PostgreSQL结果
    pg_result = results["postgresql"]
    status_icon = "✅" if pg_result["status"] == "success" else ("⚠️" if pg_result["status"] == "reachable" else "❌")
    print(f"  {status_icon} PostgreSQL: {pg_result['status']}")
    if pg_result["status"] == "success":
        print(f"     版本: {pg_result['version']}")
    elif pg_result["status"] == "reachable":
        print(f"     信息: {pg_result['message']}")
    else:
        print(f"     错误: {pg_result['error']}")
    
    # Elasticsearch结果
    es_result = results["elasticsearch"]
    status_icon = "✅" if es_result["status"] == "success" else "❌"
    print(f"  {status_icon} Elasticsearch: {es_result['status']}")
    if es_result["status"] == "success":
        print(f"     集群状态: {es_result['cluster_status']}")
        print(f"     集群名称: {es_result['cluster_name']}")
        print(f"     节点数量: {es_result['nodes']}")
    else:
        print(f"     错误: {es_result['error']}")
    
    # ArangoDB结果
    arango_result = results["arangodb"]
    status_icon = "✅" if arango_result["status"] == "success" else "❌"
    print(f"  {status_icon} ArangoDB: {arango_result['status']}")
    if arango_result["status"] == "success":
        print(f"     版本: {arango_result['version']}")
        print(f"     服务器: {arango_result['server']}")
    else:
        print(f"     错误: {arango_result['error']}")
    
    # 计算成功率
    success_count = sum(1 for result in results.values() if result["status"] == "success")
    reachable_count = sum(1 for result in results.values() if result["status"] == "reachable")
    total_count = len(results)
    
    success_rate = (success_count / total_count) * 100
    
    print(f"\n📈 连接成功率: {success_count}/{total_count} ({success_rate:.1f}%)")
    if reachable_count > 0:
        print(f"📡 端口可达: {reachable_count}/{total_count}")
    
    if success_rate == 100:
        print("🎉 所有数据库连接成功！")
    elif success_rate >= 67:
        print("✅ 大部分数据库连接成功")
    elif success_rate >= 33:
        print("⚠️  部分数据库连接成功")
    else:
        print("❌ 大部分数据库连接失败")


async def main():
    """主测试函数"""
    print("🚀 开始数据库连接测试")
    print("📋 测试配置:")
    print(f"  🗄️  PostgreSQL: {DB_CONFIG['postgresql']['host']}:{DB_CONFIG['postgresql']['port']}")
    print(f"  🔍 Elasticsearch: {DB_CONFIG['elasticsearch']['url']}")
    print(f"  📊 ArangoDB: {DB_CONFIG['arangodb']['url']}")
    
    try:
        results = {}
        
        # 测试PostgreSQL
        results["postgresql"] = await test_postgresql_connection()
        
        # 测试Elasticsearch
        results["elasticsearch"] = await test_elasticsearch_connection()
        
        # ArangoDB 测试已移除
        
        # 打印测试总结
        print_test_summary(results)
        
    except Exception as e:
        print(f"❌ 测试过程中发生错误: {str(e)}")
        print(f"🔍 错误详情: {traceback.format_exc()}")


if __name__ == "__main__":
    asyncio.run(main()) 