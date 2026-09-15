/**
 * Les tours de la partie, en un coup d'œil.
 *
 * « Tour 1 / 6 » est un texte : il dit où l'on est, jamais d'où l'on vient ni
 * ce qui reste. La frise le montre — un segment par tour, coloré par le SIGNE
 * du résultat pour les tours joués, en laiton pour celui en cours, éteint pour
 * ceux à venir. La même convention de couleur que le liseré de l'accordéon :
 * vert au-dessus de zéro, rose en dessous.
 *
 * Elle remplace la puce « Tour 1 / 6 » de l'en-tête, qui répétait le bandeau
 * d'état juste en dessous.
 *
 * Elle ne dit RIEN de plus que ce que la page montre déjà ailleurs : c'est un
 * résumé visuel, pas une nouvelle information. L'infobulle et le texte pour
 * lecteur d'écran portent le chiffre, pour qui ne lit pas la couleur.
 */
export function FriseDesTours({
  roundsCount,
  currentRound,
  resultats,
  finished,
}: {
  roundsCount: number;
  currentRound: number;
  /**
   * Résultat net de chaque tour clos, par numéro de tour. `null` : le tour est
   * joué mais la frise ne porte pas de signe (côté enseignant, il n'y a pas
   * UN résultat mais un par équipe) : le segment est plein, sans couleur.
   */
  resultats: ReadonlyMap<number, number | null>;
  finished: boolean;
}) {
  if (roundsCount < 2) return null;
  const tours = Array.from({ length: roundsCount }, (_, i) => i + 1);
  const joues = tours.filter((n) => resultats.has(n)).length;

  return (
    <ol
      className="flex items-center gap-1"
      aria-label={
        finished
          ? `Partie terminée : ${roundsCount} tours joués`
          : `Tour ${currentRound} sur ${roundsCount}, ${joues} déjà joué${joues > 1 ? "s" : ""}`
      }
    >
      {tours.map((n) => {
        const resultat = resultats.get(n);
        const enCours = !finished && n === currentRound;
        const teinte =
          resultat !== undefined
            ? resultat === null
              ? "bg-slate-300/70"
              : resultat >= 0
                ? "bg-emerald-400/70"
                : "bg-rose-400/70"
            : enCours
              ? "bg-amber-400"
              : "bg-white/10";
        return (
          <li
            key={n}
            // Le titre porte le chiffre : la couleur seule ne dit rien à qui ne
            // la distingue pas, et rien du tout au survol d'un tour à venir.
            title={
              resultat !== undefined
                ? resultat === null
                  ? `Tour ${n} · joué`
                  : `Tour ${n} · résultat ${resultat >= 0 ? "positif" : "négatif"}`
                : enCours
                  ? `Tour ${n} · en cours`
                  : `Tour ${n} · à venir`
            }
            className={`h-1.5 w-5 rounded-full ${teinte} ${enCours ? "ring-1 ring-amber-300/60" : ""}`}
          />
        );
      })}
    </ol>
  );
}
