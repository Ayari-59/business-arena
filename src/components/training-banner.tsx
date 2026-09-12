"use client";

import Link from "next/link";
import { useState } from "react";

export function TrainingBanner() {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div className="relative mx-auto max-w-6xl px-6 py-4">
      <div className="rounded-lg border border-blue-400/30 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex gap-3 flex-1">
            <span className="text-2xl">📚</span>
            <div>
              <h3 className="font-semibold text-sm text-slate-50">Maîtrisez Business Arena</h3>
              <p className="text-sm text-slate-300 mt-1">
                Tutoriels interactifs, cas d'étude et glossaire pour comprendre les décisions clés.
              </p>
              <Link
                href="/training"
                className="text-sm text-blue-400 hover:text-blue-300 font-medium mt-2 inline-block"
              >
                Découvrir les parcours →
              </Link>
            </div>
          </div>
          <button
            onClick={() => setDismissed(true)}
            className="text-slate-400 hover:text-slate-200 shrink-0"
            aria-label="Fermer"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}
