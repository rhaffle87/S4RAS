# Panduan Rilis & Rencana Penerapan: Tema SSO Keycloak S4RAS

Dokumen ini memuat prosedur operasional standar (SOP) untuk rilis tema Single Sign-On (SSO) S4RAS ke server produksi (VM 206 `100.95.158.77`), ringkasan bukti pengujian di staging, strategi mitigasi cache Cloudflare, serta tata cara *fail-safe rollback*.

> **PERINGATAN KERAS:** Dokumen ini HANYA berisi panduan administratif dan langkah-langkah implementasi. **TIDAK ADA PERINTAH DEPLOY LANGSUNG KE PRODUKSI** yang dieksekusi tanpa persetujuan eksplisit dari pemilik sistem (paneer).

---

## 1. Ringkasan Eksekutif & Hasil Pengujian Staging

Seluruh perubahan tema telah diuji secara komprehensif pada container staging terisolasi (`sso_keycloak_staging` pada port 8081, VM 206) menggunakan akun uji khusus per required action tanpa memodifikasi akun pengguna produksi.

### Matriks Verifikasi Otomatis Tema v2 (14/14 Lulus)
| Pengujian | Target Standar | Hasil Staging / Verification | Status |
|---|---|---|---|
| **Isolasi Jaringan (Zero External Requests)** | 0 request ke pihak ketiga | 0 request eksternal terdeteksi (100% self-contained) | **LULUS** |
| **Total Transfer Size (CSS + JS)** | Budget <= 120 KB | **23.15 KB** (CSS 19.98 KB + JS 3.16 KB) | **LULUS** |
| **Kontras Teks Heading (Dark)** | Rasio >= 4.5:1 (WCAG AA) | **18.33:1** (#0f0f12 vs #fafafa) | **LULUS** |
| **Kontras Teks Muted (Dark)** | Rasio >= 4.5:1 (WCAG AA) | **7.47:1** (#0f0f12 vs #a1a1aa) | **LULUS** |
| **Kontras Tombol Submit (Dark)** | Rasio >= 4.5:1 (WCAG AA) | **4.83:1** (#dc2626 vs #ffffff) | **LULUS** |
| **Kontras Teks Heading (Light)** | Rasio >= 4.5:1 (WCAG AA) | **19.90:1** (#ffffff vs #09090b) | **LULUS** |
| **Kontras Teks Muted (Light)** | Rasio >= 4.5:1 (WCAG AA) | **7.20:1** (#ffffff vs #52525b) | **LULUS** |
| **Kontras Tombol Submit (Light)** | Rasio >= 4.5:1 (WCAG AA) | **4.83:1** (#dc2626 vs #ffffff) | **LULUS** |
| **Dual-Panel Desktop (>= 960px)** | Inset visual panel + diagram hub | Terrender sempurna (45% : 55%), pill link aktif | **LULUS** |
| **Responsivitas Mobile (360x640)** | Bebas overflow horizontal & 100dvh | scrollWidth = 360, clientWidth = 360 | **LULUS** |
| **Responsivitas Tablet (768x1024)** | Bebas overflow horizontal | scrollWidth = 768, clientWidth = 768 | **LULUS** |
| **Responsivitas Desktop (1440x900)** | Bebas overflow horizontal | scrollWidth = 1440, clientWidth = 1440 | **LULUS** |
| **Interaktivitas Toggle Password** | password <-> text | Ikon mata terbuka & tertutup beralih sinkron | **LULUS** |
| **Cross-Subdomain Theme Sync** | Baca cookie s4ras_theme | Script sinkron s4ras-prefs.<hash>.js tanpa FOUC | **LULUS** |

---

## 2. Kebijakan Cache & Cache-Busting Otomatis

Keycloak 26.1 dalam mode produksi (`start`) menyematkan header `Cache-Control: max-age=2592000` (30 hari) pada folder `/resources/`. Cloudflare Edge menyimpannya dengan status `HIT`.

Untuk menjamin pengguna mendapatkan CSS dan JS terbaru secara instan tanpa menunggu 30 hari:
1. **Content Hashing**:
   Setiap perubahan kode CSS atau JS diproses oleh skrip otomasi:
   ```bash
   python sso-saras/scripts/build-theme-assets.py
   ```
   Skrip ini menghasilkan nama file berhash konten (contoh: `s4ras-login.36a07bfa.css`), memperbarui referensi di `theme.properties`, dan mencatat riwayat di `asset-manifest.json`.
2. **Purge Cloudflare per URL Rilis**:
   Setelah deploy dan restart container, jalankan pembersihan cache Cloudflare untuk URL berikut:
   ```text
   https://sso.s4ras.site/resources/*/login/s4ras/css/*
   https://sso.s4ras.site/resources/*/login/s4ras/js/*
   ```

---

## 3. Estimasi Lama Henti (Downtime Window)

Karena Keycloak mengaktifkan `cache-themes=true` pada mode produksi (`start`), rilis tema baru mengharuskan restart container `sso_keycloak`.

Berdasarkan pencatatan log pada container Keycloak 26.1 di VM 206:
- Waktu shutdown: **0.42 detik** (`Keycloak stopped in 0.421s`)
- Waktu inisialisasi & startup: **13.88 detik** (`started in 13.876s`)
- **Total estimasi waktu henti layanan SSO: ~14 – 15 detik**.

> **Rekomendasi Waktu Rilis:** Eksekusi rilis disarankan pada jam lalu lintas rendah (antara pukul **02:00 – 04:00 WIB**) untuk meminimalkan dampak interupsi sesi login pengguna aktif.

---

## 4. Prosedur Rilis Produksi Langkah-demi-Langkah (Menunggu Persetujuan)

Saat persetujuan rilis telah diberikan oleh pemilik (paneer), jalankan instruksi berikut:

### Langkah 1: Sinkronisasi File Tema ke Host VM 206
Dari mesin lokal (di branch `feat/sso-login-theme`):
```bash
# 1. Pastikan hash aset terbaru sudah dihasilkan
python sso-saras/scripts/build-theme-assets.py

# 2. Salin seluruh isi tema ke folder produksi di VM 206
scp -r e:/Projects/s4ras/sso-saras/theme/s4ras/* root@100.95.158.77:/home/s4ras/s4ras-sso/themes/s4ras/
```

### Langkah 2: Koreksi Izin File (Permissions) di VM 206
Keycloak berjalan menggunakan UID 1000 (`keycloak`). Pastikan izin file terbuka untuk dibaca oleh container:
```bash
ssh root@100.95.158.77 "chmod -R 755 /home/s4ras/s4ras-sso/themes/s4ras && chown -R 1000:0 /home/s4ras/s4ras-sso/themes/s4ras"
```

### Langkah 3: Restart Container Keycloak Produksi
```bash
ssh root@100.95.158.77 "docker restart sso_keycloak"
```

### Langkah 4: Pantau Log Startup & Kesiapan Layanan
```bash
ssh root@100.95.158.77 "docker logs sso_keycloak --tail 25 -f"
# Tunggu hingga muncul: "Keycloak 26.1.5 on JVM ... started in XX.XXXs"
```

### Langkah 5: Bersihkan Cache Cloudflare
Kunjungi Cloudflare Dashboard $\rightarrow$ Domain `s4ras.site` $\rightarrow$ **Caching** $\rightarrow$ **Configuration** $\rightarrow$ **Purge Cache** (Custom Purge):
- Masukkan URL stylesheet baru yang tercatat di `sso-saras/theme/s4ras/login/asset-manifest.json`.

---

## 5. Rencana Pemulihan Cepat (Rollback Plan)

Jika ditemukan anomali visual atau fungsional pasca rilis, terdapat dua opsi pemulihan instan:

### Opsi A: Rollback ke Tema Bawaan `keycloak.v2` (< 5 Detik, Tanpa Restart)
Kembalikan tema realm `S4RAS` ke tema pabrik Keycloak melalui CLI admin tanpa perlu mematikan container:
```bash
ssh root@100.95.158.77 "docker exec sso_keycloak /opt/keycloak/bin/kcadm.sh update realms/S4RAS -s loginTheme=keycloak.v2"
```
*Perubahan ini langsung aktif secara real-time pada request pengguna berikutnya.*

### Opsi B: Rollback ke Versi CSS Sebelumnya
Ubah baris `styles=` di `/home/s4ras/s4ras-sso/themes/s4ras/login/theme.properties` ke file CSS versi sebelumnya, lalu restart container:
```bash
ssh root@100.95.158.77 "sed -i 's/s4ras-login\..*\.css/s4ras-login-v4.css/g' /home/s4ras/s4ras-sso/themes/s4ras/login/theme.properties && docker restart sso_keycloak"
```

---

## 6. Konfigurasi Opsional: Mengaktifkan Multi-Bahasa (ID/EN)

Realm produksi `S4RAS` saat ini memiliki `internationalizationEnabled: false`. File bundle pesan Bahasa Indonesia (`messages_id.properties`) dan Bahasa Inggris (`messages_en.properties`) telah siap terpasang di folder tema.

Jika pemilik sistem memutuskan untuk mengaktifkan fitur bilingual ID/EN di produksi, jalankan perintah ini:
```bash
# Siapkan JSON konfigurasi i18n
ssh root@100.95.158.77 "docker exec sso_keycloak /opt/keycloak/bin/kcadm.sh update realms/S4RAS -s internationalizationEnabled=true -s defaultLocale=id -s 'supportedLocales=[\"id\",\"en\"]'"
```
*Catatan: Jika fitur ini belum diaktifkan di realm, tema tetap berjalan normal dan menyajikan Bahasa Indonesia secara default.*
