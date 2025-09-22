"""
混合检索服务 - 支持双向量和关键词的混合检索
支持中英文翻译的文档检索
"""
from typing import List, Dict, Any, Optional, Tuple
from elasticsearch import AsyncElasticsearch
from dataclasses import dataclass
import numpy as np

from core.config_optimized import optimized_config_manager
from core.logger import logger
from service.embedding_service import embedding_service

# 导入翻译装饰器
try:
    from service.retrieval_translation_decorator import standard_translation
    _has_translation = True
except ImportError:
    _has_translation = False
    # 创建一个空装饰器作为回退
    def standard_translation(func):
        return func


@dataclass
class SearchResult:
    """检索结果"""
    id: str
    content: str
    title: str
    score: float
    general_score: float
    domain_score: float
    keyword_score: float
    combined_score: float
    source: Dict[str, Any]
    highlights: Optional[Dict[str, List[str]]] = None


class HybridSearchService:
    """混合检索服务"""
    
    def __init__(self):
        # 初始化ES客户端
        try:
            import os
            es_config = optimized_config_manager.settings.database_elasticsearch
            
            # 处理hosts配置中的环境变量
            hosts = getattr(es_config, 'hosts', ['http://localhost:9200'])
            processed_hosts = []
            for host in hosts:
                if isinstance(host, str) and host.startswith('${') and host.endswith('}'):
                    env_var_expr = host[2:-1]
                    if ':-' in env_var_expr:
                        env_var, default_val = env_var_expr.split(':-', 1)
                        processed_host = os.getenv(env_var, default_val)
                    else:
                        processed_host = os.getenv(env_var_expr, host)
                    processed_hosts.append(processed_host)
                else:
                    processed_hosts.append(host)
            
            # 准备ES连接配置（确保本地环境使用HTTP）
            # 在本地环境强制使用HTTP连接
            if optimized_config_manager.settings.mat_qa_env == 'development':
                processed_hosts = [host.replace('https://', 'http://') if host.startswith('https://') else host for host in processed_hosts]
            
            es_kwargs = {
                "hosts": processed_hosts,
                "verify_certs": False,
                "ssl_show_warn": False,
                "ssl_context": None
            }
            
            # 添加认证信息
            if hasattr(es_config, 'api_key') and es_config.api_key:
                es_kwargs["api_key"] = es_config.api_key
            elif hasattr(es_config, 'username') and es_config.username and hasattr(es_config, 'password') and es_config.password:
                es_kwargs["basic_auth"] = (es_config.username, es_config.password)
            
            self.es = AsyncElasticsearch(**es_kwargs)
            self.timeout = getattr(es_config, 'timeout', 30)
            self.max_retries = getattr(es_config, 'max_retries', 3)
        except Exception as e:
            logger.error(f"ElasticSearch客户端初始化失败: {e}")
            raise
        
        # 检索权重配置
        try:
            retrieval_config = optimized_config_manager.settings.vectorization.retrieval_config
            self.weights = {
                "general_vector": getattr(retrieval_config, 'dynamic_weights', {}).get('base_general', 0.3),
                "domain_vector": getattr(retrieval_config, 'dynamic_weights', {}).get('base_domain', 0.5),
                "keyword": getattr(retrieval_config, 'dynamic_weights', {}).get('base_keyword', 0.2)
            }
        except:
            # 使用默认权重
            self.weights = {
                "general_vector": 0.3,
                "domain_vector": 0.5,
                "keyword": 0.2
            }
    
    @standard_translation
    async def hybrid_search(
        self,
        query: str,
        top_k: int = 20,
        filters: Optional[Dict[str, Any]] = None,
        collection_id: Optional[str] = None,
        boost_domain: bool = True,
        include_highlights: bool = True,
        **kwargs  # 接受翻译装饰器传递的额外参数
    ) -> List[SearchResult]:
        """
        执行混合检索
        
        Args:
            query: 查询文本
            top_k: 返回结果数量
            filters: 过滤条件
            collection_id: Collection ID过滤
            boost_domain: 是否启用领域增强
            include_highlights: 是否包含高亮
        """
        try:
            # 1. 生成查询向量
            from core.config_optimized import optimized_config_manager
            embedding_config = optimized_config_manager.get_embedding_models_config()
            default_model = embedding_config.get('default_model')
            if not default_model:
                raise ValueError("未配置embedding模型")
                
            embedding_response = await embedding_service.create_embeddings(
                model_path=f"alibaba/{default_model}",
                texts=[query]
            )
            general_vector = embedding_response.embeddings[0] if embedding_response and embedding_response.embeddings else []
            domain_vector = None  # 不再使用领域向量
            
            # 添加Collection过滤
            if collection_id:
                filters = filters or {}
                filters["collection_id"] = collection_id
            
            # 2. 构建ES查询
            search_body = self._build_search_query(
                query=query,
                general_vector=general_vector,
                domain_vector=domain_vector,
                top_k=top_k,
                filters=filters,
                include_highlights=include_highlights
            )
            
            # 3. 执行检索
            response = await self.es.search(
                index="mat_qa_chunks",
                body=search_body,
                timeout=f"{self.timeout}s"
            )
            
            # 4. 处理结果
            results = self._process_search_results(response, include_highlights)
            
            logger.info(f"混合检索完成，返回 {len(results)} 个结果")
            return results
            
        except Exception as e:
            logger.error(f"混合检索失败: {e}")
            raise
    
    def _build_search_query(
        self,
        query: str,
        general_vector: List[float],
        domain_vector: List[float],
        top_k: int,
        filters: Optional[Dict[str, Any]],
        include_highlights: bool
    ) -> Dict[str, Any]:
        """构建ES查询体"""
        
        # 向量检索查询
        vector_queries = [
            {
                "script_score": {
                    "query": {"match_all": {}},
                    "script": {
                        "source": f"cosineSimilarity(params.general_vector, 'general_embedding') + 1.0",
                        "params": {"general_vector": general_vector}
                    },
                    "boost": self.weights["general_vector"]
                }
            },
            {
                "script_score": {
                    "query": {"match_all": {}},
                    "script": {
                        "source": f"cosineSimilarity(params.domain_vector, 'domain_embedding') + 1.0",
                        "params": {"domain_vector": domain_vector}
                    },
                    "boost": self.weights["domain_vector"]
                }
            }
        ]
        
        # 关键词检索查询
        keyword_query = {
            "multi_match": {
                "query": query,
                "fields": [
                    "content^2",
                    "title^3",
                    "content.keyword",
                    "title.keyword"
                ],
                "type": "best_fields",
                "fuzziness": "AUTO",
                "boost": self.weights["keyword"]
            }
        }
        
        # 组合查询
        search_body = {
            "size": top_k,
            "query": {
                "bool": {
                    "should": vector_queries + [keyword_query],
                    "minimum_should_match": 1
                }
            },
            "_source": {
                "excludes": ["general_embedding", "domain_embedding"]  # 排除向量字段
            }
        }
        
        # 添加过滤条件
        if filters:
            search_body["query"]["bool"]["filter"] = []
            for field, value in filters.items():
                if isinstance(value, list):
                    search_body["query"]["bool"]["filter"].append({
                        "terms": {field: value}
                    })
                else:
                    search_body["query"]["bool"]["filter"].append({
                        "term": {field: value}
                    })
        
        # 添加高亮
        if include_highlights:
            search_body["highlight"] = {
                "fields": {
                    "content": {
                        "fragment_size": 150,
                        "number_of_fragments": 3
                    },
                    "title": {
                        "fragment_size": 100,
                        "number_of_fragments": 1
                    }
                },
                "pre_tags": ["<mark>"],
                "post_tags": ["</mark>"]
            }
        
        return search_body
    
    def _process_search_results(
        self,
        response: Dict[str, Any],
        include_highlights: bool
    ) -> List[SearchResult]:
        """处理ES检索结果 - 修复归一化逻辑，避免混合检索出现满分"""
        results = []
        
        # 获取最大和最小分数用于归一化
        scores = [hit["_score"] for hit in response["hits"]["hits"]]
        if not scores:
            return results
            
        max_score = max(scores)
        min_score = min(scores)
        score_range = max_score - min_score if max_score > min_score else 1.0
        
        # 地聚物领域关键词
        domain_keywords = [
            "地聚物", "聚合物", "材料", "混凝土", "强度", "耐久性",
            "胶凝材料", "粉煤灰", "矿渣", "硅酸盐", "铝酸盐", "水泥",
            "碱激发", "养护", "抗压", "抗折", "微观结构", "孔隙",
            "工作性", "流动性", "凝结时间", "膨胀", "收缩"
        ]
        
        # 非相关关键词（用于过滤）
        irrelevant_keywords = [
            "人工智能", "机器学习", "深度学习", "神经网络", "算法",
            "软件", "编程", "代码", "计算机", "数据库", "网络",
            "互联网", "手机", "电子", "金融", "股票", "投资"
        ]
        
        for hit in response["hits"]["hits"]:
            source = hit["_source"]
            content = source.get("content", "")
            title = source.get("title", "")
            combined_text = (title + " " + content).lower()
            
            # 领域相关性检查
            domain_score = sum(1 for keyword in domain_keywords if keyword in combined_text)
            irrelevant_score = sum(1 for keyword in irrelevant_keywords if keyword in combined_text)
            
            # 过滤明显不相关的内容
            if irrelevant_score > 0 and domain_score == 0:
                logger.info(f"过滤不相关内容: {title[:50]}... (包含非相关关键词)")
                continue
            
            # 归一化分数 - 混合检索不应该出现满分
            raw_score = hit["_score"]
            normalized_score = (raw_score - min_score) / score_range if score_range > 0 else 0.5
            
            # 设置混合检索的合理上限 (0.85)，保留不确定性
            base_score = min(normalized_score * 0.85, 0.85)
            
            # 应用保守的领域相关性加权
            if domain_score > 0:
                # 领域相关内容：最多15%加权，避免过度提升
                domain_boost = min(1.0 + domain_score * 0.05, 1.15)
                final_score = min(base_score * domain_boost, 0.85)  # 硬性上限0.85
            elif irrelevant_score > 0:
                # 不相关内容：降权50%
                final_score = max(base_score * 0.5, 0.0)
            else:
                final_score = base_score
            
            # 确保分数在合理范围内 (0.05-0.85)
            final_score = max(min(final_score, 0.85), 0.05)
            
            # 构建结果对象
            result = SearchResult(
                id=hit["_id"],
                content=content,
                title=title,
                score=final_score,  # 使用修正后的分数
                general_score=0.0,  
                domain_score=0.0,   
                keyword_score=0.0,  
                combined_score=final_score,  # 使用修正后的分数
                source=source,
                highlights=hit.get("highlight") if include_highlights else None
            )
            
            results.append(result)
        
        # 按最终分数排序
        results.sort(key=lambda x: x.combined_score, reverse=True)
        
        logger.info(f"混合检索结果处理: 原始{len(response['hits']['hits'])}个 -> 过滤后{len(results)}个，分数范围: 0.05-0.85")
        return results
    
    async def rerank_results(
        self,
        query: str,
        results: List[SearchResult],
        rerank_model: Optional[str] = None
    ) -> List[SearchResult]:
        """
        使用重排模型对结果进行重新排序
        """
        # 基于领域相关性的重排
        domain_keywords = [
            "地聚物", "聚合物", "材料", "混凝土", "强度", "耐久性",
            "胶凝材料", "粉煤灰", "矿渣", "硅酸盐", "铝酸盐"
        ]
        
        for result in results:
            # 计算领域相关性加权
            domain_relevance = sum(
                1 for keyword in domain_keywords 
                if keyword in result.content or keyword in result.title
            )
            
            # 🔥 修复：应用领域加权但确保分数不超过1.0
            if domain_relevance > 0:
                boost_factor = 1.0 + domain_relevance * 0.1
                boosted_score = result.combined_score * boost_factor
                # 确保加权后的分数不超过1.0
                result.combined_score = min(boosted_score, 1.0)
        
        # 按重新计算的得分排序
        results.sort(key=lambda x: x.combined_score, reverse=True)
        
        return results


# 全局混合检索服务实例
hybrid_search_service = HybridSearchService()