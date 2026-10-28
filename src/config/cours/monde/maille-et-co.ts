/**
 * LE MONDE DU COURS : MAILLE & CO, LA BOUTIQUE DU COURS (le parcours BTS MCO, le point de vente).
 *
 * MAILLE & CO dessine une collection de maille, la fait tricoter par des façonniers et la vend
 * dans sa boutique de centre-ville (voir l-escale.ts pour le principe du monde du cours : une
 * simulation figée, inspirée de l'arène, calculée par le cours). Cette fiche est la seule source
 * des chiffres des dix chapitres du parcours ; le modèle qui les calcule est dans
 * monde/boutique.ts, et la garde tests/cours/maille-et-co.test.ts refait chaque chiffre à la main.
 *
 * UN SEUL MOIS DE RÉFÉRENCE : JANVIER DE L'ANNÉE N. Les anciens chapitres donnaient au mois de la
 * boutique quatre chiffres d'affaires différents (85 603,50 €, 85 107 €, 85 610 € et 85 090 €).
 * Ici, le mois est écrit une fois, référence par référence et clientèle par clientèle : 1 530
 * articles, 87 450 € hors taxes, 948 passages en caisse, 3 848 entrées. Tous les chapitres le
 * lisent, et la garde vérifie que chaque façon de le compter retombe sur le même total.
 *
 * CE QUI VIENT DE L'ARÈNE, ET CE QUI A ÉTÉ CHOISI. Les cinq références, leurs coûts d'achat et
 * leurs autres coûts variables, les trois façonniers (leurs écarts de prix et leurs délais de
 * paiement), les trois clientèles, le loyer (13 600 €), la paie (14 342 € pour six salariés, celle
 * des chapitres de comptabilité), la publicité, l'entretien et l'usure du rayonnage sont ceux du
 * scénario de la boutique et du cas figé (cas-des-entreprises.ts). Les prix sont des étiquettes
 * rondes toutes taxes comprises, dont le prix hors taxes tombe juste. Les quantités du mois sont
 * posées pour que chaque famille de l'assortiment ait un représentant ; la demande des trois
 * années passées reprend les ordres de grandeur de l'arène (25 000 à 28 000 articles par an, un
 * trimestre 4 deux fois plus fort qu'un trimestre moyen) ; l'affluence, l'équipe heure par heure,
 * le budget et les seuils d'alerte sont des hypothèses du cours, chacune dite à sa place.
 *
 * CONVENTIONS. Tout est hors taxes, sauf les étiquettes et ce qui sort de la caisse. Le mois
 * commercial a 30 jours (les ventes y sont régulières, pour dater le point mort et lire un
 * stock en jours) ; la boutique ouvre du lundi au samedi, de 10 h à 19 h ; un mois moyen compte
 * 52 ÷ 12 semaines.
 */

// ─────────────────────────────────────────────────────────────────────────────
// LES CONVENTIONS DU CALENDRIER
// ─────────────────────────────────────────────────────────────────────────────

/** Le mois commercial : 30 jours, aux ventes régulières (le point mort, la couverture, les délais). */
export const JOURS_DU_MOIS = 30;

/** Le trimestre commercial : 90 jours (le budget et le crédit fournisseur). */
export const JOURS_DU_TRIMESTRE = 90;

/** Les semaines d'un mois moyen : 52 semaines ÷ 12 mois. Une semaine type × 52 ÷ 12 donne le mois. */
export const SEMAINES_PAR_MOIS = 52 / 12;

/** Le taux de TVA de tout ce que la boutique vend et achète : des vêtements et des accessoires. */
export const TAUX_DE_TVA = 0.2;

/** La surface de vente de la boutique, en mètres carrés (pour le chiffre d'affaires au m²). */
export const SURFACE_DE_VENTE = 120;

// ─────────────────────────────────────────────────────────────────────────────
// LA GAMME : CINQ RÉFÉRENCES, DEUX RAYONS
// ─────────────────────────────────────────────────────────────────────────────

