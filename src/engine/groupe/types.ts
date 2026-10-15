import type { CashFlowItem, ProductCode } from "../types";

/**
 * LE NIVEAU 7 « GROUPE » : les types du moteur.
 *
 * Tout ce qui suit n'existe que dans une partie créée au niveau 7 : le bloc
 * `groupe` du snapshot, l'état de groupe de chaque entreprise, les décisions de
 * rachat, d'audit et de sous-traitance, le bloc `groupe` du résultat. Une
 * partie des niveaux 1 à 6 n'en porte aucun, et le moteur y suit son chemin
 * d'avant.
 */

/** Une tranche du barème du sous-traitant : son prix unitaire, jusqu'à `jusqua` unités commandées (absent : sans limite). */
export interface TrancheDeSousTraitance {
  jusqua?: number;
  prix: number;
}

export interface SousTraitanceDUneReference {
  /** Le barème, tranches croissantes : le sous-traitant facture la capacité qu'il mobilise. */
  tranches: TrancheDeSousTraitance[];
  /** Unités qu'il peut livrer au plus par tour. */
  plafond: number;
  /** Qualité produite des unités livrées (1 = la référence du marché, sans budget qualité). */
  qualite: number;
}

/** Une fourchette, dans laquelle l'état caché d'une cible est tiré. */
export interface Fourchette {
  min: number;
  max: number;
}

/**
 * UN SITE INDUSTRIEL À L'ARRÊT : une entreprise fermée depuis quelques années,
 * dont le liquidateur ou le propriétaire vend les murs et les machines. Ni
 * dettes, ni personnel, ni clients : un rachat d'actifs.
 */
export interface SiteFerme {
  id: string;
  nom: string;
  /** Ce que l'équipe en sait avant tout audit. */
  recit: string;
  /** Les lignes du site, par type de machine du scénario. */
  lignes: { typeCode: string; count: number }[];
  /** Le prix demandé (valeur liquidative), en euros. */
  prix: number;
  /** Part des lignes qui repartent, tirée dans cette fourchette (état caché). */
  remiseEnRoute: Fourchette;
  /** Coût de remise en état d'une ligne qui repart, tiré dans cette fourchette (état caché). */
  remiseEnEtatParLigne: Fourchette;
  /** Mise aux normes ou dépollution découverte au rachat (état caché) : sa probabilité, son coût. */
  passifEnvironnemental: { probabilite: number; montant: number };
  /** Tours entre le rachat et la mise en route de la première moitié des lignes ; l'autre suit au tour d'après. */
  delai: number;
  /** Usure des lignes remises en route (0 neuve, 1 en bout de vie). */
  usure: number;
  /** Charges du site par tour, dès le rachat : gardiennage, taxe foncière, entretien du bâtiment. */
  chargesParTour: number;
  /** Ce que coûte l'audit, payé le tour où il est fait. */
  coutDeLAudit: number;
}

/** L'état réel d'un site, tiré sur son flux propre : ce que l'audit révèle, ce que le rachat découvre. */
export interface EtatDuSite {
  /** Les lignes qui repartent, par type. */
  lignes: { typeCode: string; count: number }[];
  lignesRemisesEnRoute: number;
  lignesPerdues: number;
  remiseEnEtat: number;
  passifEnvironnemental: number;
}

export interface ConfigDeGroupe {
  valorisation: {
    /** Valeur d'entreprise = multiple × EBE des douze derniers mois. */
    multipleEBE: number;
    /** Actions en circulation au départ. */
    actionsInitiales: number;
  };
  /** Racheter une cible (absent : levier fermé). */
  rachat?: {
    /** Frais de transaction, part du prix. */
    fraisDeTransaction: number;
    /** Décote consentie aux investisseurs entrants d'un rachat. */
    decoteDEmission: number;
    /** Part minimale des actions d'origine après émissions (le contrôle). */
    seuilDeControle: number;
    tourMin: number;
  };
  /** Les sites à l'arrêt à vendre. */
  sites?: SiteFerme[];
  /** Sous-traitance par référence (absent : levier fermé ; une référence absente ne se sous-traite pas). */
  sousTraitance?: Record<ProductCode, SousTraitanceDUneReference>;
}

/** Un site racheté, gardé dans l'état de l'acquéreur. */
export interface SiteAcquis {
  id: string;
  nom: string;
  tour: number;
  prix: number;
  etat: EtatDuSite;
  /** Valeur inscrite à l'actif : prix et remise en état, dépréciation déduite. */
  valeurInscrite: number;
  depreciation: number;
  chargesParTour: number;
  /** Les lignes pas encore en service : elles rejoignent le parc au tour dit. */
  enAttente: { typeCode: string; count: number; tour: number; valeur: number }[];
}

