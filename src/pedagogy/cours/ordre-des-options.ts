/**
 * L'ORDRE OÙ LES OPTIONS D'UNE QUESTION S'AFFICHENT.
 *
 * Les options s'écrivent dans les chapitres dans l'ordre où l'auteur les pense :
 * la bonne d'abord, puis les erreurs. Elles s'affichaient dans cet ordre, si
 * bien que la bonne réponse était la première dans 454 questions sur 643 : un
 * élève qui cliquait toujours en haut réussissait sans lire. Le défaut est le
 * même que celui des épisodes, où la bonne option était la plus longue.
 *
 * L'ordre affiché se tire donc au sort, mais un sort STABLE : la même question,
 * dans la même entreprise, s'affiche toujours dans le même ordre. Le serveur et
 * le navigateur rendent la même page, l'élève qui revient retrouve ce qu'il a
 * vu, et la projection en classe montre l'ordre de l'enseignant. La clé est
 * celle de la question (chapitre, étape, entreprise) ; les textes des options y
 * entrent aussi, pour qu'une option réécrite redistribue sa question.
 */

/** Un hachage court et stable d'un texte (FNV-1a sur 32 bits). */
function hachage(texte: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < texte.length; i++) {
    h ^= texte.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** Un tirage pseudo aléatoire, reproductible pour une même graine (mulberry32). */
function tirage(graine: number): () => number {
  let a = graine >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** La clé d'une question : le chapitre, l'étape et l'entreprise du cas. */
export const cleDeLaQuestion = (chapitre: string, etape: string, entreprise: string) =>
  `${chapitre}/${etape}/${entreprise}`;

/**
 * Les options dans l'ordre où la page les affiche : un mélange de Fisher et
 * Yates, tiré de la clé de la question et des textes des options.
 */
export function dansLOrdreAffiche<T extends { texte: string }>(options: readonly T[], cle: string): T[] {
  const melange = [...options];
  const hasard = tirage(hachage(`${cle}|${options.map((o) => o.texte).join("|")}`));
  for (let i = melange.length - 1; i > 0; i--) {
    const j = Math.floor(hasard() * (i + 1));
    [melange[i], melange[j]] = [melange[j]!, melange[i]!];
  }
  return melange;
}
