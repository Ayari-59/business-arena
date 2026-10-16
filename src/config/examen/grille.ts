import {
  competenceParCode,
  competencesEvaluees,
  niveauDeCompetence,
  type CodeDeCompetence,
  type NiveauDeCompetence,
} from "./competences";

/**
 * LA GRILLE DE NOTATION DE L'EXAMEN INDIVIDUEL : FIXE, PUBLIÉE, VERSIONNÉE.
 *
 * Une note d'examen qui sert à l'accréditation doit être la même pour tous, connue avant
 * l'épreuve, et décomposable ligne par ligne. D'où trois règles :
 *
 *  1. LA GRILLE EST NOMMÉE ET VERSIONNÉE. Une grille ne se modifie pas : une pondération
 *     différente est une AUTRE grille (un autre code) ou une version suivante. L'examen en
 *     garde une COPIE à sa création (`examens.grille`) : rien de ce qui change ici ensuite
 *     ne touche un examen ouvert.
 *  2. LA NOTE JUGE LES DÉCISIONS, PAS LE TIRAGE. Toutes les lignes, sauf le diagnostic, se
 *     mesurent sur les trente marchés possibles où les décisions du candidat sont rejouées
 *     telles quelles, à côté de L'ÉTALON QUE LA GRILLE NOMME rejoué sur les mêmes (le rejeu
 *     de « mérite ou chance », `rejeuPourLExamen` de services/merite.service.ts). Le marché
 *     que le candidat a joué n'y pèse pas plus qu'un autre : deux candidats aux mêmes
 *     décisions ont la même note, quelle que soit la graine de leur partie.
 *     L'ÉTALON FAIT PARTIE DE LA GRILLE (`reference`) : les grilles publiées notent contre
 *     la gestion neutre du secteur. IL EST GELÉ COMME LE CANDIDAT : il décide sur le
 *     marché joué, puis ses décisions sont rejouées telles quelles sous les trente,
 *     faute de quoi il se réadapterait là où le candidat ne le peut pas. Le bilan des
 *     parties juge, lui, contre « un bon gestionnaire » ; si l'examen devait en changer,
 *     ce serait une nouvelle version de grille, et la notation figée de chaque copie dit
 *     contre quoi elle a été notée.
 *  3. CHAQUE LIGNE EST BORNÉE DE 0 À SON MAXIMUM, et la note de 0 à 100. Une ligne qui ne
 *     s'applique pas (les questions éteintes, aucune situation rencontrée) sort du calcul,
 *     et les points des autres sont rapportés à 100 dans la même proportion.
 *
 * Pur : ni base, ni moteur. Les mesures entrent, la copie notée sort.
 */

export type CodeDeLigne =
  | "battre-la-reference"
  | "ecart-a-la-reference"
  | "solvabilite"
  | "tresorerie-positive"
  | "rentabilite"
  | "rang"
  | "diagnostics";

export interface LigneDeGrille {
  code: CodeDeLigne;
  libelle: string;
  /** Comment la ligne se mesure, en une phrase (le rapport d'accréditation la cite). */
  methode: string;
  points: number;
  /** Les compétences que la ligne nourrit, et dans quelle part (la somme fait 1). */
  competences: readonly { code: CodeDeCompetence; part: number }[];
  /** La ligne ne compte que si l'examen pose les questions de diagnostic. */
  siQuestions?: true;
}

/**
 * L'ÉTALON D'UNE GRILLE : contre qui les décisions du candidat sont rejouées. Son code est
 * celui que le service de rejeu connaît (`Etalon`, pedagogy/merite/etalons.ts) ; son nom et
 * sa définition s'impriment dans la grille, le relevé et le rapport d'accréditation.
 */
export interface ReferenceDeLaGrille {
  code: "gestion-neutre" | "gestion-neutre-gelee" | "bon-gestionnaire";
  nom: string;
  /** Ce qu'elle fait, en une phrase. */
  definition: string;
}

