import type { Chapitre } from "@/config/cours/types";
import { getTeacherOrgId } from "@/services/auth.service";
import { offreDuCoursDe } from "@/services/acces.service";

/**
 * CE QU'UNE CLASSE DU COURS OUVRE À SES ÉLÈVES, DIT À L'ENSEIGNANT (audit UX du 29 octobre
 * 2026, P1-1). La règle est celle de l'élève (services/cours.service.ts, `coursOuvert`) :
 * le chapitre libre pour tous ; sous Campus, tout ; sous Classe ou Programme, les chapitres
 * du parcours de la classe, et tout le cours pour une classe héritée sans parcours ; sans
 * offre de l'arène en cours, le chapitre libre seul. Écrite ici en fonction pure, pour que
 * la page de la classe marque d'un cadenas, AVANT que les élèves ne s'y heurtent, chaque
 * chapitre qui leur restera fermé.
 */
export type OffreDuCours = "classe" | "programme" | "campus" | null;

export function chapitreOuvertALaClasse(
  offre: OffreDuCours,
  classe: { parcours: string | null; heritee: boolean },
  chapitre: Pick<Chapitre, "libre" | "parcours">,
): boolean {
  if (chapitre.libre) return true;
  if (!offre) return false;
  if (offre === "campus") return true;
  return classe.parcours === chapitre.parcours || (classe.heritee && classe.parcours === null);
}

/** L'offre de l'arène en cours de l'établissement de l'enseignant ; null sans offre. */
export async function offreDuCoursDeLEnseignant(enseignantId: string): Promise<OffreDuCours> {
  const org = await getTeacherOrgId(enseignantId);
  return org ? offreDuCoursDe(org) : null;
}

/** La phrase dite à la création d'une classe sans offre, et sur sa page tant qu'elle n'en a pas. */
export const classeSansOffre = (chapitreLibre: string): string =>
  `Sans offre en cours, une classe du cours n'ouvre à vos élèves que le chapitre libre, « ${chapitreLibre} », et son cas pratique ; les autres chapitres leur restent fermés.`;
