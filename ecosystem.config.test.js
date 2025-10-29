/**
 * PM2配置文件 - 测试服务器环境
 * NextAgentLite 测试服务器部署配置
 */

const path = require('path');
const fs = require('fs');

// 检查目录是否存在
function directoryExists(dirPath) {
  try {
    return fs.statSync(dirPath).isDirectory();
  } catch (err) {
    return false;
  }
}

// ===== 测试服务器配置 =====
const rootDir = __dirname;
const frontendDir = path.join(rootDir, 'lite-qa');
const backendDir = path.join(rootDir, 'lite-backend');

// 测试服务器 Conda 环境路径
const CONDA_BASE = '/root/anaconda3';
const condaPython = `${CONDA_BASE}/envs/zzdsj-lite/bin/python`;
const condaNpm = `${CONDA_BASE}/envs/zzdsj-qa/bin/npm`;

// 检查目录
const frontendExists = directoryExists(frontendDir);
const backendExists = directoryExists(backendDir);

// 应用配置数组
const apps = [];

// ===== 前端应用配置 =====
if (frontendExists) {
  const frontendEnvFile = path.join(frontendDir, '.env.production');
  const frontendEnvConfig = {};

  if (fs.existsSync(frontendEnvFile)) {
    const envContent = fs.readFileSync(frontendEnvFile, 'utf8');
    envContent.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
        const [key, ...valueParts] = trimmed.split('=');
        const value = valueParts.join('=');
        if (key.startsWith('VITE_')) {
          frontendEnvConfig[key] = value;
        }
      }
    });
  }

  apps.push({
    name: 'frontend',
    cwd: frontendDir,
    script: condaNpm,
    args: ['run', 'dev'],
    env: {
      NODE_ENV: 'production',
      PORT: '3000',
      PATH: `${CONDA_BASE}/envs/zzdsj-qa/bin:${process.env.PATH}`,
      ...frontendEnvConfig
    },
    error_file: path.join(frontendDir, 'logs', 'pm2-error.log'),
    out_file: path.join(frontendDir, 'logs', 'pm2-out.log'),
    instances: 1,
    exec_mode: 'fork',
    watch: false,
    ignore_watch: ['node_modules', '.git', 'dist', 'build'],
    autorestart: true,
    max_restarts: 10,
    min_uptime: '10s',
    max_memory_restart: '1G',
    merge_logs: true,
    time: true,
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
  });
}

// ===== 后端应用配置 =====
if (backendExists) {
  const backendEnvFile = path.join(backendDir, '.env');
  const backendEnvConfig = {};

  if (fs.existsSync(backendEnvFile)) {
    const envContent = fs.readFileSync(backendEnvFile, 'utf8');
    envContent.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
        const [key, ...valueParts] = trimmed.split('=');
        const value = valueParts.join('=').replace(/^["']|["']$/g, '');
        backendEnvConfig[key] = value;
      }
    });
  }

  apps.push({
    name: 'backend',
    cwd: backendDir,
    script: 'main.py',
    interpreter: condaPython,
    env: {
      NODE_ENV: 'production',
      MAT_QA_ENV: 'production',
      PATH: `${CONDA_BASE}/envs/zzdsj-lite/bin:${process.env.PATH}`,
      ...backendEnvConfig
    },
    error_file: path.join(backendDir, 'logs', 'pm2-error.log'),
    out_file: path.join(backendDir, 'logs', 'pm2-out.log'),
    instances: 1,
    exec_mode: 'fork',
    watch: false,
    ignore_watch: [
      'node_modules', '.git', '*.log', 'logs', 'uploads',
      '__pycache__', '.pytest_cache', '.venv', 'venv'
    ],
    autorestart: true,
    max_restarts: 10,
    min_uptime: '10s',
    max_memory_restart: '2G',
    merge_logs: true,
    time: true,
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
  });
}

