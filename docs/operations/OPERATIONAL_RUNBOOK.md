# S4RAS Ecosystem Master Operational Runbook

> **Target Audience**: Infrastructure Engineers, DevOps Administrators, and Campus IT Operators.  
> **Ecosystem Version**: `v1.2.0-enterprise`  
> **Revision Date**: September 2026

---

## 1. Ecosystem Infrastructure Topology

The S4RAS campus platform spans 10 Virtual Machines (VMs 200–209) on Proxmox VE, interconnected via an isolated internal management LAN (`192.168.10.0/24`), zero-friction Tailscale mesh, and ingress-routed through Cloudflare Zero Trust Argo Tunnel.

```
                          ┌────────────────────────────────────────────────────────┐
                          │     Cloudflare Zero Trust Ingress (*.s4ras.site)       │
                          └───────────────────────────┬────────────────────────────┘
                                                      │ Argo Tunnel
                                                      ▼
                          ┌────────────────────────────────────────────────────────┐
                          │ VM 208: S4RAS Gateway & Unified Portal (192.168.10.208)│
                          │   React 19 SPA + Express BFF + Softphone Web Dialer    │
                          └──────┬──────────────┬──────────────┬──────────────┬────┘
                                 │              │              │              │
           ┌─────────────────────┘              │              │              └─────────────────────┐
           ▼                                    ▼              ▼                                    ▼
┌──────────────────────┐             ┌────────────────┐ ┌────────────────┐              ┌────────────────┐
│ VM 206: SSO          │             │  VM 203: LMS   │ │  VM 207: SAN   │              │ VM 204: Monitor│
│ Keycloak 26.1        │             │  Moodle 4.5.2  │ │  Nextcloud 31  │              │ Prometheus v3  │
│ Realm: S4RAS         │             │ PostgreSQL 15  │ │ Quotas, Groups │              │ Alertmanager   │
│ OIDC Single Sign-On  │             │ 3 Rich Courses │ │ Shared Academic│              │ Grafana v12    │
└──────────┬───────────┘             └────────────────┘ └────────────────┘              └───────┬────────┘
           │                                                                                    │
           ├───────────────────────────────┐                                                    │
           ▼                               ▼                                                    ▼
┌──────────────────────┐             ┌───────────────────────────────────┐              ┌────────────────┐
│ VM 200: IPTV         │             │ VoIP PBX Infrastructure           │              │ VM 209: JMeter │
│ Jellyfin 10.9/10.10  │             │ ┌───────────────────────────────┐ │              │ Load Testing   │
│ Dispatcharr (Proxy)  │             │ │ VM 202: Asterisk 22 (Primary) │ │              │ & Interactive  │
│ Anime, Movies, VOD   │             │ │ WebRTC Dialer & IVR (Ext 1000)│ │              │ HTML Reports   │
│ Live TV M3U Channels │             │ └──────────────┬────────────────┘ │              └────────────────┘
└──────────────────────┘             │                │ Inter-PBX Trunk │
                                     │ ┌──────────────▼────────────────┐ │
                                     │ │ VM 201: Asterisk 20 (Failover)│ │
                                     │ └───────────────────────────────┘ │
                                     └───────────────────────────────────┘
```

---

## 2. Microservices Directory & Health Endpoints

| Microservice | Internal LAN URL | Public Zero Trust URL | Health / Diagnostic Check |
|:---|:---|:---|:---|
| **Portal & Gateway** | `http://192.168.10.208:3000` | `https://portal.s4ras.site` | `curl -I https://portal.s4ras.site/api/health` |
| **SSO Keycloak** | `http://192.168.10.206:8080` | `https://sso.s4ras.site` | `curl -s http://192.168.10.206:9000/health/ready` |
| **Moodle LMS** | `http://192.168.10.203:80` | `https://moodle.s4ras.site` | `curl -I https://moodle.s4ras.site` |
| **Nextcloud SAN** | `http://192.168.10.207:80` | `https://cloud.s4ras.site` | `curl -s http://192.168.10.207/status.php` |
| **Collabora CODE** | `http://192.168.10.207:9980` | `https://collabora.s4ras.site` | `curl -s http://192.168.10.207:9980/hosting/discovery` |
| **Jellyfin IPTV** | `http://192.168.10.200:8096` | `https://iptv.s4ras.site` | `curl -s http://192.168.10.200:8096/System/Info/Public` |
| **Dispatcharr IPTV** | `http://192.168.10.200:9191` | `https://dispatcharr.s4ras.site` | `curl -I https://dispatcharr.s4ras.site` |
| **VoIP Telephony** | `http://192.168.10.202:80` | `https://voip.s4ras.site` | `curl -I http://192.168.10.202/` |
| **Monitoring** | `http://192.168.10.204:3000` | `https://monitor.s4ras.site` | `curl -s http://192.168.10.204:3000/api/health` |
| **JMeter Benchmark** | `http://192.168.10.209:8088` | `https://portal.s4ras.site/benchmark/` | `curl -s http://192.168.10.209:8088/` |

---

## 3. Standardized Campus Identity Personas

| Username | Password | Role & Group | Extensions | App Access |
|:---|:---|:---|:---:|:---|
| `student1` | `[REDACTED]` | `Mahasiswa` (`/Students`) | `1001` | Moodle Courses, Nextcloud (10GB), Jellyfin, WebRTC |
| `teacher1` | `[REDACTED]` | `Dosen` (`/Faculty`) | `1002` | Moodle Teacher, Nextcloud (50GB), Jellyfin, WebRTC |
| `dev1` | `[REDACTED]` | `admin` (`/DevOps`) | `1003` | Full Cluster Access, Grafana Editor, Cloudflare |
| `admin` | `[REDACTED]` | `SuperAdmin` (`/Admin`) | `1004` | Keycloak Master, Database Root, System Operations |

---

## 4. Routine Operations Runbooks

### Runbook 4.1: Automated Health Verification
Run the ecosystem health prober from your workstation or VM 208:
```bash
npm run test:health
```
Expected Output: All 7 services return `ONLINE` with latency `< 50ms`.

