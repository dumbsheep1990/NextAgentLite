"""
延迟优化服务 - 针对首token延迟问题的综合优化方案
"""
import asyncio
import time
import aiohttp
import yaml
from typing import Dict, List, Optional, Any
from pathlib import Path
from dataclasses import dataclass
import logging

from core.logger import logger
from core.config_optimized import optimized_config_manager


@dataclass
class LatencyMetrics:
    """延迟指标数据结构"""
    first_token_latency: float
    total_response_time: float
    network_latency: float
    model_call_latency: float
    preprocessing_latency: float
    timestamp: float


class ConnectionPoolManager:
    """连接池管理器"""
    
    def __init__(self, config: Dict[str, Any]):
        self.config = config
        self._sessions: Dict[str, aiohttp.ClientSession] = {}
        self._connectors: Dict[str, aiohttp.TCPConnector] = {}
        
    async def get_session(self, base_url: str) -> aiohttp.ClientSession:
        """获取或创建会话"""
        if base_url not in self._sessions:
            await self._create_session(base_url)
        return self._sessions[base_url]
    
    async def _create_session(self, base_url: str):
        """创建优化的HTTP会话"""
        pool_config = self.config.get('connection_pool', {})
        
        # 创建TCP连接器
        connector = aiohttp.TCPConnector(
            limit=pool_config.get('max_connections', 20),
            limit_per_host=pool_config.get('pool_size', 10),
            ttl_dns_cache=self.config.get('networking', {}).get('dns_cache', {}).get('ttl', 300),
            use_dns_cache=True,
            keepalive_timeout=pool_config.get('idle_timeout', 60),
            enable_cleanup_closed=True,
            verify_ssl=self.config.get('request_optimization', {}).get('verify_ssl', True)
        )
        
        # 创建会话
        timeout = aiohttp.ClientTimeout(
            total=pool_config.get('read_timeout', 30),
            connect=pool_config.get('connect_timeout', 5)
        )
        
        session = aiohttp.ClientSession(
            connector=connector,
            timeout=timeout,
            headers={'Connection': 'keep-alive'} if pool_config.get('keep_alive', True) else {}
        )
        
        self._sessions[base_url] = session
        self._connectors[base_url] = connector
        
        logger.info(f"创建优化连接池: {base_url}")
    
    async def close_all(self):
        """关闭所有连接"""
        for session in self._sessions.values():
            await session.close()
        self._sessions.clear()
        self._connectors.clear()


class ModelWarmer:
    """模型预热器"""
    
    def __init__(self, config: Dict[str, Any], connection_manager: ConnectionPoolManager):
        self.config = config
        self.connection_manager = connection_manager
        self.warmed_models: set = set()
    
    async def warmup_models(self) -> bool:
        """预热模型"""
        if not self.config.get('enable_warmup', False):
            return True
            
        models = self.config.get('warmup_models', [])
        queries = self.config.get('warmup_queries', ['Hello'])
        concurrency = self.config.get('warmup_concurrency', 2)
        
        logger.info(f"开始预热 {len(models)} 个模型")
        
        # 获取网关配置
        gateway_config = optimized_config_manager.get_unified_gateway_config()
        if not gateway_config or not gateway_config.get('enabled'):
            logger.warning("网关未配置，跳过模型预热")
            return False
        
        # 创建预热任务
        tasks = []
        for model in models:
            for query in queries:
                task = self._warmup_single_model(
                    model, query, gateway_config
                )
                tasks.append(task)
        
        # 限制并发数
        semaphore = asyncio.Semaphore(concurrency)
        
        async def limited_warmup(task):
            async with semaphore:
                return await task
        
        # 执行预热
        results = await asyncio.gather(
            *[limited_warmup(task) for task in tasks],
            return_exceptions=True
        )
        
        # 统计结果
        success_count = sum(1 for r in results if r is True)
        total_count = len(results)
        
        logger.info(f"模型预热完成: {success_count}/{total_count} 成功")
        return success_count > 0
    
    async def _warmup_single_model(self, model: str, query: str, gateway_config: Dict) -> bool:
        """预热单个模型"""
        try:
            session = await self.connection_manager.get_session(gateway_config['base_url'])
            
            payload = {
                "model": model,
                "messages": [{"role": "user", "content": query}],
                "max_tokens": 10,
                "temperature": 0.1,
                "stream": False
            }
            
            start_time = time.time()
            
            async with session.post(
                f"{gateway_config['base_url']}/chat/completions",
                json=payload,
                headers={"Authorization": f"Bearer {gateway_config['api_key']}"}
            ) as response:
                if response.status == 200:
                    await response.json()  # 确保完整读取响应
                    latency = time.time() - start_time
                    logger.debug(f"模型 {model} 预热成功，延迟: {latency:.3f}s")
                    self.warmed_models.add(model)
                    return True
                else:
                    logger.warning(f"模型 {model} 预热失败: HTTP {response.status}")
                    return False
                    
        except Exception as e:
            logger.warning(f"模型 {model} 预热异常: {e}")
            return False


