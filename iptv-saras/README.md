# IPTV S4RAS (Jellyfin Media Server)

Layanan IPTV dan Media Server mandiri berbasis **Jellyfin** pada ekosistem **S4RAS**, berjalan pada VM 200 (`192.168.10.200`) dan terintegrasi dengan Cloudflare Tunnel (`iptv.s4ras.site`), Keycloak SSO (`sso.s4ras.site`), dan Prometheus Monitoring (`monitor.s4ras.site`).

---

## 1. Quick Technical Specifications

| Parameter | Nilai / Konfigurasi |
|---|---|
| **VM Host** | VM 200 (`s4ras-iptv`) on Proxmox VE node `its` |
| **Sistem Operasi** | Ubuntu 24.04.3 LTS (Noble Numbat), Linux Kernel 7.0.0-28 |
| **IP Address LAN** | `192.168.10.200/24` (Interface: `ens18`) |
| **Public Domain** | `https://iptv.s4ras.site` |
| **Runtime Media** | Docker Container `jellyfin` (`jellyfin/jellyfin:latest`) |
| **Service Ports** | `8096` (Jellyfin HTTP), `80` (Host Caddy Reverse Proxy), `9100` (`node_exporter`) |
| **OIDC / SSO Client**| Realm: `S4RAS`, Client ID: `jellyfin` |
| **Ingress Point** | Cloudflare Tunnel daemon on VM 208 (`portal.s4ras.site`) |
| **Monitoring** | Prometheus Node Exporter 1.7.0 port 9100 dipantau oleh VM 204 |

---

## 2. Struktur Direktori Repository

```
iptv-saras/
├── README.md                      # Dokumentasi komprehensif & ringkasan operasional
├── docker-compose.yml             # Manifest Docker Compose runtime Jellyfin
├── config/                        # Salinan konfigurasi aktif produksi
│   ├── Caddyfile                  # Konfigurasi reverse proxy lokal Caddy (port 80 -> 8096)
│   ├── SSO-Auth.xml               # Konfigurasi OIDC Single Sign-On plugin Keycloak
│   ├── network.xml                # Konfigurasi networking & external domains Jellyfin
│   └── system.xml                 # Pengaturan sistem, metadata, dan repositori plugin
└── docs/                          # Dokumentasi mendalam & referensi sistemik
    ├── architecture.md            # Arsitektur sistem, topologi jaringan & Mermaid flow
    ├── configuration_and_sso.md   # Panduan konfigurasi OIDC, token claims, dan Caddy
    ├── media_and_streaming.md     # Manajemen direktori media, live TV, dan encoding
    └── operations_runbook.md      # Prosedur operasional, backup/restore, dan troubleshooting
```

---

## 3. Alur Akses dan Autentikasi Singkat

1. **Akses Publik**: Pengguna membuka `https://iptv.s4ras.site` melalui browser atau Jellyfin Client App (Android TV / iOS / Mobile).
2. **Edge Ingress**: Cloudflare Edge mengenkripsi TLS dan mengalirkan traffic melalui Cloudflare Tunnel ke VM 208 (`192.168.10.208`).
3. **Internal Routing**: Daemon Cloudflared meneruskan request ke origin `http://192.168.10.200:8096`.
4. **Single Sign-On (OIDC)**: Pengguna login melalui tombol SSO Keycloak, dialihkan ke `https://sso.s4ras.site/realms/S4RAS`, dan setelah autentikasi sukses, sesi Jellyfin diterbitkan secara otomatis.
5. **Observabilitas**: VM 208 mengecek health check internal pada interval berkala (`/api/health/iptv` latency ~6ms), dan Prometheus di VM 204 mengambil metrik sistem via port `9100`.

---

## 4. Referensi Cepat Perintah Operasional

```bash
# Cek status container Jellyfin di VM 200
docker ps --filter "name=jellyfin"

# Lihat log streaming / aktivitas real-time
docker logs -f jellyfin

# Restart layanan media server
cd /home/s4ras/jellyfin && docker compose restart

# Cek status reverse proxy Caddy
sudo systemctl status caddy

# Cek metrik node exporter
curl -s http://localhost:9100/metrics | head -n 10
```
