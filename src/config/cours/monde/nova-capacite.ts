import { AUTRES_COUTS_PAR_ENCEINTE, CAPACITE_DU_TRIMESTRE, COMPOSANTS_PAR_ENCEINTE, PRIX_DE_L_ENCEINTE } from "./nova-gestion";

/**
 * LE MONDE DU COURS : LA CAPACITÉ DE NOVA (le parcours BTS GPME, les aléas, la qualité, le personnel
 * et l'outil, et le chapitre de stratégie « croître en investissant »).
 *
 * NOVA fabrique des enceintes (voir l-escale.ts pour le principe du monde du cours : une simulation
 * figée, inspirée de l'arène, calculée par le cours). Cette fiche est la seule source des chiffres
 * des cinq chapitres du lot : s'assurer contre les aléas, le coût de la non-qualité, le départ d'un
 * salarié, entretenir l'outil, croître en investissant. Le modèle qui les calcule est dans
 * monde/capacite.ts ; la garde tests/cours/nova-capacite.test.ts refait chaque chiffre à la main.
 *
 * UNE SEULE NOVA, CELLE DE LA COMPTABILITÉ ET DU CONTRÔLE DE GESTION. L'enceinte est la NOVA One de
 * nova-gestion.ts (59 € hors taxes, 22 € de composants, 16 € d'autres coûts variables : 21 € de marge
 * sur coût variable), la ligne de montage est celle d'exercice-de-nova.ts (4 postes manuels, 60 000 €,
 * 7 000 enceintes par trimestre), l'équipe est celle de la paie (4 opérateurs, 7 500 € bruts par mois
 * à eux quatre), l'assurance est la formule « Basique » souscrite le 1er octobre N, et la capacité à
 * encaisser un sinistre se lit sur la clôture du 31 décembre N.
 *
 * DEUX ANNÉES, TRIMESTRE PAR TRIMESTRE.
 *   - L'ANNÉE N, RÉALISÉE : les enceintes livrées chaque trimestre sont celles d'exercice-de-nova.ts
 *     (23 609 sur l'année). Toute la demande a été servie : ni l'outil ni l'équipe ne l'ont bornée,
 *     même au trimestre 4 (6 940 enceintes pour 7 000, 99,1 % de l'outil). La ligne était neuve et
 *     son fabricant l'entretenait au titre de la garantie : sa disponibilité est restée à 100 %.
 *   - L'ANNÉE N + 1, PRÉVUE : c'est l'année des décisions du parcours. La demande grandit (27 200
 *     enceintes) et dépasse l'outil aux trimestres 2 et 4 : L'OUTIL EST LE GOULOT, et 1 200 enceintes
 *     demandées ne seront pas servies. La garantie est finie : NOVA entretient elle-même la ligne.
 *     L'assurance se renouvelle le 1er octobre. Un opérateur payé sous le marché peut partir. NOVA
 *     envisage une machine de plus.
 *
 * CE QUI VIENT DE L'ARÈNE, ET CE QUI A ÉTÉ CHOISI. Viennent du scénario nova de l'arène : les heures
 * d'un opérateur (540 par trimestre) et d'une enceinte (0,3 h), le coût d'un recrutement (3 000 €),
 * le seuil de démission (95 % du salaire du marché), l'usure de l'outil sans entretien (5 points de
 * disponibilité par trimestre) et sa réparation à une fois et demie l'usure au budget de référence,
 * les noms et l'ordre des trois formules d'assurance et la prime de la « Basique » (1 500 € par
 * trimestre), les aléas (les pannes, la cyberattaque, le litige avec un fournisseur), le poste
 * manuel à 15 000 € sur 6 ans, le taux de l'emprunt (5 %) et celui de l'impôt (25 %). Le reste est
 * une hypothèse du cours, dite à sa place : la demande de N + 1, le budget de référence de
 * l'entretien (4 500 €), les primes et les franchises de l'« Étendue » et du « Tous risques », les
 * probabilités et les coûts des sinistres, les quatre points de la courbe de la qualité, les délais
 * du personnel, la ligne automatisée, le taux d'actualisation.
 *
 * CE QUI NE SE RÉCONCILIE PAS (voir le rapport du lot) :
 *   · nova-gestion.ts fait lancer la gamme Go, One et Studio en N + 1, avec une seconde ligne ; ici,
 *     N + 1 ne fabrique que la NOVA One, et la machine de plus est une décision à prendre ;
 *   · nova-usine.ts (le contrôle budgétaire) fabrique deux autres modèles, la Nomade et la Salon,
 *     16 000 enceintes par trimestre : une autre échelle, que cette fiche ne reprend pas ;
 *   · l'entretien de la ligne coûte 1 562 € par mois dans la gamme de nova-gestion.ts (4 686 € par
 *     trimestre) ; le cours pose ici 4 500 € par trimestre, pour que le seuil tombe juste.
 *
 * CONVENTIONS. Tout est hors taxes. Un trimestre a trois mois. NOVA fabrique ce qu'elle vend, sans
 * stock d'enceintes finies : la production d'un trimestre est ses ventes. Dans un trimestre, la
 * production se répartit librement entre les mois : la capacité de l'équipe d'un trimestre est la
 * somme de ses trois mois. Une demande qui n'est pas servie dans son trimestre est perdue.
 */