class StreamingOptimizer:
    """流式优化器"""
    
    def __init__(self, config: Dict[str, Any]):
        self.config = config
        self.streaming_config = config.get('streaming', {})
        
    def optimize_response_generator(self, generator):
        """优化响应生成器"""
        buffer_size = self.streaming_config.get('buffer_size', 1024)
        chunk_size = self.streaming_config.get('chunk_size', 512)
        flush_interval = self.streaming_config.get('flush_interval', 10) / 1000  # 转换为秒
        
        buffer = ""
        last_flush = time.time()
        
        for chunk in generator:
            buffer += chunk
            current_time = time.time()
            
            # 检查是否需要刷新
            should_flush = (
                len(buffer) >= buffer_size or
                current_time - last_flush >= flush_interval
            )
            
            if should_flush and buffer:
                # 按chunk_size分割输出
                while len(buffer) >= chunk_size:
                    yield buffer[:chunk_size]
                    buffer = buffer[chunk_size:]
                
                last_flush = current_time
        
        # 输出剩余内容
        if buffer:
            yield buffer


class LatencyOptimizationService:
    """延迟优化服务主类"""
    
    def __init__(self):
        self.config = self._load_optimization_config()
        self.connection_manager = ConnectionPoolManager(
            self.config.get('model_calling', {})
        )
        self.model_warmer = ModelWarmer(
            self.config.get('model_calling', {}),
            self.connection_manager
        )
        self.streaming_optimizer = StreamingOptimizer(self.config)
        self.metrics_history: List[LatencyMetrics] = []
        
        # 性能监控
        self.monitoring_enabled = self.config.get('monitoring', {}).get('latency_monitoring', False)
        self.alert_thresholds = self.config.get('monitoring', {}).get('alert_thresholds', {})
    
    def _load_optimization_config(self) -> Dict[str, Any]:
        """加载优化配置"""
        config_path = Path(__file__).parent.parent / "config" / "latency_optimization.yaml"
        
        try:
            with open(config_path, 'r', encoding='utf-8') as f:
                config = yaml.safe_load(f)
                return config.get('latency_optimization', {})
        except Exception as e:
            logger.warning(f"加载延迟优化配置失败: {e}")
            return {}
    
    async def initialize(self) -> bool:
        """初始化优化服务"""
        try:
            logger.info("初始化延迟优化服务...")
            
            # 预热模型
            warmup_success = await self.model_warmer.warmup_models()
            
            # 其他初始化
            if self.monitoring_enabled:
                logger.info("启用延迟监控")
            
            logger.info("延迟优化服务初始化完成")
            return warmup_success
            
        except Exception as e:
            logger.error(f"延迟优化服务初始化失败: {e}")
            return False
    
    async def cleanup(self):
        """清理资源"""
        await self.connection_manager.close_all()
        logger.info("延迟优化服务清理完成")
    
    def record_metrics(self, metrics: LatencyMetrics):
        """记录延迟指标"""
        if not self.monitoring_enabled:
            return
            
        self.metrics_history.append(metrics)
        
        # 保持历史记录在合理范围内
        if len(self.metrics_history) > 1000:
            self.metrics_history = self.metrics_history[-500:]
        
        # 检查告警阈值
        self._check_alert_thresholds(metrics)
        
        # 详细日志
        if self.config.get('monitoring', {}).get('detailed_logging', False):
            logger.info(
                f"[METRICS] 首token: {metrics.first_token_latency:.3f}s, "
                f"总时间: {metrics.total_response_time:.3f}s, "
                f"网络: {metrics.network_latency:.3f}s, "
                f"模型: {metrics.model_call_latency:.3f}s"
            )
    
    def _check_alert_thresholds(self, metrics: LatencyMetrics):
        """检查告警阈值"""
        thresholds = self.alert_thresholds
        
        if metrics.first_token_latency > thresholds.get('first_token', 2000) / 1000:
            logger.warning(
                f"首token延迟告警: {metrics.first_token_latency:.3f}s "
                f"超过阈值 {thresholds.get('first_token', 2000)}ms"
            )
        
        if metrics.total_response_time > thresholds.get('total_response', 10000) / 1000:
            logger.warning(
                f"总响应时间告警: {metrics.total_response_time:.3f}s "
                f"超过阈值 {thresholds.get('total_response', 10000)}ms"
            )
        
        if metrics.network_latency > thresholds.get('network_latency', 500) / 1000:
            logger.warning(
                f"网络延迟告警: {metrics.network_latency:.3f}s "
                f"超过阈值 {thresholds.get('network_latency', 500)}ms"
            )
    
    def get_optimization_recommendations(self) -> Dict[str, Any]:
        """获取优化建议"""
        if len(self.metrics_history) < 10:
            return {"message": "数据不足，需要更多请求样本"}
        
        recent_metrics = self.metrics_history[-10:]
        avg_first_token = sum(m.first_token_latency for m in recent_metrics) / len(recent_metrics)
        avg_total_time = sum(m.total_response_time for m in recent_metrics) / len(recent_metrics)
        avg_network = sum(m.network_latency for m in recent_metrics) / len(recent_metrics)
        avg_model_call = sum(m.model_call_latency for m in recent_metrics) / len(recent_metrics)
        
        recommendations = {
            "average_metrics": {
                "first_token_latency": f"{avg_first_token:.3f}s",
                "total_response_time": f"{avg_total_time:.3f}s", 
                "network_latency": f"{avg_network:.3f}s",
                "model_call_latency": f"{avg_model_call:.3f}s"
            },
            "recommendations": []
        }
        
        # 基于指标给出建议
        if avg_first_token > 2.0:
            recommendations["recommendations"].append({
                "issue": "首token延迟过高",
                "suggestion": "考虑启用模型预热和增加连接池大小",
                "priority": "high"
            })
        
        if avg_network > 0.5:
            recommendations["recommendations"].append({
                "issue": "网络延迟较高", 
                "suggestion": "检查网络连接，考虑使用CDN或更近的服务器",
                "priority": "medium"
            })
        
        if avg_model_call > 1.5:
            recommendations["recommendations"].append({
                "issue": "模型调用延迟较高",
                "suggestion": "考虑切换到更快的模型或优化prompt",
                "priority": "medium"
            })
        
        return recommendations
    
    def optimize_agent_model(self, agent_model):
        """优化智能体模型实例"""
        if hasattr(agent_model, 'session'):
            # 如果模型有session属性，优化它
            if hasattr(agent_model.session, '_connector'):
                agent_model.session._connector.limit = self.config.get('model_calling', {}).get('connection_pool', {}).get('max_connections', 20)
        
        # 设置其他优化参数
        if hasattr(agent_model, 'timeout'):
            agent_model.timeout = self.config.get('model_calling', {}).get('connection_pool', {}).get('read_timeout', 30)
        
        return agent_model


# 全局延迟优化服务实例
latency_optimization_service = LatencyOptimizationService()