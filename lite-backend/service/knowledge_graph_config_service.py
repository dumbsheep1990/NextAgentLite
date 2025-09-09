"""
知识图谱配置服务 - 管理知识图谱相关配置
"""
import json
import os
from typing import Dict, Any, Optional
from dataclasses import dataclass, asdict
from pathlib import Path

try:
    from core.logger import logger
except ImportError:
    import logging
    logger = logging.getLogger(__name__)


@dataclass
class KnowledgeGraphConfig:
    """知识图谱配置数据类"""
    enable_knowledge_graph: bool = False
    auto_extraction: bool = False
    extraction_mode: str = "manual"  # auto, manual, disabled
    extraction_config: Dict[str, Any] = None
    arangodb_config: Dict[str, Any] = None
    processing_config: Dict[str, Any] = None
    
    def __post_init__(self):
        if self.extraction_config is None:
            # 从环境变量读取批次大小，确保不超过API限制
            env_batch_size = int(os.getenv('VECTORIZATION_BATCH_SIZE', '10'))
            api_max_batch_size = 10  # API最大批次限制
            batch_size = min(env_batch_size, api_max_batch_size)
            
            self.extraction_config = {
                "enabled_entity_types": ["material", "chemical_compound", "property", "process", "structure", "test_method"],
                "min_confidence": 0.7,
                "batch_size": batch_size,
                "enable_validation": True  # 固定启用验证
            }
        
        if self.arangodb_config is None:
            self.arangodb_config = {
                "enabled": False,
                "host": "localhost:8529",
                "database": "mat_qa_graph",
                "collections": {
                    "entities": "entities",
                    "relationships": "relationships", 
                    "documents": "documents"
                }
            }
        
        if self.processing_config is None:
            self.processing_config = {
                "max_concurrency": 3,
                "retry_attempts": 2,
                "timeout_ms": 30000
            }


