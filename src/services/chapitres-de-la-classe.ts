import { ouvertAvecUnLibere, parcoursQuiOuvrent, type OuvrablePar } from "@/config/cours/parcours-de-formation";
import type { Chapitre } from "@/config/cours/types";
import { getTeacherOrgId } from "@/services/auth.service";
import { offreDuCoursDe } from "@/services/acces.service";

/**
 * CE QU'UNE CLASSE DU COURS OUVRE À SES ÉLÈVES, DIT À L'ENSEIGNANT (audit UX du 29 octobre
 * 2026, P1-1). La règle est celle de l'élève (services/cours.service.ts, `coursOuvert`) :
 * les chapitres libres pour tous (un par diplôme, config/cours/chapitres-libres.ts) ; sous Campus,
 * tout ; sous Classe ou Programme, les chapitres du parcours de la classe (ou que regroupe son
 * parcours de formation, le cours d'un diplôme), avec les prérequis qu'ils annoncent, et tout le
 * cours pour une classe héritée sans parcours ; sans offre de l'arène en cours, les chapitres libres
 * seuls. Écrite ici en fonction pure, pour que la page de la classe marque, AVANT que les élèves ne
 * s'y heurtent, chaque chapitre qui leur restera fermé.
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
  return chapitreDuParcoursDeLaClasse(classe.parcours, chapitre) || (classe.heritee && classe.parcours === null);
}

/**
 * LE CHAPITRE EST-IL DU PARCOURS DE LA CLASSE ? Le sien, un parcours de formation qui le regroupe, ou
 * un prérequis qu'un chapitre du parcours annonce (config/cours/parcours-de-formation.ts,
 * `parcoursQuiOuvrent`). Devant un chapitre fermé, l'élève lit « pas encore ouvert pour votre
 * classe » s'il l'est, « hors du programme de votre classe » sinon (components/cours/chapitre-reserve.tsx).
 */
export const chapitreDuParcoursDeLaClasse = (parcours: string | null | undefined, chapitre: OuvrablePar): boolean =>
  Boolean(parcours) && parcoursQuiOuvrent(chapitre).includes(parcours!);

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
 *  · celui de sa première classe CRÉÉE SOUS LA LICENCE (dans l'ordre de création) qui tombe dans les
 *    attributions de l'admin, ou dans tout le cours sans attribution ;
 *  · sans telle classe, le parcours que l'admin lui a attribué quand il n'en a attribué qu'un (celui
 *    du devis) ;
 *  · sinon aucun n'est encore fixé (null) : la première classe le choisit, parmi les attribués.
 * Une classe héritée sans parcours ne fixe rien. RIEN N'EST FERMÉ : une classe déjà créée sur un
 * autre parcours garde ses chapitres ; la règle ne porte que sur les classes à venir et sur le
 * parcours qu'une classe héritée choisit. Programme et Campus ne sont pas limités ici.
 *
 * LES CLASSES D'ESSAI NE COMPTENT PAS (décision du propriétaire, 11 novembre 2026 ; audit UX du même
 * jour, P1-4) : une classe créée sans offre, pendant l'essai, ou sous une licence d'avant, ne fixe
 * pas le parcours de la licence Classe en cours. Le service ne passe ici que les classes créées sous
 * elle (services/cours.service.ts, `parcoursImposeALEnseignant`). Une classe d'essai garde son
 * parcours et ce qu'il ouvre, comme toute classe déjà créée ; les parcours attribués au devis la
 * restreignent comme les autres (`dansLesAttributions`).
 */
export function parcoursDeLaLicenceClasse(
  attribues: Attributions,
  /** Les parcours des classes de l'enseignant créées sous la licence, dans l'ordre où il les a créées. */
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
    : `Avec l'offre ${offres.classe}, toutes vos classes du cours suivront le même parcours : celui que vous choisissez pour cette première classe créée sous la licence. Une classe créée pendant l'essai ne le fixe pas. ${autres}`;
}

/**
 * La phrase du formulaire de création sans offre (audit UX du 11 novembre 2026, P1-4 : la classe
 * d'essai fixait le parcours de la licence achetée ensuite, sans que rien ne le dise).
 */
export const parcoursDeLEssai = (offres: { classe: string; programme: string; campus: string }): string =>
  `Avec l'offre ${offres.classe} ou ${offres.programme}, la classe ouvre les chapitres de ce parcours ; avec l'offre ${offres.campus}, tous les chapitres. Une classe créée pendant l'essai ne fixe pas le parcours d'une offre ${offres.classe} : il se fixe au devis, ou par votre première classe créée sous la licence.`;

/**
 * LA LIBÉRATION CHAPITRE PAR CHAPITRE (décision du propriétaire, novembre 2026 ; migration
 * 0056). Une classe en « tout » ouvre à ses élèves tout ce que l'offre permet ; une classe en
 * « chapitre », les seuls chapitres que l'enseignant a libérés, avec les chapitres libres. Un cas
 * pratique suit les chapitres qu'il reprend : il s'ouvre quand ils sont tous libérés.
 *
 * UN CHAPITRE LIBÉRÉ LIBÈRE SES PRÉREQUIS (décision du propriétaire, 11 novembre 2026) : les
 * prérequis qu'il annonce, et les leurs, s'ouvrent avec lui (config/cours/parcours-de-formation.ts,
 * `ouvertAvecUnLibere`).
 */
export type ModeDeLiberation = "tout" | "chapitre";

export function libereALaClasse(
  liberation: ModeDeLiberation,
  liberes: ReadonlySet<string>,
  chapitre: Pick<Chapitre, "libre"> & { code: string; reprend?: readonly string[] },
): boolean {
  if (chapitre.libre || liberation === "tout") return true;
  const codes = chapitre.reprend?.length ? chapitre.reprend : [chapitre.code];
  return codes.every((c) => liberes.has(c) || ouvertAvecUnLibere(liberes, c) !== null);
}

/** L'offre de l'arène en cours de l'établissement de l'enseignant ; null sans offre. */
export async function offreDuCoursDeLEnseignant(enseignantId: string): Promise<OffreDuCours> {
  const org = await getTeacherOrgId(enseignantId);
  return org ? offreDuCoursDe(org) : null;
}

/**
 * La phrase dite à la création d'une classe sans offre, et sur sa page tant qu'elle n'en a pas. Sur
 * la page de la classe, elle nomme le chapitre libre de son diplôme, quand son parcours en suit un.
 */
export const classeSansOffre = (chapitreLibreDeLaClasse?: string | null): string =>
  `Sans offre en cours, une classe du cours n'ouvre à vos élèves que les chapitres libres, un par diplôme, avec leur cas pratique${
    chapitreLibreDeLaClasse ? ` (pour cette classe, « ${chapitreLibreDeLaClasse} »)` : ""
  } ; les autres chapitres leur restent fermés.`;