/**
 * La gestion neutre du secteur, TELLE QUE LES GRILLES VERSION 1 LA REJOUAIENT : elle
 * redécidait tour par tour sous chacun des trente marchés, quand le candidat, lui, y était
 * rejoué avec les décisions prises sur le seul marché qu'il avait joué. Mesurée, cette
 * asymétrie portait l'essentiel de l'écart de note entre secteurs et presque tout le bruit
 * entre deux graines d'une même cellule. Aucune grille publiée ne la nomme plus ; elle
 * reste ici parce qu'une copie notée sous une grille version 1 se renote contre l'étalon de
 * sa version (règle 1).
 */
export const REFERENCE_GESTION_NEUTRE: ReferenceDeLaGrille = {
  code: "gestion-neutre",
  nom: "la gestion neutre du secteur",
  definition:
    "La gestion neutre du secteur part de la gestion que le formulaire propose et la tient à chaque tour : le prix du marché, un volume qui suit les ventes, un marketing et une qualité au niveau du marché, rien de ce que le niveau n'ouvre pas. Elle ne réagit à personne.",
};

/**
 * LA GESTION NEUTRE DU SECTEUR, GELÉE COMME LE CANDIDAT : l'étalon des grilles publiées
 * depuis leur version 2. La même gestion, et la même façon d'être jugée que le candidat :
 * elle décide sur le marché joué, puis ses décisions sont rejouées telles quelles sous les
 * trente marchés possibles. Les deux sont alors jugés à armes égales, et la note ne mesure
 * plus que les décisions.
 */
export const REFERENCE_GESTION_NEUTRE_GELEE: ReferenceDeLaGrille = {
  code: "gestion-neutre-gelee",
  nom: "la gestion neutre du secteur",
  definition:
    "La gestion neutre du secteur part de la gestion que le formulaire propose et la tient à chaque tour : le prix du marché, un volume qui suit les ventes, un marketing et une qualité au niveau du marché, rien de ce que le niveau n'ouvre pas. Elle ne réagit à personne. Comme le candidat, elle décide sur le marché joué, et ses décisions sont rejouées telles quelles sur les marchés possibles.",
};

export interface GrilleDeNotation {
  code: string;
  nom: string;
  version: number;
  /** L'étalon : en changer impose une nouvelle version de la grille. */
  reference: ReferenceDeLaGrille;
  /** La date de publication de cette version (AAAA-MM-JJ). */
  publiee: string;
  /** Ce que la grille privilégie, en une phrase (le choix de l'enseignant). */
  propos: string;
  lignes: readonly LigneDeGrille[];
  /**
   * La justification des poids, famille par famille. Les points ne s'écrivent pas dans la
   * phrase : ils se lisent des lignes (`justificationDe`), pour qu'une pondération changée
   * ne laisse pas une justification fausse derrière elle.
   */
  justification: readonly { famille: string; lignes: readonly CodeDeLigne[]; pourquoi: string }[];
}

/* ---------------------------------------------------------------------------
 * LES LIGNES : LEUR MÉTHODE ET LEURS COMPÉTENCES (communes aux grilles).
 * ------------------------------------------------------------------------- */

/** Au-delà de deux écarts-types de l'étalon, l'écart moyen vaut tous ses points (ou aucun). */
export const ECARTS_TYPES_A_SATURATION = 2;

