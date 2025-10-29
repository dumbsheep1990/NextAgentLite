"""
测试Hook配置修复

验证:
1. Tool bindings能否正确保存和读取
2. 是否还有重复的Hook显示
"""

import asyncio
import asyncpg

async def test_hook_configuration():
    """测试Hook配置"""
    # 连接数据库
    conn = await asyncpg.connect(
        host='localhost',
        port=5434,
        user='zzdsj_demo',
        password='zzdsj123!',
        database='zzdsj_demo'
    )

    try:
        print("=" * 60)
        print("测试1: 检查政策敏感词检测Hook的tool_bindings")
        print("=" * 60)

        # 查询政策敏感词检测Hook
        row = await conn.fetchrow("""
            SELECT hook_id, hook_name, is_system, tool_bindings
            FROM custom_hooks
            WHERE hook_id = 'policy_sensitive_word_check'
        """)

        if row:
            print(f"✅ Hook ID: {row['hook_id']}")
            print(f"✅ Hook Name: {row['hook_name']}")
            print(f"✅ Is System: {row['is_system']}")
            print(f"✅ Tool Bindings: {row['tool_bindings']}")

            if row['tool_bindings'] and len(row['tool_bindings']) > 0:
                print("✅ Tool bindings存在，前端应该能正常显示")
            else:
                print("⚠️  Tool bindings为空，前端不会显示任何配置")
        else:
            print("⚠️  未找到政策敏感词检测Hook配置")

        print("\n" + "=" * 60)
        print("测试2: 检查是否有重复的Hook")
        print("=" * 60)

        # 查询所有custom_hooks (包括系统Hook配置)
        all_hooks = await conn.fetch("""
            SELECT hook_id, hook_name, is_system
            FROM custom_hooks
            ORDER BY hook_id
        """)

        print(f"\n数据库中的所有Hooks (custom_hooks表, 共 {len(all_hooks)} 条):")
        for hook in all_hooks:
            system_flag = "🔧 系统配置" if hook['is_system'] else "👤 用户创建"
            print(f"  - {hook['hook_id']}: {hook['hook_name']} ({system_flag})")

        # 查询不包含系统Hook配置的记录
        custom_only = await conn.fetch("""
            SELECT hook_id, hook_name, is_system
            FROM custom_hooks
            WHERE is_system = false
            ORDER BY hook_id
        """)

        print(f"\n仅用户创建的Hooks (is_system=false, 共 {len(custom_only)} 条):")
        for hook in custom_only:
            print(f"  - {hook['hook_id']}: {hook['hook_name']}")

        print("\n" + "=" * 60)
        print("测试结果总结")
        print("=" * 60)
        print("\n前端修复说明:")
        print("1. handleConfigureHook() 现在会加载 hook.tool_bindings")
        print("2. getCustomHooks() 使用 include_system=false 参数")
        print("\n预期行为:")
        print("- 系统Hook从 /api/v1/hook-pipelines/available/hooks 获取")
        print("- 自定义Hook从 /api/v1/custom-hooks?include_system=false 获取")
        print("- 两个列表合并后不会有重复的政策敏感词检测Hook")
        print("- 点击配置按钮时，已保存的tool_bindings会正确显示")

    finally:
        await conn.close()

if __name__ == "__main__":
    asyncio.run(test_hook_configuration())