// ===== DataGraph知识图谱服务配置 =====
if (backendExists) {
  const dataGraphDir = path.join(backendDir, 'DataGraph');
  const dataGraphDataDir = path.join(dataGraphDir, 'rag_storage_test');
  const backendEnvFile = path.join(backendDir, '.env');
  const dataGraphEnv = {
    WORKING_DIR: dataGraphDataDir,
    PORT: '9622',
    LLM_BINDING: 'openai',
    EMBEDDING_BINDING: 'openai',
    PYTHONUNBUFFERED: '1',
    PYTHONFAULTHANDLER: '1',
    PATH: `${CONDA_BASE}/envs/zzdsj-lite/bin:${process.env.PATH}`,
    NPY_ACCELERATE_CHECK_DISABLE: '1',
    NPY_DISABLE_MACOS_ACCELERATE: '1',
    VECLIB_MAXIMUM_THREADS: '1',
    OPENBLAS_NUM_THREADS: '1'
  };

  if (fs.existsSync(backendEnvFile)) {
    const envContent = fs.readFileSync(backendEnvFile, 'utf8');
    envContent.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
        const [key, ...valueParts] = trimmed.split('=');
        const value = valueParts.join('=').replace(/^["']|["']$/g, '');
        if (key.includes('ONE_API') || key.includes('DATAGRAPH') || key.includes('OPENAI')) {
          dataGraphEnv[key] = value;
        }
      }
    });

    if (dataGraphEnv.ONE_API_KEY) {
      dataGraphEnv.OPENAI_API_KEY = dataGraphEnv.ONE_API_KEY;
      dataGraphEnv.LLM_BINDING_API_KEY = dataGraphEnv.ONE_API_KEY;
      dataGraphEnv.EMBEDDING_BINDING_API_KEY = dataGraphEnv.ONE_API_KEY;
    }
    if (dataGraphEnv.ONE_API_BASE_URL) {
      dataGraphEnv.OPENAI_BASE_URL = dataGraphEnv.ONE_API_BASE_URL;
      dataGraphEnv.LLM_BINDING_HOST = dataGraphEnv.ONE_API_BASE_URL;
      dataGraphEnv.EMBEDDING_BINDING_HOST = dataGraphEnv.ONE_API_BASE_URL;
    }
    if (dataGraphEnv.DATAGRAPH_LLM_MODEL) {
      dataGraphEnv.LLM_MODEL = dataGraphEnv.DATAGRAPH_LLM_MODEL;
    }
    if (dataGraphEnv.DATAGRAPH_EMBEDDING_MODEL) {
      dataGraphEnv.EMBEDDING_MODEL = dataGraphEnv.DATAGRAPH_EMBEDDING_MODEL;
    }
    if (dataGraphEnv.DATAGRAPH_EMBEDDING_DIM) {
      dataGraphEnv.EMBEDDING_DIM = dataGraphEnv.DATAGRAPH_EMBEDDING_DIM;
    }
  }

  apps.push({
    name: 'datagraph',
    cwd: backendDir,
    script: 'start_datagraph.sh',
    interpreter: 'bash',
    env: dataGraphEnv,
    error_file: path.join(rootDir, 'logs', 'datagraph-error.log'),
    out_file: path.join(rootDir, 'logs', 'datagraph-out.log'),
    instances: 1,
    exec_mode: 'fork',
    watch: false,
    autorestart: true,
    max_restarts: 5,
    min_uptime: '10s',
    max_memory_restart: '2G',
    merge_logs: true,
    time: true,
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
  });
}

