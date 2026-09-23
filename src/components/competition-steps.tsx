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
    // CES RÉGLAGES SONT CEUX DE LA QUALIFICATION, et le titre doit le dire.
    // « Qualifiées pour la finale » était juste tant qu'un concours n'avait
    // que deux phases ; dans un tournoi à quatre, les premières de poule vont
    // aux quarts, pas en finale — et chaque phase intermédiaire porte ses
    // propres réglages, choisis au moment où on la lance.
    ["Poules de qualification", `${rules.groupSize} équipes par poule`],
    [
      "Qualifiées par poule",
      rules.advancePerGroup === 1
        ? "La première équipe de chaque poule"
        : `Les ${rules.advancePerGroup} premières équipes de chaque poule`,
    ],
    ["Règles de compétition", "Décisions verrouillées après validation, indices limités aux niveaux 1 à 3, aucun tirage manuel de cartes."],
  ];
  return (
    <section className="carte p-3 sm:p-5" aria-labelledby="reglages-titre">
      <h2 id="reglages-titre" className="mb-3 text-sm font-semibold text-slate-200">
        Réglages
      </h2>
      <dl className="grid gap-x-4 gap-y-2 text-sm sm:grid-cols-[auto_1fr]">
        {lignes.map(([nom, valeur]) => (
          <div key={nom} className="contents">
            <dt className="text-slate-400">{nom}</dt>
            <dd className={nom === "Code d'inscription" ? "font-mono text-amber-300" : "text-slate-300"}>
              {valeur}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

/**
 * Bloc « Déroulé » : une ligne par étape, celle en cours mise en avant.
 *
 * Il était disposé en QUATRE COLONNES, parce qu'un concours avait exactement
 * quatre étapes. Un tournoi à trois phases en a cinq : la cinquième tombait
 * seule sur une deuxième ligne, et les quatre premières se serraient déjà dans
 * une carte de demi-largeur au point de couper les mots. Une liste verticale
 * n'a pas ce défaut, se lit à n'importe quelle largeur, et laisse le détail de
 * chaque étape respirer.
 */
export function CompetitionSteps({ concours }: { concours: ConcoursPourDeroule }) {
  const deroule = derouleConcours(concours);
  return (
    <section className="carte p-3 sm:p-5" aria-labelledby="deroule-titre">
      <h2 id="deroule-titre" className="mb-3 text-sm font-semibold text-slate-200">
        Déroulé
      </h2>
      <ol className="space-y-1.5">
        {deroule.etapes.map((etape, i) => (
          <li
            key={etape.nom}
            aria-current={etape.etat === "courante" ? "step" : undefined}
            data-etat={etape.etat}
            className={`flex gap-3 rounded-lg border px-3 py-2 ${
              etape.etat === "courante"
                ? "border-amber-400/60 bg-amber-400/10"
                : etape.etat === "passee"
                  ? "border-white/10 bg-slate-950 opacity-70"
                  : "border-white/10 bg-slate-950"
            }`}
          >
            <span
              aria-hidden
              className={`mt-0.5 w-4 shrink-0 text-center text-sm font-medium ${
                etape.etat === "courante" ? "text-amber-300" : "text-slate-400"
              }`}
            >
              {etape.etat === "passee" ? "✓" : i + 1}
            </span>
            <span className="min-w-0">
              <span
                className={`block text-sm font-medium ${
                  etape.etat === "courante" ? "text-amber-300" : "text-slate-200"
                }`}
              >
                {etape.nom}
                {etape.mention ? ` · ${etape.mention}` : ""}
              </span>
              <span className="mt-0.5 block text-xs leading-relaxed text-slate-400">
                {etape.detail}
              </span>
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}
