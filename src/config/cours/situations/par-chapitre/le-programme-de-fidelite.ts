import { montantEcrit as eur } from "../../../../pedagogy/cours/correcteur";
import { auCentime } from "../../../../pedagogy/cours/etats";
import type { Cas } from "../../cas";
import { portefeuille } from "../../chapitres/valeur-d-un-client";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « LA VALEUR D'UN CLIENT » : LE PROGRAMME DE FIDÉLITÉ
 * (BTS NDRC, palier 3).
 *
 * La gérante envisage une remise de fidélité sur l'abonnement, en échange d'une
 * attrition plus faible. Elle demande si l'adhérent vaudra plus ou moins qu'aujourd'hui.
 * L'élève refait seul le chemin du chapitre : le taux d'attrition, la marge par adhérent,
 * la valeur vie client, puis les mêmes calculs avec le programme, l'attrition au-delà de
 * laquelle il ne paie plus, et la phrase qu'il rend.
 *
 * Le cas est neuf par sa question : la marge et l'attrition ne sont plus celles du
 * premier trimestre, elles bougent ensemble. Les chiffres de départ sont ceux du
 * portefeuille de l'arène, lus par `portefeuille`.
 */

/**
 * La remise de fidélité : 10 % de l'abonnement trimestriel, à chaque renouvellement.
 * C'est l'ordre de grandeur des offres « fidélité » des salles de sport, un mois offert
 * sur l'année environ.
 */
export const REMISE_DE_FIDELITE = 0.1;

/**
 * Ce que la gérante espère du programme : une attrition plus faible d'un cinquième.
 * C'est la promesse du prestataire qui vend le programme, à vérifier ensuite ; le cas
 * calcule aussi l'attrition au-delà de laquelle elle ne suffirait plus.
 */
export const BAISSE_D_ATTRITION_ESPEREE = 0.2;

const pct = (t: number) => `${t.toLocaleString("fr-FR", { maximumFractionDigits: 2 })} %`;
const qte = (n: number) => n.toLocaleString("fr-FR");
const auDixieme = (x: number) => Math.round(x * 10) / 10;

/** Ce que vaut un adhérent aujourd'hui, et avec le programme. */
export function programmeDeFidelite(c: Cas) {
  const p = portefeuille(c);
  const remise = auCentime(p.revenuParAdherent * REMISE_DE_FIDELITE);
  const margeAvec = auCentime(p.marge - remise);
  const attritionAvec = auDixieme(p.t1.attrition * (1 - BAISSE_D_ATTRITION_ESPEREE));
  // Même règle que le chapitre : la valeur vie client se calcule à l'euro.
  const vvcAvec = Math.round(margeAvec / (attritionAvec / 100));
  return {
    p,
    tauxDeRemise: REMISE_DE_FIDELITE * 100,
    baisse: BAISSE_D_ATTRITION_ESPEREE * 100,
    remise,
    margeAvec,
    attritionAvec,
    dureeAvec: auDixieme(100 / attritionAvec),
    vvcAvec,
    gain: vvcAvec - p.vvc,
    // L'attrition qui, avec la remise, laisse la même valeur vie client qu'aujourd'hui.
    attritionPlafond: auCentime((margeAvec / p.vvc) * 100),
    // L'erreur classique : compter la baisse d'attrition sans retirer la remise de la marge.
    vvcSansLaRemise: Math.round(p.marge / (attritionAvec / 100)),
  };
}

