# Services 服务统一管理目录

本目录用于统一管理和部署NextAgentLite项目的所有服务，包括：
- **Python服务**: lite-backend主服务、DataGraph知识图谱
- **Go微服务**: LLM Config Gateway、Unla服务
- **Node.js服务**: DeepScrape爬虫、前端应用

## 目录结构

```
services/
├── bin/                          # 编译后的二进制文件
│   ├── llm-config-gateway        # LLM统一网关 (端口9050)
│   ├── unla-apiserver            # Unla API服务器 (端口5234)
│   └── unla-mcp-gateway          # Unla MCP网关 (端口5235)
├── configs/                      # 服务配置文件
│   ├── llm-gateway.env           # LLM Gateway配置
│   ├── llm-gateway-openapi.yaml  # LLM Gateway API文档
│   ├── unla.env                  # Unla服务配置
│   └── unla-configs/             # Unla额外配置目录
├── logs/                         # 服务日志和PID文件
│   ├── llm-gateway.log
│   ├── llm-gateway.pid
│   ├── unla-apiserver.log
│   ├── unla-apiserver.pid
│   ├── unla-mcp-gateway.log
│   └── unla-mcp-gateway.pid
├── nginx/                        # Nginx配置（生产环境）
│   └── nginx.conf               # Nginx配置文件
├── scripts/                      # 管理脚本
│   ├── start_all_services.sh    # 🌟 一键启动所有服务（Python+Node.js）
│   ├── stop_all_services.sh     # 🌟 一键停止所有服务
│   ├── check_services.sh        # 🌟 检查服务状态
│   ├── build_all.sh              # 构建所有Go服务
│   ├── build_llm_gateway.sh      # 构建LLM Gateway
│   ├── build_unla.sh             # 构建Unla服务
│   ├── start_llm_gateway.sh      # 启动LLM Gateway
│   ├── stop_llm_gateway.sh       # 停止LLM Gateway
│   ├── start_unla.sh             # 启动Unla服务
│   ├── stop_unla.sh              # 停止Unla服务
│   └── status.sh                 # 查看Go服务状态
├── web/                          # Web静态资源
├── PM2服务管理文档.md            # PM2使用文档
├── 启动说明.md                   # 🌟 详细启动说明
└── README.md                     # 本文件
```

## 服务列表

### Python服务（conda环境: zzdsj-lite）

| 服务名称 | 端口 | 说明 | 启动方式 |
|---------|------|------|----------|
| lite-backend | 8000 | 主后端API服务 | start_all_services.sh |
| DataGraph | 9622 | 知识图谱服务 | start_all_services.sh |

### Node.js服务

| 服务名称 | 端口 | 说明 | 启动方式 |
|---------|------|------|----------|
| lite-qa | 3000 | 前端开发服务器 | start_all_services.sh |
| DeepScrape | 3001 | 智能爬虫服务 | start_deepscrape.sh |

### Go微服务

| 服务名称 | 端口 | 说明 | 二进制文件 |
|---------|------|------|-----------|
| LLM Config Gateway | 9050 | LLM统一配置网关 | llm-config-gateway |
| Unla API Server | 5234 | Unla后端API服务 | unla-apiserver |
| Unla MCP Gateway | 5235 | Unla MCP协议网关 | unla-mcp-gateway |

## 快速开始

### 推荐：一键启动所有服务（Python + Node.js + Go）

```bash
# 从项目根目录
cd ..
./start.sh

# 或从services目录
./scripts/start_all_services.sh
```

这个脚本会自动启动：
- ✅ lite-backend (后端主服务)
- ✅ lite-qa (前端应用)
- ✅ DataGraph (知识图谱) - 可选

详细说明请查看: [启动说明.md](./启动说明.md)

### 停止所有服务

```bash
# 从项目根目录
cd ..
./stop.sh

# 或从services目录
./scripts/stop_all_services.sh
```

### 检查服务状态

```bash
# 从项目根目录
cd ..
./status.sh

# 或从services目录
./scripts/check_services.sh
```

---

## Go微服务管理

### 1. 构建所有Go服务

```bash
cd scripts
./build_all.sh
```

或者单独构建:

```bash
# 构建LLM Gateway
./build_llm_gateway.sh

# 构建Unla服务
./build_unla.sh
```

### 2. 配置服务

首次构建后,配置文件会自动复制到 `configs/` 目录。请根据实际环境修改:

```bash
# 编辑LLM Gateway配置
vi configs/llm-gateway.env

# 编辑Unla配置
vi configs/unla.env
```

### 3. 启动服务

```bash
cd scripts

# 启动LLM Gateway
./start_llm_gateway.sh

# 启动Unla服务 (API Server + MCP Gateway)
./start_unla.sh
```

### 4. 查看服务状态

```bash
./status.sh
```

