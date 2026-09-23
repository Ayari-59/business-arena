/**
 * Concours : textes et déroulé partagés entre les pages (vague 1, K2–K4).
 *
 * Constaté en production : la page enseignant d'un concours ne rappelait
 * ni ses réglages ni où l'on en est ; /compete demandait un code sans dire
 * ce qu'est un concours ; un joueur déjà inscrit qui ressaisissait le code
 * était redirigé sans un mot.
 */

import type { Periodicity } from "@/config/scenarios/periodicity";

export const PERIODICITE_LABELS: Record<Periodicity, string> = {
  month: "Un mois par tour",
  quarter: "Un trimestre par tour",
  year: "Une année par tour",
};

/**
 * LE DÉROULÉ N'A PLUS QUATRE ÉTAPES.
 *
 * Un concours allait de deux phases : des poules, puis la finale. Un tournoi
 * de campus en demande trois — préliminaires, demi-finales, finale —, et la
 * table des phases savait déjà les porter (elle a un index et un type
 * `semifinal`) ; c'est le déroulé affiché qui était figé à quatre entrées.
 *
 * Il se construit donc maintenant des phases RÉELLEMENT créées : les
 * inscriptions, une entrée par phase jouée ou en cours, puis le podium. Une
 * phase intermédiaire porte le nom que l'organisateur lui a donné en la
 * lançant, parce que lui seul sait, au moment où il la crée, s'il l'appelle
 * « demi-finales » ou « tour 2 ».
 */
export const PREMIERE_ETAPE = "Inscriptions";
export const DERNIERE_ETAPE = "Podium";

/** Le nom d'affichage d'une phase, selon son type et ce que l'organisateur a saisi. */
export function nomDeLaPhase(stage: { kind: string; format?: unknown }, rang: number): string {
  const saisi = (stage.format as { nom?: unknown } | null | undefined)?.nom;
  if (typeof saisi === "string" && saisi.trim()) return saisi.trim();
  if (stage.kind === "qualification") return "Qualifications";
  if (stage.kind === "final") return "Finale";
  return `Phase ${rang}`;
}

export interface DerouleConcours {
  etapes: {
    nom: string;
    detail: string;
    etat: "passee" | "courante" | "a_venir";
    /**
     * Ce qui se passe à cette étape, en deux mots. L'étape courante disait
     * « en cours », y compris le PODIUM d'un concours terminé : un classement
     * proclamé n'est pas un travail en cours.
     */
    mention: string | null;
  }[];
  /** Indice de l'étape en cours dans `etapes`. */
  courante: number;
}

/** Ce que le déroulé lit du concours : statut et phases déjà créées. */
export interface ConcoursPourDeroule {
  status: string;
  joinCode: string;
  entries: unknown[];
  stages: { kind: string; status?: string; format?: unknown; games: unknown[] }[];
  rules: { groupSize: number; advancePerGroup: number };
}

function pluriel(n: number, mot: string, pluriels?: string): string {
  return `${n} ${n > 1 ? (pluriels ?? `${mot}s`) : mot}`;
}

/**
 * POULE, ET NON GROUPE.
 *
 * Un concours empile deux niveaux de regroupement : l'ÉQUIPE, qui réunit des
 * élèves et se qualifie d'un bloc, et l'ensemble d'équipes qui joue une même
 * partie de qualification. Appeler le second « groupe » le faisait entendre
 * comme un groupe d'ÉLÈVES, et « deux qualifiés par groupe » se lisait alors
 * comme si une équipe pouvait partir en finale amputée de la moitié des siens.
 * « Poule » ne désigne que des équipes, et c'est le mot du tournoi.
 */

/**
 * LES ÉTAPES AFFICHÉES : le passé réel, et l'avenir connu.
 *
 * Tant qu'aucune phase n'est tirée, on montre le plan par défaut — des
 * qualifications, puis la finale —, parce qu'un organisateur qui ouvre les
 * inscriptions doit voir où il va. Dès qu'une phase existe, ce sont les vraies
 * phases qui s'affichent, avec le nom qu'il leur a donné. La FINALE est
 * toujours annoncée tant qu'elle n'a pas été lancée : un concours s'y termine
 * quel que soit le nombre de tours qu'on met à l'atteindre.
 */
