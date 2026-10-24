# Security Policy

## Overview & Architecture

The **S4RAS (Solution for Remote Area Services)** Smart Campus Ecosystem enforces defense-in-depth principles across all edge nodes, reverse proxies, and microservices:

1. **Fail-Closed Authentication Architecture:**
   - All management and deployment endpoints (`/api/alerts`, `/api/deploy`, `/api/webhooks/event`, `/api/announcements`) operate on strict fail-closed validation.
   - If upstream authentication tokens or secrets are unset or empty in the host environment, requests are rejected immediately with `HTTP 503 Service Unavailable`.
   - String comparisons against sensitive tokens are enforced using constant-time evaluation (`crypto.timingSafeEqual`) to prevent timing side-channel attacks.

2. **Cryptographic JWT Verification & Anti `alg:none`:**
   - Bearer authentication validates JSON Web Tokens through RSA (`RS256`) or HMAC (`HS256`) signatures matching Keycloak IdP credentials.
   - Insecure or forged tokens claiming `alg: "none"` or expired timestamps (`exp`) are rejected.
   - Strict Role-Based Access Control (RBAC) restricts deployment and event routing to authenticated users possessing required administrative roles (`admin` / `dev`).

3. **Zero-Trust Network Mesh:**
   - Inter-VM communication relies on an encrypted Tailscale WireGuard overlay and Cloudflare Zero Trust ingress tunnels.
   - Host firewalls (UFW) reject unauthorized direct public access.

---

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |
| < 1.0   | :x:                |

---

## Reporting a Vulnerability (Responsible Disclosure)

If you discover a security vulnerability or blindspot within this repository:

1. **Do NOT open a public GitHub issue.**
2. Send an email to the repository maintainer: `security@s4ras.site` or report privately via [GitHub Private Vulnerability Reporting](https://github.com/rhaffle87/s4ras/security/advisories/new).
3. Include the following details in your report:
   - Detailed description of the vulnerability and attack vector.
   - Step-by-step reproduction steps or proof-of-concept (PoC).
   - Potential impact and affected endpoints/modules.

### Response Timetable

- **Initial Acknowledgment:** Within 48 hours.
- **Triage & Assessment:** Within 5 business days.
- **Patch & Advisory Release:** Coordinated with the reporter before public disclosure.

We appreciate your effort in responsibly auditing and keeping our smart campus infrastructure secure.
