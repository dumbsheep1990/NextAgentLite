"""
在Unla的API工具系统中创建敏感词校验工具
直接写入unla_mcp_configs表，然后同步到llm-config-gateway
"""
import asyncio
import asyncpg
import httpx
import json
import os
from datetime import datetime


# 数据库连接信息
DB_CONFIG = {
    "host": os.getenv("POSTGRESQL_HOST", "localhost"),
    "port": int(os.getenv("POSTGRESQL_PORT", "5434")),
    "database": os.getenv("POSTGRESQL_DATABASE", "zzdsj_demo"),
    "user": os.getenv("POSTGRESQL_USERNAME", "zzdsj_demo"),
    "password": os.getenv("POSTGRESQL_PASSWORD", "zzdsj123!")
}

# llm-config-gateway地址
GATEWAY_URL = "http://localhost:9050"


async def create_unla_api_tool_config():
    """在Unla数据库中创建API工具配置"""
    print("\n" + "="*80)
    print("步骤 1: 在Unla数据库中创建API工具配置")
    print("="*80)

    conn = await asyncpg.connect(**DB_CONFIG)

    try:
        # 配置名称
        config_name = "sensitive_word_validation"

        # 检查是否已存在
        existing = await conn.fetchval(
            "SELECT id FROM unla_mcp_configs WHERE name = $1 AND deleted_at IS NULL",
            config_name
        )

        if existing:
            print(f"⚠️  配置已存在，ID: {existing}，将删除并重新创建")
            await conn.execute(
                "UPDATE unla_mcp_configs SET deleted_at = NOW() WHERE id = $1",
                existing
            )

        # 服务器配置
        servers = [{
            "name": "mat-backend",
            "description": "NextAgentLite后端服务",
            "allowedTools": ["sensitive_word_check"]
        }]

        # 工具配置
        tools = [{
            "name": "sensitive_word_check",
            "description": "检测文本中是否包含敏感词，支持多种敏感词类别",
            "method": "POST",
            "endpoint": "http://localhost:8000/api/v1/validation-tools/sensitive-word-check",
            "args": [
                {
                    "name": "text",
                    "position": "body",
                    "required": True,
                    "type": "string",
                    "description": "要检测的文本内容"
                },
                {
                    "name": "categories",
                    "position": "body",
                    "required": False,
                    "type": "array",
                    "description": "要检测的敏感词类别（可选）",
                    "items": {"type": "string"}
                },
                {
                    "name": "return_details",
                    "position": "body",
                    "required": False,
                    "type": "boolean",
                    "description": "是否返回详细匹配信息",
                    "default": True
                }
            ],
            "requestBody": '{"text":"{{.Args.text}}","categories":{{.Args.categories}},"return_details":{{.Args.return_details}}}',
            "responseBody": "{{.Response.Body}}"
        }]

        # 路由配置（可选，用于外部访问）
        routers = [{
            "server": "mat-backend",
            "prefix": "/api/validation",
            "ssePrefix": ""
        }]

        # 插入配置
        config_id = await conn.fetchval("""
            INSERT INTO unla_mcp_configs (
                name, tenant, servers, tools, routers, created_at, updated_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING id
        """,
            config_name,
            "",  # 默认租户
            json.dumps(servers),
            json.dumps(tools),
            json.dumps(routers),
            datetime.now(),
            datetime.now()
        )

        print(f"\n✅ API工具配置创建成功!")
        print(f"   ID: {config_id}")
        print(f"   名称: {config_name}")
        print(f"   服务器数: {len(servers)}")
        print(f"   工具数: {len(tools)}")
        print(f"   路由数: {len(routers)}")

        return config_id, config_name

    finally:
        await conn.close()


async def sync_to_gateway():
    """同步配置到llm-config-gateway"""
    print("\n" + "="*80)
    print("步骤 2: 同步配置到llm-config-gateway")
    print("="*80)

    async with httpx.AsyncClient(timeout=30) as client:
        response = await client.post(
            f"{GATEWAY_URL}/admin/sync-api-from-unla-db",
            json={"prefix": "unla_"}
        )

        if response.status_code == 200:
            result = response.json()
            print(f"\n✅ 同步成功!")
            print(f"响应: {json.dumps(result, ensure_ascii=False, indent=2)}")
        else:
            print(f"\n❌ 同步失败!")
            print(f"状态码: {response.status_code}")
            print(f"响应: {response.text}")
            return False

    return True


async def verify_config():
    """验证配置是否生效"""
    print("\n" + "="*80)
    print("步骤 3: 验证配置是否生效")
    print("="*80)

    async with httpx.AsyncClient(timeout=30) as client:
        # 获取所有配置列表
        response = await client.get(f"{GATEWAY_URL}/api-tools/configs")

        if response.status_code == 200:
            configs = response.json()
            print(f"\n✅ 获取配置列表成功，共 {len(configs)} 个配置:")

            # 查找敏感词校验工具配置
            found = False
            for config in configs:
                if config["name"] == "sensitive_word_validation":
                    found = True
                    print(f"\n✅ 找到敏感词校验工具配置:")
                    print(f"   名称: {config['name']}")
                    print(f"   工具数: {config['tools']}")
                    print(f"   服务器数: {len(config.get('servers', []))}")
                    print(f"   路由数: {len(config.get('routers', []))}")

                    # 获取工具列表
                    tools_response = await client.get(
                        f"{GATEWAY_URL}/api-tools/configs/sensitive_word_validation/tools"
                    )

                    if tools_response.status_code == 200:
                        tools = tools_response.json()
                        print(f"\n   工具列表:")
                        for tool in tools:
                            print(f"   - {tool['name']}: {tool['description']}")
                            print(f"     方法: {tool['method']}")
                            print(f"     端点: {tool['endpoint']}")

            if not found:
                print(f"\n❌ 未找到敏感词校验工具配置")
                return False

        else:
            print(f"\n❌ 获取配置列表失败!")
            print(f"状态码: {response.status_code}")
            return False

    return True