### Runbook 4.2: Automated Ecosystem Database Backup & Offsite Replication
The backup system runs automatically every night at 02:00:00 WIB via systemd timer `s4ras-backup.timer` on VM 204.
To check timer status:
```bash
sudo systemctl status s4ras-backup.timer
```
To run manual on-demand backup across all 5 clusters and replicate to Nextcloud SAN:
```bash
sudo /usr/local/bin/backup_all_databases.sh
```
This performs concurrent database dumps across PostgreSQL 16 (SSO), PostgreSQL 15 (Moodle), MariaDB 11 (Nextcloud), and tars Asterisk configs into `/var/backups/s4ras/` with SHA256 verification.
Additionally, it automatically replicates the compressed archive offsite to **Nextcloud SAN** via WebDAV:
- WebDAV Endpoint: `https://cloud.s4ras.site/remote.php/dav/files/admin/System_Backups/`
- Retention Policy: Automatic 7-day retention pruning locally on VM 204.

**Full Scheduled Timer Ecosystem (VM 204)**

| Timer | Schedule | Purpose |
|:---|:---|:---|
| `s4ras-backup.timer` | Daily 02:00 WIB | Full DB dump + Nextcloud WebDAV offsite replication |
| `s4ras-hygiene.timer` | Weekly Sunday 03:00 WIB | Log rotation, Docker volume pruning, temp file cleanup |
| `s4ras-dr-test.timer` | Monthly 1st 04:00 WIB | Automated disaster recovery restore drill (validates latest backup is restorable) |
| `dpkg-db-backup.timer` | Daily 00:00 WIB | OS package database backup (system-managed) |

To list all active timers and their next elapse times:
```bash
sudo systemctl list-timers --all | grep -E 's4ras|backup|hygiene|dr-test'
```



### Runbook 4.3: JMeter Benchmark & Load Testing Execution
To run stress and throughput tests on VM 209:
```bash
# On VM 209:
/home/admin-node/run_benchmark.sh moodle_25user
```
The test automatically produces HTML dashboards and metrics viewable at:
`https://portal.s4ras.site/benchmark/`

### Runbook 4.4: VoIP Dialplan & Inter-PBX SIP Trunk Failover
The VoIP cluster operates high-availability mutual SIP trunking between VM 202 (Simpul 2, Primary Asterisk 22) and VM 201 (Simpul 1, Asterisk 20):
- **Trunk Endpoints**: `vm201-trunk` on VM 202 <---> `vm202-trunk` on VM 201 (PJSIP port 5060, UDP).
- **Speed Dial Numbers**:
  - `100`: Direct Simpul 1 Asterisk Test Line (echotest/trunk).
  - `101`: Direct Simpul 2 Asterisk Test Line (primary IVR).
- **Failover Logic**:
  On VM 201, calls to `_1XXX` dial `PJSIP/${EXTEN}@vm202-trunk`. If the trunk reports `CONGESTION` or `CHANUNAVAIL`, dialplan falls back automatically to local Simpul 1 IVR (`exten => 1000,1,Answer()`).
- **To Reload Dialplans**:
```bash
# On VM 202 or VM 201:
sudo asterisk -rx "dialplan reload"
sudo asterisk -rx "pjsip reload"
sudo asterisk -rx "pjsip show endpoints"
```

### Runbook 4.5: Moodle Profile, Cache Reset & DB Maintenance
If users experience profile blocks or caching issues:
```bash
# On VM 203:
docker exec -u daemon moodle php /bitnami/moodle/admin/cli/purge_caches.php
```

**Moodle Database Growth Monitoring**

Key tables to monitor for bloat (audit baseline: 2026-09-15):

| Table | Size (2026-09-15) | Risk |
|:---|:---|:---|
| `mdl_logstore_standard_log` | 51 MB | Medium — configure 90-day expiry |
| `mdl_task_log` | 29 MB | Medium — no expiry by default |
| `mdl_sessions` | 632 kB | Low — was 409 MB in Phase 31 |
| `mdl_auth_oidc_token` | 504 kB | Low — check OIDC token cleanup |

Configure log expiry in Moodle Admin UI:
- Site Administration > Plugins > Logging > Standard Logstore > **Days to keep logs**: 90
- Site Administration > Plugins > Logging > Standard Logstore > **Max log records per minute**: 1000

Check `mdl_sessions` size directly:
```bash
docker exec -e PGPASSWORD="$MOODLE_DB_PASSWORD" postgres psql -U moodleuser moodledb -t \
  -c "select count(*), pg_size_pretty(sum(length(sessdata))) from mdl_sessions;"
```

If `mdl_sessions` exceeds 100 MB, truncate safely (clears all active sessions — users must re-login):
```bash
docker exec -e PGPASSWORD="$MOODLE_DB_PASSWORD" postgres psql -U moodleuser moodledb \
  -c "TRUNCATE TABLE mdl_sessions;"
```

**Nextcloud Stale File Lock Cleanup**

`oc_file_locks` can accumulate stale locks when Nextcloud processes are interrupted. Routine cleanup:
```bash
docker exec nextcloud_app php occ files:cleanup
docker exec nextcloud_app php occ maintenance:repair
```



### Runbook 4.6: Jellyfin Media Library Scan
To trigger an instant scan for new movies, anime, or lecture videos:
```bash
curl -X POST "http://192.168.10.200:8096/Library/Refresh" \
  -H "X-Emby-Token: <ROOT_ACCESS_TOKEN>"
```

### Runbook 4.7: Real-Time Prometheus Alertmanager Webhooks & Portal Drawer
Alertmanager on VM 204 forwards firing and resolved alerts to the Portal BFF at `http://192.168.10.208:3000/api/alerts`.
- **Alertmanager Route Config**: `monitor-saras/config/alertmanager.yml` (`receiver: portal-inapp-webhook`).
- **Portal BFF Handlers**:
  - `POST /api/alerts`: Ingests Prometheus Alertmanager webhook payloads, registers firing alerts in-memory, and prunes resolved alerts.
  - `GET /api/alerts`: Serves active alerts to the frontend `SystemAlertBanner.jsx` component.
- **Frontend Alert Drawer**:
  - Appears dynamically at top of Portal whenever firing alerts exist.
  - Displays alert badge with pulsating dot, severity color-coding (red for critical, amber for warning), summary, description, and direct deep-links to Grafana (`https://monitor.s4ras.site`).

