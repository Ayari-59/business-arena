import { auCentime } from "./amortissement";
import { COUT_DE_PASSATION } from "./approvisionnement-de-nova";
import { CAMPUSTECH, ELECTRO_COMPOSANTS } from "./exercice-de-nova";
import { PLACEMENTS } from "./financer-et-placer";
import { COMPOSANTS_PAR_ENCEINTE, PRIX_DE_L_ENCEINTE, TAUX_DE_TVA } from "./nova-gestion";

/**
 * LE MONDE DU COURS : LES VENTES ET LES ACHATS DE NOVA AU COMPLET, EN N + 1 (BTS CG P1, 1.2.1,
 * 1.2.2, 1.3.1, 1.5.1 et 1.5.2).
 *
 * Le chapitre « Ventes et achats au complet » et son cas le lisent. La fiche figée de l'exercice N
 * (exercice-de-nova.ts) n'est pas touchée : tout se passe en N + 1, avec les partenaires de toujours.
 *
 * LA COMMANDE DE LA RENTRÉE (hypothèse du chapitre). Le 1er juillet N + 1, CampusTech commande
 * 1 500 NOVA One pour la rentrée de ses 16 magasins, livrées et facturées le 20 août. Elle fait partie
 * de la demande de One de N + 1 (nova-capacite.ts) : elle ne s'y ajoute pas. Le prix est celui de
 * toujours, 59 € hors taxes, sans remise. Ce que la commande a de neuf :
 *   · L'ACOMPTE : après Sonora, NOVA ne lance plus une grosse commande sans acompte ; CampusTech
 *     verse 30 % du montant toutes taxes comprises des enceintes le jour de la commande ;
 *   · LE PORT : les enceintes du flux mensuel partent franco à la centrale (referencement-de-nova.ts) ;
 *     celles-ci, livrées en express dans les 16 magasins à la demande de CampusTech, portent un port
 *     de 480 € hors taxes, facturé ;
 *   · LES PALETTES : 30 palettes de 50 enceintes, consignées 25 € chacune, sans TVA. Le 15 septembre,
 *     CampusTech en rend 24 et garde les 6 autres, qui lui sont alors vendues : le prix de la
 *     consignation devient un prix toutes taxes comprises (la déconsignation à un autre prix est hors du
 *     référentiel) ;
 *   · L'ESCOMPTE APRÈS LA FACTURE : CampusTech paie d'ordinaire à 80 jours (nova-gestion.ts). Pour une
 *     fois, NOVA lui propose 1 % du solde hors taxes des enceintes s'il règle dans les 10 jours ; il
 *     règle le 25 août, 75 jours plus tôt. C'est un escompte conditionnel : la facture porte le plein
 *     montant, un avoir le retire avec sa TVA ;
 *   · LE RABAIS : 40 enceintes arrivent la grille rayée ; NOVA accorde 10 % de rabais sur elles, par
 *     un avoir du 15 septembre.
 *
 * LES JEUX DE LA COMMANDE (hypothèse du chapitre). Le 3 juillet, NOVA commande les 1 500 jeux à
 * Électro-Composants Lyon, au prix de toujours (22 € hors taxes) ; pour cette commande spéciale, le
 * fournisseur demande un acompte de 40 % du montant toutes taxes comprises. Il livre et facture le
 * 10 juillet, avec un port de 150 € hors taxes (moins que le coût de passation d'une commande du
 * chapitre « Approvisionner au moindre coût », 200 €, qui le comprend). Sa facture porte 22,40 € le
 * jeu : le contrôle de la commande, du bon de livraison et de la facture trouve l'écart, et le
 * fournisseur envoie un avoir. NOVA paie le solde à 22 jours, le 1er août.
 *
 * CONVENTIONS : la TVA de l'acompte est due à son encaissement, pour une livraison de biens comme
 * pour un service, depuis le 1er janvier 2023 (À VÉRIFIER) ; l'argent reçu plus tôt en été se place au
 * taux du compte à terme du chapitre « Financer et placer la trésorerie » (2,8 % l'an), puisque NOVA y
 * a un excédent ; l'année compte 360 jours.
 */

export const JOURS_PAR_AN = 360;

// ─────────────────────────────────────────────────────────────────────────────
// LA VENTE : LA COMMANDE DE LA RENTRÉE DE CAMPUSTECH
// ─────────────────────────────────────────────────────────────────────────────

