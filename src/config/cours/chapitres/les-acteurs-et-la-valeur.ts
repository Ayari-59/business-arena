import { soldUnits } from "../../../engine/simulation/runGame";
import type { CompanyRoundResult } from "../../../engine/types";
import { montantEcrit } from "../../../pedagogy/cours/correcteur";
import { scenarioByCode } from "../../scenarios/registry";
import type { Cas } from "../cas";
import { anneeDeReference, rejouerAvec, type Changement } from "../gestion-de-la-pme";
import { ENTREPRISES_DU_COURS } from "../metiers";
import type { Chapitre, TableauDeDonnees } from "../types";

/**
 * CHAPITRE : LES ACTEURS DE L'ORGANISATION ET LE PARTAGE DE LA VALEUR (Bac STMG, management,
 * palier 1).
 *
 * Une entreprise ne vit pas seule : des clients la paient, des fournisseurs la livrent, des
 * salariés y travaillent, une banque lui prête, l'État prélève l'impôt, des associés y ont mis
 * leur argent. Chacun reçoit sa part de l'argent que paient les clients, et chacun voudrait que
 * la sienne soit plus grosse. Le chapitre lit ces parts dans les comptes de l'année du cours,
 * puis fait rejouer une demande des salariés, une hausse générale des salaires : ce que gagnent
 * les salariés, ce que perdent les associés et l'État, et ce que l'arène en fait.
 *
 * Il ne double pas « La valeur ajoutée et son partage » (gestion et finance), qui calcule la
 * richesse créée et ses parts ; ni « Rémunération et motivation » (ressources humaines), qui
 * juge une baisse de salaire sur la motivation et les départs. Ici, l'angle est celui du
 * management : qui sont les acteurs, ce que chacun reçoit, et pourquoi leurs attentes
 * s'opposent.
 *
 * D'où viennent les chiffres. L'année du cours (`anneeDeReference`, le bon gestionnaire,
 * arene-du-cours.ts) donne ce que chacun reçoit : les ventes que paient les clients, les achats
 * et services payés aux fournisseurs et prestataires (matières, publicité, qualité, entretien,
 * loyer et frais), les salaires (l'effectif de chaque trimestre au salaire du scénario,
 * cotisations comprises, à l'indice joué), les intérêts, l'impôt et le résultat net. L'arène ne
 * verse pas de dividendes : la part des associés reste dans l'entreprise, et le chapitre le dit.
 *
 * LA HAUSSE REJOUÉE (`anneeALaHausse`) : l'indice de salaire posé à `INDICE_DE_LA_HAUSSE` à
 * chaque trimestre, valeur absolue (le formulaire reconduit la décision jouée : un facteur
 * appliqué à chaque trimestre se composerait). Une décision de ressources humaines rejouée
 * remplace toute celle du trimestre : le changement garde donc ce que le gestionnaire décide
 * d'autre dans le trimestre, ses embauches comprises, et ne touche qu'au salaire. Le test
 * vérifie que les embauches de l'année rejouée sont celles de l'année du cours.
 */

/**
 * LA HAUSSE DEMANDÉE PAR LES SALARIÉS (hypothèse du cours) : 5 % de plus sur tous les salaires,
 * toute l'année, soit un indice de 105 quand le marché vaut 100. C'est l'ordre de grandeur d'une
 * négociation annuelle ; le cas « L'équipe demande une augmentation » (ressources humaines)
 * rejoue, lui, une hausse de 10 %.
 */
export const INDICE_DE_LA_HAUSSE = 1.05;

/**
 * Les entreprises du chapitre : toutes. Chacune paie des salaires, des intérêts et l'impôt, et
 * finit l'année du cours en bénéfice (le test le recompte).
 */
export const ENTREPRISES_DES_ACTEURS = ENTREPRISES_DU_COURS;

