import { montantEcrit } from "../../../pedagogy/cours/correcteur";
import type { Cas } from "../cas";
import { budgetDuTrimestre, fournisseurDe, margesDeLaGamme } from "../monde/boutique";
import { BOUTIQUES_DU_COURS, type CodeDeFournisseur, type CodeDeReference, type FicheDeLaBoutique } from "../monde/maille-et-co";
import type { Chapitre, TableauDeDonnees } from "../types";

/**
 * CHAPITRE : LE BUDGET DU POINT DE VENTE (BTS MCO, palier 3).
 *
 * LE CHAPITRE JOUE DANS LE MONDE DU COURS (src/config/cours/monde), pas dans l'arène : la boutique
 * MAILLE & CO a une fiche figée (monde/maille-et-co.ts : la gamme, le stock du 1er janvier, les trois
 * fournisseurs, le budget du trimestre 1 de N) et le budget se calcule par le modèle du cours
 * (monde/boutique.ts, `budgetDuTrimestre`). Une évolution du moteur ne change rien ici.
 *
 * Le trimestre chiffré avant qu'il commence : le budget des ventes (la prévision du chapitre « Prévoir
 * les ventes », arrondie), le budget des achats (ventes + stock voulu − stock initial), la marge
 * commerciale budgétée (sur ce qui est vendu, pas sur ce qui est acheté), la TVA à reverser, ce que les
 * achats font sortir de la caisse selon le fournisseur, et l'objectif de chaque mois.
 *
 * Le piège central : le fournisseur le moins cher n'est pas celui qui ménage la caisse. Les fins de
 * série coûtent 18 % de moins, mais se paient comptant : elles font sortir du trimestre plus d'argent
 * que l'atelier local, plus cher, et bien plus que le façonnier payé à 45 jours.
 *
 * LES TROIS TEMPS (demande du propriétaire, octobre 2026 : progressif, mais au niveau de l'examen) :
 *   · guidé : intro, budget-des-ventes, quantites-a-acheter (la formule est au repère ou dans la
 *     question, qui nomme les chiffres) ;
 *   · l'expérience avant la formule (prédire, manipuler, constater, formaliser) : predire-le-delai
 *     puis le-delai-au-curseur (le délai qu'il faudrait aux fins de série pour ménager la caisse autant
 *     que le façonnier) avant les-decaissements ; predire-l-objectif puis l-objectif-au-curseur (ce que
 *     février et mars doivent faire après un janvier en retard) avant le-rattrapage ;
 *   · autonome : marge-budgetee, la-marge-du-vendeur, la-tva-du-trimestre, les-decaissements,
 *     le-rattrapage (ni formule ni chiffres à prendre ; le calcul de la correction montre le chemin) ;
 *   · expert : le-budget-relu (un calcul à rebours : de la sortie de caisse au stock voulu),
 *     le-laboratoire-du-budget (le fournisseur, un levier à choix, et le stock voulu : plus de marge sous
 *     un plafond de paiements, au prix d'un stock vide), la-caisse-ou-la-rupture (un jugement),
 *     variante-fins-de-serie (une variante chiffrée : le stock final au coût moyen pondéré),
 *     si-on-se-trompe ; puis la synthèse.
 */

/**
 * LE PLAFOND DES PAIEMENTS FOURNISSEURS, hypothèse du cours pour le laboratoire : la trésorerie de la
 * boutique ne peut pas consacrer plus de 105 000 € aux fournisseurs dans le trimestre.
 */
export const PLAFOND_DES_PAIEMENTS = 105_000;

/**
 * LE BUDGET RELU, hypothèse du cours pour le calcul à rebours : la direction a relevé le stock de pulls
 * col rond voulu au 31 mars à 600 articles, sans rien changer d'autre. L'élève ne reçoit que ce que les
 * achats feront sortir de la caisse, et remonte au stock voulu.
 */
export const STOCK_DE_COLS_RONDS_A_REBOURS = 600;

/** Les fournisseurs du laboratoire, codés pour le levier à choix. */
export const FOURNISSEURS_DU_LABORATOIRE: Readonly<Record<CodeDeFournisseur, number>> = { faconnier: 1, "atelier-local": 2, "fins-de-serie": 3 };

/** Le stock voulu au 31 mars dans le laboratoire, en pourcentage de celui du budget. */
export const STOCK_DU_LABORATOIRE = { min: 0, max: 150, pas: 10 } as const;

/** Les bornes des curseurs : le délai de paiement des fins de série, en jours ; le chiffre d'affaires d'un mois. */
export const DELAI_DU_CURSEUR = { min: 0, max: 90 } as const;
export const MOIS_DU_CURSEUR = { min: 85_000, max: 115_000 } as const;

/** La boutique du cours, seule : c'est elle qui achète des marchandises et tient un stock. */
export const ENTREPRISES_DU_BUDGET: readonly string[] = ["boutique"];

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const qte = (n: number) => n.toLocaleString("fr-FR", { maximumFractionDigits: 2 }).replace(/^-/, "−");
const pct = (x: number) => `${x.toLocaleString("fr-FR", { maximumFractionDigits: 2 }).replace(/^-/, "−")} %`;
const auCentime = (x: number) => Math.round(x * 100) / 100 + 0;
const plafond = (x: number) => Math.ceil(x - 1e-9);
const somme = (xs: readonly number[]) => xs.reduce((t, x) => t + x, 0);
const quatre = (x: number) => x.toLocaleString("fr-FR", { minimumFractionDigits: 4, maximumFractionDigits: 4 });

/** La fiche de la boutique du cours. */
export const ficheDe = (c: Pick<Cas, "code">): FicheDeLaBoutique => BOUTIQUES_DU_COURS[c.code]!;

/** Le stock voulu au 31 mars, référence par référence, à un pourcentage de celui du budget (à l'article). */
export function stockVouluA(f: FicheDeLaBoutique, pourcentage: number): Record<CodeDeReference, number> {
  return Object.fromEntries(f.gamme.map((r) => [r.code, Math.round((f.budget.stockFinalVoulu[r.code] * pourcentage) / 100)])) as Record<CodeDeReference, number>;
}

/** Le code d'un fournisseur, d'après sa valeur au levier à choix. */
const fournisseurDuLevier = (v: number) => (Object.entries(FOURNISSEURS_DU_LABORATOIRE).find(([, x]) => x === v)?.[0] ?? "faconnier") as CodeDeFournisseur;

/** Le budget du laboratoire : un fournisseur, un stock voulu au 31 mars en pourcentage de celui du budget. */
export function laboratoireDuBudget(f: FicheDeLaBoutique, fournisseur: number, pourcentage: number) {
  const b = budgetDuTrimestre(f, { fournisseur: fournisseurDuLevier(fournisseur), stockFinalVoulu: stockVouluA(f, pourcentage) });
  return { ...b, stockFinal: somme(b.references.map((r) => r.stockFinal)) };
}

