"use client";

import { useState } from "react";

interface InfoHintProps {
  icon?: string;
  hint: string;
  variant?: "subtle" | "default";
}

export function InfoHint({ icon = "?", hint, variant = "default" }: InfoHintProps) {
  const [isVisible, setIsVisible] = useState(false);

  const baseClasses = "relative inline-flex items-center";
  const iconClasses =
    variant === "subtle"
      ? "ml-1 text-xs font-bold text-slate-400 cursor-help hover:text-slate-300"
      : "ml-2 text-sm font-bold text-slate-400 cursor-help hover:text-slate-300";

  return (
    <div className={baseClasses}>
      <button
        type="button"
        className={iconClasses}
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        onFocus={() => setIsVisible(true)}
        onBlur={() => setIsVisible(false)}
        aria-label={hint}
      >
        {icon}
      </button>
      {isVisible && (
        <div className="absolute bottom-full left-1/2 mb-2 -translate-x-1/2 transform rounded-lg bg-slate-800 px-3 py-2 text-xs text-slate-200 whitespace-nowrap border border-slate-700 z-50 shadow-lg pointer-events-none">
          {hint}
          <div className="absolute top-full left-1/2 -translate-x-1/2 transform border-4 border-transparent border-t-slate-800"></div>
        </div>
      )}
    </div>
  );
}
