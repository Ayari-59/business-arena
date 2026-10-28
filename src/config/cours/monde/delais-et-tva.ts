import { JOURS_DE_L_ANNEE } from "./amortissement";
import { COUT_VARIABLE_D_UNE_JOURNEE, PRIX_CATALOGUE } from "./atlas-conseil";
import { CAMPUSTECH, ELECTRO_COMPOSANTS, PLACEMENT } from "./exercice-de-nova";
import { AUTRES_COUTS_PAR_ENCEINTE, JOURS_DU_MOIS_COMMERCIAL, PRIX_DE_L_ENCEINTE, TAUX_DE_TVA, VENTES_A_CAMPUSTECH } from "./nova-gestion";

/**
 * LE MONDE DU COURS : LES DÉLAIS ET LA TVA (le lot de la trésorerie d'exploitation : la déclaration
 * de TVA, la TVA et la trésorerie, choisir son fournisseur, le client qui paie tard, remises et
 * conditions).
 *
 * Voir l-escale.ts pour le principe du monde du cours : une simulation figée, inspirée de l'arène,
 * calculée par le cours. Cette fiche est la seule source des chiffres des cinq chapitres du lot ; le
 * modèle qui les calcule est dans monde/delais.ts, et la garde tests/cours/delais-et-tva.test.ts
 * refait chaque chiffre à la main.
 *
 * TROIS ENTREPRISES, TROIS FAÇONS DE DEVOIR LA TVA. Le même délai ne coûte pas la même chose
 * selon ce que l'entreprise vend, parce que la TVA ne devient pas due au même moment.
 *   - MARTEL & FILS (le bâtiment) fait des TRAVAUX : sa TVA est due quand le client paie (le régime
 *     des encaissements), sauf si elle opte pour les débits. C'est l'entreprise des deux chapitres
 *     de fiscalité : ses six trimestres, de l'été de N − 1 à la fin de N.
 *   - NOVA (les enceintes) vend des BIENS : sa TVA est due à la livraison, que le client ait payé ou
 *     non. Un client qui paie tard lui fait avancer la TVA : elle finance sa créance toutes taxes
 *     comprises. C'est l'entreprise des deux chapitres du BTS GPME, sur l'année N + 1 de
 *     nova-capacite.ts : ses fournisseurs de composants, CampusTech, sa banque.
 *   - ATLAS CONSEIL (le cabinet) vend des PRESTATIONS DE SERVICES : sa TVA est due à l'encaissement.
 *     Un délai accordé ne lui fait avancer que le hors taxes. C'est l'entreprise de « remises et
 *     conditions » : une affaire avec un client de son portefeuille (atlas-conseil.ts).
 *
 * LES MONTANTS DISENT TOUJOURS S'ILS SONT HORS TAXES OU TOUTES TAXES COMPRISES : un nom finit par HT
 * ou par TTC. Une créance ou une dette envers un client ou un fournisseur est TTC (c'est ce qu'il
 * paiera) ; un chiffre d'affaires, un achat, un stock et une marge sont HT.
 */

// ─────────────────────────────────────────────────────────────────────────────
// LE DROIT DES DÉLAIS ET DE LA TVA (ce que le cours tient du droit français)
// ─────────────────────────────────────────────────────────────────────────────

/** Un trimestre compte 90 jours (trois mois commerciaux de 30 jours, la convention de nova-gestion.ts). */
export const JOURS_DU_TRIMESTRE = 3 * JOURS_DU_MOIS_COMMERCIAL;

/** L'année bancaire : les intérêts d'un découvert, d'un escompte ou d'un affacturage se comptent sur 360 jours. */
export const JOURS_DE_L_ANNEE_BANCAIRE = JOURS_DE_L_ANNEE;

/** L'année civile : les pénalités de retard, un taux annuel du code de commerce, se comptent sur 365 jours. */
export const JOURS_DE_L_ANNEE_CIVILE = 365;

