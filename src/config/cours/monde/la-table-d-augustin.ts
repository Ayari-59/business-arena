/**
 * LE MONDE DU COURS : LA TABLE D'AUGUSTIN, LE BISTROT DU COURS.
 *
 * Fiche figée, relevée une fois sur le scénario du bistrot de l'arène puis écrite ici (voir
 * l-escale.ts pour le principe du monde du cours) : 100 couverts par service de jour, 90 jours par
 * trimestre, un ticket moyen de 34 € hors taxes, 10 € de denrées et 3 € d'autres coûts variables
 * par couvert, une équipe de 10 salariés. La demande de chaque clientèle reprend la saison de
 * l'arène : les déjeuners d'affaires hors été, les dîners de la clientèle locale toute l'année, les
 * banquets en fin d'année, qui dépassent alors ce que la salle peut servir.
 */

/** Une clientèle du bistrot, et les couverts qu'elle lui demande chaque trimestre au prix de l'année. */
export interface ClienteleDuBistrot {
  code: string;
  nom: string;
  demande: readonly [number, number, number, number];
}

export interface FicheDuBistrot {
  code: string;
  entreprise: string;
  /** Les couverts que la salle et la cuisine peuvent servir chaque jour. */
  couvertsParJour: number;
  joursParTrimestre: number;
  /** Le ticket moyen d'un couvert, hors taxes. */
  prixDeLAnnee: number;
  /** Le taux de TVA des repas servis sur place. */
  tauxTva: number;
  /** Les denrées d'un couvert, au prix du fournisseur habituel. */
  coutMatiereParCouvert: number;
  /** Les autres coûts variables d'un couvert : énergie de cuisine, boissons offertes, frais de carte. */
  autresCoutsParCouvert: number;
  /** Tout ce qui ne dépend pas des couverts : personnel, loyer, entretien, amortissements. */
  chargesFixesParTrimestre: number;
  /**
   * LA SENSIBILITÉ DE LA DEMANDE AU PRIX, toutes clientèles réunies (hypothèse du cours) : la
   * demande au prix p vaut la demande au prix de l'année × (p ÷ prix de l'année) ^ élasticité.
   */
  elasticite: number;
  clienteles: readonly ClienteleDuBistrot[];
  /** L'équipe : le même effectif toute l'année, payé pareil chaque trimestre (sa paie est dans les charges fixes). */
  equipe: { effectif: number; coutParSalarieParTrimestre: number };
  /**
   * LA HAUSSE DES DENRÉES DE L'ANNÉE (hypothèse du cours, reprise de l'événement de l'arène) : à
   * partir du trimestre dit, les denrées coûtent ce taux de plus, sur tout le barème.
   */
  hausseDesDenrees: { trimestre: number; taux: number };
}

export const LA_TABLE_D_AUGUSTIN: FicheDuBistrot = {
  code: "bistrot",
  entreprise: "LA TABLE D'AUGUSTIN",
  couvertsParJour: 100,
  joursParTrimestre: 90,
  prixDeLAnnee: 34,
  tauxTva: 0.1,
  coutMatiereParCouvert: 10,
  autresCoutsParCouvert: 3,
  chargesFixesParTrimestre: 162_000,
  elasticite: -1.3,
  clienteles: [
    { code: "midi", nom: "Déjeuners d'affaires", demande: [2200, 2300, 1250, 2200] },
    { code: "soir", nom: "Dîners de la clientèle locale", demande: [2900, 3800, 3600, 3700] },
    { code: "banquets", nom: "Banquets et repas d'entreprise", demande: [1300, 2400, 630, 6000] },
  ],
  equipe: { effectif: 10, coutParSalarieParTrimestre: 7200 },
  hausseDesDenrees: { trimestre: 3, taux: 0.14 },
};

/** Les restaurants du monde du cours, par code d'entreprise. */
export const BISTROTS_DU_COURS: Readonly<Record<string, FicheDuBistrot>> = { [LA_TABLE_D_AUGUSTIN.code]: LA_TABLE_D_AUGUSTIN };
