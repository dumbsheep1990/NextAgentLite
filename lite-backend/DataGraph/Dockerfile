# MatGraph服务Dockerfile
FROM python:3.11-slim

# 设置工作目录
WORKDIR /app

# 设置环境变量
ENV PYTHONPATH=/app
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1

# 安装系统依赖
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    curl \
    git \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# 创建虚拟环境并激活
RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# 安装基础Python依赖
RUN pip install --no-cache-dir --upgrade pip setuptools wheel

# 安装LightRAG核心依赖
RUN pip install --no-cache-dir \
    fastapi \
    uvicorn \
    gunicorn \
    pydantic \
    httpx \
    aiofiles \
    python-multipart \
    jinja2 \
    networkx \
    numpy \
    pandas \
    matplotlib \
    plotly \
    pyvis \
    graphviz \
    neo4j \
    redis \
    aioredis \
    asyncpg \
    psycopg2-binary \
    sqlalchemy \
    alembic \
    openai \
    ollama

# 复制MatGraph源代码
COPY . .

# 创建必要的目录并设置权限
RUN mkdir -p \
    inputs \
    inputs_test/default \
    rag_storage \
    rag_storage_test/default \
    logs \
    && chmod -R 755 .

# 创建非root用户
RUN useradd -m -u 1000 matgraph && \
    chown -R matgraph:matgraph /app
USER matgraph

# 暴露端口
EXPOSE 8000

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# 启动命令
CMD ["python", "-m", "matgraph_core.api.lightrag_server"]