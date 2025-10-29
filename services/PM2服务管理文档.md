# PM2 服务管理文档

## 概述

NextAgentLite项目使用PM2作为生产环境的进程管理器，统一管理5个核心服务。PM2提供了进程守护、日志管理、负载均衡、开机自启等企业级功能。

## 服务架构

### 服务列表

| 服务名 | 类型 | 端口 | 内存限制 | 说明 |
|--------|------|------|----------|------|
| llm-gateway | Go | 9050 | 1GB | LLM配置网关 |
| unla-apiserver | Go | 5234 | 2GB | Unla API服务器 |
| unla-mcp-gateway | Go | 5235 | 1GB | Unla MCP网关 |
| unla-web | Static | 5173 | 512MB | Unla前端应用 |
| deepscrape | Node.js | 3001 | 2GB | 深度爬虫服务 |

### 服务依赖关系

```
unla-web (前端)
    ↓
unla-apiserver (API服务器)
    ↓
llm-gateway (LLM网关) + unla-mcp-gateway (MCP网关)
    ↓
deepscrape (爬虫服务)
```

## 快速开始

### 安装PM2

```bash
# 全局安装PM2
npm install -g pm2

# 验证安装
pm2 --version
```

### 一键启动所有服务

```bash
# 进入项目目录
cd /Users/wxn/Desktop/NextAgentLite/services

# 运行启动脚本
bash scripts/start_all_pm2.sh
```

启动脚本会自动：
1. ✓ 检查PM2环境
2. ✓ 验证服务文件完整性
3. ✓ 检查必要依赖（serve命令）
4. ✓ 检查配置文件
5. ✓ 启动所有服务
6. ✓ 保存PM2配置
7. ✓ 显示服务状态

### 一键停止所有服务

```bash
# 运行停止脚本
bash scripts/stop_all_pm2.sh
```

停止脚本支持：
- 停止所有服务
- 删除进程配置（可选）
- 清空PM2日志（可选）

## PM2配置文件

### ecosystem.config.js

位置: `/Users/wxn/Desktop/NextAgentLite/services/ecosystem.config.js`

```javascript
module.exports = {
  apps: [
    {
      name: 'llm-gateway',
      script: './bin/llm-config-gateway',
      cwd: '/Users/wxn/Desktop/NextAgentLite/services',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        PORT: '9050',
      },
      error_file: './logs/llm-gateway-error.log',
      out_file: './logs/llm-gateway-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
    },
    // ... 其他服务配置
  ],
};
```

### 配置说明

| 字段 | 说明 |
|------|------|
| name | 服务名称（用于PM2命令） |
| script | 可执行文件路径 |
| cwd | 工作目录 |
| instances | 实例数量（1为单实例） |
| autorestart | 崩溃自动重启 |
| watch | 是否监听文件变化（生产环境关闭） |
| max_memory_restart | 内存限制，超过后自动重启 |
| env | 环境变量 |
| error_file | 错误日志路径 |
| out_file | 标准输出日志路径 |
| log_date_format | 日志时间格式 |
| merge_logs | 合并日志 |

## PM2常用命令

### 基础管理

```bash
# 启动所有服务
pm2 start ecosystem.config.js

# 启动单个服务
pm2 start ecosystem.config.js --only llm-gateway

# 停止所有服务
pm2 stop all

# 停止单个服务
pm2 stop llm-gateway

# 重启所有服务
pm2 restart all

# 重启单个服务
pm2 restart unla-apiserver

# 删除所有进程
pm2 delete all

# 删除单个进程
pm2 delete deepscrape
```

### 状态查看

```bash
# 查看所有服务状态
pm2 list

# 查看详细信息
pm2 show llm-gateway

# 实时监控面板
pm2 monit

# 查看资源使用
pm2 status
```

### 日志管理

```bash
# 查看所有服务日志（实时）
pm2 logs

# 查看特定服务日志
pm2 logs llm-gateway

# 查看错误日志
pm2 logs --err

# 查看最近N行日志
pm2 logs --lines 100

# 清空所有日志
pm2 flush

# 重载日志文件
pm2 reloadLogs
```

### 进阶命令

