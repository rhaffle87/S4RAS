# S4RAS LMS Service Architecture Document

Dokumen ini mendokumentasikan arsitektur teknis, topologi jaringan, komponen container, dan spesifikasi infrastruktur untuk layanan **Learning Management System (LMS) Moodle** pada ekosistem S4RAS (VM Proxmox ID 203).

---

## 1. Spesifikasi Virtual Machine & Host Environment

* **VM ID**: 203
* **Hostname**: `s4ras-lms`
* **Sistem Operasi**: Ubuntu 24.04 LTS (Noble Numbat) Desktop / Server
* **Kernel**: Linux 6.8.0-x86_64
* **Alamat IP Internal (LAN)**: `192.168.10.203/24` (Interface: `ens18`)
* **Default Gateway**: `192.168.10.1`
* **DNS Resolver**: `8.8.8.8`, `1.1.1.1`, `192.168.10.1`
* **Tailscale IP**: `100.64.0.13` (Interface: `tailscale0`)
* **Container Runtime**: Docker Engine 27.x + Docker Compose Plugin v2
* **Reverse Proxy Host**: Caddy 2.x systemd service (`/etc/caddy/Caddyfile`)
* **Monitoring Exporter**: Prometheus Node Exporter 1.8.x listening on `:9100`

---

## 2. Containerized Application Architecture

Layanan LMS dijalankan sepenuhnya di dalam Docker Compose yang berlokasi di direktori `/opt/moodle/docker-compose.yml`.

### 2.1. Matriks Komponen & Layanan

```
+--------------------------------------------------------------------------------+
| VM 203 Host (s4ras-lms)                                                        |
|                                                                                |
|  [Caddy Reverse Proxy] (:80)                                                  |
|         │                                                                      |
|         ▼ HTTP reverse_proxy localhost:8080                                   |
|  +--------------------------------------------------------------------------+  |
|  | Docker Bridge Network: moodle_net (172.18.0.0/16)                        |  |
|  |                                                                          |  |
|  |   +------------------------------------------------------------------+   |  |
|  |   | Container: moodle (bitnami/moodle:4.5.2)                         |   |  |
|  |   | - Port Host: 8080 -> Container: 8080                             |   |  |
|  |   | - Web Server: Apache 2.4 (Bitnami Prefork)                       |   |  |
|  |   | - PHP Runtime: PHP 8.2/8.3 with OPCache                          |   |  |
|  |   | - Plugin Auth: auth_oidc (Keycloak SSO Integration)             |   |  |
|  |   | - Background Worker: Moodle CLI Cron daemon                      |   |  |
|  |   +------------------------------------------------------------------+   |  |
|  |                              │                                           |  |
|  |                              ▼ TCP 5432 (PostgreSQL Protocol)            |  |
|  |   +------------------------------------------------------------------+   |  |
|  |   | Container: postgres (bitnami/postgresql:15)                      |   |  |
|  |   | - Database: moodledb                                             |   |  |
|  |   | - User: moodleuser                                               |   |  |
|  |   | - Healthcheck: pg_isready -U postgres                             |   |  |
|  |   +------------------------------------------------------------------+   |  |
|  +--------------------------------------------------------------------------+  |
|                                                                                |
|  [Node Exporter] (:9100)                                                       |
+--------------------------------------------------------------------------------+
```

### 2.2. Spesifikasi Container

#### 1. Container `moodle`
* **Image**: `bitnami/moodle:4.5.2`
* **Container Name**: `moodle`
* **Port Binding**: `8080:8080` (TCP)
* **Environment Variables**:
  * `MOODLE_DATABASE_TYPE=pgsql`
  * `MOODLE_DATABASE_HOST=postgres`
  * `MOODLE_DATABASE_PORT_NUMBER=5432`
  * `MOODLE_DATABASE_USER=moodleuser`
  * `MOODLE_DATABASE_PASSWORD=root`
  * `MOODLE_DATABASE_NAME=moodledb`
  * `MOODLE_ENABLE_HTTPS=yes`
* **Persistent Volumes**:
  * `moodle_data` -> `/bitnami/moodle` (Core application codebase, custom themes, and installed plugins)
  * `moodledata` -> `/bitnami/moodledata` (Uploaded learning content, user avatars, session cache, course files, and cron logs)

