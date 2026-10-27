import type { CompanyRoundResult } from "../../../engine/types";
import { montantEcrit } from "../../../pedagogy/cours/correcteur";
import { auCentime } from "../../../pedagogy/cours/etats";
import { scenarioByCode } from "../../scenarios/registry";
import { anneeJouee, type Cas } from "../cas";
import { rejouerAvec } from "../gestion-de-la-pme";
import type { Chapitre, TableauDeDonnees } from "../types";

/**
 * CHAPITRE : L'EFFET DE LEVIER, LA DETTE ET LA RENTABILITÉ DES CAPITAUX PROPRES (DSCG, UE2
 * Finance, palier 4).
 *
 * L'année du cours (`anneeJouee`), lue au 31 décembre : le bilan de clôture de l'arène et les
 * quatre trimestres de son compte de résultat additionnés. Le chapitre construit l'actif
 * économique (immobilisations nettes et besoin en fonds de roulement), l'endettement financier
 * net (emprunts et découvert, moins les disponibilités), puis la rentabilité économique après
 * impôt, le coût de l'endettement net après impôt et le levier ; il vérifie la relation
 * Rcp = Re + (Re − i) × D/CP sur les chiffres de l'arène, et chiffre le résultat d'exploitation
 * sous lequel la dette se retourne contre les associés (l'effet de massue). L'arène rejoue enfin
 * l'année avec une autre structure : un apport des associés au premier trimestre, qui rembourse
 * autant d'emprunt par anticipation.
 *
 * L'EXERCICE : LA FIN D'ANNÉE. Le bilan est celui du 31 décembre, comme dans « La rentabilité »
 * et « Le bilan fonctionnel » ; les flux sont ceux de l'année. Une moyenne des bilans d'ouverture
 * et de clôture serait plus juste pour rapporter un flux à un stock, mais la relation du levier
 * tient exactement dès que les trois grandeurs (actif économique, capitaux propres, endettement
 * net) sont lues à la même date : le choix de la date ne change pas la démonstration.
 *
 * POURQUOI L'ENDETTEMENT NET. Au bilan de l'arène, l'actif économique vaut exactement les
 * capitaux propres plus l'endettement net : les disponibilités, que l'actif économique ne compte
 * pas, viennent en déduction des dettes. C'est la condition pour que la relation du levier
 * tombe juste, au centime. Le coût de la dette se rapporte donc à l'endettement net : il dépasse
 * le taux du contrat, parce que les intérêts courent sur l'emprunt dû à l'ouverture de chaque
 * trimestre (src/engine/finance/statements.ts) et que la trésorerie gardée en caisse ne rapporte
 * rien dans l'arène.
 *
 * CE QUE LE MOTEUR FAIT. Un seul taux d'impôt, celui du scénario, sur le résultat cumulé de
 * l'exercice (`impotSurLExercice`) : sur une année en bénéfice, le résultat net vaut exactement
 * (résultat d'exploitation − charges financières) × (1 − taux), et la relation du levier aussi.
 * L'écran « Ratios financiers » de l'arène calcule sa rentabilité économique sur les capitaux
 * propres plus les dettes financières, trésorerie comprise, et trimestre par trimestre : ce n'est
 * pas l'actif économique du chapitre, et le chapitre le dit.
 *
 * LES ENTREPRISES. Le levier ne se lit que là où l'année finit en bénéfice (sinon l'impôt ne
 * suit pas le taux, et la relation après impôt ne tient plus) et où l'entreprise doit plus aux
 * banques qu'elle n'a en caisse (sinon l'endettement net est négatif, et son coût n'a plus de
 * sens). NOVA, LA TABLE D'AUGUSTIN et ATLAS CONSEIL finissent l'année en perte ; MAILLE & CO,
 * PIXEL & CO et ROUTE & CIE ont plus de disponibilités que d'emprunts. Restent L'ESCALE, VOLT
 * FITNESS et MARTEL & FILS ; le test recompte la liste.
 */

/** Les entreprises où l'année du cours finit en bénéfice, avec un endettement net positif. */
export const ENTREPRISES_DU_LEVIER = ["hotel", "fitness", "batiment"] as const;

/**
 * LA STRUCTURE REJOUÉE : un apport des associés au premier trimestre, qui rembourse autant
 * d'emprunt par anticipation (`finance.capitalIncrease` et `finance.loanRepayment`). La caisse
 * ne bouge pas, l'exploitation non plus : seule change la part de la dette dans le financement.
 * 50 000 € tiennent sous l'enveloppe d'apports des trois scénarios et sous l'emprunt restant dû,
 * et laissent un endettement net positif partout. Le moteur honore ces deux décisions à tout
 * niveau ; la feuille de décision ne les ouvre qu'au niveau 4.
 */
export const APPORT_QUI_DESENDETTE = 50_000;
export const TRIMESTRE_DE_L_APPORT = 1;

