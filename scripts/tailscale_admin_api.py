#!/usr/bin/env python3
"""
S4RAS — Tailscale Control Plane Automation
Uncapped policy: unrestricted communication for all team members across all cluster VMs and subnets.
"""

import sys
import os
import json
import argparse
import urllib.request
import urllib.error

DEFAULT_TAILNET = "-"

UNCAPPED_ACL_POLICY = {
    "tagOwners": {
        "tag:s4ras-vm": ["autogroup:admin", "autogroup:members"]
    },
    "acls": [
        {
            "action": "accept",
            "src": ["*"],
            "dst": ["*:*"]
        }
    ],
    "ssh": [
        {
            "action": "accept",
            "src": ["*"],
            "dst": ["*"],
            "users": ["root", "s4ras", "autogroup:nonroot"]
        }
    ],
    "autoApprovers": {
        "routes": {
            "192.168.10.0/24": ["tag:s4ras-vm", "autogroup:members"]
        }
    }
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
    print(f"[*] Applying uncapped ACL policy on tailnet '{tailnet}'...")
    code, res = api_request(url, api_key, method="POST", data=UNCAPPED_ACL_POLICY)
    if code in (200, 204):
        print(f"[+] ACL successfully updated and uncapped on Tailscale control plane (HTTP {code}).")
        return True
    else:
        print(f"[-] Failed to update ACL (HTTP {code}): {res}")
        return False

def main():
    parser = argparse.ArgumentParser(description="Tailscale S4RAS Admin Automation - Uncapped Policy")
    parser.add_argument("--key", default=os.environ.get("TAILSCALE_API_KEY"), help="Tailscale API Access Token (tskey-api-...)")
    parser.add_argument("--tailnet", default=DEFAULT_TAILNET, help="Tailnet name (default: -)")
    args = parser.parse_args()

    if not args.key:
        print("[!] No Tailscale API key provided via --key or TAILSCALE_API_KEY env var.")
        print("    Apply tailscale-acl.hujson directly in: https://login.tailscale.com/admin/acls")
        sys.exit(1)

    if update_acl(args.key, args.tailnet):
        print("[+] Tailscale uncapped control plane setup complete!")
    else:
        sys.exit(1)

if __name__ == "__main__":
    main()
