import { CHAPITRES, PARCOURS } from "./cours/registre";
import { CAS_DE_SYNTHESE, SITUATIONS, type Situation } from "./cours/situations";
import type { Chapitre } from "./cours/types";
import { chapitresDuParcoursAChoisir, parcoursDuDiplome } from "./cours/parcours-de-formation";
import { FORMATIONS, FORMATIONS_RETIREES } from "./formations";
import { chapitrePropose } from "./formations-proposees";
import { compterLeCours, compterParCode, type RegistreDuCours } from "./chiffres-du-site";

/**
 * LES NOMBRES DU COURS QUE LE SITE PUBLIE : UNE SEULE SOURCE (audit du 10 novembre 2026, P0-1 ;
 * chantier des compteurs, novembre 2026).
 *
 * Le site annonçait 255 chapitres, 262 cas pratiques et 18 formations quand il en proposait
 * 235, 242 et 12 : les nombres comptaient tout le registre, formations retirées comprises
 * (config/formations-proposees.ts). Les chapitres, les laboratoires et les cas pratiques se
 * comptent ici, et seulement ici, par les règles de config/chiffres-du-site.ts : le total, celui
 * de chaque thème du catalogue (/cours#catalogue) et celui de la tuile de chaque diplôme
 * (/cours). Les formations que le cours sert se comptent dans `leCoursEnChiffres`
 * (config/articulation.ts), qui lit le tableau de couverture.
 * Gardes : tests/architecture/chiffres-du-site.test.ts, tests/architecture/compteurs-des-contenus.test.ts.
 */

/** Le registre du cours, tel que les règles de comptage le lisent. */
export const REGISTRE_DU_COURS: RegistreDuCours = {
  formations: FORMATIONS,
  formationsRetirees: FORMATIONS_RETIREES,
  parcours: PARCOURS,
  chapitres: CHAPITRES,
  situations: SITUATIONS,
};

const parCode = new Map(CHAPITRES.map((c) => [c.code, c]));

/** Un cas pratique est proposé quand chaque chapitre qu'il reprend l'est. */
export const situationProposee = (s: Pick<Situation, "reprend">): boolean =>
  s.reprend.every((code) => {
    const c = parCode.get(code);
    return c ? chapitrePropose(c) : false;
  });

/** Les cas pratiques proposés : cas dédiés et cas de synthèse, dans l'ordre du registre. */
export const SITUATIONS_PROPOSEES: readonly Situation[] = SITUATIONS.filter(situationProposee);

/** Les chapitres, les laboratoires et les cas pratiques proposés. */
export const CHIFFRES_DU_COURS = compterLeCours(REGISTRE_DU_COURS);

/** « chacun avec son laboratoire » seulement quand c'est vrai ; sinon le compte. */
export function laboratoireEnClair(n: { chapitres: number; avecLaboratoire: number }): string {
  return n.avecLaboratoire === n.chapitres ? "chacun avec son laboratoire" : `dont ${n.avecLaboratoire} avec leur laboratoire`;
}

/**
 * UN THÈME DU CATALOGUE (/cours#catalogue) : ses chapitres proposés, ses cas de synthèse proposés,
 * et ce qu'il compte. Les cas pratiques d'un thème sont les cas proposés dont le premier chapitre
 * repris y est rangé : le cas dédié de chacun de ses chapitres, et ses cas de synthèse. Chaque
 * chapitre est dans un thème et un seul : la somme des thèmes est le total.
 */
export function contenusDuTheme(theme: { chapitres: readonly string[] }): {
  chapitres: Chapitre[];
  casDeSynthese: Situation[];
  nombreDeChapitres: number;
  nombreDeCas: number;
} {
  const codes = new Set(theme.chapitres);
  const chapitres = theme.chapitres.map((code) => parCode.get(code)).filter((c): c is Chapitre => Boolean(c && chapitrePropose(c)));
  return {
    chapitres,
    casDeSynthese: CAS_DE_SYNTHESE.filter((s) => codes.has(s.reprend[0]!) && situationProposee(s)),
    nombreDeChapitres: compterParCode(chapitres),
    nombreDeCas: compterParCode(SITUATIONS_PROPOSEES.filter((s) => codes.has(s.reprend[0]!))),
  };
}

/**
 * LA TUILE D'UN DIPLÔME (/cours, « Votre formation ? ») : le nombre de chapitres que le parcours
 * qu'une classe de ce diplôme peut choisir ouvre de lui-même (décision du propriétaire, novembre
 * 2026 : la tuile du BTS NDRC disait 16 quand son parcours en ouvre 15). Ce parcours est le cours
 * du diplôme (une option prend celui de son diplôme), ou, pour un diplôme qui n'en a pas (BTS MCO,
 * NDRC, GPME), le seul parcours du registre qui le suit. Sans les prérequis, que le parcours ouvre
 * en plus : la taille que la liste du devis annonce (config/cours/taille-des-parcours.ts). Null :
 * aucun parcours.
 */
export function parcoursDeLaTuile(formation: string): string | null {
  const duDiplome = parcoursDuDiplome(formation);
  if (duDiplome) return duDiplome;
  const suivis = PARCOURS.filter((p) => p.formation === formation);
  return suivis.length === 1 ? suivis[0]!.code : null;
}

/** Le nombre de chapitres de la tuile d'un diplôme ; 0 sans parcours. */
export function chapitresDeLaTuile(formation: string): number {
  const parcours = parcoursDeLaTuile(formation);
  return parcours ? compterParCode(chapitresDuParcoursAChoisir(parcours).filter(chapitrePropose)) : 0;
}
