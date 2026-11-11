import { arrondi2 as auCentime, eur, nombreAuCentieme, pct } from "../../../pedagogy/cours/deux-decimales";
import type { Cas } from "../cas";
import { seuilDuPointDeVente } from "../monde/boutique";
import { HYPOTHESES_DE_L_EXERCICE, IMPOT_SUR_LES_SOCIETES, PROVISION_POUR_LITIGE, articlesPourLEbeDeNMoins2, compteDeResultat, ecartDEbe } from "../monde/comptes-de-la-boutique";
import { BOUTIQUES_DU_COURS, type FicheDeLaBoutique } from "../monde/maille-et-co";
import type { Chapitre, TableauDeDonnees } from "../types";

/**
 * CHAPITRE : LE COMPTE DE RÉSULTAT DE LA BOUTIQUE (BTS MCO, bloc 3, palier 4).
 *
 * LE CHAPITRE JOUE DANS LE MONDE DU COURS : la boutique MAILLE & CO (monde/maille-et-co.ts : les
 * articles vendus chaque année, janvier N − 1, les charges du mois, l'équipe) et ses comptes
 * (monde/comptes-de-la-boutique.ts : les exercices N − 2 et N − 1, leurs soldes intermédiaires de gestion
 * et leur capacité d'autofinancement).
 *
 * L'objet : passer de l'année de la boutique à son compte de résultat, puis aux soldes intermédiaires de
 * gestion (marge commerciale, valeur ajoutée, EBE, résultat d'exploitation, résultat courant, résultat
 * net) et à la CAF ; calculer les taux de rentabilité ; puis comparer N − 1 à N − 2. La boutique a vendu
 * plus, et pourtant son EBE recule : l'élève remonte aux causes (les remises, la paie, le loyer) et
 * choisit l'action de remédiation qui rattrape le plus.
 *
 * Le piège central : un chiffre d'affaires qui monte ne dit pas que la boutique gagne plus. L'EBE juge
 * l'exploitation avant les amortissements, les provisions, les intérêts et l'impôt ; le résultat net
 * mêle tout, dont une provision qui ne se reproduira pas.
 *
 * LES TROIS TEMPS :
 *   · guidé : intro, du-mois-a-l-annee, ranger-les-charges, le-compte (la formule au repère) ;
 *   · l'expérience avant la formule : predire-l-ebe puis les-articles-qui-manquent (un curseur sur les
 *     articles de N − 1, l'EBE face à celui de N − 2) avant les-causes ; le laboratoire de la remédiation
 *     (le prix moyen et la paie ; le graphique de l'EBE selon le prix) ;
 *   · autonome : les-soldes, la-caf-et-les-taux, les-causes ;
 *   · expert : ebe-ou-resultat-net (une critique), le-prix-de-n-moins-2 (à rebours), la variante des
 *     remises ; puis la décision et la synthèse.
 *
 * LES CALCULS SE FONT À DEUX CHIFFRES APRÈS LA VIRGULE (décision du propriétaire, 10 novembre 2026,
 * pedagogy/cours/deux-decimales.ts) : le taux de marge commerciale, le taux d'EBE et la rentabilité
 * nette se donnent à deux décimales, à un centième près (au dixième, avant).
 */

export const ENTREPRISES_DU_COMPTE_DE_RESULTAT: readonly string[] = ["boutique"];

export const POURQUOI_LA_BOUTIQUE_RESULTAT =
  "la simulation du cours suit un seul point de vente, la boutique MAILLE & CO, dont elle connaît les ventes, les charges et l'équipe de chaque année : son compte de résultat se joue chez elle, quelle que soit votre entreprise.";

/** Les bornes du curseur des articles de N − 1. */
export const ARTICLES_DU_CURSEUR = { min: 25_000, max: 28_000 } as const;

/** Le laboratoire de la remédiation : le prix moyen (€) et une baisse de la paie (€ par an). */
export const PRIX_DU_LABORATOIRE = { min: 55, max: 58, pas: 0.25 } as const;
export const BAISSE_DU_LABORATOIRE = { min: 0, max: 12_000, pas: 1_000 } as const;
/** Le défi : retrouver l'EBE de N − 2 en remontant le prix moyen de 0,50 € au plus. */
export const HAUSSE_DE_PRIX_DU_DEFI = 0.5;
export const SOLUTION_DU_LABORATOIRE = { prix: 56.5, baisse: 1_000 } as const;

const qte = nombreAuCentieme;
const signe = (x: number) => (x >= 0 ? `+ ${eur(x)}` : `− ${eur(-x)}`);

export const ficheDuCompte = (c: Pick<Cas, "code">): FicheDeLaBoutique => {
  const f = BOUTIQUES_DU_COURS[c.code];
  if (!f) throw new Error(`Pas de boutique du cours pour ${c.code}`);
  return f;
};

/** Tout ce que le chapitre et son cas demandent. */
export function exerciceDeLaBoutique(c: Pick<Cas, "code">) {
  const f = ficheDuCompte(c);
  const n1 = compteDeResultat(f, "N-1");
  const n2 = compteDeResultat(f, "N-2");
  const ecart = ecartDEbe(f);
  const manque = articlesPourLEbeDeNMoins2(f);
  const janvier = seuilDuPointDeVente(f);
  // La variante : le prix moyen de N − 2 retrouvé en N − 1 (les remises de N − 2).
  const sansLesRemises = compteDeResultat(f, "N-1", { prixMoyen: n2.prixMoyen });
  // L'erreur classique : juger l'année au résultat net, qui mêle la provision.
  const resultatSansLaProvision = auCentime(n1.resultatCourant + PROVISION_POUR_LITIGE);
  return {
    f,
    n1,
    n2,
    ecart,
    manque,
    janvier,
    sansLesRemises,
    resultatSansLaProvision,
    evolutionDuChiffreDAffaires: auCentime((n1.ventes / n2.ventes - 1) * 100),
    evolutionDeLEbe: auCentime((n1.ebe / n2.ebe - 1) * 100),
  };
}

