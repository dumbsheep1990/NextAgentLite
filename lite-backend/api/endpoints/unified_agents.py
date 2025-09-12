"""
统一智能体管理API
支持Agno Team和Youtu-Agent的统一管理
"""
import json
import uuid
from datetime import datetime
from typing import Dict, List, Optional, Any, Union
from fastapi import APIRouter, HTTPException, Depends, Query, BackgroundTasks
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
import asyncio
import time

from core.logger import logger
from db.database import get_db
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text

# 导入现有服务
try:
    from service.advanced_agent_team_service import advanced_agent_team_service
except ImportError:
    advanced_agent_team_service = None

try:
    from youtu_agent_integration.services import YoutuAgentService, MetaAgentService
    youtu_agent_service = YoutuAgentService()
    meta_agent_service = MetaAgentService()
except ImportError:
    youtu_agent_service = None
    meta_agent_service = None

router = APIRouter(prefix="/unified-agents", tags=["Unified Agent Management"])

# 请求模型
class AgentConfigModel(BaseModel):
    """智能体配置模型"""
    # Agno Team配置
    coordinator: Optional[str] = None
    members: Optional[List[str]] = None
    mode: Optional[str] = None
    
    # Youtu-Agent配置
    model: Optional[Dict[str, Any]] = None
    toolkits: Optional[List[str]] = None
    environment: Optional[str] = None
    
    # 混合配置
    primaryFramework: Optional[str] = None
    fallbackFramework: Optional[str] = None
    routingRules: Optional[List[Dict[str, Any]]] = None

class KnowledgeBindingModel(BaseModel):
    """知识库绑定配置"""
    collections: List[str] = Field(default_factory=list)
    retrievalMode: str = "all"
    customFilters: List[Dict[str, Any]] = Field(default_factory=list)

class CreateAgentRequest(BaseModel):
    """创建智能体请求"""
    name: str = Field(..., description="智能体标识")
    displayName: str = Field(..., description="显示名称")
    description: Optional[str] = None
    framework: str = Field(..., description="框架类型: agno, youtu, hybrid")
    type: str = Field(..., description="智能体类型: team, simple, orchestra, hybrid")
    config: AgentConfigModel = Field(default_factory=AgentConfigModel)
    knowledgeBinding: KnowledgeBindingModel = Field(default_factory=KnowledgeBindingModel)
    tags: List[str] = Field(default_factory=list)

class UpdateAgentRequest(BaseModel):
    """更新智能体请求"""
    displayName: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    config: Optional[AgentConfigModel] = None
    knowledgeBinding: Optional[KnowledgeBindingModel] = None
    tags: Optional[List[str]] = None

class ExecuteAgentRequest(BaseModel):
    """执行智能体请求"""
    query: str = Field(..., description="查询内容")
    sessionId: Optional[str] = None
    stream: bool = False
    metadata: Dict[str, Any] = Field(default_factory=dict)

class AgentResponse(BaseModel):
    """智能体响应模型"""
    id: str
    name: str
    displayName: str
    description: Optional[str]
    framework: str
    type: str
    status: str
    config: Dict[str, Any]
    knowledgeBinding: Dict[str, Any]
    performanceStats: Dict[str, Any]
    createdAt: datetime
    updatedAt: datetime
    tags: List[str]

class TemplateResponse(BaseModel):
    """模板响应模型"""
    id: str
    name: str
    framework: str
    type: str
    category: str
    description: Optional[str]
    defaultConfig: Dict[str, Any]
    isPublic: bool
    createdAt: datetime

class ExecutionResponse(BaseModel):
    """执行响应模型"""
    id: str
    agentId: str
    sessionId: Optional[str]
    query: str
    response: Optional[str]
    status: str
    executionTimeMs: Optional[int]
    errorMessage: Optional[str]
    startedAt: datetime
    completedAt: Optional[datetime]

# API端点

