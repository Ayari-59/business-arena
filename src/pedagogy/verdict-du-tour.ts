import type { IncomeStatement } from "@/engine/types";
import { formatEuro } from "@/lib/format";

/**
 * OÙ LE TOUR S'EST JOUÉ.
 *
 * Un élève qui déplie ses résultats voit un chiffre — « résultat net
 * + 32 729 € » — et ne sait pas d'où il vient. Il voit bien qu'il a gagné plus
 * qu'au tour d'avant, sans pouvoir dire si c'est le marché, ses budgets ou
 * l'outil qui l'explique. La question que pose l'enseignant en classe, « qu'est
 * ce qui a changé ? », reste sans réponse lisible : elle demande de comparer
 * deux comptes de résultat ligne à ligne, ce que personne ne fait devant un
 * écran.
 *
 * LA DÉCOMPOSITION EST EXACTE, PAS UNE APPROXIMATION. Le résultat net s'écrit
 *
 *     net = marge sur coût variable − charges de structure − bas du compte
 *
 * où le bas du compte rassemble tout ce qui vient après l'EBITDA, compté comme
 * un coût : amortissements, intérêts et impôt, moins les produits financiers et
 * exceptionnels. La variation du résultat entre deux tours se répartit donc
 * SANS RESTE sur ces trois postes, et c'est le plus gros qui a fait le tour.
 * Un test vérifie que la somme des trois contributions retombe au centime sur
 * l'écart de résultat : c'est ce qui autorise à dire « le tour s'est joué là ».
 *
 * CE QUE CE N'EST PAS. Ni un score, ni un jugement, ni un conseil : un constat
 * chiffré, au passé. Le briefing du tour (`round-briefing`) dit ce qu'il faut
 * en faire ; celui-ci dit seulement ce qui vient de se passer.
 */

/** Les trois postes entre lesquels se répartit l'écart de résultat. */
export type PosteDuVerdict = "marge" | "structure" | "bas";

export interface ContributionAuVerdict {
  poste: PosteDuVerdict;
  /** Ce que le poste a APPORTÉ au résultat : positif il l'a fait monter. */
  apport: number;
}

export interface VerdictDuTour {
  /** Le ton du tour, lu sur le résultat net (ou sur son écart s'il y en a un). */
  ton: "bon" | "mauvais" | "neutre";
  resultat: number;
  /** L'écart avec le tour précédent, absent au premier tour. */
  ecart: number | null;
  /** Le poste qui a fait le tour, absent au premier tour. */
  poste: PosteDuVerdict | null;
  /** Les trois contributions, du plus gros apport en valeur absolue au plus petit. */
  contributions: readonly ContributionAuVerdict[];
  /** Le constat, en une phrase. */
  phrase: string;
}

/** Les charges de structure du tour : les budgets décidés, plus les fixes. */
export function structureDuTour(cr: IncomeStatement): number {
  return (
    cr.marketingCost +
    cr.qualityCost +
    cr.maintenanceCost +
    (cr.rdCost ?? 0) +
    (cr.engagementRse ?? 0) +
    cr.fixedCosts
  );
}

/**
 * Le bas du compte, compté comme un COÛT : ce qui reste à retrancher de
 * l'EBITDA pour tomber sur le résultat net. Les produits y entrent en négatif,
 * puisqu'ils allègent la charge.
 */
export function basDuCompte(cr: IncomeStatement): number {
  return (
    cr.depreciation +
    cr.interest +
    cr.tax +
    (cr.exceptionalCharge ?? 0) -
    (cr.financialIncome ?? 0) -
    (cr.exceptionalIncome ?? 0) -
    (cr.rescueSubsidy ?? 0)
  );
}

/**
 * Chaque poste a son nom, son pronom et son verbe : « la marge rapporte », « les
 * charges coûtent », « le bas du compte prend ». Les trois s'accordent, ce qu'une
 * phrase à trous ne fait pas toute seule — « la marge a coûté 30 000 € de plus »
 * se lisait à l'envers de ce qui s'était passé.
 */
