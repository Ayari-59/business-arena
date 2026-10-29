/**
 * LE TUTEUR IA DE L'ÉLÈVE : son quota.
 *
 * Chaque question part chez Anthropic et se paie. Sans plafond, une boucle (ou un
 * élève qui s'amuse) pouvait poser des centaines de questions dans une partie.
 * 20 questions par élève et par partie laissent largement de quoi s'aider sur
 * une séance, et bornent le coût d'une classe entière.
 *
 * Le compteur est en base (table `tuteur_questions`), par partie et par élève :
 * il ne se remet pas à zéro en rechargeant la page ni en changeant d'appareil.
 */
export const QUESTIONS_AU_TUTEUR_PAR_PARTIE = 20;

/** Ce que l'élève lit quand son quota est atteint. */
export const MESSAGE_QUOTA_ATTEINT = `Vous avez posé vos ${QUESTIONS_AU_TUTEUR_PAR_PARTIE} questions au tuteur pour cette partie. Relisez ses réponses, ou demandez à votre enseignant.`;

/** Ce que l'élève lit quand l'enseignant a coupé le tuteur de la partie. */
export const MESSAGE_TUTEUR_COUPE = "Votre enseignant a désactivé le tuteur IA pour cette partie.";
