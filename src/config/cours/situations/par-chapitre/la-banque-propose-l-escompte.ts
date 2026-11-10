import { eur, pct as enPoints } from "../../../../pedagogy/cours/deux-decimales";
import type { Cas } from "../../cas";
import { optimiser } from "../../chapitres/optimiser-la-tresorerie";
import { auCentime } from "../../monde/amortissement";
import { ENTREPRISES_DES_COMPTES_DU_LYCEE } from "../../monde/comptes-du-lycee";
import { DECOUVERT_AUTORISE, TAUX_DE_L_ESCOMPTE, TAUX_DU_DECOUVERT, agios } from "../../monde/tresorerie-a-optimiser";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « OPTIMISER LA TRÉSORERIE » : LA BANQUE PROPOSE L'ESCOMPTE (Bac STMG,
 * gestion et finance, palier 1).
 *
 * Le 31 décembre, le conseiller de la banque propose à NOVA d'escompter la facture de décembre de
 * CampusTech. Le président veut savoir ce que cela coûterait, ce que NOVA recevrait, et s'il en a
 * besoin. L'élève refait seul le calcul du chapitre (des agios, montant × taux × jours ÷ 360), le
 * compare au découvert sur deux durées, puis répond.
 *
 * Le cas est neuf par sa question : le chapitre couvre un manque de quelques jours ; le cas
 * demande d'abord s'il y a un manque, et montre que l'escompte, moins cher que le découvert quand
 * le besoin dure jusqu'à l'échéance de la facture, ne sert à rien quand l'argent ne manque pas.
 * Les chiffres sont ceux du chapitre (`optimiser`, monde/tresorerie-a-optimiser.ts).
 */

const dE = (nom: string) => (/^[aeiouyéèêAEIOUYÉÈ]/.test(nom) ? `d'${nom}` : `de ${nom}`);
/** Un taux donné en fraction (0,2), écrit en pourcentage à deux décimales. */
const pct = (t: number) => enPoints(t * 100);

/** Les chiffres de la réponse, calculés une fois du cas. */
export function escompteProposePar(c: Pick<Cas, "code">) {
  const k = optimiser(c);
  const montant = k.facture.ttc;
  const agiosDEscompte = agios(montant, TAUX_DE_L_ESCOMPTE, k.facture.jours);
  return {
    ...k,
    montant,
    agiosDEscompte,
    netRecu: auCentime(montant - agiosDEscompte),
    /** Le même montant à découvert, pendant les jours où le compte à terme est bloqué. */
    decouvertCourt: agios(montant, TAUX_DU_DECOUVERT, k.joursDeBlocage),
    /** Le même montant à découvert, jusqu'à l'échéance de la facture. */
    decouvertLong: agios(montant, TAUX_DU_DECOUVERT, k.facture.jours),
  };
}

