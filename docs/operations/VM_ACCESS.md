# S4RAS Infrastructure & Service Access Directory

> [!CAUTION]
> **REDACTED 2026-10-22**: Seluruh nilai kredensial di dokumen ini (password OS, password database, OIDC client secrets, API tokens, SIP password, PIN voicemail) telah diganti `[REDACTED]` karena sebelumnya tersimpan plaintext di file yang dilacak git. **Rotasi semua kredensial berikut segera** — dokumen ini hanya membersihkan representasi tertulisnya, bukan memutar kredensial yang sudah aktif di server. Lihat §5 untuk daftar yang wajib dirotasi.

Dokumen ini mencatat seluruh kredensial akses sistem operasi (OS), SSH, Tailscale, database, API secrets, token autentikasi, ekstensi VoIP, dan akun pengguna untuk seluruh 10 Virtual Machine (VM 200–209) di ekosistem **S4RAS** (Solution for Remote Area Services).

> [!CAUTION]
> **Dokumen Sangat Rahasia & Sensitif**: File ini memuat seluruh kredensial operasional tingkat root, database, OIDC client secrets, dan API tokens. Jangan pernah mempublikasikan dokumen ini ke repositori publik tanpa enkripsi (e.g. git-crypt / Vault). Simpan nilai kredensial sesungguhnya di secrets manager (Vault, SOPS, atau setara), bukan di file ini.

---

## 1. Matriks Ringkasan Virtual Machine (VM 200–209)