@router.get("/", response_model=List[AgentResponse])
async def list_agents(
    framework: Optional[str] = Query(None, description="筛选框架类型"),
    status: Optional[str] = Query(None, description="筛选状态"),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db)
):
    """获取智能体列表"""
    try:
        # 构建查询条件
        conditions = []
        params = {}
        
        if framework:
            conditions.append("framework = :framework")
            params["framework"] = framework
            
        if status:
            conditions.append("status = :status")
            params["status"] = status
        
        where_clause = " WHERE " + " AND ".join(conditions) if conditions else ""
        
        query = text(f"""
            SELECT id, name, display_name, description, framework, type, status,
                   config, knowledge_binding, performance_stats, created_at, updated_at, tags
            FROM unified_agents
            {where_clause}
            ORDER BY created_at DESC
            LIMIT :limit OFFSET :offset
        """)
        
        params.update({"limit": limit, "offset": offset})
        result = await db.execute(query, params)
        rows = result.fetchall()
        
        agents = []
        for row in rows:
            agents.append(AgentResponse(
                id=str(row.id),
                name=row.name,
                displayName=row.display_name,
                description=row.description,
                framework=row.framework,
                type=row.type,
                status=row.status,
                config=row.config or {},
                knowledgeBinding=row.knowledge_binding or {},
                performanceStats=row.performance_stats or {},
                createdAt=row.created_at,
                updatedAt=row.updated_at,
                tags=row.tags or []
            ))
        
        logger.info(f"获取智能体列表成功，返回 {len(agents)} 个智能体")
        return agents
        
    except Exception as e:
        logger.error(f"获取智能体列表失败: {e}")
        raise HTTPException(status_code=500, detail=f"获取智能体列表失败: {str(e)}")

@router.get("/templates", response_model=List[TemplateResponse])
async def list_templates(
    framework: Optional[str] = Query(None, description="筛选框架类型"),
    category: Optional[str] = Query(None, description="筛选分类"),
    db: AsyncSession = Depends(get_db)
):
    """获取智能体模板列表"""
    try:
        conditions = ["is_public = true"]
        params = {}
        
        if framework:
            conditions.append("framework = :framework")
            params["framework"] = framework
            
        if category:
            conditions.append("category = :category")
            params["category"] = category
        
        where_clause = " WHERE " + " AND ".join(conditions)
        
        query = text(f"""
            SELECT id, name, framework, type, category, description, default_config, is_public, created_at
            FROM agent_templates
            {where_clause}
            ORDER BY created_at DESC
        """)
        
        result = await db.execute(query, params)
        rows = result.fetchall()
        
        templates = []
        for row in rows:
            templates.append(TemplateResponse(
                id=str(row.id),
                name=row.name,
                framework=row.framework,
                type=row.type,
                category=row.category,
                description=row.description,
                defaultConfig=row.default_config or {},
                isPublic=row.is_public,
                createdAt=row.created_at
            ))
        
        logger.info(f"获取模板列表成功，返回 {len(templates)} 个模板")
        return templates
        
    except Exception as e:
        logger.error(f"获取模板列表失败: {e}")
        raise HTTPException(status_code=500, detail=f"获取模板列表失败: {str(e)}")

