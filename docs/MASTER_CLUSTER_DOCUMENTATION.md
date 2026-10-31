# Master Technical & Operational Documentation — Kluster S4RAS (Solution for Remote Area Services)

## 1. Arsitektur Infrastruktur & Standarisasi 9 VM Kluster
Seluruh kluster beroperasi di atas virtualisasi Proxmox VE yang terhubung melalui jaringan internal (`192.168.10.0/24`), mesh VPN Tailscale (`100.x.y.z`), serta terekspos ke publik melalui Cloudflare Zero Trust Tunnel (`cloudflared`) yang berpusat di VM 208 (`100.123.192.3`).

### Tabel Topologi & Inventaris Node Kluster
| Node | Hostname | IP Tailscale | IP LAN | Peran & Layanan Utama | RAM Sesudah Optimasi |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **VM 200** | `s4ras` | `100.86.164.92` | `192.168.10.200` | IPTV (Jellyfin, Dispatcharr, Jellyseerr, Relay) | 1,617 MB / 3,910 MB |
| **VM 201** | `s4ras-voip` | `100.125.250.53` | `192.168.10.201` | VoIP Core 1 (Asterisk 20 SIP Failover PBX) | 452 MB / 1,967 MB |
| **VM 202** | `s4ras` | `100.83.239.40` | `192.168.10.202` | VoIP Core 2 (Asterisk 22 WebRTC + CoTURN) | 491 MB / 1,963 MB |
| **VM 203** | `s4ras-lms` | `100.108.104.25` | `192.168.10.203` | LMS (Moodle, Gotenberg PDF, PostgreSQL) | 1,370 MB / 4,912 MB |
| **VM 204** | `s4ras` | `100.102.31.45` | `192.168.10.204` | Observabilitas (Grafana, Prometheus, Kuma) | 1,310 MB / 3,911 MB |
| **VM 206** | `s4ras-sso` | `100.95.158.77` | `192.168.10.206` | Identity Provider (Keycloak 26.1.5, Postgres) | 1,319 MB / 3,842 MB |
| **VM 207** | `s4ras` | `100.119.6.12` | `192.168.10.207` | SAN Cloud (Nextcloud, Collabora, MariaDB) | 1,282 MB / 3,911 MB |
| **VM 208** | `s4ras-portal` | `100.123.192.3` | `192.168.10.208` | Portal BFF, Caddy/Nginx, Cloudflared, 2x Runner | 950 MB / 3,910 MB |
| **VM 209** | `s4ras` | `100.71.250.20` | `192.168.10.209` | Benchmark Engine (Apache JMeter 5.6.3 CLI) | 438 MB / 1,963 MB |

### Standarisasi Akun Sistem, Sudoers, & SSH
- **Unifikasi Akun Manusia Tunggal (`s4ras`)**:
  - Akun lama yang terfragmentasi (`nathan`, `voip`, `lms`, `portal`, `san`, `sso`, `glorio`, `benchmark`, `iptv`, `monitor`) telah dihapus secara bersih (`userdel -f`).
  - Akun daemon sistem (UID < 1000 serta akun telemetri `prometheus-exporter` dan `grok_exporter` di VM 204) dipertahankan.
  - Akun utama `s4ras` dibuat seragam di ke-9 VM dengan shell `/bin/bash`, grup `sudo`, dan grup `docker`.
  - Hak akses sudo tanpa password dikonfigurasi melalui `/etc/sudoers.d/s4ras` (`0440`) dengan aturan `s4ras ALL=(ALL) NOPASSWD:ALL`.
- **Migrasi Direktori & Symlink Kompatibilitas Mundur**:
  - Seluruh isi `/home/<user_lama>` disalin ke `/home/s4ras` dengan kepemilikan penuh `s4ras:s4ras`.
  - Direktori lama digantikan oleh symbolic link (`/home/<user_lama> -> /home/s4ras`) untuk menjamin bind-mount Docker, systemd unit, dan skrip lama tetap berjalan tanpa broken path.
  - Pada VM 208, service `pm2-portal.service` dan dua GitHub Actions Runner (`rhaffle87-Portal-SARAS` & `rhaffle87-s4ras`) dimigrasikan ke `User=s4ras`.
