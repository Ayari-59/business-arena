/**
 * LE MONDE DU COURS : NOVA, POUR LE CONTRÔLE DE GESTION (le socle du parcours).
 *
 * NOVA fabrique des enceintes (voir l-escale.ts pour le principe du monde du cours : une
 * simulation figée, inspirée de l'arène, calculée par le cours). Cette fiche est la seule source
 * des chiffres des six chapitres du socle : le seuil de rentabilité, le coût complet, le coût par
 * produit, la décision (prix, fabriquer ou acheter), le budget de trésorerie et le tableau de bord.
 * Le modèle qui les calcule est dans monde/couts-et-budgets.ts ; la garde
 * tests/cours/couts-et-budgets.test.ts refait chaque chiffre à la main sur cette fiche.
 *
 * UNE SEULE ENTREPRISE, D'UN CHAPITRE À L'AUTRE. Le mois de référence est janvier, le même que
 * celui des chapitres de comptabilité (cas-des-entreprises.ts : 1 590 enceintes à 59 €, 22 € de
 * composants et 16 € d'autres coûts par enceinte, le loyer de 19 700 €, la paie de 10 650 €,
 * l'usure de 833 €, CampusTech qui paie 20 jours après les 60 jours convenus). Le premier trimestre de la décision est
 * janvier, février et mars de ce semestre ; le budget de trésorerie et le tableau de bord suivent
 * les mêmes six mois ; la gamme vient plus tard, quand NOVA lance Go et Studio à côté de One, avec
 * le même local et la même équipe.
 *
 * CE QUI A ÉTÉ CHOISI, ET POURQUOI. Les charges fixes sont celles de janvier, 31 183 € par mois,
 * pour tout le semestre : l'arène, elle, comptait 106 686 € de charges fixes au trimestre (avec la
 * publicité et l'entretien), si bien que janvier gagnait de l'argent quand le trimestre qui le
 * contient en perdait. Les ventes du premier trimestre (4 778 enceintes, 281 902 €) et du deuxième
 * (6 081 enceintes, 358 779 €) reprennent celles de l'arène. Tout est hors taxes, sauf les flux
 * du budget de trésorerie, qui sont toutes taxes comprises : une créance se lit TTC, partout.
 */

// ─────────────────────────────────────────────────────────────────────────────
// LE MOIS DE RÉFÉRENCE : JANVIER
// ─────────────────────────────────────────────────────────────────────────────

/** Le prix de vente d'une enceinte NOVA One, hors taxes, toute l'année du cours. */
export const PRIX_DE_L_ENCEINTE = 59;

/** Les composants d'une enceinte (achetés à Électro-Composants Lyon, consommés dans le mois). */
export const COMPOSANTS_PAR_ENCEINTE = 22;

/** Les autres coûts variables d'une enceinte : emballage, transport et énergie de la chaîne. */
export const AUTRES_COUTS_PAR_ENCEINTE = 16;

/**
 * Les charges fixes d'un mois, toutes indirectes : le loyer du local (le bailleur n'a pas opté pour
 * la TVA), la paie des quatre salariés (7 500 € bruts et 3 150 € de cotisations patronales), et
 * l'usure de la ligne de montage (60 000 € hors taxes amortis sur 72 mois, arrondis à l'euro).
 * HYPOTHÈSE DU COURS : elles sont les mêmes chaque mois du semestre, quoi qu'on vende, et NOVA ne
 * fait pas de publicité payante (ses ventes en ligne passent par le bouche-à-oreille).
 */
export const CHARGES_FIXES_DU_MOIS = { loyer: 19_700, personnel: 10_650, amortissement: 833 } as const;

export type CodeDeCharge = keyof typeof CHARGES_FIXES_DU_MOIS;

export interface MoisDeReference {
  nom: string;
  /** Les jours du mois : le point mort se date en supposant les ventes régulières sur le mois. */
  jours: number;
  quantite: number;
  prix: number;
  /** Le coût variable d'une enceinte, poste par poste. */
  coutVariable: { composants: number; autres: number };
  autresCoutsVariables: string;
  chargesFixes: Readonly<Record<CodeDeCharge, number>>;
}

