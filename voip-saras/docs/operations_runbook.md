# Runbook Operasional VoIP S4RAS (Asterisk PBX)

Dokumen ini berisi prosedur administrasi rutin, troubleshooting panggilan telepon, pengamatan log pensinyalan SIP, dan pencadangan konfigurasi Asterisk.

---

## 1. Perintah Administrasi Asterisk CLI

Untuk melakukan pemantauan dan debug, masuk ke CLI Asterisk interaktif di VM 202 (`192.168.10.202`):

```bash
# Masuk ke mode console dengan verbosity level 3
sudo asterisk -rvvv

# Menaikkan verbosity dan debug logging
core set verbose 5
core set debug 5
```

### Perintah PJSIP Esensial
| Perintah | Deskripsi |
|---|---|
| `pjsip show endpoints` | Menampilkan seluruh endpoint ekstensi dan status keterhubungannya |
| `pjsip show contacts` | Menampilkan alamat IP dan port socket aktif klien yang sedang terdaftar |
| `pjsip show aors` | Menampilkan Address of Record dan batas kontak per ekstensi |
| `pjsip show transports` | Menampilkan socket transport yang sedang di-bind (UDP 5060, WS 8088) |
| `pjsip reload` | Menerapkan perubahan pada `/etc/asterisk/pjsip.conf` tanpa restart daemon |

### Perintah Dialplan & Saluran
| Perintah | Deskripsi |
|---|---|
| `dialplan show from-internal` | Menampilkan seluruh aturan routing nomor di context internal |
| `dialplan reload` | Me-reload file `extensions.conf` secara instan |
| `core show channels` | Menampilkan daftar panggilan telepon yang sedang aktif berlangsung |
| `channel request hangup <channel>` | Memutus paksa panggilan telepon yang bermasalah / macet |

---

## 2. Debugging Pensinyalan SIP Menggunakan `sngrep`

`sngrep` adalah tool interaktif berbasis ncurses terbaik untuk memvisualisasikan paket SIP ladder diagram (INVITE, 100 Trying, 180 Ringing, 200 OK, ACK, BYE).

```bash
# Instalasi sngrep jika belum ada
sudo apt-get update && sudo apt-get install -y sngrep

# Menjalankan sniffer SIP real-time di interface ens18
sudo sngrep
```
* Tekan `Enter` pada panggilan yang muncul untuk melihat diagram pertukaran paket.
* Tekan `F7` untuk menerapkan filter (berdasarkan nomor ekstensi atau IP klien).

---

## 3. Strategi Pencadangan (Backup) Konfigurasi VoIP

Direktori konfigurasi Asterisk terletak di `/etc/asterisk/`.

### Script Backup Cepat
```bash
BACKUP_DIR="/home/voip/backups/asterisk_$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"

# Backup file konfigurasi inti
sudo tar -czvf "$BACKUP_DIR/asterisk_configs.tar.gz" -C /etc/asterisk pjsip.conf extensions.conf asterisk.conf rtp.conf http.conf

# Backup Caddyfile
sudo cp /etc/caddy/Caddyfile "$BACKUP_DIR/"

echo "Backup Asterisk tersimpan di: $BACKUP_DIR"
```

---

## 4. Diagnostik dan Troubleshooting Masalah Umum

### Masalah 1: Klien Softphone (MicroSIP) Gagal Registrasi ("Registration Timeout" / "408")
* **Penyebab**: Port 5060 UDP terhalang firewall atau IP server di softphone salah.
* **Solusi**:
  1. Pastikan IP server diatur ke `192.168.10.202` port `5060`.
  2. Periksa apakah Asterisk mendengarkan di UDP port 5060: `sudo ss -ulpn | grep 5060`.
  3. Cek log pjsip di console: `sudo asterisk -rx "pjsip set logger on"`.

### Masalah 2: Suara Satu Arah (One-Way Audio) atau Tidak Ada Suara (No Audio)
* **Penyebab**: Port media RTP (`10000-20000/udp`) diblokir oleh NAT router atau parameter `rtp_symmetric` belum aktif.
* **Solusi**:
  1. Pastikan `rtp_symmetric=yes`, `force_rport=yes`, dan `rewrite_contact=yes` diatur di endpoint `pjsip.conf`.
  2. Periksa range port RTP di `/etc/asterisk/rtp.conf` (default: 10000-20000).

### Masalah 3: Portal Health Prober Menunjukkan VoIP "Offline"
* **Penyebab**: Caddy pada VM 202 atau Asterisk HTTP daemon berhenti.
* **Solusi**:
  1. Cek status Caddy: `sudo systemctl status caddy`.
  2. Cek status Asterisk: `sudo systemctl status asterisk`.
  3. Lakukan tes curl internal dari VM 208: `curl -s -I http://192.168.10.202`.