export type ExerciceDeLaBoutique = ReturnType<typeof exerciceDeLaBoutique>;

/** L'année N − 1, en données : le document de départ. */
export function tableauDeLAnnee(c: Pick<Cas, "code">): TableauDeDonnees {
  const x = exerciceDeLaBoutique(c);
  const d = x.n1;
  return {
    titre: `${x.f.entreprise} · l'exercice N − 1, du 1er janvier au 31 décembre`,
    colonnes: ["N − 1"],
    lignes: [
      { libelle: "Articles vendus", valeurs: [qte(d.articles)] },
      { libelle: "Prix moyen d'un article, hors taxes", valeurs: [eur(d.prixMoyen)] },
      { libelle: "Coût d'achat moyen d'un article", valeurs: [eur(d.coutDAchatMoyen)] },
      { libelle: "Emballages, étiquettes, frais de carte, par article", valeurs: [eur(d.autresCoutsVariables)] },
      { libelle: "Stock au 1er janvier, au 31 décembre", valeurs: [`${eur(d.stockInitial)}, ${eur(d.stockFinal)}`] },
      { libelle: "Loyer et charges locatives", valeurs: [eur(d.loyer)] },
      { libelle: "Taxes locales (comprises dans les frais du loyer)", valeurs: [eur(d.taxesLocales)] },
      { libelle: "Publicité, entretien", valeurs: [`${eur(d.publicite)}, ${eur(d.entretien)}`] },
      { libelle: "Salaires bruts, cotisations patronales", valeurs: [`${eur(d.salaires)}, ${eur(d.chargesSociales)}`] },
      { libelle: "Amortissement du rayonnage, provision pour litige", valeurs: [`${eur(d.amortissements)}, ${eur(d.provisions)}`] },
      { libelle: "Intérêts de l'emprunt", valeurs: [eur(d.interets)] },
    ],
  };
}

/** Les soldes des deux exercices, pour comparer. */
export function tableauDesSoldes(c: Pick<Cas, "code">): TableauDeDonnees {
  const x = exerciceDeLaBoutique(c);
  const l = (libelle: string, a: number, b: number) => ({ libelle, valeurs: [eur(a), eur(b)] });
  return {
    titre: `${x.f.entreprise} · les soldes intermédiaires de gestion`,
    colonnes: ["N − 2", "N − 1"],
    lignes: [
      l("Chiffre d'affaires", x.n2.ventes, x.n1.ventes),
      l("Marge commerciale", x.n2.margeCommerciale, x.n1.margeCommerciale),
      l("Valeur ajoutée", x.n2.valeurAjoutee, x.n1.valeurAjoutee),
      l("Excédent brut d'exploitation", x.n2.ebe, x.n1.ebe),
      l("Résultat d'exploitation", x.n2.resultatDExploitation, x.n1.resultatDExploitation),
      l("Résultat net", x.n2.resultatNet, x.n1.resultatNet),
      l("Capacité d'autofinancement", x.n2.caf, x.n1.caf),
    ],
  };
}

const CATEGORIES_DES_CHARGES = [
  { code: "externes", libelle: "Consommations en provenance des tiers" },
  { code: "impots", libelle: "Impôts et taxes" },
  { code: "personnel", libelle: "Charges de personnel" },
  { code: "dotations", libelle: "Dotations aux amortissements et provisions" },
  { code: "financieres", libelle: "Charges financières" },
] as const;

