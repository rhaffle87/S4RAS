const BACKEND_API_BASE = process.env.REACT_APP_BACKEND_API_URL || '';

export const DEFAULT_ANNOUNCEMENTS = [
  {
    id: 'ann-sso',
    title: 'Integrasi Keycloak SSO & Keamanan MFA Berjalan Penuh',
    title_id: 'Integrasi Keycloak SSO & Keamanan MFA Berjalan Penuh',
    title_en: 'Keycloak SSO & Multi-Factor Auth Integration Fully Active',
    description: 'Sistem login tunggal terintegrasi dengan proteksi brute-force dan manajemen sesi terpusat di seluruh layanan kampus.',
    desc_id: 'Sistem login tunggal terintegrasi dengan proteksi brute-force dan manajemen sesi terpusat di seluruh layanan kampus.',
    desc_en: 'Centralized single sign-on is active with brute-force protection and unified session management across all campus services.',
    badge: 'Keamanan',
    badge_id: 'Keamanan',
    badge_en: 'Security',
    date: '2026-09-12',
    category: 'security'
  },
  {
    id: 'ann-lms',
    title: 'Moodle LMS Semester Gasal 2026/2027 Telah Dibuka',
    title_id: 'Moodle LMS Semester Gasal 2026/2027 Telah Dibuka',
    title_en: 'Moodle LMS Fall Semester 2026/2027 Courses Open',
    description: 'Mata kuliah Sistem Terdistribusi (KOM-401), Basis Data Lanjut (SBD-201), dan Jaringan Komputer (JK-302) siap diakses untuk silabus dan penugasan.',
    desc_id: 'Mata kuliah Sistem Terdistribusi (KOM-401), Basis Data Lanjut (SBD-201), dan Jaringan Komputer (JK-302) siap diakses untuk silabus dan penugasan.',
    desc_en: 'Distributed Systems (KOM-401), Advanced Databases (SBD-201), and Computer Networks (JK-302) are ready for syllabi, materials, and assignments.',
    badge: 'Akademik',
    badge_id: 'Akademik',
    badge_en: 'Academic',
    date: '2026-09-12',
    category: 'academic'
  },
  {
    id: 'ann-san',
    title: 'Nextcloud Office & Pengeditan Dokumen Kolaboratif Tersedia',
    title_id: 'Nextcloud Office & Pengeditan Dokumen Kolaboratif Tersedia',
    title_en: 'Nextcloud Office & Real-Time Collaborative Document Editing',
    description: 'Civitas kini dapat mengedit dokumen (.docx, .xlsx, .odt) bersama secara real-time langsung melalui browser menggunakan Collabora Online.',
    desc_id: 'Civitas kini dapat mengedit dokumen (.docx, .xlsx, .odt) bersama secara real-time langsung melalui browser menggunakan Collabora Online.',
    desc_en: 'Campus members can now collaboratively edit documents (.docx, .xlsx, .odt) in real time directly inside the browser using Collabora Online.',
    badge: 'Fitur Baru',
    badge_id: 'Fitur Baru',
    badge_en: 'New Feature',
    date: '2026-09-12',
    category: 'storage'
  },
  {
    id: 'ann-voip',
    title: 'Telefoni WebRTC HD & Video Konsultasi Asterisk 22',
    title_id: 'Telefoni WebRTC HD & Video Konsultasi Asterisk 22',
    title_en: 'WebRTC HD Telephony & Video Consultations on Asterisk 22',
    description: 'WebPhone bawaan portal kini mendukung panggilan suara jernih dan tele-konsultasi video HD VP8 (Ext 1004) serta IVR interaktif (Ext 1000).',
    desc_id: 'WebPhone bawaan portal kini mendukung panggilan suara jernih dan tele-konsultasi video HD VP8 (Ext 1004) serta IVR interaktif (Ext 1000).',
    desc_en: 'The built-in WebPhone now supports crystal-clear voice and HD VP8 video consultations (Ext 1004) along with interactive IVR (Ext 1000).',
    badge: 'Telefoni',
    badge_id: 'Telefoni',
    badge_en: 'VoIP',
    date: '2026-09-12',
    category: 'telephony'
  },
  {
    id: 'ann-iptv',
    title: 'Katalog IPTV Streaming Cinema & Edukasi Diperbarui',
    title_id: 'Katalog IPTV Streaming Cinema & Edukasi Diperbarui',
    title_en: 'IPTV Streaming Cinema & Educational Library Catalog Updated',
    description: 'Koleksi materi video kuliah, film dokumenter, anime series, dan siaran langsung TVRI kini dapat dinikmati melalui Jellyfin.',
    desc_id: 'Koleksi materi video kuliah, film dokumenter, anime series, dan siaran langsung TVRI kini dapat dinikmati melalui Jellyfin.',
    desc_en: 'Academic lecture videos, documentaries, anime series, and TVRI live channels are now streamed directly via Jellyfin.',
    badge: 'Media',
    badge_id: 'Media',
    badge_en: 'Media',
    date: '2026-09-12',
    category: 'media'
  },
  {
    id: 'ann-monitor',
    title: 'Sistem Pemantauan Infrastruktur Grafana & Prometheus Siaga',
    title_id: 'Sistem Pemantauan Infrastruktur Grafana & Prometheus Siaga',
    title_en: 'Grafana & Prometheus Observability with In-App Alerts Active',
    description: '10 VM node dan 10 layanan mikro dipantau real-time dengan integrasi webhook Alertmanager ke banner darurat portal.',
    desc_id: '10 VM node dan 10 layanan mikro dipantau real-time dengan integrasi webhook Alertmanager ke banner darurat portal.',
    desc_en: '10 VM nodes and 10 microservices are monitored in real time with Alertmanager webhook integration feeding portal emergency banners.',
    badge: 'Sistem',
    badge_id: 'Sistem',
    badge_en: 'System',
    date: '2026-09-12',
    category: 'monitoring'
  },
  {
    id: 'ann-dr',
    title: 'Otomatisasi Backup Harian & Uji Pemulihan Bencana Bulanan',
    title_id: 'Otomatisasi Backup Harian & Uji Pemulihan Bencana Bulanan',
    title_en: 'Automated Nightly Backups & Monthly Disaster Recovery Verification',
    description: 'Backup terenkripsi dijalankan setiap pukul 02:00 WIB ke SAN WebDAV, diverifikasi otomatis dengan ephemeral sandbox restoration.',
    desc_id: 'Backup terenkripsi dijalankan setiap pukul 02:00 WIB ke SAN WebDAV, diverifikasi otomatis dengan ephemeral sandbox restoration.',
    desc_en: 'Encrypted multi-node backups run nightly at 02:00 WIB to SAN WebDAV, automatically verified via ephemeral sandbox restoration drills.',
    badge: 'Operasional',
    badge_id: 'Operasional',
    badge_en: 'Operations',
    date: '2026-09-12',
    category: 'backup'
  },
  {
    id: 'ann-deploy',
    title: 'Pembaruan Zero-Downtime GitOps Portal Siap Digunakan',
    title_id: 'Pembaruan Zero-Downtime GitOps Portal Siap Digunakan',
    title_en: 'Zero-Downtime GitOps Production Deployments Available',
    description: 'Administrator dapat memicu pembaruan portal langsung dari dashboard admin dengan mekanisme hot reload PM2 dan auto-rollback.',
    desc_id: 'Administrator dapat memicu pembaruan portal langsung dari dashboard admin dengan mekanisme hot reload PM2 dan auto-rollback.',
    desc_en: 'Administrators can trigger portal updates directly from the admin dashboard with PM2 graceful reloads and auto-rollback safety.',
    badge: 'Pembaruan',
    badge_id: 'Pembaruan',
    badge_en: 'Update',
    date: '2026-09-12',
    category: 'admin'
  }
];

