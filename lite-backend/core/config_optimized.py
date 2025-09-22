"""
优化后的配置管理模块 - 支持按厂商组织的模型配置
"""
import os
from pathlib import Path
from typing import Dict, List, Optional, Any, Union

from dotenv import load_dotenv
from pydantic import BaseModel, Field
from pydantic_settings import BaseSettings
import yaml
from dynaconf import Dynaconf


class DatabaseConfig(BaseModel):
    """数据库配置"""
    host: str = "localhost"
    port: int = 5432
    database: str = "mat_qa_db"
    username: str = "mat_user"
    password: str = "mat_password"
    pool_size: int = 10
    max_overflow: int = 20
    echo: bool = False


class ElasticsearchConfig(BaseModel):
    """Elasticsearch配置"""
    hosts: List[str] = ["http://localhost:9200"]
    username: Optional[str] = None
    password: Optional[str] = None
    api_key: Optional[str] = None
    index_prefix: str = "mat_qa"
    timeout: int = 30
    max_retries: int = 3
    required_on_startup: bool = True


class ArangoDBConfig(BaseModel):
    """ArangoDB图数据库配置"""
    url: str = "http://localhost:8529"
    database: str = "mat_qa_graph"
    username: str = "root"
    password: str = "arangodb_password"
    graph_name: str = "knowledge_graph"
    timeout: int = 30
    verify: bool = False


class MinIOConfig(BaseModel):
    """MinIO对象存储配置"""
    enabled: bool = True
    endpoint: str = "localhost:9000"
    access_key: str = "admin"
    secret_key: str = "wxn199002"
    secure: bool = False
    region: str = "us-east-1"
    documents_bucket: str = "mat-qa-documents"
    media_bucket: str = "mat-qa-media"
    thumbnails_bucket: str = "mat-qa-thumbnails"
    knowledge_graph_bucket: str = "mat-qa-knowledge-graph"
    public_endpoint: Optional[str] = "http://localhost:9000"
    cdn_endpoint: Optional[str] = None
    presigned_url_expires: int = 3600
    auto_create_buckets: bool = True
    skip_bucket_validation: bool = False  # 跳过存储桶验证和创建，直接连接


class APIGatewayConfig(BaseModel):
    """API网关配置（如One-API）"""
    enabled: bool = False
    base_url: Optional[str] = None
    api_key: Optional[str] = None
    timeout: int = 30
    max_retries: int = 3
    fallback_to_direct: bool = True


class DirectAPIConfig(BaseModel):
    """直连API配置"""
    api_key: Optional[str] = None
    base_url: Optional[str] = None
    endpoint: Optional[str] = None
    auth_header: str = "Authorization"
    auth_type: str = "Bearer"
    timeout: int = 30


class ModelConfig(BaseModel):
    """模型配置"""
    id: str
    name: str
    model_name: str  # 实际调用的模型名称
    provider: str
    context_length: int = 8192
    max_tokens: int = 2048
    dimension: Optional[int] = None  # 对于嵌入模型
    multimodal: bool = False
    domain: Optional[str] = None
    description: Optional[str] = None


class ProviderConfig(BaseModel):
    """提供商配置"""
    direct: DirectAPIConfig
    prefer_gateway: bool = False
    models: List[ModelConfig]


class LLMConfig(BaseModel):
    """LLM配置"""
    api_gateway: APIGatewayConfig
    providers: Dict[str, ProviderConfig]


class EmbeddingConfig(BaseModel):
    """嵌入配置"""
    api_gateway: APIGatewayConfig
    providers: Dict[str, ProviderConfig]


class DefaultEmbeddingConfig(BaseModel):
    """默认嵌入配置"""
    provider: str
    model_id: str
    fallback: Optional[Dict[str, str]] = None


class RetrievalConfig(BaseModel):
    """检索配置"""
    default_embedding: DefaultEmbeddingConfig
    vector_search: Dict[str, Any] = {}
    keyword_search: Dict[str, Any] = {}
    hybrid_search: Dict[str, Any] = {}


class AgentConfig(BaseModel):
    """智能体配置"""
    name: str
    role: str
    model_provider: str  # 使用厂商标识
    model_id: str        # 使用模型ID
    instructions: List[str]
    temperature: float = 0.1
    max_tokens: int = 2048
    show_tool_calls: bool = True
    markdown: bool = True


class AgentTeamConfig(BaseModel):
    """智能体团队配置"""
    name: str
    mode: str = "coordinate"
    members: List[str]
    coordinator: str
    success_criteria: str
    instructions: List[str]


class DeepScrapeConfig(BaseModel):
    """DeepScrape服务配置"""
    base_url: str = "http://localhost:3001"  # 修改为3001端口，避免与前端冲突
    api_key: str = "test-key"
    timeout: int = 30
    enabled: bool = False
    # 默认选项
    default_extractor_format: str = "markdown"
    default_wait_timeout: int = 5000
    default_stealth_mode: bool = True
    default_concurrency: int = 3
    max_batch_size: int = 100


