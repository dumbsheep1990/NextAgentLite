"""测试不同的等待策略"""
import asyncio
from playwright.async_api import async_playwright


async def test_different_waits():
    url = "https://www.gzlps.gov.cn/so/search.shtml?tenantId=139&sign=ad6f479a-fc92-4f1e-9a70-9fc2b18a042b&dataTypeId=2577&searchWord=政策&orderBy=time&searchBy=all"

    playwright = await async_playwright().start()
    browser = await playwright.chromium.launch(headless=True)
    page = await browser.new_page()

    try:
        print("策略1: 等待load + 固定时间")
        await page.goto(url, wait_until='load', timeout=30000)
        await asyncio.sleep(8)  # 增加等待时间到8秒

        # 检查内容容器
        content_div = await page.query_selector('.basic_result_content')
        if content_div:
            is_visible = await content_div.is_visible()
            inner_html = await content_div.inner_html()
            print(f"  ✓ .basic_result_content 可见: {is_visible}, 内容长度: {len(inner_html)}")
        else:
            print("  ✗ 未找到 .basic_result_content")

        # 策略2: 等待内容容器可见
        print("\n策略2: 等待 .basic_result_content 可见")
        try:
            await page.wait_for_selector('.basic_result_content:not([style*="display: none"])', timeout=10000)
            print("  ✓ 容器已可见")
        except Exception as e:
            print(f"  ✗ 超时: {str(e)[:100]}")

        # 策略3: 等待.item元素出现
        print("\n策略3: 等待 .item 元素")
        try:
            await page.wait_for_selector('.basic_result_content .item', timeout=10000)
            items = await page.query_selector_all('.basic_result_content .item')
            print(f"  ✓ 找到 {len(items)} 个 .item 元素")

            if items:
                first_item = items[0]
                title_elem = await first_item.query_selector('.title')
                if title_elem:
                    title_text = await title_elem.inner_text()
                    print(f"  第一个标题: {title_text[:100]}")
        except Exception as e:
            print(f"  ✗ 超时: {str(e)[:100]}")

        # 检查是否有错误提示
        print("\n检查错误提示:")
        no_result = await page.query_selector_all('text=未能搜到相关的数据')
        if no_result:
            print(f"  ✗ 找到 {len(no_result)} 个'未能搜到相关的数据'元素")
        else:
            print("  ✓ 没有找到错误提示")

        # 保存最终HTML
        final_html = await page.content()
        with open('/Users/wxn/Desktop/NextAgentLite/lite-backend/debug_page_final.html', 'w', encoding='utf-8') as f:
            f.write(final_html)
        print(f"\n✓ 最终HTML已保存 (长度: {len(final_html)})")

    finally:
        await browser.close()
        await playwright.stop()


if __name__ == "__main__":
    asyncio.run(test_different_waits())
