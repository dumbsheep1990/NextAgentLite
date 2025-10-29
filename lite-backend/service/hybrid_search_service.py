"""
混合检索服务 - 支持双向量和关键词的混合检索
"""
from typing import List, Dict, Any, Optional, Tuple
from elasticsearch import AsyncElasticsearch
from dataclasses import dataclass
import numpy as np

from core.config_optimized import optimized_config_manager
import os
from core.logger import logger
from service.embedding_service import embedding_service
from service.llm_config_gateway_client import get_llm_config_gateway_client
from service.embedding_service import embedding_service
from db.database import get_async_session
from sqlalchemy import text as _sql_text


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
        # 索引名可配置（默认 mat_qa_chunks）
        try:
            # 优先从配置读取（若存在）
            idx_from_cfg = getattr(optimized_config_manager.settings.database_elasticsearch, 'qa_chunks_index', None)
        except Exception:
            idx_from_cfg = None
        import os as _os
        idx_from_env = _os.getenv('ES_QA_CHUNKS_INDEX')
        self.index_name = (idx_from_cfg or idx_from_env or 'mat_qa_chunks').strip()

        # 当前向量索引方式（none|hnsw），默认 none
        self.indexing = "none"
    
    async def hybrid_search(
        self,
        query: str,
        top_k: int = 20,
        filters: Optional[Dict[str, Any]] = None,
        collection_id: Optional[str] = None,
        boost_domain: bool = True,
        include_highlights: bool = True,
        query_vector: Optional[List[float]] = None,
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
            # 1. 生成（或接收覆写）查询向量（优先集合Embedding模型；失败则降级为关键词检索）
            run_id = (kwargs or {}).get('run_id') or ''
            if query_vector is not None and isinstance(query_vector, list):
                general_vector = query_vector
            else:
                general_vector = []
                try:
                    client = await get_llm_config_gateway_client()
                    # 取集合级模型（如有），否则取默认
                    model_id = None
                    provider = None
                    if collection_id:
                        from service.embedding_model_manager import get_model_for_collection
                        m = await get_model_for_collection(collection_id)
                        if m:
                            model_id, provider = m
                    if not model_id:
                        cfg = await client.get_default_embedding_model()
                        if cfg:
                            model_id, provider = cfg[0], cfg[1]
                    if model_id:
                        # OpenAI兼容接口只需 model（网关将映射 provider）
                        logger.info(f"[HybridSearch][{run_id}] emb via gw model={model_id} coll={collection_id}")
                        resp = await client.create_embeddings(model_id, query)
                        data = (resp.get('data') or [{}])[0]
                        general_vector = data.get('embedding') or []
                except Exception as e:
                    # 尝试本地嵌入服务作为回退
                    try:
                        resp = await embedding_service.create_embeddings(model_path=None, texts=[query])
                        if resp and resp.embeddings:
                            general_vector = list(resp.embeddings[0])
                            logger.info(f"[HybridSearch][{run_id}] local fallback embedding ok len={len(general_vector)}")
                    except Exception as e2:
                        logger.warning(f"[HybridSearch][{run_id}] gw embed failed={e}; local fallback failed={e2}")
            domain_vector = None  # 不再使用领域向量
            logger.info(f"[HybridSearch][{run_id}] query='{query[:80]}', vec_ready={bool(general_vector)}, vec_len={len(general_vector) if general_vector else 0}")
            
            # 添加Collection过滤
            if collection_id:
                filters = filters or {}
                filters["collection_id"] = collection_id
            
            # 2) 分路执行：ES关键词 + PG向量
            # 2.1 关键词（ES）
            kw_body = self._build_search_query(
                query=query,
                general_vector=[],  # 仅关键词
                domain_vector=None,
                top_k=top_k,
                filters=filters,
                include_highlights=include_highlights,
            )
            es_resp = await self.es.search(index=self.index_name, body=kw_body, timeout=f"{self.timeout}s")
            es_results = self._process_search_results(es_resp, include_highlights)
            es_total = (((es_resp or {}).get('hits') or {}).get('total') or {}).get('value')
            if not es_total:
                logger.info(f"[HybridSearch][{run_id}] ES keyword hits=0")

            # 2.2 向量（PG）
            pg_results: List[SearchResult] = []
            if general_vector:
                try:
                    pg_results = await self._pg_vector_search(general_vector, filters, top_k)
                except Exception as e:
                    logger.warning(f"[HybridSearch][{run_id}] PG vector search failed: {e}")

            # 3) 融合：按 id 合并，weighted sum 计算 combined_score
            by_id: Dict[str, SearchResult] = {}
            # ES：记录 keyword_score
            for r in es_results:
                r.keyword_score = float(r.score or 0.0)
                r.combined_score = float(self.weights.get("keyword", 0.2)) * r.keyword_score
                by_id[r.id] = r
            # PG：记录 general_score
            for r in pg_results:
                if r.id in by_id:
                    base = by_id[r.id]
                    base.general_score = float(r.score or 0.0)
                    base.combined_score = (
                        float(self.weights.get("general_vector", 0.3)) * base.general_score +
                        float(self.weights.get("keyword", 0.2)) * (base.keyword_score or 0.0)
                    )
                else:
                    r.general_score = float(r.score or 0.0)
                    r.combined_score = float(self.weights.get("general_vector", 0.3)) * r.general_score
                    by_id[r.id] = r

            merged = list(by_id.values())
            merged.sort(key=lambda x: (x.combined_score or 0.0), reverse=True)
            results = merged[:top_k]

            took = (es_resp or {}).get('took')
            preview_titles = [(r.title or r.source.get('title') or '')[:30] for r in results[:5]]
            logger.info(f"[HybridSearch][{run_id}] ES took={took}ms es_total={es_total} returned={len(results)} sample_titles={preview_titles}")
            return results
            
        except Exception as e:
            logger.error(f"混合检索失败: {e}")
            raise

    async def diagnose(
        self,
        query: str,
        top_k: int = 10,
        filters: Optional[Dict[str, Any]] = None,
        collection_id: Optional[str] = None,
        query_vector: Optional[List[float]] = None,
    ) -> Dict[str, Any]:
        """执行一次检索并返回诊断信息（向量长度、ES took/hits、前几条标题等）。"""
        info: Dict[str, Any] = {"query": query, "top_k": top_k, "collection_id": collection_id}
        try:
            # 生成向量
            model_id_used = None
            if query_vector is not None and isinstance(query_vector, list):
                general_vector = query_vector
                model_id_used = "override"
            else:
                general_vector = []
                try:
                    client = await get_llm_config_gateway_client()
                    model_id = None
                    provider = None
                    if collection_id:
                        cfg = await client.get_collection_embedding_model(collection_id)
                        if cfg:
                            model_id, provider = cfg[0], cfg[1]
                    if not model_id:
                        import re
                        m = re.search(r"\bmodel:(?P<mid>[^\s]+)\b", query)
                        if m:
                            model_id = m.group('mid')
                    if not model_id:
                        cfg = await client.get_default_embedding_model()
                        if cfg:
                            model_id, provider = cfg[0], cfg[1]
                    if model_id:
                        model_id_used = model_id
                        resp = await client.create_embeddings(model_id, query)
                        data = (resp.get('data') or [{}])[0]
                        general_vector = data.get('embedding') or []
                except Exception as e:
                    # 回退到本地
                    try:
                        resp = await embedding_service.create_embeddings(model_path=None, texts=[query])
                        if resp and resp.embeddings:
                            general_vector = list(resp.embeddings[0])
                            model_id_used = 'local-embedding'
                    except Exception as e2:
                        info["embedding_error"] = f"{e}; fallback={e2}"
            info["vector_ready"] = bool(general_vector)
            info["vector_len"] = len(general_vector) if general_vector else 0
            info["embedding_model"] = model_id_used

            # 构造查询体
            if collection_id:
                filters = (filters or {}).copy()
                filters["collection_id"] = collection_id
            body = self._build_search_query(
                query=query,
                general_vector=general_vector,
                domain_vector=None,
                top_k=top_k,
                filters=filters,
                include_highlights=True,
            )
            info["query_body"] = body

            # 执行关键词查询（ES）
            resp = await self.es.search(index=self.index_name, body=body, timeout=f"{self.timeout}s")
            info["es_took_ms"] = (resp or {}).get("took")
            info["es_total"] = (((resp or {}).get('hits') or {}).get('total') or {}).get('value')
            # 处理结果
            results = self._process_search_results(resp, include_highlights=True)
            info["returned"] = len(results)
            info["sample_titles"] = [
                (r.title or r.source.get('title') or '')[:60] for r in results[:5]
            ]
            info["sample_ids"] = [r.id for r in results[:5]]
            info["sample_document_ids"] = [
                (r.source.get('document_id') if isinstance(r.source, dict) else None) for r in results[:5]
            ]
            # PG 向量检索诊断（如有向量）
            if general_vector:
                try:
                    pg_res = await self._pg_vector_search(general_vector, filters, top_k)
                    info["pg_vector_returned"] = len(pg_res)
                    info["pg_sample_titles"] = [
                        (r.title or r.source.get('title') or '')[:60] for r in pg_res[:5]
                    ]
                except Exception as e:
                    info["pg_error"] = str(e)
            return info
        except Exception as e:
            info["error"] = str(e)
            return info
    
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
        
        # 向量检索查询（若向量不可用则不加入向量子句）
        vector_queries = []
        if general_vector:
            vector_queries.append(
                {
                    "script_score": {
                        "query": {"match_all": {}},
                        "script": {
                            "source": "cosineSimilarity(params.general_vector, 'general_embedding') + 1.0",
                            "params": {"general_vector": general_vector}
                        },
                        "boost": self.weights.get("general_vector", 0.3)
                    }
                }
            )
        # 仅当传入了领域向量时，才添加领域向量查询，避免ES脚本错误
        if domain_vector:
            vector_queries.append(
                {
                    "script_score": {
                        "query": {"match_all": {}},
                        "script": {
                            "source": "cosineSimilarity(params.domain_vector, 'domain_embedding') + 1.0",
                            "params": {"domain_vector": domain_vector}
                        },
                        "boost": self.weights.get("domain_vector", 0.5)
                    }
                }
            )
        
        # 关键词检索查询（增强）：
        # - multi_match 覆盖 content/title（分析器分词，容错）
        # - match_phrase_prefix 提升类似 “NextAgent” 命中 “NextAgentLite” 的前缀召回
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
        prefix_queries = [
            {"match_phrase_prefix": {"title":   {"query": query, "boost": self.weights["keyword"] + 0.5}}},
            {"match_phrase_prefix": {"content": {"query": query, "boost": self.weights["keyword"]}}},
        ]
        # 基于 metadata 的检索优化：
        # - metadata.keywords：我们在回写时写入的关键词数组，优先精确/短语匹配；再 fallback 到分词匹配
        # - 若 ES 动态映射提供 .keyword 子字段，term 查询可提升精确命中
        meta_queries = [
            {"term":         {"metadata.keywords.keyword": {"value": query, "boost": self.weights["keyword"] + 1.0}}},
            {"match_phrase":  {"metadata.keywords":        {"query": query, "boost": self.weights["keyword"] + 0.8}}},
            {"match":         {"metadata.keywords":        {"query": query, "boost": self.weights["keyword"] + 0.4}}},
        ]
        
        # 组合查询：支持 KNN（HNSW）或脚本相似度
        if self.indexing == "hnsw" and general_vector:
            search_body: Dict[str, Any] = {
                "size": top_k,
                "knn": {
                    "field": "general_embedding",
                    "query_vector": general_vector,
                    "k": top_k,
                    "num_candidates": max(top_k * 3, 50)
                },
                "query": {"bool": {"should": [keyword_query], "minimum_should_match": 0}},
                "_source": {"excludes": ["general_embedding", "domain_embedding"]}
            }
        else:
            should_queries = (vector_queries + [keyword_query] + prefix_queries + meta_queries) if vector_queries else ([keyword_query] + prefix_queries + meta_queries)
            search_body = {
                "size": top_k,
                "query": {
                    "bool": {
                        "should": should_queries,
                        "minimum_should_match": 1
                    }
                },
                "_source": {
                    "excludes": ["general_embedding", "domain_embedding"]
                }
            }
        
        # 添加过滤条件（支持 collection_id 与结构化元数据 metadata_filters）
        if filters:
            search_body["query"]["bool"].setdefault("filter", [])

            def _append_term(field_path: str, val: Any):
                if isinstance(val, list):
                    search_body["query"]["bool"]["filter"].append({"terms": {field_path: val}})
                else:
                    search_body["query"]["bool"]["filter"].append({"term": {field_path: val}})

            # 顶层快捷过滤
            for field, value in list(filters.items()):
                if field == 'collection_id':
                    # 同时匹配顶层字段或 metadata.collection_id
                    if isinstance(value, list):
                        search_body["query"]["bool"]["filter"].append({
                            "bool": {
                                "should": [
                                    {"terms": {"collection_id": value}},
                                    {"terms": {"metadata.collection_id": value}},
                                ],
                                "minimum_should_match": 1,
                            }
                        })
                    else:
                        search_body["query"]["bool"]["filter"].append({
                            "bool": {
                                "should": [
                                    {"term": {"collection_id": value}},
                                    {"term": {"metadata.collection_id": value}},
                                ],
                                "minimum_should_match": 1,
                            }
                        })
                    # 已处理，移除，避免后续误当作普通字段
                    filters.pop('collection_id', None)

            # 结构化元数据过滤（来自 QA 路由或前端高级筛选）：metadata_filters = [{key, op, value}]
            meta_filters = filters.pop('metadata_filters', None)
            if isinstance(meta_filters, list):
                for mf in meta_filters:
                    key = str(mf.get('key', '')).strip()
                    op = str(mf.get('op', '=')).strip()
                    val = mf.get('value')
                    if not key:
                        continue
                    # 缺省映射到 metadata.structured.<key>，用户可直接传入以 metadata. 前缀的完整路径跳过前缀
                    if key.startswith('metadata.'):
                        field_path = key
                    elif '.' in key:
                        field_path = f"metadata.{key}"
                    else:
                        field_path = f"metadata.structured.{key}"

                    # 操作符映射
                    if op == '=':
                        _append_term(field_path, val)
                    elif op == '!=':
                        search_body["query"]["bool"].setdefault("must_not", [])
                        if isinstance(val, list):
                            search_body["query"]["bool"]["must_not"].append({"terms": {field_path: val}})
                        else:
                            search_body["query"]["bool"]["must_not"].append({"term": {field_path: val}})
                    elif op in ('>', '>=', '<', '<='):
                        rng: Dict[str, Any] = {}
                        if op == '>':
                            rng = {"gt": val}
                        elif op == '>=':
                            rng = {"gte": val}
                        elif op == '<':
                            rng = {"lt": val}
                        elif op == '<=':
                            rng = {"lte": val}
                        search_body["query"]["bool"]["filter"].append({"range": {field_path: rng}})
                    elif op == 'in':
                        arr = val if isinstance(val, list) else str(val).split(',')
                        arr = [v.strip() for v in arr if str(v).strip()]
                        if arr:
                            search_body["query"]["bool"]["filter"].append({"terms": {field_path: arr}})
                    elif op == 'contains':
                        # 使用 match_phrase 进行包含匹配（字段需可分词）
                        search_body["query"]["bool"]["filter"].append({
                            "match_phrase": {field_path: str(val)}
                        })
                    else:
                        # 未知操作符，回退为 term
                        _append_term(field_path, val)

            # 其余键按普通字段处理（允许直接过滤 metadata.<field>）
            for field, value in filters.items():
                _append_term(field, value)
        
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

    async def _pg_vector_search(self, query_vector: List[float], filters: Optional[Dict[str, Any]], top_k: int) -> List[SearchResult]:
        """使用 PostgreSQL(pgvector) 进行向量相似度搜索。"""
        cids: List[str] = []
        if isinstance(filters, dict):
            cid = filters.get('collection_id')
            if isinstance(cid, list):
                cids = [str(x) for x in cid if x]
            elif cid:
                cids = [str(cid)]

        vec_literal = '[' + ','.join(str(float(x)) for x in query_vector) + ']'
        where_coll = ''
        params: Dict[str, Any] = {"limit": int(top_k), "qvec": vec_literal}
        if cids:
            placeholders = []
            for i, cid in enumerate(cids):
                key = f"cid{i}"
                params[key] = cid
                placeholders.append(f":{key}")
            where_coll = f" AND kd.collection_id IN ({', '.join(placeholders)})"

        # 动态将 JSON 向量转为 vector 类型进行相似度计算，避免必须迁移列类型
        sql = f"""
            SELECT dc.id,
                   dc.content,
                   kd.title AS title,
                   (
                     1 - (
                       CAST((
                         SELECT ARRAY(SELECT (elem)::float4
                                       FROM jsonb_array_elements_text(COALESCE(dc.general_embedding::jsonb, dc.embedding::jsonb)) AS elem)
                       ) AS vector) <=> CAST(:qvec AS vector)
                     )
                   ) AS sim,
                   kd.id AS doc_id,
                   kd.collection_id AS coll_id
            FROM document_chunks dc
            JOIN knowledge_documents kd ON kd.id = dc.document_id
            WHERE (dc.general_embedding IS NOT NULL OR dc.embedding IS NOT NULL)
                  {where_coll}
            ORDER BY (
                      CAST((
                        SELECT ARRAY(SELECT (elem)::float4
                                      FROM jsonb_array_elements_text(COALESCE(dc.general_embedding::jsonb, dc.embedding::jsonb)) AS elem)
                      ) AS vector) <=> CAST(:qvec AS vector)
                     ) ASC
            LIMIT :limit
        """
        # 使用同步会话在线程中执行，避免事件循环关闭导致的 asyncpg 错误
        from db.database import get_sync_session
        import concurrent.futures
        from sqlalchemy import text as _sync_text
        def _run_sync():
            with get_sync_session() as s:
                r = s.execute(_sync_text(sql), params)
                return r.fetchall()
        with concurrent.futures.ThreadPoolExecutor(max_workers=1) as ex:
            rows = ex.submit(_run_sync).result(timeout=10)
        out: List[SearchResult] = []
        for row in rows:
            cid = row[0]
            content = row[1]
            title = row[2]
            score = float(row[3] or 0.0)
            doc_id = row[4]
            coll_id = row[5]
            out.append(SearchResult(
                id=str(cid),
                content=content or '',
                title=title or '',
                score=score,
                general_score=score,
                domain_score=0.0,
                keyword_score=0.0,
                combined_score=score,
                source={"document_id": str(doc_id), "collection_id": str(coll_id), "metadata": {}}
            ))
        return out

    async def full_recall_by_collections(self, collection_ids: List[str], top_k: int = 400) -> List[SearchResult]:
        """不基于相似度，直接按集合召回文档分片（用于总结类场景）。
        以文档ID和分片ID顺序返回，限制最大数量。
        """
        if not collection_ids:
            return []
        placeholders = ", ".join([f":c{i}" for i in range(len(collection_ids))])
        params = {f"c{i}": cid for i, cid in enumerate(collection_ids)}
        params["limit"] = max(50, min(int(top_k or 400), 1000))
        sql = f"""
            SELECT dc.id,
                   dc.content,
                   kd.title AS title,
                   kd.id AS doc_id,
                   kd.collection_id AS coll_id
            FROM document_chunks dc
            JOIN knowledge_documents kd ON kd.id = dc.document_id
            WHERE kd.collection_id IN ({placeholders})
            ORDER BY kd.id ASC, dc.id ASC
            LIMIT :limit
        """
        from db.database import get_sync_session
        import concurrent.futures
        from sqlalchemy import text as _text
        def _run():
            with get_sync_session() as s:
                r = s.execute(_text(sql), params)
                return r.fetchall()
        with concurrent.futures.ThreadPoolExecutor(max_workers=1) as ex:
            rows = ex.submit(_run).result(timeout=10)
        out: List[SearchResult] = []
        for row in rows:
            cid = row[0]
            content = row[1] or ''
            title = row[2] or ''
            doc_id = row[3]
            coll_id = row[4]
            out.append(SearchResult(
                id=str(cid),
                content=content,
                title=title,
                score=0.0,  # 非相似度检索，不计分
                general_score=0.0,
                domain_score=0.0,
                keyword_score=0.0,
                combined_score=0.0,
                source={"document_id": str(doc_id), "collection_id": str(coll_id), "metadata": {"unscored": True}}
            ))
        return out

    async def full_recall_by_document(self, document_id: str, top_k: int = 400) -> List[SearchResult]:
        """不基于相似度，直接按单个文档召回所有分片（用于总结类场景）。"""
        if not document_id:
            return []
        params = {"doc": document_id, "limit": max(50, min(int(top_k or 400), 1000))}
        sql = """
            SELECT dc.id,
                   dc.content,
                   kd.title AS title,
                   kd.id AS doc_id,
                   kd.collection_id AS coll_id
            FROM document_chunks dc
            JOIN knowledge_documents kd ON kd.id = dc.document_id
            WHERE kd.id = :doc
            ORDER BY dc.id ASC
            LIMIT :limit
        """
        from db.database import get_sync_session
        import concurrent.futures
        from sqlalchemy import text as _text
        def _run():
            with get_sync_session() as s:
                r = s.execute(_text(sql), params)
                return r.fetchall()
        with concurrent.futures.ThreadPoolExecutor(max_workers=1) as ex:
            rows = ex.submit(_run).result(timeout=10)
        out: List[SearchResult] = []
        for row in rows:
            cid = row[0]
            content = row[1] or ''
            title = row[2] or ''
            doc_id = row[3]
            coll_id = row[4]
            out.append(SearchResult(
                id=str(cid),
                content=content,
                title=title,
                score=0.0,
                general_score=0.0,
                domain_score=0.0,
                keyword_score=0.0,
                combined_score=0.0,
                source={"document_id": str(doc_id), "collection_id": str(coll_id), "metadata": {"unscored": True}}
            ))
        return out
    
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
        """使用供应商重排模型对结果精排。
        优先通过 9050 网关的 /v1/rerank；失败则回退领域词加权。
        """
        if not results:
            return results
        # 收集文本
        documents = []
        for r in results:
            text = (r.content or '').strip()
            if not text and r.title:
                text = r.title
            documents.append(text)

        # 解析默认模型（当未指定时，从 /v1/models/enabled 中选择 default_rerank）
        model_to_use = (rerank_model or '').strip()
        base = os.getenv('LLM_GATEWAY_URL', 'http://localhost:9050').rstrip('/')
        if not model_to_use:
            try:
                import httpx
                async with httpx.AsyncClient(timeout=10.0) as hc:
                    resp = await hc.get(f"{base}/v1/models/enabled")
                    data = resp.json() if resp.status_code == 200 else {}
                    for prov in (data.get('providers') or []):
                        for m in (prov.get('models') or []):
                            if (m.get('model_type') == 'rerank') and m.get('default_rerank'):
                                model_to_use = m.get('model_id')
                                break
                        if model_to_use:
                            break
            except Exception:
                model_to_use = ''

        if model_to_use:
            try:
                from .rerank_vendors import get_rerank_vendor
                vendor = get_rerank_vendor()
                pairs = await vendor.rerank(model_to_use, query, documents)
                # pairs: List[(index, score)]，按 score desc
                if pairs:
                    # 归一化分数到 [0,1]
                    scores = [s for _, s in pairs]
                    smin, smax = (min(scores), max(scores)) if scores else (0.0, 0.0)
                    score_map: Dict[int, float] = {}
                    for idx, sc in pairs:
                        if smax > smin:
                            score_map[idx] = (sc - smin) / (smax - smin)
                        else:
                            score_map[idx] = float(sc)
                    # 更新 combined_score 并排序
                    for i, r in enumerate(results):
                        if i in score_map:
                            r.combined_score = float(score_map[i])
                    results.sort(key=lambda x: x.combined_score, reverse=True)
                    return results
            except Exception:
                # 回退
                pass

        # 回退：基于“场景”加权（教育 / 学术 / 政策 / 通用）
        # 说明：
        # - 不再使用材料工程领域关键词；
        # - 尝试从文档元数据 structured.scenario 或 metadata.scenario 推断；若无法确定则不加权。
        # - 关键词仅作启发式提示，力度较小（每命中 +5%），上限 1.0。

        # 统计场景
        allowed = {"education", "academic", "policy", "general", "教育", "学术", "政策", "通用"}
        scenario_votes: Dict[str, int] = {}
        for r in results:
            md = (r.source or {}).get('metadata', {}) if hasattr(r, 'source') else {}
            structured = md.get('structured') or {}
            sc = structured.get('scenario') or md.get('scenario')
            if isinstance(sc, str) and sc.lower() in allowed:
                key = sc.lower()
                scenario_votes[key] = scenario_votes.get(key, 0) + 1
        scenario = None
        if scenario_votes:
            scenario = max(scenario_votes.items(), key=lambda kv: kv[1])[0]

        if scenario:
            # 定义四类场景的提示词集合（可后续改为配置化）
            scenario_keywords_map = {
                'education': ['课程', '教学', '教材', '实验', '作业', '课堂', '考试', '课件', '学习目标', '教学大纲'],
                '学术': ['研究', '方法', '结果', '讨论', '结论', '参考文献', 'doi', 'arxiv', '实验设计', '综述', '期刊', '会议'],
                'academic': ['研究', '方法', '结果', '讨论', '结论', '参考文献', 'doi', 'arxiv', '实验设计', '综述', '期刊', '会议'],
                '政策': ['政策', '法规', '条例', '指导', '通知', '标准', '规范', '实施方案', '细则'],
                'policy': ['policy', 'regulation', 'standard', 'guideline', 'notice', 'implementation', 'compliance'],
                '通用': [],
                'general': []
            }
            kw = scenario_keywords_map.get(scenario, [])
            if kw:
                for r in results:
                    text = f"{(r.title or '')}\n{(r.content or '')}"
                    hits = sum(1 for k in kw if k and (k in text))
                    if hits > 0:
                        boost = 1.0 + hits * 0.05  # 每命中+5%，上限1.0
                        r.combined_score = min((r.combined_score or r.score or 0.0) * boost, 1.0)
                results.sort(key=lambda x: x.combined_score, reverse=True)
        return results

    async def ensure_index(self, force: bool = False, dims: int = 1024, indexing: str = "none") -> Dict[str, Any]:
        """确保用于检索的 ES 索引存在并具有正确的映射。
        Args:
            force: 是否强制重建索引（存在则删除后重建）
            dims: 通用向量维度（需与嵌入模型一致）
            indexing: 向量索引方式（none|hnsw）
        Returns:
            创建或校验的结果信息
        """
        index_name = self.index_name
        try:
            exists = await self.es.indices.exists(index=index_name)
            if exists and force:
                await self.es.indices.delete(index=index_name, ignore=[404])
                exists = False

            if not exists:
                self.indexing = indexing if indexing in ("none", "hnsw") else "none"
                body = {
                    "settings": {
                        "number_of_shards": 1,
                        "number_of_replicas": 0
                    },
                    "mappings": {
                        "properties": {
                            "id": {"type": "keyword"},
                            "document_id": {"type": "keyword"},
                            "chunk_index": {"type": "integer"},
                            "title": {"type": "text"},
                            "content": {"type": "text"},
                            "general_model": {"type": "keyword"},
                            "vectorization_strategy": {"type": "keyword"},
                            "metadata": {"type": "object", "enabled": True},
                            "metadata.keywords": {
                                "type": "text",
                                "fields": {
                                    "keyword": {"type": "keyword"}
                                }
                            },
                            "created_at": {"type": "date"},
                            "updated_at": {"type": "date"},
                            "general_embedding": (
                                {
                                    "type": "dense_vector",
                                    "dims": dims,
                                    "index": False
                                }
                                if self.indexing == "none"
                                else {
                                    "type": "dense_vector",
                                    "dims": dims,
                                    "index": True,
                                    "similarity": "cosine",
                                    "method": {
                                        "name": "hnsw",
                                        "engine": "lucene",
                                        "space_type": "cosinesimil",
                                        "parameters": {"m": 16, "ef_construction": 128}
                                    }
                                }
                            )
                        }
                    }
                }
                await self.es.indices.create(index=index_name, body=body)
                return {"created": True, "index": index_name, "dims": dims, "indexing": self.indexing}
            else:
                return {"created": False, "index": index_name, "message": "exists"}
        except Exception as e:
            from core.logger import logger
            logger.error(f"确保索引失败: {e}")
            raise


# 全局混合检索服务实例
hybrid_search_service = HybridSearchService()