/**
 * LE DÉLAI DE PAIEMENT CONVENU ENTRE PROFESSIONNELS NE PEUT PAS DÉPASSER 60 JOURS à compter de la date
 * d'émission de la facture, ou 45 jours fin de mois (code de commerce, article L. 441-10). Un client
 * qui paie au-delà du délai convenu est EN RETARD.
 */
export const DELAI_MAXIMAL_CONVENU = { joursDeLaFacture: 60, joursFinDeMois: 45 } as const;

/** Le délai de paiement d'une collectivité territoriale (le délai global de paiement de la commande publique) : 30 jours. */
export const DELAI_DE_LA_COMMANDE_PUBLIQUE = 30;

/**
 * LE TAUX DE REFINANCEMENT DE LA BANQUE CENTRALE EUROPÉENNE, base des pénalités de retard quand les
 * conditions de vente n'en fixent pas d'autre : le taux de son opération principale de refinancement
 * la plus récente, en vigueur au 1er janvier pour le premier semestre et au 1er juillet pour le
 * second. VALEUR DE RÉFÉRENCE DU COURS : 2,15 %, le taux en vigueur au 1er juillet 2025. À relire et
 * à mettre à jour chaque semestre.
 */
export const TAUX_DE_REFINANCEMENT_BCE = { taux: 0.0215, dateDeReference: "1er juillet 2025" } as const;

/** Les pénalités de retard, à défaut d'un autre taux convenu : le taux de refinancement de la BCE majoré de 10 points. */
export const MAJORATION_DU_TAUX_BCE = 0.1;

/**
 * LE TAUX D'INTÉRÊT LÉGAL entre professionnels (fixé chaque semestre par arrêté). Des pénalités
 * convenues ne peuvent pas être inférieures à 3 fois ce taux. VALEUR DE RÉFÉRENCE DU COURS : 2,76 %,
 * celui du second semestre 2025. À relire et à mettre à jour chaque semestre.
 */
export const TAUX_D_INTERET_LEGAL = { professionnels: 0.0276, semestre: "second semestre 2025" } as const;

/** Le plancher des pénalités convenues : 3 fois le taux d'intérêt légal. */
export const MULTIPLE_DU_TAUX_LEGAL = 3;

/** L'indemnité forfaitaire pour frais de recouvrement, due de plein droit par facture payée en retard (code de commerce, article D. 441-5). */
export const INDEMNITE_FORFAITAIRE_DE_RECOUVREMENT = 40;

/** Le taux normal de la TVA, le seul de la fiche (celui de nova-gestion.ts). */
export const TAUX_NORMAL_DE_TVA = TAUX_DE_TVA;

/**
 * L'EXIGIBILITÉ : le moment où la TVA d'une opération devient due à l'État.
 *   - Les « debits » : à la facture (la livraison pour des biens, l'option pour les débits pour des
 *     services ou des travaux). La TVA est due que le client ait payé ou non.
 *   - Les « encaissements » : quand le client paie. C'est la règle des prestations de services et des
 *     travaux immobiliers, sauf option pour les débits.
 */
export type RegimeDExigibilite = "debits" | "encaissements";

/** Ce que l'entreprise vend : la nature de l'opération fixe le régime d'exigibilité de droit commun. */
export type NatureDesOperations = "biens" | "services" | "travaux";

/** Le régime de droit commun de chaque nature d'opération : la livraison pour des biens, l'encaissement pour des services ou des travaux. */
export const EXIGIBILITE_DE_DROIT_COMMUN: Readonly<Record<NatureDesOperations, RegimeDExigibilite>> = {
  biens: "debits",
  services: "encaissements",
  travaux: "encaissements",
};

/**
 * LE TAUX DU DÉCOUVERT (hypothèse du cours) : 9 % l'an, celui des trois entreprises de la fiche.
 * C'est ce que coûte l'argent qu'il faut attendre : une créance, une TVA avancée, un stock. Un taux
 * rond pour que 30 jours fassent 0,75 % (9 % × 30 ÷ 360).
 */