- **Otentikasi SSH Terpadu**:
  - Seluruh public key SSH digabungkan dan dideduplikasi ke `/home/s4ras/.ssh/authorized_keys` dan `/root/.ssh/authorized_keys`.
  - Password akun sistem Linux (`s4ras` dan `root`) diseragamkan menjadi `itsTELKOM23!`.
  - Konfigurasi `/etc/ssh/sshd_config` dan direktori `/etc/ssh/sshd_config.d/` diaudit untuk memastikan `PasswordAuthentication yes` dan `PermitRootLogin yes` aktif di seluruh 9 VM.

---

## 2. Optimasi Performa Proxmox: Deaktivasi GUI & Transisi Headless CLI
Untuk mengeliminasi beban pasif lingkungan desktop GNOME (`gdm3`, `gnome-shell`, `Xorg`, `cups`, `avahi-daemon`) pada CPU virtual dan RAM:
- **Perubahan Default Target Systemd**:
  - Di seluruh 9 VM, target boot diubah dari `graphical.target` menjadi `multi-user.target` (`sudo systemctl set-default multi-user.target`).
  - Service `gdm3`, `gdm`, `lightdm`, `cups`, dan `avahi-daemon` dihentikan dan dinonaktifkan (`systemctl disable --now`). Paket biner tetap dipertahankan agar dapat diaktifkan kembali jika diperlukan (`sudo systemctl start gdm3`).
  - Service konsol teks `getty@tty1.service` diaktifkan di semua node agar akses Proxmox noVNC langsung menampilkan prompt login teks `s4ras login:` secara instan tanpa freeze render grafis.
- **Hasil Penghematan RAM Kluster**:
  - Penggunaan RAM total kluster turun dari **11.489 MB** menjadi **9.229 MB** (membebaskan **2.260 MB / ~2,26 GB RAM fisik**).
  - Penghematan tertinggi: VM 203 (LMS) sebesar **+670 MB**, VM 200 (IPTV) sebesar **+371 MB**, VM 207 (SAN) sebesar **+342 MB**, dan VM 209 (Benchmark) sebesar **+250 MB**.

---

## 3. Sistem Desain & Identitas Ikon (S4RAS Design System)
Antarmuka web ekosistem S4RAS diseragamkan mengikuti tema monokrom modern dengan aksen merah:
- **Palet Warna Standar**:
  - Background (Dark): `#09090b` | Background (Light): `#fafafa`
  - Permukaan Kartu (Dark): `#0f0f12` s.d. `#121215` | Permukaan Kartu (Light): `#ffffff`
  - Permukaan Input / Sekunder: `#18181b`
  - Border: `1px solid rgba(255, 255, 255, 0.08)` (Dark) | `1px solid #e4e4e7` (Light)
  - Aksen Utama (S4RAS Red): `#dc2626` (Hover: `#b91c1c`, Active: `#991b1b`)
  - Focus Ring: `outline: 2px solid #ef4444; outline-offset: 2px`
- **Keluarga Favicon & PWA Icons** (Base Card 64x64, rx="14", Gradasi `#dc2626` $\rightarrow$ `#991b1b`, Inner Stroke `rgba(255,255,255,0.18)`):
  - **Portal & Landing Page** (`portal.s4ras.site` & `s4ras.site`): 4-Node Bento Grid putih bersih.
  - **S4RAS Telefoni** (`voip.s4ras.site`): Gagang Telepon + Gelombang WebRTC putih bersih (`voip-saras/public/favicon.svg`).
  - **S4RAS Status** (`status.s4ras.site`): Gelombang ECG/Heartbeat Pulse + Titik Sinyal Aktif (`monitor-saras/public/favicon.svg`).
  - **S4RAS Identity SSO** (`sso.s4ras.site`): Perisai Keamanan & Lubang Kunci OIDC (`sso-saras/theme/s4ras/login/resources/img/favicon.svg`).
  - **S4RAS IPTV** (`iptv.s4ras.site`): Layar Monitor Broadcast + Segitiga Play (`iptv-saras/branding/favicon.svg`).

---

