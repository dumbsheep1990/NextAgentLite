#!/usr/bin/env python3
"""
SSE连接稳定性测试脚本
用于验证SSE连接是否频繁断开重连
"""

import asyncio
import aiohttp
import time
import json
from datetime import datetime


async def test_sse_connection():
    """测试SSE连接的稳定性"""
    session_id = f"test-session-{int(time.time())}"
    url = f"http://localhost:8000/api/v1/sse/document-status/{session_id}"
    
    print(f"🧪 开始测试SSE连接稳定性")
    print(f"   URL: {url}")
    print(f"   时间: {datetime.now()}")
    print("-" * 50)
    
    connection_count = 0
    message_count = 0
    start_time = time.time()
    
    try:
        async with aiohttp.ClientSession() as session:
            async with session.get(url) as response:
                if response.status != 200:
                    print(f"❌ 连接失败: HTTP {response.status}")
                    return
                
                print(f"✅ SSE连接已建立")
                connection_count += 1
                
                async for line in response.content:
                    if line:
                        line_str = line.decode('utf-8').strip()
                        if line_str.startswith('data: '):
                            data_str = line_str[6:]  # 移除 'data: ' 前缀
                            try:
                                data = json.loads(data_str)
                                message_count += 1
                                
                                current_time = datetime.now().strftime("%H:%M:%S")
                                msg_type = data.get('type', 'unknown')
                                
                                if msg_type == 'connection_established':
                                    print(f"[{current_time}] 🔗 连接确认: {data.get('session_id')}")
                                elif msg_type == 'heartbeat':
                                    print(f"[{current_time}] 💓 心跳包 (第{message_count}条消息)")
                                else:
                                    print(f"[{current_time}] 📨 消息 ({msg_type}): {data}")
                                
                                # 测试5分钟
                                if time.time() - start_time > 300:
                                    print(f"\n⏰ 测试时间结束 (5分钟)")
                                    break
                                    
                            except json.JSONDecodeError as e:
                                print(f"❌ JSON解析错误: {e}, 原始数据: {data_str}")
                                
    except asyncio.TimeoutError:
        print(f"⏱️ 连接超时")
    except aiohttp.ClientError as e:
        print(f"❌ 连接错误: {e}")
    except Exception as e:
        print(f"❌ 未知错误: {e}")
    
    end_time = time.time()
    duration = end_time - start_time
    
    print("\n" + "=" * 50)
    print(f"📊 测试统计:")
    print(f"   连接次数: {connection_count}")
    print(f"   消息总数: {message_count}")
    print(f"   测试时长: {duration:.1f}秒")
    if duration > 0:
        print(f"   消息频率: {message_count/duration:.2f}条/秒")
    print(f"   结束时间: {datetime.now()}")


async def test_concurrent_connections():
    """测试并发连接是否会导致问题"""
    print("\n🔄 测试并发连接...")
    
    tasks = []
    for i in range(3):
        session_id = f"concurrent-test-{i}-{int(time.time())}"
        url = f"http://localhost:8000/api/v1/sse/document-status/{session_id}"
        
        async def test_single_connection(test_url, test_id):
            try:
                async with aiohttp.ClientSession() as session:
                    async with session.get(test_url) as response:
                        if response.status == 200:
                            print(f"✅ 并发连接 {test_id} 成功")
                            # 只读取前几条消息
                            count = 0
                            async for line in response.content:
                                if count >= 3:
                                    break
                                count += 1
                        else:
                            print(f"❌ 并发连接 {test_id} 失败: HTTP {response.status}")
            except Exception as e:
                print(f"❌ 并发连接 {test_id} 异常: {e}")
        
        tasks.append(test_single_connection(url, i))
    
    await asyncio.gather(*tasks)
    print("🔄 并发连接测试完成")


if __name__ == "__main__":
    print("🚀 启动SSE稳定性测试")
    
    try:
        asyncio.run(test_sse_connection())
        asyncio.run(test_concurrent_connections())
    except KeyboardInterrupt:
        print("\n⏹️ 测试被用户中断")
    except Exception as e:
        print(f"\n❌ 测试失败: {e}")
    
    print("\n✅ 测试结束") 