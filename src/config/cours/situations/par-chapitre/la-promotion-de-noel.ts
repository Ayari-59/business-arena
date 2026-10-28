import { montantEcrit } from "../../../../pedagogy/cours/correcteur";
import type { Cas } from "../../cas";
import { LE_PRIX_AFFICHE, faitsDeLaPromotion, ficheDe, tableauDUnePromotion } from "../../chapitres/le-prix-affiche";
import { DECEMBRE_N_MOINS_1, RAYON_DE_DECEMBRE, promotionDeFevrier, promotionDuMois } from "../../monde/vente-et-caisse";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « LE PRIX AFFICHÉ » : LA PROMOTION DE NOËL (CAP Équipier polyvalent
 * du commerce, palier 1).
 *
 * La promotion de février sur le pull col rond a fait vendre plus (la garde le vérifie). La
 * responsable veut la refaire à Noël, plus forte. L'élève calcule la nouvelle étiquette, compare
 * le mois avec et sans la promotion, et répond.
 *
 * LE CAS JOUE DANS LE MONDE DU COURS : les étiquettes de MAILLE & CO, la réponse de la demande à la
 * remise (la fiche), et le mois de décembre de N − 1 (monde/vente-et-caisse.ts : 1 400 pulls col rond
 * demandés). HYPOTHÈSES DU CAS : la remise de 30 %, et les 1 600 pulls col rond en rayon et en
 * réserve en décembre. Le verdict se calcule : il suit les ventes et le chiffre d'affaires.
 *
 * CE QUI A CHANGÉ. Le cas rejouait le trimestre 4 de l'arène avec la remise. Il compte maintenant le
 * mois de décembre : 200 pulls vendus en plus, mais 15 400 € de chiffre d'affaires en moins et
 * 1 060 clients sans pull.
 */

/** La remise que la responsable veut faire à Noël (hypothèse du cas). */
export const REMISE_DE_NOEL = 0.3;

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const qte = (n: number) => n.toLocaleString("fr-FR").replace(/^-/, "−");
const pct = (t: number) => `${(t * 100).toLocaleString("fr-FR", { maximumFractionDigits: 1 })} %`;

/** La promotion de Noël : la demande de décembre au prix de l'étiquette, le rayon de décembre, la remise du cas. */
export function promotionDeNoel(c: Pick<Cas, "code">) {
  const demandeDuMois = DECEMBRE_N_MOINS_1.clienteles.reduce((t, x) => t + (x.achats[RAYON_DE_DECEMBRE.reference] ?? 0), 0);
  return promotionDuMois(ficheDe(c), { reference: RAYON_DE_DECEMBRE.reference, demandeDuMois, remise: REMISE_DE_NOEL, stockEnRayon: RAYON_DE_DECEMBRE.stockEnRayon });
}

export const LA_PROMOTION_DE_NOEL: Situation = {
  code: "la-promotion-de-noel",
  parcours: "cap-epc",
  palier: 1,
  blocs: [],
  reprend: [LE_PRIX_AFFICHE.code],
  commanditaire: "La responsable de la boutique",
  titre: "La promotion de Noël",
  accroche: "La promotion de février a fait vendre plus. La responsable veut la refaire à Noël, plus forte. Poser la nouvelle étiquette, comparer le mois avec et sans elle, et lui répondre.",
  objectifs: ["Calculer une remise et le nouveau prix affiché", "Comparer les ventes avec et sans la promotion", "Répondre à la responsable avec les chiffres"],
  libre: false,
  entreprises: LE_PRIX_AFFICHE.entreprises,
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "La demande de la responsable",
      texte: (c) => {
        const p = promotionDeNoel(c);
        const fevrier = promotionDeFevrier(ficheDe(c));
        return [
          `« En février, ${pct(fevrier.remise)} sur l'article ${p.article.nom.toLowerCase()} ont fait vendre plus. Pour Noël, je veux faire ${pct(p.remise)} sur cet article, affiché ${eur(p.article.affiche)}. L'an dernier, en décembre, les clients en ont demandé ${qte(p.sans.demande)}, et nous en aurons ${qte(p.stockEnRayon)} en rayon et en réserve. Préparez l'étiquette, et dites-moi si ça vaut le coup. »`,
          "Pas de cours cette fois. Comme en février, une remise de 1 % fait demander 3 % de pulls de plus.",
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
      id: "le-mois-avec-et-sans",
      type: "montants",
      titre: "Ce que Noël vendrait",
      notions: ["markdown", "revenue", "stock"],
      tableau: (c) => tableauDUnePromotion(`L'article « ${promotionDeNoel(c).article.nom} » en décembre`, promotionDeNoel(c)),
      question: () => "D'après le tableau, calculez les articles vendus en plus avec la promotion, puis le chiffre d'affaires hors taxes en plus (négatif s'il baisse).",
      champs: (c) => {
        const p = promotionDeNoel(c);
        return [
          { libelle: "Articles vendus en plus", attendu: p.ventesEnPlus, calcul: `${qte(p.avec.vendus)} − ${qte(p.sans.vendus)} = ${qte(p.ventesEnPlus)}` },
          { libelle: "Chiffre d'affaires en plus", attendu: p.chiffreEnPlus, calcul: `${eur(p.avec.chiffreDAffaires)} − ${eur(p.sans.chiffreDAffaires)} = ${eur(p.chiffreEnPlus)}` },
        ];
      },
      explication: (c) => {
        const p = promotionDeNoel(c);
        return [
          p.avec.manques > 0
            ? `Avec la promotion, ${qte(p.avec.demande)} pulls sont demandés pour ${qte(p.stockEnRayon)} en rayon : ${qte(p.avec.manques)} clients repartent sans leur pull, et chaque pull vendu rapporte ${eur(p.avec.prixPaye)} hors taxes au lieu de ${eur(p.sans.prixPaye)}.`
            : `Le rayon suit : tous les clients sont servis, à ${eur(p.avec.prixPaye)} hors taxes le pull.`,
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
        const faits = `en décembre, ${faitsDeLaPromotion(p)}.`;
        return [
          { texte: "La faire : elle vend plus et rapporte plus", juste: p.bilan === "plus-et-plus", retour: p.bilan === "plus-et-plus" ? `Oui : ${faits}` : `Non : ${faits}` },
          {
            texte: "Ne pas la faire : elle rapporte moins",
            juste: p.bilan === "plus-mais-moins",
            retour: p.bilan === "plus-mais-moins" ? `Oui : ${faits} À Noël, les clients achètent déjà : la remise attire plus de monde que le rayon ne peut servir, et baisse le prix de tous les pulls vendus.` : `Non : ${faits}`,
          },
          { texte: "Ne pas la faire : elle ne vend pas un pull de plus", juste: p.bilan === "rien-de-plus", retour: p.bilan === "rien-de-plus" ? `Oui : ${faits} Le rayon ne pouvait pas vendre plus.` : `Non : ${faits}` },
        ];
      },
    },
  ],
};
