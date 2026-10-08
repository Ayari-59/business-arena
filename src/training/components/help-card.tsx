"use client";

import Link from "next/link";
import { useState } from "react";

/**
 * Une action est un lien, pas un gestionnaire de clic : la carte est appelée
 * depuis des pages serveur (/jouer), et une fonction ne franchit pas la
 * frontière serveur → client.
 */
interface Action {
  label: string;
  href: string;
}

interface HelpCardProps {
  title: string;
  description: string;
  actions?: Action[];
  dismissible?: boolean;
}

export function HelpCard({ title, description, actions, dismissible }: HelpCardProps) {
  const [isDismissed, setIsDismissed] = useState(false);

  if (isDismissed) return null;

  return (
    <div className="encadre-neutre rounded-lg p-4">
      <div className="flex gap-3">
        <div className="flex-1">
          <h3 className="font-semibold text-sm text-slate-100">
            💡 {title}
          </h3>
          <p className="text-sm text-slate-300 mt-1">
            {description}
          </p>
          {actions && actions.length > 0 && (
            <div className="flex gap-2 mt-3">
              {actions.map((action) => (
                <Link
                  key={action.href}
                  href={action.href}
                  className="inline-block text-xs px-3 py-1 rounded-md border border-white/15 text-slate-200 hover:bg-white/5"
                >
                  {action.label}
                </Link>
              ))}
            </div>
          )}
        </div>
        {dismissible && (
          <button
            onClick={() => setIsDismissed(true)}
            className="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
}
