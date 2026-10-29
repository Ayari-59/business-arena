import { montantEcrit } from "../../../../pedagogy/cours/correcteur";
import { OFFRE_DE_RACHAT, testDeDepreciation } from "../../monde/comptabilite-approfondie";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « LE TEST DE DÉPRÉCIATION D'UNE IMMOBILISATION »
 * (DCG · Comptabilité approfondie, palier 4).
 *
 * Fin décembre N + 1, un façonnier offre de racheter la première ligne de NOVA (`OFFRE_DE_RACHAT`).
 * Le directeur général hésite : vendre maintenant, ou garder la ligne ? Et que dire au comptable
 * pour l'inventaire ? L'élève refait le test du chapitre (`testDeDepreciation`), avec l'offre pour
 * valeur vénale.
 */

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");

export function vendreOuGarder() {
  const t = testDeDepreciation(undefined, undefined, OFFRE_DE_RACHAT);
  const moinsValue = Math.round((t.valeurNette - OFFRE_DE_RACHAT) * 100) / 100;
  return { ...t, offre: OFFRE_DE_RACHAT, moinsValue, garder: t.valeurDUsage > OFFRE_DE_RACHAT };
}

export const VENDRE_LA_LIGNE_OU_LA_GARDER: Situation = {
  code: "vendre-la-ligne-ou-la-garder",
  parcours: "dcg-comptabilite-approfondie",
  palier: 4,
  blocs: [],
  reprend: ["le-test-de-depreciation"],
  commanditaire: "Le directeur général",
  titre: "Vendre la ligne ou la garder",
  accroche: "Un acheteur se présente pour la première ligne de montage : ce qu'elle rapporterait vendue, ce qu'elle rapporte gardée, et ce que l'inventaire en retiendra.",
  objectifs: ["Comparer la valeur vénale et la valeur d'usage", "Mesurer la moins-value d'une cession", "Répondre au directeur, chiffre à l'appui"],
  libre: false,
  entreprises: { codes: ["nova"], pourquoi: "ce cas reprend la première ligne de NOVA, celle du chapitre." },
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "La question du directeur",
      texte: () => [
        `« Un façonnier nous offre ${eur(OFFRE_DE_RACHAT)} de la première ligne, net de frais. Avec la nouvelle technique, c'est plus que le marché. Dois-je vendre ? Et que doit faire le comptable au 31 décembre si nous la gardons ? » Le directeur général`,
        "Pas de cours cette fois : la valeur actuelle, vous savez la calculer.",
      ],
      tableau: () => {
        const k = vendreOuGarder();
        return {
          titre: "La première ligne, au 31 décembre N + 1",
          colonnes: ["Valeur"],
          lignes: [
            { libelle: "Valeur nette comptable", valeurs: [eur(k.valeurNette)] },
            { libelle: "Offre du façonnier", valeurs: [eur(k.offre)] },
            { libelle: "Valeur d'usage, les flux actualisés", valeurs: [eur(k.valeurDUsage)] },
          ],
        };
      },
      repere: () => "À rendre : la valeur actuelle, la moins-value d'une vente, la dépréciation, et votre réponse.",
    },
    {
      id: "les-chiffres",
      type: "montants",
      titre: "Vendre ou garder, chiffré",
      notions: ["depreciation", "discounting"],
      question: () => "Calculez la valeur actuelle de la ligne (l'offre servant de valeur vénale), la moins-value qu'une vente constaterait, puis la dépréciation à passer si NOVA la garde.",
      champs: () => {
        const k = vendreOuGarder();
        return [
          { libelle: "Valeur actuelle", attendu: k.valeurActuelle, calcul: `la plus haute de ${eur(k.offre)} et ${eur(k.valeurDUsage)} : ${eur(k.valeurActuelle)}`, tolerance: 1 },
          { libelle: "Moins-value de la vente", attendu: k.moinsValue, calcul: `${eur(k.valeurNette)} − ${eur(k.offre)} = ${eur(k.moinsValue)}` },
          { libelle: "Dépréciation si NOVA garde la ligne", attendu: k.depreciation, calcul: `${eur(k.valeurNette)} − ${eur(k.valeurActuelle)} = ${eur(k.depreciation)}`, tolerance: 1 },
        ];
      },
      explication: () => {
        const k = vendreOuGarder();
        return [`Gardée, la ligne vaut ${eur(k.valeurDUsage)} pour NOVA, plus que l'offre de ${eur(k.offre)}.`];
      },
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre réponse au directeur",
      question: () => "Que répondez-vous au directeur général ?",
      options: () => {
        const k = vendreOuGarder();
        return [
          {
            texte: `La garder, et la déprécier de ${eur(k.depreciation)}`,
            juste: k.garder,
            retour: k.garder
              ? `Oui : elle rapportera l'équivalent de ${eur(k.valeurDUsage)}, plus que l'offre. Gardée, elle se déprécie jusqu'à sa valeur d'usage ; vendue, elle ferait perdre ${eur(k.moinsValue)}.`
              : "Non : l'offre dépasse ce que la ligne rapportera.",
          },
          {
            texte: `La vendre : ${eur(k.offre)} valent mieux qu'un actif que la technique dépasse`,
            juste: !k.garder,
            retour: !k.garder ? "Oui : l'offre dépasse la valeur d'usage." : `Non : la vente rapporte ${eur(k.offre)}, la ligne gardée l'équivalent de ${eur(k.valeurDUsage)}. La technique nouvelle baisse sa valeur, elle ne la rend pas inutile.`,
          },
          {
            texte: "La garder sans rien constater, tant qu'elle n'est pas vendue",
            juste: false,
            retour: "Non : la valeur actuelle est sous la valeur nette ; la prudence demande la dépréciation dès la clôture, vente ou pas.",
          },
        ];
      },
    },
  ],
};
