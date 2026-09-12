"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import {
  TRAINING_PATHS,
  TUTORIALS,
  SCENARIOS,
  RESOURCES,
} from "@/training/modules";
import { TrainingGallery, HelpCard, TrainingProgressService } from "@/training";
import type { TrainingModule } from "@/training/types";

export default function TrainingPathPage({
  params,
}: {
  params: Promise<{ pathId: string }>;
}) {
  const [pathId, setPathId] = useState("");
  const [completedModules, setCompletedModules] = useState<string[]>([]);

  useEffect(() => {
    params.then((p) => setPathId(p.pathId));
  }, [params]);

  useEffect(() => {
    // For demo purposes, use a fixed userId. In production, get from auth.
    const userId = "demo-user";
    const completed = TrainingProgressService.getCompletedModules(userId);
    setCompletedModules(completed);
  }, []);

  const path = TRAINING_PATHS.find((p) => p.id === pathId);

  if (!path) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-slate-950 to-slate-900 p-6">
        <div className="mx-auto max-w-5xl">
          <p className="text-slate-300">Parcours non trouvé.</p>
          <Link href="/training" className="text-amber-400 hover:text-amber-300">
            ← Retour aux parcours
          </Link>
        </div>
      </main>
    );
  }

  // Gather all modules from different arrays
  const allModulesMap: Record<string, TrainingModule> = {};
  TUTORIALS.forEach((t) => {
    allModulesMap[t.id] = t;
  });
  SCENARIOS.forEach((s) => {
    allModulesMap[s.id] = s;
  });
  RESOURCES.forEach((r) => {
    allModulesMap[r.id] = r;
  });

  const modules = path.modules
    .map((id) => allModulesMap[id])
    .filter((m) => m !== undefined);

  const progress = Math.round(
    (completedModules.filter((m) => path.modules.includes(m)).length /
      path.modules.length) *
      100
  );

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 to-slate-900">
      <div className="mx-auto max-w-5xl px-6 py-12">
        <Link href="/training" className="text-amber-400 hover:text-amber-300 text-sm mb-6 inline-block">
          ← Retour aux parcours
        </Link>

        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-50 mb-2">
            {path.name}
          </h1>
          <p className="text-slate-300 mb-4">{path.description}</p>

          {/* Progress bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-slate-400">
              <span>Progression</span>
              <span>{progress}%</span>
            </div>
            <div className="w-full bg-slate-700 rounded-full h-2">
              <div
                className="bg-amber-400 h-2 rounded-full transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>

        <HelpCard
          title="Comment utiliser ce parcours"
          description="Suivez les modules dans l'ordre proposé. Chaque module contient des tutoriels, cas d'étude ou ressources. Vous pouvez revenir aux modules à tout moment."
          dismissible
        />

        <div className="mt-8">
          <h2 className="text-xl font-semibold text-slate-50 mb-6">
            {modules.length} modules dans ce parcours
          </h2>
          <TrainingGallery
            modules={modules}
            completedModules={completedModules}
            onSelectModule={(module) => {
              // For now, just log. In a full implementation, open module detail.
              console.log("Selected module:", module.id);
            }}
          />
        </div>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="rounded-lg border border-slate-700/50 bg-slate-800/30 p-4">
            <p className="text-xs text-slate-400 uppercase">Durée totale</p>
            <p className="text-2xl font-bold text-slate-50 mt-1">
              {Math.round(path.estimatedDuration / 60)}h{" "}
              {path.estimatedDuration % 60 > 0 ? `${path.estimatedDuration % 60}m` : ""}
            </p>
          </div>
          <div className="rounded-lg border border-slate-700/50 bg-slate-800/30 p-4">
            <p className="text-xs text-slate-400 uppercase">Modules complétés</p>
            <p className="text-2xl font-bold text-slate-50 mt-1">
              {completedModules.filter((m) => path.modules.includes(m)).length}/
              {path.modules.length}
            </p>
          </div>
          <div className="rounded-lg border border-slate-700/50 bg-slate-800/30 p-4">
            <p className="text-xs text-slate-400 uppercase">Niveau</p>
            <p className="text-2xl font-bold text-slate-50 mt-1">
              {path.targetAudience === "beginner"
                ? "Débutant"
                : path.targetAudience === "intermediate"
                  ? "Intermédiaire"
                  : "Avancé"}
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
