import { enEcriture, montantEcrit as eur } from "../../../pedagogy/cours/correcteur";
import { auCentime } from "../../../pedagogy/cours/etats";
import type { Cas } from "../cas";
import { factureDeVente } from "../chapitres/remises-et-reglements";
import { dateDuCours as date } from "../dates";
import { JOURS_D_ESCOMPTE, TAUX_D_ESCOMPTE, TAUX_DE_REMISE } from "../remises";
import type { Situation } from "./types";

/**
 * CAS PRATIQUE : LA FACTURE CONTESTÉE (comptabilité générale, palier 3).
 *
 * Le client professionnel du cas écrit : la facture qu'il a reçue oublie la remise
 * prévue à ses conditions. Elle est déjà passée au journal. L'élève rend une facture
 * juste, l'avoir qui corrige l'écart, l'écriture de cet avoir, puis l'encaissement du
 * client, et répond au client.
 *
 * Aucun cours : les calculs sont ceux du chapitre « Remises et règlements » (la
 * facture avec remise et escompte, la vente au net commercial, l'escompte en charge
 * financière) et du premier chapitre pour la TVA collectée et le journal. La facture
 * juste est celle de `factureDeVente` ; la facture envoyée est la même, sans la remise.
 */

const qte = (n: number) => n.toLocaleString("fr-FR");
const pct = (t: number, d = 2) => `${(t * 100).toLocaleString("fr-FR", { maximumFractionDigits: d })} %`;

/** Le client écrit trois jours après avoir reçu la facture : l'avoir porte cette date. */
export const JOURS_AVANT_LA_RECLAMATION = 3;

/** La facture envoyée, la facture juste, et l'avoir qui passe de l'une à l'autre. */
export function factureContestee(c: Cas) {
  const juste = factureDeVente(c);
  // La facture envoyée a oublié la remise : le net commercial est le prix brut, et
  // l'escompte, puis la TVA, se calculent sur ce montant trop haut.
  const escompteEnvoye = auCentime(juste.brut * TAUX_D_ESCOMPTE);
  const netFinancierEnvoye = auCentime(juste.brut - escompteEnvoye);
  const tvaEnvoyee = auCentime(netFinancierEnvoye * juste.tauxTva);
  const envoyee = {
    brut: juste.brut,
    netCommercial: juste.brut,
    escompte: escompteEnvoye,
    netFinancier: netFinancierEnvoye,
    tva: tvaEnvoyee,
    ttc: auCentime(netFinancierEnvoye + tvaEnvoyee),
  };
  // L'avoir : ce que la facture envoyée a compté de trop, poste par poste.
  const avoir = {
    ventes: auCentime(envoyee.netCommercial - juste.netCommercial),
    escompte: auCentime(envoyee.escompte - juste.escompte),
    tva: auCentime(envoyee.tva - juste.tva),
    ttc: auCentime(envoyee.ttc - juste.ttc),
  };
  return {
    juste,
    envoyee,
    avoir,
    dateAvoir: juste.date + JOURS_AVANT_LA_RECLAMATION,
  };
}

const ecritureEnvoyee = (c: Cas) => {
  const { envoyee, juste } = factureContestee(c);
  return {
    date: date(juste.date),
    libelle: `Facture ${c.venteCredit.client}, envoyée sans la remise`,
    lignes: [
      { role: "la créance sur le client", compte: "411", sens: "debit" as const, montant: envoyee.ttc, indice: "" },
      { role: "l'escompte accordé", compte: "665", sens: "debit" as const, montant: envoyee.escompte, indice: "" },
      { role: "la vente", compte: c.venteCredit.compte, sens: "credit" as const, montant: envoyee.netCommercial, indice: "" },
      { role: "la TVA collectée", compte: "44571", sens: "credit" as const, montant: envoyee.tva, indice: "" },
    ],
  };
};

