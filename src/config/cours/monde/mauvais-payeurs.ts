import { auCentime } from "./amortissement";
import {
  AFFAIRE_AUX_CONDITIONS,
  CLIENTELES_DU_BATIMENT,
  DELAI_MAXIMAL_CONVENU,
  INDEMNITE_FORFAITAIRE_DE_RECOUVREMENT,
  JOURS_DE_L_ANNEE_CIVILE,
  MAJORATION_DU_TAUX_BCE,
  TAUX_DE_REFINANCEMENT_BCE,
  TAUX_DU_DECOUVERT,
  TAUX_NORMAL_DE_TVA,
} from "./delais-et-tva";
import { coutDeLAvance } from "./facture";
import { CLIENTELES as CLIENTELES_DE_LA_BOUTIQUE, GAMME } from "./maille-et-co";
import { DELAI_CONVENU_DE_CAMPUSTECH, PRIX_DE_L_ENCEINTE, RETARD_DE_CAMPUSTECH, VENTES_A_CAMPUSTECH } from "./nova-gestion";

/**
 * LE MONDE DU COURS : LES MAUVAIS PAYEURS ET LE RISQUE CLIENT.
 *
 * Décision du propriétaire (octobre 2026) : le délai convenu entre professionnels est plafonné à
 * 60 jours (code de commerce, article L. 441-10), mais des clients paient en retard : c'est la
 * réalité du marché. Le monde du cours a donc ses mauvais payeurs.
 *   - CHEZ NOVA, UN FAIT DE LA FICHE : CampusTech paie chaque facture 20 jours après les 60 jours
 *     convenus (RETARD_DE_CAMPUSTECH, nova-gestion.ts). Tous les chiffres de NOVA l'encaissent au
 *     80e jour.
 *   - DANS LES AUTRES ENTREPRISES, DES HYPOTHÈSES NOMMÉES, qui ne changent aucun chiffre de base :
 *     un client de MARTEL & FILS, un d'ATLAS CONSEIL, un comité d'entreprise de MAILLE & CO.
 *   - LE RISQUE CLIENT, DU RETARD À LA PERTE : un retard se relance et ouvre des pénalités, mais la
 *     créance d'un client solvable reste au compte 411, sans dépréciation. Un client en procédure
 *     collective rend la créance douteuse : elle passe au compte 416 et se déprécie sur son montant
 *     hors taxes (491, par une dotation au 6817). Chez NOVA, c'est Sonora (exercice-de-nova.ts et
 *     cloture.ts) ; chez MARTEL & FILS, une hypothèse de ce fichier.
 *
 * Toutes les attentes se comptent en jours, en mois de 30 jours ; le coût d'une attente sur 360 jours
 * (l'année commerciale), les pénalités sur 365 (l'année civile, comme la loi les compte).
 */

// ─────────────────────────────────────────────────────────────────────────────
// LES RELANCES
// ─────────────────────────────────────────────────────────────────────────────

/**
 * LES RELANCES (hypothèse du cours, une procédure de recouvrement courante) : une relance amiable,
 * par courriel et téléphone, 8 jours après l'échéance ; puis une mise en demeure, par lettre
 * recommandée, 15 jours après l'échéance. La mise en demeure n'est pas nécessaire pour que les
 * pénalités courent (elles sont dues de plein droit dès le lendemain de l'échéance), mais elle prépare
 * une injonction de payer.
 */
export const RELANCES = { relanceAmiable: 8, miseEnDemeure: 15 } as const;

// ─────────────────────────────────────────────────────────────────────────────
// LES MAUVAIS PAYEURS
// ─────────────────────────────────────────────────────────────────────────────

/** Le moment où la TVA d'une facture devient due : à la livraison (des biens) ou à l'encaissement (des services, sans option). */
export type ExigibiliteDeLaTva = "livraison" | "encaissement";

