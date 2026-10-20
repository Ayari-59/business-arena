/**
 * L'AIDE DU BUDGET QUALITÉ : CE QUE LA QUALITÉ RAPPORTE, ET À QUELLE CONDITION.
 *
 * Elle disait « Prévention : moins de rebuts et de retours, une qualité perçue
 * qui monte ». Vrai, et trompeur. Mesuré sur les quinze secteurs au niveau 2,
 * sur douze tours, face aux concurrents pilotés : au prix que le formulaire
 * propose, le budget qualité qu'il propose fait MOINS bien que zéro qualité,
 * dans tous les secteurs. La qualité perçue multiplie l'attraction de l'offre
 * à proportion de ce que chaque clientèle y tient ; elle suit la qualité
 * produite avec retard, à rendements décroissants. Elle se paie donc en
 * vendant plus cher sans perdre ces clients, et seulement là où ils y
 * tiennent : au conseil, elle ne paie à aucun prix.
 *
 * La valeur pré-remplie suit cette mesure : là où le budget de la gestion
 * neutre ne fait pas mieux que zéro au prix proposé, le formulaire propose
 * zéro (`qualiteProposee`, engine/types.ts, décision du propriétaire). La
 * gestion neutre, étalon de l'examen, du mérite et des témoins, garde le sien.
 *
 * Elle tient en trois lignes sur un téléphone : la carte des budgets doit
 * tenir sur un écran (`tests/e2e/mobile.e2e.ts`), et la version longue la
 * faisait déborder.
 *
 * Chaque affirmation de cette aide est tenue par un test qui la mesure dans
 * le moteur (`tests/engine/qualite-et-prix.test.ts`) : si un recalibrage la
 * rend fausse, c'est cette phrase qu'il faut réécrire.
 */
export const AIDE_DU_BUDGET_QUALITE =
  "Moins de rebuts et de retours, une qualité perçue qui monte lentement chez les clients " +
  "qui y tiennent. À prix inchangé, elle couvre rarement sa dépense : elle paie en vendant " +
  "plus cher.";