const LIGNES: Record<CodeDeLigne, Omit<LigneDeGrille, "points">> = {
  "battre-la-reference": {
    code: "battre-la-reference",
    libelle: "Décisions qui battent la gestion neutre du secteur",
    methode:
      "La part des {marches} marchés possibles où le résultat net cumulé des décisions du candidat dépasse celui de la gestion neutre du secteur.",
    competences: [{ code: "decision-incertitude", part: 1 }],
  },
  "ecart-a-la-reference": {
    code: "ecart-a-la-reference",
    libelle: "Écart moyen à la gestion neutre du secteur",
    methode: `L'écart moyen de résultat net cumulé avec la gestion neutre du secteur, en écarts-types de celle-ci sur les {marches} marchés : zéro vaut la moitié des points, ${ECARTS_TYPES_A_SATURATION} écarts-types au-dessus les valent tous, ${ECARTS_TYPES_A_SATURATION} en dessous aucun.`,
    competences: [
      { code: "strategie", part: 0.4 },
      { code: "marketing-prix", part: 0.3 },
      { code: "operations", part: 0.3 },
    ],
  },
  solvabilite: {
    code: "solvabilite",
    libelle: "Solvabilité : aucune défaillance",
    methode: "La part des {marches} marchés où l'entreprise du candidat ne tombe jamais en cessation de paiements.",
    competences: [{ code: "tresorerie", part: 1 }],
  },
  "tresorerie-positive": {
    code: "tresorerie-positive",
    libelle: "Trésorerie nette positive en fin de partie",
    methode: "La part des {marches} marchés où la trésorerie nette du dernier tour est positive ou nulle.",
    competences: [
      { code: "tresorerie", part: 0.5 },
      { code: "analyse-financiere", part: 0.5 },
    ],
  },
  rentabilite: {
    code: "rentabilite",
    libelle: "Rentabilité : résultat cumulé positif",
    methode: "La part des {marches} marchés où le résultat net cumulé de la partie est positif.",
    competences: [{ code: "analyse-financiere", part: 1 }],
  },
  rang: {
    code: "rang",
    libelle: "Performance relative : rang face aux concurrents",
    methode:
      "Le rang au classement de la partie (IPG) sur les {marches} marchés, ramené de 0 (toujours dernier) à 1 (toujours premier), en moyenne.",
    competences: [
      { code: "strategie", part: 0.5 },
      { code: "marketing-prix", part: 0.5 },
    ],
  },
  diagnostics: {
    code: "diagnostics",
    libelle: "Diagnostics et questions des situations",
    methode:
      "La moyenne des scores obtenus aux situations rencontrées (diagnostic et questions) ; une situation laissée sans réponse compte zéro.",
    competences: [{ code: "diagnostic", part: 1 }],
    siQuestions: true,
  },
};

const ligne = (code: CodeDeLigne, points: number): LigneDeGrille => ({ ...LIGNES[code], points });

/**
 * La méthode d'une ligne, le nombre de marchés rempli : il se lit du rejeu (`n` du
 * verdict), il ne s'écrit pas dans la phrase.
 */
export const methodeDe = (l: Pick<LigneDeGrille, "methode">, marches: number): string =>
  l.methode.replace(/\{marches\}/g, String(marches));

/* ---------------------------------------------------------------------------
 * LES GRILLES NOMMÉES.
 * ------------------------------------------------------------------------- */

/**
 * « BUSINESS ARENA 2026 », LA GRILLE PAR DÉFAUT.
 *
 *   · qualité des décisions, 40 points (25 + 15) : c'est ce qu'un examen de simulation
 *     mesure et qu'aucune autre épreuve ne mesure ; la régularité (battre la gestion neutre)
 *     compte plus que l'ampleur (l'écart moyen), pour qu'un coup heureux ne fasse pas une
 *     note ;
 *   · tenue financière, 35 points (15 + 10 + 10) : ce qu'un jury attend d'un futur
 *     manager, ne jamais mettre l'entreprise en défaut (le plus lourd), finir avec de la
 *     trésorerie, gagner de l'argent ;
 *   · performance relative, 15 points : le rang face aux concurrents compte, mais moins,
 *     parce que leur tempérament change d'un marché à l'autre ;
 *   · diagnostics, 10 points, si l'examen pose les questions : la compréhension de la
 *     situation, mesurée à côté de la décision, sans la remplacer.
 *
 * VERSION 2 : les points ne bougent pas, l'étalon oui. Il est désormais gelé comme le
 * candidat (`REFERENCE_GESTION_NEUTRE_GELEE`) ; en version 1 il redécidait sous chacun des
 * trente marchés. Les notes baissent d'une dizaine de points en moyenne, et surtout elles
 * cessent de dépendre de la graine tirée : les barèmes de passage se relisent une fois.
 */
