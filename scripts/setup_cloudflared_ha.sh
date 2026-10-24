#!/bin/bash
# ==============================================================================
# S4RAS Cloudflare Tunnel High Availability (HA) Ingress Provisioner
# Target: Secondary Edge Node (VM 204: s4ras-monitor or VM 207: s4ras-san)
# ==============================================================================

set -euo pipefail

TUNNEL_ID="78629ec0-c848-4003-a94e-1d072d1db100"
CONFIG_PATH="/etc/cloudflared/config.yml"
CRED_SOURCE="${1:-}" # Optional path to credentials json

echo "=========================================================="
echo " S4RAS Cloudflare Tunnel Secondary HA Connector Setup"
echo " Tunnel ID: ${TUNNEL_ID}"
echo "=========================================================="

if [ "$EUID" -ne 0 ]; then
  echo "Error: This script must be run as root or with sudo." >&2
  exit 1
fi

# 1. Install cloudflared if not present
if ! command -v cloudflared &>/dev/null; then
  echo "[1/4] Installing cloudflared package..."
  mkdir -p --mode=0755 /etc/apt/keyrings
  curl -fsSL https://pkg.cloudflare.com/cloudflare-main.gpg | tee /etc/apt/keyrings/cloudflare-main.gpg >/dev/null
  echo "deb [signed-by=/etc/apt/keyrings/cloudflare-main.gpg] https://pkg.cloudflare.com/cloudflared $(lsb_release -cs) main" | tee /etc/apt/sources.list.d/cloudflared.list
  apt-get update -y && apt-get install -y cloudflared
else
  echo "[1/4] cloudflared is already installed."
fi

# 2. Setup directory and credentials
echo "[2/4] Setting up credentials directory..."
mkdir -p /etc/cloudflared

if [ -n "${CRED_SOURCE}" ] && [ -f "${CRED_SOURCE}" ]; then
  cp "${CRED_SOURCE}" "/etc/cloudflared/${TUNNEL_ID}.json"
  chmod 600 "/etc/cloudflared/${TUNNEL_ID}.json"
  echo "Credentials imported from ${CRED_SOURCE}."
elif [ ! -f "/etc/cloudflared/${TUNNEL_ID}.json" ]; then
  echo "Notice: Please copy ${TUNNEL_ID}.json to /etc/cloudflared/ before starting the service."
fi

# 3. Write HA config routing to cluster LAN IPs
echo "[3/4] Writing High Availability ingress config to ${CONFIG_PATH}..."
cat << 'EOF' > "${CONFIG_PATH}"
tunnel: 78629ec0-c848-4003-a94e-1d072d1db100
credentials-file: /etc/cloudflared/78629ec0-c848-4003-a94e-1d072d1db100.json

ingress:
  - hostname: s4ras.site
    service: http://192.168.10.208:3000
  - hostname: portal.s4ras.site
    service: http://192.168.10.208:3000
  - hostname: sso.s4ras.site
    service: http://192.168.10.206:8080
  - hostname: cloud.s4ras.site
    service: http://192.168.10.207:80
  - hostname: moodle.s4ras.site
    service: http://192.168.10.203:80
  - hostname: iptv.s4ras.site
    service: http://192.168.10.200:8096
  - hostname: dispatcharr.s4ras.site
    service: http://192.168.10.200:9191
  - hostname: request.s4ras.site
    service: http://192.168.10.200:5055
  - hostname: voip.s4ras.site
    service: http://192.168.10.202:80
  - hostname: monitor.s4ras.site
    service: http://192.168.10.204:3000
  - hostname: status.s4ras.site
    service: http://192.168.10.204:3001
  - hostname: benchmark.s4ras.site
    service: http://192.168.10.209:8088
  - service: http_status:404
EOF

# 4. Install systemd service
echo "[4/4] Installing and enabling cloudflared service..."
if [ -f "/etc/cloudflared/${TUNNEL_ID}.json" ]; then
  cloudflared service install || true
  systemctl daemon-reload
  systemctl enable cloudflared
  systemctl restart cloudflared
  echo "✓ Cloudflare Tunnel HA connector active and synchronized."
else
  echo "✓ Config written. Install service after placing /etc/cloudflared/${TUNNEL_ID}.json with:"
  echo "    sudo cloudflared service install && sudo systemctl enable --now cloudflared"
fi
