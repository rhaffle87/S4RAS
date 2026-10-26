#!/usr/bin/env bash
# =============================================================================
# S4RAS — Cluster-Wide Tailscale Tag & Route Provisioning (tag:s4ras-vm)
# =============================================================================
# NOTE: Ensure the Tailscale ACL with TagOwners, Groups, and SSH rules
#       has been saved in the Tailscale Admin Console BEFORE running this script!
# =============================================================================

set -e

declare -A NODES=(
  ["VM200-IPTV"]="root@100.86.164.92:s4ras-iptv"
  ["VM201-VoIP1"]="root@100.125.250.53:s4ras-voip"
  ["VM202-VoIP2"]="root@100.83.239.40:s4ras-voip2"
  ["VM203-LMS"]="root@100.108.104.25:s4ras-lms"
  ["VM204-Monitor"]="root@100.102.31.45:s4ras-monitor"
  ["VM206-SSO"]="root@100.95.158.77:s4ras-sso"
  ["VM207-SAN"]="root@100.119.6.12:s4ras-san"
  ["VM208-Portal"]="root@100.123.192.3:s4ras-portal"
  ["VM209-Bench"]="root@100.71.250.20:s4ras-benchmark"
)

SSH_OPTS="-o ConnectTimeout=5 -o StrictHostKeyChecking=no -o BatchMode=yes"

echo "================================================================"
echo " S4RAS Tailscale Cluster Tagging -> tag:s4ras-vm"
echo "================================================================"

for NODE in "${!NODES[@]}"; do
  ENTRY="${NODES[$NODE]}"
  TARGET="${ENTRY%%:*}"
  HOSTNAME="${ENTRY##*:}"

  echo -n "[$NODE] Applying tag:s4ras-vm on $HOSTNAME ($TARGET)... "
  
  if ssh $SSH_OPTS "$TARGET" "tailscale up --accept-routes --advertise-tags=tag:s4ras-vm --hostname=$HOSTNAME --ssh" 2>/dev/null; then
    echo "SUCCESS"
  else
    echo "FAILED / TIMEOUT (Check ACL in Tailscale Admin Panel)"
  fi
done

echo "================================================================"
echo "Tagging pass complete. Verifying status..."
echo "================================================================"