export const GRILLE_BUSINESS_ARENA_2026: GrilleDeNotation = {
  code: "business-arena-2026",
  nom: "Business Arena 2026",
  version: 2,
  publiee: "2026-10-16",
  reference: REFERENCE_GESTION_NEUTRE_GELEE,
  propos: "La grille par défaut : la qualité des décisions d'abord, la tenue financière ensuite.",
  lignes: [
    ligne("battre-la-reference", 25),
    ligne("ecart-a-la-reference", 15),
    ligne("solvabilite", 15),
    ligne("tresorerie-positive", 10),
    ligne("rentabilite", 10),
    ligne("rang", 15),
    ligne("diagnostics", 10),
  ],
  justification: [
    {
      famille: "Qualité des décisions",
      lignes: ["battre-la-reference", "ecart-a-la-reference"],
      pourquoi:
        "c'est ce que la simulation mesure et qu'aucune autre épreuve ne mesure. La régularité (battre la gestion neutre du secteur) compte plus que l'ampleur (l'écart moyen), pour qu'un coup heureux ne fasse pas une note.",
    },
    {
      famille: "Tenue financière",
      lignes: ["solvabilite", "tresorerie-positive", "rentabilite"],
      pourquoi:
        "ne jamais mettre l'entreprise en défaut pèse le plus, puis finir avec de la trésorerie et gagner de l'argent. C'est ce qu'un jury attend d'un futur manager.",
    },
    {
      famille: "Performance relative",
      lignes: ["rang"],
      pourquoi: "le rang face aux concurrents compte, mais moins, parce que leur tempérament change d'un marché à l'autre.",
    },
    {
      famille: "Diagnostics",
      lignes: ["diagnostics"],
      pourquoi:
        "si les questions sont posées, la compréhension de la situation, mesurée à côté de la décision sans la remplacer. Éteintes, leurs points se répartissent sur les autres lignes en proportion.",
    },
  ],
};

/**
 * « DÉCISION D'ABORD » : pour un programme qui veut mesurer d'abord le jugement, la
 * qualité des décisions pèse plus de la moitié de la note, la tenue financière moins.
 */
export const GRILLE_DECISION_D_ABORD: GrilleDeNotation = {
  code: "decision-d-abord",
  nom: "Décision d'abord",
  version: 2,
  publiee: "2026-10-16",
  reference: REFERENCE_GESTION_NEUTRE_GELEE,
  propos: "Pour mesurer d'abord le jugement : la qualité des décisions pèse plus de la moitié de la note.",
  lignes: [
    ligne("battre-la-reference", 35),
    ligne("ecart-a-la-reference", 20),
    ligne("solvabilite", 10),
    ligne("tresorerie-positive", 5),
    ligne("rentabilite", 10),
    ligne("rang", 10),
    ligne("diagnostics", 10),
  ],
  justification: [
    {
      famille: "Qualité des décisions",
      lignes: ["battre-la-reference", "ecart-a-la-reference"],
      pourquoi: "battre la gestion neutre du secteur et l'écart moyen font plus de la moitié de la note.",
    },
    {
      famille: "Tenue financière",
      lignes: ["solvabilite", "tresorerie-positive", "rentabilite"],
      pourquoi: "la solvabilité, la trésorerie finale et la rentabilité restent exigées, avec moins de poids.",
    },
    {
      famille: "Performance relative et diagnostics",
      lignes: ["rang", "diagnostics"],
      pourquoi: "le rang face aux concurrents, et les situations si les questions sont posées.",
    },
  ],
};

