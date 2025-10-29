"""
调试六盘水政府网站选择器配置
"""
import asyncio
from playwright.async_api import async_playwright
from bs4 import BeautifulSoup


async def fetch_and_analyze():
    """抓取页面并分析HTML结构"""
    url = "https://www.gzlps.gov.cn/so/search.shtml?tenantId=139&sign=ad6f479a-fc92-4f1e-9a70-9fc2b18a042b&dataTypeId=2577&searchWord=政策&orderBy=time&searchBy=all"

    print(f"正在访问: {url}")
    print("=" * 80)

    playwright = await async_playwright().start()
    browser = await playwright.chromium.launch(headless=True)
    page = await browser.new_page()

    try:
        # 访问页面
        await page.goto(url, wait_until='networkidle', timeout=30000)

        # 等待5秒让JavaScript加载
        await asyncio.sleep(5)

        # 获取HTML内容
        content = await page.content()

        # 保存完整HTML到文件
        with open('/Users/wxn/Desktop/NextAgentLite/lite-backend/debug_liupanshui_full.html', 'w', encoding='utf-8') as f:
            f.write(content)
        print("✓ 完整HTML已保存到 debug_liupanshui_full.html")

        # 使用BeautifulSoup解析
        soup = BeautifulSoup(content, 'html.parser')

        # 查找常见的搜索结果容器
        print("\n1. 查找可能的结果容器:")
        print("-" * 80)

        # 尝试多种可能的选择器
        possible_containers = [
            '.search-result-list',
            '.result-list',
            '.search-results',
            '#search-results',
            '.list',
            '[class*="result"]',
            '[class*="list"]',
            '.items',
            '[id*="result"]'
        ]

        for selector in possible_containers:
            elements = soup.select(selector)
            if elements:
                print(f"  ✓ 找到容器: {selector} (数量: {len(elements)})")
                # 打印第一个容器的class和id
                elem = elements[0]
                print(f"    - 标签: {elem.name}")
                print(f"    - class: {elem.get('class', [])}")
                print(f"    - id: {elem.get('id', 'N/A')}")
                print(f"    - 子元素数量: {len(list(elem.children))}")

        print("\n2. 查找所有带'result'或'item'的class:")
        print("-" * 80)

        # 查找所有包含result或item的元素
        result_elements = soup.find_all(class_=lambda x: x and ('result' in x.lower() or 'item' in x.lower()))
        class_names = set()
        for elem in result_elements[:20]:  # 只看前20个
            classes = elem.get('class', [])
            for cls in classes:
                if 'result' in cls.lower() or 'item' in cls.lower():
                    class_names.add(cls)

        for cls in sorted(class_names):
            count = len(soup.find_all(class_=cls))
            print(f"  .{cls} (数量: {count})")

        print("\n3. 分析DOM结构特征:")
        print("-" * 80)

        # 查找包含多个链接的列表
        lists = soup.find_all(['ul', 'ol', 'div'])
        for lst in lists:
            links = lst.find_all('a', recursive=False)
            if len(links) >= 5:  # 如果直接子元素有5个以上链接
                print(f"  找到包含 {len(links)} 个链接的容器:")
                print(f"    - 标签: {lst.name}")
                print(f"    - class: {lst.get('class', [])}")
                print(f"    - id: {lst.get('id', 'N/A')}")

        print("\n4. 查找第一个搜索结果的完整HTML:")
        print("-" * 80)

        # 尝试查找第一个结果项
        # 先尝试找包含标题和链接的结构
        items_with_links = []
        for item in soup.find_all(['li', 'div', 'article']):
            # 检查是否包含链接和标题
            title = item.find(['h1', 'h2', 'h3', 'h4', 'h5', 'a'])
            link = item.find('a')
            if title and link:
                items_with_links.append(item)

        if items_with_links:
            first_item = items_with_links[0]
            print(f"找到第一个结果项 (标签: {first_item.name}):")
            print(first_item.prettify()[:1000])  # 只打印前1000字符

            # 分析结构
            print("\n  结构分析:")
            print(f"    - class: {first_item.get('class', [])}")
            print(f"    - id: {first_item.get('id', 'N/A')}")

            title_elem = first_item.find(['h1', 'h2', 'h3', 'h4', 'h5', 'a'])
            if title_elem:
                print(f"    - 标题标签: {title_elem.name}")
                print(f"    - 标题class: {title_elem.get('class', [])}")
                print(f"    - 标题文本: {title_elem.get_text(strip=True)[:100]}")

            link_elem = first_item.find('a')
            if link_elem:
                print(f"    - 链接: {link_elem.get('href', 'N/A')}")

        print("\n" + "=" * 80)
        print("调试完成！请检查 debug_liupanshui_full.html 查看完整HTML")

    finally:
        await browser.close()
        await playwright.stop()


if __name__ == "__main__":
    asyncio.run(fetch_and_analyze())
