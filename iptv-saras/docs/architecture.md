# Arsitektur Sistem IPTV S4RAS (Jellyfin Media Server)

Dokumen ini menjelaskan rancangan arsitektur, topologi jaringan, boundary keamanan, dan interaksi komponen pada layanan IPTV/Media Server di ekosistem S4RAS.

---

## 1. Topologi Komponen & Jaringan

Layanan IPTV dijalankan pada VM 200 (`s4ras-iptv`) di dalam subnet privat RFC1918 `192.168.10.0/24`. Layanan ini terisolasi dari paparan port publik langsung (NAT terhindar) dan diakses secara aman melalui Cloudflare Tunnel ingress daemon di VM 208.

```mermaid
flowchart TD
    Client["Client Browser / Mobile / SmartTV"]
    CF["Cloudflare Edge Network (*.s4ras.site)"]
    subgraph VM_208 ["VM 208: Portal & Ingress Gateway"]
        CFTunnel["Cloudflared Tunnel Daemon"]
        HealthProber["Portal BFF Health Checker"]
    end
    subgraph VM_200 ["VM 200: s4ras-iptv (192.168.10.200)"]
        Caddy["Host Caddy Proxy (:80)"]
        Jellyfin["Jellyfin Container (:8096)"]
        SSOPlugin["SSO Auth Plugin (OIDC)"]
        MediaStorage["Local Media & LiveTV Storage"]
        NodeExporter["Prometheus node_exporter (:9100)"]
    end
    subgraph VM_206 ["VM 206: Keycloak SSO"]
        Keycloak["Keycloak 26.1 (Realm S4RAS)"]
    end
    subgraph VM_204 ["VM 204: Monitoring"]
        Prometheus["Prometheus TSDB"]
    end
    Client -->|"HTTPS: iptv.s4ras.site"| CF
    CF -->|"Tunnel Virtual Wire"| CFTunnel
    CFTunnel -->|"HTTP :8096"| Jellyfin
    Caddy -->|"Local Reverse Proxy"| Jellyfin
    HealthProber -->|"HTTP Probe (:8096)"| Jellyfin
    Jellyfin --> MediaStorage
    Jellyfin --> SSOPlugin
    SSOPlugin -.->|"OIDC Discovery & Token Exchange"| Keycloak
    Prometheus -->|"Scrape Metrics (:9100)"| NodeExporter
```

---

## 2. Rincian Komponen Arsitektur

### A. Media Server Container (`jellyfin`)
* **Base Image**: `jellyfin/jellyfin:latest` (Official .NET-based media engine).
* **Eksekusi Host**: Berjalan di Docker Engine v27 dengan mode network `bridge` dan port forwarding `8096:8096`.
* **Resource Mounts**:
  * `/home/s4ras/jellyfin/config` dipetakan ke `/config` (database SQLite, metadata cache, XML server configuration, plugin binaries).
  * `/home/s4ras/jellyfin/cache` dipetakan ke `/cache` (transcoding cache, trickplay thumbnails).
  * `/home/s4ras/jellyfin/media` dipetakan ke `/media` (library konten direktori anime, movies, tvshows).

### B. Ingress & Edge Routing
* Cloudflare Tunnel pada VM 208 mengarahkan hostname `iptv.s4ras.site` langsung ke socket HTTP internal `http://192.168.10.200:8096`.
* Host Caddy di VM 200 bertindak sebagai proxy cadangan di port 80 untuk lalu lintas intra-LAN, meneruskan request internal langsung ke port 8096.

### C. Modul Keamanan dan SSO
* **Plugin**: `jellyfin-plugin-sso` (SSO Authentication v4.0.0.4).
* **Integrasi OIDC**: Menggunakan protokol OpenID Connect ke Keycloak server (`https://sso.s4ras.site/realms/S4RAS`) dengan Client ID `jellyfin`.
* **Enkapsulasi Klien**: Mengisolasi otentikasi kata sandi dari database lokal Jellyfin ke federasi identitas kampus S4RAS.

---

## 3. Diagram Alur Autentikasi Pengguna (SSO Flow)

```mermaid
sequenceDiagram
    autonumber
    actor User as Pengguna / TV Client
    participant JF as Jellyfin UI (iptv.s4ras.site)
    participant SSOPlugin as SSO Auth Plugin
    participant KC as Keycloak (sso.s4ras.site)
    User->>JF: Buka https://iptv.s4ras.site
    JF-->>User: Tampilkan halaman login dengan tombol SSO
    User->>SSOPlugin: Klik Login SSO (Keycloak)
    SSOPlugin->>KC: Redirect ke OIDC Auth Endpoint (/realms/S4RAS/protocol/openid-connect/auth)
    KC-->>User: Formulir Login SSO Kampus S4RAS
    User->>KC: Masukkan Kredensial SSO
    KC-->>User: Autentikasi Berhasil & Kirim Authorization Code
    User->>SSOPlugin: Kirim Code ke Callback (/sso/OID/callback/keycloak)
    SSOPlugin->>KC: Pertukaran Code dengan Access Token & ID Token (Backchannel)
    KC-->>SSOPlugin: Kembalikan ID Token (Profil, Email, Roles)
    SSOPlugin->>JF: Verifikasi Role `realm_access.roles` & Provision Akun
    JF-->>User: Set Sesi Jellyfin & Buka Dashboard Media Library
```
