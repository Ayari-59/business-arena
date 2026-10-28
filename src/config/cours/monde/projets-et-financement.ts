import { CLOTURE_DE_LA_FICHE, IMPOT_SUR_LES_SOCIETES, PAIE_DU_MOIS, TAUX_DE_LA_PAIE } from "./exercice-de-nova";
import { GAMME_DE_NOVA, INVESTISSEMENT_ENVISAGE } from "./nova-gestion";

/**
 * LE MONDE DU COURS : LES PROJETS ET LE FINANCEMENT, POUR LA FINANCE ET L'IMPÔT SUR LES SOCIÉTÉS.
 *
 * Fiche figée (voir l-escale.ts pour le principe du monde du cours : une simulation inspirée de
 * l'arène, calculée par le cours, qui ne lit jamais le moteur). Elle est la seule source des
 * chiffres des six chapitres du lot « DSCG finance et impôt sur les sociétés » : la valeur
 * actuelle nette, le TRI et le choix entre deux projets, l'effet de levier, la création de valeur,
 * l'impôt sur les sociétés et le déficit reporté. Le modèle qui la calcule est monde/finance.ts ;
 * la garde tests/cours/projets-et-financement.test.ts refait chaque chiffre à la main.
 *
 * TROIS ENTREPRISES DU COURS, CHACUNE POUR CE QU'ELLE MONTRE LE MIEUX :
 *   · NOVA (les enceintes, exercice-de-nova.ts et nova-gestion.ts) pour les projets
 *     d'investissement et l'impôt d'un exercice bénéficiaire. Après son premier exercice (N), NOVA
 *     lance en N+1 la gamme Go et Studio annoncée par nova-gestion.ts, sur une seconde ligne ; elle
 *     hésite entre une ligne manuelle et une ligne semi-automatique (deux projets qui s'excluent :
 *     l'atelier n'a la place que d'une ligne) ; elle reprend aussi le banc de mesure acoustique
 *     que le contrôle de gestion envisageait en avril N, sans l'acheter (un projet indépendant).
 *     NOVA n'a pas de dette nette (son placement et sa banque dépassent son emprunt) : ses projets
 *     se financent sur sa réserve, et s'actualisent au coût du capital de son activité.
 *   · L'ESCALE (l'hôtel, l-escale.ts et hotel.ts) pour l'effet de levier et la création de valeur :
 *     un fonds de commerce et des agencements lourds, financés pour moitié par la banque. Son
 *     résultat d'exploitation est celui de son année au prix de l'année dans le monde du cours.
 *   · PIXEL & CO (le commerce en ligne) pour le déficit : un exercice bénéficiaire (N−1), un
 *     exercice en perte (N), puis deux exercices bénéficiaires (N+1, N+2), le report en avant, le
 *     report en arrière et sa créance.
 *
 * CONVENTIONS : les montants sont hors taxes, en euros ; les taux sont des fractions (0,09 pour
 * 9 %) ; les flux d'un projet sont annuels, l'investissement au 1er janvier N+1 (la date 0), chaque
 * flux d'exploitation à la fin de son année (les dates 1 à 5).
 */

// ═════════════════════════════════════════════════════════════════════════════
// 1. LE MARCHÉ FINANCIER DU COURS (toutes les entreprises)
// ═════════════════════════════════════════════════════════════════════════════

/** LE TAUX SANS RISQUE (hypothèse du cours) : le rendement d'une obligation d'État à dix ans, 3 %. */
export const TAUX_SANS_RISQUE = 0.03;

/**
 * LA PRIME DE RISQUE DU MARCHÉ (hypothèse du cours) : ce que les actions rapportent en moyenne
 * au-delà du taux sans risque, 6 points par an (l'ordre de grandeur des études de place).
 */
export const PRIME_DE_RISQUE_DU_MARCHE = 0.06;

// ═════════════════════════════════════════════════════════════════════════════
// 2. NOVA : LES PROJETS DE N+1
// ═════════════════════════════════════════════════════════════════════════════

/**
 * LE BÊTA DE L'ACTIF DE NOVA (hypothèse du cours) : 1, le risque moyen du marché, celui d'un
 * fabricant d'électronique grand public dont les ventes suivent la consommation des ménages.
 */
export const BETA_DE_L_ACTIF_DE_NOVA = 1;

