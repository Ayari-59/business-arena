import { montantEcrit } from "../../../../pedagogy/cours/correcteur";
import type { Cas } from "../../cas";
import { ENTREPRISES_DES_VENTES_ET_ACHATS } from "../../chapitres/ventes-et-achats-au-complet";
import { CAMPUSTECH } from "../../monde/exercice-de-nova";
import { PRIX_DE_L_ENCEINTE } from "../../monde/nova-gestion";
import { COMMANDE_DE_NOEL, PALETTES, factureDeNoel } from "../../monde/ventes-et-achats-de-nova";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « VENTES ET ACHATS AU COMPLET » : LA COMMANDE DE NOËL DE CAMPUSTECH
 * (comptabilité générale, palier 3).
 *
 * LE CAS JOUE DANS LE MONDE DU COURS, comme son chapitre : NOVA en N + 1, la commande de Noël de
 * CampusTech (monde/ventes-et-achats-de-nova.ts, COMMANDE_DE_NOEL). L'élève refait seul le chemin du
 * chapitre : la facture qui impute l'acompte, avec le port et les palettes ; l'acompte, la facture et
 * le retour des palettes au journal ; puis ce que CampusTech doit encore.
 */

const eur = (x: number) => montantEcrit(x + 0).replace(/^-/, "−");
const qte = (n: number) => (n + 0).toLocaleString("fr-FR");
const pct = (t: number) => `${(t * 100).toLocaleString("fr-FR", { maximumFractionDigits: 2 })} %`;

const K = COMMANDE_DE_NOEL;

/** Les chiffres du cas. */
export const noelDuCas = (_c: Pick<Cas, "code">) => factureDeNoel();

