"""
重排序模型服务 - 支持阿里云百炼gte-rerank-v2模型
"""
import json
import asyncio
from typing import List, Dict, Optional, Any
from dataclasses import dataclass
import httpx
from core.logger import logger
from core.config_optimized import optimized_config_manager

@dataclass
class RerankDocument:
    """重排序文档数据结构"""
    text: str
    index: int
    score: float = 0.0
    metadata: Optional[Dict[str, Any]] = None

@dataclass
class RerankResult:
    """重排序结果"""
    documents: List[RerankDocument]
    total_processed: int
    model_used: str
    processing_time: float

class AlibabaBailianRerankService:
    """阿里云百炼重排序服务"""
    
    def __init__(self):
        self.config = optimized_config_manager
        self.client = httpx.AsyncClient(timeout=30.0)
        
    async def __aenter__(self):
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        await self.client.aclose()
    
    def _get_rerank_config(self) -> Dict[str, Any]:
        """获取重排序配置"""
        try:
            import os
            
            # 优先使用环境变量
            api_key = os.getenv("ALIBABA_BAILIAN_RERANK_API_KEY")
            base_url = os.getenv("ALIBABA_BAILIAN_RERANK_BASE_URL", "https://dashscope.aliyuncs.com")
            default_model = os.getenv("DEFAULT_RERANK_MODEL", "gte-rerank-v2")
            
            if not api_key:
                # 尝试从配置文件获取
                rerank_config = self.config.get_dynaconf_config("rerank", {})
                alibaba_config = rerank_config.get("alibaba_bailian", {})
                
                if not alibaba_config.get("enabled", False):
                    raise ValueError("阿里云百炼重排序服务未启用")
                
                api_key = alibaba_config.get("api_key")
                base_url = alibaba_config.get("base_url", "https://dashscope.aliyuncs.com/api/v1")
            
            if not api_key:
                raise ValueError("阿里云百炼重排序API密钥未配置")
            
            return {
                "api_key": api_key,
                "base_url": base_url,
                "default_model": default_model,
                "max_documents": 100,
                "max_query_length": 2048,
                "timeout": 30,
                "max_retries": 3
            }
        except Exception as e:
            logger.error(f"获取重排序配置失败: {e}")
            raise
    
    async def rerank_documents(
        self,
        query: str,
        documents: List[str],
        model: str = "gte-rerank-v2",
        top_k: Optional[int] = None,
        return_documents: bool = True
    ) -> RerankResult:
        """
        对文档进行重排序
        
        Args:
            query: 查询文本
            documents: 待重排序的文档列表
            model: 重排序模型名称
            top_k: 返回的文档数量
            return_documents: 是否返回文档内容
            
        Returns:
            RerankResult: 重排序结果
        """
        import time
        start_time = time.time()
        
        try:
            config = self._get_rerank_config()
            
            # 验证输入
            if not query or not query.strip():
                raise ValueError("查询文本不能为空")
            
            if not documents:
                raise ValueError("文档列表不能为空")
            
            # 限制查询长度
            if len(query) > config["max_query_length"]:
                query = query[:config["max_query_length"]]
                logger.warning(f"查询文本过长，已截断到{config['max_query_length']}字符")
            
            # 限制文档数量
            if len(documents) > config["max_documents"]:
                documents = documents[:config["max_documents"]]
                logger.warning(f"文档数量过多，已截断到{config['max_documents']}个")
            
            # 构建请求
            request_data = {
                "model": model,
                "input": {
                    "query": query,
                    "documents": documents
                },
                "parameters": {
                    "return_documents": return_documents
                }
            }
            
            if top_k is not None:
                request_data["parameters"]["top_n"] = top_k
            
            # 发送请求
            headers = {
                "Authorization": f"Bearer {config['api_key']}",
                "Content-Type": "application/json"
            }
            
            logger.info(f"开始重排序: query='{query[:50]}...', documents={len(documents)}, model={model}")
            
            # 阿里云百炼重排序API端点
            api_endpoint = f"{config['base_url']}/services/aigc/text-rank/text-rank"
            
            response = await self.client.post(
                api_endpoint,
                json=request_data,
                headers=headers,
                timeout=config["timeout"]
            )
            
            if response.status_code != 200:
                error_msg = f"重排序请求失败: {response.status_code} - {response.text}"
                logger.error(error_msg)
                raise ValueError(error_msg)
            
            result = response.json()
            
            # 解析结果
            if "output" not in result:
                raise ValueError(f"重排序结果格式错误: {result}")
            
            output = result["output"]
            ranked_documents = []
            
            # 处理重排序结果
            for i, item in enumerate(output.get("results", [])):
                doc = RerankDocument(
                    text=item.get("document", {}).get("text", "") if return_documents else "",
                    index=item.get("index", i),
                    score=item.get("relevance_score", 0.0),
                    metadata=item.get("document", {}).get("metadata", {})
                )
                ranked_documents.append(doc)
            
            processing_time = time.time() - start_time
            
            logger.info(f"重排序完成: 处理{len(documents)}个文档，返回{len(ranked_documents)}个结果，耗时{processing_time:.2f}秒")
            
            return RerankResult(
                documents=ranked_documents,
                total_processed=len(documents),
                model_used=model,
                processing_time=processing_time
            )
            
        except Exception as e:
            logger.error(f"重排序失败: {e}")
            raise
    
    async def batch_rerank(
        self,
        queries: List[str],
        documents: List[str],
        model: str = "gte-rerank-v2",
        top_k: Optional[int] = None
    ) -> List[RerankResult]:
        """
        批量重排序
        
        Args:
            queries: 查询文本列表
            documents: 文档列表
            model: 重排序模型名称
            top_k: 每个查询返回的文档数量
            
        Returns:
            List[RerankResult]: 重排序结果列表
        """
        tasks = []
        for query in queries:
            task = self.rerank_documents(
                query=query,
                documents=documents,
                model=model,
                top_k=top_k
            )
            tasks.append(task)
        
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        # 处理异常
        final_results = []
        for i, result in enumerate(results):
            if isinstance(result, Exception):
                logger.error(f"查询{i}重排序失败: {result}")
                # 创建一个空的结果
                final_results.append(RerankResult(
                    documents=[],
                    total_processed=0,
                    model_used=model,
                    processing_time=0.0
                ))
            else:
                final_results.append(result)
        
        return final_results

