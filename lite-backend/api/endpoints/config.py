"""
系统配置管理端点 - 提供前端配置界面的后端支持
支持动态配置修改和实时状态监控
"""
import os
import yaml
from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, Field
from typing import Dict, List, Optional, Any
from datetime import datetime

from core.logger import logger
from core.config_optimized import optimized_config_manager
from core.task_config import task_config

try:
    from service.config_validation_service import config_validation_service, ServiceStatus
except ImportError:
    config_validation_service = None
    ServiceStatus = None

try:
    from service.intelligent_mode_service import intelligent_mode_service, RetrievalMode
except ImportError:
    intelligent_mode_service = None
    RetrievalMode = None

router = APIRouter()

@router.get("/models/current")
async def get_current_model_config():
    """获取当前的模型配置（环境变量优先）"""
    try:
        from service.llm_service import llm_service
        from service.embedding_service import EmbeddingServiceFactory
        
        # 获取LLM模型配置
        llm_models_config = optimized_config_manager.get_llm_models_config()
        embedding_models_config = optimized_config_manager.get_embedding_models_config()
        
        # 获取实际支持的模型列表
        try:
            supported_llm_models = llm_service.get_supported_models()
        except Exception as e:
            logger.warning(f"获取LLM模型失败: {e}")
            supported_llm_models = {}
        
        try:
            supported_embedding_models = await EmbeddingServiceFactory.get_all_models()
        except Exception as e:
            logger.warning(f"获取嵌入模型失败: {e}")
            supported_embedding_models = {}
        
        return {
            "success": True,
            "data": {
                "llm": {
                    "configured_models": llm_models_config['all_models'],
                    "default_model": llm_models_config['default_model'],
                    "by_vendor": llm_models_config['by_vendor'],
                    "supported_models": supported_llm_models,
                    "gateway_enabled": optimized_config_manager.is_gateway_preferred()
                },
                "embedding": {
                    "configured_models": embedding_models_config['all_models'],
                    "default_model": embedding_models_config['default_model'],
                    "by_vendor": embedding_models_config['by_vendor'],
                    "supported_models": supported_embedding_models
                },
                "rerank": {
                    "configured_providers": optimized_config_manager.get_rerank_config(),
                    "default_provider": "alibaba_bailian",
                    "default_model": "gte-rerank-v2"
                },
                "source": "environment_variables",
                "updated_at": datetime.utcnow().isoformat()
            },
            "message": "获取当前模型配置成功"
        }
        
    except Exception as e:
        logger.error(f"获取当前模型配置失败: {e}")
        raise HTTPException(status_code=500, detail=f"获取模型配置失败: {str(e)}")


class ConfigSection(BaseModel):
    """配置分区模型"""
    name: str
    title: str
    description: str
    status: str
    settings: Dict[str, Any]
    editable: bool = True
    requires_restart: bool = False


class ConfigUpdateRequest(BaseModel):
    """配置更新请求"""
    section: str
    settings: Dict[str, Any]
    restart_services: bool = False


class ServiceConfigStatus(BaseModel):
    """服务配置状态"""
    name: str
    status: str
    message: str
    details: Dict[str, Any]
    has_fallback: bool = False
    fallback_active: bool = False


class SystemConfigResponse(BaseModel):
    """系统配置响应"""
    sections: List[ConfigSection]
    service_status: List[ServiceConfigStatus]
    fallback_configs: Dict[str, Any]
    last_validation: Optional[datetime]
    environment_variables: List[str]


