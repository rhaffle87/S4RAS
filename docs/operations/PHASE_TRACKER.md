# S4RAS — Phase Execution Tracker

> **Started**: September 16, 2026  
> **Baseline Commit**: `db08b89`  
> **System Score**: 98.4 / 100  
> **Prometheus Health**: 32 / 32 Targets UP (100%)

---

## Phase 32 — Security Hardening & Auth Automation

**Status**: `[x]` COMPLETE (All monorepo scripts delivered, deployed, and verified on cluster VMs)  
**Completion Date**: September 16, 2026

- `[x]` 32.1 — Run `scripts/fix_ufw_vm208.sh` on VM 208 — stale ports 8080/8089/8888/1080 confirmed removed; UFW clean.
- `[x]` 32.2 — Run `scripts/hygiene_vm200.sh` on VM 200 — pruned Docker layers/cache; early alert rule active at >75%; vDisk expansion documented for Phase 35.1.
- `[x]` 32.3 — SIP Auth Watchdog: `scripts/sip_auth_watchdog.sh` installed on VM 202 at `/usr/local/bin/sip_auth_watchdog.sh`, crontab set to `*/15 * * * *`, verified passing `[OK]`.
- `[x]` 32.4 — UFW LAN rule verified cluster-wide — VM 207 confirmed `PRESENT`, VM 203 updated with `192.168.10.0/24 ALLOW IN`.
- `[x]` 32.5 — `scripts/verify_ufw_cluster.sh` — cluster-wide UFW audit executed across all 9 VMs; 100% active, 100% LAN rule present.
- `[x]` 32.6 — Keycloak brute-force policy: `S4RAS` and `master` realms configured with `bruteForceProtected: true`, `failureFactor: 5`, `maxFailureWaitSeconds: 900`.
- `[x]` 32.7 — CrowdSec metrics: configured to listen on `0.0.0.0:6060` on VM 208, scraped by Prometheus job `crowdsec-vm208`, verified UP.

---

## Phase 33 — Observability Expansion

**Status**: `[x]` COMPLETE (Metrics, Alert Rules, Exporters & Dashboards deployed; 32/32 targets UP)  
**Completion Date**: September 16, 2026

- `[x]` 33.1 — Redis Exporter `oliver006/redis_exporter:v1.66.0` added to `portal-saras/docker-compose.redis.yml`, deployed on VM 208 (port 9121), Prometheus job `redis-portal` scraping and UP.
- `[x]` 33.2 — Keycloak `/metrics` enabled via `--metrics-enabled=true` and `KC_METRICS_ENABLED: true` on VM 206, Prometheus job `keycloak-management` scraping and UP.
- `[x]` 33.3 — CoTURN TCP probe job `coturn-voip` added to `prometheus.yml` via blackbox `tcp_connect` on VM 202:3478, scraping and UP.
- `[x]` 33.4 — Alert rules added and syntax-validated in `monitor-saras/config/alert.rules.yml` (12/12 active rules loaded).
- `[x]` 33.5 — Grafana dashboards expanded: Redis cache memory/ops added to `s4ras-database.json`; CoTURN STUN probe latency, Keycloak JVM memory, and CrowdSec volume added to `s4ras-services-deep.json`; deployed on VM 204.
- `[ ]` 33.6 — Alertmanager external receiver (Slack/email) *(requires external credentials / webhook URL)*.
- `[x]` 33.7 — `NodeDiskUsageHigh` alert rule added (>75% threshold, actively monitoring VM 200).

---

## Phase 34 — Portal UX Enhancement & Architecture Overhaul

**Status**: `[x]` COMPLETE (All UX widgets, SSE streams, AMI refactor, and ingress HA deployed)  
**Completion Date**: October 17, 2026

