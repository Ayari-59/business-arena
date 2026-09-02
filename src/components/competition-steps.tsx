import { PERIODICITE_LABELS, derouleConcours, type ConcoursPourDeroule } from "@/config/concours";
import type { Periodicity } from "@/config/scenarios/periodicity";

/** Bloc « Réglages » : ce que l'organisateur a choisi à la création. */
export function CompetitionSettings({
  rules,
  joinCode,
}: {
  rules: { periodicity: Periodicity; groupSize: number; advancePerGroup: number };
  joinCode: string;
}) {
  const lignes: [string, string][] = [
    ["Code d'inscription", joinCode],
    ["Périodicité", PERIODICITE_LABELS[rules.periodicity]],
    ["Équipes par groupe", `${rules.groupSize} équipes par partie de qualification`],
    ["Qualifiés par groupe", `${rules.advancePerGroup} par groupe → finale`],
    ["Règles de compétition", "Décisions verrouillées après validation, indices limités aux niveaux 1 à 3, aucun tirage manuel de cartes."],
  ];
  return (
    <section className="rounded-xl border border-white/10 bg-slate-900 p-4" aria-labelledby="reglages-titre">
      <h2 id="reglages-titre" className="mb-3 text-sm font-semibold text-slate-200">
        Réglages
      </h2>
      <dl className="grid gap-x-4 gap-y-2 text-sm sm:grid-cols-[auto_1fr]">
        {lignes.map(([nom, valeur]) => (
          <div key={nom} className="contents">
            <dt className="text-slate-500">{nom}</dt>
            <dd className={nom === "Code d'inscription" ? "font-mono text-amber-300" : "text-slate-300"}>
              {valeur}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

/** Bloc « Déroulé » : les quatre étapes, l'étape en cours mise en avant. */
export function CompetitionSteps({ concours }: { concours: ConcoursPourDeroule }) {
  const deroule = derouleConcours(concours);
  return (
    <section className="rounded-xl border border-white/10 bg-slate-900 p-4" aria-labelledby="deroule-titre">
      <h2 id="deroule-titre" className="mb-3 text-sm font-semibold text-slate-200">
        Déroulé
      </h2>
      <ol className="grid gap-2 sm:grid-cols-4">
        {deroule.etapes.map((etape, i) => (
          <li
            key={etape.nom}
            aria-current={etape.etat === "courante" ? "step" : undefined}
            data-etat={etape.etat}
            className={`rounded-lg border px-3 py-2 ${
              etape.etat === "courante"
                ? "border-amber-400/60 bg-amber-400/10"
                : etape.etat === "passee"
                  ? "border-white/10 bg-slate-950 opacity-70"
                  : "border-white/10 bg-slate-950"
            }`}
          >
            <p
              className={`text-sm font-medium ${
                etape.etat === "courante" ? "text-amber-300" : "text-slate-200"
              }`}
            >
              {etape.etat === "passee" ? "✓ " : `${i + 1}. `}
              {etape.nom}
              {etape.etat === "courante" ? " · en cours" : ""}
            </p>
            <p className="mt-1 text-xs text-slate-500">{etape.detail}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
