// Beranda — Home Dashboard (Aligned with myITS Layout & S4RAS Aesthetic)
import { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  ExternalLink,
  ChevronRight,
  ChevronLeft,
  User,
  Activity,
  Calendar as CalendarIcon,
  GraduationCap,
  KeyRound,
  Cloud,
  Tv,
  Radio,
  Film,
  Phone,
  BarChart3,
  ShieldCheck,
  Search,
  ChevronDown,
  ChevronUp,
  Edit3,
  Megaphone,
  X,
  Check,
  Terminal,
  BookOpen,
  Wifi
} from 'lucide-react';
import Layout from '../components/Layout';
import SkeletonCard from '../components/SkeletonCard';
import services from '../config/services';
import { fetchAnnouncements } from '../services/backend';
import { useKeycloak } from '../context/KeycloakContext';
import { useThemeLanguage } from '../context/ThemeLanguageContext';

const ServiceIcon = ({ iconName, size = 20, className }) => {
  const IconComponent = {
    GraduationCap,
    KeyRound,
    Cloud,
    Tv,
    Radio,
    Film,
    Phone,
    BarChart3,
    ShieldCheck,
    Activity,
    Wifi,
    BookOpen
  }[iconName] || Activity;

  return <IconComponent size={size} className={className} />;
};

// Application Categories matching actual deployed services in services.js
const APP_CATEGORIES = [
  {
    id: 'akademis',
    title: 'Akademik & Otentikasi',
    title_en: 'Academics & Authentication',
    items: [
      {
        key: 'moodle',
        title: 'Moodle LMS',
        desc: 'Platform pembelajaran daring untuk materi, silabus, dan tugas kuliah',
        icon: 'GraduationCap',
        url: 'https://moodle.s4ras.site/auth/oidc/',
        color: 'from-rose-500/20 to-red-600/20',
        iconColor: 'text-rose-400'
      },
      {
        key: 'sso',
        title: 'SSO Keycloak',
        desc: 'Otentikasi terpusat, profil civitas, dan manajemen keamanan MFA',
        icon: 'KeyRound',
        url: 'https://sso.s4ras.site/realms/S4RAS/account/',
        color: 'from-amber-500/20 to-orange-600/20',
        iconColor: 'text-amber-400'
      }
    ]
  },
  {
    id: 'penyimpanan',
    title: 'Penyimpanan Berkas',
    title_en: 'Cloud Storage & Documents',
    items: [
      {
        key: 'cloud',
        title: 'Nextcloud SAN',
        desc: 'Penyimpanan awan terpusat, sinkronisasi file, dan WebDAV enterprise',
        icon: 'Cloud',
        url: 'https://cloud.s4ras.site/apps/user_oidc/login/1',
        color: 'from-rose-500/20 to-red-600/20',
        iconColor: 'text-rose-400'
      }
    ]
  },
  {
    id: 'multimedia',
    title: 'Multimedia & IPTV',
    title_en: 'Multimedia & Streaming',
    items: [
      {
        key: 'iptv',
        title: 'Jellyfin IPTV',
        desc: 'Layanan IPTV untuk siaran langsung dan katalog video pembelajaran',
        icon: 'Tv',
        url: 'https://iptv.s4ras.site',
        color: 'from-brand/15 to-neutral-bg3',
        iconColor: 'text-brand-light'
      },
      {
        key: 'dispatcharr',
        title: 'Dispatcharr IPTV',
        desc: 'Manajemen channel TV, panduan jadwal siaran EPG, dan proxy multimedia',
        icon: 'Radio',
        url: 'https://dispatcharr.s4ras.site',
        color: 'from-brand/15 to-neutral-bg3',
        iconColor: 'text-brand-light'
      },
      {
        key: 'jellyseerr',
        title: 'Media Request',
        desc: 'Portal permohonan serial, dokumenter, dan film edukasi',
        icon: 'Film',
        url: 'https://request.s4ras.site',
        color: 'from-rose-500/20 to-red-600/20',
        iconColor: 'text-rose-400'
      }
    ]
  },
  {
    id: 'telekomunikasi',
    title: 'Telekomunikasi',
    title_en: 'Telecommunications',
    items: [
      {
        key: 'voip',
        title: 'Telefoni VoIP',
        desc: 'Layanan telepon berbasis IP PJSIP dan in-browser WebPhone civitas',
        icon: 'Phone',
        url: 'https://voip.s4ras.site',
        action: 'open-phone',
        color: 'from-emerald-500/20 to-teal-600/20',
        iconColor: 'text-emerald-400'
      }
    ]
  },
  {
    id: 'observabilitas',
    title: 'Observabilitas & Uptime',
    title_en: 'Observability & Systems',
    items: [
      {
        key: 'monitor',
        title: 'Monitoring Grafana',
        desc: 'Dashboard telemetri infrastruktur kluster dan metrik server real-time',
        icon: 'BarChart3',
        url: 'https://monitor.s4ras.site',
        color: 'from-amber-500/20 to-yellow-600/20',
        iconColor: 'text-amber-400'
      },
      {
        key: 'status',
        title: 'Status Layanan',
        desc: 'Status page uptime real-time dan notifikasi insiden layanan',
        icon: 'ShieldCheck',
        url: 'https://status.s4ras.site',
        color: 'from-emerald-500/20 to-green-600/20',
        iconColor: 'text-emerald-400'
      },
      {
        key: 'benchmark',
        title: 'Benchmark Reports',
        desc: 'Laporan visual uji beban Apache JMeter dan analisis throughput',
        icon: 'Activity',
        url: '/benchmark/',
        color: 'from-rose-500/20 to-red-600/20',
        iconColor: 'text-rose-400'
      }
    ]
  }
];

