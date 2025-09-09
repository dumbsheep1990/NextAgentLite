"""
MatGraph客户端服务 - 为Team模式提供知识图谱查询功能
支持与本地MatGraph服务器(端口9622)的HTTP通信，包括流式查询和图谱数据获取
"""
import asyncio
import aiohttp
import json
import os
from typing import Dict, List, Optional, Any, Union, AsyncGenerator
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
    
    def to_dict(self) -> Dict:
        """转换为可JSON序列化的字典"""
        return {
            'response': self.response,
            'entities': self.entities or [],
            'relationships': self.relationships or [],
            'sources': self.sources or [],
            'mode': self.mode,
            'query_time': self.query_time,
            'success': self.success,
            'error_message': self.error_message
        }


@dataclass
class GraphData:
    """图谱数据结构"""
    nodes: List[Dict]
    edges: List[Dict]
    is_truncated: bool = False
    
    def to_dict(self) -> Dict:
        """转换为可JSON序列化的字典"""
        return {
            'nodes': self.nodes,
            'edges': self.edges,
            'is_truncated': self.is_truncated
        }


class MatGraphClientService:
    """MatGraph客户端服务"""
    
    def __init__(self):
        self.base_url = os.getenv("MATGRAPH_SERVICE_URL", "http://localhost:9622")
        self.timeout = 60  # 60秒超时，适应流式查询
        self.session = None
        
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
        mode: str = "mix",
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
            
            logger.info(f"[MATGRAPH] 开始查询知识图谱: query='{query[:100]}...', mode={mode}")
            
            # 发送POST请求
            async with session.post(
                f"{self.base_url}/query",
                json=request_data,
                headers={"Content-Type": "application/json"}
            ) as response:
                
                if response.status == 200:
                    result_data = await response.json()
                    query_time = time.time() - start_time
                    
                    logger.info(f"[MATGRAPH] 查询成功，耗时: {query_time:.2f}s")
                    
                    # 🔥 简化逻辑：直接使用图谱查询响应作为展示内容
                    response_text = result_data.get("response", "")
                    entities = []
                    relationships = []
                    sources = []
                    
                    if response_text:
                        # 创建基于响应内容的来源
                        sources = [{
                            "content": response_text,
                            "source": "MatGraph Knowledge Graph",
                            "score": 0.95,
                            "type": "graph_query_result"
                        }]
                        
                        logger.info(f"[MATGRAPH] 图谱查询响应长度: {len(response_text)} 字符")
                    else:
                        logger.warning(f"[MATGRAPH] 图谱查询未返回有效响应")
                    
                    logger.info(f"[MATGRAPH] 图谱检索结果: 响应={len(response_text)}字符, 来源={len(sources)}个")
                    
                    return MatGraphQueryResult(
                        response=response_text,
                        entities=entities,
                        relationships=relationships,
                        sources=sources,
                        mode=mode,
                        query_time=query_time,
                        success=True
                    )
                else:
                    error_text = await response.text()
                    logger.error(f"[MATGRAPH] 查询失败: HTTP {response.status}, {error_text}")
                    
                    return MatGraphQueryResult(
                        response="",
                        success=False,
                        error_message=f"HTTP {response.status}: {error_text}",
                        query_time=time.time() - start_time
                    )
                    
        except asyncio.TimeoutError:
            logger.error(f"[MATGRAPH] 查询超时: {self.timeout}s")
            return MatGraphQueryResult(
                response="",
                success=False,
                error_message=f"查询超时 ({self.timeout}s)",
                query_time=time.time() - start_time
            )
            
        except Exception as e:
            logger.error(f"[MATGRAPH] 查询异常: {str(e)}")
            return MatGraphQueryResult(
                response="",
                success=False,
                error_message=str(e),
                query_time=time.time() - start_time
            )
    
    async def query_knowledge_graph_stream(
        self,
        query: str,
        mode: str = "mix",
        top_k: int = 10,
        only_need_context: bool = False,
        max_tokens: int = 4000
    ) -> AsyncGenerator[str, None]:
        """
        流式查询知识图谱
        
        Args:
            query: 查询文本（英文）
            mode: 查询模式 ("local", "global", "hybrid", "naive", "mix")
            top_k: 返回的最大结果数
            only_need_context: 是否只返回上下文不生成回答
            max_tokens: 最大token数量
            
        Yields:
            str: 流式响应文本片段
        """
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
            
            logger.info(f"[MATGRAPH] 开始流式查询: query='{query[:100]}...', mode={mode}")
            
            # 发送POST请求到流式端点
            async with session.post(
                f"{self.base_url}/query/stream",
                json=request_data,
                headers={"Content-Type": "application/json"}
            ) as response:
                
                if response.status == 200:
                    async for line in response.content:
                        if line:
                            try:
                                # 每行都是一个JSON对象
                                line_str = line.decode('utf-8').strip()
                                if line_str:
                                    data = json.loads(line_str)
                                    if 'response' in data:
                                        yield data['response']
                            except json.JSONDecodeError:
                                continue
                            except Exception as e:
                                logger.warning(f"[MATGRAPH] 解析流式响应异常: {e}")
                                continue
                else:
                    error_text = await response.text()
                    logger.error(f"[MATGRAPH] 流式查询失败: HTTP {response.status}, {error_text}")
                    yield f"Error: HTTP {response.status} - {error_text}"
                    
        except Exception as e:
            logger.error(f"[MATGRAPH] 流式查询异常: {str(e)}")
            yield f"Error: {str(e)}"
    
    async def get_graph_data(
        self,
        label: str,
        max_depth: int = 3,
        max_nodes: int = 50
    ) -> Optional[GraphData]:
        """
        获取知识图谱数据
        
        Args:
            label: 实体标签
            max_depth: 最大深度
            max_nodes: 最大节点数
            
        Returns:
            GraphData: 图谱数据，失败时返回None
        """
        try:
            session = await self._get_session()
            
            # URL编码参数
            params = {
                "label": label,
                "max_depth": max_depth,
                "max_nodes": max_nodes
            }
            
            logger.info(f"[MATGRAPH] 获取图谱数据: label='{label}', depth={max_depth}, nodes={max_nodes}")
            
            async with session.get(
                f"{self.base_url}/graphs",
                params=params
            ) as response:
                
                if response.status == 200:
                    result_data = await response.json()
                    
                    return GraphData(
                        nodes=result_data.get("nodes", []),
                        edges=result_data.get("edges", []),
                        is_truncated=result_data.get("is_truncated", False)
                    )
                else:
                    error_text = await response.text()
                    logger.error(f"[MATGRAPH] 获取图谱数据失败: HTTP {response.status}, {error_text}")
                    return None
                    
        except Exception as e:
            logger.error(f"[MATGRAPH] 获取图谱数据异常: {str(e)}")
            return None
    
    async def check_entity_exists(self, entity_name: str) -> bool:
        """
        检查实体是否存在
        
        Args:
            entity_name: 实体名称
            
        Returns:
            bool: 实体是否存在
        """
        try:
            session = await self._get_session()
            
            params = {"name": entity_name}
            
            async with session.get(
                f"{self.base_url}/graph/entity/exists",
                params=params
            ) as response:
                
                if response.status == 200:
                    result_data = await response.json()
                    return result_data.get("exists", False)
                else:
                    logger.error(f"[MATGRAPH] 检查实体存在失败: HTTP {response.status}")
                    return False
                    
        except Exception as e:
            logger.error(f"[MATGRAPH] 检查实体存在异常: {str(e)}")
            return False
    
    async def get_graph_labels(self) -> List[str]:
        """
        获取所有图谱标签
        
        Returns:
            List[str]: 标签列表
        """
        try:
            session = await self._get_session()
            
            async with session.get(f"{self.base_url}/graph/label/list") as response:
                
                if response.status == 200:
                    labels = await response.json()
                    return labels if isinstance(labels, list) else []
                else:
                    logger.error(f"[MATGRAPH] 获取标签失败: HTTP {response.status}")
                    return []
                    
        except Exception as e:
            logger.error(f"[MATGRAPH] 获取标签异常: {str(e)}")
            return []
    
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
    
    async def query_mix(self, query: str, top_k: int = 12) -> MatGraphQueryResult:
        """
        混合查询 (mix模式) - MatGraph推荐模式
        
        Args:
            query: 查询文本
            top_k: 返回的结果数量
            
        Returns:
            MatGraphQueryResult: 查询结果
        """
        return await self.query_knowledge_graph(
            query=query,
            mode="mix",
            top_k=top_k,
            only_need_context=False
        )
    
    async def get_context_only(self, query: str, mode: str = "mix") -> MatGraphQueryResult:
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
            async with session.get(f"{self.base_url}/health") as response:
                if response.status == 200:
                    result = await response.json()
                    return result.get("status") == "healthy"
                return False
        except Exception as e:
            logger.error(f"[MATGRAPH] 健康检查失败: {str(e)}")
            return False


# 创建全局实例 (保持向后兼容)
matgraph_client = MatGraphClientService()
lightrag_client = matgraph_client  # 别名，保持向后兼容