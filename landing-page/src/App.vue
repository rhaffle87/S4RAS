<template>
  <div>
    <header class="hdr">
      <div class="wrap hdr-in">
        <a href="/" class="brand" aria-label="S4RAS"><LogoMark />S4RAS</a>
        <nav class="nav" aria-label="Utama">
          <a href="#layanan">{{ t('nav.services') }}</a>
          <a href="#arsitektur">{{ t('nav.arch') }}</a>
          <a href="#faq">FAQ</a>
        </nav>
        <div class="tools">
          <button class="chip tool-desktop" @click="setLang(lang === 'id' ? 'en' : 'id')" :aria-label="lang === 'id' ? 'Switch to English' : 'Ganti ke Bahasa Indonesia'">{{ lang.toUpperCase() }}</button>
          <button class="chip tool-desktop" @click="toggleTheme" :aria-label="isDark ? t('theme.light') : t('theme.dark')">{{ isDark ? t('theme.light') : t('theme.dark') }}</button>
          <a class="btn tool-desktop" href="https://portal.s4ras.site/home">{{ t('cta.portal') }}</a>
          <button class="chip btn-menu" @click="menuOpen = !menuOpen" :aria-expanded="menuOpen" :aria-label="t('menu')">{{ t('menu') }}</button>
        </div>
      </div>
    </header>

    <Transition name="menu">
      <div v-if="menuOpen" class="menu" role="dialog" aria-modal="true" :aria-label="t('menu')">
        <div class="menu-top">
          <span class="brand"><LogoMark />S4RAS</span>
          <button class="chip btn-close" ref="menuClose" @click="menuOpen = false" :aria-label="t('close')">{{ t('close') }}</button>
        </div>
        <nav>
          <a href="#layanan" @click="menuOpen = false">{{ t('nav.services') }}</a>
          <a href="#arsitektur" @click="menuOpen = false">{{ t('nav.arch') }}</a>
          <a href="#faq" @click="menuOpen = false">FAQ</a>
          <a href="https://portal.s4ras.site/home" @click="menuOpen = false">{{ t('cta.portal') }}</a>
        </nav>
        <div class="menu-tools">
          <button class="chip" @click="setLang(lang === 'id' ? 'en' : 'id')" :aria-label="lang === 'id' ? 'Switch to English' : 'Ganti ke Bahasa Indonesia'">{{ lang.toUpperCase() }}</button>
          <button class="chip" @click="toggleTheme" :aria-label="isDark ? t('theme.light') : t('theme.dark')">{{ isDark ? t('theme.light') : t('theme.dark') }}</button>
        </div>
        <div class="menu-foot">Solution for Remote Area Services</div>
      </div>
    </Transition>

    <main>
      <section class="hero" id="tentang">
        <div class="hero-grid" ref="gridEl" aria-hidden="true"></div>
        <div class="hero-ambient" aria-hidden="true">
          <span class="amb-dot" v-for="i in 6" :key="i"></span>
        </div>
        <div class="wrap hero-body">
          <div>
            <h1>
              <span class="line"><span class="line-in">{{ t('hero.l1') }}</span></span>
              <span class="line"><span class="line-in">{{ t('hero.l2') }}</span></span>
            </h1>
            <p class="lead hero-fade">{{ t('hero.lead') }}</p>
            <div class="cta hero-fade">
              <a class="btn" href="https://portal.s4ras.site/home">{{ t('cta.portal') }}</a>
              <a class="btn btn-ghost" href="#arsitektur">{{ t('cta.arch') }}</a>
            </div>
          </div>
          <div class="hero-asset hero-fade" role="img" :aria-label="t('topo.alt')">
            <svg viewBox="-8 -8 116 116" ref="topoEl">
              <circle class="topo-ring" cx="50" cy="50" r="38" />
              <g class="topo-spoke" v-for="n in topoNodes" :key="n.name">
                <line class="topo-link" x1="50" y1="50" :x2="n.x" :y2="n.y" />
                <line class="topo-flow" x1="50" y1="50" :x2="n.x" :y2="n.y" />
                <circle class="topo-node-c" :cx="n.x" :cy="n.y" r="6.5" />
                <text class="topo-label" text-anchor="middle" :x="n.x" :y="n.ly">{{ n.name }}</text>
              </g>
              <g class="topo-hub"><circle cx="50" cy="50" r="8.5" /></g>
              <text class="topo-label topo-hub-label" text-anchor="middle" x="50" y="51.6" fill="#fff" font-weight="600">SSO</text>
            </svg>
          </div>
        </div>
      </section>

      <section class="sec" style="padding-top:0">
        <div class="wrap">
          <div class="rule" data-rule></div>
          <div class="metrics">
            <div class="metric" v-for="m in metrics" :key="m.label.id">
              <b class="mono" :data-to="m.to" :data-dec="m.dec || 0" :data-suffix="m.suffix || ''">{{ m.fallback }}</b>
              <span>{{ m.label[lang] }}</span>
            </div>
          </div>
          <div class="rule" data-rule></div>
        </div>
      </section>

      <section class="sec" style="padding-top:1rem">
        <div class="wrap">
          <p class="stmt" :aria-label="t('stmt')"><span v-for="(w, i) in words" :key="lang + i" class="stmt-w" aria-hidden="true">{{ w }}</span></p>
        </div>
      </section>

      <section class="sec" id="layanan" style="padding-top:2rem">
        <div class="wrap">
          <div class="sec-h">
            <h2>{{ t('svc.title') }}</h2>
            <p>{{ t('svc.sub') }}</p>
          </div>
          <a v-for="s in services" :key="s.name" class="row" :href="s.url" target="_blank" rel="noreferrer" @mousemove="glow">
            <span class="row-icon" aria-hidden="true" v-html="s.icon"></span>
            <h3>{{ s.name }}</h3>
            <p>{{ s.desc[lang] }}</p>
            <span class="host mono">{{ s.host }}</span>
          </a>
        </div>
      </section>

      <section class="sec" id="arsitektur" style="padding-top:2rem">
        <div class="wrap">
          <div class="sec-h">
            <h2>{{ t('arch.title') }}</h2>
            <p>{{ t('arch.sub') }}</p>
          </div>
          <div class="chips" role="group" :aria-label="t('arch.title')">
            <button v-for="f in filters" :key="f" class="chip" :class="{ on: tier === f }" :aria-pressed="tier === f" @click="tier = f">{{ t('f.' + f) }}</button>
          </div>
          <TransitionGroup name="vm" tag="div" class="vm-grid">
            <div class="vm" v-for="v in shown" :key="v.n" @mousemove="glow">
              <div>
                <b class="mono">{{ v.n }}</b>
                <h4>{{ v.name }}</h4>
                <p>{{ v.role[lang] }}</p>
              </div>
              <small class="mono">192.168.10.{{ v.n }}</small>
            </div>
          </TransitionGroup>
        </div>
      </section>

      <section class="sec" id="faq" style="padding-top:2rem">
        <div class="wrap">
          <div class="sec-h"><h2>{{ t('faq.title') }}</h2></div>
          <div class="faq-item" v-for="(f, i) in faqs" :key="i">
            <button class="faq-q" :aria-expanded="openFaq === i" @click="openFaq = openFaq === i ? -1 : i">
              {{ f.q[lang] }}
              <span class="plus">+</span>
            </button>
            <div class="faq-panel" :class="{ open: openFaq === i }">
              <div class="faq-panel-inner"><p>{{ f.a[lang] }}</p></div>
            </div>
          </div>
        </div>
      </section>
    </main>

    <footer class="ftr">
      <div class="wrap">
        <div class="ftr-cta">
          <div>
            <div class="ftr-brand"><LogoMark />S4RAS</div>
            <h2>{{ t('ftr.cta') }}</h2>
          </div>
          <a class="btn" href="https://portal.s4ras.site/home">{{ t('cta.portal') }}</a>
        </div>
        <div class="ftr-grid">
          <div>
            <h5>{{ t('ftr.services') }}</h5>
            <ul><li v-for="s in services" :key="s.name"><a :href="s.url" target="_blank" rel="noreferrer">{{ s.name }}</a></li></ul>
          </div>
          <div>
            <h5>{{ t('ftr.links') }}</h5>
            <ul>
              <li><a href="https://portal.s4ras.site" target="_blank" rel="noreferrer">Portal</a></li>
              <li><a href="https://monitor.s4ras.site" target="_blank" rel="noreferrer">Grafana Monitor</a></li>
              <li><a href="https://portal.s4ras.site/benchmark/" target="_blank" rel="noreferrer">{{ t('ftr.bench') }}</a></li>
              <li><a href="https://www.its.ac.id" target="_blank" rel="noreferrer">ITS Surabaya</a></li>
            </ul>
          </div>
          <div>
            <h5>{{ t('ftr.lab') }}</h5>
            <p>{{ t('ftr.about') }}</p>
          </div>
        </div>
      </div>
      <div class="ftr-mark" aria-hidden="true">S4RAS</div>
      <div class="wrap ftr-bar">
        <span>&copy; 2025&ndash;2026 Institut Teknologi Sepuluh Nopember</span>
        <span>Solution for Remote Area Services</span>
        <a href="#tentang">{{ t('ftr.top') }}</a>
      </div>
    </footer>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue';
