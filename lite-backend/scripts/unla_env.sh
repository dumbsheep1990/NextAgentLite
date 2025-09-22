#!/usr/bin/env bash
# Common environment for running Unla locally (non-Docker)

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
UNLA_DIR="${SCRIPT_DIR%/scripts}/Unla"

mkdir -p "${UNLA_DIR}/.gomodcache" "${UNLA_DIR}/.gocache" "${UNLA_DIR}/.gopath"

# Load project-level .env if present
if [[ -f "${UNLA_DIR}/.env" ]]; then
  set -a
  # shellcheck disable=SC1090
  source "${UNLA_DIR}/.env"
  set +a
fi

# Admin & runtime defaults (override before sourcing if needed)
: "${SUPER_ADMIN_USERNAME:=admin}"
: "${SUPER_ADMIN_PASSWORD:=admin}"
: "${APISERVER_JWT_SECRET_KEY:=local-dev-key}"

# Web runtime config for UI
: "${VITE_MCP_GATEWAY_BASE_URL:=http://localhost:5235}"

export SUPER_ADMIN_USERNAME SUPER_ADMIN_PASSWORD APISERVER_JWT_SECRET_KEY VITE_MCP_GATEWAY_BASE_URL
export APISERVER_EMBEDDED_MODE=${APISERVER_EMBEDDED_MODE:-true}

# If backend SECRET_KEY is present and Unla JWT secret is not explicitly set, reuse it
if [[ -n "${SECRET_KEY:-}" && -z "${APISERVER_JWT_SECRET_KEY:-}" ]]; then
  export APISERVER_JWT_SECRET_KEY="${SECRET_KEY}"
fi

# Local writable Go caches to avoid permission issues
export GOMODCACHE="${UNLA_DIR}/.gomodcache"
export GOCACHE="${UNLA_DIR}/.gocache"
export GOPATH="${UNLA_DIR}/.gopath"
export GOFLAGS="-modcacherw"
# Allow Go to auto-download the requested toolchain from go.mod (go 1.24.x)
export GOTOOLCHAIN=auto

# Optional proxy to speed up downloads (uncomment if needed)
# export GOPROXY="https://goproxy.cn,direct"

# PID files and signal PIDs should be writable; override defaults under /var/run
export MCP_GATEWAY_PID="${UNLA_DIR}/mcp-gateway.pid"
export APISERVER_NOTIFIER_SIGNAL_PID="${UNLA_DIR}/mcp-gateway.pid"
export NOTIFIER_SIGNAL_PID="${UNLA_DIR}/mcp-gateway.pid"

# Optional: uncomment for CN mirror acceleration
# export GOPROXY="https://goproxy.cn,direct"

echo "[UNLA ENV] SUPER_ADMIN_USERNAME=${SUPER_ADMIN_USERNAME}"
echo "[UNLA ENV] VITE_MCP_GATEWAY_BASE_URL=${VITE_MCP_GATEWAY_BASE_URL}"
echo "[UNLA ENV] GOMODCACHE=${GOMODCACHE}"
