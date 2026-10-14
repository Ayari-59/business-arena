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

/**
 * L'ÉCART AU TOUR PRÉCÉDENT, pour la colonne des états financiers.
 *
 * Un niveau ne dit pas si c'est bon : 1 240 000 € de chiffre d'affaires est une
 * bonne nouvelle après 980 000, une mauvaise après 1 400 000. La colonne
 * d'écart le dit, et c'est elle — pas une jauge, pas une pastille « tenu » —
 * qui porte le vert et le rouge : un écart EST un résultat.
 *
 * Deux règles tiennent ici, et c'est pourquoi le calcul est isolé du composant :
 *   · SANS RÉFÉRENCE, PAS DE COLONNE. Au premier tour, ou pour une ligne que le
 *     tour précédent ne portait pas (une subvention, une charge de R&D qui
 *     n'existait pas), la cellule reste VIDE. Écrire « 0 » dirait « rien n'a
 *     bougé », ce qui est faux : on ne sait pas.
 *   · LE POURCENTAGE N'A PAS TOUJOURS DE SENS. Il n'en a aucun quand la
 *     référence est nulle (division impossible), et il en a peu quand elle
 *     change de signe — passer de −2 000 € à +3 000 € n'est pas « +250 % ».
 *
 * `valeur` et `avant` sont dans le sens où ils S'AFFICHENT : une charge montrée
 * en négatif se compare en négatif, sinon l'écart s'inverserait.
 */
export interface Ecart {
  montant: number;
  /** L'écart relatif, ou null quand il n'a pas de sens. */
  relatif: number | null;
}

