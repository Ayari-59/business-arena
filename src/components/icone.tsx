/**
 * LES PICTOGRAMMES DU SITE.
 *
 * Ce fichier a commencé avec l'espace enseignant, dont les titres de section
 * et de tiroir étaient ponctués d'emoji — 📦 🗓️ 🗑️. Il porte aujourd'hui tous
 * les repères du site : l'arène des élèves, le formulaire de décision, le
 * courrier, l'écran de l'enseignant. Un emoji n'est pas une icône : le système
 * le dessine, donc il change de forme et de couleur d'un appareil à l'autre,
 * arrive en couleurs étrangères au site, et se brouille une fois projeté au
 * mur, ce qui arrive à ces pages à chaque séance. Une partie jouée sur des
 * téléphones Android et projetée depuis un Mac montrait trois dessins
 * différents du même 🏦, et aucun n'était dans la charte.
 *
 * Même famille que les pictogrammes de secteur : un seul trait, `currentColor`,
 * viewBox de 24, bouts et angles arrondis. Ils prennent donc l'encre de la
 * ligne qui les porte — le laiton d'une commande, le rouge d'une perte, le
 * gris d'une légende — et il n'y a rien à décliner, ni pour le thème clair ni
 * pour l'impression.
 *
 * UN DESSIN PAR SENS, PAS UN PAR EMOJI. Le relevé comptait plus de cent
 * cinquante emoji différents, dont onze pour dire « la banque écrit » et six
 * pour dire « le temps change ». Les reprendre un à un aurait fait un
 * catalogue où l'œil ne retrouve rien ; l'élève apprend vite qu'un fronton à
 * colonnes, c'est la banque, à condition que ce soit toujours le même. Le
 * courrier choisit donc son pictogramme dans cette liste fermée, comme le
 * formulaire et les tableaux de bord : un nom typé, que le compilateur refuse
 * s'il n'existe pas ici.
 *
 * Le pictogramme se tait pour les lecteurs d'écran (`aria-hidden`) : il double
 * toujours un texte qui dit la même chose. Là où il serait seul, c'est la
 * commande qui porte le nom, par son `aria-label`.
 */