/**
 * LE TAUX D'ACTUALISATION DES PROJETS DE NOVA : le coût du capital de son activité, par le
 * MEDAF, taux sans risque + βa × prime = 3 % + 1 × 6 % = 9 %. NOVA n'a pas de dette nette : au
 * 31 décembre N, son placement (133 000 €) et sa banque dépassent son emprunt (68 000 €). Le coût
 * de son capital est donc celui de son activité, sans effet de la dette. Ses projets se financent
 * sur la réserve que le placement garde pour la gamme (exercice-de-nova.ts) : on juge un
 * investissement sans son financement, dont le coût est porté par le taux.
 */
export const TAUX_D_ACTUALISATION_DE_NOVA = 0.09;

/**
 * LE TAUX DE L'IMPÔT DES PROJETS : 25 %, le taux marginal de NOVA. Son bénéfice dépasse déjà
 * 42 500 € sans les projets (99 967,96 € en N) : le taux réduit est épuisé, et chaque euro de
 * résultat qu'un projet ajoute paie 25 %. Un résultat négatif d'un projet fait économiser 25 %
 * d'impôt sur le reste du bénéfice de NOVA.
 */
export const TAUX_DE_L_IMPOT_DES_PROJETS = IMPOT_SUR_LES_SOCIETES.tauxNormal;

/** La durée des projets de la gamme et du banc : cinq ans, de N+1 à N+5. */
export const DUREE_DES_PROJETS = 5;

/** Un équipement d'un projet, acheté et payé à la date 0, amorti en linéaire par années pleines. */
export interface ActifDuProjet {
  libelle: string;
  montant: number;
  dureeDAmortissement: number;
  /**
   * La part de sa valeur nette comptable qu'un acheteur d'occasion en donnerait à la fin du
   * projet (hypothèse du cours). La moins-value (ou la plus-value) entre dans le résultat, et
   * l'impôt la suit.
   */
  tauxDeReprise: number;
}

/**
 * Un produit d'un projet : son prix, son coût variable et ses quantités par année, de N+1 à N+5.
 * Une quantité négative est une vente que le projet fait perdre à un autre produit de NOVA.
 */
export interface ProduitDuProjet {
  code: string;
  nom: string;
  prix: number;
  coutVariable: number;
  quantites: readonly number[];
}

/** Une charge fixe décaissée chaque année du projet (négative : une économie). */
export interface ChargeDuProjet {
  libelle: string;
  montants: readonly number[];
}

export interface ProjetDInvestissement {
  code: string;
  nom: string;
  entreprise: string;
  actifs: readonly ActifDuProjet[];
  produits: readonly ProduitDuProjet[];
  charges: readonly ChargeDuProjet[];
  /** Le besoin en fonds de roulement d'une année, en part de son chiffre d'affaires hors taxes. */
  partDuBfr: number;
  duree: number;
}

const go = GAMME_DE_NOVA.references.find((r) => r.code === "go")!;
const one = GAMME_DE_NOVA.references.find((r) => r.code === "one")!;
const studio = GAMME_DE_NOVA.references.find((r) => r.code === "studio")!;

/**
 * LES VENTES DE LA GAMME (hypothèse du cours), de N+1 à N+5, aux prix et coûts variables de
 * nova-gestion.ts : Go à 34 € (19 € de coût variable), Studio à 129 € (70 €). Le lancement monte
 * en deux ans, plafonne, puis la gamme vieillit la cinquième année. Une part des clients de Studio
 * auraient acheté une One : la gamme fait perdre des ventes de One (59 €, 38 € de coût variable),
 * que les flux du projet retirent (ce sont des flux différentiels : avec le projet, moins sans).
 */
export const VENTES_DE_GO = [1_500, 2_500, 3_000, 3_000, 2_000] as const;
export const VENTES_DE_STUDIO = [1_000, 1_800, 2_400, 2_400, 1_800] as const;
export const VENTES_DE_ONE_PERDUES = [300, 500, 600, 600, 500] as const;

export const PRODUITS_DE_LA_GAMME: readonly ProduitDuProjet[] = [
  { code: "go", nom: go.nom, prix: go.prix, coutVariable: go.coutVariableUnitaire, quantites: VENTES_DE_GO },
  { code: "studio", nom: studio.nom, prix: studio.prix, coutVariable: studio.coutVariableUnitaire, quantites: VENTES_DE_STUDIO },
  { code: "one", nom: `${one.nom}, ventes perdues`, prix: one.prix, coutVariable: one.coutVariableUnitaire, quantites: VENTES_DE_ONE_PERDUES.map((q) => -q) },
];