class KnowledgeGraphConfigService:
    """知识图谱配置服务"""
    
    def __init__(self, config_file: str = "config/knowledge_graph_config.json"):
        self.config_file = Path(config_file)
        self.config_file.parent.mkdir(parents=True, exist_ok=True)
        self._config = self._load_config()
    
    def _load_config(self) -> KnowledgeGraphConfig:
        """从文件加载配置"""
        try:
            if self.config_file.exists():
                with open(self.config_file, 'r', encoding='utf-8') as f:
                    config_data = json.load(f)
                
                # 转换字段名格式（前端使用camelCase，后端使用snake_case）
                converted_data = self._convert_camel_to_snake(config_data)
                return KnowledgeGraphConfig(**converted_data)
            else:
                # 返回默认配置
                return KnowledgeGraphConfig()
                
        except Exception as e:
            logger.error(f"加载知识图谱配置失败: {e}")
            return KnowledgeGraphConfig()
    
    def _save_config(self) -> None:
        """保存配置到文件"""
        try:
            config_data = asdict(self._config)
            # 转换字段名格式（后端使用snake_case，前端使用camelCase）
            converted_data = self._convert_snake_to_camel(config_data)
            
            with open(self.config_file, 'w', encoding='utf-8') as f:
                json.dump(converted_data, f, ensure_ascii=False, indent=2)
                
            logger.info(f"知识图谱配置已保存到: {self.config_file}")
            
        except Exception as e:
            logger.error(f"保存知识图谱配置失败: {e}")
            raise
    
    def _convert_camel_to_snake(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """将camelCase转换为snake_case"""
        conversion_map = {
            "enableKnowledgeGraph": "enable_knowledge_graph",
            "autoExtraction": "auto_extraction",
            "extractionMode": "extraction_mode",
            "extractionConfig": "extraction_config",
            "arangodbConfig": "arangodb_config",
            "processingConfig": "processing_config",
            "enabledEntityTypes": "enabled_entity_types",
            "minConfidence": "min_confidence",
            "batchSize": "batch_size",
            "enableValidation": "enable_validation",
            "maxConcurrency": "max_concurrency",
            "retryAttempts": "retry_attempts",
            "timeoutMs": "timeout_ms"
        }
        
        def convert_dict(d):
            if isinstance(d, dict):
                result = {}
                for k, v in d.items():
                    new_key = conversion_map.get(k, k)
                    result[new_key] = convert_dict(v)
                return result
            elif isinstance(d, list):
                return [convert_dict(item) for item in d]
            else:
                return d
        
        return convert_dict(data)
    
    def _convert_snake_to_camel(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """将snake_case转换为camelCase"""
        conversion_map = {
            "enable_knowledge_graph": "enableKnowledgeGraph",
            "auto_extraction": "autoExtraction",
            "extraction_mode": "extractionMode",
            "extraction_config": "extractionConfig",
            "arangodb_config": "arangodbConfig",
            "processing_config": "processingConfig",
            "enabled_entity_types": "enabledEntityTypes",
            "min_confidence": "minConfidence",
            "batch_size": "batchSize",
            "enable_validation": "enableValidation",
            "max_concurrency": "maxConcurrency",
            "retry_attempts": "retryAttempts",
            "timeout_ms": "timeoutMs"
        }
        
        def convert_dict(d):
            if isinstance(d, dict):
                result = {}
                for k, v in d.items():
                    new_key = conversion_map.get(k, k)
                    result[new_key] = convert_dict(v)
                return result
            elif isinstance(d, list):
                return [convert_dict(item) for item in d]
            else:
                return d
        
        return convert_dict(data)
    
    def get_config(self) -> Dict[str, Any]:
        """获取知识图谱配置（前端格式）"""
        config_data = asdict(self._config)
        return self._convert_snake_to_camel(config_data)
    
    def update_config(self, updates: Dict[str, Any]) -> Dict[str, Any]:
        """更新知识图谱配置"""
        try:
            # 转换前端格式到后端格式
            converted_updates = self._convert_camel_to_snake(updates)
            
            # 更新配置对象
            for key, value in converted_updates.items():
                if hasattr(self._config, key):
                    setattr(self._config, key, value)
                else:
                    logger.warning(f"未知配置项: {key}")
            
            # 保存配置
            self._save_config()
            
            # 返回更新后的配置（前端格式）
            return self.get_config()
            
        except Exception as e:
            logger.error(f"更新知识图谱配置失败: {e}")
            raise
    
    def toggle_knowledge_graph(self, enabled: bool) -> bool:
        """切换知识图谱开关"""
        try:
            self._config.enable_knowledge_graph = enabled
            self._save_config()
            
            logger.info(f"知识图谱已{'启用' if enabled else '禁用'}")
            return enabled
            
        except Exception as e:
            logger.error(f"切换知识图谱开关失败: {e}")
            raise
    
    def is_knowledge_graph_enabled(self) -> bool:
        """检查知识图谱是否启用"""
        return self._config.enable_knowledge_graph
    
    def is_auto_extraction_enabled(self) -> bool:
        """检查是否启用自动提取（简化：知识图谱启用时自动启用提取）"""
        return self._config.enable_knowledge_graph and self._config.extraction_mode == "auto"
    
    def get_extraction_mode(self) -> str:
        """获取提取模式"""
        return self._config.extraction_mode
    
    def get_entity_types(self) -> list:
        """获取启用的实体类型"""
        return self._config.extraction_config.get("enabled_entity_types", [])
    
    def get_min_confidence(self) -> float:
        """获取最小置信度阈值"""
        return self._config.extraction_config.get("min_confidence", 0.7)
    
    def get_batch_size(self) -> int:
        """获取批处理大小"""
        return self._config.extraction_config.get("batch_size", 10)
    
    def get_arangodb_config(self) -> Dict[str, Any]:
        """获取ArangoDB配置"""
        return self._config.arangodb_config
    
    def get_processing_config(self) -> Dict[str, Any]:
        """获取处理配置"""
        return self._config.processing_config
    
    def validate_config(self) -> Dict[str, Any]:
        """验证配置的有效性"""
        issues = []
        warnings = []
        
        # 检查提取模式
        valid_modes = ["auto", "manual", "disabled"]
        if self._config.extraction_mode not in valid_modes:
            issues.append(f"无效的提取模式: {self._config.extraction_mode}")
        
        # 检查置信度范围
        min_conf = self._config.extraction_config.get("min_confidence", 0.7)
        if not (0.0 <= min_conf <= 1.0):
            issues.append(f"置信度阈值必须在0.0-1.0之间: {min_conf}")
        
        # 检查批处理大小
        batch_size = self._config.extraction_config.get("batch_size", 10)
        if batch_size <= 0:
            issues.append(f"批处理大小必须大于0: {batch_size}")
        
        # 检查ArangoDB配置
        if self._config.arangodb_config.get("enabled", False):
            host = self._config.arangodb_config.get("host", "")
            if not host:
                issues.append("ArangoDB主机地址不能为空")
            
            database = self._config.arangodb_config.get("database", "")
            if not database:
                issues.append("ArangoDB数据库名称不能为空")
        
        # 检查并发配置
        max_concurrency = self._config.processing_config.get("max_concurrency", 3)
        if max_concurrency <= 0:
            issues.append(f"最大并发数必须大于0: {max_concurrency}")
        
        # 生成警告
        if self._config.enable_knowledge_graph and not self._config.arangodb_config.get("enabled", False):
            warnings.append("知识图谱已启用但ArangoDB未配置，可能影响功能使用")
        
        return {
            "valid": len(issues) == 0,
            "issues": issues,
            "warnings": warnings
        }


# 全局配置服务实例
knowledge_graph_config_service = KnowledgeGraphConfigService()