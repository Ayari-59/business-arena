/**
 * LES BANDES D'UNE PAGE : ce que l'admin peut nommer, et mettre à contre-jour.
 *
 * CE QUI MANQUAIT. Le contre-jour existait en onze exemplaires, posés à la main
 * dans le code de sept pages. Pour qu'un administrateur choisisse lesquels
 * restent, il faut d'abord que chaque partie d'une page ait un NOM, et qu'on
 * puisse les lister dans l'ordre où elles se suivent.
 *
 * L'ORDRE EST LA DONNÉE. Deux bandes à contre-jour ne doivent pas se rencontrer
 * dans une même fenêtre, et un fichier de page ne sait pas à quelle hauteur ses
 * sections tombent. Ce que la plateforme sait vérifier à l'enregistrement, c'est
 * l'ORDRE : deux bandes à contre-jour ne se touchent jamais, il y en a toujours
 * une entre elles. La distance réelle, elle, se mesure dans un navigateur
 * (tests/e2e/contre-jour.e2e.ts), sur l'état par défaut.
 *
 * UNE PAGE EST LISTÉE EN ENTIER OU PAS DU TOUT. Une page dont seules certaines
 * bandes seraient nommées laisserait la règle de voisinage sans objet : on ne
 * saurait pas ce qui sépare deux bandes si l'une n'existe pas dans la liste.
 * Les pages d'article (guide, notions, parcours) n'exposent que leur bande
 * finale, parce que le reste est une colonne de lecture, pas une suite de
 * bandes ; elles n'ont donc qu'une bande, et la règle y est sans objet.
 */

export interface BandeDef {
  /** L'identifiant stable : « page.nom ». C'est lui que l'admin enregistre. */
  id: string;
  /** Le chemin de la page qui la porte. */
  page: string;
  /** Ce que l'admin lit : ce qu'est la bande, pas où elle est dans le code. */
  nom: string;
  /** Vrai si la bande est à contre-jour tant que personne n'a rien réglé. */
  contrasteParDefaut: boolean;
  /**
   * Vrai si le titre de la page (h1) est dans cette bande.
   *
   * Un bloc à contre-jour en tête de page n'est admis que s'il porte le titre :
   * sans cela, la première chose qu'on voit sous l'en-tête est une coupure qui
   * ne dit rien, et la page s'ouvre sur une bande au lieu d'un propos.
   */
  porteLeH1?: boolean;
}

export interface PageABandes {
  page: string;
  nom: string;
  /**
   * Vrai si seule une partie de la page est listée : sa bande finale.
   *
   * Les règles de voisinage et de tête de page supposent qu'on connaît ce qui
   * précède et ce qui suit chaque bande. Une page d'article liste sa seule
   * bande finale : elle n'est PAS la première de la page, et la prendre pour
   * telle ferait refuser l'état d'origine lui-même. Pour ces pages, seuls le
   * plafond et le « au moins une coupure » ont un sens.
   */
  partielle?: boolean;
}

export const PAGES_A_BANDES: readonly PageABandes[] = [
  { page: "/", nom: "Accueil" },
  { page: "/enseignants", nom: "Pour les enseignants" },
  { page: "/ecoles", nom: "Écoles de commerce et universités" },
  { page: "/entreprises", nom: "Entreprises" },
  { page: "/fonctionnalites", nom: "Fonctionnalités" },
  { page: "/guide", nom: "Guide", partielle: true },
  { page: "/notions", nom: "Notions", partielle: true },
  { page: "/parcours", nom: "Parcours", partielle: true },
];

