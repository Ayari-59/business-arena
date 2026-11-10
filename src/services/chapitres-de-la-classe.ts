import { parcoursQuiOuvrent, type OuvrablePar } from "@/config/cours/parcours-de-formation";
import type { Chapitre } from "@/config/cours/types";
import { getTeacherOrgId } from "@/services/auth.service";
import { offreDuCoursDe } from "@/services/acces.service";

/**
 * CE QU'UNE CLASSE DU COURS OUVRE À SES ÉLÈVES, DIT À L'ENSEIGNANT (audit UX du 29 octobre
 * 2026, P1-1). La règle est celle de l'élève (services/cours.service.ts, `coursOuvert`) :
 * le chapitre libre pour tous ; sous Campus, tout ; sous Classe ou Programme, les chapitres
 * du parcours de la classe (ou que regroupe son parcours de formation, le BUT), et tout le cours
 * pour une classe héritée sans parcours ; sans
 * offre de l'arène en cours, le chapitre libre seul. Écrite ici en fonction pure, pour que
 * la page de la classe marque d'un cadenas, AVANT que les élèves ne s'y heurtent, chaque
 * chapitre qui leur restera fermé.
 */
export type OffreDuCours = "classe" | "programme" | "campus" | null;

export function chapitreOuvertALaClasse(
  offre: OffreDuCours,
  classe: { parcours: string | null; heritee: boolean },
  chapitre: Pick<Chapitre, "libre"> & OuvrablePar,
  attribues: Attributions = null,
): boolean {
  if (chapitre.libre) return true;
  if (!offre) return false;
  if (!dansLesAttributions(attribues, chapitre)) return false;
  if (offre === "campus") return true;
  return (classe.parcours !== null && parcoursQuiOuvrent(chapitre).includes(classe.parcours)) || (classe.heritee && classe.parcours === null);
}

/**
 * LES PARCOURS QUE L'ADMIN A ATTRIBUÉS (décision du propriétaire, novembre 2026 ; migration
 * 0056) : null quand aucune liste ne s'applique, et l'offre seule décide. Une liste RESTREINT
 * l'offre, elle n'ouvre jamais plus qu'elle. La liste d'un enseignant l'emporte sur celle de
 * son établissement (services/attributions.service.ts, `parcoursAttribues`).
 */
export type Attributions = readonly string[] | null;

/** Le chapitre (ou le cas) tombe-t-il dans les parcours attribués ? Sans liste, toujours. */
export function dansLesAttributions(attribues: Attributions, chapitre: OuvrablePar): boolean {
  return attribues === null || parcoursQuiOuvrent(chapitre).some((p) => attribues.includes(p));
}

/** Un parcours qu'une classe choisit est-il dans les attributions ? Sans liste, oui. */
export const parcoursAttribue = (attribues: Attributions, parcours: string): boolean =>
  attribues === null || attribues.includes(parcours);

/**
 * L'OFFRE CLASSE OUVRE UN SEUL PARCOURS (décision du propriétaire, 10 novembre 2026 ; audit du même
 * jour, produit P1-2). Un enseignant sous Classe créait autant de classes qu'il voulait, chacune
 * sur son parcours : une licence Classe ouvrait tout le cours. Il crée toujours plusieurs classes,
 * mais toutes sur le même parcours :
 *  · celui de sa première classe (dans l'ordre de création) qui tombe dans les attributions de
 *    l'admin, ou dans tout le cours sans attribution ;
 *  · sans telle classe, le parcours que l'admin lui a attribué quand il n'en a attribué qu'un ;
 *  · sinon aucun n'est encore fixé (null) : la première classe le choisit, parmi les attribués.
 * Une classe héritée sans parcours ne fixe rien. RIEN N'EST FERMÉ : une classe déjà créée sur un
 * autre parcours garde ses chapitres ; la règle ne porte que sur les classes à venir et sur le
 * parcours qu'une classe héritée choisit. Programme et Campus ne sont pas limités ici.
 */
export function parcoursDeLaLicenceClasse(
  attribues: Attributions,
  /** Les parcours des classes de l'enseignant, dans l'ordre où il les a créées. */
  parcoursDesClasses: readonly (string | null)[],
): string | null {
  const premier = parcoursDesClasses.find((p): p is string => p !== null && parcoursAttribue(attribues, p));
  if (premier) return premier;
  return attribues !== null && attribues.length === 1 ? attribues[0]! : null;
}

/** La phrase du formulaire de création, sous l'offre Classe : le parcours fixé, ou celui à fixer. */
export function unParcoursParLicenceClasse(offres: { classe: string; programme: string; campus: string }, parcours: string | null): string {
  const autres = `Les offres ${offres.programme} et ${offres.campus} ouvrent plusieurs parcours.`;
  return parcours
    ? `Avec l'offre ${offres.classe}, toutes vos classes du cours suivent le même parcours, celui de votre licence : « ${parcours} ». ${autres}`
    : `Avec l'offre ${offres.classe}, toutes vos classes du cours suivront le même parcours : celui que vous choisissez pour cette première classe. ${autres}`;
}

/**
 * LA LIBÉRATION CHAPITRE PAR CHAPITRE (décision du propriétaire, novembre 2026 ; migration
 * 0056). Une classe en « tout » ouvre à ses élèves tout ce que l'offre permet ; une classe en
 * « chapitre », les seuls chapitres que l'enseignant a libérés, avec le chapitre libre. Un cas
 * pratique suit les chapitres qu'il reprend : il s'ouvre quand ils sont tous libérés.
 */
export type ModeDeLiberation = "tout" | "chapitre";

export function libereALaClasse(
  liberation: ModeDeLiberation,
  liberes: ReadonlySet<string>,
  chapitre: Pick<Chapitre, "libre"> & { code: string; reprend?: readonly string[] },
): boolean {
  if (chapitre.libre || liberation === "tout") return true;
  const codes = chapitre.reprend?.length ? chapitre.reprend : [chapitre.code];
  return codes.every((c) => liberes.has(c));
}

/** L'offre de l'arène en cours de l'établissement de l'enseignant ; null sans offre. */
export async function offreDuCoursDeLEnseignant(enseignantId: string): Promise<OffreDuCours> {
  const org = await getTeacherOrgId(enseignantId);
  return org ? offreDuCoursDe(org) : null;
}

/** La phrase dite à la création d'une classe sans offre, et sur sa page tant qu'elle n'en a pas. */
export const classeSansOffre = (chapitreLibre: string): string =>
  `Sans offre en cours, une classe du cours n'ouvre à vos élèves que le chapitre libre, « ${chapitreLibre} », et son cas pratique ; les autres chapitres leur restent fermés.`;
