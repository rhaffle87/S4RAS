import React, { useEffect, useRef } from 'react';
import { Video, Mic, ShieldAlert, Sparkles } from 'lucide-react';

export default function SoftphoneVideoCanvas({
  activeCallTarget,
  localVideoRef,
  localStream,
  remoteStream,
  myExtension
}) {
  const mainVideoRef = useRef(null);
  const isEchoTest = activeCallTarget?.ext === '600';
  const isAudioOnlyQueue = ['700', '1000', '*97', '500', '*60', '800', '8000'].includes(activeCallTarget?.ext);

  // Attach local preview stream to the PiP webcam preview element
  useEffect(() => {
    if (localVideoRef?.current && localStream) {
      localVideoRef.current.srcObject = localStream;
      localVideoRef.current.play().catch(() => {});
    }
  }, [localStream, localVideoRef]);

  // Attach main video stream (Remote peer stream or Echo test loopback)
  useEffect(() => {
    if (mainVideoRef.current) {
      if (isEchoTest && localStream) {
        // Echo test video loopback: mirror local camera to main canvas
        mainVideoRef.current.srcObject = localStream;
        mainVideoRef.current.play().catch(() => {});
      } else if (remoteStream) {
        // Real peer video stream
        mainVideoRef.current.srcObject = remoteStream;
        mainVideoRef.current.play().catch(() => {});
      } else {
        mainVideoRef.current.srcObject = null;
      }
    }
  }, [isEchoTest, localStream, remoteStream]);

  const hasMainVideo = (isEchoTest && !!localStream) || !!remoteStream;

  return (
    <div className="flex-1 relative w-full aspect-video min-h-[240px] sm:min-h-[280px] lg:min-h-[320px] rounded-2xl bg-[var(--color-neutral-bg1)] border border-[var(--color-border-default)] overflow-hidden shadow-2xl flex items-center justify-center transition-colors">
      {/* Main Video Viewport (Echo Loopback or Remote Video) */}
      {hasMainVideo ? (
        <video
          ref={mainVideoRef}
          autoPlay
          playsInline
          muted={isEchoTest} // mute echo video to prevent audio feedback loop
          className={`w-full h-full object-cover ${isEchoTest ? 'scale-x-[-1]' : ''}`}
        />
      ) : (
        /* Audio-Only / IVR Service / Waiting Stage */
        <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center select-none bg-[radial-gradient(ellipse_at_center,_var(--color-neutral-bg2)_0%,_var(--color-neutral-bg1)_80%)]">
          <div className="relative mb-3">
            <div className="w-20 h-20 rounded-full bg-[var(--color-neutral-bg2)] border-2 border-emerald-500/40 flex items-center justify-center text-[var(--color-text-primary)] font-bold text-2xl shadow-lg ring-8 ring-emerald-500/10 animate-pulse">
              {activeCallTarget?.label?.charAt(0) || 'V'}
            </div>
            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 border-2 border-[var(--color-neutral-bg1)] flex items-center justify-center text-white">
              <Mic size={12} />
            </div>
          </div>

          <h3 className="text-base font-semibold text-[var(--color-text-primary)] m-0">
            {activeCallTarget?.label}
          </h3>
          <p className="text-xs text-[var(--color-text-secondary)] m-0 mt-1 max-w-sm font-sans">
            {isAudioOnlyQueue
              ? 'Layanan PBX ini mentransmisikan audio. Kamera Anda tetap aktif di layar kecil (PiP) kanan bawah.'
              : 'Menghubungkan saluran video HD... Kamera lokal Anda aktif di pratinjau PiP.'}
          </p>

          <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--color-neutral-bg2)] border border-[var(--color-border-default)] text-[11px] font-mono text-[var(--color-text-secondary)]">
            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 animate-ping" />
            <span>
              {isAudioOnlyQueue
                ? 'Saluran Suara IVR / PBX • PiP Video Siap'
                : 'PJSIP WebRTC • VP8 HD Pass-Through'}
            </span>
          </div>
        </div>
      )}

      {/* Top Left Header Badge */}
      <div className="absolute top-3 left-3 flex items-center gap-2 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 text-[11px] text-white shadow-lg">
        {isEchoTest ? (
          <>
            <Sparkles size={13} className="text-amber-400" />
            <span className="font-medium">Uji Gema Video (Echo Loopback)</span>
          </>
        ) : isAudioOnlyQueue ? (
          <>
            <ShieldAlert size={13} className="text-emerald-400" />
            <span className="font-medium">Saluran Suara IVR • Kamera di PiP</span>
          </>
        ) : (
          <>
            <Video size={13} className="text-emerald-400" />
            <span className="font-medium">S4RAS HD Video Consultation</span>
          </>
        )}
      </div>

      {/* Local PiP Webcam Preview (Bottom Right) */}
      <div className="absolute bottom-3 right-3 w-32 h-24 sm:w-36 sm:h-28 bg-zinc-950 rounded-xl border border-white/20 overflow-hidden shadow-2xl transition-all duration-300 ring-2 ring-black/40">
        <video
          ref={localVideoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover scale-x-[-1]"
        />
        <div className="absolute bottom-0 inset-x-0 bg-black/80 backdrop-blur-xs text-[10px] text-white px-2 py-0.5 text-center font-mono truncate flex items-center justify-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
          <span>Anda ({myExtension})</span>
        </div>
      </div>
    </div>
  );
}
