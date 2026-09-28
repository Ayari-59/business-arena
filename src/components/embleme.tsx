import { emblemeParCode } from "@/config/emblemes";

/**
 * L'emblème d'une équipe, dessiné. Rien quand l'équipe n'en a pas choisi : une
 * forme par défaut ferait croire à un choix, et toutes les équipes muettes se
 * ressembleraient de nouveau.
 *
 * Le titre accessible porte le NOM de l'équipe, pas celui de la forme : ce
 * qu'un lecteur d'écran doit annoncer, c'est « Volt Partners », pas « éclair ».
 */
export function Embleme({
  code,
  equipe,
  className = "h-4 w-4",
}: {
  code: string | null | undefined;
  /** Le nom de l'équipe, pour l'annonce vocale. */
  equipe?: string;
  className?: string;
}) {
  const embleme = emblemeParCode(code);
  if (!embleme) return null;
  return (
    <svg
      viewBox="0 0 24 24"
      className={`inline-block shrink-0 ${className}`}
      fill="currentColor"
      role={equipe ? "img" : "presentation"}
      aria-label={equipe ? `Emblème de ${equipe}` : undefined}
      aria-hidden={equipe ? undefined : true}
    >
      <path d={embleme.trace} />
    </svg>
  );
}
