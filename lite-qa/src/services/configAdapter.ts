/**
 * 配置适配器服务 - 处理前后端配置格式转换
 */

// 前端配置接口
export interface FrontendConfig {
  // 模型配置
  chatModel?: string;
  temperature?: number;
  maxTokens?: number;
  chatEndpoint?: string;
  chatApiKey?: string;
  enableStreaming?: boolean;
  
  // 向量模型配置
  generalModel?: string;
  generalDimension?: number;
  generalBatchSize?: number;
  generalTimeout?: number;
  generalEndpoint?: string;
  generalApiKey?: string;
  
  domainModel?: string;
  domainDimension?: number;
  domainBatchSize?: number;
  domainTimeout?: number;
  domainEndpoint?: string;
  domainApiKey?: string;
  
  // 重排模型配置
  enableReranking?: boolean;
  rerankModel?: string;
  rerankTopK?: number;
  rerankThreshold?: number;
  rerankTimeout?: number;
  rerankEndpoint?: string;
  rerankApiKey?: string;
  
  // 数据库配置
  esHost?: string;
  esIndex?: string;
  esAuthType?: 'userpass' | 'token';
  esUsername?: string;
  esPassword?: string;
  esToken?: string;
  
  pgHost?: string;
  pgDatabase?: string;
  pgUsername?: string;
  pgPassword?: string;
  pgMaxConnections?: number;
  pgConnectionTimeout?: number;
  
  arangoHost?: string;
  arangoDatabase?: string;
  arangoUsername?: string;
  arangoPassword?: string;
  
  // 双向量配置
  enableDualVector?: boolean;
  retrievalMode?: 'dual' | 'general' | 'domain';
  generalWeight?: number;
  domainWeight?: number;
  topK?: number;
  similarityThreshold?: number;
  
  // 检索配置
  useHybridSearch?: boolean;
  keywordSearchWeight?: number;
  vectorSearchWeight?: number;
  
  // 系统优化配置
  enableCache?: boolean;
  cacheExpiration?: number;
  logLevel?: 'debug' | 'info' | 'warning' | 'error';
  
  // 存储配置
  storageType?: 'minio' | 'local';
  minioEndpoint?: string;
  minioAccessKey?: string;
  minioSecretKey?: string;
  minioSecure?: boolean;
  
  // 知识图谱配置
  enableKnowledgeGraph?: boolean;
  extractionMode?: 'auto' | 'manual';
  minConfidence?: number;
  batchSize?: number;
  maxConcurrency?: number;
  retryAttempts?: number;
  timeoutMs?: number;
  arangodbHost?: string;
  arangodbDatabase?: string;
}

export interface BackendConfig {
  models?: {
    chat_model?: string;
    temperature?: number;
    max_tokens?: number;
    chat_endpoint?: string;
    chat_api_key?: string;
    enable_streaming?: boolean;
    general_embedding?: string;
    general_dimension?: number;
    general_batch_size?: number;
    general_timeout?: number;
    general_endpoint?: string;
    general_api_key?: string;
    domain_embedding?: string;
    domain_dimension?: number;
    domain_batch_size?: number;
    domain_timeout?: number;
    domain_endpoint?: string;
    domain_api_key?: string;
    enable_reranking?: boolean;
    rerank_model?: string;
    rerank_top_k?: number;
    rerank_threshold?: number;
    rerank_timeout?: number;
    rerank_endpoint?: string;
    rerank_api_key?: string;
  };
  
  database?: {
    elasticsearch_host?: string;
    elasticsearch_index?: string;
    elasticsearch_auth_type?: 'userpass' | 'token';
    elasticsearch_username?: string;
    elasticsearch_password?: string;
    elasticsearch_token?: string;
    postgresql_host?: string;
    postgresql_database?: string;
    postgresql_username?: string;
    postgresql_password?: string;
    postgresql_max_connections?: number;
    postgresql_connection_timeout?: number;
    arangodb_url?: string;
    arangodb_database?: string;
    arangodb_username?: string;
    arangodb_password?: string;
  };
  
  vectorization?: {
    enable_dual_vector?: boolean;
    retrieval_mode?: 'dual' | 'general' | 'domain';
    retrieval_config?: {
      weights?: {
        general?: number;
        domain?: number;
      };
      top_k?: number;
      similarity_threshold?: number;
      enable_reranking?: boolean;
      use_hybrid_search?: boolean;
      keyword_search_weight?: number;
      vector_search_weight?: number;
    };
  };
  
