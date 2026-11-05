import { montantEcrit } from "../../../../pedagogy/cours/correcteur";
import { ENTREPRISES_DES_COMPTES_ANNUELS } from "../../chapitres/les-comptes-annuels";
import { auCentime } from "../../monde/amortissement";
import { MOIS_DE_LA_SITUATION_DU_CAS, situationIntermediaire } from "../../monde/comptes-annuels";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « LES COMPTES ANNUELS : PRÉSENTATION, ANNEXE ET SITUATION
 * INTERMÉDIAIRE » : LA SITUATION DE SEPTEMBRE (comptabilité générale, palier 4 ; BTS CG P2, 2.4.2 et
 * 2.4.3).
 *
 * LE CAS JOUE DANS LE MONDE DU COURS, comme son chapitre : l'exercice N de NOVA, lu au 30 septembre
 * par monde/comptes-annuels.ts (`situationIntermediaire`, MOIS_DE_LA_SITUATION_DU_CAS). La banque
 * demande une situation à la fin du troisième trimestre. L'élève refait seul l'abonnement, sur
 * 9 mois cette fois, avec l'escompte que Sonora a pris en septembre, puis répond à la banque, qui
 * voudrait en tirer le résultat de l'année par une règle de trois.
 */

const eur = (x: number) => montantEcrit(x + 0).replace(/^-/, "−");
const M = MOIS_DE_LA_SITUATION_DU_CAS;

/** Les chiffres du cas : la situation au 30 septembre, et ce qu'une règle de trois en tirerait pour l'année. */
export function situationDeSeptembre() {
  const s = situationIntermediaire(M);
  return { s, regleDeTrois: auCentime((s.resultatAvantImpot * 12) / M) };
}

