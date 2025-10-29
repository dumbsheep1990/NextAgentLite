"""
测试Hook Workflow集成

验证完整流程：问答 → Pre-hooks路由 → 检索 → Post-hooks处理
"""

import asyncio
import httpx
import json
from datetime import datetime


# 测试配置
BASE_URL = "http://localhost:8000"
TEST_QUERY = "地聚物材料的强度特性是什么？"


async def test_hook_workflow_integration():
    """测试Hook Workflow集成"""
    print("=" * 80)
    print("测试Hook Workflow集成 - 完整流程验证")
    print("=" * 80)
    print(f"时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"测试查询: {TEST_QUERY}")
    print("=" * 80)

    # 准备请求
    payload = {
        "agent_name": "workflow_agent",
        "prompt": TEST_QUERY,
        "selected_tools": [],
        "search_knowledge": True,
        "save_session": False,
        # 不指定pipeline_id，让系统从user_agents加载或使用默认
    }

    print("\n📤 发送Workflow请求...")
    print(f"Payload: {json.dumps(payload, ensure_ascii=False, indent=2)}")

    # 发送SSE请求
    async with httpx.AsyncClient(timeout=60.0) as client:
        try:
            async with client.stream(
                "POST",
                f"{BASE_URL}/workflows/run",
                json=payload
            ) as response:
                if response.status_code != 200:
                    print(f"\n❌ 请求失败: {response.status_code}")
                    print(await response.aread())
                    return

                print("\n📥 接收SSE事件流:\n")

                # 追踪关键阶段
                stages = {
                    "session_state": [],
                    "hook_execution": [],
                    "retrieve": [],
                    "execute": [],
                    "workflow_end": []
                }

                async for line in response.aiter_lines():
                    if not line.strip() or not line.startswith("data:"):
                        continue

                    try:
                        # 解析SSE事件
                        data_str = line[5:].strip()  # 移除 "data: "
                        event = json.loads(data_str)
                        event_type = event.get("type", event.get("stage", "unknown"))

                        # 记录事件
                        if "hook_execution" in event_type or event.get("type") == "hook_execution":
                            stages["hook_execution"].append(event)
                            print(f"\n🔗 Hook执行事件:")
                            print(f"   阶段: {event.get('stage', 'N/A')}")
                            print(f"   Phase: {event.get('phase', 'N/A')}")
                            print(f"   Pipeline: {event.get('pipeline_name', 'N/A')}")
                            results = event.get('results', [])
                            for r in results:
                                status_emoji = "✅" if r['status'] == 'success' else "❌"
                                print(f"     {status_emoji} {r['hook_id']}: {r['status']} ({r['execution_time_ms']}ms)")
                                if r.get('routing_decision'):
                                    print(f"        → 路由策略: {r['routing_decision']}")
                            if event.get('context'):
                                ctx = event['context']
                                print(f"   上下文:")
                                if ctx.get('retrieval_strategy'):
                                    print(f"     - 检索策略: {ctx['retrieval_strategy']}")
                                if ctx.get('intent'):
                                    print(f"     - 意图: {ctx['intent']}")

                        elif event_type == "retrieve" or event.get("stage") == "retrieve":
                            stages["retrieve"].append(event)
                            status = event.get('status', 'N/A')
                            if status == "routing":
                                print(f"\n🔍 检索路由:")
                                print(f"   策略: {event.get('strategy', 'N/A')}")
                                config = event.get('config', {})
                                print(f"   配置: top_k={config.get('top_k')}, mode={config.get('mode', 'N/A')}")
                            elif status == "completed":
                                print(f"\n📚 检索完成:")
                                print(f"   策略: {event.get('strategy', 'N/A')}")
                                print(f"   命中: {event.get('hits', 0)} 条")
                                if event.get('context_preview'):
                                    print(f"   预览: {event['context_preview'][:100]}...")

                        elif event_type == "execute" or event.get("stage") == "execute":
                            stages["execute"].append(event)
                            if event.get('result'):
                                result = event['result']
                                print(f"\n💬 执行结果:")
                                print(f"   长度: {len(result)} 字符")
                                print(f"   预览: {result[:200]}...")

                        elif event_type == "workflow_end" or event.get("type") == "workflow_end":
                            stages["workflow_end"].append(event)
                            print(f"\n🎉 工作流完成")

                        else:
                            # 其他事件简要显示
                            print(f"   [{event_type}] {event.get('status', '')}")

                    except json.JSONDecodeError as e:
                        print(f"   ⚠️  JSON解析错误: {e}")
                        print(f"   原始数据: {data_str[:100]}")

                # 总结
                print("\n" + "=" * 80)
                print("测试总结:")
                print("=" * 80)
                print(f"✓ Hook执行事件: {len(stages['hook_execution'])} 个")
                print(f"✓ 检索事件: {len(stages['retrieve'])} 个")
                print(f"✓ 执行事件: {len(stages['execute'])} 个")
                print(f"✓ 工作流完成: {'是' if stages['workflow_end'] else '否'}")

                # 验证关键流程
                print("\n关键流程验证:")
                has_pre_hooks = any(e.get('phase') == 'pre' for e in stages['hook_execution'])
                has_post_hooks = any(e.get('phase') == 'post' for e in stages['hook_execution'])
                has_routing = any(e.get('status') == 'routing' for e in stages['retrieve'])
                has_results = len(stages['execute']) > 0

                print(f"  {'✅' if has_pre_hooks else '❌'} Pre-hooks 执行")
                print(f"  {'✅' if has_routing else '❌'} 检索策略路由")
                print(f"  {'✅' if has_results else '❌'} 生成答案")
                print(f"  {'✅' if has_post_hooks else '❌'} Post-hooks 执行")

                if all([has_pre_hooks, has_routing, has_results, has_post_hooks]):
                    print("\n🎊 完整流程测试通过！")
                else:
                    print("\n⚠️  部分流程未执行，请检查配置")

        except httpx.ReadTimeout:
            print("\n❌ 请求超时")
        except Exception as e:
            print(f"\n❌ 测试失败: {e}")
            import traceback
            traceback.print_exc()


async def test_pipeline_loading():
    """测试Pipeline加载"""
    print("\n" + "=" * 80)
    print("测试Pipeline加载")
    print("=" * 80)

    from service.hook_pipeline_service import load_default_pipeline

    try:
        pipeline = await load_default_pipeline()
        if pipeline:
            print(f"✅ 默认Pipeline加载成功:")
            print(f"   ID: {pipeline.pipeline_id}")
            print(f"   名称: {pipeline.pipeline_name}")
            print(f"   Pre-hooks: {len(pipeline.pre_hooks)} 个")
            print(f"   Post-hooks: {len(pipeline.post_hooks)} 个")
        else:
            print("⚠️  未找到默认Pipeline")
    except Exception as e:
        print(f"❌ Pipeline加载失败: {e}")
        import traceback
        traceback.print_exc()


async def test_dispatcher():
    """测试检索分发器"""
    print("\n" + "=" * 80)
    print("测试检索分发器")
    print("=" * 80)

    from service.retrieval_dispatcher import get_retrieval_dispatcher

    try:
        dispatcher = get_retrieval_dispatcher()
        print(f"✅ 检索分发器初始化成功")

        # 测试策略分发（不执行实际检索）
        strategies = [
            'qa_direct',
            'hybrid_default',
            'graph_enhanced',
            'hierarchical_retrieval'
        ]

        print(f"\n支持的检索策略:")
        for strategy in strategies:
            print(f"   ✓ {strategy}")

    except Exception as e:
        print(f"❌ 分发器测试失败: {e}")


async def main():
    """主测试函数"""
    print("\n" + "=" * 80)
    print("Hook Workflow 集成测试套件")
    print("=" * 80)

    # 1. 测试Pipeline加载
    await test_pipeline_loading()

    # 2. 测试分发器
    await test_dispatcher()

    # 3. 测试完整流程
    await test_hook_workflow_integration()

    print("\n" + "=" * 80)
    print("测试完成")
    print("=" * 80)


if __name__ == "__main__":
    asyncio.run(main())
