#!/usr/bin/env bash
# =============================================================================
# S4RAS - SIP Auth Watchdog (Phase 32.3)
# Purpose: Alert via Alertmanager webhook if Asterisk auth= directives are
#          commented out in pjsip.conf (regression guard for SEC-01).
# Deploy:  VM 202 (s4ras-voip2, 192.168.10.202)
# Install: sudo cp sip_auth_watchdog.sh /usr/local/bin/sip_auth_watchdog.sh
#          sudo chmod +x /usr/local/bin/sip_auth_watchdog.sh
#          Crontab: */15 * * * * /usr/local/bin/sip_auth_watchdog.sh >> /var/log/sip_auth_watchdog.log 2>&1
# =============================================================================
set -euo pipefail

PJSIP_CONF="/etc/asterisk/pjsip.conf"
ALERTMANAGER_URL="http://192.168.10.204:9093/api/v2/alerts"
HOSTNAME_LABEL="s4ras-voip2"
NOW=$(date -u +%Y-%m-%dT%H:%M:%SZ)

# Find inbound auth= lines that are commented out.
# Exclude outbound_auth= (separate, optional directives).
# Exclude pure documentation comment blocks (contain "Authentication object" or example strings).
COMMENTED_AUTHS=$(grep -n '^\s*;.*[^a-z]auth=[^=]' "$PJSIP_CONF" 2>/dev/null \
  | grep -v 'outbound_auth' \
  | grep -v 'Authentication object' \
  | grep -v '"auth="' \
  || true)

if [[ -z "$COMMENTED_AUTHS" ]]; then
  echo "[OK] $NOW - All inbound auth= directives are active in $PJSIP_CONF"
  exit 0
fi

# Count affected endpoints
COUNT=$(echo "$COMMENTED_AUTHS" | wc -l | tr -d ' ')
LINES=$(echo "$COMMENTED_AUTHS" | awk -F: '{print $1}' | tr '\n' ',' | sed 's/,$//')

echo "[ALERT] $NOW - $COUNT commented auth= line(s) found at lines: $LINES"

# Build JSON safely using printf (avoids special-char injection from grep output)
SUMMARY="Asterisk inbound auth= disabled on $HOSTNAME_LABEL ($COUNT endpoints)"
DESCRIPTION="Found $COUNT commented-out inbound auth= in $PJSIP_CONF at lines [$LINES]. Unauthenticated SIP registration possible (SEC-01 regression). Fix: uncomment auth= then run: asterisk -rx pjsip reload"

PAYLOAD=$(printf '[{"labels":{"alertname":"AsteriskSIPAuthDisabled","severity":"critical","instance":"%s","job":"asterisk-watchdog"},"annotations":{"summary":"%s","description":"%s","runbook_url":"https://github.com/rhaffle87/s4ras/blob/main/docs/operations/OPERATIONAL_RUNBOOK.md"},"startsAt":"%s"}]' \
  "$HOSTNAME_LABEL" "$SUMMARY" "$DESCRIPTION" "$NOW")

curl -s -X POST "$ALERTMANAGER_URL" \
  -H "Content-Type: application/json" \
  -d "$PAYLOAD" \
  && echo "[SENT] Alertmanager notified." \
  || echo "[WARN] Alertmanager unreachable at $ALERTMANAGER_URL"

exit 1
