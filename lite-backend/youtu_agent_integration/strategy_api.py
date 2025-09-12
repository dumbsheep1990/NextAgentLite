"""
混合策略配置API - Youtu Agent智能路由策略管理
"""
from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
import asyncio
import time
import json
from datetime import datetime, timedelta
import uuid

from core.logger import logger

router = APIRouter(prefix="/strategy", tags=["Hybrid Strategy"])

# 数据模型
class StrategyCondition(BaseModel):
    field: str = Field(..., description="条件字段")
    operator: str = Field(..., description="操作符: equals, contains, greater_than, less_than, regex")
    value: Any = Field(..., description="条件值")
    weight: float = Field(1.0, description="权重")

class StrategyAction(BaseModel):
    type: str = Field(..., description="动作类型: route_to_agno, route_to_youtu, hybrid_execution, fallback")
    config: Dict[str, Any] = Field(default_factory=dict, description="动作配置")
    timeout: int = Field(30000, description="超时时间(ms)")

class StrategyMetrics(BaseModel):
    success_rate: float = Field(0.0, description="成功率")
    avg_response_time: float = Field(0.0, description="平均响应时间")
    total_executions: int = Field(0, description="总执行次数")
    last_execution: Optional[str] = Field(None, description="最后执行时间")

class StrategyConfig(BaseModel):
    id: Optional[str] = Field(None, description="策略ID")
    name: str = Field(..., description="策略名称")
    display_name: str = Field(..., description="显示名称")
    description: str = Field("", description="策略描述")
    type: str = Field(..., description="策略类型")
    enabled: bool = Field(True, description="是否启用")
    priority: int = Field(1, description="优先级")
    conditions: List[StrategyCondition] = Field(default_factory=list, description="条件列表")
    actions: List[StrategyAction] = Field(default_factory=list, description="动作列表")
    config: Dict[str, Any] = Field(default_factory=dict, description="策略配置")
    metrics: Optional[StrategyMetrics] = Field(None, description="性能指标")

class StrategyTestRequest(BaseModel):
    strategy_id: str = Field(..., description="策略ID")
    test_queries: List[str] = Field(..., description="测试查询列表")

class StrategyTestResult(BaseModel):
    strategy_id: str
    test_queries: List[Dict[str, Any]]
    overall_metrics: Dict[str, Any]

# 内存存储（生产环境应使用数据库）
strategies_store: Dict[str, StrategyConfig] = {}
strategy_metrics_store: Dict[str, StrategyMetrics] = {}

# 预定义策略
PREDEFINED_STRATEGIES = {
    "intelligent_routing": {
        "name": "intelligent_routing",
        "display_name": "智能路由策略",
        "description": "基于问题类型和复杂度自动选择最优执行路径",
        "type": "intelligent_routing",
        "enabled": True,
        "priority": 1,
        "config": {
            "complexity_threshold": 0.7,
            "domain_detection": True,
            "fallback_strategy": "agno",
            "timeout": 30000
        },
        "conditions": [
            {
                "field": "query_complexity",
                "operator": "greater_than",
                "value": 0.7,
                "weight": 1.0
            },
            {
                "field": "domain",
                "operator": "equals",
                "value": "web_research",
                "weight": 0.8
            }
        ],
        "actions": [
            {
                "type": "route_to_youtu",
                "config": {"environment": "browser"},
                "timeout": 30000
            },
            {
                "type": "fallback",
                "config": {"target": "agno"},
                "timeout": 15000
            }
        ]
    },
    "performance_balanced": {
        "name": "performance_balanced",
        "display_name": "性能平衡策略",
        "description": "在响应速度和准确性之间寻找最佳平衡点",
        "type": "performance_balanced",
        "enabled": False,
        "priority": 2,
        "config": {
            "speed_weight": 0.6,
            "accuracy_weight": 0.4,
            "cache_enabled": True,
            "parallel_execution": False
        },
        "conditions": [
            {
                "field": "response_time_requirement",
                "operator": "less_than",
                "value": 5000,
                "weight": 1.0
            }
        ],
        "actions": [
            {
                "type": "hybrid_execution",
                "config": {"parallel": False, "cache": True},
                "timeout": 25000
            }
        ]
    },
    "domain_specialized": {
        "name": "domain_specialized",
        "display_name": "领域专业化策略",
        "description": "根据特定领域知识选择专门的处理路径",
        "type": "domain_specialized",
        "enabled": False,
        "priority": 3,
        "config": {
            "domain_mapping": {
                "knowledge_qa": "agno",
                "web_research": "youtu",
                "code_analysis": "youtu",
                "document_processing": "hybrid"
            },
            "confidence_threshold": 0.8
        },
        "conditions": [
            {
                "field": "domain_confidence",
                "operator": "greater_than",
                "value": 0.8,
                "weight": 1.0
            }
        ],
        "actions": [
            {
                "type": "route_to_agno",
                "config": {"domain": "knowledge_qa"},
                "timeout": 20000
            },
            {
                "type": "route_to_youtu",
                "config": {"domain": "web_research"},
                "timeout": 35000
            }
        ]
    }
}

