"""
测试敏感词校验API工具的完整流程
1. 测试敏感词检测endpoint
2. 将其注册为API工具
3. 通过工具注册表调用
4. 在自定义QA中绑定并测试
"""
import asyncio
import asyncpg
import httpx
import json
import os
import uuid
from datetime import datetime


# 数据库连接信息
DB_CONFIG = {
    "host": os.getenv("POSTGRESQL_HOST", "localhost"),
    "port": int(os.getenv("POSTGRESQL_PORT", "5434")),
    "database": os.getenv("POSTGRESQL_DATABASE", "zzdsj_demo"),
    "user": os.getenv("POSTGRESQL_USERNAME", "zzdsj_demo"),
    "password": os.getenv("POSTGRESQL_PASSWORD", "zzdsj123!")
}

# 后端API基础URL
API_BASE_URL = "http://localhost:8000"


async def test_sensitive_word_endpoint():
    """测试敏感词检测endpoint"""
    print("\n" + "="*60)
    print("步骤 1: 测试敏感词检测endpoint")
    print("="*60)

    async with httpx.AsyncClient(timeout=30) as client:
        # 测试用例 1: 包含敏感词的文本
        test_data_1 = {
            "text": "这是一条包含暴力和色情的测试消息",
            "return_details": True
        }

        print(f"\n测试用例 1: 包含敏感词")
        print(f"请求数据: {test_data_1}")

        response = await client.post(
            f"{API_BASE_URL}/api/v1/validation-tools/sensitive-word-check",
            json=test_data_1
        )

        print(f"响应状态码: {response.status_code}")
        result = response.json()
        print(f"响应结果: {json.dumps(result, ensure_ascii=False, indent=2)}")

        # 测试用例 2: 不包含敏感词的文本
        test_data_2 = {
            "text": "这是一条正常的测试消息",
            "return_details": True
        }

        print(f"\n测试用例 2: 不包含敏感词")
        print(f"请求数据: {test_data_2}")

        response = await client.post(
            f"{API_BASE_URL}/api/v1/validation-tools/sensitive-word-check",
            json=test_data_2
        )

        print(f"响应状态码: {response.status_code}")
        result = response.json()
        print(f"响应结果: {json.dumps(result, ensure_ascii=False, indent=2)}")

    print("\n✅ 敏感词检测endpoint测试完成")
    return True


async def register_api_tool():
    """将敏感词检测注册为API工具"""
    print("\n" + "="*60)
    print("步骤 2: 将敏感词检测注册为API工具")
    print("="*60)

    conn = await asyncpg.connect(**DB_CONFIG)

    try:
        # 检查工具是否已存在
        existing = await conn.fetchval(
            "SELECT id FROM custom_crawler_tools WHERE name = $1",
            "敏感词校验工具"
        )

        if existing:
            print(f"⚠️  工具已存在，ID: {existing}，将删除并重新创建")
            await conn.execute(
                "DELETE FROM custom_crawler_tools WHERE id = $1",
                existing
            )

        # API配置
        api_config = {
            "api_url": f"{API_BASE_URL}/api/v1/validation-tools/sensitive-word-check",
            "method": "POST",
            "params_template": {
                "text": "{query}",  # 使用query作为待检测的文本
                "return_details": True
            },
            "response_path": {
                "success_field": "success",
                "data_field": ".",  # 整个响应体就是数据
                "mapping": {
                    "title": "message",
                    "content": "message",
                    "is_valid": "is_valid",
                    "matched_count": "matched_count"
                }
            }
        }

        # 插入工具配置
        row = await conn.fetchrow("""
            INSERT INTO custom_crawler_tools (
                name, description, base_url, url_template, method,
                headers, params_mapping, selector_config, parse_config,
                use_api, api_config, enabled
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
            RETURNING id, name
        """,
            "敏感词校验工具",
            "检测文本中是否包含敏感词，支持多种敏感词类别",
            API_BASE_URL,
            "/api/v1/validation-tools/sensitive-word-check",
            "POST",
            json.dumps({"Content-Type": "application/json"}),
            json.dumps({"query": {"param_name": "text", "default_value": ""}}),
            json.dumps({}),  # selector_config不需要
            json.dumps({}),  # parse_config不需要
            True,  # use_api
            json.dumps(api_config),
            True  # enabled
        )

        print(f"\n✅ 工具注册成功!")
        print(f"   ID: {row['id']}")
        print(f"   名称: {row['name']}")
        print(f"   API URL: {api_config['api_url']}")
        print(f"   方法: {api_config['method']}")

        return row['id']

    finally:
        await conn.close()