export const TAUX_DU_DECOUVERT = 0.09;

// ─────────────────────────────────────────────────────────────────────────────
// MARTEL & FILS : LES TRIMESTRES DE LA TVA
// ─────────────────────────────────────────────────────────────────────────────

/**
 * LES SIX TRIMESTRES DE LA FICHE DU BÂTIMENT, par rang : −1 et 0 sont les deux derniers trimestres
 * de N − 1 (ils font les créances, les dettes et la TVA de l'ouverture), 1 à 4 les trimestres de N.
 * Dans les tableaux de la fiche, le rang r est à l'indice r + 1.
 */
export const LIBELLES_DES_TRIMESTRES = [
  "le troisième trimestre de N − 1",
  "le quatrième trimestre de N − 1",
  "le premier trimestre",
  "le deuxième trimestre",
  "le troisième trimestre",
  "le quatrième trimestre",
] as const;

/** Le premier et le dernier rang de la fiche du bâtiment. */
export const PREMIER_RANG = -1;
export const DERNIER_RANG = 4;

export type CodeDeClienteleDuBatiment = "commerces" | "collectivites" | "entreprises";

export interface ClienteleDuBatiment {
  code: CodeDeClienteleDuBatiment;
  nom: string;
  /** Le délai de paiement, en jours après la facture de fin de chantier (0 : réglé à la réception des travaux). */
  delai: number;
  /** Les travaux facturés à cette clientèle, hors taxes, aux six trimestres de la fiche (rang −1 à 4). */
  ventesHT: readonly number[];
}

/**
 * LES TROIS CLIENTÈLES DE MARTEL & FILS (hypothèses du cours). Tous ses chantiers sont des locaux
 * professionnels ou publics : la TVA y est au taux normal, 20 %. (Des travaux de rénovation dans un
 * logement achevé depuis plus de deux ans relèveraient du taux de 10 %, ou de 5,5 % pour
 * l'amélioration énergétique : c'est pourquoi la fiche ne prend pas les particuliers de l'arène.)
 *   - Les commerces et les cabinets (boutiques, cabinets médicaux) règlent à la réception des
 *     travaux : comptant.
 *   - Les collectivités (écoles, gymnases, mairies) paient à 30 jours, le délai de la commande
 *     publique. L'été, elles font travailler les écoles vides.
 *   - Les entreprises (bureaux, entrepôts) paient à 60 jours, le délai maximal convenu entre
 *     professionnels.
 * L'hiver ralentit les chantiers (le premier trimestre), le printemps les relance. Les montants sont
 * des multiples de 3 000 € : 30 et 60 jours en font des tiers ronds d'un trimestre.
 */
export const CLIENTELES_DU_BATIMENT: readonly ClienteleDuBatiment[] = [
  { code: "commerces", nom: "Commerces et cabinets", delai: 0, ventesHT: [72_000, 90_000, 45_000, 120_000, 75_000, 105_000] },
  { code: "collectivites", nom: "Collectivités", delai: DELAI_DE_LA_COMMANDE_PUBLIQUE, ventesHT: [126_000, 120_000, 60_000, 150_000, 135_000, 120_000] },
  { code: "entreprises", nom: "Entreprises", delai: DELAI_MAXIMAL_CONVENU.joursDeLaFacture, ventesHT: [117_000, 180_000, 90_000, 210_000, 120_000, 225_000] },
];

/**
 * LES ACHATS DE MATÉRIAUX, hors taxes, aux six trimestres (hypothèse du cours, environ 45 % des
 * travaux, comme les 168 € de matériaux d'un mètre carré à 380 € dans l'arène). Ce sont des BIENS :
 * leur TVA se déduit à la livraison, que MARTEL & FILS ait payé le négoce ou non. Les autres coûts du
 * chantier (la location de matériel, l'évacuation des gravats, le carburant) ne sont pas dans la
 * fiche : le cours n'en compte pas la TVA (une simplification, à dire). Les salaires, l'assurance
 * décennale et le loyer du dépôt ne portent pas de TVA à déduire.
 */
