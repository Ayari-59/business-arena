/**
 * LES SURFACES DE LECTURE : CE QUI SE POSE SUR LE COCKPIT EN PAPIER (LOT 6A).
 *
 * Décision du propriétaire : l'écran de jeu bascule sur le marine profond — un
 * COCKPIT —, mais les zones de LECTURE restent claires, posées comme des
 * documents sur le bureau. « Pas 100 % sombre ni 100 % papier » : du contraste.
 * Les deux sols doivent se voir ENSEMBLE dans chaque fenêtre.
 *
 * LE CRITÈRE, écrit une fois : un bloc dont le contenu est D'ABORD DE LA PROSE
 * (plus de trois lignes de texte suivi — un courrier, une situation, un texte
 * pédagogique) est un DOCUMENT → papier. Un bloc de chiffres, de champs, de
 * leviers, de barres ou de lignes de classement est le COCKPIT → marine.
 *
 * Ce module est la liste explicite que le lot 6A exige, et une GARDE l'énumère
 * (`tests/architecture/surfaces-de-lecture.test.ts`). Le papier posé dans le
 * cockpit reprend la matière de `.papier` (globals.css) : UNE matière de
 * document, blanc, encre `#0e1a2b`, filet `#dbe2ee`, ombre courte, en-tête
 * marine — pas deux. Les composants marqués `papier` s'écrivent donc en jetons
 * `--encre`/`--papier`, jamais en `text-slate-*` (que l'inversion du thème
 * clair sous `.ardoise` retournerait en clair-sur-blanc, illisible).
 */

export type RoleDeSurface = "papier" | "cockpit";

/** Le sol d'un repli générique (`Tiroir`, `Repliable`) : le cockpit par défaut. */
export type SurfaceDuRepli = RoleDeSurface;

export interface SurfaceDeLecture {
  /** Clé stable, pour la garde et les renvois. */
  readonly cle: string;
  /** Le rôle : document de lecture (papier) ou surface de pilotage (cockpit). */
  readonly role: RoleDeSurface;
  /** Le composant ou le bloc qui la porte (chemin relatif à `src/`). */
  readonly porte: string;
  /** Pourquoi ce rôle, au regard du critère prose/chiffres. */
  readonly raison: string;
  /**
   * LA PREUVE DANS LE CODE (lot 6D), pour un document : le fichier (relatif à
   * `src/`) et le motif qui y pose le papier. Le catalogue disait « papier »
   * pour les aides et les textes du bilan alors que l'écran les rendait sur le
   * marine : une déclaration sans preuve ne protège rien. La garde lit le
   * fichier et exige le motif.
   */
  readonly preuve?: { readonly fichier: string; readonly motif: RegExp };
}

/**
 * LES DOCUMENTS — PAPIER. De la prose d'abord : on les lit, on ne les pilote
 * pas. Le courrier est déjà un OBJET `.papier` aux couleurs écrites en dur
 * (gardé tel quel) ; les autres reprennent sa matière via la classe `.papier`.
 */