export const fetchAnnouncements = async () => {
  const endpoint = BACKEND_API_BASE
    ? `${BACKEND_API_BASE}/announcements`
    : '/api/announcements';

  try {
    const res = await fetch(endpoint, { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) return data;
    }
  } catch {
    // Fallback to built-in announcements list
  }
  return DEFAULT_ANNOUNCEMENTS;
};

/**
 * Real-time SSE stream subscriber for announcements push notifications (Phase 34.2)
 */
export const subscribeAnnouncementsStream = (onNewAnnouncement, onInit, onClusterEvent) => {
  if (typeof window === 'undefined' || typeof window.EventSource === 'undefined') {
    return () => {};
  }

  const endpoint = BACKEND_API_BASE
    ? `${BACKEND_API_BASE}/announcements/stream`
    : '/api/announcements/stream';

  try {
    const eventSource = new EventSource(endpoint);

    eventSource.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload.type === 'init') {
          if (typeof onInit === 'function') {
            onInit(payload.announcements, payload.events);
          }
        } else if (payload.type === 'new_announcement' && typeof onNewAnnouncement === 'function') {
          onNewAnnouncement(payload.announcement);

          // Trigger browser notification if supported and granted
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(payload.announcement.title, {
              body: payload.announcement.description,
              icon: '/logo192.png',
            });
          }
        } else if (payload.type === 'cluster_event' && typeof onClusterEvent === 'function') {
          onClusterEvent(payload.event);
        }
      } catch (err) {
        console.warn('[SSE Stream error]', err);
      }
    };

    eventSource.onerror = () => {
      // EventSource auto-reconnects by spec
    };

    return () => {
      eventSource.close();
    };
  } catch (_e) {
    return () => {};
  }
};