@router.post("/", response_model=AgentResponse)
async def create_agent(
    request: CreateAgentRequest,
    db: AsyncSession = Depends(get_db)
):
    """创建新智能体"""
    try:
        # 检查名称是否已存在
        result = await db.execute(
            text("SELECT id FROM unified_agents WHERE name = :name"),
            {"name": request.name}
        )
        existing = result.fetchone()
        
        if existing:
            raise HTTPException(status_code=400, detail=f"智能体名称 '{request.name}' 已存在")
        
        # 生成ID
        agent_id = str(uuid.uuid4())
        
        # 插入数据库
        query = text("""
            INSERT INTO unified_agents 
            (id, name, display_name, description, framework, type, status, config, knowledge_binding, tags)
            VALUES (:id, :name, :display_name, :description, :framework, :type, :status, :config, :knowledge_binding, :tags)
        """)
        
        await db.execute(query, {
            "id": agent_id,
            "name": request.name,
            "display_name": request.displayName,
            "description": request.description,
            "framework": request.framework,
            "type": request.type,
            "status": "inactive",
            "config": json.dumps(request.config.dict(exclude_none=True)),
            "knowledge_binding": json.dumps(request.knowledgeBinding.dict()),
            "tags": request.tags
        })
        
        await db.commit()
        
        # 获取创建的智能体
        result = await db.execute(
            text("SELECT * FROM unified_agents WHERE id = :id"),
            {"id": agent_id}
        )
        row = result.fetchone()
        
        agent = AgentResponse(
            id=str(row.id),
            name=row.name,
            displayName=row.display_name,
            description=row.description,
            framework=row.framework,
            type=row.type,
            status=row.status,
            config=row.config or {},
            knowledgeBinding=row.knowledge_binding or {},
            performanceStats=row.performance_stats or {},
            createdAt=row.created_at,
            updatedAt=row.updated_at,
            tags=row.tags or []
        )
        
        logger.info(f"创建智能体成功: {request.name} ({agent_id})")
        return agent
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"创建智能体失败: {e}")
        raise HTTPException(status_code=500, detail=f"创建智能体失败: {str(e)}")

@router.get("/{agent_id}", response_model=AgentResponse)
async def get_agent(agent_id: str, db: Session = Depends(get_db)):
    """获取智能体详情"""
    try:
        result = await db.execute(
            text("SELECT * FROM unified_agents WHERE id = :id"),
            {"id": agent_id}
        )
        
        if not result:
            raise HTTPException(status_code=404, detail="智能体不存在")
        
        return AgentResponse(
            id=str(result.id),
            name=result.name,
            displayName=result.display_name,
            description=result.description,
            framework=result.framework,
            type=result.type,
            status=result.status,
            config=result.config or {},
            knowledgeBinding=result.knowledge_binding or {},
            performanceStats=result.performance_stats or {},
            createdAt=result.created_at,
            updatedAt=result.updated_at,
            tags=result.tags or []
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"获取智能体详情失败: {e}")
        raise HTTPException(status_code=500, detail=f"获取智能体详情失败: {str(e)}")

@router.put("/{agent_id}", response_model=AgentResponse)
async def update_agent(
    agent_id: str,
    request: UpdateAgentRequest,
    db: AsyncSession = Depends(get_db)
):
    """更新智能体配置"""
    try:
        # 检查智能体是否存在
        result = await db.execute(
            text("SELECT * FROM unified_agents WHERE id = :id"),
            {"id": agent_id}
        )
        
        if not existing:
            raise HTTPException(status_code=404, detail="智能体不存在")
        
        # 构建更新字段
        update_fields = []
        params = {"id": agent_id}
        
        if request.displayName is not None:
            update_fields.append("display_name = :display_name")
            params["display_name"] = request.displayName
            
        if request.description is not None:
            update_fields.append("description = :description")
            params["description"] = request.description
            
        if request.status is not None:
            update_fields.append("status = :status")
            params["status"] = request.status
            
        if request.config is not None:
            update_fields.append("config = :config")
            params["config"] = json.dumps(request.config.dict(exclude_none=True))
            
        if request.knowledgeBinding is not None:
            update_fields.append("knowledge_binding = :knowledge_binding")
            params["knowledge_binding"] = json.dumps(request.knowledgeBinding.dict())
            
        if request.tags is not None:
            update_fields.append("tags = :tags")
            params["tags"] = request.tags
        
        update_fields.append("updated_at = CURRENT_TIMESTAMP")
        
        if not update_fields:
            raise HTTPException(status_code=400, detail="没有提供更新字段")
        
        # 执行更新
        query = text(f"""
            UPDATE unified_agents 
            SET {', '.join(update_fields)}
            WHERE id = :id
        """)
        
        await db.execute(query, params)
        await db.commit()
        
        # 获取更新后的智能体
        result = await db.execute(
            text("SELECT * FROM unified_agents WHERE id = :id"),
            {"id": agent_id}
        )
        
        agent = AgentResponse(
            id=str(result.id),
            name=result.name,
            displayName=result.display_name,
            description=result.description,
            framework=result.framework,
            type=result.type,
            status=result.status,
            config=result.config or {},
            knowledgeBinding=result.knowledge_binding or {},
            performanceStats=result.performance_stats or {},
            createdAt=result.created_at,
            updatedAt=result.updated_at,
            tags=result.tags or []
        )
        
        logger.info(f"更新智能体成功: {agent_id}")
        return agent
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"更新智能体失败: {e}")
        raise HTTPException(status_code=500, detail=f"更新智能体失败: {str(e)}")