  system?: {
    enable_cache?: boolean;
    cache_expiration?: number;
    log_level?: 'debug' | 'info' | 'warning' | 'error';
  };
  
  storage?: {
    type?: 'minio' | 'local';
    endpoint?: string;
    access_key?: string;
    secret_key?: string;
    secure?: boolean;
  };
  
  knowledge_graph?: {
    enable_knowledge_graph?: boolean;
    extraction_mode?: 'auto' | 'manual';
    min_confidence?: number;
    batch_size?: number;
    max_concurrency?: number;
    retry_attempts?: number;
    timeout_ms?: number;
    arangodb_host?: string;
    arangodb_database?: string;
  };
}

export class ConfigAdapter {
  /**
   * 将前端配置格式转换为后端格式
   */
  static frontendToBackend(frontendConfig: FrontendConfig): BackendConfig {
    const backendConfig: BackendConfig = {};

    // 模型配置转换
    if (this.hasAnyModelConfig(frontendConfig)) {
      backendConfig.models = {
        chat_model: frontendConfig.chatModel,
        temperature: frontendConfig.temperature,
        max_tokens: frontendConfig.maxTokens,
        chat_endpoint: frontendConfig.chatEndpoint,
        chat_api_key: frontendConfig.chatApiKey,
        enable_streaming: frontendConfig.enableStreaming,
        
        general_embedding: frontendConfig.generalModel,
        general_dimension: frontendConfig.generalDimension,
        general_batch_size: frontendConfig.generalBatchSize,
        general_timeout: frontendConfig.generalTimeout,
        general_endpoint: frontendConfig.generalEndpoint,
        general_api_key: frontendConfig.generalApiKey,
        
        domain_embedding: frontendConfig.domainModel,
        domain_dimension: frontendConfig.domainDimension,
        domain_batch_size: frontendConfig.domainBatchSize,
        domain_timeout: frontendConfig.domainTimeout,
        domain_endpoint: frontendConfig.domainEndpoint,
        domain_api_key: frontendConfig.domainApiKey,
        
        enable_reranking: frontendConfig.enableReranking,
        rerank_model: frontendConfig.rerankModel,
        rerank_top_k: frontendConfig.rerankTopK,
        rerank_threshold: frontendConfig.rerankThreshold,
        rerank_timeout: frontendConfig.rerankTimeout,
        rerank_endpoint: frontendConfig.rerankEndpoint,
        rerank_api_key: frontendConfig.rerankApiKey
      };
      
      // 移除undefined值
      this.removeUndefinedValues(backendConfig.models);
    }

    // 数据库配置转换
    if (this.hasAnyDatabaseConfig(frontendConfig)) {
      backendConfig.database = {
        elasticsearch_host: frontendConfig.esHost,
        elasticsearch_index: frontendConfig.esIndex,
        elasticsearch_auth_type: frontendConfig.esAuthType,
        elasticsearch_username: frontendConfig.esUsername,
        elasticsearch_password: frontendConfig.esPassword,
        elasticsearch_token: frontendConfig.esToken,
        
        postgresql_host: frontendConfig.pgHost,
        postgresql_database: frontendConfig.pgDatabase,
        postgresql_username: frontendConfig.pgUsername,
        postgresql_password: frontendConfig.pgPassword,
        postgresql_max_connections: frontendConfig.pgMaxConnections,
        postgresql_connection_timeout: frontendConfig.pgConnectionTimeout,
        
        arangodb_url: frontendConfig.arangoHost,
        arangodb_database: frontendConfig.arangoDatabase,
        arangodb_username: frontendConfig.arangoUsername,
        arangodb_password: frontendConfig.arangoPassword
      };
      
      this.removeUndefinedValues(backendConfig.database);
    }

    // 向量化配置转换
    if (this.hasAnyVectorizationConfig(frontendConfig)) {
      backendConfig.vectorization = {
        enable_dual_vector: frontendConfig.enableDualVector,
        retrieval_mode: frontendConfig.retrievalMode,
        retrieval_config: {
          weights: {
            general: frontendConfig.generalWeight,
            domain: frontendConfig.domainWeight
          },
          top_k: frontendConfig.topK,
          similarity_threshold: frontendConfig.similarityThreshold,
          enable_reranking: frontendConfig.enableReranking,
          use_hybrid_search: frontendConfig.useHybridSearch,
          keyword_search_weight: frontendConfig.keywordSearchWeight,
          vector_search_weight: frontendConfig.vectorSearchWeight
        }
      };
      
      this.removeUndefinedValues(backendConfig.vectorization);
      this.removeUndefinedValues(backendConfig.vectorization.retrieval_config);
      this.removeUndefinedValues(backendConfig.vectorization.retrieval_config.weights);
    }

    // 系统配置转换
    if (this.hasAnySystemConfig(frontendConfig)) {
      backendConfig.system = {
        enable_cache: frontendConfig.enableCache,
        cache_expiration: frontendConfig.cacheExpiration,
        log_level: frontendConfig.logLevel
      };
      
      this.removeUndefinedValues(backendConfig.system);
    }

    // 存储配置转换
    if (this.hasAnyStorageConfig(frontendConfig)) {
      backendConfig.storage = {
        type: frontendConfig.storageType,
        endpoint: frontendConfig.minioEndpoint,
        access_key: frontendConfig.minioAccessKey,
        secret_key: frontendConfig.minioSecretKey,
        secure: frontendConfig.minioSecure
      };
      
      this.removeUndefinedValues(backendConfig.storage);
    }

    // 知识图谱配置转换
    if (this.hasAnyKnowledgeGraphConfig(frontendConfig)) {
      backendConfig.knowledge_graph = {
        enable_knowledge_graph: frontendConfig.enableKnowledgeGraph,
        extraction_mode: frontendConfig.extractionMode,
        min_confidence: frontendConfig.minConfidence,
        batch_size: frontendConfig.batchSize,
        max_concurrency: frontendConfig.maxConcurrency,
        retry_attempts: frontendConfig.retryAttempts,
        timeout_ms: frontendConfig.timeoutMs ? frontendConfig.timeoutMs * 1000 : undefined,
        arangodb_host: frontendConfig.arangodbHost,
        arangodb_database: frontendConfig.arangodbDatabase
      };
      
      this.removeUndefinedValues(backendConfig.knowledge_graph);
    }

    return backendConfig;
  }

