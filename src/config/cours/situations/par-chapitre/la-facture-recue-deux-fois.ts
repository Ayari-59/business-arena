import { montantEcrit } from "../../../../pedagogy/cours/correcteur";
import type { Cas } from "../../cas";
import { ENTREPRISES_DE_LA_SECURITE, ficheDe } from "../../chapitres/securiser-les-processus";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « SÉCURISER LES PROCESSUS » : LA FACTURE REÇUE DEUX FOIS (comptabilité
 * générale, palier 4).
 *
 * LE CAS JOUE DANS LE MONDE DU COURS, comme son chapitre : la facture non parvenue de la fiche
 * (exercice-de-nova.ts, FACTURE_NON_PARVENUE), celle de Composants Express pour les 1 500 jeux du
 * 18 décembre N, arrivée le 8 janvier N + 1.
 *
 * HYPOTHÈSE DU CAS : la facture arrive deux fois, en pièce jointe d'un courriel le 8 janvier, puis
 * par la poste le 12, sous le même numéro. Le collaborateur saisit le pli postal sans voir qu'il a
 * déjà saisi le courriel. L'élève chiffre ce que la double saisie fausserait (la charge, la TVA
 * déductible, la dette), nomme le contrôle qui l'aurait arrêtée, et rend une proposition.
 */

const eur = (x: number) => montantEcrit(x + 0).replace(/^-/, "−");

/** Le jour d'arrivée du pli postal, quatre jours après le courriel (hypothèse du cas). */
export const ARRIVEE_DU_PLI_POSTAL = 12;

/** Les chiffres du cas : la facture, et ce qu'une seconde saisie ajouterait. */
export function factureEnDouble(c: Pick<Cas, "code">) {
  const f = ficheDe(c);
  const x = f.factureNonParvenue;
  return { f, fournisseur: x.fournisseur, arrivee: x.arrivee.jour, ht: x.ht, tva: x.tva, ttc: x.ttc, chargeEnTrop: x.ht, tvaEnTrop: x.tva, detteEnTrop: x.ttc };
}

