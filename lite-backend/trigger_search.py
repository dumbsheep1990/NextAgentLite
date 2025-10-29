"""模拟用户操作触发搜索"""
import asyncio
from playwright.async_api import async_playwright
import json


async def trigger_search():
    print("访问搜索页面并模拟用户操作...")
    print("="*80)

    playwright = await async_playwright().start()
    browser = await playwright.chromium.launch(headless=False)  # 使用有头模式观察
    page = await browser.new_page()

    captured_apis = []

    async def handle_response(response):
        request = response.request

        if request.resource_type in ['xhr', 'fetch']:
            try:
                body = await response.body()
                content_type = response.headers.get('content-type', '')

                if 'json' in content_type.lower() and len(body) > 100:
                    data = json.loads(body.decode('utf-8'))

                    # 查找包含列表数据的响应
                    has_list = False
                    if isinstance(data, dict):
                        for key in ['data', 'result', 'results', 'list', 'items', 'records']:
                            if key in data and isinstance(data[key], list) and len(data[key]) > 0:
                                has_list = True
                                break

                    if has_list or 'search' in request.url.lower() or 'query' in request.url.lower():
                        print(f"\n✓ 发现可能的搜索API:")
                        print(f"  URL: {request.url}")
                        print(f"  Method: {request.method}")
                        if request.method == 'POST':
                            print(f"  POST Data: {request.post_data[:500] if request.post_data else 'None'}")

                        captured_apis.append({
                            'url': request.url,
                            'method': request.method,
                            'post_data': request.post_data,
                            'response': data
                        })

                        # 保存
                        filename = f"/Users/wxn/Desktop/NextAgentLite/lite-backend/search_api_{len(captured_apis)}.json"
                        with open(filename, 'w', encoding='utf-8') as f:
                            json.dump(captured_apis[-1], f, ensure_ascii=False, indent=2)
                        print(f"  ✓ 已保存到 {filename}")

            except:
                pass

    page.on('response', handle_response)

    try:
        # 访问首页
        print("\n1. 访问搜索首页...")
        await page.goto('https://www.gzlps.gov.cn/so/search.shtml', timeout=20000)
        await asyncio.sleep(3)

        # 查找搜索输入框
        print("\n2. 查找搜索输入框...")
        search_input = await page.query_selector('input[type="text"], input.search-input, #searchWord')

        if search_input:
            print("  ✓ 找到搜索输入框")

            # 输入关键词
            print("\n3. 输入搜索关键词'政策'...")
            await search_input.fill('政策')
            await asyncio.sleep(1)

            # 查找搜索按钮
            print("\n4. 查找并点击搜索按钮...")
            search_button = await page.query_selector('button[type="submit"], .search-button, .btn-search')

            if search_button:
                print("  ✓ 找到搜索按钮，点击...")
                await search_button.click()
            else:
                print("  ! 未找到搜索按钮，尝试按Enter键...")
                await search_input.press('Enter')

            # 等待搜索结果加载
            print("\n5. 等待搜索结果加载...")
            await asyncio.sleep(10)

            # 检查页面内容
            content = await page.content()
            if '未能搜到相关的数据' in content:
                print("  ✗ 页面显示'未能搜到相关的数据'")
            else:
                # 检查是否有结果项
                items = await page.query_selector_all('.item, .result-item, [class*="item"]')
                print(f"  找到 {len(items)} 个可能的结果项")

        else:
            print("  ✗ 未找到搜索输入框")

        print(f"\n{'='*80}")
        print(f"捕获到 {len(captured_apis)} 个搜索相关的API")

        # 保持浏览器打开
        print("\n浏览器将保持打开20秒，请观察...")
        await asyncio.sleep(20)

    finally:
        await browser.close()
        await playwright.stop()


if __name__ == "__main__":
    asyncio.run(trigger_search())
