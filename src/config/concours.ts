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

function pluriel(n: number, mot: string): string {
  return `${n} ${mot}${n > 1 ? "s" : ""}`;
}

/** Étape courante : inscriptions → qualifications → finale → podium. */
export function etapeCourante(c: Pick<ConcoursPourDeroule, "status" | "stages">): number {
  if (c.status === "finished") return 3;
  if (c.status !== "running") return 0;
  return c.stages.some((s) => s.kind === "final") ? 2 : 1;
}

export function derouleConcours(c: ConcoursPourDeroule): DerouleConcours {
  const courante = etapeCourante(c);
  const qualif = c.stages.find((s) => s.kind === "qualification");
  const groupes = qualif ? pluriel(qualif.games.length, "groupe") : "Des groupes";
  const n = c.entries.length;
  const details: Record<EtapeConcours, string> = {
    Inscriptions: `${n} équipe${n > 1 ? "s" : ""} inscrite${n > 1 ? "s" : ""} avec le code ${c.joinCode}.`,
    Qualifications: `${groupes} de ${c.rules.groupSize} équipes tirés au sort, ${pluriel(
      c.rules.advancePerGroup,
      "qualifié",
    )} par groupe au score BPI.`,
    Finale: "Une partie entre les qualifiés, mêmes règles de compétition.",
    Podium: "Classement BPI de la finale : or, argent, bronze.",
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
  "Les équipes sont tirées au sort dans des groupes ; chaque groupe joue une partie complète en mode compétition.",
  "Les meilleures équipes de chaque groupe au score BPI se qualifient pour la finale.",
  "En mode compétition, les décisions validées sont verrouillées et les indices sont limités.",
] as const;
