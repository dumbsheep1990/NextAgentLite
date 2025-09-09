// 从 .env.local 读取配置（如果存在）
const fs = require('fs');
const path = require('path');

// 读取环境变量配置
const envLocalPath = path.join(__dirname, '.env.local');
const envConfig = {};

if (fs.existsSync(envLocalPath)) {
  const envContent = fs.readFileSync(envLocalPath, 'utf8');
  const lines = envContent.split('\n');
  
  lines.forEach(line => {
    const trimmedLine = line.trim();
    if (trimmedLine && !trimmedLine.startsWith('#')) {
      const [key, ...valueParts] = trimmedLine.split('=');
      const value = valueParts.join('=');
      if (key && value) {
        envConfig[key.trim()] = value.trim();
      }
    }
  });
}

// 获取配置值的工具函数
const getConfig = (key, defaultValue) => {
  return process.env[key] || envConfig[key] || defaultValue;
};

module.exports = {
  apps: [
    {
      name: 'mat-qa-dev',
      script: 'npm',
      args: 'run dev',
      cwd: __dirname,
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'development',
        PORT: getConfig('VITE_DEV_PORT', 3000),
        HOST: getConfig('VITE_DEV_HOST', 'localhost'),
        ...envConfig
      },
      error_file: './logs/dev-err.log',
      out_file: './logs/dev-out.log',
      log_file: './logs/dev-combined.log',
      time: true
    },
    {
      name: 'mat-qa-prod',
      script: 'npm',
      args: 'run preview',
      cwd: __dirname,
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production',
        PORT: getConfig('VITE_PROD_PORT', 3000),
        HOST: getConfig('VITE_PROD_HOST', '0.0.0.0'),
        ...envConfig
      },
      error_file: './logs/prod-err.log',
      out_file: './logs/prod-out.log',
      log_file: './logs/prod-combined.log',
      time: true
    }
  ]
};