/** « Qualité des décisions (40 points : 25 + 15) : … », lu des lignes. */
export function justificationDe(g: GrilleDeNotation): string[] {
  return g.justification.map((j) => {
    const pts = j.lignes.map((c) => g.lignes.find((l) => l.code === c)?.points ?? 0);
    const total = pts.reduce((a, b) => a + b, 0);
    const detail = pts.length > 1 ? ` : ${pts.join(" + ")}` : "";
    return `${j.famille} (${total} points${detail}) : ${j.pourquoi}`;
  });
}

export const GRILLES: readonly GrilleDeNotation[] = [GRILLE_BUSINESS_ARENA_2026, GRILLE_DECISION_D_ABORD];
export const GRILLE_PAR_DEFAUT = GRILLE_BUSINESS_ARENA_2026.code;

export const grilleParCode = (code: string | null | undefined): GrilleDeNotation | null =>
  GRILLES.find((g) => g.code === code) ?? null;

/**
 * L'étalon d'une grille figée. Une copie gardée avant que la grille ne l'écrive n'a pas le
 * champ : elle a été publiée, et notée, contre la gestion neutre du secteur.
 */
export const referenceDeLaGrille = (g: Omit<GrilleDeNotation, "reference"> & { reference?: ReferenceDeLaGrille }): ReferenceDeLaGrille =>
  g.reference ?? REFERENCE_GESTION_NEUTRE;

/** Une grille est bien formée : ses points font 100, chaque ligne rattache des compétences qui somment à 1. */
export function erreursDeLaGrille(g: GrilleDeNotation): string[] {
  const e: string[] = [];
  const total = g.lignes.reduce((s, l) => s + l.points, 0);
  if (Math.abs(total - 100) > 1e-9) e.push(`${g.code} : ses lignes font ${total} points, pas 100.`);
  for (const l of g.lignes) {
    if (!(l.points > 0)) e.push(`${g.code} : la ligne ${l.code} n'a pas de points.`);
    const s = l.competences.reduce((x, c) => x + c.part, 0);
    if (Math.abs(s - 1) > 1e-9) e.push(`${g.code} : la ligne ${l.code} rattache ${s} de compétence, pas 1.`);
    for (const c of l.competences) {
      if (!competenceParCode(c.code)) e.push(`${g.code} : la compétence ${c.code} n'existe pas.`);
    }
  }
  if (new Set(g.lignes.map((l) => l.code)).size !== g.lignes.length) e.push(`${g.code} : une ligne figure deux fois.`);
  return e;
}

/* ---------------------------------------------------------------------------
 * LES MESURES D'UNE COPIE.
 * ------------------------------------------------------------------------- */

/** Un marché rejoué, tel que le rejeu de « mérite ou chance » le rend. */
export interface MarcheDuRejeu {
  resultat: number;
  tresorerie: number;
  defaillant: boolean;
  rang: number;
}

/** Ce qu'il faut pour noter une copie : les rejeux et, s'il y a lieu, les situations. */
export interface MesuresDeLaCopie {
  /** Le nombre d'entreprises en lice (le candidat et ses concurrents). */
  sur: number;
  /** Les décisions du candidat, marché par marché. */
  joueur: readonly MarcheDuRejeu[];
  /** L'étalon de la grille (la gestion neutre du secteur), sur les mêmes marchés, dans le même ordre. */
  reference: readonly MarcheDuRejeu[];
  /** Les situations rencontrées et leurs scores (0 à 1) ; null : les questions sont éteintes. */
  situations: { scores: readonly number[] } | null;
}

/** Deux résultats plus proches qu'un centime sont égaux (comme le verdict de mérite). */
const CENTIME = 0.005;

const borne = (x: number) => (Number.isFinite(x) ? Math.min(1, Math.max(0, x)) : 0);
const moyenne = (xs: readonly number[]) => (xs.length === 0 ? 0 : xs.reduce((s, x) => s + x, 0) / xs.length);
const ecartType = (xs: readonly number[]) => {
  const m = moyenne(xs);
  return Math.sqrt(moyenne(xs.map((x) => (x - m) ** 2)));
};
const part = (n: number, sur: number) => (sur === 0 ? 0 : n / sur);