/**
 * LA PUBLICITÉ DE LA GAMME (hypothèse du cours) : 12 000 € par an (nova-gestion.ts en comptait
 * 766 € par mois pour Go et Studio, soit 9 192 €, le cours arrondit en ajoutant les salons), et
 * une campagne de lancement de 15 000 € la première année.
 */
export const PUBLICITE_DE_LA_GAMME = 12_000;
export const CAMPAGNE_DE_LANCEMENT = 15_000;

/**
 * LE COÛT D'UN OPÉRATEUR DE PLUS, sur un an : la paie d'un salarié de NOVA (exercice-de-nova.ts :
 * 7 500 € bruts par mois pour quatre, soit 1 875 € chacun) et ses cotisations patronales
 * (42 %) : 1 875 € × 1,42 × 12 = 31 950 €.
 */
export const COUT_ANNUEL_D_UN_OPERATEUR = Math.round((PAIE_DU_MOIS.brut / PAIE_DU_MOIS.effectif) * (1 + TAUX_DE_LA_PAIE.patronalUrssaf + TAUX_DE_LA_PAIE.patronalRetraite) * 12);

/**
 * LE BESOIN EN FONDS DE ROULEMENT DE LA GAMME (hypothèse du cours) : 10 % du chiffre d'affaires
 * hors taxes de l'année, soit 36 jours. Go et Studio se vendent surtout aux chaînes de hi-fi,
 * payées à 60 jours ; le stock de composants et le crédit des fournisseurs en reprennent une
 * part. Le BFR d'une année se constitue au début de l'année (la date de l'année moins un) ; il se
 * récupère en entier à la fin du projet.
 */
export const PART_DU_BFR_DE_LA_GAMME = 0.1;

/** LES MOULES DE GO ET DE STUDIO (hypothèse du cours) : 40 000 €, amortis sur 5 ans, spécifiques, sans valeur de revente. */
export const MOULES_DE_LA_GAMME: ActifDuProjet = { libelle: "les moules de Go et de Studio", montant: 40_000, dureeDAmortissement: 5, tauxDeReprise: 0 };

/**
 * LE PROJET A, LA SECONDE LIGNE MANUELLE : la même ligne que la première (exercice-de-nova.ts,
 * 4 postes « Ligne manuelle » à 15 000 €, amortis sur 6 ans), plus les moules. Elle demande deux
 * opérateurs de plus et un entretien de 4 000 € par an. HYPOTHÈSE : un acheteur d'occasion en
 * donne 60 % de sa valeur nette comptable à la fin de N+5.
 */
export const PROJET_LIGNE_MANUELLE: ProjetDInvestissement = {
  code: "ligne-manuelle",
  nom: "la gamme sur une seconde ligne manuelle",
  entreprise: "NOVA",
  actifs: [{ libelle: "la seconde ligne manuelle", montant: 60_000, dureeDAmortissement: 6, tauxDeReprise: 0.6 }, MOULES_DE_LA_GAMME],
  produits: PRODUITS_DE_LA_GAMME,
  charges: [
    { libelle: "la publicité de la gamme", montants: [PUBLICITE_DE_LA_GAMME + CAMPAGNE_DE_LANCEMENT, PUBLICITE_DE_LA_GAMME, PUBLICITE_DE_LA_GAMME, PUBLICITE_DE_LA_GAMME, PUBLICITE_DE_LA_GAMME] },
    { libelle: "deux opérateurs de plus", montants: Array(DUREE_DES_PROJETS).fill(2 * COUT_ANNUEL_D_UN_OPERATEUR) },
    { libelle: "l'entretien de la ligne", montants: Array(DUREE_DES_PROJETS).fill(4_000) },
  ],
  partDuBfr: PART_DU_BFR_DE_LA_GAMME,
  duree: DUREE_DES_PROJETS,
};

/**
 * LE PROJET B, UNE LIGNE SEMI-AUTOMATIQUE à la place de la ligne manuelle : 150 000 €, amortie
 * sur 6 ans, plus les mêmes moules. Les mêmes ventes, la même publicité ; un seul opérateur de
 * plus, mais un entretien de 10 000 € par an. HYPOTHÈSE : elle se revend mieux, 80 % de sa valeur
 * nette comptable à la fin de N+5. Les projets A et B s'excluent : l'atelier n'a la place que
 * d'une seconde ligne.
 */
