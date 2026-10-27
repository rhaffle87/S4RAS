import React, { useState, useEffect } from 'react';
import { Delete, Radio, Voicemail, PhoneCall, MessageCircle } from 'lucide-react';

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
  onCallVoicemail,
  onSelectQuickDial,
  detectedContact,
  onCallDetectedContact
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
      <div className="bg-[var(--color-neutral-bg2)] border border-[var(--color-border-default)] rounded-xl p-4 mb-3 transition-colors">
        {/* Status Bar */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
            <span className="text-xs font-medium text-[var(--color-text-secondary)]">
              Siap Memanggil
            </span>
          </div>
          <button
            onClick={onCallVoicemail}
            className="rounded-lg px-2.5 py-1 bg-[var(--color-neutral-bg1)] hover:bg-[var(--color-neutral-bg3)] border border-[var(--color-border-default)] text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] inline-flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Dengarkan Kotak Suara (Ext 500 / *97)"
          >
            <Voicemail size={13} className={voicemailCount > 0 ? 'text-amber-400' : 'text-[var(--color-text-secondary)]'} />
            <span>Voicemail ({voicemailCount})</span>
          </button>
        </div>

        {/* Digits Readout */}
        <div className="flex items-center justify-between min-h-[38px]">
          <span className="text-2xl font-mono font-bold text-[var(--color-text-primary)] tracking-widest pl-0.5">
            {dialedNumber || (
              <span className="text-[var(--color-text-muted)] tracking-normal font-sans text-xs sm:text-sm">
                Tekan nomor ekstensi / HP...
              </span>
            )}
          </span>
          {dialedNumber && (
            <div className="flex items-center gap-1">
              <button
                onClick={handleBackspace}
                className="p-1.5 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] rounded-lg hover:bg-[var(--color-neutral-bg3)] transition-colors cursor-pointer"
                title="Hapus Karakter"
              >
                <Delete size={16} />
              </button>
              <button
                onClick={handleClear}
                className="text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] px-2 py-1 rounded-lg hover:bg-[var(--color-neutral-bg3)] transition-colors cursor-pointer font-sans"
              >
                Reset
              </button>
            </div>
          )}
        </div>

        {/* Smart Number Resolution Contact Card */}
        {detectedContact && (
          <div className="mt-3 pt-3 border-t border-[var(--color-border-default)]">
            <div className="p-2.5 rounded-xl bg-[var(--color-neutral-bg1)] border border-[var(--color-border-default)] flex items-center justify-between gap-2 shadow-xs">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-full bg-[var(--color-neutral-bg2)] border border-[var(--color-border-default)] text-[var(--color-text-primary)] font-bold text-xs flex items-center justify-center shrink-0">
                  {detectedContact.label.charAt(0)}
                </div>
                <div className="min-w-0 text-left">
                  <div className="flex items-center gap-1.5">
                    <p className="text-xs font-semibold text-[var(--color-text-primary)] truncate m-0">
                      {detectedContact.label}
                    </p>
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
                      Ext {detectedContact.ext}
                    </span>
                  </div>
                  <p className="text-[10px] text-[var(--color-text-secondary)] truncate m-0 font-sans mt-0.5">
                    {detectedContact.phone || detectedContact.desc}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                {detectedContact.wa && (
                  <a
                    href={`https://wa.me/${detectedContact.wa}`}
                    target="_blank"
                    rel="noreferrer"
                    className="h-7 px-2 rounded-lg bg-[var(--color-neutral-bg2)] hover:bg-[var(--color-neutral-bg3)] border border-[var(--color-border-default)] text-[11px] font-medium text-emerald-400 inline-flex items-center gap-1 transition-colors no-underline"
                    title="Buka WhatsApp"
                  >
                    <MessageCircle size={12} />
                    <span>WA</span>
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => onCallDetectedContact ? onCallDetectedContact(detectedContact.ext) : onSelectQuickDial(detectedContact.ext)}
                  className="h-7 px-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-medium inline-flex items-center gap-1 transition-colors cursor-pointer shadow-xs active:scale-95"
                >
                  <PhoneCall size={11} />
                  <span>Panggil</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Quick Dial Chips (when idle & empty) */}
        {!dialedNumber && (
          <div className="mt-3 pt-3 border-t border-[var(--color-border-default)] flex items-center justify-between gap-1.5 flex-wrap">
            <span className="text-[11px] text-[var(--color-text-muted)] font-medium">Pintasan:</span>
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                type="button"
                onClick={() => onSelectQuickDial && onSelectQuickDial('1000')}
                className="rounded-lg px-2.5 py-1 bg-[var(--color-neutral-bg1)] hover:bg-[var(--color-neutral-bg3)] border border-[var(--color-border-default)] text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] inline-flex items-center gap-1 transition-colors cursor-pointer font-medium"
              >
                Operator (1000)
              </button>
              <button
                type="button"
                onClick={() => onSelectQuickDial && onSelectQuickDial('600')}
                className="rounded-lg px-2.5 py-1 bg-[var(--color-neutral-bg1)] hover:bg-[var(--color-neutral-bg3)] border border-[var(--color-border-default)] text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] inline-flex items-center gap-1 transition-colors cursor-pointer font-medium"
              >
                Uji Audio (600)
              </button>
              <button
                type="button"
                onClick={() => onSelectQuickDial && onSelectQuickDial('*97')}
                className="rounded-lg px-2.5 py-1 bg-[var(--color-neutral-bg1)] hover:bg-[var(--color-neutral-bg3)] border border-[var(--color-border-default)] text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] inline-flex items-center gap-1 transition-colors cursor-pointer font-medium"
              >
                Voicemail (*97)
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Active call screen
  return (
    <div className="w-full flex flex-col items-center">
      <div className="bg-[var(--color-neutral-bg2)] border border-[var(--color-border-default)] rounded-xl px-4 py-2.5 mb-3 w-full max-w-xs flex items-center justify-between transition-colors">
        <div className="flex items-center gap-2">
          <span
            className={`w-2 h-2 rounded-full shrink-0 ${
              callState === 'calling' ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'
            }`}
          />
          <span className="text-xs font-medium text-[var(--color-text-secondary)]">
            {callState === 'calling'
              ? 'Memanggil...'
              : callState === 'connected'
              ? 'Terhubung'
              : 'Panggilan Berakhir'}
          </span>
        </div>
        <span className="font-mono text-xs font-semibold text-[var(--color-text-primary)]">
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
              className="w-1 bg-emerald-500/80 rounded-full animate-pulse"
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
        <div className="w-full bg-[var(--color-neutral-bg2)] border border-[var(--color-border-default)] rounded-xl p-2.5 text-xs text-[var(--color-text-primary)] text-center mb-4 max-w-xs transition-colors">
          <Radio size={13} className="inline mr-1 text-[var(--color-text-secondary)]" />
          {ivrMessage}
        </div>
      )}
    </div>
  );
}
