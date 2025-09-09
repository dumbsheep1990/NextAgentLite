"""
延迟优化API端点
"""
from fastapi import APIRouter, HTTPException, Depends, Query
from pydantic import BaseModel, Field
from typing import Dict, List, Optional, Any
import time

from core.logger import logger

# 导入延迟优化服务
try:
    from service.latency_optimization_service import latency_optimization_service
    _has_latency_optimization = True
except ImportError:
    _has_latency_optimization = False
    latency_optimization_service = None

router = APIRouter()


class LatencyMetricsResponse(BaseModel):
    """延迟指标响应模型"""
    first_token_latency: float = Field(..., description="首token延迟(秒)")
    total_response_time: float = Field(..., description="总响应时间(秒)")
    network_latency: float = Field(..., description="网络延迟(秒)")
    model_call_latency: float = Field(..., description="模型调用延迟(秒)")
    preprocessing_latency: float = Field(..., description="预处理延迟(秒)")
    timestamp: float = Field(..., description="时间戳")


class OptimizationRecommendation(BaseModel):
    """优化建议模型"""
    issue: str = Field(..., description="问题描述")
    suggestion: str = Field(..., description="优化建议")
    priority: str = Field(..., description="优先级: high/medium/low")


class OptimizationRecommendationsResponse(BaseModel):
    """优化建议响应模型"""
    average_metrics: Dict[str, str] = Field(..., description="平均指标")
    recommendations: List[OptimizationRecommendation] = Field(..., description="优化建议列表")


@router.get("/metrics/recent", response_model=List[LatencyMetricsResponse])
async def get_recent_metrics(
    limit: int = Query(10, ge=1, le=100, description="返回的指标数量")
):
    """
    获取最近的延迟指标
    """
    if not _has_latency_optimization or not latency_optimization_service:
        raise HTTPException(status_code=503, detail="延迟优化服务不可用")
    
    try:
        metrics_history = latency_optimization_service.metrics_history
        
        if not metrics_history:
            return []
        
        # 获取最近的指标
        recent_metrics = metrics_history[-limit:]
        
        return [
            LatencyMetricsResponse(
                first_token_latency=m.first_token_latency,
                total_response_time=m.total_response_time,
                network_latency=m.network_latency,
                model_call_latency=m.model_call_latency,
                preprocessing_latency=m.preprocessing_latency,
                timestamp=m.timestamp
            )
            for m in recent_metrics
        ]
        
    except Exception as e:
        logger.error(f"获取延迟指标失败: {e}")
        raise HTTPException(status_code=500, detail=f"获取延迟指标失败: {str(e)}")


@router.get("/metrics/average")
async def get_average_metrics(
    time_window: int = Query(300, ge=60, le=3600, description="时间窗口(秒)")
):
    """
    获取指定时间窗口内的平均延迟指标
    """
    if not _has_latency_optimization or not latency_optimization_service:
        raise HTTPException(status_code=503, detail="延迟优化服务不可用")
    
    try:
        metrics_history = latency_optimization_service.metrics_history
        
        if not metrics_history:
            return {
                "message": "暂无延迟数据",
                "time_window": time_window,
                "metrics_count": 0
            }
        
        # 过滤时间窗口内的指标
        current_time = time.time()
        filtered_metrics = [
            m for m in metrics_history
            if current_time - m.timestamp <= time_window
        ]
        
        if not filtered_metrics:
            return {
                "message": f"在过去{time_window}秒内无延迟数据",
                "time_window": time_window,
                "metrics_count": 0
            }
        
        # 计算平均值
        count = len(filtered_metrics)
        avg_first_token = sum(m.first_token_latency for m in filtered_metrics) / count
        avg_total_time = sum(m.total_response_time for m in filtered_metrics) / count
        avg_network = sum(m.network_latency for m in filtered_metrics) / count
        avg_model_call = sum(m.model_call_latency for m in filtered_metrics) / count
        avg_preprocessing = sum(m.preprocessing_latency for m in filtered_metrics) / count
        
        return {
            "time_window": time_window,
            "metrics_count": count,
            "average_metrics": {
                "first_token_latency": f"{avg_first_token:.3f}s",
                "total_response_time": f"{avg_total_time:.3f}s",
                "network_latency": f"{avg_network:.3f}s",
                "model_call_latency": f"{avg_model_call:.3f}s",
                "preprocessing_latency": f"{avg_preprocessing:.3f}s"
            },
            "raw_values": {
                "first_token_latency": avg_first_token,
                "total_response_time": avg_total_time,
                "network_latency": avg_network,
                "model_call_latency": avg_model_call,
                "preprocessing_latency": avg_preprocessing
            }
        }
        
    except Exception as e:
        logger.error(f"获取平均延迟指标失败: {e}")
        raise HTTPException(status_code=500, detail=f"获取平均延迟指标失败: {str(e)}")