export const BANDES: readonly BandeDef[] = [
  // ── Accueil ──
  {
    id: "accueil.hero",
    page: "/",
    nom: "Le titre et les deux boutons",
    // À contre-jour par défaut : l'habillage « L'arène » ouvre le site sur le
    // marine, comme la maquette, sous un en-tête marine lui aussi. Elle a été
    // claire du temps du papier ivoire, où un aplat de nuit en tête faisait
    // croire au thème sombre ; le marine est ici la couleur de la maison,
    // pas un mode. L'administrateur peut toujours la remettre au clair.
    contrasteParDefaut: true,
    porteLeH1: true,
  },
  {
    id: "accueil.partie",
    page: "/",
    nom: "Les chiffres d'une partie d'exemple",
    // Claire : c'est le bandeau blanc sur filet marine que la maquette pose
    // juste sous le héros. Elle touche le haut de page, marine : deux bandes
    // à contre-jour ne se touchent jamais.
    contrasteParDefaut: false,
  },
  {
    id: "accueil.episode",
    page: "/",
    nom: "Un épisode et le classement de la partie",
    contrasteParDefaut: false,
  },
  {
    id: "accueil.boucle",
    page: "/",
    nom: "La boucle d'un tour et ses trois écrans",
    // Claire : elle a longtemps suivi le haut de page, et deux bandes à
    // contre-jour ne se touchent jamais. Elle porte aujourd'hui les trois
    // captures, prises sur le papier.
    contrasteParDefaut: false,
  },
  {
    id: "accueil.metiers",
    page: "/",
    nom: "Les métiers",
    contrasteParDefaut: false,
  },
  {
    id: "accueil.roles",
    page: "/",
    nom: "Qui fait quoi",
    contrasteParDefaut: false,
  },
  {
    id: "accueil.chiffres",
    page: "/",
    nom: "Les chiffres",
    // Claire : c'est le bandeau de chiffres-clés de la maquette, blanc sur un
    // filet marine. Le marine est déjà en tête de page.
    contrasteParDefaut: false,
  },
  {
    id: "accueil.commencer",
    page: "/",
    nom: "Par où commencer",
    contrasteParDefaut: false,
  },
  // ── Pour les enseignants ──
  {
    id: "enseignants.accroche",
    page: "/enseignants",
    nom: "L'accroche",
    contrasteParDefaut: false,
    porteLeH1: true,
  },
  {
    id: "enseignants.chiffres",
    page: "/enseignants",
    nom: "Les chiffres d'usage",
    contrasteParDefaut: true,
  },
  {
    id: "enseignants.ecrans",
    page: "/enseignants",
    nom: "Trois écrans",
    contrasteParDefaut: false,
  },
  {
    id: "enseignants.pedagogie",
    page: "/enseignants",
    nom: "Pourquoi les élèves apprennent",
    contrasteParDefaut: false,
  },
  {
    id: "enseignants.ateliers",
    page: "/enseignants",
    nom: "Les ateliers clés en main",
    contrasteParDefaut: true,
  },
  {
    id: "enseignants.trois-temps",
    page: "/enseignants",
    nom: "Préparer, faire jouer, évaluer",
    contrasteParDefaut: false,
  },
  {
    id: "enseignants.finale",
    page: "/enseignants",
    nom: "L'appel final",
    contrasteParDefaut: true,
  },
  // ── Écoles de commerce et universités ──
  {
    id: "ecoles.accroche",
    page: "/ecoles",
    nom: "L'accroche",
    contrasteParDefaut: false,
    porteLeH1: true,
  },
  {
    id: "ecoles.chiffres",
    page: "/ecoles",
    nom: "Les chiffres",
    contrasteParDefaut: true,
  },
  {
    id: "ecoles.formats",
    page: "/ecoles",
    nom: "Deux formats, un même cursus",
    contrasteParDefaut: false,
  },
  {
    id: "ecoles.accreditation",
    page: "/ecoles",
    nom: "Ce qu'on montre à un jury d'accréditation",
    contrasteParDefaut: false,
  },
  {
    id: "ecoles.parcours",
    page: "/ecoles",
    nom: "Le parcours de huit semaines",
    contrasteParDefaut: true,
  },
  {
    id: "ecoles.questions",
    page: "/ecoles",
    nom: "Les questions qu'on nous pose",
    contrasteParDefaut: false,
  },
  {
    id: "ecoles.finale",
    page: "/ecoles",
    nom: "L'appel final",
    contrasteParDefaut: true,
  },
  // ── Entreprises ──
  {
    id: "entreprises.accroche",
    page: "/entreprises",
    nom: "L'accroche",
    contrasteParDefaut: false,
    porteLeH1: true,
  },
  {
    id: "entreprises.differences",
    page: "/entreprises",
    nom: "Ce qui change d'un métier à l'autre",
    contrasteParDefaut: true,
  },
  {
    id: "entreprises.fiches",
    page: "/entreprises",
    nom: "Les fiches des métiers",
    contrasteParDefaut: false,
  },
  {
    id: "entreprises.finale",
    page: "/entreprises",
    nom: "L'appel final",
    contrasteParDefaut: true,
  },
  // ── Fonctionnalités ──
  {
    id: "fonctionnalites.accroche",
    page: "/fonctionnalites",
    nom: "L'accroche",
    contrasteParDefaut: false,
    porteLeH1: true,
  },
  {
    id: "fonctionnalites.intro",
    page: "/fonctionnalites",
    nom: "L'introduction",
    contrasteParDefaut: false,
  },
  {
    id: "fonctionnalites.chiffres",
    page: "/fonctionnalites",
    nom: "Les chiffres",
    contrasteParDefaut: true,
  },
  {
    id: "fonctionnalites.secteurs",
    page: "/fonctionnalites",
    nom: "Les secteurs",
    contrasteParDefaut: false,
  },
  {
    id: "fonctionnalites.moteur",
    page: "/fonctionnalites",
    nom: "Ce qui rend la simulation possible",
    contrasteParDefaut: true,
  },
  {
    id: "fonctionnalites.modeles",
    page: "/fonctionnalites",
    nom: "Les modèles d'analyse",
    contrasteParDefaut: false,
  },
  {
    id: "fonctionnalites.finale",
    page: "/fonctionnalites",
    nom: "L'appel final",
    contrasteParDefaut: true,
  },
  // ── Pages d'article : leur seule bande est la finale ──
  {
    id: "guide.finale",
    page: "/guide",
    nom: "L'appel final",
    contrasteParDefaut: true,
  },
  {
    id: "notions.finale",
    page: "/notions",
    nom: "L'appel final",
    contrasteParDefaut: true,
  },
  {
    id: "parcours.finale",
    page: "/parcours",
    nom: "L'appel final",
    contrasteParDefaut: true,
  },
];

const PAR_ID = new Map(BANDES.map((b) => [b.id, b]));

export function bandeParId(id: string): BandeDef | undefined {
  return PAR_ID.get(id);
}

/** Les bandes d'une page, dans l'ordre où elles se suivent. */
export function bandesDeLaPage(page: string): BandeDef[] {
  return BANDES.filter((b) => b.page === page);
}
