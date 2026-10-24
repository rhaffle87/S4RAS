#!/usr/bin/env bash
# =============================================================================
# S4RAS — Cluster-Wide UFW Audit (Phase 32.5)
# Purpose: SSH into all 10 cluster VMs and output UFW allow rule matrix.
#          Run from any machine with SSH access to the LAN or Tailscale.
# Usage:   bash scripts/verify_ufw_cluster.sh
# Output:  Table of UFW status per VM + warnings for missing LAN rule
# =============================================================================

# VM inventory: ID -> SSH target (prefer Tailscale IP for reliability)
declare -A VMS=(
  ["VM200-IPTV"]="root@100.64.0.10"
  ["VM201-VoIP1"]="root@100.64.0.11"
  ["VM202-VoIP2"]="root@100.64.0.12"
  ["VM203-LMS"]="root@100.64.0.13"
  ["VM204-Monitor"]="root@100.64.0.14"
  ["VM206-SSO"]="root@100.64.0.16"
  ["VM207-SAN"]="root@100.64.0.17"
  ["VM208-Portal"]="root@100.64.0.18"
  ["VM209-Bench"]="root@100.64.0.19"
)

SSH_OPTS="-o ConnectTimeout=5 -o StrictHostKeyChecking=no -o BatchMode=yes"
LAN_SUBNET="192.168.10.0/24"
PASS=0
WARN=0
FAIL=0

echo "================================================================"
echo " S4RAS Cluster UFW Audit — $(date -u +%Y-%m-%dT%H:%M:%SZ)"
echo "================================================================"
printf "%-20s %-8s %-12s %s\n" "NODE" "UFW" "LAN RULE" "OPEN PORTS"
echo "----------------------------------------------------------------"

for NODE in "${!VMS[@]}"; do
  TARGET="${VMS[$NODE]}"

  # Get UFW status
  UFW_STATUS=$(ssh $SSH_OPTS "$TARGET" "sudo ufw status" 2>/dev/null || echo "UNREACHABLE")

  if [[ "$UFW_STATUS" == "UNREACHABLE" ]]; then
    printf "%-20s %-8s %-12s %s\n" "$NODE" "ERR" "UNKNOWN" "SSH failed"
    ((FAIL++))
    continue
  fi

  UFW_ACTIVE=$(echo "$UFW_STATUS" | grep -q "Status: active" && echo "active" || echo "INACTIVE")
  LAN_RULE=$(echo "$UFW_STATUS" | grep -q "$LAN_SUBNET" && echo "PRESENT" || echo "MISSING ⚠️")
  OPEN_PORTS=$(echo "$UFW_STATUS" | grep "ALLOW IN" | awk '{print $1}' | tr '\n' ' ' | sed 's/ $//')

  printf "%-20s %-8s %-12s %s\n" "$NODE" "$UFW_ACTIVE" "$LAN_RULE" "$OPEN_PORTS"

  [[ "$UFW_ACTIVE" == "active" ]] && ((PASS++)) || ((FAIL++))
  [[ "$LAN_RULE" == "MISSING ⚠️" ]] && ((WARN++))
done

echo "================================================================"
echo " Results: $PASS active | $WARN missing LAN rule | $FAIL unreachable"
echo "================================================================"

# Exit non-zero if any VM is unreachable or UFW inactive
[[ $FAIL -gt 0 ]] && exit 1 || exit 0
