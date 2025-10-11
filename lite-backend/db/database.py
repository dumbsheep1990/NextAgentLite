"""
数据库连接模块 - 基于新配置系统的数据库管理
"""
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import declarative_base, sessionmaker
from sqlalchemy import create_engine, text
from contextlib import asynccontextmanager, contextmanager
from typing import AsyncGenerator
import asyncio

from core.config_optimized import optimized_config_manager
from core.logger import logger

# 创建基础模型类
Base = declarative_base()

# 数据库引擎和会话
async_engine = None
async_session_factory = None
sync_engine = None
sync_session_factory = None


async def check_database_exists(host, port, username, password, database):
    """检查数据库是否存在"""
    from sqlalchemy import create_engine, text
    
    # 构建连接URL（适配本地无密码环境）
    if not password or password.strip() == '':
        test_url = f"postgresql://{username}@{host}:{port}/postgres"
    else:
        test_url = f"postgresql://{username}:{password}@{host}:{port}/postgres"
    
    try:
        test_engine = create_engine(test_url)
        with test_engine.connect() as conn:
            result = conn.execute(text(f"SELECT 1 FROM pg_database WHERE datname = '{database}'"))
            exists = result.fetchone() is not None
        test_engine.dispose()
        return exists
    except Exception as e:
        logger.error(f"检查数据库存在性失败: {e}")
        return False


async def check_database_initialized(host, port, username, password, database):
    """检查数据库是否已经初始化（检查关键表是否存在）"""
    from sqlalchemy import create_engine, text
    
    # 构建连接URL
    if not password or password.strip() == '':
        target_url = f"postgresql://{username}@{host}:{port}/{database}"
    else:
        target_url = f"postgresql://{username}:{password}@{host}:{port}/{database}"
    
    try:
        target_engine = create_engine(target_url)
        with target_engine.connect() as conn:
            # 检查关键表是否存在
            result = conn.execute(text("""
                SELECT COUNT(*) FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name IN ('conversations', 'users', 'knowledge_documents')
            """))
            table_count = result.scalar()
            target_engine.dispose()
            return table_count >= 3  # 至少存在3个关键表
    except Exception as e:
        logger.warning(f"检查数据库初始化状态失败: {e}")
        return False


async def check_and_init_database():
    """检查并初始化数据库（检测本地环境）- 幂等性实现"""
    import os
    from sqlalchemy import create_engine, text
    from sqlalchemy.exc import OperationalError
    
    try:
        # 检查是否为本地开发环境
        env = os.getenv('MAT_QA_ENV', 'development')
        is_local = env == 'development'
        
        if is_local:
            logger.info("检测到本地开发环境，开始数据库状态检查...")
            
            # 获取数据库连接参数
            host = os.getenv('POSTGRESQL_HOST', 'localhost')
            port = os.getenv('POSTGRESQL_PORT', '5432')  # 修复：PostgreSQL标准端口是5432
            database = os.getenv('POSTGRESQL_DATABASE', 'mat_demo')
            username = os.getenv('POSTGRESQL_USERNAME', 'mat_demo')
            password = os.getenv('POSTGRESQL_PASSWORD', '')
            
            logger.info(f"检查数据库配置: {username}@{host}:{port}/{database}")
            
            # 步骤1: 检查数据库是否存在
            db_exists = await check_database_exists(host, port, username, password, database)
            
            if not db_exists:
                logger.info(f"数据库 {database} 不存在，正在创建...")
                # 创建数据库
                if not password or password.strip() == '':
                    test_url = f"postgresql://{username}@{host}:{port}/postgres"
                else:
                    test_url = f"postgresql://{username}:{password}@{host}:{port}/postgres"
                
                test_engine = create_engine(test_url)
                with test_engine.connect() as conn:
                    conn.execute(text("COMMIT"))  # 结束当前事务
                    conn.execute(text(f"CREATE DATABASE {database}"))
                    logger.info(f"数据库 {database} 创建成功")
                test_engine.dispose()
            else:
                logger.info(f"数据库 {database} 已存在")
            
            # 步骤2: 检查数据库是否已初始化
            db_initialized = await check_database_initialized(host, port, username, password, database)
            
            if db_initialized:
                logger.info("数据库已完成初始化，跳过重复初始化")
                return True
            else:
                logger.info("数据库未初始化，将在后续步骤中执行初始化")
            
            # 步骤3: 测试目标数据库连接
            if not password or password.strip() == '':
                target_url = f"postgresql://{username}@{host}:{port}/{database}"
            else:
                target_url = f"postgresql://{username}:{password}@{host}:{port}/{database}"
                
            target_engine = create_engine(target_url)
            with target_engine.connect() as conn:
                conn.execute(text("SELECT 1"))
                logger.info("目标数据库连接测试成功")
            target_engine.dispose()
                
        return True
        
    except Exception as e:
        logger.error(f"数据库检查和初始化失败: {e}")
        raise


