/**
 * LE MONDE DU COURS : LA LOI NORMALE (la DCG UE 11, programme 2025 : « les propriétés des variables
 * aléatoires sont limitées à la loi normale », pour le seuil de profitabilité probabilisé et pour le
 * contrôle de la qualité).
 *
 * Des fonctions pures, sans dépendance : la densité, la fonction de répartition Π(t) = P(T ≤ t) de la
 * loi normale centrée réduite, sa réciproque, et ce que l'élève fait à l'examen, lire la table à
 * deux décimales de t. Les chapitres « Le seuil de profitabilité en avenir aléatoire » et « Piloter la
 * qualité » s'en servent ; tests/cours/loi-normale.test.ts les confronte à la table du cours.
 *
 * LA RÉPARTITION se calcule par la série de Marsaglia (2004) : Π(t) = 1/2 + φ(t) × (t + t³/3 + t⁵/(3 × 5)
 * + …), dont tous les termes sont de même signe, pour |t| < 3 ; au-delà, la queue se calcule par la
 * fraction continue de Laplace. Les deux donnent Π au millionième de millionième.
 */

/** La densité de la loi normale centrée réduite. */
export const densiteNormale = (t: number) => Math.exp(-(t * t) / 2) / Math.sqrt(2 * Math.PI);

/** Au-delà de |t| = 3, la queue de la loi se calcule à part : la série perdrait sa précision relative. */
const QUEUE = 3;

/**
 * La queue 1 − Π(t), pour t ≥ 3, par la fraction continue de Laplace : φ(t) ÷ (t + 1/(t + 2/(t + 3/(t + …)))),
 * évaluée de la fin vers le début. Sa précision relative est celle d'un nombre, même au fond de la queue.
 */
function queueNormale(t: number): number {
  let f = t;
  for (let k = 120; k >= 1; k--) f = t + k / f;
  return densiteNormale(t) / f;
}

/** Π(t) = P(T ≤ t), T suivant la loi normale centrée réduite N(0 ; 1). */
export function repartitionNormale(t: number): number {
  if (Number.isNaN(t)) return Number.NaN;
  if (t < -38) return 0;
  if (t > 38) return 1;
  if (Math.abs(t) >= QUEUE) {
    const q = queueNormale(Math.abs(t));
    return t < 0 ? q : 1 - q;
  }
  let terme = t;
  let somme = t;
  for (let k = 1; k < 200; k++) {
    terme *= (t * t) / (2 * k + 1);
    somme += terme;
    if (Math.abs(terme) < 1e-17 * Math.abs(somme)) break;
  }
  return Math.min(1, Math.max(0, 0.5 + densiteNormale(t) * somme));
}

/** P(X ≤ x), X suivant la loi normale N(m ; σ) : la variable centrée réduite (x − m) ÷ σ. */
export function probabiliteSous(x: number, moyenne: number, ecartType: number): number {
  if (!(ecartType > 0)) throw new Error("L'écart-type d'une loi normale est positif");
  return repartitionNormale((x - moyenne) / ecartType);
}

/** P(a ≤ X ≤ b), X suivant la loi normale N(m ; σ). */
export const probabiliteEntre = (a: number, b: number, moyenne: number, ecartType: number) => probabiliteSous(b, moyenne, ecartType) - probabiliteSous(a, moyenne, ecartType);

/**
 * La réciproque de Π : le t tel que Π(t) = p, pour 0 < p < 1. Par dichotomie sur Π, croissante : pas
 * de formule approchée à justifier, et la précision de Π elle-même.
 */
export function quantileNormal(p: number): number {
  if (!(p > 0 && p < 1)) throw new Error("Une probabilité strictement comprise entre 0 et 1");
  let bas = -8;
  let haut = 8;
  for (let i = 0; i < 100; i++) {
    const milieu = (bas + haut) / 2;
    if (repartitionNormale(milieu) < p) bas = milieu;
    else haut = milieu;
  }
  return (bas + haut) / 2;
}

/** Le coefficient t d'un intervalle centré qui contient la variable avec la probabilité `confiance` : Π(t) = (1 + confiance) ÷ 2. */
export const coefficientDeConfiance = (confiance: number) => quantileNormal((1 + confiance) / 2);

/** Arrondi à `d` décimales, sans le zéro négatif. */
export const arrondi = (x: number, d: number) => Math.round(x * 10 ** d) / 10 ** d + 0;

/** Ce que donne la table du cours pour t ≥ 0 : Π(t) à quatre décimales. */
const valeurDeLaTable = (t: number) => arrondi(repartitionNormale(t), 4);

/**
 * LA LECTURE DE LA TABLE, comme à l'examen : t arrondi à deux décimales, Π lu à quatre décimales, et
 * pour t négatif le complément à l'unité, Π(−t) = 1 − Π(t). C'est la probabilité que l'élève écrit.
 */
export function lectureDeLaTable(t: number): number {
  const lu = arrondi(t, 2);
  return lu >= 0 ? valeurDeLaTable(lu) : arrondi(1 - valeurDeLaTable(-lu), 4);
}

/**
 * LES COEFFICIENTS DE LA TABLE, tels que le cours les retient : 1,28 pour 90 % d'un côté, 1,645 pour
 * 95 % d'un côté (ou 90 % en tout), 1,96 pour 95 % en tout, 2,575 pour 99 % en tout. Ce sont les
 * réciproques de Π arrondies à la lecture de la table (tests/cours/loi-normale.test.ts).
 */
export const T_DE_LA_TABLE = { unCoteA90: 1.28, unCoteA95: 1.645, centreA95: 1.96, centreA99: 2.575 } as const;
