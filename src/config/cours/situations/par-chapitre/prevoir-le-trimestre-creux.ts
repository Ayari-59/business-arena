import type { Cas } from "../../cas";
import { ENTREPRISES_DE_LA_PREVISION, previsionDesVentes, trimestreDuRang } from "../../chapitres/prevoir-les-ventes";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « PRÉVOIR LES VENTES » : PRÉVOIR LE TRIMESTRE CREUX (BTS MCO, palier 3).
 *
 * LE CAS JOUE DANS LE MONDE DU COURS, comme son chapitre : la boutique MAILLE & CO, ses trois années
 * de demande (monde/maille-et-co.ts) et la tendance du chapitre (`previsionDesVentes`).
 *
 * La direction prépare le trimestre le plus calme de l'année, le trimestre 2 : les commandes, et le
 * renfort du printemps, qu'elle ne garde que si la demande prévue atteint un seuil. L'élève refait
 * seul le coefficient saisonnier de ce trimestre (les rapports à la tendance, puis la correction), sa
 * prévision pour N, puis un calcul à rebours : l'année où le trimestre 2 franchit le seuil. La réponse
 * demande un jugement : la bonne prévision, et la bonne décision sur le renfort.
 *
 * Le cas est neuf par sa question : le chapitre prévoit les trimestres 1 et 4 et remonte la tendance
 * vers un seuil ; ici, on prévoit le trimestre 2, au coefficient sous 0,5, et le seuil porte sur un
 * trimestre saisonnier, pas sur la tendance. Les pièges sont ceux de l'épreuve : prolonger le même
 * trimestre de la croissance annuelle, oublier la saison, diviser par le coefficient au lieu de
 * multiplier, tracer la droite sur les trimestres bruts.
 *
 * Pas de curseur : sa lecture s'affiche en euros, et la question porte sur des articles.
 */

/**
 * LE RENFORT DU PRINTEMPS, hypothèse du cours : la direction ne garde l'étudiante du mercredi et du
 * samedi au trimestre 2 que si la demande prévue de ce trimestre atteint 3 500 articles.
 */
export const SEUIL_DU_RENFORT = 3_500;

const qte = (n: number) => n.toLocaleString("fr-FR", { maximumFractionDigits: 2 }).replace(/^-/, "−");
const art = (n: number) => qte(Math.round(n));
const dec = (x: number, d = 2) => x.toLocaleString("fr-FR", { minimumFractionDigits: d, maximumFractionDigits: d }).replace(/^-/, "−");
const pct = (x: number) => `${x.toLocaleString("fr-FR", { maximumFractionDigits: 2 }).replace(/^-/, "−")} %`;
const auCentime = (x: number) => Math.round(x * 100) / 100 + 0;

/** Les chiffres de la réponse, calculés une fois du cas. */
export function trimestreCreux(c: Pick<Cas, "code">) {
  const x = previsionDesVentes(c);
  const creux = x.p.serie.filter((s) => s.trimestre === 2);
  const n1 = creux.at(-1)!;
  const k = x.p.coefficients[1]!;
  const t2 = x.p.previsions[1]!;
  // Le seuil du renfort, à rebours : la tendance qu'il faut, son rang, puis le premier trimestre 2 au-delà.
  const tendanceQuIlFaut = SEUIL_DU_RENFORT / k;
  const rangDuSeuil = (tendanceQuIlFaut - x.b) / x.a;
  const premierCreux = creux.length * 4 + 2 + 4 * Math.max(0, Math.ceil((rangDuSeuil - 14) / 4 - 1e-9));
  const previsionAuSeuil = x.tendance(premierCreux) * k;
  return {
    x,
    creux,
    n1,
    k,
    t2,
    tendanceQuIlFaut,
    rangDuSeuil,
    premierCreux,
    previsionAuSeuil,
    evolution: t2.prevision / n1.demande - 1,
    renfortDesN: t2.prevision >= SEUIL_DU_RENFORT,
    // Les erreurs de l'épreuve : le même trimestre prolongé de la croissance de l'année, la saison
    // oubliée, la droite des trimestres bruts.
    prolonge: n1.demande * (x.annuelle.totaux[2]! / x.annuelle.totaux[1]!),
    sansSaison: t2.tendance,
    brute: x.brute.previsions[1]!.prevision,
  };
}

