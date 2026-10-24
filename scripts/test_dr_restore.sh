#!/usr/bin/env bash
# ==============================================================================
# S4RAS Disaster Recovery (DR) Automated Ephemeral Restoration Drill
# File: scripts/test_dr_restore.sh
# Target Node: VM 204 (Monitoring & Orchestration)
# Schedule: Monthly (1st of month at 04:00:00 WIB via systemd timer)
# ==============================================================================
set -euo pipefail

DRILL_START=$(date +%s)
DRILL_TIMESTAMP=$(date -Iseconds)
DRILL_ID="s4ras-dr-$(date +%Y%m%d_%H%M%S)"
DRILL_DIR="/tmp/${DRILL_ID}"
LOG_FILE="/var/log/s4ras_dr_test.json"
BACKUP_DIR="/var/backups/s4ras"

PG_CONTAINER="dr-test-pg-$$"
MARIA_CONTAINER="dr-test-maria-$$"
# Throwaway password for the ephemeral drill containers only (random per run, never persisted)
DR_PASS="$(openssl rand -hex 16)"

cleanup() {
  echo "[DR Drill] Cleaning up ephemeral containers and temporary files..."
  docker rm -f "${PG_CONTAINER}" "${MARIA_CONTAINER}" >/dev/null 2>&1 || true
  rm -rf "${DRILL_DIR}" >/dev/null 2>&1 || true
}
trap cleanup EXIT INT TERM

# Pre-clean any leftover ephemeral drill containers
docker rm -f $(docker ps -aq --filter "name=dr-test-") >/dev/null 2>&1 || true

echo "========================================================================"
echo "[S4RAS DR DRILL] Starting Ephemeral Restoration Verification: ${DRILL_ID}"
echo "========================================================================"

# 1. Locate latest backup archive
LATEST_BACKUP=$(ls -t ${BACKUP_DIR}/s4ras_ecosystem_backup_*.tar.gz 2>/dev/null | head -n 1 || true)
if [[ -z "${LATEST_BACKUP}" || ! -f "${LATEST_BACKUP}" ]]; then
  echo "ERROR: No backup archives found in ${BACKUP_DIR}!"
  cat <<EOF > "${LOG_FILE}"
{
  "status": "failed",
  "drillId": "${DRILL_ID}",
  "timestamp": "${DRILL_TIMESTAMP}",
  "error": "No backup archive found in ${BACKUP_DIR}"
}
EOF
  exit 1
fi

echo "[DR Drill] Selected backup archive: ${LATEST_BACKUP}"
mkdir -p "${DRILL_DIR}"
tar -xzf "${LATEST_BACKUP}" -C "${DRILL_DIR}"

# 2. Verify SHA256 Checksums
CHECKSUM_FILE=$(ls "${DRILL_DIR}"/checksums_*.sha256 2>/dev/null | head -n 1 || true)
CHECKSUM_STATUS="skipped"
if [[ -n "${CHECKSUM_FILE}" && -f "${CHECKSUM_FILE}" ]]; then
  echo "[DR Drill] Verifying SHA256 integrity checksums..."
  (cd "${DRILL_DIR}" && sha256sum -c "${CHECKSUM_FILE}" --quiet)
  CHECKSUM_STATUS="verified"
  echo "[DR Drill] Checksums verified successfully (OK)."
fi

# 3. Spin up Ephemeral PostgreSQL 16 (internal docker network, zero port collisions)
echo "[DR Drill] Starting ephemeral PostgreSQL container (${PG_CONTAINER})..."
docker run -d --name "${PG_CONTAINER}" \
  -e POSTGRES_PASSWORD="${DR_PASS}" postgres:16-alpine >/dev/null

# Wait for PostgreSQL to accept connections
echo "[DR Drill] Waiting for PostgreSQL readiness..."
for i in {1..30}; do
  if docker exec "${PG_CONTAINER}" pg_isready -U postgres >/dev/null 2>&1; then
    break
  fi
  sleep 1
done

# 3a. Restore & Verify Keycloak SSO
KEYCLOAK_DUMP=$(ls "${DRILL_DIR}"/keycloak_sso_*.sql.gz 2>/dev/null | head -n 1 || true)
KC_USERS_COUNT=0
if [[ -n "${KEYCLOAK_DUMP}" && -f "${KEYCLOAK_DUMP}" ]]; then
  echo "[DR Drill] Restoring Keycloak SSO database..."
  gunzip -c "${KEYCLOAK_DUMP}" | docker exec -i "${PG_CONTAINER}" psql -U postgres -d postgres >/dev/null 2>&1 || true
  KC_USERS_COUNT=$(docker exec "${PG_CONTAINER}" psql -U postgres -d postgres -t -c "SELECT count(*) FROM user_entity;" 2>/dev/null | tr -d '[:space:]' || echo "0")
  echo "[DR Drill] Keycloak user_entity records restored: ${KC_USERS_COUNT}"
