# System Architecture Document (SAD) — S4RAS Ecosystem

This document serves as the master technical blueprint and deployment documentation for the **S4RAS (Self-Hosted Service Gateway)** ecosystem.

---

## 1. System Overview & Objectives
S4RAS integrates multiple educational, communication, and management tools into a unified network. It provides:
1. **Single Entry Point**: A sleek React-based dashboard (`portal.s4ras.site`) running on **VM 208**.
2. **Centralized Authentication (SSO)**: Keycloak OIDC federation on **VM 206** protecting access across all services.
3. **Status Monitoring**: Server-side connection checking that reports real-time availability of private resources without CORS restrictions.

---

## 2. Ingress & Egress Traffic Architecture
The architecture operates under a strict **private-first** design. Virtual machines live on a private Class C subnet (`192.168.10.0/24`) and egress traffic through a centralized gateway/reverse proxy.

```
       [ Client Web Browser ]
                 │
                 ▼ (Public Internet)
      HTTPS (443) / SSL Termination
                 │
      [ Reverse Proxy / Nginx ]
                 │
        ┌────────┼────────┬────────┬────────┬────────┐ (Internal Network - 192.168.10.x)
        │        │        │        │        │        │
      Port     Port     Port     Port     Port     Port
      3000     8080      80       80      8080     3000
        │        │        │        │        │        │
      [VM208]  [VM206]  [VM203]  [VM207]  [VM201]  [VM204]
      Portal   Keycloak Moodle  Nextcloud  VoIP   Monitor
```

### Ingress Port Mapping
*   **Public Gateway (Nginx/Cloudflare)**: Terminates SSL and forwards traffic based on server names:
    *   `portal.s4ras.site` ──> `http://192.168.10.208:3000`
    *   `sso.s4ras.site` ──> `http://192.168.10.206:8080`
    *   `moodle.s4ras.site` ──> `http://192.168.10.203:80`
    *   `cloud.s4ras.site` ──> `http://192.168.10.207:80`
    *   `iptv.s4ras.site` ──> `http://192.168.10.200:8096`
    *   `voip.s4ras.site` ──> `http://192.168.10.201:8080`
    *   `monitor.s4ras.site` ──> `http://192.168.10.204:3000`

---

## 3. C4 Architecture Diagrams

### Level 1: System Context Diagram
Shows high-level system boundaries and user interaction.

```mermaid
flowchart TB
    User["Client Web Browser"]
    subgraph S4RAS_Ecosystem ["S4RAS System Boundary"]
        Portal["Portal S4RAS"]
        SSO["SSO Keycloak"]
        Moodle["Moodle LMS"]
        Nextcloud["Nextcloud SAN"]
        IPTV["Jellyfin IPTV"]
        VoIP["VoIP Server"]
        Monitor["Monitoring Dashboard"]
    end
    User -->|Accesses: portal.s4ras.site| Portal
    User -->|Authenticates via OIDC| SSO
    User -->|Launches app links| Moodle
    User -->|Launches app links| Nextcloud
    User -->|Launches app links| IPTV
    User -->|Launches app links| VoIP
    User -->|Launches app links| Monitor
    Portal -->|HTTP Health Probes| SSO
    Portal -->|HTTP Health Probes| Moodle
    Portal -->|HTTP Health Probes| Nextcloud
    Portal -->|HTTP Health Probes| IPTV
    Portal -->|HTTP Health Probes| VoIP
    Portal -->|HTTP Health Probes| Monitor
```

### Level 2: Container Diagram
Details virtual machine environments, technology stacks, and communications.

```mermaid
C4Container
    title Container Diagram for S4RAS System
    Person(user, "User/Client Browser", "Accesses the apps and views health dashboard")
    System_Boundary(dns_proxy, "Egress & Routing Layer") {
        Container(proxy, "Reverse Proxy (Nginx / Cloudflare)", "Software Proxy", "Terminates SSL, routes traffic, and serves public domains (*.s4ras.site)")
    }
    System_Boundary(vm_network, "S4RAS Core Private Subnet (192.168.10.0/24)") {
        System_Boundary(vm_208, "VM 208: Portal Host") {
            Container(spa, "React SPA", "Vite, React 19, Tailwind", "Renders the user dashboard, portal grid, and Status Layanan map.")
            Container(api, "Express Backend & API", "Express 5, Node.js", "Serves React build folder; proxies health checking requests to avoid CORS limits (Port 3000).")
            Container(deploy, "Deploy Daemon", "Express, PM2, Shell", "Receives webhooks on port 4000 to rebuild and restart PM2 dynamically.")
        }
        System_Boundary(vm_206, "VM 206: Authentication Host") {
            Container(keycloak, "Keycloak SSO", "Java, Wildfly", "Centralized OIDC & SAML user federation service (Port 8080).")
        }
        System_Boundary(vm_203, "VM 203: LMS Host") {
            Container(moodle, "Moodle LMS", "Apache, PHP, MySQL", "Platform for online assignments, tests, and course materials.")
        }
        System_Boundary(vm_207, "VM 207: Storage Host") {
            Container(nextcloud, "Nextcloud SAN", "Nginx, PHP-FPM, PostgreSQL", "Cloud storage, documents, and collaboration software.")
        }
        System_Boundary(vm_200, "VM 200: IPTV Host") {
            Container(iptv, "Jellyfin IPTV", "Jellyfin Server / Docker", "Jellyfin media server serving IPTV streaming.")
        }
        System_Boundary(vm_201, "VM 201: VoIP Host") {
            Container(voip, "VoIP Server", "Asterisk, FreePBX", "SIP-based VoIP calling platform (Port 8080).")
        }
        System_Boundary(vm_204, "VM 204: Observability Host") {
            Container(monitor, "Grafana & Prometheus", "Grafana, Prometheus, Node Exporter", "Tracks system resource load, disk space, and metrics (Port 3000).")
        }
    }
    Rel(user, proxy, "Accesses via HTTPS (443)", "TCP")
    Rel(proxy, api, "Forwards portal.s4ras.site to port 3000", "HTTP")
    Rel(proxy, keycloak, "Forwards sso.s4ras.site to port 8080", "HTTP")
    Rel(proxy, moodle, "Forwards moodle.s4ras.site", "HTTP")
    Rel(proxy, nextcloud, "Forwards cloud.s4ras.site", "HTTP")
    Rel(proxy, iptv, "Forwards iptv.s4ras.site", "HTTP")
    Rel(proxy, voip, "Forwards voip.s4ras.site to port 8080", "HTTP")
    Rel(proxy, monitor, "Forwards monitor.s4ras.site to port 3000", "HTTP")
    Rel(spa, api, "Queries health API /api/health/:key", "JSON/HTTP")
    Rel(api, keycloak, "Probes internal Keycloak (192.168.10.206:8080)", "HTTP")
    Rel(api, moodle, "Probes internal Moodle (192.168.10.203:80)", "HTTP")
    Rel(api, nextcloud, "Probes internal Nextcloud (192.168.10.207:80)", "HTTP")
    Rel(api, iptv, "Probes internal IPTV (192.168.10.200:8096)", "HTTP")
    Rel(api, voip, "Probes internal VoIP (192.168.10.201:8080)", "HTTP")
    Rel(api, monitor, "Probes internal Monitor (192.168.10.204:3000)", "HTTP")
```

