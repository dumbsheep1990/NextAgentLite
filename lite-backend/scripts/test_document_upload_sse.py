#!/usr/bin/env python3
"""
测试文档上传和SSE进度推送完整流程
"""

import asyncio
import aiohttp
import json
import tempfile
import time
from pathlib import Path

class DocumentUploadSSETest:
    def __init__(self):
        self.base_url = "http://localhost:8000"
        self.session_id = f"test_session_{int(time.time())}"
        
    async def test_complete_flow(self):
        """测试完整的文档上传和SSE推送流程"""
        print(f"🚀 开始测试，会话ID: {self.session_id}")
        
        # 1. 建立SSE连接
        sse_task = asyncio.create_task(self.listen_sse())
        await asyncio.sleep(2)  # 等待SSE连接建立
        
        # 2. 上传测试文档
        upload_task = asyncio.create_task(self.upload_test_document())
        
        # 3. 等待任务完成
        try:
            await asyncio.wait_for(upload_task, timeout=60)
            print("✅ 文档上传任务完成")
        except asyncio.TimeoutError:
            print("⚠️ 文档上传任务超时")
        
        # 4. 继续监听SSE一段时间，等待后台任务处理
        print("📡 继续监听SSE，等待后台处理...")
        await asyncio.sleep(30)
        sse_task.cancel()
        
        print("🎉 测试完成")
    
    async def listen_sse(self):
        """监听SSE消息"""
        url = f"{self.base_url}/api/v1/sse/document-status/{self.session_id}"
        print(f"📡 开始监听SSE: {url}")
        
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(url) as resp:
                    if resp.status == 200:
                        print("✅ SSE连接建立成功")
                        async for line in resp.content:
                            line = line.decode('utf-8').strip()
                            if line.startswith('data: '):
                                try:
                                    data = json.loads(line[6:])
                                    await self.handle_sse_message(data)
                                except json.JSONDecodeError:
                                    print(f"❌ JSON解析失败: {line}")
                    else:
                        print(f"❌ SSE连接失败: HTTP {resp.status}")
        except asyncio.CancelledError:
            print("📡 SSE监听已停止")
        except Exception as e:
            print(f"❌ SSE监听异常: {e}")
    
    async def handle_sse_message(self, data):
        """处理SSE消息"""
        msg_type = data.get('type')
        
        if msg_type == 'connection_established':
            print(f"📡 连接已建立: {data.get('session_id')}")
            capabilities = data.get('capabilities', [])
            print(f"📡 支持功能: {', '.join(capabilities)}")
            
        elif msg_type == 'task_progress_update':
            progress_data = data.get('progress_data', {})
            progress = progress_data.get('progress', 0)
            stage = progress_data.get('stage', '')
            detail = progress_data.get('detail', '')
            document_id = progress_data.get('document_id', '')
            chunk_current = progress_data.get('chunk_current')
            chunk_total = progress_data.get('chunk_total')
            
            chunk_info = ""
            if chunk_current and chunk_total:
                chunk_info = f" [{chunk_current}/{chunk_total}]"
                
            print(f"📈 任务进度: {progress}% - {stage}{chunk_info}")
            print(f"   详情: {detail}")
            print(f"   文档: {document_id}")
            
        elif msg_type == 'task_completed':
            result_data = data.get('result_data', {})
            detail = result_data.get('detail', '')
            processing_time = result_data.get('processing_time', 0)
            document_id = result_data.get('document_id', '')
            
            print(f"✅ 任务完成: {detail}")
            print(f"   耗时: {processing_time:.1f}秒")
            print(f"   文档: {document_id}")
            
        elif msg_type == 'task_failed':
            error_data = data.get('error_data', {})
            detail = error_data.get('detail', '')
            error_message = error_data.get('error_message', '')
            document_id = error_data.get('document_id', '')
            
            print(f"❌ 任务失败: {detail}")
            print(f"   错误: {error_message}")
            print(f"   文档: {document_id}")
            
        elif msg_type == 'heartbeat':
            print("💓 心跳")
            
        else:
            print(f"📨 收到消息: {msg_type}")
    
    async def upload_test_document(self):
        """上传测试文档"""
        # 创建临时测试文件
        test_content = """
# 材料科学测试文档

## 摘要
本文档用于测试地聚合物文档处理系统的文档上传和向量化功能。

## 关键词
地聚合物, 矿物聚合物, 碱激发剂, 力学性能, 微观结构

## 正文
地聚合物是一种新型的无机胶凝材料，具有优良的力学性能和耐久性。
它们通常由铝硅酸盐材料在碱性激发剂作用下形成三维网络结构。

### 原材料
1. 粉煤灰：作为主要的铝硅酸盐来源
2. 矿渣：提供额外的硅铝比
3. 碱激发剂：通常使用氢氧化钠和硅酸钠溶液

### 制备工艺
1. 原材料混合：按配比将粉煤灰、矿渣等混合
2. 碱激发剂配制：配制适当浓度的激发剂溶液
3. 搅拌成型：将原材料与激发剂混合搅拌
4. 养护硬化：在适当温度下养护至硬化

### 性能特点
- 抗压强度：可达50-100 MPa
- 耐高温性：可耐受800-1000°C高温
- 耐酸碱性：在酸碱环境下稳定性好
- 收缩率低：相比普通混凝土收缩率更小

## 结论
地聚合物材料在建筑、耐火、环保等领域具有广阔的应用前景。
进一步的研究应关注配比优化和工程应用。
"""
        
        # 创建临时文件
        with tempfile.NamedTemporaryFile(mode='w', suffix='.md', delete=False, encoding='utf-8') as f:
            f.write(test_content)
            temp_file_path = f.name
        
        try:
            print(f"📄 创建测试文档: {temp_file_path}")
            print(f"📄 文档大小: {len(test_content)} 字符")
            
            # 上传文档
            data = aiohttp.FormData()
            data.add_field('file', 
                          open(temp_file_path, 'rb'),
                          filename='test_geopolymer.md',
                          content_type='text/markdown')
            data.add_field('session_id', self.session_id)
            data.add_field('tags', '["测试", "地聚合物", "材料科学"]')
            
            async with aiohttp.ClientSession() as session:
                url = f"{self.base_url}/api/v1/knowledge/documents/upload"
                print(f"🚀 开始上传到: {url}")
                
                async with session.post(url, data=data) as resp:
                    if resp.status == 200:
                        result = await resp.json()
                        print(f"✅ 文档上传成功")
                        # print(f"   完整响应: {result}")
                        documents = result.get('documents', [])
                        if documents:
                            doc = documents[0]
                            print(f"   文档ID: {doc.get('id', 'N/A')}")
                            print(f"   文件名: {doc.get('filename', 'N/A')}")
                            print(f"   状态: {doc.get('status', 'N/A')}")
                        else:
                            print(f"   响应中没有找到文档信息")
                    else:
                        text = await resp.text()
                        print(f"❌ 文档上传失败: HTTP {resp.status}")
                        print(f"   响应: {text}")
                        
        except Exception as e:
            print(f"❌ 上传过程异常: {e}")
        finally:
            # 清理临时文件
            try:
                Path(temp_file_path).unlink()
                print(f"🗑️ 清理临时文件: {temp_file_path}")
            except:
                pass

async def main():
    """主函数"""
    test = DocumentUploadSSETest()
    await test.test_complete_flow()

if __name__ == "__main__":
    print("🧪 文档上传SSE测试")
    print("=" * 50)
    asyncio.run(main()) 