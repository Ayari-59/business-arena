import { VENTES_AUX_PARTICULIERS } from "./exercice-de-nova";
import { ajustementExponentiel, ajustementLineaire, aLUnite, coefficientsSaisonniers, correlation, serieDuMarche } from "./prevision-des-ventes";

/**
 * LE MONDE DU COURS : PRÉVOIR LES VENTES, CORRÉLATION ET LISSAGE (le chapitre « Prévoir les ventes :
 * corrélation et lissage » et son cas, DCG UE11 § 3.2).
 *
 * Ce que le DCG ajoute au chapitre « Prévoir les ventes : tendance et saisons », sur les mêmes séries,
 * sans en changer un chiffre :
 *   · LE COEFFICIENT DE CORRÉLATION LINÉAIRE, calculé et non plus seulement lu : sur la série brute
 *     du marché (prevision-des-ventes.ts, `ajustementLineaire`, r = 0,774), puis sur la série corrigée
 *     des variations saisonnières (CVS : chaque trimestre ÷ son coefficient saisonnier, ceux de la
 *     droite, 0,894, 1,108, 0,901, 1,097), où la saison ne brouille plus la tendance ;
 *   · L'AJUSTEMENT PUISSANCE, y = b × t^a, par les moindres carrés sur ln y = a ln t + ln b ; face à
 *     la droite et à l'exponentielle, il suppose une croissance qui ralentit (a < 1) ;
 *   · LE LISSAGE EXPONENTIEL SIMPLE, sur les ventes en ligne de NOVA aux particuliers, mois par mois
 *     en N (exercice-de-nova.ts, VENTES_AUX_PARTICULIERS) : la prévision du mois suivant est
 *     α × les ventes du mois + (1 − α) × la prévision du mois. La première prévision (février) est
 *     la vente de janvier.
 *
 * AUCUN CHIFFRE NOUVEAU dans le chapitre : seul le cas ajoute une vente, celle de janvier N + 1
 * (JANVIER_N_PLUS_1_AUX_PARTICULIERS).
 *
 * LES ARRONDIS : la série CVS s'arrondit à l'enceinte ; les coefficients de corrélation se lisent
 * au millième ; les prévisions du lissage ne s'arrondissent pas en chemin (l'affichage arrondit au
 * centième).
 */

const somme = (xs: readonly number[]) => xs.reduce((t, x) => t + x, 0);

/** Les sommes d'un ajustement des moindres carrés, et ce qu'on en tire : a, b, r. */
export function moindresCarresDe(xs: readonly number[], ys: readonly number[]) {
  const n = xs.length;
  const xMoyen = somme(xs) / n;
  const yMoyen = somme(ys) / n;
  const sxy = somme(xs.map((x, i) => (x - xMoyen) * (ys[i]! - yMoyen)));
  const sxx = somme(xs.map((x) => (x - xMoyen) ** 2));
  const syy = somme(ys.map((y) => (y - yMoyen) ** 2));
  return { n, xMoyen, yMoyen, sxy, sxx, syy, a: sxy / sxx, b: yMoyen - (sxy / sxx) * xMoyen, r: sxy / Math.sqrt(sxx * syy) };
}

// ─────────────────────────────────────────────────────────────────────────────
// LA CORRÉLATION
// ─────────────────────────────────────────────────────────────────────────────

/** Les rangs et le marché brut, de N − 2 à N. */
export const rangsEtMarche = () => {
  const s = serieDuMarche();
  return { rangs: s.map((x) => x.rang), marche: s.map((x) => x.marche) };
};

/** La corrélation du marché brut avec le temps : les sommes, r et r² (celles de la droite du chapitre précédent). */
export function correlationBrute() {
  const { rangs, marche } = rangsEtMarche();
  const m = moindresCarresDe(rangs, marche);
  return { ...m, r2: m.r ** 2, droite: ajustementLineaire() };
}

/** La série corrigée des variations saisonnières : chaque trimestre ÷ son coefficient (ceux de la droite), à l'enceinte. */
export function serieCVS() {
  const k = coefficientsSaisonniers("lineaire").coefficients;
  return serieDuMarche().map((x) => ({ ...x, coefficient: k[x.trimestre - 1]!, cvs: aLUnite(x.marche / k[x.trimestre - 1]!) }));
}

/** La corrélation de la série CVS avec le temps. */
export function correlationCVS() {
  const s = serieCVS();
  const m = moindresCarresDe(
    s.map((x) => x.rang),
    s.map((x) => x.cvs),
  );
  return { ...m, r2: m.r ** 2 };
}

// ─────────────────────────────────────────────────────────────────────────────
// LES TROIS AJUSTEMENTS
// ─────────────────────────────────────────────────────────────────────────────

export type SerieAjustee = "brute" | "cvs";

const valeursDe = (serie: SerieAjustee) => (serie === "brute" ? rangsEtMarche().marche : serieCVS().map((x) => x.cvs));

