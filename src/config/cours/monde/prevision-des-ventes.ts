import { moindresCarres, moyennesMobilesCentrees } from "./boutique";
import { ANNEE_N, ANNEE_N_PLUS_1 } from "./nova-capacite";
import { CAPACITE_DU_TRIMESTRE, MARCHE_DES_ENCEINTES } from "./nova-gestion";

/**
 * LE MONDE DU COURS : LA PRÉVISION DES VENTES DE NOVA POUR N + 1 (le chapitre « Prévoir les ventes :
 * tendance et saisons » et son cas, BTS CG P5 5.4.1, DCG UE11 § 3.2, BUT GEA).
 *
 * NOVA N'A QU'UNE ANNÉE D'HISTOIRE. Créée en janvier N (exercice-de-nova.ts), elle n'a vendu que
 * quatre trimestres : trop peu pour séparer la tendance de la saison. Le marché des enceintes, lui,
 * existait avant elle. La prévision suit donc la démarche d'une jeune entreprise : ajuster la
 * tendance du MARCHÉ sur ses trois dernières années, en tirer les coefficients saisonniers par la
 * méthode des rapports à la tendance, prévoir le marché de chaque trimestre de N + 1, et y appliquer
 * la part de marché de NOVA.
 *
 * AUCUN CHIFFRE DE NOVA N'EST NOUVEAU. Les ventes de NOVA de chaque trimestre de N sont celles de
 * nova-capacite.ts (ANNEE_N : 4 778, 6 081, 5 810, 6 940 enceintes) ; le marché du premier et du
 * deuxième trimestre de N est la somme des mois de nova-gestion.ts (MARCHE_DES_ENCEINTES : 18 100 et
 * 24 900 enceintes). Ce fichier n'ajoute que le marché des trimestres que les autres fiches ne
 * disent pas (HYPOTHÈSE DU COURS, MARCHE_AVANT_N et MARCHE_DU_SECOND_SEMESTRE_DE_N) et une règle
 * (PART_GARDEE_EN_N_PLUS_1).
 *
 * LE LIEN AVEC N + 1. La demande de N + 1 que les chapitres de la capacité lisent (nova-capacite.ts,
 * ANNEE_N_PLUS_1 : 5 800, 7 400, 6 200, 7 800 enceintes) EST cette prévision, arrondie à la centaine
 * d'enceintes : le plan se fait en centaines, la prévision à l'enceinte. La garde
 * tests/cours/une-seule-nova.test.ts le vérifie.
 *
 * LES RÈGLES DE CALCUL, celles d'un énoncé :
 *   · le rang t des trimestres va de 1 (premier trimestre de N − 2) à 12 (quatrième de N), puis de
 *     13 à 16 pour N + 1 ;
 *   · la tendance est la droite des moindres carrés y = a t + b sur les douze trimestres bruts
 *     (ajustement linéaire), ou la courbe y = B × A^t ajustée sur leurs logarithmes (ajustement
 *     exponentiel) ;
 *   · le rapport d'un trimestre à sa tendance s'arrondit au millième ; le coefficient saisonnier
 *     d'un trimestre est la moyenne de ses trois rapports, au millième ; si les quatre coefficients
 *     ne font pas 4, chacun se corrige (× 4 ÷ leur somme, au millième) ;
 *   · la prévision du marché est la tendance × le coefficient, à l'enceinte ; celle de NOVA, le
 *     marché prévu × sa part, à l'enceinte ;
 *   · la part de marché s'écrit en pourcentage, à deux décimales (deux décimales, 10 novembre 2026 ; au dixième, avant).
 */

// ─────────────────────────────────────────────────────────────────────────────
// LES DONNÉES
// ─────────────────────────────────────────────────────────────────────────────

/**
 * LE MARCHÉ DES ENCEINTES AVANT NOVA (hypothèse du cours) : toutes les enceintes vendues en France
 * par tous les vendeurs, trimestre par trimestre, en N − 2 et en N − 1, relevées par le syndicat de
 * la profession. Le marché grandit d'environ 10 600 enceintes par an ; le printemps et Noël font les
 * pics, l'hiver et l'été les creux.
 */
export const MARCHE_AVANT_N: Readonly<Record<"N − 2" | "N − 1", readonly number[]>> = {
  "N − 2": [14_700, 18_300, 15_720, 19_920],
  "N − 1": [17_000, 21_400, 18_100, 22_800],
};

/**
 * LE MARCHÉ DU SECOND SEMESTRE DE N (hypothèse du cours) : 20 700 enceintes de juillet à septembre,
 * 26 200 d'octobre à décembre. NOVA y vend 5 810 et 6 940 enceintes (ANNEE_N).
 */
export const MARCHE_DU_SECOND_SEMESTRE_DE_N = [20_700, 26_200] as const;

/**
 * LA RÈGLE DE LA PRÉVISION (hypothèse du cours) : en N + 1, NOVA garde sa part de marché de N, celle
 * de l'année entière (ses ventes de N ÷ le marché de N, au dixième). Le chapitre fait varier cette
 * part dans son laboratoire.
 */