## 4. Perbaikan Landing Page (`s4ras.site` — VM 208)
- **Akar Masalah**: Selector CSS generik `.ftr a` pada `landing-page/src/style.css` menimpa padding dan warna teks pada tombol CTA `.btn` di bagian footer landing page.
- **Solusi**:
  - Mengubah selector link footer menjadi `.ftr a:not(.btn)` agar tombol CTA tidak tertimpa styling link biasa.
  - Menambahkan styling eksplisit `.ftr-cta .btn` (`height: 44px`, `padding: 0 1.25rem`, `border-radius: 9px`, `background: #dc2626`, `color: #fff !important`, hover `#b91c1c`).
  - Membangun ulang aset via Vite (`landing-page/dist/`) dan menyinkronkan bundel ke target path VM 208 (`/home/portal/Portal-SARAS/build/landing/`, `/home/portal/Portal-SARAS/public/landing/`, dan `/home/portal/s4ras/landing-page/dist/`). Reload PM2 `portal-prod` dan Caddy, lalu purge cache Cloudflare (Commit `67040a4`).

---

## 5. Redesain Antarmuka & RBAC `voip.s4ras.site` (VM 202)
Antarmuka WebPhone pada `voip-saras/index.html` (`100.83.239.40:/var/www/html/`) dirombak menjadi layout 2-kolom bersih:
- **Pembersihan Header**: Menghapus badge teknis panjang dan toggle tema/bahasa manual; tema (`s4ras_theme`) dan bahasa (`s4ras_lang`) otomatis membaca cookie `.s4ras.site` dan localStorage Portal. Sisi kiri menampilkan pill `← Kembali ke Portal` + logo S4RAS Telefoni; sisi kanan menampilkan kapsul status pengguna aktif.
- **Kolom Kiri (Dialer Monokrom)**: Layar input nomor dengan pendeteksi kontak cerdas untuk Rafli (083846121134 / 1003) dan Nathan (081292892465 / 1004). Tombol aksi panggil monokrom kontras (Panggil Suara) dan border netral (Panggil Video) serta 4 pintasan layanan (Operator 1000, Uji Audio 600, Konferensi 8000, Voicemail *97) dengan chip warna netral.
- **Kolom Kanan (Direktori & Kanvas Panggilan)**: Saat panggilan aktif, berubah menjadi kanvas video HD/waveform audio + PiP kamera lokal. Saat idle, menampilkan tab Direktori Sivitas & Riwayat Panggilan.
- **Strict RBAC Monitoring PBX**: Terminal hitam macOS dihapus. Tab Monitoring PBX disembunyikan (`display: none`) untuk mahasiswa (`student1`) dan dosen (`teacher1`), dan hanya dirender untuk Admin (admin Rafli 1003 / nathan1 Nathan 1004) dalam format kartu metrik monokrom yang konsisten (Commit `32f12a6`).

---

## 6. Kustomisasi Narasi, Desain, & SEO `status.s4ras.site` (Uptime Kuma — VM 204)
- **Pembaruan Database (`kuma.db`)**:
  - `title`: `S4RAS — Status Operasional Layanan`
  - `description`: Tombol pill `← Kembali ke myS4RAS Portal` + narasi resmi ekosistem daerah 3T.
  - `footer_text`: `© 2026 S4RAS (Solution for Remote Area Services) • Kluster Infrastruktur Terpadu Daerah 3T`
  - `show_powered_by`: `0` (menyembunyikan watermark).
  - `custom_css`: Styling latar `#09090b`, kartu `#121215`, border `rgba(255,255,255,0.08)`, dan aksen garis merah `#dc2626`.
- **Restrukturisasi 4 Grup & 13 Monitor Layanan**:
  1. *Portal Utama & Pembelajaran Digital (LMS)*: myS4RAS Portal & BFF Gateway, Moodle LMS, Gotenberg PDF.
  2. *Identitas Terpusat (SSO) & Penyimpanan Awan (SAN)*: Keycloak OIDC, Nextcloud SAN.
  3. *Siaran Edukasi (IPTV) & Komunikasi Telefoni (VoIP)*: Jellyfin IPTV, Dispatcharr, Jellyseerr, S4RAS Telefoni WebPhone, Asterisk Core PBX 1, Asterisk PBX 2.
  4. *Observabilitas, Telemetri & Uji Kinerja*: Prometheus & Grafana, Apache JMeter.