/** Un montant à la française, avec le signe moins typographique ; retranché, un négatif va entre parenthèses. */
const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const retranche = (x: number) => (x < 0 ? `(${eur(x)})` : eur(x));
const qte = (n: number) => n.toLocaleString("fr-FR").replace(/^-/, "−");
const pct = (t: number) => `${t.toLocaleString("fr-FR", { maximumFractionDigits: 1 }).replace(/^-/, "−")} %`;
const auDixieme = (x: number) => Math.round(x * 10) / 10;
const dE = (nom: string) => (/^[aeiouyéèêAEIOUYÉÈ]/.test(nom) ? `d'${nom}` : `de ${nom}`);
/** L'indice tel que la feuille de décision l'écrit : le marché vaut 100. */
const indiceEcrit = (i: number) => qte(Math.round(i * 100));
const ecartEnPourcent = Math.round((INDICE_DE_LA_HAUSSE - 1) * 100);

/** Le salaire de chaque trimestre posé à `INDICE_DE_LA_HAUSSE` ; le reste de la décision RH (les embauches) reste celui du gestionnaire. */
const salairesALaHausse: Changement = (_tour, d) => ({ ...d, hr: { ...(d.hr ?? {}), salaryIndex: INDICE_DE_LA_HAUSSE } });

/** L'année du cours rejouée avec la hausse des salaires. */
export const anneeALaHausse = (code: string) => rejouerAvec(code, `les-acteurs-et-la-valeur:salaires-a-${INDICE_DE_LA_HAUSSE}`, salairesALaHausse);

/** Ce que chaque acteur reçoit dans une année, arrondi à l'euro (à l'unité pour les ventes). */
export interface PartsDeLAnnee {
  ventes: number;
  unitesVendues: number;
  fournisseurs: number;
  salaires: number;
  interets: number;
  impot: number;
  resultatNet: number;
}

/**
 * Les parts d'une année rejouée. Les salaires sont l'effectif de chaque trimestre au salaire du
 * scénario, à l'indice joué ; un trimestre sans décision de ressources humaines (le premier de
 * l'année du cours) garde l'effectif de départ, au salaire du marché. Les fournisseurs et
 * prestataires reçoivent toutes les autres charges payées à d'autres entreprises.
 */
export function partsDeLAnnee(c: Cas, annee: readonly CompanyRoundResult[]): PartsDeLAnnee {
  const hr = scenarioByCode(c.code).scenario.hr!;
  const somme = (f: (r: CompanyRoundResult) => number) => Math.round(annee.reduce((t, r) => t + f(r), 0));
  const salaire = (r: CompanyRoundResult) => (r.hr?.headcount ?? c.personnel.effectif) * hr.salaryPerEmployeePerRound * (r.hr?.salaryIndex ?? 1);
  const charges = (r: CompanyRoundResult) => {
    const i = r.incomeStatement;
    return i.variableProductionCost + (i.commissionCost ?? 0) + i.marketingCost + i.qualityCost + i.maintenanceCost + (i.engagementRse ?? 0) + (i.rdCost ?? 0) + i.fixedCosts;
  };
  const salaires = somme(salaire);
  return {
    ventes: somme((r) => r.incomeStatement.revenue),
    unitesVendues: somme(soldUnits),
    fournisseurs: somme(charges) - salaires,
    salaires,
    interets: somme((r) => r.incomeStatement.interest),
    impot: somme((r) => r.incomeStatement.tax),
    resultatNet: somme((r) => r.incomeStatement.netIncome),
  };
}

export type QuiPaie = "associes" | "etat" | "personne";