const euros = (v: number) =>
  `${Math.round(v) > 0 ? "+" : ""}${Math.round(v).toLocaleString("fr-FR").replace(/ /g, " ")} €`;
const decimale = (v: number) => v.toLocaleString("fr-FR", { maximumFractionDigits: 1, minimumFractionDigits: 1 });

/** La part tenue d'une ligne (0 à 1), et ce qui l'explique ; null : la ligne ne s'applique pas. */
export function mesurerLaLigne(
  code: CodeDeLigne,
  m: MesuresDeLaCopie,
): { part: number; detail: string } | null {
  const n = m.joueur.length;
  if (code !== "diagnostics" && (n === 0 || m.reference.length !== n)) {
    throw new Error("Rejeux incomplets : la copie ne se note pas.");
  }
  switch (code) {
    case "battre-la-reference": {
      const battues = m.joueur.filter((j, i) => j.resultat > m.reference[i]!.resultat + CENTIME).length;
      return { part: part(battues, n), detail: `${battues} marchés sur ${n}` };
    }
    case "ecart-a-la-reference": {
      const refs = m.reference.map((r) => r.resultat);
      const ecart = moyenne(m.joueur.map((j, i) => j.resultat - refs[i]!));
      // L'écart-type de l'étalon sur les trente marchés, avec un plancher : un étalon
      // presque constant ne doit pas faire d'un euro un écart immense.
      const echelle = Math.max(ecartType(refs), 0.05 * moyenne(refs.map(Math.abs)), 1);
      const z = ecart / echelle;
      return {
        part: borne(0.5 + z / (2 * ECARTS_TYPES_A_SATURATION)),
        detail: `${euros(ecart)} en moyenne (${z >= 0 ? "+" : ""}${decimale(z)} écart-type)`,
      };
    }
    case "solvabilite": {
      const saines = m.joueur.filter((j) => !j.defaillant).length;
      return { part: part(saines, n), detail: `${saines} marchés sur ${n} sans défaillance` };
    }
    case "tresorerie-positive": {
      const k = m.joueur.filter((j) => j.tresorerie >= 0).length;
      return { part: part(k, n), detail: `${k} marchés sur ${n}` };
    }
    case "rentabilite": {
      const k = m.joueur.filter((j) => j.resultat > CENTIME).length;
      return { part: part(k, n), detail: `${k} marchés sur ${n}` };
    }
    case "rang": {
      const valeur = m.sur <= 1 ? 1 : moyenne(m.joueur.map((j) => (m.sur - j.rang) / (m.sur - 1)));
      const rangMoyen = moyenne(m.joueur.map((j) => j.rang));
      return { part: borne(valeur), detail: `rang moyen ${decimale(rangMoyen)} sur ${m.sur}` };
    }
    case "diagnostics": {
      if (!m.situations || m.situations.scores.length === 0) return null;
      const s = m.situations.scores;
      return {
        part: borne(moyenne(s.map(borne))),
        detail: `${s.length} situation${s.length > 1 ? "s" : ""}, ${Math.round(moyenne(s.map(borne)) * 100)} % en moyenne`,
      };
    }
  }
}

/* ---------------------------------------------------------------------------
 * LA COPIE NOTÉE.
 * ------------------------------------------------------------------------- */

export interface LigneNotee {
  code: CodeDeLigne;
  libelle: string;
  /** Les points obtenus, rapportés à 100 (deux décimales). */
  points: number;
  /** Le maximum de la ligne, rapporté à 100. */
  max: number;
  /** Le maximum écrit dans la grille, avant la répartition. */
  maxDeLaGrille: number;
  /** La part tenue, de 0 à 1. */
  part: number;
  detail: string;
}

export interface CompetenceNotee {
  code: CodeDeCompetence;
  nom: string;
  /** La part tenue des lignes rattachées, de 0 à 1. */
  part: number;
  niveau: NiveauDeCompetence;
}