export const ACHATS_DE_MATERIAUX_HT: readonly number[] = [144_000, 180_000, 90_000, 216_000, 150_000, 216_000];

/**
 * LE FOURNISSEUR DE MATÉRIAUX (hypothèse du cours, le négoce régional de l'arène) : le Négoce Valmont
 * Matériaux livre sur les chantiers et se paie à 45 jours.
 */
export const NEGOCE_DE_MATERIAUX = { nom: "Négoce Valmont Matériaux", delai: 45 } as const;

export interface InvestissementDuBatiment {
  rang: number;
  libelle: string;
  montantHT: number;
}

/**
 * L'INVESTISSEMENT DU PRINTEMPS (hypothèse du cours) : au deuxième trimestre, MARTEL & FILS renouvelle
 * son matériel pour la saison, 210 000 € hors taxes, payés à la livraison (un emprunt les finance).
 * Ce sont des biens : leur TVA, 42 000 €, se déduit sur la déclaration du trimestre. C'est elle qui
 * fait naître un crédit de TVA au régime des encaissements.
 */
export const INVESTISSEMENTS_DU_BATIMENT: readonly InvestissementDuBatiment[] = [
  { rang: 2, libelle: "un camion-benne, deux fourgons et un échafaudage", montantHT: 210_000 },
];

/**
 * LA DÉCLARATION DE TVA DE MARTEL & FILS.
 *   - LE RÉGIME D'EXIGIBILITÉ : MARTEL & FILS fait des travaux immobiliers, des prestations de
 *     services : sa TVA est due À L'ENCAISSEMENT (le régime des encaissements). Elle n'a pas opté pour
 *     les débits. Le modèle sait calculer l'autre régime, pour montrer ce que l'option changerait.
 *   - LE RYTHME (HYPOTHÈSE DU COURS) : une déclaration par trimestre, payée au trimestre suivant.
 *     Dans la réalité, une entreprise de cette taille, au régime réel normal, déclare chaque mois (la
 *     déclaration trimestrielle est réservée aux entreprises dont la TVA de l'année reste sous
 *     4 000 €) : le trimestre du cours regroupe ses trois déclarations mensuelles.
 *   - LE CRÉDIT DE TVA : quand la TVA déductible dépasse la TVA collectée, l'État doit la différence.
 *     Le cours l'impute sur la déclaration suivante (la règle par défaut ; un remboursement se
 *     demande, sous conditions).
 *   - L'OUVERTURE : la déclaration du quatrième trimestre de N − 1 se paie au premier trimestre de
 *     N ; aucun crédit ne venait d'avant.
 */
