"""
测试贵州省政府自定义爬虫工具
"""
import asyncio
import sys
import json
sys.path.insert(0, '/Users/wxn/Desktop/NextAgentLite/lite-backend')

from service.custom_crawler_agno_tools import CustomCrawlerTools


async def test_guizhou_tools():
    """测试贵州省政府工具"""

    print("\n" + "="*80)
    print("测试贵州省政府自定义爬虫工具")
    print("="*80 + "\n")

    # 测试全省搜索 (ID=2)
    print("测试1: 贵州省政府政策搜索(全省) - ID=2")
    print("-"*80)

    # 直接调用API服务测试
    from service.api_crawler_service import api_crawler_service
    from service.custom_crawler_agno_tools import CustomCrawlerTools
    import asyncpg
    from core.config_optimized import optimized_config_manager

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
    """, 2)

    await conn.close()

    if not tool_row:
        print("✗ 工具ID=2不存在")
        return

    api_config = tool_row['api_config']
    if isinstance(api_config, str):
        api_config = json.loads(api_config)
    params_template = api_config['params_template']

    # 构建API参数
    api_params = dict(params_template)
    api_params['searchWord'] = "一老一小"
    api_params['pageSize'] = 5

    result_api = await api_crawler_service.call_search_api(
        api_url=api_config['api_url'],
        search_params=api_params
    )

    # 解析响应
    if result_api.get('success'):
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
                'content': item.get(mapping.get('content', ''), ''),
                'date': item.get(mapping['date'], ''),
                'source': item.get(mapping.get('source', ''), '')
            })

        result = json.dumps({
            'success': True,
            'tool_name': tool_row['name'],
            'mode': 'api',
            'results_count': len(results),
            'results': results,
            'execution_time': result_api.get('execution_time', 0)
        }, ensure_ascii=False)
    else:
        result = json.dumps({
            'success': False,
            'error': result_api.get('error')
        }, ensure_ascii=False)

    result_data = json.loads(result)

    if result_data.get('success'):
        print(f"✓ 搜索成功")
        print(f"  工具名称: {result_data.get('tool_name')}")
        print(f"  执行模式: {result_data.get('mode')}")
        print(f"  结果数量: {result_data.get('results_count')}")
        print(f"  执行耗时: {result_data.get('execution_time', 0):.2f}秒")

        if result_data.get('results'):
            print(f"\n前3条结果:")
            for i, item in enumerate(result_data['results'][:3], 1):
                print(f"\n  {i}. {item.get('title', '')[:60]}")
                print(f"     链接: {item.get('link', '')[:80]}")
                print(f"     时间: {item.get('date', '')}")
                print(f"     来源: {item.get('source', '')}")
    else:
        print(f"✗ 搜索失败: {result_data.get('error')}")

    print("\n" + "="*80 + "\n")

    # 测试本站搜索 (ID=3)
    print("测试2: 贵州省政府政策搜索(本站) - ID=3")
    print("-"*80)

    # 获取工具配置
    conn2 = await asyncpg.connect(
        host=db_config.host,
        port=db_config.port,
        user=db_config.username,
        password=db_config.password,
        database=db_config.database
    )

    tool_row2 = await conn2.fetchrow("""
        SELECT id, name, api_config
        FROM custom_crawler_tools
        WHERE id = $1
    """, 3)

    await conn2.close()

    if not tool_row2:
        print("✗ 工具ID=3不存在")
        return

    api_config2 = tool_row2['api_config']
    if isinstance(api_config2, str):
        api_config2 = json.loads(api_config2)
    params_template2 = api_config2['params_template']

    # 构建API参数
    api_params2 = dict(params_template2)
    api_params2['searchWord'] = "乡村振兴"
    api_params2['pageSize'] = 5

    result_api2 = await api_crawler_service.call_search_api(
        api_url=api_config2['api_url'],
        search_params=api_params2
    )

    # 解析响应
    if result_api2.get('success'):
        response_path2 = api_config2['response_path']
        data2 = result_api2['data']

        # 提取结果
        results_data2 = data2.get('data', {}).get('middle', {}).get('list', [])
        mapping2 = response_path2.get('mapping', {})

        results2 = []
        for item in results_data2[:5]:
            results2.append({
                'title': item.get(mapping2['title'], ''),
                'link': item.get(mapping2['link'], ''),
                'content': item.get(mapping2.get('content', ''), ''),
                'date': item.get(mapping2['date'], ''),
                'source': item.get(mapping2.get('source', ''), '')
            })

        result2 = json.dumps({
            'success': True,
            'tool_name': tool_row2['name'],
            'mode': 'api',
            'results_count': len(results2),
            'results': results2,
            'execution_time': result_api2.get('execution_time', 0)
        }, ensure_ascii=False)
    else:
        result2 = json.dumps({
            'success': False,
            'error': result_api2.get('error')
        }, ensure_ascii=False)

    result_data2 = json.loads(result2)

    if result_data2.get('success'):
        print(f"✓ 搜索成功")
        print(f"  工具名称: {result_data2.get('tool_name')}")
        print(f"  执行模式: {result_data2.get('mode')}")
        print(f"  结果数量: {result_data2.get('results_count')}")
        print(f"  执行耗时: {result_data2.get('execution_time', 0):.2f}秒")

        if result_data2.get('results'):
            print(f"\n前3条结果:")
            for i, item in enumerate(result_data2['results'][:3], 1):
                print(f"\n  {i}. {item.get('title', '')[:60]}")
                print(f"     链接: {item.get('link', '')[:80]}")
                print(f"     时间: {item.get('date', '')}")
                print(f"     来源: {item.get('source', '')}")
    else:
        print(f"✗ 搜索失败: {result_data2.get('error')}")

    print("\n" + "="*80)
    print("测试完成")
    print("="*80 + "\n")


if __name__ == "__main__":
    asyncio.run(test_guizhou_tools())
