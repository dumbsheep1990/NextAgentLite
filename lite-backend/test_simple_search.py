"""测试简单搜索URL"""
import asyncio
from playwright.async_api import async_playwright


async def test_simple_url():
    # 尝试更简单的URL - 只有关键词参数
    url = "https://www.gzlps.gov.cn/so/search.shtml?searchWord=政策"

    print(f"测试URL: {url}\n")

    playwright = await async_playwright().start()
    browser = await playwright.chromium.launch(headless=False)  # 使用有头模式来观察
    page = await browser.new_page()

    try:
        await page.goto(url, wait_until='domcontentloaded', timeout=20000)

        # 等待页面加载
        await asyncio.sleep(10)

        # 检查是否有结果
        no_result = await page.query_selector('text=未能搜到相关的数据')
        if no_result:
            print("✗ 显示'未能搜到相关的数据'")
        else:
            print("✓ 未显示错误消息，可能有结果")

        # 检查结果容器
        result_content = await page.query_selector('.basic_result_content')
        if result_content:
            is_visible = await result_content.is_visible()
            if is_visible:
                items = await page.query_selector_all('.basic_result_content .item')
                print(f"✓ 找到 {len(items)} 个结果项")

                if items:
                    # 打印第一个结果
                    first_item = items[0]
                    title_elem = await first_item.query_selector('.title, a')
                    if title_elem:
                        title = await title_elem.inner_text()
                        print(f"  第一个结果: {title[:100]}")
            else:
                print("✗ .basic_result_content 不可见")

        # 保存HTML
        html = await page.content()
        with open('/Users/wxn/Desktop/NextAgentLite/lite-backend/debug_simple_search.html', 'w', encoding='utf-8') as f:
            f.write(html)
        print(f"\nHTML已保存 (长度: {len(html)})")

        # 保存截图
        await page.screenshot(path='/Users/wxn/Desktop/NextAgentLite/lite-backend/debug_screenshot.png', full_page=True)
        print("✓ 截图已保存到 debug_screenshot.png")

        # 保持浏览器打开20秒让用户观察
        print("\n浏览器将保持打开20秒...")
        await asyncio.sleep(20)

    finally:
        await browser.close()
        await playwright.stop()


if __name__ == "__main__":
    asyncio.run(test_simple_url())
