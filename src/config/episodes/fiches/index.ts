/**
 * LE REGISTRE DES FICHES ENSEIGNANT : une fiche par épisode joué en classe,
 * dans l'ordre des épisodes. Les épisodes de contrôle de gestion et de
 * finance (31 à 40) ont été les premiers à en avoir une : la notion du cours
 * y est le piège de la décision, et le calcul de la semaine 1 se corrige
 * comme un exercice. Ceux de stratégie (41 à 48) suivent, pour des étudiants
 * de licence et de master et des formations de dirigeants.
 */
import type { FicheEnseignant } from "./types";
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

export type { FicheEnseignant } from "./types";

export const FICHES: readonly FicheEnseignant[] = [
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
];

export const ficheParCode = (code: string): FicheEnseignant | undefined =>
  FICHES.find((f) => f.code === code);

/** Le hasard que toute la classe joue : le même que celui du débrief des entreprises. */
export { hasardDuDebrief as hasardDeLaClasse, lienDuDebrief as lienDeLaClasse } from "../debrief";