const ALL_SERVICES_MAP = {
  status: {
    key: 'status',
    title: 'Akses Internet & Status',
    title_en: 'Internet & Service Status',
    subtitle: 'Uptime & Jaringan Kampus',
    subtitle_en: 'Uptime & Campus Network',
    icon: 'Wifi',
    url: 'https://status.s4ras.site',
    gradient: 'from-rose-700 to-red-500',
    color: 'from-rose-500/20 to-red-600/20',
    iconColor: 'text-rose-400'
  },
  moodle: {
    key: 'moodle',
    title: 'Moodle LMS',
    title_en: 'Moodle LMS',
    subtitle: 'Kelas Pembelajaran Daring',
    subtitle_en: 'Online Learning Classes',
    icon: 'GraduationCap',
    url: 'https://moodle.s4ras.site/auth/oidc/',
    gradient: 'from-red-600 to-rose-500',
    color: 'from-rose-500/20 to-red-600/20',
    iconColor: 'text-rose-400'
  },
  sso: {
    key: 'sso',
    title: 'SSO Keycloak',
    title_en: 'SSO Keycloak',
    subtitle: 'Akun & Otentikasi Sivitas',
    subtitle_en: 'Account & Central Auth',
    icon: 'KeyRound',
    url: 'https://sso.s4ras.site/realms/S4RAS/account/',
    gradient: 'from-red-700 to-rose-600',
    color: 'from-rose-500/20 to-red-600/20',
    iconColor: 'text-rose-400'
  },
  cloud: {
    key: 'cloud',
    title: 'Nextcloud SAN',
    title_en: 'Nextcloud SAN',
    subtitle: 'Penyimpanan Berkas Kampus',
    subtitle_en: 'Campus Storage & Drive',
    icon: 'Cloud',
    url: 'https://cloud.s4ras.site/apps/user_oidc/login/1',
    gradient: 'from-rose-800 to-red-600',
    color: 'from-rose-500/20 to-red-600/20',
    iconColor: 'text-rose-400'
  },
  iptv: {
    key: 'iptv',
    title: 'Jellyfin IPTV',
    title_en: 'Jellyfin IPTV',
    subtitle: 'Streaming Multimedia Edukasi',
    subtitle_en: 'Campus Media Streaming',
    icon: 'Tv',
    url: 'https://iptv.s4ras.site',
    gradient: 'from-red-600 to-rose-700',
    color: 'from-rose-500/20 to-red-600/20',
    iconColor: 'text-rose-400'
  },
  dispatcharr: {
    key: 'dispatcharr',
    title: 'Dispatcharr IPTV',
    title_en: 'Dispatcharr IPTV',
    subtitle: 'Channel TV & EPG Proxy',
    subtitle_en: 'TV Channels & EPG Proxy',
    icon: 'Radio',
    url: 'https://dispatcharr.s4ras.site',
    gradient: 'from-rose-600 to-red-600',
    color: 'from-rose-500/20 to-red-600/20',
    iconColor: 'text-rose-400'
  },
  jellyseerr: {
    key: 'jellyseerr',
    title: 'Media Request',
    title_en: 'Media Request',
    subtitle: 'Permohonan Video & Materi',
    subtitle_en: 'Video Content Requests',
    icon: 'Film',
    url: 'https://request.s4ras.site',
    gradient: 'from-rose-700 to-red-500',
    color: 'from-rose-500/20 to-red-600/20',
    iconColor: 'text-rose-400'
  },
  voip: {
    key: 'voip',
    title: 'Telefoni VoIP',
    title_en: 'VoIP Telephony',
    subtitle: 'WebPhone Sivitas & PJSIP',
    subtitle_en: 'Campus WebPhone & PJSIP',
    icon: 'Phone',
    url: 'https://voip.s4ras.site',
    action: 'open-phone',
    gradient: 'from-red-700 to-rose-600',
    color: 'from-rose-500/20 to-red-600/20',
    iconColor: 'text-rose-400'
  },
  monitor: {
    key: 'monitor',
    title: 'Monitoring Grafana',
    title_en: 'Grafana Metrics',
    subtitle: 'Telemetri Klaster 10 Node',
    subtitle_en: '10-Node Cluster Telemetry',
    icon: 'BarChart3',
    url: 'https://monitor.s4ras.site',
    gradient: 'from-rose-600 to-red-700',
    color: 'from-rose-500/20 to-red-600/20',
    iconColor: 'text-rose-400'
  },
  benchmark: {
    key: 'benchmark',
    title: 'Benchmark Reports',
    title_en: 'Benchmark Reports',
    subtitle: 'Uji Beban Apache JMeter',
    subtitle_en: 'Apache JMeter Load Tests',
    icon: 'Activity',
    url: '/benchmark/',
    gradient: 'from-rose-800 to-red-600',
    color: 'from-rose-500/20 to-red-600/20',
    iconColor: 'text-rose-400'
  }
};

const DEFAULT_FAVORITE_KEYS = ['status', 'moodle', 'sso', 'cloud', 'voip'];
const FAVORITES_STORAGE_KEY = 's4ras_favorite_apps';

