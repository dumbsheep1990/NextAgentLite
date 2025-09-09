"""
向量化配置管理服务
"""
from typing import Dict, List, Optional, Any
from dataclasses import dataclass
from enum import Enum

from core.config_optimized import optimized_config_manager
from core.logger import logger


class VectorizationMode(Enum):
    """向量化模式枚举"""
    AUTO = "auto"
    MANUAL = "manual"
    DISABLED = "disabled"


class VectorizationStrategy(Enum):
    """向量化策略枚举"""
    GENERAL = "general"
    DOMAIN = "domain"
    DUAL = "dual"


@dataclass
class VectorizationDecision:
    """向量化决策结果"""
    strategy: VectorizationStrategy
    confidence: float
    reason: str
    metadata: Dict[str, Any]


class VectorizationConfigService:
    """向量化配置管理服务"""
    
    def __init__(self):
        import os
        
        # 优先级：环境变量 > 配置文件 > 默认值
        # 1. 尝试从配置文件读取
        config = getattr(optimized_config_manager.settings, 'vectorization', None)
        
        # 2. 读取双向量模式配置（环境变量优先）
        config_dual_vector = getattr(config, 'enable_dual_vector', True) if config else True
        env_dual_vector = os.getenv('ENABLE_DUAL_VECTOR', str(config_dual_vector)).lower() == 'true'
        self.enable_dual_vector = env_dual_vector
        
        # 3. 读取检索模式配置
        config_retrieval_mode = getattr(config, 'default_retrieval_mode', 'dual') if config else 'dual'
        self.retrieval_mode = os.getenv('DEFAULT_RETRIEVAL_MODE', config_retrieval_mode)
        
        # 4. 向量库配置
        if config and hasattr(config, 'vector_stores'):
            self.vector_stores = dict(config.vector_stores)
        else:
            self.vector_stores = {
                'general': {'index_name': 'mat_qa_general_vectors', 'auto_create': True},
                'domain': {'index_name': 'mat_qa_domain_vectors', 'auto_create': True}
            }
        
        # 5. 模型配置（支持多模型名称）
        self._init_model_config(config, os)
        
        # 6. 初始化系统模式和检索配置
        self.system_mode = 'auto'
        self.retrieval_config = {
            'top_k': 10,
            'similarity_threshold': 0.7,
            'max_results': 50
        }
        self.auto_config = {
            'content_detection': {
                'domain_keywords': ['地聚物', '水泥', '混凝土', '材料', '强度', '耐久性']
            }
        }
        
        # 延迟日志输出，避免在导入时就显示
        self._initialization_completed = True
    
    def log_status(self):
        """输出向量化配置状态信息"""
        logger.info(f"向量化配置加载完成 - 双向量模式: {self.enable_dual_vector}, 检索模式: {self.retrieval_mode}")
        logger.info(f"默认模型: 通用={self.default_models['general']['model_name']}, 领域={self.default_models['domain']['model_name']}")
    
    def _init_model_config(self, config, os):
        """初始化模型配置（支持多模型名称）"""
        if config and hasattr(config, 'default_models'):
            config_models = dict(config.default_models)
            
            # 通用模型配置
            general_config = config_models.get('general', {})
            # 支持多模型名称，从环境变量获取
            embedding_models = os.getenv('EMBEDDING_MODELS', 'text-embedding-v1').split(',')
            default_embedding = os.getenv('DEFAULT_EMBEDDING_MODEL', embedding_models[0].strip())
            
            self.default_models = {
                'general': {
                    'provider': general_config.get('provider', 'alibaba'),
                    'model_name': general_config.get('model', 'text-embedding-v1'),
                    'available_models': [general_config.get('model', 'text-embedding-v1')],
                    'model_id': general_config.get('model', 'text-embedding-v1')
                },
                'domain': {
                    'provider': config_models.get('domain', {}).get('provider', 'matbert'),
                    'model_name': config_models.get('domain', {}).get('model', 'matbert-embedding'),
                    'model_id': config_models.get('domain', {}).get('model', 'matbert-embedding')
                }
            }
        else:
            # 默认配置，支持多模型
            embedding_models = os.getenv('EMBEDDING_MODELS', 'text-embedding-v1').split(',')
            default_embedding = os.getenv('DEFAULT_EMBEDDING_MODEL', embedding_models[0].strip())
            
            self.default_models = {
                'general': {
                    'provider': 'alibaba',  # 使用阿里云提供商
                    'model_name': 'text-embedding-v1',
                    'available_models': ['text-embedding-v1'],
                    'model_id': 'text-embedding-v1'
                },
                'domain': {
                    'provider': 'matbert',
                    'model_name': 'matbert-embedding',
                    'model_id': 'matbert-embedding'
                }
            }
    
    def get_available_llm_models(self) -> Dict[str, Any]:
        """获取可用的LLM模型列表（按厂商分组）"""
        import os
        
        # 获取所有可用模型
        all_models = os.getenv('LLM_MODELS', 'qwen-plus-latest,gpt-4o-mini,gemini-2.5-flash-preview-thinking')
        all_models_list = [model.strip() for model in all_models.split(',')]
        
        # 按厂商分组
        return {
            'all': all_models_list,
            'alibaba': [model.strip() for model in os.getenv('ALIBABA_LLM_MODELS', 'qwen-plus-latest,qwen-plus,qwen-turbo').split(',')],
            'openai': [model.strip() for model in os.getenv('OPENAI_LLM_MODELS', 'gpt-4o-mini,gpt-4-turbo').split(',')],
            'google': [model.strip() for model in os.getenv('GOOGLE_LLM_MODELS', 'gemini-2.5-flash-preview-thinking,gemini-flash').split(',')]
        }
    
    def get_default_llm_model(self) -> str:
        """获取默认LLM模型"""
        import os
        available_models = self.get_available_llm_models()
        default_model = os.getenv('DEFAULT_LLM_MODEL', available_models['all'][0] if available_models['all'] else 'qwen-plus-latest')
        return default_model
    
    def get_available_embedding_models(self) -> Dict[str, Any]:
        """获取可用的嵌入模型列表（按厂商分组）"""
        import os
        
        # 获取所有可用嵌入模型
        all_models = os.getenv('EMBEDDING_MODELS', 'text-embedding-v4,text-embedding-3-small')
        all_models_list = [model.strip() for model in all_models.split(',')]
        
        # 按厂商分组
        return {
            'all': all_models_list,
            'alibaba': [model.strip() for model in os.getenv('ALIBABA_EMBEDDING_MODELS', 'text-embedding-v4,text-embedding-v3').split(',')],
            'openai': [model.strip() for model in os.getenv('OPENAI_EMBEDDING_MODELS', 'text-embedding-3-small,text-embedding-ada-002').split(',')],
            'available_models': all_models_list  # 向后兼容
        }
    
    def get_default_embedding_model(self) -> str:
        """获取默认嵌入模型"""
        return self.default_models['general']['model_name']
    
    def get_default_models(self) -> Dict[str, Any]:
        """获取默认模型配置"""
        return self.default_models
    
    def decide_vectorization_strategy(
        self,
        filename: str = None,
        file_size: int = None,
        file_content: Optional[str] = None,
        user_preference: Optional[str] = None
    ) -> VectorizationDecision:
        """
        决定文档的向量化策略 - 简化逻辑：配置驱动
        
        简单规则：
        - 如果开启双向量模式(enable_dual_vector=True)，使用双向量
        - 否则使用通用向量
        """
        
        # 如果用户明确指定策略，优先使用用户偏好
        if user_preference and user_preference in [s.value for s in VectorizationStrategy]:
            return VectorizationDecision(
                strategy=VectorizationStrategy(user_preference),
                confidence=1.0,
                reason=f"用户指定策略: {user_preference}",
                metadata={"source": "user_preference"}
            )
        
        # 核心逻辑：基于配置决定
        if self.enable_dual_vector:
            return VectorizationDecision(
                strategy=VectorizationStrategy.DUAL,
                confidence=1.0,
                reason="配置开启双向量模式，使用双向量检索",
                metadata={
                    "source": "config_enabled",
                    "dual_vector_enabled": True,
                    "filename": filename or "unknown"
                }
            )
        else:
            return VectorizationDecision(
                strategy=VectorizationStrategy.GENERAL,
                confidence=1.0,
                reason="配置未开启双向量模式，使用通用向量检索",
                metadata={
                    "source": "config_disabled", 
                    "dual_vector_enabled": False,
                    "filename": filename or "unknown"
                }
            )
    
    
    def get_retrieval_strategy(
        self,
        query: str,
        available_documents: Dict[str, Any],
        user_mode: Optional[str] = None
    ) -> tuple[str, Dict[str, Any]]:
        """
        获取检索策略
        
        Args:
            query: 查询文本
            available_documents: 可用文档信息
            user_mode: 用户指定模式
        """
        
        try:
            retrieval_config = optimized_config_manager.settings.vectorization.retrieval_config
            default_mode = getattr(retrieval_config, 'default_mode', 'auto')
        except:
            default_mode = 'auto'
        
        # 用户指定模式优先
        if user_mode and user_mode in ['general', 'domain', 'hybrid', 'auto']:
            mode = user_mode
        else:
            mode = default_mode
        
        # 自动模式需要智能选择
        if mode == 'auto':
            mode = self._decide_retrieval_mode(query, available_documents)
        
        # 获取检索参数
        params = self._get_retrieval_params(mode, query, available_documents)
        
        return mode, params
    
    def _decide_retrieval_mode(
        self,
        query: str,
        available_documents: Dict[str, Any]
    ) -> str:
        """自动决定检索模式"""
        
        # 分析查询内容
        domain_keywords = self.auto_config.get('content_detection', {}).get('domain_keywords', [])
        domain_relevance = sum(1 for keyword in domain_keywords if keyword in query)
        
        # 分析可用文档
        dual_vector_ratio = available_documents.get('dual_vector_ratio', 0.0)
        
        # 决策逻辑
        if domain_relevance >= 2 and dual_vector_ratio > 0.3:
            return 'hybrid'
        elif domain_relevance >= 1 and dual_vector_ratio > 0.1:
            return 'hybrid'
        elif dual_vector_ratio > 0.5:
            return 'hybrid'
        elif domain_relevance >= 2:
            return 'domain'
        else:
            return 'general'
    
    def _get_retrieval_params(
        self,
        mode: str,
        query: str,
        available_documents: Dict[str, Any]
    ) -> Dict[str, Any]:
        """获取检索参数"""
        
        try:
            retrieval_config = optimized_config_manager.settings.vectorization.retrieval_config
            dynamic_weights = getattr(retrieval_config, 'dynamic_weights', {})
        except:
            dynamic_weights = {}
        
        params = {
            "mode": mode,
            "weights": {
                "general": dynamic_weights.get('base_general', 0.3),
                "domain": dynamic_weights.get('base_domain', 0.5),
                "keyword": dynamic_weights.get('base_keyword', 0.2)
            }
        }
        
        # 根据模式调整权重
        if mode == 'domain':
            params["weights"]["domain"] = 0.8
            params["weights"]["general"] = 0.1
            params["weights"]["keyword"] = 0.1
        elif mode == 'general':
            params["weights"]["general"] = 0.7
            params["weights"]["domain"] = 0.1
            params["weights"]["keyword"] = 0.2
        elif mode == 'hybrid':
            # 保持默认配置的平衡权重
            pass
        
        # 动态调整（基于查询和文档情况）
        domain_keywords = self.auto_config.get('content_detection', {}).get('domain_keywords', [])
        domain_relevance = sum(1 for keyword in domain_keywords if keyword in query)
        
        if domain_relevance > 0:
            boost_factor = dynamic_weights.get('domain_boost_factor', 1.5)
            params["weights"]["domain"] *= min(boost_factor, 1.0 + domain_relevance * 0.2)
        
        return params
    
    def update_system_mode(self, mode: str) -> bool:
        """更新系统向量化模式"""
        if mode in [m.value for m in VectorizationMode]:
            self.system_mode = mode
            logger.info(f"系统向量化模式更新为: {mode}")
            return True
        return False
    
    def get_dual_vector_config(self) -> Dict[str, Any]:
        """获取双向量配置（匹配前端接口）"""
        return {
            "enableDualVector": self.enable_dual_vector,
            "retrievalMode": self.retrieval_mode,
            "defaultModels": {
                "general": self.default_models.get('general', {}),
                "domain": self.default_models.get('domain', {})
            },
            "retrievalConfig": self.retrieval_config,
            "vectorStores": self.vector_stores
        }
    
    def update_dual_vector_config(self, config: Dict[str, Any]) -> bool:
        """更新双向量配置（匹配前端接口）"""
        try:
            if "enableDualVector" in config:
                self.enable_dual_vector = config["enableDualVector"]
                
            if "retrievalMode" in config and config["retrievalMode"] in ["dual", "general", "domain"]:
                self.retrieval_mode = config["retrievalMode"]
                
            if "retrievalConfig" in config:
                self.retrieval_config.update(config["retrievalConfig"])
                
            logger.info(f"双向量配置已更新: enableDualVector={self.enable_dual_vector}, retrievalMode={self.retrieval_mode}")
            return True
        except Exception as e:
            logger.error(f"更新双向量配置失败: {e}")
            return False
    
    def get_vector_store_status(self) -> Dict[str, Any]:
        """获取向量库状态信息"""
        return {
            "general": {
                "indexName": self.vector_stores.get('general', {}).get('index_name', 'mat_qa_general_vectors'),
                "status": "ready",  # 实际应该检查ES状态
                "documentCount": 0,  # 实际应该从ES获取
                "autoCreate": self.vector_stores.get('general', {}).get('auto_create', True)
            },
            "domain": {
                "indexName": self.vector_stores.get('domain', {}).get('index_name', 'mat_qa_domain_vectors'),
                "status": "ready",  # 实际应该检查ES状态
                "documentCount": 0,  # 实际应该从ES获取
                "autoCreate": self.vector_stores.get('domain', {}).get('auto_create', True)
            }
        }
    
    def is_dual_vector_enabled(self) -> bool:
        """检查双向量化是否启用"""
        return self.enable_dual_vector
    
    def get_retrieval_mode(self) -> str:
        """获取当前检索模式"""
        return self.retrieval_mode
    
    def get_config_summary(self) -> Dict[str, Any]:
        """获取配置摘要"""
        return {
            "enable_dual_vector": self.enable_dual_vector,
            "system_mode": self.system_mode,
            "retrieval_mode": self.retrieval_mode,
            "default_models": self.default_models,
            "retrieval_config": self.retrieval_config,
            "vector_stores": self.vector_stores,
            "auto_config": self.auto_config,
            "supported_strategies": [s.value for s in VectorizationStrategy],
            "supported_modes": [m.value for m in VectorizationMode],
            "available_llm_models": self.get_available_llm_models(),
            "available_embedding_models": self.get_available_embedding_models(),
            "default_llm_model": self.get_default_llm_model(),
            "default_embedding_model": self.get_default_embedding_model()
        }


# 全局向量化配置服务实例
vectorization_config_service = VectorizationConfigService()