import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import LogoMark from './components/LogoMark.vue';

const isDark = ref(localStorage.getItem('saras-theme') !== 'light');
const lang = ref(localStorage.getItem('saras-lang') || 'id');
const gridEl = ref(null);
const topoEl = ref(null);
const openFaq = ref(0);

const applyTheme = () => {
  document.documentElement.classList.toggle('dark', isDark.value);
  document.documentElement.classList.toggle('light', !isDark.value);
};
const toggleTheme = () => {
  isDark.value = !isDark.value;
  localStorage.setItem('saras-theme', isDark.value ? 'dark' : 'light');
  applyTheme();
};
const setLang = (l) => { lang.value = l; localStorage.setItem('saras-lang', l); document.documentElement.lang = l; };

const dict = {
  id: {
    'nav.services': 'Layanan', 'nav.arch': 'Arsitektur',
    'theme.light': 'Terang', 'theme.dark': 'Gelap',
    'cta.portal': 'Masuk ke portal', 'cta.arch': 'Lihat arsitektur',
    'hero.l1': 'Edukasi yang tetap', 'hero.l2': 'menyala di 3T.',
    'hero.lead': 'S4RAS adalah server lokal untuk daerah 3T Indonesia — LMS, VoIP, dan IPTV edukasi, tanpa bergantung internet stabil.',
    'topo.alt': 'Diagram topologi: layanan terhubung lewat satu identitas SSO',
    'ledger.title': 'Layanan kluster',
    'svc.title': 'Semua Layanan, 1 Akun', 'svc.sub': 'Semua layanan masuk lewat Keycloak SSO dan berjalan sebagai mesin virtual terpisah di server Proxmox.',
    'arch.title': 'Tiga lapis jaringan', 'arch.sub': 'Lalu lintas masuk lewat gerbang terenkripsi, dilayani oleh mesin virtual layanan, lalu dipantau dari lapis telemetri.',
    'faq.title': 'Pertanyaan umum',
    'menu': 'Menu', 'close': 'Tutup', 'f.all': 'Semua', 'f.edge': 'Gerbang', 'f.svc': 'Layanan', 'f.ops': 'Telemetri',
    'stmt': 'S4RAS dirancang agar pendidikan, komunikasi, dan hiburan tetap berjalan di daerah yang jaringannya terbatas — lewat server lokal yang tidak bergantung pada internet.',
    'ftr.cta': 'Satu akun untuk semua layanan.', 'ftr.lab': 'Pengembang', 'ftr.bench': 'Laporan uji beban',
    'ftr.about': 'B-301 Telecommunication Network Laboratory, Teknik Elektro FT-EIC ITS. Pengembang S4RAS — solusi edutainment server lokal untuk daerah 3T Indonesia.',
    'ftr.services': 'Layanan', 'ftr.links': 'Tautan', 'ftr.status': 'Status kluster', 'ftr.top': 'Kembali ke atas'
  },
  en: {
    'nav.services': 'Services', 'nav.arch': 'Architecture',
    'theme.light': 'Light', 'theme.dark': 'Dark',
    'cta.portal': 'Open portal', 'cta.arch': 'See architecture',
    'hero.l1': 'Education that keeps', 'hero.l2': 'running in 3T.',
    'hero.lead': 'S4RAS is a local server for Indonesia\'s 3T regions — LMS, VoIP, and educational IPTV, without needing stable internet.',
    'topo.alt': 'Topology diagram: services connected through one SSO identity',
    'ledger.title': 'Cluster services',
    'svc.title': 'All Services, 1 Account', 'svc.sub': 'Every service signs in through Keycloak SSO and runs as its own virtual machine on a Proxmox server.',
    'arch.title': 'Three network layers', 'arch.sub': 'Traffic enters through an encrypted gateway, is served by service VMs, and is watched from the telemetry layer.',
    'faq.title': 'Common questions',
    'menu': 'Menu', 'close': 'Close', 'f.all': 'All', 'f.edge': 'Gateway', 'f.svc': 'Services', 'f.ops': 'Telemetry',
    'stmt': 'S4RAS is designed to keep education, communication, and entertainment running where networks are limited — through a local server that does not depend on the internet.',
    'ftr.cta': 'One account for every service.', 'ftr.lab': 'Developed by', 'ftr.bench': 'Load test reports',
    'ftr.about': 'B-301 Telecommunication Network Laboratory, Electrical Engineering FT-EIC ITS. Developer of S4RAS — a local-server edutainment solution for Indonesia\'s 3T regions.',
    'ftr.services': 'Services', 'ftr.links': 'Links', 'ftr.status': 'Cluster status', 'ftr.top': 'Back to top'
  }
};
const t = (k) => dict[lang.value]?.[k] ?? dict.id[k] ?? k;

