/**
 * Moteur pédagogique côté services — barrel de compatibilité.
 *
 * Le service historique (1800+ lignes) a été décomposé (refactoring V2,
 * étape 9) en services à responsabilité unique :
 *   - pedagogy-seed.service       : seed idempotent des référentiels
 *   - situation-instance.service  : ouverture / chargement des situations
 *   - hints.service               : plafond et déblocage des indices
 *   - diagnosis.service           : diagnostic + score F1
 *   - debrief.service             : QCM, rattrapage, débriefing, vue (toView)
 *   - pedagogy-reporting.service  : vues lecture élève / enseignant
 *
 * Ce fichier ne fait que ré-exporter leur API publique : les appelants qui
 * importent depuis @/services/pedagogy.service n'ont rien à changer.
 */

export { seedPedagogyReferentials } from "./pedagogy-seed.service";
export { openSituationsForRound } from "./situation-instance.service";
export { unlockHint } from "./hints.service";
export { submitDiagnosis } from "./diagnosis.service";
export { submitQuiz, retakeSituation, setMissedPolicy, debriefRound } from "./debrief.service";
export type { ModelCtx, AnalyticalHint, SituationView } from "./debrief.service";
export {
  getTeamSituations,
  getTeacherPedagogyView,
  getTeacherUsageView,
  getGameGradeSheet,
  getStudentProgressView,
} from "./pedagogy-reporting.service";
export type {
  DebriefedRound,
  TeacherPedagogyView,
  TeacherUsageView,
  TeamGrade,
  GradeSheet,
  StudentProgress,
  StudentProgressView,
} from "./pedagogy-reporting.service";
