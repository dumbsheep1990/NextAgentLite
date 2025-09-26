"""
QA路由高级管理API
实现路由规则管理，将问题路由到指定的Collection或Agent
基于数据库实现，不使用硬编码
"""

from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
from uuid import UUID, uuid4
import json
import re
from fastapi import APIRouter, HTTPException, Query, Body, Response, Depends
from pydantic import BaseModel, Field
import asyncpg
import logging

from core.config_optimized import optimized_config_manager
from service.qa_routing_service import qa_routing_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/qa-routing", tags=["QA路由高级"])


# ===================== 数据模型 =====================

class RoutingRuleCreate(BaseModel):
    """创建路由规则请求 - 支持固定问答对"""
    name: str
    question: str  # 问题文本
    answer: Optional[str] = None  # 固定答案（可选，有则为固定问答对）
    priority: int = 1
    enabled: bool = True
    question_patterns: List[str] = []
    target_qa_datasets: List[str] = []  # 目标QA数据集
    target_collections: List[str] = []  # 目标知识库
    target_agents: List[str] = []  # 目标Agent
    conditions: Dict[str, Any] = {}
    routing_strategy: str = "hybrid"  # hybrid/qa_dataset_only/collection_only/agent_only
    fallback_behavior: str = "default_collection"


class RoutingRuleUpdate(BaseModel):
    """更新路由规则请求 - 支持固定问答对"""
    name: Optional[str] = None
    question: Optional[str] = None
    answer: Optional[str] = None  # 固定答案
    priority: Optional[int] = None
    enabled: Optional[bool] = None
    question_patterns: Optional[List[str]] = None
    target_qa_datasets: Optional[List[str]] = None
    target_collections: Optional[List[str]] = None
    target_agents: Optional[List[str]] = None
    conditions: Optional[Dict[str, Any]] = None
    routing_strategy: Optional[str] = None
    fallback_behavior: Optional[str] = None


class RoutingTestRequest(BaseModel):
    """路由测试请求"""
    question: str
    knowledge_base_id: Optional[str] = None


# ===================== 数据库连接 =====================

async def get_db_connection():
    """获取数据库连接"""
    db_config = optimized_config_manager.settings.database_postgresql
    conn = await asyncpg.connect(
        host=db_config.host,
        port=db_config.port,
        user=db_config.username,
        password=db_config.password,
        database=db_config.database
    )
    return conn


# ===================== 路由规则管理（基于qa_routes表） =====================

@router.get("/rules")
async def get_routing_rules(
    knowledge_base_id: Optional[str] = Query(None),
    enabled: Optional[bool] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100)
):
    """获取路由规则列表 - 支持四层路由架构"""
    conn = await get_db_connection()
    try:
        # 构建查询条件
        conditions = []
        params = []
        param_count = 0
        
        if knowledge_base_id:
            param_count += 1
            conditions.append(f"knowledge_base_id = ${param_count}")
            params.append(knowledge_base_id)
        
        if enabled is not None:
            param_count += 1
            conditions.append(f"is_active = ${param_count}")
            params.append(enabled)
        
        where_clause = f"WHERE {' AND '.join(conditions)}" if conditions else ""
        
        # 获取总数
        total_query = f"SELECT COUNT(*) FROM qa_routes {where_clause}"
        total = await conn.fetchval(total_query, *params)
        
        # 分页查询 - 包含answer字段以支持固定问答对
        offset = (page - 1) * page_size
        param_count += 1
        limit_param = param_count
        param_count += 1
        offset_param = param_count
        
        query = f"""
            SELECT id, knowledge_base_id, category as name, question, answer,
                   priority, is_active as enabled, keywords as question_patterns,
                   metadata, created_at, updated_at
            FROM qa_routes
            {where_clause}
            ORDER BY priority DESC, created_at DESC
            LIMIT ${limit_param} OFFSET ${offset_param}
        """
        params.extend([page_size, offset])
        
        rows = await conn.fetch(query, *params)
        
        rules = []
        for row in rows:
            metadata = row['metadata'] or {}
            
            # 判断路由类型
            routing_type = "dynamic"
            if row['answer'] and row['answer'].strip():
                routing_type = "fixed"
            
            rules.append({
                "id": str(row['id']),
                "name": row['name'],
                "question": row['question'],
                "answer": row['answer'],  # 固定答案
                "routing_type": routing_type,
                "priority": row['priority'],
                "enabled": row['enabled'],
                "question_patterns": row['question_patterns'] or [],
                "target_qa_datasets": metadata.get('target_qa_datasets', []),
                "target_collections": metadata.get('target_collections', []),
                "target_agents": metadata.get('target_agents', []),
                "conditions": metadata.get('conditions', {}),
                "routing_strategy": metadata.get('routing_strategy', 'hybrid'),
                "fallback_behavior": metadata.get('fallback_behavior', 'default_collection'),
                "created_at": row['created_at'].isoformat() if row['created_at'] else None,
                "updated_at": row['updated_at'].isoformat() if row['updated_at'] else None,
                "usage_count": metadata.get('usage_count', 0),
                "success_rate": metadata.get('success_rate', 0.0)
            })
        
        return {
            "total": total,
            "page": page,
            "page_size": page_size,
            "rules": rules
        }
        
    finally:
        await conn.close()


