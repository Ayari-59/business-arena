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

/**
 * LE REFUS DE /join QUAND LE CODE N'OUVRE RIEN (audit UX du 29 octobre 2026, P2-8). La page
 * accepte tous les codes d'élève (partie, classe du cours, cohorte, concours, examen) : « Code
 * de partie inconnu » laissait croire qu'un code de classe n'avait rien à y faire.
 */
export const CODE_INCONNU_PARTOUT =
  "Ce code ne correspond à aucune partie, classe, cohorte, concours ni examen. Vérifiez-le avec votre enseignant, caractère par caractère, sans espace.";

/**
 * LE PRÉNOM QUI SUIT LE CODE (audit UX, P1-3). Un code de classe tapé sur /join renvoie à
 * /cours/rejoindre : le prénom déjà saisi y est transmis, pour ne pas le redemander. Les
 * autres pages n'ont pas de champ de prénom à pré-remplir : l'adresse reste telle quelle.
 */
export function avecLePrenom(vers: string, prenom: string): string {
  const p = prenom.trim();
  if (!p || !vers.startsWith("/cours/rejoindre?")) return vers;
  return `${vers}&nom=${encodeURIComponent(p)}`;
}

/**
 * TROP D'ESSAIS DEPUIS CETTE ADRESSE (audit UX du 29 octobre 2026, P1-4) : la garde des codes
 * (lib/garde-des-codes.ts) ferme la porte à toute l'adresse, code juste compris. Le dire, avec
 * l'attente, au lieu de « ce code ne mène à aucune classe », faux et déroutant.
 */
export function refusTropDEssais(attente: string | undefined): string {
  const n = Math.max(1, Math.min(60, Number.parseInt(attente ?? "", 10) || 15));
  return `Trop de codes ont été essayés depuis ce réseau ces dernières minutes. Réessayez dans ${n} minute${n > 1 ? "s" : ""} ; d'ici là, même un code juste est refusé.`;
}
