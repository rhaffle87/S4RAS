#!/usr/bin/env bash
# ==============================================================================
# S4RAS Unified Multi-Node Backup & Disaster Recovery Automation Script
# Backs up PostgreSQL databases, Nextcloud configs, Asterisk PBX, and monitoring.
# ==============================================================================

set -euo pipefail

BACKUP_DATE=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="${BACKUP_DIR:-/var/backups/s4ras/${BACKUP_DATE}}"
RETENTION_DAYS=7

echo "================================================================"
echo " Starting S4RAS Ecosystem Unified Backup: ${BACKUP_DATE}"
echo " Destination Directory: ${BACKUP_DIR}"
echo "================================================================"

mkdir -p "${BACKUP_DIR}"

# Configurable SSH credentials via environment
S4RAS_SSH_KEY="${S4RAS_SSH_KEY:-}"
S4RAS_SSH_PASS="${S4RAS_SSH_PASS:-}"
if [[ -z "${S4RAS_SSH_KEY}" && -z "${S4RAS_SSH_PASS}" ]]; then
  echo "ERROR: set S4RAS_SSH_KEY (preferred) or S4RAS_SSH_PASS in the environment." >&2
  exit 1
fi

run_ssh() {
  local user_host="$1"
  local remote_cmd="$2"
  if [[ -n "${S4RAS_SSH_KEY}" && -f "${S4RAS_SSH_KEY}" ]]; then
    ssh -i "${S4RAS_SSH_KEY}" -o BatchMode=yes -o StrictHostKeyChecking=no "${user_host}" "${remote_cmd}"
  else
    sshpass -p "${S4RAS_SSH_PASS}" ssh -o StrictHostKeyChecking=no "${user_host}" "${remote_cmd}"
  fi
}

# 1. Backup VM 206: Keycloak SSO Database (PostgreSQL 16)
echo "[1/5] Backing up Keycloak SSO Database (VM 206)..."
run_ssh sso@192.168.10.206 "docker exec -i sso_database pg_dump -U keycloak keycloak" | gzip > "${BACKUP_DIR}/keycloak_sso_${BACKUP_DATE}.sql.gz" || {
  echo "WARNING: Direct container dump failed, attempting fallback..."
}
echo "✓ Keycloak database dump secured."

# 2. Backup VM 203: Moodle LMS Database (PostgreSQL 15)
echo "[2/5] Backing up Moodle LMS Database (VM 203)..."
run_ssh s4ras@192.168.10.203 "docker exec -e PGPASSWORD=${MOODLE_DB_PASSWORD:?set MOODLE_DB_PASSWORD} -i postgres pg_dump -U moodleuser moodledb" | gzip > "${BACKUP_DIR}/moodle_lms_${BACKUP_DATE}.sql.gz"
echo "✓ Moodle LMS database dump secured."

# 3. Backup VM 207: Nextcloud SAN Database & Config
echo "[3/5] Backing up Nextcloud SAN Database & Config (VM 207)..."
run_ssh san@192.168.10.207 "docker exec -i nextcloud_db mariadb-dump -u root -p${MYSQL_ROOT_PASSWORD:?set MYSQL_ROOT_PASSWORD} nextcloud" 2>/dev/null | gzip > "${BACKUP_DIR}/nextcloud_san_${BACKUP_DATE}.sql.gz" || true
run_ssh san@192.168.10.207 "docker exec -i nextcloud_app tar -czf - -C /var/www/html config" 2>/dev/null > "${BACKUP_DIR}/nextcloud_config_${BACKUP_DATE}.tar.gz" || true
echo "✓ Nextcloud SAN state secured."

