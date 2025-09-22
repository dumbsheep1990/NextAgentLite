#!/usr/bin/env bash
set -euo pipefail

# 启动 9050 端口的 llm-config-gateway （本地模式，非 Docker）
# - 自动从 Unla/.env 同步数据库配置至 llm-config-gateway/.env.local
# - 支持后台运行并写入 PID/日志

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="${SCRIPT_DIR%/scripts}"
LLM_DIR="${ROOT_DIR}/llm-config-gateway"
UNLA_DIR="${ROOT_DIR}/Unla"

MODE="daemon"   # daemon | foreground
if [[ "${1:-}" == "-f" || "${1:-}" == "--foreground" ]]; then
  MODE="foreground"
fi

echo "[LLM-GW] Using directory: $LLM_DIR"
if [[ ! -d "$LLM_DIR" ]]; then
  echo "[ERROR] Not found: $LLM_DIR" >&2
  exit 1
fi

# 生成 .env.local（与 Unla 的 GATEWAY_DB_* 对齐）
"$SCRIPT_DIR/configure_llm_gateway_from_unla_env.sh"

# 载入环境变量
set -a
source "$LLM_DIR/.env.local"
set +a

pushd "$LLM_DIR" >/dev/null

# 可选：独立的 Go 缓存目录，避免污染全局
export GOMODCACHE="${LLM_DIR}/.gomodcache"
export GOCACHE="${LLM_DIR}/.gocache"
export GOTOOLCHAIN="auto"
# 建议使用国内代理可选（不修改全局 go env），按需取消注释下一行：
export GOPROXY="https://goproxy.cn,direct"
mkdir -p "$GOMODCACHE" "$GOCACHE"

echo "[LLM-GW] DB: ${LLM_DB_HOST}:${LLM_DB_PORT}/${LLM_DB_NAME} (user=${LLM_DB_USER})"
echo "[LLM-GW] Port: ${LLM_GATEWAY_PORT:-9050}  Timeout(ms): ${LLM_UPSTREAM_TIMEOUT_MS:-30000}  Retry: ${LLM_UPSTREAM_RETRY:-1}"

if [[ -f llm-config-gateway.pid ]]; then
  oldpid=$(cat llm-config-gateway.pid || true)
  if [[ -n "${oldpid}" ]] && ps -p "$oldpid" >/dev/null 2>&1; then
    echo "[WARN] Already running with PID $oldpid (llm-config-gateway.pid). Stop it first or remove pid file."
    popd >/dev/null
    exit 0
  else
    rm -f llm-config-gateway.pid
  fi
fi

echo "[LLM-GW] Resolving modules (go mod tidy) ..."
if [[ "$MODE" == "foreground" ]]; then
  go mod tidy || true
  echo "[LLM-GW] Running in foreground ..."
  go run .
else
  echo "[LLM-GW] Starting in background ..."
  # 先写依赖日志，便于定位 go.sum 问题
  (go mod tidy || true) >> llm-config-gateway.out 2>&1
  nohup go run . >> llm-config-gateway.out 2>&1 & echo $! > llm-config-gateway.pid
  echo "[LLM-GW] PID: $(cat llm-config-gateway.pid)  Logs: ${LLM_DIR}/llm-config-gateway.out"
fi

popd >/dev/null
