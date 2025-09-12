/**
 * 前端应用配置管理
 * 统一管理所有环境变量和配置，支持配置注入
 */

// 环境变量获取工具函数
const getEnvValue = (key: string, defaultValue: string = ''): string => {
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    return import.meta.env[key] || defaultValue;
  }
  return defaultValue;
};

const getEnvNumber = (key: string, defaultValue: number): number => {
  const value = getEnvValue(key);
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? defaultValue : parsed;
};

const getEnvBoolean = (key: string, defaultValue: boolean): boolean => {
  const value = getEnvValue(key);
  if (value === '') return defaultValue;
  return value === 'true' || value === '1';
};

const getEnvArray = (key: string, defaultValue: string[] = []): string[] => {
  const value = getEnvValue(key);
  return value ? value.split(',').map(item => item.trim()) : defaultValue;
};

// 应用配置
export const APP_CONFIG = {
  // 应用基本信息
  app: {
    name: getEnvValue('VITE_APP_NAME', '地聚物材料智能问答系统'),
    version: getEnvValue('VITE_APP_VERSION', '1.2.0'),
    description: getEnvValue('VITE_APP_DESCRIPTION', '基于大模型的材料科学智能问答平台'),
    author: getEnvValue('VITE_APP_AUTHOR', 'GAC Team'),
  },

  // API 配置
  api: {
    baseURL: getEnvValue('VITE_API_BASE_URL', 'http://localhost:8000'),
    version: getEnvValue('VITE_API_VERSION', 'v1'),
    timeout: getEnvNumber('VITE_API_TIMEOUT', 30000),
  },

  // WebSocket 和 SSE 配置
  websocket: {
    url: getEnvValue('VITE_WS_URL', 'ws://localhost:8000'),
    reconnectInterval: getEnvNumber('VITE_SSE_RECONNECT_INTERVAL', 3000),
    maxReconnectAttempts: getEnvNumber('VITE_SSE_MAX_RECONNECT_ATTEMPTS', 10),
  },

  sse: {
    url: getEnvValue('VITE_SSE_URL', 'http://localhost:8000'),
    reconnectInterval: getEnvNumber('VITE_SSE_RECONNECT_INTERVAL', 3000),
    maxReconnectAttempts: getEnvNumber('VITE_SSE_MAX_RECONNECT_ATTEMPTS', 10),
  },

  // 开发服务器配置
  dev: {
    port: getEnvNumber('VITE_DEV_PORT', 3000),
    host: getEnvValue('VITE_DEV_HOST', 'localhost'),
    open: getEnvBoolean('VITE_DEV_OPEN', true),
  },

  // 生产环境配置
  prod: {
    port: getEnvNumber('VITE_PROD_PORT', 4173),
    host: getEnvValue('VITE_PROD_HOST', '0.0.0.0'),
  },

  // CORS 配置
  cors: {
    origins: getEnvArray('VITE_CORS_ORIGINS', ['http://localhost:3000', 'http://127.0.0.1:3000']),
    credentials: getEnvBoolean('VITE_CORS_CREDENTIALS', true),
  },

  // 文件上传配置
  upload: {
    maxFileSize: getEnvNumber('VITE_MAX_FILE_SIZE', 50485760), // 50MB
    allowedTypes: getEnvArray('VITE_ALLOWED_FILE_TYPES', ['.pdf', '.docx', '.txt', '.md', '.xlsx', '.xls']),
    timeout: getEnvNumber('VITE_UPLOAD_TIMEOUT', 300000), // 5分钟
  },

  // 缓存配置
  cache: {
    version: getEnvValue('VITE_CACHE_VERSION', '1.2.0'),
    enableServiceWorker: getEnvBoolean('VITE_ENABLE_SERVICE_WORKER', false),
  },

  // 调试和监控配置
  debug: {
    enabled: getEnvBoolean('VITE_ENABLE_DEBUG', true),
    logLevel: getEnvValue('VITE_LOG_LEVEL', 'info'),
    performanceMonitoring: getEnvBoolean('VITE_PERFORMANCE_MONITORING', true),
  },

  // 第三方服务配置
  services: {
    sentryDsn: getEnvValue('VITE_SENTRY_DSN'),
    analyticsId: getEnvValue('VITE_ANALYTICS_ID'),
  },

  // 主题和UI配置
  ui: {
    defaultTheme: getEnvValue('VITE_DEFAULT_THEME', 'light'),
    enableDarkMode: getEnvBoolean('VITE_ENABLE_DARK_MODE', true),
    primaryColor: getEnvValue('VITE_PRIMARY_COLOR', '#1890ff'),
    locale: getEnvValue('VITE_ANTD_LOCALE', 'zh_CN'),
  },

  // 安全配置
  security: {
    enableCSP: getEnvBoolean('VITE_ENABLE_CSP', false),
    trustedDomains: getEnvArray('VITE_TRUSTED_DOMAINS', ['localhost', '127.0.0.1']),
  },

  // 功能开关
  features: {
    enableGraphView: getEnvBoolean('VITE_ENABLE_GRAPH_VIEW', true),
    enableDualVector: getEnvBoolean('VITE_ENABLE_DUAL_VECTOR', true),
    enableTranslation: getEnvBoolean('VITE_ENABLE_TRANSLATION', true),
    enableVoiceInput: getEnvBoolean('VITE_ENABLE_VOICE_INPUT', false),
    enableExport: getEnvBoolean('VITE_ENABLE_EXPORT', true),
  },

  // 知识图谱配置
  matgraph: {
    host: getEnvValue('VITE_MATGRAPH_HOST', '127.0.0.1'),
    port: getEnvNumber('VITE_MATGRAPH_PORT', 9622),
    baseUrl: getEnvValue('VITE_MATGRAPH_BASE_URL', 
      // 在开发环境使用代理路径，生产环境使用直接URL
      import.meta.env?.MODE === 'development' ? '/matgraph' : 'http://127.0.0.1:9622'
    ),
  },
} as const;

