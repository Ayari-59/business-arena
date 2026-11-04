import { auCentime } from "./amortissement";
import { interetsDuPlacement } from "./cloture";
import { CLOTURE, CONTRAT_DE_PRET, EQUIPEMENT, PLACEMENT } from "./exercice-de-nova";
import { tri } from "./finance";
import { EMPRUNT_DE_LA_LIGNE, LIGNE_A_FINANCER } from "./financement-de-la-gamme";

/**
 * LE MONDE DU COURS : LA VALEUR ET LE TEMPS (DCG UE6 2.1).
 *
 * Fiche figée et modèle du chapitre « La valeur et le temps » et de son cas. Elle ne lit jamais
 * l'arène. Elle reprend, sans les recopier, les chiffres que les autres chapitres de NOVA ont posés
 * (une seule NOVA) :
 *   · LE COMPTE À TERME de l'exercice (PLACEMENT, 133 000 € à 3 %, du 6 janvier N au 6 janvier
 *     N+1) : ses intérêts courus au 31 décembre se calculent comme à la clôture (`interetsDuPlacement`,
 *     jours comptés sur 360), 3 934,58 € ;
 *   · LA PREMIÈRE LIGNE, la ligne manuelle de l'exercice (EQUIPEMENT, 60 000 € HT, 6 ans) : mise en
 *     service en janvier N, elle sera à remplacer à la fin de N+5 ;
 *   · LA LIGNE SEMI-AUTOMATIQUE de la gamme (LIGNE_A_FINANCER, 150 000 € HT) et l'offre de la banque
 *     (EMPRUNT_DE_LA_LIGNE, 5 % sur 5 ans), celles du chapitre « Emprunt ou crédit-bail ».
 *
 * CONVENTIONS : les taux sont des fractions ; les montants sont arrondis au centime à la fin de
 * chaque calcul, jamais en cours de route ; une annuité tombe à la fin de chaque année (terme échu),
 * la première un an après la date de départ.
 */

// ═════════════════════════════════════════════════════════════════════════════
// 1. LES OUTILS : INTÉRÊTS, CAPITALISATION, ACTUALISATION, ANNUITÉS
// ═════════════════════════════════════════════════════════════════════════════

/** Les intérêts simples d'un capital sur une durée en années : C × i × n. Ils ne portent pas eux-mêmes intérêt. */
export const interetsSimples = (capital: number, taux: number, annees: number) => auCentime(capital * taux * annees);

/** La valeur acquise à intérêts simples : C × (1 + i × n). */
export const valeurAcquiseSimple = (capital: number, taux: number, annees: number) => auCentime(capital * (1 + taux * annees));

/** La valeur acquise à intérêts composés : C × (1 + i)^n. Les intérêts de chaque année portent intérêt ensuite. */
export const valeurAcquise = (capital: number, taux: number, annees: number) => auCentime(capital * (1 + taux) ** annees);

/** La valeur actuelle d'une somme future : C × (1 + i)^−n. Actualiser est l'inverse de capitaliser. */
export const valeurActuelleDUneSomme = (somme: number, taux: number, annees: number) => auCentime(somme * (1 + taux) ** -annees);

/** Le coefficient de valeur acquise d'une suite de n annuités de 1 € : ((1 + i)^n − 1) ÷ i. */
export const coefficientDeValeurAcquise = (taux: number, n: number) => (taux === 0 ? n : ((1 + taux) ** n - 1) / taux);

/** Le coefficient de valeur actuelle d'une suite de n annuités de 1 € : (1 − (1 + i)^−n) ÷ i. */
export const coefficientDeValeurActuelle = (taux: number, n: number) => (taux === 0 ? n : (1 - (1 + taux) ** -n) / taux);

/** La valeur acquise, à la date de la dernière, de n annuités constantes. */
export const valeurAcquiseDesAnnuites = (annuite: number, taux: number, n: number) => auCentime(annuite * coefficientDeValeurAcquise(taux, n));

/** La valeur actuelle, un an avant la première, de n annuités constantes. */
export const valeurActuelleDesAnnuites = (annuite: number, taux: number, n: number) => auCentime(annuite * coefficientDeValeurActuelle(taux, n));

/** L'annuité constante qui constitue un capital à la date de la dernière : VA × i ÷ ((1 + i)^n − 1). */
export const annuitePourConstituer = (capital: number, taux: number, n: number) => auCentime(capital / coefficientDeValeurAcquise(taux, n));

/** L'annuité constante qui rembourse un capital prêté : C × i ÷ (1 − (1 + i)^−n). */
export const annuiteDeRemboursement = (capital: number, taux: number, n: number) => auCentime(capital / coefficientDeValeurActuelle(taux, n));

