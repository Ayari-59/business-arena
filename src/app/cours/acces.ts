import type { OuvrablePar } from "@/config/cours/parcours-de-formation";
import type { Chapitre } from "@/config/cours/types";
import { getSession } from "@/lib/session";
import { getGuestUserId } from "@/lib/guest";
import { coursOuvert } from "@/services/cours.service";

/**
 * QUI PEUT OUVRIR UN CHAPITRE (décision du propriétaire, octobre 2026). Un chapitre libre
 * s'ouvre à tous (la Découverte ; un par diplôme, config/cours/chapitres-libres.ts) ; sous Campus, tous les chapitres ; sous Classe, ceux du
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

/**
 * LE DIAPORAMA D'UN CHAPITRE (décision du propriétaire, novembre 2026) : à l'enseignant seulement, ou à
 * l'administrateur de son établissement, quand la licence de cet établissement lui ouvre ce chapitre. La
 * règle est celle de la page (coursOuvert, du côté de l'enseignant) : jamais par la classe d'un élève,
 * jamais sans compte. Le diaporama est un outil de la licence : un chapitre libre ne l'ouvre pas sans
 * elle. La page s'en sert pour montrer le bouton, la route (./[chapitre]/diaporama/route.ts) pour
 * servir le fichier : le bouton caché ne protège rien.
 */
export async function diaporamaPermis(chapitre: OuvrablePar): Promise<boolean> {
  const session = await getSession();
  if (!session) return false;
  return coursOuvert({ enseignant: session.userId }, { ...chapitre, libre: false });
}