// Carousel Hero Slides with Subtle Modern Gradient Backgrounds & Fading Themed Imagery (6 Slides)
const HERO_SLIDES = [
  {
    id: 'welcome',
    type: 'welcome',
    badge: 'Portal Sivitas',
    badge_en: 'Campus Portal',
    accentColor: '#ef4444',
    bgImage: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?q=80&w=1600&auto=format&fit=crop',
    bgStyle: 'linear-gradient(135deg, #180a0e 0%, #0f1117 50%, #0a0c10 100%)'
  },
  {
    id: 'recruitment',
    type: 'content',
    badge: 'Open Recruitment',
    badge_en: 'Open Recruitment',
    title: 'S4RAS Global Engagement',
    subtitle: 'Season 17 Research Fellowship riset komputasi terdistribusi dan cloud kampus untuk mahasiswa aktif.',
    subtitle_en: 'Season 17 Research Fellowship in distributed computing and campus cloud for active students.',
    date: '20 — 30 Oktober 2026',
    ctaText: 'Informasi Lengkap',
    ctaText_en: 'Learn More',
    url: 'https://portal.s4ras.site/pengumuman',
    bgImage: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=1600&auto=format&fit=crop',
    bgStyle: 'linear-gradient(135deg, #180d14 0%, #0f1117 50%, #0a0c10 100%)',
    accentColor: '#f43f5e'
  },
  {
    id: 'seminar',
    type: 'content',
    badge: 'Pelatihan Teknis',
    badge_en: 'Technical Training',
    title: 'EPTA Embedded Systems',
    subtitle: 'Workshop komputasi sistem tertanam, administrasi Linux, dan WebRTC SIP telephony berbobot SKPI.',
    subtitle_en: 'Hands-on workshop on embedded computing, Linux administration, and WebRTC SIP telephony with SKPI credits.',
    date: '02 — 05 November 2026',
    ctaText: 'Detail Pelatihan',
    ctaText_en: 'Training Details',
    url: 'https://portal.s4ras.site/pengumuman',
    bgImage: 'https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=1600&auto=format&fit=crop',
    bgStyle: 'linear-gradient(135deg, #19120a 0%, #0f1117 50%, #0a0c10 100%)',
    accentColor: '#f59e0b'
  },
  {
    id: 'cloud_collab',
    type: 'content',
    badge: 'Penyimpanan Berkas',
    badge_en: 'Cloud Storage & SAN',
    title: 'Nextcloud & Collabora Online',
    subtitle: 'Penyimpanan awan terpusat mandiri dan penyuntingan dokumen kuliah bersama secara real-time di browser.',
    subtitle_en: 'High-throughput independent campus storage with real-time collaborative document editing directly in browser.',
    date: 'Aktif di SAN VM 207',
    ctaText: 'Buka Repositori Berkas',
    ctaText_en: 'Open Cloud Storage',
    url: 'https://cloud.s4ras.site/apps/user_oidc/login/1',
    bgImage: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=1600&auto=format&fit=crop',
    bgStyle: 'linear-gradient(135deg, #180a0e 0%, #0f1117 50%, #0a0c10 100%)',
    accentColor: '#ef4444'
  },
  {
    id: 'iptv_stream',
    type: 'content',
    badge: 'Multimedia Kampus',
    badge_en: 'Campus Streaming',
    title: 'Jellyfin IPTV & Video Belajar',
    subtitle: 'Streaming siaran langsung edukasi dan repositori video materi tanpa buffering di jaringan gigabit kampus.',
    subtitle_en: 'Zero-buffering educational broadcast streams and lecture video on-demand over gigabit campus LAN.',
    date: 'Siaran Aktif 24/7',
    ctaText: 'Tonton Siaran IPTV',
    ctaText_en: 'Watch IPTV Stream',
    url: 'https://iptv.s4ras.site',
    bgImage: 'https://images.unsplash.com/photo-1598899134739-24c46f58b8c0?q=80&w=1600&auto=format&fit=crop',
    bgStyle: 'linear-gradient(135deg, #130a1c 0%, #0f1117 50%, #0a0c10 100%)',
    accentColor: '#a855f7'
  },
  {
    id: 'observability',
    type: 'content',
    badge: 'Telemetri Kluster',
    badge_en: 'Cluster Telemetry',
    title: 'Observabilitas 10 Node Kluster',
    subtitle: 'Pemantauan real-time kesehatan 10 VM, beban konkurensi JMeter, dan metrik Prometheus berlatensi rendah.',
    subtitle_en: 'Live observability across 10 Proxmox cluster nodes, Apache JMeter concurrency metrics, and Prometheus telemetry.',
    date: '99.98% Uptime Terverifikasi',
    ctaText: 'Lihat Dashboard Metrik',
    ctaText_en: 'Open Metrics Dashboard',
    url: 'https://monitor.s4ras.site',
    bgImage: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=1600&auto=format&fit=crop',
    bgStyle: 'linear-gradient(135deg, #091612 0%, #0f1117 50%, #0a0c10 100%)',
    accentColor: '#10b981'
  }
];

