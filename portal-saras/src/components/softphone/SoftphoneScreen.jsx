import React, { useState, useEffect } from 'react';
import { Delete, Radio, Voicemail } from 'lucide-react';

export default function SoftphoneScreen({
  callState,
  dialedNumber,
  activeCallTarget,
  callDuration,
  formatTime,
  handleBackspace,
  handleClear,
  cameraError,
  ivrMessage,
  onCallVoicemail
}) {
  const [voicemailCount, setVoicemailCount] = useState(0);

  useEffect(() => {
    let mounted = true;
    fetch('/api/voicemail/status')
      .then((res) => res.json())
      .then((data) => {
        if (mounted && data?.status === 'ok') {
          setVoicemailCount(data.totalNew || 0);
        }
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, []);

  if (callState === 'idle') {
    return (
      <div className="bg-[#050608] border border-white/15 rounded-xl p-3.5 mb-3 shadow-[inset_0_2px_10px_rgba(0,0,0,0.8)]">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>IDLE · SIAP MEMANGGIL</span>
            <span className="ml-1 px-1 py-0.2 rounded text-[8px] font-mono bg-rose-500/15 text-rose-400 border border-rose-500/30">ICE/TURN</span>
          </div>
          <button
            onClick={onCallVoicemail}
            className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-white/5 hover:bg-white/10 border border-white/10 text-[10px] font-mono text-neutral-300 hover:text-white transition-colors cursor-pointer"
            title="Dengarkan Pesan Suara (Ext 500)"
          >
            <Voicemail size={11} className={voicemailCount > 0 ? 'text-amber-400 animate-pulse' : 'text-neutral-400'} />
            <span>Voicemail: {voicemailCount} Baru</span>
          </button>
        </div>

        {/* Digits Readout */}
        <div className="flex items-center justify-between min-h-[36px]">
          <span className="text-2xl font-mono font-bold text-white tracking-widest pl-1">
            {dialedNumber || (
              <span className="text-neutral-600 tracking-normal font-sans text-sm">
                Tekan nomor ekstensi...
              </span>
            )}
          </span>
          {dialedNumber && (
            <div className="flex items-center gap-1">
              <button
                onClick={handleBackspace}
                className="p-1 text-neutral-400 hover:text-white rounded hover:bg-white/10 cursor-pointer"
                title="Hapus Karakter"
              >
                <Delete size={16} />
              </button>
              <button
                onClick={handleClear}
                className="text-[11px] text-neutral-400 hover:text-[#ef4444] px-1.5 py-0.5 rounded hover:bg-white/10 cursor-pointer font-sans"
              >
                Reset
              </button>
            </div>
          )}
        </div>

        {/* Audio Visualizer Dots (Resting) */}
        <div className="flex items-center justify-center gap-1.5 mt-2">
          {[...Array(8)].map((_, i) => (
            <span key={i} className="w-1 h-1 rounded-full bg-emerald-500/30" />
          ))}
        </div>
      </div>
    );
  }

  // Active call screen
  return (
    <div className="w-full flex flex-col items-center">
      <div className="bg-[#12141c] border border-white/10 rounded-xl px-4 py-2 mb-3 w-full max-w-xs flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-[11px] font-mono font-bold text-emerald-400">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>
            {callState === 'calling'
              ? 'CALLING...'
              : callState === 'connected'
              ? 'TERHUBUNG'
              : 'ENDED'}
          </span>
        </div>
        <span className="font-mono text-xs font-bold text-white">
          {callState === 'calling' ? '--:--' : formatTime(callDuration)}
        </span>
      </div>

      {/* Audio Visualizer Equalizer */}
      {callState === 'connected' && (
        <div className="flex items-center justify-center gap-1 h-5 mb-3">
          {[6, 12, 18, 14, 8, 16, 10, 5].map((h, i) => (
            <span
              key={i}
              style={{ height: `${h}px` }}
              className="w-1 bg-emerald-400 rounded-full animate-pulse"
            />
          ))}
        </div>
      )}

      {cameraError && (
        <p className="text-[10px] text-amber-400 mb-3 px-3 py-1 rounded bg-amber-500/10 border border-amber-500/20 text-center max-w-sm">
          {cameraError}
        </p>
      )}

      {ivrMessage && (
        <div className="w-full bg-[#b91c1c]/15 border border-[#b91c1c]/30 rounded-xl p-2.5 text-xs text-[#ef4444] text-center mb-4 animate-fade-in max-w-xs">
          <Radio size={13} className="inline mr-1 animate-pulse" />
          {ivrMessage}
        </div>
      )}
    </div>
  );
}
