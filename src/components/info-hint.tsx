"use client";

import { useState } from "react";

interface InfoHintProps {
  label?: string;
  hint: string;
  icon?: string;
  className?: string;
  variant?: "subtle" | "prominent";
}

export function InfoHint({
  label,
  hint,
  icon = "?",
  className = "",
  variant = "subtle",
}: InfoHintProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative inline-block">
      <button
        onClick={() => setOpen(!open)}
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded transition ${
          variant === "subtle"
            ? "text-slate-400 hover:text-slate-300 text-xs"
            : "text-amber-400 hover:text-amber-300"
        } ${className}`}
        aria-label={label || "Information"}
        title={label || "Voir l'explication"}
      >
        {icon === "?" ? (
          <span className="flex h-4 w-4 items-center justify-center rounded-full border border-current text-xs font-bold">
            ?
          </span>
        ) : (
          <span>{icon}</span>
        )}
        {label && <span className="text-xs">{label}</span>}
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          {/* Tooltip */}
          <div className="absolute top-full left-0 z-50 mt-1 max-w-xs rounded-lg bg-slate-800 border border-slate-700 p-3 text-sm text-slate-200 shadow-lg">
            <p className="leading-relaxed">{hint}</p>
            <button
              onClick={() => setOpen(false)}
              className="mt-2 text-xs text-slate-400 hover:text-slate-300 underline-offset-2 hover:underline"
            >
              Fermer
            </button>
          </div>
        </>
      )}
    </div>
  );
}
