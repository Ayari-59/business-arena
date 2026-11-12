import type { CodeNiveau } from "@/config/episodes/niveaux";

/**
 * LES FAITS D'UNE PARTIE D'ÉPISODE, GARDÉS LE TEMPS DE L'ONGLET (décision du propriétaire du 11 novembre
 * 2026 ; audit UX du même jour, P1-6).
 *
 * Un rechargement ramenait à « Avant de commencer » : décisions, vérifications et prévisions perdues.
 * Sur téléphone, un appel ou un changement d'application suffit à décharger l'onglet, et un épisode
 * d'une vingtaine de minutes repartait de zéro. Les faits de la partie se gardent donc dans le stockage
 * de session de l'onglet, à chaque geste : la graine, le niveau, l'écran où l'on est, les décisions, les
 * vérifications, le diagnostic et sa réévaluation, la prévision. Au rechargement, l'écran les reprend et
 * le serveur rejoue la partie à partir d'eux, comme il le fait à chaque geste
 * (pedagogy/episodes/partie-servie.ts).
 *
 * RIEN DU CORRIGÉ : la réponse du serveur (la vue, ses verdicts, son bilan) ne se garde pas, elle se
 * redemande. Ni texte saisi : la phrase « Pourquoi ce choix ? » reste sur la page, comme la promesse de
 * l'introduction le dit (« sans votre nom ni aucun texte saisi »).
 */

export type EcranDeReprise = "jeu" | "bilan";
export type PhaseDeReprise = "signal" | "enquete" | "diagnostic" | "reevaluation" | "decision" | "consequence";

export interface FaitsDeLaPartie {
  /** La forme de ce qui est gardé : une autre forme ne se reprend pas. */
  v: 1;
  code: string;
  graine: number;
  cle: string | null;
  niveau: CodeNiveau;
  ecran: EcranDeReprise;
  etape: number;
  phase: PhaseDeReprise;
  decisions: number[];
  consultes: string[][];
  jours: number;
  diagnostic: { principal: string | null; second: string | null };
  reevaluation: { choix: "maintient" | "corrige" | null; principal: string | null };
  prevision: { valeur: string; confiance: number };
  /** L'option cochée, pas encore validée. */
  choix: number | null;
  /** La partie terminée juste avant, que le bilan met en regard : ses seuls faits. */
  precedente: { graine: number; chemin: number[]; jours: number; niveau?: CodeNiveau } | null;
}

/** La clé de l'onglet pour un épisode. */
export const cleDeLaPartie = (code: string) => `episode:${code}:partie`;

const NIVEAUX: readonly CodeNiveau[] = ["decouverte", "standard", "expert"];
const PHASES: readonly PhaseDeReprise[] = ["signal", "enquete", "diagnostic", "reevaluation", "decision", "consequence"];

const entier = (x: unknown, min: number, max: number): x is number => Number.isInteger(x) && (x as number) >= min && (x as number) <= max;
const texteOuNul = (x: unknown): x is string | null => x === null || (typeof x === "string" && x.length <= 60);

/**
 * Les faits lus de l'onglet, s'ils tiennent dans cet épisode (`n` décisions) et à un niveau permis ;
 * sinon null, et la partie repart de l'introduction. Le serveur les revérifie au premier geste.
 */
export function lireLesFaits(brut: unknown, code: string, n: number, niveaux: readonly CodeNiveau[]): FaitsDeLaPartie | null {
  if (!brut || typeof brut !== "object") return null;
  const f = brut as Partial<FaitsDeLaPartie>;
  if (f.v !== 1 || f.code !== code) return null;
  if (!entier(f.graine, 1, 2_147_483_647) || !NIVEAUX.includes(f.niveau!) || !niveaux.includes(f.niveau!)) return null;
  if (f.ecran !== "jeu" && f.ecran !== "bilan") return null;
  if (!entier(f.etape, 0, n - 1) || !PHASES.includes(f.phase!)) return null;
  if (!Array.isArray(f.decisions) || f.decisions.length > n || !f.decisions.every((d) => entier(d, 0, 20))) return null;
  if (!Array.isArray(f.consultes) || f.consultes.length !== n) return null;
  if (!f.consultes.every((c) => Array.isArray(c) && c.length <= 20 && c.every((s) => typeof s === "string" && s.length <= 60))) return null;
  if (typeof f.jours !== "number" || !Number.isFinite(f.jours) || f.jours < 0 || f.jours > 30) return null;
  if (!f.diagnostic || !texteOuNul(f.diagnostic.principal) || !texteOuNul(f.diagnostic.second)) return null;
  if (!f.reevaluation || ![null, "maintient", "corrige"].includes(f.reevaluation.choix as string | null) || !texteOuNul(f.reevaluation.principal)) return null;
  if (!f.prevision || typeof f.prevision.valeur !== "string" || f.prevision.valeur.length > 20 || !entier(f.prevision.confiance, 0, 100)) return null;
  if (f.choix !== null && !entier(f.choix, 0, 20)) return null;
  if (f.cle !== null && (typeof f.cle !== "string" || f.cle.length > 64)) return null;
  // L'écran et les décisions vont ensemble : à la conséquence, la décision de l'étape est prise ; avant, non.
  const prises = f.phase === "consequence" ? f.etape + 1 : f.etape;
  if (f.ecran === "jeu" && f.decisions.length !== prises) return null;
  if (f.ecran === "bilan" && (f.decisions.length !== n || !f.diagnostic.principal || !f.reevaluation.choix)) return null;
  const p = f.precedente;
  const precedente =
    p && entier(p.graine, 1, 2_147_483_647) && Array.isArray(p.chemin) && p.chemin.length === n && p.chemin.every((d) => entier(d, 0, 20)) && typeof p.jours === "number"
      ? { graine: p.graine, chemin: [...p.chemin], jours: p.jours, ...(p.niveau && NIVEAUX.includes(p.niveau) ? { niveau: p.niveau } : {}) }
      : null;
  return {
    v: 1,
    code,
    graine: f.graine,
    cle: f.cle ?? null,
    niveau: f.niveau!,
    ecran: f.ecran,
    etape: f.etape,
    phase: f.phase!,
    decisions: [...f.decisions],
    consultes: f.consultes.map((c) => [...c]),
    jours: f.jours,
    diagnostic: { principal: f.diagnostic.principal, second: f.diagnostic.second },
    reevaluation: { choix: f.reevaluation.choix, principal: f.reevaluation.principal },
    prevision: { valeur: f.prevision.valeur, confiance: f.prevision.confiance },
    choix: f.choix ?? null,
    precedente,
  };
}

/**
 * Le geste qui rend au serveur l'écran où l'on était : la conséquence d'une décision et le bilan
 * suivent une validation ; une étape en cours se relit comme une vérification, qui ne change rien.
 */
export const gesteDeReprise = (f: Pick<FaitsDeLaPartie, "ecran" | "phase">): "verifier" | "valider" =>
  f.ecran === "bilan" || f.phase === "consequence" ? "valider" : "verifier";