export const LA_BANQUE_PROPOSE_L_ESCOMPTE: Situation = {
  code: "la-banque-propose-l-escompte",
  parcours: "stmg-gf",
  palier: 1,
  blocs: [],
  reprend: ["optimiser-la-tresorerie"],
  commanditaire: "Le président",
  titre: "La banque propose l'escompte",
  accroche: "Le conseiller de la banque propose d'avancer l'argent d'une facture de CampusTech. Le président demande ce que cela coûterait, et si l'entreprise en a besoin.",
  objectifs: [
    "Calculer les agios d'un escompte et le montant reçu",
    "Comparer l'escompte et le découvert selon la durée du besoin",
    "Dire si l'entreprise a besoin d'un concours bancaire",
    "Rédiger une réponse chiffrée au président",
  ],
  libre: false,
  entreprises: {
    codes: ENTREPRISES_DES_COMPTES_DU_LYCEE,
    pourquoi: "le cas reprend la trésorerie du 31 décembre du premier exercice de NOVA dans la simulation du cours, celle du chapitre ; la méthode vaut pour toute entreprise.",
  },
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "La demande du président",
      texte: (c) => {
        const k = escompteProposePar(c);
        return [
          `« Le conseiller de la banque nous propose d'escompter la facture de décembre de CampusTech, ${eur(k.montant)}, à ${pct(TAUX_DE_L_ESCOMPTE)} par an jusqu'à son échéance. Il dit que c'est moins cher qu'un découvert. Combien cela nous coûterait-il, combien recevrions-nous, et en avons-nous besoin ? »`,
          "Pas de cours cette fois : vous avez les chiffres, et la méthode est celle du chapitre. À vous de l'enchaîner.",
        ];
      },
      tableau: (c) => {
        const k = escompteProposePar(c);
        return {
          titre: `La trésorerie ${dE(k.entreprise)} au 31 décembre`,
          colonnes: ["Montant"],
          lignes: [
            { libelle: "Banque", valeurs: [eur(k.banque)] },
            { libelle: "Compte à terme, intérêts compris (bloqué jusqu'au 6 janvier)", valeurs: [eur(k.placement)] },
            { libelle: "À payer bientôt (fournisseurs, État et personnel)", valeurs: [eur(k.aPayerDansLeMois)] },
            { libelle: "Facture de décembre de CampusTech", valeurs: [eur(k.montant)] },
            { libelle: "Jours jusqu'à son échéance, le 10 mars", valeurs: [String(k.facture.jours)] },
            { libelle: "Taux de l'escompte", valeurs: [pct(TAUX_DE_L_ESCOMPTE)] },
            { libelle: "Taux du découvert", valeurs: [pct(TAUX_DU_DECOUVERT)] },
          ],
        };
      },
      repere: () => "À rendre : les agios de l'escompte et ce que l'entreprise recevrait, la comparaison avec un découvert, et votre réponse.",
    },
    {
      id: "l-escompte",
      type: "montants",
      titre: "Ce que coûte l'escompte",
      notions: ["receivables_financing"],
      question: () => "Calculez les agios de l'escompte, comptés jusqu'à l'échéance de la facture, puis ce que la banque verserait aujourd'hui.",
      champs: (c) => {
        const k = escompteProposePar(c);
        return [
          { libelle: "Agios de l'escompte", attendu: k.agiosDEscompte, calcul: `${eur(k.montant)} × ${pct(TAUX_DE_L_ESCOMPTE)} × ${k.facture.jours} ÷ 360 = ${eur(k.agiosDEscompte)}` },
          { libelle: "Montant reçu", attendu: k.netRecu, calcul: `${eur(k.montant)} − ${eur(k.agiosDEscompte)} = ${eur(k.netRecu)}` },
        ];
      },
      explication: (c) => {
        const k = escompteProposePar(c);
        return [`La banque avancerait ${eur(k.netRecu)} aujourd'hui, et encaisserait la facture de CampusTech à son échéance. Les ${eur(k.agiosDEscompte)} d'agios sont le prix de ces ${k.facture.jours} jours d'avance.`];
      },
    },
    {
      id: "face-au-decouvert",
      type: "montants",
      titre: "Face au découvert",
      notions: ["net_treasury", "receivables_financing"],
      question: (c) => {
        const k = escompteProposePar(c);
        return [
          `Le conseiller compare avec un découvert de ${eur(k.montant)}.`,
          ...(k.montant > DECOUVERT_AUTORISE ? [`Au-delà de l'autorisation de découvert, ${eur(DECOUVERT_AUTORISE)}, la banque finance au même taux par un crédit de trésorerie.`] : []),
          `Calculez ce qu'il coûterait s'il durait ${k.joursDeBlocage} jours, jusqu'à l'échéance du compte à terme, puis s'il durait ${k.facture.jours} jours, jusqu'à l'échéance de la facture.`,
        ].join(" ");
      },
      champs: (c) => {
        const k = escompteProposePar(c);
        return [
          { libelle: `Découvert de ${k.joursDeBlocage} jours`, attendu: k.decouvertCourt, calcul: `${eur(k.montant)} × ${pct(TAUX_DU_DECOUVERT)} × ${k.joursDeBlocage} ÷ 360 = ${eur(k.decouvertCourt)}` },
          { libelle: `Découvert de ${k.facture.jours} jours`, attendu: k.decouvertLong, calcul: `${eur(k.montant)} × ${pct(TAUX_DU_DECOUVERT)} × ${k.facture.jours} ÷ 360 = ${eur(k.decouvertLong)}` },
        ];
      },
      explication: (c) => {
        const k = escompteProposePar(c);
        return [
          `Le conseiller a raison pour un besoin qui dure jusqu'à l'échéance : ${eur(k.agiosDEscompte)} d'escompte contre ${eur(k.decouvertLong)} de découvert. Pour quelques jours, le découvert ne coûte que ${eur(k.decouvertCourt)} : on ne paie que les jours où l'argent manque vraiment.`,
        ];
      },
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre réponse au président",
      question: () => "Quelle phrase envoyez-vous au président ?",
      options: (c) => {
        const k = escompteProposePar(c);
        return [
          {
            texte: `Refuser : rien ne manque, ce serait ${eur(k.agiosDEscompte)} pour rien`,
            juste: true,
            retour: `Oui : ${k.entreprise} a ${eur(k.banque)} en banque et ${eur(k.placement)} qui reviennent le 6 janvier, bien plus que ce qu'elle doit payer bientôt, ${eur(k.aPayerDansLeMois)}. Un concours bancaire ne sert qu'à couvrir un manque : ici, l'escompte coûterait ${eur(k.agiosDEscompte)} sans rien apporter.`,
          },
          {
            texte: `Accepter : l'escompte coûte moins que ${eur(k.decouvertLong)} de découvert sur la même durée`,
            juste: false,
            retour: `Non : la comparaison est juste, mais elle suppose un découvert de ${k.facture.jours} jours. Or ${k.entreprise} n'a pas de manque : sans découvert, il n'y a rien à économiser.`,
          },
          {
            texte: "Accepter : la banque prendrait le risque que CampusTech ne paie pas à l'échéance",
            juste: false,
            retour: "Non : si CampusTech ne paie pas à l'échéance, la banque reprend l'argent avancé sur le compte de l'entreprise. L'escompte avance l'argent ; il ne supprime pas le risque d'impayé.",
          },
        ];
      },
    },
  ],
};
