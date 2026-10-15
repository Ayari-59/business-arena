import type { BalanceSheet, CashFlowItem, ProductCode } from "../types";

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

/**
 * UN FOURNISSEUR RACHETABLE : un modèle compact, pas une entreprise de la
 * partie. Son chiffre d'affaires est la somme des achats que lui font, tour
 * par tour, toutes les entreprises de la partie qui l'ont choisi ; sa marge
 * est ce qui reste après son coût variable et ses charges fixes.
 */
export interface FournisseurRachetable {
  /** Le code du fournisseur dans les catalogues du scénario. */
  code: string;
  nom: string;
  recit: string;
  /**
   * Ses clients hors partie : un chiffre d'affaires par tour au premier tour,
   * sa saison (un coefficient par tour, repris en boucle) et sa croissance par
   * tour. Il fonde sa valeur avant que l'équipe n'y passe ses achats.
   */
  clientsExterieurs: { chiffreDAffaires: number; saisonnalite: number[]; croissance: number };
  /** Part de son chiffre d'affaires qui paie ses propres achats et sa fabrication. */
  tauxDeCoutVariable: number;
  chargesFixesParTour: number;
  /** Ce qu'il peut livrer par tour, en euros d'achats de ses clients : au-delà, il rationne. */
  capacite: number;
  immobilisations: number;
  /** Durée d'amortissement de ses immobilisations, en tours (renouvelées au même rythme). */
  dureeDAmortissement: number;
  /** Besoin en fonds de roulement, en part du chiffre d'affaires du tour. */
  bfr: number;
  tresorerie: number;
  dette: number;
  tauxDInteretParTour: number;
}

/**
 * L'IMPORT, AU NIVEAU 7 : le fournisseur le moins cher à l'unité, mais au
 * bout d'une longue chaîne. Ses ruptures se tirent sur un flux propre, plus
 * fréquentes aux pics de la saison (ses délais ne suivent pas Noël), et son
 * prix est en devise : il suit un cours qui varie à chaque tour.
 */
export interface ImportDuGroupe {
  /** Le code du fournisseur import dans les catalogues du scénario. */
  code: string;
  /** Probabilité de rupture d'un tour ordinaire, et d'un tour de pic (saison du marché au moins `seuilDePic`). */
  rupture: { probabilite: number; probabiliteAuxPics: number; seuilDePic: number };
  /** Le cours de sa devise : écart-type de son logarithme par tour. */
  change: { devise: string; volatilite: number };
}

/**
 * UNE ENTREPRISE ÉTRANGÈRE À RACHETER : un modèle compact, hors euro. Ses
 * ventes locales ont leur saison et leur croissance, ses coûts sont locaux,
 * son cours varie à chaque tour sur un flux propre, un risque pays peut
 * amputer ses ventes d'un tour. Deux synergies, chacune un choix de
 * l'équipe : écouler des produits NOVA par son réseau (pris sur le stock de
 * l'équipe), faire fabriquer chez elle (des produits finis livrés en stock).
 */
export interface CibleEtrangere {
  id: string;
  nom: string;
  pays: string;
  devise: string;
  recit: string;
  /** Euros pour une unité de devise au départ ; écart-type du logarithme du cours par tour. */
  change: { coursInitial: number; volatilite: number };
  /** Ventes locales par tour au premier tour, leur saison (reprise en boucle) et leur croissance par tour. */
  ventes: { chiffreDAffaires: number; saisonnalite: number[]; croissance: number };
  tauxDeCoutVariable: number;
  chargesFixesParTour: number;
  immobilisations: number;
  dureeDAmortissement: number;
  bfr: number;
  tresorerie: number;
  dette: number;
  tauxDInteretParTour: number;
  tauxDImpot: number;
  /** Un tour sur `1/probabilite`, en moyenne, le pays ampute ses ventes de cette part. */
  risquePays?: { probabilite: number; perteDeVentes: number };
  /** Les parts qu'on peut en acheter (1 = 100 %). */
  parts: number[];
  /**
   * Son réseau : unités NOVA qu'il peut écouler par tour, prix local par
   * référence, coût de distribution local par unité, et frais fixes locaux de
   * chaque tour où l'équipe s'en sert (référencement, promotion).
   */
  reseau?: { capacite: number; prix: Record<ProductCode, number>; coutParUnite: number; coutFixeParTour: number };
  /**
   * Son usine : unités qu'elle peut fabriquer pour l'équipe par tour, coût
   * local par référence, qualité livrée, et frais fixes locaux de chaque tour
   * où l'équipe s'en sert (lancement de série, transport).
   */
  fabrication?: { capacite: number; cout: Record<ProductCode, number>; qualite: number; coutFixeParTour: number };
}

