/**
 * Les hauts faits : ce que l'équipe vient de réussir, nommé.
 *
 * Pourquoi. Rien, dans l'arène, ne disait jamais à un élève qu'il venait de
 * faire quelque chose de difficile. Le classement dit où l'on est par rapport
 * aux autres ; le profil de compétences mesure les notions, mais vit hors de la
 * partie. Entre les deux, personne ne félicitait un redressement.
 *
 * Ce qu'ils ne sont pas. Ni points, ni monnaie, ni influence sur le BPI ni sur
 * le moteur : ce sont des CONSTATS, lus dans les résultats déjà calculés. Rien
 * de nouveau n'est stocké, aucune table n'est créée, et les retirer un jour ne
 * changerait pas une partie d'un euro.
 *
 * Chacun se déclenche au tour où il devient vrai, et une seule fois : c'est un
 * franchissement, pas un état. « Trois tours dans le vert » se dit au troisième,
 * pas au quatrième ni au cinquième.
 */

export interface HautFait {
  code: string;
  titre: string;
  /** Ce qui vient de se passer, en une ligne. */
  detail: string;
}

/** Le strict nécessaire pour les constater : deux chiffres par tour. */
export interface TourJoue {
  round: number;
  resultat: number;
  tresorerieNette: number;
}

/** Trois tours dans le vert : la série qui vaut d'être nommée. */
const SERIE = 3;

/**
 * Les hauts faits franchis AU tour donné — ceux qui n'étaient pas vrais au tour
 * précédent et le sont devenus. `tours` doit contenir tous les tours joués
 * jusque-là, dans l'ordre ; les tours postérieurs sont ignorés.
 */
export function hautsFaitsDuTour(tours: readonly TourJoue[], round: number): HautFait[] {
  const jusquIci = tours.filter((t) => t.round <= round).sort((a, b) => a.round - b.round);
  const ce = jusquIci.at(-1);
  if (!ce || ce.round !== round) return [];
  const avant = jusquIci.slice(0, -1);
  const faits: HautFait[] = [];

  // ── Le premier bénéfice ────────────────────────────────────────────────
  if (ce.resultat > 0 && avant.every((t) => t.resultat <= 0)) {
    faits.push({
      code: "premier_benefice",
      titre: "Premier bénéfice",
      detail: "Votre entreprise gagne de l'argent pour la première fois.",
    });
  }

  // ── Le retour au vert ──────────────────────────────────────────────────
  // Bénéfice → perte → bénéfice. La condition « un bénéfice AVANT la perte »
  // le distingue du premier bénéfice : les deux ne peuvent pas tomber ensemble.
  if (ce.resultat > 0) {
    let derniereePerte = -1;
    for (let i = 0; i < avant.length; i += 1) if (avant[i]!.resultat <= 0) derniereePerte = i;
    const beneficeAvantLaPerte =
      derniereePerte > 0 && avant.slice(0, derniereePerte).some((t) => t.resultat > 0);
    if (beneficeAvantLaPerte) {
      faits.push({
        code: "retour_au_vert",
        titre: "Retour au vert",
        detail: "Après une perte, le résultat redevient positif.",
      });
    }
  }

  // ── Trois tours dans le vert ───────────────────────────────────────────
  // Au tour qui COMPLÈTE la série, pas aux suivants : on compte exactement
  // SERIE tours positifs à la fin, et celui d'avant ne l'était pas.
  const queue = jusquIci.slice(-SERIE);
  const avantLaQueue = jusquIci.at(-SERIE - 1);
  if (
    queue.length === SERIE &&
    queue.every((t) => t.resultat > 0) &&
    (!avantLaQueue || avantLaQueue.resultat <= 0)
  ) {
    faits.push({
      code: "serie_verte",
      titre: `${SERIE} tours dans le vert`,
      detail: `${SERIE} résultats positifs d'affilée : ce n'est plus un coup de chance.`,
    });
  }

  // ── Trésorerie sauvée ──────────────────────────────────────────────────
  // Elle était négative au tour précédent, elle ne l'est plus. Le résultat et
  // la trésorerie sont deux choses différentes — c'est précisément la leçon.
  const precedent = avant.at(-1);
  if (precedent && precedent.tresorerieNette < 0 && ce.tresorerieNette >= 0) {
    faits.push({
      code: "tresorerie_sauvee",
      titre: "Trésorerie sauvée",
      detail: "La trésorerie nette repasse au-dessus de zéro.",
    });
  }

  return faits;
}
