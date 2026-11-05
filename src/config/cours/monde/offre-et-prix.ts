import { assortiment, demandeDeLaReference, referenceDe } from "./boutique";
import type { CodeDeReference, FicheDeLaBoutique } from "./maille-et-co";

/**
 * LE MONDE DU COURS : CE QUI ENTOURE L'OFFRE ET LE PRIX DE MAILLE & CO (BTS MCO, bloc 2 ; compléments des
 * chapitres « L'assortiment : marge et volume », « La promotion qui paie » et « S'aligner sur le
 * concurrent »).
 *
 * Les chiffres de la boutique (la gamme, les marges, la promotion de février, l'élasticité au prix)
 * sont ceux de la fiche (monde/maille-et-co.ts) et du modèle (monde/boutique.ts). Ce module pose, chaque
 * hypothèse nommée et chaque règle de droit citée, ce que ces chapitres ajoutent :
 *   1. L'OFFRE : la marque et sa protection, les signes de qualité, l'emballage, un service associé
 *      chiffré (la retouche offerte du mérinos), les conditions générales de vente aux comités.
 *   2. LES PROMOTIONS : le prix de référence d'une annonce de réduction, les soldes, les loteries.
 *   3. LE PRIX : l'enquête du prix d'acceptabilité, l'élasticité lue sur deux prix, le cadre légal.
 * Les valeurs légales dont le cours n'est pas sûr portent la mention « À VÉRIFIER ».
 */

const auCentime = (x: number) => Math.round(x * 100) / 100 + 0;

// ─────────────────────────────────────────────────────────────────────────────
// 1. L'OFFRE
// ─────────────────────────────────────────────────────────────────────────────

/**
 * LA MARQUE (code de la propriété intellectuelle) : un dépôt à l'INPI protège le nom MAILLE & CO pour 10
 * ans, renouvelables sans limite, dans les classes de produits et de services choisies : la classe 25
 * (les vêtements) et la classe 35 (la vente au détail). Le dépôt en ligne coûte 190 € pour une classe,
 * plus 40 € par classe en plus. // À VÉRIFIER (tarifs de l'INPI)
 */
export const MARQUE = { dureeEnAnnees: 10, classes: [25, 35], coutPremiereClasse: 190, coutClasseEnPlus: 40 } as const;

/** Le coût du dépôt de la marque dans ses classes. */
export const coutDuDepot = () => MARQUE.coutPremiereClasse + (MARQUE.classes.length - 1) * MARQUE.coutClasseEnPlus;

/**
 * LE SERVICE ASSOCIÉ ENVISAGÉ (hypothèse du cours) : la retouche offerte sur le pull mérinos (ourlet
 * des manches, ajustement). Elle coûte 6 € à l'atelier de couture voisin par pull retouché ; 30 % des
 * acheteurs la demandent ; d'après l'enquête en boutique, elle ferait demander 10 % de mérinos en plus.
 */
export const RETOUCHE_OFFERTE = { reference: "merinos" as CodeDeReference, coutParRetouche: 6, partDesAcheteurs: 0.3, hausseDeLaDemande: 0.1 } as const;

export function serviceAssocie(f: FicheDeLaBoutique) {
  const r = referenceDe(f, RETOUCHE_OFFERTE.reference);
  const a = assortiment(f).references.find((x) => x.code === r.code)!;
  const stock = r.stockInitial + r.livraisons.reduce((t, l) => t + l.quantite, 0);
  const demande = Math.floor(r.demandeDuMois * (1 + RETOUCHE_OFFERTE.hausseDeLaDemande) + 1e-9);
  const ventes = Math.min(demande, stock);
  const ventesEnPlus = ventes - r.ventesDuMois;
  const retouches = Math.round(ventes * RETOUCHE_OFFERTE.partDesAcheteurs);
  const margeEnPlus = auCentime(ventesEnPlus * a.margeUnitaire);
  const coutDesRetouches = auCentime(retouches * RETOUCHE_OFFERTE.coutParRetouche);
  return { r, margeUnitaire: a.margeUnitaire, stock, ventes, ventesEnPlus, retouches, margeEnPlus, coutDesRetouches, effet: auCentime(margeEnPlus - coutDesRetouches) };
}

/**
 * L'EMBALLAGE (code de l'environnement) : les sacs de caisse en plastique à usage unique sont interdits
 * depuis 2016 ; la boutique emballe dans un sac en papier kraft à son nom, compris dans les « autres coûts
 * variables » de chaque article (emballages, étiquettes, frais de carte).
 */
export const SAC_DE_CAISSE = "un sac en papier kraft à son nom";

/**
 * LES CONDITIONS GÉNÉRALES DE VENTE AUX COMITÉS D'ENTREPRISE (code de commerce, art. L. 441-1 et
 * L. 441-10) : entre professionnels, elles sont communiquées à l'acheteur qui les demande et précisent
 * les conditions de règlement, le taux des pénalités de retard et l'indemnité forfaitaire de 40 € pour
 * frais de recouvrement.
 */
