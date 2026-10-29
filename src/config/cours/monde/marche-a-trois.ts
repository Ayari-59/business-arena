import { QUALITE } from "./nova-capacite";
import { AUTRES_COUTS_PAR_ENCEINTE, CAPACITE_DU_TRIMESTRE, CHARGES_FIXES_DU_MOIS, COMPOSANTS_PAR_ENCEINTE, PRIX_DE_L_ENCEINTE } from "./nova-gestion";

/**
 * LE MONDE DU COURS : LE MARCHÉ À TROIS (NOVA, SoundBox et Auris ; les chapitres de stratégie
 * « domination par les coûts ou différenciation », « lire la stratégie de ses concurrents » et
 * « la responsabilité sociétale »).
 *
 * NOVA fabrique des enceintes (voir l-escale.ts pour le principe du monde du cours : une simulation
 * figée, inspirée de l'arène, calculée par le cours). Cette fiche est la seule source des chiffres
 * des trois chapitres du lot et de leurs cas. Le modèle qui les calcule est dans
 * monde/attractivite.ts ; la garde tests/cours/marche-a-trois.test.ts refait chaque chiffre à la main.
 *
 * TROIS ENSEIGNES SE PARTAGENT UN MARCHÉ. Chaque trimestre, les clients achètent 15 502 enceintes
 * aux trois enseignes réunies. Chacune en prend une part égale à son attractivité rapportée à la
 * somme des trois : attractivité = (prix de référence ÷ prix) puissance 4 × qualité perçue
 * puissance 2 × (1 + image) × (1 + bonus du label, quand il est accordé). Ses ventes sont cette part
 * du marché, à l'enceinte près, dans la limite de sa capacité.
 *
 * LA NOVA DE LA FICHE est celle des autres fiches : la NOVA One de nova-gestion.ts (59 € hors taxes,
 * 22 € de composants, 16 € d'autres coûts variables : 21 € de marge sur coût variable), la ligne de
 * 7 000 enceintes par trimestre, les charges fixes de janvier (31 183 € par mois, 374 196 € par an),
 * et le budget de prévention de la qualité de nova-capacite.ts (16 000 € par an, 4 000 € par
 * trimestre). Comme dans nova-gestion.ts, NOVA ne fait pas de publicité payante.
 *
 * UNE ANNÉE TYPE, À MARCHÉ PLAT. Les trois chapitres raisonnent sur une année de quatre trimestres
 * égaux : la saison, que suivent les chapitres de la capacité (nova-capacite.ts), est mise à part.
 * À sa position d'aujourd'hui, NOVA y vend 19 112 enceintes, quatre premiers trimestres (l'année N en a livré 23 609, la
 * demande prévue de N + 1 est de 27 200) : la capacité de la ligne ne borne aucune des stratégies
 * des chapitres, et la notion se lit sans goulot. Le marché est celui des trois enseignes, pas
 * tout le marché des enceintes de nova-gestion.ts : NOVA y tient 30,8 % (24 à 26 % du marché
 * entier dans nova-gestion.ts).
 *
 * CE QUI VIENT DE L'ARÈNE, ET CE QUI A ÉTÉ CHOISI. Viennent du scénario nova de l'arène : les noms et
 * les métiers des concurrents (SoundBox casse les prix, Auris tient le haut de gamme), le prix de
 * référence du marché (59 €, celui des étudiants), et tous les réglages du capital-image (inertie
 * 0,65, échelle 12 000 €, sensibilité 0,22, seuil du label 0,70, bonus 15 % pendant 2 trimestres, rien
 * avant le trimestre 3). Le reste est une hypothèse du cours, dite à sa place : la taille du marché,
 * les élasticités, les courbes du budget qualité et de la communication, les gammes de NOVA, les
 * prix, les coûts, les budgets et les capacités des concurrents.
 *
 * LE CALIBRAGE (voir le rapport du lot) : au prix d'aujourd'hui, 59 €, NOVA est à son meilleur prix
 * pour son offre (59,50 € ne lui ferait gagner que quelques dizaines d'euros) ; son budget qualité
 * de 4 000 € par trimestre est le meilleur, et la communication ne lui paierait pas. Ce qui change le
 * résultat, c'est de changer d'offre : la gamme, et le prix qui va avec. C'est la stratégie.
 *
 * CONVENTIONS. Tout est hors taxes. Un trimestre a trois mois. Les budgets (qualité, communication,
 * RSE) se décident par trimestre et sont des charges du trimestre. Les ventes s'arrondissent à
 * l'enceinte chaque trimestre ; une demande au-delà de la capacité est perdue. Les enseignes ne
 * réagissent pas aux décisions de NOVA : leurs offres sont celles de la fiche.
 */

