# Runbook Operasional IPTV S4RAS (VM 200)

Dokumen ini berisi SOP (Standar Operasional Prosedur) perawatan rutin, troubleshooting, backup data konfigurasi, serta pemantauan layanan IPTV.

---

## 1. Pemeliharaan Layanan Docker

Layanan berjalan di bawah Docker Compose di direktori `/home/s4ras/jellyfin/`:

```bash
# Pindah ke direktori kerja
cd /home/s4ras/jellyfin

# Memeriksa status kesehatan container
docker compose ps

# Melihat log aktivitas real-time
docker compose logs -f --tail=100

# Me-restart container jika terjadi memory leak atau hang
docker compose restart

# Menghentikan dan menyalakan ulang container
docker compose down && docker compose up -d
```

---

## 2. Pemeliharaan Reverse Proxy Caddy

```bash
# Cek status Caddy di host VM 200
sudo systemctl status caddy

# Restart Caddy setelah perubahan konfigurasi /etc/caddy/Caddyfile
sudo systemctl restart caddy

# Validasi sintaks Caddyfile tanpa restart
caddy validate --config /etc/caddy/Caddyfile
```

---

## 3. Strategi Pencadangan (Backup) & Pemulihan (Restore)

### A. Komponen yang Wajib Dicadangkan
1. **Database SQLite & User Data**: `/home/s4ras/jellyfin/config/data/` (terutama `jellyfin.db`).
2. **Konfigurasi Server & Plugin**: `/home/s4ras/jellyfin/config/config/` dan `/home/s4ras/jellyfin/config/plugins/configurations/`.
3. **Caddyfile**: `/etc/caddy/Caddyfile`.

### B. Perintah Backup Otomatis
```bash
BACKUP_DIR="/home/s4ras/backups/iptv_$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"

# Snapshot database dan konfigurasi Jellyfin
tar -czvf "$BACKUP_DIR/jellyfin_config_backup.tar.gz" -C /home/s4ras/jellyfin/config .
cp /etc/caddy/Caddyfile "$BACKUP_DIR/"

echo "Backup selesai tersimpan di $BACKUP_DIR"
```

### C. Prosedur Restore
```bash
# Hentikan container Jellyfin
cd /home/s4ras/jellyfin && docker compose down

# Ekstrak data cadangan
tar -xzvf /path/to/backup/jellyfin_config_backup.tar.gz -C /home/s4ras/jellyfin/config/

# Pastikan permission file sesuai (user root di dalam container)
sudo chown -R 1000:1000 /home/s4ras/jellyfin/config || sudo chown -R root:root /home/s4ras/jellyfin/config

# Nyalakan kembali container
docker compose up -d
```

---

## 4. Diagnostik dan Troubleshooting Masalah Umum

### Masalah 1: "Unable to reach origin service" atau HTTP 502 di Cloudflare
* **Penyebab**: Container Jellyfin mati atau port 8096 tidak merespons di LAN `192.168.10.200`.
* **Solusi**:
  1. SSH ke VM 200 (`ssh s4ras@192.168.10.200`).
  2. Jalankan `docker ps`. Jika status `Exited`, periksa log: `docker logs jellyfin --tail 50`.
  3. Nyalakan ulang container: `cd /home/s4ras/jellyfin && docker compose up -d`.
  4. Lakukan curl lokal: `curl -I http://127.0.0.1:8096`.

### Masalah 2: Tombol SSO Keycloak Gagal Mengalihkan atau Muncul "Invalid Redirect URI"
* **Penyebab**: Domain `https://iptv.s4ras.site` belum didaftarkan di **Valid Redirect URIs** klien `jellyfin` pada Keycloak.
* **Solusi**:
  1. Buka Keycloak Admin Console (`https://sso.s4ras.site/admin/master/console/`).
  2. Masuk ke Realm **S4RAS** -> **Clients** -> **`jellyfin`**.
  3. Pastikan kolom **Valid Redirect URIs** memuat:
     * `https://iptv.s4ras.site/sso/OID/callback/keycloak`
     * `https://iptv.s4ras.site/sso/*`
  4. Simpan perubahan dan restart container Jellyfin.

### Masalah 3: Portal S4RAS Menampilkan Status IPTV "Offline"
* **Penyebab**: VM 208 gagal melakukan HTTP probe ke `http://192.168.10.200:8096`.
* **Solusi**:
  1. Tes konektivitas dari VM 208: `curl -s -I http://192.168.10.200:8096`.
  2. Pastikan routing lokal antar VM di bridge `vmbr0` berfungsi normal.
  3. Cek endpoint API prober langsung di browser: `https://portal.s4ras.site/api/health/iptv`.
