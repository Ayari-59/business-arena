/**
 * L'INTITULÉ D'UNE COLONNE DE TABLEAU DU COURS (observation du propriétaire, novembre 2026 : « redimensionner
 * les tableaux pour ne pas être obligé de scroller en largeur ; l'intitulé d'une colonne peut être raccourci
 * ou bien sur plusieurs lignes »).
 *
 * L'intitulé passe à la ligne au lieu d'imposer sa largeur à la colonne. Sur téléphone, il prend sa forme
 * courte quand il en a une (« janv. » pour « janvier », « CA » pour « chiffre d'affaires ») ; un lecteur
 * d'écran lit toujours l'intitulé entier. Garde : tests/e2e/cours.e2e.ts (aucun tableau ne défile en largeur
 * à 390 px) et tests/unit/en-tete-de-colonne.test.ts.
 */

/** Les formes courtes, mot par mot : les mois, et les intitulés longs qui reviennent dans les tableaux. */
const FORMES_COURTES: readonly [RegExp, string][] = [
  [/\bjanvier\b/gi, "janv."],
  [/\bfévrier\b/gi, "févr."],
  [/\bseptembre\b/gi, "sept."],
  [/\boctobre\b/gi, "oct."],
  [/\bnovembre\b/gi, "nov."],
  [/\bdécembre\b/gi, "déc."],
  [/\bjuillet\b/gi, "juil."],
  [/\bavril\b/gi, "avr."],
  [/\bchiffre d'affaires\b/gi, "CA"],
  [/\bquantités?\b/gi, "qté"],
  [/\bprévisionnel(le)?s?\b/gi, "prév."],
  [/\btrimestre\b/gi, "trim."],
  [/\bsemestre\b/gi, "sem."],
];

/** La forme courte d'un intitulé, ou l'intitulé lui-même quand rien ne l'abrège. */
export function intituleCourt(intitule: string): string {
  return FORMES_COURTES.reduce((t, [motif, court]) => t.replace(motif, court), intitule);
}

/**
 * À partir de ce nombre de colonnes de chiffres, un tableau s'empile sur téléphone : chaque ligne devient un
 * bloc où chaque valeur porte le nom de sa colonne (globals.css, `.tableau-empilable`). Mesuré à 390 px :
 * trois colonnes tiennent, une répartition sur cinq centres ou un semestre de six mois, non.
 */
export const COLONNES_POUR_EMPILER = 4;

/**
 * Un tableau à compléter s'empile plus tôt : une case à remplir est plus large qu'un chiffre écrit. Mesuré
 * à 390 px, trois colonnes de cases dépassent encore (de 10 px pour deux livraisons et leur total).
 */
export const COLONNES_POUR_EMPILER_A_COMPLETER = 3;

/** La classe d'un tableau de `n` colonnes : empilé sur téléphone s'il est trop large. */
export const classeDEmpilement = (n: number, aCompleter = false) =>
  n >= (aCompleter ? COLONNES_POUR_EMPILER_A_COMPLETER : COLONNES_POUR_EMPILER) ? "tableau-empilable" : "";

/** Les classes d'un intitulé de colonne : il passe à la ligne, les capitales espacées seulement sur grand écran. */
export const CLASSES_D_EN_TETE = "px-1.5 py-1.5 text-right align-bottom text-xs font-semibold leading-tight text-slate-400 text-balance hyphens-auto sm:px-2 sm:uppercase sm:tracking-etiquette";

/** L'intitulé : entier pour un lecteur d'écran et sur grand écran, court sur téléphone s'il en a une forme courte. */
export function IntituleDeColonne({ intitule }: { intitule: string }) {
  const court = intituleCourt(intitule);
  if (court === intitule) return <>{intitule}</>;
  return (
    <>
      <span aria-hidden="true" className="sm:hidden">
        {court}
      </span>
      <span className="max-sm:sr-only">{intitule}</span>
    </>
  );
}
