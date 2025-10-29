"""捕获AJAX请求，找到真实的数据接口"""
import asyncio
from playwright.async_api import async_playwright
import json


async def capture_requests():
    url = "https://www.gzlps.gov.cn/so/search.shtml?searchWord=政策"

    print(f"正在访问: {url}")
    print("监听所有网络请求...\n")

    playwright = await async_playwright().start()
    browser = await playwright.chromium.launch(headless=True)
    page = await browser.new_page()

    # 存储捕获的请求
    captured_requests = []

    # 监听请求
    async def handle_request(request):
        # 只记录XHR和Fetch请求
        if request.resource_type in ['xhr', 'fetch']:
            captured_requests.append({
                'url': request.url,
                'method': request.method,
                'headers': request.headers,
                'post_data': request.post_data if request.method == 'POST' else None
            })
            print(f"[REQUEST] {request.method} {request.url}")

    # 监听响应
    async def handle_response(response):
        if response.request.resource_type in ['xhr', 'fetch']:
            try:
                # 尝试获取响应内容
                body = await response.body()
                content_type = response.headers.get('content-type', '')

                print(f"[RESPONSE] {response.status} {response.url}")
                print(f"  Content-Type: {content_type}")
                print(f"  Size: {len(body)} bytes")

                # 如果是JSON响应，尝试解析
                if 'json' in content_type.lower():
                    try:
                        data = json.loads(body.decode('utf-8'))
                        print(f"  JSON Keys: {list(data.keys()) if isinstance(data, dict) else 'array'}")

                        # 保存完整响应
                        filename = f"/Users/wxn/Desktop/NextAgentLite/lite-backend/ajax_response_{len(captured_requests)}.json"
                        with open(filename, 'w', encoding='utf-8') as f:
                            json.dump(data, f, ensure_ascii=False, indent=2)
                        print(f"  ✓ 响应已保存到 {filename}")
                    except:
                        pass
                print()
            except Exception as e:
                print(f"  Error reading response: {str(e)}\n")

    page.on('request', handle_request)
    page.on('response', handle_response)

    try:
        # 访问页面
        await page.goto(url, wait_until='domcontentloaded', timeout=20000)

        # 等待足够长的时间让所有AJAX请求完成
        print("等待10秒让AJAX请求完成...\n")
        await asyncio.sleep(10)

        print("="*80)
        print(f"捕获到 {len(captured_requests)} 个XHR/Fetch请求")
        print("="*80)

        # 打印所有捕获的请求
        for i, req in enumerate(captured_requests, 1):
            print(f"\n请求 {i}:")
            print(f"  URL: {req['url']}")
            print(f"  Method: {req['method']}")
            if req['post_data']:
                print(f"  POST Data: {req['post_data'][:200]}")

        # 保存请求列表
        with open('/Users/wxn/Desktop/NextAgentLite/lite-backend/captured_requests.json', 'w', encoding='utf-8') as f:
            json.dump(captured_requests, f, ensure_ascii=False, indent=2)
        print(f"\n✓ 所有请求已保存到 captured_requests.json")

    finally:
        await browser.close()
        await playwright.stop()


if __name__ == "__main__":
    asyncio.run(capture_requests())
