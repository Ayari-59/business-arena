import type { SkillAxis } from "@/config/pedagogy/concepts";

/**
 * LE RÉFÉRENTIEL DE L'EXAMEN INDIVIDUEL : SEPT COMPÉTENCES, DANS LA FORME D'UN AoL.
 *
 * Une démarche d'assurance des apprentissages (Assurance of Learning, la forme que
 * demandent les dossiers AACSB et EQUIS) énonce des objectifs, les mesure par une épreuve
 * directe, fixe un seuil et rend compte de la part des étudiants qui l'atteignent. Ce
 * référentiel en est la première pièce : des objectifs courts, écrits pour être cités tels
 * quels dans un rapport (« L'étudiant… »).
 *
 * Chaque compétence est rattachée à un AXE du profil de l'arène (`pedagogy/progress.ts`,
 * `AXES`) : l'examen ne fonde pas un vocabulaire de plus, il mesure dans une épreuve notée
 * ce que la partie de classe suit déjà. Le diagnostic n'existe que si l'examen pose les
 * questions des situations.
 *
 * Ce que la grille rattache à chaque compétence est écrit dans config/examen/grille.ts ;
 * les seuils de niveau, ici.
 */

export type CodeDeCompetence =
  | "analyse-financiere"
  | "decision-incertitude"
  | "marketing-prix"
  | "operations"
  | "tresorerie"
  | "strategie"
  | "diagnostic";

export interface CompetenceDExamen {
  code: CodeDeCompetence;
  nom: string;
  /** L'objectif d'apprentissage, tel qu'un rapport d'accréditation le cite. */
  objectif: string;
  /** L'axe du profil de l'arène auquel la compétence se rattache. */
  axe: SkillAxis;
  /** Évaluée seulement si l'examen pose les questions de diagnostic. */
  siQuestions?: true;
}

export const COMPETENCES_D_EXAMEN: readonly CompetenceDExamen[] = [
  {
    code: "analyse-financiere",
    nom: "Analyse financière",
    objectif: "L'étudiant lit les comptes de son entreprise et conduit une gestion rentable.",
    axe: "analysis",
  },
  {
    code: "decision-incertitude",
    nom: "Décision sous incertitude",
    objectif: "L'étudiant prend des décisions qui tiennent quel que soit l'état du marché.",
    axe: "decision",
  },
  {
    code: "marketing-prix",
    nom: "Marketing et prix",
    objectif: "L'étudiant fixe un prix et un effort commercial qui le placent face à ses concurrents.",
    axe: "marketing",
  },
  {
    code: "operations",
    nom: "Gestion des opérations",
    objectif: "L'étudiant ajuste sa production à la demande qu'il sert, sans stock ni rupture coûteux.",
    axe: "production",
  },
  {
    code: "tresorerie",
    nom: "Pilotage de la trésorerie",
    objectif: "L'étudiant garde son entreprise solvable et finance ses décisions sans défaillance.",
    axe: "finance",
  },
  {
    code: "strategie",
    nom: "Stratégie",
    objectif: "L'étudiant tient une ligne cohérente d'un tour à l'autre et la fait valoir face à la concurrence.",
    axe: "strategy",
  },
  {
    code: "diagnostic",
    nom: "Diagnostic",
    objectif: "L'étudiant identifie ce qui se joue dans une situation de gestion avant d'agir.",
    axe: "analysis",
    siQuestions: true,
  },
];

export const competenceParCode = (code: string): CompetenceDExamen | undefined =>
  COMPETENCES_D_EXAMEN.find((c) => c.code === code);

/** Les compétences évaluées par un examen : le diagnostic seulement avec les questions. */
export const competencesEvaluees = (questions: boolean): readonly CompetenceDExamen[] =>
  COMPETENCES_D_EXAMEN.filter((c) => !c.siQuestions || questions);

/* ---------------------------------------------------------------------------
 * LES NIVEAUX ET LEURS SEUILS.
 * ------------------------------------------------------------------------- */

export type NiveauDeCompetence = "non-acquis" | "en-cours" | "acquis" | "maitrise";

/**
 * LES SEUILS, ÉCRITS : la part des points obtenus sur les lignes de la grille rattachées à
 * la compétence (pondérées par leur rattachement).
 *
 *   · moins de 40 % : non acquis ;
 *   · de 40 à moins de 60 % : en cours d'acquisition ;
 *   · de 60 à moins de 80 % : acquis ;
 *   · 80 % et plus : maîtrisé.
 *
 * Le SEUIL D'ATTEINTE de l'objectif (ce qu'un rapport AoL compte) est « acquis » : 60 %.
 * Une ligne à moitié tenue (50 %) correspond à une gestion qui fait jeu égal avec la
 * gestion neutre du secteur (l'étalon de la grille) ; « acquis » demande de faire mieux qu'elle.
 */
export const SEUILS_DE_NIVEAU = { enCours: 0.4, acquis: 0.6, maitrise: 0.8 } as const;

export const NIVEAUX_DE_COMPETENCE: readonly { code: NiveauDeCompetence; nom: string; depuis: number }[] = [
  { code: "non-acquis", nom: "Non acquis", depuis: 0 },
  { code: "en-cours", nom: "En cours", depuis: SEUILS_DE_NIVEAU.enCours },
  { code: "acquis", nom: "Acquis", depuis: SEUILS_DE_NIVEAU.acquis },
  { code: "maitrise", nom: "Maîtrisé", depuis: SEUILS_DE_NIVEAU.maitrise },
];

/** Le niveau qu'un objectif doit atteindre pour être compté comme atteint. */
export const NIVEAU_D_ATTEINTE: NiveauDeCompetence = "acquis";

/** Une part tout juste sous un seuil n'est pas arrondie au-dessus : l'arrondi se fait à 1e-9. */
export function niveauDeCompetence(part: number): NiveauDeCompetence {
  const p = Number.isFinite(part) ? part : 0;
  if (p >= SEUILS_DE_NIVEAU.maitrise - 1e-9) return "maitrise";
  if (p >= SEUILS_DE_NIVEAU.acquis - 1e-9) return "acquis";
  if (p >= SEUILS_DE_NIVEAU.enCours - 1e-9) return "en-cours";
  return "non-acquis";
}

export const nomDuNiveau = (n: NiveauDeCompetence): string =>
  NIVEAUX_DE_COMPETENCE.find((x) => x.code === n)!.nom;

/** L'objectif est-il atteint à ce niveau ? */
export const atteint = (n: NiveauDeCompetence): boolean => n === "acquis" || n === "maitrise";

/** « 60 % » : le seuil d'atteinte, dit en pourcentage. */
export const SEUIL_D_ATTEINTE_EN_POURCENT = `${Math.round(SEUILS_DE_NIVEAU.acquis * 100)} %`;
