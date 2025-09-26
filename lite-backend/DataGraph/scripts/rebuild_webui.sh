#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR=$(cd "$(dirname "$0")/.." && pwd)
WEBUI_DIR="$ROOT_DIR/matgraph_webui"
OUT_DIR="$ROOT_DIR/lightrag/api/webui"
BACKUP_DIR="$ROOT_DIR/backups"
TS=$(date +%Y%m%d_%H%M%S)

echo "[DataGraph] Rebuild matgraph_webui → $OUT_DIR"
mkdir -p "$BACKUP_DIR"

if [[ -d "$OUT_DIR" ]]; then
  BK="$BACKUP_DIR/webui_${TS}.bak"
  echo "[Backup] Saving current webui to $BK"
  cp -a "$OUT_DIR" "$BK"
fi

cd "$WEBUI_DIR"

# Prefer existing node_modules to avoid network when possible
if [[ ! -d node_modules ]]; then
  echo "[Install] node_modules missing, running npm ci"
  npm ci
fi

echo "[Build] building webui (prefer bun, fallback to vite)"
if command -v bunx >/dev/null 2>&1; then
  npm run build
else
  echo "[Build] bunx not found, using vite (no-bun script)"
  npm run build-no-bun
fi

echo "[Done] Output at $OUT_DIR"
echo "Rollback with: cp -a \"$BACKUP_DIR/webui_${TS}.bak\" \"$OUT_DIR\" -r"
