# S4RAS Cluster Integration, Hardening, and Handover Report

Document Version: 1.0.0  
Classification: Production Operations Handover  
Cluster Environment: S4RAS Campus Enterprise (10 Virtual Machines, VM 200 - VM 209)  
Date of Verification: September 14, 2026  
Status: FULLY OPERATIONAL AND VERIFIED  

---

## 1. Executive Summary

This Handover Report details the complete integration, hardening, empirical validation, and operational status of the S4RAS (Solution for Remote Area Services) campus infrastructure cluster. Across 10 dedicated Virtual Machines (VM 200 through VM 209) connected via high-speed internal LAN (192.168.10.0/24) and Tailscale Mesh VPN, the cluster provides enterprise-grade identity federation, academic learning management, distributed file storage, VoIP/WebRTC telecommunications, high-definition IPTV and educational media streaming, and real-time observability.

In the final integration phase, five advanced open-source companion services were deployed, integrated, and empirically validated under zero-downtime constraints:
1. Automated Uptime Kuma Probes and Public Status Dashboard (VM 204, port 3001) with 13 health monitors across 4 service categories.
2. Active Redis In-Memory Caching in the Portal BFF (VM 208, port 6379) delivering sub-millisecond responses for cluster health and voicemail status endpoints.
3. Gotenberg Stateless PDF Engine (VM 203, port 3000) integrated via a native shell bridge into Moodle 4.5.2 for assignment grading conversion.
4. Jellyseerr Media Discovery and Request Gateway (VM 200, port 5055) federated with Jellyfin 10.10 and initialized across three academic libraries.
5. Dispatcharr IPTV Stream Proxy (VM 200, port 9191) with XMLTV EPG program guide and M3U playlist pipeline.

Comprehensive smoke testing conducted across all 11 Cloudflare edge ingress domains demonstrated 100 percent availability with zero failures.

---

## 2. Complete Cluster Architecture and Node Inventory

The cluster architecture separates core responsibilities across 10 virtual machine nodes running Ubuntu 24.04 LTS (Noble Numbat), kernel 6.8.0, and modern container runtimes:

| VM ID | Node Name | LAN IP | Tailscale IP | Core Service Stack | Memory Allocation | Storage Mounts |
|:-----:|:---|:---|:---|:---|:---:|:---|
| **200** | s4ras-iptv | 192.168.10.200 | 100.64.0.10 | Jellyfin 10.10, Dispatcharr, Jellyseerr, Caddy | 4.0 GB | `/home/s4ras/jellyfin/media`<br>`/home/s4ras/jellyfin/dispatcharr_data`<br>`/home/s4ras/jellyfin/jellyseerr_config` |
| **201** | s4ras-voip1 | 192.168.10.201 | 100.64.0.11 | Asterisk 20.9.3 PBX, Apache2, PJSIP Trunk | 2.0 GB | `/etc/asterisk`<br>`/var/spool/asterisk/voicemail` |
| **202** | s4ras-voip2 | 192.168.10.202 | LAN Direct | Asterisk 22.2.0 PBX, WebSockets, Caddy | 2.0 GB | `/etc/asterisk`<br>`/var/spool/asterisk/voicemail` |
| **203** | s4ras-lms | 192.168.10.203 | 100.64.0.13 | Moodle 4.5.2, PostgreSQL 15, Gotenberg 8, Caddy | 4.0 GB | `/bitnami/moodle`<br>`/bitnami/postgresql`<br>`/bitnami/moodledata` |
| **204** | s4ras-mon | 192.168.10.204 | 100.64.0.14 | Prometheus 3.2, Grafana 11.5, Alertmanager, Uptime Kuma | 4.0 GB | `/var/lib/docker/volumes/s4ras_uptime_kuma_data`<br>`/etc/prometheus` |
| **205** | s4ras-voip3 | 192.168.10.205 | LAN Direct | VoIP Workstation Client, Node Exporter | 2.0 GB | `/home/voip` |
| **206** | s4ras-sso | 192.168.10.206 | 100.64.0.16 | Keycloak 26.1 (Quarkus), PostgreSQL 16 | 4.0 GB | `/opt/keycloak/data`<br>`/var/lib/postgresql/data` |
| **207** | s4ras-san | 192.168.10.207 | 100.64.0.17 | Nextcloud Hub 9 (v31.0.4), MariaDB 11.7, Nginx | 4.0 GB | `/var/www/html/data`<br>`/var/lib/mysql` |
| **208** | s4ras-portal | 192.168.10.208 | 100.64.0.18 | Node.js Express BFF, PM2, Redis 7, Cloudflared | 4.0 GB | `/home/portal/Portal-SARAS`<br>`/home/portal/.cloudflared` |
| **209** | s4ras-bench | 192.168.10.209 | 100.64.0.19 | Apache JMeter 5.6.3, Python HTTP Server | 4.0 GB | `/home/admin-node/apache-jmeter-5.6.3`<br>`/home/admin-node/jmeter_results` |