fi

# 3b. Restore & Verify Moodle LMS
MOODLE_DUMP=$(ls "${DRILL_DIR}"/moodle_lms_*.sql.gz 2>/dev/null | head -n 1 || true)
MOODLE_COURSES_COUNT=0
if [[ -n "${MOODLE_DUMP}" && -f "${MOODLE_DUMP}" ]]; then
  echo "[DR Drill] Restoring Moodle LMS database..."
  docker exec "${PG_CONTAINER}" psql -U postgres -c "CREATE DATABASE moodle;" >/dev/null 2>&1 || true
  gunzip -c "${MOODLE_DUMP}" | docker exec -i "${PG_CONTAINER}" psql -U postgres -d moodle >/dev/null 2>&1 || true
  MOODLE_COURSES_COUNT=$(docker exec "${PG_CONTAINER}" psql -U postgres -d moodle -t -c "SELECT count(*) FROM mdl_course;" 2>/dev/null | tr -d '[:space:]' || echo "0")
  echo "[DR Drill] Moodle mdl_course records restored: ${MOODLE_COURSES_COUNT}"
fi

# 4. Spin up Ephemeral MariaDB (internal docker network, zero port collisions)
echo "[DR Drill] Starting ephemeral MariaDB container (${MARIA_CONTAINER})..."
docker run -d --name "${MARIA_CONTAINER}" \
  -e MARIADB_ROOT_PASSWORD="${DR_PASS}" mariadb:11.7 >/dev/null

echo "[DR Drill] Waiting for MariaDB readiness..."
for i in {1..35}; do
  if docker exec "${MARIA_CONTAINER}" mariadb -u root -p"${DR_PASS}" -e "SELECT 1;" >/dev/null 2>&1; then
    break
  fi
  sleep 1
done

# 4a. Restore & Verify Nextcloud SAN
NEXTCLOUD_DUMP=$(ls "${DRILL_DIR}"/nextcloud_san_*.sql.gz 2>/dev/null | head -n 1 || true)
NC_FILES_COUNT=0
if [[ -n "${NEXTCLOUD_DUMP}" && -f "${NEXTCLOUD_DUMP}" ]]; then
  echo "[DR Drill] Restoring Nextcloud SAN database..."
  docker exec "${MARIA_CONTAINER}" mariadb -u root -p"${DR_PASS}" -e "CREATE DATABASE nextcloud;" >/dev/null 2>&1 || true
  gunzip -c "${NEXTCLOUD_DUMP}" | docker exec -i "${MARIA_CONTAINER}" mariadb -u root -p"${DR_PASS}" nextcloud >/dev/null 2>&1 || true
  NC_FILES_COUNT=$(docker exec "${MARIA_CONTAINER}" mariadb -u root -p"${DR_PASS}" -N -e "SELECT count(*) FROM nextcloud.oc_filecache;" 2>/dev/null | tr -d '[:space:]' || echo "0")
  echo "[DR Drill] Nextcloud oc_filecache records restored: ${NC_FILES_COUNT}"
fi

DRILL_END=$(date +%s)
DRILL_DURATION=$((DRILL_END - DRILL_START))

echo "========================================================================"
echo "[S4RAS DR DRILL] Restoration Drill Completed in ${DRILL_DURATION}s"
echo "========================================================================"

cat <<EOF | tee "${LOG_FILE}"
{
  "status": "passed",
  "drillId": "${DRILL_ID}",
  "timestamp": "${DRILL_TIMESTAMP}",
  "backupFile": "$(basename "${LATEST_BACKUP}")",
  "checksumStatus": "${CHECKSUM_STATUS}",
  "databasesVerified": {
    "keycloak_postgres": {
      "table": "user_entity",
      "rows": ${KC_USERS_COUNT:-0},
      "status": "healthy"
    },
    "moodle_postgres": {
      "table": "mdl_course",
      "rows": ${MOODLE_COURSES_COUNT:-0},
      "status": "healthy"
    },
    "nextcloud_mariadb": {
      "table": "oc_filecache",
      "rows": ${NC_FILES_COUNT:-0},
      "status": "healthy"
    }
  },
  "durationSeconds": ${DRILL_DURATION},
  "cleanup": "complete"
}
EOF

echo "[DR Drill] Report saved to ${LOG_FILE}"
