import { montantEcrit } from "../../../pedagogy/cours/correcteur";
import type { CelluleACompleter, LigneACompleter, TableauACompleter } from "../../../pedagogy/cours/tableau-a-completer";
import type { Cas } from "../cas";
import { fluxDuProjet } from "../monde/finance";
import {
  ANNEES_DU_PLAN,
  CREDIT_BAIL_DE_LA_LIGNE,
  EMPRUNT_DE_LA_LIGNE,
  EMPRUNT_DU_PLAN_EQUILIBRE,
  LIGNE_A_FINANCER,
  MOULES,
  PLAN_SANS_EMPRUNT,
  RESERVE_DE_LA_GAMME,
  TAUX_DE_L_IMPOT,
  planDeFinancementDeLaGamme,
  type AnneeDuPlan,
  type LeviersDuPlan,
  type PlanDeLaGamme,
} from "../monde/financement-de-la-gamme";
import { PROJET_LIGNE_SEMI_AUTOMATIQUE } from "../monde/projets-et-financement";
import type { Chapitre, TableauDeDonnees } from "../types";
import { ENTREPRISES_DU_FINANCEMENT } from "./emprunt-ou-credit-bail";

/**
 * CHAPITRE : LE PLAN DE FINANCEMENT (comptabilité générale, palier 4 ; BTS CG P6 6.5.2, DCG UE6 4.4).
 *
 * LE CHAPITRE JOUE DANS LE MONDE DU COURS : la gamme de N+1 sur la ligne semi-automatique (le projet B
 * de monde/projets-et-financement.ts), ses flux d'exploitation et son BFR (monde/finance.ts,
 * `fluxDuProjet`), la réserve placée de l'exercice (133 000 €), la banque de NOVA à 5 %. Le plan se
 * calcule dans monde/financement-de-la-gamme.ts (`planDeFinancementDeLaGamme`).
 *
 * L'objet : le plan de financement recense, année par année de N+1 à N+5, les emplois que la gamme
 * demande (la ligne et les moules, l'augmentation du BFR, les remboursements) et les ressources qui
 * les financent (la réserve, la CAF, l'emprunt). Le plan ébauché, sans emprunt, manque d'argent en
 * N+1 ; on l'équilibre par un emprunt, dont les intérêts baissent la CAF et dont les annuités
 * deviennent des emplois. Puis le même plan avec la ligne en crédit-bail, et ce qui distingue le plan
 * de financement du tableau de financement et du budget de trésorerie.
 *
 * LES TEMPS DU CHAPITRE (l'esprit du cours : le cas simulé pas à pas, l'expérience avant la formule) :
 *   · guidé : intro, emplois-ou-ressources, la-caf-previsionnelle (la formule est au repère) ;
 *   · autonome : l-ebauche, lire-l-ebauche ;
 *   · l'expérience avant la formule : predire-l-emprunt puis l-emprunt-au-curseur (l'emprunt, au
 *     millier d'euros, qui couvre N+1) avant l-ajustement (ce que l'emprunt change à la CAF) ;
 *   · autonome : le-plan-equilibre ;
 *   · le laboratoire : le-laboratoire-du-plan (l'emprunt, sa durée, la ligne achetée ou en
 *     crédit-bail), avec un graphique des soldes selon l'emprunt ;
 *   · expert : le-credit-bail-dans-le-plan, le-plan-a-retenir, plan-tableau-ou-budget ; puis la
 *     synthèse.
 *
 * MATIÈRE : le cours du propriétaire « Gestion des investissements, plan de financement » (le
 * contenu des emplois et des ressources, l'ébauche puis l'équilibrage, les conséquences d'un emprunt
 * nouveau sur la CAF, la différence avec le tableau de financement et le budget de trésorerie),
 * adapté à la gamme de NOVA.
 */

/** Les bornes du curseur de l'emprunt, en milliers d'euros. */
export const EMPRUNT_DU_CURSEUR = { min: 0, max: 150 } as const;

/** Les leviers du laboratoire : l'emprunt de N+1 (en euros) et sa durée (en années), la ligne achetée ou en crédit-bail. */
export const LEVIERS_DU_PLAN = {
  emprunt: { min: 0, max: 150_000, pas: 10_000 },
  duree: { min: 3, max: 7, pas: 1 },
} as const;

/** Le levier à choix de la ligne. */
export const LIGNE_ACHETEE = 0;
export const LIGNE_EN_CREDIT_BAIL = 1;

const eur = (x: number) => montantEcrit(x + 0).replace(/^-/, "−");
const pct = (t: number) => `${(t * 100 + 0).toLocaleString("fr-FR", { maximumFractionDigits: 2 })} %`;
const auCentime = (x: number) => Math.round(x * 100) / 100 + 0;
/** Un montant qui peut être négatif, entre parenthèses quand il l'est. */
const enCalcul = (x: number) => (x < 0 ? `(${eur(x)})` : eur(x));

const donnee = (valeur: number): CelluleACompleter => ({ valeur });
const aSaisir = (valeur: number, calcul: string, autres: Partial<CelluleACompleter> = {}): CelluleACompleter => ({ valeur, saisir: true, calcul, ...autres });

/** Une position du laboratoire, en leviers du plan. */
export const leviersDuLaboratoire = (p: Readonly<Record<string, number>>): Partial<LeviersDuPlan> => ({
  emprunt: p.emprunt!,
  dureeDeLEmprunt: p.duree!,
  creditBail: p.ligne === LIGNE_EN_CREDIT_BAIL,
});