### Level 3: Component Diagram (VM 208 Internal Modules)
Focuses on internal processes inside VM 208.

```mermaid
flowchart TB
    subgraph Client_Browser ["Client Web Browser"]
        ReactApp["React App Bootstrapper"]
        KC_JS["keycloak-js Adapter"]
        BerandaPage["Beranda.jsx Dashboard"]
        BackendService["services/backend.js"]
    end
    subgraph Express_Container ["VM 208: Express Server Processes"]
        StaticServer["Static File Middleware"]
        HealthController["Health Check Route /api/health/:key"]
        ProbeHelper["HTTP/HTTPS probe Helper"]
        Registry["SERVICES Config Map"]
    end
    subgraph External_VMs ["LAN VMs"]
        KeycloakHost["VM 206: Keycloak"]
        MoodleHost["VM 203: Moodle"]
        OtherVMs["Other Service Hosts"]
    end
    ReactApp -->|"1. Initializes Auth"| KC_JS
    KC_JS -->|"Redirect/Exchange Tokens"| KeycloakHost
    BerandaPage -->|"2. Triggers Health Scan"| BackendService
    BackendService -->|"3. AJAX GET /api/health/:key"| HealthController
    StaticServer -->|"Serves CSS/JS/HTML"| ReactApp
    HealthController -->|"4. Checks Key Registry"| Registry
    HealthController -->|"5. Calls probe helper with internal URL"| ProbeHelper
    ProbeHelper -->|"6. TCP Get (Timeout 3s)"| MoodleHost
    ProbeHelper -->|"6. Fallback Public TCP Get (5s)"| OtherVMs
```

### Level 4: Code Sequence Diagram (Probing Logic Flow)
Illustrates how the backend checks each endpoint.

```mermaid
sequenceDiagram
    autonumber
    actor Browser as User Browser
    participant Express as scripts/portal-server.js
    participant Registry as SERVICES Registry
    participant LAN as Target VM (Internal IP)
    participant Public as Target VM (Public URL)
    Browser->>Express: GET /api/health/moodle
    Express->>Registry: Lookup 'moodle' configurations
    Registry-->>Express: { internal: 'http://192.168.10.203', public: 'https://moodle.s4ras.site' }
    rect rgb(30, 40, 50)
        Note over Express, LAN: Try Internal Endpoint (LAN)
        Express->>LAN: HTTP GET http://192.168.10.203 (Timeout 3s)
        alt Responds < HTTP 500
            LAN-->>Express: HTTP 200 OK (5ms)
            Express-->>Browser: {"status":"online", "message":"http://192.168.10.203", "latency":6}
        else Fails / Timeout / HTTP >= 500
            LAN--x Express: Timeout / HTTP 502 (3s)
        end
    end
    rect rgb(40, 30, 30)
        Note over Express, Public: Fallback to Public URL
        Express->>Public: HTTP GET https://moodle.s4ras.site (Timeout 5s)
        alt Responds < HTTP 500
            Public-->>Express: HTTP 302 Found (40ms)
            Express-->>Browser: {"status":"online", "message":"https://moodle.s4ras.site", "latency":42}
        else Fails / Timeout / HTTP >= 500
            Public--x Express: Connection Error
            Express-->>Browser: {"status":"offline", "message":"Unreachable (HTTP 502)", "latency":null}
        end
    end
```

---

## 4. Deployment & Operations Playbook (Runbook)

### PM2 Process Administration
VM 208 manages execution of services using PM2:
*   **Start/Reload Portal processes**:
    ```bash
    pm2 startOrReload ecosystem.config.js
    ```
*   **Revive on boot up**:
    ```bash
    pm2 startup
    # Run generated systemd command
    pm2 save
    ```

### Rebuilding after Node Update
Whenever Node.js is updated on VM 208:
```bash
# 1. Update PM2 binary binding
npm install -g pm2
pm2 update

# 2. Reinstall packages
npm ci

# 3. Rebuild and trigger processes
npm run build
pm2 start ecosystem.config.js
pm2 save
```