export interface ConfigDeGroupe {
  /**
   * La taille de départ : chaque entreprise démarre ce facteur fois plus
   * grande que celle du scénario (lignes, effectif, bilan), et la structure
   * du scénario qui suit la taille (charges fixes, effectif inclus et
   * plafond, entretien et qualité de référence, découvert) aussi. Absent : 1.
   */
  depart?: {
    facteur: number;
    /**
     * LE FONDS DE ROULEMENT DE DÉPART, en euros au trimestre : un apport des
     * associés en trésorerie, à la création. L'entreprise agrandie produit
     * deux fois plus pour une demande qui, hors saison, n'a pas bougé : elle
     * constitue du stock avant les pics et doit le financer. Sans lui, son
     * premier tour la mettait en crise de trésorerie. Absent : aucun apport.
     */
    apport?: number;
  };
  valorisation: {
    /** Valeur d'entreprise = multiple × EBE des douze derniers mois. */
    multipleEBE: number;
    /** Actions en circulation au départ. */
    actionsInitiales: number;
  };
  /** Racheter une cible (absent : levier fermé). */
  rachat?: {
    /** Prime de contrôle d'un rachat de titres (fournisseur), sur la valeur de la cible. */
    primeDeControle: number;
    /** Frais de transaction, part du prix. */
    fraisDeTransaction: number;
    /** Décote consentie aux investisseurs entrants d'un rachat. */
    decoteDEmission: number;
    /** Part minimale des actions d'origine après émissions (le contrôle). */
    seuilDeControle: number;
    tourMin: number;
    /**
     * Premier tour où une société peut se payer en actions (la fusion) : quand
     * la valeur de l'action, sur laquelle on émet, reflète des résultats réels.
     * Absent : dès `tourMin`.
     */
    tourMinTitres?: number;
  };
  /** Les sites à l'arrêt à vendre. */
  sites?: SiteFerme[];
  /** Les fournisseurs à vendre. */
  fournisseurs?: FournisseurRachetable[];
  /** Les entreprises étrangères à vendre. */
  etrangers?: CibleEtrangere[];
  /** Le fournisseur import, rendu risqué au niveau 7 (absent : le fournisseur du scénario, tel quel). */
  import?: ImportDuGroupe;
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

/**
 * Une filiale : une société rachetée par ses titres, consolidée par
 * intégration globale. Son modèle se recalcule de la graine et des achats
 * de la partie ; l'état ne garde que ce que le rachat a fixé.
 */
export interface Filiale {
  type: "fournisseur" | "etranger";
  id: string;
  nom: string;
  tour: number;
  /** Part détenue (1 = 100 %). */
  part: number;
  /** Prix payé : les titres de participation au bilan de l'acquéreur. */
  prixPaye: number;
  /** Écart d'acquisition d'origine : prix moins la part des capitaux propres acquis. */
  ecart: number;
  /** Dépréciations cumulées de l'écart. */
  depreciation: number;
  /** Capitaux propres de la filiale au rachat, dans sa devise. */
  capitauxPropresDAcquisition: number;
  /** Euros pour une unité de sa devise au rachat (1 en euros). */
  coursDAcquisition: number;
  /** Les concurrents simulés partis chez un autre fournisseur. */
  clientsPartis: string[];
  /** Les clients rationnés au dernier tour. */
  rationnes: string[];
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
  /** Les filiales, par ordre de rachat. */
  filiales: Filiale[];
  /** Achats de l'entreprise, par tour, à chaque fournisseur rachetable (le chiffre d'affaires de ce dernier). */
  achats: Record<string, number[]>;
  /** Marge interne d'une filiale fournisseur dans le stock de clôture : éliminée en consolidation. */
  margeEnStock?: number;
  /** Le bilan consolidé de la dernière clôture et la valeur des minoritaires : la valeur d'ouverture du tour suivant. */
  cloture?: { bilan: BalanceSheet; valeurDesMinoritaires: number };
}

export type TypeDeCible = "site_ferme" | "fournisseur" | "etranger";

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
  /** Entreprise étrangère : la part achetée, parmi celles qu'elle propose (absente : 100 %). */
  part?: number;
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

/** Les valeurs de référence d'une société à vendre, et le prix que le vendeur en tire. */
export interface PrixDeCession {
  actifNet: number;
  valeurDeRendement: number;
  prix: number;
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
  /** Société : ses valeurs de référence, l'écart d'acquisition. */
  valeurs?: PrixDeCession;
  ecart?: number;
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

/** Les comptes d'un tour d'une filiale, dans sa devise. */
export interface ComptesDUneFiliale {
  chiffreDAffaires: number;
  ebe: number;
  amortissement: number;
  interets: number;
  impot: number;
  resultat: number;
  immobilisations: number;
  bfr: number;
  tresorerie: number;
  dette: number;
  capitauxPropres: number;
}

/** Le groupe consolidé à la clôture d'un tour (intégration globale, en euros). */
export interface Consolidation {
  /** Le bilan consolidé : titres éliminés, filiales intégrées, écart d'acquisition net. */
  bilan: BalanceSheet;
  /** Part des capitaux propres des filiales qui revient aux autres actionnaires. */
  interetsMinoritaires: number;
  chiffreDAffaires: number;
  ebe: number;
  resultatNet: number;
  partDesMinoritaires: number;
  /** Ventes d'une filiale au groupe, éliminées ; marge interne restée en stock. */
  eliminations: { ventesInternes: number; margeEnStock: number };
  /**
   * Écart de conversion, part du groupe, dans les capitaux propres : ce que le
   * cours a fait aux capitaux propres d'une filiale étrangère depuis son
   * rachat (bilan au cours de clôture, résultats au cours moyen).
   */
  ecartDeConversion: number;
  filiales: {
    id: string;
    nom: string;
    part: number;
    comptes: ComptesDUneFiliale;
    /** Cours de clôture et cours moyen du tour (1 en euros). */
    cours: { cloture: number; moyen: number };
    valeur: number;
    ecart: number;
    depreciationDuTour: number;
  }[];
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
  /** Achats du tour à chaque fournisseur rachetable. */
  achats?: Record<string, number>;
  /** Les références rationnées par un fournisseur à capacité limitée : la part du plan servie. */
  rationnement?: Record<ProductCode, number>;
  /** Le groupe consolidé, dès qu'il y a une filiale. */
  consolide?: Consolidation;
  /** Les ventes par le réseau d'une filiale étrangère : demandées, livrées (du stock), chiffre d'affaires en euros. */
  reseau?: Record<ProductCode, { demande: number; livre: number; chiffreDAffaires: number }>;
  /** Ce qu'une filiale étrangère a fabriqué pour l'équipe : unités et coût en euros, par référence. */
  fabrication?: Record<ProductCode, { unites: number; cout: number }>;
  /** Les frais fixes des synergies étrangères employées ce tour, en euros (compris dans les commissions). */
  fraisDesSynergies?: number;
}
