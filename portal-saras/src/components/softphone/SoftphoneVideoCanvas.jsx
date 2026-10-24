import React from 'react';
import { Video } from 'lucide-react';

export default function SoftphoneVideoCanvas({ activeCallTarget, localVideoRef, myExtension }) {
  return (
    <div className="flex-1 relative w-full aspect-video min-h-[220px] lg:min-h-[300px] rounded-xl bg-neutral-950 border border-white/10 overflow-hidden shadow-2xl flex items-center justify-center">
      <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-neutral-900 via-neutral-950 to-neutral-900 p-4">
        <div className="w-16 h-16 rounded-full bg-[#b91c1c]/20 border-2 border-[#b91c1c] flex items-center justify-center text-[#ef4444] font-bold text-xl shadow-[0_0_25px_rgba(185,28,28,0.3)] mb-2">
          {activeCallTarget?.label?.charAt(0) || 'V'}
        </div>
        <span className="text-sm font-bold text-white">
          {activeCallTarget?.label}
        </span>
        <span className="text-[10px] text-emerald-400 font-mono mt-1 flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          720p @ 24fps · Asterisk 22 VP8 Pass-Through
        </span>
      </div>

      {/* Local PiP Webcam Preview */}
      <div className="absolute bottom-2 right-2 w-28 h-20 bg-neutral-900 rounded-lg border-2 border-[#ef4444]/80 overflow-hidden shadow-2xl">
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
      <div className="absolute top-2 left-2 flex items-center gap-1.5 bg-black/80 backdrop-blur-md px-2.5 py-1 rounded-md border border-white/10 text-[10px] text-white">
        <Video size={11} className="text-emerald-400" />
        <span>S4RAS HD Video Consultation</span>
      </div>
    </div>
  );
}