export const DECLARATION_DU_BATIMENT = {
  nature: "travaux" as NatureDesOperations,
  regime: "encaissements" as RegimeDExigibilite,
  optionPourLesDebits: false,
  rythme: "trimestre",
  creditDOuverture: 0,
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// NOVA : LES FOURNISSEURS DE COMPOSANTS EN N + 1
// ─────────────────────────────────────────────────────────────────────────────

/**
 * LES VENTES DU PLAN DE N + 1, trimestre par trimestre : celles de nova-capacite.ts (la demande servie
 * par une ligne de 7 000 enceintes), 26 000 sur l'année. NOVA n'a pas de stock d'enceintes finies :
 * elle consomme un jeu de composants par enceinte vendue.
 */
export const VENTES_DU_PLAN_DE_N_PLUS_1: readonly number[] = [5_800, 7_000, 6_200, 7_000];

export type CodeDOffre = "electro-composants" | "asiacomponents" | "europarts";

export interface OffreDeFournisseur {
  code: CodeDOffre;
  nom: string;
  /** Le prix d'un jeu de composants, hors taxes. */
  prixHT: number;
  /** Les conditions de paiement, dites en clair. */
  conditions: string;
  /**
   * Le délai de paiement que le cours compte : à la clôture d'un trimestre, NOVA doit encore les achats
   * de ses derniers jours de délai (dettes = achats du trimestre × délai ÷ 90). 0 : payé comptant.
   */
  delaiDePaiement: number;
  /** Le délai entre la commande et la livraison, en jours. */
  delaiDeLivraison: number;
  /** Les jours de consommation que NOVA garde en stock à la clôture (stock = consommation du trimestre × jours ÷ 90). */
  joursDeStock: number;
  /** La probabilité, chaque trimestre, que la livraison manque. */
  risqueDeRupture: number;
  /** Les enceintes qu'une rupture empêche de monter et de vendre. */
  ventesPerduesParRupture: number;
  /** Un escompte pour un paiement plus rapide, s'il en propose un. */
  escompte: { taux: number; jours: number } | null;
  /** Les points de taux de défaut que ses composants retirent (la qualité de nova-capacite.ts). */
  baisseDuTauxDeDefaut: number;
}

/**
 * LES TROIS OFFRES DE COMPOSANTS POUR N + 1 (hypothèses du cours ; les noms d'AsiaComponents et
 * d'EuroParts Premium viennent de l'arène, leurs conditions sont celles du cours).
 *   - ÉLECTRO-COMPOSANTS LYON, le fournisseur habituel (exercice-de-nova.ts) : 22 € le jeu. Il livre
 *     et facture le 10 de chaque mois les composants du mois, payés le 1er du mois suivant : à la
 *     clôture d'un trimestre, NOVA doit toujours la facture de son dernier mois, 30 jours d'achats
 *     sur 90. Le cours le compte comme un délai de 30 jours (le bilan du 31 décembre N le
 *     montre : la facture du 10 décembre est encore due). NOVA ne garde pas de stock : elle reçoit
 *     chaque mois ce qu'elle monte. Il offre 1 % d'escompte pour un paiement à 10 jours.
 *   - ASIACOMPONENTS, un importateur : 19,80 € le jeu (10 % de moins), payé comptant à la livraison.
 *     Les composants arrivent par conteneur, 42 jours après la commande : NOVA garde 45 jours de
 *     consommation en stock. Chaque trimestre, le risque est de 10 % qu'un conteneur arrive en
 *     retard ; la ligne s'arrête alors, et 700 enceintes ne se montent pas.
 *   - EUROPARTS PREMIUM : 23,10 € le jeu (5 % de plus), des composants certifiés (le taux de défaut
 *     baisse d'un demi-point), livrés en 48 heures, payés à 60 jours, le délai maximal convenu.
 */
export const OFFRES_DE_COMPOSANTS: readonly OffreDeFournisseur[] = [
  {
    code: "electro-composants",
    nom: ELECTRO_COMPOSANTS.nom,
    prixHT: ELECTRO_COMPOSANTS.prixDuJeu,
    conditions: "facturé le 10 de chaque mois, payé le 1er du mois suivant",
    delaiDePaiement: JOURS_DU_MOIS_COMMERCIAL,
    delaiDeLivraison: 7,
    joursDeStock: 0,
    risqueDeRupture: 0,
    ventesPerduesParRupture: 0,
    escompte: { taux: 0.01, jours: 10 },
    baisseDuTauxDeDefaut: 0,
  },
  {
    code: "asiacomponents",
    nom: "AsiaComponents",
    prixHT: 19.8,
    conditions: "payé comptant à la livraison",
    delaiDePaiement: 0,
    delaiDeLivraison: 42,
    joursDeStock: 45,
    risqueDeRupture: 0.1,
    ventesPerduesParRupture: 700,
    escompte: null,
    baisseDuTauxDeDefaut: 0,
  },
  {
    code: "europarts",
    nom: "EuroParts Premium",
    prixHT: 23.1,
    conditions: "payé à 60 jours",
    delaiDePaiement: DELAI_MAXIMAL_CONVENU.joursDeLaFacture,
    delaiDeLivraison: 2,
    joursDeStock: 0,
    risqueDeRupture: 0,
    ventesPerduesParRupture: 0,
    escompte: null,
    baisseDuTauxDeDefaut: 0.005,
  },
];

/** L'offre habituelle, celle que NOVA garde si elle ne change rien. */
export const OFFRE_HABITUELLE: CodeDOffre = "electro-composants";

// ─────────────────────────────────────────────────────────────────────────────
// NOVA : CAMPUSTECH, LE CLIENT QUI PAIE TARD
// ─────────────────────────────────────────────────────────────────────────────

/**
 * CAMPUSTECH EN N + 1, le client professionnel de nova-gestion.ts et d'exercice-de-nova.ts : 320
 * enceintes chaque mois, au prix de 59 € hors taxes, facturées le 20 (18 880 € HT, 22 656 € TTC).
 *   - LE DÉLAI CONVENU : 60 jours après la facture, le délai maximal entre professionnels. Une
 *     facture du 20 est due le 20 du deuxième mois suivant.
 *   - LE DÉLAI RÉEL : CampusTech paie à 80 jours, le 10 du troisième mois suivant (le délai que les
 *     autres fiches du cours lui donnent). C'est un RETARD DE 20 JOURS, que la loi sanctionne : des
 *     pénalités de retard et 40 € d'indemnité de recouvrement par facture. Les créances des autres
 *     fiches restent justes : l'argent arrive bien au 80e jour.
 *   - NOVA vend des biens : la TVA de chaque facture est due à la livraison. En attendant d'être
 *     payée, NOVA finance la facture toutes taxes comprises.
 */
export const CAMPUSTECH_EN_N_PLUS_1 = {
  nom: CAMPUSTECH.nom,
  enceintesParFacture: VENTES_A_CAMPUSTECH[0]!,
  jourDeFacturation: CAMPUSTECH.jourDeFacturation,
  delaiConvenu: DELAI_MAXIMAL_CONVENU.joursDeLaFacture,
  delaiReel: CAMPUSTECH.delai,
} as const;

/**
 * LES PÉNALITÉS DE RETARD DE NOVA : ses conditions générales de vente (et chacune de ses factures,
 * c'est une mention obligatoire) les fixent au taux de refinancement de la BCE majoré de 10 points,
 * sur le montant toutes taxes comprises, pour chaque jour de retard. S'y ajoute l'indemnité de 40 €.
 */
export const PENALITES_DE_NOVA = { base: "bce" as "bce" | "taux-legal", indemnite: INDEMNITE_FORFAITAIRE_DE_RECOUVREMENT } as const;

/** Les particuliers paient par carte à la commande : comptant. Le reste des ventes de chaque trimestre leur va. */
export const PARTICULIERS = { nom: "Les particuliers, en ligne", delai: 0 } as const;

// ─────────────────────────────────────────────────────────────────────────────
// NOVA : LA BANQUE ET LES BESOINS DE TRÉSORERIE DE N + 1
// ─────────────────────────────────────────────────────────────────────────────

/**
 * LES CONDITIONS DE LA BANQUE DE NOVA EN N + 1 (hypothèses du cours, les ordres de grandeur de
 * l'arène pour l'escompte).
 *   - LE DÉCOUVERT : 9 % l'an sur les jours où le compte est débiteur, autorisé jusqu'à 50 000 €.
 *   - L'ESCOMPTE (« sauf bonne fin ») : la banque avance une facture toutes taxes comprises jusqu'à
 *     son échéance convenue, contre des intérêts à 6 % l'an pour les jours qui restent. Elle garde un
 *     recours : si le client ne paie pas à l'échéance, elle reprend la somme à NOVA. Les factures
 *     escomptées ne peuvent pas dépasser 50 000 € à la fois.
 *   - L'AFFACTURAGE : un factor achète la facture, encaisse lui-même le client et garantit NOVA
 *     contre un impayé. Il prend une commission d'affacturage, 1 % du montant toutes taxes comprises,
 *     et une commission de financement, 6 % l'an jusqu'au paiement réel du client.
 *   - LE PLACEMENT : l'argent qui dort rapporte 3 % l'an (le compte à terme d'exercice-de-nova.ts).
 */
export const BANQUE_DE_NOVA = {
  tauxDuDecouvert: TAUX_DU_DECOUVERT,
  autorisationDeDecouvert: 50_000,
  escompte: { taux: 0.06, plafondTTC: 50_000 },
  affacturage: { commission: 0.01, tauxDeFinancement: 0.06 },
  tauxDuPlacement: PLACEMENT.tauxAnnuel,
} as const;

export interface BesoinDeTresorerie {
  trimestre: 1 | 2 | 3 | 4;
  /** Le découvert moyen des jours où le compte est débiteur, avant toute mobilisation de créances. */
  montant: number;
  /** Les jours du trimestre où le compte est débiteur. */
  jours: number;
}

/**
 * LES BESOINS DE TRÉSORERIE DE N + 1 (hypothèse du cours : le budget de trésorerie de N + 1 n'est pas
 * détaillé ici ; c'est ce qu'il donne avant toute mobilisation des créances). Au deuxième trimestre,
 * le solde de l'impôt de N et les composants du printemps creusent le compte : 25 000 € de découvert
 * pendant 20 jours. Au quatrième, la production de Noël part avant d'être payée : 40 000 € pendant
 * 50 jours. Les trimestres 1 et 3 restent créditeurs.
 */
export const BESOINS_DE_TRESORERIE_N_PLUS_1: readonly BesoinDeTresorerie[] = [
  { trimestre: 1, montant: 0, jours: 0 },
  { trimestre: 2, montant: 25_000, jours: 20 },
  { trimestre: 3, montant: 0, jours: 0 },
  { trimestre: 4, montant: 40_000, jours: 50 },
];

// ─────────────────────────────────────────────────────────────────────────────
// ATLAS CONSEIL : L'AFFAIRE AUX CONDITIONS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * L'AFFAIRE AUX CONDITIONS (hypothèse du cours, pour « remises et conditions »). Kerval Distribution,
 * un compte PME d'ATLAS CONSEIL (120 journées en N, au prix catalogue), commande pour N + 1 un
 * programme de 40 journées de formation de ses chefs d'équipe.
 *   - Le prix catalogue d'une journée, 800 € hors taxes, et son coût variable, 150 € (atlas-conseil.ts).
 *   - Le commercial accorde 5 % de remise, et 2 % d'escompte si Kerval paie sous 10 jours ; sinon,
 *     Kerval paie à 60 jours, le délai maximal convenu.
 *   - ATLAS CONSEIL vend des prestations de services : sa TVA n'est due qu'à l'encaissement. En
 *     attendant d'être payée, elle finance le net commercial hors taxes, sur son découvert, à 9 % l'an.
 */
export const AFFAIRE_AUX_CONDITIONS = {
  client: "Kerval Distribution",
  compte: "kerval",
  journees: 40,
  prixHT: PRIX_CATALOGUE,
  coutVariableHT: COUT_VARIABLE_D_UNE_JOURNEE.fraisDeMission + COUT_VARIABLE_D_UNE_JOURNEE.supports,
  remise: 0.05,
  escompte: { taux: 0.02, jours: 10 },
  delai: DELAI_MAXIMAL_CONVENU.joursDeLaFacture,
  tauxDeFinancement: TAUX_DU_DECOUVERT,
  tauxDeTva: TAUX_NORMAL_DE_TVA,
  nature: "services" as NatureDesOperations,
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// LES FICHES
// ─────────────────────────────────────────────────────────────────────────────

export interface FicheDuBatiment {
  code: string;
  entreprise: string;
  tauxDeTva: number;
  declaration: {
    readonly nature: NatureDesOperations;
    readonly regime: RegimeDExigibilite;
    readonly optionPourLesDebits: boolean;
    readonly rythme: string;
    readonly creditDOuverture: number;
  };
  clienteles: readonly ClienteleDuBatiment[];
  achatsHT: readonly number[];
  fournisseur: { readonly nom: string; readonly delai: number };
  investissements: readonly InvestissementDuBatiment[];
  tauxDuDecouvert: number;
}

export const MARTEL_ET_FILS: FicheDuBatiment = {
  code: "batiment",
  entreprise: "MARTEL & FILS",
  tauxDeTva: TAUX_NORMAL_DE_TVA,
  declaration: DECLARATION_DU_BATIMENT,
  clienteles: CLIENTELES_DU_BATIMENT,
  achatsHT: ACHATS_DE_MATERIAUX_HT,
  fournisseur: NEGOCE_DE_MATERIAUX,
  investissements: INVESTISSEMENTS_DU_BATIMENT,
  tauxDuDecouvert: TAUX_DU_DECOUVERT,
};

export interface FicheDesDelaisDeNova {
  code: string;
  entreprise: string;
  nature: NatureDesOperations;
  tauxDeTva: number;
  prixHT: number;
  autresCoutsVariablesHT: number;
  ventes: readonly number[];
  offres: readonly OffreDeFournisseur[];
  offreHabituelle: CodeDOffre;
  campustech: {
    readonly nom: string;
    readonly enceintesParFacture: number;
    readonly jourDeFacturation: number;
    readonly delaiConvenu: number;
    readonly delaiReel: number;
  };
  penalites: { readonly base: "bce" | "taux-legal"; readonly indemnite: number };
  banque: {
    readonly tauxDuDecouvert: number;
    readonly autorisationDeDecouvert: number;
    readonly escompte: { readonly taux: number; readonly plafondTTC: number };
    readonly affacturage: { readonly commission: number; readonly tauxDeFinancement: number };
    readonly tauxDuPlacement: number;
  };
  besoins: readonly BesoinDeTresorerie[];
}

export const NOVA_DELAIS: FicheDesDelaisDeNova = {
  code: "nova",
  entreprise: "NOVA",
  nature: "biens",
  tauxDeTva: TAUX_NORMAL_DE_TVA,
  prixHT: PRIX_DE_L_ENCEINTE,
  autresCoutsVariablesHT: AUTRES_COUTS_PAR_ENCEINTE,
  ventes: VENTES_DU_PLAN_DE_N_PLUS_1,
  offres: OFFRES_DE_COMPOSANTS,
  offreHabituelle: OFFRE_HABITUELLE,
  campustech: CAMPUSTECH_EN_N_PLUS_1,
  penalites: PENALITES_DE_NOVA,
  banque: BANQUE_DE_NOVA,
  besoins: BESOINS_DE_TRESORERIE_N_PLUS_1,
};

export interface FicheDeLAffaire {
  code: string;
  entreprise: string;
  client: string;
  compte: string;
  journees: number;
  prixHT: number;
  coutVariableHT: number;
  remise: number;
  escompte: { readonly taux: number; readonly jours: number };
  delai: number;
  tauxDeFinancement: number;
  tauxDeTva: number;
  nature: NatureDesOperations;
}

export const ATLAS_CONDITIONS: FicheDeLAffaire = { code: "conseil", entreprise: "ATLAS CONSEIL", ...AFFAIRE_AUX_CONDITIONS };

/** Les fiches des délais et de la TVA du monde du cours, par code d'entreprise. */
export const DELAIS_DU_COURS = { batiment: MARTEL_ET_FILS, nova: NOVA_DELAIS, conseil: ATLAS_CONDITIONS } as const;