const calcules = new Map<string, ReturnType<typeof calculerLeChapitre>>();

/** Tout ce que le chapitre demande, calculé une fois (la fiche est figée). */
export function planDuChapitre(c: Pick<Cas, "code">) {
  const deja = calcules.get(c.code);
  if (deja) return deja;
  const x = calculerLeChapitre();
  calcules.set(c.code, x);
  return x;
}

function calculerLeChapitre() {
  const projet = fluxDuProjet(PROJET_LIGNE_SEMI_AUTOMATIQUE);
  const ebauche = planDeFinancementDeLaGamme(PLAN_SANS_EMPRUNT);
  const equilibre = planDeFinancementDeLaGamme({ emprunt: EMPRUNT_DU_PLAN_EQUILIBRE });
  const creditBail = planDeFinancementDeLaGamme({ creditBail: true });
  const deficit = -ebauche.annees[0]!.solde;
  const avecEmprunt = (milliers: number) => planDeFinancementDeLaGamme({ emprunt: milliers * 1_000 });
  return {
    projet,
    ebauche,
    equilibre,
    creditBail,
    deficit,
    avecEmprunt,
    t: TAUX_DE_L_IMPOT,
    e: EMPRUNT_DE_LA_LIGNE,
    investissement: auCentime(LIGNE_A_FINANCER.montant + MOULES.montant),
    depart: { emprunt: 0, duree: EMPRUNT_DE_LA_LIGNE.dureeAns, ligne: LIGNE_ACHETEE },
  };
}

export type PlanDuChapitre = ReturnType<typeof planDuChapitre>;

/** Les données de la gamme, telles que le contrôleur les rassemble. */
export function tableauDesDonnees(c: Pick<Cas, "code">): TableauDeDonnees {
  const x = planDuChapitre(c);
  const a = x.projet.annees;
  return {
    titre: "La gamme sur la ligne semi-automatique, de N+1 à N+5",
    colonnes: [...ANNEES_DU_PLAN],
    lignes: [
      { libelle: "Excédent brut d'exploitation de la gamme", valeurs: a.map((y) => eur(y.excedentBrut)) },
      { libelle: "Dotations aux amortissements", valeurs: a.map((y) => eur(y.dotations)) },
      { libelle: "BFR de la gamme, constitué en début d'année", valeurs: a.map((y) => eur(y.bfr)) },
    ],
  };
}

/** La CAF prévisionnelle de la gamme, sans emprunt, à compléter. */
export function grilleDeLaCaf(c: Pick<Cas, "code">): TableauACompleter {
  const x = planDuChapitre(c);
  const a = x.ebauche.annees;
  const premiere = (i: number) => i === 0;
  return {
    titre: "La capacité d'autofinancement prévisionnelle de la gamme",
    colonnes: [...ANNEES_DU_PLAN],
    lignes: [
      { libelle: "Excédent brut d'exploitation", cellules: a.map((y) => donnee(y.excedentBrut)) },
      { libelle: "Dotations aux amortissements", cellules: a.map((y) => donnee(y.dotations)) },
      {
        libelle: "Résultat avant impôt",
        totalDe: { plus: [0], moins: [1] },
        cellules: a.map((y) => aSaisir(y.resultat, `${eur(y.excedentBrut)} − ${eur(y.dotations)} = ${eur(y.resultat)}`)),
      },
      {
        libelle: "Impôt, 25 % (négatif : une économie)",
        cellules: a.map((y, i) =>
          aSaisir(y.impot, `${enCalcul(y.resultat)} × ${pct(x.t)} = ${eur(y.impot)}`, premiere(i) ? { indice: "une perte fait économiser l'impôt du reste du bénéfice de NOVA : un impôt négatif" } : {}),
        ),
      },
      {
        libelle: "Capacité d'autofinancement",
        fort: true,
        totalDe: { plus: [0], moins: [3] },
        cellules: a.map((y) => aSaisir(y.caf, `${eur(y.excedentBrut)} − ${enCalcul(y.impot)} = ${eur(y.caf)}`, { indice: "l'EBE moins l'impôt : l'amortissement ne sort pas d'argent" })),
      },
    ],
  };
}

