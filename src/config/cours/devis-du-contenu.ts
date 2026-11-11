import { formationDuParcours, parcoursDuDiplome, parcoursProposeAChoisir } from "./parcours-a-choisir";
import { parcoursQuiOuvrent, type OuvrablePar } from "./parcours-de-formation";

/**
 * LE PARCOURS D'UNE DEMANDE VENUE D'UN CONTENU RÉSERVÉ (un chapitre, un cas pratique, une enquête, un
 * bureau, un scénario) : parmi les parcours proposés qui l'ouvrent (`parcoursQuiOuvrent`), celui du
 * diplôme d'où l'on vient (`?diplome=` de la page). Le cours de ce diplôme d'abord (décision du
 * propriétaire, 11 novembre 2026 : depuis la page du BTS CG, « L'analyse des écarts » préremplissait le
 * contrôle de gestion et « Acheter avant la clôture » la comptabilité générale), sinon un parcours qui
 * suit ce diplôme ; sans diplôme, le sien. Aucun si aucun parcours proposé ne l'ouvre (une formation
 * retirée).
 */
export function parcoursDuContenu(contenu: OuvrablePar, diplome?: string | null): string | null {
  const candidats = parcoursQuiOuvrent(contenu).filter(parcoursProposeAChoisir);
  if (diplome) {
    const leCours = parcoursDuDiplome(diplome);
    if (leCours && candidats.includes(leCours)) return leCours;
    const duDiplome = candidats.find((p) => p === diplome || formationDuParcours(p) === diplome);
    if (duDiplome) return duDiplome;
  }
  return candidats[0] ?? null;
}
