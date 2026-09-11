/**
 * Politique des situations manquées (V1-6).
 *
 * Constaté : une situation non rendue au tour 1 disparaissait de l'écran de
 * l'élève au tour 2 ; le « débriefing corrigé » promis était introuvable. Une
 * situation manquée reste désormais consultable en Mémoire, et — au choix de
 * l'enseignant — rattrapable une fois à la moitié du score.
 *
 * - `readonly`  : la situation manquée s'ouvre en lecture seule (défaut en
 *   concours : pas de seconde chance).
 * - `retake50`  : une reprise unique avant la clôture suivante, notée à 50 %
 *   (défaut en classe : l'erreur d'inattention n'est pas un zéro définitif).
 */

export type MissedSituationPolicy = "readonly" | "retake50";

export const MISSED_POLICY_LABELS: Record<MissedSituationPolicy, string> = {
  readonly: "Consultation seule",
  retake50: "Rattrapage à 50 %",
};

export const MISSED_POLICY_HELP: Record<MissedSituationPolicy, string> = {
  readonly: "La situation manquée s'ouvre en lecture seule, score 0 conservé.",
  retake50: "L'élève peut la rattraper une fois avant la clôture suivante ; le score compte pour moitié.",
};

/** Multiplicateur appliqué au score d'un rattrapage. */
export const RETAKE_MULTIPLIER = 0.5;

/** Défaut selon le genre de partie : classe = rattrapage, concours/solo = lecture seule. */
export function defaultMissedPolicy(kind: string | undefined): MissedSituationPolicy {
  return kind === "class" ? "retake50" : "readonly";
}

/** Politique effective d'une partie : réglage explicite, sinon défaut du genre. */
export function missedSituationPolicyFromProfile(
  profile: unknown,
  kind: string | undefined,
): MissedSituationPolicy {
  const p = (profile as { missedSituationPolicy?: unknown } | null)?.missedSituationPolicy;
  if (p === "readonly" || p === "retake50") return p;
  return defaultMissedPolicy(kind);
}

export type MemoryStatus = "rendue" | "rattrapee" | "non_rendue" | "a_venir";

/** Libellé du statut d'une situation en Mémoire. */
export function memoryStatusLabel(status: MemoryStatus, score: number | null): string {
  switch (status) {
    case "rendue":
      return score !== null ? `Rendue · ${Math.round(score)} / 100` : "Rendue";
    case "rattrapee":
      return score !== null ? `Rattrapée · ${Math.round(score)} / 100` : "Rattrapée";
    case "non_rendue":
      return "Non rendue · 0";
    case "a_venir":
      return "À venir";
  }
}