@router.post("/rules")
async def create_routing_rule(rule: RoutingRuleCreate, knowledge_base_id: str = Query(...)):
    """创建路由规则 - 保存到qa_routes表"""
    conn = await get_db_connection()
    try:
        rule_id = uuid4()
        now = datetime.utcnow()
        
        # 准备metadata字段
        metadata = {
            "target_collections": rule.target_collections,
            "target_agents": rule.target_agents,
            "conditions": rule.conditions,
            "routing_strategy": rule.routing_strategy,
            "fallback_behavior": rule.fallback_behavior,
            "usage_count": 0,
            "success_rate": 0.0
        }
        
        await conn.execute("""
            INSERT INTO qa_routes (
                id, knowledge_base_id, category, question, answer,
                keywords, priority, is_active, metadata, created_at, updated_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        """, 
            rule_id, knowledge_base_id, rule.name, rule.description, '',
            rule.question_patterns, rule.priority, rule.enabled,
            json.dumps(metadata), now, now
        )
        
        return {
            "id": str(rule_id),
            "message": "路由规则创建成功"
        }
        
    finally:
        await conn.close()


@router.put("/rules/{rule_id}")
async def update_routing_rule(rule_id: str, rule_update: RoutingRuleUpdate):
    """更新路由规则"""
    conn = await get_db_connection()
    try:
        # 获取现有规则
        existing = await conn.fetchrow(
            "SELECT metadata FROM qa_routes WHERE id = $1",
            UUID(rule_id)
        )
        
        if not existing:
            raise HTTPException(status_code=404, detail="规则未找到")
        
        metadata = existing['metadata'] or {}
        
        # 更新metadata
        if rule_update.target_collections is not None:
            metadata['target_collections'] = rule_update.target_collections
        if rule_update.target_agents is not None:
            metadata['target_agents'] = rule_update.target_agents
        if rule_update.conditions is not None:
            metadata['conditions'] = rule_update.conditions
        if rule_update.routing_strategy is not None:
            metadata['routing_strategy'] = rule_update.routing_strategy
        if rule_update.fallback_behavior is not None:
            metadata['fallback_behavior'] = rule_update.fallback_behavior
        
        # 构建更新语句
        update_fields = []
        params = []
        param_count = 0
        
        if rule_update.name is not None:
            param_count += 1
            update_fields.append(f"category = ${param_count}")
            params.append(rule_update.name)
        
        if rule_update.description is not None:
            param_count += 1
            update_fields.append(f"question = ${param_count}")
            params.append(rule_update.description)
        
        if rule_update.priority is not None:
            param_count += 1
            update_fields.append(f"priority = ${param_count}")
            params.append(rule_update.priority)
        
        if rule_update.enabled is not None:
            param_count += 1
            update_fields.append(f"is_active = ${param_count}")
            params.append(rule_update.enabled)
        
        if rule_update.question_patterns is not None:
            param_count += 1
            update_fields.append(f"keywords = ${param_count}")
            params.append(rule_update.question_patterns)
        
        # 更新metadata和时间
        param_count += 1
        update_fields.append(f"metadata = ${param_count}")
        params.append(json.dumps(metadata))
        
        param_count += 1
        update_fields.append(f"updated_at = ${param_count}")
        params.append(datetime.utcnow())
        
        # 添加WHERE条件
        param_count += 1
        params.append(UUID(rule_id))
        
        await conn.execute(f"""
            UPDATE qa_routes 
            SET {', '.join(update_fields)}
            WHERE id = ${param_count}
        """, *params)
        
        return {"message": "路由规则更新成功"}
        
    finally:
        await conn.close()