export const LE_PROGRAMME_DE_FIDELITE: Situation = {
  code: "le-programme-de-fidelite",
  parcours: "ndrc",
  palier: 3,
  blocs: [],
  reprend: ["valeur-d-un-client"],
  commanditaire: "La gérante",
  titre: "Le programme de fidélité",
  accroche:
    "Une remise sur l'abonnement pour garder les adhérents plus longtemps : la gérante veut savoir si un adhérent vaudra plus, ou moins, qu'aujourd'hui.",
  objectifs: [
    "Calculer le taux d'attrition et la marge par adhérent",
    "Calculer la valeur vie client avant et après une remise de fidélité",
    "Trouver l'attrition au-delà de laquelle le programme ne paie plus",
    "Rédiger une réponse chiffrée à la gérante",
  ],
  libre: false,
  entreprises: {
    codes: ["fitness"],
    pourquoi: "ce cas suit un portefeuille d'abonnés, et VOLT FITNESS est l'entreprise de l'arène qui vend à l'abonnement.",
  },
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "La demande de la gérante",
      texte: (c) => {
        const r = programmeDeFidelite(c);
        return [
          `« Je pense offrir à nos adhérents une remise de fidélité de ${pct(r.tauxDeRemise)} sur l'abonnement, à chaque renouvellement. Le prestataire du programme promet que l'attrition baissera d'un cinquième. Je perds de la marge chaque trimestre, je garde les adhérents plus longtemps : au bout du compte, un adhérent de ${c.entreprise} vaudra-t-il plus ou moins qu'aujourd'hui ? »`,
          "Pas de cours cette fois : vous avez les chiffres du premier trimestre, et la méthode est celle du chapitre. À vous de l'enchaîner.",
        ];
      },
      tableau: (c) => {
        const { p, tauxDeRemise, baisse } = programmeDeFidelite(c);
        return {
          titre: `Le premier trimestre · ${c.entreprise}`,
          colonnes: ["Valeur"],
          lignes: [
            { libelle: "Adhérents en début de trimestre", valeurs: [qte(p.t1.ouverture)] },
            { libelle: "Adhérents partis (non renouvelés)", valeurs: [qte(p.t1.departs)] },
            { libelle: "Adhérents servis dans le trimestre", valeurs: [qte(p.t1.cloture)] },
            { libelle: "Chiffre d'affaires du trimestre", valeurs: [eur(p.chiffreDAffaires)] },
            { libelle: "Coûts variables du trimestre", valeurs: [eur(p.coutsVariables)] },
            { libelle: "Remise de fidélité envisagée, sur l'abonnement", valeurs: [pct(tauxDeRemise)] },
            { libelle: "Baisse promise de l'attrition, en part de son taux actuel", valeurs: [pct(baisse)] },
          ],
        };
      },
      repere: () =>
        "À rendre : la valeur vie client d'aujourd'hui, celle avec le programme, l'attrition au-delà de laquelle il ne paie plus, et votre réponse.",
    },
    {
      id: "aujourd-hui",
      type: "montants",
      titre: "Ce que vaut un adhérent aujourd'hui",
      notions: ["churn_rate", "customer_lifetime_value"],
      question: () =>
        "Calculez le taux d'attrition du trimestre (au dixième), la marge par adhérent servi (revenu moins coût variable par adhérent), puis la valeur vie client (marge ÷ taux d'attrition, à l'euro).",
      champs: (c) => {
        const { p } = programmeDeFidelite(c);
        return [
          { libelle: "Taux d'attrition (%)", attendu: p.t1.attrition, tolerance: 0.1, calcul: `${qte(p.t1.departs)} ÷ ${qte(p.t1.ouverture)} × 100 = ${pct(p.t1.attrition)}` },
          { libelle: "Marge par adhérent et par trimestre", attendu: p.marge, calcul: `(${eur(p.chiffreDAffaires)} − ${eur(p.coutsVariables)}) ÷ ${qte(p.t1.cloture)} = ${eur(p.marge)}` },
          { libelle: "Valeur vie client", attendu: p.vvc, tolerance: Math.max(2, Math.round(p.vvc * 0.01)), calcul: `${eur(p.marge)} ÷ ${pct(p.t1.attrition)} = ${eur(p.vvc)}` },
        ];
      },
      explication: (c) => {
        const { p } = programmeDeFidelite(c);
        return [
          `Aujourd'hui, un adhérent reste ${qte(p.dureeDeVie)} trimestres en moyenne et laisse ${eur(p.marge)} à chacun : il vaut ${eur(p.vvc)}. C'est la valeur que le programme doit dépasser.`,
        ];
      },
    },
    {
      id: "avec-le-programme",
      type: "montants",
      titre: "Avec le programme",
      notions: ["customer_lifetime_value", "churn_rate", "contribution_margin"],
      question: (c) => {
        const r = programmeDeFidelite(c);
        return `Avec la remise de ${pct(r.tauxDeRemise)} sur l'abonnement de ${eur(r.p.revenuParAdherent)}, que devient la marge par adhérent et par trimestre ? Si l'attrition baisse d'un cinquième, quel est son nouveau taux (au dixième), et que vaut alors un adhérent sur sa vie de client (à l'euro) ?`;
      },
      champs: (c) => {
        const r = programmeDeFidelite(c);
        return [
          { libelle: "Remise par adhérent et par trimestre", attendu: r.remise, calcul: `${eur(r.p.revenuParAdherent)} × ${pct(r.tauxDeRemise)} = ${eur(r.remise)}` },
          { libelle: "Marge par adhérent avec la remise", attendu: r.margeAvec, calcul: `${eur(r.p.marge)} − ${eur(r.remise)} = ${eur(r.margeAvec)}` },
          { libelle: "Taux d'attrition avec le programme (%)", attendu: r.attritionAvec, tolerance: 0.1, calcul: `${pct(r.p.t1.attrition)} × (1 − ${pct(r.baisse)}) = ${pct(r.attritionAvec)}` },
          { libelle: "Valeur vie client avec le programme", attendu: r.vvcAvec, tolerance: Math.max(2, Math.round(r.vvcAvec * 0.01)), calcul: `${eur(r.margeAvec)} ÷ ${pct(r.attritionAvec)} ≈ ${eur(r.vvcAvec)}` },
        ];
      },
      explication: (c) => {
        const r = programmeDeFidelite(c);
        return [
          `L'adhérent rapporte moins à chaque trimestre (${eur(r.margeAvec)} au lieu de ${eur(r.p.marge)}), mais il reste ${qte(r.dureeAvec)} trimestres au lieu de ${qte(r.p.dureeDeVie)}. La remise se paie à chaque renouvellement : c'est la marge réduite qu'il faut diviser par la nouvelle attrition.`,
        ];
      },
    },
    {
      id: "plafond",
      type: "montants",
      titre: "Ce que le programme doit tenir",
      notions: ["customer_lifetime_value", "churn_rate"],
      question: (c) => {
        const r = programmeDeFidelite(c);
        return `Que gagne-t-on par adhérent avec le programme, en valeur vie client ? Et au-delà de quel taux d'attrition (marge avec la remise ÷ valeur vie d'aujourd'hui, au centième) un adhérent vaudrait-il moins qu'aujourd'hui, la remise de ${pct(r.tauxDeRemise)} restant payée ?`;
      },
      champs: (c) => {
        const r = programmeDeFidelite(c);
        return [
          { libelle: "Écart de valeur vie client par adhérent", attendu: r.gain, tolerance: Math.max(3, Math.round(r.vvcAvec * 0.01)), calcul: `${eur(r.vvcAvec)} − ${eur(r.p.vvc)} = ${eur(r.gain)}` },
          { libelle: "Attrition au-delà de laquelle le programme ne paie plus (%)", attendu: r.attritionPlafond, tolerance: 0.05, calcul: `${eur(r.margeAvec)} ÷ ${eur(r.p.vvc)} × 100 = ${pct(r.attritionPlafond)}` },
        ];
      },
      explication: (c) => {
        const r = programmeDeFidelite(c);
        return [
          r.attritionAvec < r.attritionPlafond
            ? `La promesse du prestataire (${pct(r.attritionAvec)}) passe sous ce plafond de ${pct(r.attritionPlafond)} : le programme paie sa remise. Mais il suffirait que l'attrition ne descende qu'à ${pct(r.attritionPlafond)} pour qu'il ne rapporte plus rien : la gérante devra la suivre chaque trimestre.`
            : `La promesse du prestataire (${pct(r.attritionAvec)}) ne passe pas sous ce plafond de ${pct(r.attritionPlafond)} : même tenue, elle ne paie pas la remise.`,
        ];
      },
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre réponse à la gérante",
      question: () => "Quelle phrase envoyez-vous à la gérante ?",
      options: (c) => {
        const r = programmeDeFidelite(c);
        const paie = r.gain > 0;
        return [
          {
            texte: paie ? `Lancer : un adhérent vaudrait ${eur(r.vvcAvec)} au lieu de ${eur(r.p.vvc)}` : `Renoncer : un adhérent ne vaudrait que ${eur(r.vvcAvec)}`,
            juste: true,
            retour: `Oui : ${eur(r.margeAvec)} de marge par trimestre, divisés par ${pct(r.attritionAvec)} d'attrition, donnent ${eur(r.vvcAvec)}, contre ${eur(r.p.vvc)} aujourd'hui. ${paie ? `Le gain tient tant que l'attrition reste sous ${pct(r.attritionPlafond)}.` : ""}`.trim(),
          },
          {
            texte: `Renoncer : la remise retire ${eur(r.remise)} de marge chaque trimestre`,
            juste: false,
            retour: `Non : la remise coûte bien ${eur(r.remise)} par trimestre, mais l'adhérent reste ${qte(r.dureeAvec)} trimestres au lieu de ${qte(r.p.dureeDeVie)}. C'est sa valeur sur toute sa vie de client qu'il faut comparer : ${eur(r.vvcAvec)} contre ${eur(r.p.vvc)}.`,
          },
          {
            texte: `Lancer : un adhérent vaudrait ${eur(r.vvcSansLaRemise)}, ${eur(r.vvcSansLaRemise - r.p.vvc)} de plus qu'aujourd'hui`,
            juste: false,
            retour: `Non : ce calcul garde la marge d'aujourd'hui, ${eur(r.p.marge)}. Or la remise se paie à chaque renouvellement : la marge tombe à ${eur(r.margeAvec)}, et la valeur vie client à ${eur(r.vvcAvec)}.`,
          },
        ];
      },
    },
  ],
};
