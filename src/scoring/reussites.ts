/**
 * Les réussites : ce que l'équipe vient de réussir, nommé.
 *
 * Pourquoi. Rien, dans l'arène, ne disait jamais à un élève qu'il venait de
 * faire quelque chose de difficile. Le classement dit où l'on est par rapport
 * aux autres ; le profil de compétences mesure les notions, mais vit hors de la
 * partie. Entre les deux, personne ne félicitait un redressement.
 *
 * Ce qu'elles ne sont pas. Ni points, ni monnaie, ni influence sur l'IPG ni sur
 * le moteur : ce sont des CONSTATS, lus dans les résultats déjà calculés. Rien
 * de nouveau n'est stocké, aucune table n'est créée, et les retirer un jour ne
 * changerait pas une partie d'un euro.
 *
 * Chacune se déclenche au tour où elle devient vraie, et une seule fois dans la
 * liste : c'est un franchissement, pas un état. « Trois tours dans le vert » se
 * dit au troisième, pas au quatrième ni au cinquième.
 *
 * ELLES NE PARLAIENT QUE D'ARGENT. Les quatre premières lisaient le résultat
 * net et la trésorerie, et rien d'autre : une équipe qui gagnait des parts de
 * marché, qui tenait sa prévision, qui ne perdait plus une vente ou qui faisait
 * tourner son atelier au bon régime ne récoltait rien. Or l'arène évalue six
 * dimensions. Les six suivantes lisent le marché, la prévision, les ruptures,
 * l'atelier et le prix — toutes dans des résultats DÉJÀ calculés.
 *
 * UNE RÉUSSITE QUE LA PARTIE NE PEUT PAS OFFRIR NE S'AFFICHE PAS. « Pari tenu »
 * demande une prévision, que tous les niveaux n'ouvrent pas ; une case à viser
 * qu'aucune décision ne permet d'atteindre serait une promesse creuse. Chaque
 * réussite dit donc de quelle donnée elle a besoin, et la liste ne montre que
 * celles que les tours joués peuvent nourrir.
 */

import type { CompanyRoundResult } from "@/engine/types";

export interface Reussite {
  code: string;
  titre: string;
  /** Ce qui vient de se passer, en une ligne. */
  detail: string;
  /**
   * Ce qu'il reste à faire, dit tant qu'il n'est pas franchi. La liste montre
   * AUSSI les cases vides : une réussite qu'on ne connaît pas ne se vise pas,
   * et la liste de ce qui est possible est ce qui donne envie du tour suivant.
   */
  viser: string;
  /**
   * La donnée sans laquelle cette réussite ne peut jamais arriver. Absente :
   * elle tient sur le résultat et la trésorerie, que tout tour porte.
   */
  besoin?: (t: TourJoue) => boolean;
}

/**
 * Ce qu'un tour clos apporte. Les deux premiers chiffres sont de tous les
 * tours ; les autres viennent des résultats du moteur et peuvent manquer selon
 * le métier et le niveau (pas de prévision demandée, pas de marché par
 * segment…). Ce qui manque ne rend pas une réussite fausse : il la rend
 * absente.
 */
export interface TourJoue {
  round: number;
  resultat: number;
  tresorerieNette: number;
  /** Part du marché total prise ce tour (0..1). */
  partDeMarche?: number;
  /** Unités vendues. */
  ventes?: number;
  /** Unités demandées et non servies, faute de stock. */
  ventesPerdues?: number;
  /** Prix moyen réellement obtenu : chiffre d'affaires ÷ unités vendues. */
  prixMoyen?: number;
  /** Part de la capacité employée (0..1). */
  utilisation?: number;
  /** Ventes annoncées dans le plan de trésorerie du tour, quand il est demandé. */
  ventesPrevues?: number;
}

