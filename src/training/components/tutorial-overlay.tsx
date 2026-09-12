"use client";

import type { TutorialStep } from "../types";

interface TutorialOverlayProps {
  title: string;
  steps: TutorialStep[];
  currentStep: number;
  onNext: () => void;
  onPrev: () => void;
  onClose: () => void;
  onSkip: () => void;
}

export function TutorialOverlay({
  title,
  steps,
  currentStep,
  onNext,
  onPrev,
  onClose,
  onSkip,
}: TutorialOverlayProps) {
  const step = steps[currentStep];
  const isFirst = currentStep === 0;
  const isLast = currentStep === steps.length - 1;

  if (!step) return null;

  return (
    <>
      {/* Overlay background */}
      <div className="fixed inset-0 z-40 bg-black/50" onClick={onClose} />

      {/* Tutorial box */}
      <div className="fixed z-50 bg-white dark:bg-slate-900 rounded-lg shadow-2xl p-6 max-w-md">
        <div className="mb-4">
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
            {title}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Étape {currentStep + 1} sur {steps.length}
          </p>
        </div>

        <div className="mb-4">
          <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">
            {step.title}
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            {step.description}
          </p>
          {step.action && (
            <p className="text-sm text-blue-600 dark:text-blue-400 mt-2 font-medium">
              👉 {step.action}
            </p>
          )}
          {step.hint && (
            <p className="text-sm text-amber-600 dark:text-amber-400 mt-2">
              {step.hint}
            </p>
          )}
        </div>

        {/* Progress bar */}
        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1 mb-4">
          <div
            className="bg-blue-500 h-1 rounded-full transition-all"
            style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
          />
        </div>

        {/* Controls */}
        <div className="flex gap-2">
          {!isFirst && (
            <button
              onClick={onPrev}
              className="px-3 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded"
            >
              ← Précédent
            </button>
          )}
          {!isLast && (
            <button
              onClick={onNext}
              className="px-3 py-2 text-sm bg-blue-500 text-white hover:bg-blue-600 rounded"
            >
              Suivant →
            </button>
          )}
          {isLast && (
            <button
              onClick={onClose}
              className="px-3 py-2 text-sm bg-green-500 text-white hover:bg-green-600 rounded"
            >
              Terminé ✓
            </button>
          )}
          <button
            onClick={onSkip}
            className="px-3 py-2 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
          >
            Passer
          </button>
        </div>
      </div>
    </>
  );
}