export const PART_GARDEE_EN_N_PLUS_1 = "la part de marché de l'année N" as const;

/** Les années de la série, dans l'ordre. */
export const ANNEES_DE_LA_SERIE = ["N − 2", "N − 1", "N"] as const;
export type AnneeDeLaSerie = (typeof ANNEES_DE_LA_SERIE)[number];

/** Les deux tendances que le chapitre compare. */
export type AjustementDeTendance = "lineaire" | "exponentiel";

// ─────────────────────────────────────────────────────────────────────────────
// LES ARRONDIS
// ─────────────────────────────────────────────────────────────────────────────

/** L'arrondi à n décimales d'un énoncé : la moitié monte, sur la valeur décimale (pas sur son approximation binaire). */
const arrondi = (x: number, n: number) => {
  const p = 10 ** n;
  return (Math.sign(x) * Math.round(Number((Math.abs(x) * p).toPrecision(15)))) / p + 0;
};
export const auMillieme = (x: number) => arrondi(x, 3);
export const auDixieme = (x: number) => arrondi(x, 1);
export const auCentieme = (x: number) => arrondi(x, 2);
export const aLUnite = (x: number) => arrondi(x, 0);
/** Le plan de la production se fait en centaines d'enceintes. */
export const aLaCentaine = (x: number) => arrondi(x / 100, 0) * 100;
const somme = (xs: readonly number[]) => xs.reduce((t, x) => t + x, 0);

// ─────────────────────────────────────────────────────────────────────────────
// LA SÉRIE
// ─────────────────────────────────────────────────────────────────────────────

/** Un trimestre de la série du marché : son année, son numéro dans l'année, son rang, ses ventes. */
export interface TrimestreDuMarche {
  annee: AnneeDeLaSerie;
  trimestre: 1 | 2 | 3 | 4;
  rang: number;
  marche: number;
}

/** Le marché de N : le premier semestre, mois par mois dans nova-gestion.ts ; le second, ici. */
export function marcheDeN(): readonly number[] {
  const m = MARCHE_DES_ENCEINTES;
  return [somme(m.slice(0, 3)), somme(m.slice(3, 6)), ...MARCHE_DU_SECOND_SEMESTRE_DE_N];
}

/** Les douze trimestres du marché, de N − 2 à N. */
export function serieDuMarche(): TrimestreDuMarche[] {
  const parAnnee: Record<AnneeDeLaSerie, readonly number[]> = { ...MARCHE_AVANT_N, N: marcheDeN() };
  return ANNEES_DE_LA_SERIE.flatMap((annee, i) => parAnnee[annee].map((marche, q) => ({ annee, trimestre: (q + 1) as 1 | 2 | 3 | 4, rang: 4 * i + q + 1, marche })));
}

/** Les ventes d'une année de la série, et ce qu'elles ont gagné sur l'année d'avant (en enceintes et en %). */
export function totauxAnnuels() {
  const s = serieDuMarche();
  const totaux = ANNEES_DE_LA_SERIE.map((annee) => somme(s.filter((x) => x.annee === annee).map((x) => x.marche)));
  return {
    totaux,
    hausses: totaux.slice(1).map((t, i) => t - totaux[i]!),
    taux: totaux.slice(1).map((t, i) => auCentieme((t / totaux[i]! - 1) * 100)),
  };
}