/**
 * CE QU'UN TOUR APPORTE, LU UNE SEULE FOIS. Deux endroits appellent les
 * réussites : le tableau de bord d'un tour clos, et la liste de la partie.
 * S'ils lisaient le résultat chacun à sa façon, une réussite apparaîtrait dans
 * l'un et pas dans l'autre — le genre d'écart qu'on ne découvre qu'en classe.
 *
 * Les ventes se comptent comme la revue de prévision les compte, commandes
 * exceptionnelles et abonnements compris : c'est ce que l'élève a vendu, et
 * c'est ce à quoi son annonce sera comparée.
 */
export function lireLeTour(
  round: number,
  r: CompanyRoundResult,
  revueDePrevision?: { lines: readonly { format: "units" | "euro"; forecast: number }[] } | null,
): TourJoue {
  const segments = Object.values(r.market.bySegment);
  const ventes =
    segments.reduce((somme, d) => somme + d.sold, 0) +
    (r.extraOrders?.delivered ?? 0) +
    (r.orderOffer?.delivered ?? 0) +
    (r.subscription?.retained ?? 0);
  const ventesPerdues =
    segments.reduce((somme, d) => somme + d.lost, 0) + (r.subscription?.unserved ?? 0);
  return {
    round,
    resultat: r.incomeStatement.netIncome,
    tresorerieNette: r.functionalBalance.netTreasury,
    partDeMarche: r.market.totalShare,
    ventes,
    ventesPerdues,
    ...(ventes > 0 ? { prixMoyen: r.incomeStatement.revenue / ventes } : {}),
    utilisation: r.production.utilizationRate,
    ...(() => {
      const annonce = revueDePrevision?.lines.find((l) => l.format === "units");
      return annonce ? { ventesPrevues: annonce.forecast } : {};
    })(),
  };
}

/** Trois tours : la série qui vaut d'être nommée, pour le vert comme pour la pente. */
const SERIE = 3;

/** Une prévision tenue : cinq pour cent d'écart, dans un sens comme dans l'autre. */
const ECART_DU_PARI = 0.05;

/** Un atelier au bon régime : neuf dixièmes de sa capacité employés. */
const UTILISATION_PLEINE = 0.9;

/**
 * LES DIX, ÉCRITES UNE SEULE FOIS. Les libellés vivaient dans les branches du
 * calcul : la liste en aurait tenu une deuxième copie, et les deux auraient
 * divergé au premier mot changé. Le catalogue les porte, le calcul dit
 * lesquelles sont franchies.
 *
 * L'ordre est celui de l'écran, et il va du plus tôt rencontré au plus rare.
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
    code: "progression",
    titre: "Trois tours de mieux",
    detail: `${SERIE} tours où le résultat monte, perte ou bénéfice : c'est la pente qui compte.`,
    viser: `Améliorer votre résultat ${SERIE} tours de suite.`,
  },
  {
    code: "tresorerie_sauvee",
    titre: "Trésorerie sauvée",
    detail: "La trésorerie nette repasse au-dessus de zéro.",
    viser: "Ramener une trésorerie nette négative au-dessus de zéro.",
  },
  {
    code: "rien_de_perdu",
    titre: "Rien de perdu",
    detail: "Plus une seule vente manquée, après un tour qui en avait laissé filer.",
    viser: "Servir toute la demande, après un tour en rupture.",
    besoin: (t) => t.ventesPerdues !== undefined,
  },
  {
    code: "atelier_calibre",
    titre: "Atelier bien calibré",
    detail: `Plus de ${Math.round(UTILISATION_PLEINE * 100)} % de la capacité employée, et pas une vente perdue.`,
    viser: "Tourner près du plein sans laisser un client sans réponse.",
    besoin: (t) => t.utilisation !== undefined && t.ventesPerdues !== undefined,
  },
  {
    code: "pari_tenu",
    titre: "Pari tenu",
    detail: `Vos ventes tombent à moins de ${Math.round(ECART_DU_PARI * 100)} % de ce que vous aviez annoncé.`,
    viser: "Annoncer vos ventes, et les réaliser.",
    besoin: (t) => t.ventesPrevues !== undefined,
  },
  {
    code: "part_gagnee",
    titre: "Le marché vous suit",
    detail: `${SERIE} tours de part de marché en hausse.`,
    viser: `Gagner du terrain ${SERIE} tours de suite.`,
    besoin: (t) => t.partDeMarche !== undefined,
  },
  {
    code: "prix_tenu",
    titre: "Plus cher, sans reculer",
    detail: "Votre prix moyen monte et votre part de marché tient : le marché accepte votre valeur.",
    viser: "Monter votre prix sans perdre de part de marché.",
    besoin: (t) => t.prixMoyen !== undefined && t.partDeMarche !== undefined,
  },
] as const satisfies readonly Reussite[];

type CodeDeReussite = (typeof CATALOGUE)[number]["code"];

/**
 * Le même catalogue, vu comme une liste de réussites. `as const` donne à chaque
 * entrée son type exact, si bien que `besoin` « n'existe pas » sur celles qui
 * n'en portent pas : cette vue rend la propriété facultative, comme l'interface
 * la déclare.
 */