// ─────────────────────────────────────────────────────────────────────────────
// L'ENCEINTE, L'OUTIL ET L'ÉQUIPE
// ─────────────────────────────────────────────────────────────────────────────

export type Trimestre = 1 | 2 | 3 | 4;

/** Un trimestre compte trois mois : la vacance d'un poste se lit mois par mois. */
export const MOIS_PAR_TRIMESTRE = 3;

/**
 * L'ENCEINTE NOVA One, celle de nova-gestion.ts : 59 € hors taxes ; 22 € de composants et 16 €
 * d'autres coûts variables (emballage, transport, énergie de la chaîne). Chaque enceinte vendue de
 * plus laisse 21 € de marge sur coût variable ; chaque enceinte qui manque en coûte autant.
 */
export const ENCEINTE = {
  nom: "NOVA One",
  prix: PRIX_DE_L_ENCEINTE,
  coutVariable: { composants: COMPOSANTS_PAR_ENCEINTE, autres: AUTRES_COUTS_PAR_ENCEINTE },
} as const;

/**
 * LA LIGNE DE MONTAGE, celle d'exercice-de-nova.ts : 4 postes manuels achetés 15 000 € chacun
 * (60 000 €), 7 000 enceintes par trimestre quand elle est disponible à 100 % (la capacité de
 * nova-gestion.ts). Une ligne disponible à 95 % n'en monte que 6 650 : les arrêts, les réglages et
 * les petites pannes prennent le reste.
 */
export const LIGNE_DE_MONTAGE = { postes: 4, valeurANeuf: 60_000, capaciteParTrimestre: CAPACITE_DU_TRIMESTRE } as const;

/**
 * LES OPÉRATEURS, les 4 salariés de la paie d'exercice-de-nova.ts : 1 875 € bruts par mois chacun
 * (7 500 € à eux quatre), et 42 % de cotisations patronales, soit 2 662,50 € par mois pour NOVA
 * (31 950 € par an). Chacun travaille 180 heures par mois à la production (540 par trimestre, celles
 * de l'arène) ; une enceinte demande 0,3 heure : un opérateur en monte 600 par mois, 1 800 par
 * trimestre, et l'équipe 7 200. À effectif complet, l'équipe peut un peu plus que l'outil.
 */
