/**
 * La carte mentale du jeu, montrée une fois au premier tour (solo).
 *
 * Inspiré des maquettes « découverte » : avant de plonger, le joueur reçoit le
 * plan — un cycle de quatre temps répété à chaque tour. Il ne se demande plus
 * « qu'est-ce qu'on attend de moi ? » : il sait qu'il va analyser, décider,
 * simuler, puis ajuster, et recommencer. Purement présentatif (pas d'état).
 */
const CYCLE = [
  { n: 1, titre: "Analyser", texte: "Vous étudiez votre entreprise et son marché." },
  { n: 2, titre: "Décider", texte: "Vous fixez prix, production et budgets." },
  { n: 3, titre: "Simuler", texte: "Le marché tranche : ventes, résultat, trésorerie." },
  { n: 4, titre: "Ajuster", texte: "Vous lisez les conséquences et corrigez au tour suivant." },
];

export function CycleDecisions() {
  return (
    <section className="rounded-xl border border-white/10 bg-slate-900 p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-semibold text-slate-100">Comment se déroule une partie</p>
        <span className="text-xs text-slate-500">un cycle répété à chaque tour ↻</span>
      </div>
      <ol className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {CYCLE.map((etape) => (
          <li
            key={etape.n}
            className="rounded-lg border border-white/10 bg-slate-950/40 p-3"
          >
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-400 text-xs font-semibold text-slate-950">
              {etape.n}
            </span>
            <p className="mt-2 text-sm font-medium text-amber-100">{etape.titre}</p>
            <p className="mt-0.5 text-xs leading-relaxed text-slate-400">{etape.texte}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