export type CodeDeReference = "col-rond" | "cardigan" | "merinos" | "echarpe" | "bonnet";
export type CodeDeRayon = "maille" | "accessoires";

/** Une livraison reçue dans le mois : le jour, et les articles livrés (facturés à la livraison). */
export interface Livraison {
  jour: number;
  quantite: number;
}

export interface ReferenceDeLaBoutique {
  code: CodeDeReference;
  nom: string;
  rayon: CodeDeRayon;
  /** L'étiquette, toutes taxes comprises. */
  prixTtc: number;
  /** Le prix de vente hors taxes : l'étiquette ÷ (1 + TVA), qui tombe juste. */
  prixHt: number;
  tauxTva: number;
  /** Le prix d'achat d'un article, hors taxes, chez le façonnier de référence. */
  coutDAchat: number;
  /** Les autres coûts variables d'un article vendu : emballage, étiquette, frais de carte bancaire. */
  autresCoutsVariables: number;
  /** Les articles que les clients ont demandés en janvier, au prix de l'étiquette (vendus ou non). */
  demandeDuMois: number;
  /** Les articles vendus en janvier : la plus petite de la demande et du stock disponible. */
  ventesDuMois: number;
  /**
   * LA CAPACITÉ DU RAYON (hypothèse du cours) : le plus d'articles de la référence que le rayon et
   * la réserve peuvent offrir à la vente dans un mois, livraisons comprises. Au-delà, une
   * commande ne trouve pas de place.
   */
  capaciteDuRayon: number;
  /** Le stock du 1er janvier, et les livraisons du façonnier de référence reçues en janvier. */
  stockInitial: number;
  livraisons: readonly Livraison[];
}

/**
 * LA GAMME DE JANVIER. Les coûts d'achat et les autres coûts variables sont ceux de l'arène ; les
 * étiquettes sont rondes (66 € TTC font 55 € HT). Le cardigan manque : 384 demandés, 360 en
 * stock (120 au 1er janvier, 240 livrés le 12), donc 24 ventes manquées. Les autres références
 * servent toute leur demande.
 */
export const GAMME: readonly ReferenceDeLaBoutique[] = [
  {
    code: "col-rond",
    nom: "Pull col rond",
    rayon: "maille",
    prixTtc: 66,
    prixHt: 55,
    tauxTva: TAUX_DE_TVA,
    coutDAchat: 25,
    autresCoutsVariables: 3.5,
    demandeDuMois: 600,
    ventesDuMois: 600,
    capaciteDuRayon: 900,
    stockInitial: 400,
    livraisons: [{ jour: 10, quantite: 500 }],
  },
  {
    code: "cardigan",
    nom: "Cardigan",
    rayon: "maille",
    prixTtc: 90,
    prixHt: 75,
    tauxTva: TAUX_DE_TVA,
    coutDAchat: 34,
    autresCoutsVariables: 4,
    demandeDuMois: 384,
    ventesDuMois: 360,
    capaciteDuRayon: 500,
    stockInitial: 120,
    livraisons: [{ jour: 12, quantite: 240 }],
  },
  {
    code: "merinos",
    nom: "Pull mérinos",
    rayon: "maille",
    prixTtc: 162,
    prixHt: 135,
    tauxTva: TAUX_DE_TVA,
    coutDAchat: 56,
    autresCoutsVariables: 5,
    demandeDuMois: 90,
    ventesDuMois: 90,
    capaciteDuRayon: 150,
    stockInitial: 70,
    livraisons: [{ jour: 15, quantite: 60 }],
  },
  {
    code: "echarpe",
    nom: "Écharpe",
    rayon: "accessoires",
    prixTtc: 42,
    prixHt: 35,
    tauxTva: TAUX_DE_TVA,
    coutDAchat: 14,
    autresCoutsVariables: 2,
    demandeDuMois: 330,
    ventesDuMois: 330,
    capaciteDuRayon: 600,
    stockInitial: 350,
    livraisons: [{ jour: 8, quantite: 200 }],
  },
  {
    code: "bonnet",
    nom: "Bonnet",
    rayon: "accessoires",
    prixTtc: 30,
    prixHt: 25,
    tauxTva: TAUX_DE_TVA,
    coutDAchat: 9.5,
    autresCoutsVariables: 1.5,
    demandeDuMois: 150,
    ventesDuMois: 150,
    capaciteDuRayon: 300,
    stockInitial: 220,
    livraisons: [],
  },
];