export interface EtatDeGroupe {
  actions: number;
  valeurInitialeParAction: number;
  /** EBE de référence par tour : amorce de la fenêtre tant que l'historique est court. */
  ebeReference: number;
  /** EBE par tour, le plus récent en dernier. */
  ebe: number[];
  /** Charges discrétionnaires par tour (marketing, qualité, entretien, RSE, R&D). */
  discretionnaires: number[];
  dividendesParAction: number;
  sites: SiteAcquis[];
  /** Les cibles auditées (`type:id`). */
  diligences: string[];
}

export type TypeDeCible = "site_ferme";

export interface CibleDeRachat {
  type: TypeDeCible;
  id: string;
}

export interface DecisionDeRachat {
  cible: CibleDeRachat;
  /** Au-delà de ce prix, l'équipe renonce. */
  prixMaximum: number;
  paiement: "numeraire" | "titres";
  /** Emprunt d'acquisition (paiement en numéraire). */
  emprunt?: number;
  /** Augmentation de capital souscrite par des investisseurs entrants (paiement en numéraire). */
  augmentationDeCapital?: number;
}

/**
 * L'émission d'actions d'un tour (augmentation de capital des associés,
 * investisseurs entrants d'un rachat). Le prix est la valeur de clôture du tour
 * HORS apport : (valeur des capitaux propres − apports) / actions d'avant.
 */
export interface EmissionDuTour {
  /** Apports reçus dans le tour (associés et investisseurs). */
  apport: number;
  prixParAction: number;
  actionsEmises: number;
}

/** La valeur de l'entreprise à la clôture d'un tour. */
export interface ValeurDeLEntreprise {
  ebeDouzeMois: number;
  /** Multiple × EBE des douze derniers mois. */
  valeurDeRendement: number;
  /** La plus haute de la valeur de rendement et de l'actif économique. */
  valeurEntreprise: number;
  detteNette: number;
  valeurCapitauxPropres: number;
  /** Actions après l'émission du tour, s'il y en a une. */
  actions: number;
  /** Valeur des capitaux propres / actions. */
  valeurParAction: number;
  /** L'émission du tour : apports en numéraire, prix par action, actions créées. */
  emission?: EmissionDuTour;
  /** Rentabilité totale par action depuis le départ : (valeur + dividendes reçus) / valeur initiale − 1. */
  rentabiliteTotale: number;
  dividendesParAction: number;
  actifEconomique: number;
}

export interface ResultatDuRachat {
  statut: "conclu" | "refuse";
  motif?: string;
  cible: CibleDeRachat;
  nom: string;
  prix?: number;
  paiement?: "numeraire" | "titres";
  financement?: { numeraire: number; emprunt: number; augmentation: number; titres: number; actionsEmises: number };
  frais?: number;
  /** Site : ce que le rachat a découvert, la valeur inscrite, la dépréciation, la mise en route. */
  site?: {
    etat: EtatDuSite;
    valeurInscrite: number;
    depreciation: number;
    miseEnRoute: { tour: number; lignes: number }[];
  };
}

/** Ce que les opérations de groupe du jour 1 font au tour d'une entreprise, au-delà de son bilan d'ouverture. */
export interface OperationDOuverture {
  /** Lignes du tableau de flux, avant celles du tour. */
  flux: CashFlowItem[];
  /** Charges du tour hors EBE : frais de transaction, audit, passif environnemental. */
  chargesDeRachat: number;
  /** Dépréciation d'un actif racheté au-dessus de sa valeur recouvrable, avec les amortissements du tour. */
  depreciation: number;
}

export interface ResultatDeGroupe {
  valeur?: ValeurDeLEntreprise;
  rachat?: ResultatDuRachat;
  /** L'audit fait ce tour : l'état réel révélé. */
  diligence?: { cible: CibleDeRachat; nom: string; cout: number; etat: EtatDuSite };
  sousTraitance?: { parReference: Record<ProductCode, { unites: number; cout: number }>; unites: number; cout: number };
  /** Marge sur coût variable / résultat d'exploitation (absent si ce dernier n'est pas positif). */
  levierOperationnel?: number;
  /** Les charges des sites rachetés, comprises dans les charges fixes du tour. */
  chargesDesSites?: number;
}
