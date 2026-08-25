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
          Reprenez NOVA, jeune fabricant d&apos;enceintes portables : 6 tours pour
          apprendre prix, capacité, seuil de rentabilité et trésorerie, face à deux
          concurrents — SoundBox et Auris.
        </p>
        <ul className="mt-3 space-y-1 text-xs text-slate-500">
          <li>· Niveau Découverte — aucune connaissance préalable requise</li>
          <li>· Vos décisions : prix, production, marketing, qualité, financement</li>
          <li>· Attention au tour 4 : la croissance a un coût caché…</li>
        </ul>
        <form action={startGameAction} className="mt-5 space-y-4">
          <fieldset>
            <legend className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Périodicité — chaque tour représente…
            </legend>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {(
                [
                  ["month", "Un mois", "délais de paiement redoutables"],
                  ["quarter", "Un trimestre", "le rythme classique"],
                  ["year", "Une année", "vision long terme"],
                ] as const
              ).map(([value, label, hint]) => (
                <label
                  key={value}
                  className="cursor-pointer rounded-lg border border-white/10 bg-slate-950 p-3 text-center transition has-[:checked]:border-amber-400 has-[:checked]:bg-amber-400/10"
                >
                  <input
                    type="radio"
                    name="periodicity"
                    value={value}
                    defaultChecked={value === "quarter"}
                    className="sr-only"
                  />
                  <span className="block text-sm font-medium text-slate-100">{label}</span>
                  <span className="mt-1 block text-[11px] leading-tight text-slate-500">{hint}</span>
                </label>
              ))}
            </div>
          </fieldset>
          <label className="block">
            <span className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Entreprises sur le marché (vous + concurrents pilotés par l&apos;ordinateur)
            </span>
            <select
              name="companiesCount"
              defaultValue={3}
              className="mt-2 w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-amber-400/60"
            >
              <option value={2}>2 — duel face à SoundBox</option>
              <option value={3}>3 — le marché classique (recommandé)</option>
              <option value={4}>4 — marché disputé</option>
              <option value={6}>6 — forte concurrence</option>
              <option value={8}>8 — guerre de tous contre tous</option>
            </select>
            <span className="mt-1 block text-[11px] text-slate-500">
              Plus il y a d&apos;entreprises, plus la demande se partage : chaque point de part
              de marché se gagne.
            </span>
          </label>
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
