import Link from "next/link";
import { notionsAvecFiche } from "@/config/ateliers/notions";

/**
 * Les notions d'une séance, reliées à leur fiche quand elle existe.
 *
 * Une liste de mots ne mène nulle part ; un mot souligné ouvre la fiche qui
 * l'explique. Les notions sans fiche restent en texte : ce qui n'est pas
 * couvert se voit, au lieu de se confondre avec le reste.
 */
export function NotionsMobilisees({
  notions,
  className,
}: {
  notions: readonly string[];
  className?: string;
}) {
  const liste = notionsAvecFiche(notions);
  return (
    <span className={className}>
      {liste.map(({ notion, fiche }, i) => (
        <span key={notion}>
          {i > 0 ? ", " : ""}
          {fiche ? (
            <Link
              href={`/notions#${fiche.code}`}
              className="underline decoration-amber-400/40 underline-offset-4 hover:decoration-amber-400 print:no-underline"
              title={fiche.name}
            >
              {notion}
            </Link>
          ) : (
            notion
          )}
        </span>
      ))}
      .
    </span>
  );
}