const POSTES: Record<PosteDuVerdict, { nom: string; pronom: string; aux: string; verbe: string }> = {
  marge: { nom: "la marge sur les ventes", pronom: "elle", aux: "a", verbe: "rapporté" },
  structure: { nom: "les charges de structure", pronom: "elles", aux: "ont", verbe: "coûté" },
  bas: { nom: "le bas du compte", pronom: "il", aux: "a", verbe: "pris" },
};

/** Un euro d'écart n'a pas fait le tour : en-dessous, on parle de stabilité. */
const NEGLIGEABLE = 1;

export function verdictDuTour(
  tour: IncomeStatement,
  precedent: IncomeStatement | null,
): VerdictDuTour {
  const resultat = tour.netIncome;

  if (!precedent) {
    // Premier tour clos : rien à comparer. Le constat porte alors sur le
    // NIVEAU, et dit ce que la marge couvre — c'est la lecture qui prépare la
    // comparaison des tours suivants.
    const marge = tour.grossMargin;
    const structure = structureDuTour(tour);
    const couvre = marge >= structure;
    return {
      ton: resultat >= 0 ? "bon" : "mauvais",
      resultat,
      ecart: null,
      poste: null,
      contributions: [],
      phrase: couvre
        ? `Premier tour clos : la marge sur les ventes (${formatEuro(marge)}) couvre les charges de structure (${formatEuro(structure)}).`
        : `Premier tour clos : la marge sur les ventes (${formatEuro(marge)}) ne couvre pas les charges de structure (${formatEuro(structure)}).`,
    };
  }

  const ecart = resultat - precedent.netIncome;
  // Les apports au résultat : la marge le pousse, les deux autres postes le
  // tirent — un coût qui augmente retire du résultat, d'où le signe.
  const contributions: ContributionAuVerdict[] = [
    { poste: "marge" as const, apport: tour.grossMargin - precedent.grossMargin },
    { poste: "structure" as const, apport: -(structureDuTour(tour) - structureDuTour(precedent)) },
    { poste: "bas" as const, apport: -(basDuCompte(tour) - basDuCompte(precedent)) },
  ].sort((a, b) => Math.abs(b.apport) - Math.abs(a.apport));

  const premier = contributions[0]!;
  const ton = ecart > NEGLIGEABLE ? "bon" : ecart < -NEGLIGEABLE ? "mauvais" : "neutre";

  if (Math.abs(premier.apport) < NEGLIGEABLE) {
    return {
      ton: "neutre",
      resultat,
      ecart,
      poste: null,
      contributions,
      phrase: `Rien n'a bougé d'un tour à l'autre : le résultat reste à ${formatEuro(resultat)}.`,
    };
  }

  // « De plus » ou « de moins » suit le POSTE, pas son apport : des charges qui
  // montent rendent moins de résultat, et ce sont bien des charges en plus.
  const p = POSTES[premier.poste];
  const enHausse = premier.poste === "marge" ? premier.apport > 0 : premier.apport < 0;
  let phrase = `Le tour s'est joué sur ${p.nom} : ${p.pronom} ${p.aux} ${p.verbe} ${formatEuro(Math.abs(premier.apport))} de ${enHausse ? "plus" : "moins"} qu'au tour précédent.`;

  // LE CAS QUI ENSEIGNE LE PLUS : un poste gagne, un autre reprend. Sans cette
  // phrase, un élève qui a gagné 30 000 € de marge pour 2 000 € de résultat
  // croit que la décomposition mentait.
  const oppose = contributions
    .slice(1)
    .find(
      (c) =>
        Math.sign(c.apport) !== Math.sign(premier.apport) &&
        Math.abs(c.apport) >= Math.abs(premier.apport) / 2,
    );
  if (oppose) {
    const o = POSTES[oppose.poste];
    phrase += ` En face, ${o.nom} ${o.aux} ${oppose.apport > 0 ? "rendu" : "repris"} ${formatEuro(Math.abs(oppose.apport))}.`;
  }

  return {
    ton,
    resultat,
    ecart,
    poste: premier.poste,
    contributions,
    phrase,
  };
}