| VM ID | Hostname / Layanan | IP Internal (LAN) | Akses Tailscale SSH & MagicDNS | User / Password OS (Standardized @s4ras) | Kredensial Kunci Aplikasi & Database |
|:-----:|:---|:---|:---|:---|:---|
| **200** | **IPTV (`iptv@s4ras`)** | `192.168.10.200:8096` (Jellyfin)<br>`192.168.10.200:9191` (Dispatcharr)<br>`192.168.10.200:5055` (Jellyseerr)<br>`192.168.10.200:80` (Caddy) | `s4ras-iptv`<br>`ssh iptv@100.64.0.10`<br>`ssh s4ras@100.64.0.10` | `iptv` (std) / `[REDACTED]`<br>`s4ras` (symlinked) / `[REDACTED]`<br>`root` / `[REDACTED]` | **Jellyfin Root**: `root` / `[REDACTED]`<br>**OIDC Secret**: `[REDACTED]`<br>**Dispatcharr**: `./dispatcharr_data`<br>**Jellyseerr**: `./jellyseerr_config`<br>**UFW**: Active (LAN + TS) |
| **201** | **VoIP Simpul 1 (`voip@s4ras`)** | `192.168.10.201:5060` (SIP)<br>`192.168.10.201:80` (HTTP) | `s4ras-voip`<br>`ssh voip@100.64.0.11` | `voip` (std) / `[REDACTED]`<br>`root` / `[REDACTED]` | **PJSIP**: `100` / `[REDACTED]`, `101` / `[REDACTED]`<br>**Voicemail PIN**: `[REDACTED]`<br>**UFW**: Active (LAN + TS) |
| **202** | **VoIP Simpul 2 (`voip@s4ras`)** | `192.168.10.202:5060` (SIP)<br>`192.168.10.202:80` (Caddy)<br>`192.168.10.202:8088` (WS)<br>`192.168.10.202:3478` (CoTURN STUN/TURN) | `s4ras-voip2`<br>`ssh voip@100.64.0.12`<br>*(or LAN jump VM 204)* | `voip` (std) / `[REDACTED]`<br>`root` / `[REDACTED]` | **PJSIP 1001-1004**: md5 hashes `[REDACTED]`<br>**WebRTC 1074700**: `[REDACTED]`<br>**CoTURN Secret**: `[REDACTED]`<br>**Relay Range**: `49152:49250/udp`<br>**Voicemail PIN**: `[REDACTED]`<br>**UFW**: Active (LAN + TS + CoTURN) |
| **203** | **LMS (`lms@s4ras`)** | `192.168.10.203:80` (Caddy)<br>`192.168.10.203:8080` (Moodle)<br>`192.168.10.203:3000` (Gotenberg)<br>`192.168.10.203:9187` (DB Exporter) | `s4ras-lms`<br>`ssh lms@100.64.0.13`<br>`ssh s4ras@100.64.0.13` | `lms` (std) / `[REDACTED]`<br>`s4ras` (symlinked) / `[REDACTED]`<br>`root` / `[REDACTED]` | **PostgreSQL 15**: `moodleuser` / `[REDACTED]`<br>**Postgres Exporter**: `9187/tcp`<br>**Moodle Admin**: Keycloak OIDC (`admin`)<br>**OIDC Secret**: `[REDACTED]`<br>**Gotenberg**: Stateless PDF Conversion API<br>**UFW**: Active (LAN + TS) |
| **204** | **Monitoring (`monitor@s4ras`)** | `192.168.10.204:3000` (Grafana)<br>`192.168.10.204:3001` (Uptime Kuma)<br>`192.168.10.204:9090` (Prom)<br>`192.168.10.204:9093` (Alert)<br>`192.168.10.204:3100` (Loki)<br>`192.168.10.204:8080` (CrowdSec) | `s4ras-monitor`<br>`ssh monitor@100.64.0.14`<br>`ssh admin-node@100.64.0.14` | `monitor` (std) / `[REDACTED]`<br>`admin-node` (symlinked) / `[REDACTED]`<br>`root` / `[REDACTED]` | **Grafana Admin**: `admin` / `[REDACTED]`<br>**OIDC Secret**: `[REDACTED]`<br>**Loki 3.0**: Port `3100` (9/9 nodes Promtail)<br>**CrowdSec LAPI**: Port `8080` (Cluster Whitelisted)<br>**Uptime Kuma**: Setup via First Web Access<br>**WebDAV Backup Auth**: `admin:[REDACTED]`<br>**DR Automated Drill**: `/usr/local/bin/test_dr_restore.sh`<br>**UFW**: Active (LAN + TS) |
| **205** | **VoIP 3 Workstation (`voip@s4ras`)** | `192.168.10.205` (LAN) | *(LAN Direct / Jump VM 204)* | `voip` (std) / `[REDACTED]`<br>`root` / `[REDACTED]` | Workstation Desktop GUI: `voip` / `[REDACTED]`<br>Node Exporter: `9100/tcp`<br>**UFW**: Active (LAN + TS) |
| **206** | **SSO (`sso@s4ras`)** | `192.168.10.206:8080` (Keycloak)<br>`192.168.10.206:9187` (DB Exporter) | `s4ras-sso`<br>`ssh sso@100.64.0.16` | `sso` (std) / `[REDACTED]`<br>`root` / `[REDACTED]` | **PostgreSQL 16**: `keycloak` / `[REDACTED]`<br>**Postgres Exporter**: `9187/tcp` (`sso_postgres_exporter`)<br>**Master Admin**: `admin` / `[REDACTED]`<br>**UFW**: Active (LAN + TS) |
| **207** | **SAN (`san@s4ras`)** | `192.168.10.207:80` (Nginx)<br>`192.168.10.207:8080` (App)<br>`192.168.10.207:9104` (DB Exporter) | `s4ras-san`<br>`ssh san@100.64.0.17` | `san` (std) / `[REDACTED]`<br>`root` / `[REDACTED]` | **MariaDB 11.7**: `user` / `[REDACTED]` (Root: `[REDACTED]`)<br>**MySQL Exporter**: `9104/tcp` (`nextcloud_mysqld_exporter`)<br>**Nextcloud Admin**: `admin` / `[REDACTED]`<br>**OIDC Secret**: `[REDACTED]`<br>**UFW**: Active (LAN + TS) |
| **208** | **Portal & Edge (`portal@s4ras`)** | `192.168.10.208:3000` (Node BFF)<br>`127.0.0.1:6379` (Redis) | `s4ras-portal`<br>`ssh portal@100.64.0.18` | `portal` (std) / `[REDACTED]`<br>`root` / `[REDACTED]` | **Cloudflare Tunnel Secret**: `[REDACTED]`<br>**DNS Token**: `[REDACTED]`<br>**Deploy Token**: `[REDACTED]`<br>**Redis Cache**: `127.0.0.1:6379` (Standalone)<br>**CrowdSec Bouncer**: Key `[REDACTED]`<br>**UFW**: Active (LAN + TS) |
| **209** | **JMeter Benchmark (`benchmark@s4ras`)** | `192.168.10.209:8088` (Report Server) | `s4ras-benchmark`<br>`ssh benchmark@100.64.0.19`<br>`ssh admin-node@100.64.0.19` | `benchmark` (std) / `[REDACTED]`<br>`admin-node` (symlinked) / `[REDACTED]`<br>`root` / `[REDACTED]` | **JMeter Suite**: `/home/admin-node/apache-jmeter-5.6.3`<br>**Runner Suite**: `/home/admin-node/run_progressive_suite.sh`<br>**SIPp Benchmark**: `/home/admin-node/run_sipp_benchmark.sh`<br>**Report Server**: `http://192.168.10.209:8088`<br>**SIPp Reports**: `http://192.168.10.209:8088/sipp/`<br>**User Dataset**: `student1-3`, `teacher1-2`, `admin`<br>**UFW**: Active (LAN + TS) |


---

## 2. Rincian Lengkap Kredensial per Virtual Machine

