#!/usr/bin/env python3
"""
测试嵌入配置
"""

import sys
import os

# 添加项目路径
sys.path.insert(0, os.path.dirname(__file__))

from core.config_optimized import optimized_config_manager

def test_embedding_config():
    """测试嵌入配置"""
    
    print("🧪 测试嵌入模型配置")
    print("=" * 40)
    
    try:
        # 测试配置管理器
        print("📋 环境变量中的DEFAULT_EMBEDDING_MODEL:")
        default_embedding = os.getenv('DEFAULT_EMBEDDING_MODEL')
        print(f"   {default_embedding}")
        
        print("\n📋 get_embedding_models_config 返回:")
        embedding_config = optimized_config_manager.get_embedding_models_config()
        print(f"   default_model: {embedding_config.get('default_model')}")
        print(f"   all_models: {embedding_config.get('all_models')}")
        print(f"   by_vendor: {embedding_config.get('by_vendor')}")
        
        print("\n📋 settings中的相关配置:")
        print(f"   default_embedding_model: {optimized_config_manager.settings.default_embedding_model}")
        print(f"   embedding_models: {optimized_config_manager.settings.embedding_models}")
        print(f"   alibaba_embedding_models: {optimized_config_manager.settings.alibaba_embedding_models}")
        
        print("\n🎉 嵌入配置测试完成！")
            
    except Exception as e:
        print(f"❌ 测试失败: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_embedding_config()