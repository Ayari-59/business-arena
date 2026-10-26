import { montantEcrit as eur } from "../../../../pedagogy/cours/correcteur";
import { accord } from "../../accords";
import type { Cas } from "../../cas";
import { seuilDuPointDeVente } from "../../chapitres/seuil-du-point-de-vente";
import { COMMERCES } from "../../chapitres/taux-de-marque";
import { JOURS_DU_MOIS } from "../../point-de-vente";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « LE SEUIL DE RENTABILITÉ DU POINT DE VENTE » : FERMÉ POUR
 * TRAVAUX (BTS MCO, palier 3).
 *
 * Le point de vente fermera quelques jours en début de mois pour des travaux. Le gérant
 * veut savoir ce que cela fera au résultat du mois, et quel jour le point de vente
 * commencera à gagner de l'argent. L'élève refait seul les calculs du chapitre (le taux de
 * marge sur coût variable, le seuil, le point mort), puis les applique à un mois amputé de
 * ses premiers jours.
 *
 * Le cas est neuf par sa question : le chapitre lit le seuil d'un mois normal ; ici, les
 * ventes baissent mais les charges fixes courent toujours. Le piège : croire que le seuil
 * ou le résultat baissent dans la même proportion que les jours ouverts. Les chiffres du
 * mois sont ceux du chapitre (`seuilDuPointDeVente`), le mois commercial de trente jours
 * celui du cours (`JOURS_DU_MOIS`).
 */

/**
 * Les jours de fermeture, en début de mois : 5, une semaine de travaux du lundi au
 * vendredi. C'est la durée d'une rénovation légère (peinture, sol, éclairage), ou d'un
 * changement de plateforme pour un site marchand.
 */
export const JOURS_DE_FERMETURE = 5;

const pct = (t: number) => `${t.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} %`;
const qte = (n: number) => n.toLocaleString("fr-FR");

/** Ce que les travaux ferment, dans les mots du métier. */
const travaux = (c: Cas) =>
  c.code === "ecommerce"
    ? `notre site sera coupé les ${qte(JOURS_DE_FERMETURE)} premiers jours du mois prochain, le temps de changer de plateforme`
    : `nous fermerons les ${qte(JOURS_DE_FERMETURE)} premiers jours du mois prochain pour des travaux`;

/** Les chiffres de la réponse, calculés une fois du cas. */
export function fermePourTravaux(c: Cas) {
  const s = seuilDuPointDeVente(c);
  const joursOuverts = JOURS_DU_MOIS - JOURS_DE_FERMETURE;
  const caApres = Math.round((s.ca * joursOuverts) / JOURS_DU_MOIS);
  // Les coûts variables suivent les ventes : la marge du mois des travaux est celle d'un
  // mois normal, au prorata des jours ouverts.
  const mcvApres = Math.round((s.mcv * joursOuverts) / JOURS_DU_MOIS);
  const resultatAvant = Math.round(s.mcv - s.chargesFixes);
  const resultatApres = mcvApres - s.chargesFixes;
  return {
    ...s,
    joursOuverts,
    caApres,
    mcvApres,
    // Calculée sur le taux arrondi au dixième, la marge s'écarte de quelques euros.
    toleranceDuTaux: Math.ceil(caApres * 0.0005) + 1,
    resultatAvant,
    resultatApres,
    margeDeSecuriteApres: caApres - s.seuil,
    // Les ventes reprennent au même rythme le jour de la réouverture : le seuil est atteint
    // après autant de jours de vente qu'avant, plus les jours de fermeture.
    pointMortApres: JOURS_DE_FERMETURE + s.pointMort,
    couvert: resultatApres >= 0,
    // Les erreurs classiques : un seuil, ou un résultat, qui baisseraient comme les ventes.
    seuilProportionnel: Math.round((s.seuil * joursOuverts) / JOURS_DU_MOIS),
    resultatProportionnel: Math.round((resultatAvant * joursOuverts) / JOURS_DU_MOIS),
    partFermee: (JOURS_DE_FERMETURE / JOURS_DU_MOIS) * 100,
  };
}

