# Manajemen Media dan Protokol Streaming IPTV S4RAS

Dokumen ini memuat detail struktur library, format file multimedia, protokol penyiaran (Live TV/IPTV), serta panduan pengunggahan konten di Jellyfin S4RAS.

---

## 1. Struktur Direktori Media Host

Semua konten media disimpan di direktori `/home/s4ras/jellyfin/media/` yang di-mount ke `/media` di dalam container Jellyfin:

```
/home/s4ras/jellyfin/media/
├── movies/                 # Koleksi film bioskop & dokumenter
│   └── [Movie Name (Year)]/
│       ├── [Movie Name (Year)].mp4 (atau .mkv)
│       └── poster.jpg
├── tvshows/                # Serial televisi & serial ber-episode
│   └── [Show Name]/
│       └── Season 01/
│           ├── S01E01.mp4
│           └── S01E02.mp4
└── anime/                  # Serial animasi jepang dan donghua
    └── [Anime Title]/
        └── Season 01/
            └── [Episode 01].mkv
```

---

## 2. Penyiaran Live TV & IPTV (M3U / XMLTV)

Jellyfin mendukung penyiaran saluran televisi berbasis IP (IPTV) melalui format playlist **M3U/M3U8** dan panduan program elektronik (**XMLTV / EPG**).

### A. Menambahkan Tuner IPTV
1. Masuk ke Jellyfin Dashboard sebagai administrator (`https://iptv.s4ras.site`).
2. Navigasikan ke menu **Administration** -> **Live TV**.
3. Di bagian **Tuner Devices**, klik tombol `+` (Add):
   * **Tuner Type**: `M3U Tuner`
   * **File or URL**: Masukkan URL playlist internal atau path lokal file `.m3u` (contoh: `/media/iptv/channels.m3u`).
   * **User Agent**: Biarkan default atau sesuaikan jika upstream stream membutuhkan identitas khusus.
   * **Simultaneous Streams**: Sesuaikan dengan batas bandwidth jaringan LAN (contoh: `5` atau `10`).

### B. Menambahkan Electronic Program Guide (EPG)
1. Di halaman **Live TV**, bagian **TV Guide Data Providers**, klik `+`.
2. Pilih format: **XMLTV**.
3. Masukkan URL atau path file XMLTV (contoh: `/media/iptv/epg.xml`).
4. Klik **Save**. Jellyfin akan memetakan nama saluran M3U ke ID di XMLTV secara otomatis.

---

## 3. Format Media & Kemampuan Transcoding

* **Video Codecs yang Direkomendasikan**: H.264 (AVC) / H.265 (HEVC) dalam kontainer MP4 atau MKV.
* **Audio Codecs**: AAC, AC3, Opus, MP3.
* **Direct Play**: Didukung penuh oleh hampir seluruh browser modern (Chrome, Firefox, Safari) dan aplikasi Jellyfin resmi jika format video adalah H.264 + audio AAC.
* **Transcoding Engine**: Menggunakan FFmpeg internal Jellyfin. Transcoding software CPU aktif secara default untuk memastikan kompatibilitas saat format sumber tidak didukung oleh perangkat pemutar klien.
