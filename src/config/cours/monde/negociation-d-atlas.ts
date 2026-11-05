import { COMPTES, CONSULTANTS, PRIX_CATALOGUE } from "./atlas-conseil";
import { DELAI_MAXIMAL_CONVENU, INDEMNITE_FORFAITAIRE_DE_RECOUVREMENT, JOURS_DE_L_ANNEE_CIVILE, MULTIPLE_DU_TAUX_LEGAL, TAUX_D_INTERET_LEGAL } from "./delais-et-tva";
import { KERVAL_DISTRIBUTION, TAUX_DES_PENALITES, suivreUnMauvaisPayeur } from "./mauvais-payeurs";

/**
 * LE MONDE DU COURS : CE QUE LA NÉGOCIATION D'ATLAS CONSEIL A AUTOUR DU PRIX (le parcours BTS NDRC,
 * bloc 1 : la négociation-vente, B to B et B to G, et le cadre juridique du contrat de vente).
 *
 * Trois compléments des chapitres « Négocier le prix » et « Remises et conditions », sur la même fiche
 * (monde/atlas-conseil.ts) :
 *   · L'ENTRETIEN AVEC LE GROUPE ORVANE : le centre d'achat de l'affaire (qui décide, qui prescrit, qui
 *     achète, qui utilise, et ce que chacun attend), et l'objection de l'acheteur ;
 *   · L'APPEL D'OFFRES DU CENTRE HOSPITALIER DE VALBRUNE : le marché que le cabinet tient à 560 € la
 *     journée (280 journées en N, sur des sites lointains : 290 € de frais par journée) se renouvelle ;
 *     la note pondérée du prix et de la valeur technique, le prix le plus haut qui gagne encore, et la
 *     marge à ce prix ;
 *   · LE CADRE JURIDIQUE DES CONDITIONS DE VENTE : ce que les conditions générales de vente du cabinet
 *     écrivent des pénalités de retard, ce que change ce choix sur le retard de Kerval Distribution
 *     (monde/mauvais-payeurs.ts), et le délai que Kerval voudrait.
 *
 * Les valeurs légales sont celles de monde/delais-et-tva.ts (le délai maximal convenu, le taux
 * d'intérêt légal, l'indemnité forfaitaire), que ce module ne fait que lire. Tout est hors taxes, sauf
 * la facture de Kerval (les pénalités se comptent sur le TTC).
 */

// ─────────────────────────────────────────────────────────────────────────────
// L'ENTRETIEN AVEC LE GROUPE ORVANE
// ─────────────────────────────────────────────────────────────────────────────

export type RoleDansLeCentreDAchat = "decideur" | "prescripteur" | "acheteur" | "utilisateur";

export interface MembreDuCentreDAchat {
  role: RoleDansLeCentreDAchat;
  /** Le rôle, pour les textes. */
  libelle: string;
  /** Qui le tient chez Orvane (une fonction, jamais une personne réelle). */
  qui: string;
  /** Ce qu'il attend de l'affaire : sa motivation. */
  attente: string;
}

/**
 * LE CENTRE D'ACHAT DU GROUPE ORVANE (hypothèse du cours). Quatre rôles pèsent sur l'affaire des
 * 30 journées : le directeur général décide, sur le budget ; la directrice des ressources humaines
 * prescrit, et veut ses managers formés avant la réorganisation de septembre ; l'acheteur du groupe
 * négocie, et il est évalué sur la remise qu'il obtient ; les managers suivront la formation.
 */
export const CENTRE_D_ACHAT_D_ORVANE: readonly MembreDuCentreDAchat[] = [
  { role: "decideur", libelle: "Décideur", qui: "le directeur général", attente: "un budget de formation tenu" },
  { role: "prescripteur", libelle: "Prescripteur", qui: "la directrice des ressources humaines", attente: "des managers formés avant la réorganisation de septembre" },
  { role: "acheteur", libelle: "Acheteur", qui: "l'acheteur du groupe", attente: "une remise, sur laquelle il est évalué" },
  { role: "utilisateur", libelle: "Utilisateurs", qui: "les managers", attente: "une formation qui serve, sans y perdre leurs journées" },
];

/** L'OBJECTION DE L'ACHETEUR (hypothèse du cours), telle qu'il la dit au commercial. */
export const OBJECTION_DE_L_ACHETEUR = "20 % sur les 30 journées, ou nous signons avec votre concurrent.";

/** LA DURÉE DE VALIDITÉ DE LA PROPOSITION ÉCRITE (hypothèse du cours) : 30 jours. */
export const VALIDITE_DE_LA_PROPOSITION_EN_JOURS = 30;

// ─────────────────────────────────────────────────────────────────────────────
// L'APPEL D'OFFRES DE VALBRUNE
// ─────────────────────────────────────────────────────────────────────────────

export interface OffreConcurrente {
  code: string;
  nom: string;
  /** Le prix d'une journée remis dans l'offre, hors taxes. */
  prix: number;
  /** La note de la valeur technique (le mémoire technique), sur 20, que la commission d'appel d'offres lui donnerait. */
  noteTechnique: number;
}