async def initialize_strategies():
    """初始化预定义策略"""
    for strategy_id, strategy_data in PREDEFINED_STRATEGIES.items():
        if strategy_id not in strategies_store:
            strategy = StrategyConfig(
                id=strategy_id,
                **strategy_data,
                metrics=StrategyMetrics(
                    success_rate=85.0 + (hash(strategy_id) % 15),
                    avg_response_time=1000 + (hash(strategy_id) % 2000),
                    total_executions=100 + (hash(strategy_id) % 900),
                    last_execution=datetime.now().isoformat()
                )
            )
            strategies_store[strategy_id] = strategy

@router.on_event("startup")
async def startup_event():
    await initialize_strategies()

@router.get("/list", response_model=List[StrategyConfig])
async def list_strategies():
    """获取所有策略配置"""
    try:
        await initialize_strategies()
        return list(strategies_store.values())
    except Exception as e:
        logger.error(f"获取策略列表失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{strategy_id}", response_model=StrategyConfig)
async def get_strategy(strategy_id: str):
    """获取特定策略配置"""
    try:
        if strategy_id not in strategies_store:
            raise HTTPException(status_code=404, detail="策略不存在")
        return strategies_store[strategy_id]
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"获取策略配置失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/create", response_model=StrategyConfig)
async def create_strategy(strategy: StrategyConfig):
    """创建新策略"""
    try:
        if not strategy.id:
            strategy.id = str(uuid.uuid4())
        
        if strategy.id in strategies_store:
            raise HTTPException(status_code=400, detail="策略ID已存在")
        
        # 初始化指标
        strategy.metrics = StrategyMetrics(
            success_rate=0.0,
            avg_response_time=0.0,
            total_executions=0,
            last_execution=None
        )
        
        strategies_store[strategy.id] = strategy
        logger.info(f"创建策略成功: {strategy.id}")
        return strategy
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"创建策略失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/{strategy_id}", response_model=StrategyConfig)
async def update_strategy(strategy_id: str, strategy: StrategyConfig):
    """更新策略配置"""
    try:
        if strategy_id not in strategies_store:
            raise HTTPException(status_code=404, detail="策略不存在")
        
        strategy.id = strategy_id
        # 保留原有指标
        if strategies_store[strategy_id].metrics:
            strategy.metrics = strategies_store[strategy_id].metrics
        
        strategies_store[strategy_id] = strategy
        logger.info(f"更新策略成功: {strategy_id}")
        return strategy
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"更新策略失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{strategy_id}")
async def delete_strategy(strategy_id: str):
    """删除策略"""
    try:
        if strategy_id not in strategies_store:
            raise HTTPException(status_code=404, detail="策略不存在")
        
        # 不允许删除预定义策略
        if strategy_id in PREDEFINED_STRATEGIES:
            raise HTTPException(status_code=400, detail="不能删除预定义策略")
        
        del strategies_store[strategy_id]
        logger.info(f"删除策略成功: {strategy_id}")
        return {"message": "策略删除成功"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"删除策略失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{strategy_id}/enable")
async def enable_strategy(strategy_id: str):
    """启用策略"""
    try:
        if strategy_id not in strategies_store:
            raise HTTPException(status_code=404, detail="策略不存在")
        
        strategies_store[strategy_id].enabled = True
        logger.info(f"启用策略: {strategy_id}")
        return {"message": "策略已启用"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"启用策略失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{strategy_id}/disable")
