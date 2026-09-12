"use client";

import { useState } from "react";
import { GlossaryPanel, GLOSSARY } from "@/training";

export function GuideWithGlossary({ children }: { children: React.ReactNode }) {
  const [glossaryOpen, setGlossaryOpen] = useState(false);

  return (
    <>
      {children}

      {/* Glossary button */}
      <button
        onClick={() => setGlossaryOpen(!glossaryOpen)}
        className="fixed bottom-6 right-6 flex h-14 w-14 items-center justify-center rounded-full bg-blue-500 text-white shadow-lg hover:bg-blue-600 transition-colors"
        title="Ouvrir le glossaire"
        aria-label="Ouvrir le glossaire"
      >
        📖
      </button>

      {/* Glossary Panel */}
      {glossaryOpen && (
        <GlossaryPanel entries={Object.values(GLOSSARY)} onClose={() => setGlossaryOpen(false)} />
      )}
    </>
  );
}