export const PROJET_LIGNE_SEMI_AUTOMATIQUE: ProjetDInvestissement = {
  code: "ligne-semi-automatique",
  nom: "la gamme sur une ligne semi-automatique",
  entreprise: "NOVA",
  actifs: [{ libelle: "la ligne semi-automatique", montant: 150_000, dureeDAmortissement: 6, tauxDeReprise: 0.8 }, MOULES_DE_LA_GAMME],
  produits: PRODUITS_DE_LA_GAMME,
  charges: [
    { libelle: "la publicité de la gamme", montants: [PUBLICITE_DE_LA_GAMME + CAMPAGNE_DE_LANCEMENT, PUBLICITE_DE_LA_GAMME, PUBLICITE_DE_LA_GAMME, PUBLICITE_DE_LA_GAMME, PUBLICITE_DE_LA_GAMME] },
    { libelle: "un opérateur de plus", montants: Array(DUREE_DES_PROJETS).fill(COUT_ANNUEL_D_UN_OPERATEUR) },
    { libelle: "l'entretien de la ligne", montants: Array(DUREE_DES_PROJETS).fill(10_000) },
  ],
  partDuBfr: PART_DU_BFR_DE_LA_GAMME,
  duree: DUREE_DES_PROJETS,
};

/**
 * LE BANC DE MESURE ACOUSTIQUE (nova-gestion.ts : 30 000 € hors taxes, amorti sur 60 mois),
 * repris en N+1, indépendant de la gamme. HYPOTHÈSE DU COURS : il contrôle chaque One avant
 * l'expédition ; les retours sous garantie passent de 2,5 % à 1 % des 24 000 One livrées par an
 * (23 609 enceintes livrées en N, arrondies), et chaque retour évité épargne 40 € (transport,
 * pièces, temps). Son étalonnage annuel coûte 1 400 €. Aucune vente en plus, aucun BFR, aucune
 * valeur de revente.
 */
export const ONE_LIVREES_PAR_AN = 24_000;
export const TAUX_DE_RETOUR_SANS_LE_BANC = 0.025;
export const TAUX_DE_RETOUR_AVEC_LE_BANC = 0.01;
export const COUT_D_UN_RETOUR = 40;
export const ETALONNAGE_DU_BANC = 1_400;
/** Les retours évités chaque année : 24 000 × (2,5 % − 1 %) = 360. */
export const RETOURS_EVITES_PAR_AN = Math.round(ONE_LIVREES_PAR_AN * (TAUX_DE_RETOUR_SANS_LE_BANC - TAUX_DE_RETOUR_AVEC_LE_BANC));

export const PROJET_BANC_DE_MESURE: ProjetDInvestissement = {
  code: "banc-de-mesure",
  nom: INVESTISSEMENT_ENVISAGE.libelle,
  entreprise: "NOVA",
  actifs: [{ libelle: INVESTISSEMENT_ENVISAGE.libelle, montant: INVESTISSEMENT_ENVISAGE.montantHt, dureeDAmortissement: INVESTISSEMENT_ENVISAGE.dureeDAmortissementMois / 12, tauxDeReprise: 0 }],
  produits: [],
  charges: [
    { libelle: "les retours sous garantie évités", montants: Array(DUREE_DES_PROJETS).fill(-RETOURS_EVITES_PAR_AN * COUT_D_UN_RETOUR) },
    { libelle: "l'étalonnage du banc", montants: Array(DUREE_DES_PROJETS).fill(ETALONNAGE_DU_BANC) },
  ],
  partDuBfr: 0,
  duree: DUREE_DES_PROJETS,
};

/** Les projets de NOVA, par code. */
export const PROJETS_DE_NOVA: Readonly<Record<string, ProjetDInvestissement>> = Object.fromEntries(
  [PROJET_LIGNE_MANUELLE, PROJET_LIGNE_SEMI_AUTOMATIQUE, PROJET_BANC_DE_MESURE].map((p) => [p.code, p]),
);

