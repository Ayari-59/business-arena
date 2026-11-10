import { arrondi2, eur, nombreAuCentieme, pct as pourcent } from "../../../pedagogy/cours/deux-decimales";
import type { Cas } from "../cas";
import { T_DE_LA_TABLE, arrondi, lectureDeLaTable, quantileNormal } from "../monde/loi-normale";
import { GESTION_DU_COURS, type FicheDeGestion } from "../monde/nova-gestion";
import {
  CONFIANCE_DE_LA_FOURCHETTE,
  CONFIANCE_DU_DIRIGEANT,
  CONFIANCE_DU_MOIS_REDOUTE,
  MOIS_DU_TRIMESTRE,
  OBJECTIF_DU_DIRIGEANT,
  cumulDeMois,
  ecartTypeDeLaFourchette,
  ecartTypeTenable,
  fourchetteDesVentes,
  moisAleatoireDeLaFiche,
  probabiliteDuResultat,
  resultatDepasse,
  seuilAleatoire,
  type MoisAleatoire,
} from "../monde/seuil-aleatoire";
import type { Chapitre, TableauDeDonnees } from "../types";

/**
 * CHAPITRE : LE SEUIL DE PROFITABILITÉ EN AVENIR ALÉATOIRE (contrôle de gestion, palier 4 ; DCG UE 11,
 * programme 2025, 2.1 « Calculer et interpréter des seuils et des marges en avenir certain et
 * aléatoire » ; BUT GEA, « en solutionnant des problèmes de gestion en avenir certain et aléatoire »).
 *
 * LE CHAPITRE JOUE DANS LE MONDE DU COURS (src/config/cours/monde), pas dans l'arène : le mois de
 * janvier de NOVA est celui du seuil de rentabilité (monde/nova-gestion.ts), et la loi normale se
 * calcule par monde/loi-normale.ts et monde/seuil-aleatoire.ts. Une évolution du moteur ne change rien.
 *
 * L'objet : le seuil de janvier est connu, 1 484,90 enceintes ; mais les ventes de janvier ne le sont
 * pas. Elles suivent une loi normale d'espérance 1 590 enceintes et d'écart-type 150. L'élève centre et
 * réduit, lit la table, calcule la probabilité d'atteindre le seuil de profitabilité (le mot du
 * programme 2025) et celle d'une perte, puis les lois du résultat et du chiffre d'affaires. Il mesure
 * ce que la dispersion fait au risque, cumule 3 mois indépendants, retrouve à rebours l'écart-type
 * d'une fourchette, et juge les limites du modèle.
 *
 * Ce que le chapitre ne fait pas : la loi binomiale et la loi de Poisson, que le programme 2025 exclut.
 *
 * LES TROIS TEMPS (demande du propriétaire, octobre 2026 : le niveau d'arrivée est celui du DCG) :
 *   · guidé : intro, centrer-et-reduire, lire-l-ecart-type, la-probabilite-du-seuil (la formule est
 *     au repère ou dans la question, qui nomme les chiffres) ;
 *   · autonome : la-loi-du-resultat, la-loi-du-chiffre-d-affaires, l-objectif-du-dirigeant (ni
 *     formule ni chiffres à prendre ; le calcul de la correction montre le chemin) ;
 *   · l'expérience avant la formule (prédire, manipuler, constater, formaliser) : predire-le-seuil
 *     avant la-probabilite-du-seuil ; predire-la-dispersion puis l-ecart-type-au-curseur (le résultat
 *     dépassé 9 mois sur 10 selon l'écart-type des ventes, une droite face au résultat nul) avant
 *     l-ecart-type-a-rebours ;
 *   · le laboratoire : le-laboratoire-du-risque (prix, coût variable, charges fixes, espérance et
 *     écart-type des ventes ; être en profit 9 mois sur 10 ; le graphique des probabilités de profit et
 *     de perte selon l'écart-type, qui ne sont pas des droites) ;
 *   · expert : l-ecart-type-a-rebours, le-trimestre et lire-le-trimestre (la somme de mois
 *     indépendants), d-ou-vient-l-ecart-type (l'écart-type d'une fourchette, à rebours), le-mois-redoute
 *     (le résultat dépassé 95 fois sur 100), les-limites ; puis la synthèse.
 *
 * LES CALCULS SE FONT À DEUX CHIFFRES APRÈS LA VIRGULE (décision du propriétaire, 10 novembre 2026,
 * pedagogy/cours/deux-decimales.ts) : les variables centrées réduites, les t de la table et les
 * probabilités sont des coefficients ; une probabilité lue à la table se donne au dix-millième, à
 * un dix-millième près (au deux-millième, avant) ; les écarts-types et les résultats redoutés
 * attendent le centime (à 1, 5 ou 20 € près, avant), l'espérance et l'écart-type des ventes sont
 * des grandeurs au centième.
 */

/** Le seuil probabilisé se calcule sur le mois de janvier de NOVA, la fiche de gestion du monde du cours. */
export const ENTREPRISES_DU_SEUIL_ALEATOIRE: readonly string[] = ["nova"];

/** Le chiffre d'affaires que le dirigeant redoute de manquer (hypothèse du cours) : 90 000 € dans le mois. */
export const CHIFFRE_D_AFFAIRES_REDOUTE = 90_000;

/** L'écart-type du pari sur la dispersion : le double de celui de la fiche. */
export const FACTEUR_DU_PARI = 2;

/** Les bornes du curseur de l'écart-type des ventes, en enceintes. */
export const ECART_TYPE_DU_CURSEUR = { min: 40, max: 200 } as const;

/** Les leviers du laboratoire : leurs bornes et leur pas. */
export const LEVIERS_DU_RISQUE = {
  prix: { min: 50, max: 68, pas: 0.5 },
  coutVariable: { min: 32, max: 44, pas: 0.5 },
  chargesFixes: { min: 25_000, max: 36_000, pas: 1 },
  moyenne: { min: 1_400, max: 1_800, pas: 10 },
  ecartType: { min: 50, max: 250, pas: 5 },
} as const;

const qte = nombreAuCentieme;
/** Une probabilité, à quatre décimales, comme la table. */
const pr = (p: number) => (p + 0).toLocaleString("fr-FR", { minimumFractionDigits: 4, maximumFractionDigits: 4 });
/** Une variable centrée réduite, à deux décimales. */
const tt = (t: number) => (t + 0).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 3 }).replace(/^-/, "−");
const pct = (p: number) => pourcent(p * 100);
const auCentime = arrondi2;
/** La probabilité saisie : l'écart d'une lecture de table à l'autre (t arrondi ou interpolé). */
/** Une probabilité lue à la table se donne au dix-millième, comme la table (au deux-millième près, avant). */
const TOLERANCE_D_UNE_PROBABILITE = 0.0001;