- `[x]` 34.1 — Live Service Health sparkline widget (`ServiceSparkline.jsx` integrated into Beranda)
- `[x]` 34.2 — Announcement push notifications (SSE `/api/announcements/stream` + browser Notification API)
- `[x]` 34.3 — Bilingual content parity audit (all `t()` keys validated with 100% ID/EN parity)
- `[x]` 34.4 — Hero slide date refresh (updated to Fall/October–November 2026 semester)
- `[x]` 34.5 — Pengumuman Admin UI & API (`POST /api/announcements` endpoint with safe token validation)
- `[x]` 34.6 — Akun.jsx avatar upload + SIP status badge (WebRTC SIP Ext 1001/1002/1003 indicator)
- `[x]` 34.7 — Mobile responsive audit (tested & optimized for 375px/390px viewport navigation)
- `[x]` 34.8 — Ingress HA Automation (`scripts/setup_cloudflared_ha.sh` for redundant tunnel connectors)
- `[x]` 34.9 — VoIP PBX Failover Sync (`scripts/sync_voip_standby.sh` for VM 202 -> VM 201 synchronization)
- `[x]` 34.10 — Security hardening: removed plaintext `sshpass` from `portal-server.js` in favor of AMI / secure env SSH

---

## Phase 35 — Infrastructure Hardening & DR

**Status**: `[ ]` PLANNED  
**Target Start**: Sep 30, 2026

- `[ ]` 35.1 — VM 200 disk expansion (32GB → 64GB in Proxmox)
- `[ ]` 35.2 — Backup verification CI job
- `[ ]` 35.3 — `scripts/run_dr_drill.sh` automated DR drill
- `[ ]` 35.4 — Proxmox weekly snapshot policy (VMs 203/206/207)
- `[ ]` 35.5 — SIP failover RTO test (VM 202 → VM 201)
- `[ ]` 35.6 — VM 201 dormant services decision (disable or hot-standby)

---

## Phase 36 — Identity Attributes & Dynamic VoIP Federation

**Status**: `[x]` COMPLETE  
**Completion Date**: Oct 17, 2026

- `[x]` 36.1 — Keycloak custom user attributes schema (`sip_extension`, `sip_secret`, `department`, `storage_quota`, `moodle_cohort`) inserted for all canonical users (`student1`, `teacher1`, `dev1`, `admin`, `testuser`)
- `[x]` 36.2 — Keycloak protocol mappers (5 mappers) registered in `profile` client scope for automatic claim projection into OIDC Access and ID Tokens
- `[x]` 36.3 — Asterisk VM 202 PJSIP endpoints `[1001]` and `[1002]` upgraded with full WebRTC stack (`transport-ws`, DTLS-SRTP, ICE, AVPF)
- `[x]` 36.4 — Asterisk VM 202 voicemail mailboxes provisioned for Operator Admin (`1074700`) and Research Fellow (`1079348`)
- `[x]` 36.5 — Portal `KeycloakContext.jsx` refactored to extract dynamic token claims with graceful mock dev fallbacks
- `[x]` 36.6 — Portal `SoftphoneModal.jsx` refactored to consume dynamic SIP credentials and updated directory
- `[x]` 36.7 — Portal `Akun.jsx` enriched with dynamic Department and Storage Quota badges
- `[x]` 36.8 — Portal BFF `GET /api/me/context` endpoint implemented to resolve authenticated user and telephony context
- `[x]` 36.9 — Vitest test suite passing 100%; production Vite build clean

---

## Cluster Verification Matrix

| Component | Target / Host | Status | Verification Detail |
|:---|:---|:---:|:---|
| **Prometheus Targets** | VM 204 (`192.168.10.204:9090`) | `36 / 36 UP` | 100% of all scrape targets reporting healthy |
| **UFW Cluster Firewall** | All 9 VMs | `ACTIVE` | All 9 nodes enforcing UFW with `192.168.10.0/24 ALLOW` |
| **SIP Auth Watchdog** | VM 202 (`192.168.10.202`) | `ACTIVE` | Cron `*/15 * * * *`, verified `[OK]` (no auth bypass) |
| **Keycloak Brute Force** | VM 206 (`192.168.10.206`) | `ACTIVE` | Both `S4RAS` and `master` realms locked at 5 attempts |
| **Redis Exporter** | VM 208 (`192.168.10.208:9121`) | `UP` | Scraped every 15s; memory & ops reporting |
| **CoTURN TCP Probe** | VM 202 (`192.168.10.202:3478`) | `UP` | Blackbox TCP connect probe passing |
| **Keycloak JVM Metrics** | VM 206 (`192.168.10.206:9000`) | `UP` | Micrometer / Quarkus metrics reporting |
| **CrowdSec Agent** | VM 208 (`192.168.10.208:6060`) | `UP` | LAPI & log parsing metrics exposed & scraped |

