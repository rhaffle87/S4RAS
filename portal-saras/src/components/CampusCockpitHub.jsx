import React, { useState, useEffect, useCallback } from 'react';
import {
  GraduationCap,
  Cloud,
  Phone,
  Tv,
  Clock,
  HardDrive,
  Folder,
  FileText,
  Activity,
  Bell,
  ExternalLink,
  RefreshCw,
  Send,
  Volume2,
  ShieldCheck,
  ArrowUpRight,
  Radio,
  Play
} from 'lucide-react';
import { useKeycloak } from '../context/KeycloakContext';
import { useThemeLanguage } from '../context/ThemeLanguageContext';
import {
  fetchAcademicSummary,
  fetchStorageSummary,
  fetchMediaWatchlist,
  fetchVoicemailSummary,
  fetchClusterEvents,
  subscribeAnnouncementsStream,
  dispatchClusterEvent
} from '../services/backend';

export default function CampusCockpitHub({ className = '' }) {
  const { keycloak, persona, roleLabel, sipExtension, storageQuota, moodleCohort, isAdmin } = useKeycloak();
  const { language } = useThemeLanguage();

  const [activeTab, setActiveTab] = useState('overview'); // overview, academic, storage, telephony, media
  const [refreshing, setRefreshing] = useState(false);

  const [academic, setAcademic] = useState(null);
  const [storage, setStorage] = useState(null);
  const [media, setMedia] = useState(null);
  const [voicemail, setVoicemail] = useState(null);
  const [events, setEvents] = useState([]);
  const [isDispatching, setIsDispatching] = useState(false);

  const token = keycloak?.token;

  // Load all cockpit datasets in parallel
  const loadCockpitData = useCallback(async (isSilent = false) => {
    if (!isSilent) setRefreshing(true);
    try {
      const [acadRes, storRes, medRes, vmRes, evRes] = await Promise.all([
        fetchAcademicSummary(token),
        fetchStorageSummary(token),
        fetchMediaWatchlist(),
        fetchVoicemailSummary(sipExtension, token),
        fetchClusterEvents()
      ]);

      if (acadRes) setAcademic(acadRes);
      if (storRes) setStorage(storRes);
      if (medRes) setMedia(medRes);
      if (vmRes) setVoicemail(vmRes);
      if (Array.isArray(evRes)) setEvents(evRes);
    } catch (err) {
      console.warn('[Cockpit Data Load Error]', err);
    } finally {
      setRefreshing(false);
    }
  }, [token, sipExtension]);

  useEffect(() => {
    loadCockpitData();
  }, [loadCockpitData]);

  // Subscribe to real-time Redis SSE event mesh
  useEffect(() => {
    const unsubscribe = subscribeAnnouncementsStream(
      null,
      (_announcements, streamEvents) => {
        if (Array.isArray(streamEvents) && streamEvents.length > 0) {
          setEvents(streamEvents);
        }
      },
      (clusterEvent) => {
        if (clusterEvent) {
          setEvents((prev) => [clusterEvent, ...prev.filter((e) => e.id !== clusterEvent.id)].slice(0, 50));
        }
      }
    );
    return () => {
      unsubscribe();
    };
  }, []);

  const handleOpenPhone = () => {
    window.dispatchEvent(new CustomEvent('open-campus-phone'));
  };

  const handleSimulateEvent = async () => {
    setIsDispatching(true);
    const sampleEvent = {
      type: 'academic.assignment',
      service: 'moodle',
      title: 'Tugas Baru: Implementasi Raft Consensus',
      title_id: 'Tugas Baru: Implementasi Raft Consensus',
      title_en: 'New Assignment: Raft Consensus Implementation',
      message: 'Modul praktikum 4 telah diunggah oleh Dosen di KOM-401.',
      message_id: 'Modul praktikum 4 telah diunggah oleh Dosen di KOM-401.',
      message_en: 'Lab module 4 uploaded by course instructor in KOM-401.',
      severity: 'info',
      meta: { course: 'KOM-401', cohort: moodleCohort, sender: persona }
    };

    await dispatchClusterEvent(sampleEvent, keycloak?.token);
    setIsDispatching(false);
  };

  // Helper translations
  const isEn = language === 'en';

  return (
    <section 
      aria-label="S4RAS Campus Cockpit Hub"
      className={`relative w-full rounded-2xl bg-neutral-bg2/95 border border-border-default shadow-xl overflow-hidden backdrop-blur-md transition-all ${className}`}
    >
      {/* Top Cockpit Header Bar */}
      <div className="px-5 sm:px-7 py-4 sm:py-5 border-b border-border-default/80 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-neutral-bg3/60 via-transparent to-neutral-bg3/40">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand/20 via-rose-500/20 to-red-600/30 border border-brand/40 flex items-center justify-center text-brand-light shadow-inner">
            <Activity size={20} className="animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-text-primary tracking-tight m-0">
                {isEn ? 'S4RAS Campus Cockpit' : 'Kokpit Terpadu Sivitas S4RAS'}
              </h2>
              <span className="hidden sm:inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                Redis Mesh Live
              </span>
            </div>
            <p className="text-xs text-text-muted m-0">
              {isEn 
                ? `Unified integration for ${roleLabel} • Cohort ${moodleCohort} • Ext ${sipExtension}` 
                : `Integrasi cerdas profil ${roleLabel} • Kohort ${moodleCohort} • Ekstensi ${sipExtension}`}
            </p>
          </div>
        </div>

        {/* Tab Controls & Refresh Action */}
        <div className="flex items-center gap-2 self-start md:self-auto flex-wrap">
          <div className="flex items-center p-1 rounded-xl bg-neutral-bg3/90 border border-border-default text-xs font-semibold">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeTab === 'overview'
                  ? 'bg-brand text-white shadow-sm font-semibold'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              {isEn ? 'Overview' : 'Ringkasan'}
            </button>
            <button
              onClick={() => setActiveTab('academic')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeTab === 'academic'
                  ? 'bg-brand text-white shadow-sm font-semibold'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              {isEn ? 'Academic' : 'Akademik'}
            </button>
            <button
              onClick={() => setActiveTab('storage')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeTab === 'storage'
                  ? 'bg-brand text-white shadow-sm font-semibold'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              {isEn ? 'Cloud SAN' : 'Penyimpanan'}
            </button>
            <button
              onClick={() => setActiveTab('telephony')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeTab === 'telephony'
                  ? 'bg-brand text-white shadow-sm font-semibold'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              {isEn ? 'VoIP / PBX' : 'Telefoni'}
            </button>
            <button
              onClick={() => setActiveTab('media')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeTab === 'media'
                  ? 'bg-brand text-white shadow-sm font-semibold'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              IPTV
            </button>
          </div>

          <button
            onClick={() => loadCockpitData()}
            disabled={refreshing}
            title={isEn ? 'Refresh Cockpit Data' : 'Perbarui Data Kokpit'}
            aria-label="Refresh Cockpit Data"
            className="p-2 rounded-xl bg-neutral-bg3/80 hover:bg-neutral-bg3 border border-border-default text-text-secondary hover:text-text-primary transition-all cursor-pointer active:scale-95 disabled:opacity-50"
          >
            <RefreshCw size={15} className={refreshing ? 'animate-spin text-brand-light' : ''} />
          </button>
        </div>
      </div>

      {/* Main Tab Content Display */}
      <div className="p-5 sm:p-7">
        {/* VIEW: OVERVIEW (4-CARD INTEGRATION GRID) */}
        {activeTab === 'overview' && (
          <div className="flex flex-col gap-6">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-5">
              
              {/* Card 1: Academic & Assignments (Moodle) */}
              <div className="p-5 rounded-2xl bg-neutral-bg3/60 hover:bg-neutral-bg3/80 border border-border-default/80 hover:border-brand/40 transition-all flex flex-col justify-between group shadow-sm">
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-rose-500/20 to-red-600/20 border border-rose-500/30 flex items-center justify-center text-rose-400 group-hover:scale-105 transition-transform shadow-inner shrink-0">
                      <GraduationCap size={22} />
                    </div>
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-300 border border-rose-500/20">
                      Moodle LMS
                    </span>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-text-primary m-0 group-hover:text-brand-light transition-colors">
                      {isEn ? 'Academic Deadlines' : 'Tugas & Kurikulum'}
                    </h3>
                    <p className="text-xs text-text-muted mt-1 leading-relaxed">
                      {academic?.upcomingDeadlines?.[0] ? (
                        <>
                          <span className="font-semibold text-text-primary">{academic.upcomingDeadlines[0].courseName}:</span>{' '}
                          {academic.upcomingDeadlines[0].title}
                        </>
                      ) : (
                        '3 mata kuliah aktif semester gasal terhubung.'
                      )}
                    </p>
                  </div>
                </div>

                <div className="pt-4 mt-2 border-t border-border-default/50 flex items-center justify-between">
                  {academic?.upcomingDeadlines?.[0] ? (
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                      <Clock size={12} />
                      {academic.upcomingDeadlines[0].daysLeft} {isEn ? 'days left' : 'hari lagi'}
                    </span>
                  ) : (
                    <span className="text-[11px] text-text-muted">GPA: {academic?.stats?.gpa || '3.88'}</span>
                  )}

                  <a
                    href="https://moodle.s4ras.site/auth/oidc/"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-brand-light hover:text-rose-300 transition-colors no-underline"
                  >
                    <span>{isEn ? 'Open LMS' : 'Buka LMS'}</span>
                    <ArrowUpRight size={13} />
                  </a>
                </div>
              </div>

              {/* Card 2: Cloud Storage Quota (Nextcloud SAN) */}
              <div className="p-5 rounded-2xl bg-neutral-bg3/60 hover:bg-neutral-bg3/80 border border-border-default/80 hover:border-brand/40 transition-all flex flex-col justify-between group shadow-sm">
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-rose-500/20 to-red-600/20 border border-rose-500/30 flex items-center justify-center text-rose-500 dark:text-rose-400 group-hover:scale-105 transition-transform shadow-inner shrink-0">
                      <Cloud size={22} />
                    </div>
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-300 border border-rose-500/20">
                      Nextcloud SAN
                    </span>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-text-primary m-0 group-hover:text-brand-light transition-colors">
                      {isEn ? 'Cloud Storage' : 'Penyimpanan SAN'}
                    </h3>
                    <div className="mt-2 flex flex-col gap-1.5">
                      <div className="flex justify-between text-xs text-text-muted">
                        <span>{isEn ? 'Used Space' : 'Ruang Terpakai'}</span>
                        <span className="font-semibold text-text-primary">
                          {storage?.usedGB || '76.4'} GB / {storage?.totalGB || storageQuota}
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-neutral-bg1 overflow-hidden border border-border-default/60">
                        <div 
                          className="h-full rounded-full bg-gradient-to-r from-red-600 to-rose-500 transition-all duration-700"
                          style={{ width: `${storage?.usedPercent || 38}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-4 mt-2 border-t border-border-default/50 flex items-center justify-between">
                  <span className="text-[11px] text-text-muted">
                    {storage?.sharedFolders?.length || 4} {isEn ? 'shared folders' : 'folder bersama'}
                  </span>
                  <a
                    href="https://cloud.s4ras.site/apps/user_oidc/login/1"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-brand-light hover:text-rose-400 transition-colors no-underline"
                  >
                    <span>{isEn ? 'Drive Files' : 'Buka Berkas'}</span>
                    <ArrowUpRight size={13} />
                  </a>
                </div>
              </div>

              {/* Card 3: VoIP & WebPhone Telephony (Asterisk 22) */}
              <div className="p-5 rounded-2xl bg-neutral-bg3/60 hover:bg-neutral-bg3/80 border border-border-default/80 hover:border-emerald-500/40 transition-all flex flex-col justify-between group shadow-sm">
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 group-hover:scale-105 transition-transform shadow-inner shrink-0">
                      <Phone size={22} />
                    </div>
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
                      Asterisk 22
                    </span>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-text-primary m-0 group-hover:text-emerald-600 dark:group-hover:text-emerald-300 transition-colors">
                      {isEn ? 'Campus Telephony' : 'Telefoni WebRTC'}
                    </h3>
                    <p className="text-xs text-text-muted mt-1 leading-relaxed">
                      {isEn ? 'Extension' : 'Ekstensi'} <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{sipExtension}</span> • {isEn ? 'WebRTC HD Voice & Video' : 'Suara & Video HD VP8'}
                    </p>
                    <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-[11px] font-medium border border-emerald-500/20">
                      <Volume2 size={12} />
                      <span>{voicemail?.newMsg || 0} {isEn ? 'new voicemails' : 'pesan suara baru'}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 mt-2 border-t border-border-default/50 flex items-center justify-between">
                  <button
                    onClick={handleOpenPhone}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors cursor-pointer bg-transparent border-none p-0"
                  >
                    <span>{isEn ? 'Launch WebPhone' : 'Buka WebPhone'}</span>
                    <ArrowUpRight size={13} />
                  </button>
                  <span className="text-[10px] text-text-muted font-mono">PJSIP/WSS</span>
                </div>
              </div>

              {/* Card 4: IPTV & Media Streaming (Jellyfin) */}
              <div className="p-5 rounded-2xl bg-neutral-bg3/60 hover:bg-neutral-bg3/80 border border-border-default/80 hover:border-purple-500/40 transition-all flex flex-col justify-between group shadow-sm">
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-600/20 border border-purple-500/30 flex items-center justify-center text-purple-600 dark:text-purple-400 group-hover:scale-105 transition-transform shadow-inner shrink-0">
                      <Tv size={22} />
                    </div>
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/20">
                      Jellyfin IPTV
                    </span>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-text-primary m-0 group-hover:text-purple-600 dark:group-hover:text-purple-300 transition-colors">
                      {isEn ? 'Campus IPTV' : 'Siaran & Media Belajar'}
                    </h3>
                    <p className="text-xs text-text-muted mt-1 leading-relaxed">
                      {media?.liveChannels?.[0] ? (
                        <>
                          <span className="font-semibold text-text-primary">{media.liveChannels[0].name}</span> •{' '}
                          <span className="text-emerald-600 dark:text-emerald-400 font-medium">LIVE</span> ({media.liveChannels[0].resolution})
                        </>
                      ) : (
                        isEn ? '3 national channels & campus streams ready.' : '3 channel TV nasional & siaran kampus siap streaming.'
                      )}
                    </p>
                  </div>
                </div>

                <div className="pt-4 mt-2 border-t border-border-default/50 flex items-center justify-between">
                  <span className="text-[11px] text-purple-700 dark:text-purple-300 flex items-center gap-1 font-medium">
                    <Radio size={12} className="text-purple-600 dark:text-purple-400 animate-pulse" />
                    {isEn ? 'Live On-Air' : 'Siaran Langsung'}
                  </span>
                  <a
                    href="https://iptv.s4ras.site"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 transition-colors no-underline"
                  >
                    <span>{isEn ? 'Watch Now' : 'Tonton Siaran'}</span>
                    <ArrowUpRight size={13} />
                  </a>
                </div>
              </div>

            </div>

            {/* Bottom Real-time Redis Cluster Event Mesh Activity Bar */}
            <div className="p-4 sm:p-5 rounded-2xl bg-neutral-bg3/40 border border-border-default flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500/20 to-red-600/20 border border-rose-500/30 flex items-center justify-center text-rose-400 group-hover:scale-105 transition-transform shrink-0 shadow-inner">
                  <Bell size={20} />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-text-primary flex items-center gap-2">
                    {isEn ? 'Redis Event Mesh Stream' : 'Aliran Notifikasi Terpusat (Redis Mesh)'}
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
                  </span>
                  <p className="text-xs text-text-muted m-0 truncate max-w-xl">
                    {events?.[0] 
                      ? `[${events[0].service?.toUpperCase()}] ${isEn ? events[0].title_en || events[0].title : events[0].title_id || events[0].title} — ${isEn ? events[0].message_en || events[0].message : events[0].message_id || events[0].message}`
                      : 'Menunggu aliran event cluster...'}
                  </p>
                </div>
              </div>

              {/* Action Buttons: Simulate Event Trigger (Restricted to Admin / Dev) */}
              {Boolean(isAdmin) && (
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={handleSimulateEvent}
                    disabled={isDispatching}
                    className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-text-secondary hover:text-text-primary text-xs font-semibold border border-border-default transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    title="Kirim event uji coba ke Redis Pub/Sub"
                  >
                    <Send size={13} className={isDispatching ? 'animate-bounce text-brand-light' : ''} />
                    <span>{isEn ? 'Test Dispatch' : 'Uji Event Mesh'}</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* VIEW: ACADEMIC (DETAILED MOODLE TRACKER) */}
        {activeTab === 'academic' && (
          <div className="flex flex-col gap-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              {/* Left 2 Cols: Enrolled Courses & Modules */}
              <div className="lg:col-span-2 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm sm:text-base font-bold text-text-primary m-0 flex items-center gap-2">
                    <GraduationCap size={18} className="text-brand-light" />
                    {isEn ? 'Enrolled Academic Courses' : 'Mata Kuliah Semester Gasal'}
                  </h3>
                  <span className="text-xs text-text-muted font-mono">Kohort: {moodleCohort}</span>
                </div>

                <div className="flex flex-col gap-3">
                  {academic?.enrolledCourses?.map((course) => (
                    <div 
                      key={course.id}
                      className="p-4 rounded-xl bg-neutral-bg3/60 border border-border-default hover:border-brand/30 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-rose-500/15 text-rose-400 border border-rose-500/30">
                            {course.id}
                          </span>
                          <span className="text-sm font-bold text-text-primary">{course.name}</span>
                        </div>
                        <span className="text-xs text-text-muted">{course.instructor} • {course.schedule}</span>
                      </div>

                      <div className="flex items-center gap-4 shrink-0">
                        <div className="flex flex-col items-end gap-1">
                          <span className="text-xs font-semibold text-brand-light">{course.progress}% Selesai</span>
                          <span className="text-[10px] text-text-muted">{course.completedModules}/{course.totalModules} Modul</span>
                        </div>
                        <a
                          href={course.url}
                          target="_blank"
                          rel="noreferrer"
                          className="p-2 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 text-rose-400 transition-colors"
                        >
                          <ExternalLink size={14} />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Col: Upcoming Deadlines & Evaluation */}
              <div className="flex flex-col gap-4">
                <h3 className="text-sm sm:text-base font-bold text-text-primary m-0 flex items-center gap-2">
                  <Clock size={16} className="text-amber-400" />
                  {isEn ? 'Assignments & Deadlines' : 'Penugasan Mendatang'}
                </h3>

                <div className="flex flex-col gap-3">
                  {academic?.upcomingDeadlines?.map((assign) => (
                    <div
                      key={assign.id}
                      className="p-3.5 rounded-xl bg-neutral-bg3/60 border border-border-default flex flex-col gap-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-xs font-bold text-text-primary leading-tight">
                          {isEn ? assign.title_en || assign.title : assign.title}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold shrink-0 ${
                          assign.submitted 
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        }`}>
                          {assign.submitted ? (isEn ? 'Submitted' : 'Terkirim') : `${assign.daysLeft} ${isEn ? 'days' : 'hari'}`}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-text-muted pt-1 border-t border-border-default/40">
                        <span>{assign.courseName} (Bobot {assign.weight})</span>
                        <a
                          href={assign.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-brand-light hover:text-rose-300 font-semibold no-underline"
                        >
                          {isEn ? 'Submit' : 'Kirim'} &rarr;
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* VIEW: STORAGE (NEXTCLOUD SAN DETAILS) */}
        {activeTab === 'storage' && (
          <div className="flex flex-col gap-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              {/* Left Col: Storage Quota Meter & Collabora */}
              <div className="p-5 rounded-2xl bg-neutral-bg3/60 border border-border-default flex flex-col justify-between gap-5">
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-2 text-rose-400">
                    <HardDrive size={18} />
                    <h3 className="text-sm font-bold text-text-primary m-0">
                      {isEn ? 'Storage Quota & SAN Pool' : 'Alokasi Kuota Penyimpanan'}
                    </h3>
                  </div>

                  <div className="flex flex-col gap-2 mt-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-text-muted">{isEn ? 'Capacity Usage' : 'Pemakaian'}</span>
                      <span className="font-bold text-text-primary">{storage?.usedPercent || 38}%</span>
                    </div>
                    <div className="w-full h-3 rounded-full bg-neutral-bg1 overflow-hidden border border-border-default">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-red-600 to-rose-500"
                        style={{ width: `${storage?.usedPercent || 38}%` }}
                      />
                    </div>
                    <span className="text-[11px] text-text-muted text-right">
                      {storage?.usedGB || '76.4'} GB {isEn ? 'used of' : 'dari'} {storage?.totalGB || storageQuota}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300 flex items-center gap-2 mt-2">
                    <ShieldCheck size={16} className="shrink-0" />
                    <span>Collabora Online aktif: pengeditan .docx, .xlsx real-time di browser.</span>
                  </div>
                </div>

                <a
                  href="https://cloud.s4ras.site/apps/user_oidc/login/1"
                  target="_blank"
                  rel="noreferrer"
                  className="w-full py-2.5 rounded-xl bg-brand hover:bg-brand-hover text-white text-xs font-semibold text-center transition-colors no-underline shadow-sm"
                >
                  {isEn ? 'Open Full Nextcloud Drive' : 'Buka Nextcloud Drive Lengkap'}
                </a>
              </div>

              {/* Middle & Right Cols: Shared Folders & Recent Files */}
              <div className="lg:col-span-2 flex flex-col gap-5">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-text-muted mb-3 flex items-center gap-2">
                    <Folder size={14} className="text-rose-400" />
                    {isEn ? 'Shared Research & Academic Folders' : 'Folder Terstruktur & Riset'}
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {storage?.sharedFolders?.map((folder) => (
                      <a
                        key={folder.id}
                        href={folder.url}
                        target="_blank"
                        rel="noreferrer"
                        className="p-3.5 rounded-xl bg-neutral-bg3/60 hover:bg-neutral-bg3 border border-border-default hover:border-brand/40 transition-all flex items-center justify-between no-underline group"
                      >
                        <div className="flex items-center gap-3">
                          <Folder size={20} className="text-rose-400 group-hover:scale-110 transition-transform" />
                          <div className="flex flex-col">
                            <span className="text-xs font-bold text-text-primary group-hover:text-rose-300 transition-colors">
                              {folder.name}
                            </span>
                            <span className="text-[10px] text-text-muted">{folder.size} • {folder.itemCount} item</span>
                          </div>
                        </div>
                        <ArrowUpRight size={14} className="text-text-muted group-hover:text-rose-400 transition-colors" />
                      </a>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-text-muted mb-3 flex items-center gap-2">
                    <FileText size={14} className="text-rose-400" />
                    {isEn ? 'Recent Cloud Documents' : 'Dokumen Terkini'}
                  </h3>
                  <div className="flex flex-col gap-2">
                    {storage?.recentFiles?.map((file) => (
                      <div
                        key={file.id}
                        className="p-3 rounded-xl bg-neutral-bg3/40 border border-border-default/60 flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-2.5">
                          <FileText size={16} className="text-text-muted" />
                          <span className="font-semibold text-text-primary">{file.name}</span>
                        </div>
                        <div className="flex items-center gap-3 text-text-muted text-[11px]">
                          <span>{file.size}</span>
                          <span>{file.updatedAt}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* VIEW: TELEPHONY (ASTERISK WEBRTC & VOICEMAIL) */}
        {activeTab === 'telephony' && (
          <div className="flex flex-col gap-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              {/* Profile Telephony Credentials & WebPhone Launch */}
              <div className="p-5 rounded-2xl bg-neutral-bg3/60 border border-border-default flex flex-col justify-between gap-5">
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-2 text-emerald-400">
                    <Phone size={18} />
                    <h3 className="text-sm font-bold text-text-primary m-0">
                      {isEn ? 'WebRTC SIP Credentials' : 'Kredensial Telefoni WebRTC'}
                    </h3>
                  </div>

                  <div className="flex flex-col gap-2.5 mt-2 text-xs">
                    <div className="flex justify-between py-1.5 border-b border-border-default/50">
                      <span className="text-text-muted">{isEn ? 'SIP Extension' : 'Nomor Ekstensi'}</span>
                      <span className="font-mono font-bold text-emerald-400">{sipExtension}</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-border-default/50">
                      <span className="text-text-muted">{isEn ? 'SIP Transport' : 'Protokol Sinyal'}</span>
                      <span className="font-mono text-text-primary">WSS (Port 8089)</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-border-default/50">
                      <span className="text-text-muted">{isEn ? 'Media Encryption' : 'Enkripsi Audio'}</span>
                      <span className="font-mono text-emerald-400">SRTP / DTLS 1.2</span>
                    </div>
                    <div className="flex justify-between py-1.5">
                      <span className="text-text-muted">{isEn ? 'Voicemail Mailbox' : 'Kotak Suara'}</span>
                      <span className="font-mono text-text-primary">{sipExtension}@default</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleOpenPhone}
                  className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <Phone size={14} />
                  <span>{isEn ? 'Open Campus WebPhone' : 'Buka WebPhone Kampus'}</span>
                </button>
              </div>

              {/* Quick Dial Extension Directory */}
              <div className="lg:col-span-2 flex flex-col gap-4">
                <h3 className="text-sm sm:text-base font-bold text-text-primary m-0 flex items-center gap-2">
                  <Volume2 size={16} className="text-emerald-400" />
                  {isEn ? 'Quick Dial & Campus Extensions' : 'Daftar Rute Cepat Ekstensi'}
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { ext: '1000', name: 'Automated Campus IVR', desc: 'Menu Panduan Suara Otomatis' },
                    { ext: '600', name: 'VoIP Audio Echo Test', desc: 'Uji Latensi & Kualitas Suara' },
                    { ext: '800', name: 'Conference Bridge', desc: 'Ruang Konferensi Audio Multi-Pihak' },
                    { ext: '1004', name: 'Video Consultation', desc: 'Konsultasi Akademik VP8 HD' },
                    { ext: '1074700', name: 'S4RAS Security Admin', desc: 'Pusat Keamanan & Operator' },
                    { ext: '1079348', name: 'Sivitas Peneliti', desc: 'Research Fellow & Cluster Architect' },
                  ].map((dest) => (
                    <div
                      key={dest.ext}
                      onClick={handleOpenPhone}
                      className="p-3.5 rounded-xl bg-neutral-bg3/60 hover:bg-neutral-bg3 border border-border-default hover:border-emerald-500/40 transition-all flex items-center justify-between cursor-pointer group"
                    >
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                            Ext {dest.ext}
                          </span>
                          <span className="text-xs font-bold text-text-primary group-hover:text-emerald-300 transition-colors">
                            {dest.name}
                          </span>
                        </div>
                        <span className="text-[10px] text-text-muted mt-1">{dest.desc}</span>
                      </div>
                      <Phone size={14} className="text-text-muted group-hover:text-emerald-400 transition-colors" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* VIEW: MEDIA & IPTV CHANNELS */}
        {activeTab === 'media' && (
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm sm:text-base font-bold text-text-primary m-0 flex items-center gap-2">
                  <Tv size={18} className="text-purple-400" />
                  {isEn ? 'Live Campus TV & National Broadcasts' : 'Siaran Langsung TV Kampus & Nasional'}
                </h3>
                <span className="text-xs text-text-muted">{media?.server || 'TnlLabB301'}</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {media?.liveChannels?.map((ch) => (
                  <div
                    key={ch.id}
                    className="p-4 rounded-xl bg-neutral-bg3/60 border border-border-default hover:border-purple-500/40 transition-all flex flex-col justify-between gap-4 group"
                  >
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-purple-500/15 text-purple-300 border border-purple-500/30">
                          {ch.category}
                        </span>
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          {ch.status}
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-text-primary m-0 group-hover:text-purple-300 transition-colors">
                        {ch.name}
                      </h4>
                      <span className="text-[11px] text-text-muted">{ch.resolution} • {ch.viewers} {isEn ? 'viewers' : 'penonton'}</span>
                    </div>

                    <a
                      href={ch.url}
                      target="_blank"
                      rel="noreferrer"
                      className="w-full py-2 rounded-lg bg-purple-500/15 hover:bg-purple-500/25 text-purple-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors no-underline"
                    >
                      <Play size={12} fill="currentColor" />
                      <span>{isEn ? 'Watch Stream' : 'Putar Siaran'}</span>
                    </a>
                  </div>
                ))}
              </div>
            </div>

            {/* Featured On-Demand Media */}
            <div className="flex flex-col gap-4 pt-2">
              <h3 className="text-sm sm:text-base font-bold text-text-primary m-0 flex items-center gap-2">
                <Play size={16} className="text-purple-400" />
                {isEn ? 'Featured Academic On-Demand Library' : 'Katalog Video Kuliah & Rekaman'}
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {media?.featuredMedia?.map((item) => (
                  <a
                    key={item.id}
                    href={item.url}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-xl overflow-hidden bg-neutral-bg3/60 border border-border-default hover:border-purple-500/40 transition-all flex flex-col no-underline group"
                  >
                    <div className="relative w-full h-32 overflow-hidden bg-neutral-bg1">
                      <img
                        src={item.thumbnail}
                        alt=""
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <span className="absolute top-2 left-2 px-2 py-0.5 rounded text-[10px] font-bold bg-black/60 text-white backdrop-blur-md">
                        {item.badge}
                      </span>
                      <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded text-[10px] font-mono bg-black/70 text-white">
                        {item.duration}
                      </span>
                    </div>
                    <div className="p-3.5 flex flex-col gap-1">
                      <span className="text-xs font-bold text-text-primary group-hover:text-purple-300 transition-colors line-clamp-1">
                        {item.title}
                      </span>
                      <span className="text-[11px] text-text-muted">{item.speaker}</span>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