- **Persistensi Bind-Mount Ikon & SSR SEO Meta**: Seluruh aset ikon di-mount dari host `/home/s4ras/s4ras/assets/status-icons/` ke `/app/dist/` dan file `/app/server/model/status_page.js` dimodifikasi untuk menyuntikkan meta OpenGraph dan `theme-color` `#09090b` (Commit `c88fcda`).

---

## 7. Rekayasa Tema Login SSO Keycloak (`sso.s4ras.site` — VM 206)
- **Eliminasi Cache Edge (SHA-256 Content-Hashing)**: Dibangun skrip otomatisasi `sso-saras/scripts/build-theme-assets.py` yang menghasilkan `s4ras-login.<hash>.css` dan `s4ras-pw.<hash>.js` sehingga update styling tidak tertahan cache 30 hari Cloudflare edge.
- **Eliminasi Double Input Box & Katup Mata Password**: Menghapus dependensi PatternFly v5 ganda, menggunakan template FTL 1-lapis bersih dengan aturan CSS fallback. Katup toggle password dikendalikan oleh skrip eksternal `s4ras-pw.<hash>.js` yang patuh CSP Keycloak.
- **Cakupan Dwibahasa & Responsivitas Penuh**: Template aktif diselaraskan dalam bahasa Indonesia dan Inggris (`messages_id.properties` & `messages_en.properties`). Menonaktifkan IdP dummy `oidc`. Ukuran vertikal halaman login (~420px) pas di dalam `100dvh` dari mobile (360x640) hingga desktop (1440x900) tanpa scroll, lulus 12/12 uji Playwright (Commit `cf64501`).
- **Kredensial & Role Mappers `nathan1`**: Password di-reset permanen ke `Jakarta2004` (`--temporary=false`). Klaim `id.token.claim=true` dan `userinfo.token.claim=true` diaktifkan pada mapper role agar status admin diteruskan utuh ke aplikasi hilir.

---

## 8. Overhaul Menyeluruh Ekosistem IPTV (`iptv.s4ras.site` — VM 200)
- **Ekspansi Partisi Disk**: Diperluas dari 32 GB menjadi **81 GB** (`growpart /dev/sda 2 && resize2fs /dev/sda2`), menyisakan ~38 GB free disk.
- **Pemulihan Hak Administrator**: Mengatur hak akses di `jellyfin.db` (`Kind = 0` / IsAdministrator = 1, `Kind = 3` / EnableLiveTvAccess = 1, `Kind = 4` / EnableLiveTvManagement = 1) untuk akun `admin`, `nathan1`, dan `root`. Mengatur `<EnableAuthorization>false</EnableAuthorization>` di `SSO-Auth.xml` agar login via SSO tidak menimpa status admin.
- **Katalog Media VOD Asli (100 File Video Unik, 0 Duplikat MD5)**:
  - *Anime Library*: 100% batch Otakudesu asli (Audio Jepang + Hardsub Indo): *Jujutsu Kaisen* (24 eps), *Kimetsu no Yaiba* (26 eps), *Spy x Family* (13 eps), *One Punch Man* (12 eps + 1 OVA), *Chainsaw Man* (12 eps), serta 2 film layar lebar: *Suzume no Tojimari* (121m, FHD) dan *Kimi no Na wa* (106m, HD).
  - *Movies Library*: Film fitur penuh (> 70–113m): *Charade*, *Night of the Living Dead*, *His Girl Friday*, *Sita Sings the Blues*, *The General*, *Gulliver's Travels*, *House on Haunted Hill*, dan film animasi HD Blender Foundation.
  - *TV Shows Library*: Serial TV aktual terdaftar TMDB: *The Adventures of Sherlock Holmes (1984)*, *The Twilight Zone (1959)*, dan *Cosmos: A Personal Voyage (1980)*.
