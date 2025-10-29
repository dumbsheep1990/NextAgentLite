"""简单调试 - 查看抓取的HTML内容"""
import asyncio
import sys
sys.path.insert(0, '/Users/wxn/Desktop/NextAgentLite/lite-backend')

from service.browser_crawler_service import browser_crawler_service


async def test_fetch():
    url = "https://www.gzlps.gov.cn/so/search.shtml?tenantId=139&sign=ad6f479a-fc92-4f1e-9a70-9fc2b18a042b&dataTypeId=2577&searchWord=政策&orderBy=time&searchBy=all"

    print(f"正在抓取: {url}")
    result = await browser_crawler_service.fetch_page_with_js(url=url, wait_time=5000)

    if result['success']:
        html = result['content']
        print(f"\n✓ 抓取成功，HTML长度: {len(html)}")

        # 保存HTML到文件
        with open('/Users/wxn/Desktop/NextAgentLite/lite-backend/debug_page.html', 'w', encoding='utf-8') as f:
            f.write(html)
        print("✓ HTML已保存到 debug_page.html")

        # 查找包含"result"或"item"的class
        import re
        classes = re.findall(r'class="([^"]*(?:result|item)[^"]*)"', html, re.IGNORECASE)
        unique_classes = sorted(set(classes))[:20]

        print("\n找到的相关CSS类:")
        for cls in unique_classes:
            print(f"  .{cls}")
    else:
        print(f"✗ 抓取失败: {result.get('error')}")

    await browser_crawler_service.close()


if __name__ == "__main__":
    asyncio.run(test_fetch())
