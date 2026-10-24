# Portal S4RAS: Architecture, System Design, and Structural View

This document provides a holistic overview of the Portal S4RAS repository, detailing its system design, architectural patterns, directory structure, and execution flows.

---

## 1. High-Level System Architecture

Portal S4RAS serves as the central landing page and dashboard for the **S4RAS** self-hosted ecosystem. It acts as both the entry point for users and a real-time monitor for the overall health of associated services.

```mermaid
flowchart TD
    Client["Client Browser"]
    Proxy["Reverse Proxy / Nginx / Cloudflare"]
    SSO["Keycloak SSO VM 206"]
    subgraph VM_208 ["VM 208: Portal Server"]
        Express["Express Server: portal-server.js"]
        ReactApp["React SPA: build/"]
    end
    subgraph Internal_Network ["Private RFC1918 Network"]
        Moodle["Moodle LMS VM 203"]
        Cloud["Nextcloud VM 207"]
        IPTV["Jellyfin IPTV VM 200:8096"]
        VoIP["VoIP Server VM 201"]
        Monitor["Monitoring VM 204"]
    end
    Client -->|"HTTPS: portal.s4ras.site"| Proxy
    Proxy -->|"HTTP Port 3000"| Express
    Express -->|"Serves Static Files"| ReactApp
    ReactApp -->|"Auth Redirect"| SSO
    ReactApp -->|"AJAX: /api/health/:key"| Express
    Express -->|"HTTP GET Probe"| Moodle
    Express -->|"HTTP GET Probe"| SSO
    Express -->|"HTTP GET Probe"| Cloud
    Express -->|"HTTP GET Probe"| IPTV
    Express -->|"HTTP GET Probe"| VoIP
    Express -->|"HTTP GET Probe"| Monitor
```

---

## 2. Key Architectural Design Patterns

### A. Combined Static Server & Health-Check Proxy
To bypass CORS (Cross-Origin Resource Sharing) restrictions and browser security limitations (such as `no-cors` fetches resolving false-positives on 502/503 proxy pages), the application uses a **BFF (Backend-for-Frontend)** architecture implemented within `scripts/portal-server.js`:
*   **Static Serving**: It serves the React bundle (`build/`) to client web browsers.
*   **Server-Side Health Probing**: When a client requests a health status check via `/api/health/:key`, the server makes a direct HTTP probe to the internal IP address (LAN) of that service.
*   **Result Reporting**: The server determines if the target is up (HTTP status < 500) and sends clean JSON (`{ status: "online"/"offline", latency }`) back to the browser.

### B. SSO Integration (Keycloak)
*   User identity and session verification are handled centrally via Keycloak.
*   The frontend uses the `keycloak-js` adapter to enforce session states and authenticate actions.

### C. Automated Deployment & Webhook Trigger
The deployment process operates as follows:
1.  **Code Commit**: Developer pushes code to GitHub.
2.  **Continuous Integration**: GitHub Actions runs tests and packages the static frontend bundle.
3.  **Self-Hosted Runner / Trigger**: A deployment workflow uses SSH/SCP or a custom PM2 deployment script (`scripts/deploy-server.js` running on port 4000) to pull, install, rebuild, and reload the production process.

---

## 3. Repository Structural View

Here is a map of the repository's directories and critical files:

```
Portal-SARAS/
├── .github/workflows/          # CI/CD Workflows for automated building/testing
├── build/                      # Production-ready compiled assets (HTML, JS, CSS)
├── public/                     # Static assets (favicons, logos, manifests)
├── scripts/
│   ├── deploy-server.js        # Background webhook daemon to trigger pulls/rebuilds
│   └── portal-server.js        # Production Express server (Static host + Health API)
├── src/
│   ├── components/             # Reusable UI components
│   │   ├── Layout.jsx          # Shell structure containing header, footer, and sidebar
│   │   ├── StatusBadge.jsx     # Visual indicator for online/offline states
│   │   └── SkeletonCard.jsx    # Loading placeholder visual state
│   ├── config/
│   │   └── services.js         # Master registry of all services (URLs, internal IPs, icons)
│   ├── context/
│   │   ├── KeycloakContext.jsx # Global SSO auth context state
│   │   └── ThemeLanguageContext.jsx # Theme (dark/light) & language preference context
│   ├── pages/
│   │   ├── Beranda.jsx         # Dashboard Homepage showing service grids & status map
│   │   └── Admin.jsx           # Protected route containing system management details
│   ├── services/
│   │   └── backend.js          # API abstraction layers (fetchAnnouncements, checkServiceHealth)
│   ├── App.jsx                 # Main entry React Router tree mapping layout pages
│   ├── index.css               # Global Tailwind/CSS rules
│   └── index.jsx               # React DOM bootstrapping root
├── docs/                       # Project documentation & architecture blueprints
│   ├── PORTAL.md               # Portal architecture & diagrams
│   ├── api_specification.yaml  # OpenAPI schema specification
│   └── system_architecture_document.md # Master ecosystem architecture
├── ecosystem.config.js         # PM2 configurations (portal-prod & deploy-trigger processes)
├── package.json                # Project dependencies (React 19, Express 5, Vite, Tailwind v4)
└── vite.config.mjs             # Vite compiler rules, environment plugins, and test setup
```

---

## 4. Key Execution Flows

### 1. Initial Page Load & Authentication Flow
```mermaid
sequenceDiagram
    autonumber
    actor User as Client Browser
    participant Express as Express (VM 208)
    participant KC as Keycloak (VM 206)
    User->>Express: GET https://portal.s4ras.site/
    Express-->>User: Serves index.html + React Assets
    User->>User: Keycloak initialization check
    alt No Active Session
        User->>KC: Redirect to Login Page
        KC-->>User: Authenticate & Redirect back with code
        User->>KC: Exchange code for Access/Refresh tokens
    end
    User->>User: Render Dashboard (Beranda)
```

### 2. Service Health Check Flow
```mermaid
sequenceDiagram
    autonumber
    participant React as React App (Browser)
    participant Express as Express Server (VM 208)
    participant LAN as Target VM (e.g. Moodle)
    React->>Express: GET /api/health/moodle
    Note over Express: Look up IP configuration:<br/>http://192.168.10.203
    Express->>LAN: HTTP GET (Timeout 4s)
    alt VM is reachable (Response < 500)
        LAN-->>Express: HTTP 200 OK / 302 Found
        Express-->>React: {"status":"online", "message":"http://192.168.10.203", "latency":12}
    else VM is down or returns error (Response >= 500 or Connection Timeout)
        LAN--x Express: Connection Timeout / HTTP 502 Bad Gateway
        Express-->>React: {"status":"offline", "message":"Unreachable (HTTP 502)", "latency":null}
    end
```

---

## 5. VM 208 Process Configuration (PM2)

The server runs two persistent processes managed by **PM2** via `ecosystem.config.js`:

1.  **`portal-prod`**:
    *   **Script**: `scripts/portal-server.js`
    *   **Port**: `3000` (Reverse proxied by Nginx/Cloudflare)
    *   **Purpose**: Serves the React web app and runs the backend health-check logic.
2.  **`deploy-trigger`**:
    *   **Script**: `scripts/deploy-server.js`
    *   **Port**: `4000`
    *   **Purpose**: Listens for git deployment hooks or manual deploy triggers to rebuild the portal without stopping active user operations.
