"""测试Hook导入"""
import sys
import os

# 添加项目根目录到Python路径
sys.path.insert(0, os.path.dirname(__file__))

print("=" * 60)
print("测试Hook模块导入")
print("=" * 60)

try:
    print("\n1. 测试Pre-Hooks导入...")
    from service.hooks.pre_hooks import (
        PolicySensitiveWordCheckHook,
        PolicyMetadataExtractorHook,
        PolicyQueryNormalizationHook
    )
    print("✅ Pre-Hooks导入成功:")
    print(f"  - PolicySensitiveWordCheckHook: {PolicySensitiveWordCheckHook}")
    print(f"  - PolicyMetadataExtractorHook: {PolicyMetadataExtractorHook}")
    print(f"  - PolicyQueryNormalizationHook: {PolicyQueryNormalizationHook}")
except Exception as e:
    print(f"❌ Pre-Hooks导入失败: {e}")
    import traceback
    traceback.print_exc()

try:
    print("\n2. 测试Post-Hooks导入...")
    from service.hooks.post_hooks import PolicyCitationEnhancementHook
    print("✅ Post-Hooks导入成功:")
    print(f"  - PolicyCitationEnhancementHook: {PolicyCitationEnhancementHook}")
except Exception as e:
    print(f"❌ Post-Hooks导入失败: {e}")
    import traceback
    traceback.print_exc()

try:
    print("\n3. 测试Hook Registry...")
    from service.hooks import hook_registry

    pre_hooks = hook_registry.list_pre_hooks()
    post_hooks = hook_registry.list_post_hooks()

    print(f"✅ Hook Registry加载成功")
    print(f"\n已注册的Pre-Hooks ({len(pre_hooks)}):")
    for hook_id in pre_hooks:
        metadata = hook_registry.get_hook_metadata(hook_id)
        print(f"  - {hook_id}: {metadata.get('name', 'N/A')}")

    print(f"\n已注册的Post-Hooks ({len(post_hooks)}):")
    for hook_id in post_hooks:
        metadata = hook_registry.get_hook_metadata(hook_id)
        print(f"  - {hook_id}: {metadata.get('name', 'N/A')}")

except Exception as e:
    print(f"❌ Hook Registry测试失败: {e}")
    import traceback
    traceback.print_exc()

print("\n" + "=" * 60)
print("测试完成")
print("=" * 60)