输出示例:
```
========================================
Go服务状态检查
========================================

[1] LLM Config Gateway (端口9050)
  状态: 运行中
  PID: 12345
  端口: 9050 已监听

[2] Unla API Server (端口5234)
  状态: 运行中
  PID: 12346
  端口: 5234 已监听

[3] Unla MCP Gateway (端口5235)
  状态: 运行中
  PID: 12347
  端口: 5235 已监听
```

### 5. 停止服务

```bash
# 停止LLM Gateway
./stop_llm_gateway.sh

# 停止Unla服务
./stop_unla.sh
```

## 健康检查

### LLM Gateway

```bash
curl http://localhost:9050/health
curl http://localhost:9050/v1/models
```

### Unla服务

```bash
# API Server
curl http://localhost:5234/health

# MCP Gateway
curl http://localhost:5235/health
```

## 日志查看

### 实时查看日志

```bash
# LLM Gateway日志
tail -f logs/llm-gateway.log

# Unla API Server日志
tail -f logs/unla-apiserver.log

# Unla MCP Gateway日志
tail -f logs/unla-mcp-gateway.log

# 查看所有日志
tail -f logs/*.log
```

### 查看历史日志

```bash
# 查看最后100行
tail -n 100 logs/llm-gateway.log

# 搜索错误
grep -i error logs/*.log
```

## 故障排查

### 服务启动失败

1. 检查端口是否被占用:
```bash
lsof -i :9050
lsof -i :5234
lsof -i :5235
```

2. 查看日志文件:
```bash
cat logs/llm-gateway.log
cat logs/unla-apiserver.log
cat logs/unla-mcp-gateway.log
```

3. 检查配置文件:
```bash
cat configs/llm-gateway.env
cat configs/unla.env
```

### 编译失败

1. 检查Go版本:
```bash
go version  # 需要 Go 1.19+
```

2. 清理缓存重新编译:
```bash
cd ../lite-backend/llm-config-gateway
go clean -cache
cd ../../services/scripts
./build_llm_gateway.sh
```

### 进程僵尸/PID文件过期

```bash
# 清理PID文件
rm -f logs/*.pid

# 手动kill进程
ps aux | grep -E "llm-config-gateway|unla-apiserver|unla-mcp-gateway"
kill <PID>
```

## 环境变量说明

### LLM Gateway (llm-gateway.env)

```bash
# 服务端口
PORT=9050

# 数据库连接
DATABASE_URL=postgresql://user:pass@localhost:5432/dbname

# Gin模式
GIN_MODE=release  # release / debug

# CORS配置
CORS_ORIGINS=http://localhost:3000,http://localhost:5173
```

### Unla (unla.env)

```bash
# API Server端口
APISERVER_PORT=5234

# MCP Gateway端口
MCP_GATEWAY_PORT=5235

# 数据库配置
DATABASE_URL=sqlite:./data/unla.db

# JWT密钥
APISERVER_JWT_SECRET_KEY=your-secret-key

# Gin模式
GIN_MODE=release
```

## 集成到主项目

这些服务已集成到主项目的API网关中:

- LLM Gateway: `http://localhost:8000/api-gateway/llm/*`
- Unla API: `http://localhost:8000/api-gateway/unla-api/*`
- Unla MCP: `http://localhost:8000/gateway/*`

详见: `database-backup/统一API网关架构优化说明.md`

## 维护建议

### 定期维护

1. **清理日志** (每周):
```bash
# 归档旧日志
cd logs
tar -czf logs-$(date +%Y%m%d).tar.gz *.log
rm *.log
```

2. **更新依赖** (每月):
```bash
cd ../lite-backend/llm-config-gateway
go get -u
go mod tidy

cd ../Unla
go get -u
go mod tidy
```

3. **重新编译** (更新后):
```bash
cd ../../services/scripts
./build_all.sh
```

### 升级流程

```bash
# 1. 停止所有服务
./stop_llm_gateway.sh
./stop_unla.sh

# 2. 备份配置
cp -r configs configs.backup

# 3. 重新构建
./build_all.sh

# 4. 恢复配置
cp configs.backup/* configs/

# 5. 重启服务
./start_llm_gateway.sh
./start_unla.sh

# 6. 验证
./status.sh
```

## 生产部署建议

1. **使用Systemd**:创建systemd服务文件,实现开机自启和自动重启
2. **反向代理**:使用Nginx/Caddy作为反向代理,添加SSL
3. **监控告警**:集成Prometheus/Grafana监控
4. **日志轮转**:配置logrotate自动清理日志
5. **资源限制**:使用cgroup限制CPU和内存使用

## 技术栈

- **语言**: Go 1.19+
- **Web框架**: Gin (LLM Gateway), Echo/Gin (Unla)
- **数据库**: PostgreSQL (LLM Gateway), SQLite (Unla)
- **依赖管理**: Go Modules

---

**最后更新**: 2025-10-14
**维护者**: NextAgentLite Team
