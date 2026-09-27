/**
 * Les hauts faits : ce que l'équipe vient de réussir, nommé.
 *
 * Pourquoi. Rien, dans l'arène, ne disait jamais à un élève qu'il venait de
 * faire quelque chose de difficile. Le classement dit où l'on est par rapport
 * aux autres ; le profil de compétences mesure les notions, mais vit hors de la
 * partie. Entre les deux, personne ne félicitait un redressement.
 *
 * Ce qu'ils ne sont pas. Ni points, ni monnaie, ni influence sur l'IPG ni sur
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
  /**
   * Ce qu'il reste à faire, dit tant qu'il n'est pas franchi. L'étagère montre
   * AUSSI les cases vides : un haut fait qu'on ne connaît pas ne se vise pas,
   * et la liste de ce qui est possible est ce qui donne envie du tour suivant.
   */
  viser: string;
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
 * LES QUATRE, ÉCRITS UNE SEULE FOIS. Les libellés vivaient dans les branches du
 * calcul : l'étagère en aurait tenu une deuxième copie, et les deux auraient
 * divergé au premier mot changé. Le catalogue les porte, le calcul dit
 * lesquels sont franchis.
 */
export const CATALOGUE = [
  {
    code: "premier_benefice",
    titre: "Premier bénéfice",
    detail: "Votre entreprise gagne de l'argent pour la première fois.",
    viser: "Finir un tour avec un résultat net positif.",
  },
  {
    code: "retour_au_vert",
    titre: "Retour au vert",
    detail: "Après une perte, le résultat redevient positif.",
    viser: "Repasser au bénéfice après un tour perdu.",
  },
  {
    code: "serie_verte",
    titre: `${SERIE} tours dans le vert`,
    detail: `${SERIE} résultats positifs d'affilée : ce n'est plus un coup de chance.`,
    viser: `Enchaîner ${SERIE} tours bénéficiaires.`,
  },
  {
    code: "tresorerie_sauvee",
    titre: "Trésorerie sauvée",
    detail: "La trésorerie nette repasse au-dessus de zéro.",
    viser: "Ramener une trésorerie nette négative au-dessus de zéro.",
  },
] as const satisfies readonly HautFait[];

type CodeDeHautFait = (typeof CATALOGUE)[number]["code"];

const fait = (code: CodeDeHautFait): HautFait => CATALOGUE.find((d) => d.code === code)!;

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
    faits.push(fait("premier_benefice"));
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
      faits.push(fait("retour_au_vert"));
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
    faits.push(fait("serie_verte"));
  }

  // ── Trésorerie sauvée ──────────────────────────────────────────────────
  // Elle était négative au tour précédent, elle ne l'est plus. Le résultat et
  // la trésorerie sont deux choses différentes — c'est précisément la leçon.
  const precedent = avant.at(-1);
  if (precedent && precedent.tresorerieNette < 0 && ce.tresorerieNette >= 0) {
    faits.push(fait("tresorerie_sauvee"));
  }

  return faits;
}

/** Une case de l'étagère : le haut fait, et le tour où il a été franchi. */
export interface CaseDeLEtagere {
  fait: HautFait;
  /** Le tour du franchissement, ou null tant qu'il ne l'est pas. */
  round: number | null;
}

/**
 * L'ÉTAGÈRE : les quatre hauts faits, franchis ou non, dans l'ordre du
 * catalogue.
 *
 * Un haut fait se disait au tour où il arrivait, puis disparaissait avec lui :
 * une ligne verte lue une fois, dans un accordéon qu'on replie. Ce qu'une
 * équipe a réussi depuis le début de la partie n'était visible nulle part, et
 * ce qu'elle pouvait encore viser n'était écrit nulle part non plus.
 *
 * Le tour du franchissement est RELU du calcul par tour, et non compté à part :
 * deux façons de décider « c'est arrivé » finissent toujours par se contredire,
 * et c'est la ligne verte du tour qui fait foi.
 */
export function etagereDesHautsFaits(tours: readonly TourJoue[]): CaseDeLEtagere[] {
  const premierTour = new Map<string, number>();
  for (const t of [...tours].sort((a, b) => a.round - b.round)) {
    for (const f of hautsFaitsDuTour(tours, t.round)) {
      if (!premierTour.has(f.code)) premierTour.set(f.code, t.round);
    }
  }
  return CATALOGUE.map((f) => ({ fait: f, round: premierTour.get(f.code) ?? null }));
}