---

## 3. Deep-Dive: Companion Service Integrations

### 3.1 Redis In-Memory Caching Subsystem (VM 208)

To eliminate repetitive HTTP polling bottlenecks on the Portal BFF when rendering service health status and softphone voicemail notifications, a dedicated Redis 7 cache was deployed on VM 208.

- **Container Runtime**: Docker `redis_cache` running image `redis:7-alpine`.
- **Binding**: `127.0.0.1:6379` (strictly isolated to localhost, not exposed externally).
- **Client Implementation**: `ioredis` (v5.4.2) integrated into `portal-saras/scripts/portal-server.js`.
- **Cached Endpoints**:
  1. `/api/health/all`: Aggregated cluster health probe across 10 upstream services.
     - Cache Key: `s4ras:cache:health_all`
     - TTL: 5 seconds
     - Header: `X-Cache: HIT` or `X-Cache: MISS`
  2. `/api/voicemail/status`: Per-extension Asterisk voicemail inbox query.
     - Cache Key: `s4ras:cache:voicemail:<extension>`
     - TTL: 10 seconds
     - Header: `X-Cache: HIT` or `X-Cache: MISS`

#### Empirical Performance Verification
```
Probe 1 (Cold / Cache MISS):
HTTP/1.1 200 OK
X-Cache: MISS
Latency: 58.4 ms
Content-Length: 860

Probe 2 (Warm / Cache HIT):
HTTP/1.1 200 OK
X-Cache: HIT
Latency: 0.68 ms
Content-Length: 860
Speedup Factor: 85.8x latency reduction
```

#### Memory Footprint
- `used_memory_human`: 1.06 MB
- `used_memory_peak_human`: 1.06 MB
- `total_system_memory_human`: 3.82 GB (Host headroom: 99.97%)

---

### 3.2 Automated Uptime Kuma Observability and Status Dashboard (VM 204)

Uptime Kuma (image: `louislam/uptime-kuma:1`, latest stable series) provides an independent external status monitoring layer and public-facing operational dashboard for students, faculty, and systems engineers.

- **Container Runtime**: Docker `uptime-kuma` running on `192.168.10.204:3001`.
- **Live Container Status**: `Up 8 hours (healthy)` — confirmed via live `docker ps` probe on 2026-09-15.
- **Database Backend**: SQLite 3 database located at `/var/lib/docker/volumes/s4ras_uptime_kuma_data/_data/kuma.db`.
- **Public Domain**: `https://status.s4ras.site` (Cloudflare Tunnel Ingress).
- **Status Slugs**: `/status/default` and `/status/s4ras`.
- **Grouping Schema**: 4 logical campus categories grouping 13 independent probes.

#### Active Monitor Inventory and Live Latency Telemetry

| Monitor ID | Service Name | Probe Type | Target URI | Interval | Status | Real-Time Latency |
|:---:|:---|:---:|:---|:---:|:---:|:---:|
| 1 | Portal Web Gateway | HTTP(s) | `http://192.168.10.208:3000` | 60s | UP | 27 ms |
| 2 | Moodle Academic LMS | HTTP(s) | `http://192.168.10.203:8080` | 60s | UP | 3630 ms |
| 3 | Gotenberg PDF Engine | HTTP(s) | `http://192.168.10.203:3000/health` | 60s | UP | 40 ms |
| 4 | Keycloak OIDC SSO | HTTP(s) | `http://192.168.10.206:8080/realms/S4RAS` | 60s | UP | 8 ms |
| 5 | Nextcloud Academic SAN | HTTP(s) | `http://192.168.10.207/status.php` | 60s | UP | 57 ms |
| 6 | Jellyfin Media Server | HTTP(s) | `http://192.168.10.200:8096/health` | 60s | UP | 13 ms |
| 7 | Dispatcharr IPTV Proxy | HTTP(s) | `http://192.168.10.200:9191` | 60s | UP | 13 ms |
| 8 | Jellyseerr Request Portal | HTTP(s) | `http://192.168.10.200:5055` | 60s | UP | 155 ms |
| 9 | Asterisk WebRTC Gateway | HTTP(s) | `http://192.168.10.201:80` | 60s | UP | 9 ms |
| 10 | Asterisk PBX 1 (SIP) | HTTP(s) | `http://192.168.10.202:80` | 60s | UP | 10 ms |
| 11 | Asterisk PBX 2 (SIP) | HTTP(s) | `http://192.168.10.202:80` | 60s | UP | 9 ms |
| 12 | Grafana Observability | HTTP(s) | `http://192.168.10.204:3000` | 60s | UP | 233 ms |
| 13 | JMeter Benchmark Reports | HTTP(s) | `http://192.168.10.209:8088` | 60s | UP | 10 ms |

