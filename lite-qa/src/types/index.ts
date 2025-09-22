/**
 * 全局类型定义
 */

// ============ 基础通用类型 ============
export interface ApiResponse<T = any> {
  code: number;
  message: string;
  data: T;
  success: boolean;
}

export interface ApiError {
  code: string | number;
  message: string;
  details?: any;
}

// ============ QA 问答系统类型 ============

// 传统的thinking格式（来自XML/JSON解析）
export interface ThinkingStep {
  name: string;
  arguments: {
    title: string;
    thought?: string;
    action?: string;
    result?: string;
    analysis?: string;
    next_action?: string;
    confidence: number;
  };
}

// 新的thinking格式（来自Agno工具调用）
export interface AgnoThinkingStep {
  title: string;
  content: string;
  confidence: number;
  timestamp: number;
}

// 统一的thinking步骤类型
export type UnifiedThinkingStep = ThinkingStep | AgnoThinkingStep;

export interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: number;
  sources?: Array<{
    type: 'reference' | 'image' | 'chart' | 'table';
    content: string;
    title?: string;
    description?: string;
    metadata?: Record<string, any>;
  }>;
  thinking?: Array<UnifiedThinkingStep>;
  knowledgeSources?: Array<{
    id: string;
    content: string;
    title?: string;
    score: number;
    source_type: 'document' | 'qa_dataset';
    source: string;
    metadata?: Record<string, any>;
    question?: string;  // QA数据集专用
    answer?: string;    // QA数据集专用
    highlights?: string[];
    adopted?: boolean;  // 是否被采用
  }>;
  knowledgeStats?: {
    total_sources: number;
    source_types: Record<string, number>;
    adopted_sources: number;
    adopted_types: Record<string, number>;
    average_score: number;
    search_time: number;
  };
  // 知识图谱检索结果
  graphSources?: {
    response: string;
    entities?: Array<{
      id: string;
      name: string;
      type: string;
      description?: string;
      properties?: Record<string, any>;
    }>;
    relationships?: Array<{
      id: string;
      source: string;
      target: string;
      type: string;
      properties?: Record<string, any>;
    }>;
    sources?: Array<{
      content: string;
      source: string;
      score?: number;
    }>;
    mode: string;
    query_time: number;
    success: boolean;
    error_message?: string;
  };
  metadata?: {
    agent_name?: string;
    model_used?: string;
    processing_time?: number;
    search_knowledge?: boolean;
    [key: string]: any;
  };
  time?: string;
  liked?: boolean | null;
  confidence?: number;
  images?: MessageImage[];
  tables?: MessageTable[];
  highlights?: HighlightData[];
  loading?: boolean; // 消息是否处于加载状态
  agentId?: string; // AI消息对应的智能体ID
  agentName?: string; // AI消息对应的智能体名称
  // 新增Team相关字段
  teamInfo?: {
    isTeamMessage: boolean;
    teamId?: string;
    teamName?: string;
    teamMode?: 'coordinate' | 'collaborate' | 'route';
    executionId?: string;
    memberCalls?: TeamMemberCall[];
    teamDecisions?: TeamDecision[];  // Team决策过程
    structuredOutput?: TeamStructuredOutput;
    coordinationInfo?: TeamCoordinationInfo;
  };
}

export interface MessageImage {
  url: string;
  alt?: string;
  title?: string;
  description?: string;
  width?: number;
  height?: number;
}

export interface MessageTable {
  title?: string;
  data: Record<string, any>[];
  columns: {
    title: string;
    dataIndex: string;
    key: string;
    width?: number;
  }[];
}

export interface SourceCitation {
  id: string;
  title: string;
  author?: string;
  authors?: string;
  url?: string;
  confidence?: number;
  content?: string;
  publishDate?: string;
  journal?: string;
  year?: number;
}

export interface SourceData {
  id: string;
  title: string;
  authors?: string;
  journal?: string;
  year?: number;
  page?: number;
  pages?: string;
  doi?: string;
  url?: string;
  content?: string;
}

export interface HighlightData {
  id: string;
  text: string;
  source?: string;
  confidence?: number;
  page?: number;
  context?: string;
}

