#!/bin/bash
# ==============================================================================
# S4RAS VoIP PBX Active-Passive Standby Synchronization
# VM 202 (Primary) -> VM 201 (Standby)
# ==============================================================================
set -euo pipefail

STANDBY_IP="192.168.10.201"

echo "[1/3] Verifying Standby Asterisk Reachability..."
if ! ssh -o BatchMode=yes -o StrictHostKeyChecking=no root@"${STANDBY_IP}" "asterisk -rx 'core show version'" >/dev/null 2>&1; then
    echo "Error: Standby node ${STANDBY_IP} is unreachable." >&2
    exit 1
fi
echo "✓ Standby node verified active."

echo "[2/3] Syncing voicemail configurations..."
grep -E '^[0-9]+ =>' /etc/asterisk/voicemail.conf > /tmp/primary_mailboxes.txt
scp -o BatchMode=yes -o StrictHostKeyChecking=no /tmp/primary_mailboxes.txt root@"${STANDBY_IP}":/tmp/primary_mailboxes.txt

ssh -o BatchMode=yes -o StrictHostKeyChecking=no root@"${STANDBY_IP}" 'bash -s' << 'INNER_EOF'
while IFS= read -r line; do
    box=$(echo "$line" | cut -d ' ' -f 1)
    if ! grep -q "^${box} =>" /etc/asterisk/voicemail.conf; then
        echo "Adding mailbox ${box} to standby..."
        echo "$line" >> /etc/asterisk/voicemail.conf
    fi
done < /tmp/primary_mailboxes.txt
rm -f /tmp/primary_mailboxes.txt
asterisk -rx "voicemail reload" >/dev/null
INNER_EOF

rm -f /tmp/primary_mailboxes.txt
echo "✓ Voicemail configurations synchronized."

echo "[3/3] Standby sync completed successfully."