/** Ce que couvrent les autres coûts variables d'un article. */
export const AUTRES_COUTS_VARIABLES = "emballages, étiquettes et frais de carte bancaire";

/**
 * LE CONCURRENT DE LA RUE (hypothèse du cours) : une enseigne de prêt-à-porter affiche un pull col
 * rond comparable à 60 € TTC, contre 66 € chez MAILLE & CO (9,1 % de moins).
 */
export const CONCURRENT = { nom: "l'enseigne de prêt-à-porter de la rue", reference: "col-rond" as CodeDeReference, prixTtc: 60 };

// ─────────────────────────────────────────────────────────────────────────────
// LA DEMANDE : SA RÉPONSE AU PRIX ET À LA REMISE
// ─────────────────────────────────────────────────────────────────────────────

/**
 * L'ÉLASTICITÉ DE LA DEMANDE AU PRIX (hypothèse du cours), la même pour chaque référence : un prix
 * durablement plus bas de 1 % fait demander 1,5 % d'articles de plus. La réponse est une droite :
 * demande = demande du mois × (1 + élasticité × (prix − étiquette) ÷ étiquette), comme la droite de
 * demande du contrôle de gestion (monde/couts-et-budgets.ts).
 */
export const ELASTICITE_AU_PRIX = -1.5;

/**
 * L'ÉLASTICITÉ À LA REMISE (hypothèse du cours) : une remise annoncée de 1 % fait demander 3 %
 * d'articles de plus pendant le mois de la promotion. C'est deux fois l'effet d'une baisse
 * durable du prix : la remise se voit (vitrine, affiche, message aux clientes fidèles) et elle
 * presse l'achat. Elle remplace l'élasticité au prix pendant la promotion, elle ne s'y ajoute pas.
 */
export const ELASTICITE_A_LA_REMISE = 3;

/**
 * LA PROMOTION ENVISAGÉE (hypothèse du cours) : 10 % de remise sur le pull col rond en février, un
 * mois dont la demande au prix de l'étiquette est celle de janvier (600 articles). Le stock prévu
 * en rayon pour février est de 700 articles ; le rayon en tient 900.
 */
export const PROMOTION_ENVISAGEE = { reference: "col-rond" as CodeDeReference, remise: 0.1, stockEnRayon: 700, mois: "février" };

// ─────────────────────────────────────────────────────────────────────────────
// LES FOURNISSEURS
// ─────────────────────────────────────────────────────────────────────────────

export type CodeDeFournisseur = "faconnier" | "fins-de-serie" | "atelier-local";

export interface FournisseurDeLaBoutique {
  code: CodeDeFournisseur;
  nom: string;
  /** Ce que vaut son prix d'achat, rapporté à celui du façonnier de référence (le coût d'achat de la gamme). */
  multiplicateur: number;
  /** Le délai de paiement, en jours (0 : comptant à l'enlèvement). */
  delaiDePaiement: number;
  /** Le délai de livraison, en jours, entre la commande et l'article en réserve. */
  delaiDeLivraison: number;
  /** Le plus petit nombre d'articles qu'il accepte par commande. */
  minimumDeCommande: number;
  /** Il peut réassortir une référence en cours de saison. */
  reassort: boolean;
}

