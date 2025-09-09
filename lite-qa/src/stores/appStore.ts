/**
 * 应用全局状态管理 - 使用zustand
 */
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { 
  ResponsiveConfig, 
  AppConfig, 
  UserPreferences 
} from '../types';
import { APP_VERSION } from '../config/version';

// 导出配置类型供其他组件使用
export type { 
  StorageConfig, 
  DatabaseConfig, 
  ModelConfig, 
  VectorizationConfig, 
  AgentConfig 
};

// 存储配置类型
interface StorageConfig {
  type: 'minio' | 'local';
  minio: {
    enabled: boolean;
    endpoint: string;
    accessKey: string;
    secretKey: string;
    documentsBucket: string;
    mediaBucket: string;
    thumbnailsBucket: string;
    publicEndpoint: string;
    autoCreateBuckets: boolean;
  };
}

// 数据库配置类型
interface DatabaseConfig {
  postgresql: {
    host: string;
    port: number;
    database: string;
    username: string;
    password: string;
    maxConnections: number;
    connectionTimeout: number;
  };
  elasticsearch: {
    host: string;
    index: string;
    authType: 'userpass' | 'token';
    username: string;
    password: string;
    token: string;
  };
  // 移除 ArangoDB 配置
}

// 模型配置类型
interface ModelConfig {
  llm: {
    chatModel: string;
    temperature: number;
    maxTokens: number;
    chatEndpoint: string;
    chatApiKey: string;
    enableStreaming: boolean;
  };
  embedding: {
    generalModel: string;
    generalEndpoint: string;
    generalApiKey: string;
    domainModel: string;
    domainEndpoint: string;
    domainApiKey: string;
    generalDimension: number;
    domainDimension: number;
  };
}

// 向量化配置类型
interface VectorizationConfig {
  enableDualVector: boolean;
  retrievalMode: 'general' | 'domain' | 'dual';
  vectorSearch: {
    topK: number;
    threshold: number;
  };
  keywordSearch: {
    limit: number;
    fuzzyMatch: boolean;
  };
  hybridSearch: {
    vectorWeight: number;
    keywordWeight: number;
    enableRerank: boolean;
  };
  rerank: {
    topK: number;
    threshold: number;
  };
}

// 智能体配置类型
interface AgentConfig {
  enableKnowledgeGraph: boolean;
  extractionMode: 'auto' | 'manual';
  extractionConfig: {
    minConfidence: number;
    batchSize: number;
    maxConcurrency: number;
    retryAttempts: number;
    timeoutMs: number;
  };
}

interface AppState {
  // 应用配置
  config: AppConfig;
  
  // 用户偏好设置
  preferences: UserPreferences;
  
  // 响应式配置
  responsive: ResponsiveConfig;
  
  // 存储配置
  storageConfig: StorageConfig;
  
  // 数据库配置
  databaseConfig: DatabaseConfig;
  
  // 模型配置
  modelConfig: ModelConfig;
  
  // 向量化配置
  vectorizationConfig: VectorizationConfig;
  
  // 智能体配置
  agentConfig: AgentConfig;
  
  // 存储服务状态
  storageStatus: 'checking' | 'healthy' | 'error' | null;
  
  // 路由相关
  currentRoute: string;
  
  // 全局加载状态
  globalLoading: boolean;
  
  // 通知消息
  notifications: Array<{
    id: string;
    type: 'success' | 'error' | 'warning' | 'info';
    message: string;
    duration?: number;
  }>;
  
  // Actions
  setConfig: (config: Partial<AppConfig>) => void;
  setPreferences: (preferences: Partial<UserPreferences>) => void;
  setResponsive: (responsive: Partial<ResponsiveConfig>) => void;
  setCurrentRoute: (route: string) => void;
  setGlobalLoading: (loading: boolean) => void;
  
  // 存储配置相关
  setStorageConfig: (config: Partial<StorageConfig>) => void;
  setStorageStatus: (status: AppState['storageStatus']) => void;
  checkStorageHealth: () => Promise<void>;
  
  // 数据库配置相关
  setDatabaseConfig: (config: Partial<DatabaseConfig>) => void;
  
  // 模型配置相关
  setModelConfig: (config: Partial<ModelConfig>) => void;
  
  // 向量化配置相关
  setVectorizationConfig: (config: Partial<VectorizationConfig>) => void;
  
