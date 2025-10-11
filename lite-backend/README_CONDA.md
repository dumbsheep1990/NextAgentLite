# NextAgent Lite - Conda环境使用说明

## 🐍 问题说明

当你看到以下警告信息时：
```
WARNING - 环境变量 DEFAULT_USERS 未设置，使用默认用户配置
WARNING - Crawl4AI未安装，将使用基础爬取功能
WARNING - python-readability未安装，将使用基础内容提取
```

这表明系统使用的Python环境与你安装依赖包的conda环境不一致。

## ✅ 解决方案

### 方案1：使用专门的启动脚本（推荐）

```bash
# 使用conda环境启动脚本
./start_with_conda.sh
```

### 方案2：直接使用conda环境的Python

```bash
# 使用conda环境的Python解释器
/opt/anaconda3/envs/zzdsj-lite/bin/python main.py
```

### 方案3：激活conda环境后启动

```bash
# 激活conda环境（如果conda命令可用）
conda activate zzdsj-lite
python main.py
```

## 🔍 环境检查

在启动前，你可以运行环境检查脚本：

```bash
# 检查当前环境的依赖状态
/opt/anaconda3/envs/zzdsj-lite/bin/python check_environment.py
```

## 📦 依赖包状态

在 `zzdsj-lite` 环境中，以下关键包已正确安装：

- ✅ crawl4ai: 网页内容爬取
- ✅ readability: 内容可读性提取
- ✅ fastapi: Web框架
- ✅ uvicorn: ASGI服务器
- ✅ sqlalchemy: 数据库ORM
- ✅ elasticsearch: 搜索引擎客户端
- ✅ agno: 多智能体框架

## 🚀 启动验证

成功启动后，你应该看到：

```
🎉 所有关键依赖都已正确安装！
🌐 API文档: http://localhost:8000/docs
📊 系统信息: http://localhost:8000/info
🔍 健康检查: http://localhost:8000/health
```

## 🛠️ 故障排除

如果仍然遇到问题，请检查：

1. **Python路径**: 确保使用正确的Python解释器
   ```bash
   which python  # 应该指向zzdsj-lite环境
   ```

2. **包安装位置**: 确认包安装在正确的环境中
   ```bash
   /opt/anaconda3/envs/zzdsj-lite/bin/pip list | grep crawl4ai
   ```

3. **环境变量**: 检查是否有环境变量影响Python路径
   ```bash
   echo $PYTHONPATH
   ```

---

**建议**: 始终使用 `./start_with_conda.sh` 启动脚本，它会自动使用正确的conda环境。