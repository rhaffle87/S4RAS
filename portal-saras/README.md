# Portal S4RAS — Solution for Remote Area Services

Dashboard antarmuka terpadu (*Unified BFF & Web Portal*) untuk sistem **S4RAS (Solution for Remote Area Services)**, gerbang akses satu pintu layanan edutainment dan komunikasi mandiri untuk daerah 3T di Indonesia.

## Fitur Utama

- **OIDC Single Sign-On**: Terintegrasi penuh dengan Keycloak 26.1 untuk otentikasi warga, siswa (SD/SMP/SMA), guru, dan admin.
- **Unified Campus Cockpit Hub**: Panel navigasi terpusat untuk LMS Moodle, Nextcloud SAN, Asterisk WebRTC Phone, dan Jellyfin IPTV.
- **WebRTC Softphone**: Telepon dan video call berbasis browser antar-ekstensi lokal dengan dukungan CoTURN STUN/TURN traversal.
- **Fail-Closed API & Cryptographic JWT**: Seluruh webhook dan context API diamankan dengan timing-safe equal dan verifikasi tanda tangan token.
- **Real-Time Redis Event Mesh**: Distribusi event cluster dan pengumuman siaran darurat desa via Server-Sent Events (SSE).

## Struktur Proyek

- `src/App.jsx` - Routing dan inisialisasi aplikasi
- `src/context/KeycloakContext.jsx` - Manajemen sesi otentikasi Keycloak OIDC
- `src/pages/` - Halaman antarmuka (`Beranda`, `Akun`, `Pengumuman`, `Pengaturan`, `Admin`)
- `src/components/` - Komponen modular (`CampusCockpitHub`, `SoftphoneModal`, `ClusterTelemetryCard`, `ServiceSparkline`)
- `scripts/portal-server.js` - Backend-for-Frontend (Express 5 + Redis Pub/Sub)
- `scripts/lib/` - Modul independen otentikasi kriptografis (`auth.js`) dan persona kanonikal (`personas.js`)

## Perintah Pengembangan

```bash
# Menjalankan frontend secara lokal dengan Vite
npm run dev

# Menjalankan build bundle produksi
npm run build

# Menjalankan seluruh test suite Vitest
npm test

# Menjalankan pemeriksaan linting ESLint
npm run lint
```