export const LE_COMPTE_DE_RESULTAT_DE_LA_BOUTIQUE: Chapitre = {
  code: "le-compte-de-resultat-de-la-boutique",
  parcours: "mco",
  palier: 4,
  blocs: ["BTS MCO Bloc 3 · Assurer la gestion opérationnelle"],
  titre: "Le compte de résultat de la boutique",
  accroche:
    "La boutique a vendu plus que l'an passé, et pourtant elle gagne moins. Du mois à l'exercice, du compte de résultat aux soldes intermédiaires de gestion : où la rentabilité s'est-elle perdue, et que faire pour la retrouver ?",
  objectifs: [
    "Établir le compte de résultat d'un exercice à partir de l'activité de la boutique",
    "Calculer les soldes intermédiaires de gestion et la capacité d'autofinancement",
    "Calculer et lire les taux de rentabilité de l'exploitation",
    "Expliquer l'écart d'EBE entre deux exercices, cause par cause",
    "Choisir une action de remédiation et en chiffrer l'effet",
  ],
  libre: false,
  prerequis: ["seuil-du-point-de-vente", "taux-de-marque-et-coefficient"],
  ensuite: ["le-bilan-et-le-bfr-de-la-boutique", "soldes-intermediaires-de-gestion"],
  entreprises: { codes: ENTREPRISES_DU_COMPTE_DE_RESULTAT, pourquoi: POURQUOI_LA_BOUTIQUE_RESULTAT },
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Du mois à l'exercice",
      notions: ["income_statement"],
      tableau: tableauDeLAnnee,
      texte: (c) => {
        const x = exerciceDeLaBoutique(c);
        return [
          `Ce chapitre se joue dans la simulation du cours, à la boutique ${x.f.entreprise}. Le seuil de rentabilité regardait un mois, janvier N, et le point de vente : ${eur(x.janvier.resultat)} de résultat. L'expert-comptable, lui, arrête les comptes de l'exercice : l'année N − 1, close le 31 décembre.`,
          `L'année se lit dans la fiche : ${qte(x.n1.articles)} articles vendus, au prix moyen de janvier N − 1 ; les charges du mois et la paie de l'équipe, douze fois. S'y ajoutent ce que le mois ne disait pas : une provision pour un litige avec un comité, les intérêts de l'emprunt et l'impôt sur les sociétés.`,
          `Ce que la simulation suppose. Un article coûte en moyenne ${eur(HYPOTHESES_DE_L_EXERCICE.coutDAchatMoyen)} à l'achat, plus ${eur(HYPOTHESES_DE_L_EXERCICE.autresCoutsVariables)} d'emballages, d'étiquettes et de frais de carte. Les frais du loyer comprennent ${eur(HYPOTHESES_DE_L_EXERCICE.taxesLocalesDuMois)} de taxes locales par mois ; l'impôt est de ${pct(IMPOT_SUR_LES_SOCIETES.tauxReduit * 100)} jusqu'à ${eur(IMPOT_SUR_LES_SOCIETES.plafondDuTauxReduit)} de bénéfice, ${pct(IMPOT_SUR_LES_SOCIETES.tauxNormal * 100)} au-delà.`,
        ];
      },
      repere: () => "Coût d'achat des marchandises vendues = achats + stock initial − stock final. Marge commerciale = ventes de marchandises − coût d'achat des marchandises vendues.",
    },
    {
      id: "du-mois-a-l-annee",
      objectifs: [0],
      type: "montants",
      titre: "Les ventes et la marge de l'année",
      notions: ["income_statement", "margin_rates"],
      tableau: tableauDeLAnnee,
      question: () => "Calculez les ventes de marchandises de N − 1 (articles × prix moyen), le coût d'achat des marchandises vendues (articles × coût moyen), les achats de l'année (ce coût, plus le stock final, moins le stock initial), puis la marge commerciale.",
      champs: (c) => {
        const d = exerciceDeLaBoutique(c).n1;
        return [
          { libelle: "Ventes de marchandises", attendu: d.ventes, calcul: `${qte(d.articles)} × ${eur(d.prixMoyen)} = ${eur(d.ventes)}` },
          { libelle: "Coût d'achat des marchandises vendues", attendu: d.coutDAchatDesVendues, calcul: `${qte(d.articles)} × ${eur(d.coutDAchatMoyen)} = ${eur(d.coutDAchatDesVendues)}` },
          { libelle: "Achats de marchandises", attendu: d.achats, calcul: `${eur(d.coutDAchatDesVendues)} + ${eur(d.stockFinal)} − ${eur(d.stockInitial)} = ${eur(d.achats)}` },
          { libelle: "Marge commerciale", attendu: d.margeCommerciale, calcul: `${eur(d.ventes)} − ${eur(d.coutDAchatDesVendues)} = ${eur(d.margeCommerciale)}` },
        ];
      },
      explication: (c) => {
        const d = exerciceDeLaBoutique(c).n1;
        return [
          `La boutique a acheté ${eur(d.achats)} de marchandises ; le stock a grossi de ${eur(-d.variationDeStock)} : au compte de résultat, la variation de stock corrige les achats pour ne garder que ce qui a été vendu. La marge commerciale, ${eur(d.margeCommerciale)}, fait ${pct(d.tauxDeMarqueMoyen * 100)} des ventes : le taux de marque moyen de l'année.`,
        ];
      },
    },
    {
      id: "ranger-les-charges",
      objectifs: [0],
      type: "tri",
      titre: "Ranger les charges",
      notions: ["income_statement"],
      question: () =>
        "Rangez chaque charge de N − 1 dans sa rubrique du compte de résultat. Ce que la boutique achète à d'autres entreprises est une consommation en provenance des tiers ; ce qu'elle doit à l'État ou aux collectivités, un impôt ou une taxe ; ce qu'elle doit à ses salariés, une charge de personnel.",
      categories: CATEGORIES_DES_CHARGES,
      elements: (c) => {
        const d = exerciceDeLaBoutique(c).n1;
        return [
          { libelle: "Loyer et charges locatives", montant: d.loyer, categorie: "externes", pourquoi: "Le bailleur loue un local : un service acheté à un tiers." },
          { libelle: "Emballages, étiquettes, frais de carte", montant: d.autresCoutsVariables, categorie: "externes", pourquoi: "Des fournitures et un service bancaire achetés à des tiers." },
          { libelle: "Publicité", montant: d.publicite, categorie: "externes", pourquoi: "Un service acheté à une régie ou à un imprimeur." },
          { libelle: "Taxes locales", montant: d.taxesLocales, categorie: "impots", pourquoi: "Dues à la commune : un impôt, même payé avec le loyer." },
          { libelle: "Salaires bruts", montant: d.salaires, categorie: "personnel", pourquoi: "La rémunération des salariés." },
          { libelle: "Cotisations patronales", montant: d.chargesSociales, categorie: "personnel", pourquoi: "Versées aux organismes sociaux pour les salariés : une charge de personnel." },
          { libelle: "Amortissement du rayonnage", montant: d.amortissements, categorie: "dotations", pourquoi: "L'usure d'une immobilisation, répartie sur sa durée." },
          { libelle: "Provision pour le litige du comité", montant: d.provisions, categorie: "dotations", pourquoi: "Une perte probable, née dans l'année, constatée avant d'être payée." },
          { libelle: "Intérêts de l'emprunt", montant: d.interets, categorie: "financieres", pourquoi: "Le prix de l'argent emprunté : une charge financière." },
        ];
      },
      explication: () => [
        "Ce rangement fait les soldes : la valeur ajoutée retire les consommations des tiers, l'EBE les impôts et le personnel, le résultat d'exploitation les dotations, le résultat courant les charges financières.",
      ],
    },
    {
      id: "le-compte",
      objectifs: [0],
      type: "montants",
      titre: "Le compte de résultat",
      notions: ["income_statement"],
      tableau: tableauDeLAnnee,
      question: () =>
        "Calculez les charges d'exploitation de N − 1 (achats, variation de stock, consommations des tiers, taxes, personnel, dotations), le résultat d'exploitation (ventes moins ces charges), le résultat courant avant impôt (moins les intérêts), l'impôt sur les sociétés, puis le résultat net.",
      champs: (c) => {
        const d = exerciceDeLaBoutique(c).n1;
        const i = IMPOT_SUR_LES_SOCIETES;
        return [
          {
            libelle: "Charges d'exploitation",
            attendu: d.chargesDExploitation,
            calcul: `${eur(d.achats)} ${signe(d.variationDeStock)} + ${eur(d.consommationsExternes)} + ${eur(d.taxesLocales)} + ${eur(d.personnel)} + ${eur(d.dotations)} = ${eur(d.chargesDExploitation)}`,
          },
          { libelle: "Résultat d'exploitation", attendu: d.resultatDExploitation, calcul: `${eur(d.ventes)} − ${eur(d.chargesDExploitation)} = ${eur(d.resultatDExploitation)}` },
          { libelle: "Résultat courant avant impôt", attendu: d.resultatCourant, calcul: `${eur(d.resultatDExploitation)} − ${eur(d.interets)} = ${eur(d.resultatCourant)}` },
          {
            libelle: "Impôt sur les sociétés",
            attendu: d.impot,
            calcul: `${eur(i.plafondDuTauxReduit)} × ${pct(i.tauxReduit * 100)} + (${eur(d.resultatCourant)} − ${eur(i.plafondDuTauxReduit)}) × ${pct(i.tauxNormal * 100)} = ${eur(d.impot)}`,
          },
          { libelle: "Résultat net", attendu: d.resultatNet, calcul: `${eur(d.resultatCourant)} − ${eur(d.impot)} = ${eur(d.resultatNet)}` },
        ];
      },
      explication: (c) => {
        const x = exerciceDeLaBoutique(c);
        return [
          `L'exercice laisse ${eur(x.n1.resultatNet)}, ${pct(x.n1.rentabiliteNette * 100)} des ventes. Douze mois comme janvier n'en auraient laissé que ${eur(auCentime(12 * x.janvier.resultat))} avant intérêts et impôt : l'année vend ${qte(x.n1.articles)} articles, quand janvier en vend ${qte(x.f.gamme.reduce((t, r) => t + r.ventesDuMois, 0))} ; le trimestre de Noël en vend le double.`,
        ];
      },
    },
    {
      id: "les-soldes",
      objectifs: [1],
      type: "montants",
      titre: "Les soldes intermédiaires de gestion",
      notions: ["income_statement", "ebitda_margin"],
      question: () => "Sans formule cette fois. Calculez la valeur ajoutée de N − 1 puis l'excédent brut d'exploitation, à partir de la marge commerciale.",
      champs: (c) => {
        const d = exerciceDeLaBoutique(c).n1;
        return [
          {
            libelle: "Valeur ajoutée",
            attendu: d.valeurAjoutee,
            calcul: `${eur(d.margeCommerciale)} − (${eur(d.autresCoutsVariables)} + ${eur(d.loyer)} + ${eur(d.publicite)} + ${eur(d.entretien)}) = ${eur(d.margeCommerciale)} − ${eur(d.consommationsExternes)} = ${eur(d.valeurAjoutee)}`,
          },
          { libelle: "Excédent brut d'exploitation", attendu: d.ebe, calcul: `${eur(d.valeurAjoutee)} − ${eur(d.taxesLocales)} − ${eur(d.personnel)} = ${eur(d.ebe)}` },
        ];
      },
      explication: (c) => {
        const d = exerciceDeLaBoutique(c).n1;
        return [
          `La valeur ajoutée, ${eur(d.valeurAjoutee)}, est la richesse que la boutique crée par son travail. Elle paie l'État et les salariés ; ce qui reste, l'EBE, ${eur(d.ebe)}, est ce que l'exploitation dégage avant d'amortir, de provisionner, de payer les intérêts et l'impôt. C'est l'indicateur du manager : il ne dépend ni du financement ni des choix comptables.`,
        ];
      },
    },
    {
      id: "la-caf-et-les-taux",
      objectifs: [1, 2],
      type: "montants",
      titre: "La CAF et les taux de rentabilité",
      notions: ["ebitda_margin", "profitability_vs_return"],
      question: () =>
        "Calculez la capacité d'autofinancement de N − 1 (le résultat net plus les dotations, qui ne se décaissent pas), puis, en pourcentage du chiffre d'affaires et à deux décimales, le taux de marge commerciale, le taux d'EBE et la rentabilité nette.",
      champs: (c) => {
        const d = exerciceDeLaBoutique(c).n1;
        return [
          { libelle: "Capacité d'autofinancement", attendu: d.caf, calcul: `${eur(d.resultatNet)} + ${eur(d.dotations)} = ${eur(d.caf)}` },
          { libelle: "Taux de marge commerciale (%)", attendu: auCentime(d.tauxDeMarqueMoyen * 100), calcul: `${eur(d.margeCommerciale)} ÷ ${eur(d.ventes)} × 100 = ${pct(d.tauxDeMarqueMoyen * 100)}` },
          { libelle: "Taux d'EBE (%)", attendu: auCentime(d.tauxDEbe * 100), calcul: `${eur(d.ebe)} ÷ ${eur(d.ventes)} × 100 = ${pct(d.tauxDEbe * 100)}` },
          { libelle: "Rentabilité nette (%)", attendu: auCentime(d.rentabiliteNette * 100), calcul: `${eur(d.resultatNet)} ÷ ${eur(d.ventes)} × 100 = ${pct(d.rentabiliteNette * 100)}` },
        ];
      },
      explication: (c) => {
        const d = exerciceDeLaBoutique(c).n1;
        return [
          `La CAF, ${eur(d.caf)}, est ce que l'exercice laisse pour rembourser l'emprunt, investir ou verser des dividendes. Chaque euro de ventes laisse ${pct(d.tauxDEbe * 100)} d'EBE et ${pct(d.rentabiliteNette * 100)} de résultat net : c'est en suivant ces taux, plus que le chiffre d'affaires, qu'on voit une rentabilité se dégrader.`,
        ];
      },
    },
    {
      id: "predire-l-ebe",
      objectifs: [3],
      type: "choix",
      titre: "Pariez sur l'EBE",
      notions: ["ebitda_margin"],
      tableau: tableauDesSoldes,
      question: (c) => {
        const x = exerciceDeLaBoutique(c);
        return `Avant de calculer, pariez. De N − 2 à N − 1, la boutique a vendu ${qte(x.n1.articles - x.n2.articles)} articles de plus, et son chiffre d'affaires a pris ${pct(x.evolutionDuChiffreDAffaires)}. Son EBE…`;
      },
      options: (c) => {
        const x = exerciceDeLaBoutique(c);
        const voir = "Le tableau des soldes le dit ; l'étape suivante cherche ce qu'il aurait fallu vendre de plus.";
        return [
          { texte: "A reculé, malgré les ventes", juste: x.n1.ebe < x.n2.ebe, retour: `Bon pari : ${pct(x.evolutionDeLEbe)}. ${voir}` },
          { texte: "A progressé comme le chiffre d'affaires", juste: false, retour: `Non : ${pct(x.evolutionDeLEbe)}. ${voir}` },
          { texte: "A progressé plus vite que le chiffre d'affaires", juste: x.n1.ebe / x.n2.ebe > x.n1.ventes / x.n2.ventes, retour: `Non : ${pct(x.evolutionDeLEbe)}. ${voir}` },
        ];
      },
    },
    {
      id: "les-articles-qui-manquent",
      objectifs: [3],
      type: "curseur",
      titre: "Ce qu'il aurait fallu vendre",
      notions: ["ebitda_margin", "contribution_margin"],
      question: (c) => {
        const x = exerciceDeLaBoutique(c);
        return `Gardez le prix moyen et les charges de N − 1, et faites varier les articles vendus, de ${qte(ARTICLES_DU_CURSEUR.min)} à ${qte(ARTICLES_DU_CURSEUR.max)}. Une droite donne l'EBE (chaque article laisse ${eur(x.n1.margeParArticle)} après ses coûts variables), l'autre l'EBE de N − 2, ${eur(x.n2.ebe)}. Placez le curseur sur le plus petit nombre d'articles qui le retrouve, puis validez.`;
      },
      grandeur: () => ({ libelle: "Articles vendus en N − 1", unite: "articles" }),
      cible: (c) => ({ attendu: exerciceDeLaBoutique(c).manque.articles, min: ARTICLES_DU_CURSEUR.min, max: ARTICLES_DU_CURSEUR.max }),
      zones: ["L'EBE de N − 2 est retrouvé", "L'EBE reste sous celui de N − 2"],
      rates: () => ({
        dessous: "À ce volume, l'EBE reste sous celui de N − 2 : montez.",
        dessus: "L'EBE de N − 2 est déjà retrouvé avec moins d'articles : cherchez le plus petit nombre.",
      }),
      montrer: "Montrer le volume qui retrouve l'EBE",
      lecture: (c, q) => {
        const x = exerciceDeLaBoutique(c);
        const ebe = compteDeResultat(x.f, "N-1", { articles: q }).ebe;
        return [
          { libelle: "EBE de N − 1 à ce volume", montant: ebe },
          { libelle: "EBE de N − 2", montant: x.n2.ebe },
          { libelle: "Écart avec N − 2", montant: auCentime(ebe - x.n2.ebe), fort: true },
        ];
      },
      droites: (c) => {
        const x = exerciceDeLaBoutique(c);
        return { produit: (q) => q * x.manque.margeParArticle - x.manque.fixes, cout: () => x.n2.ebe, libelles: ["EBE de N − 1", "EBE de N − 2"] };
      },
      explication: (c) => {
        const x = exerciceDeLaBoutique(c);
        return [
          `Il aurait fallu ${qte(x.manque.articles)} articles, ${qte(x.manque.articles - x.n1.articles)} de plus que vendus. La boutique a pourtant vendu ${qte(x.n1.articles - x.n2.articles)} articles de plus qu'en N − 2 : ce n'est pas le volume qui manque, c'est ce que chaque article laisse, et ce que coûtent le loyer et l'équipe.`,
        ];
      },
    },
    {
      id: "les-causes",
      objectifs: [3],
      type: "montants",
      titre: "L'écart d'EBE, cause par cause",
      notions: ["ebitda_margin", "markdown"],
      tableau: tableauDesSoldes,
      question: (c) => {
        const x = exerciceDeLaBoutique(c);
        return `Sans formule cette fois. Expliquez l'écart d'EBE de N − 2 à N − 1. Calculez l'effet des articles en plus (à la marge commerciale d'un article de N − 2) et l'effet du prix moyen plus bas (sur les articles de N − 1), puis l'écart des autres coûts variables, du loyer et du personnel. Chaque effet est négatif s'il fait baisser l'EBE ; leur somme est l'écart, ${eur(x.ecart.ecart)}.`;
      },
      champs: (c) => {
        const x = exerciceDeLaBoutique(c);
        const e = x.ecart;
        return [
          { libelle: "Effet du volume", attendu: e.effetVolume, calcul: `(${qte(x.n1.articles)} − ${qte(x.n2.articles)}) × (${eur(x.n2.prixMoyen)} − ${eur(x.n2.coutDAchatMoyen)}) = ${eur(e.effetVolume)}` },
          { libelle: "Effet du prix moyen", attendu: e.effetPrix, calcul: `(${eur(x.n1.prixMoyen)} − ${eur(x.n2.prixMoyen)}) × ${qte(x.n1.articles)} = ${eur(e.effetPrix)}` },
          { libelle: "Effet des autres coûts variables", attendu: e.effetAutresCoutsVariables, calcul: `−(${eur(x.n1.autresCoutsVariables)} − ${eur(x.n2.autresCoutsVariables)}) = ${eur(e.effetAutresCoutsVariables)}` },
          { libelle: "Effet du loyer", attendu: e.effetLoyer, calcul: `−(${eur(x.n1.loyer)} − ${eur(x.n2.loyer)}) = ${eur(e.effetLoyer)}` },
          { libelle: "Effet du personnel", attendu: e.effetPersonnel, calcul: `−(${eur(x.n1.personnel)} − ${eur(x.n2.personnel)}) = ${eur(e.effetPersonnel)}` },
        ];
      },
      explication: (c) => {
        const e = exerciceDeLaBoutique(c).ecart;
        return [
          `${eur(e.effetVolume)} ${signe(e.effetPrix)} ${signe(e.effetAutresCoutsVariables)} ${signe(e.effetLoyer)} ${signe(e.effetPersonnel)} = ${eur(e.ecart)}. Les remises (l'effet du prix moyen) mangent presque tout ce que le volume apporte ; la paie et le loyer font le reste.`,
        ];
      },
    },
    {
      id: "le-laboratoire-de-la-remediation",
      objectifs: [4],
      type: "simulation",
      titre: "Le laboratoire de la remédiation",
      notions: ["ebitda_margin", "markdown"],
      question: () =>
        "Rejouez N − 1 : remontez le prix moyen (moins de remises) et baissez la paie de l'année (moins d'heures, une embauche reportée). Le tableau suit l'EBE, son taux et l'écart avec N − 2 ; le graphique trace l'EBE selon le prix moyen. Puis relevez le défi.",
      leviers: () => [
        { code: "prix", libelle: "Prix moyen d'un article", unite: "€", min: PRIX_DU_LABORATOIRE.min, max: PRIX_DU_LABORATOIRE.max, pas: PRIX_DU_LABORATOIRE.pas, depart: 56 },
        { code: "baisse", libelle: "Baisse de la paie de l'année", unite: "€", min: BAISSE_DU_LABORATOIRE.min, max: BAISSE_DU_LABORATOIRE.max, pas: BAISSE_DU_LABORATOIRE.pas, depart: 0 },
      ],
      lecture: (c, p) => {
        const x = exerciceDeLaBoutique(c);
        const l = compteDeResultat(x.f, "N-1", { prixMoyen: p.prix!, baisseDeLaPaie: p.baisse! });
        return [
          { libelle: "Chiffre d'affaires", montant: l.ventes, reference: x.n1.ventes },
          { libelle: "Marge commerciale", montant: l.margeCommerciale, reference: x.n1.margeCommerciale },
          { libelle: "Charges de personnel", montant: l.personnel, reference: x.n1.personnel },
          { libelle: "Excédent brut d'exploitation", montant: l.ebe, reference: x.n1.ebe, fort: true },
          { libelle: "Taux d'EBE", montant: auCentime(l.tauxDEbe * 100), reference: auCentime(x.n1.tauxDEbe * 100), unite: "%" },
          { libelle: "Écart avec l'EBE de N − 2", montant: auCentime(l.ebe - x.n2.ebe), reference: auCentime(x.n1.ebe - x.n2.ebe), effet: true },
        ];
      },
      graphique: (c) => {
        const x = exerciceDeLaBoutique(c);
        return {
          levier: "prix",
          courbes: [
            { libelle: "EBE de N − 1 rejoué", valeur: (p) => compteDeResultat(x.f, "N-1", { prixMoyen: p.prix!, baisseDeLaPaie: p.baisse! }).ebe },
            { libelle: "EBE de N − 2", valeur: () => x.n2.ebe },
          ],
        };
      },
      defi: (c) => {
        const x = exerciceDeLaBoutique(c);
        const ebe = (p: Readonly<Record<string, number>>) => compteDeResultat(x.f, "N-1", { prixMoyen: p.prix!, baisseDeLaPaie: p.baisse! }).ebe;
        const prixMax = x.n1.prixMoyen + HAUSSE_DE_PRIX_DU_DEFI;
        return {
          consigne: `Retrouvez au moins l'EBE de N − 2 sans remonter le prix moyen de plus de ${eur(HAUSSE_DE_PRIX_DU_DEFI)}.`,
          atteint: (p) => p.prix! <= prixMax + 1e-9 && ebe(p) >= x.n2.ebe,
          indice: (p) => {
            if (p.prix! > prixMax + 1e-9) return `Le défi limite le prix moyen à ${eur(prixMax)} : les clientes partiraient chez le concurrent. Revenez à ${eur(prixMax)} au plus et jouez aussi sur la paie.`;
            return `Il manque ${eur(auCentime(x.n2.ebe - ebe(p)))} d'EBE. Chaque 25 centimes de prix moyen rapportent ${eur(auCentime(0.25 * x.n1.articles))} ; chaque millier d'euros de paie en moins, autant d'EBE.`;
          },
          solution: SOLUTION_DU_LABORATOIRE,
        };
      },
      montrer: "Montrer une remédiation qui retrouve l'EBE",
      explication: (c, p) => {
        const x = exerciceDeLaBoutique(c);
        const l = compteDeResultat(x.f, "N-1", { prixMoyen: p.prix!, baisseDeLaPaie: p.baisse! });
        return [
          `À ${eur(p.prix!)} de prix moyen et ${eur(p.baisse!)} de paie en moins, l'EBE serait de ${eur(l.ebe)}, ${pct(l.tauxDEbe * 100)} des ventes. Un euro de prix moyen vaut ${eur(x.n1.articles)} d'EBE sur l'année, plus que toute la hausse du loyer : c'est le levier le plus puissant, à condition que les clientes suivent.`,
        ];
      },
    },
    {
      id: "sans-les-remises",
      objectifs: [4],
      type: "montants",
      titre: "Variante : revenir aux remises de N − 2",
      notions: ["ebitda_margin", "markdown"],
      question: (c) => {
        const x = exerciceDeLaBoutique(c);
        return `La gérante propose de revenir à la politique de remises de N − 2 : un prix moyen de ${eur(x.n2.prixMoyen)}, aux mêmes ventes en articles que N − 1. Calculez la marge commerciale, l'EBE, puis le taux d'EBE (en %, à deux décimales).`;
      },
      champs: (c) => {
        const x = exerciceDeLaBoutique(c);
        const v = x.sansLesRemises;
        return [
          { libelle: "Marge commerciale", attendu: v.margeCommerciale, calcul: `${qte(v.articles)} × (${eur(v.prixMoyen)} − ${eur(v.coutDAchatMoyen)}) = ${eur(v.margeCommerciale)}` },
          { libelle: "Excédent brut d'exploitation", attendu: v.ebe, calcul: `${eur(x.n1.ebe)} + (${eur(v.prixMoyen)} − ${eur(x.n1.prixMoyen)}) × ${qte(v.articles)} = ${eur(v.ebe)}` },
          { libelle: "Taux d'EBE (%)", attendu: auCentime(v.tauxDEbe * 100), calcul: `${eur(v.ebe)} ÷ ${eur(v.ventes)} × 100 = ${pct(v.tauxDEbe * 100)}` },
        ];
      },
      explication: (c) => {
        const x = exerciceDeLaBoutique(c);
        return [
          `Sans les remises de N − 1, l'EBE aurait été de ${eur(x.sansLesRemises.ebe)}, au-dessus de N − 2 (${eur(x.n2.ebe)}). Encore faut-il que les ventes tiennent sans elles : une partie des articles en plus est venue avec les remises.`,
        ];
      },
    },
    {
      id: "ebe-ou-resultat-net",
      objectifs: [2],
      type: "choix",
      titre: "Juger l'année sur quel solde ?",
      notions: ["ebitda_margin", "income_statement"],
      question: (c) => {
        const x = exerciceDeLaBoutique(c);
        return `Un associé lit seulement le résultat net : ${eur(x.n2.resultatNet)} en N − 2, ${eur(x.n1.resultatNet)} en N − 1. « La gestion a fait perdre ${eur(auCentime(x.n2.resultatNet - x.n1.resultatNet))}. » Qu'en dites-vous ?`;
      },
      options: (c) => {
        const x = exerciceDeLaBoutique(c);
        return [
          {
            texte: "Le résultat net mêle la provision, les intérêts et l'impôt : la gestion se juge sur l'EBE",
            juste: true,
            retour: `Oui. La provision de ${eur(PROVISION_POUR_LITIGE)} est un risque de l'année qui ne se reproduira pas ; les intérêts baissent avec l'emprunt ; l'impôt suit le bénéfice. L'EBE isole ce que le manager pilote : il a perdu ${eur(-x.ecart.ecart)}, pas ce que dit le résultat net.`,
          },
          { texte: "Il a raison : seul compte ce qui reste aux associés", juste: false, retour: "Ce qui reste aux associés compte pour eux ; mais pour juger l'exploitation, il faut un solde qui ne mêle ni le financement, ni l'impôt, ni un risque exceptionnel." },
          { texte: "Il se trompe : il fallait regarder le chiffre d'affaires", juste: false, retour: `Non : le chiffre d'affaires a pris ${pct(x.evolutionDuChiffreDAffaires)} quand l'EBE reculait. Il ne dit rien de ce que la boutique gagne.` },
        ];
      },
    },
    {
      id: "le-prix-de-n-moins-2",
      objectifs: [1],
      type: "montants",
      titre: "Retrouver le prix à rebours",
      notions: ["income_statement", "margin_rates"],
      question: (c) => {
        const x = exerciceDeLaBoutique(c);
        return `À rebours. Pour N − 2, l'expert-comptable ne donne que la marge commerciale, ${eur(x.n2.margeCommerciale)}, les ${qte(x.n2.articles)} articles vendus et le coût moyen d'un article, ${eur(x.n2.coutDAchatMoyen)}. Retrouvez la marge d'un article, le prix moyen, puis le chiffre d'affaires de N − 2.`;
      },
      champs: (c) => {
        const x = exerciceDeLaBoutique(c);
        const parArticle = auCentime(x.n2.margeCommerciale / x.n2.articles);
        return [
          { libelle: "Marge commerciale d'un article", attendu: parArticle, calcul: `${eur(x.n2.margeCommerciale)} ÷ ${qte(x.n2.articles)} = ${eur(parArticle)}` },
          { libelle: "Prix moyen d'un article", attendu: x.n2.prixMoyen, calcul: `${eur(parArticle)} + ${eur(x.n2.coutDAchatMoyen)} = ${eur(x.n2.prixMoyen)}` },
          { libelle: "Chiffre d'affaires de N − 2", attendu: x.n2.ventes, calcul: `${qte(x.n2.articles)} × ${eur(x.n2.prixMoyen)} = ${eur(x.n2.ventes)}` },
        ];
      },
      explication: (c) => {
        const x = exerciceDeLaBoutique(c);
        return [`En N − 2, un article se vendait ${eur(x.n2.prixMoyen)} en moyenne, ${eur(auCentime(x.n2.prixMoyen - x.n1.prixMoyen))} de plus qu'en N − 1 : c'est la trace des remises, que le chiffre d'affaires en hausse cachait.`];
      },
    },
    {
      id: "decider",
      objectifs: [4],
      type: "choix",
      titre: "Quelle action retenir ?",
      notions: ["ebitda_margin", "markdown"],
      question: () => "La gérante doit choisir une première action pour N. Laquelle retenez-vous ?",
      options: (c) => {
        const x = exerciceDeLaBoutique(c);
        const e = x.ecart;
        return [
          {
            texte: `Réduire les remises : elles ont coûté ${eur(-e.effetPrix)} d'EBE`,
            juste: true,
            retour: `Oui. C'est la première cause, devant la paie (${eur(-e.effetPersonnel)}) et le loyer (${eur(-e.effetLoyer)}), et le seul levier qui ne dépend pas d'un bail ou d'un contrat de travail. Revenir au prix moyen de N − 2 porterait l'EBE à ${eur(x.sansLesRemises.ebe)} si les ventes tiennent : la promotion doit se chiffrer avant d'être lancée.`,
          },
          { texte: `Baisser la paie : elle a pris ${eur(-e.effetPersonnel)}`, juste: false, retour: `Elle pèse, mais moins que les remises (${eur(-e.effetPrix)}), et une équipe réduite vend moins : c'est le levier le plus risqué pour le chiffre d'affaires.` },
          { texte: "Vendre plus : le volume a déjà rapporté", juste: false, retour: `Le volume a rapporté ${eur(e.effetVolume)}, mais à coups de remises. Il faudrait ${qte(x.manque.articles)} articles au prix de N − 1 pour retrouver l'EBE de N − 2.` },
          { texte: `Renégocier le loyer, qui a pris ${eur(-e.effetLoyer)}`, juste: false, retour: "Le bail fixe le loyer jusqu'à sa prochaine révision : la boutique n'y peut presque rien cette année, et c'est la plus petite des trois causes." },
        ];
      },
    },
    {
      id: "synthese",
      type: "lecture",
      titre: "Ce qu'il faut retenir",
      notions: ["income_statement", "ebitda_margin"],
      tableau: tableauDesSoldes,
      texte: (c) => {
        const x = exerciceDeLaBoutique(c);
        const e = x.ecart;
        return [
          "Le compte de résultat range les produits et les charges de l'exercice ; les soldes intermédiaires de gestion le lisent par étages. La marge commerciale est ce que la revente laisse ; la valeur ajoutée vient après les consommations des tiers, l'EBE après les impôts et le personnel, le résultat d'exploitation après les dotations. La CAF ajoute au résultat net les dotations, qui ne se décaissent pas.",
          `${x.f.entreprise} a vendu plus en N − 1, et son EBE a reculé de ${eur(-e.ecart)} : ${eur(e.effetVolume)} de volume, ${eur(e.effetPrix)} de remises, ${eur(e.effetPersonnel)} de paie, ${eur(e.effetLoyer)} de loyer, ${eur(e.effetAutresCoutsVariables)} d'emballages et de frais. Le taux d'EBE est passé de ${pct(x.n2.tauxDEbe * 100)} à ${pct(x.n1.tauxDEbe * 100)}.`,
          "Au niveau de l'examen, vous savez établir un compte de résultat, en tirer les soldes et la CAF, calculer les taux de rentabilité, expliquer un écart d'EBE cause par cause et chiffrer une action de remédiation.",
          "Dans l'arène, les chiffres de votre entreprise seront différents : la notion, elle, est la même.",
        ];
      },
      repere: () =>
        "Valeur ajoutée = marge commerciale − consommations des tiers. EBE = valeur ajoutée − impôts et taxes − personnel. Résultat d'exploitation = EBE − dotations. CAF = résultat net + dotations. Taux d'EBE = EBE ÷ chiffre d'affaires.",
    },
  ],
};
