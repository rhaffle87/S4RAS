# VoIP S4RAS (Asterisk PBX & Unified Communications)

Layanan Voice over IP (VoIP) dan komunikasi suara/WebRTC pada ekosistem **S4RAS**. Arsitektur VoIP terdiri atas simpul PBX utama Asterisk 22 (`s4ras` MagicDNS `s4ras-voip2` di VM 202 `192.168.10.202`), workstation softphone pengujian (LAN-only `s4ras` di VM 205 `192.168.10.205`), dan simpul failover PBX (`s4ras` MagicDNS `s4ras-voip` di VM 201 `192.168.10.201`).

---

## 1. Spesifikasi Teknis Node & Jaringan

| Parameter | Node PBX Aktif (VM 202) | Workstation Klien (VM 205) | Server Failover (VM 201) |
|---|---|---|---|
| **Hostname** | `s4ras` (MagicDNS: `s4ras-voip2`) | `s4ras` (LAN-only, tanpa Tailscale) | `s4ras` (MagicDNS: `s4ras-voip`) |
| **IP Address LAN** | `192.168.10.202/24` | `192.168.10.205/24` | `192.168.10.201/24` (Online & Connected) |
| **Peran Sistem** | Active Asterisk 22.4.1 PBX Primary | Softphone testing client / GUI Desktop | Asterisk 20.6.0 PBX Failover (dormant MariaDB & Redis) |
| **Layanan Aktif** | Asterisk 22.4.1, CoTURN, Caddy, Node Exporter, Promtail | Ubuntu Desktop (GDM/Wayland), Node Exporter | Asterisk 20.6, Apache2, Node Exporter, Promtail, MariaDB (dormant), Redis (dormant) |
| **Port Kunci** | `5060/udp` (SIP), `8088/tcp` (WebRTC/WS), `3478/udp+tcp` (STUN/TURN), `80/tcp` (Caddy), `9100/tcp` (Metrics) | `22/tcp` (SSH), SIP softphone clients | `5060/udp` (SIP), `80/tcp` (Apache), `9100/tcp` (Metrics), `5038/tcp` (AMI) |
| **Domain Publik**| `https://voip.s4ras.site` | — | — |

---

## 2. Struktur Direktori Repository

```
voip-saras/
├── README.md                      # Dokumentasi komprehensif & ringkasan operasional
├── config/                        # Salinan konfigurasi aktif produksi
│   ├── Caddyfile                  # Konfigurasi reverse proxy port 80 -> Asterisk 8088 (/httpstatus, /ws)
│   ├── pjsip.conf                 # Master konfigurasi PJSIP (transports, endpoints, auths, aors)
│   └── extensions.conf            # Dialplan Asterisk (internal context, echo test 600, SIP messages)
└── docs/                          # Dokumentasi teknis mendalam
    ├── architecture.md            # Topologi multi-VM, WebRTC & SIP signalling flow
    ├── dialplan_and_extensions.md # Ekstensi pengguna, dialplan rules, IVR, dan echo test
    ├── webrtc_and_sip_clients.md  # Panduan setting MicroSIP, Linphone, dan browser WebRTC
    └── operations_runbook.md      # Panduan CLI Asterisk, AMI, pemantauan, dan troubleshooting
```

---

## 3. Matriks Ekstensi & Akun SIP Aktif

| Ekstensi | Tipe Klien | Protokol / Transport | Context | Caller ID | Keterangan |
|:---:|:---:|:---:|:---:|:---|:---|
| **`1001`** | Softphone Desktop | UDP (`0.0.0.0:5060`) | `from-internal` | `"User 1001" <1001>` | Klien MicroSIP / Linphone di LAN |
| **`1002`** | Softphone Desktop | UDP (`0.0.0.0:5060`) | `from-internal` | `"User 1002" <1002>` | Klien MicroSIP / Linphone di LAN |
| **`1003`** | WebRTC Browser | WebSocket (`ws://:8088`) | `from-internal` | `"User 1003" <1003>` | WebRTC SIP.js dengan DTLS-SRTP |
| **`1004`** | WebRTC Browser | WebSocket (`ws://:8088`) | `from-internal` | `"User 1004" <1004>` | WebRTC SIP.js dengan DTLS-SRTP |
| **`1074700`** | WebRTC Admin | WebSocket (`ws://:8088`) | `from-internal` | `"Admin" <1074700>` | Admin civitas WebRTC endpoint |
| **`1079348`** | WebRTC Personal | WebSocket (`ws://:8088`) | `from-internal` | `"Sivitas Peneliti" <1079348>` | Personal WebRTC endpoint |
| **`12345678910111`** | UDP Softphone | UDP (`0.0.0.0:5060`) | `from-internal` | Softphone Standar | Klien ekstensi panjang |
| **`600`** | System Echo | Internal Core PBX | `from-internal` | `Echo Test` | Dial untuk uji coba mikrofon & audio delay |

> Kredensial kata sandi akun SIP tercatat secara aman pada dokumen internal [`docs/operations/VM_ACCESS.md`](file:///e:/Projects/s4ras/docs/operations/VM_ACCESS.md).

---

## 4. Perintah Cepat Asterisk CLI

```bash
# Masuk ke console Asterisk interaktif
sudo asterisk -rvvv

# Tampilkan seluruh endpoint PJSIP aktif
sudo asterisk -rx "pjsip show endpoints"

# Tampilkan status kontak dan registrasi SIP
sudo asterisk -rx "pjsip show contacts"

# Tampilkan dialplan
sudo asterisk -rx "dialplan show from-internal"

# Reload konfigurasi PJSIP tanpa memutus panggilan aktif
sudo asterisk -rx "pjsip reload"
```
