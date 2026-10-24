# S4RAS Benchmarking & QoS Evaluation Service

Layanan pengujian performa, stress testing, dan evaluasi Quality of Service (QoS mengacu standar ITU-T) untuk seluruh layanan mandiri pada ekosistem **S4RAS (Solution for Remote Area Services)** di VM Proxmox ID **209** (`s4ras-benchmark`).

---

## 🔬 Metodologi Pengujian 3 Lapis S4RAS

Sesuai laporan penelitian S4RAS, evaluasi performa sistem dilakukan melalui 3 metode pengujian terpisah:

### Lapis 1: Apache JMeter (Evaluasi Beban Konkuren LMS Moodle)
Menguji ketahanan Moodle LMS saat diakses bersamaan oleh siswa SD, SMP, SMA, dan warga desa:
* **Baseline Test (25 User)**: Ramp-up 300s, durasi pengujian 600s. Menunjukkan performa optimal dengan utilisasi CPU terkendali dan responsivitas tinggi (APDEX > 0.85).
* **Stress Test (50 User)**: Ramp-up 300s, durasi 600s. Mengidentifikasi saturasi vCPU (~100% CPU usage pada 2 vCPU, memori & disk tetap stabil) yang menjadi dasar rekomendasi tuning Redis session driver dan upgrade ke 4 vCPU.
* **Skenario**: Terdiri dari alur login OIDC Keycloak (`moodle_login.jmx`), navigasi modul kursus (`moodle_25user.jmx`), dan unduh materi pelajaran (`moodle_50user.jmx`).

### Lapis 2: k6 WebDAV Load Testing (Nextcloud SAN VM 207)
Menguji throughput dan konkurensi operasi file berkas pembelajaran:
* **Payload**: File dokumen & materi edukasi sebesar 5 MB per transaksi.
* **Metode**: Eksekusi paralel skrip k6 (upload, download chunked, dan delete file) untuk mengukur latensi I/O disk dan bottleneck memori MariaDB.
* **Hasil**: Zero-error rate pada konkurensi normal dengan kestabilan I/O Proxmox ZFS.

### Lapis 3: Asynchronous Stream & VoIP SIP Benchmark (Jellyfin IPTV & Asterisk PBX)
* **IPTV Stream Testing (Jellyfin VM 200)**: Pengujian streaming konkuren (25, 50, dan 100 stream simultan) menggunakan skrip Python asinkron (mengatasi kendala cookie OIDC pada headless test) untuk mengukur **Rebuffering Ratio**. Hasil menunjukkan **0% Rebuffering Ratio** pada jaringan lokal LAN 1 Gbps.
* **VoIP Trunk Stress Test (Asterisk VM 202/201)**: Pengujian panggilan suara konkuren menggunakan SIPp (`scripts/voip_sip_trunk_benchmark.sh`) untuk mengevaluasi jitter, paket loss (< 1%), dan MOS (Mean Opinion Score > 4.0).

---

## 📁 Direktori Skenario & Skrip

| File / Folder | Peruntukan |
|:---|:---|
| [`scenarios/moodle_login.jmx`](scenarios/moodle_login.jmx) | Uji alur autentikasi dan pembuatan sesi pengguna |
| [`scenarios/moodle_25user.jmx`](scenarios/moodle_25user.jmx) | Skenario baseline 25 pengguna serentak |
| [`scenarios/moodle_50user.jmx`](scenarios/moodle_50user.jmx) | Skenario beban puncak 50 pengguna serentak |
| [`scenarios/users.csv`](scenarios/users.csv) | Dataset identitas pengguna simulasi |
| [`scripts/run_benchmark.sh`](scripts/run_benchmark.sh) | Runner CLI otomatisasi uji JMeter |
| [`scripts/voip_sip_trunk_benchmark.sh`](scripts/voip_sip_trunk_benchmark.sh) | Runner pengujian trunk VoIP dengan SIPp |

---

## 🚀 Prosedur Eksekusi Non-GUI (CLI Mode)

Jalankan langsung dari VM 209:

```bash
# 1. Jalankan Uji Beban 25 Pengguna (Baseline)
cd /home/admin-node/apache-jmeter-5.6.3/bin
./jmeter -n -t moodle_25user.jmx -l /home/admin-node/reports/moodle_25.jtl -e -o /home/admin-node/reports/moodle_25_html

# 2. Jalankan Uji Beban 50 Pengguna (Stress Test)
./jmeter -n -t moodle_50user.jmx -l /home/admin-node/reports/moodle_50.jtl -e -o /home/admin-node/reports/moodle_50_html
```