export const LA_COMMANDE_DE_NOEL_DE_CAMPUSTECH: Situation = {
  code: "la-commande-de-noel-de-campustech",
  parcours: "comptabilite-generale",
  palier: 3,
  blocs: [],
  reprend: ["ventes-et-achats-au-complet"],
  commanditaire: "La direction",
  titre: "La commande de Noël de CampusTech",
  accroche: "Un acompte, un port express, des palettes consignées dont une partie ne reviendra pas : la facture de Noël de CampusTech, au journal, et ce qu'il doit encore.",
  objectifs: [
    "Établir une facture qui impute un acompte, avec un port facturé et des emballages consignés",
    "Passer l'acompte, la facture et le retour des emballages au journal",
    "Dire ce que le client doit encore, et rendre une réponse",
  ],
  libre: false,
  entreprises: {
    codes: ENTREPRISES_DES_VENTES_ET_ACHATS,
    pourquoi: "ce cas reprend le chapitre « Ventes et achats au complet », qui se joue sur NOVA en N + 1 dans la simulation du cours.",
  },
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "La question de la direction",
      texte: () => [
        `« ${CAMPUSTECH.nom} nous commande ${qte(K.enceintes)} NOVA One pour Noël, avec un acompte de ${pct(K.acompte)} et une livraison express. Je veux l'acompte, la facture et le retour des palettes au journal, et savoir ce qu'il nous devra une fois les palettes rendues. »`,
        "Pas de cours cette fois : vous avez les conditions de la commande.",
      ],
      tableau: () => ({
        titre: "La commande de Noël",
        colonnes: ["Conditions"],
        lignes: [
          { libelle: `Commande du ${K.commande}`, valeurs: [`${qte(K.enceintes)} NOVA One à ${eur(PRIX_DE_L_ENCEINTE)} hors taxes, TVA à 20 %`] },
          { libelle: "Acompte", valeurs: [`${pct(K.acompte)} du montant toutes taxes comprises des enceintes, viré à la commande`] },
          { libelle: `Facture du ${K.facture}`, valeurs: [`${eur(K.port)} de port hors taxes, ${qte(K.palettes)} palettes consignées à ${eur(PALETTES.consignation)}`] },
          { libelle: `Retour du ${K.retour}`, valeurs: [`${qte(K.rendues)} palettes rendues, les autres gardées et vendues au prix de la consignation`] },
        ],
      }),
      repere: () => "À rendre : l'acompte et la facture, trois écritures, et ce que CampusTech doit encore.",
    },
    {
      id: "la-facture",
      type: "montants",
      titre: "La facture de Noël",
      notions: ["vat_payable", "payment_terms"],
      question: () => "Calculez l'acompte toutes taxes comprises, la base de la TVA de la facture, sa TVA, le total de la facture et le net à payer, acompte déduit.",
      champs: (c) => {
        const f = noelDuCas(c);
        return [
          { libelle: "Acompte, toutes taxes comprises", attendu: f.acompte.ttc, calcul: `${eur(f.enceintes)} × 1,2 × ${pct(K.acompte)} = ${eur(f.acompte.ttc)}` },
          { libelle: "Base de la TVA", attendu: f.baseDeTva, calcul: `${eur(f.enceintes)} + ${eur(f.port)} de port = ${eur(f.baseDeTva)}` },
          { libelle: "TVA", attendu: f.tva, calcul: `${eur(f.baseDeTva)} × 20 % = ${eur(f.tva)}` },
          { libelle: "Total de la facture", attendu: f.total, calcul: `${eur(f.baseDeTva)} + ${eur(f.tva)} + ${eur(f.consignation)} de consignation = ${eur(f.total)}` },
          { libelle: "Net à payer", attendu: f.netAPayer, calcul: `${eur(f.total)} − ${eur(f.acompte.ttc)} = ${eur(f.netAPayer)}` },
        ];
      },
      explication: () => ["Le port entre dans la base de la TVA ; la consignation, non. L'acompte se déduit toutes taxes comprises : sa TVA a été collectée à la commande."],
    },
    {
      id: "l-acompte",
      type: "ecriture",
      titre: "L'acompte, au journal",
      notions: ["vat_payable"],
      evenement: (c) => `Le ${K.commande}, ${CAMPUSTECH.nom} vire l'acompte : ${eur(noelDuCas(c).acompte.ttc)}.`,
      ecriture: (c) => {
        const f = noelDuCas(c);
        return {
          date: K.commande,
          libelle: `Acompte de ${CAMPUSTECH.nom}, commande de Noël`,
          lignes: [
            { role: "l'argent reçu en banque", compte: "512", sens: "debit", montant: f.acompte.ttc, indice: "l'acompte viré" },
            { role: "l'acompte reçu du client", compte: "4191", acceptes: ["419"], sens: "credit", montant: f.acompte.ht, indice: "l'acompte hors taxes" },
            { role: "la TVA collectée sur l'acompte", compte: "44571", sens: "credit", montant: f.acompte.tva, indice: "la TVA de l'acompte" },
          ],
        };
      },
      indices: () => ["Ce n'est pas encore une vente.", "L'acompte hors taxes au 4191, sa TVA collectée dès l'encaissement."],
      explication: (c) => [`${eur(noelDuCas(c).acompte.tva)} de TVA sont dus dès novembre, avant la livraison.`],
      vue: "bilan-et-resultat",
    },
    {
      id: "la-facture-au-journal",
      type: "ecriture",
      titre: "La facture, au journal",
      notions: ["vat_payable", "revenue"],
      evenement: (c) => `Le ${K.facture}, NOVA livre et facture : ${eur(noelDuCas(c).netAPayer)} restent à payer.`,
      ecriture: (c) => {
        const f = noelDuCas(c);
        return {
          date: K.facture,
          libelle: `Facture ${CAMPUSTECH.nom}, commande de Noël`,
          lignes: [
            { role: "la créance sur le client", compte: "411", sens: "debit", montant: f.netAPayer, indice: "le net à payer" },
            { role: "l'acompte qui s'impute", compte: "4191", acceptes: ["419"], sens: "debit", montant: f.acompte.ht, indice: "l'acompte hors taxes" },
            { role: "la vente des enceintes", compte: "701", sens: "credit", montant: f.enceintes, indice: "les enceintes hors taxes" },
            { role: "le port facturé", compte: "7085", acceptes: ["708"], sens: "credit", montant: f.port, indice: "le port hors taxes" },
            { role: "la consignation des palettes", compte: "4196", acceptes: ["419"], sens: "credit", montant: f.consignation, indice: "les palettes consignées" },
            { role: "la TVA collectée qui reste", compte: "44571", sens: "credit", montant: f.tvaRestante, indice: "la TVA de la facture, moins celle de l'acompte" },
          ],
        };
      },
      indices: () => ["Au débit, le client et l'acompte qui s'éteint.", "Au crédit, la vente, le port, la consignation et la TVA qui reste."],
      explication: (c) => {
        const f = noelDuCas(c);
        return [`La TVA de la facture, ${eur(f.tva)}, se collecte en deux fois : ${eur(f.acompte.tva)} à l'acompte, ${eur(f.tvaRestante)} à la facture.`];
      },
      vue: "bilan-et-resultat",
    },
    {
      id: "les-palettes",
      type: "ecriture",
      titre: "Le retour des palettes",
      notions: ["vat_payable"],
      evenement: (c) => {
        const r = noelDuCas(c).retour;
        return `Le ${K.retour}, ${CAMPUSTECH.nom} rend ${qte(K.rendues)} palettes et garde les ${qte(r.gardees)} autres, vendues ${eur(r.garde)} toutes taxes comprises.`;
      },
      ecriture: (c) => {
        const r = noelDuCas(c).retour;
        return {
          date: K.retour,
          libelle: `Palettes de ${CAMPUSTECH.nom}, commande de Noël`,
          lignes: [
            { role: "la consignation qui s'éteint", compte: "4196", acceptes: ["419"], sens: "debit", montant: r.total, indice: "toutes les palettes consignées" },
            { role: "les palettes rendues", compte: "411", sens: "credit", montant: r.rendu, indice: "les palettes rendues" },
            { role: "la vente des palettes gardées", compte: "7088", acceptes: ["708"], sens: "credit", montant: r.ht, indice: "les palettes gardées, hors taxes" },
            { role: "la TVA sur les palettes gardées", compte: "44571", sens: "credit", montant: r.tva, indice: "la TVA des palettes gardées" },
          ],
        };
      },
      indices: () => ["Toute la consignation s'éteint.", "Les palettes rendues baissent la créance ; les palettes gardées deviennent une vente, avec sa TVA."],
      explication: (c) => {
        const r = noelDuCas(c).retour;
        return [`Les palettes gardées rapportent ${eur(r.ht)} hors taxes et ${eur(r.tva)} de TVA ; les rendues ne sont jamais devenues une vente.`];
      },
      vue: "bilan-et-resultat",
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre réponse à la direction",
      question: () => "Que doit encore CampusTech, une fois les palettes rendues ?",
      options: (c) => {
        const f = noelDuCas(c);
        return [
          { texte: `${eur(f.resteDu)}, palettes gardées comprises`, juste: true, retour: `Oui : ${eur(f.netAPayer)} de net à payer, moins ${eur(f.retour.rendu)} de palettes rendues. Les ${qte(f.retour.gardees)} palettes gardées restent dues, ${eur(f.retour.garde)} toutes taxes comprises.` },
          { texte: `${eur(f.netAPayer)}, le net à payer de la facture, que le retour ne change pas`, juste: false, retour: `Non : les palettes rendues effacent ${eur(f.retour.rendu)} de la créance.` },
          { texte: `${eur(f.total - f.retour.rendu)}, le total de la facture moins les palettes rendues`, juste: false, retour: `Non : l'acompte de ${eur(f.acompte.ttc)} est déjà payé, il se déduit.` },
          { texte: `${eur(f.netAPayer - f.consignation)}, toute la consignation ôtée, rendue ou non`, juste: false, retour: `Non : seules les palettes rendues s'ôtent ; les gardées sont vendues, et dues.` },
        ];
      },
    },
  ],
};