async def check_elasticsearch_initialized(es_config):
    """检查Elasticsearch是否已经初始化（检查关键索引是否存在）"""
    from elasticsearch import Elasticsearch
    
    try:
        es = Elasticsearch(**es_config)
        if not es.ping():
            return False
        
        # 检查是否存在关键索引
        indices_to_check = [
            'mat_qa_documents',
            'mat_qa_chunks', 
            'mat_qa_papers'
        ]
        
        existing_indices = 0
        for index in indices_to_check:
            if es.indices.exists(index=index):
                existing_indices += 1
        
        es.close()
        
        # 如果至少有一个索引存在，认为已初始化
        is_initialized = existing_indices > 0
        if is_initialized:
            logger.info(f"Elasticsearch已初始化，找到 {existing_indices} 个索引")
        else:
            logger.info("Elasticsearch未检测到已有索引，将进行初始化")
            
        return is_initialized
        
    except Exception as e:
        logger.warning(f"检查Elasticsearch初始化状态失败: {e}")
        return False


async def check_and_init_elasticsearch():
    """检查并初始化Elasticsearch（检测本地环境）- 幂等性实现"""
    import os
    from elasticsearch import Elasticsearch
    from elasticsearch.exceptions import ConnectionError, AuthenticationException
    
    try:
        # 检查是否为本地开发环境
        env = os.getenv('MAT_QA_ENV', 'development')
        is_local = env == 'development'
        
        if is_local:
            logger.info("检测到本地开发环境，开始Elasticsearch状态检查...")
            
            # 获取Elasticsearch连接参数
            es_url = os.getenv('ELASTICSEARCH_URL', 'https://localhost:9200')
            es_username = os.getenv('ELASTICSEARCH_USERNAME')
            es_password = os.getenv('ELASTICSEARCH_PASSWORD')
            es_api_key = os.getenv('ELASTICSEARCH_API_KEY')
            
            # 本地环境强制调整URL为HTTP
            if es_url.startswith('https://'):
                es_url = es_url.replace('https://', 'http://')
                logger.info(f"本地环境URL强制调整为: {es_url}")
            
            # 构建连接配置（适配本地无认证环境）
            es_config = {
                "hosts": [es_url],
                "verify_certs": False,
                "ssl_show_warn": False,
                "ssl_context": None
            }
            
            # 添加认证信息（如果有）
            if es_api_key:
                es_config["api_key"] = es_api_key
                logger.info("使用API Key认证")
            elif es_username and es_password:
                es_config["basic_auth"] = (es_username, es_password)
                logger.info("使用用户名密码认证")
            else:
                logger.info("本地环境无认证模式连接Elasticsearch")
            
            # 步骤1: 测试Elasticsearch连接
            try:
                es = Elasticsearch(**es_config)
                if not es.ping():
                    logger.warning("Elasticsearch ping失败")
                    es.close()
                    return False
                
                logger.info("Elasticsearch连接测试成功")
                es.close()
                
            except ConnectionError as e:
                logger.error(f"Elasticsearch连接失败: {e}")
                logger.info("请确保Elasticsearch服务已启动")
                return False
            except AuthenticationException as e:
                logger.error(f"Elasticsearch认证失败: {e}")
                logger.info("请检查认证配置")
                return False
            except Exception as e:
                logger.error(f"Elasticsearch连接异常: {e}")
                return False
            
            # 步骤2: 检查是否已初始化
            is_initialized = await check_elasticsearch_initialized(es_config)
            
            if is_initialized:
                logger.info("Elasticsearch已完成初始化，跳过重复初始化")
                return True
            else:
                logger.info("Elasticsearch未初始化，将在后续步骤中执行索引创建")
                return True  # 连接成功，即使未初始化也返回True，让后续流程处理
        else:
            # 生产环境处理逻辑
            logger.info("检测到生产环境，开始Elasticsearch状态检查...")
            
            # 获取Elasticsearch连接参数
            es_url = os.getenv('ELASTICSEARCH_URL', 'https://localhost:9200')
            es_username = os.getenv('ELASTICSEARCH_USERNAME')
            es_password = os.getenv('ELASTICSEARCH_PASSWORD')
            es_api_key = os.getenv('ELASTICSEARCH_API_KEY')
            
            logger.info(f"生产环境ES URL: {es_url}")
            
            # 构建连接配置（生产环境支持HTTPS和认证）
            es_config = {
                "hosts": [es_url],
                "verify_certs": False,  # 先禁用证书验证，避免自签名证书问题
                "ssl_show_warn": False,
                "request_timeout": 30
            }
            
            # 添加认证信息
            if es_api_key:
                es_config["api_key"] = es_api_key
                logger.info("生产环境使用API Key认证")
            elif es_username and es_password:
                es_config["basic_auth"] = (es_username, es_password)
                logger.info("生产环境使用用户名密码认证")
            else:
                logger.warning("生产环境未配置认证信息")
            
            # 步骤1: 测试Elasticsearch连接
            try:
                es = Elasticsearch(**es_config)
                if not es.ping():
                    logger.error("生产环境Elasticsearch ping失败")
                    es.close()
                    return False
                
                logger.info("生产环境Elasticsearch连接测试成功")
                es.close()
                
            except ConnectionError as e:
                logger.error(f"生产环境Elasticsearch连接失败: {e}")
                return False
            except AuthenticationException as e:
                logger.error(f"生产环境Elasticsearch认证失败: {e}")
                return False
            except Exception as e:
                logger.error(f"生产环境Elasticsearch连接异常: {e}")
                return False
            
            # 步骤2: 检查是否已初始化
            is_initialized = await check_elasticsearch_initialized(es_config)
            
            if is_initialized:
                logger.info("生产环境Elasticsearch已完成初始化")
                return True
            else:
                logger.info("生产环境Elasticsearch未初始化，将在后续步骤中执行索引创建")
                return True
                
        return True
        
    except Exception as e:
        logger.error(f"Elasticsearch检查失败: {e}")
        return False