export function ecartAuTourPrecedent(valeur: number, avant: number | null | undefined): Ecart | null {
  if (avant === null || avant === undefined || !Number.isFinite(avant)) return null;
  const montant = valeur - avant;
  const memeSigne = valeur === 0 || avant === 0 ? false : valeur > 0 === avant > 0;
  return { montant, relatif: avant !== 0 && memeSigne ? montant / Math.abs(avant) : null };
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

/**
 * LE COMPTE DE RÉSULTAT, LIGNE À LIGNE, EN CASCADE.
 *
 * Les intitulés et l'ordre du compte vivent ici parce que DEUX écrans les
 * montrent : les comptes du tour (`financial-statements.tsx`) et le compte
 * ESTIMÉ de la feuille de décision (`resultat-estime.tsx`). Un compte estimé
 * qui rangerait ses lignes autrement, ou qui en oublierait une, ferait douter
 * du compte réel sans qu'on sache lequel croire.
 *
 * Les charges sont rendues NÉGATIVES, dans le sens où elles s'affichent : une
 * cascade se lit en additionnant ce qu'on voit. Une ligne nulle que le moteur
 * n'a pas servie n'existe pas — un compte plein de zéros est un meuble.
 */
export interface LigneDeCompte {
  /** La clé du poste au compte de résultat : une garde vérifie qu'aucune ne manque. */
  cle: keyof IncomeStatement;
  label: string;
  /** La valeur telle qu'elle s'affiche (charges en négatif). */
  valeur: number;
  /** Un solde intermédiaire ou un total : filet au-dessus, gras. */
  fort?: boolean;
  /** Un détail, décalé sous le solde qu'il construit. */
  decalee?: boolean;
}

export function lignesDuCompte(cr: IncomeStatement): LigneDeCompte[] {
  const lignes: LigneDeCompte[] = [];
  // Une charge nulle s'écrit « 0 € », jamais « −0 € » : le zéro négatif de la
  // virgule flottante est une curiosité de machine, pas un montant.
  const moins = (x: number) => (x === 0 ? 0 : -x);
  const poser = (ligne: LigneDeCompte) => lignes.push(ligne);
  /** Une ligne qui n'a pas joué ce tour ne s'écrit pas. */
  const siServie = (valeur: number | undefined, ligne: Omit<LigneDeCompte, "valeur">) => {
    if (valeur !== undefined && Math.abs(valeur) > 0.5) poser({ ...ligne, valeur });
  };

  poser({ cle: "revenue", label: "Chiffre d'affaires", valeur: cr.revenue });
  siServie(cr.productionStocked, {
    cle: "productionStocked",
    label: "Production stockée (± Δ stock)",
    decalee: true,
  });
  poser({ cle: "cogs", label: "− Coût variable des ventes", valeur: moins(cr.cogs), decalee: true });
  siServie(cr.commissionCost === undefined ? undefined : moins(cr.commissionCost), {
    cle: "commissionCost",
    label: "− Commissions des canaux partenaires",
    decalee: true,
  });
  poser({ cle: "grossMargin", label: "= Marge sur coût variable", valeur: cr.grossMargin, fort: true });
  poser({ cle: "marketingCost", label: "− Marketing", valeur: moins(cr.marketingCost), decalee: true });
  poser({ cle: "qualityCost", label: "− Qualité", valeur: moins(cr.qualityCost), decalee: true });
  poser({ cle: "maintenanceCost", label: "− Maintenance", valeur: moins(cr.maintenanceCost), decalee: true });
  siServie(cr.rdCost === undefined ? undefined : moins(cr.rdCost), {
    cle: "rdCost",
    label: "− Recherche et développement",
    decalee: true,
  });
  siServie(cr.engagementRse === undefined ? undefined : moins(cr.engagementRse), {
    cle: "engagementRse",
    label: "− Engagement RSE",
    decalee: true,
  });
  poser({ cle: "fixedCosts", label: "− Charges de structure", valeur: moins(cr.fixedCosts), decalee: true });
  poser({ cle: "ebitda", label: "= Excédent brut d'exploitation (EBE)", valeur: cr.ebitda, fort: true });
  poser({ cle: "depreciation", label: "− Amortissements", valeur: moins(cr.depreciation), decalee: true });
  poser({
    cle: "operatingIncome",
    label: "= Résultat d'exploitation",
    valeur: cr.operatingIncome,
    fort: true,
  });
  poser({ cle: "interest", label: "− Charges financières", valeur: moins(cr.interest), decalee: true });
  siServie(cr.financialIncome, {
    cle: "financialIncome",
    label: "+ Produits financiers",
    decalee: true,
  });
  siServie(cr.exceptionalCharge === undefined ? undefined : moins(cr.exceptionalCharge), {
    cle: "exceptionalCharge",
    label: "− Charges exceptionnelles",
    decalee: true,
  });
  siServie(cr.exceptionalIncome, {
    cle: "exceptionalIncome",
    label: "+ Produits exceptionnels",
    decalee: true,
  });
  siServie(cr.rescueSubsidy, {
    cle: "rescueSubsidy",
    label: "+ Subvention exceptionnelle",
    decalee: true,
  });
  poser({ cle: "pretaxIncome", label: "= Résultat avant impôt", valeur: cr.pretaxIncome, fort: true });
  siServie(cr.taxLossUsed === undefined ? undefined : moins(cr.taxLossUsed), {
    cle: "taxLossUsed",
    label: "− Déficit reporté imputé",
    decalee: true,
  });
  poser({ cle: "tax", label: "− Impôt sur les sociétés", valeur: moins(cr.tax), decalee: true });
  poser({ cle: "netIncome", label: "= RÉSULTAT NET", valeur: cr.netIncome, fort: true });
  return lignes;
}

/**
 * Les postes du compte que la cascade ne montre PAS, et pourquoi. Déclarés ici
 * pour qu'une garde puisse vérifier qu'aucun autre poste n'a été oublié : un
 * poste neuf au moteur doit apparaître dans la cascade, ou être nommé ici.
 */
export const POSTES_HORS_CASCADE: readonly (keyof IncomeStatement)[] = [
  // Le coût variable des unités PRODUITES n'est pas une charge du tour : c'est
  // ce qui part en stock quand on produit plus qu'on ne vend. Il se lit dans
  // l'analyse des coûts, pas dans la cascade.
  "variableProductionCost",
];
