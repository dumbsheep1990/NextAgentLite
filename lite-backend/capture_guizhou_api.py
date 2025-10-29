"""
捕获贵州省政府网站的搜索API请求
"""
import asyncio
import sys
import json
sys.path.insert(0, '/Users/wxn/Desktop/NextAgentLite/lite-backend')

from playwright.async_api import async_playwright


async def capture_guizhou_search_api():
    """捕获贵州省政府搜索API"""

    print("="*80)
    print("捕获贵州省政府网站搜索API")
    print("="*80 + "\n")

    # 测试URL (搜全省)
    test_url = "https://www.guizhou.gov.cn/so/search.shtml?tenantId=&tenantIds=&configTenantId=186&searchWord=%E4%B8%80%E8%80%81%E4%B8%80%E5%B0%8F&dataTypeId=963&searchBy=title&orderBy=time"

    print(f"目标URL: {test_url}\n")
    print("正在启动浏览器监听网络请求...\n")

    captured_requests = []

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=False)
        context = await browser.new_context(
            user_agent='Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
        )
        page = await context.new_page()

        # 监听所有请求
        async def handle_request(request):
            url = request.url
            method = request.method

            # 只关注POST请求和包含search/query的请求
            if 'search' in url.lower() or 'query' in url.lower():
                print(f"[{method}] {url}")

                if method == "POST":
                    try:
                        post_data = request.post_data
                        if post_data:
                            print(f"  POST数据: {post_data[:200]}...")
                    except:
                        pass

        # 监听所有响应
        async def handle_response(response):
            url = response.url
            method = response.request.method

            # 捕获搜索相关的POST请求
            if method == "POST" and ('search' in url.lower() or 'irs/front' in url.lower()):
                try:
                    status = response.status
                    print(f"\n{'='*80}")
                    print(f"✓ 捕获到搜索API!")
                    print(f"{'='*80}")
                    print(f"URL: {url}")
                    print(f"Method: {method}")
                    print(f"Status: {status}")

                    # 获取请求数据
                    post_data = response.request.post_data
                    if post_data:
                        print(f"\nPOST数据:")
                        try:
                            post_json = json.loads(post_data)
                            print(json.dumps(post_json, indent=2, ensure_ascii=False))
                        except:
                            print(post_data)

                    # 获取响应数据
                    try:
                        response_text = await response.text()
                        response_json = json.loads(response_text)

                        print(f"\n响应数据结构:")
                        print(f"  - success: {response_json.get('success')}")

                        if 'data' in response_json:
                            data = response_json['data']
                            print(f"  - data.middle: {type(data.get('middle'))}")
                            if 'middle' in data and 'list' in data['middle']:
                                results = data['middle']['list']
                                print(f"  - data.middle.list: {len(results)} 条结果")

                                if results:
                                    print(f"\n第一条结果示例:")
                                    first = results[0]
                                    print(f"    标题: {first.get('title_no_tag', first.get('title', ''))[:60]}")
                                    print(f"    链接: {first.get('url', '')[:80]}")
                                    print(f"    时间: {first.get('time', '')}")
                                    print(f"    来源: {first.get('source', '')}")

                            if 'pager' in data:
                                pager = data['pager']
                                print(f"  - data.pager.total: {pager.get('total')}")
                                print(f"  - data.pager.pageNo: {pager.get('pageNo')}")
                                print(f"  - data.pager.pageSize: {pager.get('pageSize')}")

                        # 保存完整响应到文件
                        with open('guizhou_search_api_response.json', 'w', encoding='utf-8') as f:
                            json.dump(response_json, f, indent=2, ensure_ascii=False)
                        print(f"\n完整响应已保存到: guizhou_search_api_response.json")

                        captured_requests.append({
                            'url': url,
                            'method': method,
                            'post_data': post_data,
                            'response': response_json
                        })

                    except Exception as e:
                        print(f"解析响应失败: {e}")

                    print(f"{'='*80}\n")

                except Exception as e:
                    print(f"处理响应失败: {e}")

        page.on("request", handle_request)
        page.on("response", handle_response)

        # 访问页面
        try:
            print("正在访问页面...\n")
            await page.goto(test_url, wait_until='networkidle', timeout=30000)

            # 等待一段时间确保所有请求完成
            await asyncio.sleep(3)

            print("\n页面加载完成")

            # 检查页面标题
            title = await page.title()
            print(f"页面标题: {title}")

            # 截图
            await page.screenshot(path='guizhou_search_page.png')
            print("页面截图已保存: guizhou_search_page.png")

        except Exception as e:
            print(f"访问页面失败: {e}")

        # 保持浏览器打开10秒供观察
        print("\n浏览器将在10秒后关闭...")
        await asyncio.sleep(10)

        await browser.close()

    print(f"\n捕获到 {len(captured_requests)} 个相关请求")

    if captured_requests:
        print("\n总结:")
        for i, req in enumerate(captured_requests, 1):
            print(f"\n{i}. {req['method']} {req['url']}")


if __name__ == "__main__":
    asyncio.run(capture_guizhou_search_api())
