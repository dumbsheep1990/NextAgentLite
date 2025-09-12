"""
Youtu-Agent API 端点 - 基于真实的youtu-agent框架
"""
from typing import Dict, Any, Optional
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

from core.logger import logger
from .services import YoutuAgentService, MetaAgentService, HybridAgentService
# 暂时禁用导入，避免导入错误
# from .db_strategy_api import router as db_strategy_router
# from .db_monitor_api import router as db_monitor_router

# 创建路由器
youtu_agent_router = APIRouter(prefix="/youtu", tags=["Youtu-Agent Integration"])

# 暂时禁用基于数据库的子路由，避免导入错误
# youtu_agent_router.include_router(db_strategy_router)
# youtu_agent_router.include_router(db_monitor_router)

# 请求模型
class CreateAgentRequest(BaseModel):
    name: str = Field(..., description="Agent名称")
    agent_type: str = Field("simple", description="Agent类型")
    instructions: str = Field("你是一个专业的AI助手。", description="Agent指令")
    toolkits: Optional[Dict[str, Any]] = Field(None, description="工具集配置")

class AgentQueryRequest(BaseModel):
    query: str = Field(..., description="查询内容")
    stream: bool = Field(False, description="是否流式响应")

class MetaSessionRequest(BaseModel):
    user_description: str = Field(..., description="用户需求描述")
    domain: str = Field("general", description="应用领域")
    user_id: Optional[str] = Field(None, description="用户ID")

class MetaContinueRequest(BaseModel):
    session_id: str = Field(..., description="会话ID")
    user_message: str = Field(..., description="用户消息")

class HybridQueryRequest(BaseModel):
    query: str = Field(..., description="查询内容")
    strategy: str = Field("intelligent_routing", description="执行策略")
    context: Optional[Dict[str, Any]] = Field(None, description="上下文信息")

# API响应模型
class APIResponse(BaseModel):
    success: bool
    data: Optional[Any] = None
    message: Optional[str] = None
    error: Optional[str] = None

# 初始化服务
agent_service = YoutuAgentService()
meta_service = MetaAgentService()
hybrid_service = HybridAgentService()


@youtu_agent_router.get("/health")
async def health_check():
    """健康检查"""
    return {"status": "healthy", "service": "youtu-agent-integration"}


