import { montantEcrit } from "../../../../pedagogy/cours/correcteur";
import type { Cas } from "../../cas";
import { ENTREPRISES_DU_COMPTE_CLIENT } from "../../chapitres/le-compte-client";
import { LCR_DE_VIBRA, LIGNES_DE_CREDIT, TTC_D_UNE_ENCEINTE, VIBRA, dateEcrite, factureDEnceintes, impayeDeVibra, type DateDuCompte } from "../../monde/compte-client-de-nova";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « LE COMPTE CLIENT : LETTRAGE, EFFETS DE COMMERCE, BALANCE ÂGÉE » : VIBRA
 * REPASSE COMMANDE (comptabilité générale, palier 4).
 *
 * LE CAS JOUE DANS LE MONDE DU COURS, comme son chapitre : NOVA en N+1, la LCR de Vibra revenue impayée
 * le 12 juin (monde/compte-client-de-nova.ts).
 *
 * HYPOTHÈSE DU CAS (VIBRA_REPASSE) : le 20 juin, Vibra règle l'effet impayé par virement, puis commande
 * 150 NOVA One, à 60 jours par LCR. Sa ligne de crédit reste de 10 000 €. L'élève passe le règlement,
 * mesure l'en-cours que la commande ferait, et rend sa réponse.
 */
export const VIBRA_REPASSE = { reglement: { jour: 20, mois: 6, exercice: 1 } as DateDuCompte, enceintes: 150 } as const;

const eur = (x: number) => montantEcrit(x + 0).replace(/^-/, "−");
const qte = (n: number) => (n + 0).toLocaleString("fr-FR");

/** Les chiffres du cas. */
export function vibraRepasseCommande(_c: Pick<Cas, "code">) {
  const impaye = impayeDeVibra();
  const commande = factureDEnceintes(VIBRA_REPASSE.enceintes);
  const ligne = LIGNES_DE_CREDIT.Vibra;
  const maximum = Math.floor(ligne / TTC_D_UNE_ENCEINTE + 1e-9);
  return { impaye, commande, ligne, depassement: Math.round((commande.ttc - ligne) * 100) / 100, maximum };
}