export const COMMANDE_DE_LA_RENTREE = {
  client: CAMPUSTECH.nom,
  enceintes: 1_500,
  prix: PRIX_DE_L_ENCEINTE,
  tauxDeTva: TAUX_DE_TVA,
  commande: "1er juillet N + 1",
  facture: "20 août N + 1",
  /** Le délai réel de CampusTech, en jours (nova-gestion.ts) : celui qu'il prendrait sans escompte. */
  delaiHabituel: CAMPUSTECH.delai,
} as const;

/** L'acompte demandé à la commande : 30 % du montant toutes taxes comprises des enceintes. */
export const ACOMPTE_DU_CLIENT = 0.3;

/** Le port de la livraison express dans les 16 magasins, hors taxes, facturé au client. */
export const PORT_FACTURE = 480;

/** Les palettes : 30, consignées 25 € chacune ; CampusTech en rend 24 le 15 septembre. */
export const PALETTES = { nombre: 30, consignation: 25, rendues: 24, retour: "15 septembre N + 1" } as const;

/** L'escompte proposé après la facture : 1 % du solde hors taxes des enceintes, pour un règlement sous 10 jours. */
export const ESCOMPTE_APRES_FACTURE = { taux: 0.01, joursPourEnProfiter: 10, reglement: "25 août N + 1", joursApresLaFacture: 5 } as const;

/** Les jours dont le règlement est avancé : du délai habituel au jour du règlement. */
export const JOURS_D_AVANCE = COMMANDE_DE_LA_RENTREE.delaiHabituel - ESCOMPTE_APRES_FACTURE.joursApresLaFacture;

/** Le taux auquel l'argent reçu plus tôt se place en été : le compte à terme (financer-et-placer.ts). */
export const TAUX_DU_PLACEMENT = PLACEMENTS.compteATerme.tauxAnnuel;

/** Le rabais du 15 septembre : 10 % sur 40 enceintes à la grille rayée. */
export const RABAIS_POUR_DEFAUT = { enceintes: 40, taux: 0.1, date: "15 septembre N + 1" } as const;

/** L'acompte reçu le 1er juillet : son montant TTC, son hors taxes et sa TVA, due dès l'encaissement. */
export function acompteRecu() {
  const ttcDesEnceintes = auCentime(COMMANDE_DE_LA_RENTREE.enceintes * COMMANDE_DE_LA_RENTREE.prix * (1 + TAUX_DE_TVA));
  const ttc = auCentime(ttcDesEnceintes * ACOMPTE_DU_CLIENT);
  const ht = auCentime(ttc / (1 + TAUX_DE_TVA));
  return { ttcDesEnceintes, ttc, ht, tva: auCentime(ttc - ht) };
}

/** La facture du 20 août : les enceintes, le port, la TVA, les palettes consignées, l'acompte déduit. */
export function factureDeLaRentree() {
  const a = acompteRecu();
  const enceintes = auCentime(COMMANDE_DE_LA_RENTREE.enceintes * COMMANDE_DE_LA_RENTREE.prix);
  const baseDeTva = auCentime(enceintes + PORT_FACTURE);
  const tva = auCentime(baseDeTva * TAUX_DE_TVA);
  const consignation = auCentime(PALETTES.nombre * PALETTES.consignation);
  const total = auCentime(baseDeTva + tva + consignation);
  const netAPayer = auCentime(total - a.ttc);
  return { enceintes, port: PORT_FACTURE, baseDeTva, tva, consignation, total, acompte: a, netAPayer, tvaRestante: auCentime(tva - a.tva) };
}

/**
 * L'ESCOMPTE APRÈS LA FACTURE, à un taux et pour des jours d'avance donnés : sa base (le solde hors
 * taxes des enceintes, acompte ôté), l'avoir hors taxes, sa TVA, son TTC, ce que CampusTech règle, et
 * ce que l'argent reçu plus tôt rapporte placé, face à ce que l'escompte coûte (son hors taxes : la
 * TVA de l'avoir revient de l'État).
 */
export function escompteApresLaFacture(taux: number, jours: number) {
  const f = factureDeLaRentree();
  const base = auCentime(f.enceintes - f.acompte.ht);
  const ht = auCentime(base * taux);
  const tva = auCentime(ht * TAUX_DE_TVA);
  const ttc = auCentime(ht + tva);
  const regle = auCentime(f.netAPayer - ttc);
  const interets = auCentime((regle * TAUX_DU_PLACEMENT * jours) / JOURS_PAR_AN);
  return { base, ht, tva, ttc, regle, jours, interets, gain: auCentime(interets - ht) };
}

