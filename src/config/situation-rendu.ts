/**
 * Rendu unique de la situation (vague 1, P6).
 *
 * Constaté en production : deux boutons distincts, « Enregistrer mon
 * diagnostic » et « Valider mes réponses », et des équipes qui rendaient
 * l'un sans l'autre. Le débriefing corrigeait alors une moitié de copie
 * sans que personne ne l'ait voulu. Il n'y a plus qu'un rendu, et il ne
 * part que complet.
 *
 * Ce module est pur : il dit ce qui manque et comment l'annoncer. Le
 * formulaire et l'action serveur s'appuient dessus, séparément, pour que
 * le bouton grisé et le refus côté serveur racontent la même chose.
 */

export const DIAGNOSTIC = "le diagnostic";
export const MODELE = "le modèle";

export const STATUT_RENDUE = "Situation rendue · en attente du débriefing";

export type Manque = typeof DIAGNOSTIC | typeof MODELE;

export interface Brouillon {
  /** Options du diagnostic cochées. */
  options: string[];
  /** Questions posées (identifiants) : vide quand le modèle n'est pas demandé. */
  questions: string[];
  /** Réponses par identifiant de question. */
  reponses: Record<string, string>;
}

/** Ce qui manque au brouillon pour être rendu, dans l'ordre d'affichage. */
export function manques(b: Brouillon): Manque[] {
  const m: Manque[] = [];
  if (b.options.length === 0) m.push(DIAGNOSTIC);
  if (b.questions.some((q) => !b.reponses[q])) m.push(MODELE);
  return m;
}

export function estComplet(b: Brouillon): boolean {
  return manques(b).length === 0;
}

/** « Situation incomplète : il manque le diagnostic et le modèle ». */
export function messageIncomplet(m: readonly Manque[]): string {
  return `Situation incomplète : il manque ${m.join(" et ")}`;
}

/** Ce que la vue d'une situation dit déjà de son rendu. */
export interface EtatRendu {
  diagnosis: unknown | null;
  quizAnswers: unknown | null;
  quizQuestions: { id: string }[];
}

/** Une situation est rendue quand ses deux moitiés sont enregistrées. */
export function manquesEnregistres(s: EtatRendu): Manque[] {
  const m: Manque[] = [];
  if (s.diagnosis === null) m.push(DIAGNOSTIC);
  if (s.quizQuestions.length > 0 && s.quizAnswers === null) m.push(MODELE);
  return m;
}

export function estRendue(s: EtatRendu): boolean {
  return manquesEnregistres(s).length === 0;
}

/** Statut d'ensemble des situations du tour, pour le bandeau d'en-tête. */
export interface StatutSituations {
  rendues: number;
  total: number;
  /** Ce qui manque, toutes situations confondues, sans doublon. */
  manques: Manque[];
}

export function statutDesSituations(situations: readonly EtatRendu[]): StatutSituations | null {
  if (situations.length === 0) return null;
  const tous = new Set<Manque>();
  let rendues = 0;
  for (const s of situations) {
    const m = manquesEnregistres(s);
    if (m.length === 0) rendues += 1;
    for (const x of m) tous.add(x);
  }
  const ordre: Manque[] = [DIAGNOSTIC, MODELE];
  return { rendues, total: situations.length, manques: ordre.filter((x) => tous.has(x)) };
}

/** La phrase du bandeau : rendue, ou ce qui manque. */
export function libelleStatut(statut: StatutSituations): string {
  return statut.manques.length === 0 ? STATUT_RENDUE : messageIncomplet(statut.manques);
}
