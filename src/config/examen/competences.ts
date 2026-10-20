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
 * Ce que la grille rattache à chaque compétence est écrit dans config/examen/grille.ts, et
 * depuis la version 3 des grilles, leurs seuils de niveau aussi ; leur forme, et leur
 * lecture, ici.
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

/** Trois seuils, en part des points rattachés (0 à 1) : en cours dès, acquis dès, maîtrisé dès. */
export interface Seuils {
  enCours: number;
  acquis: number;
  maitrise: number;
}

/**
 * LES SEUILS FIXES, ÉCRITS : la part des points obtenus sur les lignes de la grille
 * rattachées à la compétence (pondérées par leur rattachement).
 *
 *   · moins de 40 % : non acquis ;
 *   · de 40 à moins de 60 % : en cours d'acquisition ;
 *   · de 60 à moins de 80 % : acquis ;
 *   · 80 % et plus : maîtrisé.
 *
 * Le SEUIL D'ATTEINTE de l'objectif (ce qu'un rapport AoL compte) est « acquis ».
 *
 * Ce que la gestion neutre du secteur (l'étalon de la grille) obtient sur une ligne dépend
 * de la ligne. Sur « battre », jouer comme elle vaut zéro : une égalité ne bat rien. Sur
 * l'écart moyen, jouer comme elle vaut exactement la moitié des points. Les lignes
 * financières et le rang ne se mesurent pas contre elle : elle les remplit comme n'importe
 * quel candidat, et y obtient de presque rien à presque tout selon le secteur. Ces seuils fixes
 * ne disent donc « mieux que la gestion neutre » que pour la décision et les opérations ;
 * c'est pourquoi la stratégie et le marketing se lisent, depuis la version 3 des grilles,
 * par rapport à la part de la gestion neutre (`SeuilsDeLaGrille`).
 */
export const SEUILS_DE_NIVEAU: Seuils = { enCours: 0.4, acquis: 0.6, maitrise: 0.8 };

/**
 * LES SEUILS D'UNE GRILLE, qu'elle porte depuis sa version 3 (config/examen/grille.ts) :
 *
 *   · `fixes` : les seuils des compétences que `relatifs` ne nomme pas ;
 *   · `relatifs` : les compétences dont les seuils se comptent à partir de la part que
 *     l'étalon de la grille obtient SUR LES MÊMES MARCHÉS, et les écarts à cette part
 *     (bornés de 0 à 1). Une copie qui joue exactement comme l'étalon a sa part : elle est
 *     « en cours », jamais « acquise ».
 */
export interface SeuilsDeLaGrille {
  fixes: Seuils;
  relatifs: { competences: readonly CodeDeCompetence[]; ecarts: Seuils } | null;
}

/**
 * Les seuils des grilles d'avant la version 3, qui ne les écrivaient pas : fixes pour
 * toutes les compétences. Une copie de grille gardée sans le champ se lit avec eux, et les
 * copies qu'elle notera encore aussi.
 */
export const SEUILS_D_AVANT_LA_VERSION_3: SeuilsDeLaGrille = { fixes: SEUILS_DE_NIVEAU, relatifs: null };

/** La compétence se lit-elle par rapport à l'étalon dans ces seuils ? */
export const estRelative = (s: SeuilsDeLaGrille, code: CodeDeCompetence): boolean =>
  s.relatifs?.competences.includes(code) ?? false;

const borne01 = (x: number) => Math.min(1, Math.max(0, x));

/**
 * Les seuils d'une compétence : les fixes, ou, pour une compétence relative, la part de
 * l'étalon sur les mêmes marchés plus les écarts, bornés de 0 à 1.
 */
export function seuilsDeLaCompetence(s: SeuilsDeLaGrille, code: CodeDeCompetence, partDeLaReference: number | null): Seuils {
  if (!s.relatifs || !estRelative(s, code)) return s.fixes;
  if (partDeLaReference === null || !Number.isFinite(partDeLaReference)) {
    throw new Error(`La compétence ${code} se lit par rapport à l'étalon : sa part est requise.`);
  }
  const e = s.relatifs.ecarts;
  return {
    enCours: borne01(partDeLaReference + e.enCours),
    acquis: borne01(partDeLaReference + e.acquis),
    maitrise: borne01(partDeLaReference + e.maitrise),
  };
}

export const NIVEAUX_DE_COMPETENCE: readonly { code: NiveauDeCompetence; nom: string }[] = [
  { code: "non-acquis", nom: "Non acquis" },
  { code: "en-cours", nom: "En cours" },
  { code: "acquis", nom: "Acquis" },
  { code: "maitrise", nom: "Maîtrisé" },
];

/** Le niveau qu'un objectif doit atteindre pour être compté comme atteint. */
export const NIVEAU_D_ATTEINTE: NiveauDeCompetence = "acquis";