export const PREVOIR_LE_TRIMESTRE_CREUX: Situation = {
  code: "prevoir-le-trimestre-creux",
  parcours: "mco",
  palier: 3,
  blocs: [],
  reprend: ["prevoir-les-ventes"],
  commanditaire: "La direction",
  titre: "Prévoir le trimestre creux",
  accroche:
    "La direction prépare le trimestre le plus calme de l'année : les commandes, et le renfort du printemps, qu'elle ne garde qu'au-delà d'un seuil. Elle vous demande la prévision, et l'année où le seuil sera franchi.",
  objectifs: [
    "Calculer et corriger le coefficient saisonnier d'un trimestre creux par le rapport à la tendance",
    "Prévoir ce trimestre pour l'année N et son évolution sur N − 1",
    "Retrouver à rebours l'année où le trimestre franchit un seuil",
    "Répondre à la direction en évitant les erreurs de saisonnalité",
  ],
  libre: false,
  entreprises: {
    codes: ENTREPRISES_DE_LA_PREVISION,
    pourquoi:
      "ce cas prévoit la demande de la boutique du cours, MAILLE & CO, la seule dont la simulation tient trois années de demande trimestre par trimestre ; le point de vente reste le même d'un chapitre à l'autre.",
  },
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "La demande de la direction",
      texte: (c) => {
        const r = trimestreCreux(c);
        return [
          `« Le trimestre 2 est le plus calme de l'année. Pour préparer nos commandes, je veux la demande à prévoir pour le trimestre 2 de N. Et je ne garderai l'étudiante du mercredi et du samedi ce trimestre-là que si la demande prévue atteint ${art(SEUIL_DU_RENFORT)} articles : si ce n'est pas le cas en N, dites-moi en quelle année ce le sera. »`,
          `Pas de cours cette fois : vous avez la demande des trois années de ${r.x.f.entreprise} et la tendance du chapitre, y = ${dec(r.x.a)} x + ${dec(r.x.b)} (x, le rang du trimestre : 1 pour le trimestre 1 de N − 3). Les 4 coefficients bruts du chapitre font ${dec(r.x.p.sommeBrute, 4)}. À vous d'enchaîner les calculs.`,
        ];
      },
      tableau: (c) => {
        const r = trimestreCreux(c);
        return {
          titre: `${r.x.f.entreprise} · la demande et sa tendance, trimestre par trimestre`,
          colonnes: ["Rang", "Demande", "Tendance"],
          lignes: r.x.p.serie.map((s) => ({ libelle: trimestreDuRang(s.rang).libelle, valeurs: [String(s.rang), qte(s.demande), dec(s.tendance)] })),
        };
      },
      repere: () =>
        "À rendre : le coefficient saisonnier du trimestre 2, sa prévision pour N, l'année où il atteint le seuil du renfort, et votre réponse.",
    },
    {
      id: "la-saison-du-creux",
      type: "montants",
      titre: "La saison du trimestre creux",
      notions: ["seasonality"],
      question: () =>
        "Rapportez la demande de chaque trimestre 2 à sa tendance, en pourcentage de la tendance, au centième. Puis le coefficient saisonnier corrigé du trimestre 2, en pourcentage aussi.",
      champs: (c) => {
        const r = trimestreCreux(c);
        const brut = r.x.p.coefficientsBruts[1]!;
        return [
          ...r.creux.map((s) => ({
            libelle: `Trimestre 2 de ${trimestreDuRang(s.rang).annee} (% de la tendance)`,
            attendu: auCentime(s.rapport * 100),
            tolerance: 0.05,
            calcul: `${qte(s.demande)} ÷ ${dec(s.tendance)} × 100 = ${dec(s.rapport * 100)}`,
          })),
          {
            libelle: "Coefficient corrigé du trimestre 2 (%)",
            attendu: auCentime(r.k * 100),
            tolerance: 0.05,
            calcul: `(${r.creux.map((s) => dec(s.rapport * 100)).join(" + ")}) ÷ 3 = ${dec(brut * 100)}, × 4 ÷ ${dec(r.x.p.sommeBrute, 4)} = ${dec(r.k * 100)}`,
          },
        ];
      },
      explication: (c) => {
        const r = trimestreCreux(c);
        return [
          `Au trimestre 2, la demande ne vaut que ${pct(auCentime(r.k * 100))} de sa tendance : un coefficient de ${dec(r.k, 4)}. C'est un trimestre où ${r.x.f.entreprise} a besoin de moins de marchandises et de moins d'heures.`,
        ];
      },
    },
    {
      id: "la-prevision",
      type: "montants",
      titre: "La prévision du trimestre 2 de N",
      notions: ["seasonality"],
      question: () => "Prévoyez la demande du trimestre 2 de N, à l'article près, puis son évolution sur le trimestre 2 de N − 1, en pourcentage, au centième.",
      champs: (c) => {
        const r = trimestreCreux(c);
        return [
          { libelle: "Tendance du trimestre 2 de N", attendu: auCentime(r.t2.tendance), tolerance: 0.05, calcul: `${dec(r.x.a)} × ${r.t2.rang} + ${dec(r.x.b)} = ${dec(r.t2.tendance)}` },
          { libelle: "Prévision du trimestre 2 de N", attendu: Math.round(r.t2.prevision), tolerance: 2, calcul: `${dec(r.t2.tendance)} × ${dec(r.k, 4)} = ${art(r.t2.prevision)}` },
          {
            libelle: "Évolution sur le trimestre 2 de N − 1 (%)",
            attendu: auCentime(r.evolution * 100),
            tolerance: 0.1,
            calcul: `(${art(r.t2.prevision)} ÷ ${qte(r.n1.demande)} − 1) × 100 = ${pct(auCentime(r.evolution * 100))}`,
          },
        ];
      },
      explication: (c) => {
        const r = trimestreCreux(c);
        return [
          `${r.x.f.entreprise} peut s'organiser pour ${art(r.t2.prevision)} articles au trimestre 2 de N, contre ${qte(r.n1.demande)} en N − 1. C'est ${art(SEUIL_DU_RENFORT - r.t2.prevision)} articles sous le seuil du renfort.`,
        ];
      },
    },
    {
      id: "a-rebours",
      type: "montants",
      titre: "L'année du renfort",
      notions: ["seasonality"],
      question: () =>
        `À rebours : quelle tendance faut-il pour qu'un trimestre 2 atteigne ${art(SEUIL_DU_RENFORT)} articles (avec le coefficient à 4 décimales) ? À quel rang la tendance l'atteint-elle, au centième ? Puis prévoyez le premier trimestre 2 qui vient après ce rang.`,
      champs: (c) => {
        const r = trimestreCreux(c);
        return [
          { libelle: "Tendance qu'il faut au trimestre 2", attendu: auCentime(r.tendanceQuIlFaut), tolerance: 1, calcul: `${art(SEUIL_DU_RENFORT)} ÷ ${dec(r.k, 4)} = ${dec(r.tendanceQuIlFaut)}` },
          { libelle: "Rang où la tendance l'atteint", attendu: auCentime(r.rangDuSeuil), tolerance: 0.02, calcul: `(${dec(r.tendanceQuIlFaut)} − ${dec(r.x.b)}) ÷ ${dec(r.x.a)} = ${dec(r.rangDuSeuil)}` },
          {
            libelle: `Prévision du ${trimestreDuRang(r.premierCreux).libelle}`,
            attendu: Math.round(r.previsionAuSeuil),
            tolerance: 2,
            calcul: `le premier trimestre 2 après le rang ${dec(r.rangDuSeuil)} est le rang ${r.premierCreux} : (${dec(r.x.a)} × ${r.premierCreux} + ${dec(r.x.b)}) × ${dec(r.k, 4)} = ${art(r.previsionAuSeuil)}`,
          },
        ];
      },
      explication: (c) => {
        const r = trimestreCreux(c);
        return [
          `La tendance franchit ${art(r.tendanceQuIlFaut)} articles au rang ${dec(r.rangDuSeuil)}, en fin de N ; le premier trimestre 2 qui suit est celui de ${trimestreDuRang(r.premierCreux).annee}, avec ${art(r.previsionAuSeuil)} articles. Un seuil sur un trimestre saisonnier se remonte par sa tendance : le seuil ÷ le coefficient, puis la droite à l'envers.`,
        ];
      },
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre réponse à la direction",
      question: () => "Quelle phrase envoyez-vous à la direction ?",
      options: (c) => {
        const r = trimestreCreux(c);
        const an = trimestreDuRang(r.premierCreux).annee;
        return [
          {
            texte: `Prévoir ${art(r.t2.prevision)} articles, et le renfort pour ${an}`,
            juste: true,
            retour: `Oui : la tendance du trimestre 2 de N, ${dec(r.t2.tendance)}, × ${dec(r.k, 4)} donne ${art(r.t2.prevision)} articles, sous les ${art(SEUIL_DU_RENFORT)} du renfort. Le seuil est franchi au trimestre 2 de ${an}, avec ${art(r.previsionAuSeuil)} articles.`,
          },
          {
            texte: `Prévoir ${art(r.prolonge)} articles, le trimestre 2 de N − 1 augmenté de la croissance de l'année, et le renfort pour ${an}`,
            juste: false,
            retour: `Non : prolonger un seul trimestre de la croissance annuelle, c'est oublier que la tendance se lit trimestre par trimestre et que la saison se mesure sur trois années. La méthode donne ${art(r.t2.prevision)}.`,
          },
          {
            texte: `Prévoir ${art(r.brute)} articles par la droite des trimestres bruts, et garder le renfort dès N`,
            juste: false,
            retour: `Non : la droite des trimestres bruts prend Noël pour de la croissance, et sa pente gonfle. Elle ferait garder un renfort pour ${art(r.brute - r.t2.prevision)} articles qui ne viendront pas : ${art(r.t2.prevision)}.`,
          },
          {
            texte: `Prévoir ${art(r.sansSaison)} articles, la tendance du trimestre, et garder le renfort dès N`,
            juste: false,
            retour: `Non : la tendance est un trimestre moyen. Le trimestre 2 n'en vaut que ${pct(auCentime(r.k * 100))} : il faut la multiplier par ${dec(r.k, 4)}, ce qui donne ${art(r.t2.prevision)}.`,
          },
        ];
      },
    },
  ],
};
