# Konfigurasi dan Integrasi SSO IPTV S4RAS

Dokumen ini memuat panduan lengkap konfigurasi internal Jellyfin, reverse proxy, serta integrasi OpenID Connect (OIDC) dengan Keycloak SSO S4RAS.

---

## 1. Konfigurasi Klien Keycloak (`jellyfin`)

Di dalam Keycloak Master / Realm `S4RAS`, klien untuk IPTV didaftarkan dengan spesifikasi teknis sebagai berikut:

* **Realm**: `S4RAS`
* **Client ID**: `jellyfin`
* **Client Protocol**: `openid-connect`
* **Client Authentication (Access Type)**: `confidential` (membutuhkan Client Secret)
* **Client Secret**: `2v1108RVRSpf2IdW5eXO2gjXvuVOyT1E`
* **Standard Flow**: `Enabled` (Authorization Code Flow)
* **Direct Access Grants**: `Disabled` (Mencegah pengiriman password mentah)
* **Valid Redirect URIs**:
  * `https://iptv.s4ras.site/sso/OID/rp/keycloak`
  * `https://iptv.s4ras.site/sso/OID/callback/keycloak`
  * `https://iptv.s4ras.site/sso/oid/signin-oidc`
  * `https://iptv.s4ras.site/sso/*`
* **Web Origins**:
  * `https://iptv.s4ras.site`
  * `+` (Mengizinkan redirect origin turunan)
* **Default Client Scopes**: `openid`, `profile`, `email`, `roles`, `web-origins`

---

## 2. Konfigurasi Plugin SSO Jellyfin (`SSO-Auth.xml`)

File konfigurasi plugin terletak pada `/home/s4ras/jellyfin/config/plugins/configurations/SSO-Auth.xml`:

```xml
<?xml version="1.0" encoding="utf-8"?>
<PluginConfiguration xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema">
  <SamlConfigs />
  <OidConfigs>
    <item>
      <key>
        <string>keycloak</string>
      </key>
      <value>
        <PluginConfiguration>
          <OidEndpoint>https://sso.s4ras.site/realms/S4RAS</OidEndpoint>
          <OidClientId>jellyfin</OidClientId>
          <OidSecret>2v1108RVRSpf2IdW5eXO2gjXvuVOyT1E</OidSecret>
          <Enabled>true</Enabled>
          <EnableAuthorization>true</EnableAuthorization>
          <EnableAllFolders>true</EnableAllFolders>
          <EnabledFolders />
          <AdminRoles>
            <string>admin</string>
          </AdminRoles>
          <Roles />
          <RoleClaim>realm_access.roles</RoleClaim>
          <OidScopes>
            <string>openid</string>
            <string>profile</string>
            <string>email</string>
          </OidScopes>
          <SchemeOverride>https</SchemeOverride>
          <NewPath>true</NewPath>
          <DisableHttps>false</DisableHttps>
        </PluginConfiguration>
      </value>
    </item>
  </OidConfigs>
</PluginConfiguration>
```

### Parameter Kunci OIDC
1. **`OidEndpoint`**: Mengarah ke base discovery realm Keycloak `https://sso.s4ras.site/realms/S4RAS`. Plugin akan otomatis membaca endpoint `.well-known/openid-configuration`.
2. **`SchemeOverride`**: Diatur ke `https`. Sangat krusial karena Jellyfin berada di belakang Cloudflare SSL termination (reverse proxy mengirim request HTTP di port 8096, namun URL callback yang didaftarkan harus berskema HTTPS).
3. **`AdminRoles` & `RoleClaim`**: Pengguna yang memiliki role `admin` di dalam token claim `realm_access.roles` secara otomatis mendapatkan hak administrator di Jellyfin.

---

## 3. Konfigurasi Jaringan Jellyfin (`network.xml`)

File konfigurasi jaringan pada `/home/s4ras/jellyfin/config/config/network.xml`:

* **`RequireHttps`**: `true` — Mengharuskan klien menggunakan HTTPS saat streaming.
* **`InternalHttpPort`**: `8096` — Port yang dibuka container ke Docker host.
* **`PublishedServerUriBySubnet`**:
  ```xml
  <PublishedServerUriBySubnet>
    <string>all=https://iptv.s4ras.site</string>
  </PublishedServerUriBySubnet>
  ```
  Ini menginstruksikan Jellyfin untuk mengumumkan URI resmi `https://iptv.s4ras.site` ke seluruh klien media dan aplikasi TV yang terhubung.

---

## 4. Konfigurasi Reverse Proxy Lokal (Caddy)

File `/etc/caddy/Caddyfile` di host VM 200:

```caddy
:80 {
    reverse_proxy localhost:8096
}
```

* Memberikan fallback proxy jika ada service atau container internal LAN yang mengakses VM 200 melalui port HTTP default (80).
* Menangani header WebSocket dan buffering streaming secara otomatis.