async def create_test_qa_with_tool():
    """创建测试用的自定义QA问答对，并绑定敏感词检测工具"""
    print("\n" + "="*60)
    print("步骤 3: 创建测试QA并绑定工具")
    print("="*60)

    conn = await asyncpg.connect(**DB_CONFIG)

    try:
        # 首先查找或创建默认知识库
        kb_id = await conn.fetchval("""
            SELECT id FROM knowledge_collections
            WHERE name = '测试知识库'
            LIMIT 1
        """)

        if not kb_id:
            # 创建测试知识库
            kb_id = str(uuid.uuid4())
            await conn.execute("""
                INSERT INTO knowledge_collections (
                    id, name, description, metadata_template, created_at, updated_at
                ) VALUES ($1, $2, $3, $4, $5, $6)
            """,
                kb_id,
                "测试知识库",
                "用于测试敏感词检测功能",
                json.dumps({}),  # metadata_template
                datetime.now(),
                datetime.now()
            )
            print(f"   创建测试知识库: {kb_id}")

        # 删除已存在的测试QA
        await conn.execute("""
            DELETE FROM qa_pairs
            WHERE question = '检测这段文本是否包含敏感词'
            AND dataset_tag = 'manual_custom'
        """)

        # 创建QA问答对，绑定敏感词检测工具
        qa_metadata = {
            "enable_tool_call": True,
            "tool_names": ["api:sensitive_word_validation:sensitive_word_check"],  # API工具命名格式
            "tool_params": {
                "api:sensitive_word_validation:sensitive_word_check": {
                    "text": "{query}"  # 使用用户的查询作为检测文本
                }
            }
        }

        qa_id = await conn.fetchval("""
            INSERT INTO qa_pairs (
                knowledge_base_id, question, answer, dataset_tag,
                metadata, created_at
            ) VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING id
        """,
            str(kb_id),
            "检测这段文本是否包含敏感词",
            "我会使用敏感词检测工具来检查您的文本。",
            "manual_custom",
            json.dumps(qa_metadata),
            datetime.now()
        )

        print(f"\n✅ 测试QA创建成功!")
        print(f"   QA ID: {qa_id}")
        print(f"   知识库: {kb_id}")
        print(f"   问题: 检测这段文本是否包含敏感词")
        print(f"   绑定工具: api:sensitive_word_validation:sensitive_word_check")
        print(f"   工具参数: {qa_metadata['tool_params']}")

        return qa_id, kb_id

    finally:
        await conn.close()


async def test_tool_call_through_qa():
    """通过QA路由测试工具调用"""
    print("\n" + "="*60)
    print("步骤 4: 通过QA路由测试工具调用")
    print("="*60)

    # 注意：这里需要API工具被正确注册到llm-config-gateway的API工具系统中
    # 才能通过 api:config:tool 格式调用

    print("\n📝 测试说明:")
    print("   1. 需要在Unla/web的API工具页面创建一个配置")
    print("   2. 配置名称: sensitive_word_validation")
    print("   3. 添加HTTP服务器指向: http://localhost:8000")
    print("   4. 创建工具: sensitive_word_check")
    print("   5. 工具端点: /api/v1/validation-tools/sensitive-word-check")
    print("   6. 工具方法: POST")

    print("\n⏭️  跳过自动测试，需要手动在前端配置API工具")
    print("   配置完成后，可以通过自定义QA测试:")
    print(f"   curl -X POST {API_BASE_URL}/api/v1/knowledge/search \\")
    print('     -H "Content-Type: application/json" \\')
    print('     -d \'{"query": "检测这段文本是否包含敏感词：这是包含暴力的消息", "knowledge_base_id": "<KB_ID>"}\'')


async def create_api_tool_config_guide():
    """生成API工具配置指南"""
    print("\n" + "="*60)
    print("步骤 5: API工具配置指南")
    print("="*60)

    config_guide = {
        "配置名称": "sensitive_word_validation",
        "HTTP服务器": {
            "名称": "mat-backend",
            "基础URL": "http://localhost:8000"
        },
        "工具配置": {
            "工具名称": "sensitive_word_check",
            "描述": "检测文本中是否包含敏感词",
            "方法": "POST",
            "端点": "/api/v1/validation-tools/sensitive-word-check",
            "请求参数示例": {
                "text": "要检测的文本内容",
                "return_details": True
            },
            "响应格式": {
                "success": True,
                "is_valid": False,
                "message": "检测到 2 个敏感词",
                "matched_count": 2,
                "matches": [
                    {
                        "word": "暴力",
                        "category": "政治类",
                        "position": 10
                    }
                ]
            }
        },
        "QA绑定示例": {
            "问题": "检测这段文本是否包含敏感词",
            "答案": "我会使用敏感词检测工具来检查您的文本。",
            "工具名称": "api:sensitive_word_validation:sensitive_word_check",
            "工具参数": {
                "text": "{query}"
            }
        }
    }

    print("\n📋 API工具配置信息:")
    print(json.dumps(config_guide, ensure_ascii=False, indent=2))

    # 保存到文件
    with open("sensitive_word_api_tool_config_guide.json", "w", encoding="utf-8") as f:
        json.dump(config_guide, f, ensure_ascii=False, indent=2)

    print(f"\n✅ 配置指南已保存到: sensitive_word_api_tool_config_guide.json")


async def main():
    """主测试流程"""
    print("\n" + "="*80)
    print("  敏感词校验API工具 - 完整测试流程")
    print("="*80)

    try:
        # 步骤 1: 测试endpoint
        await test_sensitive_word_endpoint()

        # 步骤 2: 注册API工具到数据库 (用于爬虫工具系统)
        tool_id = await register_api_tool()

        # 步骤 3: 创建测试QA
        qa_id, kb_id = await create_test_qa_with_tool()

        # 步骤 4: 工具调用测试说明
        await test_tool_call_through_qa()

        # 步骤 5: 生成配置指南
        await create_api_tool_config_guide()

        print("\n" + "="*80)
        print("  测试完成!")
        print("="*80)
        print("\n📌 后续步骤:")
        print("   1. 访问 http://localhost:5234/tools/api (Unla Web界面)")
        print("   2. 创建API工具配置 'sensitive_word_validation'")
        print("   3. 添加工具 'sensitive_word_check'")
        print("   4. 测试自定义QA调用工具")
        print(f"   5. 知识库ID: {kb_id}")
        print(f"   6. QA ID: {qa_id}")

    except Exception as e:
        print(f"\n❌ 测试失败: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    asyncio.run(main())
