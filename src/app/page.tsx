import { startGameAction } from "./actions";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 p-8">
      <div className="flex flex-col items-center gap-4 text-center">
        <p className="text-sm uppercase tracking-[0.3em] text-amber-400">
          Simulation · Apprentissage · Décision · Compétition
        </p>
        <h1 className="text-5xl font-bold tracking-tight">BUSINESS ARENA</h1>
        <p className="max-w-xl text-slate-400">
          Pilotez une entreprise virtuelle, identifiez les problèmes, choisissez le bon
          modèle d&apos;analyse et progressez du niveau Découverte au niveau Executive.
        </p>
      </div>

      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-slate-900 p-6">
        <h2 className="text-lg font-semibold text-slate-100">Scénario NOVA</h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-400">
          Reprenez NOVA, jeune fabricant d&apos;enceintes portables : 6 trimestres pour
          apprendre prix, capacité, seuil de rentabilité et trésorerie, face à deux
          concurrents — SoundBox et Auris.
        </p>
        <ul className="mt-3 space-y-1 text-xs text-slate-500">
          <li>· Niveau Découverte — aucune connaissance préalable requise</li>
          <li>· Vos décisions : prix, production, marketing, qualité, financement</li>
          <li>· Attention au trimestre 4 : la croissance a un coût caché…</li>
        </ul>
        <form action={startGameAction} className="mt-5">
          <button
            type="submit"
            className="w-full rounded-lg bg-amber-400 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-amber-300"
          >
            Lancer une partie
          </button>
        </form>
      </div>

      <p className="text-xs text-slate-600">
        Aucun compte requis pour la démo — vos parties restent liées à ce navigateur.
      </p>
    </main>
  );
}