/** LE TAUX RÉEL (relation de Fisher) : (1 + taux nominal) = (1 + taux réel) × (1 + inflation). */
export const tauxReel = (tauxNominal: number, inflation: number) => (1 + tauxNominal) / (1 + inflation) - 1;

/** Le taux nominal qui garde un taux réel donné : (1 + réel) × (1 + inflation) − 1. */
export const tauxNominal = (tauxReelVise: number, inflation: number) => (1 + tauxReelVise) * (1 + inflation) - 1;

/**
 * LE TAUX DE RENDEMENT ACTUARIEL d'un actif payé `prix` à la date 0, qui rapporte `flux` aux dates
 * 1, 2… : le taux qui égale le prix et la valeur actuelle des flux. Cherché entre 0 % et 100 %.
 */
export const tauxDeRendementActuariel = (prix: number, flux: readonly number[]) => tri([-prix, ...flux], { bas: 0, haut: 1 })!;

/** La valeur actuelle, à la date 0, de flux tombant aux dates 1, 2… (non arrondie en route). */
export const valeurActuelleDesFlux = (flux: readonly number[], taux: number) => auCentime(flux.reduce((s, f, k) => s + f * (1 + taux) ** -(k + 1), 0));

// ═════════════════════════════════════════════════════════════════════════════
// 2. NOVA : LA RÉSERVE, LA PREMIÈRE LIGNE À REMPLACER, L'OFFRE DU FOURNISSEUR
// ═════════════════════════════════════════════════════════════════════════════

/** La réserve placée : le compte à terme de l'exercice, 133 000 € à 3 %. */
export const RESERVE_PLACEE = PLACEMENT;

/** Les intérêts courus du compte à terme au 31 décembre N, comme à la clôture : 355 jours sur 360. */
export const interetsCourusDeLaReserve = () => interetsDuPlacement(PLACEMENT.montant, PLACEMENT.tauxAnnuel, PLACEMENT.date, CLOTURE);

/**
 * LA RÉSERVE GARDÉE TROIS ANS (hypothèse du cours, pour comparer les deux calculs) : si NOVA n'en
 * avait pas eu l'usage, la banque l'aurait reconduite trois ans au même taux, intérêts laissés sur
 * le compte (intérêts composés), ou versés chaque année sur le compte courant (intérêts simples).
 */
export const ANNEES_DE_LA_RESERVE = 3;

/**
 * LA PREMIÈRE LIGNE À REMPLACER : la ligne manuelle de l'exercice, 60 000 € HT, s'use en 6 ans ; elle
 * sera à remplacer fin N+5. NOVA veut réunir son prix par cinq versements égaux, placés à la fin de
 * chaque année de N+1 à N+5, au taux du compte à terme (hypothèse du cours).
 */
export const RENOUVELLEMENT = {
  prixDAujourdHui: EQUIPEMENT.ht,
  versements: EQUIPEMENT.dureeAns - 1,
  taux: PLACEMENT.tauxAnnuel,
} as const;

/**
 * L'INFLATION PRÉVUE (hypothèse du cours) : 2 % par an, la cible de la banque centrale. Le prix d'une
 * ligne neuve suit l'inflation : 60 000 € aujourd'hui en coûteront 60 000 × 1,02^5 fin N+5.
 */
export const INFLATION_PREVUE = 0.02;

/** Le prix de la ligne neuve fin N+5, au taux d'inflation donné. */
export const prixFuturDeLaLigne = (inflation = INFLATION_PREVUE) => valeurAcquise(RENOUVELLEMENT.prixDAujourdHui, inflation, RENOUVELLEMENT.versements);

/** Le pas des versements du laboratoire : 500 €. */
export const PAS_DU_VERSEMENT = 500;

/** Les leviers de la réserve de renouvellement : le versement annuel, le taux du placement, l'inflation. */
export interface LeviersDuRenouvellement {
  versement: number;
  taux: number;
  inflation: number;
}

/** La réserve de renouvellement : ce que les versements valent fin N+5, ce que coûte la ligne, l'écart, le taux réel. */
export function reserveDeRenouvellement(l: Partial<LeviersDuRenouvellement> = {}) {
  const taux = l.taux ?? RENOUVELLEMENT.taux;
  const inflation = l.inflation ?? INFLATION_PREVUE;
  const n = RENOUVELLEMENT.versements;
  const versement = l.versement ?? annuitePourConstituer(RENOUVELLEMENT.prixDAujourdHui, taux, n);
  const acquis = valeurAcquiseDesAnnuites(versement, taux, n);
  const prix = prixFuturDeLaLigne(inflation);
  return { versement, taux, inflation, acquis, prix, ecart: auCentime(acquis - prix), reel: tauxReel(taux, inflation), versementNecessaire: annuitePourConstituer(prix, taux, n) };
}

