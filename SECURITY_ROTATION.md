# Panduan Rotasi Rahasia & Prosedur Hardening Keamanan S4RAS

Dokumen ini memuat daftar secret / variabel lingkungan yang telah dicabut fallback bawaannya (fail-closed), instruksi operasional untuk operator sistem di server produksi (VM 208), serta analisis risiko residual pada komponen yang belum diaktifkan autentikasinya.

> **PERINGATAN KERAS:** Dokumen ini HANYA berisi tata cara administratif, nama variabel, dan instruksi command line. DILARANG KERAS mencatat nilai secret aktual atau passphrase di sini atau di file repository mana pun.

---

## 1. Daftar Variabel Lingkungan & Secret Baru (Fail-Closed)

Berikut adalah daftar variabel lingkungan yang wajib didefinisikan di lingkungan runtime server produksi (`portal-server`, Node.js systemd service, container Docker). Jika variabel ini tidak diset, sistem akan menolak request (mengembalikan status HTTP 503 atau 401) tanpa menggunakan fallback statis:

| Nama Variabel Lingkungan | Komponen / Service | Deskripsi & Fungsi | Rekomendasi Pembuatan (Command) |
|---|---|---|---|
| `ADMIN_TOKEN` | `portal-saras` (`portal-server.js`) | Autentikasi API admin internal (announcements, broadcast event) | `openssl rand -hex 32` |
| `DEPLOY_TOKEN` | `portal-saras` (`portal-server.js`) | Token pemicu deploy webhook (`/api/deploy`) | `openssl rand -hex 32` |
| `ALERTMANAGER_SECRET` | `portal-saras` / `monitor-saras` | Token shared webhook Alertmanager Prometheus (`/api/alerts`) | `openssl rand -hex 32` |
| `CLUSTER_EVENT_SECRET` | `portal-saras` | Shared secret cluster untuk sinkronisasi webhook event antarsimpul | `openssl rand -hex 32` |
| `SIP_SECRETS_JSON` | `portal-saras` (`scripts/lib/auth.js`) | Pemetaan JSON ekstensi ke secret SIP Kamailio/Asterisk VoIP | Format: `'{"1001":"...","1002":"...","1003":"..."}'` |
| `KEYCLOAK_ISSUER` | `portal-saras` (`scripts/lib/auth.js`) | Validasi `iss` token Keycloak JWT | URL Keycloak Realm (e.g. `https://sso.s4ras.site/realms/S4RAS`) |
| `KEYCLOAK_PUBLIC_KEY` | `portal-saras` (`scripts/lib/auth.js`) | Kunci publik RSA realm Keycloak untuk verifikasi offline token RS256 | Export dari Keycloak Admin Console (Realm Keys > RS256 > Public Key) |
| `S4RAS_SSH_KEY` / `S4RAS_SSH_PASS` | `scripts/backup_all_databases.sh` | Kredensial SSH operator untuk backup lintas host | Gunakan SSH Keypair (`ed25519`) |
| `MYSQL_ROOT_PASSWORD` | `san-saras` (MariaDB/Nextcloud) | Root database credentials | `openssl rand -base64 24` |
| `NC_BACKUP_PASSWORD` | `san-saras` | Passphrase arsip backup Nextcloud | `openssl rand -base64 24` |

---

## 2. Prosedur Pemasangan Secret di VM 208 (Server Produksi)

Sebelum merilis perubahan dari branch `chore/security-and-responsive` ke branch `main`, operator server harus mengonfigurasi variabel-variabel di atas pada host produksi VM 208:

### Opsi A: Menggunakan Systemd Environment Drop-in (Direkomendasikan)
1. Buka konfigurasi drop-in untuk systemd service portal (misal `saras-portal.service`):
   ```bash
   sudo systemctl edit saras-portal.service
   ```