@router.delete("/{agent_id}")
async def delete_agent(agent_id: str, db: Session = Depends(get_db)):
    """删除智能体"""
    try:
        # 检查智能体是否存在
        result = await db.execute(
            text("SELECT id FROM unified_agents WHERE id = :id"),
            {"id": agent_id}
        )
        
        if not existing:
            raise HTTPException(status_code=404, detail="智能体不存在")
        
        # 删除智能体（级联删除执行记录）
        await db.execute(
            text("DELETE FROM unified_agents WHERE id = :id"),
            {"id": agent_id}
        )
        
        await db.commit()
        
        logger.info(f"删除智能体成功: {agent_id}")
        return {"message": "智能体删除成功"}
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"删除智能体失败: {e}")
        raise HTTPException(status_code=500, detail=f"删除智能体失败: {str(e)}")

@router.post("/{agent_id}/execute")
async def execute_agent(
    agent_id: str,
    request: ExecuteAgentRequest,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db)
):
    """执行智能体查询"""
    try:
        # 获取智能体配置
        result = await db.execute(
            text("SELECT * FROM unified_agents WHERE id = :id AND status = 'active'"),
            {"id": agent_id}
        )
        
        if not result:
            raise HTTPException(status_code=404, detail="智能体不存在或未激活")
        
        # 创建执行记录
        execution_id = str(uuid.uuid4())
        session_id = request.sessionId or str(uuid.uuid4())
        
        await db.execute(text("""
            INSERT INTO agent_executions (id, agent_id, session_id, query, status, metadata)
            VALUES (:id, :agent_id, :session_id, :query, :status, :metadata)
        """), {
            "id": execution_id,
            "agent_id": agent_id,
            "session_id": session_id,
            "query": request.query,
            "status": "running",
            "metadata": json.dumps(request.metadata)
        })
        
        await db.commit()
        
        # 根据框架类型执行
        if request.stream:
            return StreamingResponse(
                execute_agent_stream(execution_id, result, request, db),
                media_type="text/plain"
            )
        else:
            # 后台执行
            background_tasks.add_task(
                execute_agent_background, 
                execution_id, result, request, db
            )
            
            return {
                "executionId": execution_id,
                "sessionId": session_id,
                "status": "running",
                "message": "智能体执行已开始"
            }
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"执行智能体失败: {e}")
        raise HTTPException(status_code=500, detail=f"执行智能体失败: {str(e)}")

