// 后端启动脚本
const { spawn } = require('child_process');
const path = require('path');

const backendDir = path.join(__dirname, 'mat-backend');
const child = spawn('python', ['main.py'], {
  cwd: backendDir,
  stdio: 'inherit'
});

child.on('close', (code) => {
  console.log(`后端服务退出，代码: ${code}`);
});