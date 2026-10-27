import { montantEcrit } from "../../../../pedagogy/cours/correcteur";
import type { Cas } from "../../cas";
import { LE_PRIX_AFFICHE, faitsDeLaPromotion, promotionDuRayon } from "../../chapitres/le-prix-affiche";
import type { TableauDeDonnees } from "../../types";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « LE PRIX AFFICHÉ » : LA PROMOTION DE NOËL (CAP Équipier
 * polyvalent du commerce, palier 1).
 *
 * Au printemps, la promotion sur le pull le plus vendu a fait vendre plus. La responsable veut
 * la refaire à Noël, plus forte. L'élève calcule la nouvelle étiquette, lit le trimestre rejoué
 * par l'arène, et répond.
 *
 * Les chiffres sont ceux du chapitre (`promotionDuRayon` : le prix hors taxes de l'arène, la TVA
 * du métier, l'arrondi de l'étiquette) ; seuls changent la remise et le trimestre, hypothèses du
 * cas nommées ci-dessous. L'arène rejoue l'année avec le prix de l'article baissé au trimestre 4
 * (clé « le-prix-affiche:promotion-de-noel »). Le verdict se calcule : il suit les ventes et le
 * chiffre d'affaires rejoués.
 */

/** La remise que la responsable veut faire à Noël (hypothèse du cas). */
export const REMISE_DE_NOEL = 0.3;

/** Le trimestre de Noël : le quatrième de l'année. */
export const TRIMESTRE_DE_NOEL = 4;

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const qte = (n: number) => n.toLocaleString("fr-FR").replace(/^-/, "−");
const pct = (t: number) => `${(t * 100).toLocaleString("fr-FR", { maximumFractionDigits: 1 })} %`;

export const promotionDeNoel = (c: Cas) => promotionDuRayon(c, REMISE_DE_NOEL, TRIMESTRE_DE_NOEL, "promotion-de-noel");

function tableauDeNoel(c: Cas): TableauDeDonnees {
  const p = promotionDeNoel(c);
  return {
    titre: `L'article « ${p.article.nom} » au trimestre ${p.trimestre}, rejoué par l'arène`,
    colonnes: ["Sans la promotion", "Avec la promotion"],
    lignes: [
      { libelle: "Prix affiché", valeurs: [eur(p.article.affiche), eur(p.nouveauPrix)] },
      { libelle: "Articles vendus", valeurs: [qte(p.sans.vendus), qte(p.avec.vendus)] },
      { libelle: "Chiffre d'affaires hors taxes", valeurs: [eur(p.sans.chiffreDAffaires), eur(p.avec.chiffreDAffaires)] },
      { libelle: "Ventes manquées (rayon vide)", valeurs: [qte(p.sans.manques), qte(p.avec.manques)] },
    ],
  };
}

