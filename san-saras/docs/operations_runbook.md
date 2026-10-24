# Operations Runbook — Nextcloud SAN (VM 207)

Panduan operasional ini memuat prosedur harian, perintah CLI `occ`, strategi pencadangan (backup & restore), peningkatan versi (upgrade), serta penanganan masalah (troubleshooting) untuk **Nextcloud SAN** (`s4ras-san`).

---

## 1. Panduan CLI Nextcloud (`occ`)

Seluruh perintah CLI administrasi Nextcloud dijalankan melalui kontainer `nextcloud_app` dengan user sistem `www-data`:

```bash
# Alias cepat di sesi bash VM 207:
alias occ="docker exec -u www-data nextcloud_app php occ"
```

### A. Perintah Status & Pemeliharaan Sistem
| Perintah | Deskripsi |
|:---|:---|
| `occ status` | Menampilkan status instalasi, versi, dan mode maintenance |
| `occ maintenance:mode --on` | Mengaktifkan mode pemeliharaan (menutup akses pengguna) |
| `occ maintenance:mode --off` | Menonaktifkan mode pemeliharaan |
| `occ maintenance:repair` | Menjalankan script perbaikan otomatis integritas database |
| `occ db:add-missing-indices` | Menambahkan indeks database yang hilang untuk percepatan query |
| `occ db:convert-filecache-bigint` | Mengonversi ID filecache ke bigint untuk file berjumlah masif |

### B. Pemindaian & Sinkronisasi File (`files:scan`)
Jika ada file yang disalin langsung ke storage tanpa melalui antarmuka web/WebDAV:
```bash
# Pindai ulang seluruh direktori file semua pengguna
docker exec -u www-data nextcloud_app php occ files:scan --all

# Pindai ulang file khusus user admin
docker exec -u www-data nextcloud_app php occ files:scan admin

# Bersihkan metadata file yang sudah terhapus
docker exec -u www-data nextcloud_app php occ files:cleanup
```

### C. Manajemen Pengguna & Password
```bash
# Menampilkan seluruh pengguna
docker exec -u www-data nextcloud_app php occ user:list

# Mereset kata sandi akun lokal
docker exec -u www-data nextcloud_app php occ user:resetpassword admin

# Menambahkan pengguna lokal baru
docker exec -u www-data nextcloud_app php occ user:add --display-name="Operator SAN" operator
```

---

## 2. Prosedur Backup & Restore Lengkap

### A. Prosedur Pencadangan (Backup)
Jalankan pencadangan secara berkala sebelum pembaruan sistem besar:

```bash
BACKUP_DIR="/opt/nextcloud/backups/$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"

echo "1. Mengaktifkan maintenance mode..."
docker exec -u www-data nextcloud_app php occ maintenance:mode --on

echo "2. Melakukan dump database MariaDB..."
docker exec nextcloud_db mariadb-dump -u user -pProxmox8 nextcloud > "$BACKUP_DIR/nextcloud_db.sql"

echo "3. Mencadangkan file konfigurasi..."
cp /var/lib/docker/volumes/nextcloud_nextcloud/_data/config/config.php "$BACKUP_DIR/config.php"

echo "4. Menonaktifkan maintenance mode..."
docker exec -u www-data nextcloud_app php occ maintenance:mode --off

echo "Backup berhasil disimpan di $BACKUP_DIR"
```

### B. Prosedur Pemulihan (Restore)
Jika terjadi kerusakan sistem atau kegagalan data:

```bash
# 1. Pastikan kontainer berjalan
cd /opt/nextcloud && docker compose up -d

# 2. Masuk ke maintenance mode
docker exec -u www-data nextcloud_app php occ maintenance:mode --on

# 3. Pulihkan database dari file SQL
docker exec -i nextcloud_db mariadb -u user -pProxmox8 nextcloud < /path/to/backup/nextcloud_db.sql

# 4. Pulihkan config.php
cp /path/to/backup/config.php /var/lib/docker/volumes/nextcloud_nextcloud/_data/config/config.php

# 5. Jalankan perbaikan dan sinkronisasi
docker exec -u www-data nextcloud_app php occ maintenance:repair
docker exec -u www-data nextcloud_app php occ files:scan --all

# 6. Matikan maintenance mode
docker exec -u www-data nextcloud_app php occ maintenance:mode --off
```

---