/** Le plus petit versement, au pas du laboratoire, qui paie la ligne neuve fin N+5. */
export const versementQuiSuffit = (taux = RENOUVELLEMENT.taux, inflation = INFLATION_PREVUE) =>
  Math.ceil(reserveDeRenouvellement({ taux, inflation }).versementNecessaire / PAS_DU_VERSEMENT) * PAS_DU_VERSEMENT;

/**
 * L'OFFRE DU FOURNISSEUR DE LA LIGNE (hypothèse du cours) : au lieu des 150 000 € comptant le 1er
 * janvier N+1, cinq annuités de 35 000 €, payées à la fin de chaque année de N+1 à N+5. NOVA la juge
 * au taux de la banque, 5 % : c'est ce que lui coûterait l'argent emprunté pour payer comptant.
 */
export const PAIEMENT_ECHELONNE = { comptant: LIGNE_A_FINANCER.montant, annuite: 35_000, annees: 5 } as const;

/** Le taux auquel NOVA juge l'offre : celui de la banque, 5 %. */
export const TAUX_DE_LA_BANQUE = EMPRUNT_DE_LA_LIGNE.taux;

/** L'offre échelonnée : sa valeur actuelle au taux de la banque, son taux actuariel, l'annuité constante de la banque. */
export function offreEchelonnee(taux = TAUX_DE_LA_BANQUE) {
  const p = PAIEMENT_ECHELONNE;
  const flux = Array.from({ length: p.annees }, () => p.annuite);
  const valeurActuelle = valeurActuelleDesAnnuites(p.annuite, taux, p.annees);
  return {
    ...p,
    flux,
    taux,
    valeurActuelle,
    /** Positif : l'échelonnement coûte plus que le comptant, en valeur d'aujourd'hui. */
    surcout: auCentime(valeurActuelle - p.comptant),
    tauxActuariel: tauxDeRendementActuariel(p.comptant, flux),
    annuiteDeLaBanque: annuiteDeRemboursement(p.comptant, TAUX_DE_LA_BANQUE, p.annees),
    total: auCentime(p.annuite * p.annees),
  };
}

/** Le taux du prêt de NOVA (5 %), qui sert de taux de la banque : le même que celui de la ligne. */
export const TAUX_DU_PRET_DE_NOVA = CONTRAT_DE_PRET.tauxAnnuel;

// ═════════════════════════════════════════════════════════════════════════════
// 3. LE CAS : LE COMPTE À TERME PROGRESSIF
// ═════════════════════════════════════════════════════════════════════════════

/**
 * LE COMPTE À TERME PROGRESSIF (le cas « Le compte à terme progressif », hypothèse du cours) : pour
 * 50 000 € dont NOVA n'aura pas besoin avant deux ans, la banque propose 2 % la première année puis
 * 4,2 % la seconde, intérêts capitalisés ; ou son compte à terme ordinaire, 3 % les deux ans.
 */
export const COMPTE_PROGRESSIF = { capital: 50_000, taux: [0.02, 0.042], tauxFixe: PLACEMENT.tauxAnnuel } as const;

/** Les deux comptes : valeurs acquises, taux actuariel annuel du progressif, taux réels. */
export function compteProgressif(inflation = INFLATION_PREVUE) {
  const k = COMPTE_PROGRESSIF;
  const n = k.taux.length;
  const apresUnAn = auCentime(k.capital * (1 + k.taux[0]!));
  const acquisProgressif = auCentime(k.capital * k.taux.reduce((p, t) => p * (1 + t), 1));
  const acquisFixe = valeurAcquise(k.capital, k.tauxFixe, n);
  const tauxActuariel = (acquisProgressif / k.capital) ** (1 / n) - 1;
  return {
    ...k,
    n,
    apresUnAn,
    acquisProgressif,
    acquisFixe,
    ecart: auCentime(acquisProgressif - acquisFixe),
    tauxActuariel,
    /** La moyenne simple des deux taux, que l'on prend à tort pour le taux du placement. */
    moyenne: k.taux.reduce((s, t) => s + t, 0) / n,
    reelProgressif: tauxReel(tauxActuariel, inflation),
    reelFixe: tauxReel(k.tauxFixe, inflation),
  };
}