@router.get("/", response_model=SystemConfigResponse)
async def get_system_config(request: Request):
    """获取完整系统配置，用于前端配置界面"""
    try:
        # 获取当前配置验证结果
        validation_result = None
        if hasattr(request.app.state, 'config_validation'):
            validation_result = request.app.state.config_validation
        
        # 构建配置分区
        sections = [
            _build_database_config_section(),
            _build_llm_config_section(),
            _build_embedding_config_section(),
            _build_vectorization_config_section(),
            _build_storage_config_section(),
            _build_agent_config_section()
        ]
        
        # 构建服务状态
        service_status = []
        if validation_result:
            for name, result in validation_result.services.items():
                service_status.append(ServiceConfigStatus(
                    name=result.name,
                    status=result.status.value,
                    message=result.message,
                    details=result.details,
                    has_fallback=result.fallback_available,
                    fallback_active=bool(result.fallback_config)
                ))
        
        # 获取降级配置
        fallback_configs = {}
        if hasattr(request.app.state, 'fallback_config'):
            fallback_configs = request.app.state.fallback_config
        
        # 获取需要配置的环境变量
        env_vars = _get_required_environment_variables()
        
        return SystemConfigResponse(
            sections=sections,
            service_status=service_status,
            fallback_configs=fallback_configs,
            last_validation=datetime.now() if validation_result else None,
            environment_variables=env_vars
        )
        
    except Exception as e:
        logger.error(f"获取系统配置失败: {e}")
        raise HTTPException(status_code=500, detail=f"获取系统配置失败: {str(e)}")


@router.post("/validate")
async def validate_config(request: Request):
    """重新验证系统配置"""
    try:
        if config_validation_service:
            validation_result = await config_validation_service.validate_all_services()
            
            # 更新应用状态
            request.app.state.config_validation = validation_result
            if validation_result.fallback_configs:
                request.app.state.fallback_config = validation_result.fallback_configs
            
            return {
                "success": True,
                "message": "配置验证完成",
                "data": {
                    "overall_status": validation_result.overall_status.value,
                    "warnings": validation_result.startup_warnings,
                    "critical_issues": validation_result.critical_issues,
                    "fallback_configs": validation_result.fallback_configs
                }
            }
        else:
            return {
                "success": False,
                "message": "配置验证服务不可用"
            }
            
    except Exception as e:
        logger.error(f"配置验证失败: {e}")
        raise HTTPException(status_code=500, detail=f"配置验证失败: {str(e)}")


@router.put("/update")
async def update_config(config_update: ConfigUpdateRequest):
    """更新配置项"""
    try:
        # 读取当前配置文件
        config_path = "config/config.yaml"
        with open(config_path, 'r', encoding='utf-8') as f:
            config_data = yaml.safe_load(f)
        
        # 更新指定分区的配置
        if config_update.section in config_data.get('default', {}):
            config_data['default'][config_update.section].update(config_update.settings)
            
            # 备份原配置
            backup_path = f"config/config_backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}.yaml"
            with open(backup_path, 'w', encoding='utf-8') as f:
                yaml.safe_dump(config_data, f, allow_unicode=True, default_flow_style=False)
            
            # 写入新配置
            with open(config_path, 'w', encoding='utf-8') as f:
                yaml.safe_dump(config_data, f, allow_unicode=True, default_flow_style=False)
            
            logger.info(f"配置更新成功: {config_update.section}")
            
            restart_required = config_update.restart_services or _section_requires_restart(config_update.section)
            
            return {
                "success": True,
                "message": "配置更新成功",
                "data": {
                    "section": config_update.section,
                    "backup_file": backup_path,
                    "restart_required": restart_required
                }
            }
        else:
            raise HTTPException(status_code=400, detail=f"未知的配置分区: {config_update.section}")
            
    except Exception as e:
        logger.error(f"配置更新失败: {e}")
        raise HTTPException(status_code=500, detail=f"配置更新失败: {str(e)}")


@router.get("/environment-variables")
async def get_environment_variables():
    """获取当前环境变量状态"""
    try:
        required_vars = _get_required_environment_variables()
        current_vars = {}
        
        for var in required_vars:
            value = os.getenv(var)
            current_vars[var] = {
                "configured": value is not None and value.strip() != "",
                "value": "***" if value else None  # 隐藏实际值，只显示是否配置
            }
        
        return {
            "success": True,
            "data": {
                "required_variables": required_vars,
                "current_status": current_vars
            }
        }
        
    except Exception as e:
        logger.error(f"获取环境变量状态失败: {e}")
        raise HTTPException(status_code=500, detail=f"获取环境变量状态失败: {str(e)}")


