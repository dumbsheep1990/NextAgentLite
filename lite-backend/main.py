"""
NextAgent智能体开发平台主应用入口
多智能体协作开发平台
"""
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
import uvicorn
import time
import os

from core.config_optimized import optimized_config_manager
from core.logger import logger
from db.database import init_database, create_tables, check_database_connection, init_all_databases, run_database_migrations
from api.routes import api_router


async def check_redis_connection():
    """检查Redis连接"""
    try:
        import redis.asyncio as redis
        
        # 从环境变量读取Redis配置
        redis_host = os.getenv('REDIS_HOST', 'localhost')
        redis_port = int(os.getenv('REDIS_PORT', '6379'))
        redis_db = int(os.getenv('REDIS_DB', '0'))
        redis_password = os.getenv('REDIS_PASSWORD', '') or None
        redis_timeout = int(os.getenv('REDIS_TIMEOUT', '10'))
        
        # 创建Redis连接
        redis_client = redis.Redis(
            host=redis_host,
            port=redis_port,
            db=redis_db,
            password=redis_password,
            socket_timeout=redis_timeout,
            decode_responses=True
        )
        
        # 测试连接
        await redis_client.ping()
        
        # 获取Redis信息
        info = await redis_client.info()
        redis_version = info.get('redis_version', 'Unknown')
        used_memory = info.get('used_memory_human', 'Unknown')
        
        await redis_client.close()
        
        return {
            'status': 'healthy',
            'host': f"{redis_host}:{redis_port}",
            'db': redis_db,
            'version': redis_version,
            'memory': used_memory,
            'password_protected': bool(redis_password)
        }
        
    except ImportError:
        return {
            'status': 'unavailable',
            'error': 'Redis客户端未安装 (pip install redis)'
        }
    except Exception as e:
        return {
            'status': 'error',
            'error': str(e),
            'host': f"{redis_host}:{redis_port}" if 'redis_host' in locals() else 'Unknown'
        }


