#!/usr/bin/env python3
"""
测试文档上传和SSE推送流程，使用正确的session_id
"""
import asyncio
import aiohttp
import json
from pathlib import Path

# 配置
API_BASE_URL = "http://localhost:8000/api/v1"
# 使用前端实际使用的session_id
SESSION_ID = "knowledge-session-1757554806490-t4vuimpc0"

async def connect_sse():
    """连接SSE并监听消息"""
    url = f"{API_BASE_URL}/sse/document-status/{SESSION_ID}"
    print(f"连接SSE: {url}")
    
    try:
        async with aiohttp.ClientSession() as session:
            async with session.get(url) as response:
                print(f"SSE连接成功: {response.status}")
                
                # 监听消息
                async for line in response.content:
                    data = line.decode('utf-8').strip()
                    if data.startswith('data: '):
                        message = data[6:]  # 去掉 "data: " 前缀
                        if message == '[DONE]':
                            print("收到结束信号")
                            break
                        try:
                            msg_data = json.loads(message)
                            print(f"收到SSE消息: {json.dumps(msg_data, indent=2, ensure_ascii=False)}")
                        except json.JSONDecodeError:
                            print(f"收到非JSON消息: {message}")
                    elif data:
                        print(f"收到其他数据: {data}")
                        
    except Exception as e:
        print(f"SSE连接错误: {e}")

async def upload_document():
    """上传文档，使用正确的session_id"""
    # 创建测试文件
    import time
    timestamp = int(time.time())
    test_file = Path(f"/tmp/test_document_{timestamp}.txt")
    test_file.write_text(f"这是一个测试文档 {timestamp}，用于验证SSE推送。\n包含正确的session_id。")
    
    url = f"{API_BASE_URL}/knowledge/documents/upload"
    
    # 准备表单数据
    form_data = aiohttp.FormData()
    form_data.add_field('file', 
                       test_file.read_bytes(),
                       filename=test_file.name,
                       content_type='text/plain')
    form_data.add_field('session_id', SESSION_ID)  # 使用正确的session_id
    form_data.add_field('tags', 'test,sse')
    
    print(f"上传文档到: {url}")
    print(f"使用session_id: {SESSION_ID}")
    
    async with aiohttp.ClientSession() as session:
        async with session.post(url, data=form_data) as response:
            result = await response.json()
            print(f"上传响应: {json.dumps(result, indent=2, ensure_ascii=False)}")
            
            if result.get('success'):
                document_id = result['documents'][0]['id']
                print(f"文档上传成功，ID: {document_id}")
                return document_id
            else:
                print(f"文档上传失败: {result.get('message')}")
                return None

async def main():
    """主函数"""
    print("=" * 60)
    print("文档上传和SSE测试（使用正确的session_id）")
    print("=" * 60)
    
    # 创建两个任务：一个监听SSE，一个上传文档
    sse_task = asyncio.create_task(connect_sse())
    
    # 等待SSE连接建立
    await asyncio.sleep(2)
    
    # 上传文档
    document_id = await upload_document()
    
    if document_id:
        print(f"\n等待处理完成（监听SSE消息）...")
        # 等待处理完成，最多等待60秒
        await asyncio.sleep(60)
    
    # 取消SSE监听任务
    sse_task.cancel()
    try:
        await sse_task
    except asyncio.CancelledError:
        print("SSE监听已停止")

if __name__ == "__main__":
    asyncio.run(main())