class RerankService:
    """重排序服务统一接口"""
    
    def __init__(self):
        self.alibaba_service = AlibabaBailianRerankService()
    
    async def rerank(
        self,
        query: str,
        documents: List[str],
        provider: str = "alibaba_bailian",
        model: str = "gte-rerank-v2",
        top_k: Optional[int] = None
    ) -> RerankResult:
        """
        统一的重排序接口
        
        Args:
            query: 查询文本
            documents: 待重排序的文档列表
            provider: 重排序服务提供商
            model: 重排序模型名称
            top_k: 返回的文档数量
            
        Returns:
            RerankResult: 重排序结果
        """
        try:
            if provider == "alibaba_bailian":
                async with self.alibaba_service as service:
                    return await service.rerank_documents(
                        query=query,
                        documents=documents,
                        model=model,
                        top_k=top_k
                    )
            else:
                raise ValueError(f"不支持的重排序服务提供商: {provider}")
        
        except Exception as e:
            logger.error(f"重排序失败: {e}")
            raise
    
    async def get_available_models(self, provider: str = "alibaba_bailian") -> List[Dict[str, Any]]:
        """
        获取可用的重排序模型列表
        
        Args:
            provider: 重排序服务提供商
            
        Returns:
            List[Dict]: 可用模型列表
        """
        try:
            if provider == "alibaba_bailian":
                config = optimized_config_manager.get_dynaconf_config("rerank", {})
                alibaba_config = config.get("alibaba_bailian", {})
                return alibaba_config.get("available_models", [])
            else:
                raise ValueError(f"不支持的重排序服务提供商: {provider}")
        
        except Exception as e:
            logger.error(f"获取可用模型失败: {e}")
            return []

# 全局重排序服务实例
rerank_service = RerankService()