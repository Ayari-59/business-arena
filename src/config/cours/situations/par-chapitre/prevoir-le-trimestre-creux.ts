import type { Cas } from "../../cas";
import { COMMERCES } from "../../chapitres/taux-de-marque";
import { ANNEES, TRIMESTRES_PAR_AN, troisAnnees } from "../../trois-annees";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « PRÉVOIR LES VENTES » : PRÉVOIR LE TRIMESTRE CREUX (BTS MCO,
 * palier 3).
 *
 * La direction prépare les commandes et les plannings du trimestre le plus calme de
 * l'année. Elle ne veut plus prolonger la tendance des deux années passées : elle retient
 * une croissance prudente. L'élève refait seul la méthode du chapitre (les totaux annuels,
 * le coefficient saisonnier moyen, la prévision du trimestre) sur un autre trimestre, avec
 * l'hypothèse de croissance de la direction.
 *
 * Le cas est neuf par sa question : le chapitre prévoit le trimestre fort en prolongeant la
 * tendance observée, puis constate qu'elle ne s'est pas répétée ; ici, la croissance est
 * fixée par la direction, et c'est le trimestre creux qu'on prévoit, dont le coefficient
 * est sous 1. Les deux années sont celles du chapitre (`troisAnnees`).
 */

/**
 * La croissance de la demande que la direction retient pour l'année qui vient : 5 %. Le
 * chapitre a montré qu'une croissance de plus de 20 % ne se prolonge pas quand le marché
 * mûrit ; 5 % est l'ordre de grandeur d'un commerce installé sur un marché qui grandit
 * encore un peu.
 */
export const CROISSANCE_RETENUE = 0.05;

const qte = (n: number) => Math.round(n).toLocaleString("fr-FR");
const pct = (t: number) => `${t.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} %`;
const deux = (x: number) => x.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const auDixieme = (x: number) => Math.round(x * 10) / 10;
const auCentieme = (x: number) => Math.round(x * 100) / 100;