export interface MauvaisPayeur {
  /** Le code de l'entreprise du cours qui attend son argent. */
  entreprise: "nova" | "batiment" | "conseil" | "boutique";
  client: string;
  /** Ce que la facture vend, en quelques mots. */
  objet: string;
  /** Le montant de la facture, hors taxes. */
  ht: number;
  tauxDeTva: number;
  exigibilite: ExigibiliteDeLaTva;
  /** Le délai convenu, en jours après la facture : jamais au-delà du plafond légal. */
  delaiConvenu: number;
  /** Les jours de retard après l'échéance convenue. */
  retard: number;
  /** Le taux auquel l'entreprise finance l'attente : celui de son découvert. */
  tauxDeFinancement: number;
  /** Un fait de la fiche (CampusTech) ou une hypothèse du cours qui ne change aucun chiffre de base. */
  statut: "fait-de-la-fiche" | "hypothese";
}

/** CAMPUSTECH, LE MAUVAIS PAYEUR DE NOVA (le fait de la fiche) : une facture mensuelle, 320 enceintes à 59 € HT. */
export const CAMPUSTECH_MAUVAIS_PAYEUR: MauvaisPayeur = {
  entreprise: "nova",
  client: "CampusTech",
  objet: `${VENTES_A_CAMPUSTECH[0]} enceintes NOVA One`,
  ht: VENTES_A_CAMPUSTECH[0]! * PRIX_DE_L_ENCEINTE,
  tauxDeTva: TAUX_NORMAL_DE_TVA,
  exigibilite: "livraison",
  delaiConvenu: DELAI_CONVENU_DE_CAMPUSTECH,
  retard: RETARD_DE_CAMPUSTECH,
  tauxDeFinancement: TAUX_DU_DECOUVERT,
  statut: "fait-de-la-fiche",
};

/**
 * LE RETARD DE LOGISTIQUE VARENNE (hypothèse du cours, MARTEL & FILS) : un client de la clientèle
 * « entreprises », qui fait refaire un entrepôt. Sa facture de travaux, 36 000 € HT (un multiple de
 * 3 000 €, comme les ventes de la fiche), est convenue à 60 jours ; Varenne la paie 45 jours en retard,
 * le temps d'encaisser elle-même ses clients. MARTEL & FILS vend des travaux : sa TVA n'est due qu'à
 * l'encaissement. Le retard décale d'autant la TVA à reverser ; l'entreprise finance le hors taxes.
 */
export const RETARD_DE_LOGISTIQUE_VARENNE = 45;

export const LOGISTIQUE_VARENNE: MauvaisPayeur = {
  entreprise: "batiment",
  client: "Logistique Varenne",
  objet: "la rénovation d'un entrepôt",
  ht: 36_000,
  tauxDeTva: TAUX_NORMAL_DE_TVA,
  exigibilite: "encaissement",
  delaiConvenu: CLIENTELES_DU_BATIMENT.find((g) => g.code === "entreprises")!.delai,
  retard: RETARD_DE_LOGISTIQUE_VARENNE,
  tauxDeFinancement: TAUX_DU_DECOUVERT,
  statut: "hypothese",
};

/**
 * LE RETARD DE KERVAL DISTRIBUTION (hypothèse du cours, ATLAS CONSEIL) : l'affaire aux conditions
 * (delais-et-tva.ts), 40 journées à 800 € HT moins 5 % de remise, convenue à 60 jours. Kerval ne prend
 * pas l'escompte et paie 30 jours en retard : son service comptable ne règle qu'une fois par mois. Des
 * services : la TVA n'est due qu'à l'encaissement ; ATLAS CONSEIL finance le net commercial hors taxes.
 */
export const RETARD_DE_KERVAL = 30;

export const KERVAL_DISTRIBUTION: MauvaisPayeur = {
  entreprise: "conseil",
  client: AFFAIRE_AUX_CONDITIONS.client,
  objet: `${AFFAIRE_AUX_CONDITIONS.journees} journées de formation`,
  ht: auCentime(AFFAIRE_AUX_CONDITIONS.journees * AFFAIRE_AUX_CONDITIONS.prixHT * (1 - AFFAIRE_AUX_CONDITIONS.remise)),
  tauxDeTva: AFFAIRE_AUX_CONDITIONS.tauxDeTva,
  exigibilite: "encaissement",
  delaiConvenu: AFFAIRE_AUX_CONDITIONS.delai,
  retard: RETARD_DE_KERVAL,
  tauxDeFinancement: AFFAIRE_AUX_CONDITIONS.tauxDeFinancement,
  statut: "hypothese",
};

