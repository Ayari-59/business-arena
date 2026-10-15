import type { CashFlowItem, CompanyId, ProductCode } from "../types";

/**
 * LE NIVEAU 7 « GROUPE » : les types du moteur.
 *
 * Tout ce qui suit n'existe que dans une partie créée au niveau 7 : le bloc
 * `groupe` du snapshot, l'état de groupe de chaque entreprise, les décisions de
 * rachat et de sous-traitance, le bloc `groupe` du résultat. Une partie des
 * niveaux 1 à 6 n'en porte aucun, et le moteur y suit son chemin d'avant.
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

export interface ConfigDeGroupe {
  valorisation: {
    /** Valeur d'entreprise = multiple × EBE des douze derniers mois. */
    multipleEBE: number;
    /** Actions en circulation au départ. */
    actionsInitiales: number;
  };
  /** Racheter un concurrent simulé (absent : levier fermé, la classe par exemple). */
  rachat?: {
    primeDeControle: number;
    fraisDeTransaction: number;
    synergieDeStructure: number;
    /** Coût d'intégration, en années de synergies, payé au tour du rachat. */
    coutDIntegration: number;
    decoteDEmission: number;
    /** Part minimale des actions d'origine après émissions (le contrôle). */
    seuilDeControle: number;
    tourMin: number;
    /**
     * L'intégration d'une société rachetée ne se fait pas en un jour. Absente :
     * tout est repris tel quel.
     */
    integration?: {
      /** Part des lignes de la cible arrêtées le temps du tour du rachat (elles repartent ensuite si l'entretien suit). */
      lignesArretees: number;
      /** Part de l'effectif de la cible qui part au rachat. */
      departs: number;
      /** Part de la clientèle de la cible (sa part de marché passée) que l'acquéreur garde. */
      clienteleConservee: number;
    };
  };
  /** Sous-traitance par référence (absent : levier fermé ; une référence absente ne se sous-traite pas). */
  sousTraitance?: Record<ProductCode, SousTraitanceDUneReference>;
}

/** Un rachat conclu, gardé dans l'état de l'acquéreur. */
export interface RachatConclu {
  cible: CompanyId;
  nom: string;
  tour: number;
  prix: number;
  actifNet: number;
  ecart: number;
  paiement: "numeraire" | "titres";
  actionsEmises: number;
  /** Charges de structure reprises par tour, hors salaires de l'effectif inclus. */
  structure: number;
  /** Économie de structure par tour, dès le tour qui suit le rachat. */
  synergie: number;
  effectifInclus: number;
  effectifMax: number;
}

export interface EtatDeGroupe {
  actions: number;
  valeurInitialeParAction: number;
  /** EBE de référence par tour : amorce de la fenêtre tant que l'historique est court. */
  ebeReference: number;
  /** EBE par tour, pro forma des sociétés absorbées, le plus récent en dernier. */
  ebe: number[];
  /** Charges discrétionnaires par tour (marketing, qualité, entretien, RSE, R&D). */
  discretionnaires: number[];
  dividendesParAction: number;
  rachats: RachatConclu[];
}

export interface DecisionDeRachat {
  cible: CompanyId;
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

/** Les trois valeurs de référence d'une cible, et le prix que le vendeur en tire. */
export interface PrixDeCession {
  actifNet: number;
  valeurDeRendement: number;
  valeurAuRythme: number;
  prix: number;
}

export interface ResultatDuRachat {
  statut: "conclu" | "refuse";
  motif?: string;
  cible: CompanyId;
  nom: string;
  valeurs?: PrixDeCession;
  prix?: number;
  ecart?: number;
  paiement?: "numeraire" | "titres";
  financement?: { numeraire: number; emprunt: number; augmentation: number; titres: number; actionsEmises: number; parite?: number };
  frais?: number;
  integration?: number;
}

/** Ce que le rachat fait au tour de l'acquéreur, au-delà du bilan d'ouverture consolidé. */
export interface OperationDOuverture {
  /** Lignes du tableau de flux, avant celles du tour. */
  flux: CashFlowItem[];
  /** Frais de transaction et coût d'intégration, charge du tour hors EBE. */
  chargesDeRachat: number;
  /** Actions émises à l'ouverture (investisseurs, actionnaires de la cible). */
  actionsEmises: number;
}

export interface ResultatDeGroupe {
  valeur?: ValeurDeLEntreprise;
  rachat?: ResultatDuRachat;
  ecart?: { ouverture: number; depreciation: number; cloture: number; actifEconomique: number; valeurRecouvrable: number };
  sousTraitance?: { parReference: Record<ProductCode, { unites: number; cout: number }>; unites: number; cout: number };
  /** Marge sur coût variable / résultat d'exploitation (absent si ce dernier n'est pas positif). */
  levierOperationnel?: number;
  /** L'entreprise a été absorbée : elle ne joue plus. */
  absorbee?: { par: CompanyId; tour: number };
}
