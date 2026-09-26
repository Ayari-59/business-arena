/**
 * LE CODE D'INVITATION QUAND IL ARRIVE PAR L'URL.
 *
 * Tant que le code était tapé à la main, il n'existait qu'une fois lu par le
 * serveur, qui le met en majuscules et le compare en base : un code faux
 * donnait « Code de partie inconnu », et l'affaire était close.
 *
 * Le QR change cela. Le code voyage maintenant dans `/join?code=…`, et
 * n'importe qui peut écrire n'importe quoi dans cette adresse. Ce qui en sort
 * est pré-rempli dans un champ, donc affiché : il est filtré ici avant de
 * l'être.
 *
 * TOUT OU RIEN, et c'est le point. Une première version nettoyait le
 * paramètre — majuscules, caractères étrangers retirés, six premiers gardés —
 * et `<script>alert(1)</script>` en ressortait « SCRIPT » : un code d'allure
 * parfaite, que l'élève aurait envoyé avant de lire « Code de partie inconnu »
 * sans comprendre d'où il venait. On n'accepte donc que la forme exacte de ce
 * que produit `makeJoinCode` — six lettres capitales ou chiffres, rien autour,
 * la casse et les espaces de bord pardonnés. Tout le reste ne devient pas une
 * erreur : il devient un champ vide, que l'élève remplit comme avant.
 */

/** La longueur d'un code d'invitation, telle que la création le fabrique. */
export const LONGUEUR_CODE = 6;

export function normaliserCodeDePartie(brut: string | undefined | null): string | null {
  if (!brut) return null;
  const candidat = brut.trim().toUpperCase();
  return new RegExp(`^[A-Z0-9]{${LONGUEUR_CODE}}$`).test(candidat) ? candidat : null;
}