---

### VM 200: IPTV & Media Streaming (Jellyfin, Dispatcharr, Jellyseerr)
* **Peran Layanan**: Media Streaming Server (Anime, Cinema Movies, Kuliah Edukasi), IPTV Proxy Stream Manager (Dispatcharr), dan Media Request & Discovery Gateway (Jellyseerr)
* **Domain Publik**:
  * Jellyfin Web UI: `https://iptv.s4ras.site`
  * Dispatcharr Web UI & Proxy: `https://dispatcharr.s4ras.site`
  * Jellyseerr Web UI: `https://request.s4ras.site`
* **Port Layanan**:
  * Jellyfin Core: `192.168.10.200:8096`
  * Dispatcharr IPTV Proxy: `192.168.10.200:9191`
  * Jellyseerr Request Manager: `192.168.10.200:5055`
  * Caddy Reverse Proxy: `192.168.10.200:80`
  * Prometheus Node Exporter: `192.168.10.200:9100`
* **Kredensial Sistem Operasi (OS)**:
  * Username: `s4ras` | Password: `[REDACTED]` (Sudoer)
  * Username: `root` | Password: `[REDACTED]`
  * SSH Direct LAN: `ssh s4ras@192.168.10.200`
  * Tailscale SSH: `ssh s4ras@100.64.0.10`
* **Kredensial Aplikasi Jellyfin**:
  * Local Admin Username: `root`
  * Local Admin Password: `[REDACTED]`
  * API Token / Emby Header: Disinkronkan via Header OIDC SSO
* **Keycloak OIDC Integration**:
  * Realm: `S4RAS`
  * Client ID: `jellyfin`
  * Client Secret: `[REDACTED]`
  * Redirect URIs: `https://iptv.s4ras.site/*`
* **Struktur Docker**:
  * Direktori Basis: `/home/s4ras/jellyfin/`
  * Container Jellyfin: `jellyfin` (`jellyfin/jellyfin:latest`)
  * Container Dispatcharr: `dispatcharr` (`ghcr.io/dispatcharr/dispatcharr:latest`)
  * Container Jellyseerr: `jellyseerr` (`fallenbagel/jellyseerr:latest`)
  * Persistent Data Dispatcharr: `/home/s4ras/jellyfin/dispatcharr_data/`
  * Persistent Data Jellyseerr: `/home/s4ras/jellyfin/jellyseerr_config/`
  * M3U Channels File: `/home/s4ras/jellyfin/dispatcharr_data/m3us/s4ras_channels.m3u`
  * XMLTV EPG File: `/home/s4ras/jellyfin/dispatcharr_data/epgs/s4ras_epg.xml`
  * Cloudflare CNAME Dispatcharr Record ID: `[REDACTED]`
  * Cloudflare CNAME Jellyseerr Record ID: `[REDACTED]`

---

### VM 201: VoIP Server Simpul 1 (Asterisk 20 PBX)
* **Peran Layanan**: PBX Simpul 1 (Telefoni Kampus & Voicemail Mailbox)
* **Port Layanan**:
  * SIP Signaling (UDP): `192.168.10.201:5060`
  * HTTP Web: `192.168.10.201:80` (Apache2)
  * Prometheus Node Exporter: `192.168.10.201:9100`
  * Asterisk Manager Interface (AMI): `127.0.0.1:5038`
* **Kredensial Sistem Operasi (OS)**:
  * Username: `voip` | Password: `[REDACTED]` (Sudoer)
  * Username: `root` | Password: `[REDACTED]`
  * SSH Direct LAN: `ssh voip@192.168.10.201`
  * Tailscale SSH: `ssh voip@100.64.0.11`
* **Akun PJSIP SIP Extensions**:
  * Ext `100` (Standard UDP): Username `100` | Password: `[REDACTED]` | Context: `internal`
  * Ext `101` (Standard UDP): Username `101` | Password: `[REDACTED]` | Context: `internal`
* **Kredensial Voicemail Mailboxes (`/etc/asterisk/voicemail.conf`)**:
  * Mailbox `100`: PIN `[REDACTED]` | Nama: Rafli | Email: `rafli@s4ras.site`
  * Mailbox `101`: PIN `[REDACTED]` | Nama: Admin | Email: `admin@s4ras.site`
  * Mailbox `1001`: PIN `[REDACTED]` | Nama: Budi Pratama | Email: `student1@s4ras.site`
  * Mailbox `1002`: PIN `[REDACTED]` | Nama: Dr. Hendra Wijaya | Email: `teacher1@s4ras.site`
  * Mailbox `1003`: PIN `[REDACTED]` | Nama: S4RAS DevOps Admin | Email: `dev1@s4ras.site`
  * Voicemail IVR Access: Dial `500` (atau `*98`)
  * **Catatan Integrasi Portal BFF**: VM 201 merupakan host aktif modul `app_voicemail.so` yang diprobing langsung oleh endpoint Express BFF VM 208 (`GET /api/voicemail/status?ext=XXXX`).