export const LA_SITUATION_DE_SEPTEMBRE: Situation = {
  code: "la-situation-de-septembre",
  parcours: "comptabilite-generale",
  palier: 4,
  blocs: [],
  reprend: ["les-comptes-annuels"],
  commanditaire: "La banque de NOVA",
  titre: "La situation de septembre",
  accroche: "La banque veut le résultat de NOVA à la fin du troisième trimestre. Bâtissez la situation par la méthode de l'abonnement, puis dites ce qu'elle permet d'annoncer pour l'année.",
  objectifs: [
    "Appliquer la méthode de l'abonnement sur une période de plusieurs mois",
    "Établir le résultat d'une situation intermédiaire",
    "Présenter une situation sans en tirer une prévision abusive",
  ],
  libre: false,
  entreprises: {
    codes: ENTREPRISES_DES_COMPTES_ANNUELS,
    pourquoi: "ce cas reprend le chapitre « Les comptes annuels », qui se joue sur l'exercice N de NOVA.",
  },
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "La demande de la banque",
      texte: () => [
        "« Votre situation de juin était encourageante. Pouvez-vous nous adresser celle du 30 septembre, avec votre résultat de l'année ? » Le président vous confie la réponse.",
        "Pas de cours cette fois : vous avez les flux du journal de janvier à septembre, et les montants annuels connus dès janvier. En septembre, Sonora a payé à 10 jours et pris son escompte.",
      ],
      tableau: () => {
        const s = situationDeSeptembre().s;
        return {
          titre: "NOVA, de janvier à septembre N",
          colonnes: ["Montant"],
          lignes: [
            { libelle: "Ventes, remise de Sonora déduite", valeurs: [eur(s.ventes)] },
            { libelle: "Achats de composants", valeurs: [eur(s.achats)] },
            { libelle: "Autres achats et charges externes", valeurs: [eur(s.chargesExternes)] },
            { libelle: "Salaires", valeurs: [eur(s.salaires)] },
            { libelle: "Charges sociales", valeurs: [eur(s.chargesSociales)] },
            { libelle: "Escompte accordé à Sonora", valeurs: [eur(s.escompte)] },
            { libelle: "Dotation aux amortissements de l'année", valeurs: [eur(s.dotationAnnuelle)] },
            { libelle: "Intérêts de l'emprunt de l'année", valeurs: [eur(s.interetsAnnuels)] },
            { libelle: "Intérêts du compte à terme de l'année", valeurs: [eur(s.placementAnnuel)] },
          ],
        };
      },
      repere: () => "À rendre : les douzièmes de la période, le résultat d'exploitation, le résultat financier, le résultat avant impôt, et votre réponse sur l'année.",
    },
    {
      id: "les-douziemes",
      objectifs: [0],
      type: "montants",
      titre: "Les douzièmes de la période",
      notions: ["depreciation", "loan_schedule"],
      question: () => "Calculez, pour la période de janvier à septembre, la dotation aux amortissements, les intérêts de l'emprunt et les intérêts du compte à terme.",
      champs: () => {
        const s = situationDeSeptembre().s;
        const f = (a: number, x: number) => `${eur(a)} × ${M} ÷ 12 = ${eur(x)}`;
        return [
          { libelle: "Dotation aux amortissements", attendu: s.dotation, calcul: f(s.dotationAnnuelle, s.dotation) },
          { libelle: "Intérêts de l'emprunt", attendu: s.interets, calcul: f(s.interetsAnnuels, s.interets) },
          { libelle: "Intérêts du compte à terme", attendu: s.placement, calcul: f(s.placementAnnuel, s.placement) },
        ];
      },
      explication: () => ["L'escompte de Sonora, lui, ne se répartit pas : c'est une charge réelle de septembre, déjà au journal."],
    },
    {
      id: "le-resultat",
      objectifs: [1],
      type: "montants",
      titre: "Le résultat au 30 septembre",
      notions: ["income_statement"],
      question: () => "Calculez le résultat d'exploitation, le résultat financier (l'escompte accordé est une charge financière), puis le résultat avant impôt de la période.",
      champs: () => {
        const s = situationDeSeptembre().s;
        return [
          {
            libelle: "Résultat d'exploitation",
            attendu: s.resultatDExploitation,
            calcul: `${eur(s.ventes)} − ${eur(s.achats)} − ${eur(s.chargesExternes)} − ${eur(s.salaires)} − ${eur(s.chargesSociales)} − ${eur(s.dotation)} = ${eur(s.resultatDExploitation)}`,
          },
          { libelle: "Résultat financier", attendu: s.resultatFinancier, calcul: `${eur(s.placement)} − ${eur(s.interets)} − ${eur(s.escompte)} = ${eur(s.resultatFinancier)}` },
          { libelle: "Résultat avant impôt", attendu: s.resultatAvantImpot, calcul: `${eur(s.resultatDExploitation)} + (${eur(s.resultatFinancier)}) = ${eur(s.resultatAvantImpot)}` },
        ];
      },
      explication: () => {
        const s = situationDeSeptembre().s;
        return [`${eur(s.resultatAvantImpot)} avant impôt sur ${M} mois. Le financier devient négatif : l'escompte de Sonora pèse plus que l'écart entre les intérêts reçus et payés.`];
      },
    },
    {
      id: "reponse",
      objectifs: [2],
      type: "choix",
      titre: "Votre réponse à la banque",
      notions: ["income_statement", "cash_budget"],
      question: () => {
        const n = situationDeSeptembre();
        return `La banque propose d'annoncer ${eur(n.regleDeTrois)} pour l'année : le résultat de septembre multiplié par 12 et divisé par ${M}. Que lui répondez-vous ?`;
      },
      options: () => {
        const n = situationDeSeptembre();
        return [
          { texte: "Non : la fin d'année n'est pas comme le début", juste: true, retour: `Oui. Les ventes montent vers Noël, mais la clôture ajoutera ce que la situation ne voit pas : le risque de Sonora, un litige, l'inventaire. La situation dit ${eur(n.s.resultatAvantImpot)} au 30 septembre ; une prévision de l'année se bâtit mois par mois, avec ses risques.` },
          { texte: `Oui : ${eur(n.regleDeTrois)}, c'est la méthode de l'abonnement appliquée au résultat`, juste: false, retour: "Non : l'abonnement répartit des charges annuelles connues ; un résultat suit les ventes et les risques, qui ne tombent pas par douzièmes." },
          { texte: "Non : une situation intermédiaire ne se communique jamais à une banque", juste: false, retour: "Non : c'est même l'un de ses usages. Mais elle se présente pour ce qu'elle est, un arrêté partiel, sans tout l'inventaire." },
        ];
      },
    },
  ],
};