// Subtle SVG icons per service — rendered as background watermark on hover
const ICONS = {
  moodle: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>`,
  cloud:  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2"><path d="M17.5 19H9a5 5 0 1 1 .92-9.91A7 7 0 1 1 17.5 19z"/></svg>`,
  voip:   `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2A19.79 19.79 0 0 1 3.09 4.18 2 2 0 0 1 5.07 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L9.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>`,
  iptv:   `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 3 8 7M8 3l8 4"/></svg>`,
  sso:    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2"><circle cx="12" cy="8" r="4"/><path d="M20 21a8 8 0 1 0-16 0"/><path d="M12 12v4M10 14h4"/></svg>`,
};

const services = [
  { name: 'Moodle LMS',   vm: 'VM 203', host: 'moodle.s4ras.site', url: 'https://moodle.s4ras.site', icon: ICONS.moodle,
    desc: { id: 'Bahan ajar digital SD, SMP, SMA, serta modul pelatihan pertanian, peternakan, dan industri kecil.', en: 'Digital learning for schools, plus agricultural, livestock, and vocational community modules.' } },
  { name: 'Nextcloud SAN', vm: 'VM 207', host: 'cloud.s4ras.site',  url: 'https://cloud.s4ras.site',  icon: ICONS.cloud,
    desc: { id: 'Penyimpanan awan mandiri untuk materi ajar, dokumen warga, dan pencadangan data lokal.', en: 'Standalone local cloud storage for learning assets, community documents, and local backups.' } },
  { name: 'Asterisk VoIP', vm: 'VM 202', host: 'voip.s4ras.site',   url: 'https://voip.s4ras.site',   icon: ICONS.voip,
    desc: { id: 'Telekomunikasi suara, video, dan pesan lokal berbasis IP untuk daerah minim sinyal seluler.', en: 'Local IP voice, video, and messaging communication for areas with limited cellular coverage.' } },
  { name: 'Jellyfin IPTV', vm: 'VM 200', host: 'iptv.s4ras.site',   url: 'https://iptv.s4ras.site',   icon: ICONS.iptv,
    desc: { id: 'Siaran video edukatif dan hiburan (edutainment) lokal tanpa bergantung pada internet.', en: 'Local educational video and entertainment (edutainment) broadcasting without internet dependence.' } },
  { name: 'Keycloak SSO',  vm: 'VM 206', host: 'sso.s4ras.site',    url: 'https://sso.s4ras.site',    icon: ICONS.sso,
    desc: { id: 'Satu identitas untuk semua layanan warga dan sekolah, memakai OpenID Connect dan PKCE.', en: 'One identity for all community and school services, using OpenID Connect and PKCE.' } },
];

