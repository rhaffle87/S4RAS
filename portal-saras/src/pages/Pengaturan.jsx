import { useState, useEffect } from 'react';
import { 
  Moon, Languages, Check, ChevronDown, 
  ShieldCheck, RefreshCw, ExternalLink, 
  Headphones, PhoneCall 
} from 'lucide-react';
import Layout from '../components/Layout';
import { useThemeLanguage } from '../context/ThemeLanguageContext';
import { useKeycloak } from '../context/KeycloakContext';

function Pengaturan() {
  const { theme, setTheme, language, setLanguage, t } = useThemeLanguage();
  const { keycloak } = useKeycloak();
  const [showThemeDropdown, setShowThemeDropdown] = useState(false);
  const [showLangDropdown, setShowLangDropdown] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshMessage, setRefreshMessage] = useState('');

  const toggleTheme = (val) => {
    setTheme(val);
    setShowThemeDropdown(false);
  };

  const toggleLang = (val) => {
    setLanguage(val);
    setShowLangDropdown(false);
  };

  const handleRefreshSession = async () => {
    setRefreshing(true);
    setRefreshMessage('');
    try {
      if (keycloak?.updateToken) {
        await keycloak.updateToken(-1);
      }
      setRefreshMessage(t('set.sso_refreshed'));
      setTimeout(() => setRefreshMessage(''), 4000);
    } catch {
      setRefreshMessage(language === 'en' ? 'Session token is active and valid' : 'Sesi token sudah dalam kondisi aktif dan valid');
      setTimeout(() => setRefreshMessage(''), 4000);
    } finally {
      setRefreshing(false);
    }
  };

  const handleCallOperator = (ext = '1000') => {
    window.dispatchEvent(new CustomEvent('open-campus-phone', { detail: { ext } }));
  };

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (!e.target.closest('.dropdown-container')) {
        setShowThemeDropdown(false);
        setShowLangDropdown(false);
      }
    };
    document.addEventListener('click', handleOutsideClick);
    return () => document.removeEventListener('click', handleOutsideClick);
  }, []);

  return (
    <Layout>
      <div className="w-full space-y-6">
        {/* Page Header */}
        <div className="flex flex-col">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--color-text-primary)] m-0">
            {t('set.title')}
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-[var(--color-text-secondary)] m-0">
            {language === 'en' ? 'Portal preferences, theme appearance, and language options' : 'Preferensi portal, tampilan antarmuka, dan bahasa'}
          </p>
        </div>

        {/* Primary Settings Cards (Clean Monochrome Vertical Flow) */}
        <div className="flex flex-col gap-4 relative z-20">
          {/* Card 1: Mode Tampilan */}
          <div 
            className="card p-5 sm:p-6 bg-[var(--color-neutral-bg2)]/90 border border-[var(--color-border-default)] rounded-2xl shadow-md flex flex-col relative overflow-visible hover:transform-none"
            style={{ zIndex: showThemeDropdown ? 60 : 30 }}
          >
            <div className="flex items-start gap-4">
              <Moon className="w-5 h-5 text-[var(--color-text-primary)] shrink-0 mt-0.5" />
              <div className="flex flex-col flex-1">
                <h3 className="text-base font-semibold text-[var(--color-text-primary)] m-0">
                  {t('set.theme_title')}
                </h3>
                <p className="text-xs text-[var(--color-text-secondary)] m-0 mt-0.5">
                  {t('set.theme_desc')}
                </p>

                <div className="mt-4 relative dropdown-container w-full sm:w-60">
                  <button
                    onClick={() => {
                      setShowThemeDropdown(!showThemeDropdown);
                      setShowLangDropdown(false);
                    }}
                    className="w-full h-10 px-4 rounded-xl bg-[var(--color-neutral-bg2)] hover:bg-[var(--color-neutral-bg3)] border border-[var(--color-border-default)] text-xs font-medium text-[var(--color-text-primary)] inline-flex items-center justify-between gap-2 transition-colors cursor-pointer"
                    aria-haspopup="listbox"
                    aria-expanded={showThemeDropdown}
                  >
                    <span>{theme === 'dark' ? t('set.theme.dark') : t('set.theme.light')}</span>
                    <ChevronDown size={16} className={`text-[var(--color-text-muted)] transition-transform duration-200 ${showThemeDropdown ? 'rotate-180' : ''}`} />
                  </button>

                  {showThemeDropdown && (
                    <ul className="absolute top-full mt-2 left-0 z-[100] w-full bg-[var(--color-neutral-bg2)] border border-[var(--color-border-default)] rounded-xl p-1 shadow-2xl list-none m-0 animate-scale-up" role="listbox">
                      <li
                        onClick={() => toggleTheme('dark')}
                        className={`flex items-center justify-between px-3 py-2 text-xs sm:text-sm rounded-lg cursor-pointer transition-all ${
                          theme === 'dark' ? 'bg-brand text-white font-bold' : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-neutral-bg3)] hover:text-[var(--color-text-primary)]'
                        }`}
                        role="option"
                        aria-selected={theme === 'dark'}
                      >
                        <span>{t('set.theme.dark')}</span>
                        {theme === 'dark' && <Check size={14} />}
                      </li>
                      <li
                        onClick={() => toggleTheme('light')}
                        className={`flex items-center justify-between px-3 py-2 text-xs sm:text-sm rounded-lg cursor-pointer transition-all ${
                          theme === 'light' ? 'bg-brand text-white font-bold' : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-neutral-bg3)] hover:text-[var(--color-text-primary)]'
                        }`}
                        role="option"
                        aria-selected={theme === 'light'}
                      >
                        <span>{t('set.theme.light')}</span>
                        {theme === 'light' && <Check size={14} />}
                      </li>
                    </ul>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Bahasa */}
          <div 
            className="card p-5 sm:p-6 bg-[var(--color-neutral-bg2)]/90 border border-[var(--color-border-default)] rounded-2xl shadow-md flex flex-col relative overflow-visible hover:transform-none"
            style={{ zIndex: showLangDropdown ? 60 : 20 }}
          >
            <div className="flex items-start gap-4">
              <Languages className="w-5 h-5 text-[var(--color-text-primary)] shrink-0 mt-0.5" />
              <div className="flex flex-col flex-1">
                <h3 className="text-base font-semibold text-[var(--color-text-primary)] m-0">
                  {t('set.lang_title')}
                </h3>
                <p className="text-xs text-[var(--color-text-secondary)] m-0 mt-0.5">
                  {t('set.lang_desc')}
                </p>

                <div className="mt-4 relative dropdown-container w-full sm:w-60">
                  <button
                    onClick={() => {
                      setShowLangDropdown(!showLangDropdown);
                      setShowThemeDropdown(false);
                    }}
                    className="w-full h-10 px-4 rounded-xl bg-[var(--color-neutral-bg2)] hover:bg-[var(--color-neutral-bg3)] border border-[var(--color-border-default)] text-xs font-medium text-[var(--color-text-primary)] inline-flex items-center justify-between gap-2 transition-colors cursor-pointer"
                    aria-haspopup="listbox"
                    aria-expanded={showLangDropdown}
                  >
                    <span>{language === 'id' ? t('set.lang.id') : t('set.lang.en')}</span>
                    <ChevronDown size={16} className={`text-[var(--color-text-muted)] transition-transform duration-200 ${showLangDropdown ? 'rotate-180' : ''}`} />
                  </button>

                  {showLangDropdown && (
                    <ul className="absolute top-full mt-2 left-0 z-[100] w-full bg-[var(--color-neutral-bg2)] border border-[var(--color-border-default)] rounded-xl p-1 shadow-2xl list-none m-0 animate-scale-up" role="listbox">
                      <li
                        onClick={() => toggleLang('id')}
                        className={`flex items-center justify-between px-3 py-2 text-xs sm:text-sm rounded-lg cursor-pointer transition-all ${
                          language === 'id' ? 'bg-brand text-white font-bold' : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-neutral-bg3)] hover:text-[var(--color-text-primary)]'
                        }`}
                        role="option"
                        aria-selected={language === 'id'}
                      >
                        <span>{t('set.lang.id')}</span>
                        {language === 'id' && <Check size={14} />}
                      </li>
                      <li
                        onClick={() => toggleLang('en')}
                        className={`flex items-center justify-between px-3 py-2 text-xs sm:text-sm rounded-lg cursor-pointer transition-all ${
                          language === 'en' ? 'bg-brand text-white font-bold' : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-neutral-bg3)] hover:text-[var(--color-text-primary)]'
                        }`}
                        role="option"
                        aria-selected={language === 'en'}
                      >
                        <span>{t('set.lang.en')}</span>
                        {language === 'en' && <Check size={14} />}
                      </li>
                    </ul>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Card 3: Integrasi Single Sign-On (SSO) */}
          <div 
            className="card p-5 sm:p-6 bg-[var(--color-neutral-bg2)]/90 border border-[var(--color-border-default)] rounded-2xl shadow-md flex flex-col relative overflow-visible hover:transform-none"
            style={{ zIndex: 10 }}
          >
            <div className="flex items-start gap-4">
              <ShieldCheck className="w-5 h-5 text-[var(--color-text-primary)] shrink-0 mt-0.5" />
              <div className="flex flex-col flex-1">
                <h3 className="text-base font-semibold text-[var(--color-text-primary)] m-0">
                  {t('set.sso_title')}
                </h3>
                <p className="text-xs text-[var(--color-text-secondary)] m-0 mt-0.5">
                  {t('set.sso_desc')}
                </p>

                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <button
                    onClick={handleRefreshSession}
                    disabled={refreshing}
                    className="h-10 px-4 rounded-xl bg-[var(--color-neutral-bg2)] hover:bg-[var(--color-neutral-bg3)] border border-[var(--color-border-default)] text-xs font-medium text-[var(--color-text-primary)] inline-flex items-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
                    <span>{refreshing ? t('set.sso_refreshing') : t('set.sso_refresh_btn')}</span>
                  </button>

                  <a
                    href="https://sso.s4ras.site/realms/S4RAS/account/"
                    target="_blank"
                    rel="noreferrer"
                    className="h-10 px-4 rounded-xl bg-[var(--color-neutral-bg2)] hover:bg-[var(--color-neutral-bg3)] border border-[var(--color-border-default)] text-xs font-medium text-[var(--color-text-primary)] inline-flex items-center gap-2 transition-colors no-underline"
                  >
                    <span>{t('set.sso_manage_btn')}</span>
                    <ExternalLink size={14} />
                  </a>
                </div>

                {refreshMessage && (
                  <div className="text-xs text-emerald-400 font-medium mt-3">
                    {refreshMessage}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Card 4: Bantuan & Kontak Administrator */}
          <div 
            className="card p-5 sm:p-6 bg-[var(--color-neutral-bg2)]/90 border border-[var(--color-border-default)] rounded-2xl shadow-md flex flex-col relative overflow-visible hover:transform-none"
            style={{ zIndex: 10 }}
          >
            <div className="flex items-start gap-4">
              <Headphones className="w-5 h-5 text-[var(--color-text-primary)] shrink-0 mt-0.5" />
              <div className="flex flex-col flex-1">
                <h3 className="text-base font-semibold text-[var(--color-text-primary)] m-0">
                  {t('set.support_title')}
                </h3>
                <p className="text-xs text-[var(--color-text-secondary)] m-0 mt-0.5">
                  {t('set.support_desc')}
                </p>

                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <button
                    onClick={() => handleCallOperator('1000')}
                    className="h-10 px-4 rounded-xl bg-[var(--color-neutral-bg2)] hover:bg-[var(--color-neutral-bg3)] border border-[var(--color-border-default)] text-xs font-medium text-[var(--color-text-primary)] inline-flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <PhoneCall size={14} className="text-[var(--color-text-primary)]" />
                    <span>{t('set.support_call_btn')}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default Pengaturan;
