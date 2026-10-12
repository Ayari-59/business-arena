/**
 * L'ÉVALUATION ENTRE COÉQUIPIERS : CE QU'ON NOTE, SUR QUELLE ÉCHELLE, ET QUAND.
 *
 * La réponse à « j'ai tout fait et on a la même note ». Chaque étudiant note la
 * contribution de ses coéquipiers ; l'enseignant module la note d'équipe par un facteur
 * individuel (voir `calcul.ts`). C'est aussi une trace de la compétence « travail en
 * équipe » pour un dossier d'accréditation.
 *
 * Les critères sont écrits dans les mots de l'étudiant, pas dans ceux d'un référentiel :
 * il les lit sur son téléphone, en fin de séance, pour chacun de ses coéquipiers.
 */

/** Un critère : un code stable (il range les réponses), un intitulé, une aide d'une ligne. */
export interface CritereDesPairs {
  code: string;
  libelle: string;
  aide: string;
}

/** Les quatre critères proposés par défaut. L'enseignant en retire ou en ajoute. */
export const CRITERES_PAR_DEFAUT: readonly CritereDesPairs[] = [
  {
    code: "decisions",
    libelle: "Contribution aux décisions",
    aide: "Propose des idées et prend part aux choix de l'équipe.",
  },
  {
    code: "fiabilite",
    libelle: "Fiabilité et présence",
    aide: "Est là aux séances et tient ses engagements.",
  },
  {
    code: "ecoute",
    libelle: "Écoute et coopération",
    aide: "Écoute les autres et aide l'équipe à se mettre d'accord.",
  },
  {
    code: "analyses",
    libelle: "Qualité des analyses",
    aide: "Lit les chiffres avec soin et appuie ses avis sur des faits.",
  },
];

/** Au plus deux critères écrits par l'enseignant, en plus de ceux de la liste. */
export const CRITERES_LIBRES_MAX = 2;
/** La longueur d'un intitulé écrit par l'enseignant : une ligne, pas une phrase. */
export const LIBELLE_CRITERE_MAX = 60;
/** La longueur d'un commentaire libre : quelques phrases. */
export const COMMENTAIRE_MAX = 600;

/** L'échelle, de 1 à 5, et ce que chaque note veut dire. */
export const ECHELLE_DES_PAIRS = [
  { note: 1, libelle: "Très insuffisant" },
  { note: 2, libelle: "Insuffisant" },
  { note: 3, libelle: "Correct" },
  { note: 4, libelle: "Bien" },
  { note: 5, libelle: "Excellent" },
] as const;
export const NOTE_MIN = ECHELLE_DES_PAIRS[0].note;
export const NOTE_MAX = ECHELLE_DES_PAIRS[ECHELLE_DES_PAIRS.length - 1]!.note;

/** Quand on évalue : à mi-parcours, à la fin de la partie, ou les deux. */
export const MOMENTS_DES_PAIRS = ["mi_parcours", "fin"] as const;
export type MomentDesPairs = (typeof MOMENTS_DES_PAIRS)[number];

export const NOMS_DES_MOMENTS: Record<MomentDesPairs, string> = {
  mi_parcours: "À mi-parcours",
  fin: "À la fin de la partie",
};

export function estUnMoment(v: unknown): v is MomentDesPairs {
  return typeof v === "string" && (MOMENTS_DES_PAIRS as readonly string[]).includes(v);
}

/**
 * LE TOUR APRÈS LEQUEL S'OUVRE L'ÉVALUATION DE MI-PARCOURS : la moitié des tours, arrondie
 * au-dessus. En six tours, elle s'ouvre à la clôture du troisième ; en trois, du deuxième.
 */
export function tourDeMiParcours(tours: number): number {
  return Math.max(1, Math.ceil(tours / 2));
}

/** Le barème de la note d'équipe que l'enseignant saisit : sur 20 ou sur 100. */
export const BAREMES = [20, 100] as const;
export type Bareme = (typeof BAREMES)[number];

/**
 * D'OÙ VIENT L'IDENTITÉ D'UN ÉTUDIANT, dans le tableau de l'enseignant et l'export. Un
 * membre d'équipe est toujours un compte de la base (`users`) ; ce qui change est la façon
 * dont il est arrivé. Jamais d'adresse électronique.
 */
export const IDENTIFICATIONS_DES_MEMBRES = {
  compte: "Compte Business Arena",
  lti: "Plateforme de cours (LTI)",
  renater: "Établissement (RENATER)",
  saisie: "Nom saisi",
} as const;
export type IdentificationDuMembre = keyof typeof IDENTIFICATIONS_DES_MEMBRES;

/** Le code d'un critère écrit par l'enseignant : `libre-1`, `libre-2`. */
export const codeDuCritereLibre = (rang: number) => `libre-${rang}`;

/**
 * LES CRITÈRES RETENUS, à partir d'une saisie : les codes cochés parmi ceux par défaut
 * (dans leur ordre) puis les intitulés libres non vides. Au moins un critère : une
 * saisie vide rend la liste par défaut, jamais une évaluation sans question.
 */
export function criteresRetenus(args: { coches: readonly string[]; libres: readonly string[] }): CritereDesPairs[] {
  const choisis = CRITERES_PAR_DEFAUT.filter((c) => args.coches.includes(c.code)).map((c) => ({ ...c }));
  const libres = args.libres
    .map((l) => l.replace(/\s+/g, " ").trim().slice(0, LIBELLE_CRITERE_MAX))
    .filter((l) => l.length > 0)
    .slice(0, CRITERES_LIBRES_MAX)
    .map((libelle, i) => ({ code: codeDuCritereLibre(i + 1), libelle, aide: "" }));
  const tous = [...choisis, ...libres];
  return tous.length > 0 ? tous : CRITERES_PAR_DEFAUT.map((c) => ({ ...c }));
}
