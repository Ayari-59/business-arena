import { arrondi2 as auCentime, eur, nombreAuCentieme, pct, taux2 } from "../../../../pedagogy/cours/deux-decimales";
import type { Cas } from "../../cas";
import { ENTREPRISES_DU_COMPTE_DE_RESULTAT, exerciceDeLaBoutique } from "../../chapitres/le-compte-de-resultat-de-la-boutique";
import { FINANCEMENT_DE_L_OUVERTURE, IMPOT_SUR_LES_SOCIETES, impotSurLesSocietes } from "../../monde/comptes-de-la-boutique";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « LE COMPTE DE RÉSULTAT DE LA BOUTIQUE » : LE BAIL RÉVISÉ (BTS MCO, palier 4).
 *
 * LE CAS JOUE DANS LE MONDE DU COURS : l'exercice N − 1 de MAILLE & CO (monde/comptes-de-la-boutique.ts,
 * lu par `exerciceDeLaBoutique`).
 *
 * Le bailleur révise le loyer de 6 % au 1er janvier N. La gérante veut savoir ce que deviendraient l'EBE,
 * le résultat net et la CAF de N si tout le reste était celui de N − 1, et de combien remonter le prix
 * moyen pour garder l'EBE de N − 1. L'élève refait seul les soldes du chapitre sur une année projetée,
 * puis répond.
 *
 * Les pièges : retirer la hausse du loyer du résultat net au lieu de l'EBE (l'impôt en absorbe une part) ;
 * oublier que les intérêts baissent avec l'emprunt et que la provision de N − 1 ne revient pas.
 *
 * LES CALCULS SE FONT À DEUX CHIFFRES APRÈS LA VIRGULE (décision du propriétaire, 10 novembre 2026,
 * pedagogy/cours/deux-decimales.ts) : le taux d'EBE se donne à deux décimales, à un centième près (au
 * dixième, avant).
 */

/** LA RÉVISION DU BAIL (hypothèse du cours) : + 6 % sur le loyer hors taxes locales, au 1er janvier N. */
export const HAUSSE_DU_LOYER = 0.06;

const qte = nombreAuCentieme;

/** L'année N projetée : N − 1, avec le loyer révisé, sans la provision, avec les intérêts de N. */
export function bailRevise(c: Pick<Cas, "code">) {
  const x = exerciceDeLaBoutique(c);
  const n1 = x.n1;
  const loyer = auCentime(n1.loyer * (1 + HAUSSE_DU_LOYER));
  const hausse = auCentime(loyer - n1.loyer);
  const ebe = auCentime(n1.ebe - hausse);
  const dotations = n1.amortissements;
  const e = FINANCEMENT_DE_L_OUVERTURE.emprunt;
  const interets = auCentime((e.capital - 3 * e.remboursementAnnuel) * e.taux);
  const resultatCourant = auCentime(ebe - dotations - interets);
  const impot = impotSurLesSocietes(resultatCourant);
  const resultatNet = auCentime(resultatCourant - impot);
  const caf = auCentime(resultatNet + dotations);
  const hausseDePrix = Math.ceil((hausse / n1.articles) * 100 - 1e-9) / 100;
  return { ...x, loyer, hausse, ebe, tauxDEbe: taux2(ebe, n1.ventes), dotations, interets, resultatCourant, impot, resultatNet, caf, hausseDePrix, prixQuiCompense: auCentime(n1.prixMoyen + hausseDePrix) };
}

const tableauDeNMoins1 = (c: Pick<Cas, "code">) => {
  const x = exerciceDeLaBoutique(c);
  const d = x.n1;
  return {
    titre: `${x.f.entreprise} · l'exercice N − 1`,
    colonnes: ["N − 1"],
    lignes: [
      { libelle: "Articles vendus, prix moyen", valeurs: [`${qte(d.articles)}, ${eur(d.prixMoyen)}`] },
      { libelle: "Chiffre d'affaires", valeurs: [eur(d.ventes)] },
      { libelle: "Loyer et charges locatives", valeurs: [eur(d.loyer)] },
      { libelle: "Excédent brut d'exploitation", valeurs: [eur(d.ebe)] },
      { libelle: "Amortissement, provision pour litige", valeurs: [`${eur(d.amortissements)}, ${eur(d.provisions)}`] },
      { libelle: "Emprunt restant dû au 1er janvier N", valeurs: [eur(FINANCEMENT_DE_L_OUVERTURE.emprunt.capital - 3 * FINANCEMENT_DE_L_OUVERTURE.emprunt.remboursementAnnuel)] },
    ],
  };
};