  // 智能体配置相关
  setAgentConfig: (config: Partial<AgentConfig>) => void;
  
  addNotification: (notification: Omit<AppState['notifications'][0], 'id'>) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
  
  // 主题切换
  toggleTheme: () => void;
  
  // 语言切换
  toggleLanguage: () => void;
  
  // 响应式更新
  updateResponsive: () => void;
}

// 默认配置
const defaultConfig: AppConfig = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000',
  version: APP_VERSION.version,
  environment: import.meta.env.MODE as 'development' | 'production',
  features: {
    qa: true,
    knowledge: true,
    graph: true,
  },
};

const defaultPreferences: UserPreferences = {
  theme: 'light',
  language: 'zh',
  fontSize: 'medium',
  autoSave: true,
  showSources: true,
  showConfidence: true,
};

const defaultStorageConfig: StorageConfig = {
  type: 'minio',
  minio: {
    enabled: true,
    endpoint: 'localhost:9000',
    accessKey: 'minioadmin',
    secretKey: '',
    documentsBucket: 'mat-qa-documents',
    mediaBucket: 'mat-qa-media',
    thumbnailsBucket: 'mat-qa-thumbnails',
    publicEndpoint: 'http://localhost:9000',
    autoCreateBuckets: true
  }
};

// 从环境变量获取数据库配置，避免硬编码
const getDefaultDatabaseConfig = (): DatabaseConfig => {
  // 从API获取实际配置，这里提供默认值作为备用
  return {
    postgresql: {
      host: import.meta.env.VITE_POSTGRES_HOST || 'localhost',
      port: parseInt(import.meta.env.VITE_POSTGRES_PORT || '5432'),
      database: import.meta.env.VITE_POSTGRES_DATABASE || 'mat_demo',
      username: import.meta.env.VITE_POSTGRES_USERNAME || 'mat_demo',
      password: '', // 敏感信息不在前端存储
      maxConnections: 20,
      connectionTimeout: 30
    },
    elasticsearch: {
      host: import.meta.env.VITE_ELASTICSEARCH_URL || 'http://localhost:9200',
      index: 'mat_qa',
      authType: 'userpass' as const,
      username: 'elastic',
      password: '', // 敏感信息不在前端存储
      token: ''
    }
    // 移除 ArangoDB 配置
  };
};

const defaultDatabaseConfig = getDefaultDatabaseConfig();

const defaultModelConfig: ModelConfig = {
  llm: {
    chatModel: 'qwen3-235b-a22b-instruct-2507',
    temperature: 0.7,
    maxTokens: 32768,
    chatEndpoint: import.meta.env.VITE_LLM_API_ENDPOINT || 'http://localhost:8000/v1',
    chatApiKey: import.meta.env.VITE_LLM_API_KEY || '',
    enableStreaming: true
  },
  embedding: {
    generalModel: import.meta.env.VITE_EMBEDDING_MODEL || 'Qwen/Qwen3-Embedding-4B',
    generalEndpoint: import.meta.env.VITE_EMBEDDING_API_ENDPOINT || 'http://localhost:8000/v1',
    generalApiKey: import.meta.env.VITE_EMBEDDING_API_KEY || '',
    generalDimension: 2048
  }
};

const defaultVectorizationConfig: VectorizationConfig = {
  enableDualVector: false,
  retrievalMode: 'vector',
  vectorSearch: {
    topK: 10,
    threshold: 0.7
  },
  keywordSearch: {
    limit: 20,
    fuzzyMatch: true
  },
  hybridSearch: {
    vectorWeight: 0.7,
    keywordWeight: 0.3,
    enableRerank: true
  },
  rerank: {
    topK: 10,
    threshold: 0.5
  }
};

const defaultAgentConfig: AgentConfig = {
  enableKnowledgeGraph: false,
  extractionMode: 'auto',
  extractionConfig: {
    minConfidence: 0.7,
    batchSize: 10,
    maxConcurrency: 3,
    retryAttempts: 2,
    timeoutMs: 30000
  }
};

const getResponsiveConfig = (): ResponsiveConfig => {
  const width = window.innerWidth;
  const height = window.innerHeight;
  
  return {
    isMobile: width < 768,
    isTablet: width >= 768 && width < 1200,
    isDesktop: width >= 1200,
    windowWidth: width,
    windowHeight: height,
  };
};

