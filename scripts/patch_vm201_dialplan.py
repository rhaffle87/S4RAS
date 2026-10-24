import sys

with open("/etc/asterisk/extensions.conf", "r") as f:
    lines = f.readlines()

# Cut previous Phase 39 block if present
cut_idx = -1
for i, l in enumerate(lines):
    if "S4RAS Phase 39:" in l:
        cut_idx = i
        break
if cut_idx != -1:
    lines = lines[:cut_idx]

block = """
; S4RAS Phase 39: 7-digit extensions trunk routing with automated failover
exten => _107XXXX,1,NoOp(Calling VM 202 PBX Ext ${EXTEN})
 same => n,Dial(PJSIP/${EXTEN}@vm202-trunk,15,t)
 same => n,GotoIf($["${DIALSTATUS}" = "CONGESTION"]?failover)
 same => n,GotoIf($["${DIALSTATUS}" = "CHANUNAVAIL"]?failover)
 same => n,Hangup()
 same => n(failover),NoOp(Primary PBX VM 202 down - Standby PBX taking over ${EXTEN})
 same => n,Playback(beeperr)
 same => n,Playback(vm-nobodyavail)
 same => n,Hangup()
"""

lines.append(block.strip() + "\n")

with open("/etc/asterisk/extensions.conf", "w") as f:
    f.writelines(lines)

print("Dialplan updated cleanly.")