@router.delete("/rules/{rule_id}")
async def delete_routing_rule(rule_id: str):
    """删除路由规则"""
    success = await qa_routing_service.delete_qa_route(UUID(rule_id))
    if not success:
        raise HTTPException(status_code=404, detail="规则未找到")
    return {"message": "路由规则已删除"}


@router.put("/rules/{rule_id}/toggle")
async def toggle_routing_rule(rule_id: str, enabled: bool = Body(..., embed=True)):
    """切换路由规则启用状态"""
    conn = await get_db_connection()
    try:
        result = await conn.execute(
            "UPDATE qa_routes SET is_active = $1, updated_at = $2 WHERE id = $3",
            enabled, datetime.utcnow(), UUID(rule_id)
        )
        
        if result.split()[-1] == "0":
            raise HTTPException(status_code=404, detail="规则未找到")
        
        return {
            "rule_id": rule_id,
            "enabled": enabled,
            "message": f"路由规则已{'启用' if enabled else '禁用'}"
        }
        
    finally:
        await conn.close()


# ===================== 路由测试 =====================

@router.post("/rules/test")
async def test_routing(request: RoutingTestRequest):
    """测试四层路由匹配 - 仅返回路由决策，不执行检索"""
    conn = await get_db_connection()
    try:
        # 构建查询条件 - 必须指定knowledge_base_id
        if not request.knowledge_base_id:
            raise HTTPException(status_code=400, detail="必须指定knowledge_base_id")
            
        # 第1层：检查是否有固定问答对规则
        # 注意：这里只返回固定问答对的ID列表，实际检索由Agno执行
        fixed_qa_query = """
            SELECT id, category as name, question, answer, priority, metadata
            FROM qa_routes
            WHERE knowledge_base_id = $1 
                  AND is_active = true 
                  AND answer IS NOT NULL 
                  AND answer != ''
            ORDER BY priority DESC
        """
        
        fixed_qa_rows = await conn.fetch(fixed_qa_query, request.knowledge_base_id)
        
        # 如果存在固定问答对，返回路由到固定问答对检索
        if fixed_qa_rows:
            # 收集所有固定问答对的ID
            fixed_qa_ids = [str(row['id']) for row in fixed_qa_rows]
            
            return {
                "routing_layer": "fixed_qa",
                "routing_decision": {
                    "type": "fixed_qa_retrieval",
                    "fixed_qa_ids": fixed_qa_ids,
                    "knowledge_base_id": request.knowledge_base_id,
                    "strategy": "vector_similarity",
                    "retrieval_params": {
                        "top_k": 5,
                        "threshold": 0.85,
                        "use_embedding": True
                    }
                },
                "routed_to": "固定问答对检索",
                "message": "路由到固定问答对，由Agno执行向量检索"
            }
        
        # 第2-4层：动态路由规则匹配
        dynamic_query = """
            SELECT id, category as name, question, priority, 
                   keywords as question_patterns, metadata
            FROM qa_routes
            WHERE knowledge_base_id = $1
                  AND is_active = true
                  AND (answer IS NULL OR answer = '')
            ORDER BY priority DESC
        """
        
        dynamic_rows = await conn.fetch(dynamic_query, request.knowledge_base_id)
        
        # 匹配动态路由规则（基于正则表达式）
        matched_rule = None
        matched_patterns = []
        
        for row in dynamic_rows:
            patterns = row['question_patterns'] or []
            for pattern in patterns:
                try:
                    if re.search(pattern, request.question, re.IGNORECASE):
                        metadata = row['metadata'] or {}
                        matched_rule = {
                            "id": str(row['id']),
                            "name": row['name'],
                            "priority": row['priority'],
                            "metadata": metadata
                        }
                        matched_patterns.append(pattern)
                        break
                except:
                    continue
            if matched_rule:
                break
        
        # 构建路由决策
        if matched_rule:
            metadata = matched_rule['metadata']
            routing_strategy = metadata.get('routing_strategy', 'hybrid')
            
            # 构建检索层级配置
            retrieval_layers = []
            
            # 根据策略添加检索层
            if routing_strategy in ['qa_dataset_only', 'hybrid']:
                if metadata.get('target_qa_datasets'):
                    retrieval_layers.append({
                        "layer": "qa_dataset",
                        "datasets": metadata['target_qa_datasets'],
                        "priority": 2
                    })
            
            if routing_strategy in ['collection_only', 'hybrid']:
                if metadata.get('target_collections'):
                    retrieval_layers.append({
                        "layer": "knowledge_base",
                        "collections": metadata['target_collections'],
                        "priority": 3
                    })
            
            if routing_strategy in ['agent_only', 'hybrid']:
                if metadata.get('target_agents'):
                    retrieval_layers.append({
                        "layer": "agent",
                        "agents": metadata['target_agents'],
                        "priority": 4
                    })
            
            return {
                "routing_layer": routing_strategy,
                "matched_rule": {
                    "id": matched_rule['id'],
                    "name": matched_rule['name'],
                    "patterns": matched_patterns
                },
                "routing_decision": {
                    "type": "rule_based_routing",
                    "strategy": routing_strategy,
                    "retrieval_layers": retrieval_layers,
                    "fallback": metadata.get('fallback_behavior', 'default_retrieval')
                },
                "routed_to": f"规则路由 - {routing_strategy}",
                "message": "基于规则匹配的路由决策"
            }
        else:
            # 默认路由 - 返回标准四层检索配置
            return {
                "routing_layer": "default",
                "matched_rule": None,
                "routing_decision": {
                    "type": "default_cascade",
                    "strategy": "full_cascade",
                    "retrieval_layers": [
                        {
                            "layer": "fixed_qa",
                            "knowledge_base_id": request.knowledge_base_id,
                            "priority": 1
                        },
                        {
                            "layer": "qa_dataset",
                            "datasets": ["*"],
                            "priority": 2
                        },
                        {
                            "layer": "knowledge_base",
                            "collections": [request.knowledge_base_id],
                            "priority": 3
                        },
                        {
                            "layer": "agent",
                            "agents": ["default"],
                            "priority": 4
                        }
                    ],
                    "fallback": "general_retrieval"
                },
                "routed_to": "默认四层路由",
                "message": "使用默认的四层级联检索"
            }
            
    finally:
        await conn.close()