/**
 * L'AJUSTEMENT PUISSANCE : y = b × t^a. Posons X = ln t et Y = ln y : Y = a X + ln b, une droite des
 * moindres carrés sur les couples (ln t ; ln y). Puis b = e^(ln b).
 */
export function ajustementPuissance(serie: SerieAjustee = "brute") {
  const ys = valeursDe(serie);
  const X = ys.map((_, i) => Math.log(i + 1));
  const Y = ys.map((y) => Math.log(y));
  const m = moindresCarresDe(X, Y);
  const b = Math.exp(m.b);
  return { serie, X, Y, xMoyen: m.xMoyen, yMoyen: m.yMoyen, sxy: m.sxy, sxx: m.sxx, a: m.a, lnB: m.b, b, r: m.r, en: (t: number) => b * t ** m.a };
}

/** Les coefficients de corrélation des trois ajustements, sur une série : linéaire (y sur t), exponentiel (ln y sur t), puissance (ln y sur ln t). */
export function correlationsDesAjustements(serie: SerieAjustee) {
  const ys = valeursDe(serie);
  const t = ys.map((_, i) => i + 1);
  return {
    lineaire: correlation(t, ys),
    exponentiel: correlation(
      t,
      ys.map((y) => Math.log(y)),
    ),
    puissance: ajustementPuissance(serie).r,
  };
}

/** Les tendances des trois ajustements de la série brute, à un rang (celles du chapitre précédent pour la droite et l'exponentielle). */
export const tendancesAuRang = (rang: number) => ({ lineaire: ajustementLineaire().en(rang), exponentiel: ajustementExponentiel().en(rang), puissance: ajustementPuissance("brute").en(rang) });

// ─────────────────────────────────────────────────────────────────────────────
// LE LISSAGE EXPONENTIEL
// ─────────────────────────────────────────────────────────────────────────────

export const MOIS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"] as const;

/** Les ventes en ligne aux particuliers en N, mois par mois (exercice-de-nova.ts). */
export const VENTES_LISSEES: readonly number[] = VENTES_AUX_PARTICULIERS;

/** Les constantes de lissage du laboratoire : de 0,1 à 0,9, par dixième. */
export const ALPHAS = { min: 0.1, max: 0.9, pas: 0.1 } as const;

/** La constante du lissage à la main, une constante prudente. */
export const ALPHA_A_LA_MAIN = 0.3;

/** Un mois lissé : sa vente, la prévision qu'on en avait faite, l'erreur. */
export interface MoisLisse {
  mois: number;
  vente: number;
  prevision: number;
  erreur: number;
}

/**
 * LE LISSAGE EXPONENTIEL SIMPLE : P(février) = vente de janvier ; puis P(m + 1) = α × vente(m) +
 * (1 − α) × P(m). Les erreurs se mesurent de février à décembre ; la somme de leurs carrés juge α.
 */
export function lissage(alpha: number, ventes: readonly number[] = VENTES_LISSEES) {
  const mois: MoisLisse[] = [];
  let p = ventes[0]!;
  for (let m = 1; m < ventes.length; m++) {
    mois.push({ mois: m, vente: ventes[m]!, prevision: p, erreur: ventes[m]! - p });
    p = alpha * ventes[m]! + (1 - alpha) * p;
  }
  const carres = somme(mois.map((x) => x.erreur ** 2));
  return { alpha, mois, sommeDesCarres: carres, ecartMoyen: somme(mois.map((x) => Math.abs(x.erreur))) / mois.length, prochaine: p };
}

/** Les crans du laboratoire, arrondis au dixième. */
export const alphasDuLaboratoire = () => Array.from({ length: Math.round((ALPHAS.max - ALPHAS.min) / ALPHAS.pas) + 1 }, (_, i) => Math.round((ALPHAS.min + i * ALPHAS.pas) * 10) / 10);

/** La constante qui rend la somme des carrés des erreurs la plus petite, au dixième. */
export function meilleurAlpha() {
  return alphasDuLaboratoire().reduce((m, a) => (lissage(a).sommeDesCarres < lissage(m).sommeDesCarres ? a : m));
}

/**
 * LA VENTE DE JANVIER N + 1 (hypothèse du cas « Janvier est tombé ») : 1 400 enceintes vendues en
 * ligne aux particuliers, l'hiver après Noël.
 */
export const JANVIER_N_PLUS_1_AUX_PARTICULIERS = 1_400;

/** La prévision de février N + 1 : le lissage de N, au meilleur α, poursuivi d'un mois. */
export function previsionDeFevrier(alpha: number = meilleurAlpha(), janvier: number = JANVIER_N_PLUS_1_AUX_PARTICULIERS) {
  const l = lissage(alpha);
  const prevue = l.prochaine;
  return { alpha, janvierPrevu: prevue, janvier, erreur: janvier - prevue, fevrier: alpha * janvier + (1 - alpha) * prevue };
}