export const OPERATEURS = {
  nombre: 4,
  heuresParMois: 180,
  heuresParEnceinte: 0.3,
  salaireBrutMensuel: 1_875,
  tauxDesCotisationsPatronales: 0.42,
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// LES DEUX ANNÉES
// ─────────────────────────────────────────────────────────────────────────────

export type CodeDAnnee = "N" | "N+1";

export interface AnneeDeNova {
  code: CodeDAnnee;
  libelle: string;
  /** Les enceintes que les clients demandent, trimestre par trimestre. */
  demande: readonly number[];
  /** La disponibilité de la ligne au premier trimestre (1 : 100 %). */
  disponibiliteDeDepart: number;
}

/**
 * L'ANNÉE N, RÉALISÉE : les enceintes livrées chaque trimestre d'exercice-de-nova.ts (particuliers,
 * CampusTech et Sonora), 23 609 sur l'année. Elles étaient toutes demandées, et toute la demande a
 * été servie : c'est la demande de N. La ligne, sous garantie, est restée disponible à 100 %.
 */
export const ANNEE_N: AnneeDeNova = {
  code: "N",
  libelle: "l'année N",
  demande: [4_778, 6_081, 5_810, 6_940],
  disponibiliteDeDepart: 1,
};

/**
 * L'ANNÉE N + 1, PRÉVUE (hypothèse du cours) : 27 200 enceintes demandées, 15 % de plus qu'en N. Les
 * trimestres 2 (le printemps) et 4 (Noël) demandent plus que la ligne ne peut monter (7 400 et
 * 7 800 enceintes pour 7 000) : l'outil y est le goulot, et 1 200 enceintes demandées ne seront
 * pas servies, même avec la ligne à 100 %. Les trimestres 1 et 3 laissent du jeu (5 800 et 6 200).
 * La ligne entre dans l'année disponible à 100 %, l'entretien de N fait par le fabricant.
 */
export const ANNEE_N_PLUS_1: AnneeDeNova = {
  code: "N+1",
  libelle: "l'année N + 1",
  demande: [5_800, 7_400, 6_200, 7_800],
  disponibiliteDeDepart: 1,
};

// ─────────────────────────────────────────────────────────────────────────────
// L'ENTRETIEN DE L'OUTIL
// ─────────────────────────────────────────────────────────────────────────────

/**
 * L'ENTRETIEN DE LA LIGNE (hypothèses du cours, sur le modèle de l'arène).
 *   - Le BUDGET DE RÉFÉRENCE : 4 500 € par trimestre, le contrat d'entretien que propose le
 *     fabricant une fois la garantie finie. Au-delà, un euro de plus ne répare rien.
 *   - L'USURE : sans entretien, la ligne perd 5 points de disponibilité au trimestre suivant.
 *   - LA RÉPARATION : l'entretien rend jusqu'à 7,5 points par trimestre, au budget de référence, en
 *     proportion du budget (1 point pour 600 €). La disponibilité ne dépasse jamais 100 % et ne
 *     descend pas sous 30 % (la ligne la plus usée tourne encore un peu).
 *   - LES DÉFAUTS : une ligne mal entretenue monte mal. Sans aucun entretien, le taux de défaut du
 *     trimestre gagne 3 points ; il en gagne d'autant moins que le budget approche la référence, et
 *     aucun au budget de référence.
 * Le seuil où la disponibilité cesse de baisser est donc 4 500 € × 5 ÷ 7,5 = 3 000 €.
 */
export const ENTRETIEN = {
  budgetDeReference: 4_500,
  usureParTrimestre: 0.05,
  reparationAuBudgetDeReference: 0.075,
  disponibiliteMinimale: 0.3,
  defautsEnPlusSansEntretien: 0.03,
} as const;

/** LE PLAN DE N + 1 (hypothèse du cours) : l'entretien au budget de référence chaque trimestre, la prévention de la qualité à son budget actuel, les quatre opérateurs. */
export const PLAN_DE_N_PLUS_1 = { entretien: [4_500, 4_500, 4_500, 4_500], prevention: 16_000, operateurs: 4 } as const;

// ─────────────────────────────────────────────────────────────────────────────
// LA QUALITÉ
// ─────────────────────────────────────────────────────────────────────────────

/** Un point de la courbe de la qualité : un budget de prévention de l'année et le taux de défaut qu'il laisse. */
export interface PointDeLaQualite {
  budget: number;
  tauxDeDefaut: number;
}

/**
 * LA QUALITÉ DE L'ANNÉE (hypothèses du cours).
 *   - LA PRÉVENTION : un budget de l'année (formation des opérateurs, sélection et essais des
 *     composants, réglage des postes). Le budget actuel est de 16 000 € (4 000 € par trimestre).
 *     Quatre points en donnent le taux de défaut, les quatre budgets du chapitre (aucun, la moitié,
 *     l'actuel, le double) : 8 %, 5 %, 3,5 % et 2 %. Entre deux points, la courbe est une droite ;
 *     au-delà du double, le taux ne baisse plus. Chaque euro de prévention en plus évite moins de
 *     défauts que le précédent.
 *   - LA DÉTECTION : le contrôle final de chaque enceinte, 6 000 € par an, trouve 80 % des défauts.
 *   - LA DÉFAILLANCE INTERNE : un défaut trouvé au contrôle se retouche, 20 € (un composant changé
 *     et le temps de le changer).
 *   - LA DÉFAILLANCE EXTERNE : un défaut qui part chez le client revient sous garantie, 100 €
 *     (l'enceinte d'échange, le transport aller et retour, le temps du service après-vente).
 *   - LA QUALITÉ PERÇUE : un client qui reçoit une enceinte défectueuse fait perdre 3 ventes (il ne
 *     rachète pas, et ses avis en ligne en détournent d'autres). Ces ventes perdues ne sont dans
 *     aucun compte de la qualité : c'est la marge qui les dit.
 */
export const QUALITE = {
  courbe: [
    { budget: 0, tauxDeDefaut: 0.08 },
    { budget: 8_000, tauxDeDefaut: 0.05 },
    { budget: 16_000, tauxDeDefaut: 0.035 },
    { budget: 32_000, tauxDeDefaut: 0.02 },
  ] as readonly PointDeLaQualite[],
  budgetActuel: 16_000,
  controleFinal: { cout: 6_000, tauxDeDetection: 0.8 },
  coutDUnDefautDetecte: 20,
  coutDUnDefautLivre: 100,
  ventesPerduesParDefautLivre: 3,
} as const;

export type CodeDeDemarche = "standardisation" | "controle-en-ligne";

export interface DemarcheQualite {
  code: CodeDeDemarche;
  nom: string;
  /** Ce qu'elle coûte, payé une fois. */
  cout: number;
  /** Les points de taux de défaut qu'elle retire, chaque année. */
  baisseDuTauxDeDefaut: number;
  /** La part des défauts que le contrôle trouve avec elle ; null : celle du contrôle final. */
  tauxDeDetection: number | null;
}

/**
 * DEUX DÉMARCHES QUALITÉ (hypothèses du cours, inspirées du catalogue de l'arène), payées une fois,
 * dont l'effet dure.
 *   - La standardisation des postes de montage (gabarits, modes opératoires) : 5 000 €, le taux de
 *     défaut baisse d'un demi-point. Elle PRÉVIENT.
 *   - Le contrôle automatisé en ligne (un banc d'écoute à chaque poste) : 12 000 €, le contrôle
 *     trouve 90 % des défauts au lieu de 80 %. Elle DÉTECTE plus tôt : un défaut retouché coûte
 *     20 €, un défaut revenu du client 100 €.
 */
export const DEMARCHES_QUALITE: readonly DemarcheQualite[] = [
  { code: "standardisation", nom: "Standardisation des postes de montage", cout: 5_000, baisseDuTauxDeDefaut: 0.005, tauxDeDetection: null },
  { code: "controle-en-ligne", nom: "Contrôle automatisé en ligne", cout: 12_000, baisseDuTauxDeDefaut: 0, tauxDeDetection: 0.9 },
];

// ─────────────────────────────────────────────────────────────────────────────
// LE PERSONNEL
// ─────────────────────────────────────────────────────────────────────────────

/**
 * LE PERSONNEL (hypothèses du cours ; le seuil de démission et le coût d'un recrutement sont ceux de
 * l'arène).
 *   - LE SALAIRE DU MARCHÉ d'un opérateur de montage : 1 950 € bruts par mois en N, 2 000 € en
 *     N + 1. NOVA payait 96,2 % du marché en N ; sans augmentation, elle en paie 93,75 % en N + 1.
 *   - LE SEUIL DE DÉMISSION : payé sous 95 % du marché, un opérateur trouve mieux ailleurs et part.
 *   - LE DÉPART : il annonce sa démission le 1er mars N + 1 ; son préavis dure un mois : il part le
 *     31 mars, après son dernier mois de travail.
 *   - LE RECRUTEMENT : deux mois entre l'annonce du poste et l'arrivée du remplaçant (au premier jour
 *     d'un mois), 3 000 € (l'annonce, les entretiens, les essais).
 *   - L'INTÉGRATION : le premier mois, le remplaçant monte deux fois moins qu'un opérateur formé,
 *     pour un salaire entier.
 */
export const PERSONNEL = {
  salaireDuMarche: { n: 1_950, nPlus1: 2_000 },
  seuilDeDemission: 0.95,
  moisDeLAnnonce: 3,
  preavisEnMois: 1,
  delaiDeRecrutementEnMois: 2,
  coutDUnRecrutement: 3_000,
  integration: { mois: 1, productivite: 0.5 },
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// LES ALÉAS ET L'ASSURANCE
// ─────────────────────────────────────────────────────────────────────────────

export type CodeDAlea = "incendie" | "panne-majeure" | "panne" | "degat-des-eaux" | "cyberattaque" | "responsabilite-civile" | "defaillance-client";

export interface AleaDeNova {
  code: CodeDAlea;
  nom: string;
  /** La probabilité qu'il tombe dans l'année (au plus une fois). */
  probabilite: number;
  /** Les dommages : ce qu'il faut réparer, remplacer ou payer. */
  dommages: number;
  /**
   * La part de la capacité de la ligne qu'il fait perdre pendant le trimestre où il tombe (1 : la
   * ligne à l'arrêt tout le trimestre) ; 0 s'il ne touche pas l'outil. Les enceintes qu'il fait
   * perdre dépendent alors du trimestre : la simulation du cours les compte.
   */
  perteDeCapacite: number;
  /** Les ventes qu'il fait perdre sans toucher l'outil (un site de vente fermé). */
  ventesPerdues: number;
}

/**
 * LES ALÉAS DE NOVA (hypothèses du cours, inspirés de la liste de l'arène). Chacun tombe au plus une
 * fois dans l'année, à un trimestre que rien ne permet de prévoir : quand il touche l'outil, son
 * coût est la moyenne des quatre trimestres de N + 1. Son coût est ses dommages, plus la marge
 * (21 €) des enceintes qu'il fait perdre.
 *   - L'incendie de l'atelier : 1 % par an. La ligne détruite (60 000 €, sa valeur à neuf), les
 *     composants et les risques locatifs (23 500 €), et la ligne à l'arrêt tout un trimestre.
 *   - La panne majeure de la ligne : 5 % par an. 12 000 € de réparation, la moitié de la capacité du
 *     trimestre perdue.
 *   - La panne de la ligne : 20 % par an. 2 000 € de réparation, un cinquième de la capacité du
 *     trimestre perdu.
 *   - Le dégât des eaux dans l'atelier : 10 % par an, 6 000 €.
 *   - La cyberattaque du site de vente : 5 % par an. 4 000 € pour le remettre en état, et deux
 *     semaines fermé : 1 000 enceintes qui ne se vendent pas.
 *   - La batterie qui prend feu chez un client (la responsabilité civile) : 5 % par an, 12 000 €,
 *     ce que réclamait le client du litige d'exercice-de-nova.ts.
 *   - La défaillance d'un client professionnel : 5 % par an, 15 000 € de créance perdue (l'ordre de
 *     grandeur de Sonora).
 */
export const ALEAS: readonly AleaDeNova[] = [
  { code: "incendie", nom: "Incendie de l'atelier", probabilite: 0.01, dommages: 83_500, perteDeCapacite: 1, ventesPerdues: 0 },
  { code: "panne-majeure", nom: "Panne majeure de la ligne", probabilite: 0.05, dommages: 12_000, perteDeCapacite: 0.5, ventesPerdues: 0 },
  { code: "panne", nom: "Panne de la ligne", probabilite: 0.2, dommages: 2_000, perteDeCapacite: 0.2, ventesPerdues: 0 },
  { code: "degat-des-eaux", nom: "Dégât des eaux dans l'atelier", probabilite: 0.1, dommages: 6_000, perteDeCapacite: 0, ventesPerdues: 0 },
  { code: "cyberattaque", nom: "Cyberattaque du site de vente", probabilite: 0.05, dommages: 4_000, perteDeCapacite: 0, ventesPerdues: 1_000 },
  { code: "responsabilite-civile", nom: "Batterie qui prend feu chez un client", probabilite: 0.05, dommages: 12_000, perteDeCapacite: 0, ventesPerdues: 0 },
  { code: "defaillance-client", nom: "Défaillance d'un client professionnel", probabilite: 0.05, dommages: 15_000, perteDeCapacite: 0, ventesPerdues: 0 },
];

export type CodeDeFormule = "basique" | "etendue" | "tous-risques";

export interface FormuleDAssurance {
  code: CodeDeFormule;
  nom: string;
  primeParTrimestre: number;
  /** Ce qui reste à NOVA sur chaque sinistre couvert : l'assureur paie le coût au-delà. */
  franchise: number;
  couverts: readonly CodeDAlea[];
}

/**
 * LES TROIS FORMULES DE L'ASSUREUR (les noms et la prime de la « Basique » sont ceux de l'arène ; le
 * reste est une hypothèse du cours). La prime se paie chaque trimestre, qu'un sinistre tombe ou
 * non ; sur un sinistre couvert, l'assureur paie ce qui dépasse la franchise.
 *   - Basique : 1 500 € par trimestre, 5 000 € de franchise. L'incendie (dommages et pertes
 *     d'exploitation) et le dégât des eaux. C'est la formule souscrite le 1er octobre N
 *     (exercice-de-nova.ts) ; elle ne couvrait pas le litige de la batterie.
 *   - Étendue : 4 500 € par trimestre, 2 000 € de franchise. En plus, les pannes (le bris de
 *     machine), la cyberattaque et la responsabilité civile.
 *   - Tous risques : 7 000 € par trimestre, 1 000 € de franchise. En plus, la défaillance d'un client
 *     (l'assurance-crédit).
 * Plus la formule couvre, plus la prime dépasse ce qu'elle rembourse en moyenne : l'assureur fait
 * payer ses frais et le risque qu'il porte.
 */
export const FORMULES: readonly FormuleDAssurance[] = [
  { code: "basique", nom: "Basique", primeParTrimestre: 1_500, franchise: 5_000, couverts: ["incendie", "degat-des-eaux"] },
  {
    code: "etendue",
    nom: "Étendue",
    primeParTrimestre: 4_500,
    franchise: 2_000,
    couverts: ["incendie", "degat-des-eaux", "panne-majeure", "panne", "cyberattaque", "responsabilite-civile"],
  },
  {
    code: "tous-risques",
    nom: "Tous risques",
    primeParTrimestre: 7_000,
    franchise: 1_000,
    couverts: ["incendie", "degat-des-eaux", "panne-majeure", "panne", "cyberattaque", "responsabilite-civile", "defaillance-client"],
  },
];

/**
 * CE QUE NOVA PEUT ENCAISSER D'UN SEUL COUP, au 1er janvier N + 1 (la clôture d'exercice-de-nova.ts).
 *   - LA TRÉSORERIE : le compte courant porte 115 734,87 € ; le placement de 133 000 € est la réserve
 *     de la gamme à venir, et le dirigeant n'y touche pas. Il garde un matelas de 10 000 € (le seuil
 *     d'alerte de la trésorerie de nova-gestion.ts).
 *   - LES CAPITAUX PROPRES : 229 225,96 €, le capital de 150 000 € et le résultat de N
 *     (79 225,96 €), qui reste dans l'entreprise. HYPOTHÈSE DU COURS : un sinistre qui les ferait
 *     tomber sous la moitié du capital social (75 000 €) met l'entreprise en danger ; c'est le seuil
 *     où la loi oblige les associés à décider s'ils continuent.
 * Le cours compte un sinistre pour son coût entier, avant impôt.
 */
export const CAPACITE_D_ABSORPTION = {
  compteCourant: 115_734.87,
  reserve: 133_000,
  matelas: 10_000,
  capitauxPropres: 229_225.96,
  capitalSocial: 150_000,
  partDuCapitalAGarder: 0.5,
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// LA MACHINE EN PLUS
// ─────────────────────────────────────────────────────────────────────────────

export type CodeDeMachine = "poste-manuel" | "ligne-automatisee";

export interface MachineDuCatalogue {
  code: CodeDeMachine;
  nom: string;
  /** Son prix, payé à l'achat, le 1er janvier N + 1 ; elle tourne dès le trimestre 1. */
  prix: number;
  /** Les enceintes de plus que l'outil peut monter par trimestre. */
  capaciteEnPlus: number;
  /** Les opérateurs qu'il faut embaucher pour la faire tourner. */
  embauches: number;
  /** Les heures de main-d'œuvre d'une enceinte montée sur elle. */
  heuresParEnceinte: number;
  /** Son entretien de l'année, au budget de référence. */
  entretienParAn: number;
  /** Sa durée d'utilisation : l'amortissement linéaire, l'emprunt et l'horizon de la VAN. */
  dureeEnAnnees: number;
}

/**
 * LES DEUX MACHINES DU CATALOGUE (hypothèses du cours, inspirées du catalogue d'équipements de
 * l'arène).
 *   - Un cinquième poste manuel, le même que les quatre de la ligne : 15 000 €, 6 ans, 1 750 enceintes
 *     de plus par trimestre (le quart de la ligne). Il faut un opérateur de plus (0,3 h l'enceinte :
 *     1 800 enceintes par trimestre). Son entretien : le quart de celui de la ligne, 4 500 € par an.
 *   - Une ligne automatisée : 60 000 €, 6 ans, 3 500 enceintes de plus par trimestre. Un opérateur la
 *     pilote, et y monte une enceinte en 0,15 h (3 600 par trimestre). Son entretien : 6 000 € par an.
 */
export const MACHINES: readonly MachineDuCatalogue[] = [
  { code: "poste-manuel", nom: "Un cinquième poste manuel", prix: 15_000, capaciteEnPlus: 1_750, embauches: 1, heuresParEnceinte: 0.3, entretienParAn: 4_500, dureeEnAnnees: 6 },
  { code: "ligne-automatisee", nom: "Une ligne automatisée", prix: 60_000, capaciteEnPlus: 3_500, embauches: 1, heuresParEnceinte: 0.15, entretienParAn: 6_000, dureeEnAnnees: 6 },
];

/**
 * L'INVESTISSEMENT (hypothèses du cours).
 *   - LE FINANCEMENT : un emprunt du prix de la machine, à 5 % l'an (le taux de l'emprunt de NOVA),
 *     sur sa durée d'utilisation, capital remboursé par parts égales chaque année.
 *   - LE TAUX D'ACTUALISATION : 8 % par an, ce que NOVA attend d'un euro investi dans sa croissance,
 *     plus que le taux de l'emprunt, parce que les ventes de demain sont incertaines.
 *   - L'IMPÔT : 25 % du résultat gagné (le taux normal : NOVA dépasse déjà le plafond du taux réduit
 *     en N). Un résultat perdu fait économiser l'impôt d'autant.
 *   - LA DEMANDE : la machine se juge sur la demande de N + 1, puis sur la même demande plus haute de
 *     5 %, 10 % ou 25 %, gardée toute la durée de la machine (des hypothèses de vente, pas une
 *     prévision).
 */
export const INVESTISSEMENT = {
  tauxDeLEmprunt: 0.05,
  tauxDActualisation: 0.08,
  tauxDImpot: 0.25,
  haussesDeLaDemande: [0, 0.05, 0.1, 0.25],
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// LA FICHE
// ─────────────────────────────────────────────────────────────────────────────

export interface FicheDeLaCapacite {
  code: string;
  entreprise: string;
  unite: string;
  unites: string;
  enceinte: { readonly nom: string; readonly prix: number; readonly coutVariable: { readonly composants: number; readonly autres: number } };
  ligne: { readonly postes: number; readonly valeurANeuf: number; readonly capaciteParTrimestre: number };
  operateurs: {
    readonly nombre: number;
    readonly heuresParMois: number;
    readonly heuresParEnceinte: number;
    readonly salaireBrutMensuel: number;
    readonly tauxDesCotisationsPatronales: number;
  };
  anneeN: AnneeDeNova;
  anneeNPlus1: AnneeDeNova;
  entretien: {
    readonly budgetDeReference: number;
    readonly usureParTrimestre: number;
    readonly reparationAuBudgetDeReference: number;
    readonly disponibiliteMinimale: number;
    readonly defautsEnPlusSansEntretien: number;
  };
  plan: { readonly entretien: readonly number[]; readonly prevention: number; readonly operateurs: number };
  qualite: {
    readonly courbe: readonly PointDeLaQualite[];
    readonly budgetActuel: number;
    readonly controleFinal: { readonly cout: number; readonly tauxDeDetection: number };
    readonly coutDUnDefautDetecte: number;
    readonly coutDUnDefautLivre: number;
    readonly ventesPerduesParDefautLivre: number;
  };
  demarches: readonly DemarcheQualite[];
  personnel: {
    readonly salaireDuMarche: { readonly n: number; readonly nPlus1: number };
    readonly seuilDeDemission: number;
    readonly moisDeLAnnonce: number;
    readonly preavisEnMois: number;
    readonly delaiDeRecrutementEnMois: number;
    readonly coutDUnRecrutement: number;
    readonly integration: { readonly mois: number; readonly productivite: number };
  };
  aleas: readonly AleaDeNova[];
  formules: readonly FormuleDAssurance[];
  absorption: {
    readonly compteCourant: number;
    readonly reserve: number;
    readonly matelas: number;
    readonly capitauxPropres: number;
    readonly capitalSocial: number;
    readonly partDuCapitalAGarder: number;
  };
  machines: readonly MachineDuCatalogue[];
  investissement: { readonly tauxDeLEmprunt: number; readonly tauxDActualisation: number; readonly tauxDImpot: number; readonly haussesDeLaDemande: readonly number[] };
}

export const NOVA_CAPACITE: FicheDeLaCapacite = {
  code: "nova",
  entreprise: "NOVA",
  unite: "enceinte",
  unites: "enceintes",
  enceinte: ENCEINTE,
  ligne: LIGNE_DE_MONTAGE,
  operateurs: OPERATEURS,
  anneeN: ANNEE_N,
  anneeNPlus1: ANNEE_N_PLUS_1,
  entretien: ENTRETIEN,
  plan: PLAN_DE_N_PLUS_1,
  qualite: QUALITE,
  demarches: DEMARCHES_QUALITE,
  personnel: PERSONNEL,
  aleas: ALEAS,
  formules: FORMULES,
  absorption: CAPACITE_D_ABSORPTION,
  machines: MACHINES,
  investissement: INVESTISSEMENT,
};

/** Les fiches de capacité du monde du cours, par code d'entreprise. */
export const CAPACITES_DU_COURS: Readonly<Record<string, FicheDeLaCapacite>> = { [NOVA_CAPACITE.code]: NOVA_CAPACITE };
