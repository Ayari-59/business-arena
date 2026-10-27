import { montantEcrit } from "../../../pedagogy/cours/correcteur";
import { PART_DE_QUALITE_NEUTRE } from "../../../engine/bots";
import { computeProducedQuality, updatePerceivedQuality } from "../../../engine/production";
import { soldUnits } from "../../../engine/simulation/runGame";
import type { CompanyRoundResult } from "../../../engine/types";
import { scenarioByCode } from "../../scenarios/registry";
import { accordPluriel } from "../accords";
import { anneeJouee, type Cas } from "../cas";
import { anneeDeReference, rejouerAvec, surLAnnee, type Changement } from "../gestion-de-la-pme";
import type { Chapitre, TableauDeDonnees } from "../types";
import { ENTREPRISES_DE_LA_PRODUCTION } from "./produire";

/**
 * CHAPITRE : PRODUIRE BIEN, LA QUALITÉ ET CE QU'ELLE COÛTE (bac STMG, management, palier 1).
 *
 * L'arène mesure deux qualités. La qualité produite, celle de ce que l'entreprise fait dans le
 * trimestre (`production.producedQuality`, 1 pour la qualité ordinaire du secteur, que le chapitre
 * écrit en indice 100) : elle monte avec le budget qualité, à rendements décroissants, et baisse
 * quand les équipements tournent au-delà du seuil de surchauffe (`computeProducedQuality`). La
 * qualité perçue, celle que voient les clients et qui les attire : elle suit la qualité produite
 * avec inertie (`updatePerceivedQuality`, `production.qualityInertia`). Là où le scénario chiffre
 * la non-qualité (`qualityCosts`, au bistrot et à la boutique en ligne), une part de la production
 * part en rebuts, comptés à leur coût de production.
 *
 * LE BUDGET DU REJEU. Le bon gestionnaire de l'arène ne met aucun budget qualité dans sept
 * entreprises sur neuf : le formulaire n'en propose pas là où la mesure du propriétaire a montré
 * qu'il ne paie pas (`qualiteProposee`). Une part du budget de l'année ne vaudrait donc rien. Le
 * rejeu pose un budget ABSOLU, nommé : celui que la gestion neutre du secteur engage
 * (`PART_DE_QUALITE_NEUTRE` × `production.qualityScale`, la garde le compare à `neutralDecisions`),
 * posé tel quel à chaque trimestre, sans rien multiplier de la décision reçue. Là où le gestionnaire
 * le met déjà (le bistrot, le transporteur), l'arène rejoue l'année sans budget. Les deux années
 * comparées sont donc toujours « sans budget » et « avec le budget du secteur », l'une des deux
 * étant l'année du cours.
 *
 * Le verdict se calcule sur l'écart de résultat de l'activité : le budget se paie par les ventes
 * qu'il fait gagner, par les rebuts qu'il évite, ou ne se paie pas. Le chapitre dit enfin si l'arène
 * donne raison au bon gestionnaire.
 *
 * Ce que le chapitre ne double pas : « Le coût de la non-qualité » (BTS GPME) compare quatre
 * budgets de prévention au bistrot et une démarche qualité ; « Entretenir l'outil » (BTS GPME),
 * l'entretien et la disponibilité. Ici, au niveau du bac STMG : les deux qualités, la surchauffe,
 * les rebuts, et ce qu'un budget qualité change aux ventes et au résultat.
 */

/** Les entreprises du chapitre : celles du chapitre « Produire ». La garde recompte la liste. */
export const ENTREPRISES_DE_LA_QUALITE: readonly string[] = ENTREPRISES_DE_LA_PRODUCTION;

/**
 * Le seuil de surchauffe du moteur, quand le scénario n'en donne pas : au-delà de 95 %
 * d'utilisation des équipements, la qualité produite baisse (`computeProducedQuality`). La garde
 * vérifie que le moteur le joue ainsi.
 */
export const SEUIL_DE_SURCHAUFFE_DU_MOTEUR = 0.95;

/** Le budget qualité par trimestre de la gestion neutre du secteur, à l'euro. */
export const budgetDuSecteur = (code: string) => Math.round(PART_DE_QUALITE_NEUTRE * scenarioByCode(code).scenario.production.qualityScale);

/** Le budget qualité posé tel quel à chaque trimestre : une valeur absolue, qui ne se compose pas. */
const budgetQualite =
  (budget: number): Changement =>
  (_tour, d) => ({ ...d, qualityBudget: budget });

