import { CHAPITRES } from "./cours/registre";
import { SITUATIONS, type Situation } from "./cours/situations";
import { CHAPITRES_PROPOSES, chapitrePropose } from "./formations-proposees";

/**
 * LES NOMBRES DU COURS QUE LE SITE PUBLIE : UNE SEULE SOURCE (audit du 10 novembre 2026, P0-1).
 *
 * Le site annonçait 255 chapitres, 262 cas pratiques et 18 formations quand il en proposait
 * 235, 242 et 12 : les nombres comptaient tout le registre, formations retirées comprises
 * (config/formations-proposees.ts). Les chapitres, les laboratoires et les cas pratiques se
 * comptent ici, et seulement ici ; les formations que le cours sert, dans `leCoursEnChiffres`
 * (config/articulation.ts), qui lit le tableau de couverture. Ce module reste léger : la
 * description du site et l'image de partage le lisent sans charger ce tableau.
 * Garde : tests/architecture/chiffres-du-site.test.ts.
 */

const parCode = new Map(CHAPITRES.map((c) => [c.code, c]));

/** Un cas pratique est proposé quand chaque chapitre qu'il reprend l'est. */
export const situationProposee = (s: Pick<Situation, "reprend">): boolean =>
  s.reprend.every((code) => {
    const c = parCode.get(code);
    return c ? chapitrePropose(c) : false;
  });

/** Les cas pratiques proposés : cas dédiés et cas de synthèse, dans l'ordre du registre. */
export const SITUATIONS_PROPOSEES: readonly Situation[] = SITUATIONS.filter(situationProposee);

export const CHIFFRES_DU_COURS = {
  chapitres: CHAPITRES_PROPOSES.length,
  /** Les chapitres qui ont leur laboratoire (une étape `simulation`, leviers et curseurs). */
  avecLaboratoire: CHAPITRES_PROPOSES.filter((c) => c.etapes.some((e) => e.type === "simulation")).length,
  casPratiques: SITUATIONS_PROPOSEES.length,
} as const;

/** « chacun avec son laboratoire » seulement quand c'est vrai ; sinon le compte. */
export function laboratoireEnClair(n: { chapitres: number; avecLaboratoire: number }): string {
  return n.avecLaboratoire === n.chapitres ? "chacun avec son laboratoire" : `dont ${n.avecLaboratoire} avec leur laboratoire`;
}