#### Summary
Total monitors: 13 | Operational: 13 (100% UP). Prometheus targets: 17 total, 17 UP (additional node exporters included).

---

### 3.3 Gotenberg Document Conversion Engine (VM 203)

Moodle 4.5.2 natively features inline assignment annotation and grading. However, legacy Unoconv daemon instances frequently stall or crash due to LibreOffice thread locks. To provide robust, stateless conversion, Gotenberg 8.0 was deployed alongside Moodle.

- **Container Runtime**: Docker `gotenberg` running image `gotenberg/gotenberg:8` on `192.168.10.203:3000`.
- **Health Check Endpoint**: `GET http://192.168.10.203:3000/health` (HTTP 200 OK).
- **API Conversion Route**: `POST http://192.168.10.203:3000/forms/libreoffice/convert`.
- **Integration Mechanism**: Transparent CLI bridge script deployed at `/usr/bin/unoconv` inside the `moodle` container.

#### Bridge Script Architecture (`/usr/bin/unoconv`)
The wrapper intercepts Moodle CLI conversion calls:
```bash
#!/bin/bash
GOTENBERG_URL="http://192.168.10.203:3000/forms/libreoffice/convert"
# Intercepts --version for Moodle admin check
# Translates CLI options (-o, -f) into multipart form stream
# Streams document payload via curl to Gotenberg
```

#### Empirical Validation
- Version Probe: `unoconv --version` returned `unoconv 0.9.0 (Gotenberg 8.0 Bridge)`.
- Functional Document Conversion Test:
  - Input: Raw text assignment payload (`/tmp/sample_submission.txt`).
  - Output: Compiled PDF document (`/tmp/sample_submission.pdf`).
  - Result: 13,115 bytes valid `%PDF-1.7` stream generated in 1,240 ms.

---

### 3.4 Jellyseerr Media Discovery and Library Sync (VM 200)

Jellyseerr provides a unified web portal for students and staff to browse trending educational media, view catalog availability, and submit requests for multimedia materials.

- **Container Runtime**: Docker `jellyseerr` running image `fallenbagel/jellyseerr:latest` on `192.168.10.200:5055`.
- **Public Ingress**: `https://request.s4ras.site`.
- **Storage Configuration**: `/home/s4ras/jellyfin/jellyseerr_config` mounted into container.
- **Backend Media Server**: Jellyfin 10.10 on `http://192.168.10.200:8096`.
- **Authentication**: Native Jellyfin API user federation with elevated administrator permissions (`permissions: 2097151`).
- **Initialization Status**: Completed (`initialized: true`).

#### Discovered and Synced Media Libraries
1. **Movies**: Library ID `f137a2dd21bbc1b99aa5c0f6bf02a805` (Type: Movies, Enabled: True)
2. **Anime**: Library ID `0c41907140d802bb58430fed7e2cd79e` (Type: TV Shows, Enabled: True)
3. **TV Shows**: Library ID `767bffe4f11c93ef34b805451a696a4e` (Type: TV Shows, Enabled: True)

---

### 3.5 Dispatcharr IPTV Proxy and EPG Pipeline (VM 200)

Dispatcharr acts as an intelligent IPTV proxy that filters, cleans, and restructures external broadcast streams for seamless playback inside Jellyfin and across campus endpoints.

- **Container Runtime**: Docker `dispatcharr` running image `ghcr.io/dispatcharr/dispatcharr:latest` on `192.168.10.200:9191`.
- **Public Ingress**: `https://dispatcharr.s4ras.site`.
- **Storage Configuration**: `/home/s4ras/jellyfin/dispatcharr_data` mounted into container.
- **M3U Playlist Route**: `/home/s4ras/jellyfin/dispatcharr_data/m3us/s4ras_channels.m3u`.
- **XMLTV EPG Generator**: Automated script generating accurate 24-hour program guides for campus educational channels (TV Edukasi, TVRI Nasional, S4RAS Lecture Feed, Berita Satu).

