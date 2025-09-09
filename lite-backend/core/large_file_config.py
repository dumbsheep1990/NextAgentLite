"""
大文件QA数据集处理优化配置管理器
"""
import os
import yaml
from typing import Dict, Any
from core.logger import logger


class LargeFileOptimizationConfig:
    """大文件处理优化配置"""
    
    def __init__(self):
        self.config = self._load_config()
    
    def _load_config(self) -> Dict[str, Any]:
        """加载优化配置"""
        try:
            config_path = os.path.join(
                os.path.dirname(os.path.dirname(__file__)), 
                "config", 
                "large_file_optimization.yaml"
            )
            
            if os.path.exists(config_path):
                with open(config_path, 'r', encoding='utf-8') as f:
                    raw_config = yaml.safe_load(f)
                
                # 转换配置格式以匹配代码期望的结构
                if "large_file_optimization" in raw_config:
                    config_data = raw_config["large_file_optimization"]
                    config = {
                        "database": {
                            "batch_sizes": config_data.get("database_batch_sizes", {})
                        },
                        "vectorization": {
                            "batch_sizes": config_data.get("vectorization_batch_sizes", {}),
                            "delay_between_batches": config_data.get("vectorization_delays", {}).get("medium_files", 0.5)
                        },
                        "elasticsearch": {
                            "bulk_size": config_data.get("elasticsearch_bulk_size", 200)
                        },
                        "file_size_thresholds": config_data.get("thresholds", {})
                    }
                else:
                    # 如果是旧格式，直接使用
                    config = raw_config
                
                logger.info("大文件优化配置加载成功")
                return config
            else:
                logger.warning(f"优化配置文件不存在: {config_path}，使用默认配置")
                return self._get_default_config()
                
        except Exception as e:
            logger.error(f"加载优化配置失败: {e}，使用默认配置")
            return self._get_default_config()
    
    def _get_default_config(self) -> Dict[str, Any]:
        """获取默认配置"""
        return {
            "database": {
                "batch_sizes": {
                    "small_files": 1000,
                    "medium_files": 500,
                    "large_files": 300,
                    "very_large_files": 200
                }
            },
            "vectorization": {
                "batch_sizes": {
                    "small_files": 20,
                    "medium_files": 30,
                    "large_files": 50,
                    "very_large_files": 100
                },
                "delay_between_batches": 0.3
            },
            "elasticsearch": {
                "bulk_size": 200
            },
            "file_size_thresholds": {
                "small": 1000,
                "medium": 10000,
                "large": 20000,
                "very_large": 50000
            }
        }
    
    def get_file_size_category(self, record_count: int) -> str:
        """根据记录数量判断文件大小类别"""
        thresholds = self.config["file_size_thresholds"]
        
        if record_count < thresholds["small"]:
            return "small_files"
        elif record_count < thresholds["medium"]:
            return "medium_files"
        elif record_count < thresholds["large"]:
            return "large_files"
        else:
            return "very_large_files"
    
    def get_database_batch_size(self, record_count: int) -> int:
        """获取数据库批次大小"""
        category = self.get_file_size_category(record_count)
        return self.config["database"]["batch_sizes"][category]
    
    def get_vectorization_batch_size(self, record_count: int) -> int:
        """获取向量化批次大小"""
        category = self.get_file_size_category(record_count)
        return self.config["vectorization"]["batch_sizes"][category]
    
    def get_es_bulk_size(self) -> int:
        """获取ES bulk操作大小"""
        return self.config["elasticsearch"]["bulk_size"]
    
    def get_vectorization_delay(self) -> float:
        """获取向量化批次间延迟"""
        return self.config["vectorization"]["delay_between_batches"]
    
    def get_progress_update_interval(self) -> int:
        """获取进度更新间隔"""
        return self.config.get("progress", {}).get("update_interval", 100)
    
    def get_max_failure_rate(self) -> float:
        """获取最大失败率"""
        return self.config.get("error_handling", {}).get("max_failure_rate", 0.2)
    
    def should_log_all_errors(self) -> bool:
        """是否记录所有错误"""
        return self.config.get("error_handling", {}).get("log_all_errors", False)
    
    def get_max_logged_errors(self) -> int:
        """获取最大记录错误数量"""
        return self.config.get("error_handling", {}).get("max_logged_errors", 50)


# 全局配置实例
large_file_config = LargeFileOptimizationConfig() 