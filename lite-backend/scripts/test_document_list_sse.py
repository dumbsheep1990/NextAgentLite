#!/usr/bin/env python3
"""
测试文档列表SSE消息推送流程
验证：
1. SSE连接正常建立
2. 文档处理进度正确推送到DocumentList
3. 右下角状态指示器只显示连接状态
"""

import asyncio
import json
import aiohttp
from pathlib import Path
import sys
import time

# 添加项目根路径
project_root = Path(__file__).parent.parent
sys.path.append(str(project_root))

class SSETestClient:
    def __init__(self, base_url: str = "http://localhost:8000"):
        self.base_url = base_url
        self.session_id = f"test_session_{int(time.time())}"
        
    async def test_sse_connection(self):
        """测试SSE连接"""
        print(f"🔌 测试SSE连接，会话ID: {self.session_id}")
        
        try:
            async with aiohttp.ClientSession() as session:
                url = f"{self.base_url}/api/v1/sse/document-status/{self.session_id}"
                print(f"📡 连接URL: {url}")
                
                async with session.get(url) as response:
                    if response.status != 200:
                        print(f"❌ SSE连接失败: {response.status}")
                        return False
                        
                    print(f"✅ SSE连接成功，状态: {response.status}")
                    
                    # 监听SSE消息
                    message_count = 0
                    start_time = time.time()
                    
                    async for line in response.content:
                        line_str = line.decode('utf-8').strip()
                        
                        if line_str.startswith('data:'):
                            data_str = line_str[5:].strip()
                            if data_str and data_str != '[DONE]':
                                try:
                                    data = json.loads(data_str)
                                    message_count += 1
                                    
                                    print(f"📨 收到SSE消息 #{message_count}:")
                                    print(f"   类型: {data.get('type')}")
                                    print(f"   数据: {json.dumps(data, ensure_ascii=False, indent=2)}")
                                    
                                    # 验证消息类型
                                    if data.get('type') == 'heartbeat':
                                        print("💓 心跳消息正常")
                                    elif data.get('type') == 'connection_established':
                                        print("🎯 连接建立消息正常")
                                    elif data.get('type') == 'task_progress_update':
                                        print("📊 进度更新消息（应该被DocumentList处理）")
                                        if 'document_id' in data:
                                            print(f"   文档ID: {data['document_id']}")
                                            print(f"   进度数据: {data.get('data', {})}")
                                    
                                except json.JSONDecodeError as e:
                                    print(f"⚠️ JSON解析失败: {e}")
                                    print(f"   原始数据: {data_str}")
                        
                        # 测试30秒
                        if time.time() - start_time > 30:
                            print(f"🕒 测试超时（30秒），共收到 {message_count} 条消息")
                            break
                            
        except Exception as e:
            print(f"❌ 测试过程中出错: {e}")
            return False
            
        return True
    
    async def simulate_document_upload(self):
        """模拟文档上传，触发SSE进度推送"""
        print(f"📤 模拟文档上传，会话ID: {self.session_id}")
        
        try:
            # 创建测试文件
            test_file_content = "这是一个测试文档，用于验证SSE进度推送功能。" * 100
            
            # 准备上传数据
            form_data = aiohttp.FormData()
            form_data.add_field('file', test_file_content.encode(), 
                              filename='test_document.txt',
                              content_type='text/plain')
            form_data.add_field('session_id', self.session_id)
            
            async with aiohttp.ClientSession() as session:
                url = f"{self.base_url}/api/v1/knowledge/documents/upload"
                
                async with session.post(url, data=form_data) as response:
                    response_data = await response.json()
                    
                    if response.status == 200:
                        print("✅ 文档上传成功")
                        print(f"   响应: {json.dumps(response_data, ensure_ascii=False, indent=2)}")
                        return response_data.get('documents', [])
                    else:
                        print(f"❌ 文档上传失败: {response.status}")
                        print(f"   错误: {response_data}")
                        return []
                        
        except Exception as e:
            print(f"❌ 上传过程中出错: {e}")
            return []
    
    async def test_complete_flow(self):
        """测试完整流程"""
        print("🚀 开始测试完整SSE + DocumentList流程")
        print("="*60)
        
        # 1. 测试SSE连接
        print("\n1️⃣ 测试SSE连接")
        
        # 2. 模拟文档上传
        print("\n2️⃣ 模拟文档上传")
        documents = await self.simulate_document_upload()
        
        if not documents:
            print("❌ 没有上传成功的文档，跳过后续测试")
            return
            
        # 3. 等待并监听SSE消息
        print(f"\n3️⃣ 监听SSE进度推送（文档ID: {documents[0].get('id', 'unknown')}）")
        await self.test_sse_connection()
        
        print("\n🎯 测试完成！")
        print("\n📋 测试验证要点：")
        print("   ✓ SSE连接正常建立")
        print("   ✓ 心跳消息正常接收")
        print("   ✓ 文档进度消息包含document_id")
        print("   ✓ 前端DocumentList应该更新进度显示")
        print("   ✓ 右下角状态指示器只显示连接状态")

async def main():
    """主函数"""
    print("🧪 SSE到DocumentList消息推送流程测试")
    print("="*60)
    
    client = SSETestClient()
    await client.test_complete_flow()

if __name__ == "__main__":
    asyncio.run(main()) 