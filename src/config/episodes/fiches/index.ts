/**
 * LE REGISTRE DES FICHES ENSEIGNANT : une fiche par épisode joué en classe,
 * dans l'ordre des épisodes. Les épisodes de contrôle de gestion et de
 * finance (31 à 40) ont été les premiers à en avoir une : la notion du cours
 * y est le piège de la décision, et le calcul de la semaine 1 se corrige
 * comme un exercice. Ceux de stratégie (41 à 48) suivent, pour des étudiants
 * de licence et de master et des formations de dirigeants.
 *
 * LES DÉMONSTRATIONS ONT AUSSI LEUR FICHE. Décision du propriétaire (octobre
 * 2026) : « fiche séance sur la démo ». Les cinq épisodes de démonstration de
 * la Découverte (`EPISODES_DE_DEMO`, config/episodes/demos.ts), un par métier,
 * sont ceux qu'un enseignant peut jouer en classe sans licence : chacun a sa
 * fiche, au même format que les autres, rangée à son numéro (5, 58, 68, 82 et
 * 102).
 */
import type { FicheEnseignant } from "./types";
import { FICHE as CLIENT_QUI_S_EN_VA } from "./client-qui-s-en-va";
import { FICHE as COMMANDE_A_PRIX_CASSE } from "./commande-a-prix-casse";
import { FICHE as PRODUIT_DEFICITAIRE } from "./produit-deficitaire";
import { FICHE as FAIRE_OU_FAIRE_FAIRE } from "./faire-ou-faire-faire";
import { FICHE as SEUIL_QUI_BOUGE } from "./seuil-qui-bouge";
import { FICHE as ECARTS_DU_BUDGET } from "./ecarts-du-budget";
import { FICHE as ATELIER_SATURE } from "./atelier-sature";
import { FICHE as INVESTISSEMENT_A_CHOISIR } from "./investissement-a-choisir";
import { FICHE as CROISSANCE_A_FINANCER } from "./croissance-a-financer";
import { FICHE as LOUER_OU_ACHETER } from "./louer-ou-acheter";
import { FICHE as CLIENT_A_RISQUE } from "./client-a-risque";
import { FICHE as DISCOUNTER_QUI_ARRIVE } from "./discounter-qui-arrive";
import { FICHE as CONCURRENT_A_RACHETER } from "./concurrent-a-racheter";
import { FICHE as MARCHE_QUI_S_OUVRE } from "./marche-qui-s-ouvre";
import { FICHE as FABRICANT_EN_DIRECT } from "./fabricant-en-direct";
import { FICHE as PROJET_A_ARRETER } from "./projet-a-arreter";
import { FICHE as RESEAU_A_REDESSINER } from "./reseau-a-redessiner";
import { FICHE as PARI_DU_REEMPLOI } from "./pari-du-reemploi";
import { FICHE as GRAND_COMPTE_EXCLUSIF } from "./grand-compte-exclusif";
import { FICHE as BRIGADE_A_BOUT } from "./brigade-a-bout";
import { FICHE as CLIENT_QUI_EN_DEMANDE_PLUS } from "./client-qui-en-demande-plus";
import { FICHE as LITS_VIDES } from "./lits-vides";
import { FICHE as PROMOTION_QUI_COUTE } from "./promotion-qui-coute";

export type { FicheEnseignant } from "./types";

export const FICHES: readonly FicheEnseignant[] = [
  CLIENT_QUI_S_EN_VA,
  COMMANDE_A_PRIX_CASSE,
  PRODUIT_DEFICITAIRE,
  FAIRE_OU_FAIRE_FAIRE,
  SEUIL_QUI_BOUGE,
  ECARTS_DU_BUDGET,
  ATELIER_SATURE,
  INVESTISSEMENT_A_CHOISIR,
  CROISSANCE_A_FINANCER,
  LOUER_OU_ACHETER,
  CLIENT_A_RISQUE,
  DISCOUNTER_QUI_ARRIVE,
  CONCURRENT_A_RACHETER,
  MARCHE_QUI_S_OUVRE,
  FABRICANT_EN_DIRECT,
  PROJET_A_ARRETER,
  RESEAU_A_REDESSINER,
  PARI_DU_REEMPLOI,
  GRAND_COMPTE_EXCLUSIF,
  BRIGADE_A_BOUT,
  CLIENT_QUI_EN_DEMANDE_PLUS,
  LITS_VIDES,
  PROMOTION_QUI_COUTE,
];

export const ficheParCode = (code: string): FicheEnseignant | undefined =>
  FICHES.find((f) => f.code === code);

/** Le hasard que toute la classe joue : le même que celui du débrief des entreprises. */
export { hasardDuDebrief as hasardDeLaClasse, lienDuDebrief as lienDeLaClasse } from "../debrief";
