import { montantEcrit } from "../../../../pedagogy/cours/correcteur";
import { auCentime } from "../../../../pedagogy/cours/etats";
import type { Cas } from "../../cas";
import { FIN_DE_JANVIER, departDeLaTresorerie, janvierDe, nomDuClient, ouvertureDeJanvier, tresorerieDeJanvier } from "../../chapitres/creation-premier-bilan";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « DU RÉSULTAT À LA TRÉSORERIE » : LE CLIENT PAIE À LA COMMANDE
 * (comptabilité générale, palier 2).
 *
 * Le gérant se demande ce que janvier aurait donné si le client professionnel avait payé sa facture
 * à la commande, le jour même, au lieu d'attendre son délai. L'élève refait la banque et la créance
 * du 31 janvier dans ce cas, constate que le résultat ne bouge pas, refait la variation de la banque,
 * puis rend sa réponse. Le journal de janvier est celui du chapitre pilote, repris en une balance.
 * Mêmes calculs que le laboratoire de la trésorerie (`tresorerieDeJanvier`), sans guide.
 */

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");

/** Janvier tel qu'il est, et janvier si le client avait payé à la commande. */
export function clientALaCommande(c: Cas) {
  const j = janvierDe(c);
  const depart = departDeLaTresorerie(c);
  const avant = tresorerieDeJanvier(c, depart);
  // Payer à la commande : un délai nul, la facture réglée le jour de la vente, avant le 31 janvier.
  const apres = tresorerieDeJanvier(c, { ...depart, delaiClient: 0 });
  return { j, avant, apres, ecartDeBanque: auCentime(apres.banque - avant.banque), payeEnJanvier: c.venteCredit.date <= FIN_DE_JANVIER };
}

export const LE_CLIENT_PAIE_A_LA_COMMANDE: Situation = {
  code: "le-client-paie-a-la-commande",
  parcours: "comptabilite-generale",
  palier: 2,
  blocs: [],
  reprend: ["du-resultat-a-la-tresorerie"],
  commanditaire: "Le gérant",
  titre: "Le client paie à la commande",
  accroche: "Et si le client professionnel avait payé sa facture à la commande ? Le gérant veut savoir ce que cela change à la banque et au résultat de janvier.",
  objectifs: [
    "Refaire la banque et la créance du 31 janvier quand un règlement change de date",
    "Montrer qu'un règlement ne change pas le résultat",
    "Rédiger une réponse chiffrée au gérant",
  ],
  libre: false,
  ouverture: ouvertureDeJanvier,
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "La demande du gérant",
      texte: (c) => {
        const client = nomDuClient(c.venteCredit.client);
        return [
          `« Pour sa facture de ${eur(c.venteCredit.ttc)} toutes taxes comprises, ${client} a attendu son délai. S'il avait payé à la commande, le jour même, qu'aurions-nous eu au 31 janvier en banque, en créance client, et comme résultat ? »`,
          "Le journal de janvier est passé : vous le trouvez déjà saisi, en une balance. Pas de cours cette fois : la méthode est celle du chapitre.",
        ];
      },
      tableau: (c) => {
        const k = clientALaCommande(c);
        return {
          titre: `Janvier · ${c.entreprise}`,
          colonnes: ["Montant"],
          lignes: [
            { libelle: "Résultat de janvier", valeurs: [eur(k.avant.resultat)] },
            { libelle: "Banque au 31 janvier", valeurs: [eur(k.avant.banque)] },
            { libelle: "Créance sur le client", valeurs: [eur(k.avant.creances)] },
          ],
        };
      },
    },
    {
      id: "la-banque",
      type: "montants",
      titre: "La banque et la créance",
      notions: ["net_treasury", "payment_terms"],
      question: () => "Si le client avait payé à la commande, calculez la banque au 31 janvier, la créance sur le client à cette date, puis le résultat de janvier.",
      champs: (c) => {
        const k = clientALaCommande(c);
        return [
          { libelle: "Banque au 31 janvier", attendu: k.apres.banque, calcul: `${eur(k.avant.banque)} + ${eur(c.venteCredit.ttc)} = ${eur(k.apres.banque)}` },
          { libelle: "Créance sur le client au 31 janvier", attendu: k.apres.creances, calcul: "la facture est payée : plus rien n'est dû" },
          { libelle: "Résultat de janvier", attendu: k.apres.resultat, calcul: `${eur(k.avant.resultat)}, inchangé : la vente compte à la facture` },
        ];
      },
      explication: (c) => {
        const k = clientALaCommande(c);
        return [`La créance de ${eur(c.venteCredit.ttc)} devient de l'argent en banque : la banque gagne ${eur(k.ecartDeBanque)}, le résultat reste à ${eur(k.apres.resultat)}.`];
      },
    },
    {
      id: "la-variation",
      type: "montants",
      titre: "La variation de la banque",
      notions: ["net_treasury"],
      question: () => "Dans ce cas, calculez la variation de la banque de janvier, hors apports et emprunt (négative si la banque a baissé).",
      champs: (c) => {
        const k = clientALaCommande(c);
        return [{ libelle: "Variation de la banque, hors apports et emprunt", attendu: k.apres.variation, calcul: `${eur(k.apres.banque)} − ${eur(c.capital)} − ${eur(c.emprunt)} = ${eur(k.apres.variation)}` }];
      },
      explication: (c) => {
        const k = clientALaCommande(c);
        return [`La variation passe de ${eur(k.avant.variation)} à ${eur(k.apres.variation)} ; le résultat, lui, n'a pas bougé.`];
      },
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre réponse au gérant",
      notions: ["net_treasury", "income_statement"],
      question: () => "Quelle phrase envoyez-vous au gérant ?",
      options: (c) => {
        const k = clientALaCommande(c);
        return [
          {
            texte: `La banque aurait eu ${eur(k.ecartDeBanque)} de plus, le résultat le même`,
            juste: true,
            retour: `Oui : payer plus tôt transforme la créance en argent. Le résultat, ${eur(k.apres.resultat)}, est né de la facture, payée ou non.`,
          },
          {
            texte: `Le résultat aurait gagné ${eur(c.venteCredit.ttc)}, la banque aussi`,
            juste: false,
            retour: "Non : la vente comptait déjà au résultat, pour son hors taxes. Seule la banque bouge, toutes taxes comprises.",
          },
          {
            texte: `Rien n'aurait changé au 31 janvier, ni la banque ni le résultat`,
            juste: false,
            retour: `Non : la facture payée en janvier entre en banque en janvier, ${eur(k.ecartDeBanque)} de plus.`,
          },
        ];
      },
    },
  ],
};