/** Une part tout juste sous un seuil n'est pas arrondie au-dessus : l'arrondi se fait à 1e-9. */
export function niveauDeCompetence(part: number, seuils: Seuils): NiveauDeCompetence {
  const p = Number.isFinite(part) ? part : 0;
  if (p >= seuils.maitrise - 1e-9) return "maitrise";
  if (p >= seuils.acquis - 1e-9) return "acquis";
  if (p >= seuils.enCours - 1e-9) return "en-cours";
  return "non-acquis";
}

export const nomDuNiveau = (n: NiveauDeCompetence): string =>
  NIVEAUX_DE_COMPETENCE.find((x) => x.code === n)!.nom;

/** L'objectif est-il atteint à ce niveau ? */
export const atteint = (n: NiveauDeCompetence): boolean => n === "acquis" || n === "maitrise";

/* ---------------------------------------------------------------------------
 * LES SEUILS, DITS. Tout se lit des seuils qu'on passe (ceux de la grille de l'examen),
 * jamais des constantes : un examen garde les phrases de la grille qui l'a noté.
 * ------------------------------------------------------------------------- */

/** « 60 % ». */
export const pourcentDuSeuil = (x: number): string => `${Math.round(x * 100)} %`;

/** « non acquis sous 40 %, en cours dès 40 %, acquis dès 60 %, maîtrisé dès 80 % ». */
export function niveauxDits(s: Seuils): string {
  const depuis: Record<NiveauDeCompetence, number> = { "non-acquis": 0, "en-cours": s.enCours, acquis: s.acquis, maitrise: s.maitrise };
  return NIVEAUX_DE_COMPETENCE.map(
    (n, i) => `${n.nom.toLowerCase()} ${i === 0 ? `sous ${pourcentDuSeuil(s.enCours)}` : `dès ${pourcentDuSeuil(depuis[n.code])}`}`,
  ).join(", ");
}

/** « plus 10 points », « moins 10 points ». */
const ecartDit = (x: number) => {
  const n = Math.round(Math.abs(x) * 100);
  return `${x < 0 ? "moins" : "plus"} ${n} point${n > 1 ? "s" : ""}`;
};

/** « en stratégie et en marketing et prix ». */
const competencesDites = (codes: readonly CodeDeCompetence[]) => {
  const noms = codes.map((c) => `en ${(competenceParCode(c)?.nom ?? c).toLowerCase()}`);
  return noms.length <= 1 ? (noms[0] ?? "") : `${noms.slice(0, -1).join(", ")} et ${noms[noms.length - 1]}`;
};

const majuscule = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);

/**
 * Le seuil d'atteinte des compétences relatives, en une phrase ; null : la grille n'en a
 * pas. « En stratégie et en marketing et prix, le seuil se compte à partir de la part que la
 * gestion neutre du secteur obtient sur les mêmes marchés, plus 10 points. »
 */
export function seuilDAtteinteRelatifDit(s: SeuilsDeLaGrille, nomDeLaReference: string): string | null {
  if (!s.relatifs || s.relatifs.competences.length === 0) return null;
  return `${majuscule(competencesDites(s.relatifs.competences))}, le seuil se compte à partir de la part que ${nomDeLaReference} obtient sur les mêmes marchés, ${ecartDit(s.relatifs.ecarts.acquis)}.`;
}

/**
 * Les niveaux des compétences relatives, en une phrase (la méthode du rapport
 * d'accréditation) ; null : la grille n'en a pas.
 */
export function niveauxRelatifsDits(s: SeuilsDeLaGrille, nomDeLaReference: string): string | null {
  if (!s.relatifs || s.relatifs.competences.length === 0) return null;
  const e = s.relatifs.ecarts;
  const niveau = (n: NiveauDeCompetence, x: number) => `${nomDuNiveau(n).toLowerCase()} ${ecartDit(x)}`;
  // Court : la phrase tient dans la méthode d'un rapport d'accréditation imprimé sur UNE page.
  return `${majuscule(competencesDites(s.relatifs.competences))}, les seuils partent de la part de ${nomDeLaReference} sur les mêmes marchés : ${niveau("en-cours", e.enCours)}, ${niveau("acquis", e.acquis)}, ${niveau("maitrise", e.maitrise)}.`;
}

/**
 * Le seuil d'atteinte, entre parenthèses dans la méthode : « 60 % » ; pour une grille à
 * compétences relatives, « 60 %, ou plus 10 points là où le seuil est relatif » (la phrase
 * qui précède dit à partir de quoi).
 */
export function seuilDAtteinteDit(s: SeuilsDeLaGrille): string {
  const fixe = pourcentDuSeuil(s.fixes.acquis);
  if (!s.relatifs || s.relatifs.competences.length === 0) return fixe;
  return `${fixe}, ou ${ecartDit(s.relatifs.ecarts.acquis)} là où le seuil est relatif`;
}