/** Un montant à la française, avec le signe moins typographique ; retranché, un négatif va entre parenthèses. */
export const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
export const retranche = (x: number) => (x < 0 ? `(${eur(x)})` : eur(x));
/** Un nombre à la française, deux décimales au plus : 0,25. */
export const nombre = (x: number) => x.toLocaleString("fr-FR", { maximumFractionDigits: 2 }).replace(/^-/, "−");
/** Un taux déjà en pour cent : 6,83 %. */
export const pct = (t: number) => `${nombre(t)} %`;
/** Un écart de taux, en points : « 1,51 point », « 3,06 points ». */
export const points = (t: number) => `${nombre(t)} ${Math.abs(t) < 2 ? "point" : "points"}`;
/** Au centième, sans zéro négatif. */
export const auCentieme = (x: number) => Math.round(x * 100) / 100 || 0;
export const dE = (nom: string) => (/^[aeiouyéèêAEIOUYÉÈ]/.test(nom) ? `d'${nom}` : `de ${nom}`);

/** L'année s'arrête à la défaillance : les trimestres suivants comptent zéro. */
export function jusquALaDefaillance(annee: readonly CompanyRoundResult[]): readonly CompanyRoundResult[] {
  const k = annee.findIndex((r) => r.defaillant === true);
  return k < 0 ? annee : annee.slice(0, k + 1);
}

/** Le bilan de clôture et le compte de résultat d'une année de l'arène, en grandes masses, au centime. */
export interface StructureFinanciere {
  immobilisations: number;
  stocks: number;
  creances: number;
  fournisseurs: number;
  /** TVA nette due à l'État (négative : un crédit de TVA). */
  tva: number;
  bfr: number;
  actifEconomique: number;
  capitauxPropres: number;
  emprunts: number;
  decouvert: number;
  /** La banque et les placements. */
  disponibilites: number;
  endettementNet: number;
  resultatDExploitation: number;
  chargesFinancieres: number;
  resultatNet: number;
  impot: number;
}

/** La structure d'une année : le bilan du dernier trimestre joué, et la somme de ses comptes de résultat. */
export function structureDe(annee: readonly CompanyRoundResult[]): StructureFinanciere {
  const tours = jusquALaDefaillance(annee);
  const b = tours.at(-1)!.balanceSheet;
  const somme = (f: (r: CompanyRoundResult) => number) => auCentime(tours.reduce((t, r) => t + f(r), 0));
  const immobilisations = auCentime(b.fixedAssetsNet + (b.goodwill ?? 0));
  const stocks = auCentime(b.inventoryValue);
  const creances = auCentime(b.receivables);
  const fournisseurs = auCentime(b.payables);
  const tva = auCentime(b.vatLiability ?? 0);
  const bfr = auCentime(stocks + creances - fournisseurs - tva);
  const capitauxPropres = auCentime(b.equity);
  const emprunts = auCentime(b.financialDebt);
  const decouvert = auCentime(b.overdraft);
  const disponibilites = auCentime(b.cash + (b.shortTermInvestment ?? 0));
  return {
    immobilisations,
    stocks,
    creances,
    fournisseurs,
    tva,
    bfr,
    actifEconomique: auCentime(immobilisations + bfr),
    capitauxPropres,
    emprunts,
    decouvert,
    disponibilites,
    endettementNet: auCentime(emprunts + decouvert - disponibilites),
    resultatDExploitation: somme((r) => r.incomeStatement.operatingIncome),
    chargesFinancieres: somme((r) => r.incomeStatement.interest),
    resultatNet: somme((r) => r.incomeStatement.netIncome),
    impot: somme((r) => r.incomeStatement.tax),
  };
}

/**
 * Les rentabilités d'une structure, au centième de point comme l'élève les tape, et leurs
 * valeurs exactes (`exact`), pour vérifier que la relation du levier tombe juste.
 */
export function rentabilitesDe(s: StructureFinanciere, tauxIS: number) {
  const exploitationApresImpot = auCentime(s.resultatDExploitation * (1 - tauxIS));
  const chargesApresImpot = auCentime(s.chargesFinancieres * (1 - tauxIS));
  const re = auCentieme((exploitationApresImpot / s.actifEconomique) * 100);
  const i = auCentieme((chargesApresImpot / s.endettementNet) * 100);
  // Le levier en pour cent, pour que l'élève le tape au centième sans perdre la précision de la relation.
  const levier = auCentieme((s.endettementNet / s.capitauxPropres) * 100);
  return {
    exploitationApresImpot,
    chargesApresImpot,
    re,
    i,
    levier,
    rcp: auCentieme((s.resultatNet / s.capitauxPropres) * 100),
    /** La relation du levier, sur les taux arrondis que l'élève a trouvés. */
    rcpParLaFormule: auCentieme(re + ((re - i) * levier) / 100),
    exact: {
      re: (s.resultatDExploitation * (1 - tauxIS) * 100) / s.actifEconomique,
      i: (s.chargesFinancieres * (1 - tauxIS) * 100) / s.endettementNet,
      levier: (s.endettementNet * 100) / s.capitauxPropres,
      rcp: (s.resultatNet * 100) / s.capitauxPropres,
    },
  };
}

