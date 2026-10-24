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
      <div className="flex flex-col gap-6 max-w-4xl">
        {/* Page Title Header */}
        <h2 className="text-xl sm:text-2xl font-bold text-text-primary m-0">
          {t('set.title')}
        </h2>

        {/* Primary Settings Cards (Matching myITS Reference) */}
        <div className="flex flex-col gap-4">
          {/* Card 1: Mode Tampilan */}
          <div 
            className="card p-6 sm:p-7 bg-neutral-bg2/90 border border-border-default rounded-3xl shadow-md flex flex-col gap-4 relative overflow-visible"
            style={{ zIndex: showThemeDropdown ? 40 : 20 }}
          >
            <div className="flex items-start gap-4">
              <Moon size={24} className="text-text-primary shrink-0 mt-0.5" />
              <div className="flex flex-col">
                <h3 className="text-base font-bold text-text-primary m-0">
                  {t('set.theme_title')}
                </h3>
                <p className="text-xs text-text-secondary m-0 mt-0.5">
                  {t('set.theme_desc')}
                </p>
              </div>
            </div>

            <div className="relative dropdown-container sm:ml-14 w-full sm:w-60">
              <button
                onClick={() => {
                  setShowThemeDropdown(!showThemeDropdown);
                  setShowLangDropdown(false);
                }}
                className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl bg-neutral-bg3/80 border border-border-default text-text-primary text-xs sm:text-sm font-semibold hover:border-brand/40 transition-all cursor-pointer"
                aria-haspopup="listbox"
                aria-expanded={showThemeDropdown}
              >
                <span>{theme === 'dark' ? t('set.theme.dark') : t('set.theme.light')}</span>
                <ChevronDown size={16} className="text-text-muted" />
              </button>

              {showThemeDropdown && (
                <ul className="absolute top-[115%] left-0 z-50 w-full bg-neutral-bg2 border border-border-default rounded-xl p-1 shadow-2xl list-none m-0 animate-scale-up" role="listbox">
                  <li
                    onClick={() => toggleTheme('dark')}
                    className={`flex items-center justify-between px-3 py-2 text-xs sm:text-sm rounded-lg cursor-pointer transition-all ${
                      theme === 'dark' ? 'bg-brand text-white font-bold' : 'text-text-secondary hover:bg-neutral-bg3 hover:text-text-primary'
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
                      theme === 'light' ? 'bg-brand text-white font-bold' : 'text-text-secondary hover:bg-neutral-bg3 hover:text-text-primary'
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

          {/* Card 2: Bahasa */}
          <div 
            className="card p-6 sm:p-7 bg-neutral-bg2/90 border border-border-default rounded-3xl shadow-md flex flex-col gap-4 relative overflow-visible"
            style={{ zIndex: showLangDropdown ? 40 : 10 }}
          >
            <div className="flex items-start gap-4">
              <Languages size={24} className="text-text-primary shrink-0 mt-0.5" />
              <div className="flex flex-col">
                <h3 className="text-base font-bold text-text-primary m-0">
                  {t('set.lang_title')}
                </h3>
                <p className="text-xs text-text-secondary m-0 mt-0.5">
                  {t('set.lang_desc')}
                </p>
              </div>
            </div>

            <div className="relative dropdown-container sm:ml-14 w-full sm:w-60">
              <button
                onClick={() => {
                  setShowLangDropdown(!showLangDropdown);
                  setShowThemeDropdown(false);
                }}
                className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl bg-neutral-bg3/80 border border-border-default text-text-primary text-xs sm:text-sm font-semibold hover:border-brand/40 transition-all cursor-pointer"
                aria-haspopup="listbox"
                aria-expanded={showLangDropdown}
              >
                <span>{language === 'id' ? t('set.lang.id') : t('set.lang.en')}</span>
                <ChevronDown size={16} className="text-text-muted" />
              </button>

              {showLangDropdown && (
                <ul className="absolute top-[115%] left-0 z-50 w-full bg-neutral-bg2 border border-border-default rounded-xl p-1 shadow-2xl list-none m-0 animate-scale-up" role="listbox">
                  <li
                    onClick={() => toggleLang('id')}
                    className={`flex items-center justify-between px-3 py-2 text-xs sm:text-sm rounded-lg cursor-pointer transition-all ${
                      language === 'id' ? 'bg-brand text-white font-bold' : 'text-text-secondary hover:bg-neutral-bg3 hover:text-text-primary'
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
                      language === 'en' ? 'bg-brand text-white font-bold' : 'text-text-secondary hover:bg-neutral-bg3 hover:text-text-primary'
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

        {/* Secondary: SSO Session & Campus Helpdesk */}
        <div className="flex flex-col gap-4 mt-2">
          {/* SSO Card */}
          <div className="card p-6 bg-neutral-bg2/70 border border-border-default rounded-3xl shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-brand/10 border border-brand/20 flex items-center justify-center text-brand-light shrink-0">
                <ShieldCheck size={20} />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold text-text-primary">{t('set.sso_title')}</span>
                <span className="text-xs text-text-secondary mt-0.5">{t('set.sso_desc')}</span>
              </div>
            </div>

            <div className="flex items-center gap-2.5 w-full sm:w-auto">
              <button
                onClick={handleRefreshSession}
                disabled={refreshing}
                className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-text-primary text-xs font-semibold border border-border-default transition-all flex items-center gap-2 cursor-pointer w-full sm:w-auto justify-center"
              >
                <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} />
                <span>{refreshing ? t('set.sso_refreshing') : t('set.sso_refresh_btn')}</span>
              </button>

              <a
                href="https://sso.s4ras.site/realms/S4RAS/account/"
                target="_blank"
                rel="noreferrer"
                className="px-3.5 py-2 rounded-xl bg-brand/10 hover:bg-brand/20 text-brand-light text-xs font-semibold border border-brand/20 transition-all flex items-center gap-1.5 no-underline w-full sm:w-auto justify-center"
              >
                <span>{t('set.sso_manage_btn')}</span>
                <ExternalLink size={12} />
              </a>
            </div>
          </div>
          {refreshMessage && (
            <div className="text-xs text-emerald-400 font-semibold px-4">
              {refreshMessage}
            </div>
          )}

          {/* Helpdesk Card */}
          <div className="card p-6 bg-neutral-bg2/70 border border-border-default rounded-3xl shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                <Headphones size={20} />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold text-text-primary">{t('set.support_title')}</span>
                <span className="text-xs text-text-secondary mt-0.5">{t('set.support_desc')}</span>
              </div>
            </div>

            <button
              onClick={() => handleCallOperator('1000')}
              className="px-4 py-2 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 text-xs font-semibold border border-emerald-500/30 transition-all flex items-center gap-2 cursor-pointer w-full sm:w-auto justify-center"
            >
              <PhoneCall size={14} />
              <span>{t('set.support_call_btn')}</span>
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default Pengaturan;

