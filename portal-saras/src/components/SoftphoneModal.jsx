import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Phone, PhoneCall, PhoneOff, Mic, MicOff, Volume2, VolumeX, ShieldCheck, X,
  Clock, RotateCcw, Trash2, Video, VideoOff, BookOpen, Search, Server
} from 'lucide-react';
import { useKeycloak } from '../context/KeycloakContext';
import SoftphoneVideoCanvas from './softphone/SoftphoneVideoCanvas';
import SoftphoneScreen from './softphone/SoftphoneScreen';
import SoftphoneKeypad from './softphone/SoftphoneKeypad';

// Standard Bell System DTMF frequencies
const DTMF_FREQS = {
  '1': [697, 1209], '2': [697, 1336], '3': [697, 1477],
  '4': [770, 1209], '5': [770, 1336], '6': [770, 1477],
  '7': [852, 1209], '8': [852, 1336], '9': [852, 1477],
  '*': [941, 1209], '0': [941, 1336], '#': [941, 1477],
};

const DIALPAD_KEYS = [
  { key: '1', sub: '' },
  { key: '2', sub: 'ABC' },
  { key: '3', sub: 'DEF' },
  { key: '4', sub: 'GHI' },
  { key: '5', sub: 'JKL' },
  { key: '6', sub: 'MNO' },
  { key: '7', sub: 'PQRS' },
  { key: '8', sub: 'TUV' },
  { key: '9', sub: 'WXYZ' },
  { key: '*', sub: '' },
  { key: '0', sub: '+' },
  { key: '#', sub: '' },
];

export const DIRECTORY_CATEGORIES = [
  {
    id: 'support',
    title: 'Pusat Bantuan & Koordinasi 3T',
    items: [
      { ext: '1000', label: 'Operator Bantuan S4RAS', desc: 'Pusat Bantuan & Layanan Komunikasi 3T', badge: 'Operator' },
      { ext: '1003', label: 'Administrator Sistem', desc: 'Keamanan Klaster & Administrasi Server', badge: 'Admin' },
      { ext: '8000', label: 'Konferensi Suara Desa/Kelas', desc: 'Ruang Konferensi Audio Multi-Pihak', badge: 'Konferensi' },
      { ext: '800', label: 'Campus Conference Bridge', desc: 'Bridge Konferensi Suara Alternatif', badge: 'Bridge' },
    ]
  },
  {
    id: 'civitas',
    title: 'Sivitas & Pengajar (LMS/Edukasi)',
    items: [
      { ext: '1002', label: 'Dr. Hendra Wijaya', desc: 'Dosen Komputasi Awan / Faculty Desk', badge: 'Dosen' },
      { ext: '1001', label: 'Budi Pratama', desc: 'Perwakilan Siswa / Student Council', badge: 'Mahasiswa' },
      { ext: '1004', label: 'Konsultasi Video Akademik', desc: 'Konsultasi Tatap Muka (VP8 HD)', badge: 'Video HD' },
      { ext: '1079348', label: 'Sivitas Peneliti', desc: 'Research Fellow & Cluster Architect', badge: 'Peneliti' },
    ]
  },
  {
    id: 'utilities',
    title: 'Utilitas & Diagnostik Jaringan (PBX)',
    items: [
      { ext: '*97', label: 'Kotak Suara (Voicemail)', desc: 'Pusat Pesan Suara & Rekaman Sivitas', badge: 'Voicemail' },
      { ext: '500', label: 'Voicemail Central PBX', desc: 'Akses Saluran Pesan Suara Alternatif', badge: 'Voicemail' },
      { ext: '600', label: 'Uji Gema Audio (Echo Test)', desc: 'Uji Latensi & Loopback Kualitas Mikrofon', badge: 'Echo Test' },
      { ext: '*60', label: 'Informasi Waktu Server', desc: 'Voice Clock Waktu Nyata Server Asterisk', badge: 'Waktu' },
      { ext: '700', label: 'Simulasi Antrean Layanan', desc: 'Uji Distribusi Panggilan Otomatis PBX', badge: 'Antrean' },
      { ext: '201', label: 'VM 201 PBX Trunk', desc: 'Rute Trunk Inter-PBX Asterisk 20 Simpul 1', badge: 'Trunk' },
    ]
  }
];