# ===================== 路由日志 =====================

@router.get("/logs")
async def get_routing_logs(
    rule_id: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100)
):
    """获取路由日志 - 从qa_route_match_logs表读取"""
    conn = await get_db_connection()
    try:
        # 构建查询
        conditions = []
        params = []
        param_count = 0
        
        if rule_id:
            param_count += 1
            conditions.append(f"rule_id = ${param_count}")
            params.append(UUID(rule_id))
        
        where_clause = f"WHERE {' AND '.join(conditions)}" if conditions else ""
        
        # 获取总数
        total = await conn.fetchval(f"SELECT COUNT(*) FROM qa_route_match_logs {where_clause}", *params)
        
        # 分页查询
        offset = (page - 1) * page_size
        params.extend([page_size, offset])
        
        query = f"""
            SELECT l.*, r.category as rule_name
            FROM qa_route_match_logs l
            LEFT JOIN qa_routes r ON l.rule_id = r.id
            {where_clause}
            ORDER BY l.created_at DESC
            LIMIT ${len(params)-1} OFFSET ${len(params)}
        """
        
        rows = await conn.fetch(query, *params)
        
        logs = []
        for row in rows:
            logs.append({
                "id": str(row['id']),
                "rule_id": str(row['rule_id']) if row['rule_id'] else None,
                "rule_name": row['rule_name'],
                "question": row['query'],
                "matched_pattern": row['matched_pattern'],
                "routed_to": row['routed_to'],
                "routing_type": row['routing_type'],
                "response_time": row['response_time_ms'] / 1000.0,
                "success": row['is_successful'],
                "timestamp": row['created_at'].isoformat(),
                "session_id": row['session_id']
            })
        
        return {
            "total": total,
            "page": page,
            "page_size": page_size,
            "logs": logs
        }
        
    finally:
        await conn.close()


