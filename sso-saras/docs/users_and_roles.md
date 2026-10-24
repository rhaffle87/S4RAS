# User & Role Management — Realm S4RAS

Dokumen ini menjelaskan struktur pengguna, hierarki role/hak akses, dan skema pemetaan atribut ke dalam token JWT di ekosistem S4RAS.

---

## 1. Hierarki Role (Hak Akses)

Di dalam Realm **`S4RAS`**, terdapat tingkatan role sebagai berikut:

```
                  ┌──────────────────────┐
                  │     Super Admin      │
                  │  (Akses Penuh Portal)│
                  └──────────┬───────────┘
                             │
                  ┌──────────▼───────────┐
                  │        admin         │
                  │ (Kelola Layanan/User)│
                  └──────────┬───────────┘
                             │
            ┌────────────────┴────────────────┐
            ▼                                 ▼
   ┌─────────────────┐               ┌─────────────────┐
   │      Dosen      │               │    Mahasiswa    │
   │ (LMS Moodle Edu)│               │(Akses Akademik) │
   └─────────────────┘               └─────────────────┘
```

| Role | Deskripsi Hak Akses |
|:---|:---|
| **`Super Admin`** | Memiliki kontrol tertinggi terhadap menu administrasi, deployment webhook, dan monitoring. |
| **`admin`** | Hak akses administratif portal (`isAdmin = true` di frontend). |
| **`Dosen`** | Role pengajar dengan izin membuat materi & kuis di Moodle LMS (`VM 203`). |
| **`Mahasiswa`** | Role pengguna standar untuk mengakses materi, IPTV Jellyfin, dan Nextcloud SAN. |
| **`default-roles-s4ras`** | Composite role bawaan Keycloak yang otomatis diberikan ke seluruh user baru. |

---

## 2. Matriks Pengguna Saat Ini

### A. Pengguna Realm `S4RAS` (Aplikasi)

| Username | Nama Lengkap | Email | Role yang Diberikan | Atribut Tambahan | Status Password |
|:---|:---|:---|:---|:---|:---:|
| **`admin`** | System Admin | `admin@s4ras.site` | `Super Admin`, `admin` | `role=admin` | `[REDACTED]` |
| **`testuser`** | test user | `civitas@s4ras.site` | `Super Admin`, `admin` | `role=admin` | `[REDACTED]` |
| **`tine`** | Tine Joeana | `tine.joeana@gmail.com` | `default-roles-s4ras` | - | Aktif di Database |
| **`test1`** | - | - | `Dosen` | - | Wajib Ubah Password |

### B. Pengguna Realm `master` (Server Keycloak)

| Username | Email | Hak Akses | Keterangan |
|:---|:---|:---|:---|
| **`admin`** | - | `admin`, `default-roles-master` | Akun Superuser untuk web console `/admin/`. |

---

## 3. Struktur Token JWT (Access Token Claims)

Ketika pengguna berhasil melakukan otentikasi melalui Portal (`front-end`), Keycloak menghasilkan JWT dengan struktur klaim berikut:

```json
{
  "exp": 1789135613,
  "iat": 1789135313,
  "iss": "https://sso.s4ras.site/realms/S4RAS",
  "aud": "account",
  "sub": "556ea642-2476-4314-919e-31a240a7e355",
  "typ": "Bearer",
  "azp": "front-end",
  "preferred_username": "admin",
  "name": "System Admin",
  "email": "admin@s4ras.site",
  "realm_access": {
    "roles": [
      "Super Admin",
      "admin",
      "default-roles-s4ras"
    ]
  },
  "resource_access": {
    "account": {
      "roles": ["manage-account", "view-profile"]
    }
  }
}
```

---

## 4. Cara Portal Memvalidasi Role Admin

Aplikasi React Portal S4RAS (`src/context/KeycloakContext.jsx`) melakukan evaluasi multi-layer untuk menentukan apakah user berhak membuka menu **Admin Dashboard**:

```javascript
// Cuplikan KeycloakContext.jsx
const realmRoles = keycloak.realmAccess?.roles || [];
const clientRoles = keycloak.resourceAccess?.['front-end']?.roles || [];
const roleAttr = profile?.attributes?.role;
const username = (profile?.username || '').toLowerCase();

const hasAdmin =
  realmRoles.some(r => r.toLowerCase() === 'admin') ||
  clientRoles.some(r => r.toLowerCase() === 'admin') ||
  username === 'admin' ||
  (Array.isArray(roleAttr) && roleAttr.some(r => r.toLowerCase() === 'admin')) ||
  (typeof roleAttr === 'string' && roleAttr.toLowerCase() === 'admin');

setIsAdmin(hasAdmin);
```
*(User `admin` dan `testuser` keduanya memenuhi kriteria di atas sehingga menu Admin otomatis terbuka).*