const metrics = [
  { to: 10, fallback: '10', label: { id: 'Mesin virtual terisolasi (VM 200–209)', en: 'Isolated virtual machines (VM 200–209)' } },
  { to: 13, fallback: '13', label: { id: 'Subdomain publik lewat Cloudflare Tunnel', en: 'Public subdomains via Cloudflare Tunnel' } },
  { to: 5000, fallback: '5.000', label: { id: 'Permintaan token SSO tanpa error pada uji 500 thread', en: 'SSO token requests with zero errors at 500 threads' } },
  { to: 1, suffix: ' Gbps', fallback: '1 Gbps', label: { id: 'Bandwidth LAN antar-node', en: 'LAN bandwidth between nodes' } }
];

const vms = [
  { n: '208', tier: 'edge', name: 'Portal',      role: { id: 'Portal React, Express BFF, Cloudflare Tunnel', en: 'React portal, Express BFF, Cloudflare Tunnel' } },
  { n: '206', tier: 'svc',  name: 'Keycloak',    role: { id: 'SSO OpenID Connect dan PostgreSQL 16', en: 'OpenID Connect SSO and PostgreSQL 16' } },
  { n: '203', tier: 'svc',  name: 'Moodle',      role: { id: 'LMS 4.5, PostgreSQL 15, Gotenberg', en: 'LMS 4.5, PostgreSQL 15, Gotenberg' } },
  { n: '207', tier: 'svc',  name: 'Nextcloud',   role: { id: 'Penyimpanan, Collabora CODE, MariaDB', en: 'Storage, Collabora CODE, MariaDB' } },
  { n: '202', tier: 'svc',  name: 'Asterisk 22', role: { id: 'PBX WebRTC dan CoTURN', en: 'WebRTC PBX and CoTURN' } },
  { n: '201', tier: 'svc',  name: 'Asterisk 20', role: { id: 'PBX cadangan dan trunk antar-PBX', en: 'Standby PBX and inter-PBX trunk' } },
  { n: '200', tier: 'svc',  name: 'Jellyfin',    role: { id: 'Jellyfin, Dispatcharr, Jellyseerr', en: 'Jellyfin, Dispatcharr, Jellyseerr' } },
  { n: '204', tier: 'ops',  name: 'Prometheus',  role: { id: 'Prometheus, Grafana, Loki, Alertmanager', en: 'Prometheus, Grafana, Loki, Alertmanager' } },
  { n: '209', tier: 'ops',  name: 'JMeter',      role: { id: 'Uji beban JMeter dan SIPp', en: 'JMeter and SIPp load testing' } },
  { n: '205', tier: 'ops',  name: 'Workstation', role: { id: 'Klien softphone untuk uji telepon', en: 'Softphone client for call testing' } },
];
const topoNodes = [
  { name: 'Moodle',    x: 50, y: 12, ly: 0.5 },
  { name: 'Nextcloud', x: 88, y: 50, ly: 61.5 },
  { name: 'Asterisk',  x: 50, y: 88, ly: 99.5 },
  { name: 'Jellyfin',  x: 12, y: 50, ly: 61.5 },
];
const filters = ['all', 'edge', 'svc', 'ops'];
const tier = ref('all');
const shown = computed(() => (tier.value === 'all' ? vms : vms.filter((v) => v.tier === tier.value)));
const words = computed(() => t('stmt').split(' '));
const menuOpen = ref(false);
const menuClose = ref(null);