/**
 * LES TROIS FAÇONNIERS. Les écarts de prix et les délais de paiement sont ceux de l'arène (−18 %
 * comptant, +22 % à 30 jours, le référent à 45 jours). Les délais de livraison et les minimums de
 * commande sont des hypothèses du cours : le référent livre en trois semaines, les fins de série
 * s'enlèvent en trois jours mais par lots de 300 et sans réassort, l'atelier local livre en dix
 * jours à partir de 50 articles.
 */
export const FOURNISSEURS: readonly FournisseurDeLaBoutique[] = [
  { code: "faconnier", nom: "Façonnier de référence", multiplicateur: 1, delaiDePaiement: 45, delaiDeLivraison: 21, minimumDeCommande: 200, reassort: true },
  { code: "fins-de-serie", nom: "Fins de série d'un tricoteur portugais", multiplicateur: 0.82, delaiDePaiement: 0, delaiDeLivraison: 3, minimumDeCommande: 300, reassort: false },
  { code: "atelier-local", nom: "Atelier de tricotage local", multiplicateur: 1.22, delaiDePaiement: 30, delaiDeLivraison: 10, minimumDeCommande: 50, reassort: true },
];

// ─────────────────────────────────────────────────────────────────────────────
// LES CLIENTÈLES DE JANVIER
// ─────────────────────────────────────────────────────────────────────────────

export type CodeDeClientele = "fideles" | "passants" | "comites";

export interface ClienteleDeLaBoutique {
  code: CodeDeClientele;
  nom: string;
  /** Les entrées en boutique du mois. */
  entrees: number;
  /** Les passages en caisse du mois (un ticket par achat ; une commande pour un comité d'entreprise). */
  tickets: number;
  /** Les articles achetés dans le mois, référence par référence. */
  achats: Readonly<Record<CodeDeReference, number>>;
  /** Le délai de règlement, en jours (0 : en caisse). */
  delaiDeReglement: number;
}

/**
 * LES TROIS CLIENTÈLES. Le compteur à l'entrée donne le trafic (3 848 entrées) ; la part de chaque
 * clientèle vient d'une enquête à la porte et de la carte de fidélité (hypothèse du cours). Les
 * comités d'entreprise passent commande en boutique : huit commandes en janvier, réglées à 45
 * jours, qui font chacune un passage en caisse. Les articles de chaque clientèle, référence par
 * référence, refont exactement les ventes de la gamme.
 */
