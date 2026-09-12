"use client";

import { useState } from "react";

interface Action {
  label: string;
  onClick: () => void;
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
    <div className="rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 p-4">
      <div className="flex gap-3">
        <div className="flex-1">
          <h3 className="font-semibold text-sm text-blue-900 dark:text-blue-100">
            💡 {title}
          </h3>
          <p className="text-sm text-blue-800 dark:text-blue-200 mt-1">
            {description}
          </p>
          {actions && actions.length > 0 && (
            <div className="flex gap-2 mt-3">
              {actions.map((action, idx) => (
                <button
                  key={idx}
                  onClick={action.onClick}
                  className="text-xs px-3 py-1 rounded bg-blue-200 dark:bg-blue-800 text-blue-900 dark:text-blue-100 hover:bg-blue-300 dark:hover:bg-blue-700"
                >
                  {action.label}
                </button>
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