/** Le chiffre d'affaires hors taxes des comités d'entreprise en janvier, référence par référence. */
const COMITES = CLIENTELES_DE_LA_BOUTIQUE.find((g) => g.code === "comites")!;
const VENTES_DES_COMITES_HT = GAMME.reduce((t, r) => t + COMITES.achats[r.code] * r.prixHt, 0);

/**
 * LE RETARD DU CSE DES LABORATOIRES VERNAL (hypothèse du cours, MAILLE & CO) : l'un des huit comités
 * d'entreprise (aujourd'hui, les comités sociaux et économiques) qui commandent en boutique, une
 * commande moyenne de janvier (le chiffre d'affaires des comités ÷ 8). Convenue à 45 jours, elle est
 * payée 30 jours en retard : le trésorier du comité ne signe les virements qu'à la réunion du mois.
 * Des biens : la TVA est due à la livraison, MAILLE & CO finance la commande toutes taxes comprises,
 * au taux du découvert du cours (la fiche de la boutique n'en a pas). Une petite facture : l'indemnité
 * de 40 € y pèse plus que les pénalités.
 */
export const RETARD_DU_CSE_VERNAL = 30;

export const CSE_DES_LABORATOIRES_VERNAL: MauvaisPayeur = {
  entreprise: "boutique",
  client: "le CSE des Laboratoires Vernal",
  objet: "une commande de pulls, d'écharpes et de bonnets",
  ht: auCentime(VENTES_DES_COMITES_HT / COMITES.tickets),
  tauxDeTva: TAUX_NORMAL_DE_TVA,
  exigibilite: "livraison",
  delaiConvenu: COMITES.delaiDeReglement,
  retard: RETARD_DU_CSE_VERNAL,
  tauxDeFinancement: TAUX_DU_DECOUVERT,
  statut: "hypothese",
};

/** Les mauvais payeurs du monde du cours, entreprise par entreprise. */
export const MAUVAIS_PAYEURS: readonly MauvaisPayeur[] = [CAMPUSTECH_MAUVAIS_PAYEUR, LOGISTIQUE_VARENNE, KERVAL_DISTRIBUTION, CSE_DES_LABORATOIRES_VERNAL];

/** Le taux annuel des pénalités de retard du cours : le taux de la BCE majoré de 10 points. */
export const TAUX_DES_PENALITES = TAUX_DE_REFINANCEMENT_BCE.taux + MAJORATION_DU_TAUX_BCE;

/**
 * Le retard d'un mauvais payeur, facture par facture.
 *   - Les dates, en jours après la facture : l'échéance convenue, la relance amiable, la mise en
 *     demeure (si le retard les atteint), le paiement réel.
 *   - Ce que l'entreprise finance pendant le retard : le TTC si la TVA est due à la livraison (elle l'a
 *     déjà reversée), le HT si elle n'est due qu'à l'encaissement (elle ne la reverse qu'une fois
 *     payée). Le coût du retard = ce montant × taux du découvert × jours de retard ÷ 360.
 *   - Ce qu'elle peut réclamer : les pénalités, TTC × taux des pénalités × jours de retard ÷ 365, et
 *     l'indemnité forfaitaire de 40 €.
 *   - Au bilan : un retard seul ne rend pas la créance douteuse. Le client est solvable, la créance
 *     reste au 411, sans dépréciation.
 */