export interface QARequest {
  message: string;
  conversation_id?: string;
  user_id?: number; // 用户ID，用于对话绑定
  agent_config?: {
    model: string;
    temperature?: number;
    max_tokens?: number;
  };
  // 临时兼容属性
  agentType?: 'team' | 'single';
  agentName?: string;
  modelName?: string; // 添加模型名称参数
  search_knowledge?: boolean; // 是否启用知识库检索（保持向后兼容）
  search_graph?: boolean; // 是否启用知识图谱检索（默认false）
  retrieval_mode?: 'qa_only' | 'papers_only' | 'all'; // 检索模式：QA数据集/论文文档/全部检索
  enable_translation?: boolean; // 是否启用中英文翻译检索
  // 多轮对话上下文参数
  enable_context_memory?: boolean; // 启用上下文记忆，默认true
  max_context_turns?: number; // 最大上下文轮数，默认8
}

export interface QAResponse {
  message: string;
  sources: SourceCitation[];
  conversation_id: string;
  message_id: string;
}

export interface AgentInfo {
  id: string;
  name: string;
  description: string;
  type?: 'agent' | 'team';
  icon?: string; // 头像图标名称
  color?: string; // 主题颜色
  models: {
    id: string;
    name: string;
    description: string;
  }[];
  defaultModel: string;
}

export interface HistoryConversation {
  id: string;
  title: string;
  lastMessage: string;
  time: string;
  messageCount: number;
  // 新增模式信息
  conversation_mode?: 'expert' | 'team';
  mode_display_name?: string;
}

// ============ 知识库管理类型 ============
export interface KnowledgeDocument {
  id: string;
  title: string;
  filename: string;
  fileType: string;
  fileSize: number;
  uploadTime: string;
  status: 'uploaded' | 'processing' | 'vectorized' | 'failed' | 'pending';
  // URL文档特有字段
  sourceUrl?: string;          // 原始URL地址
  scrapeMethod?: string;       // 抓取方法：crawl4ai, deepscrape
  scrapeMetadata?: any;        // 抓取元数据
  contentHash?: string;        // 内容哈希值
  tags: string[];
  metadata: {
    author?: string;
    keywords?: string[];
    description?: string;
    language?: string;
  };
  vectorStatus?: {
    progress: number;
    chunks: number;
    chunksCompleted?: number;
    currentPhase?: 'pending' | 'chunking' | 'vectorizing' | 'completed';
    vectorizationProgress?: string; // 如 "15/17"
    // 双向量化状态
    generalVector?: {
      available: boolean;
      model: string;
      progress: number;
      chunks: number;
    };
    domainVector?: {
      available: boolean;
      model: string;
      progress: number;
      chunks: number;
    };
  };
  // 简化的向量化标记
  vectorized: boolean;
  dualVectorized: boolean;
  // 处理进度和状态
  processing_progress?: number;
  vectorization_status?: 'pending' | 'processing' | 'completed' | 'failed';
  error_message?: string;
  updated_at?: string;
  // 向量化配置信息
  vectorConfig?: {
    chunkSize: number;
    chunkOverlap: number;
    chunkingStrategy: 'semantic' | 'fixed' | 'sentence' | 'paragraph';
    useDefault: boolean;
    configId?: string; // 关联的配置ID
    isCustom?: boolean; // 是否为自定义配置
    configName?: string; // 配置名称，用于显示
  };
}

export interface UploadResponse {
  success: boolean;
  message: string;
  documents: KnowledgeDocument[];
}

export interface DocumentStatusResponse {
  id: string;
  status: 'uploaded' | 'processing' | 'vectorized' | 'failed' | 'pending';
  processing_progress: number;
  vectorization_status: 'pending' | 'processing' | 'completed' | 'failed';
  error_message?: string;
  updated_at?: string;
  chunks_info?: {
    total_chunks: number;
    chunks_completed: number;
    current_phase: 'pending' | 'chunking' | 'vectorizing' | 'completed';
    vectorization_progress: string;
  };
}

export interface VectorConfig {
  id: string;
  name: string;
  model: string;
  dimension: number;
  chunkSize: number;
  chunkOverlap: number;
  strategy: 'sentence' | 'paragraph' | 'custom';
  isDefault: boolean;
}

export interface ModelConfig {
  id: string;
  name: string;
  alias?: string; // 🔥 新增：模型别名，用于前端显示，优先级高于name
  type: 'embedding' | 'chat' | 'reasoning';
  provider: string;
  model: string;
  apiKey?: string;
  baseUrl?: string;
  apiEndpoint?: string; // 🔥 新增：API端点字段，用于兼容现有代码
  parameters: Record<string, any>;
  isActive: boolean;
  enabled?: boolean; // 🔥 新增：启用状态字段，用于兼容现有代码
  description?: string; // 🔥 新增：描述字段，用于兼容现有代码
  // 兼容属性
  maxTokens?: number;
  temperature?: number;
  dimension?: number;
}

