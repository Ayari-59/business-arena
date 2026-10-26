import { montantEcrit } from "../../../../pedagogy/cours/correcteur";
import type { Cas } from "../../cas";
import {
  COUTS_OU_DIFFERENCIATION,
  STRATEGIE_DE_COUTS,
  bilanDeLAnnee,
  coutsOuDifferenciation,
  strategie,
  type Leviers,
} from "../../chapitres/couts-ou-differenciation";
import { rejouerAvec } from "../../gestion-de-la-pme";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « DOMINATION PAR LES COÛTS OU DIFFÉRENCIATION » : BAISSER LES PRIX
 * SANS RIEN COUPER (Stratégie et management, palier 2).
 *
 * Le directeur commercial veut le volume de la stratégie de coûts sans en payer le prix : baisser
 * les prix et produire davantage, comme elle, mais garder les budgets de qualité et de marketing
 * de l'année du cours, pour que les clients ne perdent rien. L'élève refait les calculs du
 * chapitre (la part de marché, la marge par unité, l'écart de résultat) sur cette demi-mesure,
 * la compare à la stratégie de coûts entière et à l'année du cours, puis répond.
 *
 * Le cas est neuf par sa question : le chapitre compare deux stratégies cohérentes ; le cas
 * mesure ce que vaut une stratégie à moitié tenue. La demi-mesure est l'année du cours rejouée
 * avec le prix et la production de la stratégie de coûts (`STRATEGIE_DE_COUTS`), les budgets de
 * qualité et de marketing inchangés. Le verdict se calcule : selon l'entreprise, la demi-mesure,
 * la stratégie entière ou l'année du cours donne le meilleur résultat.
 */

/** La demi-mesure : le prix et la production de la stratégie de coûts, les budgets de la gestion équilibrée. */
export const DEMI_MESURE: Leviers = { prix: STRATEGIE_DE_COUTS.prix, qualite: 1, marketing: 1, production: STRATEGIE_DE_COUTS.production };

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const retranche = (x: number) => (x < 0 ? `(${eur(x)})` : eur(x));
const qte = (n: number) => n.toLocaleString("fr-FR").replace(/^-/, "−");
const pct = (t: number) => `${t.toLocaleString("fr-FR", { maximumFractionDigits: 1 }).replace(/^-/, "−")} %`;
const variation = (k: number, feminin = false) => {
  const v = Math.round((k - 1) * 100);
  return v === 0 ? (feminin ? "inchangée" : "inchangé") : v > 0 ? `+${v} %` : `−${-v} %`;
};

export type VerdictDeLaDemiMesure = "demi-mesure" | "couts" | "annee-du-cours";

/** La demi-mesure rejouée, à côté de la stratégie de coûts du chapitre et de l'année du cours. */
export function prixBasSansRienCouper(c: Cas) {
  const k = coutsOuDifferenciation(c);
  const demi = bilanDeLAnnee("demi-mesure", rejouerAvec(c.code, "couts-ou-differenciation-demi-mesure", strategie(DEMI_MESURE)));
  const couts = k.couts;
  const annee = k.milieu;
  const trois = [annee, couts, demi];
  const meilleur = [...trois].sort((a, b) => b.resultat - a.resultat)[0]!;
  const verdict: VerdictDeLaDemiMesure = meilleur === demi ? "demi-mesure" : meilleur === couts ? "couts" : "annee-du-cours";
  return {
    demi,
    couts,
    annee,
    trois,
    verdict,
    ecartAvecLesCouts: demi.resultat - couts.resultat,
    ecartAvecLAnnee: demi.resultat - annee.resultat,
    budgetsEnPlus: demi.qualite + demi.marketing - (couts.qualite + couts.marketing),
  };
}

const COLONNES = ["L'année du cours", "La stratégie de coûts", "Prix bas, budgets gardés"];

export const BAISSER_LES_PRIX_SANS_RIEN_COUPER: Situation = {
  code: "baisser-les-prix-sans-rien-couper",
  parcours: "strategie",
  palier: 2,
  blocs: [],
  reprend: [COUTS_OU_DIFFERENCIATION.code],
  commanditaire: "Le directeur commercial",
  titre: "Baisser les prix sans rien couper",
  accroche:
    "Le volume de la stratégie de coûts, sans couper la qualité ni le marketing : le directeur commercial veut les deux. Ce que vaut cette demi-mesure, face à la stratégie entière et à l'année du cours.",
  objectifs: [
    "Calculer la part de marché et la marge par unité d'une stratégie rejouée",
    "Comparer une stratégie à moitié tenue à la stratégie entière",
    "Mesurer ce que les budgets gardés coûtent et rapportent",
    "Répondre au directeur commercial, chiffre à l'appui",
  ],
  libre: false,
  entreprises: {
    codes: COUTS_OU_DIFFERENCIATION.entreprises!.codes,
    pourquoi: "ce cas compare des parts de marché et des marges par unité vendue, et chez VOLT FITNESS le marché se compte d'abord en abonnés gardés.",
  },
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "La proposition du directeur commercial",
      texte: (c) => [
        `« Pour prendre des parts de marché, baissons nos prix de ${Math.round((1 - DEMI_MESURE.prix) * 100)} % et produisons ${Math.round((DEMI_MESURE.production - 1) * 100)} % de plus, comme dans la stratégie de coûts. Mais sans toucher à la qualité ni au marketing : nos clients ne doivent rien perdre. Dites-moi si c'est mieux que la stratégie de coûts entière, et que notre année telle qu'elle a été, pour ${c.entreprise}. »`,
        "Pas de cours cette fois : les calculs sont ceux du chapitre. L'arène a rejoué l'année avec la proposition, décidée dès le premier trimestre, tout le reste identique.",
      ],
      tableau: () => ({
        titre: "Ce que chaque solution change, chaque trimestre",
        colonnes: COLONNES,
        lignes: [
          { libelle: "Prix de vente", valeurs: [variation(1), variation(STRATEGIE_DE_COUTS.prix), variation(DEMI_MESURE.prix)] },
          { libelle: "Budget qualité", valeurs: [variation(1), variation(STRATEGIE_DE_COUTS.qualite), variation(DEMI_MESURE.qualite)] },
          { libelle: "Budget marketing", valeurs: [variation(1), variation(STRATEGIE_DE_COUTS.marketing), variation(DEMI_MESURE.marketing)] },
          {
            libelle: "Production planifiée",
            valeurs: [variation(1, true), variation(STRATEGIE_DE_COUTS.production, true), variation(DEMI_MESURE.production, true)],
          },
        ],
      }),
      repere: () => "À rendre : la part de marché et la marge par unité de la proposition, ce qu'elle change au résultat de l'année, et votre réponse.",
    },
    {
      id: "volume",
      type: "montants",
      titre: "Ce que la proposition vend et rapporte",
      notions: ["demand_market_share", "contribution_margin"],
      tableau: (c) => {
        const k = prixBasSansRienCouper(c);
        return {
          titre: "L'année rejouée avec chaque solution",
          colonnes: COLONNES,
          lignes: [
            { libelle: "Prix moyen de vente", valeurs: k.trois.map((x) => eur(x.prixMoyen)) },
            { libelle: `Ventes de l'année (${c.unites})`, valeurs: k.trois.map((x) => qte(x.ventes)) },
            { libelle: `Marché de l'année (${c.unites})`, valeurs: k.trois.map((x) => qte(x.marche)) },
            { libelle: "Marge sur coût variable", valeurs: k.trois.map((x) => eur(x.marge)) },
          ],
        };
      },
      question: () => "Calculez la part de marché de la proposition, en pourcentage au dixième, et sa marge sur coût variable par unité vendue, au centime.",
      champs: (c) => {
        const k = prixBasSansRienCouper(c);
        return [
          { libelle: "Part de marché de la proposition (%)", attendu: k.demi.part, calcul: `${qte(k.demi.ventes)} ÷ ${qte(k.demi.marche)} × 100 = ${pct(k.demi.part)}`, tolerance: 0.1 },
          { libelle: "Marge par unité de la proposition", attendu: k.demi.margeUnitaire, calcul: `${eur(k.demi.marge)} ÷ ${qte(k.demi.ventes)} = ${eur(k.demi.margeUnitaire)}`, tolerance: 0.01 },
        ];
      },
      explication: (c) => {
        const k = prixBasSansRienCouper(c);
        return [
          `La proposition prend ${pct(k.demi.part)} du marché, contre ${pct(k.couts.part)} avec la stratégie de coûts et ${pct(k.annee.part)} dans l'année du cours. ${
            k.demi.part > k.couts.part
              ? "Au même prix, les budgets gardés font vendre plus que la stratégie entière."
              : "Les budgets gardés ne font pas vendre davantage que la stratégie entière."
          }`,
          `Chaque unité laisse ${eur(k.demi.margeUnitaire)} de marge, contre ${eur(k.couts.margeUnitaire)} avec la stratégie de coûts et ${eur(k.annee.margeUnitaire)} dans l'année du cours : la marge par unité suit d'abord le prix.`,
        ];
      },
    },
    {
      id: "resultat",
      type: "montants",
      titre: "Ce que la proposition fait au résultat",
      notions: ["income_statement", "full_unit_cost"],
      tableau: (c) => {
        const k = prixBasSansRienCouper(c);
        return {
          titre: "L'année rejouée avec chaque solution : les budgets et le résultat",
          colonnes: COLONNES,
          lignes: [
            { libelle: "Budgets qualité et marketing de l'année", valeurs: k.trois.map((x) => eur(x.qualite + x.marketing)) },
            { libelle: "Coût complet d'une unité vendue", valeurs: k.trois.map((x) => eur(x.coutComplet)) },
            { libelle: "Résultat de l'exercice", valeurs: k.trois.map((x) => eur(x.resultat)) },
          ],
        };
      },
      question: () =>
        "Calculez l'écart de résultat de l'exercice entre la proposition et la stratégie de coûts entière, puis entre la proposition et l'année du cours.",
      champs: (c) => {
        const k = prixBasSansRienCouper(c);
        return [
          {
            libelle: "Écart de résultat, proposition moins stratégie de coûts",
            attendu: k.ecartAvecLesCouts,
            calcul: `${eur(k.demi.resultat)} − ${retranche(k.couts.resultat)} = ${eur(k.ecartAvecLesCouts)}`,
            tolerance: 1,
          },
          {
            libelle: "Écart de résultat, proposition moins année du cours",
            attendu: k.ecartAvecLAnnee,
            calcul: `${eur(k.demi.resultat)} − ${retranche(k.annee.resultat)} = ${eur(k.ecartAvecLAnnee)}`,
            tolerance: 1,
          },
        ];
      },
      explication: (c) => {
        const k = prixBasSansRienCouper(c);
        return [
          `Garder les budgets coûte ${eur(k.budgetsEnPlus)} de plus sur l'année que la stratégie de coûts entière. ${
            k.ecartAvecLesCouts > 0
              ? `Ici, les ventes et la qualité qu'ils maintiennent rapportent davantage : la proposition fait ${eur(k.ecartAvecLesCouts)} de mieux.`
              : `Ici, ils ne rapportent pas ce qu'ils coûtent : la proposition fait ${eur(-k.ecartAvecLesCouts)} de moins.`
          }`,
        ];
      },
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre réponse au directeur commercial",
      notions: ["demand_market_share"],
      question: () => "Quelle solution recommandez-vous au directeur commercial ?",
      options: (c) => {
        const k = prixBasSansRienCouper(c);
        const chiffres = `résultat de l'année : ${eur(k.demi.resultat)} avec la proposition, ${eur(k.couts.resultat)} avec la stratégie de coûts, ${eur(k.annee.resultat)} dans l'année du cours`;
        return [
          {
            texte: "Les prix bas sans rien couper",
            juste: k.verdict === "demi-mesure",
            retour:
              k.verdict === "demi-mesure"
                ? `Oui : ${chiffres}. Ici, la qualité et le marketing gardés paient ce qu'ils coûtent.`
                : `Non : ${chiffres}. La proposition ne fait pas le meilleur résultat.`,
          },
          {
            texte: "La stratégie de coûts entière",
            juste: k.verdict === "couts",
            retour:
              k.verdict === "couts"
                ? `Oui : ${chiffres}. Une stratégie de coûts se tient jusqu'au bout : baisser les prix sans baisser les coûts, c'est garder les charges d'une offre moyenne avec les marges d'une offre bon marché.`
                : `Non : ${chiffres}. La stratégie de coûts entière ne fait pas le meilleur résultat.`,
          },
          {
            texte: "Rester comme l'année du cours",
            juste: k.verdict === "annee-du-cours",
            retour:
              k.verdict === "annee-du-cours"
                ? `Oui : ${chiffres}. Ici, baisser les prix ne paie pas, avec ou sans les budgets : le volume gagné ne rattrape pas la marge perdue sur chaque unité.`
                : `Non : ${chiffres}. L'année du cours ne fait pas le meilleur résultat.`,
          },
        ];
      },
    },
  ],
};
