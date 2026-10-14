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

/**
 * LE RANG D'ÉQUIPE REÇU PAR L'ADRESSE. Même principe que le code : ce qui
 * n'est pas exactement un rang n'en devient pas un. Un paramètre absent,
 * négatif, décimal, énorme ou écrit en lettres ne provoque pas d'erreur — il
 * disparaît, et l'élève est affecté automatiquement comme avant le QR.
 *
 * Le plafond n'est pas une règle métier : le service, lui, vérifie que le rang
 * désigne une équipe réelle de CETTE partie. Il évite seulement de promener un
 * entier absurde jusqu'à la base.
 */
export const RANG_EQUIPE_MAX = 99;

export function normaliserRangDEquipe(brut: string | undefined | null): number | null {
  if (!brut || !/^\d{1,2}$/.test(brut.trim())) return null;
  const rang = Number(brut.trim());
  return rang >= 1 && rang <= RANG_EQUIPE_MAX ? rang : null;
}