# ArangoDB初始化检查函数已移除 - 服务已禁用


# ArangoDB检查和初始化函数已移除 - 服务已禁用

def check_and_init_arangodb():
    """ArangoDB检查已移除，返回成功以避免阻塞启动"""
    return True


# ArangoDB集合初始化函数已移除 - 服务已禁用


def init_database():
    """初始化数据库连接"""
    global async_engine, async_session_factory, sync_engine, sync_session_factory
    
    try:
        # 获取数据库配置
        db_config = optimized_config_manager.settings.database_postgresql
        
        # 创建异步数据库引擎
        async_database_url = optimized_config_manager.get_database_url()
        async_engine = create_async_engine(
            async_database_url,
            pool_size=db_config.pool_size,
            max_overflow=db_config.max_overflow,
            pool_recycle=3600,  # 每小时回收连接，防止连接失效
            pool_pre_ping=True,  # 使用前检查连接健康状态
            pool_timeout=30,  # 从连接池获取连接的超时时间
            connect_args={
                "command_timeout": 60,  # 查询超时时间
                "server_settings": {
                    "jit": "off"  # 禁用JIT提高稳定性
                }
            },
            echo=db_config.echo,
            future=True
        )
        
        # 创建异步会话工厂
        async_session_factory = async_sessionmaker(
            async_engine,
            class_=AsyncSession,
            expire_on_commit=False
        )
        
        # 创建同步数据库引擎（用于数据库迁移等）
        sync_database_url = optimized_config_manager.get_sync_database_url()
        sync_engine = create_engine(
            sync_database_url,
            pool_size=db_config.pool_size,
            max_overflow=db_config.max_overflow,
            echo=db_config.echo,
            future=True
        )
        
        # 创建同步会话工厂
        sync_session_factory = sessionmaker(
            sync_engine,
            expire_on_commit=False
        )
        
        logger.info("数据库连接初始化成功")
        
    except Exception as e:
        logger.error(f"数据库连接初始化失败: {e}")
        raise


@asynccontextmanager
async def get_db_session() -> AsyncGenerator[AsyncSession, None]:
    """获取数据库会话的上下文管理器"""
    if not async_session_factory:
        init_database()
    
    async with async_session_factory() as session:
        try:
            yield session
        except Exception as e:
            await session.rollback()
            import traceback
            logger.error(f"数据库会话错误: {e}")
            logger.error(f"数据库会话错误详细信息: {traceback.format_exc()}")
            raise
        finally:
            await session.close()


