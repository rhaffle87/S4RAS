# S4RAS LMS Operations & Maintenance Runbook

Dokumen ini merupakan panduan standar operasional (Standard Operating Procedure / SOP) bagi administrator sistem dalam memelihara, mem-backup, memperbarui, dan menangani insiden pada layanan **Moodle LMS (VM 203)**.

---

## 1. Prosedur Start, Stop, dan Lifecycle Service

Direktori kerja utama untuk stack Moodle berada di:
```bash
cd /opt/moodle
```

### 1.1. Memeriksa Status Container
```bash
docker compose ps
```
*Output normal*: Container `moodle` dan `postgres` keduanya berstatus `Up (healthy)`.

### 1.2. Restart Layanan
Jika terjadi kendala pada container aplikasi atau setelah melakukan perubahan konfigurasi database:
```bash
# Restart hanya aplikasi Moodle
docker compose restart moodle

# Restart seluruh stack (PostgreSQL + Moodle)
docker compose restart
```

### 1.3. Menghentikan dan Menyalakan Ulang Stack
```bash
# Menghentikan container secara aman (graceful stop)
docker compose down

# Menyalakan kembali stack di background
docker compose up -d
```

---

## 2. Pengelolaan Reverse Proxy (Caddy)

Caddy berjalan sebagai service systemd pada host VM 203:

### 2.1. Memeriksa Status dan Log Caddy
```bash
# Status service
sudo systemctl status caddy

# Melihat log akses dan error
sudo journalctl -u caddy -f -n 100
```

### 2.2. Reload Konfigurasi
Jika berkas `/etc/caddy/Caddyfile` diperbarui:
```bash
# Validasi sintaks berkas konfigurasi
sudo caddy validate --config /etc/caddy/Caddyfile

# Reload konfigurasi tanpa downtime
sudo systemctl reload caddy
```

---

## 3. CLI Maintenance & Administrative Tools Moodle

Seluruh perintah administratif internal Moodle dapat dieksekusi langsung dari host menggunakan `docker exec`.

### 3.1. Membersihkan Cache Moodle (Purge Caches)
Gunakan perintah ini setiap kali tema diubah, plugin baru dipasang, atau pengaturan SSO diperbarui namun belum berefek:
```bash
docker exec -u 0 moodle php /opt/bitnami/moodle/admin/cli/purge_caches.php
```

### 3.2. Mengaktifkan & Menonaktifkan Maintenance Mode
Saat melakukan upgrade database atau pemeliharaan besar yang tidak boleh diakses oleh siswa:
```bash
# Mengaktifkan mode pemeliharaan
docker exec -u 0 moodle php /opt/bitnami/moodle/admin/cli/maintenance.php --enable

# Menonaktifkan mode pemeliharaan (kembali online)
docker exec -u 0 moodle php /opt/bitnami/moodle/admin/cli/maintenance.php --disable
```

### 3.3. Menjalankan Cron Secara Manual
Jika notifikasi atau sinkronisasi data kursus terasa terlambat:
```bash
docker exec -u 0 moodle php /opt/bitnami/moodle/admin/cli/cron.php
```

---

## 4. Prosedur Backup & Restore Data

Layanan Moodle menyimpan data pada dua komponen vital:
1. **Database PostgreSQL (`moodledb`)**: Menyimpan akun pengguna, relasi kursus, nilai, dan konfigurasi.
2. **Direktori `moodledata`**: Menyimpan materi kursus, file upload, submission tugas, dan sertifikat.

### 4.1. Backup Database PostgreSQL
Jalankan perintah berikut untuk mengekspor database secara konsisten:
```bash
# Buat direktori backup jika belum ada
mkdir -p /home/s4ras/backups

# Ekspor database menggunakan pg_dump
docker exec -e PGPASSWORD=root postgres pg_dump -U moodleuser moodledb > /home/s4ras/backups/moodledb_$(date +%Y%m%d_%H%M%S).sql

# Kompresi berkas backup
gzip /home/s4ras/backups/moodledb_*.sql
```

### 4.2. Backup File Media (`moodledata`)
```bash
sudo tar -czvf /home/s4ras/backups/moodledata_$(date +%Y%m%d_%H%M%S).tar.gz -C /var/lib/docker/volumes/moodle_moodledata/_data .
```

### 4.3. Prosedur Restore Database
Jika database mengalami korupsi atau perlu di-rollback:
```bash
# Ekstrak berkas backup SQL
gunzip /home/s4ras/backups/moodledb_backup.sql.gz

# Drop dan recreate skema database
docker exec -e PGPASSWORD=root postgres psql -U moodleuser -d template1 -c "DROP DATABASE moodledb;"
docker exec -e PGPASSWORD=root postgres psql -U moodleuser -d template1 -c "CREATE DATABASE moodledb OWNER moodleuser;"

# Impor kembali data
cat /home/s4ras/backups/moodledb_backup.sql | docker exec -i -e PGPASSWORD=root postgres psql -U moodleuser -d moodledb
```

---

## 5. Matriks Penanganan Insiden (Incident Response Matrix)

| Gejala Insiden | Kemungkinan Penyebab | Tindakan Perbaikan |
| :--- | :--- | :--- |
| **Error 502 Bad Gateway di `moodle.s4ras.site`** | Container `moodle` berhenti atau Apache hung. | Jalankan `docker compose ps` di `/opt/moodle`. Jika stopped, jalankan `docker compose up -d`. Cek log: `docker compose logs --tail=50 moodle`. |
| **Error "Database connection failed"** | Container `postgres` belum ready atau password mismatch. | Cek status health PostgreSQL: `docker exec postgres pg_isready -U postgres`. Pastikan environment variable `POSTGRESQL_PASSWORD` pada `docker-compose.yml` cocok dengan `config.php`. |
| **Portal Status Moodle "Offline"** | Caddy port 80 pada VM 203 berhenti atau IP berubah. | Cek status Caddy: `sudo systemctl status caddy`. Pastikan port 80 terbuka dan merespons `curl -I http://192.168.10.203`. |
| **Login Keycloak Error: "Invalid client_id or secret"** | Secret pada `auth_oidc` tidak sesuai dengan Keycloak. | Buka Keycloak Master Console (`sso.s4ras.site`), periksa secret client `moodle`, lalu sesuaikan pada tabel database atau menu Admin Moodle. |
| **File Upload Gagal (Exceeds Max Size)** | Limit `upload_max_filesize` atau `post_max_size` PHP terlampaui. | Tambahkan environment variable pada `docker-compose.yml`: `PHP_UPLOAD_MAX_FILESIZE=256M` dan `PHP_POST_MAX_SIZE=256M`, lalu `docker compose up -d`. |