/** La fiche de gestion du cours. */
export const ficheDe = (c: Pick<Cas, "code">): FicheDeGestion => GESTION_DU_COURS[c.code]!;

/** Une position du laboratoire, lue en mois aléatoire. */
const moisDeLaPosition = (f: FicheDeGestion, p: Readonly<Record<string, number>>): MoisAleatoire =>
  moisAleatoireDeLaFiche(f, { prix: p.prix!, coutVariableUnitaire: p.coutVariable!, chargesFixes: p.chargesFixes!, moyenne: p.moyenne!, ecartType: p.ecartType! });

/** Le défi du laboratoire : être en profit au moins 9 mois sur 10. */
export const defiDuRisque = (f: FicheDeGestion, p: Readonly<Record<string, number>>) => seuilAleatoire(moisDeLaPosition(f, p)).probabiliteDeProfit >= CONFIANCE_DU_DIRIGEANT - 1e-12;

const calcules = new Map<string, ReturnType<typeof calculerLeChapitre>>();

/** Tout ce que le chapitre demande, calculé une fois par entreprise (la fiche est figée). */
export function aleatoireDuChapitre(c: Pick<Cas, "code">) {
  const deja = calcules.get(c.code);
  if (deja) return deja;
  const x = calculerLeChapitre(c);
  calcules.set(c.code, x);
  return x;
}

function calculerLeChapitre(c: Pick<Cas, "code">) {
  const f = ficheDe(c);
  const d = moisAleatoireDeLaFiche(f);
  const x = seuilAleatoire(d);
  const T = T_DE_LA_TABLE;
  // Centrer et réduire : un écart-type de part et d'autre de l'espérance.
  const bas = d.moyenne - d.ecartType;
  const haut = d.moyenne + d.ecartType;
  const sousBas = lectureDeLaTable(-1);
  const entre = arrondi(lectureDeLaTable(1) - lectureDeLaTable(-1), 4);
  // L'objectif du dirigeant : P(R ≥ 5 000 €).
  const tObjectif = (OBJECTIF_DU_DIRIGEANT - x.resultat.esperance) / x.resultat.ecartType;
  const objectifLu = arrondi(1 - lectureDeLaTable(tObjectif), 4);
  // Le chiffre d'affaires redouté : P(CA < 90 000 €).
  const tCa = (CHIFFRE_D_AFFAIRES_REDOUTE - x.chiffreDAffaires.esperance) / x.chiffreDAffaires.ecartType;
  const caLu = lectureDeLaTable(tCa);
  // Le pari et le curseur : la dispersion.
  const double = seuilAleatoire({ ...d, ecartType: d.ecartType * FACTEUR_DU_PARI });
  const tDuCurseur = quantileNormal(CONFIANCE_DU_DIRIGEANT);
  const ecartTypeMax = Math.floor(ecartTypeTenable(x, CONFIANCE_DU_DIRIGEANT, tDuCurseur) + 1e-9);
  const ecartTypeDuResultatMax = auCentime(x.resultat.esperance / T.unCoteA90);
  const ecartTypeMaxALaTable = auCentime(ecartTypeDuResultatMax / x.marge);
  // Le trimestre, le mois redouté, la fourchette du directeur.
  const trimestre = cumulDeMois(x, MOIS_DU_TRIMESTRE);
  const redoute = resultatDepasse(x, CONFIANCE_DU_MOIS_REDOUTE, T.unCoteA95);
  const fourchette = fourchetteDesVentes(d, T.centreA95);
  const retrouve = ecartTypeDeLaFourchette(fourchette.bas, fourchette.haut, T.centreA95);
  // Le laboratoire : ce que chaque levier seul doit valoir pour être en profit 9 mois sur 10.
  const depart = { prix: d.prix, coutVariable: d.coutVariableUnitaire, chargesFixes: d.chargesFixes, moyenne: d.moyenne, ecartType: d.ecartType };
  const L = LEVIERS_DU_RISQUE;
  const grille = (b: { min: number; max: number; pas: number }) => Array.from({ length: Math.round((b.max - b.min) / b.pas) + 1 }, (_, i) => arrondi(b.min + i * b.pas, 6));
  const passe = (p: Record<string, number>) => defiDuRisque(f, p);
  const seul = {
    prix: Math.min(...grille(L.prix).filter((v) => passe({ ...depart, prix: v }))),
    coutVariable: Math.max(...grille(L.coutVariable).filter((v) => passe({ ...depart, coutVariable: v }))),
    chargesFixes: Math.max(...grille(L.chargesFixes).filter((v) => passe({ ...depart, chargesFixes: v }))),
    moyenne: Math.min(...grille(L.moyenne).filter((v) => passe({ ...depart, moyenne: v }))),
    ecartType: Math.max(...grille(L.ecartType).filter((v) => passe({ ...depart, ecartType: v }))),
  };
  return {
    f,
    m: f.moisDeReference,
    d,
    x,
    T,
    bas,
    haut,
    sousBas,
    entre,
    tObjectif,
    objectifLu,
    objectifExact: probabiliteDuResultat(x, OBJECTIF_DU_DIRIGEANT),
    tCa,
    caLu,
    double,
    tDuCurseur,
    ecartTypeMax,
    ecartTypeDuResultatMax,
    ecartTypeMaxALaTable,
    trimestre,
    redoute,
    fourchette,
    retrouve,
    depart,
    seul,
  };
}

export type AleatoireDuChapitre = ReturnType<typeof aleatoireDuChapitre>;

/** Une position du laboratoire : la loi du résultat et les probabilités. */
export function laboratoireDuRisque(f: FicheDeGestion, p: Readonly<Record<string, number>>) {
  return seuilAleatoire(moisDeLaPosition(f, p));
}

/** Le mois de janvier de NOVA, avec sa demande aléatoire : le document du chapitre. */
export function tableauDuMoisAleatoire(c: Pick<Cas, "code">): TableauDeDonnees {
  const { f, m, d, x } = aleatoireDuChapitre(c);
  return {
    titre: `Le mois de janvier de ${f.entreprise}, en avenir aléatoire`,
    colonnes: ["Donnée"],
    lignes: [
      { libelle: "Prix de vente d'une enceinte, hors taxes", valeurs: [eur(d.prix)] },
      { libelle: "Coût variable d'une enceinte", valeurs: [`${eur(d.coutVariableUnitaire)} (${eur(m.coutVariable.composants)} de composants, ${eur(m.coutVariable.autres)} d'autres coûts)`] },
      { libelle: "Charges fixes du mois", valeurs: [eur(d.chargesFixes)] },
      { libelle: "Seuil de profitabilité, en enceintes", valeurs: [qte(x.seuil!)] },
      { libelle: "Espérance des ventes du mois", valeurs: [`${qte(d.moyenne)} enceintes`] },
      { libelle: "Écart-type des ventes du mois", valeurs: [`${qte(d.ecartType)} enceintes`] },
    ],
  };
}