```bash
# 无停机重载（仅适用于Node.js应用）
pm2 reload deepscrape

# 优雅停止（等待当前任务完成）
pm2 stop llm-gateway --wait-ready

# 更新PM2到最新版本
pm2 update

# 保存当前进程列表
pm2 save

# 恢复已保存的进程列表
pm2 resurrect

# 清空已保存的进程列表
pm2 cleardump
```

## 开机自启动设置

### macOS/Linux

```bash
# 1. 生成启动脚本
pm2 startup

# 2. 运行生成的命令（需要sudo权限）
# 例如: sudo env PATH=$PATH:/usr/local/bin pm2 startup systemd -u wxn --hp /Users/wxn

# 3. 保存当前进程列表
pm2 save

# 4. 验证自启动配置
pm2 list
```

### 禁用自启动

```bash
# 删除自启动配置
pm2 unstartup
```

## 日志文件位置

### PM2管理的日志

所有服务日志位于: `/Users/wxn/Desktop/NextAgentLite/services/logs/`

```
logs/
├── llm-gateway-error.log       # LLM网关错误日志
├── llm-gateway-out.log         # LLM网关标准输出
├── unla-apiserver-error.log    # API服务器错误日志
├── unla-apiserver-out.log      # API服务器标准输出
├── unla-mcp-gateway-error.log  # MCP网关错误日志
├── unla-mcp-gateway-out.log    # MCP网关标准输出
├── unla-web-error.log          # Web前端错误日志
├── unla-web-out.log            # Web前端标准输出
├── deepscrape-error.log        # 爬虫服务错误日志
└── deepscrape-out.log          # 爬虫服务标准输出
```

### PM2系统日志

PM2自身日志位于: `~/.pm2/logs/`

```bash
# 查看PM2系统日志位置
pm2 info llm-gateway | grep "log path"
```

## 监控与告警

### 实时监控

```bash
# 启动监控面板
pm2 monit
```

监控面板显示：
- CPU使用率
- 内存使用量
- 实时日志流
- 进程状态

### 性能指标

```bash
# 查看详细性能指标
pm2 show llm-gateway

# 输出示例
# ┌─────────────────┬───────────────────────────────┐
# │ status          │ online                        │
# │ cpu             │ 0.2%                          │
# │ memory          │ 45.5 MB                       │
# │ uptime          │ 2h                            │
# │ restarts        │ 0                             │
# └─────────────────┴───────────────────────────────┘
```

### PM2 Plus（可选）

PM2 Plus提供企业级监控和告警功能：

```bash
# 注册PM2 Plus账号
pm2 plus

# 连接到PM2 Plus
pm2 link <secret> <public>
```

功能包括：
- Web仪表板
- 邮件告警
- Slack集成
- 性能分析
- 异常追踪

## 故障排查

### 服务无法启动

1. **检查文件权限**
```bash
# 确保二进制文件可执行
chmod +x bin/llm-config-gateway
chmod +x bin/unla-apiserver
chmod +x bin/unla-mcp-gateway
```

2. **检查端口占用**
```bash
# 查看端口占用情况
lsof -i :9050
lsof -i :5234
lsof -i :5235
lsof -i :5173
lsof -i :3001

# 杀死占用进程
kill -9 <PID>
```

3. **查看错误日志**
```bash
# 查看PM2日志
pm2 logs llm-gateway --err --lines 50

# 查看服务日志文件
tail -f logs/llm-gateway-error.log
```

### 服务频繁重启

1. **检查内存使用**
```bash
# 查看服务内存占用
pm2 list

# 如果超过max_memory_restart，考虑增加内存限制
# 编辑 ecosystem.config.js，增大 max_memory_restart 值
```

2. **检查服务稳定性**
```bash
# 查看重启次数
pm2 show llm-gateway

# 查看错误日志寻找崩溃原因
pm2 logs llm-gateway --err --lines 100
```

3. **临时禁用自动重启**
```bash
# 编辑ecosystem.config.js，设置 autorestart: false
# 重新加载配置
pm2 reload ecosystem.config.js
```

### 日志文件过大

```bash
# 清空所有日志
pm2 flush

# 或手动删除日志文件
rm -f logs/*.log

# 配置日志轮转（可选）
# 安装pm2-logrotate
pm2 install pm2-logrotate

# 配置日志保留策略
pm2 set pm2-logrotate:max_size 100M
pm2 set pm2-logrotate:retain 7
pm2 set pm2-logrotate:compress true
```

### PM2命令无响应

