/**
 * LES ÉPISODES MANAGER, dans l'ordre où on les propose.
 *
 * Un épisode s'ajoute ici et nulle part ailleurs : la liste, la page de jeu,
 * le tableau de bord, la courbe et le bilan le lisent de ce registre.
 */
import type { Episode } from "@/config/episodes/types";
import { EPISODE_TRIMESTRE } from "./trimestre-qui-derape";
import { EPISODE_EQUIPE } from "./equipe-qui-s-epuise";
import { EPISODE_DEPOT } from "./depot-qui-deborde";
import { EPISODE_BUDGET } from "./budget-qui-ne-tient-pas";
import { EPISODE_PROJET } from "./projet-qui-glisse";
import { EPISODE_ACHATS } from "./fournisseur-qui-augmente";
import { EPISODE_RECRUTEMENT } from "./poste-qui-reste-vide";
import { EPISODE_QUALITE } from "./reclamation-qui-enfle";
import { EPISODE_SECURITE } from "./quai-dangereux";
import { EPISODE_CHANGEMENT } from "./reorganisation-qui-coince";
import { EPISODE_TRESORERIE } from "./tresorerie-qui-fond";
import { EPISODE_LANCEMENT } from "./agence-qui-demarre";
import { EPISODE_CRISE } from "./panne-qui-paralyse";
import { EPISODE_PERFORMANCE } from "./collaborateur-qui-decroche";
import { EPISODE_INDICATEURS } from "./indicateur-qui-ment";
import { EPISODE_APPEL_OFFRES } from "./appel-d-offres";
import { EPISODE_PRIX } from "./prix-qui-ne-passe-plus";
import { EPISODE_AGENDA } from "./agenda-qui-deborde";
import { EPISODE_DIALOGUE_SOCIAL } from "./preavis-de-greve";
import { EPISODE_FIDELISATION } from "./client-qui-s-en-va";
import { EPISODE_TRANSPORT } from "./tournees-qui-debordent";
import { EPISODE_NUMERIQUE } from "./site-qui-ne-vend-pas";
import { EPISODE_TALENTS } from "./talent-qui-veut-partir";
import { EPISODE_COMPETENCES } from "./competences-qui-manquent";
import { EPISODE_ENERGIE } from "./facture-qui-flambe";
import { EPISODE_CONFORMITE } from "./controle-qui-s-annonce";
import { EPISODE_FUSION } from "./fusion-des-agences";
import { EPISODE_INNOVATION } from "./nouveau-service";
import { EPISODE_DISTANCE } from "./equipe-dispersee";
import { EPISODE_PRISE_DE_POSTE } from "./cent-premiers-jours";

export const EPISODES: readonly Episode[] = [
  EPISODE_TRIMESTRE,
  EPISODE_EQUIPE,
  EPISODE_DEPOT,
  EPISODE_BUDGET,
  EPISODE_PROJET,
  EPISODE_ACHATS,
  EPISODE_RECRUTEMENT,
  EPISODE_QUALITE,
  EPISODE_SECURITE,
  EPISODE_CHANGEMENT,
  EPISODE_TRESORERIE,
  EPISODE_LANCEMENT,
  EPISODE_CRISE,
  EPISODE_PERFORMANCE,
  EPISODE_INDICATEURS,
  EPISODE_APPEL_OFFRES,
  EPISODE_PRIX,
  EPISODE_AGENDA,
  EPISODE_DIALOGUE_SOCIAL,
  EPISODE_FIDELISATION,
  EPISODE_TRANSPORT,
  EPISODE_NUMERIQUE,
  EPISODE_TALENTS,
  EPISODE_COMPETENCES,
  EPISODE_ENERGIE,
  EPISODE_CONFORMITE,
  EPISODE_FUSION,
  EPISODE_INNOVATION,
  EPISODE_DISTANCE,
  EPISODE_PRISE_DE_POSTE,
];

export const episodeParCode = (code: string): Episode | undefined =>
  EPISODES.find((e) => e.code === code);
