#!/usr/bin/env python3
"""
简单的SSE推送测试 - 验证推送机制是否工作
"""

import asyncio
import time

async def test_simple_sse_push():
    """测试简单的SSE推送"""
    try:
        # 导入必要的模块
        from api.routes import unified_sse_manager
        
        session_id = f"test_session_{int(time.time())}"
        
        print(f"🧪 开始SSE推送测试")
        print(f"📡 会话ID: {session_id}")
        
        # 测试推送任务进度
        progress_data = {
            "progress": 50,
            "stage": "测试阶段",
            "detail": "这是一个测试推送",
            "status": "processing",
            "document_id": "test_doc_123",
            "task_type": "test_task",
            "created_at": "2025-01-01T00:00:00Z",
            "chunk_current": 5,
            "chunk_total": 10
        }
        
        print(f"📡 准备推送测试数据: {progress_data}")
        
        await unified_sse_manager.broadcast_task_progress(
            session_id=session_id,
            task_id="test_task_123",
            progress_data=progress_data
        )
        
        print(f"✅ SSE推送测试完成")
        
        # 测试任务完成推送
        result_data = {
            "detail": "测试任务完成",
            "processing_time": 1.5,
            "result": {"test": "success"},
            "document_id": "test_doc_123",
            "task_type": "test_task"
        }
        
        await unified_sse_manager.broadcast_task_completed(
            session_id=session_id,
            task_id="test_task_123",
            result_data=result_data
        )
        
        print(f"✅ 任务完成推送测试完成")
        
    except Exception as e:
        print(f"❌ SSE推送测试失败: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    print("🧪 简单SSE推送测试")
    print("=" * 40)
    asyncio.run(test_simple_sse_push()) 