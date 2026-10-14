import { NOTE_MAX, NOTE_MIN, type Bareme } from "./criteres";

/**
 * LE FACTEUR INDIVIDUEL, MÉTHODE TYPE WEBPA. VERSIONNÉE : une règle nouvelle prend une
 * version nouvelle, et l'évaluation garde la version sous laquelle elle a été créée.
 *
 * LE PRINCIPE. Chaque répondant a des points à partager entre ses coéquipiers : la somme
 * des notes qu'il donne à l'un, rapportée à la somme de toutes celles qu'il donne, est la
 * PART qu'il lui attribue. La part qu'un membre reçoit est la somme des parts que lui
 * attribuent les répondants. La part ATTENDUE est celle qu'il recevrait si chacun
 * notait tout le monde à égalité. Le facteur est le rapport des deux : 1 quand on reçoit
 * ce qu'on attendait, plus de 1 quand les coéquipiers vous créditent davantage, moins de
 * 1 sinon. Il est borné, puis arrondi au centième.
 *
 * Comme la méthode ne lit que des PARTS, elle est insensible à la sévérité d'un
 * évaluateur : celui qui met 2 à tout le monde et celui qui met 5 à tout le monde ne
 * déplacent rien. Seul compte l'écart entre les coéquipiers aux yeux d'un même évaluateur.
 *
 * LES RÈGLES ÉCRITES, une par cas :
 *  · UN RÉPONDANT est un membre qui a noté TOUS ses coéquipiers actuels sur TOUS les
 *    critères (et lui-même, si l'auto-évaluation entre dans le facteur). Un membre arrivé
 *    après coup rend incomplète la réponse de ceux qui ne l'ont pas notée : elle ne compte
 *    pas tant qu'elle n'est pas complétée.
 *  · UN NON-RÉPONDANT : ses notes données ne comptent pas ; il reçoit quand même celles
 *    des autres, et son facteur se calcule sur elles.
 *  · PERSONNE N'A RÉPONDU dans l'équipe : facteur 1 pour tous.
 *  · AUCUN PAIR N'A NOTÉ CE MEMBRE (il est le seul répondant) : facteur 1. Sa seule
 *    auto-évaluation ne fait pas un facteur, même quand elle y entre.
 *  · UNE ÉQUIPE DE DEUX, sans auto-évaluation dans le facteur : chacun ne note que
 *    l'autre, donc lui donne toujours toute sa part. Le facteur ne porte aucune
 *    information : il vaut 1, et l'enseignant lit les moyennes.
 *  · UN MEMBRE SANS COÉQUIPIER : rien à évaluer, facteur 1.
 *  · L'AUTO-ÉVALUATION est exclue du facteur par défaut et montrée à part ; la méthode
 *    sait l'inclure (chaque répondant partage alors aussi avec lui-même).
 *  · LES BORNES : le facteur brut est ramené dans [basse, haute] (0,8 et 1,2 par défaut,
 *    réglables par l'enseignant parmi les valeurs proposées).
 *  · LA NOTE INDIVIDUELLE = note d'équipe × facteur retenu (celui qui est affiché, au
 *    centième), bornée entre 0 et le barème (20 ou 100), arrondie au dixième.
 */
export const METHODE_DES_PAIRS = {
  code: "webpa",
  version: 1,
  bornes: { basse: 0.8, haute: 1.2 },
  /** Les bornes que l'enseignant peut choisir. */
  bornesPossibles: {
    basses: [0.5, 0.6, 0.7, 0.8, 0.9, 1],
    hautes: [1, 1.1, 1.2, 1.3, 1.4, 1.5],
  },
  /** Les seuils des signaux, en points de l'échelle de 1 à 5. */
  seuils: {
    /** Écart entre l'auto-évaluation et la moyenne des pairs à partir duquel on le signale. */
    ecartAuto: 1,
    /** Moyenne donnée par chaque évaluateur, au plus, pour « noté très bas par tous ». */
    tresBas: 2,
    /** Écart entre l'évaluateur le plus généreux et le plus sévère pour un « désaccord fort ». */
    desaccord: 2,
  },
} as const;

export type Bornes = { basse: number; haute: number };

/** Une réponse : ce qu'un évaluateur donne à un évalué (lui-même compris), critère par critère. */
export interface NotesDonnees {
  evaluateur: string;
  evalue: string;
  notes: Readonly<Record<string, number>>;
}

export type RegleDuFacteur =
  | "calcule"
  | "seul"
  | "equipe-de-deux"
  | "personne-n-a-repondu"
  | "personne-ne-l-a-note";

export type Signal =
  | { code: "auto-surestime"; ecart: number }
  | { code: "auto-sous-estime"; ecart: number }
  | { code: "tres-bas"; evaluateurs: number }
  | { code: "desaccord"; ecart: number }
  | { code: "borne"; brut: number };

