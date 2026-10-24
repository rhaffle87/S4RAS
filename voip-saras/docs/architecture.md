# Arsitektur Sistem VoIP S4RAS

Dokumen ini menguraikan arsitektur multi-VM layanan VoIP, topologi pensinyalan SIP, terminasi WebRTC media stream, dan integrasi ingress ekosistem S4RAS.

---

## 1. Topologi Jaringan dan Peran Simpul (Multi-VM)

Infrastruktur VoIP di S4RAS didistribusikan ke tiga virtual machine pada Proxmox VE node `its`:

```mermaid
flowchart TD
    BrowserClient["Browser WebRTC Client"]
    SIPAppClient["Desktop Softphone (MicroSIP/Linphone)"]
    CF["Cloudflare Edge (*.s4ras.site)"]
    subgraph VM_208 ["VM 208: Portal & Ingress"]
        CFTunnel["Cloudflare Tunnel Daemon"]
        PortalProber["Portal Health Prober"]
    end
    subgraph VM_202 ["VM 202: voip-pbx (192.168.10.202)"]
        CaddyProxy["Caddy Proxy (:80)"]
        Asterisk["Asterisk 22.4.1 Core PBX"]
        PJSIP_UDP["PJSIP UDP (:5060)"]
        PJSIP_WS["PJSIP WebSocket (:8088)"]
        NodeExporter["Prometheus node_exporter (:9100)"]
    end
    subgraph VM_205 ["VM 205: VoIP-3 (192.168.10.205)"]
        Workstation["Ubuntu Desktop Testing Node"]
        LocalSoftphone["Softphone Testing Agent"]
    end
    subgraph VM_201 ["VM 201: VoIP-Server (192.168.10.201)"]
        ServerPending["Standby / Master Server Node"]
    end
    subgraph VM_204 ["VM 204: Monitoring"]
        Prometheus["Prometheus TSDB"]
    end
    BrowserClient -->|"HTTPS / WSS: voip.s4ras.site"| CF
    CF -->|"Tunnel Virtual Wire"| CFTunnel
    CFTunnel -->|"HTTP :80"| CaddyProxy
    CaddyProxy -->|"Reverse Proxy /ws & /httpstatus"| PJSIP_WS
    PJSIP_WS --> Asterisk
    SIPAppClient -->|"SIP UDP :5060"| PJSIP_UDP
    LocalSoftphone -->|"SIP UDP :5060"| PJSIP_UDP
    PJSIP_UDP --> Asterisk
    PortalProber -->|"HTTP Probe (:80)"| CaddyProxy
    Prometheus -->|"Scrape (:9100)"| NodeExporter
    ServerPending -.->|"Trunking IAX2/SIP (Post-Recovery)"| Asterisk
```

---

## 2. Rincian Lapisan Protokol (Protocol Stacks)

### A. Pensinyalan SIP (Session Initiation Protocol)
* **Transport UDP**: Berjalan pada port `0.0.0.0:5060`. Menggunakan stack modern `chan_pjsip` menggantikan `chan_sip` warisan.
* **Fitur**: `rtp_symmetric=yes`, `force_rport=yes`, dan `rewrite_contact=yes` diaktifkan untuk mengatasi masalah NAT traversal pada klien yang berada di balik router atau subnet berbeda.
* **Audio Codecs**: Opus, G.722, G.711u (u-law), G.711a (a-law).

### B. WebRTC & WebSocket Transport
* **WebSocket Port**: `0.0.0.0:8088` (Plain WS secara internal, diproteksi TLS HTTPS/WSS secara publik oleh Cloudflare dan Caddy).
* **Media Encryption**: DTLS-SRTP (`media_encryption=dtls`).
* **ICE / STUN**: Mendukung `ice_support=yes` dan `use_avpf=yes` agar browser berbasis Chrome, Firefox, dan Safari dapat membuka sesi audio dua arah tanpa hambatan firewall.

### C. SIP Instant Messaging (SIP MESSAGE)
Asterisk dikonfigurasi dengan context khusus `[messages]` di `extensions.conf` yang mengolah paket SIP method `MESSAGE`, memetakan contact uri tujuan via `PJSIP_DIAL_CONTACTS()`, dan meneruskan pesan teks singkat secara real-time antar pengguna softphone.

---

## 3. Diagram Alur Panggilan Suara (Call Flow)

```mermaid
sequenceDiagram
    autonumber
    actor Caller as Klien 1001 (MicroSIP)
    participant PBX as Asterisk PBX (VM 202)
    actor Callee as Klien 1002 (MicroSIP)
    Caller->>PBX: SIP INVITE (Target: 1002)
    PBX-->>Caller: SIP 100 Trying
    PBX->>Callee: SIP INVITE (From: 1001)
    Callee-->>PBX: SIP 180 Ringing
    PBX-->>Caller: SIP 180 Ringing (Caller mendengar ringback)
    Callee->>PBX: SIP 200 OK (Penerima mengangkat telepon)
    PBX-->>Caller: SIP 200 OK
    Caller->>Callee: Media Stream RTP Terbuka (Direct/Bridged Media)
    Note over Caller,Callee: Komunikasi Audio Aktif
    Caller->>PBX: SIP BYE (Menutup telepon)
    PBX->>Callee: SIP BYE
    Callee-->>PBX: SIP 200 OK
    PBX-->>Caller: SIP 200 OK
```
