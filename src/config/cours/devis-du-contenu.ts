import { formationDuParcours, parcoursProposeAChoisir } from "./parcours-a-choisir";
import { parcoursQuiOuvrent, type OuvrablePar } from "./parcours-de-formation";

/**
 * LE PARCOURS D'UNE DEMANDE VENUE D'UN CONTENU RÉSERVÉ (un chapitre, un cas pratique, une enquête, un
 * bureau, un scénario) : parmi les parcours proposés qui l'ouvrent (`parcoursQuiOuvrent`), celui du
 * diplôme d'où l'on vient (`?diplome=` de la page), sinon le sien. Aucun si aucun parcours proposé ne
 * l'ouvre (une formation retirée).
 */
export function parcoursDuContenu(contenu: OuvrablePar, diplome?: string | null): string | null {
  const candidats = parcoursQuiOuvrent(contenu).filter(parcoursProposeAChoisir);
  if (diplome) {
    const duDiplome = candidats.find((p) => p === diplome || formationDuParcours(p) === diplome);
    if (duDiplome) return duDiplome;
  }
  return candidats[0] ?? null;
}
