"""测试通用问答智能体的指令生成"""
import asyncio
import sys
sys.path.insert(0, '/Users/wxn/Desktop/NextAgentLite/lite-backend')

from service.agent_service_v2 import get_agent_service_v2

async def test_qa_agent_with_search_tool():
    """测试带搜索工具的通用问答智能体"""
    print("\n" + "="*60)
    print("测试通用问答智能体 + 百度搜索工具")
    print("="*60)

    service = await get_agent_service_v2()

    # 创建带百度搜索工具的qa_expert智能体
    agent = await service.create_agent_v2(
        agent_name="qa_expert",
        selected_tools=["builtin:baidusearch"],
        model_name="Qwen/Qwen2.5-7B-Instruct",
        model_provider="siliconflow",
        search_knowledge=False,
        search_graph=False,
    )

    if agent:
        print(f"\n✅ Agent创建成功: {agent.name}")
        print(f"   工具数量: {len(agent.tools)}")
        for tool in agent.tools:
            tool_name = getattr(tool, 'name', str(tool))
            print(f"   - {tool_name}")

        print("\n" + "="*60)
        print("生成的指令内容:")
        print("="*60)
        print(agent.instructions)
        print("="*60)

        # 测试问题
        test_query = "调用工具检索一下最新的LLM新闻"
        print(f"\n测试问题: {test_query}")
        print("\n开始调用...")

        try:
            response = agent.run(test_query, stream=False)
            print("\n" + "="*60)
            print("模型响应:")
            print("="*60)
            print(response.content)
            print("="*60)
        except Exception as e:
            print(f"\n❌ 调用失败: {e}")
    else:
        print("❌ Agent创建失败")

if __name__ == "__main__":
    asyncio.run(test_qa_agent_with_search_tool())