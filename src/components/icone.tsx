/**
 * LES ICÔNES DE L'ESPACE ENSEIGNANT.
 *
 * Les titres de section et de tiroir étaient ponctués d'emoji — 📦 🗓️ 🗑️ —
 * qui ne sont pas des icônes : le système les dessine, donc ils changent de
 * forme et de couleur d'un appareil à l'autre, arrivent en couleurs étrangères
 * au site, et se brouillent une fois projetés au mur, ce qui arrive à cette
 * page à chaque séance.
 *
 * Même famille que les pictogrammes de secteur : un seul trait, `currentColor`,
 * viewBox de 24. Elles prennent donc l'encre de la ligne qui les porte, et il
 * n'y a rien à décliner.
 *
 * Seuls les signes RÉCURRENTS sont dessinés : ceux des titres de la page de
 * partie et des liens du ticket, que l'enseignant voit à chaque séance. Un
 * emoji qui ponctue une phrase une seule fois dans tout le site n'a pas besoin
 * d'une icône ; il en a besoin quand il devient un repère.
 */

const TRACES = {
  /** Ranger une partie : le carton qui se ferme. */
  ranger: (
    <>
      <path d="M3 8h18v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V8Z" />
      <path d="M2.5 4.5h19V8h-19z" />
      <path d="M10 12h4" />
    </>
  ),
  /** Recommencer : la flèche qui revient au début. */
  recommencer: (
    <>
      <path d="M3 12a9 9 0 1 0 3-6.7" />
      <path d="M3 4v5h5" />
    </>
  ),
  /** Supprimer : la corbeille. */
  supprimer: (
    <>
      <path d="M4 7h16" />
      <path d="M9 7V5h6v2" />
      <path d="M6 7l1 13h10l1-13" />
      <path d="M10 11v6M14 11v6" />
    </>
  ),
  /** Nommer : la plume. */
  nommer: (
    <>
      <path d="M4 20h4L20 8l-4-4L4 16v4Z" />
      <path d="M14 6l4 4" />
    </>
  ),
  /** Le planning : le calendrier. */
  planning: (
    <>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 10h18M8 3v4M16 3v4" />
    </>
  ),
  /** La durée d'un tour : le chronomètre. */
  duree: (
    <>
      <circle cx="12" cy="13" r="8" />
      <path d="M12 9v4l2.5 2.5" />
      <path d="M9 2h6" />
    </>
  ),
  /** La composition des équipes : deux silhouettes. */
  equipes: (
    <>
      <circle cx="9" cy="8" r="3" />
      <path d="M3 20a6 6 0 0 1 12 0" />
      <path d="M16 5.5a3 3 0 0 1 0 5" />
      <path d="M17.5 14.5A6 6 0 0 1 21 20" />
    </>
  ),
  /** La clé de reprise. */
  cle: (
    <>
      <circle cx="8" cy="12" r="4" />
      <path d="M12 12h9" />
      <path d="M17 12v3.5M20 12v2.5" />
    </>
  ),
  /** Le courrier de l'entreprise. */
  courrier: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3 7 9 6 9-6" />
    </>
  ),
  /** Projeter : l'écran de la salle. */
  projeter: (
    <>
      <rect x="3" y="4" width="18" height="12" rx="1.5" />
      <path d="M12 16v4M9 20h6" />
    </>
  ),
  /** Imprimer. */
  imprimer: (
    <>
      <path d="M7 9V3h10v6" />
      <path d="M5 9h14a2 2 0 0 1 2 2v5h-4" />
      <path d="M3 16V11a2 2 0 0 1 2-2" />
      <path d="M7 14h10v7H7z" />
    </>
  ),
  /** Les cartons de table : l'étiquette. */
  carton: (
    <>
      <path d="M3 12.5V5a2 2 0 0 1 2-2h7.5L21 11.5 12.5 20 3 12.5Z" />
      <circle cx="8" cy="8" r="1.5" />
    </>
  ),
  /** Les questions posées : le bloc-notes. */
  questions: (
    <>
      <rect x="5" y="3" width="14" height="18" rx="2" />
      <path d="M9 8h6M9 12h6M9 16h3" />
    </>
  ),
  /** Ce qui est verrouillé par le palier gratuit. */
  verrou: (
    <>
      <rect x="4" y="10" width="16" height="11" rx="2" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
    </>
  ),
} as const;

export type NomDIcone = keyof typeof TRACES;

export function Icone({
  nom,
  className = "h-4 w-4",
}: {
  nom: NomDIcone;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={`inline-block shrink-0 align-[-0.15em] ${className}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      focusable="false"
    >
      {TRACES[nom]}
    </svg>
  );
}