const faqs = [
  { q: { id: 'Apa itu S4RAS?', en: 'What is S4RAS?' },
    a: { id: 'S4RAS adalah sistem edutainment berbasis server lokal untuk daerah 3T Indonesia: LMS (SD–SMA dan vokasi), VoIP, dan IPTV edukasi — tanpa bergantung internet stabil. Dikembangkan oleh TNL Lab, Teknik Elektro ITS.', en: 'S4RAS is a local-server edutainment system for Indonesia\'s 3T regions: LMS (K–12 and vocational), VoIP, and educational IPTV — without needing stable internet. Developed by TNL Lab, Electrical Engineering ITS.' } },
  { q: { id: 'Di mana data disimpan?', en: 'Where is data stored?' },
    a: { id: 'Database dan berkas berada di mesin virtual pada klaster Proxmox milik sendiri. Cloudflare Tunnel hanya meneruskan lalu lintas publik ke layanan tersebut.', en: 'Databases and files live on VMs in our own Proxmox cluster. Cloudflare Tunnel only forwards public traffic to those services.' } },
  { q: { id: 'Bagaimana cara masuk?', en: 'How do I sign in?' },
    a: { id: 'Gunakan satu akun Keycloak. Setelah masuk di portal, semua layanan terbuka tanpa login ulang.', en: 'Use one Keycloak account. Sign in once at the portal and all services open without re-entering credentials.' } },
  { q: { id: 'Bagaimana telepon melewati firewall?', en: 'How do calls pass through firewalls?' },
    a: { id: 'Asterisk 22 memakai WebRTC dengan WSS, dan CoTURN pada port 3478/5349 untuk melintasi NAT.', en: 'Asterisk 22 uses WebRTC over WSS, with CoTURN on ports 3478/5349 for NAT traversal.' } },
  { q: { id: 'Berapa kapasitas pengguna bersamaan di Moodle?', en: 'How many concurrent users can Moodle handle?' },
    a: { id: 'Pengujian JMeter menunjukkan 25 pengguna bersamaan berjalan stabil. Pada 50 pengguna, CPU VM LMS menjadi bottleneck (~100%), sementara memori dan disk tetap stabil. Upgrade CPU VM direkomendasikan sebelum deployment kelas besar.', en: 'JMeter tests show 25 concurrent users run stably. At 50 users, the LMS VM CPU becomes the bottleneck (~100%), while memory and disk stay stable. A CPU upgrade is recommended before large-class deployments.' } },
  { q: { id: 'Bagaimana S4RAS dipantau?', en: 'How is S4RAS monitored?' },
    a: { id: 'Prometheus + Grafana di VM 204 memantau semua VM secara real-time. Node Exporter mengekspos metrik CPU/memori/disk; Blackbox Exporter menguji ketersediaan layanan dari luar. Alert dikirim ke bot Telegram jika ambang batas terlampaui. Dashboard: monitor.s4ras.site.', en: 'Prometheus + Grafana on VM 204 monitor all VMs in real-time. Node Exporter exposes CPU/memory/disk metrics; Blackbox Exporter probes service availability externally. Alerts fire to a Telegram bot when thresholds are crossed. Dashboard: monitor.s4ras.site.' } },
];

