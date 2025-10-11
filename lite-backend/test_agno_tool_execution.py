"""测试 Agno Agent 的工具调用和执行"""
import sys
sys.path.insert(0, '/Users/wxn/Desktop/NextAgentLite/lite-backend')

import asyncio
from agno.agent import Agent
from agno.models.openai import OpenAIChat
from service.baidu_search_tools import BaiduSearchTools

async def test_agno_tool_execution():
    """测试 Agno Agent 是否能正确执行工具"""
    print("\n" + "="*60)
    print("测试 Agno Agent 工具执行")
    print("="*60)

    # 创建模型
    model = OpenAIChat(
        id="Qwen/Qwen2.5-7B-Instruct",
        api_key="dummy",
        base_url="http://127.0.0.1:9050/v1",
        temperature=0.7,
    )

    # 创建工具
    baidu_tool = BaiduSearchTools()

    # 创建 Agent
    agent = Agent(
        name="test_agent",
        model=model,
        tools=[baidu_tool],
        instructions="你是一个测试助手。当用户要求搜索时，必须使用 baidu_search 工具。",
        markdown=True,
    )

    print(f"\nAgent 创建成功:")
    print(f"  - 名称: {agent.name}")
    print(f"  - 工具数量: {len(agent.tools) if hasattr(agent, 'tools') and agent.tools else 0}")
    print(f"  - 模型: {model.id}")

    # 检查 agent 的属性
    print(f"\nAgent 属性检查:")
    print(f"  - hasattr(agent, 'tools'): {hasattr(agent, 'tools')}")
    print(f"  - hasattr(agent, 'run_tools'): {hasattr(agent, 'run_tools')}")
    print(f"  - hasattr(agent, 'show_tool_calls'): {hasattr(agent, 'show_tool_calls')}")
    if hasattr(agent, 'show_tool_calls'):
        print(f"  - agent.show_tool_calls: {agent.show_tool_calls}")

    # 测试问题
    test_query = "请使用工具搜索一下2025年人工智能的最新发展"
    print(f"\n测试问题: {test_query}")
    print("\n开始调用 agent.run()...")
    print("="*60)

    try:
        # 使用 run 方法
        if hasattr(agent, 'arun'):
            response = await agent.arun(test_query)
        else:
            response = agent.run(test_query)

        print(f"\n响应类型: {type(response)}")
        print(f"响应属性: {dir(response)}")

        # 提取内容
        if hasattr(response, 'content'):
            content = response.content
        elif isinstance(response, str):
            content = response
        else:
            content = str(response)

        print(f"\n响应内容:")
        print("="*60)
        print(content)
        print("="*60)

        # 检查是否有工具调用
        if hasattr(response, 'messages'):
            print(f"\n消息数量: {len(response.messages)}")
            for i, msg in enumerate(response.messages):
                print(f"\n消息 {i+1}:")
                print(f"  - 类型: {type(msg)}")
                if hasattr(msg, 'role'):
                    print(f"  - Role: {msg.role}")
                if hasattr(msg, 'tool_calls'):
                    print(f"  - Tool calls: {msg.tool_calls}")

    except Exception as e:
        print(f"\n❌ 执行失败: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_agno_tool_execution())