export const LE_BAIL_REVISE: Situation = {
  code: "le-bail-revise",
  parcours: "mco",
  palier: 4,
  blocs: [],
  reprend: ["le-compte-de-resultat-de-la-boutique"],
  commanditaire: "La gérante",
  titre: "Le bail révisé",
  accroche: "Le bailleur augmente le loyer au 1er janvier. La gérante veut savoir ce qu'il restera de l'EBE, du résultat et de la CAF, et de combien remonter les prix pour garder l'EBE.",
  objectifs: [
    "Projeter l'EBE d'une année quand une charge change",
    "Passer de l'EBE au résultat net et à la CAF",
    "Calculer la hausse de prix moyen qui compense une charge",
    "Répondre à la gérante sur l'effet d'une hausse de charge",
  ],
  libre: false,
  entreprises: {
    codes: ENTREPRISES_DU_COMPTE_DE_RESULTAT,
    pourquoi: "ce cas reprend l'exercice du chapitre, à la boutique MAILLE & CO, le seul point de vente que la simulation du cours suit d'un chapitre à l'autre.",
  },
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "La demande de la gérante",
      tableau: tableauDeNMoins1,
      texte: () => [
        `« Le bailleur révise le loyer de ${pct(HAUSSE_DU_LOYER * 100)} au 1er janvier N. Si nous vendons comme en N − 1, aux mêmes prix et avec la même équipe, que deviennent l'EBE, le résultat net et la CAF ? Et de combien faudrait-il remonter le prix moyen d'un article pour garder l'EBE de N − 1 ? »`,
        `Pas de cours cette fois : la méthode est celle du chapitre. Le litige provisionné en N − 1 ne se reproduit pas ; l'emprunt baisse de ${eur(FINANCEMENT_DE_L_OUVERTURE.emprunt.remboursementAnnuel)} par an, à ${pct(FINANCEMENT_DE_L_OUVERTURE.emprunt.taux * 100)} ; l'impôt est de ${pct(IMPOT_SUR_LES_SOCIETES.tauxReduit * 100)} jusqu'à ${eur(IMPOT_SUR_LES_SOCIETES.plafondDuTauxReduit)}, ${pct(IMPOT_SUR_LES_SOCIETES.tauxNormal * 100)} au-delà.`,
      ],
      repere: () => "À rendre : le loyer de N, l'EBE et son taux, le résultat courant, l'impôt, le résultat net, la CAF, la hausse de prix moyen qui compense, et votre réponse.",
    },
    {
      id: "l-ebe-de-n",
      type: "montants",
      titre: "L'EBE de N",
      notions: ["ebitda_margin"],
      tableau: tableauDeNMoins1,
      question: () => "Calculez le loyer de N, l'EBE de N, puis le taux d'EBE (en %, à deux décimales).",
      champs: (c) => {
        const x = bailRevise(c);
        return [
          { libelle: "Loyer de N", attendu: x.loyer, calcul: `${eur(x.n1.loyer)} × ${qte(1 + HAUSSE_DU_LOYER)} = ${eur(x.loyer)}` },
          { libelle: "EBE de N", attendu: x.ebe, calcul: `${eur(x.n1.ebe)} − ${eur(x.hausse)} = ${eur(x.ebe)}` },
          { libelle: "Taux d'EBE (%)", attendu: x.tauxDEbe, calcul: `${eur(x.ebe)} ÷ ${eur(x.n1.ventes)} × 100 = ${pct(x.tauxDEbe)}` },
        ];
      },
      explication: (c) => {
        const x = bailRevise(c);
        return [`Le loyer prend ${eur(x.hausse)} : l'EBE baisse d'autant, à ${eur(x.ebe)}. Le taux d'EBE passe de ${pct(auCentime(x.n1.tauxDEbe * 100))} à ${pct(x.tauxDEbe)}.`];
      },
    },
    {
      id: "jusqu-a-la-caf",
      type: "montants",
      titre: "Du résultat à la CAF",
      notions: ["income_statement"],
      question: () => "Sans provision cette année, calculez les intérêts de N, le résultat courant avant impôt, l'impôt sur les sociétés, le résultat net puis la capacité d'autofinancement.",
      champs: (c) => {
        const x = bailRevise(c);
        const i = IMPOT_SUR_LES_SOCIETES;
        return [
          { libelle: "Intérêts de N", attendu: x.interets, calcul: `${eur(FINANCEMENT_DE_L_OUVERTURE.emprunt.capital - 3 * FINANCEMENT_DE_L_OUVERTURE.emprunt.remboursementAnnuel)} × ${pct(FINANCEMENT_DE_L_OUVERTURE.emprunt.taux * 100)} = ${eur(x.interets)}` },
          { libelle: "Résultat courant avant impôt", attendu: x.resultatCourant, calcul: `${eur(x.ebe)} − ${eur(x.dotations)} − ${eur(x.interets)} = ${eur(x.resultatCourant)}` },
          { libelle: "Impôt sur les sociétés", attendu: x.impot, calcul: `${eur(i.plafondDuTauxReduit)} × ${pct(i.tauxReduit * 100)} + (${eur(x.resultatCourant)} − ${eur(i.plafondDuTauxReduit)}) × ${pct(i.tauxNormal * 100)} = ${eur(x.impot)}` },
          { libelle: "Résultat net", attendu: x.resultatNet, calcul: `${eur(x.resultatCourant)} − ${eur(x.impot)} = ${eur(x.resultatNet)}` },
          { libelle: "Capacité d'autofinancement", attendu: x.caf, calcul: `${eur(x.resultatNet)} + ${eur(x.dotations)} = ${eur(x.caf)}` },
        ];
      },
      explication: (c) => {
        const x = bailRevise(c);
        return [
          `Le résultat net de N serait de ${eur(x.resultatNet)}, ${x.resultatNet >= x.n1.resultatNet ? "plus" : "moins"} qu'en N − 1 (${eur(x.n1.resultatNet)}) : la provision ne revient pas et les intérêts baissent. Le loyer, lui, pèse toute l'année : l'EBE recule.`,
        ];
      },
    },
    {
      id: "le-prix-qui-compense",
      type: "montants",
      titre: "Le prix qui compense",
      notions: ["ebitda_margin", "markdown"],
      question: (c) => `Aux ${qte(bailRevise(c).n1.articles)} articles de N − 1, calculez la hausse du prix moyen qui compense la hausse du loyer (au centime supérieur), puis le prix moyen à viser.`,
      champs: (c) => {
        const x = bailRevise(c);
        return [
          { libelle: "Hausse du prix moyen", attendu: x.hausseDePrix, calcul: `${eur(x.hausse)} ÷ ${qte(x.n1.articles)} = ${qte(auCentime(x.hausse / x.n1.articles))} €, au centime supérieur ${eur(x.hausseDePrix)}` },
          { libelle: "Prix moyen à viser", attendu: x.prixQuiCompense, calcul: `${eur(x.n1.prixMoyen)} + ${eur(x.hausseDePrix)} = ${eur(x.prixQuiCompense)}` },
        ];
      },
      explication: (c) => {
        const x = bailRevise(c);
        return [`Il suffit de ${eur(x.hausseDePrix)} de plus par article, ${pct(auCentime((x.hausseDePrix / x.n1.prixMoyen) * 100))} du prix moyen : un peu moins de remises suffit, sans toucher aux étiquettes.`];
      },
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre réponse à la gérante",
      question: () => "Quelle phrase envoyez-vous à la gérante ?",
      options: (c) => {
        const x = bailRevise(c);
        return [
          { texte: `L'EBE perd ${eur(x.hausse)} ; ${eur(x.hausseDePrix)} de prix moyen le rattrape`, juste: true, retour: `Oui : l'EBE tomberait à ${eur(x.ebe)}. Le résultat net (${eur(x.resultatNet)}) et la CAF (${eur(x.caf)}) mêlent la fin de la provision et des intérêts plus bas : c'est l'EBE qui dit ce que le loyer coûte à l'exploitation. Moins de remises le rattrape.` },
          { texte: `Le résultat net perd ${eur(x.hausse)}, autant que la hausse du loyer`, juste: false, retour: `Non : l'impôt absorbe une part de la hausse, et la provision de N − 1 ne revient pas. C'est l'EBE qui perd ${eur(x.hausse)}.` },
          { texte: `Rien à faire : le résultat net ne perd que ${eur(auCentime(x.n1.resultatNet - x.resultatNet))}`, juste: false, retour: "Le résultat net baisse peu parce que la provision ne revient pas et que les intérêts baissent : l'exploitation, elle, paie tout le loyer en plus, et l'EBE le montre." },
          { texte: `Il faut monter les étiquettes de ${pct(HAUSSE_DU_LOYER * 100)}`, juste: false, retour: `Non : le loyer ne pèse qu'une part des ventes ; ${eur(x.hausseDePrix)} par article suffit, ${pct(auCentime((x.hausseDePrix / x.n1.prixMoyen) * 100))} du prix moyen.` },
        ];
      },
    },
  ],
};