// ═════════════════════════════════════════════════════════════════════════════
// 3. L'ESCALE : LE BILAN, LE FINANCEMENT, LE COÛT DU CAPITAL
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Le bilan et l'année d'une entreprise, tels que l'analyse financière les lit : l'actif
 * économique (les immobilisations nettes et le besoin en fonds de roulement), et son financement
 * (les capitaux propres et l'endettement financier net). L'emprunt se rembourse par annuités le
 * 31 décembre : les intérêts de l'année courent sur le capital dû au 1er janvier.
 */
export interface BilanFinancier {
  entreprise: string;
  immobilisationsNettes: number;
  stocks: number;
  creancesClients: number;
  dettesFournisseurs: number;
  dettesFiscalesEtSociales: number;
  disponibilites: number;
  /** Les capitaux propres au 31 décembre, résultat de l'année compris. */
  capitauxPropres: number;
  /** Le capital de l'emprunt dû au 31 décembre, après l'annuité. */
  emprunt: number;
  /** Le capital dû au 1er janvier, sur lequel les intérêts de l'année ont couru. */
  empruntAuPremierJanvier: number;
  tauxDeLEmprunt: number;
  resultatDExploitation: number;
  tauxDeLImpot: number;
}

/**
 * LE RÉSULTAT D'EXPLOITATION DE L'ESCALE : son année au prix de l'année dans le monde du cours
 * (l-escale.ts, hotel.ts). 17 700 nuitées vendues à 88 € (la demande de l'été dépasse les
 * 5 400 nuitées offertes) : 1 557 600 € de chiffre d'affaires, moins 21 € par nuitée occupée
 * (371 700 €) et 210 000 € de charges fixes par trimestre (840 000 €, amortissements compris) :
 * 345 900 €. La garde le refait sur la fiche de l'hôtel.
 */
export const RESULTAT_D_EXPLOITATION_DE_L_ESCALE = 345_900;

/**
 * LE BILAN DE L'ESCALE AU 31 DÉCEMBRE (hypothèse du cours, posée sur son année). L'hôtel loue ses
 * murs (le loyer est dans ses charges fixes) : son actif est un fonds de commerce (700 000 €) et
 * des agencements, des installations et un mobilier refaits il y a peu (1 430 000 € nets). Son
 * cycle d'exploitation retient peu d'argent : les clients paient au départ, sauf les agences et les
 * entreprises, à 30 jours. Les capitaux propres et l'endettement net se partagent l'actif
 * économique à parts égales, un levier de 1.
 *   · L'EMPRUNT, contracté pour la rénovation : 1 325 000 € dus au 1er janvier, à 4 % l'an, une
 *     annuité de 100 000 € de capital le 31 décembre (1 225 000 € restent dus), soit 53 000 €
 *     d'intérêts. Le taux est variable : le cas de la hausse du taux le relève.
 *   · LES DISPONIBILITÉS, 150 000 €, sur un compte courant qui ne rapporte rien : retranchées de
 *     l'emprunt, elles font l'endettement net, et la trésorerie oisive renchérit son coût.
 *   · L'IMPÔT : 25 % sur tout le bénéfice. L'ESCALE n'a pas droit au taux réduit (HYPOTHÈSE DU
 *     COURS : son capital est détenu à 70 % par une société hôtelière familiale, et non par des
 *     personnes physiques).
 */
export const BILAN_DE_L_ESCALE: BilanFinancier = {
  entreprise: "L'ESCALE",
  immobilisationsNettes: 2_130_000,
  stocks: 8_000,
  creancesClients: 72_000,
  dettesFournisseurs: 26_000,
  dettesFiscalesEtSociales: 34_000,
  disponibilites: 150_000,
  capitauxPropres: 1_075_000,
  emprunt: 1_225_000,
  empruntAuPremierJanvier: 1_325_000,
  tauxDeLEmprunt: 0.04,
  resultatDExploitation: RESULTAT_D_EXPLOITATION_DE_L_ESCALE,
  tauxDeLImpot: IMPOT_SUR_LES_SOCIETES.tauxNormal,
};

/**
 * LE BÊTA DE L'ACTIF DE L'ESCALE (hypothèse du cours) : 0,8. Un hôtel de ville a un risque
 * d'activité sous la moyenne du marché (une clientèle d'affaires régulière), mais la dette fait
 * porter plus de risque aux associés : leur bêta se réendette par la relation de Hamada.
 */
export const BETA_DE_L_ACTIF_DE_L_ESCALE = 0.8;

/**
 * LA MARGE DE CRÉDIT (hypothèse du cours, pour le laboratoire de la structure financière) : plus
 * L'ESCALE s'endette, plus la banque lui prête cher. Chaque unité de levier en plus (un euro de
 * dette nette de plus par euro de capitaux propres) ajoute 1 point au taux de l'emprunt, chaque
 * unité en moins le retire : au levier de la fiche (1), le taux est celui du contrat, 4 %.
 */
export const MARGE_DE_CREDIT_PAR_UNITE_DE_LEVIER = 0.01;

/**
 * LES SCÉNARIOS DE L'ESCALE (hypothèses du cours, à la place des rejeux de l'arène). Chacun part
 * du bilan de la fiche et change une seule chose au 1er janvier ; le modèle refait l'année :
 *   · L'APPORT : les associés apportent 300 000 €, et L'ESCALE rembourse autant d'emprunt par
 *     anticipation. L'exploitation ne change pas, seul le financement change ;
 *   · LE TAUX RELEVÉ : le taux variable de l'emprunt passe de 4 % à 7 % pour toute l'année ;
 *   · LA SALLE DE SÉMINAIRE : 240 000 € d'aménagements, amortis sur 10 ans, payés par un nouvel
 *     emprunt de 240 000 € à 4 % (remboursé à partir de l'année suivante). Elle attire des groupes
 *     et des séminaires : 39 000 € d'excédent brut d'exploitation en plus par an.
 */
export const APPORT_DES_ASSOCIES = 300_000;
export const TAUX_RELEVE = 0.07;
export const SALLE_DE_SEMINAIRE = { libelle: "une salle de séminaire", montant: 240_000, dureeDAmortissement: 10, excedentBrutEnPlus: 39_000 } as const;

/**
 * L'EXIGENCE D'UN FONDS D'INVESTISSEMENT (le cas « Ce que doit rapporter l'exploitation ») : un
 * fonds qui entrerait au capital de L'ESCALE exigerait 15 % par an sur les capitaux propres.
 */
export const EXIGENCE_DU_FONDS = 0.15;

// ═════════════════════════════════════════════════════════════════════════════
// 4. L'IMPÔT SUR LES SOCIÉTÉS : LE DROIT DU COURS
// ═════════════════════════════════════════════════════════════════════════════

/**
 * LE TAUX RÉDUIT ET SES CONDITIONS (le droit, repris par exercice-de-nova.ts) : 15 % jusqu'à
 * 42 500 € de bénéfice, 25 % au-delà, pour une société dont le chiffre d'affaires hors taxes
 * reste sous 10 000 000 €, dont le capital est entièrement libéré, et détenu pour 75 % au moins par
 * des personnes physiques (ou par des sociétés qui remplissent elles-mêmes ces conditions).
 */
export const TAUX_REDUIT = IMPOT_SUR_LES_SOCIETES.tauxReduit;
export const PLAFOND_DU_TAUX_REDUIT = IMPOT_SUR_LES_SOCIETES.plafondDuTauxReduit;
export const TAUX_NORMAL = IMPOT_SUR_LES_SOCIETES.tauxNormal;
export const CONDITIONS_DU_TAUX_REDUIT = { chiffreDAffairesMaximal: 10_000_000, partMinimaleDesPersonnesPhysiques: 0.75 } as const;

/**
 * LES ACOMPTES (le droit, simplifié par le cours) : quatre acomptes, le 15 mars, le 15 juin, le
 * 15 septembre et le 15 décembre, chacun le quart de l'impôt de l'exercice de référence (le dernier
 * clos), calculé avec le taux réduit pour une PME qui y a droit. Aucun acompte quand cet impôt
 * reste sous 3 000 €, ni au premier exercice d'une société nouvelle. Le solde (l'impôt de
 * l'exercice moins les acomptes) se paie le 15 mai suivant la clôture ; un excédent est rendu.
 * HYPOTHÈSE DU COURS : les quatre acomptes de l'exercice se calculent tous sur l'impôt de
 * l'exercice précédent (le droit fait calculer celui du 15 mars sur l'avant-dernier exercice
 * quand le dernier n'est pas encore déclaré, puis le régularise le 15 juin).
 */
export const ACOMPTES = { dates: ["15 mars", "15 juin", "15 septembre", "15 décembre"], part: 0.25, seuilDeDispense: 3_000, dateDuSolde: "15 mai" } as const;

/**
 * LE REPORT EN AVANT (le droit) : un déficit se reporte sur les bénéfices des exercices suivants,
 * sans limite de durée, mais chaque exercice n'en impute que 1 000 000 €, plus 50 % du bénéfice
 * au-delà de 1 000 000 €. À la taille des entreprises du cours, le plafond ne joue pas : il ne se
 * voit qu'en poussant le bénéfice d'un laboratoire au-delà du million.
 */
export const PLAFOND_DU_REPORT_EN_AVANT = { fixe: 1_000_000, partDuBeneficeAuDela: 0.5 } as const;

/**
 * LE REPORT EN ARRIÈRE (le droit, sur option) : le déficit d'un exercice peut s'imputer sur le
 * bénéfice de l'exercice précédent, non distribué, dans la limite de 1 000 000 €. Il fait naître
 * une créance sur l'État égale au déficit reporté × le taux normal de l'impôt (25 %), non
 * imposable, qui paie l'impôt des cinq exercices suivants ; ce qui en reste est remboursé au bout
 * de cinq ans. Le reste du déficit se reporte en avant.
 */
export const PLAFOND_DU_REPORT_EN_ARRIERE = 1_000_000;
export const DUREE_D_UTILISATION_DE_LA_CREANCE = 5;

// ═════════════════════════════════════════════════════════════════════════════
// 5. L'IMPÔT DE NOVA EN N+1
// ═════════════════════════════════════════════════════════════════════════════

/** Une correction extra-comptable : une charge que la loi ne déduit pas, ou un produit qu'elle n'impose pas. */
export interface CorrectionFiscale {
  libelle: string;
  montant: number;
}

export interface ExerciceFiscal {
  entreprise: string;
  exercice: string;
  /** Le résultat comptable avant impôt (négatif : une perte). */
  resultatComptable: number;
  reintegrations: readonly CorrectionFiscale[];
  deductions: readonly CorrectionFiscale[];
}

/**
 * LA VOITURE DU GÉRANT DE NOVA (hypothèse du cours) : achetée le 2 janvier N+1, 36 000 € toutes
 * taxes comprises (la TVA d'une voiture de tourisme ne se récupère pas), amortie en linéaire sur
 * 5 ans, 7 200 € par an. Pour ses émissions de CO2 (entre 50 et 130 g/km), la loi ne déduit
 * l'amortissement que sur 18 300 € : 3 660 € par an. L'excédent, 3 540 €, se réintègre.
 */
export const VOITURE_DU_GERANT = { prixTtc: 36_000, dureeDAmortissement: 5, plafondDeDeduction: 18_300 } as const;

/** LA MAJORATION DE RETARD (hypothèse du cours) : une déclaration de TVA de mars N+1 déposée en retard, 480 € ; une pénalité ne se déduit pas. */
export const MAJORATION_DE_RETARD = 480;

/** L'excédent d'amortissement de la voiture : 36 000 € ÷ 5 − 18 300 € ÷ 5 = 3 540 €. */
export const AMORTISSEMENT_EXCEDENTAIRE = (VOITURE_DU_GERANT.prixTtc - VOITURE_DU_GERANT.plafondDeDeduction) / VOITURE_DU_GERANT.dureeDAmortissement;

/**
 * LE SECOND EXERCICE DE NOVA, N+1 (hypothèse du cours) : la gamme lancée, NOVA gagne 118 460 €
 * avant impôt. C'est son premier exercice à acomptes : les quatre se calculent sur l'impôt de N,
 * 20 742 € (exercice-de-nova.ts), soit 5 185,50 € chacun. NOVA a toujours droit au taux réduit :
 * son chiffre d'affaires reste loin de 10 000 000 €, son capital de 150 000 € est libéré, détenu
 * par ses associés fondateurs.
 */
export const EXERCICE_N1_DE_NOVA: ExerciceFiscal = {
  entreprise: "NOVA",
  exercice: "N+1",
  resultatComptable: 118_460,
  reintegrations: [
    { libelle: "l'amortissement de la voiture du gérant au-delà du plafond", montant: AMORTISSEMENT_EXCEDENTAIRE },
    { libelle: "la majoration de retard sur la TVA", montant: MAJORATION_DE_RETARD },
  ],
  deductions: [],
};

/** L'impôt de N (exercice-de-nova.ts, CLOTURE_DE_LA_FICHE) : la référence des acomptes de N+1, 20 742 €. */
export const IMPOT_DE_NOVA_EN_N = CLOTURE_DE_LA_FICHE.impot;

/**
 * Les conditions du taux réduit, telles que NOVA les remplit : son chiffre d'affaires de N (la
 * production vendue de exercice-de-nova.ts, 1 390 276 €), son capital libéré, tout entier à ses
 * associés fondateurs.
 */
export const NOVA_ET_LE_TAUX_REDUIT = { chiffreDAffaires: CLOTURE_DE_LA_FICHE.soldes.production, capitalEntierementLibere: true, partDesPersonnesPhysiques: 1 } as const;

// ═════════════════════════════════════════════════════════════════════════════
// 6. PIXEL & CO : UN EXERCICE EN PERTE ENTRE DES EXERCICES BÉNÉFICIAIRES
// ═════════════════════════════════════════════════════════════════════════════

/**
 * PIXEL & CO, le commerçant en ligne du cours (hypothèses du cours, à l'échelle de son année dans
 * l'arène : un million d'euros de chiffre d'affaires, un stock de marchandises). Elle n'a pas
 * droit au taux réduit : son capital est détenu à 60 % par un groupe de distribution, une société
 * dont le chiffre d'affaires dépasse 10 000 000 €. Tout son bénéfice paie 25 %.
 */
export const PIXEL_ET_LE_TAUX_REDUIT = { chiffreDAffaires: 1_020_000, capitalEntierementLibere: true, partDesPersonnesPhysiques: 0.4 } as const;

/**
 * LA DÉPRÉCIATION FORFAITAIRE DU STOCK (hypothèse du cours) : à la clôture de N, PIXEL & CO
 * déprécie son stock de 3 000 €, « par prudence », sans viser un article précis. Une dépréciation
 * forfaitaire ne se déduit pas : elle se réintègre en N. Sa reprise de N+1, déjà taxée, se déduit.
 */
export const DEPRECIATION_FORFAITAIRE_DU_STOCK = 3_000;

/** LES PÉNALITÉS DE N (hypothèse du cours) : des pénalités de retard douanières sur une importation, 1 400 €, non déductibles. */
export const PENALITES_DE_PIXEL = 1_400;

/**
 * LES EXERCICES DE PIXEL & CO (hypothèses du cours) :
 *   · N−1 : 36 000 € de bénéfice fiscal, 9 000 € d'impôt, tout mis en réserve (rien de distribué) ;
 *   · N : une année en perte (un entrepôt neuf qui démarre mal, des retours en masse) : 64 400 €
 *     de perte comptable ; réintégrées, la dépréciation forfaitaire et les pénalités font un
 *     déficit fiscal de 60 000 € ;
 *   · N+1 : 30 000 € de bénéfice comptable, 27 000 € de bénéfice fiscal (la reprise déduite) ;
 *   · N+2 : 48 000 €, sans correction.
 */
export const EXERCICES_DE_PIXEL: readonly ExerciceFiscal[] = [
  { entreprise: "PIXEL & CO", exercice: "N−1", resultatComptable: 36_000, reintegrations: [], deductions: [] },
  {
    entreprise: "PIXEL & CO",
    exercice: "N",
    resultatComptable: -64_400,
    reintegrations: [
      { libelle: "la dépréciation forfaitaire du stock", montant: DEPRECIATION_FORFAITAIRE_DU_STOCK },
      { libelle: "les pénalités de retard douanières", montant: PENALITES_DE_PIXEL },
    ],
    deductions: [],
  },
  { entreprise: "PIXEL & CO", exercice: "N+1", resultatComptable: 30_000, reintegrations: [], deductions: [{ libelle: "la reprise de la dépréciation forfaitaire, taxée en N", montant: DEPRECIATION_FORFAITAIRE_DU_STOCK }] },
  { entreprise: "PIXEL & CO", exercice: "N+2", resultatComptable: 48_000, reintegrations: [], deductions: [] },
];

/** Le rang de l'exercice en perte dans EXERCICES_DE_PIXEL (N). */
export const RANG_DE_L_EXERCICE_EN_PERTE = 1;

/**
 * LES ACOMPTES DE PIXEL & CO EN N (hypothèse du cours) : calculés sur l'impôt de N−1, 9 000 €,
 * soit 2 250 € chacun, et tous versés (PIXEL & CO n'a pas vu venir la perte, et ne s'est pas
 * dispensée des derniers). L'exercice N ne doit rien : l'excédent, 9 000 €, est rendu après la
 * déclaration, en mai N+1.
 */
export const IMPOT_DE_PIXEL_EN_N_MOINS_1 = 9_000;

/** LA DÉPENSE DU CAS « La dépense de l'année en perte » (hypothèse du cours) : une révision de l'entrepôt, 5 000 €, passée en N. */
export const DEPENSE_DE_L_ANNEE_EN_PERTE = 5_000;

/** LA DÉPENSE DU CAS « La dépense de fin d'année » (hypothèse du cours) : NOVA double un entretien en décembre N+1, 4 800 € de charges en plus. */
export const DEPENSE_DE_FIN_D_ANNEE = 4_800;
