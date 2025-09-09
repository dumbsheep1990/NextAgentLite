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

# 临时禁用代理，避免冲突
os.environ.pop('http_proxy', None)
os.environ.pop('https_proxy', None)
os.environ.pop('HTTP_PROXY', None) 
os.environ.pop('HTTPS_PROXY', None)
os.environ.pop('all_proxy', None)
os.environ.pop('ALL_PROXY', None)

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
    print("\n🐘 测试PostgreSQL连接")
    
    config = DB_CONFIG["postgresql"]
    print(f"📍 连接: {config['host']}:{config['port']}/{config['database']}")
    
    try:
        import asyncpg
        
        # 构建连接字符串
        if config["password"]:
            conn_string = f"postgresql://{config['username']}:{config['password']}@{config['host']}:{config['port']}/{config['database']}"
        else:
            conn_string = f"postgresql://{config['username']}@{config['host']}:{config['port']}/{config['database']}"
        
        # 建立连接
        conn = await asyncpg.connect(conn_string)
        
        # 测试基本查询
        version = await conn.fetchval('SELECT version()')
        
        # 测试扩展
        extensions = await conn.fetch("SELECT extname FROM pg_extension WHERE extname IN ('vector', 'pg_trgm')")
        extension_names = [ext['extname'] for ext in extensions]
        
        await conn.close()
        
        print(f"✅ PostgreSQL连接成功")
        print(f"   版本: {version.split(',')[0]}")
        print(f"   扩展: {', '.join(extension_names) if extension_names else '无特殊扩展'}")
        
        return {
            "status": "success",
            "version": version,
            "extensions": extension_names
        }
        
    except ImportError:
        error_msg = "asyncpg库未安装"
        print(f"❌ PostgreSQL连接失败: {error_msg}")
        return {"status": "failed", "error": error_msg}
    except Exception as e:
        error_msg = str(e)
        print(f"❌ PostgreSQL连接失败: {error_msg}")
        print(f"🔍 错误详情: {traceback.format_exc()}")
        return {"status": "failed", "error": error_msg}


async def test_elasticsearch_connection():
    """测试Elasticsearch连接"""
    print("\n🔍 测试Elasticsearch连接")
    
    config = DB_CONFIG["elasticsearch"]
    print(f"📍 连接: {config['url']}")
    
    try:
        # 禁用SSL验证以处理自签名证书
        async with httpx.AsyncClient(timeout=10.0, verify=False) as client:
            headers = {"Content-Type": "application/json"}
            
            # 设置认证
            if config.get("api_key"):
                headers["Authorization"] = f"ApiKey {config['api_key']}"
                print("🔐 使用API Key认证")
            elif config.get("username") and config.get("password"):
                auth_string = f"{config['username']}:{config['password']}"
                auth_bytes = auth_string.encode('ascii')
                auth_b64 = base64.b64encode(auth_bytes).decode('ascii')
                headers["Authorization"] = f"Basic {auth_b64}"
                print("🔐 使用用户名密码认证")
            else:
                print("⚠️ 无认证配置")
            
            # 测试集群健康状况
            health_response = await client.get(f"{config['url']}/_cluster/health", headers=headers)
            
            if health_response.status_code == 200:
                health_data = health_response.json()
                cluster_name = health_data.get("cluster_name", "Unknown")
                status = health_data.get("status", "Unknown")
                node_count = health_data.get("number_of_nodes", 0)
                
                # 获取版本信息
                version_response = await client.get(f"{config['url']}/", headers=headers)
                if version_response.status_code == 200:
                    version_data = version_response.json()
                    version_info = version_data.get("version", {})
                    version_number = version_info.get("number", "Unknown")
                    lucene_version = version_info.get("lucene_version", "Unknown")
                    
                    print(f"✅ Elasticsearch连接成功")
                    print(f"   集群: {cluster_name}")
                    print(f"   状态: {status}")
                    print(f"   节点: {node_count}")
                    print(f"   版本: {version_number}")
                    print(f"   Lucene: {lucene_version}")
                    
                    return {
                        "status": "success",
                        "cluster_name": cluster_name,
                        "cluster_status": status,
                        "nodes": node_count,
                        "version": version_number,
                        "lucene_version": lucene_version
                    }
                else:
                    print(f"✅ 集群健康检查成功，但版本信息获取失败")
                    return {
                        "status": "partial",
                        "cluster_name": cluster_name,
                        "cluster_status": status,
                        "nodes": node_count,
                        "error": "版本信息获取失败"
                    }
            else:
                error_msg = f"HTTP {health_response.status_code}"
                try:
                    error_detail = health_response.json()
                    error_msg += f": {error_detail.get('error', error_detail)}"
                except:
                    error_msg += f": {health_response.text}"
                
                print(f"❌ Elasticsearch连接失败: {error_msg}")
                return {"status": "failed", "error": error_msg}
                
    except httpx.ConnectTimeout:
        error_msg = "连接超时"
        print(f"❌ Elasticsearch连接失败: {error_msg}")
        return {"status": "failed", "error": error_msg}
    except httpx.ConnectError as e:
        error_msg = f"连接错误: {str(e)}"
        print(f"❌ Elasticsearch连接失败: {error_msg}")
        return {"status": "failed", "error": error_msg}
    except Exception as e:
        error_msg = str(e)
        print(f"❌ Elasticsearch连接失败: {error_msg}")
        print(f"🔍 错误详情: {traceback.format_exc()}")
        return {"status": "failed", "error": error_msg}


def print_test_summary(results):
    """打印测试总结"""
    print("\n" + "="*50)
    print("🎯 数据库连接测试总结")
    print("="*50)
    
    success_count = 0
    total_count = len(results)
    
    for db_name, result in results.items():
        status = result.get("status", "unknown")
        if status == "success":
            print(f"✅ {db_name.upper()}: 连接成功")
            success_count += 1
        elif status == "partial":
            print(f"⚠️ {db_name.upper()}: 部分成功 - {result.get('error', '未知错误')}")
            success_count += 0.5
        else:
            print(f"❌ {db_name.upper()}: 连接失败 - {result.get('error', '未知错误')}")
    
    print("-"*50)
    print(f"📊 成功率: {success_count}/{total_count} ({success_count/total_count*100:.1f}%)")
    
    if success_count == total_count:
        print("🎉 所有数据库连接正常!")
    elif success_count > 0:
        print("⚠️ 部分数据库连接存在问题，请检查配置")
    else:
        print("🚨 所有数据库连接都失败，请检查服务状态和配置")


async def main():
    """主函数"""
    print("🚀 开始数据库连接测试")
    print(f"📝 配置来源: 环境变量 (.env 文件)")
    
    results = {}
    
    try:
        # 测试PostgreSQL
        results["postgresql"] = await test_postgresql_connection()
        
        # 测试Elasticsearch
        results["elasticsearch"] = await test_elasticsearch_connection()
        
        # 打印测试总结
        print_test_summary(results)
        
    except Exception as e:
        print(f"❌ 测试过程中发生错误: {str(e)}")
        print(f"🔍 错误详情: {traceback.format_exc()}")


if __name__ == "__main__":
    asyncio.run(main())