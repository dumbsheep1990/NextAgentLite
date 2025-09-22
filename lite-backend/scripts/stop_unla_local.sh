#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
UNLA_DIR="${SCRIPT_DIR%/scripts}/Unla"

pushd "${UNLA_DIR}" >/dev/null

stopped=0
for name in apiserver mcp-gateway; do
  if [[ -f ${name}.pid ]]; then
    pid=$(cat "${name}.pid" || true)
    if [[ -n "${pid}" ]] && ps -p "${pid}" >/dev/null 2>&1; then
      echo "[INFO] Stopping ${name} (PID ${pid})"
      kill "${pid}" || true
      stopped=$((stopped+1))
    fi
    rm -f "${name}.pid"
  fi
done

echo "[INFO] Stopped ${stopped} process(es)."

popd >/dev/null