const TRACES = {
  // ── L'espace enseignant, d'où la famille est partie ──────────────────────

  /** Ranger une partie : le carton d'archives qui se ferme. */
  ranger: (
    <>
      <path d="M3 8h18v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V8Z" />
      <path d="M2.5 4.5h19V8h-19z" />
      <path d="M10 12h4" />
    </>
  ),
  /** Recommencer, renouveler : la flèche qui revient au début. */
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
  /** Écrire, décider, nommer : la plume. C'est le geste du formulaire de décision. */
  ecrire: (
    <>
      <path d="M4 20h4L20 8l-4-4L4 16v4Z" />
      <path d="M14 6l4 4" />
    </>
  ),
  /** Le planning, une date, un événement à l'agenda : le calendrier. */
  planning: (
    <>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 10h18M8 3v4M16 3v4" />
    </>
  ),
  /** La durée, l'échéance, ce qui vieillit : le chronomètre. */
  duree: (
    <>
      <circle cx="12" cy="13" r="8" />
      <path d="M12 9v4l2.5 2.5" />
      <path d="M9 2h6" />
    </>
  ),
  /** L'équipe, le personnel, la composition des équipes : deux silhouettes. */
  equipes: (
    <>
      <circle cx="9" cy="8" r="3" />
      <path d="M3 20a6 6 0 0 1 12 0" />
      <path d="M16 5.5a3 3 0 0 1 0 5" />
      <path d="M17.5 14.5A6 6 0 0 1 21 20" />
    </>
  ),
  /** La clé : celle de reprise, le code d'entrée. */
  cle: (
    <>
      <circle cx="8" cy="12" r="4" />
      <path d="M12 12h9" />
      <path d="M17 12v3.5M20 12v2.5" />
    </>
  ),
  /** Le courrier : l'enveloppe. */
  courrier: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3 7 9 6 9-6" />
    </>
  ),
  /** L'écran : celui qu'on projette en classe, celui de l'ordinateur. */
  ecran: (
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
  /** L'étiquette : un prix, une marque, un carton de table. */
  etiquette: (
    <>
      <path d="M3 12.5V5a2 2 0 0 1 2-2h7.5L21 11.5 12.5 20 3 12.5Z" />
      <circle cx="8" cy="8" r="1.5" />
    </>
  ),
  /** Un écrit : la feuille réglée d'un compte rendu, d'un mandat, d'un guide. */
  document: (
    <>
      <rect x="5" y="3" width="14" height="18" rx="2" />
      <path d="M9 8h6M9 12h6M9 16h3" />
    </>
  ),
  /** Ce qui est verrouillé : le palier gratuit, un vol, une attaque informatique. */
  verrou: (
    <>
      <rect x="4" y="10" width="16" height="11" rx="2" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
    </>
  ),

  // ── L'argent et ceux qui le prêtent ──────────────────────────────────────

  /** La banque, et toute institution qui écrit : le fronton à colonnes. */
  banque: (
    <>
      <path d="M3 9 12 4l9 5" />
      <path d="M4 9h16" />
      <path d="M6.5 12v5M10.5 12v5M13.5 12v5M17.5 12v5" />
      <path d="M3.5 20h17" />
    </>
  ),
  /** L'argent qu'on dépense ou qu'on reçoit : le billet. */
  argent: (
    <>
      <rect x="2.5" y="6" width="19" height="12" rx="1.5" />
      <circle cx="12" cy="12" r="2.5" />
      <path d="M6 12h.01M18 12h.01" />
    </>
  ),
  /** La trésorerie, l'argent disponible : le portefeuille. */
  tresorerie: (
    <>
      <path d="M17 7V5a1 1 0 0 0-1.3-1L4.5 7.5" />
      <rect x="3" y="7.5" width="18" height="13" rx="2" />
      <path d="M21 11.5h-4a2 2 0 0 0 0 4h4" />
      <path d="M17 13.5h.01" />
    </>
  ),
  /** Ce qui monte : un prix, un coût, une demande. La courbe qui grimpe. */
  hausse: (
    <>
      <path d="M3 17.5 9 11.5l4 4 8-8" />
      <path d="M15 7.5h6v6" />
    </>
  ),
  /** Ce qui descend : la courbe qui plonge. */
  baisse: (
    <>
      <path d="M3 6.5 9 12.5l4-4 8 8" />
      <path d="M15 16.5h6v-6" />
    </>
  ),
  /** Les résultats, les chiffres, les indicateurs : l'histogramme. */
  resultats: (
    <>
      <path d="M3 3v18h18" />
      <rect x="6.5" y="12" width="3" height="6" rx="0.5" />
      <rect x="11.5" y="6" width="3" height="12" rx="0.5" />
      <rect x="16.5" y="9" width="3" height="9" rx="0.5" />
    </>
  ),

  // ── L'entreprise et son marché ───────────────────────────────────────────

  /** La production, les machines, la capacité : l'atelier aux toits en sheds. */
  usine: (
    <>
      <path d="M3 20.5V11l5 3v-3l5 3v-3l5 3V4h3v16.5H3Z" />
      <path d="M7 17.5h2M12 17.5h2" />
    </>
  ),
  /** L'entretien, la panne, la réparation : la clé plate. */
  outil: (
    <>
      <path d="M14.5 3.5a5 5 0 0 0-4.8 6.4L3.6 16a2 2 0 0 0 2.9 2.9l6.1-6.1a5 5 0 0 0 6.4-4.8l-2.8 2.8-2.9-.6-.6-2.9 2.8-2.8Z" />
    </>
  ),
  /** Le fournisseur, la livraison, le transport : la camionnette. */
  camion: (
    <>
      <path d="M2.5 6.5h11v9.5h-11z" />
      <path d="M13.5 9.5h4l3 3.5V16h-7" />
      <circle cx="6.5" cy="17.5" r="1.75" />
      <circle cx="16.5" cy="17.5" r="1.75" />
    </>
  ),
  /** Une commande, un stock, un colis : le carton scotché. */
  colis: (
    <>
      <path d="M3.5 7.5 12 3.5l8.5 4v9L12 20.5l-8.5-4v-9Z" />
      <path d="M3.5 7.5 12 11.5l8.5-4M12 11.5v9" />
      <path d="M7.75 5.5l8.5 4" />
    </>
  ),
  /** Le commerce, la clientèle, le marché : la devanture et son store. */
  boutique: (
    <>
      <path d="M4.5 11v9.5h15V11" />
      <path d="M3 9.5 4.5 4h15L21 9.5" />
      <path d="M3 9.5a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0" />
      <path d="M10 20.5v-5h4v5" />
    </>
  ),
  /** Les concurrents : deux épées croisées. */
  concurrence: (
    <>
      <path d="M14.5 17.5 3.5 6.5V3.5h3l11 11" />
      <path d="M13 19l6-6M16 16l4 4M19 21l2-2" />
      <path d="M14.5 6.5l3-3h3v3l-3 3" />
      <path d="M5 14l6 6M8 16l-4 4M3 19l2 2" />
    </>
  ),
  /** Qui l'on vise : la cible. Vos ventes, votre entreprise, un pli adressé. */
  cible: (
    <>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5" />
      <path d="M12 12h.01" />
    </>
  ),
  /** La communication, la presse, les réseaux : le porte-voix. */
  communication: (
    <>
      <path d="M3.5 10v4a1 1 0 0 0 1 1H7l8 4.5v-15L7 9H4.5a1 1 0 0 0-1 1Z" />
      <path d="M7 15l1.5 5" />
      <path d="M18.5 9.5a3.5 3.5 0 0 1 0 5" />
    </>
  ),
  /** Un accord : partenariat, contrat-cadre, grand compte. Les deux mains serrées. */
  accord: (
    <>
      <path d="M2.5 12 6 8.5h3.5" />
      <path d="M21.5 12 18 8.5h-4.5L10 11.5a1.5 1.5 0 0 0 2 2.2l2.5-2 4 4" />
      <path d="M6 15l4 4a1.5 1.5 0 0 0 2.1 0l6.4-3.5" />
      <path d="M9 16.5l2-2M11.5 18.5l2-2" />
    </>
  ),
  /** Un bâtiment : immeuble de bureaux, résidence, local commercial. */
  immeuble: (
    <>
      <rect x="5" y="3" width="14" height="18" rx="1" />
      <path d="M9 7h1M14 7h1M9 11h1M14 11h1M9 15h1M14 15h1" />
      <path d="M10.5 21v-3h3v3" />
    </>
  ),
  /** Le monde : toute la classe, l'export, la page publique. Le globe. */
  monde: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18" />
      <path d="M12 3c2.4 2.5 3.6 5.5 3.6 9s-1.2 6.5-3.6 9c-2.4-2.5-3.6-5.5-3.6-9S9.6 5.5 12 3Z" />
    </>
  ),
  /** Le temps qu'il fait, la saison : le soleil derrière le nuage. */
  meteo: (
    <>
      <path d="M8.5 2.5v1.5M3 8h1.5M4.6 4.1l1 1M12.4 4.1l-1 1" />
      <path d="M5.4 10.5a3.5 3.5 0 0 1 6.4-2.6" />
      <path d="M7.5 20.5h10a3.5 3.5 0 0 0 .4-7 5 5 0 0 0-9.6.6 3.2 3.2 0 0 0-.8 6.4Z" />
    </>
  ),

  // ── Les gens ─────────────────────────────────────────────────────────────

  /** Une personne : le joueur, un salarié qui part ou s'absente. */
  personne: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4.5 21a7.5 7.5 0 0 1 15 0" />
    </>
  ),
  /** La formation, les études : le mortier du diplômé. */
  formation: (
    <>
      <path d="M2.5 9 12 4.5 21.5 9 12 13.5 2.5 9Z" />
      <path d="M6.5 11v4.5c0 1.4 2.5 3 5.5 3s5.5-1.6 5.5-3V11" />
      <path d="M21.5 9v5" />
    </>
  ),
  /** Le téléphone : l'appel urgent, l'application, l'écran d'accueil. */
  telephone: (
    <>
      <rect x="6.5" y="2.5" width="11" height="19" rx="2" />
      <path d="M11 18.5h2" />
    </>
  ),

  // ── Ce qui protège, ce qui menace, ce qui juge ───────────────────────────

  /** L'assurance, le sinistre déclaré : le bouclier. */
  assurance: (
    <>
      <path d="M12 3 4.5 6v5.5c0 4.5 3.2 8.1 7.5 9.5 4.3-1.4 7.5-5 7.5-9.5V6L12 3Z" />
      <path d="m9 12 2 2 4-4" />
    </>
  ),
  /** L'alerte, le danger, l'interdiction : le triangle et son point d'exclamation. */
  alerte: (
    <>
      <path d="M10.3 4.2a2 2 0 0 1 3.4 0l7.6 13.3a2 2 0 0 1-1.7 3H4.4a2 2 0 0 1-1.7-3l7.6-13.3Z" />
      <path d="M12 9.5v4.5" />
      <path d="M12 17h.01" />
    </>
  ),
  /** Le droit, la règle, le contrôle, le litige : la balance. */
  balance: (
    <>
      <path d="M12 4v16M8 20h8" />
      <path d="M5 7h14" />
      <path d="M5 7 2.5 13a2.5 2.5 0 0 0 5 0L5 7ZM19 7l-2.5 6a2.5 2.5 0 0 0 5 0L19 7Z" />
    </>
  ),
  /** La responsabilité sociale et environnementale : la pousse. */
  feuille: (
    <>
      <path d="M12 21v-8" />
      <path d="M12 13c0-4.5 3-7.5 8-7.5 0 4.5-3 7.5-8 7.5Z" />
      <path d="M12 15.5c0-3.3-2.3-5.5-6-5.5 0 3.3 2.3 5.5 6 5.5Z" />
    </>
  ),

  // ── Lire, viser, réussir ─────────────────────────────────────────────────

  /** Analyser, observer, s'informer : la loupe. */
  loupe: (
    <>
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="m15.5 15.5 5 5" />
    </>
  ),
  /** Une idée, un levier, ce qui est en jeu : l'ampoule. */
  idee: (
    <>
      <path d="M9.5 18h5M10.5 21h3" />
      <path d="M12 3a6 6 0 0 0-3.6 10.8c.7.5 1.1 1.3 1.1 2.2h5c0-.9.4-1.7 1.1-2.2A6 6 0 0 0 12 3Z" />
    </>
  ),
  /** La situation : le porte-bloc, avec sa pince. Aussi la commande ferme. */
  fiche: (
    <>
      <path d="M8.5 5H6.5a1.5 1.5 0 0 0-1.5 1.5v13A1.5 1.5 0 0 0 6.5 21h11a1.5 1.5 0 0 0 1.5-1.5v-13A1.5 1.5 0 0 0 17.5 5h-2" />
      <rect x="8.5" y="3" width="7" height="3.5" rx="1" />
      <path d="M9 11.5h6M9 15.5h4" />
    </>
  ),
  /** Un prix, un label, une victoire : la coupe. */
  trophee: (
    <>
      <path d="M7.5 4h9v5a4.5 4.5 0 0 1-9 0V4Z" />
      <path d="M7.5 6H4.5v1a3 3 0 0 0 3 3M16.5 6h3v1a3 3 0 0 1-3 3" />
      <path d="M12 13.5V17M8.5 20.5h7M9.5 17h5v3.5" />
    </>
  ),
  /** La réputation, une note, une distinction : l'étoile. */
  etoile: (
    <>
      <path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.9L12 3.5Z" />
    </>
  ),
} as const;

export type NomDIcone = keyof typeof TRACES;

/** Tous les noms, pour les tests et pour qui doit valider une donnée venue d'ailleurs. */
export const NOMS_D_ICONE = Object.keys(TRACES) as NomDIcone[];

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