// ─────────────────────────────────────────────────────────────────────────────
// LES CENTRES D'ANALYSE DE JANVIER
// ─────────────────────────────────────────────────────────────────────────────

export type CentreAuxiliaire = "entretien" | "administration";
export type CentrePrincipal = "approvisionnement" | "production" | "distribution";
export type CodeDeCentre = CentreAuxiliaire | CentrePrincipal;

/** Une ligne de clés : la part de chaque centre, qui fait 100 % (la garde le vérifie). */
export type Cles = Readonly<Record<CodeDeCentre, number>>;

/**
 * Ce que mesure l'unité d'œuvre d'un centre principal : cent euros d'achats de composants, une
 * enceinte produite, ou cent euros de chiffre d'affaires.
 */
export interface UniteDOeuvre {
  libelle: string;
  nature: "achats" | "quantite" | "chiffreDAffaires";
  /** Ce que vaut une unité d'œuvre dans sa nature : 100 € d'achats, 1 enceinte, 100 € de CA. */
  assiette: number;
}

export interface CentresDuMois {
  /** La répartition primaire : chaque charge indirecte entre les cinq centres. */
  primaire: Readonly<Record<CodeDeCharge, Cles>>;
  /**
   * La répartition secondaire : ce que chaque centre auxiliaire cède aux autres. L'entretien sert
   * l'administration, et l'administration sert l'entretien : ce sont des prestations réciproques,
   * qui se calculent par un système de deux équations. Un centre ne se cède rien à lui-même.
   */
  secondaire: Readonly<Record<CentreAuxiliaire, Cles>>;
  unitesDOeuvre: Readonly<Record<CentrePrincipal, UniteDOeuvre>>;
  /** L'activité normale du mois, en enceintes : la base de l'imputation rationnelle. */
  activiteNormale: number;
}

/**
 * LES CLÉS DE RÉPARTITION DU COURS (l'arène ne découpe pas ses charges par centre). Le loyer selon
 * les surfaces, le personnel selon le temps passé, l'usure selon l'emploi de l'équipement. Les
 * parts de l'administration, de l'approvisionnement et de la distribution sont celles de
 * l'ancien chapitre (centres.ts) ; l'entretien est pris sur la production, dont il soigne la ligne.
 * Les taux réciproques (l'entretien cède 20 % à l'administration, qui lui en cède 10 %) sont posés
 * pour que le système tombe juste au centime : entretien 2 001,75 €, administration 4 009,50 €.
 */
export const CENTRES_DE_JANVIER: CentresDuMois = {
  primaire: {
    loyer: { entretien: 0.05, administration: 0.1, approvisionnement: 0.15, production: 0.5, distribution: 0.2 },
    personnel: { entretien: 0.05, administration: 0.15, approvisionnement: 0.1, production: 0.5, distribution: 0.2 },
    amortissement: { entretien: 0.1, administration: 0.05, approvisionnement: 0.05, production: 0.75, distribution: 0.05 },
  },
  secondaire: {
    entretien: { entretien: 0, administration: 0.2, approvisionnement: 0, production: 0.6, distribution: 0.2 },
    administration: { entretien: 0.1, administration: 0, approvisionnement: 0.2, production: 0.4, distribution: 0.3 },
  },
  unitesDOeuvre: {
    approvisionnement: { libelle: "100 € d'achats de composants", nature: "achats", assiette: 100 },
    production: { libelle: "une enceinte produite", nature: "quantite", assiette: 1 },
    distribution: { libelle: "100 € de chiffre d'affaires", nature: "chiffreDAffaires", assiette: 100 },
  },
  activiteNormale: 2_120,
};

/**
 * L'ACTIVITÉ NORMALE (hypothèse du cours) : 2 120 enceintes par mois, ce que la ligne et l'équipe
 * produisent sans heures de nuit ni chômage (la capacité, 7 000 enceintes au trimestre, en est le
 * plafond). Janvier tourne aux trois quarts de cette activité : 1 590 ÷ 2 120 = 0,75, et l'imputation
 * rationnelle laisse un quart des charges fixes en coût de sous-activité.
 */