# ===================== 固定问答对管理 =====================

@router.post("/fixed-qa")
async def create_fixed_qa(
    knowledge_base_id: str = Query(..., description="知识库ID"),
    question: str = Body(..., description="问题"),
    answer: str = Body(..., description="固定答案"),
    category: str = Body("固定问答", description="分类"),
    priority: int = Body(100, description="优先级，越大越优先")
):
    """创建固定问答对 - 仅存储规则，不执行向量化"""
    conn = await get_db_connection()
    try:
        rule_id = uuid4()
        now = datetime.utcnow()
        
        # 插入固定问答对（不生成向量，由Agno在检索时处理）
        await conn.execute("""
            INSERT INTO qa_routes (
                id, knowledge_base_id, category, question, answer,
                keywords, priority, is_active,
                metadata, created_at, updated_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        """, 
            rule_id, knowledge_base_id, category, question, answer,
            [], priority, True,
            json.dumps({
                "type": "fixed_qa",
                "needs_embedding": True  # 标记需要向量化
            }), 
            now, now
        )
        
        return {
            "id": str(rule_id),
            "message": "固定问答对创建成功",
            "question": question,
            "answer": answer,
            "knowledge_base_id": knowledge_base_id,
            "note": "向量化将在首次检索时由Agno框架处理"
        }
        
    finally:
        await conn.close()


@router.get("/fixed-qa")
async def list_fixed_qa(
    knowledge_base_id: str = Query(..., description="知识库ID"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100)
):
    """获取知识库的固定问答对列表"""
    conn = await get_db_connection()
    try:
        # 获取总数
        total = await conn.fetchval("""
            SELECT COUNT(*) FROM qa_routes 
            WHERE knowledge_base_id = $1 
                  AND answer IS NOT NULL 
                  AND answer != ''
        """, knowledge_base_id)
        
        # 分页查询
        offset = (page - 1) * page_size
        
        rows = await conn.fetch("""
            SELECT id, category, question, answer, priority, 
                   is_active, created_at, updated_at,
                   metadata
            FROM qa_routes
            WHERE knowledge_base_id = $1 
                  AND answer IS NOT NULL 
                  AND answer != ''
            ORDER BY priority DESC, created_at DESC
            LIMIT $2 OFFSET $3
        """, knowledge_base_id, page_size, offset)
        
        items = []
        for row in rows:
            metadata = row['metadata'] or {}
            items.append({
                "id": str(row['id']),
                "category": row['category'],
                "question": row['question'],
                "answer": row['answer'],
                "priority": row['priority'],
                "enabled": row['is_active'],
                "usage_count": metadata.get('usage_count', 0),
                "created_at": row['created_at'].isoformat() if row['created_at'] else None,
                "updated_at": row['updated_at'].isoformat() if row['updated_at'] else None
            })
        
        return {
            "total": total,
            "page": page,
            "page_size": page_size,
            "items": items
        }
        
    finally:
        await conn.close()


