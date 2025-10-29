"""
测试所有自定义爬虫工具
"""
import asyncio
import sys
import json
sys.path.insert(0, '/Users/wxn/Desktop/NextAgentLite/lite-backend')

from service.api_crawler_service import api_crawler_service
import asyncpg
from core.config_optimized import optimized_config_manager


async def test_tool(tool_id: int, keyword: str):
    """测试单个工具"""
    # 获取工具配置
    db_config = optimized_config_manager.settings.database_postgresql
    conn = await asyncpg.connect(
        host=db_config.host,
        port=db_config.port,
        user=db_config.username,
        password=db_config.password,
        database=db_config.database
    )

    tool_row = await conn.fetchrow("""
        SELECT id, name, api_config
        FROM custom_crawler_tools
        WHERE id = $1
    """, tool_id)

    await conn.close()

    if not tool_row:
        print(f"✗ 工具ID={tool_id}不存在")
        return None

    api_config = tool_row['api_config']
    if isinstance(api_config, str):
        api_config = json.loads(api_config)

    # 构建API参数
    api_params = dict(api_config['params_template'])
    api_params['searchWord'] = keyword
    api_params['pageSize'] = 5

    # 调用API
    result_api = await api_crawler_service.call_search_api(
        api_url=api_config['api_url'],
        search_params=api_params
    )

    if not result_api.get('success'):
        return {
            'success': False,
            'tool_name': tool_row['name'],
            'error': result_api.get('error')
        }

    # 解析响应
    response_path = api_config['response_path']
    data = result_api['data']

    # 提取结果
    results_data = data.get('data', {}).get('middle', {}).get('list', [])
    mapping = response_path.get('mapping', {})

    results = []
    for item in results_data[:5]:
        results.append({
            'title': item.get(mapping['title'], ''),
            'link': item.get(mapping['link'], ''),
            'date': item.get(mapping.get('date', ''), ''),
            'source': item.get(mapping.get('source', ''), '')
        })

    return {
        'success': True,
        'tool_name': tool_row['name'],
        'mode': 'api',
        'results_count': len(results),
        'results': results,
        'execution_time': result_api.get('execution_time', 0)
    }


async def main():
    """主测试函数"""
    print("\n" + "="*80)
    print("测试所有自定义爬虫工具")
    print("="*80 + "\n")

    # 获取所有工具
    db_config = optimized_config_manager.settings.database_postgresql
    conn = await asyncpg.connect(
        host=db_config.host,
        port=db_config.port,
        user=db_config.username,
        password=db_config.password,
        database=db_config.database
    )

    tools = await conn.fetch("""
        SELECT id, name, description
        FROM custom_crawler_tools
        WHERE enabled = true
        ORDER BY id
    """)

    await conn.close()

    print(f"找到 {len(tools)} 个启用的工具:\n")

    # 测试用例
    test_cases = [
        (2, "一老一小"),      # 贵州省政府(全省)
        (3, "乡村振兴"),      # 贵州省政府(本站)
        (4, "最新投资政策"),  # 六盘水(本站)
        (5, "招商引资"),      # 六盘水(全省)
    ]

    for tool_id, keyword in test_cases:
        # 查找工具名称
        tool_info = next((t for t in tools if t['id'] == tool_id), None)
        if not tool_info:
            print(f"工具ID={tool_id} 不存在，跳过")
            continue

        print(f"测试: {tool_info['name']}")
        print(f"  描述: {tool_info['description']}")
        print(f"  关键词: {keyword}")
        print("-"*80)

        result = await test_tool(tool_id, keyword)

        if result and result.get('success'):
            print(f"✓ 搜索成功")
            print(f"  执行模式: {result.get('mode')}")
            print(f"  结果数量: {result.get('results_count')}")
            print(f"  执行耗时: {result.get('execution_time', 0):.2f}秒")

            if result.get('results'):
                print(f"\n  前2条结果:")
                for i, item in enumerate(result['results'][:2], 1):
                    print(f"\n    {i}. {item.get('title', '')[:50]}")
                    print(f"       时间: {item.get('date', '')}")
                    print(f"       来源: {item.get('source', '')}")
        else:
            error = result.get('error') if result else '未知错误'
            print(f"✗ 搜索失败: {error}")

        print("\n" + "="*80 + "\n")

    print("所有测试完成！\n")


if __name__ == "__main__":
    asyncio.run(main())
