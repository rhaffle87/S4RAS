# Realms and Clients Specification — Realm S4RAS

Dokumen ini memuat detail teknis seluruh Realm dan Klien OpenID Connect (OIDC) yang terdaftar di Keycloak S4RAS.

---

## 1. Pembagian Realm Keycloak

| Realm | Tujuan Penggunaan | URL Base Otentikasi | Hak Akses |
|:---:|:---|:---|:---|
| **`master`** | Khusus konfigurasi Keycloak, pembuatan realm baru, dan maintenance server | `https://sso.s4ras.site/admin/master/console/` | Khusus Super Admin Keycloak (`admin`) |
| **`S4RAS`** | Realm operasional tempat seluruh aplikasi S4RAS (Portal, LMS, IPTV) berfederasi | `https://sso.s4ras.site/realms/S4RAS/` | Mahasiswa, Dosen, Admin Portal, Staf |

---

## 2. Matriks Klien OIDC (Realm: S4RAS)

| Client ID | Tipe Klien | Standard Flow (Code) | Direct Grant (Password) | Client Secret | Redirect URIs Utama |
|:---|:---:|:---:|:---:|:---|:---|
| **`front-end`** | Public | [OK] Ya | [OK] Ya | *(None / Public)* | `https://portal.s4ras.site/*`<br>`http://localhost:3000/*` |
| **`moodle`** | Confidential | [OK] Ya | [OK] Ya | `Jo4GYepxc06DvHexY88E6uHQu4cnWizs` | `https://moodle.s4ras.site/auth/oidc/`<br>`https://moodle.s4ras.site/*` |
| **`jellyfin`** | Confidential | [OK] Ya | [FAIL] Tidak | `2v1108RVRSpf2IdW5eXO2gjXvuVOyT1E` | `https://iptv.s4ras.site/sso/OID/*`<br>`https://iptv.s4ras.site/sso/oid/signin-oidc` |
| **`nextcloud`**| Confidential | [OK] Ya | [OK] Ya | `NextcloudSecret2026!` | `https://cloud.s4ras.site/*`<br>`https://cloud.s4ras.site/apps/user_oidc/code` |
| **`saras-portal`**| Confidential | [OK] Ya | [OK] Ya | *(Managed Secret)* | `https://portal.s4ras.site/*` |
| **`admin-cli`** | Public | [FAIL] Tidak | [OK] Ya | *(None)* | Digunakan oleh `kcadm.sh` CLI |

---

## 3. Spesifikasi Mendalam per Klien

### A. Klien: `front-end` (Portal Dashboard)
Klien ini digunakan oleh aplikasi React SPA pada `portal.s4ras.site` melalui adapter `keycloak-js`.

* **Client ID**: `front-end`
* **Access Type**: `public` (tidak menyimpan secret di browser)
* **PKCE Challenge**: `S256`
* **Valid Redirect URIs**:
  * `https://portal.s4ras.site/*`
  * `https://s4ras.site/*`
  * `http://localhost:3000/*`
  * `http://localhost:5173/*`
* **Web Origins**:
  * `https://portal.s4ras.site`
  * `https://s4ras.site`
  * `+` (Mengizinkan seluruh redirect URIs yang valid)
* **Default Scopes**: `openid`, `profile`, `email`, `roles`, `web-origins`

---

### B. Klien: `moodle` (Moodle LMS VM 203)
Klien ini menghubungkan Moodle menggunakan plugin OIDC/OAuth2 Authentication (`auth_oidc`).

* **Client ID**: `moodle`
* **Access Type**: `confidential`
* **Client Secret**: `Jo4GYepxc06DvHexY88E6uHQu4cnWizs`
* **Valid Redirect URIs**:
  * `https://moodle.s4ras.site/auth/oidc/`
  * `https://moodle.s4ras.site/auth/oidc/*`
  * `https://moodle.s4ras.site/*`
* **Web Origins**: `https://moodle.s4ras.site`, `+`
* **Logout Redirect**: `https://moodle.s4ras.site`

---

### C. Klien: `jellyfin` (IPTV Media Server VM 200)
Klien ini menghubungkan Jellyfin menggunakan plugin `jellyfin-plugin-sso`.

* **Client ID**: `jellyfin`
* **Access Type**: `confidential`
* **Client Secret**: `2v1108RVRSpf2IdW5eXO2gjXvuVOyT1E`
* **Valid Redirect URIs**:
  * `https://iptv.s4ras.site/sso/OID/rp/keycloak`
  * `https://iptv.s4ras.site/sso/OID/callback/keycloak`
  * `https://iptv.s4ras.site/sso/oid/signin-oidc`
  * `https://iptv.s4ras.site/sso/*`
* **Web Origins**: `https://iptv.s4ras.site`, `+`

---

### D. Klien: `nextcloud` (Nextcloud SAN VM 207)
Klien ini menghubungkan penyimpanan awan Nextcloud melalui aplikasi resmi `user_oidc`.

* **Client ID**: `nextcloud`
* **Access Type**: `confidential`
* **Client Secret**: `NextcloudSecret2026!`
* **Valid Redirect URIs**:
  * `https://cloud.s4ras.site/*`
  * `https://cloud.s4ras.site/apps/user_oidc/code`
  * `https://cloud.s4ras.site/index.php/apps/user_oidc/code`
* **Web Origins**: `https://cloud.s4ras.site`, `+`
* **Root / Base URL**: `https://cloud.s4ras.site`
* **Default Scopes**: `openid`, `profile`, `email`, `roles`, `web-origins`

---

## 4. OIDC Endpoints Terbuka (Well-Known)

Seluruh aplikasi klien dapat mengambil metadata OIDC secara otomatis melalui OpenID Discovery:

* **OpenID Configuration**:
  ```text
  https://sso.s4ras.site/realms/S4RAS/.well-known/openid-configuration
  ```
* **Authorization Endpoint**:
  ```text
  https://sso.s4ras.site/realms/S4RAS/protocol/openid-connect/auth
  ```
* **Token Endpoint**:
  ```text
  https://sso.s4ras.site/realms/S4RAS/protocol/openid-connect/token
  ```
* **Userinfo Endpoint**:
  ```text
  https://sso.s4ras.site/realms/S4RAS/protocol/openid-connect/userinfo
  ```
* **JWKS Endpoint (Sertifikat & Public Key)**:
  ```text
  https://sso.s4ras.site/realms/S4RAS/protocol/openid-connect/certs
  ```
* **End Session / Logout**:
  ```text
  https://sso.s4ras.site/realms/S4RAS/protocol/openid-connect/logout
  ```
