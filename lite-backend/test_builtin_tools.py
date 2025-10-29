#!/usr/bin/env python3
"""
测试所有内置工具的可用性
运行: conda activate zzdsj-lite && python test_builtin_tools.py
"""
import asyncio
import sys
import os

# 添加项目路径
sys.path.insert(0, os.path.dirname(__file__))

from service.agent_service_v2 import AgentServiceV2

async def test_tools():
    """测试所有内置工具"""
    print("=" * 80)
    print("开始测试内置工具可用性")
    print("=" * 80)

    tools_to_test = [
        ('builtin:reasoning', '推理(思考)'),
        ('builtin:duckduckgo', 'DuckDuckGo搜索'),
        ('builtin:arxiv', 'arXiv学术搜索'),
        ('builtin:python', 'Python代码执行'),
        ('builtin:shell', 'Shell命令执行'),
        ('builtin:calculator', '计算器'),
        ('builtin:baidu', '百度搜索'),
        ('builtin:read_file', '读取文件'),
        ('builtin:write_file', '写入文件'),
    ]

    service = AgentServiceV2()
    results = []

    for tool_code, tool_name in tools_to_test:
        try:
            print(f"\n测试工具: {tool_name} ({tool_code})")

            # 尝试创建带有该工具的agent
            agent = await service.create_agent_v2(
                agent_name='test_builtin_tools',
                selected_tools=[tool_code],
                model_name='qwen-turbo',
                search_knowledge=False,
                search_graph=False
            )

            if agent:
                # 检查工具是否真的被加载
                tool_count = len(agent.tools) if hasattr(agent, 'tools') else 0
                if tool_count > 0:
                    print(f"  ✅ 成功加载 {tool_count} 个工具")
                    results.append((tool_code, tool_name, '✅ 可用', None))
                else:
                    print(f"  ⚠️  Agent创建成功但没有加载工具")
                    results.append((tool_code, tool_name, '⚠️  未加载', 'Agent创建成功但工具列表为空'))
            else:
                print(f"  ❌ Agent创建失败")
                results.append((tool_code, tool_name, '❌ 失败', 'Agent创建返回None'))

        except Exception as e:
            error_msg = str(e)[:100]
            print(f"  ❌ 失败: {error_msg}")
            results.append((tool_code, tool_name, '❌ 失败', error_msg))

    # 打印汇总报告
    print("\n" + "=" * 80)
    print("测试结果汇总")
    print("=" * 80)
    print(f"{'工具代码':<30} {'工具名称':<20} {'状态':<10} {'备注'}")
    print("-" * 80)

    success_count = 0
    for tool_code, tool_name, status, error in results:
        error_info = f" ({error})" if error else ""
        print(f"{tool_code:<30} {tool_name:<20} {status:<10}{error_info}")
        if status == '✅ 可用':
            success_count += 1

    print("-" * 80)
    print(f"总计: {len(results)} 个工具, 成功: {success_count}, 失败: {len(results) - success_count}")
    print("=" * 80)

    # 返回是否全部成功
    return success_count == len(results)

if __name__ == "__main__":
    try:
        all_passed = asyncio.run(test_tools())
        sys.exit(0 if all_passed else 1)
    except KeyboardInterrupt:
        print("\n测试被用户中断")
        sys.exit(1)
    except Exception as e:
        print(f"\n测试脚本执行失败: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
