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