const TOUTES: readonly Reussite[] = CATALOGUE;

const fait = (code: CodeDeReussite): Reussite => CATALOGUE.find((d) => d.code === code)!;

/** Une suite qui monte, strictement, du premier au dernier. */
const monte = (valeurs: readonly number[]): boolean =>
  valeurs.every((v, i) => i === 0 || v > valeurs[i - 1]!);

/**
 * Les réussites franchies AU tour donné — celles qui n'étaient pas vraies au
 * tour précédent et le sont devenues. `tours` doit contenir tous les tours
 * joués jusque-là, dans l'ordre ; les tours postérieurs sont ignorés.
 */
export function reussitesFranchies(tours: readonly TourJoue[], round: number): Reussite[] {
  const jusquIci = tours.filter((t) => t.round <= round).sort((a, b) => a.round - b.round);
  const ce = jusquIci.at(-1);
  if (!ce || ce.round !== round) return [];
  const avant = jusquIci.slice(0, -1);
  const precedent = avant.at(-1);
  const franchies: Reussite[] = [];

  // ── Le premier bénéfice ────────────────────────────────────────────────
  if (ce.resultat > 0 && avant.every((t) => t.resultat <= 0)) {
    franchies.push(fait("premier_benefice"));
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
      franchies.push(fait("retour_au_vert"));
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
    franchies.push(fait("serie_verte"));
  }

  // ── Trois tours de mieux ───────────────────────────────────────────────
  // La PENTE, et non le signe : une perte qu'on réduit tour après tour est un
  // redressement, et c'est souvent tout ce qu'une équipe en difficulté peut
  // viser. Même règle de franchissement que la série verte — la série fait
  // exactement SERIE tours, sinon elle se redirait à chaque tour suivant.
  if (
    queue.length === SERIE &&
    monte(queue.map((t) => t.resultat)) &&
    (!avantLaQueue || avantLaQueue.resultat >= queue[0]!.resultat)
  ) {
    franchies.push(fait("progression"));
  }

  // ── Trésorerie sauvée ──────────────────────────────────────────────────
  // Elle était négative au tour précédent, elle ne l'est plus. Le résultat et
  // la trésorerie sont deux choses différentes — c'est précisément la leçon.
  if (precedent && precedent.tresorerieNette < 0 && ce.tresorerieNette >= 0) {
    franchies.push(fait("tresorerie_sauvee"));
  }

  // ── Rien de perdu ──────────────────────────────────────────────────────
  // La rupture est la faute qu'on ne voit pas dans le compte de résultat :
  // elle n'y laisse aucune ligne, seulement du chiffre d'affaires qui n'existe
  // pas. La corriger mérite d'être dit.
  if (
    ce.ventesPerdues === 0 &&
    precedent?.ventesPerdues !== undefined &&
    precedent.ventesPerdues > 0
  ) {
    franchies.push(fait("rien_de_perdu"));
  }

  // ── Atelier bien calibré ───────────────────────────────────────────────
  // Les deux erreurs symétriques du volume : produire trop, et immobiliser son
  // argent en stock ; produire trop peu, et laisser repartir des clients. Ce
  // tour-ci, ni l'une ni l'autre.
  if (
    ce.utilisation !== undefined &&
    ce.utilisation >= UTILISATION_PLEINE &&
    ce.ventesPerdues === 0
  ) {
    franchies.push(fait("atelier_calibre"));
  }

  // ── Pari tenu ──────────────────────────────────────────────────────────
  // La prévision n'est pas un exercice à côté de la partie : c'est le plan de
  // trésorerie, et son écart au réalisé est ce que la banque regarde.
  if (ce.ventesPrevues !== undefined && ce.ventesPrevues > 0 && ce.ventes !== undefined) {
    const ecart = Math.abs(ce.ventes - ce.ventesPrevues) / ce.ventesPrevues;
    if (ecart <= ECART_DU_PARI) franchies.push(fait("pari_tenu"));
  }

  // ── Le marché vous suit ────────────────────────────────────────────────
  const parts = queue.map((t) => t.partDeMarche);
  if (
    queue.length === SERIE &&
    parts.every((p): p is number => p !== undefined) &&
    monte(parts as number[]) &&
    (avantLaQueue?.partDeMarche === undefined || avantLaQueue.partDeMarche >= parts[0]!)
  ) {
    franchies.push(fait("part_gagnee"));
  }

  // ── Plus cher, sans reculer ────────────────────────────────────────────
  // Monter son prix coûte toujours des clients : en garder autant, c'est que
  // la valeur perçue a monté avec le prix.
  if (
    ce.prixMoyen !== undefined &&
    ce.partDeMarche !== undefined &&
    precedent?.prixMoyen !== undefined &&
    precedent.partDeMarche !== undefined &&
    ce.prixMoyen > precedent.prixMoyen &&
    ce.partDeMarche >= precedent.partDeMarche
  ) {
    franchies.push(fait("prix_tenu"));
  }

  return franchies;
}