  /**
   * 将后端配置格式转换为前端格式
   */
  static backendToFrontend(backendConfig: BackendConfig): FrontendConfig {
    const frontendConfig: FrontendConfig = {};

    // 模型配置转换
    if (backendConfig.models) {
      const models = backendConfig.models;
      Object.assign(frontendConfig, {
        chatModel: models.chat_model,
        temperature: models.temperature,
        maxTokens: models.max_tokens,
        chatEndpoint: models.chat_endpoint,
        chatApiKey: models.chat_api_key,
        enableStreaming: models.enable_streaming,
        
        generalModel: models.general_embedding,
        generalDimension: models.general_dimension,
        generalBatchSize: models.general_batch_size,
        generalTimeout: models.general_timeout,
        generalEndpoint: models.general_endpoint,
        generalApiKey: models.general_api_key,
        
        domainModel: models.domain_embedding,
        domainDimension: models.domain_dimension,
        domainBatchSize: models.domain_batch_size,
        domainTimeout: models.domain_timeout,
        domainEndpoint: models.domain_endpoint,
        domainApiKey: models.domain_api_key,
        
        enableReranking: models.enable_reranking,
        rerankModel: models.rerank_model,
        rerankTopK: models.rerank_top_k,
        rerankThreshold: models.rerank_threshold,
        rerankTimeout: models.rerank_timeout,
        rerankEndpoint: models.rerank_endpoint,
        rerankApiKey: models.rerank_api_key
      });
    }

    // 数据库配置转换
    if (backendConfig.database) {
      const db = backendConfig.database;
      Object.assign(frontendConfig, {
        esHost: db.elasticsearch_host,
        esIndex: db.elasticsearch_index,
        esAuthType: db.elasticsearch_auth_type,
        esUsername: db.elasticsearch_username,
        esPassword: db.elasticsearch_password,
        esToken: db.elasticsearch_token,
        
        pgHost: db.postgresql_host,
        pgDatabase: db.postgresql_database,
        pgUsername: db.postgresql_username,
        pgPassword: db.postgresql_password,
        pgMaxConnections: db.postgresql_max_connections,
        pgConnectionTimeout: db.postgresql_connection_timeout,
        
        arangoHost: db.arangodb_url,
        arangoDatabase: db.arangodb_database,
        arangoUsername: db.arangodb_username,
        arangoPassword: db.arangodb_password
      });
    }

    // 向量化配置转换
    if (backendConfig.vectorization) {
      const vec = backendConfig.vectorization;
      Object.assign(frontendConfig, {
        enableDualVector: vec.enable_dual_vector,
        retrievalMode: vec.retrieval_mode
      });
      
      if (vec.retrieval_config) {
        const config = vec.retrieval_config;
        Object.assign(frontendConfig, {
          generalWeight: config.weights?.general,
          domainWeight: config.weights?.domain,
          topK: config.top_k,
          similarityThreshold: config.similarity_threshold,
          useHybridSearch: config.use_hybrid_search,
          keywordSearchWeight: config.keyword_search_weight,
          vectorSearchWeight: config.vector_search_weight
        });
      }
    }

    // 系统配置转换
    if (backendConfig.system) {
      const sys = backendConfig.system;
      Object.assign(frontendConfig, {
        enableCache: sys.enable_cache,
        cacheExpiration: sys.cache_expiration,
        logLevel: sys.log_level
      });
    }

    // 存储配置转换
    if (backendConfig.storage) {
      const storage = backendConfig.storage;
      Object.assign(frontendConfig, {
        storageType: storage.type,
        minioEndpoint: storage.endpoint,
        minioAccessKey: storage.access_key,
        minioSecretKey: storage.secret_key,
        minioSecure: storage.secure
      });
    }

    // 知识图谱配置转换
    if (backendConfig.knowledge_graph) {
      const kg = backendConfig.knowledge_graph;
      Object.assign(frontendConfig, {
        enableKnowledgeGraph: kg.enable_knowledge_graph,
        extractionMode: kg.extraction_mode,
        minConfidence: kg.min_confidence,
        batchSize: kg.batch_size,
        maxConcurrency: kg.max_concurrency,
        retryAttempts: kg.retry_attempts,
        timeoutMs: kg.timeout_ms ? kg.timeout_ms / 1000 : undefined,
        arangodbHost: kg.arangodb_host,
        arangodbDatabase: kg.arangodb_database
      });
    }

    return frontendConfig;
  }

