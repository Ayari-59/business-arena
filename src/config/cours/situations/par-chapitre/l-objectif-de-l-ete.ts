import { accordPluriel } from "../../accords";
import type { Cas } from "../../cas";
import { PROGRESSION_EN_POURCENT, SUIVRE_SES_VENTES, ceQueDisentLesPrix, suiviDesVentes, tableauDuSuivi, type Verdict } from "../../chapitres/suivre-ses-ventes";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « SUIVRE SES VENTES » : L'OBJECTIF DE L'ÉTÉ (Bac pro MCV, palier 1).
 *
 * La responsable des ventes a promis une prime à l'équipe si l'objectif de l'été est atteint.
 * L'objectif suit la règle du chapitre (les ventes du trimestre d'avant, plus
 * `PROGRESSION_EN_POURCENT`), au trimestre 3 de l'arène. L'élève calcule l'objectif, le taux de
 * réalisation, les clients repartis et la demande face à l'objectif, puis répond : la prime, ou
 * ce qui a manqué.
 *
 * Les chiffres sont ceux du chapitre (`suiviDesVentes`) ; seul change le trimestre, et la prime
 * promise est l'hypothèse du cas. Le verdict se calcule, comme au chapitre.
 */

/** Le trimestre de l'été : le troisième, de juillet à septembre. */
export const TRIMESTRE_DE_L_ETE = 3;

const qte = (n: number) => n.toLocaleString("fr-FR").replace(/^-/, "−");
const pct = (t: number) => `${t.toLocaleString("fr-FR", { maximumFractionDigits: 1 }).replace(/^-/, "−")} %`;
const majuscule = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);

export const suiviDeLEte = (c: Cas) => suiviDesVentes(c, TRIMESTRE_DE_L_ETE);

/** « 252 commandes », « 1 article ». */
const unites = (c: Cas, n: number) => `${qte(Math.abs(n))} ${Math.abs(n) > 1 ? c.unites : c.unite}`;

const REPONSES: Record<Verdict, string> = {
  atteint: "Prime gagnée : les ventes atteignent l'objectif",
  clients: "Pas de prime : trop peu de clients sont venus",
  service: "Pas de prime : des clients n'ont pas été servis",
  prix: "Pas de prime : les prix ont changé en cours de route",
};