/** L'année du cours, ses parts, la hausse rejouée et qui la paie. */
export function acteursEtValeur(c: Cas) {
  const ref = anneeDeReference(c.code);
  const hausse = anneeALaHausse(c.code);
  const avant = partsDeLAnnee(c, ref);
  const apres = partsDeLAnnee(c, hausse);
  const part = (x: number) => auDixieme((x / avant.ventes) * 100);
  const ecartDeSalaires = apres.salaires - avant.salaires;
  const ecartDImpot = apres.impot - avant.impot;
  const ecartDeResultat = apres.resultatNet - avant.resultatNet;
  const partDesAssocies = auDixieme((-ecartDeResultat / ecartDeSalaires) * 100);
  const partDeLEtat = auDixieme((-ecartDImpot / ecartDeSalaires) * 100);
  const quiPaie: QuiPaie = ecartDeResultat >= 0 ? "personne" : -ecartDeResultat >= -ecartDImpot ? "associes" : "etat";
  const capaciteAvant = ref[0]!.production.laborCapacity;
  const capaciteApres = hausse[0]!.production.laborCapacity;
  return {
    avant,
    apres,
    partDesSalaries: part(avant.salaires),
    partDeLEtatDansLesVentes: part(avant.impot),
    partDesAssociesDansLesVentes: part(avant.resultatNet),
    ecartDeSalaires,
    ecartDImpot,
    ecartDeResultat,
    ecartDeVentes: apres.unitesVendues - avant.unitesVendues,
    ecartDeChiffre: apres.ventes - avant.ventes,
    ecartFournisseurs: apres.fournisseurs - avant.fournisseurs,
    ecartDInterets: apres.interets - avant.interets,
    partDesAssocies,
    partDeLEtat,
    /** Ce que la motivation ajoute à ce que l'équipe peut produire, au premier trimestre, en pourcentage. */
    gainDeCapacite: auDixieme((capaciteApres / capaciteAvant - 1) * 100),
    tauxDImpot: scenarioByCode(c.code).scenario.finance.taxRate,
    quiPaie,
  };
}

/** Les six acteurs, et ce que chacun reçoit dans une année. */
function lignesDesActeurs(p: PartsDeLAnnee) {
  return [
    { libelle: "Les clients : les ventes qu'ils ont payées", montant: p.ventes },
    { libelle: "Les fournisseurs et prestataires : achats et services", montant: p.fournisseurs },
    { libelle: "Les salariés : salaires et cotisations", montant: p.salaires },
    { libelle: "Les prêteurs : intérêts de l'emprunt", montant: p.interets },
    { libelle: "L'État : impôt sur les bénéfices", montant: p.impot },
    { libelle: "Les associés : résultat net", montant: p.resultatNet },
  ];
}

function tableauDeLAnnee(c: Cas): TableauDeDonnees {
  const k = acteursEtValeur(c);
  return {
    titre: `Ce que chaque acteur ${dE(c.entreprise)} a reçu dans l'année`,
    colonnes: ["Sur l'année"],
    lignes: lignesDesActeurs(k.avant).map((l) => ({ libelle: l.libelle, valeurs: [eur(l.montant)] })),
  };
}

function tableauDeLaHausse(c: Cas): TableauDeDonnees {
  const k = acteursEtValeur(c);
  const avant = lignesDesActeurs(k.avant);
  const apres = lignesDesActeurs(k.apres);
  return {
    titre: `L'année ${dE(c.entreprise)}, rejouée avec des salaires ${ecartEnPourcent} % plus hauts`,
    colonnes: ["Salaires habituels", `Salaires à ${indiceEcrit(INDICE_DE_LA_HAUSSE)}`],
    lignes: [
      { libelle: `Ventes (${c.unites})`, valeurs: [qte(k.avant.unitesVendues), qte(k.apres.unitesVendues)] },
      ...avant.map((l, i) => ({ libelle: l.libelle, valeurs: [eur(l.montant), eur(apres[i]!.montant)] })),
    ],
  };
}

/** Ce que la hausse a fait aux ventes, en une phrase. */
function ventesDeLaHausse(c: Cas, k: ReturnType<typeof acteursEtValeur>) {
  if (k.ecartDeVentes === 0) {
    return `Les ventes n'ont pas bougé : ${qte(k.avant.unitesVendues)} ${c.unites} dans les deux années. L'équipe, plus motivée, pouvait produire ${pct(k.gainDeCapacite)} de plus, mais il faut aussi des clients, des machines et une production prévue pour en profiter.`;
  }
  return k.ecartDeVentes > 0
    ? `L'équipe, plus motivée, a fait vendre ${qte(k.ecartDeVentes)} ${c.unites} de plus dans l'année.`
    : `Les ventes ont baissé de ${qte(-k.ecartDeVentes)} ${c.unites} dans l'année.`;
}