export const ACTIVITE_NORMALE_DU_MOIS = CENTRES_DE_JANVIER.activiteNormale;

// ─────────────────────────────────────────────────────────────────────────────
// LA GAMME GO, ONE, STUDIO
// ─────────────────────────────────────────────────────────────────────────────

export type CodeDeReference = "go" | "one" | "studio";

export interface ReferenceDeLaGamme {
  code: CodeDeReference;
  nom: string;
  prix: number;
  coutVariableUnitaire: number;
  /** Les heures-machine d'une unité : l'unité d'œuvre des charges communes, et le facteur rare. */
  heuresMachineParUnite: number;
  /** Les unités vendues dans le mois en gamme. */
  quantite: number;
  /** La publicité de la référence : une charge fixe, mais propre à elle (une charge spécifique). */
  publicite: number;
  /** Ce que les clients demanderaient dans un mois de pointe, au prix du mois (le facteur rare). */
  demandeDuMoisDePointe: number;
}

export interface GammeDeNova {
  libelle: string;
  references: readonly ReferenceDeLaGamme[];
  /**
   * Les charges communes du mois, que rien ne rattache à une seule référence : le même loyer et la
   * même paie qu'en janvier, plus le contrat d'entretien et l'usure des deux lignes.
   */
  communes: Readonly<{ loyer: number; personnel: number; entretien: number; usure: number }>;
  /** Les heures-machine que les deux lignes donnent dans un mois : 7 000 enceintes One au trimestre. */
  capaciteHeuresMachine: number;
}

/**
 * LE MOIS EN GAMME (relevé sur le premier trimestre en gamme de l'arène, ramené à un mois) : les
 * quantités, les prix, les coûts variables, les heures et la publicité de chaque référence sont
 * ceux de l'arène. Les charges communes reprennent le loyer et la paie de janvier (30 350 € ;
 * l'arène en comptait 30 333 €) et l'usure de deux lignes à 833 € (1 666 € ; l'arène 1 667 €).
 * La demande du mois de pointe (décembre) est une hypothèse du cours : elle dépasse les
 * heures-machine du mois, pour que le facteur rare se voie.
 */
export const GAMME_DE_NOVA: GammeDeNova = {
  libelle: "la gamme Go, One et Studio",
  references: [
    { code: "go", nom: "NOVA Go", prix: 34, coutVariableUnitaire: 19, heuresMachineParUnite: 0.18, quantite: 195, publicite: 373, demandeDuMoisDePointe: 600 },
    { code: "one", nom: "NOVA One", prix: 59, coutVariableUnitaire: 38, heuresMachineParUnite: 0.3, quantite: 1_160, publicite: 1_233, demandeDuMoisDePointe: 1_500 },
    { code: "studio", nom: "NOVA Studio", prix: 129, coutVariableUnitaire: 70, heuresMachineParUnite: 0.5, quantite: 217, publicite: 393, demandeDuMoisDePointe: 400 },
  ],
  communes: { loyer: 19_700, personnel: 10_650, entretien: 1_562, usure: 1_666 },
  capaciteHeuresMachine: 700,
};

// ─────────────────────────────────────────────────────────────────────────────
// LA DÉCISION : LE PREMIER TRIMESTRE, LA DEMANDE, LA CAPACITÉ, LE SOUS-TRAITANT
// ─────────────────────────────────────────────────────────────────────────────

/**
 * LA DROITE DE DEMANDE DU TRIMESTRE (hypothèse du cours, figée) : au prix p, les clients demandent
 * à NOVA 16 755 − 203 × p enceintes par trimestre de janvier à mars, arrondies à l'unité inférieure
 * (on ne vend pas une fraction d'enceinte). UNE SEULE DEMANDE DE NOVA (réconciliation d'octobre
 * 2026) : à 59 €, la droite donne les 4 778 enceintes vendues au premier trimestre de N (1 270 +
 * 1 130 + 1 418 aux particuliers, 3 × 320 à CampusTech), car toute la demande de N a été servie
 * (nova-capacite.ts) : 16 755 = 4 778 + 203 × 59. La pente, 203 enceintes par euro, est celle que
 * les moindres carrés tiraient des trois rejeux du premier trimestre par l'arène (6 911, 5 762 et
 * 4 512 enceintes à 53,10 €, 59 € et 64,90 €). Les autres trimestres suivent la saison de N
 * (monde/economie-et-marketing.ts) ; le trimestre type du marché à trois est ce premier trimestre
 * (monde/marche-a-trois.ts). La garde tests/cours/une-seule-nova.test.ts compare ces fiches.
 */