@router.post("/test-connection/{service_name}")
async def test_service_connection(service_name: str):
    """测试特定服务的连接"""
    try:
        if config_validation_service:
            # 重新验证特定服务
            validation_result = await config_validation_service.validate_all_services()
            
            service_result = None
            for name, result in validation_result.services.items():
                if service_name in name.lower():
                    service_result = result
                    break
            
            if service_result:
                return {
                    "success": True,
                    "data": {
                        "service": service_result.name,
                        "status": service_result.status.value,
                        "message": service_result.message,
                        "details": service_result.details
                    }
                }
            else:
                raise HTTPException(status_code=404, detail=f"服务 {service_name} 未找到")
        else:
            raise HTTPException(status_code=503, detail="配置验证服务不可用")
            
    except Exception as e:
        logger.error(f"测试服务连接失败: {e}")
        raise HTTPException(status_code=500, detail=f"测试服务连接失败: {str(e)}")


@router.get("/retrieval-modes")
async def get_retrieval_modes():
    """获取智能检索模式信息"""
    try:
        if intelligent_mode_service:
            status_report = intelligent_mode_service.get_status_report()
            
            return {
                "success": True,
                "data": {
                    "current_mode": status_report["current_mode"],
                    "available_modes": status_report["available_modes"],
                    "mode_capabilities": status_report["mode_capabilities"],
                    "recommendations": status_report["recommendations"],
                    "fallback_mode": status_report["fallback_mode"]
                }
            }
        else:
            return {
                "success": False,
                "message": "智能模式服务不可用"
            }
            
    except Exception as e:
        logger.error(f"获取检索模式信息失败: {e}")
        raise HTTPException(status_code=500, detail=f"获取检索模式信息失败: {str(e)}")


@router.post("/retrieval-modes/switch")
async def switch_retrieval_mode(mode_data: dict):
    """切换检索模式"""
    try:
        if intelligent_mode_service and RetrievalMode:
            mode_name = mode_data.get("mode")
            if not mode_name:
                raise HTTPException(status_code=400, detail="模式名称不能为空")
            
            try:
                target_mode = RetrievalMode(mode_name)
            except ValueError:
                raise HTTPException(status_code=400, detail=f"无效的检索模式: {mode_name}")
            
            success = intelligent_mode_service.set_mode(target_mode)
            
            if success:
                # 获取新模式的配置
                mode_config = intelligent_mode_service.get_mode_config(target_mode)
                
                return {
                    "success": True,
                    "message": f"检索模式已切换为: {mode_name}",
                    "data": {
                        "current_mode": mode_name,
                        "config": mode_config
                    }
                }
            else:
                available_modes = [mode.value for mode in intelligent_mode_service.get_available_modes()]
                return {
                    "success": False,
                    "message": f"模式 {mode_name} 不可用",
                    "data": {
                        "available_modes": available_modes
                    }
                }
        else:
            return {
                "success": False,
                "message": "智能模式服务不可用"
            }
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"切换检索模式失败: {e}")
        raise HTTPException(status_code=500, detail=f"切换检索模式失败: {str(e)}")


@router.get("/recommendations")
async def get_config_recommendations():
    """获取配置改进建议"""
    try:
        recommendations = []
        
        # 从配置验证服务获取建议
        if config_validation_service:
            validation_result = config_validation_service.get_current_status()
            if validation_result:
                recommendations.extend([
                    {"type": "warning", "message": msg, "category": "service"}
                    for msg in validation_result.startup_warnings
                ])
                recommendations.extend([
                    {"type": "error", "message": msg, "category": "service"}
                    for msg in validation_result.critical_issues
                ])
        
        # 从智能模式服务获取建议
        if intelligent_mode_service:
            mode_recommendations = intelligent_mode_service._get_recommendations()
            recommendations.extend([
                {"type": "improvement", "message": msg, "category": "retrieval"}
                for msg in mode_recommendations
            ])
        
        # 添加通用配置建议
        recommendations.extend(_get_general_recommendations())
        
        return {
            "success": True,
            "data": {
                "recommendations": recommendations,
                "total_count": len(recommendations),
                "categories": list(set([r["category"] for r in recommendations]))
            }
        }
        
    except Exception as e:
        logger.error(f"获取配置建议失败: {e}")
        raise HTTPException(status_code=500, detail=f"获取配置建议失败: {str(e)}")