/** Les lignes d'un plan de financement, à compléter : l'ébauche, ou le plan équilibré par un emprunt. */
function lignesDuPlan(plan: PlanDeLaGamme, avecEmprunt: boolean): LigneACompleter[] {
  const a = plan.annees;
  const cellule = (f: (y: AnneeDuPlan) => number, calcul: (y: AnneeDuPlan) => string, donne = false) =>
    a.map((y) => (donne ? donnee(f(y)) : aSaisir(f(y), calcul(y))));
  const lignes: { cle: string; ligne: LigneACompleter }[] = [];
  const ajoute = (cle: string, ligne: LigneACompleter) => lignes.push({ cle, ligne });
  const indice = (cle: string) => lignes.findIndex((l) => l.cle === cle);
  ajoute("investissements", { libelle: "Ligne et moules", cellules: cellule((y) => y.investissements, () => "", true) });
  ajoute("bfr+", { libelle: "Augmentation du BFR", cellules: cellule((y) => y.augmentationDuBfr, (y) => `le BFR de ${y.annee} moins celui de l'année d'avant : ${eur(y.augmentationDuBfr)}`) });
  if (avecEmprunt) ajoute("remboursements", { libelle: "Remboursement de l'emprunt", cellules: cellule((y) => y.remboursements, (y) => `le capital remboursé en ${y.annee} : ${eur(y.remboursements)}`) });
  const emplois = ["investissements", "bfr+", ...(avecEmprunt ? ["remboursements"] : [])].map(indice);
  ajoute("emplois", { libelle: "Total des emplois", fort: true, totalDe: { plus: emplois }, cellules: cellule((y) => y.emplois, (y) => `la somme des emplois : ${eur(y.emplois)}`) });
  ajoute("reserve", { libelle: "Réserve placée, échue en janvier", cellules: cellule((y) => y.reserve, () => "", true) });
  if (avecEmprunt) ajoute("emprunt", { libelle: "Emprunt", cellules: cellule((y) => y.emprunt, () => "", true) });
  ajoute("caf", { libelle: "Capacité d'autofinancement", cellules: cellule((y) => y.caf, (y) => `${eur(y.excedentBrut)} − ${eur(y.interets)} d'intérêts − ${enCalcul(y.impot)} d'impôt = ${eur(y.caf)}`) });
  ajoute("bfr-", { libelle: "Diminution du BFR", cellules: cellule((y) => y.diminutionDuBfr, (y) => `le BFR baisse de ${eur(y.diminutionDuBfr)} en ${y.annee}`) });
  const ressources = ["reserve", ...(avecEmprunt ? ["emprunt"] : []), "caf", "bfr-"].map(indice);
  ajoute("ressources", { libelle: "Total des ressources", fort: true, totalDe: { plus: ressources }, cellules: cellule((y) => y.ressources, (y) => `la somme des ressources : ${eur(y.ressources)}`) });
  ajoute("solde", {
    libelle: "Solde de l'année",
    fort: true,
    totalDe: { plus: [indice("ressources")], moins: [indice("emplois")] },
    cellules: cellule((y) => y.solde, (y) => `${eur(y.ressources)} − ${eur(y.emplois)} = ${eur(y.solde)}`),
  });
  ajoute("cumul", {
    libelle: "Solde cumulé",
    cellules: a.map((y, i) => aSaisir(y.cumul, i === 0 ? `le solde de ${y.annee} : ${eur(y.cumul)}` : `${enCalcul(a[i - 1]!.cumul)} + ${enCalcul(y.solde)} = ${eur(y.cumul)}`, { indice: "le cumul de l'année d'avant, plus le solde de l'année" })),
  });
  return lignes.map((l) => l.ligne);
}

/** Le plan de financement ébauché, sans emprunt, à compléter. */
export function grilleDeLEbauche(c: Pick<Cas, "code">): TableauACompleter {
  const x = planDuChapitre(c);
  return { titre: "Le plan de financement ébauché", colonnes: [...ANNEES_DU_PLAN], lignes: lignesDuPlan(x.ebauche, false) };
}

/** Le plan de financement équilibré par l'emprunt, à compléter. */
export function grilleDuPlanEquilibre(c: Pick<Cas, "code">): TableauACompleter {
  const x = planDuChapitre(c);
  return { titre: `Le plan de financement équilibré, avec un emprunt de ${eur(EMPRUNT_DU_PLAN_EQUILIBRE)}`, colonnes: [...ANNEES_DU_PLAN], lignes: lignesDuPlan(x.equilibre, true) };
}