export const CLIENTELES: readonly ClienteleDeLaBoutique[] = [
  {
    code: "fideles",
    nom: "Clientes fidèles",
    entrees: 680,
    tickets: 340,
    achats: { "col-rond": 200, cardigan: 220, merinos: 55, echarpe: 90, bonnet: 30 },
    delaiDeReglement: 0,
  },
  {
    code: "passants",
    nom: "Passants",
    entrees: 3_160,
    tickets: 600,
    achats: { "col-rond": 320, cardigan: 140, merinos: 15, echarpe: 180, bonnet: 80 },
    delaiDeReglement: 0,
  },
  {
    code: "comites",
    nom: "Comités d'entreprise",
    entrees: 8,
    tickets: 8,
    achats: { "col-rond": 80, cardigan: 0, merinos: 20, echarpe: 60, bonnet: 40 },
    delaiDeReglement: 45,
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// LE STOCK
// ─────────────────────────────────────────────────────────────────────────────

/**
 * LE DÉLAI DE SÉCURITÉ (hypothèse du cours) : le stock de sécurité couvre 7 jours de ventes, le
 * retard qu'un façonnier peut prendre sur sa livraison. Stock de sécurité = ventes par jour ×
 * 7 jours ; point de commande (stock d'alerte) = ventes par jour × délai de livraison + stock de
 * sécurité.
 */
export const DELAI_DE_SECURITE = 7;

// ─────────────────────────────────────────────────────────────────────────────
// LES TROIS ANNÉES PASSÉES, TRIMESTRE PAR TRIMESTRE
// ─────────────────────────────────────────────────────────────────────────────

export interface TrimestreDeLHistorique {
  /** L'année, de N − 3 à N − 1, et le trimestre dans l'année. */
  annee: "N-3" | "N-2" | "N-1";
  trimestre: 1 | 2 | 3 | 4;
  /** Les articles demandés (vendus ou non), et les articles vendus. */
  demande: number;
  ventes: number;
}

/**
 * LA DEMANDE DES TROIS ANNÉES PASSÉES (hypothèse du cours, aux ordres de grandeur de l'arène). Elle
 * suit une tendance d'environ 100 articles de plus par trimestre et une saison marquée : le
 * trimestre 2 en vaut à peine la moitié d'un trimestre moyen, le trimestre 4 (Noël) le double. Au
 * trimestre 4, la réserve ne tient pas le pic : les ventes plafonnent (11 500, 12 000 puis 12 500
 * articles) sous la demande. On prévoit donc sur la demande, pas sur les ventes.
 */
const DEMANDE_PASSEE = [4_215, 2_741, 4_959, 12_622, 4_409, 3_014, 5_177, 13_647, 4_772, 3_132, 5_588, 14_440] as const;
const VENTES_DU_TRIMESTRE_4 = { "N-3": 11_500, "N-2": 12_000, "N-1": 12_500 } as const;
const ANNEES = ["N-3", "N-2", "N-1"] as const;

export const HISTORIQUE: readonly TrimestreDeLHistorique[] = DEMANDE_PASSEE.map((demande, i) => {
  const annee = ANNEES[Math.floor(i / 4)]!;
  const trimestre = ((i % 4) + 1) as 1 | 2 | 3 | 4;
  return { annee, trimestre, demande, ventes: trimestre === 4 ? VENTES_DU_TRIMESTRE_4[annee] : demande };
});

// ─────────────────────────────────────────────────────────────────────────────
// LE BUDGET DU PREMIER TRIMESTRE DE L'ANNÉE N
// ─────────────────────────────────────────────────────────────────────────────

/**
 * LE BUDGET DU TRIMESTRE 1 DE N (janvier à mars), établi en décembre. Les ventes prévues
 * reprennent la prévision du trimestre (la tendance des moyennes mobiles et le coefficient
 * saisonnier : 5 067 articles), arrondie à la dizaine, 5 070, partagée entre les références comme
 * les ventes de janvier, à la dizaine. Le stock du 1er janvier est celui de la gamme ; le stock
 * voulu au 31 mars est une hypothèse du cours (le stock de sécurité, plus de quoi ouvrir avril).
 * Les achats sont commandés au façonnier de référence, payé à 45 jours.
 */
export const BUDGET_DU_TRIMESTRE = {
  libelle: "le trimestre 1 de N, de janvier à mars",
  jours: JOURS_DU_TRIMESTRE,
  fournisseur: "faconnier" as CodeDeFournisseur,
  ventesPrevues: { "col-rond": 1_990, cardigan: 1_190, merinos: 300, echarpe: 1_090, bonnet: 500 } as Readonly<Record<CodeDeReference, number>>,
  stockFinalVoulu: { "col-rond": 400, cardigan: 250, merinos: 60, echarpe: 250, bonnet: 100 } as Readonly<Record<CodeDeReference, number>>,
};

// ─────────────────────────────────────────────────────────────────────────────
// LES CHARGES DU POINT DE VENTE
// ─────────────────────────────────────────────────────────────────────────────

/**
 * LES CHARGES FIXES DU MOIS, hors personnel (celui-ci vient de l'équipe) : le loyer et ses frais
 * (13 600 €), la publicité (1 500 €), l'entretien de la boutique et de la vitrine (920 €) et
 * l'usure du rayonnage (16 000 € amortis sur 48 mois, arrondis à l'euro). Ce sont les montants
 * mensuels de l'année de l'arène. HYPOTHÈSE DU COURS : elles ne bougent pas avec les ventes.
 */
export const CHARGES_DU_MOIS = { loyer: 13_600, publicite: 1_500, entretien: 920, amortissement: 333 } as const;

// ─────────────────────────────────────────────────────────────────────────────
// L'ÉQUIPE ET L'AFFLUENCE
// ─────────────────────────────────────────────────────────────────────────────

export interface SalarieDeLaBoutique {
  code: string;
  poste: string;
  contrat: "CDI" | "CDD";
  /** Les heures du contrat, par semaine. */
  heuresParSemaine: number;
  /** Le salaire brut du mois. */
  brutMensuel: number;
}

/**
 * L'ÉQUIPE : six salariés, 165 heures de contrat par semaine. Les salaires bruts font 10 100 €
 * par mois et les cotisations patronales 42 % : 14 342 €, la paie des chapitres de comptabilité.
 * Les heures du mois sont les heures de la semaine × 52 ÷ 12, au centième (151,67 h pour 35 h).
 */
export const EQUIPE: readonly SalarieDeLaBoutique[] = [
  { code: "responsable", poste: "Responsable de la boutique", contrat: "CDI", heuresParSemaine: 35, brutMensuel: 2_700 },
  { code: "adjointe", poste: "Adjointe", contrat: "CDI", heuresParSemaine: 35, brutMensuel: 2_150 },
  { code: "vendeur", poste: "Vendeur", contrat: "CDI", heuresParSemaine: 35, brutMensuel: 2_000 },
  { code: "vendeuse-partiel", poste: "Vendeuse à temps partiel", contrat: "CDI", heuresParSemaine: 24, brutMensuel: 1_300 },
  { code: "vendeur-partiel", poste: "Vendeur à temps partiel", contrat: "CDI", heuresParSemaine: 24, brutMensuel: 1_300 },
  { code: "etudiante", poste: "Étudiante, le mercredi et le samedi", contrat: "CDD", heuresParSemaine: 12, brutMensuel: 650 },
];

/** Le taux des cotisations patronales, sur le brut (celui de la paie du cours). */
export const TAUX_PATRONAL = 0.42;

export type JourDOuverture = "lundi" | "mardi" | "mercredi" | "jeudi" | "vendredi" | "samedi";
export const JOURS_D_OUVERTURE: readonly JourDOuverture[] = ["lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];

/** Les heures d'ouverture : de 10 h à 19 h, soit neuf créneaux d'une heure par jour. */
export const OUVERTURE = { debut: 10, fin: 19 } as const;

/**
 * L'AFFLUENCE D'UNE SEMAINE TYPE DE JANVIER (hypothèse du cours) : les entrées comptées à la porte,
 * créneau par créneau, de 10 h à 19 h. La semaine fait 888 entrées ; × 52 ÷ 12, le mois en fait
 * 3 848, le trafic de janvier. Le samedi pèse plus du quart de la semaine ; midi et la sortie du
 * travail sont les pointes de chaque jour.
 */
export const AFFLUENCE: Readonly<Record<JourDOuverture, readonly number[]>> = {
  lundi: [5, 9, 13, 11, 8, 9, 11, 13, 11],
  mardi: [7, 12, 17, 15, 11, 12, 14, 18, 14],
  mercredi: [9, 15, 21, 18, 14, 15, 18, 22, 18],
  jeudi: [7, 12, 17, 15, 11, 12, 14, 18, 14],
  vendredi: [10, 17, 24, 20, 15, 17, 20, 25, 20],
  samedi: [14, 24, 34, 29, 21, 24, 29, 36, 29],
};

/**
 * LA RÈGLE DU PLANNING (hypothèse du cours) : un vendeur accueille et conseille au plus 8 entrées
 * par heure ; il en faut toujours au moins 2 en boutique (la caisse, la sécurité, les pauses).
 * Vendeurs nécessaires sur un créneau = le plus grand de 2 et des entrées ÷ 8, à l'unité supérieure.
 */
export const ENTREES_PAR_VENDEUR_ET_PAR_HEURE = 8;
export const PRESENCE_MINIMALE = 2;

/**
 * LES TÂCHES HORS VENTE (hypothèse du cours) : 20 heures par semaine pour recevoir les livraisons,
 * mettre en rayon, étiqueter, ouvrir et fermer la caisse. Elles se font hors des créneaux de vente.
 */
export const TACHES_HORS_VENTE_PAR_SEMAINE = 20;

/**
 * LE PLANNING D'AUJOURD'HUI (hypothèse du cours) : les vendeurs présents sur chaque créneau, presque
 * les mêmes chaque jour. Il donne 145 heures de vente, plus les 20 heures de tâches : les 165
 * heures des contrats. Le total suffit, mais il est mal placé : trop de monde le lundi, pas
 * assez le samedi à midi et en fin de journée.
 */
export const PLANNING_ACTUEL: Readonly<Record<JourDOuverture, readonly number[]>> = {
  lundi: [2, 3, 3, 3, 2, 3, 3, 3, 2],
  mardi: [2, 3, 3, 3, 2, 3, 3, 3, 2],
  mercredi: [2, 3, 3, 3, 2, 3, 3, 3, 2],
  jeudi: [2, 3, 3, 3, 2, 3, 3, 3, 2],
  vendredi: [2, 3, 3, 3, 2, 3, 3, 3, 2],
  samedi: [2, 3, 3, 3, 3, 3, 3, 3, 2],
};

// ─────────────────────────────────────────────────────────────────────────────
// LE TABLEAU DE BORD DU MANAGER
// ─────────────────────────────────────────────────────────────────────────────

/**
 * JANVIER DE L'ANNÉE N − 1 (hypothèse du cours), pour comparer : 4 160 entrées (960 par semaine),
 * 1 000 passages en caisse, 1 600 articles vendus pour 1 610 demandés, 89 600 € hors taxes.
 */
export const JANVIER_N_MOINS_1 = { trafic: 4_160, tickets: 1_000, articles: 1_600, demande: 1_610, chiffreDAffaires: 89_600 } as const;

export type CodeDIndicateurDuManager =
  | "realisationDeLObjectif"
  | "evolutionDuTrafic"
  | "tauxDeTransformation"
  | "panierMoyen"
  | "indiceDeVente"
  | "tauxDeService"
  | "tauxDeMarque"
  | "indiceDeSecurite"
  | "partDuPersonnel"
  | "dureeDeStockage";

/** Un seuil d'alerte : le voyant s'allume sous un plancher, ou au-dessus d'un plafond. */
export interface SeuilDAlerte {
  seuil: number;
  sens: "plancher" | "plafond";
}

/**
 * LES SEUILS D'ALERTE DU MANAGER (hypothèse du cours). L'objectif du mois est le tiers du chiffre
 * d'affaires budgété pour le trimestre : un voyant sous 95 % de réalisation. Le trafic ne doit pas
 * perdre plus de 5 % sur janvier N − 1 ; le taux de transformation rester au-dessus de 22 %, le
 * panier moyen de 85 €, l'indice de vente de 1,5 article par passage en caisse, le taux de service
 * de 97 % de la demande, le taux de marque de 55 %, l'indice de sécurité de 20 %. La part du
 * personnel ne doit pas dépasser 18 % du chiffre d'affaires, ni la durée de stockage 30 jours.
 */
export const SEUILS_D_ALERTE: Readonly<Record<CodeDIndicateurDuManager, SeuilDAlerte>> = {
  realisationDeLObjectif: { seuil: 0.95, sens: "plancher" },
  evolutionDuTrafic: { seuil: -0.05, sens: "plancher" },
  tauxDeTransformation: { seuil: 0.22, sens: "plancher" },
  panierMoyen: { seuil: 85, sens: "plancher" },
  indiceDeVente: { seuil: 1.5, sens: "plancher" },
  tauxDeService: { seuil: 0.97, sens: "plancher" },
  tauxDeMarque: { seuil: 0.55, sens: "plancher" },
  indiceDeSecurite: { seuil: 0.2, sens: "plancher" },
  partDuPersonnel: { seuil: 0.18, sens: "plafond" },
  dureeDeStockage: { seuil: 30, sens: "plafond" },
};

// ─────────────────────────────────────────────────────────────────────────────
// LA FICHE
// ─────────────────────────────────────────────────────────────────────────────

export interface FicheDeLaBoutique {
  code: string;
  entreprise: string;
  unite: string;
  unites: string;
  moisDeReference: string;
  joursDuMois: number;
  surfaceDeVente: number;
  gamme: readonly ReferenceDeLaBoutique[];
  autresCoutsVariables: string;
  concurrent: typeof CONCURRENT;
  elasticiteAuPrix: number;
  elasticiteALaRemise: number;
  promotion: typeof PROMOTION_ENVISAGEE;
  fournisseurs: readonly FournisseurDeLaBoutique[];
  clienteles: readonly ClienteleDeLaBoutique[];
  delaiDeSecurite: number;
  historique: readonly TrimestreDeLHistorique[];
  budget: typeof BUDGET_DU_TRIMESTRE;
  charges: typeof CHARGES_DU_MOIS;
  equipe: readonly SalarieDeLaBoutique[];
  tauxPatronal: number;
  semainesParMois: number;
  ouverture: typeof OUVERTURE;
  affluence: Readonly<Record<JourDOuverture, readonly number[]>>;
  planning: Readonly<Record<JourDOuverture, readonly number[]>>;
  reglesDuPlanning: { entreesParVendeur: number; presenceMinimale: number; tachesHorsVente: number };
  moisN1: typeof JANVIER_N_MOINS_1;
  seuilsDAlerte: Readonly<Record<CodeDIndicateurDuManager, SeuilDAlerte>>;
}

export const MAILLE_ET_CO: FicheDeLaBoutique = {
  code: "boutique",
  entreprise: "MAILLE & CO",
  unite: "article",
  unites: "articles",
  moisDeReference: "janvier",
  joursDuMois: JOURS_DU_MOIS,
  surfaceDeVente: SURFACE_DE_VENTE,
  gamme: GAMME,
  autresCoutsVariables: AUTRES_COUTS_VARIABLES,
  concurrent: CONCURRENT,
  elasticiteAuPrix: ELASTICITE_AU_PRIX,
  elasticiteALaRemise: ELASTICITE_A_LA_REMISE,
  promotion: PROMOTION_ENVISAGEE,
  fournisseurs: FOURNISSEURS,
  clienteles: CLIENTELES,
  delaiDeSecurite: DELAI_DE_SECURITE,
  historique: HISTORIQUE,
  budget: BUDGET_DU_TRIMESTRE,
  charges: CHARGES_DU_MOIS,
  equipe: EQUIPE,
  tauxPatronal: TAUX_PATRONAL,
  semainesParMois: SEMAINES_PAR_MOIS,
  ouverture: OUVERTURE,
  affluence: AFFLUENCE,
  planning: PLANNING_ACTUEL,
  reglesDuPlanning: { entreesParVendeur: ENTREES_PAR_VENDEUR_ET_PAR_HEURE, presenceMinimale: PRESENCE_MINIMALE, tachesHorsVente: TACHES_HORS_VENTE_PAR_SEMAINE },
  moisN1: JANVIER_N_MOINS_1,
  seuilsDAlerte: SEUILS_D_ALERTE,
};

/** Les boutiques du monde du cours, par code d'entreprise. */
export const BOUTIQUES_DU_COURS: Readonly<Record<string, FicheDeLaBoutique>> = { [MAILLE_ET_CO.code]: MAILLE_ET_CO };
