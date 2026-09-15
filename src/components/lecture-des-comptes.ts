import type { BalanceSheet, CashFlowItem, CompanyRoundResult, IncomeStatement } from "@/engine/types";
import { formatEuro, formatPercent } from "@/lib/format";

/**
 * CE QUE LES COMPTES DISENT, en une phrase en tête de chaque état.
 *
 * Un compte de résultat est une colonne de chiffres ; un élève y lit la
 * dernière ligne et s'arrête là. La phrase dit le CHEMIN : ce que les ventes
 * laissent, ce que la structure en prend, où le tour s'est joué. Même geste
 * que la lecture bancaire du tableau de bord : une voix, un ton, pas un score.
 *
 * Isolé du composant pour être testé sans monter les états.
 */
export type Ton = "bon" | "mauvais" | "neutre";
export interface Lecture {
  ton: Ton;
  texte: string;
}

const structureDuTour = (cr: IncomeStatement): number =>
  cr.marketingCost +
  cr.qualityCost +
  cr.maintenanceCost +
  (cr.rdCost ?? 0) +
  (cr.engagementRse ?? 0) +
  cr.fixedCosts;

export function lectureDuResultat(cr: IncomeStatement): Lecture {
  const structure = structureDuTour(cr);
  const bon = cr.netIncome >= 0;
  if (cr.revenue <= 0.5) {
    return {
      ton: "mauvais",
      texte: `Aucune vente ce tour : les charges de structure (${formatEuro(structure)}) tombent sans rien en face. Résultat net ${formatEuro(cr.netIncome)}.`,
    };
  }
  if (cr.grossMargin <= 0) {
    return {
      ton: "mauvais",
      texte: `Chaque unité vendue coûte plus qu'elle ne rapporte : la marge sur coût variable est négative (${formatEuro(cr.grossMargin)}), avant même la structure. Résultat net ${formatEuro(cr.netIncome)}.`,
    };
  }
  const taux = formatPercent(cr.grossMargin / cr.revenue);
  const debut = `Les ventes (${formatEuro(cr.revenue)}) laissent ${formatEuro(cr.grossMargin)} de marge sur coût variable, soit ${taux}`;
  if (cr.ebitda < 0) {
    return {
      ton: "mauvais",
      texte: `${debut} ; les charges de structure (${formatEuro(structure)}) la dépassent : le tour perd ${formatEuro(-cr.ebitda)} avant même d'amortir et de payer les intérêts. Résultat net ${formatEuro(cr.netIncome)}.`,
    };
  }
  const apres = cr.depreciation + cr.interest;
  if (!bon) {
    return {
      ton: "mauvais",
      texte: `${debut} ; les charges de structure en absorbent ${formatEuro(structure)}, l'exploitation tient (${formatEuro(cr.ebitda)} d'EBE) mais amortissements et charges financières (${formatEuro(apres)}) font basculer le tour : résultat net ${formatEuro(cr.netIncome)}.`,
    };
  }
  return {
    ton: "bon",
    texte: `${debut} ; les charges de structure en absorbent ${formatEuro(structure)}, amortissements, charges financières et impôt ${formatEuro(apres + cr.tax)} : il reste ${formatEuro(cr.netIncome)} de résultat net.`,
  };
}

export function lectureDuBilan(
  b: BalanceSheet,
  fonctionnel: CompanyRoundResult["functionalBalance"],
): Lecture {
  const { frng, bfr, netTreasury } = fonctionnel;
  const morceaux: string[] = [];
  if (b.equity < 0) {
    morceaux.push(`Les pertes ont mangé le capital : capitaux propres négatifs (${formatEuro(b.equity)}).`);
  }
  if (frng < 0) {
    morceaux.push(
      `Vos ressources stables ne couvrent pas l'outil de production (fonds de roulement ${formatEuro(frng)}) : c'est le court terme qui finance du long terme.`,
    );
  } else {
    morceaux.push(
      `Vos ressources stables financent l'outil et dégagent ${formatEuro(frng)} de fonds de roulement`,
    );
    if (bfr > 0) {
      morceaux.push(
        `; le cycle d'exploitation (stocks et créances, moins les fournisseurs) en immobilise ${formatEuro(bfr)}.`,
      );
    } else {
      morceaux.push(
        `; le cycle d'exploitation en apporte ${formatEuro(-bfr)} de plus (vos fournisseurs vous financent).`,
      );
    }
  }
  const tresorerie =
    netTreasury >= 0
      ? `Trésorerie nette ${formatEuro(netTreasury)}.`
      : `Trésorerie nette ${formatEuro(netTreasury)}${b.overdraft > 0.5 ? ` : le découvert (${formatEuro(b.overdraft)}) comble l'écart, et il se paie.` : "."}`;
  const texte = `${morceaux.join("")} ${tresorerie}`;
  const ton: Ton = b.equity < 0 || frng < 0 || netTreasury < 0 ? "mauvais" : "bon";
  return { ton, texte };
}

export function lectureDeLaTresorerie(
  cashFlow: { opening: number; items: readonly CashFlowItem[]; closing: number },
  libelles: Readonly<Record<string, string>>,
): Lecture {
  const nom = (i: CashFlowItem) => (libelles[i.label] ?? i.label).toLowerCase();
  const entrees = cashFlow.items.filter((i) => i.amount > 0);
  const sorties = cashFlow.items.filter((i) => i.amount < 0);
  const totalEntrees = entrees.reduce((s, i) => s + i.amount, 0);
  const totalSorties = sorties.reduce((s, i) => s + i.amount, 0);
  const plusGrosse = [...sorties].sort((a, b) => a.amount - b.amount)[0];
  const delta = cashFlow.closing - cashFlow.opening;
  const mouvement =
    Math.abs(delta) < 0.5
      ? "la caisse n'a pas bougé"
      : delta > 0
        ? `la caisse gagne ${formatEuro(delta)}`
        : `la caisse perd ${formatEuro(-delta)}`;
  const couverture =
    totalEntrees + totalSorties >= 0
      ? `les encaissements (${formatEuro(totalEntrees)}) ont couvert les décaissements (${formatEuro(-totalSorties)})`
      : `les encaissements (${formatEuro(totalEntrees)}) n'ont pas couvert les décaissements (${formatEuro(-totalSorties)})`;
  const poste = plusGrosse ? ` ; le poste le plus lourd : ${nom(plusGrosse)} (${formatEuro(plusGrosse.amount)})` : "";
  const texte = `De ${formatEuro(cashFlow.opening)} à ${formatEuro(cashFlow.closing)} : ${mouvement}, ${couverture}${poste}.`;
  const ton: Ton = cashFlow.closing < 0 ? "mauvais" : delta >= 0 ? "bon" : "neutre";
  return { ton, texte };
}