/**
 * L'année jouée avec `budget` de qualité à chaque trimestre : l'année du cours si le gestionnaire
 * y engage déjà ce budget, l'année rejouée sinon.
 */
export function anneeAuBudget(code: string, budget: number): readonly CompanyRoundResult[] {
  const reference = anneeDeReference(code);
  if (reference.every((r) => Math.round(r.incomeStatement.qualityCost) === budget)) return reference;
  return rejouerAvec(code, `produire-bien:budget-qualite-${budget}`, budgetQualite(budget));
}

const qte = (n: number) => n.toLocaleString("fr-FR", { maximumFractionDigits: 2 }).replace(/^-/, "−");
/** Un montant à la française, avec le signe moins typographique ; retranché, un négatif va entre parenthèses. */
const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const retranche = (x: number) => (x < 0 ? `(${eur(x)})` : eur(x));
const pct = (t: number) => `${t.toLocaleString("fr-FR", { maximumFractionDigits: 2 }).replace(/^-/, "−")} %`;
const auDixieme = (x: number) => Math.round(x * 10) / 10;
const auCentieme = (x: number) => Math.round(x * 100) / 100;
const dE = (nom: string) => (/^[aeiouyéèêAEIOUYÉÈ]/.test(nom) ? `d'${nom}` : `de ${nom}`);
/** « 1er », « 2e » : le rang d'un trimestre, compté à partir de 1. */
const rang = (n: number) => (n === 1 ? "1er" : `${n}e`);
/** Une qualité du moteur (1 = la qualité ordinaire du secteur), en indice 100, au dixième. */
const indice = (q: number) => auDixieme(q * 100);

/** Un trimestre, vu par la qualité. */
export interface TrimestreDeQualite {
  numero: number;
  budget: number;
  /** Production ÷ capacité des équipements × 100, telle que le moteur la compte pour la surchauffe. */
  utilisation: number;
  produite: number;
  percue: number;
  production: number;
  rebuts: number;
  nonQualite: number;
}

export interface AnneeDeQualite {
  trimestres: TrimestreDeQualite[];
  budget: number;
  production: number;
  rebuts: number;
  nonQualite: number;
  demande: number;
  ventes: number;
  resultat: number;
}

/** Une année de l'arène, lue par la qualité : la qualité perçue se recompose avec la règle du moteur. */
export function anneeDeQualite(code: string, annee: readonly CompanyRoundResult[]): AnneeDeQualite {
  const s = scenarioByCode(code).scenario;
  let percue = anneeJouee(code).depart.perceivedQuality;
  const trimestres = annee.map((r, k): TrimestreDeQualite => {
    percue = updatePerceivedQuality(percue, r.production.producedQuality, s.production.qualityInertia);
    return {
      numero: k + 1,
      budget: Math.round(r.incomeStatement.qualityCost),
      utilisation: auDixieme(r.production.utilizationRate * 100),
      produite: indice(r.production.producedQuality),
      percue: indice(percue),
      production: Math.round(r.production.produced),
      rebuts: Math.round(r.qualityCosts?.defectUnits ?? 0),
      nonQualite: Math.round((r.qualityCosts?.internalFailure ?? 0) + (r.qualityCosts?.externalFailure ?? 0)),
    };
  });
  const somme = (f: (t: TrimestreDeQualite) => number) => trimestres.reduce((x, t) => x + f(t), 0);
  return {
    trimestres,
    budget: somme((t) => t.budget),
    production: somme((t) => t.production),
    rebuts: somme((t) => t.rebuts),
    nonQualite: somme((t) => t.nonQualite),
    demande: Math.round(surLAnnee(annee, (r) => Object.values(r.market.bySegment).reduce((x, v) => x + v.demandForCompany, 0))),
    ventes: Math.round(surLAnnee(annee, soldUnits)),
    resultat: Math.round(surLAnnee(annee, (r) => r.incomeStatement.operatingIncome)),
  };
}

export type VerdictDeLaQualite = "par-les-ventes" | "par-les-rebuts" | "ne-se-paie-pas";

const calculs = new Map<string, ReturnType<typeof calculer>>();

/** La qualité du chapitre : l'année du cours, les deux années comparées, la surchauffe et le verdict. */
export function qualite(c: Pick<Cas, "code">) {
  const deja = calculs.get(c.code);
  if (deja) return deja;
  const r = calculer(c.code);
  calculs.set(c.code, r);
  return r;
}