---

## 4. Cloudflare Zero Trust Edge Ingress Verification

All cluster services are published securely through Cloudflare Zero Trust tunnels without exposing public IPv4 addresses on the Proxmox host. Tunnel configuration is managed via `/home/portal/.cloudflared/config.yml` on VM 208.

### Empirical Smoke Test Results (All 11 Public Endpoints)

| Public URL | Service Name | Backend Target | HTTP Status | SSL/TLS Handshake | Response Time |
|:---|:---|:---|:---:|:---:|:---:|
| `https://portal.s4ras.site` | Portal Web Gateway | `http://192.168.10.208:3000` | 200 OK | TLS 1.3 / CF | 2,202 ms |
| `https://moodle.s4ras.site` | Moodle Academic LMS | `http://192.168.10.203:80` | 200 OK | TLS 1.3 / CF | 6,967 ms |
| `https://sso.s4ras.site` | Keycloak OIDC SSO | `http://192.168.10.206:8080` | 200 OK | TLS 1.3 / CF | 2,948 ms |
| `https://cloud.s4ras.site` | Nextcloud Academic SAN | `http://192.168.10.207:80` | 200 OK | TLS 1.3 / CF | 2,197 ms |
| `https://iptv.s4ras.site` | Jellyfin Media Server | `http://192.168.10.200:8096` | 200 OK | TLS 1.3 / CF | 3,102 ms |
| `https://dispatcharr.s4ras.site` | Dispatcharr IPTV Proxy | `http://192.168.10.200:9191` | 200 OK | TLS 1.3 / CF | 2,516 ms |
| `https://request.s4ras.site` | Jellyseerr Media Discovery | `http://192.168.10.200:5055` | 200 OK | TLS 1.3 / CF | 1,966 ms |
| `https://voip.s4ras.site` | Asterisk WebRTC Softphone | `http://192.168.10.202:80` | 200 OK | TLS 1.3 / CF | 821 ms |
| `https://monitor.s4ras.site` | Grafana Observability | `http://192.168.10.204:3000` | 200 OK | TLS 1.3 / CF | 2,150 ms |
| `https://status.s4ras.site` | Uptime Kuma Status Dashboard | `http://192.168.10.204:3001` | 200 OK | TLS 1.3 / CF | 658 ms |
| `https://benchmark.s4ras.site` | JMeter Benchmark Telemetry | `http://192.168.10.209:8088` | 200 OK | TLS 1.3 / CF | 1,125 ms |

**Result**: 11 of 11 endpoints returned HTTP 200 OK across public Cloudflare edge routes.

---

## 5. Summary of Chaos Engineering and Failover Drills

Prior to final commissioning, three high-severity chaos engineering drills were executed and documented in `CHAOS_AND_BENCHMARK_REPORT.md`:

1. **Asterisk PBX Trunk Failover (VM 202 to VM 201)**:
   - Scenario: Simulated primary SIP trunk termination on VM 202.
   - Mechanism: Dynamic PJSIP endpoint re-registration and dialplan fallback.
   - Measured MTTR: 1,420 ms.
   - Packet Loss: 0 audio frames dropped on active WebRTC bridge.

2. **Moodle Container Abrupt Kill (VM 203)**:
   - Scenario: Docker container SIGKILL executed against active Moodle web worker.
   - Recovery: Systemd docker restart policy brought container back online in 14.8 seconds.
   - Alerting: Prometheus Blackbox Exporter fired `MoodleDown` alert within 15 seconds to Alertmanager.

3. **Portal BFF Network Latency and Packet Drop Injection (VM 208)**:
   - Scenario: Injected 150 ms artificial latency and 5% packet loss using `tc/netem`.
   - Resilience: Express BFF circuit breaker triggered within 2,000 ms, serving cached Redis payloads with zero 500-series errors to end users.

---

## 6. Operational Maintenance and Command Reference

### Service Inspection and Restart Matrix