@router.put("/fixed-qa/{qa_id}")
async def update_fixed_qa(
    qa_id: str,
    question: Optional[str] = Body(None),
    answer: Optional[str] = Body(None),
    priority: Optional[int] = Body(None),
    enabled: Optional[bool] = Body(None)
):
    """更新固定问答对 - 仅更新数据，不处理向量"""
    conn = await get_db_connection()
    try:
        # 构建更新语句
        update_fields = []
        params = []
        param_count = 0
        
        if question is not None:
            param_count += 1
            update_fields.append(f"question = ${param_count}")
            params.append(question)
            
            # 清除旧向量，标记需要重新生成
            param_count += 1
            update_fields.append(f"question_embedding = ${param_count}")
            params.append(None)
        
        if answer is not None:
            param_count += 1
            update_fields.append(f"answer = ${param_count}")
            params.append(answer)
        
        if priority is not None:
            param_count += 1
            update_fields.append(f"priority = ${param_count}")
            params.append(priority)
        
        if enabled is not None:
            param_count += 1
            update_fields.append(f"is_active = ${param_count}")
            params.append(enabled)
        
        if not update_fields:
            return {"message": "没有需要更新的字段"}
        
        # 更新metadata标记
        param_count += 1
        update_fields.append(f"metadata = metadata || ${param_count}::jsonb")
        params.append(json.dumps({"needs_embedding": True}))
        
        # 添加更新时间
        param_count += 1
        update_fields.append(f"updated_at = ${param_count}")
        params.append(datetime.utcnow())
        
        # 添加WHERE条件
        param_count += 1
        params.append(UUID(qa_id))
        
        result = await conn.execute(f"""
            UPDATE qa_routes 
            SET {', '.join(update_fields)}
            WHERE id = ${param_count}
        """, *params)
        
        if result.split()[-1] == "0":
            raise HTTPException(status_code=404, detail="固定问答对未找到")
        
        return {
            "message": "固定问答对更新成功",
            "note": "向量将在下次检索时重新生成"
        }
        
    finally:
        await conn.close()


@router.delete("/fixed-qa/{qa_id}")
async def delete_fixed_qa(qa_id: str):
    """删除固定问答对"""
    conn = await get_db_connection()
    try:
        result = await conn.execute(
            "DELETE FROM qa_routes WHERE id = $1 AND answer IS NOT NULL",
            UUID(qa_id)
        )
        
        if result.split()[-1] == "0":
            raise HTTPException(status_code=404, detail="固定问答对未找到")
        
        return {"message": "固定问答对已删除"}
        
    finally:
        await conn.close()



# ===================== 资源管理 =====================

@router.get("/resources/collections")
async def get_available_collections():
    """获取可用的知识库列表（容错版）

    说明：不同环境 knowledge_collections 的列可能不同，这里不再直接引用 metadata/vectorized_count。
    统一按 is_active 过滤，并通过 join 统计文档数量，避免 UndefinedColumnError。
    """
    conn = await get_db_connection()
    try:
        rows = await conn.fetch(
            """
            SELECT 
              kc.id,
              kc.name,
              kc.description,
              kc.is_active,
              COUNT(kd.id) AS document_count
            FROM knowledge_collections kc
            LEFT JOIN knowledge_documents kd 
              ON kc.id = kd.collection_id AND (kd.status IS NULL OR kd.status != 'deleted')
            WHERE kc.is_active = true
            GROUP BY kc.id, kc.name, kc.description, kc.is_active
            ORDER BY kc.name
            """
        )

        collections = []
        for row in rows:
            collections.append({
                "id": row["id"],
                "name": row["name"],
                "description": row["description"],
                "document_count": row["document_count"] or 0,
                "specialty": [],
                "is_ready": (row["document_count"] or 0) > 0,
            })

        return {"total": len(collections), "collections": collections}
    finally:
        await conn.close()


