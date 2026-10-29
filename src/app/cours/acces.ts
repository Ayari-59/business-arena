import type { OuvrablePar } from "@/config/cours/parcours-de-formation";
import type { Chapitre } from "@/config/cours/types";
import { getSession } from "@/lib/session";
import { getGuestUserId } from "@/lib/guest";
import { coursOuvert } from "@/services/cours.service";

/**
 * QUI PEUT OUVRIR UN CHAPITRE (décision du propriétaire, octobre 2026). Un chapitre libre
 * s'ouvre à tous (la Découverte) ; sous Campus, tous les chapitres ; sous Classe, ceux du
 * parcours de la classe ; sous Programme, ceux des parcours des classes de l'établissement
 * (la règle : services/cours.service.ts, coursOuvert). L'enseignant par son compte, l'élève
 * par sa classe.
 *
 * La page d'un chapitre et la lecture de ses simulations (/api/cours/lecture) passent
 * toutes deux par ici : le contenu d'un chapitre réservé ne part au navigateur qu'après
 * ce contrôle (pedagogy/cours/chapitre-servi.ts).
 */
export async function chapitreOuvert(chapitre: Pick<Chapitre, "libre"> & OuvrablePar): Promise<boolean> {
  if (chapitre.libre) return true;
  const [session, invite] = await Promise.all([getSession(), getGuestUserId()]);
  return coursOuvert({ enseignant: session?.userId ?? null, eleve: invite }, chapitre);
}