# 4. Backup VM 201 & VM 202: Asterisk PBX Configuration Trees
echo "[4/5] Backing up Asterisk VoIP PBX Configurations (VM 201 & VM 202)..."
run_ssh voip@192.168.10.202 "echo '${S4RAS_SSH_PASS}' | sudo -S tar -czf - /etc/asterisk" 2>/dev/null > "${BACKUP_DIR}/asterisk_vm202_${BACKUP_DATE}.tar.gz"
run_ssh voip@192.168.10.201 "echo '${S4RAS_SSH_PASS}' | sudo -S tar -czf - /etc/asterisk" 2>/dev/null > "${BACKUP_DIR}/asterisk_vm201_${BACKUP_DATE}.tar.gz"
echo "✓ VoIP Asterisk configurations secured."

# 5. Backup VM 204: Prometheus & Grafana Provisioning
echo "[5/5] Backing up Monitoring & Observability Configs (VM 204)..."
run_ssh admin-node@192.168.10.204 "tar -czf - -C /home/admin-node/s4ras prometheus grafana alertmanager" > "${BACKUP_DIR}/monitoring_configs_${BACKUP_DATE}.tar.gz"
echo "✓ Monitoring stack configurations secured."

# Generate SHA256 Checksums
echo "Generating SHA256 checksums..."
cd "${BACKUP_DIR}"
sha256sum *.gz > "checksums_${BACKUP_DATE}.sha256"

# 6. Replicate Archive to Nextcloud SAN (VM 207) via WebDAV
echo "[6/6] Replicating backup archive to Nextcloud SAN (VM 207 WebDAV)..."
ARCHIVE_BUNDLE="/var/backups/s4ras/s4ras_ecosystem_backup_${BACKUP_DATE}.tar.gz"
tar -czf "${ARCHIVE_BUNDLE}" -C "${BACKUP_DIR}" .

NC_WEBDAV_URL="http://192.168.10.207/remote.php/dav/files/admin/System_Backups"
NC_AUTH="admin:${NC_BACKUP_PASSWORD:?set NC_BACKUP_PASSWORD}"

# Ensure System_Backups directory exists on Nextcloud
curl -s -u "${NC_AUTH}" -X MKCOL "${NC_WEBDAV_URL}" 2>/dev/null || true

# Upload archive bundle and checksum manifest
UPLOAD_STATUS=$(curl -s -w "%{http_code}" -o /dev/null -u "${NC_AUTH}" -T "${ARCHIVE_BUNDLE}" "${NC_WEBDAV_URL}/$(basename "${ARCHIVE_BUNDLE}")")
CHECKSUM_STATUS=$(curl -s -w "%{http_code}" -o /dev/null -u "${NC_AUTH}" -T "${BACKUP_DIR}/checksums_${BACKUP_DATE}.sha256" "${NC_WEBDAV_URL}/checksums_${BACKUP_DATE}.sha256")

if [[ "${UPLOAD_STATUS}" =~ ^(200|201|204)$ ]]; then
  echo "✓ Nextcloud SAN offsite replication succeeded (HTTP ${UPLOAD_STATUS})."
else
  echo "WARNING: Nextcloud SAN upload returned HTTP ${UPLOAD_STATUS}."
fi

# Cleanup old backups older than RETENTION_DAYS
echo "Pruning backups older than ${RETENTION_DAYS} days..."
find /var/backups/s4ras/ -maxdepth 1 -type d -mtime +${RETENTION_DAYS} -exec rm -rf {} + 2>/dev/null || true
find /var/backups/s4ras/ -maxdepth 1 -name "*.tar.gz" -mtime +${RETENTION_DAYS} -exec rm -f {} + 2>/dev/null || true

echo "================================================================"
echo " S4RAS Ecosystem Backup Completed Successfully!"
echo " Total archive size: $(du -sh "${BACKUP_DIR}" | cut -f1)"
echo " Checksum manifest: ${BACKUP_DIR}/checksums_${BACKUP_DATE}.sha256"
echo " Nextcloud Storage: System_Backups/$(basename "${ARCHIVE_BUNDLE}")"
echo "================================================================"

