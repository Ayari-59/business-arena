import { montantEcrit } from "../../../../pedagogy/cours/correcteur";
import { ENTREPRISES_DU_BUDGET_DU_LYCEE } from "../../chapitres/prevoir-sa-tresorerie";
import { TAUX_DU_DECOUVERT } from "../../monde/delais-et-tva";
import { HYPOTHESES_DU_BUDGET, budgetDeMaille } from "../../monde/tresorerie-de-maille";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « PRÉVOIR SA TRÉSORERIE » : ÉTALER OU DEMANDER UN DÉCOUVERT ? (Bac STMG, SGN
 * de première, palier 1).
 *
 * Le fournisseur du rayonnage accepte le paiement en trois fois, mais facture 200 € de frais. La banque
 * propose un découvert autorisé pour mars, au taux de 9 % l'an, sur le montant à découvert, pendant un
 * mois (les frais sont une hypothèse du cas ; le taux est celui que le cours prête aux banques des autres entreprises que NOVA, delais-et-tva.ts). Les calculs sont ceux du chapitre
 * (le budget de mars), plus un intérêt sur un mois.
 */

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const pct = (t: number) => `${(t * 100).toLocaleString("fr-FR", { maximumFractionDigits: 1 })} %`;

export const FRAIS_DE_L_ETALEMENT = 200;
export { TAUX_DU_DECOUVERT };

export function etalerOuDecouvert() {
  const decouvert = -budgetDeMaille().mois[2]!.fin;
  const interets = Math.round(((decouvert * TAUX_DU_DECOUVERT) / 12) * 100) / 100;
  return { decouvert, interets, frais: FRAIS_DE_L_ETALEMENT, decouvertMoinsCher: interets < FRAIS_DE_L_ETALEMENT, economie: Math.round(Math.abs(FRAIS_DE_L_ETALEMENT - interets) * 100) / 100 };
}

export const ETALER_OU_DECOUVERT: Situation = {
  code: "etaler-ou-decouvert",
  parcours: "stmg-management",
  palier: 1,
  blocs: [],
  reprend: ["prevoir-sa-tresorerie"],
  commanditaire: "La gérante",
  titre: "Étaler ou demander un découvert ?",
  accroche: "Pour passer le mois de mars, deux solutions : payer le rayonnage en trois fois, avec des frais, ou un découvert autorisé, avec des intérêts. Laquelle coûte le moins ?",
  objectifs: ["Lire le découvert d'un budget de trésorerie", "Calculer l'intérêt d'un découvert sur un mois", "Répondre à la gérante, chiffres à l'appui"],
  libre: false,
  entreprises: {
    codes: ENTREPRISES_DU_BUDGET_DU_LYCEE,
    pourquoi: "le cas reprend le budget du premier trimestre de MAILLE & CO du chapitre.",
  },
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "Deux propositions",
      texte: () => [
        `« Le fournisseur du rayonnage veut bien ${HYPOTHESES_DU_BUDGET.rayonnage.fois} paiements, mais il facture ${eur(FRAIS_DE_L_ETALEMENT)} de frais. La banque me propose un découvert autorisé pour mars, à ${pct(TAUX_DU_DECOUVERT)} l'an, pendant un mois, sur ce qui manque. Que choisir ? » La gérante`,
        "Pas de cours cette fois : les calculs sont ceux du chapitre.",
      ],
      repere: () => "À rendre : le découvert de mars, l'intérêt d'un mois de découvert, et votre réponse.",
    },
    {
      id: "les-calculs",
      type: "montants",
      titre: "Le découvert et son coût",
      notions: ["cash_budget"],
      question: () => "Relevez le découvert de mars du budget (rayonnage payé comptant), puis calculez l'intérêt d'un mois de découvert (montant × taux ÷ 12).",
      champs: () => {
        const k = etalerOuDecouvert();
        return [
          { libelle: "Découvert de mars", attendu: k.decouvert, calcul: `La trésorerie de fin de mars du budget : ${eur(-k.decouvert)}` },
          { libelle: "Intérêt d'un mois de découvert", attendu: k.interets, calcul: `${eur(k.decouvert)} × ${pct(TAUX_DU_DECOUVERT)} ÷ 12 = ${eur(k.interets)}` },
        ];
      },
      explication: () => {
        const k = etalerOuDecouvert();
        return [`Un mois de découvert coûte ${eur(k.interets)} ; l'étalement, ${eur(k.frais)}.`];
      },
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre réponse à la gérante",
      question: () => "Que répondez-vous à la gérante ?",
      options: () => {
        const k = etalerOuDecouvert();
        return [
          {
            texte: `Le découvert : ${eur(k.interets)} d'intérêts contre ${eur(k.frais)} de frais`,
            juste: k.decouvertMoinsCher,
            retour: k.decouvertMoinsCher
              ? `Oui : le découvert autorisé coûte ${eur(k.economie)} de moins. Mais il doit être demandé avant mars, et remboursé en avril : le budget du trimestre suivant doit le prévoir.`
              : "Non : l'étalement coûte moins.",
          },
          {
            texte: "L'étalement : un découvert est toujours plus cher qu'un paiement en plusieurs fois",
            juste: !k.decouvertMoinsCher,
            retour: k.decouvertMoinsCher ? `Non : sur un mois, l'intérêt n'est que de ${eur(k.interets)}, moins que les frais.` : "Oui : l'étalement coûte moins.",
          },
          {
            texte: "Aucun des deux : il suffit de payer le rayonnage en avril, sans prévenir personne",
            juste: false,
            retour: "Non : payer en retard sans accord abîme la relation avec le fournisseur, et peut coûter des pénalités. La trésorerie se négocie avant.",
          },
        ];
      },
    },
  ],
};
