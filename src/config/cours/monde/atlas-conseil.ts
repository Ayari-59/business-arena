/**
 * LE MONDE DU COURS : ATLAS CONSEIL, LE CABINET DU COURS (le parcours BTS NDRC, l'affaire, le client
 * et le canal).
 *
 * ATLAS CONSEIL est un cabinet de conseil et de formation qui vend des journées d'intervention à des
 * entreprises et à des collectivités (voir l-escale.ts pour le principe du monde du cours : une
 * simulation figée, inspirée de l'arène, calculée par le cours). 10 consultants font les journées ;
 * 3 commerciaux les vendent, affaire par affaire. Cette fiche est la seule source des chiffres des
 * six chapitres du parcours ; le modèle qui les calcule est dans monde/relation-client.ts, et la garde
 * tests/cours/atlas-conseil.test.ts refait chaque chiffre à la main.
 *
 * UNE SEULE ANNÉE DE RÉFÉRENCE : L'ANNÉE N, TRIMESTRE PAR TRIMESTRE. Elle est écrite une fois, compte
 * par compte et commercial par commercial : 32 comptes, 1 920 journées vendues, 1 382 400 € hors taxes
 * de chiffre d'affaires. Tous les chapitres la lisent, et la garde vérifie que chaque façon de la
 * compter (par les comptes, par les commerciaux, par les trimestres) retombe sur le même total.
 * L'année N − 1 n'existe que là où le tableau de bord la compare.
 *
 * CE QUI VIENT DE L'ARÈNE, ET CE QUI A ÉTÉ CHOISI. Le métier, le nom, la ressource (la journée de
 * consultant, qui ne se stocke pas), la capacité de 60 jours facturables par consultant et par
 * trimestre, l'ordre de grandeur du prix de la journée (560 à 780 € selon la clientèle dans l'arène)
 * et des frais d'une journée (90 € dans l'arène), les trois clientèles et leurs sensibilités au prix
 * viennent des scénarios conseil et conseil-gamme. Le cabinet du cours est plus petit (10 consultants)
 * et son prix catalogue est un nombre rond (800 € la journée). Le portefeuille, les commerciaux, les
 * canaux de conquête, la courbe de la campagne, les partenaires et les objectifs sont des hypothèses du
 * cours, chacune dite à sa place.
 *
 * DEUX MARGES, À NE PAS CONFONDRE.
 *   - La MARGE SUR COÛT VARIABLE d'une journée : prix − 150 € de frais (le déplacement et les
 *     supports). C'est elle qui fixe le plancher d'une affaire en plus, sur une capacité qui resterait
 *     libre : les consultants sont payés de toute façon.
 *   - La MARGE D'UN COMPTE (marge sur coûts directs) : son chiffre d'affaires − ses frais − ses journées
 *     au coût journalier d'un consultant (220 €). C'est la mesure d'usage dans un cabinet : elle dit ce
 *     que le compte laisse une fois payé le temps de ceux qui le servent. Le portefeuille ABC, la valeur
 *     d'un client et le seuil de rentabilité d'un commercial la lisent.
 *
 * CONVENTIONS. Tout est hors taxes. L'année a quatre trimestres de 60 jours facturables par
 * consultant. Une mission signée dans un trimestre y est réalisée et facturée (des missions courtes).
 * Les charges fixes sont annuelles et tombent pour un quart chaque trimestre.
 */

// ─────────────────────────────────────────────────────────────────────────────
// LA JOURNÉE ET LA CAPACITÉ
// ─────────────────────────────────────────────────────────────────────────────

export type Trimestre = 1 | 2 | 3 | 4;

/** Le prix catalogue d'une journée d'intervention, hors taxes : celui que paie un client sans remise. */
export const PRIX_CATALOGUE = 800;

/**
 * LE COÛT VARIABLE D'UNE JOURNÉE : ce qu'elle coûte en plus de ce qui est payé de toute façon. Les frais
 * de mission (déplacement, repas, hébergement) en moyenne, 100 € ; les supports (documentation,
 * cahiers de formation, licences d'outils par participant), 50 €. Ensemble, 150 €.
 */
export const COUT_VARIABLE_D_UNE_JOURNEE = { fraisDeMission: 100, supports: 50 } as const;

/**
 * LES CONSULTANTS : 10, à 52 800 € par an chacun, salaire et cotisations patronales. Chacun peut
 * facturer 60 jours par trimestre (les autres jours vont aux congés, à la formation et à la
 * préparation) : 600 journées par trimestre, 2 400 par an. Leur coût journalier est leur coût de
 * l'année divisé par les jours qu'ils peuvent facturer : 528 000 € ÷ 2 400 = 220 €.
 */
export const CONSULTANTS = { nombre: 10, coutAnnuel: 52_800, joursFacturablesParTrimestre: 60 } as const;

/**
 * LES JOURNÉES DE L'ANNÉE N, trimestre par trimestre. Les demandées sont celles que les clients ont
 * voulues ; les vendues, celles que le cabinet a faites. Le trimestre 3 (l'été) est creux. Au
 * trimestre 4, le carnet est plein : 600 journées vendues sur 600, et 80 journées demandées ont été
 * refusées faute de consultant.
 */