export const DEMANDE_A_PRIX_NUL = 16_755;
export const DEMANDE_PERDUE_PAR_EURO = 203;

/** La capacité de la ligne de montage, en enceintes par trimestre (celle de l'arène). */
export const CAPACITE_DU_TRIMESTRE = 7_000;

/** Ce que le sous-traitant facture une enceinte livrée finie (celui de l'arène). */
export const COUT_DU_SOUS_TRAITANT = 52;

/** L'écart de prix que le dirigeant envisage, à la hausse ou à la baisse. */
export const ECART_DE_PRIX = 0.1;

export interface DecisionDuTrimestre {
  demande: { aPrixNul: number; perdueParEuro: number };
  /** Le prix du trimestre, et ce que le plan de production a fabriqué (et vendu). */
  prix: number;
  production: number;
  capacite: number;
  coutDuSousTraitant: number;
  /** Les charges fixes du trimestre : trois mois de janvier. */
  chargesFixes: number;
  ecartDePrix: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// LE SEMESTRE, MOIS PAR MOIS : LE BUDGET DE TRÉSORERIE ET LE TABLEAU DE BORD
// ─────────────────────────────────────────────────────────────────────────────

/** Le taux de TVA des ventes, des composants, des autres coûts variables et de l'équipement. */
export const TAUX_DE_TVA = 0.2;

/**
 * LE MOIS COMMERCIAL (convention du cours) : un délai en jours se lit sur des mois de 30 jours. Une
 * facture du 20 payée 80 jours après sa date tombe le 100e jour, le 10 du troisième mois suivant :
 * la facture de janvier de CampusTech, due en mars, se paie en avril.
 */
export const JOURS_DU_MOIS_COMMERCIAL = 30;

/**
 * LE DÉLAI CONVENU AVEC CAMPUSTECH : 60 jours après la facture, le délai maximal qu'un professionnel
 * peut convenir avec un autre (code de commerce, article L. 441-10). Une facture du 20 est due le 20
 * du deuxième mois suivant.
 */
export const DELAI_CONVENU_DE_CAMPUSTECH = 60;

/**
 * LE RETARD DE CAMPUSTECH (décision du propriétaire du cours : le délai légal est plafonné, mais des
 * clients paient en retard, c'est la réalité du marché). CampusTech est un MAUVAIS PAYEUR : elle paie
 * chaque facture 20 jours après l'échéance convenue, après une relance. C'est un fait de la fiche,
 * pas une hypothèse de chapitre : toutes les fiches du cours encaissent CampusTech à ce jour-là.
 */
export const RETARD_DE_CAMPUSTECH = 20;

/**
 * LE DÉLAI RÉEL DE CAMPUSTECH : le délai convenu et le retard, 80 jours après la facture, le 10 du
 * troisième mois suivant. Ce n'est jamais un délai convenu : c'est le jour où l'argent arrive.
 */
export const DELAI_DE_CAMPUSTECH = DELAI_CONVENU_DE_CAMPUSTECH + RETARD_DE_CAMPUSTECH;

export type CodeDeClientele = "particuliers" | "campustech";

export interface ClienteleDeNova {
  code: CodeDeClientele;
  nom: string;
  /** Les enceintes vendues chaque mois du semestre, de janvier à juin. */
  quantites: readonly number[];
  /** Le jour du mois où la clientèle est facturée, et son délai de paiement en jours (0 : comptant). */
  jourDeFacturation: number;
  delai: number;
}

export interface SemestreDeNova {
  mois: readonly { nom: string; jours: number }[];
  clienteles: readonly ClienteleDeNova[];
  tauxDeTva: number;
  /** Les jours d'un mois commercial, pour lire un délai en mois (JOURS_DU_MOIS_COMMERCIAL). */
  joursDuMoisCommercial: number;
  /** Le fournisseur de composants : il facture le 10 et se paie à 22 jours, le 1er du mois suivant. */
  fournisseur: { nom: string; jourDeFacturation: number; delai: number };
  /** Les salaires nets se versent le 28 ; les cotisations (salariales et patronales) le 15 du mois suivant. */
  paie: { net: number; cotisations: number };
  /**
   * L'emprunt de 80 000 € à 5 % l'an : 4 000 € de capital à chaque échéance trimestrielle, le
   * dernier jour du trimestre, avec les intérêts du trimestre sur le capital restant dû.
   */
  emprunt: { capitalRestantDu: number; tauxAnnuel: number; capitalParEcheance: number; moisDesEcheances: readonly number[] };
  /** L'investissement que le dirigeant envisage : il ne figure au budget que si un laboratoire le décide. */
  investissement: { libelle: string; montantHt: number; mois: number; dureeDAmortissementMois: number };
  tresorerieDeDepart: number;
  /** Les enceintes vendues par tout le marché chaque mois, NOVA et ses concurrents réunis. */
  marche: readonly number[];
}

/**
 * LES VENTES DU SEMESTRE (hypothèse du cours). CampusTech, le client professionnel, achète
 * 320 enceintes chaque mois, facturées le 20, dues à 60 jours et payées en retard, à 80 jours
 * (DELAI_DE_CAMPUSTECH), comme en janvier. Les
 * particuliers paient par carte à la commande. Février, mois court et calme, passe sous le seuil
 * (1 450 enceintes) ; le premier trimestre fait 4 778 enceintes et le deuxième 6 081, comme dans
 * l'arène. HYPOTHÈSE : NOVA n'a pas de stock, elle fabrique ce qu'elle vend et achète ses
 * composants le mois où elle les consomme.
 */
export const VENTES_DES_PARTICULIERS = [1_270, 1_130, 1_418, 1_580, 1_710, 1_831] as const;
export const VENTES_A_CAMPUSTECH = [320, 320, 320, 320, 320, 320] as const;

/**
 * LE MARCHÉ DES ENCEINTES (hypothèse du cours) : il grandit au printemps plus vite que NOVA, dont la
 * part passe de 26,5 % en janvier à 23,4 % en juin. Le chiffre d'affaires monte, la part baisse.
 */
export const MARCHE_DES_ENCEINTES = [6_000, 5_600, 6_500, 7_400, 8_300, 9_200] as const;

/**
 * LA TRÉSORERIE DE DÉPART, au 1er janvier : celle du bilan d'ouverture de l'année du cours (les
 * apports et l'emprunt ont financé l'installation). Aucune créance, aucune dette au départ.
 */
export const TRESORERIE_DE_DEPART = 25_000;

/**
 * L'INVESTISSEMENT ENVISAGÉ (hypothèse du cours) : un banc de mesure acoustique de 30 000 € hors
 * taxes, livré et payé en avril, amorti sur 60 mois (500 € par mois dès avril). Sa TVA se récupère
 * sur la déclaration d'avril, payée en mai. Avril est le mois où il met NOVA à découvert.
 */
export const INVESTISSEMENT_ENVISAGE = { libelle: "un banc de mesure acoustique", montantHt: 30_000, mois: 3, dureeDAmortissementMois: 60 } as const;

// ─────────────────────────────────────────────────────────────────────────────
// LE TABLEAU DE BORD : SES VOYANTS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * LES SEUILS D'ALERTE DU TABLEAU DE BORD (hypothèse du cours) : un voyant s'allume quand
 * l'indicateur passe sous son seuil. L'indice de sécurité sous 5 % (la vigilance commence avant la
 * perte) ; le résultat du mois sous 0 € ; la trésorerie de fin de mois sous 10 000 € (le matelas
 * que le dirigeant veut garder) ; la part de marché sous 25 %.
 */
export const SEUILS_D_ALERTE = { indiceDeSecurite: 0.05, resultat: 0, tresorerie: 10_000, partDeMarche: 0.25 } as const;

export type CodeDIndicateur = keyof typeof SEUILS_D_ALERTE;

// ─────────────────────────────────────────────────────────────────────────────
// LA FICHE
// ─────────────────────────────────────────────────────────────────────────────

export interface FicheDeGestion {
  code: string;
  entreprise: string;
  unite: string;
  unites: string;
  moisDeReference: MoisDeReference;
  centres: CentresDuMois;
  gamme: GammeDeNova;
  decision: DecisionDuTrimestre;
  semestre: SemestreDeNova;
  seuilsDAlerte: Readonly<Record<CodeDIndicateur, number>>;
}

const totalDesFixes = CHARGES_FIXES_DU_MOIS.loyer + CHARGES_FIXES_DU_MOIS.personnel + CHARGES_FIXES_DU_MOIS.amortissement;

export const NOVA_GESTION: FicheDeGestion = {
  code: "nova",
  entreprise: "NOVA",
  unite: "enceinte",
  unites: "enceintes",
  moisDeReference: {
    nom: "janvier",
    jours: 31,
    quantite: VENTES_DES_PARTICULIERS[0] + VENTES_A_CAMPUSTECH[0],
    prix: PRIX_DE_L_ENCEINTE,
    coutVariable: { composants: COMPOSANTS_PAR_ENCEINTE, autres: AUTRES_COUTS_PAR_ENCEINTE },
    autresCoutsVariables: "emballage, transport et énergie de la chaîne",
    chargesFixes: CHARGES_FIXES_DU_MOIS,
  },
  centres: CENTRES_DE_JANVIER,
  gamme: GAMME_DE_NOVA,
  decision: {
    demande: { aPrixNul: DEMANDE_A_PRIX_NUL, perdueParEuro: DEMANDE_PERDUE_PAR_EURO },
    prix: PRIX_DE_L_ENCEINTE,
    // Le plan du premier trimestre : ce qui s'est fabriqué et vendu de janvier à mars.
    production: [0, 1, 2].reduce((t, m) => t + VENTES_DES_PARTICULIERS[m]! + VENTES_A_CAMPUSTECH[m]!, 0),
    capacite: CAPACITE_DU_TRIMESTRE,
    coutDuSousTraitant: COUT_DU_SOUS_TRAITANT,
    chargesFixes: 3 * totalDesFixes,
    ecartDePrix: ECART_DE_PRIX,
  },
  semestre: {
    mois: [
      { nom: "janvier", jours: 31 },
      { nom: "février", jours: 28 },
      { nom: "mars", jours: 31 },
      { nom: "avril", jours: 30 },
      { nom: "mai", jours: 31 },
      { nom: "juin", jours: 30 },
    ],
    clienteles: [
      { code: "particuliers", nom: "Les particuliers, en ligne", quantites: VENTES_DES_PARTICULIERS, jourDeFacturation: 30, delai: 0 },
      { code: "campustech", nom: "CampusTech", quantites: VENTES_A_CAMPUSTECH, jourDeFacturation: 20, delai: DELAI_DE_CAMPUSTECH },
    ],
    tauxDeTva: TAUX_DE_TVA,
    joursDuMoisCommercial: JOURS_DU_MOIS_COMMERCIAL,
    fournisseur: { nom: "Électro-Composants Lyon", jourDeFacturation: 10, delai: 22 },
    paie: { net: 5_850, cotisations: 4_800 },
    emprunt: { capitalRestantDu: 80_000, tauxAnnuel: 0.05, capitalParEcheance: 4_000, moisDesEcheances: [2, 5] },
    investissement: INVESTISSEMENT_ENVISAGE,
    tresorerieDeDepart: TRESORERIE_DE_DEPART,
    marche: MARCHE_DES_ENCEINTES,
  },
  seuilsDAlerte: SEUILS_D_ALERTE,
};

/** Les fiches de gestion du monde du cours, par code d'entreprise. */
export const GESTION_DU_COURS: Readonly<Record<string, FicheDeGestion>> = { [NOVA_GESTION.code]: NOVA_GESTION };
