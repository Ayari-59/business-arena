/**
 * QUI A VALIDÉ LE TOUR, ET QUAND.
 *
 * Une équipe, c'est trois ou quatre élèves, chacun sur son écran, et la table
 * `decisions` enregistrait déjà `validated_by` et `validated_at` à chaque
 * envoi — sans que ces deux colonnes soient relues nulle part. Personne ne
 * voyait donc que quelqu'un d'autre avait déjà validé : ni l'équipe, qui
 * écrasait la saisie d'un camarade sans le savoir, ni l'enseignant, qui lisait
 * « ✓ validées » sans savoir par qui.
 *
 * Le module est PUR et partagé : la même phrase dans l'arène et dans le
 * tableau de l'enseignant, pour que les deux côtés disent la même chose.
 */

const HEURE_FR = new Intl.DateTimeFormat("fr-FR", {
  timeZone: "Europe/Paris",
  hour: "2-digit",
  minute: "2-digit",
});

/**
 * « Validé par Léa à 14:32 ».
 *
 * Une heure absolue, pas un « il y a 4 minutes » : elle ne vieillit pas entre
 * le rendu serveur et l'affichage, elle ne demande aucun rafraîchissement, et
 * c'est l'heure que l'équipe se dit à voix haute autour de la table.
 */
export function mentionDeValidation(nom: string | null, quand: Date): string {
  const heure = HEURE_FR.format(quand);
  const propre = nom?.trim();
  return propre ? `Validé par ${propre} à ${heure}` : `Validé à ${heure}`;
}