function Beranda() {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAllApps, setShowAllApps] = useState(false);
  const [appSearch, setAppSearch] = useState('');
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  // User-customized favorite services
  const [favoriteKeys, setFavoriteKeys] = useState(() => {
    try {
      const saved = localStorage.getItem(FAVORITES_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const validKeys = parsed.filter((k) => ALL_SERVICES_MAP[k]);
          if (validKeys.length > 0) return validKeys.slice(0, 8);
        }
      }
    } catch (e) {
      console.warn('Failed to load favorites from localStorage', e);
    }
    return DEFAULT_FAVORITE_KEYS;
  });

  const [isEditingFavorites, setIsEditingFavorites] = useState(false);
  const [tempSelectedKeys, setTempSelectedKeys] = useState(DEFAULT_FAVORITE_KEYS);

  const { profile, persona, roleLabel, sipExtension } = useKeycloak();
  const { t, language } = useThemeLanguage();

  const today = new Date();
  const dayName = today.toLocaleDateString(language === 'en' ? 'en-US' : 'id-ID', { weekday: 'long' });
  const formattedDate = today.toLocaleDateString(language === 'en' ? 'en-US' : 'id-ID', {
    day: 'numeric', month: 'long', year: 'numeric'
  });

  const getGreeting = () => {
    const hr = today.getHours();
    if (hr < 11) return t('home.greeting.morning');
    if (hr < 15) return t('home.greeting.afternoon');
    if (hr < 19) return t('home.greeting.evening');
    return t('home.greeting.night');
  };

  const fullName = profile?.firstName
    ? `${profile.firstName} ${profile.lastName || ''}`.trim()
    : profile?.username || 'Budi Pratama';
  const email = profile?.email || 'student1@s4ras.site';

  const PersonaIcon = persona === 'dev' ? Terminal : persona === 'teacher' ? BookOpen : GraduationCap;

  // Load announcements
  useEffect(() => {
    let mounted = true;
    fetchAnnouncements().then((data) => {
      if (mounted) { setAnnouncements(data); setLoading(false); }
    }).catch(() => {
      if (mounted) { setLoading(false); }
    });
    return () => { mounted = false; };
  }, []);

  // Carousel auto-advance with pause on hover and reset on user interaction
  const timerRef = useRef(null);

  const resetTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (!isHovered) {
      timerRef.current = setInterval(() => {
        setCarouselIndex((prev) => (prev + 1) % HERO_SLIDES.length);
      }, 7000);
    }
  }, [isHovered]);

  useEffect(() => {
    resetTimer();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [resetTimer]);

  const handlePrevSlide = () => {
    setCarouselIndex((prev) => (prev === 0 ? HERO_SLIDES.length - 1 : prev - 1));
    resetTimer();
  };

  const handleNextSlide = () => {
    setCarouselIndex((prev) => (prev + 1) % HERO_SLIDES.length);
    resetTimer();
  };

  const handleSelectSlide = (idx) => {
    setCarouselIndex(idx);
    resetTimer();
  };

  // Filter categorized apps based on search
  const filteredCategories = useMemo(() => {
    if (!appSearch.trim()) return APP_CATEGORIES;
    const q = appSearch.toLowerCase();
    return APP_CATEGORIES.map((cat) => {
      const matchingItems = cat.items.filter(
        (item) => item.title.toLowerCase().includes(q) || item.desc.toLowerCase().includes(q)
      );
      return { ...cat, items: matchingItems };
    }).filter((cat) => cat.items.length > 0);
  }, [appSearch]);

  const handleOpenEditFavorites = () => {
    setShowAllApps(false);
    setTempSelectedKeys([...favoriteKeys]);
    setIsEditingFavorites(true);
  };

  const handleCloseEditFavorites = () => {
    setIsEditingFavorites(false);
  };

  const handleToggleFavoriteKey = (key) => {
    if (tempSelectedKeys.includes(key)) {
      if (tempSelectedKeys.length <= 1) return;
      setTempSelectedKeys(tempSelectedKeys.filter((k) => k !== key));
    } else {
      if (tempSelectedKeys.length >= 8) return;
      setTempSelectedKeys([...tempSelectedKeys, key]);
    }
  };

  const handleSaveFavorites = () => {
    setFavoriteKeys(tempSelectedKeys);
    try {
      localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(tempSelectedKeys));
    } catch (e) {
      console.warn('Failed to save favorites to localStorage', e);
    }
    setIsEditingFavorites(false);
  };

  const handleResetFavorites = () => {
    setTempSelectedKeys(DEFAULT_FAVORITE_KEYS);
  };

  const handleAppClick = (item) => {
    if (!item) return;
    if (item.action === 'open-phone') {
      window.dispatchEvent(new CustomEvent('open-campus-phone'));
      return;
    }
    if (item.url) {
      window.open(item.url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <Layout>
      <div className="flex flex-col gap-6 lg:gap-7">
        {/* Top Hero Banner Carousel */}
        <div 
          className="relative w-full rounded-2xl overflow-hidden border border-border-default shadow-xl min-h-[290px] sm:min-h-[320px] md:min-h-[350px] bg-[#0c0e14] text-white flex flex-col justify-between group select-none"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {/* Sliding Track for Cool Smooth Transitions */}
          <div 
            className="flex w-full h-full min-h-[290px] sm:min-h-[320px] md:min-h-[350px] transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] will-change-transform"
            style={{ transform: `translateX(-${carouselIndex * 100}%)` }}
          >
            {HERO_SLIDES.map((slide, idx) => {
              const isActive = carouselIndex === idx;

              if (slide.type === 'welcome') {
                return (
                  <div
                    key={slide.id}
                    style={{ background: slide.bgStyle }}
                    className="w-full min-w-full h-full min-h-[290px] sm:min-h-[320px] md:min-h-[350px] shrink-0 relative flex flex-col justify-end px-12 sm:px-16 md:px-20 pb-7 sm:pb-8 pt-6 overflow-hidden text-white"
                  >
                    {/* Full Fading Photographic Background Layer */}
                    {slide.bgImage && (
                      <img
                        src={slide.bgImage}
                        alt=""
                        aria-hidden="true"
                        className={`absolute inset-0 w-full h-full object-cover object-right sm:object-center pointer-events-none transition-all duration-1000 ease-out ${
                          isActive ? 'opacity-55 sm:opacity-65 scale-100' : 'opacity-25 scale-105'
                        }`}
                        loading="eager"
                      />
                    )}

                    {/* Directional Softening Gradient Overlays - Matching Other Slides */}
                    <div
                      aria-hidden="true"
                      className="absolute inset-0 pointer-events-none"
                      style={{
                        background: 'linear-gradient(to top, rgba(10, 12, 16, 0.95) 0%, rgba(10, 12, 16, 0.65) 45%, rgba(10, 12, 16, 0.15) 75%, transparent 100%), linear-gradient(to right, rgba(10, 12, 16, 0.85) 0%, rgba(10, 12, 16, 0.45) 55%, transparent 85%)'
                      }}
                    />

                    {/* Subtle Decorative Ambient Glow */}
                    <div 
                      className="absolute -right-16 -top-16 w-80 h-80 rounded-full blur-3xl opacity-10 pointer-events-none"
                      style={{ backgroundColor: slide.accentColor }}
                    />

                    {/* Top Right Date Pill */}
                    <div className="absolute top-5 sm:top-6 right-12 sm:right-16 md:right-20 z-10 hidden sm:block">
                      <span className="text-xs font-medium text-white/70 tracking-wide">
                        {dayName}, {formattedDate}
                      </span>
                    </div>

                    {/* Content Fully Tucked in the Bottom-Left Corner — Aligned with Other Slides */}
                    <div className={`relative z-10 max-w-xl flex flex-col items-start gap-2 transition-all duration-500 ease-out ${isActive ? 'opacity-100 translate-y-0' : 'opacity-30 translate-y-2'}`}>
                      {/* Minimal Badge + Mobile Date */}
                      <div className="flex items-center gap-2.5">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-black/60 text-white/90 border border-white/20">
                          <PersonaIcon size={12} className="shrink-0" />
                          <span>{roleLabel || 'Civitas'} • {language === 'en' ? 'SSO ACTIVE' : 'SSO AKTIF'}</span>
                        </span>
                        <span className="text-xs text-white/70 font-medium sm:hidden">
                          {formattedDate}
                        </span>
                      </div>

                      {/* Modern Minimalist Bold Title */}
                      <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black text-white tracking-tight leading-tight m-0">
                        {getGreeting()}, {fullName}!
                      </h2>

                      {/* Simple, Straightforward Subtitle */}
                      <p className="text-xs sm:text-sm text-white/80 leading-relaxed max-w-lg m-0 mb-1">
                        {language === 'en'
                          ? 'Single Sign-On session active. All academic resources, storage, VoIP, and learning streams are ready.'
                          : 'Sesi Single Sign-On aktif. Seluruh layanan perkuliahan daring, penyimpanan berkas SAN, telepon VoIP, dan streaming pembelajaran siap digunakan.'}
                      </p>

                      {/* Minimalist Glass Action Buttons */}
                      <div className="flex flex-wrap items-center gap-2.5 pt-1">
                        <a
                          href="https://moodle.s4ras.site/auth/oidc/"
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-black/60 hover:bg-black/80 text-white text-xs font-semibold border border-white/20 active:scale-95 transition-all no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
                        >
                          <span>{language === 'en' ? 'Open Moodle' : 'Buka Moodle'}</span>
                          <ExternalLink size={13} />
                        </a>
                        <button
                          onClick={() => window.dispatchEvent(new CustomEvent('open-campus-phone'))}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-black/60 hover:bg-black/80 text-white text-xs font-semibold border border-white/15 active:scale-95 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
                        >
                          <Phone size={13} />
                          <span>Campus WebPhone ({sipExtension || '1001'})</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={slide.id}
                  style={{ background: slide.bgStyle }}
                  className="w-full min-w-full h-full min-h-[290px] sm:min-h-[320px] md:min-h-[350px] shrink-0 relative flex flex-col justify-end px-12 sm:px-16 md:px-20 pb-7 sm:pb-8 pt-6 overflow-hidden text-white"
                >
                  {/* Full Fading Photographic Background Layer */}
                  {slide.bgImage && (
                    <img
                      src={slide.bgImage}
                      alt=""
                      aria-hidden="true"
                      className={`absolute inset-0 w-full h-full object-cover object-center pointer-events-none transition-all duration-1000 ease-out ${
                        isActive ? 'opacity-50 sm:opacity-60 scale-100' : 'opacity-25 scale-105'
                      }`}
                      loading="lazy"
                    />
                  )}

                  {/* Directional Softening Gradient Overlays - Subtle & Focused on the Bottom-Left Text Area */}
                  <div
                    aria-hidden="true"
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      background: 'linear-gradient(to top, rgba(10, 12, 16, 0.95) 0%, rgba(10, 12, 16, 0.65) 45%, rgba(10, 12, 16, 0.15) 75%, transparent 100%), linear-gradient(to right, rgba(10, 12, 16, 0.85) 0%, rgba(10, 12, 16, 0.45) 55%, transparent 85%)'
                    }}
                  />

                  {/* Subtle Decorative Ambient Glow */}
                  <div 
                    className="absolute -right-16 -top-16 w-80 h-80 rounded-full blur-3xl opacity-10 pointer-events-none"
                    style={{ backgroundColor: slide.accentColor }}
                  />

                  {/* Top Right Date Pill */}
                  <div className="absolute top-5 sm:top-6 right-12 sm:right-16 md:right-20 z-10 hidden sm:block">
                    <span className="text-xs font-medium text-white/70 tracking-wide">
                      {slide.date}
                    </span>
                  </div>

                  {/* Content Fully Tucked in the Bottom-Left Corner */}
                  <div className={`relative z-10 max-w-xl flex flex-col items-start gap-2 transition-all duration-500 ease-out ${isActive ? 'opacity-100 translate-y-0' : 'opacity-30 translate-y-2'}`}>
                    {/* Minimal Badge + Mobile Date */}
                    <div className="flex items-center gap-2.5">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-black/60 text-white/90 border border-white/20">
                        {language === 'en' && slide.badge_en ? slide.badge_en : slide.badge}
                      </span>
                      <span className="text-xs text-white/70 font-medium sm:hidden">
                        {slide.date}
                      </span>
                    </div>

                    {/* Modern Minimalist Bold Title */}
                    <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black text-white tracking-tight leading-tight m-0">
                      {slide.title}
                    </h2>

                    {/* Simple, Straightforward Subtitle */}
                    <p className="text-xs sm:text-sm text-white/80 leading-relaxed max-w-lg m-0 mb-1">
                      {language === 'en' && slide.subtitle_en ? slide.subtitle_en : slide.subtitle}
                    </p>

                    {/* Minimalist Glass Action Button */}
                    <div className="pt-1">
                      <a
                        href={slide.url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-black/60 hover:bg-black/80 text-white text-xs font-semibold border border-white/20 active:scale-95 transition-all no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
                      >
                        <span>{language === 'en' && slide.ctaText_en ? slide.ctaText_en : (slide.ctaText || 'Informasi Lengkap')}</span>
                        <ExternalLink size={13} />
                      </a>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Carousel Controls: Left & Right Arrows with Tactile Feedback */}
          <button
            onClick={handlePrevSlide}
            aria-label="Slide sebelumnya"
            className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 z-20 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-black/75 hover:bg-black/90 border border-white/20 text-white flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white shadow-lg"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={handleNextSlide}
            aria-label="Slide berikutnya"
            className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 z-20 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-black/75 hover:bg-black/90 border border-white/20 text-white flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white shadow-lg"
          >
            <ChevronRight size={20} />
          </button>

          {/* Pagination Indicator Dots - Expanding Smooth Pills */}
          <div className="absolute bottom-3 right-8 sm:right-12 md:right-16 z-20 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/75 border border-white/10 shadow-lg">
            {HERO_SLIDES.map((_, idx) => (
              <button
                key={idx}
                onClick={() => handleSelectSlide(idx)}
                aria-label={`Pindah ke slide ${idx + 1}`}
                className={`transition-all duration-300 rounded-full cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white ${
                  carouselIndex === idx
                    ? 'w-6 sm:w-7 h-1.5 bg-white shadow-sm shadow-white/50'
                    : 'w-1.5 h-1.5 bg-white/40 hover:bg-white/70 hover:scale-125'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Two-Column Grid Layout (Left: Apps ~65%, Right: Widgets ~35%) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column (Primary Content Area, span 8 cols) */}
          <div className="lg:col-span-8 flex flex-col gap-5 sm:gap-6">
            {/* Aplikasi Launcher Container */}
            <div className="card p-5 sm:p-7 bg-neutral-bg2/90 border border-border-default rounded-2xl shadow-md flex flex-col gap-5 transition-all">
              {isEditingFavorites ? (
                /* Mode Edit Favorit (Seamless In-Place Editor) */
                <div className="flex flex-col gap-4.5 animate-fade-in">
                  {/* Top Header of Edit Mode */}
                  <div className="flex items-center justify-between flex-wrap gap-3 pb-3.5 border-b border-border-default/70">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-brand/10 border border-brand/20 flex items-center justify-center text-brand-light shadow-sm">
                        <Edit3 size={17} />
                      </div>
                      <div>
                        <h3 className="text-base sm:text-lg font-bold text-text-primary m-0">
                          {t('home.modal_fav_title')}
                        </h3>
                        <p className="text-xs text-text-secondary m-0 mt-0.5">
                          {t('home.modal_fav_desc')}
                        </p>
                      </div>
                    </div>

                    {/* Top Action Controls */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-brand/10 text-brand-light border border-brand/20">
                        {tempSelectedKeys.length} / 8 {t('home.modal_fav_selected')}
                      </span>
                      <button
                        onClick={handleResetFavorites}
                        className="text-xs text-text-muted hover:text-text-primary underline px-2 py-1 cursor-pointer bg-transparent border-none"
                      >
                        {t('home.modal_fav_reset')}
                      </button>
                      <button
                        onClick={handleCloseEditFavorites}
                        className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-text-secondary hover:text-text-primary text-xs font-semibold border border-border-default transition-all cursor-pointer"
                      >
                        {t('home.modal_fav_cancel')}
                      </button>
                      <button
                        onClick={handleSaveFavorites}
                        className="px-4 py-1.5 rounded-xl bg-brand hover:bg-brand-hover text-white text-xs font-bold transition-all shadow-md cursor-pointer flex items-center gap-1.5"
                      >
                        <Check size={14} />
                        <span>{t('home.modal_fav_save')}</span>
                      </button>
                    </div>
                  </div>

                  {/* Clean 2-Column Responsive Service Picker Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    {Object.values(ALL_SERVICES_MAP).map((service) => {
                      const isSelected = tempSelectedKeys.includes(service.key);
                      const title = language === 'en' ? service.title_en : service.title;
                      const subtitle = language === 'en' ? service.subtitle_en : service.subtitle;

                      return (
                        <div
                          key={service.key}
                          onClick={() => handleToggleFavoriteKey(service.key)}
                          className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all duration-200 cursor-pointer select-none group ${
                            isSelected
                              ? 'bg-brand/[0.04] border-brand/50 shadow-sm'
                              : 'bg-white/[0.01] border-border-default hover:bg-white/[0.04] hover:border-border-default/80 opacity-60 hover:opacity-100'
                          }`}
                        >
                          <div className="flex items-center gap-3.5 min-w-0 flex-1">
                            <div
                              className={`w-11 h-11 rounded-xl flex items-center justify-center text-white shrink-0 shadow-sm transition-transform group-hover:scale-105 ${
                                isSelected
                                  ? 'bg-gradient-to-tr from-brand-hover via-brand to-brand-light text-white'
                                  : 'bg-neutral-bg3 border border-border-default text-text-muted'
                              }`}
                            >
                              <ServiceIcon
                                iconName={service.icon}
                                size={20}
                                className={isSelected ? 'text-white' : 'text-text-secondary'}
                              />
                            </div>
                            <div className="flex flex-col min-w-0 flex-1">
                              <span className="text-xs sm:text-sm font-bold text-text-primary truncate group-hover:text-brand-light transition-colors">
                                {title}
                              </span>
                              <span className="text-[11px] text-text-secondary truncate mt-0.5">
                                {subtitle}
                              </span>
                            </div>
                          </div>

                          {/* Seamless Pill Toggle */}
                          <div
                            className={`w-6 h-6 rounded-lg flex items-center justify-center border transition-all shrink-0 ml-3 ${
                              isSelected
                                ? 'bg-brand text-white border-brand shadow-sm scale-105'
                                : 'border-border-default bg-neutral-bg3 text-transparent group-hover:border-brand/40'
                            }`}
                          >
                            <Check size={14} className={isSelected ? 'block' : 'opacity-0'} />
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Bottom Bar */}
                  <div className="flex items-center justify-between pt-3 border-t border-border-default/60 flex-wrap gap-3">
                    <span className="text-xs text-text-secondary">
                      {language === 'en'
                        ? 'Tip: Select between 1 and 8 shortcuts to display on your home screen.'
                        : 'Tips: Pilih antara 1 hingga 8 pintasan untuk ditampilkan di beranda.'}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleCloseEditFavorites}
                        className="px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-text-secondary hover:text-text-primary text-xs font-semibold border border-border-default transition-all cursor-pointer"
                      >
                        {t('home.modal_fav_cancel')}
                      </button>
                      <button
                        onClick={handleSaveFavorites}
                        className="px-4 py-1.5 rounded-xl bg-brand hover:bg-brand-hover text-white text-xs font-bold transition-all shadow-md cursor-pointer flex items-center gap-1.5"
                      >
                        <Check size={14} />
                        <span>{t('home.modal_fav_save')}</span>
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                /* Normal Mode (Launcher Grid / Full Categorized Apps) */
                <>
                  {/* Aplikasi Header */}
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-bold text-text-primary m-0">{t('home.apps')}</h3>
                      <span className="text-xs px-2.5 py-0.5 rounded-full bg-white/5 text-text-muted border border-border-default font-medium">
                        {showAllApps ? `${services.length} ${t('home.apps_integrated')}` : t('home.apps_favorites')}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Header Edit Favorit Action */}
                      {!showAllApps && (
                        <button
                          onClick={handleOpenEditFavorites}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-text-secondary hover:text-text-primary text-xs font-semibold border border-border-default transition-all cursor-pointer"
                        >
                          <Edit3 size={13} className="text-brand-light" />
                          <span>{t('home.edit_favorites')}</span>
                        </button>
                      )}

                      {/* Toggle Button Top */}
                      <button
                        onClick={() => setShowAllApps(!showAllApps)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-text-secondary hover:text-text-primary text-xs font-semibold border border-border-default transition-all cursor-pointer"
                      >
                        {showAllApps ? (
                          <>
                            <ChevronUp size={14} />
                            <span>{t('home.apps_show_fav')}</span>
                          </>
                        ) : (
                          <>
                            <ChevronDown size={14} />
                            <span>{t('home.apps_show_all')}</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Search Bar when expanded */}
                  {showAllApps && (
                    <div className="relative w-full">
                      <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
                      <input
                        type="text"
                        placeholder={t('home.apps_search')}
                        value={appSearch}
                        onChange={(e) => setAppSearch(e.target.value)}
                        className="w-full pl-9 pr-9 py-2.5 rounded-xl bg-neutral-bg3/80 border border-border-default text-text-primary text-xs sm:text-sm placeholder:text-text-muted focus:outline-none focus:border-brand-light focus:ring-1 focus:ring-brand-light/30 transition-all"
                      />
                      {appSearch && (
                        <button
                          onClick={() => setAppSearch('')}
                          className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-text-muted hover:text-text-primary rounded-md cursor-pointer"
                        >
                          <X size={14} />
                        </button>
                      )}
                    </div>
                  )}

                  {/* View 1: Dynamic User-Configurable Favorite Apps Grid */}
                  {!showAllApps && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 pt-2">
                      {favoriteKeys.map((key) => {
                        const item = ALL_SERVICES_MAP[key];
                        if (!item) return null;
                        const itemTitle = language === 'en' ? item.title_en : item.title;
                        const itemSubtitle = language === 'en' ? item.subtitle_en : item.subtitle;

                        return (
                          <div
                            key={key}
                            onClick={() => handleAppClick(item)}
                            className="flex flex-col items-center justify-center text-center p-3 rounded-2xl hover:bg-white/[0.04] transition-all duration-200 group cursor-pointer"
                          >
                            <div className={`w-14 h-14 rounded-2xl bg-gradient-to-tr ${item.gradient} flex items-center justify-center text-white shadow-lg group-hover:scale-105 transition-transform mb-2`}>
                              <ServiceIcon iconName={item.icon} size={26} />
                            </div>
                            <span className="text-xs sm:text-sm font-bold text-text-primary group-hover:text-brand-light transition-colors line-clamp-1">
                              {itemTitle}
                            </span>
                            <span className="text-[11px] text-text-muted mt-0.5 line-clamp-1">
                              {itemSubtitle}
                            </span>
                          </div>
                        );
                      })}

                      {/* Edit Favorit Tile (Triggers in-place editor) */}
                      <div
                        onClick={handleOpenEditFavorites}
                        className="flex flex-col items-center justify-center text-center p-3 rounded-2xl hover:bg-white/[0.04] transition-all duration-200 group cursor-pointer"
                      >
                        <div className="w-14 h-14 rounded-2xl bg-neutral-bg3 border border-border-default flex items-center justify-center text-text-secondary group-hover:text-text-primary group-hover:border-brand/40 group-hover:scale-105 transition-all mb-2 shadow-sm">
                          <Edit3 size={24} />
                        </div>
                        <span className="text-xs sm:text-sm font-bold text-text-primary group-hover:text-brand-light transition-colors">
                          {t('home.edit_favorites')}
                        </span>
                        <span className="text-[11px] text-text-muted mt-0.5">
                          {t('home.edit_favorites_sub')}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* View 2: Categorized Full Applications Grid (10 Real Services) */}
                  {showAllApps && (
                    <div className="flex flex-col gap-6 pt-2">
                      {filteredCategories.length === 0 ? (
                        <div className="p-8 text-center text-text-muted text-sm bg-white/[0.01] rounded-xl border border-border-default">
                          Tidak ditemukan aplikasi dengan kata kunci "{appSearch}".
                        </div>
                      ) : (
                        filteredCategories.map((cat) => (
                          <div key={cat.id} className="flex flex-col gap-3">
                            <h4 className="text-xs font-bold text-text-secondary uppercase tracking-wider pl-1 border-l-2 border-brand-light">
                              {language === 'en' ? cat.title_en : cat.title}
                            </h4>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              {cat.items.map((item) => (
                                <div
                                  key={item.key}
                                  onClick={() => handleAppClick(item)}
                                  className="flex items-center gap-3.5 p-3.5 rounded-xl bg-white/[0.02] border border-border-default hover:bg-white/[0.06] hover:border-brand/30 transition-all duration-200 cursor-pointer group"
                                >
                                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center ${item.iconColor} shrink-0 border border-white/10 group-hover:scale-105 transition-transform`}>
                                    <ServiceIcon iconName={item.icon} size={20} />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="text-xs sm:text-[0.8125rem] font-bold text-text-primary truncate group-hover:text-brand-light transition-colors">
                                      {item.title}
                                    </div>
                                    <div className="text-[11px] text-text-secondary truncate mt-0.5">
                                      {item.desc}
                                    </div>
                                  </div>
                                  <ExternalLink size={13} className="text-text-muted opacity-40 group-hover:opacity-100 group-hover:text-brand-light shrink-0 transition-opacity" />
                                </div>
                              ))}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {/* Bottom Full-Width Toggle Button */}
                  <button
                    onClick={() => setShowAllApps(!showAllApps)}
                    className="w-full py-2.5 px-4 rounded-xl bg-white/5 hover:bg-white/10 text-text-secondary hover:text-text-primary text-xs sm:text-sm font-semibold border border-border-default transition-all flex items-center justify-center gap-2 cursor-pointer mt-1"
                  >
                    {showAllApps ? (
                      <>
                        <ChevronUp size={16} />
                        <span>{t('home.apps_show_fav')}</span>
                      </>
                    ) : (
                      <>
                        <ChevronDown size={16} />
                        <span>{t('home.apps_show_all')}</span>
                      </>
                    )}
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Right Column (Widgets Area, span 4 cols) */}
          <div className="lg:col-span-4 flex flex-col gap-5 sm:gap-6">
            {/* Widget 1: User Profile Card */}
            <div className="card p-5 bg-neutral-bg2/90 border border-border-default rounded-2xl shadow-md flex flex-col gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-brand-light to-brand text-white flex items-center justify-center shadow-md shrink-0 border border-white/20 font-bold text-base">
                  <User size={24} className="text-white" />
                </div>
                <div className="flex flex-col min-w-0 flex-1">
                  <h4 className="text-sm sm:text-base font-bold text-text-primary truncate m-0">
                    {fullName}
                  </h4>
                  <p className="text-xs text-text-secondary truncate m-0 mt-0.5">
                    {email}
                  </p>
                </div>
              </div>

              <Link
                to="/akun"
                className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-border-default text-xs font-semibold text-text-primary no-underline transition-all group"
              >
                <span>{t('home.manage_account')}</span>
                <ChevronRight size={15} className="group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>

            {/* Widget 2: Date & Academic Week Calendar Card */}
            <div className="card p-5 bg-neutral-bg2/90 border border-border-default rounded-2xl shadow-md flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <h3 className="text-lg sm:text-xl font-black text-text-primary m-0">
                  {dayName}
                </h3>
                <CalendarIcon size={18} className="text-text-muted" />
              </div>
              <div className="text-xs sm:text-sm font-semibold text-brand-light">
                {formattedDate}
              </div>
              <div className="mt-2 pt-3 border-t border-border-default/60 flex items-center gap-2 text-xs font-medium text-text-secondary">
                <span className="w-1 h-3.5 rounded-full bg-brand-light shrink-0" />
                <span>{t('home.academic_week')}</span>
              </div>
            </div>

            {/* Widget 3: Pengumuman Widget */}
            <div className="card p-5 bg-neutral-bg2/90 border border-border-default rounded-2xl shadow-md flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-text-primary m-0">{t('home.announcements')}</h4>
                <Megaphone size={16} className="text-brand-light" />
              </div>

              {loading ? (
                <div className="flex flex-col gap-3">
                  <SkeletonCard lines={2} showIcon />
                  <SkeletonCard lines={2} showIcon />
                </div>
              ) : (
                <div className="flex flex-col gap-3.5">
                  {announcements.slice(0, 3).map((item, idx) => {
                    const title = language === 'en' ? (item.title_en || item.title) : (item.title_id || item.title);
                    const desc = language === 'en' ? (item.desc_en || item.description) : (item.desc_id || item.description);
                    const badge = language === 'en' ? (item.badge_en || item.badge || 'Kegiatan') : (item.badge_id || item.badge || 'Kegiatan');

                    return (
                      <div key={item.id || idx} className="flex gap-3 items-start p-2 rounded-xl hover:bg-white/[0.03] transition-colors">
                        <Megaphone size={16} className="text-brand-light shrink-0 mt-0.5" />
                        <div className="flex flex-col min-w-0 flex-1">
                          <span className="text-xs font-bold text-text-primary truncate">
                            {title}
                          </span>
                          <span className="text-[11px] text-text-secondary line-clamp-2 mt-0.5">
                            {desc}
                          </span>
                          <span className="inline-block mt-1.5 px-2 py-0.5 rounded text-[10px] font-bold bg-white/5 text-text-secondary border border-border-default w-fit">
                            {badge}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <Link
                to="/pengumuman"
                className="w-full py-2.5 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-text-primary text-center no-underline border border-border-default transition-all"
              >
                {t('home.view_all_announcements')}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default Beranda;