function phasesAffichees(c: Pick<ConcoursPourDeroule, "stages">): {
  phases: ConcoursPourDeroule["stages"];
  finaleAVenir: boolean;
} {
  return {
    phases: c.stages,
    finaleAVenir: !c.stages.some((s) => s.kind === "final"),
  };
}

/**
 * Étape courante : 0 = inscriptions, puis une par phase créée, puis le podium.
 * Une partie qui tourne est à sa dernière phase créée ; un concours clos est
 * au podium, quel que soit le nombre de phases qu'il a fallu pour y arriver.
 */
export function etapeCourante(c: Pick<ConcoursPourDeroule, "status" | "stages">): number {
  if (c.status !== "finished" && c.status !== "running") return 0;
  const { phases, finaleAVenir } = phasesAffichees(c);
  const jouees = Math.max(1, phases.length);
  if (c.status === "running") return jouees;
  // Clos : le podium est la dernière entrée de la liste.
  return 1 + jouees + (finaleAVenir ? 1 : 0);
}

/** Ce qu'une phase déjà créée a fait : ses poules, ou sa partie unique. */
function detailDeLaPhase(
  stage: ConcoursPourDeroule["stages"][number],
  regles: ConcoursPourDeroule["rules"],
): string {
  if (stage.kind === "final") {
    return "Une partie entre les qualifiées, mêmes règles de compétition.";
  }
  const format = (stage.format as { teamsPerGame?: number; advanceCount?: number } | null) ?? {};
  const taille = format.teamsPerGame ?? regles.groupSize;
  const qualifiees = format.advanceCount ?? regles.advancePerGroup;
  return `${pluriel(stage.games.length, "poule")} de ${taille} équipes tirées au sort, ${pluriel(
    qualifiees,
    "équipe qualifiée",
    "équipes qualifiées",
  )} par poule au score IPG.`;
}

export function derouleConcours(c: ConcoursPourDeroule): DerouleConcours {
  const courante = etapeCourante(c);
  const n = c.entries.length;
  const { phases, finaleAVenir } = phasesAffichees(c);
  const qualificationsPrevues = `Des poules de ${c.rules.groupSize} équipes tirées au sort, ${pluriel(
    c.rules.advancePerGroup,
    "équipe qualifiée",
    "équipes qualifiées",
  )} par poule au score IPG.`;

  const jouees =
    phases.length > 0
      ? phases.map((s, i) => ({ nom: nomDeLaPhase(s, i + 1), detail: detailDeLaPhase(s, c.rules) }))
      : [{ nom: "Qualifications", detail: qualificationsPrevues }];

  const etapes = [
    {
      nom: PREMIERE_ETAPE,
      detail: `${n} équipe${n > 1 ? "s" : ""} inscrite${n > 1 ? "s" : ""} avec le code ${c.joinCode}.`,
    },
    ...jouees,
    ...(finaleAVenir
      ? [{ nom: "Finale", detail: "Une partie entre les qualifiées, mêmes règles de compétition." }]
      : []),
    { nom: DERNIERE_ETAPE, detail: "Classement IPG de la finale : or, argent, bronze." },
  ];

  const clos = c.status === "finished";
  return {
    courante,
    etapes: etapes.map((e, i) => ({
      ...e,
      etat: i < courante ? "passee" : i === courante ? "courante" : "a_venir",
      mention: i !== courante ? null : clos ? "proclamé" : "en cours",
    })),
  };
}

/** « Vous êtes déjà inscrit dans l'équipe Alpha de ce concours ». */
export function messageDejaInscrit(teamLabel: string): string {
  return `Vous êtes déjà inscrit dans l'équipe ${teamLabel} de ce concours`;
}

