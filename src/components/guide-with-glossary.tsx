"use client";

import { useState } from "react";
import { GlossaryPanel, GLOSSARY } from "@/training";
import { Icone } from "@/components/icone";

export function GuideWithGlossary({ children }: { children: React.ReactNode }) {
  const [glossaryOpen, setGlossaryOpen] = useState(false);

  return (
    <>
      {children}

      {/* Glossary button */}
      <button
        onClick={() => setGlossaryOpen(!glossaryOpen)}
        className="fixed bottom-6 right-6 flex h-14 w-14 items-center justify-center rounded-full bg-amber-400 text-slate-950 shadow-lg shadow-amber-400/20 transition-colors hover:bg-amber-300"
        title="Ouvrir le glossaire"
        aria-label="Ouvrir le glossaire"
      >
        <Icone nom="document" className="h-6 w-6" />
      </button>

      {/* Glossary Panel */}
      {glossaryOpen && (
        <GlossaryPanel entries={Object.values(GLOSSARY)} onClose={() => setGlossaryOpen(false)} />
      )}
    </>
  );
}
