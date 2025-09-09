#!/usr/bin/env python3
"""
One-API服务测试脚本
测试对话模型和向量模型的可用性
"""
import asyncio
import sys
import os
from pathlib import Path
import traceback
import time

# 添加项目根目录到Python路径
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

from service.llm_service import llm_service
from service.embedding_service import embedding_service
from core.logger import logger


async def test_one_api_chat_models():
    """测试One-API对话模型"""
    print("\n=== 测试One-API对话模型 ===")
    
    # 测试的模型列表
    models = [
        "one_api/qwen-plus-latest",
        "one_api/gpt-4o-mini", 
        "one_api/gemini-2.5-flash-preview-thinking"
    ]
    
    test_messages = [
        {"role": "user", "content": "你好，你是谁？"}
    ]
    
    results = {}
    
    for model_path in models:
        print(f"\n测试模型: {model_path}")
        try:
            start_time = time.time()
            
            # 创建模型实例
            model = llm_service.create_model(model_path)
            
            # 调用模型
            response = await model(test_messages, temperature=0.1, max_tokens=100)
            
            end_time = time.time()
            response_time = end_time - start_time
            
            print(f"✅ 模型响应成功")
            print(f"📝 响应内容: {response.content[:200]}...")
            print(f"⏱️  响应时间: {response_time:.2f}秒")
            
            results[model_path] = {
                "status": "success",
                "response": response.content,
                "response_time": response_time
            }
            
        except Exception as e:
            print(f"❌ 模型调用失败: {str(e)}")
            print(f"🔍 错误详情: {traceback.format_exc()}")
            results[model_path] = {
                "status": "failed",
                "error": str(e)
            }
    
    return results


async def test_one_api_embedding_model():
    """测试One-API向量模型"""
    print("\n=== 测试One-API向量模型 ===")
    
    model_path = "one_api_embedding/text-embedding-v4"
    test_texts = [
        "地聚物材料是一种新型的胶凝材料",
        "测试文本嵌入功能"
    ]
    
    print(f"测试模型: {model_path}")
    print(f"测试文本: {test_texts}")
    
    try:
        start_time = time.time()
        
        # 创建嵌入
        response = await embedding_service.create_embeddings(model_path, test_texts)
        
        end_time = time.time()
        response_time = end_time - start_time
        
        print(f"✅ 嵌入生成成功")
        print(f"📊 嵌入维度: {response.dimension}")
        print(f"📝 嵌入数量: {len(response.embeddings)}")
        print(f"⏱️  响应时间: {response_time:.2f}秒")
        print(f"🔢 Token使用量: {response.tokens_used}")
        
        # 验证嵌入向量
        for i, embedding in enumerate(response.embeddings):
            print(f"文本 {i+1} 向量前5位: {embedding[:5]}")
        
        return {
            "status": "success",
            "dimension": response.dimension,
            "count": len(response.embeddings),
            "response_time": response_time,
            "tokens_used": response.tokens_used
        }
        
    except Exception as e:
        print(f"❌ 嵌入生成失败: {str(e)}")
        print(f"🔍 错误详情: {traceback.format_exc()}")
        return {
            "status": "failed",
            "error": str(e)
        }


async def test_model_availability():
    """测试模型可用性"""
    print("\n=== 检查One-API模型可用性 ===")
    
    try:
        # 获取所有支持的模型
        chat_models = llm_service.get_supported_models()
        embedding_models = await embedding_service.get_supported_models()
        
        print("✅ 对话模型列表:")
        if "one_api" in chat_models:
            for model in chat_models["one_api"]:
                print(f"  - one_api/{model}")
        else:
            print("  ❌ 未找到One-API对话模型配置")
        
        print("\n✅ 嵌入模型列表:")
        if "one_api_embedding" in embedding_models:
            for model in embedding_models["one_api_embedding"]:
                print(f"  - one_api_embedding/{model}")
        else:
            print("  ❌ 未找到One-API嵌入模型配置")
            
    except Exception as e:
        print(f"❌ 获取模型列表失败: {str(e)}")


def print_test_summary(chat_results, embedding_result):
    """打印测试总结"""
    print("\n" + "="*60)
    print("🔍 One-API服务测试总结")
    print("="*60)
    
    print("\n📱 对话模型测试结果:")
    for model, result in chat_results.items():
        status_icon = "✅" if result["status"] == "success" else "❌"
        print(f"  {status_icon} {model}: {result['status']}")
        if result["status"] == "success":
            print(f"     响应时间: {result['response_time']:.2f}秒")
        else:
            print(f"     错误: {result['error']}")
    
    print(f"\n📊 向量模型测试结果:")
    status_icon = "✅" if embedding_result["status"] == "success" else "❌"
    print(f"  {status_icon} text-embedding-v4: {embedding_result['status']}")
    if embedding_result["status"] == "success":
        print(f"     维度: {embedding_result['dimension']}")
        print(f"     响应时间: {embedding_result['response_time']:.2f}秒")
    else:
        print(f"     错误: {embedding_result['error']}")
    
    # 计算成功率
    chat_success = sum(1 for r in chat_results.values() if r["status"] == "success")
    chat_total = len(chat_results)
    embedding_success = 1 if embedding_result["status"] == "success" else 0
    
    total_success = chat_success + embedding_success
    total_tests = chat_total + 1
    success_rate = (total_success / total_tests) * 100
    
    print(f"\n📈 总体成功率: {total_success}/{total_tests} ({success_rate:.1f}%)")
    
    if success_rate == 100:
        print("🎉 所有测试通过！One-API配置正确。")
    elif success_rate >= 50:
        print("⚠️  部分测试通过，请检查失败的模型配置。")
    else:
        print("❌ 大部分测试失败，请检查One-API服务配置。")


async def main():
    """主测试函数"""
    print("🚀 开始One-API服务测试")
    
    # 从配置中获取API信息
    try:
        from core.config_optimized import optimized_config_manager
        one_api_config = optimized_config_manager.settings.llm.providers.one_api
        if one_api_config:
            print(f"🔗 API端点: {one_api_config.base_url}")
            print(f"🔑 API Key: {one_api_config.api_key[:20]}...")
        else:
            print("⚠️  未找到One-API配置，请检查配置文件")
    except Exception as e:
        print(f"⚠️  获取配置失败: {e}")
        print(f"🔗 API端点: 从配置文件加载")
        print(f"🔑 API Key: 从配置文件加载")
    
    try:
        # 1. 检查模型可用性
        await test_model_availability()
        
        # 2. 测试对话模型
        chat_results = await test_one_api_chat_models()
        
        # 3. 测试向量模型
        embedding_result = await test_one_api_embedding_model()
        
        # 4. 打印测试总结
        print_test_summary(chat_results, embedding_result)
        
    except Exception as e:
        print(f"❌ 测试过程中发生错误: {str(e)}")
        print(f"🔍 错误详情: {traceback.format_exc()}")
    
    finally:
        # 清理资源
        try:
            await embedding_service.close()
        except:
            pass


if __name__ == "__main__":
    # 设置事件循环策略 (Windows兼容性)
    if sys.platform.startswith('win'):
        asyncio.set_event_loop_policy(asyncio.WindowsProactorEventLoopPolicy())
    
    asyncio.run(main()) 