export const LE_SEUIL_EN_AVENIR_ALEATOIRE: Chapitre = {
  code: "le-seuil-en-avenir-aleatoire",
  parcours: "controle-de-gestion",
  palier: 4,
  blocs: ["DCG UE11 · Contrôle de gestion", "BUT GEA · Concevoir des outils de contrôle de gestion"],
  titre: "Le seuil de profitabilité en avenir aléatoire",
  accroche:
    "Les ventes de janvier ne sont pas certaines : elles suivent une loi normale. Quelle chance NOVA a-t-elle d'atteindre son seuil de profitabilité, quel risque de perdre de l'argent, et que fait la dispersion des ventes à ce risque ?",
  objectifs: [
    "Déduire de la loi des ventes l'espérance et l'écart-type du chiffre d'affaires et du résultat",
    "Calculer avec la loi normale la probabilité d'atteindre le seuil de profitabilité, de subir une perte ou d'atteindre un objectif",
    "Mesurer l'effet de la dispersion des ventes et du cumul de plusieurs mois sur le risque",
    "Retrouver à rebours un écart-type ou un résultat à partir d'une probabilité",
    "Juger les intérêts et les limites du seuil probabilisé",
  ],
  libre: false,
  prerequis: ["seuil-de-rentabilite", "les-leviers-du-seuil"],
  ensuite: ["piloter-la-qualite"],
  entreprises: {
    codes: ENTREPRISES_DU_SEUIL_ALEATOIRE,
    pourquoi: "le seuil probabilisé se calcule ici sur le mois de janvier de NOVA, dans la simulation du cours, avec ses prix, ses coûts et la loi de ses ventes ; la méthode vaut pour toute entreprise.",
  },
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Un seuil connu, des ventes incertaines",
      notions: ["breakeven", "safety_margin"],
      tableau: tableauDuMoisAleatoire,
      texte: (c) => {
        const { f, d, x, fourchette } = aleatoireDuChapitre(c);
        return [
          `Ce chapitre se joue dans la simulation du cours, chez ${f.entreprise}, sur le mois de janvier du chapitre « Le seuil de rentabilité ». Le programme du DCG parle de seuil de profitabilité : c'est le même seuil, ${qte(x.seuil!)} enceintes, les charges fixes divisées par la marge d'une enceinte, ${eur(x.marge)}.`,
          `Ce chapitre-là supposait les ventes certaines : ${qte(d.moyenne)} enceintes. Elles ne le sont pas. Le directeur commercial a relevé les janviers passés : 95 fois sur 100, les ventes tombent entre ${qte(fourchette.bas)} et ${qte(fourchette.haut)} enceintes.`,
          `Le cours modélise donc les ventes X par une loi normale : son espérance E(X), la vente moyenne, vaut ${qte(d.moyenne)} enceintes ; son écart-type σ(X), la dispersion autour de cette moyenne, vaut ${qte(d.ecartType)}. Le prix, les coûts et les charges fixes restent certains.`,
          "La question du dirigeant change de nature : non plus « combien gagnerai-je ? », mais « quelle chance ai-je de gagner de l'argent, et quel risque de perdre ? ».",
        ];
      },
      repere: () =>
        "Si X suit la loi normale N(m ; σ), alors T = (X − m) ÷ σ suit la loi normale centrée réduite N(0 ; 1), dont la table donne Π(t) = P(T ≤ t). Pour t négatif : Π(−t) = 1 − Π(t).",
    },
    {
      id: "centrer-et-reduire",
      objectifs: [1],
      type: "montants",
      titre: "Centrer, réduire, lire la table",
      question: (c) => {
        const { d, bas, haut } = aleatoireDuChapitre(c);
        return `Les ventes X suivent N(${qte(d.moyenne)} ; ${qte(d.ecartType)}). Calculez la variable centrée réduite de ${qte(bas)} enceintes, t = (${qte(bas)} − ${qte(d.moyenne)}) ÷ ${qte(d.ecartType)}, puis lisez à la table la probabilité de vendre moins de ${qte(bas)} enceintes, et celle de vendre entre ${qte(bas)} et ${qte(haut)}.`;
      },
      champs: (c) => {
        const { d, bas, haut, sousBas, entre } = aleatoireDuChapitre(c);
        return [
          { libelle: `Variable centrée réduite de ${qte(bas)} enceintes`, nature: "coefficient", attendu: -1, calcul: `(${qte(bas)} − ${qte(d.moyenne)}) ÷ ${qte(d.ecartType)} = ${tt(-1)}` },
          {
            libelle: `P(X < ${qte(bas)})`,
            nature: "coefficient",
            attendu: sousBas,
            tolerance: TOLERANCE_D_UNE_PROBABILITE,
            calcul: `Π(${tt(-1)}) = 1 − Π(1,00) = 1 − ${pr(lectureDeLaTable(1))} = ${pr(sousBas)}`,
          },
          {
            libelle: `P(${qte(bas)} < X < ${qte(haut)})`,
            nature: "coefficient",
            attendu: entre,
            tolerance: TOLERANCE_D_UNE_PROBABILITE,
            calcul: `Π(1,00) − Π(${tt(-1)}) = ${pr(lectureDeLaTable(1))} − ${pr(sousBas)} = ${pr(entre)}`,
          },
        ];
      },
      explication: (c) => {
        const { d, bas, haut, sousBas } = aleatoireDuChapitre(c);
        return [
          `Une variable continue n'a pas de probabilité en un point : P(X < ${qte(bas)}) et P(X ≤ ${qte(bas)}) sont égales. La courbe de la loi normale est symétrique autour de ${qte(d.moyenne)} : il y a autant de chances de vendre plus de ${qte(haut)} que moins de ${qte(bas)}, ${pr(sousBas)}.`,
        ];
      },
    },
    {
      id: "lire-l-ecart-type",
      objectifs: [0],
      type: "choix",
      titre: "Ce que dit l'écart-type",
      question: (c) => {
        const { d } = aleatoireDuChapitre(c);
        return `L'écart-type des ventes de janvier vaut ${qte(d.ecartType)} enceintes. Qu'est-ce que ce chiffre dit au dirigeant ?`;
      },
      options: (c) => {
        const { d, bas, haut, entre } = aleatoireDuChapitre(c);
        return [
          {
            texte: `2 janviers sur 3, les ventes restent entre ${qte(bas)} et ${qte(haut)}`,
            juste: true,
            retour: `Oui : ${pct(entre)} des janviers tombent à moins d'un écart-type de l'espérance. Plus l'écart-type est grand, plus les ventes s'éloignent de ${qte(d.moyenne)} : il mesure le risque.`,
          },
          {
            texte: `Les ventes ne s'écartent jamais de plus de ${qte(d.ecartType)} enceintes de ${qte(d.moyenne)}`,
            juste: false,
            retour: `Non : 1 janvier sur 3 environ sort de cet intervalle, et la loi normale n'a pas de borne. Seuls les écarts de plus de 3 écarts-types deviennent très rares.`,
          },
          {
            texte: `Les ventes changent de ${qte(d.ecartType)} enceintes d'un mois à l'autre, à chaque fois`,
            juste: false,
            retour: "Non : l'écart-type mesure la dispersion autour de l'espérance, pas l'écart d'un mois au suivant. Un mois peut tomber pile sur l'espérance.",
          },
        ];
      },
    },
    {
      id: "predire-le-seuil",
      objectifs: [1],
      type: "choix",
      titre: "Pariez sur le seuil",
      notions: ["breakeven"],
      question: (c) => {
        const { d, x } = aleatoireDuChapitre(c);
        return `Avant de calculer, pariez. Le seuil de profitabilité est de ${qte(x.seuil!)} enceintes ; les ventes attendues, ${qte(d.moyenne)}, avec un écart-type de ${qte(d.ecartType)}. La probabilité que janvier atteigne le seuil est…`;
      },
      options: (c) => {
        const { x } = aleatoireDuChapitre(c);
        const p = x.probabiliteDeProfit;
        const voir = "L'étape suivante la calcule.";
        return [
          { texte: "Entre 60 et 90 %", juste: p >= 0.6 && p < 0.9, retour: `Bon pari. ${voir}` },
          { texte: "Plus de 90 % : le seuil est sous les ventes attendues", juste: p >= 0.9, retour: `Pari à vérifier : sous les ventes attendues, mais de moins d'un écart-type. ${voir}` },
          { texte: "Moins de 60 % : le risque est grand", juste: p < 0.6, retour: `Pari à vérifier. ${voir}` },
        ];
      },
    },
    {
      id: "la-probabilite-du-seuil",
      objectifs: [1],
      type: "montants",
      titre: "La probabilité d'atteindre le seuil",
      notions: ["breakeven", "safety_margin"],
      question: (c) => {
        const { d, x } = aleatoireDuChapitre(c);
        return `Atteindre le seuil, c'est vendre au moins ${qte(x.seuil!)} enceintes. Calculez la variable centrée réduite du seuil, t = (${qte(x.seuil!)} − ${qte(d.moyenne)}) ÷ ${qte(d.ecartType)}, arrondie au centième, la probabilité d'atteindre le seuil, P(X ≥ seuil) = 1 − Π(t), puis la probabilité de perdre de l'argent en janvier.`;
      },
      champs: (c) => {
        const { d, x } = aleatoireDuChapitre(c);
        return [
          { libelle: "Variable centrée réduite du seuil", nature: "coefficient", attendu: x.tLu, tolerance: 0.01, calcul: `(${qte(x.seuil!)} − ${qte(d.moyenne)}) ÷ ${qte(d.ecartType)} = ${tt(x.tLu)}` },
          {
            libelle: "Probabilité d'atteindre le seuil",
            nature: "coefficient",
            attendu: x.profitLu,
            tolerance: TOLERANCE_D_UNE_PROBABILITE,
            calcul: `P(X ≥ ${qte(x.seuil!)}) = 1 − Π(${tt(x.tLu)}) = Π(${tt(-x.tLu)}) = ${pr(x.profitLu)}`,
          },
          { libelle: "Probabilité d'une perte", nature: "coefficient", attendu: x.perteLue, tolerance: TOLERANCE_D_UNE_PROBABILITE, calcul: `1 − ${pr(x.profitLu)} = ${pr(x.perteLue)}` },
        ];
      },
      explication: (c) => {
        const { f, x } = aleatoireDuChapitre(c);
        return [
          `${f.entreprise} a ${pct(x.profitLu)} de chances d'atteindre son seuil en janvier, et ${pct(x.perteLue)} de risque de perdre de l'argent : à peu près 1 janvier sur ${qte(Math.round(1 / x.perteLue))}. En avenir certain, l'indice de sécurité disait seulement que les ventes dépassaient le seuil.`,
          "La probabilité ne dit pas si le risque est acceptable : c'est au dirigeant d'en juger, selon ce qu'une perte lui coûterait.",
        ];
      },
    },
    {
      id: "la-loi-du-resultat",
      objectifs: [0, 1],
      type: "montants",
      titre: "La loi du résultat",
      notions: ["contribution_margin", "breakeven"],
      question: (c) => {
        const { x } = aleatoireDuChapitre(c);
        return `À vous, sans formule cette fois : le résultat du mois s'écrit R = ${eur(x.marge)} × X − ${eur(x.chargesFixes)}. Calculez son espérance, son écart-type, puis la probabilité d'une perte, P(R < 0), lue sur la loi du résultat.`;
      },
      champs: (c) => {
        const { d, x } = aleatoireDuChapitre(c);
        const tR = arrondi(-x.resultat.esperance / x.resultat.ecartType, 2);
        return [
          { libelle: "Espérance du résultat", attendu: x.resultat.esperance, calcul: `E(R) = ${eur(x.marge)} × ${qte(d.moyenne)} − ${eur(x.chargesFixes)} = ${eur(x.resultat.esperance)}` },
          { libelle: "Écart-type du résultat", attendu: x.resultat.ecartType, calcul: `σ(R) = ${eur(x.marge)} × ${qte(d.ecartType)} = ${eur(x.resultat.ecartType)} ; la constante ne disperse rien` },
          {
            libelle: "Probabilité d'une perte, P(R < 0)",
            nature: "coefficient",
            attendu: lectureDeLaTable(tR),
            tolerance: TOLERANCE_D_UNE_PROBABILITE,
            calcul: `t = (0 − ${eur(x.resultat.esperance)}) ÷ ${eur(x.resultat.ecartType)} = ${tt(tR)} ; Π(${tt(tR)}) = ${pr(lectureDeLaTable(tR))}`,
          },
        ];
      },
      explication: (c) => {
        const { x } = aleatoireDuChapitre(c);
        return [
          `C'est la même probabilité que sur la loi des ventes : un résultat négatif et des ventes sous le seuil sont le même événement. E(aX + b) = a E(X) + b ; σ(aX + b) = |a| σ(X) : les charges fixes déplacent la loi, la marge l'étire.`,
          `Le résultat attendu, ${eur(x.resultat.esperance)}, est celui de janvier en avenir certain ; mais 2 mois sur 3, le résultat s'en écarte de moins de ${eur(x.resultat.ecartType)}, et parfois de bien plus.`,
        ];
      },
    },
    {
      id: "la-loi-du-chiffre-d-affaires",
      objectifs: [0, 1],
      type: "montants",
      titre: "La loi du chiffre d'affaires",
      question: (c) => {
        const { x } = aleatoireDuChapitre(c);
        return `Sans formule : le chiffre d'affaires du mois s'écrit CA = ${eur(x.prix)} × X. Calculez son espérance, son écart-type, puis la probabilité qu'il tombe sous ${eur(CHIFFRE_D_AFFAIRES_REDOUTE)}, le chiffre que le dirigeant redoute.`;
      },
      champs: (c) => {
        const { d, x, tCa, caLu } = aleatoireDuChapitre(c);
        return [
          { libelle: "Espérance du chiffre d'affaires", attendu: x.chiffreDAffaires.esperance, calcul: `${eur(x.prix)} × ${qte(d.moyenne)} = ${eur(x.chiffreDAffaires.esperance)}` },
          { libelle: "Écart-type du chiffre d'affaires", attendu: x.chiffreDAffaires.ecartType, calcul: `${eur(x.prix)} × ${qte(d.ecartType)} = ${eur(x.chiffreDAffaires.ecartType)}` },
          {
            libelle: `P(CA < ${eur(CHIFFRE_D_AFFAIRES_REDOUTE)})`,
            nature: "coefficient",
            attendu: caLu,
            tolerance: TOLERANCE_D_UNE_PROBABILITE,
            calcul: `t = (${eur(CHIFFRE_D_AFFAIRES_REDOUTE)} − ${eur(x.chiffreDAffaires.esperance)}) ÷ ${eur(x.chiffreDAffaires.ecartType)} = ${tt(arrondi(tCa, 2))} ; Π(${tt(arrondi(tCa, 2))}) = ${pr(caLu)}`,
          },
        ];
      },
      explication: (c) => {
        const { x } = aleatoireDuChapitre(c);
        return [
          `Atteindre le seuil en valeur, ${eur(x.seuilValeur!)}, a la même probabilité qu'en quantité, ${pr(x.profitLu)} : (${eur(x.seuilValeur!)} − ${eur(x.chiffreDAffaires.esperance)}) ÷ ${eur(x.chiffreDAffaires.ecartType)} donne le même t. Ventes, chiffre d'affaires ou résultat : à l'examen, une seule approche suffit.`,
        ];
      },
    },
    {
      id: "l-objectif-du-dirigeant",
      objectifs: [1],
      type: "montants",
      titre: "L'objectif du dirigeant",
      question: (c) => {
        const { f } = aleatoireDuChapitre(c);
        return `Le dirigeant de ${f.entreprise} voudrait gagner au moins ${eur(OBJECTIF_DU_DIRIGEANT)} en janvier. Sans formule ni chiffres donnés : calculez la variable centrée réduite de cet objectif sur la loi du résultat, puis la probabilité de l'atteindre.`;
      },
      champs: (c) => {
        const { x, tObjectif, objectifLu } = aleatoireDuChapitre(c);
        const t = arrondi(tObjectif, 2);
        return [
          {
            libelle: "Variable centrée réduite de l'objectif",
            nature: "coefficient",
            attendu: t,
            tolerance: 0.01,
            calcul: `(${eur(OBJECTIF_DU_DIRIGEANT)} − ${eur(x.resultat.esperance)}) ÷ ${eur(x.resultat.ecartType)} = ${tt(t)}`,
          },
          { libelle: "Probabilité d'atteindre l'objectif", nature: "coefficient", attendu: objectifLu, tolerance: TOLERANCE_D_UNE_PROBABILITE, calcul: `P(R ≥ ${eur(OBJECTIF_DU_DIRIGEANT)}) = 1 − Π(${tt(t)}) = 1 − ${pr(lectureDeLaTable(t))} = ${pr(objectifLu)}` },
        ];
      },
      explication: (c) => {
        const { objectifLu, x } = aleatoireDuChapitre(c);
        const ventes = auCentime((OBJECTIF_DU_DIRIGEANT + x.chargesFixes) / x.marge);
        return [
          `À peu près 1 janvier sur ${qte(Math.round(1 / objectifLu))} atteint l'objectif : ${pct(objectifLu)}. Il faudrait vendre ${qte(ventes)} enceintes, loin au-dessus de l'espérance. Un objectif se fixe aussi avec sa probabilité : celui-ci est un pari, pas un budget.`,
        ];
      },
    },
    {
      id: "predire-la-dispersion",
      objectifs: [2],
      type: "choix",
      titre: "Pariez sur la dispersion",
      question: (c) => {
        const { d } = aleatoireDuChapitre(c);
        return `Avant de manipuler, pariez. Supposez que les ventes de janvier deviennent plus incertaines : un écart-type de ${qte(d.ecartType * FACTEUR_DU_PARI)} enceintes au lieu de ${qte(d.ecartType)}, pour la même espérance, ${qte(d.moyenne)}. La probabilité d'atteindre le seuil…`;
      },
      options: (c) => {
        const { x, double } = aleatoireDuChapitre(c);
        const voir = "Faites varier l'écart-type à l'étape suivante : le curseur montre ce qu'il fait au résultat.";
        return [
          { texte: "Baisse, vers 1 sur 2", juste: double.probabiliteDeProfit < x.probabiliteDeProfit, retour: `Bon pari. ${voir}` },
          { texte: "Ne bouge pas : l'espérance est la même", juste: double.probabiliteDeProfit === x.probabiliteDeProfit, retour: `Pari à vérifier. ${voir}` },
          { texte: "Monte : de très bons mois deviennent possibles", juste: double.probabiliteDeProfit > x.probabiliteDeProfit, retour: `Pari à vérifier. ${voir}` },
        ];
      },
    },
    {
      id: "l-ecart-type-au-curseur",
      objectifs: [2],
      type: "curseur",
      titre: "L'écart-type, au curseur",
      notions: ["breakeven", "operating_leverage"],
      question: (c) => {
        const { d } = aleatoireDuChapitre(c);
        return `Le dirigeant veut être en profit au moins 9 mois sur 10. Faites varier l'écart-type des ventes, de ${qte(ECART_TYPE_DU_CURSEUR.min)} à ${qte(ECART_TYPE_DU_CURSEUR.max)} enceintes (aujourd'hui : ${qte(d.ecartType)}). Une droite donne le résultat que janvier dépasse 9 fois sur 10, l'autre le résultat nul. Placez le curseur sur le plus grand écart-type qui garde ce résultat positif, puis validez.`;
      },
      grandeur: () => ({ libelle: "Écart-type des ventes du mois", unite: "enceintes" }),
      sens: "plus-grande",
      cible: (c) => ({ nature: "grandeur", attendu: aleatoireDuChapitre(c).ecartTypeMax, min: ECART_TYPE_DU_CURSEUR.min, max: ECART_TYPE_DU_CURSEUR.max }),
      zones: ["En profit 9 mois sur 10 au moins", "En perte plus d'1 mois sur 10"],
      rates: () => ({
        dessous: "Les ventes peuvent être plus dispersées sans dépasser 1 mois de perte sur 10 : cherchez le plus grand écart-type.",
        dessus: "À cet écart-type, le résultat dépassé 9 fois sur 10 est déjà une perte.",
      }),
      montrer: "Montrer la limite",
      lecture: (c, s) => {
        const x = aleatoireDuChapitre(c);
        const r = seuilAleatoire({ ...x.d, ecartType: s });
        return [
          { libelle: "Espérance du résultat", montant: r.resultat.esperance },
          { libelle: "Écart-type du résultat", montant: r.resultat.ecartType },
          { libelle: "Résultat dépassé 9 mois sur 10", montant: resultatDepasse(r, CONFIANCE_DU_DIRIGEANT, x.tDuCurseur), fort: true },
        ];
      },
      droites: (c) => {
        const x = aleatoireDuChapitre(c);
        return {
          produit: (s) => x.x.resultat.esperance - x.tDuCurseur * x.x.marge * s,
          cout: () => 0,
          libelles: ["Résultat dépassé 9 mois sur 10", "Le résultat nul"],
        };
      },
      explication: (c) => {
        const x = aleatoireDuChapitre(c);
        return [
          `Le résultat dépassé 9 fois sur 10 vaut E(R) − ${tt(x.T.unCoteA90)} × σ(R) : il baisse en ligne droite quand l'écart-type monte, de ${eur(auCentime(x.T.unCoteA90 * x.x.marge))} par enceinte d'écart-type. À ${qte(x.ecartTypeMax)} enceintes, il est encore positif ; au-delà, janvier perd de l'argent plus d'1 fois sur 10.`,
          `Avec ${qte(x.d.ecartType)} enceintes, ${x.f.entreprise} est loin de cette sécurité. L'espérance du résultat, elle, n'a pas bougé : la dispersion ne change pas ce qu'on gagne en moyenne, elle change le risque.`,
        ];
      },
    },
    {
      id: "l-ecart-type-a-rebours",
      objectifs: [3],
      type: "montants",
      titre: "L'écart-type tenable, à rebours",
      question: (c) => {
        const x = aleatoireDuChapitre(c);
        return `Sans formule : retrouvez le t de la table tel que Π(t) = ${qte(CONFIANCE_DU_DIRIGEANT)}. Calculez ensuite le plus grand écart-type du résultat qui laisse janvier en profit 9 fois sur 10 (E(R) = ${eur(x.x.resultat.esperance)}), puis l'écart-type des ventes qui lui correspond.`;
      },
      champs: (c) => {
        const x = aleatoireDuChapitre(c);
        return [
          { libelle: `t tel que Π(t) = ${qte(CONFIANCE_DU_DIRIGEANT)}`, nature: "coefficient", attendu: x.T.unCoteA90, tolerance: 0.01, calcul: `la table donne Π(1,28) = ${pr(lectureDeLaTable(1.28))} et Π(1,29) = ${pr(lectureDeLaTable(1.29))} : t ≈ ${tt(x.T.unCoteA90)}` },
          {
            libelle: "Écart-type du résultat le plus grand",
            attendu: x.ecartTypeDuResultatMax,
            calcul: `E(R) − ${tt(x.T.unCoteA90)} × σ(R) ≥ 0 : σ(R) ≤ ${eur(x.x.resultat.esperance)} ÷ ${tt(x.T.unCoteA90)} = ${eur(x.ecartTypeDuResultatMax)}`,
          },
          {
            libelle: "Écart-type des ventes le plus grand, en enceintes",
            nature: "grandeur",
            attendu: x.ecartTypeMaxALaTable,
            calcul: `σ(X) = σ(R) ÷ ${eur(x.x.marge)} = ${eur(x.ecartTypeDuResultatMax)} ÷ ${eur(x.x.marge)} = ${qte(x.ecartTypeMaxALaTable)}`,
          },
        ];
      },
      explication: (c) => {
        const x = aleatoireDuChapitre(c);
        return [
          `Il faudrait diviser la dispersion des ventes par ${qte(x.d.ecartType / x.ecartTypeMaxALaTable)} pour tenir 9 mois sur 10. Ou bien éloigner le seuil de l'espérance : la marge de sécurité, ${qte(auCentime(x.d.moyenne - x.x.seuil!))} enceintes, ne vaut que ${qte(arrondi((x.d.moyenne - x.x.seuil!) / x.d.ecartType, 2))} écart-type. Le laboratoire fait jouer les deux.`,
        ];
      },
    },
    {
      id: "le-laboratoire-du-risque",
      objectifs: [2],
      type: "simulation",
      titre: "Le laboratoire du risque",
      notions: ["breakeven", "operating_leverage", "safety_margin"],
      question: () =>
        "Faites varier le prix, le coût variable, les charges fixes, l'espérance et l'écart-type des ventes : le tableau suit le seuil, la loi du résultat et les probabilités. Relevez le défi, puis cherchez les autres façons d'y arriver.",
      leviers: (c) => {
        const x = aleatoireDuChapitre(c);
        const L = LEVIERS_DU_RISQUE;
        return [
          { code: "prix", libelle: "Prix de vente d'une enceinte", unite: "€", ...L.prix, depart: x.depart.prix },
          { code: "coutVariable", libelle: "Coût variable d'une enceinte", unite: "€", ...L.coutVariable, depart: x.depart.coutVariable },
          { code: "chargesFixes", libelle: "Charges fixes du mois", unite: "€", ...L.chargesFixes, depart: x.depart.chargesFixes },
          { code: "moyenne", libelle: "Espérance des ventes", unite: "enceintes", ...L.moyenne, depart: x.depart.moyenne },
          { code: "ecartType", libelle: "Écart-type des ventes", unite: "enceintes", ...L.ecartType, depart: x.depart.ecartType },
        ];
      },
      lecture: (c, p) => {
        const x = aleatoireDuChapitre(c);
        const l = laboratoireDuRisque(x.f, p);
        const d = x.x;
        return [
          { libelle: "Seuil de profitabilité", montant: l.seuil === null ? 0 : auCentime(l.seuil), unite: "enceintes", reference: auCentime(d.seuil!) },
          { libelle: "Espérance du résultat", montant: l.resultat.esperance, reference: d.resultat.esperance },
          { libelle: "Écart-type du résultat", montant: l.resultat.ecartType, reference: d.resultat.ecartType },
          { libelle: "Probabilité d'une perte", montant: arrondi(l.probabiliteDePerte * 100, 2), unite: "%", reference: arrondi(d.probabiliteDePerte * 100, 2) },
          { libelle: "Probabilité d'atteindre le seuil", montant: arrondi(l.probabiliteDeProfit * 100, 2), unite: "%", reference: arrondi(d.probabiliteDeProfit * 100, 2), fort: true },
        ];
      },
      // Les probabilités selon l'écart-type ne suivent pas des droites : elles tendent vers 50 % quand la dispersion grandit.
      graphique: (c) => {
        const x = aleatoireDuChapitre(c);
        return {
          levier: "ecartType",
          unite: "%",
          courbes: [
            { libelle: "Probabilité d'atteindre le seuil", valeur: (p) => arrondi(laboratoireDuRisque(x.f, p).probabiliteDeProfit * 100, 2) },
            { libelle: "Probabilité d'une perte", valeur: (p) => arrondi(laboratoireDuRisque(x.f, p).probabiliteDePerte * 100, 2) },
          ],
        };
      },
      defi: (c) => {
        const x = aleatoireDuChapitre(c);
        return {
          consigne: `Mettez ${x.f.entreprise} en profit au moins 9 mois sur 10 : une probabilité d'atteindre le seuil d'au moins ${pct(CONFIANCE_DU_DIRIGEANT)}.`,
          atteint: (p) => defiDuRisque(x.f, p),
          indice: (p) => {
            const l = laboratoireDuRisque(x.f, p);
            return `La probabilité d'atteindre le seuil vaut ${pct(l.probabiliteDeProfit)}. Éloignez le seuil de l'espérance des ventes, ou resserrez leur dispersion.`;
          },
          solution: { ...x.depart, chargesFixes: x.seul.chargesFixes },
        };
      },
      explication: (c, p) => {
        const x = aleatoireDuChapitre(c);
        const l = laboratoireDuRisque(x.f, p);
        const s = x.seul;
        return [
          `Défi relevé : ${pct(l.probabiliteDeProfit)} de chances d'atteindre le seuil, pour un résultat attendu de ${eur(l.resultat.esperance)} (${eur(x.x.resultat.esperance)} au départ).`,
          `Chaque levier, seul, y arrivait : un prix d'au moins ${eur(s.prix)}, un coût variable d'au plus ${eur(s.coutVariable)}, des charges fixes d'au plus ${eur(s.chargesFixes)}, des ventes attendues d'au moins ${qte(s.moyenne)} enceintes, ou un écart-type d'au plus ${qte(s.ecartType)}.`,
          "Les quatre premiers éloignent le seuil de l'espérance des ventes ; le dernier resserre la loi autour d'elle. La probabilité dépend du rapport des deux : la marge de sécurité comptée en écarts-types.",
        ];
      },
    },
    {
      id: "le-trimestre",
      objectifs: [2],
      type: "montants",
      titre: "Le risque sur un trimestre",
      question: () => {
        return `Sans formule : supposez ${qte(MOIS_DU_TRIMESTRE)} mois comme janvier, aux ventes indépendantes d'un mois à l'autre. Calculez l'espérance du résultat du trimestre, son écart-type (la variance d'une somme de variables indépendantes est la somme des variances), puis la probabilité d'une perte sur le trimestre.`;
      },
      champs: (c) => {
        const x = aleatoireDuChapitre(c);
        const q = x.trimestre;
        const r = x.x.resultat;
        return [
          { libelle: "Espérance du résultat du trimestre", attendu: q.esperance, calcul: `${qte(MOIS_DU_TRIMESTRE)} × ${eur(r.esperance)} = ${eur(q.esperance)}` },
          { libelle: "Écart-type du résultat du trimestre", attendu: q.ecartType, calcul: `√(${qte(MOIS_DU_TRIMESTRE)} × ${eur(r.ecartType)}²) = ${eur(r.ecartType)} × √${qte(MOIS_DU_TRIMESTRE)} = ${eur(q.ecartType)}` },
          {
            libelle: "Probabilité d'une perte sur le trimestre",
            nature: "coefficient",
            attendu: q.perteLue,
            tolerance: TOLERANCE_D_UNE_PROBABILITE,
            calcul: `t = (0 − ${eur(q.esperance)}) ÷ ${eur(q.ecartType)} = ${tt(q.tLu)} ; Π(${tt(q.tLu)}) = 1 − Π(${tt(-q.tLu)}) = ${pr(q.perteLue)}`,
          },
        ];
      },
      explication: (c) => {
        const x = aleatoireDuChapitre(c);
        return [
          `Le risque d'un trimestre à perte, ${pct(x.trimestre.perteLue)}, est plus faible que celui d'un mois, ${pct(x.x.perteLue)}. L'écart-type du trimestre n'est pas ${qte(MOIS_DU_TRIMESTRE)} fois celui du mois, ${eur(auCentime(MOIS_DU_TRIMESTRE * x.x.resultat.ecartType))}, mais √${qte(MOIS_DU_TRIMESTRE)} fois.`,
        ];
      },
    },
    {
      id: "lire-le-trimestre",
      objectifs: [2],
      type: "choix",
      titre: "Pourquoi le trimestre risque moins",
      question: () => "Pourquoi le trimestre a-t-il moins de risque de finir à perte que chacun de ses mois ?",
      options: (c) => {
        const x = aleatoireDuChapitre(c);
        return [
          {
            texte: "Un mauvais mois se compense souvent par un bon",
            juste: true,
            retour: `Oui. Les ventes étant indépendantes, les écarts ne s'additionnent pas tous dans le même sens : l'espérance est multipliée par ${qte(MOIS_DU_TRIMESTRE)}, l'écart-type par √${qte(MOIS_DU_TRIMESTRE)} seulement. La marge de sécurité, comptée en écarts-types, grandit.`,
          },
          {
            texte: "Les charges fixes d'un trimestre pèsent moins que celles d'un mois",
            juste: false,
            retour: `Non : elles sont ${qte(MOIS_DU_TRIMESTRE)} fois plus fortes, ${eur(auCentime(MOIS_DU_TRIMESTRE * x.x.chargesFixes))}, comme l'espérance de la marge.`,
          },
          {
            texte: "Les ventes d'un trimestre suivent une autre loi que la loi normale",
            juste: false,
            retour: "Non : la somme de variables normales indépendantes suit encore une loi normale. C'est ce qui permet le calcul.",
          },
        ];
      },
    },
    {
      id: "d-ou-vient-l-ecart-type",
      objectifs: [3],
      type: "montants",
      titre: "L'écart-type d'une fourchette, à rebours",
      question: (c) => {
        const x = aleatoireDuChapitre(c);
        return `Le directeur commercial n'a pas donné d'écart-type : il a dit « 95 fois sur 100, les ventes de janvier tombent entre ${qte(x.fourchette.bas)} et ${qte(x.fourchette.haut)} enceintes, intervalle centré sur la vente moyenne ». Sans formule : retrouvez l'espérance, le t de la table d'un intervalle centré à ${pct(CONFIANCE_DE_LA_FOURCHETTE)}, puis l'écart-type.`;
      },
      champs: (c) => {
        const x = aleatoireDuChapitre(c);
        return [
          { libelle: "Espérance des ventes", nature: "grandeur", attendu: x.retrouve.moyenne, calcul: `le centre de l'intervalle : (${qte(x.fourchette.bas)} + ${qte(x.fourchette.haut)}) ÷ 2 = ${qte(x.retrouve.moyenne)}` },
          { libelle: "t de la table", nature: "coefficient", attendu: x.T.centreA95, tolerance: 0.01, calcul: `P(−t < T < t) = 2Π(t) − 1 = ${qte(CONFIANCE_DE_LA_FOURCHETTE)}, Π(t) = ${pr((1 + CONFIANCE_DE_LA_FOURCHETTE) / 2)} : t = ${tt(x.T.centreA95)}` },
          {
            libelle: "Écart-type des ventes",
            nature: "grandeur",
            attendu: x.retrouve.ecartType,
            calcul: `${qte(x.retrouve.moyenne)} + ${tt(x.T.centreA95)} × σ = ${qte(x.fourchette.haut)} : σ = ${qte(auCentime(x.fourchette.haut - x.retrouve.moyenne))} ÷ ${tt(x.T.centreA95)} = ${qte(x.retrouve.ecartType)}`,
          },
        ];
      },
      explication: () => [
        "C'est ainsi que le cours a obtenu l'écart-type de la loi des ventes. Un responsable parle plus volontiers en fourchettes qu'en écarts-types : le contrôleur de gestion traduit l'une dans l'autre.",
      ],
    },
    {
      id: "le-mois-redoute",
      objectifs: [3],
      type: "montants",
      titre: "Le mois redouté",
      question: (c) => {
        const x = aleatoireDuChapitre(c);
        return `Sans formule : quel résultat janvier dépasse-t-il 95 fois sur 100 ? Trouvez le t de la table tel que Π(t) = ${qte(CONFIANCE_DU_MOIS_REDOUTE)}, puis ce résultat, sur la loi N(${eur(x.x.resultat.esperance)} ; ${eur(x.x.resultat.ecartType)}).`;
      },
      champs: (c) => {
        const x = aleatoireDuChapitre(c);
        return [
          {
            libelle: `t tel que Π(t) = ${qte(CONFIANCE_DU_MOIS_REDOUTE)}`,
            nature: "coefficient",
            attendu: x.T.unCoteA95,
            tolerance: 0.006,
            calcul: `Π(1,64) = ${pr(lectureDeLaTable(1.64))} et Π(1,65) = ${pr(lectureDeLaTable(1.65))} : ${qte(CONFIANCE_DU_MOIS_REDOUTE)} est au milieu, t = ${tt(x.T.unCoteA95)}`,
          },
          {
            libelle: "Résultat dépassé 95 fois sur 100",
            attendu: x.redoute,
            calcul: `P(R > r) = ${qte(CONFIANCE_DU_MOIS_REDOUTE)} : (r − ${eur(x.x.resultat.esperance)}) ÷ ${eur(x.x.resultat.ecartType)} = −${tt(x.T.unCoteA95)}, r = ${eur(x.x.resultat.esperance)} − ${tt(x.T.unCoteA95)} × ${eur(x.x.resultat.ecartType)} = ${eur(x.redoute)}`,
          },
        ];
      },
      explication: (c) => {
        const x = aleatoireDuChapitre(c);
        return [
          `1 mois sur 20, ${x.f.entreprise} perd plus de ${eur(-x.redoute)}. C'est la question du banquier et du trésorier : non pas ce qu'on gagne en moyenne, mais ce qu'il faut pouvoir encaisser les mauvais mois. Le chapitre « Le budget de trésorerie » dit si la trésorerie le supporte.`,
        ];
      },
    },
    {
      id: "les-limites",
      objectifs: [4],
      type: "choix",
      titre: "Ce que le modèle suppose",
      question: (c) => `Le dirigeant s'apprête à présenter « ${pct(aleatoireDuChapitre(c).x.profitLu)} de chances d'atteindre le seuil » à sa banque. Quelle réserve devez-vous lui faire ?`,
      options: () => [
        {
          texte: "Ce chiffre vaut ce que valent la loi et ses paramètres",
          juste: true,
          retour:
            "Oui. Le calcul suppose des ventes normales, symétriques, de paramètres stables, un prix et des coûts certains, des mois indépendants. Un concurrent, une panne, une hausse des composants, et le chiffre ne tient plus. Il éclaire le risque ; il ne le supprime pas.",
        },
        {
          texte: "Aucune : une probabilité calculée avec la table est exacte",
          juste: false,
          retour: "Non : la table est exacte, pas le modèle. L'écart-type vient des janviers passés, et rien ne garantit que le prochain leur ressemble.",
        },
        {
          texte: "Il faut aussi la probabilité de vendre exactement le seuil, pour être complet",
          juste: false,
          retour: "Non : pour une loi continue, la probabilité d'une valeur précise est nulle. Seuls les intervalles ont une probabilité.",
        },
      ],
    },
    {
      id: "synthese",
      type: "lecture",
      titre: "Ce que vous savez faire",
      notions: ["breakeven", "safety_margin"],
      tableau: tableauDuMoisAleatoire,
      texte: (c) => {
        const x = aleatoireDuChapitre(c);
        return [
          `En avenir aléatoire, le seuil de profitabilité de ${x.f.entreprise} ne change pas, ${qte(x.x.seuil!)} enceintes ; ce qui change, c'est la question. Avec des ventes N(${qte(x.d.moyenne)} ; ${qte(x.d.ecartType)}), janvier atteint le seuil ${pct(x.x.profitLu)} des fois, perd de l'argent ${pct(x.x.perteLue)} des fois, et atteint ${eur(OBJECTIF_DU_DIRIGEANT)} ${pct(x.objectifLu)} des fois.`,
          `Le résultat suit N(${eur(x.x.resultat.esperance)} ; ${eur(x.x.resultat.ecartType)}). La dispersion ne change pas ce qu'on gagne en moyenne, elle change le risque : pour être en profit 9 mois sur 10, il faudrait un écart-type d'au plus ${qte(x.ecartTypeMax)} enceintes, ou un seuil plus éloigné. Sur un trimestre, les mois se compensent : ${pct(x.trimestre.perteLue)} de risque de perte.`,
          "Au niveau de l'examen, vous savez déduire la loi du chiffre d'affaires et du résultat de celle des ventes, centrer et réduire, et lire la table dans les deux sens. Vous savez aussi cumuler des mois indépendants, retrouver l'écart-type d'une fourchette et dire ce que le modèle suppose.",
          "Dans l'arène, les chiffres de votre entreprise seront différents : la notion, elle, est la même.",
        ];
      },
      repere: () =>
        "E(aX + b) = a E(X) + b ; σ(aX + b) = |a| σ(X) ; pour des variables indépendantes, V(X + Y) = V(X) + V(Y). P(X ≥ seuil) = 1 − Π((seuil − m) ÷ σ). Valeurs de la table : 1,28 (90 % d'un côté), 1,645 (95 % d'un côté), 1,96 (95 % centré).",
    },
  ],
};