/** Les chiffres de la réponse, calculés une fois du cas. */
export function trimestreCreux(c: Cas) {
  const serie = troisAnnees(c.code).filter((q) => q.annee < ANNEES);
  const an2 = serie.filter((q) => q.annee === 2);
  // Le trimestre creux : celui où la demande de la deuxième année est la plus basse.
  const creux = an2.reduce((a, b) => (b.demande < a.demande ? b : a)).trimestre;
  const total = (annee: number) => serie.filter((q) => q.annee === annee).reduce((t, q) => t + q.demande, 0);
  const du = (annee: number) => serie.find((q) => q.annee === annee && q.trimestre === creux)!.demande;
  const total1 = total(1);
  const total2 = total(2);
  const d1 = du(1);
  const d2 = du(2);
  // Aux arrondis du chapitre : les coefficients au centième, les demandes à l'unité.
  const coef1 = auCentieme(d1 / (total1 / TRIMESTRES_PAR_AN));
  const coef2 = auCentieme(d2 / (total2 / TRIMESTRES_PAR_AN));
  const coef = auCentieme((coef1 + coef2) / 2);
  const total3 = Math.round(total2 * (1 + CROISSANCE_RETENUE));
  const prevu = Math.round((total3 / TRIMESTRES_PAR_AN) * coef);
  // La tendance des deux années, que la direction ne veut plus prolonger.
  const croissanceObservee = auDixieme((total2 / total1 - 1) * 100);
  const total3Prolonge = Math.round(total2 * (1 + croissanceObservee / 100));
  return {
    serie,
    creux,
    total1,
    total2,
    d1,
    d2,
    coef1,
    coef2,
    coef,
    total3,
    prevu,
    evolution: auDixieme((prevu / d2 - 1) * 100),
    croissanceObservee,
    // Les erreurs classiques : oublier la saison, diviser par le coefficient au lieu de
    // multiplier, prolonger la tendance observée.
    sansSaison: Math.round(total3 / TRIMESTRES_PAR_AN),
    diviseParLeCoef: Math.round(total3 / TRIMESTRES_PAR_AN / coef),
    prolonge: Math.round((total3Prolonge / TRIMESTRES_PAR_AN) * coef),
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
    "La direction prépare les commandes et les plannings du trimestre le plus calme. Elle retient une croissance prudente et vous demande la demande à prévoir.",
  objectifs: [
    "Calculer la demande de chaque année et la demande prévue avec une croissance donnée",
    "Calculer le coefficient saisonnier moyen d'un trimestre creux",
    "Prévoir la demande de ce trimestre l'année suivante",
    "Répondre à la direction en évitant les erreurs de saisonnalité",
  ],
  libre: false,
  entreprises: {
    codes: COMMERCES,
    pourquoi: "ce cas prévoit la demande d'un point de vente, qui accueille ou livre ses clients un par un.",
  },
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "La demande de la direction",
      texte: (c) => {
        const r = trimestreCreux(c);
        return [
          `« Le trimestre ${r.creux} est le plus calme de l'année. Pour préparer nos commandes et nos plannings, je veux la demande à prévoir pour ce trimestre l'an prochain. Je ne prolonge plus la croissance des deux dernières années : je retiens ${pct(CROISSANCE_RETENUE * 100)} de demande en plus sur l'année. »`,
          `Pas de cours cette fois : vous avez deux années de ${c.entreprise}, trimestre par trimestre, et la méthode est celle du chapitre. À vous de choisir la bonne série et d'enchaîner les calculs.`,
        ];
      },
      tableau: (c) => ({
        titre: `${c.entreprise} · deux années de l'arène, trimestre par trimestre`,
        colonnes: ["Demande", "Vendu"],
        lignes: trimestreCreux(c).serie.map((q) => ({ libelle: `Année ${q.annee}, trimestre ${q.trimestre}`, valeurs: [qte(q.demande), qte(q.vendu)] })),
      }),
      repere: (c) =>
        `À rendre : la demande de chaque année et celle prévue pour l'année 3, le coefficient saisonnier du trimestre ${trimestreCreux(c).creux}, la prévision de ce trimestre, et votre réponse.`,
    },
    {
      id: "l-annee-qui-vient",
      type: "montants",
      titre: "L'année qui vient",
      notions: ["seasonality"],
      question: () =>
        `Sur la série qui dit ce que le marché a voulu, additionnez les quatre trimestres de chaque année. Puis calculez la demande prévue pour l'année 3 avec la croissance retenue par la direction, ${pct(CROISSANCE_RETENUE * 100)} (à l'unité).`,
      champs: (c) => {
        const r = trimestreCreux(c);
        const an = (y: number) => r.serie.filter((q) => q.annee === y).map((q) => qte(q.demande)).join(" + ");
        return [
          { libelle: "Demande de l'année 1", attendu: r.total1, calcul: `${an(1)} = ${qte(r.total1)}` },
          { libelle: "Demande de l'année 2", attendu: r.total2, calcul: `${an(2)} = ${qte(r.total2)}` },
          { libelle: "Demande prévue pour l'année 3", attendu: r.total3, tolerance: 1, calcul: `${qte(r.total2)} × ${(1 + CROISSANCE_RETENUE).toLocaleString("fr-FR")} = ${qte(r.total3)}` },
        ];
      },
      explication: (c) => {
        const r = trimestreCreux(c);
        return [
          `On prévoit sur la demande, pas sur les ventes : les ventes ont pu être plafonnées par le stock ou la salle, et les reconduire reconduirait les ventes manquées. D'une année à l'autre, la demande adressée à ${c.entreprise} a grandi de ${pct(r.croissanceObservee)} ; la direction n'en retient que ${pct(CROISSANCE_RETENUE * 100)}.`,
        ];
      },
    },
    {
      id: "la-saison",
      type: "montants",
      titre: "La saison du trimestre creux",
      notions: ["seasonality"],
      question: (c) =>
        `Pour chaque année, rapportez la demande du trimestre ${trimestreCreux(c).creux} à la moyenne trimestrielle de l'année, au centième. Puis faites la moyenne des deux coefficients.`,
      champs: (c) => {
        const r = trimestreCreux(c);
        return [
          { libelle: "Coefficient de l'année 1", attendu: r.coef1, tolerance: 0.01, calcul: `${qte(r.d1)} ÷ (${qte(r.total1)} ÷ 4) = ${deux(r.coef1)}` },
          { libelle: "Coefficient de l'année 2", attendu: r.coef2, tolerance: 0.01, calcul: `${qte(r.d2)} ÷ (${qte(r.total2)} ÷ 4) = ${deux(r.coef2)}` },
          { libelle: "Coefficient saisonnier moyen", attendu: r.coef, tolerance: 0.01, calcul: `(${deux(r.coef1)} + ${deux(r.coef2)}) ÷ 2 = ${deux(r.coef)}` },
        ];
      },
      explication: (c) => {
        const r = trimestreCreux(c);
        return [
          `Au trimestre ${r.creux}, la demande ne vaut que ${deux(r.coef)} fois un trimestre moyen : ${pct(auDixieme((1 - r.coef) * 100))} de moins. Un coefficient sous 1, c'est un trimestre où ${c.entreprise} a besoin de moins de marchandises et de moins d'heures.`,
        ];
      },
    },
    {
      id: "la-prevision",
      type: "montants",
      titre: "La prévision",
      notions: ["seasonality"],
      question: (c) => {
        const r = trimestreCreux(c);
        return `Prévoyez la demande du trimestre ${r.creux} de l'année 3 (à l'unité), puis son évolution par rapport au même trimestre de l'année 2, en pourcentage, au dixième.`;
      },
      champs: (c) => {
        const r = trimestreCreux(c);
        return [
          { libelle: `Prévision du trimestre ${r.creux}`, attendu: r.prevu, tolerance: 2, calcul: `${qte(r.total3)} ÷ 4 × ${deux(r.coef)} = ${qte(r.prevu)}` },
          { libelle: "Évolution sur l'année 2 (%)", attendu: r.evolution, tolerance: 0.2, calcul: `(${qte(r.prevu)} ÷ ${qte(r.d2)} − 1) × 100 = ${pct(r.evolution)}` },
        ];
      },
      explication: (c) => {
        const r = trimestreCreux(c);
        return [
          `${c.entreprise} peut s'organiser pour une demande de ${qte(r.prevu)} ${c.unites} au trimestre ${r.creux} de l'année 3, contre ${qte(r.d2)} l'année 2 (${pct(r.evolution)}).`,
          r.coef === r.coef2
            ? `Le coefficient moyen est celui de l'année 2 : le trimestre suit la croissance retenue, à l'arrondi près.`
            : `L'écart avec les ${pct(CROISSANCE_RETENUE * 100)} retenus vient de la saison : le coefficient moyen, ${deux(r.coef)}, est ${r.coef < r.coef2 ? "plus bas" : "plus haut"} que celui de l'année 2, ${deux(r.coef2)}, parce qu'il compte aussi l'année 1. Le trimestre ${r.creux} pèse ${r.coef < r.coef2 ? "moins" : "plus"} dans l'année prévue que dans l'année 2.`,
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
        return [
          {
            texte: `Prévoyons ${qte(r.prevu)} ${c.unites} au trimestre ${r.creux}`,
            juste: true,
            retour: `Oui : ${qte(r.total2)} × ${(1 + CROISSANCE_RETENUE).toLocaleString("fr-FR")} = ${qte(r.total3)} sur l'année, dont un quart vaut ${qte(r.sansSaison)} ; le trimestre ${r.creux} en vaut ${deux(r.coef)} fois, soit ${qte(r.prevu)}.`,
          },
          {
            texte: `Prévoyons ${qte(r.sansSaison)} ${c.unites} : le quart de la demande prévue pour l'année`,
            juste: false,
            retour: `Non : c'est un trimestre moyen. Le trimestre ${r.creux} est plus calme, son coefficient est de ${deux(r.coef)} : il faut multiplier ${qte(r.sansSaison)} par ${deux(r.coef)}, ce qui donne ${qte(r.prevu)}.`,
          },
          {
            texte: `Prévoyons ${qte(r.diviseParLeCoef)} ${c.unites} : le quart de l'année divisé par ${deux(r.coef)}`,
            juste: false,
            retour: `Non : diviser par le coefficient enlève la saison d'un chiffre qui l'a ; pour la remettre dans un trimestre moyen, on multiplie. Un trimestre creux ne peut pas valoir plus qu'un trimestre moyen : ${qte(r.prevu)}.`,
          },
          {
            texte: `Prévoyons ${qte(r.prolonge)} ${c.unites}, en gardant la croissance de ${pct(r.croissanceObservee)} des deux années`,
            juste: false,
            retour: `Non : la direction retient ${pct(CROISSANCE_RETENUE * 100)}, pas les ${pct(r.croissanceObservee)} observés. Prolonger une tendance qui ralentit, c'est commander et planifier pour des clients qui ne viendront pas : ${qte(r.prevu)}.`,
          },
        ];
      },
    },
  ],
};
