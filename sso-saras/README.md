# S4RAS Centralized SSO (Keycloak)

Layanan Single Sign-On (SSO) dan Identity & Access Management (IAM) terpusat untuk seluruh ekosistem **S4RAS**, berjalan pada **VM 206** menggunakan **Keycloak 26.1** dan **PostgreSQL 16**.

---

## 1. Quick Overview

* **Domain Publik**: [`https://sso.s4ras.site`](https://sso.s4ras.site)
* **IP Internal (LAN)**: `192.168.10.206:8080`
* **Tailscale IP**: `100.64.0.16:8080`
* **Host VM**: VM 206 (`s4ras-sso`) pada Proxmox node `its`
* **Protokol Standar**: OpenID Connect (OIDC 1.0) & SAML 2.0
* **Master Realm**: `master` (Khusus Super Admin Keycloak)
* **Production Realm**: `S4RAS` (Federasi seluruh aplikasi S4RAS)

---

## 2. Struktur Dokumentasi

Dokumentasi lengkap dan sistematis terbagi ke dalam beberapa bagian di folder [`docs/`](docs/):

1.  [**`docs/architecture.md`**](docs/architecture.md)
   * Arsitektur sistem, topologi jaringan, ingress via Cloudflare Tunnel, dan skema database PostgreSQL.
2.  [**`docs/realms_and_clients.md`**](docs/realms_and_clients.md)
   * Konfigurasi realm `S4RAS`, daftar klien OIDC (`front-end`, `moodle`, `jellyfin`), Client Secret, Redirect URIs, dan Scopes.
3.  [**`docs/users_and_roles.md`**](docs/users_and_roles.md)
   * Matriks pengguna, pemetaan hak akses/role (`Super Admin`, `admin`, `Dosen`, `Mahasiswa`), serta struktur atribut token JWT.
4.  [**`docs/operations_runbook.md`**](docs/operations_runbook.md)
   * Runbook operasional: Perintah `kcadm.sh`, backup & restore PostgreSQL, troubleshooting Cloudflare 502, manajemen systemd/Docker, dan manajemen kredensial.

---

## 3. Quick Access Kredensial

> [!IMPORTANT]
> Jangan pernah membingungkan login **Keycloak Admin Console** dengan login **Portal S4RAS**!

| Kebutuhan Akses | URL | Realm | Username | Default Password |
|:---|:---|:---:|:---:|:---|
| **Admin Console Keycloak** | [`https://sso.s4ras.site/admin/`](https://sso.s4ras.site/admin/) | `master` | `admin` | `[REDACTED]` |
| **Portal S4RAS Dashboard** | [`https://portal.s4ras.site/`](https://portal.s4ras.site/) | `S4RAS` | `admin` | `[REDACTED]` |
| **Developer / Test User** | [`https://portal.s4ras.site/`](https://portal.s4ras.site/) | `S4RAS` | `testuser` | `[REDACTED]` |

---

## 4. Cara Menjalankan Stack (Docker Compose)

Di dalam VM 206 (`/home/sso/s4ras-sso`):

```bash
# Menyalakan stack SSO
docker compose up -d

# Melihat status container
docker compose ps

# Memeriksa log Keycloak real-time
docker compose logs -f keycloak

# Mematikan stack
docker compose down
```

---

## 5. Integrasi Layanan (Federated Clients)

```
[ Client Browser ]
        │
        ▼ (OIDC Auth Request)
┌───────────────────────────────────────┐
│   https://sso.s4ras.site (Realm: S4RAS)│
└───────────────────┬───────────────────┘
                    │
      ┌─────────────┼─────────────┐
      ▼             ▼             ▼
[ Portal S4RAS ] [ Moodle LMS ] [ Jellyfin IPTV ]
 Client: front-end Client: moodle Client: jellyfin
```
