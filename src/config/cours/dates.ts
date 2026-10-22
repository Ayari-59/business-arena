/**
 * Les dates du cours : un mois de janvier qui déborde sur les échéances suivantes.
 * Un jour se compte depuis le 1er janvier (1 = 1er janvier, 32 = 1er février).
 */
const MOIS = ["janvier", "février", "mars", "avril", "mai", "juin"];
const DEBUT_DU_MOIS = [0, 31, 59, 90, 120, 151];

/** Le jour `n` de l'année (1 = 1er janvier), en toutes lettres : « 9 février ». */
export function dateDuCours(n: number): string {
  let m = DEBUT_DU_MOIS.length - 1;
  while (m > 0 && n <= DEBUT_DU_MOIS[m]!) m -= 1;
  const jour = n - DEBUT_DU_MOIS[m]!;
  return `${jour === 1 ? "1er" : jour} ${MOIS[m]}`;
}