export const JOURNEES_DEMANDEES: readonly number[] = [480, 510, 330, 680];
export const JOURNEES_VENDUES: readonly number[] = [480, 510, 330, 600];

// ─────────────────────────────────────────────────────────────────────────────
// LES CHARGES FIXES
// ─────────────────────────────────────────────────────────────────────────────

/**
 * LES CHARGES FIXES DE L'ANNÉE N : celles qui ne bougent pas avec les journées vendues. 921 600 €, soit
 * 230 400 € par trimestre. Les consultants (528 000 €) ; les trois commerciaux (186 000 €, le détail
 * est dans COMMERCIAUX) ; la prospection et la communication (52 000 € : les stands des salons
 * 17 200 €, la campagne digitale 24 000 €, les fichiers et l'outil de prospection 6 000 €, la
 * commission de l'apporteur d'affaires 4 800 €) ; le loyer et les charges des bureaux (66 000 €) ; la
 * direction et l'administration (78 000 €) ; les logiciels, les assurances et les amortissements
 * (11 600 €). HYPOTHÈSE DU COURS : la commission de l'apporteur, payée une fois pour un compte gagné,
 * est rangée avec la prospection de l'année.
 */
export const CHARGES_FIXES_DE_L_ANNEE = {
  consultants: 528_000,
  commerciaux: 186_000,
  prospection: 52_000,
  loyer: 66_000,
  direction: 78_000,
  logicielsEtAssurances: 11_600,
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// LES CLIENTÈLES ET LEUR SENSIBILITÉ AU PRIX
// ─────────────────────────────────────────────────────────────────────────────

export type CodeDeClientele = "grands-comptes" | "pme" | "public";

export interface ClienteleDuCabinet {
  code: CodeDeClientele;
  nom: string;
  /**
   * L'ÉLASTICITÉ DE LA DEMANDE AU PRIX (celle de l'arène) : un prix plus haut de 1 % fait demander
   * |élasticité| % de journées en moins à cette clientèle. La réponse est une droite.
   */
  elasticite: number;
}

/**
 * LES TROIS CLIENTÈLES, et leurs élasticités, celles du scénario conseil de l'arène. Les grands comptes
 * achètent la relation et la fiabilité : ils tiennent le mieux le prix (−0,7). Les PME et les ETI
 * comparent (−1,6). Le secteur public achète sur appel d'offres, où le prix pèse lourd (−1,5).
 */
export const CLIENTELES: readonly ClienteleDuCabinet[] = [
  { code: "grands-comptes", nom: "Grands comptes", elasticite: -0.7 },
  { code: "pme", nom: "PME et ETI", elasticite: -1.6 },
  { code: "public", nom: "Secteur public", elasticite: -1.5 },
];

// ─────────────────────────────────────────────────────────────────────────────
// L'AFFAIRE NÉGOCIÉE
// ─────────────────────────────────────────────────────────────────────────────

/**
 * L'AFFAIRE QUI SE NÉGOCIE (hypothèse du cours). Le groupe Orvane, une ETI de l'ameublement qui n'est pas
 * encore client, veut confier 30 journées de formation de ses managers à ATLAS CONSEIL et demande 20 %
 * de remise sur le prix catalogue. Puis, pour un second programme de 50 journées, il propose 400 € la
 * journée : sous le coût complet, au-dessus du coût variable. Le commercial regarde où le placer : au
 * trimestre 3, creux, ou au trimestre 4, plein.
 */
export const AFFAIRE = {
  client: "le groupe Orvane",
  secteur: "Ameublement",
  journees: 30,
  remiseDemandee: 0.2,
  contreProposition: { journees: 50, prix: 400 },
} as const;

/**
 * LE PRIX DES JOURNÉES QU'UNE AFFAIRE PRENDRAIT À D'AUTRES CLIENTS (hypothèse du cours) : le prix
 * catalogue. Quand le carnet est plein, les journées qui manquent sont celles des demandes de
 * dernière minute, que les clients paient sans remise.
 */
export const PRIX_DES_JOURNEES_DEPLACEES = PRIX_CATALOGUE;

// ─────────────────────────────────────────────────────────────────────────────
// LE PORTEFEUILLE DE COMPTES DE L'ANNÉE N
// ─────────────────────────────────────────────────────────────────────────────

export type CodeDeCommercial = "grands-comptes" | "entreprises" | "conquete";
export type CodeDeCanal = "prospection" | "salons" | "digital" | "apporteurs";

export interface CompteClient {
  code: string;
  /** Le nom de l'entreprise cliente (fictif). */
  nom: string;
  /** Son secteur d'activité. */
  secteur: string;
  clientele: CodeDeClientele;
  /** Le commercial qui suit le compte. */
  commercial: CodeDeCommercial;
  /** Les années pleines depuis la première mission ; 0 : un compte gagné dans l'année N. */
  anciennete: number;
  /** Le canal qui a amené un compte gagné dans l'année N ; null pour un compte plus ancien. */
  origine: CodeDeCanal | null;
  /** Les journées vendues au compte dans l'année N. */
  journees: number;
  /** Son chiffre d'affaires de l'année N, hors taxes : ses journées à son prix, remise comprise. */
  chiffreDAffaires: number;
  /** Ses frais de l'année : déplacements, hébergement et supports (élevés quand les sites sont loin). */
  frais: number;
  /** Sa marge sur coûts directs : chiffre d'affaires − frais − journées × 220 € (le temps des consultants). */
  marge: number;
  /** Le risque de le perdre l'an prochain, estimé par son commercial (0,3 : trois chances sur dix). */
  attrition: number;
}

/**
 * LE PORTEFEUILLE DE L'ANNÉE N : les 32 comptes qui ont acheté au moins une journée, dans l'ordre du
 * fichier clients (alphabétique). Il fait 1 920 journées, 1 382 400 € de chiffre d'affaires, 288 000 €
 * de frais (150 € par journée en moyenne) et 672 000 € de marge sur coûts directs, soit 21 000 € par
 * compte. 8 comptes sont neufs (ancienneté 0), gagnés par les quatre canaux de conquête.
 *
 * Il est calibré pour que la méthode ABC dise quelque chose. Par le chiffre d'affaires, 8 comptes
 * (25 %) font 77,2 % des ventes : près des 20/80, sans y être. Par la marge, la classe A change :
 * le Centre hospitalier de Valbrune, troisième compte par le chiffre d'affaires, gagné sur appel
 * d'offres à 560 € la journée et servi sur des sites lointains, ne laisse que 14 000 € et sort de A ;
 * la Banque Ferrand et Associés, neuvième par le chiffre d'affaires mais payée au prix catalogue, tout
 * près, y entre. Les risques de perte estimés s'additionnent à 8 comptes : 25 % du portefeuille.
 */
export const COMPTES: readonly CompteClient[] = [
  { code: "queric", nom: "Ambulances Quéric", secteur: "Transport sanitaire", clientele: "pme", commercial: "entreprises", anciennete: 1, origine: null, journees: 6, chiffreDAffaires: 4_800, frais: 600, marge: 2_880, attrition: 0.3 },
  { code: "arveon", nom: "Arvéon Aéronautique", secteur: "Industrie aéronautique", clientele: "grands-comptes", commercial: "grands-comptes", anciennete: 9, origine: null, journees: 240, chiffreDAffaires: 172_800, frais: 31_200, marge: 88_800, attrition: 0.05 },
  { code: "corvane", nom: "Atelier Corvane Design", secteur: "Design", clientele: "pme", commercial: "entreprises", anciennete: 1, origine: null, journees: 2, chiffreDAffaires: 1_600, frais: 200, marge: 960, attrition: 0.3 },
  { code: "ferrand", nom: "Banque Ferrand et Associés", secteur: "Banque", clientele: "grands-comptes", commercial: "grands-comptes", anciennete: 2, origine: null, journees: 70, chiffreDAffaires: 56_000, frais: 4_200, marge: 36_400, attrition: 0.15 },
  { code: "bastide", nom: "Bastide Assurances", secteur: "Assurance", clientele: "grands-comptes", commercial: "grands-comptes", anciennete: 6, origine: null, journees: 180, chiffreDAffaires: 126_000, frais: 23_400, marge: 63_000, attrition: 0.1 },
  { code: "malvine", nom: "Biscuiterie Malvine", secteur: "Agroalimentaire", clientele: "pme", commercial: "entreprises", anciennete: 2, origine: null, journees: 8, chiffreDAffaires: 6_400, frais: 800, marge: 3_840, attrition: 0.3 },
  { code: "blanchet", nom: "Blanchisserie Blanchet", secteur: "Blanchisserie industrielle", clientele: "pme", commercial: "entreprises", anciennete: 2, origine: null, journees: 3, chiffreDAffaires: 2_400, frais: 300, marge: 1_440, attrition: 0.3 },
  { code: "vauclair", nom: "Cabinet Vauclair Expertise", secteur: "Expertise comptable", clientele: "pme", commercial: "entreprises", anciennete: 6, origine: null, journees: 8, chiffreDAffaires: 6_400, frais: 800, marge: 3_840, attrition: 0.3 },
  { code: "ardel", nom: "Cartonnages Ardel", secteur: "Emballage", clientele: "pme", commercial: "conquete", anciennete: 0, origine: "prospection", journees: 40, chiffreDAffaires: 30_000, frais: 6_400, marge: 14_800, attrition: 0.3 },
  { code: "saint-erbin", nom: "Cave coopérative de Saint-Erbin", secteur: "Viticulture", clientele: "pme", commercial: "entreprises", anciennete: 1, origine: null, journees: 2, chiffreDAffaires: 1_600, frais: 200, marge: 960, attrition: 0.3 },
  { code: "valbrune", nom: "Centre hospitalier de Valbrune", secteur: "Santé", clientele: "public", commercial: "grands-comptes", anciennete: 4, origine: null, journees: 280, chiffreDAffaires: 156_800, frais: 81_200, marge: 14_000, attrition: 0.3 },
  { code: "dubreuil", nom: "Charpentes Dubreuil", secteur: "Bâtiment", clientele: "pme", commercial: "entreprises", anciennete: 1, origine: null, journees: 4, chiffreDAffaires: 3_200, frais: 400, marge: 1_920, attrition: 0.3 },
  { code: "verdasse", nom: "Communauté de communes du Haut-Verdasse", secteur: "Collectivité territoriale", clientele: "public", commercial: "grands-comptes", anciennete: 2, origine: null, journees: 6, chiffreDAffaires: 3_840, frais: 1_200, marge: 1_320, attrition: 0.25 },
  { code: "morand", nom: "Électricité Morand", secteur: "Électricité générale", clientele: "pme", commercial: "conquete", anciennete: 0, origine: "prospection", journees: 24, chiffreDAffaires: 18_000, frais: 3_600, marge: 9_120, attrition: 0.3 },
  { code: "roudier", nom: "Garage Roudier Poids Lourds", secteur: "Réparation de véhicules", clientele: "pme", commercial: "entreprises", anciennete: 5, origine: null, journees: 7, chiffreDAffaires: 5_600, frais: 700, marge: 3_360, attrition: 0.3 },
  { code: "helianthe", nom: "Hélianthe Énergies", secteur: "Énergie", clientele: "grands-comptes", commercial: "grands-comptes", anciennete: 0, origine: "apporteurs", journees: 60, chiffreDAffaires: 48_000, frais: 3_600, marge: 31_200, attrition: 0.3 },
  { code: "pervenche", nom: "Immobilière Pervenche", secteur: "Immobilier", clientele: "pme", commercial: "conquete", anciennete: 0, origine: "digital", journees: 28, chiffreDAffaires: 21_000, frais: 4_600, marge: 10_240, attrition: 0.3 },
  { code: "garance", nom: "Imprimerie Garance", secteur: "Imprimerie", clientele: "pme", commercial: "entreprises", anciennete: 4, origine: null, journees: 9, chiffreDAffaires: 7_200, frais: 900, marge: 4_320, attrition: 0.3 },
  { code: "kerval", nom: "Kerval Distribution", secteur: "Distribution", clientele: "pme", commercial: "entreprises", anciennete: 3, origine: null, journees: 120, chiffreDAffaires: 96_000, frais: 10_560, marge: 59_040, attrition: 0.15 },
  { code: "serenoa", nom: "Laboratoires Sérénoa", secteur: "Industrie pharmaceutique", clientele: "pme", commercial: "entreprises", anciennete: 5, origine: null, journees: 180, chiffreDAffaires: 136_800, frais: 18_000, marge: 79_200, attrition: 0.1 },
  { code: "montbreme", nom: "Laiteries Montbrême", secteur: "Agroalimentaire", clientele: "pme", commercial: "entreprises", anciennete: 8, origine: null, journees: 154, chiffreDAffaires: 117_040, frais: 21_560, marge: 61_600, attrition: 0.05 },
  { code: "quartzel", nom: "Logiciels Quartzel", secteur: "Édition de logiciels", clientele: "pme", commercial: "conquete", anciennete: 0, origine: "digital", journees: 36, chiffreDAffaires: 27_000, frais: 5_400, marge: 13_680, attrition: 0.3 },
  { code: "maelle", nom: "Maëlle Voyages", secteur: "Tourisme", clientele: "pme", commercial: "entreprises", anciennete: 6, origine: null, journees: 3, chiffreDAffaires: 2_400, frais: 300, marge: 1_440, attrition: 0.3 },
  { code: "rouviere", nom: "Menuiseries Rouvière", secteur: "Bâtiment", clientele: "pme", commercial: "entreprises", anciennete: 0, origine: "salons", journees: 24, chiffreDAffaires: 19_200, frais: 1_384, marge: 12_536, attrition: 0.3 },
  { code: "granvaux", nom: "Métropole de Granvaux", secteur: "Collectivité territoriale", clientele: "public", commercial: "grands-comptes", anciennete: 3, origine: null, journees: 160, chiffreDAffaires: 102_400, frais: 35_200, marge: 32_000, attrition: 0.2 },
  { code: "lorvan", nom: "Pépinières Lorvan", secteur: "Horticulture", clientele: "pme", commercial: "entreprises", anciennete: 3, origine: null, journees: 6, chiffreDAffaires: 4_800, frais: 600, marge: 2_880, attrition: 0.3 },
  { code: "sauvagine", nom: "Résidences hôtelières Sauvagine", secteur: "Hôtellerie", clientele: "pme", commercial: "conquete", anciennete: 0, origine: "prospection", journees: 32, chiffreDAffaires: 24_000, frais: 4_800, marge: 12_160, attrition: 0.3 },
  { code: "ostrea", nom: "Résidences Ostréa", secteur: "Hébergement des personnes âgées", clientele: "pme", commercial: "entreprises", anciennete: 2, origine: null, journees: 5, chiffreDAffaires: 4_000, frais: 500, marge: 2_400, attrition: 0.3 },
  { code: "ambrette", nom: "Savonnerie Ambrette", secteur: "Cosmétique", clientele: "pme", commercial: "entreprises", anciennete: 4, origine: null, journees: 5, chiffreDAffaires: 4_000, frais: 500, marge: 2_400, attrition: 0.3 },
  { code: "morvelle", nom: "Syndicat des eaux du Morvelle", secteur: "Service public de l'eau", clientele: "public", commercial: "grands-comptes", anciennete: 5, origine: null, journees: 8, chiffreDAffaires: 5_120, frais: 1_696, marge: 1_664, attrition: 0.25 },
  { code: "ducastel", nom: "Transports Ducastel", secteur: "Transport et logistique", clientele: "pme", commercial: "entreprises", anciennete: 7, origine: null, journees: 200, chiffreDAffaires: 160_000, frais: 22_000, marge: 94_000, attrition: 0.1 },
  { code: "lumen", nom: "Verreries Lumen", secteur: "Industrie verrière", clientele: "pme", commercial: "entreprises", anciennete: 0, origine: "salons", journees: 10, chiffreDAffaires: 8_000, frais: 1_200, marge: 4_600, attrition: 0.3 },
];

// ─────────────────────────────────────────────────────────────────────────────
// LE PORTEFEUILLE D'ANNÉE EN ANNÉE
// ─────────────────────────────────────────────────────────────────────────────

export interface AnneeDuPortefeuille {
  annee: "N-2" | "N-1" | "N";
  /** Les comptes au 1er janvier : ceux qui avaient acheté l'année d'avant. */
  auPremierJanvier: number;
  /** Ceux d'entre eux qui n'ont rien acheté dans l'année : les comptes perdus. */
  perdus: number;
  /** Les comptes gagnés dans l'année. */
  nouveaux: number;
}

/**
 * TROIS ANNÉES DE PORTEFEUILLE (hypothèse du cours). Le cabinet gagne 8 comptes par an ; il en perd de
 * plus en plus : 5 sur 28 en N − 2, 7 sur 31 en N − 1, 8 sur 32 en N (le commercial de la conquête est
 * parti en décembre N − 1, et ses comptes ont moins été suivis). En N, l'attrition atteint 25 % : les
 * départs égalent les recrues, et le portefeuille ne grossit plus.
 */
export const PORTEFEUILLE_DES_ANNEES: readonly AnneeDuPortefeuille[] = [
  { annee: "N-2", auPremierJanvier: 28, perdus: 5, nouveaux: 8 },
  { annee: "N-1", auPremierJanvier: 31, perdus: 7, nouveaux: 8 },
  { annee: "N", auPremierJanvier: 32, perdus: 8, nouveaux: 8 },
];

/**
 * LE TAUX D'ACTUALISATION DU CABINET (hypothèse du cours) : 10 % par an. C'est ce que le cabinet attend
 * d'un euro placé dans son développement : un euro de marge dans un an en vaut 1 ÷ 1,1 aujourd'hui.
 * Il sert à la valeur vie client actualisée.
 */
export const TAUX_D_ACTUALISATION = 0.1;

// ─────────────────────────────────────────────────────────────────────────────
// LES CANAUX DE CONQUÊTE ET LEUR ENTONNOIR
// ─────────────────────────────────────────────────────────────────────────────

export interface CanalDeConquete {
  code: CodeDeCanal;
  nom: string;
  /** Les contacts de l'année : appels, visiteurs du stand, demandes en ligne, présentations. */
  contacts: number;
  /** Les premiers rendez-vous obtenus avec ces contacts. */
  rendezVous: number;
  /** Les devis (propositions chiffrées) remis après ces rendez-vous. */
  devis: number;
  /** Les contrats signés : autant de comptes gagnés dans l'année. */
  contrats: number;
  /** Ce que le canal a coûté dans l'année, temps des commerciaux compris. */
  cout: number;
}

/**
 * LES QUATRE CANAUX DE L'ANNÉE N, de l'entonnoir au contrat (hypothèses du cours). Ensemble, ils ont
 * coûté 120 000 € et gagné les 8 comptes neufs : 15 000 € par compte.
 *   - La prospection téléphonique et les visites : le commercial de la conquête à plein temps (48 000 €)
 *     et son fichier et son outil (6 000 €), 54 000 € ; 1 200 appels, 60 rendez-vous, 15 devis,
 *     3 contrats.
 *   - Les salons professionnels : les stands et les déplacements (17 200 €) et les journées que les
 *     2 commerciaux seniors y passent, avec les rendez-vous qui suivent (20 000 €, une part de leur
 *     coût), 37 200 € ; 400 visiteurs, 40 rendez-vous, 8 devis, 2 contrats.
 *   - La campagne digitale (réseaux professionnels, webinaires) : 24 000 € ; 600 demandes, 50
 *     rendez-vous, 10 devis, 2 contrats.
 *   - Les apporteurs d'affaires : la commission sur le compte apporté (10 % de son chiffre d'affaires
 *     de la première année, 48 000 €), 4 800 € ; 4 présentations, 4 rendez-vous, 2 devis, 1 contrat.
 */
export const CANAUX: readonly CanalDeConquete[] = [
  { code: "prospection", nom: "Prospection téléphonique et visites", contacts: 1_200, rendezVous: 60, devis: 15, contrats: 3, cout: 54_000 },
  { code: "salons", nom: "Salons professionnels", contacts: 400, rendezVous: 40, devis: 8, contrats: 2, cout: 37_200 },
  { code: "digital", nom: "Campagne digitale", contacts: 600, rendezVous: 50, devis: 10, contrats: 2, cout: 24_000 },
  { code: "apporteurs", nom: "Apporteurs d'affaires", contacts: 4, rendezVous: 4, devis: 2, contrats: 1, cout: 4_800 },
];

/** Un point de la courbe de la campagne : un budget de l'année et les contacts qu'il amène. */
export interface PalierDeLaCampagne {
  budget: number;
  contacts: number;
}

/**
 * LA COURBE DE LA CAMPAGNE DIGITALE (hypothèse du cours) : les contacts qu'amène un budget annuel, à
 * cinq paliers, de zéro au double du budget de N (24 000 €). Entre deux paliers, la courbe est une
 * droite (on interpole) ; au-delà du dernier, elle ne monte plus. Elle est CONCAVE : chaque tranche de
 * 12 000 € amène moins de contacts que la précédente (360, 240, 120, puis 30), car la campagne touche
 * d'abord les entreprises les plus faciles à convaincre. Les contacts suivent ensuite l'entonnoir de la
 * campagne de N : 1 contact sur 300 devient un compte.
 */
export const COURBE_DE_LA_CAMPAGNE: readonly PalierDeLaCampagne[] = [
  { budget: 0, contacts: 0 },
  { budget: 12_000, contacts: 360 },
  { budget: 24_000, contacts: 600 },
  { budget: 36_000, contacts: 720 },
  { budget: 48_000, contacts: 750 },
];

// ─────────────────────────────────────────────────────────────────────────────
// LES PARTENAIRES
// ─────────────────────────────────────────────────────────────────────────────

export type CodeDePartenaire = "apporteur" | "plateforme";

export interface PartenaireDuCabinet {
  code: CodeDePartenaire;
  nom: string;
  /** La commission, en part du chiffre d'affaires du compte apporté. */
  commission: number;
  /**
   * La part des comptes apportés qui, après leur première année, signent leurs missions suivantes en
   * direct, sans commission. 1 : la commission ne se paie que la première année.
   */
  partQuiRevientEnDirect: number;
}

/**
 * LES DEUX PARTENAIRES (hypothèses du cours).
 *   - L'apporteur d'affaires, un ancien dirigeant qui présente des entreprises de son réseau : 10 % du
 *     chiffre d'affaires de la première année du compte apporté, une seule fois.
 *   - La plateforme de mise en relation entre entreprises et cabinets, qui propose ses services : 20 %
 *     du chiffre d'affaires de chaque mission passée par elle. Après la première année, 40 % des comptes
 *     signent en direct ; les autres restent sur la plateforme, et la commission se paie chaque année.
 */
export const PARTENAIRES: readonly PartenaireDuCabinet[] = [
  { code: "apporteur", nom: "Apporteur d'affaires", commission: 0.1, partQuiRevientEnDirect: 1 },
  { code: "plateforme", nom: "Plateforme de mise en relation", commission: 0.2, partQuiRevientEnDirect: 0.4 },
];

// ─────────────────────────────────────────────────────────────────────────────
// LA MÉTHODE ABC
// ─────────────────────────────────────────────────────────────────────────────

/**
 * LES SEUILS DE LA MÉTHODE ABC, en part cumulée : la classe A réunit les comptes qui font ensemble les
 * premiers 80 %, la classe B ceux qui mènent à 95 %, la classe C le reste. C'est la convention des
 * manuels de BTS (celle du chapitre) ; le compte qui fait passer un seuil appartient à la classe
 * suivante.
 */
export const SEUILS_ABC = { a: 0.8, b: 0.95 } as const;

// ─────────────────────────────────────────────────────────────────────────────
// LES COMMERCIAUX ET LEUR TABLEAU DE BORD
// ─────────────────────────────────────────────────────────────────────────────

/** L'activité d'un commercial dans un trimestre de N − 1. */
export interface TrimestreDuCommercial {
  rendezVous: number;
  devis: number;
  /** Les contrats signés (et réalisés) dans le trimestre. */
  contrats: number;
  chiffreDAffaires: number;
}

/** L'activité d'un commercial dans un trimestre de N, avec les journées vendues et l'objectif. */
export interface TrimestreDuCommercialEnN extends TrimestreDuCommercial {
  journees: number;
  /** L'objectif de chiffre d'affaires fixé en décembre N − 1. */
  objectif: number;
}

export interface CommercialDuCabinet {
  code: CodeDeCommercial;
  /** Un prénom fictif, pour les textes. */
  prenom: string;
  poste: string;
  /** Le salaire et les cotisations patronales d'un trimestre. */
  salaireCharge: number;
  /** Les frais d'un trimestre : la voiture, les déplacements, le téléphone. */
  frais: number;
  /** Les quatre trimestres de N, puis ceux de N − 1 sur le même secteur. */
  n: readonly TrimestreDuCommercialEnN[];
  nMoins1: readonly TrimestreDuCommercial[];
}

/**
 * LES TROIS COMMERCIAUX (hypothèses du cours). Chacun suit les comptes de son secteur ; ses quatre
 * trimestres de N refont exactement les journées et le chiffre d'affaires de ses comptes.
 *   - Marc, les grands comptes et le secteur public : 18 000 € par trimestre. Ses affaires sont grosses
 *     (plus de 20 000 € par contrat) et ses comptes laissent 40 % de marge. Il tient ses objectifs.
 *   - Nadia, les entreprises (PME et ETI) : 16 500 € par trimestre. Son chiffre d'affaires tient
 *     l'objectif, mais elle signe de moins en moins de devis : 31 % au trimestre 1, 22 % au
 *     trimestre 3 (les salons et la campagne lui amènent des demandes moins mûres).
 *   - Hugo, la conquête, arrivé en janvier N à la place d'un commercial expérimenté parti en
 *     décembre : 12 000 € par trimestre. Ses comptes neufs laissent 50 % de marge ; il lui faut donc
 *     24 000 € de chiffre d'affaires par trimestre pour payer son coût. Il est sous ce seuil aux
 *     trimestres 1 et 2, au-dessus ensuite, et sur l'année.
 */
export const COMMERCIAUX: readonly CommercialDuCabinet[] = [
  {
    code: "grands-comptes",
    prenom: "Marc",
    poste: "Commercial grands comptes et secteur public",
    salaireCharge: 14_400,
    frais: 3_600,
    n: [
      { rendezVous: 40, devis: 25, contrats: 8, chiffreDAffaires: 176_000, journees: 264, objectif: 175_000 },
      { rendezVous: 42, devis: 25, contrats: 8, chiffreDAffaires: 184_000, journees: 276, objectif: 185_000 },
      { rendezVous: 28, devis: 18, contrats: 5, chiffreDAffaires: 109_600, journees: 164, objectif: 110_000 },
      { rendezVous: 44, devis: 26, contrats: 8, chiffreDAffaires: 201_360, journees: 300, objectif: 200_000 },
    ],
    nMoins1: [
      { rendezVous: 38, devis: 24, contrats: 8, chiffreDAffaires: 168_000 },
      { rendezVous: 40, devis: 25, contrats: 8, chiffreDAffaires: 176_000 },
      { rendezVous: 26, devis: 16, contrats: 5, chiffreDAffaires: 104_000 },
      { rendezVous: 42, devis: 25, contrats: 8, chiffreDAffaires: 192_000 },
    ],
  },
  {
    code: "entreprises",
    prenom: "Nadia",
    poste: "Commerciale entreprises (PME et ETI)",
    salaireCharge: 13_200,
    frais: 3_300,
    n: [
      { rendezVous: 50, devis: 42, contrats: 13, chiffreDAffaires: 156_000, journees: 200, objectif: 155_000 },
      { rendezVous: 58, devis: 48, contrats: 13, chiffreDAffaires: 161_200, journees: 206, objectif: 160_000 },
      { rendezVous: 44, devis: 36, contrats: 8, chiffreDAffaires: 94_840, journees: 122, objectif: 95_000 },
      { rendezVous: 68, devis: 56, contrats: 13, chiffreDAffaires: 179_400, journees: 228, objectif: 180_000 },
    ],
    nMoins1: [
      { rendezVous: 44, devis: 38, contrats: 13, chiffreDAffaires: 150_000 },
      { rendezVous: 45, devis: 38, contrats: 13, chiffreDAffaires: 155_000 },
      { rendezVous: 30, devis: 24, contrats: 8, chiffreDAffaires: 91_000 },
      { rendezVous: 48, devis: 40, contrats: 14, chiffreDAffaires: 172_000 },
    ],
  },
  {
    code: "conquete",
    prenom: "Hugo",
    poste: "Commercial junior, conquête de nouveaux comptes",
    salaireCharge: 9_600,
    frais: 2_400,
    n: [
      { rendezVous: 36, devis: 10, contrats: 2, chiffreDAffaires: 12_000, journees: 16, objectif: 15_000 },
      { rendezVous: 40, devis: 11, contrats: 3, chiffreDAffaires: 21_000, journees: 28, objectif: 25_000 },
      { rendezVous: 34, devis: 10, contrats: 3, chiffreDAffaires: 33_000, journees: 44, objectif: 30_000 },
      { rendezVous: 46, devis: 14, contrats: 5, chiffreDAffaires: 54_000, journees: 72, objectif: 45_000 },
    ],
    nMoins1: [
      { rendezVous: 40, devis: 12, contrats: 4, chiffreDAffaires: 36_000 },
      { rendezVous: 42, devis: 12, contrats: 4, chiffreDAffaires: 40_000 },
      { rendezVous: 30, devis: 9, contrats: 3, chiffreDAffaires: 28_000 },
      { rendezVous: 44, devis: 14, contrats: 5, chiffreDAffaires: 46_000 },
    ],
  },
];

export type CodeDIndicateurCommercial = "realisationDeLObjectif" | "tauxDeTransformation" | "evolutionSurNMoins1" | "seuilDeRentabilite";

/** Un seuil d'alerte : le voyant s'allume sous un plancher, ou au-dessus d'un plafond. */
export interface SeuilDAlerte {
  seuil: number;
  sens: "plancher" | "plafond";
}

/**
 * LES SEUILS D'ALERTE DU TABLEAU DE BORD COMMERCIAL (hypothèses du cours), trimestre par trimestre et
 * commercial par commercial. Un voyant s'allume sous 95 % de l'objectif de chiffre d'affaires ; sous
 * 25 % de devis transformés en contrats ; sur un chiffre d'affaires en recul de plus de 5 % sur le même
 * trimestre de N − 1 ; et sous le seuil de rentabilité du commercial (le seuil est propre à chacun : la
 * valeur 1 dit que le chiffre d'affaires doit l'atteindre).
 */
export const SEUILS_D_ALERTE: Readonly<Record<CodeDIndicateurCommercial, SeuilDAlerte>> = {
  realisationDeLObjectif: { seuil: 0.95, sens: "plancher" },
  tauxDeTransformation: { seuil: 0.25, sens: "plancher" },
  evolutionSurNMoins1: { seuil: -0.05, sens: "plancher" },
  seuilDeRentabilite: { seuil: 1, sens: "plancher" },
};

// ─────────────────────────────────────────────────────────────────────────────
// LA FICHE
// ─────────────────────────────────────────────────────────────────────────────

export interface FicheDuCabinet {
  code: string;
  entreprise: string;
  unite: string;
  unites: string;
  anneeDeReference: string;
  prixCatalogue: number;
  coutVariableDUneJournee: { readonly fraisDeMission: number; readonly supports: number };
  consultants: { readonly nombre: number; readonly coutAnnuel: number; readonly joursFacturablesParTrimestre: number };
  journeesDemandees: readonly number[];
  journeesVendues: readonly number[];
  chargesFixes: Readonly<Record<keyof typeof CHARGES_FIXES_DE_L_ANNEE, number>>;
  clienteles: readonly ClienteleDuCabinet[];
  affaire: {
    readonly client: string;
    readonly secteur: string;
    readonly journees: number;
    readonly remiseDemandee: number;
    readonly contreProposition: { readonly journees: number; readonly prix: number };
  };
  prixDesJourneesDeplacees: number;
  comptes: readonly CompteClient[];
  portefeuilleDesAnnees: readonly AnneeDuPortefeuille[];
  tauxDActualisation: number;
  canaux: readonly CanalDeConquete[];
  courbeDeLaCampagne: readonly PalierDeLaCampagne[];
  partenaires: readonly PartenaireDuCabinet[];
  seuilsABC: { readonly a: number; readonly b: number };
  commerciaux: readonly CommercialDuCabinet[];
  seuilsDAlerte: Readonly<Record<CodeDIndicateurCommercial, SeuilDAlerte>>;
}

export const ATLAS_CONSEIL: FicheDuCabinet = {
  code: "conseil",
  entreprise: "ATLAS CONSEIL",
  unite: "journée",
  unites: "journées",
  anneeDeReference: "l'année N",
  prixCatalogue: PRIX_CATALOGUE,
  coutVariableDUneJournee: COUT_VARIABLE_D_UNE_JOURNEE,
  consultants: CONSULTANTS,
  journeesDemandees: JOURNEES_DEMANDEES,
  journeesVendues: JOURNEES_VENDUES,
  chargesFixes: CHARGES_FIXES_DE_L_ANNEE,
  clienteles: CLIENTELES,
  affaire: AFFAIRE,
  prixDesJourneesDeplacees: PRIX_DES_JOURNEES_DEPLACEES,
  comptes: COMPTES,
  portefeuilleDesAnnees: PORTEFEUILLE_DES_ANNEES,
  tauxDActualisation: TAUX_D_ACTUALISATION,
  canaux: CANAUX,
  courbeDeLaCampagne: COURBE_DE_LA_CAMPAGNE,
  partenaires: PARTENAIRES,
  seuilsABC: SEUILS_ABC,
  commerciaux: COMMERCIAUX,
  seuilsDAlerte: SEUILS_D_ALERTE,
};

/** Les cabinets du monde du cours, par code d'entreprise. */
export const CABINETS_DU_COURS: Readonly<Record<string, FicheDuCabinet>> = { [ATLAS_CONSEIL.code]: ATLAS_CONSEIL };
