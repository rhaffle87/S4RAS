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

      <div className="flex h-screen bg-transparent relative overflow-hidden z-1">
        {/* Ambient background glows */}
        <div className="ambient-glow fixed rounded-full pointer-events-none z-[-1] top-[10%] left-[-250px] w-[800px] h-[800px] bg-[radial-gradient(circle,rgba(239,68,68,0.14)_0%,transparent_80%)] light:bg-[radial-gradient(circle,rgba(239,68,68,0.05)_0%,transparent_80%)] animate-pulse-glow-1" aria-hidden="true" />
        <div className="ambient-glow fixed rounded-full pointer-events-none z-[-1] bottom-[-200px] right-[-200px] w-[900px] h-[900px] bg-[radial-gradient(circle,rgba(239,68,68,0.09)_0%,transparent_80%)] light:bg-[radial-gradient(circle,rgba(239,68,68,0.03)_0%,transparent_80%)] animate-pulse-glow-2" aria-hidden="true" />

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
          className={`w-[260px] xl:w-[275px] bg-neutral-bg2 border-r border-border-default flex flex-col justify-between p-5 h-full transition-transform duration-300 ease-in-out z-50 fixed top-0 bottom-0 left-0 lg:static max-lg:shadow-[10px_0_35px_rgba(0,0,0,0.6)] ${mobileOpen ? 'translate-x-0' : 'max-lg:-translate-x-full'}`}
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
                  <g stroke="#ffffff" strokeWidth="3.2" strokeLinecap="round" opacity="0.65">
                    <line x1="40.5" y1="35" x2="58.5" y2="35"/>
                    <line x1="35" y1="40.5" x2="35" y2="58.5"/>
                    <line x1="65" y1="40.5" x2="65" y2="58.5"/>
                    <line x1="40.5" y1="65" x2="58.5" y2="65"/>
                  </g>
                  <circle cx="35" cy="35" r="9.5" fill="#ffffff"/>
                  <circle cx="65" cy="35" r="7" fill="none" stroke="#ffffff" strokeWidth="3"/>
                  <circle cx="35" cy="65" r="7" fill="none" stroke="#ffffff" strokeWidth="3"/>
                  <circle cx="65" cy="65" r="7" fill="none" stroke="#ffffff" strokeWidth="3"/>
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

          {/* Bottom Sidebar Block: Logout */}
          <div className="pt-4 mt-auto border-t border-border-default/60">
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
          <header className="sticky top-0 h-16 bg-neutral-bg1 light:bg-white border-b border-border-default flex items-center justify-between px-4 sm:px-6 lg:px-8 z-30 shrink-0">
            {/* Mobile Hamburger & Title */}
            <div className="flex items-center gap-3">
              <button
                className="lg:hidden bg-transparent border-none text-text-primary cursor-pointer p-2 rounded-lg transition-colors hover:bg-white/5 active:scale-95"
                onClick={toggleMobile}
                aria-label={mobileOpen ? 'Tutup menu' : 'Buka menu'}
                aria-expanded={mobileOpen}
                aria-controls="sidebar-nav"
              >
                <Menu size={22} />
              </button>
              <svg viewBox="0 0 100 100" className="lg:hidden w-6 h-6 shrink-0" aria-hidden="true">
                <rect x="4" y="4" width="92" height="92" rx="22" fill="#dc2626"/>
                <g stroke="#ffffff" strokeWidth="3.2" strokeLinecap="round" opacity="0.65">
                  <line x1="40.5" y1="35" x2="58.5" y2="35"/>
                  <line x1="35" y1="40.5" x2="35" y2="58.5"/>
                  <line x1="65" y1="40.5" x2="65" y2="58.5"/>
                  <line x1="40.5" y1="65" x2="58.5" y2="65"/>
                </g>
                <circle cx="35" cy="35" r="9.5" fill="#ffffff"/>
                <circle cx="65" cy="35" r="7" fill="none" stroke="#ffffff" strokeWidth="3"/>
                <circle cx="35" cy="65" r="7" fill="none" stroke="#ffffff" strokeWidth="3"/>
                <circle cx="65" cy="65" r="7" fill="none" stroke="#ffffff" strokeWidth="3"/>
              </svg>
              <span className="lg:hidden text-base font-bold text-text-primary">
                my<span className="text-brand-light">S4RAS</span> Portal
              </span>
            </div>

            {/* Right TopBar Actions: Language, Softphone, Persona Badge, Avatar */}
            <div className="flex items-center gap-2.5 sm:gap-4 ml-auto">
              {/* Command palette trigger (Ctrl/Cmd+K) */}
              <button
                type="button"
                onClick={() => window.dispatchEvent(new Event('open-command-palette'))}
                className="flex items-center gap-2 bg-white/4 light:bg-black/3 border border-border-default text-text-muted text-xs font-medium px-2.5 py-1.5 sm:px-3 rounded-full cursor-pointer transition-colors duration-200 hover:text-text-primary hover:bg-white/8"
                aria-label={language === 'en' ? 'Search pages and services' : 'Cari halaman dan layanan'}
                aria-keyshortcuts="Control+K Meta+K"
              >
                <Search size={14} aria-hidden="true" />
                <span className="hidden md:inline">{language === 'en' ? 'Search' : 'Cari'}</span>
                <kbd className="hidden md:inline font-mono text-[10px] border border-border-default rounded px-1 py-px">
                  {typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform || '') ? '⌘K' : 'Ctrl K'}
                </kbd>
              </button>

              {/* Language Dropdown */}
              <div className="relative">
                <button
                  className="flex items-center gap-1 sm:gap-1.5 bg-white/4 light:bg-black/3 border border-border-default text-text-secondary text-xs sm:text-[0.8125rem] font-semibold px-2.5 py-1.5 sm:px-3 sm:py-1.5 rounded-full cursor-pointer transition-all duration-200 hover:bg-white/8 hover:text-text-primary"
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
                onClick={() => setPhoneOpen(true)}
                className="flex items-center gap-1.5 bg-brand-subtle/80 hover:bg-brand-subtle border border-brand/30 text-brand-light text-xs font-semibold px-2.5 py-1.5 sm:px-3 sm:py-1.5 rounded-full cursor-pointer transition-all duration-200 active:scale-95 shadow-sm"
                title="Buka S4RAS Campus WebPhone"
                aria-label="Campus Phone"
              >
                <Phone size={13} className="animate-pulse text-emerald-400 shrink-0" />
                <span className="hidden md:inline">Campus Phone</span>
                <span className="hidden sm:inline font-mono text-[11px] opacity-80">
                  ({sipExtension || '1001'})
                </span>
              </button>

              {/* Persona / Role Badge */}
              <div 
                className="hidden sm:flex items-center"
                title={language === 'en'
                  ? `Role Persona: ${t('role.' + (persona || 'student'))}`
                  : `Peran Persona: ${t('role.' + (persona || 'student'))}`
                }
              >
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${
                  persona === 'dev'
                    ? 'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/30'
                    : persona === 'teacher'
                    ? 'bg-rose-100 text-rose-900 border-rose-300 dark:bg-rose-500/15 dark:text-rose-300 dark:border-rose-500/30'
                    : 'bg-emerald-100 text-emerald-900 border-emerald-300 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/30'
                }`}>
                  <PersonaIcon size={12} />
                  <span>{t('role.' + (persona || 'student')) || roleLabel || (persona === 'dev' ? 'Administrator' : persona === 'teacher' ? 'Dosen' : 'Mahasiswa')}</span>
                </span>
              </div>

              {/* User Avatar Circle */}
              <NavLink to="/akun" className="flex items-center shrink-0 no-underline" title={profile?.email || 'Profil Akun'}>
                {customAvatar ? (
                  <img
                    src={customAvatar}
                    alt={username}
                    className="w-8 h-8 sm:w-9 sm:h-9 rounded-full object-cover shadow-[0_2px_10px_rgba(185,28,28,0.25)] border border-white/20 hover:scale-105 transition-transform"
                  />
                ) : (
                  <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gradient-to-br from-brand-light to-brand text-white flex items-center justify-center shadow-[0_2px_10px_rgba(185,28,28,0.3)] border border-white/20 hover:scale-105 transition-transform">
                    <User size={18} className="text-white" />
                  </div>
                )}
              </NavLink>
            </div>
          </header>

          {/* System Alert Banner (DevOps alerts restricted to administrators) */}
          {Boolean(isAdmin) && <SystemAlertBanner />}

          {/* Main Scrollable View Area */}
          <main id="main-content" className="flex-1 overflow-y-auto box-border flex flex-col justify-between" tabIndex={-1}>
            <div className="max-w-[1400px] mx-auto w-full px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-7 pb-24 lg:pb-8 flex-1">
              {children}
            </div>

            {/* Bottom Campus Branding Footer (Matching myITS Screenshots) */}
            <footer className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-5 border-t border-border-default/40 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-text-muted select-none mt-auto">
              <div>© 2026 Institut Teknologi Sepuluh Nopember</div>
              <div className="flex items-center gap-3">
                <span className="font-bold tracking-wider text-[11px] text-text-secondary uppercase">ADVANCING HUMANITY</span>
                <div className="flex items-center gap-1.5 text-text-primary">
                  <svg className="w-5 h-5 text-text-secondary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <circle cx="12" cy="12" r="9" />
                    <circle cx="12" cy="12" r="4" />
                    <circle cx="12" cy="3" r="1.5" fill="currentColor" />
                    <circle cx="12" cy="21" r="1.5" fill="currentColor" />
                    <circle cx="3" cy="12" r="1.5" fill="currentColor" />
                    <circle cx="21" cy="12" r="1.5" fill="currentColor" />
                  </svg>
                  <span className="font-black text-xs tracking-tight text-text-primary">ITS</span>
                </div>
              </div>
            </footer>
          </main>
        </div>

        {/* Mobile Tab Bar (Bottom Thumb Zone < lg) */}
        <nav 
          className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-neutral-bg1 light:bg-white border-t border-border-default flex items-center justify-around py-1.5 px-2 shadow-[0_-4px_25px_rgba(0,0,0,0.4)]"
          role="navigation"
          aria-label="Navigasi bawah seluler"
        >
          {visibleNavItems.map(({ to, icon: Icon }) => (
            <NavLink
              key={`mobile-tab-${to}`}
              to={to}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center min-w-[56px] min-h-[46px] px-2 py-1 rounded-xl transition-all duration-200 cursor-pointer ${
                  isActive 
                    ? 'text-brand-light font-bold' 
                    : 'text-text-secondary hover:text-text-primary'
                }`
              }
              aria-current={location.pathname === to ? 'page' : undefined}
            >
              {({ isActive }) => (
                <>
                  <div className={`relative flex items-center justify-center w-8 h-7 rounded-lg transition-all ${
                    isActive ? 'bg-brand/15 text-brand-light' : 'text-text-secondary'
                  }`}>
                    <Icon size={19} aria-hidden="true" />
                    {isActive && (
                      <span className="absolute -bottom-1 w-1.5 h-1.5 rounded-full bg-brand-light shadow-[0_0_6px_rgba(239,68,68,0.8)]" />
                    )}
                  </div>
                  <span className="text-[10px] tracking-tight mt-0.5 whitespace-nowrap">
                    {getNavLabel(to)}
                  </span>
                </>
              )}
            </NavLink>
          ))}
        </nav>

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

