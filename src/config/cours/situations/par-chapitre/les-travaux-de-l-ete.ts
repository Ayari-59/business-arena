import { montantEcrit } from "../../../../pedagogy/cours/correcteur";
import type { Cas } from "../../cas";
import { LE_CLIENT_QUI_REVIENT, ficheDe } from "../../chapitres/le-client-qui-revient";
import { JOURS_DE_FERMETURE, MOIS_DES_TRAVAUX, PART_DES_FIDELES_QUI_NE_REVIENNENT_PAS, carteDeFidelite, fermeturePourTravaux } from "../../monde/vente-et-caisse";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « LE CLIENT QUI REVIENT ET LE CLIENT QUI PART » : LES TRAVAUX DE
 * L'ÉTÉ (Bac pro Métiers du commerce et de la vente, palier 2).
 *
 * La boutique doit fermer 15 jours pour refaire sa vitrine. La gérante hésite entre mai et
 * juillet. Pendant la fermeture, elle perd les ventes de ces jours, et des clientes fidèles qui
 * trouvent porte close ne reviennent pas. L'élève refait les calculs du chapitre (la marge d'une
 * cliente gardée toute l'année) sur les deux moments, et répond.
 *
 * LE CAS JOUE DANS LE MONDE DU COURS : les ventes trimestrielles de N − 1 de MAILLE & CO (la fiche),
 * la marge moyenne d'un article de janvier, et la carte de fidélité du chapitre
 * (monde/vente-et-caisse.ts). HYPOTHÈSES DU CAS : 15 jours de fermeture, au rythme du trimestre de
 * N − 1 ; 20 % des clientes fidèles qui trouvent porte close ne reviennent pas, et chacune emporte
 * une année de marge. Le verdict se calcule : il suit la marge perdue, à 5 % près.
 *
 * CE QUI A CHANGÉ. Le cas rejouait dans l'arène l'année de la salle de sport avec des places fermées
 * au printemps ou en été. Il compte maintenant la fermeture de la boutique : en mai, 38 662,32 € de
 * marge perdue ; en juillet, 50 490,60 €.
 */

/** Deux coûts « à peu près égaux » à 5 % près (hypothèse du cas : le verdict ne tient pas à un arrondi). */
export const ECART_NEGLIGEABLE = 0.05;

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const qte = (n: number) => n.toLocaleString("fr-FR").replace(/^-/, "−");
const pct = (t: number) => `${(t * 100).toLocaleString("fr-FR", { maximumFractionDigits: 1 })} %`;

export type QuandFaireLesTravaux = "mai" | "juillet" | "pareil";

/** La fermeture en mai et en juillet, et le moment qui coûte le moins. */
export function travauxDeLEte(c: Pick<Cas, "code">) {
  const f = ficheDe(c);
  const mai = fermeturePourTravaux(f, MOIS_DES_TRAVAUX.mai);
  const juillet = fermeturePourTravaux(f, MOIS_DES_TRAVAUX.juillet);
  const ecart = Math.round((juillet.total - mai.total) * 100) / 100;
  const quand: QuandFaireLesTravaux = Math.abs(ecart) <= ECART_NEGLIGEABLE * mai.total ? "pareil" : ecart < 0 ? "juillet" : "mai";
  return { mai, juillet, ecart, quand, carte: carteDeFidelite(f) };
}

type Fermeture = ReturnType<typeof fermeturePourTravaux>;

const champsDe = (x: Fermeture, margeDeLAnnee: number) => [
  { libelle: "Articles non vendus pendant la fermeture", attendu: x.articlesPerdus, calcul: `${qte(x.ventesDuTrimestre)} ÷ ${qte(x.joursDuTrimestre)} × ${qte(JOURS_DE_FERMETURE)} = ${qte(x.articlesPerdus)}, à l'unité`, tolerance: 1 },
  { libelle: "Marge de ces ventes", attendu: x.margeDesVentes, calcul: `${qte(x.articlesPerdus)} × ${eur(x.margeDUnArticle)} = ${eur(x.margeDesVentes)}`, tolerance: 30 },
  { libelle: "Clientes fidèles perdues", attendu: x.fidelesPerdues, calcul: `${qte(x.fidelesAttendues)} × ${pct(PART_DES_FIDELES_QUI_NE_REVIENNENT_PAS)} = ${qte(x.fidelesPerdues)}` },
  { libelle: "Marge perdue avec elles", attendu: x.margeDesFideles, calcul: `${qte(x.fidelesPerdues)} × ${eur(margeDeLAnnee)} = ${eur(x.margeDesFideles)}` },
  { libelle: "Marge perdue en tout", attendu: x.total, calcul: `${eur(x.margeDesVentes)} + ${eur(x.margeDesFideles)} = ${eur(x.total)}`, tolerance: 30 },
];

