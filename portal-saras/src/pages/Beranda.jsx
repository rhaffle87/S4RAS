// Beranda — Home Dashboard (Aligned with myITS Layout & S4RAS Aesthetic)
import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  ExternalLink,
  ChevronRight,
  ChevronLeft,
  User,
  Activity,
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
import { fetchAnnouncements, DEFAULT_ANNOUNCEMENTS } from '../services/backend';
import { useKeycloak } from '../context/KeycloakContext';
import { calculateAcademicWeek } from '../utils/academicCalendar';
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
        url: 'https://iptv.s4ras.site/sso/OID/start/keycloak',
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
        url: 'https://monitor.s4ras.site/login/generic_oauth',
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
    subtitle: 'Uptime & Jaringan 3T',
    subtitle_en: 'Uptime & 3T Network',
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
    subtitle: 'Modul Belajar & Pelatihan',
    subtitle_en: 'Learning & Training Modules',
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
    subtitle: 'Otentikasi Akun Terpusat',
    subtitle_en: 'Centralized User Auth',
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
    subtitle: 'Penyimpanan Berkas Mandiri',
    subtitle_en: 'Independent Storage & Drive',
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
    subtitle: 'Streaming Edukasi Lokal',
    subtitle_en: 'Local Media Streaming',
    icon: 'Tv',
    url: 'https://iptv.s4ras.site/sso/OID/start/keycloak',
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
    subtitle: 'Telemetri Klaster 3T',
    subtitle_en: '3T Cluster Telemetry',
    icon: 'BarChart3',
    url: 'https://monitor.s4ras.site/login/generic_oauth',
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
const FAVORITES_STORAGE_KEY = 's4ras_favorite_apps_v2';

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
    id: 'learning',
    type: 'content',
    badge: 'Pembelajaran Digital',
    badge_en: 'Digital Learning',
    title: 'Ruang Kelas Digital & Pelatihan Terpadu',
    title_en: 'Digital Classroom & Integrated Training',
    subtitle: 'Akses materi pembelajaran SD, SMP, SMA serta modul pelatihan pertanian, peternakan, dan industri kreatif secara mandiri.',
    subtitle_en: 'Access elementary to high school curriculum along with vocational training modules for agriculture, livestock, and creative industries.',
    date: 'Moodle LMS S4RAS',
    ctaText: 'Buka Kelas Belajar',
    ctaText_en: 'Open Learning Class',
    url: 'https://moodle.s4ras.site/auth/oidc/',
    accentColor: '#ef4444',
    bgImage: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?q=80&w=1600&auto=format&fit=crop',
    bgStyle: 'linear-gradient(135deg, #180a0e 0%, #0f1117 50%, #0a0c10 100%)'
  },
  {
    id: 'telephony',
    type: 'content',
    badge: 'Telekomunikasi VoIP',
    badge_en: 'VoIP Telephony',
    title: 'Komunikasi Suara & Video Tanpa Batas',
    title_en: 'Seamless Voice & Video Communications',
    subtitle: 'Hubungi pengajar dan sivitas melalui layanan WebPhone SIP/WebRTC lokal yang stabil dan hemat bandwidth.',
    subtitle_en: 'Connect directly with teachers and peers through bandwidth-efficient local SIP and WebPhone communications.',
    date: 'PJSIP & WebRTC Lokal',
    ctaText: 'Buka WebPhone',
    ctaText_en: 'Open WebPhone',
    action: 'open-phone',
    url: 'https://voip.s4ras.site',
    accentColor: '#10b981',
    bgImage: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=1600&auto=format&fit=crop',
    bgStyle: 'linear-gradient(135deg, #091612 0%, #0f1117 50%, #0a0c10 100%)'
  },
  {
    id: 'multimedia_storage',
    type: 'content',
    badge: 'Multimedia & Storage',
    badge_en: 'Multimedia & Storage',
    title: 'Siaran Edukasi IPTV & Penyimpanan Awan Lokal',
    title_en: 'Educational IPTV & Local Cloud Storage',
    subtitle: 'Tonton tayangan edukatif bebas buffering dan kelola berkas kolaborasi dengan aman di jaringan lokal S4RAS.',
    subtitle_en: 'Stream buffer-free educational broadcasts and collaborate securely on documents over the local S4RAS network.',
    date: 'Jellyfin & Nextcloud',
    ctaText: 'Jelajahi Media & Berkas',
    ctaText_en: 'Explore Media & Drive',
    url: 'https://iptv.s4ras.site',
    accentColor: '#a855f7',
    bgImage: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=1600&auto=format&fit=crop',
    bgStyle: 'linear-gradient(135deg, #130a1c 0%, #0f1117 50%, #0a0c10 100%)'
  }
];

