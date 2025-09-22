#!/usr/bin/env bash
set -euo pipefail

# Configure Unla .env to use the backend Postgres from backend .env/.env.local

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
BACKEND_ENV_LOCAL="${ROOT_DIR}/.env.local"
BACKEND_ENV="${ROOT_DIR}/.env"
UNLA_ENV="${ROOT_DIR}/Unla/.env"

pick_env_file() {
  if [[ -f "$BACKEND_ENV_LOCAL" ]]; then echo "$BACKEND_ENV_LOCAL"; return; fi
  if [[ -f "$BACKEND_ENV" ]]; then echo "$BACKEND_ENV"; return; fi
  echo ""; return
}

ENV_FILE="$(pick_env_file)"
if [[ -z "$ENV_FILE" ]]; then
  echo "[ERROR] backend .env or .env.local not found under ${ROOT_DIR}" >&2
  exit 1
fi

# Prefer DB_URL or POSTGRESQL_* from backend .env; fallback to DATABASE_URL
DBURL=$(grep -E '^(DB_URL|DATABASE_URL)=' "$ENV_FILE" | head -n1 | sed -E 's/^[A-Z_]+=//; s/"//g') || true
POST_HOST=$(grep -E '^POSTGRESQL_HOST=' "$ENV_FILE" | sed -E 's/^POSTGRESQL_HOST=//; s/"//g' || true)
POST_PORT=$(grep -E '^POSTGRESQL_PORT=' "$ENV_FILE" | sed -E 's/^POSTGRESQL_PORT=//; s/"//g' || true)
POST_DB=$(grep -E '^POSTGRESQL_DATABASE=' "$ENV_FILE" | sed -E 's/^POSTGRESQL_DATABASE=//; s/"//g' || true)
POST_USER=$(grep -E '^POSTGRESQL_USERNAME=' "$ENV_FILE" | sed -E 's/^POSTGRESQL_USERNAME=//; s/"//g' || true)
POST_PASS=$(grep -E '^POSTGRESQL_PASSWORD=' "$ENV_FILE" | sed -E 's/^POSTGRESQL_PASSWORD=//; s/"//g' || true)

if [[ -n "$POST_HOST" && -n "$POST_PORT" && -n "$POST_DB" && -n "$POST_USER" ]]; then
  host="$POST_HOST"; port="$POST_PORT"; dbname="$POST_DB"; user="$POST_USER"; pass="$POST_PASS"
  echo "[INFO] Using POSTGRESQL_* from backend env: $host:$port/$dbname"
else
  if [[ -z "$DBURL" ]]; then
    echo "[ERROR] Neither POSTGRESQL_* nor (DB_URL|DATABASE_URL) found in $ENV_FILE" >&2
    exit 1
  fi
  proto=${DBURL%%://*}
  rest=${DBURL#*://}
  userpass=${rest%%@*}
  hostdb=${rest#*@}
  hostport=${hostdb%%/*}
  dbname=${hostdb#*/}
  user=${userpass%%:*}
  pass=${userpass#*:}
  host=${hostport%%:*}
  port=${hostport#*:}
  if [[ "$proto" != "postgresql" ]]; then
    echo "[ERROR] Only postgresql:// URLs are supported, got: $proto" >&2
    exit 1
  fi
  echo "[INFO] Using URL from backend env: $DBURL"
fi
echo "[INFO] Parsed -> host=$host port=$port user=$user db=$dbname"

tmpfile="${UNLA_ENV}.tmp"
cp "$UNLA_ENV" "$tmpfile"

ed -s "$tmpfile" << ED_CMDS
g/^APISERVER_DB_TYPE=/s//APISERVER_DB_TYPE=postgres/
g/^APISERVER_DB_HOST=/s//APISERVER_DB_HOST=$host/
g/^APISERVER_DB_PORT=/s//APISERVER_DB_PORT=$port/
g/^APISERVER_DB_USER=/s//APISERVER_DB_USER=$user/
g/^APISERVER_DB_PASSWORD=/s//APISERVER_DB_PASSWORD=$pass/
g/^APISERVER_DB_NAME=/s//APISERVER_DB_NAME=$dbname/
g/^GATEWAY_DB_TYPE=/s//GATEWAY_DB_TYPE=postgres/
g/^GATEWAY_DB_HOST=/s//GATEWAY_DB_HOST=$host/
g/^GATEWAY_DB_PORT=/s//GATEWAY_DB_PORT=$port/
g/^GATEWAY_DB_USER=/s//GATEWAY_DB_USER=$user/
g/^GATEWAY_DB_PASSWORD=/s//GATEWAY_DB_PASSWORD=$pass/
g/^GATEWAY_DB_NAME=/s//GATEWAY_DB_NAME=$dbname/
wq
ED_CMDS

mv "$tmpfile" "$UNLA_ENV"
echo "[OK] Updated Unla .env to use backend Postgres: $UNLA_ENV"

exit 0