export const LES_ACTEURS_ET_LA_VALEUR: Chapitre = {
  code: "les-acteurs-et-la-valeur",
  parcours: "stmg-management",
  palier: 1,
  blocs: ["STMG Thème 2 · Les organisations et les acteurs"],
  titre: "Les acteurs de l'organisation et le partage de la valeur",
  accroche:
    "Clients, fournisseurs, salariés, prêteurs, État, associés : chacun reçoit sa part de ce que l'entreprise encaisse, et chacun en voudrait davantage. L'arène rejoue une hausse des salaires : qui gagne, qui perd ?",
  objectifs: [
    "Nommer les acteurs d'une organisation et ce que chacun en reçoit",
    "Calculer la part de chacun dans ce que paient les clients",
    "Repérer des attentes qui s'opposent",
    "Chiffrer qui gagne et qui perd quand une demande est acceptée",
  ],
  libre: false,
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Ceux qui font vivre l'entreprise",
      notions: ["income_statement", "payroll"],
      tableau: tableauDeLAnnee,
      texte: (c) => {
        const k = acteursEtValeur(c);
        return [
          `Dans l'année, les clients ${dE(c.entreprise)} lui ont payé ${eur(k.avant.ventes)} (ventes de l'année : ${qte(k.avant.unitesVendues)} ${c.unites}). Cet argent ne reste pas dans l'entreprise : il passe aux fournisseurs et prestataires qui l'ont livrée, aux salariés qui ont travaillé, à la banque qui lui a prêté, à l'État qui prélève l'impôt. Ce qui reste, le résultat net, revient aux associés qui ont apporté le capital.`,
          "Ce sont les acteurs de l'organisation, qu'on appelle aussi ses parties prenantes. Chacun attend quelque chose d'elle : les clients, un bon produit au juste prix ; les fournisseurs, des commandes payées à temps ; les salariés, un salaire et de bonnes conditions de travail ; les prêteurs, des intérêts et le remboursement ; l'État, l'impôt et des emplois ; les associés, un résultat qui rémunère leur apport.",
          "Dans l'arène, l'entreprise ne verse pas de dividendes : le résultat net reste chez elle, mais il appartient aux associés.",
        ];
      },
      repere: () => "Les acteurs d'une organisation (ses parties prenantes) se partagent ce qu'elle encaisse, et leurs attentes ne vont pas toutes dans le même sens.",
    },
    {
      id: "parts",
      type: "montants",
      titre: "Sur 100 € payés par les clients",
      notions: ["income_statement", "payroll"],
      tableau: tableauDeLAnnee,
      question: (c) =>
        `Sur 100 € que les clients ${dE(c.entreprise)} ont payés dans l'année, combien sont allés aux salariés, à l'État et aux associés ? Calculez chaque part (montant reçu ÷ ventes × 100), en pourcentage au dixième.`,
      champs: (c) => {
        const k = acteursEtValeur(c);
        return [
          { libelle: "Part des salariés (%)", attendu: k.partDesSalaries, calcul: `${eur(k.avant.salaires)} ÷ ${eur(k.avant.ventes)} × 100 = ${pct(k.partDesSalaries)}`, tolerance: 0.1 },
          { libelle: "Part de l'État (%)", attendu: k.partDeLEtatDansLesVentes, calcul: `${eur(k.avant.impot)} ÷ ${eur(k.avant.ventes)} × 100 = ${pct(k.partDeLEtatDansLesVentes)}`, tolerance: 0.1 },
          { libelle: "Part des associés (%)", attendu: k.partDesAssociesDansLesVentes, calcul: `${eur(k.avant.resultatNet)} ÷ ${eur(k.avant.ventes)} × 100 = ${pct(k.partDesAssociesDansLesVentes)}`, tolerance: 0.1 },
        ];
      },
      explication: (c) => {
        const k = acteursEtValeur(c);
        return [
          `Sur 100 € payés par les clients, ${c.entreprise} en verse ${pct(k.partDesSalaries).replace(" %", " €")} à ses salariés, ${pct(k.partDeLEtatDansLesVentes).replace(" %", " €")} à l'État, et en garde ${pct(k.partDesAssociesDansLesVentes).replace(" %", " €")} pour ses associés. ${
            k.partDesSalaries > k.partDesAssociesDansLesVentes
              ? "Les salariés reçoivent plus que les associés : c'est le cas de la plupart des entreprises."
              : "Les associés reçoivent plus que les salariés : c'est rare."
          }`,
          "Ces parts sont liées : à ventes égales, un euro de plus pour les uns est un euro de moins pour les autres.",
        ];
      },
    },
    {
      id: "attentes",
      type: "choix",
      titre: "Des attentes qui s'opposent",
      notions: ["pay_and_motivation"],
      question: (c) =>
        `Les salariés ${dE(c.entreprise)} demandent une hausse de ${ecartEnPourcent} % de tous les salaires, toute l'année. Avant de rejouer l'année, quel acteur a l'attente qui s'oppose le plus directement à la leur ?`,
      options: (c) => {
        const k = acteursEtValeur(c);
        return [
          {
            texte: "Les associés : un salaire en plus est une charge de plus",
            juste: true,
            retour: `Oui : à ventes égales, chaque euro de salaire en plus est un euro de charge, qui fait baisser le résultat net, la part des associés (${eur(k.avant.resultatNet)} cette année).`,
          },
          {
            texte: "Les clients : une hausse des salaires monte forcément les prix",
            juste: false,
            retour: "Non : l'entreprise peut monter ses prix, mais rien ne l'y oblige, et ses clients pourraient alors aller chez les concurrents. Le prix est un choix de gestion, pas une conséquence automatique.",
          },
          {
            texte: "Les fournisseurs : l'entreprise devra leur acheter moins",
            juste: false,
            retour: "Non : ce qu'elle achète dépend de ce qu'elle produit et vend, pas de ce qu'elle paie ses salariés.",
          },
        ];
      },
    },
    {
      id: "hausse",
      type: "montants",
      titre: "La hausse rejouée dans l'arène",
      notions: ["payroll", "income_statement"],
      tableau: tableauDeLaHausse,
      question: (c) =>
        `L'arène a rejoué l'année ${dE(c.entreprise)} avec des salaires à ${indiceEcrit(INDICE_DE_LA_HAUSSE)} (le marché vaut 100) à chaque trimestre, les mêmes concurrents et la même façon de gérer. Calculez les écarts de salaires, d'impôt et de résultat net (avec la hausse moins sans), puis la part de la hausse payée par les associés (résultat net perdu ÷ hausse des salaires × 100, au dixième).`,
      champs: (c) => {
        const k = acteursEtValeur(c);
        return [
          { libelle: "Écart de salaires", attendu: k.ecartDeSalaires, calcul: `${eur(k.apres.salaires)} − ${eur(k.avant.salaires)} = ${eur(k.ecartDeSalaires)}`, tolerance: 1 },
          { libelle: "Écart d'impôt", attendu: k.ecartDImpot, calcul: `${eur(k.apres.impot)} − ${eur(k.avant.impot)} = ${eur(k.ecartDImpot)}`, tolerance: 1 },
          { libelle: "Écart de résultat net", attendu: k.ecartDeResultat, calcul: `${eur(k.apres.resultatNet)} − ${retranche(k.avant.resultatNet)} = ${eur(k.ecartDeResultat)}`, tolerance: 1 },
          {
            libelle: "Part de la hausse payée par les associés (%)",
            attendu: k.partDesAssocies,
            calcul: `${eur(-k.ecartDeResultat)} ÷ ${eur(k.ecartDeSalaires)} × 100 = ${pct(k.partDesAssocies)}`,
            tolerance: 0.1,
          },
        ];
      },
      explication: (c) => {
        const k = acteursEtValeur(c);
        return [
          `Les salariés reçoivent ${eur(k.ecartDeSalaires)} de plus dans l'année. ${ventesDeLaHausse(c, k)}`,
          k.ecartDeResultat < 0
            ? `Le résultat net baisse de ${eur(-k.ecartDeResultat)} et l'impôt de ${eur(-k.ecartDImpot)} : les associés paient ${pct(k.partDesAssocies)} de la hausse, l'État ${pct(k.partDeLEtat)}. L'impôt se calcule sur le bénéfice (${pct(k.tauxDImpot * 100)} ici) : un bénéfice plus petit en fait payer moins.`
            : `Le résultat net ne baisse pas : ce que l'équipe a fait gagner couvre la hausse.`,
        ];
      },
    },
    {
      id: "qui-paie",
      type: "choix",
      titre: "Qui paie la hausse ?",
      notions: ["payroll", "income_statement"],
      tableau: tableauDeLaHausse,
      question: (c) => {
        const k = acteursEtValeur(c);
        return `Avec la hausse, les salariés ${dE(c.entreprise)} reçoivent ${eur(k.ecartDeSalaires)} de plus dans l'année. Qui la paie ?`;
      },
      options: (c) => {
        const k = acteursEtValeur(c);
        const chiffres = `Le résultat net varie de ${eur(k.ecartDeResultat)}, l'impôt de ${eur(k.ecartDImpot)}, le chiffre d'affaires de ${eur(k.ecartDeChiffre)}.`;
        return [
          {
            texte: "Surtout les associés, et l'État pour une part",
            juste: k.quiPaie === "associes",
            retour:
              k.quiPaie === "associes"
                ? `Oui : les associés en paient ${pct(k.partDesAssocies)} par un résultat net plus petit, l'État ${pct(k.partDeLEtat)} par un impôt plus petit. ${chiffres}`
                : `Non. ${chiffres}`,
          },
          {
            texte: "Surtout l'État, qui perd de l'impôt",
            juste: k.quiPaie === "etat",
            retour:
              k.quiPaie === "etat"
                ? `Oui : l'impôt baisse plus que le résultat net. ${chiffres}`
                : `Non : l'État n'en paie que ${pct(k.partDeLEtat)}, par un impôt plus petit. ${chiffres}`,
          },
          {
            texte: "Les clients, par des prix plus hauts",
            juste: false,
            retour:
              k.ecartDeChiffre === 0
                ? `Non : les clients paient exactement la même chose, ${eur(k.apres.ventes)} dans les deux années. Les prix n'ont pas bougé.`
                : `Non : les ventes varient de ${eur(k.ecartDeChiffre)}, loin de couvrir la hausse. ${chiffres}`,
          },
          {
            texte: "Personne : une équipe motivée vend assez pour la payer",
            juste: k.quiPaie === "personne",
            retour:
              k.quiPaie === "personne"
                ? `Oui : le résultat net ne baisse pas. ${chiffres}`
                : `Non : ${k.ecartDeVentes === 0 ? "les ventes n'ont pas bougé" : `les ventes varient de ${qte(k.ecartDeVentes)} ${c.unites}`}, et le résultat net baisse de ${eur(-k.ecartDeResultat)}.`,
          },
        ];
      },
    },
    {
      id: "synthese",
      type: "lecture",
      titre: "Ce qu'il faut retenir",
      notions: ["income_statement", "pay_and_motivation"],
      texte: (c) => {
        const k = acteursEtValeur(c);
        return [
          `Chez ${c.entreprise}, une hausse de ${ecartEnPourcent} % des salaires donne ${eur(k.ecartDeSalaires)} de plus aux salariés. ${
            k.quiPaie === "personne"
              ? "Cette année, l'équipe plus motivée a vendu assez pour que personne ne la paie."
              : `Les associés en paient ${pct(k.partDesAssocies)}, l'État ${pct(k.partDeLEtat)}. ${
                  k.ecartDeChiffre === 0 && k.ecartFournisseurs === 0 && k.ecartDInterets === 0
                    ? "Les clients, les fournisseurs et les prêteurs n'y voient rien : les ventes, les achats et les intérêts sont les mêmes."
                    : `Pour les autres, presque rien : le chiffre d'affaires varie de ${eur(k.ecartDeChiffre)}, les achats et services de ${eur(k.ecartFournisseurs)}, les intérêts de ${eur(k.ecartDInterets)}.`
                }`
          }`,
          "Les attentes des acteurs s'opposent souvent : ce que l'un gagne, un autre le perd. Le rôle du management est d'arbitrer entre elles, en chiffrant ce que chaque choix donne à chacun. L'arène ne compte pas tout ce qu'une hausse peut apporter d'autre : des salariés qui restent, un recrutement plus facile, une meilleure image de l'employeur.",
        ];
      },
      repere: () => "Accepter une demande d'un acteur, c'est décider qui la paie : le chiffrer, c'est voir qui gagne et qui perd.",
    },
  ],
};