const getTimeoutSignal = (ms) => {
  if (typeof AbortSignal.timeout === 'function') {
    return AbortSignal.timeout(ms);
  }
  const controller = new AbortController();
  setTimeout(() => controller.abort(), ms);
  return controller.signal;
};

// When no external backend API is configured, use the built-in health API
// served by portal-server.js on the same origin (no CORS, no no-cors hacks).

export const checkServiceHealth = async (service) => {
  const startTime = performance.now();

  try {
    const endpoint = BACKEND_API_BASE
      ? `${BACKEND_API_BASE}/health/${service.key}`   // external backend
      : `/api/health/${service.key}`;                  // built-in same-origin

    const res = await fetch(endpoint, {
      cache: 'no-store',
      signal: getTimeoutSignal(8000), // server-side probes need a bit more time
    });

    const latency = Math.round(performance.now() - startTime);

    if (res.ok) {
      const data = await res.json().catch(() => null);
      const statusStr = (data?.status || '').toLowerCase();

      if (statusStr === 'online' || statusStr === 'ok' || statusStr === 'up') {
        return {
          key: service.key,
          status: 'online',
          label: data?.status || 'Online',
          details: data?.message || service.url,
          latency: data?.latency ?? latency,
        };
      }
    }

    // Health API responded but service is not online
    return {
      key: service.key,
      status: 'offline',
      label: 'Offline',
      details: `Health check returned non-online status`,
      latency: null,
    };
  } catch (error) {
    // Health API itself is unreachable (network error / timeout)
    return {
      key: service.key,
      status: 'offline',
      label: 'Offline',
      details: error.message || 'Health API unreachable',
      latency: null,
    };
  }
};

/**
 * Phase 37 & 38: Unified Cockpit API Client Methods
 */

export const fetchAcademicSummary = async (token) => {
  try {
    const headers = {};
    if (token) headers.Authorization = `Bearer ${token}`;
    const res = await fetch('/api/academic/summary', {
      headers,
      signal: getTimeoutSignal(6000),
      cache: 'no-store'
    });
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('[Academic API error]', err.message);
    return null;
  }
};

export const fetchStorageSummary = async (token) => {
  try {
    const headers = {};
    if (token) headers.Authorization = `Bearer ${token}`;
    const res = await fetch('/api/storage/summary', {
      headers,
      signal: getTimeoutSignal(6000),
      cache: 'no-store'
    });
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('[Storage API error]', err.message);
    return null;
  }
};

export const fetchMediaWatchlist = async () => {
  try {
    const res = await fetch('/api/media/watchlist', {
      signal: getTimeoutSignal(6000),
      cache: 'no-store'
    });
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('[Media API error]', err.message);
    return null;
  }
};

export const fetchVoicemailSummary = async (ext, token) => {
  try {
    const query = ext ? `?ext=${encodeURIComponent(ext)}` : '';
    const headers = {};
    if (token) headers.Authorization = `Bearer ${token}`;
    const res = await fetch(`/api/voicemail/status${query}`, {
      headers,
      signal: getTimeoutSignal(5000),
      cache: 'no-store'
    });
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('[Voicemail API error]', err.message);
    return null;
  }
};

export const fetchClusterEvents = async () => {
  try {
    const res = await fetch('/api/events', {
      signal: getTimeoutSignal(5000),
      cache: 'no-store'
    });
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    const data = await res.json();
    return data.events || [];
  } catch (err) {
    console.warn('[Events API error]', err.message);
    return [];
  }
};

export const dispatchClusterEvent = async (eventData, authOrSecret = '') => {
  try {
    const headers = { 'Content-Type': 'application/json' };
    const authVal = authOrSecret || '';
    if (authVal) {
      if (authVal.startsWith('Bearer ') || authVal.split('.').length === 3) {
        headers['Authorization'] = authVal.startsWith('Bearer ') ? authVal : `Bearer ${authVal}`;
      } else {
        headers['X-Webhook-Secret'] = authVal;
      }
    }
    const res = await fetch('/api/webhooks/event', {
      method: 'POST',
      headers,
      body: JSON.stringify(eventData),
      signal: getTimeoutSignal(5000)
    });
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('[Dispatch Event error]', err.message);
    return null;
  }
};