```bash
# 杀死PM2守护进程
pm2 kill

# 重新启动服务
bash scripts/start_all_pm2.sh
```

## 最佳实践

### 1. 定期保存配置

```bash
# 每次修改服务配置后执行
pm2 save
```

### 2. 日志轮转

安装pm2-logrotate防止日志文件过大：

```bash
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 100M
pm2 set pm2-logrotate:retain 7
pm2 set pm2-logrotate:compress true
pm2 set pm2-logrotate:rotateInterval '0 0 * * *'
```

### 3. 定期更新PM2

```bash
# 更新PM2到最新版本
npm update -g pm2

# 更新PM2守护进程
pm2 update
```

### 4. 监控资源使用

```bash
# 定期检查资源使用情况
pm2 monit

# 或使用系统工具
htop
```

### 5. 备份PM2配置

```bash
# 备份当前进程列表
cp ~/.pm2/dump.pm2 ~/.pm2/dump.pm2.backup

# 备份ecosystem配置
cp ecosystem.config.js ecosystem.config.js.backup
```

### 6. 使用环境变量

在`ecosystem.config.js`中配置环境变量，避免硬编码：

```javascript
env: {
  NODE_ENV: 'production',
  PORT: process.env.PORT || '3001',
  API_KEY: process.env.API_KEY,
}
```

## 性能优化

### 1. 集群模式（适用于Node.js应用）

```javascript
// 对于CPU密集型Node.js应用，使用集群模式
{
  name: 'deepscrape',
  script: './node/deepscrape/dist/index.js',
  instances: 'max',  // 使用所有CPU核心
  exec_mode: 'cluster',
}
```

### 2. 优雅重启

```bash
# 无停机更新（仅限Node.js）
pm2 reload deepscrape
```

### 3. 资源限制

在ecosystem.config.js中配置资源限制：

```javascript
{
  max_memory_restart: '2G',
  max_restarts: 10,
  min_uptime: '10s',
}
```

## 与传统脚本对比

| 特性 | 传统Shell脚本 | PM2 |
|------|---------------|-----|
| 进程守护 | 需手动实现 | ✓ 内置 |
| 自动重启 | 需手动实现 | ✓ 内置 |
| 日志管理 | 需手动配置 | ✓ 内置 |
| 开机自启 | 需配置systemd | ✓ 一键配置 |
| 监控面板 | 无 | ✓ 实时监控 |
| 零停机重载 | 不支持 | ✓ 支持 |
| 负载均衡 | 不支持 | ✓ 集群模式 |
| 资源控制 | 困难 | ✓ 内存CPU限制 |

## 常见问题

### Q: PM2和传统启动脚本有什么区别？

A: PM2提供了进程守护、自动重启、日志管理等企业级功能，而传统脚本需要手动实现这些功能。PM2更适合生产环境。

### Q: 是否可以混用PM2和传统脚本？

A: 不建议混用。统一使用PM2管理所有服务可以获得更好的一致性和可维护性。

### Q: PM2会占用多少系统资源？

A: PM2守护进程本身只占用约30-50MB内存和极少的CPU资源。相比手动管理进程，PM2的资源开销微不足道。

### Q: 如何迁移现有的Shell脚本到PM2？

A: 已创建ecosystem.config.js配置文件，直接使用`bash scripts/start_all_pm2.sh`即可完成迁移。

### Q: PM2是否支持Windows？

A: 是的，PM2支持Windows、macOS和Linux。但开机自启功能在不同平台上有所差异。

## 参考资料

- [PM2官方文档](https://pm2.keymetrics.io/docs/usage/quick-start/)
- [PM2配置文件指南](https://pm2.keymetrics.io/docs/usage/application-declaration/)
- [PM2 Plus监控平台](https://pm2.io/)
- [PM2 GitHub仓库](https://github.com/Unitech/pm2)

## 总结

使用PM2管理NextAgentLite服务可以获得：

- ✅ 统一的进程管理
- ✅ 自动故障恢复
- ✅ 完善的日志系统
- ✅ 实时监控能力
- ✅ 开机自启支持
- ✅ 零停机更新
- ✅ 企业级稳定性

通过`start_all_pm2.sh`和`stop_all_pm2.sh`脚本，可以实现一键启停所有服务，极大简化了运维工作。

---

*最后更新: 2025-10-14*
