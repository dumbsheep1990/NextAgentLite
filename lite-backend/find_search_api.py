"""找到真正的搜索结果API"""
import asyncio
from playwright.async_api import async_playwright
import json


async def find_api():
    url = "https://www.gzlps.gov.cn/so/search.shtml?searchWord=政策"

    print(f"正在访问: {url}")
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

    all_requests = []

    async def handle_response(response):
        request = response.request

        # 记录所有请求
        all_requests.append({
            'url': request.url,
            'method': request.method,
            'status': response.status,
            'type': request.resource_type
        })

        # 重点关注XHR/Fetch请求
        if request.resource_type in ['xhr', 'fetch']:
            url_lower = request.url.lower()

            # 查找可能包含搜索结果的请求
            keywords = ['search', 'list', 'query', 'result', 'data', 'content']
            is_relevant = any(keyword in url_lower for keyword in keywords)

            if is_relevant or response.status == 200:
                try:
                    body = await response.body()
                    content_type = response.headers.get('content-type', '')

                    print(f"\n[{request.method}] {response.status} {request.url}")
                    print(f"  Content-Type: {content_type}")
                    print(f"  Size: {len(body)} bytes")

                    # 如果是JSON响应
                    if 'json' in content_type.lower() and len(body) > 100:
                        try:
                            data = json.loads(body.decode('utf-8'))
                            print(f"  JSON结构:")

                            if isinstance(data, dict):
                                print(f"    Keys: {list(data.keys())}")

                                # 查找可能包含结果列表的字段
                                for key in ['data', 'result', 'results', 'list', 'items', 'records']:
                                    if key in data:
                                        value = data[key]
                                        if isinstance(value, list):
                                            print(f"    ✓ 找到列表字段 '{key}', 长度: {len(value)}")
                                            if value and len(value) > 0:
                                                print(f"      第一项keys: {list(value[0].keys()) if isinstance(value[0], dict) else 'not dict'}")
                                        elif isinstance(value, dict):
                                            print(f"    ✓ 找到字典字段 '{key}', keys: {list(value.keys())}")

                            # 保存响应
                            filename = f"/Users/wxn/Desktop/NextAgentLite/lite-backend/api_response_{len(all_requests)}.json"
                            with open(filename, 'w', encoding='utf-8') as f:
                                json.dump({
                                    'url': request.url,
                                    'method': request.method,
                                    'post_data': request.post_data if request.method == 'POST' else None,
                                    'response': data
                                }, f, ensure_ascii=False, indent=2)
                            print(f"    ✓ 已保存到 {filename}")

                        except Exception as e:
                            print(f"    解析JSON失败: {str(e)}")
                except Exception as e:
                    print(f"  读取响应失败: {str(e)}")

    page.on('response', handle_response)

    try:
        await page.goto(url, wait_until='domcontentloaded', timeout=20000)

        # 等待更长时间
        print("\n等待15秒让所有AJAX请求完成...")
        await asyncio.sleep(15)

        print(f"\n{'='*80}")
        print(f"总共捕获 {len(all_requests)} 个请求")

        # 统计XHR/Fetch请求
        xhr_requests = [r for r in all_requests if r['type'] in ['xhr', 'fetch']]
        print(f"其中XHR/Fetch请求: {len(xhr_requests)} 个")

    finally:
        await browser.close()
        await playwright.stop()


if __name__ == "__main__":
    asyncio.run(find_api())