function calculer(code: string) {
  const s = scenarioByCode(code).scenario;
  const { depart } = anneeJouee(code);
  const budget = budgetDuSecteur(code);
  const reference = anneeDeReference(code);
  const annee = anneeDeQualite(code, reference);
  const gestionnaire = annee.trimestres[0]!.budget;
  const sans = anneeDeQualite(code, anneeAuBudget(code, 0));
  const avec = anneeDeQualite(code, anneeAuBudget(code, budget));
  const seuil = s.production.overheatThreshold ?? SEUIL_DE_SURCHAUFFE_DU_MOTEUR;

  // Le trimestre le plus chargé de l'année du cours, et ce que la surchauffe y retire.
  const charge = reference.reduce((m, r, k) => (r.production.utilizationRate > reference[m]!.production.utilizationRate ? k : m), 0);
  const tauxDuPlusCharge = reference[charge]!.production.utilizationRate;
  const base = indice(computeProducedQuality({ qualityBudget: gestionnaire, qualitySensitivity: s.production.qualitySensitivity, qualityScale: s.production.qualityScale, utilizationRate: 0 }));
  const taux = auDixieme(tauxDuPlusCharge * 100);
  const surchauffe =
    tauxDuPlusCharge > seuil
      ? {
          numero: charge + 1,
          base,
          taux,
          seuil: auDixieme(seuil * 100),
          produite: auDixieme(base * (1 - (taux - seuil * 100) / 100)),
          /** La qualité perçue de la fin du trimestre est plus basse qu'au début. */
          percueEnBaisse: annee.trimestres[charge]!.percue < (charge === 0 ? indice(depart.perceivedQuality) : annee.trimestres[charge - 1]!.percue),
        }
      : null;

  // La qualité perçue à la fin du premier trimestre, avec le budget du secteur.
  const garde = Math.round(s.production.qualityInertia * 100);
  const percueDeDepart = indice(depart.perceivedQuality);
  const produiteAuPremier = avec.trimestres[0]!.produite;
  const percueAuPremier = auDixieme((garde * percueDeDepart + (100 - garde) * produiteAuPremier) / 100);

  const ventesGagnees = avec.ventes - sans.ventes;
  const demandeGagnee = avec.demande - sans.demande;
  const nonQualiteEvitee = sans.nonQualite - avec.nonQualite;
  const ecartDeResultat = avec.resultat - sans.resultat;
  const verdict: VerdictDeLaQualite = ecartDeResultat <= 0 ? "ne-se-paie-pas" : nonQualiteEvitee >= avec.budget ? "par-les-rebuts" : "par-les-ventes";
  return {
    budget,
    gestionnaire,
    metUnBudget: gestionnaire > 0,
    seuil: auDixieme(seuil * 100),
    rebutsComptes: s.qualityCosts !== undefined,
    annee,
    sans,
    avec,
    surchauffe,
    garde,
    percueDeDepart,
    produiteAuPremier,
    percueAuPremier,
    percueEnFinDAnnee: avec.trimestres.at(-1)!.percue,
    ventesGagnees,
    demandeGagnee,
    nonQualiteEvitee,
    ecartDeResultat,
    verdict,
    tauxDeRebut: annee.production > 0 ? auCentieme((annee.rebuts / annee.production) * 100) : 0,
    /** L'arène donne raison au bon gestionnaire : il met le budget là où il se paie, et seulement là. */
    raison: (gestionnaire > 0) === (ecartDeResultat > 0),
  };
}

const COLONNES_DE_L_ANNEE = [1, 2, 3, 4].map((n) => `${rang(n)} trimestre`);

/** L'année du cours, trimestre par trimestre : le budget, la charge des équipements, les deux qualités. */
function tableauDeLAnnee(c: Cas): TableauDeDonnees {
  const t = qualite(c).annee.trimestres;
  return {
    titre: `La qualité ${dE(c.entreprise)}, sur l'année du cours`,
    colonnes: COLONNES_DE_L_ANNEE,
    lignes: [
      { libelle: "Budget qualité", valeurs: t.map((x) => eur(x.budget)) },
      { libelle: "Taux d'utilisation des équipements", valeurs: t.map((x) => pct(x.utilisation)) },
      { libelle: "Qualité produite (indice)", valeurs: t.map((x) => qte(x.produite)) },
      { libelle: "Qualité perçue en fin de trimestre (indice)", valeurs: t.map((x) => qte(x.percue)) },
    ],
  };
}

