/**
 * AMENER UNE ÉTAPE SOUS LES YEUX, SOUS CE QUI COLLE EN HAUT DE L'ÉCRAN.
 *
 * Chaque étape du tour remontait en haut de la PAGE (`window.scrollTo(0)`) :
 * sur téléphone, on revoyait la barre de la partie, l'ardoise et les bandeaux
 * avant le champ qu'on venait de rejoindre, et il restait environ 200 px pour
 * le remplir. L'étape remonte désormais à SON début, qui s'arrête sous la
 * barre et l'ardoise repliée (`scroll-margin-top`, voir `[data-debut-d-etape]`
 * dans globals.css) : l'ardoise sort de l'écran et se replie en une ligne.
 *
 * `seulementSiDepasse` : ne bouge que si le début de l'étape est passé au-dessus
 * du haut de l'écran (une étape déjà en vue ne saute pas).
 */
export function allerAuDebutDEtape(
  el: Element | null | undefined,
  { seulementSiDepasse = false }: { seulementSiDepasse?: boolean } = {},
): void {
  if (!el) {
    window.scrollTo({ top: 0 });
    return;
  }
  if (seulementSiDepasse && el.getBoundingClientRect().top >= 0) return;
  el.scrollIntoView({ block: "start" });
}
