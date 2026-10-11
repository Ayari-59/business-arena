/**
 * LA RÈGLE D'INCERTITUDE : QUAND LA PRESSE SE TROMPE.
 *
 * Aux niveaux 1 et 2, la Gazette est fiable : ce qu'elle annonce arrive, et
 * elle l'écrit comme un fait. Plus haut, ce qui n'est pas encore arrivé
 * s'écrit au conditionnel des analystes, et une PART de ces prévisions est
 * démentie : le journal annonce un mouvement qui ne vient pas. C'est la
 * leçon : une prévision se lit avec sa marge d'erreur.
 *
 * La règle, écrite une fois et gardée par les tests :
 *
 *   1. jamais aux niveaux 1 et 2, jamais au premier tour ;
 *   2. un tour « ouvert au démenti » est tiré de la graine de la partie, avec
 *      une probabilité qui monte avec le niveau (`PART_DES_DEMENTIS`) ;
 *   3. JAMAIS DEUX TOURS DE SUITE : un tour qui suit un tour ouvert au démenti
 *      ne l'est pas, quoi que dise le tirage ;
 *   4. le démenti porte sur un sujet où RIEN ne se passe vraiment ce tour-là
 *      (ni dans un sens ni dans l'autre) : il ne contredit jamais un fait ;
 *   5. il est TOUJOURS PLAUSIBLE APRÈS COUP : il reprend un événement que le
 *      marché de la partie peut réellement produire à ce moment (probabilité
 *      non nulle, tour minimal atteint), qui simplement n'est pas tombé ;
 *   6. une prévision de demande démentie ne va jamais contre la saison.
 *
 * Le tirage est pur : même graine, même niveau, même tour, même réponse. La
 * clôture et l'aperçu de l'enseignant voient donc le même article.
 */

/** La part des tours ouverts au démenti, par niveau. */
export const PART_DES_DEMENTIS: Readonly<Record<number, number>> = {
  1: 0,
  2: 0,
  3: 0.2,
  4: 0.3,
  5: 0.35,
  6: 0.4,
};

/** Un hachage entier, stable et sans dépendance : (graine, tour, sel) → [0, 1). */
export function alea(graine: number, tour: number, sel: number): number {
  let h = (Math.imul(graine | 0, 2654435761) ^ Math.imul(tour + 1, 40503) ^ Math.imul(sel + 7, 69069)) >>> 0;
  h = Math.imul(h ^ (h >>> 16), 0x85ebca6b) >>> 0;
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35) >>> 0;
  h = (h ^ (h >>> 16)) >>> 0;
  return h / 4294967296;
}

const SEL_DU_DEMENTI = 0xd3;

/**
 * Le tour est-il ouvert au démenti ? Récursif sur le tour précédent : c'est ce
 * qui tient la règle « jamais deux tours de suite » sans rien stocker.
 */
export function tourOuvertAuDementi(graine: number, niveau: number, tour: number): boolean {
  const part = PART_DES_DEMENTIS[niveau] ?? 0;
  if (part <= 0 || tour < 2) return false;
  if (tour > 2 && tourOuvertAuDementi(graine, niveau, tour - 1)) return false;
  return alea(graine, tour, SEL_DU_DEMENTI) < part;
}

/** Les prévisions s'écrivent-elles au conditionnel à ce niveau ? */
export const ecritDesPrevisions = (niveau: number): boolean => niveau >= 3;
