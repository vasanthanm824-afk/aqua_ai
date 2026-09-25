import React from "react";

export function Logo({ className = "w-8 h-8", textClassName = "text-xl" }: { className?: string; textClassName?: string }) {
  return (
    <div className="flex items-center gap-2.5 select-none">
      <div className={`relative flex items-center justify-center shrink-0 ${className}`}>
        {/* Vector SVG Logo */}
        <svg viewBox="0 0 48 48" fill="none" className="w-full h-full">
          {/* Hexagonal aperture */}
          <polygon
            points="24,4 41,14 41,34 24,44 7,34 7,14"
            stroke="url(#blueGrad)"
            strokeWidth="2.5"
            strokeLinejoin="round"
            fill="#e3f0ff"
          />
          {/* Water droplet */}
          <path
            d="M24 13 C24 13 16 23 16 28 C16 32.4 19.6 36 24 36 C28.4 36 32 32.4 32 28 C32 23 24 13 24 13 Z"
            fill="url(#dropGrad)"
          />
          {/* GIS reticle lines */}
          <line x1="24" y1="7"  x2="24" y2="12" stroke="#1565c0" strokeWidth="2" strokeLinecap="round" />
          <line x1="24" y1="36" x2="24" y2="41" stroke="#1565c0" strokeWidth="2" strokeLinecap="round" />
          <line x1="10" y1="24" x2="15" y2="24" stroke="#1565c0" strokeWidth="2" strokeLinecap="round" />
          <line x1="33" y1="24" x2="38" y2="24" stroke="#1565c0" strokeWidth="2" strokeLinecap="round" />
          {/* Centre spark */}
          <circle cx="24" cy="27" r="2.5" fill="#ffffff" />

          <defs>
            <linearGradient id="blueGrad" x1="7" y1="4" x2="41" y2="44" gradientUnits="userSpaceOnUse">
              <stop stopColor="#1976d2" />
              <stop offset="1" stopColor="#0d47a1" />
            </linearGradient>
            <linearGradient id="dropGrad" x1="16" y1="13" x2="32" y2="36" gradientUnits="userSpaceOnUse">
              <stop stopColor="#42a5f5" />
              <stop offset="1" stopColor="#1565c0" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      <div className="flex flex-col leading-tight">
        <span
          className={`font-black tracking-widest ${textClassName}`}
          style={{ color: "#0d47a1", letterSpacing: "0.12em" }}
        >
          AQUA-LENS
        </span>
        <span className="text-[9px] font-semibold tracking-wider uppercase -mt-0.5" style={{ color: "#64748b" }}>
          GIS Vulnerability Intelligence
        </span>
      </div>
    </div>
  );
}