// ─────────────────────────────────────────────────────────────────────────────
// LE MARCHÉ ET L'ATTRACTIVITÉ
// ─────────────────────────────────────────────────────────────────────────────

export type Trimestre = 1 | 2 | 3 | 4;

/**
 * LE MARCHÉ : 15 502 enceintes par trimestre, achetées aux trois enseignes réunies, 62 008 sur
 * l'année. Il est le même chaque trimestre (l'année type, à marché plat), et ne grandit pas quand une
 * enseigne devient plus attractive : ce qu'elle gagne, elle le prend aux deux autres.
 * UNE SEULE DEMANDE DE NOVA (réconciliation d'octobre 2026) : le trimestre type est celui de janvier
 * à mars, la saison mise à part. La taille est choisie pour qu'à sa position d'aujourd'hui (59 €),
 * NOVA y reçoive la demande de la droite de nova-gestion.ts à 59 €, 4 778 enceintes, celles qu'elle a
 * vendues au premier trimestre de N : 15 502, ce sont aussi les ventes des trois enseignes sur le
 * marché de toutes les enceintes de janvier à mars (monde/economie-et-marketing.ts). La garde
 * tests/cours/une-seule-nova.test.ts le vérifie. (Avant : 17 500, et 5 394 enceintes pour NOVA.)
 */
export const MARCHE = { parTrimestre: 15_502, trimestres: 4 } as const;

/** Un point d'une courbe : un budget par trimestre, et ce qu'il ajoute (ou retire, s'il est négatif). */
export interface PointDeCourbe {
  budget: number;
  effet: number;
}

/**
 * L'ATTRACTIVITÉ D'UNE OFFRE (hypothèses du cours).
 *   - LE PRIX : l'attractivité varie comme (59 ÷ prix) puissance 4. Un prix plus bas de 1 % la
 *     relève d'environ 4 % ; à 54 €, elle est multipliée par 1,42. Le prix de référence, 59 €, est
 *     celui des étudiants de l'arène, et celui de la NOVA One.
 *   - LA QUALITÉ PERÇUE : l'attractivité varie comme la qualité perçue puissance 2 (1 est la qualité
 *     de la NOVA One d'aujourd'hui). Une qualité plus haute de 1 % la relève d'environ 2 %.
 *   - L'IMAGE : l'attractivité est multipliée par (1 + image), l'image étant ce que la communication
 *     du trimestre ajoute, plus 0,22 × le capital-image (voir la RSE).
 *   - LE LABEL : quand il est accordé, il relève l'attractivité de 15 %.
 * Les deux élasticités font qu'un client paie volontiers plus cher une enceinte meilleure, mais pas
 * beaucoup plus : pour garder la même attractivité avec un prix plus haut de 10 %, il faut une
 * qualité plus haute d'environ 21 %.
 */
export const ATTRACTIVITE = {
  prixDeReference: PRIX_DE_L_ENCEINTE,
  elasticiteAuPrix: 4,
  elasticiteALaQualite: 2,
} as const;

/**
 * LE BUDGET QUALITÉ (hypothèse du cours) : la prévention de la qualité, chaque trimestre (formation,
 * essais des composants, réglage des postes : le budget de nova-capacite.ts). Il ajoute à la qualité
 * de conception de la gamme ce que dit la courbe : −0,06 sans budget, −0,02 à 2 000 €, rien à
 * 4 000 € (le budget de NOVA), +0,02 à 8 000 €, +0,03 à 16 000 €, plus rien au-delà. Entre deux
 * points, la courbe est une droite : chaque euro en plus ajoute moins que le précédent. Le budget ne
 * fait pas d'une enceinte ordinaire une enceinte haut de gamme : c'est la gamme qui le fait.
 */
