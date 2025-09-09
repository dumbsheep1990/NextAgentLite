/**
 * PM2配置文件 - 完整系统管理
 * 地聚物材料智能问答系统 - 前端 + 后端统一管理
 */

const path = require('path');
const os = require('os');
const fs = require('fs');

// 获取环境变量或默认值
function getConfig(key, defaultValue) {
  return process.env[key] || defaultValue;
}

// 检查目录是否存在
function directoryExists(dirPath) {
  try {
    return fs.statSync(dirPath).isDirectory();
  } catch (err) {
    return false;
  }
}

// 项目根目录
const rootDir = __dirname;
const frontendDir = path.join(rootDir, 'mat-qa');
const backendDir = path.join(rootDir, 'mat-backend');

// 检查前端和后端目录是否存在
const frontendExists = directoryExists(frontendDir);
const backendExists = directoryExists(backendDir);

console.log('PM2 配置检查:');
console.log(`  根目录: ${rootDir}`);
console.log(`  前端目录: ${frontendDir} (${frontendExists ? '✓' : '✗'})`);
console.log(`  后端目录: ${backendDir} (${backendExists ? '✓' : '✗'})`);

// 应用配置数组
const apps = [];

// ===== 前端应用配置 =====
if (frontendExists) {
  // 读取前端环境变量
  const frontendEnvFile = path.join(frontendDir, '.env.local');
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

  // 前端开发环境（固定端口3000）
  apps.push({
    name: 'web',
    cwd: frontendDir,
    script: 'npm',
    args: 'run dev',
    env: {
      NODE_ENV: 'development',
      PORT: '3000',
      ...frontendEnvConfig
    },
    
    // 日志配置
    error_file: path.join(frontendDir, 'logs', 'pm2-error.log'),
    out_file: path.join(frontendDir, 'logs', 'pm2-out.log'),
    
    // 进程配置
    instances: 1,
    exec_mode: 'fork',
    watch: false,
    ignore_watch: ['node_modules', '.git', 'dist', 'build'],
    
    // 重启配置
    autorestart: true,
    max_restarts: 10,
    min_uptime: '10s',
    max_memory_restart: '1G',
    
    // 日志配置
    merge_logs: true,
    time: true,
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
  });
}

// ===== 后端应用配置 =====
if (backendExists) {
  // 读取后端环境变量
  const backendEnvFile = path.join(backendDir, '.env.local');
  const backendEnvConfig = {};
  
  if (fs.existsSync(backendEnvFile)) {
    const envContent = fs.readFileSync(backendEnvFile, 'utf8');
    envContent.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
        const [key, ...valueParts] = trimmed.split('=');
        const value = valueParts.join('=');
        backendEnvConfig[key] = value;
      }
    });
  }

  // 后端开发环境
  apps.push({
    name: 'server',
    cwd: backendDir,
    script: 'main.py',
    interpreter: 'python',
    env: {
      NODE_ENV: 'development',
      MAT_QA_ENV: 'development',
      ...backendEnvConfig
    },
    
    // 日志配置
    error_file: path.join(backendDir, 'logs', 'pm2-error.log'),
    out_file: path.join(backendDir, 'logs', 'pm2-out.log'),
    
    // 进程配置
    instances: 1,
    exec_mode: 'fork',
    watch: false,
    ignore_watch: [
      'node_modules', '.git', '*.log', 'logs', 'uploads', 
      '__pycache__', '.pytest_cache', '.venv', 'venv'
    ],
    
    // 重启配置
    autorestart: true,
    max_restarts: 10,
    min_uptime: '10s',
    max_memory_restart: '2G',
    
    // 日志配置
    merge_logs: true,
    time: true,
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
  });
}

// 确保日志目录存在
function ensureLogDirectories() {
  const logDirs = [
    path.join(frontendDir, 'logs'),
    path.join(backendDir, 'logs')
  ];
  
  logDirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      try {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`创建日志目录: ${dir}`);
      } catch (err) {
        console.warn(`无法创建日志目录 ${dir}:`, err.message);
      }
    }
  });
}

// 初始化时确保日志目录存在
ensureLogDirectories();

console.log(`PM2 配置完成，共 ${apps.length} 个应用:`);
apps.forEach(app => {
  console.log(`  - ${app.name} (${app.cwd})`);
});

module.exports = {
  apps: apps
};