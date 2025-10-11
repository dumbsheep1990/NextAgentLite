# CORS配置重启说明

## ⚠️ 重要提示

**CORS配置已修改，但需要重启后端服务才能生效！**

## 已修改的CORS配置

### 后端 (.env文件)
```bash
CORS_ORIGINS="http://localhost:3000,http://127.0.0.1:3000,http://8.136.49.11:3000,http://8.136.49.11:5173"
```

### 允许的来源
- ✅ http://localhost:3000
- ✅ http://127.0.0.1:3000
- ✅ http://8.136.49.11:3000
- ✅ http://8.136.49.11:5173

## 重启步骤

### 方法1: 直接重启后端服务

```bash
cd /Users/wxn/Desktop/NextAgentLite/lite-backend

# 如果后端正在运行，先停止
# Ctrl+C 或 pkill -f "python.*main.py"

# 重新启动
python main.py
```

### 方法2: 使用PM2重启（如果使用PM2管理）

```bash
# 重启后端服务
pm2 restart lite-backend

# 或重启所有服务
pm2 restart all

# 查看日志确认CORS配置
pm2 logs lite-backend --lines 20
```

## 验证CORS配置

### 1. 检查后端启动日志

启动后应该看到：
```
环境变量覆盖: CORS_ORIGINS = ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://8.136.49.11:3000', 'http://8.136.49.11:5173']
```

### 2. 测试CORS（使用curl）

```bash
curl -X OPTIONS http://8.136.49.11:8000/api/v1/config/ \
  -H "Origin: http://8.136.49.11:3000" \
  -H "Access-Control-Request-Method: GET" \
  -v
```

应该看到响应头：
```
Access-Control-Allow-Origin: http://8.136.49.11:3000
Access-Control-Allow-Credentials: true
```

### 3. 浏览器测试

在浏览器控制台执行：
```javascript
fetch('http://8.136.49.11:8000/api/v1/config/', {
  headers: {
    'Origin': 'http://8.136.49.11:3000'
  }
}).then(r => r.json()).then(console.log)
```

应该能正常返回数据，不再报CORS错误。

## 当前错误分析

根据错误信息：
```
Access to XMLHttpRequest at 'http://8.136.49.11:8000/api/v1/config/'
from origin 'http://8.136.49.11:3000' has been blocked by CORS policy:
No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

**原因**: 后端服务读取的是旧的CORS配置（只有localhost），新配置还未生效。

**解决方法**: 重启后端服务即可。

## 检查配置是否生效

### 查看当前CORS配置

```bash
# 方法1: 查看.env文件
grep CORS_ORIGINS /Users/wxn/Desktop/NextAgentLite/lite-backend/.env

# 方法2: 调用系统信息接口
curl http://8.136.49.11:8000/info | jq .
```

### 确认后端是否重启

```bash
# 检查进程启动时间
ps aux | grep "python.*main.py" | grep -v grep

# 查看最新日志
tail -f /Users/wxn/Desktop/NextAgentLite/lite-backend/logs/*.log
```

## 完整重启流程

```bash
# 1. 停止所有服务
pm2 stop all  # 如果使用PM2
# 或 pkill -f "python.*main.py"  # 直接kill进程

# 2. 确认服务已停止
ps aux | grep -E "(python.*main.py|uvicorn)" | grep -v grep

# 3. 重新启动后端
cd /Users/wxn/Desktop/NextAgentLite/lite-backend
python main.py

# 4. 重新启动前端
cd /Users/wxn/Desktop/NextAgentLite/lite-qa
npm run dev

# 5. 验证CORS配置
curl -I http://8.136.49.11:8000/api/v1/config/ \
  -H "Origin: http://8.136.49.11:3000"
```

---

**配置时间**: 2025-10-10
**下一步**: 重启后端服务以应用新的CORS配置