@asynccontextmanager
async def lifespan(app: FastAPI):
    """应用生命周期管理"""
    # 启动时执行
    logger.info("\n" + "="*60)
    logger.info("NextAgent智能体开发平台启动")
    logger.info("="*60)
    
    try:
        # 第一步：配置验证和智能降级
        logger.info("步骤 1/7: 系统配置验证")
        from service.config_validation_service import config_validation_service
        validation_result = await config_validation_service.validate_all_services()
        
        # 输出验证结果统计
        healthy_services = sum(1 for s in validation_result.services.values() if s.status.value == "healthy")
        total_services = len(validation_result.services)
        status_symbol = "[OK]" if validation_result.overall_status.value == "healthy" else "[WARN]" if validation_result.overall_status.value == "warning" else "[ERROR]"
        logger.info(f"   {status_symbol} 配置验证完成 - 服务状态: {healthy_services}/{total_services} 健康")
        
        if validation_result.startup_warnings:
            for warning in validation_result.startup_warnings:
                logger.warning(warning)
        
        if validation_result.critical_issues:
            for issue in validation_result.critical_issues:
                logger.error(issue)
            
            # 如果有关键问题且无法降级，则警告但继续启动
            has_critical_without_fallback = any(
                not result.fallback_available 
                for result in validation_result.services.values() 
                if result.status.value == "error"
            )
            
            if has_critical_without_fallback:
                logger.warning("系统存在无法降级的关键问题，但系统将继续启动")
                # 不再抛出异常，允许系统继续启动
        
        # 应用降级配置
        if validation_result.fallback_configs:
            logger.info("应用降级配置以确保系统正常运行")
            app.state.fallback_config = validation_result.fallback_configs
        else:
            app.state.fallback_config = {}
        
        app.state.config_validation = validation_result
        
        # 第二步：初始化核心数据库（PostgreSQL、Elasticsearch）
        logger.info("步骤 2/7: 数据库初始化")
        try:
            # 初始化数据库连接
            init_database()
            logger.info("   [OK] 核心数据库初始化完成")
            
            # 数据库迁移已禁用 - 数据库已手动配置完成
            logger.info("   [SKIP] 数据库迁移已禁用 - 使用现有数据库结构")
            
            # 创建数据库表（基于SQLAlchemy模型）
            await create_tables()
            logger.info("   [OK] 数据库表结构检查完成")
        except Exception as e:
            logger.warning(f"   [WARN] 数据库初始化失败: {str(e)[:100]}，但系统将继续启动")
        
        # 第三步：Redis连接检查
        logger.info("步骤 3/7: Redis连接检查")
        try:
            redis_result = await check_redis_connection()
            if redis_result['status'] == 'healthy':
                logger.info(f"   [OK] Redis连接成功: {redis_result['host']} (DB:{redis_result['db']})")
                logger.info(f"   [OK] Redis版本: {redis_result['version']}, 内存使用: {redis_result['memory']}")
                if redis_result['password_protected']:
                    logger.info("   [OK] Redis已启用密码保护")
            elif redis_result['status'] == 'unavailable':
                logger.warning(f"   [WARN] Redis不可用: {redis_result['error']}")
            else:
                logger.warning(f"   [WARN] Redis连接失败: {redis_result['error']}")
                if 'host' in redis_result:
                    logger.warning(f"   [WARN] 尝试连接地址: {redis_result['host']}")
        except Exception as e:
            logger.warning(f"   [WARN] Redis检查异常: {str(e)[:100]}")
        
        # 第四步：ElasticSearch索引初始化
        logger.info("步骤 4/7: ElasticSearch索引初始化")
        try:
            from migrations.es_migration_manager import ESMigrationManager
            
            # 获取ES配置（连接检查已在步骤2完成）
            es_config = optimized_config_manager.settings.database_elasticsearch
            
            # 确保本地环境使用HTTP
            hosts = es_config.hosts
            if optimized_config_manager.settings.mat_qa_env == 'development':
                hosts = [host.replace('https://', 'http://') if host.startswith('https://') else host for host in hosts]
            
            es_connection_config = {
                "hosts": hosts,
                "request_timeout": es_config.timeout,
                "max_retries": es_config.max_retries,
                "retry_on_timeout": True,
                "verify_certs": False,
                "ssl_show_warn": False,
                "ssl_context": None
            }
            
            # 添加认证信息
            if es_config.username and es_config.password:
                es_connection_config["basic_auth"] = (es_config.username, es_config.password)
            elif es_config.api_key:
                es_connection_config["api_key"] = es_config.api_key
            
            es_manager = ESMigrationManager(es_connection_config)
            
            # 检查并执行ES迁移
            if es_manager.check_and_migrate():
                # 验证索引状态
                indices_status = es_manager.validate_indices()
                healthy_count = sum(1 for status in indices_status.values() if status)
                total_count = len(indices_status)
                
                if healthy_count == total_count:
                    logger.info(f"   [OK] ElasticSearch初始化完成 - 索引状态: {healthy_count}/{total_count} 正常")
                else:
                    logger.warning(f"   [WARN] ElasticSearch索引部分异常 - 状态: {healthy_count}/{total_count}")
            else:
                logger.warning("   [WARN] ElasticSearch初始化失败，使用降级模式")
                
        except Exception as e:
            logger.warning(f"   [WARN] ElasticSearch初始化错误: {str(e)[:50]}...")
        
        # 第四步：初始化延迟优化服务
        logger.info("步骤 5/8: 延迟优化服务初始化")
        try:
            from service.latency_optimization_service import latency_optimization_service
            optimization_success = await latency_optimization_service.initialize()
            if optimization_success:
                logger.info("   [OK] 延迟优化服务就绪 - 模型预热完成")
            else:
                logger.warning("   [WARN] 延迟优化服务部分就绪 - 模型预热失败")
        except Exception as e:
            logger.warning(f"   [WARN] 延迟优化服务初始化失败: {str(e)[:50]}...")

        # 第五步：知识图谱服务 (已移除)
        # 知识图谱相关的检查和初始化已完全移除

        # 第六步：初始化Agno智能体服务
        logger.info("步骤 7/8: 智能体服务初始化")
        try:
            from service.agent_service import agent_service
            agents = agent_service.get_available_agents()
            teams = agent_service.get_available_teams()
            logger.info(f"   [OK] 智能体服务就绪 - 智能体: {len(agents)}个, 团队: {len(teams)}个")
        except Exception as e:
            logger.warning(f"   [WARN] 智能体服务初始化失败: {str(e)[:50]}...")
        
        # 第七步：初始化LLM服务
        logger.info("步骤 8/8: LLM服务初始化")
        try:
            from service.llm_service import llm_service
            supported_models = llm_service.get_supported_models()
            
            # 检查是否使用统一网关模式
            if optimized_config_manager.is_gateway_preferred():
                gateway_config = optimized_config_manager.get_unified_gateway_config()
                llm_models_config = optimized_config_manager.get_llm_models_config()
                
                # 获取实际配置的chat模型数量和默认模型
                actual_chat_models = llm_models_config['all_models']
                available_chat_models = len(actual_chat_models) if actual_chat_models else 0
                default_chat_model = llm_models_config['default_model']
                
                logger.info(f"   [OK] 统一网关模式 - 端点: {gateway_config['base_url']}")
                logger.info(f"   [OK] Chat模型: {available_chat_models}个, 默认: {default_chat_model}")
            else:
                provider_count = len(supported_models) if isinstance(supported_models, dict) else 0
                logger.info(f"   [OK] 直连模式 - 提供商: {provider_count}个")
                
        except Exception as e:
            logger.warning(f"   [WARN] LLM服务初始化失败: {str(e)[:50]}...")
        
        # 第八步：初始化任务管理器
        logger.info("步骤 9/10: 任务管理器初始化")
        try:
            from core.task_manager import get_task_manager
            from core.team_task_manager import get_team_task_manager
            
            # 初始化基础任务管理器
            task_manager = get_task_manager()
            logger.info("   [OK] 基础任务管理器已初始化")
            
            # 初始化Team任务管理器
            team_task_manager = get_team_task_manager()
            logger.info("   [OK] Team任务管理器已初始化")
            
            # 设置应用状态
            app.state.task_manager = task_manager
            app.state.team_task_manager = team_task_manager
            
            logger.info("   [OK] 任务管理器服务就绪 - 支持超时控制和任务取消")
            
        except Exception as e:
            logger.warning(f"   [WARN] 任务管理器初始化失败: {str(e)[:50]}...")
        
        # 第九步：初始化向量化和模型服务
        logger.info("步骤 10/10: 模型服务初始化和系统配置")
        try:
            # 获取实际配置的模型信息（从环境变量优先）
            llm_models_config = optimized_config_manager.get_llm_models_config()
            embedding_models_config = optimized_config_manager.get_embedding_models_config()
            
            # 获取实际配置的chat模型数量
            actual_chat_models = llm_models_config['all_models']
            available_chat_models = len(actual_chat_models) if actual_chat_models else 0
            default_chat_model = llm_models_config['default_model']
            
            # 获取实际配置的嵌入模型
            actual_embedding_models = embedding_models_config['all_models']
            default_embedding_model = embedding_models_config['default_model']
            available_embedding_models = len(actual_embedding_models) if actual_embedding_models else 0
            
            logger.info(f"   [OK] 嵌入模型: {available_embedding_models}个, Chat模型: {available_chat_models}个")
            logger.info(f"   [OK] 默认模型: {default_embedding_model} (嵌入), {default_chat_model} (对话)")
            
        except Exception as e:
            logger.warning(f"   [WARN] 模型服务初始化失败: {str(e)[:50]}...")
        
        # 显示队列和并发配置信息
        try:
            # 从环境变量读取并发配置
            queue_max_concurrent = int(os.getenv('QUEUE_MAX_CONCURRENT_TASKS', '2'))
            large_file_max_concurrent = int(os.getenv('LARGE_FILE_MAX_CONCURRENT_TASKS', '1'))
            large_file_threshold = int(os.getenv('LARGE_FILE_THRESHOLD', '2097152'))
            doc_vectorization_concurrency = int(os.getenv('DOCUMENT_VECTORIZATION_CONCURRENCY', '2'))
            qa_vectorization_concurrency = int(os.getenv('QA_VECTORIZATION_CONCURRENCY', '1'))
            vectorization_batch_size = int(os.getenv('VECTORIZATION_BATCH_SIZE', '20'))
            queue_task_timeout = int(os.getenv('QUEUE_TASK_TIMEOUT', '3600'))
            queue_max_retries = int(os.getenv('QUEUE_MAX_RETRIES', '3'))
            
            logger.info("队列和并发配置:")
            logger.info(f"   [QUEUE] 文件处理队列最大并发数: {queue_max_concurrent}")
            logger.info(f"   [QUEUE] 大文件处理队列最大并发数: {large_file_max_concurrent}")
            logger.info(f"   [QUEUE] 大文件阈值: {large_file_threshold / (1024*1024):.0f}MB")
            logger.info(f"   [QUEUE] 文档向量化并发数: {doc_vectorization_concurrency}")
            logger.info(f"   [QUEUE] QA数据集向量化并发数: {qa_vectorization_concurrency}")
            logger.info(f"   [QUEUE] 向量化批次大小: {vectorization_batch_size}")
            logger.info(f"   [QUEUE] 任务超时时间: {queue_task_timeout}秒")
            logger.info(f"   [QUEUE] 最大重试次数: {queue_max_retries}")
            
        except Exception as e:
            logger.warning(f"   [WARN] 并发配置信息读取失败: {str(e)[:50]}...")
        
        # 获取服务器配置信息
        app_config = optimized_config_manager.settings.app
        
        logger.info("\n" + "="*60)
        logger.info("系统启动完成 - NextAgent智能体开发平台已就绪")
        logger.info(f"监听地址: http://{app_config.host}:{app_config.port}")
        logger.info("="*60)
        
    except Exception as e:
        logger.error(f"系统启动失败: {e}")
        raise
    
    yield
    
    # 关闭时执行
    logger.info("=== 系统正在关闭 ===")
    try:
        # 知识图谱服务清理已移除
        
        # 清理延迟优化服务
        try:
            from service.latency_optimization_service import latency_optimization_service
            await latency_optimization_service.cleanup()
            logger.info("延迟优化服务已清理")
        except Exception as e:
            logger.warning(f"延迟优化服务清理失败: {e}")
        
        # 清理HTTP客户端和提供商
        try:
            from core.base_provider import BaseProviderManager
            await BaseProviderManager.close_all()
            logger.info("HTTP客户端和提供商已清理")
        except Exception as e:
            logger.warning(f"HTTP客户端清理失败: {e}")
        
        # 清理任务管理器
        try:
            from core.task_manager import get_task_manager
            from core.team_task_manager import get_team_task_manager
            
            # 取消所有运行中的Team执行
            team_task_manager = get_team_task_manager()
            running_executions = team_task_manager.get_running_executions()
            if running_executions:
                logger.info(f"取消 {len(running_executions)} 个运行中的Team执行...")
                for execution in running_executions:
                    await team_task_manager.cancel_team_execution(execution.execution_id)
            
            # 取消所有运行中的基础任务
            task_manager = get_task_manager()
            running_tasks = task_manager.get_running_tasks()
            if running_tasks:
                logger.info(f"取消 {len(running_tasks)} 个运行中的任务...")
                for task_id in running_tasks.keys():
                    await task_manager.cancel_task(task_id)
            
            logger.info("任务管理器已清理")
        except Exception as e:
            logger.warning(f"任务管理器清理失败: {e}")
        
        # 清理嵌入服务
        try:
            from service.embedding_service import embedding_service
            await embedding_service.close()
            logger.info("嵌入服务已清理")
        except Exception as e:
            logger.warning(f"嵌入服务清理失败: {e}")
        
        # 清理LLM服务（如果有HTTP客户端）
        try:
            from service.llm_service import llm_service
            if hasattr(llm_service, 'close'):
                await llm_service.close()
                logger.info("LLM服务已清理")
        except Exception as e:
            logger.warning(f"LLM服务清理失败: {e}")
            
        from db.database import db_manager
        await db_manager.close()
        logger.info("数据库连接已关闭")
    except Exception as e:
        logger.error(f"关闭数据库连接时出错: {e}")
    
    logger.info("=== 系统关闭完成 ===")