// 导出类型
export type AppConfig = typeof APP_CONFIG;

// 获取当前环境
export const getCurrentEnv = (): 'development' | 'production' | 'test' => {
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    return import.meta.env.MODE as 'development' | 'production' | 'test';
  }
  return 'development';
};

// 判断是否为开发环境
export const isDevelopment = (): boolean => {
  return getCurrentEnv() === 'development';
};

// 判断是否为生产环境
export const isProduction = (): boolean => {
  return getCurrentEnv() === 'production';
};

// 获取API基础URL（不包含path）
export const getApiBaseUrl = (): string => {
  const baseURL = APP_CONFIG.api.baseURL;
  console.log('🔗 原始 API Base URL:', baseURL);
  
  // 确保 baseURL 不包含 /api/v1，避免重复
  const cleanBaseURL = baseURL.replace(/\/api\/v1$/, '');
  const result = `${cleanBaseURL}/api/${APP_CONFIG.api.version}`;
  
  console.log('🔗 最终 API Base URL:', result);
  return result;
};

// 获取完整的API URL
export const getApiUrl = (path: string = ''): string => {
  const baseUrl = getApiBaseUrl();
  
  if (!path) {
    console.log('🔗 无path，返回 base URL:', baseUrl);
    return baseUrl;
  }
  
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  let finalUrl = `${baseUrl}/${cleanPath}`;
  
  // 正确处理URL清理，避免破坏协议部分
  if (finalUrl.includes('://')) {
    const [protocol, rest] = finalUrl.split('://');
    finalUrl = protocol + '://' + rest.replace(/\/+/g, '/');
  } else {
    finalUrl = finalUrl.replace(/\/+/g, '/');
  }
  
  console.log('🔗 生成 API URL:', {
    baseUrl,
    path,
    cleanPath,
    finalUrl
  });
  
  return finalUrl;
};

// 获取 WebSocket URL
export const getWebSocketUrl = (path: string = ''): string => {
  const baseUrl = APP_CONFIG.websocket.url;
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  let finalUrl = `${baseUrl}/${cleanPath}`;
  
  // 正确处理URL清理
  if (finalUrl.includes('://')) {
    const [protocol, rest] = finalUrl.split('://');
    finalUrl = protocol + '://' + rest.replace(/\/+/g, '/');
  } else {
    finalUrl = finalUrl.replace(/\/+/g, '/');
  }
  
  return finalUrl;
};

// 获取 SSE URL
export const getSSEUrl = (path: string = ''): string => {
  const baseUrl = APP_CONFIG.sse.url;
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  let finalUrl = `${baseUrl}/${cleanPath}`;
  
  // 正确处理URL清理
  if (finalUrl.includes('://')) {
    const [protocol, rest] = finalUrl.split('://');
    finalUrl = protocol + '://' + rest.replace(/\/+/g, '/');
  } else {
    finalUrl = finalUrl.replace(/\/+/g, '/');
  }
  
  return finalUrl;
};

// 获取知识图谱 URL
export const getMatGraphUrl = (path: string = ''): string => {
  const baseUrl = APP_CONFIG.matgraph.baseUrl;
  console.log('🔗 知识图谱 Base URL:', baseUrl);
  
  if (!path) {
    return baseUrl;
  }
  
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  let finalUrl = `${baseUrl}/${cleanPath}`;
  
  // 正确处理URL清理，避免破坏协议部分
  // 先保护协议部分，然后清理多余斜杠，最后恢复协议部分
  if (finalUrl.includes('://')) {
    const [protocol, rest] = finalUrl.split('://');
    finalUrl = protocol + '://' + rest.replace(/\/+/g, '/');
  } else {
    // 对于相对路径，直接清理多余斜杠
    finalUrl = finalUrl.replace(/\/+/g, '/');
  }
  
  console.log('🔗 生成知识图谱 URL:', {
    baseUrl,
    path,
    cleanPath,
    finalUrl
  });
  
  return finalUrl;
};

// 获取知识图谱健康检查 URL
export const getMatGraphHealthUrl = (): string => {
  return getMatGraphUrl('/health');
};

// 获取知识图谱 WebUI URL
export const getMatGraphWebUIUrl = (params?: Record<string, string | number>): string => {
  let url = getMatGraphUrl('/webui/');
  
  if (params && Object.keys(params).length > 0) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      searchParams.append(key, String(value));
    });
    url += `?${searchParams.toString()}`;
  }
  
  return url;
};

// 默认导出配置
export default APP_CONFIG;