import { dessinerQr } from "@/lib/qr";

/**
 * LE QR CODE À L'ÉCRAN, EN SVG, SANS RIEN DEMANDER À PERSONNE.
 *
 * Calculé sur le serveur au rendu de la page (voir `src/lib/qr.ts` pour le
 * pourquoi), rendu en un `<path>` : la page ne charge aucune image, ne fait
 * aucun aller-retour, et le dessin reste net du ticket au vidéoprojecteur
 * parce qu'un SVG n'a pas de résolution.
 *
 * LE FOND EST TOUJOURS CLAIR. Le site est sombre par défaut, mais un QR
 * sombre sur fond sombre n'est pas lu par tous les appareils : la plaque
 * blanche et la zone de silence de quatre modules sont donc dessinées ici, et
 * non laissées à la page qui l'accueille.
 *
 * `aria-hidden` n'est pas une option : un lecteur d'écran ne scanne pas. Le
 * `role="img"` et le texte de remplacement disent l'adresse que le QR
 * encode, pour que l'élève qui ne peut pas viser puisse la taper.
 */
export function CodeQr({
  valeur,
  description,
  className = "h-32 w-32",
}: {
  /** Le texte encodé — pour nous, toujours une URL. */
  valeur: string;
  /** Ce que le QR fait, pour qui ne le voit pas. */
  description: string;
  /** La taille se donne en classes, comme pour une image. */
  className?: string;
}) {
  const { cote, chemin } = dessinerQr(valeur);
  return (
    <svg
      viewBox={`0 0 ${cote} ${cote}`}
      className={className}
      role="img"
      aria-label={description}
      shapeRendering="crispEdges"
    >
      {/* La plaque claire : elle porte la zone de silence et arrondit l'angle
          juste ce qu'il faut pour ne pas ressembler à un défaut d'affichage. */}
      <rect width={cote} height={cote} rx={2} fill="#ffffff" />
      <path d={chemin} fill="#020617" />
    </svg>
  );
}
