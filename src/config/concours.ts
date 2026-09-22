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

/** Les quatre étapes d'un concours, dans l'ordre. */
export const ETAPES_CONCOURS = ["Inscriptions", "Qualifications", "Finale", "Podium"] as const;

export type EtapeConcours = (typeof ETAPES_CONCOURS)[number];

export interface DerouleConcours {
  etapes: { nom: EtapeConcours; detail: string; etat: "passee" | "courante" | "a_venir" }[];
  /** Indice (0–3) de l'étape en cours. */
  courante: number;
}

/** Ce que le déroulé lit du concours : statut et phases déjà créées. */
export interface ConcoursPourDeroule {
  status: string;
  joinCode: string;
  entries: unknown[];
  stages: { kind: string; games: unknown[] }[];
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

/** Étape courante : inscriptions → qualifications → finale → podium. */
export function etapeCourante(c: Pick<ConcoursPourDeroule, "status" | "stages">): number {
  if (c.status === "finished") return 3;
  if (c.status !== "running") return 0;
  return c.stages.some((s) => s.kind === "final") ? 2 : 1;
}

export function derouleConcours(c: ConcoursPourDeroule): DerouleConcours {
  const courante = etapeCourante(c);
  const qualif = c.stages.find((s) => s.kind === "qualification");
  const poules = qualif ? pluriel(qualif.games.length, "poule") : "Des poules";
  const n = c.entries.length;
  const details: Record<EtapeConcours, string> = {
    Inscriptions: `${n} équipe${n > 1 ? "s" : ""} inscrite${n > 1 ? "s" : ""} avec le code ${c.joinCode}.`,
    Qualifications: `${poules} de ${c.rules.groupSize} équipes tirées au sort, ${pluriel(
      c.rules.advancePerGroup,
      "équipe qualifiée",
      "équipes qualifiées",
    )} par poule au score IPG.`,
    Finale: "Une partie entre les qualifiés, mêmes règles de compétition.",
    Podium: "Classement IPG de la finale : or, argent, bronze.",
  };
  return {
    courante,
    etapes: ETAPES_CONCOURS.map((nom, i) => ({
      nom,
      detail: details[nom],
      etat: i < courante ? "passee" : i === courante ? "courante" : "a_venir",
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
