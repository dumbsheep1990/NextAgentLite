"""
多层级联检索服务
实现四层路由架构：固定问答对 -> QA数据集 -> 知识库 -> Agent
"""
import asyncio
import json
import logging
from typing import Dict, List, Optional, Any, Tuple
from datetime import datetime
from uuid import UUID
import numpy as np

import asyncpg
from core.config_optimized import optimized_config_manager
from service.embedding_service import embedding_service
from service.embedding_config_service import get_embedding_model_path_sync

logger = logging.getLogger(__name__)


class MultilayerRetrievalService:
    """多层级联检索服务 - 支持四层路由架构"""
    
    def __init__(self):
        self.db_config = optimized_config_manager.settings.database_postgresql
        self.pool = None
        # 使用统一的embedding配置服务
        self.default_embedding_model = get_embedding_model_path_sync()
        logger.info(f"[MULTILAYER] 使用embedding模型: {self.default_embedding_model}")
        
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
            
    async def execute_multilayer_retrieval(
        self,
        query: str,
        routing_decision: Dict[str, Any],
        knowledge_base_id: Optional[str] = None,
        session_id: Optional[str] = None,
        filters: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        执行多层级联检索
        
        Args:
            query: 用户查询
            routing_decision: 路由决策（来自qa_routing_advanced）
            knowledge_base_id: 知识库ID
            session_id: 会话ID
            
        Returns:
            检索结果
        """
        start_time = datetime.utcnow()
        results = {
            "layers_executed": [],
            "final_answer": None,
            "retrieved_items": [],
            "execution_time_ms": 0,
            "routing_type": routing_decision.get("type"),
            "session_id": session_id
        }
        
        try:
            routing_type = routing_decision.get("type")
            
            # 根据路由类型执行不同的检索策略
            if routing_type == "fixed_qa_retrieval":
                # 执行固定问答对检索
                result = await self._execute_fixed_qa_retrieval(
                    query=query,
                    fixed_qa_ids=routing_decision.get("fixed_qa_ids", []),
                    retrieval_params=routing_decision.get("retrieval_params", {}),
                    knowledge_base_id=knowledge_base_id
                )
                if result:
                    results["layers_executed"].append("fixed_qa")
                    results["final_answer"] = result.get("answer")
                    results["retrieved_items"].append(result)
                    
            elif routing_type == "rule_based_routing":
                # 执行规则路由的多层检索
                retrieval_layers = routing_decision.get("retrieval_layers", [])
                
                for layer in sorted(retrieval_layers, key=lambda x: x.get("priority", 999)):
                    layer_type = layer.get("layer")
                    
                    if layer_type == "qa_dataset":
                        result = await self._execute_qa_dataset_retrieval(
                            query=query,
                            datasets=layer.get("datasets", []),
                            knowledge_base_id=knowledge_base_id
                        )
                    elif layer_type == "knowledge_base":
                        result = await self._execute_knowledge_base_retrieval(
                            query=query,
                            collections=layer.get("collections", []),
                            knowledge_base_id=knowledge_base_id,
                            filters=filters or {}
                        )
                    elif layer_type == "agent":
                        result = await self._execute_agent_retrieval(
                            query=query,
                            agents=layer.get("agents", []),
                            knowledge_base_id=knowledge_base_id
                        )
                    else:
                        continue
                        
                    if result and result.get("confidence", 0) > 0.7:
                        results["layers_executed"].append(layer_type)
                        results["retrieved_items"].extend(result.get("items", []))
                        
                        # 如果找到高置信度答案，可以提前返回
                        if result.get("confidence", 0) > 0.85:
                            results["final_answer"] = result.get("answer")
                            break
                            
            elif routing_type == "default_cascade":
                # 执行默认的四层级联检索
                retrieval_layers = routing_decision.get("retrieval_layers", [])
                
                for layer in sorted(retrieval_layers, key=lambda x: x.get("priority", 999)):
                    layer_type = layer.get("layer")
                    
                    logger.info(f"[MULTILAYER] 执行第{layer.get('priority')}层检索: {layer_type}")
                    
                    if layer_type == "fixed_qa":
                        # 第1层：固定问答对
                        result = await self._execute_fixed_qa_cascade(
                            query=query,
                            knowledge_base_id=layer.get("knowledge_base_id") or knowledge_base_id
                        )
                        if result and result.get("confidence", 0) > 0.85:
                            results["layers_executed"].append("fixed_qa")
                            results["final_answer"] = result.get("answer")
                            results["retrieved_items"].append(result)
                            break  # 找到高置信度答案，停止级联
                            
                    elif layer_type == "qa_dataset":
                        # 第2层：QA数据集
                        result = await self._execute_qa_dataset_retrieval(
                            query=query,
                            datasets=layer.get("datasets", ["*"]),
                            knowledge_base_id=knowledge_base_id
                        )
                        if result and result.get("confidence", 0) > 0.75:
                            results["layers_executed"].append("qa_dataset")
                            results["retrieved_items"].extend(result.get("items", []))
                            if result.get("confidence", 0) > 0.85:
                                results["final_answer"] = result.get("answer")
                                break
                                
                    elif layer_type == "knowledge_base":
                        # 第3层：知识库文档
                        result = await self._execute_knowledge_base_retrieval(
                            query=query,
                            collections=layer.get("collections", ["*"]),
                            knowledge_base_id=knowledge_base_id
                        )
                        if result:
                            results["layers_executed"].append("knowledge_base")
                            results["retrieved_items"].extend(result.get("items", []))
                            
                    elif layer_type == "agent":
                        # 第4层：Agent处理
                        result = await self._execute_agent_retrieval(
                            query=query,
                            agents=layer.get("agents", ["default"]),
                            knowledge_base_id=knowledge_base_id
                        )
                        if result:
                            results["layers_executed"].append("agent")
                            results["final_answer"] = result.get("answer")
                            
        except Exception as e:
            logger.error(f"[MULTILAYER] 多层检索执行失败: {e}")
            results["error"] = str(e)
            
        # 计算总耗时
        results["execution_time_ms"] = int(
            (datetime.utcnow() - start_time).total_seconds() * 1000
        )
        
        return results
        
    async def _execute_fixed_qa_retrieval(
        self,
        query: str,
        fixed_qa_ids: List[str],
        retrieval_params: Dict[str, Any],
        knowledge_base_id: Optional[str] = None
    ) -> Optional[Dict[str, Any]]:
        """执行固定问答对检索"""
        if not fixed_qa_ids:
            return None
            
        async with self.pool.acquire() as conn:
            try:
                # 生成查询向量
                query_response = await embedding_service.create_embeddings(
                    model_path=self.default_embedding_model,
                    texts=[query]
                )
                
                if not query_response.embeddings:
                    logger.warning("[MULTILAYER] 无法生成查询向量")
                    return None
                    
                query_embedding = np.array(query_response.embeddings[0])
                
                # 获取固定问答对
                placeholders = ','.join([f'${i+1}' for i in range(len(fixed_qa_ids))])
                query_sql = f"""
                    SELECT id, question, answer, priority,
                           question_embedding::text as embedding_str
                    FROM qa_routes
                    WHERE id IN ({placeholders})
                          AND is_active = true
                          AND answer IS NOT NULL
                    ORDER BY priority DESC
                """
                
                # 将字符串ID转换为UUID
                uuid_ids = [UUID(qa_id) for qa_id in fixed_qa_ids]
                rows = await conn.fetch(query_sql, *uuid_ids)
                
                if not rows:
                    return None
                    
                # 计算相似度并找到最佳匹配
                best_match = None
                best_score = 0.0
                threshold = retrieval_params.get("threshold", 0.85)
                
                for row in rows:
                    # 获取或生成问答对的向量
                    if row['embedding_str']:
                        try:
                            qa_embedding = np.array([
                                float(x) for x in row['embedding_str'].strip('[]').split(',')
                            ])
                        except:
                            continue
                    else:
                        # 生成新向量
                        qa_response = await embedding_service.create_embeddings(
                            model_path=self.default_embedding_model,
                            texts=[row['question']]
                        )
                        if qa_response.embeddings:
                            qa_embedding = np.array(qa_response.embeddings[0])
                            # 存储向量供下次使用
                            embedding_str = '[' + ','.join(map(str, qa_embedding)) + ']'
                            await conn.execute(
                                "UPDATE qa_routes SET question_embedding = $2::vector WHERE id = $1",
                                row['id'], embedding_str
                            )
                        else:
                            continue
                            
                    # 计算余弦相似度
                    similarity = np.dot(query_embedding, qa_embedding) / (
                        np.linalg.norm(query_embedding) * np.linalg.norm(qa_embedding)
                    )
                    
                    if similarity > best_score:
                        best_score = similarity
                        best_match = row
                        
                # 如果相似度超过阈值，返回固定答案
                if best_match and best_score >= threshold:
                    return {
                        "type": "fixed_qa",
                        "question": best_match['question'],
                        "answer": best_match['answer'],
                        "confidence": float(best_score),
                        "qa_id": str(best_match['id']),
                        "priority": best_match['priority']
                    }
                    
                return None
                
            except Exception as e:
                logger.error(f"[MULTILAYER] 固定问答对检索失败: {e}")
                return None
                
    async def _execute_fixed_qa_cascade(
        self,
        query: str,
        knowledge_base_id: str
    ) -> Optional[Dict[str, Any]]:
        """执行固定问答对级联检索（用于默认级联模式）"""
        async with self.pool.acquire() as conn:
            try:
                # 获取该知识库的所有固定问答对
                rows = await conn.fetch("""
                    SELECT id FROM qa_routes
                    WHERE knowledge_base_id = $1
                          AND is_active = true
                          AND answer IS NOT NULL
                          AND answer != ''
                    ORDER BY priority DESC
                """, knowledge_base_id)
                
                if not rows:
                    return None
                    
                fixed_qa_ids = [str(row['id']) for row in rows]
                
                # 执行检索
                return await self._execute_fixed_qa_retrieval(
                    query=query,
                    fixed_qa_ids=fixed_qa_ids,
                    retrieval_params={"threshold": 0.85, "top_k": 5},
                    knowledge_base_id=knowledge_base_id
                )
                
            except Exception as e:
                logger.error(f"[MULTILAYER] 固定问答对级联检索失败: {e}")
                return None
                
    async def _execute_qa_dataset_retrieval(
        self,
        query: str,
        datasets: List[str],
        knowledge_base_id: Optional[str] = None
    ) -> Optional[Dict[str, Any]]:
        """执行QA数据集检索"""
        try:
            # 这里应该调用实际的QA数据集检索服务
            # 暂时使用占位实现
            from service.qa_dataset_service import qa_dataset_service
            
            # 如果datasets包含"*"，检索所有数据集
            if "*" in datasets:
                # 检索所有QA数据集
                results = await qa_dataset_service.search_qa_pairs(
                    query=query,
                    top_k=10
                )
            else:
                # 检索指定的数据集
                results = await qa_dataset_service.search_qa_pairs(
                    query=query,
                    dataset_ids=datasets,
                    top_k=10
                )
                
            if results and len(results) > 0:
                # 返回最佳匹配
                best_result = results[0]
                return {
                    "type": "qa_dataset",
                    "items": results[:5],  # 返回前5个结果
                    "answer": best_result.get("answer"),
                    "confidence": best_result.get("score", 0.7)
                }
                
            return None
            
        except Exception as e:
            logger.error(f"[MULTILAYER] QA数据集检索失败: {e}")
            return None
            
    async def _execute_knowledge_base_retrieval(
        self,
        query: str,
        collections: List[str],
        knowledge_base_id: Optional[str] = None,
        filters: Optional[Dict[str, Any]] = None
    ) -> Optional[Dict[str, Any]]:
        """执行知识库文档检索"""
        try:
            # 通过统一检索路由执行（自动按集合配置选择 hybrid/hirag）
            from service.retrieval_router_service import routed_retrieval
            target_collection = (
                knowledge_base_id if knowledge_base_id and "*" not in collections else None
            )
            if not target_collection:
                return None
            result = await routed_retrieval(
                query=query,
                collection_id=target_collection,
                mode="auto",
                top_k=10,
                filters=filters or {},
                fallback_to_hybrid=True,
                hirag_mode="hi",
            )

            if result.get("success"):
                items = result.get("items") or result.get("results") or []
                return {
                    "type": "knowledge_base",
                    "items": items[:5],
                    "confidence": 0.7,
                    "mode": result.get("mode"),
                }
            return None
            
        except Exception as e:
            logger.error(f"[MULTILAYER] 知识库检索失败: {e}")
            return None
            
    async def _execute_agent_retrieval(
        self,
        query: str,
        agents: List[str],
        knowledge_base_id: Optional[str] = None
    ) -> Optional[Dict[str, Any]]:
        """执行Agent处理"""
        try:
            # 调用Agent服务
            from service.agent_service import agent_service
            
            # 选择Agent
            agent_name = agents[0] if agents else "default"
            if agent_name == "default":
                agent_name = "summary_answer_agent"  # 默认使用总结回答Agent
                
            # 调用Agent
            result = await agent_service.call_agent(
                agent_name=agent_name,
                question=query,
                context={"knowledge_base_id": knowledge_base_id}
            )
            
            if result:
                return {
                    "type": "agent",
                    "answer": result.get("content", result),
                    "agent_used": agent_name,
                    "confidence": 0.8
                }
                
            return None
            
        except Exception as e:
            logger.error(f"[MULTILAYER] Agent处理失败: {e}")
            return None


# 创建服务单例
multilayer_retrieval_service = MultilayerRetrievalService()