## 3. Playbook Penanganan Masalah (Troubleshooting)

### Kasus 1: "Access through untrusted domain"
* **Gejala**: Pengguna membuka `https://cloud.s4ras.site` tetapi muncul layar kuning *"Access through untrusted domain"*.
* **Penyebab**: Domain belum terdaftar di array `trusted_domains` pada `config.php`.
* **Solusi**:
  ```bash
  docker exec -u www-data nextcloud_app php occ config:system:set trusted_domains 0 --value="cloud.s4ras.site"
  docker exec -u www-data nextcloud_app php occ config:system:set trusted_domains 1 --value="192.168.10.207"
  docker exec -u www-data nextcloud_app php occ config:system:set trusted_domains 2 --value="100.64.0.17"
  ```

---

### Kasus 2: Redirect Loop atau Masalah CSS/JS (HTTP vs HTTPS)
* **Gejala**: Halaman Nextcloud tampil tanpa format CSS (tampilan teks acak) atau mengalami *ERR_TOO_MANY_REDIRECTS*.
* **Penyebab**: Nextcloud menerima trafik dari proxy port 80 dan tidak mengenali bahwa koneksi publik pengguna menggunakan protokol HTTPS.
* **Solusi**:
  Atur parameter reverse proxy overwrite di Nextcloud:
  ```bash
  docker exec -u www-data nextcloud_app php occ config:system:set overwritehost --value="cloud.s4ras.site"
  docker exec -u www-data nextcloud_app php occ config:system:set overwriteprotocol --value="https"
  docker exec -u www-data nextcloud_app php occ config:system:set overwrite.cli.url --value="https://cloud.s4ras.site"
  ```

---

### Kasus 3: Berkas Terkunci (*"File is locked"*)
* **Gejala**: Pengguna tidak dapat mengunggah atau mengedit berkas dengan pesan *"File is locked: ... lock already exists"*.
* **Penyebab**: Terjadi lock berkas menggantung di tabel `oc_file_locks` akibat proses unggah yang terputus di tengah jalan.
* **Solusi**:
  1. Aktifkan mode pemeliharaan:
     ```bash
     docker exec -u www-data nextcloud_app php occ maintenance:mode --on
     ```
  2. Hapus seluruh baris kunci pada database:
     ```bash
     docker exec nextcloud_db mariadb -u user -pProxmox8 nextcloud -e "DELETE FROM oc_file_locks WHERE 1;"
     ```
  3. Matikan mode pemeliharaan:
     ```bash
     docker exec -u www-data nextcloud_app php occ maintenance:mode --off
     ```

---

### Kasus 4: Kegagalan Login SSO Keycloak
* **Gejala**: Pengguna menekan tombol "Keycloak" tetapi muncul pesan *"Invalid redirect URI"* atau *"Discovery endpoint unreachable"*.
* **Penyebab**:
  1. Redirect URI di Keycloak belum mengizinkan `https://cloud.s4ras.site/*`.
  2. Nextcloud tidak dapat menghubungi endpoint `https://sso.s4ras.site/...` melalui jaringan internal.
* **Solusi**:
  1. Pastikan di Keycloak (VM 206) klien `nextcloud` memiliki valid redirect URIs:
     * `https://cloud.s4ras.site/*`
     * `https://cloud.s4ras.site/apps/user_oidc/code`
  2. Periksa endpoint discovery via CLI di VM 207:
     ```bash
     curl -sI https://sso.s4ras.site/realms/S4RAS/.well-known/openid-configuration
     ```
  3. Update provider OIDC jika endpoint berubah:
     ```bash
     docker exec -u www-data nextcloud_app php occ user_oidc:provider \
         --discoveryuri="https://sso.s4ras.site/realms/S4RAS/.well-known/openid-configuration" \
         Keycloak
     ```

---

### Kasus 5: Gagal Mengunggah Berkas Besar (*413 Payload Too Large*)
* **Gejala**: Upload berkas di atas 500 MB langsung terputus dengan kode error 413.
* **Penyebab**: Batas `client_max_body_size` pada Nginx host atau `upload_max_filesize` pada Apache/PHP terlalu kecil.
* **Solusi**:
  1. Periksa baris `client_max_body_size 10G;` pada `/etc/nginx/sites-available/nextcloud.conf`.
  2. Muat ulang Nginx:
     ```bash
     sudo systemctl reload nginx
     ```