/** Une case de la liste : la réussite, et le tour où elle a été franchie. */
export interface CaseDeReussite {
  reussite: Reussite;
  /** Le tour du franchissement, ou null tant qu'il ne l'est pas. */
  round: number | null;
}

/**
 * VOS RÉUSSITES : celles que la partie peut offrir, franchies ou non, dans
 * l'ordre du catalogue.
 *
 * Une réussite se disait au tour où elle arrivait, puis disparaissait avec lui :
 * une ligne verte lue une fois, dans un accordéon qu'on replie. Ce qu'une
 * équipe a réussi depuis le début de la partie n'était visible nulle part, et
 * ce qu'elle pouvait encore viser n'était écrit nulle part non plus.
 *
 * Le tour du franchissement est RELU du calcul par tour, et non compté à part :
 * deux façons de décider « c'est arrivé » finissent toujours par se contredire,
 * et c'est la ligne verte du tour qui fait foi.
 */
export function reussitesDeLaPartie(tours: readonly TourJoue[]): CaseDeReussite[] {
  const premierTour = new Map<string, number>();
  for (const t of [...tours].sort((a, b) => a.round - b.round)) {
    for (const f of reussitesFranchies(tours, t.round)) {
      if (!premierTour.has(f.code)) premierTour.set(f.code, t.round);
    }
  }
  // Tant qu'aucun tour n'est clos, rien ne prouve qu'une réussite soit hors de
  // portée : on montre tout l'horizon. Dès le premier tour joué, une réussite
  // dont la donnée n'existe pas dans cette partie disparaît — une case à viser
  // qu'aucune décision ne permet d'atteindre serait une promesse creuse. Ce
  // sens-là, et pas l'inverse : la liste ne rétrécit jamais en cours de partie,
  // puisque les leviers ouverts ne changent pas d'un tour à l'autre.
  const rienDeJoue = tours.length === 0;
  return TOUTES.filter(
    (f) => !f.besoin || rienDeJoue || tours.some((t) => f.besoin!(t)),
  ).map((f) => ({
    reussite: f,
    round: premierTour.get(f.code) ?? null,
  }));
}
