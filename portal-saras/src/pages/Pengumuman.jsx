// Pengumuman — Announcements Page (Aligned with myITS Reference Screenshot 4 & S4RAS Aesthetic)
import { useState, useEffect } from 'react';
import { Search, Megaphone, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Layout from '../components/Layout';
import { fetchAnnouncements, subscribeAnnouncementsStream } from '../services/backend';
import { useThemeLanguage } from '../context/ThemeLanguageContext';

function Pengumuman() {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
  const { language, t } = useThemeLanguage();

  useEffect(() => {
    let active = true;
    fetchAnnouncements()
      .then((data) => {
        if (active) { setAnnouncements(data); setLoading(false); }
      })
      .catch(() => {
        if (active) { setLoading(false); }
      });

    const unsubscribe = subscribeAnnouncementsStream((newAnn) => {
      setAnnouncements((prev) => [newAnn, ...prev.filter((a) => a.id !== newAnn.id)]);
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  const filteredAnnouncements = announcements.filter((item) => {
    const title = (language === 'en' ? (item.title_en || item.title) : (item.title_id || item.title)) || '';
    const desc = (language === 'en' ? (item.desc_en || item.description || item.desc) : (item.desc_id || item.description || item.desc)) || '';
    const badge = (language === 'en' ? (item.badge_en || item.badge) : (item.badge_id || item.badge)) || '';
    const term = searchTerm.toLowerCase();
    return title.toLowerCase().includes(term) || desc.toLowerCase().includes(term) || badge.toLowerCase().includes(term);
  });

  const getBadgeStyle = (badge) => {
    const tag = (badge || '').toLowerCase();
    const base = 'px-2.5 py-0.5 text-[10px] font-bold rounded-md inline-block leading-normal w-fit border ';
    if (tag.includes('penting') || tag.includes('urgent') || tag.includes('security') || tag.includes('keamanan')) {
      return base + 'bg-red-500/10 text-red-400 border-red-500/20';
    }
    if (tag.includes('kegiatan') || tag.includes('event')) {
      return base + 'bg-white/5 text-text-secondary border-border-default';
    }
    if (tag.includes('open recruitment') || tag.includes('recruitment')) {
      return base + 'bg-amber-500/10 text-amber-300 border-amber-500/20';
    }
    if (tag.includes('beasiswa') || tag.includes('scholarship')) {
      return base + 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
    }
    return base + 'bg-white/5 text-text-secondary border-border-default';
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.03 }
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 8 },
    show: { opacity: 1, y: 0, transition: { duration: 0.25 } }
  };

  return (
    <Layout>
      <div className="w-full space-y-6">
        {/* Page Header with Search */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 flex-wrap">
          <div className="flex flex-col">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--color-text-primary)] m-0">
              {t('ann.title')}
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-[var(--color-text-secondary)] m-0">
              {language === 'en' ? 'Official campus announcements and broadcasts' : 'Pemberitahuan resmi dan siaran sivitas kampus'}
            </p>
          </div>

          {/* Search Input */}
          <div className="relative w-full sm:w-80 flex items-center">
            <Search size={16} className="absolute left-3.5 text-text-muted pointer-events-none" />
            <input
              type="text"
              placeholder={t('ann.search_placeholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-9 py-2 rounded-xl bg-neutral-bg3/80 border border-border-default text-text-primary text-xs sm:text-sm placeholder:text-text-muted focus:outline-none focus:border-brand-light focus:ring-1 focus:ring-brand-light/30 transition-all"
            />
            {searchTerm && (
              <button
                className="absolute right-3 p-1 text-text-muted hover:text-text-primary rounded-md"
                onClick={() => setSearchTerm('')}
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4" aria-busy="true">
            {Array.from({ length: 8 }).map((_, i) => (
              <div className="card min-h-[180px] p-5 rounded-2xl bg-neutral-bg2/90 border border-border-default flex flex-col justify-between" key={i}>
                <div>
                  <div className="skeleton w-8 h-8 rounded-full mb-3" />
                  <div className="skeleton w-4/5 h-4 mb-2" />
                  <div className="skeleton w-full h-3 mb-1" />
                  <div className="skeleton w-2/3 h-3" />
                </div>
                <div className="skeleton w-16 h-4 rounded mt-4" />
              </div>
            ))}
          </div>
        ) : (
          <>
            {filteredAnnouncements.length === 0 ? (
              <div className="card p-12 text-center text-text-secondary bg-neutral-bg2/90 border border-border-default rounded-2xl">
                <Megaphone size={36} className="text-text-muted mx-auto mb-3" />
                <p className="text-sm m-0">{t('ann.no_results')}</p>
              </div>
            ) : (
              /* 4-Column Responsive Grid (Matching Screenshot 4) */
              <motion.div
                className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
                variants={containerVariants}
                initial="hidden"
                animate="show"
                role="list"
              >
                <AnimatePresence mode="popLayout">
                  {filteredAnnouncements.map((item, index) => {
                    const displayTitle = language === 'en' ? (item.title_en || item.title) : (item.title_id || item.title);
                    const displayDesc = language === 'en' ? (item.desc_en || item.description || item.desc) : (item.desc_id || item.description || item.desc);
                    const displayBadge = language === 'en' ? (item.badge_en || item.badge || 'Lainnya') : (item.badge_id || item.badge || 'Lainnya');

                    return (
                      <motion.article
                        variants={cardVariants}
                        layout
                        key={item.id || index}
                        onClick={() => setSelectedAnnouncement(item)}
                        className="card p-5 rounded-2xl bg-neutral-bg2/90 border border-border-default hover:bg-white/[0.03] hover:border-brand/30 hover:shadow-lg transition-all duration-200 cursor-pointer flex flex-col justify-between min-h-[190px] group"
                        role="listitem"
                      >
                        <div className="flex flex-col gap-3">
                          {/* Megaphone Icon */}
                          <Megaphone size={22} className="text-brand-light shrink-0 group-hover:scale-105 transition-transform" />

                          {/* Title & Preview */}
                          <div className="flex flex-col gap-1.5">
                            <h3 className="text-xs sm:text-[0.8125rem] font-bold text-text-primary leading-snug line-clamp-2 group-hover:text-brand-light transition-colors m-0">
                              {displayTitle}
                            </h3>
                            <p className="text-[11px] text-text-secondary leading-relaxed line-clamp-3 m-0">
                              {displayDesc}
                            </p>
                          </div>
                        </div>

                        {/* Category Badge at bottom-left */}
                        <div className="pt-3">
                          <span className={getBadgeStyle(displayBadge)}>
                            {displayBadge}
                          </span>
                        </div>
                      </motion.article>
                    );
                  })}
                </AnimatePresence>
              </motion.div>
            )}
          </>
        )}

        {/* Detail Modal */}
        {selectedAnnouncement && (
          <div 
            className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
            onClick={() => setSelectedAnnouncement(null)}
          >
            <div 
              className="card max-w-lg w-full p-6 sm:p-7 bg-neutral-bg2 border border-border-default rounded-3xl shadow-2xl flex flex-col gap-4 animate-scale-up"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-brand/10 border border-brand/20 flex items-center justify-center text-brand-light">
                    <Megaphone size={20} />
                  </div>
                  <span className={getBadgeStyle(selectedAnnouncement.badge_id || selectedAnnouncement.badge)}>
                    {selectedAnnouncement.badge_id || selectedAnnouncement.badge || 'Pengumuman'}
                  </span>
                </div>
                <button
                  onClick={() => setSelectedAnnouncement(null)}
                  className="p-1.5 text-text-muted hover:text-text-primary rounded-lg hover:bg-white/5 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="flex flex-col gap-2">
                <h3 className="text-base sm:text-lg font-bold text-text-primary m-0 leading-snug">
                  {language === 'en' ? (selectedAnnouncement.title_en || selectedAnnouncement.title) : (selectedAnnouncement.title_id || selectedAnnouncement.title)}
                </h3>
                <span className="text-xs text-brand-light font-medium">
                  {selectedAnnouncement.date || 'September 2026'}
                </span>
                <p className="text-xs sm:text-sm text-text-secondary leading-relaxed mt-2 whitespace-pre-line m-0">
                  {language === 'en' ? (selectedAnnouncement.desc_en || selectedAnnouncement.description) : (selectedAnnouncement.desc_id || selectedAnnouncement.description)}
                </p>
              </div>

              <div className="pt-2 mt-2 border-t border-border-default/60 flex justify-end">
                <button
                  onClick={() => setSelectedAnnouncement(null)}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-text-primary text-xs font-semibold border border-border-default transition-all cursor-pointer"
                >
                  {language === 'en' ? 'Close' : 'Tutup'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

export default Pengumuman;