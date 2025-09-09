#!/usr/bin/env python3
"""
调试配置加载情况
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from core.config_optimized import optimized_config_manager
from core.logger import logger

def debug_config():
    """调试配置信息"""
    print("🔍 配置调试信息...")
    
    # 检查dynaconf配置
    print(f"当前环境: {optimized_config_manager.dynaconf.current_env}")
    print(f"配置文件路径: {optimized_config_manager.dynaconf.settings_file}")
    
    # 检查重排序配置
    print("\n📊 重排序配置:")
    rerank_config = optimized_config_manager.get_rerank_config()
    print(f"重排序配置: {rerank_config}")
    
    # 检查dynaconf中的重排序配置
    dynaconf_rerank = optimized_config_manager.get_dynaconf_config("rerank")
    print(f"Dynaconf重排序配置: {dynaconf_rerank}")
    
    # 检查环境变量
    print("\n🌍 环境变量:")
    env_vars = ["ALIBABA_BAILIAN_RERANK_API_KEY", "ALIBABA_BAILIAN_RERANK_BASE_URL"]
    for var in env_vars:
        value = os.getenv(var)
        if value:
            print(f"{var}: {value}")
        else:
            print(f"{var}: 未设置")
    
    # 检查当前环境配置
    print(f"\n📝 当前环境配置 ({optimized_config_manager.dynaconf.current_env}):")
    current_env = optimized_config_manager.dynaconf.current_env
    env_config = getattr(optimized_config_manager.dynaconf, current_env, None)
    if env_config:
        print(f"环境配置对象: {env_config}")
        if hasattr(env_config, 'rerank'):
            print(f"环境中的重排序配置: {env_config.rerank}")
        else:
            print("环境中没有重排序配置")
    
    # 检查默认配置
    print(f"\n📋 默认配置:")
    default_config = getattr(optimized_config_manager.dynaconf, 'default', None)
    if default_config:
        print(f"默认配置对象: {default_config}")
        if hasattr(default_config, 'rerank'):
            print(f"默认配置中的重排序配置: {default_config.rerank}")
        else:
            print("默认配置中没有重排序配置")

if __name__ == "__main__":
    debug_config()