def _get_general_recommendations() -> List[Dict[str, str]]:
    """获取通用配置建议"""
    recommendations = []
    
    # 检查环境变量配置
    required_env_vars = _get_required_environment_variables()
    missing_vars = []
    
    for var in required_env_vars:
        if not os.getenv(var):
            missing_vars.append(var)
    
    if missing_vars:
        recommendations.append({
            "type": "warning",
            "message": f"以下环境变量未配置: {', '.join(missing_vars[:3])}{'...' if len(missing_vars) > 3 else ''}",
            "category": "environment"
        })
    
    # 检查性能配置
    try:
        vectorization_config = optimized_config_manager.settings.vectorization
        if vectorization_config.retrieval_config.top_k > 20:
            recommendations.append({
                "type": "performance",
                "message": "检索结果数量(top_k)设置较高，可能影响响应速度",
                "category": "performance"
            })
        
        if vectorization_config.retrieval_config.similarity_threshold < 0.5:
            recommendations.append({
                "type": "quality",
                "message": "相似度阈值设置较低，可能返回不相关结果",
                "category": "quality"
            })
    except:
        pass
    
    return recommendations


def _build_database_config_section() -> ConfigSection:
    """构建数据库配置分区"""
    settings = optimized_config_manager.settings
    
    return ConfigSection(
        name="database",
        title="数据库配置",
        description="PostgreSQL、Elasticsearch、ArangoDB配置",
        status="configurable",
        settings={
            "postgresql": {
                "host": settings.database_postgresql.host,
                "port": settings.database_postgresql.port,
                "database": settings.database_postgresql.database,
                "username": settings.database_postgresql.username,
                "pool_size": settings.database_postgresql.pool_size
            },
            "elasticsearch": {
                "hosts": settings.database_elasticsearch.hosts,
                "username": settings.database_elasticsearch.username,
                "index_prefix": settings.database_elasticsearch.index_prefix,
                "timeout": settings.database_elasticsearch.timeout
            },
            "arangodb": {
                "url": settings.database_arangodb.url,
                "database": settings.database_arangodb.database,
                "username": settings.database_arangodb.username,
                "graph_name": settings.database_arangodb.graph_name
            }
        },
        editable=True,
        requires_restart=True
    )