# 为了向后兼容，提供get_async_session别名
get_async_session = get_db_session


# 同步会话（用于在线程中执行同步SQL，避免事件循环冲突）
@contextmanager
def get_sync_session():
    global sync_session_factory
    if not sync_session_factory:
        init_database()
    session = sync_session_factory()
    try:
        yield session
        session.commit()
    except Exception as e:
        session.rollback()
        import traceback
        logger.error(f"同步数据库会话错误: {e}")
        logger.error(f"同步数据库会话错误详细信息: {traceback.format_exc()}")
        raise
    finally:
        session.close()


async def create_tables():
    """创建数据库表"""
    try:
        if not async_engine:
            init_database()
        
        # 确保所有模型都被导入，这样SQLAlchemy才能识别它们
        import models  # 这会触发所有模型的导入
        
        async with async_engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        
        logger.info("数据库表创建成功")
        
    except Exception as e:
        logger.error(f"创建数据库表失败: {e}")
        raise


async def drop_tables():
    """删除数据库表"""
    try:
        if not async_engine:
            init_database()
        
        async with async_engine.begin() as conn:
            await conn.run_sync(Base.metadata.drop_all)
        
        logger.info("数据库表删除成功")
        
    except Exception as e:
        logger.error(f"删除数据库表失败: {e}")
        raise


async def check_database_connection() -> bool:
    """检查数据库连接"""
    try:
        if not async_session_factory:
            init_database()
        
        async with async_session_factory() as session:
            from sqlalchemy import text
            await session.execute(text("SELECT 1"))
        return True
    except Exception as e:
        logger.error(f"数据库连接检查失败: {e}")
        return False


class DatabaseManager:
    """数据库管理器"""
    
    def __init__(self):
        self.async_engine = None
        self.async_session_factory = None
        self.sync_engine = None
        self.sync_session_factory = None
        self.initialized = False
    
    def initialize(self):
        """初始化数据库管理器"""
        if not self.initialized:
            init_database()
            self.async_engine = async_engine
            self.async_session_factory = async_session_factory
            self.sync_engine = sync_engine
            self.sync_session_factory = sync_session_factory
            self.initialized = True
    
    @asynccontextmanager
    async def get_async_session(self) -> AsyncGenerator[AsyncSession, None]:
        """获取异步会话"""
        if not self.initialized:
            self.initialize()
        
        session = None
        try:
            # 创建会话时增加超时控制
            session = self.async_session_factory()
            
            # 验证连接是否有效
            from sqlalchemy import text
            await asyncio.wait_for(
                session.execute(text("SELECT 1")), 
                timeout=15.0  # 增加超时时间从5秒到15秒
            )
            
            yield session
            
        except asyncio.TimeoutError:
            logger.error("数据库会话创建或验证超时")
            if session:
                await session.rollback()
            raise Exception("数据库连接超时")
        except Exception as e:
            logger.error(f"数据库会话错误: {e}")
            if session:
                try:
                    await session.rollback()
                except Exception as rollback_error:
                    logger.warning(f"回滚失败: {rollback_error}")
            raise
        finally:
            if session:
                try:
                    await asyncio.wait_for(
                        session.close(), 
                        timeout=15.0  # 增加超时时间从5秒到15秒
                    )
                except asyncio.TimeoutError:
                    logger.warning("关闭数据库会话超时")
                except Exception as close_error:
                    logger.warning(f"关闭数据库会话失败: {close_error}")
    
    def get_sync_session(self):
        """获取同步会话"""
        if not self.initialized:
            self.initialize()
        return self.sync_session_factory()
    
    async def close(self):
        """关闭数据库连接"""
        try:
            logger.info("开始关闭数据库连接...")
            
            # 关闭异步引擎
            if self.async_engine:
                try:
                    await self.async_engine.dispose()
                    logger.info("异步数据库引擎已关闭")
                except Exception as e:
                    logger.warning(f"关闭异步引擎时出错: {e}")
                finally:
                    self.async_engine = None
            
            # 关闭同步引擎  
            if self.sync_engine:
                try:
                    self.sync_engine.dispose()
                    logger.info("同步数据库引擎已关闭")
                except Exception as e:
                    logger.warning(f"关闭同步引擎时出错: {e}")
                finally:
                    self.sync_engine = None
            
            # 重置初始化状态
            self.initialized = False
            
            logger.info("数据库连接关闭完成")
            
        except Exception as e:
            logger.error(f"关闭数据库连接时发生严重错误: {e}")
            # 即使出错也要重置状态
            self.async_engine = None
            self.sync_engine = None
            self.initialized = False