async def disable_strategy(strategy_id: str):
    """禁用策略"""
    try:
        if strategy_id not in strategies_store:
            raise HTTPException(status_code=404, detail="策略不存在")
        
        strategies_store[strategy_id].enabled = False
        logger.info(f"禁用策略: {strategy_id}")
        return {"message": "策略已禁用"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"禁用策略失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{strategy_id}/test", response_model=StrategyTestResult)
async def test_strategy(strategy_id: str, test_request: StrategyTestRequest):
    """测试策略"""
    try:
        if strategy_id not in strategies_store:
            raise HTTPException(status_code=404, detail="策略不存在")
        
        strategy = strategies_store[strategy_id]
        
        # 模拟策略测试
        test_results = []
        total_response_time = 0
        success_count = 0
        
        for query in test_request.test_queries:
            # 模拟路由决策
            route = await simulate_routing_decision(strategy, query)
            response_time = 1000 + (hash(query) % 2000)  # 模拟响应时间
            success = (hash(query) % 10) > 1  # 90%成功率
            
            if success:
                success_count += 1
            total_response_time += response_time
            
            test_results.append({
                "query": query,
                "route": route,
                "response_time": response_time,
                "success": success
            })
        
        # 计算总体指标
        overall_metrics = {
            "success_rate": (success_count / len(test_request.test_queries)) * 100,
            "avg_response_time": total_response_time / len(test_request.test_queries),
            "routing_accuracy": 95.0  # 模拟路由准确率
        }
        
        # 更新策略指标
        if strategy.metrics:
            strategy.metrics.total_executions += len(test_request.test_queries)
            strategy.metrics.success_rate = overall_metrics["success_rate"]
            strategy.metrics.avg_response_time = overall_metrics["avg_response_time"]
            strategy.metrics.last_execution = datetime.now().isoformat()
        
        result = StrategyTestResult(
            strategy_id=strategy_id,
            test_queries=test_results,
            overall_metrics=overall_metrics
        )
        
        logger.info(f"策略测试完成: {strategy_id}")
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"策略测试失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))

async def simulate_routing_decision(strategy: StrategyConfig, query: str) -> str:
    """模拟路由决策"""
    # 基于策略类型和查询内容模拟路由决策
    if strategy.type == "intelligent_routing":
        if "搜索" in query or "网页" in query:
            return "youtu"
        elif "材料" in query or "知识" in query:
            return "agno"
        else:
            return "hybrid"
    elif strategy.type == "performance_balanced":
        return "hybrid"
    elif strategy.type == "domain_specialized":
        if "代码" in query:
            return "youtu"
        else:
            return "agno"
    else:
        return "agno"

@router.get("/analytics/performance")
async def get_performance_analytics():
    """获取性能分析数据"""
    try:
        # 模拟性能分析数据
        analytics_data = {
            "strategy_comparison": [
                {
                    "strategy_id": "intelligent_routing",
                    "success_rate": 92.5,
                    "avg_response_time": 1800,
                    "total_executions": 1250
                },
                {
                    "strategy_id": "performance_balanced",
                    "success_rate": 88.3,
                    "avg_response_time": 1200,
                    "total_executions": 890
                },
                {
                    "strategy_id": "domain_specialized",
                    "success_rate": 95.1,
                    "avg_response_time": 2100,
                    "total_executions": 650
                }
            ],
            "route_distribution": [
                {"route": "agno", "percentage": 45.2},
                {"route": "youtu", "percentage": 32.8},
                {"route": "hybrid", "percentage": 22.0}
            ],
            "time_series": [
                {
                    "timestamp": (datetime.now() - timedelta(hours=i)).isoformat(),
                    "success_rate": 85 + (i % 15),
                    "response_time": 1500 + (i % 1000),
                    "qps": 20 + (i % 30)
                }
                for i in range(24, 0, -1)
            ]
        }
        
        return analytics_data
    except Exception as e:
        logger.error(f"获取性能分析数据失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/health")
async def health_check():
    """健康检查"""
    try:
        return {
            "status": "healthy",
            "strategies_count": len(strategies_store),
            "enabled_strategies": len([s for s in strategies_store.values() if s.enabled]),
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        logger.error(f"健康检查失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))