export const LA_FACTURE_RECUE_DEUX_FOIS: Situation = {
  code: "la-facture-recue-deux-fois",
  parcours: "comptabilite-generale",
  palier: 4,
  blocs: [],
  reprend: ["securiser-les-processus"],
  commanditaire: "L'expert-comptable",
  titre: "La facture reçue deux fois",
  accroche: "La même facture de composants est arrivée par courriel, puis par la poste, et elle a été saisie deux fois. Que fausserait-elle, et quel contrôle l'aurait arrêtée ?",
  objectifs: [
    "Chiffrer ce qu'une facture saisie deux fois fausse dans les comptes",
    "Nommer le contrôle du PGI et le rapprochement qui arrêtent un doublon",
    "Proposer une amélioration de la procédure de réception des factures",
  ],
  libre: false,
  entreprises: {
    codes: ENTREPRISES_DE_LA_SECURITE,
    pourquoi: "ce cas reprend le chapitre « Sécuriser les processus », qui se joue chez NOVA dans la simulation du cours.",
  },
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "La question de l'expert-comptable",
      texte: (c) => {
        const x = factureEnDouble(c);
        return [
          `« La facture de ${x.fournisseur} pour les jeux du 18 décembre est arrivée le ${x.arrivee} janvier par courriel, et le ${ARRIVEE_DU_PLI_POSTAL} par la poste, sous le même numéro. Vous l'avez saisie les deux fois. Rien n'est encore payé. Dites-moi ce que cela fausserait, ce qui aurait dû l'arrêter, et ce que vous proposez. »`,
          "Pas de cours cette fois : vous avez la facture et le journal des achats de janvier.",
        ];
      },
      tableau: (c) => {
        const x = factureEnDouble(c);
        return {
          titre: "Le journal des achats de janvier, lignes de ce fournisseur",
          colonnes: ["Hors taxes", "TVA", "TTC"],
          lignes: [
            { libelle: `Facture reçue par courriel le ${x.arrivee} janvier`, valeurs: [eur(x.ht), eur(x.tva), eur(x.ttc)] },
            { libelle: `Même facture, reçue par la poste le ${ARRIVEE_DU_PLI_POSTAL} janvier`, valeurs: [eur(x.ht), eur(x.tva), eur(x.ttc)] },
            { libelle: "Facture non parvenue du 31 décembre, extournée le 1er janvier", valeurs: [eur(-x.ht), eur(-x.tva), eur(-x.ttc)] },
          ],
        };
      },
      repere: () => "À rendre : ce que la double saisie fausse, le contrôle qui l'arrête, votre proposition.",
    },
    {
      id: "ce-qui-est-fausse",
      type: "montants",
      titre: "Ce que la double saisie fausse",
      notions: ["payment_terms", "vat_payable"],
      question: () =>
        "La facture non parvenue a été extournée au 1er janvier : une seule saisie de la facture l'aurait compensée. Avec la seconde, calculez les achats comptés en trop, la TVA déduite en trop, et la dette fournisseur en trop.",
      champs: (c) => {
        const x = factureEnDouble(c);
        return [
          { libelle: "Achats comptés en trop", attendu: x.chargeEnTrop, calcul: `la seconde saisie, hors taxes : ${eur(x.chargeEnTrop)}` },
          { libelle: "TVA déduite en trop", attendu: x.tvaEnTrop, calcul: `la TVA de la seconde saisie : ${eur(x.tvaEnTrop)}` },
          { libelle: "Dette fournisseur en trop", attendu: x.detteEnTrop, calcul: `${eur(x.chargeEnTrop)} + ${eur(x.tvaEnTrop)} = ${eur(x.detteEnTrop)}` },
        ];
      },
      explication: (c) => {
        const x = factureEnDouble(c);
        return [
          `Trois erreurs d'un coup : un résultat trop bas de ${eur(x.chargeEnTrop)}, une TVA déduite deux fois que le premier contrôle fiscal relèverait, et ${eur(x.detteEnTrop)} que la présidente pourrait payer deux fois.`,
        ];
      },
    },
    {
      id: "le-controle",
      type: "choix",
      titre: "Le contrôle qui l'aurait arrêtée",
      notions: ["payment_terms"],
      question: () => "Quel contrôle aurait arrêté la seconde saisie, avant même qu'un paiement soit proposé ?",
      options: () => [
        {
          texte: "Le PGI qui refuse un numéro de facture déjà saisi",
          juste: true,
          retour:
            "Oui. Un fournisseur ne facture jamais deux fois sous le même numéro : le PGI, paramétré pour refuser un doublon fournisseur et numéro, bloque la saisie. Le lettrage du compte, ensuite, montre une facture sans commande ni réception.",
        },
        {
          texte: "Le rapprochement bancaire de fin de mois, qui compare le relevé de la banque et le compte 512",
          juste: false,
          retour: "Il ne voit que ce qui est payé : il trouverait le double paiement, une fois l'argent parti. Le contrôle doit venir avant.",
        },
        {
          texte: "La révision des comptes à la clôture de l'exercice, par l'expert-comptable",
          juste: false,
          retour: "Elle le verrait peut-être, des mois plus tard. Un contrôle utile arrête l'erreur à la saisie.",
        },
      ],
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre proposition",
      notions: ["payment_terms"],
      question: (c) => `La seconde saisie est annulée par une contre-passation. Que proposez-vous à l'expert-comptable pour que ${factureEnDouble(c).fournisseur}, ni aucun autre, ne soit plus saisi deux fois ?`,
      options: () => [
        {
          texte: "Une seule entrée des factures, et le contrôle des doublons",
          juste: true,
          retour:
            "Oui. Une adresse de réception unique, une seule pièce source par facture (l'électronique, qui sera la règle), le blocage des doublons dans le PGI, et le bon à payer seulement sur une facture rapprochée de sa commande et de sa réception.",
        },
        {
          texte: "Ne plus accepter de factures par courriel, seulement les plis postaux, plus faciles à archiver",
          juste: false,
          retour: "Ce serait aller contre la facture électronique, qui devient obligatoire. Le problème n'est pas le canal, c'est d'en avoir deux pour la même pièce.",
        },
        {
          texte: "Faire saisir chaque facture par deux personnes, puis comparer leurs deux saisies",
          juste: false,
          retour: "Coûteux, et inutile si le PGI refuse le doublon. Le contrôle automatique fait mieux, et sans effort.",
        },
      ],
    },
  ],
};
