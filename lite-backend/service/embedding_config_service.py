"""
Embedding模型配置统一管理服务
确保整个系统的embedding模型配置从单一来源获取，无硬编码
"""
import logging
from typing import Optional, Dict, Any
from core.config_optimized import optimized_config_manager

logger = logging.getLogger(__name__)


class EmbeddingConfigService:
    """Embedding模型配置统一管理服务"""
    
    def __init__(self):
        self._cached_config = None
        self._initialized = False
        
    async def initialize(self):
        """初始化配置服务"""
        if self._initialized:
            return
            
        self._refresh_config()
        self._initialized = True
        logger.info(f"[EMBEDDING_CONFIG] 初始化完成，默认模型: {self.get_default_model()}")
    
    def _refresh_config(self):
        """刷新配置缓存"""
        try:
            self._cached_config = optimized_config_manager.get_embedding_models_config()
        except Exception as e:
            logger.error(f"[EMBEDDING_CONFIG] 配置刷新失败: {e}")
            self._cached_config = None
    
    def get_default_model(self) -> str:
        """
        获取默认embedding模型
        严格从配置获取，不设置任何回退值
        """
        if not self._cached_config:
            self._refresh_config()
            
        if not self._cached_config:
            raise ValueError("无法获取embedding模型配置，请检查配置文件或环境变量")
            
        default_model = self._cached_config.get('default_model')
        if not default_model:
            raise ValueError(
                "未配置默认embedding模型，请设置以下环境变量之一：\n"
                "- DEFAULT_EMBEDDING_MODEL\n"
                "- GATEWAY_EMBEDDING_MODELS (第一个模型将作为默认值)"
            )
            
        return default_model
    
    def get_full_model_path(self, provider: str = "alibaba") -> str:
        """
        获取完整的模型路径
        
        Args:
            provider: 模型提供商，如 'alibaba', 'openai' 等
            
        Returns:
            完整的模型路径，如 'alibaba/Qwen/Qwen3-Embedding-4B'
        """
        default_model = self.get_default_model()
        
        # 如果模型路径已经包含提供商前缀，直接返回
        if default_model.startswith(("alibaba/", "openai/", "azure/", "google/")):
            return default_model
            
        # 否则添加提供商前缀
        return f"{provider}/{default_model}"
    
    def get_all_models(self) -> Dict[str, Any]:
        """获取所有可用的embedding模型配置"""
        if not self._cached_config:
            self._refresh_config()
            
        return self._cached_config or {}
    
    def validate_config(self) -> Dict[str, Any]:
        """
        验证embedding配置的完整性
        
        Returns:
            验证结果字典
        """
        result = {
            "valid": False,
            "default_model": None,
            "all_models": [],
            "providers": {},
            "errors": []
        }
        
        try:
            # 检查是否能获取默认模型
            default_model = self.get_default_model()
            result["default_model"] = default_model
            
            # 获取所有配置
            config = self.get_all_models()
            result["all_models"] = config.get('all_models', [])
            result["providers"] = config.get('providers', {})
            
            # 基本验证通过
            result["valid"] = True
            
        except Exception as e:
            result["errors"].append(str(e))
            
        return result
    
    def refresh_cache(self):
        """手动刷新配置缓存"""
        self._refresh_config()
        logger.info("[EMBEDDING_CONFIG] 配置缓存已刷新")


# 全局单例实例
embedding_config_service = EmbeddingConfigService()


async def get_embedding_model_path(provider: str = "alibaba") -> str:
    """
    便捷函数：获取embedding模型路径
    
    Args:
        provider: 模型提供商
        
    Returns:
        完整的模型路径
        
    Raises:
        ValueError: 当配置无效时
    """
    if not embedding_config_service._initialized:
        await embedding_config_service.initialize()
        
    return embedding_config_service.get_full_model_path(provider)


def get_embedding_model_path_sync(provider: str = "alibaba") -> str:
    """
    同步版本：获取embedding模型路径
    
    Args:
        provider: 模型提供商
        
    Returns:
        完整的模型路径
        
    Raises:
        ValueError: 当配置无效时
    """
    return embedding_config_service.get_full_model_path(provider)


def validate_embedding_config() -> Dict[str, Any]:
    """
    便捷函数：验证embedding配置
    
    Returns:
        验证结果字典
    """
    return embedding_config_service.validate_config()