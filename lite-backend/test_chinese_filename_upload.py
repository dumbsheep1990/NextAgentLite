#!/usr/bin/env python3
"""
测试中文文件名上传到MinIO
"""

import asyncio
import sys
sys.path.insert(0, '.')

from service.storage_service import storage_service

async def test_chinese_filename():
    """测试中文文件名上传"""
    
    # 测试数据
    test_cases = [
        {
            'filename': 'AI数字人直播系统功能与技术规格说明书.md',
            'content': '# AI数字人直播系统\n\n这是一个测试文档。\n',
            'metadata': {
                'author': '测试用户',
                'description': '系统说明文档',
                'tags': 'AI,数字人,直播'
            }
        },
        {
            'filename': 'test_english.txt',
            'content': 'This is a test file with English filename.\n',
            'metadata': {
                'author': 'Test User',
                'description': 'Test document',
                'tags': 'test,english'
            }
        },
        {
            'filename': '混合mixed文件名123.pdf',
            'content': b'%PDF-1.4 test content',
            'metadata': {
                'author': 'Mixed测试',
                'version': '1.0'
            }
        }
    ]
    
    print("="*60)
    print("MinIO 中文文件名上传测试")
    print("="*60)
    
    for i, test_case in enumerate(test_cases, 1):
        print(f"\n测试案例 {i}: {test_case['filename']}")
        print("-"*40)
        
        try:
            # 准备文件数据
            if isinstance(test_case['content'], str):
                file_data = test_case['content'].encode('utf-8')
            else:
                file_data = test_case['content']
            
            # 确定content type
            if test_case['filename'].endswith('.md'):
                content_type = 'text/markdown'
            elif test_case['filename'].endswith('.txt'):
                content_type = 'text/plain'
            elif test_case['filename'].endswith('.pdf'):
                content_type = 'application/pdf'
            else:
                content_type = 'application/octet-stream'
            
            # 上传文档
            object_name, file_url, file_size = await storage_service.upload_document(
                file_data=file_data,
                filename=test_case['filename'],
                content_type=content_type,
                metadata=test_case['metadata']
            )
            
            print(f"✓ 上传成功")
            print(f"  对象名: {object_name}")
            print(f"  URL: {file_url}")
            print(f"  大小: {file_size} bytes")
            
            # 判断存储类型
            if storage_service.config.enabled:
                storage_type = 'minio'
            else:
                storage_type = 'local'
            print(f"  存储类型: {storage_type}")
            
            # 尝试获取文件验证
            if storage_type == 'minio':
                bucket_name = storage_service.config.documents_bucket
                
                # 获取文件内容
                file_content = await storage_service.get_file(bucket_name, object_name)
                if file_content:
                    print(f"✓ 文件验证成功 (读取 {len(file_content)} bytes)")
                else:
                    print(f"✗ 文件验证失败")
            
        except Exception as e:
            print(f"✗ 上传失败: {e}")
            import traceback
            traceback.print_exc()
    
    print("\n" + "="*60)
    print("测试完成")
    print("="*60)

if __name__ == "__main__":
    asyncio.run(test_chinese_filename())