function tableauDesRebuts(c: Cas): TableauDeDonnees {
  const t = qualite(c).annee.trimestres;
  return {
    titre: `Les rebuts ${dE(c.entreprise)}, sur l'année du cours`,
    colonnes: COLONNES_DE_L_ANNEE,
    lignes: [
      { libelle: `Production (${c.unites})`, valeurs: t.map((x) => qte(x.production)) },
      { libelle: `Rebuts (${c.unites})`, valeurs: t.map((x) => qte(x.rebuts)) },
      { libelle: "Coût de la non-qualité", valeurs: t.map((x) => eur(x.nonQualite)) },
    ],
  };
}

/** Le nom des deux années comparées : laquelle est l'année du cours. */
const colonnes = (c: Cas) => {
  const q = qualite(c);
  return [`Sans budget qualité${q.metUnBudget ? "" : " (l'année du cours)"}`, `Avec ${eur(q.budget)} par trimestre${q.metUnBudget ? " (l'année du cours)" : ""}`];
};

function tableauDesDeuxAnnees(c: Cas): TableauDeDonnees {
  const q = qualite(c);
  const ligne = (libelle: string, f: (a: AnneeDeQualite) => string) => ({ libelle, valeurs: [f(q.sans), f(q.avec)] });
  return {
    titre: `L'année ${dE(c.entreprise)}, jouée sans budget qualité et avec celui du secteur`,
    colonnes: colonnes(c),
    lignes: [
      ligne("Budget qualité de l'année", (a) => eur(a.budget)),
      ligne("Qualité produite au 1er trimestre (indice)", (a) => qte(a.trimestres[0]!.produite)),
      ligne("Qualité perçue en fin d'année (indice)", (a) => qte(a.trimestres.at(-1)!.percue)),
      ligne(`Demande reçue sur l'année (${c.unites})`, (a) => qte(a.demande)),
      ligne(`Ventes de l'année (${c.unites})`, (a) => qte(a.ventes)),
      ...(q.rebutsComptes ? [ligne("Coût de la non-qualité de l'année", (a) => eur(a.nonQualite))] : []),
      ligne("Résultat de l'activité", (a) => eur(a.resultat)),
    ],
  };
}

/** Ce que l'écart de résultat dit, en une phrase. */
const ecartEcrit = (e: number) => (e > 0 ? `plus haut de ${eur(e)}` : `plus bas de ${eur(-e)}`);

