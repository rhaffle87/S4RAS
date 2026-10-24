import React from 'react';
import { Phone } from 'lucide-react';

export default function SoftphoneKeypad({
  keys,
  onKeyPress,
  onCall,
  dialedNumber,
  isCallActive = false
}) {
  if (isCallActive) {
    return (
      <div className="w-full mt-4 border-t border-white/10 pt-3 max-w-xs">
        <p className="text-[10px] text-neutral-400 mb-1.5 uppercase font-mono">IVR DTMF Pad</p>
        <div className="grid grid-cols-4 gap-1.5">
          {['1', '2', '3', '4'].map((k) => (
            <button
              key={k}
              onClick={() => onKeyPress(k)}
              className="py-1.5 rounded-lg bg-[#12141c] hover:bg-white/10 border border-white/10 text-white text-xs font-bold font-mono transition-colors active:scale-95 cursor-pointer"
            >
              {k}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Tactile Keypad Grid */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        {keys.map(({ key, sub }) => (
          <button
            key={key}
            onClick={() => onKeyPress(key)}
            className="h-12 rounded-xl bg-[#12141c] hover:bg-white/10 active:bg-[#b91c1c]/25 border border-white/10 hover:border-white/20 active:border-[#b91c1c] flex flex-col items-center justify-center transition-all active:scale-95 cursor-pointer shadow-sm"
          >
            <span className="text-base font-bold text-white font-mono leading-none">{key}</span>
            {sub && (
              <span className="text-[9px] text-neutral-400 font-semibold tracking-wider mt-0.5">
                {sub}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Call Action Button */}
      <div>
        <button
          disabled={!dialedNumber}
          onClick={onCall}
          className={`w-full py-3 rounded-xl flex items-center justify-center gap-2 font-bold text-sm transition-all shadow-lg ${
            dialedNumber
              ? 'bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white cursor-pointer shadow-[0_4px_20px_rgba(16,185,129,0.35)] active:scale-98'
              : 'bg-[#12141c] text-neutral-600 cursor-not-allowed border border-white/5'
          }`}
        >
          <Phone size={16} />
          <span>Panggil Ekstensi</span>
        </button>
      </div>
    </>
  );
}
