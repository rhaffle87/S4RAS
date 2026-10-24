#!/usr/bin/env bash
# ==============================================================================
# S4RAS VoIP PBX — PJSIP Configuration Secret Provisioning Script
# Target: VM 202 (Asterisk 22) / VM 201 (Asterisk 20)
# Purpose: Replaces <SIP_SECRET_XXXX> placeholders from environment variables
#          before Asterisk reloads or starts up.
# ==============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONFIG_DIR="${SCRIPT_DIR}/../config"
SOURCE_CONF="${CONFIG_DIR}/pjsip.conf"
DEST_CONF="${1:-/etc/asterisk/pjsip.conf}"

echo "[S4RAS VoIP] Provisioning PJSIP credentials from environment variables..."

# Require minimum secrets or fallback safely
SIP_SECRET_1001="${SIP_SECRET_1001:-}"
SIP_SECRET_1002="${SIP_SECRET_1002:-}"
SIP_SECRET_1003="${SIP_SECRET_1003:-}"
SIP_SECRET_1004="${SIP_SECRET_1004:-}"
SIP_SECRET_1005="${SIP_SECRET_1005:-}"
SIP_SECRET_1074700="${SIP_SECRET_1074700:-}"

if [[ -z "$SIP_SECRET_1001" ]]; then
  echo "[WARNING] SIP_SECRET_1001 is empty. Ensure environment is loaded from .env"
fi

# Render configuration safely to destination
sed \
  -e "s/<SIP_SECRET_1001>/${SIP_SECRET_1001}/g" \
  -e "s/<SIP_SECRET_1002>/${SIP_SECRET_1002}/g" \
  -e "s/<SIP_SECRET_1003>/${SIP_SECRET_1003}/g" \
  -e "s/<SIP_SECRET_1004>/${SIP_SECRET_1004}/g" \
  -e "s/<SIP_SECRET_1005>/${SIP_SECRET_1005}/g" \
  -e "s/<SIP_SECRET_1074700>/${SIP_SECRET_1074700}/g" \
  "${SOURCE_CONF}" > "${DEST_CONF}"

chmod 640 "${DEST_CONF}"
echo "[S4RAS VoIP] Successfully rendered ${DEST_CONF}."
