#!/usr/bin/env python
"""
任务配置测试脚本
验证任务配置是否正确从环境变量加载
"""
import os
import sys

# 添加项目根目录到路径
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from core.task_config import task_config


def test_task_config():
    """测试任务配置"""
    print("=== 任务配置测试 ===\n")
    
    # 显示当前配置
    print("1. 当前配置值:")
    print(task_config)
    print()
    
    # 测试单个配置方法
    print("2. 配置方法测试:")
    
    vectorization_config = task_config.get_vectorization_config()
    print(f"向量化配置: {vectorization_config}")
    
    task_manager_config = task_config.get_task_manager_config()
    print(f"任务管理器配置: {task_manager_config}")
    
    qa_config = task_config.get_qa_dataset_config()
    print(f"QA数据集配置: {qa_config}")
    print()
    
    # 测试环境变量读取
    print("3. 环境变量状态:")
    env_vars = [
        "MAX_CONCURRENT_TASKS",
        "MAX_BATCH_DOCUMENT_SIZE", 
        "VECTORIZATION_BATCH_SIZE",
        "QA_DATASET_BATCH_SIZE",
        "VECTORIZATION_DELAY",
        "TASK_HEARTBEAT_INTERVAL",
        "TASK_LOCK_TIMEOUT",
        "MAX_TASK_RETRIES",
        "TASK_EXPIRES_HOURS"
    ]
    
    for var in env_vars:
        value = os.getenv(var)
        status = "已设置" if value else "使用默认值"
        print(f"  {var}: {value or '(默认)'} - {status}")
    print()
    
    # 测试配置重载
    print("4. 测试配置重载:")
    original_max_tasks = task_config.max_concurrent_tasks
    
    # 模拟环境变量变化
    os.environ["MAX_CONCURRENT_TASKS"] = "10"
    task_config.reload()
    
    new_max_tasks = task_config.max_concurrent_tasks
    print(f"  重载前: {original_max_tasks}")
    print(f"  重载后: {new_max_tasks}")
    
    # 恢复原始值
    os.environ["MAX_CONCURRENT_TASKS"] = str(original_max_tasks)
    task_config.reload()
    print(f"  恢复后: {task_config.max_concurrent_tasks}")
    print()
    
    print("=== 配置测试完成 ===")


def test_api_compatibility():
    """测试与现有API的兼容性"""
    print("=== API兼容性测试 ===\n")
    
    try:
        # 测试任务管理器配置
        from service.enhanced_task_manager import enhanced_task_manager
        print(f"增强任务管理器 - 最大并发任务: {enhanced_task_manager.max_concurrent_tasks}")
        
        # 测试持久化任务队列配置
        from service.persistent_task_queue import persistent_task_queue
        print(f"持久化任务队列 - 最大并发任务: {persistent_task_queue.max_concurrent_tasks}")
        print(f"持久化任务队列 - 心跳间隔: {persistent_task_queue.heartbeat_interval}s")
        print(f"持久化任务队列 - 锁超时: {persistent_task_queue.lock_timeout}s")
        
        print("\n✅ API兼容性测试通过")
        
    except Exception as e:
        print(f"\n❌ API兼容性测试失败: {e}")


def show_usage_examples():
    """显示使用示例"""
    print("\n=== 使用示例 ===\n")
    
    print("1. 在 .env 文件中设置配置:")
    print("""
# 任务并发和批处理配置
MAX_CONCURRENT_TASKS=5
MAX_BATCH_DOCUMENT_SIZE=3
VECTORIZATION_BATCH_SIZE=10
QA_DATASET_BATCH_SIZE=20
VECTORIZATION_DELAY=0.2
TASK_HEARTBEAT_INTERVAL=60
TASK_LOCK_TIMEOUT=600
MAX_TASK_RETRIES=5
TASK_EXPIRES_HOURS=48
""")
    
    print("2. 在代码中使用配置:")
    print("""
from core.task_config import task_config

# 直接访问配置值
batch_size = task_config.vectorization_batch_size
delay = task_config.vectorization_delay

# 使用配置方法
config = task_config.get_vectorization_config()
batch_size = config["batch_size"]
delay = config["delay"]

# 重新加载配置
task_config.reload()
""")
    
    print("3. 通过API查看配置:")
    print("GET /api/v1/config/task/formatted")
    print("POST /api/v1/config/task/reload")


if __name__ == "__main__":
    print("任务配置系统测试\n")
    
    test_task_config()
    test_api_compatibility()
    show_usage_examples()
    
    print("\n任务配置系统测试完成！") 