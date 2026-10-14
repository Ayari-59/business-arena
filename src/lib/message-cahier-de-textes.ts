/**
 * LE MESSAGE À COLLER DANS PRONOTE OU ÉCOLE DIRECTE.
 *
 * Composé côté serveur (la page du pilotage, la page de la cohorte), puis remis au
 * bouton qui le copie : un module simple, sans « use client », pour que le serveur
 * puisse l'appeler.
 */

/** Le message d'une partie de classe, tel qu'il se colle dans un cahier de textes. */
export function messageDeLaPartie(titre: string, lien: string, code: string): string {
  return [
    `Business Arena : partie « ${titre} »`,
    `Rejoindre la partie : ${lien}`,
    `Ou sur la page d'accueil du site, « Rejoindre une partie », avec le code ${code}.`,
    "Pas de compte à créer : choisissez un prénom ou un pseudo.",
  ].join("\n");
}

/** Le message d'une cohorte d'épisodes. */
export function messageDeLaCohorte(nom: string, lien: string, code: string): string {
  return [
    `Business Arena : cohorte « ${nom} »`,
    `Rejoindre la cohorte : ${lien}`,
    `Ou tapez le code ${code} sur la page d'invitation.`,
    "Pas de compte à créer : choisissez un pseudo, puis notez votre code de reprise.",
  ].join("\n");
}