const glow = (e) => {
  const r = e.currentTarget.getBoundingClientRect();
  e.currentTarget.style.setProperty('--mx', `${e.clientX - r.left}px`);
  e.currentTarget.style.setProperty('--my', `${e.clientY - r.top}px`);
};

let lenis = null;
let ctx = null;

const bindStatement = () => {
  const ws = gsap.utils.toArray('.stmt-w');
  if (!ws.length) return;
  gsap.set(ws, { opacity: 0.18 });
  gsap.to(ws, { opacity: 1, stagger: 0.1, ease: 'none', scrollTrigger: { trigger: '.stmt', start: 'top 78%', end: 'bottom 45%', scrub: true } });
};

const onKeydown = (e) => {
  if (e.key === 'Escape' && menuOpen.value) {
    menuOpen.value = false;
  }
};

watch(menuOpen, (open) => {
  if (open) {
    lenis?.stop();
    window.addEventListener('keydown', onKeydown);
    nextTick(() => menuClose.value?.focus());
  } else {
    lenis?.start();
    window.removeEventListener('keydown', onKeydown);
  }
});
watch(lang, () => nextTick(() => ctx?.add(bindStatement)));

onMounted(() => {
  applyTheme();
  document.documentElement.lang = lang.value;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  gsap.registerPlugin(ScrollTrigger);
  lenis = new Lenis({ duration: 1.15, easing: (x) => Math.min(1, 1.001 - Math.pow(2, -10 * x)), smoothWheel: true });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);

  ctx = gsap.context(() => {
    gsap.timeline({ defaults: { ease: 'power4.out' } })
      .from('.line-in', { yPercent: 110, duration: 1.1, stagger: 0.12 })
      .from('.hero-fade', { opacity: 0, y: 14, duration: 0.8, stagger: 0.1 }, '-=0.6');

    gsap.from('.topo-ring', { scale: 0, opacity: 0, duration: .8, ease: 'back.out(1.4)', transformOrigin: '50% 50%', delay: .3 });
    gsap.from('.topo-link, .topo-flow', { scaleX: 0, opacity: 0, duration: .6, stagger: .08, delay: .6 });
    gsap.from('.topo-node-c, .topo-hub', { scale: 0, opacity: 0, duration: .5, stagger: .06, ease: 'back.out(2)', transformOrigin: '50% 50%', delay: .9 });

    gsap.to(gridEl.value, { yPercent: 18, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });

    gsap.utils.toArray('[data-rule]').forEach((el) =>
      gsap.from(el, { scaleX: 0, duration: 1.2, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 90%' } }));
    gsap.utils.toArray('[data-link]').forEach((el) =>
      gsap.from(el, { scaleY: 0, duration: 0.7, ease: 'power2.out', scrollTrigger: { trigger: el, start: 'top 92%' } }));

    gsap.from('.ftr-mark', { yPercent: 35, opacity: 0, duration: 1.4, ease: 'power4.out', scrollTrigger: { trigger: '.ftr', start: 'top 70%' } });

    bindStatement();

    gsap.utils.toArray('[data-to]').forEach((el) => {
      const to = Number(el.dataset.to), dec = Number(el.dataset.dec), suffix = el.dataset.suffix;
      const o = { v: 0 };
      const fmt = (v) => v.toLocaleString('id-ID', { minimumFractionDigits: dec, maximumFractionDigits: dec }) + suffix;
      gsap.to(o, { v: to, duration: 1.6, ease: 'power2.out', onUpdate: () => { el.textContent = fmt(o.v); }, scrollTrigger: { trigger: el, start: 'top 90%', once: true } });
    });
  });
});

onUnmounted(() => {
  ctx?.revert();
  lenis?.destroy();
});
</script>