export const SURFACES_PAPIER: readonly SurfaceDeLecture[] = [
  {
    cle: "courrier-du-tour",
    role: "papier",
    porte: "components/courrier-du-tour.tsx",
    raison:
      "La lettre du tour est déjà un objet `.papier` (couleurs en dur) ; elle fixe la matière de référence.",
    preuve: { fichier: "components/courrier.tsx", motif: /className="papier lettre\b/ },
  },
  {
    cle: "situation-du-tour",
    role: "papier",
    porte: "components/situation-panel.tsx:SituationCard",
    raison: "La situation du tour est une mise en scène narrative — de la prose avant tout.",
    preuve: {
      fichier: "components/situation-panel.tsx",
      motif: /<article className=\{dansTiroir \? "" : "papier rounded-xl/,
    },
  },
  {
    cle: "analyse-du-tour",
    role: "papier",
    porte: "components/situation-panel.tsx:AnalyseDuTour",
    raison:
      "L'analyse rendue par l'équipe est un texte suivi, posé pour la lecture et le débrief. Sur téléphone, sa feuille vient du tiroir de l'accordéon (lot 6D).",
    preuve: {
      fichier: "components/situation-panel.tsx",
      motif: /titre=\{x\.title\}\s+phrase[^>]*?surface="papier"/,
    },
  },
  {
    cle: "faits-de-la-situation",
    role: "papier",
    porte: "components/situation-panel.tsx:SituationCard (« Pourquoi cette situation ? »)",
    raison:
      "Les faits qui déclenchent une situation font partie du document : une section creusée de la feuille, et non un tiroir marine encastré où l'encre grise devenait illisible (lot 6D).",
    preuve: {
      fichier: "components/situation-panel.tsx",
      motif: /titre="Pourquoi cette situation \?"[^>]*?surface="papier"/,
    },
  },
  {
    cle: "debrief-de-la-situation",
    role: "papier",
    porte: "components/situation-panel.tsx:SituationDebrief",
    raison: "Le débrief pédagogique explique le tour en prose : un document, pas un tableau.",
    preuve: {
      fichier: "components/situation-panel.tsx",
      motif: /<article className="papier rounded-xl p-4 sm:p-6">/,
    },
  },
  {
    cle: "note-du-tour-precedent",
    role: "papier",
    porte: "components/note-du-tour-precedent.tsx",
    raison: "La note rappelle en toutes lettres ce qui s'est joué au tour d'avant.",
    preuve: { fichier: "components/note-du-tour-precedent.tsx", motif: /className="papier\b/ },
  },
  {
    cle: "mandat-de-lequipe",
    role: "papier",
    porte: "components/mandat-de-lequipe.tsx",
    raison: "Le mandat est la lettre de mission de l'équipe : un texte de cadrage.",
    // Le mandat EST une lettre recommandée : son papier est celui du courrier.
    preuve: { fichier: "components/mandat-de-lequipe.tsx", motif: /<CourrierRecommande\b/ },
  },
  {
    cle: "aides-longues",
    role: "papier",
    porte: 'components/tiroir.tsx et components/repliable.tsx, `surface="papier"`',
    raison:
      "Une aide dépliée de plusieurs lignes est un texte d'accompagnement à lire. Chaque instance papier est nommée dans INSTANCES_DE_REPLI, plus bas.",
    preuve: { fichier: "components/tiroir.tsx", motif: /"papier tiroir-papier\b/ },
  },
  {
    cle: "textes-du-bilan",
    role: "papier",
    porte: "components/bilan-de-partie.tsx (le reste du bilan)",
    raison:
      "Les textes du bilan de partie (réussites, record) sont de la prose : une feuille sous l'ardoise de clôture, qui reste un tableau des scores.",
    preuve: {
      fichier: "components/bilan-de-partie.tsx",
      motif: /data-bilan-lecture=""\s+className="papier\b/,
    },
  },
] as const;

/**
 * LE COCKPIT — MARINE PROFOND. Des chiffres, des champs, des leviers, des
 * barres, des lignes de classement : on les pilote, on ne les lit pas comme un
 * texte. Ils prennent l'ardoise (jetons sombres) et le relief du lot 6A.
 */
export const SURFACES_COCKPIT: readonly SurfaceDeLecture[] = [
  {
    cle: "ardoise-des-chiffres",
    role: "cockpit",
    porte: "components/ardoise-repliee.tsx",
    raison: "Les quatre chiffres clés du tour : le tableau de bord, pas un texte.",
  },
  {
    cle: "feuille-de-decision",
    role: "cockpit",
    porte: "components/decision-form.tsx",
    raison: "Champs, leviers, budgets, résultat estimé : la feuille de pilotage.",
  },
  {
    cle: "bande-de-marche",
    role: "cockpit",
    porte: "components/bande-de-marche.tsx",
    raison: "Quatre à six faits chiffrés du tour avec leur écart : tabulaire, dense.",
  },
  {
    cle: "classement-des-equipes",
    role: "cockpit",
    porte: "components/classement.tsx",
    raison: "Des lignes de classement, des barres de comparaison : des chiffres.",
  },
  {
    cle: "tableau-de-bord-du-tour-clos",
    role: "cockpit",
    porte: "app/arena/[gameId]/page.tsx (tour clos)",
    raison: "Le compte du tour, ses jauges et ses courbes : du pilotage.",
  },
] as const;

export const SURFACES_DE_LECTURE: readonly SurfaceDeLecture[] = [
  ...SURFACES_PAPIER,
  ...SURFACES_COCKPIT,
];

export function estPapier(cle: string): boolean {
  return SURFACES_PAPIER.some((s) => s.cle === cle);
}

export function estCockpit(cle: string): boolean {
  return SURFACES_COCKPIT.some((s) => s.cle === cle);
}

/**
 * LES REPLIS GÉNÉRIQUES, UN PAR UN (LOT 6D).
 *
 * `Tiroir` et `Repliable` servent les deux sols. Leur aspect par défaut reste
 * celui du cockpit, et on ne le bascule jamais en entier : une instance qui
 * range un DOCUMENT (une aide longue, une explication, un « pourquoi », une
 * situation) le déclare par `surface="papier"`. Cette liste nomme CHAQUE
 * instance du dépôt, avec son sol et sa raison ; la garde
 * (`tests/architecture/surfaces-de-lecture.test.ts`) relit les sources et
 * tombe si une instance n'y est pas, si une entrée n'a plus d'instance, ou si
 * le sol déclaré n'est pas celui que le code pose.
 *
 * `repere` est un extrait de la balise ouvrante qui désigne l'instance dans
 * son fichier. Les pages hors de l'arène (enseignant, entreprises, profil)
 * sont des pages claires : le sol de la page fait déjà le papier, la variante
 * y doublerait la feuille. Elles gardent l'aspect par défaut.
 */
export interface InstanceDeRepli {
  /** Le fichier, relatif à `src/`. */
  readonly fichier: string;
  readonly composant: "Tiroir" | "Repliable";
  /** Un extrait de la balise ouvrante, qui désigne l'instance. */
  readonly repere: string;
  /** Le sol que l'instance doit porter (`surface`, « cockpit » par défaut). */
  readonly surface: SurfaceDuRepli;
  readonly raison: string;
}

const PAGE_CLAIRE = "Page claire hors de l'arène : le sol de la page fait déjà le papier.";

export const INSTANCES_DE_REPLI: readonly InstanceDeRepli[] = [
  // ── Les documents : papier ──
  {
    fichier: "components/situation-panel.tsx",
    composant: "Tiroir",
    repere: "titre={x.title}",
    surface: "papier",
    raison: "Le volet Analyser sur téléphone : chaque situation est un document à lire.",
  },
  {
    fichier: "components/situation-panel.tsx",
    composant: "Tiroir",
    repere: 'titre="Pourquoi cette situation ?"',
    surface: "papier",
    raison: "Les faits d'une situation, dans la feuille : une section creusée du document.",
  },
  {
    fichier: "components/competitive-benchmark.tsx",
    composant: "Tiroir",
    repere: 'titre="Comment lire ce tableau"',
    surface: "papier",
    raison: "Une explication en prose : la règle de lecture de l'indice de compétitivité-prix.",
  },
  {
    fichier: "components/period-dashboard.tsx",
    composant: "Tiroir",
    repere: 'titre="Comment l\'IPG se calcule"',
    surface: "papier",
    raison: "Une explication en prose : la composition de l'indice de performance.",
  },
  {
    fichier: "components/aide-repliable.tsx",
    composant: "Tiroir",
    repere: "<Tiroir titre={titre} ferme",
    surface: "papier",
    raison: "L'aide « Comprendre » du téléphone : deux paragraphes d'explication.",
  },
  {
    fichier: "components/decision-form.tsx",
    composant: "Tiroir",
    repere: 'titre="Mise en service et revente"',
    surface: "papier",
    raison: "Trois phrases sur la mise en service et la perte de cession : une aide.",
  },
  {
    fichier: "components/decision-form.tsx",
    composant: "Tiroir",
    repere: 'titre="Ce que couvre chaque formule"',
    surface: "papier",
    raison: "Ce que couvre chaque formule d'assurance, puis la règle : une explication.",
  },
  {
    fichier: "components/decision-form.tsx",
    composant: "Tiroir",
    repere: 'titre="Pourquoi payer l\'information ?"',
    surface: "papier",
    raison: "Un « pourquoi » : la notion du coût de l'information, en prose.",
  },
  // ── Le cockpit : l'aspect par défaut ──
  {
    fichier: "components/aide-repliable.tsx",
    composant: "Tiroir",
    repere: "quoi={resume}",
    surface: "cockpit",
    raison: "Un panneau de CHIFFRES consulté sur téléphone, avec son chiffre dans le résumé.",
  },
  {
    fichier: "components/decision-form.tsx",
    composant: "Tiroir",
    repere: 'titre="Autres repères"',
    surface: "cockpit",
    raison: "Des repères chiffrés en pastilles : du pilotage.",
  },
  {
    fichier: "components/decision-form.tsx",
    composant: "Tiroir",
    repere: 'titre="Découvert autorisé"',
    surface: "cockpit",
    raison: "Un plafond chiffré dans le résumé, et une seule phrase : pas un document.",
  },
  {
    fichier: "components/decision-form.tsx",
    composant: "Tiroir",
    repere: 'titre="Découvert autorisé"',
    surface: "cockpit",
    raison: "Le même plafond, côté trésorerie : un chiffre, une phrase.",
  },
  {
    fichier: "components/decision-form.tsx",
    composant: "Repliable",
    repere: "option-ponctuelle",
    surface: "cockpit",
    raison: "Les options ponctuelles de la feuille : des champs et des choix, du pilotage.",
  },
  {
    fichier: "components/resultat-estime.tsx",
    composant: "Repliable",
    repere: 'resume="Compte de résultat estimé"',
    surface: "cockpit",
    raison: "Un compte de résultat en cascade : un tableau de chiffres.",
  },
  {
    fichier: "components/decision-context.tsx",
    composant: "Tiroir",
    repere: "<Tiroir titre={titre} quoi={resume}>",
    surface: "cockpit",
    raison: "Un panneau de paramètres sur téléphone : capacité, coûts, marché.",
  },
  {
    fichier: "components/decision-context.tsx",
    composant: "Tiroir",
    repere: 'titre="Détail par clientèle"',
    surface: "cockpit",
    raison: "Le détail chiffré de chaque clientèle : une grille de chiffres.",
  },
  {
    fichier: "components/saison-du-tour.tsx",
    composant: "Tiroir",
    repere: 'titre="Saison du tour"',
    surface: "cockpit",
    raison: "Un coefficient de demande et ses précisions : des chiffres.",
  },
  {
    fichier: "components/financial-statements.tsx",
    composant: "Tiroir",
    repere: "titre={title}",
    surface: "cockpit",
    raison: "Les états financiers : des tableaux.",
  },
  {
    fichier: "components/ratio-gauges.tsx",
    composant: "Tiroir",
    repere: 'titre="Ratios financiers"',
    surface: "cockpit",
    raison: "Un tableau de ratios d'abord ; la phrase qui le suit ne fait pas un document.",
  },
  {
    fichier: "components/sales-history.tsx",
    composant: "Tiroir",
    repere: 'titre="Historique de vos ventes"',
    surface: "cockpit",
    raison: "Un tableau des ventes, tour par tour.",
  },
  {
    fichier: "components/ma-carte-de-reprise.tsx",
    composant: "Tiroir",
    repere: 'icone="cle"',
    surface: "cockpit",
    raison: "Un code, un QR et des boutons : un outil, pas un texte.",
  },
  {
    fichier: "app/arena/[gameId]/page.tsx",
    composant: "Tiroir",
    repere: 'titre="Situation"',
    surface: "cockpit",
    raison:
      "Sur téléphone, la présentation vit sur une carte du cockpit (choix du lot 6C) ; à revoir avec elle.",
  },
  {
    fichier: "app/arena/[gameId]/page.tsx",
    composant: "Tiroir",
    repere: 'titre="Contexte"',
    surface: "cockpit",
    raison: "Le pendant de « Situation », sur la même carte du cockpit.",
  },
  {
    fichier: "app/arena/[gameId]/page.tsx",
    composant: "Tiroir",
    repere: 'titre="Leviers d\'action"',
    surface: "cockpit",
    raison: "Une liste de leviers de la feuille, un par ligne : du pilotage.",
  },
  {
    fichier: "app/arena/[gameId]/page.tsx",
    composant: "Tiroir",
    repere: 'titre="Composition des équipes"',
    surface: "cockpit",
    raison: "La liste des équipes de la classe.",
  },
  {
    fichier: "app/arena/[gameId]/page.tsx",
    composant: "Tiroir",
    repere: 'titre="Débriefing et décisions de ce tour"',
    surface: "cockpit",
    raison: "Un rangement : les débriefs qu'il contient sont déjà leurs propres feuilles.",
  },
  {
    fichier: "app/arena/[gameId]/page.tsx",
    composant: "Tiroir",
    repere: 'titre="Tours précédents et réussites"',
    surface: "cockpit",
    raison: "Un rangement de tours clos et de distinctions : du tableau de bord.",
  },
  // ── Les pages claires, hors de l'arène : l'aspect par défaut ──
  {
    fichier: "components/codes-de-reprise.tsx",
    composant: "Repliable",
    repere: 'resume="Codes de reprise des joueurs"',
    surface: "cockpit",
    raison: `Une liste de codes. ${PAGE_CLAIRE}`,
  },
  {
    fichier: "app/entreprises/page.tsx",
    composant: "Repliable",
    repere: 'resume="Voir le détail de l\'entreprise"',
    surface: "cockpit",
    raison: `De la prose, mais sur une carte blanche. ${PAGE_CLAIRE}`,
  },
  {
    fichier: "app/entreprises/episode/profil/page.tsx",
    composant: "Repliable",
    repere: "qui fondent cette ligne",
    surface: "cockpit",
    raison: `Un tableau d'observations. ${PAGE_CLAIRE}`,
  },
  ...["Comment lire ces chiffres"].map((t) => ({
    fichier: "app/teacher/games/[gameId]/observation/page.tsx",
    composant: "Tiroir" as const,
    repere: `titre="${t}"`,
    surface: "cockpit" as const,
    raison: `Une aide de l'espace enseignant. ${PAGE_CLAIRE}`,
  })),
  ...[
    "Composition des équipes",
    "Questions posées dans les situations",
    "Situations manquées",
    "Planning de la partie",
    "Planning des tours",
    "Nommer cette partie",
    "Ranger cette partie",
    "Recommencer cette partie",
    "Supprimer cette partie",
  ].map((t) => ({
    fichier: "app/teacher/games/[gameId]/page.tsx",
    composant: "Tiroir" as const,
    repere: `titre="${t}"`,
    surface: "cockpit" as const,
    raison: `Un outil de l'espace enseignant. ${PAGE_CLAIRE}`,
  })),
  ...["Parties rangées", "Organiser un concours · Business Arena Championship"].map((t) => ({
    fichier: "app/teacher/page.tsx",
    composant: "Tiroir" as const,
    repere: `titre="${t}"`,
    surface: "cockpit" as const,
    raison: `Un outil de l'espace enseignant. ${PAGE_CLAIRE}`,
  })),
];