export const useAppStore = create<AppState>()(
  devtools(
    persist(
      (set, get) => ({
        // 初始状态
        config: defaultConfig,
        preferences: defaultPreferences,
        responsive: getResponsiveConfig(),
        storageConfig: defaultStorageConfig,
        databaseConfig: defaultDatabaseConfig,
        modelConfig: defaultModelConfig,
        vectorizationConfig: defaultVectorizationConfig,
        agentConfig: defaultAgentConfig,
        storageStatus: null,
        currentRoute: '/',
        globalLoading: false,
        notifications: [],

        // 基础状态设置
        setConfig: (config) => set((state) => ({
          config: { ...state.config, ...config }
        })),
        
        setPreferences: (preferences) => set((state) => ({
          preferences: { ...state.preferences, ...preferences }
        })),
        
        setResponsive: (responsive) => set((state) => ({
          responsive: { ...state.responsive, ...responsive }
        })),
        
        setCurrentRoute: (route) => set({ currentRoute: route }),
        
        setGlobalLoading: (loading) => set({ globalLoading: loading }),

        // 存储配置管理
        setStorageConfig: (config) => set((state) => ({
          storageConfig: { ...state.storageConfig, ...config }
        })),
        
        setStorageStatus: (status) => set({ storageStatus: status }),
        
        // 数据库配置管理
        setDatabaseConfig: (config) => set((state) => ({
          databaseConfig: { ...state.databaseConfig, ...config }
        })),
        
        // 模型配置管理
        setModelConfig: (config) => set((state) => ({
          modelConfig: { ...state.modelConfig, ...config }
        })),
        
        // 向量化配置管理
        setVectorizationConfig: (config) => set((state) => ({
          vectorizationConfig: { ...state.vectorizationConfig, ...config }
        })),
        
        // 智能体配置管理
        setAgentConfig: (config) => set((state) => ({
          agentConfig: { ...state.agentConfig, ...config }
        })),
        
        checkStorageHealth: async () => {
          set({ storageStatus: 'checking' });
          try {
            const response = await fetch('/api/v1/storage/health');
            const data = await response.json();
            
            if (response.ok && data.status === 'healthy') {
              set({ storageStatus: 'healthy' });
              get().addNotification({
                type: 'success',
                message: `存储服务正常 (${data.storage_type})`
              });
            } else {
              set({ storageStatus: 'error' });
              get().addNotification({
                type: 'error',
                message: '存储服务异常'
              });
            }
          } catch (error) {
            set({ storageStatus: 'error' });
            get().addNotification({
              type: 'error',
              message: '无法连接到存储服务'
            });
          }
        },

        // 通知管理
        addNotification: (notification) => set((state) => ({
          notifications: [
            ...state.notifications,
            {
              ...notification,
              id: `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
            }
          ]
        })),
        
        removeNotification: (id) => set((state) => ({
          notifications: state.notifications.filter(n => n.id !== id)
        })),
        
        clearNotifications: () => set({ notifications: [] }),

        // 主题切换
        toggleTheme: () => set((state) => {
          const newTheme = state.preferences.theme === 'light' ? 'dark' : 'light';
          
          // 更新DOM类名以应用主题
          document.documentElement.classList.toggle('dark', newTheme === 'dark');
          
          return {
            preferences: {
              ...state.preferences,
              theme: newTheme
            }
          };
        }),

        // 语言切换
        toggleLanguage: () => set((state) => ({
          preferences: {
            ...state.preferences,
            language: state.preferences.language === 'zh' ? 'en' : 'zh'
          }
        })),

        // 响应式更新
        updateResponsive: () => {
          const newResponsive = getResponsiveConfig();
          set({ responsive: newResponsive });
        },
      }),
      {
        name: 'app-store',
        partialize: (state) => ({
          preferences: state.preferences,
          config: state.config,
          storageConfig: state.storageConfig,
        }),
      }
    ),
    { name: 'app-store' }
  )
);

// 监听窗口大小变化
if (typeof window !== 'undefined') {
  window.addEventListener('resize', () => {
    useAppStore.getState().updateResponsive();
  });
  
  // 初始化主题
  const initialTheme = useAppStore.getState().preferences.theme;
  document.documentElement.classList.toggle('dark', initialTheme === 'dark');
} 