async def test_tool_call():
    """测试工具调用"""
    print("\n" + "="*80)
    print("步骤 4: 测试工具调用")
    print("="*80)

    async with httpx.AsyncClient(timeout=30) as client:
        # 测试调用敏感词检测工具
        test_data = {
            "args": {
                "text": "这是一条包含暴力和色情的测试消息",
                "return_details": True
            }
        }

        print(f"\n测试数据: {json.dumps(test_data, ensure_ascii=False, indent=2)}")

        response = await client.post(
            f"{GATEWAY_URL}/api-tools/configs/sensitive_word_validation/tools/sensitive_word_check/call",
            json=test_data
        )

        print(f"\n响应状态码: {response.status_code}")

        if response.status_code == 200:
            result = response.json()
            print(f"响应结果: {json.dumps(result, ensure_ascii=False, indent=2)}")

            # 验证结果
            if isinstance(result, dict):
                if result.get("success") and not result.get("is_valid"):
                    print(f"\n✅ 工具调用成功! 检测到 {result.get('matched_count', 0)} 个敏感词")
                elif result.get("success") and result.get("is_valid"):
                    print(f"\n✅ 工具调用成功! 文本校验通过")
                else:
                    print(f"\n✅ 工具调用成功，返回结果: {result}")
            else:
                print(f"\n✅ 工具调用成功，返回: {result}")
        else:
            print(f"❌ 工具调用失败!")
            print(f"响应: {response.text}")
            return False

    return True


async def generate_usage_guide():
    """生成使用指南"""
    print("\n" + "="*80)
    print("步骤 5: 生成使用指南")
    print("="*80)

    usage_guide = {
        "配置信息": {
            "配置名称": "sensitive_word_validation",
            "工具名称": "sensitive_word_check",
            "网关地址": GATEWAY_URL,
            "后端地址": "http://localhost:8000"
        },
        "在自定义QA中使用": {
            "工具引用格式": "api:sensitive_word_validation:sensitive_word_check",
            "工具参数示例": {
                "text": "{query}",
                "return_details": True
            },
            "QA元数据配置": {
                "enable_tool_call": True,
                "tool_names": ["api:sensitive_word_validation:sensitive_word_check"],
                "tool_params": {
                    "api:sensitive_word_validation:sensitive_word_check": {
                        "text": "{query}",
                        "return_details": True
                    }
                }
            }
        },
        "直接调用示例": {
            "curl命令": f"""curl -X POST {GATEWAY_URL}/api-tools/configs/sensitive_word_validation/tools/sensitive_word_check/call \\
  -H "Content-Type: application/json" \\
  -d '{{"args": {{"text": "测试文本", "return_details": true}}}}'"""
        },
        "Unla Web界面": {
            "访问地址": "http://localhost:5234/tools/api",
            "操作说明": [
                "1. 打开Unla Web的模型&工具页面",
                "2. 切换到API工具Tab",
                "3. 找到'sensitive_word_validation'配置",
                "4. 点击'查看工具'查看和测试工具"
            ]
        }
    }

    print(json.dumps(usage_guide, ensure_ascii=False, indent=2))

    # 保存到文件
    with open("sensitive_word_unla_tool_usage_guide.json", "w", encoding="utf-8") as f:
        json.dump(usage_guide, f, ensure_ascii=False, indent=2)

    print(f"\n✅ 使用指南已保存到: sensitive_word_unla_tool_usage_guide.json")


async def main():
    """主流程"""
    print("\n" + "="*80)
    print("  在Unla系统中创建敏感词校验API工具")
    print("="*80)

    try:
        # 步骤 1: 创建配置
        config_id, config_name = await create_unla_api_tool_config()

        # 步骤 2: 同步到网关
        if not await sync_to_gateway():
            return

        # 步骤 3: 验证配置
        if not await verify_config():
            return

        # 步骤 4: 测试工具调用
        await test_tool_call()

        # 步骤 5: 生成使用指南
        await generate_usage_guide()

        print("\n" + "="*80)
        print("  ✅ 所有步骤完成!")
        print("="*80)
        print("\n📋 后续操作:")
        print("   1. 访问 http://localhost:5234/tools/api 查看工具")
        print("   2. 在自定义QA中使用工具引用:")
        print("      api:sensitive_word_validation:sensitive_word_check")
        print("   3. 配置工具参数模板: {\"text\": \"{query}\"}")

    except Exception as e:
        print(f"\n❌ 执行失败: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    asyncio.run(main())
