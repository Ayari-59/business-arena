/**
 * Le logo, en fond de bloc plutôt qu'en balise d'image.
 *
 * Le nom « Business Arena » est écrit en gris pâle dans le fichier : sur le
 * thème clair il disparaîtrait. Il existe une seconde version pour fond clair,
 * et une feuille de style ne peut pas changer la source d'une balise <img>,
 * alors qu'elle change une image de fond. Deux balises dont une masquée
 * feraient charger les deux fichiers ; celle-ci n'en charge qu'un.
 *
 * Le rapport du dessin est 501 × 100, d'où la largeur par défaut : 2 rem de
 * haut appellent 10 rem de large.
 */
export function SiteLogo({ className }: { className?: string }) {
  return (
    <span
      role="img"
      aria-label="Business Arena"
      className={`logo-arena block ${className ?? "h-8 w-40"}`}
    />
  );
}