* **Inter-PBX SIP Trunk**:
  * Trunk Endpoint: `[vm202-trunk]` -> Target: `sip:192.168.10.202:5060`
  * Codecs: `ulaw, alaw, g722`
  * Failover Handling: Calls to `_1XXX` and `600` route through trunk; falls back to local IVR upon trunk congestion.

---

### VM 202: VoIP Server Simpul 2 (Asterisk 22 PBX & WebRTC)
* **Peran Layanan**: PBX Simpul 2 (Primary Campus Telephony, WebRTC WebSocket, Interactive IVR)
* **Domain Publik**: `https://voip.s4ras.site`
* **Port Layanan**:
  * Caddy Reverse Proxy: `192.168.10.202:80`
  * SIP Signaling (UDP): `192.168.10.202:5060`
  * WebRTC WebSocket (WS): `192.168.10.202:8088` (`/ws`)
  * WebRTC Secure WebSocket (WSS): `192.168.10.202:8089`
  * Prometheus Node Exporter: `192.168.10.202:9100`
* **Kredensial Sistem Operasi (OS)**:
  * Username: `voip` | Password: `[REDACTED]` (Sudoer)
  * Username: `root` | Password: `[REDACTED]`
  * Akses SSH: Melalui LAN `192.168.10.202` atau via Jump Host VM 204 (`ssh admin-node@100.64.0.14`)
* **Akun PJSIP Extensions & Kata Sandi (`/etc/asterisk/pjsip.conf`)**:
  * Ext `1001` (Mahasiswa - Budi Pratama):
    * Username: `1001` | Password: `[REDACTED]`
    * Transport: `transport-udp` / WebRTC Compatible
  * Ext `1002` (Dosen - Dr. Hendra Wijaya):
    * Username: `1002` | Password: `[REDACTED]`
    * Transport: `transport-udp` (MicroSIP / Desktop)
  * Ext `1003` (DevOps Admin):
    * Username: `1003` | Password: `[REDACTED]`
    * Transport: `transport-ws` (WebRTC in-browser)
  * Ext `1004` (General Telephony):
    * Username: `1004` | Password: `[REDACTED]`
    * Transport: `transport-ws` (WebRTC in-browser)
  * Ext `1074700` (Operator WebRTC Admin):
    * Username: `1074700` | Password: `[REDACTED]`
    * Transport: `transport-ws` (DTLS-SRTP Enabled)
  * Ext `1079348` (Sivitas Peneliti):
    * Username: `1079348` | Password: `[REDACTED]`
    * Transport: `transport-ws` (DTLS-SRTP Enabled)
  * Ext `12345678910111` (Legacy Testing):
    * Username: `12345678910111` | Password: `[REDACTED]`
* **Kredensial Voicemail Mailboxes (`/etc/asterisk/voicemail.conf`)**:
  * Mailbox `1001`: PIN `[REDACTED]` | Budi Pratama (`student1@s4ras.site`)
  * Mailbox `1002`: PIN `[REDACTED]` | Dr. Hendra Wijaya (`teacher1@s4ras.site`)
  * Mailbox `1003`: PIN `[REDACTED]` | S4RAS DevOps Admin (`dev1@s4ras.site`)
  * Mailbox `1234`: PIN `[REDACTED]`
* **Layanan Cepat (Speed Dial) & Trunk**:
  * Ext `100`: Speed Dial direct Trunk ke Asterisk Simpul 1
  * Ext `101`: Speed Dial direct IVR Simpul 2
  * Ext `600`: Echo Audio Test
  * Ext `1000`: Campus IVR Menu Utama
  * Trunk Endpoint: `[vm201-trunk]` -> Target: `sip:192.168.10.201:5060`

---

### VM 203: LMS (Moodle 4.5.2 & Gotenberg)
* **Peran Layanan**: Learning Management System Akademik (Kursus KOM-401, SBD-201, JK-302) & Stateless Document Conversion Engine (Gotenberg)
* **Domain Publik**: `https://moodle.s4ras.site`
* **Port Layanan**:
  * Caddy Reverse Proxy: `192.168.10.203:80`
  * Moodle Container Apache: `192.168.10.203:8080`
  * PostgreSQL 15 Container: `192.168.10.203:5432`
  * Gotenberg PDF Conversion API: `192.168.10.203:3000`
  * Prometheus Node Exporter: `192.168.10.203:9100`