/** Tout ce que le chapitre et son cas demandent. */
export function budgetDuPointDeVente(c: Pick<Cas, "code">) {
  const f = ficheDe(c);
  const b = budgetDuTrimestre(f);
  const tva = f.gamme[0]!.tauxTva;
  const ref = (code: CodeDeReference) => b.references.find((r) => r.code === code)!;
  const valeurInitiale = auCentime(somme(b.references.map((r) => r.valeurInitiale)));
  const valeurFinale = auCentime(somme(b.references.map((r) => r.valeurFinale)));
  const stockInitial = somme(b.references.map((r) => r.stockInitial));
  const stockFinal = somme(b.references.map((r) => r.stockFinal));
  const tvaCollectee = auCentime(b.ventesHt * tva);
  const tvaDeductible = auCentime(b.achatsHt * tva);
  const chez = (code: CodeDeFournisseur) => ({ ...budgetDuTrimestre(f, { fournisseur: code }), ...fournisseurDe(f, code) });
  const faconnier = chez("faconnier");
  const atelier = chez("atelier-local");
  const fins = chez("fins-de-serie");
  // Le délai qu'il faudrait aux fins de série pour ne pas faire sortir plus que le façonnier.
  const delaiQuiTient = plafond(f.budget.jours * (1 - faconnier.decaisse / fins.achatsTtc));
  const decaisseFinsA = (jours: number) => auCentime(fins.achatsTtc * Math.max(0, 1 - jours / f.budget.jours));
  // L'objectif : janvier est passé ; février et mars doivent faire le reste du trimestre.
  const janvier = margesDeLaGamme(f).chiffreDAffaires;
  const aFaireParMois = plafond((b.ventesHt - janvier) / 2);
  // Le budget relu : seul le stock voulu de cols ronds change ; l'élève remonte de la caisse au stock.
  const relu = budgetDuTrimestre(f, { stockFinalVoulu: { "col-rond": STOCK_DE_COLS_RONDS_A_REBOURS } });
  const colRond = ref("col-rond");
  const colsRondsEnPlus = Math.round((relu.achatsHt - b.achatsHt) / colRond.coutDAchat);
  // La variante : le pull col rond chez les fins de série, son stock final au coût moyen pondéré.
  const finsColRond = fins.references.find((r) => r.code === "col-rond")!;
  const coutMoyen = (finsColRond.valeurInitiale + finsColRond.achatsHt) / (finsColRond.stockInitial + finsColRond.achats);
  // Le stock de sécurité du trimestre : 7 jours de ventes prévues (la convention du stock du cours).
  const securite = plafond((b.ventes / f.budget.jours) * f.delaiDeSecurite);
  return {
    f,
    b,
    tva,
    ref,
    valeurInitiale,
    valeurFinale,
    stockInitial,
    stockFinal,
    variationDeStock: auCentime(valeurFinale - valeurInitiale),
    margeDuVendeur: auCentime(b.ventesHt - b.achatsHt),
    tauxDeMarque: b.margeCommerciale / b.ventesHt,
    tvaCollectee,
    tvaDeductible,
    tvaDue: auCentime(tvaCollectee - tvaDeductible),
    faconnier,
    atelier,
    fins,
    delaiQuiTient,
    decaisseFinsA,
    janvier,
    aFaireParMois,
    hausseSurJanvier: aFaireParMois / janvier - 1,
    relu,
    colRond,
    colsRondsEnPlus,
    finsColRond,
    coutMoyen,
    securite,
  };
}

export type BudgetDuPointDeVente = ReturnType<typeof budgetDuPointDeVente>;

/** « trimestre 1 de N, de janvier à mars » : le libellé de la fiche, sans son article. */
const trimestreDuBudget = (x: BudgetDuPointDeVente) => x.f.budget.libelle.replace(/^le /, "");

/** Le budget du trimestre, référence par référence : le document de départ. */
export function tableauDuBudget(c: Pick<Cas, "code">): TableauDeDonnees {
  const x = budgetDuPointDeVente(c);
  return {
    titre: `${x.f.entreprise} · le budget du ${trimestreDuBudget(x)}`,
    colonnes: ["Ventes prévues", "Prix de vente HT", "Stock au 1er janvier", "Stock voulu au 31 mars", "Prix d'achat HT"],
    lignes: [
      ...x.b.references.map((r) => ({ libelle: r.nom, valeurs: [qte(r.ventes), eur(r.prixHt), qte(r.stockInitial), qte(r.stockFinal), eur(r.coutDAchat)] })),
      { libelle: "Toute la gamme", valeurs: [qte(x.b.ventes), "", qte(x.stockInitial), qte(x.stockFinal), ""] },
    ],
  };
}

/** Les trois fournisseurs : leur prix, rapporté à celui du façonnier, et leur délai de paiement. */
function tableauDesFournisseurs(x: BudgetDuPointDeVente): TableauDeDonnees {
  return {
    titre: `${x.f.entreprise} · les trois fournisseurs`,
    colonnes: ["Prix d'achat", "Délai de paiement"],
    lignes: [x.faconnier, x.atelier, x.fins].map((fo) => ({
      libelle: fo.nom,
      valeurs: [`${qte(fo.multiplicateur)} × le prix du façonnier`, fo.delaiDePaiement === 0 ? "comptant" : `${fo.delaiDePaiement} jours`],
    })),
  };
}

/** La synthèse : le budget du trimestre chez chacun des trois fournisseurs. */
function tableauDesTroisBudgets(x: BudgetDuPointDeVente): TableauDeDonnees {
  const budgets = [x.faconnier, x.atelier, x.fins];
  return {
    titre: `${x.f.entreprise} · le trimestre chez chaque fournisseur`,
    colonnes: budgets.map((fo) => fo.nom),
    lignes: [
      { libelle: "Achats hors taxes", valeurs: budgets.map((fo) => eur(fo.achatsHt)) },
      { libelle: "Marge commerciale", valeurs: budgets.map((fo) => eur(fo.margeCommerciale)) },
      { libelle: "Décaissé dans le trimestre", valeurs: budgets.map((fo) => eur(fo.decaisse)) },
      { libelle: "Dû au fournisseur au 31 mars", valeurs: budgets.map((fo) => eur(fo.detteFournisseur)) },
    ],
  };
}