def _build_llm_config_section() -> ConfigSection:
    """构建LLM配置分区（环境变量优先）"""
    # 使用环境变量优先的配置
    llm_models_config = optimized_config_manager.get_llm_models_config()
    gateway_config = optimized_config_manager.get_unified_gateway_config()
    
    # 构建基于环境变量的模型列表
    providers_settings = {}
    
    # 强制使用环境变量配置，如果网关启用
    gateway_enabled = gateway_config.get('enabled', False)
    
    if gateway_enabled and llm_models_config.get('all_models'):
        # 统一网关模式 - 使用环境变量配置的模型
        all_models = llm_models_config['all_models']
        default_model = llm_models_config['default_model']
        by_vendor = llm_models_config.get('by_vendor', {})
        
        # 🔥 新增：从配置文件中获取模型详细信息（包括别名）
        config_models_info = {}
        try:
            llm_config = optimized_config_manager.settings.llm
            if llm_config and hasattr(llm_config, 'gateway') and hasattr(llm_config.gateway, 'available_models'):
                for model_config in llm_config.gateway.available_models:
                    config_models_info[model_config.id] = {
                        'name': model_config.name,
                        'alias': getattr(model_config, 'alias', None),
                        'provider': model_config.provider,
                        'context_length': model_config.context_length,
                        'max_tokens': model_config.max_tokens
                    }
        except Exception as e:
            logger.warning(f"无法从配置文件获取模型详细信息: {e}")
        
        # 构建模型对象
        models_list = []
        for model_id in all_models:
            model_info = config_models_info.get(model_id, {})
            models_list.append({
                "id": model_id,
                "name": model_info.get('name', model_id),
                "alias": model_info.get('alias'),  # 🔥 添加别名字段
                "model_name": model_id,
                "provider": model_info.get('provider', "one_api"),
                "context_length": model_info.get('context_length', 8192),
                "max_tokens": model_info.get('max_tokens', 2048)
            })
        
        providers_settings["one_api"] = {
            "base_url": gateway_config.get('base_url', ''),
            "models": models_list,
            "enabled": True,
            "default_model": default_model,
            "by_vendor": by_vendor
        }
        
        logger.info(f"使用环境变量LLM配置: {len(all_models)}个模型, 默认: {default_model}")
    else:
        # 直连模式 - 回退到配置文件结构
        llm_config = optimized_config_manager.settings.llm
        if llm_config and llm_config.providers:
            for provider_name, provider_config in llm_config.providers.items():
                try:
                    providers_settings[provider_name] = {
                        "base_url": provider_config.direct.base_url if provider_config.direct else "",
                        "models": [model.dict() for model in provider_config.models] if provider_config.models else []
                    }
                except Exception as e:
                    logger.warning(f"构建LLM提供商 {provider_name} 配置失败: {e}")
                    providers_settings[provider_name] = {"base_url": "", "models": []}
        
        logger.info("使用配置文件LLM配置")
    
    return ConfigSection(
        name="llm",
        title="大语言模型配置",
        description="LLM提供商配置",
        status="configurable",
        settings={
            "providers": providers_settings,
            "api_gateway": {
                "enabled": gateway_config.get('enabled', False),
                "base_url": gateway_config.get('base_url', '')
            }
        },
        editable=True,
        requires_restart=False
    )


def _build_embedding_config_section() -> ConfigSection:
    """构建向量化配置分区（环境变量优先）"""
    # 使用环境变量优先的配置
    embedding_models_config = optimized_config_manager.get_embedding_models_config()
    gateway_config = optimized_config_manager.get_unified_gateway_config()
    
    # 构建基于环境变量的模型列表
    providers_settings = {}
    
    # 通用嵌入模型（通过网关）
    gateway_enabled = gateway_config.get('enabled', False)
    if gateway_enabled and embedding_models_config.get('all_models'):
        all_models = embedding_models_config['all_models']
        default_model = embedding_models_config['default_model']
        
        # 构建模型对象
        models_list = []
        for model_id in all_models:
            models_list.append({
                "id": model_id,
                "name": model_id,
                "model_name": model_id,
                "provider": "alibaba",
                "dimension": 1024
            })
        
        providers_settings["alibaba"] = {
            "base_url": gateway_config.get('base_url', ''),
            "models": models_list,
            "enabled": True,
            "default_model": default_model
        }
        
        logger.info(f"使用环境变量嵌入配置: {len(all_models)}个模型, 默认: {default_model}")
    
    
    # 如果没有网关配置，回退到配置文件结构
    if not providers_settings:
        embedding_config = optimized_config_manager.settings.embeddings
        if embedding_config and embedding_config.providers:
            for provider_name, provider_config in embedding_config.providers.items():
                try:
                    providers_settings[provider_name] = {
                        "base_url": provider_config.direct.base_url if provider_config.direct else "",
                        "models": [model.dict() for model in provider_config.models] if provider_config.models else []
                    }
                except Exception as e:
                    logger.warning(f"构建嵌入提供商 {provider_name} 配置失败: {e}")
                    providers_settings[provider_name] = {"base_url": "", "models": []}
        
        logger.info("使用配置文件嵌入配置")
    
    return ConfigSection(
        name="embeddings",
        title="向量化模型配置",
        description="嵌入模型提供商配置",
        status="configurable",
        settings={
            "providers": providers_settings,
            "api_gateway": {
                "enabled": gateway_config.get('enabled', False),
                "base_url": gateway_config.get('base_url', '')
            }
        },
        editable=True,
        requires_restart=False
    )


