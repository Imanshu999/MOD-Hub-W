import React, { useEffect } from 'react';

interface AdSlotProps {
  slot: string;
  format?: 'auto' | 'fluid' | 'rectangle' | 'horizontal';
  responsive?: boolean;
  className?: string;
  darkMode?: boolean;
}

export function AdSlot({
  slot,
  format = 'auto',
  responsive = true,
  className = '',
  darkMode = true
}: AdSlotProps) {
  useEffect(() => {
    try {
      // Safely initialize AdSense ads on mount
      const win = window as any;
      if (win) {
        (win.adsbygoogle = win.adsbygoogle || []).push({});
      }
    } catch (e) {
      console.warn("AdSense trigger postponed or blocked by browser extensions/privacy tools:", e);
    }
  }, [slot]);

  return (
    <div 
      className={`relative w-full overflow-hidden rounded-2xl border transition-all duration-300 ${
        darkMode 
          ? 'bg-slate-900/30 border-slate-800/80 hover:border-slate-800' 
          : 'bg-slate-50 border-slate-200/60 hover:border-slate-200'
      } ${className}`}
    >
      {/* Visual Indicator */}
      <div className={`absolute top-2 left-3 flex items-center gap-1.5 z-10`}>
        <span className={`w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse`}></span>
        <span className={`text-[9px] font-mono font-semibold uppercase tracking-wider ${
          darkMode ? 'text-slate-500' : 'text-slate-400'
        }`}>
          Sponsor / Advertisement
        </span>
      </div>

      <div className="pt-8 pb-3 px-3 min-h-[100px] flex items-center justify-center">
        {/* Real Google AdSense Tag */}
        <ins 
          className="adsbygoogle block w-full text-center"
          style={{ display: 'block', minHeight: '90px' }}
          data-ad-client="ca-pub-9685176424242747"
          data-ad-slot={slot}
          data-ad-format={format}
          data-full-width-responsive={responsive ? "true" : "false"}
        ></ins>
      </div>

      {/* Modern bottom glow line for premium theme feel */}
      <div className="absolute bottom-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-indigo-500/20 to-transparent"></div>
    </div>
  );
}