/**
 * L'APPEL D'OFFRES DU CENTRE HOSPITALIER DE VALBRUNE (hypothèse du cours). Le marché de formation que
 * le cabinet tient (280 journées en N, à 560 €, sur des sites lointains) se renouvelle pour quatre ans,
 * au-dessus des seuils européens : une procédure formalisée, l'appel d'offres, où l'offre remise ne se
 * négocie plus. Le règlement de la consultation pondère la valeur technique à 60 % et le prix à 40 % ;
 * la note du prix est proportionnelle : 20 × prix le plus bas ÷ prix du candidat. Deux concurrents
 * répondent : Alpha Formation, moins cher et moins bien noté, et Bêta Conseil, plus cher et mieux noté.
 * Le mémoire technique d'ATLAS CONSEIL vaudrait 16 sur 20 ; le cabinet ne remettra pas moins de 500 €,
 * le prix le plus bas de la consultation.
 */
export const APPEL_D_OFFRES_DE_VALBRUNE = {
  compte: "valbrune",
  ponderation: { technique: 0.6, prix: 0.4 },
  noteMaximale: 20,
  noteTechniqueDAtlas: 16,
  concurrents: [
    { code: "alpha", nom: "Alpha Formation", prix: 500, noteTechnique: 12 },
    { code: "beta", nom: "Bêta Conseil", prix: 640, noteTechnique: 17 },
  ] as readonly OffreConcurrente[],
  /** Les années du marché renouvelé. */
  dureeEnAnnees: 4,
} as const;

/**
 * LE PRIX QUE LE CABINET ENVISAGE DE REMETTRE (hypothèse du cours) : 580 €, la dizaine d'euros sous le
 * prix le plus haut qui gagne encore. Un appel d'offres ne laisse pas de second tour : on garde une
 * marge de sécurité sous la limite, au cas où un concurrent noterait mieux qu'on ne le croit.
 */
export const PRIX_ENVISAGE_POUR_VALBRUNE = 580;

const auCentime = (x: number) => Math.round(x * 100) / 100 + 0;
const plancher = (x: number) => Math.floor(x + 1e-9);

/** Le compte de Valbrune dans le portefeuille de N : ses journées, son prix, ses frais par journée. */
export function compteDeValbrune() {
  const c = COMPTES.find((k) => k.code === APPEL_D_OFFRES_DE_VALBRUNE.compte)!;
  return { ...c, prix: c.chiffreDAffaires / c.journees, fraisParJournee: c.frais / c.journees };
}

/** La note pondérée d'une offre : technique × 60 % + note du prix × 40 %, la note du prix étant 20 × prix le plus bas ÷ prix. */
export function noteDUneOffre(prix: number, noteTechnique: number, prixLePlusBas: number) {
  const a = APPEL_D_OFFRES_DE_VALBRUNE;
  const noteDuPrix = (a.noteMaximale * prixLePlusBas) / prix;
  return { prix, noteTechnique, noteDuPrix, note: a.ponderation.technique * noteTechnique + a.ponderation.prix * noteDuPrix };
}

/**
 * L'APPEL D'OFFRES À UN PRIX D'ATLAS CONSEIL (au moins le prix le plus bas des concurrents). Les notes de
 * chaque offre ; le meilleur concurrent ; si le cabinet gagne ; le prix le plus haut qui gagne encore, à
 * l'euro inférieur (sa note doit dépasser celle du meilleur concurrent) ; la marge sur coûts directs d'une
 * journée (prix − frais du compte − coût journalier d'un consultant) et celle du marché sur une année.
 */
export function appelDOffres(prixDAtlas: number) {
  const a = APPEL_D_OFFRES_DE_VALBRUNE;
  const v = compteDeValbrune();
  const prixLePlusBas = Math.min(prixDAtlas, ...a.concurrents.map((k) => k.prix));
  const atlas = noteDUneOffre(prixDAtlas, a.noteTechniqueDAtlas, prixLePlusBas);
  const concurrents = a.concurrents.map((k) => ({ ...k, ...noteDUneOffre(k.prix, k.noteTechnique, prixLePlusBas) }));
  const meilleur = concurrents.reduce((x, y) => (y.note > x.note ? y : x));
  // Le prix limite, le plus bas des concurrents restant le plus bas : technique × 60 % + 40 % × 20 × bas ÷ p > note du meilleur.
  const basDesConcurrents = Math.min(...a.concurrents.map((k) => k.prix));
  const meilleurAuPrixBas = Math.max(...a.concurrents.map((k) => noteDUneOffre(k.prix, k.noteTechnique, basDesConcurrents).note));
  const prixLimite = (a.ponderation.prix * a.noteMaximale * basDesConcurrents) / (meilleurAuPrixBas - a.ponderation.technique * a.noteTechniqueDAtlas);
  const coutDUnConsultant = CONSULTANTS.coutAnnuel / (CONSULTANTS.joursFacturablesParTrimestre * 4);
  const margeParJournee = auCentime(prixDAtlas - v.fraisParJournee - coutDUnConsultant);
  return {
    prixDAtlas,
    prixLePlusBas,
    atlas,
    concurrents,
    meilleur,
    gagne: atlas.note > meilleur.note + 1e-12,
    prixLimite,
    /** Le prix le plus haut, à l'euro, qui gagne encore. */
    prixLePlusHautQuiGagne: Math.ceil(prixLimite - 1e-9) - 1,
    journees: v.journees,
    fraisParJournee: v.fraisParJournee,
    coutDUnConsultant,
    margeParJournee,
    margeDuMarche: auCentime(margeParJournee * v.journees),
    /** L'écart au prix catalogue : la remise que le marché public représente. */
    remiseSurLeCatalogue: 1 - prixDAtlas / PRIX_CATALOGUE,
  };
}

