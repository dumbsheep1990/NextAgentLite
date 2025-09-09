// 前端启动脚本
const { spawn } = require('child_process');
const path = require('path');

const frontendDir = path.join(__dirname, 'mat-qa');
const child = spawn('npm', ['run', 'dev'], {
  cwd: frontendDir,
  stdio: 'inherit'
});

child.on('close', (code) => {
  console.log(`前端服务退出，代码: ${code}`);
});