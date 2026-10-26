#!/usr/bin/env python3
import subprocess
import sys

NODES = [
    ("VM200-IPTV", "root@100.86.164.92", "s4ras-iptv"),
    ("VM201-VoIP1", "root@100.125.250.53", "s4ras-voip"),
    ("VM202-VoIP2", "root@100.83.239.40", "s4ras-voip2"),
    ("VM203-LMS", "root@100.108.104.25", "s4ras-lms"),
    ("VM204-Monitor", "root@100.102.31.45", "s4ras-monitor"),
    ("VM206-SSO", "root@100.95.158.77", "s4ras-sso"),
    ("VM207-SAN", "root@100.119.6.12", "s4ras-san"),
    ("VM208-Portal", "root@100.123.192.3", "s4ras-portal"),
    ("VM209-Bench", "root@100.71.250.20", "s4ras-benchmark")
]

SSH_OPTS = ["-o", "ConnectTimeout=5", "-o", "StrictHostKeyChecking=no", "-o", "BatchMode=yes"]

print("================================================================")
print(" S4RAS Tailscale Cluster Tagging -> tag:s4ras-vm")
print("================================================================")

for name, target, hostname in NODES:
    cmd_args = ["ssh"] + SSH_OPTS + [
        target,
        f"tailscale up --accept-routes --advertise-tags=tag:s4ras-vm --hostname={hostname} --ssh"
    ]
    print(f"[{name}] Applying tag:s4ras-vm on {hostname} ({target})...", end=" ", flush=True)
    try:
        res = subprocess.run(cmd_args, capture_output=True, text=True, timeout=8)
        if res.returncode == 0:
            print("SUCCESS")
        else:
            err = (res.stderr or res.stdout).strip().replace("\n", " ")
            print(f"FAILED (code {res.returncode}): {err[:70]}")
    except subprocess.TimeoutExpired:
        print("TIMEOUT (Check Tailscale ACL & SSH policy)")

print("================================================================")
