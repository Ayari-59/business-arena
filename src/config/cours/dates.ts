/**
 * Les dates du cours : un mois de janvier qui déborde sur les échéances suivantes.
 * Un jour se compte depuis le 1er janvier (1 = 1er janvier, 32 = 1er février).
 */
const MOIS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
const DEBUT_DU_MOIS = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
const JOURS_DE_L_ANNEE = 365;

/** Le mois (0 = janvier) et le jour du mois du jour `n` de l'année. */
export function moisEtJour(n: number): { mois: number; jour: number } {
  let m = DEBUT_DU_MOIS.length - 1;
  while (m > 0 && n <= DEBUT_DU_MOIS[m]!) m -= 1;
  return { mois: m, jour: n - DEBUT_DU_MOIS[m]! };
}

/**
 * Le jour `n` de l'année (1 = 1er janvier), en toutes lettres : « 9 février ». Au-delà du
 * 31 décembre, le jour tombe l'année suivante, et la date le dit.
 */
export function dateDuCours(n: number): string {
  if (n > JOURS_DE_L_ANNEE) return `${dateDuCours(n - JOURS_DE_L_ANNEE)} de l'année suivante`;
  const { mois, jour } = moisEtJour(n);
  return `${jour === 1 ? "1er" : jour} ${MOIS[mois]}`;
}