export interface CopieNotee {
  /** La note sur 100, une décimale. */
  note: number;
  /** La grille, sa version, et l'étalon contre lequel la copie a été notée. */
  grille: { code: string; version: number; nom: string; reference: ReferenceDeLaGrille };
  lignes: LigneNotee[];
  /** Les lignes de la grille qui ne s'appliquaient pas, et pourquoi. */
  horsCalcul: { code: CodeDeLigne; libelle: string; raison: string }[];
  competences: CompetenceNotee[];
}

const auCentieme = (x: number) => Math.round(x * 100) / 100;

/**
 * NOTER UNE COPIE. `questions` : l'examen pose-t-il les questions de diagnostic ? Les
 * lignes qui ne s'appliquent pas sortent du calcul, et les points des autres sont
 * rapportés à 100.
 */
export function noterLaCopie(
  grille: GrilleDeNotation,
  mesures: MesuresDeLaCopie,
  options: { questions: boolean },
): CopieNotee {
  const actives: { l: LigneDeGrille; mesure: { part: number; detail: string } }[] = [];
  const horsCalcul: CopieNotee["horsCalcul"] = [];
  for (const l of grille.lignes) {
    if (l.siQuestions && !options.questions) {
      horsCalcul.push({ code: l.code, libelle: l.libelle, raison: "Les questions de diagnostic ne sont pas posées dans cet examen." });
      continue;
    }
    const mesure = mesurerLaLigne(l.code, mesures);
    if (!mesure) {
      horsCalcul.push({ code: l.code, libelle: l.libelle, raison: "Aucune situation rencontrée dans la partie." });
      continue;
    }
    actives.push({ l, mesure });
  }
  const totalActif = actives.reduce((s, a) => s + a.l.points, 0);
  const facteur = totalActif > 0 ? 100 / totalActif : 0;
  const lignes: LigneNotee[] = actives.map(({ l, mesure }) => ({
    code: l.code,
    libelle: l.libelle,
    points: auCentieme(mesure.part * l.points * facteur),
    max: auCentieme(l.points * facteur),
    maxDeLaGrille: l.points,
    part: mesure.part,
    detail: mesure.detail,
  }));
  const somme = actives.reduce((s, a) => s + a.mesure.part * a.l.points * facteur, 0);
  const note = Math.min(100, Math.max(0, Math.round(somme * 10) / 10));

  const competences: CompetenceNotee[] = [];
  for (const c of competencesEvaluees(options.questions)) {
    let obtenu = 0;
    let possible = 0;
    for (const { l, mesure } of actives) {
      const r = l.competences.find((x) => x.code === c.code);
      if (!r) continue;
      obtenu += r.part * l.points * mesure.part;
      possible += r.part * l.points;
    }
    if (possible <= 0) continue;
    const p = obtenu / possible;
    competences.push({ code: c.code, nom: c.nom, part: p, niveau: niveauDeCompetence(p) });
  }
  return {
    note,
    grille: {
      code: grille.code,
      version: grille.version,
      nom: grille.nom,
      reference: { ...referenceDeLaGrille(grille) },
    },
    lignes,
    horsCalcul,
    competences,
  };
}

/**
 * L'étalon d'une copie notée. Une notation gardée avant qu'elle ne l'écrive a été notée
 * contre la gestion neutre du secteur (c'était l'étalon des grilles publiées).
 */
export const referenceDeLaCopie = (c: {
  grille: Omit<CopieNotee["grille"], "reference"> & { reference?: ReferenceDeLaGrille };
}): ReferenceDeLaGrille =>
  c.grille.reference ?? REFERENCE_GESTION_NEUTRE;

/**
 * La part des décisions qui battent l'étalon, seule (« la note de décision ») : ce que
 * la garde de neutralisation compare entre deux candidats aux mêmes décisions.
 */
export function noteDeDecision(copie: CopieNotee): number {
  return copie.lignes
    .filter((l) => l.code === "battre-la-reference" || l.code === "ecart-a-la-reference")
    .reduce((s, l) => s + l.points, 0);
}
