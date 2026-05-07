// src/components/common/InkStamp.tsx
"use client";

import React from "react";

interface InkStampProps {
  upperText?: string;
  centerText?: string;
  /** one of 'success', 'error', 'blue', 'warning', 'gray' */
  color?: "success" | "error" | "blue" | "warning" | "gray";
  className?: string;
  rotation?: number;
  size?: number;
  repeatCount?: number;
}

const colorMap = {
  success: "text-success-700 dark:text-success-400",
  error: "text-error-700 dark:text-error-400",
  blue: "text-blue-700 dark:text-blue-400",
  warning: "text-warning-700 dark:text-warning-400",
  gray: "text-gray-700 dark:text-gray-400",
};

export default function InkStamp({
  upperText = "FINANCE DEPARTMENT",
  centerText = "APPROVED",
  color = "success",
  className = "",
  rotation = -12,
  size = 140,
  repeatCount = 3,
}: InkStampProps & { repeatCount?: number }) {
  const colorClass = colorMap[color] || colorMap.success;
  const idSuffix = React.useId().replace(/:/g, "");

  const repeatedText = new Array(repeatCount).fill(`• ${upperText} `).join("");

  return (
    <div 
      className={`flex-shrink-0 relative pointer-events-none select-none ${className}`}
      style={{ width: size, height: size }}
    >
      <svg 
        width={size} 
        height={size} 
        viewBox="0 0 140 140" 
        className="transition-all duration-700 hover:rotate-0"
        style={{ transform: `rotate(${rotation}deg)` }}
      >
        <defs>
          <filter id={`inkGrit-${idSuffix}`} x="-20%" y="-20%" width="140%" height="140%">
            <feTurbulence type="fractalNoise" baseFrequency="0.3" numOctaves="2" result="noise" />
            <feColorMatrix in="noise" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 4 -1" result="grit" />
            <feComposite operator="in" in="SourceGraphic" in2="grit" />
          </filter>
          <path id={`RealisticPath-${idSuffix}`} d="M 70, 70 m -50, 0 a 50, 50 0 1, 1 100, 0 a 50, 50 0 1, 1 -100, 0" />
        </defs>

        <g filter={`url(#inkGrit-${idSuffix})`} className={`${colorClass} fill-current`}>
          {/* Outer Rings */}
          <circle cx="70" cy="70" r="64" fill="none" stroke="currentColor" strokeWidth="4" opacity="0.8" />
          <circle cx="70" cy="70" r="59" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.5" />
          
          {/* Circular Text */}
          <text className="font-black text-[10px] uppercase">
            <textPath 
              href={`#RealisticPath-${idSuffix}`} 
              startOffset="0%"
              textLength="314.16"
              spacing="auto"
            >
              {repeatedText}
            </textPath>
          </text>

          {/* Centered block */}
          <rect x="25" y="58" width="90" height="26" fill="none" stroke="currentColor" strokeWidth="3" opacity="0.8" />
          <text x="70" y="78" textAnchor="middle" className="font-black text-[18px] uppercase tracking-[0.02em]">
            {centerText}
          </text>
          
          {/* Small verification splatters */}
          <circle cx="45" cy="45" r="1.2" opacity="0.4" />
          <circle cx="95" cy="85" r="0.8" opacity="0.3" />
        </g>
      </svg>
    </div>
  );
}