/** Les cinq lignes de /compete : ce qu'est un concours, avant de demander un code. */
export const EXPLICATIONS_CONCOURS = [
  "Un concours est un championnat entre équipes, organisé par un enseignant sur Business Arena.",
  "Vous vous inscrivez avec le code à 6 caractères qu'il vous a donné, et le nom de votre équipe (2 à 6 joueurs).",
  "Les équipes sont tirées au sort dans des poules ; chaque poule joue une partie complète en mode compétition.",
  "Les meilleures équipes de chaque poule au score IPG se qualifient pour la finale, avec tous leurs membres.",
  "En mode compétition, les décisions validées sont verrouillées et les indices sont limités.",
] as const;

/**
 * LA CONFIGURATION D'UN TOURNOI.
 *
 * Un championnat ne se règle pas comme une partie de classe. Ce qui le décrit,
 * ce n'est pas « six équipes et deux concurrents simulés », c'est le nombre
 * d'équipes inscrites, la taille visée des groupes, le nombre de qualifiés par
 * groupe, et ce que ces trois nombres donnent une fois passés dans le tirage.
 *
 * Or le tirage ne fait pas ce qu'on croit. Le nombre de groupes est le
 * QUOTIENT ENTIER du nombre d'équipes par la taille visée, et les équipes sont
 * ensuite réparties à tour de rôle : quinze équipes en groupes de quatre ne
 * font pas quatre groupes, elles en font trois, de cinq. Et la finale est
 * plafonnée. Une fiche qui annonce « cinq finalistes » sans faire ce calcul se
 * trompe devant tout un campus, et personne ne s'en aperçoit avant le jour J.
 *
 * Ces fonctions reproduisent donc, à la ligne près, ce que le produit exécute
 * (`composeGroups` et `qualifiers`), pour que les fiches et les pages annoncent
 * le tournoi qui aura lieu.
 */
export const LIMITES_CONCOURS = {
  /** Taille de groupe acceptée à la création. */
  tailleGroupe: { min: 2, max: 6 },
  /** Qualifiés par groupe acceptés à la création. */
  qualifiesParGroupe: { min: 1, max: 4 },
  /** La finale ne dépasse jamais ce nombre d'équipes. */
  finalistesMax: 8,
  /** En dessous, il n'y a pas de tournoi : le produit refuse les qualifications. */
  equipesMin: 2,
} as const;

export interface ConfigurationTournoi {
  /** Équipes inscrites au concours. */
  equipes: number;
  /** Taille de groupe VISÉE à la création. */
  tailleGroupe: number;
  /** Qualifiés par groupe à la création. */
  qualifiesParGroupe: number;
}

export interface FormatDuTournoi {
  /** Groupes réellement tirés. */
  groupes: number;
  /** Équipes par groupe après répartition, de la plus petite à la plus grande. */
  equipesParGroupe: number[];
  /** Équipes qui joueront la finale. */
  finalistes: number;
  /** Vrai quand le plafond de la finale a rogné le nombre de qualifiés. */
  plafonnee: boolean;
}

/** Ce que le tirage et la qualification donneront vraiment, sans le jouer. */
export function formatDuTournoi(config: ConfigurationTournoi): FormatDuTournoi {
  const equipes = Math.max(0, Math.trunc(config.equipes));
  const taille = Math.max(LIMITES_CONCOURS.tailleGroupe.min, Math.trunc(config.tailleGroupe));
  const groupes = equipes === 0 ? 0 : Math.max(1, Math.floor(equipes / taille));
  // Répartition à tour de rôle : les premiers groupes reçoivent une équipe de
  // plus quand la division ne tombe pas juste.
  const base = groupes === 0 ? 0 : Math.floor(equipes / groupes);
  const reste = groupes === 0 ? 0 : equipes % groupes;
  const equipesParGroupe = Array.from({ length: groupes }, (_, i) => base + (i < reste ? 1 : 0));
  const vises = groupes * Math.trunc(config.qualifiesParGroupe);
  const finalistes =
    groupes === 0 ? 0 : Math.min(LIMITES_CONCOURS.finalistesMax, Math.max(2, vises));
  return {
    groupes,
    equipesParGroupe,
    finalistes,
    plafonnee: vises > LIMITES_CONCOURS.finalistesMax,
  };
}

