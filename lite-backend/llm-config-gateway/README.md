LLM Config Gateway (Skeleton)

Overview
- Centralized model provider/model/alias configuration service on Postgres.
- Optional OpenAI-compatible proxy endpoints (skeleton returns 501 by default).

Run
- 推荐：对齐 Unla 的数据库配置
  - 运行脚本将 Unla/.env 的 GATEWAY_DB_* 映射为本服务需要的 LLM_DB_*：
    - bash lite-backend/scripts/configure_llm_gateway_from_unla_env.sh
    - 生成文件：lite-backend/llm-config-gateway/.env.local
  - 启动（读取 .env.local）：
    - cd lite-backend/llm-config-gateway
    - set -a && source ./.env.local && set +a && go run .

- 手动设置（可选）
  - LLM_DB_HOST, LLM_DB_PORT, LLM_DB_USER, LLM_DB_PASSWORD, LLM_DB_NAME, LLM_DB_SSLMODE
  - LLM_GATEWAY_PORT（默认 9050）
  - LLM_UPSTREAM_TIMEOUT_MS（默认 30000），LLM_UPSTREAM_RETRY（默认 1）

APIs (minimal)
- GET /health
- GET /readyz
- GET /v1/config
- GET/POST /v1/providers
- GET/POST /v1/models
- GET/POST /v1/aliases
- POST /v1/chat/completions（OpenAI 兼容，支持流式）
  - 缺省不传 model 将回退到 defaults.default_model
- POST /v1/embeddings（OpenAI 兼容）
  - 缺省不传 model 将回退到 defaults.default_embedding

OpenAPI 文档
- 原始规范：GET /openapi.yaml
- JSON 版本：GET /openapi.json
- Swagger UI 页面：GET /docs（同源加载 /openapi.json）
- 本地调试：可将 /openapi.yaml 复制到 Swagger Editor 或 Postman 导入

Next
- Implement upstream routing in /v1/chat/completions using provider/base_url/api_key.
- Add encryption for API keys at rest.
- Add auth for admin/config endpoints.
