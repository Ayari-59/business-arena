import { formationParCode } from "../formations";
import { formationDuParcours, PARCOURS_PROPOSES_A_CHOISIR, parcoursProposeAChoisir } from "./parcours-a-choisir";

/**
 * LE DEVIS DEMANDE LE DIPLÔME OU LE PARCOURS (audit produit du 10 novembre 2026, P1-4).
 *
 * C'est le parcours d'une classe qui ouvre ses chapitres (sous Classe, un seul pour toutes les classes
 * de l'enseignant), et l'admin attribue des parcours par établissement ou par enseignant
 * (services/attributions.service.ts). Le devis demandait une entreprise et un niveau de l'arène, jamais
 * le parcours : le vendeur ne savait pas quoi attribuer.
 *
 * LA LISTE EST CELLE QUE L'ENSEIGNANT VOIT EN CRÉANT SA CLASSE (/teacher/cours) : les parcours qu'une
 * classe peut choisir aujourd'hui, dans leur ordre et sous leur nom (`PARCOURS_PROPOSES_A_CHOISIR`).
 * La demande enregistre le code ; l'admin et le courriel lisent le nom (`titreDuParcours`).
 *
 * CE MODULE NE TIRE PAS LE REGISTRE DU COURS (./parcours-a-choisir.ts, sans les chapitres) : la page
 * du devis, son action et le service des devis le lisent sans charger tous les chapitres (une garde le
 * tient : tests/architecture/devis-du-diplome.test.ts). Le serveur passe la liste au formulaire, qui
 * ne l'importe pas. Le parcours d'un contenu réservé, qui lit les chapitres : ./devis-du-contenu.ts.
 */

/** Les parcours du devis : code et nom, rien d'autre ne part au navigateur. */
export const PARCOURS_DU_DEVIS: readonly { code: string; titre: string }[] = PARCOURS_PROPOSES_A_CHOISIR.map(({ code, titre }) => ({
  code,
  titre,
}));

/**
 * LE PARCOURS QUE LE DEVIS PRÉREMPLIT. `parcours` (`?parcours=`) : un parcours qu'une classe peut
 * choisir, tel quel ; c'est ce que portent les liens du cours. Sinon `diplome` (`?diplome=`) : le code
 * d'une formation (config/formations.ts), traduit en parcours quand elle n'en a qu'un parmi les
 * parcours proposés ; le bac STMG en a cinq, le BTS CG aucun à son nom : l'enseignant choisit, rien
 * n'est deviné. Un diplôme qui n'est pas une formation, mais un parcours proposé, vaut ce parcours.
 * Toute autre valeur est ignorée.
 */
export function parcoursDuDevis(parcours: unknown, diplome?: unknown): string | null {
  if (typeof parcours === "string" && parcoursProposeAChoisir(parcours)) return parcours;
  if (typeof diplome !== "string" || diplome === "") return null;
  if (formationParCode(diplome)) {
    const siens = PARCOURS_PROPOSES_A_CHOISIR.filter((p) => formationDuParcours(p.code) === diplome);
    return siens.length === 1 ? siens[0]!.code : null;
  }
  return parcoursProposeAChoisir(diplome) ? diplome : null;
}
