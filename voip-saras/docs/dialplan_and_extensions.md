# Spesifikasi Dialplan dan Ekstensi Asterisk S4RAS

Dokumen ini memuat arsitektur aturan panggilan (`dialplan`), pemetaan context, penanganan pesan instan, dan nomor pengujian di Asterisk S4RAS.

---

## 1. Konsep Context dalam Dialplan

Asterisk menggunakan konsep `context` untuk mengisolasi hak akses panggilan:

1. **`from-internal`**: Context utama untuk seluruh ekstensi civitas S4RAS (1001, 1002, 1003, 1004, dll.). Memiliki izin untuk memanggil sesama ekstensi, melakukan echo test, dan mengirim pesan instan.
2. **`messages`**: Context khusus yang menangani lalu lintas SIP MESSAGE (SMS / teks antar softphone).
3. **`default`**: Context pengaman jika ada request masuk dari alamat asing tanpa kredensial valid (dibalas dengan sinyal `Congestion()` atau `Hangup()`).

---

## 2. Tabel Ekstensi & Nomor Khusus

| Nomor Ekstensi | Sasaran Dial / Aksi | Context | Catatan Fungsional |
|:---:|:---|:---:|:---|
| **`600`** | `Echo()` test | `from-internal` | Memantulkan kembali suara pengguna untuk mengukur latency & kejernihan mic |
| **`1001`** | `Dial(PJSIP/1001, 30)` | `from-internal` | Klien desktop softphone (MicroSIP) via UDP |
| **`1002`** | `Dial(PJSIP/1002, 30)` | `from-internal` | Klien desktop softphone (MicroSIP) via UDP |
| **`1003`** | `Dial(PJSIP/1003, 30)` | `from-internal` | Klien browser WebRTC via WebSocket |
| **`1004`** | `Dial(PJSIP/1004, 30)` | `from-internal` | Klien browser WebRTC via WebSocket |
| **`1074700`** | `Dial(PJSIP/1074700, 30)` | `from-internal` | Akun WebRTC Administrator |
| **`1079348`** | `Dial(PJSIP/1079348, 30)` | `from-internal` | Akun WebRTC Sivitas Peneliti |
| **`12345678910111`** | `Dial(PJSIP/12345678910111, 30)` | `from-internal` | Akun pengujian nomor panjang |

---

## 3. Logika Dialplan di `extensions.conf`

Cuplikan aturan panggilan pada file `/etc/asterisk/extensions.conf`:

```ini
; ===== ECHO TEST (DIAL 600) =====
exten => 600,1,NoOp(Echo test initiated)
exten => 600,n,Answer()
exten => 600,n,Wait(1)
exten => 600,n,Echo()
exten => 600,n,Hangup()

; ===== SIP INSTANT MESSAGING DISPATCHER =====
[messages]
exten => 1001,1,NoOp(SIP MESSAGE received for 1001)
exten => 1001,n,Set(ACTUALTO=${CUT(MESSAGE(to),@,1)})
exten => 1001,n,Set(ACTUALTO=${CUT(ACTUALTO,:,2)})
exten => 1001,n,Set(contacts=${PJSIP_DIAL_CONTACTS(${ACTUALTO})})
exten => 1001,n,While($["${SET(contact=${SHIFT(contacts,&):6})}" != ""])
exten => 1001,n,MessageSend(pjsip:${contact},${MESSAGE(from)})
exten => 1001,n,EndWhile
exten => 1001,n,Hangup()

; (Pola yang sama diterapkan untuk 1002, 1003, 1004, dan 12345678910111)
```