### Runbook 4.8: Moodle Academic WebDAV Repository Management (VM 203 & VM 207)
Moodle LMS is integrated with Nextcloud SAN via the native core WebDAV repository plugin:
- **Repository Instance ID**: `9`
- **Instance Name**: `Nextcloud SAN (S4RAS Cloud)`
- **Target WebDAV Endpoint**: `http://192.168.10.207/remote.php/webdav/`
- **Authentication**: User-delegated HTTP Basic or System Admin credentials (`admin:<WEBDAV_PASSWORD>`).
- **Verification via CLI (on VM 203)**:
```bash
docker exec moodle php -r "
define('CLI_SCRIPT', true);
require('/opt/bitnami/moodle/config.php');
require_once(\$CFG->dirroot . '/repository/lib.php');
\$repo = repository::get_instance(9);
print_r(\$repo->get_name());
"
```
- **Operational Benefit**: Faculty and students can directly attach syllabi, assignments, and research datasets from their Nextcloud private storage into Moodle course modules without redundant local file re-uploads.

### Runbook 4.9: XMLTV Electronic Program Guide (EPG) Generation & LiveTV Sync (VM 200)
Jellyfin IPTV displays a dynamic, rich 3-day program schedule for live campus broadcast channels:
- **EPG Source File**: `/home/s4ras/jellyfin/media/livetv/epg.xml` on VM 200 (RFC XMLTV standard, 349+ lines).
- **Channels Mapped**: TVRI Edukasi (`TVRI.Edukasi.id`), TVRI Nasional (`TVRI.Nasional.id`), DW English (`DW.English.de`), NASA TV (`NASA.TV.us`), France 24 (`France24.English.fr`).
- **Channel Playlist**: `/home/s4ras/jellyfin/media/livetv/channels.m3u` (`tvg-id` attributes cross-referenced to `channel id` in `epg.xml`).
- **To Trigger LiveTV Guide Refresh (on VM 200)**:
```bash
curl -X POST "http://192.168.10.200:8096/LiveTv/TunerHosts" \
  -H "X-Emby-Token: <EMBY_ADMIN_TOKEN>"
# Or full library refresh:
curl -X POST "http://192.168.10.200:8096/Library/Refresh" \
  -H "X-Emby-Token: <EMBY_ADMIN_TOKEN>"
```

### Runbook 4.10: Asterisk Voicemail Spool Querying & Softphone Badges (VM 202 & VM 208)
The Portal BFF queries Asterisk voicemail spool mailboxes to drive real-time visual badges on the softphone UI:
- **Direct Mailbox Query on VM 202**:
```bash
echo "$SUDO_PASSWORD" | sudo -S asterisk -rx "voicemail show users for default"
```
- **Portal BFF Endpoint (VM 208)**:
  `GET https://portal.s4ras.site/api/voicemail/status?ext=1001`
  Returns JSON: `{"ext":"1001","hasVoicemail":false,"messageCount":0,"mailbox":"1001"}`.
- **In-Browser Dialpad Integration**:
  - Visual status pill in `SoftphoneScreen.jsx` and `SoftphoneModal.jsx` displays `No Voicemail` or `X New Voicemail`.
  - Speed dial button dials Ext `500` (Voicemail IVR) directly. Default PIN: `1234`.

### Runbook 4.11: GitHub Actions Self-Hosted Runner & Zero-Downtime CI/CD (VM 208)
The Portal edge gateway runs a dedicated GitHub Actions self-hosted runner for continuous automated deployment:
- **Runner Directory**: `/home/portal/actions-runner`
- **Runner Binary**: GitHub Actions Runner v2.321.0
- **Workflow File**: `.github/workflows/deploy-self-hosted.yml`
- **Runner Service Management (on VM 208)**:
```bash
cd /home/portal/actions-runner
sudo ./svc.sh status
sudo ./svc.sh start
sudo ./svc.sh restart
```
- **Manual Webhook Deploy Trigger**:
```bash
curl -X POST https://s4ras.site/api/deploy \
  -H "X-Deploy-Token: $DEPLOY_TOKEN"
```
The deploy hook automatically performs `git pull`, builds the Vite SPA bundle, reloads PM2 (`pm2 reload portal-prod --update-env`), and executes a loopback health probe against `http://localhost:3000/api/health`.

### Runbook 4.12: Advanced Multi-Tier Benchmarking & Chaos Drills (VM 209)
To execute performance benchmarking and chaos resilience drills from VM 209:
- **Multi-Tier JMeter Runner**:
```bash
# Execute specific tier:
bash /home/admin-node/run_advanced_suite.sh tier1   # Campus Peak: 500 threads, 20 concurrent calls
bash /home/admin-node/run_advanced_suite.sh tier2   # Saturation Stress: 1,000 threads, 50 calls
bash /home/admin-node/run_advanced_suite.sh tier3   # Endurance Soak: 100 threads, 300 seconds
bash /home/admin-node/run_advanced_suite.sh all     # Full automated test run
```
- **Chaos Resilience Drill Runner**:
```bash
# Run from repository root:
python scratch/chaos_failover_drill.py
```
This automatically measures MTTR for Asterisk PBX failover, validates Prometheus Alertmanager notification forwarding, and injects network latency via Linux `tc netem`.

### Runbook 4.13: Dispatcharr IPTV Proxy & Stream Management (VM 200)
Dispatcharr acts as the dedicated stream proxy and EPG schedule aggregator for Jellyfin Live TV on VM 200:
- **Container Name**: `dispatcharr` (`ghcr.io/dispatcharr/dispatcharr:latest`)
- **Host Data Directory**: `/home/s4ras/jellyfin/dispatcharr_data/`
- **Subdirectories**: `m3us/`, `epgs/`, `recordings/`, `logos/`, `db/`, `backups/`, `logs/`
- **Channel Playlist**: `/home/s4ras/jellyfin/dispatcharr_data/m3us/s4ras_channels.m3u`
- **EPG Program Guide**: `/home/s4ras/jellyfin/dispatcharr_data/epgs/s4ras_epg.xml`
- **Useful Operational Commands (on VM 200)**:
```bash
# Check container status:
docker ps --filter name=dispatcharr

# View container logs:
docker logs --tail 50 dispatcharr

# Restart Dispatcharr container:
cd /home/s4ras/jellyfin && docker compose restart dispatcharr

# Update channel list:
cp /path/to/new_channels.m3u /home/s4ras/jellyfin/dispatcharr_data/m3us/s4ras_channels.m3u
chmod 644 /home/s4ras/jellyfin/dispatcharr_data/m3us/s4ras_channels.m3u

# Update EPG XML:
cp /path/to/new_epg.xml /home/s4ras/jellyfin/dispatcharr_data/epgs/s4ras_epg.xml
chmod 644 /home/s4ras/jellyfin/dispatcharr_data/epgs/s4ras_epg.xml
```
- **Ingress Verification**:
  - Internal LAN Probe: `curl -I http://192.168.10.200:9191` (Expected: `HTTP 200 OK`)
  - Public Ingress Probe: `curl -I https://dispatcharr.s4ras.site` (Expected: `HTTP 200 OK`)
  - Portal BFF Service Probe: `curl -s https://portal.s4ras.site/api/health/dispatcharr` (Expected: `{"status":"online"}`)