/** L'escompte du cas : 1 %, pour 75 jours d'avance. */
export const escompteDuCas = () => escompteApresLaFacture(ESCOMPTE_APRES_FACTURE.taux, JOURS_D_AVANCE);

/** Le laboratoire : le taux, au quart de point, et ses bornes. */
export const TAUX_DU_LABORATOIRE = { min: 0, max: 2, pas: 0.25 } as const;
export const JOURS_DU_LABORATOIRE = { min: 5, max: 80, pas: 5 } as const;

/** Le taux le plus fort, au quart de point, dont le coût ne dépasse pas les intérêts du placement, pour des jours donnés. */
export function tauxLePlusFort(jours: number) {
  let meilleur = 0;
  for (let k = 0; k <= Math.round((TAUX_DU_LABORATOIRE.max - TAUX_DU_LABORATOIRE.min) / TAUX_DU_LABORATOIRE.pas); k++) {
    const t = TAUX_DU_LABORATOIRE.min + k * TAUX_DU_LABORATOIRE.pas;
    if (escompteApresLaFacture(t / 100, jours).gain >= 0) meilleur = t;
  }
  return meilleur;
}

/** Le retour des palettes : la consignation rendue, et la vente des palettes gardées (le prix consigné, toutes taxes comprises). */
export function retourDesPalettes(nombre: number = PALETTES.nombre, rendues: number = PALETTES.rendues, consignation: number = PALETTES.consignation) {
  const total = auCentime(nombre * consignation);
  const rendu = auCentime(rendues * consignation);
  const garde = auCentime((nombre - rendues) * consignation);
  const ht = auCentime(garde / (1 + TAUX_DE_TVA));
  return { total, rendu, gardees: nombre - rendues, garde, ht, tva: auCentime(garde - ht) };
}

/** L'avoir du rabais : 10 % sur 40 enceintes. */
export function avoirDeRabais() {
  const ht = auCentime(RABAIS_POUR_DEFAUT.enceintes * COMMANDE_DE_LA_RENTREE.prix * RABAIS_POUR_DEFAUT.taux);
  const tva = auCentime(ht * TAUX_DE_TVA);
  return { ht, tva, ttc: auCentime(ht + tva) };
}

/** Le compte de CampusTech pour la commande, une fois tout passé : négatif, NOVA lui doit l'écart, déduit de sa facture suivante. */
export function soldeDeCampusTech() {
  const f = factureDeLaRentree();
  const e = escompteDuCas();
  const p = retourDesPalettes();
  const r = avoirDeRabais();
  return auCentime(f.netAPayer - e.ttc - e.regle - p.rendu - r.ttc);
}

/** La TVA collectée sur la commande, d'un bout à l'autre : l'acompte, la facture, l'escompte, les palettes gardées, le rabais. */
export function tvaDeLaCommande() {
  const f = factureDeLaRentree();
  return auCentime(f.acompte.tva + f.tvaRestante - escompteDuCas().tva + retourDesPalettes().tva - avoirDeRabais().tva);
}

// ─────────────────────────────────────────────────────────────────────────────
// L'ACHAT : LES JEUX DE LA RENTRÉE, CHEZ ÉLECTRO-COMPOSANTS LYON
// ─────────────────────────────────────────────────────────────────────────────

export const COMMANDE_DE_JEUX = {
  fournisseur: ELECTRO_COMPOSANTS.nom,
  jeux: COMMANDE_DE_LA_RENTREE.enceintes,
  prixConvenu: COMPOSANTS_PAR_ENCEINTE,
  prixFacture: 22.4,
  acompte: 0.4,
  port: 150,
  commande: "3 juillet N + 1",
  facture: "10 juillet N + 1",
  reglement: "1er août N + 1",
} as const;

/** Le port payé reste sous le coût de passation d'une commande, qui le comprend. */
export const PORT_SOUS_LA_PASSATION = COMMANDE_DE_JEUX.port <= COUT_DE_PASSATION;

/** L'acompte versé le 3 juillet : 40 % du montant toutes taxes comprises de la commande, au prix convenu. */
export function acompteVerse() {
  const ht = auCentime(COMMANDE_DE_JEUX.jeux * COMMANDE_DE_JEUX.prixConvenu);
  const ttcDeLaCommande = auCentime(ht * (1 + TAUX_DE_TVA));
  const ttc = auCentime(ttcDeLaCommande * COMMANDE_DE_JEUX.acompte);
  const acompteHt = auCentime(ttc / (1 + TAUX_DE_TVA));
  return { commandeHt: ht, ttcDeLaCommande, ttc, ht: acompteHt, tva: auCentime(ttc - acompteHt) };
}

