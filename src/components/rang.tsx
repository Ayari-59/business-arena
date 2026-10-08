/**
 * LE RANG D'UN CLASSEMENT, ET LE MÉTAL DU PODIUM.
 *
 * Le rang s'écrivait « #1 » en gris, la première équipe comme la dernière.
 * Les trois premières places prennent maintenant l'or, l'argent et le bronze
 * (jetons `--or-distinction`, `--argent`, `--bronze` de globals.css), toujours
 * avec le chiffre écrit dedans : la couleur n'est jamais la seule information.
 * L'or est une distinction, jamais une action : ces classes ne vont pas sur un
 * bouton ni sur un lien.
 */

const METAUX = ["or", "argent", "bronze"] as const;

/** Le métal d'une place, ou null au-delà du podium. */
export function metalDuRang(rang: number): (typeof METAUX)[number] | null {
  return Number.isInteger(rang) && rang >= 1 && rang <= 3 ? METAUX[rang - 1]! : null;
}

/** La place dite en toutes lettres, pour l'infobulle et le lecteur d'écran. */
export function placeEnToutesLettres(rang: number): string {
  return rang === 1 ? "1re place" : `${rang}e place`;
}

/** La classe d'une ligne de classement : un filet d'or pour la tête. */
export function classeLigneDeRang(rang: number): string {
  return rang === 1 ? "ligne-rang-1" : "";
}

/**
 * Le rang dans sa pastille. Hors podium, le chiffre reste neutre (la teinte
 * secondaire du texte), dans la même forme pour que la colonne s'aligne.
 */
export function PastilleDeRang({
  rang,
  moi = false,
  doublon = false,
  className = "",
}: {
  rang: number;
  /**
   * La ligne de l'équipe du joueur : hors podium, son chiffre prend l'orange
   * de son repère, comme sur la maquette. Sur le podium, le métal prime.
   */
  moi?: boolean;
  /**
   * Le rang est déjà écrit à côté (« 2e sur 6 ») : la pastille n'est plus
   * qu'un repère visuel, que le lecteur d'écran ne relit pas une seconde fois.
   */
  doublon?: boolean;
  /** La taille suit la police du parent (em) ; une classe peut l'ajuster. */
  className?: string;
}) {
  const metal = metalDuRang(rang);
  return (
    <span
      className={`pastille-rang ${metal ? `pastille-rang-${rang}` : moi ? "text-amber-400" : "text-slate-400"} ${className}`.trim()}
      title={metal ? `${placeEnToutesLettres(rang)}, ${metal}` : placeEnToutesLettres(rang)}
      aria-hidden={doublon || undefined}
    >
      {rang}
    </span>
  );
}
