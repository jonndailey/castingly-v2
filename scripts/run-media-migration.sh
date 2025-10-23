#!/usr/bin/env bash
set -euo pipefail

# Persistent Castingly → DMAPI migration runner
# Runs in batches with backoff to avoid rate limits; logs to scripts/migration-run.log

LOG_FILE="$(dirname "$0")/migration-run.log"
touch "$LOG_FILE"

echo "[$(date -Is)] Starting migration runner" | tee -a "$LOG_FILE"

# Ensure SSH tunnel to coredb1 (used for Core + DMAPI DB)
if ! lsof -iTCP:3309 -sTCP:LISTEN >/dev/null 2>&1; then
  ssh -fN -L 3309:127.0.0.1:3306 coredb1
fi

ROOTPW=$(ssh -o BatchMode=yes coredb1 "sudo cat /root/.mysql_root_pw" 2>/dev/null)

export DMAPI_BASE_URL=${DMAPI_BASE_URL:-https://media.dailey.cloud}
export DAILEY_CORE_AUTH_URL=${DAILEY_CORE_AUTH_URL:-https://core.dailey.cloud}
export DMAPI_SERVICE_EMAIL=${DMAPI_SERVICE_EMAIL:-dmapi-service@castingly.com}
export DMAPI_SERVICE_PASSWORD=${DMAPI_SERVICE_PASSWORD:-castingly_dmapi_service_2025}
export DMAPI_APP_SLUG=${DMAPI_APP_SLUG:-dailey-media-api}
export DMAPI_APP_ID=${DMAPI_APP_ID:-castingly}

# Live DBs via tunnel
export AUTH_DB_HOST=127.0.0.1
export AUTH_DB_PORT=3309
export AUTH_DB_USER=root
export AUTH_DB_PASSWORD="$ROOTPW"
export AUTH_DB_NAME=dailey_core_auth

export DMAPI_DB_HOST=127.0.0.1
export DMAPI_DB_PORT=3309
export DMAPI_DB_USER=root
export DMAPI_DB_PASSWORD="$ROOTPW"
export DMAPI_DB_NAME=dailey_media

# Legacy source (local)
export DB_HOST=${DB_HOST:-127.0.0.1}
export DB_PORT=${DB_PORT:-3306}
export DB_USER=${DB_USER:-nikon}
export DB_PASSWORD=${DB_PASSWORD:-@0509man1hattaN}
export DB_NAME=${DB_NAME:-casting_portal}

# Throttling
export DMAPI_MIGRATION_DELAY_MS=${DMAPI_MIGRATION_DELAY_MS:-300}
export DMAPI_RATE_LIMIT_WAIT_MS=${DMAPI_RATE_LIMIT_WAIT_MS:-10000}
export DMAPI_RATE_LIMIT_RETRIES=${DMAPI_RATE_LIMIT_RETRIES:-4}

run_batch() {
  local start_at="$1" limit="$2"
  echo "[$(date -Is)] Batch start-at=${start_at} limit=${limit}" | tee -a "$LOG_FILE"
  node "$(dirname "$0")/migrate-media-to-dmapi.mjs" --start-at "$start_at" --limit "$limit" >> "$LOG_FILE" 2>&1 || true
  echo "[$(date -Is)] Batch complete start-at=${start_at}" | tee -a "$LOG_FILE"
}

# Coarse sweeps across the ID space (idempotent)
run_batch 1 800
run_batch 800 800
run_batch 1600 800
run_batch 2400 800

echo "[$(date -Is)] Migration runner finished" | tee -a "$LOG_FILE"

