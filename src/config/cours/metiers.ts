/**
 * CE QUE CHAQUE MÉTIER APPORTE AU COURS DE COMPTABILITÉ.
 *
 * Un chapitre s'écrit une fois ; les montants viennent de l'entreprise (son bilan
 * d'ouverture, son équipement, ses coûts, son premier trimestre simulé). Ce fichier
 * dit le reste, que la simulation ne sait pas : sur quel compte s'enregistre ce
 * qu'elle achète et ce qu'elle vend, à quel taux de TVA, et qui sont son
 * fournisseur et son client professionnel.
 *
 * LES TAUX DE TVA sont ceux du code général des impôts pour ces opérations :
 * 20 % (taux normal), 10 % pour l'hébergement hôtelier et la restauration sur
 * place, 5,5 % pour les denrées alimentaires achetées par un restaurant.
 *
 * LES COMPTES ACCEPTÉS sont des formes moins précises mais justes : un élève qui
 * écrit 215 pour une machine n'a pas tort, il a moins raison que 2154.
 */

export interface CompteDuMetier {
  compte: string;
  acceptes: readonly string[];
}

export interface DonneesDuMetier {
  /** L'équipement acheté à la création : son compte. */
  immobilisation: CompteDuMetier;
  /** Ce que l'entreprise achète pour produire ou vendre, au singulier générique. */
  achat: CompteDuMetier & {
    /** « Composants pour 1 680 enceintes » : la désignation de la facture. */
    designation: (quantiteEcrite: string) => string;
    fournisseur: string;
    tauxTva: number;
  };
  vente: CompteDuMetier & {
    tauxTva: number;
    /** Les ventes réglées sur-le-champ, en une phrase. */
    comptant: string;
    /** Le client professionnel qui paie à échéance. */
    client: string;
  };
}

const IMMO_MATERIEL: CompteDuMetier = { compte: "2154", acceptes: ["215", "2155"] };

export const METIERS: Record<string, DonneesDuMetier> = {
  nova: {
    immobilisation: IMMO_MATERIEL,
    achat: {
      compte: "601",
      acceptes: ["602"],
      designation: (q) => `Composants pour ${q} enceintes`,
      fournisseur: "Électro-Composants Lyon",
      tauxTva: 0.2,
    },
    vente: {
      compte: "701",
      acceptes: [],
      tauxTva: 0.2,
      comptant: "les enceintes vendues en ligne aux particuliers, payées par carte à la commande",
      client: "CampusTech",
    },
  },
  boutique: {
    immobilisation: { compte: "2184", acceptes: ["218", "2181"] },
    achat: {
      compte: "607",
      acceptes: [],
      designation: (q) => `${q} pulls de la collection`,
      fournisseur: "Filature des Vosges",
      tauxTva: 0.2,
    },
    vente: {
      compte: "707",
      acceptes: [],
      tauxTva: 0.2,
      comptant: "les pulls vendus en boutique, réglés en caisse",
      client: "le comité d'entreprise des Laboratoires Morel",
    },
  },
  hotel: {
    immobilisation: { compte: "2181", acceptes: ["218", "2135"] },
    achat: {
      compte: "6063",
      acceptes: ["606", "602"],
      designation: (q) => `Linge et produits d'accueil pour ${q} nuitées`,
      fournisseur: "Blanchisserie du Port",
      tauxTva: 0.2,
    },
    vente: {
      compte: "706",
      acceptes: [],
      tauxTva: 0.1,
      comptant: "les nuitées réglées par les clients à leur départ",
      client: "l'agence Voyages Horizon",
    },
  },
  bistrot: {
    immobilisation: IMMO_MATERIEL,
    achat: {
      compte: "601",
      acceptes: ["607", "602"],
      designation: (q) => `Denrées pour ${q} couverts`,
      fournisseur: "Primeurs des Halles",
      tauxTva: 0.055,
    },
    vente: {
      compte: "706",
      acceptes: ["707"],
      tauxTva: 0.1,
      comptant: "les repas servis en salle, réglés à table",
      client: "la société Brunet, pour ses repas d'affaires",
    },
  },
  conseil: {
    immobilisation: { compte: "2183", acceptes: ["218"] },
    achat: {
      compte: "604",
      acceptes: [],
      designation: (q) => `Études et documentation pour ${q} jours de mission`,
      fournisseur: "Documentation Pro",
      tauxTva: 0.2,
    },
    vente: {
      compte: "706",
      acceptes: [],
      tauxTva: 0.2,
      comptant: "les missions courtes, réglées à la remise du rapport",
      client: "le groupe Vidal Industries",
    },
  },
  ecommerce: {
    immobilisation: { compte: "2154", acceptes: ["215", "2181", "218"] },
    achat: {
      compte: "607",
      acceptes: [],
      designation: (q) => `Articles de décoration pour ${q} commandes`,
      fournisseur: "Déco Import",
      tauxTva: 0.2,
    },
    vente: {
      compte: "707",
      acceptes: [],
      tauxTva: 0.2,
      comptant: "les commandes payées par carte sur le site",
      client: "la place de marché MaisonPlus, qui reverse en fin de période",
    },
  },
  fitness: {
    immobilisation: { compte: "2154", acceptes: ["215", "2184", "218"] },
    achat: {
      compte: "6063",
      acceptes: ["606"],
      designation: (q) => `Produits d'entretien et petit matériel pour ${q} adhérents`,
      fournisseur: "Hygiène Pro",
      tauxTva: 0.2,
    },
    vente: {
      compte: "706",
      acceptes: [],
      tauxTva: 0.2,
      comptant: "les abonnements individuels, payés à l'inscription",
      client: "le comité d'entreprise de la mairie",
    },
  },
  batiment: {
    immobilisation: { compte: "2155", acceptes: ["215", "2154"] },
    achat: {
      compte: "601",
      acceptes: ["602"],
      designation: (q) => `Matériaux pour ${q} mètres carrés`,
      fournisseur: "Négoce Matériaux Durand",
      tauxTva: 0.2,
    },
    vente: {
      compte: "704",
      acceptes: ["706"],
      tauxTva: 0.2,
      comptant: "les petits dépannages dans des commerces, réglés en fin de chantier",
      client: "un cabinet médical qui rénove ses locaux",
    },
  },
  transport: {
    immobilisation: { compte: "2182", acceptes: ["218"] },
    achat: {
      compte: "6061",
      acceptes: ["606"],
      designation: (q) => `Gazole pour ${q} palettes livrées`,
      fournisseur: "Carburants de l'Ouest",
      tauxTva: 0.2,
    },
    vente: {
      compte: "706",
      acceptes: [],
      tauxTva: 0.2,
      comptant: "les envois de messagerie payés à l'enlèvement",
      client: "le chargeur Logidis",
    },
  },
};

/** Les entreprises du cours, dans l'ordre du catalogue. */
export const ENTREPRISES_DU_COURS = Object.keys(METIERS);
