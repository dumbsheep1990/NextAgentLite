#!/usr/bin/env python3
"""
简化的One-API服务测试脚本
直接测试One-API的对话模型和向量模型
"""
import asyncio
import httpx
import json
import time
import traceback


# One-API配置
ONE_API_KEY = "sk-wboEKdPyTgltngVIDCaVU6mHuEvmGik7keR03Fws1yE3HR9m"
ONE_API_BASE_URL = os.getenv("LLM_GATEWAY_URL", "http://127.0.0.1:9050")


async def test_chat_model(model_name: str):
    """测试对话模型"""
    print(f"\n🧪 测试对话模型: {model_name}")
    
    headers = {
        "Authorization": f"Bearer {ONE_API_KEY}",
        "Content-Type": "application/json",
    }
    
    data = {
        "model": model_name,
        "messages": [
            {"role": "user", "content": "你好，你是谁？请简单介绍一下自己。"}
        ],
        "temperature": 0.1,
        "max_tokens": 100
    }
    
    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            start_time = time.time()
            
            response = await client.post(
                f"{ONE_API_BASE_URL}/chat/completions",
                headers=headers,
                json=data
            )
            
            end_time = time.time()
            response_time = end_time - start_time
            
            if response.status_code == 200:
                result = response.json()
                content = result["choices"][0]["message"]["content"]
                
                print(f"✅ 模型响应成功")
                print(f"📝 响应内容: {content[:150]}...")
                print(f"⏱️  响应时间: {response_time:.2f}秒")
                
                return {"status": "success", "content": content, "response_time": response_time}
            else:
                print(f"❌ HTTP错误: {response.status_code}")
                print(f"📄 响应内容: {response.text}")
                return {"status": "failed", "error": f"HTTP {response.status_code}: {response.text}"}
                
    except Exception as e:
        print(f"❌ 模型调用失败: {str(e)}")
        print(f"🔍 错误详情: {traceback.format_exc()}")
        return {"status": "failed", "error": str(e)}


async def test_embedding_model():
    """测试向量模型"""
    print(f"\n🧪 测试向量模型: text-embedding-v4")
    
    headers = {
        "Authorization": f"Bearer {ONE_API_KEY}",
        "Content-Type": "application/json",
    }
    
    data = {
        "input": "地聚物材料是一种新型的胶凝材料",
        "model": "text-embedding-v4"
    }
    
    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            start_time = time.time()
            
            response = await client.post(
                f"{ONE_API_BASE_URL}/embeddings",
                headers=headers,
                json=data
            )
            
            end_time = time.time()
            response_time = end_time - start_time
            
            if response.status_code == 200:
                result = response.json()
                
                # 处理不同的响应格式
                if "data" in result and isinstance(result["data"], list):
                    embedding = result["data"][0]["embedding"]
                elif "embedding" in result:
                    embedding = result["embedding"]
                else:
                    print(f"❌ 未知的响应格式: {result}")
                    return {"status": "failed", "error": "未知的响应格式"}
                
                dimension = len(embedding)
                tokens_used = result.get("usage", {}).get("total_tokens", 0)
                
                print(f"✅ 嵌入生成成功")
                print(f"📊 嵌入维度: {dimension}")
                print(f"⏱️  响应时间: {response_time:.2f}秒")
                print(f"🔢 Token使用量: {tokens_used}")
                print(f"📈 向量前5位: {embedding[:5]}")
                
                return {
                    "status": "success", 
                    "dimension": dimension, 
                    "response_time": response_time,
                    "tokens_used": tokens_used
                }
            else:
                print(f"❌ HTTP错误: {response.status_code}")
                print(f"📄 响应内容: {response.text}")
                return {"status": "failed", "error": f"HTTP {response.status_code}: {response.text}"}
                
    except Exception as e:
        print(f"❌ 嵌入生成失败: {str(e)}")
        print(f"🔍 错误详情: {traceback.format_exc()}")
        return {"status": "failed", "error": str(e)}


async def test_api_connectivity():
    """测试API连通性"""
    print(f"\n🔗 测试API连通性")
    
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            # 简单的HEAD请求测试连通性
            response = await client.get(
                f"{ONE_API_BASE_URL.replace('/v1', '')}/health",
                timeout=5.0
            )
            print(f"✅ API服务可访问")
            return True
    except Exception as e:
        print(f"⚠️  无法直接访问health端点，这是正常的")
        # 尝试一个简单的模型请求来测试连通性
        try:
            headers = {"Authorization": f"Bearer {ONE_API_KEY}"}
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(
                    f"{ONE_API_BASE_URL}/models",
                    headers=headers
                )
                print(f"✅ API服务连通正常")
                return True
        except Exception as e2:
            print(f"⚠️  API连通性测试失败: {e2}")
            return False


def print_test_summary(chat_results, embedding_result):
    """打印测试总结"""
    print("\n" + "="*60)
    print("🔍 One-API服务测试总结")
    print("="*60)
    
    print(f"\n📋 配置信息:")
    print(f"🔗 API端点: {ONE_API_BASE_URL}")
    print(f"🔑 API Key: {ONE_API_KEY[:20]}...")
    
    print(f"\n📱 对话模型测试结果:")
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
        print(f"     Token使用: {embedding_result['tokens_used']}")
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
    print("🚀 开始One-API简化测试")
    print(f"🔗 API端点: {ONE_API_BASE_URL}")
    print(f"🔑 API Key: {ONE_API_KEY[:20]}...")
    
    try:
        # 1. 测试API连通性
        await test_api_connectivity()
        
        # 2. 测试对话模型
        chat_models = [
            "qwen-plus-latest",
            "gpt-4o-mini", 
            "gemini-2.5-flash-preview-thinking"
        ]
        
        print(f"\n=== 测试对话模型 ===")
        chat_results = {}
        for model in chat_models:
            result = await test_chat_model(model)
            chat_results[model] = result
        
        # 3. 测试向量模型
        print(f"\n=== 测试向量模型 ===")
        embedding_result = await test_embedding_model()
        
        # 4. 打印测试总结
        print_test_summary(chat_results, embedding_result)
        
    except Exception as e:
        print(f"❌ 测试过程中发生错误: {str(e)}")
        print(f"🔍 错误详情: {traceback.format_exc()}")


if __name__ == "__main__":
    asyncio.run(main()) 