#!/usr/bin/env python3
"""
大文件QA数据集处理优化测试脚本
测试24000个QA对的处理性能和效果
"""

import asyncio
import time
import psutil
import os
from typing import Dict, Any

# 设置项目根路径
project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
import sys
sys.path.insert(0, project_root)

from core.large_file_config import large_file_config
from core.logger import logger


class LargeFilePerformanceTest:
    """大文件处理性能测试"""
    
    def __init__(self):
        self.test_results = {}
        self.memory_usage = []
        
    def test_batch_size_optimization(self):
        """测试批次大小优化"""
        logger.info("=" * 60)
        logger.info("测试批次大小优化")
        logger.info("=" * 60)
        
        test_cases = [
            500,     # 小文件
            5000,    # 中等文件
            15000,   # 大文件
            25000,   # 超大文件
            50000    # 极大文件
        ]
        
        for record_count in test_cases:
            category = large_file_config.get_file_size_category(record_count)
            db_batch_size = large_file_config.get_database_batch_size(record_count)
            vec_batch_size = large_file_config.get_vectorization_batch_size(record_count)
            
            logger.info(f"记录数: {record_count:6d} | 类别: {category:15s} | "
                       f"DB批次: {db_batch_size:4d} | 向量批次: {vec_batch_size:3d}")
            
            # 计算预估的批次数量和处理时间
            db_batches = (record_count + db_batch_size - 1) // db_batch_size
            vec_batches = (record_count + vec_batch_size - 1) // vec_batch_size
            
            # 预估处理时间（基于经验值）
            db_time_estimate = db_batches * 0.5  # 每个DB批次约0.5秒
            vec_time_estimate = vec_batches * 2.0  # 每个向量批次约2秒
            total_time_estimate = db_time_estimate + vec_time_estimate
            
            logger.info(f"  → DB批次数: {db_batches}, 预估时间: {db_time_estimate:.1f}s")
            logger.info(f"  → 向量批次数: {vec_batches}, 预估时间: {vec_time_estimate:.1f}s")
            logger.info(f"  → 总预估时间: {total_time_estimate:.1f}s ({total_time_estimate/60:.1f}分钟)")
            logger.info("-" * 60)
    
    def test_memory_efficiency(self):
        """测试内存效率"""
        logger.info("=" * 60)
        logger.info("测试内存使用效率")
        logger.info("=" * 60)
        
        # 模拟不同大小的数据处理
        test_sizes = [1000, 5000, 10000, 20000, 50000]
        
        for size in test_sizes:
            # 模拟创建数据对象的内存使用
            start_memory = psutil.Process().memory_info().rss / 1024 / 1024  # MB
            
            # 模拟数据对象创建
            mock_data = []
            for i in range(size):
                mock_qa_pair = {
                    "dataset_id": "test-dataset",
                    "category": f"类别{i % 10}",
                    "question": f"这是第{i}个问题" * 10,  # 增加数据大小
                    "answer": f"这是第{i}个答案" * 20,
                    "qa_metadata": {"row": i, "source": "test"}
                }
                mock_data.append(mock_qa_pair)
            
            end_memory = psutil.Process().memory_info().rss / 1024 / 1024  # MB
            memory_used = end_memory - start_memory
            
            # 计算每个记录的平均内存使用
            memory_per_record = memory_used / size if size > 0 else 0
            
            logger.info(f"数据量: {size:6d} | 内存使用: {memory_used:8.2f}MB | "
                       f"每记录: {memory_per_record:.4f}MB")
            
            # 清理内存
            del mock_data
            
        logger.info("-" * 60)
    
    def test_config_loading(self):
        """测试配置加载"""
        logger.info("=" * 60)
        logger.info("测试优化配置加载")
        logger.info("=" * 60)
        
        # 测试配置值
        test_record_count = 24000
        
        logger.info(f"测试记录数: {test_record_count}")
        logger.info(f"文件类别: {large_file_config.get_file_size_category(test_record_count)}")
        logger.info(f"数据库批次大小: {large_file_config.get_database_batch_size(test_record_count)}")
        logger.info(f"向量化批次大小: {large_file_config.get_vectorization_batch_size(test_record_count)}")
        logger.info(f"ES bulk大小: {large_file_config.get_es_bulk_size()}")
        logger.info(f"向量化延迟: {large_file_config.get_vectorization_delay()}s")
        logger.info(f"进度更新间隔: {large_file_config.get_progress_update_interval()}")
        logger.info(f"最大失败率: {large_file_config.get_max_failure_rate()}")
        logger.info(f"记录所有错误: {large_file_config.should_log_all_errors()}")
        logger.info(f"最大记录错误数: {large_file_config.get_max_logged_errors()}")
        
        logger.info("-" * 60)
    
    def calculate_processing_estimates(self):
        """计算24000个QA对的处理预估"""
        logger.info("=" * 60)
        logger.info("24000个QA对处理预估分析")
        logger.info("=" * 60)
        
        record_count = 24000
        
        # 获取批次配置
        db_batch_size = large_file_config.get_database_batch_size(record_count)
        vec_batch_size = large_file_config.get_vectorization_batch_size(record_count)
        delay_between_batches = large_file_config.get_vectorization_delay()
        
        # 计算批次数量
        db_batches = (record_count + db_batch_size - 1) // db_batch_size
        vec_batches = (record_count + vec_batch_size - 1) // vec_batch_size
        
        # 时间预估（基于实际经验）
        db_time_per_batch = 0.3  # 数据库批次处理时间
        vec_time_per_batch = 1.5  # 向量化批次处理时间
        
        db_total_time = db_batches * db_time_per_batch
        vec_total_time = vec_batches * (vec_time_per_batch + delay_between_batches)
        total_processing_time = db_total_time + vec_total_time
        
        logger.info(f"记录总数: {record_count:,}")
        logger.info(f"数据库批次大小: {db_batch_size}, 批次数: {db_batches}")
        logger.info(f"向量化批次大小: {vec_batch_size}, 批次数: {vec_batches}")
        logger.info("")
        logger.info("时间预估:")
        logger.info(f"  数据库插入: {db_total_time:.1f}秒 ({db_total_time/60:.1f}分钟)")
        logger.info(f"  向量化处理: {vec_total_time:.1f}秒 ({vec_total_time/60:.1f}分钟)")
        logger.info(f"  总处理时间: {total_processing_time:.1f}秒 ({total_processing_time/60:.1f}分钟)")
        logger.info("")
        
        # 内存预估
        estimated_memory_per_record = 0.002  # MB per record
        peak_memory_usage = db_batch_size * estimated_memory_per_record
        logger.info(f"预估峰值内存使用: {peak_memory_usage:.1f}MB")
        
        # 网络请求预估
        total_api_calls = vec_batches
        logger.info(f"预估API调用次数: {total_api_calls}")
        
        # 优化前后对比
        logger.info("")
        logger.info("优化前后对比:")
        
        # 优化前（假设使用固定小批次）
        old_db_batch = 1000
        old_vec_batch = 10
        old_delay = 0.5
        
        old_db_batches = (record_count + old_db_batch - 1) // old_db_batch
        old_vec_batches = (record_count + old_vec_batch - 1) // old_vec_batch
        old_total_time = (old_db_batches * db_time_per_batch + 
                         old_vec_batches * (vec_time_per_batch + old_delay))
        
        improvement = ((old_total_time - total_processing_time) / old_total_time) * 100
        
        logger.info(f"  优化前时间: {old_total_time:.1f}秒 ({old_total_time/60:.1f}分钟)")
        logger.info(f"  优化后时间: {total_processing_time:.1f}秒 ({total_processing_time/60:.1f}分钟)")
        logger.info(f"  性能提升: {improvement:.1f}%")
        
        logger.info("-" * 60)
    
    async def run_performance_test(self):
        """运行完整的性能测试"""
        logger.info("🚀 开始大文件QA数据集处理优化测试")
        logger.info("=" * 80)
        
        start_time = time.time()
        
        try:
            # 测试配置加载
            self.test_config_loading()
            
            # 测试批次大小优化
            self.test_batch_size_optimization()
            
            # 测试内存效率
            self.test_memory_efficiency()
            
            # 计算24000个QA对的处理预估
            self.calculate_processing_estimates()
            
            end_time = time.time()
            test_duration = end_time - start_time
            
            logger.info("=" * 80)
            logger.info(f"✅ 测试完成，耗时: {test_duration:.2f}秒")
            logger.info("=" * 80)
            
        except Exception as e:
            logger.error(f"❌ 测试失败: {e}")
            raise


def main():
    """主函数"""
    test = LargeFilePerformanceTest()
    asyncio.run(test.run_performance_test())


if __name__ == "__main__":
    main() 