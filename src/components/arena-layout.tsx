"use client";

import { useState, useEffect, type ReactNode } from "react";

export type ArenaTab = {
  key: string;
  label: string;
  icon: string;
};

export function ArenaLayout({
  tabs,
  children,
  defaultTab,
  accentClass = "bg-amber-400",
}: {
  tabs: ArenaTab[];
  children: Record<string, ReactNode>;
  defaultTab?: string;
  accentClass?: string;
}) {
  const visible = tabs.filter((t) => t.key in children && children[t.key] != null);
  const [active, setActive] = useState(() => {
    if (typeof window !== "undefined") {
      const hash = window.location.hash.slice(1);
      if (hash && tabs.some((t) => t.key === hash)) return hash;
    }
    return defaultTab ?? visible[0]?.key ?? "";
  });
  const current = visible.find((t) => t.key === active) ? active : visible[0]?.key;

  useEffect(() => {
    const onHash = () => {
      const hash = window.location.hash.slice(1);
      if (hash && visible.some((t) => t.key === hash)) {
        setActive(hash);
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, [visible]);

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [current]);

  if (visible.length <= 1) {
    return <div className="space-y-6">{children[visible[0]?.key ?? ""]}</div>;
  }

  return (
    <>
      <nav
        className="sticky top-0 z-20 -mx-6 border-b border-white/10 bg-slate-950/90 backdrop-blur-md"
        role="tablist"
      >
        <div className="flex">
          {visible.map((tab) => (
            <button
              key={tab.key}
              role="tab"
              aria-selected={current === tab.key}
              onClick={() => setActive(tab.key)}
              className={`relative flex-1 px-3 py-3.5 text-sm font-medium transition-colors sm:flex-none sm:px-6 ${
                current === tab.key
                  ? "text-white"
                  : "text-slate-400 hover:text-slate-300"
              }`}
            >
              <span className="mr-1.5 hidden sm:inline">{tab.icon}</span>
              {tab.label}
              {current === tab.key ? (
                <span
                  className={`absolute inset-x-1 bottom-0 h-0.5 rounded-full sm:inset-x-2 ${accentClass}`}
                />
              ) : null}
            </button>
          ))}
        </div>
      </nav>
      <div role="tabpanel" className="space-y-6 pt-6">
        {current ? children[current] : null}
      </div>
    </>
  );
}
