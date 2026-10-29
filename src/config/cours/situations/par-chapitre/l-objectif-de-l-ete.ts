import type { Cas } from "../../cas";
import { PROGRESSION_EN_POURCENT, SUIVRE_SES_VENTES, calculDeLObjectif, suiviDesVentes, tableauDuSuivi, type Verdict } from "../../chapitres/suivre-ses-ventes";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « SUIVRE SES VENTES » : L'OBJECTIF DE L'ÉTÉ (Bac pro MCV, palier 1).
 *
 * La responsable des ventes a promis une prime à l'équipe si l'objectif de l'été est atteint.
 * L'objectif suit la règle du chapitre (les ventes du même trimestre de l'année d'avant, plus
 * `PROGRESSION_EN_POURCENT`), au trimestre 3 de N − 1. L'élève calcule l'objectif, l'écart, le
 * taux de réalisation, les clients repartis et la demande face à l'objectif, puis répond.
 *
 * LE CAS JOUE DANS LE MONDE DU COURS : les trois années passées de MAILLE & CO (monde/maille-et-co.ts).
 * Les chiffres sont ceux du chapitre (`suiviDesVentes`) ; seul change le trimestre. La prime
 * promise est l'hypothèse du cas. Le verdict se calcule, comme au chapitre.
 *
 * CE QUI A CHANGÉ. Le cas posait l'objectif du trimestre 3 de l'arène sur le trimestre 2, plus 10 %.
 * Il le pose maintenant sur l'été de N − 2, plus 5 % : 5 436 articles visés, 5 588 vendus, 102,8 %,
 * la prime est gagnée.
 */

/** L'été : le troisième trimestre, de juillet à septembre. */
export const TRIMESTRE_DE_L_ETE = 3;

const qte = (n: number) => n.toLocaleString("fr-FR").replace(/^-/, "−");
/** L'année de la fiche, écrite avec le signe moins : « N − 1 ». */
const an = (a: string) => a.replace("-", " − ");
const pct = (t: number) => `${t.toLocaleString("fr-FR", { maximumFractionDigits: 1 }).replace(/^-/, "−")} %`;

export const suiviDeLEte = (c: Pick<Cas, "code">) => suiviDesVentes(c, TRIMESTRE_DE_L_ETE);

/** « 152 articles », « 1 article ». */
const articles = (n: number) => `${qte(Math.abs(n))} ${Math.abs(n) > 1 ? "articles" : "article"}`;

const REPONSES: Record<Verdict | "prix", string> = {
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
  accroche: "Une prime est promise à l'équipe si l'objectif de l'été est atteint. Calculer l'objectif, le taux de réalisation et ce qui l'explique, puis dire à la responsable si la prime est gagnée.",
  objectifs: ["Calculer un objectif de ventes et son taux de réalisation", "Expliquer l'écart par les clients venus et les clients servis", "Répondre à la responsable avec les chiffres"],
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
          `« Pour l'été de ${an(k.annee)}, l'objectif a suivi la règle habituelle : les ventes de l'été de ${an(k.anneeDAvant)}, plus ${qte(PROGRESSION_EN_POURCENT)} %. J'ai promis une prime à l'équipe si l'objectif est atteint. L'a-t-elle gagnée ? Et sinon, qu'est-ce qui a manqué ? »`,
          `Pas de cours cette fois. L'été, c'est le trimestre ${qte(k.trimestre)}. Les étiquettes n'ont pas changé d'une année à l'autre.`,
        ];
      },
      repere: () => "À rendre : l'objectif de l'été, son taux de réalisation, ce qui l'explique, et votre réponse.",
    },
    {
      id: "l-objectif-et-le-realise",
      type: "montants",
      titre: "L'objectif et le réalisé de l'été",
      notions: ["dashboard"],
      question: (c) => `Calculez l'objectif de l'été (les ventes de l'été d'avant, plus ${qte(suiviDeLEte(c).progression)} %, arrondi à l'unité du dessus), l'écart avec les ventes de l'été (négatif s'il en manque), puis le taux de réalisation, au dixième.`,
      champs: (c) => {
        const k = suiviDeLEte(c);
        return [
          { libelle: "Objectif de l'été", attendu: k.objectif, calcul: calculDeLObjectif(k) },
          { libelle: "Écart en articles", attendu: k.ecart, calcul: `${qte(k.pendant.ventes)} − ${qte(k.objectif)} = ${qte(k.ecart)}` },
          { libelle: "Taux de réalisation (%)", attendu: k.tauxDeRealisation, calcul: `${qte(k.pendant.ventes)} ÷ ${qte(k.objectif)} × 100 = ${pct(k.tauxDeRealisation)}`, tolerance: 0.1 },
        ];
      },
      explication: (c) => {
        const k = suiviDeLEte(c);
        return [k.ecart >= 0 ? `${pct(k.tauxDeRealisation)} : l'objectif de l'été est atteint, avec ${articles(k.ecart)} de plus.` : `${pct(k.tauxDeRealisation)} : l'objectif de l'été est manqué de ${articles(k.ecart)}.`];
      },
    },
    {
      id: "les-clients-de-l-ete",
      type: "montants",
      titre: "Les clients de l'été",
      notions: ["conversion_rate", "dashboard"],
      question: () => "Calculez les articles que les clients ont demandés l'été sans être servis, puis l'écart entre la demande de l'été et l'objectif (négatif si la demande est en dessous).",
      champs: (c) => {
        const k = suiviDeLEte(c);
        return [
          { libelle: "Articles demandés sans être servis", attendu: k.pendant.repartis, calcul: `${qte(k.pendant.demande)} − ${qte(k.pendant.ventes)} = ${qte(k.pendant.repartis)}` },
          { libelle: "Demande face à l'objectif", attendu: k.demandeFaceALObjectif, calcul: `${qte(k.pendant.demande)} − ${qte(k.objectif)} = ${qte(k.demandeFaceALObjectif)}` },
        ];
      },
      explication: (c) => {
        const k = suiviDeLEte(c);
        return [
          k.demandeFaceALObjectif >= 0
            ? `La demande de l'été suffisait pour l'objectif : ${qte(k.pendant.demande)} articles, pour ${qte(k.objectif)}.`
            : `Même tous servis, les clients de l'été ne faisaient pas l'objectif : ${qte(k.pendant.demande)} articles, pour ${qte(k.objectif)}.`,
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
        const faits = `${qte(k.pendant.demande)} articles demandés, ${qte(k.pendant.ventes)} vendus, pour un objectif de ${qte(k.objectif)} (${pct(k.tauxDeRealisation)}).`;
        const pourquoi: Record<Verdict, string> = {
          atteint: "L'objectif est atteint : la prime est gagnée.",
          clients: "Même en servant tous les clients venus, l'équipe ne pouvait pas l'atteindre : l'objectif était trop haut pour les clients de l'été.",
          service: `Les clients étaient là, mais ${articles(k.pendant.repartis)} n'ont pas été servis.`,
        };
        return (Object.keys(REPONSES) as (Verdict | "prix")[]).map((v) => ({
          texte: REPONSES[v],
          juste: v === k.verdict,
          retour: v === k.verdict ? `Oui : ${faits} ${pourquoi[k.verdict]}` : v === "prix" ? `Non : les étiquettes n'ont pas changé. ${faits} ${pourquoi[k.verdict]}` : `Non : ${faits} ${pourquoi[k.verdict]}`,
        }));
      },
    },
  ],
};
