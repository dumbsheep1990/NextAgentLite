"""
QA路由服务
实现知识库的自定义问答路由功能，支持三层检索架构
"""

import asyncio
import json
import re
from typing import List, Optional, Dict, Any, Tuple
from datetime import datetime
from uuid import UUID, uuid4
import logging
from collections import defaultdict

import asyncpg
from fastapi import HTTPException
import numpy as np

from models.qa_routing import (
    QARoute, QARouteCreate, QARouteUpdate,
    RetrievalPathConfig, RetrievalPathConfigCreate,
    QARouteCategory, QARouteCategoryCreate,
    QARouteMatchLog, QARouteMatchLogCreate,
    QARouteImportHistory, QARouteImportHistoryCreate,
    QARouteQuery, QARouteSearchResult,
    RetrievalPathResult, QARoutingResponse,
    MatchMethod, PathSourceType, FallbackAction, ImportStatus,
    QARouteBatchImport, QARouteStatistics
)
from core.config_optimized import optimized_config_manager
from service.embedding_service import embedding_service
from service.qa_generation_service_simplified import QAGenerationServiceSimplified

logger = logging.getLogger(__name__)


class QARoutingService:
    """QA路由服务"""
    
    def __init__(self):
        self.db_config = optimized_config_manager.settings.database_postgresql
        self.pool = None
        self.qa_gen_service = QAGenerationServiceSimplified()
        self.route_embeddings_cache = {}  # 缓存路由的向量
        
    async def initialize(self):
        """初始化服务"""
        if not self.pool:
            self.pool = await asyncpg.create_pool(
                host=self.db_config.host,
                port=self.db_config.port,
                user=self.db_config.username,
                password=self.db_config.password,
                database=self.db_config.database,
                min_size=2,
                max_size=10
            )
            
    async def close(self):
        """关闭服务"""
        if self.pool:
            await self.pool.close()
            self.pool = None
            
    # ===================== QA路由CRUD操作 =====================
    
    async def create_qa_route(
        self, 
        route_data: QARouteCreate,
        user_id: Optional[UUID] = None
    ) -> QARoute:
        """创建QA路由"""
        async with self.pool.acquire() as conn:
            # 检查知识库是否存在
            kb_exists = await conn.fetchval(
                "SELECT EXISTS(SELECT 1 FROM knowledge_sources WHERE id = $1)",
                route_data.knowledge_base_id
            )
            if not kb_exists:
                raise HTTPException(status_code=404, detail="知识库不存在")
            
            # 创建路由
            route_id = uuid4()
            now = datetime.utcnow()
            
            row = await conn.fetchrow("""
                INSERT INTO qa_routes (
                    id, knowledge_base_id, category, question, answer,
                    keywords, priority, is_active, source_type, source_ref,
                    metadata, created_at, updated_at, created_by
                ) VALUES (
                    $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14
                ) RETURNING *
            """, 
                route_id, route_data.knowledge_base_id, route_data.category,
                route_data.question, route_data.answer, route_data.keywords,
                route_data.priority, route_data.is_active, route_data.source_type,
                route_data.source_ref, json.dumps(route_data.metadata),
                now, now, user_id
            )
            
            # 更新向量缓存
            await self._invalidate_embeddings_cache(route_data.knowledge_base_id)
            
            return QARoute(**dict(row))
    
    async def get_qa_route(self, route_id: UUID) -> Optional[QARoute]:
        """获取单个QA路由"""
        async with self.pool.acquire() as conn:
            row = await conn.fetchrow(
                "SELECT * FROM qa_routes WHERE id = $1",
                route_id
            )
            return QARoute(**dict(row)) if row else None
    
    async def update_qa_route(
        self,
        route_id: UUID,
        update_data: QARouteUpdate,
        user_id: Optional[UUID] = None
    ) -> QARoute:
        """更新QA路由"""
        async with self.pool.acquire() as conn:
            # 构建更新语句
            update_fields = []
            params = [route_id]
            param_count = 1
            
            for field, value in update_data.dict(exclude_unset=True).items():
                param_count += 1
                update_fields.append(f"{field} = ${param_count}")
                if field == "metadata":
                    params.append(json.dumps(value))
                else:
                    params.append(value)
            
            if not update_fields:
                route = await self.get_qa_route(route_id)
                if not route:
                    raise HTTPException(status_code=404, detail="QA路由不存在")
                return route
            
            # 添加更新时间和更新者
            param_count += 1
            update_fields.append(f"updated_at = ${param_count}")
            params.append(datetime.utcnow())
            
            if user_id:
                param_count += 1
                update_fields.append(f"updated_by = ${param_count}")
                params.append(user_id)
            
            # 执行更新
            row = await conn.fetchrow(f"""
                UPDATE qa_routes 
                SET {', '.join(update_fields)}
                WHERE id = $1
                RETURNING *
            """, *params)
            
            if not row:
                raise HTTPException(status_code=404, detail="QA路由不存在")
            
            # 更新向量缓存
            await self._invalidate_embeddings_cache(row['knowledge_base_id'])
            
            return QARoute(**dict(row))
    
    async def delete_qa_route(self, route_id: UUID) -> bool:
        """删除QA路由"""
        async with self.pool.acquire() as conn:
            # 获取知识库ID用于清理缓存
            kb_id = await conn.fetchval(
                "SELECT knowledge_base_id FROM qa_routes WHERE id = $1",
                route_id
            )
            
            if kb_id:
                result = await conn.execute(
                    "DELETE FROM qa_routes WHERE id = $1",
                    route_id
                )
                await self._invalidate_embeddings_cache(kb_id)
                return result.split()[-1] == "1"
            
            return False
    
    async def list_qa_routes(
        self,
        knowledge_base_id: str,
        category: Optional[str] = None,
        is_active: Optional[bool] = None,
        limit: int = 100,
        offset: int = 0
    ) -> Tuple[List[QARoute], int]:
        """列出QA路由"""
        async with self.pool.acquire() as conn:
            # 构建查询条件
            conditions = ["knowledge_base_id = $1"]
            params = [knowledge_base_id]
            param_count = 1
            
            if category is not None:
                param_count += 1
                conditions.append(f"category = ${param_count}")
                params.append(category)
            
            if is_active is not None:
                param_count += 1
                conditions.append(f"is_active = ${param_count}")
                params.append(is_active)
            
            where_clause = " AND ".join(conditions)
            
            # 查询总数
            total = await conn.fetchval(
                f"SELECT COUNT(*) FROM qa_routes WHERE {where_clause}",
                *params
            )
            
            # 查询数据
            params.extend([limit, offset])
            rows = await conn.fetch(f"""
                SELECT * FROM qa_routes 
                WHERE {where_clause}
                ORDER BY priority DESC, created_at DESC
                LIMIT ${param_count + 1} OFFSET ${param_count + 2}
            """, *params)
            
            routes = []
            for row in rows:
                row_dict = dict(row)
                # 如果metadata是字符串，解析为字典
                if isinstance(row_dict.get('metadata'), str):
                    row_dict['metadata'] = json.loads(row_dict['metadata'])
                routes.append(QARoute(**row_dict))
            return routes, total
    
    # ===================== 检索路径配置管理 =====================
    
    async def create_retrieval_path_config(
        self,
        config_data: RetrievalPathConfigCreate
    ) -> RetrievalPathConfig:
        """创建检索路径配置"""
        async with self.pool.acquire() as conn:
            config_id = uuid4()
            now = datetime.utcnow()
            
            row = await conn.fetchrow("""
                INSERT INTO retrieval_path_configs (
                    id, knowledge_base_id, path_name, path_order,
                    source_type, is_enabled, config, fallback_action,
                    min_confidence, max_results, created_at, updated_at
                ) VALUES (
                    $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12
                ) RETURNING *
            """,
                config_id, config_data.knowledge_base_id, config_data.path_name,
                config_data.path_order, config_data.source_type, config_data.is_enabled,
                json.dumps(config_data.config), config_data.fallback_action,
                config_data.min_confidence, config_data.max_results, now, now
            )
            
            return RetrievalPathConfig(**dict(row))
    
    async def get_retrieval_paths(
        self,
        knowledge_base_id: str
    ) -> List[RetrievalPathConfig]:
        """获取知识库的检索路径配置"""
        async with self.pool.acquire() as conn:
            rows = await conn.fetch("""
                SELECT * FROM retrieval_path_configs
                WHERE knowledge_base_id = $1 AND is_enabled = true
                ORDER BY path_order
            """, knowledge_base_id)
            
            configs = []
            for row in rows:
                row_dict = dict(row)
                # 如果config是字符串，解析为字典
                if isinstance(row_dict.get('config'), str):
                    row_dict['config'] = json.loads(row_dict['config'])
                configs.append(RetrievalPathConfig(**row_dict))
            return configs
    
    # ===================== QA路由搜索和匹配 =====================
    
    async def search_qa_routes(
        self,
        query_data: QARouteQuery,
        session_id: Optional[str] = None
    ) -> QARoutingResponse:
        """搜索QA路由并执行多层检索"""
        start_time = datetime.utcnow()
        session_id = session_id or str(uuid4())
        
        # 1. 获取检索路径配置
        retrieval_paths = await self.get_retrieval_paths(query_data.knowledge_base_id)
        if not retrieval_paths:
            # 使用默认配置
            retrieval_paths = await self._get_default_retrieval_paths(query_data.knowledge_base_id)
        
        # 2. 执行多层检索
        matched_routes = []
        path_results = []
        
        for path_config in retrieval_paths:
            path_start = datetime.utcnow()
            
            try:
                if path_config.source_type == PathSourceType.QA_ROUTES:
                    # 检索QA路由
                    routes = await self._search_in_qa_routes(
                        query_data, path_config
                    )
                    matched_routes.extend(routes)
                    
                    path_result = RetrievalPathResult(
                        path_name=path_config.path_name,
                        source_type=path_config.source_type,
                        results=[r.dict() for r in routes],
                        execution_time_ms=int((datetime.utcnow() - path_start).total_seconds() * 1000),
                        confidence_score=max([r.match_score for r in routes], default=0.0)
                    )
                    
                elif path_config.source_type == PathSourceType.QA_DATASETS:
                    # 检索QA数据集
                    results = await self._search_in_qa_datasets(
                        query_data, path_config
                    )
                    
                    path_result = RetrievalPathResult(
                        path_name=path_config.path_name,
                        source_type=path_config.source_type,
                        results=results,
                        execution_time_ms=int((datetime.utcnow() - path_start).total_seconds() * 1000),
                        confidence_score=max([r.get('score', 0) for r in results], default=0.0)
                    )
                    
                elif path_config.source_type == PathSourceType.DOCUMENTS:
                    # 检索知识文档
                    results = await self._search_in_documents(
                        query_data, path_config
                    )
                    
                    path_result = RetrievalPathResult(
                        path_name=path_config.path_name,
                        source_type=path_config.source_type,
                        results=results,
                        execution_time_ms=int((datetime.utcnow() - path_start).total_seconds() * 1000),
                        confidence_score=max([r.get('score', 0) for r in results], default=0.0)
                    )
                else:
                    continue
                
                path_results.append(path_result)
                
                # 判断是否继续下一层
                if path_result.confidence_score >= path_config.min_confidence:
                    if path_config.fallback_action == FallbackAction.STOP:
                        break
                        
            except Exception as e:
                logger.error(f"检索路径执行失败: {path_config.path_name}, 错误: {str(e)}")
                path_results.append(RetrievalPathResult(
                    path_name=path_config.path_name,
                    source_type=path_config.source_type,
                    results=[],
                    execution_time_ms=int((datetime.utcnow() - path_start).total_seconds() * 1000),
                    confidence_score=0.0,
                    error=str(e)
                ))
                
                if path_config.fallback_action == FallbackAction.STOP:
                    break
        
        # 3. 记录匹配日志
        if matched_routes:
            await self._log_match(
                matched_routes[0],
                query_data,
                session_id,
                int((datetime.utcnow() - start_time).total_seconds() * 1000)
            )
        
        # 4. 构建响应
        return QARoutingResponse(
            query=query_data.query,
            knowledge_base_id=query_data.knowledge_base_id,
            matched_routes=matched_routes,
            retrieval_paths=path_results,
            total_time_ms=int((datetime.utcnow() - start_time).total_seconds() * 1000),
            session_id=session_id
        )
    
    async def _search_in_qa_routes(
        self,
        query_data: QARouteQuery,
        path_config: RetrievalPathConfig
    ) -> List[QARouteSearchResult]:
        """在QA路由中搜索"""
        async with self.pool.acquire() as conn:
            # 获取所有活跃的QA路由
            conditions = ["knowledge_base_id = $1", "is_active = true"]
            params = [query_data.knowledge_base_id]
            
            if query_data.category:
                conditions.append("category = $2")
                params.append(query_data.category)
            
            rows = await conn.fetch(f"""
                SELECT * FROM qa_routes
                WHERE {' AND '.join(conditions)}
                ORDER BY priority DESC
            """, *params)
            
            if not rows:
                return []
            
            routes = []
            for row in rows:
                row_dict = dict(row)
                # 如果metadata是字符串，解析为字典
                if isinstance(row_dict.get('metadata'), str):
                    row_dict['metadata'] = json.loads(row_dict['metadata'])
                routes.append(QARoute(**row_dict))
            results = []
            
            # 执行匹配
            for route in routes:
                score, method = await self._match_route(
                    query_data.query,
                    route,
                    query_data.use_semantic
                )
                
                logger.debug(f"匹配路由: '{route.question[:30]}...' - 分数: {score:.3f}, 方法: {method}")
                
                if score >= path_config.min_confidence:
                    results.append(QARouteSearchResult(
                        route=route,
                        match_score=score,
                        match_method=method
                    ))
            
            # 排序并限制结果数
            results.sort(key=lambda x: x.match_score, reverse=True)
            return results[:path_config.max_results]
    
    async def _match_route(
        self,
        query: str,
        route: QARoute,
        use_semantic: bool
    ) -> Tuple[float, MatchMethod]:
        """匹配单个路由"""
        query_lower = query.lower()
        question_lower = route.question.lower()
        
        # 1. 精确匹配
        if query_lower == question_lower:
            return 1.0, MatchMethod.EXACT
        
        # 2. 相似匹配 - 处理问题的不同表述方式
        # 移除标点符号进行比较
        query_clean = re.sub(r'[？?。，,！!、]', '', query_lower).strip()
        question_clean = re.sub(r'[？?。，,！!、]', '', question_lower).strip()
        
        # 检查是否包含相同的关键内容
        if query_clean == question_clean:
            return 0.95, MatchMethod.EXACT
        
        # 检查是否是问题的变体（如"X是什么"和"什么是X"）
        if self._is_question_variant(query_clean, question_clean):
            return 0.9, MatchMethod.EXACT
        
        # 3. 关键词匹配
        if route.keywords:
            keyword_matches = sum(
                1 for kw in route.keywords 
                if kw.lower() in query_lower
            )
            if keyword_matches > 0:
                score = keyword_matches / len(route.keywords)
                if score >= 0.5:
                    return score, MatchMethod.KEYWORD
        
        # 4. 语义匹配 - 使用向量相似度
        if use_semantic:
            try:
                # 使用向量相似度计算
                score = await self._calculate_vector_similarity(
                    query, route
                )
                if score >= 0.5:  # 向量相似度阈值
                    return score, MatchMethod.SEMANTIC
            except Exception as e:
                logger.error(f"语义匹配失败: {str(e)}")
        
        return 0.0, MatchMethod.SEMANTIC
    
    def _is_question_variant(self, query: str, question: str) -> bool:
        """检查是否是问题的变体"""
        # 处理"X是什么"和"什么是X"的情况
        patterns = [
            (r'(.+)是什么', lambda m: f'什么是{m.group(1)}'),
            (r'什么是(.+)', lambda m: f'{m.group(1)}是什么'),
            (r'如何(.+)', lambda m: f'怎么{m.group(1)}'),
            (r'怎么(.+)', lambda m: f'如何{m.group(1)}'),
        ]
        
        for pattern, transform in patterns:
            match = re.match(pattern, query)
            if match:
                # 尝试构造另一种形式
                variant = transform(match)
                if variant == question:
                    return True
            
            # 反向检查
            match = re.match(pattern, question)
            if match:
                variant = transform(match)
                if variant == query:
                    return True
        
        # 检查核心内容是否相同（去除疑问词）
        query_core = re.sub(r'^(什么是|是什么|如何|怎么|为什么|哪些|哪个)', '', query)
        question_core = re.sub(r'^(什么是|是什么|如何|怎么|为什么|哪些|哪个)', '', question)
        
        if query_core and question_core:
            # 如果核心内容相似度高
            if query_core in question_core or question_core in query_core:
                return True
        
        return False
    
    async def _calculate_vector_similarity(
        self,
        query: str,
        route: QARoute
    ) -> float:
        """计算向量相似度"""
        try:
            # 获取查询的向量
            query_embedding = await self._get_text_embedding(query)
            
            # 获取路由问题的向量（优先从缓存获取）
            route_embedding = await self._get_route_embedding(route)
            
            if query_embedding is None or route_embedding is None:
                return 0.0
            
            # 计算余弦相似度
            similarity = self._cosine_similarity(query_embedding, route_embedding)
            return float(similarity)
            
        except Exception as e:
            logger.error(f"向量相似度计算失败: {str(e)}")
            return 0.0
    
    async def _get_text_embedding(self, text: str) -> Optional[List[float]]:
        """获取文本的向量表示"""
        try:
            # 从配置获取embedding模型
            embedding_config = optimized_config_manager.get_embedding_models_config()
            default_model = embedding_config.get('default_model')
            if not default_model:
                raise ValueError("未配置embedding模型，请设置DEFAULT_EMBEDDING_MODEL环境变量")
            
            # 使用embedding服务生成向量
            response = await embedding_service.create_embeddings(
                model_path=f"alibaba/{default_model}",
                texts=[text]
            )
            
            if response.embeddings:
                return response.embeddings[0]
            return None
            
        except Exception as e:
            logger.error(f"生成文本向量失败: {e}")
            return None
    
    async def _get_route_embedding(self, route: QARoute) -> Optional[List[float]]:
        """获取路由的向量（带缓存）"""
        route_id = str(route.id)
        
        # 检查缓存
        if route_id in self.route_embeddings_cache:
            return self.route_embeddings_cache[route_id]
        
        # 检查数据库是否已存储向量
        async with self.pool.acquire() as conn:
            embedding = await conn.fetchval("""
                SELECT question_embedding 
                FROM qa_routes 
                WHERE id = $1
            """, route.id)
            
            if embedding:
                # PostgreSQL的向量类型需要转换
                if isinstance(embedding, str):
                    # 解析字符串格式的向量
                    embedding = [float(x) for x in embedding.strip('[]').split(',')]
                self.route_embeddings_cache[route_id] = embedding
                return embedding
        
        # 生成新向量
        embedding = await self._get_text_embedding(route.question)
        if embedding:
            # 存储到数据库
            await self._store_route_embedding(route.id, embedding)
            # 缓存
            self.route_embeddings_cache[route_id] = embedding
        
        return embedding
    
    async def _store_route_embedding(self, route_id: UUID, embedding: List[float]):
        """存储路由向量到数据库"""
        try:
            async with self.pool.acquire() as conn:
                # 将向量转换为PostgreSQL向量格式
                embedding_str = '[' + ','.join(map(str, embedding)) + ']'
                await conn.execute("""
                    UPDATE qa_routes 
                    SET question_embedding = $2::vector
                    WHERE id = $1
                """, route_id, embedding_str)
        except Exception as e:
            logger.error(f"存储路由向量失败: {e}")
    
    def _cosine_similarity(self, vec1: List[float], vec2: List[float]) -> float:
        """计算余弦相似度"""
        vec1 = np.array(vec1)
        vec2 = np.array(vec2)
        
        dot_product = np.dot(vec1, vec2)
        norm1 = np.linalg.norm(vec1)
        norm2 = np.linalg.norm(vec2)
        
        if norm1 == 0 or norm2 == 0:
            return 0.0
        
        return dot_product / (norm1 * norm2)
    
    async def _invalidate_embeddings_cache(self, knowledge_base_id: str):
        """清理向量缓存"""
        # 清理与该知识库相关的所有路由缓存
        async with self.pool.acquire() as conn:
            route_ids = await conn.fetch("""
                SELECT id FROM qa_routes
                WHERE knowledge_base_id = $1
            """, knowledge_base_id)
            
            for row in route_ids:
                route_id = str(row['id'])
                if route_id in self.route_embeddings_cache:
                    del self.route_embeddings_cache[route_id]
    
    async def _search_in_qa_datasets(
        self,
        query_data: QARouteQuery,
        path_config: RetrievalPathConfig
    ) -> List[Dict[str, Any]]:
        """在QA数据集中搜索"""
        try:
            # TODO: 实现QA数据集搜索功能
            # 暂时返回空列表，待QAGenerationServiceSimplified实现search_qa_pairs方法
            logger.info(f"QA数据集搜索功能待实现")
            return []
            
        except Exception as e:
            logger.error(f"QA数据集搜索失败: {str(e)}")
            return []
    
    async def _search_in_documents(
        self,
        query_data: QARouteQuery,
        path_config: RetrievalPathConfig
    ) -> List[Dict[str, Any]]:
        """在知识文档中搜索"""
        try:
            # 简化实现：直接返回空列表，实际使用时应调用检索服务
            logger.info(f"文档检索功能暂未实现，跳过文档搜索")
            return []
        except Exception as e:
            logger.error(f"文档搜索失败: {str(e)}")
            return []
    
    async def _get_default_retrieval_paths(
        self,
        knowledge_base_id: str
    ) -> List[RetrievalPathConfig]:
        """获取默认检索路径配置"""
        return [
            RetrievalPathConfig(
                id=uuid4(),
                knowledge_base_id=knowledge_base_id,
                path_name="QA路由优先",
                path_order=1,
                source_type=PathSourceType.QA_ROUTES,
                is_enabled=True,
                config={"match_strategy": "hybrid"},
                fallback_action=FallbackAction.CONTINUE,
                min_confidence=0.7,
                max_results=5,
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow()
            ),
            RetrievalPathConfig(
                id=uuid4(),
                knowledge_base_id=knowledge_base_id,
                path_name="QA数据集次优",
                path_order=2,
                source_type=PathSourceType.QA_DATASETS,
                is_enabled=True,
                config={"search_mode": "semantic"},
                fallback_action=FallbackAction.CONTINUE,
                min_confidence=0.75,
                max_results=5,
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow()
            ),
            RetrievalPathConfig(
                id=uuid4(),
                knowledge_base_id=knowledge_base_id,
                path_name="知识文档兜底",
                path_order=3,
                source_type=PathSourceType.DOCUMENTS,
                is_enabled=True,
                config={"search_mode": "hybrid"},
                fallback_action=FallbackAction.STOP,
                min_confidence=0.5,
                max_results=10,
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow()
            )
        ]
    
    async def _log_match(
        self,
        match_result: QARouteSearchResult,
        query_data: QARouteQuery,
        session_id: str,
        response_time_ms: int
    ):
        """记录匹配日志"""
        try:
            async with self.pool.acquire() as conn:
                await conn.execute("""
                    INSERT INTO qa_route_match_logs (
                        id, qa_route_id, knowledge_base_id, user_query,
                        match_score, match_method, response_time_ms,
                        session_id, created_at
                    ) VALUES (
                        $1, $2, $3, $4, $5, $6, $7, $8, $9
                    )
                """,
                    uuid4(), match_result.route.id, query_data.knowledge_base_id,
                    query_data.query, match_result.match_score,
                    match_result.match_method, response_time_ms,
                    session_id, datetime.utcnow()
                )
        except Exception as e:
            logger.error(f"记录匹配日志失败: {str(e)}")
    
    # ===================== 批量导入功能 =====================
    
    async def import_from_qa_dataset(
        self,
        import_data: QARouteBatchImport,
        user_id: Optional[UUID] = None
    ) -> QARouteImportHistory:
        """从QA数据集导入路由"""
        # 创建导入历史记录
        history = await self._create_import_history(
            QARouteImportHistoryCreate(
                knowledge_base_id=import_data.knowledge_base_id,
                qa_dataset_id=import_data.qa_dataset_id,
                import_type="batch",
                total_items=len(import_data.routes),
                import_config={"merge_strategy": import_data.merge_strategy},
                created_by=user_id
            )
        )
        
        # 执行导入
        imported_count = 0
        failed_count = 0
        errors = []
        
        for route_data in import_data.routes:
            try:
                # 设置分类
                if import_data.category:
                    route_data.category = import_data.category
                elif import_data.auto_categorize:
                    route_data.category = await self._auto_categorize(route_data.question)
                
                # 检查重复
                if import_data.merge_strategy != "replace":
                    existing = await self._check_duplicate_route(
                        route_data.knowledge_base_id,
                        route_data.question
                    )
                    
                    if existing and import_data.merge_strategy == "skip":
                        continue
                    elif existing and import_data.merge_strategy == "merge":
                        # 合并逻辑
                        route_data.answer = f"{existing.answer}\n\n{route_data.answer}"
                        await self.update_qa_route(
                            existing.id,
                            QARouteUpdate(answer=route_data.answer),
                            user_id
                        )
                        imported_count += 1
                        continue
                
                # 创建新路由
                await self.create_qa_route(route_data, user_id)
                imported_count += 1
                
            except Exception as e:
                failed_count += 1
                errors.append({
                    "question": route_data.question,
                    "error": str(e)
                })
        
        # 更新导入历史
        await self._update_import_history(
            history.id,
            imported_count,
            failed_count,
            errors
        )
        
        return await self._get_import_history(history.id)
    
    async def _check_duplicate_route(
        self,
        knowledge_base_id: str,
        question: str
    ) -> Optional[QARoute]:
        """检查重复路由"""
        async with self.pool.acquire() as conn:
            row = await conn.fetchrow("""
                SELECT * FROM qa_routes
                WHERE knowledge_base_id = $1 AND question = $2
            """, knowledge_base_id, question)
            
            return QARoute(**dict(row)) if row else None
    
    async def _auto_categorize(self, question: str) -> str:
        """自动分类问题"""
        # 简单的规则分类
        question_lower = question.lower()
        
        if any(kw in question_lower for kw in ['如何', '怎么', '怎样', 'how to']):
            return "使用指南"
        elif any(kw in question_lower for kw in ['什么是', '是什么', 'what is']):
            return "基础概念"
        elif any(kw in question_lower for kw in ['为什么', '为何', 'why']):
            return "原理解释"
        elif any(kw in question_lower for kw in ['问题', '错误', 'error', 'issue']):
            return "故障排除"
        else:
            return "常见问题"
    
    async def _create_import_history(
        self,
        history_data: QARouteImportHistoryCreate
    ) -> QARouteImportHistory:
        """创建导入历史"""
        async with self.pool.acquire() as conn:
            history_id = uuid4()
            now = datetime.utcnow()
            
            row = await conn.fetchrow("""
                INSERT INTO qa_route_import_history (
                    id, knowledge_base_id, qa_dataset_id, import_type,
                    total_items, imported_items, failed_items,
                    import_config, status, started_at, created_by, created_at
                ) VALUES (
                    $1, $2, $3, $4, $5, 0, 0, $6, 'processing', $7, $8, $9
                ) RETURNING *
            """,
                history_id, history_data.knowledge_base_id,
                history_data.qa_dataset_id, history_data.import_type,
                history_data.total_items, json.dumps(history_data.import_config),
                now, history_data.created_by, now
            )
            
            return QARouteImportHistory(**dict(row))
    
    async def _update_import_history(
        self,
        history_id: UUID,
        imported_count: int,
        failed_count: int,
        errors: List[Dict[str, Any]]
    ):
        """更新导入历史"""
        async with self.pool.acquire() as conn:
            status = "completed" if failed_count == 0 else "completed_with_errors"
            
            await conn.execute("""
                UPDATE qa_route_import_history
                SET imported_items = $2,
                    failed_items = $3,
                    error_details = $4,
                    status = $5,
                    completed_at = $6
                WHERE id = $1
            """,
                history_id, imported_count, failed_count,
                json.dumps(errors), status, datetime.utcnow()
            )
    
    async def _get_import_history(self, history_id: UUID) -> QARouteImportHistory:
        """获取导入历史"""
        async with self.pool.acquire() as conn:
            row = await conn.fetchrow(
                "SELECT * FROM qa_route_import_history WHERE id = $1",
                history_id
            )
            return QARouteImportHistory(**dict(row)) if row else None
    
    # ===================== 统计功能 =====================
    
    async def get_route_statistics(
        self,
        knowledge_base_id: str
    ) -> QARouteStatistics:
        """获取路由统计信息"""
        async with self.pool.acquire() as conn:
            # 基础统计
            stats = await conn.fetchrow("""
                SELECT 
                    COUNT(*) as total_routes,
                    COUNT(*) FILTER (WHERE is_active = true) as active_routes,
                    COUNT(DISTINCT category) as categories_count,
                    MAX(updated_at) as last_updated
                FROM qa_routes
                WHERE knowledge_base_id = $1
            """, knowledge_base_id)
            
            # 匹配统计
            match_stats = await conn.fetchrow("""
                SELECT 
                    COUNT(*) as total_matches,
                    AVG(match_score) as avg_match_score,
                    COUNT(*) FILTER (WHERE is_helpful = true) as helpful_count
                FROM qa_route_match_logs
                WHERE knowledge_base_id = $1
            """, knowledge_base_id)
            
            helpful_rate = 0.0
            if match_stats['total_matches'] > 0:
                helpful_rate = (match_stats['helpful_count'] or 0) / match_stats['total_matches']
            
            return QARouteStatistics(
                knowledge_base_id=knowledge_base_id,
                total_routes=stats['total_routes'] or 0,
                active_routes=stats['active_routes'] or 0,
                categories_count=stats['categories_count'] or 0,
                avg_match_score=float(match_stats['avg_match_score'] or 0),
                total_matches=match_stats['total_matches'] or 0,
                helpful_rate=helpful_rate,
                last_updated=stats['last_updated'] or datetime.utcnow()
            )


# 创建服务单例
qa_routing_service = QARoutingService()