export interface ResultatDuMembre {
  userId: string;
  /** A-t-il rendu une réponse complète (il compte alors parmi les répondants) ? */
  aRepondu: boolean;
  /** Combien de répondants l'ont noté (lui-même exclu). */
  evaluateurs: number;
  /** Moyenne reçue des pairs répondants, critère par critère (null : personne ne l'a noté). */
  moyennes: Record<string, number | null>;
  /** Moyenne reçue des pairs, tous critères confondus. */
  moyenne: number | null;
  /** Son auto-évaluation, critère par critère (null : pas d'auto-évaluation rendue). */
  auto: Record<string, number> | null;
  autoMoyenne: number | null;
  /** Le rapport part reçue / part attendue, avant bornes. */
  facteurBrut: number;
  /** Le facteur retenu : borné, arrondi au centième. */
  facteur: number;
  regle: RegleDuFacteur;
  signaux: Signal[];
}

export interface ResultatDeLEquipe {
  membres: ResultatDuMembre[];
  repondants: number;
  /** Un désaccord fort sur au moins un membre de l'équipe. */
  desaccord: boolean;
}

const arrondi = (v: number, decimales: number) => {
  const f = 10 ** decimales;
  return Math.round((v + Number.EPSILON) * f) / f;
};
const moyenneDe = (v: readonly number[]) => (v.length ? v.reduce((a, b) => a + b, 0) / v.length : null);

/** Une note valable : un entier de l'échelle. */
export function noteValable(v: unknown): v is number {
  return typeof v === "number" && Number.isInteger(v) && v >= NOTE_MIN && v <= NOTE_MAX;
}

/** Une réponse complète : chaque critère a une note valable. */
function complete(n: NotesDonnees | undefined, criteres: readonly string[]): n is NotesDonnees {
  return !!n && criteres.every((c) => noteValable(n.notes[c]));
}

const total = (n: NotesDonnees, criteres: readonly string[]) => criteres.reduce((s, c) => s + n.notes[c]!, 0);

/**
 * LE CALCUL D'UNE ÉQUIPE. Ne lit que les membres ACTUELS : une réponse donnée par
 * quelqu'un qui a quitté l'équipe, ou sur lui, est ignorée.
 */
export function calculerLEquipe(args: {
  membres: readonly string[];
  criteres: readonly string[];
  reponses: readonly NotesDonnees[];
  autoDansLeFacteur?: boolean;
  bornes?: Bornes;
}): ResultatDeLEquipe {
  const { membres, criteres } = args;
  const autoDansLeFacteur = args.autoDansLeFacteur ?? false;
  const bornes = args.bornes ?? METHODE_DES_PAIRS.bornes;
  const n = membres.length;
  const dans = new Set(membres);
  const index = new Map<string, NotesDonnees>();
  for (const r of args.reponses) {
    if (dans.has(r.evaluateur) && dans.has(r.evalue)) index.set(`${r.evaluateur}>${r.evalue}`, r);
  }
  const de = (a: string, j: string) => index.get(`${a}>${j}`);

  // Les répondants : ceux qui ont noté tous les autres (et eux-mêmes si l'auto compte).
  const repondants = membres.filter(
    (a) =>
      n > 1 &&
      membres.every((j) => (j === a ? !autoDansLeFacteur || complete(de(a, a), criteres) : complete(de(a, j), criteres))),
  );
  const estRepondant = new Set(repondants);

  // La part que chaque répondant attribue à chacun.
  const parts = new Map<string, Map<string, number>>();
  for (const a of repondants) {
    const cibles = membres.filter((j) => autoDansLeFacteur || j !== a);
    const somme = cibles.reduce((s, j) => s + total(de(a, j)!, criteres), 0);
    parts.set(a, new Map(cibles.map((j) => [j, total(de(a, j)!, criteres) / somme])));
  }

  const resultats = membres.map((j): ResultatDuMembre => {
    // Ce que les pairs répondants lui donnent (lui-même exclu des moyennes).
    const recues = repondants.filter((a) => a !== j).map((a) => de(a, j)!);
    const moyennes = Object.fromEntries(
      criteres.map((c) => [c, recues.length ? arrondi(moyenneDe(recues.map((r) => r.notes[c]!))!, 2) : null]),
    );
    const moyennesParEvaluateur = recues.map((r) => moyenneDe(criteres.map((c) => r.notes[c]!))!);
    const moyenne = recues.length ? arrondi(moyenneDe(recues.flatMap((r) => criteres.map((c) => r.notes[c]!)))!, 2) : null;
    const soi = de(j, j);
    const auto = complete(soi, criteres) ? Object.fromEntries(criteres.map((c) => [c, soi.notes[c]!])) : null;
    const autoMoyenne = auto ? arrondi(moyenneDe(Object.values(auto))!, 2) : null;

    let regle: RegleDuFacteur;
    let brut = 1;
    if (n < 2) regle = "seul";
    else if (n === 2 && !autoDansLeFacteur) regle = "equipe-de-deux";
    else if (repondants.length === 0) regle = "personne-n-a-repondu";
    else {
      // Il faut au moins un pair qui l'ait noté : sa seule auto-évaluation ne fait pas un facteur.
      const pairs = repondants.filter((a) => a !== j);
      const sources = autoDansLeFacteur ? repondants : pairs;
      if (pairs.length === 0) regle = "personne-ne-l-a-note";
      else {
        regle = "calcule";
        const recu = sources.reduce((s, a) => s + parts.get(a)!.get(j)!, 0);
        const attendu = sources.length / (autoDansLeFacteur ? n : n - 1);
        brut = recu / attendu;
      }
    }
    const borne = Math.min(bornes.haute, Math.max(bornes.basse, brut));
    const facteur = arrondi(borne, 2);

    const signaux: Signal[] = [];
    const { seuils } = METHODE_DES_PAIRS;
    if (autoMoyenne !== null && moyenne !== null) {
      const ecart = arrondi(autoMoyenne - moyenne, 2);
      if (ecart >= seuils.ecartAuto) signaux.push({ code: "auto-surestime", ecart });
      else if (ecart <= -seuils.ecartAuto) signaux.push({ code: "auto-sous-estime", ecart: -ecart });
    }
    // « Très bas par tous » : au moins deux évaluateurs (un seul dans une équipe de deux).
    if (recues.length >= Math.min(2, n - 1) && recues.length > 0 && moyennesParEvaluateur.every((m) => m <= seuils.tresBas)) {
      signaux.push({ code: "tres-bas", evaluateurs: recues.length });
    }
    if (moyennesParEvaluateur.length >= 2) {
      const ecart = arrondi(Math.max(...moyennesParEvaluateur) - Math.min(...moyennesParEvaluateur), 2);
      if (ecart >= seuils.desaccord) signaux.push({ code: "desaccord", ecart });
    }
    if (regle === "calcule" && (brut < bornes.basse || brut > bornes.haute)) {
      signaux.push({ code: "borne", brut: arrondi(brut, 2) });
    }

    return {
      userId: j,
      aRepondu: estRepondant.has(j),
      evaluateurs: recues.length,
      moyennes,
      moyenne,
      auto,
      autoMoyenne,
      facteurBrut: arrondi(brut, 4),
      facteur,
      regle,
      signaux,
    };
  });

  return {
    membres: resultats,
    repondants: repondants.length,
    desaccord: resultats.some((r) => r.signaux.some((s) => s.code === "desaccord")),
  };
}