def _build_vectorization_config_section() -> ConfigSection:
    """构建双向量化系统配置分区"""
    try:
        retrieval_config = optimized_config_manager.settings.retrieval
        if retrieval_config:
            default_embedding = retrieval_config.default_embedding
            settings = {
                "enable_dual_vector": True,  # 从环境变量或默认值
                "default_embedding": {
                    "provider": default_embedding.provider,
                    "model_id": default_embedding.model_id,
                    "fallback": default_embedding.fallback if hasattr(default_embedding, 'fallback') else None
                },
                "vector_search": retrieval_config.vector_search,
                "keyword_search": retrieval_config.keyword_search,
                "hybrid_search": retrieval_config.hybrid_search
            }
        else:
            settings = {
                "enable_dual_vector": True,
                "status": "配置未加载"
            }
    except Exception as e:
        settings = {"error": f"配置获取失败: {str(e)}"}
    
    return ConfigSection(
        name="vectorization",
        title="双向量化系统配置",
        description="通用向量和领域向量的配置与权重",
        status="configurable",
        settings=settings,
        editable=True,
        requires_restart=False
    )


def _build_storage_config_section() -> ConfigSection:
    """构建存储配置分区"""
    storage_config = optimized_config_manager.settings.storage_minio
    
    return ConfigSection(
        name="storage",
        title="对象存储配置",
        description="MinIO对象存储配置",
        status="configurable",
        settings={
            "minio": {
                "enabled": storage_config.enabled,
                "endpoint": storage_config.endpoint,
                "access_key": storage_config.access_key,
                "secure": storage_config.secure,
                "documents_bucket": storage_config.documents_bucket,
                "media_bucket": storage_config.media_bucket,
                "auto_create_buckets": storage_config.auto_create_buckets,
            "skip_bucket_validation": storage_config.skip_bucket_validation
            }
        },
        editable=True,
        requires_restart=True
    )


def _build_agent_config_section() -> ConfigSection:
    """构建智能体配置分区"""
    try:
        agent_config = optimized_config_manager.settings.agents
        settings = {}
        
        if agent_config:
            # 动态构建智能体配置
            for agent_name, agent_instance in agent_config.items():
                try:
                    if hasattr(agent_instance, 'dict'):
                        settings[agent_name] = agent_instance.dict()
                    else:
                        settings[agent_name] = {
                            "name": getattr(agent_instance, 'name', agent_name),
                            "model_provider": getattr(agent_instance, 'model_provider', 'unknown'),
                            "model_id": getattr(agent_instance, 'model_id', 'unknown')
                        }
                except Exception as e:
                    settings[agent_name] = {"error": f"配置解析失败: {str(e)}"}
        else:
            settings = {"status": "智能体配置未加载"}
            
    except Exception as e:
        settings = {"error": f"智能体配置获取失败: {str(e)}"}
    
    return ConfigSection(
        name="agents",
        title="智能体配置",
        description="智能体和团队配置",
        status="configurable",
        settings=settings,
        editable=True,
        requires_restart=False
    )


def _get_required_environment_variables() -> List[str]:
    """获取需要配置的环境变量列表"""
    return [
        # 数据库相关
        "POSTGRESQL_PASSWORD",
        "ELASTICSEARCH_PASSWORD",
        "ARANGODB_PASSWORD",
        
        # LLM相关
        "ONE_API_KEY",
        "ONE_API_BASE_URL",
        "DASHSCOPE_API_KEY",
        "GEMINI_API_KEY",
        
        # 向量化相关
        "QWEN_API_KEY",
        
        # 其他
        "SECRET_KEY"
    ]


def _section_requires_restart(section_name: str) -> bool:
    """判断配置分区是否需要重启"""
    restart_required_sections = ["database", "storage"]
    return section_name in restart_required_sections


# ============================================================================
# 双向量模式控制接口
# ============================================================================