export const EXTENSION_DIRECTORY = DIRECTORY_CATEGORIES.flatMap(cat =>
  cat.items.map(item => ({ ...item, category: cat.id }))
);

export const WEBRTC_ICE_SERVERS = [
  { urls: 'stun:192.168.10.202:3478' }
];

export default function SoftphoneModal({ isOpen, onClose }) {
  const { persona, roleLabel, sipExtension, sipSecret, iceServers } = useKeycloak();
  const effectiveIceServers = (Array.isArray(iceServers) && iceServers.length > 0) ? iceServers : WEBRTC_ICE_SERVERS;
  const [dialedNumber, setDialedNumber] = useState('');
  const [callState, setCallState] = useState('idle'); // idle, calling, connected, ended
  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [isVideoActive, setIsVideoActive] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [activeCallTarget, setActiveCallTarget] = useState(null);
  const [ivrMessage, setIvrMessage] = useState('');
  const [activeTab, setActiveTab] = useState('dialer'); // 'dialer' | 'directory' | 'history'
  const [directorySearch, setDirectorySearch] = useState('');
  const [directoryFilter, setDirectoryFilter] = useState('all');
  const [callHistory, setCallHistory] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('s4ras_call_history') || '[]');
    } catch {
      return [];
    }
  });

  const audioCtxRef = useRef(null);
  const timerRef = useRef(null);
  const echoStreamRef = useRef(null);
  const echoDelayRef = useRef(null);
  const localVideoRef = useRef(null);
  const localMediaStreamRef = useRef(null);
  const telephonySessionRef = useRef({ iceServers: effectiveIceServers, secret: sipSecret });

  useEffect(() => {
    telephonySessionRef.current = { iceServers: effectiveIceServers, secret: sipSecret };
  }, [effectiveIceServers, sipSecret]);

  // Determine current user extension dynamically from Keycloak claims
  const myExtension = sipExtension || (persona === 'teacher' ? '1002' : persona === 'dev' ? '1003' : '1001');

  // Listen for open-campus-phone events to pre-fill dialed number
  useEffect(() => {
    const handleOpenWithExt = (e) => {
      if (e.detail?.ext) {
        setDialedNumber(e.detail.ext);
      }
    };
    window.addEventListener('open-campus-phone', handleOpenWithExt);
    return () => window.removeEventListener('open-campus-phone', handleOpenWithExt);
  }, []);

  // Initialize Web Audio Context
  const getAudioContext = useCallback(() => {
    if (!audioCtxRef.current) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        audioCtxRef.current = new AudioContextClass();
      }
    }
    if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  }, []);

  // Play realistic dual-tone multi-frequency (DTMF) sound
  const playDTMF = useCallback((char) => {
    const freqs = DTMF_FREQS[char];
    if (!freqs) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;

      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc1.frequency.value = freqs[0];
      osc2.frequency.value = freqs[1];

      gainNode.gain.setValueAtTime(0.12, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.16);

      osc1.connect(gainNode);
      osc2.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc1.start();
      osc2.start();
      osc1.stop(ctx.currentTime + 0.16);
      osc2.stop(ctx.currentTime + 0.16);
    } catch {
      // Audio context may fail if user hasn't interacted with document
    }
  }, [getAudioContext]);

  // Play realistic Ringback Tone (440Hz + 480Hz with European 2s on / 4s off cadence)
  const playRingback = useCallback(() => {
    try {
      const ctx = getAudioContext();
      if (!ctx) return () => {};

      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc1.frequency.value = 440;
      osc2.frequency.value = 480;

      gainNode.gain.setValueAtTime(0.06, ctx.currentTime);
      // Fade out after 1.8s
      gainNode.gain.setValueAtTime(0.06, ctx.currentTime + 1.8);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1.95);

      osc1.connect(gainNode);
      osc2.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc1.start();
      osc2.start();
      osc1.stop(ctx.currentTime + 2.0);
      osc2.stop(ctx.currentTime + 2.0);

      return () => {
        try {
          osc1.stop();
          osc2.stop();
        } catch {}
      };
    } catch {
      return () => {};
    }
  }, [getAudioContext]);

  // Play Busy / Call Ended Reorder Tone
  const playBusyTone = useCallback(() => {
    try {
      const ctx = getAudioContext();
      if (!ctx) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.frequency.value = 480;
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.4);
    } catch {}
  }, [getAudioContext]);

  // Start Echo Test audio loopback simulation
  const startEchoLoopback = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      echoStreamRef.current = stream;

      const ctx = getAudioContext();
      if (!ctx) return;

      const source = ctx.createMediaStreamSource(stream);
      const delay = ctx.createDelay();
      delay.delayTime.value = 0.28; // 280ms acoustic loopback latency

      const feedback = ctx.createGain();
      feedback.gain.value = 0.35;

      const masterGain = ctx.createGain();
      masterGain.gain.value = 0.6;

      source.connect(delay);
      delay.connect(feedback);
      feedback.connect(delay);
      delay.connect(masterGain);
      masterGain.connect(ctx.destination);

      echoDelayRef.current = { source, delay, feedback, masterGain };
    } catch {
      // Microphone permissions denied or not supported
    }
  }, [getAudioContext]);

  // Stop Echo Test loopback
  const stopEchoLoopback = useCallback(() => {
    if (echoStreamRef.current) {
      echoStreamRef.current.getTracks().forEach((track) => track.stop());
      echoStreamRef.current = null;
    }
    if (echoDelayRef.current) {
      try {
        echoDelayRef.current.source.disconnect();
        echoDelayRef.current.delay.disconnect();
        echoDelayRef.current.feedback.disconnect();
        echoDelayRef.current.masterGain.disconnect();
      } catch {}
      echoDelayRef.current = null;
    }
  }, []);

  // Handle Video Consultation stream toggle
  const toggleVideo = async () => {
    if (isVideoActive) {
      if (localMediaStreamRef.current) {
        localMediaStreamRef.current.getTracks().forEach((t) => t.stop());
        localMediaStreamRef.current = null;
      }
      setIsVideoActive(false);
      setCameraError('');
    } else {
      try {
        setCameraError('');
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false,
        });
        localMediaStreamRef.current = stream;
        setIsVideoActive(true);
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
      } catch (err) {
        setCameraError('Gagal mengakses kamera: ' + (err.message || 'Izin ditolak'));
        setIsVideoActive(false);
      }
    }
  };

  // Keyboard interaction
  const handleKeyPress = (char) => {
    playDTMF(char);
    if (callState === 'idle') {
      if (dialedNumber.length < 15) {
        setDialedNumber((prev) => prev + char);
      }
    } else if (callState === 'connected') {
      // Send DTMF in-band during active call (e.g. IVR menu selections)
      if (activeCallTarget?.ext === '1000') {
        if (char === '1') setIvrMessage('Menu 1: Layanan Administrasi Akademik & KRS');
        else if (char === '2') setIvrMessage('Menu 2: Bantuan Teknis Jaringan & SSO S4RAS');
        else if (char === '3') setIvrMessage('Menu 3: Posko Darurat & Operator Desa 3T');
        else setIvrMessage(`DTMF Terkirim: [${char}]`);
      }
    }
  };

  const handleBackspace = () => {
    setDialedNumber((prev) => prev.slice(0, -1));
  };

  const handleClear = () => {
    setDialedNumber('');
  };

  // Handle call initiation
  const handleCall = (targetExt = null) => {
    const ext = targetExt || dialedNumber;
    if (!ext) return;

    const matched = EXTENSION_DIRECTORY.find((item) => item.ext === ext);
    const target = matched || {
      ext,
      label: `Ekstensi ${ext}`,
      desc: 'Panggilan SIP PJSIP',
      badge: 'SIP User',
    };

    setActiveCallTarget(target);
    setCallState('calling');
    setCallDuration(0);
    setIvrMessage('');

    playRingback();

    // If calling video endpoint, auto-start camera
    if (ext === '1004') {
      toggleVideo();
    }

    // Simulate network latency & PBX pickup
    setTimeout(() => {
      setCallState('connected');

      // Start call timer
      timerRef.current = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);

      // Handle specific extension behaviors
      if (ext === '600') {
        startEchoLoopback();
      } else if (ext === '1000') {
        setIvrMessage('Selamat datang di Layanan Suara S4RAS. Tekan 1 untuk Akademik, 2 untuk IT, 3 untuk Operator.');
        if ('speechSynthesis' in window) {
          const u = new SpeechSynthesisUtterance('Selamat datang di Layanan Suara S4RAS. Silakan pilih menu.');
          u.lang = 'id-ID';
          window.speechSynthesis.speak(u);
        }
      }
    }, 2200);
  };

  // Handle call termination
  const handleHangup = () => {
    playBusyTone();
    setCallState('ended');

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    stopEchoLoopback();

    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }

    if (localMediaStreamRef.current) {
      localMediaStreamRef.current.getTracks().forEach((t) => t.stop());
      localMediaStreamRef.current = null;
    }
    setIsVideoActive(false);

    // Save call to local history
    if (activeCallTarget) {
      const record = {
        id: Date.now(),
        ext: activeCallTarget.ext,
        label: activeCallTarget.label,
        duration: callDuration,
        timestamp: new Date().toISOString(),
      };
      setCallHistory((prev) => {
        const next = [record, ...prev.slice(0, 19)];
        try {
          localStorage.setItem('s4ras_call_history', JSON.stringify(next));
        } catch {}
        return next;
      });
    }

    setTimeout(() => {
      setCallState('idle');
      setCallDuration(0);
      setActiveCallTarget(null);
      setIvrMessage('');
    }, 1500);
  };

  const handleClearHistory = () => {
    setCallHistory([]);
    try {
      localStorage.removeItem('s4ras_call_history');
    } catch {}
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
      if (echoStreamRef.current) {
        echoStreamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (localMediaStreamRef.current) {
        localMediaStreamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  if (!isOpen) return null;

  const formatTime = (secs) => {
    const mins = Math.floor(secs / 60);
    const remainder = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remainder.toString().padStart(2, '0')}`;
  };

  // Filtered categories and items
  const filteredCategories = DIRECTORY_CATEGORIES.map((cat) => {
    if (directoryFilter !== 'all' && cat.id !== directoryFilter) return null;
    const q = directorySearch.toLowerCase().trim();
    const matchingItems = cat.items.filter((item) => {
      return !q || item.ext.includes(q) || item.label.toLowerCase().includes(q) || item.desc.toLowerCase().includes(q);
    });
    if (matchingItems.length === 0) return null;
    return { ...cat, items: matchingItems };
  }).filter(Boolean);

  const totalDirectoryCount = EXTENSION_DIRECTORY.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div
        className={`bg-[var(--color-neutral-bg1)] border border-[var(--color-border-default)] rounded-2xl w-full overflow-hidden shadow-2xl flex flex-col max-h-[85dvh] text-[var(--color-text-primary)] transition-all duration-300 ${
          isVideoActive && callState !== 'idle' ? 'max-w-4xl' : 'max-w-md'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-[var(--color-neutral-bg2)] border-b border-[var(--color-border-default)] p-3.5 sm:p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Phone className="w-5 h-5 text-[var(--color-text-primary)] mt-0.5 shrink-0" />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-[var(--color-text-primary)] tracking-tight">
                  Telefoni S4RAS (WebPhone)
                </h3>
                {sipSecret ? (
                  <span className="bg-[var(--color-neutral-bg1)] border border-[var(--color-border-default)] text-[var(--color-text-secondary)] text-[11px] px-2.5 py-0.5 rounded-full inline-flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                    <span>Terhubung</span>
                  </span>
                ) : (
                  <span className="bg-[var(--color-neutral-bg1)] border border-[var(--color-border-default)] text-[var(--color-text-secondary)] text-[11px] px-2.5 py-0.5 rounded-full inline-flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                    <span>Perlu Login</span>
                  </span>
                )}
                {isVideoActive && (
                  <span className="bg-[var(--color-neutral-bg1)] border border-[var(--color-border-default)] text-[var(--color-text-secondary)] text-[11px] px-2.5 py-0.5 rounded-full inline-flex items-center gap-1.5">
                    <Video size={11} className="text-emerald-500" />
                    <span>VP8 HD</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-[var(--color-text-secondary)] m-0 mt-0.5">
                PJSIP WebRTC • Ekstensi {myExtension} ({roleLabel})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] p-1.5 rounded-lg hover:bg-[var(--color-neutral-bg3)] transition-colors cursor-pointer"
            aria-label="Tutup Softphone"
          >
            <X size={18} />
          </button>
        </div>

        {/* Sub-Navigation Tabs */}
        {callState === 'idle' && (
          <div className="flex border-b border-[var(--color-border-default)] bg-[var(--color-neutral-bg2)]/60 px-4 pt-2 gap-2">
            <button
              onClick={() => setActiveTab('dialer')}
              className={`flex items-center gap-1.5 pb-2.5 px-3 text-xs border-b-2 transition-all cursor-pointer ${
                activeTab === 'dialer'
                  ? 'border-[var(--color-text-primary)] text-[var(--color-text-primary)] font-semibold'
                  : 'border-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
              }`}
            >
              <Phone size={13} />
              <span>Dialpad</span>
            </button>
            <button
              onClick={() => setActiveTab('directory')}
              className={`flex items-center gap-1.5 pb-2.5 px-3 text-xs border-b-2 transition-all cursor-pointer ${
                activeTab === 'directory'
                  ? 'border-[var(--color-text-primary)] text-[var(--color-text-primary)] font-semibold'
                  : 'border-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
              }`}
            >
              <BookOpen size={13} />
              <span>Direktori ({totalDirectoryCount})</span>
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`flex items-center gap-1.5 pb-2.5 px-3 text-xs border-b-2 transition-all cursor-pointer ${
                activeTab === 'history'
                  ? 'border-[var(--color-text-primary)] text-[var(--color-text-primary)] font-semibold'
                  : 'border-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
              }`}
            >
              <Clock size={13} />
              <span>Riwayat ({callHistory.length})</span>
            </button>
          </div>
        )}

        {/* Modal Main Body */}
        <div className="p-3.5 sm:p-4 flex-1 flex flex-col justify-between overflow-y-auto">
          {callState !== 'idle' ? (
            /* Active Call Screen (Dual-Mode when Video Active) */
            <div className={`flex-1 flex flex-col ${isVideoActive ? 'lg:flex-row gap-4' : 'items-center justify-center py-2 sm:py-4'} text-center`}>
              {isVideoActive && (
                <SoftphoneVideoCanvas
                  activeCallTarget={activeCallTarget}
                  localVideoRef={localVideoRef}
                  myExtension={myExtension}
                />
              )}

              {/* In-Call Controls & State Panel */}
              <div className={`${isVideoActive ? 'w-full lg:w-72 flex flex-col justify-center items-center' : 'w-full flex flex-col items-center'}`}>
                {!isVideoActive && (
                  <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-4 transition-all duration-300 ${
                    callState === 'calling'
                      ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30 animate-pulse'
                      : callState === 'connected'
                      ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                      : 'bg-red-500/15 text-red-400 border border-red-500/30'
                  }`}>
                    {callState === 'calling' ? <PhoneCall size={32} className="animate-bounce" /> : <Phone size={32} />}
                  </div>
                )}

                <h4 className="text-base sm:text-lg font-semibold text-[var(--color-text-primary)] m-0 mb-1">
                  {activeCallTarget?.label || dialedNumber}
                </h4>
                <p className="text-xs text-[var(--color-text-secondary)] m-0 mb-3 font-sans">
                  {activeCallTarget?.desc || 'SIP Extension'} · Ext {activeCallTarget?.ext || dialedNumber}
                </p>

                <SoftphoneScreen
                  callState={callState}
                  dialedNumber={dialedNumber}
                  activeCallTarget={activeCallTarget}
                  callDuration={callDuration}
                  formatTime={formatTime}
                  handleBackspace={handleBackspace}
                  handleClear={handleClear}
                  cameraError={cameraError}
                  ivrMessage={ivrMessage}
                  onCallVoicemail={() => handleCall('*97')}
                  onSelectQuickDial={(ext) => setDialedNumber(ext)}
                />

                {/* In-Call Action Buttons */}
                <div className="flex items-center gap-3 mt-2">
                  <button
                    onClick={() => setIsMuted(!isMuted)}
                    className={`p-3 rounded-full border transition-all cursor-pointer ${
                      isMuted
                        ? 'bg-red-500/20 border-red-500/40 text-red-400'
                        : 'bg-[var(--color-neutral-bg2)] border-[var(--color-border-default)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-neutral-bg3)]'
                    }`}
                    title={isMuted ? 'Unmute' : 'Mute'}
                  >
                    {isMuted ? <MicOff size={18} /> : <Mic size={18} />}
                  </button>

                  <button
                    onClick={toggleVideo}
                    className={`p-3 rounded-full border transition-all cursor-pointer ${
                      isVideoActive
                        ? 'bg-[var(--color-neutral-bg1)] border-[var(--color-border-default)] text-emerald-400'
                        : 'bg-[var(--color-neutral-bg2)] border-[var(--color-border-default)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-neutral-bg3)]'
                    }`}
                    title={isVideoActive ? 'Tutup Kamera Video' : 'Buka Kamera Video'}
                  >
                    {isVideoActive ? <Video size={18} /> : <VideoOff size={18} />}
                  </button>

                  <button
                    onClick={handleHangup}
                    className="p-3.5 rounded-full bg-[#dc2626] hover:bg-[#b91c1c] text-white shadow-md transition-all active:scale-95 cursor-pointer"
                    title="Akhiri Panggilan"
                  >
                    <PhoneOff size={20} />
                  </button>

                  <button
                    onClick={() => setIsSpeakerOn(!isSpeakerOn)}
                    className={`p-3 rounded-full border transition-all cursor-pointer ${
                      isSpeakerOn
                        ? 'bg-[var(--color-neutral-bg2)] border-[var(--color-border-default)] text-[var(--color-text-primary)] hover:bg-[var(--color-neutral-bg3)]'
                        : 'bg-[var(--color-neutral-bg2)] border-[var(--color-border-default)] text-[var(--color-text-muted)]'
                    }`}
                    title={isSpeakerOn ? 'Speaker On' : 'Speaker Off'}
                  >
                    {isSpeakerOn ? <Volume2 size={18} /> : <VolumeX size={18} />}
                  </button>
                </div>

                {/* IVR In-Call Numeric Keypad */}
                {callState === 'connected' && (
                  <SoftphoneKeypad
                    keys={DIALPAD_KEYS}
                    onKeyPress={handleKeyPress}
                    isCallActive={true}
                  />
                )}
              </div>
            </div>
          ) : activeTab === 'directory' ? (
            /* Directory Tab Mode */
            <div className="flex-1 flex flex-col justify-between overflow-y-auto">
              <div>
                {/* Search Bar */}
                <div className="relative mb-3">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
                  <input
                    type="text"
                    value={directorySearch}
                    onChange={(e) => setDirectorySearch(e.target.value)}
                    placeholder="Cari nama, ekstensi, atau divisi..."
                    className="w-full bg-[var(--color-neutral-bg2)] border border-[var(--color-border-default)] rounded-xl pl-9 pr-3 py-2 text-xs text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-border-strong)] transition-colors font-sans"
                  />
                </div>

                {/* Filter Pills */}
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {[
                    { id: 'all', label: 'Semua' },
                    { id: 'support', label: 'Layanan 3T' },
                    { id: 'civitas', label: 'Sivitas & Dosen' },
                    { id: 'utilities', label: 'Utilitas PBX' }
                  ].map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setDirectoryFilter(cat.id)}
                      className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-all cursor-pointer ${
                        directoryFilter === cat.id
                          ? 'bg-[var(--color-text-primary)] text-[var(--color-neutral-bg1)] shadow-sm'
                          : 'bg-[var(--color-neutral-bg2)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] border border-[var(--color-border-default)]'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>

                {/* Contact List Grouped by Category */}
                <div className="space-y-4 max-h-[46vh] overflow-y-auto pr-1">
                  {filteredCategories.map((group) => (
                    <div key={group.id} className="space-y-1.5">
                      <div className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)] px-1">
                        {group.title}
                      </div>
                      {group.items.map((item) => (
                        <div
                          key={item.ext}
                          className="p-2.5 rounded-xl bg-[var(--color-neutral-bg2)] border border-[var(--color-border-default)] flex items-center justify-between gap-2 hover:bg-[var(--color-neutral-bg3)] transition-colors group"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className="font-mono text-xs font-semibold text-[var(--color-text-primary)] bg-[var(--color-neutral-bg1)] border border-[var(--color-border-default)] px-2 py-0.5 rounded-md shrink-0">
                              {item.ext}
                            </span>
                            <div className="min-w-0">
                              <p className="text-xs font-semibold text-[var(--color-text-primary)] truncate m-0">
                                {item.label}
                              </p>
                              <p className="text-[10px] text-[var(--color-text-secondary)] truncate m-0 font-sans mt-0.5">
                                {item.desc}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-[var(--color-neutral-bg1)] border border-[var(--color-border-default)] text-[var(--color-text-secondary)]">
                              {item.badge}
                            </span>
                            <button
                              onClick={() => handleCall(item.ext)}
                              className="h-8 px-3 rounded-xl bg-[var(--color-neutral-bg1)] hover:bg-[var(--color-neutral-bg3)] border border-[var(--color-border-default)] text-xs font-medium text-[var(--color-text-primary)] inline-flex items-center gap-1.5 transition-colors cursor-pointer active:scale-95"
                            >
                              <PhoneCall size={12} className="text-[var(--color-text-primary)]" />
                              <span>Panggil</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ))}
                  {filteredCategories.length === 0 && (
                    <div className="py-8 text-center text-[var(--color-text-muted)] text-xs">
                      Tidak ada kontak yang cocok dengan pencarian.
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-3 pt-2.5 border-t border-[var(--color-border-default)]">
                <button
                  onClick={() => setActiveTab('dialer')}
                  className="w-full py-2 rounded-xl bg-[var(--color-neutral-bg2)] hover:bg-[var(--color-neutral-bg3)] border border-[var(--color-border-default)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] text-xs font-medium transition-colors cursor-pointer"
                >
                  Kembali ke Dialpad
                </button>
              </div>
            </div>
          ) : activeTab === 'history' ? (
            /* History Tab Mode */
            <div className="flex-1 flex flex-col justify-between overflow-y-auto">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-[var(--color-text-secondary)]">
                    Riwayat Panggilan ({callHistory.length})
                  </span>
                  {callHistory.length > 0 && (
                    <button
                      onClick={handleClearHistory}
                      className="flex items-center gap-1 text-[11px] text-red-400 hover:underline px-2 py-0.5 rounded transition-colors cursor-pointer"
                    >
                      <Trash2 size={12} />
                      <span>Hapus Semua</span>
                    </button>
                  )}
                </div>

                {callHistory.length === 0 ? (
                  <div className="py-12 text-center text-[var(--color-text-muted)]">
                    <Clock size={36} className="mx-auto mb-2 opacity-30" />
                    <p className="text-xs m-0">Belum ada panggilan yang dicatat.</p>
                  </div>
                ) : (
                  <div className="space-y-1.5 max-h-[46vh] overflow-y-auto pr-1">
                    {callHistory.map((item) => (
                      <div
                        key={item.id}
                        className="p-2.5 rounded-xl bg-[var(--color-neutral-bg2)] border border-[var(--color-border-default)] flex items-center justify-between gap-2 transition-colors hover:bg-[var(--color-neutral-bg3)]"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-8 h-8 rounded-full bg-[var(--color-neutral-bg1)] text-[var(--color-text-secondary)] border border-[var(--color-border-default)] flex items-center justify-center shrink-0">
                            <PhoneCall size={14} />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-[var(--color-text-primary)] m-0 truncate">{item.label}</p>
                            <p className="text-[10px] text-[var(--color-text-secondary)] font-mono m-0 mt-0.5">
                              Ext {item.ext} · Durasi: {formatTime(item.duration || 0)}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[10px] text-[var(--color-text-muted)]">
                            {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          <button
                            onClick={() => {
                              setActiveTab('dialer');
                              handleCall(item.ext);
                            }}
                            className="h-8 px-2.5 rounded-lg bg-[var(--color-neutral-bg1)] hover:bg-[var(--color-neutral-bg3)] text-[var(--color-text-primary)] border border-[var(--color-border-default)] transition-colors cursor-pointer inline-flex items-center gap-1 text-xs"
                            title="Panggil Kembali"
                          >
                            <RotateCcw size={13} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="mt-3 pt-2.5 border-t border-[var(--color-border-default)]">
                <button
                  onClick={() => setActiveTab('dialer')}
                  className="w-full py-2 rounded-xl bg-[var(--color-neutral-bg2)] hover:bg-[var(--color-neutral-bg3)] border border-[var(--color-border-default)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] text-xs font-medium transition-colors cursor-pointer"
                >
                  Kembali ke Dialpad
                </button>
              </div>
            </div>
          ) : (
            /* Dialpad Mode with Digital LCD Screen */
            <>
              <SoftphoneScreen
                callState={callState}
                dialedNumber={dialedNumber}
                activeCallTarget={activeCallTarget}
                callDuration={callDuration}
                formatTime={formatTime}
                handleBackspace={handleBackspace}
                handleClear={handleClear}
                cameraError={cameraError}
                ivrMessage={ivrMessage}
                onCallVoicemail={() => handleCall('*97')}
                onSelectQuickDial={(ext) => setDialedNumber(ext)}
              />
              <SoftphoneKeypad
                keys={DIALPAD_KEYS}
                onKeyPress={handleKeyPress}
                onCall={() => handleCall()}
                dialedNumber={dialedNumber}
                isCallActive={false}
              />
            </>
          )}
        </div>

        {/* Footer */}
        <div className="bg-[var(--color-neutral-bg2)]/80 border-t border-[var(--color-border-default)] px-4 py-2.5 text-[10px] text-[var(--color-text-secondary)] flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <ShieldCheck size={12} className="text-[var(--color-text-secondary)]" />
            <span>Encrypted WebRTC / SRTP</span>
          </div>
          <div className="flex items-center gap-1.5 font-mono">
            <Server size={11} className="text-[var(--color-text-muted)]" />
            <span>Asterisk 22 & 20 Trunk</span>
          </div>
        </div>
      </div>
    </div>
  );
}