export type Verdict = "levier" | "massue";

/** L'année du cours, telle que le chapitre la lit. */
export const anneeDuCours = (code: string) => anneeJouee(code).partie.rounds.map((t) => t.results["joueur"]!);

/** L'année du cours rejouée avec l'apport des associés, qui rembourse autant d'emprunt. */
export const anneeAvecLApport = (code: string) =>
  rejouerAvec(code, "l-effet-de-levier:apport", (t, d) =>
    t === TRIMESTRE_DE_L_APPORT
      ? {
          ...d,
          finance: {
            ...d.finance,
            capitalIncrease: (d.finance?.capitalIncrease ?? 0) + APPORT_QUI_DESENDETTE,
            loanRepayment: (d.finance?.loanRepayment ?? 0) + APPORT_QUI_DESENDETTE,
          },
        }
      : undefined,
  );

const calculs = new Map<string, ReturnType<typeof calculer>>();

/** Le levier de l'année du cours, et ce que l'apport des associés y change. */
export function effetDeLevier(c: Cas) {
  const deja = calculs.get(c.code);
  if (deja) return deja;
  const r = calculer(c);
  calculs.set(c.code, r);
  return r;
}

function calculer(c: Cas) {
  const tauxIS = scenarioByCode(c.code).scenario.finance.taxRate;
  const taux = c.pret.tauxAnnuel;
  const s = structureDe(anneeDuCours(c.code));
  const r = rentabilitesDe(s, tauxIS);
  const apres = structureDe(anneeAvecLApport(c.code));
  const r2 = rentabilitesDe(apres, tauxIS);
  // La dette sur laquelle les intérêts ont couru, en moyenne sur l'année : les intérêts divisés par le taux.
  const detteMoyenne = auCentime(s.chargesFinancieres / taux);
  // Le résultat d'exploitation où la rentabilité économique égale le coût de la dette : l'impôt s'y simplifie.
  const exploitationAuSeuil = auCentime((s.chargesFinancieres * s.actifEconomique) / s.endettementNet);
  return {
    tauxIS,
    tauxISPct: auCentieme(tauxIS * 100),
    taux: auCentieme(taux * 100),
    tauxApresImpot: auCentieme(taux * (1 - tauxIS) * 100),
    detteMoyenne,
    s,
    r,
    exploitationAuSeuil,
    margeAvantLaMassue: auCentime(s.resultatDExploitation - exploitationAuSeuil),
    verdict: (r.exact.re > r.exact.i ? "levier" : "massue") as Verdict,
    apres,
    r2,
    variation: auCentieme(r2.rcp - r.rcp),
    rcpBaisse: r2.exact.rcp < r.exact.rcp,
  };
}

/** Le bilan de clôture et l'année, tels que l'élève les lit. */
export function tableauDeLAnnee(c: Cas): TableauDeDonnees {
  const { s, taux, tauxISPct } = effetDeLevier(c);
  const lignes = [
    { libelle: "Immobilisations nettes", valeurs: [eur(s.immobilisations)] },
    ...(s.stocks !== 0 ? [{ libelle: "Stocks", valeurs: [eur(s.stocks)] }] : []),
    { libelle: "Créances clients", valeurs: [eur(s.creances)] },
    ...(s.tva < 0 ? [{ libelle: "Crédit de TVA", valeurs: [eur(-s.tva)] }] : []),
    { libelle: "Disponibilités", valeurs: [eur(s.disponibilites)] },
    { libelle: "Capitaux propres (résultat compris)", valeurs: [eur(s.capitauxPropres)] },
    { libelle: "Emprunts", valeurs: [eur(s.emprunts)] },
    ...(s.decouvert !== 0 ? [{ libelle: "Découvert bancaire", valeurs: [eur(s.decouvert)] }] : []),
    { libelle: "Dettes fournisseurs", valeurs: [eur(s.fournisseurs)] },
    ...(s.tva > 0 ? [{ libelle: "TVA due à l'État", valeurs: [eur(s.tva)] }] : []),
    { libelle: "Résultat d'exploitation de l'année", valeurs: [eur(s.resultatDExploitation)] },
    { libelle: "Charges financières de l'année", valeurs: [eur(s.chargesFinancieres)] },
    { libelle: "Résultat net de l'année", valeurs: [eur(s.resultatNet)] },
    { libelle: "Taux annuel de l'emprunt", valeurs: [pct(taux)] },
    { libelle: "Taux de l'impôt sur les sociétés", valeurs: [pct(tauxISPct)] },
  ];
  return { titre: `Le bilan ${dE(c.entreprise)} au 31 décembre, et son année`, colonnes: ["Montant"], lignes };
}

