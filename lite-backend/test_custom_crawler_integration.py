"""
测试自定义爬虫工具集成到Agent workflow
"""
import asyncio
import sys
sys.path.insert(0, '/Users/wxn/Desktop/NextAgentLite/lite-backend')

from service.agent_service_v2 import get_agent_service_v2
from core.logger import logger


async def test_custom_crawler_tool_integration():
    """测试自定义爬虫工具在Agent中的集成"""

    print("\n" + "="*80)
    print("测试自定义爬虫工具集成到Agent Workflow")
    print("="*80 + "\n")

    # 步骤1: 创建Agent服务
    print("步骤1: 创建Agent服务...")
    agent_service = await get_agent_service_v2()

    # 步骤2: 创建包含自定义爬虫工具的Agent
    # 假设数据库中有ID=1的自定义工具(六盘水政府政策搜索)
    print("\n步骤2: 创建Agent,选择自定义爬虫工具...")

    selected_tools = ["custom:1"]  # 选择ID为1的自定义工具

    agent = await agent_service.create_agent_v2(
        agent_name="test_crawler_agent",
        model_name="qwen3-30b-a3b-instruct-2507",  # 使用默认模型
        selected_tools=selected_tools,
        search_knowledge=False,  # 不使用知识库检索
        search_graph=False       # 不使用图谱检索
    )

    if not agent:
        print("✗ Agent创建失败")
        return

    print(f"✓ Agent创建成功: {agent.name}")
    print(f"  已加载工具数: {len(agent.tools) if hasattr(agent, 'tools') else 0}")

    # 步骤3: 测试工具调用
    print("\n步骤3: 测试Agent使用自定义爬虫工具...")

    # 构造测试问题,触发工具调用
    test_question = "请使用搜索工具查找六盘水市最新的投资政策,返回前5条结果"

    print(f"测试问题: {test_question}")
    print("\n正在执行Agent...")

    try:
        # 使用Agent的arun方法执行
        from agno.agent.run_response import RunResponse

        response: RunResponse = await agent.arun(test_question, stream=False)

        print("\n\n" + "-"*80)
        print("Agent响应:")
        print("-"*80)

        response_text = ""
        if hasattr(response, 'content'):
            response_text = response.content
            print(response_text)
        elif hasattr(response, 'messages') and response.messages:
            for msg in response.messages:
                if hasattr(msg, 'content'):
                    response_text += str(msg.content) + "\n"
            print(response_text)
        else:
            response_text = str(response)
            print(response_text)

        print("-"*80 + "\n")

        # 验证响应中是否包含预期内容
        if "Observation" in response_text or "results" in response_text.lower() or "政策" in response_text:
            print("✓ 工具调用成功,Agent获得了搜索结果")
        else:
            print("⚠ 未检测到明确的工具调用,请检查Agent日志")

    except Exception as e:
        print(f"✗ Agent执行失败: {e}")
        import traceback
        traceback.print_exc()
        return

    print("\n" + "="*80)
    print("测试完成")
    print("="*80 + "\n")


async def test_list_available_tools():
    """测试获取可用工具列表"""
    print("\n" + "="*80)
    print("测试获取可用工具列表(包含自定义工具)")
    print("="*80 + "\n")

    # 模拟API调用,查询tools端点
    import asyncpg
    from core.config_optimized import optimized_config_manager

    db_config = optimized_config_manager.settings.database_postgresql
    conn = await asyncpg.connect(
        host=db_config.host,
        port=db_config.port,
        user=db_config.username,
        password=db_config.password,
        database=db_config.database
    )

    try:
        # 查询自定义爬虫工具
        rows = await conn.fetch("""
            SELECT id, name, description, enabled
            FROM custom_crawler_tools
            ORDER BY id
        """)

        print(f"数据库中的自定义爬虫工具 ({len(rows)} 个):")
        print("-"*80)
        for row in rows:
            status = "✓ 启用" if row['enabled'] else "✗ 禁用"
            print(f"  {status} ID={row['id']}: {row['name']}")
            print(f"       {row['description'] or '无描述'}")
            print()

        print("-"*80 + "\n")

    finally:
        await conn.close()


async def main():
    """主测试函数"""
    try:
        # 测试1: 查看可用工具
        await test_list_available_tools()

        # 测试2: Agent集成测试
        await test_custom_crawler_tool_integration()

    except Exception as e:
        logger.error(f"测试失败: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    asyncio.run(main())
