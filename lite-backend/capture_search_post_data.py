"""捕获搜索API的完整POST请求体"""
import asyncio
from playwright.async_api import async_playwright
import json


async def capture_post_data():
    # 使用用户提供的测试URL
    url = "https://www.gzlps.gov.cn/so/search.shtml?tenantId=30&tenantIds=&configTenantId=&searchWord=%E6%9C%80%E6%96%B0%E6%8A%95%E8%B5%84%E6%94%BF%E7%AD%96&dataTypeId=124&sign=4dc13256-c8da-4715-cd51-58230bfa87b0"

    print(f"访问URL: {url}")
    print("="*80)

    playwright = await async_playwright().start()
    browser = await playwright.chromium.launch(headless=True)
    page = await browser.new_page()

    # 注入反检测脚本
    await page.add_init_script("""
        Object.defineProperty(navigator, 'webdriver', {
            get: () => undefined
        });
    """)

    search_api_data = None

    async def handle_request(request):
        nonlocal search_api_data

        # 监听搜索API请求
        if '/irs/front/search' in request.url:
            print(f"\n✓ 捕获到搜索API请求!")
            print(f"  URL: {request.url}")
            print(f"  Method: {request.method}")

            if request.method == 'POST':
                post_data = request.post_data
                if post_data:
                    print(f"\n  POST请求体:")
                    try:
                        # 尝试解析JSON
                        data = json.loads(post_data)
                        print(json.dumps(data, ensure_ascii=False, indent=4))

                        search_api_data = {
                            'url': request.url,
                            'method': request.method,
                            'headers': dict(request.headers),
                            'post_data': data
                        }
                    except:
                        print(post_data)
                        search_api_data = {
                            'url': request.url,
                            'method': request.method,
                            'headers': dict(request.headers),
                            'post_data': post_data
                        }

    async def handle_response(response):
        # 监听搜索API响应
        if '/irs/front/search' in response.url and response.status == 200:
            print(f"\n✓ 捕获到搜索API响应!")
            try:
                body = await response.body()
                data = json.loads(body.decode('utf-8'))

                print(f"  响应状态: {response.status}")
                print(f"  数据结构:")
                print(f"    - success: {data.get('success')}")
                print(f"    - msg: {data.get('msg')}")

                if 'data' in data:
                    data_obj = data['data']
                    if 'middle' in data_obj and 'list' in data_obj['middle']:
                        results = data_obj['middle']['list']
                        print(f"    - 结果数量: {len(results)}")
                        if results:
                            print(f"\n  第一个结果:")
                            first = results[0]
                            print(f"    标题: {first.get('title_no_tag', 'N/A')}")
                            print(f"    URL: {first.get('url', 'N/A')}")
                            print(f"    时间: {first.get('time', 'N/A')}")
                            print(f"    来源: {first.get('source', 'N/A')}")

                    if 'pager' in data_obj:
                        pager = data_obj['pager']
                        print(f"\n  分页信息:")
                        print(f"    pageNo: {pager.get('pageNo')}")
                        print(f"    pageSize: {pager.get('pageSize')}")
                        print(f"    total: {pager.get('total')}")

                # 保存完整响应
                if search_api_data:
                    search_api_data['response'] = data

            except Exception as e:
                print(f"  解析响应失败: {str(e)}")

    page.on('request', handle_request)
    page.on('response', handle_response)

    try:
        await page.goto(url, wait_until='domcontentloaded', timeout=30000)

        # 等待搜索API完成
        print("\n等待搜索API请求...")
        await asyncio.sleep(15)

        if search_api_data:
            # 保存到文件
            filename = '/Users/wxn/Desktop/NextAgentLite/lite-backend/search_api_complete.json'
            with open(filename, 'w', encoding='utf-8') as f:
                json.dump(search_api_data, f, ensure_ascii=False, indent=2)

            print(f"\n{'='*80}")
            print(f"✓ 完整的API数据已保存到: {filename}")
            print(f"{'='*80}")
        else:
            print(f"\n✗ 未捕获到搜索API请求")

    finally:
        await browser.close()
        await playwright.stop()


if __name__ == "__main__":
    asyncio.run(capture_post_data())