#### 2. Container `postgres`
* **Image**: `bitnami/postgresql:15`
* **Container Name**: `postgres`
* **Port**: `5432` (Internal docker network only, unexposed to host for security)
* **Environment Variables**:
  * `POSTGRESQL_USERNAME=moodleuser`
  * `POSTGRESQL_PASSWORD=root`
  * `POSTGRESQL_DATABASE=moodledb`
  * `ALLOW_EMPTY_PASSWORD=no`
* **Persistent Volumes**:
  * `postgresql_data` -> `/bitnami/postgresql` (Database storage engine files, tables, indexes, and write-ahead logs)
* **Healthcheck**: `CMD-SHELL pg_isready -U postgres` (Interval: 10s, Timeout: 5s, Retries: 10)

---

## 3. End-to-End Traffic Flow

1. **Client Request**:
   Pengguna membuka `https://moodle.s4ras.site` di browser.
2. **Cloudflare Edge**:
   Cloudflare mengakhiri koneksi TLS publik dan merutekan traffic melalui secure WebSocket/QUIC tunnel ke agent `cloudflared` yang aktif di VM 208 (`s4ras-portal`).
3. **Internal Routing (VM 208 -> VM 203)**:
   Agent Cloudflare Tunnel meneruskan HTTP request melalui LAN internal ke IP `192.168.10.203:80`.
4. **Host Reverse Proxy (Caddy)**:
   Caddy pada VM 203 menerima request pada port 80, menambahkan header:
   * `Host: moodle.s4ras.site`
   * `X-Forwarded-Proto: https`
   * `X-Forwarded-For: {remote_host}`
   * `X-Real-IP: {remote_host}`
   dan melakukan proxying ke `localhost:8080`.
5. **Bitnami Apache & PHP-FPM**:
   Apache melayani request pada container port 8080. Konfigurasi `config.php` membaca header `X-Forwarded-Proto: https` dan mengaktifkan flag `$_SERVER['HTTPS'] = 'on'`, memastikan Moodle mengembalikan seluruh link, asset, dan form action menggunakan protokol HTTPS yang valid (`https://moodle.s4ras.site`).
6. **Database Persistence**:
   Query data kursus, modul kuis, submission, dan status akun diproses oleh PostgreSQL 15 melalui virtual switch Docker bridge (`moodle_net`).
7. **SSO Identity Flow**:
   Saat pengguna memilih login via SSO, Moodle mengarahkan browser ke Keycloak (`https://sso.s4ras.site/realms/S4RAS/protocol/openid-connect/auth`). Setelah login berhasil, Keycloak mengembalikan authorization code ke `https://moodle.s4ras.site/auth/oidc/`. Container Moodle melakukan direct backchannel HTTP POST ke token endpoint Keycloak untuk menukarkan code dengan ID Token dan UserInfo.

---

## 4. Background Processing & Cron Architecture

Moodle membutuhkan daemon terjadwal (cron) untuk memproses kalkulasi nilai, pengiriman notifikasi email/forum, sinkronisasi enrollment, dan penghapusan temporary file.

* **Eksekutor**: Daemon script bawaan Bitnami yang berjalan secara background di dalam container:
  ```bash
  /opt/bitnami/php/bin/php /opt/bitnami/moodle/admin/cli/cron.php
  ```
* **Frekuensi**: Berjalan setiap 1 menit secara loop otomatis (`Waiting for next scheduled task`).
* **Log Output**: `/bitnami/moodledata/moodle-cron.log`.
* **State**: Active and healthy (`ps aux` mengonfirmasi proses PHP cron aktif tanpa hung tasks).

---

## 5. Security & Isolation Measures

1. **PostgreSQL Database Isolation**:
   Database port 5432 tidak di-publish ke antarmuka eksternal (`0.0.0.0:5432`). Akses database hanya dapat dilakukan melalui container `moodle` di dalam jaringan bridge privat `moodle_net` atau via `docker exec`.
2. **Reverse Proxy Header Hardening**:
   Caddy menjamin request ke Moodle menyertakan header forwarder yang bersih tanpa kebocoran IP internal cluster.
3. **Session Cookies**:
   Cookie session Moodle (`MoodleSession`) ditandai dengan atribut `secure; HttpOnly`, mencegah pencurian session ID melalui serangan Cross-Site Scripting (XSS).
4. **Tailscale Zero Trust**:
   Akses remote administratif ke VM 203 diamankan dengan Tailscale SSH berbasis wireguard identity tanpa membuka port SSH ke internet publik.
