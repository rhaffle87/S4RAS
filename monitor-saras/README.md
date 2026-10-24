# S4RAS Monitoring Service (Observabilitas Kluster)

Repositori ini memuat konfigurasi, arsitektur, dan panduan operasional untuk stack pemantauan metrik **Prometheus, Grafana, Alertmanager, Loki, CrowdSec, dan Blackbox Exporter** pada ekosistem S4RAS (VM Proxmox ID **204**).

---

##  Ringkasan Layanan

* **Metric Collector**: Prometheus **v3.2.0** (`:9090`)
* **Data Visualization**: Grafana **11.5.0** (`:3000`)
* **Log Aggregation**: Loki **3.0.0** (`:3100`) + Promtail **3.0.0** (agents on 9/9 nodes)
* **Alert Engine**: Alertmanager **v0.27.0** (`:9093`)
* **Availability Prober**: Blackbox Exporter **v0.25.0** (`:9115`)
* **Host Metrics**: Node Exporter **v1.8.2** (`:9100`)
* **Uptime Monitoring**: Uptime Kuma **1.x** (`:3001`)
* **IDS/IPS**: CrowdSec LAPI (Bouncer active on VM 208)
* **URL Publik**: `https://monitor.s4ras.site`
* **Internal IP**: `192.168.10.204`
* **Tailscale IP**: `100.64.0.14` (MagicDNS: `s4ras-monitor`)
* **Akses SSH**: `ssh admin-node@100.64.0.14` atau `ssh admin-node@192.168.10.204` (Password: `[REDACTED]`)
* **Kredensial Grafana**:
  * **Admin Default**: `admin` / `[REDACTED]`
  * **Keycloak SSO**: Tombol *Sign in with Keycloak* (Realm: `S4RAS`, Client: `grafana`)
  * **Dashboard Sentral**: `https://monitor.s4ras.site/d/s4ras-ecosystem-overview/s4ras-ecosystem-overview`

---

##  Topologi Observabilitas S4RAS

```mermaid
flowchart TB
    subgraph Users["End Users & DevOps"]
        Browser["Web Browser\n(https://monitor.s4ras.site)"]
    end

    subgraph VM_206["VM 206: SSO & Gateway"]
        CF["Cloudflare Tunnel\n(monitor.s4ras.site)"]
        Keycloak["Keycloak OIDC\n(:8080 app / :9000 mgmt)"]
    end

    subgraph VM_204["VM 204: Central Monitoring (s4ras-monitor)"]
        Grafana["Grafana 11.5.0\n(:3000)"]
        Prometheus["Prometheus v3.2.0\n(:9090)"]
        Alertmanager["Alertmanager v0.27.0\n(:9093)"]
        Blackbox["Blackbox Exporter v0.25.0\n(:9115)"]
        Loki["Loki 3.0.0\n(:3100)"]
        UptimeKuma["Uptime Kuma 1.x\n(:3001)"]
        CrowdSec["CrowdSec LAPI\n(IDS Engine)"]
    end

    subgraph Monitored_Nodes["Ekosistem 10 VM S4RAS (Node Exporter :9100)"]
        VM200["VM 200: IPTV\n(Jellyfin 10.10 + Dispatcharr + Jellyseerr)"]
        VM201["VM 201: VoIP-1\n(Asterisk 20.6 — Failover)"]
        VM202["VM 202: VoIP-2\n(Asterisk 22.4.1 + CoTURN)"]
        VM203["VM 203: LMS\n(Moodle 4.5.2 + Gotenberg)"]
        VM204_Node["VM 204: Monitoring\n(Self-monitor)"]
        VM205["VM 205: VoIP-Client\n(Workstation Desktop)"]
        VM206_Node["VM 206: SSO\n(Keycloak 26.1)"]
        VM207["VM 207: SAN\n(Nextcloud 31 + Collabora CODE 26.04)"]
        VM208["VM 208: Portal\n(React 19 + Express 5 BFF)"]
        VM209["VM 209: Benchmark\n(JMeter 5.6.3 + SIPp 3.7.2)"]
    end

    subgraph Log_Streams["Promtail 3.0 — Log Streams (9/9 Nodes)"]
        Promtail["Promtail Agents\n(s4ras-iptv, s4ras-voip, s4ras-voip2,\ns4ras-lms, s4ras-monitor, s4ras-portal,\ns4ras-san, s4ras-sso, s4ras-benchmark)"]
    end

    Browser --> CF --> Grafana
    Grafana -..->|OIDC OAuth2 Login| Keycloak
    Grafana -->|PromQL| Prometheus
    Grafana -->|LogQL| Loki
    Prometheus -->|Scrape OS Metrics :9100 (10/10 VMs UP)| Monitored_Nodes
    Prometheus -->|HTTP 2xx Availability Probe| Blackbox
    Blackbox -->|15 Probe Targets| Monitored_Nodes
    Promtail -->|Push Logs| Loki
    Log_Streams -->|systemd + container logs| Promtail
```

---

##  Target Monitoring Aktif

### 1. Simpul Sistem Operasi (`node_exporter`) — Status: **10/10 UP** ✅