export const L_OBJECTIF_DE_L_ETE: Situation = {
  code: "l-objectif-de-l-ete",
  parcours: "vente",
  palier: 1,
  blocs: [],
  reprend: [SUIVRE_SES_VENTES.code],
  commanditaire: "La responsable des ventes",
  titre: "L'objectif de l'été",
  accroche:
    "Une prime est promise à l'équipe si l'objectif de l'été est atteint. Calculer l'objectif, le taux de réalisation et ce qui l'explique, puis dire à la responsable si la prime est gagnée.",
  objectifs: [
    "Calculer un objectif de ventes et son taux de réalisation",
    "Expliquer l'écart par les clients venus et les clients servis",
    "Répondre à la responsable avec les chiffres",
  ],
  libre: false,
  entreprises: SUIVRE_SES_VENTES.entreprises,
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "La prime de l'équipe",
      tableau: (c) => tableauDuSuivi(c, suiviDeLEte(c)),
      texte: (c) => {
        const k = suiviDeLEte(c);
        return [
          `« Pour l'été, l'objectif a suivi la règle habituelle : les ventes du printemps, plus ${qte(PROGRESSION_EN_POURCENT)} %. J'ai promis une prime à l'équipe si l'objectif est atteint. L'a-t-elle gagnée ? Et sinon, qu'est-ce qui a manqué ? »`,
          `Pas de cours cette fois. Le printemps, c'est le trimestre ${qte(k.trimestre - 1)} de l'arène ; l'été, le trimestre ${qte(k.trimestre)}.`,
        ];
      },
      repere: () => "À rendre : l'objectif de l'été, son taux de réalisation, ce qui l'explique, et votre réponse.",
    },
    {
      id: "l-objectif-et-le-realise",
      type: "montants",
      titre: "L'objectif et le réalisé de l'été",
      notions: ["dashboard"],
      question: (c) => {
        const k = suiviDeLEte(c);
        return `Calculez l'objectif de l'été (les ventes du printemps, plus ${qte(k.progression)} %, arrondi à l'unité du dessus), l'écart avec les ventes de l'été (négatif s'il en manque), puis le taux de réalisation, au dixième.`;
      },
      champs: (c) => {
        const k = suiviDeLEte(c);
        const exact = (k.avant.ventes * (100 + k.progression)) / 100;
        return [
          {
            libelle: "Objectif de l'été",
            attendu: k.objectif,
            calcul: `${qte(k.avant.ventes)} × ${(1 + k.progression / 100).toLocaleString("fr-FR")} = ${exact.toLocaleString("fr-FR")}${exact === k.objectif ? "" : `, arrondi à ${qte(k.objectif)}`}`,
          },
          { libelle: `Écart en ${c.unites}`, attendu: k.ecart, calcul: `${qte(k.pendant.ventes)} − ${qte(k.objectif)} = ${qte(k.ecart)}` },
          {
            libelle: "Taux de réalisation (%)",
            attendu: k.tauxDeRealisation,
            calcul: `${qte(k.pendant.ventes)} ÷ ${qte(k.objectif)} × 100 = ${pct(k.tauxDeRealisation)}`,
            tolerance: 0.1,
          },
        ];
      },
      explication: (c) => {
        const k = suiviDeLEte(c);
        return [
          k.ecart >= 0
            ? `${pct(k.tauxDeRealisation)} : l'objectif de l'été est atteint, avec ${unites(c, k.ecart)} de plus.`
            : `${pct(k.tauxDeRealisation)} : l'objectif de l'été est manqué de ${unites(c, k.ecart)}.`,
        ];
      },
    },
    {
      id: "les-clients-de-l-ete",
      type: "montants",
      titre: "Les clients de l'été",
      notions: ["conversion_rate", "dashboard"],
      question: (c) =>
        `Calculez les ${c.unites} que les clients ont ${accordPluriel(c, "demandé")} l'été sans être ${accordPluriel(c, "servi")}, puis l'écart entre la demande de l'été et l'objectif (négatif si la demande est en dessous).`,
      champs: (c) => {
        const k = suiviDeLEte(c);
        return [
          {
            libelle: `${majuscule(c.unites)} ${accordPluriel(c, "demandé")} sans être ${accordPluriel(c, "servi")}`,
            attendu: k.pendant.repartis,
            calcul: `${qte(k.pendant.demande)} − ${qte(k.pendant.ventes)} = ${qte(k.pendant.repartis)}`,
          },
          {
            libelle: "Demande face à l'objectif",
            attendu: k.demandeFaceALObjectif,
            calcul: `${qte(k.pendant.demande)} − ${qte(k.objectif)} = ${qte(k.demandeFaceALObjectif)}`,
          },
        ];
      },
      explication: (c) => {
        const k = suiviDeLEte(c);
        return [
          k.demandeFaceALObjectif >= 0
            ? `La demande de l'été suffisait pour l'objectif : ${qte(k.pendant.demande)} ${c.unites}, pour ${qte(k.objectif)}.`
            : `Même tous servis, les clients de l'été ne faisaient pas l'objectif : ${qte(k.pendant.demande)} ${c.unites}, pour ${qte(k.objectif)}.`,
        ];
      },
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre réponse à la responsable",
      question: () => "Que répondez-vous à la responsable ?",
      options: (c) => {
        const k = suiviDeLEte(c);
        const faits = `${qte(k.pendant.demande)} ${c.unites} ${accordPluriel(c, "demandé")}, ${qte(k.pendant.ventes)} ${accordPluriel(c, "vendu")}, pour un objectif de ${qte(k.objectif)} (${pct(k.tauxDeRealisation)}).`;
        const pourquoi: Record<Verdict, string> = {
          atteint: "L'objectif est atteint : la prime est gagnée.",
          clients: "Même en servant tous les clients venus, l'équipe ne pouvait pas l'atteindre : l'objectif était trop haut pour les clients de l'été.",
          service: `Les clients étaient là, mais ${unites(c, k.pendant.repartis)} n'ont pas été ${accordPluriel(c, "servi")}.`,
          prix: `Et ${ceQueDisentLesPrix(k)}.`,
        };
        return (Object.keys(REPONSES) as Verdict[]).map((v) => ({
          texte: REPONSES[v],
          juste: v === k.verdict,
          retour: v === k.verdict ? `Oui : ${faits} ${pourquoi[v]}` : `Non : ${faits} ${pourquoi[k.verdict]}`,
        }));
      },
    },
  ],
};