/** La facture du 10 juillet, telle qu'elle arrive : au prix facturé, avec le port, acompte déduit. */
export function factureDesJeux() {
  const a = acompteVerse();
  const jeux = auCentime(COMMANDE_DE_JEUX.jeux * COMMANDE_DE_JEUX.prixFacture);
  const ht = auCentime(jeux + COMMANDE_DE_JEUX.port);
  const tva = auCentime(ht * TAUX_DE_TVA);
  const ttc = auCentime(ht + tva);
  return { jeux, port: COMMANDE_DE_JEUX.port, ht, tva, ttc, acompte: a, netAPayer: auCentime(ttc - a.ttc), tvaRestante: auCentime(tva - a.tva) };
}

/** Le contrôle des trois documents : l'écart de prix, et l'avoir qu'il appelle. */
export function ecartDeLaFacture() {
  const unitaire = auCentime(COMMANDE_DE_JEUX.prixFacture - COMMANDE_DE_JEUX.prixConvenu);
  const ht = auCentime(unitaire * COMMANDE_DE_JEUX.jeux);
  const tva = auCentime(ht * TAUX_DE_TVA);
  return { unitaire, ht, tva, ttc: auCentime(ht + tva) };
}

/** Ce que NOVA paie au fournisseur pour ces jeux, avant d'être payée : l'acompte, puis le solde, avoir déduit. */
export function composantsPayes() {
  const f = factureDesJeux();
  return auCentime(f.acompte.ttc + f.netAPayer - ecartDeLaFacture().ttc);
}

/** L'acompte le plus petit, en points entiers, dont le montant TTC couvre ce que NOVA paie pour les jeux. */
export function acompteQuiCouvreLesJeux() {
  const ttc = acompteRecu().ttcDesEnceintes;
  const besoin = composantsPayes();
  return Math.ceil((besoin / ttc) * 100 - 1e-9);
}

// ─────────────────────────────────────────────────────────────────────────────
// LE CAS : LA COMMANDE DE NOËL DE CAMPUSTECH
// ─────────────────────────────────────────────────────────────────────────────

/**
 * LA COMMANDE DE NOËL (hypothèse du cas « La commande de Noël de CampusTech ») : le 2 novembre N + 1,
 * CampusTech commande 2 000 NOVA One pour Noël, comprises elles aussi dans la demande de N + 1 ; il
 * verse 25 % du montant toutes taxes comprises des enceintes. NOVA livre et facture le 20 novembre,
 * avec 600 € hors taxes de port express et 40 palettes consignées à 25 € ; le 10 décembre, CampusTech
 * en rend 36 et garde les 4 autres.
 */
export const COMMANDE_DE_NOEL = { enceintes: 2_000, acompte: 0.25, port: 600, palettes: 40, rendues: 36, commande: "2 novembre N + 1", facture: "20 novembre N + 1", retour: "10 décembre N + 1" } as const;

/** La facture de Noël et le retour de ses palettes. */
export function factureDeNoel() {
  const k = COMMANDE_DE_NOEL;
  const enceintes = auCentime(k.enceintes * PRIX_DE_L_ENCEINTE);
  const acompteTtc = auCentime(enceintes * (1 + TAUX_DE_TVA) * k.acompte);
  const acompteHt = auCentime(acompteTtc / (1 + TAUX_DE_TVA));
  const acompteTva = auCentime(acompteTtc - acompteHt);
  const baseDeTva = auCentime(enceintes + k.port);
  const tva = auCentime(baseDeTva * TAUX_DE_TVA);
  const consignation = auCentime(k.palettes * PALETTES.consignation);
  const total = auCentime(baseDeTva + tva + consignation);
  const netAPayer = auCentime(total - acompteTtc);
  const retour = retourDesPalettes(k.palettes, k.rendues, PALETTES.consignation);
  return {
    enceintes,
    port: k.port,
    baseDeTva,
    tva,
    consignation,
    total,
    acompte: { ttc: acompteTtc, ht: acompteHt, tva: acompteTva },
    netAPayer,
    tvaRestante: auCentime(tva - acompteTva),
    retour,
    resteDu: auCentime(netAPayer - retour.rendu),
  };
}
