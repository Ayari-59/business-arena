"use client";

import type { TrainingModule } from "../types";

interface TrainingGalleryProps {
  modules: TrainingModule[];
  completedModules: string[];
  onSelectModule: (module: TrainingModule) => void;
}

const difficultyColors = {
  beginner: "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300",
  intermediate: "bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300",
  advanced: "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300",
};

const difficultyLabels = {
  beginner: "Débutant",
  intermediate: "Intermédiaire",
  advanced: "Avancé",
};

export function TrainingGallery({
  modules,
  completedModules,
  onSelectModule,
}: TrainingGalleryProps) {
  return (
    <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
      {modules.map((module) => {
        const isCompleted = completedModules.includes(module.id);
        return (
          <button
            key={module.id}
            onClick={() => onSelectModule(module)}
            className="text-left p-4 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors relative"
          >
            {isCompleted && (
              <div className="absolute top-2 right-2">
                <span className="text-lg">✓</span>
              </div>
            )}
            <div className="flex items-start justify-between mb-2">
              <div>
                <p className="text-2xl mb-1">{module.icon || "📚"}</p>
                <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-100">
                  {module.title}
                </h3>
              </div>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 mb-3">
              {module.description}
            </p>
            <div className="flex items-center gap-2 justify-between">
              <span
                className={`text-xs px-2 py-1 rounded ${
                  difficultyColors[module.difficulty]
                }`}
              >
                {difficultyLabels[module.difficulty]}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {module.estimatedTime}m
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