/** NOVA en N : ses ventes de chaque trimestre (nova-capacite.ts), sa part de chaque trimestre et de l'année. */
export function novaEnN() {
  const ventes = ANNEE_N.demande;
  const marche = marcheDeN();
  return {
    ventes,
    marche,
    parts: ventes.map((v, i) => auCentieme((v / marche[i]!) * 100)),
    total: somme(ventes),
    marcheTotal: somme(marche),
    part: auCentieme((somme(ventes) / somme(marche)) * 100),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// LES AJUSTEMENTS
// ─────────────────────────────────────────────────────────────────────────────

/** Le coefficient de corrélation linéaire entre deux séries. */
export function correlation(xs: readonly number[], ys: readonly number[]) {
  const mx = somme(xs) / xs.length;
  const my = somme(ys) / ys.length;
  const sxy = somme(xs.map((x, i) => (x - mx) * (ys[i]! - my)));
  const sxx = somme(xs.map((x) => (x - mx) ** 2));
  const syy = somme(ys.map((y) => (y - my) ** 2));
  return sxy / Math.sqrt(sxx * syy);
}

/**
 * L'AJUSTEMENT LINÉAIRE par les moindres carrés : y = a t + b, a = Σ (t − t̄)(y − ȳ) ÷ Σ (t − t̄)²,
 * b = ȳ − a t̄. La droite passe par le point moyen. Le marché gagne a enceintes par trimestre.
 */
export function ajustementLineaire() {
  const s = serieDuMarche();
  const points = s.map((x) => ({ x: x.rang, y: x.marche }));
  const d = moindresCarres(points);
  const sxy = somme(points.map((p) => (p.x - d.xMoyen) * (p.y - d.yMoyen)));
  const sxx = somme(points.map((p) => (p.x - d.xMoyen) ** 2));
  return {
    n: d.n,
    tMoyen: d.xMoyen,
    yMoyen: d.yMoyen,
    sxy,
    sxx,
    a: d.a,
    b: d.b,
    r: correlation(points.map((p) => p.x), points.map((p) => p.y)),
    en: (t: number) => d.a * t + d.b,
  };
}

/**
 * L'AJUSTEMENT EXPONENTIEL : y = B × A^t, par les moindres carrés sur ln y = ln B + t ln A. Le
 * marché gagne (A − 1) × 100 % par trimestre : une croissance en pourcentage constant, quand la
 * droite croît en quantité constante.
 */
export function ajustementExponentiel() {
  const s = serieDuMarche();
  const points = s.map((x) => ({ x: x.rang, y: Math.log(x.marche) }));
  const d = moindresCarres(points);
  const A = Math.exp(d.a);
  const B = Math.exp(d.b);
  return { lnA: d.a, lnB: d.b, A, B, r: correlation(points.map((p) => p.x), points.map((p) => p.y)), en: (t: number) => B * A ** t };
}

/** La tendance d'un rang, selon l'ajustement. */
export const tendance = (ajustement: AjustementDeTendance) => (ajustement === "lineaire" ? ajustementLineaire().en : ajustementExponentiel().en);

/** Les moyennes mobiles centrées sur 4 trimestres du marché (les 2 premiers et les 2 derniers rangs n'en ont pas). */
export const moyennesMobilesDuMarche = () => moyennesMobilesCentrees(serieDuMarche().map((x) => x.marche));

// ─────────────────────────────────────────────────────────────────────────────
// LA SAISON ET LA PRÉVISION
// ─────────────────────────────────────────────────────────────────────────────

/**
 * LA MÉTHODE DES RAPPORTS À LA TENDANCE : chaque trimestre ÷ sa tendance (au millième) ; le
 * coefficient d'un trimestre de l'année, la moyenne de ses trois rapports (au millième) ; corrigé si
 * les quatre ne font pas 4.
 */
export function coefficientsSaisonniers(ajustement: AjustementDeTendance = "lineaire") {
  const en = tendance(ajustement);
  const serie = serieDuMarche().map((x) => {
    const t = en(x.rang);
    return { ...x, tendance: t, rapport: auMillieme(x.marche / t) };
  });
  const bruts = ([1, 2, 3, 4] as const).map((q) => auMillieme(somme(serie.filter((x) => x.trimestre === q).map((x) => x.rapport)) / 3));
  const sommeBrute = auMillieme(somme(bruts));
  const corriges = Math.abs(sommeBrute - 4) < 1e-9 ? bruts : bruts.map((c) => auMillieme((c * 4) / sommeBrute));
  return { ajustement, serie, bruts, sommeBrute, corrige: Math.abs(sommeBrute - 4) >= 1e-9, coefficients: corriges };
}

/** Les leviers de la prévision : l'ajustement de la tendance, la part de marché de NOVA en N + 1 (en %). */
export interface LeviersDeLaPrevision {
  ajustement: AjustementDeTendance;
  part: number;
}

export const leviersDeLaFiche = (): LeviersDeLaPrevision => ({ ajustement: "lineaire", part: novaEnN().part });

/**
 * LA PRÉVISION DE N + 1, trimestre par trimestre : la tendance du rang, le coefficient, le marché
 * prévu, les ventes de NOVA prévues (à sa part), le plan à la centaine, et ce que la ligne ne pourra
 * pas monter (au-delà de sa capacité du trimestre).
 */
export function previsionDeNPlus1(leviers: Partial<LeviersDeLaPrevision> = {}) {
  const l = { ...leviersDeLaFiche(), ...leviers };
  const en = tendance(l.ajustement);
  const k = coefficientsSaisonniers(l.ajustement);
  const trimestres = ([1, 2, 3, 4] as const).map((q) => {
    const rang = 12 + q;
    const t = en(rang);
    const coefficient = k.coefficients[q - 1]!;
    const marche = aLUnite(t * coefficient);
    const nova = aLUnite((marche * l.part) / 100);
    return { trimestre: q, rang, tendance: t, coefficient, marche, nova, plan: aLaCentaine(nova), auDelaDeLaLigne: Math.max(0, nova - CAPACITE_DU_TRIMESTRE) };
  });
  return {
    leviers: l,
    coefficients: k,
    trimestres,
    marche: somme(trimestres.map((x) => x.marche)),
    nova: somme(trimestres.map((x) => x.nova)),
    plan: somme(trimestres.map((x) => x.plan)),
    capacite: CAPACITE_DU_TRIMESTRE,
    auDelaDeLaLigne: somme(trimestres.map((x) => x.auDelaDeLaLigne)),
  };
}

/** La demande de N + 1 que lisent les chapitres de la capacité : celle que la prévision arrondit. */
export const DEMANDE_DE_N_PLUS_1_DU_PLAN = ANNEE_N_PLUS_1.demande;