### Runbook 4.14: Jellyseerr Media Discovery & Request Management (VM 200)
Jellyseerr provides campus students and faculty with a unified request portal for multimedia, animations, serials, and academic videos, integrating directly with Jellyfin on VM 200:
- **Container Name**: `jellyseerr` (`fallenbagel/jellyseerr:latest`)
- **Port**: `5055/tcp`
- **Host Configuration Directory**: `/home/s4ras/jellyfin/jellyseerr_config/`
- **Cloudflare Public Ingress**: `https://request.s4ras.site`
- **Operational Commands (on VM 200)**:
```bash
# Check container status:
docker ps --filter name=jellyseerr

# View live application logs:
docker logs --tail 50 -f jellyseerr

# Restart Jellyseerr service:
cd /home/s4ras/jellyfin && docker compose restart jellyseerr

# Backup configuration directory:
tar -czvf /home/s4ras/jellyseerr_backup_$(date +%Y%m%d).tar.gz /home/s4ras/jellyfin/jellyseerr_config/
```
- **Ingress & Health Verification**:
  - Internal LAN Probe: `curl -I http://192.168.10.200:5055` (Expected: `HTTP 307 Temporary Redirect` -> `/setup` or `/login`)
  - Public Ingress Probe: `curl -I https://request.s4ras.site` (Expected: `HTTP 307`)
  - Portal BFF Service Probe: `curl -s https://portal.s4ras.site/api/health/jellyseerr` (Expected: `{"status":"online"}`)

### Runbook 4.15: Gotenberg Stateless Document Conversion Engine (VM 203)
Gotenberg provides high-performance Chromium and LibreOffice document-to-PDF conversion APIs for Moodle LMS assignment grading and academic transcript export on VM 203:
- **Container Name**: `gotenberg` (`gotenberg/gotenberg:8`)
- **Port**: `3000/tcp` (Internal LAN and container bridge)
- **Host Configuration Directory**: `/home/s4ras/gotenberg/`
- **Compose Manifest**: `/home/s4ras/gotenberg/docker-compose.yml`
- **Memory Constraint**: `mem_limit: 512m` (prevents memory ballooning during large multi-page PDF renders)
- **Operational Commands (on VM 203)**:
```bash
# Check container status:
docker ps --filter name=gotenberg

# View container logs:
docker logs --tail 50 gotenberg

# Restart service:
cd /home/s4ras/gotenberg && docker compose restart gotenberg
```
- **Health Verification**:
  - Direct Health Endpoint: `curl -i http://localhost:3000/health` (Expected: `HTTP/1.1 200 OK`, `Gotenberg-Trace` header)
  - Remote LAN Probe: `curl -s http://192.168.10.203:3000/health` (Expected: `{"status":"up"}`)

### Runbook 4.16: Uptime Kuma Status Page & Blackbox Observability (VM 204)
Uptime Kuma provides an independent, public-facing status dashboard and heartbeat monitor for all S4RAS campus microservices on VM 204:
- **Container Name**: `uptime-kuma` (`louislam/uptime-kuma:1`)
- **Port**: `3001/tcp`
- **Host Configuration Directory**: `/home/admin-node/uptime-kuma/`
- **Persistent Volume**: `s4ras_uptime_kuma_data`
- **Cloudflare Public Ingress**: `https://status.s4ras.site`
- **Operational Commands (on VM 204)**:
```bash
# Check container status:
docker ps --filter name=uptime-kuma

# View live container logs:
docker logs --tail 50 -f uptime-kuma

# Restart service:
cd /home/admin-node/uptime-kuma && docker compose restart uptime-kuma
```
- **Ingress & Health Verification**:
  - Internal LAN Probe: `curl -I http://192.168.10.204:3001` (Expected: `HTTP 302 Found` -> `/dashboard` or `/status`)
  - Public Ingress Probe: `curl -I https://status.s4ras.site` (Expected: `HTTP 302`)
  - Portal BFF Service Probe: `curl -s https://portal.s4ras.site/api/health/status` (Expected: `{"status":"online"}`)

### Runbook 4.17: Redis In-Memory Session Cache Engine (VM 208)
Redis 7 provides low-latency key-value caching on the Portal BFF edge gateway (VM 208) to cache microservice health probe responses, rate-limiting tokens, and Asterisk voicemail statuses:
- **Container Name**: `redis_cache` (`redis:7-alpine`)
- **Port**: `127.0.0.1:6379/tcp` (Loopback only - never exposed to public internet)
- **Host Configuration Directory**: `/home/portal/redis/`
- **Persistent Volume**: `redis_data`
- **Configuration**: `--maxmemory 128mb --maxmemory-policy allkeys-lru`
- **Operational Commands (on VM 208)**:
```bash
# Ping Redis server:
docker exec redis_cache redis-cli ping
# Expected output: PONG

# Inspect memory usage and client connections:
docker exec redis_cache redis-cli info memory
docker exec redis_cache redis-cli info clients

# View keyspace status:
docker exec redis_cache redis-cli info keyspace

# Clear entire cache (emergency only):
docker exec redis_cache redis-cli flushall
```
- **Ingress & Health Verification**:
  - Direct Redis Ping: `redis-cli ping` (Expected: `PONG`, latency < 1ms)
  - Memory Footprint: `docker stats --no-stream redis_cache` (Expected: ~1.5 MB RSS)