export const LES_TRAVAUX_DE_L_ETE: Situation = {
  code: "les-travaux-de-l-ete",
  parcours: "vente",
  palier: 2,
  blocs: [],
  reprend: [LE_CLIENT_QUI_REVIENT.code],
  commanditaire: "La gérante de la boutique",
  titre: "Les travaux de l'été",
  accroche: "La boutique doit fermer pour refaire sa vitrine. En mai ou en juillet ? Compter les ventes perdues, les clientes fidèles qui ne reviendront pas, et répondre à la gérante.",
  objectifs: ["Compter les ventes perdues pendant une fermeture", "Chiffrer les clientes perdues avec leur marge de l'année", "Comparer deux moments pour des travaux"],
  libre: false,
  entreprises: LE_CLIENT_QUI_REVIENT.entreprises,
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "La demande de la gérante",
      tableau: (c) => {
        const k = travauxDeLEte(c);
        return {
          titre: `${c.entreprise} · les ventes de N − 1`,
          colonnes: ["Articles vendus dans le trimestre"],
          lignes: [
            { libelle: "Trimestre 2 (avril à juin)", valeurs: [qte(k.mai.ventesDuTrimestre)] },
            { libelle: "Trimestre 3 (juillet à septembre)", valeurs: [qte(k.juillet.ventesDuTrimestre)] },
          ],
        };
      },
      texte: (c) => {
        const k = travauxDeLEte(c);
        return [
          `« Nous devons fermer ${qte(JOURS_DE_FERMETURE)} jours pour refaire la vitrine. En mai ou en juillet ? On perd les ventes de ces jours, au rythme du trimestre de l'an dernier. Et pendant la fermeture, ${qte(k.mai.fidelesAttendues)} clientes fidèles devaient passer : je crains que ${pct(PART_DES_FIDELES_QUI_NE_REVIENNENT_PAS)} d'entre elles ne reviennent pas. »`,
          `Pas de cours cette fois. Un article vendu laisse en moyenne ${eur(k.mai.margeDUnArticle)} de marge, et une cliente fidèle gardée toute l'année ${eur(k.carte.margeDeLAnnee)}. Un trimestre compte ${qte(k.mai.joursDuTrimestre)} jours.`,
        ];
      },
      repere: () => "À rendre : la marge perdue en mai, la marge perdue en juillet, et le meilleur moment pour les travaux.",
    },
    {
      id: "en-mai",
      type: "montants",
      titre: "Fermer en mai",
      notions: ["churn_rate", "customer_lifetime_value"],
      question: () => "Pour une fermeture en mai, calculez les articles non vendus (les ventes du trimestre 2 ÷ les jours du trimestre × les jours de fermeture), leur marge, les clientes fidèles perdues, leur marge de l'année, puis la marge perdue en tout.",
      champs: (c) => {
        const k = travauxDeLEte(c);
        return champsDe(k.mai, k.carte.margeDeLAnnee);
      },
      explication: (c) => {
        const k = travauxDeLEte(c);
        return [`En mai, la fermeture coûte ${eur(k.mai.total)} de marge, dont ${eur(k.mai.margeDesFideles)} pour les clientes qui ne reviendront pas.`];
      },
    },
    {
      id: "en-juillet",
      type: "montants",
      titre: "Fermer en juillet",
      notions: ["churn_rate", "customer_lifetime_value"],
      question: () => "Refaites les mêmes calculs pour une fermeture en juillet, au rythme du trimestre 3.",
      champs: (c) => {
        const k = travauxDeLEte(c);
        return champsDe(k.juillet, k.carte.margeDeLAnnee);
      },
      explication: (c) => {
        const k = travauxDeLEte(c);
        return [`En juillet, la fermeture coûte ${eur(k.juillet.total)} de marge : les mêmes clientes perdues, mais des ventes plus fortes qu'au printemps.`];
      },
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre réponse à la gérante",
      question: (c) => {
        const k = travauxDeLEte(c);
        return `La fermeture coûte ${eur(k.mai.total)} de marge en mai, ${eur(k.juillet.total)} en juillet. Quand faut-il faire les travaux ?`;
      },
      options: (c) => {
        const k = travauxDeLEte(c);
        const faits = `En mai, ${eur(k.mai.total)} de marge perdue ; en juillet, ${eur(k.juillet.total)}.`;
        return [
          { texte: "En mai, quand la boutique vend le moins", juste: k.quand === "mai", retour: k.quand === "mai" ? `Oui. ${faits} Fermer quand peu de clients viennent, c'est perdre moins de ventes ; les clientes fidèles, elles, coûtent autant à perdre dans les deux cas.` : `Non. ${faits}` },
          { texte: "En juillet, pendant les vacances", juste: k.quand === "juillet", retour: k.quand === "juillet" ? `Oui. ${faits}` : `Non. ${faits} L'été vend plus que le printemps : les mêmes jours fermés y font perdre plus de ventes.` },
          { texte: "C'est pareil : les mêmes jours sont fermés", juste: k.quand === "pareil", retour: k.quand === "pareil" ? `Oui. ${faits}` : `Non. ${faits} Les mêmes jours fermés ne coûtent pas autant selon la saison.` },
        ];
      },
    },
  ],
};
