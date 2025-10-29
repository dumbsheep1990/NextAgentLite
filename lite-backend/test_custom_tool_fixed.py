"""
测试修复后的自定义工具
"""
import asyncio
import sys
sys.path.insert(0, '/Users/wxn/Desktop/NextAgentLite/lite-backend')

from service.custom_crawler_agno_tools import CustomCrawlerTools


async def test():
    print("=" * 80)
    print("测试修复后的自定义工具")
    print("=" * 80)

    # 创建工具实例（只选择ID=4的工具）
    tools = CustomCrawlerTools(selected_tool_ids=[4])

    # 测试1：使用query参数（LLM会这样调用）
    print("\n测试1: 使用query参数")
    print("-" * 80)
    result1 = await tools.search_custom_crawler_tool(
        query="一老一小政策",
        max_results=3
    )
    print(f"结果长度: {len(result1)}")
    print(f"结果预览: {result1[:500]}...")

    # 测试2：指定tool_id
    print("\n\n测试2: 明确指定tool_id")
    print("-" * 80)
    result2 = await tools.search_custom_crawler_tool(
        query="乡村振兴",
        max_results=3,
        tool_id=4
    )
    print(f"结果长度: {len(result2)}")
    print(f"结果预览: {result2[:500]}...")

    # 测试3: 使用keyword参数（向后兼容）
    print("\n\n测试3: 使用keyword参数（向后兼容）")
    print("-" * 80)
    result3 = await tools.search_custom_crawler_tool(
        query="",  # 提供空query
        keyword="招商引资",
        max_results=3,
        tool_id=4
    )
    print(f"结果长度: {len(result3)}")
    print(f"结果预览: {result3[:500]}...")

    print("\n" + "=" * 80)
    print("测试完成！")
    print("=" * 80)


if __name__ == "__main__":
    asyncio.run(test())
