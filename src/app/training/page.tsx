import Link from "next/link";
import type { Metadata } from "next";
import { TRAINING_PATHS } from "@/training/modules";

export const metadata: Metadata = {
  alternates: { canonical: "/training" },
  title: "Formation et tutoriels",
  description: "Apprenez à jouer à Business Arena avec nos tutoriels, cas d'étude et glossaire.",
};

export default function TrainingPage() {
  const difficultyColors = {
    beginner: "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300",
    intermediate: "bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300",
    advanced: "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300",
  };

  const difficultyLabels = {
    beginner: "Débutant",
    intermediate: "Intermédiaire",
    advanced: "Avancé",
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800">
      <div className="mx-auto max-w-5xl px-6 py-12">
        <div className="mb-12">
          <p className="text-xs uppercase tracking-[0.3em] text-amber-400">Formation et apprentissage</p>
          <h1 className="mt-3 text-3xl font-bold leading-tight text-slate-50 sm:text-4xl">
            📚 Parcours de formation
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-slate-300">
            Maîtrisez Business Arena avec nos tutoriels interactifs, cas d'étude, et glossaire.
            Chaque parcours est conçu pour progresser étape par étape.
          </p>
        </div>

        <div className="space-y-6">
          {TRAINING_PATHS.map((path) => (
            <Link
              key={path.id}
              href={`/training/${path.id}`}
              className="group block p-6 rounded-lg border border-slate-200/10 dark:border-slate-700/50 hover:border-slate-300/20 dark:hover:border-slate-600 hover:bg-slate-800/30 dark:hover:bg-slate-800/50 transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <h2 className="text-lg font-semibold text-slate-50 group-hover:text-amber-400">
                  {path.name}
                </h2>
                <span
                  className={`text-xs px-3 py-1 rounded ${
                    difficultyColors[path.targetAudience]
                  }`}
                >
                  {difficultyLabels[path.targetAudience]}
                </span>
              </div>

              <p className="text-sm text-slate-300 mb-4">{path.description}</p>

              <div className="flex items-center gap-6 text-sm text-slate-400">
                <div>
                  <span className="muted">Durée totale</span>
                  <p className="font-medium text-slate-300">
                    {Math.round(path.estimatedDuration / 60)}h{" "}
                    {path.estimatedDuration % 60 > 0 ? `${path.estimatedDuration % 60}m` : ""}
                  </p>
                </div>
                <div>
                  <span className="muted">Modules</span>
                  <p className="font-medium text-slate-300">{path.modules.length} modules</p>
                </div>
              </div>

              <div className="text-xs text-amber-400 font-medium mt-4 group-hover:text-amber-300">
                Commencer →
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-12 p-6 rounded-lg bg-blue-50/10 dark:bg-blue-900/20 border border-blue-200/20 dark:border-blue-800/30">
          <h3 className="font-semibold text-sm text-slate-50 mb-2">💡 Conseils pour bien apprendre</h3>
          <p className="text-sm text-slate-300 mb-3">
            Les tutoriels sont conçus pour être suivis dans l'ordre. Complétez chaque module avant de passer au suivant.
            Utilisez le glossaire pour clarifier rapidement les concepts clés.
          </p>
          <Link href="/guide" className="text-sm text-amber-400 hover:text-amber-300 font-medium">
            Voir le guide complet →
          </Link>
        </div>

        <p className="muted text-xs mt-8">
          <Link href="/" className="text-amber-400 hover:underline">
            ← Retour à l'accueil
          </Link>
        </p>
      </div>
    </main>
  );
}