export function suivreUnMauvaisPayeur(m: MauvaisPayeur) {
  const tva = auCentime(m.ht * m.tauxDeTva);
  const ttc = auCentime(m.ht + tva);
  const echeance = m.delaiConvenu;
  const paiement = m.delaiConvenu + m.retard;
  const finance = m.exigibilite === "livraison" ? ttc : m.ht;
  const penalites = auCentime((ttc * TAUX_DES_PENALITES * m.retard) / JOURS_DE_L_ANNEE_CIVILE);
  const indemnite = m.retard > 0 ? INDEMNITE_FORFAITAIRE_DE_RECOUVREMENT : 0;
  return {
    ...m,
    tva,
    ttc,
    echeance,
    paiement,
    delaiConvenuPermis: m.delaiConvenu <= DELAI_MAXIMAL_CONVENU.joursDeLaFacture,
    relanceAmiable: m.retard >= RELANCES.relanceAmiable ? echeance + RELANCES.relanceAmiable : null,
    miseEnDemeure: m.retard >= RELANCES.miseEnDemeure ? echeance + RELANCES.miseEnDemeure : null,
    finance,
    tvaAvanceeALEtat: m.exigibilite === "livraison" ? tva : 0,
    coutDuRetard: coutDeLAvance(finance, m.tauxDeFinancement, m.retard),
    penalites,
    indemnite,
    reclamable: auCentime(penalites + indemnite),
    compte: "411" as const,
    depreciation: 0,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// LE CLIENT DÉFAILLANT
// ─────────────────────────────────────────────────────────────────────────────

/**
 * AGENCEMENTS DORIAC, LE CLIENT DÉFAILLANT DE MARTEL & FILS (hypothèse du cours) : un client de la
 * clientèle « entreprises », qui doit une facture de travaux de 24 000 € HT, échue et impayée malgré
 * la mise en demeure. Le tribunal ouvre contre lui une procédure de redressement judiciaire ; MARTEL &
 * FILS déclare sa créance au mandataire, qui laisse craindre une perte de la moitié.
 */
export const AGENCEMENTS_DORIAC = {
  entreprise: "batiment" as const,
  client: "Agencements Doriac",
  ht: 24_000,
  tauxDeTva: TAUX_NORMAL_DE_TVA,
  exigibilite: "encaissement" as ExigibiliteDeLaTva,
  /** La part de la créance que le mandataire laisse craindre de perdre (hypothèse du cours). */
  tauxDePerteProbable: 0.5,
};

/**
 * Le client défaillant à l'inventaire, puis le jour où la perte devient définitive.
 *   - À L'INVENTAIRE : la créance entière, TVA comprise, passe du 411 au 416 (clients douteux) ; la
 *     dépréciation se calcule sur le HORS TAXES (la TVA n'est pas une perte : elle se régularise si la
 *     créance devient irrécouvrable) : dotation au 6817, au crédit du 491.
 *   - À L'IRRÉCOUVRABILITÉ (la clôture de la procédure) : la part perdue passe en perte (654, hors
 *     taxes) et la TVA de cette part se régularise. Si la TVA était due à la livraison, l'entreprise
 *     l'avait reversée : elle la récupère alors, pas avant. Si elle n'était due qu'à l'encaissement,
 *     l'entreprise ne l'a jamais reversée : la TVA en attente s'annule, rien n'est à récupérer.
 */
export function clientDefaillant(d: typeof AGENCEMENTS_DORIAC, tauxDePerteDefinitif: number = d.tauxDePerteProbable) {
  const tva = auCentime(d.ht * d.tauxDeTva);
  const ttc = auCentime(d.ht + tva);
  const depreciation = auCentime(d.ht * d.tauxDePerteProbable);
  const perteHT = auCentime(d.ht * tauxDePerteDefinitif);
  const tvaDeLaPerte = auCentime(tva * tauxDePerteDefinitif);
  return {
    tva,
    ttc,
    reclassement: { debit: "416", credit: "411", montant: ttc },
    depreciation: { debit: "6817", credit: "491", montant: depreciation },
    valeurNetteAuBilan: auCentime(ttc - depreciation),
    tvaDejaReverseeALEtat: d.exigibilite === "livraison" ? tva : 0,
    irrecouvrable: {
      perteHT,
      tvaDeLaPerte,
      tvaARecupererDeLEtat: d.exigibilite === "livraison" ? tvaDeLaPerte : 0,
      tvaEnAttenteAnnulee: d.exigibilite === "encaissement" ? tvaDeLaPerte : 0,
      repriseDeLaDepreciation: depreciation,
    },
  };
}