| Simpul | IP & Port | MagicDNS / Layanan | Metrik yang Dikumpulkan |
|:-------|:----------|:-------------------|:------------------------|
| **VM 200** | `192.168.10.200:9100` | `s4ras-iptv` — Jellyfin IPTV | CPU, RAM, Disk I/O, Network |
| **VM 201** | `192.168.10.201:9100` | `s4ras-voip` — Asterisk 20.6 Failover | CPU, RAM, Disk I/O, Network |
| **VM 202** | `192.168.10.202:9100` | `s4ras-voip2` — Asterisk 22.4.1 Primary | CPU, RAM, Disk I/O, Network |
| **VM 203** | `192.168.10.203:9100` | `s4ras-lms` — Moodle LMS | CPU, RAM, Disk I/O, Network |
| **VM 204** | `192.168.10.204:9100` | `s4ras-monitor` — Prometheus/Grafana | CPU, RAM, Disk I/O, Network |
| **VM 205** | `192.168.10.205:9100` | *(LAN only)* — VoIP Softphone Client | CPU, RAM, Disk I/O, Network |
| **VM 206** | `192.168.10.206:9100` | `s4ras-sso` — Keycloak SSO | CPU, RAM, Disk I/O, Network |
| **VM 207** | `192.168.10.207:9100` | `s4ras-san` — Nextcloud SAN | CPU, RAM, Disk I/O, Network |
| **VM 208** | `192.168.10.208:9100` | `s4ras-portal` — Portal BFF | CPU, RAM, Disk I/O, Network |
| **VM 209** | `192.168.10.209:9100` | `s4ras-benchmark` — JMeter/SIPp | CPU, RAM, Disk I/O, Network |

### 2. Ketersediaan Web & HTTP (`blackbox_http_services`) — Status: **15/15 UP** ✅

| Layanan | Target Probe Internal | HTTP Expected | Catatan |
|:--------|:----------------------|:--------------|:--------|
| **Portal BFF** | `http://192.168.10.208:3000` | `200 OK` | Express health endpoint |
| **Keycloak Realm** | `http://192.168.10.206:8080/realms/S4RAS` | `200 OK` | OIDC well-known |
| **Keycloak Mgmt** | `http://192.168.10.206:9000/health/ready` | `200 OK` | Quarkus management port |
| **Moodle LMS** | `http://192.168.10.203` | `200 OK` | Bitnami Moodle 4.5.2 |
| **Gotenberg BFF** | `http://192.168.10.203:3000/health` | `200 OK` | PDF microservice health |
| **Nextcloud SAN** | `http://192.168.10.207/status.php` | `200 OK` | NC version + maintenance |
| **Collabora CODE** | `http://192.168.10.207:9980/hosting/discovery` | `200 OK` | WOPI discovery endpoint |
| **Jellyfin IPTV** | `http://192.168.10.200` | `200 OK` | IPTV home page |
| **Jellyfin API** | `http://192.168.10.200:8096/System/Info/Public` | `200 OK` | Server info public API |
| **Dispatcharr** | `http://192.168.10.200:9191` | `200 OK` | EPG & channel manager |
| **Jellyseerr** | `http://192.168.10.200:5055` | `200 OK` | Media request portal |
| **VoIP Failover** | `http://192.168.10.201` | `200 OK` | Asterisk 20 HTTP |
| **VoIP PBX** | `http://192.168.10.202` | `200 OK` | Asterisk 22 HTTP |
| **Uptime Kuma** | `http://192.168.10.204:3001` | `200 OK` | Status page |
| **SIPp Reports** | `http://192.168.10.209:8088/sipp/` | `200 OK` | Benchmark report server |

### 3. Database Exporters — Status: **3/3 UP** ✅

| Job | Target | Database |
|:----|:-------|:---------|
| `postgres-moodle` | `192.168.10.203:9187` | PostgreSQL 15 (Moodle) |
| `postgres-keycloak` | `192.168.10.206:9187` | PostgreSQL 16 (Keycloak) |
| `mysqld-nextcloud` | `192.168.10.207:9104` | MariaDB 11.7.2 (Nextcloud) |

### 4. Log Streams Loki 3.0 — Status: **9/9 Nodes Streaming** ✅

Seluruh node aplikasi mengalirkan container logs dan systemd journal melalui Promtail 3.0 ke Loki:
`s4ras-benchmark`, `s4ras-iptv`, `s4ras-lms`, `s4ras-monitor`, `s4ras-portal`, `s4ras-san`, `s4ras-sso`, `s4ras-voip`, `s4ras-voip2`

---

##  Alerting Rules

Alertmanager mengirimkan notifikasi berbasis rule file `alert.rules.yml`. Alert aktif dapat dilihat di:
`http://192.168.10.204:9093/api/v2/alerts`

---

##  Struktur Berkas Provisioning Otomatis

Seluruh konfigurasi didefinisikan secara deklaratif dan di-mount langsung ke container:
* `config/prometheus.yml` — Konfigurasi Prometheus global & 28 target scraping
* `config/alert.rules.yml` — Alert rules untuk uptime, resource, dan database health
* `config/alertmanager.yml` — Routing & receiver alerting
* `config/loki.yml` — Konfigurasi Loki log storage & retention
* `config/promtail.yml` — Konfigurasi Promtail untuk VM 204 (self-monitoring)
* `config/grafana/provisioning/datasources/` — Auto-provision Prometheus & Loki datasources
* `config/grafana/provisioning/dashboards/` — Auto-provision S4RAS ecosystem dashboard
