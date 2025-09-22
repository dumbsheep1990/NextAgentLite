#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "${SCRIPT_DIR}/unla_env.sh"

cd "${SCRIPT_DIR%/scripts}/Unla"

echo "[GATEWAY] Pre-fetch Go modules (first run may take a while)..."
go mod download

echo "[GATEWAY] Starting on :5235"
exec go run cmd/mcp-gateway/main.go -c configs/mcp-gateway.yaml

