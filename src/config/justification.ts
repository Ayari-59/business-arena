/**
 * LA NOTE D'AVANT : LA RÈGLE, EN UN SEUL ENDROIT.
 *
 * L'équipe écrit en quelques mots ce qu'elle attend de ses choix, avant de
 * connaître le résultat. Au tour suivant, la note lui revient à côté du
 * constat : c'est la confrontation entre ce qu'on avait prévu et ce qui est
 * arrivé qui apprend quelque chose, pas la note elle-même.
 *
 * Elle est EXIGÉE AU PREMIER TOUR seulement. Au premier tour, personne n'a
 * encore d'habitude à reconduire, et c'est le moment où le raisonnement est
 * le plus explicite. L'exiger à tous les tours en ferait une case à cocher,
 * expédiée en deux mots pour débloquer le bouton — et une formalité
 * n'enseigne rien.
 *
 * Le module est PUR et partagé : le formulaire s'en sert pour exiger le champ
 * avant l'envoi, l'action serveur pour refuser un envoi forgé ou périmé. Une
 * seule règle, donc l'écran n'autorise jamais ce que le serveur refuse.
 */

/**
 * En dessous, ce n'est pas une justification : « ok », « rien », « .. ».
 * Le seuil est volontairement bas — on demande une phrase, pas une
 * dissertation, et un élève qui écrit court n'est pas un élève qui triche.
 */
export const LONGUEUR_MINIMALE_JUSTIFICATION = 15;

/** Vrai si la note manque là où elle est exigée. */
export function justificationManquante(texte: string | null | undefined, roundIndex: number): boolean {
  if (roundIndex !== 1) return false;
  return (texte ?? "").trim().length < LONGUEUR_MINIMALE_JUSTIFICATION;
}

/** Ce que l'écran affiche quand la note manque. Dit quoi faire, pas ce qui est interdit. */
export const MESSAGE_JUSTIFICATION_MANQUANTE =
  "Au premier tour, dites en une phrase ce que vous attendez de ces choix : elle vous reviendra au tour suivant, en face du résultat.";
