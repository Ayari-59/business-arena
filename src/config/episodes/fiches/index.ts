/**
 * LE REGISTRE DES FICHES ENSEIGNANT : une fiche par épisode joué en classe,
 * dans l'ordre des épisodes. Les épisodes de contrôle de gestion et de
 * finance (31 à 40) sont les premiers à en avoir une : la notion du cours y
 * est le piège de la décision, et le calcul de la semaine 1 se corrige comme
 * un exercice.
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
];

export const ficheParCode = (code: string): FicheEnseignant | undefined =>
  FICHES.find((f) => f.code === code);

/** Le hasard que toute la classe joue : le même que celui du débrief des entreprises. */
export const HASARD_DE_LA_CLASSE = 12;

export const lienDeLaClasse = (code: string) =>
  `/entreprises/episode/${code}?hasard=${HASARD_DE_LA_CLASSE}`;
