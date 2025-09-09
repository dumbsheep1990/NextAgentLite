"""
模型服务管理端点
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Dict, Any, Optional, List
from datetime import datetime, timedelta

from core.logger import logger

router = APIRouter()

class ModelConfig(BaseModel):
    """模型配置模型"""
    llm_models: Dict[str, Any] = Field(
        default={
            "primary": {
                "provider": "anthropic",
                "model": "claude-3-sonnet",
                "api_key": "",
                "base_url": "https://api.anthropic.com",
                "max_tokens": 4000,
                "temperature": 0.7
            },
            "secondary": {
                "provider": "openai",
                "model": "gpt-4",
                "api_key": "",
                "base_url": "https://api.openai.com",
                "max_tokens": 4000,
                "temperature": 0.7
            }
        },
        description="LLM模型配置"
    )
    embedding_models: Dict[str, Any] = Field(
        default={
            "general": {
                "provider": "qwen",
                "model": "text-embedding-v3",
                "api_key": "",
                "base_url": "https://dashscope.aliyuncs.com",
                "dimension": 1024,
                "batch_size": 32
            },
            "domain": {
                "provider": "matbert",
                "model": "matbert-base-v1",
                "api_key": "",
                "base_url": "http://localhost:8080",
                "dimension": 768,
                "batch_size": 16
            }
        },
        description="嵌入模型配置"
    )
    load_balancing: Dict[str, Any] = Field(
        default={
            "enabled": True,
            "strategy": "round_robin",
            "health_check_interval": 30,
            "retry_attempts": 3,
            "timeout": 30
        },
        description="负载均衡配置"
    )

class ModelStatus(BaseModel):
    """模型状态模型"""
    model_name: str
    provider: str
    status: str  # healthy, warning, error, offline
    response_time: Optional[float] = None
    requests_count: int
    success_rate: float
    last_check: str
    error_message: Optional[str] = None

class ModelTest(BaseModel):
    """模型测试请求"""
    provider: str = Field(..., description="服务提供商")
    model: str = Field(..., description="模型名称")
    test_type: str = Field("simple", description="测试类型", pattern="^(simple|full|benchmark)$")
    api_key: Optional[str] = Field(None, description="API密钥")
    base_url: Optional[str] = Field(None, description="基础URL")

@router.get("/config")
async def get_model_config():
    """获取模型服务配置"""
    try:
        config = ModelConfig()
        
        # 移除敏感信息（API密钥）
        safe_config = config.dict()
        for model_type in ["llm_models", "embedding_models"]:
            for model_name, model_config in safe_config[model_type].items():
                if "api_key" in model_config:
                    model_config["api_key"] = "***" if model_config["api_key"] else ""
        
        return {
            "success": True,
            "data": safe_config,
            "message": "获取模型配置成功"
        }
        
    except Exception as e:
        logger.error(f"获取模型配置失败: {e}")
        raise HTTPException(status_code=500, detail="获取模型配置失败")

@router.put("/config")
async def update_model_config(config_update: Dict[str, Any]):
    """更新模型配置"""
    try:
        # 验证配置结构
        allowed_sections = ["llm_models", "embedding_models", "load_balancing"]
        
        updates = {}
        for section, data in config_update.items():
            if section in allowed_sections:
                updates[section] = data
        
        if not updates:
            raise HTTPException(status_code=400, detail="没有提供有效的配置更新")
        
        # 验证模型配置
        for section, models in updates.items():
            if section in ["llm_models", "embedding_models"] and isinstance(models, dict):
                for model_name, model_config in models.items():
                    if not isinstance(model_config, dict):
                        continue
                    
                    # 验证必需字段
                    required_fields = ["provider", "model"]
                    for field in required_fields:
                        if field not in model_config:
                            raise HTTPException(
                                status_code=400, 
                                detail=f"模型 {model_name} 缺少必需字段: {field}"
                            )
        
        return {
            "success": True,
            "data": {
                "updates": updates,
                "updated_at": datetime.utcnow().isoformat(),
                "restart_required": True
            },
            "message": "模型配置更新成功"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"更新模型配置失败: {e}")
        raise HTTPException(status_code=500, detail="配置更新失败")

@router.get("/status")
async def get_model_service_status():
    """获取模型服务状态"""
    try:
        # 模拟各模型的状态
        models_status = [
            ModelStatus(
                model_name="claude-3-sonnet",
                provider="anthropic",
                status="healthy",
                response_time=1.2,
                requests_count=1500,
                success_rate=0.98,
                last_check=datetime.utcnow().isoformat()
            ),
            ModelStatus(
                model_name="gpt-4",
                provider="openai",
                status="warning",
                response_time=2.8,
                requests_count=800,
                success_rate=0.94,
                last_check=datetime.utcnow().isoformat(),
                error_message="响应时间较慢"
            ),
            ModelStatus(
                model_name="text-embedding-v3",
                provider="qwen",
                status="healthy",
                response_time=0.5,
                requests_count=5200,
                success_rate=0.99,
                last_check=datetime.utcnow().isoformat()
            ),
            ModelStatus(
                model_name="matbert-base-v1",
                provider="matbert",
                status="error",
                response_time=None,
                requests_count=0,
                success_rate=0.0,
                last_check=datetime.utcnow().isoformat(),
                error_message="连接超时"
            )
        ]
        
        # 计算整体状态
        healthy_count = len([m for m in models_status if m.status == "healthy"])
        total_count = len(models_status)
        overall_status = "healthy" if healthy_count == total_count else "warning" if healthy_count > 0 else "error"
        
        return {
            "success": True,
            "data": {
                "overall_status": overall_status,
                "healthy_models": healthy_count,
                "total_models": total_count,
                "models": [model.dict() for model in models_status],
                "last_updated": datetime.utcnow().isoformat()
            },
            "message": "获取模型服务状态成功"
        }
        
    except Exception as e:
        logger.error(f"获取模型服务状态失败: {e}")
        raise HTTPException(status_code=500, detail="获取服务状态失败")

@router.post("/test")
async def test_model_service(test_config: ModelTest):
    """测试模型服务连接"""
    try:
        start_time = datetime.utcnow()
        
        # 模拟不同类型的测试
        if test_config.test_type == "simple":
            # 简单连接测试
            test_result = await _simple_model_test(test_config)
        elif test_config.test_type == "full":
            # 完整功能测试
            test_result = await _full_model_test(test_config)
        elif test_config.test_type == "benchmark":
            # 性能基准测试
            test_result = await _benchmark_model_test(test_config)
        else:
            raise HTTPException(status_code=400, detail="无效的测试类型")
        
        end_time = datetime.utcnow()
        test_duration = (end_time - start_time).total_seconds()
        
        return {
            "success": test_result["success"],
            "data": {
                **test_result,
                "test_duration": round(test_duration, 3),
                "tested_at": end_time.isoformat()
            },
            "message": "模型服务测试完成"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"模型服务测试失败: {e}")
        raise HTTPException(status_code=500, detail=f"测试失败: {str(e)}")

@router.get("/usage")
async def get_model_usage_statistics(
    days: int = 7,
    model: Optional[str] = None
):
    """获取模型使用统计"""
    try:
        # 模拟使用统计数据
        usage_data = {
            "period": {
                "days": days,
                "start_date": (datetime.utcnow() - timedelta(days=days)).date().isoformat(),
                "end_date": datetime.utcnow().date().isoformat()
            },
            "total_requests": 15000,
            "total_tokens": 2500000,
            "average_response_time": 1.8,
            "success_rate": 0.97,
            "models": {
                "claude-3-sonnet": {
                    "requests": 8000,
                    "tokens": 1400000,
                    "avg_response_time": 1.2,
                    "success_rate": 0.98,
                    "cost": "$142.50"
                },
                "gpt-4": {
                    "requests": 4000,
                    "tokens": 800000,
                    "avg_response_time": 2.1,
                    "success_rate": 0.96,
                    "cost": "$240.00"
                },
                "text-embedding-v3": {
                    "requests": 2500,
                    "tokens": 250000,
                    "avg_response_time": 0.5,
                    "success_rate": 0.99,
                    "cost": "$12.50"
                },
                "matbert-base-v1": {
                    "requests": 500,
                    "tokens": 50000,
                    "avg_response_time": 0.8,
                    "success_rate": 0.95,
                    "cost": "$0.00"
                }
            },
            "daily_usage": [
                {
                    "date": "2023-12-01",
                    "requests": 2500,
                    "tokens": 420000,
                    "cost": "$65.00"
                },
                {
                    "date": "2023-11-30", 
                    "requests": 2200,
                    "tokens": 380000,
                    "cost": "$58.50"
                }
            ]
        }
        
        # 如果指定了模型，返回该模型的详细数据
        if model and model in usage_data["models"]:
            model_data = usage_data["models"][model]
            return {
                "success": True,
                "data": {
                    "model": model,
                    "period": usage_data["period"],
                    **model_data
                },
                "message": f"获取模型 {model} 使用统计成功"
            }
        
        return {
            "success": True,
            "data": usage_data,
            "message": "获取模型使用统计成功"
        }
        
    except Exception as e:
        logger.error(f"获取模型使用统计失败: {e}")
        raise HTTPException(status_code=500, detail="获取使用统计失败")

@router.get("/providers")
async def get_supported_providers():
    """获取支持的模型提供商"""
    try:
        providers = {
            "llm_providers": [
                {
                    "name": "anthropic",
                    "display_name": "Anthropic",
                    "models": ["claude-3-sonnet", "claude-3-opus", "claude-3-haiku"],
                    "features": ["chat", "completion", "function_calling"],
                    "status": "active"
                },
                {
                    "name": "openai",
                    "display_name": "OpenAI",
                    "models": ["gpt-4", "gpt-3.5-turbo", "gpt-4-turbo"],
                    "features": ["chat", "completion", "function_calling", "vision"],
                    "status": "active"
                },
                {
                    "name": "qwen",
                    "display_name": "通义千问",
                    "models": ["qwen-max", "qwen-plus", "qwen-turbo"],
                    "features": ["chat", "completion"],
                    "status": "active"
                }
            ],
            "embedding_providers": [
                {
                    "name": "qwen",
                    "display_name": "通义千问嵌入",
                    "models": ["text-embedding-v3", "text-embedding-v2"],
                    "features": ["text_embedding"],
                    "max_dimension": 1024,
                    "status": "active"
                },
                {
                    "name": "matbert",
                    "display_name": "MatBERT",
                    "models": ["matbert-base-v1", "matbert-large-v1"],
                    "features": ["domain_embedding"],
                    "max_dimension": 768,
                    "status": "experimental"
                },
                {
                    "name": "openai",
                    "display_name": "OpenAI嵌入",
                    "models": ["text-embedding-3-large", "text-embedding-3-small"],
                    "features": ["text_embedding"],
                    "max_dimension": 3072,
                    "status": "active"
                }
            ]
        }
        
        return {
            "success": True,
            "data": providers,
            "message": "获取支持的提供商成功"
        }
        
    except Exception as e:
        logger.error(f"获取支持的提供商失败: {e}")
        raise HTTPException(status_code=500, detail="获取提供商列表失败")

@router.post("/reload")
async def reload_model_services():
    """重新加载模型服务"""
    try:
        # 模拟重新加载过程
        reload_tasks = [
            "停止现有模型连接",
            "重新读取配置文件",
            "初始化新的模型连接",
            "验证模型可用性",
            "更新路由配置"
        ]
        
        return {
            "success": True,
            "data": {
                "reload_id": f"reload_{int(datetime.utcnow().timestamp())}",
                "status": "started",
                "tasks": reload_tasks,
                "estimated_duration": "30-60 seconds",
                "started_at": datetime.utcnow().isoformat()
            },
            "message": "模型服务重新加载已启动"
        }
        
    except Exception as e:
        logger.error(f"重新加载模型服务失败: {e}")
        raise HTTPException(status_code=500, detail="重新加载失败")

# 测试辅助函数
async def _simple_model_test(test_config: ModelTest) -> Dict[str, Any]:
    """简单模型测试"""
    # 模拟简单连接测试
    if test_config.provider == "matbert" and not test_config.base_url:
        return {
            "success": False,
            "test_type": "simple",
            "provider": test_config.provider,
            "model": test_config.model,
            "error": "MatBERT服务不可用"
        }
    
    return {
        "success": True,
        "test_type": "simple",
        "provider": test_config.provider,
        "model": test_config.model,
        "response_time": 0.8,
        "status": "连接成功"
    }

async def _full_model_test(test_config: ModelTest) -> Dict[str, Any]:
    """完整模型测试"""
    simple_result = await _simple_model_test(test_config)
    
    if not simple_result["success"]:
        return simple_result
    
    # 模拟完整功能测试
    return {
        **simple_result,
        "test_type": "full",
        "features_tested": ["基础连接", "文本生成", "错误处理"],
        "feature_results": {
            "connection": "pass",
            "generation": "pass",
            "error_handling": "pass"
        },
        "quality_score": 0.95
    }

async def _benchmark_model_test(test_config: ModelTest) -> Dict[str, Any]:
    """性能基准测试"""
    full_result = await _full_model_test(test_config)
    
    if not full_result["success"]:
        return full_result
    
    # 模拟性能测试
    return {
        **full_result,
        "test_type": "benchmark",
        "performance_metrics": {
            "requests_per_second": 25.5,
            "average_latency": 1.2,
            "p95_latency": 2.1,
            "throughput": "850 tokens/second",
            "memory_usage": "1.2 GB"
        },
        "benchmark_score": 8.5
    }