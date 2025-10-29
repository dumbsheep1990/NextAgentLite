"""测试更新后的browser_crawler_service"""
import asyncio
import sys
sys.path.insert(0, '/Users/wxn/Desktop/NextAgentLite/lite-backend')

from service.browser_crawler_service import browser_crawler_service


async def test_service():
    # 测试URL - 使用六盘水政府网站搜索
    test_urls = [
        # URL 1: 完整参数版本
        "https://www.gzlps.gov.cn/so/search.shtml?tenantId=139&sign=ad6f479a-fc92-4f1e-9a70-9fc2b18a042b&dataTypeId=2577&searchWord=政策&orderBy=time&searchBy=all",
        # URL 2: 简化版本
        "https://www.gzlps.gov.cn/so/search.shtml?searchWord=政策"
    ]

    for i, url in enumerate(test_urls, 1):
        print(f"\n{'='*80}")
        print(f"测试 {i}: {url[:100]}...")
        print('='*80)

        try:
            result = await browser_crawler_service.fetch_page_with_js(
                url=url,
                wait_time=8000  # 等待8秒
            )

            if result['success']:
                html = result['content']
                print(f"✓ 抓取成功")
                print(f"  - HTML长度: {len(html)}")
                print(f"  - 最终URL: {result['url']}")

                # 检查是否有错误消息
                if '未能搜到相关的数据' in html:
                    print(f"  ✗ 发现'未能搜到相关的数据'错误消息")
                else:
                    print(f"  ✓ 未发现错误消息")

                # 检查.basic_result_content
                if '.basic_result_content' in html:
                    # 简单检查是否有display:none
                    if 'basic_result_content' in html and 'display: none' in html:
                        print(f"  ⚠ .basic_result_content 可能为隐藏状态")
                    else:
                        print(f"  ✓ .basic_result_content 存在")

                # 保存HTML
                filename = f'/Users/wxn/Desktop/NextAgentLite/lite-backend/debug_test_{i}.html'
                with open(filename, 'w', encoding='utf-8') as f:
                    f.write(html)
                print(f"  ✓ HTML已保存到 {filename}")

            else:
                print(f"✗ 抓取失败: {result.get('error')}")

        except Exception as e:
            print(f"✗ 异常: {str(e)}")

        # 等待一下再测试下一个URL
        if i < len(test_urls):
            await asyncio.sleep(2)

    # 关闭浏览器
    await browser_crawler_service.close()
    print(f"\n{'='*80}")
    print("测试完成")


if __name__ == "__main__":
    asyncio.run(test_service())