  /**
   * 分组配置：按配置段落分组
   */
  static groupConfigBySections(frontendConfig: FrontendConfig): Record<string, Record<string, any>> {
    const backendConfig = this.frontendToBackend(frontendConfig);
    const grouped: Record<string, Record<string, any>> = {};

    // 将后端配置按段落分组
    if (backendConfig.models) {
      grouped.models = backendConfig.models;
    }
    
    if (backendConfig.database) {
      grouped.database = backendConfig.database;
    }
    
    if (backendConfig.vectorization) {
      grouped.vectorization = backendConfig.vectorization;
    }
    
    if (backendConfig.system) {
      grouped.system = backendConfig.system;
    }
    
    if (backendConfig.storage) {
      grouped.storage = backendConfig.storage;
    }
    
    if (backendConfig.knowledge_graph) {
      grouped.knowledge_graph = backendConfig.knowledge_graph;
    }

    return grouped;
  }

  /**
   * 获取配置项的默认值
   */
  static getDefaultValues(): FrontendConfig {
    return {
      // 模型默认配置
      chatModel: 'qwen-chat-model',
      temperature: 0.7,
      maxTokens: 2048,
      enableStreaming: true,
      
      generalModel: 'text-embedding-v3',
      generalDimension: 1024,
      generalBatchSize: 32,
      generalTimeout: 300,
      
      domainModel: 'matbert-base-v1',
      domainDimension: 768,
      domainBatchSize: 16,
      domainTimeout: 300,
      
      enableReranking: true,
      rerankModel: 'bge-reranker-v2-m3',
      rerankTopK: 10,
      rerankThreshold: 0.5,
      rerankTimeout: 30,
      
      // 数据库默认配置
      esHost: 'localhost:9200',
      esIndex: 'mat_qa',
      esAuthType: 'userpass',
      esUsername: 'elastic',
      
      pgHost: 'localhost:5432',
      pgDatabase: 'mat_demo',
      pgUsername: 'postgres',
      pgMaxConnections: 20,
      pgConnectionTimeout: 30,
      
      arangoHost: 'localhost:8529',
      arangoDatabase: 'mat_qa_graph',
      arangoUsername: 'root',
      
      // 双向量默认配置
      enableDualVector: true,
      retrievalMode: 'dual',
      generalWeight: 0.4,
      domainWeight: 0.6,
      topK: 10,
      similarityThreshold: 0.7,
      
      // 检索默认配置
      useHybridSearch: true,
      keywordSearchWeight: 0.3,
      vectorSearchWeight: 0.7,
      
      // 系统默认配置
      enableCache: true,
      cacheExpiration: 60,
      logLevel: 'info',
      
      // 存储默认配置
      storageType: 'minio',
      minioEndpoint: 'localhost:9000',
      minioAccessKey: 'minioadmin',
      minioSecure: false,
      
      // 知识图谱默认配置
      enableKnowledgeGraph: false,
      extractionMode: 'auto',
      minConfidence: 0.7,
      batchSize: 10,
      maxConcurrency: 3,
      retryAttempts: 2,
      timeoutMs: 30,
      arangodbHost: 'localhost:8529',
      arangodbDatabase: 'mat_qa_graph'
    };
  }