export const COURBE_DU_BUDGET_QUALITE: readonly PointDeCourbe[] = [
  { budget: 0, effet: -0.06 },
  { budget: 2_000, effet: -0.02 },
  { budget: 4_000, effet: 0 },
  { budget: 8_000, effet: 0.02 },
  { budget: 16_000, effet: 0.03 },
];

/**
 * LA COMMUNICATION (hypothèse du cours) : la publicité du trimestre ajoute à l'image ce que dit la
 * courbe, dans le trimestre même, puis s'éteint : +0,04 à 4 000 €, +0,06 à 8 000 €, +0,08 à
 * 16 000 €, plus rien au-delà. Entre deux points, la courbe est une droite.
 */
export const COURBE_DE_LA_COMMUNICATION: readonly PointDeCourbe[] = [
  { budget: 0, effet: 0 },
  { budget: 4_000, effet: 0.04 },
  { budget: 8_000, effet: 0.06 },
  { budget: 16_000, effet: 0.08 },
];

// ─────────────────────────────────────────────────────────────────────────────
// LE CAPITAL-IMAGE ET LE LABEL (LA RSE)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * LE CAPITAL-IMAGE (les réglages RSE du scénario nova de l'arène, recopiés ici et figés).
 *   - L'EFFORT d'un trimestre : ln(1 + budget RSE ÷ 12 000 €), 12 000 € étant l'échelle de dépense
 *     du scénario. Doubler le budget n'y double pas l'effort.
 *   - LE CAPITAL à la fin d'un trimestre : 0,65 × le capital de la fin du trimestre d'avant + 0,35 ×
 *     l'effort du trimestre. Il garde 65 % de ce qu'il était : il monte lentement, et retombe
 *     lentement si l'on arrête. À budget constant, il tend vers l'effort sans jamais le dépasser.
 *   - SON EFFET : l'image d'un trimestre compte 0,22 × le capital de la fin du trimestre d'avant.
 *     L'engagement d'un trimestre ne rapporte donc rien dans le trimestre même.
 *   - LE LABEL : à partir du trimestre 3, il est accordé au trimestre dont le capital d'ouverture
 *     (celui de la fin du trimestre d'avant) atteint 0,70 ; il relève l'attractivité de 15 % pendant
 *     2 trimestres, et se renouvelle tant que le capital reste au seuil.
 *   - LE BUDGET DU COURS : 12 000 € par trimestre, une fois l'échelle. Son effort vaut ln 2, soit
 *     0,693 : à ce budget, le capital plafonne juste sous le seuil, et le label ne vient jamais.
 * Le bad buzz, la sanction et le process propre de l'arène ne sont pas dans la simulation du cours.
 */
export const RSE = {
  inertie: 0.65,
  echelle: 12_000,
  sensibilite: 0.22,
  seuilDuLabel: 0.7,
  bonusDuLabel: 0.15,
  dureeDuLabel: 2,
  premierTrimestreDuLabel: 3,
  budgetDuCours: 12_000,
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// LES OFFRES : LES GAMMES DE NOVA, LES TROIS ENSEIGNES
// ─────────────────────────────────────────────────────────────────────────────

export type CodeDeGamme = "standard" | "actuelle" | "soignee";

export interface GammeDeNova {
  code: CodeDeGamme;
  nom: string;
  /** Les composants d'une enceinte. */
  composants: number;
  /** Les autres coûts variables d'une enceinte : emballage, transport, énergie de la chaîne. */
  autres: number;
  /** La qualité que les clients reconnaissent à la gamme, au budget qualité de référence (4 000 €). */
  qualiteDeConception: number;
}

/**
 * LES TROIS GAMMES QUE NOVA PEUT MONTER sur sa ligne (hypothèses du cours, sauf la gamme actuelle).
 *   - La gamme standard : des composants courants (19 €) et un emballage simplifié (15 €), 34 € par
 *     enceinte, 4 € de moins qu'aujourd'hui ; qualité de conception 0,92.
 *   - La gamme actuelle : la NOVA One de nova-gestion.ts, 22 € et 16 €, 38 € par enceinte ; 1,00.
 *   - La gamme soignée : des haut-parleurs d'une autre classe (27 €) et le même reste (16 €), 43 € par
 *     enceinte, 5 € de plus ; qualité de conception 1,28.
 * La gamme actuelle est un compromis : elle n'est ni la moins chère à produire, ni celle que les
 * clients préfèrent. Les 5 € de la gamme soignée achètent plus de qualité (0,28) que les 4 € que la
 * gamme standard économise n'en coûtent (0,08).
 */
export const GAMMES: readonly GammeDeNova[] = [
  { code: "standard", nom: "la gamme standard", composants: 19, autres: 15, qualiteDeConception: 0.92 },
  { code: "actuelle", nom: "la gamme actuelle", composants: COMPOSANTS_PAR_ENCEINTE, autres: AUTRES_COUTS_PAR_ENCEINTE, qualiteDeConception: 1 },
  { code: "soignee", nom: "la gamme soignée", composants: 27, autres: 16, qualiteDeConception: 1.28 },
];

/** Ce qu'une enseigne met sur le marché, chaque trimestre de l'année : ses leviers. */
export interface Offre {
  prix: number;
  /** Ses coûts variables par enceinte. */
  composants: number;
  autres: number;
  qualiteDeConception: number;
  /** Ses budgets par trimestre. */
  budgetQualite: number;
  budgetCommunication: number;
  budgetRse: number;
}

export type CodeDEnseigne = "nova" | "soundbox" | "auris";

export interface EnseigneDuMarche {
  code: CodeDEnseigne;
  nom: string;
  /** Ce qu'elle fait de son offre, dans les mots du chapitre. */
  metier: string;
  offre: Offre;
  /** Son capital-image au début de l'année. */
  capitalImage: number;
  /** Ses charges fixes de l'année, hors budgets (loyer, personnel, amortissements). */
  chargesFixes: number;
  /** Les enceintes qu'elle peut fabriquer en un trimestre. */
  capacite: number;
}

/**
 * NOVA AUJOURD'HUI : la NOVA One à 59 €, la gamme actuelle, 4 000 € de budget qualité par trimestre
 * (le budget actuel de prévention de nova-capacite.ts, 16 000 € par an), ni publicité ni RSE, les
 * charges fixes de janvier de nova-gestion.ts pour douze mois (loyer 19 700 €, personnel 10 650 €,
 * amortissement 833 €), la ligne de 7 000 enceintes par trimestre.
 */
export const NOVA: EnseigneDuMarche = {
  code: "nova",
  nom: "NOVA",
  metier: "la NOVA One, une enceinte au prix et à la qualité du milieu du marché",
  offre: {
    prix: PRIX_DE_L_ENCEINTE,
    composants: COMPOSANTS_PAR_ENCEINTE,
    autres: AUTRES_COUTS_PAR_ENCEINTE,
    qualiteDeConception: 1,
    budgetQualite: QUALITE.budgetActuel / 4,
    budgetCommunication: 0,
    budgetRse: 0,
  },
  capitalImage: 0,
  chargesFixes: 12 * (CHARGES_FIXES_DU_MOIS.loyer + CHARGES_FIXES_DU_MOIS.personnel + CHARGES_FIXES_DU_MOIS.amortissement),
  capacite: CAPACITE_DU_TRIMESTRE,
};

/**
 * SOUNDBOX (hypothèses du cours, sur le profil « casse les prix » de l'arène) : 51 €, des
 * composants à 16 € et 12 € d'autres coûts (une grande usine, des achats par très grandes séries),
 * une qualité de conception de 0,96 sans budget qualité (0,90 perçue), beaucoup de publicité
 * (16 000 € par trimestre), pas de RSE. Une grande usine : 640 000 € de charges fixes par an,
 * 12 000 enceintes par trimestre.
 */
export const SOUNDBOX: EnseigneDuMarche = {
  code: "soundbox",
  nom: "SoundBox",
  metier: "une enceinte bon marché, fabriquée en très grandes séries",
  offre: { prix: 51, composants: 16, autres: 12, qualiteDeConception: 0.96, budgetQualite: 0, budgetCommunication: 16_000, budgetRse: 0 },
  capitalImage: 0,
  chargesFixes: 640_000,
  capacite: 12_000,
};

/**
 * AURIS (hypothèses du cours, sur le profil « haut de gamme » de l'arène) : 79 €, des composants à
 * 34 € et 18 € d'autres coûts, une qualité de conception de 1,31 et 16 000 € de budget qualité par
 * trimestre (1,34 perçue), 8 000 € de communication. Elle s'engage depuis des années : 12 000 € de
 * budget RSE chaque trimestre (le budget du cours), qui ont porté son capital-image à son plafond,
 * ln 2, sous le seuil du label. Un petit atelier : 135 000 € de charges fixes par an, 5 000 enceintes
 * par trimestre.
 */
export const AURIS: EnseigneDuMarche = {
  code: "auris",
  nom: "Auris",
  metier: "une enceinte haut de gamme, chère, et engagée",
  offre: { prix: 79, composants: 34, autres: 18, qualiteDeConception: 1.31, budgetQualite: 16_000, budgetCommunication: 8_000, budgetRse: RSE.budgetDuCours },
  // Le régime permanent de 12 000 € par trimestre : le capital y vaut l'effort, ln(1 + 12 000 ÷ 12 000).
  capitalImage: Math.log(1 + RSE.budgetDuCours / RSE.echelle),
  chargesFixes: 135_000,
  capacite: 5_000,
};

// ─────────────────────────────────────────────────────────────────────────────
// LES STRATÉGIES DE NOVA
// ─────────────────────────────────────────────────────────────────────────────

export type CodeDeStrategie = "milieu" | "couts" | "differenciation" | "demi-mesure" | "prix-de-la-place" | "place-et-qualite";

/** Une stratégie de NOVA : sa gamme et ses leviers, tenus les quatre trimestres de l'année. */
export interface StrategieDeNova {
  code: CodeDeStrategie;
  nom: string;
  gamme: CodeDeGamme;
  prix: number;
  budgetQualite: number;
  budgetCommunication: number;
}

/**
 * LES STRATÉGIES DES CHAPITRES (hypothèses du cours), tenues toute l'année.
 *   - LE MILIEU : NOVA aujourd'hui (59 €, gamme actuelle, 4 000 € de budget qualité).
 *   - LA DOMINATION PAR LES COÛTS : la gamme standard (4 € de moins par enceinte), le prix à 54 €
 *     (5 € de moins, 3 € de plus que SoundBox), le budget qualité coupé de moitié (2 000 €), pas de
 *     communication. Elle vend plus, et gagne un peu moins sur chaque enceinte.
 *   - LA DIFFÉRENCIATION : la gamme soignée (5 € de plus par enceinte), le prix à 69 € (10 € de plus,
 *     10 € de moins qu'Auris), le budget qualité doublé (8 000 €) et 2 000 € de communication, pour
 *     que les clients voient la différence qu'ils paient. Elle vend moins, et gagne plus sur chaque
 *     enceinte.
 *   - LA DEMI-MESURE du cas « baisser les prix sans rien couper » : le prix de la stratégie de coûts,
 *     54 €, sans rien changer d'autre (la gamme actuelle, 4 000 € de budget qualité).
 *   - LE PRIX DE LA PLACE du cas « aller dans l'espace libre » : 69 €, le milieu des prix de NOVA et
 *     d'Auris, sans rien changer d'autre (la lecture de la carte par le seul prix).
 *   - LA PLACE ET SA QUALITÉ : 69 €, et la gamme soignée qui porte NOVA à la qualité de la place, les
 *     budgets d'aujourd'hui.
 */
export const STRATEGIES: readonly StrategieDeNova[] = [
  { code: "milieu", nom: "le milieu", gamme: "actuelle", prix: 59, budgetQualite: 4_000, budgetCommunication: 0 },
  { code: "couts", nom: "la domination par les coûts", gamme: "standard", prix: 54, budgetQualite: 2_000, budgetCommunication: 0 },
  { code: "differenciation", nom: "la différenciation", gamme: "soignee", prix: 69, budgetQualite: 8_000, budgetCommunication: 2_000 },
  { code: "demi-mesure", nom: "les prix bas sans rien couper", gamme: "actuelle", prix: 54, budgetQualite: 4_000, budgetCommunication: 0 },
  { code: "prix-de-la-place", nom: "le prix de la place, sans rien changer d'autre", gamme: "actuelle", prix: 69, budgetQualite: 4_000, budgetCommunication: 0 },
  { code: "place-et-qualite", nom: "la place, avec la gamme soignée", gamme: "soignee", prix: 69, budgetQualite: 4_000, budgetCommunication: 0 },
];

// ─────────────────────────────────────────────────────────────────────────────
// LA CARTE
// ─────────────────────────────────────────────────────────────────────────────

/**
 * LA RÈGLE DE LECTURE DE LA CARTE (celle du chapitre « lire la stratégie de ses concurrents ») : les
 * indices se calculent sur le prix moyen du marché (le chiffre d'affaires des trois enseignes divisé
 * par leurs ventes, au centime) et sur la qualité moyenne (la moyenne des trois qualités perçues, au
 * centième). Une enseigne suit la domination par les coûts quand son indice de prix est à plus de
 * 5 points sous 100 et son indice de qualité sous 100 ; la différenciation, à plus de 5 points
 * au-dessus avec un indice de qualité au-dessus de 100 ; sinon, elle tient une position
 * intermédiaire.
 */
export const CARTE = { ecartDUneStrategie: 5 } as const;

// ─────────────────────────────────────────────────────────────────────────────
// LA FICHE
// ─────────────────────────────────────────────────────────────────────────────

export interface FicheDuMarche {
  code: string;
  entreprise: string;
  unite: string;
  unites: string;
  marche: { readonly parTrimestre: number; readonly trimestres: number };
  attractivite: { readonly prixDeReference: number; readonly elasticiteAuPrix: number; readonly elasticiteALaQualite: number };
  courbeDuBudgetQualite: readonly PointDeCourbe[];
  courbeDeLaCommunication: readonly PointDeCourbe[];
  rse: {
    readonly inertie: number;
    readonly echelle: number;
    readonly sensibilite: number;
    readonly seuilDuLabel: number;
    readonly bonusDuLabel: number;
    readonly dureeDuLabel: number;
    readonly premierTrimestreDuLabel: number;
    readonly budgetDuCours: number;
  };
  gammes: readonly GammeDeNova[];
  /** Les trois enseignes, NOVA d'abord. */
  enseignes: readonly EnseigneDuMarche[];
  strategies: readonly StrategieDeNova[];
  carte: { readonly ecartDUneStrategie: number };
}

export const MARCHE_A_TROIS: FicheDuMarche = {
  code: "nova",
  entreprise: "NOVA",
  unite: "enceinte",
  unites: "enceintes",
  marche: MARCHE,
  attractivite: ATTRACTIVITE,
  courbeDuBudgetQualite: COURBE_DU_BUDGET_QUALITE,
  courbeDeLaCommunication: COURBE_DE_LA_COMMUNICATION,
  rse: RSE,
  gammes: GAMMES,
  enseignes: [NOVA, SOUNDBOX, AURIS],
  strategies: STRATEGIES,
  carte: CARTE,
};

/** Les marchés à trois du monde du cours, par code d'entreprise. */
export const MARCHES_DU_COURS: Readonly<Record<string, FicheDuMarche>> = { [MARCHE_A_TROIS.code]: MARCHE_A_TROIS };