function Beranda() {
  const [announcements, setAnnouncements] = useState(DEFAULT_ANNOUNCEMENTS);
  const [loading, setLoading] = useState(false);
  const [modalSearch, setModalSearch] = useState('');
  const [showAllApps, setShowAllApps] = useState(false);
  const [appSearch, setAppSearch] = useState('');
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [isHeroHovered, setIsHeroHovered] = useState(false);

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

  const today = useMemo(() => new Date(), []);
  const academicCalendar = useMemo(() => calculateAcademicWeek(today), [today]);
  const academicWeek = academicCalendar.week;
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

  // Load announcements (graceful fallback to built-in announcements)
  useEffect(() => {
    let mounted = true;
    setLoading(true);
    fetchAnnouncements().then((data) => {
      if (mounted && Array.isArray(data) && data.length > 0) {
        setAnnouncements(data);
      }
    }).catch(() => {
      // Keep DEFAULT_ANNOUNCEMENTS
    }).finally(() => {
      if (mounted) setLoading(false);
    });
    return () => { mounted = false; };
  }, []);

  const displayedAnnouncements = useMemo(() => {
    if (Array.isArray(announcements) && announcements.length > 0) {
      return announcements;
    }
    return DEFAULT_ANNOUNCEMENTS;
  }, [announcements]);

  const modalFilteredServices = useMemo(() => {
    const all = Object.values(ALL_SERVICES_MAP);
    if (!modalSearch.trim()) return all;
    const q = modalSearch.toLowerCase();
    return all.filter((s) => {
      const title = (language === 'en' ? s.title_en : s.title) || '';
      const subtitle = (language === 'en' ? s.subtitle_en : s.subtitle) || '';
      return title.toLowerCase().includes(q) || subtitle.toLowerCase().includes(q);
    });
  }, [modalSearch, language]);

  // Carousel auto-advance (2.5s) with pause-on-hover and instant reset on slide change
  useEffect(() => {
    if (isHeroHovered || !HERO_SLIDES?.length) return undefined;
    const timer = setInterval(() => {
      setCarouselIndex((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 2500);
    return () => clearInterval(timer);
  }, [isHeroHovered, carouselIndex]);

  const handlePrevSlide = () => {
    setCarouselIndex((prev) => (prev === 0 ? HERO_SLIDES.length - 1 : prev - 1));
  };

  const handleNextSlide = () => {
    setCarouselIndex((prev) => (prev + 1) % HERO_SLIDES.length);
  };

  const handleSelectSlide = (idx) => {
    setCarouselIndex(idx);
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
    setTempSelectedKeys([...favoriteKeys]);
    setModalSearch('');
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
      <div className="w-full space-y-6">
        {/* Top Hero Banner Carousel (3-Layer Stacked Crossfade & Scale-Pop Architecture) */}
        <div 
          className="relative w-full min-h-[260px] sm:min-h-[290px] lg:min-h-[310px] rounded-2xl overflow-hidden border border-[var(--color-border-default)] shadow-xl bg-zinc-950 text-white p-6 sm:p-8 lg:p-10 flex flex-col justify-between group select-none"
          onMouseEnter={() => setIsHeroHovered(true)}
          onMouseLeave={() => setIsHeroHovered(false)}
        >
          {/* LAPISAN 1: Stacked Background Images with Fade + Scale-Pop */}
          <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
            {HERO_SLIDES.map((slide, idx) => {
              const isActive = idx === carouselIndex;
              return (
                <div
                  key={slide.id || idx}
                  style={{ background: slide.bgStyle }}
                  className={`absolute inset-0 w-full h-full transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                    isActive ? 'opacity-100 scale-100' : 'opacity-0 scale-105 pointer-events-none'
                  }`}
                >
                  {slide.bgImage && (
                    <img
                      src={slide.bgImage}
                      alt=""
                      aria-hidden="true"
                      className={`absolute inset-0 w-full h-full object-cover block ${
                        slide.type === 'welcome' ? 'object-right sm:object-center opacity-60' : 'object-center opacity-55'
                      }`}
                      loading={idx === 0 ? 'eager' : 'lazy'}
                    />
                  )}
                  {/* Subtle Decorative Ambient Glow */}
                  <div 
                    className="absolute -right-16 -top-16 w-80 h-80 rounded-full blur-3xl opacity-15 pointer-events-none"
                    style={{ backgroundColor: slide.accentColor }}
                  />
                </div>
              );
            })}

            {/* Static Gradient Overlays (1 layer statis, stabil tanpa flicker) */}
            <div
              aria-hidden="true"
              className="absolute inset-0 z-[1] pointer-events-none bg-gradient-to-t from-zinc-950/85 via-zinc-950/40 to-zinc-950/10"
            />
            <div
              aria-hidden="true"
              className="absolute inset-0 z-[1] pointer-events-none bg-gradient-to-r from-zinc-950/60 via-zinc-950/25 to-transparent"
            />
          </div>

          {/* LAPISAN 2: Foreground Text & CTA Content Stack (1-Cell Grid Crossfade) */}
          <div className="relative z-10 grid grid-cols-1 grid-rows-1 flex-1">
            {HERO_SLIDES.map((slide, idx) => {
              const isActive = idx === carouselIndex;

              if (slide.type === 'welcome') {
                return (
                  <div
                    key={slide.id || idx}
                    aria-hidden={!isActive}
                    className={`col-start-1 row-start-1 flex flex-col justify-between transition-all duration-500 ease-out ${
                      isActive
                        ? 'opacity-100 translate-y-0 pointer-events-auto z-10'
                        : 'opacity-0 translate-y-1 pointer-events-none z-0'
                    }`}
                  >
                    {/* Top Metadata Row */}
                    <div className="flex items-center justify-between gap-3 w-full">
                      {/* Kiri Atas (Category Pill) */}
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-[11px] font-semibold uppercase tracking-wider text-white/90">
                        <PersonaIcon size={12} className="shrink-0 text-white" />
                        <span>{roleLabel || 'Civitas'} • {language === 'en' ? 'SSO ACTIVE' : 'SSO AKTIF'}</span>
                      </div>

                      {/* Kanan Atas (Context/Date Pill) */}
                      <div className="px-3 py-1 rounded-full bg-black/35 backdrop-blur-md border border-white/10 text-xs font-medium text-zinc-300">
                        <span>{dayName}, {formattedDate}</span>
                      </div>
                    </div>

                    {/* Tipografi Judul & Deskripsi (Tengah) */}
                    <div className="max-w-2xl my-auto py-3 flex flex-col items-start">
                      <h2 className="text-2xl sm:text-3xl lg:text-[34px] font-bold tracking-tight text-white leading-[1.2] m-0 drop-shadow-sm">
                        {getGreeting()}, {fullName}!
                      </h2>
                      <p className="mt-2.5 text-xs sm:text-sm text-zinc-200 leading-relaxed max-w-xl font-normal m-0 drop-shadow-sm">
                        {language === 'en'
                          ? 'Single-door access to digital learning, VoIP telephony, educational IPTV broadcasting, and independent cloud storage.'
                          : 'Akses satu pintu layanan pembelajaran digital, komunikasi VoIP, siaran edukasi IPTV, dan penyimpanan mandiri S4RAS.'}
                      </p>
                    </div>

                    {/* Bottom CTA Row (Kiri Bawah dengan pr-0 sm:pr-48 agar tidak menabrak Control Dock) */}
                    <div className="mt-auto pt-6 flex flex-wrap items-center gap-3 w-full pr-0 sm:pr-48">
                      <a
                        href="https://moodle.s4ras.site/auth/oidc/"
                        target="_blank"
                        rel="noreferrer"
                        className="h-10 px-4 rounded-xl bg-white text-zinc-950 hover:bg-zinc-100 font-semibold text-xs inline-flex items-center gap-2 shadow-sm transition-all active:scale-95 no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
                      >
                        <span>{language === 'en' ? 'Open Moodle' : 'Buka Moodle'}</span>
                        <ExternalLink size={13} />
                      </a>
                      <button
                        type="button"
                        onClick={() => window.dispatchEvent(new CustomEvent('open-campus-phone'))}
                        className="h-10 px-4 rounded-xl bg-white/10 hover:bg-white/15 backdrop-blur-md border border-white/20 text-white font-medium text-xs inline-flex items-center gap-2 transition-all active:scale-95 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
                      >
                        <Phone size={13} />
                        <span>WebPhone ({sipExtension || '1001'})</span>
                      </button>
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={slide.id || idx}
                  aria-hidden={!isActive}
                  className={`col-start-1 row-start-1 flex flex-col justify-between transition-all duration-500 ease-out ${
                    isActive
                      ? 'opacity-100 translate-y-0 pointer-events-auto z-10'
                      : 'opacity-0 translate-y-1 pointer-events-none z-0'
                  }`}
                >
                  {/* Top Metadata Row */}
                  <div className="flex items-center justify-between gap-3 w-full">
                    {/* Kiri Atas (Category Pill) */}
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-[11px] font-semibold uppercase tracking-wider text-white/90">
                      <span className="w-1.5 h-1.5 rounded-full bg-white" />
                      <span>{language === 'en' && slide.badge_en ? slide.badge_en : slide.badge}</span>
                    </div>

                    {/* Kanan Atas (Context/Date Pill) */}
                    <div className="px-3 py-1 rounded-full bg-black/35 backdrop-blur-md border border-white/10 text-xs font-medium text-zinc-300">
                      <span>{slide.date}</span>
                    </div>
                  </div>

                  {/* Tipografi Judul & Deskripsi (Tengah) */}
                  <div className="max-w-2xl my-auto py-3 flex flex-col items-start">
                    <h2 className="text-2xl sm:text-3xl lg:text-[34px] font-bold tracking-tight text-white leading-[1.2] m-0 drop-shadow-sm">
                      {slide.title}
                    </h2>
                    <p className="mt-2.5 text-xs sm:text-sm text-zinc-200 leading-relaxed max-w-xl font-normal m-0 drop-shadow-sm">
                      {language === 'en' && slide.subtitle_en ? slide.subtitle_en : slide.subtitle}
                    </p>
                  </div>

                  {/* Bottom CTA Row (Kiri Bawah dengan pr-0 sm:pr-48 agar tidak menabrak Control Dock) */}
                  <div className="mt-auto pt-6 flex flex-wrap items-center gap-3 w-full pr-0 sm:pr-48">
                    {slide.action === 'open-phone' ? (
                      <button
                        type="button"
                        onClick={() => window.dispatchEvent(new CustomEvent('open-campus-phone'))}
                        className="h-10 px-4 rounded-xl bg-white text-zinc-950 hover:bg-zinc-100 font-semibold text-xs inline-flex items-center gap-2 shadow-sm transition-all active:scale-95 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
                      >
                        <Phone size={13} />
                        <span>{language === 'en' && slide.ctaText_en ? slide.ctaText_en : (slide.ctaText || 'Buka WebPhone')}</span>
                      </button>
                    ) : (
                      <a
                        href={slide.url}
                        target="_blank"
                        rel="noreferrer"
                        className="h-10 px-4 rounded-xl bg-white text-zinc-950 hover:bg-zinc-100 font-semibold text-xs inline-flex items-center gap-2 shadow-sm transition-all active:scale-95 no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
                      >
                        <span>{language === 'en' && slide.ctaText_en ? slide.ctaText_en : (slide.ctaText || 'Informasi Lengkap')}</span>
                        <ExternalLink size={13} />
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* LAPISAN 3: Persistent Stationary Control Dock (Stay Anchored) */}
          <div className="sm:absolute sm:bottom-8 sm:right-8 lg:bottom-10 lg:right-10 z-20 mt-4 sm:mt-0 self-end inline-flex items-center gap-1.5 sm:gap-2 rounded-full bg-black/45 backdrop-blur-md border border-white/15 p-1.5 shadow-lg select-none">
            {/* Tombol Previous < */}
            <button
              type="button"
              onClick={handlePrevSlide}
              aria-label="Slide sebelumnya"
              className="w-7 h-7 rounded-full flex items-center justify-center text-white/80 hover:text-white hover:bg-white/15 active:scale-90 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              <ChevronLeft size={16} />
            </button>

            {/* Indikator Dots */}
            <div className="flex items-center gap-1.5 px-2">
              {HERO_SLIDES.map((_, dotIdx) => (
                <button
                  key={dotIdx}
                  type="button"
                  onClick={() => handleSelectSlide(dotIdx)}
                  aria-label={`Pindah ke slide ${dotIdx + 1}`}
                  className={`transition-all duration-300 rounded-full cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white ${
                    carouselIndex === dotIdx
                      ? 'w-5 h-1.5 rounded-full bg-white shadow-sm shadow-white/50'
                      : 'w-1.5 h-1.5 rounded-full bg-white/35 hover:bg-white/60'
                  }`}
                />
              ))}
            </div>

            {/* Tombol Next > */}
            <button
              type="button"
              onClick={handleNextSlide}
              aria-label="Slide berikutnya"
              className="w-7 h-7 rounded-full flex items-center justify-center text-white/80 hover:text-white hover:bg-white/15 active:scale-90 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {/* Two-Column Grid Layout (Left: Apps ~65%, Right: Widgets ~35%) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-6 items-start">
          {/* Left Column (Primary Content Area, span 8 cols) */}
          <div className="lg:col-span-8 flex flex-col gap-5 sm:gap-6 h-fit self-start">
            {/* Aplikasi Launcher Container */}
            <div className="card p-5 sm:p-7 bg-neutral-bg2/90 border border-border-default rounded-2xl shadow-md flex flex-col gap-5 transition-all">
              {/* Aplikasi Header: Clean title only (Image 3) */}
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-text-primary m-0">{t('home.apps')}</h3>
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
                      type="button"
                      onClick={() => setAppSearch('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-text-muted hover:text-text-primary rounded-md cursor-pointer"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              )}

              {/* View 1: 3-Column Symmetrical Favorite Apps Grid (Image 1 & Image 3) */}
              {!showAllApps && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-6 pt-2">
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
                        <span className="text-xs sm:text-sm font-bold text-[var(--color-text-primary)] group-hover:text-[#dc2626] transition-colors line-clamp-1">
                          {itemTitle}
                        </span>
                        <span className="text-[11px] text-text-muted mt-0.5 line-clamp-1">
                          {itemSubtitle}
                        </span>
                      </div>
                    );
                  })}

                  {/* Edit Favorit Tile (Triggers Center Modal Popup) */}
                  <div
                    onClick={handleOpenEditFavorites}
                    className="flex flex-col items-center justify-center text-center p-3 rounded-2xl hover:bg-white/[0.04] transition-all duration-200 group cursor-pointer"
                  >
                    <div className="w-14 h-14 rounded-2xl bg-neutral-bg3 border border-border-default flex items-center justify-center text-text-secondary group-hover:text-text-primary group-hover:border-brand/40 group-hover:scale-105 transition-all mb-2 shadow-sm">
                      <Edit3 size={24} />
                    </div>
                    <span className="text-xs sm:text-sm font-bold text-[var(--color-text-primary)] group-hover:text-[#dc2626] transition-colors">
                      {t('home.edit_favorites')}
                    </span>
                    <span className="text-[11px] text-text-muted mt-0.5">
                      {t('home.edit_favorites_sub')}
                    </span>
                  </div>
                </div>
              )}

              {/* View 2: Categorized Full Applications Grid */}
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

              {/* Bottom Full-Width Toggle Button (Image 1 & Image 3) */}
              <button
                type="button"
                onClick={() => setShowAllApps(!showAllApps)}
                className="w-full py-2.5 px-4 rounded-xl bg-[#f4f4f5] hover:bg-[#e4e4e7] text-[#18181b] border border-[#e4e4e7] dark:bg-[#27272a] dark:hover:bg-[#3f3f46] dark:text-[#f4f4f5] dark:border-[#3f3f46] text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
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

            {/* Widget 2: Date & Academic Week Calendar Card (Image 1) */}
            <div className="card p-5 bg-neutral-bg2/90 border border-border-default rounded-2xl shadow-md flex flex-col gap-1.5">
              <h3 className="text-lg sm:text-xl font-black text-text-primary m-0">
                {dayName}
              </h3>
              <div className="text-xs sm:text-sm font-semibold text-brand-light">
                {formattedDate}
              </div>
              <div className="mt-4 flex items-center gap-3 rounded-xl bg-[#f4f4f5] dark:bg-zinc-800/80 px-3.5 py-2.5">
                <span className="w-1.5 h-5 rounded-full bg-[#dc2626] shrink-0" />
                <span className="text-sm font-medium text-[var(--color-text-primary)]">
                  {t('home.academic_week', { week: academicWeek })}
                </span>
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
                  {displayedAnnouncements.slice(0, 3).map((item, idx) => {
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
                className="w-full py-2.5 px-3 rounded-xl bg-[#f4f4f5] hover:bg-[#e4e4e7] text-[#18181b] border border-[#e4e4e7] dark:bg-[#27272a] dark:hover:bg-[#3f3f46] dark:text-[#f4f4f5] dark:border-[#3f3f46] text-xs font-semibold text-center no-underline transition-all block"
              >
                {t('home.view_all_announcements')}
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Popup: Pilih Favorit (Slide-up + Fade-in, Image 4) */}
      {isEditingFavorites && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in-fast"
          onClick={handleCloseEditFavorites}
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-pilih-favorit-title"
        >
          <div
            className="bg-white dark:bg-neutral-bg2 border border-border-default rounded-2xl shadow-2xl max-w-lg w-full max-h-[85dvh] p-4 sm:p-6 flex flex-col gap-4 animate-modal-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header: Title + Close Button */}
            <div className="flex items-center justify-between pb-3 border-b border-border-default/60">
              <h3 id="modal-pilih-favorit-title" className="text-base sm:text-lg font-bold text-text-primary m-0">
                {language === 'en'
                  ? `Pilih Favorit (${tempSelectedKeys.length} terpilih)`
                  : `Pilih Favorit (${tempSelectedKeys.length} terpilih)`}
              </h3>
              <button
                type="button"
                onClick={handleCloseEditFavorites}
                className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-neutral-100 dark:hover:bg-white/5 transition-colors cursor-pointer bg-transparent border-none"
                aria-label="Tutup"
              >
                <X size={18} />
              </button>
            </div>

            {/* Search Input */}
            <div className="relative w-full">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
              <input
                type="text"
                placeholder={language === 'en' ? 'Cari...' : 'Cari...'}
                value={modalSearch}
                onChange={(e) => setModalSearch(e.target.value)}
                className="w-full pl-9 pr-9 py-2 rounded-xl bg-neutral-bg1 dark:bg-neutral-bg3 border border-border-default text-text-primary text-xs sm:text-sm placeholder:text-text-muted focus:outline-none focus:border-brand-light focus:ring-1 focus:ring-brand-light/30 transition-all"
                autoFocus
              />
              {modalSearch && (
                <button
                  type="button"
                  onClick={() => setModalSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-text-muted hover:text-text-primary rounded-md cursor-pointer bg-transparent border-none"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Scrollable List of App Cards (Image 4) */}
            <div className="max-h-[50vh] sm:max-h-80 overflow-y-auto space-y-2.5 pr-1 -mr-1 flex-1 min-h-0">
              {modalFilteredServices.map((service) => {
                const isSelected = tempSelectedKeys.includes(service.key);
                const title = language === 'en' ? service.title_en : service.title;
                const subtitle = language === 'en' ? service.subtitle_en : service.subtitle;

                return (
                  <div
                    key={service.key}
                    onClick={() => handleToggleFavoriteKey(service.key)}
                    className={`flex items-center justify-between p-3.5 rounded-xl border transition-all duration-200 cursor-pointer select-none group ${
                      isSelected
                        ? 'bg-brand/[0.06] border-brand shadow-sm ring-1 ring-brand/20'
                        : 'bg-neutral-bg1/50 dark:bg-white/[0.02] border-border-default hover:bg-neutral-100 dark:hover:bg-white/[0.05] hover:border-border-default/80 opacity-75 hover:opacity-100'
                    }`}
                  >
                    <div className="flex items-center gap-3.5 min-w-0 flex-1">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0 shadow-sm transition-transform group-hover:scale-105 ${
                          isSelected
                            ? 'bg-gradient-to-tr from-brand-hover via-brand to-brand-light text-white'
                            : 'bg-neutral-bg3 border border-border-default text-text-muted'
                        }`}
                      >
                        <ServiceIcon
                          iconName={service.icon}
                          size={18}
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

                    {/* Indicator Checkbox / Check */}
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

            {/* Footer Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-border-default/60 flex-wrap gap-2">
              <div className="flex items-center gap-3">
                <span className="text-[11px] text-text-muted">
                  {language === 'en' ? 'Max 8 favorites' : 'Maksimal 8 favorit'}
                </span>
                <button
                  type="button"
                  onClick={handleResetFavorites}
                  className="text-[11px] text-text-muted hover:text-text-primary underline cursor-pointer bg-transparent border-none p-0"
                >
                  {t('home.modal_fav_reset')}
                </button>
              </div>
              <div className="flex items-center gap-2.5 ml-auto">
                <button
                  type="button"
                  onClick={handleCloseEditFavorites}
                  className="px-4 py-2 rounded-xl text-text-secondary hover:text-text-primary hover:bg-neutral-100 dark:hover:bg-white/5 text-xs font-semibold transition-all cursor-pointer bg-transparent border-none"
                >
                  {language === 'en' ? 'Cancel' : 'Batal'}
                </button>
                <button
                  type="button"
                  onClick={handleSaveFavorites}
                  className="px-5 py-2 rounded-xl bg-brand hover:bg-brand-hover text-white text-xs font-bold transition-all shadow-md cursor-pointer flex items-center gap-1.5"
                >
                  <Check size={14} />
                  <span>{language === 'en' ? 'Save' : 'Simpan'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>

  );
}

export default Beranda;