@router.get("/resources/agents")
async def get_available_agents():
    """获取可用的Agent列表 - 从agent_configs表和配置文件读取"""
    conn = await get_db_connection()
    try:
        # 从数据库获取配置的agents
        query = """
            SELECT id, name, description, agent_type, config
            FROM agent_configs
            WHERE is_active = true
            ORDER BY created_at DESC
        """
        
        rows = await conn.fetch(query)
        
        agents = []
        
        # 添加数据库中的agents
        for row in rows:
            config = row['config'] or {}
            agents.append({
                "id": str(row['id']),
                "name": row['name'],
                "description": row['description'],
                "type": row['agent_type'],
                "specialty": config.get('specialty', []),
                "is_available": True
            })
        
        # 添加配置文件中的默认agents（基于Agno框架）
        default_agents = [
            {
                "id": "geopolymer_qa_team_v2",
                "name": "地聚物QA团队V2",
                "description": "多智能体协作的地聚物材料问答团队",
                "type": "team",
                "specialty": ["地聚物", "材料科学", "技术问答"],
                "is_available": True
            },
            {
                "id": "general_qa_team_v2",
                "name": "通用QA团队V2",
                "description": "通用领域的多智能体问答团队",
                "type": "team",
                "specialty": ["通用问答", "知识检索"],
                "is_available": True
            },
            {
                "id": "question_decomposition_agent",
                "name": "问题分解智能体",
                "description": "分解复杂问题",
                "type": "single",
                "specialty": ["问题分析"],
                "is_available": True
            },
            {
                "id": "knowledge_retrieval_agent",
                "name": "知识检索智能体",
                "description": "检索相关信息",
                "type": "single",
                "specialty": ["知识检索"],
                "is_available": True
            },
            {
                "id": "summary_answer_agent",
                "name": "总结回答智能体",
                "description": "整合信息生成答案",
                "type": "single",
                "specialty": ["信息整合"],
                "is_available": True
            }
        ]
        
        # 合并agents（避免重复）
        agent_ids = {agent['id'] for agent in agents}
        for agent in default_agents:
            if agent['id'] not in agent_ids:
                agents.append(agent)
        
        return {
            "total": len(agents),
            "agents": agents
        }
        
    finally:
        await conn.close()


# ===================== 统计报告 =====================

@router.get("/reports/usage")
async def get_usage_report(
    knowledge_base_id: Optional[str] = Query(None),
    start_date: Optional[datetime] = Query(None),
    end_date: Optional[datetime] = Query(None)
):
    """获取路由使用统计报告"""
    conn = await get_db_connection()
    try:
        # 基础统计
        conditions = []
        params = []
        param_count = 0
        
        if knowledge_base_id:
            param_count += 1
            conditions.append(f"knowledge_base_id = ${param_count}")
            params.append(knowledge_base_id)
        
        where_clause = f"WHERE {' AND '.join(conditions)}" if conditions else ""
        
        # 规则统计
        rules_stats = await conn.fetchrow(f"""
            SELECT 
                COUNT(*) as total_rules,
                COUNT(CASE WHEN is_active THEN 1 END) as enabled_rules
            FROM qa_routes
            {where_clause}
        """, *params)
        
        # 日志统计（如果有日期范围）
        log_conditions = []
        log_params = []
        if start_date:
            log_params.append(start_date)
            log_conditions.append(f"created_at >= ${len(log_params)}")
        if end_date:
            log_params.append(end_date)
            log_conditions.append(f"created_at <= ${len(log_params)}")
        
        log_where = f"WHERE {' AND '.join(log_conditions)}" if log_conditions else ""
        
        log_stats = await conn.fetchrow(f"""
            SELECT 
                COUNT(*) as total_requests,
                COUNT(CASE WHEN is_successful THEN 1 END) as successful_requests,
                AVG(response_time_ms) as avg_response_time
            FROM qa_route_match_logs
            {log_where}
        """, *log_params)
        
        return {
            "period": {
                "start": (start_date or datetime.now() - timedelta(days=30)).isoformat(),
                "end": (end_date or datetime.now()).isoformat()
            },
            "summary": {
                "total_rules": rules_stats['total_rules'],
                "enabled_rules": rules_stats['enabled_rules'],
                "total_routing_requests": log_stats['total_requests'] if log_stats else 0,
                "successful_requests": log_stats['successful_requests'] if log_stats else 0,
                "avg_response_time": float(log_stats['avg_response_time']) / 1000.0 if log_stats and log_stats['avg_response_time'] else 0
            }
        }
        
    finally:
        await conn.close()
