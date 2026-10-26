#!/usr/bin/env python3
"""
S4RAS — Tailscale Control Plane Automation
Applies ACL and Invites Co-Developer via Tailscale REST API v2.
"""

import sys
import json
import argparse
import urllib.request
import urllib.error

DEFAULT_TAILNET = "rhaffle87@gmail.com"
NATHAN_EMAIL = "natumpal2004@gmail.com"

ACL_POLICY = {
    "tagOwners": {
        "tag:s4ras-vm": ["group:s4ras-developers", "autogroup:admin"]
    },
    "groups": {
        "group:s4ras-developers": [
            "natumpal2004@gmail.com",
            "rhaffle87@gmail.com"
        ]
    },
    "acls": [
        {
            "action": "accept",
            "src": ["group:s4ras-developers", "tag:s4ras-vm", "autogroup:members"],
            "dst": ["tag:s4ras-vm:*"]
        },
        {
            "action": "accept",
            "src": ["*"],
            "dst": ["*:*"]
        }
    ],
    "ssh": [
        {
            "action": "accept",
            "src": ["group:s4ras-developers", "autogroup:admin"],
            "dst": ["tag:s4ras-vm", "autogroup:self"],
            "users": ["root", "autogroup:nonroot"]
        }
    ],
    "autoApprovers": {
        "routes": {
            "192.168.10.0/24": ["tag:s4ras-vm"]
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
        except:
            return e.code, {"error": err_body}

def update_acl(api_key, tailnet=DEFAULT_TAILNET):
    url = f"https://api.tailscale.com/api/v2/tailnet/{tailnet}/acl"
    print(f"[*] Updating Tailnet ACL on '{tailnet}'...")
    code, res = api_request(url, api_key, method="POST", data=ACL_POLICY)
    if code in (200, 204):
        print(f"[+] ACL successfully updated and verified (HTTP {code}).")
        return True
    else:
        print(f"[-] Failed to update ACL (HTTP {code}): {res}")
        return False

def invite_user(api_key, email=NATHAN_EMAIL, tailnet=DEFAULT_TAILNET, role="admin"):
    url = f"https://api.tailscale.com/api/v2/tailnet/{tailnet}/user-invites"
    print(f"[*] Sending invite to '{email}' as '{role}' on '{tailnet}'...")
    payload = {"email": email, "role": role}
    code, res = api_request(url, api_key, method="POST", data=payload)
    if code in (200, 201):
        print(f"[+] Invite sent successfully to {email}! (HTTP {code})")
        return True
    else:
        print(f"[-] Failed to invite user (HTTP {code}): {res}")
        return False

def main():
    parser = argparse.ArgumentParser(description="Tailscale S4RAS Admin Automation")
    parser.add_argument("--key", required=True, help="Tailscale API Access Token (tskey-api-...)")
    parser.add_argument("--tailnet", default=DEFAULT_TAILNET, help="Tailnet name (default: rhaffle87@gmail.com)")
    parser.add_argument("--invite-only", action="store_true", help="Only send invite")
    parser.add_argument("--acl-only", action="store_true", help="Only update ACL")
    args = parser.parse_args()

    success = True
    if not args.invite_only:
        success = update_acl(args.key, args.tailnet) and success

    if not args.acl_only:
        success = invite_user(args.key, NATHAN_EMAIL, args.tailnet) and success

    if success:
        print("[+] Tailscale control plane setup complete!")
    else:
        sys.exit(1)

if __name__ == "__main__":
    main()