* **Kredensial Sistem Operasi (OS)**:
  * Username: `s4ras` | Password: `[REDACTED]` (Sudoer)
  * Username: `root` | Password: `[REDACTED]`
  * SSH Direct LAN: `ssh s4ras@192.168.10.203`
  * Tailscale SSH: `ssh s4ras@100.64.0.13`
* **Kredensial Database PostgreSQL 15**:
  * Container Name: `postgres` (`bitnami/postgresql:15`)
  * Host: `postgres` (internal network) / `192.168.10.203:5432`
  * Database: `moodledb`
  * Username: `moodleuser`
  * Password: `[REDACTED]`
  * Root Superuser: `postgres` | Password: `[REDACTED]`
* **Kredensial Aplikasi Moodle**:
  * Administrator Utama: `admin` | Autentikasi: `oidc` (Keycloak SSO) | Password: `[REDACTED]`
  * Akun Manual Guest: `guest` (Akses tamu terbatas)
* **Keycloak OIDC Integration**:
  * Realm: `S4RAS`
  * Client ID: `moodle`
  * Client Secret: `[REDACTED]`
  * Auth URL: `https://sso.s4ras.site/realms/S4RAS/protocol/openid-connect/auth`
  * Token URL: `https://sso.s4ras.site/realms/S4RAS/protocol/openid-connect/token`
  * UserInfo URL: `https://sso.s4ras.site/realms/S4RAS/protocol/openid-connect/userinfo`
  * Redirect URIs: `https://moodle.s4ras.site/auth/oidc/*`
* **Gotenberg Stateless PDF Engine**:
  * Direktori Basis: `/home/s4ras/gotenberg/`
  * Container Name: `gotenberg` (`gotenberg/gotenberg:8`)
  * Health Endpoint: `http://192.168.10.203:3000/health` (HTTP 200 OK)
  * API Endpoints: `/forms/chromium/convert/url`, `/forms/libreoffice/convert`
  * Memory Allocation: 512MB RAM cap

---

### VM 204: Observabilitas & Monitoring (Prometheus, Grafana, Uptime Kuma)
* **Peran Layanan**: Monitoring Metrik Terpusat, Alertmanager, Grafana Dashboard, dan Public Service Status Page (Uptime Kuma)
* **Domain Publik**:
  * Grafana Dashboard: `https://monitor.s4ras.site`
  * Uptime Kuma Status Page: `https://status.s4ras.site`
* **Port Layanan**:
  * Grafana Dashboard: `192.168.10.204:3000`
  * Uptime Kuma Engine: `192.168.10.204:3001`
  * Prometheus Server: `192.168.10.204:9090`
  * Prometheus Alertmanager: `192.168.10.204:9093`
  * Prometheus Blackbox Exporter: `192.168.10.204:9115`
  * Prometheus Node Exporter: `192.168.10.204:9100`
* **Kredensial Sistem Operasi (OS)**:
  * Username: `admin-node` | Password: `[REDACTED]` (Sudoer)
  * Username: `root` | Password: `[REDACTED]`
  * SSH Direct LAN: `ssh admin-node@192.168.10.204`
  * Tailscale SSH: `ssh admin-node@100.64.0.14`
* **Kredensial Aplikasi Grafana**:
  * Local Admin Username: `admin`
  * Local Admin Password: `[REDACTED]`
  * URL Dashboard Utama: `https://monitor.s4ras.site/d/s4ras-ecosystem-overview/`
* **Kredensial Uptime Kuma Status Page**:
  * Akses Web Pertama: `https://status.s4ras.site` (Setup initial administrator)
  * Struktur Docker: Container `uptime-kuma` (`louislam/uptime-kuma:1`)
  * Direktori Basis: `/home/admin-node/uptime-kuma/docker-compose.yml`
  * Persistent Volume: `s4ras_uptime_kuma_data`
  * Cloudflare CNAME Record ID: `[REDACTED]`
* **Keycloak OIDC Integration**:
  * Realm: `S4RAS`
  * Client ID: `grafana`
  * Client Secret: `[REDACTED]`
  * Role Mapping: `contains(realm_access.roles[*], 'admin') && 'Admin' || 'Viewer'`
* **Kredensial Replikasi Backup Ekosistem**:
  * Script Otomatis: `/usr/local/bin/backup_all_databases.sh`
  * Systemd Timer: `s4ras-backup.timer` (Setiap hari pukul 02:00:00 WIB)
  * Target WebDAV SAN: `http://192.168.10.207/remote.php/dav/files/admin/System_Backups/`
  * WebDAV Auth: `admin:[REDACTED]`

---

### VM 205: VoIP 3 Client Workstation
* **Peran Layanan**: Workstation Uji Klien Softphone & Desktop UI (Ubuntu Desktop)
* **Port Layanan**:
  * Prometheus Node Exporter: `192.168.10.205:9100`