export interface RetrievalResult {
  id: string;
  title: string;
  content: string;
  score: number;
  source: string;
  metadata: Record<string, any>;
  // 新增双向量检索结果字段
  scores?: {
    general: number;
    domain: number;
    keyword: number;
    combined: number;
  };
  highlights?: Record<string, string[]>;
  sourceInfo?: {
    documentId: string;
    vectorizationStrategy: string;
    generalModel?: string;
    domainModel?: string;
  };
  // QA数据集支持
  source_type?: 'document' | 'qa_dataset';
  question?: string;  // QA数据集问题
  answer?: string;    // QA数据集答案
}

export interface RetrievalTestConfig {
  query: string;
  topK: number;
  threshold: number;
  rerank: boolean;
  model: string;
  // 简化检索配置
  mode?: 'dual' | 'general' | 'domain';
  enableReranking?: boolean;
  includeHighlights?: boolean;
}

// ============ 双向量化相关类型 ============
export interface DualVectorConfig {
  enableDualVector: boolean;
  retrievalMode: 'dual' | 'general' | 'domain';
  defaultModels: {
    general: {
      provider: string;
      model: string;
      dimension: number;
      batchSize: number;
      timeout: number;
      apiKey?: string;
    };
    domain: {
      provider: string;
      model: string;
      dimension: number;
      batchSize: number;
      timeout: number;
      endpoint: string;
    };
  };
  retrievalConfig: {
    weights: {
      general: number;
      domain: number;
    };
    topK: number;
    similarityThreshold: number;
    enableReranking: boolean;
  };
  vectorStores: {
    general: {
      path: string;
      documentCount: number;
      lastUpdated?: string;
      status: 'healthy' | 'error' | 'unknown';
    };
    domain: {
      path: string;
      documentCount: number;
      lastUpdated?: string;
      status: 'healthy' | 'error' | 'unknown';
    };
  };
}

// 保留用于向后兼容，但简化逻辑
export interface VectorizationDecision {
  // 现在所有文件都默认使用双向量化
  strategy: 'dual';
  confidence: number;
  reason: string;
  metadata: Record<string, any>;
}

export interface IntelligentSearchRequest {
  query: string;
  topK?: number;
  mode?: 'dual' | 'general' | 'domain';
  filters?: Record<string, any>;
  includeHighlights?: boolean;
  enableReranking?: boolean;
}

export interface IntelligentSearchResponse {
  results: RetrievalResult[];
  total: number;
  strategyUsed: string;
  queryAnalysis: {
    domainRelevance: number;
    suggestedMode: string;
    confidence: number;
    matchedKeywords: string[];
  };
  documentDistribution: {
    total: number;
    byStrategy: Record<string, number>;
    dualVectorRatio: number;
  };
  performanceMetrics: {
    queryLength: number;
    resultsCount: number;
    strategyConfidence: number;
    rerankingApplied: boolean;
  };
}

export interface DocumentVectorInfo {
  documentId: string;
  vectorizationStrategy: string;
  generalVectorAvailable: boolean;
  domainVectorAvailable: boolean;
  generalModel?: string;
  domainModel?: string;
  createdAt?: string;
  metadata?: Record<string, any>;
}

// ============ 知识图谱类型 ============
export interface GraphNode {
  id: string;
  label: string;
  type: string;
  properties: Record<string, any>;
  x?: number;
  y?: number;
  color?: string;
  size?: number;
  // 兼容属性
  connections?: number;
  level?: number;
  position?: { x: number; y: number };
}

export interface GraphEdge {
  id: string;
  from: string;
  to: string;
  label: string;
  type: string;
  properties: Record<string, any>;
  weight?: number;
  color?: string;
}

export interface GraphLayout {
  algorithm: 'spring' | 'hierarchical' | 'random';
  physics: {
    enabled: boolean;
    stabilization: boolean | { iterations?: number };
    solver?: string;
    barnesHut: {
      gravitationalConstant: number;
      centralGravity: number;
      springLength: number;
      springConstant: number;
      damping: number;
    };
  };
  // vis.js 兼容配置
  nodes?: {
    shape?: string;
    size?: number;
    font?: { size: number };
    borderWidth?: number;
  };
  edges?: {
    width?: number;
    smooth?: { type: string; enabled?: boolean };
    arrows?: { to: { enabled: boolean } };
  };
}