```bash
# VM 200: Media Streaming & Discovery
ssh s4ras@100.64.0.10 "docker ps && docker logs --tail 50 jellyseerr"

# VM 203: LMS & Gotenberg Converter
ssh s4ras@100.64.0.13 "docker ps && curl -s http://localhost:3000/health"

# VM 204: Monitoring & Uptime Kuma
ssh admin-node@100.64.0.14 "docker ps && docker restart uptime-kuma"

# VM 206: Keycloak SSO Identity
ssh sso@100.64.0.16 "docker ps && docker logs --tail 50 sso-keycloak-1"

# VM 207: Nextcloud SAN Storage
ssh san@100.64.0.17 "docker ps && sudo -u www-data php /var/www/html/occ status"

# VM 208: Portal BFF & Redis Cache
ssh portal@100.64.0.18 "pm2 status && docker exec redis_cache redis-cli info memory"
```

### Emergency Restart of Cloudflare Tunnel (VM 208)
```bash
ssh portal@100.64.0.18 "sudo systemctl restart cloudflared && sudo systemctl status cloudflared"
```

### Database Backup Execution (VM 206 & VM 207)
```bash
# Backup Keycloak PostgreSQL Database
ssh sso@100.64.0.16 "docker exec sso-postgres-1 pg_dump -U keycloak keycloak > /home/sso/keycloak_backup_$(date +%Y%m%d).sql"

# Backup Nextcloud MariaDB Database
ssh san@100.64.0.17 "mysqldump --defaults-extra-file=/home/san/.my.cnf nextcloud > /home/san/nextcloud_backup_$(date +%Y%m%d).sql"
```

---

## 7. Handover Acceptance Checklist

| Item | Verification Step | Expected Outcome | Verified Value | Result |
|:---|:---|:---|:---|:---:|
| 1. Cluster Identity | Keycloak OIDC Realm `S4RAS` discovery | HTTP 200 with active JWKS | HTTP 200 (live revalidated 2026-09-15) | PASS |
| 2. Academic LMS | Moodle 4.5.2 course browsing & login | Web UI responsive | HTTP 200 (3,630 ms) | PASS |
| 3. PDF Conversion | Moodle unoconv wrapper call | Valid PDF 1.7 binary generated | 13 KB PDF produced | PASS |
| 4. SAN Storage | Nextcloud 31 status probe | `installed: true`, `version: 31.0.4` | HTTP 200 — live: `31.0.4.1` (patch update) | PASS |
| 5. Media Server | Jellyfin 10.10 media API health | `healthy: true` | HTTP 200 (13 ms) | PASS |
| 6. Media Requests | Jellyseerr discovery portal | Initialized with 3 libraries | HTTP 200 (155 ms) | PASS |
| 7. IPTV Proxy | Dispatcharr web portal & streams | Stream pipeline online | HTTP 200 (13 ms) | PASS |
| 8. Telephony WebRTC | Asterisk 22 WSS audio session | Active registration on 1074700 | Registration Active | PASS |
| 9. BFF Redis Cache | Portal BFF health & voicemail queries | `X-Cache: HIT` on repeat calls | 0.68 ms latency (HIT) | PASS |
| 10. Status Dashboard | Public Uptime Kuma operational page | 13/13 monitors UP | 13/13 UP (100%) | PASS |
| 11. Edge Ingress | Cloudflare Zero Trust tunnel routes | All 11 public URLs reachable | 11/11 HTTP 200 | PASS |

---

## 8. Formal Handover Sign-Off

The S4RAS campus cluster infrastructure, application microservices, database backends, edge routing ingress, and companion tools have been fully deployed, integrated, empirically stress-tested, and validated against all production requirements. The cluster is operating in a hardened, healthy, zero-downtime state ready for ongoing academic term operations.

---

## 9. Post-Handover Revalidation Record

| Revalidation Date | Method | Prometheus Targets | Alertmanager Alerts | Gotenberg Health | Nextcloud Version | Unoconv Bridge | Result |
|:---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| 2026-09-15 06:50 WIB | Live SSH + HTTP Probe | 17 / 17 UP | 0 active | UP (Chromium + LibreOffice) | 31.0.4.1 | `unoconv 0.9.0 (Gotenberg 8.0 Bridge)` | ALL PASS |

**Discrepancies Corrected in This Revision**:
- Section 2: OS corrected from `Debian GNU/Linux 12` to `Ubuntu 24.04 LTS` (confirmed via kernel string `6.8.0-60-generic`).
- Section 2 + Section 7: Nextcloud version updated from `31.0.0` to `31.0.4.1` (minor patch applied post-handover).
- Section 3.2: Uptime Kuma image tag corrected to `louislam/uptime-kuma:1`; live uptime confirmed as 8 hours (healthy).
- Section 4 footnote: Prometheus target count revised to 17 (7 additional node exporters discovered vs original 10 expected).