export const LA_FACTURE_CONTESTEE: Situation = {
  code: "la-facture-contestee",
  parcours: "comptabilite-generale",
  palier: 3,
  blocs: [],
  reprend: ["creation-premier-bilan", "remises-et-reglements"],
  commanditaire: "Un client professionnel",
  titre: "La facture contestée",
  accroche:
    "Un client conteste sa facture : la remise prévue a été oubliée. Refaire la facture juste, établir l'avoir, le passer au journal, et répondre au client.",
  objectifs: [
    "Établir une facture avec remise et escompte : net commercial, net financier, TVA, net à payer",
    "Calculer un avoir poste par poste : la vente, l'escompte, la TVA",
    "Passer l'écriture d'un avoir accordé au client",
    "Enregistrer le règlement de la facture corrigée",
    "Répondre au client avec le bon montant",
  ],
  libre: false,
  ouverture: (c) => enEcriture(ecritureEnvoyee(c)),
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "La lettre du client",
      texte: (c) => {
        const { juste } = factureContestee(c);
        return [
          `« Nous avons bien reçu votre facture du ${date(juste.date)}. Elle ne tient pas compte de la remise de ${pct(TAUX_DE_REMISE)} prévue à nos conditions. Merci de nous adresser un avoir : nous réglerons dans les ${qte(JOURS_D_ESCOMPTE)} jours, escompte déduit, dès que nous l'aurons reçu. » ${c.venteCredit.client}`,
          `La facture est déjà passée au journal de ${c.entreprise}, telle qu'elle est partie. Pas de cours cette fois : les calculs sont ceux que vous connaissez. À vous de les enchaîner.`,
        ];
      },
      tableau: (c) => {
        const { envoyee } = factureContestee(c);
        return {
          titre: `La facture envoyée à ${c.venteCredit.client}`,
          colonnes: ["Montant"],
          lignes: [
            { libelle: `${qte(c.venteCredit.quantite)} ${c.unites} à ${eur(c.venteCredit.prixUnitaire)}, hors taxes`, valeurs: [eur(envoyee.brut)] },
            { libelle: `Remise prévue aux conditions : ${pct(TAUX_DE_REMISE)}`, valeurs: ["oubliée"] },
            { libelle: `Escompte de ${pct(TAUX_D_ESCOMPTE)}, pour un paiement sous ${qte(JOURS_D_ESCOMPTE)} jours`, valeurs: [eur(envoyee.escompte)] },
            { libelle: "Net financier", valeurs: [eur(envoyee.netFinancier)] },
            { libelle: `TVA à ${pct(c.venteCredit.tauxTva, 1)}`, valeurs: [eur(envoyee.tva)] },
            { libelle: "Net à payer", valeurs: [eur(envoyee.ttc)] },
          ],
        };
      },
      repere: () =>
        "À rendre : la facture telle qu'elle aurait dû partir, l'avoir qui corrige l'écart, son écriture, l'encaissement du client, et votre réponse.",
    },
    {
      id: "facture-juste",
      type: "montants",
      titre: "La facture juste",
      notions: ["payment_terms", "vat_payable"],
      question: () =>
        "Établissez la facture telle qu'elle aurait dû partir : la remise, le net commercial, l'escompte, le net financier, la TVA et le net à payer.",
      champs: (c) => {
        const f = factureDeVente(c);
        return [
          { libelle: "Remise", attendu: f.remise, calcul: `${eur(f.brut)} × ${pct(TAUX_DE_REMISE)} = ${eur(f.remise)}` },
          { libelle: "Net commercial", attendu: f.netCommercial, calcul: `${eur(f.brut)} − ${eur(f.remise)} = ${eur(f.netCommercial)}` },
          { libelle: "Escompte", attendu: f.escompte, calcul: `${eur(f.netCommercial)} × ${pct(TAUX_D_ESCOMPTE)} = ${eur(f.escompte)}` },
          { libelle: "Net financier", attendu: f.netFinancier, calcul: `${eur(f.netCommercial)} − ${eur(f.escompte)} = ${eur(f.netFinancier)}` },
          { libelle: "TVA", attendu: f.tva, calcul: `${eur(f.netFinancier)} × ${pct(f.tauxTva, 1)} = ${eur(f.tva)}` },
          { libelle: "Net à payer", attendu: f.ttc, calcul: `${eur(f.netFinancier)} + ${eur(f.tva)} = ${eur(f.ttc)}` },
        ];
      },
      explication: (c) => {
        const { juste, envoyee } = factureContestee(c);
        return [
          `L'oubli de la remise ne change pas que la remise : l'escompte et la TVA se calculaient sur un montant trop haut. Le client devait ${eur(juste.ttc)}, la facture lui en demandait ${eur(envoyee.ttc)}.`,
        ];
      },
    },
    {
      id: "avoir",
      type: "montants",
      titre: "L'avoir",
      notions: ["payment_terms", "vat_payable"],
      question: () =>
        "L'avoir annule ce que la facture envoyée a compté de trop. Calculez, poste par poste, la vente en moins (hors taxes, avant escompte), l'escompte en moins, la TVA en moins, puis le montant de l'avoir, toutes taxes comprises.",
      champs: (c) => {
        const { juste, envoyee, avoir } = factureContestee(c);
        return [
          { libelle: "Vente en moins", attendu: avoir.ventes, calcul: `${eur(envoyee.netCommercial)} − ${eur(juste.netCommercial)} = ${eur(avoir.ventes)}` },
          { libelle: "Escompte en moins", attendu: avoir.escompte, calcul: `${eur(envoyee.escompte)} − ${eur(juste.escompte)} = ${eur(avoir.escompte)}` },
          { libelle: "TVA en moins", attendu: avoir.tva, calcul: `${eur(envoyee.tva)} − ${eur(juste.tva)} = ${eur(avoir.tva)}` },
          { libelle: "Montant de l'avoir, toutes taxes comprises", attendu: avoir.ttc, calcul: `${eur(envoyee.ttc)} − ${eur(juste.ttc)} = ${eur(avoir.ttc)}` },
        ];
      },
      explication: (c) => {
        const { avoir } = factureContestee(c);
        return [
          `La vente en moins est la remise oubliée, ${eur(avoir.ventes)}. Mais l'avoir n'est pas de ce montant : l'escompte baisse aussi, de ${eur(avoir.escompte)}, et la TVA de ${eur(avoir.tva)}. Le client doit ${eur(avoir.ttc)} de moins.`,
        ];
      },
    },
    {
      id: "ecriture-de-l-avoir",
      type: "ecriture",
      titre: "L'avoir, au journal",
      notions: ["payment_terms", "vat_payable"],
      evenement: (c) => {
        const { avoir, dateAvoir } = factureContestee(c);
        return `Le ${date(dateAvoir)}, ${c.entreprise} envoie à ${c.venteCredit.client} un avoir de ${eur(avoir.ttc)} pour la remise oubliée.`;
      },
      ecriture: (c) => {
        const { avoir, dateAvoir } = factureContestee(c);
        return {
          date: date(dateAvoir),
          libelle: `Avoir ${c.venteCredit.client}`,
          lignes: [
            {
              role: "la réduction accordée sur la vente",
              compte: "709",
              acceptes: [c.venteCredit.compte, ...(c.venteCredit.acceptes ?? [])],
              sens: "debit",
              montant: avoir.ventes,
              indice: "la vente en moins de l'avoir",
            },
            { role: "la TVA collectée en moins", compte: "44571", sens: "debit", montant: avoir.tva, indice: "la TVA en moins de l'avoir" },
            { role: "l'escompte accordé en moins", compte: "665", sens: "credit", montant: avoir.escompte, indice: "l'escompte en moins de l'avoir" },
            { role: "la créance sur le client qui baisse", compte: "411", sens: "credit", montant: avoir.ttc, indice: "le montant de l'avoir, toutes taxes comprises" },
          ],
        };
      },
      indices: () => [
        "Un avoir défait une partie de la facture : chaque ligne de la facture repart dans l'autre sens, pour l'écart.",
        "La vente en moins se débite (709, ou le compte de ventes) ; la TVA collectée en moins aussi. L'escompte accordé, une charge, baisse : au crédit. La créance sur le client baisse du montant de l'avoir.",
      ],
      explication: (c) => {
        const { avoir, juste } = factureContestee(c);
        return [
          `Après l'avoir, la créance sur ${c.venteCredit.client} vaut ${eur(juste.ttc)}, le net à payer de la facture juste : la facture et l'avoir, lus ensemble, disent ce que le client doit vraiment.`,
          `Le compte 709 garde la trace de la remise accordée après coup, ${eur(avoir.ventes)}, et vient en moins des ventes au compte de résultat.`,
        ];
      },
      vue: "resultat",
    },
    {
      id: "encaissement",
      type: "ecriture",
      titre: "Le client paie",
      notions: ["payment_terms"],
      evenement: (c) => {
        const { juste } = factureContestee(c);
        return `Le ${date(juste.paiement)}, dans le délai de l'escompte, ${c.venteCredit.client} règle par virement ce qu'il doit après l'avoir.`;
      },
      ecriture: (c) => {
        const { juste } = factureContestee(c);
        return {
          date: date(juste.paiement),
          libelle: `Règlement ${c.venteCredit.client}`,
          lignes: [
            { role: "l'argent reçu en banque", compte: "512", sens: "debit", montant: juste.ttc, indice: "le net à payer de la facture juste" },
            { role: "la créance qui s'éteint", compte: "411", sens: "credit", montant: juste.ttc, indice: "ce que le client doit après l'avoir" },
          ],
        };
      },
      indices: () => [
        "Le client ne paie ni la facture envoyée, ni l'avoir : il paie ce qu'il doit après l'avoir.",
        "La banque reçoit, la créance sur le client s'éteint.",
      ],
      explication: (c) => {
        const { juste } = factureContestee(c);
        return [`Le client a payé ${eur(juste.ttc)} : la créance est soldée, et le compte 411 revient à zéro.`];
      },
      vue: "resultat",
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre réponse au client",
      question: () => "Quelle phrase envoyez-vous au client avec l'avoir ?",
      options: (c) => {
        const { avoir, juste } = factureContestee(c);
        return [
          {
            texte: `Voici un avoir de ${eur(avoir.ttc)} : reste ${eur(juste.ttc)} à payer`,
            juste: true,
            retour: `Oui : l'avoir corrige la vente, l'escompte et la TVA, et le client règle ${eur(juste.ttc)}, le net à payer de la facture juste.`,
          },
          {
            texte: `Voici un avoir de ${eur(avoir.ventes)}, le montant de la remise oubliée`,
            juste: false,
            retour: `Non : ${eur(avoir.ventes)} est la vente en moins, hors taxes. L'escompte et la TVA baissent aussi : l'avoir vaut ${eur(avoir.ttc)}.`,
          },
          {
            texte: "Une remise ne s'enregistre pas : aucun avoir à faire",
            juste: false,
            retour: `Non : la remise ne s'écrit pas à part sur une facture juste, mais une fois la facture envoyée, seul un avoir peut la corriger. Le client doit ${eur(avoir.ttc)} de moins.`,
          },
        ];
      },
    },
  ],
};