export interface GraphFilter {
  nodeTypes: string[];
  edgeTypes: string[];
  searchText: string;
  viewMode: 'overview' | 'focus' | 'cluster';
}

export interface GraphStats {
  nodeCount: number;
  edgeCount: number;
  typeDistribution: Record<string, number>;
  avgConnections: number;
}

// ============ 应用配置类型 ============
export interface UserPreferences {
  theme: 'light' | 'dark';
  language: 'zh' | 'en';
  fontSize: 'small' | 'medium' | 'large';
  autoSave: boolean;
  showSources: boolean;
  showConfidence: boolean;
}

export interface ResponsiveConfig {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  windowWidth: number;
  windowHeight: number;
}

export interface AppConfig {
  apiBaseUrl: string;
  version: string;
  environment: 'development' | 'production';
  features: {
    qa: boolean;
    knowledge: boolean;
    graph: boolean;
  };
}

// ============ 状态管理类型 ============
export interface QAState {
  messages: Message[];
  currentConversationId: string | null;
  isLoading: boolean;
  sources: SourceData[];
  currentMessageId: string | null;
  conversations: HistoryConversation[];
  agents: AgentInfo[];
  selectedAgent: string;
}

export interface KnowledgeState {
  documents: KnowledgeDocument[];
  vectorConfigs: VectorConfig[];
  modelConfigs: ModelConfig[];
  isLoading: boolean;
  selectedDocuments: string[];
  searchKeyword: string;
  filterTags: string[];
  stats: {
    totalDocuments: number;
    vectorizedDocuments: number;
    totalSize: number;
    activeTags: string[];
  };
}

export interface GraphState {
  nodes: GraphNode[];
  edges: GraphEdge[];
  selectedNodes: string[];
  selectedEdges: string[];
  layout: GraphLayout;
  filter: GraphFilter;
  stats: GraphStats;
  focusNodeId: string | null;
  isLoading: boolean;
}

export interface AppState {
  userPreferences: UserPreferences;
  responsive: ResponsiveConfig;
  config: AppConfig;
  sidebarCollapsed: boolean;
  currentRoute: string;
}

// ============ 知识图谱配置类型（简化） ============
export interface KnowledgeGraphConfig {
  enableKnowledgeGraph: boolean;
  autoExtraction: boolean; // 与主开关联动，启用时自动为true
  extractionMode: 'auto' | 'manual' | 'disabled';
  extractionConfig: {
    enabledEntityTypes: string[];
    minConfidence: number;
    batchSize: number;
    enableValidation: boolean; // 固定为true，不再提供开关
  };
  arangodbConfig: {
    enabled: boolean; // 与主开关联动
    host: string;
    database: string;
    collections: {
      entities: string;
      relationships: string;
      documents: string;
    };
  };
  processingConfig: {
    maxConcurrency: number;
    retryAttempts: number;
    timeoutMs: number;
  };
}

export interface TripleExtractionResult {
  documentId: string;
  status: 'processing' | 'completed' | 'failed';
  extractedTriples: {
    subject: string;
    predicate: string;
    object: string;
    confidence: number;
    context: string;
  }[];
  entityCount: number;
  relationshipCount: number;
  processingTime: number;
  error?: string;
}

// ============ 兼容类型别名 ============
export interface Conversation extends HistoryConversation {}
export interface Agent extends AgentInfo {}
export interface ImageData extends MessageImage {}
export interface TableData extends MessageTable {}

// 旧版本兼容性支持
export interface MessageAction {
  type: 'like' | 'dislike' | 'regenerate' | 'copy' | 'share';
  label: string;
  icon?: string;
}

// ============ 系统配置管理类型 ============
export interface SystemConfigSection {
  name: string;
  title: string;
  description: string;
  status: string;
  settings: Record<string, any>;
  editable: boolean;
  requires_restart: boolean;
}

export interface ServiceConfigStatus {
  name: string;
  status: string;
  message: string;
  details: Record<string, any>;
  has_fallback: boolean;
  fallback_active: boolean;
}