### Runbook 4.18: Cluster Hostname & Service User Standardization (All 10 VMs)
All 10 virtual machines have standardized hostnames set to `s4ras` and dedicated role-based service accounts with bidirectional symlinks to maintain full backwards compatibility:
- **Cluster Hostname**: `s4ras` on all nodes (`/etc/hostname` and `/etc/hosts`).
- **Standardized Service Accounts**:
  - VM 200 (IPTV): `iptv@s4ras` (symlinked `/home/s4ras` <---> `/home/iptv`)
  - VM 201, 202, 205 (VoIP): `voip@s4ras`
  - VM 203 (LMS): `lms@s4ras` (symlinked `/home/s4ras` <---> `/home/lms`)
  - VM 204 (Monitor): `monitor@s4ras` (symlinked `/home/glorio` <---> `/home/monitor`)
  - VM 206 (SSO): `sso@s4ras`
  - VM 207 (SAN): `san@s4ras`
  - VM 208 (Portal): `portal@s4ras`
  - VM 209 (Benchmark): `benchmark@s4ras` (symlinked `/home/glorio` <---> `/home/benchmark`)
- **Key Authentication**: Standard Ed25519 cluster key (`~/.ssh/id_ed25519_s4ras`) deployed to `authorized_keys` across all accounts.
- **Firewall Policy**: UFW active across all 10 VMs with default-deny incoming, default-allow outgoing, LAN whitelist (`192.168.10.0/24`), and Tailscale overlay access (`tailscale0`).

### Runbook 4.19: Automated Ephemeral Disaster Recovery (DR) Restore Drill (VM 204)
The DR restore drill verifies that database archives produced by `backup_all_databases.sh` are 100% restorable without impacting live production data:
- **Drill Script**: `/usr/local/bin/test_dr_restore.sh` on VM 204.
- **Scheduled Execution**: Runs on the 1st of every month at 04:00 WIB via `s4ras-dr-test.timer`.
- **On-Demand Execution**:
  ```bash
  sudo /usr/local/bin/test_dr_restore.sh
  ```
- **Validation Mechanics**:
  1. Locates the latest `.tar.gz` archive in `/var/backups/s4ras/` and extracts to an ephemeral `/tmp/dr_restore_test/` sandbox.
  2. Spawns isolated Docker containers:
     - PostgreSQL 16 ephemeral container -> restores Keycloak dump -> asserts `user_entity` row count (baseline: 9 users).
     - PostgreSQL 15 ephemeral container -> restores Moodle dump -> asserts `mdl_course` row count (baseline: 5 courses).
     - MariaDB 11.7 ephemeral container -> restores Nextcloud dump -> asserts `oc_filecache` row count (baseline: 3,515 files).
  3. Writes structured JSON report to `/var/log/s4ras_dr_test.json`.
  4. Automatically removes ephemeral containers and volumes upon completion (`duration: ~52s`).

### Runbook 4.20: Database Observability & Prometheus Exporter Telemetry
All cluster databases export live Prometheus metrics to the centralized monitoring node (VM 204):
- **Exporters Deployed**:
  - **VM 203 (Moodle PostgreSQL 15)**: `prometheuscommunity/postgres-exporter:v0.15.0` on port `9187/tcp`.
  - **VM 206 (Keycloak PostgreSQL 16)**: `prometheuscommunity/postgres-exporter:v0.16.0` on port `9187/tcp` (`sso_postgres_exporter`).
  - **VM 207 (Nextcloud MariaDB 11.7)**: `prom/mysqld-exporter:v0.15.1` on port `9104/tcp` (`nextcloud_mysqld_exporter`).
- **Prometheus Scrape Jobs** (`config/prometheus.yml`):
  - `postgres-moodle`: `192.168.10.203:9187`
  - `postgres-keycloak`: `192.168.10.206:9187`
  - `mysqld-nextcloud`: `192.168.10.207:9104`
- **Total Prometheus Scrape Targets**: Exactly 20/20 active targets UP (10 node exporters + 7 blackbox web probes + 3 database exporters).
- **Target Verification Command (VM 204)**:
  ```bash
  curl -s http://localhost:9090/api/v1/targets | jq '{total: (.data.activeTargets | length), up: [.data.activeTargets[] | select(.health=="up")] | length}'
  ```

### Runbook 4.21: Progressive 3-Tier JMeter Benchmarking & Report Dashboard (VM 209)
Progressive concurrency stress testing is automated from VM 209 against Keycloak, Nextcloud WebDAV, Moodle LMS, and VoIP PBX nodes under active UFW filtering:
- **Runner Script**: `/home/admin-node/run_progressive_suite.sh`
- **Test Execution**:
  ```bash
  # Execute full 3-tier suite:
  bash /home/admin-node/run_progressive_suite.sh
  ```
- **Tier Specifications**:
  - **Tier 1 (Smoke Test)**: Keycloak (50 threads, 2 loops), Nextcloud (10 threads, 2 loops), Moodle (20 threads, 2 loops), VoIP SIP (10 probes).
  - **Tier 2 (Regression Test)**: Keycloak (150 threads, 3 loops), Nextcloud (25 threads, 2 loops), Moodle (50 threads, 2 loops), VoIP SIP (25 probes).
  - **Tier 3 (Saturation Stress Test)**: Keycloak (300 threads, 3 loops), Nextcloud (50 threads, 2 loops), Moodle (100 threads, 2 loops), VoIP SIP (50 probes).
- **Interactive Report Dashboard**:
  - Served via lightweight HTTP report server: `http://192.168.10.209:8088` / `https://portal.s4ras.site/benchmark/`.
  - Every benchmark run generates full Apache JMeter HTML dashboards with Apdex scores, response time percentiles, and transaction graphs.

---

## 5. Incident Response & Troubleshooting Playbook

### Incident A: Grafana Panels Display "No data"
* **Root Cause**: The provisioned Prometheus datasource UID does not match dashboard JSON panels (e.g. random UID generated instead of `prometheus`).
* **Resolution**:
  1. Inspect `/home/admin-node/s4ras/grafana/provisioning/datasources/prometheus.yml` on VM 204.
  2. Ensure `uid: prometheus` is explicitly defined.
  3. Restart container: `cd /home/admin-node/s4ras && docker restart grafana`.

### Incident B: VoIP Web Page Shows Blank White Screen
* **Root Cause**: Missing static web assets in `/var/www/html/index.html` or incorrect Caddy redirection to raw `/httpstatus`.
* **Resolution**:
  1. Verify `/var/www/html/index.html` exists on VM 202.
  2. Ensure Caddyfile serves `/var/www/html` with `file_server` and proxies `/ws*` to `localhost:8088`.
  3. Reload Caddy: `sudo systemctl reload caddy`.