// ===== DeepScrape爬虫服务配置 =====
if (backendExists) {
  const deepScrapeDir = path.join(backendDir, 'deepscrape');

  if (directoryExists(deepScrapeDir)) {
    const deepScrapeEnvFile = path.join(deepScrapeDir, '.env');
    const deepScrapeEnv = {
      NODE_ENV: 'production',
      PORT: '3001',
      PATH: `${CONDA_BASE}/envs/zzdsj-qa/bin:${process.env.PATH}`
    };

    if (fs.existsSync(deepScrapeEnvFile)) {
      const envContent = fs.readFileSync(deepScrapeEnvFile, 'utf8');
      envContent.split('\n').forEach(line => {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
          const [key, ...valueParts] = trimmed.split('=');
          const value = valueParts.join('=').replace(/^["']|["']$/g, '');
          deepScrapeEnv[key] = value;
        }
      });
    }

    apps.push({
      name: 'deepscrape',
      cwd: deepScrapeDir,
      script: condaNpm,
      args: ['run', 'dev'],
      env: deepScrapeEnv,
      error_file: path.join(rootDir, 'logs', 'deepscrape-error.log'),
      out_file: path.join(rootDir, 'logs', 'deepscrape-out.log'),
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      max_memory_restart: '1G',
      merge_logs: true,
      time: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
    });
  }
}

// ===== Go微服务配置 =====
const servicesDir = path.join(rootDir, 'services');
const binDir = path.join(servicesDir, 'bin');
const configsDir = path.join(servicesDir, 'configs');

if (directoryExists(binDir)) {
  // 1. LLM Config Gateway
  const llmGatewayBin = path.join(binDir, 'llm-config-gateway');
  if (fs.existsSync(llmGatewayBin)) {
    const llmGatewayEnvFile = path.join(configsDir, 'llm-gateway.env');
    const llmGatewayEnv = { PORT: '9050' };

    if (fs.existsSync(llmGatewayEnvFile)) {
      const envContent = fs.readFileSync(llmGatewayEnvFile, 'utf8');
      envContent.split('\n').forEach(line => {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
          const [key, ...valueParts] = trimmed.split('=');
          const value = valueParts.join('=').replace(/^["']|["']$/g, '');
          llmGatewayEnv[key] = value;
        }
      });
    }

    apps.push({
      name: 'llm-gateway',
      cwd: servicesDir,
      script: llmGatewayBin,
      env: llmGatewayEnv,
      error_file: path.join(rootDir, 'logs', 'llm-gateway-error.log'),
      out_file: path.join(rootDir, 'logs', 'llm-gateway-out.log'),
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      autorestart: true,
      max_restarts: 5,
      min_uptime: '10s',
      max_memory_restart: '512M',
      merge_logs: true,
      time: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
    });
  }

  // 2. Unla API Server
  const unlaApiServerBin = path.join(binDir, 'unla-apiserver');
  const unlaApiServerConfig = path.join(configsDir, 'unla-configs', 'apiserver.yaml');
  if (fs.existsSync(unlaApiServerBin)) {
    const unlaEnvFile = path.join(configsDir, 'unla.env');
    const unlaEnv = { APISERVER_PORT: '5234' };

    if (fs.existsSync(unlaEnvFile)) {
      const envContent = fs.readFileSync(unlaEnvFile, 'utf8');
      envContent.split('\n').forEach(line => {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
          const [key, ...valueParts] = trimmed.split('=');
          const value = valueParts.join('=').replace(/^["']|["']$/g, '');
          unlaEnv[key] = value;
        }
      });
    }

    apps.push({
      name: 'unla-apiserver',
      cwd: servicesDir,
      script: unlaApiServerBin,
      args: ['--conf', unlaApiServerConfig],
      env: unlaEnv,
      error_file: path.join(rootDir, 'logs', 'unla-apiserver-error.log'),
      out_file: path.join(rootDir, 'logs', 'unla-apiserver-out.log'),
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      autorestart: true,
      max_restarts: 5,
      min_uptime: '10s',
      max_memory_restart: '512M',
      merge_logs: true,
      time: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
    });
  }

  // 3. Unla MCP Gateway
  const unlaMcpGatewayBin = path.join(binDir, 'unla-mcp-gateway');
  const unlaMcpGatewayConfig = path.join(configsDir, 'unla-configs', 'mcp-gateway.yaml');
  if (fs.existsSync(unlaMcpGatewayBin)) {
    const unlaEnvFile = path.join(configsDir, 'unla.env');
    const unlaMcpEnv = { MCP_GATEWAY_PORT: '5235' };

    if (fs.existsSync(unlaEnvFile)) {
      const envContent = fs.readFileSync(unlaEnvFile, 'utf8');
      envContent.split('\n').forEach(line => {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
          const [key, ...valueParts] = trimmed.split('=');
          const value = valueParts.join('=').replace(/^["']|["']$/g, '');
          unlaMcpEnv[key] = value;
        }
      });
    }

    apps.push({
      name: 'unla-mcp-gateway',
      cwd: servicesDir,
      script: unlaMcpGatewayBin,
      args: ['--conf', unlaMcpGatewayConfig],
      env: unlaMcpEnv,
      error_file: path.join(rootDir, 'logs', 'unla-mcp-gateway-error.log'),
      out_file: path.join(rootDir, 'logs', 'unla-mcp-gateway-out.log'),
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      autorestart: true,
      max_restarts: 5,
      min_uptime: '10s',
      max_memory_restart: '512M',
      merge_logs: true,
      time: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
    });
  }
}

// ===== Unla Web前端服务配置 =====
const webDir = path.join(servicesDir, 'web');
const webDistDir = path.join(webDir, 'dist');

if (directoryExists(webDistDir)) {
  const webEnvFile = path.join(webDir, '.env');
  const webEnv = {
    PORT: '5173',
    PATH: `${CONDA_BASE}/envs/zzdsj-qa/bin:${process.env.PATH}`
  };

  if (fs.existsSync(webEnvFile)) {
    const envContent = fs.readFileSync(webEnvFile, 'utf8');
    envContent.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
        const [key, ...valueParts] = trimmed.split('=');
        const value = valueParts.join('=').replace(/^["']|["']$/g, '');
        webEnv[key] = value;
      }
    });
  }

  apps.push({
    name: 'unla-web',
    cwd: webDistDir,
    script: 'npx',
    args: ['serve', '-l', '5173', '-s', '.'],
    env: webEnv,
    error_file: path.join(rootDir, 'logs', 'unla-web-error.log'),
    out_file: path.join(rootDir, 'logs', 'unla-web-out.log'),
    instances: 1,
    exec_mode: 'fork',
    watch: false,
    autorestart: true,
    max_restarts: 5,
    min_uptime: '10s',
    max_memory_restart: '256M',
    merge_logs: true,
    time: true,
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
  });
}

// 确保日志目录存在
function ensureLogDirectories() {
  const logDirs = [
    path.join(rootDir, 'logs'),
    path.join(frontendDir, 'logs'),
    path.join(backendDir, 'logs')
  ];

  logDirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      try {
        fs.mkdirSync(dir, { recursive: true });
      } catch (err) {
        // 静默失败，不影响配置加载
      }
    }
  });
}

ensureLogDirectories();

module.exports = {
  apps: apps
};
