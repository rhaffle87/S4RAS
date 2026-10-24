# Operations Runbook — Keycloak SSO (VM 206)

Panduan operasional dan pemecahan masalah (troubleshooting) untuk administrator sistem S4RAS.

---

## 1. Manajemen Layanan Kontainer (Docker Compose)

Seluruh file konfigurasi stack berada di `/home/sso/s4ras-sso`:

```bash
cd /home/sso/s4ras-sso

# 1. Cek status kedua kontainer
docker compose ps

# 2. Restart Keycloak saja tanpa mematikan database
docker compose restart keycloak

# 3. Melihat log Keycloak secara interaktif
docker compose logs -f keycloak

# 4. Melihat log Database PostgreSQL
docker compose logs -f postgres
```

---

## 2. Keycloak Admin CLI (`kcadm.sh`) Cheat Sheet

Keycloak menyediakan binary CLI di dalam kontainer yang sangat cepat untuk memodifikasi konfigurasi tanpa perlu membuka browser.

### A. Login ke CLI
```bash
docker exec -it sso_keycloak /opt/keycloak/bin/kcadm.sh config credentials \
  --server http://localhost:8080 \
  --realm master \
  --user admin \
  --password '[REDACTED]'
```

### B. Reset Password Pengguna di Realm `S4RAS`
```bash
docker exec -it sso_keycloak /opt/keycloak/bin/kcadm.sh set-password \
  -r S4RAS \
  --username <USERNAME> \
  --new-password '<PASSWORD_BARU>'
```

### C. Membuat Pengguna Baru
```bash
docker exec -it sso_keycloak /opt/keycloak/bin/kcadm.sh create users \
  -r S4RAS \
  -s username=dosen1 \
  -s enabled=true \
  -s email=dosen1@s4ras.site \
  -s firstName="Budi" \
  -s lastName="Santoso"
```

### D. Menambahkan Role ke Pengguna
```bash
docker exec -it sso_keycloak /opt/keycloak/bin/kcadm.sh add-roles \
  -r S4RAS \
  --uusername dosen1 \
  --rolename Dosen
```

---

## 3. Prosedur Backup & Restore Database PostgreSQL

### A. Membuat Backup Otomatis (Dump SQL)
```bash
# Jalankan pg_dump dari dalam kontainer sso_database
docker exec sso_database pg_dump -U keycloak -d keycloak > /home/sso/backup_keycloak_$(date +%Y%m%d_%H%M%S).sql
```

### B. Restore Database dari File SQL
```bash
# 1. Hentikan Keycloak agar koneksi database terputus
docker compose stop keycloak

# 2. Drop dan recreate database bersih
docker exec sso_database psql -U keycloak -d postgres -c "DROP DATABASE keycloak;"
docker exec sso_database psql -U keycloak -d postgres -c "CREATE DATABASE keycloak OWNER keycloak;"

# 3. Restore data dari file backup
cat /home/sso/backup_keycloak.sql | docker exec -i sso_database psql -U keycloak -d keycloak

# 4. Nyalakan kembali Keycloak
docker compose start keycloak
```

---

## 4. Troubleshooting Cloudflare Error 502 Bad Gateway

Jika `https://sso.s4ras.site` menampilkan **Cloudflare Error 502**, lakukan investigasi 3 tahap berikut:

### Tahap 1: Cek Status Service `cloudflared`
```bash
sudo systemctl status cloudflared --no-pager
```
*Jika status inactive / failed:*
```bash
sudo systemctl restart cloudflared
```

### Tahap 2: Cek Konektivitas Jaringan & DNS VM 206
Cloudflare Tunnel membutuhkan koneksi keluar (outbound HTTPS) yang stabil:
```bash
# Tes apakah gateway lokal aktif
ping -c 3 192.168.10.1

# Tes apakah DNS resolver berfungsi
ping -c 3 api.cloudflare.com
```
*Jika ping gagal, periksa apakah NetworkManager gateway terisi: `ip route` harus memiliki baris `default via 192.168.10.1`.*

### Tahap 3: Cek Apakah Port 8080 Keycloak Terbuka
```bash
curl -I http://localhost:8080
```
*Jika curl menghasilkan `Connection refused`:*
```bash
cd /home/sso/s4ras-sso
docker compose restart keycloak
```

---

## 5. Prosedur Disaster Recovery (Recovery Cepat)

Jika VM 206 mengalami crash atau hard reset:
1. Pastikan interface jaringan terpasang (`ip a` menunjukkan `192.168.10.206`).
2. Pastikan Docker service berjalan: `sudo systemctl status docker`.
3. Masuk ke folder `/home/sso/s4ras-sso` dan jalankan `docker compose up -d`.
4. Pastikan `cloudflared` aktif: `sudo systemctl status cloudflared`.
5. Uji dari laptop: `curl -I https://sso.s4ras.site` (harus `200 OK`).