### Incident C: Subdomain Returns `ERR_NAME_NOT_RESOLVED`
* **Root Cause**: Cloudflare DNS CNAME record missing from zone DNS.
* **Resolution**:
  1. Execute tunnel route command on VM 208:
     ```bash
     cloudflared tunnel route dns <tunnel-id> <subdomain>.s4ras.site
     ```
  2. As an immediate zero-DNS fallback, access via Portal BFF proxy at `https://portal.s4ras.site/<service>/`.

### Incident D: Moodle Mandatory Profile Redirection Loop
* **Root Cause**: User authenticated via OIDC lacks `firstname` or `lastname` in Moodle database `mdl_user`.
* **Resolution**:
  ```sql
  UPDATE mdl_user SET firstname = 'System', lastname = 'Admin' WHERE id = <USER_ID>;
  ```
  Then purge Moodle caches.

### Incident E: Nextcloud SAN (VM 207) Memory Saturation & OOM Thrashing Recovery
* **Root Cause**: High-concurrency WebDAV operations (>50-250 continuous threads) saturate the 2 GB RAM allocated to VM 207. MariaDB and Apache PHP worker processes exhaust available memory, forcing heavy swap thrashing and rendering SSH banner exchange unresponsive.
* **Diagnosis**:
  1. Portal BFF prober reports `cloud` as `offline` (`Unreachable`).
  2. Prometheus Alertmanager fires `HighMemoryUsage` and `ServiceDown`.
  3. `ping 192.168.10.207` responds with low latency (<1ms), but SSH connections hang during banner exchange.
* **Immediate Recovery Steps**:
  1. Access the Proxmox VE Web GUI (`https://192.168.10.2:8006/`) or Proxmox CLI console.
  2. Execute a clean ACPI shutdown or VM reset:
     ```bash
     qm reset 207
     ```
  3. Allow 45-60 seconds for Ubuntu 24.04 and Docker daemon to initialize.
  4. Verify service restoration:
     ```bash
     curl -s http://192.168.10.207/status.php
     ```
* **Permanent Capacity Recommendation**:
  Increase VM 207 virtual RAM allocation from 2 GB to 4 GB in Proxmox VE (`qm set 207 -memory 4096`) to provide adequate headroom for concurrent WebDAV sync threads and MariaDB buffer pools.

---

## 6. Cluster Hygiene & Resource Maintenance Playbook

To prevent disk saturation across the 10 virtual machines, automated maintenance protocols run weekly via systemd timers, or can be executed on-demand.

### Protocol 6.1: Multi-Node Journal Vacuuming
Unrotated systemd journals can consume 4GB+ per VM. Vacuum journals older than 3 days:
```bash
sudo journalctl --vacuum-time=3d
```

### Protocol 6.2: Safe Docker Layer Pruning
Reclaim dangling container layers without touching persistent database volumes or active images:
```bash
docker image prune -a --filter "until=24h" -f
docker builder prune -f
```

### Protocol 6.3: Ubuntu Snap Revision Cleanup
Remove disabled, obsolete snap revisions:
```bash
snap list --all | while read -r name ver rev trk pub notes; do
    if [ "$notes" = "disabled" ]; then
        sudo snap remove "$name" --revision="$rev"
    fi
done
```

### Protocol 6.4: JMeter Benchmark Log Archival
Compress raw JTL execution logs to avoid multi-gigabyte text files:
```bash
gzip -9 /home/admin-node/reports/*/results.jtl
```

### Protocol 6.5: Automated Multi-Node Weekly Hygiene Timer (`s4ras-hygiene.timer`)
Deployed across **all 10 virtual machines** (VM 200–209):
- **Schedule**: Every Sunday at 03:00:00 WIB (`Sun *-*-* 03:00:00`).
- **Service Unit**: `/etc/systemd/system/s4ras-hygiene.service`
- **Timer Unit**: `/etc/systemd/system/s4ras-hygiene.timer`
- **Actions**:
  1. Vacuums systemd journal logs to retain at most 3 days (`journalctl --vacuum-time=3d`).
  2. Cleans apt cache (`apt-get clean`).
  3. Purges dangling docker layers (`docker system prune -f` if docker installed).
  4. Trims `/tmp` files older than 7 days.
- **Check Status on Any Node**:
```bash
sudo systemctl status s4ras-hygiene.timer
sudo systemctl list-timers s4ras-hygiene.timer
```

---

## 7. Proxmox VE Virtualization, Network Interfaces & Resource Diagnostics

### 7.1: Network Interface Proliferation Anatomy
In the Proxmox VE GUI ("Network Information" panel), the QEMU Guest Agent queries guest kernel networking tables directly (`/sys/class/net/` and `ip -br addr`). The interfaces displayed reflect specific operational layers:

| Interface Type | Pattern / Example | Function & Origin |
|:---|:---|:---|
| **Loopback** | `lo` (`127.0.0.1`, `::1`) | Kernel loopback adapter used for intra-VM process communication (e.g. reverse proxying to Node.js on `localhost:3000`). |
| **Physical Bridge** | `ens18` / `enp6s18` (`192.168.10.x/24`) | VirtIO network adapter attached to Proxmox host bridge `vmbr0`. Carries standard LAN traffic. |
| **Encrypted Mesh** | `tailscale0` (`100.x.y.z/32`) | WireGuard tunnel device managed by Tailscale for zero-trust SSH, Prometheus scraping, and offsite sync. |
| **Default Docker Bridge** | `docker0` (`172.17.0.1/16`) | Default Linux bridge instantiated by Docker daemon upon system boot. |
| **Custom Compose Bridge** | `br-<12 hex digits>` (e.g. `br-d0a3cf554e27`) | User-defined bridge network created by `docker-compose.yml`. Each Compose network gets a unique kernel bridge. |
| **Virtual Ethernet Pair** | `veth<7 hex digits>` (e.g. `vethc32b751`) | Virtual patch cable pair. For every running container on a Docker bridge, one end (`veth*`) is enslaved to the host bridge, while the peer end enters the container as `eth0`. *(1 container = 1 veth, 4 containers = 4 veth)*. |

