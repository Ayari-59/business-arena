import { montantEcrit } from "../../../../pedagogy/cours/correcteur";
import { SECONDE_LIGNE, composantsDeLaSecondeLigne } from "../../monde/comptabilite-approfondie";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « L'APPROCHE PAR COMPOSANTS ET L'AMORTISSEMENT DÉROGATOIRE »
 * (DCG · Comptabilité approfondie, palier 4).
 *
 * En décembre N + 1, le technicien du fabricant revient : les moteurs de la seconde ligne tournent
 * plus qu'annoncé, ils ne tiendront que 2 ans. La directrice financière veut savoir, avant
 * l'inventaire, ce que cela change à la dotation de l'exercice. Le calcul est celui du chapitre
 * (`composantsDeLaSecondeLigne`, monde/comptabilite-approfondie.ts), sur une durée révisée.
 */

/** La durée révisée des moteurs (HYPOTHÈSE DU COURS), en années. */
export const DUREE_REVISEE_DES_MOTEURS = 2;

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");

export function moteursQuiSUsent() {
  const avant = composantsDeLaSecondeLigne();
  const apres = composantsDeLaSecondeLigne(DUREE_REVISEE_DES_MOTEURS);
  return { avant, apres, hausse: Math.round((apres.total - avant.total) * 100) / 100 };
}

export const LES_MOTEURS_QUI_S_USENT_PLUS_VITE: Situation = {
  code: "les-moteurs-qui-s-usent-plus-vite",
  parcours: "dcg-comptabilite-approfondie",
  palier: 4,
  blocs: [],
  reprend: ["les-composants-et-l-amortissement-derogatoire"],
  commanditaire: "La directrice financière",
  titre: "Les moteurs qui s'usent plus vite",
  accroche: "Le fabricant révise la durée des moteurs de la seconde ligne : ce que cela change à la dotation de l'exercice, avant l'inventaire.",
  objectifs: ["Recalculer la dotation d'un composant sur sa durée révisée", "Mesurer l'effet sur la dotation de l'exercice", "Répondre à la directrice, chiffre à l'appui"],
  libre: false,
  entreprises: { codes: ["nova"], pourquoi: "ce cas reprend la seconde ligne de NOVA, celle du chapitre." },
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "La question de la directrice",
      texte: () => [
        `« Le technicien est formel : nos moteurs ne tiendront que ${DUREE_REVISEE_DES_MOTEURS} ans, pas ${SECONDE_LIGNE.composant.dureeAns}. Avant l'inventaire, je veux savoir ce que cela change à la dotation de la seconde ligne cette année, et ce que nous devons faire. » La directrice financière`,
        "Pas de cours cette fois : la règle des composants, vous la connaissez.",
      ],
      tableau: () => {
        const k = moteursQuiSUsent();
        return {
          titre: "La seconde ligne, mise en service le 2 janvier N + 1",
          colonnes: ["Valeur"],
          lignes: [
            { libelle: "Moteurs et électronique de commande", valeurs: [eur(SECONDE_LIGNE.composant.valeur)] },
            { libelle: "Dotation de la structure en N + 1", valeurs: [eur(k.avant.structure)] },
            { libelle: "Dotation totale prévue en N + 1", valeurs: [eur(k.avant.total)] },
          ],
        };
      },
      repere: () => "À rendre : la nouvelle dotation du composant, la dotation totale, et votre réponse.",
    },
    {
      id: "la-nouvelle-dotation",
      type: "montants",
      titre: "La dotation révisée",
      notions: ["depreciation"],
      question: () => `Sur ${DUREE_REVISEE_DES_MOTEURS} ans, au prorata de 359 jours, calculez la dotation du composant, la dotation totale de la ligne et la hausse par rapport à la dotation prévue.`,
      champs: () => {
        const k = moteursQuiSUsent();
        return [
          { libelle: "Dotation du composant", attendu: k.apres.composant, calcul: `${eur(SECONDE_LIGNE.composant.valeur)} ÷ ${DUREE_REVISEE_DES_MOTEURS} × 359 ÷ 360 = ${eur(k.apres.composant)}` },
          { libelle: "Dotation totale", attendu: k.apres.total, calcul: `${eur(k.apres.structure)} + ${eur(k.apres.composant)} = ${eur(k.apres.total)}` },
          { libelle: "Hausse de la dotation", attendu: k.hausse, calcul: `${eur(k.apres.total)} − ${eur(k.avant.total)} = ${eur(k.hausse)}` },
        ];
      },
      explication: () => {
        const k = moteursQuiSUsent();
        return [`La structure ne change pas ; le composant, qui s'use plus vite, coûte ${eur(k.hausse)} de plus à l'exercice.`];
      },
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre réponse à la directrice",
      question: () => "Que répondez-vous à la directrice ?",
      options: () => {
        const k = moteursQuiSUsent();
        return [
          {
            texte: `Amortir les moteurs sur ${DUREE_REVISEE_DES_MOTEURS} ans dès N + 1 : ${eur(k.hausse)} de dotation en plus`,
            juste: true,
            retour: "Oui : un changement d'estimation de la durée vaut pour l'avenir, dès l'exercice où on l'apprend ; le plan du composant se recalcule, la structure garde le sien.",
          },
          {
            texte: `Garder ${SECONDE_LIGNE.composant.dureeAns} ans jusqu'au remplacement, puis passer l'écart en charge exceptionnelle`,
            juste: false,
            retour: `Non : on sait aujourd'hui que les moteurs dureront ${DUREE_REVISEE_DES_MOTEURS} ans. Garder ${SECONDE_LIGNE.composant.dureeAns} ans surévaluerait l'actif et reporterait la charge sur un exercice qui ne l'a pas causée.`,
          },
          {
            texte: `Amortir toute la ligne sur ${DUREE_REVISEE_DES_MOTEURS} ans`,
            juste: false,
            retour: `Non : seule la durée du composant change. La structure, le bâti et le convoyeur, tient toujours ${SECONDE_LIGNE.structure.dureeAns} ans.`,
          },
        ];
      },
    },
  ],
};
