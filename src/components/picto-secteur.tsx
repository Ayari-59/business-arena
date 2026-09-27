import type { Sector } from "@/config/scenarios/registry";

/**
 * LES NEUF SECTEURS, DESSINÉS.
 *
 * Ils étaient représentés par des emoji — 🏭 🛍️ 🏨 — posés dans la tuile qui
 * ouvre l'arène et la liste des parties. Un emoji n'est pas une icône : il est
 * dessiné par le système, donc différent sur Windows, sur Mac et sur Android,
 * souvent en couleurs qui ne sont pas celles du site, et il devient illisible
 * une fois projeté au mur.
 *
 * Ces pictogrammes sont d'un seul trait, à la couleur du texte qui les porte :
 * ils prennent donc l'accent de leur secteur sans qu'on ait à les décliner, et
 * ils tiennent au vidéoprojecteur comme au timbre-poste. Les emoji restent
 * partout ailleurs — dans les titres de tiroirs, où ils ponctuent une ligne de
 * texte et ne représentent rien.
 *
 * Neuf formes, une par secteur, et aucune qui ressemble à une autre : c'est la
 * seule chose qui compte quand l'enseignant cherche sa partie dans une liste.
 */

const TRACES: Record<Sector, React.ReactNode> = {
  // L'usine : deux pignons et une cheminée.
  industrie: (
    <>
      <path d="M3 21h18" />
      {/* Un bâtiment franc et deux cheminées. Les toits en sheds, essayés
          d'abord, se lisaient comme un diagramme en barres à 24 pixels. */}
      <path d="M4 21v-9h16v9" />
      <path d="M8 12V7h2v5" />
      <path d="M14 12V5h2v7" />
    </>
  ),
  // Le sac du commerce, avec ses anses.
  commerce: (
    <>
      <path d="M5 8h14l-1 12H6L5 8Z" />
      <path d="M9 8V6a3 3 0 0 1 6 0v2" />
    </>
  ),
  // Le carton de l'e-commerce, scellé et fléché.
  ecommerce: (
    <>
      <path d="M4 8.5 12 5l8 3.5v7L12 19l-8-3.5v-7Z" />
      <path d="M4 8.5 12 12l8-3.5M12 12v7" />
    </>
  ),
  // Le lit de l'hôtel.
  hotellerie: (
    <>
      <path d="M3 18v-9" />
      <path d="M3 13h18v5" />
      <path d="M7 13v-2h6v2" />
      <circle cx="17.5" cy="10.5" r="1.5" />
    </>
  ),
  // Le couvert du restaurant.
  restauration: (
    <>
      <path d="M7 3v8M7 11v10M5 3v4a2 2 0 0 0 4 0V3" />
      <path d="M17 3c-1.5 1.5-2 3-2 5s.7 3 2 3v10" />
    </>
  ),
  // La mallette des services.
  services: (
    <>
      <rect x="3" y="7" width="18" height="13" rx="2" />
      <path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
      <path d="M3 12h18" />
    </>
  ),
  // L'abonnement : le mois qui revient.
  abonnement: (
    <>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 10h18M8 3v4M16 3v4" />
      <path d="M9 15.5h5m0 0-1.5-1.5M14 15.5l-1.5 1.5" />
    </>
  ),
  // La grue du bâtiment.
  // La grue du bâtiment : mât, flèche, câble et charge.
  batiment: (
    <>
      <path d="M3 21h18" />
      <path d="M7 21V4" />
      <path d="M4 4h13" />
      <path d="M14 4v4" />
      <rect x="12.5" y="8" width="3" height="3" />
    </>
  ),
  // Le camion du transport.
  transport: (
    <>
      <path d="M2 16V7h11v9" />
      <path d="M13 10h4l3 3v3h-7" />
      <circle cx="7" cy="17.5" r="1.8" />
      <circle cx="17" cy="17.5" r="1.8" />
    </>
  ),
};

export function PictoSecteur({
  secteur,
  className = "h-6 w-6",
}: {
  secteur: Sector;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      focusable="false"
    >
      {TRACES[secteur]}
    </svg>
  );
}