- **Logo Resmi TV Networks (34/34 Studio)**: Mengunggah logo resmi transparan PNG untuk seluruh 34 studio via API `POST /Items/{studioId}/Images/Primary`.
- **Live TV (25 Saluran), Daemon Relay, & EPG Publik**:
  - Layanan `s4ras_livetv_relay.py` berjalan sebagai systemd daemon di port 8099 pada VM 200 dengan dynamic YouTube live resolver (`yt-dlp`) dan proxy HLS langsung.
  - 25 saluran memiliki logo resmi dan EPG terstruktur spesifik stasiun (314 program di `epg.xml`).
  - Thumbnail program dan logo diakses via HTTPS publik melalui reverse proxy Caddy port 80 VM 200 (`https://iptv.s4ras.site/live-relay/thumbnails/<slug>.jpg`), menghilangkan potensi blokir IP internal Docker (`172.17.0.1`) maupun Mixed Content.
  - Playlist M3U dan EPG disinkronkan ke Dispatcharr, dan ketiga library diaktifkan serta dipindai penuh di Jellyseerr (Commit `bf38d00`).

---

## 9. Resolusi Kernel Deadlock & Pengamanan `cloudflared` di VM 208
- **Root Cause**: Modul grafis virtual QXL di kernel Linux VM 208 mengalami deadlock pada buffer memory manager (`qxl_fence_wait` holding `console_lock`), membekukan `systemd-getty-generator` dan menempatkan PID 1 (`systemd`) dalam status `D (disk sleep)`. Akibatnya, `systemctl` timeout dan load average melonjak ke 61.28 dengan 47 zombie processes.
- **Tindakan Pemulihan & Hardening**:
  - Unit file `/etc/systemd/system/cloudflared.service` dirombak menggunakan `Type=simple`, `Restart=always`, dan `RestartSec=5s`.
  - Sinkronisasi disk dan raw hardware restart dieksekusi via Kernel SysRq (`sync; echo b > /proc/sysrq-trigger`).
  - Setelah restart, load average turun ke **0.31**, `cloudflared.service` berjalan resmi dan aktif di bawah naungan `systemd`, serta `enabled` saat boot.
  - **Rekomendasi Preventif Proxmox**: Tambahkan `blacklist qxl` di `/etc/modprobe.d/blacklist-qxl.conf` atau ubah display hardware Proxmox ke Default / Standard VGA / VirtIO-GPU.

---

## 10. Rekapitulasi Commit Git & Kredensial Operasional Ekosistem

### Daftar Commit Utama (origin/main)
- `32f12a6` — Redesain 2-kolom monokrom, favicon khusus, & strict RBAC Admin pada `voip.s4ras.site`.
- `c88fcda` — Pembaruan narasi 3T, Custom CSS monokrom, bind-mount favicon Heartbeat, & SEO meta pada `status.s4ras.site`.
- `67040a4` — Perbaikan spesifisitas CSS `.ftr a:not(.btn)` & tombol CTA footer pada `s4ras.site`.
- `cf64501` — Implementasi tema login SSO Keycloak (`s4ras`), hashing aset, fallback PatternFly, dwibahasa ID/EN, & SOP deploy (`sso.s4ras.site`).
- `4011803` / `cc9cd01` / `42a492a` / `bf38d00` — Overhaul penuh ekosistem IPTV (`iptv.s4ras.site`), relay 25 channel, batch Anime Otakudesu Sub Indo, studio logos, dan routing HTTPS publik via Caddy.

### Tabel Kredensial & Akses Kluster
| Cakupan Layanan / Sistem | URL / Endpoint | Username | Password | Catatan Hak Akses |
| :--- | :--- | :--- | :--- | :--- |
| **SSH Seluruh 9 VM (200–209)** | `ssh s4ras@<IP_VM>` / `root@<IP_VM>` | `s4ras` / `root` | `itsTELKOM23!` | NOPASSWD:ALL sudo & Docker group |
| **SSO & Portal (Super Admin 1)** | [https://portal.s4ras.site](https://portal.s4ras.site) | `admin` | `AdminPassword123!` | Lead Architect (Rafli) • SIP Ext 1003 |
| **SSO & Portal (Super Admin 2)** | [https://portal.s4ras.site](https://portal.s4ras.site) | `nathan1` | `Jakarta2004` | Co-Developer (Nathan) • SIP Ext 1004 |
| **Jellyfin IPTV Local Admin** | [https://iptv.s4ras.site](https://iptv.s4ras.site) | `admin` | `AdminPassword123!` | Full Dashboard, Metadata & Live TV Admin |
| **Portal Health Check API** | [https://portal.s4ras.site/api/health/all](https://portal.s4ras.site/api/health/all) | *(Publik GET)* | — | 10 mikroservis real-time (**10/10 Online**) |