export const LE_PLAN_DE_FINANCEMENT: Chapitre = {
  code: "le-plan-de-financement",
  parcours: "comptabilite-generale",
  palier: 4,
  blocs: ["BTS CG P6 · Analyse de la situation financière", "DCG UE6 · Finance d'entreprise"],
  titre: "Le plan de financement",
  accroche:
    "La gamme de NOVA demande une ligne, des moules et du BFR, de N+1 à N+5. La réserve et la CAF suffiront-elles ? Dresser le plan ébauché, l'équilibrer par un emprunt dont on suit les conséquences, puis le comparer au crédit-bail.",
  objectifs: [
    "Recenser les emplois et les ressources d'un programme d'investissement sur plusieurs années",
    "Calculer les capacités d'autofinancement prévisionnelles et les variations du BFR d'un projet",
    "Dresser le plan de financement ébauché, puis l'équilibrer par un emprunt dont on suit les conséquences sur la CAF",
    "Comparer deux plans de financement, et distinguer le plan de financement du tableau de financement et du budget de trésorerie",
  ],
  libre: false,
  prerequis: ["emprunt-ou-credit-bail", "soldes-intermediaires-de-gestion", "bilan-fonctionnel-et-bfr"],
  entreprises: {
    codes: ENTREPRISES_DU_FINANCEMENT,
    pourquoi: "le plan de financement se dresse ici sur la gamme de NOVA dans la simulation du cours, avec sa ligne, sa réserve et sa banque ; la méthode vaut pour toute entreprise.",
  },
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Cinq ans à financer",
      notions: ["cash_budget", "bfr"],
      tableau: tableauDesDonnees,
      texte: (c) => {
        const x = planDuChapitre(c);
        return [
          `NOVA lance sa gamme le 1er janvier N+1 : ${LIGNE_A_FINANCER.libelle}, ${eur(LIGNE_A_FINANCER.montant)}, et ${MOULES.libelle}, ${eur(MOULES.montant)}, payés comptant. Le chapitre précédent l'a montré : si elle emprunte, ce sera à la banque, pas en crédit-bail.`,
          `Pour payer, elle a sa réserve : le compte à terme de ${eur(RESERVE_DE_LA_GAMME)}, échu le 6 janvier. Ensuite, la gamme dégagera sa propre capacité d'autofinancement, mais elle demandera aussi du BFR.`,
          `Le plan de financement met tout cela en regard, année par année, sur ${ANNEES_DU_PLAN.length} ans. En haut, les emplois : ce qu'il faut payer. En bas, les ressources : ce qui le paie. La différence est le solde de l'année.`,
          `Hypothèse du cours : le plan s'arrête fin N+5. La revente de la ligne et la récupération du BFR, au début de N+6, n'y entrent pas. L'impôt est de ${pct(x.t)} sur chaque euro de résultat.`,
        ];
      },
      repere: () => "Solde de l'année = total des ressources − total des emplois. Un plan est équilibré quand chaque solde est positif ou nul.",
    },
    {
      id: "emplois-ou-ressources",
      objectifs: [0],
      type: "tri",
      titre: "Emplois ou ressources",
      notions: ["frng", "bfr"],
      question: () => "Rangez chaque élément du plan de financement : un emploi, qui demande de l'argent, ou une ressource, qui en apporte.",
      categories: [
        { code: "emploi", libelle: "Emploi" },
        { code: "ressource", libelle: "Ressource" },
      ],
      elements: (c) => {
        const x = planDuChapitre(c);
        const a = x.equilibre.annees;
        return [
          { libelle: "La ligne et les moules, achetés en N+1", montant: x.investissement, categorie: "emploi", pourquoi: "Un investissement est le premier emploi du plan : il faut le payer." },
          { libelle: "L'augmentation du BFR de N+2", montant: a[1]!.augmentationDuBfr, categorie: "emploi", pourquoi: "Plus de ventes, plus de créances et de stocks à financer : le BFR qui grandit immobilise de l'argent." },
          { libelle: "Le capital de l'emprunt remboursé en N+2", montant: a[1]!.remboursements, categorie: "emploi", pourquoi: "Le remboursement du capital sort de la caisse : c'est un emploi. Les intérêts, eux, sont déjà déduits de la CAF." },
          { libelle: "La réserve placée, échue en janvier N+1", montant: RESERVE_DE_LA_GAMME, categorie: "ressource", pourquoi: "Le placement échu revient en caisse : NOVA prélève sur son fonds de roulement pour payer la gamme." },
          { libelle: "La capacité d'autofinancement de N+3", montant: a[2]!.caf, categorie: "ressource", pourquoi: "La CAF est l'argent que l'activité dégage : la première ressource interne." },
          { libelle: "La diminution du BFR de N+5", montant: a[4]!.diminutionDuBfr, categorie: "ressource", pourquoi: "La gamme vieillit, les ventes baissent : le BFR qui diminue libère de l'argent." },
          { libelle: "L'emprunt de N+1", montant: EMPRUNT_DU_PLAN_EQUILIBRE, categorie: "ressource", pourquoi: "L'argent prêté entre en caisse l'année où il est versé : une ressource externe." },
        ];
      },
      relance: "Demandez-vous, pour chaque ligne : cette année-là, l'argent sort-il de la caisse de NOVA, ou y entre-t-il ?",
      explication: () => [
        "Les emplois sont ce qui augmente l'actif ou diminue le passif : un achat, un BFR qui grandit, une dette remboursée. Les ressources, l'inverse : un apport, un emprunt, la CAF, un placement qu'on retire, un BFR qui baisse.",
        "Les dividendes versés et la levée d'une option de crédit-bail seraient aussi des emplois ; une subvention ou un prix de cession, des ressources.",
      ],
    },
    {
      id: "la-caf-previsionnelle",
      objectifs: [1],
      type: "a-completer",
      titre: "La CAF prévisionnelle",
      notions: ["ebitda_margin", "depreciation"],
      tableau: tableauDesDonnees,
      question: (c) => {
        const x = planDuChapitre(c);
        return `Sans emprunt, CAF = EBE − impôt, et impôt = (EBE − dotations) × ${pct(x.t)}. Calculez, année par année, le résultat avant impôt, l'impôt, puis la CAF.`;
      },
      grille: grilleDeLaCaf,
      explication: (c) => {
        const x = planDuChapitre(c);
        const a = x.ebauche.annees[0]!;
        return [
          `En N+1, la gamme perd ${eur(-a.resultat)} : la campagne de lancement et l'amortissement pèsent plus que les premières ventes. Cette perte fait économiser ${eur(-a.impot)} d'impôt sur le reste du bénéfice de NOVA : la CAF reste positive, ${eur(a.caf)}.`,
          "La CAF se calcule ici par le haut, depuis l'EBE. Par le bas, elle serait le résultat net plus les dotations : le même nombre.",
        ];
      },
    },
    {
      id: "l-ebauche",
      objectifs: [0, 2],
      type: "a-completer",
      titre: "Le plan ébauché",
      notions: ["bfr", "cash_budget"],
      question: () =>
        "À vous, sans formule cette fois. Dressez le plan ébauché : les emplois, la ligne, les moules et le BFR qui grandit ; les ressources, la réserve, la CAF et le BFR qui baisse. Puis le solde de chaque année, et son cumul.",
      grille: grilleDeLEbauche,
      explication: (c) => {
        const x = planDuChapitre(c);
        const a = x.ebauche.annees;
        return [
          `N+1 manque de ${eur(x.deficit)} : la réserve et la CAF ne couvrent pas la ligne, les moules et le premier BFR. Dès N+2, la gamme dégage plus qu'elle ne demande, et le cumul repasse au-dessus de zéro en ${a.find((y) => y.cumul >= 0)!.annee}.`,
          "Un cumul positif ne suffit pas : l'argent de N+2 ne paie pas les factures de N+1. Le plan doit tenir chaque année.",
        ];
      },
    },
    {
      id: "lire-l-ebauche",
      objectifs: [2],
      type: "choix",
      titre: "Lire l'ébauche",
      notions: ["frng"],
      question: (c) => {
        const x = planDuChapitre(c);
        return `Le plan ébauché manque de ${eur(x.deficit)} en N+1, puis dégage de larges excédents. Comment le contrôleur l'équilibre-t-il ?`;
      },
      options: () => [
        {
          texte: "Par un emprunt en N+1, remboursé par les excédents",
          juste: true,
          retour: "Oui. Le besoin est concentré sur l'année du lancement, et la gamme dégage ensuite de quoi rembourser : un emprunt à moyen terme y répond. Ses intérêts et ses annuités entreront à leur tour dans le plan.",
        },
        {
          texte: "Par un découvert en N+1, puisque N+2 le comblera",
          juste: false,
          retour: "Un découvert finance quelques jours d'écart, pas un investissement. Un emploi stable se finance par une ressource stable.",
        },
        {
          texte: "En renonçant aux moules, pour que la réserve suffise à la ligne",
          juste: false,
          retour: "Sans moules, pas de Go ni de Studio : la gamme n'existe plus. Réduire ou étaler l'investissement est une voie, mais pas en retirant ce qui le fait vivre.",
        },
      ],
    },
    {
      id: "predire-l-emprunt",
      objectifs: [2],
      type: "choix",
      titre: "Pariez sur l'emprunt",
      notions: ["loan_schedule"],
      question: (c) => {
        const x = planDuChapitre(c);
        return `Avant de calculer, pariez. Il manque ${eur(x.deficit)} en N+1. La banque prête à ${pct(x.e.taux)} sur ${x.e.dureeAns} ans, le capital remboursé en parts égales dès la fin de N+1. Combien faut-il emprunter, au millier d'euros ?`;
      },
      options: (c) => {
        const x = planDuChapitre(c);
        const voir = "Faites varier l'emprunt à l'étape suivante : le curseur montre les ressources et les emplois de N+1, millier par millier.";
        return [
          { texte: eur(EMPRUNT_DU_PLAN_EQUILIBRE), juste: true, retour: `Bon pari. ${voir}` },
          { texte: `${eur(Math.ceil(x.deficit / 1_000) * 1_000)}, le manque arrondi`, juste: false, retour: `Pari à vérifier. ${voir}` },
          { texte: `${eur(x.e.montant)}, tout le prix de la ligne`, juste: false, retour: `Pari à vérifier. ${voir}` },
        ];
      },
    },
    {
      id: "l-emprunt-au-curseur",
      objectifs: [2],
      type: "curseur",
      titre: "L'emprunt, au curseur",
      notions: ["loan_schedule", "cash_budget"],
      question: (c) => {
        const x = planDuChapitre(c);
        return `Faites varier l'emprunt de N+1, de ${EMPRUNT_DU_CURSEUR.min} à ${EMPRUNT_DU_CURSEUR.max} milliers d'euros, sur ${x.e.dureeAns} ans. Une droite donne les ressources de N+1, l'autre ses emplois, remboursement compris. Placez le curseur sur le plus petit emprunt qui couvre N+1, puis validez.`;
      },
      grandeur: () => ({ libelle: "Emprunt de N+1", unite: "milliers d'euros" }),
      cible: () => ({ attendu: EMPRUNT_DU_PLAN_EQUILIBRE / 1_000, min: EMPRUNT_DU_CURSEUR.min, max: EMPRUNT_DU_CURSEUR.max }),
      zones: ["N+1 est couvert", "N+1 manque d'argent"],
      rates: () => ({
        dessous: "À cette position, les ressources de N+1 ne couvrent pas encore ses emplois.",
        dessus: "Avec moins d'emprunt, N+1 serait déjà couvert : cherchez le plus petit emprunt.",
      }),
      montrer: "Montrer l'emprunt",
      lecture: (c, q) => {
        const x = planDuChapitre(c);
        const a = x.avecEmprunt(q).annees[0]!;
        return [
          { libelle: "Capacité d'autofinancement de N+1, intérêts déduits", montant: a.caf },
          { libelle: "Remboursement de N+1", montant: a.remboursements },
          { libelle: "Total des ressources de N+1", montant: a.ressources },
          { libelle: "Total des emplois de N+1", montant: a.emplois },
          { libelle: "Solde de N+1", montant: a.solde, fort: true },
        ];
      },
      droites: (c) => {
        const x = planDuChapitre(c);
        return { produit: (q) => x.avecEmprunt(q).annees[0]!.ressources, cout: (q) => x.avecEmprunt(q).annees[0]!.emplois, libelles: ["Ressources de N+1", "Emplois de N+1"] };
      },
      explication: (c) => {
        const x = planDuChapitre(c);
        const a = x.equilibre.annees[0]!;
        return [
          `Il faut ${eur(EMPRUNT_DU_PLAN_EQUILIBRE)}, bien plus que les ${eur(x.deficit)} qui manquaient. Chaque euro emprunté en rapporte moins d'un à N+1 : une part repart en remboursement dès la fin de l'année, une autre en intérêts. N+1 finit à ${eur(a.solde)}.`,
        ];
      },
    },
    {
      id: "l-ajustement",
      objectifs: [2],
      type: "montants",
      titre: "Ce que l'emprunt change",
      notions: ["loan_schedule", "depreciation"],
      question: (c) => {
        const x = planDuChapitre(c);
        return `NOVA emprunte ${eur(EMPRUNT_DU_PLAN_EQUILIBRE)} le 1er janvier N+1, à ${pct(x.e.taux)} sur ${x.e.dureeAns} ans. Calculez les intérêts de N+1, le capital remboursé fin N+1, la CAF de N+1 ajustée, puis le nouveau solde de N+1.`;
      },
      champs: (c) => {
        const x = planDuChapitre(c);
        const a = x.equilibre.annees[0]!;
        const sans = x.ebauche.annees[0]!;
        const economie = auCentime(a.interets * x.t);
        return [
          { libelle: "Intérêts de N+1", attendu: a.interets, calcul: `${eur(EMPRUNT_DU_PLAN_EQUILIBRE)} × ${pct(x.e.taux)} = ${eur(a.interets)}` },
          { libelle: "Capital remboursé fin N+1", attendu: a.remboursements, calcul: `${eur(EMPRUNT_DU_PLAN_EQUILIBRE)} ÷ ${x.e.dureeAns} = ${eur(a.remboursements)}` },
          {
            libelle: "CAF de N+1 ajustée",
            attendu: a.caf,
            calcul: `${eur(sans.caf)} − ${eur(a.interets)} d'intérêts + ${eur(economie)} d'impôt économisé sur eux = ${eur(a.caf)}`,
          },
          { libelle: "Solde de N+1", attendu: a.solde, calcul: `${enCalcul(sans.solde)} + ${eur(EMPRUNT_DU_PLAN_EQUILIBRE)} − ${eur(a.remboursements)} − ${eur(auCentime(sans.caf - a.caf))} de CAF en moins = ${eur(a.solde)}` },
        ];
      },
      explication: (c) => {
        const x = planDuChapitre(c);
        const a = x.equilibre.annees[0]!;
        return [
          `L'emprunt apporte ${eur(EMPRUNT_DU_PLAN_EQUILIBRE)}, mais il coûte ${eur(auCentime(a.interets * (1 - x.t)))} de CAF après impôt et ${eur(a.remboursements)} de remboursement dès N+1. C'est le piège de l'équilibrage : chaque ressource nouvelle crée ses propres emplois.`,
          "Un apport des associés aurait d'autres suites : pas d'intérêts, mais des dividendes à verser plus tard. Une subvention, elle, se reprendrait peu à peu en produit.",
        ];
      },
    },
    {
      id: "le-plan-equilibre",
      objectifs: [2],
      type: "a-completer",
      titre: "Le plan équilibré",
      notions: ["loan_schedule", "bfr", "cash_budget"],
      question: (c) => {
        const x = planDuChapitre(c);
        return `Sans formule : reprenez le plan avec l'emprunt de ${eur(EMPRUNT_DU_PLAN_EQUILIBRE)} sur ${x.e.dureeAns} ans. Chaque année, ses intérêts baissent la CAF, et son capital remboursé s'ajoute aux emplois.`;
      },
      grille: grilleDuPlanEquilibre,
      explication: (c) => {
        const x = planDuChapitre(c);
        const p = x.equilibre;
        return [
          `Chaque année finit positive : le plan est équilibré. Le plus petit solde est celui de ${p.plusPetit.annee}, ${eur(p.plusPetit.solde)}. Fin N+5, NOVA a accumulé ${eur(p.cumulFinal)}, après ${eur(p.interets)} d'intérêts.`,
          "Ces excédents ne sont pas perdus : ils financeront d'autres projets, des dividendes, ou un remboursement anticipé. Un plan « rationnel » les répartirait dès maintenant.",
        ];
      },
    },
    {
      id: "le-laboratoire-du-plan",
      objectifs: [2, 3],
      type: "simulation",
      titre: "Le laboratoire du plan",
      notions: ["loan_schedule", "cash_budget", "bfr"],
      question: () =>
        "Faites varier l'emprunt, sa durée, et la façon de tenir la ligne : achetée, ou en crédit-bail. Le tableau suit le solde de N+1, le plus petit solde du plan, le cumul de fin N+5 et les intérêts. Le graphique trace les soldes selon l'emprunt. Relevez le défi.",
      leviers: (c) => {
        const x = planDuChapitre(c);
        const L = LEVIERS_DU_PLAN;
        return [
          { code: "emprunt", libelle: "Emprunt de N+1", unite: "€", ...L.emprunt, depart: x.depart.emprunt },
          { code: "duree", libelle: "Durée de l'emprunt", unite: "ans", ...L.duree, depart: x.depart.duree },
          {
            code: "ligne",
            libelle: "La ligne",
            unite: "",
            min: LIGNE_ACHETEE,
            max: LIGNE_EN_CREDIT_BAIL,
            pas: 1,
            depart: x.depart.ligne,
            choix: [
              { valeur: LIGNE_ACHETEE, libelle: "Achetée" },
              { valeur: LIGNE_EN_CREDIT_BAIL, libelle: "En crédit-bail" },
            ],
          },
        ];
      },
      lecture: (c, p) => {
        const x = planDuChapitre(c);
        const l = planDeFinancementDeLaGamme(leviersDuLaboratoire(p));
        const d = x.ebauche;
        return [
          { libelle: "Solde de N+1", montant: l.annees[0]!.solde, reference: d.annees[0]!.solde },
          { libelle: `Plus petit solde du plan, en ${l.plusPetit.annee}`, montant: l.plusPetit.solde, reference: d.plusPetit.solde, fort: true },
          { libelle: "Solde cumulé fin N+5", montant: l.cumulFinal, reference: d.cumulFinal },
          { libelle: "Intérêts payés de N+1 à N+5", montant: l.interets, reference: d.interets },
        ];
      },
      graphique: () => ({
        levier: "emprunt",
        courbes: [
          { libelle: "Solde de N+1", valeur: (p) => planDeFinancementDeLaGamme(leviersDuLaboratoire(p)).annees[0]!.solde },
          { libelle: "Plus petit solde du plan", valeur: (p) => planDeFinancementDeLaGamme(leviersDuLaboratoire(p)).plusPetit.solde },
        ],
      }),
      defi: () => {
        const pas = LEVIERS_DU_PLAN.emprunt.pas;
        const tient = (p: Readonly<Record<string, number>>) => planDeFinancementDeLaGamme(leviersDuLaboratoire(p)).equilibre;
        return {
          consigne: `La ligne achetée, équilibrez chaque année du plan avec le plus petit emprunt possible, au pas de ${eur(pas)}, sur la durée de votre choix.`,
          atteint: (p) => p.ligne === LIGNE_ACHETEE && tient(p) && (p.emprunt === 0 || !tient({ ...p, emprunt: p.emprunt! - pas })),
          indice: (p) => {
            if (p.ligne !== LIGNE_ACHETEE) return "Le défi garde la ligne achetée : le crédit-bail fera l'objet de l'étape suivante.";
            const l = planDeFinancementDeLaGamme(leviersDuLaboratoire(p));
            if (!l.equilibre) return `${l.plusPetit.annee} finit à ${eur(l.plusPetit.solde)} : il manque encore de l'argent.`;
            return `Chaque année tient, mais un emprunt plus petit de ${eur(pas)} tiendrait aussi : moins de dette, moins d'intérêts.`;
          },
          solution: { emprunt: EMPRUNT_DU_PLAN_EQUILIBRE, duree: EMPRUNT_DE_LA_LIGNE.dureeAns, ligne: LIGNE_ACHETEE },
        };
      },
      explication: (_c, p) => {
        const l = planDeFinancementDeLaGamme(leviersDuLaboratoire(p));
        const court = planDeFinancementDeLaGamme({ emprunt: EMPRUNT_DU_PLAN_EQUILIBRE, dureeDeLEmprunt: LEVIERS_DU_PLAN.duree.min });
        return [
          `Défi relevé : ${eur(p.emprunt!)} sur ${p.duree} ans, et le plus petit solde est de ${eur(l.plusPetit.solde)}, en ${l.plusPetit.annee}.`,
          `La durée compte : sur ${LEVIERS_DU_PLAN.duree.min} ans, le même emprunt laisserait N+1 à ${eur(court.annees[0]!.solde)}, parce que l'annuité de la première année est plus lourde. Un emprunt plus long allège N+1, mais coûte plus d'intérêts.`,
          "Passez la ligne en crédit-bail : le plan tient sans aucun emprunt. L'étape suivante le chiffre.",
        ];
      },
    },
    {
      id: "le-credit-bail-dans-le-plan",
      objectifs: [3],
      type: "montants",
      titre: "Le crédit-bail dans le plan",
      notions: ["depreciation", "cash_budget"],
      question: (c) => {
        const x = planDuChapitre(c);
        const cb = CREDIT_BAIL_DE_LA_LIGNE;
        return `Reprenez le plan sans emprunt, la ligne en crédit-bail : ${eur(cb.redevance)} de redevance chaque année, une option de ${eur(cb.option)} fin N+5. Seuls les moules sont achetés et amortis. Calculez les emplois de N+1, la CAF de N+1 (impôt à ${pct(x.t)}), puis le solde de N+1.`;
      },
      champs: (c) => {
        const x = planDuChapitre(c);
        const a = x.creditBail.annees[0]!;
        return [
          { libelle: "Emplois de N+1", attendu: a.emplois, calcul: `${eur(a.investissements)} de moules + ${eur(a.augmentationDuBfr)} de BFR = ${eur(a.emplois)}` },
          {
            libelle: "CAF de N+1",
            attendu: a.caf,
            calcul: `l'EBE, redevance déduite, ${enCalcul(a.excedentBrut)}, moins l'impôt, (${enCalcul(a.excedentBrut)} − ${eur(a.dotations)}) × ${pct(x.t)} = ${eur(a.impot)} : ${enCalcul(a.excedentBrut)} − ${enCalcul(a.impot)} = ${eur(a.caf)}`,
          },
          { libelle: "Solde de N+1", attendu: a.solde, calcul: `${eur(RESERVE_DE_LA_GAMME)} + ${enCalcul(a.caf)} − ${eur(a.emplois)} = ${eur(a.solde)}` },
        ];
      },
      explication: (c) => {
        const x = planDuChapitre(c);
        const a = x.creditBail.annees[0]!;
        return [
          `Le crédit-bail retire ${eur(LIGNE_A_FINANCER.montant)} des emplois de N+1 : sans emprunt, l'année finit à ${eur(a.solde)}. En contrepartie, la redevance pèse sur la CAF chaque année, et l'option s'ajoute aux emplois de N+5.`,
          "Une CAF négative, comme ici, est une insuffisance d'autofinancement : l'activité de l'année consomme de l'argent au lieu d'en dégager.",
        ];
      },
    },
    {
      id: "le-plan-a-retenir",
      objectifs: [3],
      type: "choix",
      titre: "Le plan à retenir",
      notions: ["loan_schedule"],
      question: (c) => {
        const x = planDuChapitre(c);
        return `Les deux plans tiennent. Fin N+5, celui de l'emprunt cumule ${eur(x.equilibre.cumulFinal)}, celui du crédit-bail ${eur(x.creditBail.cumulFinal)}. Lequel le contrôleur recommande-t-il ?`;
      },
      options: (c) => {
        const x = planDuChapitre(c);
        const ecart = auCentime(x.equilibre.cumulFinal - x.creditBail.cumulFinal);
        return [
          {
            texte: "L'emprunt, qui laisse le plus d'argent",
            juste: true,
            retour: `Oui. Sur les ${ANNEES_DU_PLAN.length} ans, l'emprunt laisse ${eur(ecart)} de plus, et la ligne appartient à NOVA, sans option à payer. C'est le résultat du chapitre précédent, vu cette fois dans la caisse. Le crédit-bail reste une solution de repli si la banque refusait.`,
          },
          {
            texte: "Le crédit-bail, parce que N+1 y est bien plus confortable",
            juste: false,
            retour: "Une première année confortable ne fait pas un plan moins cher. L'emprunt tient aussi chaque année, et coûte moins sur la durée.",
          },
          {
            texte: "Aucun des deux : un plan doit finir à zéro, sans excédent",
            juste: false,
            retour: "Non : un plan équilibré demande des soldes positifs ou nuls, chaque année. Les excédents financeront la suite.",
          },
        ];
      },
    },
    {
      id: "plan-tableau-ou-budget",
      objectifs: [3],
      type: "choix",
      titre: "Plan, tableau ou budget",
      notions: ["cash_budget", "frng"],
      question: () => "Le banquier de NOVA demande trois documents : le plan de financement, le tableau de financement et le budget de trésorerie. Qu'est-ce qui distingue le plan de financement des deux autres ?",
      options: () => [
        {
          texte: "Il prévoit, sur plusieurs années",
          juste: true,
          retour: "Oui. Le plan de financement est prévisionnel et pluriannuel : il dit, avant d'investir, si les ressources suffiront. Le tableau de financement analyse après coup un exercice clos. Le budget de trésorerie prévoit mois par mois, sur un an au plus.",
        },
        {
          texte: "Il se dresse à la clôture, sur l'exercice écoulé, comme une analyse",
          juste: false,
          retour: "C'est le tableau de financement : un document d'analyse, établi après la clôture, qui explique la variation du fonds de roulement de l'exercice.",
        },
        {
          texte: "Il suit chaque mois les encaissements et les décaissements de l'année",
          juste: false,
          retour: "C'est le budget de trésorerie : quelques mois, un an au plus, le détail des entrées et des sorties d'argent.",
        },
      ],
    },
    {
      id: "synthese",
      type: "lecture",
      titre: "Ce que vous savez faire",
      notions: ["cash_budget", "bfr", "loan_schedule"],
      texte: (c) => {
        const x = planDuChapitre(c);
        return [
          `Vous avez recensé les emplois de la gamme, ${eur(x.investissement)} d'investissement et le BFR qui grandit, et ses ressources : la réserve de ${eur(RESERVE_DE_LA_GAMME)} et une CAF calculée année par année.`,
          `Le plan ébauché manquait de ${eur(x.deficit)} en N+1. Un emprunt de ${eur(EMPRUNT_DU_PLAN_EQUILIBRE)} l'équilibre, ses intérêts et ses annuités compris. Le crédit-bail tient aussi, mais laisse moins d'argent fin N+5.`,
          "Au niveau de l'examen, vous savez calculer des CAF prévisionnelles et des variations de BFR, dresser un plan ébauché puis équilibré, et commenter le financement retenu.",
          "Dans l'arène, les chiffres de votre entreprise seront différents : la démarche, elle, est la même.",
        ];
      },
      repere: () =>
        "Emplois : investissements, augmentation du BFR, remboursements, dividendes. Ressources : CAF, apports, emprunts, cessions, diminution du BFR. Solde = ressources − emplois, positif ou nul chaque année. Tout emprunt d'équilibrage baisse la CAF de ses intérêts après impôt, et ajoute ses remboursements aux emplois.",
    },
  ],
};