export const VIBRA_REPASSE_COMMANDE: Situation = {
  code: "vibra-repasse-commande",
  parcours: "comptabilite-generale",
  palier: 4,
  blocs: [],
  reprend: ["le-compte-client"],
  commanditaire: "Le responsable du crédit client",
  titre: "Vibra repasse commande",
  accroche: "Juste après son effet impayé, Vibra règle sa dette et commande de nouveau, plus qu'avant. Faut-il livrer ?",
  objectifs: [
    "Enregistrer le règlement d'un effet revenu impayé",
    "Calculer l'en-cours qu'une commande ferait et le comparer à la ligne de crédit",
    "Rendre une réponse qui tient la ligne sans perdre le client",
  ],
  libre: false,
  entreprises: {
    codes: ENTREPRISES_DU_COMPTE_CLIENT,
    pourquoi: "ce cas reprend le chapitre « Le compte client », qui se joue sur NOVA en N+1 dans la simulation du cours.",
  },
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "La question du responsable",
      texte: (c) => {
        const n = vibraRepasseCommande(c);
        return [
          `« L'effet de ${VIBRA.nom} est revenu impayé le ${dateEcrite(LCR_DE_VIBRA.impaye)}. Le ${dateEcrite(VIBRA_REPASSE.reglement)}, ils ont viré les ${eur(n.impaye.nominal)} et ils commandent ${qte(VIBRA_REPASSE.enceintes)} NOVA One, à 60 jours par LCR. Leur ligne est de ${eur(n.ligne)}. Passez le règlement, puis dites-moi ce qu'on livre. »`,
          "Pas de cours cette fois : vous avez le chapitre.",
        ];
      },
      repere: () => "À rendre : l'écriture du règlement, l'en-cours que ferait la commande, et votre réponse.",
    },
    {
      id: "le-reglement",
      type: "ecriture",
      titre: "Le règlement de l'impayé",
      notions: ["payment_terms"],
      evenement: (c) => {
        const n = vibraRepasseCommande(c);
        return `Le ${dateEcrite(VIBRA_REPASSE.reglement)}, la banque reçoit le virement de ${VIBRA.nom} : ${eur(n.impaye.nominal)}, le nominal de l'effet impayé.`;
      },
      ecriture: (c) => {
        const n = vibraRepasseCommande(c);
        return {
          date: `${dateEcrite(VIBRA_REPASSE.reglement)} N+1`,
          libelle: "Virement de Vibra, effet impayé du 10 juin",
          lignes: [
            { role: "l'argent reçu", compte: "512", sens: "debit", montant: n.impaye.nominal, indice: "le nominal de l'effet" },
            { role: "la créance sur Vibra, revenue au 411 avec l'impayé, qui s'éteint", compte: "411", sens: "credit", montant: n.impaye.nominal, indice: "le même montant" },
          ],
        };
      },
      indices: () => ["Avec l'impayé, la créance est revenue au compte des clients.", "C'est ce compte que le virement solde, pas celui des effets."],
      explication: () => ["Le compte de Vibra se lettre : la facture du 10 avril, l'effet, son retour et le virement. Son en-cours retombe à zéro."],
    },
    {
      id: "l-en-cours",
      type: "montants",
      titre: "L'en-cours de la commande",
      notions: ["customer_portfolio", "payment_terms"],
      question: () => `Calculez le montant TTC de la commande, puis de combien elle dépasserait la ligne de crédit, et le plus d'enceintes que la ligne accepte.`,
      champs: (c) => {
        const n = vibraRepasseCommande(c);
        return [
          { libelle: "Commande, TTC", attendu: n.commande.ttc, calcul: `${qte(VIBRA_REPASSE.enceintes)} × ${eur(TTC_D_UNE_ENCEINTE)} = ${eur(n.commande.ttc)}` },
          { libelle: "Dépassement de la ligne", attendu: n.depassement, calcul: `${eur(n.commande.ttc)} − ${eur(n.ligne)} = ${eur(n.depassement)}` },
          { libelle: "Enceintes que la ligne accepte", attendu: n.maximum, calcul: `${eur(n.ligne)} ÷ ${eur(TTC_D_UNE_ENCEINTE)}, à l'enceinte inférieure : ${qte(n.maximum)}`, tolerance: 0 },
        ];
      },
      explication: (c) => {
        const n = vibraRepasseCommande(c);
        return [`La commande dépasserait la ligne de ${eur(n.depassement)}. L'escompte de la LCR n'y changerait rien : l'effet escompté resterait dans l'en-cours.`];
      },
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre réponse au responsable",
      notions: ["customer_portfolio"],
      question: () => "Quelle réponse rendez-vous au responsable ?",
      options: (c) => {
        const n = vibraRepasseCommande(c);
        return [
          {
            texte: `Livrer ${qte(n.maximum)} enceintes, sous la ligne`,
            juste: true,
            retour: `Oui. Vibra a payé, mais un client qui vient d'avoir un impayé ne voit pas sa ligne relevée sur le champ. On livre ${qte(n.maximum)} enceintes à 60 jours, le reste avec la prochaine commande ou payé à la commande ; la ligne se reverra après quelques échéances tenues.`,
          },
          {
            texte: `Livrer les ${qte(VIBRA_REPASSE.enceintes)} : Vibra a tout payé, son compte est soldé`,
            juste: false,
            retour: `Le compte est soldé, mais la ligne existe pour borner le risque : ${eur(n.depassement)} au-delà, juste après un impayé, c'est le contraire d'une prudence.`,
          },
          {
            texte: `Livrer les ${qte(VIBRA_REPASSE.enceintes)} et escompter aussitôt la LCR : l'escompte libère la ligne`,
            juste: false,
            retour: "Non : l'effet escompté reste dans l'en-cours, NOVA en est garante jusqu'à l'échéance.",
          },
          {
            texte: "Refuser toute commande : un client qui a eu un impayé est un client perdu",
            juste: false,
            retour: "Non : Vibra a réglé sa dette dans la semaine. On tient la ligne, on ne coupe pas un client qui paie.",
          },
        ];
      },
    },
  ],
};
