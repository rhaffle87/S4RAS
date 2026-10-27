import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useKeycloak } from '../context/KeycloakContext';
import { 
  Home, User, Megaphone, Shield, LogOut, Menu, X, Settings, ChevronDown, Phone, Search,
  Terminal, BookOpen, GraduationCap 
} from 'lucide-react';
import CommandPalette from './CommandPalette';
import SystemAlertBanner from './SystemAlertBanner';
import { useThemeLanguage } from '../context/ThemeLanguageContext';

const SoftphoneModal = React.lazy(() => import('./SoftphoneModal'));

const NAV_ITEMS = [
  { to: '/home', label: 'Beranda', icon: Home },
  { to: '/akun', label: 'Akun', icon: User },
  { to: '/pengumuman', label: 'Pengumuman', icon: Megaphone },
  { to: '/pengaturan', label: 'Pengaturan Web', icon: Settings },
  { to: '/admin', label: 'Admin', icon: Shield },
];

function Layout({ children }) {
  const { logout, persona, roleLabel, profile, isAdmin, sipExtension } = useKeycloak();
  const { language, setLanguage, t } = useThemeLanguage();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [phoneOpen, setPhoneOpen] = useState(false);
  const [customAvatar, setCustomAvatar] = useState(() => {
    return typeof window !== 'undefined' ? localStorage.getItem('s4ras_user_avatar') : null;
  });

  // Canonical navigation items - filtered strictly by role access (RBAC)
  const visibleNavItems = useMemo(() => {
    return NAV_ITEMS.filter((item) => {
      if (item.to === '/admin') return Boolean(isAdmin);
      return true;
    });
  }, [isAdmin]);

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  // Close modals on Escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        if (mobileOpen) setMobileOpen(false);
        if (langOpen) setLangOpen(false);
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [mobileOpen, langOpen]);

  // Listen for global campus phone open and storage events
  useEffect(() => {
    const handleOpenPhone = () => {
      setPhoneOpen(true);
    };
    const handleStorage = () => {
      setCustomAvatar(localStorage.getItem('s4ras_user_avatar'));
    };
    window.addEventListener('open-campus-phone', handleOpenPhone);
    window.addEventListener('storage', handleStorage);
    return () => {
      window.removeEventListener('open-campus-phone', handleOpenPhone);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  const toggleMobile = useCallback(() => {
    setMobileOpen((prev) => !prev);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const getInitials = () => {
    if (profile?.firstName) {
      return (profile.firstName[0] + (profile.lastName?.[0] || '')).toUpperCase();
    }
    return (profile?.username?.[0] || 'U').toUpperCase();
  };

  const getNavLabel = (path) => {
    if (path === '/home') return t('nav.home');
    if (path === '/akun') return t('nav.account');
    if (path === '/pengumuman') return t('nav.announcements');
    if (path === '/pengaturan') return t('nav.settings');
    if (path === '/admin') return t('nav.admin');
    return '';
  };

  const PersonaIcon = persona === 'dev' ? Terminal : persona === 'teacher' ? BookOpen : GraduationCap;
  const username = profile?.firstName
    ? `${profile.firstName} ${profile.lastName || ''}`.trim()
    : profile?.username || 'Pengguna S4RAS';

  return (
    <>
      {/* Skip-to-content link (a11y) */}
      <a href="#main-content" className="absolute top-[-100%] focus:top-4 left-4 z-[100] px-4 py-2 bg-brand text-white rounded-md font-semibold transition-[top] duration-200">
        {language === 'en' ? 'Skip to main content' : 'Langsung ke konten utama'}
      </a>

      <div className="flex h-screen bg-neutral-bg1 relative overflow-hidden z-1">
        {/* Ambient background glows — active only in dark mode on desktop */}
        <div className="ambient-glow hidden dark:lg:block fixed rounded-full pointer-events-none z-[-1] top-[10%] left-[-250px] w-[800px] h-[800px] bg-[radial-gradient(circle,rgba(239,68,68,0.14)_0%,transparent_80%)] animate-pulse-glow-1" aria-hidden="true" />
        <div className="ambient-glow hidden dark:lg:block fixed rounded-full pointer-events-none z-[-1] bottom-[-200px] right-[-200px] w-[900px] h-[900px] bg-[radial-gradient(circle,rgba(239,68,68,0.09)_0%,transparent_80%)] animate-pulse-glow-2" aria-hidden="true" />

        {/* Mobile backdrop overlay */}
        {mobileOpen && (
          <div
            className="lg:hidden fixed inset-0 bg-black/75 z-45"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
        )}

        {/* Full-Height Desktop / Responsive Sidebar */}
        <aside
          id="sidebar-nav"
          className={`w-72 max-w-[85vw] lg:w-[260px] xl:w-[275px] bg-neutral-bg2 border-r border-border-default flex flex-col justify-between p-5 h-full transition-transform duration-300 ease-in-out z-50 fixed top-0 bottom-0 left-0 lg:static ${
            mobileOpen
              ? 'translate-x-0 shadow-[10px_0_35px_rgba(0,0,0,0.5)]'
              : 'max-lg:-translate-x-full shadow-none pointer-events-none lg:pointer-events-auto'
          }`}
          role="navigation"
          aria-label="Navigasi utama"
        >
          <div className="flex flex-col gap-6">
            {/* Clickable Brand Logo linking to portal */}
            <div className="flex items-center justify-between pt-2 pb-2">
              <a
                href="/home"
                className="flex items-center gap-2.5 no-underline group focus:outline-none"
                title="myS4RAS Portal"
              >
                <svg viewBox="0 0 100 100" className="w-7 h-7 shrink-0" aria-hidden="true">
                  <rect x="4" y="4" width="92" height="92" rx="22" fill="#dc2626"/>
                  <g stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" opacity="0.45">
                    <line x1="46" y1="34" x2="56" y2="34"/>
                    <line x1="34" y1="46" x2="34" y2="56"/>
                    <line x1="56" y1="68" x2="46" y2="68"/>
                    <line x1="68" y1="56" x2="68" y2="46"/>
                  </g>
                  <rect x="22" y="22" width="24" height="24" rx="7" fill="#ffffff"/>
                  <rect x="22" y="56" width="24" height="24" rx="7" fill="#ffffff"/>
                  <rect x="56" y="56" width="24" height="24" rx="7" fill="#ffffff"/>
                  <circle cx="68" cy="34" r="14" fill="none" stroke="#ffffff" strokeWidth="3" opacity="0.6"/>
                  <circle cx="68" cy="34" r="8" fill="#ffffff"/>
                  <circle cx="68" cy="34" r="3" fill="#dc2626"/>
                </svg>
                <span className="text-xl font-bold tracking-tight text-text-primary">
                  my<span className="text-brand-light">S4RAS</span> Portal
                </span>
              </a>

              {/* Close button for mobile drawer */}
              <button
                className="lg:hidden p-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-white/5 transition-colors"
                onClick={() => setMobileOpen(false)}
                aria-label="Tutup menu navigasi"
              >
                <X size={20} />
              </button>
            </div>

            {/* User Profile Snippet inside Drawer (Mobile only) */}
            <div className="lg:hidden flex items-center gap-3 p-3 rounded-xl bg-neutral-bg3/70 border border-border-default">
              {customAvatar ? (
                <img
                  src={customAvatar}
                  alt={username}
                  className="w-10 h-10 rounded-full object-cover shadow-sm border border-white/20 shrink-0"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-light to-brand text-white text-sm font-bold flex items-center justify-center shrink-0 shadow-sm">
                  {getInitials()}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="text-xs font-bold text-text-primary truncate">{username}</div>
                <div className="flex items-center gap-1 text-[11px] text-text-secondary mt-0.5">
                  <PersonaIcon size={11} className="text-brand-light shrink-0" />
                  <span className="truncate">{roleLabel || t('role.' + (persona || 'student'))}</span>
                </div>
              </div>
            </div>

            {/* Nav Menu Items */}
            <nav className="flex flex-col gap-1.5" aria-label="Menu navigasi">
              {visibleNavItems.map(({ to, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  className={({ isActive }) =>
                    `flex items-center gap-3.5 px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                      isActive 
                        ? 'bg-brand text-white font-semibold shadow-[0_4px_16px_rgba(185,28,28,0.35)]' 
                        : 'text-text-secondary hover:bg-white/5 hover:text-text-primary'
                    }`
                  }
                  aria-current={location.pathname === to ? 'page' : undefined}
                >
                  <Icon size={18} className="shrink-0" aria-hidden="true" />
                  <span>{getNavLabel(to)}</span>
                </NavLink>
              ))}
            </nav>
          </div>

          {/* Bottom Sidebar Block: Language switcher (mobile) & Logout */}
          <div className="pt-4 mt-auto border-t border-border-default/60 flex flex-col gap-3">
            <div className="lg:hidden flex items-center justify-between px-2 py-1 text-xs">
              <span className="text-text-secondary font-medium">Bahasa / Language</span>
              <div className="inline-flex rounded-lg border border-border-default p-0.5 bg-neutral-bg3">
                <button
                  type="button"
                  onClick={() => setLanguage('id')}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${language === 'id' ? 'bg-brand text-white' : 'text-text-secondary hover:text-text-primary'}`}
                >
                  ID
                </button>
                <button
                  type="button"
                  onClick={() => setLanguage('en')}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${language === 'en' ? 'bg-brand text-white' : 'text-text-secondary hover:text-text-primary'}`}
                >
                  EN
                </button>
              </div>
            </div>

            <button
              className="flex items-center gap-3.5 px-4 py-2.5 text-status-error hover:bg-red-500/10 text-sm font-medium rounded-xl bg-transparent border-none w-full text-left cursor-pointer transition-all duration-200"
              onClick={logout}
              aria-label={t('nav.logout')}
            >
              <LogOut size={18} aria-hidden="true" />
              <span>{t('nav.logout')}</span>
            </button>
          </div>
        </aside>

        {/* Content View Container (TopBar + Page View + Campus Footer) */}
        <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden relative">
          {/* Confined Top Bar (Spans right content area only) */}
          <header className="sticky top-0 h-16 bg-neutral-bg2 border-b border-border-default flex items-center justify-between px-3 sm:px-6 lg:px-8 z-30 shrink-0 overflow-x-clip">
            {/* Mobile Hamburger & Title */}
            <div className="flex items-center gap-2 sm:gap-3 shrink-0 min-w-0">
              <button
                className="lg:hidden w-9 h-9 flex items-center justify-center bg-transparent border-none text-text-primary cursor-pointer p-0 rounded-lg transition-colors hover:bg-white/5 active:scale-95 shrink-0"
                onClick={toggleMobile}
                aria-label={mobileOpen ? 'Tutup menu' : 'Buka menu'}
                aria-expanded={mobileOpen}
                aria-controls="sidebar-nav"
              >
                <Menu size={20} />
              </button>
              <svg viewBox="0 0 100 100" className="lg:hidden w-6 h-6 shrink-0" aria-hidden="true">
                <rect x="4" y="4" width="92" height="92" rx="22" fill="#dc2626"/>
                <g stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" opacity="0.45">
                  <line x1="46" y1="34" x2="56" y2="34"/>
                  <line x1="34" y1="46" x2="34" y2="56"/>
                  <line x1="56" y1="68" x2="46" y2="68"/>
                  <line x1="68" y1="56" x2="68" y2="46"/>
                </g>
                <rect x="22" y="22" width="24" height="24" rx="7" fill="#ffffff"/>
                <rect x="22" y="56" width="24" height="24" rx="7" fill="#ffffff"/>
                <rect x="56" y="56" width="24" height="24" rx="7" fill="#ffffff"/>
                <circle cx="68" cy="34" r="14" fill="none" stroke="#ffffff" strokeWidth="3" opacity="0.6"/>
                <circle cx="68" cy="34" r="8" fill="#ffffff"/>
                <circle cx="68" cy="34" r="3" fill="#dc2626"/>
              </svg>
              <span className="lg:hidden text-sm sm:text-base font-bold text-text-primary whitespace-nowrap">
                my<span className="text-brand-light">S4RAS</span><span className="hidden sm:inline"> Portal</span>
              </span>
            </div>

            {/* Right TopBar Actions: Harmonious h-9 rounded-full pills */}
            <div className="flex items-center gap-1.5 sm:gap-2.5 sm:gap-3 ml-auto shrink-0">
              {/* Command palette trigger (Ctrl/Cmd+K) */}
              <button
                type="button"
                onClick={() => window.dispatchEvent(new Event('open-command-palette'))}
                className="h-9 w-9 p-0 justify-center sm:w-auto sm:px-3.5 rounded-full text-xs font-medium inline-flex items-center gap-2 border transition-all bg-[var(--color-neutral-bg2)] text-[var(--color-text-secondary)] border-[var(--color-border-default)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-neutral-bg3)] cursor-pointer shrink-0"
                aria-label={language === 'en' ? 'Search pages and services' : 'Cari halaman dan layanan'}
                aria-keyshortcuts="Control+K Meta+K"
              >
                <Search size={14} aria-hidden="true" />
                <span className="hidden sm:inline">{language === 'en' ? 'Search' : 'Cari'}</span>
                <kbd className="hidden sm:inline font-mono text-[10px] border border-[var(--color-border-default)] rounded px-1.5 py-0.5 opacity-80">
                  {typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform || '') ? '⌘K' : 'Ctrl K'}
                </kbd>
              </button>

              {/* Language Dropdown (Hidden on mobile, available in drawer) */}
              <div className="relative shrink-0 hidden sm:flex">
                <button
                  type="button"
                  className="h-9 px-2.5 sm:px-3.5 rounded-full text-xs font-semibold inline-flex items-center gap-1 sm:gap-1.5 border transition-all bg-[var(--color-neutral-bg2)] text-[var(--color-text-secondary)] border-[var(--color-border-default)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-neutral-bg3)] cursor-pointer"
                  onClick={() => setLangOpen(!langOpen)}
                  aria-expanded={langOpen}
                  aria-haspopup="listbox"
                  aria-label="Pilih Bahasa"
                >
                  <span>{language.toUpperCase()}</span>
                  <ChevronDown size={13} />
                </button>

                {langOpen && (
                  <ul className="absolute top-[120%] right-0 z-50 bg-neutral-bg2 border border-border-default rounded-xl p-1 shadow-[0_10px_25px_rgba(0,0,0,0.5)] list-none m-0 min-w-[130px]" role="listbox">
                    <li
                      className={`px-3 py-2 text-[0.8125rem] cursor-pointer rounded-lg transition-all ${language === 'id' ? 'text-brand-light bg-brand-subtle font-semibold' : 'text-text-secondary hover:bg-neutral-bg3 hover:text-text-primary'}`}
                      onClick={() => { setLanguage('id'); setLangOpen(false); }}
                      role="option"
                      aria-selected={language === 'id'}
                    >
                      ID (Bahasa)
                    </li>
                    <li
                      className={`px-3 py-2 text-[0.8125rem] cursor-pointer rounded-lg transition-all ${language === 'en' ? 'text-brand-light bg-brand-subtle font-semibold' : 'text-text-secondary hover:bg-neutral-bg3 hover:text-text-primary'}`}
                      onClick={() => { setLanguage('en'); setLangOpen(false); }}
                      role="option"
                      aria-selected={language === 'en'}
                    >
                      EN (English)
                    </li>
                  </ul>
                )}
              </div>

              {/* In-Browser WebRTC Softphone Button */}
              <button
                type="button"
                onClick={() => setPhoneOpen(true)}
                className="h-9 px-2.5 sm:px-3.5 rounded-full text-xs font-semibold inline-flex items-center gap-1.5 sm:gap-2 border transition-all bg-[var(--color-neutral-bg2)] hover:bg-[var(--color-neutral-bg3)] text-[var(--color-text-primary)] border-[var(--color-border-default)] cursor-pointer active:scale-95 shadow-sm shrink-0"
                title="Buka S4RAS WebPhone"
                aria-label="WebPhone"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                <Phone size={13} className="text-[var(--color-text-secondary)] shrink-0" />
                <span className="hidden md:inline">WebPhone</span>
                <span className="font-mono text-[11px] text-[var(--color-text-secondary)]">
                  {sipExtension || '1001'}
                </span>
              </button>

              {/* Persona / Role Badge */}
              <div 
                className="hidden md:inline-flex items-center shrink-0"
                title={language === 'en'
                  ? `Role Persona: ${t('role.' + (persona || 'student'))}`
                  : `Peran Persona: ${t('role.' + (persona || 'student'))}`
                }
              >
                <span className="h-9 px-3.5 rounded-full text-xs font-semibold inline-flex items-center gap-2 border transition-all bg-[var(--color-neutral-bg2)] text-[var(--color-text-primary)] border-[var(--color-border-default)] shadow-sm">
                  <PersonaIcon size={13} className="text-[#dc2626] shrink-0" />
                  <span>{t('role.' + (persona || 'student')) || roleLabel || (persona === 'dev' ? 'Administrator' : persona === 'teacher' ? 'Dosen' : 'Mahasiswa')}</span>
                </span>
              </div>

              {/* User Avatar Circle */}
              <NavLink to="/akun" className="flex items-center shrink-0 no-underline" title={profile?.email || 'Profil Akun'}>
                {customAvatar ? (
                  <img
                    src={customAvatar}
                    alt={username}
                    className="w-8 h-8 sm:w-9 sm:h-9 rounded-full object-cover shadow-[0_2px_10px_rgba(185,28,28,0.25)] border border-white/20 hover:scale-105 transition-transform shrink-0"
                  />
                ) : (
                  <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gradient-to-br from-brand-light to-brand text-white flex items-center justify-center shadow-[0_2px_10px_rgba(185,28,28,0.3)] border border-white/20 hover:scale-105 transition-transform shrink-0">
                    <User size={16} className="text-white" />
                  </div>
                )}
              </NavLink>
            </div>
          </header>

          {/* System Alert Banner (DevOps alerts restricted to administrators) */}
          {Boolean(isAdmin) && <SystemAlertBanner />}

          {/* Main Scrollable View Area */}
          <main id="main-content" className="flex-1 overflow-y-auto box-border flex flex-col justify-between" tabIndex={-1}>
            <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 flex-1">
              {children}
            </div>

            {/* Bottom S4RAS Branding Footer */}
            <footer className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-5 border-t border-border-default/40 flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left text-xs text-text-muted select-none mt-auto">
              <div>© 2026 S4RAS — Solution for Remote Area Services</div>
              <div className="flex items-center gap-3">
                <span className="font-bold tracking-wider text-[11px] text-text-secondary uppercase">EMPOWERING 3T COMMUNITIES</span>
                <div className="flex items-center gap-1.5 text-text-primary">
                  <svg className="w-5 h-5 shrink-0" viewBox="0 0 100 100" fill="none" aria-hidden="true">
                    <rect x="4" y="4" width="92" height="92" rx="22" fill="#dc2626"/>
                    <g stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" opacity="0.45">
                      <line x1="46" y1="34" x2="56" y2="34"/>
                      <line x1="34" y1="46" x2="34" y2="56"/>
                      <line x1="56" y1="68" x2="46" y2="68"/>
                      <line x1="68" y1="56" x2="68" y2="46"/>
                    </g>
                    <rect x="22" y="22" width="24" height="24" rx="7" fill="#ffffff"/>
                    <rect x="22" y="56" width="24" height="24" rx="7" fill="#ffffff"/>
                    <rect x="56" y="56" width="24" height="24" rx="7" fill="#ffffff"/>
                    <circle cx="68" cy="34" r="14" fill="none" stroke="#ffffff" strokeWidth="3" opacity="0.6"/>
                    <circle cx="68" cy="34" r="8" fill="#ffffff"/>
                    <circle cx="68" cy="34" r="3" fill="#dc2626"/>
                  </svg>
                  <span className="font-black text-xs tracking-tight text-text-primary">S4RAS</span>
                </div>
              </div>
            </footer>
          </main>
        </div>

        {/* WebRTC Softphone Modal — lazy loaded on demand */}
        {phoneOpen && (
          <React.Suspense fallback={null}>
            <SoftphoneModal isOpen={phoneOpen} onClose={() => setPhoneOpen(false)} />
          </React.Suspense>
        )}
        <CommandPalette navItems={visibleNavItems} language={language} isAdmin={Boolean(isAdmin)} />
      </div>
    </>
  );
}

export default Layout;