  /**
   * 验证配置项的有效性
   */
  static validateConfig(config: FrontendConfig): {
    valid: boolean;
    errors: Array<{
      field: string;
      message: string;
      severity: 'error' | 'warning';
    }>;
  } {
    const errors: Array<{
      field: string;
      message: string;
      severity: 'error' | 'warning';
    }> = [];

    // 验证数值范围
    if (config.temperature !== undefined && (config.temperature < 0 || config.temperature > 2)) {
      errors.push({
        field: 'temperature',
        message: '温度参数必须在0-2之间',
        severity: 'error'
      });
    }

    if (config.maxTokens !== undefined && (config.maxTokens < 256 || config.maxTokens > 8192)) {
      errors.push({
        field: 'maxTokens',
        message: '最大Token数必须在256-8192之间',
        severity: 'error'
      });
    }

    if (config.similarityThreshold !== undefined && (config.similarityThreshold < 0 || config.similarityThreshold > 1)) {
      errors.push({
        field: 'similarityThreshold',
        message: '相似度阈值必须在0-1之间',
        severity: 'error'
      });
    }

    // 验证权重配置
    if (config.generalWeight !== undefined && config.domainWeight !== undefined) {
      const total = config.generalWeight + config.domainWeight;
      if (Math.abs(total - 1) > 0.01) {
        errors.push({
          field: 'weights',
          message: '通用向量权重和领域向量权重之和应该等于1',
          severity: 'warning'
        });
      }
    }

    // 验证主机地址格式
    if (config.esHost && !this.isValidHostPort(config.esHost)) {
      errors.push({
        field: 'esHost',
        message: 'ElasticSearch主机地址格式不正确 (期望: host:port)',
        severity: 'error'
      });
    }

    if (config.pgHost && !this.isValidHostPort(config.pgHost)) {
      errors.push({
        field: 'pgHost',
        message: 'PostgreSQL主机地址格式不正确 (期望: host:port)',
        severity: 'error'
      });
    }

    // 验证URL格式
    if (config.chatEndpoint && !this.isValidUrl(config.chatEndpoint)) {
      errors.push({
        field: 'chatEndpoint',
        message: '对话模型API端点URL格式不正确',
        severity: 'error'
      });
    }

    return {
      valid: errors.filter(e => e.severity === 'error').length === 0,
      errors
    };
  }

  // 私有辅助方法
  private static hasAnyModelConfig(config: FrontendConfig): boolean {
    return !!(config.chatModel || config.temperature || config.generalModel || 
             config.domainModel || config.enableReranking);
  }

  private static hasAnyDatabaseConfig(config: FrontendConfig): boolean {
    return !!(config.esHost || config.pgHost || config.arangoHost);
  }

  private static hasAnyVectorizationConfig(config: FrontendConfig): boolean {
    return !!(config.enableDualVector !== undefined || config.retrievalMode || 
             config.generalWeight !== undefined || config.topK !== undefined);
  }

  private static hasAnySystemConfig(config: FrontendConfig): boolean {
    return !!(config.enableCache !== undefined || config.cacheExpiration || config.logLevel);
  }

  private static hasAnyStorageConfig(config: FrontendConfig): boolean {
    return !!(config.storageType || config.minioEndpoint);
  }

  private static hasAnyKnowledgeGraphConfig(config: FrontendConfig): boolean {
    return !!(config.enableKnowledgeGraph !== undefined || config.extractionMode || 
             config.arangodbHost);
  }

  private static removeUndefinedValues(obj: any): void {
    Object.keys(obj).forEach(key => {
      if (obj[key] === undefined) {
        delete obj[key];
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        this.removeUndefinedValues(obj[key]);
        if (Object.keys(obj[key]).length === 0) {
          delete obj[key];
        }
      }
    });
  }

  private static isValidHostPort(hostPort: string): boolean {
    const regex = /^[a-zA-Z0-9.-]+:\d+$/;
    return regex.test(hostPort);
  }

  private static isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }
}

// 导出配置适配器实例
export const configAdapter = ConfigAdapter;

// 明确导出类型
export type { FrontendConfig, BackendConfig };