# Panduan Klien SIP dan WebRTC S4RAS

Dokumen ini berisi panduan konfigurasi step-by-step untuk menghubungkan aplikasi softphone (MicroSIP, Linphone, Zoiper) dan antarmuka web (WebRTC) ke Asterisk S4RAS.

---

## 1. Konfigurasi Desktop Softphone (MicroSIP / Linphone)

Gunakan parameter berikut pada klien softphone yang berada di jaringan LAN `192.168.10.x` atau melalui VPN/Tailscale:

### Akun 1: Ekstensi 1001
* **Account Name**: `S4RAS 1001`
* **SIP Server**: `192.168.10.202:5060`
* **SIP Proxy**: `192.168.10.202:5060`
* **User**: `1001`
* **Domain**: `192.168.10.202`
* **Login / Auth ID**: `1001`
* **Password**: `<SIP_SECRET_1001>`
* **Transport**: `UDP` (atau `Auto`)

### Akun 2: Ekstensi 1002
* **Account Name**: `S4RAS 1002`
* **SIP Server**: `192.168.10.202:5060`
* **SIP Proxy**: `192.168.10.202:5060`
* **User**: `1002`
* **Domain**: `192.168.10.202`
* **Login / Auth ID**: `1002`
* **Password**: `<SIP_SECRET_1002>`
* **Transport**: `UDP`

---

## 2. Pengujian Panggilan Suara & Echo Test

Setelah status akun berubah menjadi **Online** / **Registered** pada softphone:

1. **Uji Echo (Echo Test)**:
   * Ketik nomor `600` lalu tekan tombol panggil (**Call**).
   * Bicaralah ke mikrofon Anda. Asterisk akan memutar kembali suara Anda seketika. Jika suara terdengar jelas tanpa distorsi atau delay berlebih, audio codec dan jaringan RTP berfungsi sempurna.
   * Tekan tombol tutup telepon (**Hangup**).

2. **Uji Panggilan Antar Klien**:
   * Buka softphone kedua (misal: di laptop atau VM 205) dengan akun `1002`.
   * Dari akun `1001`, panggil nomor `1002`.
   * Akun `1002` akan berdering (Ringing). Angkat panggilan dan uji komunikasi audio dua arah.

3. **Uji Pengiriman Pesan Teks (SIP MESSAGE)**:
   * Pada MicroSIP, klik kanan kontak `1002` lalu pilih **Send Message**.
   * Ketik pesan (contoh: "Halo dari S4RAS VoIP"). Pesan akan diterima langsung di jendela obrolan klien penerima.

---

## 3. Konfigurasi WebRTC Browser (SIP.js / JsSIP)

Untuk integrasi aplikasi web (misal portal kampus atau webphone civitas):

* **WebSocket URL**: `wss://voip.s4ras.site/ws` (publik) atau `ws://192.168.10.202:8088/ws` (internal LAN)
* **Kredensial Ekstensi 1003**:
  * Username: `1003`
  * Password: `<SIP_SECRET_1003>`
* **Kredensial Ekstensi 1004**:
  * Username: `1004`
  * Password: `<SIP_SECRET_1004>`
* **Format Konfigurasi SIP.js**:
  ```javascript
  const simpleUser = new SimpleUser('wss://voip.s4ras.site/ws', {
    aor: 'sip:1003@voip.s4ras.site',
    media: {
      constraints: { audio: true, video: false },
      remote: { audio: document.getElementById('remoteAudio') }
    },
    userAgentOptions: {
      authorizationPassword: '<SIP_SECRET_1003>',
      authorizationUsername: '1003'
    }
  });
  ```