export const INDEMNITE_FORFAITAIRE_DE_RECOUVREMENT = 40;

// ─────────────────────────────────────────────────────────────────────────────
// 2. LES PROMOTIONS ET LEUR RÉGLEMENTATION
// ─────────────────────────────────────────────────────────────────────────────

/**
 * LE PRIX DE RÉFÉRENCE D'UNE ANNONCE DE RÉDUCTION (code de la consommation, art. L. 112-1-1) : le prix le
 * plus bas pratiqué par le vendeur pendant les 30 jours qui précèdent la réduction. La boutique a vendu le
 * pull col rond avec 10 % de remise en février (la promotion de la fiche) ; elle annonce « −20 % » sur le
 * col rond la première semaine de mars.
 */
export const JOURS_DU_PRIX_DE_REFERENCE = 30;
export const REDUCTION_DE_MARS = 0.2;

export function annonceDeReduction(f: FicheDeLaBoutique) {
  const r = referenceDe(f, f.promotion.reference);
  const prixDeFevrier = auCentime(r.prixTtc * (1 - f.promotion.remise));
  const prixDeReference = Math.min(r.prixTtc, prixDeFevrier);
  const prixAnnonce = auCentime(prixDeReference * (1 - REDUCTION_DE_MARS));
  const prixSurLEtiquette = auCentime(r.prixTtc * (1 - REDUCTION_DE_MARS));
  return { r, prixDeFevrier, prixDeReference, prixAnnonce, prixSurLEtiquette, reductionReelle: 1 - prixSurLEtiquette / prixDeReference };
}

/**
 * LES SOLDES (code de commerce, art. L. 310-3) : deux périodes par an, de 4 semaines chacune ; les soldes
 * d'hiver commencent le deuxième mercredi de janvier, ceux d'été le dernier mercredi de juin (sauf
 * dérogations locales) ; seules s'y vendent des marchandises proposées à la vente et payées depuis au
 * moins un mois ; la revente à perte y est permise. // À VÉRIFIER (durée fixée par arrêté)
 */
export const SOLDES = { semaines: 4, ancienneteMinimaleEnJours: 30 } as const;

/** La commande proposée pour les soldes (hypothèse du cours) : 300 pulls livrés 10 jours avant leur ouverture. */
export const COMMANDE_POUR_LES_SOLDES = { articles: 300, joursAvantLesSoldes: 10 } as const;

// ─────────────────────────────────────────────────────────────────────────────
// 3. LE PRIX : L'ACCEPTABILITÉ, L'ÉLASTICITÉ, LE CADRE LÉGAL
// ─────────────────────────────────────────────────────────────────────────────

/**
 * L'ENQUÊTE DU PRIX D'ACCEPTABILITÉ (hypothèse du cours) : 200 clientes interrogées à la porte sur le
 * pull col rond. À chaque étiquette, la part qui le trouverait trop cher (elle n'achète pas), et la part
 * qui le trouverait trop bon marché (elle doute de la qualité). Le taux d'acceptation est ce qui reste.
 */
export const ENQUETE_DU_PRIX: readonly { prixTtc: number; tropCher: number; tropBonMarche: number }[] = [
  { prixTtc: 54, tropCher: 0, tropBonMarche: 0.3 },
  { prixTtc: 60, tropCher: 0.05, tropBonMarche: 0.12 },
  { prixTtc: 66, tropCher: 0.15, tropBonMarche: 0.04 },
  { prixTtc: 72, tropCher: 0.4, tropBonMarche: 0.01 },
  { prixTtc: 78, tropCher: 0.7, tropBonMarche: 0 },
];

export function acceptabilite() {
  const lignes = ENQUETE_DU_PRIX.map((l) => ({ ...l, acceptation: 1 - l.tropCher - l.tropBonMarche }));
  const meilleur = lignes.reduce((a, b) => (b.acceptation > a.acceptation ? b : a));
  return { lignes, meilleur };
}

/** L'élasticité lue sur deux prix : la variation relative de la demande ÷ la variation relative du prix. */
export function elasticiteLue(f: FicheDeLaBoutique) {
  const r = referenceDe(f, f.concurrent.reference);
  const prixHtDuConcurrent = auCentime(f.concurrent.prixTtc / (1 + r.tauxTva));
  const demandeAuPrix = demandeDeLaReference(f, r.code, { prixHt: prixHtDuConcurrent });
  const variationDuPrix = (prixHtDuConcurrent - r.prixHt) / r.prixHt;
  const variationDeLaDemande = (demandeAuPrix - r.demandeDuMois) / r.demandeDuMois;
  return { r, prixHtDuConcurrent, demandeAuPrix, variationDuPrix, variationDeLaDemande, elasticite: variationDeLaDemande / variationDuPrix };
}
