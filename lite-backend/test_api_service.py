"""测试API爬取服务"""
import asyncio
import sys
sys.path.insert(0, '/Users/wxn/Desktop/NextAgentLite/lite-backend')

from service.api_crawler_service import api_crawler_service


async def test():
    print("测试六盘水政府网站API搜索...")
    print("="*80)

    result = await api_crawler_service.search_liupanshui(
        keyword="最新投资政策",
        tenant_id="30",
        data_type_id="124",
        order_by="time",
        search_by="all",
        page_no=1,
        page_size=20
    )

    if result['success']:
        print(f"✓ 搜索成功!")
        print(f"  执行时间: {result['execution_time']:.2f}秒")
        print(f"  渲染方式: {result['render_method']}")
        print(f"  结果数量: {result['results_count']}")

        if 'pager' in result:
            pager = result['pager']
            print(f"\n分页信息:")
            print(f"  当前页: {pager['pageNo']}")
            print(f"  每页数量: {pager['pageSize']}")
            print(f"  总数: {pager['total']}")

        if result['results']:
            print(f"\n前3个结果:")
            for i, item in enumerate(result['results'][:3], 1):
                print(f"\n  结果 {i}:")
                print(f"    标题: {item['title'][:60]}")
                print(f"    链接: {item['link'][:80]}")
                print(f"    时间: {item.get('date', 'N/A')}")
                print(f"    来源: {item.get('source', 'N/A')}")
                print(f"    内容: {item.get('content', '')[:100]}")
    else:
        print(f"✗ 搜索失败: {result.get('error')}")

    print(f"\n{'='*80}")


if __name__ == "__main__":
    asyncio.run(test())
