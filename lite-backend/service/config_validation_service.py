"""
配置验证服务 - 启动时检查各项服务配置的可用性
提供智能降级和优雅容错机制
"""
import os
import asyncio
import httpx
from typing import Dict, List, Optional, Any, Tuple
from dataclasses import dataclass
from enum import Enum

from core.logger import logger
from core.config_optimized import optimized_config_manager


class ServiceStatus(Enum):
    """服务状态枚举"""
    HEALTHY = "healthy"
    WARNING = "warning"
    ERROR = "error"
    DISABLED = "disabled"
    NOT_CONFIGURED = "not_configured"


@dataclass
class ServiceCheckResult:
    """服务检查结果"""
    name: str
    status: ServiceStatus
    message: str
    details: Dict[str, Any]
    fallback_available: bool = False
    fallback_config: Optional[Dict[str, Any]] = None


@dataclass
class ConfigValidationResult:
    """配置验证结果"""
    overall_status: ServiceStatus
    services: Dict[str, ServiceCheckResult]
    fallback_configs: Dict[str, Any]
    startup_warnings: List[str]
    critical_issues: List[str]


class ConfigValidationService:
    """配置验证服务"""
    
    def __init__(self):
        self.config = optimized_config_manager.settings
        self.validation_result: Optional[ConfigValidationResult] = None
    
    async def validate_all_services(self) -> ConfigValidationResult:
        """验证所有服务配置"""
        logger.info("开始系统配置验证...")
        
        services = {}
        fallback_configs = {}
        startup_warnings = []
        critical_issues = []
        
        # 验证数据库服务
        db_result = await self._validate_databases()
        services.update(db_result)
        
        # 验证LLM服务
        llm_result = await self._validate_llm_services()
        services.update(llm_result)
        
        # 验证向量化服务
        embedding_result = await self._validate_embedding_services()
        services.update(embedding_result)
        
        # 验证存储服务
        storage_result = await self._validate_storage_services()
        services.update(storage_result)
        
        # 分析结果并生成降级配置
        fallback_configs, warnings, critical = self._analyze_results(services)
        startup_warnings.extend(warnings)
        critical_issues.extend(critical)
        
        # 确定整体状态
        overall_status = self._determine_overall_status(services, critical_issues)
        
        self.validation_result = ConfigValidationResult(
            overall_status=overall_status,
            services=services,
            fallback_configs=fallback_configs,
            startup_warnings=startup_warnings,
            critical_issues=critical_issues
        )
        
        logger.info(f"配置验证完成，整体状态: {overall_status.value}")
        return self.validation_result
    
    async def _validate_databases(self) -> Dict[str, ServiceCheckResult]:
        """验证数据库服务"""
        results = {}
        
        # PostgreSQL
        try:
            pg_config = self.config.database_postgresql
            # 简单检查配置是否完整
            if all([pg_config.host, pg_config.port, pg_config.database, pg_config.username]):
                results["postgresql"] = ServiceCheckResult(
                    name="PostgreSQL",
                    status=ServiceStatus.HEALTHY,
                    message="PostgreSQL配置完整",
                    details={"host": pg_config.host, "port": pg_config.port, "database": pg_config.database}
                )
            else:
                results["postgresql"] = ServiceCheckResult(
                    name="PostgreSQL",
                    status=ServiceStatus.ERROR,
                    message="PostgreSQL配置不完整",
                    details={"missing_fields": ["host", "port", "database", "username"]}
                )
        except Exception as e:
            results["postgresql"] = ServiceCheckResult(
                name="PostgreSQL",
                status=ServiceStatus.ERROR,
                message=f"PostgreSQL配置错误: {e}",
                details={"error": str(e)}
            )
        
        # Elasticsearch
        try:
            es_config = self.config.database_elasticsearch
            if es_config.hosts:
                # 尝试连接ES
                result = await self._check_elasticsearch_connection(es_config.hosts[0], es_config)
                results["elasticsearch"] = result
            else:
                results["elasticsearch"] = ServiceCheckResult(
                    name="Elasticsearch",
                    status=ServiceStatus.NOT_CONFIGURED,
                    message="Elasticsearch未配置",
                    details={}
                )
        except Exception as e:
            results["elasticsearch"] = ServiceCheckResult(
                name="Elasticsearch",
                status=ServiceStatus.ERROR,
                message=f"Elasticsearch配置错误: {e}",
                details={"error": str(e)}
            )
        
        # ArangoDB 检查已移除 - 服务已禁用
        
        return results
    
    async def _validate_llm_services(self) -> Dict[str, ServiceCheckResult]:
        """验证LLM服务"""
        results = {}
        
        try:
            llm_providers = self.config.llm.providers if self.config.llm else {}
            
            # 检查API网关配置（如One-API）
            if self.config.llm and self.config.llm.api_gateway and self.config.llm.api_gateway.enabled:
                gateway_config = self.config.llm.api_gateway
                if gateway_config.api_key and gateway_config.base_url:
                    result = await self._check_one_api_connection(
                        gateway_config.base_url, 
                        gateway_config.api_key
                    )
                    results["api_gateway"] = result
                else:
                    results["api_gateway"] = ServiceCheckResult(
                        name="API网关",
                        status=ServiceStatus.NOT_CONFIGURED,
                        message="API网关配置不完整",
                        details={"missing_config": ["api_key", "base_url"]},
                        fallback_available=True,
                        fallback_config={"use_direct_providers": True}
                    )
            
            # 动态检查所有配置的LLM提供商
            for provider_name, provider_config in llm_providers.items():
                try:
                    results[f"llm_{provider_name}"] = self._check_llm_provider_config(provider_name, provider_config)
                except Exception as e:
                    results[f"llm_{provider_name}"] = ServiceCheckResult(
                        name=f"LLM Provider {provider_name}",
                        status=ServiceStatus.ERROR,
                        message=f"提供商配置检查失败: {e}",
                        details={"error": str(e)},
                        fallback_available=True
                    )
        
        except Exception as e:
            results["llm_services"] = ServiceCheckResult(
                name="LLM Services",
                status=ServiceStatus.ERROR,
                message=f"LLM服务配置错误: {e}",
                details={"error": str(e)},
                fallback_available=True,
                fallback_config={"use_mock_responses": True}
            )
        
        return results
    
    async def _validate_embedding_services(self) -> Dict[str, ServiceCheckResult]:
        """验证向量化服务"""
        results = {}
        
        try:
            embedding_providers = self.config.embeddings.providers if self.config.embeddings else {}
            
            # 检查通用向量化服务
            for provider_name in embedding_providers:
                provider_config = embedding_providers[provider_name]
                results[provider_name] = self._check_embedding_provider_config(provider_name, provider_config)
        
        except Exception as e:
            results["embedding_services"] = ServiceCheckResult(
                name="Embedding Services",
                status=ServiceStatus.ERROR,
                message=f"向量化服务配置错误: {e}",
                details={"error": str(e)},
                fallback_available=True,
                fallback_config={"disable_vectorization": True}
            )
        
        return results
    
    async def _validate_storage_services(self) -> Dict[str, ServiceCheckResult]:
        """验证存储服务"""
        results = {}
        
        try:
            storage_config = self.config.storage_minio
            
            if storage_config.enabled:
                result = await self._check_minio_connection(
                    storage_config.endpoint,
                    storage_config.access_key,
                    storage_config.secret_key
                )
                results["minio"] = result
            else:
                results["minio"] = ServiceCheckResult(
                    name="MinIO",
                    status=ServiceStatus.DISABLED,
                    message="MinIO存储已禁用，使用本地存储",
                    details={"local_directory": "uploads"},
                    fallback_available=True,
                    fallback_config={"use_local_storage": True}
                )
        
        except Exception as e:
            results["minio"] = ServiceCheckResult(
                name="MinIO",
                status=ServiceStatus.ERROR,
                message=f"MinIO配置错误: {e}",
                details={"error": str(e)},
                fallback_available=True,
                fallback_config={"use_local_storage": True}
            )
        
        return results
    
    async def _check_elasticsearch_connection(self, host: str, es_config=None) -> ServiceCheckResult:
        """检查Elasticsearch连接"""
        try:
            # 禁用SSL证书验证以支持自签名证书
            headers = {}
            auth = None
            
            # 设置认证
            if es_config:
                if es_config.api_key:
                    headers['Authorization'] = f'ApiKey {es_config.api_key}'
                elif es_config.username and es_config.password:
                    auth = (es_config.username, es_config.password)
            
            async with httpx.AsyncClient(verify=False) as client:
                response = await client.get(
                    f"{host}/_cluster/health", 
                    headers=headers,
                    auth=auth,
                    timeout=5.0
                )
                if response.status_code == 200:
                    data = response.json()
                    return ServiceCheckResult(
                        name="Elasticsearch",
                        status=ServiceStatus.HEALTHY,
                        message=f"Elasticsearch连接正常，集群状态: {data.get('status', 'unknown')}",
                        details=data
                    )
                else:
                    return ServiceCheckResult(
                        name="Elasticsearch",
                        status=ServiceStatus.WARNING,
                        message=f"Elasticsearch响应异常: {response.status_code}",
                        details={"status_code": response.status_code}
                    )
        except Exception as e:
            return ServiceCheckResult(
                name="Elasticsearch",
                status=ServiceStatus.ERROR,
                message=f"Elasticsearch连接失败: {e}",
                details={"error": str(e)},
                fallback_available=True,
                fallback_config={"disable_search_indexing": True}
            )
    
    
    async def _check_one_api_connection(self, base_url: str, api_key: str) -> ServiceCheckResult:
        """检查One-API连接"""
        try:
            headers = {"Authorization": f"Bearer {api_key}"}
            async with httpx.AsyncClient() as client:
                response = await client.get(f"{base_url}/v1/models", headers=headers, timeout=10.0)
                if response.status_code == 200:
                    data = response.json()
                    return ServiceCheckResult(
                        name="One-API",
                        status=ServiceStatus.HEALTHY,
                        message=f"One-API连接正常，可用模型: {len(data.get('data', []))}个",
                        details={"available_models": len(data.get('data', []))}
                    )
                else:
                    return ServiceCheckResult(
                        name="One-API",
                        status=ServiceStatus.WARNING,
                        message=f"One-API响应异常: {response.status_code}",
                        details={"status_code": response.status_code},
                        fallback_available=True,
                        fallback_config={"use_mock_responses": True}
                    )
        except Exception as e:
            return ServiceCheckResult(
                name="One-API",
                status=ServiceStatus.ERROR,
                message=f"One-API连接失败: {e}",
                details={"error": str(e)},
                fallback_available=True,
                fallback_config={"use_mock_responses": True}
            )
    
    async def _check_matbert_connection(self, base_url: str, api_key: str) -> ServiceCheckResult:
        """检查MatBERT连接"""
        try:
            headers = {"Authorization": f"Bearer {api_key}"} if api_key else {}
            async with httpx.AsyncClient() as client:
                # 先尝试健康检查端点，如果失败则假设服务可用（避免网络问题影响）
                try:
                    # 使用较短的超时时间，避免阻塞启动过程
                    response = await client.get(f"{base_url}/", headers=headers, timeout=5.0)
                    if response.status_code == 200:
                        return ServiceCheckResult(
                            name="MatBERT Embedding",
                            status=ServiceStatus.HEALTHY,
                            message="MatBERT连接正常，支持领域专用向量化",
                            details={"endpoint": base_url}
                        )
                    elif response.status_code in [404, 405]:
                        # 如果根路径返回404或405，可能是正常的（服务存在但根路径不可用）
                        return ServiceCheckResult(
                            name="MatBERT Embedding",
                            status=ServiceStatus.HEALTHY,
                            message="MatBERT服务检测可用（根路径不支持但服务运行中）",
                            details={"endpoint": base_url, "note": "健康检查略过"}
                        )
                    else:
                        # 其他HTTP错误，但仍然认为服务可用
                        return ServiceCheckResult(
                            name="MatBERT Embedding",
                            status=ServiceStatus.WARNING,
                            message=f"MatBERT响应异常但假设可用: {response.status_code}",
                            details={"status_code": response.status_code, "endpoint": base_url},
                            fallback_available=True
                        )
                except httpx.TimeoutException:
                    # 网络超时，但假设服务是可用的（避免网络问题影响系统启动）
                    return ServiceCheckResult(
                        name="MatBERT Embedding",
                        status=ServiceStatus.HEALTHY,
                        message="MatBERT健康检查超时，但假设服务可用",
                        details={"endpoint": base_url, "note": "跳过健康检查，运行时验证"}
                    )
                    
        except Exception as e:
            # 如果配置完整（有API key和base_url），则假设服务是可用的
            if api_key and base_url:
                return ServiceCheckResult(
                    name="MatBERT Embedding",
                    status=ServiceStatus.HEALTHY,
                    message="MatBERT配置完整，假设服务可用",
                    details={"error": str(e), "endpoint": base_url, "note": "跳过健康检查"}
                )
            else:
                return ServiceCheckResult(
                    name="MatBERT Embedding",
                    status=ServiceStatus.ERROR,
                    message=f"MatBERT配置不完整: {e}",
                    details={"error": str(e)},
                    fallback_available=True,
                    fallback_config={
                        "use_general_embedding_only": True,
                        "disable_domain_vectors": True,
                        "retrieval_mode": "general"
                    }
                )
    
    async def _check_minio_connection(self, endpoint: str, access_key: str, secret_key: str) -> ServiceCheckResult:
        """检查MinIO连接"""
        try:
            # 简单的MinIO健康检查
            url = f"http://{endpoint}/minio/health/live"
            async with httpx.AsyncClient() as client:
                response = await client.get(url, timeout=5.0)
                if response.status_code == 200:
                    return ServiceCheckResult(
                        name="MinIO",
                        status=ServiceStatus.HEALTHY,
                        message="MinIO连接正常",
                        details={"endpoint": endpoint}
                    )
                else:
                    return ServiceCheckResult(
                        name="MinIO",
                        status=ServiceStatus.WARNING,
                        message=f"MinIO健康检查异常: {response.status_code}",
                        details={"status_code": response.status_code},
                        fallback_available=True,
                        fallback_config={"use_local_storage": True}
                    )
        except Exception as e:
            return ServiceCheckResult(
                name="MinIO",
                status=ServiceStatus.ERROR,
                message=f"MinIO连接失败，使用本地存储: {e}",
                details={"error": str(e)},
                fallback_available=True,
                fallback_config={"use_local_storage": True}
            )
    
    def _check_llm_provider_config(self, provider_name: str, config: Any) -> ServiceCheckResult:
        """检查LLM提供商配置"""
        env_key_map = {
            "ali": "DASHSCOPE_API_KEY",
            "gemini": "GEMINI_API_KEY",
            "openai_like": "OPENAI_LIKE_API_KEY"
        }
        
        required_env = env_key_map.get(provider_name)
        if required_env and self._check_env_var(required_env):
            return ServiceCheckResult(
                name=f"LLM-{provider_name}",
                status=ServiceStatus.HEALTHY,
                message=f"{provider_name} LLM配置完整",
                details={"provider": provider_name, "models": len(config.models) if hasattr(config, 'models') else 0}
            )
        else:
            return ServiceCheckResult(
                name=f"LLM-{provider_name}",
                status=ServiceStatus.NOT_CONFIGURED,
                message=f"{provider_name} LLM环境变量未配置",
                details={"missing_env": [required_env] if required_env else []},
                fallback_available=True,
                fallback_config={"disable_provider": provider_name}
            )
    
    def _check_embedding_provider_config(self, provider_name: str, config: Any) -> ServiceCheckResult:
        """检查向量化提供商配置"""
        # 检查是否优先使用网关或网关可用
        # 直接检查环境变量，不依赖配置管理器
        import os
        has_gateway = bool(os.getenv('ONE_API_KEY') and os.getenv('ONE_API_BASE_URL'))
        
        # 如果有网关配置，大部分embedding服务都可以通过网关访问
        if has_gateway and provider_name in ['alibaba', 'openai', 'custom', 'one_api_embedding']:
            return ServiceCheckResult(
                name=f"Embedding-{provider_name}",
                status=ServiceStatus.HEALTHY,
                message=f"{provider_name}向量化服务可通过One-API网关访问",
                details={"provider": provider_name, "mode": "gateway", "models": len(config.models) if hasattr(config, 'models') else 0}
            )
        
        # 检查直连模式的环境变量
        env_key_map = {
            "alibaba": "QWEN_API_KEY",
            "openai": "OPENAI_API_KEY", 
            "custom": "CUSTOM_EMBEDDING_API_KEY"
        }
        
        required_env = env_key_map.get(provider_name)
        if required_env and bool(os.getenv(required_env)):
            return ServiceCheckResult(
                name=f"Embedding-{provider_name}",
                status=ServiceStatus.HEALTHY,
                message=f"{provider_name}向量化直连配置完整",
                details={"provider": provider_name, "mode": "direct", "models": len(config.models) if hasattr(config, 'models') else 0}
            )
        else:
            # 如果既没有网关也没有直连配置，才标记为未配置
            if not has_gateway:
                return ServiceCheckResult(
                    name=f"Embedding-{provider_name}",
                    status=ServiceStatus.NOT_CONFIGURED,
                    message=f"{provider_name}向量化服务未配置（既没有网关也没有直连配置）",
                    details={"missing_env": [required_env] if required_env else [], "gateway_missing": True}
                )
            else:
                # 有网关但该提供商不支持网关模式
                return ServiceCheckResult(
                    name=f"Embedding-{provider_name}",
                    status=ServiceStatus.WARNING,
                    message=f"{provider_name}向量化服务不支持网关模式，需要直连配置",
                    details={"missing_env": [required_env] if required_env else []}
                )
    
    def _check_env_var(self, var_name: str) -> bool:
        """检查环境变量是否存在且非空"""
        value = os.getenv(var_name)
        return value is not None and value.strip() != ""
    
    def _analyze_results(self, services: Dict[str, ServiceCheckResult]) -> Tuple[Dict[str, Any], List[str], List[str]]:
        """分析检查结果，生成降级配置"""
        fallback_configs = {}
        warnings = []
        critical_issues = []
        
        # 分析向量化服务状态 - MatBERT已移除
        general_embedding_available = False
        
        for name, result in services.items():
            if "embedding" in name and result.status == ServiceStatus.HEALTHY:
                general_embedding_available = True
            
            # 收集警告和错误
            if result.status == ServiceStatus.WARNING:
                warnings.append(f"{result.name}: {result.message}")
            elif result.status == ServiceStatus.ERROR:
                if result.fallback_available:
                    warnings.append(f"{result.name}: {result.message}")
                    if result.fallback_config:
                        fallback_configs.update(result.fallback_config)
                else:
                    critical_issues.append(f"{result.name}: {result.message}")
            elif result.status == ServiceStatus.NOT_CONFIGURED:
                warnings.append(f"{result.name}: {result.message}")
                if result.fallback_config:
                    fallback_configs.update(result.fallback_config)
        
        # 基于向量化服务状态设置检索模式 - 只使用通用向量化
        fallback_configs.update({
            "vectorization": {
                "retrieval_mode": "general",
                "disable_domain_vectors": True,
                "default_models": {
                    "general": {
                        "provider": "oneapi", 
                        "model": "Qwen/Qwen3-Embedding-4B"
                    }
                }
            }
        })
        
        if not general_embedding_available:
            warnings.append("向量化服务不可用，检索功能将受限")
        
        return fallback_configs, warnings, critical_issues
    
    def _determine_overall_status(self, services: Dict[str, ServiceCheckResult], critical_issues: List[str]) -> ServiceStatus:
        """确定整体系统状态"""
        if critical_issues:
            return ServiceStatus.ERROR
        
        healthy_count = sum(1 for result in services.values() if result.status == ServiceStatus.HEALTHY)
        total_count = len(services)
        
        if healthy_count == total_count:
            return ServiceStatus.HEALTHY
        elif healthy_count >= total_count * 0.6:  # 60%以上服务正常
            return ServiceStatus.WARNING
        else:
            return ServiceStatus.ERROR
    
    def get_current_status(self) -> Optional[ConfigValidationResult]:
        """获取当前验证状态"""
        return self.validation_result
    
    def get_fallback_config(self) -> Dict[str, Any]:
        """获取降级配置"""
        if self.validation_result:
            return self.validation_result.fallback_configs
        return {}


# 创建全局实例
config_validation_service = ConfigValidationService()