/** Le prix le plus haut qui gagne, sans dépendre d'un prix d'ATLAS : celui de l'appel d'offres au prix le plus bas. */
export const prixLePlusHautQuiGagneValbrune = () => appelDOffres(Math.min(...APPEL_D_OFFRES_DE_VALBRUNE.concurrents.map((k) => k.prix))).prixLePlusHautQuiGagne;

// ─────────────────────────────────────────────────────────────────────────────
// LE CADRE JURIDIQUE DES CONDITIONS DE VENTE
// ─────────────────────────────────────────────────────────────────────────────

/**
 * CE QUE KERVAL DISTRIBUTION DEMANDE POUR SA PROCHAINE COMMANDE (hypothèse du cours) : payer à 90 jours
 * date de facture, et renoncer en échange à sa remise de 5 %.
 */
export const DEMANDE_DE_KERVAL = { delai: 90 } as const;

/**
 * LES DEUX CLAUSES DE PÉNALITÉS QUE LE CABINET PEUT ÉCRIRE DANS SES CONDITIONS GÉNÉRALES DE VENTE : le
 * taux de la BCE majoré de 10 points (celui qui s'applique aussi quand les conditions ne fixent rien,
 * celui du cours, TAUX_DES_PENALITES), ou le plancher légal, 3 fois le taux d'intérêt légal. Les
 * conditions générales de vente doivent mentionner le taux retenu et l'indemnité forfaitaire de 40 €
 * (code de commerce, article L. 441-10).
 */
export const PLANCHER_DES_PENALITES = MULTIPLE_DU_TAUX_LEGAL * TAUX_D_INTERET_LEGAL.professionnels;

/**
 * LE RETARD DE KERVAL SOUS LES DEUX CLAUSES : la facture TTC, les jours de retard, les pénalités au taux
 * de la BCE majoré et au plancher légal (TTC × taux × jours ÷ 365), l'écart, et ce que le retard coûte au
 * cabinet sur son découvert ; puis si la demande de Kerval tiendrait (le délai convenu ne peut pas
 * dépasser 60 jours date de facture).
 */
export function penalitesSelonLesConditions() {
  const r = suivreUnMauvaisPayeur(KERVAL_DISTRIBUTION);
  const auPlancher = auCentime((r.ttc * PLANCHER_DES_PENALITES * r.retard) / JOURS_DE_L_ANNEE_CIVILE);
  return {
    client: r.client,
    ttc: r.ttc,
    retard: r.retard,
    tauxBce: TAUX_DES_PENALITES,
    tauxPlancher: PLANCHER_DES_PENALITES,
    auTauxBce: r.penalites,
    auPlancher,
    ecart: auCentime(r.penalites - auPlancher),
    indemnite: INDEMNITE_FORFAITAIRE_DE_RECOUVREMENT,
    coutDuRetard: r.coutDuRetard,
    delaiDemande: DEMANDE_DE_KERVAL.delai,
    delaiMaximal: DELAI_MAXIMAL_CONVENU.joursDeLaFacture,
    demandeLicite: DEMANDE_DE_KERVAL.delai <= DELAI_MAXIMAL_CONVENU.joursDeLaFacture,
    /** Les jours de crédit que Kerval demande au-delà du maximum légal. */
    joursDeTrop: Math.max(0, DEMANDE_DE_KERVAL.delai - DELAI_MAXIMAL_CONVENU.joursDeLaFacture),
    plancherEntier: plancher(PLANCHER_DES_PENALITES * 10_000) / 100,
  };
}

/**
 * L'ENTENTE PROPOSÉE (hypothèse du cours) : un cabinet concurrent propose à ATLAS CONSEIL de ne plus
 * descendre, ni l'un ni l'autre, sous 750 € la journée dans la région. Une entente sur les prix est
 * interdite (code de commerce, article L. 420-1) ; l'Autorité de la concurrence peut infliger une
 * sanction allant jusqu'à 10 % du chiffre d'affaires mondial (article L. 464-2).
 */
export const PRIX_DE_L_ENTENTE_PROPOSEE = 750;
export const SANCTION_MAXIMALE_D_UNE_ENTENTE = 0.1;
