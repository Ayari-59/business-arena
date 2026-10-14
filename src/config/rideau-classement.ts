/**
 * Qui a le droit de voir le classement, et quand.
 *
 * En classe et en concours, c'est l'ANIMATEUR qui révèle. Sans cela, la classe
 * lisait le classement sur son téléphone à la seconde où l'enseignant clôturait
 * le tour, et le moment qu'il préparait n'existait pas.
 *
 * En solo, personne n'est là pour ouvrir : le classement face aux bots est la
 * boucle de retour du jeu, il reste immédiat.
 *
 * Cette règle vit ici, seule, parce qu'elle s'applique à DEUX endroits qui
 * n'ont rien à voir — la vue de partie et la page « mon profil ». Un rideau
 * qu'on oublie de tirer quelque part n'est pas un rideau : il suffisait
 * d'ouvrir son profil pour lire son rang.
 */

/** Ce qui décide : le genre de la partie, et l'état du dernier tour clos. */
export function classementOuvert(args: {
  /** « solo » : pas d'animateur, donc rien à révéler. */
  kind: string | null | undefined;
  /** Quand l'animateur a révélé le classement du dernier tour clos. */
  revelationDuDernierTourClos: Date | string | null | undefined;
}): boolean {
  if ((args.kind ?? "solo") === "solo") return true;
  return args.revelationDuDernierTourClos != null;
}
