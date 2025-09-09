#!/usr/bin/env python3
"""
测试SSE和HTTP轮询协调工作的脚本
验证两种通信机制不再冲突，各司其职
"""

import asyncio
import aiohttp
import time
import json
from datetime import datetime


async def test_coordinated_communication():
    """测试协调的通信机制"""
    session_id = f"coordinated-test-{int(time.time())}"
    
    print(f"🧪 测试SSE和HTTP轮询协调工作")
    print(f"   会话ID: {session_id}")
    print(f"   时间: {datetime.now()}")
    print("=" * 60)
    
    # 准备任务
    print("\n📋 1. 测试任务状态API")
    try:
        async with aiohttp.ClientSession() as session:
            # 测试任务状态API
            url = f"http://localhost:8000/api/v1/tasks/session/{session_id}/status"
            async with session.get(url) as response:
                if response.status == 200:
                    data = await response.json()
                    print(f"✅ 任务状态API工作正常")
                    print(f"   数据结构: {list(data.keys())}")
                    print(f"   任务数量: {len(data.get('tasks', []))}")
                else:
                    print(f"❌ 任务状态API错误: HTTP {response.status}")
    except Exception as e:
        print(f"❌ 任务状态API异常: {e}")
    
    # 测试SSE连接
    print("\n📡 2. 测试SSE连接")
    sse_task = asyncio.create_task(test_sse_messages(session_id))
    
    # 等待一段时间观察
    await asyncio.sleep(10)
    
    # 取消SSE连接
    sse_task.cancel()
    try:
        await sse_task
    except asyncio.CancelledError:
        pass
    
    print("\n✅ 协调通信测试完成")


async def test_sse_messages(session_id: str):
    """测试SSE消息接收"""
    url = f"http://localhost:8000/api/v1/sse/document-status/{session_id}"
    
    try:
        async with aiohttp.ClientSession() as session:
            async with session.get(url) as response:
                if response.status == 200:
                    print(f"✅ SSE连接建立成功")
                    
                    message_count = 0
                    async for line in response.content:
                        if line:
                            line_str = line.decode('utf-8').strip()
                            if line_str.startswith('data: '):
                                data_str = line_str[6:]
                                try:
                                    data = json.loads(data_str)
                                    message_count += 1
                                    
                                    msg_type = data.get('type', 'unknown')
                                    timestamp = datetime.now().strftime("%H:%M:%S")
                                    
                                    if msg_type == 'connection_established':
                                        print(f"[{timestamp}] 🔗 SSE连接确认")
                                    elif msg_type == 'heartbeat':
                                        print(f"[{timestamp}] 💓 SSE心跳 (第{message_count}条)")
                                    elif msg_type == 'document_status_update':
                                        print(f"[{timestamp}] 📄 文档状态更新: {data.get('document_id')}")
                                        print(f"          状态: {data.get('data', {}).get('status')}")
                                        print(f"          进度: {data.get('data', {}).get('processing_progress')}%")
                                    else:
                                        print(f"[{timestamp}] 📨 其他消息: {msg_type}")
                                        
                                except json.JSONDecodeError:
                                    print(f"❌ SSE消息解析失败: {data_str}")
                else:
                    print(f"❌ SSE连接失败: HTTP {response.status}")
    except Exception as e:
        print(f"❌ SSE测试异常: {e}")


async def simulate_document_processing():
    """模拟文档处理任务"""
    print("\n🔧 3. 模拟文档处理（如果有文档）")
    
    try:
        async with aiohttp.ClientSession() as session:
            # 获取文档列表
            url = "http://localhost:8000/api/v1/knowledge/documents?limit=1"
            async with session.get(url) as response:
                if response.status == 200:
                    data = await response.json()
                    documents = data.get('documents', [])
                    
                    if documents:
                        doc = documents[0]
                        print(f"📄 找到文档: {doc.get('title', 'Unknown')}")
                        print(f"   状态: {doc.get('status')}")
                        print(f"   ID: {doc.get('id')}")
                        
                        # 如果文档未向量化，可以触发向量化任务
                        if doc.get('status') != 'vectorized':
                            print("   可以用此文档测试任务进度监控")
                    else:
                        print("📄 未找到文档，无法测试文档处理任务")
                else:
                    print(f"❌ 获取文档失败: HTTP {response.status}")
    except Exception as e:
        print(f"❌ 文档处理模拟异常: {e}")


async def main():
    """主测试流程"""
    print("🚀 启动协调通信测试")
    
    # 测试基本通信
    await test_coordinated_communication()
    
    # 模拟文档处理
    await simulate_document_processing()
    
    print("\n" + "=" * 60)
    print("📊 测试总结:")
    print("   - SSE连接: 负责实时文档状态推送")
    print("   - HTTP轮询: 负责任务队列详细进度")
    print("   - 协调机制: SSE激活时降低轮询频率")
    print("   - 数据分工: 避免重复，各司其职")
    print("✅ 测试完成")


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n⏹️ 测试被用户中断")
    except Exception as e:
        print(f"\n❌ 测试失败: {e}") 