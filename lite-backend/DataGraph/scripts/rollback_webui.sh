#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR=$(cd "$(dirname "$0")/.." && pwd)
OUT_DIR="$ROOT_DIR/lightrag/api/webui"
BACKUP_DIR="$ROOT_DIR/backups"

if [[ $# -lt 1 ]]; then
  echo "Usage: $0 <backup-folder-name>"
  echo "Backups under: $BACKUP_DIR"
  exit 1
fi

BK="$BACKUP_DIR/$1"
if [[ ! -d "$BK" ]]; then
  echo "Backup not found: $BK"
  exit 2
fi

echo "[Rollback] Restoring $BK → $OUT_DIR"
rm -rf "$OUT_DIR"
cp -a "$BK" "$OUT_DIR"
echo "[Done]"

