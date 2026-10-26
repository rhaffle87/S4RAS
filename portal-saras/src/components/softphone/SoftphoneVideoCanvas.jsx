import React from 'react';
import { Video } from 'lucide-react';

export default function SoftphoneVideoCanvas({ activeCallTarget, localVideoRef, myExtension }) {
  return (
    <div className="flex-1 relative w-full aspect-video min-h-[220px] lg:min-h-[300px] rounded-xl bg-[var(--color-neutral-bg1)] border border-[var(--color-border-default)] overflow-hidden shadow-2xl flex items-center justify-center transition-colors">
      <div className="w-full h-full flex flex-col items-center justify-center p-4">
        <div className="w-16 h-16 rounded-full bg-[var(--color-neutral-bg2)] border border-[var(--color-border-default)] flex items-center justify-center text-[var(--color-text-primary)] font-bold text-xl mb-2">
          {activeCallTarget?.label?.charAt(0) || 'V'}
        </div>
        <span className="text-sm font-semibold text-[var(--color-text-primary)]">
          {activeCallTarget?.label}
        </span>
        <span className="text-[10px] text-[var(--color-text-secondary)] font-mono mt-1 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
          720p @ 24fps · Asterisk 22 VP8 Pass-Through
        </span>
      </div>

      {/* Local PiP Webcam Preview */}
      <div className="absolute bottom-2 right-2 w-28 h-20 bg-[var(--color-neutral-bg2)] rounded-lg border border-[var(--color-border-default)] overflow-hidden shadow-2xl">
        <video
          ref={localVideoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
        />
        <div className="absolute bottom-0 inset-x-0 bg-black/75 text-[9px] text-white px-1 py-0.5 text-center font-mono truncate">
          Anda ({myExtension})
        </div>
      </div>

      {/* Video Badge */}
      <div className="absolute top-2 left-2 flex items-center gap-1.5 bg-[var(--color-neutral-bg2)]/90 px-2.5 py-1 rounded-md border border-[var(--color-border-default)] text-[10px] text-[var(--color-text-primary)]">
        <Video size={11} className="text-emerald-500" />
        <span>S4RAS HD Video Consultation</span>
      </div>
    </div>
  );
}