/** « 3 poules de 5 équipes, 6 équipes finalistes » : le format en une ligne. */
export function libelleFormatTournoi(config: ConfigurationTournoi): string {
  const f = formatDuTournoi(config);
  if (f.groupes === 0) return "Aucune équipe inscrite.";
  const tailles = [...new Set(f.equipesParGroupe)].sort((a, b) => a - b);
  const taille = tailles.length === 1 ? `${tailles[0]}` : `${tailles[0]} à ${tailles[tailles.length - 1]}`;
  const plafond = f.plafonnee ? ", la finale étant plafonnée" : "";
  return `${pluriel(f.groupes, "poule")} de ${taille} équipes, ${pluriel(f.finalistes, "équipe finaliste", "équipes finalistes")}${plafond}.`;
}

/**
 * UNE PHASE INTERMÉDIAIRE, AVANT DE LA LANCER.
 *
 * L'organisateur choisit la taille des poules et le nombre d'équipes qui en
 * sortent ; il doit voir ce que cela donne AVANT de confirmer, parce que le
 * tirage est irréversible et que le nombre de poules n'est pas celui qu'on
 * croit (c'est le quotient entier, et le reste se redistribue).
 *
 * Deux empêchements, et chacun dit quoi faire à la place :
 *  · moins de deux poules possibles — il ne reste plus assez d'équipes, c'est
 *    une finale qu'il faut lancer ;
 *  · autant de qualifiées que d'équipes dans la plus petite poule — la phase
 *    ne trancherait rien, tout le monde passerait.
 *
 * Il n'y en a pas de troisième : deux poules qui qualifient chacune au moins
 * une équipe laissent toujours de quoi faire une finale.
 */
export interface ApercuDePhase {
  poules: number;
  /** Équipes par poule après répartition, de la plus petite à la plus grande. */
  equipesParPoule: number[];
  /** Équipes encore en lice après cette phase. */
  survivantes: number;
  possible: boolean;
  /** Ce qui empêche cette phase, en une phrase. Null quand elle est possible. */
  empechement: string | null;
}

export function apercuDePhase(
  equipes: number,
  taillePoule: number,
  qualifieesParPoule: number,
): ApercuDePhase {
  const n = Math.max(0, Math.trunc(equipes));
  const taille = Math.max(LIMITES_CONCOURS.tailleGroupe.min, Math.trunc(taillePoule));
  const qualifiees = Math.max(1, Math.trunc(qualifieesParPoule));
  const poules = n === 0 ? 0 : Math.max(1, Math.floor(n / taille));
  const base = poules === 0 ? 0 : Math.floor(n / poules);
  const reste = poules === 0 ? 0 : n % poules;
  // Même répartition à tour de rôle que le tirage : les premières poules
  // reçoivent une équipe de plus quand la division ne tombe pas juste.
  const equipesParPoule = Array.from({ length: poules }, (_, i) => base + (i < reste ? 1 : 0)).sort(
    (a, b) => a - b,
  );
  const plusPetite = equipesParPoule[0] ?? 0;
  const survivantes = poules * Math.min(qualifiees, plusPetite || qualifiees);

  let empechement: string | null = null;
  if (poules < 2) {
    empechement = `Il reste ${n} équipes : trop peu pour former deux poules de ${taille}. Lancez la finale.`;
  } else if (qualifiees >= plusPetite) {
    empechement = `Une poule n'aura que ${plusPetite} équipes : en qualifier ${qualifiees} ne trancherait rien.`;
  }

  return { poules, equipesParPoule, survivantes, possible: empechement === null, empechement };
}

/** « 2 poules de 4 équipes, 4 équipes en lice après cette phase. » */
export function libelleApercuDePhase(a: ApercuDePhase): string {
  if (!a.possible) return a.empechement!;
  const tailles = [...new Set(a.equipesParPoule)];
  const taille =
    tailles.length === 1 ? `${tailles[0]}` : `${tailles[0]} à ${tailles[tailles.length - 1]}`;
  return `${pluriel(a.poules, "poule")} de ${taille} équipes, ${pluriel(
    a.survivantes,
    "équipe encore en lice",
    "équipes encore en lice",
  )} après cette phase.`;
}
