"""
任务配置管理模块
从环境变量读取任务并发和批处理相关配置
"""
import os
from typing import Optional


class TaskConfig:
    """任务配置管理类"""
    
    def __init__(self):
        self._load_config()
    
    def _load_config(self):
        """从环境变量加载配置"""
        # 并发控制配置
        self.max_concurrent_tasks = int(os.getenv("MAX_CONCURRENT_TASKS", "3"))
        self.max_batch_document_size = int(os.getenv("MAX_BATCH_DOCUMENT_SIZE", "5"))
        
        # 批处理大小配置 - 确保不超过API限制
        env_batch_size = int(os.getenv("VECTORIZATION_BATCH_SIZE", "10"))
        api_max_batch_size = 10  # API最大批次限制
        self.vectorization_batch_size = min(env_batch_size, api_max_batch_size)
        self.qa_dataset_batch_size = int(os.getenv("QA_DATASET_BATCH_SIZE", "50"))
        
        # 延迟和超时配置
        self.vectorization_delay = float(os.getenv("VECTORIZATION_DELAY", "0.05"))
        self.task_heartbeat_interval = int(os.getenv("TASK_HEARTBEAT_INTERVAL", "30"))
        self.task_lock_timeout = int(os.getenv("TASK_LOCK_TIMEOUT", "300"))
        
        # 重试和过期配置
        self.max_task_retries = int(os.getenv("MAX_TASK_RETRIES", "3"))
        self.task_expires_hours = int(os.getenv("TASK_EXPIRES_HOURS", "24"))
    
    def get_vectorization_config(self) -> dict:
        """获取向量化相关配置"""
        return {
            "batch_size": self.vectorization_batch_size,
            "delay": self.vectorization_delay,
            "max_retries": self.max_task_retries
        }
    
    def get_task_manager_config(self) -> dict:
        """获取任务管理器配置"""
        return {
            "max_concurrent_tasks": self.max_concurrent_tasks,
            "max_batch_size": self.max_batch_document_size,
            "heartbeat_interval": self.task_heartbeat_interval,
            "lock_timeout": self.task_lock_timeout,
            "expires_hours": self.task_expires_hours
        }
    
    def get_qa_dataset_config(self) -> dict:
        """获取QA数据集处理配置"""
        return {
            "batch_size": self.qa_dataset_batch_size,
            "max_retries": self.max_task_retries
        }
    
    def reload(self):
        """重新加载配置"""
        self._load_config()
    
    def __str__(self) -> str:
        """返回配置信息字符串"""
        return f"""TaskConfig:
  并发配置:
    - 最大并发任务: {self.max_concurrent_tasks}
    - 批量文档处理大小: {self.max_batch_document_size}
  
  批处理配置:
    - 向量化批次大小: {self.vectorization_batch_size}
    - QA数据集批次大小: {self.qa_dataset_batch_size}
  
  延迟配置:
    - 向量化延迟: {self.vectorization_delay}s
    - 心跳间隔: {self.task_heartbeat_interval}s
    - 锁超时: {self.task_lock_timeout}s
  
  重试配置:
    - 最大重试次数: {self.max_task_retries}
    - 任务过期时间: {self.task_expires_hours}h"""


# 全局配置实例
task_config = TaskConfig() 