* **Kredensial Sistem Operasi (OS)**:
  * Username: `voip` | Password: `[REDACTED]` (Sudoer)
  * Username: `root` | Password: `[REDACTED]`
  * Akses GUI Desktop: Login via GDM display manager (`voip` / `[REDACTED]`)
  * Akses SSH: Direct LAN `192.168.10.205` atau via Jump Host VM 204

---

### VM 206: Single Sign-On (Keycloak 26.1)
* **Peran Layanan**: Identity & Access Management (OIDC, SAML, User Roles, Brute Force Protection)
* **Domain Publik**: `https://sso.s4ras.site`
* **Port Layanan**:
  * Keycloak HTTP: `192.168.10.206:8080`
  * Keycloak Management & Health / Metrics: `192.168.10.206:9000` (`/health/ready`, `/health/live`, `/metrics`)
  * PostgreSQL 16: `192.168.10.206:5432`
  * PostgreSQL Exporter: `192.168.10.206:9187`
  * Prometheus Node Exporter: `192.168.10.206:9100`
* **Kredensial Sistem Operasi (OS)**:
  * Username: `sso` | Password: `[REDACTED]` (Sudoer)
  * Username: `root` | Password: `[REDACTED]`
  * SSH Direct LAN: `ssh sso@192.168.10.206`
  * Tailscale SSH: `ssh sso@100.64.0.16`
* **Kredensial Database PostgreSQL 16**:
  * Container Name: `sso_database` (`postgres:16`)
  * Database Name: `keycloak`
  * Database User: `keycloak`
  * Database Password: `[REDACTED]`
  * Internal Port: `5432`
* **Kredensial Keycloak Master Admin**:
  * Realm: `master`
  * Admin Username: `admin`
  * Admin Password: `[REDACTED]`
  * URL Console: `https://sso.s4ras.site/admin/`
* **Daftar Klien OIDC (Realm `S4RAS`)**:
  * `jellyfin`: Secret `[REDACTED]` (Confidential)
  * `moodle`: Secret `[REDACTED]` (Confidential)
  * `nextcloud`: Secret `[REDACTED]` (Confidential)
  * `grafana`: Secret `[REDACTED]` (Confidential)
  * `saras-portal`: Public Client (PKCE, standard untuk React SPA)
  * `front-end`: Public Client (PKCE)
* **Kredensial Pengguna Terdaftar (Realm `S4RAS`)**:
  * `admin` (SuperAdmin): Password `[REDACTED]`
  * `student1` (Mahasiswa): Password `[REDACTED]`
  * `teacher1` (Dosen): Password `[REDACTED]`
  * `dev1` (DevOps Admin): Password `[REDACTED]`
  * `testuser`: Password `[REDACTED]` (Email: `civitas@s4ras.site`)

---

### VM 207: Storage Area Network (Nextcloud Hub 9)
* **Peran Layanan**: Cloud Storage SAN, Shared Repositories Akademik, dan WebDAV Backup Store
* **Domain Publik**: `https://cloud.s4ras.site`
* **Port Layanan**:
  * Nginx Host Ingress: `192.168.10.207:80` / `443`
  * Nextcloud Container: `192.168.10.207:8080`
  * MariaDB 11.7 Container: `192.168.10.207:3306`
  * Prometheus Node Exporter: `192.168.10.207:9100`
* **Kredensial Sistem Operasi (OS)**:
  * Username: `san` | Password: `[REDACTED]` (Sudoer)
  * Username: `root` | Password: `[REDACTED]`
  * SSH Direct LAN: `ssh san@192.168.10.207`
  * Tailscale SSH: `ssh san@100.64.0.17`
* **Kredensial Database MariaDB 11.7**:
  * Container Name: `nextcloud_db` (`mariadb:11.7.2`)
  * Database Name: `nextcloud`
  * Database User: `user`
  * Database Password: `[REDACTED]`
  * Database Root Password: `[REDACTED]`
* **Kredensial Aplikasi Nextcloud Hub**:
  * Local Admin Username: `admin`
  * Local Admin Password: `[REDACTED]`
* **Keycloak OIDC Integration**:
  * App: `user_oidc`
  * Provider: `Keycloak`
  * Client ID: `nextcloud`
  * Client Secret: `[REDACTED]`
* **WebDAV Endpoints & Folder Bersama**:
  * WebDAV Root: `https://cloud.s4ras.site/remote.php/dav/files/<username>/`
  * Directory Backups: `remote.php/dav/files/admin/System_Backups/`
  * Shared Academic Folders:
    * `/Materi_Kuliah` (Grup `Dosen`: Read-Write; Grup `Mahasiswa`: Read-Only)
    * `/Tugas_Mahasiswa` (Grup `Mahasiswa`: Read-Write; Grup `Dosen`: Read-Only)
    * `/Riset_Laboratorium` (Grup `Dosen`: Read-Write)