### 7.2: Understanding RAM "Oversubscription" & Memory Ballooning (>100%)
Proxmox frequently reports RAM usage exceeding 90%–113% (e.g., 2.26 GiB / 2.00 GiB on VM 207) while internal CLI diagnostics (`free -h`) show over 50% memory availability:
1. **Linux Page Cache (`buff/cache`)**: The Linux kernel utilizes inactive RAM to cache disk I/O blocks. Inside the guest, this memory is marked as immediately reclaimable (`available`).
2. **QEMU Host Memory Accounting**: When the guest kernel touches memory pages for disk caching, the QEMU KVM hypervisor process maps physical host pages into the VM. Proxmox Host Memory graphs track physical host pages committed to the QEMU process.
3. **Hypervisor Overhead**: Proxmox calculates `Host Memory = Guest RSS + QEMU Process Overhead` (video buffer, VirtIO ring buffers, emulator state), leading to host allocations ~10%–13% above the virtual RAM ceiling.
4. **Desktop Environment Footprint**: VMs deployed with Ubuntu Desktop (VM 203, VM 204, VM 207, VM 209) run `gnome-shell` and `gdm3`, consuming ~350MB–500MB of RAM.

### 7.3: SPICE VDAgent Runaway CPU Loop Remediation
When Proxmox NoVNC/SPICE consoles are opened and abruptly closed, the guest daemon `/usr/bin/spice-vdagent` may enter a tight epoll spin loop over disconnected VirtIO serial channels, consuming 100% of a single vCPU (reported as ~50% on a 2-vCPU VM):
- **Diagnosis**: Run `top -b -n 1 | head -n 15` on the affected VM; locate `spice-vdagent` at 99–100% CPU.
- **Immediate Resolution**:
```bash
sudo pkill -9 spice-vdagent
```
- **Permanent Mitigation**: If SPICE dynamic clipboard/resolution sharing is unnecessary on headless server VMs, disable the agent:
```bash
sudo systemctl stop spice-vdagent
sudo systemctl disable spice-vdagent
```

### 7.4: Moodle OIDC SSRF & cURL Security Host Whitelisting
Moodle's internal security helper (`/lib/classes/files/curl_security_helper.php`) enforces strict SSRF protections on outbound cURL requests (such as OpenID Connect token requests to `https://sso.s4ras.site/...`).
- **Trigger**: If DNS resolution fails inside the container, or if the target host resolves to a private IP (`192.168.0.0/16`, `172.16.0.0/12`), Moodle aborts the request and logs:
  `Blocked https://sso.s4ras.site/.../token: The URL is blocked. (erroroidccall)`
- **Host DNS Remediation (VM 203)**:
  Ensure `systemd-resolved` has persistent uplink DNS configured in `/etc/systemd/resolved.conf.d/dns.conf`:
  ```ini
  [Resolve]
  DNS=8.8.8.8 1.1.1.1
  FallbackDNS=8.8.4.4
  ```
- **Moodle Allowed Hosts Configuration**:
  Explicitly allow campus ecosystem domains and LAN subnets:
  ```bash
  docker exec moodle php /opt/bitnami/moodle/admin/cli/cfg.php --name=curlsecurityallowedhosts --set='sso.s4ras.site
  cloud.s4ras.site
  portal.s4ras.site
  moodle.s4ras.site
  192.168.10.0/24'
  ```

### 7.5: Moodle Dataroot Cache Permission Remediation (`invaliddatarootpermissions`)
Following abrupt container restarts or root-executed maintenance/testing tasks, Moodle may throw `HTTP 500 Internal Server Error` with `core\exception\invalid_dataroot_permissions` because directories inside `/bitnami/moodledata/cache/cachestore_file` were created with `root:root` ownership rather than the Apache webserver user (`daemon:daemon`).
- **Diagnosis**:
  ```bash
  curl -s -k -H 'Host: moodle.s4ras.site' http://127.0.0.1:80/ | grep -i 'invalid_dataroot_permissions'
  docker exec moodle ls -ld /bitnami/moodledata/cache/cachestore_file
  ```
- **Remediation Command (VM 203)**:
  ```bash
  docker exec -u 0 moodle chown -R daemon:daemon /bitnami/moodledata
  ```
- **Verification**:
  ```bash
  curl -s -I -H 'Host: moodle.s4ras.site' http://127.0.0.1:80/
  # Expected: HTTP/1.1 303 See Other -> Location: https://moodle.s4ras.site/login/index.php
  ```

---

## 8. Phase 19: Centralized Telemetry, NAT Traversal & Threat Defense Playbooks

### 8.1: Grafana Loki 3.0 & Promtail Centralized Log Aggregation
All 9 active nodes in the cluster stream systemd journald logs and Docker container stdout/stderr to Loki 3.0 on VM 204 (`http://192.168.10.204:3100`).

- **Architecture**:
  - **Loki Server (VM 204)**: Bound to `192.168.10.204:3100`, configured with filesystem chunk storage, 7-day retention (`retention_period: 168h`), and ingestion burst ceiling (`ingestion_rate_mb: 20`, `ingestion_burst_size_mb: 40`).
  - **Container Promtail Shippers**: Deployed on Docker-native nodes (VM 200, VM 203, VM 204, VM 206, VM 207, VM 208).
  - **Native Systemd Promtail Shippers**: Deployed as `s4ras-promtail.service` (`/usr/local/bin/promtail`) on bare-metal nodes (VM 201, VM 202, VM 209).
- **Cluster Status & Label Verification**:
  ```bash
  # Check Loki readiness
  curl -s http://192.168.10.204:3100/ready
  # Query active streaming host labels
  curl -s http://192.168.10.204:3100/loki/api/v1/label/host/values
  # Expected: ["s4ras-benchmark","s4ras-iptv","s4ras-lms","s4ras-monitor","s4ras-portal","s4ras-san","s4ras-sso","s4ras-voip","s4ras-voip2"]
  ```
- **Grafana Explore Query Cheatsheet (LogQL)**:
  - Stream SSH authentication attempts across all cluster VMs:
    `{job="systemd-journal"} |= "sshd"`
  - Filter OIDC login events from Keycloak container on VM 206:
    `{host="s4ras-sso", job="docker"} |= "LOGIN"`
  - Inspect Asterisk SIP signaling errors on VM 202:
    `{host="s4ras-voip2", job="systemd-journal"} |= "res_pjsip"`
  - Check Moodle background cron task executions on VM 203:
    `{host="s4ras-lms", job="docker"} |= "cron"`

### 8.2: CoTURN STUN/TURN NAT Traversal Server (VM 202)
CoTURN enables seamless WebRTC voice and video media traversal for campus clients connecting behind symmetric NATs, cellular carriers, and restrictive student Wi-Fi firewalls.