export const L_EFFET_DE_LEVIER: Chapitre = {
  code: "l-effet-de-levier",
  parcours: "dscg-finance",
  palier: 4,
  blocs: ["DSCG UE2 · Finance"],
  titre: "L'effet de levier : la dette et la rentabilité des capitaux propres",
  accroche:
    "La dette coûte un taux fixe ; l'outil qu'elle finance rapporte ce qu'il rapporte. Tant qu'il rapporte plus, chaque euro emprunté enrichit les associés ; en dessous, il les appauvrit. La relation du levier, vérifiée au centime sur le bilan de l'arène.",
  objectifs: [
    "Construire l'actif économique et l'endettement financier net à partir du bilan",
    "Calculer la rentabilité économique et le coût de l'endettement net, après impôt",
    "Vérifier la relation Rcp = Re + (Re − i) × D/CP sur des comptes réels",
    "Chiffrer le résultat d'exploitation sous lequel la dette devient un effet de massue",
    "Mesurer ce qu'un changement de structure financière fait à la rentabilité des associés",
  ],
  libre: false,
  entreprises: {
    codes: ENTREPRISES_DU_LEVIER,
    pourquoi:
      "Le levier se lit là où l'année finit en bénéfice et où l'entreprise doit plus aux banques qu'elle n'a en caisse : L'ESCALE, VOLT FITNESS et MARTEL & FILS. NOVA, LA TABLE D'AUGUSTIN et ATLAS CONSEIL finissent l'année en perte ; MAILLE & CO, PIXEL & CO et ROUTE & CIE ont plus de disponibilités que d'emprunts.",
  },
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Deux façons de financer l'outil",
      notions: ["profitability_vs_return", "balance_sheet"],
      texte: (c) => {
        const { s } = effetDeLevier(c);
        return [
          `Pour exploiter son outil, ${c.entreprise} a besoin de ses immobilisations et de l'argent que son cycle d'exploitation retient : c'est l'actif économique. Deux sortes de capitaux le financent : ceux des associés, ${eur(s.capitauxPropres)} au 31 décembre, et ceux des banques, ${eur(s.emprunts)} d'emprunts.`,
          "Les associés n'ont droit qu'à ce qui reste une fois la banque payée. Si l'outil rapporte plus que la dette ne coûte, la différence leur revient en plus de ce que rapporte leur propre apport : c'est l'effet de levier. Si l'outil rapporte moins, la différence est prise sur leur part : c'est l'effet de massue.",
          "Le chapitre lit l'année de l'arène au 31 décembre : le bilan de clôture, et le compte de résultat des quatre trimestres additionnés.",
        ];
      },
      tableau: tableauDeLAnnee,
      repere: () => "Actif économique = immobilisations + BFR = capitaux propres + endettement financier net.",
    },
    {
      id: "actif-economique",
      type: "montants",
      titre: "L'actif économique et l'endettement net",
      notions: ["bfr", "net_treasury"],
      tableau: tableauDeLAnnee,
      question: () =>
        "D'après le bilan, calculez le besoin en fonds de roulement (les stocks et les créances, moins les dettes fournisseurs et la TVA due), l'actif économique (les immobilisations nettes plus le BFR), et l'endettement financier net (les emprunts et le découvert, moins les disponibilités).",
      champs: (c) => {
        const { s } = effetDeLevier(c);
        const tva = s.tva > 0 ? ` − ${eur(s.tva)}` : s.tva < 0 ? ` + ${eur(-s.tva)}` : "";
        const stocks = s.stocks !== 0 ? `${eur(s.stocks)} + ` : "";
        const decouvert = s.decouvert !== 0 ? ` + ${eur(s.decouvert)}` : "";
        return [
          { libelle: "Besoin en fonds de roulement", attendu: s.bfr, calcul: `${stocks}${eur(s.creances)} − ${eur(s.fournisseurs)}${tva} = ${eur(s.bfr)}`, tolerance: 0.02 },
          { libelle: "Actif économique", attendu: s.actifEconomique, calcul: `${eur(s.immobilisations)} + ${retranche(s.bfr)} = ${eur(s.actifEconomique)}`, tolerance: 0.02 },
          {
            libelle: "Endettement financier net",
            attendu: s.endettementNet,
            calcul: `${eur(s.emprunts)}${decouvert} − ${eur(s.disponibilites)} = ${eur(s.endettementNet)}`,
            tolerance: 0.02,
          },
        ];
      },
      explication: (c) => {
        const { s } = effetDeLevier(c);
        const ensemble = auCentime(s.capitauxPropres + s.endettementNet);
        const arrondi = auCentime(Math.abs(ensemble - s.actifEconomique));
        return [
          `Les capitaux propres et l'endettement net font ensemble ${eur(ensemble)} : l'actif économique, ${arrondi === 0 ? "au centime" : `à ${eur(arrondi)} d'arrondi près`}. C'est l'équilibre du bilan, relu : ce que l'exploitation mobilise est financé par les associés et par la dette, une fois la caisse déduite de la dette.`,
          "L'écran « Ratios financiers » de l'arène rapporte ses rentabilités aux capitaux propres plus les dettes financières, sans retrancher la trésorerie : il ne compte donc pas le même dénominateur que l'analyse financière, et ses taux diffèrent de ceux du chapitre.",
        ];
      },
    },
    {
      id: "rentabilite-economique",
      type: "montants",
      titre: "La rentabilité économique après impôt",
      notions: ["profitability_vs_return"],
      question: (c) => {
        const { tauxISPct } = effetDeLevier(c);
        return `L'outil rapporte son résultat d'exploitation, sur lequel l'impôt prélève ${pct(tauxISPct)}. Calculez le résultat d'exploitation après impôt, puis la rentabilité économique après impôt (ce résultat rapporté à l'actif économique, en %).`;
      },
      champs: (c) => {
        const { s, r, tauxIS } = effetDeLevier(c);
        return [
          {
            libelle: "Résultat d'exploitation après impôt",
            attendu: r.exploitationApresImpot,
            calcul: `${eur(s.resultatDExploitation)} × (1 − ${nombre(tauxIS)}) = ${eur(r.exploitationApresImpot)}`,
            tolerance: 0.02,
          },
          {
            libelle: "Rentabilité économique après impôt, Re (%)",
            attendu: r.re,
            calcul: `${eur(r.exploitationApresImpot)} ÷ ${eur(s.actifEconomique)} × 100 = ${pct(r.re)}`,
            tolerance: 0.01,
          },
        ];
      },
      explication: (c) => {
        const { r } = effetDeLevier(c);
        return [
          `Chaque tranche de 100 € engagée dans l'exploitation ${dE(c.entreprise)} a rapporté ${nombre(r.re)} € après impôt sur l'année, quelle que soit la façon dont elle a été financée. La rentabilité économique ne dépend pas de la dette : c'est la performance de l'outil, avant tout partage entre la banque et les associés.`,
        ];
      },
    },
    {
      id: "cout-de-la-dette",
      type: "montants",
      titre: "Le coût de l'endettement net",
      notions: ["loan_schedule", "net_treasury"],
      question: (c) => {
        const { taux, tauxISPct } = effetDeLevier(c);
        return `Les charges financières sont déductibles : chaque euro d'intérêts fait économiser ${pct(tauxISPct)} d'impôt. Calculez les charges financières après impôt, le coût de l'endettement net après impôt (ces charges rapportées à l'endettement net, en %), et le taux du contrat d'emprunt après impôt (${pct(taux)} × (1 − taux de l'impôt), en %).`;
      },
      champs: (c) => {
        const { s, r, tauxIS, taux, tauxApresImpot } = effetDeLevier(c);
        return [
          {
            libelle: "Charges financières après impôt",
            attendu: r.chargesApresImpot,
            calcul: `${eur(s.chargesFinancieres)} × (1 − ${nombre(tauxIS)}) = ${eur(r.chargesApresImpot)}`,
            tolerance: 0.02,
          },
          {
            libelle: "Coût de l'endettement net après impôt, i (%)",
            attendu: r.i,
            calcul: `${eur(r.chargesApresImpot)} ÷ ${eur(s.endettementNet)} × 100 = ${pct(r.i)}`,
            tolerance: 0.01,
          },
          {
            libelle: "Taux du contrat après impôt (%)",
            attendu: tauxApresImpot,
            calcul: `${pct(taux)} × (1 − ${nombre(tauxIS)}) = ${pct(tauxApresImpot)}`,
            tolerance: 0.01,
          },
        ];
      },
      explication: (c) => {
        const { s, r, taux, tauxApresImpot, detteMoyenne } = effetDeLevier(c);
        return [
          `Le coût de l'endettement net, ${pct(r.i)}, dépasse le taux du contrat après impôt, ${pct(tauxApresImpot)}, pour deux raisons que l'arène rend visibles. Les intérêts courent sur ce qui reste dû à l'ouverture de chaque trimestre : ${eur(s.chargesFinancieres)} à ${pct(taux)} correspondent à ${eur(detteMoyenne)} dus en moyenne sur l'année, plus que les ${eur(s.emprunts)} du 31 décembre.`,
          `Surtout, les ${eur(s.disponibilites)} de disponibilités ne rapportent rien dans l'arène, alors qu'elles viennent en déduction de la dette : garder de la trésorerie oisive tout en restant endetté renchérit le coût de l'endettement net.`,
        ];
      },
    },
    {
      id: "la-relation",
      type: "montants",
      titre: "La relation du levier, vérifiée",
      notions: ["profitability_vs_return"],
      question: () =>
        "Calculez le levier financier (l'endettement net rapporté aux capitaux propres, en %), puis la rentabilité des capitaux propres de deux façons : par la relation Rcp = Re + (Re − i) × D/CP, avec vos taux arrondis, et directement (le résultat net rapporté aux capitaux propres, en %).",
      champs: (c) => {
        const { s, r } = effetDeLevier(c);
        const ecart = r.re - r.i;
        return [
          { libelle: "Levier financier, D/CP (%)", attendu: r.levier, calcul: `${eur(s.endettementNet)} ÷ ${eur(s.capitauxPropres)} × 100 = ${pct(r.levier)}`, tolerance: 0.01 },
          {
            libelle: "Rcp par la relation du levier (%)",
            attendu: r.rcpParLaFormule,
            calcul: `${pct(r.re)} + (${pct(r.re)} − ${pct(r.i)}) × ${pct(r.levier)} = ${pct(r.re)} ${ecart >= 0 ? "+" : "−"} ${pct(auCentieme(Math.abs((ecart * r.levier) / 100)))} = ${pct(r.rcpParLaFormule)}`,
            tolerance: 0.02,
          },
          {
            libelle: "Rcp par le résultat net (%)",
            attendu: r.rcp,
            calcul: `${eur(s.resultatNet)} ÷ ${eur(s.capitauxPropres)} × 100 = ${pct(r.rcp)}`,
            tolerance: 0.01,
          },
        ];
      },
      explication: (c) => {
        const { r } = effetDeLevier(c);
        const ecart = auCentieme(Math.abs(r.rcpParLaFormule - r.rcp));
        return [
          ecart === 0
            ? `Les deux chemins donnent ${pct(r.rcp)} : la relation du levier tombe juste sur les comptes de l'arène.`
            : `Les deux chemins donnent ${pct(r.rcpParLaFormule)} et ${pct(r.rcp)} : ${points(ecart)} d'écart, qui vient des taux arrondis au centième. Calculée sur les valeurs exactes, la relation tombe juste au centime.`,
          "Elle n'a rien d'une coïncidence : le résultat net est le résultat d'exploitation après impôt, moins les charges financières après impôt, et l'actif économique est la somme des capitaux propres et de l'endettement net. Diviser par les capitaux propres donne la relation.",
        ];
      },
    },
    {
      id: "levier-ou-massue",
      type: "choix",
      titre: "Levier ou massue ?",
      notions: ["profitability_vs_return", "loan_schedule"],
      question: (c) => {
        const { r } = effetDeLevier(c);
        return `Chez ${c.entreprise}, l'outil rapporte ${pct(r.re)} après impôt, l'endettement net coûte ${pct(r.i)} après impôt, et le levier vaut ${pct(r.levier)}. Que fait la dette à la rentabilité des associés ?`;
      },
      options: (c) => {
        const { r, verdict } = effetDeLevier(c);
        return [
          {
            texte: "Elle l'augmente : l'outil rapporte plus que la dette ne coûte",
            juste: verdict === "levier",
            retour:
              verdict === "levier"
                ? `Oui : chaque euro d'endettement net rapporte ${pct(r.re)} et coûte ${pct(r.i)}. L'écart, ${points(auCentieme(r.re - r.i))}, multiplié par le levier, s'ajoute à la rentabilité économique : ${pct(r.rcp)} pour les associés, contre ${pct(r.re)} pour l'outil.`
                : `Non : l'endettement net coûte ${pct(r.i)}, plus que les ${pct(r.re)} que rapporte l'outil.`,
          },
          {
            texte: "Elle la réduit : la dette coûte plus que l'outil ne rapporte",
            juste: verdict === "massue",
            retour:
              verdict === "massue"
                ? `Oui : chaque euro d'endettement net coûte ${pct(r.i)} et ne rapporte que ${pct(r.re)}. L'écart est pris sur la part des associés : ${pct(r.rcp)} pour eux, moins que les ${pct(r.re)} de l'outil. C'est l'effet de massue.`
                : `Non : l'outil rapporte ${pct(r.re)}, plus que les ${pct(r.i)} que coûte l'endettement net.`,
          },
          {
            texte: "Rien : la dette ne change que le partage, pas la rentabilité des associés",
            juste: false,
            retour: `Non : le partage change justement la rentabilité des associés. Elle vaut ${pct(r.rcp)}, et non les ${pct(r.re)} de l'outil, parce que la dette prend ou laisse l'écart entre ce qu'elle coûte et ce qu'elle finance.`,
          },
        ];
      },
    },
    {
      id: "seuil-de-massue",
      type: "montants",
      titre: "Le résultat d'exploitation où le levier s'inverse",
      notions: ["profitability_vs_return", "safety_margin"],
      question: (c) => {
        const { verdict } = effetDeLevier(c);
        return `Le levier s'inverse quand la rentabilité économique égale le coût de la dette. Les charges financières ne dépendent pas de l'activité : le résultat d'exploitation où Re égale i vaut les charges financières × actif économique ÷ endettement net (l'impôt s'y simplifie). Calculez-le, puis l'écart entre le résultat d'exploitation de l'année et ce seuil${verdict === "massue" ? " (négatif : l'année est déjà sous le seuil)" : ""}.`;
      },
      champs: (c) => {
        const { s, exploitationAuSeuil, margeAvantLaMassue } = effetDeLevier(c);
        return [
          {
            libelle: "Résultat d'exploitation où Re égale i",
            attendu: exploitationAuSeuil,
            calcul: `${eur(s.chargesFinancieres)} × ${eur(s.actifEconomique)} ÷ ${eur(s.endettementNet)} = ${eur(exploitationAuSeuil)}`,
            tolerance: 1,
          },
          {
            libelle: "Écart au seuil",
            attendu: margeAvantLaMassue,
            calcul: `${eur(s.resultatDExploitation)} − ${retranche(exploitationAuSeuil)} = ${eur(margeAvantLaMassue)}`,
            tolerance: 1,
          },
        ];
      },
      explication: (c) => {
        const { s, exploitationAuSeuil, margeAvantLaMassue, verdict } = effetDeLevier(c);
        const part = auCentieme((Math.abs(margeAvantLaMassue) / s.resultatDExploitation) * 100);
        return verdict === "levier"
          ? [
              `Le résultat d'exploitation peut baisser de ${eur(margeAvantLaMassue)}, soit ${pct(part)} de celui de l'année, avant que la dette ne se retourne contre les associés. En dessous de ${eur(exploitationAuSeuil)}, chaque euro emprunté coûte plus qu'il ne rapporte, et le même levier qui amplifiait les bonnes années amplifie les mauvaises.`,
              "C'est le risque financier : plus le levier est fort, plus la rentabilité des associés varie avec celle de l'outil, dans les deux sens.",
            ]
          : [
              `Il manque ${eur(-margeAvantLaMassue)} de résultat d'exploitation : il faudrait le porter de ${eur(s.resultatDExploitation)} à ${eur(exploitationAuSeuil)} pour que l'outil rapporte ce que coûte la dette. Tant que l'exploitation reste sous ${eur(exploitationAuSeuil)}, chaque euro d'endettement net prélève sur la part des associés.`,
              "Deux voies en sortent : relever la rentabilité de l'outil, ou réduire ce que coûte la dette, en commençant par la trésorerie oisive qui renchérit l'endettement net.",
            ];
      },
    },
    {
      id: "apport",
      type: "montants",
      titre: "L'arène rejoue l'année avec moins de dette",
      notions: ["profitability_vs_return", "loan_schedule"],
      tableau: (c) => {
        const { s, r, apres, r2 } = effetDeLevier(c);
        return {
          titre: "L'année jouée, telle quelle et avec l'apport",
          colonnes: ["Telle quelle", "Avec l'apport"],
          lignes: [
            { libelle: "Résultat d'exploitation", valeurs: [eur(s.resultatDExploitation), eur(apres.resultatDExploitation)] },
            { libelle: "Charges financières", valeurs: [eur(s.chargesFinancieres), eur(apres.chargesFinancieres)] },
            { libelle: "Résultat net", valeurs: [eur(s.resultatNet), eur(apres.resultatNet)] },
            { libelle: "Actif économique au 31 décembre", valeurs: [eur(s.actifEconomique), eur(apres.actifEconomique)] },
            { libelle: "Capitaux propres au 31 décembre", valeurs: [eur(s.capitauxPropres), eur(apres.capitauxPropres)] },
            { libelle: "Endettement net au 31 décembre", valeurs: [eur(s.endettementNet), eur(apres.endettementNet)] },
            { libelle: "Rentabilité économique après impôt", valeurs: [pct(r.re), pct(r2.re)] },
            { libelle: "Coût de l'endettement net après impôt", valeurs: [pct(r.i), pct(r2.i)] },
          ],
        };
      },
      question: () =>
        `Les associés apportent ${eur(APPORT_QUI_DESENDETTE)} au trimestre ${TRIMESTRE_DE_L_APPORT}, et l'entreprise rembourse autant d'emprunt par anticipation ; l'arène a rejoué l'année. D'après le tableau, calculez le nouveau levier (en %), la nouvelle rentabilité des capitaux propres (le résultat net rapporté aux capitaux propres, en %), et sa variation en points (après moins avant).`,
      champs: (c) => {
        const { r, apres, r2, variation } = effetDeLevier(c);
        return [
          { libelle: "Levier avec l'apport (%)", attendu: r2.levier, calcul: `${eur(apres.endettementNet)} ÷ ${eur(apres.capitauxPropres)} × 100 = ${pct(r2.levier)}`, tolerance: 0.01 },
          {
            libelle: "Rcp avec l'apport (%)",
            attendu: r2.rcp,
            calcul: `${eur(apres.resultatNet)} ÷ ${eur(apres.capitauxPropres)} × 100 = ${pct(r2.rcp)}`,
            tolerance: 0.01,
          },
          { libelle: "Variation de la Rcp (points)", attendu: variation, calcul: `${pct(r2.rcp)} − ${pct(r.rcp)} = ${points(variation)}`, tolerance: 0.02 },
        ];
      },
      explication: (c) => {
        const { s, r, apres, r2 } = effetDeLevier(c);
        const charges = auCentime(s.chargesFinancieres - apres.chargesFinancieres);
        return [
          `L'exploitation n'a pas bougé : même résultat d'exploitation, même actif économique, même rentabilité économique, ${pct(r2.re)}. Seul change le financement : ${eur(charges)} de charges financières en moins, mais ${eur(auCentime(apres.capitauxPropres - s.capitauxPropres))} de capitaux propres en plus pour se partager le résultat.`,
          `Le levier passe de ${pct(r.levier)} à ${pct(r2.levier)}. Le coût de l'endettement net monte, de ${pct(r.i)} à ${pct(r2.i)} : la trésorerie oisive reste, et pèse sur une dette plus petite.`,
        ];
      },
    },
    {
      id: "moins-de-dette",
      type: "choix",
      titre: "Ce que l'apport a changé pour les associés",
      notions: ["profitability_vs_return"],
      question: (c) => {
        const { r, r2 } = effetDeLevier(c);
        return `Avec l'apport, la rentabilité des capitaux propres passe de ${pct(r.rcp)} à ${pct(r2.rcp)}. Pourquoi ?`;
      },
      options: (c) => {
        const { r, r2, rcpBaisse, verdict } = effetDeLevier(c);
        const levierJoue = verdict === "levier" && rcpBaisse;
        const massueJoue = verdict === "massue" && !rcpBaisse;
        return [
          {
            texte: "Elle baisse : moins de dette, c'est moins de levier sur une rentabilité qui dépasse son coût",
            juste: levierJoue,
            retour: levierJoue
              ? `Oui : l'outil rapportait ${pct(r.re)}, plus que les ${pct(r.i)} que coûtait l'endettement net. Chaque euro de dette remplacé par un euro des associés retire un gain qui leur revenait : la Rcp descend vers la rentabilité économique.`
              : `Non : elle passe de ${pct(r.rcp)} à ${pct(r2.rcp)}, et la dette coûtait plus que l'outil ne rapportait.`,
          },
          {
            texte: "Elle monte : moins de dette, c'est moins de massue sur une rentabilité sous son coût",
            juste: massueJoue,
            retour: massueJoue
              ? `Oui : l'endettement net coûtait ${pct(r.i)}, plus que les ${pct(r.re)} que rapportait l'outil. Chaque euro de dette remplacé par un euro des associés retire une perte qu'ils portaient : la Rcp remonte vers la rentabilité économique.`
              : `Non : elle passe de ${pct(r.rcp)} à ${pct(r2.rcp)}, et l'outil rapportait plus que la dette ne coûtait.`,
          },
          {
            texte: "Parce que l'exploitation a changé : l'apport a rendu l'outil plus rentable",
            juste: false,
            retour: `Non : la rentabilité économique est la même dans les deux années, ${pct(r.re)}. Seule la structure du financement a changé.`,
          },
        ];
      },
    },
    {
      id: "synthese",
      type: "lecture",
      titre: "Ce qu'il faut retenir",
      notions: ["profitability_vs_return"],
      texte: (c) => {
        const { r, verdict } = effetDeLevier(c);
        return [
          `Chez ${c.entreprise}, l'outil rapporte ${pct(r.re)} après impôt, l'endettement net coûte ${pct(r.i)}, et les associés obtiennent ${pct(r.rcp)} : ${verdict === "levier" ? "la dette joue pour eux" : "la dette joue contre eux"}.`,
          "La dette ne crée rien par elle-même : elle amplifie. Elle amplifie l'écart entre ce que rapporte l'outil et ce qu'elle coûte, dans un sens ou dans l'autre, d'autant plus que le levier est fort. S'endetter pour accroître la rentabilité des associés, c'est accepter qu'elle varie davantage avec celle de l'exploitation.",
        ];
      },
      repere: () => "Rcp = Re + (Re − i) × D/CP, où Re et i sont après impôt, et D l'endettement financier net.",
    },
  ],
};