class SecurityConfig(BaseModel):
    """安全配置"""
    secret_key: str
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    cors_origins: List[str]


class AppConfig(BaseModel):
    """应用配置"""
    name: str = "NextAgentLite智能体应用平台"
    version: str = "1.0.0"
    environment: str = "development"
    debug: bool = True
    host: str = "0.0.0.0"
    port: int = 8000
    reload: bool = True


class OptimizedSettings(BaseSettings):
    """优化后的应用设置"""

    # 基础配置
    app: AppConfig = AppConfig()

    # 数据库配置
    database_postgresql: DatabaseConfig = DatabaseConfig()
    database_elasticsearch: ElasticsearchConfig = ElasticsearchConfig()
    database_arangodb: ArangoDBConfig = ArangoDBConfig()
    
    # 对象存储配置
    storage_minio: MinIOConfig = MinIOConfig()
    
    # 外部服务配置
    deepscrape: DeepScrapeConfig = DeepScrapeConfig()

    # LLM和嵌入配置
    llm: Optional[LLMConfig] = None
    embeddings: Optional[EmbeddingConfig] = None
    
    # 检索配置
    retrieval: Optional[RetrievalConfig] = None

    # 智能体配置
    agents: Dict[str, AgentConfig] = {}
    agent_teams: Dict[str, AgentTeamConfig] = {}

    # 安全配置
    security: SecurityConfig = SecurityConfig(
        secret_key="your-secret-key-here",
        cors_origins=[
            "http://localhost:3000",
            "http://localhost:3001", 
            "http://localhost:3002",
            "http://localhost:5173",  # Vite默认端口
            "http://127.0.0.1:3000",
            "http://127.0.0.1:3001",
            "http://127.0.0.1:3002",
            "http://127.0.0.1:5173"
        ]
    )

    # 上传配置
    upload_max_file_size: int = 10485760
    upload_allowed_extensions: List[str] = ["pdf", "docx", "txt", "md"]
    upload_dir: str = "uploads"

    # 日志配置
    logging_level: str = "INFO"
    logging_file_path: str = "logs/mat_qa_{time:YYYY-MM-DD}.log"
    
    # 环境变量字段
    mat_qa_env: Optional[str] = Field(default="development", env="MAT_QA_ENV")
    secret_key: Optional[str] = Field(default=None, env="SECRET_KEY")
    
    # One-API 统一网关配置
    one_api_key: Optional[str] = None
    one_api_base_url: Optional[str] = None
    
    # 统一网关模型配置（新格式）
    llm_models: Optional[str] = None  # "model1,model2,model3"
    default_llm_model: Optional[str] = None
    alibaba_llm_models: Optional[str] = None
    openai_llm_models: Optional[str] = None
    google_llm_models: Optional[str] = None
    
    embedding_models: Optional[str] = None  # "model1,model2,model3"
    default_embedding_model: Optional[str] = None
    alibaba_embedding_models: Optional[str] = None
    openai_embedding_models: Optional[str] = None
    
    
    
    # 可选：直连模式配置（回退）
    qwen_api_key: Optional[str] = None
    qwen_api_base_url: Optional[str] = None
    gpt_api_key: Optional[str] = None
    gpt_api_base_url: Optional[str] = None
    gemini_api_key: Optional[str] = None
    gemini_api_base_url: Optional[str] = None
    qwen_embedding_api_key: Optional[str] = None
    qwen_embedding_api_base_url: Optional[str] = None
    openai_embedding_api_key: Optional[str] = None
    openai_embedding_api_base_url: Optional[str] = None
    
    # Database configs
    postgresql_host: Optional[str] = None
    postgresql_port: Optional[str] = None
    postgresql_database: Optional[str] = None
    postgresql_username: Optional[str] = None
    postgresql_password: Optional[str] = None
    
    # Elasticsearch configs
    elasticsearch_url: Optional[str] = None
    elasticsearch_username: Optional[str] = None
    elasticsearch_password: Optional[str] = None
    elasticsearch_api_key: Optional[str] = None
    
    # ArangoDB configs
    arangodb_url: Optional[str] = None
    arangodb_database: Optional[str] = None
    arangodb_username: Optional[str] = None
    arangodb_password: Optional[str] = None
    
    # MinIO configs
    minio_enabled: Optional[str] = None
    minio_endpoint: Optional[str] = None
    minio_access_key: Optional[str] = None
    minio_secret_key: Optional[str] = None
    minio_secure: Optional[str] = None
    minio_region: Optional[str] = None
    minio_documents_bucket: Optional[str] = None
    minio_media_bucket: Optional[str] = None
    minio_thumbnails_bucket: Optional[str] = None
    minio_knowledge_graph_bucket: Optional[str] = None
    minio_public_endpoint: Optional[str] = None
    minio_presigned_url_expires: Optional[str] = None
    minio_auto_create_buckets: Optional[str] = None
    minio_skip_bucket_validation: Optional[str] = None
    
    # Other configs
    log_level: Optional[str] = None
    api_port: Optional[str] = None
    api_host: Optional[str] = None
    cors_origins: Optional[str] = None
    max_upload_size: Optional[str] = None
    vectorization_batch_size: Optional[str] = None

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False
        extra = "ignore"


