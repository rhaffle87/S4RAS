#!/usr/bin/env bash
# =============================================================================
# S4RAS VM 208 — NET-01-R UFW Stale Rule Cleanup
# Finding: NET-01-RESIDUAL (Sep 16 Re-Audit)
# Target:  VM 208 (s4ras-portal, 192.168.10.208)
# Run as:  ssh portal@192.168.10.208 'bash -s' < scripts/fix_ufw_vm208.sh
# =============================================================================
set -euo pipefail

echo "=== S4RAS NET-01-R: UFW Stale Rule Cleanup on VM 208 ==="
echo "Timestamp: $(date -u +%Y-%m-%dT%H:%M:%SZ)"
echo ""

# --- Pre-flight: confirm we are on VM 208 ---
EXPECTED_IP="192.168.10.208"
ACTUAL_IP=$(ip -4 addr show | grep -oP '(?<=inet\s)\d+(\.\d+){3}' | grep "192.168.10" || true)
if [[ "$ACTUAL_IP" != "$EXPECTED_IP" ]]; then
  echo "WARNING: Expected $EXPECTED_IP, detected $ACTUAL_IP. Proceeding anyway..."
fi

echo "--- [BEFORE] Current UFW Status ---"
sudo ufw status numbered
echo ""

# --- Remove stale allow rules (ports with no active listeners) ---
# IMPORTANT: ufw delete by rule spec is safer than by number (numbers shift after each delete)
echo "--- Removing stale allow rules ---"

for PORT in 8080 8089 8888 1080; do
  if sudo ufw status | grep -q "^${PORT}"; then
    echo "[DELETE] Removing stale allow rule for port ${PORT}"
    sudo ufw delete allow ${PORT} 2>/dev/null || echo "  -> Rule for ${PORT} not found, skipping"
  else
    echo "[SKIP] Port ${PORT} rule not present"
  fi
done

echo ""
echo "--- [AFTER] Updated UFW Status ---"
sudo ufw status numbered

echo ""
echo "--- Verifying no processes listen on pruned ports ---"
for PORT in 8080 8089 8888 1080; do
  LISTENERS=$(ss -tlnp | grep ":${PORT} " || true)
  if [[ -n "$LISTENERS" ]]; then
    echo "[WARN] Something IS listening on port ${PORT}:"
    echo "$LISTENERS"
    echo "       Consider re-adding the UFW rule!"
  else
    echo "[OK] Port ${PORT}: no listeners, rule removal confirmed safe."
  fi
done

echo ""
echo "=== NET-01-R remediation complete ==="