def create_app() -> FastAPI:
    """创建FastAPI应用实例"""
    
    # 获取应用配置
    app_config = optimized_config_manager.settings.app
    security_config = optimized_config_manager.settings.security
    
    # 创建FastAPI应用
    app = FastAPI(
        title=app_config.name,
        description="NextAgent智能体开发平台",
        version=app_config.version,
        debug=app_config.debug,
        lifespan=lifespan
    )
    
    # 添加CORS中间件
    app.add_middleware(
        CORSMiddleware,
        allow_origins=security_config.cors_origins,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allow_headers=["*"],
    )
    
    # 添加请求日志中间件
    @app.middleware("http")
    async def log_requests(request: Request, call_next):
        start_time = time.time()
        
        # 记录请求
        logger.info(f"请求开始: {request.method} {request.url}")
        
        # 处理请求
        response = await call_next(request)
        
        # 计算处理时间
        process_time = time.time() - start_time
        logger.info(f"请求完成: {request.method} {request.url} - {response.status_code} - {process_time:.2f}s")
        
        # 添加处理时间到响应头
        response.headers["X-Process-Time"] = str(process_time)
        
        return response
    
    # 添加全局异常处理器
    @app.exception_handler(Exception)
    async def global_exception_handler(request: Request, exc: Exception):
        logger.error(f"全局异常处理: {request.method} {request.url} - {exc}")
        return JSONResponse(
            status_code=500,
            content={
                "error": "内部服务器错误",
                "message": str(exc) if app_config.debug else "服务暂时不可用，请稍后重试",
                "path": str(request.url)
            }
        )
    

    
    # 添加系统信息端点
    @app.get("/info")
    async def system_info():
        """系统信息端点"""
        try:
            from service.agent_service import agent_service
            from service.llm_service import llm_service
            from migrations.es_migration_manager import ESMigrationManager
            
            # 获取ES迁移状态
            try:
                # 使用正确的ES配置
                es_db_config = optimized_config_manager.settings.database_elasticsearch
                es_config = {
                    "hosts": [es_db_config.hosts[0]],
                    "http_auth": (es_db_config.username, es_db_config.password) if es_db_config.username else None,
                    "api_key": es_db_config.api_key if es_db_config.api_key else None,
                    "request_timeout": es_db_config.timeout,
                    "max_retries": es_db_config.max_retries,
                    "retry_on_timeout": True,
                    "verify_certs": False,  # 禁用SSL证书验证
                    "ssl_show_warn": False  # 禁用SSL警告
                }
                es_manager = ESMigrationManager(es_config)
                es_migration_status = es_manager.get_migration_status()
                es_indices_status = es_manager.validate_indices()
            except Exception as e:
                logger.warning(f"获取ES状态失败: {e}")
                es_migration_status = {"error": str(e)}
                es_indices_status = {"error": str(e)}
            
            return {
                "app": {
                    "name": app_config.name,
                    "version": app_config.version,
                    "environment": app_config.environment
                },
                "agents": {
                    "available_agents": agent_service.get_available_agents(),
                    "available_teams": agent_service.get_available_teams()
                },
                "models": {
                    "supported_models": llm_service.get_supported_models()
                },
                "elasticsearch": {
                    "migration_status": es_migration_status,
                    "indices_status": es_indices_status
                },
                "timestamp": time.time()
            }
        except Exception as e:
            logger.error(f"获取系统信息失败: {e}")
            return JSONResponse(
                status_code=500,
                content={"error": str(e)}
            )
    
    # 包含API路由
    app.include_router(api_router, prefix="/api/v1")
    
    # 包含WebSocket路由
    from api.websocket.translation_ws import router as translation_ws_router
    app.include_router(translation_ws_router, prefix="/api/v1")
    
    return app


# 创建应用实例
app = create_app()


if __name__ == "__main__":
    # 获取应用配置
    app_config = optimized_config_manager.settings.app
    
    # 直接启动，不要热重载避免重复日志
    uvicorn.run(
        app,  # 直接传递app实例而不是字符串
        host=app_config.host,
        port=app_config.port,
        reload=False,  # 禁用热重载避免重复启动
        log_level="warning",
        access_log=False
    )