- **Service Details**:
  - Node: VM 202 (`s4ras-voip2`, `192.168.10.202`)
  - Primary Listening Ports: `3478/tcp+udp`, `5349/tcp+udp` (TLS)
  - Relay UDP Range: `49152:49250` (Enforced in UFW)
  - Realm: `s4ras.site`
  - Static Auth Secret: `[REDACTED]`
- **Diagnostic & Operational Commands**:
  ```bash
  # Check CoTURN daemon status
  sudo systemctl status coturn
  # Test STUN reflexive address resolution locally or from any cluster VM
  turnutils_stunclient 192.168.10.202
  # Expected output: "IPv4. ...: 0.0.0.0:0 ==> ...: 192.168.10.202:3478"
  # Restart CoTURN
  sudo systemctl restart coturn
  ```
- **WebRTC Client Integration (Portal Softphone)**:
  Configured in `portal-saras/src/components/SoftphoneModal.jsx`:
  ```javascript
  iceServers: [
    { urls: 'stun:192.168.10.202:3478' },
    { urls: 'turn:192.168.10.202:3478', username: 's4ras', credential: '<TURN_SECRET>' }
  ]
  ```

### 8.3: CrowdSec Intrusion Prevention System (VM 204 LAPI & Bouncers)
CrowdSec monitors system logs, analyzes malicious brute-force patterns, and triggers automated kernel-level drops (`nftables`) via coordinated firewall bouncers across the cluster.

- **Topology**:
  - **Local API (LAPI)**: Runs on VM 204 (`s4ras-monitor`) listening on `0.0.0.0:8080`.
  - **Local Bouncer**: Installed on VM 204 (`FirewallBouncer-RvKF5Gam...`).
  - **Remote Bouncer**: Installed on VM 208 (`vm208-portal-bouncer`) connecting to `http://192.168.10.204:8080/`.
  - **Whitelists**: Protected under `/etc/crowdsec/parsers/s02-enrich/s4ras-whitelist.yaml`:
    * LAN Subnet: `192.168.10.0/24`
    * Tailscale CGNAT Mesh: `100.64.0.0/10`
    * Localhost: `127.0.0.1/8`
- **Administration & Operational Commands**:
  ```bash
  # Check connected bouncers
  sudo cscli bouncers list
  # View active ban decisions
  sudo cscli decisions list
  # Add manual test ban decision (expires in 5 minutes)
  sudo cscli decisions add --ip 198.51.100.123 --duration 5m --reason "Manual security drill"
  # Inspect nftables kernel drop set on VM 204 or VM 208
  sudo nft list table ip crowdsec
  # Delete ban decision
  sudo cscli decisions delete --ip 198.51.100.123
  # View CrowdSec security metrics
  sudo cscli metrics
  ```

### 8.4: Synthetic SIP Concurrency Benchmarking (SIPp on VM 209)
SIPp provides automated, repeatable load testing against the primary Asterisk 20 PBX on VM 202 to prove concurrent signaling and audio echo capacity under heavy academic loads.

- **Target Node**: VM 202 (`192.168.10.202:5060`), Extension `600` (`NoOp` -> `Answer` -> `Echo` -> `Hangup`).
- **Asterisk Authentication Bypass for Benchmarking**:
  Configured in `/etc/asterisk/pjsip.conf` on VM 202:
  ```ini
  [benchmark-trunk]
  type=endpoint
  transport=transport-udp
  context=from-internal
  disallow=all
  allow=ulaw,alaw,g722,gsm
  aors=benchmark-aor
  direct_media=no

  [benchmark-aor]
  type=aor
  contact=sip:192.168.10.209:5060

  [benchmark-identify]
  type=identify
  endpoint=benchmark-trunk
  match=192.168.10.209
  ```
- **Executing Progressive Benchmark Suite (VM 209)**:
  ```bash
  /home/admin-node/run_sipp_benchmark.sh
  ```
- **Benchmark Tiers & Verified SLA Thresholds**:
  | Tier | Concurrency Tier | Target Calls | Rate (CPS) | Peak Concurrent | Error Rate | SLA Status |
  |:---|:---|:---:|:---:|:---:|:---:|:---:|
  | **Tier 1** | Smoke Test | 10 calls | 2.0 cps | 5 calls | 0.00% (0 errors) | PASSED |
  | **Tier 2** | Medium Concurrency | 50 calls | 5.0 cps | 20 calls | 0.00% (0 errors) | PASSED |
  | **Tier 3** | Stress Load | 100 calls | 10.0 cps | 40 calls | 0.00% (0 errors) | PASSED |
- **Interactive Reports Dashboard**:
  Served continuously on `http://192.168.10.209:8088/sipp/`.


### 8.5: Standalone Offline LAN Mode (Zero-ISP Deployment 3T)

Sesuai rekomendasi penelitian Bab 5.2, S4RAS dirancang untuk dapat beroperasi penuh tanpa ketergantungan koneksi internet (ISP). Prosedur aktivasi mode Standalone Offline:

1. **Local DNS Resolution (Router Desa / dnsmasq)**:
   Konfigurasikan dnsmasq atau router lokal agar mengarahkan seluruh domain *.s4ras.site atau *.s4ras.lan ke IP Ingress lokal VM 208 (92.168.10.208):
   \	ext
   address=/s4ras.site/192.168.10.208
   address=/s4ras.lan/192.168.10.208
   \\n
2. **OIDC Client Redirect URIs (Keycloak Standalone)**:
   Pada file sso-saras/clients-s4ras-export.json atau konsol Keycloak, tambahkan Redirect URIs berbasis intranet:
   - http://192.168.10.208:3000/*\n   - http://192.168.10.203/*\n   - http://192.168.10.207/*\n
3. **Sinkronisasi Waktu Lokal (NTP RTC Host)**:
   Untuk mencegah kegagalan verifikasi masa berlaku JWT token (exp) saat terisolasi dari internet, Proxmox host Dell PowerEdge R630 difungsikan sebagai NTP server lokal (chrony / systemd-timesyncd) dengan referensi Hardware RTC.

4. **Akses Klien Tablet digITS / Perangkat Warga**:
   Perangkat klien terhubung ke Access Point lokal (SSID: S4RAS-3T-DESA). Akses portal terbuka langsung di http://192.168.10.208:3000 atau http://portal.s4ras.lan tanpa kuota data internet.