export const PRODUIRE_BIEN: Chapitre = {
  code: "produire-bien",
  parcours: "stmg-management",
  palier: 1,
  blocs: ["STMG Thème 1 · Les organisations et l'activité de production de biens et de services"],
  titre: "Produire bien : la qualité et ce qu'elle coûte",
  accroche:
    "La qualité que l'entreprise produit, celle que ses clients perçoivent, les rebuts qu'elle jette, et le budget qualité : l'arène rejoue l'année avec et sans lui, et dit s'il se paie.",
  objectifs: [
    "Distinguer la qualité produite et la qualité perçue",
    "Expliquer pourquoi produire trop vite fait baisser la qualité",
    "Calculer un taux de rebut et le coût de la non-qualité",
    "Juger un budget qualité sur les ventes qu'il fait gagner et sur le résultat",
  ],
  libre: false,
  entreprises: {
    codes: ENTREPRISES_DE_LA_QUALITE,
    pourquoi:
      "ce chapitre suit la qualité d'un seul produit, servi dans le trimestre : à la boutique, chaque article de la gamme a son propre budget qualité, et la salle de sport garde ses adhérents d'un trimestre à l'autre.",
  },
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Qualité produite, qualité perçue",
      notions: ["demand_market_share"],
      tableau: tableauDeLAnnee,
      texte: (c) => {
        const q = qualite(c);
        return [
          "Produire bien, c'est produire une qualité que les clients reconnaissent. L'arène en mesure deux, en indice : 100, c'est la qualité ordinaire du secteur.",
          `La qualité produite est celle de ce que l'entreprise fait dans le trimestre. Elle monte avec le budget qualité, de moins en moins à mesure qu'il grossit ; elle baisse quand les équipements tournent au-delà de ${pct(q.seuil)} de leur capacité : on produit trop vite, et moins bien.`,
          `La qualité perçue est celle que voient les clients : c'est elle qui les attire. Elle suit la qualité produite avec retard : chaque trimestre, elle garde ${q.garde} % de la qualité perçue d'avant et prend ${100 - q.garde} % de la qualité produite.`,
          q.metUnBudget
            ? `Dans l'année du cours, le bon gestionnaire met ${eur(q.gestionnaire)} de budget qualité chaque trimestre chez ${c.entreprise}, le budget qu'engage la gestion ordinaire du secteur.`
            : `Dans l'année du cours, le bon gestionnaire ne met aucun budget qualité chez ${c.entreprise} : la qualité produite ne dépasse jamais 100.`,
        ];
      },
      repere: () => "Qualité perçue = (part gardée × qualité perçue d'avant + part nouvelle × qualité produite) ÷ 100.",
    },
    {
      id: "la-surchauffe",
      type: "montants",
      titre: "Produire trop vite",
      notions: ["capacity"],
      si: (c) => qualite(c).surchauffe !== null,
      tableau: tableauDeLAnnee,
      question: (c) => {
        const h = qualite(c).surchauffe!;
        return `Au ${rang(h.numero)} trimestre, les équipements ont tourné à ${pct(h.taux)} de leur capacité, au-delà du seuil de ${pct(h.seuil)}. L'arène retire alors à la qualité produite autant de pour cent que le taux dépasse le seuil : qualité produite = qualité sans surchauffe × (1 − (taux − ${qte(h.seuil)}) ÷ 100). Sans surchauffe, la qualité produite vaut ${qte(h.base)} cette année. Calculez la qualité produite de ce trimestre (indice, au dixième).`;
      },
      champs: (c) => {
        const h = qualite(c).surchauffe!;
        return [
          {
            libelle: "Qualité produite du trimestre le plus chargé (indice)",
            attendu: h.produite,
            calcul: `${qte(h.base)} × (1 − (${qte(h.taux)} − ${qte(h.seuil)}) ÷ 100) = ${qte(h.produite)}`,
            tolerance: 0.1,
          },
        ];
      },
      explication: (c) => {
        const h = qualite(c).surchauffe!;
        return [
          `En poussant ses équipements à ${pct(h.taux)}, ${c.entreprise} a produit plus, mais moins bien : la qualité produite tombe à ${qte(h.produite)} au lieu de ${qte(h.base)}, et la qualité perçue ${h.percueEnBaisse ? "baisse avec elle" : "monte moins vite"}.`,
          "C'est un arbitrage de manager : servir tout de suite plus de clients, ou garder la qualité qui les fait revenir.",
        ];
      },
    },
    {
      id: "les-rebuts",
      type: "montants",
      titre: "Les rebuts et ce qu'ils coûtent",
      notions: ["variable_costs"],
      si: (c) => qualite(c).rebutsComptes,
      tableau: tableauDesRebuts,
      question: () =>
        "Une partie de ce qui est produit est ratée et jetée : ce sont les rebuts. Ils ont coûté à produire et ne rapportent rien : avec les retours des clients mécontents, s'il y en a, c'est le coût de la non-qualité. Plus la qualité produite est haute, moins il y a de rebuts. Calculez les rebuts de l'année, le taux de rebut (rebuts ÷ production × 100, au centième), puis le coût de la non-qualité de l'année.",
      champs: (c) => {
        const q = qualite(c);
        const a = q.annee;
        return [
          { libelle: "Rebuts de l'année", attendu: a.rebuts, calcul: `${a.trimestres.map((t) => qte(t.rebuts)).join(" + ")} = ${qte(a.rebuts)}`, tolerance: 0 },
          { libelle: "Taux de rebut (%)", attendu: q.tauxDeRebut, calcul: `${qte(a.rebuts)} ÷ ${qte(a.production)} × 100 = ${pct(q.tauxDeRebut)}`, tolerance: 0.01 },
          { libelle: "Coût de la non-qualité de l'année", attendu: a.nonQualite, calcul: `${a.trimestres.map((t) => eur(t.nonQualite)).join(" + ")} = ${eur(a.nonQualite)}`, tolerance: 1 },
        ];
      },
      explication: (c) => {
        const q = qualite(c);
        return [
          `Sur ${qte(q.annee.production)} ${c.unites} ${accordPluriel(c, "produit")}, ${qte(q.annee.rebuts)} ont fini en rebuts : ${pct(q.tauxDeRebut)}. Ils ont coûté ${eur(q.annee.nonQualite)} sur l'année, pour rien. ${
            q.metUnBudget
              ? `C'est ce qui reste de non-qualité avec un budget qualité de ${eur(q.annee.budget)} sur l'année.`
              : "C'est la non-qualité d'une année sans aucun budget qualité."
          }`,
        ];
      },
    },
    {
      id: "la-qualite-percue",
      type: "montants",
      titre: "Le budget du secteur, rejoué",
      notions: ["demand_market_share"],
      tableau: tableauDesDeuxAnnees,
      question: (c) => {
        const q = qualite(c);
        return `${
          q.metUnBudget
            ? "L'arène a rejoué l'année sans aucun budget qualité"
            : `L'arène a rejoué l'année avec le budget qualité qu'engage la gestion ordinaire du secteur, ${eur(q.budget)} par trimestre`
        }, avec les mêmes concurrents et la même façon de gérer : le tableau compare les deux années. Avec le budget, la qualité produite du 1er trimestre vaut ${qte(q.produiteAuPremier)}, et la qualité perçue partait de ${qte(q.percueDeDepart)}. Calculez le budget qualité de l'année avec ce budget, puis la qualité perçue à la fin du 1er trimestre (au dixième).`;
      },
      champs: (c) => {
        const q = qualite(c);
        return [
          { libelle: "Budget qualité de l'année, au budget du secteur", attendu: q.avec.budget, calcul: `4 × ${eur(q.budget)} = ${eur(q.avec.budget)}`, tolerance: 0 },
          {
            libelle: "Qualité perçue à la fin du 1er trimestre (indice)",
            attendu: q.percueAuPremier,
            calcul: `(${q.garde} × ${qte(q.percueDeDepart)} + ${100 - q.garde} × ${qte(q.produiteAuPremier)}) ÷ 100 = ${qte(q.percueAuPremier)}`,
            tolerance: 0.1,
          },
        ];
      },
      explication: (c) => {
        const q = qualite(c);
        return [
          `La qualité produite passe d'emblée à ${qte(q.produiteAuPremier)}, mais la qualité perçue ne monte qu'à ${qte(q.percueAuPremier)} au premier trimestre, et atteint ${qte(q.percueEnFinDAnnee)} en fin d'année. Les clients mettent du temps à voir la qualité : un budget qualité ne fait pas vendre le jour même.`,
        ];
      },
    },
    {
      id: "ce-que-la-qualite-change",
      type: "montants",
      titre: "Ce que la qualité change aux ventes",
      notions: ["demand_market_share", "income_statement"],
      tableau: tableauDesDeuxAnnees,
      question: (c) =>
        `D'après le tableau, calculez les ventes gagnées avec le budget du secteur (avec moins sans)${
          qualite(c).rebutsComptes ? ", la non-qualité qu'il évite (sans moins avec)" : ""
        }, puis l'écart de résultat de l'activité (avec moins sans).`,
      champs: (c) => {
        const q = qualite(c);
        return [
          { libelle: "Ventes gagnées avec le budget du secteur", attendu: q.ventesGagnees, calcul: `${qte(q.avec.ventes)} − ${qte(q.sans.ventes)} = ${qte(q.ventesGagnees)}`, tolerance: 0 },
          ...(q.rebutsComptes
            ? [{ libelle: "Non-qualité évitée avec le budget", attendu: q.nonQualiteEvitee, calcul: `${eur(q.sans.nonQualite)} − ${eur(q.avec.nonQualite)} = ${eur(q.nonQualiteEvitee)}`, tolerance: 1 }]
            : []),
          {
            libelle: "Écart de résultat de l'activité, avec moins sans",
            attendu: q.ecartDeResultat,
            calcul: `${eur(q.avec.resultat)} − ${retranche(q.sans.resultat)} = ${eur(q.ecartDeResultat)}`,
            tolerance: 1,
          },
        ];
      },
      explication: (c) => {
        const q = qualite(c);
        const nonServie = q.demandeGagnee - q.ventesGagnees;
        return [
          `La qualité a fait venir ${qte(q.demandeGagnee)} ${c.unites} de demande en plus sur l'année, et ${c.entreprise} en a vendu ${qte(q.ventesGagnees)} de plus.${
            nonServie > 0 ? ` Les ${qte(nonServie)} autres n'ont pas été ${accordPluriel(c, "vendu")} : l'entreprise ne les avait pas ${accordPluriel(c, "prévu")}, ou ne pouvait pas les produire.` : ""
          }`,
          `Le budget coûte ${eur(q.avec.budget)} sur l'année${q.rebutsComptes ? ` et évite ${eur(q.nonQualiteEvitee)} de non-qualité` : ""}. Avec lui, le résultat de l'activité est ${ecartEcrit(q.ecartDeResultat)}.`,
        ];
      },
    },
    {
      id: "le-verdict",
      type: "choix",
      titre: "Le budget qualité se paie-t-il ?",
      notions: ["income_statement"],
      tableau: tableauDesDeuxAnnees,
      question: (c) => {
        const q = qualite(c);
        return `Avec ${eur(q.budget)} de budget qualité par trimestre, le résultat de l'activité ${dE(c.entreprise)} est ${ecartEcrit(q.ecartDeResultat)} sur l'année. Le budget qualité se paie-t-il, et par quoi ?`;
      },
      options: (c) => {
        const q = qualite(c);
        const faits = `le budget coûte ${eur(q.avec.budget)} sur l'année, fait vendre ${qte(q.ventesGagnees)} ${c.unites} de plus${
          q.rebutsComptes ? `, évite ${eur(q.nonQualiteEvitee)} de non-qualité` : ""
        }, et le résultat est ${ecartEcrit(q.ecartDeResultat)}.`;
        return [
          {
            texte: "Oui : la marge des ventes gagnées paie le budget",
            juste: q.verdict === "par-les-ventes",
            retour: q.verdict === "par-les-ventes" ? `Oui : ${faits} La qualité se paie par les clients qu'elle attire.` : `Non : ${faits}`,
          },
          {
            texte: "Oui : les rebuts évités suffisent à payer le budget",
            juste: q.verdict === "par-les-rebuts",
            retour:
              q.verdict === "par-les-rebuts"
                ? `Oui : ${faits}`
                : q.rebutsComptes
                  ? `Non : ${faits} Les rebuts évités ne paient qu'une petite part du budget.`
                  : `Non : l'arène ne compte pas de rebuts chez ${c.entreprise} ; ${faits}`,
          },
          {
            texte: "Non : il coûte plus qu'il ne fait gagner",
            juste: q.verdict === "ne-se-paie-pas",
            retour:
              q.verdict === "ne-se-paie-pas"
                ? `Oui : ${faits} Les ventes gagnées ne laissent pas assez de marge pour payer le budget.`
                : `Non : ${faits}`,
          },
        ];
      },
    },
    {
      id: "synthese",
      type: "lecture",
      titre: "Ce qu'il faut retenir",
      notions: ["demand_market_share"],
      texte: (c) => {
        const q = qualite(c);
        const ecart = eur(Math.abs(q.ecartDeResultat));
        const gestionnaire = q.metUnBudget
          ? q.raison
            ? `Chez ${c.entreprise}, le bon gestionnaire met le budget du secteur, et l'arène lui donne raison : sans lui, le résultat de l'année aurait été plus bas de ${ecart}.`
            : `Chez ${c.entreprise}, le bon gestionnaire met le budget du secteur, mais l'arène montre que sans lui le résultat de l'année aurait été plus haut de ${ecart}.`
          : q.raison
            ? `Chez ${c.entreprise}, le bon gestionnaire ne met aucun budget qualité, et l'arène lui donne raison : avec celui du secteur, le résultat de l'année aurait été plus bas de ${ecart}.`
            : `Chez ${c.entreprise}, le bon gestionnaire ne met aucun budget qualité, mais l'arène montre qu'avec celui du secteur le résultat de l'année aurait été plus haut de ${ecart}.`;
        return [
          gestionnaire,
          "Produire bien n'est pas produire la meilleure qualité possible : c'est produire la qualité que les clients paient. La qualité produite se décide (le budget) et se protège (ne pas pousser les équipements trop loin) ; la qualité perçue suit avec retard ; et un budget qualité se juge comme toute dépense, sur ce qu'il fait gagner en face de ce qu'il coûte.",
        ];
      },
      repere: () => "Taux de rebut = rebuts ÷ production × 100. Un budget qualité se paie si le résultat est plus haut avec lui que sans lui.",
    },
  ],
};
