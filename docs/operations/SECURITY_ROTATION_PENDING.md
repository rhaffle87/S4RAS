# SECURITY ROTATION PENDING — S4RAS CLUSTER HARDENING

Dokumen ini memuat daftar inventaris kredensial dan rahasia sistem kluster S4RAS yang perlu dirotasi secara langsung oleh pemilik kluster (paneer) beserta panduan pengerasan keamanan (hardening) menyeluruh.

> [!IMPORTANT]
> Seluruh password plain-text pada dokumentasi master kluster telah disanitasi (`[REDACTED — simpan di secrets manager]`). Demi integritas sistem, kredensial produksi berikut direkomendasikan untuk dirotasi dan diamankan.

---

## 1. Matriks Kredensial yang Perlu Dirotasi

| No | Target Layanan / Aset | Akun Terpengaruh | Lokasi Saat Ini | Tindakan Rekomendasi Rotasi |
| :--- | :--- | :--- | :--- | :--- |
| 1 | **SSH & Sudo Linux (9 Node VM)** | `s4ras`, `root` | VM 200–209 (`/etc/shadow`) | Ganti password sistem Linux dengan string acak $\ge 24$ karakter di password manager (misal Bitwarden/1Password). Terapkan otentikasi berbasis SSH Key murni. |
| 2 | **Keycloak Identity Provider (VM 206)** | `admin` (master realm) | Keycloak Master Realm | Rotasi via `kcadm.sh set-password -r master --username admin` dengan kata sandi acak kuat $\ge 20$ karakter. |
| 3 | **Portal & SSO Super Admin (VM 206)** | `admin` (S4RAS realm) | Keycloak S4RAS Realm | Rotasi kata sandi melalui Keycloak Admin Console atau `kcadm.sh`. |
| 4 | **Co-Developer Account (VM 206)** | `nathan1` | Keycloak S4RAS Realm | Wajibkan reset password pada login berikutnya (`--temporary=true`) atau rotasi langsung. |
| 5 | **Jellyfin IPTV Local Admin (VM 200)** | `admin` | `jellyfin.db` | Masuk ke Dashboard Jellyfin $\rightarrow$ Users $\rightarrow$ admin $\rightarrow$ ubah password lokal. |
| 6 | **Database PostgreSQL & MariaDB** | LMS (203), SSO (206), SAN (207) | `.env` / compose files di VM | Ubah password user DB di file konfigurasi masing-masing dan jalankan query `ALTER USER ... WITH PASSWORD '...'`. |
| 7 | **OIDC Client Secrets** | Client apps (`front-end`, `moodle`, `nextcloud`) | Keycloak Client Credentials | Generate ulang client secret baru di Keycloak console dan perbarui environment variable client. |

---

## 2. Rencana Pengerasan Keamanan (Security Hardening Plan)

### A. Nonaktifkan Password Authentication SSH (Enforce SSH Key-Only)
Setelah memastikan seluruh public key pengembang terpasang di `/home/s4ras/.ssh/authorized_keys`:
1. Edit `/etc/ssh/sshd_config` atau file di `/etc/ssh/sshd_config.d/`:
   ```bash
   PasswordAuthentication no
   PermitRootLogin prohibit-password
   PubkeyAuthentication yes
   ```
2. Validasi konfigurasi dengan `sshd -t`.
3. Restart daemon SSH:
   ```bash
   sudo systemctl restart ssh
   ```

### B. Implementasi Vault / Secrets Management
- Hindari menyimpan string kata sandi pada skrip provision shell (`.sh`) atau file markdown commit.
- Gunakan variabel lingkungan aman (`export SECRET_KEY="..."`) atau alat manajemen secret seperti HashiCorp Vault, Doppler, atau Ansible Vault.

### C. Pembersihan Riwayat Git (Opsional / Terjadwal)
- Untuk membersihkan commit lama di masa lalu (`980b2f8`), disarankan menggunakan utilitas `git-filter-repo` atau BFG Repo-Cleaner pada repositori saat jadwal pemeliharaan khusus, lalu lakukan force-push terkoordinasi.

---
*Dokumen ini dibuat otomatis sebagai bagian dari standar kepatuhan keamanan S4RAS.*
