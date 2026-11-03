import { CHAPITRES, PARCOURS, type CodeParcours } from "./cours/registre";
import type { Chapitre } from "./cours/types";
import { FORMATIONS, FORMATIONS_RETIREES, formationProposee, type Formation } from "./formations";

/**
 * AU LYCÉE, LE BAC STMG SEUL (décision du propriétaire, novembre 2026).
 *
 * Le site ne s'adresse plus, au lycée, qu'au baccalauréat STMG, avec le supérieur, la
 * formation continue et les entreprises. Les sept formations de `FORMATIONS_RETIREES` sortent du site
 * public : leurs pages de diplôme, la page Cours par diplôme, le catalogue par thème, le
 * plan du site, le choix du parcours d'une nouvelle classe et les pages qui présentent le
 * site. Les chapitres écrits pour leurs seuls parcours ne sont plus proposés.
 *
 * RIEN N'EST SUPPRIMÉ. Les formations restent au registre (config/formations.ts), les
 * parcours et les chapitres au registre du cours : une classe déjà créée sur l'un de ces
 * parcours garde son accès, et ses chapitres se jouent toujours. Revenir en arrière, c'est
 * vider `FORMATIONS_RETIREES` (config/formations.ts, où les libellés des ateliers la lisent).
 *
 * TOUT CE QUI EST RETIRÉ SE LIT ICI. Garde : tests/architecture/lycee-stmg-seul.test.ts.
 */
export { FORMATIONS_RETIREES, formationProposee };

/** Les formations proposées, dans l'ordre du registre. */
export const FORMATIONS_PROPOSEES: readonly Formation[] = FORMATIONS.filter((f) => formationProposee(f.code));

/** Un parcours du cours est-il proposé ? Un parcours de discipline, sans formation, l'est toujours. */
export function parcoursPropose(code: CodeParcours): boolean {
  const p = PARCOURS.find((x) => x.code === code);
  return !p?.formation || formationProposee(p.formation);
}

/** Un chapitre est-il proposé ? Il l'est quand son parcours l'est. */
export const chapitrePropose = (c: Pick<Chapitre, "parcours">): boolean => parcoursPropose(c.parcours);

/** Les parcours et les chapitres proposés, dans l'ordre du registre. */
export const PARCOURS_PROPOSES = PARCOURS.filter((p) => parcoursPropose(p.code));
export const CHAPITRES_PROPOSES: readonly Chapitre[] = CHAPITRES.filter(chapitrePropose);