2. Tambahkan variabel lingkungan yang diperlukan pada blok `[Service]`:
   ```ini
   [Service]
   Environment="NODE_ENV=production"
   Environment="PORT=3000"
   Environment="ADMIN_TOKEN=<GENERATE_WITH_OPENSSL_HEX_32>"
   Environment="DEPLOY_TOKEN=<GENERATE_WITH_OPENSSL_HEX_32>"
   Environment="ALERTMANAGER_SECRET=<GENERATE_WITH_OPENSSL_HEX_32>"
   Environment="CLUSTER_EVENT_SECRET=<GENERATE_WITH_OPENSSL_HEX_32>"
   Environment="KEYCLOAK_ISSUER=https://sso.s4ras.site/realms/S4RAS"
   Environment="KEYCLOAK_PUBLIC_KEY=-----BEGIN PUBLIC KEY-----\n...\n-----END PUBLIC KEY-----"
   Environment='SIP_SECRETS_JSON={"1001":"[REDACTED]","1002":"[REDACTED]","1003":"[REDACTED]"}'
   ```
3. Muat ulang daemon dan restart layanan:
   ```bash
   sudo systemctl daemon-reload
   sudo systemctl restart saras-portal.service
   ```

### Opsi B: Menggunakan File `.env` Produksi Berizin Terbatas
1. Buat file `/opt/s4ras/portal-saras/.env` di server (pastikan izin `chmod 600`):
   ```bash
   sudo touch /opt/s4ras/portal-saras/.env
   sudo chmod 600 /opt/s4ras/portal-saras/.env
   sudo chown s4ras:s4ras /opt/s4ras/portal-saras/.env
   ```
2. Salin template dari `portal-saras/.env.example` dan isi nilainya.
3. Restart process manager (Systemd / PM2):
   ```bash
   pm2 restart saras-portal --update-env
   # ATAU
   sudo systemctl restart saras-portal.service
   ```

---

## 3. Catatan Risiko Residual: PJSIP Endpoint Authentication (SEC-01)

Pada file `voip-saras/config/pjsip.conf` (baris 1861 dan 1899), konfigurasi autentikasi endpoint untuk ekstensi `1001` dan `1002` saat ini dalam keadaan dikomentari:

```conf
; [1001]
; auth=1001-auth    ; SECURITY (SEC-01)

; [1002]
; auth=1002-auth    ; SECURITY (SEC-01)
```

### Analisis Risiko:
- **Kondisi:** Endpoint VoIP Kamailio/Asterisk untuk 1001 dan 1002 menerima registrasi SIP atau panggilan masuk tanpa verifikasi digest authentication (password SIP).
- **Dampak:** Siapa pun di jaringan lokal atau VLAN kampus yang mengetahui ekstensi dapat meregistrasikan softphone atau menangkap panggilan tanpa password.
- **Rekomendasi Tindak Lanjut Operator:**
  1. Hapus tanda komentar `;` pada baris `auth=1001-auth` dan `auth=1002-auth` di `voip-saras/config/pjsip.conf`.
  2. Pastikan blok credential `[1001-auth]` dan `[1002-auth]` telah memiliki `password` kuat yang dihasilkan secara acak.
  3. Masukkan password tersebut ke dalam `SIP_SECRETS_JSON` di environment `portal-server`.
  4. Jalankan `asterisk -rx "pjsip reload"` di server VoIP untuk mengaktifkan autentikasi.

---

## 4. Verifikasi Kesehatan Pasca-Rotasi

Setelah secret dipasang di server dan layanan direstart, jalankan audit verifikasi tanpa membocorkan token:

```bash
# 1. Pastikan me/context mengembalikan 401 tanpa Bearer token
curl -s -o /dev/null -w "%{http_code}\n" https://portal.s4ras.site/api/me/context
# Ekspektasi: 401

# 2. Pastikan deploy endpoint menolak request tanpa token
curl -s -X POST -o /dev/null -w "%{http_code}\n" https://portal.s4ras.site/api/deploy
# Ekspektasi: 401 atau 503 (jika belum diset)

# 3. Pastikan alerts webhook menolak request tanpa x-alertmanager-token
curl -s -X POST -o /dev/null -w "%{http_code}\n" https://portal.s4ras.site/api/alerts
# Ekspektasi: 401 atau 503 (jika belum diset)
```
