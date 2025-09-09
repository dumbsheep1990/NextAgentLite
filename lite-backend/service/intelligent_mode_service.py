"""
智能检索模式服务 - 根据配置状态动态切换检索模式
支持优雅降级和模式自适应
"""
from typing import Dict, List, Optional, Any, Tuple
from enum import Enum

from core.logger import logger
from core.config_optimized import optimized_config_manager


class RetrievalMode(Enum):
    """检索模式枚举"""
    DUAL = "dual"           # 双向量检索（通用+领域）
    GENERAL = "general"     # 仅通用向量检索
    DOMAIN = "domain"       # 仅领域向量检索
    KEYWORD = "keyword"     # 关键词检索
    HYBRID = "hybrid"       # 混合检索
    DISABLED = "disabled"   # 禁用检索


class IntelligentModeService:
    """智能检索模式服务"""
    
    def __init__(self):
        self.current_mode = RetrievalMode.DUAL
        self.fallback_mode = RetrievalMode.GENERAL
        self.available_modes = [RetrievalMode.KEYWORD]  # 默认只支持关键词检索
        self.mode_capabilities = {}
        # 禁用动态检测，减少日志噪音
        # self._update_available_modes()
    
    def _update_available_modes(self):
        """更新可用的检索模式"""
        self.available_modes = []
        self.mode_capabilities = {}
        
        # 检查各种检索模式的可用性
        try:
            config = optimized_config_manager.settings
            
            # 检查通用向量化是否可用
            general_available = self._check_general_embedding_available()
            
            # 检查领域向量化（MatBERT）是否可用
            domain_available = self._check_domain_embedding_available()
            
            # 检查Elasticsearch是否可用
            keyword_available = self._check_elasticsearch_available()
            
            # 根据可用性确定支持的模式
            if general_available and domain_available:
                self.available_modes.extend([RetrievalMode.DUAL, RetrievalMode.GENERAL, RetrievalMode.DOMAIN])
                self.mode_capabilities[RetrievalMode.DUAL] = {
                    "description": "双向量检索（推荐）",
                    "features": ["通用语义理解", "领域专业知识", "最佳检索效果"],
                    "performance": "最高"
                }
            
            if general_available:
                if RetrievalMode.GENERAL not in self.available_modes:
                    self.available_modes.append(RetrievalMode.GENERAL)
                self.mode_capabilities[RetrievalMode.GENERAL] = {
                    "description": "通用向量检索",
                    "features": ["广泛语义理解", "多领域适用"],
                    "performance": "中等"
                }
            
            if domain_available:
                if RetrievalMode.DOMAIN not in self.available_modes:
                    self.available_modes.append(RetrievalMode.DOMAIN)
                self.mode_capabilities[RetrievalMode.DOMAIN] = {
                    "description": "领域专用向量检索",
                    "features": ["材料科学专业知识", "高精度专业术语理解"],
                    "performance": "专业领域最高"
                }
            
            if keyword_available:
                self.available_modes.append(RetrievalMode.KEYWORD)
                self.mode_capabilities[RetrievalMode.KEYWORD] = {
                    "description": "关键词检索",
                    "features": ["精确匹配", "快速响应"],
                    "performance": "基础"
                }
            
            if general_available and keyword_available:
                self.available_modes.append(RetrievalMode.HYBRID)
                self.mode_capabilities[RetrievalMode.HYBRID] = {
                    "description": "混合检索",
                    "features": ["向量检索", "关键词检索", "结果融合"],
                    "performance": "良好"
                }
            
            # 确定当前最佳模式
            self._determine_optimal_mode()
            
            # 只在调试模式下显示详细信息
            if logger.level <= 10:  # DEBUG级别
                logger.debug(f"检索模式更新: 可用{len(self.available_modes)}个模式, 当前使用{self.current_mode.value}")
            
        except Exception as e:
            logger.warning(f"检索模式初始化失败，使用默认模式: {e}")
            self.available_modes = [RetrievalMode.KEYWORD]
            self.current_mode = RetrievalMode.KEYWORD
    
    def _check_general_embedding_available(self) -> bool:
        """检查通用向量化是否可用"""
        try:
            # 这里可以添加实际的服务连接检查
            # 暂时基于配置判断
            config = optimized_config_manager.settings.embeddings.providers if optimized_config_manager.settings.embeddings else {}
            return hasattr(config, 'qwen_embedding') or hasattr(config, 'one_api_embedding')
        except:
            return False
    
    def _check_domain_embedding_available(self) -> bool:
        """检查领域向量化（MatBERT）是否可用"""
        try:
            # 检查MatBERT配置和环境变量
            import os
            config = optimized_config_manager.settings.embeddings.providers if optimized_config_manager.settings.embeddings else {}
            
            if hasattr(config, 'matbert_embedding'):
                # 检查环境变量
                api_key = os.getenv('MATBERT_API_KEY')
                base_url = os.getenv('MATBERT_BASE_URL')
                return api_key is not None and base_url is not None
            return False
        except:
            return False
    
    def _check_elasticsearch_available(self) -> bool:
        """检查Elasticsearch是否可用"""
        try:
            config = optimized_config_manager.settings.database_elasticsearch
            return bool(config.hosts)
        except:
            return False
    
    def _determine_optimal_mode(self):
        """确定最佳检索模式"""
        if RetrievalMode.DUAL in self.available_modes:
            self.current_mode = RetrievalMode.DUAL
            self.fallback_mode = RetrievalMode.GENERAL
        elif RetrievalMode.GENERAL in self.available_modes:
            self.current_mode = RetrievalMode.GENERAL
            self.fallback_mode = RetrievalMode.KEYWORD
        elif RetrievalMode.DOMAIN in self.available_modes:
            self.current_mode = RetrievalMode.DOMAIN
            self.fallback_mode = RetrievalMode.KEYWORD
        elif RetrievalMode.HYBRID in self.available_modes:
            self.current_mode = RetrievalMode.HYBRID
            self.fallback_mode = RetrievalMode.KEYWORD
        elif RetrievalMode.KEYWORD in self.available_modes:
            self.current_mode = RetrievalMode.KEYWORD
            self.fallback_mode = RetrievalMode.DISABLED
        else:
            self.current_mode = RetrievalMode.DISABLED
            self.fallback_mode = RetrievalMode.DISABLED
    
    def get_current_mode(self) -> RetrievalMode:
        """获取当前检索模式"""
        return self.current_mode
    
    def set_mode(self, mode: RetrievalMode) -> bool:
        """设置检索模式"""
        if mode in self.available_modes:
            self.current_mode = mode
            logger.info(f"检索模式已切换为: {mode.value}")
            return True
        else:
            logger.warning(f"检索模式 {mode.value} 不可用")
            return False
    
    def get_available_modes(self) -> List[RetrievalMode]:
        """获取可用的检索模式"""
        return self.available_modes
    
    def get_mode_capabilities(self) -> Dict[RetrievalMode, Dict[str, Any]]:
        """获取各模式的能力描述"""
        return self.mode_capabilities
    
    def fallback_to_next_available(self) -> RetrievalMode:
        """降级到下一个可用模式"""
        old_mode = self.current_mode
        
        if self.fallback_mode in self.available_modes:
            self.current_mode = self.fallback_mode
            logger.warning(f"检索模式从 {old_mode.value} 降级到 {self.current_mode.value}")
        else:
            # 寻找任何可用的模式
            for mode in [RetrievalMode.GENERAL, RetrievalMode.KEYWORD, RetrievalMode.DISABLED]:
                if mode in self.available_modes:
                    self.current_mode = mode
                    logger.warning(f"检索模式从 {old_mode.value} 降级到 {self.current_mode.value}")
                    break
        
        return self.current_mode
    
    def get_mode_config(self, mode: Optional[RetrievalMode] = None) -> Dict[str, Any]:
        """获取指定模式的配置"""
        target_mode = mode or self.current_mode
        
        config_templates = {
            RetrievalMode.DUAL: {
                "vectorization": {
                    "retrieval_mode": "dual",
                    "enable_dual_vector": True,
                    "weights": {"general": 0.4, "domain": 0.6}
                }
            },
            RetrievalMode.GENERAL: {
                "vectorization": {
                    "retrieval_mode": "general",
                    "enable_dual_vector": False,
                    "weights": {"general": 1.0, "domain": 0.0}
                }
            },
            RetrievalMode.DOMAIN: {
                "vectorization": {
                    "retrieval_mode": "domain",
                    "enable_dual_vector": False,
                    "weights": {"general": 0.0, "domain": 1.0}
                }
            },
            RetrievalMode.KEYWORD: {
                "search": {
                    "vector_search": {"enabled": False},
                    "keyword_search": {"enabled": True}
                }
            },
            RetrievalMode.HYBRID: {
                "search": {
                    "vector_search": {"enabled": True, "weight": 0.7},
                    "keyword_search": {"enabled": True, "weight": 0.3}
                }
            },
            RetrievalMode.DISABLED: {
                "search": {
                    "vector_search": {"enabled": False},
                    "keyword_search": {"enabled": False}
                }
            }
        }
        
        return config_templates.get(target_mode, {})
    
    def get_status_report(self) -> Dict[str, Any]:
        """获取状态报告"""
        return {
            "current_mode": self.current_mode.value,
            "fallback_mode": self.fallback_mode.value,
            "available_modes": [mode.value for mode in self.available_modes],
            "mode_capabilities": {
                mode.value: capabilities 
                for mode, capabilities in self.mode_capabilities.items()
            },
            "recommendations": self._get_recommendations()
        }
    
    def _get_recommendations(self) -> List[str]:
        """获取改进建议"""
        recommendations = []
        
        if RetrievalMode.DUAL not in self.available_modes:
            if not self._check_domain_embedding_available():
                recommendations.append(
                    "配置MatBERT模型接口以启用双向量检索，获得最佳检索效果"
                )
            if not self._check_general_embedding_available():
                recommendations.append(
                    "配置通用向量化模型以提升检索能力"
                )
        
        if RetrievalMode.KEYWORD not in self.available_modes:
            recommendations.append(
                "配置Elasticsearch以启用关键词检索功能"
            )
        
        if self.current_mode == RetrievalMode.DISABLED:
            recommendations.append(
                "当前检索功能不可用，请检查向量化服务和搜索引擎配置"
            )
        
        return recommendations


# 创建全局实例
intelligent_mode_service = IntelligentModeService()