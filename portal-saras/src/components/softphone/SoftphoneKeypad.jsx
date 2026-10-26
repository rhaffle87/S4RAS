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
      <div className="w-full mt-4 border-t border-[var(--color-border-default)] pt-3 max-w-xs">
        <p className="text-[10px] text-[var(--color-text-secondary)] mb-1.5 uppercase font-mono">IVR DTMF Pad</p>
        <div className="grid grid-cols-4 gap-1.5">
          {['1', '2', '3', '4'].map((k) => (
            <button
              key={k}
              onClick={() => onKeyPress(k)}
              className="py-1.5 rounded-lg bg-[var(--color-neutral-bg2)] hover:bg-[var(--color-neutral-bg3)] border border-[var(--color-border-default)] text-[var(--color-text-primary)] text-xs font-bold font-mono transition-colors active:scale-95 cursor-pointer"
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
            className="h-12 rounded-xl bg-[var(--color-neutral-bg2)] hover:bg-[var(--color-neutral-bg3)] active:scale-[0.98] border border-[var(--color-border-default)] flex flex-col items-center justify-center transition-all cursor-pointer shadow-sm"
          >
            <span className="text-base font-bold text-[var(--color-text-primary)] font-mono leading-none">{key}</span>
            {sub && (
              <span className="text-[9px] text-[var(--color-text-secondary)] font-semibold tracking-wider mt-0.5">
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
          className={`w-full py-3 rounded-xl flex items-center justify-center gap-2 font-semibold text-xs sm:text-sm transition-all shadow-md ${
            dialedNumber
              ? 'bg-[var(--color-text-primary)] text-[var(--color-neutral-bg1)] hover:opacity-90 cursor-pointer active:scale-98'
              : 'bg-[var(--color-neutral-bg2)] text-[var(--color-text-muted)] cursor-not-allowed border border-[var(--color-border-default)]'
          }`}
        >
          <Phone size={15} />
          <span>Panggil Ekstensi</span>
        </button>
      </div>
    </>
  );
}
