/**
 * PM2配置文件 - 后端服务管理
 * 地聚物材料智能问答系统 - Python FastAPI 后端
 */

const path = require('path');
const os = require('os');

// 获取环境变量或默认值
function getConfig(key, defaultValue) {
  return process.env[key] || defaultValue;
}

// 基础配置
const baseConfig = {
  // 应用名称前缀
  name_prefix: 'mat-backend',
  
  // 工作目录
  cwd: __dirname,
  
  // Python解释器路径
  interpreter: getConfig('PYTHON_INTERPRETER', 'python'),
  
  // 应用入口
  script: 'main.py',
  
  // 实例数量
  instances: getConfig('PM2_INSTANCES', 1),
  
  // 执行模式
  exec_mode: 'fork',
  
  // 监听文件变化（开发环境）
  watch: false,
  
  // 最大内存重启
  max_memory_restart: getConfig('PM2_MAX_MEMORY', '1G'),
  
  // 最大重启次数
  max_restarts: parseInt(getConfig('PM2_MAX_RESTARTS', '10')),
  
  // 最小运行时间
  min_uptime: getConfig('PM2_MIN_UPTIME', '10s'),
  
  // 自动重启
  autorestart: true,
  
  // 忽略的文件模式
  ignore_watch: [
    'node_modules',
    '.git',
    '*.log',
    'logs',
    'uploads',
    '__pycache__',
    '.pytest_cache',
    '.venv',
    'venv'
  ],
  
  // 合并日志
  merge_logs: true,
  
  // 日志格式
  log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
  
  // 错误文件
  error_file: path.join(__dirname, 'logs', 'pm2-error.log'),
  
  // 输出文件
  out_file: path.join(__dirname, 'logs', 'pm2-out.log'),
  
  // 合并输出
  combine_logs: true,
  
  // 时间戳
  time: true
};

// 环境特定配置
const environments = {
  development: {
    // 开发环境变量
    env: {
      NODE_ENV: 'development',
      PYTHON_ENV: 'development',
      MAT_QA_ENV: 'development',
      
      // 服务器配置
      HOST: getConfig('HOST', '127.0.0.1'),
      PORT: getConfig('PORT', '8000'),
      
      // 调试配置
      DEBUG: getConfig('DEBUG', 'true'),
      LOG_LEVEL: getConfig('LOG_LEVEL', 'INFO'),
      
      // 数据库配置
      DATABASE_URL: getConfig('DATABASE_URL', 'postgresql://postgres:password@localhost:5432/mat_qa'),
      ELASTICSEARCH_HOSTS: getConfig('ELASTICSEARCH_HOSTS', 'http://localhost:9200'),
      ARANGODB_URL: getConfig('ARANGODB_URL', 'http://localhost:8529'),
      REDIS_URL: getConfig('REDIS_URL', 'redis://localhost:6379'),
      
      // MinIO配置
      MINIO_ENDPOINT: getConfig('MINIO_ENDPOINT', 'localhost:9000'),
      MINIO_ACCESS_KEY: getConfig('MINIO_ACCESS_KEY', 'minioadmin'),
      MINIO_SECRET_KEY: getConfig('MINIO_SECRET_KEY', 'minioadmin'),
      MINIO_SECURE: getConfig('MINIO_SECURE', 'false'),
      
      // 队列配置
      QUEUE_MAX_CONCURRENT_TASKS: getConfig('QUEUE_MAX_CONCURRENT_TASKS', '2'),
      LARGE_FILE_MAX_CONCURRENT_TASKS: getConfig('LARGE_FILE_MAX_CONCURRENT_TASKS', '1'),
      LARGE_FILE_THRESHOLD: getConfig('LARGE_FILE_THRESHOLD', '2097152'),
      
      // API配置
      ONE_API_BASE_URL: getConfig('ONE_API_BASE_URL', 'http://localhost:3000'),
      ONE_API_KEY: getConfig('ONE_API_KEY', 'sk-'),
      
      // 功能开关
      ENABLE_GRAPH_VISUALIZATION: getConfig('ENABLE_GRAPH_VISUALIZATION', 'true'),
      ENABLE_DUAL_VECTOR_SEARCH: getConfig('ENABLE_DUAL_VECTOR_SEARCH', 'true'),
      ENABLE_MATBERT_EMBEDDING: getConfig('ENABLE_MATBERT_EMBEDDING', 'true'),
      
      // 性能配置
      UVICORN_WORKERS: getConfig('UVICORN_WORKERS', '1'),
      UVICORN_WORKER_CONNECTIONS: getConfig('UVICORN_WORKER_CONNECTIONS', '1000'),
      
      // 安全配置
      CORS_ORIGINS: getConfig('CORS_ORIGINS', 'http://localhost:3000,http://127.0.0.1:3000'),
      
      // 监控配置
      ENABLE_METRICS: getConfig('ENABLE_METRICS', 'true'),
      METRICS_PORT: getConfig('METRICS_PORT', '8001')
    }
  },
  
  production: {
    // 生产环境变量
    env: {
      NODE_ENV: 'production',
      PYTHON_ENV: 'production',
      MAT_QA_ENV: 'production',
      
      // 服务器配置
      HOST: getConfig('PROD_HOST', '0.0.0.0'),
      PORT: getConfig('PROD_PORT', '8000'),
      
      // 调试配置（生产环境关闭详细调试）
      DEBUG: getConfig('PROD_DEBUG', 'false'),
      LOG_LEVEL: getConfig('PROD_LOG_LEVEL', 'WARNING'),
      
      // 数据库配置（生产环境需要外部配置）
      DATABASE_URL: getConfig('PROD_DATABASE_URL'),
      ELASTICSEARCH_HOSTS: getConfig('PROD_ELASTICSEARCH_HOSTS'),
      ARANGODB_URL: getConfig('PROD_ARANGODB_URL'),
      REDIS_URL: getConfig('PROD_REDIS_URL'),
      
      // MinIO配置（生产环境）
      MINIO_ENDPOINT: getConfig('PROD_MINIO_ENDPOINT'),
      MINIO_ACCESS_KEY: getConfig('PROD_MINIO_ACCESS_KEY'),
      MINIO_SECRET_KEY: getConfig('PROD_MINIO_SECRET_KEY'),
      MINIO_SECURE: getConfig('PROD_MINIO_SECURE', 'true'),
      
      // 队列配置（生产环境增加并发）
      QUEUE_MAX_CONCURRENT_TASKS: getConfig('PROD_QUEUE_MAX_CONCURRENT_TASKS', '4'),
      LARGE_FILE_MAX_CONCURRENT_TASKS: getConfig('PROD_LARGE_FILE_MAX_CONCURRENT_TASKS', '2'),
      LARGE_FILE_THRESHOLD: getConfig('PROD_LARGE_FILE_THRESHOLD', '5242880'),
      
      // API配置（生产环境）
      ONE_API_BASE_URL: getConfig('PROD_ONE_API_BASE_URL'),
      ONE_API_KEY: getConfig('PROD_ONE_API_KEY'),
      
      // 功能开关
      ENABLE_GRAPH_VISUALIZATION: getConfig('PROD_ENABLE_GRAPH_VISUALIZATION', 'true'),
      ENABLE_DUAL_VECTOR_SEARCH: getConfig('PROD_ENABLE_DUAL_VECTOR_SEARCH', 'true'),
      ENABLE_MATBERT_EMBEDDING: getConfig('PROD_ENABLE_MATBERT_EMBEDDING', 'true'),
      
      // 性能配置（生产环境多进程）
      UVICORN_WORKERS: getConfig('PROD_UVICORN_WORKERS', Math.max(2, os.cpus().length).toString()),
      UVICORN_WORKER_CONNECTIONS: getConfig('PROD_UVICORN_WORKER_CONNECTIONS', '1000'),
      
      // 安全配置（生产环境限制CORS）
      CORS_ORIGINS: getConfig('PROD_CORS_ORIGINS'),
      
      // 监控配置
      ENABLE_METRICS: getConfig('PROD_ENABLE_METRICS', 'true'),
      METRICS_PORT: getConfig('PROD_METRICS_PORT', '8001')
    }
  }
};