class VectorModeRequest(BaseModel):
    """向量模式请求"""
    enable_dual_vector: bool = Field(..., description="是否启用双向量模式")
    retrieval_mode: str = Field("dual", description="检索模式: dual/general")

class VectorModeResponse(BaseModel):
    """向量模式响应"""
    enable_dual_vector: bool = Field(..., description="当前双向量模式状态")
    retrieval_mode: str = Field(..., description="当前检索模式")
    message: str = Field(..., description="操作结果消息")
    timestamp: datetime = Field(default_factory=datetime.now)

@router.get("/vector-mode", response_model=VectorModeResponse)
async def get_vector_mode():
    """获取当前向量模式配置"""
    try:
        from service.vectorization_config_service import vectorization_config_service
        
        return VectorModeResponse(
            enable_dual_vector=vectorization_config_service.enable_dual_vector,
            retrieval_mode=vectorization_config_service.retrieval_mode,
            message="获取向量模式配置成功"
        )
    except Exception as e:
        logger.error(f"获取向量模式配置失败: {e}")
        raise HTTPException(status_code=500, detail=f"获取向量模式配置失败: {str(e)}")

@router.post("/vector-mode", response_model=VectorModeResponse)
async def update_vector_mode(request: VectorModeRequest):
    """更新向量模式配置（运行时动态切换）"""
    try:
        from service.vectorization_config_service import vectorization_config_service
        
        # 更新运行时配置
        vectorization_config_service.enable_dual_vector = request.enable_dual_vector
        vectorization_config_service.retrieval_mode = request.retrieval_mode
        
        # 记录配置变更
        logger.info(f"向量模式配置已更新 - 双向量: {request.enable_dual_vector}, 检索模式: {request.retrieval_mode}")
        
        message = f"向量模式已切换为: {'双向量模式' if request.enable_dual_vector else '通用向量模式'}"
        
        return VectorModeResponse(
            enable_dual_vector=request.enable_dual_vector,
            retrieval_mode=request.retrieval_mode,
            message=message
        )
    except Exception as e:
        logger.error(f"更新向量模式配置失败: {e}")
        raise HTTPException(status_code=500, detail=f"更新向量模式配置失败: {str(e)}")


# ============================================================================
# 前端认证配置接口
# ============================================================================

class AuthConfigResponse(BaseModel):
    """认证配置响应"""
    username: str = Field(..., description="登录用户名")
    password: str = Field(..., description="登录密码")

@router.get("/auth-credentials", response_model=AuthConfigResponse)
async def get_auth_credentials():
    """获取前端认证凭据"""
    try:
        username = os.getenv("FRONTEND_AUTH_USERNAME", "admin")
        password = os.getenv("FRONTEND_AUTH_PASSWORD", "matscience2025")
        
        logger.info(f"获取认证配置 - 用户名: {username}")
        
        return AuthConfigResponse(
            username=username,
            password=password
        )
    except Exception as e:
        logger.error(f"获取认证配置失败: {e}")
        raise HTTPException(status_code=500, detail=f"获取认证配置失败: {str(e)}")


"""
配置管理 API 端点
提供任务配置的查看和更新功能
"""
from typing import Dict, Any
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from core.task_config import task_config
from core.logger import logger

task_router = APIRouter(prefix="/task", tags=["任务配置"])


class TaskConfigResponse(BaseModel):
    """任务配置响应模型"""
    max_concurrent_tasks: int
    max_batch_document_size: int
    vectorization_batch_size: int
    qa_dataset_batch_size: int
    vectorization_delay: float
    task_heartbeat_interval: int
    task_lock_timeout: int
    max_task_retries: int
    task_expires_hours: int


class TaskConfigUpdateRequest(BaseModel):
    """任务配置更新请求模型"""
    max_concurrent_tasks: int = None
    max_batch_document_size: int = None
    vectorization_batch_size: int = None
    qa_dataset_batch_size: int = None
    vectorization_delay: float = None
    task_heartbeat_interval: int = None
    task_lock_timeout: int = None
    max_task_retries: int = None
    task_expires_hours: int = None