# 全局数据库管理器实例
db_manager = DatabaseManager()


async def run_database_migrations():
    """运行数据库迁移"""
    try:
        from migrations.migration_manager import MigrationManager
        migration_manager = MigrationManager()
        await migration_manager.run_migrations()
        logger.info("数据库迁移执行成功")
    except Exception as e:
        logger.error(f"数据库迁移执行失败: {e}")
        raise


async def init_all_databases():
    """初始化所有数据库连接（PostgreSQL、Elasticsearch）- ArangoDB已移除"""
    try:
        logger.info("🔧 开始检查和初始化所有数据库连接...")
        
        # 检查并初始化PostgreSQL
        logger.info("📊 PostgreSQL 状态检查...")
        pg_result = await check_and_init_database()
        if pg_result:
            logger.info("✅ PostgreSQL 检查完成")
        else:
            logger.error("❌ PostgreSQL 检查失败")
            raise Exception("PostgreSQL初始化失败")
        
        # 检查并初始化Elasticsearch
        logger.info("🔍 Elasticsearch 状态检查...")
        es_result = await check_and_init_elasticsearch()
        if es_result:
            logger.info("✅ Elasticsearch 检查完成")
        else:
            logger.warning("⚠️ Elasticsearch 检查失败，但系统将继续运行")
        
        # ArangoDB 检查已移除 - 服务已禁用
        
        # 初始化PostgreSQL数据库连接池
        logger.info("🔧 初始化数据库连接池...")
        init_database()
        
        # 汇总初始化结果
        success_count = 1  # PostgreSQL必须成功
        services = ["PostgreSQL"]
        
        if es_result:
            success_count += 1
            services.append("Elasticsearch")
            
        if success_count == 2:
            logger.info(f"🎉 所有数据库服务初始化完成: {', '.join(services)}")
        else:
            logger.warning("⚠️ 仅PostgreSQL初始化成功，Elasticsearch将在后续重试")
            
        return True
        
    except Exception as e:
        logger.error(f"❌ 数据库初始化失败: {e}")
        raise


# FastAPI依赖注入函数
async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """FastAPI依赖注入 - 获取数据库会话"""
    async with get_db_session() as session:
        yield session


def get_elasticsearch_client():
    """获取ElasticSearch客户端"""
    import os
    from elasticsearch import AsyncElasticsearch
    
    try:
        # 获取ElasticSearch连接参数
        es_url = os.getenv('ELASTICSEARCH_URL', 'http://localhost:9200')
        es_username = os.getenv('ELASTICSEARCH_USERNAME', 'elastic')
        es_password = os.getenv('ELASTICSEARCH_PASSWORD', 'MQxFuWBuooxLY2c2a8YE')
        es_api_key = os.getenv('ELASTICSEARCH_API_KEY', 'LS1nMGdwY0JqZ21fdkZpWXhIQnM6MzZ4Q3lWRUdSTmZOUEViV1BhSmF4QQ==')
        
        # 构建连接配置
        es_config = {
            'hosts': [es_url],
            'verify_certs': False,  # 开发环境跳过证书验证
            'ssl_show_warn': False,
            'request_timeout': 30,
            'max_retries': 3
        }
        
        # 认证配置 - 优先使用API Key
        if es_api_key:
            es_config["api_key"] = es_api_key
            logger.debug("使用API Key认证连接ElasticSearch")
        elif es_username and es_password:
            es_config["basic_auth"] = (es_username, es_password)
            logger.debug("使用用户名密码认证连接ElasticSearch")
        else:
            logger.warning("无ElasticSearch认证配置")
        
        return AsyncElasticsearch(**es_config)
        
    except Exception as e:
        logger.error(f"创建ElasticSearch客户端失败: {e}")
        raise


async def get_session() -> AsyncGenerator[AsyncSession, None]:
    """获取异步数据库会话 - 兼容性函数"""
    async with db_manager.get_async_session() as session:
        yield session


def get_sync_session():
    """获取同步数据库会话"""
    return db_manager.get_sync_session()


def get_sync_engine():
    """获取同步数据库引擎 - 供Agno使用"""
    if not sync_engine:
        init_database()
    
    return sync_engine


def get_async_engine():
    """获取异步数据库引擎"""
    if not async_engine:
        init_database()
    
    return async_engine