export const FERME_POUR_TRAVAUX: Situation = {
  code: "ferme-pour-travaux",
  parcours: "mco",
  palier: 3,
  blocs: [],
  reprend: ["seuil-du-point-de-vente"],
  commanditaire: "Le gérant",
  titre: "Fermé pour travaux",
  accroche:
    "Le point de vente fermera quelques jours en début de mois. Le gérant veut savoir ce qu'il restera du résultat, et quel jour il commencera à gagner de l'argent.",
  objectifs: [
    "Calculer le taux de marge sur coût variable, le seuil de rentabilité et le point mort",
    "Calculer la marge et le résultat d'un mois amputé de quelques jours de vente",
    "Dater le point mort quand le mois commence par une fermeture",
    "Répondre au gérant sans confondre ventes et charges fixes",
  ],
  libre: false,
  entreprises: {
    codes: COMMERCES,
    pourquoi: "ce cas suit le seuil d'un point de vente, qui accueille ou livre ses clients un par un.",
  },
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "La demande du gérant",
      texte: (c) => [
        `« ${travaux(c).charAt(0).toUpperCase()}${travaux(c).slice(1)}. Les ventes reprendront ensuite à leur rythme habituel, mais le loyer, l'équipe et l'équipement, eux, ne s'arrêtent pas. Je veux savoir ce qu'il restera du résultat du mois, et à partir de quel jour ${c.entreprise} commencera à gagner de l'argent. »`,
        `Pas de cours cette fois : vous avez les chiffres d'un mois normal, et la méthode est celle du chapitre. Comptez un mois commercial de ${qte(JOURS_DU_MOIS)} jours, aux ventes régulières.`,
      ],
      tableau: (c) => {
        const r = fermePourTravaux(c);
        return {
          titre: `Un mois normal · ${c.entreprise}`,
          colonnes: ["Montant"],
          lignes: [
            { libelle: "Chiffre d'affaires du mois, hors taxes", valeurs: [eur(r.ca)] },
            { libelle: `${c.unites.charAt(0).toUpperCase()}${c.unites.slice(1)} du mois`, valeurs: [qte(r.quantite)] },
            { libelle: `Coûts variables d'${accord(c, "un")} ${c.unite}`, valeurs: [eur(r.coutVariableUnitaire)] },
            { libelle: "Charges fixes du mois", valeurs: [eur(r.chargesFixes)] },
            { libelle: "Jours de fermeture en début de mois", valeurs: [qte(JOURS_DE_FERMETURE)] },
          ],
        };
      },
      repere: () =>
        "À rendre : le taux de marge sur coût variable, le seuil et le point mort d'un mois normal, la marge et le résultat du mois des travaux, le nouveau point mort, et votre réponse.",
    },
    {
      id: "un-mois-normal",
      type: "montants",
      titre: "Un mois normal",
      notions: ["contribution_margin", "breakeven", "dead_point"],
      question: () =>
        `Pour un mois normal, calculez la marge sur coût variable, son taux (au dixième), le seuil de rentabilité (à l'euro), puis le jour du point mort, arrondi au jour supérieur.`,
      champs: (c) => {
        const r = fermePourTravaux(c);
        return [
          { libelle: "Marge sur coût variable du mois", attendu: r.mcv, calcul: `${eur(r.ca)} − ${qte(r.quantite)} × ${eur(r.coutVariableUnitaire)} = ${eur(r.mcv)}` },
          { libelle: "Taux de marge sur coût variable (%)", attendu: r.tauxMcv, tolerance: 0.1, calcul: `${eur(r.mcv)} ÷ ${eur(r.ca)} × 100 = ${pct(r.tauxMcv)}` },
          { libelle: "Seuil de rentabilité", attendu: r.seuil, tolerance: 2, calcul: `${eur(r.chargesFixes)} ÷ ${pct(r.tauxMcv)} = ${eur(r.seuil)}` },
          { libelle: "Point mort (jour du mois)", attendu: r.pointMort, calcul: `${eur(r.seuil)} ÷ ${eur(r.ca)} × ${qte(JOURS_DU_MOIS)} = ${qte(r.pointMort)} (arrondi au-dessus)` },
        ];
      },
      explication: (c) => {
        const r = fermePourTravaux(c);
        return [`Un mois normal, ${c.entreprise} couvre ses charges fixes le ${qte(r.pointMort)} du mois ; les ventes des jours suivants font son bénéfice, ${eur(r.resultatAvant)}.`];
      },
    },
    {
      id: "le-mois-des-travaux",
      type: "montants",
      titre: "Le mois des travaux",
      notions: ["contribution_margin", "fixed_costs"],
      question: (c) => {
        const r = fermePourTravaux(c);
        return `Le mois des travaux, ${c.entreprise} ne vend que ${qte(r.joursOuverts)} jours sur ${qte(JOURS_DU_MOIS)}. Calculez son chiffre d'affaires (à l'euro), sa marge sur coût variable (à l'euro ; les coûts variables suivent les ventes), puis son résultat du mois (négatif en cas de perte).`;
      },
      champs: (c) => {
        const r = fermePourTravaux(c);
        return [
          { libelle: "Chiffre d'affaires du mois des travaux", attendu: r.caApres, tolerance: 1, calcul: `${eur(r.ca)} × ${qte(r.joursOuverts)} ÷ ${qte(JOURS_DU_MOIS)} = ${eur(r.caApres)}` },
          { libelle: "Marge sur coût variable", attendu: r.mcvApres, tolerance: r.toleranceDuTaux, calcul: `${eur(r.mcv)} × ${qte(r.joursOuverts)} ÷ ${qte(JOURS_DU_MOIS)} = ${eur(r.mcvApres)}` },
          { libelle: "Résultat du mois", attendu: r.resultatApres, tolerance: r.toleranceDuTaux, calcul: `${eur(r.mcvApres)} − ${eur(r.chargesFixes)} = ${eur(r.resultatApres)}` },
        ];
      },
      explication: (c) => {
        const r = fermePourTravaux(c);
        return [
          r.couvert
            ? `Les ventes baissent de ${pct(r.partFermee)}, mais le résultat passe de ${eur(r.resultatAvant)} à ${eur(r.resultatApres)} : les charges fixes, ${eur(r.chargesFixes)}, se paient en entier, porte ouverte ou fermée.`
            : `Les ventes baissent de ${pct(r.partFermee)}, et le résultat passe de ${eur(r.resultatAvant)} à une perte de ${eur(-r.resultatApres)} : les charges fixes, ${eur(r.chargesFixes)}, se paient en entier, porte ouverte ou fermée.`,
        ];
      },
    },
    {
      id: "le-nouveau-point-mort",
      type: "montants",
      titre: "Le seuil et le point mort",
      notions: ["breakeven", "safety_margin", "dead_point"],
      question: () =>
        "Le mois des travaux, quel est le seuil de rentabilité (à l'euro) ? Quelle marge de sécurité reste-t-il (négative si le seuil n'est pas atteint) ? Les ventes reprenant à leur rythme à la réouverture, quel jour du mois le seuil sera-t-il atteint ?",
      champs: (c) => {
        const r = fermePourTravaux(c);
        return [
          { libelle: "Seuil de rentabilité du mois", attendu: r.seuil, tolerance: 2, calcul: `${eur(r.chargesFixes)} ÷ ${pct(r.tauxMcv)} = ${eur(r.seuil)}, comme un mois normal` },
          { libelle: "Marge de sécurité", attendu: r.margeDeSecuriteApres, tolerance: 2, calcul: `${eur(r.caApres)} − ${eur(r.seuil)} = ${eur(r.margeDeSecuriteApres)}` },
          { libelle: "Point mort (jour du mois)", attendu: r.pointMortApres, calcul: `${qte(JOURS_DE_FERMETURE)} jours fermés + ${qte(r.pointMort)} jours de vente = le ${qte(r.pointMortApres)}` },
        ];
      },
      explication: (c) => {
        const r = fermePourTravaux(c);
        return [
          r.couvert
            ? `Le seuil ne bouge pas : il dépend des charges fixes et du taux de marge, pas des jours ouverts. Il faut toujours ${qte(r.pointMort)} jours de vente pour l'atteindre ; ils commencent ${qte(JOURS_DE_FERMETURE)} jours plus tard, et le point mort recule au ${qte(r.pointMortApres)}.`
            : `Le seuil ne bouge pas : il dépend des charges fixes et du taux de marge, pas des jours ouverts. Avec ${qte(r.joursOuverts)} jours de vente, ${c.entreprise} ne l'atteint pas dans le mois.`,
        ];
      },
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre réponse au gérant",
      question: () => "Quelle phrase envoyez-vous au gérant ?",
      options: (c) => {
        const r = fermePourTravaux(c);
        return [
          {
            texte: r.couvert
              ? `Le bénéfice tomberait à ${eur(r.resultatApres)}, point mort le ${qte(r.pointMortApres)}`
              : `Nous perdrions ${eur(-r.resultatApres)} : le seuil ne serait pas atteint`,
            juste: true,
            retour: `Oui : ${eur(r.caApres)} de ventes laissent ${eur(r.mcvApres)} de marge, pour ${eur(r.chargesFixes)} de charges fixes qui ne s'arrêtent pas. ${r.couvert ? `Le seuil, ${eur(r.seuil)}, est atteint le ${qte(r.pointMortApres)} au lieu du ${qte(r.pointMort)}.` : `Le seuil reste à ${eur(r.seuil)}.`}`,
          },
          {
            texte: `Le seuil baisserait avec les jours ouverts, à ${eur(r.seuilProportionnel)} : rien ne change pour nous`,
            juste: false,
            retour: `Non : le seuil, ce sont les charges fixes divisées par le taux de marge. Ni l'un ni l'autre ne bouge pendant les travaux : il reste à ${eur(r.seuil)}, à atteindre avec ${qte(r.joursOuverts)} jours de vente au lieu de ${qte(JOURS_DU_MOIS)}.`,
          },
          {
            texte: `Le résultat baisserait de ${pct(r.partFermee)} comme les ventes, à ${eur(r.resultatProportionnel)}`,
            juste: false,
            retour: `Non : seule la marge baisse comme les ventes. Les charges fixes, ${eur(r.chargesFixes)}, se paient en entier : le résultat passe de ${eur(r.resultatAvant)} à ${eur(r.resultatApres)}, une baisse bien plus forte.`,
          },
        ];
      },
    },
  ],
};