@router.get("/recommendations", response_model=OptimizationRecommendationsResponse)
async def get_optimization_recommendations():
    """
    获取延迟优化建议
    """
    if not _has_latency_optimization or not latency_optimization_service:
        raise HTTPException(status_code=503, detail="延迟优化服务不可用")
    
    try:
        recommendations_data = latency_optimization_service.get_optimization_recommendations()
        
        if "message" in recommendations_data:
            # 数据不足的情况
            return OptimizationRecommendationsResponse(
                average_metrics={"message": recommendations_data["message"]},
                recommendations=[]
            )
        
        # 转换建议格式
        recommendations = [
            OptimizationRecommendation(**rec)
            for rec in recommendations_data.get("recommendations", [])
        ]
        
        return OptimizationRecommendationsResponse(
            average_metrics=recommendations_data.get("average_metrics", {}),
            recommendations=recommendations
        )
        
    except Exception as e:
        logger.error(f"获取优化建议失败: {e}")
        raise HTTPException(status_code=500, detail=f"获取优化建议失败: {str(e)}")


@router.post("/warmup")
async def warmup_models():
    """
    手动触发模型预热
    """
    if not _has_latency_optimization or not latency_optimization_service:
        raise HTTPException(status_code=503, detail="延迟优化服务不可用")
    
    try:
        logger.info("手动触发模型预热")
        
        # 触发模型预热
        success = await latency_optimization_service.model_warmer.warmup_models()
        
        if success:
            warmed_models = list(latency_optimization_service.model_warmer.warmed_models)
            return {
                "success": True,
                "message": "模型预热完成",
                "warmed_models": warmed_models,
                "timestamp": time.time()
            }
        else:
            return {
                "success": False,
                "message": "模型预热失败，请检查配置和网络连接",
                "timestamp": time.time()
            }
        
    except Exception as e:
        logger.error(f"模型预热失败: {e}")
        raise HTTPException(status_code=500, detail=f"模型预热失败: {str(e)}")


@router.get("/status")
async def get_optimization_status():
    """
    获取延迟优化服务状态
    """
    if not _has_latency_optimization:
        return {
            "available": False,
            "message": "延迟优化服务未安装"
        }
    
    if not latency_optimization_service:
        return {
            "available": False,
            "message": "延迟优化服务未初始化"
        }
    
    try:
        config = latency_optimization_service.config
        metrics_count = len(latency_optimization_service.metrics_history)
        warmed_models = list(latency_optimization_service.model_warmer.warmed_models)
        
        return {
            "available": True,
            "monitoring_enabled": latency_optimization_service.monitoring_enabled,
            "warmup_enabled": config.get('model_calling', {}).get('enable_warmup', False),
            "metrics_collected": metrics_count,
            "warmed_models": warmed_models,
            "alert_thresholds": latency_optimization_service.alert_thresholds,
            "timestamp": time.time()
        }
        
    except Exception as e:
        logger.error(f"获取优化服务状态失败: {e}")
        return {
            "available": False,
            "message": f"服务状态检查失败: {str(e)}"
        }


@router.delete("/metrics")
async def clear_metrics():
    """
    清除延迟指标历史
    """
    if not _has_latency_optimization or not latency_optimization_service:
        raise HTTPException(status_code=503, detail="延迟优化服务不可用")
    
    try:
        old_count = len(latency_optimization_service.metrics_history)
        latency_optimization_service.metrics_history.clear()
        
        logger.info(f"清除了 {old_count} 条延迟指标记录")
        
        return {
            "success": True,
            "message": f"已清除 {old_count} 条延迟指标记录",
            "timestamp": time.time()
        }
        
    except Exception as e:
        logger.error(f"清除延迟指标失败: {e}")
        raise HTTPException(status_code=500, detail=f"清除延迟指标失败: {str(e)}")