class OptimizedConfigManager:
    """优化后的配置管理器"""

    def __init__(self, config_path: str = None, env: str = None):
        self.config_path = config_path or "config/development.yaml"
        self.env = env or os.getenv("MAT_QA_ENV", "development")
        self.settings = None
        self._load_config()

    def _load_config(self):
        """加载配置文件"""
        try:
            # 首先加载 .env 文件
            from dotenv import load_dotenv
            load_dotenv()
            
            # 使用Dynaconf管理配置 - 使用default配置节点匹配config.yaml结构
            self.dynaconf = Dynaconf(
                settings_files=[self.config_path],
                environments=True,
                load_dotenv=True,
                env="default",  # 使用default配置节点匹配config.yaml结构
                # 不设置 env_switcher 和 envvar_prefix 以避免环境变量干扰
            )

            # 创建Settings实例 - 临时清空环境变量避免验证错误
            env_backup = {}
            env_vars_to_clear = [
                'MAT_QA_ENV', 'QWEN_API_KEY', 'GEMINI_API_KEY', 'OPENAI_API_KEY',
                'ONE_API_KEY', 'ONE_API_BASE_URL', 'CUSTOM_API_KEY', 'CUSTOM_BASE_URL',
                'CUSTOM_EMBEDDING_API_KEY', 
                'CUSTOM_EMBEDDING_BASE_URL', 'POSTGRESQL_HOST', 'POSTGRESQL_PORT', 
                'POSTGRESQL_DATABASE', 'POSTGRESQL_USERNAME', 'POSTGRESQL_PASSWORD', 
                'ELASTICSEARCH_URL', 'ELASTICSEARCH_USERNAME', 'ELASTICSEARCH_PASSWORD', 
                'ELASTICSEARCH_API_KEY', 'ARANGODB_URL', 'ARANGODB_DATABASE', 
                'ARANGODB_USERNAME', 'ARANGODB_PASSWORD', 'MINIO_ENABLED', 'MINIO_ENDPOINT', 
                'MINIO_ACCESS_KEY', 'MINIO_SECRET_KEY', 'MINIO_SECURE', 'MINIO_REGION', 
                'MINIO_DOCUMENTS_BUCKET', 'MINIO_MEDIA_BUCKET', 'MINIO_THUMBNAILS_BUCKET', 
                'MINIO_KNOWLEDGE_GRAPH_BUCKET', 
                'MINIO_PUBLIC_ENDPOINT', 'MINIO_PRESIGNED_URL_EXPIRES', 'MINIO_AUTO_CREATE_BUCKETS', 'MINIO_SKIP_BUCKET_VALIDATION', 
                'LOG_LEVEL', 'API_PORT', 'API_HOST', 'CORS_ORIGINS', 'MAX_UPLOAD_SIZE', 
                'VECTORIZATION_BATCH_SIZE', 'SECRET_KEY'
            ]
            
            for var in env_vars_to_clear:
                if var in os.environ:
                    env_backup[var] = os.environ[var]
                    del os.environ[var]
            
            try:
                self.settings = OptimizedSettings()
            finally:
                # 恢复环境变量
                for var, value in env_backup.items():
                    os.environ[var] = value
            
            self._populate_settings()

        except Exception as e:
            print(f"配置加载失败: {e}")
            self.settings = OptimizedSettings()

    def _populate_settings(self):
        """填充设置"""
        try:
            # 首先从环境变量直接加载关键配置 - 确保环境变量优先级最高
            import os
            if os.getenv('ONE_API_KEY'):
                self.settings.one_api_key = os.getenv('ONE_API_KEY')
            if os.getenv('ONE_API_BASE_URL'):
                self.settings.one_api_base_url = os.getenv('ONE_API_BASE_URL')
            # 直接从GATEWAY_MODELS读取，不要回退
            if os.getenv('GATEWAY_MODELS'):
                self.settings.llm_models = os.getenv('GATEWAY_MODELS')
            if os.getenv('DEFAULT_LLM_MODEL'):
                self.settings.default_llm_model = os.getenv('DEFAULT_LLM_MODEL')
            if os.getenv('GATEWAY_EMBEDDING_MODELS'):
                self.settings.embedding_models = os.getenv('GATEWAY_EMBEDDING_MODELS')
            if os.getenv('DEFAULT_EMBEDDING_MODEL'):
                self.settings.default_embedding_model = os.getenv('DEFAULT_EMBEDDING_MODEL')
            

            # 处理CORS配置
            if os.getenv('CORS_ORIGINS'):
                cors_origins_str = os.getenv('CORS_ORIGINS')
                cors_origins = [origin.strip() for origin in cors_origins_str.split(',')]
                self.settings.security = SecurityConfig(
                    secret_key=os.getenv('SECRET_KEY', self.settings.security.secret_key),
                    cors_origins=cors_origins
                )

            # 处理Elasticsearch配置（适配本地环境）
            self._populate_elasticsearch_config()

            # 使用Dynaconf根配置
            env_config = self.dynaconf

            # 应用配置
            if hasattr(env_config, 'app'):
                self.settings.app = AppConfig(**env_config.app)

            # 数据库配置
            if hasattr(env_config, 'database'):
                db_config = env_config.database
                if hasattr(db_config, 'postgresql'):
                    pg_config = self._process_env_vars(dict(db_config.postgresql))
                    self.settings.database_postgresql = DatabaseConfig(**pg_config)
                
                if hasattr(db_config, 'elasticsearch'):
                    es_config = self._process_env_vars(dict(db_config.elasticsearch))
                    self.settings.database_elasticsearch = ElasticsearchConfig(**es_config)
                
                if hasattr(db_config, 'arangodb'):
                    arango_config = self._process_env_vars(dict(db_config.arangodb))
                    self.settings.database_arangodb = ArangoDBConfig(**arango_config)

            # 存储配置
            if hasattr(env_config, 'storage') and hasattr(env_config.storage, 'minio'):
                self.settings.storage_minio = MinIOConfig(**env_config.storage.minio)

            # LLM配置
            if hasattr(env_config, 'llm'):
                llm_config = env_config.llm
                
                # API网关配置
                gateway_config = APIGatewayConfig()
                if hasattr(llm_config, 'api_gateway'):
                    gateway_dict = self._process_env_vars(dict(llm_config.api_gateway))
                    gateway_config = APIGatewayConfig(**gateway_dict)

                # 提供商配置
                providers = {}
                if hasattr(llm_config, 'providers'):
                    for provider_name, provider_config in llm_config.providers.items():
                        provider_dict = dict(provider_config)
                        
                        # 处理直连配置
                        direct_config = DirectAPIConfig()
                        if 'direct' in provider_dict:
                            direct_dict = self._process_env_vars(dict(provider_dict['direct']))
                            direct_config = DirectAPIConfig(**direct_dict)
                        
                        # 处理模型配置
                        models = []
                        if 'models' in provider_dict:
                            for model_config in provider_dict['models']:
                                models.append(ModelConfig(**model_config))
                        
                        providers[provider_name] = ProviderConfig(
                            direct=direct_config,
                            prefer_gateway=provider_dict.get('prefer_gateway', False),
                            models=models
                        )

                self.settings.llm = LLMConfig(
                    api_gateway=gateway_config,
                    providers=providers
                )

                # 嵌入配置 - 在llm配置下面
                if hasattr(llm_config, 'embeddings'):
                    embeddings_config = llm_config.embeddings
                    
                    # API网关配置
                    embedding_gateway_config = APIGatewayConfig()
                    if hasattr(embeddings_config, 'api_gateway'):
                        gateway_dict = self._process_env_vars(dict(embeddings_config.api_gateway))
                        embedding_gateway_config = APIGatewayConfig(**gateway_dict)

                    # 提供商配置
                    embedding_providers = {}
                    if hasattr(embeddings_config, 'providers'):
                        for provider_name, provider_config in embeddings_config.providers.items():
                            provider_dict = dict(provider_config)
                            
                            # 处理直连配置
                            direct_config = DirectAPIConfig()
                            if 'direct' in provider_dict:
                                direct_dict = self._process_env_vars(dict(provider_dict['direct']))
                                direct_config = DirectAPIConfig(**direct_dict)
                            
                            # 处理模型配置
                            models = []
                            if 'models' in provider_dict:
                                for model_config in provider_dict['models']:
                                    models.append(ModelConfig(**model_config))
                            
                            embedding_providers[provider_name] = ProviderConfig(
                                direct=direct_config,
                                prefer_gateway=provider_dict.get('prefer_gateway', False),
                                models=models
                            )

                    self.settings.embeddings = EmbeddingConfig(
                        api_gateway=embedding_gateway_config,
                        providers=embedding_providers
                    )

            # 检索配置
            if hasattr(env_config, 'retrieval'):
                retrieval_dict = dict(env_config.retrieval)
                
                # 处理默认嵌入配置
                if 'default_embedding' in retrieval_dict:
                    default_embedding = DefaultEmbeddingConfig(**retrieval_dict['default_embedding'])
                    self.settings.retrieval = RetrievalConfig(
                        default_embedding=default_embedding,
                        vector_search=retrieval_dict.get('vector_search', {}),
                        keyword_search=retrieval_dict.get('keyword_search', {}),
                        hybrid_search=retrieval_dict.get('hybrid_search', {})
                    )

            # 智能体配置 - 从default环境加载
            default_config = getattr(self.dynaconf, 'default', None)
            if default_config and hasattr(default_config, 'agents'):
                agents = {}
                for agent_name, agent_config in default_config.agents.items():
                    agents[agent_name] = AgentConfig(**agent_config)
                self.settings.agents = agents
            elif hasattr(env_config, 'agents'):
                agents = {}
                for agent_name, agent_config in env_config.agents.items():
                    agents[agent_name] = AgentConfig(**agent_config)
                self.settings.agents = agents

            # 智能体团队配置 - 从default环境加载
            if default_config and hasattr(default_config, 'agent_teams'):
                teams = {}
                for team_name, team_config in default_config.agent_teams.items():
                    teams[team_name] = AgentTeamConfig(**team_config)
                self.settings.agent_teams = teams
            elif hasattr(env_config, 'agent_teams'):
                teams = {}
                for team_name, team_config in env_config.agent_teams.items():
                    teams[team_name] = AgentTeamConfig(**team_config)
                self.settings.agent_teams = teams

            # 安全配置
            if hasattr(env_config, 'security') and env_config.security is not None:
                security_config = self._process_env_vars(dict(env_config.security))
                self.settings.security = SecurityConfig(**security_config)

            # 最后再次确保环境变量优先级最高 - 覆盖所有配置文件设置
            self._apply_final_env_overrides()

        except Exception as e:
            print(f"配置填充失败: {e}")
            import traceback
            traceback.print_exc()
    
    def _apply_final_env_overrides(self):
        """应用最终的环境变量覆盖 - 确保环境变量优先级最高"""
        import os
        
        # 强制应用MinIO环境变量配置，覆盖任何配置文件设置
        minio_overrides = {}
        minio_changed = False
        
        if os.getenv('MINIO_ENABLED') is not None:
            minio_overrides['enabled'] = os.getenv('MINIO_ENABLED').lower() in ('true', '1')
            minio_changed = True
            print(f"环境变量覆盖: MINIO_ENABLED = {minio_overrides['enabled']}")
        
        if os.getenv('MINIO_ENDPOINT'):
            minio_overrides['endpoint'] = os.getenv('MINIO_ENDPOINT')
            minio_changed = True
            print(f"环境变量覆盖: MINIO_ENDPOINT = {minio_overrides['endpoint']}")
        
        if os.getenv('MINIO_ACCESS_KEY'):
            minio_overrides['access_key'] = os.getenv('MINIO_ACCESS_KEY')
            minio_changed = True
            print(f"环境变量覆盖: MINIO_ACCESS_KEY = {minio_overrides['access_key']}")
        
        if os.getenv('MINIO_SECRET_KEY'):
            minio_overrides['secret_key'] = os.getenv('MINIO_SECRET_KEY')
            minio_changed = True
            print(f"环境变量覆盖: MINIO_SECRET_KEY = ****")
        
        if os.getenv('MINIO_SECURE') is not None:
            minio_overrides['secure'] = os.getenv('MINIO_SECURE').lower() in ('true', '1')
            minio_changed = True
            print(f"环境变量覆盖: MINIO_SECURE = {minio_overrides['secure']}")
        
        if os.getenv('MINIO_AUTO_CREATE_BUCKETS') is not None:
            minio_overrides['auto_create_buckets'] = os.getenv('MINIO_AUTO_CREATE_BUCKETS').lower() in ('true', '1')
            minio_changed = True
            print(f"环境变量覆盖: MINIO_AUTO_CREATE_BUCKETS = {minio_overrides['auto_create_buckets']}")
        
        if os.getenv('MINIO_SKIP_BUCKET_VALIDATION') is not None:
            minio_overrides['skip_bucket_validation'] = os.getenv('MINIO_SKIP_BUCKET_VALIDATION').lower() in ('true', '1')
            minio_changed = True
            print(f"环境变量覆盖: MINIO_SKIP_BUCKET_VALIDATION = {minio_overrides['skip_bucket_validation']}")
        
        # 检查bucket名称的环境变量覆盖
        if os.getenv('MINIO_DOCUMENTS_BUCKET'):
            minio_overrides['documents_bucket'] = os.getenv('MINIO_DOCUMENTS_BUCKET')
            minio_changed = True
            print(f"环境变量覆盖: MINIO_DOCUMENTS_BUCKET = {minio_overrides['documents_bucket']}")
        
        if os.getenv('MINIO_MEDIA_BUCKET'):
            minio_overrides['media_bucket'] = os.getenv('MINIO_MEDIA_BUCKET')
            minio_changed = True
            print(f"环境变量覆盖: MINIO_MEDIA_BUCKET = {minio_overrides['media_bucket']}")
        
        if os.getenv('MINIO_THUMBNAILS_BUCKET'):
            minio_overrides['thumbnails_bucket'] = os.getenv('MINIO_THUMBNAILS_BUCKET')
            minio_changed = True
            print(f"环境变量覆盖: MINIO_THUMBNAILS_BUCKET = {minio_overrides['thumbnails_bucket']}")
        
        if os.getenv('MINIO_KNOWLEDGE_GRAPH_BUCKET'):
            minio_overrides['knowledge_graph_bucket'] = os.getenv('MINIO_KNOWLEDGE_GRAPH_BUCKET')
            minio_changed = True
            print(f"环境变量覆盖: MINIO_KNOWLEDGE_GRAPH_BUCKET = {minio_overrides['knowledge_graph_bucket']}")
        
        # 如果有MinIO配置变更，重新创建MinIOConfig对象
        if minio_changed:
            current_minio = self.settings.storage_minio
            # 合并当前配置和环境变量覆盖
            updated_config = {
                'enabled': minio_overrides.get('enabled', current_minio.enabled),
                'endpoint': minio_overrides.get('endpoint', current_minio.endpoint),
                'access_key': minio_overrides.get('access_key', current_minio.access_key),
                'secret_key': minio_overrides.get('secret_key', current_minio.secret_key),
                'secure': minio_overrides.get('secure', current_minio.secure),
                'region': current_minio.region,
                'documents_bucket': minio_overrides.get('documents_bucket', current_minio.documents_bucket),
                'media_bucket': minio_overrides.get('media_bucket', current_minio.media_bucket),
                'thumbnails_bucket': minio_overrides.get('thumbnails_bucket', current_minio.thumbnails_bucket),
                'knowledge_graph_bucket': minio_overrides.get('knowledge_graph_bucket', current_minio.knowledge_graph_bucket),
                'public_endpoint': current_minio.public_endpoint,
                'cdn_endpoint': current_minio.cdn_endpoint,
                'presigned_url_expires': current_minio.presigned_url_expires,
                'auto_create_buckets': minio_overrides.get('auto_create_buckets', current_minio.auto_create_buckets),
                'skip_bucket_validation': minio_overrides.get('skip_bucket_validation', current_minio.skip_bucket_validation)
            }
            self.settings.storage_minio = MinIOConfig(**updated_config)
            print(f"✅ MinIO配置已根据环境变量更新")
        
        
        # 强制应用CORS环境变量配置，覆盖任何配置文件设置
        if os.getenv('CORS_ORIGINS'):
            cors_origins_str = os.getenv('CORS_ORIGINS')
            cors_origins = [origin.strip() for origin in cors_origins_str.split(',')]
            current_security = self.settings.security
            self.settings.security = SecurityConfig(
                secret_key=os.getenv('SECRET_KEY', current_security.secret_key),
                algorithm=current_security.algorithm,
                access_token_expire_minutes=current_security.access_token_expire_minutes,
                cors_origins=cors_origins
            )
            print(f"环境变量覆盖: CORS_ORIGINS = {cors_origins}")
            print(f"✅ CORS配置已根据环境变量更新")
    
    def _populate_elasticsearch_config(self):
        """填充Elasticsearch配置（适配本地环境）"""
        import os
        
        try:
            # 获取Elasticsearch配置
            es_url = os.getenv('ELASTICSEARCH_URL', 'https://localhost:9200')
            es_username = os.getenv('ELASTICSEARCH_USERNAME')
            es_password = os.getenv('ELASTICSEARCH_PASSWORD')
            es_api_key = os.getenv('ELASTICSEARCH_API_KEY')
            
            # 适配本地环境配置
            if self.settings.mat_qa_env == 'development':
                # 本地开发环境：强制使用http和无认证模式
                print("本地开发环境检测：Elasticsearch适配为无认证HTTP模式")
                
                # 强制修改URL为http模式（本地环境通常不用https）
                if es_url.startswith('https://'):
                    es_url = es_url.replace('https://', 'http://')
                    print(f"本地环境URL强制调整为: {es_url}")
                
                # 清除认证信息（本地环境无需认证）
                if not es_username and not es_password and not es_api_key:
                    print("本地环境使用无认证模式")
            
            # 更新Elasticsearch配置
            es_config = ElasticsearchConfig(
                hosts=[es_url],
                username=es_username,
                password=es_password,
                api_key=es_api_key,
                timeout=30,
                max_retries=3,
                required_on_startup=True
            )
            
            self.settings.database_elasticsearch = es_config
            print(f"Elasticsearch配置已更新: {es_url}")
            
        except Exception as e:
            print(f"Elasticsearch配置填充失败: {e}")
            # 使用默认配置
            self.settings.database_elasticsearch = ElasticsearchConfig()

    def _process_env_vars(self, config_dict: Dict[str, Any]) -> Dict[str, Any]:
        """处理环境变量替换"""
        processed = {}
        for key, value in config_dict.items():
            if isinstance(value, str) and value.startswith('${') and value.endswith('}'):
                env_var_expr = value[2:-1]
                if ':-' in env_var_expr:
                    env_var, default_val = env_var_expr.split(':-', 1)
                    processed[key] = os.getenv(env_var, default_val)
                else:
                    processed[key] = os.getenv(env_var_expr, '')
            elif isinstance(value, list):
                # 处理列表中的环境变量
                processed_list = []
                for item in value:
                    if isinstance(item, str) and item.startswith('${') and item.endswith('}'):
                        env_var_expr = item[2:-1]
                        if ':-' in env_var_expr:
                            env_var, default_val = env_var_expr.split(':-', 1)
                            processed_list.append(os.getenv(env_var, default_val))
                        else:
                            processed_list.append(os.getenv(env_var_expr, item))
                    else:
                        processed_list.append(item)
                processed[key] = processed_list
            else:
                processed[key] = value
        return processed

    def get_model_config(self, provider: str, model_id: str, service_type: str = "llm") -> Optional[ModelConfig]:
        """获取模型配置"""
        try:
            if service_type == "llm" and self.settings.llm:
                provider_config = self.settings.llm.providers.get(provider)
            elif service_type == "embeddings" and self.settings.embeddings:
                provider_config = self.settings.embeddings.providers.get(provider)
            else:
                return None

            if provider_config:
                for model in provider_config.models:
                    if model.id == model_id:
                        return model
            return None
        except Exception:
            return None

    def get_api_config(self, provider: str, service_type: str = "llm") -> Optional[DirectAPIConfig]:
        """获取API配置（优先网关，回退直连）"""
        try:
            if service_type == "llm" and self.settings.llm:
                provider_config = self.settings.llm.providers.get(provider)
                gateway = self.settings.llm.api_gateway
            elif service_type == "embeddings" and self.settings.embeddings:
                provider_config = self.settings.embeddings.providers.get(provider)
                gateway = self.settings.embeddings.api_gateway
            else:
                return None

            if not provider_config:
                return None

            # 如果优先使用网关且网关可用
            if provider_config.prefer_gateway and gateway.enabled and gateway.base_url:
                return DirectAPIConfig(
                    api_key=gateway.api_key,
                    base_url=gateway.base_url,
                    timeout=gateway.timeout
                )
            
            # 使用直连配置，如果没有配置base_url则回退到网关
            direct_config = provider_config.direct
            if not direct_config.base_url and gateway.enabled and gateway.base_url:
                # 直连base_url未配置时，使用网关作为回退
                return DirectAPIConfig(
                    api_key=direct_config.api_key or gateway.api_key,
                    base_url=gateway.base_url,
                    timeout=direct_config.timeout or gateway.timeout
                )
            
            return direct_config
            
        except Exception:
            return None

    def get_database_url(self) -> str:
        """获取数据库URL"""
        db = self.settings.database_postgresql
        
        # 从环境变量获取实际配置
        import os
        host = os.getenv('POSTGRESQL_HOST', db.host)
        port = os.getenv('POSTGRESQL_PORT', str(db.port))
        database = os.getenv('POSTGRESQL_DATABASE', db.database)
        username = os.getenv('POSTGRESQL_USERNAME', db.username)
        password = os.getenv('POSTGRESQL_PASSWORD', db.password)
        
        # 本地开发环境：如果密码被注释或为空，则不使用密码认证
        if not password or password.strip() == '':
            return f"postgresql+asyncpg://{username}@{host}:{port}/{database}"
        else:
            return f"postgresql+asyncpg://{username}:{password}@{host}:{port}/{database}"

    def get_sync_database_url(self) -> str:
        """获取同步数据库URL"""
        db = self.settings.database_postgresql
        
        # 从环境变量获取实际配置
        import os
        host = os.getenv('POSTGRESQL_HOST', db.host)
        port = os.getenv('POSTGRESQL_PORT', str(db.port))
        database = os.getenv('POSTGRESQL_DATABASE', db.database)
        username = os.getenv('POSTGRESQL_USERNAME', db.username)
        password = os.getenv('POSTGRESQL_PASSWORD', db.password)
        
        # 本地开发环境：如果密码被注释或为空，则不使用密码认证
        if not password or password.strip() == '':
            return f"postgresql://{username}@{host}:{port}/{database}"
        else:
            return f"postgresql://{username}:{password}@{host}:{port}/{database}"

    def get_provider_config(self, provider_name: str, service_type: str = "llm"):
        """获取提供商配置（兼容旧接口）"""
        try:
            if service_type == "llm" and self.settings.llm:
                provider_config = self.settings.llm.providers.get(provider_name)
                if provider_config:
                    # 创建兼容旧接口的配置对象
                    api_config = self.get_api_config(provider_name, "llm")
                    return type('LLMProviderConfig', (), {
                        'api_key': api_config.api_key if api_config else '',
                        'base_url': api_config.base_url if api_config else '',
                        'models': provider_config.models,
                        'provider_name': provider_name,
                        'timeout': api_config.timeout if api_config else 30,
                    })()
            elif service_type == "embeddings" and self.settings.embeddings:
                return self.settings.embeddings.providers.get(provider_name)
            return None
        except Exception:
            return None

    def get_agent_config(self, agent_name: str):
        """获取智能体配置"""
        try:
            if self.settings.agents:
                return self.settings.agents.get(agent_name)
            return None
        except Exception:
            return None

    def get_agent_team_config(self, team_name: str):
        """获取智能体团队配置"""
        try:
            if self.settings.agent_teams:
                return self.settings.agent_teams.get(team_name)
            return None
        except Exception:
            return None
    
    def get_unified_gateway_config(self) -> Dict[str, Any]:
        """获取统一网关配置"""
        return {
            'enabled': bool(self.settings.one_api_key and self.settings.one_api_base_url),
            'api_key': self.settings.one_api_key,
            'base_url': self.settings.one_api_base_url,
            'timeout': 30
        }
    
    def get_llm_models_config(self) -> Dict[str, Any]:
        """获取LLM模型配置（新格式）"""
        return {
            'all_models': self.settings.llm_models.split(',') if self.settings.llm_models else [],
            'default_model': self.settings.default_llm_model or 'qwen-plus-latest',
            'by_vendor': {
                'alibaba': self.settings.alibaba_llm_models.split(',') if self.settings.alibaba_llm_models else [],
                'openai': self.settings.openai_llm_models.split(',') if self.settings.openai_llm_models else [],
                'google': self.settings.google_llm_models.split(',') if self.settings.google_llm_models else []
            }
        }
    
    def get_embedding_models_config(self) -> Dict[str, Any]:
        """获取嵌入模型配置（新格式）"""
        return {
            'all_models': self.settings.embedding_models.split(',') if self.settings.embedding_models else [],
            'default_model': self.settings.default_embedding_model or 'Qwen/Qwen3-Embedding-4B',
            'by_vendor': {
                'alibaba': self.settings.alibaba_embedding_models.split(',') if self.settings.alibaba_embedding_models else [],
                'openai': self.settings.openai_embedding_models.split(',') if self.settings.openai_embedding_models else []
            }
        }
    
    
    def get_dynaconf_config(self, section: str, default: Any = None) -> Any:
        """获取dynaconf配置的指定部分"""
        try:
            # 尝试从当前环境获取配置
            current_env = self.dynaconf.current_env
            env_config = getattr(self.dynaconf, current_env, None)
            
            if env_config and hasattr(env_config, section):
                return getattr(env_config, section)
            
            # 如果当前环境没有，尝试从default环境获取
            default_config = getattr(self.dynaconf, 'default', None)
            if default_config and hasattr(default_config, section):
                return getattr(default_config, section)
            
            # 如果都没有，返回默认值
            return default
        except Exception as e:
            print(f"获取dynaconf配置失败: {e}")
            return default
    
    def get_rerank_config(self) -> Dict[str, Any]:
        """获取重排序模型配置"""
        try:
            import os
            
            # 优先使用环境变量构建配置
            api_key = os.getenv('ALIBABA_BAILIAN_RERANK_API_KEY')
            base_url = os.getenv('ALIBABA_BAILIAN_RERANK_BASE_URL')
            default_model = os.getenv('DEFAULT_RERANK_MODEL', 'gte-rerank-v2')
            default_provider = os.getenv('DEFAULT_RERANK_PROVIDER', 'alibaba_bailian')
            available_models = os.getenv('RERANK_MODELS', 'gte-rerank-v2').split(',')
            
            if api_key and base_url:
                # 使用环境变量构建配置
                return {
                    "alibaba_bailian": {
                        "enabled": True,
                        "api_key": api_key,
                        "base_url": base_url,
                        "timeout": 30,
                        "max_retries": 3,
                        "available_models": [
                            {
                                "id": model.strip(),
                                "name": f"GTE Rerank {model.strip().upper()}",
                                "model_name": model.strip(),
                                "provider": "alibaba",
                                "max_documents": 100,
                                "max_query_length": 2048,
                                "default": model.strip() == default_model
                            }
                            for model in available_models
                        ]
                    },
                    "default": {
                        "provider": default_provider,
                        "model_id": default_model,
                        "top_k": 10,
                        "score_threshold": 0.5
                    }
                }
            
            # 回退到配置文件
            rerank_config = self.get_dynaconf_config("rerank", {})
            
            # 应用环境变量覆盖
            if isinstance(rerank_config, dict) and "alibaba_bailian" in rerank_config:
                alibaba_config = rerank_config["alibaba_bailian"]
                
                if api_key:
                    alibaba_config['api_key'] = api_key
                if base_url:
                    alibaba_config['base_url'] = base_url
            
            return rerank_config
        except Exception as e:
            print(f"获取重排序配置失败: {e}")
            return {}
    
    def is_gateway_preferred(self) -> bool:
        """检查是否优先使用统一网关"""
        gateway_config = self.get_unified_gateway_config()
        return gateway_config['enabled']


# 创建优化后的全局配置管理器实例  
import os
# 确保配置文件路径正确，考虑不同的工作目录
current_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.dirname(current_dir)  # mat-backend directory
config_path = os.path.join(backend_dir, "config", "config.yaml")

optimized_config_manager = OptimizedConfigManager(config_path=config_path)
optimized_settings = optimized_config_manager.settings