---

### VM 208: Portal S4RAS & Edge Gateway
* **Peran Layanan**: Unified Portal Web (React 19 SPA + Express 5 BFF), In-Memory Session & Cache Engine (Redis 7), Health Prober, WebRTC Softphone, dan Cloudflare Zero Trust Argo Ingress
* **Domain Publik**: `https://portal.s4ras.site` / `https://s4ras.site`
* **Port Layanan**:
  * Express BFF / Portal Web: `192.168.10.208:3000`
  * Redis In-Memory Cache: `127.0.0.1:6379`
  * Prometheus Node Exporter: `192.168.10.208:9100`
* **Kredensial Sistem Operasi (OS)**:
  * Username: `portal` | Password: `[REDACTED]` (Sudoer)
  * Username: `root` | Password: `[REDACTED]`
  * SSH Direct LAN: `ssh portal@192.168.10.208`
  * Tailscale SSH: `ssh portal@100.64.0.18`
* **Redis In-Memory Cache Engine**:
  * Direktori Basis: `/home/portal/portal-saras/`
  * Docker Compose: `/home/portal/portal-saras/docker-compose.redis.yml`
  * Container Name: `redis_cache` (`redis:7-alpine`)
  * Listen Address: `127.0.0.1:6379` (Localhost Loopback Only)
  * Persistent Volume: `redis_data`
  * Max Memory Policy: `allkeys-lru` (128MB limit)
* **Kredensial Cloudflare Zero Trust Ingress**:
  * Tunnel ID: `[REDACTED]`
  * Account Tag: `[REDACTED]`
  * Tunnel Secret: `[REDACTED]`
  * Credentials JSON: `/etc/cloudflared/<tunnel-id>.json`
* **Token API Cloudflare DNS (DNS-01 ACME Challenge)**:
  * Token: `[REDACTED]`
  * Stored in: `/home/portal/.secrets/cloudflare.ini`
* **Token Deploy CI/CD Production**:
  * Header: `X-Deploy-Token`
  * Token: `[REDACTED]`
  * Target Endpoint: `POST https://s4ras.site/api/deploy`

---

### VM 209: JMeter Load Testing & Benchmarking
* **Peran Layanan**: Runner Pengujian Beban (Stress Testing Moodle, Keycloak, Nextcloud) & Server Laporan Interaktif
* **Domain Publik**: `https://portal.s4ras.site/benchmark/`
* **Port Layanan**:
  * Benchmark Report HTTP Server: `192.168.10.209:8088`
  * Prometheus Node Exporter: `192.168.10.209:9100`
* **Kredensial Sistem Operasi (OS)**:
  * Username: `admin-node` | Password: `[REDACTED]` (Sudoer)
  * Username: `root` | Password: `[REDACTED]`
  * SSH Direct LAN: `ssh admin-node@192.168.10.209`
  * Tailscale SSH: `ssh admin-node@100.64.0.19`
* **Dataset Kredensial Pengujian JMeter (`users.csv`)**:
  * `student1` | `[REDACTED]`
  * `student2` | `[REDACTED]`
  * `student3` | `[REDACTED]`
  * `teacher1` | `[REDACTED]`
  * `teacher2` | `[REDACTED]`
  * `admin` | `[REDACTED]`

---

## 3. Matriks Persona Pengguna Resmi (Unified Ecosystem Personas)

Seluruh akun di bawah ini telah terdaftar dan aktif pada Keycloak Realm `S4RAS` untuk pengujian Single Sign-On di seluruh microservice:

| Parameter | Persona Mahasiswa (`student1`) | Persona Dosen (`teacher1`) | Persona Developer / Admin (`dev1`) | SuperAdmin (`admin`) |
|---|---|---|---|---|
| **Username** | `student1` | `teacher1` | `dev1` | `admin` |
| **Email** | `student1@s4ras.site` | `teacher1@s4ras.site` | `dev1@s4ras.site` | `admin@s4ras.site` |
| **Kata Sandi** | `[REDACTED]` | `[REDACTED]` | `[REDACTED]` | `[REDACTED]` |
| **Nama Lengkap** | Budi Pratama | Dr. Hendra Wijaya | DevOps Administrator | System Administrator |
| **Role Keycloak** | `Mahasiswa` | `Dosen` | `admin`, `Super Admin` | `admin`, `Super Admin` |
| **Ekstensi PJSIP** | **`1001`** | **`1002`** | **`1003`** / `1074700` | `1074700` (WebRTC) |
| **Password SIP** | `[REDACTED]` | `[REDACTED]` | `[REDACTED]` | `[REDACTED]` |
| **Voicemail PIN** | `[REDACTED]` | `[REDACTED]` | `[REDACTED]` | `[REDACTED]` |
| **Akses Moodle** | Siswa (Enrolled 3 Kursus) | Pengajar (Course Creator) | Admin Sistem | Super Administrator |
| **Akses Nextcloud**| Quota 10 GB (`Mahasiswa`) | Quota 50 GB (`Dosen`) | Unlimited (`Admin`) | Super Admin SAN |
| **Akses Grafana** | `Viewer` (Read-Only Status) | `Viewer` (Read-Only Status)| `Admin` (Editor/Admin) | `Admin` (Penuh) |
| **Akses Jellyfin**| Streaming Edukasi / Live TV | Uploader Materi / Penonton | Administrator IPTV | Administrator IPTV |
| **Badge Portal** | [Mahasiswa] (Emerald) | [Dosen] (Indigo) | [Administrator] (Amber) | [Administrator] (Amber) |

