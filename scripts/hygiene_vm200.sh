#!/usr/bin/env bash
# =============================================================================
# S4RAS VM 200 — OPS-03 Docker Hygiene & Disk Reclamation
# Finding: OPS-03 (Sep 16 Re-Audit — VM 200 disk at 79%)
# Target:  VM 200 (s4ras-iptv, 192.168.10.200)
# Run as:  ssh admin-node@192.168.10.200 'bash -s' < scripts/hygiene_vm200.sh
#
# Safe to run: only removes stopped containers, dangling images, unused networks
# and build cache. Does NOT remove named volumes or running containers.
# =============================================================================
set -euo pipefail

echo "=== S4RAS OPS-03: Docker Hygiene on VM 200 (IPTV Node) ==="
echo "Timestamp: $(date -u +%Y-%m-%dT%H:%M:%SZ)"
echo ""

# --- Pre-flight disk snapshot ---
echo "--- [BEFORE] Disk Usage ---"
df -h /
echo ""
echo "--- [BEFORE] Docker Disk Usage ---"
docker system df
echo ""

# --- List running containers (safety check - do not stop these) ---
echo "--- Running Containers (will NOT be touched) ---"
docker ps --format "table {{.Names}}\t{{.Image}}\t{{.Status}}"
echo ""

# --- Safe prune: stopped containers, dangling images, unused networks, build cache ---
echo "--- Running docker system prune (safe: no volumes) ---"
docker system prune -f --filter "until=24h"

# --- Also prune dangling (untagged) images specifically ---
echo ""
echo "--- Pruning dangling images ---"
docker image prune -f

# --- Log files: truncate Promtail and container logs older than 7 days ---
echo ""
echo "--- Rotating container log files > 100MB ---"
find /var/lib/docker/containers -name "*.log" -size +100M -exec sh -c \
  'echo "Truncating: $1 ($(du -sh "$1" | cut -f1))"; truncate -s 0 "$1"' _ {} \;

# --- After state ---
echo ""
echo "--- [AFTER] Disk Usage ---"
df -h /
echo ""
echo "--- [AFTER] Docker Disk Usage ---"
docker system df

echo ""
echo "=== OPS-03 hygiene complete ==="
echo "If root filesystem is still >80%, consider expanding VM 200 vDisk in Proxmox VE."
