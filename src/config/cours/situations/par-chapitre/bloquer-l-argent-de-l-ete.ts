import { montantEcrit } from "../../../../pedagogy/cours/correcteur";
import { ENTREPRISES_DU_TEMPS } from "../../chapitres/le-temps-de-l-organisation";
import { TAUX_DU_COMPTE_A_TERME, TAUX_DU_PLACEMENT, placementDeLEte } from "../../monde/temps-de-l-escale";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « LE TEMPS DE L'ORGANISATION » : BLOQUER L'ARGENT DE L'ÉTÉ ? (Bac STMG, SGN
 * de première, palier 1).
 *
 * La banque propose, pour le résultat de l'été, un compte à terme de 6 mois, mieux rémunéré que le fonds
 * monétaire mais bloqué jusqu'à son échéance (les taux du cours, financer-et-placer.ts). L'hiver de
 * l'hôtel est bénéficiaire : la directrice n'aura pas besoin de cet argent avant avril. Les calculs sont
 * ceux du chapitre (l'intérêt simple sur 6 mois), aux deux taux.
 */

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const pct = (t: number) => `${(t * 100).toLocaleString("fr-FR", { maximumFractionDigits: 1 })} %`;

export const DUREE_DU_COMPTE_A_TERME = 6;

export function bloquerLArgentDeLEte() {
  const fonds = placementDeLEte(DUREE_DU_COMPTE_A_TERME);
  const terme = placementDeLEte(DUREE_DU_COMPTE_A_TERME, TAUX_DU_COMPTE_A_TERME);
  return { capital: fonds.capital, fonds: fonds.interets, terme: terme.interets, ecart: Math.round((terme.interets - fonds.interets) * 100) / 100 };
}

export const BLOQUER_L_ARGENT_DE_L_ETE: Situation = {
  code: "bloquer-l-argent-de-l-ete",
  parcours: "stmg-management",
  palier: 1,
  blocs: [],
  reprend: ["le-temps-de-l-organisation"],
  commanditaire: "La directrice de l'hôtel",
  titre: "Bloquer l'argent de l'été ?",
  accroche: "La banque propose un compte à terme de 6 mois, mieux rémunéré, mais bloqué. L'argent de l'été doit-il y aller, ou rester disponible ?",
  objectifs: ["Calculer des intérêts simples à deux taux", "Peser le rendement contre la disponibilité", "Répondre à la directrice, chiffres à l'appui"],
  libre: false,
  entreprises: {
    codes: ENTREPRISES_DU_TEMPS,
    pourquoi: "le cas reprend le résultat de l'été de L'ESCALE et le placement du chapitre.",
  },
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "La proposition de la banque",
      texte: () => {
        const k = bloquerLArgentDeLEte();
        return [
          `« La banque me propose de placer les ${eur(k.capital)} de l'été sur un compte à terme de ${DUREE_DU_COMPTE_A_TERME} mois, à ${pct(TAUX_DU_COMPTE_A_TERME)} l'an, au lieu du fonds monétaire à ${pct(TAUX_DU_PLACEMENT)}. Mais l'argent sera bloqué. L'hiver est bénéficiaire, je n'en aurai pas besoin avant avril. Qu'en pensez-vous ? » La directrice`,
          "Pas de cours cette fois : les calculs sont ceux du chapitre.",
        ];
      },
      repere: () => "À rendre : les intérêts des deux placements sur la durée, leur écart, et votre réponse.",
    },
    {
      id: "les-calculs",
      type: "montants",
      titre: "Les deux placements",
      notions: ["discounting"],
      question: () => `Calculez les intérêts de ${DUREE_DU_COMPTE_A_TERME} mois au fonds monétaire, puis au compte à terme, et ce que le compte à terme rapporte de plus.`,
      champs: () => {
        const k = bloquerLArgentDeLEte();
        return [
          { libelle: "Intérêts au fonds monétaire", attendu: k.fonds, calcul: `${eur(k.capital)} × ${pct(TAUX_DU_PLACEMENT)} × ${DUREE_DU_COMPTE_A_TERME} ÷ 12 = ${eur(k.fonds)}` },
          { libelle: "Intérêts au compte à terme", attendu: k.terme, calcul: `${eur(k.capital)} × ${pct(TAUX_DU_COMPTE_A_TERME)} × ${DUREE_DU_COMPTE_A_TERME} ÷ 12 = ${eur(k.terme)}` },
          { libelle: "Ce que le compte à terme rapporte de plus", attendu: k.ecart, calcul: `${eur(k.terme)} − ${eur(k.fonds)} = ${eur(k.ecart)}` },
        ];
      },
      explication: () => {
        const k = bloquerLArgentDeLEte();
        return [`Le compte à terme rapporte ${eur(k.ecart)} de plus, en échange de ${DUREE_DU_COMPTE_A_TERME} mois sans pouvoir toucher à l'argent.`];
      },
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre réponse à la directrice",
      question: () => "Que répondez-vous à la directrice ?",
      options: () => {
        const k = bloquerLArgentDeLEte();
        return [
          {
            texte: `Le compte à terme : ${eur(k.ecart)} de plus, sans besoin d'ici avril`,
            juste: true,
            retour: `Oui : l'argent n'est pas attendu avant l'échéance, le blocage ne coûte rien, et le compte à terme rapporte ${eur(k.ecart)} de plus. Si l'hiver était incertain, la disponibilité du fonds monétaire vaudrait davantage.`,
          },
          {
            texte: "Le fonds monétaire : un placement bloqué est toujours trop risqué pour un hôtel",
            juste: false,
            retour: "Non : le compte à terme est garanti ; son seul risque est de devoir le rompre, et l'hôtel n'aura pas besoin de cet argent avant l'échéance.",
          },
          {
            texte: "Aucun des deux : sur un compte courant, l'argent reste à portée de main et ne risque rien",
            juste: false,
            retour: `Non : laissé sur le compte courant, l'argent ne rapporte rien. Même le fonds monétaire rapporterait ${eur(k.fonds)}.`,
          },
        ];
      },
    },
  ],
};