---

## 4. Prosedur Tanggap Darurat Kredensial (Credential Recovery Runbook)

1. **Reset Password Administrator Keycloak (VM 206)**:
   ```bash
   # Di VM 206:
   docker exec -it sso_keycloak /opt/keycloak/bin/kc.sh set-password -u admin -p <NEW_PASSWORD>
   ```
2. **Reset Password Administrator Nextcloud (VM 207)**:
   ```bash
   # Di VM 207:
   docker exec -u www-data nextcloud_app php occ user:resetpassword admin
   ```
3. **Reset Password Administrator Moodle (VM 203)**:
   ```bash
   # Di VM 203:
   docker exec -u daemon moodle php /bitnami/moodle/admin/cli/reset_password.php
   ```
4. **Reset Password Grafana Admin (VM 204)**:
   ```bash
   # Di VM 204:
   docker exec -it grafana grafana-cli admin reset-admin-password <NEW_PASSWORD>
   ```
5. **Reload Asterisk PJSIP Credentials (VM 202 / VM 201)**:
   ```bash
   sudo asterisk -rx "pjsip reload"
   sudo asterisk -rx "pjsip show endpoints"
   ```

---

## 5. Daftar Rotasi Wajib (dibuat otomatis saat redaksi 2026-10-22)

Checklist kredensial yang **sebelumnya plaintext di file bersistem git** dan harus dianggap bocor, diurutkan dari paling kritis:

- [ ] **Password root SSH yang seragam** di 7 VM (201, 202, 203, 204, 205, 207, 208, 209) dan user non-root `s4ras`/`voip`/`lms`/`monitor`/`sso`/`san`/`portal`/`benchmark`/`admin-node` di VM yang sama (nilainya sama persis di semua VM tersebut sebelum redaksi ini). Satu kebocoran = akses root ke hampir seluruh kluster.
- [ ] **Cloudflare Tunnel Secret, Account Tag, Tunnel ID** (VM 208) — kontrol penuh ingress publik `s4ras.site`.
- [ ] **Token API Cloudflare DNS** (VM 208) — bisa mengubah DNS zona `s4ras.site`.
- [ ] **Token Deploy CI/CD Production** `X-Deploy-Token` (VM 208) — bisa memicu deploy ke production tanpa lewat GitHub Actions.
- [ ] **CrowdSec Bouncer Key** (VM 208).
- [ ] Semua **OIDC Client Secret** Keycloak: `jellyfin`, `moodle`, `nextcloud`, `grafana`.
- [ ] **Password database**: PostgreSQL Moodle (`moodleuser`/root superuser), PostgreSQL Keycloak, MariaDB Nextcloud (user + root — keduanya sama persis, prioritas tinggi).
- [ ] **Password admin aplikasi**: Keycloak master `admin`, Grafana `admin`/`admin` (kredensial default yang tidak pernah diganti — risiko tertinggi), Nextcloud `admin`, Moodle `admin`.
- [ ] **WebDAV Backup Auth** (VM 204 → VM 207) — akses tulis ke seluruh backup database harian.
- [ ] Seluruh **password SIP PJSIP** (hash MD5 di VM 202, plaintext di VM 201) dan **PIN voicemail** (banyak di antaranya `1234`, termasuk di akun admin).
- [ ] Password akun uji JMeter (VM 209) jika reusable di sistem lain.

**Setelah rotasi**: simpan nilai baru di secrets manager (Vault/SOPS/1Password dsb), bukan file `.md` yang di-commit. Tambahkan `VM_ACCESS.md` dan `ECOSYSTEM_ARCHITECTURE.md` (bagian kredensial) ke `.gitignore` atau enkripsi dengan `git-crypt`, dan jalankan `git filter-repo` / BFG Repo-Cleaner untuk menghapus nilai lama dari riwayat git jika repo ini pernah di-push.