async def execute_agent_stream(execution_id: str, agent_config, request: ExecuteAgentRequest, db: Session):
    """流式执行智能体"""
    start_time = time.time()
    response_parts = []
    
    try:
        if agent_config.framework == 'agno':
            # 使用Agno Team执行
            if advanced_agent_team_service:
                async for chunk in advanced_agent_team_service.advanced_team_query(
                    team_name=agent_config.config.get('coordinator', 'general_qa_team_v2'),
                    query=request.query,
                    session_id=request.sessionId,
                    stream=True
                ):
                    if chunk and 'content' in chunk:
                        content = chunk['content']
                        response_parts.append(content)
                        yield f"data: {json.dumps({'content': content, 'type': 'chunk'})}\n\n"
            else:
                yield f"data: {json.dumps({'error': 'Agno Team服务不可用'})}\n\n"
                
        elif agent_config.framework == 'youtu':
            # 使用Youtu-Agent执行
            if youtu_agent_service:
                # 这里需要实现Youtu-Agent的流式执行
                response = f"Youtu-Agent执行结果: {request.query}"
                response_parts.append(response)
                yield f"data: {json.dumps({'content': response, 'type': 'chunk'})}\n\n"
            else:
                yield f"data: {json.dumps({'error': 'Youtu-Agent服务不可用'})}\n\n"
                
        else:
            # 混合执行
            response = f"混合智能体执行结果: {request.query}"
            response_parts.append(response)
            yield f"data: {json.dumps({'content': response, 'type': 'chunk'})}\n\n"
        
        # 更新执行记录
        execution_time = int((time.time() - start_time) * 1000)
        full_response = ''.join(response_parts)
        
        await db.execute(text("""
            UPDATE agent_executions 
            SET status = 'completed', response = :response, execution_time_ms = :execution_time, completed_at = CURRENT_TIMESTAMP
            WHERE id = :id
        """), {
            "id": execution_id,
            "response": full_response,
            "execution_time": execution_time
        })
        await db.commit()
        
        yield f"data: {json.dumps({'type': 'done', 'executionTime': execution_time})}\n\n"
        
    except Exception as e:
        # 更新错误状态
        await db.execute(text("""
            UPDATE agent_executions 
            SET status = 'failed', error_message = :error, completed_at = CURRENT_TIMESTAMP
            WHERE id = :id
        """), {
            "id": execution_id,
            "error": str(e)
        })
        await db.commit()
        
        yield f"data: {json.dumps({'error': str(e)})}\n\n"

async def execute_agent_background(execution_id: str, agent_config, request: ExecuteAgentRequest, db: Session):
    """后台执行智能体"""
    start_time = time.time()
    
    try:
        response = ""
        
        if agent_config.framework == 'agno':
            # 使用Agno Team执行
            if advanced_agent_team_service:
                result = await advanced_agent_team_service.advanced_team_query(
                    team_name=agent_config.config.get('coordinator', 'general_qa_team_v2'),
                    query=request.query,
                    session_id=request.sessionId,
                    stream=False
                )
                if result and hasattr(result, 'content'):
                    response = result.content
                else:
                    response = str(result)
            else:
                response = "Agno Team服务不可用"
                
        elif agent_config.framework == 'youtu':
            # 使用Youtu-Agent执行
            response = f"Youtu-Agent执行结果: {request.query}"
            
        else:
            # 混合执行
            response = f"混合智能体执行结果: {request.query}"
        
        # 更新执行记录
        execution_time = int((time.time() - start_time) * 1000)
        
        await db.execute(text("""
            UPDATE agent_executions 
            SET status = 'completed', response = :response, execution_time_ms = :execution_time, completed_at = CURRENT_TIMESTAMP
            WHERE id = :id
        """), {
            "id": execution_id,
            "response": response,
            "execution_time": execution_time
        })
        await db.commit()
        
    except Exception as e:
        # 更新错误状态
        await db.execute(text("""
            UPDATE agent_executions 
            SET status = 'failed', error_message = :error, completed_at = CURRENT_TIMESTAMP
            WHERE id = :id
        """), {
            "id": execution_id,
            "error": str(e)
        })
        await db.commit()
        
        logger.error(f"后台执行智能体失败: {e}")

@router.get("/{agent_id}/executions", response_model=List[ExecutionResponse])
async def get_agent_executions(
    agent_id: str,
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db)
):
    """获取智能体执行记录"""
    try:
        query = text("""
            SELECT id, agent_id, session_id, query, response, status, execution_time_ms, 
                   error_message, started_at, completed_at
            FROM agent_executions
            WHERE agent_id = :agent_id
            ORDER BY started_at DESC
            LIMIT :limit OFFSET :offset
        """)
        
        result = await db.execute(query, {
            "agent_id": agent_id,
            "limit": limit,
            "offset": offset
        })
        rows = result.fetchall()
        
        executions = []
        for row in rows:
            executions.append(ExecutionResponse(
                id=str(row.id),
                agentId=str(row.agent_id),
                sessionId=row.session_id,
                query=row.query,
                response=row.response,
                status=row.status,
                executionTimeMs=row.execution_time_ms,
                errorMessage=row.error_message,
                startedAt=row.started_at,
                completedAt=row.completed_at
            ))
        
        return executions
        
    except Exception as e:
        logger.error(f"获取执行记录失败: {e}")
        raise HTTPException(status_code=500, detail=f"获取执行记录失败: {str(e)}")

