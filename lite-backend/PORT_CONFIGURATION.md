# 端口配置说明

## 系统端口分配

| 服务 | 端口 | 说明 |
|------|------|------|
| **前端服务** | 3000 | React前端应用 |
| **DeepScrape** | 3001 | AI爬取服务 |
| **备用端口** | 3002 | 预留端口 |
| **Vite开发** | 5173 | Vite开发服务器 |
| **后端API** | 8000 | FastAPI后端服务 |
| **DataGraph** | 9622 | 知识图谱服务 |

## DeepScrape端口修改

### 原因
- 前端React应用使用3000端口
- DeepScrape默认也使用3000端口
- 为避免冲突，DeepScrape调整为3001端口

### 配置步骤

1. **克隆并配置DeepScrape**
```bash
git clone https://github.com/stretchcloud/deepscrape.git
cd deepscrape
npm install
cp .env.example .env
```

2. **修改.env文件**
```env
# 设置端口为3001
PORT=3001

# 配置API密钥
API_KEY=test-key

# 选择LLM提供商
LLM_PROVIDER=openai
OPENAI_API_KEY=your-api-key
```

3. **启动服务**
```bash
npm run dev
```

### 快速启动

使用提供的启动脚本：
```bash
./start_deepscrape.sh
```

该脚本会自动：
- 克隆项目（如果不存在）
- 安装依赖
- 配置端口为3001
- 生成基础.env文件
- 启动服务

## 服务验证

### DeepScrape服务检查
```bash
# 健康检查
curl http://localhost:3001/health

# API文档
open http://localhost:3001/api-docs
```

### NextAgentLite集成检查
```bash
# 运行集成测试
python test_deepscrape_integration.py

# 检查配置
curl http://localhost:8000/api/v1/url-crawl/config
```

## 故障排除

### 端口占用问题
```bash
# 检查端口占用
lsof -i :3001

# 杀死占用进程
kill -9 <PID>
```

### 服务连接问题
1. 确认DeepScrape在3001端口运行
2. 检查防火墙设置
3. 验证API密钥配置
4. 查看服务日志

### 常见错误
- `EADDRINUSE`: 端口已被占用，更换端口或杀死占用进程
- `Connection refused`: 服务未启动或端口配置错误
- `API key invalid`: 检查API密钥配置

## 开发环境端口映射

```
客户端 (浏览器) 
    ↓ :3000
React前端应用
    ↓ :8000 (API调用)
NextAgentLite后端
    ↓ :3001 (DeepScrape调用)
DeepScrape服务
    ↓ LLM API调用
外部LLM服务
```

## 生产环境建议

1. **使用反向代理**
   - Nginx配置统一入口
   - 隐藏内部端口
   - 支持HTTPS

2. **容器化部署**
   - Docker Compose编排
   - 内部网络通信
   - 环境隔离

3. **负载均衡**
   - 多实例部署
   - 健康检查
   - 故障转移

## 配置文件位置

- **NextAgentLite配置**: `core/config_optimized.py`
- **环境变量示例**: `env.deepscrape.example`
- **DeepScrape配置**: `deepscrape/.env`
- **启动脚本**: `start_deepscrape.sh`
- **测试脚本**: `test_deepscrape_integration.py`
