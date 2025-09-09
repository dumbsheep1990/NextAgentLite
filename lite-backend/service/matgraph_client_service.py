"""
MatGraph客户端服务 - 为Team模式提供知识图谱查询功能
支持与本地MatGraph服务器的HTTP通信，服务地址可通过环境变量配置
"""
import asyncio
import aiohttp
import json
import os
from typing import Dict, List, Optional, Any, Union
from dataclasses import dataclass
from core.logger import logger
from core.config_optimized import optimized_config_manager


@dataclass
class MatGraphQueryResult:
    """MatGraph查询结果数据结构"""
    response: str
    entities: List[Dict] = None
    relationships: List[Dict] = None
    sources: List[Dict] = None
    mode: str = "hybrid"
    query_time: float = 0.0
    success: bool = True
    error_message: str = None


class MatGraphClientService:
    """MatGraph客户端服务"""
    
    def __init__(self):
        # 从环境变量获取MatGraph服务地址，支持Docker部署和本地开发
        self.base_url = os.getenv("MATGRAPH_SERVICE_URL", "http://localhost:9622")
        self.timeout = int(os.getenv("MATGRAPH_REQUEST_TIMEOUT", "30"))  # 30秒超时
        self.session = None
        
        logger.info(f"[MATGRAPH_CLIENT] 初始化MatGraph客户端，服务地址: {self.base_url}")
        
        # 如果是Docker环境，尝试使用内部服务地址
        if os.getenv("MAT_QA_ENV") == "production" and "localhost" in self.base_url:
            self.base_url = "http://mat-backend:8001"  # Docker内部服务地址
            logger.info(f"[MATGRAPH_CLIENT] 检测到生产环境，使用Docker内部地址: {self.base_url}")
        
    async def _get_session(self) -> aiohttp.ClientSession:
        """获取或创建HTTP会话"""
        if self.session is None or self.session.closed:
            timeout = aiohttp.ClientTimeout(total=self.timeout)
            self.session = aiohttp.ClientSession(timeout=timeout)
        return self.session
    
    async def close(self):
        """关闭HTTP会话"""
        if self.session and not self.session.closed:
            await self.session.close()
    
    async def query_knowledge_graph(
        self,
        query: str,
        mode: str = "hybrid",
        top_k: int = 10,
        only_need_context: bool = False,
        max_tokens: int = 4000
    ) -> MatGraphQueryResult:
        """
        查询知识图谱
        
        Args:
            query: 查询文本（英文）
            mode: 查询模式 ("local", "global", "hybrid", "naive", "mix")
            top_k: 返回的最大结果数
            only_need_context: 是否只返回上下文不生成回答
            max_tokens: 最大token数量
            
        Returns:
            MatGraphQueryResult: 查询结果
        """
        import time
        start_time = time.time()
        
        try:
            session = await self._get_session()
            
            # 准备请求数据
            request_data = {
                "query": query,
                "mode": mode,
                "top_k": top_k,
                "only_need_context": only_need_context,
                "max_total_tokens": max_tokens,
                "response_type": "Multiple Paragraphs"
            }
            
            logger.info(f"[MATGRAPH_CLIENT] 开始查询知识图谱: query='{query[:100]}...', mode={mode}")
            
            # 发送POST请求
            async with session.post(
                f"{self.base_url}/query",
                json=request_data,
                headers={"Content-Type": "application/json"}
            ) as response:
                
                if response.status == 200:
                    result_data = await response.json()
                    query_time = time.time() - start_time
                    
                    logger.info(f"[MATGRAPH_CLIENT] 查询成功，耗时: {query_time:.2f}s")
                    
                    return MatGraphQueryResult(
                        response=result_data.get("response", ""),
                        mode=mode,
                        query_time=query_time,
                        success=True
                    )
                else:
                    error_text = await response.text()
                    logger.error(f"[MATGRAPH_CLIENT] 查询失败: HTTP {response.status}, {error_text}")
                    
                    return MatGraphQueryResult(
                        response="",
                        success=False,
                        error_message=f"HTTP {response.status}: {error_text}",
                        query_time=time.time() - start_time
                    )
                    
        except asyncio.TimeoutError:
            logger.error(f"[MATGRAPH_CLIENT] 查询超时: {self.timeout}s")
            return MatGraphQueryResult(
                response="",
                success=False,
                error_message=f"查询超时 ({self.timeout}s)",
                query_time=time.time() - start_time
            )
            
        except Exception as e:
            logger.error(f"[MATGRAPH_CLIENT] 查询异常: {str(e)}")
            return MatGraphQueryResult(
                response="",
                success=False,
                error_message=str(e),
                query_time=time.time() - start_time
            )
    
    async def query_entities(self, query: str, top_k: int = 20) -> MatGraphQueryResult:
        """
        查询实体信息 (local模式)
        
        Args:
            query: 查询文本
            top_k: 返回的实体数量
            
        Returns:
            MatGraphQueryResult: 查询结果
        """
        return await self.query_knowledge_graph(
            query=query,
            mode="local",
            top_k=top_k,
            only_need_context=False
        )
    
    async def query_relationships(self, query: str, top_k: int = 15) -> MatGraphQueryResult:
        """
        查询关系信息 (global模式)
        
        Args:
            query: 查询文本
            top_k: 返回的关系数量
            
        Returns:
            MatGraphQueryResult: 查询结果
        """
        return await self.query_knowledge_graph(
            query=query,
            mode="global",
            top_k=top_k,
            only_need_context=False
        )
    
    async def query_hybrid(self, query: str, top_k: int = 12) -> MatGraphQueryResult:
        """
        混合查询 (hybrid模式) - 推荐使用
        
        Args:
            query: 查询文本
            top_k: 返回的结果数量
            
        Returns:
            MatGraphQueryResult: 查询结果
        """
        return await self.query_knowledge_graph(
            query=query,
            mode="hybrid",
            top_k=top_k,
            only_need_context=False
        )
    
    async def get_context_only(self, query: str, mode: str = "hybrid") -> MatGraphQueryResult:
        """
        只获取上下文信息，不生成回答
        
        Args:
            query: 查询文本
            mode: 查询模式
            
        Returns:
            MatGraphQueryResult: 上下文信息
        """
        return await self.query_knowledge_graph(
            query=query,
            mode=mode,
            only_need_context=True
        )
    
    async def health_check(self) -> bool:
        """
        检查MatGraph服务是否可用
        
        Returns:
            bool: 服务是否正常
        """
        try:
            session = await self._get_session()
            async with session.get(f"{self.base_url}/docs") as response:
                return response.status == 200
        except Exception as e:
            logger.error(f"[MATGRAPH_CLIENT] 健康检查失败: {str(e)}")
            return False


# 创建全局实例
matgraph_client = MatGraphClientService()