@router.get("/{agent_id}/export")
async def export_agent_config(agent_id: str, db: Session = Depends(get_db)):
    """导出智能体配置"""
    try:
        result = await db.execute(
            text("SELECT * FROM unified_agents WHERE id = :id"),
            {"id": agent_id}
        )
        
        if not result:
            raise HTTPException(status_code=404, detail="智能体不存在")
        
        config = {
            "name": result.name,
            "displayName": result.display_name,
            "description": result.description,
            "framework": result.framework,
            "type": result.type,
            "config": result.config or {},
            "knowledgeBinding": result.knowledge_binding or {},
            "tags": result.tags or [],
            "exportedAt": datetime.now().isoformat(),
            "version": "1.0"
        }
        
        return config
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"导出配置失败: {e}")
        raise HTTPException(status_code=500, detail=f"导出配置失败: {str(e)}")

@router.post("/{agent_id}/toggle")
async def toggle_agent_status(agent_id: str, db: Session = Depends(get_db)):
    """切换智能体状态（启用/停用）"""
    try:
        # 获取当前状态
        result = await db.execute(
            text("SELECT status FROM unified_agents WHERE id = :id"),
            {"id": agent_id}
        )
        
        if not result:
            raise HTTPException(status_code=404, detail="智能体不存在")
        
        # 切换状态
        new_status = "active" if result.status == "inactive" else "inactive"
        
        await db.execute(text("""
            UPDATE unified_agents 
            SET status = :status, updated_at = CURRENT_TIMESTAMP
            WHERE id = :id
        """), {
            "id": agent_id,
            "status": new_status
        })
        
        await db.commit()
        
        logger.info(f"智能体状态切换成功: {agent_id} -> {new_status}")
        return {"status": new_status, "message": f"智能体已{new_status == 'active' and '启用' or '停用'}"}
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"切换智能体状态失败: {e}")
        raise HTTPException(status_code=500, detail=f"切换智能体状态失败: {str(e)}")

@router.get("/stats/overview")
async def get_agents_overview(db: Session = Depends(get_db)):
    """获取智能体统计概览"""
    try:
        # 基础统计
        stats_query = text("""
            SELECT 
                COUNT(*) as total_agents,
                COUNT(*) FILTER (WHERE status = 'active') as active_agents,
                COUNT(*) FILTER (WHERE framework = 'agno') as agno_agents,
                COUNT(*) FILTER (WHERE framework = 'youtu') as youtu_agents,
                COUNT(*) FILTER (WHERE framework = 'hybrid') as hybrid_agents
            FROM unified_agents
        """)
        
        stats_result = db.execute(stats_query).fetchone()
        
        # 执行统计
        exec_query = text("""
            SELECT 
                COUNT(*) as total_executions,
                COUNT(*) FILTER (WHERE status = 'completed') as successful_executions,
                AVG(execution_time_ms) FILTER (WHERE status = 'completed') as avg_execution_time
            FROM agent_executions
            WHERE started_at >= CURRENT_DATE - INTERVAL '7 days'
        """)
        
        exec_result = db.execute(exec_query).fetchone()
        
        return {
            "totalAgents": stats_result.total_agents or 0,
            "activeAgents": stats_result.active_agents or 0,
            "frameworkStats": {
                "agno": stats_result.agno_agents or 0,
                "youtu": stats_result.youtu_agents or 0,
                "hybrid": stats_result.hybrid_agents or 0
            },
            "recentExecutions": exec_result.total_executions or 0,
            "successfulExecutions": exec_result.successful_executions or 0,
            "avgExecutionTime": int(exec_result.avg_execution_time or 0)
        }
        
    except Exception as e:
        logger.error(f"获取统计概览失败: {e}")
        raise HTTPException(status_code=500, detail=f"获取统计概览失败: {str(e)}")
