#!/usr/bin/env bash
set -euo pipefail

# Start Unla in local (non-Docker) mode using go run.
# - Starts control plane (apiserver) on 5234
# - Starts data plane (mcp-gateway) on 5235
# - Writes PID files and logs to lite-backend/Unla

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
UNLA_DIR="${SCRIPT_DIR%/scripts}/Unla"

if ! command -v go >/dev/null 2>&1; then
  echo "[ERROR] Go is not installed or not in PATH. Please install Go 1.21+" >&2
  exit 1
fi

mkdir -p "${UNLA_DIR}"
mkdir -p "${UNLA_DIR}/.gomodcache" "${UNLA_DIR}/.gocache" "${UNLA_DIR}/.gopath"

# Admin & runtime defaults (can be overridden by env before running this script)
: "${SUPER_ADMIN_USERNAME:=admin}"
: "${SUPER_ADMIN_PASSWORD:=admin}"
: "${APISERVER_JWT_SECRET_KEY:=change-me-strong-key}"

# Web runtime config for UI: where the MCP gateway is reachable from browser
# If you prefer routing through backend reverse-proxy, set to http://localhost:8000/gateway
: "${VITE_MCP_GATEWAY_BASE_URL:=http://localhost:5235}"

export SUPER_ADMIN_USERNAME SUPER_ADMIN_PASSWORD APISERVER_JWT_SECRET_KEY VITE_MCP_GATEWAY_BASE_URL

# Use local writable caches to avoid permission issues
export GOMODCACHE="${UNLA_DIR}/.gomodcache"
export GOCACHE="${UNLA_DIR}/.gocache"
export GOPATH="${UNLA_DIR}/.gopath"
export GOFLAGS="-modcacherw"

echo "[INFO] Using SUPER_ADMIN_USERNAME=${SUPER_ADMIN_USERNAME}"
echo "[INFO] Using VITE_MCP_GATEWAY_BASE_URL=${VITE_MCP_GATEWAY_BASE_URL}"

pushd "${UNLA_DIR}" >/dev/null

# Kill existing if any
for name in apiserver mcp-gateway; do
  if [[ -f ${name}.pid ]]; then
    oldpid=$(cat "${name}.pid" || true)
    if [[ -n "${oldpid}" ]] && ps -p "${oldpid}" >/dev/null 2>&1; then
      echo "[INFO] Stopping existing ${name} (PID ${oldpid})"
      kill "${oldpid}" || true
      sleep 1
    fi
    rm -f "${name}.pid"
  fi
done

echo "[INFO] Starting Unla apiserver on :5234"
nohup go run cmd/apiserver/main.go -c configs/apiserver.yaml \
  > apiserver.out 2>&1 & echo $! > apiserver.pid

sleep 1

echo "[INFO] Starting Unla mcp-gateway on :5235"
nohup go run cmd/mcp-gateway/main.go -c configs/mcp-gateway.yaml \
  > mcp-gateway.out 2>&1 & echo $! > mcp-gateway.pid

echo "[INFO] Unla started. PIDs: apiserver=$(cat apiserver.pid), gateway=$(cat mcp-gateway.pid)"
echo "[INFO] Logs: ${UNLA_DIR}/apiserver.out, ${UNLA_DIR}/mcp-gateway.out"
echo "[INFO] Health: curl http://127.0.0.1:5234/health ; curl http://127.0.0.1:5235/health_check"

popd >/dev/null