module.exports = {
  apps: [
    {
      ...baseConfig,
      name: `${baseConfig.name_prefix}-dev`,
      ...environments.development,
      
      // 开发环境特定配置
      watch: getConfig('PM2_WATCH', 'false') === 'true',
      watch_delay: 1000,
      
      // 开发环境日志
      error_file: path.join(__dirname, 'logs', 'pm2-dev-error.log'),
      out_file: path.join(__dirname, 'logs', 'pm2-dev-out.log'),
      
      // 开发环境进程数
      instances: 1,
      exec_mode: 'fork'
    },
    
    {
      ...baseConfig,
      name: `${baseConfig.name_prefix}-prod`,
      ...environments.production,
      
      // 生产环境特定配置
      watch: false,
      
      // 生产环境日志
      error_file: path.join(__dirname, 'logs', 'pm2-prod-error.log'),
      out_file: path.join(__dirname, 'logs', 'pm2-prod-out.log'),
      
      // 生产环境进程数（可以是多个）
      instances: parseInt(getConfig('PROD_PM2_INSTANCES', Math.max(1, Math.floor(os.cpus().length / 2)).toString())),
      exec_mode: getConfig('PROD_PM2_EXEC_MODE', 'fork'),
      
      // 生产环境更严格的重启策略
      max_memory_restart: getConfig('PROD_PM2_MAX_MEMORY', '2G'),
      max_restarts: parseInt(getConfig('PROD_PM2_MAX_RESTARTS', '5')),
      min_uptime: getConfig('PROD_PM2_MIN_UPTIME', '30s'),
      
      // 生产环境健康检查
      health_check_grace_period: parseInt(getConfig('PROD_HEALTH_CHECK_GRACE_PERIOD', '3000')),
      health_check_fatal_exceptions: getConfig('PROD_HEALTH_CHECK_FATAL_EXCEPTIONS', 'true') === 'true'
    }
  ]
};