export const BUDGET_DU_POINT_DE_VENTE: Chapitre = {
  code: "budget-du-point-de-vente",
  parcours: "mco",
  palier: 3,
  blocs: ["BTS MCO Bloc 3 · Assurer la gestion opérationnelle", "BUT TC · Piloter un espace de vente"],
  titre: "Le budget du point de vente",
  accroche:
    "Le trimestre chiffré avant qu'il commence : ce qu'on vendra, ce qu'il faut acheter, la marge attendue, la TVA à reverser, ce que les achats feront sortir de la caisse selon le fournisseur, et l'objectif de chaque mois.",
  objectifs: [
    "Établir le budget des ventes et le budget des achats à partir des ventes et des stocks",
    "Calculer la marge commerciale budgétée sur ce qui est vendu, et la TVA à reverser",
    "Chiffrer ce que les achats font sortir de la caisse selon le délai de paiement du fournisseur",
    "Retrouver à rebours un stock voulu, et fixer l'objectif des mois qui restent",
    "Arbitrer entre la marge, la trésorerie et le stock",
  ],
  libre: false,
  entreprises: {
    codes: ENTREPRISES_DU_BUDGET,
    pourquoi:
      "ce chapitre budgète le trimestre de la boutique du cours, MAILLE & CO, dont la simulation tient le stock, les fournisseurs et la prévision des ventes ; le point de vente reste le même d'un chapitre à l'autre.",
  },
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Chiffrer avant de vivre",
      notions: ["cash_budget", "stock"],
      tableau: tableauDuBudget,
      texte: (c) => {
        const x = budgetDuPointDeVente(c);
        return [
          `Ce chapitre se joue dans la simulation du cours, à la boutique ${x.f.entreprise}. En décembre, la direction demande au manager le budget du ${trimestreDuBudget(x)} : ce qu'il vendra, ce qu'il achètera, la marge attendue et ce que la caisse paiera.`,
          `Les ventes prévues reprennent la prévision du chapitre « Prévoir les ventes », ${qte(x.b.ventes)} articles, partagées entre les références comme les ventes de janvier. La boutique part de ${qte(x.stockInitial)} articles en réserve, achetés au façonnier, et veut en garder ${qte(x.stockFinal)} au 31 mars (hypothèse du cours : le stock de sécurité, plus de quoi ouvrir avril).`,
          `La simulation suppose des achats réguliers sur les ${x.f.budget.jours} jours du trimestre : un fournisseur payé à 45 jours laisse dû, au 31 mars, 45 ÷ ${x.f.budget.jours} des achats. La TVA est de ${pct(x.tva * 100)} sur tout ce que la boutique vend et achète, et l'objectif d'un mois est le tiers du trimestre.`,
        ];
      },
      repere: () => "Quantités à acheter = ventes prévues + stock final voulu − stock initial. Part des achats payée dans le trimestre = 1 − délai de paiement ÷ jours du trimestre.",
    },
    {
      id: "budget-des-ventes",
      objectifs: [0],
      type: "montants",
      titre: "Le budget des ventes",
      notions: ["revenue", "vat_payable"],
      tableau: tableauDuBudget,
      question: (c) => {
        const x = budgetDuPointDeVente(c);
        return `Multipliez les ventes prévues de chaque référence par son prix de vente hors taxes : d'abord le pull col rond (${qte(x.colRond.ventes)} à ${eur(x.colRond.prixHt)}), puis toute la gamme. Ajoutez enfin la TVA de ${pct(x.tva * 100)}.`;
      },
      champs: (c) => {
        const x = budgetDuPointDeVente(c);
        return [
          { libelle: "Chiffre d'affaires du pull col rond", attendu: x.colRond.ventesHt, calcul: `${qte(x.colRond.ventes)} × ${eur(x.colRond.prixHt)} = ${eur(x.colRond.ventesHt)}` },
          { libelle: "Ventes hors taxes du trimestre", attendu: x.b.ventesHt, calcul: `${x.b.references.map((r) => `${qte(r.ventes)} × ${qte(r.prixHt)}`).join(" + ")} = ${eur(x.b.ventesHt)}` },
          { libelle: "Ventes toutes taxes comprises", attendu: x.b.ventesTtc, calcul: `${eur(x.b.ventesHt)} × ${qte(1 + x.tva)} = ${eur(x.b.ventesTtc)}` },
        ];
      },
      explication: (c) => {
        const x = budgetDuPointDeVente(c);
        return [
          `Le chiffre d'affaires budgété est de ${eur(x.b.ventesHt)} hors taxes. Les clients paieront ${eur(x.b.ventesTtc)} : la différence, ${eur(x.tvaCollectee)}, est la TVA que la boutique collecte pour l'État. Un budget des ventes se tient hors taxes.`,
        ];
      },
    },
    {
      id: "quantites-a-acheter",
      objectifs: [0],
      type: "montants",
      titre: "Le budget des achats",
      notions: ["stock"],
      tableau: tableauDuBudget,
      question: () =>
        "Pour chaque référence : quantités à acheter = ventes prévues + stock voulu au 31 mars − stock au 1er janvier. Calculez-les pour le pull col rond et le cardigan, puis pour toute la gamme, et chiffrez les achats hors taxes au prix du façonnier.",
      champs: (c) => {
        const x = budgetDuPointDeVente(c);
        const a = (code: CodeDeReference, libelle: string) => {
          const r = x.ref(code);
          return { libelle, attendu: r.achats, calcul: `${qte(r.ventes)} + ${qte(r.stockFinal)} − ${qte(r.stockInitial)} = ${qte(r.achats)}` };
        };
        return [
          a("col-rond", "Pulls col rond à acheter"),
          a("cardigan", "Cardigans à acheter"),
          { libelle: "Articles à acheter, toute la gamme", attendu: x.b.achats, calcul: `${x.b.references.map((r) => qte(r.achats)).join(" + ")} = ${qte(x.b.achats)}` },
          { libelle: "Achats hors taxes", attendu: x.b.achatsHt, calcul: `${x.b.references.map((r) => `${qte(r.achats)} × ${qte(r.coutDAchat)}`).join(" + ")} = ${eur(x.b.achatsHt)}` },
        ];
      },
      explication: (c) => {
        const x = budgetDuPointDeVente(c);
        const card = x.ref("cardigan");
        return [
          `Le pull col rond s'achète autant qu'il se vend : la boutique veut finir mars avec le stock du 1er janvier. Le cardigan s'achète plus : ${qte(card.achats - card.ventes)} articles de plus que ses ventes, pour passer de ${qte(card.stockInitial)} à ${qte(card.stockFinal)} en réserve. Le stock voulu pèse sur les commandes autant que les ventes.`,
        ];
      },
    },
    {
      id: "marge-budgetee",
      objectifs: [1],
      type: "montants",
      titre: "La marge commerciale budgétée",
      notions: ["margin_rates", "stock"],
      question: () =>
        "Sans formule cette fois : calculez le coût d'achat des marchandises vendues du trimestre, la marge commerciale budgétée, puis le taux de marque budgété, en pourcentage, au centième.",
      champs: (c) => {
        const x = budgetDuPointDeVente(c);
        return [
          {
            libelle: "Coût d'achat des marchandises vendues",
            attendu: x.b.coutDAchatDesVendues,
            calcul: `stock au 1er janvier + achats − stock au 31 mars = ${eur(x.valeurInitiale)} + ${eur(x.b.achatsHt)} − ${eur(x.valeurFinale)} = ${eur(x.b.coutDAchatDesVendues)}`,
          },
          { libelle: "Marge commerciale budgétée", attendu: x.b.margeCommerciale, calcul: `${eur(x.b.ventesHt)} − ${eur(x.b.coutDAchatDesVendues)} = ${eur(x.b.margeCommerciale)}` },
          { libelle: "Taux de marque budgété (%)", attendu: auCentime(x.tauxDeMarque * 100), tolerance: 0.05, calcul: `${eur(x.b.margeCommerciale)} ÷ ${eur(x.b.ventesHt)} × 100 = ${pct(auCentime(x.tauxDeMarque * 100))}` },
        ];
      },
      explication: (c) => {
        const x = budgetDuPointDeVente(c);
        return [
          `La marge se calcule sur ce qui est vendu : ${eur(x.b.coutDAchatDesVendues)} d'articles sortis de la réserve, et non les ${eur(x.b.achatsHt)} achetés. Le taux de marque budgété, ${pct(auCentime(x.tauxDeMarque * 100))}, est celui de janvier : la composition des ventes ne change pas.`,
        ];
      },
    },
    {
      id: "la-marge-du-vendeur",
      objectifs: [1],
      type: "choix",
      titre: "Une marge calculée sur les achats",
      notions: ["margin_rates", "stock"],
      question: (c) => {
        const x = budgetDuPointDeVente(c);
        return `Un vendeur calcule la marge du trimestre : ventes moins achats, ${eur(x.b.ventesHt)} − ${eur(x.b.achatsHt)} = ${eur(x.margeDuVendeur)}. La réserve compte pourtant ${qte(x.stockInitial - x.stockFinal)} articles de moins au 31 mars qu'au 1er janvier. Qu'en dites-vous ?`;
      },
      options: (c) => {
        const x = budgetDuPointDeVente(c);
        return [
          {
            texte: `Elle est trop basse de ${eur(x.variationDeStock)} : la réserve perd des articles, mais gagne en valeur`,
            juste: true,
            retour: `Oui. Au 31 mars, la réserve vaut ${eur(x.valeurFinale)} contre ${eur(x.valeurInitiale)} au 1er janvier : moins d'écharpes et de bonnets, plus de cardigans. Une part des achats, ${eur(x.variationDeStock)}, reste en réserve et n'est pas encore une charge. La marge est ${eur(x.b.margeCommerciale)}.`,
          },
          {
            texte: "Elle est juste : une marge, ce sont les ventes moins les achats",
            juste: false,
            retour: "Non : la marge retire des ventes ce qu'ont coûté les articles vendus, pas ceux achetés. Achats et ventes ne coïncident que si le stock ne bouge pas en valeur.",
          },
          {
            texte: "Elle est trop haute : il faut retirer la valeur des articles sortis de la réserve",
            juste: false,
            retour: `Non : c'est compter le stock en articles et non en valeur. La réserve perd ${qte(x.stockInitial - x.stockFinal)} articles mais gagne ${eur(x.variationDeStock)} : il faut ajouter cette hausse à la marge, pas la retirer.`,
          },
        ];
      },
    },
    {
      id: "la-tva-du-trimestre",
      objectifs: [1],
      type: "montants",
      titre: "La TVA à reverser",
      notions: ["vat_payable"],
      question: () =>
        "La boutique collecte la TVA sur ses ventes et récupère celle de ses achats ; des marchandises, elle la doit à la livraison. Calculez la TVA collectée du trimestre, la TVA déductible sur les achats du budget, puis la TVA à reverser à l'État.",
      champs: (c) => {
        const x = budgetDuPointDeVente(c);
        return [
          { libelle: "TVA collectée sur les ventes", attendu: x.tvaCollectee, calcul: `${eur(x.b.ventesHt)} × ${pct(x.tva * 100)} = ${eur(x.tvaCollectee)}` },
          { libelle: "TVA déductible sur les achats", attendu: x.tvaDeductible, calcul: `${eur(x.b.achatsHt)} × ${pct(x.tva * 100)} = ${eur(x.tvaDeductible)}` },
          { libelle: "TVA à reverser", attendu: x.tvaDue, calcul: `${eur(x.tvaCollectee)} − ${eur(x.tvaDeductible)} = ${eur(x.tvaDue)}` },
        ];
      },
      explication: (c) => {
        const x = budgetDuPointDeVente(c);
        return [
          `La TVA n'est ni une charge ni un produit : la boutique collecte ${eur(x.tvaCollectee)} pour l'État, en récupère ${eur(x.tvaDeductible)}, et lui reverse la différence, ${eur(x.tvaDue)}. Le budget de trésorerie la porte au mois qui suit chaque déclaration.`,
        ];
      },
    },
    {
      id: "predire-le-delai",
      objectifs: [2],
      type: "choix",
      titre: "Pariez sur le délai",
      notions: ["payment_terms", "cash_budget"],
      question: (c) => {
        const x = budgetDuPointDeVente(c);
        return `Pariez. Les ${x.fins.nom.toLowerCase()} coûtent ${pct(auCentime((1 - x.fins.multiplicateur) * 100))} de moins que le façonnier, mais se paient comptant. Si le tricoteur acceptait d'être payé à 30 jours, ses achats du trimestre feraient-ils sortir moins d'argent que ceux du façonnier, payé à ${x.faconnier.delaiDePaiement} jours ?`;
      },
      options: () => {
        const voir = "Faites varier son délai à l'étape suivante : le curseur montre à partir de quand il ménage la caisse.";
        return [
          { texte: "Non : il en sortirait encore plus", juste: true, retour: `Bon pari. ${voir}` },
          { texte: "Oui : son prix est bien plus bas", juste: false, retour: `Pari à vérifier. ${voir}` },
          { texte: "Autant : l'écart de prix compense l'écart de délai", juste: false, retour: `Pari à vérifier. ${voir}` },
        ];
      },
    },
    {
      id: "le-delai-au-curseur",
      objectifs: [2],
      type: "curseur",
      titre: "Négociez le délai",
      notions: ["payment_terms", "cash_budget"],
      question: (c) => {
        const x = budgetDuPointDeVente(c);
        return `Les achats du budget aux fins de série coûtent ${eur(x.fins.achatsTtc)} TVA comprise. Faites varier le délai que le tricoteur accorderait, de 0 à ${x.f.budget.jours} jours : une droite donne ce que ces achats font sortir de la caisse dans le trimestre, l'autre ce qu'en fait sortir le façonnier, ${eur(x.faconnier.decaisse)}. Placez le curseur sur le plus petit délai où les fins de série ne font pas sortir plus, puis validez.`;
      },
      grandeur: () => ({ libelle: "Délai de paiement des fins de série", unite: "jours" }),
      cible: (c) => ({ attendu: budgetDuPointDeVente(c).delaiQuiTient, min: DELAI_DU_CURSEUR.min, max: DELAI_DU_CURSEUR.max }),
      zones: ["La caisse est ménagée", "La caisse paie plus"],
      rates: () => ({
        dessous: "À ce délai, les fins de série font encore sortir plus que le façonnier : allongez-le.",
        dessus: "Un délai plus court suffit déjà : cherchez le plus petit.",
      }),
      montrer: "Montrer le délai",
      lecture: (c, d) => {
        const x = budgetDuPointDeVente(c);
        const decaisse = x.decaisseFinsA(d);
        return [
          { libelle: "Achats des fins de série, TVA comprise", montant: x.fins.achatsTtc },
          { libelle: "Décaissé dans le trimestre", montant: decaisse },
          { libelle: "Dû au tricoteur au 31 mars", montant: auCentime(x.fins.achatsTtc - decaisse) },
          { libelle: "Décaissé chez le façonnier", montant: x.faconnier.decaisse },
          { libelle: "Ce que la caisse garde de plus qu'avec le façonnier", montant: auCentime(x.faconnier.decaisse - decaisse), fort: true },
        ];
      },
      droites: (c) => {
        const x = budgetDuPointDeVente(c);
        return {
          produit: () => x.faconnier.decaisse,
          cout: (d) => x.fins.achatsTtc * (1 - d / x.f.budget.jours),
          libelles: [`Décaissé chez le façonnier, à ${x.faconnier.delaiDePaiement} jours`, "Décaissé chez les fins de série"],
        };
      },
      explication: (c) => {
        const x = budgetDuPointDeVente(c);
        return [
          `Il faudrait ${x.delaiQuiTient} jours au tricoteur pour ménager la caisse autant que le façonnier : à 30 jours, ses achats feraient encore sortir ${eur(x.decaisseFinsA(30))}. Un prix plus bas de ${pct(auCentime((1 - x.fins.multiplicateur) * 100))} pèse moins sur la caisse du trimestre que 45 jours de crédit sur un trimestre de ${x.f.budget.jours}.`,
          `La part payée dans le trimestre est 1 − délai ÷ ${x.f.budget.jours} : chaque jour de délai garde dans la caisse 1 ÷ ${x.f.budget.jours} des achats. C'est ce que l'étape suivante fait calculer chez chaque fournisseur.`,
        ];
      },
    },
    {
      id: "les-decaissements",
      objectifs: [2],
      type: "montants",
      titre: "Ce que la caisse paie, selon le fournisseur",
      notions: ["payment_terms", "cash_budget"],
      tableau: (c) => tableauDesFournisseurs(budgetDuPointDeVente(c)),
      question: () =>
        "Sans formule cette fois : pour les achats du budget, calculez ce que la caisse paie dans le trimestre chez chacun des trois fournisseurs, TVA comprise, et ce que la boutique doit encore au façonnier au 31 mars.",
      champs: (c) => {
        const x = budgetDuPointDeVente(c);
        const ligne = (fo: typeof x.faconnier, libelle: string) => ({
          libelle,
          attendu: fo.decaisse,
          tolerance: 0.5,
          calcul: `${eur(x.b.achatsHt)} × ${qte(fo.multiplicateur)} = ${eur(fo.achatsHt)} HT, × ${qte(1 + x.tva)} = ${eur(fo.achatsTtc)}, × (1 − ${fo.delaiDePaiement} ÷ ${x.f.budget.jours}) = ${eur(fo.decaisse)}`,
        });
        return [
          ligne(x.faconnier, "Décaissé chez le façonnier"),
          { libelle: "Dû au façonnier au 31 mars", attendu: x.faconnier.detteFournisseur, tolerance: 0.5, calcul: `${eur(x.faconnier.achatsTtc)} − ${eur(x.faconnier.decaisse)} = ${eur(x.faconnier.detteFournisseur)}` },
          ligne(x.atelier, "Décaissé chez l'atelier local"),
          ligne(x.fins, "Décaissé chez les fins de série"),
        ];
      },
      explication: (c) => {
        const x = budgetDuPointDeVente(c);
        return [
          `Le moins cher, les fins de série, fait sortir ${eur(x.fins.decaisse)} dans le trimestre ; le plus cher, l'atelier local, ${eur(x.atelier.decaisse)} ; le façonnier, ${eur(x.faconnier.decaisse)}. Pour la caisse du trimestre, le délai compte plus que le prix.`,
          `Les ${eur(x.faconnier.detteFournisseur)} dus au façonnier au 31 mars sont la ligne « Dettes fournisseurs » du bilan, et une sortie du trimestre suivant.`,
        ];
      },
    },
    {
      id: "le-budget-relu",
      objectifs: [3],
      type: "montants",
      titre: "Remonter de la caisse au stock voulu",
      notions: ["payment_terms", "stock"],
      question: (c) => {
        const x = budgetDuPointDeVente(c);
        return `La direction a relu le budget : chez le façonnier, les achats du trimestre feront sortir ${eur(x.relu.decaisse)} de la caisse au lieu de ${eur(x.faconnier.decaisse)}. Seul le stock de pulls col rond voulu au 31 mars a changé. Retrouvez les achats hors taxes du budget relu, les pulls col rond achetés en plus, puis le stock de pulls col rond voulu au 31 mars.`;
      },
      champs: (c) => {
        const x = budgetDuPointDeVente(c);
        return [
          {
            libelle: "Achats hors taxes du budget relu",
            attendu: x.relu.achatsHt,
            calcul: `${eur(x.relu.decaisse)} ÷ (1 − ${x.faconnier.delaiDePaiement} ÷ ${x.f.budget.jours}) ÷ ${qte(1 + x.tva)} = ${eur(x.relu.achatsHt)}`,
          },
          { libelle: "Pulls col rond achetés en plus", attendu: x.colsRondsEnPlus, calcul: `(${eur(x.relu.achatsHt)} − ${eur(x.b.achatsHt)}) ÷ ${eur(x.colRond.coutDAchat)} = ${qte(x.colsRondsEnPlus)}` },
          {
            libelle: "Stock de pulls col rond voulu au 31 mars",
            attendu: x.colRond.stockFinal + x.colsRondsEnPlus,
            calcul: `${qte(x.colRond.stockFinal)} + ${qte(x.colsRondsEnPlus)} = ${qte(x.colRond.stockFinal + x.colsRondsEnPlus)}`,
          },
        ];
      },
      explication: (c) => {
        const x = budgetDuPointDeVente(c);
        return [
          `Remonter, c'est défaire chaque étape dans l'ordre inverse : la part payée, puis la TVA, puis le prix d'achat, puis la formule des quantités. ${qte(x.colsRondsEnPlus)} pulls de plus en réserve coûtent ${eur(auCentime(x.relu.achatsHt - x.b.achatsHt))} d'achats hors taxes ; la caisse en paie ${eur(auCentime(x.relu.decaisse - x.faconnier.decaisse))} dans le trimestre, TVA comprise.`,
          "Le stock voulu n'est pas gratuit : chaque article gardé en réserve est un article acheté, et payé.",
        ];
      },
    },
    {
      id: "predire-l-objectif",
      objectifs: [3],
      type: "choix",
      titre: "Pariez sur février et mars",
      notions: ["revenue", "dashboard"],
      question: (c) => {
        const x = budgetDuPointDeVente(c);
        return `Pariez. Janvier a fait ${eur(x.janvier)} de chiffre d'affaires, pour un objectif du mois de ${eur(x.b.objectifDuMois)}. Pour tenir le budget du trimestre, février et mars devront faire chacun…`;
      },
      options: () => {
        const voir = "Faites varier leur chiffre d'affaires à l'étape suivante : le curseur montre ce qu'il faut pour tenir le trimestre.";
        return [
          { texte: "Plus que l'objectif du mois : il faut rattraper janvier", juste: true, retour: `Bon pari. ${voir}` },
          { texte: "L'objectif du mois : chaque mois a le sien", juste: false, retour: `Pari à vérifier. ${voir}` },
          { texte: "Autant que janvier : le rythme du trimestre est pris", juste: false, retour: `Pari à vérifier. ${voir}` },
        ];
      },
    },
    {
      id: "l-objectif-au-curseur",
      objectifs: [3],
      type: "curseur",
      titre: "Rattrapez le trimestre",
      notions: ["revenue", "dashboard"],
      question: (c) => {
        const x = budgetDuPointDeVente(c);
        return `Faites varier le chiffre d'affaires de février, et celui de mars avec lui, de ${eur(MOIS_DU_CURSEUR.min)} à ${eur(MOIS_DU_CURSEUR.max)}. Une droite donne le chiffre d'affaires du trimestre (janvier, ${eur(x.janvier)}, plus les deux mois), l'autre le budget, ${eur(x.b.ventesHt)}. Placez le curseur sur le plus petit chiffre d'affaires mensuel qui tient le budget, puis validez.`;
      },
      grandeur: () => ({ libelle: "Chiffre d'affaires de février, puis de mars", unite: "€" }),
      cible: (c) => ({ attendu: budgetDuPointDeVente(c).aFaireParMois, min: MOIS_DU_CURSEUR.min, max: MOIS_DU_CURSEUR.max }),
      zones: ["Le budget est tenu", "Le budget est manqué"],
      rates: () => ({
        dessous: "À ce chiffre d'affaires, le trimestre reste sous son budget.",
        dessus: "Moins suffit déjà à tenir le budget : cherchez le plus petit chiffre d'affaires.",
      }),
      montrer: "Montrer le chiffre d'affaires",
      lecture: (c, m) => {
        const x = budgetDuPointDeVente(c);
        return [
          { libelle: "Chiffre d'affaires de janvier", montant: x.janvier },
          { libelle: "Chiffre d'affaires du trimestre", montant: auCentime(x.janvier + 2 * m) },
          { libelle: "Budget des ventes du trimestre", montant: x.b.ventesHt },
          { libelle: "Ce que chaque mois fait au-delà de l'objectif du mois", montant: auCentime(m - x.b.objectifDuMois) },
          { libelle: "Trimestre moins budget", montant: auCentime(x.janvier + 2 * m - x.b.ventesHt), fort: true },
        ];
      },
      droites: (c) => {
        const x = budgetDuPointDeVente(c);
        return { produit: (m) => x.janvier + 2 * m, cout: () => x.b.ventesHt, libelles: ["Chiffre d'affaires du trimestre", "Budget des ventes du trimestre"] };
      },
      explication: (c) => {
        const x = budgetDuPointDeVente(c);
        return [
          `Il faut ${eur(x.aFaireParMois)} en février et autant en mars : ${eur(auCentime(x.aFaireParMois - x.b.objectifDuMois))} de plus que l'objectif du mois, chaque mois, pour rendre les ${eur(auCentime(x.b.objectifDuMois - x.janvier))} que janvier a manqués. Un objectif mensuel ne se tient pas mois après mois : il se rattrape sur le trimestre.`,
        ];
      },
    },
    {
      id: "le-rattrapage",
      objectifs: [3],
      type: "montants",
      titre: "L'objectif des mois qui restent",
      notions: ["revenue", "dashboard"],
      question: () =>
        "Sans formule cette fois : calculez l'objectif d'un mois, ce que février et mars doivent faire chacun pour tenir le budget du trimestre, et leur hausse sur janvier, en pourcentage, au centième.",
      champs: (c) => {
        const x = budgetDuPointDeVente(c);
        return [
          { libelle: "Objectif d'un mois", attendu: x.b.objectifDuMois, calcul: `${eur(x.b.ventesHt)} ÷ 3 = ${eur(x.b.objectifDuMois)}` },
          { libelle: "Chiffre d'affaires de février et de mars, chacun", attendu: x.aFaireParMois, calcul: `(${eur(x.b.ventesHt)} − ${eur(x.janvier)}) ÷ 2 = ${eur(x.aFaireParMois)}` },
          { libelle: "Hausse sur janvier (%)", attendu: auCentime(x.hausseSurJanvier * 100), tolerance: 0.05, calcul: `(${eur(x.aFaireParMois)} ÷ ${eur(x.janvier)} − 1) × 100 = ${pct(auCentime(x.hausseSurJanvier * 100))}` },
        ];
      },
      explication: (c) => {
        const x = budgetDuPointDeVente(c);
        return [
          `Après janvier, tenir le trimestre demande ${pct(auCentime(x.hausseSurJanvier * 100))} de chiffre d'affaires de plus chaque mois. Si la boutique n'y croit pas, c'est le budget qu'il faut réviser, et les achats avec lui : le cas pratique du chapitre le fait.`,
        ];
      },
    },
    {
      id: "le-laboratoire-du-budget",
      objectifs: [4],
      type: "simulation",
      titre: "Le laboratoire du budget",
      notions: ["payment_terms", "cash_budget", "stock"],
      question: () =>
        "Choisissez le fournisseur du trimestre et le stock voulu au 31 mars, en pourcentage de celui du budget. Les ventes ne changent pas. Le tableau suit les achats, la marge, ce que la caisse paie et le stock d'avril ; le graphique montre la sortie de caisse et la marge selon le stock voulu.",
      leviers: (c) => {
        const x = budgetDuPointDeVente(c);
        return [
          {
            code: "fournisseur",
            libelle: "Fournisseur",
            unite: "",
            min: FOURNISSEURS_DU_LABORATOIRE.faconnier,
            max: FOURNISSEURS_DU_LABORATOIRE["fins-de-serie"],
            pas: 1,
            depart: FOURNISSEURS_DU_LABORATOIRE.faconnier,
            choix: [x.faconnier, x.atelier, x.fins].map((fo) => ({ valeur: FOURNISSEURS_DU_LABORATOIRE[fo.code], libelle: fo.nom })),
          },
          { code: "stock", libelle: "Stock voulu au 31 mars", unite: "% du budget", min: STOCK_DU_LABORATOIRE.min, max: STOCK_DU_LABORATOIRE.max, pas: STOCK_DU_LABORATOIRE.pas, depart: 100 },
        ];
      },
      lecture: (c, p) => {
        const x = budgetDuPointDeVente(c);
        const l = laboratoireDuBudget(x.f, p.fournisseur!, p.stock!);
        const d = laboratoireDuBudget(x.f, FOURNISSEURS_DU_LABORATOIRE.faconnier, 100);
        return [
          { libelle: "Articles à acheter", montant: l.achats, reference: d.achats, unite: "articles" },
          { libelle: "Achats hors taxes", montant: l.achatsHt, reference: d.achatsHt },
          { libelle: "Marge commerciale", montant: l.margeCommerciale, reference: d.margeCommerciale },
          { libelle: "Décaissé dans le trimestre", montant: l.decaisse, reference: d.decaisse },
          { libelle: "Dû au fournisseur au 31 mars", montant: l.detteFournisseur, reference: d.detteFournisseur },
          { libelle: "Stock au 31 mars", montant: l.stockFinal, reference: d.stockFinal, unite: "articles" },
          { libelle: "Marge gagnée sur le façonnier", montant: auCentime(l.margeCommerciale - d.margeCommerciale), reference: 0, effet: true },
          { libelle: "Trésorerie gardée sur le façonnier", montant: auCentime(d.decaisse - l.decaisse), reference: 0, effet: true, fort: true },
        ];
      },
      // La sortie de caisse et la marge selon le stock voulu, face au plafond des paiements.
      graphique: (c) => {
        const x = budgetDuPointDeVente(c);
        const lire = (p: Readonly<Record<string, number>>) => laboratoireDuBudget(x.f, p.fournisseur!, Math.round(p.stock!));
        return {
          levier: "stock",
          courbes: [
            { libelle: "Décaissé dans le trimestre", valeur: (p) => lire(p).decaisse },
            { libelle: "Plafond des paiements", valeur: () => PLAFOND_DES_PAIEMENTS },
            { libelle: "Marge commerciale", valeur: (p) => lire(p).margeCommerciale },
          ],
        };
      },
      defi: (c) => {
        const x = budgetDuPointDeVente(c);
        const lire = (p: Readonly<Record<string, number>>) => laboratoireDuBudget(x.f, p.fournisseur!, p.stock!);
        return {
          consigne: `Gagnez plus de marge qu'avec le façonnier (${eur(x.b.margeCommerciale)}), sans que les achats fassent sortir plus de ${eur(PLAFOND_DES_PAIEMENTS)} de la caisse dans le trimestre.`,
          atteint: (p) => {
            const l = lire(p);
            return l.margeCommerciale > x.b.margeCommerciale && l.decaisse <= PLAFOND_DES_PAIEMENTS;
          },
          indice: (p) => {
            const l = lire(p);
            if (l.margeCommerciale <= x.b.margeCommerciale)
              return p.fournisseur === FOURNISSEURS_DU_LABORATOIRE.faconnier
                ? "Chez le façonnier, la marge ne bouge pas avec le stock voulu : seul un prix d'achat plus bas la fait monter."
                : `À ce prix d'achat, la marge tombe à ${eur(l.margeCommerciale)} : choisissez un fournisseur moins cher.`;
            return `La marge monte à ${eur(l.margeCommerciale)}, mais la caisse paie ${eur(l.decaisse)} dans le trimestre : réduisez ce que vous achetez.`;
          },
          solution: { fournisseur: FOURNISSEURS_DU_LABORATOIRE["fins-de-serie"], stock: 10 },
        };
      },
      explication: (c, p) => {
        const x = budgetDuPointDeVente(c);
        const l = laboratoireDuBudget(x.f, p.fournisseur!, p.stock!);
        return [
          `Le défi est relevé : ${eur(l.margeCommerciale)} de marge, ${eur(auCentime(l.margeCommerciale - x.b.margeCommerciale))} de plus qu'avec le façonnier, et ${eur(l.decaisse)} payés dans le trimestre. Mais il a fallu presque vider la réserve : ${qte(l.stockFinal)} articles au 31 mars, quand 7 jours de ventes en demandent ${qte(x.securite)}.`,
          `Payées comptant, les fins de série font sortir tout de suite ce qu'elles font gagner plus tard ; pour tenir le plafond, il faut acheter moins, donc finir mars sans stock. Sur le graphique, la sortie de caisse monte avec le stock voulu, et la marge ne la suit presque pas : le stock voulu se paie, il ne rapporte qu'une fois vendu.`,
        ];
      },
    },
    {
      id: "la-caisse-ou-la-rupture",
      objectifs: [4],
      type: "choix",
      titre: "La marge, la caisse ou le stock",
      notions: ["payment_terms", "stock"],
      question: (c) => {
        const x = budgetDuPointDeVente(c);
        const l = laboratoireDuBudget(x.f, FOURNISSEURS_DU_LABORATOIRE["fins-de-serie"], 10);
        return `Avec les fins de série et 10 % du stock voulu, la marge monte à ${eur(l.margeCommerciale)} et la caisse ne paie que ${eur(l.decaisse)} : il reste ${qte(l.stockFinal)} articles au 31 mars. Recommandez-vous ce budget à la direction ?`;
      },
      options: (c) => {
        const x = budgetDuPointDeVente(c);
        return [
          {
            texte: "Non : la caisse tient, mais avril commence en rupture, sans réassort possible",
            juste: true,
            retour: `Oui. Les fins de série ne réassortissent pas : avril s'ouvrirait sous le stock de sécurité de ${qte(x.securite)} articles, avec les délais du façonnier (${x.faconnier.delaiDeLivraison} jours) pour se refaire. La marge gagnée en mars se perdrait en ventes manquées.`,
          },
          {
            texte: "Oui : plus de marge, et moins que le plafond décaissé",
            juste: false,
            retour: "Non : c'est juger le budget sur deux lignes en oubliant la troisième. Le stock du 31 mars est celui qui sert avril ; un budget qui finit la réserve vide prépare des ventes manquées.",
          },
          {
            texte: "Oui, en recommandant le complément en avril aux fins de série",
            juste: false,
            retour: "Non : les fins de série sont des lots sans réassort. Ce qui manque en avril ne se recommande pas chez elles.",
          },
        ];
      },
    },
    {
      id: "variante-fins-de-serie",
      objectifs: [1],
      type: "montants",
      titre: "Variante : le stock au coût moyen",
      notions: ["weighted_average_cost", "stock"],
      question: (c) => {
        const x = budgetDuPointDeVente(c);
        const r = x.finsColRond;
        return `Variante : tout le trimestre aux fins de série, au stock voulu du budget. Le pull col rond y coûte ${eur(r.coutDAchat)} ; les ${qte(r.stockInitial)} du 1er janvier, eux, ont été payés ${eur(x.colRond.coutDAchat)} au façonnier. Le stock du 31 mars se valorise au coût moyen pondéré. Calculez ce coût moyen d'un pull col rond, la valeur de son stock au 31 mars, puis le coût d'achat des pulls col rond vendus.`;
      },
      champs: (c) => {
        const x = budgetDuPointDeVente(c);
        const r = x.finsColRond;
        return [
          {
            libelle: "Coût moyen pondéré d'un pull col rond",
            attendu: auCentime(x.coutMoyen),
            tolerance: 0.01,
            calcul: `(${eur(r.valeurInitiale)} + ${qte(r.achats)} × ${eur(r.coutDAchat)}) ÷ (${qte(r.stockInitial)} + ${qte(r.achats)}) = ${eur(r.valeurInitiale + r.achatsHt)} ÷ ${qte(r.stockInitial + r.achats)} = ${quatre(x.coutMoyen)} €`,
          },
          { libelle: "Valeur du stock de pulls col rond au 31 mars", attendu: r.valeurFinale, tolerance: 2, calcul: `${qte(r.stockFinal)} × ${quatre(x.coutMoyen)} € = ${eur(r.valeurFinale)}` },
          {
            libelle: "Coût d'achat des pulls col rond vendus",
            attendu: r.coutDAchatDesVendues,
            tolerance: 2,
            calcul: `${eur(r.valeurInitiale)} + ${eur(r.achatsHt)} − ${eur(r.valeurFinale)} = ${eur(r.coutDAchatDesVendues)}`,
          },
        ];
      },
      explication: (c) => {
        const x = budgetDuPointDeVente(c);
        return [
          `Le stock du 1er janvier, acheté plus cher, se mêle aux achats moins chers : le coût moyen d'un pull col rond, ${qte(auCentime(x.coutMoyen))} €, est entre les deux. Sur toute la gamme, la marge du trimestre aux fins de série monte à ${eur(x.fins.margeCommerciale)}, ${eur(auCentime(x.fins.margeCommerciale - x.b.margeCommerciale))} de plus qu'au façonnier.`,
          `Le gain ne vient pas tout entier du trimestre : une part reste dans le stock du 31 mars, valorisé moins cher, et ne sera marge qu'en avril.`,
        ];
      },
    },
    {
      id: "si-on-se-trompe",
      objectifs: [4],
      type: "choix",
      titre: "Si la prévision était trop haute",
      notions: ["stock", "cash_budget"],
      question: (c) => `Le trimestre se termine : ${ficheDe(c).entreprise} a vendu moins que prévu, mais a acheté ce que le budget disait. Que se passe-t-il ?`,
      options: () => [
        {
          texte: "Le stock final est plus gros que voulu, et l'argent des achats dort en réserve",
          juste: true,
          retour: "Oui. Les achats ont été faits pour des ventes qui ne sont pas venues : ce qui n'est pas vendu reste en stock. Il est payé, ou le sera, mais ne rapporte rien tant qu'il n'est pas vendu. D'où l'intérêt de suivre le budget mois par mois, et d'ajuster les commandes.",
        },
        {
          texte: "Rien : le budget a été respecté puisque les achats sont conformes",
          juste: false,
          retour: "Le budget n'est pas respecté : les ventes sont sous la prévision. Un budget se suit dans l'écart entre le prévu et le réalisé, ligne par ligne.",
        },
        {
          texte: "La marge commerciale est plus forte, puisqu'on a acheté plus",
          juste: false,
          retour: "La marge se calcule sur ce qui est vendu : moins de ventes, c'est moins de marge, quel que soit le volume acheté.",
        },
      ],
    },
    {
      id: "synthese",
      type: "lecture",
      titre: "Ce qu'il faut retenir",
      notions: ["cash_budget", "payment_terms", "stock"],
      tableau: (c) => tableauDesTroisBudgets(budgetDuPointDeVente(c)),
      texte: (c) => {
        const x = budgetDuPointDeVente(c);
        return [
          `Le budget du trimestre part des ventes prévues, ${eur(x.b.ventesHt)} hors taxes. Les achats en découlent par les stocks : ventes + stock voulu − stock initial, ${qte(x.b.achats)} articles pour ${eur(x.b.achatsHt)}. La marge, ${eur(x.b.margeCommerciale)}, se calcule sur ce qui est vendu ; la TVA à reverser, ${eur(x.tvaDue)}, n'est ni une charge ni un produit.`,
          `Ce que la caisse paie dépend du fournisseur : 1 − délai ÷ 90 des achats. Le moins cher, payé comptant, fait sortir ${eur(x.fins.decaisse)} dans le trimestre ; le façonnier à 45 jours, ${eur(x.faconnier.decaisse)}. Un budget arbitre entre la marge, la trésorerie et le stock d'avril, et un objectif mensuel se rattrape sur le trimestre.`,
          "Au niveau de l'examen, vous savez établir le budget des ventes, des achats et de la TVA, calculer la marge budgétée, chiffrer les décaissements selon le délai de paiement, remonter d'une sortie de caisse au stock voulu, valoriser un stock au coût moyen pondéré et fixer l'objectif des mois qui restent.",
          "Dans l'arène, les chiffres de votre entreprise seront différents : la notion, elle, est la même.",
        ];
      },
      repere: () =>
        "Achats = ventes prévues + stock final voulu − stock initial. Marge commerciale = ventes HT − (stock initial + achats − stock final). TVA à reverser = TVA collectée − TVA déductible. Décaissé dans le trimestre = achats TTC × (1 − délai ÷ jours du trimestre).",
    },
  ],
};
