import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Phone, PhoneCall, PhoneOff, Mic, MicOff, Volume2, VolumeX, Shield, X,
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

const EXTENSION_DIRECTORY = [
  { ext: '1000', label: 'Automated Campus IVR', desc: 'Menu Suara Interaktif Utama Kampus', category: 'service', badge: 'Layanan PBX', roleColor: 'bg-rose-500/15 text-rose-400 border-rose-500/30' },
  { ext: '600', label: 'VoIP Audio Echo Test', desc: 'Uji Latensi & Loopback Kualitas Mikrofon', category: 'service', badge: 'Layanan PBX', roleColor: 'bg-rose-500/15 text-rose-400 border-rose-500/30' },
  { ext: '800', label: 'Campus Conference Bridge', desc: 'Ruang Konferensi Audio Multi-Pihak', category: 'service', badge: 'Layanan PBX', roleColor: 'bg-rose-500/15 text-rose-400 border-rose-500/30' },
  { ext: '500', label: 'Voicemail Central', desc: 'Pusat Kotak Suara & Rekaman Pesan Sivitas', category: 'service', badge: 'Layanan PBX', roleColor: 'bg-rose-500/15 text-rose-400 border-rose-500/30' },
  { ext: '1001', label: 'Budi Pratama', desc: 'Perwakilan Mahasiswa / Student Council', category: 'student', badge: 'Mahasiswa', roleColor: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' },
  { ext: '1002', label: 'Dr. Hendra Wijaya', desc: 'Dosen Komputasi Awan / Faculty Desk', category: 'academic', badge: 'Dosen', roleColor: 'bg-rose-500/15 text-rose-400 border-rose-500/30' },
  { ext: '1003', label: 'IT DevOps Team', desc: 'Infrastruktur Cloud & Pemeliharaan Server', category: 'admin', badge: 'DevOps', roleColor: 'bg-amber-500/15 text-amber-400 border-amber-500/30' },
  { ext: '1004', label: 'Academic Video Consultation', desc: 'Konsultasi Akademik Tatap Muka (VP8 HD)', category: 'admin', badge: 'Video HD', roleColor: 'bg-red-500/15 text-red-400 border-red-500/30' },
  { ext: '1074700', label: 'S4RAS Administrator', desc: 'Operator WebRTC & Security Center', category: 'admin', badge: 'Admin', roleColor: 'bg-rose-500/15 text-rose-400 border-rose-500/30' },
  { ext: '1079348', label: 'Sivitas Peneliti', desc: 'Research Fellow & Cluster Architect', category: 'admin', badge: 'Fellow', roleColor: 'bg-amber-500/15 text-amber-400 border-amber-500/30' },
  { ext: '201', label: 'VM 201 PBX Trunk', desc: 'Rute Trunk Inter-PBX Asterisk 20 Simpul 1', category: 'trunk', badge: 'Trunk', roleColor: 'bg-purple-500/15 text-purple-400 border-purple-500/30' },
];

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
      // Ignore audio failure
    }
  }, [getAudioContext]);

  // Speech synthesis for automated IVR
  const speakText = useCallback((text) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.lang = 'en-US';
      window.speechSynthesis.speak(utterance);
    }
  }, []);

  // Keypad click handler
  const handleKeyPress = (char) => {
    playDTMF(char);
    if (callState === 'connected' && (activeCallTarget?.ext === '1000' || dialedNumber === '1000')) {
      if (char === '1') {
        const msg = 'Routing to Student Services on Extension 1001.';
        setIvrMessage(msg);
        speakText(msg);
      } else if (char === '2') {
        const msg = 'Routing to Faculty Support on Extension 1002.';
        setIvrMessage(msg);
        speakText(msg);
      } else if (char === '3') {
        const msg = 'Routing to Network Operations Center on Extension 1003.';
        setIvrMessage(msg);
        speakText(msg);
      } else if (char === '4') {
        const msg = 'Entering Echo Audio Diagnostics mode.';
        setIvrMessage(msg);
        speakText(msg);
      } else {
        const msg = 'Invalid option. Press 1 for Student, 2 for Faculty, 3 for DevOps, 4 for Echo.';
        setIvrMessage(msg);
        speakText(msg);
      }
      return;
    }

    if (dialedNumber.length < 10) {
      setDialedNumber((prev) => prev + char);
    }
  };

  const handleBackspace = () => {
    setDialedNumber((prev) => prev.slice(0, -1));
  };

  const handleClear = () => {
    setDialedNumber('');
  };

  // Start Call
  const handleCall = (targetExt = dialedNumber) => {
    const ext = targetExt || dialedNumber;
    if (!ext) return;

    const matched = EXTENSION_DIRECTORY.find((s) => s.ext === ext) || {
      ext,
      label: `Ekstensi ${ext}`,
      desc: 'PBX Subscriber',
      badge: 'Inter-PBX'
    };

    setActiveCallTarget(matched);
    setCallState('calling');
    setCallDuration(0);
    setIvrMessage('');

    // Simulate ringback tone
    const ctx = getAudioContext();
    let ringOsc1, ringOsc2, ringGain;
    if (ctx) {
      try {
        ringOsc1 = ctx.createOscillator();
        ringOsc2 = ctx.createOscillator();
        ringGain = ctx.createGain();
        ringOsc1.frequency.value = 440;
        ringOsc2.frequency.value = 480;
        ringGain.gain.setValueAtTime(0.08, ctx.currentTime);
        ringOsc1.connect(ringGain);
        ringOsc2.connect(ringGain);
        ringGain.connect(ctx.destination);
        ringOsc1.start();
        ringOsc2.start();
      } catch {
        // audio fail
      }
    }

    setTimeout(() => {
      if (ringOsc1) {
        try {
          ringOsc1.stop();
          ringOsc2.stop();
        } catch {
          // pass
        }
      }
      setCallState('connected');
      if (ext === '1004') {
        setIsVideoActive(true);
      }

      if (ext === '1000') {
        const welcome = 'Welcome to S4RAS Campus Automated Telephony. Press 1 for Student, 2 for Faculty, 3 for IT DevOps, 4 for Echo Test.';
        setIvrMessage(welcome);
        speakText(welcome);
      } else if (ext === '800' || ext === '888') {
        const welcome = 'Connected to Campus Multi-Party Conference Room 800. You are now speaking with active participants.';
        setIvrMessage(welcome);
        speakText(welcome);
      } else if (ext === '500' || ext === '*98') {
        const welcome = 'Comedian Mail. Please enter your mailbox number followed by the pound key.';
        setIvrMessage(welcome);
        speakText(welcome);
      } else if (ext === '600') {
        const welcome = 'Echo test activated. Speak now to test audio latency.';
        setIvrMessage(welcome);
        speakText(welcome);

        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
            echoStreamRef.current = stream;
            try {
              const audioCtx = getAudioContext();
              if (audioCtx) {
                const micNode = audioCtx.createMediaStreamSource(stream);
                const delayNode = audioCtx.createDelay();
                delayNode.delayTime.value = 0.35; // 350ms echo delay
                const gainNode = audioCtx.createGain();
                gainNode.gain.value = 0.8;
                micNode.connect(delayNode);
                delayNode.connect(gainNode);
                gainNode.connect(audioCtx.destination);
                echoDelayRef.current = delayNode;
              }
            } catch {
              // Pass
            }
          }).catch(() => {});
        }
      } else {
        const msg = `Connected to ${matched.label} on SIP Trunk PBX.`;
        setIvrMessage(msg);
      }
    }, 1800);
  };

  // Video consultation stream toggle
  const toggleVideo = async () => {
    if (isVideoActive) {
      if (localMediaStreamRef.current) {
        localMediaStreamRef.current.getTracks().forEach((track) => track.stop());
        localMediaStreamRef.current = null;
      }
      setIsVideoActive(false);
    } else {
      setCameraError('');
      try {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          const cameraPromise = navigator.mediaDevices.getUserMedia({
            video: { width: { ideal: 640 }, height: { ideal: 480 }, frameRate: { ideal: 24 } },
            audio: false
          });
          const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 1200));
          const stream = await Promise.race([cameraPromise, timeoutPromise]);
          localMediaStreamRef.current = stream;
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = stream;
          }
        }
      } catch (err) {
        if (err?.message !== 'timeout') {
          console.warn('Webcam access notice:', err);
        }
        setCameraError('Simulasi umpan video WebRTC aktif (VP8/H.264 passthrough).');
      }
      setIsVideoActive(true);
    }
  };

  // End Call
  const handleHangup = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    if (echoStreamRef.current) {
      echoStreamRef.current.getTracks().forEach((t) => t.stop());
      echoStreamRef.current = null;
    }
    if (localMediaStreamRef.current) {
      localMediaStreamRef.current.getTracks().forEach((t) => t.stop());
      localMediaStreamRef.current = null;
    }
    setIsVideoActive(false);

    const targetExt = activeCallTarget?.ext || dialedNumber;
    const targetLabel = activeCallTarget?.label || `Ext ${targetExt}`;
    if (targetExt) {
      const entry = {
        id: Date.now(),
        ext: targetExt,
        label: targetLabel,
        timestamp: new Date().toISOString(),
        duration: callDuration,
      };
      const updated = [entry, ...callHistory.filter((h) => h.ext !== targetExt || Date.now() - h.id > 1000)].slice(0, 30);
      try {
        localStorage.setItem('s4ras_call_history', JSON.stringify(updated));
      } catch {
        // storage quota
      }
      setCallHistory(updated);
    }

    setCallState('ended');
    setTimeout(() => {
      setCallState('idle');
      setActiveCallTarget(null);
      setIvrMessage('');
      setCallDuration(0);
    }, 1200);
  };

  const handleClearHistory = () => {
    try {
      localStorage.removeItem('s4ras_call_history');
    } catch {}
    setCallHistory([]);
  };

  // Call duration counter
  useEffect(() => {
    if (callState === 'connected') {
      timerRef.current = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [callState]);

  // Clean up audio and video on unmount
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

  // Filtered directory items
  const filteredDirectory = EXTENSION_DIRECTORY.filter((item) => {
    const matchesCat = directoryFilter === 'all' || item.category === directoryFilter;
    const q = directorySearch.toLowerCase().trim();
    const matchesSearch = !q || item.ext.includes(q) || item.label.toLowerCase().includes(q) || item.desc.toLowerCase().includes(q);
    return matchesCat && matchesSearch;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div
        className={`bg-[#0a0c10] border border-white/10 rounded-2xl w-full overflow-hidden shadow-[0_25px_60px_rgba(0,0,0,0.8)] flex flex-col max-h-[94vh] sm:max-h-[90vh] transition-all duration-300 ${
          isVideoActive && callState !== 'idle' ? 'max-w-4xl' : 'max-w-md'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Academic Header */}
        <div className="bg-[#12141c] border-b border-white/10 p-3.5 sm:p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#b91c1c]/25 to-[#ef4444]/15 border border-[#b91c1c]/40 flex items-center justify-center text-[#ef4444] shadow-[0_0_15px_rgba(185,28,28,0.2)]">
              <PhoneCall size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white tracking-tight">S4RAS Campus Softphone</h3>
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Cluster Online
                </span>
                {isVideoActive && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#b91c1c]/20 text-[#ef4444] border border-[#b91c1c]/30">
                    <Video size={10} />
                    VP8 HD
                  </span>
                )}
              </div>
              <p className="text-[11px] text-neutral-400 m-0">
                PJSIP PBX Trunk · Ekstensi <span className="font-mono text-[#ef4444] font-bold">{myExtension}</span> ({roleLabel})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-white p-1.5 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
            aria-label="Tutup Softphone"
          >
            <X size={18} />
          </button>
        </div>

        {/* Sub-Navigation Tabs */}
        {callState === 'idle' && (
          <div className="flex border-b border-white/10 bg-[#12141c]/60 px-3 pt-2 gap-1">
            <button
              onClick={() => setActiveTab('dialer')}
              className={`flex items-center gap-1.5 pb-2.5 px-3 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
                activeTab === 'dialer'
                  ? 'border-[#b91c1c] text-[#ef4444]'
                  : 'border-transparent text-neutral-400 hover:text-white'
              }`}
            >
              <Phone size={13} />
              <span>Dialpad</span>
            </button>
            <button
              onClick={() => setActiveTab('directory')}
              className={`flex items-center gap-1.5 pb-2.5 px-3 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
                activeTab === 'directory'
                  ? 'border-[#b91c1c] text-[#ef4444]'
                  : 'border-transparent text-neutral-400 hover:text-white'
              }`}
            >
              <BookOpen size={13} />
              <span>Direktori ({EXTENSION_DIRECTORY.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`flex items-center gap-1.5 pb-2.5 px-3 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
                activeTab === 'history'
                  ? 'border-[#b91c1c] text-[#ef4444]'
                  : 'border-transparent text-neutral-400 hover:text-white'
              }`}
            >
              <Clock size={13} />
              <span>Riwayat ({callHistory.length})</span>
            </button>
          </div>
        )}

        {/* Modal Main Body */}
        <div className="p-3 sm:p-4 flex-1 flex flex-col justify-between overflow-y-auto">
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
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40 animate-pulse'
                      : callState === 'connected'
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-[0_0_25px_rgba(16,185,129,0.35)]'
                      : 'bg-red-500/20 text-red-400 border border-red-500/40'
                  }`}>
                    {callState === 'calling' ? <PhoneCall size={34} className="animate-bounce" /> : <Phone size={34} />}
                  </div>
                )}

                <h4 className="text-base sm:text-lg font-bold text-white m-0 mb-1">
                  {activeCallTarget?.label || dialedNumber}
                </h4>
                <p className="text-xs text-neutral-400 m-0 mb-2">
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
                  onCallVoicemail={() => handleCall('500')}
                />

                {/* Action Buttons */}
                <div className="flex items-center gap-3 mt-1">
                  <button
                    onClick={() => setIsMuted(!isMuted)}
                    className={`p-3 rounded-full border transition-all cursor-pointer ${
                      isMuted
                        ? 'bg-red-500/20 border-red-500/40 text-red-400'
                        : 'bg-[#12141c] border-white/10 text-neutral-400 hover:text-white'
                    }`}
                    title={isMuted ? 'Unmute' : 'Mute'}
                  >
                    {isMuted ? <MicOff size={18} /> : <Mic size={18} />}
                  </button>

                  <button
                    onClick={toggleVideo}
                    className={`p-3 rounded-full border transition-all cursor-pointer ${
                      isVideoActive
                        ? 'bg-[#b91c1c]/25 border-[#b91c1c]/50 text-[#ef4444] shadow-[0_0_15px_rgba(185,28,28,0.3)]'
                        : 'bg-[#12141c] border-white/10 text-neutral-400 hover:text-white'
                    }`}
                    title={isVideoActive ? 'Tutup Kamera Video' : 'Buka Kamera Video'}
                  >
                    {isVideoActive ? <Video size={18} /> : <VideoOff size={18} />}
                  </button>

                  <button
                    onClick={handleHangup}
                    className="p-4 rounded-full bg-gradient-to-br from-[#b91c1c] to-[#ef4444] hover:from-red-700 hover:to-red-600 text-white shadow-[0_4px_18px_rgba(239,68,68,0.4)] transition-all active:scale-95 cursor-pointer"
                    title="Akhiri Panggilan"
                  >
                    <PhoneOff size={22} />
                  </button>

                  <button
                    onClick={() => setIsSpeakerOn(!isSpeakerOn)}
                    className={`p-3 rounded-full border transition-all cursor-pointer ${
                      isSpeakerOn
                        ? 'bg-[#12141c] border-white/10 text-white'
                        : 'bg-[#12141c]/50 border-white/5 text-neutral-500'
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
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                  <input
                    type="text"
                    value={directorySearch}
                    onChange={(e) => setDirectorySearch(e.target.value)}
                    placeholder="Cari nama, ekstensi, atau divisi..."
                    className="w-full bg-[#12141c] border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-[#b91c1c] transition-colors font-sans"
                  />
                </div>

                {/* Filter Pills */}
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {[
                    { id: 'all', label: 'Semua' },
                    { id: 'academic', label: 'Dosen' },
                    { id: 'student', label: 'Mahasiswa' },
                    { id: 'service', label: 'Layanan PBX' },
                    { id: 'trunk', label: 'Trunk' }
                  ].map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setDirectoryFilter(cat.id)}
                      className={`px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all cursor-pointer ${
                        directoryFilter === cat.id
                          ? 'bg-[#b91c1c] text-white shadow-[0_2px_10px_rgba(185,28,28,0.4)]'
                          : 'bg-[#12141c] text-neutral-400 hover:text-white border border-white/5'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>

                {/* Contact List */}
                <div className="space-y-1.5 max-h-[46vh] overflow-y-auto pr-1">
                  {filteredDirectory.map((item) => (
                    <div
                      key={item.ext}
                      className="p-2.5 rounded-xl bg-[#12141c] border border-white/10 flex items-center justify-between gap-2 hover:border-[#b91c1c]/40 transition-all group"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="font-mono text-xs font-bold text-[#ef4444] bg-[#b91c1c]/10 border border-[#b91c1c]/25 px-2 py-0.5 rounded-md shrink-0">
                          {item.ext}
                        </span>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-white truncate m-0 group-hover:text-[#ef4444] transition-colors">
                            {item.label}
                          </p>
                          <p className="text-[10px] text-neutral-400 truncate m-0 font-sans">
                            {item.desc}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`text-[9px] font-semibold px-2 py-0.5 rounded-full border ${item.roleColor}`}>
                          {item.badge}
                        </span>
                        <button
                          onClick={() => handleCall(item.ext)}
                          className="px-2.5 py-1 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-400 border border-emerald-500/30 text-[11px] font-semibold flex items-center gap-1 transition-all cursor-pointer active:scale-95"
                        >
                          <PhoneCall size={11} />
                          <span>Panggil</span>
                        </button>
                      </div>
                    </div>
                  ))}
                  {filteredDirectory.length === 0 && (
                    <div className="py-8 text-center text-neutral-500 text-xs">
                      Tidak ada kontak yang cocok dengan pencarian.
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-3 pt-2.5 border-t border-white/10">
                <button
                  onClick={() => setActiveTab('dialer')}
                  className="w-full py-2 rounded-xl bg-[#12141c] hover:bg-white/5 border border-white/10 text-neutral-300 text-xs font-semibold transition-colors cursor-pointer"
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
                  <span className="text-xs font-semibold text-neutral-400">
                    Riwayat Panggilan ({callHistory.length})
                  </span>
                  {callHistory.length > 0 && (
                    <button
                      onClick={handleClearHistory}
                      className="flex items-center gap-1 text-[11px] text-red-400 hover:underline hover:bg-red-500/10 px-2 py-0.5 rounded transition-colors cursor-pointer"
                    >
                      <Trash2 size={12} />
                      <span>Hapus Semua</span>
                    </button>
                  )}
                </div>

                {callHistory.length === 0 ? (
                  <div className="py-12 text-center text-neutral-500">
                    <Clock size={36} className="mx-auto mb-2 opacity-30" />
                    <p className="text-xs m-0">Belum ada panggilan yang dicatat.</p>
                  </div>
                ) : (
                  <div className="space-y-1.5 max-h-[46vh] overflow-y-auto pr-1">
                    {callHistory.map((item) => (
                      <div
                        key={item.id}
                        className="p-2.5 rounded-xl bg-[#12141c] border border-white/10 flex items-center justify-between gap-2 transition-colors hover:border-[#b91c1c]/40"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
                            <PhoneCall size={14} />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-white m-0">{item.label}</p>
                            <p className="text-[10px] text-neutral-400 font-mono m-0">
                              Ext {item.ext} · Durasi: {formatTime(item.duration || 0)}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-neutral-500">
                            {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          <button
                            onClick={() => {
                              setActiveTab('dialer');
                              handleCall(item.ext);
                            }}
                            className="p-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-400 border border-emerald-500/30 transition-colors cursor-pointer"
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

              <div className="mt-3 pt-2.5 border-t border-white/10">
                <button
                  onClick={() => setActiveTab('dialer')}
                  className="w-full py-2 rounded-xl bg-[#12141c] hover:bg-white/5 border border-white/10 text-neutral-300 text-xs font-semibold transition-colors cursor-pointer"
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
                onCallVoicemail={() => handleCall('500')}
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

        {/* Academic Footer Info */}
        <div className="bg-[#12141c]/90 border-t border-white/10 px-4 py-2.5 text-[10px] text-neutral-400 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Shield size={12} className="text-[#ef4444]" />
            <span>Encrypted WebRTC / SRTP</span>
          </div>
          <div className="flex items-center gap-1.5 font-mono">
            <Server size={11} className="text-neutral-500" />
            <span>Asterisk 22 & 20 Trunk</span>
          </div>
        </div>
      </div>
    </div>
  );
}