export interface SystemConfigResponse {
  sections: SystemConfigSection[];
  service_status: ServiceConfigStatus[];
  fallback_configs: Record<string, any>;
  last_validation?: string;
  environment_variables: string[];
}

export interface ConfigValidationResult {
  overall_status: string;
  warnings: string[];
  critical_issues: string[];
  fallback_configs: Record<string, any>;
}

export interface RetrievalModeInfo {
  current_mode: string;
  available_modes: string[];
  mode_capabilities: Record<string, {
    description: string;
    features: string[];
    performance: string;
  }>;
  recommendations: string[];
  fallback_mode: string;
}

export interface ConfigRecommendation {
  type: 'warning' | 'error' | 'improvement' | 'performance' | 'quality' | 'environment';
  message: string;
  category: string;
}

export interface SystemStatus {
  status: string;
  uptime: string;
  memory_usage: number;
  cpu_usage: number;
  disk_usage: number;
  memory_available_gb: number;
  disk_free_gb: number;
  services: Record<string, string>;
  timestamp: string;
}

export interface UserPreferencesData {
  theme: string;
  language: string;
  fontSize: string;
  autoSave: boolean;
  showSources: boolean;
  showConfidence: boolean;
  pageSize: number;
  enableNotifications: boolean;
  defaultSearchMode: string;
  ui_layout: Record<string, any>;
  qa_settings: Record<string, any>;
  knowledge_settings: Record<string, any>;
}

export interface DatabaseStatus {
  postgresql: {
    status: string;
    connection_count: number;
    database_size: string;
    last_backup?: string;
  };
  elasticsearch: {
    status: string;
    cluster_health: string;
    indices_count: number;
    total_documents: number;
  };
  arangodb: {
    status: string;
    database_count: number;
    collection_count: number;
    graph_count: number;
  };
}

export interface ModelConfigStatus {
  llm_providers: Record<string, {
    status: string;
    models: Array<{
      id: string;
      name: string;
      status: string;
      last_used?: string;
    }>;
  }>;
  embedding_providers: Record<string, {
    status: string;
    models: Array<{
      id: string;
      name: string;
      dimension: number;
      status: string;
    }>;
  }>;
  current_defaults: {
    chat_model: string;
    general_embedding: string;
    domain_embedding: string;
  };
}

export interface StatsOverview {
  documents: {
    total: number;
    vectorized: number;
    vectorization_rate: number;
    processing: number;
    failed: number;
  };
  conversations: {
    total: number;
    today: number;
    average_messages: number;
    active_sessions: number;
  };
  system: {
    uptime: string;
    memory_usage: number;
    cpu_usage: number;
    active_users: number;
    server_load: number;
  };
  services: Record<string, string>;
}

// ============ Agno Team 相关类型 ============

// Team消息类型
export interface TeamMessage extends Message {
  teamInfo: {
    isTeamMessage: boolean;
    teamId: string;
    teamName: string;
    teamMode: 'coordinate' | 'collaborate' | 'route';
    executionId: string;
    memberCalls: TeamMemberCall[];
    teamDecisions: TeamDecision[];  // Team决策过程
    structuredOutput?: TeamStructuredOutput;
    coordinationInfo?: TeamCoordinationInfo;
  };
}

// Team成员类型
export interface TeamMember {
  id: string;
  name: string;
  role: string;
  modelProvider: string;
  modelId: string;
  isActive: boolean;
  description?: string;
}

// Team执行步骤类型
export interface TeamExecutionStep {
  stepId: string;
  memberId: string;
  memberName: string;
  action: string;
  inputData: Record<string, any>;
  outputData: Record<string, any>;
  status: 'pending' | 'running' | 'completed' | 'error';
  startTime: number;
  endTime?: number;
  durationMs?: number;
  errorMessage?: string;
  metadata?: Record<string, any>;
}

// Team结构化输出类型
export interface TeamStructuredOutput {
  type: string;
  data: Record<string, any>;
  confidence: number;
  metadata?: Record<string, any>;
}

// Team协调信息类型
export interface TeamCoordinationInfo {
  coordinatorId: string;
  coordinationMode: string;
  sharedState: Record<string, any>;
  routingDecisions: Array<{
    stepId: string;
    memberId: string;
    reason: string;
    confidence: number;
  }>;
  performanceMetrics: {
    totalSteps: number;
    completedSteps: number;
    failedSteps: number;
    averageStepDuration: number;
    totalExecutionTime: number;
  };
}

