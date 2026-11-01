#!/usr/bin/env python3
"""
S4RAS — Tailscale Control Plane Automation
Applies Strict ACL Isolation and User Management via Tailscale REST API v2.
Guarantees Nathan (natumpal2004@gmail.com) is isolated to S4RAS VMs (tag:s4ras-vm)
and strictly BLOCKS access to private research nodes (ollama-server, fl-aggregator, lenovo).
"""

import sys
import os
import json
import argparse
import urllib.request
import urllib.error

DEFAULT_TAILNET = "-"
NATHAN_EMAIL = "natumpal2004@gmail.com"

ACL_POLICY = {
    "tagOwners": {
        "tag:s4ras-vm": ["autogroup:admin", "group:s4ras-admins"]
    },
    "groups": {
        "group:s4ras-admins": [
            "budimanten87@gmail.com"
        ],
        "group:s4ras-devs": [
            "natumpal2004@gmail.com"
        ]
    },
    "acls": [
        {
            "action": "accept",
            "src": ["autogroup:admin", "group:s4ras-admins"],
            "dst": [
                "tag:s4ras-vm:*",
                "autogroup:self:*",
                "192.168.10.0/24:*"
            ]
        },
        {
            "action": "accept",
            "src": ["group:s4ras-devs"],
            "dst": ["tag:s4ras-vm:*"]
        },
        {
            "action": "accept",
            "src": ["tag:s4ras-vm"],
            "dst": ["tag:s4ras-vm:*"]
        }
    ],
    "ssh": [
        {
            "action": "accept",
            "src": ["autogroup:admin", "group:s4ras-admins"],
            "dst": ["tag:s4ras-vm", "autogroup:self"],
            "users": ["root", "autogroup:nonroot"]
        },
        {
            "action": "accept",
            "src": ["group:s4ras-devs"],
            "dst": ["tag:s4ras-vm"],
            "users": ["s4ras", "root"]
        }
    ],
    "autoApprovers": {
        "routes": {
            "192.168.10.0/24": ["tag:s4ras-vm"]
        }
    },
    "tests": [
        {
            "src": "natumpal2004@gmail.com",
            "accept": [
                "100.123.192.3:22",
                "100.123.192.3:80",
                "100.86.164.92:8096",
                "100.71.250.20:22"
            ],
            "deny": [
                "100.110.11.66:11434",
                "100.110.11.66:22",
                "100.97.96.13:22",
                "100.97.96.13:80",
                "100.104.240.20:3389",
                "100.104.240.20:22"
            ]
        },
        {
            "src": "budimanten87@gmail.com",
            "accept": [
                "100.123.192.3:22",
                "100.86.164.92:8096"
            ]
        }
    ]
}

def api_request(url, api_key, method="GET", data=None):
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }
    body = json.dumps(data).encode("utf-8") if data else None
    req = urllib.request.Request(url, data=body, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as resp:
            content = resp.read().decode("utf-8")
            return resp.status, json.loads(content) if content else {}
    except urllib.error.HTTPError as e:
        err_body = e.read().decode("utf-8")
        try:
            return e.code, json.loads(err_body)
        except Exception:
            return e.code, {"error": err_body}

def update_acl(api_key, tailnet=DEFAULT_TAILNET):
    url = f"https://api.tailscale.com/api/v2/tailnet/{tailnet}/acl"
    print(f"[*] Applying strict isolation ACL policy on tailnet '{tailnet}'...")
    code, res = api_request(url, api_key, method="POST", data=ACL_POLICY)
    if code in (200, 204):
        print(f"[+] ACL successfully updated and validated by Tailscale control plane (HTTP {code}).")
        print("    -> Co-dev natumpal2004@gmail.com is restricted to tag:s4ras-vm ONLY.")
        print("    -> Private research nodes are strictly isolated.")
        return True
    else:
        print(f"[-] Failed to update ACL (HTTP {code}): {res}")
        return False

def invite_user(api_key, email=NATHAN_EMAIL, tailnet=DEFAULT_TAILNET, role="member"):
    url = f"https://api.tailscale.com/api/v2/tailnet/{tailnet}/user-invites"
    print(f"[*] Sending invite to '{email}' as '{role}' on '{tailnet}'...")
    payload = {"email": email, "role": role}
    code, res = api_request(url, api_key, method="POST", data=payload)
    if code in (200, 201):
        print(f"[+] Invite sent successfully to {email} as '{role}'! (HTTP {code})")
        return True
    else:
        print(f"[-] Failed to invite user (HTTP {code}): {res}")
        return False

def main():
    parser = argparse.ArgumentParser(description="Tailscale S4RAS Admin Automation")
    parser.add_argument("--key", default=os.environ.get("TAILSCALE_API_KEY"), help="Tailscale API Access Token (tskey-api-...)")
    parser.add_argument("--tailnet", default=DEFAULT_TAILNET, help="Tailnet name (default: -)")
    parser.add_argument("--invite-only", action="store_true", help="Only send invite")
    parser.add_argument("--acl-only", action="store_true", help="Only update ACL")
    args = parser.parse_args()

    if not args.key:
        print("[!] No Tailscale API key provided via --key or TAILSCALE_API_KEY env var.")
        print("    You can generate one at: https://login.tailscale.com/admin/settings/keys")
        print("    Or apply tailscale-acl.hujson directly in: https://login.tailscale.com/admin/acls")
        sys.exit(1)

    success = True
    if not args.invite_only:
        success = update_acl(args.key, args.tailnet) and success

    if not args.acl_only:
        success = invite_user(args.key, NATHAN_EMAIL, args.tailnet, role="member") and success

    if success:
        print("[+] Tailscale control plane setup complete!")
    else:
        sys.exit(1)

if __name__ == "__main__":
    main()
