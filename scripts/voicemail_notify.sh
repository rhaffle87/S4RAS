#!/bin/bash
# ==============================================================================
# S4RAS Asterisk Voicemail Notification Hook -> Redis Event Mesh Gateway
# Triggered by Asterisk externnotify in /etc/asterisk/voicemail.conf
# Usage: voicemail_notify.sh <context> <mailbox> <new_msgs> <old_msgs> <urgent_msgs>
# ==============================================================================

set -euo pipefail

CONTEXT="${1:-default}"
MAILBOX="${2:-}"
NEW_MSGS="${3:-0}"
OLD_MSGS="${4:-0}"
URGENT_MSGS="${5:-0}"

WEBHOOK_URL="http://192.168.10.208:3000/api/webhooks/event"
# Secret is read from the environment or from a root-only file; never hardcode it here.
WEBHOOK_SECRET="${S4RAS_WEBHOOK_SECRET:-$(cat /etc/s4ras/webhook_secret 2>/dev/null || true)}"
if [ -z "${WEBHOOK_SECRET}" ]; then
  echo "ERROR: webhook secret not set (S4RAS_WEBHOOK_SECRET or /etc/s4ras/webhook_secret)" >&2
  exit 1
fi

if [ -z "${MAILBOX}" ]; then
  echo "Usage: $0 <context> <mailbox> [new_msgs] [old_msgs] [urgent_msgs]" >&2
  exit 1
fi

TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
PAYLOAD=$(cat <<EOF
{
  "type": "voicemail.new",
  "service": "voip",
  "title": "Pesan Suara Baru di Mailbox ${MAILBOX}",
  "title_id": "Pesan Suara Baru di Mailbox ${MAILBOX}",
  "title_en": "New Voicemail in Mailbox ${MAILBOX}",
  "message": "Mailbox ${MAILBOX} memiliki ${NEW_MSGS} pesan baru (total: $((NEW_MSGS + OLD_MSGS))).",
  "message_id": "Mailbox ${MAILBOX} memiliki ${NEW_MSGS} pesan baru (total: $((NEW_MSGS + OLD_MSGS))).",
  "message_en": "Mailbox ${MAILBOX} has ${NEW_MSGS} new message(s) (total: $((NEW_MSGS + OLD_MSGS))).",
  "severity": "info",
  "meta": {
    "mailbox": "${MAILBOX}",
    "context": "${CONTEXT}",
    "newMessages": ${NEW_MSGS},
    "oldMessages": ${OLD_MSGS},
    "urgentMessages": ${URGENT_MSGS}
  },
  "timestamp": "${TIMESTAMP}"
}
EOF
)

curl -s -X POST "${WEBHOOK_URL}" \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Secret: ${WEBHOOK_SECRET}" \
  -d "${PAYLOAD}" > /dev/null 2>&1 || true

echo "Voicemail notification dispatched for mailbox ${MAILBOX}."