// Team成员调用类型
export interface TeamMemberCall {
  memberId: string;
  memberName: string;
  role: string;
  action: string;
  input: Record<string, any>;
  output: Record<string, any>;
  status: 'pending' | 'running' | 'completed' | 'error';
  startTime: number;
  endTime?: number;
  durationMs?: number;
  errorMessage?: string;
  confidence?: number;
  metadata?: Record<string, any>;
}

// Team决策过程类型
export interface TeamDecision {
  type: 'decision' | 'coordination' | 'task_assignment' | 'result_synthesis' | 'quality_assessment' | 'strategy_selection';
  title: string;
  content: string;
  confidence: number;
  reasoning?: string;
  affected_agents?: string[];
  alternatives?: Array<{
    option: string;
    score: number;
    reasoning: string;
  }>;
  coordination_type?: 'task_assignment' | 'resource_allocation' | 'conflict_resolution' | 'priority_setting';
  agents_involved?: string[];
  strategy?: string;
  timestamp: number;
  metadata?: Record<string, any>;
}

// LangDB监控指标类型
export interface LangDBMetric {
  id: string;
  sessionId: string;
  metricType: string;
  metricName: string;
  metricValue: Record<string, any>;
  timestamp: number;
  metadata?: Record<string, any>;
}

// Team执行统计类型
export interface TeamExecutionStats {
  teamName: string;
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  avgDurationMs: number;
  lastExecutionTime: string;
}

// Team成员性能统计类型
export interface TeamMemberPerformance {
  memberId: string;
  memberName: string;
  totalSteps: number;
  successfulSteps: number;
  failedSteps: number;
  avgDurationMs: number;
  lastStepTime: string;
}

// ============ 知识库Collection管理类型 ============

// Collection基础类型
export interface KnowledgeCollection {
  id: string;
  name: string;
  description?: string;
  metadata_template: string;
  document_count: number;
  vectorized_count: number;
  status: 'active' | 'inactive' | 'archived';
  created_at: string;
  updated_at: string;
  created_by?: string;
  extra_metadata?: Record<string, any>;
  // QA提取相关字段
  auto_qa_extraction_enabled?: boolean;
  qa_extraction_status?: 'not_started' | 'pending' | 'processing' | 'completed' | 'failed';
  qa_extraction_task_id?: number;
  qa_dataset_id?: string;
  qa_extraction_config?: Record<string, any>;
  qa_extraction_started_at?: string;
  qa_extraction_completed_at?: string;
  qa_extraction_error_message?: string;
}

// Collection创建请求
export interface CollectionCreateRequest {
  name: string;
  description?: string;
  metadata_template: string;
  extra_metadata?: Record<string, any>;
}

// Collection更新请求
export interface CollectionUpdateRequest {
  name?: string;
  description?: string;
  status?: 'active' | 'inactive' | 'archived';
  extra_metadata?: Record<string, any>;
}

// Collection统计信息
export interface CollectionStatistics {
  collection_id: string;
  document_count: number;
  vectorized_count: number;
  total_size: number;
  avg_processing_time: number;
  last_activity: string;
  metadata_distribution: Record<string, number>;
  status_distribution: Record<string, number>;
}

// 元数据模版类型
export interface MetadataTemplate {
  id: string;
  name: string;
  type: string;
  description?: string;
  schema: Record<string, any>;
  extraction_config: Record<string, any>;
  is_system_default: boolean;
  status: string;
  created_at: string;
  updated_at: string;
}

// 元数据提取请求
export interface MetadataExtractionRequest {
  template_id: string;
  content: string;
  filename?: string;
  additional_context?: Record<string, any>;
}

// 元数据提取响应
export interface MetadataExtractionResponse {
  template_id: string;
  template_name: string;
  extracted_metadata: Record<string, any>;
  confidence_score?: number;
  extraction_time: number;
  validation_result: Record<string, any>;
}

// Collection检索结果
export interface CollectionSearchResult {
  results: any[];
  total_matches: number;
  strategy_used: string;
  collection_info: Record<string, any>;
  temporal_filters_applied: Record<string, any>;
  performance_metrics: Record<string, any>;
}

// 确保关键类型正确导出 - 移除重复导出，这些类型已在上面定义了
// export type { TeamDecision, TeamMemberCall, TeamMessage, TeamMember, TeamExecutionStep, TeamStructuredOutput, TeamCoordinationInfo }; 