#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "${SCRIPT_DIR}/unla_env.sh"

cd "${SCRIPT_DIR%/scripts}/Unla"

echo "[APISERVER] Pre-fetch Go modules (first run may take a while)..."
go mod download

echo "[APISERVER] Starting on :5234"
exec go run cmd/apiserver/main.go -c configs/apiserver.yaml