@youtu_agent_router.get("/info")
async def get_system_info():
    """获取系统信息"""
    try:
        agents = await agent_service.list_agents()
        strategies = await hybrid_service.get_available_strategies()
        
        return APIResponse(
            success=True,
            data={
                "total_agents": len(agents),
                "available_strategies": list(strategies.keys()),
                "integration_status": "active",
                "framework": "youtu-agent",
                "version": "1.0.0"
            }
        )
    except Exception as e:
        logger.error(f"获取系统信息失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# Agent管理端点
@youtu_agent_router.post("/agent/create")
async def create_agent(request: CreateAgentRequest):
    """创建Agent"""
    try:
        result = await agent_service.create_agent(
            name=request.name,
            agent_type=request.agent_type,
            instructions=request.instructions,
            toolkits=request.toolkits
        )
        
        return APIResponse(
            success=True,
            data=result,
            message="Agent创建成功"
        )
    except Exception as e:
        logger.error(f"创建Agent失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@youtu_agent_router.get("/agent/list")
async def list_agents():
    """获取Agent列表"""
    try:
        agents = await agent_service.list_agents()
        
        return APIResponse(
            success=True,
            data={"agents": agents}
        )
    except Exception as e:
        logger.error(f"获取Agent列表失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@youtu_agent_router.post("/agent/{agent_name}/query")
async def query_agent(agent_name: str, request: AgentQueryRequest):
    """查询Agent"""
    try:
        if request.stream:
            # 流式响应
            async def generate():
                async for chunk in agent_service.execute_agent(
                    agent_name, request.query, stream=True
                ):
                    yield f"data: {chunk}\n\n"
            
            return StreamingResponse(
                generate(),
                media_type="text/event-stream",
                headers={
                    "Cache-Control": "no-cache",
                    "Connection": "keep-alive",
                }
            )
        else:
            # 同步响应
            result = await agent_service.execute_agent(
                agent_name, request.query, stream=False
            )
            
            return APIResponse(
                success=True,
                data=result
            )
    except Exception as e:
        logger.error(f"Agent查询失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# 配置管理端点
@youtu_agent_router.get("/config/tools")
async def get_available_tools():
    """获取可用工具列表"""
    return {
        "success": True,
        "data": [
            {"id": "tabular_data", "name": "表格数据处理", "description": "处理CSV、Excel文件", "category": "data"},
            {"id": "file_ops", "name": "文件操作", "description": "文件读写和管理", "category": "system"},
            {"id": "search", "name": "搜索工具", "description": "网络搜索功能", "category": "web"},
            {"id": "code_exec", "name": "代码执行", "description": "执行Python代码", "category": "development"},
            {"id": "translation", "name": "翻译工具", "description": "多语言翻译", "category": "language"}
        ]
    }

@youtu_agent_router.get("/config/environments") 
async def get_available_environments():
    """获取可用环境列表"""
    return {
        "success": True,
        "data": [
            {"id": "shell_env", "name": "Shell环境", "description": "命令行执行环境", "type": "system"},
            {"id": "browser_env", "name": "浏览器环境", "description": "网页浏览环境", "type": "web"},
            {"id": "knowledge_env", "name": "知识库环境", "description": "知识检索环境", "type": "knowledge"}
        ]
    }

@youtu_agent_router.get("/config/agent-types")
async def get_agent_types():
    """获取Agent类型列表"""
    return {
        "success": True,
        "data": [
            {"id": "SimpleAgent", "name": "SimpleAgent", "displayName": "简单Agent", "description": "单步推理Agent", "features": ["快速响应", "直接执行"]},
            {"id": "OrchestraAgent", "name": "OrchestraAgent", "displayName": "协作Agent", "description": "多步骤协作Agent", "features": ["复杂规划", "多步执行"]}
        ]
    }

@youtu_agent_router.get("/config/templates")
async def get_dynamic_templates():
    """获取动态模板列表"""
    return {
        "success": True,
        "data": []  # 暂时返回空，使用前端的静态模板
    }

@youtu_agent_router.post("/meta/auto-generate") 
async def start_auto_generation(request: dict):
    """开始自动生成Agent - 启动youtu-agent的4步流程"""
    try:
        session = await meta_service.create_session(
            user_description=request.get("requirement", request.get("user_requirement", "")),
            domain="general"
        )
        return {
            "success": True,
            "data": {
                "session_id": session["session_id"],
                "current_step": session["current_step"],
                "total_steps": session["total_steps"],
                "step_name": session["step_name"],
                "status": session["status"],
                "initial_response": f"我是NextAgent智能助手。我会帮您创建一个定制化的Agent。\n\n基于您的描述：'{request.get('requirement', request.get('user_requirement', ''))}'\n\n我需要和您进一步确认需求细节。请问您希望这个Agent主要处理什么类型的任务？预期的输出格式是什么？"
            },
            "message": "Meta-Agent 4步生成流程已启动"
        }
    except Exception as e:
        logger.error(f"启动自动生成失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@youtu_agent_router.post("/meta/continue-generation")
async def continue_auto_generation(request: dict):
    """继续自动生成流程 - 处理用户响应"""
    try:
        session_id = request.get("session_id")
        user_response = request.get("user_response", "")
        
        result = await meta_service.continue_session(
            session_id=session_id,
            user_response=user_response
        )
        
        return {
            "success": True,
            "data": result,
            "message": "处理成功"
        }
    except Exception as e:
        logger.error(f"继续生成失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# Meta-Agent端点
@youtu_agent_router.post("/meta/session")
async def create_meta_session(request: MetaSessionRequest):
    """创建Meta-Agent会话"""
    try:
        result = await meta_service.create_session(
            user_description=request.user_description,
            domain=request.domain,
            user_id=request.user_id
        )
        
        return APIResponse(
            success=True,
            data=result,
            message="Meta-Agent会话创建成功"
        )
    except Exception as e:
        logger.error(f"Meta-Agent会话创建失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@youtu_agent_router.post("/meta/continue")
async def continue_meta_conversation(request: MetaContinueRequest):
    """继续Meta-Agent对话"""
    try:
        result = await meta_service.continue_conversation(
            session_id=request.session_id,
            user_message=request.user_message
        )
        
        return APIResponse(
            success=True,
            data=result
        )
    except Exception as e:
        logger.error(f"Meta-Agent对话继续失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# 混合策略端点
@youtu_agent_router.get("/hybrid/strategies")
async def get_hybrid_strategies():
    """获取混合执行策略"""
    try:
        strategies = await hybrid_service.get_available_strategies()
        
        return APIResponse(
            success=True,
            data={"strategies": strategies}
        )
    except Exception as e:
        logger.error(f"获取混合策略失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@youtu_agent_router.post("/hybrid/query")
async def execute_hybrid_query(request: HybridQueryRequest):
    """执行混合查询"""
    try:
        result = await hybrid_service.execute_hybrid_query(
            query=request.query,
            strategy=request.strategy,
            context=request.context
        )
        
        return APIResponse(
            success=True,
            data=result
        )
    except Exception as e:
        logger.error(f"混合查询执行失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))