@task_router.get("", response_model=TaskConfigResponse)
async def get_task_config():
    """获取当前任务配置"""
    try:
        return TaskConfigResponse(
            max_concurrent_tasks=task_config.max_concurrent_tasks,
            max_batch_document_size=task_config.max_batch_document_size,
            vectorization_batch_size=task_config.vectorization_batch_size,
            qa_dataset_batch_size=task_config.qa_dataset_batch_size,
            vectorization_delay=task_config.vectorization_delay,
            task_heartbeat_interval=task_config.task_heartbeat_interval,
            task_lock_timeout=task_config.task_lock_timeout,
            max_task_retries=task_config.max_task_retries,
            task_expires_hours=task_config.task_expires_hours
        )
    except Exception as e:
        logger.error(f"获取任务配置失败: {e}")
        raise HTTPException(status_code=500, detail=f"获取任务配置失败: {str(e)}")


@task_router.get("/formatted")
async def get_task_config_formatted():
    """获取格式化的任务配置（用于显示）"""
    try:
        return {
            "success": True,
            "config": str(task_config),
            "raw_values": {
                "max_concurrent_tasks": task_config.max_concurrent_tasks,
                "max_batch_document_size": task_config.max_batch_document_size,
                "vectorization_batch_size": task_config.vectorization_batch_size,
                "qa_dataset_batch_size": task_config.qa_dataset_batch_size,
                "vectorization_delay": task_config.vectorization_delay,
                "task_heartbeat_interval": task_config.task_heartbeat_interval,
                "task_lock_timeout": task_config.task_lock_timeout,
                "max_task_retries": task_config.max_task_retries,
                "task_expires_hours": task_config.task_expires_hours
            }
        }
    except Exception as e:
        logger.error(f"获取格式化任务配置失败: {e}")
        raise HTTPException(status_code=500, detail=f"获取格式化任务配置失败: {str(e)}")


@task_router.post("/reload")
async def reload_task_config():
    """重新加载任务配置（从环境变量）"""
    try:
        old_config = str(task_config)
        task_config.reload()
        new_config = str(task_config)
        
        logger.info("任务配置已重新加载")
        
        return {
            "success": True,
            "message": "任务配置已重新加载",
            "old_config": old_config,
            "new_config": new_config
        }
    except Exception as e:
        logger.error(f"重新加载任务配置失败: {e}")
        raise HTTPException(status_code=500, detail=f"重新加载任务配置失败: {str(e)}")


@task_router.get("/defaults")
async def get_default_task_config():
    """获取默认任务配置值"""
    return {
        "success": True,
        "defaults": {
            "max_concurrent_tasks": "3 (同时运行的最大任务数)",
            "max_batch_document_size": "5 (批量处理文档的最大数量)",
            "vectorization_batch_size": "5 (向量化批处理大小)",
            "qa_dataset_batch_size": "10 (QA数据集批处理大小)",
            "vectorization_delay": "0.1 (向量化任务间延迟秒数)",
            "task_heartbeat_interval": "30 (任务心跳间隔秒数)",
            "task_lock_timeout": "300 (任务锁超时秒数)",
            "max_task_retries": "3 (最大重试次数)",
            "task_expires_hours": "24 (任务过期时间小时数)"
        },
        "environment_variables": {
            "MAX_CONCURRENT_TASKS": "最大并发任务数",
            "MAX_BATCH_DOCUMENT_SIZE": "批量文档处理大小", 
            "VECTORIZATION_BATCH_SIZE": "向量化批次大小",
            "QA_DATASET_BATCH_SIZE": "QA数据集批次大小",
            "VECTORIZATION_DELAY": "向量化延迟时间",
            "TASK_HEARTBEAT_INTERVAL": "任务心跳间隔",
            "TASK_LOCK_TIMEOUT": "任务锁超时时间",
            "MAX_TASK_RETRIES": "最大重试次数",
            "TASK_EXPIRES_HOURS": "任务过期时间"
        }
    }