export const LA_PROMOTION_DE_NOEL: Situation = {
  code: "la-promotion-de-noel",
  parcours: "cap-epc",
  palier: 1,
  blocs: [],
  reprend: [LE_PRIX_AFFICHE.code],
  commanditaire: "La responsable de la boutique",
  titre: "La promotion de Noël",
  accroche:
    "La promotion du printemps a bien marché. La responsable veut la refaire à Noël, plus forte. Poser la nouvelle étiquette, lire ce que l'arène a vendu, et lui répondre.",
  objectifs: [
    "Calculer une remise et le nouveau prix affiché",
    "Comparer les ventes avec et sans la promotion",
    "Répondre à la responsable avec les chiffres",
  ],
  libre: false,
  entreprises: LE_PRIX_AFFICHE.entreprises,
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "La demande de la responsable",
      texte: (c) => {
        const p = promotionDeNoel(c);
        return [
          `« Au printemps, la promotion sur l'article ${p.article.nom.toLowerCase()} a fait vendre plus. Pour Noël, je veux faire ${pct(p.remise)} sur cet article, affiché ${eur(p.article.affiche)}. Préparez l'étiquette, et dites-moi si ça vaut le coup. »`,
          `Pas de cours cette fois. L'arène a rejoué le trimestre ${p.trimestre} avec la promotion : seul ce prix change.`,
        ];
      },
      repere: () => "À rendre : le nouveau prix affiché, ce que la promotion fait vendre en plus, et votre réponse.",
    },
    {
      id: "l-etiquette",
      type: "montants",
      titre: "L'étiquette de Noël",
      notions: ["markdown"],
      question: (c) => {
        const p = promotionDeNoel(c);
        return `Calculez la remise de ${pct(p.remise)} sur ${eur(p.article.affiche)}, puis le nouveau prix affiché (arrondi aux 10 centimes du dessous s'il le faut).`;
      },
      champs: (c) => {
        const p = promotionDeNoel(c);
        return [
          { libelle: "Montant de la remise", attendu: p.montantDeLaRemise, calcul: `${eur(p.article.affiche)} × ${pct(p.remise)} = ${eur(p.montantDeLaRemise)}` },
          {
            libelle: "Nouveau prix affiché",
            attendu: p.nouveauPrix,
            calcul: p.arrondi
              ? `${eur(p.article.affiche)} − ${eur(p.montantDeLaRemise)} = ${eur(p.calcule)}, arrondi à ${eur(p.nouveauPrix)}`
              : `${eur(p.article.affiche)} − ${eur(p.montantDeLaRemise)} = ${eur(p.nouveauPrix)}`,
          },
        ];
      },
      explication: (c) => {
        const p = promotionDeNoel(c);
        return [`L'étiquette montre ${eur(p.article.affiche)} barré, ${pct(p.remise)} et ${eur(p.nouveauPrix)}.`];
      },
    },
    {
      id: "le-trimestre-rejoue",
      type: "montants",
      titre: "Ce que Noël aurait vendu",
      notions: ["markdown", "revenue", "stock"],
      tableau: tableauDeNoel,
      question: () =>
        "D'après le tableau, calculez les articles vendus en plus avec la promotion, puis le chiffre d'affaires hors taxes en plus (négatif s'il baisse).",
      champs: (c) => {
        const p = promotionDeNoel(c);
        return [
          { libelle: "Articles vendus en plus", attendu: p.ventesEnPlus, calcul: `${qte(p.avec.vendus)} − ${qte(p.sans.vendus)} = ${qte(p.ventesEnPlus)}` },
          {
            libelle: "Chiffre d'affaires en plus",
            attendu: p.chiffreEnPlus,
            calcul: `${eur(p.avec.chiffreDAffaires)} − ${eur(p.sans.chiffreDAffaires)} = ${eur(p.chiffreEnPlus)}`,
            tolerance: 1,
          },
        ];
      },
      explication: (c) => {
        const p = promotionDeNoel(c);
        return [
          p.sans.manques > 0
            ? `Même sans promotion, ${qte(p.sans.manques)} ventes sont manquées à Noël : le rayon est déjà vide. Avec la promotion, ${qte(p.avec.manques)}.`
            : `Sans promotion, le rayon suffit à Noël. Avec la promotion, ${qte(p.avec.manques)} ventes sont manquées.`,
        ];
      },
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre réponse à la responsable",
      question: () => "Que répondez-vous à la responsable ?",
      options: (c) => {
        const p = promotionDeNoel(c);
        const faits = `au trimestre ${p.trimestre}, ${faitsDeLaPromotion(p)}.`;
        return [
          {
            texte: "La faire : elle vend plus et rapporte plus",
            juste: p.bilan === "plus-et-plus",
            retour: p.bilan === "plus-et-plus" ? `Oui : ${faits}` : `Non : ${faits}`,
          },
          {
            texte: "La faire, même si elle rapporte moins",
            juste: p.bilan === "plus-mais-moins",
            retour: p.bilan === "plus-mais-moins" ? `Oui, si le but est de vider la réserve : ${faits}` : `Non : ${faits}`,
          },
          {
            texte: "Ne pas la faire : le rayon ne suit pas",
            juste: p.bilan === "rien-de-plus",
            retour:
              p.bilan === "rien-de-plus"
                ? `Oui : ${faits} À Noël, les clients achètent déjà tout le rayon. La remise baisse le prix sans vendre un article de plus.`
                : `Non : ${faits}`,
          },
        ];
      },
    },
  ],
};