/** Des bornes acceptables : parmi les valeurs proposées, la basse sous la haute. */
export function bornesValables(b: Bornes): boolean {
  return (
    (METHODE_DES_PAIRS.bornesPossibles.basses as readonly number[]).includes(b.basse) &&
    (METHODE_DES_PAIRS.bornesPossibles.hautes as readonly number[]).includes(b.haute) &&
    b.basse <= 1 &&
    b.haute >= 1 &&
    b.basse < b.haute
  );
}

/**
 * LA NOTE INDIVIDUELLE : note d'équipe × facteur retenu, bornée entre 0 et le barème,
 * arrondie au dixième. Sans note d'équipe, il n'y en a pas.
 */
export function noteIndividuelle(noteDEquipe: number | null, facteur: number, bareme: Bareme): number | null {
  if (noteDEquipe === null || !Number.isFinite(noteDEquipe)) return null;
  return arrondi(Math.min(bareme, Math.max(0, noteDEquipe * facteur)), 1);
}

/** Une note d'équipe saisie (« 14,5 ») : un nombre entre 0 et le barème, ou rien. */
export function lireUneNoteDEquipe(saisie: string, bareme: Bareme): number | null | "invalide" {
  const s = saisie.trim().replace(",", ".");
  if (s === "") return null;
  if (!/^\d+(?:\.\d+)?$/.test(s)) return "invalide";
  const v = Number(s);
  if (!Number.isFinite(v) || v < 0 || v > bareme) return "invalide";
  return arrondi(v, 2);
}

/** Ce que dit un signal, à l'enseignant, en une phrase courte. */
export function phraseDuSignal(s: Signal): string {
  const pts = (v: number) => `${v.toLocaleString("fr-FR")} point${v >= 2 ? "s" : ""}`;
  switch (s.code) {
    case "auto-surestime":
      return `Se note ${pts(s.ecart)} au-dessus de ce que disent ses pairs`;
    case "auto-sous-estime":
      return `Se note ${pts(s.ecart)} en dessous de ce que disent ses pairs`;
    case "tres-bas":
      return `Notes très basses de la part de ${s.evaluateurs > 1 ? `ses ${s.evaluateurs} évaluateurs` : "son évaluateur"}`;
    case "desaccord":
      return `Désaccord fort entre ses évaluateurs (${pts(s.ecart)} d'écart)`;
    case "borne":
      return `Facteur ramené dans les bornes (brut ${s.brut.toLocaleString("fr-FR")})`;
  }
}

/** Ce que dit la règle appliquée, quand le facteur n'est pas calculé. */
export const PHRASES_DES_REGLES: Record<RegleDuFacteur, string | null> = {
  calcule: null,
  seul: "Personne d'autre dans son équipe : facteur 1.",
  "equipe-de-deux": "Équipe de deux : le facteur reste à 1, lisez les moyennes.",
  "personne-n-a-repondu": "Personne n'a répondu dans l'équipe : facteur 1.",
  "personne-ne-l-a-note": "Aucun coéquipier ne l'a noté : facteur 1.",
};
