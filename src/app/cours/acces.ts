import type { Chapitre } from "@/config/cours/types";
import { getSession } from "@/lib/session";
import { getGuestUserId } from "@/lib/guest";
import { classeSousLicence } from "@/services/cours.service";
import { unCompteSousLicence } from "@/services/acces.service";

/**
 * QUI PEUT OUVRIR UN CHAPITRE. Un chapitre libre s'ouvre à tous ; les autres demandent
 * un compte d'enseignant rattaché à un établissement sous licence, ou, pour l'élève,
 * une classe dont l'enseignant l'est.
 *
 * La page d'un chapitre et la lecture de ses simulations (/api/cours/lecture) passent
 * toutes deux par ici : le contenu d'un chapitre réservé ne part au navigateur qu'après
 * ce contrôle (pedagogy/cours/chapitre-servi.ts).
 */
export async function chapitreOuvert(chapitre: Pick<Chapitre, "libre">): Promise<boolean> {
  if (chapitre.libre) return true;
  // L'enseignant par son compte, l'élève par sa classe : l'un ou l'autre sous licence.
  const [session, invite] = await Promise.all([getSession(), getGuestUserId()]);
  return (session ? await unCompteSousLicence([session.userId]) : false) || (invite ? await classeSousLicence(invite) : false);
}
